"use client";

import { useEffect, useRef } from "react";

interface AuroraLayer {
  baseAmplitude: number;
  frequency: number;
  speed: number;
  turbulenceFreq: number;
  turbulenceSpeed: number;
  maxHeight: number; // fraction of height
  opacity: number;
  colorOffset: number;
  widthScale: number;
}

interface Pulse {
  birth: number;
  intensity: number;
  speed: number;
}

export function AuroraDriftPreview({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    
    // Theme states (closure parameters matching desktop auroraDrift.js)
    let time = 0;
    let localAudioLevel = 0.20;
    let averageVolume = 0.25;
    let bassLevelState = 0.20;
    let midLevelState = 0.20;
    let midVariance = 0.05;
    let shimmerLevelState = 0.05;
    let globalDriftPhase = 0;
    let energyFlowOffset = 0;

    // Physics-based traveling shockwaves matching desktop application
    let activePulses: Pulse[] = [];
    let lastPulseTime = 0;

    // Color Palette: Cyan-Violet
    const PALETTE = [
      [185, 82, 45],   // Vibrant HSL Cyan
      [210, 76, 46],   // Neon Blue
      [255, 68, 52],   // Ethereal Violet
      [285, 62, 50],   // Celestial Purple
      [320, 52, 52],   // Soft Magenta
      [285, 62, 50],   // Celestial Purple (loop back)
      [255, 68, 52],   // Ethereal Violet (loop back)
      [210, 76, 46],   // Neon Blue (loop back)
    ];

    // Aurora Layers (Background to Foreground - total 6 layers matched and scaled for preview)
    const LAYERS: AuroraLayer[] = [
      // Layer 0: Deep background haze
      {
        baseAmplitude: 20,
        frequency: 0.0016 * 1.8,
        speed: 0.04,
        turbulenceFreq: 0.0035,
        turbulenceSpeed: 0.03,
        maxHeight: 0.28 * 2.0, // Balanced visual height
        opacity: 0.08,
        colorOffset: 0.0,
        widthScale: 1.0,
      },
      // Layer 1: Mid-background glow
      {
        baseAmplitude: 24,
        frequency: 0.0022 * 1.8,
        speed: 0.06,
        turbulenceFreq: 0.0048,
        turbulenceSpeed: 0.045,
        maxHeight: 0.24 * 2.0,
        opacity: 0.12,
        colorOffset: 0.12,
        widthScale: 1.0,
      },
      // Layer 2: Primary curtain - main visible ribbon
      {
        baseAmplitude: 30,
        frequency: 0.0028 * 1.8,
        speed: 0.08,
        turbulenceFreq: 0.0055,
        turbulenceSpeed: 0.06,
        maxHeight: 0.21 * 2.0,
        opacity: 0.18,
        colorOffset: 0.25,
        widthScale: 1.0,
      },
      // Layer 3: Bright accent curtain
      {
        baseAmplitude: 26,
        frequency: 0.0035 * 1.8,
        speed: 0.10,
        turbulenceFreq: 0.007,
        turbulenceSpeed: 0.075,
        maxHeight: 0.18 * 2.0,
        opacity: 0.22,
        colorOffset: 0.42,
        widthScale: 0.94,
      },
      // Layer 4: Crisp detail ribbon
      {
        baseAmplitude: 22,
        frequency: 0.0044 * 1.8,
        speed: 0.12,
        turbulenceFreq: 0.009,
        turbulenceSpeed: 0.09,
        maxHeight: 0.15 * 2.0,
        opacity: 0.16,
        colorOffset: 0.65,
        widthScale: 0.88,
      },
      // Layer 5: Topmost wisps
      {
        baseAmplitude: 16,
        frequency: 0.0055 * 1.8,
        speed: 0.15,
        turbulenceFreq: 0.011,
        turbulenceSpeed: 0.11,
        maxHeight: 0.12 * 2.0,
        opacity: 0.10,
        colorOffset: 0.82,
        widthScale: 0.80,
      }
    ];

    const lerpHSL = (a: number[], b: number[], t: number): number[] => {
      let dh = b[0] - a[0];
      if (dh > 180) dh -= 360;
      if (dh < -180) dh += 360;
      return [
        (a[0] + dh * t + 360) % 360,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
      ];
    };

    const getAuroraColor = (pos: number): number[] => {
      const count = PALETTE.length;
      const scaled = ((pos % 1) + 1) % 1 * (count - 1);
      const idx = Math.floor(scaled);
      const frac = scaled - idx;
      const a = PALETTE[idx];
      const b = PALETTE[Math.min(idx + 1, count - 1)];
      return lerpHSL(a, b, frac);
    };

    const hsla = (hsl: number[], alpha: number): string => {
      return `hsla(${hsl[0].toFixed(1)}, ${hsl[1].toFixed(1)}%, ${hsl[2].toFixed(1)}%, ${alpha})`;
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

      // Increment elapsed time (slightly accelerated for web preview engagement)
      time += deltaTime * 1.5;

      // Simulated audio LERP with attack/release envelopes (increased default level for visibility)
      const targetLevel = active 
        ? 0.22 + 0.16 * Math.sin(time * 1.6) + (Math.random() > 0.96 ? 0.35 : 0) 
        : 0.14 + 0.06 * Math.sin(time * 0.8);
      
      const smoothSignal = (current: number, target: number, attack: number, release: number) => {
        const k = target > current ? attack : release;
        return current + (target - current) * (1 - Math.exp(-k * deltaTime * 60));
      };

      localAudioLevel = smoothSignal(localAudioLevel, targetLevel, 0.08, 0.08);
      averageVolume = smoothSignal(averageVolume, targetLevel, 0.003, 0.003);

      const rawSurge = Math.max(0, targetLevel - averageVolume * 1.25);
      bassLevelState = smoothSignal(bassLevelState, rawSurge * 1.5, 0.07, 0.02);

      const midTarget = targetLevel;
      midLevelState = smoothSignal(midLevelState, midTarget, 0.06, 0.06);
      midVariance = smoothSignal(midVariance, Math.abs(targetLevel - midLevelState), 0.05, 0.05);
      const expressiveness = Math.min(1.0, midLevelState * 0.7 + midVariance * 1.6);

      const trebleTransient = Math.max(0, targetLevel - localAudioLevel);
      shimmerLevelState = smoothSignal(shimmerLevelState, trebleTransient, 0.18, 0.18);

      const emotionFactor = Math.min(1.2, bassLevelState * 0.45 + expressiveness * 0.55 + localAudioLevel * 0.2);

      const activeSpeed = (0.42 + emotionFactor * 1.15);
      const activeTurbulence = 0.35 + emotionFactor * 1.10;
      const activeGlow = 0.55 + emotionFactor * 0.25;

      // Accelerated drift phases for dynamic engagement on web preview
      globalDriftPhase += deltaTime * 0.05 * activeSpeed;
      energyFlowOffset += deltaTime * (0.8 + emotionFactor * 1.6) * activeSpeed;

      const shimmerNoise = Math.sin(time * 50.0) * shimmerLevelState * 0.12;

      // Physics shockwave generation matching desktop theme
      activePulses = activePulses.filter(p => (time - p.birth) < 1.8);
      if (rawSurge > 0.14 && (time - lastPulseTime) > 0.35 && activePulses.length < 4) {
        activePulses.push({
          birth: time,
          intensity: Math.min(1.0, rawSurge * 2.0),
          speed: 200 + Math.random() * 60 // scaled for smaller card preview space
        });
        lastPulseTime = time;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw faint premium dark backing fill
      ctx.fillStyle = "rgba(6, 9, 19, 0.92)";
      ctx.fillRect(0, 0, width, height);

      const baseY = height;

      // Draw horizontal backing horizon light haze
      const horizonHeight = height * 0.45;
      const horizonGrad = ctx.createLinearGradient(0, height - horizonHeight, 0, height);
      const ambientHSL = getAuroraColor(globalDriftPhase * 0.95);
      ambientHSL[1] = Math.min(100, ambientHSL[1] + localAudioLevel * 6); // Saturate on peak

      horizonGrad.addColorStop(0, hsla(ambientHSL, 0));
      horizonGrad.addColorStop(0.4, hsla(ambientHSL, 0.02 * activeGlow));
      horizonGrad.addColorStop(0.8, hsla(ambientHSL, 0.05 * activeGlow));
      horizonGrad.addColorStop(1, hsla(ambientHSL, 0.08 * activeGlow));

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, height - horizonHeight, width, horizonHeight);
      ctx.restore();

      // Dynamic frequency multiplier to keep wave visual density constant across smaller container widths
      const freqMultiplier = 1000 / Math.max(100, width);

      // Render Aurora layers from background to foreground
      for (let i = 0; i < LAYERS.length; i++) {
        const layer = LAYERS[i];
        
        const step = 6; // Sampling step for smooth wave geometry
        const ribbonWidth = width * layer.widthScale;
        const xOffset = (width - ribbonWidth) * 0.5;
        const layerPhaseOffset = i * 1.63;
        const layerParallaxShift = (i - 2.5) * 16 * Math.sin(time * 0.08);

        // Build ribbon coordinates
        const points: { x: number; rise: number }[] = [];
        for (let x = 0; x <= ribbonWidth; x += step) {
          const nx = x / ribbonWidth;

          const wave1 = Math.sin(x * layer.frequency * freqMultiplier + globalDriftPhase * layer.speed * 8.0 + layerPhaseOffset);
          const wave2 = Math.sin(x * layer.frequency * freqMultiplier * 2.3 + globalDriftPhase * layer.speed * 4.5 + layerPhaseOffset * 0.7) * 0.45;
          const wave3 = Math.sin(x * 0.012 * freqMultiplier + time * 0.06 + layerPhaseOffset * 1.3) * 0.10; // match desktop physics wave3
          
          const combinedWave = wave1 + wave2 + wave3;
          const maxRise = height * layer.maxHeight * (active ? 1.0 : 0.85); // Balanced visual height
          const amplitude = layer.baseAmplitude * 0.70 * (1.0 + bassLevelState * 0.18); // dynamic amplitude
          const verticalDrift = Math.sin(time * 0.12 + layerPhaseOffset) * 6; // match desktop physics vertical drift

          const riseHeight = maxRise * 0.45 + combinedWave * amplitude + verticalDrift;
          const edgeFade = Math.pow(Math.sin(nx * Math.PI), 0.75);

          points.push({
            x: x + xOffset + layerParallaxShift,
            rise: Math.max(2, riseHeight * edgeFade)
          });
        }

        const segmentCount = points.length;
        if (segmentCount < 2) continue;

        // Resolve layer color
        const layerColorPos = globalDriftPhase * 0.8 + layer.colorOffset;
        const baseHSL = getAuroraColor(layerColorPos);
        baseHSL[1] = Math.min(100, baseHSL[1] + localAudioLevel * 6); // saturate on audio surges

        let maxRise = 0;
        for (let j = 0; j < segmentCount; j++) {
          if (points[j].rise > maxRise) maxRise = points[j].rise;
        }

        // Draw Pass 1: Volumetric Curtain Fill
        const gradTop = baseY - maxRise - 15;
        const curtainGrad = ctx.createLinearGradient(0, gradTop, 0, baseY);
        
        let opacityMultiplier = layer.opacity * activeGlow * (1.0 + bassLevelState * 0.20) * (1.0 + shimmerNoise);
        opacityMultiplier = Math.min(0.26, opacityMultiplier); // boosted cap

        curtainGrad.addColorStop(0, hsla(baseHSL, 0));
        curtainGrad.addColorStop(0.18, hsla(baseHSL, opacityMultiplier * 0.40));
        curtainGrad.addColorStop(0.45, hsla(baseHSL, opacityMultiplier * 0.75));
        curtainGrad.addColorStop(0.72, hsla(baseHSL, opacityMultiplier * 1.0));
        curtainGrad.addColorStop(1, hsla(baseHSL, opacityMultiplier * 0.40));

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.moveTo(points[0].x, baseY);
        for (let j = 0; j < segmentCount; j++) {
          ctx.lineTo(points[j].x, baseY - points[j].rise);
        }
        ctx.lineTo(points[segmentCount - 1].x, baseY);
        ctx.closePath();
        ctx.fillStyle = curtainGrad;
        ctx.fill();
        ctx.restore();

        // Draw Pass 2: Additive Plasma Filaments
        const numFilaments = 16 + i * 4;
        const filamentPoints: { x: number; y: number }[][] = [];

        const getCrestHeight = (xCoord: number) => {
          const idx = Math.floor((xCoord - xOffset - layerParallaxShift) / step);
          if (idx < 0) return points[0].rise;
          if (idx >= points.length - 1) return points[points.length - 1].rise;
          const frac = ((xCoord - xOffset - layerParallaxShift) / step) - idx;
          return points[idx].rise * (1 - frac) + points[idx + 1].rise * frac;
        };

        const vertSegments = 10;
        for (let fi = 0; fi < numFilaments; fi++) {
          const fn = fi / (numFilaments - 1 || 1);
          const xBase = xOffset + fn * ribbonWidth + layerParallaxShift;
          
          // 1. Estimate height at xBase
          const approxRise = getCrestHeight(xBase);
          
          // 2. Compute sway, fold, etc. at the top of the curtain (t = 1) using approxRise to find x_top
          const sway_top = Math.sin(xBase * 0.0028 * freqMultiplier + approxRise * 0.0009 + time * 0.28 * layer.speed + layerPhaseOffset) * 20;
          const foldPhase_top = xBase * 0.015 * freqMultiplier - approxRise * (0.007 + i * 0.0006) + energyFlowOffset * (0.75 + i * 0.15) + layerPhaseOffset;
          const foldAmp_top = (5 + expressiveness * 24 * activeTurbulence) * 0.65; // t = 1 => 1.0 - 0.35 = 0.65
          const fold_top = Math.sin(foldPhase_top) * foldAmp_top;

          let shockwaveDisplacement_top = 0;
          for (let pi = 0; pi < activePulses.length; pi++) {
            const p = activePulses[pi];
            const elapsed = time - p.birth;
            const pulseCenter = elapsed * p.speed;
            const distToPulse = Math.abs(approxRise - pulseCenter);
            
            const pulseWidth = 80 + elapsed * 50;
            if (distToPulse < pulseWidth) {
              const normalizedDist = distToPulse / pulseWidth;
              const env = Math.pow(1.0 - normalizedDist, 2.2);
              const wave = Math.sin(distToPulse * 0.035 - elapsed * 4.8 + i * 0.5);
              const decay = Math.exp(-elapsed * 1.35);
              shockwaveDisplacement_top += wave * env * p.intensity * decay * 6;
            }
          }

          const vibration_top = Math.sin(time * 70.0 + approxRise * 0.18) * shimmerLevelState * 1.5;

          // 3. Compute displaced x_top
          const x_top = xBase + sway_top + fold_top + shockwaveDisplacement_top + vibration_top;

          // 4. Resolve exact filamentRise at x_top to anchor perfectly to the crest highlight line
          const filamentRise = getCrestHeight(x_top);

          if (filamentRise < 5) continue;

          // 5. Generate points along filament
          const fPoints: { x: number; y: number }[] = [];
          for (let si = 0; si <= vertSegments; si++) {
            const t = si / vertSegments;
            const d = t * filamentRise;
            const y = baseY - d;

            // Sway & folding formulas matching desktop physics exactly (fluid, active physics, scaled spatially)
            const sway = Math.sin(xBase * 0.0028 * freqMultiplier + d * 0.0009 + time * 0.28 * layer.speed + layerPhaseOffset) * 20;
            const foldPhase = xBase * 0.015 * freqMultiplier - d * (0.007 + i * 0.0006) + energyFlowOffset * (0.75 + i * 0.15) + layerPhaseOffset;
            const foldAmp = (5 + expressiveness * 24 * activeTurbulence) * (1.0 - t * 0.35);
            const fold = Math.sin(foldPhase) * foldAmp;

            // Apply traveling shockwaves
            let shockwaveDisplacement = 0;
            for (let pi = 0; pi < activePulses.length; pi++) {
              const p = activePulses[pi];
              const elapsed = time - p.birth;
              const pulseCenter = elapsed * p.speed;
              const distToPulse = Math.abs(d - pulseCenter);
              
              const pulseWidth = 80 + elapsed * 50;
              if (distToPulse < pulseWidth) {
                const normalizedDist = distToPulse / pulseWidth;
                const env = Math.pow(1.0 - normalizedDist, 2.2);
                const wave = Math.sin(distToPulse * 0.035 - elapsed * 4.8 + i * 0.5);
                const decay = Math.exp(-elapsed * 1.35);
                shockwaveDisplacement += wave * env * p.intensity * decay * 6;
              }
            }

            const vibration = Math.sin(time * 70.0 + d * 0.18) * shimmerLevelState * 1.5;
            
            // Resulting x position
            const x = xBase + sway + fold + shockwaveDisplacement + vibration;

            fPoints.push({ x, y });
          }
          filamentPoints.push(fPoints);
        }

        if (filamentPoints.length > 0) {
          const strokeGrad = ctx.createLinearGradient(0, baseY - maxRise, 0, baseY);
          const brightHSL = [baseHSL[0], baseHSL[1], Math.min(baseHSL[2] + 12, 85)];
          let filOpacity = layer.opacity * 0.75 * activeGlow * (1.0 + shimmerNoise); // boosted from 0.52
          filOpacity = Math.min(0.30, filOpacity); // boosted cap

          strokeGrad.addColorStop(0, hsla(brightHSL, 0));
          strokeGrad.addColorStop(0.2, hsla(brightHSL, filOpacity * 0.35));
          strokeGrad.addColorStop(0.5, hsla(brightHSL, filOpacity * 0.90));
          strokeGrad.addColorStop(0.8, hsla(brightHSL, filOpacity * 1.0));
          strokeGrad.addColorStop(1, hsla(brightHSL, filOpacity * 0.20));

          const baseLineWidth = 0.9 + (1.0 - layer.widthScale) * 0.5 + i * 0.22;

          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = strokeGrad;

          // 1. Outer Glow Stroke (Vector glow stacking)
          ctx.lineWidth = baseLineWidth * 2.8;
          ctx.globalAlpha = 0.45;
          ctx.beginPath();
          for (let fi = 0; fi < filamentPoints.length; fi++) {
            const fPoints = filamentPoints[fi];
            ctx.moveTo(fPoints[0].x, fPoints[0].y);
            for (let k = 1; k < fPoints.length; k++) {
              ctx.lineTo(fPoints[k].x, fPoints[k].y);
            }
          }
          ctx.stroke();

          // 2. Core Stroke
          ctx.lineWidth = baseLineWidth;
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          for (let fi = 0; fi < filamentPoints.length; fi++) {
            const fPoints = filamentPoints[fi];
            ctx.moveTo(fPoints[0].x, fPoints[0].y);
            for (let k = 1; k < fPoints.length; k++) {
              ctx.lineTo(fPoints[k].x, fPoints[k].y);
            }
          }
          ctx.stroke();
          ctx.restore();
        }

        // Draw Pass 3: Brighter Crest Highlights (Multi-stroke vector glow stacking)
        const crestHSL = [baseHSL[0], baseHSL[1], Math.min(baseHSL[2] + 16, 92)];
        let crestOpacity = layer.opacity * 0.75 * activeGlow; // boosted from 0.50
        crestOpacity = Math.min(0.28, crestOpacity); // boosted cap
        const baseCrestWidth = 1.2 + i * 0.2;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const traceCrestPath = () => {
          ctx.beginPath();
          ctx.moveTo(points[0].x, baseY - points[0].rise);
          for (let j = 1; j < segmentCount - 1; j++) {
            const curr = points[j];
            const next = points[j + 1];
            const cpx = (curr.x + next.x) / 2;
            const cpy = (baseY - curr.rise + baseY - next.rise) / 2;
            ctx.quadraticCurveTo(curr.x, baseY - curr.rise, cpx, cpy);
          }
        };

        // 1. Outer Crest Glow
        traceCrestPath();
        ctx.strokeStyle = hsla(crestHSL, crestOpacity * 0.32);
        ctx.lineWidth = baseCrestWidth * 4.0;
        ctx.stroke();

        // 2. Inner Crest Glow
        traceCrestPath();
        ctx.strokeStyle = hsla(crestHSL, crestOpacity * 0.60);
        ctx.lineWidth = baseCrestWidth * 2.0;
        ctx.stroke();

        // 3. Sharp Crest Core
        traceCrestPath();
        ctx.strokeStyle = hsla(crestHSL, crestOpacity);
        ctx.lineWidth = baseCrestWidth;
        ctx.stroke();

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
