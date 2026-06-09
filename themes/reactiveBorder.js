(() => {
  const {
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
  const RAINBOW_SEGMENT_LENGTH = 72;

  const REACTIVE_BORDER_STYLES = {
    rainbow: { mode: "rainbow", saturation: 92, lightness: 64 },
    neonBlue: { mode: "range", hueA: 192, hueB: 220, saturation: 98, lightness: 66 },
    neonPurple: { mode: "range", hueA: 270, hueB: 304, saturation: 98, lightness: 70 },
    warmGlow: { mode: "range", hueA: 22, hueB: 48, saturation: 96, lightness: 68 }
  };

  function getReactiveColorStyle(settings) {
    if (settings.colorStyle === "custom" && settings.customColors && settings.customColors.length >= 2) {
      const hsl1 = hexToHsl(settings.customColors[0]);
      const hsl2 = hexToHsl(settings.customColors[1]);
      return { mode: "range", hueA: hsl1.h, hueB: hsl2.h, saturation: hsl1.s, lightness: hsl1.l };
    }
    return REACTIVE_BORDER_STYLES[settings.colorStyle] || REACTIVE_BORDER_STYLES.rainbow;
  }

  function getReactiveIntensityMultiplier(settings) {
    if (settings.intensity === "low") {
      return 0.82;
    }

    if (settings.intensity === "high") {
      return 1.26;
    }

    return 1;
  }

  function getReactiveInputMultiplier(settings = {}) {
    let base = 2.4;
    if (settings.intensity === "low") base = 1.6;
    if (settings.intensity === "high") base = 3.4;

    if (settings.intensity === "custom" && typeof settings.customSensitivity === "number") {
      return base * (settings.customSensitivity / 30);
    }
    return base;
  }

  // --- Pre-allocated reusable buffer for color stops ---
  // Eliminates per-frame array/object allocations in the hot render loop.
  const MAX_REACTIVE_STOPS = 257;
  const reactiveColorStops = Array.from({ length: MAX_REACTIVE_STOPS }, () => ({ position: 0, color: "" }));

  // Optimized: Batch all segments into a single stroke per edge using CanvasGradient.
  // Reduces draw calls from O(segments) to O(1) per edge while preserving gradient colors.
  function drawReactiveBorderEdge(context, options) {
    const {
      x1,
      y1,
      x2,
      y2,
      startDistance,
      perimeter,
      colorStyle,
      hueOffset,
      thickness,
      glowBlur,
      opacity,
      performanceMode = 'balanced'
    } = options;

    const edgeLength = Math.hypot(x2 - x1, y2 - y1);
    const segmentCount = Math.max(1, Math.ceil(edgeLength / RAINBOW_SEGMENT_LENGTH));
    const stopCount = Math.min(segmentCount + 1, MAX_REACTIVE_STOPS);
    const stopDivisor = Math.max(1, stopCount - 1);
    const perfMultiplier = getPerformanceMultiplier(performanceMode);
    const optimizedBlur = glowBlur * perfMultiplier;

    // Build color stops into pre-allocated buffer — one per segment boundary
    for (let index = 0; index < stopCount; index++) {
      const t = index / stopDivisor;
      const normalizedDistance = (startDistance + edgeLength * t) / perimeter;
      const color = getCachedColor(colorStyle, normalizedDistance, hueOffset, opacity, 0);
      reactiveColorStops[index].position = t;
      reactiveColorStops[index].color = color;
    }

    // Create gradient along the edge and draw with a single stroke
    const gradient = buildEdgeGradient(context, x1, y1, x2, y2, reactiveColorStops, stopCount);

    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.strokeStyle = gradient;
    context.lineWidth = thickness;

    // Apply shadow once per edge using the midpoint color for glow
    const midColor = reactiveColorStops[Math.floor(stopCount / 2)].color;
    applyOptimizedShadow(context, midColor, optimizedBlur, performanceMode);

    context.stroke();
  }

  function drawReactiveBorder(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;

    const reactiveStyle = getReactiveColorStyle(settings);
    const intensityMultiplier = getReactiveIntensityMultiplier(settings);
    const glowMultiplier = getGlowMultiplier(settings.glowStrength);
    const thicknessBase = settings.borderThickness === "thick"
      ? 4.25
      : settings.borderThickness === "medium"
        ? 3
        : 2.15;
    const thickness = thicknessBase + smoothedLevel * 1.15 * intensityMultiplier;
    const edgeOffset = Math.max(1, thickness * 0.5) + 1;

    // Use cached border geometry — only recomputed when dimensions or offset change
    const geo = getCachedBorderGeometry(width, height, edgeOffset);
    const { left, top, right, bottom, horizontal, vertical, perimeter } = geo;

    const speed = 32 + smoothedLevel * 180 * intensityMultiplier;
    const hueOffset = time * speed;
    const glowBlur = (7 + smoothedLevel * 10) * glowMultiplier;
    const opacity = 0.54 + smoothedLevel * 0.18 * intensityMultiplier;

    context.globalAlpha = 1;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(255, 255, 255, 0.06)";
    context.lineWidth = thickness + 0.8;
    context.strokeRect(left, top, horizontal, vertical);

    drawReactiveBorderEdge(context, { x1: left, y1: top, x2: right, y2: top, startDistance: 0, perimeter, colorStyle: reactiveStyle, hueOffset, thickness, glowBlur, opacity, performanceMode });
    drawReactiveBorderEdge(context, { x1: right, y1: top, x2: right, y2: bottom, startDistance: horizontal, perimeter, colorStyle: reactiveStyle, hueOffset, thickness, glowBlur, opacity, performanceMode });
    drawReactiveBorderEdge(context, { x1: right, y1: bottom, x2: left, y2: bottom, startDistance: horizontal + vertical, perimeter, colorStyle: reactiveStyle, hueOffset, thickness, glowBlur, opacity, performanceMode });
    drawReactiveBorderEdge(context, { x1: left, y1: bottom, x2: left, y2: top, startDistance: horizontal * 2 + vertical, perimeter, colorStyle: reactiveStyle, hueOffset, thickness, glowBlur, opacity, performanceMode });
  }

  window.ParalineReactiveBorder = {
    getReactiveInputMultiplier,
    drawReactiveBorder
  };
})();
