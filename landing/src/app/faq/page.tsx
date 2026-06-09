"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "What is Paraline?",
    answer: "Paraline is a modern audio visualizer for Windows that sits on the edges of your screen. It reacts to your system audio in real-time with beautiful themes and smooth animations."
  },
  {
    question: "Does it work on Windows 10 and 11?",
    answer: "Yes, Paraline is fully compatible with both Windows 10 and Windows 11. It's built specifically for the Windows desktop environment."
  },
  {
    question: "Will it impact my PC's performance?",
    answer: "Paraline is designed to be extremely lightweight. It uses efficient rendering techniques to ensure minimal CPU and GPU usage, so it won't impact your gaming or productivity."
  },
  {
    question: "How do I change themes?",
    answer: "Once Paraline is running, you can find its icon in the Windows system tray (bottom-right). Right-click the icon to see a list of available themes and switch between them instantly."
  },
  {
    question: "Can I customize the visualizer settings?",
    answer: "Absolutely. Through the system tray menu, you can access the Settings panel to adjust sensitivity, line thickness, opacity, and other theme-specific parameters."
  },
  {
    question: "Does Paraline record my audio?",
    answer: "No. Paraline only captures the output wave data from your system for visualization purposes. No audio is recorded, stored, or transmitted anywhere."
  },
  {
    question: "How do I update to the latest version?",
    answer: "You can download the latest installer from this website. Running the new installer will automatically update your existing Paraline installation while keeping your settings intact."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 lg:px-12 bg-[#060913] relative overflow-hidden z-0">
      {/* Immersive background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#060913] to-[#060913] -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen -z-10" />
      
      <div className="relative z-10 w-full max-w-4xl mx-auto">
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
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/[0.05] border border-indigo-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/80">Help Center</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 mb-6 tracking-tighter drop-shadow-lg">
            FAQ
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto font-light tracking-wide">
            Everything you need to know about Paraline. Can't find an answer? Reach out on GitHub.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 * idx, type: "spring", bounce: 0.2 }}
                className={`overflow-hidden rounded-3xl border border-white/5 backdrop-blur-xl transition-all duration-500 ${
                  isOpen 
                    ? "bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_10px_20px_rgba(0,0,0,0.3)] border-white/10" 
                    : "bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${idx}`}
                  className="flex w-full items-center justify-between p-6 md:px-8 md:py-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-3xl group"
                >
                  <span className={`text-[15px] font-bold transition-colors duration-300 ${isOpen ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                    {faq.question}
                  </span>
                  <div className={`flex shrink-0 items-center justify-center w-8 h-8 rounded-full border transition-all duration-500 ${
                    isOpen 
                      ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400 rotate-180" 
                      : "bg-white/[0.05] border-white/10 text-white/40 group-hover:bg-white/[0.1] group-hover:text-white/80"
                  }`}>
                    <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${idx}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0">
                        <div className="h-[1px] w-full bg-gradient-to-r from-white/5 to-transparent mb-6" />
                        <p className="text-[14px] leading-relaxed font-light text-white/60">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
