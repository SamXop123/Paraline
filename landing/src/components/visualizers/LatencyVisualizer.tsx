"use client";

import { useEffect, useRef } from "react";
import { setupOptimizedCanvas } from "@/lib/useCanvasOptimizer";

interface LatencyVisualizerProps {
  active?: boolean;
  className?: string;
}

export function LatencyVisualizer({ active = true, className }: LatencyVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let time = 0;

    // Audio simulation physics
    let currentLevel = 0.35;
    let beatTimer = 0;
    let nextBeatTime = 0.75;
    let beatSpike = 0;

    // Spectrum bar heights (9 frequency bands)
    const numBars = 9;
    const barHeights = new Array(numBars).fill(0.2);

    // Dynamic latency pulse rings
    interface Ring {
      radius: number;
      maxRadius: number;
      opacity: number;
      speed: number;
    }
    const rings: Ring[] = [];
    let ringTimer = 0;

    return setupOptimizedCanvas({
      canvas,
      active,
      idleFps: 30,
      onRender: (ctx, width, height, deltaTime) => {
        const centerX = width / 2;
        const centerY = height / 2;

        time += deltaTime * (active ? 1.6 : 0.8);

      // Procedural audio reactivity & beat simulation
      beatTimer += deltaTime;
      if (beatTimer > nextBeatTime) {
        beatSpike = 0.55 + Math.random() * 0.45;
        nextBeatTime = 0.55 + Math.random() * 0.9;
        beatTimer = 0;

        // Spawn a radar pulse on beat hit
        rings.push({
          radius: 4,
          maxRadius: Math.min(width, height) * 0.48,
          opacity: 0.6,
          speed: 28 + Math.random() * 12
        });
      }

      // Smooth decay of beat spike
      beatSpike += (0 - beatSpike) * (1 - Math.exp(-4.5 * deltaTime));

      // Ambient audio breathing
      const ambientSwell = 0.28 + 0.14 * Math.sin(time * 1.8) + 0.08 * Math.cos(time * 3.4);
      const targetLevel = Math.min(1.0, ambientSwell + beatSpike);
      currentLevel += (targetLevel - currentLevel) * (1 - Math.exp(-9.0 * deltaTime));

      // Periodic ring emitter
      ringTimer += deltaTime;
      if (ringTimer > 1.2) {
        rings.push({
          radius: 3,
          maxRadius: Math.min(width, height) * 0.45,
          opacity: 0.35,
          speed: 22
        });
        ringTimer = 0;
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Radial Ambient Glow
      const bgGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.55);
      bgGlow.addColorStop(0, `rgba(34, 211, 238, ${0.14 + currentLevel * 0.16})`);
      bgGlow.addColorStop(0.5, `rgba(99, 102, 241, ${0.06 + currentLevel * 0.08})`);
      bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Render expanding radar pulse rings (WASAPI Signal Echo)
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.radius += ring.speed * deltaTime;
        const progress = ring.radius / ring.maxRadius;
        const currentOpacity = Math.max(0, ring.opacity * (1 - progress));

        if (progress >= 1 || currentOpacity <= 0.01) {
          rings.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 211, 238, ${currentOpacity * 0.75})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Render Center Equalizer Spectrum Bars
      const barWidth = 3.2;
      const barGap = 2.4;
      const totalBarsWidth = numBars * barWidth + (numBars - 1) * barGap;
      const startX = centerX - totalBarsWidth / 2;
      const maxBarHeight = height * 0.48;

      for (let i = 0; i < numBars; i++) {
        // Bell-curve weighting from center outward
        const distFromCenter = Math.abs(i - (numBars - 1) / 2) / ((numBars - 1) / 2);
        const centerBias = 1 - distFromCenter * 0.45;

        // Individual frequency vibration
        const freqOffset = i * 0.65;
        const barTarget = Math.max(
          0.15,
          centerBias * (currentLevel * 0.75 + 0.25 * Math.sin(time * 4.2 + freqOffset) + 0.15 * Math.cos(time * 7.5 - freqOffset))
        );

        barHeights[i] += (barTarget - barHeights[i]) * (1 - Math.exp(-12.0 * deltaTime));
        const currentBarHeight = Math.max(4, barHeights[i] * maxBarHeight);

        const x = startX + i * (barWidth + barGap);
        const yTop = centerY - currentBarHeight / 2;

        // Gradient for bars
        const barGrad = ctx.createLinearGradient(0, yTop, 0, yTop + currentBarHeight);
        barGrad.addColorStop(0, "rgba(56, 189, 248, 0.95)"); // Bright sky blue top
        barGrad.addColorStop(0.5, "rgba(34, 211, 238, 0.85)"); // Cyan middle
        barGrad.addColorStop(1, "rgba(168, 85, 247, 0.75)"); // Purple bottom

        ctx.save();
        // Bar glow
        ctx.shadowColor = "rgba(34, 211, 238, 0.45)";
        ctx.shadowBlur = 6;
        ctx.fillStyle = barGrad;
        
        // Rounded bar
        ctx.beginPath();
        const radius = barWidth / 2;
        ctx.roundRect(x, yTop, barWidth, currentBarHeight, radius);
        ctx.fill();
        ctx.restore();
      }

      // 4. Render Superimposed Oscilloscope Sine Wave Across Center
      const wavePoints: { x: number; y: number }[] = [];
      const waveStep = 3;
      const waveAmplitude = 5 + currentLevel * 8.5;
      const waveFreq = (Math.PI * 2.8) / width;

      for (let x = 0; x <= width + waveStep; x += waveStep) {
        // Dampen wave at edges so it stays nicely inside the box
        const edgeDamp = Math.sin((x / width) * Math.PI);
        const yOffset = Math.sin(x * waveFreq + time * 3.5) * Math.cos(x * waveFreq * 0.45 - time * 2.2) * waveAmplitude * edgeDamp;
        wavePoints.push({ x, y: centerY + yOffset });
      }

      const buildWavePath = () => {
        ctx.beginPath();
        ctx.moveTo(wavePoints[0].x, wavePoints[0].y);
        for (let i = 1; i < wavePoints.length; i++) {
          ctx.lineTo(wavePoints[i].x, wavePoints[i].y);
        }
      };

      ctx.save();
      // Outer wave glow
      ctx.strokeStyle = "rgba(34, 211, 238, 0.28)";
      ctx.lineWidth = 5.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      buildWavePath();
      ctx.stroke();

      // Inner medium glow
      ctx.strokeStyle = "rgba(129, 140, 248, 0.55)";
      ctx.lineWidth = 2.4;
      buildWavePath();
      ctx.stroke();

      // Sharp core line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 1.0;
      buildWavePath();
      ctx.stroke();
      ctx.restore();

      // 5. Pulsing central spark indicator
      ctx.save();
      const sparkSize = 2 + currentLevel * 2.2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sparkSize, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.shadowColor = "rgba(34, 211, 238, 0.9)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }
  });
}, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={className || "w-full h-full object-cover transition-transform duration-500"}
    />
  );
}
