const canvas = document.getElementById("visualizer");
const context = canvas.getContext("2d");

const {
  TRANSPARENT_HAZE,
  clamp01
} = window.ParalineShared;

const {
  getAmbientTonePalette,
  getAmbientSensitivityMultiplier,
  drawAmbientWave
} = window.ParalineAmbientWave;

const {
  getReactiveInputMultiplier,
  drawReactiveBorder
} = window.ParalineReactiveBorder;

const {
  getFlowAudioMultiplier,
  getFlowDirectionValue,
  getFlowSpeedProfile,
  drawFlowBorder
} = window.ParalineFlowBorder;

const {
  getSideBarsAudioMultiplier,
  drawSideBars
} = window.ParalineSideBars;

const {
  getFlatRipplesAudioMultiplier,
  drawFlatRipples
} = window.ParalineFlatRipples;

const {
  getDotParticlesAudioMultiplier,
  drawDotParticles
} = window.ParalineDotParticles;

const {
  getRippleFlowAudioMultiplier,
  drawRippleFlow
} = window.ParalineRippleFlow;

const {
  getSnowBubbleAudioMultiplier,
  drawSnowBubbleParticles
} = window.ParalineSnowBubbleParticles;

const {
  getEdgeCrystalsAudioMultiplier,
  drawEdgeCrystals
} = window.ParalineEdgeCrystals;

const {
  getSideBraidsAudioMultiplier,
  drawSideBraids
} = window.ParalineSideBraids;

const {
  getAuroraDriftAudioMultiplier,
  drawAuroraDrift
} = window.ParalineAuroraDrift;

const TARGET_FPS = 36;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const FLOW_TARGET_FPS = 60;
const FLOW_FRAME_INTERVAL = 1000 / FLOW_TARGET_FPS;
const PARTICLE_TARGET_FPS = 48;
const PARTICLE_FRAME_INTERVAL = 1000 / PARTICLE_TARGET_FPS;
const RIPPLE_FLOW_TARGET_FPS = 48;
const RIPPLE_FLOW_FRAME_INTERVAL = 1000 / RIPPLE_FLOW_TARGET_FPS;
const MAX_DEVICE_SCALE = 1.25;

let width = 0;
let height = 0;
let deviceScale = 1;
let time = 0;
let smoothedLevel = 0.24;
let incomingLevel = 0.24;
let latestSource = "waiting";
let bridgeMode = "unknown";
let bridgeReason = "Waiting for bridge status...";
let lastPayloadValue = 0.24;
let debugPanel;
let lastDebugPaintAt = 0;
let lastFrameAt = 0;
let edgeGradient;
let flowTravelDistance = 0;
let visualizerState = {
  selectedTheme: "ambientWave",
  colorMode: "manual",
  performanceMode: "balanced",
  fpsLimit: "default",
  systemAppearance: "dark",
  systemAccentColor: "#4facfe",
  ambientWave: {
    tone: "blue",
    sensitivity: "medium",
    edgeMode: "bottom",
    glowStrength: "medium"
  },
  reactiveBorder: {
    colorStyle: "rainbow",
    intensity: "medium",
    borderThickness: "thin",
    glowStrength: "medium"
  },
  flowBorder: {
    direction: "clockwise",
    speedMode: "balanced",
    segmentLength: "medium",
    glowStrength: "medium",
    colorStyle: "rainbow"
  },
  sideBars: {
    colorStyle: "multicolor",
    barThickness: "thick",
    sensitivity: "medium",
    barDensity: "medium"
  },
  flatRipples: {
    mode: "sideRipples",
    intensity: "medium",
    colorStyle: "blue",
    speed: "calm"
  },
  dotParticles: {
    density: "medium",
    motionStyle: "balanced",
    directionBehavior: "beatReactive",
    glowStrength: "medium"
  },
  rippleFlow: {
    mode: "sideRipples",
    intensity: "medium",
    sensitivity: "medium",
    colorStyle: "blue"
  },
  snowBubbleParticles: {
    fallArea: "middle",
    density: "medium",
    motionStyle: "balanced",
    glowStrength: "medium",
    particleSize: "medium"
  },
  edgeCrystals: {
    flutterStyle: "balanced",
    density: "medium",
    glowStrength: "medium",
    colorStyle: "blue",
    edgeMode: "both"
  },
  sideBraids: {
    braidDensity: "medium",
    motionStyle: "balanced",
    glowStrength: "medium",
    braidWidth: "medium",
    colorStyle: "cyanPink",
    flowDirection: "topDown"
  },
  auroraDrift: {
    auroraStyle: "cinematic",
    intensity: "balanced",
    height: "medium",
    glowStrength: "medium",
    motionSpeed: "balanced",
    colorPalette: "cyanViolet",
    audioReactivity: "balanced",
    softness: "smooth",
    layerDensity: "balanced",
    gradientStops: [
      { pos: 0.0, color: "#00e5ff" },
      { pos: 0.35, color: "#0077ff" },
      { pos: 0.7, color: "#7f00ff" },
      { pos: 1.0, color: "#ff007f" }
    ],
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
  },
  paused: false
};

const params = new URLSearchParams(window.location.search);
const debugEnabled = params.get("debug") === "1";

const ADAPTIVE_FALLBACK_ACCENT = "#4facfe";
const ADAPTIVE_TRANSITION_RATE = 0.14;

let adaptivePaletteState = {
  current: [],
  target: [],
  key: ""
};

function normalizeHexColor(color, fallback = ADAPTIVE_FALLBACK_ACCENT) {
  if (typeof color !== "string") {
    return fallback;
  }

  const normalized = color.trim().replace(/^#/, "");

  if (normalized.length === 8) {
    return `#${normalized.slice(0, 6)}`;
  }

  if (normalized.length === 6) {
    return `#${normalized}`;
  }

  return fallback;
}

function hexToRgbTriplet(hexColor) {
  const normalized = normalizeHexColor(hexColor).slice(1);
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16)
  ];
}

function mixChannel(a, b, amount) {
  return a + (b - a) * amount;
}

function mixRgb(colorA, colorB, amount) {
  return colorA.map((channel, index) => mixChannel(channel, colorB[index], amount));
}

function shiftRgb(color, amount) {
  const anchor = amount >= 0 ? [255, 255, 255] : [0, 0, 0];
  return mixRgb(color, anchor, Math.min(1, Math.abs(amount)));
}

