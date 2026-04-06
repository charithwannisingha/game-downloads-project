import Link from "next/link";
import Image from "next/image";
import { toAbsoluteUrl } from "@/src/lib/image";

export type GameCardModel = {
  id: number;
  title: string;
  cover_image_url: string | null;
  version: string;
  size_gb: number | string;
  release_date: string;
  category_name?: string | null;
  rating_avg?: number;
};

export function GameCard({ game }: { game: GameCardModel }) {
  const cover = toAbsoluteUrl(game.cover_image_url);
  return (
    <Link
      href={`/game/${game.id}`}
      className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:rgba(2,6,23,0.35)] transition hover:brightness-110"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-80 transition group-hover:opacity-100" />
      {cover ? (
        <Image
          src={cover}
          alt={game.title}
          width={480}
          height={270}
          className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 90vw, 480px"
          priority={false}
        />
      ) : (
        <div className="h-48 w-full bg-[color:rgba(34,211,238,0.10)]" />
      )}
      <div className="relative p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-semibold tracking-tight">{game.title}</h3>
          {game.rating_avg ? (
            <span className="rounded-lg border border-[color:rgba(34,211,238,0.25)] bg-[rgba(34,211,238,0.10)] px-2 py-1 text-xs">
              {Number(game.rating_avg).toFixed(1)}★
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
          <span>{game.version}</span>
          <span className="opacity-60">•</span>
          <span>{Number(game.size_gb).toFixed(2)} GB</span>
          <span className="opacity-60">•</span>
          <span>{new Date(game.release_date).getFullYear()}</span>
        </div>
      </div>
    </Link>
  );
}

