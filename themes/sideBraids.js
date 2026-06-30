(() => {
  const {
    clamp01,
    getGlowMultiplier,
    hexToRgb,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  const PALETTES = {
    cyanPink: {
      a: [168, 85, 247],  // Purple #a855f7
      b: [56, 189, 248]   // Cyan #38bdf8
    },
    bluePurple: {
      a: [180, 74, 255],  // Purple
      b: [74, 125, 255]   // Blue
    },
    redBlue: {
      a: [255, 51, 102],  // Red
      b: [51, 102, 255]   // Blue
    },
    white: {
      a: [255, 255, 255], // White
      b: [209, 213, 219]  // Silver
    }
  };

  let lastTime = 0;
  let leftScrollOffset = 0;
  let rightScrollOffset = 0;

  function getSideBraidsAudioMultiplier(settings = {}) {
    if (settings.motionStyle === "custom" && typeof settings.customSensitivity === "number") {
      return 2.6 * (settings.customSensitivity / 30);
    }
    if (settings.motionStyle === "energetic") return 3.4;
    if (settings.motionStyle === "calm") return 1.9;
    return 2.6;
  }

  function getPaletteColors(settings = {}) {
    if (settings.colorStyle === "custom" && Array.isArray(settings.customColors) && settings.customColors.length >= 2) {
      return {
        a: hexToRgb(settings.customColors[0]),
        b: hexToRgb(settings.customColors[1])
      };
    }
    return PALETTES[settings.colorStyle] || PALETTES.cyanPink;
  }

  function getGlowRadius(settings = {}) {
    const m = getGlowMultiplier(settings.glowStrength);
    return 6 * m;
  }

  function getLineWidth(settings = {}) {
    if (settings.braidWidth === "custom" && typeof settings.customThickness === "number") {
      return Math.max(0.3, settings.customThickness * 0.3);
    }
    if (settings.braidWidth === "thin") return 1.5;
    if (settings.braidWidth === "thick") return 3.5;
    return 2.5;
  }

  function drawPathPoints(context, points, color, glowRadius, lineWidth, performanceMode) {
    if (points.length < 2) return;
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i].x, points[i].y);
    }
    const [r, g, b] = color;
    context.lineWidth = lineWidth;
    context.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.95)`;
    context.lineCap = "round";
    context.lineJoin = "round";

    applyOptimizedShadow(context, `rgba(${r}, ${g}, ${b}, 0.8)`, glowRadius, performanceMode);
    context.stroke();
  }

  function drawSegmentedBraid(context, baseX, height, amplitude, phase, frequency, colorA, colorB, glowRadius, lineWidth, performanceMode) {
    // Segment sways at peaks (cos = 0) where: y * frequency + phase = k * Math.PI + Math.PI/2.
    // Inside each peak-to-peak segment, cos has a constant sign, representing 3D depth.
    const startTheta = phase;
    const endTheta = height * frequency + phase;

    const kStart = Math.floor((startTheta - Math.PI / 2) / Math.PI) - 1;
    const kEnd = Math.ceil((endTheta - Math.PI / 2) / Math.PI) + 1;

    for (let k = kStart; k <= kEnd; k++) {
      const yStart = (k * Math.PI + Math.PI / 2 - phase) / frequency;
      const yEnd = ((k + 1) * Math.PI + Math.PI / 2 - phase) / frequency;

      const clampedYStart = Math.max(0, Math.min(height, yStart));
      const clampedYEnd = Math.max(0, Math.min(height, yEnd));

      if (clampedYEnd - clampedYStart < 0.5) continue;

      const step = 8;
      const ptsA = [];
      const ptsB = [];
      const yDiff = clampedYEnd - clampedYStart;
      const steps = Math.ceil(yDiff / step);

      for (let i = 0; i <= steps; i++) {
        const y = clampedYStart + i * (yDiff / steps);
        const sinVal = Math.sin(y * frequency + phase);
        ptsA.push({ x: baseX + amplitude * sinVal, y });
        ptsB.push({ x: baseX - amplitude * sinVal, y });
      }

      // Check depth (cos) at the midpoint of this peak-to-peak segment
      const yMid = (clampedYStart + clampedYEnd) / 2;
      const cosVal = Math.cos(yMid * frequency + phase);

      // If cosVal > 0, Strand A is in front (drawn second).
      // If cosVal < 0, Strand B is in front (drawn second).
      const drawOrder = (cosVal > 0)
        ? { first: ptsB, second: ptsA, colorFirst: colorB, colorSecond: colorA }
        : { first: ptsA, second: ptsB, colorFirst: colorA, colorSecond: colorB };

      // Draw background strand first
      drawPathPoints(context, drawOrder.first, drawOrder.colorFirst, glowRadius, lineWidth, performanceMode);

      // Draw foreground strand second (will render on top at crossing nodes)
      drawPathPoints(context, drawOrder.second, drawOrder.colorSecond, glowRadius, lineWidth, performanceMode);
    }
  }

  function drawSideBraids(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;

    const delta = lastTime ? Math.min(0.05, Math.max(0.001, time - lastTime)) : 1 / 60;
    lastTime = time;

    const palette = getPaletteColors(settings);
    const glowRadius = getGlowRadius(settings);
    const lineWidth = getLineWidth(settings);

    // Speed and Amplitude based on motion style settings
    let speed = 40.0;
    let amplitude = 8.0;
    let audioSpeedBoost = 120.0;
    let audioAmpBoost = 6.0;

    if (settings.motionStyle === "calm") {
      speed = 20.0;
      amplitude = 6.0;
      audioSpeedBoost = 60.0;
      audioAmpBoost = 3.0;
    } else if (settings.motionStyle === "energetic") {
      speed = 70.0;
      amplitude = 12.0;
      audioSpeedBoost = 200.0;
      audioAmpBoost = 10.0;
    } else if (settings.motionStyle === "custom") {
      const speedScale = typeof settings.customSpeed === "number" ? settings.customSpeed / 30 : 1.0;
      const sensScale = typeof settings.customSensitivity === "number" ? settings.customSensitivity / 30 : 1.0;
      speed = 40.0 * speedScale;
      amplitude = 8.0 * sensScale;
      audioSpeedBoost = 120.0 * speedScale;
      audioAmpBoost = 6.0 * sensScale;
    }

    // Audio-reactive calculation (speed responds directly to beats)
    const level = clamp01(smoothedLevel / 0.68);
    const leftTargetSpeed = speed + level * audioSpeedBoost;
    const rightTargetSpeed = (speed * 1.08) + level * audioSpeedBoost;

    leftScrollOffset += delta * leftTargetSpeed;
    rightScrollOffset += delta * rightTargetSpeed;

    const isReversed = settings.flowDirection === "bottomUp";
    const flowDir = isReversed ? -1 : 1;

    // We use a frequency that gives elegant curves (about 0.012)
    const frequency = 0.012;

    const leftPhase = (leftScrollOffset / 100) * flowDir;
    const rightPhase = (rightScrollOffset / 100) * -flowDir + 0.45; // slight async phase offset

    const currentLeftAmp = amplitude + level * audioAmpBoost;
    const currentRightAmp = amplitude + level * audioAmpBoost;

    // Left and Right Base positions
    const edgeInset = 10;
    const leftBaseX = edgeInset;
    const rightBaseX = width - edgeInset;

    // Draw Left Braid (alternating z-index overlays based on 3D helix projection)
    drawSegmentedBraid(context, leftBaseX, height, currentLeftAmp, leftPhase, frequency, palette.a, palette.b, glowRadius, lineWidth, performanceMode);

    // Draw Right Braid (alternating z-index overlays based on 3D helix projection)
    drawSegmentedBraid(context, rightBaseX, height, currentRightAmp, rightPhase, frequency, palette.b, palette.a, glowRadius, lineWidth, performanceMode);

    // Clean shadow states
    context.shadowBlur = 0;
  }

  window.ParalineSideBraids = {
    getSideBraidsAudioMultiplier,
    drawSideBraids
  };
})();
