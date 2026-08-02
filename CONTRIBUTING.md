
# Contributing to Paraline

First of all, thank you for considering contributing to Paraline 💜

Whether you're fixing bugs, improving performance, polishing UI behavior, improving documentation, or suggesting new ideas, every contribution helps make Paraline better.

---

## Contributing Aurora Drift Presets

Community presets live in `themes/aurora-presets/`. Anyone can submit a new preset via PR.

### Preset File Format

Create a `.json` file following this structure:

```json
{
  "name": "Your Preset Name",
  "author": "YourGitHubUsername",
  "version": "1.0",
  "theme": "Aurora Drift",
  "description": "One sentence describing the mood or inspiration.",
  "settings": {
    "gradientStops": [
      { "position": 0.0, "color": "#RRGGBB", "opacity": 0.9 },
      { "position": 0.5, "color": "#RRGGBB", "opacity": 0.7 },
      { "position": 1.0, "color": "#RRGGBB", "opacity": 0.8 }
    ],
    "glowRadius": 20,
    "primaryFrequency": 1.0,
    "secondaryFrequency": 0.6,
    "responseSmoothing": 0.7,
    "activeCurtains": 3
  }
}
```

### Field Constraints

| Field | Type | Range | Notes |
|---|---|---|---|
| `gradientStops` | array | 2–6 items | Sorted by `position` (0.0 → 1.0) |
| `position` | number | 0.0 – 1.0 | Gradient stop position |
| `color` | string | `#RRGGBB` | Hex color, 6 digits |
| `opacity` | number | 0.0 – 1.0 | Per-stop opacity |
| `glowRadius` | number | 0 – 60 | Higher = softer, wider bloom |
| `primaryFrequency` | number | 0.1 – 3.0 | Main curtain wave speed |
| `secondaryFrequency` | number | 0.1 – 3.0 | Secondary wave speed |
| `responseSmoothing` | number | 0.1 – 1.0 | Higher = smoother, slower response |
| `activeCurtains` | integer | 1 – 6 | Number of layered curtain bands |

### Submission Steps

1. Design your preset using the in-app Export button (Aurora Drift settings → Presets → Export)
2. Place the `.json` file in `themes/aurora-presets/your-preset-name.json`
3. Add your preset name to the `BUNDLED_PRESET_NAMES` array in `presetManager.js`
4. Open a PR with title: `preset: add [Preset Name] community preset`
5. Include a short description of the mood/inspiration in the PR body

The schema reference is at `themes/aurora-presets/preset.schema.json`.

---

# Before You Start

Please make sure to:

- Search existing issues before opening a new one
- Keep pull requests focused and small when possible
- Test your changes before submitting
- Be respectful and constructive in discussions

---

# Development Setup

## 1. Clone the Repository

```bash
git clone https://github.com/SamXop123/Paraline.git
cd Paraline
````

## 2. Install Dependencies

```bash
npm install
```

## 3. Start the App

```bash
npm start
```

---

# Audio Helper Development

Paraline uses a native C# audio helper for loopback/system audio capture.

If you're working on audio bridge functionality:

## Build the Helper

```bash
dotnet build ./audio-helper/Paraline.AudioBridge.csproj
```

Or use:

```bash
npm run build:helper
```

> **Note:** `dotnet build` produces a debug build suitable for local development. `npm run build:helper` runs a full `dotnet publish` with self-contained, single-file settings and writes the output to `build/audio-helper/` — this is what the packaging scripts use. They are not interchangeable for packaging purposes.

For the complete packaging and distribution workflow, including production builds and Windows installer generation, see **[BUILD.md](./BUILD.md)**.

---

# Building & Distribution

For detailed documentation on how to build the audio helper, package the app, and generate a distributable Windows installer, see:

**[Build & Distribution Guide](./BUILD.md)**

# Pull Request Guidelines

## Keep PRs Focused

Good:

* Fix a specific bug
* Improve one feature
* Refactor a single system
* Improve error handling

Avoid:

* Large unrelated rewrites
* Massive formatting-only changes
* Multiple unrelated features in one PR

---

# Code Style

## General Principles

* Keep code readable and simple
* Prefer clarity over cleverness
* Avoid unnecessary dependencies
* Keep functions focused on one responsibility

## JavaScript

* Use consistent formatting
* Prefer descriptive variable names
* Avoid deeply nested logic where possible

---

# Error Handling

Paraline should fail gracefully whenever possible.

When adding error handling:

* Prefer user-friendly messages
* Include actionable troubleshooting hints
* Avoid exposing unnecessary internal details
* Preserve useful debug information for developers

Example:

Instead of:

```js
"Helper failed."
```

Prefer:

```js
"Audio capture helper failed to start.

Troubleshooting:
- Try restarting Paraline
- Ensure the helper binary exists
- Rebuild the helper if needed"
```

---

# Notifications & UX

Please avoid:

* Notification spam
* Repetitive modal dialogs
* Excessively noisy logs

User-facing behavior should feel lightweight and non-intrusive.

---

# Commit Messages

Examples:

```bash
fix: prevent duplicate fallback notifications
feat: improve audio bridge error reporting
docs: update setup instructions
refactor: simplify bridge status handling
```

---

# Reporting Bugs

When opening an issue, include:

* Operating system
* Paraline version
* Steps to reproduce
* Expected behavior
* Actual behavior
* Screenshots/logs if available

---

# Feature Requests

Feature ideas are welcome.

Please explain:

* The problem you're trying to solve
* Why the feature would help users
* Any implementation ideas if relevant

---

# Code Review Expectations

Pull requests may receive feedback before merging.

This is normal and helps maintain code quality.

Please don't take review comments personally 🌌

---

# Security

If you discover a security issue, please avoid publicly disclosing sensitive details immediately.

Instead, open a private/security report if possible.

---

# Thank You

Open source projects grow through community contributions.

Thanks for helping improve Paraline ✨

