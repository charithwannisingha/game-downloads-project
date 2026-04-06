"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function toAbsoluteUrl(url: string | null | undefined) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${backend}${url}`;
}

interface Game {
  id: number;
  title: string;
  size_gb: number;
  rating_avg: number;
  cover_image_url: string;
  banner_image_url: string;
  category_name: string;
  release_date: string;
}

function GamesContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const sortQuery = searchParams.get("sort") || "latest";
  
  const categoryId = searchParams.get("categoryId") || "";
  const catName = searchParams.get("catName") || "";

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const [prevSearch, setPrevSearch] = useState(searchQuery);
  const [prevSort, setPrevSort] = useState(sortQuery);
  const [prevCat, setPrevCat] = useState(categoryId);

  if (searchQuery !== prevSearch || sortQuery !== prevSort || categoryId !== prevCat) {
    setPrevSearch(searchQuery);
    setPrevSort(sortQuery);
    setPrevCat(categoryId);
    setLoading(true); 
  }

  useEffect(() => {
    let isMounted = true;
    
    let url = `${backend}/api/games?pageSize=50`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    if (sortQuery) url += `&sort=${sortQuery}`;
    if (categoryId) url += `&categoryId=${categoryId}`; 

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setGames(data.games || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, sortQuery, categoryId]);

  let pageTitle = "All Games";
  if (searchQuery) pageTitle = `Search Results for "${searchQuery}"`;
  else if (catName) pageTitle = `${catName} Games`; 
  else if (sortQuery === "trending") pageTitle = "Trending Games";
  else if (sortQuery === "popular") pageTitle = "Top Games";

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-16">
      <div className="w-full px-4 md:px-8">
        
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3 mb-10 border-b border-white/10 pb-4">
          <span className="w-2 h-8 bg-[#22d3ee] inline-block"></span>
          {pageTitle}
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-[#22d3ee] font-bold">Loading Games...</div>
        ) : games.length === 0 ? (
          <div className="text-center py-20 bg-[#111118] rounded-2xl border border-white/5 mx-auto max-w-2xl">
            <h3 className="text-xl text-gray-400 font-bold mb-2">No Games Found!</h3>
            <p className="text-sm text-gray-500">Try searching for something else.</p>
            <Link href="/games" className="inline-block mt-4 bg-[#22d3ee]/10 text-[#22d3ee] px-6 py-2 rounded-lg font-bold">View All Games</Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
            {games.map((game) => (
              <Link href={`/game/${game.id}`} key={game.id} className="group flex flex-col relative">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-[#111118] border border-white/5 group-hover:border-[#22d3ee]/50 transition-colors">
                  <img 
                    src={toAbsoluteUrl(game.cover_image_url) || toAbsoluteUrl(game.banner_image_url)} 
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* 🔥 PC ටැග් එක ලා නිල් පාටයි */}
                  <div className="absolute top-0 left-0 bg-[#22d3ee] text-black text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-br-md uppercase tracking-wider shadow-md">
                    PC
                  </div>
                  
                  {/* 🔥 Rating ටැග් එක ලා නිල් පාටයි */}
                  <div className="absolute top-0 right-0 bg-[#22d3ee] text-black text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md shadow-md">
                    ★ {Number(game.rating_avg || 0).toFixed(1)}
                  </div>
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                     <span className="bg-[#22d3ee] text-black px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest scale-90 group-hover:scale-100 transition-transform shadow-lg">
                        Download
                     </span>
                  </div>
                </div>
                
                <div className="pt-2 pb-1">
                  <h3 className="font-bold text-[11px] sm:text-xs md:text-sm text-gray-200 line-clamp-1 group-hover:text-[#22d3ee] transition-colors" title={game.title}>
                    {game.title}
                  </h3>
                  {/* 🔥 Category එකයි Size එකයි සුදු පාට (gray-400) කළා */}
                  <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 flex justify-between font-medium">
                     <span className="truncate">{game.category_name || "Game"}</span>
                     <span className="flex-shrink-0 ml-2">{game.size_gb} GB</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

export default function GamesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-[#22d3ee]">Loading...</div>}>
      <GamesContent />
    </Suspense>
  );
}