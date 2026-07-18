const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage,
  screen,
  shell,
  dialog,
  nativeTheme,
  powerMonitor,
  globalShortcut
} = require("electron");

app.commandLine.appendSwitch("ozone-platform", "x11");

const path = require("path");
const fs = require("fs");

const { createAudioBridge } = require("./audioBridge");
const {
  createDefaultSettings,
  createSettingsStore,
  createThemeDefaults,
  sanitizeSettings
} = require("../settingsStore");
const ThemeAgent = require("../themeAgent");

let APP_VERSION = "2.3.0";
try {
  const pkg = require("../package.json");
  if (pkg && pkg.version) {
    APP_VERSION = pkg.version;
  }
} catch {
  try {
    APP_VERSION = app.getVersion();
  } catch {}
}
const PROJECT_URL = "https://github.com/SamXop123/Paraline";
const LANDING_URL = "https://paraline.app";

const THEME_LABELS = {
  ambientWave: "Ambient Wave",
  sideBraids: "Side Braids",
  auroraDrift: "Aurora Drift",
  crimsonDusk: "Crimson Dusk"
};

const overlayWindows = new Map();
let audioBridge = null;
let settingsStore = null;
let visualizerSettings = null;
let themeAgent = null;
let isPaused = false;
let isHidden = false;
let fakeTimer = null;
let settingsWindow = null;
let onboardingWindow = null;
let tray = null;
let latestWallpaperColors = ["#00f2fe", "#4facfe", "#8ee2ff"];
let globalShortcutsSuspended = false;
let shortcutRegistrationFailures = {};
let isQuitting = false;
let isReconcilingDisplays = false;

// --- Focus Mode state ---
let focusModeTimer = null;
let focusModeCurrentlyDimmed = false;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

function getWindowIconPath() {
  const iconCandidates = [
    path.join(process.resourcesPath, "assets", "appicon.png"),
    path.join(process.resourcesPath, "assets", "paraline.png"),
    path.join(__dirname, "../assets", "appicon.png"),
    path.join(__dirname, "../assets", "paraline.png")
  ];
  return iconCandidates.find((p) => fs.existsSync(p)) || path.join(__dirname, "../assets", "appicon.png");
}

function getSystemAppearance() {
  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
}

function getSystemAccentColor() {
  return "#4facfe"; // fallback / default accent
}

function getSystemColorState() {
  return {
    systemAppearance: getSystemAppearance(),
    systemAccentColor: getSystemAccentColor()
  };
}

function getRendererSettings() {
  const helperConnected = audioBridge ? (audioBridge.getStatus().mode === "helper") : false;
  return {
    ...visualizerSettings,
    ...getSystemColorState(),
    paused: isPaused,
    hidden: isHidden,
    version: APP_VERSION,
    helperConnected: helperConnected,
    shortcutRegistrationFailures: shortcutRegistrationFailures,
    wallpaperColors: latestWallpaperColors
  };
}

function getActiveOverlayWindows() {
  return Array.from(overlayWindows.values()).filter((win) => win && !win.isDestroyed());
}

function sendVisualizerSettingsToWindow(targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) {
    return;
  }
  targetWindow.webContents.send("visualizer-settings", getRendererSettings());
}

function sendVisualizerSettings() {
  for (const overlayWindow of getActiveOverlayWindows()) {
    sendVisualizerSettingsToWindow(overlayWindow);
  }
  sendVisualizerSettingsToWindow(settingsWindow);
}

function sendFocusModeOpacity(opacity) {
  for (const overlayWindow of getActiveOverlayWindows()) {
    overlayWindow.webContents.send("focus-mode-opacity", opacity);
  }
}

