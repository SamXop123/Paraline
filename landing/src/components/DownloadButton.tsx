"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  className?: string;
  variant?: "primary" | "secondary";
  children?: React.ReactNode;
  style?: React.CSSProperties;
  location?: string;
}

export function DownloadButton({ className, variant = "primary", children, style, location = "general" }: DownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "downloading" | "done">("idle");

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (status !== "idle") return;

    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "download_click", {
        location: location
      });
    }
    
    setStatus("connecting");
    
    try {
      // Connect to our backend endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("/api/download", { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error("Failed to connect");
      
      const data = await res.json();
      
      setStatus("downloading");
      
      // Keep downloading state for a bit so it looks nice
      setTimeout(() => {
        try {
          const parsedUrl = new URL(data.url);
          const allowedHosts = ["github.com", "objects.githubusercontent.com"];
          
          if (parsedUrl.protocol !== "https:" || !allowedHosts.includes(parsedUrl.hostname)) {
            throw new Error("Untrusted download URL");
          }

          // Trigger the native download natively
          const a = document.createElement("a");
          a.href = parsedUrl.toString();
          // if this was an actual exe we would use the download attribute
          // a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setStatus("done");
          
          setTimeout(() => setStatus("idle"), 4000);
        } catch (err) {
          console.error("URL validation failed", err);
          setStatus("idle");
          alert("Invalid download URL. Please visit our GitHub releases directly.");
        }
      }, 800);
      
    } catch (error: any) {
      console.error(error);
      setStatus("idle");
      
      if (error?.name === 'AbortError') {
        alert("The download request timed out. Please try again or visit our GitHub releases directly.");
      } else {
        // Fallback
        window.open("https://github.com/SamXop123/Paraline/releases/latest", "_blank");
      }
    }
  };

  const isPrimary = variant === "primary";

  // Base styles depending on status
  let statusStyles = "";
  if (status === "idle") {
    // We let the parent className handle idle styles if they provide background, otherwise fallback
    statusStyles = className?.includes("bg-") ? "" : (isPrimary 
      ? "bg-white text-black hover:shadow-[0_0_30px_0_rgba(255,255,255,0.3)] hover:scale-105" 
      : "bg-white text-black hover:scale-105 hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]");
  } else if (status === "connecting") {
    statusStyles = "bg-none! bg-white! text-black! cursor-wait shadow-[0_0_20px_rgba(255,255,255,0.5)]!";
  } else if (status === "downloading") {
    statusStyles = "bg-none! bg-cyan-500! text-white! shadow-[0_0_40px_rgba(34,211,238,0.6)]!";
  } else if (status === "done") {
    statusStyles = "bg-none! bg-purple-500! text-white! shadow-[0_0_40px_rgba(168,85,247,0.6)]!";
  }

  return (
    <motion.button
      onClick={handleDownload}
      whileTap={status === "idle" ? { scale: 0.95 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={status !== "idle"}
      className={cn(
        "group relative flex items-center justify-center gap-3 overflow-hidden rounded-full transition-all duration-500",
        statusStyles,
        className
      )}
      style={style}
    >
      {status === "idle" && (
        children || (
          <>
            <Download className="h-5 w-5" strokeWidth={2.5} />
            <span className="text-sm font-extrabold tracking-[0.2em] uppercase">Download for Windows</span>
          </>
        )
      )}
      {status === "connecting" && (
        <>
          <Loader2 className="h-5 w-5 animate-spin relative z-10" strokeWidth={2.5} />
          <span className="relative z-10 text-sm font-extrabold tracking-[0.2em] uppercase">Connecting...</span>
        </>
      )}
      {status === "downloading" && (
        <>
          <Download className="h-5 w-5 animate-bounce relative z-10" strokeWidth={2.5} />
          <span className="relative z-10 text-sm font-extrabold tracking-[0.2em] uppercase">Starting Download...</span>
          {/* Animated loading progress bar background */}
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, ease: "linear" }}
            className="absolute left-0 top-0 bottom-0 bg-cyan-400 z-0"
          />
        </>
      )}
      {status === "done" && (
        <>
          <CheckCircle2 className="h-5 w-5 relative z-10" strokeWidth={2.5} />
          <span className="relative z-10 text-sm font-extrabold tracking-[0.2em] uppercase">Download Started!</span>
        </>
      )}
    </motion.button>
  );
}