function rgbToHex(color) {
  return `#${color.map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0")).join("")}`;
}

function clonePalette(palette) {
  return palette.map((color) => [ ...color ]);
}

function buildAdaptivePalette(themeId) {
  const appearance = visualizerState.systemAppearance === "light" ? "light" : "dark";
  const accent = hexToRgbTriplet(visualizerState.systemAccentColor || ADAPTIVE_FALLBACK_ACCENT);

  if (themeId === "ambientWave") {
    return appearance === "dark"
      ? [shiftRgb(accent, -0.24), shiftRgb(accent, 0.08), shiftRgb(accent, 0.36)]
      : [shiftRgb(accent, -0.34), shiftRgb(accent, -0.04), shiftRgb(accent, 0.18)];
  }

  if (themeId === "reactiveBorder" || themeId === "flowBorder") {
    return appearance === "dark"
      ? [shiftRgb(accent, -0.2), accent, shiftRgb(accent, 0.42)]
      : [shiftRgb(accent, -0.32), shiftRgb(accent, -0.06), shiftRgb(accent, 0.28)];
  }

  if (themeId === "sideBars" || themeId === "sideBraids") {
    return appearance === "dark"
      ? [shiftRgb(accent, 0.22), accent, shiftRgb(accent, 0.48)]
      : [shiftRgb(accent, -0.24), shiftRgb(accent, 0.06), shiftRgb(accent, 0.24)];
  }

  if (themeId === "edgeCrystals") {
    return appearance === "dark"
      ? [shiftRgb(accent, -0.12), shiftRgb(accent, 0.18), shiftRgb(accent, 0.5)]
      : [shiftRgb(accent, -0.22), shiftRgb(accent, 0.08), shiftRgb(accent, 0.3)];
  }

  if (themeId === "flatRipples" || themeId === "rippleFlow") {
    return appearance === "dark"
      ? [shiftRgb(accent, -0.18), accent, shiftRgb(accent, 0.28)]
      : [shiftRgb(accent, -0.3), shiftRgb(accent, -0.02), shiftRgb(accent, 0.18)];
  }

  if (themeId === "dotParticles" || themeId === "snowBubbleParticles") {
    return appearance === "dark"
      ? [shiftRgb(accent, -0.3), shiftRgb(accent, 0.04), shiftRgb(accent, 0.34)]
      : [shiftRgb(accent, -0.38), shiftRgb(accent, -0.08), shiftRgb(accent, 0.2)];
  }

  return appearance === "dark"
    ? [shiftRgb(accent, -0.22), accent, shiftRgb(accent, 0.38)]
    : [shiftRgb(accent, -0.3), shiftRgb(accent, -0.02), shiftRgb(accent, 0.2)];
}

function syncAdaptivePaletteTarget() {
  const paletteKey = [
    visualizerState.selectedTheme,
    visualizerState.systemAppearance,
    normalizeHexColor(visualizerState.systemAccentColor || ADAPTIVE_FALLBACK_ACCENT)
  ].join(":");

  if (adaptivePaletteState.key === paletteKey) {
    return false;
  }

  adaptivePaletteState.key = paletteKey;
  adaptivePaletteState.target = buildAdaptivePalette(visualizerState.selectedTheme);

  if (!adaptivePaletteState.current.length) {
    adaptivePaletteState.current = clonePalette(adaptivePaletteState.target);
  }

  return true;
}

function stepAdaptivePalette() {
  if (visualizerState.colorMode !== "adaptive") {
    return false;
  }

  let paletteChanged = syncAdaptivePaletteTarget();

  if (!adaptivePaletteState.current.length) {
    adaptivePaletteState.current = clonePalette(adaptivePaletteState.target);
    return true;
  }

  adaptivePaletteState.current = adaptivePaletteState.current.map((currentColor, colorIndex) => {
    const targetColor = adaptivePaletteState.target[colorIndex] || currentColor;

    return currentColor.map((channel, channelIndex) => {
      const nextChannel = mixChannel(channel, targetColor[channelIndex], ADAPTIVE_TRANSITION_RATE);

      if (Math.abs(nextChannel - channel) > 0.25) {
        paletteChanged = true;
      }

      return nextChannel;
    });
  });

  return paletteChanged;
}

function getAdaptivePaletteHex() {
  syncAdaptivePaletteTarget();

  if (!adaptivePaletteState.current.length) {
    adaptivePaletteState.current = clonePalette(adaptivePaletteState.target);
  }

  return adaptivePaletteState.current.map(rgbToHex);
}

function getResolvedThemeSettings(themeId, settings) {
  if (visualizerState.colorMode !== "adaptive") {
    return settings;
  }

  const adaptiveColors = getAdaptivePaletteHex();

  if (themeId === "ambientWave") {
    return {
      ...settings,
      tone: "custom",
      customColors: adaptiveColors
    };
  }

  if (["reactiveBorder", "flowBorder", "sideBars", "flatRipples", "rippleFlow", "edgeCrystals", "sideBraids"].includes(themeId)) {
    return {
      ...settings,
      colorStyle: "custom",
      customColors: adaptiveColors
    };
  }

  if (themeId === "dotParticles" || themeId === "snowBubbleParticles") {
    return {
      ...settings,
      customColors: adaptiveColors
    };
  }

  return settings;
}

function getAmbientWaveSettings() {
  return getResolvedThemeSettings("ambientWave", visualizerState.ambientWave || {});
}

function getReactiveBorderSettings() {
  return getResolvedThemeSettings("reactiveBorder", visualizerState.reactiveBorder || {});
}

function getFlowBorderSettings() {
  return getResolvedThemeSettings("flowBorder", visualizerState.flowBorder || {});
}

function getSideBarsSettings() {
  return getResolvedThemeSettings("sideBars", visualizerState.sideBars || {});
}

function getFlatRipplesSettings() {
  return getResolvedThemeSettings("flatRipples", visualizerState.flatRipples || {});
}

function getDotParticlesSettings() {
  return getResolvedThemeSettings("dotParticles", visualizerState.dotParticles || {});
}

function getRippleFlowSettings() {
  return getResolvedThemeSettings("rippleFlow", visualizerState.rippleFlow || {});
}

