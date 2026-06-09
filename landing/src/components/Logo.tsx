import { HTMLAttributes } from "react";
import Image from "next/image";

export function Logo({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center gap-3.5 group cursor-pointer ${className}`} {...props}>
      <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 group-hover:border-cyan-500/40 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] group-hover:scale-105">
        <Image src="/logo.png" alt="Paraline Logo" fill className="object-cover relative z-10 transition-transform duration-700" />
      </div>
      <span className="text-[26px] font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 group-hover:to-cyan-200 transition-colors duration-500 drop-shadow-md">
        Paraline
      </span>
    </div>
  );
}
