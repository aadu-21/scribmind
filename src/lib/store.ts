import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AppSettings,
  Category,
  DEFAULT_CATEGORIES,
  DEFAULT_COLUMNS,
  KanbanColumn,
  NOTE_COLORS,
  StickyNote,
  Stroke,
  Tag,
  Task,
} from "./types";
import { nowISO, uid } from "./utils";
import { seedNotes, seedTasks } from "./seed";

interface AppState {
  tasks: Task[];
  notes: StickyNote[];
  columns: KanbanColumn[];
  categories: Category[];
  tags: Tag[];
  settings: AppSettings;
  maxZIndex: number;

  // Task actions
  createTask: (partial: Partial<Task>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, toStatus: string, toIndex: number) => {
    ok: boolean;
    reason?: string;
  };
  reorderWithinColumn: (status: string, orderedIds: string[]) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  addChecklistItem: (taskId: string, text: string) => void;
  completeTask: (id: string) => void;
  reopenTask: (id: string) => void;

  // Column actions
  updateColumn: (id: string, patch: Partial<KanbanColumn>) => void;
  addColumn: (name: string) => void;
  removeColumn: (id: string) => void;
  reorderColumns: (orderedIds: string[]) => void;

  // Category / tag actions
  addCategory: (name: string, color: string) => Category;
  addTag: (name: string) => Tag;

  // Note actions
  createNote: (partial?: Partial<StickyNote>) => StickyNote;
  updateNote: (id: string, patch: Partial<StickyNote>) => void;
  deleteNote: (id: string, opts?: { keepLinkedTask?: boolean }) => void;
  bringNoteToFront: (id: string) => void;
  addStroke: (noteId: string, stroke: Stroke) => void;
  eraseStroke: (noteId: string, strokeId: string) => void;
  clearStrokes: (noteId: string) => void;
  undoStroke: (noteId: string) => void;

  // Conversion
  convertNoteToTask: (noteId: string, draft: { title: string; dueDate: string | null }) => Task;
  pinTaskAsNote: (taskId: string) => StickyNote;