function getCurrentFocusModeOpacity() {
  if (visualizerSettings.focusMode && visualizerSettings.focusMode.enabled && focusModeCurrentlyDimmed) {
    return typeof visualizerSettings.focusMode.dimOpacity === "number" ? visualizerSettings.focusMode.dimOpacity : 0.1;
  }
  return 1.0;
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

function updateSettings(patch) {
  if (!settingsStore) return;
  const merged = mergeSettingsPatch(visualizerSettings, patch);
  visualizerSettings = settingsStore.save(sanitizeSettings(merged));
  
  applyFocusModeState();
  sendVisualizerSettings();
  refreshTrayMenu();
}

function applyFocusModeState() {
  if (visualizerSettings.focusMode && visualizerSettings.focusMode.enabled) {
    startFocusModePolling();
  } else {
    stopFocusModePolling();
  }
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
      if (!focusModeCurrentlyDimmed) {
        sendFocusModeOpacity(typeof fmSettings.dimOpacity === "number" ? fmSettings.dimOpacity : 0.1);
        focusModeCurrentlyDimmed = true;
      }
    } else {
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
  if (focusModeCurrentlyDimmed) {
    sendFocusModeOpacity(1.0);
    focusModeCurrentlyDimmed = false;
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

function sendAudioLevel(value, source) {
  if (isPaused) {
    return;
  }
  for (const overlayWindow of getActiveOverlayWindows()) {
    overlayWindow.webContents.send("audio-level", {
      value,
      source
    });
  }
}

function applyOverlayWindowDisplayState(overlayWindow, display) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }
  const { bounds } = display;
  overlayWindow.setBounds(bounds);
  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setIgnoreMouseEvents(true);
}

function createOverlayWindow(display) {
  const existingOverlayWindow = overlayWindows.get(display.id);
  if (existingOverlayWindow && !existingOverlayWindow.isDestroyed()) {
    applyOverlayWindowDisplayState(existingOverlayWindow, display);
    return existingOverlayWindow;
  }

  const { bounds } = display;
  const overlayWindow = new BrowserWindow({
    title: "Paraline Visualizer",
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
    focusable: false,
    show: false,
    backgroundColor: "#00000000",
    icon: getWindowIconPath(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  overlayWindows.set(display.id, overlayWindow);
  applyOverlayWindowDisplayState(overlayWindow, display);
  overlayWindow.showInactive();
  overlayWindow.loadFile(path.join(__dirname, "../index.html"));

  overlayWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      sendVisualizerSettingsToWindow(overlayWindow);
      overlayWindow.webContents.send("focus-mode-opacity", getCurrentFocusModeOpacity());
    }, 100);
  });

  overlayWindow.on("closed", () => {
    if (overlayWindows.get(display.id) === overlayWindow) {
      overlayWindows.delete(display.id);
    }
    const displayCount = screen.getAllDisplays().length;
    if (!isQuitting && !isReconcilingDisplays && overlayWindows.size < displayCount) {
      reconcileOverlayWindows();
    }
  });

  return overlayWindow;
}

function reconcileOverlayWindows() {
  const displays = screen.getAllDisplays();
  if (displays.length === 0) {
    return;
  }
  isReconcilingDisplays = true;
  try {
    const activeDisplayIds = new Set();
    for (const display of displays) {
      activeDisplayIds.add(display.id);
      createOverlayWindow(display);
    }
    for (const displayId of Array.from(overlayWindows.keys())) {
      if (!activeDisplayIds.has(displayId)) {
        destroyOverlayWindowForDisplay(displayId);
      }
    }
  } finally {
    isReconcilingDisplays = false;
  }
}

function destroyOverlayWindowForDisplay(displayId) {
  const overlayWindow = overlayWindows.get(displayId);
  overlayWindows.delete(displayId);
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.destroy();
  }
}

function destroyAllOverlayWindows() {
  for (const displayId of Array.from(overlayWindows.keys())) {
    destroyOverlayWindowForDisplay(displayId);
  }
}

function togglePaused() {
  isPaused = !isPaused;
  sendVisualizerSettings();
  refreshTrayMenu();
}

function toggleHidden() {
  isHidden = !isHidden;
  for (const win of getActiveOverlayWindows()) {
    if (isHidden) {
      win.hide();
    } else {
      win.showInactive();
    }
  }
  sendVisualizerSettings();
  refreshTrayMenu();
}

function reloadVisualizer() {
  for (const win of getActiveOverlayWindows()) {
    win.reload();
  }
}

function resetCurrentThemeSettings() {
  const theme = visualizerSettings.selectedTheme || "ambientWave";
  const defaults = createThemeDefaults()[theme];
  updateSettings({ [theme]: defaults });
}

function resetAllSettings() {
  visualizerSettings = settingsStore.save(createDefaultSettings());
  applyFocusModeState();
  sendVisualizerSettings();
  refreshTrayMenu();
}

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
    }
  });
  settingsWindow.setMenu(null);
  settingsWindow.loadFile(path.join(__dirname, "../settings.html"));
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

