/**
 * multiMonitorHelper.js
 * 
 * Provides pure, testable geometry and multi-monitor context calculations:
 * 1. filterDisplays: Selects which displays should run overlay windows based on targetMode.
 * 2. computeDisplayContexts: Calculates desk symmetry mirroring, seam suppression,
 *    and theme assignment per display.
 */

/**
 * Filters the active displays according to the multi-monitor target mode configuration.
 *
 * @param {Array<Object>} displays - Array of Electron display objects.
 * @param {Object|null} primaryDisplay - Primary Electron display object.
 * @param {Object} multiMonitorConfig - Sanitized multiMonitor configuration object.
 * @returns {Array<Object>} Filtered list of displays to host visualizer overlay windows.
 */
function filterDisplays(displays = [], primaryDisplay = null, multiMonitorConfig = {}) {
  if (!Array.isArray(displays) || displays.length === 0) {
    return [];
  }

  // Single display setup always uses the only display available
  if (displays.length === 1) {
    return displays;
  }

  const primaryId = primaryDisplay ? primaryDisplay.id : (displays[0] ? displays[0].id : null);
  const targetMode = multiMonitorConfig.targetMode || "all";

  switch (targetMode) {
    case "primary": {
      const primary = displays.find((d) => d.id === primaryId);
      return primary ? [primary] : [displays[0]];
    }

    case "secondary": {
      const secondaries = displays.filter((d) => d.id !== primaryId);
      // Fallback to primary if no secondary monitors exist
      return secondaries.length > 0 ? secondaries : (displays.find((d) => d.id === primaryId) ? [primaryDisplay] : [displays[0]]);
    }

    case "custom": {
      const customIds = new Set(
        Array.isArray(multiMonitorConfig.customDisplayIds)
          ? multiMonitorConfig.customDisplayIds.map((id) => String(id))
          : []
      );

      const matched = displays.filter((d) => customIds.has(String(d.id)));
      // Safe fallback: never leave the user with zero visualizer overlays
      if (matched.length > 0) {
        return matched;
      }
      const primary = displays.find((d) => d.id === primaryId);
      return primary ? [primary] : [displays[0]];
    }

    case "all":
    default:
      return displays;
  }
}

/**
 * Computes the multi-monitor visualizer context for each display.
 *
 * @param {Array<Object>} activeDisplays - Displays currently hosting overlays.
 * @param {Object|null} primaryDisplay - The system primary display.
 * @param {Object} multiMonitorConfig - Sanitized multiMonitor settings.
 * @param {string} mainTheme - Active selected visualizer theme.
 * @param {string} secondaryTheme - Secondary theme configured in dualTheme.
 * @returns {Map<string|number, Object>} Map of displayId -> { isMirrored, suppressedEdges, assignedTheme }
 */
