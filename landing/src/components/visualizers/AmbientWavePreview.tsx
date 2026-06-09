"use client";

import { useEffect, useRef } from "react";

export function AmbientWavePreview({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let time = 0;
    
    // Physics variables for smooth, framerate-independent behavior
    let currentLevel = 0.06;
    
    // Procedural beat generation
    let beatTimer = 0;
    let nextBeatTime = 1.0;
    let beatSpike = 0;

    const render = (now: number) => {
      const deltaTime = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Handle resize / DPI scaling dynamically
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const rect = canvas.getBoundingClientRect();
      const targetWidth = Math.floor(rect.width * dpr);
      const targetHeight = Math.floor(rect.height * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.scale(dpr, dpr);
      }

      const width = rect.width;
      const height = rect.height;

      // Increment time relative to deltaTime
      time += deltaTime * (active ? 0.8 : 0.4);

      // Procedural audio reactivity simulation
      if (active) {
        beatTimer += deltaTime;
        if (beatTimer > nextBeatTime) {
          beatSpike = 0.35 + Math.random() * 0.4; // trigger a simulated beat
          nextBeatTime = 0.8 + Math.random() * 1.4; // randomized interval for natural rhythm
          beatTimer = 0;
        }
        
        // Smooth exponential decay for the beat spike
        beatSpike += (0 - beatSpike) * (1 - Math.exp(-3.2 * deltaTime));
        
        // Slow ambient breathing
        const baseAmbient = 0.12 + 0.08 * Math.sin(time * 0.8) + 0.03 * Math.sin(time * 2.1);
        
        // Subtle micro-jitter for realistic live audio feel
        const microJitter = 0.015 * Math.sin(time * 16.0) * Math.cos(time * 9.0);
        
        const target = baseAmbient + beatSpike + microJitter;
        
        // Frame-rate independent LERP attack & decay
        currentLevel += (target - currentLevel) * (1 - Math.exp(-6.8 * deltaTime));
      } else {
        // Gentle, slow idle breathing when not hovered
        const idleTarget = 0.05 + 0.02 * Math.sin(time * 0.6);
        currentLevel += (idleTarget - currentLevel) * (1 - Math.exp(-2.5 * deltaTime));
        beatSpike = 0;
        beatTimer = 0;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw faint, premium dark backing fill
      ctx.fillStyle = "rgba(6, 9, 19, 0.92)";
      ctx.fillRect(0, 0, width, height);

      // Create top-to-bottom edge ambient glow haze
      const edgeGradient = ctx.createLinearGradient(0, 0, 0, height);
      edgeGradient.addColorStop(0, "rgba(34, 211, 238, 0.06)"); // Top edge haze
      edgeGradient.addColorStop(0.2, "rgba(34, 211, 238, 0)");
      edgeGradient.addColorStop(0.8, "rgba(34, 211, 238, 0)");
      edgeGradient.addColorStop(1, "rgba(34, 211, 238, 0.04)"); // Bottom edge haze
      
      ctx.fillStyle = edgeGradient;
      ctx.fillRect(0, 0, width, height);

      // Visual parameters matching the desktop client's edge placements
      const topBase = 12 + currentLevel * 6;
      const bottomBase = height - 12 - currentLevel * 8;
      const primaryAmplitude = 6 + currentLevel * 18;
      const secondaryAmplitude = 2.6 + currentLevel * 8;

      // Color scheme - gorgeous translucent cyan/teal accents
      const cyanTheme = {
        topLine: "rgba(34, 211, 238, 0.82)",
        topGlow: "rgba(34, 211, 238, 0.24)",
        bottomLine: "rgba(6, 182, 212, 0.78)",
        bottomGlow: "rgba(6, 182, 212, 0.2)"
      };

      // Frequencies scaled for a long, silky wave shape
      const topFreq1 = (Math.PI * 1.8) / width;
      const topFreq2 = (Math.PI * 2.8) / width;
      const bottomFreq1 = (Math.PI * 2.0) / width;
      const bottomFreq2 = (Math.PI * 3.0) / width;

      // Draw Top Waves (Soft fill + primary line + secondary line)
      drawSoftFill(ctx, {
        width,
        time,
        yBase: topBase,
        amplitude: primaryAmplitude * 0.6,
        frequency: topFreq1 * 0.9,
        speed: 0.28,
        color: "rgba(34, 211, 238, 0.08)",
        thickness: 24,
        alphaScale: 1.0,
        invert: true
      });
      drawWave(ctx, {
        width,
        time,
        yBase: topBase,
        amplitude: primaryAmplitude * 0.6,
        frequency: topFreq1,
        speed: 0.26,
        color: cyanTheme.topLine,
        lineWidth: 1.1,
        opacity: 0.78,
        invert: true
      });
      drawWave(ctx, {
        width,
        time,
        yBase: topBase + 4,
        amplitude: secondaryAmplitude * 0.55,
        frequency: topFreq2,
        speed: 0.34,
        color: cyanTheme.topGlow,
        lineWidth: 0.8,
        opacity: 0.35,
        invert: true
      });

      // Draw Bottom Waves (Soft fill + primary line + secondary line)
      drawSoftFill(ctx, {
        width,
        time,
        yBase: bottomBase,
        amplitude: primaryAmplitude * 0.9,
        frequency: bottomFreq1 * 0.85,
        speed: 0.32,
        color: "rgba(6, 182, 212, 0.06)",
        thickness: 32,
        alphaScale: 1.0
      });
      drawWave(ctx, {
        width,
        time,
        yBase: bottomBase,
        amplitude: primaryAmplitude * 0.9,
        frequency: bottomFreq1,
        speed: 0.34,
        color: cyanTheme.bottomLine,
        lineWidth: 1.3,
        opacity: 0.85
      });
      drawWave(ctx, {
        width,
        time,
        yBase: bottomBase - 5,
        amplitude: secondaryAmplitude,
        frequency: bottomFreq2,
        speed: 0.48,
        color: cyanTheme.bottomGlow,
        lineWidth: 0.9,
        opacity: 0.42
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [active]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 bg-transparent" 
      style={{ opacity: active ? 1 : 0.7 }}
    />
  );
}

interface WaveOptions {
  width: number;
  time: number;
  yBase: number;
  amplitude: number;
  frequency: number;
  speed: number;
  color: string;
  lineWidth: number;
  opacity: number;
  invert?: boolean;
}

// Highly optimized vector wave drawing using multi-stroke glow layers
function drawWave(ctx: CanvasRenderingContext2D, options: WaveOptions) {
  const { width, time, yBase, amplitude, frequency, speed, color, lineWidth, opacity, invert = false } = options;
  const step = 4; // High resolution but performant step size
  const phaseA = time * speed;
  const phaseB = time * speed * 0.52;

  // Precompute wave vertices
  const points: { x: number; y: number }[] = [];
  for (let x = 0; x <= width + step; x += step) {
    const waveA = Math.sin(x * frequency + phaseA);
    const waveB = Math.sin(x * frequency * 0.42 - phaseB);
    const lift = (waveA + waveB) * amplitude;
    const y = yBase + (invert ? -lift : lift);
    points.push({ x, y });
  }

  const buildPath = () => {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 1. Draw outer wide soft glow (no CPU shadowBlur)
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * 7.5;
  ctx.globalAlpha = opacity * 0.12;
  buildPath();
  ctx.stroke();

  // 2. Draw inner medium glow
  ctx.lineWidth = lineWidth * 3.5;
  ctx.globalAlpha = opacity * 0.32;
  buildPath();
  ctx.stroke();

  // 3. Draw sharp core line
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = opacity;
  buildPath();
  ctx.stroke();

  ctx.restore();
}

interface SoftFillOptions {
  width: number;
  time: number;
  yBase: number;
  amplitude: number;
  frequency: number;
  speed: number;
  color: string;
  thickness: number;
  alphaScale?: number;
  invert?: boolean;
}

// Elegant gradient-faded soft fill mimicking the ambient haze
function drawSoftFill(ctx: CanvasRenderingContext2D, options: SoftFillOptions) {
  const { width, time, yBase, amplitude, frequency, speed, color, thickness, alphaScale = 1, invert = false } = options;
  const step = 6; // slightly larger step for background fill optimization
  const phaseA = time * speed;
  const phaseB = time * speed * 0.45;

  const points: { x: number; y: number }[] = [];
  for (let x = 0; x <= width + step; x += step) {
    const waveA = Math.sin(x * frequency + phaseA);
    const waveB = Math.sin(x * frequency * 0.35 - phaseB);
    const lift = (waveA + waveB) * amplitude;
    points.push({ x, y: yBase + (invert ? -lift : lift) });
  }

  ctx.save();

  // Create linear gradient to fade the fill to transparent at its limit
  const fillLimitY = yBase + (invert ? -thickness : thickness);
  const fillGradient = ctx.createLinearGradient(0, yBase, 0, fillLimitY);
  fillGradient.addColorStop(0, color);
  fillGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.lineTo(width, fillLimitY);
  ctx.lineTo(0, fillLimitY);
  ctx.closePath();

  ctx.globalAlpha = alphaScale;
  ctx.fillStyle = fillGradient;
  ctx.fill();

  ctx.restore();
}
