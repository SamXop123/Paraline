import { motion } from "framer-motion";

const specs = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    label: "Operating System",
    minimum: "Windows 10 (64-bit)",
    recommended: "Windows 11 (64-bit)",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
      </svg>
    ),
    label: "Processor",
    minimum: "Dual-core Intel i3 / AMD Ryzen 3",
    recommended: "Quad-core or higher",
    note: "Quad-core+ recommended for high-refresh visualizers",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 19v-3M10 19v-3M14 19v-3M18 19v-3M8 11V9M16 11V9M12 11V9M2 8h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8zm2-4h16v4H4z"/>
      </svg>
    ),
    label: "Memory (RAM)",
    minimum: "4 GB",
    recommended: "8 GB",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
    label: "Storage",
    minimum: "~500 MB free space",
    recommended: "SSD preferred",
    note: "Required for installer + app files",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    ),
    label: "Audio",
    minimum: "Any WASAPI-compatible output device",
    recommended: "Dedicated soundcard / headphones",
    note: "Built-in laptop speakers work fine",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
      </svg>
    ),
    label: "Internet",
    minimum: "Not required after installation",
    recommended: "—",
    note: "Only needed to download the installer",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function SystemRequirements({ setCurrentPage }) {
  return (
    <div className="relative min-h-screen px-6 pb-24 pt-28 sm:px-8">
      {/* ── page header ── */}
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs uppercase tracking-[0.42em] text-cyan-200/70"
        >
          Before You Download
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-display text-4xl leading-tight tracking-[-0.04em] text-white sm:text-5xl"
        >
          System Requirements
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/50"
        >
          Make sure your machine is ready to run Paraline before downloading.
        </motion.p>
      </div>

      {/* ── spec cards grid ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {specs.map((spec) => (
          <motion.div
            key={spec.label}
            variants={cardVariant}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md transition-all duration-200 hover:border-cyan-300/20 hover:bg-white/[0.05]"
          >
            {/* top glow on hover */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* icon */}
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-cyan-300/80">
              {spec.icon}
            </div>

            {/* label */}
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
              {spec.label}
            </p>

            {/* minimum */}
            <div className="mb-2">
              <p className="mb-0.5 text-[10px] uppercase tracking-[0.15em] text-white/30">
                Minimum
              </p>
              <p className="text-sm font-medium leading-snug text-white/85">
                {spec.minimum}
              </p>
            </div>

            {/* recommended */}
            {spec.recommended && spec.recommended !== "—" && (
              <div className="mb-2">
                <p className="mb-0.5 text-[10px] uppercase tracking-[0.15em] text-emerald-400/50">
                  Recommended
                </p>
                <p className="text-sm font-medium leading-snug text-emerald-300/80">
                  {spec.recommended}
                </p>
              </div>
            )}

            {/* note */}
            {spec.note && (
              <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-white/30">
                {spec.note}
              </p>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* ── windows-only notice ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-8 max-w-5xl rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] px-5 py-4"
      >
        <p className="text-[12px] leading-relaxed text-amber-200/60">
          <span className="font-semibold text-amber-200/80">Windows only. </span>
          Paraline currently supports 64-bit Windows 10 and Windows 11. macOS and Linux builds are not available at this time.
        </p>
      </motion.div>

      {/* ── back / download CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center justify-center gap-3"
      >
        <button
          onClick={() => setCurrentPage("home")}
          className="rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm text-white/70 backdrop-blur transition hover:border-cyan-300/30 hover:bg-white/10 hover:text-white"
        >
          ← Back to Home
        </button>
        <a
          href="https://github.com/SamXop123/Paraline/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-100"
        >
          Download for Windows
        </a>
      </motion.div>
    </div>
  );
}
