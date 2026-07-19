const LinuxBackend = require("./base");

class WaylandBackend extends LinuxBackend {
  getName() {
    return "wayland";
  }

  setupCommandLine(app) {
    console.log("[Paraline Backend] Configuring command line for Native Wayland");
    app.commandLine.appendSwitch("enable-transparent-visuals");
    app.commandLine.appendSwitch("ozone-platform", "wayland");
    app.commandLine.appendSwitch("enable-features", "WaylandWindowDecorations");
  }

  getOverlayWindowOptions(display) {
    // Under native Wayland, skipTaskbar is passed to Electron options,
    // though the compositor (Mutter) requires client-side metadata or extension assistance.
    return {
      skipTaskbar: true,
      focusable: false
    };
  }

  applyOverlayWindowDisplayState(overlayWindow, display) {
    super.applyOverlayWindowDisplayState(overlayWindow, display);

    console.log("[Paraline Backend Wayland] Applying window display states");
    // Under native Wayland, these calls are backed by the companion GNOME Shell extension
    // which intercepts the window mapping and enforces alwaysOnTop / stickiness.
    overlayWindow.setAlwaysOnTop(true, "screen-saver");
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    overlayWindow.setIgnoreMouseEvents(true);
  }
}

module.exports = WaylandBackend;
