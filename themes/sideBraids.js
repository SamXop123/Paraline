(() => {
  const {
    clamp01,
    getGlowMultiplier,
    hexToRgb,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  // ========================================
  // COLOR PALETTES
  // ========================================

  const BRAID_PALETTES = {
    cyanPink: {
      colors: [
        [0, 229, 255],
        [255, 45, 123],
        [0, 188, 255],
        [255, 100, 170],
        [60, 220, 255]
      ]
    },
    bluePurple: {
      colors: [
        [74, 125, 255],
        [180, 74, 255],
        [100, 150, 255],
        [210, 110, 255],
        [60, 100, 240]
      ]
    },
    redBlue: {
      colors: [
        [255, 51, 102],
        [51, 102, 255],
        [255, 80, 130],
        [80, 130, 255],
        [255, 60, 110]
      ]
    },
    white: {
      colors: [
        [245, 248, 255],
        [255, 245, 240],
        [240, 248, 255],
        [255, 250, 245],
        [248, 248, 255]
      ]
    }
  };

  // ========================================
  // AUDIO SMOOTHING STATE
  // ========================================

  const ENERGY_ATTACK = 0.22;
  const ENERGY_RELEASE = 0.06;
  const TENSION_ATTACK = 0.15;
  const TENSION_RELEASE = 0.04;
  const MAX_AUDIO = 0.68;

  let localAudioLevel = 0.2;
  let localTension = 0;
  let localSpeed = 0;
  let scrollOffset = 0;
  let lastTime = 0;
  let breathPhase = 0;

  // ========================================
  // SETTINGS RESOLVERS
  // ========================================

  function getSideBraidsAudioMultiplier(settings = {}) {
    if (settings.motionStyle === "custom" && typeof settings.customSensitivity === "number") {
      return 2.6 * (settings.customSensitivity / 30);
    }
    if (settings.motionStyle === "energetic") return 3.4;
    if (settings.motionStyle === "calm") return 1.9;
    return 2.6;
  }

  function getStringCount(settings = {}) {
    if (settings.braidDensity === "custom" && typeof settings.customGap === "number") {
      // Map customGap (2 to 30) inversely to string count (8 to 2)
      return Math.max(2, Math.min(8, Math.round(30 / ((settings.customGap || 7) + 1))));
    }
    if (settings.braidDensity === "sparse") return 3;
    if (settings.braidDensity === "dense") return 5;
    return 4;
  }

  function getMotionProfile(settings = {}) {
    if (settings.motionStyle === "custom") {
      const speedScale = typeof settings.customSpeed === "number" ? settings.customSpeed / 30 : 1.0;
      const sensScale = typeof settings.customSensitivity === "number" ? settings.customSensitivity / 30 : 1.0;

      return {
        baseSpeed: 18 * speedScale,
        audioSpeedBoost: 16 * sensScale * speedScale,
        baseAmplitude: 6.5 * sensScale,
        audioAmplitudeBoost: 4.5 * sensScale,
        tensionAmplitudeSqueeze: 2.4 * sensScale,
        frequency1: 0.020,
        frequency2: 0.0125,
        speedMult1: 0.75,
        speedMult2: 0.47,
        microIntensity: 0.8 * sensScale,
        driftRate: 0.17 * speedScale,
        breathRate: 0.45 * speedScale
      };
    }

    if (settings.motionStyle === "calm") {
      return {
        baseSpeed: 12,
        audioSpeedBoost: 10,
        baseAmplitude: 5,
        audioAmplitudeBoost: 3.5,
        tensionAmplitudeSqueeze: 1.8,
        frequency1: 0.018,
        frequency2: 0.011,
        speedMult1: 0.55,
        speedMult2: 0.34,
        microIntensity: 0.6,
        driftRate: 0.12,
        breathRate: 0.35
      };
    }

    if (settings.motionStyle === "energetic") {
      return {
        baseSpeed: 28,
        audioSpeedBoost: 22,
        baseAmplitude: 8,
        audioAmplitudeBoost: 5.5,
        tensionAmplitudeSqueeze: 3.0,
        frequency1: 0.022,
        frequency2: 0.014,
        speedMult1: 0.95,
        speedMult2: 0.62,
        microIntensity: 1.0,
        driftRate: 0.22,
        breathRate: 0.55
      };
    }

    // balanced
    return {
      baseSpeed: 18,
      audioSpeedBoost: 16,
      baseAmplitude: 6.5,
      audioAmplitudeBoost: 4.5,
      tensionAmplitudeSqueeze: 2.4,
      frequency1: 0.020,
      frequency2: 0.0125,
      speedMult1: 0.75,
      speedMult2: 0.47,
      microIntensity: 0.8,
      driftRate: 0.17,
      breathRate: 0.45
    };
  }

  function getLineWidth(settings = {}) {
    if (settings.braidWidth === "custom" && typeof settings.customThickness === "number") {
      // Map customThickness (1 to 20) to line width (0.3 to 6.0)
      return Math.max(0.3, settings.customThickness * 0.3);
    }
    if (settings.braidWidth === "thin") return 1.0;
    if (settings.braidWidth === "thick") return 2.2;
    return 1.5;
  }

  function getGlowProfile(settings = {}) {
    const m = getGlowMultiplier(settings.glowStrength);
    return {
      baseBlur: 6 * m,
      audioBlurBoost: 10 * m,
      baseAlpha: 0.55 + 0.12 * m,
      audioAlphaBoost: 0.22 * m
    };
  }

  function getPalette(settings = {}) {
    if (settings.colorStyle === "custom" && Array.isArray(settings.customColors)) {
      const mapped = settings.customColors.map(hexToRgb);
      if (mapped.length > 0) {
        const colors = [];
        for (let i = 0; i < 5; i++) {
          colors.push(mapped[i % mapped.length]);
        }
        return { colors };
      }
    }
    return BRAID_PALETTES[settings.colorStyle] || BRAID_PALETTES.cyanPink;
  }

  function isFlowReversed(settings = {}) {
    return settings.flowDirection === "bottomUp";
  }

  // ========================================
  // DEPTH LAYER PROFILES
  // ========================================
  // Each string gets a depth assignment:
  //   foreground — brighter, slightly faster, tighter motion
  //   background — dimmer, softer, slightly slower

  function getDepthLayer(stringIndex, stringCount) {
    // Alternate: even indices are foreground, odd are background
    // With 3 strings: fg, bg, fg
    // With 4 strings: fg, bg, fg, bg
    // With 5 strings: fg, bg, fg, bg, fg
    return stringIndex % 2 === 0 ? "foreground" : "background";
  }

  function getDepthModifiers(layer) {
    if (layer === "background") {
      return {
        alphaMult: 0.52,
        blurMult: 0.6,
        speedMult: 0.82,
        ampMult: 0.88,
        widthMult: 0.75,
        coreBrightness: 0.3
      };
    }
    // foreground
    return {
      alphaMult: 1.0,
      blurMult: 1.0,
      speedMult: 1.0,
      ampMult: 1.0,
      widthMult: 1.0,
      coreBrightness: 0.55
    };
  }

  // ========================================
  // AUDIO + TENSION STATE UPDATE
  // ========================================

  function updateAudioState(time, rawLevel, motion) {
    const delta = lastTime
      ? Math.min(0.05, Math.max(0.001, time - lastTime))
      : 1 / 48;

    const easedLevel = Math.sqrt(clamp01(rawLevel / MAX_AUDIO));

    // Smooth audio level
    const response = easedLevel > localAudioLevel ? ENERGY_ATTACK : ENERGY_RELEASE;
    localAudioLevel += (easedLevel - localAudioLevel) * response;

    // Tension: follows audio but with even heavier smoothing
    // Tension affects frequency tightening and crossing compression
    const tensionResponse = easedLevel > localTension ? TENSION_ATTACK : TENSION_RELEASE;
    localTension += (easedLevel - localTension) * tensionResponse;

    // Scroll speed with audio influence
    const targetSpeed = motion.baseSpeed + localAudioLevel * motion.audioSpeedBoost;
    localSpeed += (targetSpeed - localSpeed) * 0.12;
    scrollOffset += delta * localSpeed;

    // Breathing: slow organic pulse independent of audio
    breathPhase += delta * motion.breathRate;

    lastTime = time;

    return {
      level: localAudioLevel,
      tension: localTension,
      delta,
      breath: Math.sin(breathPhase) * 0.5 + 0.5
    };
  }

  // ========================================
  // ORGANIC NOISE FUNCTION
  // ========================================
  // Layered sine waves with irrational frequency ratios
  // to produce non-repeating organic micro-movement

  function organicNoise(y, time, seed) {
    const a = Math.sin(y * 0.047 + time * 1.73 + seed * 2.31) * 0.40;
    const b = Math.sin(y * 0.031 + time * 2.51 + seed * 4.67) * 0.30;
    const c = Math.sin(y * 0.073 + time * 0.87 + seed * 1.13) * 0.20;
    const d = Math.sin(y * 0.019 + time * 3.19 + seed * 3.41) * 0.10;
    return a + b + c + d;
  }

  // ========================================
  // PATH GENERATION
  // ========================================

  function computeStringPath(height, stringIndex, stringCount, motion, audio, time, edgeBaseX, flipX, flowDir, depthMods) {
    const step = 5;
    const points = [];
    const totalPoints = Math.ceil(height / step) + 1;

    const N = stringCount;
    const phaseBase = stringIndex * (Math.PI * 2 / N);
    const phaseBase2 = stringIndex * (Math.PI * 2 / N) + Math.PI * 0.37;

    // Time-varying phase drift: slowly evolving phase offset
    // Uses irrational-ish multipliers so it never repeats
    const drift1 = Math.sin(time * motion.driftRate * 0.713 + stringIndex * 1.91) * 0.45;
    const drift2 = Math.sin(time * motion.driftRate * 0.419 + stringIndex * 2.73) * 0.35;

    // Audio-reactive amplitude with tension squeeze
    // Higher tension = slightly tighter, more compressed motion
    const tensionSqueeze = 1.0 - audio.tension * (motion.tensionAmplitudeSqueeze / (motion.baseAmplitude + motion.audioAmplitudeBoost));
    const amplitude = (motion.baseAmplitude + audio.level * motion.audioAmplitudeBoost) * Math.max(0.4, tensionSqueeze);

    // Breathing modulation: gentle ±12% amplitude swell
    const breathMod = 1.0 + (audio.breath - 0.5) * 0.24;

    // Per-string organic amplitude variation (subtle)
    const ampVariation = 1.0 + Math.sin(stringIndex * 1.618 + 0.5) * 0.1;

    const effectiveAmp = amplitude * ampVariation * breathMod * depthMods.ampMult;
    const secondaryAmp = effectiveAmp * 0.38;
    const microAmp = effectiveAmp * 0.18 * motion.microIntensity;

    // Time-varying frequency wobble: frequencies shift slightly over time
    const freqWobble1 = 1.0 + Math.sin(time * 0.13 + stringIndex * 2.0) * 0.06;
    const freqWobble2 = 1.0 + Math.sin(time * 0.09 + stringIndex * 1.4) * 0.08;

    const freq1 = motion.frequency1 * freqWobble1;
    const freq2 = motion.frequency2 * freqWobble2;

    // Speed modulated by depth layer
    const speedScale = depthMods.speedMult;

    for (let i = 0; i < totalPoints; i++) {
      const y = Math.min(i * step, height);

      const scrollPhase = scrollOffset * flowDir * 0.035;

      // Primary wave
      const wave1 = Math.sin(
        y * freq1 + time * motion.speedMult1 * flowDir * speedScale + phaseBase + drift1 + scrollPhase
      );

      // Secondary wave (different frequency for complexity)
      const wave2 = Math.sin(
        y * freq2 + time * motion.speedMult2 * flowDir * speedScale + phaseBase2 + drift2 + scrollPhase * 0.65
      );

      // Micro-oscillation: organic noise for liveliness
      const micro = organicNoise(y, time * speedScale, stringIndex) * microAmp;

      // Subtle acceleration/deceleration: velocity varies along the strand
      // Creates the feeling of tension points where strands momentarily slow
      const tensionPulse = Math.sin(y * 0.008 + time * 0.6 + stringIndex * 0.9) * 0.12 + 1.0;

      const xOffset = (wave1 * effectiveAmp + wave2 * secondaryAmp + micro) * flipX * tensionPulse;

      points.push({
        x: edgeBaseX + xOffset,
        y
      });
    }

    return points;
  }

  // ========================================
  // SMOOTH CATMULL-ROM SPLINE RENDERING
  // ========================================
  // Uses Catmull-Rom → cubic bezier conversion for C1-continuous
  // curves with no tangent discontinuities at joins.
  // Each string is drawn as ONE single continuous path.

  function drawSmoothPath(context, points) {
    const n = points.length;
    if (n < 2) return;

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    if (n === 2) {
      context.lineTo(points[1].x, points[1].y);
      context.stroke();
      return;
    }

    // Catmull-Rom spline with tension 0 (uniform), converted to cubic bezier.
    // For each segment between points[i] and points[i+1], we use
    // points[i-1] and points[i+2] as context for tangent computation.
    // Virtual endpoints are mirrored for the first and last segments.

    for (let i = 0; i < n - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[0];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < n - 2 ? points[i + 2] : points[n - 1];

      // Catmull-Rom tangents → cubic bezier control points
      // cp1 = p1 + (p2 - p0) / 6
      // cp2 = p2 - (p3 - p1) / 6
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    context.stroke();
  }

  // ========================================
  // CONTINUOUS-PATH BRAID RENDERING
  // WITH DEPTH LAYERING
  // ========================================
  // Every string is drawn as a single unbroken stroke.
  // No band segmentation. No sub-paths. No seams.
  // Crossing illusion comes from time-varying z-order of
  // complete paths + depth layering.

  function drawBraidSide(context, height, time, audio, motion, glow, palette, lineWidth, edgeBaseX, flipX, flowDir, stringCount, performanceMode = 'balanced') {
    const colors = palette.colors;

    // Compute all paths with depth layering
    const allPaths = [];
    const depthLayers = [];

    for (let i = 0; i < stringCount; i++) {
      const layer = getDepthLayer(i, stringCount);
      const depthMods = getDepthModifiers(layer);
      depthLayers.push({ layer, mods: depthMods });
      allPaths.push(
        computeStringPath(height, i, stringCount, motion, audio, time, edgeBaseX, flipX, flowDir, depthMods)
      );
    }

    const baseBlur = (glow.baseBlur + audio.level * glow.audioBlurBoost) * getPerformanceMultiplier(performanceMode);
    const baseAlpha = clamp01(glow.baseAlpha + audio.level * glow.audioAlphaBoost);

    // ── Compute draw order for crossing illusion ──
    // Each string gets a dynamic z-priority that evolves over time,
    // creating the visual impression that strings weave over/under
    // each other without needing to segment the paths.

    const drawOrder = [];
    for (let i = 0; i < stringCount; i++) {
      // Base layer priority: background strings drawn first
      const layerBase = depthLayers[i].layer === "background" ? 0 : 100;

      // Time-varying crossing offset: each string's z-priority oscillates
      // at its own rate, so strings periodically swap draw order
      const crossingCycle = Math.sin(
        time * 0.41 + i * (Math.PI * 2 / stringCount) + audio.tension * 1.5
      );
      // Slower secondary cycle for longer-period order changes
      const crossingCycle2 = Math.sin(
        time * 0.17 + i * 1.83 + flowDir * 0.5
      ) * 0.5;

      const zPriority = layerBase + (crossingCycle + crossingCycle2) * 10;

      drawOrder.push({ index: i, z: zPriority });
    }

    drawOrder.sort((a, b) => a.z - b.z);

    // ── Pass 0: Soft atmospheric underglow (all strings, back-to-front) ──

    for (const entry of drawOrder) {
      const i = entry.index;
      const colorIndex = i % colors.length;
      const [r, g, b] = colors[colorIndex];
      const dm = depthLayers[i].mods;
      const alpha = baseAlpha * dm.alphaMult;
      const blur = baseBlur * dm.blurMult;

      context.lineWidth = lineWidth * dm.widthMult * 2.8;
      context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.08})`;
      applyOptimizedShadow(context, `rgba(${r}, ${g}, ${b}, ${alpha * 0.2})`, blur * 1.4, performanceMode);
      context.globalAlpha = 1;
      context.lineCap = "round";
      context.lineJoin = "round";
      drawSmoothPath(context, allPaths[i]);
    }

    // ── Pass 1: Core lines (full continuous paths, z-ordered) ──

    for (const entry of drawOrder) {
      const i = entry.index;
      const colorIndex = i % colors.length;
      const [r, g, b] = colors[colorIndex];
      const dm = depthLayers[i].mods;
      const alpha = baseAlpha * dm.alphaMult;
      const blur = baseBlur * dm.blurMult;

      context.lineWidth = lineWidth * dm.widthMult;
      context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      applyOptimizedShadow(context, `rgba(${r}, ${g}, ${b}, ${alpha * 0.75})`, blur, performanceMode);
      context.globalAlpha = 1;
      context.lineCap = "round";
      context.lineJoin = "round";
      drawSmoothPath(context, allPaths[i]);
    }

    // ── Pass 2: Neon core highlight (depth-scaled brightness) ──

    for (const entry of drawOrder) {
      const i = entry.index;
      const dm = depthLayers[i].mods;
      if (dm.coreBrightness <= 0) continue;

      const colorIndex = i % colors.length;
      const [r, g, b] = colors[colorIndex];

      const coreR = Math.min(255, r + 70);
      const coreG = Math.min(255, g + 70);
      const coreB = Math.min(255, b + 70);

      const alpha = baseAlpha * dm.alphaMult * dm.coreBrightness;

      context.lineWidth = Math.max(0.5, lineWidth * dm.widthMult * 0.3);
      context.strokeStyle = `rgba(${coreR}, ${coreG}, ${coreB}, ${alpha})`;
      context.shadowColor = `rgba(${r}, ${g}, ${b}, 0)`;
      context.shadowBlur = 0;
      context.globalAlpha = 1;
      drawSmoothPath(context, allPaths[i]);
    }
  }

  // ========================================
  // MAIN DRAW FUNCTION
  // ========================================

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

    const motion = getMotionProfile(settings);
    const glow = getGlowProfile(settings);
    const palette = getPalette(settings);
    const lineWidth = getLineWidth(settings);
    const stringCount = getStringCount(settings);
    const reversed = isFlowReversed(settings);

    const audio = updateAudioState(time, smoothedLevel, motion);

    context.globalAlpha = 1;
    context.shadowBlur = 0;
    context.lineCap = "round";
    context.lineJoin = "round";

    // Tighter edge positioning: strands hug the edges
    const edgeInset = 8;
    const leftBaseX = edgeInset;
    const rightBaseX = width - edgeInset;

    const leftFlowDir = reversed ? 1 : -1;
    const rightFlowDir = reversed ? -1 : 1;

    // Left side
    drawBraidSide(
      context, height, time, audio, motion, glow, palette,
      lineWidth, leftBaseX, 1, leftFlowDir, stringCount, performanceMode
    );

    // Right side
    drawBraidSide(
      context, height, time, audio, motion, glow, palette,
      lineWidth, rightBaseX, -1, rightFlowDir, stringCount, performanceMode
    );

    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }

  // ========================================
  // EXPORT
  // ========================================

  window.ParalineSideBraids = {
    getSideBraidsAudioMultiplier,
    drawSideBraids
  };
})();
