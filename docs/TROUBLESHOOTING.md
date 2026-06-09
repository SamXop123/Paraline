# Paraline Troubleshooting Guide

A reference for contributors and users working through common setup and runtime issues.

This guide covers:

- **C# compilation problems** — Missing SDK, build failures, and NuGet issues
- **WASAPI audio problems** — Default device setup, zero audio levels, Bluetooth quirks
- **Helper process failures** — Missing executable, antivirus interference, permission issues
- **IPC / audio bridge errors** — Broken communication, invalid JSON, and child process crashes
- **Unsupported platform behavior** — Why audio is simulated on Linux and macOS
- **Quick diagnostic checklist** — A concise list to work through before opening an issue

Use this guide when audio is not working, the visualizer is not reacting, or the app fails to start correctly.

---

## 1. C# Compilation Problems

The `audio-helper/Paraline.AudioBridge.csproj` project must be compiled before Paraline can capture real system audio. If this step is skipped or fails, Paraline will fall back to simulated audio automatically.

### Confirm the .NET SDK is installed

Run the following in a terminal:

```bash
dotnet --version
```

The output should show version `8.0.0` or higher. If the command is not found or reports a version below 8, install the .NET 8 SDK from [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download).

### Build the audio helper

From the root of the repository:

```bash
dotnet build .\audio-helper\Paraline.AudioBridge.csproj
```

Or use the npm script shortcut:

```bash
npm run build:helper
```

A successful build will produce `Paraline.AudioBridge.exe` in a subdirectory of `audio-helper/bin/`.

### NuGet restore issues

If the build reports missing packages or network errors, try restoring dependencies explicitly:

```bash
dotnet restore .\audio-helper\Paraline.AudioBridge.csproj
```

If you are working offline or behind a corporate proxy, ensure that `nuget.org` is reachable, or configure a local NuGet feed.

### MSBuild errors

If you see MSBuild-related errors or a message about missing workloads, verify your .NET installation is complete:

```bash
dotnet workload list
```

For a Windows desktop application, no additional workloads beyond the base .NET SDK are required. If something appears broken, repair or reinstall the SDK.

### Clean and rebuild

If the project was in a partially built state, clean it first and then rebuild:

```bash
dotnet clean .\audio-helper\Paraline.AudioBridge.csproj
dotnet build .\audio-helper\Paraline.AudioBridge.csproj
```

### Visual Studio workloads

If you prefer building through Visual Studio rather than the CLI, open `Paraline.sln` and ensure the following workload is installed:

- **.NET desktop development**

You can verify and install workloads through the Visual Studio Installer.

---

## 2. WASAPI Loopback Audio Problems

Paraline captures audio using **Windows WASAPI Loopback**, which records whatever is currently playing through your active output device. No microphone is used and no external audio source is required.

### How Paraline reads audio

The C# helper (`audio-helper/Program.cs`) connects to the Windows default multimedia render endpoint — the same device that plays sound through your speakers or headphones. It reads that stream and computes an RMS amplitude level between `0.0` and `1.0`, which is forwarded to Electron once every 33 milliseconds.

### The visualizer is not reacting to audio

1. **Check that audio is actually playing.** Open a browser, music player, or any application and confirm that sound is coming through your speakers or headphones before launching Paraline.

2. **Confirm your default playback device.** Open Windows Sound Settings:

   - Right-click the speaker icon in the system tray → **Open Sound settings**
   - Under **Output**, confirm the correct device is selected as the default

   Paraline captures the default render endpoint. If the wrong device is set as default, the helper will capture audio from that device instead.

3. **Verify audio is reaching Windows.** Open the Windows Volume Mixer:

   - Right-click the speaker icon → **Open Volume mixer**
   - Confirm that volume bars are moving when audio plays

   If the bars are not moving, the issue is upstream of Paraline.

### Bluetooth audio devices

Bluetooth headphones and speakers can cause complications with WASAPI Loopback:

