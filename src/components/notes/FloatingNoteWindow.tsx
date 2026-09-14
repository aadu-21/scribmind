"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pin, X } from "lucide-react";
import type { StickyNote } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import RichEditor from "./RichEditor";

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
      window: Window | null;
    };
  }
}

export function isDocumentPipSupported(): boolean {
  return typeof window !== "undefined" && "documentPictureInPicture" in window;
}

export default function FloatingNoteWindow({
  note,
  onClose,
}: {
  note: StickyNote;
  onClose: () => void;
}) {
  const updateNote = useAppStore((s) => s.updateNote);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const closedByUser = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function open() {
      if (!window.documentPictureInPicture) {
        onClose();
        return;
      }
      const pw = await window.documentPictureInPicture.requestWindow({
        width: Math.round(note.width),
        height: Math.round(note.height) + 42,
      });
      if (cancelled) {
        pw.close();
        return;
      }

      document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
        pw.document.head.appendChild(node.cloneNode(true));
      });
      pw.document.body.style.margin = "0";
      pw.document.title = note.title || "Sticky note";

      const el = pw.document.createElement("div");
      el.style.height = "100vh";
      pw.document.body.appendChild(el);

      pw.addEventListener("pagehide", () => {
        closedByUser.current = true;
        onClose();
      });

      pipWindowRef.current = pw;
      setContainer(el);
      setPipWindow(pw);
    }

    open();

    return () => {
      cancelled = true;
      if (!closedByUser.current) pipWindowRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pipWindow || !container) return null;

  return createPortal(
    <div className="flex h-full flex-col font-sans" style={{ backgroundColor: note.color }}>
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-ink/70">
          <Pin size={11} /> Floating note
        </span>
        <button
          onClick={() => pipWindow.close()}
          className="rounded p-1 text-ink/60 hover:bg-black/10"
          aria-label="Close floating note"
        >
          <X size={13} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden bg-white/35">
        <RichEditor
          content={note.richContent}
          onChange={(doc) => updateNote(note.id, { richContent: doc })}
        />
      </div>
    </div>,
    container
  );
}
