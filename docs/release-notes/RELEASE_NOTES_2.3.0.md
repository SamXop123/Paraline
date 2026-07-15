# Paraline 2.3.0

Paraline 2.3.0 introduces a native Wallpaper Accent Color Matching Mode (automatically syncing visualizer colors with your Windows desktop wallpaper), a smooth idle-dimming Focus Mode, a high-performance revamp of the Side Braids theme, comprehensive memory leak safeguards, and critical security and bug fixes.

## Highlights

- **Wallpaper Accent Color Matching**: Dynamically extracts accent colors from your active desktop wallpaper to sync with the visualizer palette. Powered by a native Win32 C# color extractor and an Electron fallback.
- **Focus Mode Dimming**: Dim the visualizer automatically when active on your PC, restoring full opacity when idle. Features smooth CSS transitions and customizable timeout and dimming thresholds.
- **Side Braids Render Revamp**: Simplified helix rendering projection that drops array sorting and object allocation churn entirely, significantly reducing CPU/GPU usage.
- **Memory Leak Protection**: Comprehensive cleanup system to clear active animation frames, event handlers, and debug intervals on window unload.
- **Security Fixes**: Patched a tabnabbing vulnerability (`noopener,noreferrer`) in download fallbacks and introduced strict schema validation on full settings profile imports.

## What's New

### Core Client & Themes
- Added **Wallpaper Color Mode** support across all adaptive visualizer themes, including Aurora Drift, Ambient Wave, and Particle layouts.
- Integrated native Win32 wallpaper query hook inside the C# audio helper executable.
- Revamped **Side Braids** theme using 3D helix segment rendering instead of depth-sorting passes.
- Added **Clear Hotkey** UI button and Backspace/Delete keyboard mapping to allow clearing global shortcuts.
- Replaced thread-blocking OS-level alert/confirm dialogs in Electron settings with dark-themed inline toasts and modal overlays.

### Robustness & Safety
- **Animation Clock Recovery**: Fixed a bug where hiding the visualizer for a period caused animations to jump forward abruptly upon unhiding.
- **Backup Profile Name Validation**: Fixed an issue where importing a settings backup JSON with invalid profile names bypassed schema validation rules.
- **Focus Mode & Theme Automation Interval Clamping**: Clamped input boundaries and parsed numeric strings in settings stores.
- **Resource Lifecycle Handling**: Cleared active Focus Mode and Theme Automation interval timers during the app quit sequence.

### Developer Experience
- Added unit tests for Focus Mode and Theme Automation parsing/sanitization in `settingsStore.test.js`.
- Fixed the Octokit API commentary bugs inside the GitHub auto-reply pull request action.

## Notes

- Installer artifact name: `Paraline-Setup-2.3.0.exe`
- Backward compatibility: Automatically migrates user configuration schemas and custom profile states.

## Thank You

A huge thank you to all the open-source contributors and developers who worked on this release under GSSoC'26! Version 2.3.0 significantly elevates the customization and reliability of Paraline.
