const fs = require("fs");
const path = require("path");

// Validates that a value is a CSS hex color string (#RRGGBB).
function isValidHex(val) {
  return typeof val === "string" && /^#[0-9a-fA-F]{6}$/.test(val);
}

// Returns input.customColors if it is an array of exactly 3 valid hex strings;
// otherwise returns the provided fallback. Used by all sanitize functions that
// expose a customColors field so corrupted settings cannot reach the renderer.
function sanitizeCustomColors(input, fallback) {
  if (Array.isArray(input) && input.length === 3 && input.every(isValidHex)) {
    return input;
  }
  return fallback;
}

const DEFAULT_SETTINGS = Object.freeze({
  launchOnStartup: false,
  selectedTheme: "ambientWave",
  colorMode: "manual",
  customColors: Object.freeze(["#00f2fe", "#4facfe", "#8ee2ff"]),
  themeAutomation: Object.freeze({
    enabled: false,
    checkIntervalMinutes: 30, 
    mode: "dayNight",         
    dayTheme: "ambientWave", 
    nightTheme: "reactiveBorder",
    dayStartHour: 6,
    nightStartHour: 18
  }),
  performanceMode: "balanced",
  fpsLimit: "default",
  ambientWave: Object.freeze({
    tone: "blue",
    sensitivity: "medium",
    edgeMode: "bottom",
    glowStrength: "medium"
  }),
  reactiveBorder: Object.freeze({
    colorStyle: "rainbow",
    intensity: "medium",
    borderThickness: "thin",
    glowStrength: "medium"
  }),
  flowBorder: Object.freeze({
    direction: "clockwise",
    speedMode: "balanced",
    segmentLength: "medium",
    glowStrength: "medium",
    colorStyle: "rainbow"
  }),
  sideBars: Object.freeze({
    colorStyle: "multicolor",
    barThickness: "thick",
    sensitivity: "medium",
    barDensity: "medium",
    customColors: ["#00f2fe", "#4facfe", "#8ee2ff"],
    customThickness: 4,
    customGap: 7,
    customSensitivity: 30
  }),
  flatRipples: Object.freeze({
    mode: "sideRipples",
    intensity: "medium",
    colorStyle: "blue",
    speed: "calm"
  }),
  dotParticles: Object.freeze({
    density: "medium",
    motionStyle: "balanced",
    directionBehavior: "beatReactive",
    glowStrength: "medium"
  }),
  rippleFlow: Object.freeze({
    mode: "sideRipples",
    intensity: "medium",
    sensitivity: "medium",
    colorStyle: "blue"
  }),
  snowBubbleParticles: Object.freeze({
    fallArea: "middle",
    density: "medium",
    motionStyle: "balanced",
    glowStrength: "medium",
    particleSize: "medium"
  }),
  edgeCrystals: Object.freeze({
    flutterStyle: "balanced",
    density: "medium",
    glowStrength: "medium",
    colorStyle: "blue",
    edgeMode: "both"
  }),
  sideBraids: Object.freeze({
    braidDensity: "medium",
    motionStyle: "balanced",
    glowStrength: "medium",
    braidWidth: "medium",
    colorStyle: "cyanPink",
    flowDirection: "topDown",
    customColors: ["#00e5ff", "#ff2d7b", "#8ee2ff"],
    customThickness: 4,
    customGap: 7,
    customSensitivity: 30,
    customSpeed: 30
  }),
  focusMode: Object.freeze({
    enabled: false,
    dimOpacity: 0.1,
    idleTimeout: 5
  }),
  auroraDrift: Object.freeze({
    // Standard settings
    auroraStyle: "cinematic",
    intensity: "balanced",
    height: "medium",
    glowStrength: "medium",
    motionSpeed: "balanced",
    colorPalette: "cyanViolet",
    audioReactivity: "balanced",
    softness: "smooth",
    layerDensity: "balanced",

    // Advanced Custom settings
    gradientStops: Object.freeze([
      { pos: 0.0, color: "#00e5ff" },
      { pos: 0.35, color: "#0077ff" },
      { pos: 0.7, color: "#7f00ff" },
      { pos: 1.0, color: "#ff007f" }
    ]),
    baseGlowRadius: 1.0,
    peakGlowRadius: 1.0,
    crestBrightness: 1.0,
    bloomStrength: 1.0,
    glowFalloff: 1.0,
    primaryFrequency: 1.0,
    secondaryFrequency: 1.0,
    turbulenceComplexity: 1.0,
    motionSmoothness: 1.0,
    driftSpeed: 1.0,
    bassInfluence: 1.0,
    midInfluence: 1.0,
    highShimmer: 1.0,
    audioSmoothing: 1.0,
    peakSensitivity: 1.0,
    ribbonHeight: 1.0,
    ribbonWidth: 1.0,
    edgeSoftness: 1.0,
    layerSeparation: 1.0,
    crestSharpness: 1.0,
    layerCount: 5,
    backgroundHaze: 1.0,
    foregroundHighlight: 1.0,
    parallaxDepth: 1.0,
    ambientOpacity: 1.0,
    colorSaturation: 1.0,
    atmosphericFade: 1.0,
    edgeFeathering: 1.0
  })
});

