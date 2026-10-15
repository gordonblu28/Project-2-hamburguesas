"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect } from "react";
import { useUi } from "@/lib/cart/ui";

export function Toast() {
  const toast = useUi((s) => s.toast);
  const dismiss = useUi((s) => s.dismissToast);
  const openCart = useUi((s) => s.openCart);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, 3200);
    return () => clearTimeout(t);
  }, [toast, dismiss]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4 md:bottom-8">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2 pl-3 pr-2 text-sm text-ivory shadow-xl"
          >
            <span className="grid size-7 place-items-center rounded-full bg-mustard text-ink">
              <Check className="size-4" aria-hidden="true" />
            </span>
            <span className="font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => {
                dismiss();
                openCart();
              }}
              className="ml-2 rounded-full bg-ivory px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink"
            >
              View cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
