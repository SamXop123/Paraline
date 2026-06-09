"use client";

import { useEffect, useRef } from "react";

interface Flake {
  x: number;
  y: number;
  depth: number; // 0 = background (far/slow), 1 = midground (bubble), 2 = foreground (blurred bokeh)
  speedSeed: number;
  driftSeed: number;
  driftPhase: number;
  driftDirection: number;
  inwardBias: number;
  size: number;
  opacity: number;
  limitY: number;
  isPink: boolean;
  turbulenceSpeed: number;
}

export function SnowParticlesPreview({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flakesRef = useRef<Flake[]>([]);
  const spawnCarryRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

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
    let beatPulse = 0;

    // Procedural beat generation
    let beatTimer = 0;
    let nextBeatTime = 0.6;

    const createFlake = (width: number, height: number, forceInitialY = false): Flake => {
      const depthRand = Math.random();
      let depth = 1; // 0 = background, 1 = midground, 2 = foreground
      if (depthRand < 0.35) {
        depth = 0;
      } else if (depthRand > 0.86) {
        depth = 2;
      }

      // Sizes according to depth layers
      let size = 1.8 + Math.random() * 2.2;
      if (depth === 0) {
        size = 0.8 + Math.random() * 0.8;
      } else if (depth === 2) {
        size = 4.2 + Math.random() * 3.0;
      }

      // Spawn coordinates
      const spawnWidth = width * 0.95;
      const centerWeighted = (Math.random() + Math.random() - 1.0) * spawnWidth * 0.5;
      const x = width * 0.5 + centerWeighted;
      
      // Melt midway between 35% and 60% of container height
      const limitY = height * 0.35 + Math.random() * height * 0.25;
      
      // Initialize flake position (pre-populate only above the melt limit)
      const y = forceInitialY 
        ? Math.random() * limitY 
        : -(size + Math.random() * 12);

      return {
        x,
        y,
        depth,
        speedSeed: (depth === 0 ? 0.42 : depth === 2 ? 1.35 : 0.82) + Math.random() * 0.3,
        driftSeed: 0.6 + Math.random() * 0.8,
        driftPhase: Math.random() * Math.PI * 2,
        driftDirection: Math.random() > 0.5 ? 1 : -1,
        inwardBias: 0.8 + Math.random() * 0.8,
        size,
        opacity: depth === 0 ? 0.15 + Math.random() * 0.15 : depth === 2 ? 0.16 + Math.random() * 0.14 : 0.32 + Math.random() * 0.24,
        limitY,
        isPink: Math.random() > 0.65, // ~35% rose-pink, 65% cyan-blue
        turbulenceSpeed: 1.2 + Math.random() * 2.2
      };
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

      // Pre-populate particles on mount so the card isn't empty at first
      if (!isInitializedRef.current && width > 0 && height > 0) {
        const initialCount = 28;
        for (let i = 0; i < initialCount; i++) {
          flakesRef.current.push(createFlake(width, height, true));
        }
        isInitializedRef.current = true;
      }

      // Increment time relative to deltaTime
      time += deltaTime * (active ? 0.85 : 0.3);

      // Procedural audio reactivity
      if (active) {
        beatTimer += deltaTime;
        if (beatTimer > nextBeatTime) {
          beatPulse = 1.0;
          nextBeatTime = 0.5 + Math.random() * 1.0;
          beatTimer = 0;
        }

        const baseAmbient = 0.12 + 0.05 * Math.sin(time * 1.4);
        const target = baseAmbient + beatPulse * 0.4;
        smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-6.8 * deltaTime));
      } else {
        const idleTarget = 0.04 + 0.015 * Math.sin(time * 0.5);
        smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-2.2 * deltaTime));
        beatPulse = 0;
        beatTimer = 0;
      }

      // Decay beat pulse
      beatPulse *= Math.pow(0.12, deltaTime);

      const energy = Math.max(0, Math.min(1, smoothedLevel));

      // Spawning loop
      const baseSpawnRate = 8.0;
      const audioSpawnBoost = 20.0;
      const spawnRate = (baseSpawnRate + energy * audioSpawnBoost) * (active ? 1.0 : 0.45);
      spawnCarryRef.current += deltaTime * spawnRate;

      const maxParticles = 36;
      while (spawnCarryRef.current >= 1 && flakesRef.current.length < maxParticles) {
        flakesRef.current.push(createFlake(width, height, false));
        spawnCarryRef.current -= 1.0;
      }

      // Physics parameters
      const baseFallSpeed = 16.0;
      const audioSpeedBoost = 34.0;
      const windDriftAmt = 12.0;
      const globalWind = Math.sin(time * 0.4) * 0.42;

      flakesRef.current = flakesRef.current.filter((flake) => {
        const gravitySpeed = (baseFallSpeed + energy * audioSpeedBoost) * flake.speedSeed;
        const driftOsc = Math.sin(time * (0.6 * flake.driftSeed) + flake.driftPhase) * windDriftAmt * flake.driftSeed * (0.4 + energy * 0.6);
        const centerPull = (width * 0.5 - flake.x) * 0.02 * flake.inwardBias;
        const turbulence = Math.sin(time * flake.turbulenceSpeed + flake.driftPhase) * 1.4 * (0.5 + energy * 0.5);

        flake.x += (driftOsc * flake.driftDirection + globalWind * 14 + centerPull + turbulence) * deltaTime;
        flake.y += (gravitySpeed + beatPulse * 22) * deltaTime;

        // Cull flakes when out of bounds, max lifetime, or when melted below limitY
        const outOfBoundsX = flake.x < -width * 0.1 || flake.x > width * 1.1;
        const outOfBoundsY = flake.y > height + 10;
        const melted = flake.y > flake.limitY;

        return !outOfBoundsX && !outOfBoundsY && !melted;
      });

      ctx.clearRect(0, 0, width, height);

      // Draw faint premium dark backing fill
      ctx.fillStyle = "rgba(6, 9, 19, 0.92)";
      ctx.fillRect(0, 0, width, height);

      // Draw aurora lighting at the top
      const auroraGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
      const intensity = 0.03 + energy * 0.08 + beatPulse * 0.04;
      auroraGrad.addColorStop(0, `rgba(244, 63, 94, ${intensity * 0.8})`); 
      auroraGrad.addColorStop(0.3, `rgba(34, 211, 238, ${intensity * 1.1})`); 
      auroraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, width, height * 0.45);

      // Render snowflakes
      for (const flake of flakesRef.current) {
        // Calculate gradual melt fade: begins fading out after crossing 60% of limitY
        const meltStart = flake.limitY * 0.6;
        const meltFade = flake.y < meltStart
          ? 1.0
          : Math.max(0, Math.min(1, (flake.limitY - flake.y) / (flake.limitY - meltStart)));

        const radius = flake.size * (0.85 + energy * 0.24 + beatPulse * 0.15);
        const opacity = Math.max(0, Math.min(1, flake.opacity * meltFade * (0.75 + energy * 0.25)));

        const r = flake.isPink ? 244 : 34;
        const g = flake.isPink ? 63 : 211;
        const b = flake.isPink ? 94 : 238;

        ctx.save();
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, radius, 0, Math.PI * 2);

        // Every particle is drawn as a soft, fluffy snowflake radial gradient
        const snowGrad = ctx.createRadialGradient(flake.x, flake.y, 0, flake.x, flake.y, radius);
        snowGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`); // Pure white core
        snowGrad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${opacity * 0.55})`); // Soft colored halo
        snowGrad.addColorStop(1, "rgba(0, 0, 0, 0)"); // Fades out completely

        ctx.fillStyle = snowGrad;
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
