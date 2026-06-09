# Paraline 2.0.0

Paraline 2.0.0 is a milestone release introducing a dedicated Settings Dashboard, comprehensive automation controls, custom framerate options, adaptive Windows accent color sync, custom preset persistence, and custom native branding.

## Highlights

- **Dedicated Settings Dashboard UI**: A fully featured, tabbed Electron settings panel replacing old inline overlays.
- **Dynamic Performance & Control**: Native V-Sync customization, custom rendering target limits (FPS caps), and detailed diagnostics.
- **Time-Based Automation Agent**: Automatically triggers light/dark themes, custom presets, or accent sync configurations based on the time of day.
- **Windows Adaptive Accent Color Sync**: Instantly extract and display active Windows accent/theme colors in real-time.
- **Advanced Custom Color Persistence**: Saved custom colors persist across sessions and fallback cleanly to user selections instead of standard black/defaults.
- **Branded Native Window Icons**: Completely replaced default Electron title bar and alt-tab logos with crisp, high-resolution native Paraline icons.

## What's New

### Settings UI & Dashboard
- Structured tabs for General, Themes, Customization, Performance, and Advanced settings.
- Interactive toggle controls, HSL color sliders, and theme selection dropdowns.
- Detailed troubleshooting section displaying audio bridge logs and device listings.

### Performance & Framing
- Granular FPS limit selector (30 FPS, 60 FPS, 120 FPS, 144 FPS, or uncapped).
- Easy toggle for V-Sync rendering controls.
- Optimized CPU utilization for lower overhead while operating in the background.

### Personalization & Themes
- Color Mode support (Sync to Windows theme, manual dark/light theme).
- Advanced custom color mode fallback remembers last-used color selections.
- Native title bar integration with official Paraline icon formats.

## Notes

- Installer artifact name: `Paraline-Setup-2.0.0.exe`
- Backward compatibility: Automatically migrates previous config settings to the new 2.0.0 schema.

## Thank You

A massive thank you to our users and contributors! Version 2.0.0 marks the transition of Paraline into a highly mature, feature-rich audio visualization studio.
