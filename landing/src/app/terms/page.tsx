"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: "By accessing or using Paraline, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the software."
    },
    {
      title: "Open Source Notice",
      content: "Paraline is an open-source project. While the source code is available under the MIT License, your use of the software hosted or distributed by us is still subject to these terms. Please refer to the LICENSE file in the repository for specific code-level permissions."
    },
    {
      title: "Usage Disclaimer",
      content: "Paraline is provided 'as is' for visual enhancement purposes. You are responsible for ensuring that your use of the software complies with all local laws and regulations. We do not guarantee compatibility with all hardware configurations or Windows versions."
    },
    {
      title: "No Warranty / Liability",
      content: "Paraline is provided without warranty of any kind, express or implied. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software."
    },
    {
      title: "External Links",
      content: "Our website and application may contain links to external sites (such as GitHub). We have no control over the content or practices of these sites and cannot be held responsible for their privacy policies or terms of service."
    },
    {
      title: "Software Modifications",
      content: "We reserve the right to modify, suspend, or discontinue Paraline at any time without notice. We are not liable to you or any third party for any modification, price change, suspension, or discontinuance of the software."
    }
  ];

  return (
    <main className="min-h-screen bg-[#010206] pt-32 pb-24 px-6 lg:px-12 relative overflow-hidden">
      {/* Immersive background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/15 via-[#010206]/0 to-transparent pointer-events-none" />
      
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/[0.05] border border-purple-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400/80">Legal</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 mb-6 tracking-tighter drop-shadow-lg">
            Terms & Conditions
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
                <span className="w-2 h-2 rounded-full bg-purple-500/50" />
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