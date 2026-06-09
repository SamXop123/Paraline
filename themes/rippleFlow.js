(() => {
  const {
    clamp01,
    hexToRgb,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  const RIPPLE_FLOW_COLORS = {
    red: [255, 78, 108],
    blue: [92, 186, 255],
    white: [245, 248, 255]
  };

  let wavefronts = [];
  let lastTime = 0;
  let nextSpawnAt = 0;
  let smoothedEnergy = 0.22;
  let waveSequence = 0;
  let activeKey = "";
  const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  function normalizeHexColor(color) {
    if (typeof color !== "string" || !HEX_COLOR_PATTERN.test(color)) {
      return null;
    }

    if (color.length === 4) {
      return `#${color.slice(1).split("").map((channel) => channel + channel).join("")}`;
    }

    return color;
  }

  function getRippleFlowAudioMultiplier(settings = {}) {
    if (settings.sensitivity === "low") {
      return 2.2;
    }

    if (settings.sensitivity === "high") {
      return 4.4;
    }

    return 3.2;
  }

  function getRippleProfile(settings = {}) {
    if (settings.intensity === "low") {
      return {
        maxFronts: 5,
        segmentLength: 16,
        lineWidth: 1.5,
        baseSpeed: 64,
        audioBoost: 96,
        spawnInterval: 0.82,
        glow: 6,
        fadePower: 1.45,
        verticalPulse: 2.4,
        breakAmount: 0.06,
        alpha: 0.62
      };
    }

    if (settings.intensity === "high") {
      return {
        maxFronts: 8,
        segmentLength: 26,
        lineWidth: 2.25,
        baseSpeed: 92,
        audioBoost: 154,
        spawnInterval: 0.54,
        glow: 10,
        fadePower: 1.18,
        verticalPulse: 4.8,
        breakAmount: 0.13,
        alpha: 0.88
      };
    }

    return {
      maxFronts: 6,
      segmentLength: 20,
      lineWidth: 1.85,
      baseSpeed: 76,
      audioBoost: 124,
      spawnInterval: 0.66,
      glow: 8,
      fadePower: 1.3,
      verticalPulse: 3.4,
      breakAmount: 0.09,
      alpha: 0.74
    };
  }

  function resetWavefronts() {
    wavefronts = [];
    lastTime = 0;
    nextSpawnAt = 0;
    waveSequence = 0;
  }

  function ensureThemeState(width, height, settings) {
    const nextKey = `${Math.round(width)}:${Math.round(height)}:${settings.mode}`;

    if (activeKey === nextKey) {
      return;
    }

    activeKey = nextKey;
    resetWavefronts();
  }

  function createWavefront(time, profile) {
    const sequenceOffset = waveSequence % 4;
    waveSequence += 1;

    return {
      distance: 0,
      speedScale: 0.94 + sequenceOffset * 0.035,
      bornAt: time,
      phase: sequenceOffset * Math.PI * 0.5,
      alphaScale: 1 - sequenceOffset * 0.045,
      segmentScale: 1 - sequenceOffset * 0.035,
      maxDistancePadding: profile.segmentLength * 0.7
    };
  }

  function rgba(color, opacity) {
    const [r, g, b] = color;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  function mixChannel(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  // Returns either a plain [r,g,b] array (solid) or
  // { mode: "gradient", stops: [[r,g,b], ...] } for custom multi-color.
  function getRippleFlowColor(settings = {}) {
    if (settings.colorStyle === "custom" && Array.isArray(settings.customColors) && settings.customColors.length) {
      const stops = settings.customColors
        .map(c => {
          const norm = normalizeHexColor(c);
          if (!norm) return null;
          try { return hexToRgb(norm); } catch (_) { return null; }
        })
        .filter(Boolean);

      if (stops.length >= 2) {
        return { mode: "gradient", stops };
      }

      if (stops.length === 1) {
        return stops[0];
      }
    }

    return RIPPLE_FLOW_COLORS[settings.colorStyle] || RIPPLE_FLOW_COLORS.blue;
  }

  // Resolves a colorSpec at a normalised progress value [0, 1].
  // colorSpec is either a plain [r,g,b] (solid) or a gradient object.
  function resolveRippleColor(colorSpec, progress) {
    if (Array.isArray(colorSpec)) {
      return colorSpec;
    }

    const { stops } = colorSpec;
    const scaled = clamp01(progress) * (stops.length - 1);
    const indexA = Math.min(Math.floor(scaled), stops.length - 2);
    const indexB = indexA + 1;
    const blend = scaled - indexA;
    const a = stops[indexA];
    const b = stops[indexB];

    return [
      mixChannel(a[0], b[0], blend),
      mixChannel(a[1], b[1], blend),
      mixChannel(a[2], b[2], blend)
    ];
  }

  function drawVerticalSegment(context, x, y, length, color, opacity, profile, breakFactor, performanceMode = 'balanced') {
    const halfLength = length * 0.5;
    const gap = length * profile.breakAmount * breakFactor;

    context.strokeStyle = rgba(color, opacity);
    context.lineWidth = profile.lineWidth;
    context.lineCap = "round";

    applyOptimizedShadow(context, rgba(color, opacity), profile.glow * getPerformanceMultiplier(performanceMode), performanceMode);

    context.beginPath();
    context.moveTo(x, y - halfLength);
    context.lineTo(x, y - gap);
    context.moveTo(x, y + gap);
    context.lineTo(x, y + halfLength);
    context.stroke();
  }

  function drawHorizontalSegment(context, x, y, length, color, opacity, profile, breakFactor, performanceMode = 'balanced') {
    const halfLength = length * 0.5;
    const gap = length * profile.breakAmount * breakFactor;

    context.strokeStyle = rgba(color, opacity);
    context.lineWidth = profile.lineWidth;
    context.lineCap = "round";

    applyOptimizedShadow(context, rgba(color, opacity), profile.glow * getPerformanceMultiplier(performanceMode), performanceMode);

    context.beginPath();
    context.moveTo(x - halfLength, y);
    context.lineTo(x - gap, y);
    context.moveTo(x + gap, y);
    context.lineTo(x + halfLength, y);
    context.stroke();
  }

  function drawSideOrigin(context, width, height, color, profile, energy, performanceMode = 'balanced') {
    const centerY = height * 0.5;
    const opacity = clamp01(0.18 + energy * 0.32);
    const sourceLength = 8 + energy * 8;

    drawVerticalSegment(context, 2.5, centerY, sourceLength, color, opacity, profile, 0, performanceMode);
    drawVerticalSegment(context, width - 2.5, centerY, sourceLength, color, opacity, profile, 0, performanceMode);
  }

function drawBottomOrigin(context, width, height, color, profile, energy, performanceMode = 'balanced') {
    const centerX = width * 0.5;
    const opacity = clamp01(0.18 + energy * 0.32);
    const sourceLength = 10 + energy * 10;

    drawHorizontalSegment(context, centerX, height - 7, sourceLength, color, opacity, profile, 0, performanceMode);
  }

  function drawSideRipples(context, width, height, profile, colorSpec, performanceMode = 'balanced') {
    const centerY = height * 0.5;
    const maxDistance = centerY + profile.segmentLength;
    const leftX = 2.5;
    const rightX = width - 2.5;

    for (const front of wavefronts) {
      const fade = clamp01(1 - front.distance / maxDistance);
      const opacity = Math.pow(fade, profile.fadePower) * profile.alpha * front.alphaScale;
      const length = profile.segmentLength * front.segmentScale * (0.76 + smoothedEnergy * 0.42);
      const breakFactor = Math.sin(front.distance * 0.055 + front.phase) * 0.5 + 0.5;

      if (opacity <= 0.01) {
        continue;
      }

      // Resolve the color for this front based on how far it has travelled.
      const progress = clamp01(front.distance / maxDistance);
      const color = resolveRippleColor(colorSpec, progress);

      const upperY = centerY - front.distance;
      const lowerY = centerY + front.distance;

      if (upperY > -profile.segmentLength) {
        drawVerticalSegment(context, leftX, upperY, length, color, opacity, profile, breakFactor, performanceMode);
        drawVerticalSegment(context, rightX, upperY, length, color, opacity, profile, breakFactor, performanceMode);
      }

      if (lowerY < height + profile.segmentLength) {
        drawVerticalSegment(context, leftX, lowerY, length, color, opacity, profile, breakFactor, performanceMode);
        drawVerticalSegment(context, rightX, lowerY, length, color, opacity, profile, breakFactor, performanceMode);
      }
    }
  }

  function drawBottomRipples(context, width, height, time, profile, colorSpec, performanceMode = 'balanced') {
    const centerX = width * 0.5;
    const maxDistance = centerX + profile.segmentLength;
    const baseY = height - 7;

    for (const front of wavefronts) {
      const fade = clamp01(1 - front.distance / maxDistance);
      const opacity = Math.pow(fade, profile.fadePower) * profile.alpha * front.alphaScale;
      const length = profile.segmentLength * front.segmentScale * (0.82 + smoothedEnergy * 0.36);
      const breakFactor = Math.sin(front.distance * 0.045 + front.phase) * 0.5 + 0.5;

      if (opacity <= 0.01) {
        continue;
      }

      // Resolve the color for this front based on how far it has travelled.
      const progress = clamp01(front.distance / maxDistance);
      const color = resolveRippleColor(colorSpec, progress);

      const pulse = Math.sin(front.distance * 0.04 - time * 1.4 + front.phase);
      const y = baseY - pulse * profile.verticalPulse * fade * (0.55 + smoothedEnergy);
      const leftX = centerX - front.distance;
      const rightX = centerX + front.distance;

      if (leftX > -profile.segmentLength) {
        drawHorizontalSegment(context, leftX, y, length, color, opacity, profile, breakFactor, performanceMode);
      }

      if (rightX < width + profile.segmentLength) {
        drawHorizontalSegment(context, rightX, y, length, color, opacity, profile, breakFactor, performanceMode);
      }
    }
  }

  function updateWavefronts(time, delta, profile, maxDistance) {
    const speed = profile.baseSpeed + smoothedEnergy * profile.audioBoost;
    const spawnInterval = Math.max(0.26, profile.spawnInterval - smoothedEnergy * 0.22);

    if (time >= nextSpawnAt) {
      wavefronts.unshift(createWavefront(time, profile));
      nextSpawnAt = time + spawnInterval;
    }

    for (const front of wavefronts) {
      front.distance += delta * speed * front.speedScale;
    }

    wavefronts = wavefronts
      .filter((front) => front.distance <= maxDistance + front.maxDistancePadding)
      .slice(0, profile.maxFronts);
  }

  function drawRippleFlow(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;

    ensureThemeState(width, height, settings);

    const profile = getRippleProfile(settings);
    const colorSpec = getRippleFlowColor(settings);
    // Origin segments are always drawn at progress 0 (spawn point).
    const originColor = resolveRippleColor(colorSpec, 0);
    const delta = lastTime ? Math.min(0.05, Math.max(0.001, time - lastTime)) : 1 / 48;
    const targetEnergy = clamp01(smoothedLevel);

    // Local easing keeps propagation speed from jumping between frames.
    smoothedEnergy += (targetEnergy - smoothedEnergy) * 0.08;

    const maxDistance = settings.mode === "flatRipples"
      ? width * 0.5 + profile.segmentLength
      : height * 0.5 + profile.segmentLength;

    updateWavefronts(time, delta, profile, maxDistance);

    context.globalAlpha = 1;
    context.shadowBlur = 0;

    if (settings.mode === "flatRipples") {
      drawBottomOrigin(context, width, height, originColor, profile, smoothedEnergy, performanceMode);
      drawBottomRipples(context, width, height, time, profile, colorSpec, performanceMode);
    } else {
      drawSideOrigin(context, width, height, originColor, profile, smoothedEnergy, performanceMode);
      drawSideRipples(context, width, height, profile, colorSpec, performanceMode);
    }

    context.shadowBlur = 0;
    lastTime = time;
  }

  window.ParalineRippleFlow = {
    getRippleFlowAudioMultiplier,
    drawRippleFlow
  };
})();
