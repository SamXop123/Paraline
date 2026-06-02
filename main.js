const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen, shell, dialog, nativeTheme, systemPreferences, powerMonitor } = require("electron");
const path = require("path");
const fs = require("fs");
const { createAudioBridge } = require("./audioBridge");
const { createDefaultSettings, createSettingsStore, createThemeDefaults, sanitizeSettings } = require("./settingsStore");
const ThemeAgent = require('./themeAgent');

let overlayWindow;
let lastBridgeMode = null;
let lastBridgeReason = null;
let audioBridge;
let fakeTimer;
let isQuitting = false;
let tray;
let isPaused = false;
let isHidden = false;
let settingsStore;
let visualizerSettings;
let settingsWindow;
let themeAgent;

// --- Focus Mode state ---
let focusModeTimer = null;
let focusModeCurrentlyDimmed = false;

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 800,
    minHeight: 600,
    title: "Paraline Settings",
    icon: getWindowIconPath(),
    backgroundColor: "#08090d",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    },
    autoHideMenuBar: true
  });
  settingsWindow.loadFile("settings.html");
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

const APP_VERSION = app.getVersion();

function normalizeSystemColor(rawColor, fallback = "#4facfe") {
  if (typeof rawColor !== "string") {
    return fallback;
  }

  const normalized = rawColor.trim().replace(/^#/, "");

  if (normalized.length === 8) {
    return `#${normalized.slice(0, 6)}`;
  }

  if (normalized.length === 6) {
    return `#${normalized}`;
  }

  return fallback;
}

function getSystemAppearance() {
  if (typeof nativeTheme.shouldUseDarkColorsForSystemIntegratedUI === "boolean") {
    return nativeTheme.shouldUseDarkColorsForSystemIntegratedUI ? "dark" : "light";
  }

  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
}

function getSystemAccentColor() {
  if (typeof systemPreferences.getAccentColor === "function") {
    try {
      const accentColor = normalizeSystemColor(systemPreferences.getAccentColor(), "");

      if (accentColor) {
        return accentColor;
      }
    } catch (_error) {
      // Fall through to the highlight color fallback.
    }
  }

  if (typeof systemPreferences.getColor === "function") {
    try {
      return normalizeSystemColor(systemPreferences.getColor("highlight"));
    } catch (_error) {
      // Use the in-app fallback below.
    }
  }

  return "#4facfe";
}

function getSystemColorState() {
  return {
    systemAppearance: getSystemAppearance(),
    systemAccentColor: getSystemAccentColor()
  };
}

function applyStartupSettings(launchOnStartup) {
  app.setLoginItemSettings({
    openAtLogin: launchOnStartup,
    path: process.execPath,
    args: app.isPackaged ? [] : [app.getAppPath()]
  });
}
const PROJECT_URL = "https://github.com/SamXop123/Paraline";
const LANDING_URL = "https://paraline.vercel.app";
const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
}

const THEME_LABELS = {
  ambientWave: "Ambient Wave",
  reactiveBorder: "Reactive Border",
  flowBorder: "Flow Border",
  sideBars: "Side Bars",
  flatRipples: "Pulse Lines",
  dotParticles: "Dot Particles",
  rippleFlow: "Ripple Flow",
  snowBubbleParticles: "Snow Particles",
  edgeCrystals: "Edge Crystals",
  sideBraids: "Side Braids",
  auroraDrift: "Aurora Drift"
};

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { bounds } = primaryDisplay;

  overlayWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    backgroundColor: "#00000000",
    icon: getWindowIconPath(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setBounds(bounds);
  overlayWindow.moveTop();
  overlayWindow.loadFile("index.html");
  overlayWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      sendVisualizerSettings();
    }, 100);
  });

  overlayWindow.on("close", () => {
    stopSimulatedAudioFallback();
  });

  overlayWindow.on("closed", () => {
    stopSimulatedAudioFallback();
    overlayWindow = null;
  });
}

function sendAudioLevel(value, source) {
  if (isPaused) {
    return;
  }

  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  overlayWindow.webContents.send("audio-level", {
    value,
    source
  });
}

function getRendererSettings() {
  const helperConnected = audioBridge ? (audioBridge.getStatus().mode === "helper") : false;
  return {
    ...visualizerSettings,
    ...getSystemColorState(),
    paused: isPaused,
    hidden: isHidden,
    version: APP_VERSION,
    helperConnected: helperConnected
  };
}

function sendVisualizerSettingsToWindow(targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) {
    return;
  }

  targetWindow.webContents.send("visualizer-settings", getRendererSettings());
}

function sendVisualizerSettings() {
  sendVisualizerSettingsToWindow(overlayWindow);
  sendVisualizerSettingsToWindow(settingsWindow);
}

function mergeSettingsPatch(currentSettings, patch) {
  const mergedSettings = { ...currentSettings };

  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      mergedSettings[key] = {
        ...(currentSettings[key] || {}),
        ...value
      };
      continue;
    }

    mergedSettings[key] = value;
  }

  return mergedSettings;
}

function updateSettings(nextSettings) {
  visualizerSettings = settingsStore.save(mergeSettingsPatch(visualizerSettings, nextSettings));

  if (nextSettings.launchOnStartup !== undefined) {
    applyStartupSettings(visualizerSettings.launchOnStartup);
  }

  // Re-apply focus mode whenever settings change
  if (nextSettings.focusMode !== undefined) {
    applyFocusModeState();
  }
  if (nextSettings.themeAutomation !== undefined && themeAgent) {
    themeAgent.start();
  }

  sendVisualizerSettings();
  refreshTrayMenu();
}

function togglePaused() {
  isPaused = !isPaused;
  sendVisualizerSettings();
  refreshTrayMenu();
}

function toggleHidden() {
  isHidden = !isHidden;
  sendVisualizerSettings();
  refreshTrayMenu();
}