const VALID_MAIN_THEMES = new Set(["ambientWave", "reactiveBorder", "flowBorder", "sideBars", "flatRipples", "dotParticles", "rippleFlow", "snowBubbleParticles", "edgeCrystals", "sideBraids", "auroraDrift"]);
const VALID_COLOR_MODES = new Set(["manual", "adaptive"]);
const VALID_PERFORMANCE_MODES = new Set(["performance", "balanced", "quality"]);
const VALID_FPS_LIMITS = new Set(["default", "battery", "unlocked"]);
const VALID_AMBIENT_TONES = new Set(["blue", "purple", "warm", "custom"]);
const VALID_LEVELS = new Set(["low", "medium", "high", "custom"]);
const VALID_EDGE_MODES = new Set(["top", "bottom", "both"]);
const VALID_GLOW_STRENGTHS = new Set(["soft", "medium", "strong", "custom"]);
const VALID_REACTIVE_COLOR_STYLES = new Set(["rainbow", "neonBlue", "neonPurple", "warmGlow", "custom"]);
const VALID_BORDER_THICKNESS = new Set(["thin", "medium", "thick", "custom"]);
const VALID_FLOW_DIRECTIONS = new Set(["clockwise", "anticlockwise"]);
const VALID_FLOW_SPEEDS = new Set(["calm", "balanced", "energetic", "custom"]);
const VALID_FLOW_SEGMENTS = new Set(["short", "medium", "long", "custom"]);
const VALID_FLOW_COLOR_STYLES = new Set(["rainbow", "cool", "warm", "custom"]);
const VALID_SIDE_BARS_COLOR_STYLES = new Set(["white", "yellow", "aqua", "multicolor", "custom"]);
const VALID_SIDE_BARS_THICKNESS = new Set(["thin", "medium", "thick", "custom"]);
const VALID_SIDE_BARS_DENSITY = new Set(["low", "medium", "high", "custom"]);
const VALID_FLAT_RIPPLES_MODES = new Set(["sideRipples", "flatRipples"]);
const VALID_FLAT_RIPPLES_COLORS = new Set(["red", "blue", "white", "multicolor", "custom"]);
const VALID_FLAT_RIPPLES_SPEEDS = new Set(["calm", "balanced", "energetic", "custom"]);
const VALID_DOT_PARTICLES_MOTION_STYLES = new Set(["calm", "balanced", "energetic", "custom"]);
const VALID_DOT_PARTICLES_DIRECTIONS = new Set(["mostlyClockwise", "mostlyAnticlockwise", "beatReactive"]);
const VALID_RIPPLE_FLOW_MODES = new Set(["sideRipples", "flatRipples"]);
const VALID_RIPPLE_FLOW_COLORS = new Set(["red", "blue", "white", "custom"]);
const VALID_SNOW_FALL_AREAS = new Set(["middle", "fullWidth"]);
const VALID_PARTICLE_SIZES = new Set(["small", "medium", "large", "custom"]);
const VALID_EDGE_FLUTTER_STYLES = new Set(["soft", "balanced", "energetic", "custom"]);
const VALID_EDGE_FLUTTER_COLORS = new Set(["blue", "purple", "red", "white", "custom"]);
const VALID_EDGE_FLUTTER_MODES = new Set(["left", "right", "both"]);
const VALID_BRAID_DENSITY = new Set(["sparse", "medium", "dense", "custom"]);
const VALID_BRAID_WIDTH = new Set(["thin", "medium", "thick", "custom"]);
const VALID_BRAID_MOTION = new Set(["calm", "balanced", "energetic", "custom"]);
const VALID_BRAID_COLORS = new Set(["cyanPink", "bluePurple", "redBlue", "white", "custom"]);
const VALID_BRAID_DIRECTION = new Set(["topDown", "bottomUp"]);
const VALID_AURORA_STYLES = new Set(["ambient", "cinematic", "energetic"]);
const VALID_AURORA_INTENSITIES = new Set(["subtle", "balanced", "vivid"]);
const VALID_AURORA_HEIGHTS = new Set(["low", "medium", "tall"]);
const VALID_AURORA_GLOWS = new Set(["soft", "medium", "strong"]);
const VALID_AURORA_SPEEDS = new Set(["calm", "balanced", "fast"]);
const VALID_AURORA_PALETTES = new Set(["cyanViolet", "emeraldSky", "sunsetDream", "frozenBlue", "monochrome"]);
const VALID_AURORA_AUDIO = new Set(["subtle", "balanced", "responsive"]);
const VALID_AURORA_SOFTNESS = new Set(["misty", "smooth", "defined"]);
const VALID_AURORA_DENSITY = new Set(["light", "balanced", "rich"]);

