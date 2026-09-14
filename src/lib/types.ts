// Core domain types for Scribmind

export type Priority = "low" | "medium" | "high" | "urgent";

export interface Category {
  id: string;
  name: string;
  color: string; // hex
  isDefault?: boolean;
}

export interface Tag {
  id: string;
  name: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface KanbanColumn {
  id: string;
  name: string;
  order: number;
  wipLimit: number | null; // null = disabled
  isDefault?: boolean;
}

export type RecurrenceRule = "none" | "daily" | "weekly" | "monthly";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string; // KanbanColumn id
  order: number; // position within column
  categoryId: string;
  priority: Priority;
  dueDate: string | null; // ISO date
  startDate: string | null; // ISO date
  tagIds: string[];
  checklist: ChecklistItem[];
  notes: string;
  attachments: { id: string; name: string; url: string }[];
  recurrence: RecurrenceRule;
  reminder: string | null; // ISO datetime
  linkedNoteIds: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// A single freehand stroke, stored as vector points (not a raster image)
export interface Stroke {
  id: string;
  points: { x: number; y: number; pressure?: number }[];
  color: string;
  width: number;
  opacity: number;
  erased?: boolean;
}

export interface StickyNote {
  id: string;
  title: string;
  richContent: unknown; // Tiptap JSON document
  strokes: Stroke[];
  drawHeight: number; // height of the handwriting canvas area
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  color: string; // note background theme
  pinned: boolean; // pinned within the Sticky Notes workspace
  pinnedToDesktop: boolean; // floating window (Document PiP) requested
  linkedTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  wipLimitsEnabled: boolean;
  theme: "light" | "dark";
  lastActiveSection: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "academic", name: "Academic", color: "#4C6E5D", isDefault: true },
  { id: "career", name: "Career", color: "#8A6D3B", isDefault: true },
  { id: "personal", name: "Personal", color: "#5B6B8C", isDefault: true },
  { id: "health", name: "Health/Fitness", color: "#A14E4E", isDefault: true },
  { id: "other", name: "Other", color: "#6B6B6B", isDefault: true },
];

export const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "backlog", name: "Backlog", order: 0, wipLimit: null, isDefault: true },
  { id: "todo", name: "To Do", order: 1, wipLimit: null, isDefault: true },
  { id: "in_progress", name: "In Progress", order: 2, wipLimit: 3, isDefault: true },
  { id: "review", name: "Review", order: 3, wipLimit: null, isDefault: true },
  { id: "done", name: "Done", order: 4, wipLimit: null, isDefault: true },
];

export const NOTE_COLORS = [
  "#F5E6A8", // yellow
  "#C9DFC0", // mint
  "#F3C6C6", // rose
  "#C6D8F3", // sky
  "#E4CDF0", // lilac
  "#F0DCC0", // sand
];

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};