function createOnboardingWindow() {
  if (onboardingWindow) {
    onboardingWindow.focus();
    return;
  }
  onboardingWindow = new BrowserWindow({
    width: 720,
    height: 640,
    minWidth: 600,
    minHeight: 500,
    title: "Welcome to Paraline",
    icon: getWindowIconPath(),
    backgroundColor: "#08090d",
    center: true,
    resizable: true,
    show: false,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  onboardingWindow.setMenu(null);
  onboardingWindow.loadFile(path.join(__dirname, "../onboarding.html"));
  onboardingWindow.once("ready-to-show", () => {
    onboardingWindow.show();
  });
  onboardingWindow.on("closed", () => {
    onboardingWindow = null;
  });
}

function createTrayIcon() {
  return getWindowIconPath();
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.on("click", () => showCustomContextMenu());
  tray.on("right-click", () => showCustomContextMenu());
  refreshTrayMenu();
}

function refreshTrayMenu() {
  if (!tray) return;

  const bridgeStatus = audioBridge ? audioBridge.getStatus() : { mode: "simulated", reason: "Stopped" };
  const helperConnected = bridgeStatus.mode === "helper";

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
    { value: "sideBraids", label: "Side Braids" },
    { value: "crimsonDusk", label: "Crimson Dusk" }
  ];

  const themeSubmenu = themeOptions.map((themeOption) => ({
    label: themeOption.label,
    type: "radio",
    checked: visualizerSettings ? visualizerSettings.selectedTheme === themeOption.value : false,
    click: () => updateSettings({ selectedTheme: themeOption.value })
  }));

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
    { type: "separator" },
    {
      label: "Visualizer Mode",
      submenu: themeSubmenu
    },
    { type: "separator" },
    {
      label: "Reset Current Theme",
      click: () => resetCurrentThemeSettings()
    },
    {
      label: "Reset All Settings",
      click: () => resetAllSettings()
    },
    { type: "separator" },
    {
      label: "Quit App",
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(menu);
  tray.setToolTip(`Paraline Visualizer - ${THEME_LABELS[visualizerSettings.selectedTheme] || "Visualizer"}`);
}

function showCustomContextMenu() {
  const cursorPoint = screen.getCursorScreenPoint();
  const targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
  let overlayWindow = overlayWindows.get(targetDisplay.id);
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    reconcileOverlayWindows();
    overlayWindow = overlayWindows.get(targetDisplay.id);
  }
  if (!overlayWindow || overlayWindow.isDestroyed()) return;

  const localX = cursorPoint.x - targetDisplay.bounds.x;
  const localY = cursorPoint.y - targetDisplay.bounds.y;

  overlayWindow.webContents.send("show-context-menu", {
    x: localX,
    y: localY
  });
  overlayWindow.setIgnoreMouseEvents(false);
}

function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();
  shortcutRegistrationFailures = {};

  if (globalShortcutsSuspended) return;

  const shortcuts = visualizerSettings ? visualizerSettings.shortcuts : null;
  if (!shortcuts) return;

  const formatAccelerator = (uiShortcut) => {
    if (!uiShortcut || uiShortcut === "None") return null;
    return uiShortcut;
  };

  const pauseAcc = formatAccelerator(shortcuts.togglePause);
  const hideAcc = formatAccelerator(shortcuts.toggleHide);
  const cycleAcc = formatAccelerator(shortcuts.cycleTheme);

  if (pauseAcc) {
    try {
      const registered = globalShortcut.register(pauseAcc, togglePaused);
      if (!registered) shortcutRegistrationFailures.togglePause = true;
    } catch {
      shortcutRegistrationFailures.togglePause = true;
    }
  }

  if (hideAcc) {
    try {
      const registered = globalShortcut.register(hideAcc, toggleHidden);
      if (!registered) shortcutRegistrationFailures.toggleHide = true;
    } catch {
      shortcutRegistrationFailures.toggleHide = true;
    }
  }

  if (cycleAcc) {
    try {
      const registered = globalShortcut.register(cycleAcc, () => {
        const themes = ["ambientWave", "sideBraids", "auroraDrift", "crimsonDusk"];
        const currentIdx = themes.indexOf(visualizerSettings.selectedTheme || "ambientWave");
        const nextIdx = (currentIdx + 1) % themes.length;
        updateSettings({ selectedTheme: themes[nextIdx] });
      });
      if (!registered) shortcutRegistrationFailures.cycleTheme = true;
    } catch {
      shortcutRegistrationFailures.cycleTheme = true;
    }
  }

  // Fallback Ctrl+Alt+S to open Settings window directly
  try {
    globalShortcut.register("Ctrl+Alt+S", () => {
      createSettingsWindow();
    });
  } catch (err) {
    console.error("Failed to register Ctrl+Alt+S global shortcut:", err);
  }
}

