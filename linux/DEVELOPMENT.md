# Paraline Developer Documentation

This document explains the architecture of the Linux port, specifically detailing our window manager integration backend selection system.

## Linux Backend Selection Architecture

To support the diverse and evolving display compositor ecosystem on Linux (Wayland, X11, hybrid XWayland), Paraline implements a backend selection system. This decouples window configuration, command line platform flags, and window manager event handling from the core application logic.

The architecture is implemented under `linux/backends/`:
- **`base.js`**: The base interface class (`LinuxBackend`) defining the contract for platform backends.
- **`x11.js`**: Backend implementation for X11 / XWayland.
- **`wayland.js`**: Backend implementation for native Wayland.
- **`index.js`**: Resolves and loads the active backend at startup.

### How to Select a Backend

By default, Paraline automatically selects the **XWayland** backend. However, you can manually override this via command-line arguments or environment variables.

#### 1. CLI Override
Pass the `--backend` flag when launching the application:
```bash
# Force native Wayland
npm run start:linux -- --backend=wayland

# Force XWayland
npm run start:linux -- --backend=x11
```

#### 2. Environment Variable Override
Set the `PARALINE_LINUX_BACKEND` environment variable:
```bash
# Force native Wayland
PARALINE_LINUX_BACKEND=wayland npm run start:linux

# Force XWayland
PARALINE_LINUX_BACKEND=x11 npm run start:linux
```

---

## Why XWayland is the Default (GNOME Wayland / Mutter Constraints)

Although native Wayland offers benefits like lower latency and cleaner high-DPI scaling, the standard Wayland application protocol (`xdg-shell`) and security design constraints in GNOME's compositor (Mutter) prevent a fully functional overlay from running natively.

Here is why XWayland is the default choice for the Paraline Visualizer overlay:

### 1. Window Manager Focus & Alt-Tab Skipping
Under native Wayland, standard windows (`xdg_toplevel`) cannot request to be hidden from the taskbar or Alt-Tab switcher at the protocol level.
In an attempt to work around this, our companion GNOME Shell extension tries to dynamically set `skip_taskbar = true` on the `MetaWindow` in the compositor thread. However, under native Wayland, Mutter flags `skip-taskbar` as a read-only GObject property (`Error: Property MetaWindowWayland.skip-taskbar is not writable`) to prevent third-party applications from hiding themselves.
Under XWayland, the application uses the standard X11 property `_NET_WM_STATE_SKIP_TASKBAR`, which Mutter successfully reads and respects.

### 2. Transparent Input Regions (Click-Through)
To allow clicking through the visualizer overlay, we clear the window's input shape/region.
Under native Wayland, Chromium's Ozone-Wayland platform handles input regions asynchronously. Toggling mouse ignore requires active frame commits (renderer redraws) and often hits timing bugs in Mutter, causing mouse pointer grab states to get stuck.
Under XWayland, Chromium utilizes the mature X11 Shape extension (`XShape`), which works instantly and reliably.

---

## Developing for Native Wayland

We preserve the native Wayland backend in the codebase so that future contributors can continue testing and refining it as Wayland compositor protocols and Chromium's Ozone implementation mature.

To contribute to native Wayland support:
1. Run with `PARALINE_LINUX_BACKEND=wayland`.
2. Inspect the companion extension logs using `journalctl -f -o cat /usr/bin/gnome-shell` or inside your nested testing compositor logs.
