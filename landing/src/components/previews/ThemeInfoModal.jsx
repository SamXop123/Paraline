import { useEffect, useRef } from "react";
import PreviewStage from "./PreviewStage";

export default function ThemeInfoModal({ theme, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => { modalRef.current?.focus(); }, []);

  if (!theme) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${theme.name} details`}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
        onClick={onClose}
        style={{ animation: "modalIn 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <style>{`
          @keyframes modalIn {
            from { transform: scale(0.95) translateY(8px); opacity: 0; }
            to   { transform: scale(1)    translateY(0);   opacity: 1; }
          }
        `}</style>

        <div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0c14]/96 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex flex-col lg:flex-row">

            {/* Left — preview */}
            <div className="lg:w-[45%] lg:flex-none p-6 border-b border-white/8 lg:border-b-0 lg:border-r">
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/60 mb-3">Preview</p>
              <PreviewStage theme={theme} />

              {/* Specs strip */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                {[
                  { label: "Style",       value: theme.style },
                  { label: "Reactivity",  value: theme.reactivity },
                  { label: "Intensity",   value: theme.intensity },
                  { label: "Performance", value: theme.performance },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-white/[0.04] border border-white/8 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-white/30">{label}</p>
                    <p className="text-white/80 text-xs font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — details */}
            <div className="flex-1 p-6 flex flex-col gap-6">

              {/* Header */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/60">{theme.tag}</p>
                <h2 className="mt-1 text-white font-semibold text-2xl leading-tight">{theme.name}</h2>
                <p className="mt-3 text-white/60 text-sm leading-relaxed">{theme.detailedDescription}</p>
              </div>

              {/* Ideal for */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">Ideal For</p>
                <div className="flex flex-wrap gap-2">
                  {theme.idealFor?.map((use) => (
                    <span
                      key={use}
                      className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300/80 text-xs"
                    >
                      {use}
                    </span>
                  ))}
                </div>
              </div>

              {/* Customization controls */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">Customization Controls</p>
                <div className="flex flex-wrap gap-2">
                  {theme.customizationControls?.map((ctrl) => (
                    <span
                      key={ctrl}
                      className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs"
                    >
                      {ctrl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended for */}
              <div className="mt-auto pt-4 border-t border-white/8">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-1">Recommended For</p>
                <p className="text-white/70 text-sm">{theme.recommendedFor}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