function createDefaultSettings() {
  return {
    launchOnStartup: DEFAULT_SETTINGS.launchOnStartup,
    selectedTheme: DEFAULT_SETTINGS.selectedTheme,
    colorMode: DEFAULT_SETTINGS.colorMode,
    themeAutomation: { ...DEFAULT_SETTINGS.themeAutomation },
    performanceMode: DEFAULT_SETTINGS.performanceMode,
    focusMode: { ...DEFAULT_SETTINGS.focusMode },
    fpsLimit: DEFAULT_SETTINGS.fpsLimit,
    ambientWave: { ...DEFAULT_SETTINGS.ambientWave },
    reactiveBorder: { ...DEFAULT_SETTINGS.reactiveBorder },
    flowBorder: { ...DEFAULT_SETTINGS.flowBorder },
    sideBars: { ...DEFAULT_SETTINGS.sideBars },
    flatRipples: { ...DEFAULT_SETTINGS.flatRipples },
    dotParticles: { ...DEFAULT_SETTINGS.dotParticles },
    rippleFlow: { ...DEFAULT_SETTINGS.rippleFlow },
    snowBubbleParticles: { ...DEFAULT_SETTINGS.snowBubbleParticles },
    edgeCrystals: { ...DEFAULT_SETTINGS.edgeCrystals },
    sideBraids: { ...DEFAULT_SETTINGS.sideBraids },
    auroraDrift: { ...DEFAULT_SETTINGS.auroraDrift }
  };
}

function createThemeDefaults() {
  return {
    ambientWave: { ...DEFAULT_SETTINGS.ambientWave },
    reactiveBorder: { ...DEFAULT_SETTINGS.reactiveBorder },
    flowBorder: { ...DEFAULT_SETTINGS.flowBorder },
    sideBars: { ...DEFAULT_SETTINGS.sideBars },
    flatRipples: { ...DEFAULT_SETTINGS.flatRipples },
    dotParticles: { ...DEFAULT_SETTINGS.dotParticles },
    rippleFlow: { ...DEFAULT_SETTINGS.rippleFlow },
    snowBubbleParticles: { ...DEFAULT_SETTINGS.snowBubbleParticles },
    edgeCrystals: { ...DEFAULT_SETTINGS.edgeCrystals },
    sideBraids: { ...DEFAULT_SETTINGS.sideBraids },
    auroraDrift: { ...DEFAULT_SETTINGS.auroraDrift }
  };
}

function pick(value, validValues, fallback) {
  return validValues.has(value) ? value : fallback;
}

function legacySensitivityToLevel(value) {
  if (!Number.isFinite(value)) {
    return "medium";
  }

  if (value < 2.6) {
    return "low";
  }

  if (value < 4.2) {
    return "medium";
  }

  return "high";
}

// Validates and clamps a custom thickness value (range: 1 to 20, default: 4).
function sanitizeThickness(val, fallback = 4) {
  const num = typeof val === "number" ? val : parseInt(val, 10);
  return Number.isFinite(num) ? Math.max(1, Math.min(20, num)) : fallback;
}

// Validates and clamps a custom gap value (range: 2 to 30, default: 7).
function sanitizeGap(val, fallback = 7) {
  const num = typeof val === "number" ? val : parseInt(val, 10);
  return Number.isFinite(num) ? Math.max(2, Math.min(30, num)) : fallback;
}

// Validates and clamps a custom sensitivity value (range: 1 to 100, default: 30).
function sanitizeSensitivity(val, fallback = 30) {
  const num = typeof val === "number" ? val : parseInt(val, 10);
  return Number.isFinite(num) ? Math.max(1, Math.min(100, num)) : fallback;
}

// Validates and clamps a custom speed value (range: 1 to 100, default: 30).
function sanitizeSpeed(val, fallback = 30) {
  const num = typeof val === "number" ? val : parseInt(val, 10);
  return Number.isFinite(num) ? Math.max(1, Math.min(100, num)) : fallback;
}

