"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Plus, X } from "lucide-react";
import { getThemesEndpoint } from "@/lib/paraline-api";

import { AmbientWavePreview } from "./visualizers/AmbientWavePreview";
import { FlowBorderPreview } from "./visualizers/FlowBorderPreview";
import { PulseLinesPreview } from "./visualizers/PulseLinesPreview";
import { SideBarsPreview } from "./visualizers/SideBarsPreview";
import { DotParticlesPreview } from "./visualizers/DotParticlesPreview";
import { ReactiveBorderPreview } from "./visualizers/ReactiveBorderPreview";
import { RippleFlowPreview } from "./visualizers/RippleFlowPreview";
import { EdgeCrystalsPreview } from "./visualizers/EdgeCrystalsPreview";
import { SideBraidsPreview } from "./visualizers/SideBraidsPreview";
import { AuroraDriftPreview } from "./visualizers/AuroraDriftPreview";
import { SnowParticlesPreview } from "./visualizers/SnowParticlesPreview";
import { ThemeComparisonModal } from "./ThemeComparisonModal";

export type Theme = {
  id: string;
  name: string;
  category: string;
  description: string;
  className: string;
  Preview: React.FC<{ active: boolean }>;
  animationStyle: string;
  reactivity: string;
  visualIntensity: string;
  performanceImpact: string;
  bestFor: string;
};

export const specificThemes: Theme[] = [

  {
    id: "ambient-wave",
    name: "Ambient Wave",
    category: "SOFT FREQUENCY DRIFT",
    description: "Silky, low-frequency edge waves that gently breathe with atmospheric, minimal motion.",
    className: "lg:col-span-2",
    Preview: AmbientWavePreview,
    animationStyle: "Wave",
    reactivity: "Low",
    visualIntensity: "Minimal",
    performanceImpact: "Very Low",
    bestFor: "Focus / Study"
  },
  {
    id: "reactive-border",
    name: "Reactive Border",
    category: "HIGH-PRESENCE PERIMETER",
    description: "An intense, full-perimeter energy field that surges powerfully to every heavy kick drum.",
    className: "lg:col-span-1",
    Preview: ReactiveBorderPreview,
    animationStyle: "Glow",
    reactivity: "High",
    visualIntensity: "Bold",
    performanceImpact: "Low",
    bestFor: "Gaming / Music"
  },
  {
    id: "flow-border",
    name: "Flow Border",
    category: "CONTINUOUS EDGE ENERGY",
    description: "A sleek, continuous neon light-trace orbiting your screen edge with silky momentum.",
    className: "lg:col-span-1",
    Preview: FlowBorderPreview,
    animationStyle: "Flow",
    reactivity: "Medium",
    visualIntensity: "Moderate",
    performanceImpact: "Low",
    bestFor: "Casual Listening"
  },
  {
    id: "side-bars",
    name: "Side Bars",
    category: "LEFT-RIGHT EMPHASIS",
    description: "Focused vertical equalizers anchored to the edges, perfect for intense bass drops.",
    className: "lg:col-span-1",
    Preview: SideBarsPreview,
    animationStyle: "Bar",
    reactivity: "High",
    visualIntensity: "Moderate",
    performanceImpact: "Very Low",
    bestFor: "Music Monitoring"
  },
  {
    id: "dot-particles",
    name: "Dot Particles",
    category: "REACTIVE SPARKLE FIELD",
    description: "A dynamic cyber-field of glowing audio-reactive particles that scatter to the beat.",
    className: "lg:col-span-1",
    Preview: DotParticlesPreview,
    animationStyle: "Particle",
    reactivity: "High",
    visualIntensity: "Dynamic",
    performanceImpact: "Medium",
    bestFor: "Gaming / Streams"
  },
  {
    id: "pulse-lines",
    name: "Pulse Lines",
    category: "CENTER-ORIGIN BURSTS",
    description: "Geometric energy bursts radiating from the center, locking flawlessly to your screen edges.",
    className: "lg:col-span-1",
    Preview: PulseLinesPreview,
    animationStyle: "Pulse",
    reactivity: "High",
    visualIntensity: "Bold",
    performanceImpact: "Low",
    bestFor: "EDM / Beat-heavy"
  },
  {
    id: "snow-particles",
    name: "Snow Particles",
    category: "SLOW EDGE SNOWFALL",
    description: "Sparse, cool particles drifting around the frame for a more ambient winter-like feel.",
    className: "lg:col-span-1",
    Preview: SnowParticlesPreview,
    animationStyle: "Particle",
    reactivity: "Low",
    visualIntensity: "Minimal",
    performanceImpact: "Very Low",
    bestFor: "Focus / Ambience"
  },
  {
    id: "ripple-flow",
    name: "Ripple Flow",
    category: "PRESSURE RINGS",
    description: "Symmetric, pressure-sensitive wavefronts that ripple outward in elegant neon rings.",
    className: "lg:col-span-1",
    Preview: RippleFlowPreview,
    animationStyle: "Wave",
    reactivity: "Medium",
    visualIntensity: "Moderate",
    performanceImpact: "Low",
    bestFor: "Ambient / Chill"
  },
  {
    id: "side-braids",
    name: "Side Braids",
    category: "GLOWING NEON FIBERS",
    description: "Beautifully intertwined, glowing neon strands that organically braid along the vertical axis.",
    className: "lg:col-span-1",
    Preview: SideBraidsPreview,
    animationStyle: "Flow",
    reactivity: "Medium",
    visualIntensity: "Bold",
    performanceImpact: "Medium",
    bestFor: "Lofi / Streams"
  },
  {
    id: "edge-crystals",
    name: "Edge Crystals",
    category: "ANGULAR SHIMMER",
    description: "Crisp, cold, faceted geometric glints providing a sharp, prismatic visual rhythm.",
    className: "lg:col-span-2 h-[380px]",
    Preview: EdgeCrystalsPreview,
    animationStyle: "Geometric",
    reactivity: "Medium",
    visualIntensity: "Moderate",
    performanceImpact: "Low",
    bestFor: "Coding / Dark rooms"
  },
  {
    id: "aurora-drift",
    name: "Aurora Drift",
    category: "ATMOSPHERIC CURTAINS",
    description: "Stunning, layered northern-light curtains that soar dynamically with orchestral surges.",
    className: "lg:col-span-2",
    Preview: AuroraDriftPreview,
    animationStyle: "Wave",
    reactivity: "High",
    visualIntensity: "Dynamic",
    performanceImpact: "Medium",
    bestFor: "Cinematic / Music"
  }
];

