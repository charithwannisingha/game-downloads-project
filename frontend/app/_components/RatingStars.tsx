"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { backendUrl } from "@/src/lib/backend";

export function RatingStars({
  gameId,
  ratingAvg,
  ratingCount,
}: {
  gameId: number;
  ratingAvg: number;
  ratingCount: number;
}) {
  const [avg, setAvg] = useState(ratingAvg);
  const [count, setCount] = useState(ratingCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAvg(ratingAvg);
    setCount(ratingCount);
  }, [ratingAvg, ratingCount]);

  const displayAvg = useMemo(() => (Number.isFinite(avg) ? avg : 0), [avg]);

  async function rate(stars: number) {
    setLoading(true);
    try {
      const res = await fetch(backendUrl(`/api/games/${gameId}/rate`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: stars }),
      });
      if (!res.ok) throw new Error("Failed to rate");

      // Refresh rating summary.
      const detailRes = await fetch(backendUrl(`/api/games/${gameId}`), { credentials: "include" });
      const json = await detailRes.json();
      setAvg(json?.game?.rating_avg ?? displayAvg);
      setCount(json?.game?.rating_count ?? count);
    } catch {
      // Ignore for now; you can enhance with toast notifications.
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, idx) => {
          const star = idx + 1;
          const filled = star <= Math.round(displayAvg);
          return (
            <button
              key={star}
              type="button"
              onClick={() => rate(star)}
              disabled={loading}
              className="p-0.5 transition hover:brightness-110 disabled:opacity-70"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                size={18}
                className={filled ? "fill-[color:var(--accent)] text-[color:var(--accent)]" : "text-[rgba(148,163,184,0.7)]"}
              />
            </button>
          );
        })}
      </div>
      <div className="text-sm text-[color:var(--muted)]">
        {displayAvg.toFixed(1)} ({count} ratings)
      </div>
    </div>
  );
}

