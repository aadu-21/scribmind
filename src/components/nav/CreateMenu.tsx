"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ListTodo, StickyNote as StickyNoteIcon, PenLine } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import { useOnClickOutside } from "@/lib/useOnClickOutside";

export default function CreateMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const createTask = useAppStore((s) => s.createTask);
  const createNote = useAppStore((s) => s.createNote);
  const openTask = useUIStore((s) => s.openTask);

  useOnClickOutside(ref, () => setOpen(false));

  const items = [
    {
      label: "New Task",
      icon: ListTodo,
      action: () => {
        const task = createTask({});
        openTask(task.id);
      },
    },
    {
      label: "New Sticky Note",
      icon: StickyNoteIcon,
      action: () => {
        createNote();
        router.push("/notes");
      },
    },
    {
      label: "New Handwritten Note",
      icon: PenLine,
      action: () => {
        createNote({ drawHeight: 160 });
        router.push("/notes");
      },
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-structured px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:brightness-95"
      >
        <Plus size={16} strokeWidth={2.5} />
        Create
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-paper-raised py-1 shadow-lg">
          {items.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              onClick={() => {
                action();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-structured-soft"
            >
              <Icon size={16} className="text-structured" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
