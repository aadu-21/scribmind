import { create } from "zustand";
import { persist } from "zustand/middleware";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.detail ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      signup: async (name, email, password) => {
        const res = await fetch(`${BASE}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res));
        const data = await res.json();
        set({ token: data.token, user: data.user });
      },

      login: async (email, password) => {
        const res = await fetch(`${BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res));
        const data = await res.json();
        set({ token: data.token, user: data.user });
      },

      logout: () => set({ token: null, user: null }),
    }),
    { name: "scribmind-auth", version: 1 }
  )
);
