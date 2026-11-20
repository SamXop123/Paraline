const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

function createMockContext() {
  const drawn = [];
  return {
    drawn,
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo(x, y) { drawn.push(["moveTo", x, y]); },
    lineTo(x, y) { drawn.push(["lineTo", x, y]); },
    arc(x, y, r) { drawn.push(["arc", x, y, r]); },
    rect(x, y, w, h) { drawn.push(["rect", x, y, w, h]); },
    roundRect(x, y, w, h) { drawn.push(["roundRect", x, y, w, h]); },
    fill() {},
    stroke() {},
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    setTransform() {}
  };
}

function loadTheme(fileName) {
  if (!global.window) {
    global.window = {};
  }
  const code = fs.readFileSync(path.join(__dirname, "..", "themes", fileName), "utf8");
  eval(code);
}

// Load shared primitives first
loadTheme("shared.js");

test("multiMonitorThemes - sideBars multi-monitor edge suppression and symmetry", () => {
  loadTheme("sideBars.js");

  // Single monitor: draws both left and right (202 drawn commands)
  const ctxSingle = createMockContext();
  window.ParalineSideBars.drawSideBars({
    context: ctxSingle,
    width: 1920,
    height: 1080,
    time: 1.0,
    smoothedLevel: 0.5,
    settings: {
      suppressedEdges: { left: false, right: false, top: false, bottom: false },
      isMirrored: false
    }
  });
  assert.strictEqual(ctxSingle.drawn.length, 202);

  // Dual monitor - Left: draws only left edge (101 commands)
  const ctxLeft = createMockContext();
  window.ParalineSideBars.drawSideBars({
    context: ctxLeft,
    width: 1920,
    height: 1080,
    time: 1.0,
    smoothedLevel: 0.5,
    settings: {
      suppressedEdges: { left: false, right: true, top: false, bottom: false },
      isMirrored: false
    }
  });
  assert.strictEqual(ctxLeft.drawn.length, 101);

  // Dual monitor - Right: draws only right edge (101 commands)
  const ctxRight = createMockContext();
  window.ParalineSideBars.drawSideBars({
    context: ctxRight,
    width: 1920,
    height: 1080,
    time: 1.0,
    smoothedLevel: 0.5,
    settings: {
      suppressedEdges: { left: true, right: false, top: false, bottom: false },
      isMirrored: true
    }
  });
  assert.strictEqual(ctxRight.drawn.length, 101);

  // 3-monitor setup - Center: both suppressed. Should NOT vanish, draws 202 commands!
  const ctxCenter = createMockContext();
  window.ParalineSideBars.drawSideBars({
    context: ctxCenter,
    width: 1920,
    height: 1080,
    time: 1.0,
    smoothedLevel: 0.5,
    settings: {
      suppressedEdges: { left: true, right: true, top: false, bottom: false },
      isMirrored: false
    }
  });
  assert.strictEqual(ctxCenter.drawn.length, 202);

  // Invalid customColors should not throw or crash
  const ctxInvalidColors = createMockContext();
  assert.doesNotThrow(() => {
    window.ParalineSideBars.drawSideBars({
      context: ctxInvalidColors,
      width: 1920,
      height: 1080,
      time: 1.0,
      smoothedLevel: 0.5,
      settings: {
        colorStyle: "custom",
        customColors: ["invalid-hex", null, 123]
      }
    });
  });
  assert.ok(ctxInvalidColors.drawn.length > 0);
});

test("multiMonitorThemes - flowBorder direction with desk symmetry and panoramic loop", () => {
  loadTheme("flowBorder.js");

  // Single monitor unmirrored: default clockwise (1)
  const dir1 = window.ParalineFlowBorder.getFlowDirectionValue({ isMirrored: false });
  assert.strictEqual(dir1, 1);

  // Dual monitor mirrored without panoramic (desk symmetry only): reversed (-1)
  const dir2 = window.ParalineFlowBorder.getFlowDirectionValue({ isMirrored: true });
  assert.strictEqual(dir2, -1);

  // Dual monitor mirrored WITH panoramic active: preserved consistent loop (1)
  const dir3 = window.ParalineFlowBorder.getFlowDirectionValue({
    isMirrored: true,
    panoramic: { perimeter: 9840 }
  });
  assert.strictEqual(dir3, 1);
});