function reloadVisualizer() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  stopSimulatedAudioFallback();
  overlayWindow.webContents.reloadIgnoringCache();
}

// --- Focus Mode polling ---
function sendFocusModeOpacity(opacity) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }
  overlayWindow.webContents.send("focus-mode-opacity", { opacity });
}

function startFocusModePolling() {
  stopFocusModePolling();
  focusModeCurrentlyDimmed = false;

  focusModeTimer = setInterval(() => {
    const fmSettings = visualizerSettings.focusMode;
    if (!fmSettings || !fmSettings.enabled) {
      if (focusModeCurrentlyDimmed) {
        sendFocusModeOpacity(1.0);
        focusModeCurrentlyDimmed = false;
      }
      return;
    }

    const idleSeconds = powerMonitor.getSystemIdleTime();
    const thresholdSeconds = fmSettings.idleTimeout || 5;

    if (idleSeconds < thresholdSeconds) {
      // User is active — dim the visualizer
      if (!focusModeCurrentlyDimmed) {
        sendFocusModeOpacity(typeof fmSettings.dimOpacity === "number" ? fmSettings.dimOpacity : 0.1);
        focusModeCurrentlyDimmed = true;
      }
    } else {
      // User is idle — restore to full opacity
      if (focusModeCurrentlyDimmed) {
        sendFocusModeOpacity(1.0);
        focusModeCurrentlyDimmed = false;
      }
    }
  }, 1000);
}

function stopFocusModePolling() {
  if (focusModeTimer) {
    clearInterval(focusModeTimer);
    focusModeTimer = null;
  }
  // Restore opacity when polling stops
  if (focusModeCurrentlyDimmed) {
    sendFocusModeOpacity(1.0);
    focusModeCurrentlyDimmed = false;
  }
}

function applyFocusModeState() {
  if (visualizerSettings.focusMode && visualizerSettings.focusMode.enabled) {
    startFocusModePolling();
  } else {
    stopFocusModePolling();
  }
}

function startSimulatedAudioFallback() {
  if (fakeTimer) {
    return;
  }

  fakeTimer = setInterval(() => {
    const now = Date.now();
    const level = 0.15 + (Math.sin(now * 0.001 * 0.45) + 1) * 0.08;
    sendAudioLevel(level, "simulated");
  }, 33);
}

function stopSimulatedAudioFallback() {
  if (fakeTimer) {
    clearInterval(fakeTimer);
    fakeTimer = null;
  }
}

function resizeOverlayToPrimaryDisplay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  const { bounds } = screen.getPrimaryDisplay();
  overlayWindow.setBounds(bounds);
  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.moveTop();
}

function handleAudioBridgeStatusChange(status) {
  if (!status) {
    return;
  }
  // Only show notification if transitioning into simulated mode for the first time or reason has changed
  if (
    status.mode === "simulated" &&
    (lastBridgeMode !== "simulated" || lastBridgeReason !== status.reason)
  ) {
    const { Notification } = require("electron");
    new Notification({
      title: "Paraline: Audio Fallback Active",
      body: status.reason.substring(0, 200) + (status.reason.length > 200 ? "..." : "")
    }).show();
  }
  lastBridgeMode = status.mode;
  lastBridgeReason = status.reason;
  if (status.mode !== "helper" && !isQuitting) {
    startSimulatedAudioFallback();
  } else {
    stopSimulatedAudioFallback();
  }
  refreshTrayMenu();
}

function resetCurrentThemeSettings() {
  const themeDefaults = createThemeDefaults();
  const selectedTheme = visualizerSettings.selectedTheme;
  const nextThemeDefaults = themeDefaults[selectedTheme];

  if (!nextThemeDefaults) {
    return;
  }

  updateSettings({
    [selectedTheme]: nextThemeDefaults
  });
}

function resetAllSettings() {
  visualizerSettings = settingsStore.save(createDefaultSettings());
  isPaused = false;
  sendVisualizerSettings();
  refreshTrayMenu();
}
// Reserved JavaScript property names that must not be used as object keys.
// Using these as keys on a plain object pollutes Object.prototype and affects
// every plain object created in the same process for the rest of its lifetime.
const RESERVED_PROFILE_NAMES = new Set(["__proto__", "constructor", "prototype"]);

// Allowlist pattern: profile names may only contain letters, digits,
// spaces, hyphens, underscores, and parentheses (max 64 chars).
const SAFE_PROFILE_NAME_RE = /^[A-Za-z0-9 _\-()À-ɏ]{1,64}$/;

function isValidProfileName(name) {
  if (typeof name !== "string" || name.trim() === "") return false;
  if (RESERVED_PROFILE_NAMES.has(name)) return false;
  return SAFE_PROFILE_NAME_RE.test(name);
}

function saveThemeProfile(profileName) {
  if (!isValidProfileName(profileName)) {
    return null;
  }
  const profiles = settingsStore.loadProfiles();

  profiles[profileName] = visualizerSettings;

  settingsStore.saveProfiles(profiles);

  return profiles;
}

function loadThemeProfile(profileName) {
  if (!isValidProfileName(profileName)) {
    return null;
  }
  const profiles = settingsStore.loadProfiles();

  if (!profiles[profileName]) {
    return null;
  }

  visualizerSettings = settingsStore.save(profiles[profileName]);

  sendVisualizerSettings();
  refreshTrayMenu();

  return visualizerSettings;
}

function deleteThemeProfile(profileName) {
  if (!isValidProfileName(profileName)) {
    return settingsStore.loadProfiles();
  }
  const profiles = settingsStore.loadProfiles();

  delete profiles[profileName];

  settingsStore.saveProfiles(profiles);

  return profiles;
}

