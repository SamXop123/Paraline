"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Introduction",
      content: "Paraline is committed to protecting your privacy while providing a high-performance desktop visualizer experience. This Privacy Policy explains how we handle data and sets out our commitment to transparency."
    },
    {
      title: "Data Collection",
      content: "We currently collect limited anonymous analytics to understand how users interact with our platform. This includes website visits, download interactions, approximate device/browser information, and regional usage trends. We do NOT collect sensitive personal information, files, passwords, or private user content."
    },
    {
      title: "Local Processing",
      content: "Paraline is designed as a local-first application. Most operations, including audio processing and visual rendering, occur entirely on your device. Your local settings and theme configurations are stored locally and are not transmitted to our servers."
    },
    {
      title: "Third-Party Services",
      content: "We use standard web services like Vercel Analytics and Google Analytics to monitor website performance. These services help us understand compatibility and performance needs across different platforms."
    },
    {
      title: "GitHub & External Links",
      content: "Our website contains links to external sites, including GitHub for source code and releases. We are not responsible for the privacy practices or content of these third-party platforms."
    },
    {
      title: "Future Analytics Notice",
      content: "As Paraline evolves, we may implement additional anonymous telemetry to help debug performance issues and improve theme stability. Any such changes will always prioritize user anonymity and data minimization."
    },
    {
      title: "Contact Information",
      content: "If you have any questions or concerns about these terms or our privacy practices, please contact us via the GitHub repository or the support email."
    }
  ];

  return (
    <main className="min-h-screen bg-[#010206] pt-32 pb-24 px-6 lg:px-12 relative overflow-hidden">
      {/* Immersive background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-[#010206]/0 to-transparent pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-bold tracking-[0.2em] text-muted hover:text-white hover:bg-white/[0.06] hover:border-white/20 uppercase transition-all duration-300 mb-16 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/[0.05] border border-blue-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/80">Privacy</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 mb-6 tracking-tighter drop-shadow-lg">
            Privacy Policy
          </h1>
          <p className="text-sm font-bold tracking-[0.2em] text-muted/50 uppercase">
            Last Updated: May 2026
          </p>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <motion.section
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 * idx, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-10 hover:bg-white/[0.04] transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
            >
              <h2 className="text-xl font-bold tracking-tight text-white mb-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500/50" />
                {section.title}
              </h2>
              <p className="text-base font-light leading-relaxed text-white/60">
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>
      </div>
    </main>
  );
}