import React from "react";

const Modal = ({ open, onClose, children, title }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl">
          <div className="px-4 py-3 border-b dark:border-neutral-800">
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          <div className="p-4">{children}</div>
          <div className="px-4 py-3 border-t dark:border-neutral-800 text-right">
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-md border dark:border-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;