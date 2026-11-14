(() => {
  const {
    clamp01,
    computeWrappedDistance,
    getGlowMultiplier,
    resolveAnimatedColor,
    getCachedColor,
    buildEdgeGradient,
    getCachedBorderGeometry,
    hexToHsl,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  const RAINBOW_BORDER_INSET = 0;

  const FLOW_BORDER_STYLES = {
    rainbow: { mode: "rainbow", saturation: 96, lightness: 64 },
    cool: { mode: "range", hueA: 190, hueB: 228, saturation: 92, lightness: 66 },
    warm: { mode: "range", hueA: 20, hueB: 52, saturation: 94, lightness: 68 }
  };

  function getFlowBorderStyle(settings, colorModulation, dynamicHue) {
    if (colorModulation && colorModulation.enabled && typeof dynamicHue === "number") {
      return { mode: "single", hue: dynamicHue, saturation: 95, lightness: 60 };
    }
    if (settings.colorStyle === "custom" && settings.customColors && settings.customColors.length >= 2) {
      const hsl1 = hexToHsl(settings.customColors[0]);
      const hsl2 = hexToHsl(settings.customColors[1]);
      return { mode: "range", hueA: hsl1.h, hueB: hsl2.h, saturation: hsl1.s, lightness: hsl1.l };
    }
    return FLOW_BORDER_STYLES[settings.colorStyle] || FLOW_BORDER_STYLES.rainbow;
  }

  function getFlowAudioMultiplier(settings) {
    let base = 1.5;
    if (settings.speedMode === "calm") base = 1.2;
    if (settings.speedMode === "energetic") base = 1.8;

    if (settings.speedMode === "custom" && typeof settings.customSensitivity === "number") {
      return base * (settings.customSensitivity / 30);
    }
    return base;
  }

  function getFlowDirectionValue(settings = {}) {
    const base = settings.direction === "anticlockwise" ? -1 : 1;
    return settings.isMirrored ? -base : base;
  }

  function getFlowSegmentLength(settings) {
    if (settings.segmentLength === "custom" && typeof settings.customThickness === "number") {
      return settings.customThickness * 10;
    }

    if (settings.segmentLength === "short") {
      return 14;
    }

    if (settings.segmentLength === "long") {
      return 28;
    }

    return 18;
  }

  function getFlowBorderThickness(settings = {}) {
    const custom = typeof settings.customThickness === "number" ? settings.customThickness : null;
    if (settings.borderThickness === "custom" && custom !== null) {
      return custom;
    }
    if (settings.borderThickness === "thin") return 1.5;
    if (settings.borderThickness === "thick") return 3.5;
    return 2.2;
  }

  function getFlowSpeedProfile(settings) {
    if (settings.speedMode === "custom" && typeof settings.customSpeed === "number") {
      const scale = settings.customSpeed / 30;
      return { base: 220 * scale, boost: 620 * scale };
    }

    if (settings.speedMode === "calm") {
      return { base: 150, boost: 460 };
    }

    if (settings.speedMode === "energetic") {
      return { base: 300, boost: 860 };
    }

    return { base: 220, boost: 620 };
  }

  // --- Pre-allocated reusable buffer for color stops ---
  // Eliminates per-frame array/object allocations in the hot render loop.
  // Sized for the maximum realistic segment count per edge.
  const MAX_FLOW_STOPS = 257;
  const flowColorStops = Array.from({ length: MAX_FLOW_STOPS }, () => ({ position: 0, color: "" }));

  // Optimized: Batch all segments into a single stroke per edge using CanvasGradient.
  // The trail/shimmer intensity variations are encoded as gradient stop opacity and
  // lightness changes, preserving the flowing animation while reducing draw calls
  // from O(segments) to O(1) per edge.
  //
  // Tradeoff: Canvas does not support per-segment lineWidth within a single stroke.
  // The original code varied width per segment (~0.7-0.9px boost on trail segments).
  // We use the weighted-average trail strength for the edge's lineWidth, which closely
  // approximates the visual weight. The trail effect is primarily conveyed through
  // the color/opacity gradient, which IS fully preserved.
  function drawFlowBorderEdge(context, options) {
    const {
      x1,
      y1,
      x2,
      y2,
      startDistance,
      perimeter,
      travelDistance,
      direction,
      thickness,
      glowBlur,
      glowMultiplier,
      segmentLength,
      colorStyle,
      performanceMode = 'balanced'
    } = options;

    const edgeLength = Math.hypot(x2 - x1, y2 - y1);
    const segmentCount = Math.max(1, Math.ceil(edgeLength / segmentLength));
    const stopCount = Math.min(segmentCount + 1, MAX_FLOW_STOPS);
    const stopDivisor = Math.max(1, stopCount - 1);
    const leadDistance = travelDistance;
    const oppositeLeadDistance = (leadDistance + perimeter * 0.5) % perimeter;
    const emphasisLength = perimeter * 0.3;
    const perfMultiplier = getPerformanceMultiplier(performanceMode);

    // Build color stops into pre-allocated buffer and accumulate trail strength
    let totalTrailStrength = 0;
    let peakTrailStrength = 0;
    let peakColor = null;

    for (let index = 0; index < stopCount; index++) {
      const t = index / stopDivisor;
      const segmentDistance = startDistance + edgeLength * t;
      const normalizedDistance = ((segmentDistance % perimeter) + perimeter) % perimeter / perimeter;
      const wrappedDistanceA = computeWrappedDistance(leadDistance, segmentDistance, perimeter, direction);
      const wrappedDistanceB = computeWrappedDistance(oppositeLeadDistance, segmentDistance, perimeter, direction);
      const bandStrengthA = clamp01(1 - wrappedDistanceA / emphasisLength);
      const bandStrengthB = clamp01(1 - wrappedDistanceB / emphasisLength);
      const trailStrength = Math.max(bandStrengthA * bandStrengthA, bandStrengthB * bandStrengthB);
      const shimmerPhase = normalizedDistance * Math.PI * 2 - (travelDistance / perimeter) * 4.8;
      const shimmer = Math.sin(shimmerPhase * 2.1 - 0.8) * 0.5 + 0.5;
      const intensity = 0.22 + trailStrength * 0.62 + shimmer * 0.08;
      const opacity = Math.min(0.92, (0.2 + intensity * 0.5) * (0.88 + glowMultiplier * 0.18));
      const color = getCachedColor(colorStyle, normalizedDistance, travelDistance * 0.62, opacity, intensity * 10);

      // Reuse pre-allocated stop object
      flowColorStops[index].position = t;
      flowColorStops[index].color = color;

      totalTrailStrength += trailStrength;
      if (trailStrength > peakTrailStrength) {
        peakTrailStrength = trailStrength;
        peakColor = color;
      }
    }

    // Create gradient along the edge and draw with a single stroke
    const gradient = buildEdgeGradient(context, x1, y1, x2, y2, flowColorStops, stopCount);

    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.strokeStyle = gradient;

    // Use weighted-average trail strength for lineWidth (not peak — avoids bloating entire edge)
    const avgTrailStrength = totalTrailStrength / stopCount;
    context.lineWidth = thickness + avgTrailStrength * (0.7 + glowMultiplier * 0.2);

    // Apply shadow once per edge using the peak trail color for glow
    const optimizedBlur = glowBlur * (0.45 + peakTrailStrength * (0.85 + glowMultiplier * 0.2)) * perfMultiplier;
    applyOptimizedShadow(context, peakColor || "transparent", optimizedBlur, performanceMode);

    context.stroke();
  }

  function drawFlowBorder(options) {
    const {
      context,
      width,
      height,
      smoothedLevel,
      flowTravelDistance,
      settings,
      performanceMode = 'balanced',
      colorModulation,
      dynamicHue
    } = options;

    const colorStyle = getFlowBorderStyle(settings, colorModulation, dynamicHue);
    const glowMultiplier = getGlowMultiplier(settings.glowStrength);
    const thickness = getFlowBorderThickness(settings) + smoothedLevel * (0.95 + glowMultiplier * 0.18);
    const edgeOffset = Math.max(1, thickness * 0.5) + 1;

    // Use cached border geometry — only recomputed when dimensions or offset change
    const geo = getCachedBorderGeometry(width, height, edgeOffset);
    const { left, top, right, bottom, horizontal, vertical } = geo;

    const panoramic = settings.panoramic;
    const isPanoramicActive = Boolean(panoramic && panoramic.perimeter && panoramic.edges);
    const perimeter = isPanoramicActive ? panoramic.perimeter : geo.perimeter;

    const direction = getFlowDirectionValue(settings);
    const travelDistance = (((flowTravelDistance * direction) % perimeter) + perimeter) % perimeter;
    const segmentLength = getFlowSegmentLength(settings);
    const glowBlur = (8 + smoothedLevel * 12) * glowMultiplier;

    context.globalAlpha = 1;
    context.lineCap = "round";
    context.lineJoin = "round";

    const suppressed = settings.suppressedEdges || {};

    const topStart = isPanoramicActive && panoramic.edges.top ? panoramic.edges.top.startDistance : 0;
    const rightStart = isPanoramicActive && panoramic.edges.right ? panoramic.edges.right.startDistance : horizontal;
    const bottomStart = isPanoramicActive && panoramic.edges.bottom ? panoramic.edges.bottom.startDistance : horizontal + vertical;
    const leftStart = isPanoramicActive && panoramic.edges.left ? panoramic.edges.left.startDistance : horizontal * 2 + vertical;

    if (!suppressed.top && (!isPanoramicActive || panoramic.edges.top)) {
      drawFlowBorderEdge(context, { x1: left, y1: top, x2: right, y2: top, startDistance: topStart, perimeter, travelDistance, direction, thickness, glowBlur, glowMultiplier, segmentLength, colorStyle, performanceMode });
    }
    if (!suppressed.right && (!isPanoramicActive || panoramic.edges.right)) {
      drawFlowBorderEdge(context, { x1: right, y1: top, x2: right, y2: bottom, startDistance: rightStart, perimeter, travelDistance, direction, thickness, glowBlur, glowMultiplier, segmentLength, colorStyle, performanceMode });
    }
    if (!suppressed.bottom && (!isPanoramicActive || panoramic.edges.bottom)) {
      drawFlowBorderEdge(context, { x1: right, y1: bottom, x2: left, y2: bottom, startDistance: bottomStart, perimeter, travelDistance, direction, thickness, glowBlur, glowMultiplier, segmentLength, colorStyle, performanceMode });
    }
    if (!suppressed.left && (!isPanoramicActive || panoramic.edges.left)) {
      drawFlowBorderEdge(context, { x1: left, y1: bottom, x2: left, y2: top, startDistance: leftStart, perimeter, travelDistance, direction, thickness, glowBlur, glowMultiplier, segmentLength, colorStyle, performanceMode });
    }
  }

  window.ParalineFlowBorder = {
    getFlowAudioMultiplier,
    getFlowDirectionValue,
    getFlowSpeedProfile,
    drawFlowBorder
  };
})();
