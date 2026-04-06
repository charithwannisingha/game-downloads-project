"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/useAuth"; // 🔥 ලොග් වෙලාද බලන්න මේක ගත්තා

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
  version: string | null;
  cover_image_url: string;
  banner_image_url: string;
  category_name: string;
  download_url?: string; 
}

type Props = { params: Promise<{ id: string }> };

export default function DownloadPage(props: Props) {
  const params = use(props.params);
  const id = params.id;
  const router = useRouter();
  
  // 🔥 User ලොග් වෙලාද කියලා චෙක් කරනවා
  const { user, loading: authLoading } = useAuth();
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5); 

  useEffect(() => {
    if (!id) return;
    fetch(`${backend}/api/games/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.game) setGame(data.game);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    // Timer එක දුවන්නේ Game එක ලෝඩ් වුණාට පස්සෙයි, User ලොග් වෙලා ඉන්නවා නම් විතරයි
    if (!loading && !authLoading && user && game && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, authLoading, user, game, countdown]);

  // 🔥 1. Auth එකයි Game එකයි දෙකම ලෝඩ් වෙනකම් මේක පෙන්වනවා
  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-[#22d3ee] font-bold">Preparing Download Hub...</div>;
  }

  // 🔥 2. User ලොග් වෙලා නැත්නම් මේ ලස්සන Login Box එක පෙන්වනවා (Download එක දෙන්නේ නෑ)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white px-4">
        <div className="bg-[#111118] border border-white/5 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
          
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          
          <h2 className="text-2xl font-black mb-3 text-white">Login Required</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            You need to be logged in to your account to access the download links. Please log in or create a free account to continue.
          </p>
          
          <div className="flex flex-col gap-3">
            <Link href="/login" className="bg-[#22d3ee] text-black font-bold py-3.5 rounded-xl hover:bg-[#06b6d4] transition-colors shadow-[0_0_15px_rgba(34,211,238,0.3)] w-full">
              Log In Now
            </Link>
            <Link href="/register" className="bg-transparent border border-white/10 text-white font-bold py-3.5 rounded-xl hover:bg-white/5 transition-colors w-full">
              Create Free Account
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/5">
             <Link href={`/game/${id}`} className="text-sm text-gray-500 hover:text-white transition-colors">
               &larr; Back to Game Page
             </Link>
          </div>
        </div>
      </div>
    );
  }

  // Game එක සර්වර් එකේ නැත්නම්
  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Game Not Found!</h2>
        <Link href="/" className="bg-[#22d3ee] text-black px-6 py-2 rounded font-bold">Go Back Home</Link>
      </div>
    );
  }

  const banner = toAbsoluteUrl(game.banner_image_url);
  const cover = toAbsoluteUrl(game.cover_image_url);
  const telegramLink = game.download_url || "https://t.me/neonpcgames";

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 relative z-10">

        {/* Back Button */}
        <Link href={`/game/${id}`} className="inline-flex items-center gap-2 text-[#22d3ee] hover:text-white transition-colors mb-8 text-sm font-bold bg-[#22d3ee]/10 px-4 py-2 rounded-lg border border-[#22d3ee]/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Game Info
        </Link>

        {/* Main Download Card */}
        <div className="bg-[#111118] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
          
          {/* Header with Banner */}
          <div className="h-48 w-full relative">
             {banner ? (
              <img src={banner} className="h-full w-full object-cover opacity-40 blur-[2px]" alt={`${game.title} banner`} />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-sky-900 to-[#111118]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111118] to-transparent" />
            <div className="absolute bottom-6 left-6 flex items-center gap-5 z-10">
                {cover ? (
                    <img src={cover} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-white/10 object-cover shadow-lg" alt={`${game.title} cover`} />
                ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-white/10 bg-[#1e293b] flex items-center justify-center shadow-lg"><span className="text-xs text-gray-500">No Cover</span></div>
                )}
                <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white drop-shadow-md leading-tight">{game.title}</h1>
                    <p className="text-sm font-medium text-[#22d3ee] mt-1">File Size: <span className="text-white">{game.size_gb} GB</span> &nbsp;•&nbsp; Version: <span className="text-white">{game.version || "Latest"}</span></p>
                </div>
            </div>
          </div>

          {/* Action Area (Download Section with Countdown) */}
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center border-b border-white/5 bg-black/40 relative overflow-hidden min-h-[300px]">
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#22d3ee]/10 rounded-full blur-[80px] pointer-events-none"></div>
             
             {countdown > 0 ? (
               <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-16 h-16 border-4 border-[#22d3ee]/20 border-t-[#22d3ee] rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                  <h2 className="text-2xl font-bold mb-2">Preparing Your Link...</h2>
                  <p className="text-gray-400 mb-6 max-w-sm">Please wait while we generate your secure Telegram download link.</p>
                  <div className="text-6xl font-black text-[#22d3ee] drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{countdown}</div>
               </div>
             ) : (
               <div className="flex flex-col items-center text-center relative z-10 animate-in fade-in zoom-in duration-500">
                  <h2 className="text-3xl font-black mb-3 text-white">Download is Ready! 🎉</h2>
                  <p className="text-gray-400 mb-8 max-w-md">Click the button below to securely get your game files via our high-speed Telegram channel.</p>
                  
                  <a 
                    href={telegramLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 bg-[#2AABEE] text-white hover:bg-[#229ED9] px-8 py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition-transform hover:scale-105 shadow-[0_0_30px_rgba(42,171,238,0.4)] w-full max-w-md"
                  >
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a58.973 58.973 0 0 0-1.056.002v-.002zm1.056 18.046c-.302 0-.256-.111-.363-.393l-1.127-3.712 8.448-7.619c.382-.34-.083-.528-.592-.188L9.278 12.56l-3.565-1.114c-.774-.241-.788-.772.161-1.144l13.91-5.357c.642-.24.966-.024.966.388v.001l-2.35 11.082c-.179.805-.662.998-1.334.618l-3.692-2.721-1.782 1.716c-.198.198-.363.364-.744.364l.263-3.804 6.918-6.248c.301-.268-.065-.417-.468-.151l-8.548 5.378-3.77-1.18c-.82-.256-.837-.819.171-1.214l14.73-5.676c.682-.257 1.284.156 1.058 1.059l-2.49 11.758c-.197.886-.719 1.11-1.425.71l-3.923-2.893-1.895 1.825c-.21.21-.387.388-.793.388l.28-4.044 7.355-6.642c.32-.289-.07-.444-.497-.161l-9.088 5.717z"/></svg>
                    Download via Telegram
                  </a>
               </div>
             )}
          </div>

          {/* Instructions Area */}
          <div className="p-8 sm:p-10 bg-[#111118]">
              <h3 className="text-xl font-bold mb-8 text-white uppercase tracking-widest flex items-center gap-3 border-l-4 border-[#22d3ee] pl-4">
                 How to Download & Install
              </h3>

              <div className="space-y-8">
                  <div className="flex gap-5">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">1</div>
                      <div>
                          <h4 className="font-bold text-white text-lg mb-1.5">Download All Game Files</h4>
                          <p className="text-sm text-gray-400 leading-relaxed">Click the download button above to open our Telegram Channel. Ensure you completely download <strong>all the provided game files or parts</strong> to your PC without skipping any.</p>
                      </div>
                  </div>
                  
                  <div className="flex gap-5">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black text-xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">2</div>
                      <div>
                          <h4 className="font-bold text-white text-lg mb-1.5">Organize into a Single Folder</h4>
                          <p className="text-sm text-gray-400 leading-relaxed">Once the download process is 100% complete, gather all the downloaded files and move them into a <strong>single, dedicated folder</strong> on your computer.</p>
                      </div>
                  </div>

                  <div className="flex gap-5">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-black text-xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">3</div>
                      <div>
                          <h4 className="font-bold text-white text-lg mb-1.5">Extract the Files</h4>
                          <p className="text-sm text-gray-400 leading-relaxed">Select all the files you placed in the folder, right-click on them, and choose &quot;Extract Here&quot;. You will need extraction software like <strong>WinRAR</strong> or <strong>7-Zip</strong> to perform this action.</p>
                      </div>
                  </div>

                  <div className="flex gap-5">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center font-black text-xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]">4</div>
                      <div>
                          <h4 className="font-bold text-white text-lg mb-1.5">Run Setup & Install</h4>
                          <p className="text-sm text-gray-400 leading-relaxed">Open the newly extracted folder, locate the <code className="text-[#22d3ee] bg-black/30 px-2 py-1 rounded">setup.exe</code> file, right-click it, and select <strong>&quot;Run as Administrator&quot;</strong>. Follow the on-screen instructions to install.</p>
                      </div>
                  </div>

                  <div className="flex gap-5">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#22d3ee]/10 text-[#22d3ee] flex items-center justify-center font-black text-xl border border-[#22d3ee]/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]">5</div>
                      <div>
                          <h4 className="font-bold text-white text-lg mb-1.5">Play & Enjoy!</h4>
                          <p className="text-sm text-gray-400 leading-relaxed">After the installation finishes smoothly, simply launch the game from your desktop shortcut or start menu. <strong>Enjoy playing your game! 🎉</strong></p>
                      </div>
                  </div>
              </div>
          </div>

        </div>
      </div>
    </main>
  );
}