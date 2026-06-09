(() => {
  const {
    clamp01,
    getGlowMultiplier,
    hexToRgb,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  const PARTICLE_COLORS = {
    fills: [
      [84, 150, 255],
      [52, 102, 230],
      [255, 92, 122],
      [214, 42, 86]
    ],
    glows: [
      [124, 184, 255],
      [92, 144, 255],
      [255, 118, 150],
      [236, 68, 108]
    ]
  };

  let particles = [];
  let activeKey = "";
  let lastTime = 0;
  let smoothedEnergy = 0.22;
  let spawnCarry = 0;
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

  function toRgbColor(color) {
    const normalized = normalizeHexColor(color);

    if (!normalized) {
      return null;
    }

    try {
      return hexToRgb(normalized);
    } catch (_error) {
      return null;
    }
  }

  function getSnowBubbleAudioMultiplier(settings = {}) {
    if (settings.motionStyle === "calm") {
      return 2.2;
    }

    if (settings.motionStyle === "energetic") {
      return 4.1;
    }

    return 3.1;
  }

  function getDensityProfile(settings = {}) {
    if (settings.density === "low") {
      return {
        maxParticles: 32,
        baseSpawnRate: 7,
        audioSpawnBoost: 12
      };
    }

    if (settings.density === "high") {
      return {
        maxParticles: 78,
        baseSpawnRate: 16,
        audioSpawnBoost: 28
      };
    }

    return {
      maxParticles: 52,
      baseSpawnRate: 11,
      audioSpawnBoost: 19
    };
  }

  function getMotionProfile(settings = {}) {
    if (settings.motionStyle === "calm") {
      return {
        baseSpeed: 18,
        audioSpeedBoost: 26,
        driftAmount: 8,
        driftSpeed: 0.52
      };
    }

    if (settings.motionStyle === "energetic") {
      return {
        baseSpeed: 34,
        audioSpeedBoost: 48,
        driftAmount: 16,
        driftSpeed: 0.9
      };
    }

    return {
      baseSpeed: 25,
      audioSpeedBoost: 36,
      driftAmount: 11,
      driftSpeed: 0.68
    };
  }

  function getSizeProfile(settings = {}) {
    if (settings.particleSize === "small") {
      return {
        baseSize: 1.6,
        variance: 1.1
      };
    }

    if (settings.particleSize === "large") {
      return {
        baseSize: 2.9,
        variance: 1.7
      };
    }

    return {
      baseSize: 2.2,
      variance: 1.35
    };
  }

  function seededRandom(seed) {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function mixChannel(a, b, amount) {
    return a + (b - a) * amount;
  }

  function brighten(color, amount) {
    return color.map((channel) => Math.round(mixChannel(channel, 255, amount)));
  }

  function getParticlePalette(settings = {}) {
    if (Array.isArray(settings.customColors) && settings.customColors.length) {
      const fills = settings.customColors
        .filter((color) => typeof color === "string")
        .filter((color) => HEX_COLOR_PATTERN.test(color))
        .map((color) => toRgbColor(color))
        .filter((color) => Array.isArray(color));

      if (!fills.length) {
        return PARTICLE_COLORS;
      }

      return {
        fills,
        glows: fills.map((color) => brighten(color, 0.26))
      };
    }

    return PARTICLE_COLORS;
  }

  function resetThemeState() {
    particles = [];
    lastTime = 0;
    smoothedEnergy = 0.22;
    spawnCarry = 0;
  }

  function ensureThemeState(width, height, settings) {
    const nextKey = [
      Math.round(width),
      Math.round(height),
      settings.fallArea,
      settings.density,
      settings.motionStyle,
      settings.particleSize
    ].join(":");

    if (activeKey === nextKey) {
      return;
    }

    activeKey = nextKey;
    resetThemeState();
  }

  function createParticle(width, height, settings, time, sizeProfile) {
    const seed = time * 1000 + particles.length * 13.7;
    const randomA = seededRandom(seed + 0.3);
    const randomB = seededRandom(seed + 1.1);
    const randomC = seededRandom(seed + 2.4);
    const randomD = seededRandom(seed + 3.7);
    const randomE = seededRandom(seed + 4.9);
    const maxVisibleDepth = height * 0.15;
    const minVisibleDepth = height * 0.05;
    const useFullWidth = settings.fallArea === "fullWidth";
    const spawnWidth = useFullWidth ? width * 0.92 : width * 0.28;
    const centerWeighted = ((randomA + randomB) * 0.5 - 0.5) * spawnWidth;
    const x = width * 0.5 + centerWeighted;
    const edgeDistance = Math.min(1, Math.abs(centerWeighted) / Math.max(1, spawnWidth * 0.5));
    const centerStrength = 1 - edgeDistance;
    const depthRatio = minVisibleDepth + (maxVisibleDepth - minVisibleDepth) * Math.pow(centerStrength, 1.9);
    const baseSize = sizeProfile.baseSize + randomB * sizeProfile.variance;
    const colorIndex = Math.floor(randomE * 4) % 4;

    return {
      x,
      y: -(2 + randomC * 8),
      speedSeed: 0.82 + randomB * 0.46,
      driftSeed: 0.8 + randomC * 0.88,
      driftPhase: randomD * Math.PI * 2,
      driftDirection: randomD > 0.5 ? 1 : -1,
      inwardBias: 0.9 + randomE * 0.75,
      size: baseSize,
      opacity: 0.24 + randomA * 0.18,
      lifetime: 0,
      maxLifetime: 6.4 + randomD * 3.4,
      limitY: depthRatio,
      colorIndex
    };
  }

  function updateParticles(width, height, time, delta, settings, energy) {
    const densityProfile = getDensityProfile(settings);
    const motionProfile = getMotionProfile(settings);
    const sizeProfile = getSizeProfile(settings);
    const spawnRate = densityProfile.baseSpawnRate + energy * densityProfile.audioSpawnBoost;

    spawnCarry += delta * spawnRate;

    while (spawnCarry >= 1 && particles.length < densityProfile.maxParticles) {
      particles.push(createParticle(width, height, settings, time + particles.length * 0.07, sizeProfile));
      spawnCarry -= 1;
    }

    particles = particles.filter((particle) => {
      particle.lifetime += delta;

      const drift = Math.sin(time * (motionProfile.driftSpeed * particle.driftSeed) + particle.driftPhase) *
        motionProfile.driftAmount * (0.35 + energy * 0.75);
      const centerPull = (width * 0.5 - particle.x) * (0.55 + energy * 0.45) * particle.inwardBias;

      const horizontalVelocity = drift * 0.12 * particle.driftDirection + centerPull * 0.035;
      const verticalVelocity = (motionProfile.baseSpeed + energy * motionProfile.audioSpeedBoost) * particle.speedSeed;

      particle.x += horizontalVelocity * delta;

      particle.y += verticalVelocity * delta;

      const outOfBoundsX = particle.x < -width * 0.05 || particle.x > width * 1.05;
      const outOfLifetime = particle.lifetime > particle.maxLifetime;
      const outOfDepth = particle.y > particle.limitY;

      return !outOfBoundsX && !outOfLifetime && !outOfDepth;
    });
  }

  function drawSnowParticle(context, particle, energy, glowMultiplier, palette, performanceMode = 'balanced') {
    const { fills, glows } = palette;
    const fill = fills[particle.colorIndex % fills.length];
    const glow = glows[particle.colorIndex % glows.length];
    const fade = clamp01(1 - particle.y / Math.max(1, particle.limitY));
    const radius = particle.size * (0.88 + energy * 0.26);
    const opacity = clamp01(particle.opacity * (0.7 + fade * 0.55 + energy * 0.18));
    const fillColor = `rgba(${fill[0]}, ${fill[1]}, ${fill[2]}, ${opacity})`;
    const glowColor = `rgba(${glow[0]}, ${glow[1]}, ${glow[2]}, ${Math.min(0.8, opacity * 0.85)})`;

    context.beginPath();
    context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    context.fillStyle = fillColor;
    applyOptimizedShadow(context, glowColor, (5 + radius * 2.4 + energy * 3.5) * glowMultiplier * getPerformanceMultiplier(performanceMode), performanceMode);
    context.fill();
  }

  function drawSnowBubbleParticles(options) {
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

    const delta = lastTime ? Math.min(0.05, Math.max(0.001, time - lastTime)) : 1 / 48;
    const targetEnergy = clamp01(smoothedLevel);
    const smoothing = targetEnergy > smoothedEnergy ? 0.16 : 0.06;

    smoothedEnergy += (targetEnergy - smoothedEnergy) * smoothing;

    updateParticles(width, height, time, delta, settings, smoothedEnergy);

    const glowMultiplier = getGlowMultiplier(settings.glowStrength);
    const particlePalette = getParticlePalette(settings);
    context.globalAlpha = 1;
    context.lineCap = "round";

    for (const particle of particles) {
      drawSnowParticle(context, particle, smoothedEnergy, glowMultiplier, particlePalette, performanceMode);
    }

    context.shadowBlur = 0;
    lastTime = time;
  }

  window.ParalineSnowBubbleParticles = {
    getSnowBubbleAudioMultiplier,
    drawSnowBubbleParticles
  };
})();
