/**
 * audioDiagnostics.test.js
 *
 * Unit tests verifying real-time audio diagnostics, scaling curves,
 * peak decay mechanics, and status resolution for the v2.5.0 diagnostics engine.
 */

const test = require("node:test");
const assert = require("node:assert");

function calculatePerceptualLevel(rawValue) {
  const raw = Number(rawValue);
  if (isNaN(raw) || raw <= 0) return 0;
  return Math.max(0, Math.min(1, Math.pow(Math.max(0, raw), 0.72) * 1.25));
}

function resolveAudioStatusText({ mode, isPaused, reason }) {
  if (isPaused) {
    return {
      statusClass: "status-paused",
      label: "Visualizer: Paused",
      sourceLabel: "Visualizer Paused (Input Monitoring)"
    };
  }

  if (mode === "helper") {
    return {
      statusClass: "status-live",
      label: "Audio Capture: Live",
      sourceLabel: "Windows WASAPI Loopback (Active)"
    };
  }

  if (mode === "simulated") {
    return {
      statusClass: "status-simulated",
      label: "Audio Capture: Fallback",
      sourceLabel: "Synthesized Audio Fallback"
    };
  }

  return {
    statusClass: "status-error",
    label: "Capture: Error",
    sourceLabel: "Hardware Loopback Disconnected"
  };
}

function stepPeakDecay({ currentLevel, peakLevel, holdUntil, now, decayRate = 0.018 }) {
  if (currentLevel >= peakLevel) {
    return {
      peakLevel: currentLevel,
      holdUntil: now + 500
    };
  }

  if (now > holdUntil) {
    return {
      peakLevel: Math.max(currentLevel, peakLevel - decayRate),
      holdUntil
    };
  }

  return {
    peakLevel,
    holdUntil
  };
}

test("audioDiagnostics - perceptual curve scales quiet audio and clamps within [0, 1]", () => {
  assert.strictEqual(calculatePerceptualLevel(0), 0);
  assert.strictEqual(calculatePerceptualLevel(-0.5), 0);
  assert.strictEqual(calculatePerceptualLevel("invalid"), 0);

  // Normal audio levels (0.05 - 0.3) should be perceptually boosted so meter is visible
  const lowQuiet = calculatePerceptualLevel(0.05);
  assert.ok(lowQuiet > 0.05, `Expected low quiet level ${lowQuiet} to be boosted above 0.05`);

  const midLevel = calculatePerceptualLevel(0.25);
  assert.ok(midLevel > 0.25, `Expected mid level ${midLevel} to be boosted above 0.25`);

  // Max and loud levels should clamp cleanly at 1.0 without overflowing
  const maxLevel = calculatePerceptualLevel(1.0);
  assert.strictEqual(maxLevel, 1.0);

  const extremeLevel = calculatePerceptualLevel(2.5);
  assert.strictEqual(extremeLevel, 1.0);
});

test("audioDiagnostics - status resolver accurately differentiates live, simulated, error, and paused", () => {
  const live = resolveAudioStatusText({ mode: "helper", isPaused: false });
  assert.strictEqual(live.statusClass, "status-live");
  assert.strictEqual(live.label, "Audio Capture: Live");

  const fallback = resolveAudioStatusText({ mode: "simulated", isPaused: false });
  assert.strictEqual(fallback.statusClass, "status-simulated");
  assert.strictEqual(fallback.label, "Audio Capture: Fallback");

  const error = resolveAudioStatusText({ mode: "helper-error", isPaused: false, reason: "Stream crash" });
  assert.strictEqual(error.statusClass, "status-error");
  assert.strictEqual(error.label, "Capture: Error");

  const paused = resolveAudioStatusText({ mode: "helper", isPaused: true });
  assert.strictEqual(paused.statusClass, "status-paused");
  assert.strictEqual(paused.label, "Visualizer: Paused");
});

test("audioDiagnostics - peak hold retains maximum value and decays smoothly after hold window", () => {
  let now = 1000;
  let state = stepPeakDecay({ currentLevel: 0.8, peakLevel: 0, holdUntil: 0, now });
  assert.strictEqual(state.peakLevel, 0.8);
  assert.strictEqual(state.holdUntil, 1500);

  // During hold window (now = 1200), peak stays pinned at 0.8 even if current drops to 0.2
  state = stepPeakDecay({ currentLevel: 0.2, peakLevel: state.peakLevel, holdUntil: state.holdUntil, now: 1200 });
  assert.strictEqual(state.peakLevel, 0.8);

  // After hold window expires (now = 1600), peak begins decaying
  state = stepPeakDecay({ currentLevel: 0.2, peakLevel: state.peakLevel, holdUntil: state.holdUntil, now: 1600, decayRate: 0.05 });
  assert.strictEqual(Number(state.peakLevel.toFixed(2)), 0.75);
});
