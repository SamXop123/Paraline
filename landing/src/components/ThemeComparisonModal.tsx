"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp } from "lucide-react";
import { specificThemes, Theme } from "./ThemeShowcase";

interface ThemeComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  compareList: string[];
}

export function ThemeComparisonModal({ isOpen, onClose, compareList }: ThemeComparisonModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Retrieve the actual theme objects in the order they were selected
  const themesToCompare = compareList
    .map(id => specificThemes.find(t => t.id === id))
    .filter(Boolean) as Theme[];

  const getBadgeColor = (value: string) => {
    switch (value.toLowerCase()) {
      case "low":
      case "very low":
      case "minimal":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
      case "medium":
      case "moderate":
        return "border-blue-500/30 bg-blue-500/10 text-blue-400";
      case "high":
      case "bold":
      case "dynamic":
        return "border-purple-500/30 bg-purple-500/10 text-purple-400";
      default:
        return "border-white/20 bg-white/5 text-white/70";
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-12">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#060913]/85 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative flex flex-col w-full max-w-[1200px] max-h-[85vh] bg-[#0c101a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.7)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/5 bg-white/[0.02]">
              <div>
                <p className="text-[10px] font-extrabold text-cyan-500 uppercase tracking-[0.2em] mb-1">
                  Comparing
                </p>
                <h3 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                  {themesToCompare.map(t => t.name).join(" vs ")}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-10 custom-scrollbar">
              {/* Previews Row */}
              <div 
                className="grid gap-6 sm:gap-10 mb-10"
                style={{ gridTemplateColumns: `repeat(${themesToCompare.length}, minmax(0, 1fr))` }}
              >
                {themesToCompare.map((theme) => (
                  <div key={theme.id} className="flex flex-col items-center">
                    <div className="relative w-full aspect-video bg-[#04060d] rounded-[20px] border border-white/5 shadow-[inset_0_2px_30px_rgba(0,0,0,0.8)] overflow-hidden mb-6">
                      <div className="absolute inset-0 scale-[0.8] origin-center pointer-events-none">
                        <theme.Preview active={true} />
                      </div>
                    </div>
                    <h4 className="text-xl font-extrabold text-white mb-2">{theme.name}</h4>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                      {theme.category}
                    </p>
                  </div>
                ))}
              </div>

              {/* Comparison Table */}
              <div className="space-y-3">
                {[
                  { label: "ANIMATION STYLE", key: "animationStyle" },
                  { label: "REACTIVITY", key: "reactivity", badge: true },
                  { label: "VISUAL INTENSITY", key: "visualIntensity", badge: true },
                  { label: "PERFORMANCE IMPACT", key: "performanceImpact", badge: true },
                  { label: "BEST FOR", key: "bestFor" }
                ].map((row, idx) => (
                  <div 
                    key={row.label}
                    className={`flex flex-col sm:flex-row items-center rounded-xl p-5 transition-colors ${idx % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                  >
                    <div className="w-full sm:w-48 shrink-0 text-[10px] font-bold text-muted/60 uppercase tracking-widest mb-4 sm:mb-0 text-center sm:text-left">
                      {row.label}
                    </div>
                    <div 
                      className="flex-1 w-full grid gap-6 sm:gap-10"
                      style={{ gridTemplateColumns: `repeat(${themesToCompare.length}, minmax(0, 1fr))` }}
                    >
                      {themesToCompare.map(theme => (
                        <div key={theme.id} className="flex justify-center text-center">
                          {row.badge ? (
                            <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${getBadgeColor(theme[row.key as keyof Theme] as string)}`}>
                              {theme[row.key as keyof Theme] as string}
                            </span>
                          ) : (
                            <span className="text-[13px] font-medium text-white/90 tracking-wide">
                              {theme[row.key as keyof Theme] as string}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Gradient overlay for scroll affordance */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0c101a] to-transparent pointer-events-none" />
            <div className="absolute bottom-4 right-8 flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/30 backdrop-blur-md">
              <ChevronUp className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
