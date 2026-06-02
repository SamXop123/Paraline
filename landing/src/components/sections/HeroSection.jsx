import { motion } from "framer-motion";
import EdgePulseFrame from "../EdgePulseFrame";

const heroLines = ["Audio reactive", "Edge-native", "Built for Windows"];

export default function HeroSection({ downloadUrl, isHostedInstaller, onDownloadClick, setCurrentPage }) {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pb-16 pt-28 sm:px-8"
    >
      <EdgePulseFrame />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.12,
              },
            },
          }}
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-xs uppercase tracking-[0.42em] text-cyan-200/70"
          >
            Desktop Atmosphere
          </motion.p>

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-display text-6xl leading-none tracking-[-0.05em] text-white sm:text-7xl md:text-8xl"
          >
            Paraline
          </motion.h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/65 sm:text-lg"
          >
            Audio-reactive edge visualizer for Windows desktops that makes your music feel ambient.
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col items-center justify-center gap-3"
          >
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={downloadUrl}
                download={isHostedInstaller ? undefined : "Paraline-Setup.exe"}
                onClick={onDownloadClick}
                className="rounded-full bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-100"
              >
                Download for Windows
              </a>
              <a
                href="#themes"
                className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/78 backdrop-blur transition hover:border-cyan-300/30 hover:bg-white/10 hover:text-white"
              >
                Explore Themes
              </a>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 w-full max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 shadow-aura backdrop-blur md:p-6"
        >
          <div className="relative overflow-hidden rounded-[1.6rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.12),transparent_32%),linear-gradient(180deg,rgba(8,12,25,0.94),rgba(5,8,18,1))] px-5 py-8 md:px-8 md:py-10">
            <div className="absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
            <div className="absolute inset-y-8 left-6 w-px bg-gradient-to-b from-transparent via-cyan-200/50 to-transparent" />
            <div className="absolute inset-y-8 right-6 w-px bg-gradient-to-b from-transparent via-cyan-200/28 to-transparent" />
            <div className="absolute inset-x-8 bottom-6 h-px bg-gradient-to-r from-transparent via-fuchsia-200/35 to-transparent" />

            <motion.div
              className="hero-wave-shell absolute inset-x-14 top-1/2 -translate-y-1/2"
              animate={{ opacity: [0.42, 0.95, 0.55, 0.42] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {heroLines.map((line) => (
                <span
                  key={line}
                  className="rounded-full border border-white/12 bg-white/6 px-5 py-2.5 text-[11px] uppercase tracking-[0.28em] text-white/70"
                >
                  {line}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}