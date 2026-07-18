const test = require("node:test");
const assert = require("node:assert/strict");

const { createRendererLoop } = require("../rendererLoop");

function createHarness(initialHidden = false, onRender) {
  let nextFrameId = 1;
  const pendingFrames = new Map();
  const frameCallbacks = new Map();
  const requestedFrameIds = [];
  const cancelledFrameIds = [];
  const renderedAt = [];
  let clearCount = 0;
  let timingResetCount = 0;
  let loop;

  loop = createRendererLoop({
    initialHidden,
    requestFrame(callback) {
      const id = nextFrameId++;
      requestedFrameIds.push(id);
      pendingFrames.set(id, callback);
      frameCallbacks.set(id, callback);
      return id;
    },
    cancelFrame(id) {
      cancelledFrameIds.push(id);
      pendingFrames.delete(id);
    },
    renderFrame(now) {
      renderedAt.push(now);
      if (onRender) onRender(loop);
    },
    clearCanvas() {
      clearCount += 1;
    },
    resetTiming() {
      timingResetCount += 1;
    }
  });

  return {
    loop,
    pendingFrames,
    frameCallbacks,
    requestedFrameIds,
    cancelledFrameIds,
    renderedAt,
    get clearCount() { return clearCount; },
    get timingResetCount() { return timingResetCount; },
    runFrame(id, now) {
      const callback = pendingFrames.get(id);
      assert.ok(callback, `expected frame ${id} to be pending`);
      pendingFrames.delete(id);
      callback(now);
    }
  };
}

test("visible rendering starts once and keeps one frame pending", () => {
  const harness = createHarness();
  harness.loop.start();
  harness.loop.start();

  assert.deepEqual(harness.requestedFrameIds, [1]);
  harness.runFrame(1, 100);
  assert.deepEqual(harness.renderedAt, [100]);
  assert.deepEqual(harness.requestedFrameIds, [1, 2]);
  assert.equal(harness.pendingFrames.size, 1);
});

test("hiding cancels rendering and clears exactly once", () => {
  const harness = createHarness();
  harness.loop.start();
  harness.loop.setHidden(true);
  harness.loop.setHidden(true);

  assert.deepEqual(harness.cancelledFrameIds, [1]);
  assert.equal(harness.clearCount, 1);
  assert.equal(harness.pendingFrames.size, 0);
});

test("showing resets timing and restarts rendering exactly once", () => {
  const harness = createHarness();
  harness.loop.start();
  harness.loop.setHidden(true);
  harness.loop.setHidden(false);
  harness.loop.setHidden(false);

  assert.equal(harness.timingResetCount, 1);
  assert.deepEqual(harness.requestedFrameIds, [1, 2]);
  assert.equal(harness.pendingFrames.size, 1);
});

test("a visualizer that starts hidden remains idle until shown", () => {
  const harness = createHarness(true);
  harness.loop.start();

  assert.equal(harness.pendingFrames.size, 0);
  harness.loop.setHidden(false);
  assert.equal(harness.timingResetCount, 1);
  assert.deepEqual(harness.requestedFrameIds, [1]);
});

test("rapid toggles leave at most one pending frame", () => {
  const harness = createHarness();
  harness.loop.start();
  harness.loop.setHidden(true);
  harness.loop.setHidden(false);
  harness.loop.setHidden(true);
  harness.loop.setHidden(false);

  assert.deepEqual([...harness.pendingFrames.keys()], [3]);
  assert.deepEqual(harness.cancelledFrameIds, [1, 2]);
  assert.equal(harness.clearCount, 2);
  assert.equal(harness.timingResetCount, 2);
});

test("a stale cancelled callback cannot create a duplicate loop", () => {
  const harness = createHarness();
  harness.loop.start();
  const staleCallback = harness.frameCallbacks.get(1);

  harness.loop.setHidden(true);
  harness.loop.setHidden(false);
  staleCallback(50);

  assert.deepEqual(harness.renderedAt, []);
  assert.deepEqual(harness.requestedFrameIds, [1, 2]);
  assert.deepEqual([...harness.pendingFrames.keys()], [2]);
});

test("hiding while a callback runs prevents rescheduling", () => {
  const harness = createHarness(false, (loop) => loop.setHidden(true));
  harness.loop.start();
  harness.runFrame(1, 42);

  assert.deepEqual(harness.renderedAt, [42]);
  assert.equal(harness.pendingFrames.size, 0);
  assert.equal(harness.clearCount, 1);
});

test("cleanup cancels the active frame and prevents restart", () => {
  const harness = createHarness();
  harness.loop.start();
  harness.loop.destroy();
  harness.loop.destroy();
  harness.loop.setHidden(true);
  harness.loop.setHidden(false);
  harness.loop.start();

  assert.deepEqual(harness.cancelledFrameIds, [1]);
  assert.equal(harness.pendingFrames.size, 0);
  assert.deepEqual(harness.requestedFrameIds, [1]);
});
