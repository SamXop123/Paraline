"use client";

import { useEffect, useRef } from "react";

export function PulseLinesPreview({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let time = 0;
    
    // Physics variables
    let smoothedLevel = 0.04;
    let localAudioLevel = 0.24;
    let localSpeed = 0;
    let travelDistance = 0;

    // Procedural beat generation
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

      // Time progression using deltaTime
      time += deltaTime * (active ? 0.9 : 0.3);

      // Audio simulation
      if (active) {
        beatTimer += deltaTime;
        if (beatTimer > nextBeatTime) {
          beatSpike = 0.4 + Math.random() * 0.45; // beat impulse
          nextBeatTime = 0.7 + Math.random() * 1.3;
          beatTimer = 0;
        }

        beatSpike += (0 - beatSpike) * (1 - Math.exp(-4.0 * deltaTime));

        const baseAmbient = 0.15 + 0.07 * Math.sin(time * 1.2);
        const target = baseAmbient + beatSpike;

        smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-8.0 * deltaTime));
      } else {
        const idleTarget = 0.05 + 0.02 * Math.sin(time * 0.5);
        smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-2.5 * deltaTime));
        beatSpike = 0;
        beatTimer = 0;
      }

      // Profile constants matching the desktop client's "balanced" preset
      const profile = {
        amplitude: 15,
        trailGap: 22,
        lineWidth: 1.8,
        glow: 8,
        frontWidth: 48,
        baseSpeed: 30,
        audioSpeedBoost: 110,
        alpha: 0.8
      };

      // Motion calculations (framerate-independent LERP)
      const easedLevel = Math.sqrt(Math.max(0, Math.min(1, smoothedLevel / 0.72)));
      const energyResponse = easedLevel > localAudioLevel ? 14.0 : 4.5;
      localAudioLevel += (easedLevel - localAudioLevel) * (1 - Math.exp(-energyResponse * deltaTime));

      const targetSpeed = profile.baseSpeed * (active ? 0.8 : 0.35) + localAudioLevel * profile.audioSpeedBoost;
      localSpeed += (targetSpeed - localSpeed) * (1 - Math.exp(-8.0 * deltaTime));
      travelDistance += deltaTime * localSpeed;

      ctx.clearRect(0, 0, width, height);

      // Draw faint, premium dark backing fill
      ctx.fillStyle = "rgba(6, 9, 19, 0.92)";
      ctx.fillRect(0, 0, width, height);

      // Draw radial backing glow in the center bottom
      const centerX = width * 0.5;
      const yBase = height - 4;
      const glowGrad = ctx.createRadialGradient(centerX, yBase, 0, centerX, yBase, 120);
      glowGrad.addColorStop(0, "rgba(34, 211, 238, 0.08)");
      glowGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.03)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, height - 48, width, 48);

      // Draw horizontal baseline track
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      ctx.lineTo(width, yBase);
      ctx.stroke();
      ctx.restore();

      // Colors
      const primaryColor = `rgba(34, 211, 238, ${profile.alpha})`; // Cyan
      const echoColor = `rgba(168, 85, 247, ${profile.alpha * 0.65})`; // Purple

      // Echo Ripple (drawn slightly behind primary)
      const echoTravelDist = travelDistance - profile.trailGap * 0.72;
      drawRipplePath(ctx, {
        width,
        yBase,
        time: time - 0.12,
        smoothedLevel: localAudioLevel,
        travelDistance: echoTravelDist,
        profile: {
          ...profile,
          amplitude: profile.amplitude * 0.7,
          frontWidth: profile.frontWidth * 0.82,
          lineWidth: Math.max(1.0, profile.lineWidth * 0.72)
        },
        color: echoColor
      });

      // Primary Ripple
      drawRipplePath(ctx, {
        width,
        yBase,
        time,
        smoothedLevel: localAudioLevel,
        travelDistance,
        profile,
        color: primaryColor
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

interface PulseRippleOptions {
  width: number;
  yBase: number;
  time: number;
  smoothedLevel: number;
  travelDistance: number;
  profile: {
    amplitude: number;
    trailGap: number;
    lineWidth: number;
    glow: number;
    frontWidth: number;
  };
  color: string;
}

function drawRipplePath(ctx: CanvasRenderingContext2D, options: PulseRippleOptions) {
  const { width, yBase, time, smoothedLevel, travelDistance, profile, color } = options;
  const centerX = width * 0.5;
  const maxDistance = centerX + profile.frontWidth * 1.25;
  const frontDistance = ((travelDistance % maxDistance) + maxDistance) % maxDistance;
  const step = 4; // High-precision sampling for smooth curves
  const waveAmplitude = profile.amplitude * (0.45 + smoothedLevel * 1.05);
  const breakStrength = 0.024;

  const points: { x: number; y: number }[] = [];

  for (let x = 0; x <= width + step; x += step) {
    const distanceFromCenter = Math.abs(x - centerX);

    // Front envelope Gaussian bell-curve
    const deltaFront = Math.abs(distanceFromCenter - frontDistance);
    const frontEnvelope = Math.exp(-(deltaFront * deltaFront) / (2 * profile.frontWidth * profile.frontWidth));

    // Tail envelope (creates a trailing secondary bounce)
    const deltaTail = Math.abs(distanceFromCenter - Math.max(0, frontDistance - profile.trailGap));
    const tailEnvelope = Math.exp(-(deltaTail * deltaTail) / (2 * (profile.frontWidth * 1.18) * (profile.frontWidth * 1.18))) * 0.44;

    const rippleEnvelope = Math.max(0, Math.min(1, frontEnvelope + tailEnvelope));

    // Sine components
    const mainWave = Math.sin(distanceFromCenter * 0.12 - frontDistance * 0.08);
    const supportWave = Math.sin(distanceFromCenter * 0.065 - frontDistance * 0.045) * 0.4;
    const signedWave = (mainWave + supportWave) * rippleEnvelope;

    // Small ambient jitter break
    const subtleBreak = Math.sin(x * 0.024 + time * 3.2) * breakStrength;

    const y = yBase - waveAmplitude * (signedWave + subtleBreak);
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
  ctx.strokeStyle = color;

  // 1. Draw outer wide glow stroke
  ctx.lineWidth = profile.lineWidth * 7.5;
  ctx.globalAlpha = 0.1;
  buildPath();
  ctx.stroke();

  // 2. Draw inner medium glow stroke
  ctx.lineWidth = profile.lineWidth * 3.2;
  ctx.globalAlpha = 0.3;
  buildPath();
  ctx.stroke();

  // 3. Draw sharp core stroke
  ctx.lineWidth = profile.lineWidth;
  ctx.globalAlpha = 1.0;
  buildPath();
  ctx.stroke();

  ctx.restore();
}
