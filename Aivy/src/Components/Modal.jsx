// src/Components/Modal.jsx
import React, { useEffect, useRef } from "react";

const Modal = ({ open, onClose, title, children }) => {
  const panelRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    // Close only if clicking backdrop, not the panel
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      onClose?.();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
      onMouseDown={handleBackdropClick}
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/40 backdrop-blur-sm
      "
    >
      <div
        ref={panelRef}
        className="
          w-full max-w-xl
          rounded-2xl shadow-xl
          bg-[color:var(--color-panel)]
          text-[color:var(--color-text)]
          border border-[color:var(--color-border)]
          ring-1 ring-[color:var(--color-border)]/50
          px-6 pt-4 pb-6
          relative
          animate-[modalIn_.14s_ease-out]
        "
      >
        {/* Header */}
        <div
          className="
            flex items-center justify-between
            border-b border-[color:var(--color-border)]
            pb-3 mb-4
          "
        >
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg px-3 py-1.5 text-sm
              bg-[color:var(--color-panel)]
              text-[color:var(--color-text)]
              border border-[color:var(--color-border)]
              hover:bg-[color:var(--color-accent-weak)]
              hover:text-[color:var(--color-on-accent)]
              transition
              focus:outline-none focus:ring-2 focus:ring-[--color-accent]
            "
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>

      {/* tiny keyframe for a subtle pop-in */}
      <style>{`
        @keyframes modalIn {
          0% { transform: translateY(4px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Modal;