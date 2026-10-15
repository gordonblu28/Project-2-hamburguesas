"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  side?: "right" | "bottom";
  className?: string;
  children: ReactNode;
}

/**
 * Accessible modal built on native <dialog>.showModal(): focus is trapped,
 * the page behind is inert, Escape closes, and focus returns to the opener.
 */
export function Sheet({ open, onClose, label, side = "right", className = "", children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement;
      d.showModal();
    } else if (!open && d.open) {
      d.close();
      if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus();
    }
  }, [open]);

  const position =
    side === "right"
      ? "sheet-right ml-auto mr-0 h-dvh max-h-dvh w-full max-w-[30rem]"
      : "sheet-bottom m-auto mb-0 w-full max-w-3xl max-h-[92dvh] rounded-t-3xl sm:mb-auto sm:rounded-3xl sm:max-h-[88dvh]";

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`sheet ${position} bg-ivory p-0 text-ink shadow-2xl backdrop:backdrop-blur-[2px] ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}

export function SheetClose({ onClose, label = "Close" }: { onClose: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-paper transition hover:bg-ink hover:text-ivory"
      aria-label={label}
    >
      <X className="size-5" aria-hidden="true" />
    </button>
  );
}
