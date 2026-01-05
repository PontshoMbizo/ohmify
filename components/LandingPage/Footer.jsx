import React from "react";

export default function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden pt-20">
      {/* Curved Top Background */}
      <div className="absolute top-0 h-full w-full bg-gradient-to-br from-green-500 via-green-600 to-green-800 rounded-t-[50%_10%]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-16 text-white">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          
          {/* Branding */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter">Ohmify</h3>
              <p className="mt-4 text-base leading-relaxed opacity-80">
                An innovative platform designed to help users learn and
                practice circuit design through interactive problem-solving.
                Bridging the gap between theory and hardware.
              </p>
            </div>
            
            {/* Socials */}
            <div className="flex gap-6">
              <a href="#" className="transition-transform hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="#" className="transition-transform hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4A49.55,49.55,0,0,1,5.3,18.4A2,2,0,0,1,3.9,17Z"/><path d="m10,15 l5,-3 -5,-3z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links Placeholder */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-1">
            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-widest text-green-200">Platform</h4>
              <ul className="space-y-2 opacity-80">
                <li><a href="/ComingSoon" className="hover:underline">Explore</a></li>
                <li><a href="/help" className="hover:underline">Information</a></li>
                <li><a href="/ComingSoon" className="hover:underline">Leaderboard</a></li>
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-widest text-green-200">Support</h4>
              <ul className="space-y-2 opacity-80">
                <li><a href="#" className="hover:underline">Contact</a></li>
                <li><a href="#" className="hover:underline">Privacy</a></li>
                <li><a href="#" className="hover:underline">Terms</a></li>
              </ul>
            </div>
          </div>

          {/* Video Preview */}
          <div className="flex flex-col gap-6">
             <h4 className="font-bold uppercase tracking-widest text-green-200">Preview Simulator</h4>
             <div className="group relative h-40 w-full overflow-hidden rounded-2xl bg-white/20 backdrop-blur-md transition-all hover:bg-white/30 cursor-pointer flex items-center justify-center border border-white/20">
                <span className="text-4xl transition-transform group-hover:scale-125">▶</span>
             </div>
          </div>
        </div>

        <div className="mt-20 border-t border-white/10 pt-8 text-center text-sm opacity-50">
          © {new Date().getFullYear()} Ohmify. Designed for future hardware engineers.
        </div>
      </div>
    </footer>
  );
}