"use client";

import { create } from "zustand";

interface UiState {
  cartOpen: boolean;
  customizer: { productId: string; editKey?: string } | null;
  toast: { id: number; message: string } | null;
  openCart: () => void;
  closeCart: () => void;
  openCustomizer: (productId: string, editKey?: string) => void;
  closeCustomizer: () => void;
  notify: (message: string) => void;
  dismissToast: () => void;
}

export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  customizer: null,
  toast: null,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  openCustomizer: (productId, editKey) => set({ customizer: { productId, editKey } }),
  closeCustomizer: () => set({ customizer: null }),
  notify: (message) => set({ toast: { id: Date.now(), message } }),
  dismissToast: () => set({ toast: null }),
}));
