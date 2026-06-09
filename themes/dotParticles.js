(() => {
  const {
    clamp01,
    getGlowMultiplier,
    hexToRgb,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  const PARTICLE_COLORS = [
    [42, 84, 220],
    [24, 44, 150],
    [226, 34, 76],
    [255, 64, 104],
    [100, 112, 255]
  ];

  let particles = [];
  let particleKey = "";
  let lastTime = 0;
  let lastLevel = 0.24;
  let lastSwitchAt = -10;
  let globalDirection = 1;
  let beatPulse = 0;
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

  function toRgbColor(color, fallback) {
    const normalized = normalizeHexColor(color);

    if (!normalized) {
      return fallback;
    }

    try {
      return hexToRgb(normalized);
    } catch (_error) {
      return fallback;
    }
  }

  function getDotParticlesAudioMultiplier(settings = {}) {
    let base = 3.1;
    if (settings.motionStyle === "calm") base = 2.4;
    if (settings.motionStyle === "energetic") base = 4;

    if (settings.motionStyle === "custom" && typeof settings.customSensitivity === "number") {
      return base * (settings.customSensitivity / 30);
    }
    return base;
  }

  function getDensityCount(settings, width, height) {
    const perimeter = Math.max(1, 2 * (width + height));

    if (settings.density === "custom" && typeof settings.customGap === "number") {
      const factor = settings.customGap * 2;
      return Math.min(300, Math.max(20, Math.round(perimeter / factor)));
    }

    if (settings.density === "low") {
      return Math.min(130, Math.max(56, Math.round(perimeter / 58)));
    }

    if (settings.density === "high") {
      return Math.min(220, Math.max(110, Math.round(perimeter / 30)));
    }

    return Math.min(170, Math.max(82, Math.round(perimeter / 42)));
  }

  function getMotionProfile(settings = {}) {
    if (settings.motionStyle === "custom" && typeof settings.customSpeed === "number") {
      const scale = settings.customSpeed / 30;
      return {
        baseSpeed: 30 * scale,
        audioBoost: 120 * scale,
        jitter: 2.5 * scale
      };
    }

    if (settings.motionStyle === "calm") {
      return {
        baseSpeed: 18,
        audioBoost: 70,
        jitter: 1.6
      };
    }

    if (settings.motionStyle === "energetic") {
      return {
        baseSpeed: 46,
        audioBoost: 190,
        jitter: 3.8
      };
    }

    return {
      baseSpeed: 30,
      audioBoost: 120,
      jitter: 2.5
    };
  }

  function seededRandom(seed) {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function createParticle(index, count, perimeter) {
    const spacing = perimeter / Math.max(1, count);
    const offsetSeed = seededRandom(index + 1.7);

    return {
      distance: index * spacing + (offsetSeed - 0.5) * spacing * 0.34,
      speedSeed: 0.72 + seededRandom(index + 8.1) * 0.56,
      sizeSeed: seededRandom(index + 12.4),
      phase: seededRandom(index + 18.7) * Math.PI * 2,
      jitterSpeed: 1.8 + seededRandom(index + 25.3) * 2.6,
      counterFlow: seededRandom(index + 31.9) > 0.88,
      colorIndex: index % PARTICLE_COLORS.length,
      direction: 1
    };
  }

  function ensureParticles(width, height, settings) {
    const count = getDensityCount(settings, width, height);
    const nextKey = `${Math.round(width)}:${Math.round(height)}:${settings.density}:${count}`;

    if (particleKey === nextKey) {
      return;
    }

    const perimeter = Math.max(1, 2 * (width + height));
    particles = Array.from({ length: count }, (_item, index) => createParticle(index, count, perimeter));
    particleKey = nextKey;
  }

  function getPerimeterPoint(distance, width, height) {
    const edgeOffset = 2.5;
    const perimeter = Math.max(1, 2 * (width + height));
    let wrappedDistance = distance % perimeter;

    if (wrappedDistance < 0) {
      wrappedDistance += perimeter;
    }

    if (wrappedDistance <= width) {
      return {
        x: wrappedDistance,
        y: edgeOffset,
        normalX: 0,
        normalY: 1
      };
    }

    if (wrappedDistance <= width + height) {
      return {
        x: width - edgeOffset,
        y: wrappedDistance - width,
        normalX: -1,
        normalY: 0
      };
    }

    if (wrappedDistance <= width * 2 + height) {
      return {
        x: width - (wrappedDistance - width - height),
        y: height - edgeOffset,
        normalX: 0,
        normalY: -1
      };
    }

    return {
      x: edgeOffset,
      y: height - (wrappedDistance - width * 2 - height),
      normalX: 1,
      normalY: 0
    };
  }

  function updateDirectionController(settings, time, smoothedLevel) {
    const levelRise = smoothedLevel - lastLevel;
    const strongBeat = smoothedLevel > 0.34 && levelRise > 0.012;
    const canSwitch = time - lastSwitchAt > 1.6;

    if (strongBeat) {
      beatPulse = 1;
    }

    if (settings.directionBehavior === "mostlyClockwise") {
      globalDirection = 1;
    } else if (settings.directionBehavior === "mostlyAnticlockwise") {
      globalDirection = -1;
    } else if (strongBeat && canSwitch) {
      globalDirection *= -1;
      lastSwitchAt = time;
    }

    lastLevel = smoothedLevel;
  }

  function getParticleDirection(particle, settings) {
    if (settings.directionBehavior === "mostlyClockwise") {
      return particle.counterFlow ? -1 : 1;
    }

    if (settings.directionBehavior === "mostlyAnticlockwise") {
      return particle.counterFlow ? 1 : -1;
    }

    return particle.counterFlow ? -globalDirection : globalDirection;
  }

  function getParticleColors(settings = {}) {
    if (Array.isArray(settings.customColors) && settings.customColors.length) {
      const colors = settings.customColors
        .filter((color) => typeof color === "string")
        .filter((color) => HEX_COLOR_PATTERN.test(color))
        .map((color, index) => toRgbColor(color, PARTICLE_COLORS[index % PARTICLE_COLORS.length]));

      if (colors.length) {
        return colors;
      }
    }

    return PARTICLE_COLORS;
  }

  function drawDot(context, x, y, radius, color, opacity, glowBlur, performanceMode = 'balanced') {
    const [r, g, b] = color;
    const fillColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = fillColor;
    
    // Apply optimized shadow
    applyOptimizedShadow(context, fillColor, glowBlur, performanceMode);
    
    context.fill();
  }

  function drawDotParticles(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;

    ensureParticles(width, height, settings);
    updateDirectionController(settings, time, smoothedLevel);

    const delta = lastTime ? Math.min(0.05, Math.max(0.001, time - lastTime)) : 1 / 48;
    const profile = getMotionProfile(settings);
    const glowScale = getGlowMultiplier(settings.glowStrength);
    const perimeter = Math.max(1, 2 * (width + height));
    const energy = clamp01(smoothedLevel);
    const speed = profile.baseSpeed + energy * profile.audioBoost + beatPulse * 36;
    const jitterAmount = profile.jitter * (0.46 + energy * 1.18 + beatPulse * 0.55);
    const baseOpacity = 0.42 + energy * 0.32 + beatPulse * 0.14;
    const glowBlur = (3.5 + energy * 6.5 + beatPulse * 3.5) * glowScale * getPerformanceMultiplier(performanceMode);
    const particleColors = getParticleColors(settings);

    context.globalAlpha = 1;
    context.shadowBlur = 0;

    for (const particle of particles) {
      particle.direction = getParticleDirection(particle, settings);
      particle.distance += delta * speed * particle.speedSeed * particle.direction;

      if (particle.distance < 0) {
        particle.distance += perimeter;
      } else if (particle.distance > perimeter) {
        particle.distance -= perimeter;
      }

      const point = getPerimeterPoint(particle.distance, width, height);
      const jitter = (
        Math.sin(time * particle.jitterSpeed + particle.phase) * 0.72 +
        Math.sin(time * particle.jitterSpeed * 0.47 + particle.phase * 1.9) * 0.28
      ) * jitterAmount;
      const radius = 1.15 + particle.sizeSeed * 0.95 + energy * 0.45 + beatPulse * 0.3;
      const opacity = clamp01(baseOpacity * (0.82 + particle.sizeSeed * 0.28));
      const x = point.x + point.normalX * jitter;
      const y = point.y + point.normalY * jitter;

      drawDot(context, x, y, radius, particleColors[particle.colorIndex % particleColors.length], opacity, glowBlur, performanceMode);
    }

    beatPulse *= Math.pow(0.14, delta);
    lastTime = time;
    context.shadowBlur = 0;
  }

  window.ParalineDotParticles = {
    getDotParticlesAudioMultiplier,
    drawDotParticles
  };
})();