function getSnowBubbleParticlesSettings() {
  return getResolvedThemeSettings("snowBubbleParticles", visualizerState.snowBubbleParticles || {});
}

function getEdgeCrystalsSettings() {
  return getResolvedThemeSettings("edgeCrystals", visualizerState.edgeCrystals || {});
}

function getSideBraidsSettings() {
  return getResolvedThemeSettings("sideBraids", visualizerState.sideBraids || {});
}

function getAuroraDriftSettings() {
  return visualizerState.auroraDrift || {};
}

function getActiveAudioMultiplier() {
  if (visualizerState.selectedTheme === "reactiveBorder") {
    return getReactiveInputMultiplier(getReactiveBorderSettings());
  }

  if (visualizerState.selectedTheme === "flowBorder") {
    return getFlowAudioMultiplier(getFlowBorderSettings());
  }

  if (visualizerState.selectedTheme === "sideBars") {
    return getSideBarsAudioMultiplier(getSideBarsSettings());
  }

  if (visualizerState.selectedTheme === "flatRipples") {
    return getFlatRipplesAudioMultiplier(getFlatRipplesSettings());
  }

  if (visualizerState.selectedTheme === "dotParticles") {
    return getDotParticlesAudioMultiplier(getDotParticlesSettings());
  }

  if (visualizerState.selectedTheme === "rippleFlow") {
    return getRippleFlowAudioMultiplier(getRippleFlowSettings());
  }

  if (visualizerState.selectedTheme === "snowBubbleParticles") {
    return getSnowBubbleAudioMultiplier(getSnowBubbleParticlesSettings());
  }

  if (visualizerState.selectedTheme === "edgeCrystals") {
    return getEdgeCrystalsAudioMultiplier(getEdgeCrystalsSettings());
  }

  if (visualizerState.selectedTheme === "sideBraids") {
    return getSideBraidsAudioMultiplier(getSideBraidsSettings());
  }

  if (visualizerState.selectedTheme === "auroraDrift") {
    return getAuroraDriftAudioMultiplier(getAuroraDriftSettings());
  }

  return getAmbientSensitivityMultiplier(getAmbientWaveSettings());
}

function rebuildCachedPaint() {
  const theme = visualizerState.selectedTheme === "ambientWave"
    ? getAmbientTonePalette(getAmbientWaveSettings())
    : TRANSPARENT_HAZE;

  edgeGradient = context.createLinearGradient(0, 0, 0, height);
  edgeGradient.addColorStop(0, theme.hazeTop);
  edgeGradient.addColorStop(0.16, "rgba(0, 0, 0, 0)");
  edgeGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");
  edgeGradient.addColorStop(0.84, "rgba(0, 0, 0, 0)");
  edgeGradient.addColorStop(1, theme.hazeBottom);
}

function createDebugPanel() {
  if (!debugEnabled) {
    return;
  }

  debugPanel = document.createElement("div");
  debugPanel.id = "debug-panel";
  debugPanel.style.position = "fixed";
  debugPanel.style.top = "16px";
  debugPanel.style.left = "16px";
  debugPanel.style.padding = "10px 12px";
  debugPanel.style.border = "1px solid rgba(255, 255, 255, 0.16)";
  debugPanel.style.borderRadius = "10px";
  debugPanel.style.background = "rgba(8, 12, 20, 0.42)";
  debugPanel.style.color = "rgba(225, 240, 255, 0.92)";
  debugPanel.style.font = "12px/1.45 Consolas, monospace";
  debugPanel.style.whiteSpace = "pre-line";
  debugPanel.style.pointerEvents = "none";
  debugPanel.style.zIndex = "9999";
  debugPanel.style.backdropFilter = "blur(10px)";
  debugPanel.textContent = "TEMP DEBUG\nWaiting for audio bridge...";
  document.body.appendChild(debugPanel);
}

function paintDebugPanel(now) {
  if (!debugEnabled || !debugPanel || now - lastDebugPaintAt < 250) {
    return;
  }

  lastDebugPaintAt = now;
  debugPanel.textContent =
    "TEMP DEBUG\n" +
    `bridge: ${bridgeMode}\n` +
    `source: ${latestSource}\n` +
    `incoming: ${lastPayloadValue.toFixed(4)}\n` +
    `smoothed: ${smoothedLevel.toFixed(4)}\n` +
    `reason: ${bridgeReason}`;
}

async function refreshBridgeStatus() {
  if (!debugEnabled) {
    return;
  }

  if (!window.audioBridge || typeof window.audioBridge.getStatus !== "function") {
    bridgeMode = "unavailable";
    bridgeReason = "Audio bridge is unavailable.\n\nTroubleshooting:\n- The Electron preload bridge is missing or failed to load.\n- Try restarting Paraline.";
    return;
  }

  try {
    const status = await window.audioBridge.getStatus();
    bridgeMode = status?.mode || "unknown";
    bridgeReason = status?.reason || "No bridge reason provided.";
  } catch (error) {
    bridgeMode = "status-error";
    bridgeReason = [
      error?.message || "Failed to read bridge status.",
      "\n",
      "Troubleshooting:",
      "\n- The audio bridge failed to respond.",
      "\n- Try restarting Paraline."
    ].join("");
  }
}

function resizeCanvas() {
  deviceScale = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_SCALE);
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = Math.floor(width * deviceScale);
  canvas.height = Math.floor(height * deviceScale);
  context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  rebuildCachedPaint();
}

function updateAudioLevel(now) {
  if (visualizerState.paused) {
    return;
  }

  const helperDriven = latestSource === "helper";
  const breathing = helperDriven ? 0.003 : 0.028 * (Math.sin(now * 0.00023) + 1);
  const response = helperDriven ? 0.2 : 0.018;
  smoothedLevel += ((incomingLevel + breathing) - smoothedLevel) * response;
}

