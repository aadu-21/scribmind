"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Paperclip, StickyNote as StickyNoteIcon, AlertTriangle, GripVertical } from "lucide-react";
import type { Task } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import CategoryPill from "@/components/shared/CategoryPill";
import PriorityBadge from "@/components/shared/PriorityBadge";
import { checklistProgress, classNames, formatDueDate, isOverdue } from "@/lib/utils";

export default function TaskCard({ task }: { task: Task }) {
  const categories = useAppStore((s) => s.categories);
  const tags = useAppStore((s) => s.tags);
  const openTask = useUIStore((s) => s.openTask);
  const category = categories.find((c) => c.id === task.categoryId);
  const progress = checklistProgress(task);
  const overdue = isOverdue(task);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => openTask(task.id)}
      className={classNames(
        "group rounded-xl border bg-paper-raised p-3 shadow-sm transition hover:shadow-md",
        overdue ? "border-urgent/40" : "border-line"
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 cursor-grab touch-none text-ink-faint opacity-0 group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag task"
        >
          <GripVertical size={14} />
        </button>
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">{task.title}</p>
        {overdue && <AlertTriangle size={14} className="mt-0.5 shrink-0 text-urgent" />}
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 pl-[22px] text-xs text-ink-soft">{task.description}</p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-[22px]">
        <CategoryPill category={category} />
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span
            className={classNames(
              "font-mono text-[11px]",
              overdue ? "font-semibold text-urgent" : "text-ink-faint"
            )}
          >
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>

      {task.tagIds.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1 pl-[22px]">
          {task.tagIds.slice(0, 3).map((id) => {
            const tag = tags.find((t) => t.id === id);
            if (!tag) return null;
            return (
              <span key={id} className="text-[11px] text-ink-faint">
                #{tag.name}
              </span>
            );
          })}
        </div>
      )}

      {(progress.total > 0 || task.attachments.length > 0 || task.linkedNoteIds.length > 0) && (
        <div className="mt-2 flex items-center gap-3 pl-[22px] text-[11px] text-ink-faint">
          {progress.total > 0 && (
            <span className="font-mono">
              {progress.done}/{progress.total}
            </span>
          )}
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-0.5">
              <Paperclip size={11} /> {task.attachments.length}
            </span>
          )}
          {task.linkedNoteIds.length > 0 && (
            <span className="flex items-center gap-0.5">
              <StickyNoteIcon size={11} /> {task.linkedNoteIds.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
