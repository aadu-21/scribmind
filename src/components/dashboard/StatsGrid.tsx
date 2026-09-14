"use client";

import { useAppStore } from "@/lib/store";
import { isDueThisWeek, isDueToday, isOverdue } from "@/lib/utils";

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "urgent" | "high" }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-raised px-4 py-3.5">
      <p
        className="font-display text-2xl font-semibold"
        style={{ color: tone === "urgent" ? "var(--urgent)" : tone === "high" ? "var(--high)" : "var(--ink)" }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-ink-soft">{label}</p>
    </div>
  );
}

export default function StatsGrid() {
  const tasks = useAppStore((s) => s.tasks);
  const columns = useAppStore((s) => s.columns);
  const doneId = columns.find((c) => c.id === "done")?.id ?? "done";

  const active = tasks.filter((t) => t.status !== doneId);
  const completed = tasks.filter((t) => t.status === doneId);
  const overdue = active.filter(isOverdue);
  const dueToday = active.filter(isDueToday);
  const dueThisWeek = active.filter(isDueThisWeek);
  const inProgress = tasks.filter((t) => t.status === "in_progress");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Active tasks" value={active.length} />
      <StatCard label="Completed" value={completed.length} />
      <StatCard label="Overdue" value={overdue.length} tone={overdue.length ? "urgent" : undefined} />
      <StatCard label="Due today" value={dueToday.length} tone={dueToday.length ? "high" : undefined} />
      <StatCard label="Due this week" value={dueThisWeek.length} />
      <StatCard label="In progress" value={inProgress.length} />
    </div>
  );
}
