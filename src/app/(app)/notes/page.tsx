import NotesWorkspace from "@/components/notes/NotesWorkspace";

export default function NotesPage() {
  return (
    <div className="px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Sticky Notes</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Drag notes anywhere. Positions, formatting, and handwriting are all saved.
        </p>
      </header>
      <NotesWorkspace />
    </div>
  );
}
