"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Sparkles } from "lucide-react";
import { getDownloadUrl, GITHUB_URL } from "@/lib/paraline-api";

import { ThemeShowcase } from "@/components/ThemeShowcase";
import { FeaturesBento } from "@/components/FeaturesBento";
import { AmbientWavePreview } from "@/components/visualizers/AmbientWavePreview";
import { SideBarsPreview } from "@/components/visualizers/SideBarsPreview";
import { AuroraDriftPreview } from "@/components/visualizers/AuroraDriftPreview";
import { EdgeCrystalsPreview } from "@/components/visualizers/EdgeCrystalsPreview";
import { FlowBorderPreview } from "@/components/visualizers/FlowBorderPreview";
import { Logo } from "@/components/Logo";
import { DownloadButton } from "@/components/DownloadButton";
import { PulseLinesPreview } from "@/components/visualizers/PulseLinesPreview";

export default function Home() {
  const downloadUrl = getDownloadUrl();



  return (
    <>
      <div className="relative h-screen min-h-[750px] max-h-[1100px] w-full bg-[#060913] pt-20 lg:pt-24 overflow-hidden flex flex-col">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-[#060913] to-purple-500/10 z-0" />
        
        {/* Professional 3D-style Hero Composition on the Right */}
        <div className="absolute right-8 lg:right-20 xl:right-32 top-[-5%] lg:top-[-10%] w-full lg:w-[45%] h-full z-0 pointer-events-none hidden lg:flex items-center justify-center overflow-visible" style={{ perspective: "1500px" }}>
           {/* Abstract glowing sphere/orb behind everything */}
           <motion.div 
             animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
             transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"
           />
           <motion.div 
             animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.25, 0.1] }}
             transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
             className="absolute top-1/2 left-1/2 w-[600px] h-[400px] bg-purple-600/20 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2"
           />

           {/* 3D Scene Container */}
           <div className="relative w-full h-[600px] flex items-center justify-center scale-75 xl:scale-[0.85] 2xl:scale-[0.95]" style={{ transformStyle: "preserve-3d", transform: "rotateX(8deg) rotateY(-22deg) rotateZ(3deg)" }}>
              
              {/* Floating Widget 1 - Pulse Lines (Front Layer Attached) */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0, y: [0, -15, 0] }}
                transition={{ 
                  opacity: { duration: 1.2 }, 
                  x: { type: "spring", bounce: 0.3 }, 
                  y: { duration: 5, repeat: Infinity, ease: "easeInOut" } 
                }}
                className="absolute -left-[5%] top-[5%] w-[240px] h-[130px] bg-[#0a0f1a]/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_30px_60px_-10px_rgba(0,0,0,0.9),0_0_30px_rgba(34,211,238,0.1)] overflow-hidden p-4 flex flex-col justify-between"
                style={{ transform: "translateZ(60px)" }}
              >
                 <div className="text-xs font-semibold text-white/70 tracking-widest uppercase">Pulse Lines</div>
                 <div className="relative w-full h-12 mt-2 bg-[#02040a] rounded-lg overflow-hidden border border-white/5">
                   <PulseLinesPreview active={true} />
                 </div>
              </motion.div>

              {/* Main Monitor Mockup Panel (Middle Layer) */}
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }}
                transition={{ 
                  opacity: { duration: 1.2, delay: 0.2 }, 
                  scale: { type: "spring", bounce: 0.4, delay: 0.2 },
                  y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
                }}
                className="relative w-[560px] h-[360px] bg-[#0a0f1a]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_40px_100px_-10px_rgba(34,211,238,0.15)] overflow-hidden flex flex-col"
                style={{ transform: "translateZ(20px)" }}
              >
                 {/* Fake Window Header */}
                 <div className="w-full h-8 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                 </div>
                 {/* Visualizer content inside */}
                 <div className="relative flex-1 bg-[#02040a] overflow-hidden">
                    <SideBarsPreview active={true} />
                    <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] pointer-events-none" />
                 </div>
              </motion.div>

              {/* Floating Widget 2 - Edge Crystals (Front Layer) */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0, y: [0, 20, 0] }}
                transition={{ 
                  opacity: { duration: 1.4, delay: 0.3 }, 
                  x: { type: "spring", bounce: 0.3, delay: 0.3 },
                  y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 } 
                }}
                className="absolute -right-[5%] bottom-[12%] w-[280px] h-[160px] bg-[#0a0f1a]/90 backdrop-blur-3xl border border-cyan-500/30 rounded-2xl shadow-[0_30px_60px_-10px_rgba(0,0,0,0.9),0_0_40px_rgba(34,211,238,0.15)] overflow-hidden p-5 flex flex-col"
                style={{ transform: "translateZ(130px)" }}
              >
                 <div className="text-[10px] text-cyan-400 tracking-widest uppercase font-bold mb-1">Active Theme</div>
                 <div className="text-sm font-semibold text-white mb-3">Aurora Drift</div>
                 <div className="relative w-full flex-1 bg-[#02040a] rounded-lg overflow-hidden border border-white/5">
                   <AuroraDriftPreview active={true} />
                 </div>
              </motion.div>
           </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 relative z-10 flex flex-col h-full">
          
          {/* Main Hero Content (Left aligned) */}
          <div className="w-full lg:w-[50%] flex flex-col justify-center flex-grow pb-10 lg:-mt-20">
            
            {/* Sparkle Text */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex items-start gap-2 mb-6"
            >
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-white/60 leading-relaxed max-w-[280px]">
                Paraline runs as a lightweight, hardware-accelerated edge overlay directly on your desktop.
              </p>
            </motion.div>

            {/* Massive Headline with Staggered Spring Animation and Continuous Float */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                }
              }}
              className="flex flex-col mb-10 relative"
            >
              {/* Continuous Float Wrapper */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                {/* Dynamic Backglow */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.15, 0.3, 0.15],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 -left-10 w-[120%] h-[150%] -translate-y-1/2 bg-cyan-500/20 blur-[120px] -z-10 rounded-full" 
                />
                
                {["AUDIO", "REACTIVE", "DESKTOP", "MOTION"].map((word, idx) => (
                  <motion.div key={word} className="overflow-hidden pb-1">
                    <motion.h1 
                      variants={{
                        hidden: { y: 100, opacity: 0, rotateX: 30 },
                        visible: { y: 0, opacity: 1, rotateX: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
                      }}
                      className={`text-[3.5rem] sm:text-[4rem] lg:text-[5rem] leading-[0.95] font-extrabold tracking-tight uppercase drop-shadow-2xl origin-bottom ${
                        idx === 1 
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500" 
                          : "text-white/95"
                      }`}
                    >
                      {word}
                    </motion.h1>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center gap-6"
            >
              <DownloadButton location="hero" className="h-16 px-12 bg-gradient-to-r from-white/5 to-white/10 border border-white/20 hover:from-cyan-500/20 hover:to-purple-500/20 hover:border-cyan-400/50 backdrop-blur-xl rounded-full shadow-[0_10px_30px_-10px_rgba(34,211,238,0.2)] hover:shadow-[0_15px_50px_-5px_rgba(34,211,238,0.5)] transition-all duration-500 group overflow-hidden relative">
                {/* Button Inner Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <span className="relative z-10 text-sm font-extrabold tracking-[0.2em] text-white group-hover:text-cyan-300 transition-colors uppercase">
                  DOWNLOAD INSTALLER
                </span>
              </DownloadButton>
            </motion.div>
          </div>

          {/* Floating Bottom Cards - Fixed Spacing & Layout anchored to bottom */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-20 pb-8 lg:pb-10 mt-auto">
            
            {/* Left Side: Wide Horizontal Card */}
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6, type: "spring", bounce: 0.3 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="lg:col-span-5 flex items-end cursor-pointer"
            >
              <div className="w-full h-full lg:h-[130px] flex items-center gap-6 p-6 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_20px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-cyan-500/40 hover:bg-white/[0.05] transition-all duration-300">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                />
                
                {/* Image Indicator */}
                <div className="h-16 w-16 md:h-[76px] md:w-[76px] shrink-0 rounded-[20px] bg-white/[0.02] border border-cyan-400/30 flex items-center justify-center overflow-hidden relative shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),_0_0_25px_rgba(34,211,238,0.15)] group-hover:border-cyan-400/60 group-hover:shadow-[0_0_35px_rgba(34,211,238,0.3)] transition-all duration-300">
                  <div className="absolute inset-0 scale-150 mix-blend-screen opacity-90 group-hover:scale-125 transition-transform duration-700">
                    <AmbientWavePreview active={true} />
                  </div>
                </div>
                
                <div className="flex flex-col justify-center relative z-10">
                  <h4 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight drop-shadow-md">Ultra-Low Latency</h4>
                  <p className="text-sm font-medium text-cyan-200/70 group-hover:text-cyan-200 transition-colors">High-speed WASAPI loopback</p>
                </div>
              </div>
            </motion.div>

            {/* Right Side: Complex Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              
              <div className="flex flex-col gap-4 h-full lg:h-[130px]">
                {/* Text Box */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex-1 w-full bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_10px_30px_rgba(0,0,0,0.3)] flex items-center px-8 group hover:border-purple-500/40 hover:bg-white/[0.05] transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <p className="text-xs font-extrabold tracking-[0.2em] text-white/60 group-hover:text-white transition-colors uppercase w-full relative z-10 drop-shadow-sm">
                    11+ Studio Themes Ready
                  </p>
                </motion.div>

                {/* Second Text Box (To fill the height) */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.75 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex-1 w-full bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_10px_30px_rgba(0,0,0,0.3)] flex flex-col justify-center px-8 relative overflow-hidden group cursor-pointer hover:border-blue-500/40 hover:bg-white/[0.05] transition-all"
                >
                  <motion.div 
                    className="absolute inset-0 opacity-50 mix-blend-screen pointer-events-none scale-150 origin-left"
                    animate={{ rotate: [0, 2, -2, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  >
                     <EdgeCrystalsPreview active={true} />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <p className="text-sm font-bold text-white relative z-10 group-hover:text-blue-200 transition-colors drop-shadow-md">Fully customizable</p>
                  <p className="text-[10px] font-extrabold text-blue-200/50 uppercase tracking-[0.2em] mt-1.5 relative z-10 group-hover:text-blue-200/80 transition-colors">Audio-reactive nodes</p>
                </motion.div>
              </div>

              {/* Orange Stats Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.8, type: "spring" }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="w-full h-full lg:h-[130px] cursor-pointer"
              >
                <div className="w-full h-full flex flex-col justify-center p-8 bg-white/[0.03] backdrop-blur-3xl border border-[#ff8c42]/30 rounded-[32px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_20px_40px_rgba(255,140,66,0.1)] relative overflow-hidden group hover:border-[#ff8c42]/60 hover:bg-white/[0.05] hover:shadow-[0_20px_60px_rgba(255,140,66,0.25)] transition-all duration-300">
                  {/* Internal warm glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff8c42]/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -right-20 -top-20 w-48 h-48 bg-[#ff8c42] blur-[60px] rounded-full group-hover:bg-[#ffaa66] transition-colors duration-500" 
                  />
                  
                  <h4 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ffcfb3] to-[#ff8c42] mb-1.5 relative z-10 tracking-tighter drop-shadow-lg">
                    Fluid
                  </h4>
                  <p className="text-xs font-extrabold text-[#ff8c42]/80 tracking-[0.2em] uppercase relative z-10 group-hover:text-[#ffaa66] transition-colors">motion physics</p>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      {/* Theme Showcase Section */}
      <ThemeShowcase />

      {/* The Idea Section (Cinematic Typography) */}
      <section className="relative w-full py-40 overflow-hidden bg-[#010206]">
        {/* Deep immersive background radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#010206] to-[#010206] opacity-80" />
        
        {/* Floating animated ambient orbs for elegance */}
        <motion.div 
          animate={{ y: [-30, 30, -30], x: [-20, 20, -20], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-[10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none"
        />
        <motion.div 
          animate={{ y: [30, -30, 30], x: [20, -20, 20], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-[10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"
        />

        <div className="relative mx-auto max-w-6xl px-6 text-center z-10 flex flex-col items-center justify-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.3, delayChildren: 0.2 }
              }
            }}
          >
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
              }}
              className="flex items-center justify-center gap-6 mb-12"
            >
               <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-cyan-500/50" />
               <p className="text-[11px] font-extrabold tracking-[0.3em] text-cyan-400 uppercase">The Core Philosophy</p>
               <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-cyan-500/50" />
            </motion.div>

            <motion.h3 
              variants={{
                hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="text-3xl md:text-4xl lg:text-[3.5rem] font-light tracking-tight leading-[1.3] text-white/70 mb-8"
            >
              Most visualizers are designed to grab attention.<br className="hidden md:block"/> 
              Paraline was built to do something more interesting:
            </motion.h3>
            
            <motion.h3 
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(20px)" },
                visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="text-4xl md:text-5xl lg:text-[5.5rem] font-extrabold tracking-tighter leading-[1.1] relative"
            >
              {/* Subtle text glow behind the main text */}
              <span className="absolute inset-0 blur-2xl text-cyan-500/30">
                Make the desktop feel alive,<br className="hidden lg:block"/> without making it feel loud.
              </span>
              <span className="relative text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-cyan-400 drop-shadow-2xl">
                Make the desktop feel alive,<br className="hidden lg:block"/> without making it feel loud.
              </span>
            </motion.h3>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Section */}
      <FeaturesBento />

      {/* Elegant Cinematic Download Banner Section */}
      <section id="download" className="relative w-full pb-32 pt-8 bg-black">
        <div className="w-full px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="relative flex flex-col md:flex-row items-center justify-between rounded-[3rem] border border-white/5 bg-[#0a0a0a]/80 p-12 md:p-20 shadow-2xl overflow-hidden backdrop-blur-3xl">
            {/* Cinematic Background Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/10 blur-[120px] pointer-events-none rounded-full" />

            {/* Left Column: Copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full md:w-3/5 mb-12 md:mb-0"
            >
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-white leading-[1.1] mb-6">
                Bring your desktop edges to life.
              </h2>
              <p className="text-lg font-light text-muted leading-relaxed max-w-md">
                Install Paraline for Windows and turn the desktop into a softer, more reactive space.
              </p>
            </motion.div>

            {/* Right Column: Actions */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col items-center md:items-end gap-4 w-full md:w-auto"
            >
              <DownloadButton location="cta" className="w-full md:w-64 px-10 py-5 rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.15)] font-semibold tracking-widest text-xs uppercase transition-all duration-300 hover:scale-105" variant="primary">
                Download Installer
              </DownloadButton>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="w-full md:w-64 rounded-full border border-white/10 bg-white/5 px-10 py-5 text-center text-xs font-semibold text-white uppercase tracking-widest transition-all hover:border-white/30 hover:bg-white/10 backdrop-blur-md">
                View Source
              </a>
              <p className="mt-4 text-xs font-light tracking-widest text-muted/60 uppercase">Windows 10 / 11 Supported</p>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
