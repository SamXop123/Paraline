const test = require("node:test");
const assert = require("node:assert");
const child_process = require("child_process");
const { createAudioBridge } = require("../linux/audioBridge");

test("Linux Audio Bridge - RMS calculation with silent buffer", () => {
  const mockProcess = {
    stdout: {
      on: (event, cb) => {
        if (event === "data") mockProcess.sendStdout = cb;
      }
    },
    stderr: {
      on: () => {}
    },
    on: () => {},
    kill: () => { mockProcess.killed = true; }
  };

  const origSpawn = child_process.spawn;
  const origExecSync = child_process.execSync;

  child_process.spawn = () => mockProcess;
  child_process.execSync = () => "/usr/bin/parec";

  let lastLevel = null;
  const bridge = createAudioBridge((level) => {
    lastLevel = level;
  });

  try {
    bridge.start();
    const chunk = Buffer.alloc(400); // 100 silent stereo frames
    mockProcess.sendStdout(chunk);
  } finally {
    bridge.stop();
    child_process.spawn = origSpawn;
    child_process.execSync = origExecSync;
  }
});

test("Linux Audio Bridge - RMS calculation math correctness", () => {
  const mockProcess = {
    stdout: {
      on: (event, cb) => {
        if (event === "data") mockProcess.sendStdout = cb;
      }
    },
    stderr: {
      on: () => {}
    },
    on: () => {},
    kill: () => { mockProcess.killed = true; }
  };

  const origSpawn = child_process.spawn;
  const origExecSync = child_process.execSync;

  child_process.spawn = () => mockProcess;
  child_process.execSync = () => "/usr/bin/parec";

  let levels = [];
  const bridge = createAudioBridge((level) => {
    levels.push(level);
  });

  bridge.start();

  const maxPositiveBuffer = Buffer.alloc(8); // 2 frames
  maxPositiveBuffer.writeInt16LE(32767, 0);
  maxPositiveBuffer.writeInt16LE(32767, 2);
  maxPositiveBuffer.writeInt16LE(32767, 4);
  maxPositiveBuffer.writeInt16LE(32767, 6);

  mockProcess.sendStdout(maxPositiveBuffer);

  return new Promise((resolve) => {
    setTimeout(() => {
      bridge.stop();
      child_process.spawn = origSpawn;
      child_process.execSync = origExecSync;

      assert.ok(levels.length > 0, "Should have calculated at least one level");
      assert.ok(levels[0] > 0.99 && levels[0] <= 1.0, `Max buffer should result in level ~1.0, got ${levels[0]}`);
      resolve();
    }, 50);
  });
});

test("Linux Audio Bridge - Decay logic on silence", () => {
  const mockProcess = {
    stdout: {
      on: (event, cb) => {
        if (event === "data") mockProcess.sendStdout = cb;
      }
    },
    stderr: {
      on: () => {}
    },
    on: () => {},
    kill: () => { mockProcess.killed = true; }
  };

  const origSpawn = child_process.spawn;
  const origExecSync = child_process.execSync;

  child_process.spawn = () => mockProcess;
  child_process.execSync = () => "/usr/bin/parec";

  let levels = [];
  const bridge = createAudioBridge((level) => {
    levels.push(level);
  });

  bridge.start();

  const maxBuffer = Buffer.alloc(8);
  maxBuffer.writeInt16LE(32767, 0);
  maxBuffer.writeInt16LE(32767, 2);
  maxBuffer.writeInt16LE(32767, 4);
  maxBuffer.writeInt16LE(32767, 6);
  mockProcess.sendStdout(maxBuffer);

  return new Promise((resolve) => {
    setTimeout(() => {
      const afterFirstLoud = levels.length;
      assert.ok(afterFirstLoud > 0);
      const firstLoudVal = levels[afterFirstLoud - 1];

      setTimeout(() => {
        bridge.stop();
        child_process.spawn = origSpawn;
        child_process.execSync = origExecSync;

        const afterDecay = levels.length;
        assert.ok(afterDecay > afterFirstLoud);
        const decayedVal = levels[afterDecay - 1];

        assert.ok(decayedVal < firstLoudVal, `Loud value ${firstLoudVal} should decay over time, got ${decayedVal}`);
        resolve();
      }, 50);
    }, 50);
  });
});
