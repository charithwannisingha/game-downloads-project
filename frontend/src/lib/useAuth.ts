"use client";

import { useEffect, useState } from "react";
import { backendFetch } from "./backend";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  avatar: string | null;
  followers?: number;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await backendFetch<{ user: AuthUser }>("/api/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, refresh: async () => {} };
}

