import React from 'react';
import { Sparkles, Terminal } from 'lucide-react';

export const LoadingScreen = () => {
  // We'll use a selection of avatar indices to display
  const displayAvatars = [1, 5, 12, 18, 25, 33];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden relative font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#06b6d415_0%,transparent_70%)]"></div>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      </div>

      {/* 3D Tilted Flowing Cards Container */}
      <div className="relative w-full max-w-lg h-64 perspective-1000 flex items-center justify-center z-10 mb-12">
        <div className="flex gap-4 animate-flow-3d transform-style-3d">
          {displayAvatars.map((num, i) => (
            <div 
              key={num}
              className="w-32 h-44 shrink-0 bg-slate-900 border-[3px] border-black rounded-2xl overflow-hidden shadow-[10px_10px_0_rgba(0,0,0,1)] transform rotate-y-20 hover:rotate-y-0 transition-transform duration-700 relative group"
              style={{ 
                animation: `float-3d 4s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            >
              <img 
                src={`/assets/playeravatar/CrystleHunterAvatar (${num}).jpg`} 
                className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" 
                alt="Loading..."
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/30 to-transparent"></div>
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-scanline pointer-events-none opacity-20"></div>
            </div>
          ))}
          {/* Double up for infinite flow illusion if needed, but simple float works for artistic vibe */}
        </div>
      </div>

      {/* Loading Status HUD */}
      <div className="w-full max-w-xs space-y-4 z-20 text-center px-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Terminal size={18} className="text-cyan-500 animate-pulse" />
          <h2 className="text-cyan-500 font-black uppercase tracking-[0.3em] text-sm drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            ESTABLISHING LINK
          </h2>
        </div>

        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
          Retrieving Hunter Signatures...<br/>
          <span className="text-cyan-400/50">Crystle Network Protocol v2.0.4</span>
        </p>

        <div className="relative pt-4">
          <div className="h-1 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
            <div className="h-full bg-cyan-500 animate-loading-bar-fast shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
          </div>
          {/* Decorative Sparks */}
          <Sparkles className="absolute -top-1 -left-4 text-cyan-400 animate-bounce group" size={12} />
          <Sparkles className="absolute -bottom-1 -right-4 text-cyan-400 animate-bounce delay-75" size={12} />
        </div>

        <div className="flex justify-between items-center text-[8px] font-black text-slate-600 uppercase mt-4">
           <span>DATA PKTS: SYNCED</span>
           <span className="animate-pulse">LATENCY: 14MS</span>
        </div>
      </div>

      {/* Bottom Legal/Version Decor */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-30 text-center">
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.5em] italic">CRYSTLE_WORLD_CORE_SYSTEM_OS</p>
      </div>
    </div>
  );
};
