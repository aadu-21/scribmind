"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { KanbanColumn, Task } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import TaskCard from "./TaskCard";
import { classNames } from "@/lib/utils";

export default function Column({ column, tasks }: { column: KanbanColumn; tasks: Task[] }) {
  const wipLimitsEnabled = useAppStore((s) => s.settings.wipLimitsEnabled);
  const updateColumn = useAppStore((s) => s.updateColumn);
  const createTask = useAppStore((s) => s.createTask);
  const openTask = useUIStore((s) => s.openTask);
  const [editingLimit, setEditingLimit] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: "column" } });

  const atLimit =
    wipLimitsEnabled && column.wipLimit != null && tasks.length >= column.wipLimit;

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-line bg-paper-raised/60">
      <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3.5">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-semibold text-ink">{column.name}</h3>
          <span
            className={classNames(
              "rounded-full px-1.5 py-0.5 font-mono text-[11px]",
              atLimit ? "bg-urgent-soft text-urgent" : "bg-paper text-ink-faint"
            )}
          >
            {tasks.length}
            {wipLimitsEnabled && column.wipLimit != null ? `/${column.wipLimit}` : ""}
          </span>
        </div>
        {wipLimitsEnabled &&
          (editingLimit ? (
            <input
              type="number"
              min={0}
              autoFocus
              defaultValue={column.wipLimit ?? ""}
              placeholder="off"
              onBlur={(e) => {
                const v = e.target.value.trim();
                updateColumn(column.id, { wipLimit: v === "" ? null : Math.max(0, Number(v)) });
                setEditingLimit(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="w-12 rounded border border-line bg-paper px-1 py-0.5 text-right font-mono text-[11px]"
            />
          ) : (
            <button
              onClick={() => setEditingLimit(true)}
              className="font-mono text-[11px] text-ink-faint hover:text-structured"
              title="Set WIP limit"
            >
              {column.wipLimit != null ? `limit ${column.wipLimit}` : "no limit"}
            </button>
          ))}
      </div>

      {atLimit && (
        <p className="mx-3.5 mb-2 rounded-lg bg-urgent-soft px-2.5 py-1.5 text-[11px] leading-snug text-urgent">
          At its work-in-progress limit. Finish something here before starting more.
        </p>
      )}

      <div
        ref={setNodeRef}
        className={classNames(
          "flex min-h-[120px] flex-1 flex-col gap-2 px-2.5 pb-2.5 transition",
          isOver && "bg-structured-soft/50"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        <button
          onClick={() => openTask(createTask({ status: column.id }).id)}
          className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-line py-2 text-xs font-medium text-ink-faint hover:border-structured hover:text-structured"
        >
          <Plus size={13} /> Add task
        </button>
      </div>
    </div>
  );
}
