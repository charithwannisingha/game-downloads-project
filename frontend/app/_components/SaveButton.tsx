"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/lib/useAuth";
import { backendUrl } from "@/src/lib/backend";
import { useRouter } from "next/navigation";

export function SaveButton({ gameId }: { gameId: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      if (!user) return setSaved(false);
      const res = await fetch(backendUrl(`/api/users/me/saved`), { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ids = (json.games ?? []).map((g: any) => g.id);
      setSaved(ids.includes(gameId));
    }
    check().catch(() => {});
  }, [user, gameId]);

  async function toggle() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/game/${gameId}`)}`);
      return;
    }
    setLoading(true);
    try {
      const method = saved ? "DELETE" : "POST";
      const res = await fetch(backendUrl(`/api/users/saved/${gameId}`), {
        method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("toggle failed");
      setSaved(!saved);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
        saved
          ? "bg-[#22d3ee] text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-[#06b6d4] hover:scale-[1.02]"
          : "bg-[#111118] text-[#22d3ee] border border-[#22d3ee]/30 hover:bg-[#22d3ee]/10 hover:border-[#22d3ee]/60 hover:scale-[1.02]"
      }`}
    >
      {saved ? (
        <>
          {/* Save කරාට පස්සේ පේන පිරිච්ච අයිකන් එක */}
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 21V5q0-.825.588-1.413Q6.175 3 7 3h10q.825 0 1.413.587Q19 4.175 19 5v16l-7-3Z" />
          </svg>
          Saved to Wishlist
        </>
      ) : (
        <>
          {/* Save කරන්න කලින් පේන හිස් අයිකන් එක */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          Save to Wishlist
        </>
      )}
    </button>
  );
}