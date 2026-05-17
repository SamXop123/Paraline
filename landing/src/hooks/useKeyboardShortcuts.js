import { useEffect } from "react";

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || target.isContentEditable;
}

export default function useKeyboardShortcuts({
  onToggleSidebar,
  onCloseSidebar,
  onToggleHelp,
  isHelpOpen,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (isHelpOpen) {
          event.preventDefault();
          onToggleHelp(false);
          return;
        }

        onCloseSidebar();
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && event.key.toLowerCase() === "b") {
        event.preventDefault();
        onToggleSidebar();
        return;
      }

      if (modifier && event.key === "/") {
        event.preventDefault();
        onToggleHelp();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHelpOpen, onCloseSidebar, onToggleHelp, onToggleSidebar]);
}
