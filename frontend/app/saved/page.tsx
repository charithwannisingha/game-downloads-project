"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/lib/useAuth";
import { backendFetch } from "@/src/lib/backend";

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
}

export default function SavedGamesPage() {
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const timestamp = new Date().getTime();
    
    backendFetch(`/api/users/me/saved?t=${timestamp}`)
      .then((responseData: unknown) => {
        if (!isMounted) return;
        
        // 🔥 'unknown' error එක එන්නේ නැති වෙන්න data type එක හරියටම දුන්නා
        const data = responseData as Record<string, unknown>;
        
        const fetchedArray = Array.isArray(responseData) 
          ? responseData 
          : (data.games || data.savedGames || data.saved || data.items || data.data || []) as unknown[];
        
        const formattedGames = fetchedArray.map((item: unknown) => {
          const obj = item as Record<string, unknown>;
          if (obj.game) return obj.game as Game;
          if (obj.Game) return obj.Game as Game;
          return obj as unknown as Game;
        });

        setGames(formattedGames);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching saved games:", err);
        if (isMounted) setLoading(false);
      });

      return () => {
        isMounted = false;
      };
  }, [user]);

  if (authLoading || (user && loading)) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-[#22d3ee] font-bold">Loading Your Wishlist...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white px-4">
        <h2 className="text-2xl font-bold mb-4">Please log in to see your wishlist</h2>
        <Link href="/login" className="bg-[#22d3ee] text-black px-8 py-3 rounded-xl font-black uppercase shadow-lg">Login Now</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-16">
      <div className="w-full px-4 md:px-8">
        
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3 mb-10 border-b border-white/10 pb-4">
          <span className="w-2 h-8 bg-[#22d3ee] inline-block"></span>
          My Wishlist ({games.length})
        </h1>

        {games.length === 0 ? (
          <div className="text-center py-20 bg-[#111118] rounded-3xl border border-white/5 mx-auto max-w-2xl">
            <div className="mb-6 flex justify-center">
               <svg className="w-20 h-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </div>
            <h3 className="text-xl text-gray-400 font-bold mb-2">Your Wishlist is Empty!</h3>
            <p className="text-sm text-gray-500 mb-6">You haven&lsquo;t saved any games yet.</p>
            <Link href="/games" className="inline-block bg-[#22d3ee] text-black px-8 py-3 rounded-xl font-bold uppercase transition-transform hover:scale-105 shadow-lg">Browse Games</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
            {games.map((game) => (
              <Link href={`/game/${game.id}`} key={game.id} className="group flex flex-col relative">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-[#111118] border border-white/5 group-hover:border-[#22d3ee]/50 transition-colors">
                  <img 
                    src={toAbsoluteUrl(game.cover_image_url) || toAbsoluteUrl(game.banner_image_url)} 
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  <div className="absolute top-0 left-0 bg-[#22d3ee] text-black text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-br-md uppercase tracking-wider">
                    PC
                  </div>
                  
                  <div className="absolute top-0 right-0 bg-[#22d3ee] text-black text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md">
                    ★ {Number(game.rating_avg || 0).toFixed(1)}
                  </div>
                </div>
                
                <div className="pt-2 pb-1">
                  <h3 className="font-bold text-[11px] sm:text-xs md:text-sm text-gray-200 line-clamp-1 group-hover:text-[#22d3ee] transition-colors">
                    {game.title}
                  </h3>
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