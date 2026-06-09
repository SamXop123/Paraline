"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, Download, MonitorPlay, Settings, Terminal } from "lucide-react";
import { DownloadButton } from "@/components/DownloadButton";

const steps = [
  {
    title: "Download Installer",
    description: "Get the latest Paraline release for Windows 10 and 11.",
    icon: Download,
    action: true
  },
  {
    title: "Run Setup",
    description: "Launch the downloaded .exe file and follow the standard Windows installation wizard.",
    icon: Terminal
  },
  {
    title: "Start Paraline",
    description: "Open Paraline from your Start Menu or Desktop shortcut.",
    icon: MonitorPlay
  },
  {
    title: "Configure & Personalize",
    description: "Find the Paraline icon in your system tray (bottom-right). Right-click to change themes and adjust settings.",
    icon: Settings
  }
];

export default function InstallationPage() {
  return (
    <main className="min-h-screen bg-[#010206] pt-32 pb-24 px-6 lg:px-12 relative overflow-hidden">
      {/* Immersive background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-[#010206]/0 to-transparent pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-3xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-bold tracking-[0.2em] text-muted hover:text-white hover:bg-white/[0.06] hover:border-white/20 uppercase transition-all duration-300 mb-16 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-left mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/[0.05] border border-blue-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/80">Setup Guide</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 mb-6 tracking-tighter drop-shadow-lg">
            Installation
          </h1>
          <p className="text-lg text-muted max-w-xl font-light tracking-wide">
            Get your desktop audio visualizer up and running in under a minute.
          </p>
        </motion.div>

        {/* Timeline Section */}
        <div className="relative ml-4 md:ml-6 space-y-16 pb-8">
          {/* Vertical Track */}
          <div className="absolute top-0 bottom-0 left-[23px] w-[2px] bg-gradient-to-b from-blue-500/50 via-white/10 to-transparent" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.8, type: "spring", bounce: 0.2 }}
              className="relative pl-20"
            >
              {/* Premium Timeline Icon */}
              <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-[16px] border border-blue-400/30 bg-[#010206] shadow-[0_0_15px_rgba(59,130,246,0.3),_inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/10" />
                <step.icon className="relative z-10 h-5 w-5 text-blue-400" strokeWidth={1.5} />
              </div>
              
              <div className="pt-2">
                <h2 className="text-xl font-bold tracking-wide text-white mb-3">{step.title}</h2>
                <p className="text-[15px] font-light leading-relaxed text-white/50 max-w-xl">{step.description}</p>
                
                {step.action && (
                  <div className="mt-8">
                    <DownloadButton className="inline-flex px-8 py-4 rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.15)] font-bold tracking-widest text-xs uppercase transition-all duration-300 hover:scale-105" variant="primary">
                      Download Installer
                    </DownloadButton>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Post-Installation Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-16 rounded-[24px] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <p className="relative z-10 text-[14px] font-light leading-relaxed text-white/70">
            <span className="font-semibold text-white">Note: </span>
            Once started, Paraline runs as a seamless desktop overlay and reacts in real-time to the audio playing through your default output device.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
