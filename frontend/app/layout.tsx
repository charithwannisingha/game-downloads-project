import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "./_components/ThemeProvider";
import { Navbar } from "./_components/Navbar";

export const metadata: Metadata = {
  title: "WC GAMES",
  description: "Secure PC game downloads powered by Telegram + JWT tokens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white">
        <ThemeProvider>
          <Navbar />
          
          {/* Main Content Area */}
          <div className="flex-grow">
            {children}
          </div>

          {/* Professional Footer */}
          <footer className="mt-auto border-t border-white/10 bg-[#060609] pt-12 pb-6">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              
              {/* Top Section - 4 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10 border-b border-white/5 pb-10">
                
                {/* 1. Brand & About */}
                <div className="col-span-1 sm:col-span-2 md:col-span-1">
                  <Link href="/" className="font-black tracking-tight text-2xl flex items-center gap-1 mb-4 transition-transform hover:scale-105 w-max">
                    <span className="text-white">WC</span>
                    <span className="text-[#22d3ee]">GAMES</span>
                  </Link>
                  <p className="text-xs text-gray-400 leading-relaxed mb-6 pe-4">
                    Your ultimate destination for secure and fast PC game downloads. Powered by Telegram + JWT tokens for a seamless experience.
                  </p>
                  
                  {/* Social Media Icons */}
                  <div className="flex items-center gap-4">
                    {/* Telegram */}
                    <a href="#" className="text-gray-500 hover:text-[#22d3ee] transition-colors" aria-label="Telegram" title="Telegram">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.05-.19-.02-.27 0-.11.03-1.9 1.21-5.37 3.55-.51.35-.96.52-1.38.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.48 1-.74 3.91-1.7 6.52-2.83 7.82-3.37 3.73-1.56 4.51-1.83 5.02-1.84.11 0 .36.03.49.15.11.1.15.24.16.37-.01.07-.01.21-.02.23z"/></svg>
                    </a>
                    {/* Discord */}
                    <a href="#" className="text-gray-500 hover:text-[#22d3ee] transition-colors" aria-label="Discord" title="Discord">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
                    </a>
                    {/* YouTube */}
                    <a href="#" className="text-gray-500 hover:text-[#22d3ee] transition-colors" aria-label="YouTube" title="YouTube">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.582 6.186a2.6 2.6 0 00-1.834-1.846C18.136 3.9 12 3.9 12 3.9s-6.136 0-7.748.44A2.608 2.608 0 002.418 6.186C2 7.822 2 12 2 12s0 4.178.418 5.814a2.608 2.608 0 001.834 1.846C5.864 20.1 12 20.1 12 20.1s6.136 0 7.748-.44a2.608 2.608 0 001.834-1.846C22 16.178 22 12 22 12s0-4.178-.418-5.814zM9.982 15.556V8.444L16.2 12l-6.218 3.556z"/></svg>
                    </a>
                    {/* Twitter / X */}
                    <a href="#" className="text-gray-500 hover:text-[#22d3ee] transition-colors" aria-label="Twitter / X" title="X">
                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                    </a>
                  </div>
                </div>

                {/* 2. Quick Links */}
                <div>
                  <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest border-l-2 border-[#22d3ee] pl-2">Quick Links</h3>
                  <ul className="space-y-2.5">
                    <li><Link href="/" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">Home</Link></li>
                    <li><Link href="/games" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">Browse All Games</Link></li>
                    <li><Link href="/games?sort=trending" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">Trending Now</Link></li>
                    <li><Link href="/saved" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">My Wishlist</Link></li>
                  </ul>
                </div>

                {/* 3. Popular Categories */}
                <div>
                  <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest border-l-2 border-[#22d3ee] pl-2">Categories</h3>
                  <ul className="space-y-2.5">
                    <li><Link href="/games?categoryId=1" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">Action & Adventure</Link></li>
                    <li><Link href="/games?categoryId=2" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">Role Playing (RPG)</Link></li>
                    <li><Link href="/games?categoryId=3" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">Racing & Sports</Link></li>
                    <li><Link href="/games?categoryId=4" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">Simulation</Link></li>
                  </ul>
                </div>

                {/* 4. Support & Legal */}
                <div>
                  <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest border-l-2 border-[#22d3ee] pl-2">Support & Legal</h3>
                  <ul className="space-y-2.5">
                    <li><Link href="/faq" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">FAQ & Help</Link></li>
                    <li><Link href="/contact" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">Contact Us</Link></li>
                    <li><Link href="/privacy" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">Privacy Policy</Link></li>
                    <li><Link href="/dmca" className="text-xs text-gray-400 hover:text-[#22d3ee] hover:translate-x-1 inline-block transition-transform">DMCA Disclaimer</Link></li>
                  </ul>
                </div>

              </div>

              {/* Bottom Copyright Section */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-[11px] text-gray-500 font-medium">
                  &copy; {new Date().getFullYear()} WC GAMES. All Rights Reserved.
                </div>
                
                <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                  Developed with <span className="text-red-500 animate-pulse text-sm">❤</span> by 
                  <a href="#" className="text-[#22d3ee] hover:text-white font-bold tracking-wider transition-colors"> WhiteCoder</a>
                </div>
              </div>

            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}