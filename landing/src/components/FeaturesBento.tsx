"use client";

import { motion } from "framer-motion";

export function FeaturesBento() {
  return (
    <section className="relative w-full pt-32 pb-16 text-white overflow-hidden bg-[#010206]">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full px-6 lg:px-8 max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">

        {/* Left Column: Headlines & Small Cards */}
        <div className="flex w-full flex-col lg:w-5/12 justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <p className="text-[11px] font-extrabold tracking-[0.25em] text-cyan-400 mb-6 uppercase">Visual Experience</p>
            <h2 className="text-5xl font-extrabold tracking-tight sm:text-[4rem] leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-500 drop-shadow-lg mb-6">
              Light, pressure, motion.
            </h2>
            <p className="text-xl text-muted/90 max-w-md leading-relaxed font-light">
              A restrained visual language built to feel ambient, architectural, and quietly alive.
            </p>
          </motion.div>

          <div className="flex flex-col gap-5">
            {[
              { title: "Not another player window", desc: "Paraline stays in the periphery and turns the whole desktop into the stage.", color: "bg-cyan-400", shadow: "shadow-cyan-400/50" },
              { title: "Soft by default", desc: "Glow, pressure, drift, and light that stays atmospheric even during long sessions.", color: "bg-purple-400", shadow: "shadow-purple-400/50" },
              { title: "Reactive without shouting", desc: "Designed for focus setups, music nights, and ambient desktops that still feel alive.", color: "bg-emerald-400", shadow: "shadow-emerald-400/50" }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.02, x: 10 }}
                className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl transition-all duration-500 hover:border-white/10 hover:bg-white/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/0 via-purple-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-xl" />
                
                <div className="flex items-start gap-4">
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${card.color} shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-transform duration-300 group-hover:scale-150 ${card.shadow}`} />
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight mb-2 group-hover:text-cyan-100 transition-colors">{card.title}</h3>
                    <p className="text-[15px] text-muted/80 leading-relaxed group-hover:text-white/90 transition-colors duration-300">{card.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Massive Feature Card */}
        <div className="flex w-full flex-1 flex-col">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex h-full min-h-[600px] flex-col justify-between overflow-hidden rounded-[40px] border border-white/10 bg-[#060913]/40 p-10 lg:p-12 backdrop-blur-3xl transition-all hover:border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_80px_rgba(34,211,238,0.15)]"
          >
            {/* Cinematic Background Gradients */}
            <div className="absolute inset-0 -z-20 bg-gradient-to-br from-cyan-900/20 via-transparent to-purple-900/20 opacity-50 transition-opacity duration-700 group-hover:opacity-100" />
            <div className="absolute -inset-[1px] -z-10 rounded-[40px] bg-gradient-to-b from-white/10 to-transparent opacity-30" />
            
            {/* Top Inner Border line */}
            <div className="absolute top-12 left-12 right-12 h-[1px] bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-transparent" />

            <div className="relative z-10 pt-10">
              <p className="text-[11px] font-extrabold tracking-[0.25em] text-cyan-400 mb-6 uppercase drop-shadow-md">Screen Edge Presence</p>
              <h3 className="text-[3rem] lg:text-[4.5rem] font-extrabold tracking-tight text-white max-w-xl leading-[1.05] drop-shadow-2xl">
                Designed to disappear until the beat lands.
              </h3>
            </div>

            {/* Abstract Animated Centerpiece (Radar/Sonar effect) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none mt-16 ml-16 lg:mt-24 lg:ml-24">
              <div className="relative flex h-[500px] w-[500px] items-center justify-center">
                {/* Radar Sweep */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "conic-gradient(from 0deg, transparent 70%, rgba(34, 211, 238, 0.15) 100%)" }}
                />
                
                {/* Outer ripples */}
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.2, 0.05] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute h-full w-full rounded-full border-[1px] border-cyan-400 bg-transparent"
                />
                <motion.div
                  animate={{ scale: [1, 2, 1], opacity: [0, 0.1, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute h-[80%] w-[80%] rounded-full border-[1px] border-purple-400 bg-transparent"
                />

                {/* Inner glowing core */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute h-40 w-40 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 blur-3xl opacity-20"
                />

                {/* Center dot/star */}
                <motion.div
                  animate={{ scale: [1, 0.8, 1], rotate: [0, 180, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute h-16 w-16 rounded-full border border-white/20 bg-[#0a0d16] shadow-[0_0_40px_rgba(34,211,238,0.6)] flex items-center justify-center backdrop-blur-md"
                >
                  <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse" />
                </motion.div>
              </div>
            </div>

            <div className="relative z-10 mt-auto flex flex-col gap-4 sm:flex-row pt-12">
              {[
                { title: "Platform: Windows", color: "text-cyan-400", desc: "Built as a transparent desktop overlay that seamlessly integrates with your screen edges." },
                { title: "Built with Electron", color: "text-purple-400", desc: "Powered by Electron and a highly optimized C# engine, designed for minimal resource footprint." },
                { title: "WASAPI Loopback", color: "text-emerald-400", desc: "Direct WASAPI audio loopback ensures near-instantaneous response between beat and visual feedback." }
              ].map((card, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex-1 rounded-3xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-2xl transition-all hover:bg-white/[0.06] hover:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
                >
                  <p className={`text-[10px] font-extrabold tracking-[0.2em] ${card.color} mb-3 uppercase`}>{card.title}</p>
                  <p className="text-[13px] text-white/70 leading-relaxed font-light">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