export function ThemeShowcase() {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const [appliedTheme, setAppliedTheme] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = (themeId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTheme(themeId);
    }, 150); // 150ms hover delay to prevent canvas trigger on fast scrolling
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredTheme(null);
  };

  const toggleCompare = (e: React.MouseEvent, themeId: string) => {
    e.stopPropagation();
    if (compareList.includes(themeId)) {
      setCompareList(prev => prev.filter(id => id !== themeId));
    } else {
      if (compareList.length < 3) {
        setCompareList(prev => [...prev, themeId]);
      }
    }
  };

  const handleApply = async (themeName: string) => {
    try {
      // Connect to the backend API to physically apply the theme on the desktop
      const response = await fetch(getThemesEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply_theme", theme: themeName })
      });

      if (!response.ok) {
        if (response.status === 404) {
          // If the endpoint doesn't exist, intentionally throw to trigger simulation
          throw new Error("Theme endpoint not found");
        }
        console.error("Failed to apply theme. Server responded with status:", response.status);
        return; // Do not set applied state on failure
      }
    } catch (e) {
      console.warn("Backend not running, simulating theme application:", e);
    }

    setAppliedTheme(themeName);
    setTimeout(() => setAppliedTheme(null), 3000);
  };

  return (
    <section id="themes" className="relative w-full py-24">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="mb-20 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.25em] text-cyan-400 mb-4 uppercase">Studio-Grade Presets</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-[3.5rem] leading-none mb-2">
              Premium Motion Aesthetics.
            </h2>
            <p className="text-muted/80 text-lg max-w-xl font-light">
              Click any theme below to preview its unique motion physics, or instantly apply it to your running desktop client in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/[0.05] px-5 py-3 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-100">Direct Sync Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {specificThemes.map((theme, idx) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ scale: 1.015 }}
              transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => handleMouseEnter(theme.id)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleApply(theme.name)}
              className={`group relative flex flex-col sm:flex-row cursor-pointer overflow-hidden rounded-[28px] border border-white/5 bg-[#0a0d16]/80 backdrop-blur-md p-6 sm:p-8 transition-all duration-500 hover:border-cyan-500/30 hover:shadow-[0_20px_60px_-15px_rgba(34,211,238,0.2)] ${theme.className}`}
            >
              {/* Premium Glow effect on hover */}
              <div className="absolute -inset-[1px] -z-10 rounded-[28px] bg-gradient-to-r from-cyan-500/0 via-cyan-400/10 to-purple-500/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 blur-md" />

              {/* Compare Button Toggle */}
              <button
                onClick={(e) => toggleCompare(e, theme.id)}
                className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  compareList.includes(theme.id) 
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 opacity-100 shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
                    : "bg-white/5 text-white/50 border border-white/10 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                {compareList.includes(theme.id) ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Added
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    Compare
                  </>
                )}
              </button>

              {/* Left Column: Text Content */}
              <div className="flex w-full sm:w-5/12 flex-col justify-center pr-4 mb-6 sm:mb-0 transition-transform duration-500 group-hover:translate-x-2">
                <p className="text-[10px] font-extrabold tracking-[0.2em] text-cyan-500/80 mb-3 uppercase transition-colors group-hover:text-cyan-400">{theme.category}</p>
                <h4 className="text-3xl font-extrabold tracking-tight text-white mb-3 transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-cyan-200">{theme.name}</h4>
                <p className="text-[15px] font-light text-muted/80 leading-relaxed pr-2 group-hover:text-white/90 transition-colors duration-300">{theme.description}</p>
              </div>

              {/* Right Column: Visualizer Box */}
              <div className="relative flex-1 w-full min-h-[220px] bg-[#04060d] rounded-2xl border border-white/5 shadow-[inset_0_2px_30px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500 group-hover:border-cyan-500/40 group-hover:shadow-[0_0_40px_rgba(34,211,238,0.2),inset_0_0_20px_rgba(34,211,238,0.05)]">
                <div className="absolute inset-0">
                  <theme.Preview active={hoveredTheme === theme.id} />
                </div>
                {/* Subtle glass reflection overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent transition-opacity group-hover:opacity-100 opacity-50" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Elegant Toast Notification */}
      <AnimatePresence>
        {appliedTheme && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-10 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-4 rounded-full border border-white/10 bg-[#0a0d16]/90 px-5 py-3.5 shadow-[0_10px_40px_-10px_rgba(34,211,238,0.3)] backdrop-blur-xl"
          >
            {/* Animated border glow for the toast */}
            <div className="absolute -inset-[1px] -z-10 rounded-full bg-gradient-to-r from-cyan-400/50 via-purple-500/50 to-cyan-400/50 blur-[2px] opacity-50" />

            <div className="flex items-center justify-center rounded-full bg-cyan-500/20 p-1">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" strokeWidth={3} />
            </div>
            <p className="text-sm font-semibold text-white tracking-wide">
              Activated <span className="text-cyan-400">{appliedTheme}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Compare Action Bar */}
      <AnimatePresence>
        {compareList.length > 0 && !isCompareModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-10 left-1/2 z-[90] -translate-x-1/2 flex items-center gap-6 rounded-full border border-white/10 bg-[#0a0d16]/95 px-6 py-3.5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-white/90">
                {compareList.length === 1 
                  ? "Select at least 2 themes to compare" 
                  : `${compareList.length} themes selected`}
              </span>
              <span className="text-[11px] font-light text-white/40">
                (Max 3)
              </span>
            </div>

            <div className="h-6 w-[1px] bg-white/10" />

            <button
              onClick={() => setIsCompareModalOpen(true)}
              disabled={compareList.length < 2}
              className="rounded-full bg-white px-6 py-2 text-[12px] font-bold text-black transition-all hover:bg-white/90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Compare
            </button>
            
            <button
              onClick={() => setCompareList([])}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0a0d16] text-white/50 transition-all hover:bg-white/20 hover:text-white shadow-md"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ThemeComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        compareList={compareList}
      />
    </section>
  );
}
