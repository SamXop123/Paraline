(() => {
  const {
    clamp01,
    hexToRgb,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  const RIPPLE_COLORS = {
    red: {
      mode: "solid",
      color: [255, 64, 96]
    },
    blue: {
      mode: "solid",
      color: [84, 196, 255]
    },
    white: {
      mode: "solid",
      color: [245, 248, 255]
    },
    multicolor: {
      mode: "palette",
      colors: [
        [255, 72, 108],
        [84, 144, 255],
        [245, 248, 255],
        [86, 246, 255],
        [255, 110, 232]
      ]
    }
  };

  const ENERGY_ATTACK = 0.28;
  const ENERGY_RELEASE = 0.08;
  const SPEED_SMOOTHING = 0.16;
  const MAX_AUDIO_LEVEL = 0.72;

  let localAudioLevel = 0.24;
  let localSpeed = 0;
  let travelDistance = 0;
  let lastMotionTime = 0;

  function getFlatRipplesAudioMultiplier(settings = {}) {
    let base = 2.3;
    if (settings.speed === "energetic") base = 3.5;
    if (settings.speed === "balanced") base = 2.9;
    if (settings.speed === "custom" && typeof settings.customSpeed === "number") {
      base = 2.9 * (settings.customSpeed / 30);
    }

    if (settings.intensity === "custom" && typeof settings.customSensitivity === "number") {
      return base * (settings.customSensitivity / 30);
    }
    return base;
  }

  function easeAudioLevel(value) {
    return Math.sqrt(clamp01(value / MAX_AUDIO_LEVEL));
  }

  function getRippleProfile(settings = {}) {
    const thickness = typeof settings.customThickness === "number" ? settings.customThickness : null;

    if (settings.intensity === "custom" && typeof settings.customSensitivity === "number") {
      const scale = settings.customSensitivity / 30;
      return {
        amplitude: 16 * scale,
        trailGap: 20,
        lineWidth: thickness ?? 2,
        glow: 8 * scale,
        frontWidth: 50 * scale,
        baseSpeed: 34 * scale,
        alpha: clamp01(0.8 * scale)
      };
    }

    if (settings.intensity === "low") {
      return {
        amplitude: 11,
        trailGap: 22,
        lineWidth: thickness ?? 1.7,
        glow: 6,
        frontWidth: 44,
        baseSpeed: 28,
        alpha: 0.72
      };
    }

    if (settings.intensity === "high") {
      return {
        amplitude: 22,
        trailGap: 18,
        lineWidth: thickness ?? 2.3,
        glow: 10,
        frontWidth: 58,
        baseSpeed: 42,
        alpha: 0.9
      };
    }

    return {
      amplitude: 16,
      trailGap: 20,
      lineWidth: thickness ?? 2,
      glow: 8,
      frontWidth: 50,
      baseSpeed: 34,
      alpha: 0.8
    };
  }

  function getSpeedProfile(settings = {}) {
    if (settings.speed === "custom" && typeof settings.customSpeed === "number") {
      const scale = settings.customSpeed / 30;
      return {
        base: 0.5 * scale,
        audioBoost: 24 * scale
      };
    }

    if (settings.speed === "energetic") {
      return {
        base: 0.68,
        audioBoost: 34
      };
    }

    if (settings.speed === "balanced") {
      return {
        base: 0.5,
        audioBoost: 24
      };
    }

    return {
      base: 0.36,
      audioBoost: 15
    };
  }

  function mixChannel(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function getPulseLinesSettingsColor(settings) {
    if (settings.colorStyle === "custom" && Array.isArray(settings.customColors)) {
      return {
        mode: "palette",
        colors: settings.customColors.map(hexToRgb)
      };
    }
    return RIPPLE_COLORS[settings.colorStyle] || RIPPLE_COLORS.blue;
  }

  function resolveRippleColor(settings, normalizedPosition, opacity) {
    const style = getPulseLinesSettingsColor(settings);

    if (style.mode === "solid") {
      const [r, g, b] = style.color;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    const palette = style.colors;
    const scaled = normalizedPosition * (palette.length - 1);
    const indexA = Math.floor(scaled) % palette.length;
    const indexB = (indexA + 1) % palette.length;
    const blend = scaled - Math.floor(scaled);
    const colorA = palette[indexA];
    const colorB = palette[indexB];
    const r = mixChannel(colorA[0], colorB[0], blend);
    const g = mixChannel(colorA[1], colorB[1], blend);
    const b = mixChannel(colorA[2], colorB[2], blend);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  function getWrappedFrontDistance(distance, maxDistance) {
    if (maxDistance <= 0) {
      return 0;
    }

    return distance % maxDistance;
  }

  function updateMotionState(time, rawLevel, profile) {
    const delta = lastMotionTime
      ? Math.min(0.05, Math.max(0.001, time - lastMotionTime))
      : 1 / 48;
    const easedLevel = easeAudioLevel(rawLevel);
    const energyResponse = easedLevel > localAudioLevel ? ENERGY_ATTACK : ENERGY_RELEASE;

    localAudioLevel += (easedLevel - localAudioLevel) * energyResponse;

    const targetSpeed = profile.baseSpeed * profile.speedScale + localAudioLevel * profile.audioSpeedBoost;

    localSpeed += (targetSpeed - localSpeed) * SPEED_SMOOTHING;
    travelDistance += delta * localSpeed;
    lastMotionTime = time;

    return {
      delta,
      level: localAudioLevel,
      distance: travelDistance
    };
  }

  function getFrontEnvelope(distance, frontDistance, frontWidth) {
    const delta = Math.abs(distance - frontDistance);
    return Math.exp(-(delta * delta) / (2 * frontWidth * frontWidth));
  }

  function drawVerticalRippleLine(context, xBase, height, time, smoothedLevel, profile, color, flip = 1, performanceMode = 'balanced') {
    const centerY = height * 0.5;
    const maxDistance = centerY + profile.frontWidth * 1.2;
    const frontDistance = getWrappedFrontDistance(profile.travelDistance, maxDistance);
    const step = 8;
    const waveAmplitude = profile.amplitude * (0.45 + smoothedLevel * 0.95);
    const breakStrength = 0.03;

    context.beginPath();

    for (let y = 0; y <= height; y += step) {
      const distanceFromCenter = Math.abs(y - centerY);
      const frontEnvelope = getFrontEnvelope(distanceFromCenter, frontDistance, profile.frontWidth);
      const tailEnvelope = getFrontEnvelope(distanceFromCenter, Math.max(0, frontDistance - profile.trailGap), profile.frontWidth * 1.18) * 0.45;
      const rippleEnvelope = clamp01(frontEnvelope + tailEnvelope);
      const mainWave = Math.sin(distanceFromCenter * 0.13 - frontDistance * 0.08);
      const supportWave = Math.sin(distanceFromCenter * 0.065 - frontDistance * 0.045) * 0.4;
      const signedWave = (mainWave + supportWave) * rippleEnvelope;
      const subtleBreak = Math.sin(y * 0.032 + time * 3.2) * breakStrength;
      const x = xBase + flip * waveAmplitude * (signedWave + subtleBreak);

      if (y === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.lineWidth = profile.lineWidth;
    context.strokeStyle = color;
    applyOptimizedShadow(context, color, profile.glow * (0.9 + smoothedLevel * 0.85) * getPerformanceMultiplier(performanceMode), performanceMode);
    context.stroke();
  }

  function drawHorizontalRippleLine(context, width, yBase, time, smoothedLevel, profile, color, performanceMode = 'balanced') {
    const centerX = width * 0.5;
    const maxDistance = centerX + profile.frontWidth * 1.2;
    const frontDistance = getWrappedFrontDistance(profile.travelDistance, maxDistance);
    const step = 10;
    const waveAmplitude = profile.amplitude * (0.45 + smoothedLevel * 1.05);
    const breakStrength = 0.028;

    context.beginPath();

    for (let x = 0; x <= width; x += step) {
      const distanceFromCenter = Math.abs(x - centerX);
      const frontEnvelope = getFrontEnvelope(distanceFromCenter, frontDistance, profile.frontWidth);
      const tailEnvelope = getFrontEnvelope(distanceFromCenter, Math.max(0, frontDistance - profile.trailGap), profile.frontWidth * 1.2) * 0.42;
      const rippleEnvelope = clamp01(frontEnvelope + tailEnvelope);
      const mainWave = Math.sin(distanceFromCenter * 0.12 - frontDistance * 0.078);
      const supportWave = Math.sin(distanceFromCenter * 0.056 - frontDistance * 0.04) * 0.42;
      const signedWave = (mainWave + supportWave) * rippleEnvelope;
      const subtleBreak = Math.sin(x * 0.02 + time * 3.1) * breakStrength;
      const y = yBase - waveAmplitude * (signedWave + subtleBreak);

      if (x === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.lineWidth = profile.lineWidth;
    context.strokeStyle = color;
    applyOptimizedShadow(context, color, profile.glow * (0.95 + smoothedLevel * 0.9) * getPerformanceMultiplier(performanceMode), performanceMode);
    context.stroke();
  }

  function drawSideRipples(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;
    const profile = getRippleProfile(settings);
    const speedProfile = getSpeedProfile(settings);
    profile.speedScale = speedProfile.base;
    profile.audioSpeedBoost = speedProfile.audioBoost;
    const motion = updateMotionState(time, smoothedLevel, profile);
    profile.travelDistance = motion.distance;
    const leftBase = 4;
    const rightBase = width - 4;
    const isMulticolor = settings.colorStyle === "multicolor";
    const primaryColor = resolveRippleColor(settings, 0.12, Math.min(1, profile.alpha * (isMulticolor ? 1.16 : 1.06)));
    const echoColor = resolveRippleColor(settings, 0.78, profile.alpha * (isMulticolor ? 0.78 : 0.64));

    drawVerticalRippleLine(context, leftBase, height, time, motion.level, profile, primaryColor, 1, performanceMode);
    drawVerticalRippleLine(context, rightBase, height, time, motion.level, profile, primaryColor, -1, performanceMode);

    const echoProfile = {
      ...profile,
      lineWidth: Math.max(1, profile.lineWidth * 0.72),
      glow: profile.glow * (isMulticolor ? 1.12 : 0.88),
      amplitude: profile.amplitude * 0.72,
      frontWidth: profile.frontWidth * 0.82,
      baseSpeed: profile.baseSpeed * 0.94,
      speedScale: profile.speedScale,
      audioSpeedBoost: profile.audioSpeedBoost * 0.92,
      travelDistance: profile.travelDistance + profile.trailGap * 0.7,
      trailGap: profile.trailGap * 1.12
    };

    drawVerticalRippleLine(context, leftBase, height, time + 0.14, motion.level, echoProfile, echoColor, 1, performanceMode);
    drawVerticalRippleLine(context, rightBase, height, time + 0.14, motion.level, echoProfile, echoColor, -1, performanceMode);
  }

  function drawBottomRipples(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;
    const profile = getRippleProfile(settings);
    const speedProfile = getSpeedProfile(settings);
    profile.speedScale = speedProfile.base;
    profile.audioSpeedBoost = speedProfile.audioBoost;
    const motion = updateMotionState(time, smoothedLevel, profile);
    profile.travelDistance = motion.distance;
    const yBase = height - 3;
    const isMulticolor = settings.colorStyle === "multicolor";
    const primaryColor = resolveRippleColor(settings, 0.22, Math.min(1, profile.alpha * (isMulticolor ? 1.16 : 1.06)));
    const echoColor = resolveRippleColor(settings, 0.82, profile.alpha * (isMulticolor ? 0.78 : 0.64));

    drawHorizontalRippleLine(context, width, yBase, time, motion.level, profile, primaryColor, performanceMode);

    const echoProfile = {
      ...profile,
      lineWidth: Math.max(1, profile.lineWidth * 0.74),
      glow: profile.glow * (isMulticolor ? 1.14 : 0.9),
      amplitude: profile.amplitude * 0.7,
      frontWidth: profile.frontWidth * 0.84,
      baseSpeed: profile.baseSpeed * 0.95,
      speedScale: profile.speedScale,
      audioSpeedBoost: profile.audioSpeedBoost * 0.92,
      travelDistance: profile.travelDistance + profile.trailGap * 0.68,
      trailGap: profile.trailGap * 1.1
    };

    drawHorizontalRippleLine(context, width, yBase, time + 0.14, motion.level, echoProfile, echoColor, performanceMode);
  }

  function drawFlatRipples(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;

    context.globalAlpha = 1;
    context.shadowBlur = 0;

    if (settings.mode === "flatRipples") {
      drawBottomRipples({
        context,
        width,
        height,
        time,
        smoothedLevel,
        settings,
        performanceMode
      });
      return;
    }

    drawSideRipples({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode
    });
  }

  window.ParalineFlatRipples = {
    getFlatRipplesAudioMultiplier,
    drawFlatRipples
  };
})();