function sanitizeThemeAutomation(input = {}) {
  let dayStart = typeof input.dayStartHour === "number"
    ? input.dayStartHour
    : (input.dayStartHour !== undefined ? parseInt(input.dayStartHour, 10) : DEFAULT_SETTINGS.themeAutomation.dayStartHour);
  if (isNaN(dayStart) || dayStart < 0 || dayStart > 23) {
    dayStart = DEFAULT_SETTINGS.themeAutomation.dayStartHour;
  }

  let nightStart = typeof input.nightStartHour === "number"
    ? input.nightStartHour
    : (input.nightStartHour !== undefined ? parseInt(input.nightStartHour, 10) : DEFAULT_SETTINGS.themeAutomation.nightStartHour);
  if (isNaN(nightStart) || nightStart < 0 || nightStart > 23) {
    nightStart = DEFAULT_SETTINGS.themeAutomation.nightStartHour;
  }

  return {
    enabled: typeof input.enabled === "boolean" ? input.enabled : DEFAULT_SETTINGS.themeAutomation.enabled,
    checkIntervalMinutes: typeof input.checkIntervalMinutes === "number"
      ? Math.max(1, Math.min(120, input.checkIntervalMinutes))
      : DEFAULT_SETTINGS.themeAutomation.checkIntervalMinutes,
    mode: typeof input.mode === "string" ? input.mode : DEFAULT_SETTINGS.themeAutomation.mode,
    dayTheme: pick(input.dayTheme, VALID_MAIN_THEMES, DEFAULT_SETTINGS.themeAutomation.dayTheme),
    nightTheme: pick(input.nightTheme, VALID_MAIN_THEMES, DEFAULT_SETTINGS.themeAutomation.nightTheme),
    dayStartHour: dayStart,
    nightStartHour: nightStart
  };
}

function sanitizeAmbientWave(input = {}) {
  return {
    tone: pick(input.tone, VALID_AMBIENT_TONES, DEFAULT_SETTINGS.ambientWave.tone),
    sensitivity: pick(input.sensitivity, VALID_LEVELS, DEFAULT_SETTINGS.ambientWave.sensitivity),
    edgeMode: pick(input.edgeMode, VALID_EDGE_MODES, DEFAULT_SETTINGS.ambientWave.edgeMode),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.ambientWave.glowStrength),
    customColors: sanitizeCustomColors(input.customColors, DEFAULT_SETTINGS.customColors),
    customSensitivity: sanitizeSensitivity(input.customSensitivity)
  };
}

function sanitizeReactiveBorder(input = {}) {
  return {
    colorStyle: pick(input.colorStyle, VALID_REACTIVE_COLOR_STYLES, DEFAULT_SETTINGS.reactiveBorder.colorStyle),
    intensity: pick(input.intensity, VALID_LEVELS, DEFAULT_SETTINGS.reactiveBorder.intensity),
    borderThickness: pick(input.borderThickness, VALID_BORDER_THICKNESS, DEFAULT_SETTINGS.reactiveBorder.borderThickness),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.reactiveBorder.glowStrength),
    customColors: sanitizeCustomColors(input.customColors, DEFAULT_SETTINGS.customColors),
    customThickness: sanitizeThickness(input.customThickness),
    customSensitivity: sanitizeSensitivity(input.customSensitivity)
  };
}

function sanitizeFlowBorder(input = {}) {
  return {
    direction: pick(input.direction, VALID_FLOW_DIRECTIONS, DEFAULT_SETTINGS.flowBorder.direction),
    speedMode: pick(input.speedMode, VALID_FLOW_SPEEDS, DEFAULT_SETTINGS.flowBorder.speedMode),
    segmentLength: pick(input.segmentLength, VALID_FLOW_SEGMENTS, DEFAULT_SETTINGS.flowBorder.segmentLength),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.flowBorder.glowStrength),
    colorStyle: pick(input.colorStyle, VALID_FLOW_COLOR_STYLES, DEFAULT_SETTINGS.flowBorder.colorStyle),
    customColors: sanitizeCustomColors(input.customColors, DEFAULT_SETTINGS.customColors),
    customThickness: sanitizeThickness(input.customThickness),
    customSensitivity: sanitizeSensitivity(input.customSensitivity),
    customSpeed: sanitizeSpeed(input.customSpeed)
  };
}

function sanitizeSideBars(input = {}) {
  const customColors = sanitizeCustomColors(input.customColors, DEFAULT_SETTINGS.sideBars.customColors);

  return {
    colorStyle: pick(input.colorStyle, VALID_SIDE_BARS_COLOR_STYLES, DEFAULT_SETTINGS.sideBars.colorStyle),
    barThickness: pick(input.barThickness, VALID_SIDE_BARS_THICKNESS, DEFAULT_SETTINGS.sideBars.barThickness),
    sensitivity: pick(input.sensitivity, VALID_LEVELS, DEFAULT_SETTINGS.sideBars.sensitivity),
    barDensity: pick(input.barDensity, VALID_SIDE_BARS_DENSITY, DEFAULT_SETTINGS.sideBars.barDensity),
    customColors,
    customThickness: sanitizeThickness(input.customThickness, DEFAULT_SETTINGS.sideBars.customThickness),
    customGap: sanitizeGap(input.customGap, DEFAULT_SETTINGS.sideBars.customGap),
    customSensitivity: sanitizeSensitivity(input.customSensitivity, DEFAULT_SETTINGS.sideBars.customSensitivity)
  };
}

