"use client";

import { useUIStore } from "@/lib/uiStore";
import { classNames } from "@/lib/utils";

export default function ToastStack() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={classNames(
            "pointer-events-auto rounded-full px-4 py-2 text-sm font-medium shadow-lg",
            t.tone === "warning" && "bg-high text-white",
            t.tone === "success" && "bg-structured text-white",
            t.tone === "info" && "bg-ink text-white"
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
