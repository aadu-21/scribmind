"use client";

import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import PriorityBadge from "@/components/shared/PriorityBadge";
import { formatDueDate, isOverdue } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { classNames } from "@/lib/utils";

export default function TaskRow({ task }: { task: Task }) {
  const categories = useAppStore((s) => s.categories);
  const openTask = useUIStore((s) => s.openTask);
  const category = categories.find((c) => c.id === task.categoryId);
  const overdue = isOverdue(task);

  return (
    <button
      onClick={() => openTask(task.id)}
      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-paper"
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: category?.color ?? "#999" }}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{task.title}</span>
      {task.dueDate && (
        <span
          className={classNames(
            "shrink-0 font-mono text-xs",
            overdue ? "font-semibold text-urgent" : "text-ink-faint"
          )}
        >
          {formatDueDate(task.dueDate)}
        </span>
      )}
      <PriorityBadge priority={task.priority} />
    </button>
  );
}
