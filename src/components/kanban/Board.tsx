"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import Column from "./Column";
import TaskCard from "./TaskCard";

export default function Board() {
  const columns = useAppStore((s) => [...s.columns].sort((a, b) => a.order - b.order));
  const tasks = useAppStore((s) => s.tasks);
  const moveTask = useAppStore((s) => s.moveTask);
  const pushToast = useUIStore((s) => s.pushToast);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const byColumn = (colId: string) =>
    tasks.filter((t) => t.status === colId).sort((a, b) => a.order - b.order);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overType = over.data.current?.type as "task" | "column" | undefined;
    let toStatus: string;
    let toIndex: number;

    if (overType === "column") {
      toStatus = over.id as string;
      toIndex = byColumn(toStatus).length;
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (!overTask) return;
      toStatus = overTask.status;
      toIndex = byColumn(toStatus).findIndex((t) => t.id === overTask.id);
    }

    const result = moveTask(activeTask.id, toStatus, toIndex);
    if (!result.ok && result.reason) {
      pushToast(result.reason, "warning");
    }
  }

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3.5 overflow-x-auto pb-4">
        {columns.map((col) => (
          <Column key={col.id} column={col} tasks={byColumn(col.id)} />
        ))}
      </div>
      <DragOverlay>{activeTask && <TaskCard task={activeTask} />}</DragOverlay>
    </DndContext>
  );
}
