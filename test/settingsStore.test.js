const test = require("node:test");
const assert = require("node:assert");
const {
  DEFAULT_SETTINGS,
  createDefaultSettings,
  createThemeDefaults,
  sanitizeSettings
} = require("../settingsStore");

const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === "electron") {
    return {
      app: {
        getVersion: () => "0.0.0-test",
        requestSingleInstanceLock: () => true,
        whenReady: () => ({ then: () => {} }),
        on: () => {},
        quit: () => {},
        isPackaged: false
      },
      BrowserWindow: { getFocusedWindow: () => null },
      ipcMain: { handle: () => {}, on: () => {} },
      Menu: {},
      Tray: function Tray() {},
      nativeImage: {},
      screen: {},
      shell: {},
      dialog: {},
      nativeTheme: {},
      systemPreferences: {},
      powerMonitor: {},
      globalShortcut: {}
    };
  }

  if (id === "electron-updater") {
    return { autoUpdater: { checkForUpdatesAndNotify: () => {} } };
  }

  return originalRequire.apply(this, arguments);
};
const { _sanitizeBackupProfiles } = require("../main");
Module.prototype.require = originalRequire;

test("settingsStore - Default Settings Creation", () => {
  const defaults = createDefaultSettings();
  assert.ok(defaults.onboardingSeen === false);
  assert.ok(defaults.selectedTheme === "ambientWave");
  assert.deepStrictEqual(defaults.ambientWave.tone, "blue");
});

test("settingsStore - sanitizeSettings with empty/invalid inputs", () => {
  const sanitized = sanitizeSettings({});
  assert.strictEqual(sanitized.onboardingSeen, false);
  assert.strictEqual(sanitized.selectedTheme, "ambientWave");
  assert.deepStrictEqual(sanitized.customColors, ["#00f2fe", "#4facfe", "#8ee2ff"]);
  assert.strictEqual(sanitized.themeAutomation.enabled, false);
});

test("settingsStore - sanitizeSettings clamps custom thickness, gap, sensitivity, speed", () => {
  const input = {
    selectedTheme: "ambientWave",
    sideBars: {
      customThickness: 100,      // should clamp to 20
      customGap: 0,             // should clamp to 2
      customSensitivity: -50,   // should clamp to 1
    },
    sideBraids: {
      customSpeed: 500          // should clamp to 100
    }
  };
  const sanitized = sanitizeSettings(input);
  assert.strictEqual(sanitized.sideBars.customThickness, 20);
  assert.strictEqual(sanitized.sideBars.customGap, 2);
  assert.strictEqual(sanitized.sideBars.customSensitivity, 1);
  assert.strictEqual(sanitized.sideBraids.customSpeed, 100);
});

test("settingsStore - sanitizeSettings validates customColors array length and format", () => {
  // Test invalid length
  const inputInvalidLen = {
    selectedTheme: "ambientWave",
    customColors: ["#ffffff", "#000000"]
  };
  const sanitized1 = sanitizeSettings(inputInvalidLen);
  assert.deepStrictEqual(sanitized1.customColors, DEFAULT_SETTINGS.customColors);

  // Test invalid hex format
  const inputInvalidHex = {
    selectedTheme: "ambientWave",
    customColors: ["#ffffff", "#000000", "invalid"]
  };
  const sanitized2 = sanitizeSettings(inputInvalidHex);
  assert.deepStrictEqual(sanitized2.customColors, DEFAULT_SETTINGS.customColors);

  // Test valid hex format
  const inputValid = {
    selectedTheme: "ambientWave",
    customColors: ["#111111", "#222222", "#333333"]
  };
  const sanitized3 = sanitizeSettings(inputValid);
  assert.deepStrictEqual(sanitized3.customColors, ["#111111", "#222222", "#333333"]);
});

test("settingsStore - Legacy Migration (edgeFlutter to edgeCrystals)", () => {
  const legacyInput = {
    selectedTheme: "edgeFlutter",
    edgeFlutter: {
      flutterStyle: "energetic",
      density: "high"
    }
  };
  const sanitized = sanitizeSettings(legacyInput);
  assert.strictEqual(sanitized.selectedTheme, "edgeCrystals");
  assert.strictEqual(sanitized.edgeCrystals.flutterStyle, "energetic");
  assert.strictEqual(sanitized.edgeCrystals.density, "high");
});

test("settingsStore - Legacy Theme Automation Migration", () => {
  const input = {
    selectedTheme: "ambientWave",
    themeAutomation: {
      enabled: true,
      checkIntervalMinutes: 200, // should clamp to 120
      dayStartHour: 25,          // should fall back to default
      nightStartHour: -2         // should fall back to default
    }
  };
  const sanitized = sanitizeSettings(input);
  assert.strictEqual(sanitized.themeAutomation.enabled, true);
  assert.strictEqual(sanitized.themeAutomation.checkIntervalMinutes, 120);
  assert.strictEqual(sanitized.themeAutomation.dayStartHour, DEFAULT_SETTINGS.themeAutomation.dayStartHour);
  assert.strictEqual(sanitized.themeAutomation.nightStartHour, DEFAULT_SETTINGS.themeAutomation.nightStartHour);
});

