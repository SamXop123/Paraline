"use client";

import { motion } from "framer-motion";

export function SideBraidsPreview({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#060913]/90 z-0" />
      
      {/* Left Braid */}
      <div className="absolute left-0 top-0 bottom-0 w-4 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 10 100">
          <motion.path
            d="M 5,0 Q 15,12.5 5,25 T 5,50 T 5,75 T 5,100"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1"
            animate={{ d: active ? "M 5,0 Q -5,12.5 5,25 T 5,50 T 5,75 T 5,100" : "M 5,0 Q 10,12.5 5,25 T 5,50 T 5,75 T 5,100" }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "mirror" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(168,85,247,0.8))" }}
          />
          <motion.path
            d="M 5,0 Q -5,12.5 5,25 T 5,50 T 5,75 T 5,100"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1"
            animate={{ d: active ? "M 5,0 Q 15,12.5 5,25 T 5,50 T 5,75 T 5,100" : "M 5,0 Q 2,12.5 5,25 T 5,50 T 5,75 T 5,100" }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: "mirror" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(56,189,248,0.8))" }}
          />
        </svg>
      </div>

      {/* Right Braid */}
      <div className="absolute right-0 top-0 bottom-0 w-4 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 10 100">
          <motion.path
            d="M 5,0 Q -5,12.5 5,25 T 5,50 T 5,75 T 5,100"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1"
            animate={{ d: active ? "M 5,0 Q 15,12.5 5,25 T 5,50 T 5,75 T 5,100" : "M 5,0 Q 2,12.5 5,25 T 5,50 T 5,75 T 5,100" }}
            transition={{ duration: 1.1, repeat: Infinity, repeatType: "mirror" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(56,189,248,0.8))" }}
          />
          <motion.path
            d="M 5,0 Q 15,12.5 5,25 T 5,50 T 5,75 T 5,100"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1"
            animate={{ d: active ? "M 5,0 Q -5,12.5 5,25 T 5,50 T 5,75 T 5,100" : "M 5,0 Q 10,12.5 5,25 T 5,50 T 5,75 T 5,100" }}
            transition={{ duration: 0.9, repeat: Infinity, repeatType: "mirror" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(168,85,247,0.8))" }}
          />
        </svg>
      </div>
    </div>
  );
}
