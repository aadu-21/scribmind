import { nanoid } from "nanoid";
import {
  format,
  isToday,
  isPast,
  isThisWeek,
  parseISO,
  formatDistanceToNow,
} from "date-fns";
import type { Task } from "./types";

export const uid = (prefix = ""): string =>
  prefix ? `${prefix}_${nanoid(10)}` : nanoid(10);

export const nowISO = (): string => new Date().toISOString();

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "done") return false;
  return isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
}

export function isDueToday(task: Task): boolean {
  if (!task.dueDate) return false;
  return isToday(parseISO(task.dueDate));
}

export function isDueThisWeek(task: Task): boolean {
  if (!task.dueDate) return false;
  return isThisWeek(parseISO(task.dueDate), { weekStartsOn: 1 });
}

export function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  return format(d, "d MMM");
}

export function relativeTime(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function checklistProgress(task: Task): { done: number; total: number } {
  return {
    done: task.checklist.filter((c) => c.done).length,
    total: task.checklist.length,
  };
}

// Very light heuristic extraction used by Note -> Task conversion.
// Looks for a trailing date-ish phrase ("tomorrow", "Friday", "Sept 18") and
// strips it from the title, leaving the rest as the task title.
const DATE_WORDS: Record<string, number> = {
  tomorrow: 1,
  today: 0,
};
const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function extractTaskDraftFromText(text: string): {
  title: string;
  dueDate: string | null;
} {
  const trimmed = text.trim().replace(/\.$/, "");
  const lower = trimmed.toLowerCase();

  for (const word of Object.keys(DATE_WORDS)) {
    const idx = lower.lastIndexOf(word);
    if (idx !== -1) {
      const d = new Date();
      d.setDate(d.getDate() + DATE_WORDS[word]);
      const title = (trimmed.slice(0, idx) + trimmed.slice(idx + word.length))
        .trim()
        .replace(/\s+/g, " ");
      return { title: title || trimmed, dueDate: d.toISOString().slice(0, 10) };
    }
  }

  for (const day of WEEKDAYS) {
    const idx = lower.lastIndexOf(day);
    if (idx !== -1) {
      const target = WEEKDAYS.indexOf(day);
      const d = new Date();
      const diff = (target + 7 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + diff);
      const title = (trimmed.slice(0, idx) + trimmed.slice(idx + day.length))
        .trim()
        .replace(/\s+/g, " ");
      return { title: title || trimmed, dueDate: d.toISOString().slice(0, 10) };
    }
  }

  return { title: trimmed, dueDate: null };
}

// Extract a plain-text preview from a Tiptap JSON document, for search and
// for note -> task title extraction.
export function plainTextFromDoc(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const node = doc as { text?: string; content?: unknown[] };
  let out = node.text ?? "";
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      out += (out ? " " : "") + plainTextFromDoc(child);
    }
  }
  return out.trim();
}
