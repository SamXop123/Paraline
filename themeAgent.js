class ThemeAgent {
  constructor(settingsStore, applyThemeCallback) {
    this.settingsStore = settingsStore;
    this.applyThemeCallback = applyThemeCallback;
    this.intervalId = null;
  }

  start() {
    this.stop(); 
    
    const storeData = this.settingsStore.load() || {};
    const config = storeData.themeAutomation;
    
    // Defensive check: Ensure config is a valid object and is enabled
    if (!config || typeof config !== 'object' || !config.enabled) return;

    // Guard: Prevent invalid, negative, or tight-loop intervals (minimum 1 minute)
    let minutes = parseInt(config.checkIntervalMinutes, 10);
    if (isNaN(minutes) || minutes < 1) {
      minutes = 30; // Safe default fallback
    }
    const intervalMs = minutes * 60 * 1000;
    
    this.evaluateAndApplyTheme(config);
    
    this.intervalId = setInterval(() => {
      const currentStoreData = this.settingsStore.load() || {};
      const currentConfig = currentStoreData.themeAutomation;
      
      if (currentConfig && typeof currentConfig === 'object' && currentConfig.enabled) {
        this.evaluateAndApplyTheme(currentConfig);
      } else {
        this.stop(); // Stop if disabled during active interval
      }
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  evaluateAndApplyTheme(config) {
    if (!config || typeof config !== 'object' || !config.enabled) return;

    try {
      const currentHour = new Date().getHours();
      const dayStartHour = config.dayStartHour !== undefined ? config.dayStartHour : 6;
      const nightStartHour = config.nightStartHour !== undefined ? config.nightStartHour : 18;

      let isDaytime;
      if (dayStartHour < nightStartHour) {
        isDaytime = currentHour >= dayStartHour && currentHour < nightStartHour;
      } else {
        // Wraps around midnight (e.g. day starts at 20 (8 PM) and ends at 6 (6 AM))
        isDaytime = currentHour >= dayStartHour || currentHour < nightStartHour;
      }
      const targetTheme = isDaytime ? config.dayTheme : config.nightTheme;

      const storeData = this.settingsStore.load() || {};
      if (targetTheme && storeData.selectedTheme !== targetTheme) {
        console.log(`[ThemeAgent] Switching theme to: ${targetTheme}`); 
        this.applyThemeCallback(targetTheme);
      }
    } catch (error) {
      console.error("ThemeAgent failed to evaluate time-based theme.", error);
    }
  }
}

module.exports = ThemeAgent;