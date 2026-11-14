const test = require("node:test");
const assert = require("node:assert");
const { filterDisplays, computeDisplayContexts } = require("../multiMonitorHelper");

const DISPLAY_A = {
  id: 1,
  bounds: { x: 0, y: 0, width: 1920, height: 1080 }
};

const DISPLAY_B = {
  id: 2,
  bounds: { x: 1920, y: 0, width: 1920, height: 1080 }
};

const DISPLAY_C = {
  id: 3,
  bounds: { x: 3840, y: 0, width: 2560, height: 1440 }
};

const DISPLAY_STACKED_BOTTOM = {
  id: 4,
  bounds: { x: 0, y: 1080, width: 1920, height: 1080 }
};

test("multiMonitorHelper - filterDisplays edge cases and modes", () => {
  // Empty or invalid
  assert.deepStrictEqual(filterDisplays([], DISPLAY_A, { targetMode: "all" }), []);

  // Single display always returns itself
  assert.deepStrictEqual(filterDisplays([DISPLAY_A], DISPLAY_A, { targetMode: "secondary" }), [DISPLAY_A]);

  const allDisplays = [DISPLAY_A, DISPLAY_B, DISPLAY_C];

  // Target Mode: all
  assert.deepStrictEqual(
    filterDisplays(allDisplays, DISPLAY_A, { targetMode: "all" }),
    allDisplays
  );

  // Target Mode: primary
  assert.deepStrictEqual(
    filterDisplays(allDisplays, DISPLAY_A, { targetMode: "primary" }),
    [DISPLAY_A]
  );

  // Target Mode: secondary
  assert.deepStrictEqual(
    filterDisplays(allDisplays, DISPLAY_A, { targetMode: "secondary" }),
    [DISPLAY_B, DISPLAY_C]
  );

  // Target Mode: custom with valid IDs
  assert.deepStrictEqual(
    filterDisplays(allDisplays, DISPLAY_A, { targetMode: "custom", customDisplayIds: ["2", "3"] }),
    [DISPLAY_B, DISPLAY_C]
  );

  // Target Mode: custom with non-matching IDs falls back safely to primary
  assert.deepStrictEqual(
    filterDisplays(allDisplays, DISPLAY_A, { targetMode: "custom", customDisplayIds: ["999"] }),
    [DISPLAY_A]
  );
});

test("multiMonitorHelper - computeDisplayContexts desk symmetry (mirrorMode)", () => {
  // Single display: never mirrored even if mirrorMode is true
  const singleContexts = computeDisplayContexts([DISPLAY_A], DISPLAY_A, { mirrorMode: true });
  assert.strictEqual(singleContexts.get(1).isMirrored, false);

  // Dual display: left is false, right is true
  const dualContexts = computeDisplayContexts(
    [DISPLAY_A, DISPLAY_B],
    DISPLAY_A,
    { mirrorMode: true }
  );
  assert.strictEqual(dualContexts.get(1).isMirrored, false);
  assert.strictEqual(dualContexts.get(2).isMirrored, true);

  // Dual display with mirrorMode = false: both false
  const unmirroredContexts = computeDisplayContexts(
    [DISPLAY_A, DISPLAY_B],
    DISPLAY_A,
    { mirrorMode: false }
  );
  assert.strictEqual(unmirroredContexts.get(1).isMirrored, false);
  assert.strictEqual(unmirroredContexts.get(2).isMirrored, false);
});

test("multiMonitorHelper - computeDisplayContexts seamless panoramic span (seamSuppression)", () => {
  // Side-by-side displays (A is left of B)
  const sideBySide = computeDisplayContexts(
    [DISPLAY_A, DISPLAY_B],
    DISPLAY_A,
    { seamSuppression: true }
  );
  assert.deepStrictEqual(sideBySide.get(1).suppressedEdges, {
    left: false,
    right: true,
    top: false,
    bottom: false
  });
  assert.deepStrictEqual(sideBySide.get(2).suppressedEdges, {
    left: true,
    right: false,
    top: false,
    bottom: false
  });

  // Vertical stacked displays (A is above DISPLAY_STACKED_BOTTOM)
  const stacked = computeDisplayContexts(
    [DISPLAY_A, DISPLAY_STACKED_BOTTOM],
    DISPLAY_A,
    { seamSuppression: true }
  );
  assert.deepStrictEqual(stacked.get(1).suppressedEdges, {
    left: false,
    right: false,
    top: false,
    bottom: true
  });
  assert.deepStrictEqual(stacked.get(4).suppressedEdges, {
    left: false,
    right: false,
    top: true,
    bottom: false
  });

  // Disconnected / far apart displays should NOT suppress edges
  const farApartDisplay = { id: 5, bounds: { x: 10000, y: 0, width: 1920, height: 1080 } };
  const distant = computeDisplayContexts(
    [DISPLAY_A, farApartDisplay],
    DISPLAY_A,
    { seamSuppression: true }
  );
  assert.deepStrictEqual(distant.get(1).suppressedEdges, {
    left: false,
    right: false,
    top: false,
    bottom: false
  });
  assert.deepStrictEqual(distant.get(5).suppressedEdges, {
    left: false,
    right: false,
    top: false,
    bottom: false
  });
});

