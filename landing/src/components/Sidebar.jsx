import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export default function Sidebar({ isSidebarOpen, closeSidebar }) {
  const sidebarRef = useRef(null);
  const previousFocusRef = useRef(null);

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  useEffect(() => {
    if (!isSidebarOpen || !sidebarRef.current) {
      return undefined;
    }

    const sidebar = sidebarRef.current;
    previousFocusRef.current = document.activeElement;

    const getFocusableElements = () => Array.from(sidebar.querySelectorAll(focusableSelector));
    const focusableElements = getFocusableElements();
    (focusableElements[0] || sidebar).focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const elements = getFocusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        sidebar.focus();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [isSidebarOpen, closeSidebar]);

  return (
    <>
      {/* Backdrop overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: isSidebarOpen ? 1 : 0, pointerEvents: isSidebarOpen ? "auto" : "none" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={closeSidebar}
        className="fixed inset-0 z-40 bg-[#02040c]/40 backdrop-blur-[2px] lg:hidden"
        aria-hidden={!isSidebarOpen}
      />

      {/* Sidebar panel */}
      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 450, damping: 30 }}
        role="dialog"
        aria-modal="true"
        inert={!isSidebarOpen}
        tabIndex={-1}
        className="fixed top-0 left-0 z-50 flex h-screen w-[min(85vw,20rem)] flex-col overflow-hidden border-r border-white/[0.08] bg-[#050816]/95 shadow-[10px_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:w-[min(70vw,18rem)] md:w-[min(50vw,16rem)] lg:w-[min(22vw,15rem)]"
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[rgba(125,211,252,0.1)] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-[rgba(168,85,247,0.08)] to-transparent pointer-events-none" />

        {/* Header */}
        <div className="w-full min-h-[80px] px-6 border-b border-white/[0.06] flex items-center justify-between relative z-10 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(125,211,252,0.3)] bg-white/5 p-0.5 overflow-hidden">
              <img src="/appicon.png" alt="Paraline Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <h3 className="font-bold tracking-[0.25em] text-sm bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">PARALINE</h3>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
            className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-150 group"
          >
            <img src='./sidebar-icons/sidebar.svg' className="h-5 invert opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" alt="Close Sidebar" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-8 px-5 z-10 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex flex-col gap-1 w-full">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 px-3 font-bold">Menu</p>

            <SidebarItem icon="./sidebar-icons/home.svg" label="Home" active={true} onNavigate={handleNavClick} />
            <SidebarItem icon="./sidebar-icons/tools.svg" label="Installation Guide" onNavigate={handleNavClick} />
            <SidebarItem icon="./sidebar-icons/theme.svg" label="Themes" onNavigate={handleNavClick} />
            <SidebarItem icon="./sidebar-icons/settings.svg" label="Settings" onNavigate={handleNavClick} />
          </div>

          <div className="flex flex-col gap-1 w-full mt-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 px-3 font-bold">Support</p>

            <SidebarItem icon="./sidebar-icons/customer-service.svg" label="Contact Us" onNavigate={handleNavClick} />
            <SidebarItem icon="./sidebar-icons/github-svgrepo-com.svg" label="Github" onNavigate={handleNavClick} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/[0.06] z-10 bg-[#02040c]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-50"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
            </div>
            <span className="text-xs text-white/40 tracking-widest uppercase font-semibold">Active</span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function SidebarItem({ icon, label, active, onNavigate }) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className={`relative flex items-center w-full px-3 py-3.5 rounded-2xl transition-all duration-150 group overflow-hidden ${active ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'}`}
    >
      {/* Hover background highlight */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* Active left border indicator */}
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-0 top-[15%] w-[3px] h-[70%] bg-sky-400 rounded-r-full shadow-[0_0_12px_rgba(56,189,248,0.8)]"
        />
      )}

      <div className="relative z-10 flex items-center w-full">
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 ${active ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/5'}`}>
          <img
            src={icon}
            className={`h-[18px] invert transition-all duration-150 ${active ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'opacity-50 group-hover:opacity-100 group-hover:scale-110'}`}
            alt={label}
          />
        </div>
        <span className={`ml-3.5 text-[13px] font-semibold tracking-wide transition-all duration-150 ${active ? 'text-white' : 'text-white/60 group-hover:text-white group-hover:translate-x-1'}`}>
          {label}
        </span>
      </div>
    </button>
  );
}