# Paraline Linux Port Architecture (Fedora GNOME)

This document outlines the architectural plan for porting the Paraline desktop audio visualizer to Linux Fedora (GNOME Shell, Wayland/XWayland). 

---

## 1. Core Principles
* **Code Isolation**: All Linux-specific main process and audio capture logic will live exclusively in the `linux/` directory. The existing Windows main process and audio capture scripts will remain completely untouched.
* **Shared Assets**: The visual frontend (`index.html`, `renderer.js`, `themes/`, `styles.css`) will be shared verbatim between Windows and Linux.
* **Feature Simplification**: The Linux version will run in a "raw" standalone mode. The following features present in the Windows version are explicitly **excluded** to keep the Linux port lightweight and standalone:
  * No System Tray Icon or Tray Access.
  * No Performance Mode.
  * No Focus Mode (System idle triggers).
  * No Theme Automation Mode.
  * No Color Mode configurations.
  * No Launch on Startup (System startup integration).

---

## 2. Directory Layout

The workspace will be organized as follows:

```
Paraline/
├── linux/
│   ├── main.js             # Standalone Linux Electron main process
│   ├── preload.js          # Linux-specific preload (mocks Windows-only APIs)
│   ├── audioBridge.js      # Linux PulseAudio/PipeWire audio capture
│   └── extension/          # GNOME Shell Companion Extension for Wayland overlays
│       ├── metadata.json   # GNOME Extension configuration
│       └── extension.js    # GNOME Extension compositor manipulation script
├── index.html              # Shared UI HTML
├── renderer.js             # Shared Renderer JS (Untouched)
├── themes/                 # Shared Visual Themes folder
├── main.js                 # Untouched Windows main process
└── package.json            # Shared package config (defines Electron-builder Linux targets)
```

---

## 3. Component Details

### A. Linux Main Process (`linux/main.js`)
* Initializes a single `BrowserWindow` targeting the shared `index.html`.
* Configures the window to start hidden and non-focusable to avoid rendering glitches on boot.
* Bypasses all tray creation, profile configurations, and automation monitors.
* Spawns the Linux Audio Bridge immediately on startup.

### B. Linux Preload Interface (`linux/preload.js`)
The shared `renderer.js` relies on Electron IPC bridges defined in `preload.js` (e.g. settings loading, profile lookups, focus triggers). To keep `renderer.js` completely unmodified, the Linux preload will expose the same namespaces (`window.visualizerSettings`, `window.paralineApp`) but mock their returns:
* `visualizerSettings.get()`: Resolves a static, default settings payload immediately.
* `visualizerSettings.onChange()`: Stub function that performs no operations.
* `paralineApp.getThemeProfiles()`: Resolves an empty profiles object.
* This interface mocking ensures `renderer.js` loads and behaves normally with default visual properties.

### C. Linux Audio Bridge (`linux/audioBridge.js`)
* Checks system compatibility for PulseAudio/PipeWire.
* Spawns system utilities like `parec` or `pw-record` as a child process.
* Intercepts raw PCM audio stream from `stdout`, calculates the volume levels (RMS), and dispatches the data to the Electron renderer just like the Windows helper.
* Eliminates the need to compile or distribute helper binaries on Linux.

### D. Companion GNOME Extension (`linux/extension/`)
To bypass GNOME's strict Wayland display security protocols (which block standard overlays from ignoring mouse clicks or locking `alwaysOnTop` above other windows):
* A mini GNOME Extension will be provided.
* When active, the extension listens for the Paraline window ID inside the compositor.
* It directly modifies compositor (Mutter/Clutter) input regions to enforce true background click-through behavior, workspace persistence, and topmost layering under Wayland.

---

## 4. Packaging and Build Targets
Using `electron-builder`, the Linux target configurations inside `package.json` will be updated to output:
* **AppImage**: A single-file, portable application containing all modules that runs on Fedora immediately.
* **RPM**: The native package format compatible with Fedora's `dnf` package manager.
