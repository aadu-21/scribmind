"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, StickyNote as StickyNoteIcon, Kanban as KanbanIcon, CalendarDays } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import StatsGrid from "@/components/dashboard/StatsGrid";
import TaskRow from "@/components/dashboard/TaskRow";
import EmptyState from "@/components/shared/EmptyState";
import { isDueToday, isDueThisWeek, isOverdue, plainTextFromDoc } from "@/lib/utils";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const tasks = useAppStore((s) => s.tasks);
  const notes = useAppStore((s) => s.notes);
  const createTask = useAppStore((s) => s.createTask);
  const createNote = useAppStore((s) => s.createNote);
  const openTask = useUIStore((s) => s.openTask);

  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
    []
  );

  const dueToday = tasks.filter((t) => t.status !== "done" && isDueToday(t));
  const overdue = tasks.filter((t) => t.status !== "done" && isOverdue(t));
  const upcoming = tasks
    .filter((t) => t.status !== "done" && t.dueDate && !isDueToday(t) && isDueThisWeek(t))
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const recentlyCompleted = tasks
    .filter((t) => t.status === "done" && t.completedAt)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1))
    .slice(0, 5);
  const pinnedNotes = notes.filter((n) => n.pinned).slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10">
      <header className="mb-7">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          {greeting()}!
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {today} — don&rsquo;t forget what&rsquo;s on here.
        </p>
      </header>

      <StatsGrid />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => openTask(createTask({}).id)}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-xs font-semibold text-ink hover:bg-structured-soft"
        >
          <Plus size={13} /> Add Task
        </button>
        <Link
          href="/notes"
          onClick={() => createNote()}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-xs font-semibold text-ink hover:bg-capture-soft"
        >
          <StickyNoteIcon size={13} /> Add Sticky Note
        </Link>
        <Link
          href="/kanban"
          className="flex items-center gap-1.5 rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
        >
          <KanbanIcon size={13} /> Open Kanban
        </Link>
        <Link
          href="/calendar"
          className="flex items-center gap-1.5 rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
        >
          <CalendarDays size={13} /> View Today
        </Link>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Section title="Due today" count={dueToday.length}>
          {dueToday.length === 0 ? (
            <p className="px-2.5 py-3 text-sm text-ink-faint">Nothing due today. Breathe easy.</p>
          ) : (
            dueToday.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </Section>

        <Section title="Overdue" count={overdue.length} accent={overdue.length ? "urgent" : undefined}>
          {overdue.length === 0 ? (
            <p className="px-2.5 py-3 text-sm text-ink-faint">Nothing overdue — nice work.</p>
          ) : (
            overdue.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </Section>

        <Section title="Upcoming deadlines" count={upcoming.length}>
          {upcoming.length === 0 ? (
            <p className="px-2.5 py-3 text-sm text-ink-faint">Nothing else due this week yet.</p>
          ) : (
            upcoming.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </Section>

        <Section title="In progress" count={inProgress.length}>
          {inProgress.length === 0 ? (
            <p className="px-2.5 py-3 text-sm text-ink-faint">Nothing in progress right now.</p>
          ) : (
            inProgress.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </Section>

        <Section title="Recently completed" count={recentlyCompleted.length}>
          {recentlyCompleted.length === 0 ? (
            <p className="px-2.5 py-3 text-sm text-ink-faint">Finish something and it&rsquo;ll show up here.</p>
          ) : (
            recentlyCompleted.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </Section>

        <Section title="Pinned sticky notes" count={pinnedNotes.length}>
          {pinnedNotes.length === 0 ? (
            <EmptyState
              title="No pinned notes"
              hint="Pin a sticky note to keep it visible here."
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 px-1">
              {pinnedNotes.map((n) => (
                <Link
                  key={n.id}
                  href="/notes"
                  className="rounded-lg px-3 py-2.5 text-xs font-hand text-[15px] leading-snug text-ink/80 shadow-sm"
                  style={{ backgroundColor: n.color }}
                >
                  {plainTextFromDoc(n.richContent).slice(0, 70) || "Empty note"}
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent?: "urgent";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-3">
      <div className="mb-1 flex items-center justify-between px-1.5">
        <h2 className="font-display text-sm font-semibold text-ink">{title}</h2>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[11px]"
          style={{
            backgroundColor: accent === "urgent" ? "var(--urgent-soft)" : "var(--paper)",
            color: accent === "urgent" ? "var(--urgent)" : "var(--ink-faint)",
          }}
        >
          {count}
        </span>
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}
