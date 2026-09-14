"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, Download, Upload, CloudUpload, CloudDownload, LogOut } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";
import { NOTE_COLORS } from "@/lib/types";
import { fetchRemoteState, pushRemoteState } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

export default function SettingsPage() {
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const categories = useAppStore((s) => s.categories);
  const addCategory = useAppStore((s) => s.addCategory);
  const columns = useAppStore((s) => s.columns);
  const addColumn = useAppStore((s) => s.addColumn);
  const removeColumn = useAppStore((s) => s.removeColumn);
  const tasks = useAppStore((s) => s.tasks);
  const notes = useAppStore((s) => s.notes);
  const tags = useAppStore((s) => s.tags);
  const pushToast = useUIStore((s) => s.pushToast);

  const [newCategory, setNewCategory] = useState("");
  const [newColumn, setNewColumn] = useState("");
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePush() {
    setSyncing(true);
    try {
      await pushRemoteState({ tasks, notes, columns, categories, tags });
      pushToast("Pushed to your backend", "success");
    } catch (err) {
      pushToast(
        err instanceof Error ? `Couldn't reach the backend: ${err.message}` : "Couldn't reach the backend",
        "warning"
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handlePull() {
    if (!window.confirm("Replace your local tasks and notes with what's saved on the backend?")) return;
    setSyncing(true);
    try {
      const remote = await fetchRemoteState();
      useAppStore.setState({
        tasks: remote.tasks as never,
        notes: remote.notes as never,
        columns: (remote.columns.length ? remote.columns : columns) as never,
        categories: (remote.categories.length ? remote.categories : categories) as never,
        tags: remote.tags as never,
      });
      pushToast("Loaded from your backend", "success");
    } catch (err) {
      pushToast(
        err instanceof Error ? `Couldn't reach the backend: ${err.message}` : "Couldn't reach the backend",
        "warning"
      );
    } finally {
      setSyncing(false);
    }
  }

  function handleExport() {
    const payload = { tasks, notes, columns, categories, tags, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scribmind-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast("Export downloaded", "success");
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data.tasks) || !Array.isArray(data.notes)) {
          throw new Error("File doesn't look like a Scribmind export.");
        }
        const merge = window.confirm(
          "Merge imported data with what you already have? Choose Cancel to replace everything instead."
        );
        useAppStore.setState((s) => ({
          tasks: merge ? [...s.tasks, ...data.tasks] : data.tasks,
          notes: merge ? [...s.notes, ...data.notes] : data.notes,
          columns: data.columns ?? s.columns,
          categories: merge ? [...s.categories, ...(data.categories ?? [])] : data.categories ?? s.categories,
          tags: merge ? [...s.tags, ...(data.tags ?? [])] : data.tags ?? s.tags,
        }));
        pushToast("Import complete", "success");
      } catch (err) {
        pushToast(err instanceof Error ? err.message : "Import failed", "warning");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">Tune Scribmind to how you actually work.</p>
      </header>

      <section className="mb-6 rounded-2xl border border-line bg-paper-raised p-4">
        <h2 className="mb-3 font-display text-sm font-semibold text-ink">General</h2>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-soft">Enable Kanban WIP limits</span>
          <input
            type="checkbox"
            checked={settings.wipLimitsEnabled}
            onChange={(e) => updateSettings({ wipLimitsEnabled: e.target.checked })}
            className="h-4 w-8 accent-structured"
          />
        </label>
      </section>

      <section className="mb-6 rounded-2xl border border-line bg-paper-raised p-4">
        <h2 className="mb-3 font-display text-sm font-semibold text-ink">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{ borderColor: c.color + "55", color: c.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="select-field w-auto flex-1"
          />
          <button
            onClick={() => {
              if (!newCategory.trim()) return;
              addCategory(newCategory.trim(), NOTE_COLORS[categories.length % NOTE_COLORS.length]);
              setNewCategory("");
            }}
            className="flex items-center gap-1 rounded-lg bg-structured px-3 py-2 text-xs font-semibold text-white"
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-line bg-paper-raised p-4">
        <h2 className="mb-3 font-display text-sm font-semibold text-ink">Kanban columns</h2>
        <div className="flex flex-col gap-1.5">
          {columns.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg bg-paper px-3 py-2 text-sm">
              <span className="text-ink">{c.name}</span>
              {!c.isDefault && (
                <button onClick={() => removeColumn(c.id)} className="text-ink-faint hover:text-urgent">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={newColumn}
            onChange={(e) => setNewColumn(e.target.value)}
            placeholder="New column name"
            className="select-field w-auto flex-1"
          />
          <button
            onClick={() => {
              if (!newColumn.trim()) return;
              addColumn(newColumn.trim());
              setNewColumn("");
            }}
            className="flex items-center gap-1 rounded-lg bg-structured px-3 py-2 text-xs font-semibold text-white"
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-line bg-paper-raised p-4">
        <h2 className="mb-1 font-display text-sm font-semibold text-ink">Data</h2>
        <p className="mb-3 text-xs text-ink-soft">
          Export everything as a JSON file, or import a previous export. Importing never overwrites without asking.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-paper"
          >
            <Download size={13} /> Export data
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-paper"
          >
            <Upload size={13} /> Import data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-paper-raised p-4">
        <h2 className="mb-1 font-display text-sm font-semibold text-ink">Cloud sync (optional)</h2>
        <p className="mb-3 text-xs text-ink-soft">
          Scribmind works fully offline in this browser. Sign in to sync so your data follows you
          to another device.
        </p>
        {authUser ? (
          <>
            <p className="mb-3 text-xs text-ink-soft">
              Signed in as <span className="font-semibold text-ink">{authUser.email}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={syncing}
                onClick={handlePush}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-paper disabled:opacity-50"
              >
                <CloudUpload size={13} /> Push to cloud
              </button>
              <button
                disabled={syncing}
                onClick={handlePull}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-paper disabled:opacity-50"
              >
                <CloudDownload size={13} /> Pull from cloud
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-urgent hover:bg-urgent-soft"
              >
                <LogOut size={13} /> Log out
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/signup"
              className="flex items-center gap-1.5 rounded-lg bg-structured px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
            >
              Sign up free
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-paper"
            >
              Log in
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