function renderFrame(now) {
  requestAnimationFrame(renderFrame);

  if (visualizerState.hidden) {
    context.clearRect(0, 0, width, height);
    return;
  }

  let activeFrameInterval = 0;
  const currentLimit = visualizerState.fpsLimit || "default";

  if (currentLimit === "battery") {
    activeFrameInterval = 1000 / 30; // Lock at 30 FPS Globally
  } else if (currentLimit === "unlocked") {
    activeFrameInterval = 0; // Unlocked / Native Monitor Refresh Rate
  } else {
    // default dynamic capped limits
    activeFrameInterval = FRAME_INTERVAL;
    if (visualizerState.selectedTheme === "flowBorder") {
      activeFrameInterval = FLOW_FRAME_INTERVAL;
    } else if (visualizerState.selectedTheme === "dotParticles") {
      activeFrameInterval = PARTICLE_FRAME_INTERVAL;
    } else if (visualizerState.selectedTheme === "rippleFlow") {
      activeFrameInterval = RIPPLE_FLOW_FRAME_INTERVAL;
    } else if (visualizerState.selectedTheme === "snowBubbleParticles") {
      activeFrameInterval = PARTICLE_FRAME_INTERVAL;
    } else if (visualizerState.selectedTheme === "edgeCrystals") {
      activeFrameInterval = PARTICLE_FRAME_INTERVAL;
    } else if (visualizerState.selectedTheme === "sideBraids") {
      activeFrameInterval = RIPPLE_FLOW_FRAME_INTERVAL;
    } else if (visualizerState.selectedTheme === "auroraDrift") {
      activeFrameInterval = PARTICLE_FRAME_INTERVAL;
    }
  }

  if (lastFrameAt && now - lastFrameAt < activeFrameInterval) {
    return;
  }

  const deltaMs = lastFrameAt ? now - lastFrameAt : (activeFrameInterval || 16.6);
  lastFrameAt = now;

  if (!visualizerState.paused) {
    time += deltaMs * 0.001;

    const flowSpeedProfile = getFlowSpeedProfile(getFlowBorderSettings());
    const flowSpeed = flowSpeedProfile.base + smoothedLevel * flowSpeedProfile.boost;
    flowTravelDistance += deltaMs * 0.001 * flowSpeed * getFlowDirectionValue(getFlowBorderSettings());
  }

  updateAudioLevel(now);

  const adaptivePaletteChanged = stepAdaptivePalette();

  if (adaptivePaletteChanged && visualizerState.selectedTheme === "ambientWave") {
    rebuildCachedPaint();
  }

  context.clearRect(0, 0, width, height);

  if (visualizerState.selectedTheme === "reactiveBorder") {
    drawReactiveBorder({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getReactiveBorderSettings(),
      performanceMode: visualizerState.performanceMode
    });
  } else if (visualizerState.selectedTheme === "flowBorder") {
    drawFlowBorder({
      context,
      width,
      height,
      smoothedLevel,
      flowTravelDistance,
      settings: getFlowBorderSettings(),
      performanceMode: visualizerState.performanceMode
    });
  } else if (visualizerState.selectedTheme === "sideBars") {
    drawSideBars({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getSideBarsSettings(),
      performanceMode: visualizerState.performanceMode
    });
  } else if (visualizerState.selectedTheme === "flatRipples") {
    drawFlatRipples({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getFlatRipplesSettings(),
      performanceMode: visualizerState.performanceMode
    });
  } else if (visualizerState.selectedTheme === "dotParticles") {
    drawDotParticles({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getDotParticlesSettings(),
      performanceMode: visualizerState.performanceMode
    });
  } else if (visualizerState.selectedTheme === "rippleFlow") {
    drawRippleFlow({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getRippleFlowSettings(),
      performanceMode: visualizerState.performanceMode
    });
  } else if (visualizerState.selectedTheme === "snowBubbleParticles") {
    drawSnowBubbleParticles({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getSnowBubbleParticlesSettings(),
      performanceMode: visualizerState.performanceMode
    });
  } else if (visualizerState.selectedTheme === "edgeCrystals") {
    drawEdgeCrystals({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getEdgeCrystalsSettings(),
      performanceMode: visualizerState.performanceMode
    });
  } else if (visualizerState.selectedTheme === "sideBraids") {
    drawSideBraids({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getSideBraidsSettings(),
      performanceMode: visualizerState.performanceMode
    });
  } else if (visualizerState.selectedTheme === "auroraDrift") {
    drawAuroraDrift({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getAuroraDriftSettings(),
      performanceMode: visualizerState.performanceMode
    });
  } else {
    drawAmbientWave({
      context,
      width,
      height,
      time,
      smoothedLevel,
      latestSource,
      edgeGradient,
      settings: getAmbientWaveSettings(),
      performanceMode: visualizerState.performanceMode
    });
  }

  context.globalAlpha = 1;
  context.shadowBlur = 0;
  paintDebugPanel(now);
}

function applySettings(nextSettings) {
  visualizerState = {
    ...visualizerState,
    ...nextSettings,
    performanceMode: nextSettings.performanceMode || visualizerState.performanceMode,
    fpsLimit: nextSettings.fpsLimit || visualizerState.fpsLimit,
    ambientWave: {
      ...visualizerState.ambientWave,
      ...(nextSettings?.ambientWave || {})
    },
    reactiveBorder: {
      ...visualizerState.reactiveBorder,
      ...(nextSettings?.reactiveBorder || {})
    },
    flowBorder: {
      ...visualizerState.flowBorder,
      ...(nextSettings?.flowBorder || {})
    },
    sideBars: {
      ...visualizerState.sideBars,
      ...(nextSettings?.sideBars || {})
    },
    flatRipples: {
      ...visualizerState.flatRipples,
      ...(nextSettings?.flatRipples || {})
    },
    dotParticles: {
      ...visualizerState.dotParticles,
      ...(nextSettings?.dotParticles || {})
    },
    rippleFlow: {
      ...visualizerState.rippleFlow,
      ...(nextSettings?.rippleFlow || {})
    },
    snowBubbleParticles: {
      ...visualizerState.snowBubbleParticles,
      ...(nextSettings?.snowBubbleParticles || {})
    },
    edgeCrystals: {
      ...visualizerState.edgeCrystals,
      ...(nextSettings?.edgeCrystals || {})
    },
    sideBraids: {
      ...visualizerState.sideBraids,
      ...(nextSettings?.sideBraids || {})
    },
    auroraDrift: {
      ...visualizerState.auroraDrift,
      ...(nextSettings?.auroraDrift || {})
    }
  };

  if (!["ambientWave", "reactiveBorder", "flowBorder", "sideBars", "flatRipples", "dotParticles", "rippleFlow", "snowBubbleParticles", "edgeCrystals", "sideBraids", "auroraDrift"].includes(visualizerState.selectedTheme)) {
    visualizerState.selectedTheme = "ambientWave";
  }



  // Trust settingsStore.js validation to avoid stripping 'custom' values


  rebuildCachedPaint();
}

