(() => {
  const {
    clamp01,
    getGlowMultiplier,
    hexToRgb,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  const EDGE_CRYSTALS_COLORS = {
    blue: {
      primary: [108, 194, 255],
      secondary: [54, 126, 235]
    },
    purple: {
      primary: [192, 142, 255],
      secondary: [126, 88, 226]
    },
    red: {
      primary: [255, 112, 134],
      secondary: [226, 58, 92]
    },
    white: {
      primary: [244, 248, 255],
      secondary: [190, 214, 240]
    }
  };

  let strokes = [];
  let activeKey = "";
  let lastTime = 0;
  let smoothedEnergy = 0.22;

  function getEdgeCrystalsAudioMultiplier(settings = {}) {
    let base = 3.1;
    if (settings.flutterStyle === "soft") base = 2.1;
    if (settings.flutterStyle === "energetic") base = 4.2;

    if (settings.flutterStyle === "custom" && typeof settings.customSensitivity === "number") {
      return base * (settings.customSensitivity / 30);
    }
    return base;
  }

  function getDensityProfile(settings = {}) {
    if (settings.density === "custom" && typeof settings.customGap === "number") {
      const count = Math.min(100, Math.max(5, Math.round(300 / settings.customGap)));
      return {
        countPerSide: count,
        gap: settings.customGap
      };
    }

    if (settings.density === "low") {
      return {
        countPerSide: 18,
        gap: 18
      };
    }

    if (settings.density === "high") {
      return {
        countPerSide: 38,
        gap: 9
      };
    }

    return {
      countPerSide: 28,
      gap: 13
    };
  }

  function getFlutterProfile(settings = {}) {
    if (settings.flutterStyle === "custom") {
      const sensScale = typeof settings.customSensitivity === "number" ? settings.customSensitivity / 30 : 1.0;
      const speedScale = typeof settings.customSpeed === "number" ? settings.customSpeed / 30 : 1.0;
      return {
        baseLength: 10 * sensScale,
        audioLengthBoost: 24 * sensScale,
        flutterAmplitude: 3.8 * sensScale,
        verticalFlutter: 2.1 * sensScale,
        speed: 2.5 * speedScale,
        lineWidth: 2.2,
        activationBoost: 0.26 * sensScale
      };
    }

    if (settings.flutterStyle === "soft") {
      return {
        baseLength: 8,
        audioLengthBoost: 18,
        flutterAmplitude: 2.6,
        verticalFlutter: 1.4,
        speed: 1.8,
        lineWidth: 2,
        activationBoost: 0.18
      };
    }

    if (settings.flutterStyle === "energetic") {
      return {
        baseLength: 12,
        audioLengthBoost: 30,
        flutterAmplitude: 5,
        verticalFlutter: 2.8,
        speed: 3.4,
        lineWidth: 2.4,
        activationBoost: 0.36
      };
    }

    return {
      baseLength: 10,
      audioLengthBoost: 24,
      flutterAmplitude: 3.8,
      verticalFlutter: 2.1,
      speed: 2.5,
      lineWidth: 2.2,
      activationBoost: 0.26
    };
  }

  function seededRandom(seed) {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function resetThemeState() {
    strokes = [];
    lastTime = 0;
    smoothedEnergy = 0.22;
  }

  function createStroke(side, index, width, height, profile, verticalInset) {
    const seed = index + (side === "left" ? 1.7 : 9.4);
    const randomA = seededRandom(seed);
    const randomB = seededRandom(seed + 2.1);
    const randomC = seededRandom(seed + 4.8);
    const randomD = seededRandom(seed + 7.3);
    const safeHeight = Math.max(1, height - verticalInset * 2);

    return {
      side,
      yBase: verticalInset + randomA * safeHeight,
      phase: randomB * Math.PI * 2,
      speedSeed: 0.85 + randomC * 0.6,
      amplitudeSeed: 0.72 + randomD * 0.7,
      activationSeed: randomA,
      tiltSeed: randomC * 2 - 1,
      lengthSeed: 0.7 + randomB * 0.75,
      opacitySeed: 0.68 + randomD * 0.32
    };
  }

  function ensureThemeState(width, height, settings) {
    const densityProfile = getDensityProfile(settings);
    const nextKey = [
      Math.round(width),
      Math.round(height),
      settings.density,
      settings.edgeMode
    ].join(":");

    if (activeKey === nextKey) {
      return;
    }

    activeKey = nextKey;
    resetThemeState();

    const verticalInset = 24;
    strokes = [];

    for (let index = 0; index < densityProfile.countPerSide; index++) {
      strokes.push(createStroke("left", index, width, height, densityProfile, verticalInset));
      strokes.push(createStroke("right", index, width, height, densityProfile, verticalInset));
    }
  }

  function shouldDrawSide(settings, side) {
    if (settings.edgeMode === "left") {
      return side === "left";
    }

    if (settings.edgeMode === "right") {
      return side === "right";
    }

    return true;
  }

  function rgba(color, opacity) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
  }

  function drawStroke(context, stroke, width, time, energy, profile, colors, glowMultiplier, performanceMode = 'balanced') {
    if (!shouldDrawSide(profile.settings, stroke.side)) {
      return;
    }

    const phase = time * profile.speed * stroke.speedSeed + stroke.phase;
    const activityWave = Math.sin(phase * 0.7 + stroke.activationSeed * Math.PI * 2) * 0.5 + 0.5;
    const activation = clamp01((0.16 + energy * (0.66 + profile.activationBoost)) - stroke.activationSeed * 0.46 + activityWave * 0.34);

    if (activation <= 0.06) {
      return;
    }

    const flutterX = Math.sin(phase * 1.6) * profile.flutterAmplitude * stroke.amplitudeSeed * (0.35 + energy * 0.9);
    const flutterY = Math.sin(phase * 1.1 + stroke.phase * 0.8) * profile.verticalFlutter * stroke.amplitudeSeed * (0.28 + energy * 0.55);
    const length = (profile.baseLength + energy * profile.audioLengthBoost) * stroke.lengthSeed * (0.62 + activation * 0.55);
    const opacity = clamp01((0.18 + activation * 0.64 + energy * 0.16) * stroke.opacitySeed);
    const y = stroke.yBase + flutterY;
    const edgeX = stroke.side === "left" ? 2.5 : width - 2.5;
    const inward = stroke.side === "left" ? 1 : -1;
    const startX = edgeX + inward * flutterX * 0.32;
    const endX = edgeX + inward * (length + flutterX);
    const tilt = stroke.tiltSeed * (0.5 + energy * 1.2);
    const startY = y - tilt;
    const endY = y + tilt;
    
    let color;
    if (colors.mode === "palette") {
      const colorIndex = Math.floor(stroke.activationSeed * colors.colors.length);
      color = colors.colors[colorIndex];
    } else {
      color = activation > 0.58 ? colors.primary : colors.secondary;
    }
    
    const strokeColor = rgba(color, opacity);

    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.strokeStyle = strokeColor;
    context.lineWidth = profile.lineWidth;
    applyOptimizedShadow(context, strokeColor, (4.5 + activation * 7 + energy * 6) * glowMultiplier * getPerformanceMultiplier(performanceMode), performanceMode);
    context.stroke();
  }

  function getEdgeCrystalsSettingsColor(settings) {
    if (settings.colorStyle === "custom" && Array.isArray(settings.customColors)) {
      return {
        mode: "palette",
        colors: settings.customColors.map(hexToRgb)
      };
    }
    return EDGE_CRYSTALS_COLORS[settings.colorStyle] || EDGE_CRYSTALS_COLORS.blue;
  }

  function drawEdgeCrystals(options) {
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

    const targetEnergy = clamp01(smoothedLevel);
    const smoothing = targetEnergy > smoothedEnergy ? 0.18 : 0.08;
    smoothedEnergy += (targetEnergy - smoothedEnergy) * smoothing;

    const profile = getFlutterProfile(settings);
    profile.settings = settings;
    const glowMultiplier = getGlowMultiplier(settings.glowStrength);
    const colors = getEdgeCrystalsSettingsColor(settings);

    context.globalAlpha = 1;
    context.lineCap = "round";

    for (const stroke of strokes) {
      drawStroke(context, stroke, width, time, smoothedEnergy, profile, colors, glowMultiplier, performanceMode);
    }

    context.shadowBlur = 0;
    lastTime = time;
  }

  window.ParalineEdgeCrystals = {
    getEdgeCrystalsAudioMultiplier,
    drawEdgeCrystals
  };
})();
