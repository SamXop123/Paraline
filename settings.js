document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------
    // TAB SWITCHING
    // ----------------------------------------
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(button.getAttribute('data-target')).classList.add('active');
        });
    });

    // ----------------------------------------
    // THEME SCHEMA & DYNAMIC UI GENERATION
    // ----------------------------------------
    const THEMES_SCHEMA = {
        ambientWave: {
            tone: { label: "Tone", options: ["blue", "purple", "warm", "custom"] },
            sensitivity: { label: "Sensitivity", options: ["low", "medium", "high", "custom"] },
            edgeMode: { label: "Edge Mode", options: ["top", "bottom", "both"] },
            glowStrength: { label: "Glow Strength", options: ["soft", "medium", "strong", "custom"] }
        },
        reactiveBorder: {
            colorStyle: { label: "Color Style", options: ["rainbow", "neonBlue", "neonPurple", "warmGlow", "custom"] },
            intensity: { label: "Intensity", options: ["low", "medium", "high", "custom"] },
            borderThickness: { label: "Border Thickness", options: ["thin", "medium", "thick", "custom"] },
            glowStrength: { label: "Glow Strength", options: ["soft", "medium", "strong", "custom"] }
        },
        flowBorder: {
            colorStyle: { label: "Color Style", options: ["rainbow", "cool", "warm", "custom"] },
            direction: { label: "Direction", options: ["clockwise", "anticlockwise"] },
            speedMode: { label: "Speed Mode", options: ["calm", "balanced", "energetic", "custom"] },
            segmentLength: { label: "Segment Length", options: ["short", "medium", "long", "custom"] },
            glowStrength: { label: "Glow Strength", options: ["soft", "medium", "strong", "custom"] }
        },
        sideBars: {
            colorStyle: { label: "Color Style", options: ["white", "yellow", "aqua", "multicolor", "custom"] },
            barThickness: { label: "Bar Thickness", options: ["thin", "medium", "thick", "custom"] },
            sensitivity: { label: "Sensitivity", options: ["low", "medium", "high", "custom"] },
            barDensity: { label: "Bar Density", options: ["low", "medium", "high", "custom"] }
        },
        flatRipples: {
            mode: { label: "Mode", options: ["sideRipples", "flatRipples"] },
            intensity: { label: "Intensity", options: ["low", "medium", "high", "custom"] },
            colorStyle: { label: "Color Style", options: ["red", "blue", "white", "multicolor", "custom"] },
            speed: { label: "Speed", options: ["calm", "balanced", "energetic", "custom"] }
        },
        dotParticles: {
            density: { label: "Density", options: ["low", "medium", "high", "custom"] },
            motionStyle: { label: "Motion Style", options: ["calm", "balanced", "energetic", "custom"] },
            directionBehavior: { label: "Direction Behavior", options: ["mostlyClockwise", "mostlyAnticlockwise", "beatReactive"] },
            glowStrength: { label: "Glow Strength", options: ["soft", "medium", "strong", "custom"] }
        },
        rippleFlow: {
            mode: { label: "Mode", options: ["sideRipples", "flatRipples"] },
            intensity: { label: "Intensity", options: ["low", "medium", "high", "custom"] },
            sensitivity: { label: "Sensitivity", options: ["low", "medium", "high", "custom"] },
            colorStyle: { label: "Color Style", options: ["red", "blue", "white", "custom"] }
        },
        snowBubbleParticles: {
            fallArea: { label: "Fall Area", options: ["middle", "fullWidth"] },
            density: { label: "Density", options: ["low", "medium", "high", "custom"] },
            motionStyle: { label: "Motion Style", options: ["calm", "balanced", "energetic", "custom"] },
            glowStrength: { label: "Glow Strength", options: ["soft", "medium", "strong", "custom"] },
            particleSize: { label: "Particle Size", options: ["small", "medium", "large", "custom"] }
        },
        edgeCrystals: {
            colorStyle: { label: "Color Style", options: ["blue", "purple", "red", "white", "custom"] },
            flutterStyle: { label: "Flutter Style", options: ["soft", "balanced", "energetic", "custom"] },
            density: { label: "Density", options: ["low", "medium", "high", "custom"] },
            glowStrength: { label: "Glow Strength", options: ["soft", "medium", "strong", "custom"] },
            edgeMode: { label: "Edge Mode", options: ["left", "right", "both"] }
        },
        sideBraids: {
            colorStyle: { label: "Color Style", options: ["cyanPink", "bluePurple", "redBlue", "white", "custom"] },
            braidDensity: { label: "Braid Density", options: ["sparse", "medium", "dense", "custom"] },
            motionStyle: { label: "Motion Style", options: ["calm", "balanced", "energetic", "custom"] },
            glowStrength: { label: "Glow Strength", options: ["soft", "medium", "strong", "custom"] },
            braidWidth: { label: "Braid Width", options: ["thin", "medium", "thick", "custom"] },
            flowDirection: { label: "Flow Direction", options: ["topDown", "bottomUp"] }
        },
        crimsonDusk: {
            barMode: { label: "Bar Mode", options: ["bottom", "bottomCompact", "side", "both"] },
            barThickness: { label: "Bar Thickness", options: ["thin", "medium", "thick", "custom"] },
            barCount: { label: "Bar Count", options: ["sparse", "medium", "dense"] },
            glowStrength: { label: "Glow Strength", options: ["soft", "medium", "strong"] },
            sensitivity: { label: "Sensitivity", options: ["low", "medium", "high", "custom"] },
            filmGrain: { label: "Film Grain", options: ["off", "on"] }
        },
        auroraDrift: {
            auroraStyle: { label: "Aurora Style", options: ["ambient", "cinematic", "energetic"] },
            intensity: { label: "Intensity", options: ["subtle", "balanced", "vivid"] },
            height: { label: "Height", options: ["low", "medium", "tall"] },
            glowStrength: { label: "Glow Strength", options: ["soft", "medium", "strong"] },
            motionSpeed: { label: "Motion Speed", options: ["calm", "balanced", "fast"] },
            colorPalette: { label: "Color Palette", options: ["cyanViolet", "emeraldSky", "sunsetDream", "frozenBlue", "monochrome"] },
            audioReactivity: { label: "Audio Reactivity", options: ["subtle", "balanced", "responsive"] },
            softness: { label: "Softness", options: ["misty", "smooth", "defined"] },
            layerDensity: { label: "Layer Density", options: ["light", "balanced", "rich"] }
        }
    };

    let cachedSettings = {};

    function renderThemeSettings(themeId) {
        const container = document.getElementById('dynamic-theme-settings');
        container.innerHTML = '';
        const schema = THEMES_SCHEMA[themeId];
        if (!schema) return;
        
        const currentThemeObj = cachedSettings[themeId] || {};

        for (const [key, prop] of Object.entries(schema)) {
            const div = document.createElement('div');
            div.className = 'input-group';
            div.style.marginBottom = '16px';
            
            const label = document.createElement('label');
            label.textContent = prop.label;
            div.appendChild(label);
            
            const select = document.createElement('select');
            select.className = 'styled-select theme-trigger';
            select.dataset.key = key;
            
            for (const opt of prop.options) {
                const option = document.createElement('option');
                option.value = opt;
                // capitalize first letter and format camelCase
                let humanStr = opt.replace(/([A-Z])/g, ' $1');
                humanStr = humanStr.charAt(0).toUpperCase() + humanStr.slice(1);
                option.textContent = humanStr;
                select.appendChild(option);
            }
            
            if (currentThemeObj[key]) {
                select.value = currentThemeObj[key];
            }
            
            select.addEventListener('change', dispatchThemeUpdate);
            
            div.appendChild(select);
            container.appendChild(div);
        }
        
        updateAdvancedSliders(themeId);
        if (typeof toggleAdvancedControls === 'function') {
            toggleAdvancedControls(themeId);
        }
    }

    function updateAdvancedSliders(theme) {
        const customThickness = document.getElementById('container-customThickness');
        const customGap = document.getElementById('container-customGap');
        const customSensitivity = document.getElementById('container-customSensitivity');
        const customSpeed = document.getElementById('container-customSpeed');
        
        const schema = THEMES_SCHEMA[theme];
        let showThick = false, showGap = false, showSens = false, showSpeed = false;
        
        if (schema) {
            if ('barThickness' in schema || 'borderThickness' in schema || 'segmentLength' in schema || 'particleSize' in schema || 'braidWidth' in schema) {
                showThick = true;
                document.getElementById('label-customThickness').textContent = 
                    'barThickness' in schema ? "Bar Thickness" :
                    'borderThickness' in schema ? "Border Thickness" :
                    'segmentLength' in schema ? "Segment Length" :
                    'braidWidth' in schema ? "Braid Thickness" : "Particle Size";
            }
            
            if ('barDensity' in schema || 'density' in schema || 'braidDensity' in schema) {
                showGap = true;
                document.getElementById('label-customGap').textContent = 
                    'barDensity' in schema ? "Bar Gap" :
                    'braidDensity' in schema ? "Braid Density" : "Density Gap";
            }
            
            if ('sensitivity' in schema || 'intensity' in schema || 'speed' in schema || 'speedMode' in schema || 'motionStyle' in schema || 'flutterStyle' in schema) {
                showSens = true;
                document.getElementById('label-customSensitivity').textContent = 
                    'sensitivity' in schema ? "Sensitivity" :
                    'intensity' in schema ? "Intensity" :
                    'flutterStyle' in schema ? "Flutter Energy" : "Speed / Motion";
            }

            if ('speed' in schema || 'speedMode' in schema || 'motionStyle' in schema || 'flutterStyle' in schema) {
                showSpeed = true;
                document.getElementById('label-customSpeed').textContent = 
                    'flutterStyle' in schema ? "Flutter Speed" : "Movement Speed";
            }
        }
        
        customThickness.style.display = showThick ? 'block' : 'none';
        customGap.style.display = showGap ? 'block' : 'none';
        customSensitivity.style.display = showSens ? 'block' : 'none';
        customSpeed.style.display = showSpeed ? 'block' : 'none';
    }

    // ----------------------------------------
    // THEME AUTOMATION AGENT BINDINGS
    // ----------------------------------------
    const enableThemeAutomation = document.getElementById('enableThemeAutomation');
    const themeAutoControls = document.getElementById('themeAutoControls');
    const intervalMinutes = document.getElementById('intervalMinutes');
    const dayThemeSelect = document.getElementById('dayThemeSelect');
    const nightThemeSelect = document.getElementById('nightThemeSelect');
    const dayStartHourInput = document.getElementById('dayStartHourInput');
    const nightStartHourInput = document.getElementById('nightStartHourInput');

    function formatHour(hour) {
        if (hour === 0) return '12 AM';
        if (hour === 12) return '12 PM';
        return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    }

    function updateThemeLabels(dayStart, nightStart) {
        const dayThemeLabel = document.getElementById('dayThemeLabel');
        const nightThemeLabel = document.getElementById('nightThemeLabel');
        if (dayThemeLabel) {
            dayThemeLabel.textContent = `Daytime Theme (${formatHour(dayStart)} - ${formatHour(nightStart)}):`;
        }
        if (nightThemeLabel) {
            nightThemeLabel.textContent = `Nighttime Theme (${formatHour(nightStart)} - ${formatHour(dayStart)}):`;
        }
    }

    let automationErrorTimeout = null;
    function showAutomationError(message) {
        const errorEl = document.getElementById('theme-automation-error');
        if (!errorEl) return;
        errorEl.textContent = message;
        errorEl.style.opacity = '1';
        if (automationErrorTimeout) clearTimeout(automationErrorTimeout);
        automationErrorTimeout = setTimeout(() => {
            errorEl.style.opacity = '0';
        }, 3000);
    }

    function toggleAutoControls(isEnabled) {
        if (themeAutoControls) {
            themeAutoControls.style.display = isEnabled ? 'block' : 'none';
        }
    }

    function updateAutomationSetting(patch) {
        if (window.visualizerSettings) {
            const currentAutomation = cachedSettings.themeAutomation || {};
            const nextAutomation = { ...currentAutomation, ...patch };
            cachedSettings.themeAutomation = nextAutomation; // Optimistic local cache update!
            window.visualizerSettings.update({
                themeAutomation: nextAutomation
            });
        }
    }

    if (enableThemeAutomation) {
        enableThemeAutomation.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            toggleAutoControls(isChecked);
            updateAutomationSetting({ enabled: isChecked });
        });
    }

    if (intervalMinutes) {
        intervalMinutes.addEventListener('change', (e) => {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val)) {
                val = 30;
            }
            // Clamp to the input's declared min/max (1-120) so the UI value
            // always matches what actually gets saved and used.
            val = Math.max(1, Math.min(120, val));
            intervalMinutes.value = val;
            updateAutomationSetting({ checkIntervalMinutes: val });
        });
    }

    if (dayThemeSelect) {
        dayThemeSelect.addEventListener('change', (e) => {
            updateAutomationSetting({ dayTheme: e.target.value });
        });
    }

    if (nightThemeSelect) {
        nightThemeSelect.addEventListener('change', (e) => {
            updateAutomationSetting({ nightTheme: e.target.value });
        });
    }

    if (dayStartHourInput) {
        dayStartHourInput.addEventListener('change', (e) => {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val) || val < 0 || val > 23) {
                val = 6;
                dayStartHourInput.value = val;
            }
            const nightStart = nightStartHourInput ? parseInt(nightStartHourInput.value, 10) : 18;
            if (val === nightStart) {
                showAutomationError("Day and Night hours cannot be identical.");
                val = cachedSettings.themeAutomation?.dayStartHour ?? 6;
                dayStartHourInput.value = val;
            }
            updateAutomationSetting({ dayStartHour: val });
            updateThemeLabels(val, isNaN(nightStart) ? 18 : nightStart);
        });
    }

    if (nightStartHourInput) {
        nightStartHourInput.addEventListener('change', (e) => {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val) || val < 0 || val > 23) {
                val = 18;
                nightStartHourInput.value = val;
            }
            const dayStart = dayStartHourInput ? parseInt(dayStartHourInput.value, 10) : 6;
            if (val === dayStart) {
                showAutomationError("Day and Night hours cannot be identical.");
                val = cachedSettings.themeAutomation?.nightStartHour ?? 18;
                nightStartHourInput.value = val;
            }
            updateAutomationSetting({ nightStartHour: val });
            updateThemeLabels(isNaN(dayStart) ? 6 : dayStart, val);
        });
    }

    // ----------------------------------------
    // FOCUS MODE BINDINGS
    // ----------------------------------------
    const focusModeCheckbox = document.getElementById('focus-mode-checkbox');
    const focusModeSettingsContainer = document.getElementById('focus-mode-settings-container');
    const focusModeDimOpacity = document.getElementById('focus-mode-dim-opacity');
    const focusModeIdleTimeout = document.getElementById('focus-mode-idle-timeout');
    const focusModeTransitionDuration = document.getElementById('focus-mode-transition-duration');

    function toggleFocusModeControls(isEnabled) {
        if (focusModeSettingsContainer) {
            focusModeSettingsContainer.style.display = isEnabled ? 'block' : 'none';
        }
    }

    function updateFocusModeSetting(patch) {
        if (window.visualizerSettings) {
            const currentFocusMode = cachedSettings.focusMode || {};
            const nextFocusMode = { ...currentFocusMode, ...patch };
            cachedSettings.focusMode = nextFocusMode; // Optimistic local cache update
            window.visualizerSettings.update({
                focusMode: nextFocusMode
            });
        }
    }

    if (focusModeCheckbox) {
        focusModeCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            toggleFocusModeControls(isChecked);
            updateFocusModeSetting({ enabled: isChecked });
        });
    }

    if (focusModeDimOpacity) {
        focusModeDimOpacity.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) / 100;
            const valEl = document.getElementById('val-focus-mode-dim-opacity');
            if (valEl) valEl.textContent = `${e.target.value}%`;
            updateFocusModeSetting({ dimOpacity: val });
        });
    }

    if (focusModeIdleTimeout) {
        focusModeIdleTimeout.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 5;
            const valEl = document.getElementById('val-focus-mode-idle-timeout');
            if (valEl) valEl.textContent = `${val}s`;
            updateFocusModeSetting({ idleTimeout: val });
        });
    }

    if (focusModeTransitionDuration) {
        focusModeTransitionDuration.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 1.5;
            const valEl = document.getElementById('val-focus-mode-transition-duration');
            if (valEl) valEl.textContent = `${val.toFixed(1)}s`;
            updateFocusModeSetting({ transitionDuration: val });
        });
    }

    // ----------------------------------------
    // COLOR MODULATION BINDINGS
    // ----------------------------------------
    const colorModulationMode = document.getElementById('color-modulation-mode');
    const colorModulationControls = document.getElementById('color-modulation-controls');
    const colorModulationSensitivity = document.getElementById('color-modulation-sensitivity');
    const colorModulationSpeed = document.getElementById('color-modulation-speed');

    function toggleColorModulationControls(mode) {
        if (!colorModulationControls) return;
        if (mode === 'none') {
            colorModulationControls.style.display = 'none';
        } else {
            colorModulationControls.style.display = 'block';
            
            // Show/hide sensitivity based on mode
            const sensitivityContainer = document.getElementById('container-modulation-sensitivity');
            if (sensitivityContainer) {
                sensitivityContainer.style.display = mode === 'beat' ? 'block' : 'none';
            }
        }
    }

    function updateColorModulationSetting(patch) {
        if (window.visualizerSettings) {
            const currentMod = cachedSettings.colorModulation || {};
            const nextMod = { ...currentMod, ...patch };
            cachedSettings.colorModulation = nextMod;
            window.visualizerSettings.update({
                colorModulation: nextMod
            });
        }
    }

    if (colorModulationMode) {
        colorModulationMode.addEventListener('change', (e) => {
            const mode = e.target.value;
            toggleColorModulationControls(mode);
            updateColorModulationSetting({
                enabled: mode !== 'none',
                mode: mode === 'none' ? 'amplitude' : mode
            });
        });
    }

    if (colorModulationSensitivity) {
        colorModulationSensitivity.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 1.3;
            const valEl = document.getElementById('val-color-modulation-sensitivity');
            if (valEl) valEl.textContent = val.toFixed(1);
            updateColorModulationSetting({ sensitivity: val });
        });
    }

    if (colorModulationSpeed) {
        colorModulationSpeed.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0.10;
            const valEl = document.getElementById('val-color-modulation-speed');
            if (valEl) valEl.textContent = val.toFixed(2);
            updateColorModulationSetting({ transitionSpeed: val });
        });
    }

    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            const themeId = e.target.value;
            syncThemeUI(themeId);

            // Also trigger an update to actually switch the active visualizer theme
            if (window.visualizerSettings) {
                window.visualizerSettings.update({
                    selectedTheme: themeId
                });
            }
        });
    }


    const performanceModeSelector = document.getElementById('performance-mode-selector');
    if (performanceModeSelector) {
        performanceModeSelector.addEventListener('change', (e) => {
            if (window.visualizerSettings) {
                window.visualizerSettings.update({
                    performanceMode: e.target.value
                });
            }
        });
    }

    const launchCheckbox = document.getElementById('launch-on-startup-checkbox');
    if (launchCheckbox) {
        launchCheckbox.addEventListener('change', (e) => {
            if (window.visualizerSettings) {
                window.visualizerSettings.update({
                    launchOnStartup: e.target.checked
                });
            }
        });
    }

    const fpsLimitSelector = document.getElementById('fps-limit-selector');
    if (fpsLimitSelector) {
        fpsLimitSelector.addEventListener('change', (e) => {
            updateFpsOutcomeDisplay(e.target.value);
            if (window.visualizerSettings) {
                window.visualizerSettings.update({
                    fpsLimit: e.target.value
                });
            }
        });
    }

    function updateFpsOutcomeDisplay(val) {
        document.querySelectorAll('.fps-outcome').forEach(el => el.style.display = 'none');
        const targetEl = document.getElementById(`fps-outcome-${val}`);
        if (targetEl) {
            targetEl.style.display = 'block';
        }
    }

    const colorModeSelector = document.getElementById('color-mode-selector');
    if (colorModeSelector) {
        colorModeSelector.addEventListener('change', (e) => {
            if (window.visualizerSettings) {
                window.visualizerSettings.update({
                    colorMode: e.target.value
                });
            }
        });
    }

    // ----------------------------------------
    // PRESET LOGIC (ADVANCED TAB)
    // ----------------------------------------
    const color1 = document.getElementById('color1');
    const color2 = document.getElementById('color2');
    const color3 = document.getElementById('color3');
    const presetSelector = document.getElementById('preset-selector');
    const savePresetBtn = document.getElementById('btn-save-preset');
    const presetNameInput = document.getElementById('preset-name-input');
    const themeProfileSelector = document.getElementById('theme-profile-selector');
    const themeProfileNameInput = document.getElementById('theme-profile-name');

    const btnSaveThemeProfile = document.getElementById('btn-save-theme-profile');
    const btnLoadThemeProfile = document.getElementById('btn-load-theme-profile');
    const btnDeleteThemeProfile = document.getElementById('btn-delete-theme-profile');
    const btnExportThemeProfile = document.getElementById('btn-export-theme-profile');
    const btnImportThemeProfile = document.getElementById('btn-import-theme-profile');
    const btnExportAllSettings = document.getElementById('btn-export-all-settings');
    const btnImportAllSettings = document.getElementById('btn-import-all-settings');
    const btnResetThemeProfile = document.getElementById('btn-reset-theme-profile');
    const btnDuplicateThemeProfile = document.getElementById("btnDuplicateThemeProfile");

    // Names that must not be used as object keys because they shadow prototype
    // properties, which would allow an attacker to corrupt the JS execution
    // context of the settings window via a crafted localStorage value.
    const RESERVED_PRESET_NAMES = new Set([
        "__proto__", "constructor", "prototype",
        "toString", "valueOf", "hasOwnProperty",
        "isPrototypeOf", "propertyIsEnumerable",
        "toLocaleString", "__defineGetter__", "__defineSetter__",
        "__lookupGetter__", "__lookupSetter__"
    ]);

    function isSafePresetName(name) {
        return (
            typeof name === "string" &&
            name.length > 0 &&
            name.length <= 64 &&
            !RESERVED_PRESET_NAMES.has(name)
        );
    }

    // -----------------------------------------------------------------------
    // Aurora preset sanitization
    // -----------------------------------------------------------------------
    // Numeric fields that every Aurora engine profile may contain, with their
    // allowed [min, max] range mirroring settingsStore.js sanitizeAuroraDrift().
    const AURORA_NUMERIC_FIELDS = {
        baseGlowRadius:       [0.1, 3.0],
        peakGlowRadius:       [0.1, 3.0],
        crestBrightness:      [0.1, 3.0],
        bloomStrength:        [0.0, 3.0],
        glowFalloff:          [0.1, 3.0],
        primaryFrequency:     [0.1, 3.0],
        secondaryFrequency:   [0.1, 3.0],
        turbulenceComplexity: [0.1, 3.0],
        motionSmoothness:     [0.1, 3.0],
        driftSpeed:           [0.0, 3.0],
        bassInfluence:        [0.0, 3.0],
        midInfluence:         [0.0, 3.0],
        highShimmer:          [0.0, 3.0],
        audioSmoothing:       [0.1, 3.0],
        peakSensitivity:      [0.1, 3.0],
        ribbonHeight:         [0.1, 3.0],
        ribbonWidth:          [0.1, 3.0],
        edgeSoftness:         [0.1, 3.0],
        layerSeparation:      [0.1, 3.0],
        crestSharpness:       [0.1, 3.0],
        layerCount:           [1,   6],
        backgroundHaze:       [0.0, 3.0],
        foregroundHighlight:  [0.0, 3.0],
        parallaxDepth:        [0.0, 3.0],
        ambientOpacity:       [0.0, 3.0],
        colorSaturation:      [0.0, 3.0],
        atmosphericFade:      [0.0, 3.0],
        edgeFeathering:       [0.0, 3.0]
    };

    /**
     * Accepts a raw value from localStorage and returns a sanitized Aurora
     * engine-profile object, or null if the input is fundamentally invalid.
     *
     * - Only known numeric keys are kept and clamped to their valid ranges.
     * - gradientStops is validated as an array of {pos, color} pairs.
     * - All other keys (including prototype-polluting names) are dropped.
     */
    function sanitizeAuroraPreset(raw) {
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;

        const out = {};

        // Validate and clamp every known numeric field
        for (const [field, [min, max]] of Object.entries(AURORA_NUMERIC_FIELDS)) {
            if (Object.prototype.hasOwnProperty.call(raw, field)) {
                const num = parseFloat(raw[field]);
                if (Number.isFinite(num)) {
                    out[field] = field === 'layerCount'
                        ? Math.round(Math.max(min, Math.min(max, num)))
                        : Math.max(min, Math.min(max, num));
                }
            }
        }

        // Validate gradientStops
        if (Array.isArray(raw.gradientStops)) {
            const stops = raw.gradientStops
                .filter(s => s !== null && typeof s === 'object' && !Array.isArray(s))
                .map(s => {
                    const pos = parseFloat(s.pos);
                    const color = typeof s.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(s.color)
                        ? s.color
                        : null;
                    return Number.isFinite(pos) && color ? { pos: Math.max(0, Math.min(1, pos)), color } : null;
                })
                .filter(Boolean);
            if (stops.length >= 2 && stops.length <= 6) {
                out.gradientStops = stops;
            }
        }

        // Require at least one meaningful field to be accepted
        if (Object.keys(out).length === 0) return null;

        return out;
    }

    let presets = {
        "Ocean Blue": ["#00f2fe", "#4facfe", "#8ee2ff"],
        "Sunset": ["#ff512f", "#f09819", "#ffb347"],
        "Cyberpunk": ["#ff003c", "#bf00ff", "#00e5ff"]
    };

    // Load from local storage if available
    const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
    try {
        const savedPresets = localStorage.getItem('paraline_presets');
        if (savedPresets) {
            const parsed = JSON.parse(savedPresets);
            // Only accept plain objects with safe keys and array values.
            if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
                const sanitized = {};
                for (const [key, val] of Object.entries(parsed)) {
                    if (
                        isSafePresetName(key) &&
                        Array.isArray(val) &&
                        val.length === 3 &&
                        val.every(c => typeof c === "string" && HEX_COLOR_RE.test(c))
                    ) {
                        sanitized[key] = val;
                    }
                }
                presets = sanitized;
            }
        }
    } catch(e) {}

    function updatePresetDropdown() {
        presetSelector.innerHTML = '<option value="" disabled selected>Select Preset...</option>';
        Object.keys(presets).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            presetSelector.appendChild(option);
        });
    }

    function loadPreset(name) {
        if (presets[name]) {
            color1.value = presets[name][0];
            color2.value = presets[name][1];
            color3.value = presets[name][2];
            dispatchCustomUpdate(); // trigger auto-save
        }
    }

    presetSelector.addEventListener('change', (e) => {
        loadPreset(e.target.value);
    });

    savePresetBtn.addEventListener('click', () => {
        const presetName = presetNameInput.value.trim();
        if (presetName !== "" && isSafePresetName(presetName)) {
            presets[presetName] = [color1.value, color2.value, color3.value];
            updatePresetDropdown();
            presetSelector.value = presetName;
            presetNameInput.value = '';
            
            try {
                localStorage.setItem('paraline_presets', JSON.stringify(presets));
            } catch(e) {}
        }
    });

    updatePresetDropdown();
    async function refreshThemeProfiles(selectedProfileName = "") {
    if (!window.paralineApp) return;

    const profiles = await window.paralineApp.getThemeProfiles();

    themeProfileSelector.innerHTML =
        '<option value="">Select Theme Profile</option>';

    Object.keys(profiles).forEach(profileName => {
        const option = document.createElement('option');

        option.value = profileName;
        option.textContent = profileName;

        themeProfileSelector.appendChild(option);
    });

    if (selectedProfileName && Object.prototype.hasOwnProperty.call(profiles, selectedProfileName)) {
        themeProfileSelector.value = selectedProfileName;
    }
}