window.addEventListener("resize", resizeCanvas);

if (window.audioBridge) {
  window.audioBridge.onLevel((payload) => {
    if (payload && typeof payload.value === "number") {
      latestSource = payload.source || "unknown";
      lastPayloadValue = payload.value;
      incomingLevel = latestSource === "helper"
        ? clamp01(payload.value * getActiveAudioMultiplier())
        : clamp01(payload.value);
    }
  });
}

if (window.visualizerSettings) {
  window.visualizerSettings.onChange((nextSettings) => {
    applySettings(nextSettings);
  });

  window.visualizerSettings.get().then((nextSettings) => {
    applySettings(nextSettings);
  }).catch(() => {
    // Ignore startup settings errors and keep defaults.
  });

  // Focus Mode: smoothly fade canvas opacity based on user activity
  if (typeof window.visualizerSettings.onFocusModeOpacity === "function") {
    window.visualizerSettings.onFocusModeOpacity(({ opacity }) => {
      canvas.style.opacity = typeof opacity === "number" ? String(opacity) : "1";
    });
  }
}

createDebugPanel();
refreshBridgeStatus();
if (debugEnabled) {
  setInterval(refreshBridgeStatus, 1000);
}

resizeCanvas();
requestAnimationFrame(renderFrame);

// --- macOS Glassmorphic Context Menu Integration ---