- Some Bluetooth audio drivers switch the device into a lower-quality profile when a loopback capture client connects. This can temporarily affect audio quality.
- If the audio level appears stuck at zero, try switching to wired speakers or headphones temporarily to confirm that the helper is working correctly.
- After connecting or disconnecting a Bluetooth device, restart Paraline so the helper reconnects to the updated default endpoint.

### Audio levels remain at zero

If the visualizer appears frozen or barely reacting even when audio is playing:

1. Confirm the audio helper built successfully and that `Paraline.AudioBridge.exe` exists (see Section 3).
2. Open Windows Sound Settings and verify the correct output device is set as default.
3. Make sure the application playing audio is not muted in the Windows Volume Mixer.
4. Try restarting Paraline after changing any audio device settings.

---

## 3. Helper Process Exited / Not Found

Paraline relies on `Paraline.AudioBridge.exe` running as a background child process. If this executable is missing or crashes, the tray will show **Audio Capture: Fallback** and a system notification will appear.

### Missing executable

The helper binary is not included in the repository. It must be compiled locally before running Paraline in development.

To build it:

```bash
dotnet build .\audio-helper\Paraline.AudioBridge.csproj
```

After a successful build, the executable will be located at a path similar to:

```
audio-helper\bin\Debug\net8.0-windows\Paraline.AudioBridge.exe
```

For a production build, `npm run build:helper` publishes a self-contained binary to:

```
build\audio-helper\Paraline.AudioBridge.exe
```

`audioBridge.js` searches for the executable in several known locations automatically. See the `findHelperBinary()` function in `audioBridge.js` for the full list of candidate paths.

### Build failure preventing executable creation

If `dotnet build` reports errors, resolve those first (see Section 1). The executable will not be created from a failed build.

### Antivirus interference

Some antivirus or endpoint security tools will quarantine or block unsigned executables. If the helper disappears after being built, check your antivirus quarantine log and add an exception for the `audio-helper/bin/` and `build/audio-helper/` directories.

### Permission issues

If the helper fails to start with an access-denied error:

- Make sure the build output directory is not read-only.
- On some systems, executables downloaded or copied from a network share may be blocked by Windows. Right-click `Paraline.AudioBridge.exe` → **Properties** → click **Unblock** if this option is present.

### Running the helper manually for diagnostics

You can launch the helper directly from a terminal to verify it works independently of Electron:

```bash
.\audio-helper\bin\Debug\net8.0-windows\Paraline.AudioBridge.exe
```

When working correctly with audio playing, the expected output is a stream of JSON lines like:

```json
{"type":"level","value":0.3421}
{"type":"level","value":0.4108}
{"type":"level","value":0.2893}
```

- `type` is always `"level"`.
- `value` is a floating-point RMS amplitude between `0.0` (silence) and `1.0` (full volume).

If you see no output, audio may not be playing. If the process exits immediately with an error message on stderr, the WASAPI device may be unavailable or the system may lack a working audio output device.

---

## 4. IPC / Audio Bridge Errors

The communication between the C# helper and Electron follows a simple contract: the helper writes JSON to stdout, and `audioBridge.js` in the Electron main process reads and parses it.

### How the bridge works

```text
Paraline.AudioBridge.exe
        ↓  stdout (one JSON line per frame, ~30 per second)
audioBridge.js (Node.js child_process.spawn)
        ↓  parsed numeric level
main.js (Electron)
        ↓  IPC: "audio-level" event
renderer.js (Chromium canvas loop)
```

The bridge is created in `audioBridge.js` using `child_process.spawn` with `stdio: ['ignore', 'pipe', 'pipe']`. Lines from stdout are accumulated in a string buffer, split on newlines, and parsed individually.

### Diagnosing broken communication

If the tray shows **Audio Capture: Fallback** and a notification appears:

1. Run the helper manually and confirm it produces valid JSON output (see Section 3).
2. Restart Paraline. The bridge attempts to connect on startup and does not retry automatically.
3. Check the Electron developer tools console for any bridge-related error messages. Open the overlay window DevTools from the terminal if needed:

   ```bash
   npm run dev
   ```

   Then use the Electron DevTools keyboard shortcut to inspect the renderer.

