"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({
  children,
  onClose,
  label,
  className = "",
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-inner">
        <button className="icon-button dialog-close" aria-label="Close dialog" onClick={onClose}>
          <X size={19} />
        </button>
        {children}
      </div>
    </dialog>
  );
}