const THEME_INFOS = {
  ambientWave: {
    label: "Ambient Wave",
    settingsHeader: "Ambient Wave Settings",
    options: [
      {
        key: "tone",
        label: "Tone",
        choices: [
          { value: "blue", label: "Blue" },
          { value: "purple", label: "Purple" },
          { value: "warm", label: "Warm" }
        ]
      },
      {
        key: "sensitivity",
        label: "Sensitivity",
        choices: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]
      },
      {
        key: "edgeMode",
        label: "Edge Mode",
        choices: [
          { value: "top", label: "Top" },
          { value: "bottom", label: "Bottom" },
          { value: "both", label: "Both" }
        ]
      },
      {
        key: "glowStrength",
        label: "Glow Strength",
        choices: [
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" }
        ]
      }
    ]
  },
  auroraDrift: {
    label: "Aurora Drift",
    settingsHeader: "Aurora Drift Settings",
    options: [
      {
        key: "auroraStyle",
        label: "Aurora Style",
        choices: [
          { value: "ambient", label: "Ambient" },
          { value: "cinematic", label: "Cinematic" },
          { value: "energetic", label: "Energetic" }
        ]
      },
      {
        key: "intensity",
        label: "Intensity",
        choices: [
          { value: "subtle", label: "Subtle" },
          { value: "balanced", label: "Balanced" },
          { value: "vivid", label: "Vivid" }
        ]
      },
      {
        key: "height",
        label: "Height",
        choices: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "tall", label: "Tall" }
        ]
      },
      {
        key: "glowStrength",
        label: "Glow Strength",
        choices: [
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" }
        ]
      },
      {
        key: "motionSpeed",
        label: "Motion Speed",
        choices: [
          { value: "calm", label: "Calm" },
          { value: "balanced", label: "Balanced" },
          { value: "fast", label: "Fast" }
        ]
      },
      {
        key: "colorPalette",
        label: "Color Palette",
        choices: [
          { value: "cyanViolet", label: "Cyan & Violet" },
          { value: "emeraldSky", label: "Emerald Sky" },
          { value: "sunsetDream", label: "Sunset Dream" },
          { value: "frozenBlue", label: "Frozen Blue" },
          { value: "monochrome", label: "Monochrome" }
        ]
      },
      {
        key: "audioReactivity",
        label: "Audio Reactivity",
        choices: [
          { value: "subtle", label: "Subtle" },
          { value: "balanced", label: "Balanced" },
          { value: "responsive", label: "Responsive" }
        ]
      },
      {
        key: "softness",
        label: "Softness",
        choices: [
          { value: "misty", label: "Misty" },
          { value: "smooth", label: "Smooth" },
          { value: "defined", label: "Defined" }
        ]
      },
      {
        key: "layerDensity",
        label: "Layer Density",
        choices: [
          { value: "light", label: "Light" },
          { value: "balanced", label: "Balanced" },
          { value: "rich", label: "Rich" }
        ]
      }
    ]
  },
  reactiveBorder: {
    label: "Reactive Border",
    settingsHeader: "Reactive Border Settings",
    options: [
      {
        key: "colorStyle",
        label: "Color Style",
        choices: [
          { value: "rainbow", label: "Rainbow" },
          { value: "neonBlue", label: "Neon Blue" },
          { value: "neonPurple", label: "Neon Purple" },
          { value: "warmGlow", label: "Warm Glow" }
        ]
      },
      {
        key: "intensity",
        label: "Intensity",
        choices: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]
      },
      {
        key: "borderThickness",
        label: "Border Thickness",
        choices: [
          { value: "thin", label: "Thin" },
          { value: "medium", label: "Medium" },
          { value: "thick", label: "Thick" }
        ]
      },
      {
        key: "glowStrength",
        label: "Glow Strength",
        choices: [
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" }
        ]
      }
    ]
  },
  flowBorder: {
    label: "Flow Border",
    settingsHeader: "Flow Border Settings",
    options: [
      {
        key: "direction",
        label: "Direction",
        choices: [
          { value: "clockwise", label: "Clockwise" },
          { value: "anticlockwise", label: "Anticlockwise" }
        ]
      },
      {
        key: "speedMode",
        label: "Speed Mode",
        choices: [
          { value: "calm", label: "Calm" },
          { value: "balanced", label: "Balanced" },
          { value: "energetic", label: "Energetic" }
        ]
      },
      {
        key: "segmentLength",
        label: "Segment Length",
        choices: [
          { value: "short", label: "Short" },
          { value: "medium", label: "Medium" },
          { value: "long", label: "Long" }
        ]
      },
      {
        key: "glowStrength",
        label: "Glow Strength",
        choices: [
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" }
        ]
      },
      {
        key: "colorStyle",
        label: "Color Style",
        choices: [
          { value: "rainbow", label: "Rainbow" },
          { value: "cool", label: "Cool" },
          { value: "warm", label: "Warm" }
        ]
      }
    ]
  },
  sideBars: {
    label: "Side Bars",
    settingsHeader: "Side Bars Settings",
    options: [
      {
        key: "colorStyle",
        label: "Color Style",
        choices: [
          { value: "white", label: "White" },
          { value: "yellow", label: "Yellow" },
          { value: "aqua", label: "Aqua" },
          { value: "multicolor", label: "Multicolor" }
        ]
      },
      {
        key: "barThickness",
        label: "Bar Thickness",
        choices: [
          { value: "thin", label: "Thin" },
          { value: "medium", label: "Medium" },
          { value: "thick", label: "Thick" }
        ]
      },
      {
        key: "sensitivity",
        label: "Sensitivity",
        choices: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]
      },
      {
        key: "barDensity",
        label: "Bar Count",
        choices: [
          { value: "low", label: "Less" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "More" }
        ]
      }
    ]
  },
  flatRipples: {
    label: "Pulse Lines",
    settingsHeader: "Pulse Lines Settings",
    options: [
      {
        key: "mode",
        label: "Mode",
        choices: [
          { value: "sideRipples", label: "Side Ripples" },
          { value: "flatRipples", label: "Flat Ripples" }
        ]
      },
      {
        key: "intensity",
        label: "Intensity",
        choices: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]
      },
      {
        key: "colorStyle",
        label: "Color",
        choices: [
          { value: "red", label: "Red" },
          { value: "blue", label: "Blue" },
          { value: "white", label: "White" },
          { value: "multicolor", label: "Multicolor" }
        ]
      },
      {
        key: "speed",
        label: "Speed",
        choices: [
          { value: "calm", label: "Calm" },
          { value: "balanced", label: "Balanced" },
          { value: "energetic", label: "Energetic" }
        ]
      }
    ]
  },
  dotParticles: {
    label: "Dot Particles",
    settingsHeader: "Dot Particles Settings",
    options: [
      {
        key: "density",
        label: "Density",
        choices: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]
      },
      {
        key: "motionStyle",
        label: "Motion Style",
        choices: [
          { value: "calm", label: "Calm" },
          { value: "balanced", label: "Balanced" },
          { value: "energetic", label: "Energetic" }
        ]
      },
      {
        key: "directionBehavior",
        label: "Direction Behavior",
        choices: [
          { value: "mostlyClockwise", label: "Mostly Clockwise" },
          { value: "mostlyAnticlockwise", label: "Mostly Anticlockwise" },
          { value: "beatReactive", label: "Beat Reactive" }
        ]
      },
      {
        key: "glowStrength",
        label: "Glow Strength",
        choices: [
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" }
        ]
      }
    ]
  },
  rippleFlow: {
    label: "Ripple Flow",
    settingsHeader: "Ripple Flow Settings",
    options: [
      {
        key: "mode",
        label: "Mode",
        choices: [
          { value: "sideRipples", label: "Side Ripples" },
          { value: "flatRipples", label: "Flat Ripples" }
        ]
      },
      {
        key: "intensity",
        label: "Intensity",
        choices: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]
      },
      {
        key: "sensitivity",
        label: "Sensitivity",
        choices: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]
      },
      {
        key: "colorStyle",
        label: "Color",
        choices: [
          { value: "red", label: "Red" },
          { value: "blue", label: "Blue" },
          { value: "white", label: "White" }
        ]
      }
    ]
  },
  snowBubbleParticles: {
    label: "Snow Particles",
    settingsHeader: "Snow Particles Settings",
    options: [
      {
        key: "fallArea",
        label: "Snowfall Area",
        choices: [
          { value: "middle", label: "Middle Section" },
          { value: "fullWidth", label: "Entire Top Border" }
        ]
      },
      {
        key: "density",
        label: "Density",
        choices: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]
      },
      {
        key: "motionStyle",
        label: "Motion Style",
        choices: [
          { value: "calm", label: "Calm" },
          { value: "balanced", label: "Balanced" },
          { value: "energetic", label: "Energetic" }
        ]
      },
      {
        key: "glowStrength",
        label: "Glow Strength",
        choices: [
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" }
        ]
      },
      {
        key: "particleSize",
        label: "Particle Size",
        choices: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" }
        ]
      }
    ]
  },
  edgeCrystals: {
    label: "Edge Crystals",
    settingsHeader: "Edge Crystals Settings",
    options: [
      {
        key: "flutterStyle",
        label: "Flutter Style",
        choices: [
          { value: "soft", label: "Soft" },
          { value: "balanced", label: "Balanced" },
          { value: "energetic", label: "Energetic" }
        ]
      },
      {
        key: "density",
        label: "Density",
        choices: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]
      },
      {
        key: "glowStrength",
        label: "Glow Strength",
        choices: [
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" }
        ]
      },
      {
        key: "colorStyle",
        label: "Color Style",
        choices: [
          { value: "blue", label: "Blue" },
          { value: "purple", label: "Purple" },
          { value: "red", label: "Red" },
          { value: "white", label: "White" }
        ]
      },
      {
        key: "edgeMode",
        label: "Edge Mode",
        choices: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
          { value: "both", label: "Both" }
        ]
      }
    ]
  },
  sideBraids: {
    label: "Side Braids",
    settingsHeader: "Side Braids Settings",
    options: [
      {
        key: "colorStyle",
        label: "Color Style",
        choices: [
          { value: "cyanPink", label: "Cyan & Pink" },
          { value: "bluePurple", label: "Blue & Purple" },
          { value: "redBlue", label: "Red & Blue" },
          { value: "white", label: "White" }
        ]
      },
      {
        key: "braidWidth",
        label: "Braid Width",
        choices: [
          { value: "thin", label: "Thin" },
          { value: "medium", label: "Medium" },
          { value: "thick", label: "Thick" }
        ]
      },
      {
        key: "motionStyle",
        label: "Motion Style",
        choices: [
          { value: "calm", label: "Calm" },
          { value: "balanced", label: "Balanced" },
          { value: "energetic", label: "Energetic" }
        ]
      },
      {
        key: "braidDensity",
        label: "Braid Density",
        choices: [
          { value: "sparse", label: "Sparse" },
          { value: "medium", label: "Medium" },
          { value: "dense", label: "Dense" }
        ]
      },
      {
        key: "flowDirection",
        label: "Flow Direction",
        choices: [
          { value: "topDown", label: "Top Down" },
          { value: "bottomUp", label: "Bottom Up" }
        ]
      },
      {
        key: "glowStrength",
        label: "Glow Strength",
        choices: [
          { value: "soft", label: "Soft" },
          { value: "medium", label: "Medium" },
          { value: "strong", label: "Strong" }
        ]
      }
    ]
  }
};