test("settingsStore - Theme Automation rejects invalid mode and falls back to default", () => {
  const input = {
    selectedTheme: "ambientWave",
    themeAutomation: {
      enabled: true,
      mode: "randomMode" // invalid, should fall back to default ("dayNight")
    }
  };
  const sanitized = sanitizeSettings(input);
  assert.strictEqual(sanitized.themeAutomation.enabled, true);
  assert.strictEqual(sanitized.themeAutomation.mode, DEFAULT_SETTINGS.themeAutomation.mode);

  // Also cover non-string / missing values
  const cases = [undefined, null, 123, {}, [], ""];
  for (const mode of cases) {
    const result = sanitizeSettings({
      selectedTheme: "ambientWave",
      themeAutomation: { mode }
    });
    assert.strictEqual(result.themeAutomation.mode, DEFAULT_SETTINGS.themeAutomation.mode);
  }

  // Valid mode should pass through unchanged
  const validResult = sanitizeSettings({
    selectedTheme: "ambientWave",
    themeAutomation: { mode: "dayNight" }
  });
  assert.strictEqual(validResult.themeAutomation.mode, "dayNight");
});

test("settingsStore - Theme Automation parses and clamps check interval strings", () => {
  const cases = [
    ["15", 15],
    [15, 15],
    ["0", 1],
    ["99999", 120],
    ["abc", DEFAULT_SETTINGS.themeAutomation.checkIntervalMinutes],
    [null, DEFAULT_SETTINGS.themeAutomation.checkIntervalMinutes],
    [{}, DEFAULT_SETTINGS.themeAutomation.checkIntervalMinutes],
    [[], DEFAULT_SETTINGS.themeAutomation.checkIntervalMinutes]
  ];

  for (const [checkIntervalMinutes, expected] of cases) {
    const sanitized = sanitizeSettings({
      selectedTheme: "ambientWave",
      themeAutomation: { checkIntervalMinutes }
    });
    assert.strictEqual(sanitized.themeAutomation.checkIntervalMinutes, expected);
    assert.strictEqual(typeof sanitized.themeAutomation.checkIntervalMinutes, "number");
  }
});

test("settingsStore - Theme Automation avoids equal hours", () => {
  const input = {
    themeAutomation: {
      dayStartHour: 10,
      nightStartHour: 10
    }
  };
  const sanitized = sanitizeSettings(input);
  assert.strictEqual(sanitized.themeAutomation.dayStartHour, DEFAULT_SETTINGS.themeAutomation.dayStartHour);
  assert.strictEqual(sanitized.themeAutomation.nightStartHour, DEFAULT_SETTINGS.themeAutomation.nightStartHour);
});

test("settingsStore - Legacy Theme conversion (sensitivity mapping)", () => {
  const legacy = {
    theme: "rainbow",
    sensitivity: 5.0
  };
  const sanitized = sanitizeSettings(legacy);
  assert.strictEqual(sanitized.selectedTheme, "reactiveBorder");
  assert.strictEqual(sanitized.reactiveBorder.intensity, "high");
});

test("settingsStore - Focus Mode sanitization and clamping", () => {
  const input = {
    selectedTheme: "ambientWave",
    focusMode: {
      enabled: true,
      dimOpacity: 1.5,          // should clamp to 1
      idleTimeout: 75,         // should clamp to 60
      transitionDuration: 15    // should clamp to 10
    }
  };
  const sanitized = sanitizeSettings(input);
  assert.strictEqual(sanitized.focusMode.enabled, true);
  assert.strictEqual(sanitized.focusMode.dimOpacity, 1);
  assert.strictEqual(sanitized.focusMode.idleTimeout, 60);
  assert.strictEqual(sanitized.focusMode.transitionDuration, 10);

  const inputMin = {
    selectedTheme: "ambientWave",
    focusMode: {
      enabled: false,
      dimOpacity: -0.5,        // should clamp to 0
      idleTimeout: 0,          // should clamp to 1
      transitionDuration: 0.05 // should clamp to 0.1
    }
  };
  const sanitizedMin = sanitizeSettings(inputMin);
  assert.strictEqual(sanitizedMin.focusMode.enabled, false);
  assert.strictEqual(sanitizedMin.focusMode.dimOpacity, 0);
  assert.strictEqual(sanitizedMin.focusMode.idleTimeout, 1);
  assert.strictEqual(sanitizedMin.focusMode.transitionDuration, 0.1);
});

