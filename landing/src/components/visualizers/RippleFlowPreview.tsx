"use client";

import { useEffect, useRef } from "react";

interface Wavefront {
  distance: number;
  speedScale: number;
  bornAt: number;
  phase: number;
  alphaScale: number;
  segmentScale: number;
  maxDistancePadding: number;
}

export function RippleFlowPreview({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wavefrontsRef = useRef<Wavefront[]>([]);
  const nextSpawnAtRef = useRef<number>(0);
  const waveSequenceRef = useRef<number>(0);

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
    let smoothedEnergy = 0.22;

    // Procedural beat generation
    let beatTimer = 0;
    let nextBeatTime = 0.7;
    let beatSpike = 0;

    const createWavefront = (bornTime: number, segmentLength: number): Wavefront => {
      const sequenceOffset = waveSequenceRef.current % 4;
      waveSequenceRef.current += 1;

      return {
        distance: 0,
        speedScale: 0.94 + sequenceOffset * 0.035,
        bornAt: bornTime,
        phase: sequenceOffset * Math.PI * 0.5,
        alphaScale: 1.0 - sequenceOffset * 0.045,
        segmentScale: 1.0 - sequenceOffset * 0.035,
        maxDistancePadding: segmentLength * 0.7
      };
    };

    let spawnTimer = 0;

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

      // Increment color/break wave phase time
      time += deltaTime * (active ? 0.95 : 0.45);

      // Procedural audio reactivity simulation
      if (active) {
        beatTimer += deltaTime;
        if (beatTimer > nextBeatTime) {
          beatSpike = 0.35 + Math.random() * 0.45; // kick drum pulse
          nextBeatTime = 0.6 + Math.random() * 1.3;
          beatTimer = 0;
        }

        // Exponential decay for beat spike
        beatSpike += (0 - beatSpike) * (1 - Math.exp(-4.2 * deltaTime));

        const baseAmbient = 0.15 + 0.08 * Math.sin(time * 1.3);
        const target = baseAmbient + beatSpike;

        // Frame-rate independent LERP Attack & Decay
        smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-7.5 * deltaTime));
      } else {
        // Slow idle breathing state
        const idleTarget = 0.04 + 0.015 * Math.sin(time * 0.5);
        smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-2.5 * deltaTime));
        beatSpike = 0;
        beatTimer = 0;
      }

      // Smooth energy using LERP
      smoothedEnergy += (smoothedLevel - smoothedEnergy) * (1 - Math.exp(-8.0 * deltaTime));

      // Wavefront profile settings matching desktop "balanced" preset
      const profile = {
        maxFronts: 6,
        segmentLength: 20,
        lineWidth: 1.8,
        baseSpeed: 65,
        audioBoost: 110,
        spawnInterval: 0.68,
        fadePower: 1.3,
        breakAmount: 0.08,
        alpha: 0.78
      };

      const maxDistance = height * 0.5 + profile.segmentLength;

      // Spawn new waves periodically based on real deltaTime (not scaled time)
      const currentSpawnInterval = Math.max(0.25, (profile.spawnInterval - smoothedEnergy * 0.22) * (active ? 1.0 : 1.35));
      spawnTimer += deltaTime;
      if (spawnTimer >= currentSpawnInterval) {
        wavefrontsRef.current.unshift(createWavefront(time, profile.segmentLength));
        spawnTimer = 0;
      }

      // Update wavefront distances (slower speed when not active to fill the card)
      const speed = (profile.baseSpeed + smoothedEnergy * profile.audioBoost) * (active ? 1.0 : 0.45);
      for (const front of wavefrontsRef.current) {
        front.distance += deltaTime * speed * front.speedScale;
      }

      // Cull wavefronts that travel beyond visible boundaries
      wavefrontsRef.current = wavefrontsRef.current
        .filter((front) => front.distance <= maxDistance + front.maxDistancePadding)
        .slice(0, profile.maxFronts);

      ctx.clearRect(0, 0, width, height);

      // Draw faint dark backing fill
      ctx.fillStyle = "rgba(6, 9, 19, 0.92)";
      ctx.fillRect(0, 0, width, height);

      const color = [34, 211, 238]; // Cyan accent
      const centerY = height * 0.5;
      const leftX = 4.5;
      const rightX = width - 4.5;

      // Draw central source origin lines
      const originOpacity = Math.max(0, Math.min(1, 0.18 + smoothedEnergy * 0.32));
      const sourceLength = 8 + smoothedEnergy * 8;
      drawVerticalSegment(ctx, leftX, centerY, sourceLength, color, originOpacity, profile, 0);
      drawVerticalSegment(ctx, rightX, centerY, sourceLength, color, originOpacity, profile, 0);

      // Draw expanding wavefronts along left and right side columns
      for (const front of wavefrontsRef.current) {
        const fade = Math.max(0, Math.min(1, 1 - front.distance / maxDistance));
        const opacity = Math.pow(fade, profile.fadePower) * profile.alpha * front.alphaScale;
        const length = profile.segmentLength * front.segmentScale * (0.76 + smoothedEnergy * 0.42);
        const breakFactor = Math.sin(front.distance * 0.055 + front.phase) * 0.5 + 0.5;

        if (opacity <= 0.01) continue;

        const upperY = centerY - front.distance;
        const lowerY = centerY + front.distance;

        // Draw upper vertical segments
        if (upperY > -profile.segmentLength) {
          drawVerticalSegment(ctx, leftX, upperY, length, color, opacity, profile, breakFactor);
          drawVerticalSegment(ctx, rightX, upperY, length, color, opacity, profile, breakFactor);
        }

        // Draw lower vertical segments
        if (lowerY < height + profile.segmentLength) {
          drawVerticalSegment(ctx, leftX, lowerY, length, color, opacity, profile, breakFactor);
          drawVerticalSegment(ctx, rightX, lowerY, length, color, opacity, profile, breakFactor);
        }
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

// Renders a vertically aligned line segment split symmetrically by a ripple gap
function drawVerticalSegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  color: number[],
  opacity: number,
  profile: { lineWidth: number; breakAmount: number },
  breakFactor: number
) {
  const halfLength = length * 0.5;
  const gap = length * profile.breakAmount * breakFactor;

  const buildPath = () => {
    ctx.beginPath();
    ctx.moveTo(x, y - halfLength);
    ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap);
    ctx.lineTo(x, y + halfLength);
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;

  // 1. Draw outer wide glow stroke
  ctx.lineWidth = profile.lineWidth * 6.0;
  ctx.globalAlpha = opacity * 0.12;
  buildPath();
  ctx.stroke();

  // 2. Draw inner medium glow stroke
  ctx.lineWidth = profile.lineWidth * 3.0;
  ctx.globalAlpha = opacity * 0.32;
  buildPath();
  ctx.stroke();

  // 3. Draw sharp core border stroke
  ctx.lineWidth = profile.lineWidth;
  ctx.globalAlpha = opacity;
  buildPath();
  ctx.stroke();

  ctx.restore();
}
