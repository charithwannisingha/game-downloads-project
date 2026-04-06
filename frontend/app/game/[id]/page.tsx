/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { toAbsoluteUrl } from "@/src/lib/image";
import { RatingStars } from "@/app/_components/RatingStars";
import { CommentsSection } from "@/app/_components/CommentsSection";
import { RichText } from "@/app/_components/RichText";
import { SaveButton } from "@/app/_components/SaveButton";

type Props = { params: Promise<{ id: string }> };

function getEmbedUrl(url: string) {
  if (!url) return "";
  let videoId = "";
  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  } else if (url.includes("youtube.com/embed/")) {
    return url;
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

export default async function GameDetails(props: Props) {
  const { id } = await props.params;
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  const res = await fetch(`${backend}/api/games/${id}`, { cache: "no-store" });
  if (!res.ok) return notFound();
  const json = await res.json();
  const game = json?.game;
  if (!game) return notFound();

  const banner = toAbsoluteUrl(game.banner_image_url);
  const cover = toAbsoluteUrl(game.cover_image_url);
  
  const rawScreenshots = Array.isArray(game.screenshots) ? game.screenshots : [];
  const screenshots = rawScreenshots
    .map((s: unknown, index: number) => {
      const isObj = typeof s === "object" && s !== null;
      const url = isObj && typeof (s as Record<string, unknown>).image_url === "string" 
        ? (s as Record<string, unknown>).image_url as string 
        : "";
      const sid = isObj && typeof (s as Record<string, unknown>).id === "number" 
        ? (s as Record<string, unknown>).id as number 
        : index + 1;
      return { id: sid, image_url: toAbsoluteUrl(url) || "" };
    })
    .filter((s: { id: number; image_url: string }) => s.image_url !== "");

  const shareUrl = `https://neonpc.com/game/${game.id}`; 
  const shareText = encodeURIComponent(`Download ${game.title} for free at NeonPC!`);

  const isMp4 = game.trailer_youtube_url && game.trailer_youtube_url.includes(".mp4");
  const embedUrl = getEmbedUrl(game.trailer_youtube_url);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      
      <div className="relative h-[450px] md:h-[550px] w-full overflow-hidden bg-[#0a0a0f]">
        {banner ? (
          <img 
             src={banner} 
             className="absolute inset-0 h-full w-full object-cover object-center opacity-70 transition-opacity" 
             alt={`${game.title} banner`} 
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-[#1e293b] to-[#0a0a0f]" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent z-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/90 via-[#0a0a0f]/40 to-transparent z-0" />
        
        <div className="absolute bottom-10 left-0 w-full z-20">
          <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-end gap-8">
            <div className="hidden md:block w-52 md:w-64 flex-shrink-0">
              {cover ? (
                  <img src={cover} className="w-full rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] border-4 border-white/5 aspect-[3/4] object-cover" alt={`${game.title} cover`} />
              ) : (
                  <div className="w-full rounded-2xl shadow-2xl border-4 border-white/5 aspect-[3/4] bg-[#1e293b] flex items-center justify-center">
                      <span className="text-gray-500 text-xs font-semibold uppercase">No Cover</span>
                  </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tighter uppercase text-white drop-shadow-xl leading-tight">{game.title}</h1>
              <div className="flex flex-wrap gap-3 items-center">
                <span className="bg-[#22d3ee] text-black px-3 py-1 rounded font-bold text-xs shadow-md uppercase">v{game.version}</span>
                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded text-xs font-bold border border-white/10 drop-shadow-sm">{game.size_gb} GB</span>
                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded text-xs font-bold border border-white/10 drop-shadow-sm">{new Date(game.release_date).getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          <div className="lg:col-span-8 flex flex-col gap-10 h-full">
            
            <div className="bg-[#111118] border border-white/5 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-transform hover:scale-[1.01]">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold mb-1">Download {game.title} Free</h2>
                <p className="text-gray-400 text-sm">Secure, high-speed, and verified game downloads via our Telegram channel.</p>
              </div>
              <div className="w-full md:w-72">
                 <a href={`/game/${game.id}/download`} className="w-full flex items-center justify-center gap-2 bg-[#22d3ee] text-black hover:bg-[#06b6d4] py-3.5 rounded-xl font-black uppercase tracking-wider transition-transform hover:scale-105 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                     Go to Download
                 </a>
              </div>
            </div>

            {game.trailer_youtube_url && (
                <div>
                    <h2 className="text-2xl font-bold border-l-4 border-[#22d3ee] pl-4 mb-6 uppercase tracking-tight">Game Trailer</h2>
                    <div className="bg-[#111118] border border-white/5 p-6 rounded-3xl shadow-md overflow-hidden flex justify-center">
                        <div className="w-full max-w-3xl"> 
                            {isMp4 ? (
                               <video src={game.trailer_youtube_url} controls className="w-full rounded-xl aspect-video object-cover bg-black shadow-lg" />
                            ) : embedUrl ? (
                               <iframe className="w-full aspect-video rounded-xl bg-black shadow-lg" src={embedUrl} allowFullScreen></iframe>
                            ) : (
                               <RichText html={game.trailer_youtube_url} />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold border-l-4 border-[#22d3ee] pl-4 mb-6 uppercase tracking-tight">About This Game</h2>
              <div className="bg-[#111118] border border-white/5 p-6 rounded-3xl text-gray-300 leading-relaxed font-medium">
                <RichText html={game.description || ""} />
              </div>
            </div>

            {screenshots.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold border-l-4 border-[#22d3ee] pl-4 mb-6 uppercase tracking-tight">Game Screenshots Gallery</h2>
                  <div className="bg-[#111118] border border-white/5 p-4 rounded-3xl shadow-md">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {screenshots.map((s: { id: number, image_url: string }, i: number) => (
                           <a key={s.id} href={s.image_url} target="_blank" rel="noreferrer" className="relative group overflow-hidden rounded-xl border border-white/10 bg-black/50 aspect-video block">
                              <img src={s.image_url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                              </div>
                           </a>
                        ))}
                     </div>
                  </div>
                </div>
            )}

            <div>
              <h2 className="text-2xl font-bold border-l-4 border-[#22d3ee] pl-4 mb-5 uppercase tracking-tight">System Requirements</h2>
              <div className="bg-[#111118] border border-white/5 p-5 rounded-3xl shadow-md">
                <div className="space-y-3 text-xs text-gray-300">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500 w-1/3 font-semibold uppercase tracking-wider">OS</span>
                    <span className="font-medium w-2/3 text-right">{game.os || "Windows 10 64-bit"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500 w-1/3 font-semibold uppercase tracking-wider">Processor</span>
                    <span className="font-medium w-2/3 text-right">{game.processor || "Intel Core i5 / AMD Ryzen 5"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500 w-1/3 font-semibold uppercase tracking-wider">Memory</span>
                    <span className="font-medium w-2/3 text-right">{game.memory || "8 GB RAM"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500 w-1/3 font-semibold uppercase tracking-wider">Graphics</span>
                    <span className="font-medium w-2/3 text-right">{game.graphics || "NVIDIA GTX 1060 / AMD RX 580"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500 w-1/3 font-semibold uppercase tracking-wider">DirectX</span>
                    <span className="font-medium w-2/3 text-right">{game.directx || "Version 12"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 w-1/3 font-semibold uppercase tracking-wider">Storage</span>
                    <span className="font-medium w-2/3 text-right">{game.storage || "50 GB available space"}</span>
                  </div>
                </div>
              </div>
            </div>

<div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold border-l-4 border-[#22d3ee] pl-4 mb-6 uppercase tracking-tight">Installation Guide</h2>
              <div className="bg-[#111118] border border-white/5 p-6 rounded-3xl shadow-md flex-1 flex flex-col justify-center">
                <ul className="space-y-5 text-sm text-gray-300">
                  {/* Step 1 */}
                  <li className="flex gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22d3ee]/20 text-[#22d3ee] flex items-center justify-center font-bold text-xs">1</span>
                    <span>Download all the provided game files or parts completely to your PC via our Telegram Channel.</span>
                  </li>
                  {/* Step 2 */}
                  <li className="flex gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22d3ee]/20 text-[#22d3ee] flex items-center justify-center font-bold text-xs">2</span>
                    <span>Once the download is 100% complete, move all files into a <strong>single, dedicated folder</strong> on your computer.</span>
                  </li>
                  {/* Step 3 */}
                  <li className="flex gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22d3ee]/20 text-[#22d3ee] flex items-center justify-center font-bold text-xs">3</span>
                    <span>Select the files, right-click, and choose &quot;Extract Here&quot; using software like <strong>WinRAR</strong> or <strong>7-Zip</strong>.</span>
                  </li>
                  {/* Step 4 */}
                  <li className="flex gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22d3ee]/20 text-[#22d3ee] flex items-center justify-center font-bold text-xs">4</span>
                    <span>Open the extracted folder, locate <code className="text-[#22d3ee] bg-black/30 px-1.5 py-0.5 rounded">setup.exe</code>, right-click it, and select <strong>&quot;Run as Administrator&quot;</strong> to install.</span>
                  </li>
                  {/* Step 5 */}
                  <li className="flex gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#22d3ee]/20 text-[#22d3ee] flex items-center justify-center font-bold text-xs">5</span>
                    <span>After installation finishes, launch the game from your desktop shortcut. <strong>Enjoy playing your game! 🎉</strong></span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            
            <div className="bg-[#111118] border border-white/5 p-6 rounded-3xl shadow-lg">
              <h3 className="text-lg font-bold mb-6 text-[#22d3ee] uppercase tracking-widest border-b border-white/10 pb-3">Structured Game Info</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-gray-500 text-sm">Publisher</span>
                  <span className="text-sm font-semibold text-gray-200">{game.publisher || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-gray-500 text-sm">Release Date</span>
                  <span className="text-sm font-semibold text-gray-200">{new Date(game.release_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-gray-500 text-sm">File Size</span>
                  <span className="text-sm font-semibold text-gray-200">{game.size_gb} GB</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3 items-center">
                  <span className="text-gray-500 text-sm">Player Rating</span>
                  <div className="text-right flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                     <RatingStars gameId={Number(game.id)} ratingAvg={game.rating_avg} ratingCount={game.rating_count} />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <SaveButton gameId={Number(game.id)} />
              </div>

              <div className="mt-6 p-4 bg-[#22d3ee]/5 border border-[#22d3ee]/10 rounded-2xl text-[11px] text-gray-400">
                <strong className="text-white block mb-1">Safety Notice:</strong>
                All files provided on our platform are safe, verified, and free of malware.
              </div>
            </div>

            <div className="bg-[#111118] border border-white/5 p-6 rounded-3xl shadow-lg">
               <h3 className="text-xl font-bold mb-4 tracking-tight">Community Discussions</h3>
               <CommentsSection gameId={Number(game.id)} />
            </div>

            <div className="flex-1 flex flex-col">
              <div className="bg-[#111118] border border-white/5 p-6 rounded-3xl shadow-lg flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-3 text-white tracking-tight uppercase">Share & Support</h3>
                  <p className="text-xs text-gray-400 mb-5">Love this game? Share it with your friends!</p>
                  
                  {/* 🔥 WhatsApp බටන් එකේ flex-1 bg-green-500/10 කියලා අකුරටම හැදුවා! */}
                  <div className="flex gap-2 mb-6">
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer" className="flex-1 bg-blue-600/10 text-blue-500 border border-blue-600/20 hover:bg-blue-600/20 py-2.5 rounded-xl flex justify-center items-center transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noreferrer" className="flex-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 py-2.5 rounded-xl flex justify-center items-center transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a58.973 58.973 0 0 0-1.056.002v-.002zm1.056 18.046c-.302 0-.256-.111-.363-.393l-1.127-3.712 8.448-7.619c.382-.34-.083-.528-.592-.188L9.278 12.56l-3.565-1.114c-.774-.241-.788-.772.161-1.144l13.91-5.357c.642-.24.966-.024.966.388v.001l-2.35 11.082c-.179.805-.662.998-1.334.618l-3.692-2.721-1.782 1.716c-.198.198-.363.364-.744.364l.263-3.804 6.918-6.248c.301-.268-.065-.417-.468-.151l-8.548 5.378-3.77-1.18c-.82-.256-.837-.819.171-1.214l14.73-5.676c.682-.257 1.284.156 1.058 1.059l-2.49 11.758c-.197.886-.719 1.11-1.425.71l-3.923-2.893-1.895 1.825c-.21.21-.387.388-.793.388l.28-4.044 7.355-6.642c.32-.289-.07-.444-.497-.161l-9.088 5.717z"/></svg>
                    </a>
                    <a href={`https://api.whatsapp.com/send?text=${shareText} ${shareUrl}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 py-2.5 rounded-xl flex justify-center items-center transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.383 0 0 5.383 0 12.031c0 2.128.552 4.135 1.543 5.912L0 24l6.23-1.605A11.96 11.96 0 0 0 12.03 24c6.649 0 12.03-5.383 12.03-12.031S18.68 0 12.031 0zm0 22.022c-1.815 0-3.535-.466-5.061-1.347l-.363-.215-3.763.987.997-3.668-.236-.376a9.998 9.998 0 0 1-1.552-5.372C2.052 6.48 6.51 2.022 12.03 2.022c5.52 0 9.979 4.458 9.979 9.979s-4.459 9.98-9.979 9.98zm5.474-7.465c-.3-.15-1.776-.877-2.053-.978-.276-.1-.477-.15-.677.15-.2.301-.777.978-.952 1.178-.175.2-.351.225-.651.075-.3-.15-1.268-.468-2.415-1.493-.892-.797-1.494-1.781-1.67-2.081-.175-.301-.019-.463.131-.613.135-.135.301-.351.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.677-1.631-.927-2.231-.243-.585-.49-.505-.677-.515-.175-.01-.376-.01-.577-.01-.2 0-.526.075-.801.375-.275.3-1.052 1.028-1.052 2.505s1.077 2.906 1.228 3.106c.15.2 2.118 3.232 5.132 4.534.717.31 1.277.495 1.713.633.72.228 1.376.196 1.892.119.578-.087 1.776-.727 2.027-1.428.25-.701.25-1.302.175-1.428-.076-.126-.276-.201-.577-.351z"/></svg>
                    </a>
                  </div>
                </div>

                <div className="mb-6 flex-1 flex items-center justify-center min-h-[120px]">
                  <a href="#" target="_blank" className="w-full h-full relative overflow-hidden rounded-2xl p-5 border border-sky-500/30 bg-gradient-to-br from-sky-900/40 to-[#111118] hover:border-sky-400/50 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] transition-all group flex flex-col items-center justify-center text-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <svg className="w-8 h-8 text-sky-400 mb-2 group-hover:scale-110 transition-transform relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a58.973 58.973 0 0 0-1.056.002v-.002zm1.056 18.046c-.302 0-.256-.111-.363-.393l-1.127-3.712 8.448-7.619c.382-.34-.083-.528-.592-.188L9.278 12.56l-3.565-1.114c-.774-.241-.788-.772.161-1.144l13.91-5.357c.642-.24.966-.024.966.388v.001l-2.35 11.082c-.179.805-.662.998-1.334.618l-3.692-2.721-1.782 1.716c-.198.198-.363.364-.744.364l.263-3.804 6.918-6.248c.301-.268-.065-.417-.468-.151l-8.548 5.378-3.77-1.18c-.82-.256-.837-.819.171-1.214l14.73-5.676c.682-.257 1.284.156 1.058 1.059l-2.49 11.758c-.197.886-.719 1.11-1.425.71l-3.923-2.893-1.895 1.825c-.21.21-.387.388-.793.388l.28-4.044 7.355-6.642c.32-.289-.07-.444-.497-.161l-9.088 5.717z"/></svg>
                    <span className="font-bold text-sm text-white block mb-0.5 relative z-10">Join our Telegram Channel</span>
                    <span className="text-xs text-sky-200/70 relative z-10">Get instant updates on new games!</span>
                  </a>
                </div>

                <div className="border-t border-white/5 pt-5">
                  <p className="text-xs text-gray-500 mb-3 text-center">Found a broken download link or issue?</p>
                  <button className="w-full bg-[rgba(239,68,68,0.1)] hover:bg-[rgba(239,68,68,0.15)] text-red-400 border border-red-500/20 py-3 rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2 group">
                    <svg className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    Report Dead Link
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}