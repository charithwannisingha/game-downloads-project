/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { backendUrl } from "@/src/lib/backend";

const schema = z.object({
  emailOrUsername: z.string().min(1).max(60),
  password: z.string().min(1).max(72),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  // 🔥 මෙතන '/dashboard' තිබුණු එක '/' (Home) විදිහට වෙනස් කළා
  const [next, setNext] = useState("/");

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("next");
    if (typeof v === "string" && v.trim().length) setNext(v);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(backendUrl(`/api/auth/login`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Login failed");
      }
      router.push(next);
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <div className="glass neon-border rounded-3xl p-6">
        <h1 className="text-xl font-black tracking-tight">Login</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">Secure JWT login (stored in HttpOnly cookie).</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <label className="text-sm text-[color:var(--muted)]">Email or Username</label>
            <input
              {...register("emailOrUsername")}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[rgba(2,6,23,0.25)] px-3 py-2 outline-none"
              autoComplete="username"
            />
            {errors.emailOrUsername ? <div className="text-xs text-red-400">{errors.emailOrUsername.message}</div> : null}
          </div>

          <div className="space-y-1">
            <label className="text-sm text-[color:var(--muted)]">Password</label>
            <input
              {...register("password")}
              type="password"
              className="w-full rounded-xl border border-[color:var(--border)] bg-[rgba(2,6,23,0.25)] px-3 py-2 outline-none"
              autoComplete="current-password"
            />
            {errors.password ? <div className="text-xs text-red-400">{errors.password.message}</div> : null}
          </div>

          {error ? <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            className="neon-border glass w-full rounded-2xl px-4 py-3 font-semibold transition hover:brightness-110 disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-sm text-[color:var(--muted)]">
          New here?{" "}
          <a href="/register" className="text-neon hover:brightness-110">
            Create an account
          </a>
        </div>
      </div>
    </main>
  );
}