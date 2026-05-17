const shortcuts = [
  { keys: "Ctrl + B", action: "Toggle navigation sidebar" },
  { keys: "Ctrl + /", action: "Show keyboard shortcuts" },
  { keys: "Esc", action: "Close sidebar or shortcuts panel" },
];

export default function KeyboardShortcutsHelp({ open, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-[60] w-[min(90vw,20rem)] rounded-xl border border-white/10 bg-[#050816]/95 p-4 shadow-2xl backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="keyboard-shortcuts-title" className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
          Keyboard shortcuts
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close keyboard shortcuts"
          className="rounded-md px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          Esc
        </button>
      </div>

      <ul className="space-y-2">
        {shortcuts.map((shortcut) => (
          <li key={shortcut.keys} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-white/55">{shortcut.action}</span>
            <kbd className="rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/80">
              {shortcut.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </div>
  );
}