function sanitizeFlatRipples(input = {}) {
  return {
    mode: pick(input.mode, VALID_FLAT_RIPPLES_MODES, DEFAULT_SETTINGS.flatRipples.mode),
    intensity: pick(input.intensity, VALID_LEVELS, DEFAULT_SETTINGS.flatRipples.intensity),
    colorStyle: pick(input.colorStyle, VALID_FLAT_RIPPLES_COLORS, DEFAULT_SETTINGS.flatRipples.colorStyle),
    speed: pick(input.speed, VALID_FLAT_RIPPLES_SPEEDS, DEFAULT_SETTINGS.flatRipples.speed),
    customColors: sanitizeCustomColors(input.customColors, DEFAULT_SETTINGS.customColors),
    customSensitivity: sanitizeSensitivity(input.customSensitivity),
    customSpeed: sanitizeSpeed(input.customSpeed)
  };
}

function sanitizeDotParticles(input = {}) {
  return {
    density: pick(input.density, VALID_LEVELS, DEFAULT_SETTINGS.dotParticles.density),
    motionStyle: pick(input.motionStyle, VALID_DOT_PARTICLES_MOTION_STYLES, DEFAULT_SETTINGS.dotParticles.motionStyle),
    directionBehavior: pick(input.directionBehavior, VALID_DOT_PARTICLES_DIRECTIONS, DEFAULT_SETTINGS.dotParticles.directionBehavior),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.dotParticles.glowStrength),
    customGap: sanitizeGap(input.customGap),
    customSpeed: sanitizeSpeed(input.customSpeed)
  };
}

function sanitizeRippleFlow(input = {}) {
  return {
    mode: pick(input.mode, VALID_RIPPLE_FLOW_MODES, DEFAULT_SETTINGS.rippleFlow.mode),
    intensity: pick(input.intensity, VALID_LEVELS, DEFAULT_SETTINGS.rippleFlow.intensity),
    sensitivity: pick(input.sensitivity, VALID_LEVELS, DEFAULT_SETTINGS.rippleFlow.sensitivity),
    colorStyle: pick(input.colorStyle, VALID_RIPPLE_FLOW_COLORS, DEFAULT_SETTINGS.rippleFlow.colorStyle),
    customColors: sanitizeCustomColors(input.customColors, DEFAULT_SETTINGS.customColors),
    customSensitivity: sanitizeSensitivity(input.customSensitivity)
  };
}

function sanitizeSnowBubbleParticles(input = {}) {
  return {
    fallArea: pick(input.fallArea, VALID_SNOW_FALL_AREAS, DEFAULT_SETTINGS.snowBubbleParticles.fallArea),
    density: pick(input.density, VALID_LEVELS, DEFAULT_SETTINGS.snowBubbleParticles.density),
    motionStyle: pick(input.motionStyle, VALID_DOT_PARTICLES_MOTION_STYLES, DEFAULT_SETTINGS.snowBubbleParticles.motionStyle),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.snowBubbleParticles.glowStrength),
    particleSize: pick(input.particleSize, VALID_PARTICLE_SIZES, DEFAULT_SETTINGS.snowBubbleParticles.particleSize)
  };
}

function sanitizeEdgeCrystals(input = {}) {
  return {
    flutterStyle: pick(input.flutterStyle, VALID_EDGE_FLUTTER_STYLES, DEFAULT_SETTINGS.edgeCrystals.flutterStyle),
    density: pick(input.density, VALID_LEVELS, DEFAULT_SETTINGS.edgeCrystals.density),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.edgeCrystals.glowStrength),
    colorStyle: pick(input.colorStyle, VALID_EDGE_FLUTTER_COLORS, DEFAULT_SETTINGS.edgeCrystals.colorStyle),
    edgeMode: pick(input.edgeMode, VALID_EDGE_FLUTTER_MODES, DEFAULT_SETTINGS.edgeCrystals.edgeMode),
    customColors: sanitizeCustomColors(input.customColors, DEFAULT_SETTINGS.customColors),
    customGap: sanitizeGap(input.customGap),
    customSensitivity: sanitizeSensitivity(input.customSensitivity),
    customSpeed: sanitizeSpeed(input.customSpeed)
  };
}

