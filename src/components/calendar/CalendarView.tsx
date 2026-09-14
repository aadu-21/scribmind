"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import PriorityBadge from "@/components/shared/PriorityBadge";
import { classNames, isOverdue } from "@/lib/utils";

export default function CalendarView() {
  const [cursor, setCursor] = useState(new Date());
  const tasks = useAppStore((s) => s.tasks);
  const createTask = useAppStore((s) => s.createTask);
  const openTask = useUIStore((s) => s.openTask);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = t.dueDate;
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [tasks]);

  return (
    <div className="rounded-2xl border border-line bg-paper-raised p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{format(cursor, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-paper"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="rounded-lg px-2 py-1 text-xs font-medium text-ink-soft hover:bg-paper"
          >
            Today
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-paper"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-ink-faint">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);

          return (
            <div
              key={key}
              className={classNames(
                "group flex min-h-[92px] flex-col gap-1 rounded-lg border p-1.5 text-left",
                inMonth ? "border-line bg-paper" : "border-transparent bg-transparent opacity-40",
                isToday(day) && "ring-1 ring-structured"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-ink-faint">{format(day, "d")}</span>
                <button
                  onClick={() => openTask(createTask({ dueDate: key }).id)}
                  className="rounded p-0.5 text-ink-faint opacity-0 hover:bg-structured-soft hover:text-structured group-hover:opacity-100"
                  title="Add task on this day"
                >
                  <Plus size={11} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openTask(t.id)}
                    className={classNames(
                      "truncate rounded px-1 py-0.5 text-left text-[10.5px] font-medium",
                      t.status === "done"
                        ? "bg-line/40 text-ink-faint line-through"
                        : isOverdue(t)
                        ? "bg-urgent-soft text-urgent"
                        : "bg-structured-soft text-structured"
                    )}
                  >
                    {t.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-ink-faint">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <UpcomingList tasks={tasks} />
    </div>
  );
}

function UpcomingList({ tasks }: { tasks: ReturnType<typeof useAppStore.getState>["tasks"] }) {
  const openTask = useUIStore((s) => s.openTask);
  const upcoming = tasks
    .filter((t) => t.dueDate && t.status !== "done")
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
    .slice(0, 8);

  if (upcoming.length === 0) return null;

  return (
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="mb-2 font-display text-sm font-semibold text-ink">Upcoming & overdue</h3>
      <div className="flex flex-col gap-1">
        {upcoming.map((t) => (
          <button
            key={t.id}
            onClick={() => openTask(t.id)}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-paper"
          >
            <span className="truncate text-ink">{t.title}</span>
            <span className="flex items-center gap-2 shrink-0">
              <span
                className={classNames(
                  "font-mono text-xs",
                  isOverdue(t) ? "font-semibold text-urgent" : "text-ink-faint"
                )}
              >
                {format(parseISO(t.dueDate!), "d MMM")}
              </span>
              <PriorityBadge priority={t.priority} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
