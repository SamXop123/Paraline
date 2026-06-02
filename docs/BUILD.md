# Build & Distribution Guide

A complete reference for building, packaging, and distributing Paraline — from local development builds to production Windows installers.

This guide covers:

- **Prerequisites** — Required tools and environment
- **Development workflow** — Running the app locally without packaging
- **Audio helper build** — Compiling the C# WASAPI audio bridge
- **Packaging workflow** — Creating an unpacked app directory (`pack:win`)
- **Distribution workflow** — Generating a full Windows installer (`dist:win`)
- **Build artifacts** — What gets generated and where
- **Release workflow** — How automated releases are triggered
- **Troubleshooting** — Common build failures and how to resolve them

---

## Prerequisites

Paraline requires two runtimes and one build tool to be installed before any build step can succeed.

### Required Tools

| Tool | Minimum Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18 or higher | Electron app runtime and npm scripts |
| [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8) | 8.0.x | Compiling the C# audio helper |
| [Git](https://git-scm.com/) | Any recent version | Cloning the repository |

> **Note:** Paraline is a Windows-only application. The audio helper uses WASAPI Loopback, which is a Windows-specific audio API. All build and packaging commands must be run on a Windows machine (Windows 10 or Windows 11).

### Verify Prerequisites

Run the following commands to confirm that all required tools are installed and on your PATH before proceeding:

```bash
node --version
npm --version
dotnet --version
```

Expected output:

```
v20.x.x      ← Node.js (18+ required)
10.x.x       ← npm
8.0.x        ← .NET SDK (8.0.x required)
```

If `dotnet` is not found, install the [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8) and restart your terminal.

---

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SamXop123/Paraline.git
cd Paraline
```

### 2. Install Node.js Dependencies

```bash
npm install
```

This installs `electron` and `electron-builder` (both listed as `devDependencies` in `package.json`), along with the `vite` runtime dependency used by the landing page.

> **Note:** `node_modules/` is git-ignored. You must run `npm install` before any other script.

---

## Available npm Scripts

All build and packaging commands are defined in `package.json`. Here is a summary of every script available:

| Script | Command | Description |
|---|---|---|
| `start` | `electron .` | Launch the Electron app in development mode |
| `dev` | `electron .` | Alias for `start` (same behavior) |
| `landing:dev` | `npm --prefix landing run dev` | Start the Vite dev server for the landing page |
| `landing:build` | `npm --prefix landing run build` | Build the landing page for production |
| `audio:helper:info` | *(info only)* | Prints a reminder of the build command |
| `build:helper` | `dotnet publish ...` | Compile and publish the C# audio helper |
| `pack:win` | `build:helper + electron-builder --dir` | Package the app into an unpacked folder (no installer) |
| `dist:win` | `build:helper + electron-builder --win nsis` | Build the full NSIS Windows installer |

---

## Development Workflow

During development, you do not need to package or distribute the app. You run it directly through Electron.

### Step 1 — Build the Audio Helper (Development Mode)

The C# audio helper is not pre-compiled in the repository. Before launching the app for the first time, build it:

```bash
dotnet build .\audio-helper\Paraline.AudioBridge.csproj
```

This produces a debug build of `Paraline.AudioBridge.exe` at:

```
audio-helper\bin\Debug\net8.0-windows\Paraline.AudioBridge.exe
```

> **Note:** For development, a debug build is sufficient. `audioBridge.js` automatically searches several known paths for the executable. If it is not found, the app falls back to simulated audio and continues to run.

### Step 2 — Start the App

```bash
npm run dev
```

or equivalently:

```bash
npm start
```

This launches Electron directly from the source files. No bundling or packaging occurs. Changes to renderer-side files (HTML, CSS, JS themes) are reflected immediately on the next app restart.

---

## Audio Helper Build

The audio helper is a self-contained C# console application (`audio-helper/Paraline.AudioBridge.csproj`) that captures system audio using WASAPI Loopback and emits normalized RMS audio levels as JSON over stdout to the Electron main process.

### Project Details

| Property | Value |
|---|---|
| Target Framework | `net8.0-windows` |
| Output Type | `Exe` |
| Project file | `audio-helper/Paraline.AudioBridge.csproj` |
| Source file | `audio-helper/Program.cs` |

### Development Build

Use this when working on the audio bridge locally. Output goes into `audio-helper/bin/`.

```bash
dotnet build .\audio-helper\Paraline.AudioBridge.csproj
```

Output location:

```
audio-helper\bin\Debug\net8.0-windows\Paraline.AudioBridge.exe
```

### Production Publish (used by packaging scripts)

The `build:helper` npm script runs a full `dotnet publish` with self-contained, single-file settings:

```bash
npm run build:helper
```

This expands to:

```bash
dotnet publish .\audio-helper\Paraline.AudioBridge.csproj \
  -c Release \
  -r win-x64 \
  --self-contained true \
  -p:PublishSingleFile=true \
  -p:IncludeNativeLibrariesForSelfExtract=true \
  -o .\build\audio-helper
```

| Flag | Meaning |
|---|---|
| `-c Release` | Compiles in Release mode (optimized, no debug symbols) |
| `-r win-x64` | Targets 64-bit Windows |
| `--self-contained true` | Bundles the .NET runtime — no SDK required on the end user's machine |
| `-p:PublishSingleFile=true` | Merges all assemblies into a single `.exe` |
| `-p:IncludeNativeLibrariesForSelfExtract=true` | Embeds native libraries inside the single-file bundle |
| `-o .\build\audio-helper` | Writes the output to `build/audio-helper/` |

Output location:

```
build\audio-helper\Paraline.AudioBridge.exe
```

> **Important:** The `pack:win` and `dist:win` scripts both call `build:helper` automatically as their first step. You do not need to run `build:helper` separately before packaging.

### How the Helper Communicates with Electron

The helper runs as a background child process spawned by `audioBridge.js`. It writes one JSON line to stdout approximately every 33 ms (≈ 30 frames per second):

```json
{"type":"level","value":0.3421}
{"type":"level","value":0.4108}
{"type":"level","value":0.2893}
```

`audioBridge.js` reads these lines, parses the `value` field, and forwards the normalized RMS level (between `0.0` and `1.0`) to the Electron main process via IPC.

---

## Packaging Workflow — `pack:win`

`pack:win` creates an unpacked application directory without generating an installer. It is useful for testing the packaged output before committing to an installer build.

### Command

```bash
npm run pack:win
```

### What It Does

1. Runs `npm run build:helper` to produce the self-contained `Paraline.AudioBridge.exe`.
2. Runs `electron-builder --dir --win nsis --x64`, which:
   - Bundles all source files listed in the `files` array in `package.json`.
   - Copies `build/audio-helper/Paraline.AudioBridge.exe` into the app's `resources/audio-helper/` directory.
   - Writes the unpacked app directory to `dist/win-unpacked/`.

### Output Location

```
dist\
└── win-unpacked\
    ├── Paraline.exe                    ← Electron launcher
    ├── resources\
    │   ├── app\                        ← Bundled Electron source files
    │   │   ├── main.js
    │   │   ├── renderer.js
    │   │   ├── preload.js
    │   │   ├── audioBridge.js
    │   │   ├── settingsStore.js
    │   │   ├── themeAgent.js
    │   │   ├── index.html
    │   │   ├── styles.css
    │   │   ├── settings.html
    │   │   ├── settings.css
    │   │   ├── settings.js
    │   │   ├── package.json
    │   │   ├── themes\
    │   │   └── assets\
    │   └── audio-helper\
    │       └── Paraline.AudioBridge.exe  ← Self-contained C# audio helper
    └── ...                             ← Electron runtime files
```

### Verifying the Packaged App

After `pack:win` completes, you can launch the app directly from the unpacked directory to verify it works as expected:

```bash
.\dist\win-unpacked\Paraline.exe
```

---

## Distribution Workflow — `dist:win`

`dist:win` builds the complete NSIS installer that is distributed to end users. This is the command used in CI for releases.

### Command

```bash
npm run dist:win
```

### What It Does

1. Runs `npm run build:helper` to produce the self-contained `Paraline.AudioBridge.exe`.
2. Runs `electron-builder --win nsis --x64`, which:
   - Performs all the same bundling steps as `pack:win`.
   - Additionally invokes NSIS to generate a full Windows installer `.exe`.
   - Writes the installer to `dist/`.

### NSIS Installer Configuration

The installer behavior is controlled by the `nsis` block in `package.json`:

```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "Paraline"
}
```

| Setting | Value | Effect |
|---|---|---|
| `oneClick` | `false` | Shows the installation wizard — the user steps through the installer |
| `allowToChangeInstallationDirectory` | `true` | Users can choose a custom install path |
| `createDesktopShortcut` | `true` | Creates a desktop shortcut after installation |
| `createStartMenuShortcut` | `true` | Creates a Start Menu entry |
| `shortcutName` | `"Paraline"` | Name used for the shortcuts |

### Output Location

```
dist\
├── Paraline-Setup-2.0.0.exe    ← NSIS installer (distributable)
├── win-unpacked\               ← Unpacked app directory (also generated)
└── builder-debug.yml           ← Build metadata generated by electron-builder
```

The installer filename follows the `artifactName` pattern defined in `package.json`:

```json
"artifactName": "${productName}-Setup-${version}.${ext}"
```

So for version `2.0.0`, the installer is named `Paraline-Setup-2.0.0.exe`.

### Verifying the Installer

1. Double-click `dist\Paraline-Setup-2.0.0.exe` to run the installer wizard.
2. Complete the installation to the default or a custom path.
3. Launch Paraline from the desktop shortcut or Start Menu.
4. Right-click the system tray icon and confirm that **Audio Capture** shows **Live** (not **Fallback**).

---

## Electron Builder Configuration

The full `build` configuration in `package.json` controls what Electron Builder packages:

```json
"build": {
  "appId": "com.paraline.app",
  "productName": "Paraline",
  "artifactName": "${productName}-Setup-${version}.${ext}",
  "directories": {
    "output": "dist",
    "buildResources": "assets"
  },
  "files": [
    "main.js", "renderer.js", "preload.js", "audioBridge.js",
    "settingsStore.js", "themeAgent.js", "settings.html",
    "settings.css", "settings.js", "index.html", "styles.css",
    "themes/**/*", "package.json", "assets/**/*"
  ],
  "extraResources": [
    {
      "from": "build/audio-helper",
      "to": "audio-helper",
      "filter": ["Paraline.AudioBridge.exe"]
    }
  ],
  "win": {
    "target": [{ "target": "nsis", "arch": ["x64"] }],
    "icon": "assets/appicon.ico"
  }
}
```

| Key | Value | Notes |
|---|---|---|
| `appId` | `com.paraline.app` | Unique application ID used by Windows |
| `productName` | `Paraline` | Display name of the application |
| `output` | `dist` | All build outputs go here |
| `buildResources` | `assets` | Icons and other resources used by the installer |
| `files` | *(see above)* | Exact list of source files bundled into the app |
| `extraResources` | `build/audio-helper → audio-helper` | Copies only `Paraline.AudioBridge.exe` into the app bundle |
| `win.icon` | `assets/appicon.ico` | Application icon for the installer and executable |

> **Note:** The `node_modules/`, `dist/`, and `build/` directories are git-ignored and are never bundled into the app.

---

## CI Build Workflow

Paraline uses GitHub Actions for automated building and releasing.

### `ci.yml` — Continuous Integration

Triggered on every push to `main` and on every pull request.

Runs three parallel jobs:

**`build-helper`** — Verifies the C# audio helper compiles cleanly:
```yaml
- Setup Node.js 20
- Setup .NET 8.0.x
- npm install
- npm run build:helper
```

**`build-landing`** — Verifies the landing page builds cleanly:
```yaml
- Setup Node.js 20
- npm --prefix landing install
- npm --prefix landing run build
```

**`package-app`** — Verifies the full Electron app packages without errors:
```yaml
- Setup Node.js 20
- Setup .NET 8.0.x
- npm install
- npm run build:helper
- npm run pack:win   ← unpacked dir only, no installer
```

### `release.yml` — Automated Release

Triggered when a version tag matching `v*` is pushed (e.g., `v2.0.1`).

```yaml
- Setup Node.js 20
- Setup .NET 8.0.x
- npm install
- npm run build:helper
- npm run dist:win            ← generates the full NSIS installer
- Upload dist/*.exe as build artifact
- Create GitHub Release with dist/*.exe attached
```

The release workflow requires `GH_TOKEN` (automatically provided as `secrets.GITHUB_TOKEN`) and the `contents: write` permission to publish releases.

### Triggering a Release Locally

To trigger the automated release workflow, push a version tag to `main`:

```bash
git tag v2.0.1
git push origin v2.0.1
```

The `release.yml` workflow will automatically build and publish the installer to the GitHub Releases page.

---

## Build Artifacts Reference

| Path | Created by | Description |
|---|---|---|
| `audio-helper\bin\Debug\net8.0-windows\Paraline.AudioBridge.exe` | `dotnet build` | Debug build for local development |
| `build\audio-helper\Paraline.AudioBridge.exe` | `npm run build:helper` | Self-contained release binary, bundled into the packaged app |
| `dist\win-unpacked\` | `npm run pack:win` or `dist:win` | Unpacked Electron application directory |
| `dist\Paraline-Setup-<version>.exe` | `npm run dist:win` | NSIS installer — the final distributable |
| `dist\builder-debug.yml` | `electron-builder` | Build metadata generated automatically |

> **Note:** `dist/` and `build/` are git-ignored. These directories are generated locally during the build process and are never committed to the repository.

---

## Troubleshooting

### `dotnet: command not found` or `.NET SDK not found`

**Symptom:** Running any `dotnet` command or `npm run build:helper` results in an error about `dotnet` not being recognized.

**Solution:**
1. Download and install the [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8).
2. Restart your terminal (or restart your machine) so the PATH is updated.
3. Verify with `dotnet --version`. The output must be `8.0.x` or higher.

---

### `npm install` Fails

**Symptom:** `npm install` exits with errors about missing packages or network issues.

**Solutions:**
- Ensure you have a working internet connection.
- If you are behind a corporate proxy, configure npm's proxy settings:
  ```bash
  npm config set proxy http://your-proxy:port
  npm config set https-proxy http://your-proxy:port
  ```
- Delete `node_modules/` and `package-lock.json`, then retry:
  ```bash
  rmdir /s /q node_modules
  del package-lock.json
  npm install
  ```

---

### `npm run build:helper` Fails — Build Errors

**Symptom:** The `dotnet publish` step inside `build:helper` exits with errors.

**Solutions:**

1. **Verify .NET 8 is installed:**
   ```bash
   dotnet --version
   ```

2. **Restore NuGet packages explicitly:**
   ```bash
   dotnet restore .\audio-helper\Paraline.AudioBridge.csproj
   ```

3. **Clean the build and retry:**
   ```bash
   dotnet clean .\audio-helper\Paraline.AudioBridge.csproj
   npm run build:helper
   ```

4. **Check for missing .NET workloads:**
   ```bash
   dotnet workload list
   ```
   For this project, no additional workloads beyond the base .NET 8 SDK are required.

---

### `Paraline.AudioBridge.exe` Not Found at Runtime

**Symptom:** Paraline starts but the tray shows **Audio Capture: Fallback** and a notification appears saying the helper was not found.

**Cause:** The C# helper was not compiled before running the app, or the build output is missing.

**Solutions:**

- For **development**: Run `dotnet build .\audio-helper\Paraline.AudioBridge.csproj` and then restart the app.
- For **packaged builds**: Run `npm run pack:win` or `npm run dist:win` — these automatically publish the helper to `build/audio-helper/` and embed it into the app bundle.

To verify manually, check that the file exists at one of these locations:

```bash
# Development build location
dir audio-helper\bin\Debug\net8.0-windows\Paraline.AudioBridge.exe

# Production publish location
dir build\audio-helper\Paraline.AudioBridge.exe
```

---

### Antivirus Blocks or Quarantines the Helper Executable

**Symptom:** `Paraline.AudioBridge.exe` disappears after being built, or the app fails to launch the helper despite it being compiled successfully.

**Solution:**
- Check your antivirus quarantine log and restore the file if found.
- Add exceptions for the following directories in your antivirus software:
  - `audio-helper\bin\`
  - `build\audio-helper\`

---

### Electron Builder Fails — `pack:win` or `dist:win`

**Symptom:** `npm run pack:win` or `npm run dist:win` exits with an error from `electron-builder`.

**Common causes and solutions:**

1. **`build:helper` failed first:** The helper must be present at `build\audio-helper\Paraline.AudioBridge.exe` before `electron-builder` runs. Check the output of `npm run build:helper` separately.

2. **`dist/` directory is locked:** Another process (e.g., Windows Explorer or antivirus) may have a lock on the `dist/` directory. Close all File Explorer windows showing `dist/`, and retry.

3. **Missing icon:** The packaging config references `assets/appicon.ico`. Verify the file exists:
   ```bash
   dir assets\appicon.ico
   ```

4. **`GH_TOKEN` not set (CI only):** The release workflow requires `GH_TOKEN` as an environment variable. This is automatically provided by GitHub Actions via `secrets.GITHUB_TOKEN`. For local builds, you do not need this token unless you are publishing a release.

5. **Clean and retry:** Delete `dist/` and `build/` and run the command again:
   ```bash
   rmdir /s /q dist
   rmdir /s /q build
   npm run dist:win
   ```

---

### Windows Permission Errors

**Symptom:** Access denied errors when writing to `dist/`, `build/`, or `audio-helper/bin/`.

**Solutions:**
- Do not run build commands from inside a OneDrive-synced or network-shared directory if possible.
- Run your terminal as a normal user (not as Administrator) unless specifically required.
- Right-click the `Paraline.AudioBridge.exe` → **Properties** → click **Unblock** if the option is present (this can appear on executables downloaded or copied from a network path).

---

### Visualizer Runs but Does Not React to Audio (After a Fresh Build)

**Symptom:** The app launches and the tray shows **Audio Capture: Fallback** even after building the helper.

**Diagnostic steps:**
1. Run the helper manually and confirm it produces JSON output:
   ```bash
   .\audio-helper\bin\Debug\net8.0-windows\Paraline.AudioBridge.exe
   ```
   Expected output while audio is playing:
   ```json
   {"type":"level","value":0.3421}
   {"type":"level","value":0.4108}
   ```
2. Confirm the correct audio output device is set as the Windows default:
   - Right-click the speaker icon in the system tray → **Open Sound settings** → **Output**
3. Confirm audio is actually playing through the default device (check the Windows Volume Mixer).
4. Restart Paraline.

For a full audio troubleshooting reference, see [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md).

---

## Cross-References

| Document | What It Covers |
|---|---|
| [README.md](./README.md) | Project overview, feature list, and end-user installation |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution workflow, code style, and pull request guidelines |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Architecture, file structure, settings model, and development workflow |
| [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | Detailed runtime, audio, and IPC troubleshooting |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture and component interaction |
| [docs/THEME_DEVELOPMENT.md](./docs/THEME_DEVELOPMENT.md) | How to create and extend visual themes |

---

*For questions about the build process, open an issue on the [Paraline GitHub repository](https://github.com/SamXop123/Paraline).*
