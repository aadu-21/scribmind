"use client";

import { useRef, useState } from "react";
import { Eraser, Pen, Trash2, Undo2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Stroke } from "@/lib/types";
import { uid } from "@/lib/utils";
import { classNames } from "@/lib/utils";

const PEN_COLORS = ["#21261f", "#2b6e63", "#b54a3f", "#2b4c7e"];
const PEN_WIDTHS = [2, 3.5, 5.5];

function distanceToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

export default function HandwritingCanvas({ noteId, strokes }: { noteId: string; strokes: Stroke[] }) {
  const addStroke = useAppStore((s) => s.addStroke);
  const eraseStroke = useAppStore((s) => s.eraseStroke);
  const clearStrokes = useAppStore((s) => s.clearStrokes);
  const undoStroke = useAppStore((s) => s.undoStroke);

  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [width, setWidth] = useState(PEN_WIDTHS[0]);
  const [confirmClear, setConfirmClear] = useState(false);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<{ x: number; y: number }[] | null>(null);
  const [livePoints, setLivePoints] = useState<{ x: number; y: number }[] | null>(null);

  function toLocal(e: React.PointerEvent): { x: number; y: number } {
    const rect = surfaceRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = toLocal(e);
    if (tool === "pen") {
      drawingRef.current = [pt];
      setLivePoints([pt]);
    } else {
      eraseAt(pt);
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (e.buttons !== 1) return;
    const pt = toLocal(e);
    if (tool === "pen" && drawingRef.current) {
      drawingRef.current = [...drawingRef.current, pt];
      setLivePoints(drawingRef.current);
    } else if (tool === "eraser") {
      eraseAt(pt);
    }
  }

  function handlePointerUp() {
    if (tool === "pen" && drawingRef.current && drawingRef.current.length > 1) {
      addStroke(noteId, {
        id: uid("stroke"),
        points: drawingRef.current,
        color,
        width,
        opacity: 1,
      });
    }
    drawingRef.current = null;
    setLivePoints(null);
  }

  function eraseAt(pt: { x: number; y: number }) {
    for (const stroke of strokes) {
      for (let i = 0; i < stroke.points.length - 1; i++) {
        if (distanceToSegment(pt, stroke.points[i], stroke.points[i + 1]) < 8) {
          eraseStroke(noteId, stroke.id);
          return;
        }
      }
    }
  }

  return (
    <div className="flex flex-col border-t border-line/70">
      <div className="flex items-center gap-1.5 px-2 py-1">
        <button
          onClick={() => setTool("pen")}
          className={classNames(
            "rounded-md p-1",
            tool === "pen" ? "bg-structured-soft text-structured" : "text-ink-faint hover:bg-paper"
          )}
          title="Pen"
        >
          <Pen size={13} />
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={classNames(
            "rounded-md p-1",
            tool === "eraser" ? "bg-structured-soft text-structured" : "text-ink-faint hover:bg-paper"
          )}
          title="Stroke eraser"
        >
          <Eraser size={13} />
        </button>
        <div className="mx-1 h-4 w-px bg-line" />
        {PEN_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={classNames(
              "h-3.5 w-3.5 rounded-full border",
              color === c ? "border-ink" : "border-transparent"
            )}
            style={{ backgroundColor: c }}
            title="Stroke color"
          />
        ))}
        <div className="mx-1 h-4 w-px bg-line" />
        {PEN_WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => setWidth(w)}
            className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-paper"
            title="Stroke size"
          >
            <span
              className={classNames("rounded-full", width === w ? "bg-ink" : "bg-ink-faint")}
              style={{ width: w + 2, height: w + 2 }}
            />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => undoStroke(noteId)}
            className="rounded-md p-1 text-ink-faint hover:bg-paper"
            title="Undo stroke"
          >
            <Undo2 size={13} />
          </button>
          {confirmClear ? (
            <button
              onClick={() => {
                clearStrokes(noteId);
                setConfirmClear(false);
              }}
              className="rounded-md bg-urgent px-1.5 py-0.5 text-[10px] font-semibold text-white"
            >
              Confirm clear
            </button>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              onBlur={() => setConfirmClear(false)}
              className="rounded-md p-1 text-ink-faint hover:bg-urgent-soft hover:text-urgent"
              title="Clear all drawing"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={surfaceRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={classNames(
          "relative flex-1 touch-none bg-white/40",
          tool === "eraser" ? "cursor-cell" : "cursor-crosshair"
        )}
      >
        <svg className="absolute inset-0 h-full w-full">
          {strokes.map((s) => (
            <polyline
              key={s.id}
              points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width}
              strokeOpacity={s.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {livePoints && (
            <polyline
              points={livePoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={color}
              strokeWidth={width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
