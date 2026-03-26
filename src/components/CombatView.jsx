import React, { useState, useMemo } from 'react';
import { TrendingUp, MousePointer, Coffee, X, Skull, Lock, Activity, Shield, Swords, Target, Gem, Gift, Star, HelpCircle, RotateCw, Search, List, ChevronRight, RefreshCw, FlaskConical } from 'lucide-react';
import { ImpactSplash } from './CombatEffects';
import { AvatarMedia, SquadHUD } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const CombatView = React.memo(() => {
  const {
      player, adventure, combat, actions, gameLoop, audio, totalStats, autoScrollState, 
      LOOTS, TAVERN_MATES, openGuide, syncPlayer
  } = useGame();

  const { enemy, depth, setDepth, view, setView, selectedMap, killsInFloor, isHurt, handleSkip } = adventure;
  const { stunTimeLeft, missTimeLeft, combatState, impactSplash, playerImpactSplash, strikingSide, currentTaunt, playerTaunt, lastLoot } = combat;
  const { handleHeal, activateAutoScroll, cyclePotion, cycleScroll } = actions;
  const { autoTimeLeft, dragonTimeLeft, penaltyRemaining } = gameLoop;

  const isAutoActive = autoTimeLeft > 0;
  const isStunned = stunTimeLeft > 0;
  const isMissed = missTimeLeft > 0;

  const [isLootModalOpen, setIsLootModalOpen] = useState(false);

  const possibleDrops = useMemo(() => {
    return selectedMap?.lootTable ? selectedMap.lootTable.map(id => LOOTS.find(l => l.id === id)).filter(Boolean) : [];
  }, [selectedMap, LOOTS]);

  const currentPotionCount = useMemo(() => {
    const sel = player.selectedPotionId || 'hp_potion';
    const invCount = (player.inventory || []).filter(i => i && i.id?.startsWith(sel)).length;
    return sel === 'hp_potion' ? invCount + (player.potions || 0) : invCount;
  }, [player.selectedPotionId, player.inventory, player.potions]);

  const currentScrollCount = useMemo(() => {
    const sel = player.selectedScrollId || 'auto_scroll';
    const invCount = (player.inventory || []).filter(i => i && i.id?.startsWith(sel)).length;
    return sel === 'auto_scroll' ? invCount + (player.autoScrolls || 0) : invCount;
  }, [player.selectedScrollId, player.inventory, player.autoScrolls]);

  const hasAnyPotions = useMemo(() => (player.potions > 0) || (player.inventory || []).some(i => i.id?.includes('hp_potion')), [player.potions, player.inventory]);
  const hasAnyScrolls = useMemo(() => (player.autoScrolls > 0) || (player.inventory || []).some(i => i.id?.includes('auto_scroll')), [player.autoScrolls, player.inventory]);

  const categorizedLoot = useMemo(() => {
    const categories = {};
    possibleDrops.forEach(item => {
      const rarity = item.rarity || 'Common';
      if (!categories[rarity]) categories[rarity] = [];
      categories[rarity].push(item);
    });
    return categories;
  }, [possibleDrops]);

  const arenaTheme = useMemo(() => {
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

      {/* Dynamic Action Lines Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden sm:opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-action-lines" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg, transparent 0deg 10deg, rgba(255,255,255,0.05) 10deg 20deg)' }}></div>
      </div>

      {/* Halftone Overlay HUD */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-20 comic-halftone" style={{ color: arenaTheme.dot }}></div>
      
      {/* --- HUD TOP --- */}
      <div className="w-full flex justify-between items-start z-30 px-2 md:px-6 pt-2 md:pt-4">
        <div className="flex flex-col gap-1.5 md:gap-3">
          <div className="flex items-center gap-1.5 md:gap-3">
            <div className={`flex items-center gap-1.5 md:gap-3 px-2 md:px-5 py-1.5 md:py-3 bg-black border-[3px] md:border-[4px] ${combat.battleMode === 'GVG' ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : arenaTheme.hud} rounded shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] ${arenaTheme.text} transform -rotate-1`}>
              <TrendingUp size={12} className="md:w-5 md:h-5 animate-pulse" />
              <div className="flex flex-col leading-none">
                <span className="text-[6px] md:text-[10px] font-black uppercase opacity-70">
                  {combat.battleMode === 'GVG' ? `TARGET: [${enemy.syndicateTag || '???'}] ${enemy.syndicateName || 'SYN'}` : 'Sector Alpha'}
                </span>
                <span className="text-[10px] md:text-lg font-black tracking-widest italic uppercase">
                  {combat.battleMode === 'GVG' ? 'SYNDICATE RAID' : `Floor ${depth}`}
                </span>
              </div>
            </div>
            <button 
              onClick={() => openGuide('dungeon')} 
              className={`p-1.5 md:p-3 ${arenaTheme.banner} border-[3px] md:border-[4px] border-black text-black shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:brightness-110 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none transform rotate-3`}
              title="Tactical Guide"
            >
              <HelpCircle size={14} className="md:w-5 md:h-5" strokeWidth={4} />
            </button>
          </div>
          
          {combat.battleMode !== 'GVG' && (
            <div className="flex flex-col gap-1 p-1.5 bg-black/40 border border-white/5 rounded backdrop-blur-sm max-w-[120px] md:max-w-none">
              <div className="flex justify-between items-center px-1">
                <span className="text-[6px] md:text-[8px] font-black text-slate-400 uppercase italic">Progress</span>
                <span className="text-[7px] md:text-[8px] font-black text-cyan-400">{killsInFloor}/10</span>
              </div>
              <div className="flex gap-1">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className={`flex-1 h-1 md:h-2.5 border border-black transition-all duration-300 ${i < killsInFloor ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-800'}`} />
                ))}
              </div>
            </div>
          )}
        </div>

          <div className="flex flex-col items-end gap-2 md:gap-4 scale-90 sm:scale-100 origin-top-right">
            <div className="flex gap-2 md:gap-4">
              <div className="flex flex-col gap-1 items-end">
                <button onClick={handleHeal} disabled={currentPotionCount <= 0} className="flex items-center gap-1.5 md:gap-3 bg-red-600 border-[3px] md:border-[4px] border-black px-2 md:px-5 py-1.5 md:py-3 rounded hover:bg-red-500 transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 group relative overflow-hidden">
                  <div className="absolute inset-0 comic-halftone opacity-20 pointer-events-none text-black"></div>
                  <span className="text-sm md:text-xl relative z-10 group-hover:scale-110 transition-transform">🧪</span>
                  <div className="flex flex-col items-start bg-transparent leading-none relative z-10">
                    <span className="text-[6px] md:text-[9px] font-black uppercase text-white/70 italic">
                      {player.selectedPotionId === 'hp_potion' ? 'SMALL' : player.selectedPotionId?.replace('_hp_potion', '').toUpperCase() || 'HEAL'}
                    </span>
                    <span className="text-xs md:text-lg font-black text-white italic">{currentPotionCount}</span>
                  </div>
                </button>
                <button onClick={cyclePotion} className="px-2 py-0.5 bg-black/60 border border-white/20 rounded text-[7px] font-black text-white/50 hover:text-cyan-400 hover:border-cyan-400/50 uppercase italic flex items-center gap-1 transition-all">
                   <RefreshCw size={8} /> SWAP
                </button>
              </div>
              
              {combat.battleMode !== 'GVG' && (
                <button onClick={handleSkip} className="flex items-center gap-1.5 md:gap-3 bg-slate-800 border-[3px] md:border-[4px] border-black px-2 md:px-5 py-1.5 md:py-3 rounded hover:bg-slate-700 transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 group relative overflow-hidden h-fit">
                  <div className="absolute inset-0 comic-halftone opacity-20 pointer-events-none text-white"></div>
                  <RotateCw size={12} className="md:w-5 md:h-5 text-cyan-400 group-hover:rotate-45 transition-transform relative z-10" />
                  <div className="flex flex-col items-start bg-transparent leading-none relative z-10">
                    <span className="text-[6px] md:text-[9px] font-black uppercase text-white/70 italic">Skip</span>
                    <span className="text-xs md:text-lg font-black text-white italic">RE-ID</span>
                  </div>
                </button>
              )}
              
              <div className="flex flex-col gap-1.5 items-end">
                {hasAnyScrolls && !isAutoActive && combat.battleMode !== 'GVG' && (
                  <div className="flex flex-col gap-1 items-end">
                    <button 
                      onClick={() => activateAutoScroll(view)} 
                      className="flex items-center gap-1.5 md:gap-3 bg-cyan-600 border-[2px] md:border-[4px] border-black px-2 md:px-5 py-1 md:py-3 rounded hover:bg-cyan-500 transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 group"
                    >
                      <span className="text-sm md:text-xl group-hover:scale-110 transition-transform">🪄</span>
                      <div className="flex flex-col items-start bg-transparent leading-none">
                        <span className="text-[6px] md:text-[9px] font-black uppercase text-black/70 italic">
                          {
                            player.selectedScrollId === 'auto_scroll' ? '1M AUTO' :
                            player.selectedScrollId === 'auto_scroll_3m' ? '3M AUTO' :
                            player.selectedScrollId === 'auto_scroll_6m' ? '6M AUTO' :
                            player.selectedScrollId === 'auto_scroll_9m' ? '9M AUTO' :
                            player.selectedScrollId === 'auto_scroll_12m' ? '12M AUTO' : 'LINK'
                          }
                        </span>
                        <span className="text-[10px] md:text-lg font-black text-black italic">{currentScrollCount}</span>
                      </div>
                    </button>
                    <button onClick={cycleScroll} className="px-2 py-0.5 bg-black/60 border border-white/20 rounded text-[7px] font-black text-white/50 hover:text-cyan-400 hover:border-cyan-400/50 uppercase italic flex items-center gap-1 transition-all">
                       <RefreshCw size={8} /> SWAP
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isAutoActive && (
              <div className="flex items-center gap-2 px-2 md:px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-400 border-[3px] md:border-[4px] border-black text-black rounded font-black text-[9px] md:text-xs animate-pulse shadow-[3px_3px_0_rgba(0,0,0,1)] transform rotate-1">
                 <span className="animate-bounce">🪄</span> {combat.battleMode === 'GVG' ? 'SYNCED AUTO' : `${autoTimeLeft}s`}
              </div>
            )}
          </div>
        </div>


      {/* --- BATTLE ARENA: SYMMETRICAL GRID --- */}
      <div className="w-full flex-1 relative z-40 flex flex-col lg:grid lg:grid-cols-2 gap-2 lg:gap-8 items-center px-2 md:px-12 py-1 md:py-4">
        
        {/* VS CENTRAL BADGE (ABSOLUTE OVERLAY) - Hidden on Mobile to prevent overlap */}
        <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
           <div className="w-24 h-24 bg-yellow-400 border-[8px] border-black rounded-full shadow-[10px_10px_0_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-12 animate-kapow">
              <span className="text-black font-black text-4xl italic tracking-tighter drop-shadow-[2px_2px_0_#fff]">VS</span>
           </div>
        </div>

        {/* ENEMY PANEL (LEFT) */}
        <div className={`flex flex-col items-center lg:items-end gap-1.5 md:gap-6 transition-all duration-300 ${strikingSide === 'monster' ? 'animate-strike-right' : ''}`}>
           <div className="relative">
              {currentTaunt && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-[100] animate-in zoom-in slide-in-from-bottom-6 duration-300">
                  <div className="relative bg-white border-[4px] border-black px-4 py-2 md:px-6 md:py-4 rounded-full shadow-[6px_6px_0_rgba(0,0,0,1)] min-w-[100px] md:min-w-[120px] max-w-[200px] md:max-w-[240px]">
                    <p className="text-[10px] md:text-[12px] font-black uppercase text-black italic text-center leading-none tracking-tight">{currentTaunt}</p>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 md:w-6 md:h-6 bg-white border-r-[4px] border-b-[4px] border-black rotate-45 transform"></div>
                  </div>
                </div>
              )}

              <div className={`group w-36 h-36 sm:w-44 sm:h-44 lg:w-64 lg:h-64 bg-slate-900 border-[6px] md:border-[8px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_rgba(0,0,0,1)] overflow-hidden relative transform -rotate-2 ${isHurt || impactSplash ? 'animate-flinch' : 'animate-float'}`}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-transparent z-10"></div>
                  <div className="absolute inset-0 opacity-20 comic-halftone text-red-500 z-0"></div>
                  {combat.battleMode === 'GVG' ? (
                    <img 
                      src={`/assets/playeravatar/CrystleHunterAvatar (${enemy.avatarNum || 1}).jpg`} 
                      className="w-full h-full object-cover relative z-10 filter brightness-110 contrast-125" 
                      alt={enemy.name}
                    />
                  ) : (
                    <img
                        src={`/assets/monsters/${enemy.folder || 'Neon Slums'}/${enemy.name}.png`}
                        alt={enemy.name}
                        className="w-full h-full object-cover relative z-10 filter brightness-110 contrast-125"
                        onError={(e) => {
                            const folder = enemy.folder || 'Neon Slums';
                            if (e.target.src.endsWith('.png')) e.target.src = `/assets/monsters/${folder}/${enemy.name}.jpg`;
                            else { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + enemy.name; }
                        }}
                    />
                  )}
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-30 flex flex-col gap-1 transform rotate-3 scale-75 sm:scale-100 origin-top-right">
                   <div className="bg-emerald-600 border-[3px] border-black px-2 py-0.5 sm:px-3 sm:py-1 shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center gap-1 group overflow-hidden relative">
                      <div className="absolute inset-0 comic-halftone opacity-20 text-black"></div>
                      <Star size={10} className="text-white animate-pulse" />
                      <span className="text-[8px] sm:text-[10px] font-black text-white italic drop-shadow-md">XP {enemy.xp}</span>
                   </div>
                   <div className="bg-amber-500 border-[3px] border-black px-2 py-0.5 sm:px-3 sm:py-1 shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center gap-1 group overflow-hidden relative">
                      <div className="absolute inset-0 comic-halftone opacity-20 text-black"></div>
                      <Gem size={10} className="text-white" />
                      <span className="text-[8px] sm:text-[10px] font-black text-white italic drop-shadow-md">GX {enemy.loot}</span>
                   </div>
                </div>

                <ImpactSplash splash={impactSplash} />
              </div>


              {combat.showVictoryWindow && (
                <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in zoom-in duration-300 border-[6px] md:border-[8px] border-black shadow-2xl">
                   <div className="absolute inset-0 comic-halftone opacity-40 text-yellow-500"></div>
                   <div className="flex flex-col items-center gap-3 md:gap-4 animate-kapow relative z-10">
                      <div className="bg-yellow-400 border-[4px] md:border-[6px] border-black px-6 py-3 md:px-10 md:py-6 transform -rotate-6 shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)]">
                        <p className="text-black font-black text-2xl md:text-5xl uppercase italic tracking-tighter drop-shadow-[2px_2px_0_#fff]">BATTLE WON!</p>
                      </div>
                      <p className="text-white/60 font-black uppercase text-[8px] md:text-xs tracking-widest italic animate-pulse">
                        {combat.battleMode === 'GVG' ? 'SYNCING WAR RECORD...' : 'Scanning Next Sector...'}
                      </p>
                   </div>
                </div>
              )}
           </div>

            <div className="w-full max-w-[280px] md:max-w-[320px] space-y-2 md:space-y-4">
                <div className="flex flex-col gap-2 relative">
                  <div className="flex justify-between items-end">
                    <div className="bg-red-600 text-white px-3 md:px-5 py-1 md:py-2 border-[4px] md:border-[5px] border-black transform rotate-1 shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] flex flex-col">
                        <span className="text-[7px] md:text-[8px] font-black uppercase opacity-70 tracking-widest italic leading-none mb-0.5">Threat Identified</span>
                        <h2 className="text-xs md:text-2xl font-black uppercase tracking-tighter italic leading-none truncate max-w-[120px] md:max-w-none">{enemy.name}</h2>
                    </div>
                  </div>


                  <div className="grid grid-cols-3 gap-1 md:gap-2 bg-black/60 border-[3px] md:border-4 border-black p-1 md:p-2 transform -rotate-1 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                     <div className="flex flex-col items-center p-0.5 md:p-1 border-r border-white/10 text-red-500">
                        <span className="text-[6px] md:text-[7px] font-black uppercase">STR</span>
                        <span className="text-[10px] md:text-xs font-black italic">{enemy.str}</span>
                     </div>
                     <div className="flex flex-col items-center p-0.5 md:p-1 border-r border-white/10 text-emerald-500">
                        <span className="text-[6px] md:text-[7px] font-black uppercase">AGI</span>
                        <span className="text-[10px] md:text-xs font-black italic">{enemy.agi}</span>
                     </div>
                     <div className="flex flex-col items-center p-0.5 md:p-1 text-cyan-500">
                        <span className="text-[6px] md:text-[7px] font-black uppercase">DEX</span>
                        <span className="text-[10px] md:text-xs font-black italic">{enemy.dex}</span>
                     </div>
                  </div>
                </div>
                
                <div className="w-full group">
                   <div className="flex justify-between items-center mb-0.5 px-1">
                      <span className="text-[8px] md:text-[9px] font-black text-red-500 uppercase italic">Power Core</span>
                      <span className="text-[8px] md:text-[10px] font-black text-white italic">{Math.floor(enemy.hp)}/{Math.floor(enemy.maxHp)}</span>
                   </div>
                   <div className="w-full h-4 md:h-8 bg-black border-[3px] md:border-[5px] border-black p-0.5 relative shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center">
                      <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300 relative" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}>
                         <div className="absolute inset-0 comic-halftone opacity-30 pointer-events-none text-black"></div>
                         <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                   </div>
                </div>
            </div>
        </div>

        {/* PLAYER PANEL (RIGHT) */}
        <div className={`flex flex-col items-center md:items-start gap-1.5 md:gap-6 transition-all duration-300 ${strikingSide === 'player' ? 'animate-strike-left' : ''}`}>
           <div className="relative">
              {playerTaunt && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-[60] animate-in zoom-in slide-in-from-bottom-6 duration-300">
                  <div className="relative bg-cyan-500 border-[4px] border-black px-4 py-2 md:px-6 md:py-4 rounded-full shadow-[6px_6px_0_rgba(0,0,0,1)] min-w-[100px] md:min-w-[120px] max-w-[200px] md:max-w-[240px]">
                    <p className="text-[10px] md:text-[12px] font-black uppercase text-white italic text-center leading-none tracking-tight">{playerTaunt}</p>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 md:w-6 md:h-6 bg-cyan-500 border-r-[4px] border-b-[4px] border-black rotate-45 transform"></div>
                  </div>
                </div>
              )}

              {lastLoot && (
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-[70] animate-bounce">
                  <div className="bg-yellow-400 border-[4px] md:border-[5px] border-black p-2 md:p-3 flex flex-col items-center shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] transform rotate-12">
                     <div className="absolute inset-0 comic-halftone opacity-20 text-white"></div>
                    <span className="text-2xl md:text-4xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">{lastLoot.icon}</span>
                    <span className="text-[8px] md:text-[10px] font-black uppercase text-black italic tracking-tighter mt-0.5 md:mt-1 whitespace-nowrap">FOUND: {lastLoot.name}!</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 md:gap-8">
                <div className={`w-36 h-36 sm:w-44 sm:h-44 lg:w-64 lg:h-64 bg-slate-900 border-[6px] md:border-[8px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_rgba(8,145,178,0.3)] overflow-hidden relative transform rotate-2 ${strikingSide === 'monster' && playerImpactSplash ? 'animate-flinch' : 'animate-float'}`}>
                    <div className="absolute inset-0 bg-gradient-to-tl from-black/80 via-transparent to-transparent z-10"></div>
                    <div className="absolute inset-0 opacity-20 comic-halftone text-cyan-500 z-0"></div>
                    {player.avatar && (
                      <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover filter contrast-125" />
                    )}
                    <ImpactSplash splash={playerImpactSplash} />
                </div>
                <div className="flex-shrink-0">
                   <SquadHUD player={player} dragonTimeLeft={dragonTimeLeft} TAVERN_MATES={TAVERN_MATES} />
                </div>
              </div>
           </div>

            <div className="w-full max-w-[280px] md:max-w-[320px] space-y-2 md:space-y-4">
                <div className="flex flex-col gap-2 relative">
                  <div className="flex justify-between items-end flex-row-reverse">
                    <div className="bg-cyan-600 text-white px-3 md:px-5 py-1 md:py-2 border-[4px] md:border-[5px] border-black transform -rotate-1 shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] flex flex-col items-end">
                        <span className="text-[7px] md:text-[8px] font-black uppercase opacity-70 tracking-widest italic leading-none mb-0.5">Assigned Hunter</span>
                        <h2 className="text-xs md:text-2xl font-black uppercase tracking-tighter italic leading-none truncate max-w-[120px] md:max-w-none">{player.name}</h2>
                    </div>
                    <div className="bg-black border-[3px] md:border-[4px] border-cyan-500 px-2 py-1 text-[8px] md:text-sm font-black text-white uppercase italic transform rotate-12 shadow-lg">LVL {player.level}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 md:gap-2 bg-black/60 border-[3px] md:border-4 border-black p-1 md:p-2 transform rotate-1 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                     <div className="flex flex-col items-center p-0.5 md:p-1 border-r border-white/10 text-red-500">
                        <span className="text-[6px] md:text-[7px] font-black uppercase">STR</span>
                        <span className="text-[10px] md:text-xs font-black italic">{totalStats.str}</span>
                     </div>
                     <div className="flex flex-col items-center p-0.5 md:p-1 border-r border-white/10 text-emerald-500">
                        <span className="text-[6px] md:text-[7px] font-black uppercase">AGI</span>
                        <span className="text-[10px] md:text-xs font-black italic">{totalStats.agi}</span>
                     </div>
                     <div className="flex flex-col items-center p-0.5 md:p-1 text-cyan-500">
                        <span className="text-[6px] md:text-[7px] font-black uppercase">DEX</span>
                        <span className="text-[10px] md:text-xs font-black italic">{totalStats.dex}</span>
                     </div>
                  </div>
                </div>

                
                <div className="w-full group">
                   <div className="flex justify-between items-center mb-0.5 px-1 flex-row-reverse">
                      <span className="text-[8px] md:text-[9px] font-black text-cyan-500 uppercase italic">Biological Core</span>
                      <span className="text-[8px] md:text-[10px] font-black text-white italic">{Math.floor(player.hp)}/{Math.floor(player.maxHp)}</span>
                   </div>
                   <div className="w-full h-4 md:h-8 bg-black border-[3px] md:border-[5px] border-black p-0.5 relative shadow-[-4px_4px_0_rgba(0,0,0,1)] md:shadow-[-6px_6px_0_rgba(6,182,212,0.3)] transition-all overflow-hidden flex items-center">
                      <div className="h-full bg-gradient-to-l from-cyan-800 to-cyan-500 transition-all duration-300 relative ml-auto" style={{ width: `${(player.hp / player.maxHp) * 100}%` }}>
                         <div className="absolute inset-0 comic-halftone opacity-30 pointer-events-none text-black"></div>
                         <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                      </div>
                   </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- HUD BOTTOM --- */}
      <div className="w-full max-w-2xl space-y-2 md:space-y-6 z-50 px-4 mb-2 md:mb-6">
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 relative">
          <div className="flex-1 flex gap-4 relative group">
            {isStunned && (
              <div className="absolute inset-0 bg-black/95 backdrop-blur-md border-[4px] md:border-[5px] border-red-600 z-30 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] transform scale-[1.03] animate-in zoom-in">
                <div className="flex items-center gap-2 md:gap-4 animate-pulse">
                  <Skull size={20} className="md:w-6 md:h-6 text-red-500" />
                  <p className="font-black text-sm md:text-2xl uppercase italic drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">SYSTEM STUNNED! {Math.ceil(stunTimeLeft)}s</p>
                </div>
              </div>
            )}

            {isMissed && !isStunned && (
              <div className="absolute inset-0 bg-slate-400 border-[4px] md:border-[5px] border-black z-30 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] transform scale-[1.03] animate-in zoom-in">
                 <div className="absolute inset-0 comic-halftone opacity-20 text-black"></div>
                 <p className="font-black text-sm md:text-2xl uppercase italic text-black tracking-tight">ATTACK DEFLECTED! {missTimeLeft.toFixed(1)}s</p>
              </div>
            )}

            <button 
              onClick={() => combat.handleAttack()} 
              disabled={isStunned || isMissed || combat.showDefeatedWindow || combat.showVictoryWindow} 
              className={`flex-1 py-3 md:py-6 rounded border-[4px] md:border-[5px] border-black font-black text-xl md:text-4xl shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-y-1 italic flex flex-col items-center justify-center gap-0 leading-tight ${(isStunned || isMissed) ? 'opacity-0' : 'bg-red-600 text-white'} ${isAutoActive ? 'animate-pulse' : ''} group overflow-hidden relative`}
            >
              <div className="absolute inset-0 comic-halftone opacity-30 text-black pointer-events-none group-hover:scale-125 transition-transform"></div>
              <span className="relative z-10 drop-shadow-[2px_2px_0_rgba(0,0,0,1)] tracking-tighter">{isAutoActive ? 'LOCK-ON FIRE' : 'STRIKE!'}</span>
              <span className="text-[7px] md:text-[9px] opacity-70 tracking-[0.3em] uppercase relative z-10 font-black">Combat Execution Phase</span>
            </button>
          </div>
          
          <button 
            onClick={combat.handleRetreat} 
            className={`px-6 md:px-14 py-3 md:py-6 rounded font-black uppercase text-xs md:text-lg tracking-widest border-[4px] md:border-[5px] border-black transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic bg-slate-300 text-black hover:bg-white flex items-center justify-center hover:shadow-[10px_10px_0_rgba(0,0,0,1)]`}
          >
            RETREAT
          </button>
        </div>

        {/* Categorized Drop Manifest Button */}
        <div className="flex justify-center mb-2">
           <button 
             onClick={() => setIsLootModalOpen(true)}
             className="group flex items-center gap-2 md:gap-4 bg-black/80 hover:bg-black border-2 border-cyan-500/30 hover:border-cyan-400 p-2 md:p-3 rounded-full backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
           >
              <div className="flex items-center gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-cyan-600 border-2 border-black text-black font-black text-[10px] md:text-xs uppercase italic rounded-full shadow-[3px_3px_0_rgba(0,0,0,1)] group-hover:bg-cyan-400 transition-colors">
                 <Gift size={14} /> LOOT MANIFEST
              </div>
              <div className="flex -space-x-2 md:-space-x-3 pr-2">
                 {possibleDrops.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="w-6 h-6 md:w-8 md:h-8 bg-slate-900 border-2 border-black rounded-full flex items-center justify-center text-xs md:text-sm shadow-lg ring-2 ring-transparent group-hover:ring-cyan-400/50 transition-all">
                       {item.icon}
                    </div>
                 ))}
                 {possibleDrops.length > 4 && (
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-black border-2 border-black rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-black text-cyan-500 italic shadow-lg">
                       +{possibleDrops.length - 4}
                    </div>
                 )}
              </div>
           </button>
        </div>

        {/* Tactical Drop Manifest Modal */}
        {isLootModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="absolute inset-0 comic-halftone opacity-20 text-cyan-500 pointer-events-none"></div>
             
             <div className="bg-slate-950 border-[5px] border-black w-full max-w-2xl max-h-[85vh] flex flex-col relative shadow-[10px_10px_0_rgba(0,0,0,1)] animate-in zoom-in slide-in-from-bottom-8 duration-500 overflow-hidden">
                {/* Header */}
                <div className="bg-cyan-600 border-b-[5px] border-black p-4 flex justify-between items-center transform -skew-x-2 w-full mt-[-2px] ml-[-2px] relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="bg-black p-2 rounded transform rotate-12">
                         <Target className="text-cyan-400" />
                      </div>
                      <div className="flex flex-col">
                        <h2 className="text-xl md:text-3xl font-black text-black uppercase italic tracking-tighter leading-none">LOOT SCAN_RESULTS</h2>
                        <span className="text-[10px] font-black text-black/60 uppercase tracking-widest leading-none mt-1">Grid Sector: {selectedMap?.name}</span>
                      </div>
                   </div>
                   <button 
                     onClick={() => setIsLootModalOpen(false)}
                     className="bg-black text-white p-2 md:p-3 border-2 border-black hover:bg-red-600 transition-colors shadow-[4px_4px_0_rgba(255,255,255,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                   >
                      <X size={20} />
                   </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-8 scroll-smooth">
                   {Object.entries(categorizedLoot).sort((a, b) => {
                     const order = { 'Legendary': 0, 'Epic': 1, 'Rare': 2, 'Uncommon': 3, 'Common': 4 };
                     return (order[a[0]] ?? 5) - (order[b[0]] ?? 5);
                   }).map(([rarity, items]) => (
                      <div key={rarity} className="space-y-4">
                         <div className="flex items-center gap-3">
                            <h3 className={`text-sm md:text-lg font-black uppercase italic tracking-widest px-4 py-1 border-[3px] border-black transform -rotate-1 shadow-[4px_4px_0_rgba(0,0,0,1)] ${
                              rarity === 'Legendary' ? 'bg-amber-500 text-black' : 
                              rarity === 'Epic' ? 'bg-purple-600 text-white' : 
                              rarity === 'Rare' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
                            }`}>
                               {rarity} FREQUENCIES
                            </h3>
                            <div className="flex-1 h-[2px] bg-white/10"></div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {items.map((item, idx) => (
                               <div key={idx} className="bg-black/40 border-2 border-white/5 p-3 md:p-4 rounded-xl flex items-center gap-4 group hover:bg-white/5 hover:border-cyan-500/50 transition-all">
                                  <div className={`w-12 h-12 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center text-3xl md:text-4xl bg-slate-900 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] rounded-xl transform transition-transform group-hover:scale-110 group-hover:rotate-3 ${
                                    item.rarity === 'Legendary' ? 'border-amber-500/50' : ''
                                  }`}>
                                     {item.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className="text-xs md:text-base font-black text-white uppercase italic truncate">
                                          {item.name}
                                        </h4>
                                        <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                           <Gem size={10} className="text-emerald-500" />
                                           <span className="text-[9px] md:text-[11px] font-black text-emerald-500 font-mono italic">{item.cost || 100}</span>
                                        </div>
                                     </div>
                                     <div className="flex flex-wrap gap-2">
                                        <span className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.type}</span>
                                        <div className="flex gap-1">
                                           {Object.entries(item.stats || {}).map(([s, v]) => v !== 0 && (
                                              <span key={s} className="text-[7px] md:text-[8px] font-black text-cyan-400/70 border border-cyan-400/20 px-1 rounded uppercase">+{v} {s}</span>
                                           ))}
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-black/80 border-t-[5px] border-black flex justify-center">
                   <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black text-white/40 uppercase italic tracking-[0.3em]">
                      <RotateCw size={12} className="animate-spin-slow" /> Sector scan signal synchronized with grid database
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

    </div>
  );
});