function sanitizeSideBraids(input = {}) {
  return {
    braidDensity: pick(input.braidDensity, VALID_BRAID_DENSITY, DEFAULT_SETTINGS.sideBraids.braidDensity),
    motionStyle: pick(input.motionStyle, VALID_BRAID_MOTION, DEFAULT_SETTINGS.sideBraids.motionStyle),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.sideBraids.glowStrength),
    braidWidth: pick(input.braidWidth, VALID_BRAID_WIDTH, DEFAULT_SETTINGS.sideBraids.braidWidth),
    colorStyle: pick(input.colorStyle, VALID_BRAID_COLORS, DEFAULT_SETTINGS.sideBraids.colorStyle),
    flowDirection: pick(input.flowDirection, VALID_BRAID_DIRECTION, DEFAULT_SETTINGS.sideBraids.flowDirection),
    customColors: sanitizeCustomColors(input.customColors, DEFAULT_SETTINGS.sideBraids.customColors),
    customThickness: sanitizeThickness(input.customThickness, DEFAULT_SETTINGS.sideBraids.customThickness),
    customGap: sanitizeGap(input.customGap, DEFAULT_SETTINGS.sideBraids.customGap),
    customSensitivity: sanitizeSensitivity(input.customSensitivity, DEFAULT_SETTINGS.sideBraids.customSensitivity),
    customSpeed: sanitizeSpeed(input.customSpeed, DEFAULT_SETTINGS.sideBraids.customSpeed)
  };
}

