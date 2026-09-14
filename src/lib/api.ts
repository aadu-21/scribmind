// Optional cloud sync against the FastAPI backend in /api. The app works
// entirely offline via localStorage without this; these calls are only
// ever triggered by an explicit user action in Settings > Data.

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

// The Python API uses snake_case field names (PEP 8); the frontend store
// uses camelCase. These converters translate at the sync boundary so
// neither side has to compromise its own language's conventions.
function toSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase()),
        toSnake(v),
      ])
    );
  }
  return obj;
}

function toCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamel(v),
      ])
    );
  }
  return obj;
}

import { useAuthStore } from "./authStore";

export interface RemoteState {
  tasks: unknown[];
  notes: unknown[];
  columns: unknown[];
  categories: unknown[];
  tags: unknown[];
}

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("Sign in first to sync with the cloud.");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchRemoteState(): Promise<RemoteState> {
  const res = await fetch(`${BASE}/api/state`, { headers: authHeaders() });
  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Your session expired. Sign in again.");
  }
  if (!res.ok) throw new Error(`Server responded ${res.status}`);
  const data = await res.json();
  return toCamel(data) as RemoteState;
}

export async function pushRemoteState(state: RemoteState): Promise<void> {
  const res = await fetch(`${BASE}/api/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(toSnake(state)),
  });
  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Your session expired. Sign in again.");
  }
  if (!res.ok) throw new Error(`Server responded ${res.status}`);
}
