"use client";

import { useEffect, useRef } from "react";

export function ReactiveBorderPreview({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let time = 0;
    let smoothedLevel = 0.04;
    
    // Procedural beat variables
    let beatTimer = 0;
    let nextBeatTime = 0.8;
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
      time += deltaTime * (active ? 0.95 : 0.32);

      // Update simulated audio level with physics
      if (active) {
        beatTimer += deltaTime;
        if (beatTimer > nextBeatTime) {
          beatSpike = 0.4 + Math.random() * 0.45; // simulated kick drum beat
          nextBeatTime = 0.7 + Math.random() * 1.2;
          beatTimer = 0;
        }

        // Exponential decay for the beat spike
        beatSpike += (0 - beatSpike) * (1 - Math.exp(-4.2 * deltaTime));

        const baseAmbient = 0.15 + 0.08 * Math.sin(time * 1.2);
        const target = baseAmbient + beatSpike;

        // Frame-rate independent LERP Attack & Decay
        smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-8.5 * deltaTime));
      } else {
        // Silent idle breathing state
        const idleTarget = 0.04 + 0.02 * Math.sin(time * 0.5);
        smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-2.5 * deltaTime));
        beatSpike = 0;
        beatTimer = 0;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw faint, premium dark backing fill
      ctx.fillStyle = "rgba(6, 9, 19, 0.92)";
      ctx.fillRect(0, 0, width, height);

      // Desktop theme styling
      const thicknessBase = 2.0;
      const thickness = thicknessBase + smoothedLevel * 1.6;
      const edgeOffset = Math.max(1, thickness * 0.5) + 1.5;

      const left = edgeOffset;
      const top = edgeOffset;
      const right = Math.max(left + 1, width - edgeOffset);
      const bottom = Math.max(top + 1, height - edgeOffset);
      const horizontal = right - left;
      const vertical = bottom - top;
      const perimeter = horizontal * 2 + vertical * 2;

      const speed = 40 + smoothedLevel * 140;
      const hueOffset = time * speed;
      const opacity = 0.54 + smoothedLevel * 0.22;

      // Draw standard subtle inner backing line
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = thickness + 0.8;
      ctx.strokeRect(left, top, horizontal, vertical);
      ctx.restore();

      // Draw 4 reactive edges
      // Top Edge
      drawReactiveEdge(ctx, {
        x1: left, y1: top, x2: right, y2: top,
        startDistance: 0, perimeter, hueOffset, thickness, opacity
      });
      // Right Edge
      drawReactiveEdge(ctx, {
        x1: right, y1: top, x2: right, y2: bottom,
        startDistance: horizontal, perimeter, hueOffset, thickness, opacity
      });
      // Bottom Edge
      drawReactiveEdge(ctx, {
        x1: right, y1: bottom, x2: left, y2: bottom,
        startDistance: horizontal + vertical, perimeter, hueOffset, thickness, opacity
      });
      // Left Edge
      drawReactiveEdge(ctx, {
        x1: left, y1: bottom, x2: left, y2: top,
        startDistance: horizontal * 2 + vertical, perimeter, hueOffset, thickness, opacity
      });

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

interface ReactiveEdgeOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  startDistance: number;
  perimeter: number;
  hueOffset: number;
  thickness: number;
  opacity: number;
}

// Highly performant gradient-aware border stroke using vector-glow layering
function drawReactiveEdge(ctx: CanvasRenderingContext2D, options: ReactiveEdgeOptions) {
  const { x1, y1, x2, y2, startDistance, perimeter, hueOffset, thickness, opacity } = options;

  const edgeLength = Math.hypot(x2 - x1, y2 - y1);
  const segmentLength = 64; // Segment spacing for high-density gradient stops
  const segmentCount = Math.max(1, Math.ceil(edgeLength / segmentLength));
  const stopCount = segmentCount + 1;
  const stopDivisor = Math.max(1, stopCount - 1);

  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

  for (let index = 0; index < stopCount; index++) {
    const t = index / stopDivisor;
    const normalizedDistance = (startDistance + edgeLength * t) / perimeter;
    const hue = (normalizedDistance * 360 + hueOffset) % 360;
    const color = `hsla(${hue}, 92%, 64%, ${opacity})`;
    gradient.addColorStop(t, color);
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = gradient;

  // 1. Draw outer wide glow stroke (zero GPU shadowBlur latency)
  ctx.lineWidth = thickness * 6.0;
  ctx.globalAlpha = opacity * 0.12;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // 2. Draw inner medium glow stroke
  ctx.lineWidth = thickness * 3.0;
  ctx.globalAlpha = opacity * 0.32;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // 3. Draw sharp core border stroke
  ctx.lineWidth = thickness;
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.restore();
}
