"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Activity, Sliders, Layers, Sparkles } from "lucide-react";
import { AuroraDriftPreview } from "@/components/visualizers/AuroraDriftPreview";
import { PulseLinesPreview } from "@/components/visualizers/PulseLinesPreview";

interface SettingItem {
  id: string;
  name: string;
  description: string;
  options: string[];
  isNew?: boolean;
}

interface SettingGroup {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  settings: SettingItem[];
}

const initialGroups: SettingGroup[] = [
  {
    title: "Theme & Visual Customization",
    icon: Palette,
    settings: [
      { 
        id: "dual-theme-layering", 
        name: "Dual Theme Layering (Beta)", 
        isNew: true, 
        description: "Blend and render two visualizer themes simultaneously with independent secondary layer opacity and decoupled audio signal processing.", 
        options: ["Dual Visualizers", "Layer Opacity (10% - 100%)", "Isolated Audio", "Secondary Tuning"] 
      },
      { id: "color-palettes", name: "Dynamic Color Palettes", description: "Choose from curated preset themes or configure custom gradient stops for visualizers.", options: ["Rainbow", "Neon Sky", "Sunset", "Monochrome", "Custom Hex"] },
      { id: "glow-bloom", name: "Glow & Bloom Controls", description: "Fine-tune ambient glow radii and bloom strength to match your setup lighting.", options: ["Soft Glow", "Balanced", "Vivid Bloom", "Custom Radii"] },
      { id: "edge-mapping", name: "Screen Edge Mapping", description: "Map reactive animations to specific borders or span seamlessly across multiple monitors.", options: ["Bottom Edge", "Top Edge", "Sides", "All Borders", "Multi-Monitor"] },
      { id: "scale-density", name: "Scale & Density Tuning", description: "Adjust line thickness, segment gaps, and reactive node density per theme.", options: ["Line Weight", "Braid Width", "Segment Gap", "Density"] },
    ]
  },
  {
    title: "Advanced Audio & Reactivity",
    icon: Activity,
    settings: [
      { id: "wasapi-capture", name: "WASAPI Loopback Capture", description: "Direct loopback capture of Windows system audio for high-fidelity visualization.", options: ["Stereo Mix", "Loopback Engine"] },
      { id: "audio-smoothing", name: "Frequency Smoothing", description: "Soften frequency peaks using low-pass and average filters for fluid animations.", options: ["Misty", "Smooth", "Defined", "FFT Windowing"] },
      { id: "reactivity-sensitivity", name: "Reactivity Sensitivity", description: "Fine-tune sensitivity scaling to respond perfectly to low, mid, or high audio frequencies.", options: ["Low", "Medium", "High", "Custom Gain"] },
    ]
  },
  {
    title: "System & Automation Settings",
    icon: Sliders,
    settings: [
      { id: "focus-mode", name: "Focus Mode Integration", description: "Automatically dim visualizer opacity when your system goes idle to prevent distraction.", options: ["Idle Timeout", "Dim Opacity (0% - 90%)"] },
      { id: "fps-limits", name: "Framerate Optimization", description: "Configure frame capping for low CPU consumption or unlock it for high-refresh monitors.", options: ["Battery (30 FPS)", "Balanced (60 FPS)", "Unlocked"] },
      { id: "theme-automation", name: "Automatic Theme Schedules", description: "Auto-transition themes dynamically between day and night profiles using system clock time.", options: ["Day/Night Sync", "Hourly Automation"] },
    ]
  }
];

