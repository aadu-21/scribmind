import { StickyNote, Task } from "./types";
import { nowISO, uid } from "./utils";

export function seedTasks(): Task[] {
  const now = nowISO();
  const inFive = new Date();
  inFive.setDate(inFive.getDate() + 5);

  return [
    {
      id: uid("task"),
      title: "Complete CNN Assignment",
      description: "Train and evaluate a CNN on the provided dataset.",
      status: "in_progress",
      order: 0,
      categoryId: "academic",
      priority: "high",
      dueDate: inFive.toISOString().slice(0, 10),
      startDate: null,
      tagIds: [],
      checklist: [
        { id: uid("item"), text: "Download dataset", done: true },
        { id: uid("item"), text: "Preprocess images", done: true },
        { id: uid("item"), text: "Train CNN", done: false },
        { id: uid("item"), text: "Generate graphs", done: false },
        { id: uid("item"), text: "Submit report", done: false },
      ],
      notes: "",
      attachments: [],
      recurrence: "none",
      reminder: null,
      linkedNoteIds: [],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    },
    {
      id: uid("task"),
      title: "Buy stationery",
      description: "",
      status: "todo",
      order: 0,
      categoryId: "personal",
      priority: "medium",
      dueDate: null,
      startDate: null,
      tagIds: [],
      checklist: [],
      notes: "",
      attachments: [],
      recurrence: "none",
      reminder: null,
      linkedNoteIds: [],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    },
    {
      id: uid("task"),
      title: "Update Resume",
      description: "",
      status: "review",
      order: 0,
      categoryId: "career",
      priority: "high",
      dueDate: null,
      startDate: null,
      tagIds: [],
      checklist: [],
      notes: "",
      attachments: [],
      recurrence: "none",
      reminder: null,
      linkedNoteIds: [],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    },
  ];
}

export function seedNotes(): StickyNote[] {
  const now = nowISO();
  return [
    {
      id: uid("note"),
      title: "",
      richContent: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Ask professor about viva" }] },
        ],
      },
      strokes: [],
      drawHeight: 0,
      x: 60,
      y: 60,
      width: 240,
      height: 180,
      zIndex: 1,
      color: "#F5E6A8",
      pinned: true,
      pinnedToDesktop: false,
      linkedTaskId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid("note"),
      title: "",
      richContent: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Buy new notebook" }] },
        ],
      },
      strokes: [],
      drawHeight: 0,
      x: 340,
      y: 100,
      width: 240,
      height: 180,
      zIndex: 2,
      color: "#C9DFC0",
      pinned: false,
      pinnedToDesktop: false,
      linkedTaskId: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