test("settingsStore - Color Modulation sanitization and clamping", () => {
  const input = {
    selectedTheme: "ambientWave",
    colorModulation: {
      enabled: true,
      mode: "invalid_mode", // should clamp/fallback to "amplitude"
      sensitivity: 6.5,      // should clamp to 5.0
      transitionSpeed: 1.5   // should clamp to 1.0
    }
  };
  const sanitized = sanitizeSettings(input);
  assert.strictEqual(sanitized.colorModulation.enabled, true);
  assert.strictEqual(sanitized.colorModulation.mode, "amplitude");
  assert.strictEqual(sanitized.colorModulation.sensitivity, 5.0);
  assert.strictEqual(sanitized.colorModulation.transitionSpeed, 1.0);

  const inputMin = {
    selectedTheme: "ambientWave",
    colorModulation: {
      enabled: false,
      mode: "beat",
      sensitivity: 0.5,      // should clamp to 1.0
      transitionSpeed: 0.001  // should clamp to 0.01
    }
  };
  const sanitizedMin = sanitizeSettings(inputMin);
  assert.strictEqual(sanitizedMin.colorModulation.enabled, false);
  assert.strictEqual(sanitizedMin.colorModulation.mode, "beat");
  assert.strictEqual(sanitizedMin.colorModulation.sensitivity, 1.0);
  assert.strictEqual(sanitizedMin.colorModulation.transitionSpeed, 0.01);
});
test("settingsStore - wallpaperColors sanitization", () => {
  // Test invalid length
  const inputInvalidLen = {
    selectedTheme: "ambientWave",
    wallpaperColors: ["#ffffff", "#000000"]
  };
  const sanitized1 = sanitizeSettings(inputInvalidLen);
  assert.deepStrictEqual(sanitized1.wallpaperColors, undefined); // should be stripped or fallback, but not invalid array

  // Test invalid hex format
  const inputInvalidHex = {
    selectedTheme: "ambientWave",
    wallpaperColors: ["#ffffff", "#000000", "invalid"]
  };
  const sanitized2 = sanitizeSettings(inputInvalidHex);
  assert.deepStrictEqual(sanitized2.wallpaperColors, undefined);

  // Test valid hex format
  const inputValid = {
    selectedTheme: "ambientWave",
    wallpaperColors: ["#111111", "#222222", "#333333"]
  };
  const sanitized3 = sanitizeSettings(inputValid);
  assert.deepStrictEqual(sanitized3.wallpaperColors, ["#111111", "#222222", "#333333"]);
});

test("settingsStore - shortcuts normalize any casing of \"none\" to \"None\"", () => {
  const input = {
    selectedTheme: "ambientWave",
    shortcuts: {
      togglePause: "none",
      toggleHide: "NONE",
      cycleTheme: " NoNe "
    }
  };
  const sanitized = sanitizeSettings(input);
  assert.strictEqual(sanitized.shortcuts.togglePause, "None");
  assert.strictEqual(sanitized.shortcuts.toggleHide, "None");
  assert.strictEqual(sanitized.shortcuts.cycleTheme, "None");
});

test("settingsStore - shortcuts leave real accelerators and canonical None untouched", () => {
  const input = {
    selectedTheme: "ambientWave",
    shortcuts: {
      togglePause: "Ctrl+Alt+P",
      toggleHide: "None",
      cycleTheme: "Ctrl+Alt+T"
    }
  };
  const sanitized = sanitizeSettings(input);
  assert.strictEqual(sanitized.shortcuts.togglePause, "Ctrl+Alt+P");
  assert.strictEqual(sanitized.shortcuts.toggleHide, "None");
  assert.strictEqual(sanitized.shortcuts.cycleTheme, "Ctrl+Alt+T");
});


test("settings backup import profiles - validates names and sanitizes valid profiles", () => {
  const importedProfiles = JSON.parse(`{
    "Clean Profile": {
      "selectedTheme": "sideBars",
      "sideBars": {
        "customThickness": 100,
        "customGap": 0,
        "customSensitivity": -50
      }
    },
    "bad/profile:name": {
      "selectedTheme": "reactiveBorder"
    },
    "__proto__": {
      "selectedTheme": "auroraDrift"
    },
    "constructor": {
      "selectedTheme": "flowBorder"
    },
    "prototype": {
      "selectedTheme": "dotParticles"
    }
  }`);

  const safeProfiles = _sanitizeBackupProfiles(importedProfiles);

  assert.deepStrictEqual(Object.keys(safeProfiles), ["Clean Profile"]);
  assert.strictEqual(safeProfiles["Clean Profile"].selectedTheme, "sideBars");
  assert.strictEqual(safeProfiles["Clean Profile"].sideBars.customThickness, 20);
  assert.strictEqual(safeProfiles["Clean Profile"].sideBars.customGap, 2);
  assert.strictEqual(safeProfiles["Clean Profile"].sideBars.customSensitivity, 1);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(safeProfiles, "bad/profile:name"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(safeProfiles, "__proto__"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(safeProfiles, "constructor"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(safeProfiles, "prototype"), false);
});