function computeDisplayContexts(
  activeDisplays = [],
  primaryDisplay = null,
  multiMonitorConfig = {},
  mainTheme = "ambientWave",
  secondaryTheme = "none"
) {
  const contexts = new Map();

  if (!Array.isArray(activeDisplays) || activeDisplays.length === 0) {
    return contexts;
  }

  const primaryId = primaryDisplay ? primaryDisplay.id : (activeDisplays[0] ? activeDisplays[0].id : null);
  const isMulti = activeDisplays.length > 1;

  // Initialize default context for each display
  for (const display of activeDisplays) {
    contexts.set(display.id, {
      isMirrored: false,
      suppressedEdges: {
        left: false,
        right: false,
        top: false,
        bottom: false
      },
      assignedTheme: null,
      panoramic: null
    });
  }

  // 1. Desk Symmetry (Mirrored Flow Direction)
  if (multiMonitorConfig.mirrorMode && isMulti) {
    let minX = Infinity;
    let maxX = -Infinity;

    for (const d of activeDisplays) {
      if (d.bounds) {
        if (d.bounds.x < minX) minX = d.bounds.x;
        const rightX = d.bounds.x + d.bounds.width;
        if (rightX > maxX) maxX = rightX;
      }
    }

    const deskCenterX = (minX + maxX) / 2;

    for (const d of activeDisplays) {
      if (d.bounds) {
        const displayCenterX = d.bounds.x + d.bounds.width / 2;
        // Displays positioned on the right half of the desk are mirrored
        if (displayCenterX >= deskCenterX) {
          const ctx = contexts.get(d.id);
          if (ctx) {
            ctx.isMirrored = true;
          }
        }
      }
    }
  }

  // 2. Seamless Panoramic Span (Adjoining Edge Suppression)
  if (multiMonitorConfig.seamSuppression && isMulti) {
    const ADJACENCY_TOLERANCE_PX = 25;

    for (let i = 0; i < activeDisplays.length; i++) {
      for (let j = 0; j < activeDisplays.length; j++) {
        if (i === j) continue;

        const a = activeDisplays[i];
        const b = activeDisplays[j];
        if (!a.bounds || !b.bounds) continue;

        const ctxA = contexts.get(a.id);
        const ctxB = contexts.get(b.id);
        if (!ctxA || !ctxB) continue;

        // Check horizontal touch: A's right edge touches B's left edge
        const xDistance = Math.abs((a.bounds.x + a.bounds.width) - b.bounds.x);
        if (xDistance <= ADJACENCY_TOLERANCE_PX) {
          const overlapY = Math.max(
            0,
            Math.min(a.bounds.y + a.bounds.height, b.bounds.y + b.bounds.height) -
              Math.max(a.bounds.y, b.bounds.y)
          );
          const minHeight = Math.min(a.bounds.height, b.bounds.height);

          // Overlap check: at least 50px or 20% of the shorter display's height
          if (overlapY >= 50 || overlapY >= minHeight * 0.2) {
            ctxA.suppressedEdges.right = true;
            ctxB.suppressedEdges.left = true;
          }
        }

        // Check vertical touch: A's bottom edge touches B's top edge
        const yDistance = Math.abs((a.bounds.y + a.bounds.height) - b.bounds.y);
        if (yDistance <= ADJACENCY_TOLERANCE_PX) {
          const overlapX = Math.max(
            0,
            Math.min(a.bounds.x + a.bounds.width, b.bounds.x + b.bounds.width) -
              Math.max(a.bounds.x, b.bounds.x)
          );
          const minWidth = Math.min(a.bounds.width, b.bounds.width);

          // Overlap check: at least 50px or 20% of the shorter display's width
          if (overlapX >= 50 || overlapX >= minWidth * 0.2) {
            ctxA.suppressedEdges.bottom = true;
            ctxB.suppressedEdges.top = true;
          }
        }
      }
    }

    // Compute panoramic perimeter and edge mapping across horizontally adjoined displays
    computePanoramicHorizontalEdges(activeDisplays, contexts);
  }

  // 3. Display Split Theme (Theme per screen)
  if (multiMonitorConfig.splitTheme && isMulti) {
    const effectiveSecondaryTheme = (secondaryTheme && secondaryTheme !== "none")
      ? secondaryTheme
      : mainTheme;

    for (const d of activeDisplays) {
      const ctx = contexts.get(d.id);
      if (ctx) {
        if (d.id === primaryId) {
          ctx.assignedTheme = mainTheme;
        } else {
          ctx.assignedTheme = effectiveSecondaryTheme;
        }
      }
    }
  }

  return contexts;
}

/**
 * Computes panoramic geometry and continuous edge offsets across horizontally adjoined displays.
 *
 * @param {Array<Object>} activeDisplays - Active display array.
 * @param {Map} contexts - Contexts map to mutate.
 */
function computePanoramicHorizontalEdges(activeDisplays = [], contexts) {
  const displaysWithBounds = activeDisplays
    .filter((d) => d && d.bounds && typeof d.bounds.x === "number" && typeof d.bounds.width === "number")
    .sort((a, b) => a.bounds.x - b.bounds.x);

  if (displaysWithBounds.length < 2) {
    return;
  }

  const ADJACENCY_TOLERANCE_PX = 25;
  for (let i = 0; i < displaysWithBounds.length - 1; i++) {
    const a = displaysWithBounds[i];
    const b = displaysWithBounds[i + 1];
    const xDist = Math.abs((a.bounds.x + a.bounds.width) - b.bounds.x);
    if (xDist > ADJACENCY_TOLERANCE_PX) {
      return;
    }
  }

  const sumWidth = displaysWithBounds.reduce((sum, d) => sum + d.bounds.width, 0);
  const firstHeight = displaysWithBounds[0].bounds.height || 1080;
  const lastHeight = displaysWithBounds[displaysWithBounds.length - 1].bounds.height || 1080;
  const perimeter = 2 * sumWidth + firstHeight + lastHeight;

  let currentTop = 0;
  for (let i = 0; i < displaysWithBounds.length; i++) {
    const d = displaysWithBounds[i];
    const isFirst = i === 0;
    const isLast = i === displaysWithBounds.length - 1;

    const topStart = currentTop;
    currentTop += d.bounds.width;

    const rightStart = sumWidth;

    let bottomOffsetFromRight = 0;
    for (let k = displaysWithBounds.length - 1; k > i; k--) {
      bottomOffsetFromRight += displaysWithBounds[k].bounds.width;
    }
    const bottomStart = sumWidth + lastHeight + bottomOffsetFromRight;

    const leftStart = 2 * sumWidth + lastHeight;

    const ctx = contexts.get(d.id);
    if (ctx) {
      ctx.panoramic = {
        enabled: true,
        xOffset: topStart,
        perimeter,
        edges: {
          top: { startDistance: topStart },
          right: isLast ? { startDistance: rightStart } : null,
          bottom: { startDistance: bottomStart },
          left: isFirst ? { startDistance: leftStart } : null
        }
      };
    }
  }
}

module.exports = {
  filterDisplays,
  computeDisplayContexts,
  computePanoramicHorizontalEdges
};
