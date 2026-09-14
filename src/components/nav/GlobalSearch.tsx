"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ListTodo, StickyNote as StickyNoteIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { plainTextFromDoc } from "@/lib/utils";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const notes = useAppStore((s) => s.notes);
  const tags = useAppStore((s) => s.tags);
  const openTask = useUIStore((s) => s.openTask);
  const bringNoteToFront = useAppStore((s) => s.bringNoteToFront);

  useOnClickOutside(ref, () => setFocused(false));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { tasks: [], notes: [] };

    const matchedTasks = tasks
      .filter((t) => {
        const tagNames = t.tagIds
          .map((id) => tags.find((tg) => tg.id === id)?.name ?? "")
          .join(" ");
        const checklistText = t.checklist.map((c) => c.text).join(" ");
        return `${t.title} ${t.description} ${tagNames} ${checklistText}`
          .toLowerCase()
          .includes(q);
      })
      .slice(0, 5);

    const matchedNotes = notes
      .filter((n) =>
        `${n.title} ${plainTextFromDoc(n.richContent)}`.toLowerCase().includes(q)
      )
      .slice(0, 5);

    return { tasks: matchedTasks, notes: matchedNotes };
  }, [query, tasks, notes, tags]);

  const hasResults = results.tasks.length > 0 || results.notes.length > 0;

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
        <Search size={14} className="text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search everything"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </div>

      {focused && query.trim() && (
        <div className="absolute left-0 top-full z-30 mt-1.5 max-h-80 w-72 overflow-auto rounded-xl border border-line bg-paper-raised py-1 shadow-lg">
          {!hasResults && (
            <p className="px-3.5 py-3 text-sm text-ink-faint">No matches for &ldquo;{query}&rdquo;</p>
          )}
          {results.tasks.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                openTask(t.id);
                setFocused(false);
                setQuery("");
              }}
              className="flex w-full items-start gap-2 px-3.5 py-2 text-left text-sm hover:bg-structured-soft"
            >
              <ListTodo size={14} className="mt-0.5 shrink-0 text-structured" />
              <span className="truncate">{t.title}</span>
            </button>
          ))}
          {results.notes.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                bringNoteToFront(n.id);
                router.push("/notes");
                setFocused(false);
                setQuery("");
              }}
              className="flex w-full items-start gap-2 px-3.5 py-2 text-left text-sm hover:bg-capture-soft"
            >
              <StickyNoteIcon size={14} className="mt-0.5 shrink-0 text-capture" />
              <span className="truncate">
                {plainTextFromDoc(n.richContent).slice(0, 60) || "Empty note"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
