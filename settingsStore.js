const fs = require("fs");
const path = require("path");

const DEFAULT_SETTINGS = Object.freeze({
  selectedTheme: "ambientWave",
  globalSensitivity: 1.0,
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
    barDensity: "medium"
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
  })
});

const VALID_MAIN_THEMES = new Set(["ambientWave", "reactiveBorder", "flowBorder", "sideBars", "flatRipples", "dotParticles", "rippleFlow", "snowBubbleParticles", "edgeCrystals"]);
const VALID_AMBIENT_TONES = new Set(["blue", "purple", "warm"]);
const VALID_LEVELS = new Set(["low", "medium", "high"]);
const VALID_EDGE_MODES = new Set(["top", "bottom", "both"]);
const VALID_GLOW_STRENGTHS = new Set(["soft", "medium", "strong"]);
const VALID_REACTIVE_COLOR_STYLES = new Set(["rainbow", "neonBlue", "neonPurple", "warmGlow"]);
const VALID_BORDER_THICKNESS = new Set(["thin", "medium", "thick"]);
const VALID_FLOW_DIRECTIONS = new Set(["clockwise", "anticlockwise"]);
const VALID_FLOW_SPEEDS = new Set(["calm", "balanced", "energetic"]);
const VALID_FLOW_SEGMENTS = new Set(["short", "medium", "long"]);
const VALID_FLOW_COLOR_STYLES = new Set(["rainbow", "cool", "warm"]);
const VALID_SIDE_BARS_COLOR_STYLES = new Set(["white", "yellow", "aqua", "multicolor"]);
const VALID_SIDE_BARS_THICKNESS = new Set(["thin", "medium", "thick"]);
const VALID_SIDE_BARS_DENSITY = new Set(["low", "medium", "high"]);
const VALID_FLAT_RIPPLES_MODES = new Set(["sideRipples", "flatRipples"]);
const VALID_FLAT_RIPPLES_COLORS = new Set(["red", "blue", "white", "multicolor"]);
const VALID_FLAT_RIPPLES_SPEEDS = new Set(["calm", "balanced", "energetic"]);
const VALID_DOT_PARTICLES_MOTION_STYLES = new Set(["calm", "balanced", "energetic"]);
const VALID_DOT_PARTICLES_DIRECTIONS = new Set(["mostlyClockwise", "mostlyAnticlockwise", "beatReactive"]);
const VALID_RIPPLE_FLOW_MODES = new Set(["sideRipples", "flatRipples"]);
const VALID_RIPPLE_FLOW_COLORS = new Set(["red", "blue", "white"]);
const VALID_SNOW_FALL_AREAS = new Set(["middle", "fullWidth"]);
const VALID_PARTICLE_SIZES = new Set(["small", "medium", "large"]);
const VALID_EDGE_FLUTTER_STYLES = new Set(["soft", "balanced", "energetic"]);
const VALID_EDGE_FLUTTER_COLORS = new Set(["blue", "purple", "red", "white"]);
const VALID_EDGE_FLUTTER_MODES = new Set(["left", "right", "both"]);

function createDefaultSettings() {
  return {
    selectedTheme: DEFAULT_SETTINGS.selectedTheme,
    ambientWave: { ...DEFAULT_SETTINGS.ambientWave },
    globalSensitivity: DEFAULT_SETTINGS.globalSensitivity ,
    reactiveBorder: { ...DEFAULT_SETTINGS.reactiveBorder },
    flowBorder: { ...DEFAULT_SETTINGS.flowBorder },
    sideBars: { ...DEFAULT_SETTINGS.sideBars },
    flatRipples: { ...DEFAULT_SETTINGS.flatRipples },
    dotParticles: { ...DEFAULT_SETTINGS.dotParticles },
    rippleFlow: { ...DEFAULT_SETTINGS.rippleFlow },
    snowBubbleParticles: { ...DEFAULT_SETTINGS.snowBubbleParticles },
    edgeCrystals: { ...DEFAULT_SETTINGS.edgeCrystals }
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
    edgeCrystals: { ...DEFAULT_SETTINGS.edgeCrystals }
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

function sanitizeAmbientWave(input = {}) {
  return {
    tone: pick(input.tone, VALID_AMBIENT_TONES, DEFAULT_SETTINGS.ambientWave.tone),
    sensitivity: pick(input.sensitivity, VALID_LEVELS, DEFAULT_SETTINGS.ambientWave.sensitivity),
    edgeMode: pick(input.edgeMode, VALID_EDGE_MODES, DEFAULT_SETTINGS.ambientWave.edgeMode),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.ambientWave.glowStrength)
  };
}

function sanitizeReactiveBorder(input = {}) {
  return {
    colorStyle: pick(input.colorStyle, VALID_REACTIVE_COLOR_STYLES, DEFAULT_SETTINGS.reactiveBorder.colorStyle),
    intensity: pick(input.intensity, VALID_LEVELS, DEFAULT_SETTINGS.reactiveBorder.intensity),
    borderThickness: pick(input.borderThickness, VALID_BORDER_THICKNESS, DEFAULT_SETTINGS.reactiveBorder.borderThickness),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.reactiveBorder.glowStrength)
  };
}

