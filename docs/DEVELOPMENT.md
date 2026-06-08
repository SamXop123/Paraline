# A Developer's Guide to Paraline

High-level setup and codebase notes for contributors and developers.

This guide provides a comprehensive overview for developers contributing to or extending Paraline. It covers:

- **Local setup instructions** — How to install dependencies and build the project from scratch
- **Complete architecture** — Understanding the full audio pipeline from Windows system audio to canvas visualization
- **Codebase organization** — Detailed breakdown of each file's responsibility and how components interact
- **Audio bridge workflow** — How the C# helper captures system audio and communicates with Electron
- **Settings & configuration** — The nested settings model supporting multiple themes with individual controls
- **Window behavior** — Overlay transparency, click-through, multi-monitor considerations
- **Performance notes** — Key optimization principles for canvas rendering and IPC messaging
- **Development workflow** — Best practices for working with Electron, IPC, and native interop
- **Future roadmap** — Planned features and suggested areas for enhancement

Use this guide when setting up a development environment, understanding how components work together, or planning new features.

---

## Stack

- **Electron** for the Windows desktop shell and transparent overlay window
- **Node.js** for the main process, tray logic, IPC, and helper orchestration
- **Vanilla HTML / CSS / JavaScript** for renderer-side visuals
- **C# / .NET 8** helper process for Windows system audio capture
- **WASAPI Loopback** for real-time audio input from the active output device
- **Next.js / React / TailwindCSS** for the `landing` product website

---

## Run Locally

### Requirements

- **Windows 10 / 11**
- **Node.js 18+**
- **.NET 8 SDK**

### Install dependencies

```bash
npm install
dotnet build .\audio-helper\Paraline.AudioBridge.csproj
```

### Start the app

```bash
npm run dev
```

You can also run:

```bash
npm start
```

### Start the Landing Page

The promotional landing website is located in the `landing` directory. To run it locally:

```bash
cd landing
npm install
npm run dev
```

### Build a Windows installer

```bash
npm run dist:win
```

This will:

1. Publish the C# audio helper for `win-x64`
2. Bundle it into the Electron app resources
3. Generate an NSIS installer in the `dist/` folder

---

## High-Level Architecture

```text
Windows System Audio
        ↓
WASAPI Loopback Capture
        ↓
C# Helper Process
        ↓
JSON over stdout
        ↓
Electron Main Process
        ↓
Renderer / Canvas Visualizer
```

### Flow

1. The C# helper captures Windows system audio.
2. It emits level data as JSON through stdout.
3. Electron reads that data through `audioBridge.js`.
4. The main process forwards audio levels and settings to the renderer.
5. `renderer.js` draws the active visualizer theme on a full-screen transparent canvas.

---

## Important Files

- `main.js`
  Electron window creation, tray menu, settings distribution, audio bridge startup.

- `renderer.js`
  Renderer orchestration, animation loop, state updates, and theme dispatch.

- `themes/shared.js`
  Shared canvas drawing helpers and reusable visual utility functions.

- `themes/ambientWave.js`
  Ambient Wave rendering and Ambient-specific sensitivity/tone logic.

- `themes/reactiveBorder.js`
  Reactive Border rendering and Reactive-specific intensity logic.

- `themes/flowBorder.js`
  Flow Border rendering and Flow-specific direction/speed logic.

- `themes/sideBars.js`
  Side Bars rendering and Side Bars-specific color styling.

- `themes/pulseLines.js`
  Pulse Lines rendering and Pulse Lines-specific mode, intensity, and color logic.

- `themes/dotParticles.js`
  Dot Particles rendering and Dot-specific density, motion, direction, and glow logic.

- `themes/rippleFlow.js`
  Ripple Flow rendering with center-origin wavefront propagation along screen edges.

- `themes/snowBubbleParticles.js`
  Snow Particles rendering with centered or full-width top-origin snowfall.

- `themes/edgeCrystals.js`
  Edge Crystals rendering with left/right edge-locked vibrating energy strokes.

- `themes/sideBraids.js`
  Side Braids rendering with intertwined glowing neon strands braiding and flowing vertically along screen edges.

- `themes/auroraDrift.js`
  Aurora Drift rendering with layered ambient aurora curtains, dynamic HSL color stop editing, real-time advanced customizable glow, wave speeds, and responsive audio decay rates.

- `preload.js`
  Safe Electron-to-renderer bridge.

- `audioBridge.js`
  Starts and monitors the C# helper, then forwards parsed audio levels to Electron.

- `settingsStore.js`
  Local persistent settings storage with theme-specific nested settings.

- `audio-helper/Program.cs`
  Native Windows audio capture using WASAPI loopback.

---

## Settings Model

The app uses one root selected theme plus nested settings per theme:

```json
{
  "selectedTheme": "ambientWave",
  "ambientWave": {
    "tone": "blue",
    "sensitivity": "medium",
    "edgeMode": "bottom",
    "glowStrength": "medium"
  },
  "reactiveBorder": {
    "colorStyle": "rainbow",
    "intensity": "medium",
    "borderThickness": "thin",
    "glowStrength": "medium"
  },
  "flowBorder": {
    "direction": "clockwise",
    "speedMode": "balanced",
    "segmentLength": "medium",
    "glowStrength": "medium",
    "colorStyle": "rainbow"
  },
  "sideBars": {
    "colorStyle": "multicolor",
    "barThickness": "thick",
    "sensitivity": "medium",
    "barDensity": "medium"
  },
  "flatRipples": {
    "mode": "sideRipples",
    "intensity": "medium",
    "colorStyle": "blue",
    "speed": "calm"
  },
  "dotParticles": {
    "density": "medium",
    "motionStyle": "balanced",
    "directionBehavior": "beatReactive",
    "glowStrength": "medium"
  },
  "rippleFlow": {
    "mode": "sideRipples",
    "intensity": "medium",
    "sensitivity": "medium",
    "colorStyle": "blue"
  },
  "snowBubbleParticles": {
    "fallArea": "middle",
    "density": "medium",
    "motionStyle": "balanced",
    "glowStrength": "medium",
    "particleSize": "medium"
  },
  "edgeCrystals": {
    "flutterStyle": "balanced",
    "density": "medium",
    "glowStrength": "medium",
    "colorStyle": "blue",
    "edgeMode": "both"
  },
  "sideBraids": {
    "colorStyle": "cyanPink",
    "braidDensity": "medium",
    "motionStyle": "balanced",
    "glowStrength": "medium",
    "braidWidth": "medium",
    "flowDirection": "topDown"
  },
  "auroraDrift": {
    "auroraStyle": "cinematic",
    "intensity": "balanced",
    "height": "medium",
    "glowStrength": "medium",
    "motionSpeed": "balanced",
    "colorPalette": "cyanViolet",
    "audioReactivity": "balanced",
    "softness": "smooth",
    "layerDensity": "balanced",
    "gradientStops": [
      { "pos": 0.0, "color": "#00e5ff" },
      { "pos": 0.35, "color": "#0077ff" },
      { "pos": 0.7, "color": "#7f00ff" },
      { "pos": 1.0, "color": "#ff007f" }
    ],
    "baseGlowRadius": 1.0,
    "peakGlowRadius": 1.0,
    "crestBrightness": 1.0,
    "bloomStrength": 1.0,
    "glowFalloff": 1.0,
    "primaryFrequency": 1.0,
    "secondaryFrequency": 1.0,
    "turbulenceComplexity": 1.0,
    "motionSmoothness": 1.0,
    "driftSpeed": 1.0,
    "bassInfluence": 1.0,
    "midInfluence": 1.0,
    "highShimmer": 1.0,
    "audioSmoothing": 1.0,
    "peakSensitivity": 1.0,
    "ribbonHeight": 1.0,
    "ribbonWidth": 1.0,
    "edgeSoftness": 1.0,
    "layerSeparation": 1.0,
    "crestSharpness": 1.0,
    "layerCount": 5,
    "backgroundHaze": 1.0,
    "foregroundHighlight": 1.0,
    "parallaxDepth": 1.0,
    "ambientOpacity": 1.0,
    "colorSaturation": 1.0,
    "atmosphericFade": 1.0,
    "edgeFeathering": 1.0
  }
}
```

This allows the tray menu to show only the active theme’s controls without losing saved settings for the other themes.

---

## Project Structure

```text
Paraline/
├── main.js
├── renderer.js
├── preload.js
├── audioBridge.js
├── settingsStore.js
├── index.html
├── styles.css
├── themes/
│   ├── shared.js
│   ├── ambientWave.js
│   ├── reactiveBorder.js
│   ├── flowBorder.js
│   ├── sideBars.js
│   ├── pulseLines.js
│   ├── dotParticles.js
│   ├── rippleFlow.js
│   ├── snowBubbleParticles.js
│   ├── edgeCrystals.js
│   └── auroraDrift.js
├── package.json
├── README.md
├── docs/
│   └── DEVELOPMENT.md
├── landing/
│   ├── src/                 # Next.js landing page application
│   └── public/              # Website assets and previews
└── audio-helper/
    ├── Program.cs
    └── Paraline.AudioBridge.csproj
```

---

## Theme System

Each visualizer theme is implemented as an isolated rendering module inside the `themes/` directory.

Themes generally:

- Receive normalized audio level data
- Read theme-specific settings
- Render onto the shared canvas context
- Manage their own animation behavior and styling

New themes should:

- Avoid excessive allocations during animation frames
- Reuse shared utilities where possible
- Keep rendering logic self-contained
- Maintain smooth frame pacing

---

## Developer Notes

- The overlay window is transparent, frameless, always-on-top, and click-through.
- Full-border themes rely on the Electron window covering the full display bounds.
- The renderer is performance-sensitive, so visual changes should stay lightweight.
- Theme-specific tray settings are handled in the main process and pushed into the renderer as one settings payload.

---

## Suggested Next Areas

- Multi-monitor support
- Additional visual presets
- Debug log cleanup once the visuals stabilize