  // Settings
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const emptyTiptapDoc = { type: "doc", content: [{ type: "paragraph" }] };

function nextNoteColor(existing: StickyNote[]): string {
  return NOTE_COLORS[existing.length % NOTE_COLORS.length];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: seedTasks(),
      notes: seedNotes(),
      columns: DEFAULT_COLUMNS,
      categories: DEFAULT_CATEGORIES,
      tags: [],
      settings: {
        wipLimitsEnabled: true,
        theme: "light",
        lastActiveSection: "/",
      },
      maxZIndex: 10,

      createTask: (partial) => {
        const task: Task = {
          id: uid("task"),
          title: partial.title ?? "Untitled task",
          description: partial.description ?? "",
          status: partial.status ?? "backlog",
          order: partial.order ?? get().tasks.filter((t) => t.status === (partial.status ?? "backlog")).length,
          categoryId: partial.categoryId ?? "other",
          priority: partial.priority ?? "medium",
          dueDate: partial.dueDate ?? null,
          startDate: partial.startDate ?? null,
          tagIds: partial.tagIds ?? [],
          checklist: partial.checklist ?? [],
          notes: partial.notes ?? "",
          attachments: partial.attachments ?? [],
          recurrence: partial.recurrence ?? "none",
          reminder: partial.reminder ?? null,
          linkedNoteIds: partial.linkedNoteIds ?? [],
          createdAt: nowISO(),
          updatedAt: nowISO(),
          completedAt: null,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task;
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: nowISO() } : t
          ),
        })),

      deleteTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          notes: s.notes.map((n) =>
            n.linkedTaskId === id ? { ...n, linkedTaskId: null } : n
          ),
        })),

      moveTask: (id, toStatus, toIndex) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return { ok: false, reason: "Task not found" };

        const column = state.columns.find((c) => c.id === toStatus);
        const movingWithinSameColumn = task.status === toStatus;

        if (
          state.settings.wipLimitsEnabled &&
          column?.wipLimit != null &&
          !movingWithinSameColumn
        ) {
          const currentCount = state.tasks.filter((t) => t.status === toStatus).length;
          if (currentCount >= column.wipLimit) {
            return {
              ok: false,
              reason: `${column.name} is at its WIP limit (${column.wipLimit}/${column.wipLimit}). Finish something before starting more.`,
            };
          }
        }

        set((s) => {
          const remaining = s.tasks.filter((t) => t.id !== id);
          const destTasks = remaining
            .filter((t) => t.status === toStatus)
            .sort((a, b) => a.order - b.order);
          destTasks.splice(toIndex, 0, { ...task, status: toStatus, updatedAt: nowISO() });
          const reindexedDest = destTasks.map((t, i) => ({ ...t, order: i }));

          const others = remaining.filter((t) => t.status !== toStatus);
          return {
            tasks: [...others, ...reindexedDest],
          };
        });

        return { ok: true };
      },

      reorderWithinColumn: (status, orderedIds) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.status !== status) return t;
            const idx = orderedIds.indexOf(t.id);
            return idx === -1 ? t : { ...t, order: idx };
          }),
        })),

      toggleChecklistItem: (taskId, itemId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  updatedAt: nowISO(),
                  checklist: t.checklist.map((c) =>
                    c.id === itemId ? { ...c, done: !c.done } : c
                  ),
                }
              : t
          ),
        })),

      addChecklistItem: (taskId, text) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  updatedAt: nowISO(),
                  checklist: [...t.checklist, { id: uid("item"), text, done: false }],
                }
              : t
          ),
        })),

      completeTask: (id) => {
        const done = get().columns.find((c) => c.id === "done") ?? get().columns[get().columns.length - 1];
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: done.id, completedAt: nowISO(), updatedAt: nowISO() }
              : t
          ),
        }));
      },

      reopenTask: (id) => {
        const todo = get().columns.find((c) => c.id === "todo") ?? get().columns[0];
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: todo.id, completedAt: null, updatedAt: nowISO() }
              : t
          ),
        }));
      },

      updateColumn: (id, patch) =>
        set((s) => ({
          columns: s.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      addColumn: (name) =>
        set((s) => ({
          columns: [
            ...s.columns,
            { id: uid("col"), name, order: s.columns.length, wipLimit: null },
          ],
        })),

      removeColumn: (id) =>
        set((s) => ({ columns: s.columns.filter((c) => c.id !== id) })),

      reorderColumns: (orderedIds) =>
        set((s) => ({
          columns: s.columns
            .map((c) => ({ ...c, order: orderedIds.indexOf(c.id) }))
            .sort((a, b) => a.order - b.order),
        })),

      addCategory: (name, color) => {
        const category: Category = { id: uid("cat"), name, color };
        set((s) => ({ categories: [...s.categories, category] }));
        return category;
      },

      addTag: (name) => {
        const existing = get().tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing;
        const tag: Tag = { id: uid("tag"), name };
        set((s) => ({ tags: [...s.tags, tag] }));
        return tag;
      },

      createNote: (partial) => {
        const z = get().maxZIndex + 1;
        const note: StickyNote = {
          id: uid("note"),
          title: partial?.title ?? "",
          richContent: partial?.richContent ?? emptyTiptapDoc,
          strokes: partial?.strokes ?? [],
          drawHeight: partial?.drawHeight ?? 0,
          x: partial?.x ?? 40 + ((get().notes.length * 24) % 240),
          y: partial?.y ?? 40 + ((get().notes.length * 24) % 160),
          width: partial?.width ?? 260,
          height: partial?.height ?? 220,
          zIndex: z,
          color: partial?.color ?? nextNoteColor(get().notes),
          pinned: partial?.pinned ?? false,
          pinnedToDesktop: partial?.pinnedToDesktop ?? false,
          linkedTaskId: partial?.linkedTaskId ?? null,
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
        set((s) => ({ notes: [...s.notes, note], maxZIndex: z }));
        return note;
      },

      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: nowISO() } : n
          ),
        })),

      deleteNote: (id, opts) =>
        set((s) => {
          const note = s.notes.find((n) => n.id === id);
          let tasks = s.tasks;
          if (note?.linkedTaskId && !opts?.keepLinkedTask) {
            tasks = s.tasks.map((t) =>
              t.id === note.linkedTaskId
                ? { ...t, linkedNoteIds: t.linkedNoteIds.filter((nid) => nid !== id) }
                : t
            );
          }
          return { notes: s.notes.filter((n) => n.id !== id), tasks };
        }),

      bringNoteToFront: (id) => {
        const z = get().maxZIndex + 1;
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, zIndex: z } : n)),
          maxZIndex: z,
        }));
      },

      addStroke: (noteId, stroke) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId
              ? { ...n, strokes: [...n.strokes, stroke], updatedAt: nowISO() }
              : n
          ),
        })),

      eraseStroke: (noteId, strokeId) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  strokes: n.strokes.filter((st) => st.id !== strokeId),
                  updatedAt: nowISO(),
                }
              : n
          ),
        })),

      clearStrokes: (noteId) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId ? { ...n, strokes: [], updatedAt: nowISO() } : n
          ),
        })),

      undoStroke: (noteId) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId
              ? { ...n, strokes: n.strokes.slice(0, -1), updatedAt: nowISO() }
              : n
          ),
        })),

      convertNoteToTask: (noteId, draft) => {
        const task = get().createTask({
          title: draft.title,
          dueDate: draft.dueDate,
          linkedNoteIds: [noteId],
        });
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId ? { ...n, linkedTaskId: task.id, updatedAt: nowISO() } : n
          ),
        }));
        return task;
      },

      pinTaskAsNote: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        const category = get().categories.find((c) => c.id === task?.categoryId);
        const lines = [
          task?.title ?? "Task",
          [
            category?.name,
            task?.priority ? `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority` : null,
            task?.dueDate ? `Due ${task.dueDate}` : null,
          ]
            .filter(Boolean)
            .join(" • "),
        ];
        const doc = {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", marks: [{ type: "bold" }], text: lines[0] }],
            },
            { type: "paragraph", content: [{ type: "text", text: lines[1] }] },
          ],
        };
        const note = get().createNote({
          richContent: doc,
          pinned: true,
          linkedTaskId: taskId,
        });
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, linkedNoteIds: [...t.linkedNoteIds, note.id] }
              : t
          ),
        }));
        return note;
      },

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: "scribmind-storage",
      version: 1,
    }
  )
);
