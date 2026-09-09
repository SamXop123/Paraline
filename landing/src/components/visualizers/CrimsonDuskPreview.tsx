"use client";
import { useEffect, useRef } from "react";
import { setupOptimizedCanvas } from "@/lib/useCanvasOptimizer";

export function CrimsonDuskPreview({ active, transparent, className }: { active: boolean; transparent?: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let time = 0;

    // Physics
    let smoothedLevel = 0.04;

    // Procedural beat generation
    let beatTimer = 0;
    let nextBeatTime = 0.7;
    let beatSpike = 0;

    // Ember palette (matches themes/crimsonDusk.js CRIMSON_COLORS)
    const emberPalette: [number, number, number][] = [
      [255, 107, 53],   // emberOrange
      [255, 180, 60],   // glowGold
      [243, 156, 18],   // warmAmber
      [192, 57, 43],    // deepCrimson
      [220, 80, 20],    // dustRed
    ];
    const mixChannel = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
    const resolveEmberColor = (normalizedPos: number, t: number, opacity: number) => {
      const travel = ((normalizedPos + t * 0.04) % 1 + 1) % 1;
      const scaled = travel * emberPalette.length;
      const indexA = Math.floor(scaled) % emberPalette.length;
      const indexB = (indexA + 1) % emberPalette.length;
      const blend = scaled - Math.floor(scaled);
      const colorA = emberPalette[indexA];
      const colorB = emberPalette[indexB];
      const r = mixChannel(colorA[0], colorB[0], blend);
      const g = mixChannel(colorA[1], colorB[1], blend);
      const b = mixChannel(colorA[2], colorB[2], blend);
      return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(3)})`;
    };

    const prefersReducedMotion = () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return setupOptimizedCanvas({
      canvas,
      active,
      idleFps: 30,
      onRender: (ctx, width, height, deltaTime) => {
        const reducedMotion = prefersReducedMotion();
        const motionScale = reducedMotion ? 0.15 : 1;
        time += deltaTime * (active ? 0.9 : 0.3) * motionScale;

      if (active && !reducedMotion) {
        beatTimer += deltaTime;
        if (beatTimer > nextBeatTime) {
          beatSpike = 0.35 + Math.random() * 0.45;
          nextBeatTime = 0.6 + Math.random() * 1.2;
          beatTimer = 0;
        }
        beatSpike += (0 - beatSpike) * (1 - Math.exp(-4.0 * deltaTime));
        const baseAmbient = 0.12 + 0.06 * Math.sin(time * 1.5);
        const target = baseAmbient + beatSpike;
        smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-8.0 * deltaTime));
      } else if (active && reducedMotion) {
        // Reduced motion: hold a gentle constant level, no beat spikes
        const target = 0.16;
        smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-2.0 * deltaTime));
        beatSpike = 0;
        beatTimer = 0;
      } else {
        const idleTarget = 0.04 + 0.015 * Math.sin(time * 0.5);
        smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-2.5 * deltaTime));
        beatSpike = 0;
        beatTimer = 0;
      }

      ctx.clearRect(0, 0, width, height);
      if (!transparent) {
        ctx.fillStyle = "rgba(10, 6, 2, 0.92)";
        ctx.fillRect(0, 0, width, height);
      }

      // Ambient edge glow (always-on, matches drawCrimsonEdgeGlow)
      const glowIntensity = 0.06 + smoothedLevel * 0.08;
      const gradB = ctx.createLinearGradient(0, height - 60, 0, height);
      gradB.addColorStop(0, "rgba(0,0,0,0)");
      gradB.addColorStop(1, `rgba(192,57,43,${(glowIntensity * 2.2).toFixed(3)})`);
      ctx.fillStyle = gradB;
      ctx.fillRect(0, Math.max(0, height - 60), width, 60);

      // Bottom full-width bars (matches drawCrimsonDuskBottomFull)
      const barCount = 64;
      const step = width / barCount;
      const barWidth = Math.max(1, step - 1.5);
      const baseY = height;
      const maxBarHeight = 14 + smoothedLevel * 40;

      for (let i = 0; i < barCount; i++) {
        const normalizedI = i / (barCount - 1);
        const noise = Math.sin(time * 3.0 + i * 0.37) * 0.35
                    + Math.sin(time * 1.7 + i * 0.63) * 0.35
                    + 0.3;
        const barH = Math.max(1.5, maxBarHeight * Math.max(0.15, noise));
        const opacity = Math.max(0, Math.min(1, 0.5 + smoothedLevel * 0.32));
        const color = resolveEmberColor(normalizedI, time, opacity);

        const x = i * step;
        const y = baseY - barH;

        const grad = ctx.createLinearGradient(x, y, x, baseY);
        grad.addColorStop(0, `rgba(255,180,60,${opacity})`);
        grad.addColorStop(1, `rgba(192,57,43,${(opacity * 0.4).toFixed(3)})`);

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 6 + smoothedLevel * 8;
        ctx.fillStyle = grad;
        ctx.beginPath();
        drawRoundedBar(ctx, x, y, barWidth, barH, Math.min(2, barWidth * 0.4));
        ctx.fill();
        ctx.restore();
      }

      // Slow-drifting ember particles
      const particleCount = 14;
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 71.3;
        const px = ((Math.sin(seed) * 0.5 + 0.5) * width + time * 6 * (0.3 + (i % 3) * 0.2) * motionScale) % width;
        const driftCycle = (time * 0.15 * motionScale + i * 0.37) % 1;
        const py = height - driftCycle * height;
        const size = 0.8 + (i % 3) * 0.6;
        const fade = Math.sin(driftCycle * Math.PI);
        const opacity = Math.max(0, fade * (0.3 + smoothedLevel * 0.3));
        const color = resolveEmberColor((i % emberPalette.length) / emberPalette.length, time * 0.3, opacity);

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}, [active, transparent]);

  return (
    <canvas
      ref={canvasRef}
      className={className || "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 bg-transparent rounded-2xl"}
      style={{ opacity: active ? 1 : 0.7 }}
    />
  );
}

function drawRoundedBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
}