function sanitizeAuroraDrift(input = {}) {
  function sanitizeNum(val, fallback, min = 0.0, max = 5.0) {
    const num = parseFloat(val);
    return Number.isFinite(num) ? Math.max(min, Math.min(max, num)) : fallback;
  }

  let stops = DEFAULT_SETTINGS.auroraDrift.gradientStops;
  if (Array.isArray(input.gradientStops)) {
    const parsedStops = input.gradientStops
      .map(stop => {
        const pos = Math.max(0.0, Math.min(1.0, parseFloat(stop?.pos)));
        const color = typeof stop?.color === "string" && /^#[0-9a-fA-F]{6}$/.test(stop.color)
          ? stop.color
          : "#ffffff";
        return { pos, color };
      })
      .filter(stop => Number.isFinite(stop.pos))
      .sort((a, b) => a.pos - b.pos);
    
    if (parsedStops.length >= 2 && parsedStops.length <= 6) {
      stops = parsedStops;
    }
  }

  return {
    auroraStyle: pick(input.auroraStyle, VALID_AURORA_STYLES, DEFAULT_SETTINGS.auroraDrift.auroraStyle),
    intensity: pick(input.intensity, VALID_AURORA_INTENSITIES, DEFAULT_SETTINGS.auroraDrift.intensity),
    height: pick(input.height, VALID_AURORA_HEIGHTS, DEFAULT_SETTINGS.auroraDrift.height),
    glowStrength: pick(input.glowStrength, VALID_AURORA_GLOWS, DEFAULT_SETTINGS.auroraDrift.glowStrength),
    motionSpeed: pick(input.motionSpeed, VALID_AURORA_SPEEDS, DEFAULT_SETTINGS.auroraDrift.motionSpeed),
    colorPalette: pick(input.colorPalette, VALID_AURORA_PALETTES, DEFAULT_SETTINGS.auroraDrift.colorPalette),
    audioReactivity: pick(input.audioReactivity, VALID_AURORA_AUDIO, DEFAULT_SETTINGS.auroraDrift.audioReactivity),
    softness: pick(input.softness, VALID_AURORA_SOFTNESS, DEFAULT_SETTINGS.auroraDrift.softness),
    layerDensity: pick(input.layerDensity, VALID_AURORA_DENSITY, DEFAULT_SETTINGS.auroraDrift.layerDensity),

    gradientStops: stops,
    baseGlowRadius: sanitizeNum(input.baseGlowRadius, DEFAULT_SETTINGS.auroraDrift.baseGlowRadius, 0.1, 3.0),
    peakGlowRadius: sanitizeNum(input.peakGlowRadius, DEFAULT_SETTINGS.auroraDrift.peakGlowRadius, 0.1, 3.0),
    crestBrightness: sanitizeNum(input.crestBrightness, DEFAULT_SETTINGS.auroraDrift.crestBrightness, 0.1, 3.0),
    bloomStrength: sanitizeNum(input.bloomStrength, DEFAULT_SETTINGS.auroraDrift.bloomStrength, 0.0, 3.0),
    glowFalloff: sanitizeNum(input.glowFalloff, DEFAULT_SETTINGS.auroraDrift.glowFalloff, 0.1, 3.0),
    primaryFrequency: sanitizeNum(input.primaryFrequency, DEFAULT_SETTINGS.auroraDrift.primaryFrequency, 0.1, 3.0),
    secondaryFrequency: sanitizeNum(input.secondaryFrequency, DEFAULT_SETTINGS.auroraDrift.secondaryFrequency, 0.1, 3.0),
    turbulenceComplexity: sanitizeNum(input.turbulenceComplexity, DEFAULT_SETTINGS.auroraDrift.turbulenceComplexity, 0.1, 3.0),
    motionSmoothness: sanitizeNum(input.motionSmoothness, DEFAULT_SETTINGS.auroraDrift.motionSmoothness, 0.1, 3.0),
    driftSpeed: sanitizeNum(input.driftSpeed, DEFAULT_SETTINGS.auroraDrift.driftSpeed, 0.0, 3.0),
    bassInfluence: sanitizeNum(input.bassInfluence, DEFAULT_SETTINGS.auroraDrift.bassInfluence, 0.0, 3.0),
    midInfluence: sanitizeNum(input.midInfluence, DEFAULT_SETTINGS.auroraDrift.midInfluence, 0.0, 3.0),
    highShimmer: sanitizeNum(input.highShimmer, DEFAULT_SETTINGS.auroraDrift.highShimmer, 0.0, 3.0),
    audioSmoothing: sanitizeNum(input.audioSmoothing, DEFAULT_SETTINGS.auroraDrift.audioSmoothing, 0.1, 3.0),
    peakSensitivity: sanitizeNum(input.peakSensitivity, DEFAULT_SETTINGS.auroraDrift.peakSensitivity, 0.1, 3.0),
    ribbonHeight: sanitizeNum(input.ribbonHeight, DEFAULT_SETTINGS.auroraDrift.ribbonHeight, 0.1, 3.0),
    ribbonWidth: sanitizeNum(input.ribbonWidth, DEFAULT_SETTINGS.auroraDrift.ribbonWidth, 0.1, 3.0),
    edgeSoftness: sanitizeNum(input.edgeSoftness, DEFAULT_SETTINGS.auroraDrift.edgeSoftness, 0.1, 3.0),
    layerSeparation: sanitizeNum(input.layerSeparation, DEFAULT_SETTINGS.auroraDrift.layerSeparation, 0.1, 3.0),
    crestSharpness: sanitizeNum(input.crestSharpness, DEFAULT_SETTINGS.auroraDrift.crestSharpness, 0.1, 3.0),
    layerCount: Math.round(sanitizeNum(input.layerCount, DEFAULT_SETTINGS.auroraDrift.layerCount, 1, 6)),
    backgroundHaze: sanitizeNum(input.backgroundHaze, DEFAULT_SETTINGS.auroraDrift.backgroundHaze, 0.0, 3.0),
    foregroundHighlight: sanitizeNum(input.foregroundHighlight, DEFAULT_SETTINGS.auroraDrift.foregroundHighlight, 0.0, 3.0),
    parallaxDepth: sanitizeNum(input.parallaxDepth, DEFAULT_SETTINGS.auroraDrift.parallaxDepth, 0.0, 3.0),
    ambientOpacity: sanitizeNum(input.ambientOpacity, DEFAULT_SETTINGS.auroraDrift.ambientOpacity, 0.0, 3.0),
    colorSaturation: sanitizeNum(input.colorSaturation, DEFAULT_SETTINGS.auroraDrift.colorSaturation, 0.0, 3.0),
    atmosphericFade: sanitizeNum(input.atmosphericFade, DEFAULT_SETTINGS.auroraDrift.atmosphericFade, 0.0, 3.0),
    edgeFeathering: sanitizeNum(input.edgeFeathering, DEFAULT_SETTINGS.auroraDrift.edgeFeathering, 0.0, 3.0)
  };
}

function migrateLegacySettings(input = {}) {
  if (VALID_MAIN_THEMES.has(input.selectedTheme) && !input.edgeFlutter) {
    return input;
  }

  const normalizedInput = { ...input };

  if (normalizedInput.selectedTheme === "edgeFlutter") {
    normalizedInput.selectedTheme = "edgeCrystals";
  }

  if (normalizedInput.edgeFlutter && !normalizedInput.edgeCrystals) {
    normalizedInput.edgeCrystals = normalizedInput.edgeFlutter;
  }

  if (VALID_MAIN_THEMES.has(normalizedInput.selectedTheme)) {
    return normalizedInput;
  }

  const migrated = createDefaultSettings();
  const legacyTheme = normalizedInput.theme;
  const legacyLevel = legacySensitivityToLevel(normalizedInput.sensitivity);

  migrated.ambientWave.sensitivity = legacyLevel;

  if (VALID_EDGE_MODES.has(normalizedInput.edgeMode)) {
    migrated.ambientWave.edgeMode = normalizedInput.edgeMode;
  }

  if (legacyTheme === "purple" || legacyTheme === "warm") {
    migrated.ambientWave.tone = legacyTheme;
  }

  if (legacyTheme === "rainbow") {
    migrated.selectedTheme = "reactiveBorder";
    migrated.reactiveBorder.intensity = legacyLevel;
  } else if (legacyTheme === "flow") {
    migrated.selectedTheme = "flowBorder";
  } else {
    migrated.selectedTheme = "ambientWave";
    if (legacyTheme === "blue" || legacyTheme === "purple" || legacyTheme === "warm") {
      migrated.ambientWave.tone = legacyTheme;
    }
  }

  return migrated;
}

