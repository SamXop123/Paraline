class LinuxBackend {
  /**
   * Returns the unique identifier for the backend.
   * @returns {string}
   */
  getName() {
    throw new Error("getName() must be implemented");
  }

  /**
   * Appends necessary command line flags before the app is ready.
   * @param {import('electron').App} app
   */
  setupCommandLine(app) {
    // Default: no-op
  }

  /**
   * Gets specific BrowserWindow configuration options for the overlay window.
   * @param {import('electron').Display} display
   * @returns {import('electron').BrowserWindowConstructorOptions}
   */
  getOverlayWindowOptions(display) {
    return {};
  }

  /**
   * Applies window positioning, layering, and desktop behaviors once the window is created/reconciled.
   * @param {import('electron').BrowserWindow} overlayWindow
   * @param {import('electron').Display} display
   */
  applyOverlayWindowDisplayState(overlayWindow, display) {
    const { bounds } = display;
    overlayWindow.setBounds(bounds);
  }

  /**
   * Handles updating mouse input pass-through behavior.
   * @param {import('electron').BrowserWindow} overlayWindow
   * @param {boolean} ignore
   */
  handleSetIgnoreMouseEvents(overlayWindow, ignore) {
    if (ignore) {
      overlayWindow.setIgnoreMouseEvents(true);
      overlayWindow.blur();
    } else {
      overlayWindow.setIgnoreMouseEvents(false);
    }
  }

  /**
   * Prints a concise backend status diagnostics report on startup.
   * @param {import('electron').App} app
   */
  printDiagnosticsReport(app) {
    const isDev = !app.isPackaged || process.env.PARALINE_DEBUG_BACKEND === "1";
    if (!isDev) return;

    const fs = require("fs");
    const path = require("path");

    // Session Type
    let session = "Unknown";
    if (process.env.WAYLAND_DISPLAY || process.env.XDG_SESSION_TYPE === "wayland") {
      session = "Wayland";
    } else if (process.env.DISPLAY || process.env.XDG_SESSION_TYPE === "x11") {
      session = "X11";
    }

    // Electron Ozone
    let ozone = "default (auto)";
    if (app.commandLine.hasSwitch("ozone-platform")) {
      ozone = app.commandLine.getSwitchValue("ozone-platform");
    }

    // Window options
    const options = this.getOverlayWindowOptions({});
    const windowType = options.type || "window";
    const skipTaskbar = options.skipTaskbar ? "enabled" : "disabled";

    // GNOME Extension detection
    let extensionDetected = "not detected";
    try {
      const home = app.getPath("home");
      const extensionDir1 = path.join(home, ".local/share/gnome-shell/extensions/paraline-companion@samxop123.github.com");
      const extensionDir2 = path.join(home, ".local/share/gnome-shell/extensions/paraline-companion-v2@samxop123.github.com");
      if (fs.existsSync(extensionDir1) || fs.existsSync(extensionDir2)) {
        extensionDetected = "detected";
      }
    } catch {}

    console.log(`
==============================
Paraline Linux Backend
==============================
Session: ${session}
Backend: ${this.getName() === "x11" ? "XWayland" : "Native Wayland"}
Electron Ozone: ${ozone}
Window Type: ${windowType}
Skip Taskbar: ${skipTaskbar}
Always On Top: enabled
Click Through: enabled
GNOME Extension: ${extensionDetected}
==============================
`);
  }
}

module.exports = LinuxBackend;
