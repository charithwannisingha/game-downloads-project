"use client";

import { useState } from "react";
import { backendUrl } from "@/src/lib/backend";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/lib/useAuth";

export function DownloadButton({ gameId, title }: { gameId: number; title: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState<number>(0);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState<string>("");

  async function startDownload() {
    if (loading) return;
    if (!user) {
      const next = searchParams.get("next") ?? `/game/${gameId}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    try {
      setDownloading(true);
      setProgress(0);
      setStatus("Requesting secure download link...");

      const tokenRes = await fetch(backendUrl(`/api/download/${gameId}`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!tokenRes.ok) {
        const text = await tokenRes.text().catch(() => "");
        throw new Error(text || "Download link failed");
      }
      const tokenJson: any = await tokenRes.json();
      const downloadToken = String(tokenJson.downloadToken ?? "");
      if (!downloadToken) throw new Error("Missing downloadToken");

      setStatus("Downloading via Telegram (secure stream)...");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", backendUrl(`/api/download/stream?token=${encodeURIComponent(downloadToken)}`), true);
        xhr.responseType = "blob";

        xhr.onprogress = (evt) => {
          if (evt.lengthComputable && evt.total > 0) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const blob = xhr.response as Blob;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `game-${gameId}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            resolve();
          } else {
            reject(new Error(`Download failed (${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send();
      });

      setStatus("Download started. Enjoy!");
    } catch (e: any) {
      setStatus(e?.message ?? "Download failed");
    } finally {
      setDownloading(false);
      setTimeout(() => setProgress(0), 5000);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={startDownload}
        disabled={downloading}
        className="neon-border glass w-full rounded-2xl px-4 py-3 font-semibold transition hover:brightness-110 disabled:opacity-70"
      >
        {downloading ? "Downloading..." : "Download"}
      </button>

      {downloading ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[rgba(148,163,184,0.15)] overflow-hidden border border-[color:var(--border)]">
            <div className="h-full bg-[linear-gradient(90deg,rgba(34,211,238,0.9),rgba(167,139,250,0.9))]" style={{ width: `${progress}%` }} />
          </div>
          {status ? <div className="text-xs text-[color:var(--muted)]">{status}</div> : null}
        </div>
      ) : status ? (
        <div className="text-xs text-[color:var(--muted)]">{status}</div>
      ) : null}
    </div>
  );
}

