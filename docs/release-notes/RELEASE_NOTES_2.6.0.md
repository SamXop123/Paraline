# Paraline 2.6.0

Paraline 2.6.0 introduces the **Synthwave Horizon** retro visualizer theme, the **Dual Theme Blending Engine (Beta)**, isolated audio response curves per layer, per-layer opacity controls, and interactive web showcases.

## Highlights

- **New Theme: Synthwave Horizon**: An iconic 80s outrun perspective wireframe grid rolling infinitely forward along display edges, featuring a segmented retro neon sun, audio-reactive terrain undulation, transient neon shockwaves, and starlight dust.
- **Dual Theme Blending Engine (Beta)**: Stack and blend two completely independent visualizer themes simultaneously on your desktop (e.g. crisp foreground borders or wireframes overlaid on top of deep cosmic aurora waves).
- **Secondary Layer Opacity & Sensitivity Isolation**: Resolved layer interference where sensitivity or decay rates were cross-contaminating. Each layer now features its own isolated smoothing physics (`primarySmoothedLevel` and `secondarySmoothedLevel`).
- **Settings Client Integration**: Added intuitive controls in Settings under Theme & Visual Customization to enable Dual Mode, select a secondary theme, and adjust secondary layer opacity via a live slider.
- **Web Landing Showcase**: Added a live interactive Dual Theme blending showcase to the Settings page (`/settings`) and added Synthwave Horizon with real-time 60fps canvas previews to the theme showcase.
- **Comprehensive Test Coverage**: Added test coverage for Dual Theme and Synthwave Horizon sanitization, clamping, and default configurations (51/51 unit tests passing).

## What's New

### Dual Theme Engine & Core Client
- **Two-Pass Visualizer Compositing**: Enabled secondary theme canvas rendering within the transparent overlay window without affecting primary theme geometry.
- **Isolated Audio Smoothing**: Separated primary and secondary audio response curves in `renderer.js` so sensitivity settings for themes like Ambient Wave remain accurate when running in dual mode.
- **Secondary Opacity Calibration**: Added seamless opacity modulation for secondary themes with custom clamping and persistent storage in `settingsStore.js`.
- **Theme Guardrails**: Prevented identical primary and secondary selections and added automatic fallback handling.

### Landing Page & Distribution
- **Interactive Dual Theme Showcase**: Integrated interactive dual-layer canvas preview featuring Aurora Drift and Pulse Lines into the Settings Showcase page (`/settings`).
- **Direct Installer Integration**: Added `Paraline-Setup-2.6.0.exe` download routing and synced package versions across the entire client and website workspace.

## Version & Artifact Details

- Version: `2.6.0`
- Installer Artifact: `Paraline-Setup-2.6.0.exe`
- Target Platform: Windows 10/11 (64-bit)
- Backward Compatibility: 100% backward compatible with existing theme profiles, shortcuts, and schedule preferences.