function duplicateThemeProfile(srcName, destName) {
  if (
    typeof srcName !== "string" || srcName.trim() === "" ||
    typeof destName !== "string" || destName.trim() === "" ||
    destName === "__proto__" || destName === "constructor" || destName === "prototype"
  ) {
    return null;
  }
  const profiles = settingsStore.loadProfiles();
  if (!profiles[srcName]) {
    return null;
  }
  profiles[destName] = JSON.parse(JSON.stringify(profiles[srcName]));
  settingsStore.saveProfiles(profiles);
  return profiles;
}

function getThemeProfiles() {
  return settingsStore.loadProfiles();
}

// Allowlist of URL schemes that may be passed to shell.openExternal.
// Any other scheme (e.g. ms-settings:, file:, javascript:) is silently
// rejected to prevent OS-level command execution via registered protocols.
const ALLOWED_EXTERNAL_SCHEMES = new Set(["https:", "http:"]);

function openExternalUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (!ALLOWED_EXTERNAL_SCHEMES.has(parsed.protocol)) {
    return;
  }
  shell.openExternal(url).catch(() => {
    // Ignore shell open failures from tray actions.
  });
}

function getWindowIconPath() {
  const iconCandidates = [
    path.join(process.resourcesPath, "assets", "appicon.ico"),
    path.join(process.resourcesPath, "assets", "appicon.png"),
    path.join(process.resourcesPath, "assets", "paraline.png"),
    path.join(__dirname, "assets", "appicon.ico"),
    path.join(__dirname, "assets", "appicon.png"),
    path.join(__dirname, "assets", "paraline.png")
  ];

  const iconPath = iconCandidates.find((candidatePath) => {
    try {
      return require("fs").existsSync(candidatePath);
    } catch {
      return false;
    }
  });

  return iconPath || path.join(__dirname, "assets", "appicon.png");
}

function createTrayIcon() {
  const iconCandidates = [
    path.join(process.resourcesPath, "assets", "appicon.png"),
    path.join(process.resourcesPath, "assets", "paraline.png"),
    path.join(__dirname, "assets", "appicon.png"),
    path.join(__dirname, "assets", "paraline.png")
  ];

  const iconPath = iconCandidates.find((candidatePath) => {
    try {
      return require("fs").existsSync(candidatePath);
    } catch {
      return false;
    }
  });

  if (iconPath) {
    const image = nativeImage.createFromPath(iconPath);

    if (!image.isEmpty()) {
      return image.resize({ width: 16, height: 16 });
    }
  }

  const fallbackSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#0e1a24"/>
      <path d="M12 40C18 40 18 24 24 24C30 24 30 48 36 48C42 48 42 18 52 18" fill="none" stroke="#8ee2ff" stroke-width="5" stroke-linecap="round"/>
      <path d="M12 46C18 46 18 34 24 34C30 24 30 54 36 54C42 54 42 28 52 28" fill="none" stroke="#ffd2eb" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
    </svg>
  `;

  return nativeImage
    .createFromDataURL(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvg)}`)
    .resize({ width: 16, height: 16 });
}

function buildMainThemeMenuItems() {
  const themeOptions = [
    { value: "ambientWave", label: "Ambient Wave" },
    { value: "auroraDrift", label: "Aurora Drift" },
    { value: "reactiveBorder", label: "Reactive Border" },
    { value: "flowBorder", label: "Flow Border" },
    { value: "sideBars", label: "Side Bars" },
    { value: "flatRipples", label: "Pulse Lines" },
    { value: "dotParticles", label: "Dot Particles" },
    { value: "rippleFlow", label: "Ripple Flow" },
    { value: "snowBubbleParticles", label: "Snow Particles" },
    { value: "edgeCrystals", label: "Edge Crystals" },
    { value: "sideBraids", label: "Side Braids" }
  ];

  return themeOptions.map((themeOption) => ({
    label: themeOption.label,
    type: "radio",
    checked: visualizerSettings.selectedTheme === themeOption.value,
    click: () => updateSettings({ selectedTheme: themeOption.value })
  }));
}

function buildAmbientWaveMenuItems() {
  const ambientSettings = visualizerSettings.ambientWave;

  return [
    {
      label: "Ambient Wave Settings",
      enabled: false
    },
    {
      label: "Tone",
      submenu: [
        { label: "Blue", value: "blue" },
        { label: "Purple", value: "purple" },
        { label: "Warm", value: "warm" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: ambientSettings.tone === option.value,
        click: () => updateSettings({ ambientWave: { tone: option.value } })
      }))
    },
    {
      label: "Sensitivity",
      submenu: ["low", "medium", "high"].map((level) => ({
        label: level[0].toUpperCase() + level.slice(1),
        type: "radio",
        checked: ambientSettings.sensitivity === level,
        click: () => updateSettings({ ambientWave: { sensitivity: level } })
      }))
    },
    {
      label: "Edge Mode",
      submenu: ["top", "bottom", "both"].map((edgeMode) => ({
        label: edgeMode[0].toUpperCase() + edgeMode.slice(1),
        type: "radio",
        checked: ambientSettings.edgeMode === edgeMode,
        click: () => updateSettings({ ambientWave: { edgeMode } })
      }))
    },
    {
      label: "Glow Strength",
      submenu: ["soft", "medium", "strong"].map((strength) => ({
        label: strength[0].toUpperCase() + strength.slice(1),
        type: "radio",
        checked: ambientSettings.glowStrength === strength,
        click: () => updateSettings({ ambientWave: { glowStrength: strength } })
      }))
    }
  ];
}

