"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import type { Task } from "@/lib/types";
import CategoryPill from "@/components/shared/CategoryPill";
import PriorityBadge from "@/components/shared/PriorityBadge";
import { checklistProgress, classNames, formatDueDate, isOverdue } from "@/lib/utils";

export default function TaskListItem({ task }: { task: Task }) {
  const categories = useAppStore((s) => s.categories);
  const completeTask = useAppStore((s) => s.completeTask);
  const reopenTask = useAppStore((s) => s.reopenTask);
  const openTask = useUIStore((s) => s.openTask);
  const category = categories.find((c) => c.id === task.categoryId);
  const progress = checklistProgress(task);
  const overdue = isOverdue(task);
  const done = task.status === "done";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-paper-raised px-3.5 py-3 hover:border-structured/40">
      <button
        onClick={() => (done ? reopenTask(task.id) : completeTask(task.id))}
        className={classNames("shrink-0", done ? "text-structured" : "text-ink-faint hover:text-structured")}
      >
        {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>

      <button onClick={() => openTask(task.id)} className="min-w-0 flex-1 text-left">
        <p className={classNames("truncate text-sm font-medium", done ? "text-ink-faint line-through" : "text-ink")}>
          {task.title}
        </p>
        {progress.total > 0 && (
          <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
            {progress.done}/{progress.total} checklist
          </p>
        )}
      </button>

      <CategoryPill category={category} />
      <PriorityBadge priority={task.priority} />
      {task.dueDate && (
        <span className={classNames("font-mono text-xs", overdue ? "font-semibold text-urgent" : "text-ink-faint")}>
          {formatDueDate(task.dueDate)}
        </span>
      )}
    </div>
  );
}
