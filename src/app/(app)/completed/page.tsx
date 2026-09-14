"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import TaskListItem from "@/components/dashboard/TaskListItem";
import EmptyState from "@/components/shared/EmptyState";

export default function CompletedPage() {
  const tasks = useAppStore((s) => s.tasks);

  const completed = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "done")
        .sort((a, b) => ((a.completedAt ?? "") < (b.completedAt ?? "") ? 1 : -1)),
    [tasks]
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Completed</h1>
        <p className="mt-1 text-sm text-ink-soft">Finished work stays here — nothing is deleted automatically.</p>
      </header>

      {completed.length === 0 ? (
        <EmptyState
          title="No completed tasks yet."
          hint="Finish something and it'll appear here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {completed.map((t) => (
            <TaskListItem key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}
