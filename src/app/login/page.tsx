"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import AuthShell from "@/components/nav/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log you in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to pick up where you left off on another device."
      footer={
        <>
          New to Scribmind?{" "}
          <Link href="/signup" className="font-semibold text-structured hover:underline">
            Sign up free
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@school.edu"
            className="select-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="select-field"
          />
        </div>

        {error && <p className="rounded-lg bg-urgent-soft px-3 py-2 text-xs text-urgent">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-structured px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
