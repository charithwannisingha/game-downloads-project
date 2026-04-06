"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/useAuth";
import { backendUrl } from "@/src/lib/backend";
import { GameCard } from "@/app/_components/GameCard";

type GameMini = {
  id: number;
  title: string;
  cover_image_url: string | null;
  version: string;
  size_gb: number | string;
  release_date: string;
  [key: string]: unknown; // 🔥 අමතර දත්ත ආවොත් Error එන්නේ නැති වෙන්න හැදුවා
};

// 🔥 Comments වලට අලුත් Type එකක් හැදුවා 'any' අයින් කරන්න
type CommentItem = {
  id: number;
  gameTitle: string;
  content: string;
  createdAt: string | number | Date;
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [uploads, setUploads] = useState<GameMini[]>([]);
  const [saved, setSaved] = useState<GameMini[]>([]);
  
  // 🔥 මෙතන තිබ්බ any අයින් කරලා CommentItem Type එක දුන්නා
  const [comments, setComments] = useState<CommentItem[]>([]);
  
  const [tab, setTab] = useState<"uploads" | "saved" | "comments">("uploads");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user) return;
    setBusy(true);
    try {
      const [u, s, c] = await Promise.all([
        fetch(backendUrl(`/api/users/me/uploads`), { credentials: "include" }).then((r) => r.json()),
        fetch(backendUrl(`/api/users/me/saved`), { credentials: "include" }).then((r) => r.json()),
        fetch(backendUrl(`/api/users/me/comments`), { credentials: "include" }).then((r) => r.json()),
      ]);
      setUploads(u.games ?? []);
      setSaved(s.games ?? []);
      setComments(c.comments ?? []);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else load().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const title = useMemo(() => {
    if (tab === "uploads") return "Uploaded games";
    if (tab === "saved") return "Saved games";
    return "Your comments";
  }, [tab]);

  if (loading) return <div className="mx-auto w-full max-w-4xl px-4 py-10 text-sm text-[color:var(--muted)]">Loading...</div>;

  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6">
      <div className="glass neon-border rounded-3xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-[color:var(--muted)]">Manage your community activity.</p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setTab("uploads")} className={`rounded-xl px-3 py-2 text-sm border border-[color:var(--border)] ${tab === "uploads" ? "bg-[rgba(34,211,238,0.10)]" : "bg-transparent"}`}>
              Uploads
            </button>
            <button type="button" onClick={() => setTab("saved")} className={`rounded-xl px-3 py-2 text-sm border border-[color:var(--border)] ${tab === "saved" ? "bg-[rgba(34,211,238,0.10)]" : "bg-transparent"}`}>
              Saved
            </button>
            <button type="button" onClick={() => setTab("comments")} className={`rounded-xl px-3 py-2 text-sm border border-[color:var(--border)] ${tab === "comments" ? "bg-[rgba(34,211,238,0.10)]" : "bg-transparent"}`}>
              Comments
            </button>
          </div>
        </div>

        {busy ? (
          <div className="mt-6 text-sm text-[color:var(--muted)]">Loading dashboard...</div>
        ) : tab === "uploads" ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 🔥 මෙතන තිබ්බ 'any' එක අයින් කරලා React වලට ගැලපෙන ආරක්ෂිත Type එකක් දුන්නා */}
            {uploads.length ? uploads.map((g) => <GameCard key={g.id} game={g as unknown as React.ComponentProps<typeof GameCard>["game"]} />) : <div className="text-sm text-[color:var(--muted)]">No uploads yet.</div>}
          </div>
        ) : tab === "saved" ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 🔥 මෙතනත් 'any' එක අයින් කළා */}
            {saved.length ? saved.map((g) => <GameCard key={g.id} game={g as unknown as React.ComponentProps<typeof GameCard>["game"]} />) : <div className="text-sm text-[color:var(--muted)]">No saved games yet.</div>}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {comments.length ? (
              comments.map((cm) => (
                <div key={cm.id} className="rounded-2xl border border-[color:var(--border)] bg-[rgba(2,6,23,0.35)] p-4">
                  <div className="text-sm font-semibold">{cm.gameTitle}</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--muted)]">{cm.content}</div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">{new Date(cm.createdAt).toLocaleString()}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-[color:var(--muted)]">No comments yet.</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}