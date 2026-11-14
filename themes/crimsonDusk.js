(() => {
  const {
    clamp01,
    getGlowMultiplier,
    hexToRgb,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  // ─── Crimson Dusk Palette ───────────────────────────────────────────────────
  // Inspired by desert sunsets, ember glows, and vintage film aesthetics.
  // Deep charcoals with warm amber and crimson accents.

  const CRIMSON_COLORS = {
    emberOrange:  [255, 107,  53],   // #FF6B35 — primary glow
    deepCrimson:  [192,  57,  43],   // #C0392B — secondary glow
    warmAmber:    [243, 156,  18],   // #F39C12 — accent
    dustRed:      [220,  80,  20],   // ember mid-tone
    glowGold:     [255, 180,  60],   // bright peak
    darkEmber:    [160,  40,   8],   // deep ember shadow
  };

  // ─── Settings helpers ───────────────────────────────────────────────────────

  function getCrimsonInputMultiplier(settings = {}) {
    let base = 3.2;
    if (settings.sensitivity === "low")  base = 2.2;
    if (settings.sensitivity === "high") base = 4.5;
    if (settings.sensitivity === "custom" && typeof settings.customSensitivity === "number") {
      return base * (settings.customSensitivity / 30);
    }
    return base;
  }

  // ─── Shared color resolver ──────────────────────────────────────────────────

  function resolveEmberColor(normalizedPos, time, opacity) {
    // Cycle through ember palette: orange → amber → crimson → amber → orange
    const palette = [
      CRIMSON_COLORS.emberOrange,
      CRIMSON_COLORS.glowGold,
      CRIMSON_COLORS.warmAmber,
      CRIMSON_COLORS.deepCrimson,
      CRIMSON_COLORS.dustRed,
    ];
    const travel  = (normalizedPos + time * 0.04) % 1;
    const scaled  = travel * palette.length;
    const indexA  = Math.floor(scaled) % palette.length;
    const indexB  = (indexA + 1) % palette.length;
    const blend   = scaled - Math.floor(scaled);
    const cA = palette[indexA];
    const cB = palette[indexB];
    const r = Math.round(cA[0] + (cB[0] - cA[0]) * blend);
    const g = Math.round(cA[1] + (cB[1] - cA[1]) * blend);
    const b = Math.round(cA[2] + (cB[2] - cA[2]) * blend);
    return `rgba(${r},${g},${b},${opacity.toFixed(3)})`;
  }

  // ─── Bottom Waveform bars ───────────────────────────────────────────────────
  // A warm audio-reactive waveform strip along the bottom edge.
  // Center bars are tallest (musical emphasis), tapering to edges.


  // --- Ember Particle Drift ---
  // Slow-drifting ember particles, independent of the bar visuals.
  // Particles rise gently from the bottom/sides and fade as they age.

  let _crimsonParticles = [];
  let _particlesInitialized = false;
  let _particlesDensity = null;
  let _particlesWidth = null;
  let _particlesHeight = null;

  function initCrimsonParticles(width, height, density) {
    const count = density === "dense" ? 60 : density === "sparse" ? 20 : 36;
    _crimsonParticles = [];
    for (let i = 0; i < count; i++) {
      _crimsonParticles.push(createEmberParticle(width, height, true));
    }
    _particlesInitialized = true;
  }

  function createEmberParticle(width, height, randomY = false) {
    return {
      x: Math.random() * width,
      y: randomY ? Math.random() * height : height + Math.random() * 30,
      size: 1 + Math.random() * 2.5,
      speed: 0.15 + Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 0.3,
      life: Math.random(),
      maxLife: 0.6 + Math.random() * 0.8,
      colorPos: Math.random(),
    };
  }

  function drawCrimsonEmberParticles(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = "balanced"
    } = options;

    const density = settings.barCount || "medium";
    const needsReinit = !_particlesInitialized
      || density !== _particlesDensity
      || width !== _particlesWidth
      || height !== _particlesHeight;
    if (needsReinit) {
      initCrimsonParticles(width, height, density);
      _particlesDensity = density;
      _particlesWidth = width;
      _particlesHeight = height;
    }

    const perfMultiplier = getPerformanceMultiplier(performanceMode);
    const motionScale = options.reducedMotion ? 0.15 : 1;
    const speedBoost = (1 + smoothedLevel * 0.8) * motionScale;

    context.globalAlpha = 1;
    context.shadowBlur = 0;

    for (let i = 0; i < _crimsonParticles.length; i++) {
      const p = _crimsonParticles[i];

      p.y -= p.speed * speedBoost * perfMultiplier;
      p.x += p.drift * motionScale;
      p.life += 0.004 * speedBoost;

      if (p.life >= p.maxLife || p.y < -20) {
        _crimsonParticles[i] = createEmberParticle(width, height, false);
        continue;
      }

      const lifeRatio = p.life / p.maxLife;
      const fadeIn = Math.min(1, lifeRatio * 6);
      const fadeOut = Math.min(1, (1 - lifeRatio) * 3);
      const opacity = Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut) * 0.55));

      const color = resolveEmberColor(p.colorPos, time * 0.3, opacity);

      context.beginPath();
      context.fillStyle = color;
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawCrimsonDuskBottom(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;

    const glowMultiplier  = getGlowMultiplier(settings.glowStrength);
    const perfMultiplier  = getPerformanceMultiplier(performanceMode);
    const barCount        = settings.barCount === "dense"  ? 72
                          : settings.barCount === "sparse" ? 36
                          : 52;
    const barThickness    = settings.barThickness === "thin"   ? 2
                          : settings.barThickness === "thick"  ? 5
                          : settings.barThickness === "custom" && typeof settings.customThickness === "number" ? settings.customThickness
                          : 3.5;
    const gap             = 2;
    const step            = barThickness + gap;
    const totalWidth      = barCount * step;
    const startX          = (width - totalWidth) * 0.5;
    const baseY           = height;
    const maxBarHeight    = 18 + smoothedLevel * 48;
    const glowBlur        = (6 + smoothedLevel * 10) * glowMultiplier * perfMultiplier;

    context.globalAlpha = 1;
    context.shadowBlur  = 0;

    for (let i = 0; i < barCount; i++) {
      const normalizedI   = i / (barCount - 1);               // 0 → 1
      const distCenter    = Math.abs(normalizedI - 0.5) / 0.5; // 0=center, 1=edge
      const centerEnvelope = Math.pow(1 - distCenter, 1.2);

      // Organic noise per bar
      const noise = Math.sin(time * 3.2 + i * 0.42) * 0.4
                  + Math.sin(time * 1.9 + i * 0.71) * 0.3
                  + 0.3;

      const barH    = Math.max(1.5, maxBarHeight * noise * centerEnvelope);
      const opacity = clamp01(0.55 + smoothedLevel * 0.3 + centerEnvelope * 0.15);
      const color   = resolveEmberColor(normalizedI, time, opacity);

      const x = startX + i * step;
      const y = baseY - barH;

      // Gradient per bar: bright top → deep bottom
      const grad = context.createLinearGradient(x, y, x, baseY);
      const [r1, g1, b1] = CRIMSON_COLORS.glowGold;
      const [r2, g2, b2] = CRIMSON_COLORS.deepCrimson;
      grad.addColorStop(0, `rgba(${r1},${g1},${b1},${opacity})`);
      grad.addColorStop(1, `rgba(${r2},${g2},${b2},${(opacity * 0.4).toFixed(3)})`);

      context.fillStyle = grad;
      applyOptimizedShadow(context, color, glowBlur * (0.5 + centerEnvelope * 0.5), performanceMode);

      const radius = Math.min(barThickness * 0.5, 3);
      if (typeof context.roundRect === "function") {
        context.beginPath();
        context.roundRect(x, y, barThickness, barH, [radius, radius, 0, 0]);
        context.fill();
      } else {
        context.fillRect(x, y, barThickness, barH);
      }
    }
  }

  // ─── Side Ember bars ────────────────────────────────────────────────────────
  // Ember bars on left & right edges — distinct from Side Bars theme:
  //   • Crimson/amber palette (not multicolor)
  //   • Ember glow decay effect (bars fade outward from center vertically)
  //   • Subtle heat-shimmer horizontal offset on beat
  //   • Bars grow INWARD from edges (not fixed width)

  // --- Bottom Full-width bars ---
  // Edge-to-edge bars spanning the entire bottom width, more uniform height.
  // Distinct from "Bottom Compact" (centered, tapering envelope).

  function drawCrimsonDuskBottomFull(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;

    const glowMultiplier  = getGlowMultiplier(settings.glowStrength);
    const perfMultiplier  = getPerformanceMultiplier(performanceMode);
    const barCount        = settings.barCount === "dense"  ? 90
                          : settings.barCount === "sparse" ? 45
                          : 64;
    const barThickness    = settings.barThickness === "thin"   ? 2
                          : settings.barThickness === "thick"  ? 4
                          : settings.barThickness === "custom" && typeof settings.customThickness === "number" ? settings.customThickness
                          : 3;
    const step             = width / barCount;
    const barWidth          = Math.max(1, step - 1.5);
    const baseY            = height;
    const maxBarHeight     = 14 + smoothedLevel * 40;
    const glowBlur         = (5 + smoothedLevel * 9) * glowMultiplier * perfMultiplier;

    context.globalAlpha = 1;
    context.shadowBlur  = 0;

    for (let i = 0; i < barCount; i++) {
      const normalizedI = i / (barCount - 1);

      const noise = Math.sin(time * 3.0 + i * 0.37) * 0.35
                  + Math.sin(time * 1.7 + i * 0.63) * 0.35
                  + 0.3;

      const barH    = Math.max(1.5, maxBarHeight * Math.max(0.15, noise));
      const opacity = clamp01(0.5 + smoothedLevel * 0.32);
      const color   = resolveEmberColor(normalizedI, time, opacity);

      const x = i * step;
      const y = baseY - barH;

      const grad = context.createLinearGradient(x, y, x, baseY);
      const [r1, g1, b1] = CRIMSON_COLORS.glowGold;
      const [r2, g2, b2] = CRIMSON_COLORS.deepCrimson;
      grad.addColorStop(0, `rgba(${r1},${g1},${b1},${opacity})`);
      grad.addColorStop(1, `rgba(${r2},${g2},${b2},${(opacity * 0.4).toFixed(3)})`);

      context.fillStyle = grad;
      applyOptimizedShadow(context, color, glowBlur, performanceMode);

      const radius = Math.min(barThickness, 2);
      if (typeof context.roundRect === "function") {
        context.beginPath();
        context.roundRect(x, y, barWidth, barH, [radius, radius, 0, 0]);
        context.fill();
      } else {
        context.fillRect(x, y, barWidth, barH);
      }
    }
  }


  function drawCrimsonDuskSide(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;

    const glowMultiplier = getGlowMultiplier(settings.glowStrength);
    const perfMultiplier = getPerformanceMultiplier(performanceMode);
    const barHeight      = settings.barThickness === "thin"  ? 2
                         : settings.barThickness === "thick" ? 5
                         : settings.barThickness === "custom" && typeof settings.customThickness === "number" ? settings.customThickness
                         : 3.5;
    const gap            = settings.barCount === "dense"  ? 4
                         : settings.barCount === "sparse" ? 12
                         : 7;
    const step           = barHeight + gap;
    const edgeOverscan   = 8;
    const usableH        = height + edgeOverscan * 2;
    const count          = Math.max(10, Math.ceil(usableH / step) + 1);
    const maxBarLength   = 8 + smoothedLevel * 46;
    const glowBlur       = (4 + smoothedLevel * 10) * glowMultiplier * perfMultiplier;
    const sideInset      = 3;

    // Heat shimmer — subtle horizontal offset on strong beats (disabled for reduced motion)
    const shimmer = (!options.reducedMotion && smoothedLevel > 0.6)
      ? Math.sin(time * 18) * smoothedLevel * 2.5
      : 0;

    context.globalAlpha = 1;
    context.shadowBlur  = 0;

    for (let i = 0; i < count; i++) {
      const normalizedY    = count <= 1 ? 0.5 : i / (count - 1);
      const distCenter     = Math.abs(normalizedY - 0.5) / 0.5;
      const centerEnvelope = Math.pow(1 - distCenter, 1.5);  // tall center, fade toward top/bottom

      const motion     = Math.sin(time * 2.8 + normalizedY * 9.2) * 0.45 + 0.55;
      const barLength  = Math.max(1.5, maxBarLength * motion * (0.3 + centerEnvelope * 0.85));
      const opacity    = clamp01(0.38 + smoothedLevel * 0.28 + centerEnvelope * 0.2);
      const color      = resolveEmberColor(normalizedY, time, opacity);

      const y       = -edgeOverscan + i * step;
      const leftX   = sideInset + shimmer;
      const rightX  = width - sideInset - barLength - shimmer;

      context.fillStyle = color;
      applyOptimizedShadow(context, color, glowBlur * (0.35 + centerEnvelope * 0.6), performanceMode);

      const radius = Math.min(barHeight * 0.5, 3);

      const suppressed = settings.suppressedEdges || {};

      if (typeof context.roundRect === "function") {
        if (!suppressed.left) {
          context.beginPath();
          context.roundRect(leftX,  y, barLength, barHeight, radius);
          context.fill();
        }
        if (!suppressed.right) {
          context.beginPath();
          context.roundRect(rightX, y, barLength, barHeight, radius);
          context.fill();
        }
      } else {
        if (!suppressed.left) context.fillRect(leftX,  y, barLength, barHeight);
        if (!suppressed.right) context.fillRect(rightX, y, barLength, barHeight);
      }
    }
  }

  // ─── Edge glow vignette ─────────────────────────────────────────────────────
  // Soft crimson/amber glow along all screen edges — atmospheric, ambient.
  // Always rendered regardless of barMode, gives Crimson Dusk its warmth.

  function drawCrimsonEdgeGlow(context, width, height, smoothedLevel, glowMultiplier, suppressed = {}) {
    const intensity = (0.06 + smoothedLevel * 0.08) * glowMultiplier;

    // Bottom
    if (!suppressed.bottom) {
      const gradB = context.createLinearGradient(0, height - 60, 0, height);
      gradB.addColorStop(0, `rgba(0,0,0,0)`);
      gradB.addColorStop(1, `rgba(192,57,43,${intensity * 2.2})`);
      context.fillStyle = gradB;
      context.fillRect(0, height - 60, width, 60);
    }

    // Left
    if (!suppressed.left) {
      const gradL = context.createLinearGradient(0, 0, 55, 0);
      gradL.addColorStop(0, `rgba(192,57,43,${intensity * 1.6})`);
      gradL.addColorStop(1, `rgba(0,0,0,0)`);
      context.fillStyle = gradL;
      context.fillRect(0, 0, 55, height);
    }

    // Right
    if (!suppressed.right) {
      const gradR = context.createLinearGradient(width - 55, 0, width, 0);
      gradR.addColorStop(0, `rgba(0,0,0,0)`);
      gradR.addColorStop(1, `rgba(192,57,43,${intensity * 1.6})`);
      context.fillStyle = gradR;
      context.fillRect(width - 55, 0, 55, height);
    }

    // Top (subtle)
    if (!suppressed.top) {
      const gradT = context.createLinearGradient(0, 0, 0, 35);
      gradT.addColorStop(0, `rgba(160,40,8,${intensity * 0.9})`);
      gradT.addColorStop(1, `rgba(0,0,0,0)`);
      context.fillStyle = gradT;
      context.fillRect(0, 0, width, 35);
    }
  }

  // ─── Main draw entry ────────────────────────────────────────────────────────


  // --- Film Grain Overlay (optional) ---
  // Subtle noise texture over the visualizer area for a vintage film feel.
  // Only renders when settings.filmGrain === "on".

  let _grainCanvas = null;
  let _grainCtx = null;

  function buildGrainTexture(width, height) {
    if (!_grainCanvas) {
      _grainCanvas = document.createElement("canvas");
      _grainCtx = _grainCanvas.getContext("2d");
    }
    _grainCanvas.width = width;
    _grainCanvas.height = height;
    const imageData = _grainCtx.createImageData(width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 14;
    }
    _grainCtx.putImageData(imageData, 0, 0);
  }

  function drawCrimsonFilmGrain(context, width, height, reducedMotion) {
    if (!_grainCanvas || _grainCanvas.width !== width || _grainCanvas.height !== height) {
      buildGrainTexture(width, height);
    } else if (!reducedMotion && Math.random() < 0.3) {
      buildGrainTexture(width, height);
    }
    context.save();
    context.globalAlpha = 0.05;
    context.globalCompositeOperation = "overlay";
    context.drawImage(_grainCanvas, 0, 0);
    context.restore();
  }

  function prefersReducedMotion() {
    return typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function drawCrimsonDusk(options) {
    const {
      context,
      width,
      height,
      settings,
      smoothedLevel,
    } = options;

    const reducedMotion = prefersReducedMotion();
    options.reducedMotion = reducedMotion;

    const glowMultiplier = getGlowMultiplier(settings.glowStrength);
    const suppressed = settings.suppressedEdges || {};

    // Always: ambient edge glow
    drawCrimsonEdgeGlow(context, width, height, smoothedLevel, glowMultiplier, suppressed);

    // Always: drifting ember particles
    drawCrimsonEmberParticles(options);

    // Bar mode: bottom (default) or side
    const barMode = settings.barMode || "bottom";

    if (barMode === "bottom") {
      if (!suppressed.bottom) drawCrimsonDuskBottomFull(options);
    } else if (barMode === "bottomCompact") {
      if (!suppressed.bottom) drawCrimsonDuskBottom(options);
    } else if (barMode === "side") {
      drawCrimsonDuskSide(options);
    } else if (barMode === "both") {
      if (!suppressed.bottom) drawCrimsonDuskBottomFull(options);
      drawCrimsonDuskSide(options);
    }

    // Optional: film grain overlay
    if (settings.filmGrain === "on") {
      drawCrimsonFilmGrain(context, width, height, reducedMotion);
    }
  }

  // ─── Export ─────────────────────────────────────────────────────────────────

  window.ParalineCrimsonDusk = {
    getCrimsonInputMultiplier,
    drawCrimsonDusk
  };
})();
