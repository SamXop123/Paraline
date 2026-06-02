import { useState } from "react";
import ThemeCard from "../previews/ThemeCard";
import ThemeCompareDrawer from "../previews/ThemeCompareDrawer";
import ThemeInfoModal from "../previews/ThemeInfoModal";
import SectionIntro from "../SectionIntro";
import SectionReveal from "../SectionReveal";
import { themes } from "../../data/themes";

const MAX_COMPARE = 3;

export default function ThemeShowcaseSection() {
  const [compareSet, setCompareSet] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(null);

  const handleCompareToggle = (theme) => {
    setCompareSet((prev) => {
      const alreadyIn = prev.some((t) => t.key === theme.key);

      if (alreadyIn) {
        return prev.filter((t) => t.key !== theme.key);
      }

      if (prev.length >= MAX_COMPARE) {
        return prev;
      }

      return [...prev, theme];
    });
  };

  const handleRemoveFromCompare = (theme) => {
    setCompareSet((prev) => prev.filter((t) => t.key !== theme.key));
  };

  const handleClearCompare = () => {
    setCompareSet([]);
    setDrawerOpen(false);
  };

  const compareCount = compareSet.length;
  const canOpenDrawer = compareCount >= 2;

  return (
    <section id="themes" className="px-6 py-28 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionReveal>
          <SectionIntro
            eyebrow="Theme Showcase"
            title="Eleven themes. One edge."
            body="Every mode currently in Paraline, translated into lightweight interactive previews."
            align="center"
          />
        </SectionReveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => {
            const isSelected = compareSet.some(
              (t) => t.key === theme.key
            );
            const isDisabled =
              !isSelected && compareCount >= MAX_COMPARE;

            return (
              <ThemeCard
                key={theme.key}
                theme={theme}
                compareSelected={isSelected}
                onCompareToggle={handleCompareToggle}
                compareDisabled={isDisabled}
                onLearnMore={setActiveTheme}
              />
            );
          })}
        </div>

        {/* Floating compare bar */}
        {compareCount > 0 && (
          <div
            className="fixed bottom-6 left-1/2 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/15 bg-[#0d0e14]/90 backdrop-blur-xl shadow-[0_4px_32px_rgba(0,0,0,0.55)] -translate-x-1/2"
            style={{ animation: "fadeUp 0.25s ease both" }}
          >
            <style>{`
              @keyframes fadeUp {
                from {
                  transform: translate(-50%, 12px);
                  opacity: 0;
                }
                to {
                  transform: translate(-50%, 0);
                  opacity: 1;
                }
              }
            `}</style>

            <div className="flex items-center gap-1.5">
              {compareSet.map((t) => (
                <span
                  key={t.key}
                  className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-medium flex items-center gap-1.5"
                >
                  {t.name}

                  <button
                    onClick={() => handleRemoveFromCompare(t)}
                    className="text-white/40 hover:text-white/80 transition-colors"
                    aria-label={`Remove ${t.name}`}
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 9 9"
                      fill="none"
                    >
                      <path
                        d="M1.5 1.5l6 6M7.5 1.5l-6 6"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </span>
              ))}

              {Array.from({
                length: MAX_COMPARE - compareCount,
              }).map((_, i) => (
                <span
                  key={`slot-${i}`}
                  className="w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/20 text-[10px]"
                >
                  +
                </span>
              ))}
            </div>

            <div className="w-px h-5 bg-white/10" />

            <button
              onClick={() => setDrawerOpen(true)}
              disabled={!canOpenDrawer}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                canOpenDrawer
                  ? "bg-violet-600 hover:bg-violet-500 text-white"
                  : "bg-white/8 text-white/30 cursor-not-allowed"
              }`}
            >
              {canOpenDrawer
                ? "Compare"
                : `Select ${2 - compareCount} more`}
            </button>

            <button
              onClick={handleClearCompare}
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Compare drawer */}
        {drawerOpen && (
          <ThemeCompareDrawer
            themes={compareSet}
            onClose={() => setDrawerOpen(false)}
            onRemove={(theme) => {
              handleRemoveFromCompare(theme);

              if (compareCount - 1 < 2) {
                setDrawerOpen(false);
              }
            }}
          />
        )}

        {/* Info modal */}
        {activeTheme && (
          <ThemeInfoModal
            theme={activeTheme}
            onClose={() => setActiveTheme(null)}
          />
        )}
      </div>
    </section>
  );
}