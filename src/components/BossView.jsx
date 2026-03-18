import React from 'react';
import { MousePointer, Coffee, Wind, Zap, Skull, Swords, Activity, Shield, Target, Star, TrendingUp, Lock } from 'lucide-react';
import { BossImpactSplash, ImpactSplash } from './CombatEffects';
import { AvatarMedia, SquadHUD } from './GameUI';

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
  isHurt, enemyFlinch, bossAvatarIdx, showBossVideo, setShowBossVideo, BOSS_MEDIA_FILES, impactSplash, BOSS, player, dragonTimeLeft, TAVERN_MATES, autoTimeLeft, activateAutoScroll, handleHeal, handleAttack, setView, syncPlayer,
  currentTaunt, playerTaunt, playerImpactSplash, strikingSide, totalStats, isStunned, stunTimeLeft, isMissed, missTimeLeft,
  autoUseScroll, setAutoUseScroll
}) => {
  const isAutoActive = autoTimeLeft > 0;

  return (
    <div className={`flex-1 p-4 flex flex-col items-center justify-between gap-4 animate-in fade-in relative overflow-hidden ${isHurt ? 'animate-damage' : ''}`}>
      {/* Intense Red Halftone Overlay */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ef4444 2px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      
      {/* --- HUD TOP: INTENSE BOSS TITLE --- */}
      <div className="w-full flex justify-between items-start z-10 px-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-5 py-3 bg-black border-[4px] border-red-600 rounded-lg shadow-[5px_5px_0_rgba(0,0,0,1)] transform -rotate-1">
              <TrendingUp size={18} className="text-red-500 animate-pulse" />
              <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic leading-none">Entity Detected</span>
                  <span className="text-xs font-black text-white tracking-tighter uppercase">Ω-LEVEL GUARDIAN</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-sm font-black">
             <div className="flex gap-2">
                 <button onClick={handleHeal} disabled={player.potions <= 0} className="flex items-center gap-3 bg-red-600 border-[3px] border-black px-5 py-2.5 rounded-xl hover:bg-red-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 group">
                    <Coffee size={18} className="text-white group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start bg-transparent leading-none gap-0.5">
                        <span className="text-[8px] font-black uppercase text-white/70 italic">Heal</span>
                        <span className="text-sm font-black text-white italic">{player.potions || 0}</span>
                    </div>
                </button>
                
                <div className="flex flex-col gap-1">
                  {player.autoScrolls > 0 && !isAutoActive && (
                    <button onClick={activateAutoScroll} className="flex items-center gap-2 bg-cyan-600 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-cyan-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 group">
                      <MousePointer size={14} className="text-black group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col items-start bg-transparent leading-none">
                        <span className="text-[7px] font-black uppercase text-black/70 italic">Auto</span>
                        <span className="text-xs font-black text-black italic">{player.autoScrolls}</span>
                      </div>
                    </button>
                  )}
                  <button 
                    onClick={() => setAutoUseScroll(!autoUseScroll)}
                    className={`flex items-center gap-1.5 px-2 py-1 border-2 border-black rounded-lg text-[8px] font-black italic uppercase transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 ${autoUseScroll ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}
                  >
                    <Lock size={10} strokeWidth={3} /> {autoUseScroll ? 'AUTO-USE ON' : 'AUTO-USE OFF'}
                  </button>
                </div>
             </div>
             {isAutoActive && (
               <div className="flex items-center gap-2 px-3 py-1 bg-cyan-600 border-[3px] border-black text-black rounded-lg font-black text-[10px] animate-pulse shadow-[3px_3px_0_rgba(0,0,0,1)]">
                 <MousePointer size={10} /> LOCK-ON: {autoTimeLeft}s
               </div>
             )}
          </div>
      </div>

      {/* --- BATTLE ARENA: TWO PANELS --- */}
      <div className="w-full flex flex-col lg:flex-row flex-1 items-center justify-center gap-8 px-2 py-4 relative">
        
        {/* LEFT PANEL: BOSS */}
        <div className={`flex-1 w-full max-w-sm flex flex-col items-center gap-6 transition-all duration-300 ${strikingSide === 'monster' ? 'animate-strike-right' : ''}`}>
           <div className="relative group">
              {/* Boss Yield Detail Overlay - Adjusted positioning to prevent clipping */}
              <div className="absolute -left-20 -top-4 hidden xl:flex flex-col gap-2 z-10 animate-in slide-in-from-right duration-700">
                  <div className="bg-black/95 border-2 border-red-600 p-4 pt-5 rounded-lg transform -rotate-6 shadow-[4px_4px_0_rgba(239,68,68,0.3)]">
                      <p className="text-[8px] font-black text-red-500 uppercase leading-none mb-2 text-center tracking-widest">Scanner Active</p>
                      <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                              <Target size={10} className="text-red-500" />
                              <span className="text-[11px] font-black text-white">ATK: {BOSS.str}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <Shield size={10} className="text-red-500" />
                              <span className="text-[11px] font-black text-white">DEF: {BOSS.agi}</span>
                          </div>
                          <div className="pt-2 border-t border-red-900/50">
                             <p className="text-[7px] font-black text-red-400 uppercase leading-none mb-1">Condition</p>
                             <p className="text-[10px] font-black text-white animate-pulse">OVERLOAD READY</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Boss Taunt Bubble */}
              {currentTaunt && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-[60] animate-in zoom-in slide-in-from-bottom-6 duration-300">
                  <div className="relative bg-black border-[4px] border-red-600 px-6 py-3 rounded-2xl shadow-[8px_8px_0_rgba(0,0,0,1)] min-w-[140px] max-w-[220px]">
                    <p className="text-[12px] font-black uppercase text-red-500 italic text-center leading-tight tracking-tight drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                      {currentTaunt}
                    </p>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-black border-r-[4px] border-b-[4px] border-red-600 rotate-45 transform"></div>
                  </div>
                </div>
              )}

              <div className={`w-44 h-44 bg-slate-950 flex items-center justify-center border-[6px] border-black shadow-[10px_10px_0_rgba(239,68,68,0.3)] overflow-hidden relative transform -rotate-3 ${enemyFlinch || impactSplash ? 'animate-flinch' : ''}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#450a0a_0%,transparent_80%)] opacity-60 z-20"></div>
                  <BossAvatarMedia bossIdx={bossAvatarIdx} animated={showBossVideo && player.avatarAnimated} className="w-full h-full object-cover relative z-10 contrast-125 brightness-75 drop-shadow-[0_0_30px_rgba(239,68,68,0.2)]" BOSS_MEDIA_FILES={BOSS_MEDIA_FILES} />
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowBossVideo(!showBossVideo); }}
                    className="absolute bottom-2 right-2 z-30 bg-black/90 p-2 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
                  >
                    {showBossVideo ? <Wind size={16} /> : <Zap size={16} />}
                  </button>
                  
                  <BossImpactSplash splash={impactSplash} />
              </div>
           </div>

            <div className="w-full space-y-4 px-6">
                <div className="bg-red-600 text-white px-6 py-2 border-[4px] border-black transform rotate-1 shadow-[6px_6px_0_rgba(0,0,0,1)] inline-block relative">
                    <h2 className="text-lg font-black uppercase tracking-tighter italic leading-none drop-shadow-md">{BOSS.name}</h2>
                    <div className="absolute -top-4 -right-2 bg-black text-white px-1.5 py-0.5 text-[7px] font-black border-2 border-white rotate-12 shadow-sm">LVL {BOSS.level}</div>
                </div>
                
                <div className="w-full h-5 bg-black border-[3px] border-white/20 p-0.5 relative shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-800 via-red-500 to-red-400 transition-all duration-300 relative shadow-[0_0_10px_rgba(220,38,38,0.8)]" style={{ width: `100%` }}>
                        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                   <p className="text-[8px] font-black text-red-500 uppercase italic opacity-70 mb-1">Entity Damage Record</p>
                   <p className="text-4xl font-black text-white italic drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">{(player.totalBossDamage || 0).toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* INTENSE RED VS DIVIDER */}
        <div className="hidden lg:flex flex-col items-center justify-center opacity-40 z-20">
            <div className="w-2 h-32 bg-gradient-to-b from-transparent via-red-600 to-transparent animate-pulse" />
            <div className="text-4xl font-black italic text-red-600 -rotate-12 my-4 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">VS</div>
            <div className="w-2 h-32 bg-gradient-to-t from-transparent via-red-600 to-transparent animate-pulse" />
        </div>

        {/* RIGHT PANEL: PLAYER */}
        <div className={`flex-1 w-full max-w-sm flex flex-col items-center gap-6 transition-all duration-300 ${strikingSide === 'player' ? 'animate-strike-left' : ''}`}>
           <div className="relative group">
              {/* Player Stats Detail Overlay - Adjusted positioning to prevent clipping */}
              <div className="absolute -right-20 -top-4 hidden xl:flex flex-col gap-2 z-10 animate-in slide-in-from-left duration-700">
                  <div className="bg-black/95 border-2 border-cyan-500 p-4 pt-5 rounded-lg transform rotate-6 shadow-[4px_4px_0_rgba(8,145,178,0.3)]">
                      <p className="text-[8px] font-black text-cyan-400 uppercase leading-none mb-2 text-center tracking-widest">Hunter Status</p>
                      <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                              <Star size={10} className="text-yellow-400" />
                              <span className="text-[11px] font-black text-white">LEVEL {player.level}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <Shield size={10} className="text-emerald-400" />
                              <span className="text-[11px] font-black text-white">DEF: {totalStats.agi}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Player Taunt Bubble */}
              {playerTaunt && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-[60] animate-in zoom-in slide-in-from-bottom-6 duration-300">
                  <div className="relative bg-cyan-600 border-[4px] border-black px-6 py-3 rounded-2xl shadow-[8px_8px_0_rgba(0,0,0,1)] min-w-[140px] max-w-[220px]">
                    <p className="text-[12px] font-black uppercase text-white italic text-center leading-tight tracking-tight drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">
                      {playerTaunt}
                    </p>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-cyan-600 border-r-[4px] border-b-[4px] border-black rotate-45 transform"></div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className={`w-44 h-44 bg-slate-950 flex items-center justify-center border-[6px] border-black shadow-[10px_10px_0_rgba(8,145,178,0.3)] overflow-hidden relative transform rotate-3 ${strikingSide === 'monster' && playerImpactSplash ? 'animate-shake-lite' : ''}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#064e3b_0%,transparent_80%)] opacity-50"></div>
                    {player.avatar && (
                      <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover relative z-10" />
                    )}
                    <ImpactSplash splash={playerImpactSplash} />
                </div>
                
                {/* SQUAD / PARTY HUD */}
                <SquadHUD player={player} dragonTimeLeft={dragonTimeLeft} TAVERN_MATES={TAVERN_MATES} />
              </div>
           </div>

            <div className="w-full space-y-4 px-6">
                <div className="bg-cyan-600 text-white px-6 py-2 border-[4px] border-black transform -rotate-1 shadow-[6px_6px_0_rgba(0,0,0,1)] inline-auto relative float-right">
                    <h2 className="text-lg font-black uppercase tracking-tighter italic leading-none drop-shadow-md">{player.name}</h2>
                    <div className="absolute -top-4 -right-2 bg-black text-cyan-400 px-1.5 py-0.5 text-[7px] font-black border-2 border-cyan-400 -rotate-12 shadow-sm">RANK: S</div>
                </div>
                
                <div className="w-full h-5 bg-black border-[3px] border-white/20 p-0.5 relative shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden clear-both">
                    <div className="h-full bg-gradient-to-r from-cyan-800 via-cyan-500 to-cyan-400 transition-all duration-300 relative shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `${(player.hp / player.maxHp) * 100}%` }}>
                        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    </div>
                </div>

                <div className="flex gap-3 justify-center">
                    <div className="bg-black/90 border-2 border-cyan-500/50 px-2 py-0.5 rounded flex items-center gap-1 shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                        <Swords size={10} className="text-cyan-400" />
                        <span className="text-[11px] font-black text-white italic">{totalStats.str}</span>
                    </div>
                    <div className="bg-black/90 border-2 border-emerald-500/50 px-2 py-0.5 rounded flex items-center gap-1 shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                        <Activity size={10} className="text-emerald-500" />
                        <span className="text-[11px] font-black text-white italic">{totalStats.agi}</span>
                    </div>
                    <div className="bg-black/90 border-2 border-yellow-500/50 px-2 py-0.5 rounded flex items-center gap-1 shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                        <Target size={10} className="text-yellow-500" />
                        <span className="text-[11px] font-black text-white italic">{totalStats.dex}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- HUD BOTTOM: CONTROLS --- */}
      <div className="w-full max-w-xl space-y-4 z-10 px-4">
        <div className="flex gap-4 relative">
          {isStunned && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md border-4 border-red-600 z-50 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.4)] transform scale-105">
              <div className="flex items-center gap-4 animate-pulse">
                <Skull size={32} className="text-red-500" />
                <p className="font-black text-2xl uppercase italic drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">SYSTEM STUNNED! {Math.ceil(stunTimeLeft)}s</p>
              </div>
            </div>
          )}

          {isMissed && !isStunned && (
            <div className="absolute inset-0 bg-slate-500/90 backdrop-blur-md border-4 border-black z-50 flex items-center justify-center shadow-lg transform scale-105">
               <p className="font-black text-2xl uppercase italic text-black tracking-widest">ATTACK DEFLECTED!</p>
            </div>
          )}

          <button 
            onClick={() => handleAttack(true)} 
            disabled={isStunned || isMissed} 
            className={`flex-1 py-4 rounded-xl font-black text-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] border-[4px] border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-y-1 italic flex flex-col items-center justify-center gap-0 leading-tight ${(isStunned || isMissed) ? 'opacity-0' : 'bg-red-600 text-white'} relative overflow-hidden group`}
          >
            <span className="relative z-10 text-xl">OVERLOAD</span>
            <span className="text-[8px] opacity-70 tracking-[0.2em] uppercase relative z-10 font-black">Core Strike Phase</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
          
          <button 
            onClick={() => { setView('menu'); if (player.autoUntil > 0) syncPlayer({ autoUntil: 0 }); }} 
            className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest border-[4px] border-black transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic bg-slate-300 text-black hover:bg-white`}
          >
            RETREAT
          </button>
        </div>
      </div>
    </div>
  );
};
