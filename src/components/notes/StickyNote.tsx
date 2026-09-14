"use client";

import { useState } from "react";
import { Rnd } from "react-rnd";
import {
  Pin,
  PinOff,
  MonitorSmartphone,
  ListTodo,
  Trash2,
  PenLine,
  GripHorizontal,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import type { StickyNote as StickyNoteType } from "@/lib/types";
import { NOTE_COLORS } from "@/lib/types";
import { extractTaskDraftFromText, plainTextFromDoc, classNames } from "@/lib/utils";
import RichEditor from "./RichEditor";
import HandwritingCanvas from "./HandwritingCanvas";
import FloatingNoteWindow, { isDocumentPipSupported } from "./FloatingNoteWindow";

export default function StickyNote({ note }: { note: StickyNoteType }) {
  const updateNote = useAppStore((s) => s.updateNote);
  const deleteNote = useAppStore((s) => s.deleteNote);
  const bringToFront = useAppStore((s) => s.bringNoteToFront);
  const convertNoteToTask = useAppStore((s) => s.convertNoteToTask);
  const pushToast = useUIStore((s) => s.pushToast);

  const [showColors, setShowColors] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [convertDraft, setConvertDraft] = useState<{ title: string; dueDate: string | null } | null>(null);

  return (
    <>
      <Rnd
        size={{ width: note.width, height: note.height }}
        position={{ x: note.x, y: note.y }}
        style={{ zIndex: note.zIndex }}
        minWidth={200}
        minHeight={160}
        maxWidth={520}
        maxHeight={640}
        bounds="parent"
        dragHandleClassName="note-drag-handle"
        onDragStart={() => bringToFront(note.id)}
        onDragStop={(_e, d) => updateNote(note.id, { x: d.x, y: d.y })}
        onResizeStop={(_e, _dir, ref, _delta, pos) =>
          updateNote(note.id, {
            width: parseInt(ref.style.width, 10),
            height: parseInt(ref.style.height, 10),
            x: pos.x,
            y: pos.y,
          })
        }
        onMouseDown={() => bringToFront(note.id)}
        className="flex flex-col overflow-hidden rounded-xl shadow-md ring-1 ring-black/5"
      >
        <div
          className="flex flex-col"
          style={{ backgroundColor: note.color, height: "100%" }}
        >
          <div className="note-drag-handle flex cursor-grab items-center gap-1 px-2 pt-1.5 pb-1 active:cursor-grabbing">
            <GripHorizontal size={13} className="text-ink/40" />
            <input
              value={note.title}
              onChange={(e) => updateNote(note.id, { title: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="Untitled note"
              className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-ink/80 placeholder:text-ink/40 focus:outline-none"
            />
            {note.linkedTaskId && (
              <span title="Linked to a task">
                <ListTodo size={12} className="text-ink/50" />
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-0.5 px-1.5 pb-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setShowColors((v) => !v)}
                className="h-4 w-4 rounded-full border border-ink/15"
                style={{ backgroundColor: note.color }}
                title="Note color"
              />
              {showColors && (
                <div className="absolute left-0 top-full z-10 mt-1 flex gap-1 rounded-lg border border-ink/10 bg-white p-1.5 shadow-md">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        updateNote(note.id, { color: c });
                        setShowColors(false);
                      }}
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => updateNote(note.id, { pinned: !note.pinned })}
              className={classNames(
                "rounded-md p-1",
                note.pinned ? "text-structured" : "text-ink/50 hover:bg-black/5"
              )}
              title={note.pinned ? "Unpin" : "Pin note"}
            >
              {note.pinned ? <Pin size={13} /> : <PinOff size={13} />}
            </button>

            <button
              onClick={() => {
                if (!isDocumentPipSupported()) {
                  pushToast(
                    "Desktop floating notes need a Chromium browser (Chrome/Edge) on desktop.",
                    "info"
                  );
                  return;
                }
                updateNote(note.id, { pinnedToDesktop: !note.pinnedToDesktop });
              }}
              className={classNames(
                "rounded-md p-1",
                note.pinnedToDesktop ? "text-structured" : "text-ink/50 hover:bg-black/5"
              )}
              title="Pin to desktop"
            >
              <MonitorSmartphone size={13} />
            </button>

            <button
              onClick={() =>
                updateNote(note.id, { drawHeight: note.drawHeight > 0 ? 0 : 130 })
              }
              className={classNames(
                "rounded-md p-1",
                note.drawHeight > 0 ? "text-structured" : "text-ink/50 hover:bg-black/5"
              )}
              title="Handwriting"
            >
              <PenLine size={13} />
            </button>

            <button
              onClick={() =>
                setConvertDraft(
                  extractTaskDraftFromText(note.title || plainTextFromDoc(note.richContent))
                )
              }
              className="rounded-md p-1 text-ink/50 hover:bg-black/5"
              title="Convert to task"
            >
              <ListTodo size={13} />
            </button>

            <div className="ml-auto">
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  {note.linkedTaskId && (
                    <span className="text-[9px] text-ink/60">Linked task stays</span>
                  )}
                  <button
                    onClick={() => deleteNote(note.id, { keepLinkedTask: true })}
                    className="rounded-md bg-urgent px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-[10px] text-ink/50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-md p-1 text-ink/50 hover:bg-urgent-soft hover:text-urgent"
                  title="Delete note"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-white/30">
            <RichEditor
              content={note.richContent}
              onChange={(doc) => updateNote(note.id, { richContent: doc })}
            />
          </div>

          {note.drawHeight > 0 && (
            <div style={{ height: note.drawHeight }} onPointerDown={(e) => e.stopPropagation()}>
              <HandwritingCanvas noteId={note.id} strokes={note.strokes} />
            </div>
          )}
        </div>
      </Rnd>

      {note.pinnedToDesktop && (
        <FloatingNoteWindow
          note={note}
          onClose={() => updateNote(note.id, { pinnedToDesktop: false })}
        />
      )}

      {convertDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4"
          onClick={() => setConvertDraft(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-line bg-paper-raised p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-sm font-semibold text-ink">Convert to task</p>
            <p className="mt-1 text-xs text-ink-soft">Review the extracted details before creating the task.</p>
            <label className="mt-3 block text-xs font-medium text-ink-soft">Title</label>
            <input
              value={convertDraft.title}
              onChange={(e) => setConvertDraft({ ...convertDraft, title: e.target.value })}
              className="select-field mt-1"
            />
            <label className="mt-2 block text-xs font-medium text-ink-soft">Due date</label>
            <input
              type="date"
              value={convertDraft.dueDate ?? ""}
              onChange={(e) => setConvertDraft({ ...convertDraft, dueDate: e.target.value || null })}
              className="select-field mt-1"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConvertDraft(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  convertNoteToTask(note.id, convertDraft);
                  setConvertDraft(null);
                  pushToast("Task created and linked to this note", "success");
                }}
                className="rounded-lg bg-structured px-3 py-1.5 text-xs font-semibold text-white"
              >
                Create task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
