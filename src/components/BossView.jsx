import React from 'react';
import { MousePointer, Coffee, Wind, Zap } from 'lucide-react';
import { BossImpactSplash } from './CombatEffects';

const BossAvatarMedia = ({ bossIdx, animated, className, BOSS_MEDIA_FILES }) => {
  const media = BOSS_MEDIA_FILES[bossIdx] || BOSS_MEDIA_FILES[0];
  if (animated && media.vid) {
    return (
      <video
        key={media.vid}
        className={className}
        autoPlay loop muted playsInline
        poster={media.img}
      >
        <source src={media.vid} type="video/mp4" />
      </video>
    );
  }
  return <img src={media.img} className={className} alt="Boss" loading="lazy" />;
};

export const BossView = ({
  isHurt, enemyFlinch, bossAvatarIdx, showBossVideo, setShowBossVideo, BOSS_MEDIA_FILES, impactSplash, BOSS, player, autoTimeLeft, activateAutoScroll, handleHeal, handleAttack, setView, syncPlayer
}) => {
  return (
    <div className={`flex-1 p-8 flex flex-col items-center justify-center gap-6 text-center relative overflow-hidden ${isHurt ? 'animate-damage' : ''}`}>
      {/* Halftone Overlay HUD */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      
      <div className={`relative ${enemyFlinch ? 'animate-flinch' : ''}`}>
        <div className="bg-black/60 w-64 h-64 border-[8px] border-red-600 shadow-[0_0_60px_rgba(239,68,68,0.4)] relative overflow-hidden group mx-auto">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ef4444_0%,transparent_70%)] opacity-20 animate-pulse z-10"></div>
           <BossAvatarMedia bossIdx={bossAvatarIdx} animated={showBossVideo} className="w-full h-full object-cover grayscale-[0.2] contrast-[1.2] brightness-[0.8]" BOSS_MEDIA_FILES={BOSS_MEDIA_FILES} />
           
           <button 
             onClick={(e) => { e.stopPropagation(); setShowBossVideo(!showBossVideo); }}
             className="absolute bottom-2 right-2 z-20 bg-black/80 p-2 border-2 border-red-600 text-white hover:bg-red-600 transition-colors shadow-lg"
           >
             {showBossVideo ? <Wind size={14} /> : <Zap size={14} />}
           </button>
        </div>
        
        <BossImpactSplash splash={impactSplash} />
      </div>

      <div className="relative transform rotate-1">
        <div className="bg-red-600 text-white px-8 py-3 border-[6px] border-black shadow-[10px_10px_0_rgba(0,0,0,1)] inline-block">
           <h2 className="text-6xl font-black uppercase tracking-tighter italic drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]">{BOSS.name}</h2>
        </div>
        <div className="absolute -top-3 -right-4 bg-black text-red-500 px-3 py-1 text-xs font-black border-[3px] border-red-500 transform rotate-6 shadow-lg">
           LEVEL: Ω
        </div>
      </div>

      <div className="w-full max-w-lg space-y-4">
        <div className="h-8 bg-black border-[4px] border-white/20 p-1.5 relative shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden">
          <div className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.5)]" style={{ width: `100%` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] drop-shadow-md">Core Integrity: Stable</p>
          </div>
        </div>
        
        <div className="bg-slate-900/80 backdrop-blur-md border-[4px] border-black p-4 rounded-xl flex justify-between items-center shadow-[6px_6px_0_rgba(0,0,0,1)] gap-4">
           <div className="text-left flex-1">
              <p className="text-[10px] font-black text-red-400 uppercase italic">Boss Damage Dealt</p>
              <p className="text-3xl font-black text-white italic drop-shadow-md">{(player.totalBossDamage || 0).toLocaleString()}</p>
           </div>
           <div className="flex gap-2">
             {player.autoScrolls > 0 && autoTimeLeft <= 0 && (
               <button onClick={activateAutoScroll} className="flex items-center gap-2 bg-cyan-600 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-cyan-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
                 <MousePointer size={16} className="text-black" />
                 <div className="flex flex-col items-start bg-transparent">
                   <span className="text-[7px] font-black uppercase tracking-widest text-black/70 leading-none italic">Auto</span>
                   <span className="text-xs font-black leading-none text-black italic">{player.autoScrolls} SCROLLS</span>
                 </div>
               </button>
             )}
             {autoTimeLeft > 0 && (
               <div className="flex items-center gap-2 bg-cyan-600/20 border-[3px] border-cyan-500/50 px-4 py-2 rounded-xl shadow-lg animate-pulse">
                 <MousePointer size={16} className="text-cyan-400" />
                 <div className="flex flex-col items-start bg-transparent">
                   <span className="text-[7px] font-black uppercase tracking-widest text-cyan-400/70 leading-none italic">Active</span>
                   <span className="text-xs font-black leading-none text-cyan-400 italic">{autoTimeLeft}s</span>
                 </div>
               </div>
             )}
             <button onClick={handleHeal} disabled={player.potions <= 0} className="flex items-center gap-2 bg-red-600 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-red-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 group">
               <Coffee size={16} className="text-white group-hover:scale-110 transition-transform" />
               <div className="flex flex-col items-start bg-transparent">
                 <span className="text-[7px] font-black uppercase tracking-widest text-white/70 leading-none italic">Heal</span>
                 <span className="text-xs font-black leading-none text-white italic">{player.potions || 0} POTS</span>
               </div>
             </button>
           </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => handleAttack(true)} className={`flex-1 py-6 rounded-2xl font-black text-4xl shadow-[10px_10px_0_rgba(0,0,0,1)] border-[4px] border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[12px_12px_0_rgba(0,0,0,1)] italic bg-red-600 text-white`}>
            OVERLOAD
          </button>
          <button onClick={() => { setView('menu'); if (player.autoUntil > 0) syncPlayer({ autoUntil: 0 }); }} className={`px-10 py-6 rounded-2xl font-black uppercase tracking-widest border-[4px] border-black transition-all shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic bg-slate-300 text-black hover:bg-white`}>Retreat</button>
        </div>
      </div>
    </div>
  );
};
