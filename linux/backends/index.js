const X11Backend = require("./x11");
const WaylandBackend = require("./wayland");

/**
 * Resolves the appropriate Linux backend based on CLI flags, environment variables, or defaults.
 * @returns {import('./base')}
 */
function resolveBackend() {
  // 1. Check command line arguments
  // Electron command line arguments are populated in process.argv
  const backendArg = process.argv.find(arg => arg.startsWith("--backend="));
  if (backendArg) {
    const selected = backendArg.split("=")[1].toLowerCase();
    if (selected === "wayland") {
      console.log("[Paraline Backend Loader] Selection: Wayland (via --backend CLI flag)");
      return new WaylandBackend();
    }
    if (selected === "x11" || selected === "xwayland") {
      console.log("[Paraline Backend Loader] Selection: XWayland (via --backend CLI flag)");
      return new X11Backend();
    }
  }

  // 2. Check environment variables
  const backendEnv = (process.env.PARALINE_LINUX_BACKEND || "").toLowerCase();
  if (backendEnv === "wayland") {
    console.log("[Paraline Backend Loader] Selection: Wayland (via PARALINE_LINUX_BACKEND env var)");
    return new WaylandBackend();
  }
  if (backendEnv === "x11" || backendEnv === "xwayland") {
    console.log("[Paraline Backend Loader] Selection: XWayland (via PARALINE_LINUX_BACKEND env var)");
    return new X11Backend();
  }

  // 3. Fallback default (XWayland provides the correct desktop overlay behavior)
  console.log("[Paraline Backend Loader] Selection: XWayland (Default fallback for optimal overlay behaviors)");
  return new X11Backend();
}

module.exports = resolveBackend();
