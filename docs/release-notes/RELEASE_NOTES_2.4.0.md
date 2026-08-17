# Paraline 2.4.0

Paraline 2.4.0 introduces real-time audio-reactive color modulation (dynamic beat and amplitude sync across visualizer themes), a standalone high-performance canvas rendering loop engine with automatic hidden-state pausing, adaptive WASAPI loopback buffer sizing in the C# audio helper, non-blocking settings corruption recovery, accessible landing theme galleries, and major dependency upgrades.

## Highlights

- **Brand Identity & Logo Refresh**: Integrated the new Paraline icon across the entire user experience — including the Next.js marketing site, system tray, Settings panel sidebar, About screen, and Onboarding guide.
- **Audio-Reactive Color Modulation**: Visualizer color hues shift dynamically in real-time based on system audio beat detection and amplitude intensity. Includes time-scale modulation and single-hue caching optimizations.
- **Smart Canvas Rendering Engine (`rendererLoop.js`)**: Extracted standalone render loop manager that automatically pauses visualizer canvas calculations when hidden or minimized, conserving CPU and GPU usage.
- **Adaptive WASAPI Audio Buffering**: Upgraded C# WASAPI audio capture helper to auto-scale loopback stream buffers to hardware audio device capabilities.
- **Non-Blocking Settings Self-Healing**: Corrupted configuration file alerts now display non-blocking notices, ensuring visualizer stability even if a settings file is damaged.
- **Accessibility & UX Upgrades**: Keyboard-accessible Theme Comparison Modal, forced-colors focus rings for High Contrast Mode, and non-blocking deferred script loading.

## What's New

### Core Client & Audio Engine
- **Audio Beat & Amplitude Sync**: Added beat-synchronous color modulation across themes (Dot Particles, Flow Border, Reactive Border).
- **Frame-Rate Independence**: Optimized ThemeAgent calculations to maintain consistent animations on 120Hz, 144Hz, and 240Hz monitors.
- **Audio Bridge Retry Teardowns**: Fixed orphan timer leaks in `audioBridge.js` on app stop and resolved delayed exit process locks.
- **Selective Wallpaper Polling**: Wallpaper polling in the C# audio helper is restricted strictly to Adaptive Theme mode.
- **Shortcut & Automation Sanitization**: Added strict normalization for `None` shortcut values and theme automation state validation.

### Landing Page & UI
- **Accessible Theme Gallery**: Keyboard-navigable theme selection cards and accessible comparison modal.
- **Forced-Colors Focus Outlines**: Enhanced high-contrast accessibility support.
- **Script Deferral**: Added `defer` loading attributes to eliminate render-blocking scripts across client views.

### Infrastructure & Dependencies
- Upgraded **Electron** to `v43.2.0`.
- Upgraded **Next.js** to `v16.2.12`, **React** to `v19.2.8`, and **Framer Motion** to `v12.43.0`.
- Added **Dependabot** configuration (`.github/dependabot.yml`) for automated dependency monitoring.

## Notes

- Installer artifact name: `Paraline-Setup-2.4.0.exe`
- Backward compatibility: Automatically migrates user configuration schemas and custom profile states.

## Thank You

A huge thank you to all our users, testers, and contributors! Version 2.4.0 makes Paraline smoother, more responsive, and more reliable than ever.
