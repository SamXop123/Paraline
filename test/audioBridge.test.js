/**
 * audioBridge.test.js
 *
 * Tests for the stdout overflow logic in audioBridge.js.
 * Uses the exported _createStdoutHandler factory so no Electron mocking is needed.
 */

const test = require("node:test");
const assert = require("node:assert");
const { EventEmitter } = require("node:events");

// _createStdoutHandler is a pure factory — no Electron, spawn, or fs involved.
// We need to stub 'electron' so the top-level require in audioBridge.js doesn't crash.
const Module = require("module");
const orig = Module.prototype.require;
const realFs = orig.call(module, "fs");
const realChildProcess = orig.call(module, "child_process");
let fakeHelperExists = false;
let fakeSpawn = null;

Module.prototype.require = function (id) {
  if (id === "electron") return { app: { getAppPath: () => "/fake" } };
  if (id === "fs") {
    return new Proxy(realFs, {
      get(target, prop) {
        if (prop === "existsSync") {
          return (...args) => fakeHelperExists || target.existsSync(...args);
        }

        return target[prop];
      }
    });
  }
  if (id === "child_process") {
    return new Proxy(realChildProcess, {
      get(target, prop) {
        if (prop === "spawn") {
          return (...args) => fakeSpawn ? fakeSpawn(...args) : target.spawn(...args);
        }

        return target[prop];
      }
    });
  }

  return orig.apply(this, arguments);
};

const { createAudioBridge, _createStdoutHandler } = require("../audioBridge");

const MAX_BYTES = 64 * 1024;        // mirrors audioBridge default
const BIG = Buffer.alloc(MAX_BYTES + 1, "x");   // always triggers overflow
const SMALL = Buffer.from(JSON.stringify({ type: "level", value: 0.5 }) + "\n");

// ---------------------------------------------------------------------------
// Test 1 — single overflow calls onOverflow and NOT onKill
// ---------------------------------------------------------------------------
test("_createStdoutHandler - first overflow calls onOverflow, not onKill", () => {
  let overflowCalls = 0;
  let killCalls = 0;

  const h = _createStdoutHandler({
    maxBytes: MAX_BYTES,
    maxOverflows: 3,
    onOverflow: () => overflowCalls++,
    onKill:     () => killCalls++
  });

  h.handleChunk(BIG);

  assert.strictEqual(overflowCalls, 1, "onOverflow should be called once");
  assert.strictEqual(killCalls,     0, "onKill must NOT be called on first overflow");
  assert.strictEqual(h.getOverflowCount(), 1, "overflowCount should be 1");
});

// ---------------------------------------------------------------------------
// Test 2 — reaching maxOverflows calls onKill and resets counter to 0
// ---------------------------------------------------------------------------
test("_createStdoutHandler - 3 consecutive overflows call onKill and reset count", () => {
  let killCalls = 0;

  const h = _createStdoutHandler({
    maxBytes: MAX_BYTES,
    maxOverflows: 3,
    onKill: () => killCalls++
  });

  h.handleChunk(BIG);   // overflow #1
  h.handleChunk(BIG);   // overflow #2
  h.handleChunk(BIG);   // overflow #3 → kill

  assert.strictEqual(killCalls, 1, "onKill should fire exactly once at overflow #3");
  assert.strictEqual(h.getOverflowCount(), 0, "overflowCount must reset to 0 after kill");
});

// ---------------------------------------------------------------------------
// Test 3 — valid chunk resets overflowCount to 0
// ---------------------------------------------------------------------------
test("_createStdoutHandler - valid chunk resets overflow counter", () => {
  const h = _createStdoutHandler({ maxBytes: MAX_BYTES, maxOverflows: 3 });

  h.handleChunk(BIG);   // overflow #1
  assert.strictEqual(h.getOverflowCount(), 1);

  h.handleChunk(SMALL); // valid data → reset
  assert.strictEqual(h.getOverflowCount(), 0, "Valid data should reset overflow counter to 0");
});

// ---------------------------------------------------------------------------
// Test 4 — valid lines are delivered to onLine, not silently dropped
// ---------------------------------------------------------------------------
test("_createStdoutHandler - valid JSON lines reach onLine callback", () => {
  const lines = [];
  const h = _createStdoutHandler({ maxBytes: MAX_BYTES, onLine: (l) => lines.push(l) });

  const payload = Buffer.from(
    JSON.stringify({ type: "level", value: 0.8 }) + "\n" +
    JSON.stringify({ type: "level", value: 0.3 }) + "\n"
  );
  h.handleChunk(payload);

  assert.strictEqual(lines.length, 2, "Both JSON lines should reach onLine");
  assert.ok(lines[0].includes("0.8"));
  assert.ok(lines[1].includes("0.3"));
});

// ---------------------------------------------------------------------------
// Test 5 — reset() clears buffer and overflowCount
// ---------------------------------------------------------------------------
test("_createStdoutHandler - reset() clears state", () => {
  const h = _createStdoutHandler({ maxBytes: MAX_BYTES, maxOverflows: 3 });

  h.handleChunk(BIG);   // overflowCount = 1
  h.reset();

  assert.strictEqual(h.getOverflowCount(), 0, "reset() should clear overflowCount");

  // After reset, the buffer should be empty so a valid small chunk is processed
  const lines = [];
  const h2 = _createStdoutHandler({ maxBytes: MAX_BYTES, onLine: (l) => lines.push(l) });
  h2.handleChunk(BIG);
  h2.reset();
  h2.handleChunk(SMALL);
  assert.strictEqual(lines.length, 1, "After reset, valid chunk should produce a line");
});

// ---------------------------------------------------------------------------
// Test 6 - stop() clears a pending crash retry timer
// ---------------------------------------------------------------------------
test("createAudioBridge - stop clears pending retry timer", () => {
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;
  const scheduledTimers = [];
  const spawnedProcesses = [];

  global.setTimeout = (callback, delay) => {
    const timer = { callback, delay, cleared: false };
    scheduledTimers.push(timer);
    return timer;
  };

  global.clearTimeout = (timer) => {
    if (timer) timer.cleared = true;
  };

  fakeHelperExists = true;
  fakeSpawn = () => {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => {
      proc.killed = true;
    };
    spawnedProcesses.push(proc);
    return proc;
  };

  try {
    const bridge = createAudioBridge(() => {});

    bridge.start();
    assert.strictEqual(spawnedProcesses.length, 1, "start() should spawn the helper once");

    spawnedProcesses[0].emit("exit", 1);
    assert.strictEqual(scheduledTimers.length, 1, "helper exit should schedule one retry");
    assert.strictEqual(scheduledTimers[0].cleared, false, "retry should be pending before stop()");

    bridge.stop();
    assert.strictEqual(scheduledTimers[0].cleared, true, "stop() should clear the pending retry");

    scheduledTimers[0].callback();
    assert.strictEqual(
      spawnedProcesses.length,
      1,
      "cleared retry callback must not restart the helper after stop()"
    );
  } finally {
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    fakeHelperExists = false;
    fakeSpawn = null;
  }
});
