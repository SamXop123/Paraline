"use client";

import { useEffect, useRef } from "react";

interface Stroke {
  side: "left" | "right";
  yBase: number;
  phase: number;
  speedSeed: number;
  amplitudeSeed: number;
  activationSeed: number;
  tiltSeed: number;
  lengthSeed: number;
  opacitySeed: number;
}

export function EdgeCrystalsPreview({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentKeyRef = useRef<string>("");

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
    let nextBeatTime = 0.6;
    let beatSpike = 0;

    // Seeded random number generator
    const seededRandom = (seed: number) => {
      const value = Math.sin(seed * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };

    const createStroke = (side: "left" | "right", index: number, height: number, verticalInset: number): Stroke => {
      const seed = index + (side === "left" ? 1.7 : 9.4);
      const randomA = seededRandom(seed);
      const randomB = seededRandom(seed + 2.1);
      const randomC = seededRandom(seed + 4.8);
      const randomD = seededRandom(seed + 7.3);
      const safeHeight = Math.max(1, height - verticalInset * 2);

      return {
        side,
        yBase: verticalInset + randomA * safeHeight,
        phase: randomB * Math.PI * 2,
        speedSeed: 0.85 + randomC * 0.6,
        amplitudeSeed: 0.72 + randomD * 0.7,
        activationSeed: randomA,
        tiltSeed: randomC * 2 - 1,
        lengthSeed: 0.7 + randomB * 0.75,
        opacitySeed: 0.68 + randomD * 0.32
      };
    };

    const ensureThemeState = (height: number, countPerSide: number) => {
      const key = `${height}:${countPerSide}`;
      if (currentKeyRef.current === key) return;

      currentKeyRef.current = key;
      const verticalInset = 16;
      const newStrokes: Stroke[] = [];

      for (let index = 0; index < countPerSide; index++) {
        newStrokes.push(createStroke("left", index, height, verticalInset));
        newStrokes.push(createStroke("right", index, height, verticalInset));
      }
      strokesRef.current = newStrokes;
    };

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

      // Density and flutter profiles based on desktop "balanced" theme settings
      const countPerSide = 18;
      ensureThemeState(height, countPerSide);

      // Increment time relative to deltaTime
      time += deltaTime * (active ? 0.95 : 0.3);

      // Update simulated audio level
      if (active) {
        beatTimer += deltaTime;
        if (beatTimer > nextBeatTime) {
          beatSpike = 0.35 + Math.random() * 0.45; // trigger simulated beat
          nextBeatTime = 0.6 + Math.random() * 1.0;
          beatTimer = 0;
        }

        beatSpike += (0 - beatSpike) * (1 - Math.exp(-4.5 * deltaTime));

        const baseAmbient = 0.15 + 0.08 * Math.sin(time * 1.4);
        const target = baseAmbient + beatSpike;

        smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-8.0 * deltaTime));
      } else {
        const idleTarget = 0.15 + 0.05 * Math.sin(time * 0.8);
        smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-2.5 * deltaTime));
        beatSpike = 0;
        beatTimer = 0;
      }

      // Smooth the energy attack/release
      const response = smoothedLevel > smoothedEnergy ? 11.0 : 5.0;
      smoothedEnergy += (smoothedLevel - smoothedEnergy) * (1 - Math.exp(-response * deltaTime));

      ctx.clearRect(0, 0, width, height);

      // Draw faint dark backing fill
      ctx.fillStyle = "rgba(6, 9, 19, 0.92)";
      ctx.fillRect(0, 0, width, height);

      const profile = {
        baseLength: 10,
        audioLengthBoost: 22,
        flutterAmplitude: 3.8,
        verticalFlutter: 2.1,
        speed: 2.4,
        lineWidth: 1.8,
        activationBoost: 0.24
      };

      const glowMultiplier = 1.0;
      const colors = {
        primary: [34, 211, 238],     // Cyan-400
        secondary: [168, 85, 247]     // Purple-500
      };

      ctx.lineCap = "round";

      // Draw each crystal stroke
      for (const stroke of strokesRef.current) {
        drawCrystalStroke(ctx, {
          width,
          time,
          energy: smoothedEnergy,
          stroke,
          profile,
          colors,
          glowMultiplier
        });
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

interface CrystalStrokeOptions {
  width: number;
  time: number;
  energy: number;
  stroke: Stroke;
  profile: {
    baseLength: number;
    audioLengthBoost: number;
    flutterAmplitude: number;
    verticalFlutter: number;
    speed: number;
    lineWidth: number;
    activationBoost: number;
  };
  colors: {
    primary: number[];
    secondary: number[];
  };
  glowMultiplier: number;
}

function drawCrystalStroke(ctx: CanvasRenderingContext2D, options: CrystalStrokeOptions) {
  const { width, time, energy, stroke, profile, colors, glowMultiplier } = options;

  const phase = time * profile.speed * stroke.speedSeed + stroke.phase;
  const activityWave = Math.sin(phase * 0.7 + stroke.activationSeed * Math.PI * 2) * 0.5 + 0.5;
  
  // Calculate crystal activation
  const activation = Math.max(0, Math.min(1, 
    (0.16 + energy * (0.66 + profile.activationBoost)) - stroke.activationSeed * 0.46 + activityWave * 0.34
  ));

  if (activation <= 0.05) return;

  const flutterX = Math.sin(phase * 1.6) * profile.flutterAmplitude * stroke.amplitudeSeed * (0.35 + energy * 0.9);
  const flutterY = Math.sin(phase * 1.1 + stroke.phase * 0.8) * profile.verticalFlutter * stroke.amplitudeSeed * (0.28 + energy * 0.55);
  const length = (profile.baseLength + energy * profile.audioLengthBoost) * stroke.lengthSeed * (0.75 + activation * 0.65);
  const opacity = Math.max(0.32, Math.min(1.0, (0.35 + activation * 0.55 + energy * 0.20) * stroke.opacitySeed));
  
  const y = stroke.yBase + flutterY;
  const edgeX = stroke.side === "left" ? 2.5 : width - 2.5;
  const inward = stroke.side === "left" ? 1 : -1;
  
  const startX = edgeX + inward * flutterX * 0.32;
  const endX = edgeX + inward * (length + flutterX);
  const tilt = stroke.tiltSeed * (0.6 + energy * 1.4);
  const startY = y - tilt;
  const endY = y + tilt;

  // Symmetrically color high energy spikes cyan, else purple
  const color = activation > 0.58 ? colors.primary : colors.secondary;
  const strokeColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;

  ctx.save();
  ctx.strokeStyle = strokeColor;

  const coreWidth = profile.lineWidth;

  // 1. Draw outer wide glow stroke
  ctx.lineWidth = coreWidth * 6.0;
  ctx.globalAlpha = opacity * 0.35;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // 2. Draw inner medium glow stroke
  ctx.lineWidth = coreWidth * 3.0;
  ctx.globalAlpha = opacity * 0.65;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // 3. Draw sharp core stroke
  ctx.lineWidth = coreWidth;
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.restore();
}