function buildReactiveBorderMenuItems() {
  const reactiveSettings = visualizerSettings.reactiveBorder;

  return [
    {
      label: "Reactive Border Settings",
      enabled: false
    },
    {
      label: "Color Style",
      submenu: [
        { label: "Rainbow", value: "rainbow" },
        { label: "Neon Blue", value: "neonBlue" },
        { label: "Neon Purple", value: "neonPurple" },
        { label: "Warm Glow", value: "warmGlow" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: reactiveSettings.colorStyle === option.value,
        click: () => updateSettings({ reactiveBorder: { colorStyle: option.value } })
      }))
    },
    {
      label: "Intensity",
      submenu: ["low", "medium", "high"].map((level) => ({
        label: level[0].toUpperCase() + level.slice(1),
        type: "radio",
        checked: reactiveSettings.intensity === level,
        click: () => updateSettings({ reactiveBorder: { intensity: level } })
      }))
    },
    {
      label: "Border Thickness",
      submenu: [
        { label: "Thin", value: "thin" },
        { label: "Medium", value: "medium" },
        { label: "Thick", value: "thick" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: reactiveSettings.borderThickness === option.value,
        click: () => updateSettings({ reactiveBorder: { borderThickness: option.value } })
      }))
    },
    {
      label: "Glow Strength",
      submenu: ["soft", "medium", "strong"].map((strength) => ({
        label: strength[0].toUpperCase() + strength.slice(1),
        type: "radio",
        checked: reactiveSettings.glowStrength === strength,
        click: () => updateSettings({ reactiveBorder: { glowStrength: strength } })
      }))
    }
  ];
}

function buildFlowBorderMenuItems() {
  const flowSettings = visualizerSettings.flowBorder;

  return [
    {
      label: "Flow Border Settings",
      enabled: false
    },
    {
      label: "Direction",
      submenu: [
        { label: "Clockwise", value: "clockwise" },
        { label: "Anticlockwise", value: "anticlockwise" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: flowSettings.direction === option.value,
        click: () => updateSettings({ flowBorder: { direction: option.value } })
      }))
    },
    {
      label: "Speed Mode",
      submenu: [
        { label: "Calm", value: "calm" },
        { label: "Balanced", value: "balanced" },
        { label: "Energetic", value: "energetic" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: flowSettings.speedMode === option.value,
        click: () => updateSettings({ flowBorder: { speedMode: option.value } })
      }))
    },
    {
      label: "Segment Length",
      submenu: [
        { label: "Short", value: "short" },
        { label: "Medium", value: "medium" },
        { label: "Long", value: "long" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: flowSettings.segmentLength === option.value,
        click: () => updateSettings({ flowBorder: { segmentLength: option.value } })
      }))
    },
    {
      label: "Glow Strength",
      submenu: ["soft", "medium", "strong"].map((strength) => ({
        label: strength[0].toUpperCase() + strength.slice(1),
        type: "radio",
        checked: flowSettings.glowStrength === strength,
        click: () => updateSettings({ flowBorder: { glowStrength: strength } })
      }))
    },
    {
      label: "Color Style",
      submenu: [
        { label: "Rainbow", value: "rainbow" },
        { label: "Cool", value: "cool" },
        { label: "Warm", value: "warm" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: flowSettings.colorStyle === option.value,
        click: () => updateSettings({ flowBorder: { colorStyle: option.value } })
      }))
    }
  ];
}

function buildSideBarsMenuItems() {
  const sideBarsSettings = visualizerSettings.sideBars;

  return [
    {
      label: "Side Bars Settings",
      enabled: false
    },
    {
      label: "Color Style",
      submenu: [
        { label: "White", value: "white" },
        { label: "Yellow", value: "yellow" },
        { label: "Aqua", value: "aqua" },
        { label: "Multicolor", value: "multicolor" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: sideBarsSettings.colorStyle === option.value,
        click: () => updateSettings({ sideBars: { colorStyle: option.value } })
      }))
    },
    {
      label: "Bar Thickness",
      submenu: [
        { label: "Thin", value: "thin" },
        { label: "Medium", value: "medium" },
        { label: "Thick", value: "thick" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: sideBarsSettings.barThickness === option.value,
        click: () => updateSettings({ sideBars: { barThickness: option.value } })
      }))
    },
    {
      label: "Sensitivity",
      submenu: ["low", "medium", "high"].map((level) => ({
        label: level[0].toUpperCase() + level.slice(1),
        type: "radio",
        checked: sideBarsSettings.sensitivity === level,
        click: () => updateSettings({ sideBars: { sensitivity: level } })
      }))
    },
    {
      label: "Bar Count",
      submenu: [
        { label: "Less", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "More", value: "high" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: sideBarsSettings.barDensity === option.value,
        click: () => updateSettings({ sideBars: { barDensity: option.value } })
      }))
    }
  ];
}

function buildFlatRipplesMenuItems() {
  const rippleSettings = visualizerSettings.flatRipples;

  return [
    {
      label: "Pulse Lines Settings",
      enabled: false
    },
    {
      label: "Mode",
      submenu: [
        { label: "Side Ripples", value: "sideRipples" },
        { label: "Flat Ripples", value: "flatRipples" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: rippleSettings.mode === option.value,
        click: () => updateSettings({ flatRipples: { mode: option.value } })
      }))
    },
    {
      label: "Intensity",
      submenu: ["low", "medium", "high"].map((level) => ({
        label: level[0].toUpperCase() + level.slice(1),
        type: "radio",
        checked: rippleSettings.intensity === level,
        click: () => updateSettings({ flatRipples: { intensity: level } })
      }))
    },
    {
      label: "Speed",
      submenu: [
        { label: "Calm", value: "calm" },
        { label: "Balanced", value: "balanced" },
        { label: "Energetic", value: "energetic" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: rippleSettings.speed === option.value,
        click: () => updateSettings({ flatRipples: { speed: option.value } })
      }))
    },
    {
      label: "Color",
      submenu: [
        { label: "Red", value: "red" },
        { label: "Blue", value: "blue" },
        { label: "White", value: "white" },
        { label: "Multicolor", value: "multicolor" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: rippleSettings.colorStyle === option.value,
        click: () => updateSettings({ flatRipples: { colorStyle: option.value } })
      }))
    }
  ];
}

