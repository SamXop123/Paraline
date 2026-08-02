// presetManager.js
// Handles Aurora Drift preset validation, bundled preset loading, and
// orchestrates import/export via the IPC bridge exposed in preload.js.

'use strict';

// ─── Validation ────────────────────────────────────────────────────────────

const PRESET_CONSTRAINTS = {
  gradientStops:      { minItems: 2, maxItems: 6 },
  glowRadius:         { min: 0,   max: 60  },
  primaryFrequency:   { min: 0.1, max: 3.0 },
  secondaryFrequency: { min: 0.1, max: 3.0 },
  responseSmoothing:  { min: 0.1, max: 1.0 },
  activeCurtains:     { min: 1,   max: 6, integer: true },
};

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || min, min), max);
}

function isValidHex(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validates and coerces an Aurora Drift settings object.
 * Throws a descriptive Error if the structure is irrecoverably bad.
 * Clamps numeric values into valid ranges rather than hard-failing.
 */
function validateAndCoerce(settings) {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Settings block is missing or not an object.');
  }

  // Gradient stops
  if (!Array.isArray(settings.gradientStops)) {
    throw new Error('"gradientStops" must be an array.');
  }
  const { minItems, maxItems } = PRESET_CONSTRAINTS.gradientStops;
  if (settings.gradientStops.length < minItems || settings.gradientStops.length > maxItems) {
    throw new Error(`"gradientStops" must have ${minItems}–${maxItems} entries (got ${settings.gradientStops.length}).`);
  }
  settings.gradientStops = settings.gradientStops.map((stop, i) => {
    if (!isValidHex(stop.color)) {
      throw new Error(`Stop ${i}: invalid color "${stop.color}". Use #RRGGBB hex format.`);
    }
    return {
      position: clamp(stop.position, 0, 1),
      color:    stop.color,
      opacity:  clamp(stop.opacity,  0, 1),
    };
  });
  // Sort stops by position so they render correctly
  settings.gradientStops.sort((a, b) => a.position - b.position);

  // Numeric fields — clamp into range
  settings.glowRadius         = clamp(settings.glowRadius,         PRESET_CONSTRAINTS.glowRadius.min,         PRESET_CONSTRAINTS.glowRadius.max);
  settings.primaryFrequency   = clamp(settings.primaryFrequency,   PRESET_CONSTRAINTS.primaryFrequency.min,   PRESET_CONSTRAINTS.primaryFrequency.max);
  settings.secondaryFrequency = clamp(settings.secondaryFrequency, PRESET_CONSTRAINTS.secondaryFrequency.min, PRESET_CONSTRAINTS.secondaryFrequency.max);
  settings.responseSmoothing  = clamp(settings.responseSmoothing,  PRESET_CONSTRAINTS.responseSmoothing.min,  PRESET_CONSTRAINTS.responseSmoothing.max);
  settings.activeCurtains     = Math.round(clamp(settings.activeCurtains, PRESET_CONSTRAINTS.activeCurtains.min, PRESET_CONSTRAINTS.activeCurtains.max));

  return settings;
}

// ─── Bundled community presets ──────────────────────────────────────────────
// These are loaded at startup and shown in the preset dropdown.
// File paths resolved relative to the repo root by the main process.

const BUNDLED_PRESET_NAMES = [
  'arctic-dawn',
  'neon-city',
  'emerald-veil',
];

let _bundledPresets = []; // populated by loadBundledPresets()

async function loadBundledPresets() {
  _bundledPresets = [];
  for (const name of BUNDLED_PRESET_NAMES) {
    try {
      const preset = await window.presetAPI.loadBundledPreset(name);
      if (preset) _bundledPresets.push(preset);
    } catch {
      console.warn(`[PresetManager] Could not load bundled preset: ${name}`);
    }
  }
  return _bundledPresets;
}

function getBundledPresets() {
  return _bundledPresets;
}

// ─── Export ─────────────────────────────────────────────────────────────────

/**
 * Exports the current Aurora Drift settings as a .json preset file.
 * Uses the IPC bridge (preload.js → main.js) to open a save dialog.
 * @param {string} presetName  - User-supplied name for the preset
 * @param {object} settings    - Current Aurora Drift settings object
 */
async function exportPreset(presetName, settings) {
  if (!presetName || !presetName.trim()) {
    throw new Error('Please enter a name for your preset before exporting.');
  }

  const preset = {
    name:    presetName.trim(),
    author:  'Community',
    version: '1.0',
    theme:   'Aurora Drift',
    settings,
  };

  const json = JSON.stringify(preset, null, 2);
  const defaultFileName = presetName.trim().replace(/\s+/g, '-').toLowerCase() + '.json';

  // Delegates to main process via IPC (see main.js and preload.js)
  const result = await window.presetAPI.savePresetFile(defaultFileName, json);
  return result; // { success: true, path } or { success: false, cancelled: true }
}

// ─── Import ─────────────────────────────────────────────────────────────────

/**
 * Opens a file dialog to pick a .json preset, validates it, and returns
 * the validated settings object. The caller applies it to the theme.
 * @returns {object|null} { preset, settings } or null if cancelled
 */
async function importPreset() {
  const json = await window.presetAPI.openPresetFile();
  if (!json) return null; // user cancelled

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  if (!parsed.theme || parsed.theme !== 'Aurora Drift') {
    throw new Error(
      parsed.theme
        ? `This preset is for "${parsed.theme}", not Aurora Drift.`
        : 'Missing "theme" field — not a valid Paraline preset.'
    );
  }

  const validatedSettings = validateAndCoerce(parsed.settings);
  return { preset: parsed, settings: validatedSettings };
}

// ─── Public API ─────────────────────────────────────────────────────────────

if (typeof module !== 'undefined') {
  module.exports = { exportPreset, importPreset, validateAndCoerce, loadBundledPresets, getBundledPresets };
}