const LinuxBackend = require("./base");

class X11Backend extends LinuxBackend {
  getName() {
    return "x11";
  }

  setupCommandLine(app) {
    console.log("[Paraline Backend] Configuring command line for X11/XWayland");
    app.commandLine.appendSwitch("enable-transparent-visuals");
    app.commandLine.appendSwitch("ozone-platform", "x11");
    // Disable the GPU sandbox to prevent SIGSEGV (exit code 139) under XWayland
    app.commandLine.appendSwitch("disable-gpu-sandbox");
  }

  getOverlayWindowOptions(display) {
    return {
      type: "utility",
      skipTaskbar: true,
      focusable: false
    };
  }

  applyOverlayWindowDisplayState(overlayWindow, display) {
    super.applyOverlayWindowDisplayState(overlayWindow, display);

    console.log("[Paraline Backend X11] Applying window display states");
    overlayWindow.setAlwaysOnTop(true, "screen-saver");
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    overlayWindow.setIgnoreMouseEvents(true);
  }
}

module.exports = X11Backend;
