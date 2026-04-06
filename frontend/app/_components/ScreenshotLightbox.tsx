"use client";

import { useState } from "react";
import Image from "next/image";
import { toAbsoluteUrl } from "@/src/lib/image";
import { X } from "lucide-react";

type Screenshot = { id?: number; image_url: string; caption?: string | null };

export function ScreenshotLightbox({ screenshots }: { screenshots: Screenshot[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!screenshots.length) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {screenshots.slice(0, 6).map((s, idx) => {
          const src = toAbsoluteUrl(s.image_url);
          return (
            <button
              key={s.id ?? idx}
              type="button"
              onClick={() => setOpenIndex(idx)}
              className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[rgba(2,6,23,0.35)] transition hover:brightness-110"
            >
              {src ? (
                <Image src={src} alt={s.caption ?? `Screenshot ${idx + 1}`} width={600} height={400} className="h-28 w-full object-cover" />
              ) : (
                <div className="h-28 w-full bg-[rgba(34,211,238,0.08)]" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </button>
          );
        })}
      </div>

      {openIndex !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 rounded-xl bg-[rgba(2,6,23,0.65)] p-2 text-[color:var(--fg)] neon-border"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="max-w-5xl w-full overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[rgba(2,6,23,0.35)] glass">
            {(() => {
              const s = screenshots[openIndex];
              const src = toAbsoluteUrl(s.image_url);
              return src ? (
                <Image src={src} alt={s.caption ?? `Screenshot ${openIndex + 1}`} width={1600} height={900} className="h-auto w-full max-h-[70vh] object-contain" />
              ) : null;
            })()}
            <div className="border-t border-[color:var(--border)] p-3 text-sm text-[color:var(--muted)]">
              {screenshots[openIndex]?.caption ?? `Screenshot ${openIndex + 1}`}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