export default function SettingsPage() {
  const [dualEnabled, setDualEnabled] = useState(true);
  const [secondaryOpacity, setSecondaryOpacity] = useState(0.7);

  return (
    <main className="flex min-h-screen flex-col pt-32 pb-24 bg-[#060913] relative overflow-hidden z-0">
      {/* Immersive background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#060913] to-[#060913] -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen -z-10" />
      
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-4">
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-14 text-center md:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/[0.05] border border-cyan-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">Configuration Showcase</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 mb-4 tracking-tighter drop-shadow-lg">
            Client Settings Showcase
          </h1>
          <p className="text-lg font-light tracking-wide text-white/50 max-w-2xl">
            A comprehensive preview of customization preferences, audio routing options, and advanced control parameters available inside the Paraline desktop client.
          </p>
        </motion.div>

        <div className="space-y-16">
          {initialGroups.map((group, groupIdx) => (
            <motion.div 
              key={group.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (groupIdx + 1), duration: 0.8, type: "spring", bounce: 0.2 }}
              className="flex flex-col gap-8 md:flex-row md:gap-16"
            >
              {/* Group Header (Left Side) */}
              <div className="w-full md:w-64 shrink-0">
                <div className="flex items-center gap-4 text-white">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.03] shadow-inner group-hover:bg-white/[0.05] transition-colors">
                    <group.icon className="h-5 w-5 text-white/70" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/90">{group.title}</h2>
                </div>
              </div>

              {/* Settings List (Right Side) */}
              <div className="flex-1 space-y-4">
                {group.settings.map((setting) => (
                  <div 
                    key={setting.id} 
                    className="group relative flex flex-col md:flex-row md:items-center justify-between rounded-[24px] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 gap-6 transition-all duration-500 hover:bg-white/[0.04] hover:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_5px_15px_rgba(0,0,0,0.2)]"
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[24px]" />
                    
                    <div className="pr-4 relative z-10 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-[15px] font-semibold text-white/90 group-hover:text-white transition-colors">{setting.name}</h3>
                        {setting.isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] animate-pulse">
                            New in v2.6.0
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[13px] font-light text-white/50 leading-relaxed">{setting.description}</p>
                    </div>
                    
                    {/* Visual Badges Showcase */}
                    <div className="flex flex-wrap gap-1.5 shrink-0 max-w-[300px] relative z-10 justify-start md:justify-end">
                      {setting.options.map((opt) => (
                        <span 
                          key={opt}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wider bg-white/[0.03] border border-white/5 text-cyan-400/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] uppercase transition-colors group-hover:border-cyan-500/20 group-hover:text-cyan-300"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dual Theme Interactive Spotlight Section (v2.6.0 Feature) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-20 rounded-[28px] border border-cyan-500/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 md:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative overflow-hidden"
        >
          {/* Subtle background ambient gradients */}
          <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-gradient-to-bl from-purple-500/15 via-cyan-500/10 to-transparent blur-[80px] pointer-events-none -z-0" />
          
          <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center justify-between">
            {/* Left Column: Description & Controls */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Featured in v2.6.0
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                  Dual Layering Beta
                </span>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Dual Theme Blending Engine
                </h2>
                <p className="mt-2 text-sm font-light text-white/60 leading-relaxed max-w-xl">
                  Paraline v2.6.0 introduces true dual-layer visualizer rendering. Stack two completely independent themes on your desktop simultaneously—such as subtle foreground borders with deep cosmic aurora curtains—each running on isolated audio response curves.
                </p>
              </div>

              {/* Interactive Showcase Controls */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4 max-w-xl">
                {/* Dual Mode Switch */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white/90">Enable Dual Theme Layering</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDualEnabled(!dualEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${dualEnabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : 'bg-white/10'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dualEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Opacity Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Secondary Layer Opacity</span>
                    <span className="font-mono text-cyan-400 font-semibold">{Math.round(secondaryOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    disabled={!dualEnabled}
                    value={secondaryOpacity}
                    onChange={(e) => setSecondaryOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Live Dual-Layer Visualizer Preview */}
            <div className="w-full lg:w-[420px] shrink-0">
              <div className="relative aspect-[16/10] w-full rounded-2xl border border-white/10 bg-[#02040a] overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
                {/* Layer 1: Background Secondary Theme */}
                {dualEnabled && (
                  <div 
                    className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
                    style={{ opacity: secondaryOpacity }}
                  >
                    <AuroraDriftPreview active={true} transparent={true} />
                  </div>
                )}

                {/* Layer 2: Foreground Primary Theme */}
                <div className="absolute inset-0 pointer-events-none">
                  <PulseLinesPreview active={true} transparent={true} />
                </div>

                {/* HUD Overlay Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-semibold text-white/80">
                    Primary: Pulse Lines
                  </span>
                  {dualEnabled && (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 backdrop-blur-md border border-cyan-500/30 text-[9px] font-semibold text-cyan-300">
                      Secondary: Aurora ({Math.round(secondaryOpacity * 100)}%)
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE DUAL ENGINE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