let isMenuOpen = false;

const ICONS = {
  waveform: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4"/><path d="M6 6v12"/><path d="M9 3v18"/><path d="M12 7v10"/><path d="M15 5v14"/><path d="M18 8v8"/><path d="M21 10v4"/></svg>`,
  pause: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>`,
  play: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
  reload: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8"/><polyline points="21 3 21 8 16 8"/></svg>`,
  visualizerMode: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  settingsOption: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  colorStyle: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.52 22 22 17.52 22 12S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm1-10a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-4 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm2-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>`,
  barThickness: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/></svg>`,
  sensitivity: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`,
  barCount: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
  reset: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  github: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
  quit: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`,
  chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  eye: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
};

function getContextMenuStructure() {
  const currentTheme = visualizerState.selectedTheme;
  const isPaused = visualizerState.paused;
  const isHidden = visualizerState.hidden;
  const version = visualizerState.version || '1.1.0';
  const helperConnected = visualizerState.helperConnected || (latestSource === 'helper');

  const structure = [
    { type: 'title', label: `Paraline ${version}` },
    {
      type: 'status',
      label: helperConnected ? 'Audio Capture: Live' : 'Audio Capture: Fallback',
      isLive: helperConnected,
      icon: ICONS.waveform
    },
    { type: 'divider' },
    {
      type: 'item',
      label: 'Open Settings',
      icon: ICONS.settings,
      action: () => {
        window.visualizerSettings.action('open-settings');
      }
    },
    { type: 'divider' },
    
    {
      type: 'item',
      label: isPaused ? 'Resume Visualizer' : 'Pause Visualizer',
      icon: isPaused ? ICONS.play : ICONS.pause,
      action: () => {
        window.visualizerSettings.action('toggle-paused');
      }
    },
    {
      type: 'item',
      label: isHidden ? 'Show Visualizer' : 'Hide Visualizer',
      icon: isHidden ? ICONS.eye : ICONS.eyeOff,
      action: () => {
        window.visualizerSettings.action('toggle-hide');
      }
    },
    {
      type: 'item',
      label: 'Reload Visualizer',
      icon: ICONS.reload,
      action: () => {
        window.visualizerSettings.action('reload');
      }
    },
    {
      type: 'item',
      label: 'Visualizer Mode',
      icon: ICONS.visualizerMode,
      submenu: Object.keys(THEME_INFOS).map(themeId => ({
        type: 'item',
        label: THEME_INFOS[themeId].label,
        checked: currentTheme === themeId,
        action: () => {
          window.visualizerSettings.update({ selectedTheme: themeId });
        }
      }))
    }
  ];

  // Add the settings of the currently selected theme
  const activeThemeInfo = THEME_INFOS[currentTheme];
  if (activeThemeInfo) {
    structure.push({ type: 'divider' });
    structure.push({
      type: 'header',
      label: activeThemeInfo.settingsHeader,
      icon: ICONS.settings
    });

    if (activeThemeInfo.options && activeThemeInfo.options.length > 0) {
      activeThemeInfo.options.forEach(opt => {
        const currentVal = visualizerState[currentTheme]?.[opt.key];
        
        let optionIcon = ICONS.settings;
        const lowerLabel = opt.label.toLowerCase();
        if (lowerLabel.includes('color')) {
          optionIcon = ICONS.colorStyle;
        } else if (lowerLabel.includes('thickness') || lowerLabel.includes('size')) {
          optionIcon = ICONS.barThickness;
        } else if (lowerLabel.includes('sensitivity') || lowerLabel.includes('speed') || lowerLabel.includes('intensity') || lowerLabel.includes('motion')) {
          optionIcon = ICONS.sensitivity;
        } else if (lowerLabel.includes('count') || lowerLabel.includes('density') || lowerLabel.includes('area') || lowerLabel.includes('behavior') || lowerLabel.includes('mode')) {
          optionIcon = ICONS.barCount;
        }

        structure.push({
          type: 'item',
          label: opt.label,
          icon: optionIcon,
          submenu: opt.choices.map(choice => ({
            type: 'item',
            label: choice.label,
            checked: currentVal === choice.value,
            action: () => {
              window.visualizerSettings.update({
                [currentTheme]: {
                  [opt.key]: choice.value
                }
              });
            }
          }))
        });
      });
    }
  }

  // Reset theme settings and reset all settings
  structure.push({ type: 'divider' });
  const themeLabel = THEME_INFOS[currentTheme]?.label || 'Theme';
  structure.push({
    type: 'item',
    label: `Reset ${themeLabel} Settings`,
    icon: ICONS.reset,
    action: () => {
      window.visualizerSettings.action('reset-theme');
    }
  });
  structure.push({
    type: 'item',
    label: 'Reset All Settings',
    icon: ICONS.reset,
    action: () => {
      window.visualizerSettings.action('reset-all');
    }
  });

  // Open Landing Page, View GitHub Repository
  structure.push({ type: 'divider' });
  structure.push({
    type: 'item',
    label: 'Open Landing Page',
    icon: ICONS.globe,
    action: () => {
      window.visualizerSettings.action('open-url', 'https://paraline.vercel.app');
    }
  });
  structure.push({
    type: 'item',
    label: 'View GitHub Repository',
    icon: ICONS.github,
    action: () => {
      window.visualizerSettings.action('open-url', 'https://github.com/SamXop123/Paraline');
    }
  });

  // Quit App
  structure.push({ type: 'divider' });
  structure.push({
    type: 'item',
    label: 'Quit App',
    icon: ICONS.quit,
    action: () => {
      window.visualizerSettings.action('quit');
    }
  });

  return structure;
}

