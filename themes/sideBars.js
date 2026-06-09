(() => {
  const {
    clamp01,
    hexToRgb,
    applyOptimizedShadow,
    getPerformanceMultiplier
  } = window.ParalineShared;

  const SIDE_BARS_STYLES = {
    white: {
      mode: "solid",
      color: [245, 248, 255]
    },
    yellow: {
      mode: "solid",
      color: [255, 228, 110]
    },
    aqua: {
      mode: "solid",
      color: [110, 244, 255]
    },
    multicolor: {
      mode: "palette",
      colors: [
        [255, 82, 102],
        [102, 132, 255],
        [245, 248, 255],
        [92, 244, 255],
        [255, 118, 214]
      ]
    }
  };



  function getSideBarsSettingsColor(settings) {
    if (settings.colorStyle === "custom" && Array.isArray(settings.customColors)) {
      return {
        mode: "palette",
        colors: settings.customColors.map(hexToRgb)
      };
    }
    return SIDE_BARS_STYLES[settings.colorStyle] || SIDE_BARS_STYLES.multicolor;
  }

  function getSideBarsAudioMultiplier(settings = {}) {
    let base = 3;
    if (settings.sensitivity === "low") base = 2.2;
    if (settings.sensitivity === "high") base = 4.2;

    if (settings.sensitivity === "custom" && typeof settings.customSensitivity === "number") {
      return base * (settings.customSensitivity / 30);
    }
    return base;
  }

  function getSideBarsThicknessProfile(settings = {}) {
    if (settings.barThickness === "custom" && typeof settings.customThickness === "number") {
      return {
        barHeight: settings.customThickness,
        gap: getSideBarsDensityGap(settings)
      };
    }

    if (settings.barThickness === "thin") {
      return {
        barHeight: 2,
        gap: 7
      };
    }

    if (settings.barThickness === "medium") {
      return {
        barHeight: 3,
        gap: 7
      };
    }

    return {
      // Keep the current visual feel as the thick preset.
      barHeight: 4,
      gap: 7
    };
  }

  function getSideBarsDensityGap(settings = {}) {
    if (settings.barDensity === "custom" && typeof settings.customGap === "number") {
      return settings.customGap;
    }

    if (settings.barDensity === "low") {
      return 11;
    }

    if (settings.barDensity === "high") {
      return 4;
    }

    return 7;
  }

  function mixChannel(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function resolveSideBarsColor(style, normalizedY, time) {
    if (style.mode === "solid") {
      const [r, g, b] = style.color;
      return { r, g, b };
    }

    const palette = style.colors;
    const travel = (normalizedY + time * 0.045) % 1;
    const scaled = travel * palette.length;
    const indexA = Math.floor(scaled) % palette.length;
    const indexB = (indexA + 1) % palette.length;
    const blend = scaled - Math.floor(scaled);
    const colorA = palette[indexA];
    const colorB = palette[indexB];

    return {
      r: mixChannel(colorA[0], colorB[0], blend),
      g: mixChannel(colorA[1], colorB[1], blend),
      b: mixChannel(colorA[2], colorB[2], blend)
    };
  }

  function drawRoundedBar(context, x, y, width, height) {
    const radius = Math.min(height * 0.5, 4);
    context.beginPath();

    if (typeof context.roundRect === "function") {
      context.roundRect(x, y, width, height, radius);
    } else {
      context.rect(x, y, width, height);
    }

    context.fill();
  }

  function drawSideBars(options) {
    const {
      context,
      width,
      height,
      time,
      smoothedLevel,
      settings,
      performanceMode = 'balanced'
    } = options;

    const style = getSideBarsSettingsColor(settings);
    const thicknessProfile = getSideBarsThicknessProfile(settings);
    const sideInset = 4;
    const edgeOverscan = 10;
    const { barHeight } = thicknessProfile;
    const gap = getSideBarsDensityGap(settings);
    const step = barHeight + gap;
    const usableHeight = height + edgeOverscan * 2;
    const count = Math.max(12, Math.ceil(usableHeight / step) + 1);
    const glowBlur = (5 + smoothedLevel * 12 + barHeight * 0.4) * getPerformanceMultiplier(performanceMode);
    const baseOpacity = 0.34 + smoothedLevel * 0.18;

    context.globalAlpha = 1;
    context.shadowBlur = 0;

    for (let index = 0; index < count; index++) {
      const normalizedY = count <= 1 ? 0.5 : index / (count - 1);
      const distanceFromCenter = Math.abs(normalizedY - 0.5) / 0.5;
      const centerBias = Math.pow(1 - distanceFromCenter, 1.4);
      const motion = Math.sin(time * 3.8 + normalizedY * 10.5) * 0.5 + 0.5;
      const audioWeight = 0.2 + centerBias * 1.45;
      const baseLength = 3 + centerBias * 8;
      const activeLength = smoothedLevel * (10 + centerBias * 54) * (0.72 + motion * 0.5);
      const barLength = Math.max(2, baseLength + activeLength);
      const color = resolveSideBarsColor(style, normalizedY, time);
      const opacity = clamp01(baseOpacity + centerBias * 0.24 + motion * 0.06);
      const y = -edgeOverscan + index * step;
      const leftX = sideInset;
      const rightX = width - sideInset - barLength;
      const fillColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;

      context.fillStyle = fillColor;
      applyOptimizedShadow(context, fillColor, glowBlur * (0.4 + audioWeight * 0.45), performanceMode);
      drawRoundedBar(context, leftX, y, barLength, barHeight);
      drawRoundedBar(context, rightX, y, barLength, barHeight);
    }
  }

  window.ParalineSideBars = {
    getSideBarsAudioMultiplier,
    drawSideBars
  };
})();
