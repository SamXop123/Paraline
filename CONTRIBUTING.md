
# Contributing to Paraline

First of all, thank you for considering contributing to Paraline 💜

Whether you're fixing bugs, improving performance, polishing UI behavior, improving documentation, or suggesting new ideas, every contribution helps make Paraline better.

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

