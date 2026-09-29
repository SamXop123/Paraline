"use client";
import { useEffect, useRef } from "react";
import { setupOptimizedCanvas } from "@/lib/useCanvasOptimizer";

export function SynthwaveHorizonPreview({
  active,
  transparent,
  className
}: {
  active: boolean;
  transparent?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let time = 0;
    let gridScrollOffset = 0;
    let smoothedLevel = 0.0;

    // Procedural beat generation
    let beatTimer = 0;
    let nextBeatTime = 0.65;
    let beatSpike = 0;
    let shockwaveProgress = 0;

    const palette = {
      grid: [0, 242, 254],       // Electric Cyan #00f2fe
      horizon: [255, 0, 128],    // Hot Neon Magenta #ff007f
      accent: [255, 230, 0]      // Laser Sun Gold #ffe600
    };

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

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
        const motionScale = reducedMotion ? 0.2 : 1;
        time += deltaTime * (active ? 0.9 : 0.3) * motionScale;

        if (active && !reducedMotion) {
          beatTimer += deltaTime;
          if (beatTimer > nextBeatTime) {
            beatSpike = 0.45 + Math.random() * 0.45;
            nextBeatTime = 0.55 + Math.random() * 0.9;
            beatTimer = 0;
            shockwaveProgress = 0.01;
          }
          beatSpike += (0 - beatSpike) * (1 - Math.exp(-4.5 * deltaTime));
          const baseAmbient = 0.08 + 0.04 * Math.sin(time * 1.5);
          const target = baseAmbient + beatSpike;
          smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-8.0 * deltaTime));
        } else if (active && reducedMotion) {
          const target = 0.16;
          smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-2.0 * deltaTime));
          beatSpike = 0;
          beatTimer = 0;
        } else {
          // Idle: drops towards zero so it fades into transparency
          const idleTarget = 0.0;
          smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-3.0 * deltaTime));
          beatSpike = 0;
          beatTimer = 0;
        }

        // Progress grid scroll
        gridScrollOffset = (gridScrollOffset + deltaTime * 0.75 * (0.6 + smoothedLevel * 2.0) * motionScale) % 1.0;

        if (shockwaveProgress > 0) {
          shockwaveProgress += deltaTime * 2.0 * motionScale;
          if (shockwaveProgress > 1.0) shockwaveProgress = 0;
        }

        ctx.clearRect(0, 0, width, height);

        if (!transparent) {
          ctx.fillStyle = "rgba(4, 3, 10, 0.94)";
          ctx.fillRect(0, 0, width, height);
        }

        // Ambient presence multiplier - reduced opacity when quiet, surges on beat
        const audioPresence = active
          ? (0.18 + clamp01((smoothedLevel - 0.02) * 3.2) * 0.82)
          : 0.18;

        const horizonH = Math.min(42, height * 0.28);
        const horizonY = height - horizonH;
        const vanishingX = width * 0.5;
        const vanishingY = horizonY;

        // 1. Transverse Horizontal Grid Lines
        const numHorizontalLines = 7;
        ctx.save();
        for (let i = 0; i < numHorizontalLines; i++) {
          const rawDepth = (i / numHorizontalLines + gridScrollOffset / numHorizontalLines) % 1.0;
          const depth = Math.pow(rawDepth, 2.0);
          const lineY = horizonY + depth * horizonH;
          const depthFade = Math.pow(depth, 1.4);
          const lineAlpha = depthFade * (0.35 + smoothedLevel * 0.65) * audioPresence;
          if (lineAlpha < 0.01) continue;

          let shockBoost = 0;
          if (shockwaveProgress > 0) {
            const dist = Math.abs(rawDepth - shockwaveProgress);
            if (dist < 0.15) {
              shockBoost = (1.0 - dist / 0.15) * 0.7 * audioPresence;
            }
          }

          const r = Math.min(255, Math.round(palette.grid[0] + shockBoost * 80));
          const g = Math.min(255, Math.round(palette.grid[1] + shockBoost * 80));
          const b = Math.min(255, Math.round(palette.grid[2] + shockBoost * 80));
          const alpha = Math.min(1.0, lineAlpha + shockBoost);

          const rippleAmp = smoothedLevel * 3.5 * (1.0 - depth * 0.5) * audioPresence;
          const steps = 20;
          const stepX = width / steps;

          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const x = s * stepX;
            const normX = (x - vanishingX) / (width * 0.5);
            const wave = Math.sin(normX * Math.PI * 3.5 + time * 3.0) * rippleAmp * Math.exp(-Math.abs(normX) * 0.8);
            const y = lineY - wave;
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = Math.max(0.6, 0.7 + depth * 1.3);
          ctx.stroke();
        }
        ctx.restore();

        // 2. Longitudinal Radiating Perspective Beams
        const numVerticalLines = 16;
        const spreadWidth = width * 1.3;
        const startX = vanishingX - spreadWidth * 0.5;
        const stepSpread = spreadWidth / numVerticalLines;

        ctx.save();
        for (let j = 0; j <= numVerticalLines; j++) {
          const bottomX = startX + j * stepSpread;
          const normFromCenter = (bottomX - vanishingX) / (spreadWidth * 0.5);
          const centerFade = 1.0 - Math.min(1.0, Math.abs(normFromCenter) * 0.4);
          const beamAlpha = (0.25 + smoothedLevel * 0.6) * centerFade * audioPresence;
          if (beamAlpha < 0.01) continue;

          const grad = ctx.createLinearGradient(vanishingX, vanishingY, bottomX, height);
          grad.addColorStop(0.0, "rgba(0,0,0,0)");
          grad.addColorStop(0.3, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${(beamAlpha * 0.3).toFixed(3)})`);
          grad.addColorStop(1.0, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${beamAlpha.toFixed(3)})`);

          ctx.beginPath();
          ctx.moveTo(vanishingX, vanishingY);
          ctx.lineTo(bottomX, height);
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(0.5, 0.8 + smoothedLevel * 0.8);
          ctx.stroke();
        }
        ctx.restore();

        // 3. Low-Profile Neon Horizon Laser Line
        ctx.save();
        const beamAlpha = Math.min(1.0, (0.4 + smoothedLevel * 0.6) * audioPresence);
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);

        const horizonGrad = ctx.createLinearGradient(0, 0, width, 0);
        horizonGrad.addColorStop(0.0, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${(beamAlpha * 0.5).toFixed(3)})`);
        horizonGrad.addColorStop(0.5, `rgba(${palette.horizon[0]}, ${palette.horizon[1]}, ${palette.horizon[2]}, ${beamAlpha.toFixed(3)})`);
        horizonGrad.addColorStop(1.0, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${(beamAlpha * 0.5).toFixed(3)})`);

        ctx.strokeStyle = horizonGrad;
        ctx.lineWidth = Math.max(0.8, 1.0 + smoothedLevel * 1.2);
        ctx.stroke();
        ctx.restore();

        // 4. Center Beat Flare (Micro-glow along horizon, <= 8px)
        if (smoothedLevel > 0.08) {
          ctx.save();
          const coreIntensity = clamp01((smoothedLevel - 0.08) * 2.5) * audioPresence;
          const coreRadius = Math.min(14, 5 + smoothedLevel * 9);

          const sunGrad = ctx.createRadialGradient(
            vanishingX, horizonY, 1,
            vanishingX, horizonY, coreRadius
          );
          sunGrad.addColorStop(0.0, `rgba(${palette.accent[0]}, ${palette.accent[1]}, ${palette.accent[2]}, ${(coreIntensity * 0.9).toFixed(3)})`);
          sunGrad.addColorStop(0.5, `rgba(${palette.horizon[0]}, ${palette.horizon[1]}, ${palette.horizon[2]}, ${(coreIntensity * 0.5).toFixed(3)})`);
          sunGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

          ctx.beginPath();
          ctx.arc(vanishingX, horizonY, coreRadius, Math.PI, 0, false);
          ctx.fillStyle = sunGrad;
          ctx.fill();
          ctx.restore();
        }
      }
    });
  }, [active, transparent]);

  return <canvas ref={canvasRef} className={`w-full h-full block ${className || ""}`} />;
}
