"use client";

import { useState } from "react";
import { X, Trash2, Plus, StickyNote as StickyNoteIcon, RotateCcw, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import type { Priority, RecurrenceRule } from "@/lib/types";
import { checklistProgress, classNames } from "@/lib/utils";

export default function TaskDetailModal() {
  const activeTaskId = useUIStore((s) => s.activeTaskId);
  const closeTask = useUIStore((s) => s.closeTask);
  const pushToast = useUIStore((s) => s.pushToast);

  const task = useAppStore((s) => s.tasks.find((t) => t.id === activeTaskId));
  const columns = useAppStore((s) => s.columns);
  const categories = useAppStore((s) => s.categories);
  const tags = useAppStore((s) => s.tags);
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const addChecklistItem = useAppStore((s) => s.addChecklistItem);
  const toggleChecklistItem = useAppStore((s) => s.toggleChecklistItem);
  const completeTask = useAppStore((s) => s.completeTask);
  const reopenTask = useAppStore((s) => s.reopenTask);
  const pinTaskAsNote = useAppStore((s) => s.pinTaskAsNote);
  const addTag = useAppStore((s) => s.addTag);
  const notes = useAppStore((s) => s.notes);

  const [newChecklistText, setNewChecklistText] = useState("");
  const [newTagText, setNewTagText] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!task) return null;

  const progress = checklistProgress(task);
  const isDone = columns.find((c) => c.id === task.status)?.id === "done";
  const linkedNotes = notes.filter((n) => task.linkedNoteIds.includes(n.id));

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-10 backdrop-blur-[2px]"
      onClick={closeTask}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-line bg-paper-raised shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <input
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            className="w-full font-display text-lg font-semibold text-ink focus:outline-none"
            placeholder="Task title"
          />
          <button
            onClick={closeTask}
            className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-4">
          <textarea
            value={task.description}
            onChange={(e) => updateTask(task.id, { description: e.target.value })}
            placeholder="Add a short description…"
            rows={2}
            className="w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={task.status}
                onChange={(e) => updateTask(task.id, { status: e.target.value })}
                className="select-field"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                value={task.categoryId}
                onChange={(e) => updateTask(task.id, { categoryId: e.target.value })}
                className="select-field"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={task.priority}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}
                className="select-field"
              >
                {(["urgent", "high", "medium", "low"] as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Recurrence">
              <select
                value={task.recurrence}
                onChange={(e) => updateTask(task.id, { recurrence: e.target.value as RecurrenceRule })}
                className="select-field"
              >
                {(["none", "daily", "weekly", "monthly"] as RecurrenceRule[]).map((r) => (
                  <option key={r} value={r}>
                    {r[0].toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due date">
              <input
                type="date"
                value={task.dueDate ?? ""}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value || null })}
                className="select-field"
              />
            </Field>
            <Field label="Start date">
              <input
                type="date"
                value={task.startDate ?? ""}
                onChange={(e) => updateTask(task.id, { startDate: e.target.value || null })}
                className="select-field"
              />
            </Field>
          </div>

          <Field label="Tags">
            <div className="flex flex-wrap items-center gap-1.5">
              {task.tagIds.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tagId}
                    className="flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-xs text-ink-soft"
                  >
                    #{tag.name}
                    <button
                      onClick={() =>
                        updateTask(task.id, {
                          tagIds: task.tagIds.filter((id) => id !== tagId),
                        })
                      }
                      className="text-ink-faint hover:text-urgent"
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}
              <input
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTagText.trim()) {
                    const tag = addTag(newTagText.trim());
                    if (!task.tagIds.includes(tag.id)) {
                      updateTask(task.id, { tagIds: [...task.tagIds, tag.id] });
                    }
                    setNewTagText("");
                  }
                }}
                placeholder="Add tag…"
                className="min-w-[90px] flex-1 bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
          </Field>

          <Field label={`Checklist${progress.total ? ` · ${progress.done}/${progress.total}` : ""}`}>
            <div className="space-y-1.5">
              {task.checklist.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(task.id, item.id)}
                    className="h-4 w-4 accent-structured"
                  />
                  <span className={classNames(item.done && "text-ink-faint line-through")}>
                    {item.text}
                  </span>
                </label>
              ))}
              <div className="flex items-center gap-1.5">
                <Plus size={13} className="text-ink-faint" />
                <input
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newChecklistText.trim()) {
                      addChecklistItem(task.id, newChecklistText.trim());
                      setNewChecklistText("");
                    }
                  }}
                  placeholder="Add checklist item…"
                  className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
                />
              </div>
            </div>
          </Field>

          <Field label="Notes">
            <textarea
              value={task.notes}
              onChange={(e) => updateTask(task.id, { notes: e.target.value })}
              rows={2}
              placeholder="Freeform notes…"
              className="w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </Field>

          {linkedNotes.length > 0 && (
            <Field label="Linked sticky notes">
              <div className="flex flex-wrap gap-2">
                {linkedNotes.map((n) => (
                  <span
                    key={n.id}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: n.color }}
                  >
                    <StickyNoteIcon size={12} />
                    Note
                  </span>
                ))}
              </div>
            </Field>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3.5">
          <div className="flex items-center gap-2">
            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-urgent hover:bg-urgent-soft"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-ink-soft">Delete this task?</span>
                <button
                  onClick={() => {
                    deleteTask(task.id);
                    closeTask();
                    pushToast("Task deleted", "info");
                  }}
                  className="rounded-md bg-urgent px-2 py-1 font-semibold text-white"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-md px-2 py-1 text-ink-soft hover:bg-paper"
                >
                  Cancel
                </button>
              </div>
            )}
            <button
              onClick={() => pinTaskAsNote(task.id)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-capture hover:bg-capture-soft"
            >
              <StickyNoteIcon size={14} />
              Pin as sticky note
            </button>
          </div>

          {isDone ? (
            <button
              onClick={() => reopenTask(task.id)}
              className="flex items-center gap-1.5 rounded-lg bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-line/50"
            >
              <RotateCcw size={14} />
              Reopen
            </button>
          ) : (
            <button
              onClick={() => {
                completeTask(task.id);
                pushToast("Marked complete 🎉", "success");
              }}
              className="flex items-center gap-1.5 rounded-lg bg-structured px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
            >
              <CheckCircle2 size={14} />
              Mark complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-ink-soft">{label}</p>
      {children}
    </div>
  );
}
