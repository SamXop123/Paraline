"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GITHUB_URL } from "@/lib/paraline-api";
import { Logo } from "./Logo";
import { 
  Home, 
  Image as ImageIcon, 
  Settings, 
  FileText, 
  HelpCircle, 
  Download, 
  HeadphonesIcon,
  Laptop,
  ShieldCheck
} from "lucide-react";


const Github = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export function Footer() {
  return (
    <footer className="relative mt-auto w-full border-t border-white/5 bg-transparent backdrop-blur-md max-w-7xl mx-auto px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-6 py-6 md:flex-row lg:px-8">

        {/* Left Side */}
        <div className="flex flex-col items-start justify-center md:items-start md:text-left">
          <Logo />
          <span className="mt-2 text-[10px] font-medium tracking-[0.15em] text-muted/80 uppercase">
            Paraline brings life to your desktop edges <br />with beautiful, reactive ambient lighting. 
          </span>
        </div>

        {/* Right Side: Links */}
        <div className="grid w-auto grid-cols-2 gap-x-8 gap-y-10 sm:flex sm:flex-wrap sm:justify-center">
          <div className="flex flex-col items-start gap-6">
            <h1 className="text-[12px] font-extrabold uppercase tracking-[0.25em] text-purple-400/80">Product</h1>
            <Link href="/" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><Home />Home</Link>
            <Link href="/#themes" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><ImageIcon />Theme Gallery</Link>
            <Link href="/settings" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><Settings />Configuration</Link>
            <Link href="/#download" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><Download />Get Paraline</Link>
          </div>
          <div className="flex flex-col items-start gap-6">
            <h1 className="text-[12px] font-extrabold uppercase tracking-[0.25em] text-cyan-400/80">Resources</h1>
            <a href="/requirements" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><Laptop />System Requirements</a>
            <a href="/faq" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><HelpCircle />FAQ</a>
            <a href="/installation" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><Download/>Installation guide</a>
          </div>
          <div className="flex flex-col items-start gap-6">
            <h1 className="text-[12px] font-extrabold uppercase tracking-[0.25em] text-green-400/80">Support</h1>
            <Link href="/contact" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><HeadphonesIcon />Contact Us</Link>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><Github />GitHub</a>
          </div>
          <div className="flex flex-col items-start gap-6">
            <h1 className="text-[12px] font-extrabold uppercase tracking-[0.25em] text-pink-400/80">Legal</h1>
            <a href="/terms" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><FileText />Terms & Conditions</a>
            <a href="/privacy" className="flex justify-center items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1"><ShieldCheck />Privacy Policy</a>
          </div>
        </div>
      </div>
      
      {/* Seperator */}
      <div className="border-t border-white/5"></div>
      
          {/* Bottom */}
          <div className="p-3 text-[11px] font-medium tracking-[0.15em] text-muted/80 hover:text-white transition-colors cursor-default text-center">
              <div>
                © 2026 Paraline. All rights reserved.
              </div>
              <div>
                Paraline is not affiliated with Microsoft Corporation.
              </div>
          </div>
    </footer>
  );
}