test("multiMonitorThemes - ambientWave and shared wave functions preserve xOffset under symmetry", () => {
  loadTheme("ambientWave.js");

  const ctx = createMockContext();
  // Draw wave with xOffset and isMirrored
  assert.doesNotThrow(() => {
    window.ParalineShared.drawWave(ctx, {
      width: 1920,
      time: 1.0,
      yBase: 500,
      amplitude: 20,
      frequency: 0.01,
      speed: 0.3,
      color: "rgba(255, 255, 255, 0.5)",
      lineWidth: 1,
      opacity: 0.8,
      glowScale: 1,
      xOffset: 1920,
      isMirrored: true
    });
  });
  assert.ok(ctx.drawn.length > 0);
});

test("multiMonitorThemes - vertically stacked monitors suppress horizontal seams cleanly", () => {
  loadTheme("synthwaveHorizon.js");
  loadTheme("auroraDrift.js");
  loadTheme("snowBubbleParticles.js");

  // Synthwave Horizon on top display (bottom suppressed): draws 0 lines across the seam
  const ctxSynthTop = createMockContext();
  window.ParalineSynthwaveHorizon.drawSynthwaveHorizon({
    context: ctxSynthTop,
    width: 1920,
    height: 1080,
    time: 1.0,
    smoothedLevel: 0.5,
    settings: { suppressedEdges: { bottom: true } }
  });
  assert.strictEqual(ctxSynthTop.drawn.length, 0);

  // Aurora Drift on top display (bottom suppressed): draws 0 ribbons across the seam
  const ctxAuroraTop = createMockContext();
  window.ParalineAuroraDrift.drawAuroraDrift({
    context: ctxAuroraTop,
    width: 1920,
    height: 1080,
    time: 1.0,
    smoothedLevel: 0.5,
    settings: { suppressedEdges: { bottom: true } }
  });
  assert.strictEqual(ctxAuroraTop.drawn.length, 0);

  // Snow Bubble Particles on bottom display (top suppressed): draws 0 particles across ceiling seam
  const ctxSnowBottom = createMockContext();
  window.ParalineSnowBubbleParticles.drawSnowBubbleParticles({
    context: ctxSnowBottom,
    width: 1920,
    height: 1080,
    time: 1.0,
    smoothedLevel: 0.5,
    settings: { suppressedEdges: { top: true } }
  });
  assert.strictEqual(ctxSnowBottom.drawn.length, 0);
});

test("multiMonitorThemes - sideBraids and edgeCrystals 3-monitor center displays", () => {
  loadTheme("sideBraids.js");
  loadTheme("edgeCrystals.js");

  // Center display in 3-monitor setup retains strokes for sideBraids
  const ctxBraidsCenter = createMockContext();
  window.ParalineSideBraids.drawSideBraids({
    context: ctxBraidsCenter,
    width: 1920,
    height: 1080,
    time: 1.0,
    smoothedLevel: 0.5,
    settings: { suppressedEdges: { left: true, right: true, top: false, bottom: false } }
  });
  assert.ok(ctxBraidsCenter.drawn.length > 0);

  // Center display in 3-monitor setup retains strokes for edgeCrystals
  const ctxCrystalsCenter = createMockContext();
  window.ParalineEdgeCrystals.drawEdgeCrystals({
    context: ctxCrystalsCenter,
    width: 1920,
    height: 1080,
    time: 1.0,
    smoothedLevel: 0.5,
    settings: { suppressedEdges: { left: true, right: true, top: false, bottom: false } }
  });
  assert.ok(ctxCrystalsCenter.drawn.length > 0);
});
