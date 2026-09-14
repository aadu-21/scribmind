"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Kanban,
  StickyNote,
  CalendarDays,
  CheckCircle2,
  Settings,
  LogOut,
  UserCircle2,
} from "lucide-react";
import CreateMenu from "./CreateMenu";
import GlobalSearch from "./GlobalSearch";
import { classNames } from "@/lib/utils";
import { useAuthStore } from "@/lib/authStore";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "My Tasks", icon: ListChecks },
  { href: "/kanban", label: "Kanban", icon: Kanban },
  { href: "/notes", label: "Sticky Notes", icon: StickyNote },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/completed", label: "Completed", icon: CheckCircle2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-line bg-paper-raised px-3.5 py-4">
      <Link href="/dashboard" className="mb-5 flex items-end gap-2 px-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-structured font-display text-sm font-bold text-white">
          S
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            Scribmind
          </span>
          <span className="font-hand text-xs leading-none text-capture">
            don&rsquo;t forget.
          </span>
        </div>
      </Link>

      <div className="mb-4">
        <CreateMenu />
      </div>

      <div className="mb-4">
        <GlobalSearch />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={classNames(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-structured-soft text-structured"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              )}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {user ? (
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-structured-soft text-xs font-semibold text-structured">
            {user.name.trim().charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
            <p className="truncate text-[11px] text-ink-faint">{user.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            title="Log out"
            className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-paper hover:text-urgent"
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-ink-soft hover:bg-paper hover:text-ink"
        >
          <UserCircle2 size={18} />
          Sign in to sync your data
        </Link>
      )}

      <p className="px-2 pb-1 pt-1 text-xs text-ink-faint">
        Write it down. We&rsquo;ll remember.
      </p>
    </aside>
  );
}
