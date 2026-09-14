"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="dot-grid flex min-h-dvh flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: "var(--paper)" }}>
      <Link href="/" className="mb-7 flex items-end gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-structured font-display text-sm font-bold text-white">
          S
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-base font-semibold tracking-tight text-ink">Scribmind</span>
          <span className="font-hand text-xs leading-none text-capture">don&rsquo;t forget.</span>
        </div>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper-raised p-6 shadow-sm">
        <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        <div className="mt-5">{children}</div>
      </div>

      <p className="mt-5 text-sm text-ink-soft">{footer}</p>
    </div>
  );
}