refreshThemeProfiles();

    // ----------------------------------------
    // HOTKEY RECORDERS
    // ----------------------------------------
    let activeRecordingKey = null;
    let originalHotkeyVal = '';
    const hotkeyNames = {
        togglePause: 'Pause / Resume',
        toggleHide: 'Hide / Show',
        cycleTheme: 'Cycle Active Theme'
    };
    let statusTimeout = null;

    function showHotkeyStatus(message, isError = false, persistent = false) {
        const statusEl = document.getElementById('hotkey-status-msg');
        if (!statusEl) return;
        
        statusEl.textContent = message;
        statusEl.style.color = isError ? '#e74c3c' : '#2ecc71';
        statusEl.style.opacity = '1';
        
        if (statusTimeout) {
            clearTimeout(statusTimeout);
            statusTimeout = null;
        }
        
        if (!persistent) {
            statusTimeout = setTimeout(() => {
                statusEl.style.opacity = '0';
            }, 2500);
        }
    }

    // ----------------------------------------
    // PROFILE STATUS TOAST
    // ----------------------------------------
    const profileStatusTimers = {};

    /**
     * Shows an auto-dismissing inline status message instead of alert().
     * @param {string} elementId  - ID of the .profile-status-msg element
     * @param {string} message    - Text to display
     * @param {boolean} isError   - true for red error style, false for green success
     * @param {boolean} persistent - if true, never auto-hides
     */
    function showProfileStatus(elementId, message, isError = false, persistent = false) {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.textContent = message;
        el.className = 'profile-status-msg ' + (isError ? 'error' : 'success');

        // Trigger reflow so the transition fires even when class was already applied
        // eslint-disable-next-line no-unused-expressions
        el.offsetHeight;
        el.classList.add('visible');

        if (profileStatusTimers[elementId]) {
            clearTimeout(profileStatusTimers[elementId]);
            delete profileStatusTimers[elementId];
        }

        if (!persistent) {
            profileStatusTimers[elementId] = setTimeout(() => {
                el.classList.remove('visible');
            }, 3000);
        }
    }

    // ----------------------------------------
    // INLINE CONFIRM MODAL (replaces window.confirm)
    // ----------------------------------------

    /**
     * Shows a styled, non-blocking confirm dialog and resolves with the user's choice.
     * @param {string} message - Question to ask the user
     * @returns {Promise<boolean>} - resolves true (OK) or false (Cancel)
     */
    function showInlineConfirm(message) {
        return new Promise((resolve) => {
            const modal   = document.getElementById('inline-confirm-modal');
            const textEl  = document.getElementById('inline-confirm-text');
            const btnOk   = document.getElementById('btn-inline-confirm-ok');
            const btnCancel = document.getElementById('btn-inline-confirm-cancel');

            if (!modal || !textEl || !btnOk || !btnCancel) {
                // Fallback to native if DOM elements are missing
                resolve(window.confirm(message));
                return;
            }

            textEl.textContent = message;
            modal.classList.add('visible');

            function cleanup(result) {
                modal.classList.remove('visible');
                btnOk.removeEventListener('click', onOk);
                btnCancel.removeEventListener('click', onCancel);
                modal.removeEventListener('click', onBackdrop);
                resolve(result);
            }

            function onOk()      { cleanup(true);  }
            function onCancel()  { cleanup(false); }
            function onBackdrop(e) {
                if (e.target === modal) cleanup(false);
            }

            btnOk.addEventListener('click', onOk);
            btnCancel.addEventListener('click', onCancel);
            modal.addEventListener('click', onBackdrop);
        });
    }

    function dispatchHotkeyUpdate(settingKey, value) {
        if (!window.visualizerSettings) return;
        if (!cachedSettings.shortcuts) cachedSettings.shortcuts = {};
        cachedSettings.shortcuts[settingKey] = value;
        window.visualizerSettings.update({
            shortcuts: cachedSettings.shortcuts
        });
    }

    function initHotkeySettings() {
        const hotkeys = [
            { inputId: 'hotkey-toggle-pause', btnId: 'btn-edit-toggle-pause', clearBtnId: 'btn-clear-toggle-pause', key: 'togglePause' },
            { inputId: 'hotkey-toggle-hide', btnId: 'btn-edit-toggle-hide', clearBtnId: 'btn-clear-toggle-hide', key: 'toggleHide' },
            { inputId: 'hotkey-cycle-theme', btnId: 'btn-edit-cycle-theme', clearBtnId: 'btn-clear-cycle-theme', key: 'cycleTheme' }
        ];

        hotkeys.forEach(({ inputId, btnId, clearBtnId, key }) => {
            const input = document.getElementById(inputId);
            const btn = document.getElementById(btnId);
            const clearBtn = document.getElementById(clearBtnId);
            if (!input || !btn) return;

            // Handle Clear button click
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (activeRecordingKey !== null) return;
                    input.value = 'None';
                    dispatchHotkeyUpdate(key, 'None');
                    showHotkeyStatus(`✓ ${hotkeyNames[key]} hotkey cleared`);
                });
            }

            btn.addEventListener('click', () => {
                if (activeRecordingKey === null) {
                    // Enter Edit Mode
                    activeRecordingKey = key;
                    originalHotkeyVal = input.value;
                    
                    // Suspend global shortcuts in main process so they don't fire and block inputs
                    if (window.paralineApp && typeof window.paralineApp.suspendGlobalShortcuts === 'function') {
                        window.paralineApp.suspendGlobalShortcuts(true);
                    }

                    // Update UI for recording state
                    input.value = '';
                    input.placeholder = 'Press keys...';
                    input.style.borderColor = 'var(--accent)';
                    input.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.35)';
                    
                    const statusEl = document.getElementById('hotkey-status-msg');
                    if (statusEl) {
                        statusEl.style.opacity = '0';
                    }
                    
                    btn.textContent = 'Cancel';
                    btn.style.borderColor = '#e74c3c';
                    btn.style.color = '#e74c3c';
                    
                    // Disable other buttons and ALL clear buttons
                    hotkeys.forEach(hk => {
                        if (hk.key !== key) {
                            const otherBtn = document.getElementById(hk.btnId);
                            if (otherBtn) otherBtn.disabled = true;
                        }
                        const otherClearBtn = document.getElementById(hk.clearBtnId);
                        if (otherClearBtn) otherClearBtn.disabled = true;
                    });
                    
                    input.focus();
                } else if (activeRecordingKey === key) {
                    // Cancel Edit Mode
                    exitEditMode(key, false);
                }
            });

            input.addEventListener('keydown', (e) => {
                if (activeRecordingKey !== key) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                // Discard edit if Escape is pressed
                if (e.key === 'Escape') {
                    exitEditMode(key, false);
                    return;
                }

                // Clear hotkey if Backspace or Delete is pressed
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    input.value = 'None';
                    dispatchHotkeyUpdate(key, 'None');
                    exitEditMode(key, true);
                    showHotkeyStatus(`✓ ${hotkeyNames[key]} hotkey cleared`);
                    return;
                }

                const parts = [];
                if (e.ctrlKey) parts.push('Ctrl');
                if (e.altKey) parts.push('Alt');
                if (e.shiftKey) parts.push('Shift');

                // If currently pressing a pure modifier key, display it in the box with "+..."
                if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
                    if (parts.length > 0) {
                        input.value = parts.join('+') + '+...';
                    } else {
                        input.value = '';
                    }
                    return;
                }

                const domToElectronKeyMap = {
                    'ArrowUp': 'Up',
                    'ArrowDown': 'Down',
                    'ArrowLeft': 'Left',
                    'ArrowRight': 'Right',
                    '+': 'Plus',
                    ' ': 'Space'
                };

                let keyName = e.key;
                if (domToElectronKeyMap[keyName]) {
                    keyName = domToElectronKeyMap[keyName];
                } else if (keyName.length === 1) {
                    keyName = keyName.toUpperCase();
                }

                // Guard: Require at least one modifier key or a function key
                if (parts.length === 0 && !/^F[1-9][0-2]?$/.test(keyName)) {
                    return;
                }

                parts.push(keyName);
                const shortcutStr = parts.join('+');

                // Check for duplicates
                let duplicateKey = null;
                const currentShortcuts = cachedSettings.shortcuts || {};
                for (const [sKey, sVal] of Object.entries(currentShortcuts)) {
                    if (sKey !== key && sVal && sVal !== 'None' && sVal.toLowerCase().replace(/\s+/g, '') === shortcutStr.toLowerCase().replace(/\s+/g, '')) {
                        duplicateKey = sKey;
                        break;
                    }
                }

                if (duplicateKey) {
                    showHotkeyStatus(`✗ Conflict: Already assigned to "${hotkeyNames[duplicateKey]}"`, true);
                    exitEditMode(key, false);
                    return;
                }

                input.value = shortcutStr;
                dispatchHotkeyUpdate(key, shortcutStr);
                exitEditMode(key, true);
                showHotkeyStatus(`✓ ${hotkeyNames[key]} hotkey updated to ${shortcutStr}`);
            });
            
            // Prevent manual focus / typing without edit mode active
            input.addEventListener('mousedown', (e) => {
                if (activeRecordingKey !== key) {
                    e.preventDefault();
                    input.blur();
                }
            });

            // Handle focus loss
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    if (activeRecordingKey === key && document.activeElement !== btn) {
                        exitEditMode(key, false);
                    }
                }, 150);
            });
        });

        function exitEditMode(key, save = false) {
            const hk = hotkeys.find(h => h.key === key);
            if (!hk) return;
            const input = document.getElementById(hk.inputId);
            const btn = document.getElementById(hk.btnId);
            if (!input || !btn) return;

            activeRecordingKey = null;

            // Re-enable global shortcuts
            if (window.paralineApp && typeof window.paralineApp.suspendGlobalShortcuts === 'function') {
                window.paralineApp.suspendGlobalShortcuts(false);
            }
            
            // Reset input visual style
            input.placeholder = 'Press keys...';
            input.style.borderColor = '';
            input.style.boxShadow = '';
            if (!save) {
                input.value = originalHotkeyVal;
            }

            // Reset button style
            btn.textContent = 'Edit';
            btn.style.borderColor = '';
            btn.style.color = '';

            // Re-enable all buttons
            hotkeys.forEach(h => {
                const otherBtn = document.getElementById(h.btnId);
                if (otherBtn) otherBtn.disabled = false;
                const otherClearBtn = document.getElementById(h.clearBtnId);
                if (otherClearBtn) otherClearBtn.disabled = false;
            });
        }
    }

    initHotkeySettings();

    function checkHotkeyRegistrationFailures(settings) {
        const pauseInput = document.getElementById('hotkey-toggle-pause');
        const hideInput = document.getElementById('hotkey-toggle-hide');
        const cycleInput = document.getElementById('hotkey-cycle-theme');
        
        const failures = settings.shortcutRegistrationFailures || {};
        const checkFailure = (input, key) => {
            if (!input) return;
            if (failures[key]) {
                input.style.borderColor = '#e74c3c';
                input.style.boxShadow = '0 0 5px rgba(231, 76, 60, 0.35)';
                input.title = 'Failed to register: Shortcut might be in use by another application.';
            } else {
                input.style.borderColor = '';
                input.style.boxShadow = '';
                input.title = '';
            }
        };
        checkFailure(pauseInput, 'togglePause');
        checkFailure(hideInput, 'toggleHide');
        checkFailure(cycleInput, 'cycleTheme');
        
        const failedNames = [];
        if (failures.togglePause) failedNames.push('Pause / Resume');
        if (failures.toggleHide) failedNames.push('Hide / Show');
        if (failures.cycleTheme) failedNames.push('Cycle Theme');
        
        if (failedNames.length > 0) {
            const msg = `⚠️ Failed to register: "${failedNames.join(', ')}" (taken by another app). Try another hotkey.`;
            showHotkeyStatus(msg, true, true);
        } else {
            const statusEl = document.getElementById('hotkey-status-msg');
            if (statusEl && statusEl.textContent.includes('Failed to register') && !statusTimeout) {
                statusEl.style.opacity = '0';
            }
        }
    }

    // ----------------------------------------
    // SLIDER UPDATES
    // ----------------------------------------
    const thicknessSlider = document.getElementById('customThickness');
    const gapSlider = document.getElementById('customGap');
    const sensitivitySlider = document.getElementById('customSensitivity');
    const speedSlider = document.getElementById('customSpeed');
    
    thicknessSlider.addEventListener('input', (e) => {
        document.getElementById('val-customThickness').textContent = `${e.target.value}`;
        dispatchCustomUpdate();
    });
    gapSlider.addEventListener('input', (e) => {
        document.getElementById('val-customGap').textContent = `${e.target.value}`;
        dispatchCustomUpdate();
    });
    sensitivitySlider.addEventListener('input', (e) => {
        document.getElementById('val-customSensitivity').textContent = `${(e.target.value / 10).toFixed(1)}`;
        dispatchCustomUpdate();
    });
    speedSlider.addEventListener('input', (e) => {
        document.getElementById('val-customSpeed').textContent = `${(e.target.value / 10).toFixed(1)}`;
        dispatchCustomUpdate();
    });

    function syncThemeUI(themeId) {
        renderThemeSettings(themeId);
        
        // Hide color modulation container for unsupported themes
        const modulationContainer = document.getElementById('color-modulation-container');
        if (modulationContainer) {
            const supportsModulation = (themeId === 'reactiveBorder' || themeId === 'flowBorder');
            modulationContainer.style.display = supportsModulation ? 'block' : 'none';
        }
        
        // Load custom colors of the newly selected theme if they exist, or fall back to global custom colors
        const themeData = cachedSettings[themeId] || {};
        if (themeData.customColors && themeData.customColors.length === 3) {
            color1.value = themeData.customColors[0];
            color2.value = themeData.customColors[1];
            color3.value = themeData.customColors[2];
        } else if (cachedSettings.customColors && cachedSettings.customColors.length === 3) {
            color1.value = cachedSettings.customColors[0];
            color2.value = cachedSettings.customColors[1];
            color3.value = cachedSettings.customColors[2];
        } else {
            color1.value = "#00f2fe";
            color2.value = "#4facfe";
            color3.value = "#8ee2ff";
        }
        
        // Load custom sliders
        thicknessSlider.value = themeData.customThickness || 4;
        gapSlider.value = themeData.customGap || 7;
        sensitivitySlider.value = themeData.customSensitivity || 30;
        speedSlider.value = themeData.customSpeed || 30;
        
        document.getElementById('val-customThickness').textContent = thicknessSlider.value;
        document.getElementById('val-customGap').textContent = gapSlider.value;
        document.getElementById('val-customSensitivity').textContent = (sensitivitySlider.value / 10).toFixed(1);
        document.getElementById('val-customSpeed').textContent = (speedSlider.value / 10).toFixed(1);
    }

    // ----------------------------------------
    // AUTO-SAVE / IPC INTEGRATION
    // ----------------------------------------

    function dispatchThemeUpdate() {
        if (!window.visualizerSettings) return;
        if (!themeSelector) return;
        const selectedTheme = themeSelector.value;
        const dropdowns = document.querySelectorAll('#dynamic-theme-settings .theme-trigger');
        
        const themePatch = {};
        dropdowns.forEach(dd => {
            themePatch[dd.dataset.key] = dd.value;
        });

        if (!cachedSettings[selectedTheme]) cachedSettings[selectedTheme] = {};
        Object.assign(cachedSettings[selectedTheme], themePatch);

        window.visualizerSettings.update({
            selectedTheme: selectedTheme,
            [selectedTheme]: themePatch
        });
    }

    function dispatchCustomUpdate() {
        if (!window.visualizerSettings) return;
        if (!themeSelector) return;
        const activeTheme = themeSelector.value;
        
        // Let's ensure the dropdown in the UI switches to "custom" if there's a colorStyle equivalent
        const themePatch = {};
        const schema = THEMES_SCHEMA[activeTheme];
        
        const colorKeys = ['tone', 'colorStyle'];
        const thickKeys = ['barThickness', 'borderThickness', 'segmentLength', 'particleSize', 'braidWidth'];
        const gapKeys = ['barDensity', 'density', 'braidDensity'];
        const sensKeys = ['sensitivity', 'intensity', 'speed', 'speedMode', 'motionStyle', 'flutterStyle'];

        colorKeys.forEach(k => { if (schema[k]) themePatch[k] = "custom"; });
        thickKeys.forEach(k => { if (schema[k]) themePatch[k] = "custom"; });
        gapKeys.forEach(k => { if (schema[k]) themePatch[k] = "custom"; });
        sensKeys.forEach(k => { if (schema[k]) themePatch[k] = "custom"; });

        themePatch.customColors = [ color1.value, color2.value, color3.value ];
        themePatch.customThickness = parseInt(thicknessSlider.value, 10);
        themePatch.customGap = parseInt(gapSlider.value, 10);
        themePatch.customSensitivity = parseInt(sensitivitySlider.value, 10);
        themePatch.customSpeed = parseInt(speedSlider.value, 10);

        if (!cachedSettings[activeTheme]) cachedSettings[activeTheme] = {};
        Object.assign(cachedSettings[activeTheme], themePatch);
        if (schema.colorStyle) cachedSettings[activeTheme].colorStyle = "custom";
        if (schema.tone) cachedSettings[activeTheme].tone = "custom";
        cachedSettings.customColors = themePatch.customColors;
        renderThemeSettings(activeTheme); // Refresh UI dropdowns to show 'Custom' selected

        window.visualizerSettings.update({
            selectedTheme: activeTheme,
            [activeTheme]: themePatch,
            customColors: themePatch.customColors
        });
    }

    document.querySelectorAll('.custom-trigger').forEach(el => {
        if (el.type === 'color') {
            el.addEventListener('input', dispatchCustomUpdate); 
        }
    });

    // ----------------------------------------
    // ACTIONS & EXTERNAL LINKS
    // ----------------------------------------
    if (window.paralineApp) {
        const btnHide = document.getElementById('btn-hide');
        const btnPause = document.getElementById('btn-pause');
        const btnReload = document.getElementById('btn-reload');
        const btnGithub = document.getElementById('btn-github');
        const btnUpdates = document.getElementById('btn-updates');
        const btnLanding = document.getElementById('btn-landing');
        const btnResetTheme = document.getElementById('btn-reset-theme');
        if (btnResetTheme) {
            btnResetTheme.addEventListener('click', async () => {
                const ok = await showInlineConfirm("Reset theme settings to default?");
                if (ok) {
                    await window.paralineApp.resetActiveThemeSettings();
                    location.reload();
                }
            });
        }
        function isValidProfileName(name) {
            if (typeof name !== "string" || name.trim() === "") {
                return { valid: false, message: "Profile name cannot be empty." };
            }
            if (name.length > 64) {
                return { valid: false, message: "Profile name cannot exceed 64 characters." };
            }
            const reserved = new Set(["__proto__", "constructor", "prototype"]);
            if (reserved.has(name)) {
                return { valid: false, message: `Profile name "${name}" is a reserved system word. Please use a different name.` };
            }
            const safePattern = /^[A-Za-z0-9 _\-()À-ɏ]{1,64}$/;
            if (!safePattern.test(name)) {
                return { valid: false, message: "Profile name contains invalid characters. Use only letters, numbers, spaces, hyphens, underscores, or parentheses." };
            }
            return { valid: true };
        }

        btnSaveThemeProfile.addEventListener('click', async () => {
            const profileName = themeProfileNameInput.value.trim();

            if (!profileName) {
                showProfileStatus('profile-status-msg', "Profile name cannot be empty.", true);
                return;
            }

            const validation = isValidProfileName(profileName);
            if (!validation.valid) {
                showProfileStatus('profile-status-msg', validation.message, true);
                return;
            }

            const result = await window.paralineApp.saveThemeProfile(profileName);
            if (!result) {
                showProfileStatus('profile-status-msg', `Failed to save profile "${profileName}". The name is invalid or rejected by the system.`, true);
                return;
            }

            themeProfileNameInput.value = '';
            showProfileStatus('profile-status-msg', `✓ Theme profile "${profileName}" saved!`);

            refreshThemeProfiles();
        });

        btnLoadThemeProfile.addEventListener('click', async () => {
            const selectedProfile = themeProfileSelector.value;

            if (!selectedProfile) return;

            const settings =
                await window.paralineApp.loadThemeProfile(selectedProfile);

            if (!settings) return;

            // Instantly reloads the page to perfectly synchronize all sliders, colors, and controls in the UI
            location.reload();
        });

        btnDeleteThemeProfile.addEventListener('click', async () => {
            const selectedProfile = themeProfileSelector.value;

            if (!selectedProfile) return;

            await window.paralineApp.deleteThemeProfile(selectedProfile);
            showProfileStatus('profile-status-msg', `✓ Theme profile deleted successfully.`);

            refreshThemeProfiles();
        });

        btnDuplicateThemeProfile.addEventListener("click", async () => {
            const selectedProfile = themeProfileSelector.value;
            if (!selectedProfile) return;

            try {
                const result = await window.paralineApp.duplicateThemeProfile(selectedProfile);

                if (!result || !result.success) {
                    showProfileStatus('profile-status-msg', result?.error || "Failed to duplicate profile", true);
                    return;
                }

                showProfileStatus('profile-status-msg', `✓ Profile duplicated as "${result.profileName}"`);
                await refreshThemeProfiles(result.profileName);
            } catch (error) {
                showProfileStatus('profile-status-msg', "Failed to duplicate profile", true);
                console.error(error);
            }
        });

        btnExportThemeProfile.addEventListener('click', async () => {
            const selectedProfile = themeProfileSelector.value;

            if (!selectedProfile) return;

            const res = await window.paralineApp.exportThemeProfile(selectedProfile);
            if (res && res.success) {
                showProfileStatus('profile-status-msg', "✓ Theme profile exported successfully!");
            }
        });

        btnImportThemeProfile.addEventListener('click', async () => {
            const res = await window.paralineApp.importThemeProfile();

            if (res && res.success) {
                showProfileStatus('profile-status-msg', `✓ Theme profile "${res.profileName}" imported successfully!`);
                refreshThemeProfiles();
            } else if (res && res.error) {
                showProfileStatus('profile-status-msg', `Failed to import theme: ${res.error}`, true);
            }
        });

        if (btnExportAllSettings) {
            btnExportAllSettings.addEventListener('click', async () => {
                const res = await window.paralineApp.exportAllSettings();

                if (res && res.success) {
                    showProfileStatus('backup-status-msg', "✓ Settings backup exported successfully!");
                } else if (res && res.error) {
                    showProfileStatus('backup-status-msg', `Failed to export settings backup: ${res.error}`, true);
                }
            });
        }

        if (btnImportAllSettings) {
            btnImportAllSettings.addEventListener('click', async () => {
                const ok = await showInlineConfirm("Import a settings backup? This will replace your current settings and theme profiles.");
                if (!ok) return;

                const res = await window.paralineApp.importAllSettings();

                if (res && res.success) {
                    showProfileStatus('backup-status-msg', "✓ Settings backup imported! Reloading...");
                    setTimeout(() => location.reload(), 1200);
                } else if (res && res.error) {
                    showProfileStatus('backup-status-msg', `Failed to import settings backup: ${res.error}`, true);
                }
            });
        }

        btnResetThemeProfile.addEventListener('click', async () => {
            const ok = await showInlineConfirm("Are you sure you want to restore default settings? This will reset all your theme customizations.");
            if (ok) {
                await window.paralineApp.resetThemeSettings();
                location.reload();
            }
        });

        btnHide.addEventListener('click', async () => {
            const isHidden = await window.paralineApp.toggleHide();
            updateHideButtonState(isHidden);
        });

        btnPause.addEventListener('click', async () => {
            const isPaused = await window.paralineApp.togglePause();
            updatePauseButtonState(isPaused);
        });

        btnReload.addEventListener('click', () => {
            window.paralineApp.reloadVisualizer();
        });

        btnGithub.addEventListener('click', () => {
            window.paralineApp.openExternal("https://github.com/SamXop123/Paraline");
        });

        btnUpdates.addEventListener('click', () => {
            window.paralineApp.openExternal("https://github.com/SamXop123/Paraline/releases");
        });

        btnLanding.addEventListener('click', () => {
            window.paralineApp.openExternal("https://paraline.vercel.app");
        });
    }

    function updateHideButtonState(isHidden) {
        const btnHide = document.getElementById('btn-hide');
        if (!btnHide) return;
        if (isHidden) {
            btnHide.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Show Visualizer
            `;
        } else {
            btnHide.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                Hide Visualizer
            `;
        }
    }

    function updatePauseButtonState(isPaused) {
        const btnPause = document.getElementById('btn-pause');
        if (!btnPause) return;
        if (isPaused) {
            btnPause.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Resume Visualizer
            `;
        } else {
            btnPause.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                Pause Visualizer
            `;
        }
    }

    // Load Initial State
    if (window.visualizerSettings) {
        window.visualizerSettings.get().then(settings => {
        .catch(err => console.error(err))