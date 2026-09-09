# Paraline 2.5.0

Paraline 2.5.0 introduces automatic audio output hot-swapping to eliminate capture freezing, complete landing page performance and smoothness optimizations for standard laptops, and a real-time audio activity dock in Settings.

## Highlights

- **Seamless Audio Output Hot-Swapping (Critical Fix)**: Resolved an issue where connecting or disconnecting Bluetooth headphones caused visualizers to freeze while falsely indicating "Live". The C# WASAPI loopback engine now tracks the default audio endpoint, automatically rebinding capture streams within milliseconds without dropping beats or requiring a restart.
- **Full Landing Page Smoothness Overhaul**: Optimized the website to run at 60/120+ FPS on standard laptops with zero visual quality loss. Eliminated 60fps layout thrashing (`getBoundingClientRect()`), introduced viewport-based canvas culling via `useCanvasOptimizer`, added idle FPS throttling for unhovered cards, and moved backdrop blurs into GPU-composited layers.
- **Audio Bridge Recycling & Self-Healing**: "Reload Visualizer" now recycles the native audio bridge in tandem with the webview. The bridge also self-heals status to `Capture: Live` on valid audio frames and shields harmless background diagnostic logs from triggering false errors.
- **Real-Time Audio Activity Dock**: Added a persistent mini VU meter and peak needle to the Settings sidebar, providing live volume levels (0%–100%) and instant capture status without cluttering settings pages.
- **Expanded Automated Test Suite**: Extended test coverage across audio bridge lifecycles, stderr shielding, perceptual scaling curves, and peak decay physics (49/49 tests passing).

## What's New

### Audio Capture & Core Client Fixes
- **Dynamic Endpoint Detection**: Added `HasDefaultDeviceChanged()` in `audio-helper/Program.cs` to detect output switches (speakers ↔ Bluetooth headphones, USB DACs) and seamlessly rebind the WASAPI stream.
- **Audio Bridge `restart()` API**: Added a clean recycling method to `audioBridge.js` wired directly into `reloadVisualizer()` in `main.js`.
- **Status Desynchronization Fix**: Fixed an issue where Settings could display `Capture Error` while audio was actively streaming. Added frame auto-recovery and stderr log isolation.
- **Transient Reconnecting State**: Added explicit UI handling for `reconnecting` status with an amber indicator dot.
- **Sidebar Audio Dock & Perceptual Curve**: Added persistent mini VU monitoring with perceptual volume scaling to ensure quiet tracks register clearly.

### Web Platform & Visualizer Performance
- **Layout Thrashing Elimination**: Replaced per-frame layout queries with a unified `ResizeObserver` listener in `landing/src/lib/useCanvasOptimizer.ts`.
- **Viewport Visibility Culling**: Added an `IntersectionObserver` with a 150px pre-warm buffer that suspends off-screen canvases (0% GPU/CPU when out of view).
- **Idle Frame-Rate Throttling**: Unhovered preview cards throttle to 30 FPS, unlocking native refresh rates (60–144+ FPS) on hover.
- **Hardware-Composited Scrolling**: Replaced `background-attachment: fixed` with a GPU-composited backdrop layer and enabled `content-visibility: auto`.
- **Tab Inactivity Pausing**: Canvas loops pause automatically when the browser tab is hidden or minimized.

## Version & Artifact Details

- Version: `2.5.0`
- Installer Artifact: `Paraline-Setup-2.5.0.exe`
- Backward Compatibility: Fully compatible with existing settings, custom color presets, and schedules.

## Thank You

Thank you to our community for your feedback! Paraline 2.5.0 delivers our most resilient audio capture experience yet, alongside a lightweight, ultra-responsive web presence.
