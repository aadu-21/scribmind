"use client";

import { useAppStore } from "@/lib/store";
import StickyNote from "./StickyNote";
import EmptyState from "@/components/shared/EmptyState";

export default function NotesWorkspace() {
  const notes = useAppStore((s) => s.notes);
  const createNote = useAppStore((s) => s.createNote);

  return (
    <div className="relative h-[calc(100dvh-64px)] min-h-[700px] w-full overflow-auto rounded-2xl border border-line bg-paper-raised/50">
      <div className="dot-grid relative min-h-[900px] min-w-[1100px]">
        {notes.length === 0 && (
          <div className="pt-16">
            <EmptyState
              title="Your workspace is clear ✨"
              hint="Create a sticky note for something you don't want to forget."
              action={
                <button
                  onClick={() => createNote()}
                  className="rounded-lg bg-structured px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                >
                  Create a sticky note
                </button>
              }
            />
          </div>
        )}
        {notes.map((note) => (
          <StickyNote key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}