function buildDotParticlesMenuItems() {
  const dotSettings = visualizerSettings.dotParticles;

  return [
    {
      label: "Dot Particles Settings",
      enabled: false
    },
    {
      label: "Density",
      submenu: ["low", "medium", "high"].map((level) => ({
        label: level[0].toUpperCase() + level.slice(1),
        type: "radio",
        checked: dotSettings.density === level,
        click: () => updateSettings({ dotParticles: { density: level } })
      }))
    },
    {
      label: "Motion Style",
      submenu: [
        { label: "Calm", value: "calm" },
        { label: "Balanced", value: "balanced" },
        { label: "Energetic", value: "energetic" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: dotSettings.motionStyle === option.value,
        click: () => updateSettings({ dotParticles: { motionStyle: option.value } })
      }))
    },
    {
      label: "Direction Behavior",
      submenu: [
        { label: "Mostly Clockwise", value: "mostlyClockwise" },
        { label: "Mostly Anticlockwise", value: "mostlyAnticlockwise" },
        { label: "Beat Reactive", value: "beatReactive" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: dotSettings.directionBehavior === option.value,
        click: () => updateSettings({ dotParticles: { directionBehavior: option.value } })
      }))
    },
    {
      label: "Glow Strength",
      submenu: ["soft", "medium", "strong"].map((strength) => ({
        label: strength[0].toUpperCase() + strength.slice(1),
        type: "radio",
        checked: dotSettings.glowStrength === strength,
        click: () => updateSettings({ dotParticles: { glowStrength: strength } })
      }))
    }
  ];
}

function buildRippleFlowMenuItems() {
  const rippleSettings = visualizerSettings.rippleFlow;

  return [
    {
      label: "Ripple Flow Settings",
      enabled: false
    },
    {
      label: "Mode",
      submenu: [
        { label: "Side Ripples", value: "sideRipples" },
        { label: "Flat Ripples", value: "flatRipples" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: rippleSettings.mode === option.value,
        click: () => updateSettings({ rippleFlow: { mode: option.value } })
      }))
    },
    {
      label: "Intensity",
      submenu: ["low", "medium", "high"].map((level) => ({
        label: level[0].toUpperCase() + level.slice(1),
        type: "radio",
        checked: rippleSettings.intensity === level,
        click: () => updateSettings({ rippleFlow: { intensity: level } })
      }))
    },
    {
      label: "Sensitivity",
      submenu: ["low", "medium", "high"].map((level) => ({
        label: level[0].toUpperCase() + level.slice(1),
        type: "radio",
        checked: rippleSettings.sensitivity === level,
        click: () => updateSettings({ rippleFlow: { sensitivity: level } })
      }))
    },
    {
      label: "Color",
      submenu: [
        { label: "Red", value: "red" },
        { label: "Blue", value: "blue" },
        { label: "White", value: "white" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: rippleSettings.colorStyle === option.value,
        click: () => updateSettings({ rippleFlow: { colorStyle: option.value } })
      }))
    }
  ];
}

function buildSnowBubbleParticlesMenuItems() {
  const particleSettings = visualizerSettings.snowBubbleParticles;

  return [
    {
      label: "Snow Particles Settings",
      enabled: false
    },
    {
      label: "Snowfall Area",
      submenu: [
        { label: "Middle Section", value: "middle" },
        { label: "Entire Top Border", value: "fullWidth" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: particleSettings.fallArea === option.value,
        click: () => updateSettings({ snowBubbleParticles: { fallArea: option.value } })
      }))
    },
    {
      label: "Density",
      submenu: ["low", "medium", "high"].map((level) => ({
        label: level[0].toUpperCase() + level.slice(1),
        type: "radio",
        checked: particleSettings.density === level,
        click: () => updateSettings({ snowBubbleParticles: { density: level } })
      }))
    },
    {
      label: "Motion Style",
      submenu: [
        { label: "Calm", value: "calm" },
        { label: "Balanced", value: "balanced" },
        { label: "Energetic", value: "energetic" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: particleSettings.motionStyle === option.value,
        click: () => updateSettings({ snowBubbleParticles: { motionStyle: option.value } })
      }))
    },
    {
      label: "Glow Strength",
      submenu: ["soft", "medium", "strong"].map((strength) => ({
        label: strength[0].toUpperCase() + strength.slice(1),
        type: "radio",
        checked: particleSettings.glowStrength === strength,
        click: () => updateSettings({ snowBubbleParticles: { glowStrength: strength } })
      }))
    },
    {
      label: "Particle Size",
      submenu: [
        { label: "Small", value: "small" },
        { label: "Medium", value: "medium" },
        { label: "Large", value: "large" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: particleSettings.particleSize === option.value,
        click: () => updateSettings({ snowBubbleParticles: { particleSize: option.value } })
      }))
    }
  ];
}

function buildEdgeCrystalsMenuItems() {
  const flutterSettings = visualizerSettings.edgeCrystals;

  return [
    {
      label: "Edge Crystals Settings",
      enabled: false
    },
    {
      label: "Flutter Style",
      submenu: [
        { label: "Soft", value: "soft" },
        { label: "Balanced", value: "balanced" },
        { label: "Energetic", value: "energetic" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: flutterSettings.flutterStyle === option.value,
        click: () => updateSettings({ edgeCrystals: { flutterStyle: option.value } })
      }))
    },
    {
      label: "Density",
      submenu: ["low", "medium", "high"].map((level) => ({
        label: level[0].toUpperCase() + level.slice(1),
        type: "radio",
        checked: flutterSettings.density === level,
        click: () => updateSettings({ edgeCrystals: { density: level } })
      }))
    },
    {
      label: "Glow Strength",
      submenu: ["soft", "medium", "strong"].map((strength) => ({
        label: strength[0].toUpperCase() + strength.slice(1),
        type: "radio",
        checked: flutterSettings.glowStrength === strength,
        click: () => updateSettings({ edgeCrystals: { glowStrength: strength } })
      }))
    },
    {
      label: "Color Style",
      submenu: [
        { label: "Blue", value: "blue" },
        { label: "Purple", value: "purple" },
        { label: "Red", value: "red" },
        { label: "White", value: "white" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: flutterSettings.colorStyle === option.value,
        click: () => updateSettings({ edgeCrystals: { colorStyle: option.value } })
      }))
    },
    {
      label: "Edge Mode",
      submenu: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
        { label: "Both", value: "both" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: flutterSettings.edgeMode === option.value,
        click: () => updateSettings({ edgeCrystals: { edgeMode: option.value } })
      }))
    }
  ];
}

