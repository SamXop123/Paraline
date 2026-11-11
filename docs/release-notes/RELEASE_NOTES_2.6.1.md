# Paraline 2.6.1 — Persistent Layering & Beat Precision Patch

Paraline 2.6.1 brings critical desktop overlay layering robustness, a user-configurable Always-on-Top mode, granular beat-reactive physics tuning for the Dot Particles theme, and modernized dependencies.

## Highlights

- **Always on Top Robustness & Z-Order Auto-Recovery**: Fixed an edge-case where the transparent visualizer overlay could lose top-level z-order and fall behind other active applications after long runtimes, system sleep/wake, or screen lock/unlock. Paraline now auto-reasserts top-most z-order on system resume, display changes, and wake cycles.
- **Always on Top Setting & Tray Integration**: Added a persistent `alwaysOnTop` toggle in the Settings window under General, as well as a quick-toggle checkbox directly inside the System Tray Context Menu.
- **Granular Beat-Reactive Controls for Dot Particles**: Added dedicated fine-tuning sliders in the **Advanced Settings** tab for the Dot Particles theme (dynamically available when Direction Behavior is set to *Beat Reactive*):
  - **Beat Trigger Sensitivity**: Controls the audio surge threshold required to trigger direction reversal (from subtle beats to heavy drops).
  - **Reverse Kick Strength**: Controls the momentum surge and velocity kick particles experience upon reversing direction.
  - **Reversal Switch Cooldown**: Sets the minimum cooldown window between consecutive reversals (0.2s to 3.0s, defaulting to 1.6s).
- **Toolchain & Dependency Modernization**: Upgraded `electron-builder` to 26.18.0 and refreshed core ecosystem dependencies.
- **Comprehensive Test Coverage**: Expanded test suite coverage to 53/53 passing unit tests across audio bridges, settings store, and visualizer engines.

## What's Changed

### Desktop Client & Overlay Engine
- Event-driven Z-order recovery hooked to `powerMonitor.on('resume')`, `powerMonitor.on('unlock-screen')`, and `screen.on('display-metrics-changed')`.
- Dynamic synchronization between main process, system tray context menu, settings store, and UI window for the `alwaysOnTop` toggle.
- Extended `themes/dotParticles.js` direction controller with custom sensitivity factor, customizable reversal impulse multiplier, and adaptive cooldown timers.
- Integrated `#dot-particles-beat-controls` panel into `settings.html` and wired reactive visibility and state management in `settings.js`.

### Distribution & Platform
- Updated project and website workspace package targets to `2.6.1`.
- Direct installer routing for `Paraline-Setup-2.6.1.exe`.

## Version & Artifact Details

- Version: `2.6.1`
- Installer Artifact: `Paraline-Setup-2.6.1.exe`
- Target Platform: Windows 10/11 (64-bit)
- Backward Compatibility: 100% backward compatible with existing theme profiles and saved configurations.
