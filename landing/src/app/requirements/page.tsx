"use client";

import { motion } from "framer-motion";
import { Monitor, Cpu, CircuitBoard, HardDrive, Volume2, Wifi, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const requirements = [
  {
    id: "os",
    icon: Monitor,
    title: "Operating System",
    color: "from-blue-500/10 via-blue-500/5 to-transparent",
    glow: "bg-blue-500/40",
    border: "group-hover:border-t-blue-400/40",
    iconColor: "text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]",
    min: "Windows 10 (64-bit)",
    rec: "Windows 11 (64-bit)",
    sub: null
  },
  {
    id: "cpu",
    icon: Cpu,
    title: "Processor",
    color: "from-purple-500/10 via-purple-500/5 to-transparent",
    glow: "bg-purple-500/40",
    border: "group-hover:border-t-purple-400/40",
    iconColor: "text-purple-400 drop-shadow-[0_0_12px_rgba(192,132,252,0.6)]",
    min: "Dual-core Intel i3 / AMD Ryzen 3",
    rec: "Quad-core or higher",
    sub: "Quad-core+ recommended for high-refresh visualizers"
  },
  {
    id: "ram",
    icon: CircuitBoard,
    title: "Memory (RAM)",
    color: "from-cyan-500/10 via-cyan-500/5 to-transparent",
    glow: "bg-cyan-500/40",
    border: "group-hover:border-t-cyan-400/40",
    iconColor: "text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]",
    min: "4 GB",
    rec: "8 GB",
    sub: null
  },
  {
    id: "storage",
    icon: HardDrive,
    title: "Storage",
    color: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    glow: "bg-emerald-500/40",
    border: "group-hover:border-t-emerald-400/40",
    iconColor: "text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]",
    min: "~500 MB free space",
    rec: "SSD preferred",
    sub: "Required for installer + app files"
  },
  {
    id: "audio",
    icon: Volume2,
    title: "Audio",
    color: "from-pink-500/10 via-pink-500/5 to-transparent",
    glow: "bg-pink-500/40",
    border: "group-hover:border-t-pink-400/40",
    iconColor: "text-pink-400 drop-shadow-[0_0_12px_rgba(244,114,182,0.6)]",
    min: "Any WASAPI-compatible output device",
    rec: "Dedicated soundcard / headphones",
    sub: "Built-in laptop speakers work fine"
  },
  {
    id: "internet",
    icon: Wifi,
    title: "Internet",
    color: "from-amber-500/10 via-amber-500/5 to-transparent",
    glow: "bg-amber-500/40",
    border: "group-hover:border-t-amber-400/40",
    iconColor: "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]",
    min: "Not required after installation",
    rec: null,
    sub: "Only needed to download the installer"
  }
];

export default function SystemRequirements() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-12 bg-[#060913] relative overflow-hidden z-0">
      {/* Immersive background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#060913] to-[#060913] -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen -z-10" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 mb-6 tracking-tighter drop-shadow-lg">
            System Requirements
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto font-light tracking-wide">
            Make sure your machine is ready to run Paraline's high-performance audio engine and visualizers before downloading.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {requirements.map((req, idx) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 + idx * 0.1, type: "spring", bounce: 0.3 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className={cn(
                "bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[32px] p-8 relative overflow-hidden group cursor-default transition-all duration-500",
                "shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_10px_20px_rgba(0,0,0,0.3)]",
                "hover:bg-white/[0.04] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_20px_40px_rgba(0,0,0,0.5)]",
                req.border
              )}
            >
              {/* Internal gradient sweep */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700", req.color)} />
              
              {/* Radial glow behind icon */}
              <div className={cn("absolute -top-12 -left-12 w-32 h-32 blur-[50px] rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700", req.glow)} />
              
              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-8">
                  <div className="flex items-center justify-center w-14 h-14 rounded-[20px] bg-white/[0.03] border border-white/10 group-hover:bg-white/[0.06] group-hover:border-white/20 transition-all duration-500 shadow-inner">
                    <req.icon className={cn("w-6 h-6 transition-transform duration-500 group-hover:scale-110", req.iconColor)} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white/60 group-hover:text-white transition-colors">
                    {req.title}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Minimum Spec Box */}
                  <div className="bg-[#010206]/40 border border-white/5 rounded-2xl p-4 group-hover:bg-[#010206]/60 transition-colors shadow-inner">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-white/30" />
                      Minimum
                    </div>
                    <div className="text-[15px] font-medium text-white/90 leading-tight">{req.min}</div>
                  </div>

                  {/* Recommended Spec Box */}
                  {req.rec ? (
                    <div className="bg-emerald-500/[0.05] border border-emerald-500/10 rounded-2xl p-4 group-hover:bg-emerald-500/[0.08] group-hover:border-emerald-500/20 transition-colors shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/70 mb-2 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]" />
                        Recommended
                      </div>
                      <div className="text-[15px] font-semibold text-emerald-300 leading-tight">{req.rec}</div>
                    </div>
                  ) : (
                    // Spacer for grid alignment
                    <div className="h-[80px]" />
                  )}
                </div>

                {/* Subtitle / Note */}
                {req.sub && (
                  <div className="mt-6">
                    <p className="text-[11px] font-medium tracking-wide text-white/30 italic group-hover:text-white/50 transition-colors">
                      * {req.sub}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Warning Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="w-full max-w-4xl mx-auto bg-gradient-to-r from-amber-500/[0.05] via-amber-500/[0.02] to-amber-500/[0.05] border border-amber-500/20 rounded-[24px] p-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left shadow-[inset_0_1px_1px_rgba(251,191,36,0.1),_0_0_40px_rgba(245,158,11,0.05)] relative overflow-hidden"
        >
          {/* Subtle amber pulse */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/50 shadow-[0_0_15px_#f59e0b]" />
          
          <div className="flex-shrink-0 w-12 h-12 rounded-[16px] bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
            <AlertTriangle className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          </div>
          <p className="text-[15px] text-white/80 leading-relaxed font-light">
            <span className="font-extrabold text-amber-400 mr-2 tracking-wide">WINDOWS ONLY.</span> 
            Paraline currently supports 64-bit Windows 10 and Windows 11. macOS and Linux builds are not available at this time.
          </p>
        </motion.div>

      </div>
    </main>
  );
}
