"use client";

import Link from "next/link";
import {
  Kanban,
  StickyNote,
  PenLine,
  CalendarDays,
  MonitorSmartphone,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

const FEATURES = [
  {
    icon: Kanban,
    title: "A Kanban that actually works",
    body: "Backlog to Done, drag and drop, with WIP limits that warn you before you overload yourself instead of silently blocking you.",
  },
  {
    icon: StickyNote,
    title: "Sticky notes, freely arranged",
    body: "Drag them anywhere. Color them. Pin the ones that matter. Positions and formatting are saved, always.",
  },
  {
    icon: PenLine,
    title: "Type it, or handwrite it",
    body: "Real rich text — bold, checkboxes, lists — living in the same note as actual handwriting, with a pen and eraser.",
  },
  {
    icon: MonitorSmartphone,
    title: "Pin a note to your desktop",
    body: "Keep one note floating above everything else while you work, even outside the browser.",
  },
  {
    icon: CalendarDays,
    title: "Deadlines you can actually see",
    body: "A calendar view, a dashboard that surfaces what's due today, and overdue work that never quietly disappears.",
  },
];

export default function LandingPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="dot-grid min-h-dvh" style={{ backgroundColor: "var(--paper)" }}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-end gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-structured font-display text-sm font-bold text-white">
            S
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-semibold tracking-tight text-ink">
              Scribmind
            </span>
            <span className="font-hand text-xs leading-none text-capture">don&rsquo;t forget.</span>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-structured px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Go to your dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-semibold text-ink-soft hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-structured px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Sign up free
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10 text-center sm:px-10 sm:pt-16">
        <h1 className="font-display text-4xl font-semibold leading-[1.1] text-ink sm:text-6xl">
          Everything you&rsquo;d forget,
          <br />
          <span className="font-hand font-normal text-capture">in one place.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base text-ink-soft sm:text-lg">
          Assignments, deadlines, and the sticky notes you scrawl at 1am — a Kanban board and a
          real handwriting-friendly notebook, built for how students actually work.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-structured px-6 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              Continue to your dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="flex items-center gap-2 rounded-xl bg-structured px-6 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110"
              >
                Sign up free <ArrowRight size={15} />
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-line bg-paper-raised px-6 py-3 text-sm font-semibold text-ink hover:bg-paper"
              >
                Or just start scribbling — no account needed
              </Link>
            </>
          )}
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Works fully offline in your browser. Sign up only if you want it to follow you to
          another device.
        </p>
      </main>

      <section className="mx-auto max-w-5xl px-6 pb-28 sm:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-line bg-paper-raised p-5 text-left shadow-sm"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-structured-soft text-structured">
                <Icon size={18} />
              </div>
              <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line px-6 py-8 text-center text-xs text-ink-faint sm:px-10">
        Scribmind — write it down. We&rsquo;ll remember.
      </footer>
    </div>
  );
}