test("multiMonitorHelper - computeDisplayContexts display split theme (splitTheme)", () => {
  // Split theme enabled with secondary theme set
  const split = computeDisplayContexts(
    [DISPLAY_A, DISPLAY_B],
    DISPLAY_A,
    { splitTheme: true },
    "reactiveBorder",
    "dotParticles"
  );
  assert.strictEqual(split.get(1).assignedTheme, "reactiveBorder");
  assert.strictEqual(split.get(2).assignedTheme, "dotParticles");

  // Split theme with secondaryTheme = "none" falls back to mainTheme
  const fallback = computeDisplayContexts(
    [DISPLAY_A, DISPLAY_B],
    DISPLAY_A,
    { splitTheme: true },
    "flowBorder",
    "none"
  );
  assert.strictEqual(fallback.get(1).assignedTheme, "flowBorder");
  assert.strictEqual(fallback.get(2).assignedTheme, "flowBorder");

  // Split theme disabled gives null assignedTheme
  const disabled = computeDisplayContexts(
    [DISPLAY_A, DISPLAY_B],
    DISPLAY_A,
    { splitTheme: false },
    "flowBorder",
    "dotParticles"
  );
  assert.strictEqual(disabled.get(1).assignedTheme, null);
  assert.strictEqual(disabled.get(2).assignedTheme, null);
});

test("multiMonitorHelper - computeDisplayContexts panoramic span metrics and edge continuity", () => {
  // Dual 1920x1080 displays side-by-side
  const contexts = computeDisplayContexts(
    [DISPLAY_A, DISPLAY_B],
    DISPLAY_A,
    { seamSuppression: true }
  );

  const ctxA = contexts.get(1);
  const ctxB = contexts.get(2);

  assert.ok(ctxA.panoramic);
  assert.ok(ctxB.panoramic);

  // Total width: 1920 + 1920 = 3840. Perimeter: 2 * 3840 + 1080 + 1080 = 9840.
  const expectedPerimeter = 2 * (1920 + 1920) + 1080 + 1080;
  assert.strictEqual(ctxA.panoramic.perimeter, expectedPerimeter);
  assert.strictEqual(ctxB.panoramic.perimeter, expectedPerimeter);

  // Display A: xOffset = 0, top starts at 0
  assert.strictEqual(ctxA.panoramic.xOffset, 0);
  assert.strictEqual(ctxA.panoramic.edges.top.startDistance, 0);
  assert.strictEqual(ctxA.panoramic.edges.right, null); // suppressed
  assert.strictEqual(ctxA.panoramic.edges.left.startDistance, 2 * (1920 + 1920) + 1080); // 8760

  // Display B: xOffset = 1920, top starts at 1920
  assert.strictEqual(ctxB.panoramic.xOffset, 1920);
  assert.strictEqual(ctxB.panoramic.edges.top.startDistance, 1920);
  assert.strictEqual(ctxB.panoramic.edges.right.startDistance, 3840);
  assert.strictEqual(ctxB.panoramic.edges.bottom.startDistance, 3840 + 1080); // 4920
  assert.strictEqual(ctxB.panoramic.edges.left, null); // suppressed

  // Seam continuity check:
  // Display A top ends at 0 + 1920 = 1920, which is exactly where Display B top starts
  assert.strictEqual(ctxA.panoramic.edges.top.startDistance + DISPLAY_A.bounds.width, ctxB.panoramic.edges.top.startDistance);

  // Display B bottom ends at 4920 + 1920 = 6840, which is exactly where Display A bottom starts
  assert.strictEqual(ctxB.panoramic.edges.bottom.startDistance + DISPLAY_B.bounds.width, ctxA.panoramic.edges.bottom.startDistance);

  // Display A bottom ends at 6840 + 1920 = 8760, which is exactly where Display A left starts
  assert.strictEqual(ctxA.panoramic.edges.bottom.startDistance + DISPLAY_A.bounds.width, ctxA.panoramic.edges.left.startDistance);

  // When seamSuppression is disabled, panoramic is null
  const noSuppression = computeDisplayContexts(
    [DISPLAY_A, DISPLAY_B],
    DISPLAY_A,
    { seamSuppression: false }
  );
  assert.strictEqual(noSuppression.get(1).panoramic, null);
  assert.strictEqual(noSuppression.get(2).panoramic, null);
});
