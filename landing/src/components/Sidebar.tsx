"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Home, 
  Image as ImageIcon, 
  Settings, 
  FileText, 
  HelpCircle, 
  Download, 
  HeadphonesIcon,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar";
import { GITHUB_URL } from "@/lib/paraline-api";
import { Logo } from "./Logo";

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

const menuItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "themes", label: "Theme Gallery", icon: ImageIcon, href: "/#themes" },
  { id: "settings", label: "Configuration", icon: Settings, href: "/settings" },
  { id: "download", label: "Get Paraline", icon: Download, href: "/#download" }
];

const resourceItems = [
  { id: "requirements", label: "System Requirements", icon: Settings, href: "/requirements" },
  { id: "faq", label: "FAQ", icon: HelpCircle, href: "/faq" },
  { id: "install", label: "Installation Guide", icon: Download, href: "/installation" }
];

const supportItems = [
  { name: "Contact Us", href: "/contact", icon: HeadphonesIcon },
  { name: "Github", href: GITHUB_URL, icon: Github, external: true },
];

export function Sidebar() {
  const { isOpen, toggle } = useSidebarStore();
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    setActiveHash(window.location.hash);
    
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        useSidebarStore.getState().setIsOpen(false);
      }
    };
    
    // Auto-close sidebar on mobile devices by default on mount
    handleResize();
    
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname]);

  const checkIsActive = (href: string) => {
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      return pathname === path && activeHash === '#' + hash;
    }
    if (href === '/') {
      return pathname === '/' && !activeHash;
    }
    return pathname === href;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => { if (isOpen) toggle(); }}
      />

      <aside 
      className={cn(
        "fixed left-0 top-0 z-50 flex h-full w-64 flex-col justify-between border-r border-white/5 bg-[#010206]/80 backdrop-blur-2xl transition-transform duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.5)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <button
        onClick={toggle}
        className={cn(
          "absolute top-0 -right-10 z-50 flex h-10 w-10 items-center justify-center rounded-br-xl border border-t-0 border-l-0 backdrop-blur-2xl transition-all duration-500 group shadow-[4px_0_24px_rgba(0,0,0,0.5)]",
          isOpen 
            ? "bg-white/[0.02] border-white/5 text-muted hover:text-white hover:bg-white/[0.08]" 
            : "bg-[#010206]/90 border-cyan-500/30 text-cyan-400 hover:bg-[#010206] hover:border-cyan-400/60 hover:text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
        )}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? (
          <ChevronLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
        ) : (
          <Menu className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
        )}
      </button>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex h-20 items-center px-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent"
        >
          <Logo />
        </motion.div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {/* Menu Section */}
          <div className="mb-8 mt-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-4 px-2"
            >
              <h3 className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-cyan-400/80">
                Menu
              </h3>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-400/20 to-transparent" />
            </motion.div>
            
            <nav className="flex flex-col gap-1.5">
              {menuItems.map((item, idx) => {
                const isActive = checkIsActive(item.href);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (item.href.includes('#')) {
                          setActiveHash('#' + item.href.split('#')[1]);
                        } else {
                          setActiveHash('');
                        }
                        if (window.innerWidth < 1024 && isOpen) {
                          toggle();
                        }
                      }}
                      className={cn(
                        "group relative flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 overflow-hidden",
                        isActive 
                          ? "text-white bg-gradient-to-r from-cyan-500/20 to-transparent border-l-2 border-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                          : "text-muted hover:text-white hover:bg-white/[0.04] hover:translate-x-1 border-l-2 border-transparent"
                      )}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-glow"
                          className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-transparent blur-md -z-10"
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-3">
                        <item.icon 
                          className={cn(
                            "h-[18px] w-[18px] transition-all duration-300", 
                            isActive ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] scale-110" : "text-muted group-hover:text-cyan-200"
                          )} 
                          strokeWidth={isActive ? 2.5 : 1.5} 
                        />
                        <span className="tracking-wide">{item.label}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </div>

          {/* Resources Section */}
          <div className="mb-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mb-4 px-2"
            >
              <h3 className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-purple-400/80">
                Resources
              </h3>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-purple-400/20 to-transparent" />
            </motion.div>
            
            <nav className="flex flex-col gap-1.5">
              {resourceItems.map((item, idx) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + idx * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (window.innerWidth < 1024 && isOpen) {
                          toggle();
                        }
                      }}
                      className={cn(
                        "group relative flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 overflow-hidden",
                        isActive 
                          ? "text-white bg-gradient-to-r from-purple-500/20 to-transparent border-l-2 border-purple-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                          : "text-muted hover:text-white hover:bg-white/[0.04] hover:translate-x-1 border-l-2 border-transparent"
                      )}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="active-glow-resources"
                          className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-transparent blur-md -z-10"
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-3">
                        <item.icon 
                          className={cn(
                            "h-[18px] w-[18px] transition-all duration-300", 
                            isActive ? "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)] scale-110" : "text-muted group-hover:text-purple-200"
                          )} 
                          strokeWidth={isActive ? 2.5 : 1.5} 
                        />
                        <span className="tracking-wide">{item.label}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </div>

          {/* Support Section */}
          <div className="mb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 mb-4 px-2"
            >
              <h3 className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-emerald-400/80">
                Support
              </h3>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-400/20 to-transparent" />
            </motion.div>
            
            <nav className="flex flex-col gap-1.5">
              {supportItems.map((item, idx) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
                >
                  <Link
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    onClick={() => {
                      if (window.innerWidth < 1024 && isOpen) {
                        toggle();
                      }
                    }}
                    className="group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-muted transition-all duration-300 hover:bg-white/[0.04] hover:text-white hover:translate-x-1 border-l-2 border-transparent"
                  >
                    <item.icon className="h-[18px] w-[18px] text-muted group-hover:text-emerald-300 transition-colors" strokeWidth={1.5} />
                    <span className="tracking-wide">{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>
        </div>
      </div>


      </aside>
    </>
  );
}
