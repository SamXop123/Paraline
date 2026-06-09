"use client";

import { useEffect, useRef } from "react";

export function SideBarsPreview({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let time = 0;
    
    // Physics
    let smoothedLevel = 0.04;
    
    // Procedural beat generation
    let beatTimer = 0;
    let nextBeatTime = 0.7;
    let beatSpike = 0;

    const render = (now: number) => {
      const deltaTime = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Handle DPI scaling
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
      time += deltaTime * (active ? 0.9 : 0.3);

      // Procedural audio reactivity simulation
      if (active) {
        beatTimer += deltaTime;
        if (beatTimer > nextBeatTime) {
          beatSpike = 0.35 + Math.random() * 0.45; // beat kick spike
          nextBeatTime = 0.6 + Math.random() * 1.2;
          beatTimer = 0;
        }

        // Exponential decay for beat spike
        beatSpike += (0 - beatSpike) * (1 - Math.exp(-4.0 * deltaTime));

        const baseAmbient = 0.12 + 0.06 * Math.sin(time * 1.5);
        const target = baseAmbient + beatSpike;

        // Frame-rate independent LERP Attack & Decay
        smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-8.0 * deltaTime));
      } else {
        // Slow idle breathing state
        const idleTarget = 0.04 + 0.015 * Math.sin(time * 0.5);
        smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-2.5 * deltaTime));
        beatSpike = 0;
        beatTimer = 0;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw faint dark backing fill
      ctx.fillStyle = "rgba(6, 9, 19, 0.92)";
      ctx.fillRect(0, 0, width, height);

      // Profile parameters matching the desktop thick EQ preset
      const barHeight = 3.0;
      const gap = 5.0;
      const step = barHeight + gap;
      const sideInset = 6;
      const verticalInset = 16;
      
      const usableHeight = height - verticalInset * 2;
      const count = Math.max(12, Math.floor(usableHeight / step));
      const finalStep = usableHeight / Math.max(1, count - 1);

      const baseOpacity = 0.34 + smoothedLevel * 0.18;

      const colorsPalette = [
        [255, 82, 102],   // Soft Pink-Red
        [102, 132, 255],  // Pastel Blue
        [245, 248, 255],  // White-Silver
        [92, 244, 255],   // Aqua
        [255, 118, 214]   // Neon Magenta
      ];

      const mixChannel = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

      // Draw bars symmetrically on both left and right sides
      for (let index = 0; index < count; index++) {
        const normalizedY = count <= 1 ? 0.5 : index / (count - 1);
        const distanceFromCenter = Math.abs(normalizedY - 0.5) / 0.5;
        const centerBias = Math.pow(1 - distanceFromCenter, 1.4);
        
        // Dynamic length math
        const motion = Math.sin(time * 3.8 + normalizedY * 10.5) * 0.5 + 0.5;
        const audioWeight = 0.2 + centerBias * 1.45;
        const baseLength = 4 + centerBias * 12;
        const activeLength = smoothedLevel * (10 + centerBias * 48) * (0.72 + motion * 0.5);
        const barLength = Math.max(2, baseLength + activeLength);

        // Color cycle interpolation
        const travel = ((normalizedY + time * 0.045) % 1 + 1) % 1;
        const scaled = travel * colorsPalette.length;
        const indexA = Math.floor(scaled) % colorsPalette.length;
        const indexB = (indexA + 1) % colorsPalette.length;
        const blend = scaled - Math.floor(scaled);
        const colorA = colorsPalette[indexA] || colorsPalette[0];
        const colorB = colorsPalette[indexB] || colorsPalette[0];
        const r = mixChannel(colorA[0], colorB[0], blend);
        const g = mixChannel(colorA[1], colorB[1], blend);
        const b = mixChannel(colorA[2], colorB[2], blend);

        const opacity = Math.max(0, Math.min(1, baseOpacity + centerBias * 0.24 + motion * 0.06));
        const fillColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

        const y = verticalInset + index * finalStep - barHeight * 0.5;
        const leftX = sideInset;
        const rightX = width - sideInset - barLength;

        // Render left and right bars using multi-stroke glow styling
        ctx.save();
        ctx.fillStyle = fillColor;

        // 1. Draw outer wide glow stroke
        ctx.shadowBlur = 0;
        ctx.globalAlpha = opacity * 0.12;
        ctx.beginPath();
        drawRoundedBar(ctx, leftX, y, barLength, barHeight, barHeight * 0.5);
        drawRoundedBar(ctx, rightX, y, barLength, barHeight, barHeight * 0.5);
        ctx.fill();

        // 2. Draw inner medium glow stroke
        ctx.globalAlpha = opacity * 0.32;
        ctx.beginPath();
        drawRoundedBar(ctx, leftX, y, barLength, barHeight, barHeight * 0.5);
        drawRoundedBar(ctx, rightX, y, barLength, barHeight, barHeight * 0.5);
        ctx.fill();

        // 3. Draw core bar shape
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        drawRoundedBar(ctx, leftX, y, barLength, barHeight, barHeight * 0.5);
        drawRoundedBar(ctx, rightX, y, barLength, barHeight, barHeight * 0.5);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [active]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 bg-transparent rounded-2xl" 
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