### Invalid JSON output

If the helper sends output that cannot be parsed as JSON, `audioBridge.js` catches the parse error and switches to simulated audio mode. This could happen if:

- The C# process prints an unexpected error message before the JSON output begins.
- A .NET runtime error is written to stdout instead of stderr.

To confirm what the helper is actually outputting, run it manually as described in Section 3 and inspect the raw output.

### Child process crashes

If the helper starts but exits unexpectedly, the `exit` event in `audioBridge.js` triggers a switch to simulated audio and shows the exit code in the tray notification.

Common reasons for an early exit:

- No audio output device is available on the system.
- The WASAPI session was interrupted (for example, a device was disconnected mid-session).
- An unhandled exception occurred in the C# process.

To recover:

1. Ensure an audio output device is connected and set as the Windows default.
2. Restart Paraline from the tray (**Reload Visualizer** or **Quit** then relaunch).

### Rebuild and restart

If you suspect the helper binary is out of date or corrupt, rebuild and restart:

```bash
dotnet clean .\audio-helper\Paraline.AudioBridge.csproj
dotnet build .\audio-helper\Paraline.AudioBridge.csproj
npm run dev
```

---

## 5. Unsupported Platform Behavior

Paraline is a **Windows-only application**. WASAPI Loopback is a Windows-specific audio API and is not available on Linux or macOS.

### Running on Linux or macOS

If you launch Paraline on a non-Windows platform, the following behavior is expected:

- `audioBridge.js` will attempt to find and start `Paraline.AudioBridge.exe`.
- The executable will not be found (it cannot be compiled or run on non-Windows systems).
- The bridge will immediately enter **simulated audio mode**.
- The visualizer will still run and animate using a mathematically generated signal.
- The tray will show **Audio Capture: Fallback**.
- A system notification may appear explaining that the helper was not found.

This is intentional. The simulated mode exists precisely to keep the app functional across platforms without real audio capture, and is also used as a fallback on Windows when the helper is unavailable.

No action is needed. If you are developing on Linux or macOS and only need to work on the renderer, themes, or settings UI, the simulated signal is sufficient to preview visual behavior.

---

## 6. Quick Diagnostic Checklist

Work through the following steps before opening an issue. Include the results when reporting a bug.

- [ ] **Is .NET 8 SDK installed?**
  Run `dotnet --version` and confirm the output is `8.0.x` or higher.

- [ ] **Has the audio helper been built?**
  Run `dotnet build .\audio-helper\Paraline.AudioBridge.csproj` and confirm it exits with no errors.

- [ ] **Does `Paraline.AudioBridge.exe` exist?**
  Check `audio-helper\bin\Debug\net8.0-windows\` or `build\audio-helper\` depending on how it was built.

- [ ] **Does the helper produce output when run manually?**
  Run the executable directly and confirm it prints `{"type":"level","value":...}` lines when audio is playing.

- [ ] **Is audio actually playing on the system?**
  Open the Windows Volume Mixer and confirm that level bars are active.

- [ ] **Is the correct output device set as the Windows default?**
  Open Sound Settings → Output and confirm the right device is selected.

- [ ] **Has antivirus been checked?**
  If the executable disappeared after building, check the antivirus quarantine log.

- [ ] **What does the tray show?**
  Note whether it shows **Audio Capture: Live** or **Audio Capture: Fallback**.

- [ ] **What platform and OS version are you running?**
  Real audio capture requires Windows 10 or Windows 11.

- [ ] **What version of Paraline are you running?**
  The version is shown in the tray tooltip and the **Open Settings** panel header.

---

For local setup instructions, see [docs/DEVELOPMENT.md](DEVELOPMENT.md).
For a full architecture reference, see [docs/ARCHITECTURE.md](ARCHITECTURE.md).

