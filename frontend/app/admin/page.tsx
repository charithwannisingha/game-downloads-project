"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/lib/useAuth";
import { backendUrl } from "@/src/lib/backend";
import Link from "next/link";

type Category = { id: number; name: string };
type GameRow = {
  id: number;
  title: string;
  sizeGB?: number;
  version?: string;
  releaseDate?: string;
  categoryName?: string;
  download_url?: string;
  telegramFileId?: string;
  telegram_file_id?: string;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [catName, setCatName] = useState("");
  const [busy, setBusy] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [downloadUrl, setDownloadUrl] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    sizeGB: "10",
    version: "Latest",
    releaseDate: new Date().toISOString().slice(0, 10),
    publisher: "",
    categoryId: "",
    trailerUrl: "",
    bannerUrl: "",
    coverUrl: "",
    os: "Windows 10 64-bit",
    processor: "Intel Core i5 / AMD Ryzen 5",
    memory: "8 GB RAM",
    graphics: "NVIDIA GTX 1060 / AMD RX 580",
    directx: "Version 12",
    storage: "50 GB available space",
  });
  
  const [screenshots, setScreenshots] = useState<string[]>(["", "", "", ""]);

  function isAdmin() { return user?.role === "admin"; }

  async function load() {
    try {
      const [catRes, gamesRes] = await Promise.all([
        fetch(backendUrl(`/api/admin/categories`), { credentials: "include" }),
        fetch(backendUrl(`/api/admin/games`), { credentials: "include" }),
      ]);
      const catJson = await catRes.json();
      const gamesJson = await gamesRes.json();
      setCategories(catJson.categories ?? []);
      setGames(gamesJson.games ?? []);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    if (!loading && user && isAdmin()) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  async function autoFillGame() {
    if (!form.title.trim()) { alert("Please enter a Game Title!"); return; }
    
    const RAWG_API_KEY = "34a7905bd21b4b0cab8bbbfc6efe125e"; 
    setIsFetchingData(true);

    try {
      const searchRes = await fetch(`https://api.rawg.io/api/games?search=${encodeURIComponent(form.title)}&key=${RAWG_API_KEY}`);
      const searchData = await searchRes.json();
      if (!searchData.results?.length) { alert("Game not found!"); return; }

      const gameId = searchData.results[0].id;
      const [detailRes, ssRes, moviesRes] = await Promise.all([
        fetch(`https://api.rawg.io/api/games/${gameId}?key=${RAWG_API_KEY}`),
        fetch(`https://api.rawg.io/api/games/${gameId}/screenshots?key=${RAWG_API_KEY}`),
        fetch(`https://api.rawg.io/api/games/${gameId}/movies?key=${RAWG_API_KEY}`)
      ]);

      const g = await detailRes.json();
      const ss = await ssRes.json();
      const mv = await moviesRes.json();

      // 🔥 'any' error fix: Define types for rawg api objects
      const pcPlatform = g.platforms?.find((p: { platform: { slug: string }; requirements: { minimum: string } }) => p.platform.slug === "pc");
      const reqText = (pcPlatform?.requirements?.minimum || "").replace(/<[^>]*>?/gm, '\n'); 
      
      const extractReq = (keyword: string) => {
          const regex = new RegExp(`${keyword}[\\s:]+(.*?)(?=\\n|$)`, 'i');
          const match = reqText.match(regex);
          return match ? match[1].trim() : "";
      };

      let matchedCategoryId = form.categoryId;
      if (g.genres && g.genres.length > 0) {
          const rawgGenre = g.genres[0].name.toLowerCase();
          const foundCat = categories.find(c => 
              c.name.toLowerCase().includes(rawgGenre) || 
              rawgGenre.includes(c.name.toLowerCase()) ||
              (rawgGenre === 'racing' && c.name.toLowerCase().includes('car')) 
          );
          if (foundCat) { matchedCategoryId = String(foundCat.id); }
      }

      setForm(f => ({
        ...f,
        title: g.name,
        description: g.description_raw || f.description,
        releaseDate: g.released || f.releaseDate,
        publisher: g.publishers?.[0]?.name || g.developers?.[0]?.name || f.publisher,
        categoryId: matchedCategoryId,
        bannerUrl: g.background_image || f.bannerUrl,
        coverUrl: g.background_image_additional || g.background_image || f.coverUrl,
        trailerUrl: mv.results?.[0]?.data?.max || f.trailerUrl,
        os: extractReq("OS") || extractReq("Windows") || f.os,
        processor: extractReq("Processor") || extractReq("CPU") || f.processor,
        memory: extractReq("Memory") || extractReq("RAM") || f.memory,
        graphics: extractReq("Graphics") || extractReq("Video") || extractReq("GPU") || f.graphics,
        directx: extractReq("DirectX") || f.directx,
        storage: extractReq("Storage") || extractReq("Hard Drive") || f.storage,
      }));
      
      const newSS = ["", "", "", ""];
      ss.results?.slice(0, 4).forEach((s: { image: string }, i: number) => { newSS[i] = s.image; });
      setScreenshots(newSS);

      alert("Auto Fill Done! Check your fields.");

    } catch (err) {
      console.error(err);
      alert("Error fetching data!");
    } finally {
      setIsFetchingData(false);
    }
  }

  async function loadGameForEdit(gameId: number) {
      setBusy(true);
      setError(null);
      try {
          const res = await fetch(backendUrl(`/api/games/${gameId}`));
          if (!res.ok) throw new Error("Failed to load game details");
          const data = await res.json();
          const g = data.game;

          setForm({
              title: g.title || "",
              description: g.description || "",
              sizeGB: String(g.size_gb || "10"),
              version: g.version || "Latest",
              releaseDate: g.release_date ? new Date(g.release_date).toISOString().slice(0, 10) : "",
              publisher: g.publisher || "",
              categoryId: String(g.category_id || (categories.length > 0 ? categories[0].id : "")),
              trailerUrl: g.trailer_youtube_url || "",
              bannerUrl: g.banner_image_url || "",
              coverUrl: g.cover_image_url || "",
              os: g.os || "Windows 10 64-bit",
              processor: g.processor || "Intel Core i5 / AMD Ryzen 5",
              memory: g.memory || "8 GB RAM",
              graphics: g.graphics || "NVIDIA GTX 1060 / AMD RX 580",
              directx: g.directx || "Version 12",
              storage: g.storage || "50 GB available space",
          });

          setDownloadUrl(g.download_url || g.telegramFileId || g.telegram_file_id || "");

          const newScreenshots = ["", "", "", ""];
          if (g.screenshots && g.screenshots.length > 0) {
              g.screenshots.slice(0, 4).forEach((s: { image_url: string }, i: number) => {
                  newScreenshots[i] = s.image_url || "";
              });
          }
          setScreenshots(newScreenshots);
          setEditingId(gameId);

          window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch (err) {
          alert("Error loading game for editing.");
      } finally {
          setBusy(false);
      }
  }

  function resetForm() {
      setForm({ 
        title: "", description: "", publisher: "", trailerUrl: "", bannerUrl: "", coverUrl: "",
        sizeGB: "10", version: "Latest", releaseDate: new Date().toISOString().slice(0, 10), categoryId: categories.length > 0 ? String(categories[0].id) : "",
        os: "Windows 10 64-bit", processor: "Intel Core i5 / AMD Ryzen 5", memory: "8 GB RAM", graphics: "NVIDIA GTX 1060 / AMD RX 580", directx: "Version 12", storage: "50 GB available space"
      });
      setScreenshots(["", "", "", ""]);
      setDownloadUrl("");
      setEditingId(null);
  }

  async function saveGame() {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("sizeGB", form.sizeGB);
      fd.append("version", form.version);
      fd.append("releaseDate", form.releaseDate);
      fd.append("publisher", form.publisher);
      fd.append("categoryId", form.categoryId || (categories.length > 0 ? String(categories[0].id) : ""));
      
      fd.append("os", form.os);
      fd.append("processor", form.processor);
      fd.append("memory", form.memory);
      fd.append("graphics", form.graphics);
      fd.append("directx", form.directx);
      fd.append("storage", form.storage);

      if (form.trailerUrl) fd.append("trailerUrl", form.trailerUrl);
      if (form.bannerUrl) fd.append("bannerUrl", form.bannerUrl);
      if (form.coverUrl) fd.append("coverUrl", form.coverUrl);
      
      const validScreenshots = screenshots.filter(url => url.trim() !== "");
      fd.append("screenshotsStr", JSON.stringify(validScreenshots));

      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId ? `/api/admin/games/${editingId}` : `/api/admin/games`;

      const res = await fetch(backendUrl(endpoint), {
        method: method,
        credentials: "include",
        body: fd,
      });
      
      if (!res.ok) throw new Error("Failed to save game");

      let savedGameId = editingId;
      try {
        const resData = await res.json();
        savedGameId = savedGameId || resData.game?.id || resData.id || resData.gameId || resData.insertId;
      } catch (e) {}

      if (!savedGameId) {
        const listRes = await fetch(backendUrl('/api/admin/games'), { credentials: 'include' });
        const listData = await listRes.json();
        // 🔥 'any' error fix: Use type for matched game object
        const matched = listData.games?.find((g: { title: string; id: number }) => g.title === form.title);
        if (matched) savedGameId = matched.id;
      }

      if (savedGameId) {
         await fetch(backendUrl(`/api/admin/games/${savedGameId}/download`), {
           method: "POST",
           credentials: "include",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ telegramFileId: downloadUrl, download_url: downloadUrl }),
         });
      }
      
      resetForm();
      await load();
      alert(editingId ? "Game updated successfully!" : "Game added successfully!");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save game");
    } finally {
      setBusy(false);
    }
  }

  async function addCategory() {
    setBusy(true);
    try {
      const res = await fetch(backendUrl(`/api/admin/categories`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      setCatName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const openReqSearch = () => {
    if (!form.title) return alert("Please type a Game Title first!");
    window.open(`https://www.google.com/search?q=${encodeURIComponent(form.title + ' pc system requirements minimum')}`, '_blank');
  };

  const openYoutubeSearch = () => {
    if (!form.title) return alert("Please type a Game Title first!");
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(form.title + ' official trailer')}`, '_blank');
  };

  const openBannerSearch = () => {
    if (!form.title) return alert("Please type a Game Title first!");
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(form.title + ' game wallpaper horizontal 1920x1080 no text')}`, '_blank');
  };

  const openCoverSearch = () => {
    if (!form.title) return alert("Please type a Game Title first!");
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(form.title + ' game poster cover vertical high quality')}`, '_blank');
  };

  function handleScreenshotChange(url: string, index: number) {
    setScreenshots(prev => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
  }

  if (loading) return <div className="mx-auto w-full max-w-4xl px-4 py-10 text-sm text-gray-400">Loading...</div>;
  if (!user || !isAdmin()) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="glass neon-border rounded-3xl p-6">
          <h1 className="text-lg font-black tracking-tight">Admin only</h1>
          <p className="mt-2 text-sm text-gray-400">Your account needs `admin` role.</p>
        </div>
      </main>
    );
  }

  const activeCategoryId = form.categoryId || (categories[0]?.id ? String(categories[0].id) : "");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 text-white bg-[#0a0a0f] min-h-screen">
      <div className="glass neon-border rounded-3xl p-5 sm:p-6 border border-white/5 bg-white/5 backdrop-blur-xl">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-[#22d3ee]">Admin Dashboard</h1>

        {error ? <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          <section className="lg:col-span-4 bg-[#111118] p-6 rounded-3xl border border-white/5">
            <h2 className="font-bold text-lg mb-4 text-[#22d3ee]">1. Categories</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category Name</label>
                <div className="flex items-center gap-2">
                  <input value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" placeholder="e.g. Action" />
                  <button type="button" onClick={addCategory} disabled={busy || !catName.trim()} className="neon-border glass bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50">Add</button>
                </div>
              </div>
              <div className="max-h-64 overflow-auto rounded-xl border border-white/5 bg-black/10">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 border-b border-white/5 last:border-b-0 hover:bg-white/5">
                    <span className="text-sm">{c.name}</span>
                    <button type="button" onClick={async () => { setBusy(true); try { await fetch(backendUrl(`/api/admin/categories/${c.id}`), { method: "DELETE", credentials: "include" }); await load(); } finally { setBusy(false); } }} className="rounded-lg border border-red-400/35 bg-[rgba(239,68,68,0.12)] px-3 py-1 text-xs hover:brightness-110 disabled:opacity-50" disabled={busy}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="lg:col-span-8 bg-[#111118] p-6 rounded-3xl border border-white/5">
            <h2 className="font-bold text-lg mb-4 text-[#22d3ee]">
               {editingId ? "2. Edit Game" : "2. Add Game"}
            </h2>
            <div className="space-y-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  Game Title
                  <span className="text-[#22d3ee] font-normal lowercase tracking-normal">Type a name and click Auto Fill</span>
                </label>
                <div className="flex items-center gap-2">
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" placeholder="e.g. Cyberpunk 2077" />
                  <button type="button" onClick={autoFillGame} disabled={isFetchingData || !form.title.trim()} className="whitespace-nowrap bg-gradient-to-r from-purple-600 to-[#22d3ee] text-white border-none hover:opacity-90 rounded-xl px-5 py-2.5 text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-50 transition-all flex items-center gap-2">
                    {isFetchingData ? "Fetching..." : "✨ Auto Fill"}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Developer / Publisher</label>
                  <input value={form.publisher} onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Game Category</label>
                  <select value={activeCategoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]">
                    {categories.map((c) => ( <option key={c.id} value={c.id}>{c.name}</option> ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">File Size (GB)</label>
                  <input value={form.sizeGB} onChange={(e) => setForm((f) => ({ ...f, sizeGB: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Game Version</label>
                  <input value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Release Date</label>
                  <input type="date" value={form.releaseDate} onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">About This Game (Description)</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="min-h-32 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
              </div>

              <div className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                <h4 className="font-semibold text-gray-300 flex justify-between items-center">
                    System Requirements (Minimum)
                    <button type="button" onClick={openReqSearch} className="text-[#22d3ee] bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg text-xs font-bold transition-colors">
                        🔍 Search on Google
                    </button>
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">OS</label>
                      <input value={form.os} onChange={(e) => setForm((f) => ({ ...f, os: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Processor (CPU)</label>
                      <input value={form.processor} onChange={(e) => setForm((f) => ({ ...f, processor: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Memory (RAM)</label>
                      <input value={form.memory} onChange={(e) => setForm((f) => ({ ...f, memory: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Graphics (GPU)</label>
                      <input value={form.graphics} onChange={(e) => setForm((f) => ({ ...f, graphics: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">DirectX</label>
                      <input value={form.directx} onChange={(e) => setForm((f) => ({ ...f, directx: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Storage Space</label>
                      <input value={form.storage} onChange={(e) => setForm((f) => ({ ...f, storage: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                    </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                   YouTube Trailer URL
                   <button type="button" onClick={openYoutubeSearch} className="text-[#22d3ee] bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold transition-colors">
                       🔍 Find on YouTube
                   </button>
                </label>
                <input value={form.trailerUrl} onChange={(e) => setForm((f) => ({ ...f, trailerUrl: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
              </div>
              
              <div className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                <h4 className="font-semibold text-gray-300">Game Media (URLs)</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                            Banner Image URL
                            <button type="button" onClick={openBannerSearch} className="text-[#22d3ee] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md text-[9px] font-bold transition-colors">🔍 Google Image</button>
                        </label>
                        <input type="text" value={form.bannerUrl} onChange={(e) => setForm((f) => ({ ...f, bannerUrl: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                           Cover Image URL 
                           <button type="button" onClick={openCoverSearch} className="text-[#22d3ee] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md text-[9px] font-bold transition-colors">🔍 Google Image</button>
                        </label>
                        <input type="text" value={form.coverUrl} onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[#22d3ee]" />
                    </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                <h4 className="font-semibold text-gray-300">Game Screenshots Gallery (URLs)</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {screenshots.map((url, index) => (
                    <div key={index} className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Screenshot {index + 1}</label>
                      <input type="text" value={url} onChange={(e) => handleScreenshotChange(e.target.value, index)} className="w-full text-xs text-gray-300 border border-white/10 bg-black/30 px-2 py-2 rounded-lg outline-none focus:border-[#22d3ee]" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 p-5 bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                <label className="text-sm font-bold text-[#22d3ee] uppercase tracking-wider">Telegram Download Link</label>
                <input type="url" value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} placeholder="https://t.me/your_channel/123" className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm outline-none focus:border-[#22d3ee] mt-1" />
                <p className="text-xs text-gray-400 mt-1">This is the link users will be redirected to when they click the Download button.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={saveGame} disabled={busy} className="bg-[#22d3ee] text-black hover:bg-[#06b6d4] flex-1 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50 transition-colors">
                  {busy ? "Saving..." : editingId ? "Update Game" : "Create Game & Publish"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl px-6 py-3 text-sm font-bold transition-colors">
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 bg-[#111118] p-6 rounded-3xl shadow-lg">
          <h2 className="font-black text-2xl mb-6 tracking-tighter text-[#22d3ee]">3. Manage Games</h2>
          <div className="space-y-4">
            {games.length ? (
              games.map((g) => <AdminGameRow key={g.id} game={g} busy={busy} load={load} onEdit={loadGameForEdit} />)
            ) : (
              <div className="text-center p-10 bg-black/10 rounded-2xl border border-white/5">
                <p className="text-gray-400">No games added yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function AdminGameRow({
  game,
  busy,
  load,
  onEdit,
}: {
  game: GameRow;
  busy: boolean;
  load: () => Promise<void>;
  onEdit: (gameId: number) => void;
}) {

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-lg relative overflow-hidden transition-colors hover:bg-black/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="font-bold text-lg text-white truncate">{game.title}</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-gray-400 items-center">
            {game.categoryName && <span className="bg-white/10 px-2 py-1 rounded-md">{game.categoryName}</span>}
            <span className="bg-white/10 text-[#22d3ee] px-2 py-1 rounded-md">v{game.version || "Latest"}</span>
            <span className="bg-white/10 px-2 py-1 rounded-md">{game.sizeGB} GB</span>
          </div>
        </div>

        <div className="flex gap-2 sm:flex-row flex-col justify-end flex-shrink-0">
          <button type="button" onClick={() => window.location.assign(`/game/${game.id}`)} className="rounded-lg border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/20 transition-colors text-center w-full sm:w-auto">View Page</button>
          
          <button type="button" onClick={() => onEdit(game.id)} disabled={busy} className="rounded-lg border border-[#22d3ee]/30 text-[#22d3ee] bg-[#22d3ee]/10 px-4 py-2.5 text-xs font-bold hover:bg-[#22d3ee]/20 transition-colors text-center w-full sm:w-auto">Edit Game</button>
          
          <button type="button" disabled={busy} onClick={async () => { if(confirm("Are you sure you want to delete this game?")){ try { await fetch(backendUrl(`/api/admin/games/${game.id}`), { method: "DELETE", credentials: "include" }); await load(); } catch(e){} } }} className="rounded-lg border border-red-500/30 text-red-400 bg-red-500/10 px-4 py-2.5 text-xs font-bold hover:bg-red-500/20 disabled:opacity-50 transition-colors text-center w-full sm:w-auto">Delete</button>
        </div>
      </div>
    </div>
  );
}