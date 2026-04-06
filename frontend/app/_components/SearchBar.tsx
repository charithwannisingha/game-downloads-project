"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { backendUrl } from "@/src/lib/backend";

type Category = { id: number; name: string };
type GameHit = { id: number; title: string; cover_image_url: string | null; version: string; size_gb: number };

export function SearchBar({
  categories,
  initialQuery,
  initialCategoryId,
}: {
  categories: Category[];
  initialQuery?: string;
  initialCategoryId?: number | null;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery ?? "");
  const [categoryId, setCategoryId] = useState<number | "all">(initialCategoryId ?? "all");
  const [minSizeGB, setMinSizeGB] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [results, setResults] = useState<GameHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (categoryId !== "all") params.set("categoryId", String(categoryId));
    const nSize = Number(minSizeGB);
    if (minSizeGB.trim() && Number.isFinite(nSize) && nSize > 0) params.set("minSizeGB", String(nSize));
    const nYear = Number(year);
    if (year.trim() && Number.isFinite(nYear) && nYear > 1900) params.set("year", String(nYear));
    params.set("pageSize", "6");
    params.set("page", "1");
    params.set("sort", "latest");
    return params.toString();
  }, [q, categoryId, minSizeGB, year]);

  // URL-driven filtering for clickable tags/genres.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQ = params.get("q");
    const urlCat = params.get("categoryId");
    if (urlQ !== null) setQ(urlQ);
    if (urlCat !== null) {
      const n = Number(urlCat);
      if (Number.isFinite(n)) setCategoryId(n);
      else setCategoryId("all");
    }
  }, []);

  useEffect(() => {
    if (!q.trim() && categoryId === "all") {
      setResults([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl("")}/api/games?${queryString}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!cancelled) setResults(json.games ?? []);
        if (!cancelled) setOpen(true);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q, categoryId, queryString]);

  return (
    <div className="glass neon-border rounded-2xl p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search games by name..."
          className="w-full rounded-xl border border-[color:rgba(34,211,238,0.25)] bg-[rgba(2,6,23,0.35)] px-3 py-2 text-sm outline-none"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="w-full md:w-52 rounded-xl border border-[color:rgba(34,211,238,0.25)] bg-[rgba(2,6,23,0.35)] px-3 py-2 text-sm outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          value={minSizeGB}
          onChange={(e) => setMinSizeGB(e.target.value)}
          className="rounded-xl border border-[color:rgba(34,211,238,0.25)] bg-[rgba(2,6,23,0.35)] px-3 py-2 text-sm outline-none"
          placeholder="Min size (GB)"
          inputMode="decimal"
        />
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-xl border border-[color:rgba(34,211,238,0.25)] bg-[rgba(2,6,23,0.35)] px-3 py-2 text-sm outline-none"
          placeholder="Release year"
          inputMode="numeric"
        />
      </div>

      {open ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-[color:var(--border)]">
          {loading ? (
            <div className="p-3 text-sm text-[color:var(--muted)]">Searching...</div>
          ) : results.length ? (
            <div className="max-h-72 overflow-auto">
              {results.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => router.push(`/game/${g.id}`)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-[rgba(34,211,238,0.08)]"
                >
                  <span className="font-medium line-clamp-1">{g.title}</span>
                  <span className="text-xs text-[color:var(--muted)]">{Number(g.size_gb).toFixed(2)} GB</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-sm text-[color:var(--muted)]">No results</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

