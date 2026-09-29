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
          // Idle breathing: subtle ambient pulse so it's always clearly visible
          const idleTarget = 0.05 + 0.025 * Math.sin(time * 0.8);
          smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-2.5 * deltaTime));
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

        // Showcase display presence: clearly visible at baseline (0.75), surging to 1.0 on hover beats
        const displayPresence = active
          ? (0.75 + clamp01(smoothedLevel * 1.5) * 0.25)
          : 0.72;

        const horizonH = Math.min(46, height * 0.32);
        const horizonY = height - horizonH;
        const vanishingX = width * 0.5;
        const vanishingY = horizonY;

        // 1. Transverse Horizontal Grid Lines
        const numHorizontalLines = 7;
        ctx.save();
        for (let i = 0; i < numHorizontalLines; i++) {
          const rawDepth = (i / numHorizontalLines + gridScrollOffset / numHorizontalLines) % 1.0;
          const depth = Math.pow(rawDepth, 1.8);
          const lineY = horizonY + depth * horizonH;
          const depthFade = Math.pow(depth, 1.2);
          const lineAlpha = Math.min(1.0, depthFade * (0.42 + smoothedLevel * 0.58) * displayPresence);
          if (lineAlpha < 0.01) continue;

          let shockBoost = 0;
          if (shockwaveProgress > 0) {
            const dist = Math.abs(rawDepth - shockwaveProgress);
            if (dist < 0.16) {
              shockBoost = (1.0 - dist / 0.16) * 0.7 * displayPresence;
            }
          }

          const r = Math.min(255, Math.round(palette.grid[0] + shockBoost * 70));
          const g = Math.min(255, Math.round(palette.grid[1] + shockBoost * 70));
          const b = Math.min(255, Math.round(palette.grid[2] + shockBoost * 70));
          const alpha = Math.min(1.0, lineAlpha + shockBoost);

          const rippleAmp = (1.2 + smoothedLevel * 8.0) * (1.0 - depth * 0.45);
          const steps = 24;
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
          ctx.lineWidth = Math.max(0.7, 0.8 + depth * 1.4);
          ctx.stroke();
        }
        ctx.restore();

        // 2. Longitudinal Radiating Perspective Beams
        const numVerticalLines = 16;
        const spreadWidth = width * 1.35;
        const startX = vanishingX - spreadWidth * 0.5;
        const stepSpread = spreadWidth / numVerticalLines;

        ctx.save();
        for (let j = 0; j <= numVerticalLines; j++) {
          const bottomX = startX + j * stepSpread;
          const normFromCenter = (bottomX - vanishingX) / (spreadWidth * 0.5);
          const centerFade = 1.0 - Math.min(1.0, Math.abs(normFromCenter) * 0.35);
          const beamAlpha = Math.min(1.0, (0.32 + smoothedLevel * 0.6) * centerFade * displayPresence);
          if (beamAlpha < 0.01) continue;

          const grad = ctx.createLinearGradient(vanishingX, vanishingY, bottomX, height);
          grad.addColorStop(0.0, "rgba(0,0,0,0)");
          grad.addColorStop(0.35, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${(beamAlpha * 0.35).toFixed(3)})`);
          grad.addColorStop(1.0, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${beamAlpha.toFixed(3)})`);

          ctx.beginPath();
          ctx.moveTo(vanishingX, vanishingY);
          ctx.lineTo(bottomX, height);
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(0.6, 0.8 + smoothedLevel * 0.8);
          ctx.stroke();
        }
        ctx.restore();

        // 3. Low-Profile Neon Horizon Laser Line
        ctx.save();
        const laserAlpha = Math.min(1.0, (0.6 + smoothedLevel * 0.4) * displayPresence);
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);

        const horizonGrad = ctx.createLinearGradient(0, 0, width, 0);
        horizonGrad.addColorStop(0.0, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${(laserAlpha * 0.5).toFixed(3)})`);
        horizonGrad.addColorStop(0.5, `rgba(${palette.horizon[0]}, ${palette.horizon[1]}, ${palette.horizon[2]}, ${laserAlpha.toFixed(3)})`);
        horizonGrad.addColorStop(1.0, `rgba(${palette.grid[0]}, ${palette.grid[1]}, ${palette.grid[2]}, ${(laserAlpha * 0.5).toFixed(3)})`);

        ctx.strokeStyle = horizonGrad;
        ctx.lineWidth = Math.max(1.0, 1.2 + smoothedLevel * 1.2);
        ctx.stroke();
        ctx.restore();

        // 4. Center Beat Sun Core (Classic 80s Sun on Horizon)
        ctx.save();
        const coreIntensity = (active ? (0.6 + smoothedLevel * 0.4) : 0.55) * displayPresence;
        const coreRadius = Math.min(18, 7 + smoothedLevel * 12);

        const sunGrad = ctx.createRadialGradient(
          vanishingX, horizonY, 1,
          vanishingX, horizonY, coreRadius
        );
        sunGrad.addColorStop(0.0, `rgba(${palette.accent[0]}, ${palette.accent[1]}, ${palette.accent[2]}, ${(coreIntensity * 0.95).toFixed(3)})`);
        sunGrad.addColorStop(0.5, `rgba(${palette.horizon[0]}, ${palette.horizon[1]}, ${palette.horizon[2]}, ${(coreIntensity * 0.6).toFixed(3)})`);
        sunGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(vanishingX, horizonY, coreRadius, Math.PI, 0, false);
        ctx.fillStyle = sunGrad;
        ctx.fill();
        ctx.restore();
      }
    });
  }, [active, transparent]);

  return <canvas ref={canvasRef} className={`w-full h-full block ${className || ""}`} />;
}
