import type { ReactNode } from "react";

export default function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-8 py-14 text-center">
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