function buildSideBraidsMenuItems() {
  const braidSettings = visualizerSettings.sideBraids;

  return [
    {
      label: "Side Braids Settings",
      enabled: false
    },
    {
      label: "Braid Density",
      submenu: [
        { label: "Sparse", value: "sparse" },
        { label: "Medium", value: "medium" },
        { label: "Dense", value: "dense" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: braidSettings.braidDensity === option.value,
        click: () => updateSettings({ sideBraids: { braidDensity: option.value } })
      }))
    },
    {
      label: "Braid Width",
      submenu: [
        { label: "Thin", value: "thin" },
        { label: "Medium", value: "medium" },
        { label: "Thick", value: "thick" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: braidSettings.braidWidth === option.value,
        click: () => updateSettings({ sideBraids: { braidWidth: option.value } })
      }))
    },
    {
      label: "Motion Style",
      submenu: [
        { label: "Calm", value: "calm" },
        { label: "Balanced", value: "balanced" },
        { label: "Energetic", value: "energetic" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: braidSettings.motionStyle === option.value,
        click: () => updateSettings({ sideBraids: { motionStyle: option.value } })
      }))
    },
    {
      label: "Color Style",
      submenu: [
        { label: "Cyan Pink", value: "cyanPink" },
        { label: "Blue Purple", value: "bluePurple" },
        { label: "Red Blue", value: "redBlue" },
        { label: "White", value: "white" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: braidSettings.colorStyle === option.value,
        click: () => updateSettings({ sideBraids: { colorStyle: option.value } })
      }))
    },
    {
      label: "Flow Direction",
      submenu: [
        { label: "Top Down", value: "topDown" },
        { label: "Bottom Up", value: "bottomUp" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: braidSettings.flowDirection === option.value,
        click: () => updateSettings({ sideBraids: { flowDirection: option.value } })
      }))
    },
    {
      label: "Glow Strength",
      submenu: [
        { label: "Soft", value: "soft" },
        { label: "Medium", value: "medium" },
        { label: "Strong", value: "strong" }
      ].map((option) => ({
        label: option.label,
        type: "radio",
        checked: braidSettings.glowStrength === option.value,
        click: () => updateSettings({ sideBraids: { glowStrength: option.value } })
      }))
    }
  ];
}

function buildActiveThemeMenuItems() {
  if (visualizerSettings.selectedTheme === "reactiveBorder") {
    return buildReactiveBorderMenuItems();
  }

  if (visualizerSettings.selectedTheme === "flowBorder") {
    return buildFlowBorderMenuItems();
  }

  if (visualizerSettings.selectedTheme === "sideBars") {
    return buildSideBarsMenuItems();
  }

  if (visualizerSettings.selectedTheme === "flatRipples") {
    return buildFlatRipplesMenuItems();
  }

  if (visualizerSettings.selectedTheme === "dotParticles") {
    return buildDotParticlesMenuItems();
  }

  if (visualizerSettings.selectedTheme === "rippleFlow") {
    return buildRippleFlowMenuItems();
  }

  if (visualizerSettings.selectedTheme === "snowBubbleParticles") {
    return buildSnowBubbleParticlesMenuItems();
  }

  if (visualizerSettings.selectedTheme === "edgeCrystals") {
    return buildEdgeCrystalsMenuItems();
  }

  if (visualizerSettings.selectedTheme === "sideBraids") {
    return buildSideBraidsMenuItems();
  }

  if (visualizerSettings.selectedTheme === "auroraDrift") {
    return []; // No settings in Phase 1
  }

  return buildAmbientWaveMenuItems();
}

function refreshTrayMenu() {
  if (!tray) {
    return;
  }

  const bridgeStatus = audioBridge ? audioBridge.getStatus() : {
    mode: "simulated",
    reason: "Audio bridge not started."
  };
  const helperConnected = bridgeStatus.mode === "helper";

  const menu = Menu.buildFromTemplate([
    {
      label: "Open Settings",
      click: () => createSettingsWindow()
    },
    { type: "separator" },
    {
      label: `Paraline ${APP_VERSION}`,
      enabled: false
    },
    {
      label: helperConnected ? "Audio Capture: Live" : "Audio Capture: Fallback",
      enabled: false
    },
    { type: "separator" },
    {
      label: isPaused ? "Resume Visualizer" : "Pause Visualizer",
      click: () => togglePaused()
    },
    {
      label: isHidden ? "Show Visualizer" : "Hide Visualizer",
      click: () => toggleHidden()
    },
    {
      label: "Reload Visualizer",
      click: () => reloadVisualizer()
    },
    {
      label: "Launch on Startup",
      type: "checkbox",
      checked: !!visualizerSettings.launchOnStartup,
      click: () => updateSettings({ launchOnStartup: !visualizerSettings.launchOnStartup })
    },
    {
      label: "Focus Mode",
      type: "checkbox",
      checked: !!(visualizerSettings.focusMode && visualizerSettings.focusMode.enabled),
      click: () => updateSettings({ focusMode: { ...visualizerSettings.focusMode, enabled: !(visualizerSettings.focusMode && visualizerSettings.focusMode.enabled) } })
    },
    { type: "separator" },
    {
      label: "Visualizer Mode",
      submenu: buildMainThemeMenuItems()
    },
    { type: "separator" },
    ...buildActiveThemeMenuItems(),
    { type: "separator" },
    {
      label: `Reset ${THEME_LABELS[visualizerSettings.selectedTheme]} Settings`,
      click: () => resetCurrentThemeSettings()
    },
    {
      label: "Reset All Settings",
      click: () => resetAllSettings()
    },
    { type: "separator" },
    {
      label: "Open Landing Page",
      click: () => openExternalUrl(LANDING_URL)
    },
    {
      label: "View GitHub Repository",
      click: () => openExternalUrl(PROJECT_URL)
    },
    { type: "separator" },
    {
      label: "Quit App",
      click: () => app.quit()
    }
  ]);

  // We render the context menu in the HTML page to achieve the macOS glassmorphic look
  // tray.setContextMenu(menu);
  tray.setToolTip(`Paraline Visualizer - ${THEME_LABELS[visualizerSettings.selectedTheme]}`);
}

