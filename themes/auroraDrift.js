(() => {
  // ============================================================
  //  AURORA DRIFT — Phase 2: Core Visual Engine (Musical Intelligence Refined)
  //  A cinematic, atmospheric aurora borealis visualizer that rises
  //  from the bottom edge of the screen like translucent
  //  northern-lights curtains made of cosmic plasma, emotionally
  //  and physically synchronized to music using advanced signal filters.
  //
  //  Refined for maximum desktop readability, staying weightless and
  //  airy in the lower portion of the screen, channeling dynamic
  //  energy internally through rich folds, sways, and shimmers.
  // ============================================================

  // ----- Future-Proof Configurations -----
  const CONFIG = {
    intensity: 1.0,      // overall scaling of height/amplitude
    turbulence: 1.0,     // intensity of folding and twists
    glow: 1.0,           // opacity and shadowBlur scale
    speed: 1.05,          // global movement rate
    colorPalette: "cyanViolet",
    layerDensity: "balanced",
  };

  // ----- Aurora ribbon layer definitions -----
  const AURORA_LAYERS = [
    // Layer 0: Deep background haze — widest, slowest, most transparent, very blurry
    {
      baseAmplitude: 20,
      frequency: 0.0016,
      speed: 0.04,
      turbulenceFreq: 0.0035,
      turbulenceSpeed: 0.03,
      maxHeight: 0.28,      // fraction of screen height
      opacity: 0.04,
      blur: 50,
      colorOffset: 0.0,
      widthScale: 1.0,
    },
    // Layer 1: Mid-background glow
    {
      baseAmplitude: 24,
      frequency: 0.0022,
      speed: 0.06,
      turbulenceFreq: 0.0048,
      turbulenceSpeed: 0.045,
      maxHeight: 0.24,
      opacity: 0.06,
      blur: 36,
      colorOffset: 0.12,
      widthScale: 1.0,
    },
    // Layer 2: Primary curtain — the main visible ribbon
    {
      baseAmplitude: 30,
      frequency: 0.0028,
      speed: 0.08,
      turbulenceFreq: 0.0055,
      turbulenceSpeed: 0.06,
      maxHeight: 0.21,
      opacity: 0.09,
      blur: 24,
      colorOffset: 0.25,
      widthScale: 1.0,
    },
    // Layer 3: Bright accent curtain
    {
      baseAmplitude: 26,
      frequency: 0.0035,
      speed: 0.10,
      turbulenceFreq: 0.007,
      turbulenceSpeed: 0.075,
      maxHeight: 0.18,
      opacity: 0.11,
      blur: 16,
      colorOffset: 0.42,
      widthScale: 0.94,
    },
    // Layer 4: Crisp detail ribbon — thinner, sharper, faster
    {
      baseAmplitude: 22,
      frequency: 0.0044,
      speed: 0.12,
      turbulenceFreq: 0.009,
      turbulenceSpeed: 0.09,
      maxHeight: 0.15,
      opacity: 0.08,
      blur: 9,
      colorOffset: 0.65,
      widthScale: 0.88,
    },
    // Layer 5: Topmost ethereal wisps
    {
      baseAmplitude: 16,
      frequency: 0.0055,
      speed: 0.15,
      turbulenceFreq: 0.011,
      turbulenceSpeed: 0.11,
      maxHeight: 0.12,
      opacity: 0.05,
      blur: 5,
      colorOffset: 0.82,
      widthScale: 0.80,
    }
  ];

  // ----- Beautiful Color Palettes Map -----
  const PALETTES = {
    cyanViolet: [
      [185, 82, 45],   // Vibrant Cyan
      [210, 76, 46],   // Neon Blue
      [255, 68, 52],   // Ethereal Violet
      [285, 62, 50],   // Celestial Purple
      [320, 52, 52],   // Soft Magenta
      [285, 62, 50],   // Celestial Purple (loop back)
      [255, 68, 52],   // Ethereal Violet (loop back)
      [210, 76, 46],   // Neon Blue (loop back)
    ],
    emeraldSky: [
      [142, 85, 48],   // Deep Emerald Green
      [165, 78, 46],   // Electric Teal / Mint
      [185, 82, 45],   // Vibrant Cyan
      [165, 78, 46]    // Loop back
    ],
    sunsetDream: [
      [330, 85, 55],   // Pink/Peach
      [25, 90, 55],    // Orange
      [275, 75, 52],   // Celestial Purple
      [25, 90, 55]     // Loop back
    ],
    frozenBlue: [
      [205, 85, 55],   // Ice Blue
      [190, 80, 65],   // Pale Cyan
      [215, 60, 75],   // White-Blue
      [190, 80, 65]    // Loop back
    ],
    monochrome: [
      [0, 0, 90],      // Soft White
      [210, 8, 75],    // Silver Glow
      [220, 5, 85],    // Grey-White
      [210, 8, 75]     // Loop back
    ]
  };

  // ----- Persistent Theme State (IIFE Closure Scope) -----
  let lastTime = 0;
  let localAudioLevel = 0.20;
  let bassLevelState = 0.20;
  let midLevelState = 0.20;
  let midVariance = 0.05;
  let shimmerLevelState = 0.05;
  let averageVolume = 0.25;
  let globalDriftPhase = 0;
  let energyFlowOffset = 0;

  // Physics-based traveling shockwaves array
  let activePulses = [];
  let lastPulseTime = 0;

  // ----- Interpolation helpers -----

  function lerpHSL(a, b, t) {
    // Shortest-path hue interpolation
    let dh = b[0] - a[0];
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
    return [
      (a[0] + dh * t + 360) % 360,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  function getAuroraColor(palettePosition, palette) {
    const count = palette.length;
    const scaled = ((palettePosition % 1) + 1) % 1 * (count - 1);
    const idx = Math.floor(scaled);
    const frac = scaled - idx;
    const a = palette[idx];
    const b = palette[Math.min(idx + 1, count - 1)];
    return lerpHSL(a, b, frac);
  }

  function hexToHsl(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [
      Math.round(h * 360),
      Math.round(s * 100),
      Math.round(l * 100)
    ];
  }

  function getAuroraColorStops(position, stops) {
    const t = ((position % 1) + 1) % 1;
    if (t <= stops[0].pos) return stops[0].hsl;
    if (t >= stops[stops.length - 1].pos) return stops[stops.length - 1].hsl;
    
    for (let i = 0; i < stops.length - 1; i++) {
      const curr = stops[i];
      const next = stops[i + 1];
      if (t >= curr.pos && t <= next.pos) {
        const frac = (t - curr.pos) / (next.pos - curr.pos);
        return lerpHSL(curr.hsl, next.hsl, frac);
      }
    }
    return stops[0].hsl;
  }

  function hsla(hsl, alpha) {
    return `hsla(${hsl[0].toFixed(1)}, ${hsl[1].toFixed(1)}%, ${hsl[2].toFixed(1)}%, ${alpha})`;
  }

  // ----- Core drawing -----

  function drawAuroraDrift(options) {
    const {
      context: ctx,
      width,
      height,
      time,
      smoothedLevel
    } = options;

    // Resolve user-defined configurations or fall back to theme defaults
    const settings = options.settings || {};

    // 1. Resolve Style modifiers
    const style = settings.auroraStyle || "cinematic";
    let styleSpeed = 1.0;
    let styleTurbulence = 1.0;
    let styleGlow = 1.0;
    let styleAudio = 1.0;
    let styleSoftness = 1.0;
    if (style === "ambient") {
      styleSpeed = 0.5;
      styleTurbulence = 0.65;
      styleGlow = 0.7;
      styleAudio = 0.5;
    } else if (style === "energetic") {
      styleSpeed = 1.4;
      styleTurbulence = 1.5;
      styleGlow = 1.35;
      styleAudio = 1.5;
      styleSoftness = 0.85;
    }

    // 2. Resolve Intensity modifiers
    const intensity = settings.intensity || "balanced";
    let intensityFactor = 1.0;
    let opacityCap = 0.12;
    if (intensity === "subtle") {
      intensityFactor = 0.5;
      opacityCap = 0.06;
    } else if (intensity === "vivid") {
      intensityFactor = 1.5;
      opacityCap = 0.20;
    }

    // 3. Resolve Height modifiers
    const heightSetting = settings.height || "medium";
    let heightMultiplier = 0.85;
    if (heightSetting === "low") {
      heightMultiplier = 0.55;
    } else if (heightSetting === "tall") {
      heightMultiplier = 1.35;
    }

    // 4. Resolve Glow Strength modifiers
    const glowSetting = settings.glowStrength || "medium";
    let glowMultiplier = 1.0;
    if (glowSetting === "soft") {
      glowMultiplier = 0.45;
    } else if (glowSetting === "strong") {
      glowMultiplier = 1.5;
    }

    // 5. Resolve Motion Speed modifiers
    const speedSetting = settings.motionSpeed || "balanced";
    let speedMultiplier = 1.0;
    if (speedSetting === "calm") {
      speedMultiplier = 0.45;
    } else if (speedSetting === "fast") {
      speedMultiplier = 1.55;
    }

    // 6. Resolve Audio Reactivity modifiers
    const audioSetting = settings.audioReactivity || "balanced";
    let audioReactivityScale = 1.0;
    if (audioSetting === "subtle") {
      audioReactivityScale = 0.4;
    } else if (audioSetting === "responsive") {
      audioReactivityScale = 1.6;
    }

    // 7. Resolve Softness modifiers
    const softnessSetting = settings.softness || "smooth";
    let blurMultiplier = 1.0;
    let crestSoftnessMultiplier = 1.0;
    let filamentWidthScale = 1.0;
    if (softnessSetting === "misty") {
      blurMultiplier = 1.6;
      crestSoftnessMultiplier = 1.5;
      filamentWidthScale = 0.7;
    } else if (softnessSetting === "defined") {
      blurMultiplier = 0.45;
      crestSoftnessMultiplier = 0.5;
      filamentWidthScale = 1.3;
    }

    // 8. Resolve Layer Density modifiers
    const densitySetting = settings.layerDensity || "balanced";
    let activeLayersIndices = [0, 1, 2, 3, 4];
    if (densitySetting === "light") {
      activeLayersIndices = [0, 2, 4];
    } else if (densitySetting === "rich") {
      activeLayersIndices = [0, 1, 2, 3, 4, 5];
    }

    // If layerCount is customized in advanced settings, override active layers indices
    if (settings.layerCount !== undefined) {
      const count = Math.max(1, Math.min(6, Math.round(settings.layerCount)));
      if (count === 1) activeLayersIndices = [2];
      else if (count === 2) activeLayersIndices = [0, 3];
      else if (count === 3) activeLayersIndices = [0, 2, 4];
      else if (count === 4) activeLayersIndices = [0, 1, 3, 4];
      else if (count === 5) activeLayersIndices = [0, 1, 2, 3, 4];
      else activeLayersIndices = [0, 1, 2, 3, 4, 5];
    }

    // 9. Resolve Color Palette
    const paletteKey = settings.colorPalette || "cyanViolet";
    const palette = PALETTES[paletteKey] || PALETTES.cyanViolet;

    // Parse custom stops if present
    let customStops = null;
    if (Array.isArray(settings.gradientStops) && settings.gradientStops.length >= 2) {
      customStops = settings.gradientStops.map(stop => ({
        pos: stop.pos,
        hsl: hexToHsl(stop.color)
      }));
    }

    const cfg = {
      intensity: intensityFactor,
      turbulence: styleTurbulence,
      glow: styleGlow * glowMultiplier,
      speed: styleSpeed * speedMultiplier,
      heightMultiplier: heightMultiplier,
      opacityCap: opacityCap,
      blurMultiplier: blurMultiplier * styleSoftness,
      crestSoftness: crestSoftnessMultiplier,
      filamentWidthScale: filamentWidthScale,
      audioReactivityScale: styleAudio * audioReactivityScale,
      activeLayersIndices: activeLayersIndices,
      palette: palette,
      customStops: customStops,
      performanceMode: options.performanceMode || "balanced",

      // Volumetric Glow & Bloom
      baseGlowRadius: settings.baseGlowRadius !== undefined ? parseFloat(settings.baseGlowRadius) : 1.0,
      peakGlowRadius: settings.peakGlowRadius !== undefined ? parseFloat(settings.peakGlowRadius) : 1.0,
      crestBrightness: settings.crestBrightness !== undefined ? parseFloat(settings.crestBrightness) : 1.0,
      bloomStrength: settings.bloomStrength !== undefined ? parseFloat(settings.bloomStrength) : 1.0,
      glowFalloff: settings.glowFalloff !== undefined ? parseFloat(settings.glowFalloff) : 1.0,

      // Turbulence Controls
      primaryFrequency: settings.primaryFrequency !== undefined ? parseFloat(settings.primaryFrequency) : 1.0,
      secondaryFrequency: settings.secondaryFrequency !== undefined ? parseFloat(settings.secondaryFrequency) : 1.0,
      turbulenceComplexity: settings.turbulenceComplexity !== undefined ? parseFloat(settings.turbulenceComplexity) : 1.0,
      motionSmoothness: settings.motionSmoothness !== undefined ? parseFloat(settings.motionSmoothness) : 1.0,
      driftSpeed: settings.driftSpeed !== undefined ? parseFloat(settings.driftSpeed) : 1.0,

      // Audio Response
      bassInfluence: settings.bassInfluence !== undefined ? parseFloat(settings.bassInfluence) : 1.0,
      midInfluence: settings.midInfluence !== undefined ? parseFloat(settings.midInfluence) : 1.0,
      highShimmer: settings.highShimmer !== undefined ? parseFloat(settings.highShimmer) : 1.0,
      audioSmoothing: settings.audioSmoothing !== undefined ? parseFloat(settings.audioSmoothing) : 1.0,
      peakSensitivity: settings.peakSensitivity !== undefined ? parseFloat(settings.peakSensitivity) : 1.0,

      // Ribbon shape controls
      ribbonHeight: settings.ribbonHeight !== undefined ? parseFloat(settings.ribbonHeight) : 1.0,
      ribbonWidth: settings.ribbonWidth !== undefined ? parseFloat(settings.ribbonWidth) : 1.0,
      edgeSoftness: settings.edgeSoftness !== undefined ? parseFloat(settings.edgeSoftness) : 1.0,
      layerSeparation: settings.layerSeparation !== undefined ? parseFloat(settings.layerSeparation) : 1.0,
      crestSharpness: settings.crestSharpness !== undefined ? parseFloat(settings.crestSharpness) : 1.0,

      // Layer depth controls
      layerCount: settings.layerCount !== undefined ? Math.round(settings.layerCount) : 5,
      backgroundHaze: settings.backgroundHaze !== undefined ? parseFloat(settings.backgroundHaze) : 1.0,
      foregroundHighlight: settings.foregroundHighlight !== undefined ? parseFloat(settings.foregroundHighlight) : 1.0,
      parallaxDepth: settings.parallaxDepth !== undefined ? parseFloat(settings.parallaxDepth) : 1.0,

      // Ambient Atmosphere controls
      ambientOpacity: settings.ambientOpacity !== undefined ? parseFloat(settings.ambientOpacity) : 1.0,
      colorSaturation: settings.colorSaturation !== undefined ? parseFloat(settings.colorSaturation) : 1.0,
      atmosphericFade: settings.atmosphericFade !== undefined ? parseFloat(settings.atmosphericFade) : 1.0,
      edgeFeathering: settings.edgeFeathering !== undefined ? parseFloat(settings.edgeFeathering) : 1.0
    };

    function resolveColor(pos) {
      if (cfg.customStops) {
        return getAuroraColorStops(pos, cfg.customStops);
      }
      return getAuroraColor(pos, cfg.palette);
    }

    // Calculate elapsed frame time (dt) safely
    const dt = lastTime ? Math.min(0.1, Math.max(0.001, time - lastTime)) : 1 / 60;
    lastTime = time;

    // ----- Majestic, Jitter-Free Audio Processing -----
    const rawLevel = smoothedLevel || 0.24;

    // Proper attack/release smoothing function with frame-rate independence, modulated by advanced audio filters
    function smoothSignal(current, target, attack, release) {
      const attackK = attack * cfg.peakSensitivity;
      const releaseK = release / cfg.audioSmoothing;
      const k = target > current ? attackK : releaseK;
      const rate = 1 - Math.exp(-k * dt * 60);
      return current + (target - current) * rate;
    }

    // 1. Overall smooth level follower
    localAudioLevel = smoothSignal(localAudioLevel, rawLevel, 0.08, 0.08);

    // 2. Slow running baseline tracker (slow low-pass) to capture background ambient volume
    averageVolume = smoothSignal(averageVolume, rawLevel, 0.003, 0.003);

    // 3. Bass Beat / Surge Detector
    const rawSurge = Math.max(0, rawLevel - averageVolume * 1.25);
    const bassTarget = rawSurge * 1.6 * cfg.bassInfluence;
    bassLevelState = smoothSignal(bassLevelState, bassTarget, 0.07, 0.02);

    // Manage traveling shockwaves lifespan (max 1.8 seconds)
    activePulses = activePulses.filter(p => (time - p.birth) < 1.8);
    // Limit to max 4 active concurrent pulses to prevent rendering overhead and maintain 60 FPS
    if (rawSurge > 0.16 && (time - lastPulseTime) > 0.38 && activePulses.length < 4) {
      activePulses.push({
        birth: time,
        intensity: Math.min(1.0, rawSurge * 1.8 * cfg.audioReactivityScale),
        speed: 260 + Math.random() * 80
      });
      lastPulseTime = time;
    }

    // 4. Mid-Range Envelope (Expressiveness)
    const midTarget = rawLevel;
    midLevelState = smoothSignal(midLevelState, midTarget, 0.06, 0.06);
    midVariance = smoothSignal(midVariance, Math.abs(rawLevel - midLevelState), 0.05, 0.05);
    const expressiveness = Math.min(1.0, (midLevelState * 0.7 + midVariance * 1.6) * cfg.midInfluence);

    // 5. High-Frequency Treble Shimmer
    const trebleTransient = Math.max(0, rawLevel - localAudioLevel);
    shimmerLevelState = smoothSignal(shimmerLevelState, trebleTransient, 0.18, 0.18);

    // ----- Musical Emotion Engine -----
    const emotionFactor = Math.min(1.3, Math.max(0.16, (bassLevelState * 0.45 + expressiveness * 0.55 + localAudioLevel * 0.2)));

    const activeSpeed = cfg.speed * (0.42 + emotionFactor * 1.15) * cfg.driftSpeed;
    const activeTurbulence = (cfg.turbulence * (0.35 + emotionFactor * 1.10)) / cfg.motionSmoothness;
    const activeGlow = cfg.glow * (0.55 + emotionFactor * 0.25);

    globalDriftPhase += dt * 0.009 * activeSpeed;
    energyFlowOffset += dt * (0.28 + emotionFactor * 0.90) * activeSpeed;

    const shimmerNoise = Math.sin(time * 66.0) * shimmerLevelState * 0.13 * cfg.audioReactivityScale * cfg.highShimmer;
    const shimmerSparkle = Math.cos(time * 76.0) * shimmerLevelState * 0.22 * cfg.audioReactivityScale * cfg.highShimmer;

    // Dynamic color HSL adjustment based on music energy
    function adjustHSL(baseHSL) {
      return [
        baseHSL[0],
        Math.min(100, baseHSL[1] * cfg.colorSaturation + localAudioLevel * 8.0 * cfg.audioReactivityScale),
        Math.min(74, baseHSL[2] + localAudioLevel * 3.0 * cfg.audioReactivityScale)
      ];
    }

    // ----- 1. Horizon Atmospheric Haze -----
    const horizonHeight = height * 0.38;
    const horizonGrad = ctx.createLinearGradient(0, height - horizonHeight, 0, height);
    const ambientColorPos = globalDriftPhase * 0.95;
    const ambientHSL = adjustHSL(resolveColor(ambientColorPos));

    horizonGrad.addColorStop(0, hsla(ambientHSL, 0));
    horizonGrad.addColorStop(0.35, hsla(ambientHSL, 0.02 * activeGlow * cfg.ambientOpacity));
    horizonGrad.addColorStop(0.7, hsla(ambientHSL, 0.06 * activeGlow * cfg.ambientOpacity));
    horizonGrad.addColorStop(1, hsla(ambientHSL, 0.09 * activeGlow * cfg.ambientOpacity));

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = horizonGrad;
    ctx.fillRect(0, height - horizonHeight, width, horizonHeight);
    ctx.restore();

    // ----- 2. Draw Aurora Layers -----
    const baseY = height;

    for (let i = 0; i < cfg.activeLayersIndices.length; i++) {
      const li = cfg.activeLayersIndices[i];
      const layer = AURORA_LAYERS[li];
      drawAuroraLayer(ctx, {
        width,
        height,
        baseY,
        time,
        layer,
        layerIndex: i,
        actualLayerIndex: li,
        cfg,
        activeSpeed,
        activeTurbulence,
        activeGlow,
        expressiveness,
        shimmerNoise,
        shimmerSparkle,
        adjustHSL,
        resolveColor,
        audioBrightness: 1.0 + bassLevelState * 0.15 * cfg.audioReactivityScale,
      });
    }
  }

  function drawAuroraLayer(ctx, opts) {
    const {
      width,
      height,
      baseY,
      time,
      layer,
      layerIndex,
      actualLayerIndex,
      cfg,
      activeSpeed,
      activeTurbulence,
      activeGlow,
      expressiveness,
      shimmerNoise,
      shimmerSparkle,
      adjustHSL,
      resolveColor,
      audioBrightness
    } = opts;

    const step = cfg.performanceMode === "performance" ? 12 : 6;
    const ribbonWidth = width * layer.widthScale * cfg.ribbonWidth;
    const xOffset = (width - ribbonWidth) * 0.5;

    // Unique offsets to guarantee layers flow out-of-sync
    const layerPhaseOffset = actualLayerIndex * 1.63 * cfg.layerSeparation;

    // Beautiful parallax layer translation rates
    const layerParallaxShift = (actualLayerIndex - 2.5) * 40 * cfg.parallaxDepth * Math.sin(time * 0.08);

    // ----- Build the Ribbon Crest Coordinates -----
    const points = [];
    for (let x = 0; x <= ribbonWidth; x += step) {
      const nx = x / ribbonWidth;

      const wave1 = Math.sin(
        x * layer.frequency * cfg.primaryFrequency + globalDriftPhase * layer.speed * 8.0 + layerPhaseOffset
      );

      const wave2 = Math.sin(
        x * layer.frequency * cfg.primaryFrequency * 2.3 + globalDriftPhase * layer.speed * 4.5 + layerPhaseOffset * 0.7
      ) * 0.45;

      const wave3 = Math.sin(
        x * 0.012 + time * 0.06 + layerPhaseOffset * 1.3
      ) * 0.10;

      const combinedWave = wave1 + wave2 + wave3;

      const maxRise = height * layer.maxHeight * cfg.intensity * cfg.heightMultiplier * cfg.ribbonHeight;
      const amplitude = layer.baseAmplitude * 0.65 * cfg.intensity * (1.0 + bassLevelState * 0.18 * cfg.audioReactivityScale) * cfg.ribbonHeight;
      
      const verticalDrift = Math.sin(time * 0.12 + layerPhaseOffset) * 10;

      const riseHeight = maxRise * 0.45 + combinedWave * amplitude + verticalDrift;

      // Border Feathering Clipping Fade
      const edgeFade = Math.pow(Math.sin(nx * Math.PI), 0.75 * (2.0 - cfg.edgeFeathering));

      points.push({
        x: x + xOffset + layerParallaxShift,
        rise: Math.max(2, riseHeight * edgeFade)
      });
    }

    const segmentCount = points.length;
    if (segmentCount < 2) return;

    // Get color profile for this specific layer
    const layerColorPos = globalDriftPhase * 0.8 + layer.colorOffset;
    const baseHSL = adjustHSL(resolveColor(layerColorPos));

    let maxRise = 0;
    for (let i = 0; i < segmentCount; i++) {
      if (points[i].rise > maxRise) maxRise = points[i].rise;
    }
    if (maxRise < 5) return;

    // ----- DRAW PASS 1: Base Volumetric Curtain -----
    const gradTop = baseY - maxRise - 25 * cfg.atmosphericFade;
    const gradBottom = baseY;

    const curtainGrad = ctx.createLinearGradient(0, gradTop, 0, gradBottom);
    
    // Scale density opacities
    let depthScale = 1.0;
    if (actualLayerIndex <= 1) depthScale = cfg.backgroundHaze;
    else if (actualLayerIndex >= 3) depthScale = cfg.foregroundHighlight;
    
    let opacityMultiplier = layer.opacity * activeGlow * audioBrightness * (1.0 + shimmerNoise) * depthScale;
    opacityMultiplier = Math.min(cfg.opacityCap, opacityMultiplier);

    curtainGrad.addColorStop(0, hsla(baseHSL, 0));
    curtainGrad.addColorStop(Math.min(0.7, 0.18 * (2.0 - cfg.atmosphericFade)), hsla(baseHSL, opacityMultiplier * 0.35));
    curtainGrad.addColorStop(Math.min(0.9, 0.42 * (2.0 - cfg.atmosphericFade)), hsla(baseHSL, opacityMultiplier * 0.70));
    curtainGrad.addColorStop(0.72, hsla(baseHSL, opacityMultiplier * 0.95));
    curtainGrad.addColorStop(1, hsla(baseHSL, opacityMultiplier * 0.40));

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.moveTo(points[0].x, baseY);

    for (let i = 0; i < segmentCount; i++) {
      ctx.lineTo(points[i].x, baseY - points[i].rise);
    }

    ctx.lineTo(points[segmentCount - 1].x, baseY);
    ctx.closePath();

    // Bass Surge Bloom Glow tuners
    const peakGlowFactor = 1.0 + bassLevelState * 0.5 * cfg.peakGlowRadius;
    const blurStrengthFactor = cfg.baseGlowRadius * cfg.bloomStrength * peakGlowFactor * Math.pow(cfg.glowFalloff, (2.5 - actualLayerIndex) * 0.2);

    if (window.ParalineShared && typeof window.ParalineShared.applyOptimizedShadow === "function") {
      window.ParalineShared.applyOptimizedShadow(ctx, hsla(baseHSL, opacityMultiplier * 0.25), layer.blur * activeGlow * cfg.blurMultiplier * blurStrengthFactor, cfg.performanceMode);
    } else {
      ctx.shadowBlur = layer.blur * activeGlow * cfg.blurMultiplier * blurStrengthFactor;
      ctx.shadowColor = hsla(baseHSL, opacityMultiplier * 0.25);
    }
    
    ctx.fillStyle = curtainGrad;
    ctx.fill();
    ctx.restore();

    // ----- DRAW PASS 2: Additive Plasma Filaments -----
    const numFilaments = 20 + actualLayerIndex * 8;
    const filamentPoints = [];

    function getCrestHeight(x) {
      const idx = Math.floor((x - xOffset - layerParallaxShift) / step);
      if (idx < 0) return points[0].rise;
      if (idx >= points.length - 1) return points[points.length - 1].rise;
      const frac = ((x - xOffset - layerParallaxShift) / step) - idx;
      return points[idx].rise * (1 - frac) + points[idx + 1].rise * frac;
    }

    const vertSegments = cfg.performanceMode === "performance" ? 6 : 12;

    for (let fi = 0; fi < numFilaments; fi++) {
      const fn = fi / (numFilaments - 1 || 1);
      const xBase = xOffset + fn * ribbonWidth + layerParallaxShift;
      const filamentRise = getCrestHeight(xBase);

      if (filamentRise < 5) continue;

      const fPoints = [];

      for (let si = 0; si <= vertSegments; si++) {
        const t = si / vertSegments;
        const d = t * filamentRise;
        const y = baseY - d;

        const sway = Math.sin(
          xBase * 0.0028 + d * 0.0009 + time * 0.28 * layer.speed + layerPhaseOffset
        ) * 36;

        const foldPhase = xBase * 0.015 * cfg.secondaryFrequency - d * (0.007 + actualLayerIndex * 0.0006) + energyFlowOffset * (0.75 + actualLayerIndex * 0.15) + layerPhaseOffset;
        const foldAmp = (8 + expressiveness * 45 * activeTurbulence) * (1.0 - t * 0.35) * cfg.turbulenceComplexity;
        const fold = Math.sin(foldPhase) * foldAmp;

        let shockwaveDisplacement = 0;
        for (let pi = 0; pi < activePulses.length; pi++) {
          const p = activePulses[pi];
          const elapsed = time - p.birth;
          const pulseCenter = elapsed * p.speed;
          const distToPulse = Math.abs(d - pulseCenter);
          
          const pulseWidth = 130 + elapsed * 75;
          if (distToPulse < pulseWidth) {
            const normalizedDist = distToPulse / pulseWidth;
            const env = Math.pow(1.0 - normalizedDist, 2.2);
            const wave = Math.sin(distToPulse * 0.026 - elapsed * 4.8 + actualLayerIndex * 0.5);
            const decay = Math.exp(-elapsed * 1.35);
            
            shockwaveDisplacement += wave * env * p.intensity * decay * 10 * cfg.audioReactivityScale;
          }
        }

        const vibration = Math.sin(time * 88.0 + d * 0.18) * shimmerLevelState * 2.2 * cfg.intensity * cfg.audioReactivityScale;

        const x = xBase + sway + fold + shockwaveDisplacement + vibration;

        fPoints.push({ x, y });
      }

      filamentPoints.push(fPoints);
    }

    if (filamentPoints.length > 0) {
      const strokeGrad = ctx.createLinearGradient(0, baseY - maxRise, 0, baseY);
      const brightHSL = [baseHSL[0], baseHSL[1], Math.min(baseHSL[2] + 12, 85)];
      
      let filOpacity = layer.opacity * 0.55 * activeGlow * audioBrightness * (1.0 + shimmerNoise) * depthScale;
      filOpacity = Math.min(cfg.opacityCap * 1.5, filOpacity);

      strokeGrad.addColorStop(0, hsla(brightHSL, 0));
      strokeGrad.addColorStop(0.2, hsla(brightHSL, filOpacity * 0.30));
      strokeGrad.addColorStop(0.5, hsla(brightHSL, filOpacity * 0.85));
      strokeGrad.addColorStop(0.8, hsla(brightHSL, filOpacity * 1.0));
      strokeGrad.addColorStop(1, hsla(brightHSL, filOpacity * 0.15));

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = strokeGrad;
      ctx.lineWidth = (1.1 + (1.0 - layer.widthScale) * 0.7 + (actualLayerIndex * 0.32)) * cfg.filamentWidthScale * cfg.edgeSoftness;
      
      if (window.ParalineShared && typeof window.ParalineShared.applyOptimizedShadow === "function") {
        window.ParalineShared.applyOptimizedShadow(ctx, hsla(brightHSL, filOpacity * 0.25), layer.blur * 0.42 * activeGlow * cfg.blurMultiplier * blurStrengthFactor, cfg.performanceMode);
      } else {
        ctx.shadowBlur = layer.blur * 0.42 * activeGlow * cfg.blurMultiplier * blurStrengthFactor;
        ctx.shadowColor = hsla(brightHSL, filOpacity * 0.25);
      }

      ctx.beginPath();
      for (let fi = 0; fi < filamentPoints.length; fi++) {
        const fPoints = filamentPoints[fi];
        ctx.moveTo(fPoints[0].x, fPoints[0].y);
        for (let i = 1; i < fPoints.length; i++) {
          ctx.lineTo(fPoints[i].x, fPoints[i].y);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // ----- DRAW PASS 3: Brighter Crest Highlights -----
    if (layer.opacity >= 0.11 || cfg.activeLayersIndices.length <= 3) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.moveTo(points[0].x, baseY - points[0].rise);

      for (let i = 1; i < segmentCount - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const cpx = (curr.x + next.x) / 2;
        const cpy = (baseY - curr.rise + baseY - next.rise) / 2;
        ctx.quadraticCurveTo(curr.x, baseY - curr.rise, cpx, cpy);
      }

      const crestHSL = [baseHSL[0], baseHSL[1], Math.min(baseHSL[2] + 16, 92)];
      let crestOpacity = layer.opacity * 0.52 * activeGlow * audioBrightness * (1.0 + shimmerSparkle) * cfg.crestBrightness;
      crestOpacity = Math.min(cfg.opacityCap * 1.8, crestOpacity);

      ctx.strokeStyle = hsla(crestHSL, crestOpacity);
      ctx.lineWidth = (1.6 + layer.blur * 0.05 * activeGlow) * cfg.crestSoftness * (2.0 - cfg.crestSharpness);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (window.ParalineShared && typeof window.ParalineShared.applyOptimizedShadow === "function") {
        window.ParalineShared.applyOptimizedShadow(ctx, hsla(baseHSL, crestOpacity * 0.35), layer.blur * 0.55 * activeGlow * cfg.blurMultiplier * blurStrengthFactor, cfg.performanceMode);
      } else {
        ctx.shadowBlur = layer.blur * 0.55 * activeGlow * cfg.blurMultiplier * blurStrengthFactor;
        ctx.shadowColor = hsla(baseHSL, crestOpacity * 0.35);
      }
      
      ctx.stroke();
      ctx.restore();
    }
  }

  // ----- Audio multiplier (for the renderer's audio scaling system) -----
  function getAuroraDriftAudioMultiplier(settings = {}) {
    const reactivity = settings.audioReactivity || "balanced";
    if (reactivity === "subtle") return 1.8;
    if (reactivity === "responsive") return 5.5;
    return 3.65; // balanced / default
  }

  // ----- Export -----
  window.ParalineAuroraDrift = {
    getAuroraDriftAudioMultiplier,
    drawAuroraDrift
  };
})();
