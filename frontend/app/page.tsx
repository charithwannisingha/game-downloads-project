"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function toAbsoluteUrl(url: string | null | undefined) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${backend}${url}`;
}

interface Game {
  id: number;
  title: string;
  description: string | null;
  version: string | null;
  size_gb: number;
  release_date: string;
  cover_image_url: string | null;
  banner_image_url: string | null;
  category_name: string | null;
  rating_avg: number | null;
  downloads_count: number | null;
}

export default function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  const [fullGamesCache, setFullGamesCache] = useState<Record<number, Game>>({});

  useEffect(() => {
    fetch(`${backend}/api/games?pageSize=30`)
      .then((res) => res.json())
      .then((data) => {
        const fetchedGames = data.games || [];
        setGames(fetchedGames);
        setLoading(false);

        const top5 = fetchedGames.slice(0, 5);
        top5.forEach((game: Game) => {
          fetch(`${backend}/api/games/${game.id}`)
            .then(r => r.json())
            .then(d => {
              if (d.game) {
                setFullGamesCache(prev => ({ ...prev, [game.id]: d.game }));
              }
            })
            .catch(e => console.error(e));
        });
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (games.length === 0) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(5, games.length));
    }, 8000); 
    return () => clearInterval(timer);
  }, [games]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-[#22d3ee] font-bold">Loading Games...</div>;
  }

  if (games.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-gray-400">No games found. Please add games from Admin Panel.</div>;
  }

  const heroGames = games.slice(0, 5);
  const activeGame = heroGames[heroIndex];
  
  const displayGame = activeGame ? (fullGamesCache[activeGame.id] || activeGame) : null;
  
  const trendingGames = [...games].sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0)).slice(0, 14);
  const latestGames = games.slice(0, 14);

  const GameCard = ({ game }: { game: Game }) => (
    <Link href={`/game/${game.id}`} className="group flex flex-col relative">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-[#111118] border border-white/5 group-hover:border-[#22d3ee]/50 transition-colors">
        <img 
          src={toAbsoluteUrl(game.cover_image_url) || toAbsoluteUrl(game.banner_image_url)} 
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* PC ටැග් එක ලා නිල් පාටයි */}
        <div className="absolute top-0 left-0 bg-[#22d3ee] text-black text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-br-md uppercase tracking-wider shadow-md">
          PC
        </div>
        
        {/* Rating ටැග් එකත් ලා නිල් පාටයි */}
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
        {/* 🔥 Category එකයි Size එකයි ආයෙත් සුදු පාට (gray-400) කළා */}
        <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 flex justify-between font-medium">
           <span className="truncate">{game.category_name || "Game"}</span>
           <span className="flex-shrink-0 ml-2">{game.size_gb} GB</span>
        </p>
      </div>
    </Link>
  );

  const bannerImg = toAbsoluteUrl(displayGame?.banner_image_url);
  const coverImg = toAbsoluteUrl(displayGame?.cover_image_url);
  
  const bgImg = bannerImg || coverImg; 
  const fgImg = coverImg || bannerImg;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      
      {/* HERO SLIDER */}
      {displayGame && (
        <div className="relative w-full aspect-[4/3] md:aspect-video max-h-[750px] bg-[#0a0a0f] overflow-hidden group">
          
          {bgImg && (
             <img 
               key={`bg-${displayGame.id}`}
               src={bgImg} 
               alt={`${displayGame.title} banner`}
               className="absolute inset-0 w-full h-full object-cover object-center opacity-60 transition-opacity duration-1000"
             />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent z-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-0" />

          <div className="absolute bottom-12 left-0 w-full z-20">
            <div className="flex flex-col md:flex-row items-end gap-10 w-full px-4 md:px-12 lg:px-16">
              
              <div className="hidden md:block w-40 md:w-48 flex-shrink-0 relative aspect-[2/3] rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] border-2 border-white/10 overflow-hidden bg-black/50 transition-all duration-500">
                 {fgImg ? (
                   <img 
                      src={fgImg} 
                      alt={`${displayGame.title} cover`}
                      className="w-full h-full object-cover"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold uppercase">No Cover</div>
                 )}
              </div>

              <div className="flex-1 space-y-4 pb-4 max-w-3xl">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-xl leading-tight">
                  {displayGame.title}
                </h1>
                
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="bg-[#22d3ee] text-black px-2 py-1 rounded font-bold text-[10px] uppercase shadow-md">v{displayGame.version || "Latest"}</span>
                  <span className="border border-white/20 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-semibold text-gray-300 uppercase">PC</span>
                  <span className="border border-white/20 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-semibold text-gray-300">{gameYear(displayGame.release_date)}</span>
                </div>

                <p className="text-gray-300 text-xs md:text-sm leading-relaxed line-clamp-3">
                   {displayGame.description?.replace(/<[^>]*>?/gm, '') || "Download the best and latest PC games. Fast, secure, and always updated."}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <Link href={`/game/${displayGame.id}/download`} className="bg-[#22d3ee] hover:bg-[#06b6d4] text-black px-5 py-2.5 rounded-md font-black text-xs uppercase tracking-wider transition-transform hover:scale-105 shadow-[0_0_15px_rgba(34,211,238,0.3)]">Download Now →</Link>
                  <Link href={`/game/${displayGame.id}`} className="text-white bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2.5 rounded-md font-bold text-xs transition-colors">Details ›</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Slider Dots */}
          <div className="absolute bottom-6 right-6 md:right-12 z-30 flex gap-2">
            {heroGames.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setHeroIndex(i)} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? "w-8 bg-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "w-3 bg-white/30 hover:bg-white/60"}`} 
              />
            ))}
          </div>

        </div>
      )}

      {/* FULL WIDTH GRID SECTION */}
      <div className="w-full px-4 md:px-8 py-12 space-y-12">
        
        <section>
           <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
             <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#22d3ee] inline-block"></span> Trending Games
             </h2>
             <Link href="/games?sort=trending" className="text-[#22d3ee] hover:text-white text-[10px] md:text-xs font-bold uppercase transition-colors">View All</Link>
           </div>
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
             {trendingGames.map(game => <GameCard key={game.id} game={game} />)}
           </div>
        </section>

        <section>
           <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
             <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#22d3ee] inline-block"></span> Latest Uploads
             </h2>
             <Link href="/games" className="text-[#22d3ee] hover:text-white text-[10px] md:text-xs font-bold uppercase transition-colors">View All</Link>
           </div>
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
             {latestGames.map(game => <GameCard key={game.id} game={game} />)}
           </div>
        </section>

      </div>
    </main>
  );
}

function gameYear(dateStr: string) {
  if (!dateStr) return new Date().getFullYear();
  return new Date(dateStr).getFullYear();
}