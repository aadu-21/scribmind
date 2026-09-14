"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import TaskListItem from "@/components/dashboard/TaskListItem";
import EmptyState from "@/components/shared/EmptyState";
import { PRIORITY_ORDER } from "@/lib/types";
import type { Priority } from "@/lib/types";
import { classNames } from "@/lib/utils";

type SortMode = "priority" | "due";

export default function TasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const categories = useAppStore((s) => s.categories);
  const createTask = useAppStore((s) => s.createTask);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [hideDone, setHideDone] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("due");

  const filtered = useMemo(() => {
    let list = tasks.filter((t) => {
      if (hideDone && t.status === "done") return false;
      if (categoryFilter !== "all" && t.categoryId !== categoryFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortMode === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    });
    return list;
  }, [tasks, categoryFilter, priorityFilter, hideDone, sortMode]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 sm:px-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">My Tasks</h1>
          <p className="mt-1 text-sm text-ink-soft">Every task, across every category, in one list.</p>
        </div>
        <button
          onClick={() => createTask({})}
          className="shrink-0 rounded-lg bg-structured px-3.5 py-2 text-xs font-semibold text-white hover:brightness-110"
        >
          + Add Task
        </button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="select-field w-auto"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
          className="select-field w-auto"
        >
          <option value="all">All priorities</option>
          {(["urgent", "high", "medium", "low"] as Priority[]).map((p) => (
            <option key={p} value={p}>
              {p[0].toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded-lg border border-line">
          {(["due", "priority"] as SortMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setSortMode(m)}
              className={classNames(
                "px-2.5 py-1.5 text-xs font-medium",
                sortMode === m ? "bg-structured-soft text-structured" : "bg-paper-raised text-ink-soft"
              )}
            >
              Sort by {m === "due" ? "due date" : "priority"}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-soft">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="accent-structured" />
          Hide completed
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing here yet." hint="Add a task or adjust your filters." />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((t) => (
            <TaskListItem key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}
