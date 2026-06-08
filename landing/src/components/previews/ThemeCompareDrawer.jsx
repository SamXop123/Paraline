import { useEffect, useRef } from "react";

const ROWS = [
  { key: "style",          label: "Animation Style"    },
  { key: "reactivity",     label: "Reactivity"         },
  { key: "intensity",      label: "Visual Intensity"   },
  { key: "performance",    label: "Performance Impact" },
  { key: "recommendedFor", label: "Best For"           },
];

function Badge({ value }) {
  const colour =
    value === "High" || value === "Dynamic" || value === "Bold"
      ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
      : value === "Medium" || value === "Moderate"
      ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
      : value === "Low" || value === "Minimal" || value === "Very Low"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : "bg-white/10 text-white/60 border-white/10";

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${colour}`}>
      {value}
    </span>
  );
}

export default function ThemeCompareDrawer({ themes = [], onClose, onRemove }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => { drawerRef.current?.focus(); }, []);

  if (themes.length === 0) return null;

  const colWidth = themes.length === 2 ? "w-1/2" : "w-1/3";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Theme comparison"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[82vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#0d0e14]/95 backdrop-blur-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.6)] outline-none"
        style={{ animation: "slideUp 0.32s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/8 bg-[#0d0e14]/90 backdrop-blur-xl">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">Comparing</p>
            <h2 className="text-white font-semibold text-base">{themes.map((t) => t.name).join(" vs ")}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-8 pt-2 overflow-x-auto">
          <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                <th className="w-36 py-4 pr-4" />
                {themes.map((theme) => (
                  <th key={theme.key} className={`${colWidth} pb-2 pt-4 px-3 text-center`}>
                    <div className="relative rounded-xl border border-white/10 bg-white/5 p-3 mx-1 flex flex-col items-center gap-2">
                      <button onClick={() => onRemove?.(theme)} className="absolute top-2 right-2 p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors" aria-label={`Remove ${theme.name}`}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                      <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/30">
                        <img src={theme.preview} alt={`${theme.name} preview`} className="w-full h-full object-cover opacity-90" />
                      </div>
                      <p className="text-white font-semibold text-sm">{theme.name}</p>
                      <p className="text-white/40 text-[11px] -mt-1">{theme.tag}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.key} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                  <td className="py-3 pr-4 pl-1 text-white/40 text-xs font-medium uppercase tracking-wider whitespace-nowrap">{row.label}</td>
                  {themes.map((theme) => (
                    <td key={theme.key} className="py-3 px-3 text-center align-middle">
                      {row.key === "style" || row.key === "recommendedFor"
                        ? <span className="text-white/80 text-xs">{theme[row.key] ?? "—"}</span>
                        : <Badge value={theme[row.key] ?? "—"} />
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
