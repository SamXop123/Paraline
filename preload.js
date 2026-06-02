const { contextBridge, ipcRenderer, webFrame } = require("electron");

// Reset zoom factor and disable zoom completely to prevent layout distortion in the visualizer and settings windows
try {
  webFrame.setZoomFactor(1.0);
  webFrame.setZoomLevel(0);
  webFrame.setVisualZoomLevelLimits(1, 1);
} catch (err) {
  console.warn("Failed to set webFrame zoom limits:", err);
}

// Block Ctrl/Cmd + zoom keyboard shortcuts (+, -, 0)
window.addEventListener("keydown", (e) => {
  const isCmdOrCtrl = e.ctrlKey || e.metaKey;
  if (isCmdOrCtrl) {
    const key = e.key;
    if (key === "=" || key === "-" || key === "+" || key === "0" || key === "_" || e.keyCode === 187 || e.keyCode === 189 || e.keyCode === 48) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}, { capture: true });

// Block Ctrl/Cmd + mouse wheel zoom
window.addEventListener("wheel", (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
  }
}, { passive: false });

contextBridge.exposeInMainWorld("audioBridge", {
  onLevel(listener) {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on("audio-level", wrapped);

    return () => {
      ipcRenderer.removeListener("audio-level", wrapped);
    };
  },
  getStatus() {
    return ipcRenderer.invoke("audio-bridge-status");
  }
});

contextBridge.exposeInMainWorld("visualizerSettings", {
  onChange(listener) {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on("visualizer-settings", wrapped);

    return () => {
      ipcRenderer.removeListener("visualizer-settings", wrapped);
    };
  },
  get() {
    return ipcRenderer.invoke("visualizer-settings:get");
  },
  update(patch) {
    return ipcRenderer.invoke("visualizer-settings:update", patch);
  },
  action(action, data) {
    ipcRenderer.send("visualizer-action", { action, data });
  },
  setIgnoreMouseEvents(ignore) {
    ipcRenderer.send("set-ignore-mouse-events", ignore);
  },
  onShowMenu(listener) {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on("show-context-menu", wrapped);

    return () => {
      ipcRenderer.removeListener("show-context-menu", wrapped);
    };
  },
  onFocusModeOpacity(listener) {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on("focus-mode-opacity", wrapped);

    return () => {
      ipcRenderer.removeListener("focus-mode-opacity", wrapped);
    };
  }
});

contextBridge.exposeInMainWorld("paralineApp", {
  togglePause: () => ipcRenderer.invoke("app:toggle-pause"),
  toggleHide: () => ipcRenderer.invoke("app:toggle-hide"),
  reloadVisualizer: () => ipcRenderer.invoke("app:reload-visualizer"),
  openExternal: (url) => ipcRenderer.invoke("app:open-external", url),

  getThemeProfiles: () => ipcRenderer.invoke("theme-profiles:get"),

  saveThemeProfile: (profileName) =>
    ipcRenderer.invoke("theme-profiles:save", profileName),

  loadThemeProfile: (profileName) =>
    ipcRenderer.invoke("theme-profiles:load", profileName),

  deleteThemeProfile: (profileName) =>
    ipcRenderer.invoke("theme-profiles:delete", profileName),

  duplicateThemeProfile: (srcProfileName, destProfileName) =>
    ipcRenderer.invoke("theme-profiles:duplicate", srcProfileName, destProfileName),

  exportThemeProfile: (profileName) =>
    ipcRenderer.invoke("theme-profiles:export", profileName),

  importThemeProfile: () =>
    ipcRenderer.invoke("theme-profiles:import"),

  resetThemeSettings: () =>
    ipcRenderer.invoke("theme-profiles:reset"),

  resetActiveThemeSettings: () =>
    ipcRenderer.invoke("theme-profiles:reset-current")
});
