"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TaskDetailModal from "@/components/kanban/TaskDetailModal";
import ToastStack from "@/components/shared/ToastStack";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
      <TaskDetailModal />
      <ToastStack />
    </div>
  );
}