function sanitizeFocusMode(input = {}) {
  const enabled = typeof input.enabled === "boolean" ? input.enabled : DEFAULT_SETTINGS.focusMode.enabled;
  const dimOpacity = typeof input.dimOpacity === "number" && input.dimOpacity >= 0 && input.dimOpacity <= 1
    ? input.dimOpacity
    : DEFAULT_SETTINGS.focusMode.dimOpacity;
  const idleTimeout = typeof input.idleTimeout === "number" && input.idleTimeout >= 1 && input.idleTimeout <= 60
    ? input.idleTimeout
    : DEFAULT_SETTINGS.focusMode.idleTimeout;
  return { enabled, dimOpacity, idleTimeout };
}

function sanitizeSettings(input = {}) {
  const source = migrateLegacySettings(input);

  const customColors = sanitizeCustomColors(source.customColors, DEFAULT_SETTINGS.customColors);

  return {
    launchOnStartup: typeof source.launchOnStartup === "boolean" ? source.launchOnStartup : DEFAULT_SETTINGS.launchOnStartup,
    selectedTheme: pick(source.selectedTheme, VALID_MAIN_THEMES, DEFAULT_SETTINGS.selectedTheme),
    colorMode: pick(source.colorMode, VALID_COLOR_MODES, DEFAULT_SETTINGS.colorMode),
    customColors: customColors,
    themeAutomation: sanitizeThemeAutomation(source.themeAutomation),
    performanceMode: pick(source.performanceMode, VALID_PERFORMANCE_MODES, DEFAULT_SETTINGS.performanceMode),
    fpsLimit: pick(source.fpsLimit, VALID_FPS_LIMITS, DEFAULT_SETTINGS.fpsLimit),
    focusMode: sanitizeFocusMode(source.focusMode),
    ambientWave: sanitizeAmbientWave(source.ambientWave),
    reactiveBorder: sanitizeReactiveBorder(source.reactiveBorder),
    flowBorder: sanitizeFlowBorder(source.flowBorder),
    sideBars: sanitizeSideBars(source.sideBars),
    flatRipples: sanitizeFlatRipples(source.flatRipples),
    dotParticles: sanitizeDotParticles(source.dotParticles),
    rippleFlow: sanitizeRippleFlow(source.rippleFlow),
    snowBubbleParticles: sanitizeSnowBubbleParticles(source.snowBubbleParticles),
    edgeCrystals: sanitizeEdgeCrystals(source.edgeCrystals),
    sideBraids: sanitizeSideBraids(source.sideBraids),
    auroraDrift: sanitizeAuroraDrift(source.auroraDrift)
  };
}

function createSettingsStore(userDataPath) {
  const settingsPath = path.join(userDataPath, "settings.json");
  const profilesPath = path.join(userDataPath, "themeProfiles.json");

  function load() {
    try {
      if (!fs.existsSync(settingsPath)) {
        return createDefaultSettings();
      }

      const fileContent = fs.readFileSync(settingsPath, "utf8");
      const parsed = JSON.parse(fileContent);
      return sanitizeSettings(parsed);
    } catch (_error) {
      return createDefaultSettings();
    }
  }

  function save(settings) {
    const cleanSettings = sanitizeSettings(settings);
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(cleanSettings, null, 2));
    return cleanSettings;
  }
  function loadProfiles() {
    try {
      if (!fs.existsSync(profilesPath)) {
        return {};
      }

      const fileContent = fs.readFileSync(profilesPath, "utf8");
      const parsed = JSON.parse(fileContent);
      // JSON.parse can return null, arrays, or primitives. Guard against any
      // non-plain-object result so callers always receive a key-value map.
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
      }
      return parsed;
    } catch (_error) {
      return {};
    }
  }

  function saveProfiles(profiles) {
    fs.mkdirSync(path.dirname(profilesPath), { recursive: true });

    fs.writeFileSync(
      profilesPath,
      JSON.stringify(profiles, null, 2)
    );

    return profiles;
  }

  return {
    load,
    save,
    loadProfiles,
    saveProfiles,
    path: settingsPath,
    profilesPath
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  createDefaultSettings,
  createThemeDefaults,
  createSettingsStore,
  sanitizeSettings
};
