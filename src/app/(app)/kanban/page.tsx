import Board from "@/components/kanban/Board";

export default function KanbanPage() {
  return (
    <div className="px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Kanban</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Backlog → To Do → In Progress → Review → Done. Drag a task to move it.
        </p>
      </header>
      <Board />
    </div>
  );
}