// IPC Handlers
function setupIpcHandlers() {
  ipcMain.handle("audio-bridge-status", () => {
    return audioBridge ? audioBridge.getStatus() : { mode: "simulated", reason: "Stopped" };
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
      if (ALLOWED_EXTERNAL_SCHEMES.has(new URL(data).protocol)) {
        shell.openExternal(data);
      }
    } else if (action === "open-settings") {
      createSettingsWindow();
    } else if (action === "quit") {
      app.quit();
    }
  });

  ipcMain.on("set-ignore-mouse-events", (event, ignore) => {
    const overlayWindow = getActiveOverlayWindows().find(
      (win) => win.webContents.id === event.sender.id
    );
    if (!overlayWindow) return;
    if (ignore) {
      overlayWindow.setIgnoreMouseEvents(true);
      overlayWindow.blur();
    } else {
      overlayWindow.setIgnoreMouseEvents(false);
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
    return settingsStore.loadProfiles();
  });

  ipcMain.handle("theme-profiles:save", (_event, profileName) => {
    if (!profileName || typeof profileName !== "string") return null;
    const profiles = settingsStore.loadProfiles();
    profiles[profileName] = visualizerSettings;
    settingsStore.saveProfiles(profiles);
    return profiles;
  });

  ipcMain.handle("theme-profiles:load", (_event, profileName) => {
    if (!profileName || typeof profileName !== "string") return null;
    const profiles = settingsStore.loadProfiles();
    if (!profiles[profileName]) return null;
    updateSettings(profiles[profileName]);
    return visualizerSettings;
  });

  ipcMain.handle("theme-profiles:delete", (_event, profileName) => {
    if (!profileName || typeof profileName !== "string") return settingsStore.loadProfiles();
    const profiles = settingsStore.loadProfiles();
    delete profiles[profileName];
    settingsStore.saveProfiles(profiles);
    return profiles;
  });

  ipcMain.handle("theme-profiles:reset", () => {
    resetAllSettings();
    return getRendererSettings();
  });

  ipcMain.handle("theme-profiles:duplicate", async (_, profileName) => {
    if (!profileName || typeof profileName !== "string") return { success: false, error: "Invalid name" };
    const profiles = settingsStore.loadProfiles();
    if (!profiles[profileName]) return { success: false, error: "Not found" };
    
    let counter = 1;
    let newName = `${profileName} (Copy)`;
    while (profiles[newName]) {
      newName = `${profileName} (Copy ${counter})`;
      counter++;
    }

    const duplicated = JSON.parse(JSON.stringify(profiles[profileName]));
    profiles[newName] = sanitizeSettings(duplicated);
    settingsStore.saveProfiles(profiles);
    return { success: true, profileName: newName };
  });

  ipcMain.handle("theme-profiles:reset-current", () => {
    resetCurrentThemeSettings();
    return getRendererSettings();
  });

  ipcMain.handle("shortcuts:suspend", (_event, suspend) => {
    globalShortcutsSuspended = suspend;
    if (suspend) {
      globalShortcut.unregisterAll();
    } else {
      registerGlobalShortcuts();
    }
  });

  ipcMain.handle("theme-profiles:export", async (_event, profileName) => {
    const profiles = settingsStore.loadProfiles();
    if (!profiles[profileName]) return { success: false };

    const dialogParent = settingsWindow && !settingsWindow.isDestroyed() ? settingsWindow : null;
    const result = await dialog.showSaveDialog(dialogParent, {
      title: "Export Theme Profile",
      defaultPath: `${profileName}.json`,
      filters: [{ name: "JSON Files", extensions: ["json"] }]
    });

    if (result.canceled || !result.filePath) return { success: false };
    fs.writeFileSync(result.filePath, JSON.stringify(profiles[profileName], null, 2));
    return { success: true };
  });

  ipcMain.handle("settings:export-all", async () => {
    const backup = {
      version: 1,
      settings: settingsStore.load(),
      profiles: settingsStore.loadProfiles()
    };
    const dialogParent = settingsWindow && !settingsWindow.isDestroyed() ? settingsWindow : null;
    const result = await dialog.showSaveDialog(dialogParent, {
      title: "Export All Settings & Profiles",
      defaultPath: "paraline-backup.json",
      filters: [{ name: "JSON Files", extensions: ["json"] }]
    });

    if (result.canceled || !result.filePath) return { success: false };
    fs.writeFileSync(result.filePath, JSON.stringify(backup, null, 2));
    return { success: true };
  });

  ipcMain.handle("theme-profiles:import", async () => {
    const dialogParent = settingsWindow && !settingsWindow.isDestroyed() ? settingsWindow : null;
    const result = await dialog.showOpenDialog(dialogParent, {
      title: "Import Theme Profile",
      filters: [{ name: "JSON Files", extensions: ["json"] }],
      properties: ["openFile"]
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    try {
      const content = fs.readFileSync(result.filePaths[0], "utf-8");
      const parsed = JSON.parse(content);
      const cleanProfile = sanitizeSettings(parsed);
      const profiles = settingsStore.loadProfiles();
      
      let baseName = path.basename(result.filePaths[0], ".json");
      let finalName = baseName;
      let counter = 1;
      while (profiles[finalName]) {
        finalName = `${baseName} (${counter})`;
        counter++;
      }
      profiles[finalName] = cleanProfile;
      settingsStore.saveProfiles(profiles);
      return profiles;
    } catch {
      return null;
    }
  });

  ipcMain.handle("settings:import-all", async () => {
    const dialogParent = settingsWindow && !settingsWindow.isDestroyed() ? settingsWindow : null;
    const result = await dialog.showOpenDialog(dialogParent, {
      title: "Import All Settings & Profiles",
      filters: [{ name: "JSON Files", extensions: ["json"] }],
      properties: ["openFile"]
    });

    if (result.canceled || result.filePaths.length === 0) return { success: false };
    try {
      const content = fs.readFileSync(result.filePaths[0], "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.version !== 1 || !parsed.settings || !parsed.profiles) return { success: false };
      
      const cleanSettings = sanitizeSettings(parsed.settings);
      settingsStore.save(cleanSettings);
      visualizerSettings = cleanSettings;
      
      const cleanProfiles = {};
      for (const [name, prof] of Object.entries(parsed.profiles)) {
        cleanProfiles[name] = sanitizeSettings(prof);
      }
      settingsStore.saveProfiles(cleanProfiles);
      
      sendVisualizerSettings();
      refreshTrayMenu();
      return { success: true };
    } catch {
      return { success: false };
    }
  });

  ipcMain.handle("app:open-external", (_event, url) => {
    if (ALLOWED_EXTERNAL_SCHEMES.has(new URL(url).protocol)) {
      shell.openExternal(url);
    }
  });

  ipcMain.handle("onboarding:dismiss", (_event, payload = {}) => {
    dismissOnboarding(payload.dontShowAgain);
  });
}

const ALLOWED_EXTERNAL_SCHEMES = new Set(["https:", "http:"]);

function dismissOnboarding(dontShowAgain) {
  if (dontShowAgain && visualizerSettings) {
    updateSettings({ onboardingSeen: true });
  }
  if (onboardingWindow && !onboardingWindow.isDestroyed()) {
    onboardingWindow.close();
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  settingsStore = createSettingsStore(app.getPath("userData"));
  visualizerSettings = settingsStore.save(settingsStore.load());

  registerGlobalShortcuts();

  themeAgent = new ThemeAgent(settingsStore, (themeName) => {
    updateSettings({ selectedTheme: themeName });
  });
  themeAgent.start();

  audioBridge = createAudioBridge(
    (level) => {
      sendAudioLevel(level, "helper");
    },
    (status) => {
      if (status.mode === "helper") {
        stopSimulatedAudioFallback();
      } else {
        startSimulatedAudioFallback();
      }
      sendVisualizerSettings();
      refreshTrayMenu();
    }
  );

  audioBridge.start();

  reconcileOverlayWindows();

  createTray();

  screen.on("display-metrics-changed", (_e, display) => {
    applyOverlayWindowDisplayState(overlayWindows.get(display.id), display);
    reconcileOverlayWindows();
  });
  screen.on("display-added", (_e, display) => {
    createOverlayWindow(display);
    reconcileOverlayWindows();
    sendVisualizerSettings();
  });
  screen.on("display-removed", (_e, display) => {
    destroyOverlayWindowForDisplay(display.id);
    reconcileOverlayWindows();
    sendVisualizerSettings();
  });

  nativeTheme.on("updated", () => {
    sendVisualizerSettings();
  });

  setupIpcHandlers();
});

app.on("second-instance", () => {
  reconcileOverlayWindows();
  sendVisualizerSettings();
});

app.on("activate", () => {
  if (getActiveOverlayWindows().length === 0) {
    reconcileOverlayWindows();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  stopSimulatedAudioFallback();
  destroyAllOverlayWindows();
  stopFocusModePolling();
  if (themeAgent) {
    themeAgent.stop();
  }
  if (audioBridge) {
    audioBridge.stop();
  }
});
