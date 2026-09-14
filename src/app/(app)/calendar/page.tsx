import CalendarView from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Calendar</h1>
        <p className="mt-1 text-sm text-ink-soft">Deadlines at a glance. Click a day to add a task.</p>
      </header>
      <CalendarView />
    </div>
  );
}
