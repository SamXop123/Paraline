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
  paused: false
};

const params = new URLSearchParams(window.location.search);
const debugEnabled = params.get("debug") === "1";

function getAmbientWaveSettings() {
  return visualizerState.ambientWave || {};
}

function getReactiveBorderSettings() {
  return visualizerState.reactiveBorder || {};
}

function getFlowBorderSettings() {
  return visualizerState.flowBorder || {};
}

function getSideBarsSettings() {
  return visualizerState.sideBars || {};
}

function getFlatRipplesSettings() {
  return visualizerState.flatRipples || {};
}

function getDotParticlesSettings() {
  return visualizerState.dotParticles || {};
}

function getRippleFlowSettings() {
  return visualizerState.rippleFlow || {};
}

function getSnowBubbleParticlesSettings() {
  return visualizerState.snowBubbleParticles || {};
}

function getEdgeCrystalsSettings() {
  return visualizerState.edgeCrystals || {};
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

  let activeFrameInterval = FRAME_INTERVAL;

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
  }

  if (lastFrameAt && now - lastFrameAt < activeFrameInterval) {
    return;
  }

  const deltaMs = lastFrameAt ? now - lastFrameAt : activeFrameInterval;
  lastFrameAt = now;

  if (!visualizerState.paused) {
    time += deltaMs * 0.001;

    const flowSpeedProfile = getFlowSpeedProfile(getFlowBorderSettings());
    const flowSpeed = flowSpeedProfile.base + smoothedLevel * flowSpeedProfile.boost;
    flowTravelDistance += deltaMs * 0.001 * flowSpeed * getFlowDirectionValue(getFlowBorderSettings());
  }

  updateAudioLevel(now);

  context.clearRect(0, 0, width, height);

  if (visualizerState.selectedTheme === "reactiveBorder") {
    drawReactiveBorder({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getReactiveBorderSettings()
    });
  } else if (visualizerState.selectedTheme === "flowBorder") {
    drawFlowBorder({
      context,
      width,
      height,
      smoothedLevel,
      flowTravelDistance,
      settings: getFlowBorderSettings()
    });
  } else if (visualizerState.selectedTheme === "sideBars") {
    drawSideBars({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getSideBarsSettings()
    });
  } else if (visualizerState.selectedTheme === "flatRipples") {
    drawFlatRipples({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getFlatRipplesSettings()
    });
  } else if (visualizerState.selectedTheme === "dotParticles") {
    drawDotParticles({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getDotParticlesSettings()
    });
  } else if (visualizerState.selectedTheme === "rippleFlow") {
    drawRippleFlow({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getRippleFlowSettings()
    });
  } else if (visualizerState.selectedTheme === "snowBubbleParticles") {
    drawSnowBubbleParticles({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getSnowBubbleParticlesSettings()
    });
  } else if (visualizerState.selectedTheme === "edgeCrystals") {
    drawEdgeCrystals({
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings: getEdgeCrystalsSettings()
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
      settings: getAmbientWaveSettings()
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
    }
  };

  if (!nextSettings) return;
    visualizerState.globalSensitivity = nextSettings.globalSensitivity ?? 1.0;

  if (!["ambientWave", "reactiveBorder", "flowBorder", "sideBars", "flatRipples", "dotParticles", "rippleFlow", "snowBubbleParticles", "edgeCrystals"].includes(visualizerState.selectedTheme)) {
    visualizerState.selectedTheme = "ambientWave";
  }

  if (!["blue", "purple", "warm"].includes(visualizerState.ambientWave.tone)) {
    visualizerState.ambientWave.tone = "blue";
  }

  if (!["low", "medium", "high"].includes(visualizerState.ambientWave.sensitivity)) {
    visualizerState.ambientWave.sensitivity = "medium";
  }

  if (!["top", "bottom", "both"].includes(visualizerState.ambientWave.edgeMode)) {
    visualizerState.ambientWave.edgeMode = "bottom";
  }

  if (!["soft", "medium", "strong"].includes(visualizerState.ambientWave.glowStrength)) {
    visualizerState.ambientWave.glowStrength = "medium";
  }

  if (!["rainbow", "neonBlue", "neonPurple", "warmGlow"].includes(visualizerState.reactiveBorder.colorStyle)) {
    visualizerState.reactiveBorder.colorStyle = "rainbow";
  }

  if (!["low", "medium", "high"].includes(visualizerState.reactiveBorder.intensity)) {
    visualizerState.reactiveBorder.intensity = "medium";
  }

  if (!["thin", "medium", "thick"].includes(visualizerState.reactiveBorder.borderThickness)) {
    visualizerState.reactiveBorder.borderThickness = "thin";
  }

  if (!["soft", "medium", "strong"].includes(visualizerState.reactiveBorder.glowStrength)) {
    visualizerState.reactiveBorder.glowStrength = "medium";
  }

  if (!["clockwise", "anticlockwise"].includes(visualizerState.flowBorder.direction)) {
    visualizerState.flowBorder.direction = "clockwise";
  }

  if (!["calm", "balanced", "energetic"].includes(visualizerState.flowBorder.speedMode)) {
    visualizerState.flowBorder.speedMode = "balanced";
  }

  if (!["short", "medium", "long"].includes(visualizerState.flowBorder.segmentLength)) {
    visualizerState.flowBorder.segmentLength = "medium";
  }

  if (!["soft", "medium", "strong"].includes(visualizerState.flowBorder.glowStrength)) {
    visualizerState.flowBorder.glowStrength = "medium";
  }

  if (!["rainbow", "cool", "warm"].includes(visualizerState.flowBorder.colorStyle)) {
    visualizerState.flowBorder.colorStyle = "rainbow";
  }

  if (!["white", "yellow", "aqua", "multicolor"].includes(visualizerState.sideBars.colorStyle)) {
    visualizerState.sideBars.colorStyle = "multicolor";
  }

  if (!["thin", "medium", "thick"].includes(visualizerState.sideBars.barThickness)) {
    visualizerState.sideBars.barThickness = "thick";
  }

  if (!["low", "medium", "high"].includes(visualizerState.sideBars.sensitivity)) {
    visualizerState.sideBars.sensitivity = "medium";
  }

  if (!["low", "medium", "high"].includes(visualizerState.sideBars.barDensity)) {
    visualizerState.sideBars.barDensity = "medium";
  }

  if (!["sideRipples", "flatRipples"].includes(visualizerState.flatRipples.mode)) {
    visualizerState.flatRipples.mode = "sideRipples";
  }

  if (!["low", "medium", "high"].includes(visualizerState.flatRipples.intensity)) {
    visualizerState.flatRipples.intensity = "medium";
  }

  if (!["red", "blue", "white", "multicolor"].includes(visualizerState.flatRipples.colorStyle)) {
    visualizerState.flatRipples.colorStyle = "blue";
  }

  if (!["calm", "balanced", "energetic"].includes(visualizerState.flatRipples.speed)) {
    visualizerState.flatRipples.speed = "calm";
  }

  if (!["low", "medium", "high"].includes(visualizerState.dotParticles.density)) {
    visualizerState.dotParticles.density = "medium";
  }

  if (!["calm", "balanced", "energetic"].includes(visualizerState.dotParticles.motionStyle)) {
    visualizerState.dotParticles.motionStyle = "balanced";
  }

  if (!["mostlyClockwise", "mostlyAnticlockwise", "beatReactive"].includes(visualizerState.dotParticles.directionBehavior)) {
    visualizerState.dotParticles.directionBehavior = "beatReactive";
  }

  if (!["soft", "medium", "strong"].includes(visualizerState.dotParticles.glowStrength)) {
    visualizerState.dotParticles.glowStrength = "medium";
  }

  if (!["sideRipples", "flatRipples"].includes(visualizerState.rippleFlow.mode)) {
    visualizerState.rippleFlow.mode = "sideRipples";
  }

  if (!["low", "medium", "high"].includes(visualizerState.rippleFlow.intensity)) {
    visualizerState.rippleFlow.intensity = "medium";
  }

  if (!["low", "medium", "high"].includes(visualizerState.rippleFlow.sensitivity)) {
    visualizerState.rippleFlow.sensitivity = "medium";
  }

  if (!["red", "blue", "white"].includes(visualizerState.rippleFlow.colorStyle)) {
    visualizerState.rippleFlow.colorStyle = "blue";
  }

  if (!["middle", "fullWidth"].includes(visualizerState.snowBubbleParticles.fallArea)) {
    visualizerState.snowBubbleParticles.fallArea = "middle";
  }

  if (!["low", "medium", "high"].includes(visualizerState.snowBubbleParticles.density)) {
    visualizerState.snowBubbleParticles.density = "medium";
  }

  if (!["calm", "balanced", "energetic"].includes(visualizerState.snowBubbleParticles.motionStyle)) {
    visualizerState.snowBubbleParticles.motionStyle = "balanced";
  }

  if (!["soft", "medium", "strong"].includes(visualizerState.snowBubbleParticles.glowStrength)) {
    visualizerState.snowBubbleParticles.glowStrength = "medium";
  }

  if (!["small", "medium", "large"].includes(visualizerState.snowBubbleParticles.particleSize)) {
    visualizerState.snowBubbleParticles.particleSize = "medium";
  }

  if (!["soft", "balanced", "energetic"].includes(visualizerState.edgeCrystals.flutterStyle)) {
    visualizerState.edgeCrystals.flutterStyle = "balanced";
  }

  if (!["low", "medium", "high"].includes(visualizerState.edgeCrystals.density)) {
    visualizerState.edgeCrystals.density = "medium";
  }

  if (!["soft", "medium", "strong"].includes(visualizerState.edgeCrystals.glowStrength)) {
    visualizerState.edgeCrystals.glowStrength = "medium";
  }

  if (!["blue", "purple", "red", "white"].includes(visualizerState.edgeCrystals.colorStyle)) {
    visualizerState.edgeCrystals.colorStyle = "blue";
  }

  if (!["left", "right", "both"].includes(visualizerState.edgeCrystals.edgeMode)) {
    visualizerState.edgeCrystals.edgeMode = "both";
  }

  rebuildCachedPaint();
}

window.addEventListener("resize", resizeCanvas);

if (window.audioBridge) {
  window.audioBridge.onLevel((payload) => {
    if (payload && typeof payload.value === "number") {
      latestSource = payload.source || "unknown";
      lastPayloadValue = payload.value;

      // 1. Fetch the sensitivity multiplier safely from the active visualizerState
      const globalSensitivity = visualizerState?.globalSensitivity ?? 1.0;

      // 2. Scale the raw incoming audio value by your multiplier calculation
      const scaledValue = payload.value * globalSensitivity;

      const helperDriven = latestSource === "helper";
      incomingLevel = latestSource === "helper"
        ? clamp01(scaledValue * getActiveAudioMultiplier())
        : clamp01(scaledValue);
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
}

createDebugPanel();
refreshBridgeStatus();
if (debugEnabled) {
  setInterval(refreshBridgeStatus, 1000);
}

resizeCanvas();
requestAnimationFrame(renderFrame);
