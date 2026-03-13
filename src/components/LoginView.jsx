import React from 'react';
import { Sword, Shield, Zap, Globe, Lock, ChevronRight } from 'lucide-react';

export const LoginView = ({ handleGoogleLogin }) => {
  // We can use a few avatar indices for a background "Hunter Registry" effect
  const bgAvatars = [3, 8, 15, 22, 29, 36];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* --- Dynamic Background --- */}
      <div className="absolute inset-0 z-0">
        {/* Scrolling Hunter Grid - Holographic Database */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none overflow-hidden hover:opacity-[0.12] transition-opacity duration-1000">
          <div className="absolute flex flex-wrap gap-4 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 rotate-12 animate-scroll-diag">
             {[...Array(60)].map((_, i) => (
                <div key={i} className="w-24 h-24 rounded-xl border border-cyan-400 overflow-hidden relative group">
                   <img 
                      src={`/assets/playeravatar/CrystleHunterAvatar (${(i % 34) + 1}).jpg`} 
                      className="w-full h-full object-cover grayscale brightness-150 contrast-125" 
                      alt="" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                   />
                   <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay"></div>
                   <div className="absolute inset-0 bg-scanline opacity-30"></div>
                </div>
             ))}
          </div>
        </div>

        {/* Neon Grid Floor */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: `linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)`,
               backgroundSize: '40px 40px',
               transform: 'perspective(600px) rotateX(70deg) translateY(200px) scale(2)',
               transformOrigin: 'bottom'
             }}>
        </div>
        
        {/* Floating Spotlight Hunters */}
        <div className="absolute inset-0 flex items-center justify-between px-20 opacity-20 blur-[1px] pointer-events-none hidden md:flex">
          {[12, 25].map((num, i) => (
             <div key={i} 
                  className="w-48 h-64 rounded-3xl overflow-hidden border-[4px] border-cyan-500/30 animate-float-slow transform shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                  style={{ 
                    animationDelay: `${i * 2}s`,
                    transform: `rotateY(${i === 0 ? '-30deg' : '30deg'})`
                  }}>
               <img 
                  src={`/assets/playeravatar/CrystleHunterAvatar (${num}).jpg`} 
                  className="w-full h-full object-cover" 
                  alt="" 
                  onError={(e) => { e.target.style.display = 'none'; }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-cyan-900 via-transparent to-transparent"></div>
               <div className="absolute bottom-4 w-full text-center text-[10px] font-black text-cyan-400 uppercase tracking-widest italic">Signal: Stored</div>
             </div>
          ))}
        </div>

        {/* Energy Pulse Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      </div>

      {/* --- Main Hero Card --- */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Floating Accents */}
        <div className="absolute -top-12 -left-8 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

        <div className="bg-slate-900/40 backdrop-blur-xl border-[3px] border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          
          {/* Title Area */}
          <div className="text-center relative mb-10 mt-4">
             <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
                <div className="w-20 h-20 bg-slate-950 border-[3px] border-cyan-500 rounded-2xl flex items-center justify-center transform -rotate-12 shadow-2xl relative z-10">
                   <Sword size={40} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </div>
                <div className="absolute -right-4 -bottom-2 w-10 h-10 bg-slate-900 border-2 border-purple-500 rounded-xl flex items-center justify-center transform rotate-12 z-20 shadow-xl">
                   <Shield size={18} className="text-purple-400" />
                </div>
             </div>
             
             <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2 italic">
               Crystle <span className="text-cyan-500 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">Hunter</span>
             </h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">World Protocol v2.1</p>
             
             <div className="flex items-center justify-center gap-4 text-slate-400">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-700"></div>
                <Globe size={12} className="opacity-50" />
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-700"></div>
             </div>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-3 mb-10">
             {[
               { icon: <Zap size={10} />, label: "Instant Sync" },
               { icon: <Lock size={10} />, label: "Secure Link" }
             ].map((f, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-full py-1.5 px-3 flex items-center justify-center gap-2">
                   <span className="text-cyan-500">{f.icon}</span>
                   <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{f.label}</span>
                </div>
             ))}
          </div>

          {/* Login Button */}
          <div className="space-y-4 relative">
             <button
               onClick={handleGoogleLogin}
               className="w-full h-16 bg-white hover:bg-slate-100 text-black rounded-2xl flex items-center justify-between px-6 transition-all transform active:scale-[0.98] group relative overflow-hidden shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
             >
                <div className="flex items-center gap-4">
                   <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                   </div>
                   <span className="text-sm font-black uppercase tracking-tight italic">Initialize Connection</span>
                </div>
                <div className="bg-black text-white p-1 rounded-lg">
                   <ChevronRight size={18} />
                </div>
                
                {/* Button Hover Glow */}
                <div className="absolute inset-0 bg-cyan-500/0 hover:bg-cyan-500/5 transition-colors pointer-events-none"></div>
             </button>
             
             <p className="text-[7px] text-center text-slate-500 font-black uppercase tracking-[0.2em] px-4 leading-relaxed">
                By connecting you agree to synchronize with the Decentralized Hunter Registry. No personal data is stored locally.
             </p>
          </div>
        </div>

        {/* Floating Data Badge */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900 border-2 border-cyan-500/30 px-4 py-2 rounded-full shadow-xl">
           <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></div>
           <span className="text-[8px] font-black text-white uppercase italic tracking-widest">Global Hunt Active</span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 w-full text-center px-6">
        <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.6em] transition-all hover:text-cyan-600 cursor-default">
          HUNT.CRYSTLE.WORLD // 2026_CORE
        </p>
      </div>
    </div>
  );
};