function buildMenuDOM(items, container, subDirectionLeft) {
  items.forEach(item => {
    if (item.type === 'label') {
      const el = document.createElement("div");
      el.className = "menu-label";
      el.textContent = item.label;
      container.appendChild(el);
    } else if (item.type === 'divider') {
      const el = document.createElement("div");
      el.className = "menu-divider";
      container.appendChild(el);
    } else if (item.type === 'title') {
      const el = document.createElement("div");
      el.className = "menu-item menu-title disabled";
      
      const labelEl = document.createElement("div");
      labelEl.className = "item-label";
      labelEl.textContent = item.label;
      el.appendChild(labelEl);

      container.appendChild(el);
    } else if (item.type === 'status' || item.type === 'header' || item.type === 'item') {
      const el = document.createElement("div");
      el.className = "menu-item";
      
      if (item.type === 'status') {
        el.classList.add("menu-status", "disabled");
      } else if (item.type === 'header') {
        el.classList.add("menu-header", "disabled");
      } else if (item.disabled) {
        el.classList.add("disabled");
      }

      if (subDirectionLeft && item.submenu) {
        el.classList.add("submenu-left");
      }

      // Checkmark or Icon column
      if (item.checked !== undefined) {
        const iconEl = document.createElement("div");
        iconEl.className = "item-icon";
        if (item.checked) {
          iconEl.innerHTML = `<svg class="checkmark" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        }
        el.appendChild(iconEl);
      } else if (item.icon) {
        const iconEl = document.createElement("div");
        iconEl.className = "item-icon";
        iconEl.innerHTML = item.icon;
        el.appendChild(iconEl);
      } else {
        const spacerEl = document.createElement("div");
        spacerEl.className = "item-icon-spacer";
        el.appendChild(spacerEl);
      }

      // Label
      const labelEl = document.createElement("div");
      labelEl.className = "item-label";
      labelEl.textContent = item.label;
      el.appendChild(labelEl);

      // Submenu and Chevrons
      if (item.submenu) {
        const chevronEl = document.createElement("div");
        chevronEl.className = "item-chevron";
        chevronEl.innerHTML = ICONS.chevron;
        el.appendChild(chevronEl);

        const submenuContainer = document.createElement("div");
        submenuContainer.className = "submenu";
        // Recursively build submenu
        buildMenuDOM(item.submenu, submenuContainer, subDirectionLeft);
        el.appendChild(submenuContainer);
      }

      // Action listener
      if (item.action && item.type === 'item') {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          item.action();
          closeMenu();
        });
      }

      container.appendChild(el);
    }
  });
}

function showMenu(x, y, trayBounds, inOverflow, taskbarPosition) {
  isMenuOpen = true;

  // 1. Intercept mouse events in overlay window
  if (window.visualizerSettings && typeof window.visualizerSettings.setIgnoreMouseEvents === 'function') {
    window.visualizerSettings.setIgnoreMouseEvents(false);
  }

  // 2. Clear previous menu content
  const menuContainer = document.getElementById("context-menu");
  if (!menuContainer) return;
  menuContainer.innerHTML = "";

  // 3. Build the menu tree
  const structure = getContextMenuStructure();

  // 4. Calculate bounds and submenu direction
  // Temporarily show container to measure actual height and width
  menuContainer.style.visibility = "hidden";
  menuContainer.classList.remove("hidden");
  
  // Build DOM first so we can measure it
  buildMenuDOM(structure, menuContainer, false);
  
  const actualWidth = menuContainer.offsetWidth || 240;
  const actualHeight = menuContainer.offsetHeight || 440;
  
  // Reset visibility state
  menuContainer.innerHTML = "";
  menuContainer.classList.add("hidden");
  menuContainer.style.visibility = "";

  let targetX = x;
  let targetY = y;

  const halfWidth = window.innerWidth / 2;
  const halfHeight = window.innerHeight / 2;

  if (x > halfWidth) {
    // Right side: place menu to the left of the cursor
    targetX = x - actualWidth - 5;
  } else {
    // Left side: place menu to the right of the cursor
    targetX = x + 5;
  }

  if (y > halfHeight) {
    // Bottom side: place menu above the cursor
    targetY = y - actualHeight - 5;
  } else {
    // Top side: place menu below the cursor
    targetY = y + 5;
  }

  // Clamping to screen boundaries (ensuring at least 10px buffer)
  if (targetX < 10) targetX = 10;
  if (targetY < 10) targetY = 10;
  if (targetX + actualWidth > window.innerWidth - 10) {
    targetX = window.innerWidth - actualWidth - 10;
  }
  if (targetY + actualHeight > window.innerHeight - 10) {
    targetY = window.innerHeight - actualHeight - 10;
  }

  const subDirectionLeft = (targetX + actualWidth + 200 > window.innerWidth);

  // 5. Populate DOM for real
  buildMenuDOM(structure, menuContainer, subDirectionLeft);

  // 6. Position and show the menu
  menuContainer.style.left = `${targetX}px`;
  menuContainer.style.top = `${targetY}px`;
  menuContainer.classList.remove("hidden");

  // 7. Show the click-capturing shield
  const menuShield = document.getElementById("menu-shield");
  if (menuShield) {
    menuShield.classList.remove("hidden");
  }
}

function closeMenu() {
  if (!isMenuOpen) return;
  isMenuOpen = false;

  const menuContainer = document.getElementById("context-menu");
  const menuShield = document.getElementById("menu-shield");

  if (menuContainer) {
    menuContainer.classList.add("hidden");
  }
  if (menuShield) {
    menuShield.classList.add("hidden");
  }

  // Restore click-through on window
  if (window.visualizerSettings && typeof window.visualizerSettings.setIgnoreMouseEvents === 'function') {
    window.visualizerSettings.setIgnoreMouseEvents(true);
  }
}

// Event listeners setup
const menuShield = document.getElementById("menu-shield");
if (menuShield) {
  menuShield.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenu();
  });
}

// Listen for context menu request from tray click
if (window.visualizerSettings && typeof window.visualizerSettings.onShowMenu === 'function') {
  window.visualizerSettings.onShowMenu((menuPos) => {
    if (menuPos && typeof menuPos.x === 'number' && typeof menuPos.y === 'number') {
      showMenu(menuPos.x, menuPos.y, menuPos.trayBounds, menuPos.inOverflow, menuPos.taskbarPosition);
    }
  });
}

// Press Escape key to close the menu
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenu();
  }
});
