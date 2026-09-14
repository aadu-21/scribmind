import { create } from "zustand";

interface Toast {
  id: string;
  message: string;
  tone: "info" | "warning" | "success";
}

interface UIState {
  activeTaskId: string | null;
  openTask: (id: string) => void;
  closeTask: () => void;

  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeTaskId: null,
  openTask: (id) => set({ activeTaskId: id }),
  closeTask: () => set({ activeTaskId: null }),

  toasts: [],
  pushToast: (message, tone = "info") =>
    set((s) => {
      const id = Math.random().toString(36).slice(2);
      setTimeout(() => {
        useUIStore.getState().dismissToast(id);
      }, 4200);
      return { toasts: [...s.toasts, { id, message, tone }] };
    }),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
