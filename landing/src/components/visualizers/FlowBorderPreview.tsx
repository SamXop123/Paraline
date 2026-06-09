"use client";

import { useEffect, useRef } from "react";

export function FlowBorderPreview({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let time = 0;
    let travelDistance = 0;
    let smoothedLevel = 0.04;
    
    // Procedural beat variables
    let beatTimer = 0;
    let nextBeatTime = 1.0;
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
      time += deltaTime * (active ? 0.85 : 0.28);

      // Update simulated audio level with physics
      if (active) {
        beatTimer += deltaTime;
        if (beatTimer > nextBeatTime) {
          beatSpike = 0.35 + Math.random() * 0.4; // simulated kick drum beat
          nextBeatTime = 0.9 + Math.random() * 1.5;
          beatTimer = 0;
        }

        // Exponential decay for the beat spike
        beatSpike += (0 - beatSpike) * (1 - Math.exp(-3.5 * deltaTime));

        const baseAmbient = 0.12 + 0.06 * Math.sin(time * 1.5);
        const target = baseAmbient + beatSpike;

        // Frame-rate independent LERP Attack & Decay
        smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-8.0 * deltaTime));
      } else {
        // Silent idle breathing state
        const idleTarget = 0.04 + 0.015 * Math.sin(time * 0.5);
        smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-2.5 * deltaTime));
        beatSpike = 0;
        beatTimer = 0;
      }

      const speedBase = 220;
      const speedBoost = 620;
      const speed = speedBase + smoothedLevel * speedBoost;
      travelDistance += speed * deltaTime;

      ctx.clearRect(0, 0, width, height);

      // Draw faint, premium dark backing fill
      ctx.fillStyle = "rgba(6, 9, 19, 0.92)";
      ctx.fillRect(0, 0, width, height);

      // Desktop theme parameters
      const glowMultiplier = 1.0;
      const thicknessBase = 2.0;
      const thickness = thicknessBase + smoothedLevel * (0.95 + glowMultiplier * 0.18);
      const edgeOffset = Math.max(1, thickness * 0.5) + 1.5;

      const left = edgeOffset;
      const top = edgeOffset;
      const right = Math.max(left + 1, width - edgeOffset);
      const bottom = Math.max(top + 1, height - edgeOffset);
      const horizontal = right - left;
      const vertical = bottom - top;
      const perimeter = horizontal * 2 + vertical * 2;

      const direction = 1; // clockwise

      // Draw standard subtle inner backing line
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.strokeRect(left, top, horizontal, vertical);
      ctx.restore();

      // Draw 4 flow edges
      drawFlowEdge(ctx, {
        x1: left, y1: top, x2: right, y2: top,
        startDistance: 0, perimeter, travelDistance, direction, thickness, glowMultiplier
      });
      drawFlowEdge(ctx, {
        x1: right, y1: top, x2: right, y2: bottom,
        startDistance: horizontal, perimeter, travelDistance, direction, thickness, glowMultiplier
      });
      drawFlowEdge(ctx, {
        x1: right, y1: bottom, x2: left, y2: bottom,
        startDistance: horizontal + vertical, perimeter, travelDistance, direction, thickness, glowMultiplier
      });
      drawFlowEdge(ctx, {
        x1: left, y1: bottom, x2: left, y2: top,
        startDistance: horizontal * 2 + vertical, perimeter, travelDistance, direction, thickness, glowMultiplier
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

interface FlowEdgeOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  startDistance: number;
  perimeter: number;
  travelDistance: number;
  direction: number;
  thickness: number;
  glowMultiplier: number;
}

// Highly performant edge flow drawing with multi-stroke vector-glow
function drawFlowEdge(ctx: CanvasRenderingContext2D, options: FlowEdgeOptions) {
  const { x1, y1, x2, y2, startDistance, perimeter, travelDistance, direction, thickness, glowMultiplier } = options;

  const edgeLength = Math.hypot(x2 - x1, y2 - y1);
  const segmentLength = 16;
  const segmentCount = Math.max(1, Math.ceil(edgeLength / segmentLength));
  const stopCount = segmentCount + 1;
  const stopDivisor = Math.max(1, stopCount - 1);

  const leadDistance = ((travelDistance % perimeter) + perimeter) % perimeter;
  const oppositeLeadDistance = (leadDistance + perimeter * 0.5) % perimeter;
  const emphasisLength = perimeter * 0.3;

  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  let peakTrailStrength = 0;

  for (let index = 0; index < stopCount; index++) {
    const t = index / stopDivisor;
    const segmentDistance = startDistance + edgeLength * t;
    const normalizedDistance = segmentDistance / perimeter;

    const wrappedDistanceA = computeWrappedDistance(leadDistance, segmentDistance, perimeter, direction);
    const wrappedDistanceB = computeWrappedDistance(oppositeLeadDistance, segmentDistance, perimeter, direction);
    const bandStrengthA = Math.max(0, Math.min(1, 1 - wrappedDistanceA / emphasisLength));
    const bandStrengthB = Math.max(0, Math.min(1, 1 - wrappedDistanceB / emphasisLength));
    const trailStrength = Math.max(bandStrengthA * bandStrengthA, bandStrengthB * bandStrengthB);

    const signedTravel = (travelDistance / perimeter) * direction;
    const shimmerPhase = normalizedDistance * Math.PI * 2 - signedTravel * 4.8;
    const shimmer = Math.sin(shimmerPhase * 2.1 - 0.8) * 0.5 + 0.5;
    const intensity = 0.22 + trailStrength * 0.62 + shimmer * 0.08;
    const opacity = Math.min(0.92, (0.2 + intensity * 0.5) * (0.88 + glowMultiplier * 0.18));

    const hue = (normalizedDistance * 360 + travelDistance * 0.62) % 360;
    const color = `hsla(${hue}, 96%, ${64 + intensity * 10}%, ${opacity})`;
    gradient.addColorStop(t, color);

    if (trailStrength > peakTrailStrength) {
      peakTrailStrength = trailStrength;
    }
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = gradient;

  const coreWidth = thickness + peakTrailStrength * (0.7 + glowMultiplier * 0.2);

  // 1. Draw outer wide glow stroke (zero GPU shadowBlur latency)
  ctx.lineWidth = coreWidth * 6.0;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // 2. Draw inner medium glow stroke
  ctx.lineWidth = coreWidth * 3.0;
  ctx.globalAlpha = 0.32;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // 3. Draw sharp core border stroke
  ctx.lineWidth = coreWidth;
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.restore();
}

function computeWrappedDistance(fromDistance: number, toDistance: number, perimeter: number, direction: number) {
  if (direction >= 0) {
    return (toDistance - fromDistance + perimeter) % perimeter;
  }
  return (fromDistance - toDistance + perimeter) % perimeter;
}
