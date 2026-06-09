# Theme Development Guide

Use this guide when you want to add a new visualizer theme to Paraline. A theme is a small JavaScript module that draws one visual effect on the shared canvas and reacts to the current audio level plus the user's saved settings.

## Overview

Paraline themes live in the `themes/` directory. Each file registers one object on `window`, and `renderer.js` reads that object when the app starts. On every animation frame, the renderer chooses the active theme and calls its draw function with the current canvas, audio data, timing values, performance mode, and the saved settings for that theme.

The settings come from `settingsStore.js`, are updated through `settings.js` and the Electron main process, then arrive in `renderer.js` as part of `visualizerState`. The draw function should treat those settings as read-only input.

## Theme Architecture

Each theme follows the same lifecycle:

1. **Load:** `index.html` includes the theme file after `themes/shared.js`.
2. **Register:** The theme attaches its public functions to a unique `window.Paraline...` object.
3. **Import:** `renderer.js` destructures those functions from the global object.
4. **Select:** The current `selectedTheme` decides which draw function runs.
5. **Draw:** The draw function receives an options payload and renders one frame.
6. **Update:** When the user changes settings, the renderer receives the new values and passes them into the next frame.

### File Structure

Themes are located in the `themes/` directory. A typical theme file, such as `themes/myNewTheme.js`, is wrapped in an Immediately Invoked Function Expression (IIFE). That keeps helper functions private while still exposing the draw function that the renderer needs.

## Step-by-Step Implementation

### 1. Create the Theme File

Create a new file in `themes/` named after your theme, for example `myNewTheme.js`. Use camelCase for the file name because theme IDs in the app follow that style.

### 2. Import Shared Utilities

Use `window.ParalineShared` for common math, color, glow, shadow, and performance helpers. Import only the helpers your theme actually uses.

```javascript
const { clamp01, getGlowMultiplier, resolveAnimatedColor } = window.ParalineShared;
```

### 3. Implement the Drawing Logic

Your core function, for example `drawMyCustomTheme`, receives one `options` object. Keep all canvas work inside this function or small helpers called by this function.

| Property | Type | Description |
| :--- | :--- | :--- |
| `context` | `CanvasRenderingContext2D` | The target 2D canvas context. |
| `width` | `number` | Current window width. |
| `height` | `number` | Current window height. |
| `time` | `number` | Accumulated animation time. |
| `smoothedLevel` | `number` | Normalized audio amplitude (0.0 to 1.0). |
| `settings` | `Object` | Theme-specific user settings. |
| `performanceMode` | `string` | Optional rendering quality mode from the app. |

Some themes receive extra timing or movement values, such as travel distance or particle state. Add those only when your effect needs persistent animation data that cannot be derived from `time`.

### 4. Register the Theme

Attach your theme's public functions to a unique property on the `window` object. Match the naming pattern used by existing themes.

```javascript
window.ParalineMyNewTheme = {
  drawMyCustomTheme
};
```

If the renderer needs helper functions for speed, direction, or animation state, export those on the same object. Keep internal drawing helpers private.

### 5. Wire the Theme Into the App

After the theme file exists, connect it in the files that already know about the available themes:

1. Add a script tag for your file in `index.html`, after `themes/shared.js`.
2. In `renderer.js`, destructure your draw function from `window.ParalineMyNewTheme`.
3. Add your theme ID to the selected-theme validation list in `renderer.js`.
4. Add a branch in the render loop that calls your draw function with the options it needs.
5. Add the theme's default settings to `DEFAULT_SETTINGS` in `settingsStore.js`.
6. Add the theme ID anywhere valid theme IDs are listed, copied, or sanitized in `settingsStore.js`, including `VALID_MAIN_THEMES`, `createDefaultSettings()`, `createThemeDefaults()`, and `sanitizeSettings()`.
7. Add a schema entry in `settings.js` if the theme has user-facing controls.
8. Add labels and menu options in `main.js` so the theme appears in the tray and reset flows.

Use an existing theme with similar behavior as the model. For example, a border-style theme should be compared with `flowBorder`, while a particle theme should be compared with `dotParticles` or `snowBubbleParticles`.

## Theme Settings

Theme settings are plain objects stored under the theme ID. If your theme ID is `myNewTheme`, the renderer expects values under `visualizerState.myNewTheme`.

Defaults belong in the `DEFAULT_SETTINGS` object in `settingsStore.js`. After adding the default object, make sure the same theme key is copied by `createDefaultSettings()` and `createThemeDefaults()`, validated in `VALID_MAIN_THEMES`, and returned from `sanitizeSettings()` through a theme-specific sanitizer. UI controls belong in the schema inside `settings.js`. The renderer merges incoming settings into `visualizerState`, then passes the active theme's settings into the draw function. Do not mutate the settings object inside the theme. If you need a derived value, calculate it locally:

```javascript
function getMyThemeThickness(settings) {
  if (settings.lineWeight === "thick") return 4;
  if (settings.lineWeight === "thin") return 1.5;
  return 2.5;
}
```

Prefer small helper functions like this for settings translation. They make the draw loop easier to scan and keep preset behavior consistent.

## Boilerplate Template

Copy and paste this skeleton to start building your theme:

```javascript
(() => {
  // 1. Destructure any shared utilities you need from the core ParalineShared library
  const {
    clamp01,
    getGlowMultiplier,
    resolveAnimatedColor
  } = window.ParalineShared;

  // 2. Define your theme-specific calculations, helpers, and color presets
  const CUSTOM_THEME_COLORS = {
    presetA: ["#00f2fe", "#4facfe"],
    presetB: ["#ff512f", "#f09819"]
  };

  /**
   * Helper function to perform localized math or drawing logic
   */
  function drawCustomShape(context, x, y, size, color) {
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  }

  /**
   * The core drawing loop of your theme.
   * This function is automatically called by renderer.js on every animation frame.
   * 
   * @param {Object} options Options payload passed by the renderer
   * @param {CanvasRenderingContext2D} options.context The target 2D canvas context
   * @param {number} options.width Current screen/window width
   * @param {number} options.height Current screen/window height
   * @param {number} options.time Accumulated animation time elapsed
   * @param {number} options.smoothedLevel Smoothed audio RMS amplitude level (0.0 to 1.0)
   * @param {Object} options.settings Current theme-specific user settings from store
   */
  function drawMyCustomTheme(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings
    } = options;

    // A. Perform canvas setup (globalAlpha, shadow Blurs, etc.)
    context.globalAlpha = 1;
    context.shadowBlur = 0;

    // B. Perform beat-reactive scaling calculations
    const amplitude = smoothedLevel * 100;
    const centerX = width / 2;
    const centerY = height / 2;

    // C. Perform drawing operations using standard canvas methods
    drawCustomShape(context, centerX, centerY, 50 + amplitude, "cyan");
  }

  // 3. Register your theme globally so renderer.js can discover and call it
  window.ParalineNewThemeTemplate = {
    drawMyCustomTheme
  };
})();
```

## Integration Checklist

Before opening a pull request, check that the new theme is fully wired:

1. The theme file is loaded by `index.html`.
2. The theme registers a unique `window.Paraline...` object.
3. `renderer.js` imports and calls the draw function.
4. `renderer.js` accepts the theme ID as a valid selected theme.
5. `settingsStore.js` defines defaults in `DEFAULT_SETTINGS`, copies the theme key into default settings, and sanitizes the theme ID/settings.
6. `settings.js` exposes any controls the theme needs.
7. `main.js` includes the theme in tray menu labels/options and reset handling.
8. The app still runs if the theme settings are missing or partially saved from an older version.