function showCustomContextMenu() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }
  const cursorPoint = screen.getCursorScreenPoint();

  // Force Windows to refresh the window's z-order relative to other topmost windows
  // (like the tray overflow panel) by toggling setAlwaysOnTop and calling show()/focus()
  overlayWindow.setAlwaysOnTop(false);
  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.show();
  overlayWindow.focus();
  overlayWindow.moveTop();

  const primaryDisplay = screen.getPrimaryDisplay();
  const localX = cursorPoint.x - primaryDisplay.bounds.x;
  const localY = cursorPoint.y - primaryDisplay.bounds.y;

  overlayWindow.webContents.send("show-context-menu", {
    x: localX,
    y: localY
  });
  overlayWindow.setIgnoreMouseEvents(false);
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.on("click", () => {
    showCustomContextMenu();
  });
  tray.on("right-click", () => {
    showCustomContextMenu();
  });
  refreshTrayMenu();
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  settingsStore = createSettingsStore(app.getPath("userData"));
  visualizerSettings = settingsStore.save(settingsStore.load());
  applyStartupSettings(visualizerSettings.launchOnStartup);

  nativeTheme.on("updated", () => {
    sendVisualizerSettings();
  });
  systemPreferences.on("accent-color-changed", () => {
    sendVisualizerSettings();
  });
  systemPreferences.on("color-changed", () => {
    sendVisualizerSettings();
  });

  // --- NEW: Start Theme Automation Agent ---
  themeAgent = new ThemeAgent(settingsStore, (themeName) => {
    updateSettings({ selectedTheme: themeName });
  });
  
  themeAgent.start();
  // -----------------------------------------

  ipcMain.handle("audio-bridge-status", () => {
    if (!audioBridge) {
      return {
        mode: "simulated",
        reason: "Audio bridge not created yet."
      };
    }

    return audioBridge.getStatus();
  });

  ipcMain.handle("visualizer-settings:get", () => {
    return getRendererSettings();
  });

  ipcMain.on("visualizer-action", (event, { action, data }) => {
    if (action === "toggle-paused") {
      togglePaused();
    } else if (action === "toggle-hide") {
      toggleHidden();
    } else if (action === "reload") {
      reloadVisualizer();
    } else if (action === "reset-theme") {
      resetCurrentThemeSettings();
    } else if (action === "reset-all") {
      resetAllSettings();
    } else if (action === "open-url") {
      openExternalUrl(data);
    } else if (action === "open-settings") {
      createSettingsWindow();
    } else if (action === "quit") {
      app.quit();
    }
  });

  ipcMain.on("set-ignore-mouse-events", (event, ignore) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (ignore) {
        overlayWindow.setIgnoreMouseEvents(true, { forward: true });
        overlayWindow.blur();
      } else {
        overlayWindow.setIgnoreMouseEvents(false);
      }
    }
  });

  ipcMain.handle("visualizer-settings:update", (_event, patch) => {
    updateSettings(patch);
    return getRendererSettings();
  });

  ipcMain.handle("app:toggle-pause", () => {
    togglePaused();
    return isPaused;
  });

  ipcMain.handle("app:toggle-hide", () => {
    toggleHidden();
    return isHidden;
  });

  ipcMain.handle("app:reload-visualizer", () => {
    reloadVisualizer();
  });

  ipcMain.handle("theme-profiles:get", () => {
    return getThemeProfiles();
  });

  ipcMain.handle("theme-profiles:save", (_event, profileName) => {
    return saveThemeProfile(profileName);
  });

  ipcMain.handle("theme-profiles:load", (_event, profileName) => {
    return loadThemeProfile(profileName);
  });

  ipcMain.handle("theme-profiles:delete", (_event, profileName) => {
    return deleteThemeProfile(profileName);
  });

  ipcMain.handle("theme-profiles:duplicate", (_event, srcProfileName, destProfileName) => {
    return duplicateThemeProfile(srcProfileName, destProfileName);
  });

  ipcMain.handle("theme-profiles:reset", () => {
    resetAllSettings();
    return getRendererSettings();
  });

  ipcMain.handle("theme-profiles:reset-current", () => {
    resetCurrentThemeSettings();
    return getRendererSettings();
  });

  ipcMain.handle("theme-profiles:export", async (_event, profileName) => {
    const profiles = settingsStore.loadProfiles();

    if (!profiles[profileName]) {
      return { success: false };
    }

    const dialogParent = settingsWindow && !settingsWindow.isDestroyed()
      ? settingsWindow
      : BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(dialogParent, {
      title: "Export Theme Profile",
      defaultPath: `${profileName}.json`,
      filters: [
        {
          name: "JSON Files",
          extensions: ["json"]
        }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false };
    }

    require("fs").writeFileSync(
      result.filePath,
      JSON.stringify(profiles[profileName], null, 2)
    );

    return { success: true };
  });

  ipcMain.handle("settings:export-all", async () => {
    const backup = {
        version: 1,
        settings: settingsStore.load(),
        profiles: settingsStore.loadProfiles()
    };
    const dialogParent = settingsWindow && !settingsWindow.isDestroyed()
      ? settingsWindow
      : BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(dialogParent, {
      title: "Export Settings Backup",
      defaultPath: "paraline-settings-backup.json",
      filters: [
        {
          name: "JSON Files",
          extensions: ["json"]
        }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false };
    }

    require("fs").writeFileSync(
      result.filePath,
      JSON.stringify(backup, null, 2)
    );

    return { success: true };
  });
  ipcMain.handle("theme-profiles:import", async () => {
    try {
      const dialogParent = settingsWindow && !settingsWindow.isDestroyed()
        ? settingsWindow
        : BrowserWindow.getFocusedWindow();
      const result = await dialog.showOpenDialog(dialogParent, {
        title: "Import Theme Profile",
        filters: [
          {
            name: "JSON Files",
            extensions: ["json"]
          }
        ],
        properties: ["openFile"]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }

      const filePath = result.filePaths[0];

      // Check file size (100KB limit to prevent DoS attacks)
      const stats = fs.statSync(filePath);
      const MAX_FILE_SIZE = 100 * 1024; // 100KB
      if (stats.size > MAX_FILE_SIZE) {
        return { success: false, error: "File too large. Maximum size is 100KB." };
      }

      const importedProfile = JSON.parse(
        require("fs").readFileSync(filePath, "utf8")
      );

      // Validate imported profile structure
      if (!importedProfile || typeof importedProfile !== "object" || Array.isArray(importedProfile)) {
        return { success: false, error: "Invalid theme profile format" };
      }

      // Sanitize the imported profile to prevent prototype pollution and arbitrary property injection
      const sanitizedProfile = sanitizeSettings(importedProfile);

      const rawProfileName = path.basename(filePath, ".json");
      if (!isValidProfileName(rawProfileName)) {
        return { success: false, error: "Invalid profile name: the filename contains reserved or disallowed characters." };
      }
      const profileName = rawProfileName;
      const profiles = settingsStore.loadProfiles();

      profiles[profileName] = sanitizedProfile;
      settingsStore.saveProfiles(profiles);

      return {
        success: true,
        profileName
      };
    } catch (error) {
      console.error("Failed to import theme profile:", error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle("settings:import-all", async () => {
    try {
      const dialogParent = settingsWindow && !settingsWindow.isDestroyed()
        ? settingsWindow
        : BrowserWindow.getFocusedWindow();

      const result = await dialog.showOpenDialog(dialogParent, {
        title: "Import Settings Backup",
        filters: [
          {
            name: "JSON Files",
            extensions: ["json"]
          }
        ],
        properties: ["openFile"]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }

      const filePath = result.filePaths[0];

      // Check file size (100KB limit to prevent DoS attacks)
      const stats = fs.statSync(filePath);
      const MAX_FILE_SIZE = 100 * 1024; // 100KB
      if (stats.size > MAX_FILE_SIZE) {
        return { success: false, error: "File too large. Maximum size is 100KB." };
      }

      const importedBackup = JSON.parse(
          require("fs").readFileSync(filePath, "utf8")
      );

      if (
          !importedBackup ||
          typeof importedBackup !== "object" ||
          Array.isArray(importedBackup)
      ) {
          return { success: false, error: "Invalid backup format" };
      }
      const cleanSettings = sanitizeSettings(
          importedBackup.settings || {}
      );

      settingsStore.save(cleanSettings);

    const safeProfiles = {};

    for (const [name, profile] of Object.entries(importedBackup.profiles || {})) {

        if (
            typeof name !== "string" ||
            name === "__proto__" ||
            name === "constructor" ||
            name === "prototype"
        ) {
            continue;
        }

        safeProfiles[name] = sanitizeSettings(profile || {});
    }

    settingsStore.saveProfiles(safeProfiles);

      visualizerSettings = cleanSettings;

      applyStartupSettings(visualizerSettings.launchOnStartup);
      applyFocusModeState();

      if (themeAgent) {
          themeAgent.start();
      }

      sendVisualizerSettings();
      refreshTrayMenu();

      return {                                    
        success: true,
      };
    }
    catch (error) {
      console.error("Failed to import settings backup:", error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle("app:open-external", (_event, url) => {
    openExternalUrl(url);
  });

  createOverlayWindow();
  createTray();
  sendVisualizerSettings();

  // Start Focus Mode polling if it was previously enabled
  applyFocusModeState();

  // Start the simulated fallback first so any real helper level can immediately disable it.
  startSimulatedAudioFallback();

  audioBridge = createAudioBridge((value) => {
    stopSimulatedAudioFallback();
    sendAudioLevel(value, "helper");
  }, handleAudioBridgeStatusChange);
  audioBridge.start();
  refreshTrayMenu();

  screen.on("display-metrics-changed", resizeOverlayToPrimaryDisplay);
  screen.on("display-added", resizeOverlayToPrimaryDisplay);
  screen.on("display-removed", resizeOverlayToPrimaryDisplay);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
    }
  });
});

app.on("second-instance", () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    resizeOverlayToPrimaryDisplay();
    sendVisualizerSettings();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  stopSimulatedAudioFallback();

  if (audioBridge) {
    audioBridge.stop();
  }
});

app.on("will-quit", () => {
  stopSimulatedAudioFallback();
});

app.on("window-all-closed", () => {
  isQuitting = true;
  stopSimulatedAudioFallback();

  if (audioBridge) {
    audioBridge.stop();
  }

  stopSimulatedAudioFallback();
  stopFocusModePolling();

  if (process.platform !== "darwin") {
    app.quit();
  }
});