function sanitizeFlowBorder(input = {}) {
  return {
    direction: pick(input.direction, VALID_FLOW_DIRECTIONS, DEFAULT_SETTINGS.flowBorder.direction),
    speedMode: pick(input.speedMode, VALID_FLOW_SPEEDS, DEFAULT_SETTINGS.flowBorder.speedMode),
    segmentLength: pick(input.segmentLength, VALID_FLOW_SEGMENTS, DEFAULT_SETTINGS.flowBorder.segmentLength),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.flowBorder.glowStrength),
    colorStyle: pick(input.colorStyle, VALID_FLOW_COLOR_STYLES, DEFAULT_SETTINGS.flowBorder.colorStyle)
  };
}

function sanitizeSideBars(input = {}) {
  return {
    colorStyle: pick(input.colorStyle, VALID_SIDE_BARS_COLOR_STYLES, DEFAULT_SETTINGS.sideBars.colorStyle),
    barThickness: pick(input.barThickness, VALID_SIDE_BARS_THICKNESS, DEFAULT_SETTINGS.sideBars.barThickness),
    sensitivity: pick(input.sensitivity, VALID_LEVELS, DEFAULT_SETTINGS.sideBars.sensitivity),
    barDensity: pick(input.barDensity, VALID_SIDE_BARS_DENSITY, DEFAULT_SETTINGS.sideBars.barDensity)
  };
}

function sanitizeFlatRipples(input = {}) {
  return {
    mode: pick(input.mode, VALID_FLAT_RIPPLES_MODES, DEFAULT_SETTINGS.flatRipples.mode),
    intensity: pick(input.intensity, VALID_LEVELS, DEFAULT_SETTINGS.flatRipples.intensity),
    colorStyle: pick(input.colorStyle, VALID_FLAT_RIPPLES_COLORS, DEFAULT_SETTINGS.flatRipples.colorStyle),
    speed: pick(input.speed, VALID_FLAT_RIPPLES_SPEEDS, DEFAULT_SETTINGS.flatRipples.speed)
  };
}

function sanitizeDotParticles(input = {}) {
  return {
    density: pick(input.density, VALID_LEVELS, DEFAULT_SETTINGS.dotParticles.density),
    motionStyle: pick(input.motionStyle, VALID_DOT_PARTICLES_MOTION_STYLES, DEFAULT_SETTINGS.dotParticles.motionStyle),
    directionBehavior: pick(input.directionBehavior, VALID_DOT_PARTICLES_DIRECTIONS, DEFAULT_SETTINGS.dotParticles.directionBehavior),
    glowStrength: pick(input.glowStrength, VALID_GLOW_STRENGTHS, DEFAULT_SETTINGS.dotParticles.glowStrength)
  };
}

function sanitizeRippleFlow(input = {}) {
  return {
    mode: pick(input.mode, VALID_RIPPLE_FLOW_MODES, DEFAULT_SETTINGS.rippleFlow.mode),
    intensity: pick(input.intensity, VALID_LEVELS, DEFAULT_SETTINGS.rippleFlow.intensity),
    sensitivity: pick(input.sensitivity, VALID_LEVELS, DEFAULT_SETTINGS.rippleFlow.sensitivity),
    colorStyle: pick(input.colorStyle, VALID_RIPPLE_FLOW_COLORS, DEFAULT_SETTINGS.rippleFlow.colorStyle)
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
    edgeMode: pick(input.edgeMode, VALID_EDGE_FLUTTER_MODES, DEFAULT_SETTINGS.edgeCrystals.edgeMode)
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

function sanitizeSettings(input = {}) {
  const source = migrateLegacySettings(input);

  return {
    selectedTheme: pick(source.selectedTheme, VALID_MAIN_THEMES, DEFAULT_SETTINGS.selectedTheme),
    globalSensitivity: typeof input.globalSensitivity === 'number' ? source.globalSensitivity : DEFAULT_SETTINGS.globalSensitivity,
    ambientWave: sanitizeAmbientWave(source.ambientWave),
    reactiveBorder: sanitizeReactiveBorder(source.reactiveBorder),
    flowBorder: sanitizeFlowBorder(source.flowBorder),
    sideBars: sanitizeSideBars(source.sideBars),
    flatRipples: sanitizeFlatRipples(source.flatRipples),
    dotParticles: sanitizeDotParticles(source.dotParticles),
    rippleFlow: sanitizeRippleFlow(source.rippleFlow),
    snowBubbleParticles: sanitizeSnowBubbleParticles(source.snowBubbleParticles),
    edgeCrystals: sanitizeEdgeCrystals(source.edgeCrystals)
  };
}

function createSettingsStore(userDataPath) {
  const settingsPath = path.join(userDataPath, "settings.json");

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

  return {
    load,
    save,
    path: settingsPath
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  createDefaultSettings,
  createThemeDefaults,
  createSettingsStore
};
