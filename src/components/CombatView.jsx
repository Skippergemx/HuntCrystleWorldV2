import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, MousePointer, Coffee, User, X, Skull, Lock, Activity, Shield, Swords, Target, Gem, Gift, Star, HelpCircle, RotateCw } from 'lucide-react';
import { ImpactSplash } from './CombatEffects';
import { AvatarMedia, SquadHUD } from './GameUI';

export const CombatView = React.memo(({ 
  enemy, depth, buffTimeLeft, isAutoActive, autoTimeLeft, player, dragonTimeLeft, TAVERN_MATES, handleHeal, activateAutoScroll, isHurt, impactSplash, isStunned, stunTimeLeft, isMissed, missTimeLeft, showDefeatedWindow, handleAttack, setView, syncPlayer, setDepth, selectedMap,
  autoUseScroll, setAutoUseScroll, killsInFloor, LOOTS, currentTaunt, playerTaunt, playerImpactSplash, strikingSide, totalStats, lastLoot, onHelp, handleSkip
}) => {
  if (!enemy) return null;

  const possibleDrops = React.useMemo(() => {
    return selectedMap?.lootTable ? selectedMap.lootTable.slice(0, 10).map(id => LOOTS.find(l => l.id === id)).filter(Boolean) : [];
  }, [selectedMap, LOOTS]);

  const arenaTheme = React.useMemo(() => {
    const el = selectedMap?.element;
    if (el === 'Pyro') return { 
      bg: 'bg-red-950', dot: '#f97316', hud: 'border-orange-500', text: 'text-orange-400', banner: 'bg-orange-600',
      backdrop: '/assets/dungeonsground/PyroGroundBackdrop.jpg'
    };
    if (el === 'Earthen') return { 
      bg: 'bg-emerald-950', dot: '#10b981', hud: 'border-emerald-500', text: 'text-emerald-400', banner: 'bg-emerald-600',
      backdrop: '/assets/dungeonsground/EearthenGroundBackdrop.jpg'
    };
    if (el === 'Hydro') return { 
      bg: 'bg-blue-950', dot: '#0ea5e9', hud: 'border-blue-500', text: 'text-blue-400', banner: 'bg-blue-600',
      backdrop: '/assets/dungeonsground/HydroGroundBackdrop.jpg'
    };
    if (el === 'Gale') return { 
      bg: 'bg-purple-950', dot: '#a855f7', hud: 'border-purple-500', text: 'text-purple-400', banner: 'bg-purple-600',
      backdrop: '/assets/dungeonsground/GaleGroundBackdrop.jpg'
    };
    return { bg: 'bg-slate-950/40', dot: '#0ea5e9', hud: 'border-cyan-500', text: 'text-cyan-400', banner: 'bg-cyan-600' };
  }, [selectedMap]);

  return (
    <div className={`flex-1 p-4 flex flex-col items-center justify-between gap-2 animate-in fade-in relative overflow-hidden ${arenaTheme.bg} ${isHurt ? 'animate-damage' : ''}`}>
      {/* Dynamic Background Backdrop */}
      {arenaTheme.backdrop && (
        <div className="absolute inset-0 z-0 select-none">
          <img src={arenaTheme.backdrop} className="w-full h-full object-cover opacity-40 mix-blend-luminosity" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
        </div>
      )}

      {/* Halftone Overlay HUD */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-10" style={{ backgroundImage: `radial-gradient(circle, ${arenaTheme.dot} 1px, transparent 1px)`, backgroundSize: '8px 8px' }}></div>
      
      {/* --- HUD TOP --- */}
      <div className="w-full flex justify-between items-start z-10 px-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 bg-black border-[3px] ${arenaTheme.hud} rounded-lg shadow-[3px_3px_0_rgba(0,0,0,1)] ${arenaTheme.text}`}>
              <TrendingUp size={14} />
              <span className="text-xs font-black tracking-widest italic uppercase">Floor {depth}</span>
            </div>
            <button 
              onClick={onHelp} 
              className={`p-1.5 ${arenaTheme.banner} border-[3px] border-black text-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:brightness-110 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none`}
              title="Tactical Guide"
            >
              <HelpCircle size={14} strokeWidth={3} />
            </button>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[7px] font-black text-slate-400 uppercase italic">Progression: {killsInFloor}/10</span>
            <div className="flex gap-1">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`w-2.5 h-1.5 border-2 border-black transition-all duration-300 ${i < killsInFloor ? 'bg-cyan-500' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button onClick={handleHeal} disabled={player.potions <= 0} className="flex items-center gap-2 bg-red-600 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-red-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 group">
              <Coffee size={14} className="text-white group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-start bg-transparent leading-none">
                <span className="text-[7px] font-black uppercase text-white/70 italic">Heal</span>
                <span className="text-xs font-black text-white italic">{player.potions || 0}</span>
              </div>
            </button>
            
            <button onClick={handleSkip} className="flex items-center gap-2 bg-slate-800 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-slate-700 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 group">
              <RotateCw size={14} className="text-cyan-400 group-hover:rotate-45 transition-transform" />
              <div className="flex flex-col items-start bg-transparent leading-none">
                <span className="text-[7px] font-black uppercase text-white/70 italic">Skip</span>
                <span className="text-xs font-black text-white italic">SCAN</span>
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
                <Lock size={10} /> {autoUseScroll ? 'AUTO-USE ON' : 'AUTO-USE OFF'}
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
      <div className="w-full flex flex-col md:flex-row flex-1 items-center justify-center gap-2 md:gap-4 px-1 md:px-2 py-2 md:py-4 relative">
        
        {/* LOOT DISCOVERY OVERLAY */}
        {lastLoot && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-[100] flex items-center justify-center pointer-events-none">
             <div className="animate-in fade-in zoom-in-75 duration-500 flex flex-col items-center">
                <div className="bg-amber-400 border-[4px] md:border-[6px] border-black p-4 md:p-6 shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] transform -rotate-3 mb-4 flex flex-col items-center">
                   <div className="text-4xl md:text-6xl mb-2 animate-bounce">{lastLoot.icon}</div>
                   <h2 className="text-lg md:text-2xl font-black text-black uppercase italic tracking-tighter">LOOT FOUND!</h2>
                   <p className="text-[10px] md:text-xs font-black text-black/60 uppercase">{lastLoot.name}</p>
                </div>
                <div className="flex gap-2">
                   {[...Array(5)].map((_, i) => (
                     <Sparkles key={i} className={`text-amber-300 animate-pulse delay-${i * 100}`} size={16} md:size={24} />
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* LEFT PANEL: MONSTER */}
        <div className={`flex-1 w-full max-w-[280px] md:max-w-sm flex flex-col items-center gap-2 md:gap-4 transition-all duration-300 ${strikingSide === 'monster' ? 'animate-strike-right' : ''}`}>
           <div className="relative group">
              {/* Yield Scanner Overlay */}
              <div className="absolute -left-20 top-0 hidden lg:flex flex-col gap-2 z-10 animate-in slide-in-from-right duration-500">
                  <div className="bg-black/90 border-2 border-red-500/50 p-2 rounded-lg transform -rotate-6">
                      <p className="text-[6px] font-black text-red-400 uppercase leading-none mb-1 text-center">Scanner</p>
                      <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                              <Gem size={8} className="text-amber-500" />
                              <span className="text-[9px] font-black text-white">+{enemy.loot} GX</span>
                          </div>
                          <div className="flex items-center gap-1">
                              <Target size={8} className="text-cyan-400" />
                              <span className="text-[9px] font-black text-white">+{enemy.xp} XP</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="bg-black/90 border-2 border-white/20 p-2 rounded-lg transform rotate-3 max-w-[80px]">
                      <p className="text-[6px] font-black text-slate-500 uppercase leading-none mb-1 text-center">Rewards</p>
                      <div className="flex flex-wrap gap-1">
                          {possibleDrops.slice(0, 4).map((l, i) => (
                            <span key={i} className="text-[10px] opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">{l.icon}</span>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Monster Taunt Bubble */}
              {currentTaunt && (
                <div className="absolute -top-10 md:-top-14 left-1/2 -translate-x-1/2 z-[60] animate-in zoom-in slide-in-from-bottom-4 duration-300">
                  <div className="relative bg-white border-[2px] md:border-[3px] border-black px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] min-w-[80px] md:min-w-[100px] max-w-[140px] md:max-w-[180px]">
                    <p className="text-[8px] md:text-[10px] font-black uppercase text-black italic text-center leading-tight tracking-tight">
                      {currentTaunt}
                    </p>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-[2px] md:border-r-[3px] border-b-[2px] md:border-b-[3px] border-black rotate-45 transform"></div>
                  </div>
                </div>
              )}

              <div className={`w-32 h-32 md:w-44 md:h-44 bg-slate-900 flex items-center justify-center border-[4px] md:border-[6px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] overflow-hidden relative transform -rotate-2 ${isHurt || impactSplash ? 'animate-shake-lite' : ''}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#450a0a_0%,transparent_70%)] opacity-50"></div>
                  <img
                      src={`/assets/monsters/${enemy.folder || 'Neon Slums'}/${enemy.name}.png`}
                      alt={enemy.name}
                      className="w-full h-full object-cover relative z-10"
                      onError={(e) => {
                          const folder = enemy.folder || 'Neon Slums';
                          if (e.target.src.endsWith('.png')) e.target.src = `/assets/monsters/${folder}/${enemy.name}.jpg`;
                          else { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + enemy.name; }
                      }}
                  />
                  <ImpactSplash splash={impactSplash} />
              </div>
           </div>

            <div className="w-full space-y-1.5 md:space-y-2 px-2 md:px-4">
                <div className="bg-red-600 text-white px-2 md:px-3 py-0.5 md:py-1 border-[3px] md:border-[4px] border-black transform rotate-1 shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] inline-block">
                    <h2 className="text-xs md:text-sm font-black uppercase tracking-tighter italic leading-none">{enemy.name}</h2>
                </div>
                
                <div className="w-full h-3 md:h-4 bg-black border-[2px] md:border-[3px] border-white/20 p-0.5 relative shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                </div>

                <div className="flex gap-1.5 md:gap-2 justify-center">
                    <div className="bg-black/80 border border-white/20 px-1.5 md:px-2 py-0.5 rounded flex items-center gap-1">
                        <Swords size={9} md:size={10} className="text-red-500" />
                        <span className="text-[8px] md:text-[10px] font-black text-white italic">{enemy.str}</span>
                    </div>
                    <div className="bg-black/80 border border-white/20 px-1.5 md:px-2 py-0.5 rounded flex items-center gap-1">
                        <Activity size={9} md:size={10} className="text-emerald-500" />
                        <span className="text-[8px] md:text-[10px] font-black text-white italic">{enemy.agi}</span>
                    </div>
                    <div className="bg-black/80 border border-white/20 px-1.5 md:px-2 py-0.5 rounded flex items-center gap-1">
                        <Target size={9} md:size={10} className="text-yellow-500" />
                        <span className="text-[8px] md:text-[10px] font-black text-white italic">{enemy.dex}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* VS DIVIDER */}
        <div className="hidden md:flex flex-col items-center justify-center opacity-30 z-20">
            <div className="w-1 h-24 bg-gradient-to-b from-transparent via-white to-transparent" />
            <div className="text-4xl font-black italic text-white -rotate-12 my-2">VS</div>
            <div className="w-1 h-24 bg-gradient-to-t from-transparent via-white to-transparent" />
        </div>

        {/* RIGHT PANEL: PLAYER */}
        <div className={`flex-1 w-full max-w-[280px] md:max-w-sm flex flex-col items-center gap-2 md:gap-4 transition-all duration-300 ${strikingSide === 'player' ? 'animate-strike-left' : ''}`}>
           <div className="relative group">
              {/* Player Stats Detail Overlay */}
              <div className="absolute -right-20 top-0 hidden lg:flex flex-col gap-2 z-10 animate-in slide-in-from-left duration-500">
                  <div className="bg-black/90 border-2 border-cyan-500/50 p-2 rounded-lg transform rotate-6">
                      <p className="text-[6px] font-black text-cyan-400 uppercase leading-none mb-1 text-center">Hunter Protocol</p>
                      <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                              <Star size={8} className="text-yellow-400" />
                              <span className="text-[9px] font-black text-white">LVL {player.level}</span>
                          </div>
                          <div className="flex items-center gap-1">
                              <Shield size={8} className="text-emerald-400" />
                              <span className="text-[9px] font-black text-white">{totalStats.agi} DEF</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Player Taunt Bubble */}
              {playerTaunt && (
                <div className="absolute -top-10 md:-top-14 left-1/2 -translate-x-1/2 z-[60] animate-in zoom-in slide-in-from-bottom-4 duration-300">
                  <div className="relative bg-cyan-500 border-[2px] md:border-[3px] border-black px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] min-w-[80px] md:min-w-[100px] max-w-[140px] md:max-w-[180px]">
                    <p className="text-[8px] md:text-[10px] font-black uppercase text-white italic text-center leading-tight tracking-tight">
                      {playerTaunt}
                    </p>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-500 border-r-[2px] md:border-r-[3px] border-b-[2px] md:border-b-[3px] border-black rotate-45 transform"></div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 md:gap-4">
                <div className={`w-32 h-32 md:w-44 md:h-44 bg-slate-900 flex items-center justify-center border-[4px] md:border-[6px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] overflow-hidden relative transform rotate-2 ${strikingSide === 'monster' && playerImpactSplash ? 'animate-shake-lite' : ''}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#064e3b_0%,transparent_70%)] opacity-50"></div>
                    {player.avatar && (
                      <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover" />
                    )}
                    <ImpactSplash splash={playerImpactSplash} />
                </div>
                
                {/* SQUAD / PARTY HUD */}
                <SquadHUD player={player} dragonTimeLeft={dragonTimeLeft} TAVERN_MATES={TAVERN_MATES} />
              </div>
           </div>

            <div className="w-full space-y-1.5 md:space-y-2 px-2 md:px-4">
                <div className="bg-cyan-600 text-white px-2 md:px-3 py-0.5 md:py-1 border-[3px] md:border-[4px] border-black transform -rotate-1 shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] inline-block float-right">
                    <h2 className="text-xs md:text-sm font-black uppercase tracking-tighter italic leading-none">{player.name}</h2>
                </div>
                
                <div className="w-full h-3 md:h-4 bg-black border-[2px] md:border-[3px] border-white/20 p-0.5 relative shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] clear-both">
                    <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
                </div>

                <div className="flex gap-1.5 md:gap-2 justify-center">
                    <div className="bg-black/80 border border-white/20 px-1.5 md:px-2 py-0.5 rounded flex items-center gap-1">
                        <Swords size={9} md:size={10} className="text-cyan-400" />
                        <span className="text-[8px] md:text-[10px] font-black text-white italic">{totalStats.str}</span>
                    </div>
                    <div className="bg-black/80 border border-white/20 px-1.5 md:px-2 py-0.5 rounded flex items-center gap-1">
                        <Activity size={9} md:size={10} className="text-emerald-500" />
                        <span className="text-[8px] md:text-[10px] font-black text-white italic">{totalStats.agi}</span>
                    </div>
                    <div className="bg-black/80 border border-white/20 px-1.5 md:px-2 py-0.5 rounded flex items-center gap-1">
                        <Target size={9} md:size={10} className="text-yellow-500" />
                        <span className="text-[8px] md:text-[10px] font-black text-white italic">{totalStats.dex}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- HUD BOTTOM: CONTROLS & RECENT DROPS --- */}
      <div className="w-full max-w-lg space-y-3 md:space-y-4 z-10 px-2 lg:mb-2">
        <div className="flex gap-3 md:gap-4 relative">
          {isStunned && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-sm border-2 border-red-600 z-30 flex items-center justify-center shadow-lg transform scale-105">
              <div className="flex items-center gap-2 md:gap-3 animate-pulse">
                <Skull size={20} md:size={24} className="text-red-500" />
                <p className="font-black text-[10px] md:text-xs uppercase italic drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">STUNNED! {Math.ceil(stunTimeLeft)}s</p>
              </div>
            </div>
          )}

          {isMissed && !isStunned && (
            <div className="absolute inset-0 bg-slate-400/90 backdrop-blur-sm border-2 border-black z-30 flex items-center justify-center shadow-lg transform scale-105">
               <p className="font-black text-[10px] md:text-xs uppercase italic text-black">Missed Target! {missTimeLeft.toFixed(1)}s</p>
            </div>
          )}

          <button 
            onClick={() => handleAttack()} 
            disabled={isStunned || isMissed || showDefeatedWindow} 
            className={`flex-1 py-3 md:py-4 rounded-xl font-black text-lg md:text-xl shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] border-[3px] md:border-[4px] border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-y-0.5 italic flex flex-col items-center justify-center gap-0 leading-tight ${(isStunned || isMissed) ? 'opacity-0' : 'bg-red-600 text-white'} ${isAutoActive ? 'animate-pulse' : ''}`}
          >
            <span>{isAutoActive ? 'LOCK-ON' : 'STRIKE'}</span>
            <span className="text-[7px] md:text-[8px] opacity-70 tracking-widest uppercase">Combat Command</span>
          </button>
          
          <button 
            onClick={() => { setView('menu'); setDepth(1); if (player.autoUntil > 0) syncPlayer({ autoUntil: 0 }); }} 
            className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-widest border-[3px] md:border-[4px] border-black transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic bg-slate-300 text-black hover:bg-white`}
          >
            EXIT
          </button>
        </div>

        {/* RECENT DROPS MINI-SCANNER */}
        <div className="bg-black/80 border-[3px] border-black p-2 flex items-center justify-between shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-2">
                <Gift size={12} className="text-amber-400" />
                <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Session Rewards:</span>
            </div>
            <div className="flex gap-2">
                {(player.inventory || []).slice(-5).reverse().map((item, i) => (
                  <div key={i} className="text-lg animate-in slide-in-from-right stagger-1 transform hover:scale-125 transition-transform cursor-help" title={item.name}>
                    {item.icon}
                  </div>
                ))}
                {(player.inventory || []).length === 0 && <span className="text-[7px] text-white/20 italic uppercase tracking-widest">No Drops Synchronized</span>}
            </div>
        </div>
      </div>
    </div>
  );
});
