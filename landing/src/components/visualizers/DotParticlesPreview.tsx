"use client";

import { useEffect, useRef } from "react";

interface Particle {
  distance: number;
  speedSeed: number;
  sizeSeed: number;
  phase: number;
  jitterSpeed: number;
  counterFlow: boolean;
  colorIndex: number;
}

export function DotParticlesPreview({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
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
    let beatPulse = 0;
    
    // Procedural beat generation
    let beatTimer = 0;
    let nextBeatTime = 0.6;

    // Seeded random number generator
    const seededRandom = (seed: number) => {
      const value = Math.sin(seed * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };

    const createParticle = (index: number, count: number, perimeter: number): Particle => {
      const spacing = perimeter / Math.max(1, count);
      const offsetSeed = seededRandom(index + 1.7);

      return {
        distance: index * spacing + (offsetSeed - 0.5) * spacing * 0.34,
        speedSeed: 0.72 + seededRandom(index + 8.1) * 0.56,
        sizeSeed: seededRandom(index + 12.4),
        phase: seededRandom(index + 18.7) * Math.PI * 2,
        jitterSpeed: 1.8 + seededRandom(index + 25.3) * 2.6,
        counterFlow: seededRandom(index + 31.9) > 0.82, // ~18% flow anticlockwise for intersecting patterns
        colorIndex: index
      };
    };

    const ensureParticles = (width: number, height: number, count: number) => {
      const key = `${width}:${height}:${count}`;
      if (currentKeyRef.current === key) return;

      currentKeyRef.current = key;
      const perimeter = Math.max(1, 2 * (width + height));
      particlesRef.current = Array.from({ length: count }, (_, index) => 
        createParticle(index, count, perimeter)
      );
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

      // Spawning densities matching desktop balanced presets
      const particleCount = 42;
      ensureParticles(width, height, particleCount);

      // Increment time relative to deltaTime
      time += deltaTime * (active ? 0.9 : 0.3);

      // Procedural audio reactivity simulation
      if (active) {
        beatTimer += deltaTime;
        if (beatTimer > nextBeatTime) {
          beatPulse = 1.0; // trigger beat pulse spike
          nextBeatTime = 0.6 + Math.random() * 1.1;
          beatTimer = 0;
        }

        const baseAmbient = 0.12 + 0.06 * Math.sin(time * 1.5);
        const target = baseAmbient + beatPulse * 0.45;

        // Frame-rate independent LERP Attack & Decay
        smoothedLevel += (target - smoothedLevel) * (1 - Math.exp(-7.5 * deltaTime));
      } else {
        // Slow idle breathing state
        const idleTarget = 0.04 + 0.015 * Math.sin(time * 0.5);
        smoothedLevel += (idleTarget - smoothedLevel) * (1 - Math.exp(-2.5 * deltaTime));
        beatPulse = 0;
        beatTimer = 0;
      }

      // Decay beat pulse
      beatPulse *= Math.pow(0.12, deltaTime);

      ctx.clearRect(0, 0, width, height);

      // Draw faint dark backing fill
      ctx.fillStyle = "rgba(6, 9, 19, 0.92)";
      ctx.fillRect(0, 0, width, height);

      const profile = {
        baseSpeed: 25,
        audioBoost: 110,
        jitter: 2.2
      };

      const glowScale = 1.0;
      const perimeter = Math.max(1, 2 * (width + height));
      const energy = Math.max(0, Math.min(1, smoothedLevel));
      
      const currentSpeed = profile.baseSpeed + energy * profile.audioBoost + beatPulse * 30;
      const jitterAmount = profile.jitter * (0.46 + energy * 1.18 + beatPulse * 0.5);
      const baseOpacity = 0.42 + energy * 0.32 + beatPulse * 0.14;
      const glowBlur = (3.5 + energy * 6.5 + beatPulse * 3.5) * glowScale;

      const particleColors = [
        [34, 211, 238],   // Cyan
        [168, 85, 247],   // Purple
        [56, 189, 248],   // Light Blue
        [244, 248, 255]    // Silver/White
      ];

      // Draw all perimeter particles
      for (const particle of particlesRef.current) {
        const direction = particle.counterFlow ? -1 : 1;
        particle.distance += deltaTime * currentSpeed * particle.speedSeed * direction;

        // Wrap around boundary bounds
        if (particle.distance < 0) {
          particle.distance += perimeter;
        } else if (particle.distance > perimeter) {
          particle.distance -= perimeter;
        }

        const point = getPerimeterPoint(particle.distance, width, height);
        const jitter = (
          Math.sin(time * particle.jitterSpeed + particle.phase) * 0.72 +
          Math.sin(time * particle.jitterSpeed * 0.47 + particle.phase * 1.9) * 0.28
        ) * jitterAmount;

        const radius = 1.1 + particle.sizeSeed * 0.9 + energy * 0.45 + beatPulse * 0.3;
        const opacity = Math.max(0, Math.min(1, baseOpacity * (0.82 + particle.sizeSeed * 0.28)));
        const x = point.x + point.normalX * jitter;
        const y = point.y + point.normalY * jitter;

        const color = particleColors[particle.colorIndex % particleColors.length];
        
        // Render dot with a vector glow stroke
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // 1. Draw outer wide glow stroke
        ctx.lineWidth = radius * 4.0;
        ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity * 0.12})`;
        ctx.stroke();

        // 2. Draw sharp core particle fill
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
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

interface PerimeterPoint {
  x: number;
  y: number;
  normalX: number;
  normalY: number;
}

// Maps a linear distance to coordinate boundaries along the four edges
function getPerimeterPoint(distance: number, width: number, height: number): PerimeterPoint {
  const edgeOffset = 2.5;
  const perimeter = Math.max(1, 2 * (width + height));
  let wrappedDistance = distance % perimeter;

  if (wrappedDistance < 0) {
    wrappedDistance += perimeter;
  }

  // Top Edge
  if (wrappedDistance <= width) {
    return {
      x: wrappedDistance,
      y: edgeOffset,
      normalX: 0,
      normalY: 1
    };
  }

  // Right Edge
  if (wrappedDistance <= width + height) {
    return {
      x: width - edgeOffset,
      y: wrappedDistance - width,
      normalX: -1,
      normalY: 0
    };
  }

  // Bottom Edge
  if (wrappedDistance <= width * 2 + height) {
    return {
      x: width - (wrappedDistance - width - height),
      y: height - edgeOffset,
      normalX: 0,
      normalY: -1
    };
  }

  // Left Edge
  return {
    x: edgeOffset,
    y: height - (wrappedDistance - width * 2 - height),
    normalX: 1,
    normalY: 0
  };
}
