"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/lib/useAuth";
import { backendFetch } from "@/src/lib/backend";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect, Suspense, useRef } from "react";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function toAbsoluteUrl(url: string | null | undefined) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${backend}${url}`;
}

interface SearchGame {
  id: number;
  title: string;
  cover_image_url: string | null;
  banner_image_url: string | null;
  size_gb: number;
  rating_avg: number | null;
}

function NavbarContent() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [showCat, setShowCat] = useState(false);
  const [isFetchingCats, setIsFetchingCats] = useState(true);

  const [searchResults, setSearchResults] = useState<SearchGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);

  // Scroll Progress Bar එකේ State එක
  const [scrollProgress, setScrollProgress] = useState(0);

  // Categories ගන්නවා
  useEffect(() => {
    fetch(`${backend}/api/admin/categories`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const fetchedCats = data.categories || (Array.isArray(data) ? data : []);
        setCategories(fetchedCats);
        setIsFetchingCats(false); 
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setIsFetchingCats(false); 
      });
  }, []);

  // Live Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      setShowSearchDropdown(true);
      
      fetch(`${backend}/api/games?q=${encodeURIComponent(searchQuery.trim())}&pageSize=5`)
        .then(res => res.json())
        .then(data => {
          const fetchedGames = (data.games || []) as SearchGame[];
          setSearchResults(fetchedGames);
          setIsSearching(false);
        })
        .catch(err => {
          console.error("Error searching games:", err);
          setIsSearching(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll වෙනකොට පිරෙන ඉර මනින කෝඩ් එක
  useEffect(() => {
    const handleScroll = () => {
      const scrollPx = document.documentElement.scrollTop;
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = winHeightPx > 0 ? (scrollPx / winHeightPx) * 100 : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function logout() {
    try {
      await backendFetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      window.location.href = `/games?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const sort = searchParams.get("sort");
  const catId = searchParams.get("categoryId");

  return (
    <div className="sticky top-0 z-[999] border-b border-[#1e293b] bg-[#0a0a0f]/95 backdrop-blur-2xl">
      
      {/* Scroll Progress Bar (පල්ලිහාට යද්දි පිරෙන නිල් ඉර) */}
      <div 
        className="absolute top-0 left-0 h-[3px] bg-[#22d3ee] z-[1000] transition-all duration-150 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
        style={{ width: `${scrollProgress}%` }}
      ></div>

      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
        
        {/* Logo Section */}
        <div className="flex items-center gap-6">
          {/* 🔥 Logo පින්තූරය අයින් කරලා කලින් තිබ්බ අකුරු ටිකම දැම්මා */}
          <Link href="/" className="font-black tracking-tight text-xl flex items-center gap-1 cursor-pointer relative z-50 transition-transform hover:scale-105">
            <span className="text-white">WC</span>
            <span className="text-[#22d3ee]">GAMES</span>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 font-medium text-sm text-gray-300">
            <Link href="/" className={`transition hover:text-white cursor-pointer ${pathname === "/" ? "text-[#22d3ee]" : ""}`}>
              Home
            </Link>
            
            <a href="/games" className={`transition hover:text-white cursor-pointer ${pathname === "/games" && !sort && !catId ? "text-[#22d3ee]" : ""}`}>
              All Games
            </a>
            
            <a href="/games?sort=popular" className={`transition hover:text-white cursor-pointer ${sort === "popular" ? "text-[#22d3ee]" : ""}`}>
              Top
            </a>
            
            <a href="/games?sort=trending" className={`transition hover:text-white cursor-pointer ${sort === "trending" ? "text-[#22d3ee]" : ""}`}>
              Trending
            </a>
               
            {user && (
              <Link href="/saved" className={`transition hover:text-white cursor-pointer ${pathname === "/saved" ? "text-[#22d3ee]" : ""}`}>
                Wishlist
              </Link>
            )}
            
            <div 
              className="relative py-2"
              onMouseEnter={() => setShowCat(true)} 
              onMouseLeave={() => setShowCat(false)}
            >
              <button 
                onClick={() => setShowCat(!showCat)} 
                className={`transition hover:text-white flex items-center gap-1 cursor-pointer ${catId ? "text-[#22d3ee]" : ""}`}
              >
                Category
                <svg className={`w-3 h-3 text-[#22d3ee] transition-transform ${showCat ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path></svg>
              </button>

              {showCat && (
                <div className="absolute top-full left-0 mt-0 w-48 bg-[#111118] border border-white/10 rounded-xl shadow-2xl py-2 flex flex-col before:absolute before:-top-4 before:left-0 before:w-full before:h-4">
                  {isFetchingCats ? (
                    <span className="px-4 py-3 text-xs text-[#22d3ee] italic">Loading...</span>
                  ) : categories.length > 0 ? (
                    categories.map(c => (
                      <a 
                        key={c.id} 
                        href={`/games?categoryId=${c.id}&catName=${encodeURIComponent(c.name)}`} 
                        className="px-4 py-2.5 text-sm text-gray-300 hover:bg-[#22d3ee]/10 hover:text-[#22d3ee] transition-colors cursor-pointer block"
                        onClick={() => setShowCat(false)}
                      >
                        {c.name}
                      </a>
                    ))
                  ) : (
                    <span className="px-4 py-3 text-xs text-gray-500 italic">No categories yet.</span>
                  )}
                </div>
              )}
            </div>
         
            
            {user?.role === "admin" && (
              <Link href="/admin" className={`transition hover:text-white cursor-pointer ${pathname === "/admin" ? "text-[#22d3ee]" : ""}`}>
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Right Side: Search + Actions */}
        <div className="flex items-center gap-4 relative z-50">
          
          <form ref={searchRef} onSubmit={handleSearch} className="hidden lg:flex relative items-center">
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              className="bg-[#0f172a] text-sm text-white border border-[#1e293b] rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee] transition-all w-48 xl:w-64 placeholder-gray-500"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>

            {/* Live Search Results Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#111118] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
                {isSearching ? (
                  <div className="px-4 py-4 text-center text-xs font-bold text-[#22d3ee] animate-pulse">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((game) => (
                      <a 
                        key={game.id} 
                        href={`/game/${game.id}`} 
                        className="flex items-center gap-3 p-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                      >
                        <img 
                          src={toAbsoluteUrl(game.cover_image_url || game.banner_image_url)} 
                          className="w-10 h-14 object-cover rounded shadow-md" 
                          alt={game.title} 
                        />
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sm font-bold text-white truncate group-hover:text-[#22d3ee] transition-colors">{game.title}</div>
                          <div className="text-[10px] text-gray-400 flex gap-2">
                             <span>{game.size_gb} GB</span>
                             <span className="text-[#22d3ee]">★ {Number(game.rating_avg || 0).toFixed(1)}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                    <button type="submit" className="p-2.5 text-center text-xs font-bold text-[#22d3ee] hover:bg-[#22d3ee]/10 bg-black/40 transition-colors">
                      View All Results &rarr;
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-5 text-center flex flex-col items-center gap-1">
                    <span className="text-xl">😢</span>
                    <span className="text-xs font-bold text-gray-400">No results found for &quot;{searchQuery}&quot;</span>
                  </div>
                )}
              </div>
            )}
          </form>

          <ThemeToggle />

          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              {/* අලුතින් එකතු කළ Dashboard Button එක */}
              <Link href="/dashboard" className="text-sm font-semibold text-[#22d3ee] hover:text-white transition-colors border border-[#22d3ee]/30 hover:border-[#22d3ee] px-4 py-1.5 rounded-full cursor-pointer">
                Dashboard
              </Link>
              
              <button
                type="button"
                onClick={logout}
                className="rounded-full px-5 py-1.5 text-sm font-semibold border border-[#1e293b] text-gray-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors border border-transparent hover:border-[#1e293b] px-4 py-1.5 rounded-full cursor-pointer">
                Log in
              </Link>
              <Link href="/register" className="text-sm font-bold text-[#0a0a0f] bg-[#22d3ee] hover:bg-[#06b6d4] px-5 py-1.5 rounded-full transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-pointer">
                Sign up
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 bg-[#0a0a0f]/80"></div>}>
      <NavbarContent />
    </Suspense>
  );
}