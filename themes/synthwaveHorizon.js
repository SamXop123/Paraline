(() => {
  const {
    clamp01,
    getGlowMultiplier,
    hexToRgb,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  // ─── Synthwave / Outrun Color Palettes ─────────────────────────────────────
  const SYNTHWAVE_PALETTES = {
    outrun: {
      grid: [0, 242, 254],       // Electric Cyan #00f2fe
      horizon: [255, 0, 128],    // Hot Neon Magenta #ff007f
      accent: [255, 230, 0],     // Laser Sun Gold #ffe600
      glow: [255, 0, 128]
    },
    sunset: {
      grid: [255, 107, 53],      // Warm Amber #ff6b35
      horizon: [255, 30, 86],    // Crimson Rose
      accent: [255, 220, 90],    // Warm Gold
      glow: [255, 70, 50]
    },
    neonPink: {
      grid: [255, 60, 180],      // Pure Pink
      horizon: [255, 20, 140],
      accent: [255, 180, 230],
      glow: [255, 30, 150]
    },
    electricCyan: {
      grid: [0, 245, 255],       // High Voltage Cyan
      horizon: [0, 160, 255],
      accent: [160, 240, 255],
      glow: [0, 200, 255]
    }
  };

  // Internal scrolling animation states
  let gridScrollOffset = 0;
  let lastFrameTime = 0;
  let shockwaveProgress = 0;
  let lastShockLevel = 0;

  function getSynthwaveHorizonAudioMultiplier() {
    return 3.8;
  }

  function getGlowMultiplierValue(settings = {}) {
    const strength = settings.glowStrength || "medium";
    if (strength === "soft") return 0.55;
    if (strength === "strong") return 1.65;
    if (strength === "custom") {
      const customVal = typeof settings.customGlowStrength === "number"
        ? settings.customGlowStrength
        : (typeof settings.customGlow === "number" ? settings.customGlow : 30);
      return Math.max(0.2, Math.min(3.5, customVal / 30));
    }
    return 1.0;
  }

  function getPalette(settings = {}) {
    if (settings.colorStyle === "custom" && Array.isArray(settings.customColors) && settings.customColors.length >= 3) {
      const c1 = hexToRgb(settings.customColors[0]);
      const c2 = hexToRgb(settings.customColors[1]);
      const c3 = hexToRgb(settings.customColors[2]);
      return {
        grid: c2,
        horizon: c1,
        accent: c3,
        glow: c1
      };
    }
    return SYNTHWAVE_PALETTES[settings.colorStyle] || SYNTHWAVE_PALETTES.outrun;
  }

  // Low-profile edge height so it never intrudes on active windows or input areas
  function getHorizonHeight(height, settings = {}) {
    if (settings.horizonHeight === "low") return 26;
    if (settings.horizonHeight === "tall") return 54;
    return 38; // Ultra-sleek, ambient default (~38px along bottom bezel)
  }

  function getGridSpeed(settings = {}) {
    if (settings.speed === "calm") return 0.4;
    if (settings.speed === "energetic") return 1.4;
    if (settings.speed === "custom" && typeof settings.customSpeed === "number") {
      return 0.8 * (settings.customSpeed / 30);
    }
    return 0.8;
  }

  function drawSynthwaveHorizon(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel = 0,
      settings = {},
      performanceMode = "balanced"
    } = options;

    if (!context || width <= 0 || height <= 0) return;

    // Delta time calculation
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const dt = lastFrameTime > 0 ? Math.min(0.1, (now - lastFrameTime) / 1000) : 0.016;
    lastFrameTime = now;

    // ─── AMBIENT REDUCED OPACITY BASELINE + AUDIO REACTIVE PULSE ────────────
    // When no audio is playing (smoothedLevel == 0), the visualizer stays visible
    // at a delicate, reduced opacity baseline (0.18) so it NEVER completely disappears.
    // When the beat lands, audio level surges presence dynamically up to 1.0.
    const beatPulse = clamp01((smoothedLevel - 0.02) * 3.2);
    const audioPresence = 0.18 + beatPulse * 0.82;

    const palette = getPalette(settings);
    const horizonH = getHorizonHeight(height, settings);
    const horizonY = height - horizonH;
    const speed = getGridSpeed(settings);
    const glowMultiplier = getGlowMultiplierValue(settings);
    const glowScale = glowMultiplier * audioPresence;
    const glowAlphaMult = Math.min(1.5, 0.65 + glowMultiplier * 0.35);
    const isPerf = performanceMode === "performance";

    // Progress grid scroll smoothly
    gridScrollOffset = (gridScrollOffset + dt * speed * (0.6 + smoothedLevel * 2.0)) % 1.0;

    // Transient beat shockwave
    if (smoothedLevel - lastShockLevel > 0.10 && smoothedLevel > 0.20) {
      shockwaveProgress = 0.01;
    }
    lastShockLevel = smoothedLevel;

    if (shockwaveProgress > 0) {
      shockwaveProgress += dt * 2.2;
      if (shockwaveProgress > 1.0) shockwaveProgress = 0;
    }

    const vanishingX = width * 0.5;
    const vanishingY = horizonY;

    // ─── 1. Rolling Perspective Transverse (Horizontal) Grid Lines ───────────
    const numHorizontalLines = isPerf ? 5 : 8;
    context.save();

    for (let i = 0; i < numHorizontalLines; i++) {
      const rawDepth = (i / numHorizontalLines + gridScrollOffset / numHorizontalLines) % 1.0;
      // Exponential curve for clean 3D depth in a compact edge strip
      const depth = Math.pow(rawDepth, 2.0);
      const lineY = horizonY + depth * horizonH;

      // Lines fade smoothly into total transparency towards the top horizon line
      const depthFade = Math.pow(depth, 1.4);
      const lineAlpha = Math.min(1.0, depthFade * (0.35 + smoothedLevel * 0.65) * audioPresence * glowAlphaMult);
      if (lineAlpha < 0.01) continue;

      const lineWidth = Math.max(0.6, (0.7 + depth * 1.5) * (settings.customThickness ? settings.customThickness / 4 : 1.0));

      let shockBoost = 0;
      if (shockwaveProgress > 0) {
        const dist = Math.abs(rawDepth - shockwaveProgress);
        if (dist < 0.15) {
          shockBoost = (1.0 - dist / 0.15) * 0.7 * audioPresence;
        }
      }

      const r = Math.min(255, Math.round(palette.grid[0] + shockBoost * 80));
      const g = Math.min(255, Math.round(palette.grid[1] + shockBoost * 80));
      const b = Math.min(255, Math.round(palette.grid[2] + shockBoost * 80));
      const alpha = Math.min(1.0, lineAlpha + shockBoost);

      // Subtle audio-reactive terrain wave strictly contained in the edge strip
      const rippleAmp = smoothedLevel * 4.5 * (1.0 - depth * 0.5) * audioPresence;
      const steps = isPerf ? 14 : 24;
      const stepX = width / steps;

      context.beginPath();
      for (let s = 0; s <= steps; s++) {
        const x = s * stepX;
        const normX = (x - vanishingX) / (width * 0.5);
        const wave = Math.sin(normX * Math.PI * 3.5 + time * 3.0) * rippleAmp * Math.exp(-Math.abs(normX) * 0.8);
        const y = lineY - wave;

        if (s === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      context.lineWidth = lineWidth;

      if (!isPerf && (depth > 0.5 || shockBoost > 0)) {
        context.shadowColor = `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, 0.8)`;
        context.shadowBlur = (3 + depth * 5) * glowScale;
      } else {
        context.shadowBlur = 0;
      }
      context.stroke();
    }
    context.restore();

    // ─── 2. Longitudinal Radiating Perspective Beams ────────────────────────
    const numVerticalLines = isPerf ? 12 : 18;
    const spreadWidth = width * 1.3;
    const startX = vanishingX - spreadWidth * 0.5;
    const stepSpread = spreadWidth / numVerticalLines;

    context.save();
    for (let j = 0; j <= numVerticalLines; j++) {
      const bottomX = startX + j * stepSpread;
      const normFromCenter = (bottomX - vanishingX) / (spreadWidth * 0.5);
      const centerFade = 1.0 - Math.min(1.0, Math.abs(normFromCenter) * 0.4);

      // Gradient beam along the perspective line to keep the top completely clear
      const beamAlpha = Math.min(1.0, (0.25 + smoothedLevel * 0.6) * centerFade * audioPresence * glowAlphaMult);
      if (beamAlpha < 0.01) continue;

      const lineWidth = Math.max(0.5, (0.8 + smoothedLevel * 0.8) * (settings.customThickness ? settings.customThickness / 4 : 1.0));

      const grad = context.createLinearGradient(vanishingX, vanishingY, bottomX, height);
      grad.addColorStop(0.0, "rgba(0,0,0,0)");
      grad.addColorStop(0.3, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${(beamAlpha * 0.3).toFixed(3)})`);
      grad.addColorStop(1.0, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${beamAlpha.toFixed(3)})`);

      context.beginPath();
      context.moveTo(vanishingX, vanishingY);
      context.lineTo(bottomX, height);

      context.strokeStyle = grad;
      context.lineWidth = lineWidth;

      if (!isPerf && Math.abs(normFromCenter) < 0.4) {
        context.shadowColor = `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, 0.7)`;
        context.shadowBlur = (4 + smoothedLevel * 6) * glowScale;
      } else {
        context.shadowBlur = 0;
      }
      context.stroke();
    }
    context.restore();

    // ─── 3. Low-Profile Neon Horizon Laser Filament (Thin, Crisp, Audio-Glow) ─
    context.save();
    const beamAlpha = Math.min(1.0, (0.4 + smoothedLevel * 0.6) * audioPresence * glowAlphaMult);
    context.beginPath();
    context.moveTo(0, horizonY);
    context.lineTo(width, horizonY);

    // Color gradient across the horizon beam: Cyan on sides, Hot Magenta in center
    const horizonGrad = context.createLinearGradient(0, 0, width, 0);
    horizonGrad.addColorStop(0.0, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${(beamAlpha * 0.5).toFixed(3)})`);
    horizonGrad.addColorStop(0.5, `rgba(${palette.horizon[0]}, ${palette.horizon[1]}, ${palette.horizon[2]}, ${beamAlpha.toFixed(3)})`);
    horizonGrad.addColorStop(1.0, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${(beamAlpha * 0.5).toFixed(3)})`);

    context.strokeStyle = horizonGrad;
    context.lineWidth = Math.max(0.8, 1.0 + smoothedLevel * 1.2);

    if (!isPerf) {
      context.shadowColor = `rgba(${palette.horizon[0]}, ${palette.horizon[1]}, ${palette.horizon[2]}, 0.9)`;
      context.shadowBlur = (6 + smoothedLevel * 12) * glowScale;
    }
    context.stroke();
    context.restore();

    // ─── 4. Center Beat Sun Core (Delicate Micro-Flare along Horizon, <= 8px) ──
    const showPulseCore = settings.sunPulse !== "off";
    if (showPulseCore && smoothedLevel > 0.08) {
      context.save();
      const coreIntensity = clamp01((smoothedLevel - 0.08) * 2.5) * audioPresence * glowAlphaMult;
      const coreRadius = Math.min(16, 6 + smoothedLevel * 10);

      // Micro sun crest right at the horizon vanishing point
      const sunGrad = context.createRadialGradient(
        vanishingX, horizonY, 1,
        vanishingX, horizonY, coreRadius
      );
      sunGrad.addColorStop(0.0, `rgba(${palette.accent[0]}, ${palette.accent[1]}, ${palette.accent[2]}, ${(coreIntensity * 0.9).toFixed(3)})`);
      sunGrad.addColorStop(0.5, `rgba(${palette.horizon[0]}, ${palette.horizon[1]}, ${palette.horizon[2]}, ${(coreIntensity * 0.5).toFixed(3)})`);
      sunGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

      context.beginPath();
      context.arc(vanishingX, horizonY, coreRadius, Math.PI, 0, false);
      context.fillStyle = sunGrad;
      context.fill();
      context.restore();
    }
  }

  // Export to global scope
  window.ParalineSynthwaveHorizon = {
    getSynthwaveHorizonAudioMultiplier,
    drawSynthwaveHorizon
  };
})();
