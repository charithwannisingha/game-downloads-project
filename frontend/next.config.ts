import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ඔයාගේ පරණ ලෝකල්හොස්ට් ලින්ක් ටික
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/uploads/**" },
      // අලුතින් එන ඉන්ටර්නෙට් පින්තූර (RAWG වගේ) වලට අවසර දෙන කෑල්ල
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;