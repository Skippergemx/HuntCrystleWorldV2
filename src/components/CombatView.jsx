import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, MousePointer, Coffee, X, Skull, Lock, Activity, Shield, Swords, Target, Gem, Gift, Star, HelpCircle, RotateCw, Search, List, ChevronRight, RefreshCw, FlaskConical, WandSparkles, Sparkles } from 'lucide-react';
import { ImpactSplash, BattleParticles } from './CombatEffects';
import { AvatarMedia, SquadHUD, ConfirmationModal } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const CombatView = React.memo(() => {
  const {
    player, adventure, combat, actions, gameLoop, audio, totalStats, autoScrollState,
    LOOTS, TAVERN_MATES, PETS_METADATA, openGuide, syncPlayer, lowPerfMode, FOODS
  } = useGame();

  const { enemy, depth, setDepth, view, setView, selectedMap, killsInFloor, isHurt, handleSkip } = adventure;
  const { 
    stunTimeLeft, missTimeLeft, combatState, impactSplash, playerImpactSplash, 
    strikingSide, currentTaunt, playerTaunt, lastLoot, isTreasury 
  } = combat;
  const { handleHeal, activateAutoScroll, cyclePotion, cycleScroll, eatFood } = actions;
  const { autoTimeLeft, dragonTimeLeft, penaltyRemaining, buffTimeLeft, foodTimeLeft } = gameLoop;

  const isAutoActive = autoTimeLeft > 0;
  const isStunned = stunTimeLeft > 0;
  const isMissed = missTimeLeft > 0;
  const isMateBuffActive = (buffTimeLeft || 0) > 0;
  const activeMate = isMateBuffActive ? TAVERN_MATES.find(m => m.id === player.hiredMate) : null;

  const activePet = useMemo(() => {
    if (!player.petId || !PETS_METADATA) return null;
    return PETS_METADATA.find(p => p.id === player.petId) || null;
  }, [player.petId, PETS_METADATA]);

  const petElementIcon = activePet?.element === 'Pyro' ? '🔥' :
    activePet?.element === 'Hydro' ? '💧' :
    activePet?.element === 'Gale' ? '⚡' :
    activePet?.element === 'Earthen' ? '⛰️' : '✨';

  const [isLootModalOpen, setIsLootModalOpen] = useState(false);
  const [isPossibleDropsModalOpen, setIsPossibleDropsModalOpen] = useState(false);
  const [showRetreatConfirm, setShowRetreatConfirm] = useState(false);
  const [showPurifyConfirm, setShowPurifyConfirm] = useState(false);
  
  const battleParticlesRef = useRef(null);
  const enemyContainerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const arenaRef = useRef(null);

  const possibleDrops = useMemo(() => {
    return selectedMap?.lootTable ? selectedMap.lootTable.map(id => LOOTS.find(l => l.id === id)).filter(Boolean) : [];
  }, [selectedMap, LOOTS]);

  const potionCountData = useMemo(() => {
    const sel = player.selectedPotionId || 'hp_potion';
    const invCount = Object.values(player.inventory || {}).filter(i => i && i.id?.startsWith(sel)).length;
    const baseCount = player.potions || 0;
    return {
      selected: sel,
      count: sel === 'hp_potion' ? (invCount + baseCount) : invCount,
      hasSelected: (sel === 'hp_potion' ? (invCount + baseCount) : invCount) > 0
    };
  }, [player.selectedPotionId, player.inventory, player.potions]);

  const scrollCountData = useMemo(() => {
    const sel = player.selectedScrollId || 'auto_scroll';
    const invCount = Object.values(player.inventory || {}).filter(i => i && i.id?.startsWith(sel)).length;
    const baseCount = player.autoScrolls || 0;
    return {
      selected: sel,
      count: sel === 'auto_scroll' ? (invCount + baseCount) : invCount,
      hasSelected: (sel === 'auto_scroll' ? (invCount + baseCount) : invCount) > 0
    };
  }, [player.selectedScrollId, player.inventory, player.autoScrolls]);

  const hasAnyPotions = useMemo(() => (player.potions > 0) || Object.values(player.inventory || {}).some(i => i?.id?.includes('hp_potion')), [player.potions, player.inventory]);
  const hasAnyScrolls = useMemo(() => (player.autoScrolls > 0) || Object.values(player.inventory || {}).some(i => i?.id?.includes('auto_scroll')), [player.autoScrolls, player.inventory]);


  const foodInventory = useMemo(() => {
    if (!FOODS) return [];
    const owned = [];
    FOODS.forEach(food => {
      const instances = Object.values(player.inventory || {}).filter(i => i?.id?.startsWith(food.id));
      if (instances.length > 0) owned.push({ ...food, count: instances.length, instanceId: instances[0].id });
    });
    return owned;
  }, [player.inventory, FOODS]);
  const [selectedFoodIdx, setSelectedFoodIdx] = useState(0);
  const selectedFood = foodInventory[selectedFoodIdx] || null;
  const isFoodActive = (foodTimeLeft || 0) > 0;

  const cycleFoodSelection = () => setSelectedFoodIdx(prev => foodInventory.length > 0 ? (prev + 1) % foodInventory.length : 0);

  const categorizedLoot = useMemo(() => {
    const categories = {};
    if (!combat.sessionRewards || !combat.sessionRewards.loots) return categories;
    combat.sessionRewards.loots.forEach(item => {
      const rarity = item.rarity || 'Common';
      if (!categories[rarity]) categories[rarity] = [];
      const existing = categories[rarity].find(i => (i.id.replace(/(_\d+)+$/, '') === item.id.replace(/(_\d+)+$/, '')) || i.name === item.name);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
      } else {
        categories[rarity].push({ ...item, count: 1 });
      }
    });
    return categories;
  }, [combat.sessionRewards]);

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

  const tamingTools = useMemo(() => ({
    'Pyro': 'taming_pyro',
    'Hydro': 'taming_hydro',
    'Gale': 'taming_gale',
    'Earthen': 'taming_earthen',
    'Cosmic': 'taming_cosmic'
  }), []);

  const cosmicMonsters = useMemo(() => ['null_stalker', 'void_wraith', 'abyssal_crawler', 'singularity_orb', 'quantum_shade', 'gravity_eater', 'dimensional_shifter', 'entropy_golem', 'rift_lurker', 'paradox_husk'], []);

  const currentEnemyElement = useMemo(() => {
    if (!enemy) return null;
    if (cosmicMonsters.includes(enemy.id)) return 'Cosmic';
    const el = enemy.id?.split('_')[0];
    return el?.charAt(0).toUpperCase() + el?.slice(1);
  }, [enemy, cosmicMonsters]);

  const requiredTool = useMemo(() => tamingTools[currentEnemyElement], [tamingTools, currentEnemyElement]);
  const hasRequiredTool = useMemo(() => requiredTool && Object.values(player.inventory || {}).some(i => i.id?.startsWith(requiredTool)), [player.inventory, requiredTool]);
  const toolDetails = useMemo(() => requiredTool ? LOOTS.find(l => l.id === requiredTool) : null, [requiredTool, LOOTS]);

  useEffect(() => {
    // Phase 4: Emergency Gate Reset on Mount
    // Ensures if the player re-enters rapidly, the mutex is clean
    if (combat.combatBusRef) {
      combat.combatBusRef.current = false;
    }
  }, []);

  // PLASMA IMPACT ENGINE: Synchronized with Combat Bus (V4 Shared Arena)
  useEffect(() => {
    if (impactSplash && battleParticlesRef.current && enemyContainerRef.current && arenaRef.current) {
      const rect = enemyContainerRef.current.getBoundingClientRect();
      const arenaRect = arenaRef.current.getBoundingClientRect();
      battleParticlesRef.current.emit(
        (rect.left - arenaRect.left) + rect.width / 2, 
        (rect.top - arenaRect.top) + rect.height / 2, 
        'spark', 
        { speed: 20, size: 20, gravity: -0.2, count: 80 }
      );
    }
  }, [impactSplash]);

  useEffect(() => {
    if (playerImpactSplash && battleParticlesRef.current && playerContainerRef.current && arenaRef.current) {
      const rect = playerContainerRef.current.getBoundingClientRect();
      const arenaRect = arenaRef.current.getBoundingClientRect();
      battleParticlesRef.current.emit(
        (rect.left - arenaRect.left) + rect.width / 2, 
        (rect.top - arenaRect.top) + rect.height / 2, 
        'spark', 
        { speed: 20, size: 20, gravity: -0.2, count: 80 }
      );
    }
  }, [playerImpactSplash]);

  if (!enemy) return (
    <div className="flex-1 flex items-center justify-center bg-black text-cyan-500 font-black italic uppercase tracking-widest animate-pulse">
      Initialising Combat Stream...
    </div>
  );

  return (
    <div 
      ref={arenaRef}
      className={`flex-1 p-4 flex flex-col items-center justify-between gap-2 animate-in fade-in relative overflow-hidden ${arenaTheme.bg} ${isHurt ? 'animate-damage' : ''}`}
    >
      <BattleParticles ref={battleParticlesRef} lowPerfMode={lowPerfMode} />
      {/* Dynamic Background Backdrop */}
      {arenaTheme.backdrop && (
        <div className="absolute inset-0 z-0 select-none">
          <img src={arenaTheme.backdrop} className="w-full h-full object-cover opacity-40 mix-blend-luminosity" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
        </div>
      )}



      {/* Halftone Overlay HUD */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-20 comic-halftone" style={{ color: arenaTheme.dot }}></div>

      {/* --- HUD TOP: CONSOLIDATED MISSION COMMAND ARRAY --- */}
      <div className="w-full z-50 px-2 md:px-6 pt-2 md:pt-4 flex flex-row items-center justify-between gap-1 md:gap-4 overflow-x-auto no-scrollbar pb-2">
        
        {/* 1. TACTICAL GUIDE (LEFT ALIGNED) */}
        <button
          onClick={() => openGuide('dungeon')}
          className={`p-1.5 md:p-3 ${arenaTheme.banner} border-[2px] md:border-[4px] border-black text-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:brightness-110 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shrink-0`}
          title="Tactical Guide"
        >
          <HelpCircle size={14} className="md:w-6 md:h-6" strokeWidth={4} />
        </button>

        {/* 2. CONSOLIDATED MISSION BADGE */}
        <div className={`flex items-center justify-center px-4 md:px-8 py-1.5 md:py-2.5 bg-black border-[2px] md:border-[4px] ${combat.battleMode === 'GVG' ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : arenaTheme.hud} rounded shadow-[3px_3px_0_rgba(0,0,0,1)] flex-1 min-w-[120px] max-w-[320px] transform -rotate-1`}>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[5px] md:text-[9px] font-black uppercase opacity-70 whitespace-nowrap text-white tracking-widest">
              {combat.battleMode === 'GVG' ? `RAID: [${enemy.syndicateTag}]` : (selectedMap?.name || 'Sector Alpha')}
            </span>
            <span className="text-[10px] md:text-xl font-black tracking-[0.2em] italic uppercase whitespace-nowrap text-white">
              {combat.battleMode === 'GVG' ? 'SYN_RAID' : `Floor ${depth}`}
            </span>
          </div>
        </div>

        {/* 2.5 MISSION ASSETS (MANIFEST) */}
        <button
          onClick={() => setIsPossibleDropsModalOpen(true)}
          className="group flex flex-col items-center justify-center w-8 h-8 md:w-12 md:h-12 bg-slate-900 border-2 border-cyan-500 rounded md:rounded-lg shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-cyan-500 transition-all active:scale-95 shrink-0"
          title="Sector Drop Manifest"
        >
          <Search size={14} className="text-cyan-500 group-hover:text-black transition-colors md:w-6 md:h-6" />
          <span className="hidden md:block text-[6px] font-black text-cyan-500 group-hover:text-black uppercase mt-0.5 tracking-tighter">DROPS</span>
        </button>


        {/* 3. CONSOLIDATED BIOLOGICAL/RESONANCE TOOLS */}
        <div className="flex items-center gap-1 md:gap-2 p-1 md:p-2 bg-slate-900/80 border-[2px] border-black rounded shadow-[2px_2px_0_rgba(0,0,0,1)] backdrop-blur-md">
          {/* Potion Slot */}
          <div className="flex items-center gap-1">
            <button onClick={cyclePotion} className="p-1 md:p-2 bg-slate-800 border-2 border-black text-white hover:text-cyan-400 rounded shadow-[1px_1px_0_rgba(0,0,0,1)]">
              <RefreshCw size={10} className="md:w-4 md:h-4" />
            </button>
            <button onClick={handleHeal} disabled={!potionCountData.hasSelected} className="flex items-center gap-1 bg-red-600 border-2 border-black px-1.5 md:px-3 py-1 rounded hover:bg-red-500 shadow-[2px_2px_0_rgba(0,0,0,1)] disabled:opacity-30 group">
              <span className="text-[10px] md:text-lg">🧪</span>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[4px] md:text-[7px] font-black uppercase text-white/70 italic">{potionCountData.selected === 'hp_potion' ? 'SM' : 'MAX'}</span>
                <span className="text-[8px] md:text-sm font-black text-white italic">{potionCountData.count}</span>
              </div>
            </button>
          </div>

          <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

          {/* Scroll Slot */}
          {combat.battleMode !== 'GVG' && (
            <div className="flex items-center gap-1">
              {isAutoActive ? (
                <div className="flex items-center gap-2 bg-cyan-600 border-2 border-black px-2 md:px-4 py-1 rounded shadow-[2px_2px_0_rgba(0,0,0,1)] animate-pulse">
                  <WandSparkles size={12} className="text-black animate-spin-slow" />
                  <span className="text-[9px] md:text-base font-black text-black italic">{autoTimeLeft}s</span>
                </div>
              ) : (
                hasAnyScrolls && (
                  <>
                    <button onClick={cycleScroll} className="p-1 md:p-2 bg-slate-800 border-2 border-black text-white hover:text-cyan-400 rounded shadow-[1px_1px_0_rgba(0,0,0,1)]">
                      <RefreshCw size={10} className="md:w-4 md:h-4" />
                    </button>
                    <button onClick={() => activateAutoScroll(view)} className="flex items-center gap-1 bg-cyan-600 border-2 border-black px-1.5 md:px-4 py-1 rounded hover:bg-cyan-500 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      <WandSparkles size={12} className="text-black" />
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-[4px] md:text-[7px] font-black uppercase text-black/70 italic">
                          {scrollCountData.selected === 'auto_scroll' ? '1m' : scrollCountData.selected === 'auto_scroll_3m' ? '3m' : scrollCountData.selected === 'auto_scroll_6m' ? '6m' : scrollCountData.selected === 'auto_scroll_9m' ? '9m' : '12m'}
                        </span>
                        <span className="text-[8px] md:text-sm font-black text-black italic">{scrollCountData.count}</span>
                      </div>
                    </button>
                  </>
                )
              )}
            </div>
          )}

          {/* Food Slot */}
          {combat.battleMode !== 'GVG' && (
            <div className="flex items-center gap-1">
              <div className="w-[1px] h-6 bg-white/10 mx-0.5" />
              {isFoodActive ? (
                <div
                  className="flex items-center gap-1 bg-emerald-700 border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0_rgba(0,0,0,1)] animate-pulse"
                  title={`Food buff active: ${foodTimeLeft}s remaining`}
                >
                  <span className="text-base leading-none">
                    {player.activeFoodEffect?.stat === 'str' ? '💪' : player.activeFoodEffect?.stat === 'dex' ? '🎯' : '⚡'}
                  </span>
                  <span className="text-[9px] md:text-sm font-black text-white italic">{foodTimeLeft}s</span>
                </div>
              ) : (
                foodInventory.length > 0 && (
                  <>
                    {foodInventory.length > 1 && (
                      <button
                        onClick={cycleFoodSelection}
                        className="p-1 md:p-2 bg-slate-800 border-2 border-black text-white hover:text-emerald-400 rounded shadow-[1px_1px_0_rgba(0,0,0,1)]"
                        title="Cycle food selection"
                      >
                        <RefreshCw size={10} className="md:w-4 md:h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => selectedFood && eatFood(selectedFood)}
                      disabled={!selectedFood}
                      className="flex items-center gap-1 bg-emerald-700 border-2 border-black px-1.5 md:px-3 py-1 rounded hover:bg-emerald-600 shadow-[2px_2px_0_rgba(0,0,0,1)] disabled:opacity-30"
                      title={selectedFood ? `${selectedFood.name}: ${selectedFood.effectLabel}` : 'No food'}
                    >
                      <span className="text-base leading-none">{selectedFood?.icon || '🍽️'}</span>
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-[4px] md:text-[7px] font-black uppercase text-white/70 italic">EAT</span>
                        <span className="text-[8px] md:text-sm font-black text-white italic">{selectedFood?.count || 0}</span>
                      </div>
                    </button>
                  </>
                )
              )}
            </div>
          )}
        </div>

        {/* 4. QUICK EXIT (RIGHT ALIGNED) */}
        <button
          onClick={() => setShowRetreatConfirm(true)}
          className="p-1.5 md:p-3 bg-red-600 border-[2px] md:border-[4px] border-black text-white shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shrink-0"
          title="Quick Exit"
        >
          <X size={14} className="md:w-6 md:h-6" strokeWidth={4} />
        </button>
      </div>


      {/* --- BATTLE ARENA: RESTRUCTURED FOR SYMMETRY --- */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col relative z-40 px-2 md:px-12 py-2">
        
        {/* VS CENTRAL BADGE */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
           <div className="w-12 h-12 md:w-24 md:h-24 bg-yellow-400 border-[4px] md:border-[8px] border-black rounded-full shadow-[5px_5px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-12 animate-kapow">
             <span className="text-black font-black text-xl md:text-4xl italic tracking-tighter drop-shadow-[2px_2px_0_#fff]">VS</span>
           </div>
        </div>

        {/* BATTLE LOCKOUT OVERLAYS */}
        {isStunned && (
          <div className="absolute inset-x-2 md:inset-x-12 top-[40%] -translate-y-1/2 bg-black/95 backdrop-blur-md border-[4px] md:border-[6px] border-red-600 z-[110] flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.5)] transform -rotate-1 animate-in zoom-in py-6 md:py-10">
            <div className="flex items-center gap-4 md:gap-8 animate-pulse">
              <Skull size={32} className="md:w-12 md:h-12 text-red-500" />
              <div className="flex flex-col items-center">
                <p className="font-black text-lg md:text-5xl uppercase italic drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] text-white text-center">SYSTEM STUNNED!</p>
                <p className="text-red-500 font-black text-[10px] md:text-xl uppercase tracking-[0.3em] font-mono italic mt-2">REBOOTING: {Math.ceil(stunTimeLeft)}S</p>
              </div>
            </div>
          </div>
        )}

        {isMissed && !isStunned && (
          <div className="absolute inset-x-2 md:inset-x-12 top-[40%] -translate-y-1/2 bg-slate-400 border-[4px] md:border-[6px] border-black z-[110] flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] transform rotate-1 animate-in zoom-in py-6 md:py-10">
            <div className="absolute inset-0 comic-halftone opacity-20 text-black"></div>
            <div className="flex items-center gap-4 md:gap-8">
               <Activity size={32} className="md:w-12 md:h-12 text-black" />
               <p className="font-black text-lg md:text-5xl uppercase italic text-black tracking-tight text-center">ATTACK DEFLECTED!</p>
            </div>
          </div>
        )}

        {/* ENGAGEMENT ZONE (AVATARS) */}
        <div className="grid grid-cols-2 gap-4 md:gap-12 items-center mb-4 md:mb-8">
          {/* ENEMY AVATAR */}
          <div className={`flex flex-col items-center lg:items-end transition-all duration-300 ${strikingSide === 'monster' ? 'animate-strike-right' : ''}`}>
             <div className="relative">
                <div 
                  ref={enemyContainerRef}
                  className={`group w-32 h-32 sm:w-44 sm:h-44 lg:w-64 lg:h-64 bg-slate-900 border-[5px] md:border-[8px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_rgba(0,0,0,1)] overflow-hidden relative transform -rotate-2 ${isHurt || impactSplash ? 'animate-flinch' : (requiredTool ? 'animate-tame-shine' : 'animate-float')}`}
                >
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
                      src={`/assets/monsters/${enemy.folder || 'Neon Slums'}/${enemy.name}.jpg`}
                      alt={enemy.name}
                      className="w-full h-full object-cover relative z-10 filter brightness-110 contrast-125"
                      onError={(e) => {
                        const folder = enemy.folder || 'Neon Slums';
                        if (e.target.src.endsWith('.jpg')) e.target.src = `/assets/monsters/${folder}/${enemy.name}.png`;
                        else { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + enemy.name; }
                      }}
                    />
                  )}
                  
                  {/* RECTANGULAR TAUNT OVERLAY (ENEMY) */}
                  {currentTaunt && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-600 border-t-4 border-black py-2 px-1 z-30 animate-in slide-in-from-bottom-full duration-300">
                      <div className="absolute inset-0 comic-halftone opacity-20 text-black"></div>
                      <p className="relative z-10 text-[9px] md:text-[14px] font-[1000] text-white italic text-center uppercase tracking-tighter drop-shadow-md">
                        {currentTaunt}
                      </p>
                    </div>
                  )}

                  {/* QUICK-STRIKE TACTICAL OVERLAY */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!combat.combatBusRef.current && !combat.showVictoryWindow && !combat.showDefeatedWindow) {
                        combat.handleAttack();
                      }
                    }}
                    className={`absolute top-1 left-1 z-40 bg-red-600 border-2 border-white rounded md:rounded-lg p-0.5 md:p-1 flex flex-col items-center transition-all hover:bg-white hover:border-red-600 group shadow-[1px_1px_0_rgba(0,0,0,1)] active:scale-95 ${(combat.combatBusRef.current) ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}
                  >
                    <span className="text-xs md:text-xl group-hover:animate-bounce">⚔️</span>
                    <span className="text-[4px] md:text-[6px] font-black text-white group-hover:text-red-600 uppercase italic tracking-tighter leading-none mt-0.5">STRIKE</span>
                  </button>

                  {/* SKIP TRIGGER OVERLAY */}
                  {combat.battleMode !== 'GVG' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSkip();
                      }}
                      className="absolute top-1 right-1 z-40 bg-blue-600 border-2 border-white rounded p-0.5 md:p-1 flex flex-col items-center transition-all hover:bg-white group shadow-[1px_1px_0_rgba(0,0,0,1)] active:scale-95"
                    >
                      <span className="text-xs md:text-xl group-hover:animate-pulse">⏭️</span>
                      <span className="text-[4px] md:text-[6px] font-black text-white group-hover:text-blue-600 uppercase italic tracking-tighter leading-none mt-0.5">SKIP</span>
                    </button>
                  )}

                  <ImpactSplash splash={impactSplash} />
                </div>
             </div>
          </div>

          {/* PLAYER AVATAR */}
          <div className={`flex flex-col items-center lg:items-start transition-all duration-300 ${strikingSide === 'player' ? 'animate-strike-left' : ''}`}>
             <div className="relative">
                <div className="flex items-center gap-2 md:gap-6">
                  <div 
                    ref={playerContainerRef}
                    className={`w-32 h-32 sm:w-44 sm:h-44 lg:w-64 lg:h-64 bg-slate-900 border-[5px] md:border-[8px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_rgba(8,145,178,0.3)] overflow-hidden relative transform rotate-2 ${strikingSide === 'monster' && playerImpactSplash ? 'animate-flinch' : 'animate-float'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tl from-black/80 via-transparent to-transparent z-10"></div>
                    <div className="absolute inset-0 opacity-20 comic-halftone text-cyan-500 z-0"></div>
                    {player.avatar && (
                      <AvatarMedia num={player.avatar} animated={!lowPerfMode} className="w-full h-full object-cover object-top filter contrast-125" />
                    )}

                    {/* RECTANGULAR TAUNT OVERLAY (PLAYER) */}
                    {playerTaunt && (
                      <div className="absolute bottom-0 left-0 right-0 bg-cyan-600 border-t-4 border-black py-2 px-1 z-30 animate-in slide-in-from-bottom-full duration-300">
                        <div className="absolute inset-0 comic-halftone opacity-20 text-black"></div>
                        <p className="relative z-10 text-[9px] md:text-[14px] font-[1000] text-white italic text-center uppercase tracking-tighter drop-shadow-md">
                          {playerTaunt}
                        </p>
                      </div>
                    )}

                    {/* TACTICAL WITHDRAWAL & REWARDS OVERLAY */}
                    <div className="absolute top-1 right-1 z-40 flex flex-row gap-1">
                      {/* RETREAT TRIGGER */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRetreatConfirm(true);
                        }}
                        className="bg-slate-800 border-2 border-white rounded md:rounded-lg p-0.5 md:p-1 flex flex-col items-center transition-all hover:bg-white group shadow-[1px_1px_0_rgba(0,0,0,1)] active:scale-95"
                      >
                        <span className="text-xs md:text-lg group-hover:animate-out group-hover:slide-out-to-right-4 transition-all">🏃</span>
                        <span className="text-[4px] md:text-[6px] font-black text-white group-hover:text-slate-800 uppercase italic tracking-tighter leading-none mt-0.5">RETREAT</span>
                      </button>

                      {/* REWARDS TRIGGER */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsLootModalOpen(true);
                        }}
                        className="group relative flex flex-col items-center justify-center bg-slate-900 border-2 border-amber-500 rounded md:rounded-lg p-0.5 md:p-1 shadow-[1px_1px_0_rgba(0,0,0,1)] hover:bg-amber-500 transition-all active:scale-95"
                      >
                        <Gift size={10} className="text-amber-500 group-hover:text-black transition-colors md:w-5 md:h-5" />
                        <div className="absolute -top-1 -right-1 bg-black border border-amber-500 px-1 py-0.5 text-[4px] md:text-[6px] font-black text-amber-500 rounded uppercase animate-pulse">
                          {combat.sessionRewards?.loots?.length || 0}
                        </div>
                        <span className="text-[4px] md:text-[6px] font-black text-amber-500 group-hover:text-black uppercase italic tracking-tighter leading-none mt-0.5">LOOT</span>
                      </button>
                    </div>

                    <ImpactSplash splash={playerImpactSplash} />
                  </div>
                  <div className="flex-shrink-0">
                    <SquadHUD 
                      player={player} 
                      dragonTimeLeft={dragonTimeLeft} 
                      TAVERN_MATES={TAVERN_MATES} 
                      isBuffActive={buffTimeLeft > 0 || player.hiredMate === 'titan'}
                      isPetActive={!!player.petId}
                    />
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* STATUS COMMAND TIER (HORIZONTALLY ALIGNED) */}
        <div className="grid grid-cols-2 gap-4 md:gap-12 items-start mb-8">
          {/* ENEMY STATUS */}
          <div className="w-full flex flex-col items-center lg:items-end space-y-2 md:space-y-4">
              <div className="w-full max-w-[280px] md:max-w-[320px] flex flex-col gap-2">
                <div className="bg-red-600 text-white px-3 md:px-5 py-1 md:py-2 border-[4px] md:border-[5px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col transform -rotate-1">
                  <span className="text-[7px] md:text-[8px] font-black uppercase opacity-70 tracking-widest italic leading-none mb-0.5">Threat Identified</span>
                  <h2 className="text-xs md:text-2xl font-black uppercase tracking-tighter italic leading-none truncate">{enemy.name}</h2>
                </div>

                <div className="grid grid-cols-3 gap-1 md:gap-2 bg-black/60 border-[3px] md:border-4 border-black p-1 md:p-2 shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-1">
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

                <div className="w-full group">
                  <div className="flex justify-between items-center mb-0.5 px-1">
                    <span className="text-[8px] md:text-[9px] font-black text-red-500 uppercase italic">Power Core</span>
                    <span className="text-[8px] md:text-[10px] font-black text-white italic">{Math.floor(enemy.hp)}/{Math.floor(enemy.maxHp)}</span>
                  </div>
                  <div className="w-full h-4 md:h-8 bg-black border-[3px] md:border-[5px] border-black p-0.5 relative shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center overflow-hidden">
                    <div className="absolute h-full bg-red-400 opacity-30 transition-all duration-700 ease-out" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
                    <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300 relative" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}>
                      <div className="absolute inset-0 comic-halftone opacity-30 pointer-events-none text-black"></div>
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
          </div>

          {/* PLAYER STATUS */}
          <div className="w-full flex flex-col items-center lg:items-start space-y-2 md:space-y-4 relative">
              <div className="w-full max-w-[280px] md:max-w-[320px] flex flex-col gap-2">
                <div className="bg-cyan-600 text-white px-3 md:px-5 py-1 md:py-2 border-[4px] md:border-[5px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-end transform rotate-1">
                  <span className="text-[7px] md:text-[8px] font-black uppercase opacity-70 tracking-widest italic leading-none mb-0.5">Assigned Hunter</span>
                  <h2 className="text-xs md:text-2xl font-black uppercase tracking-tighter italic leading-none truncate">{player.name}</h2>
                </div>

                <div className="grid grid-cols-3 gap-1 md:gap-2 bg-black/60 border-[3px] md:border-4 border-black p-1 md:p-2 shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-1">
                  {/* STR STAT */}
                  <div className={`relative flex flex-col items-center p-0.5 md:p-1 border-r border-white/10 transition-all duration-300 ${isMateBuffActive && activeMate?.type === 'STR' ? 'text-yellow-400' : 'text-red-500'}`}>
                    <span className="text-[6px] md:text-[7px] font-black uppercase">STR</span>
                    <span className={`text-[10px] md:text-sm font-black italic ${isMateBuffActive && activeMate?.type === 'STR' ? 'animate-pulse' : ''}`}>{totalStats.str}</span>
                    {(player.activeFoodEffect?.stat === 'str' || player.activeFoodEffect?.stat2 === 'str') && isFoodActive && (
                      <div className="absolute -top-2 -right-2 bg-emerald-400 text-black px-1.5 py-0.5 text-[6px] md:text-[8px] font-[1000] border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] rotate-6 z-50 whitespace-nowrap uppercase italic animate-in zoom-in duration-300 pointer-events-none flex items-center gap-1">
                        <span>{player.activeFoodEffect.icon || FOODS?.find(f => f.name === player.activeFoodEffect.name)?.icon || '🍛'}</span>
                        <span>+{player.activeFoodEffect.stat === 'str' ? player.activeFoodEffect.amount : (player.activeFoodEffect.amount2 || player.activeFoodEffect.amount)} {(player.activeFoodEffect.name || 'POWER BUFF')}</span>
                      </div>
                    )}
                  </div>

                  {/* AGI STAT */}
                  <div className={`relative flex flex-col items-center p-0.5 md:p-1 border-r border-white/10 transition-all duration-300 ${isMateBuffActive && activeMate?.type === 'AGI' ? 'text-yellow-400' : 'text-emerald-500'}`}>
                    <span className="text-[6px] md:text-[7px] font-black uppercase">AGI</span>
                    <span className={`text-[10px] md:text-sm font-black italic ${isMateBuffActive && activeMate?.type === 'AGI' ? 'animate-pulse' : ''}`}>{totalStats.agi}</span>
                    {(player.activeFoodEffect?.stat === 'agi' || player.activeFoodEffect?.stat2 === 'agi') && isFoodActive && (
                      <div className="absolute -top-2 -right-2 bg-emerald-400 text-black px-1.5 py-0.5 text-[6px] md:text-[8px] font-[1000] border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] -rotate-6 z-50 whitespace-nowrap uppercase italic animate-in zoom-in duration-300 pointer-events-none flex items-center gap-1">
                        <span>{player.activeFoodEffect.icon || FOODS?.find(f => f.name === player.activeFoodEffect.name)?.icon || '🥗'}</span>
                        <span>+{player.activeFoodEffect.stat === 'agi' ? player.activeFoodEffect.amount : (player.activeFoodEffect.amount2 || player.activeFoodEffect.amount)} {(player.activeFoodEffect.name || 'SPEED BUFF')}</span>
                      </div>
                    )}
                  </div>

                  {/* DEX STAT */}
                  <div className={`relative flex flex-col items-center p-0.5 md:p-1 transition-all duration-300 ${isMateBuffActive && activeMate?.type === 'DEX' ? 'text-yellow-400' : 'text-cyan-500'}`}>
                    <span className="text-[6px] md:text-[7px] font-black uppercase">DEX</span>
                    <span className={`text-[10px] md:text-sm font-black italic ${isMateBuffActive && activeMate?.type === 'DEX' ? 'animate-pulse' : ''}`}>{totalStats.dex}</span>
                    {(player.activeFoodEffect?.stat === 'dex' || player.activeFoodEffect?.stat2 === 'dex') && isFoodActive && (
                      <div className="absolute -top-2 -right-2 bg-emerald-400 text-black px-1.5 py-0.5 text-[6px] md:text-[8px] font-[1000] border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] rotate-3 z-50 whitespace-nowrap uppercase italic animate-in zoom-in duration-300 pointer-events-none flex items-center gap-1">
                        <span>{player.activeFoodEffect.icon || FOODS?.find(f => f.name === player.activeFoodEffect.name)?.icon || '🍵'}</span>
                        <span>+{player.activeFoodEffect.stat === 'dex' ? player.activeFoodEffect.amount : (player.activeFoodEffect.amount2 || player.activeFoodEffect.amount)} {(player.activeFoodEffect.name || 'FOCUS BUFF')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full group">
                  <div className="flex justify-between items-center mb-0.5 px-1 flex-row-reverse">
                    <span className="text-[8px] md:text-[9px] font-black text-cyan-500 uppercase italic">Biological Core</span>
                    <span className="text-[8px] md:text-[10px] font-black text-white italic">{Math.floor(player.hp)}/{Math.floor(player.maxHp)}</span>
                  </div>
                  <div className="w-full h-4 md:h-8 bg-black border-[3px] md:border-[5px] border-black p-0.5 relative shadow-[-4px_4px_0_rgba(0,0,0,1)] transition-all overflow-hidden flex items-center">
                    <div className="absolute h-full bg-cyan-400 opacity-30 transition-all duration-700 ease-out right-0" style={{ width: `${(player.hp / player.maxHp) * 100}%` }}></div>
                    <div className="h-full bg-gradient-to-l from-cyan-800 to-cyan-500 transition-all duration-300 relative ml-auto" style={{ width: `${(player.hp / player.maxHp) * 100}%` }}>
                      <div className="absolute inset-0 comic-halftone opacity-30 pointer-events-none text-black"></div>
                      <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DEDICATED REALTIME COMBAT DROPS UI */}
              {combat.showVictoryWindow && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col items-center justify-center z-50 animate-in slide-in-from-bottom flex-1 pb-[100px]">
                  <div className="bg-black/80 backdrop-blur-sm border-[2px] border-cyan-500 rounded-xl p-3 shadow-[0_0_15px_rgba(6,182,212,0.5)] transform -rotate-1 flex flex-col items-center">
                    <span className="text-cyan-400 font-black text-xs uppercase italic tracking-widest mb-1">Target Eliminated</span>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-black text-sm italic">+{enemy?.loot || 0} GX</span>
                      <span className="text-white font-black text-sm italic">+{enemy?.xp || 0} EXP</span>
                    </div>
                    {combat.lastLoot && (
                       <div className="mt-2 bg-white/10 px-2 py-1 rounded flex items-center gap-2 border border-white/20">
                         <span>{combat.lastLoot.icon}</span>
                         <span className="text-[10px] text-white font-black uppercase">{combat.lastLoot.name}</span>
                       </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
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
                    <h2 className="text-xl md:text-3xl font-black text-black uppercase italic tracking-tighter leading-none">OBTAINED DROPS</h2>
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
                      <h3 className={`text-sm md:text-lg font-black uppercase italic tracking-widest px-4 py-1 border-[3px] border-black transform -rotate-1 shadow-[4px_4px_0_rgba(0,0,0,1)] ${rarity === 'Legendary' ? 'bg-amber-500 text-black' :
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
                          <div className={`w-12 h-12 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center text-3xl md:text-4xl bg-slate-900 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] rounded-xl transform transition-transform group-hover:scale-110 group-hover:rotate-3 ${item.rarity === 'Legendary' ? 'border-amber-500/50' : ''
                            }`}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="text-xs md:text-base font-black text-white uppercase italic truncate">
                                {item.count && item.count > 1 ? `${item.count}x ` : ''}{item.name}
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

        {/* Possible Drops Modal */}
        {isPossibleDropsModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="absolute inset-0 comic-halftone opacity-20 text-cyan-500 pointer-events-none"></div>

            <div className="bg-slate-950 border-[5px] border-black w-full max-w-2xl max-h-[85vh] flex flex-col relative shadow-[10px_10px_0_rgba(0,0,0,1)] animate-in zoom-in slide-in-from-bottom-8 duration-500 overflow-hidden">
              <div className="bg-cyan-600 border-b-[5px] border-black p-4 flex justify-between items-center transform -skew-x-2 w-full mt-[-2px] ml-[-2px] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-black p-2 rounded transform rotate-12">
                    <Search className="text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-xl md:text-3xl font-black text-black uppercase italic tracking-tighter leading-none">POSSIBLE DROPS</h2>
                    <span className="text-[10px] font-black text-black/60 uppercase tracking-widest leading-none mt-1">Grid Sector: {selectedMap?.name}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsPossibleDropsModalOpen(false)}
                  className="bg-black text-white p-2 md:p-3 border-2 border-black hover:bg-red-600 transition-colors shadow-[4px_4px_0_rgba(255,255,255,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-4">
                <div className="bg-cyan-500/10 border-2 border-cyan-500/30 p-3 rounded-lg flex items-center justify-between">
                  <span className="text-[10px] md:text-xs font-black text-cyan-400 uppercase italic">Base Drop Rate (Current Floor {depth})</span>
                  <span className="text-lg md:text-xl font-black text-white italic">{Math.min(95, (30 + (depth * 1.5))).toFixed(1)}%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {possibleDrops.map((item, idx) => {
                    const rarityWeights = { 'Common': 100, 'Uncommon': 40, 'Rare': 15, 'Epic': 4, 'Legendary': 1 };
                    const totalWeight = possibleDrops.reduce((acc, curr) => acc + (rarityWeights[curr.rarity] || 10), 0);
                    const weight = rarityWeights[item.rarity] || 10;
                    const chance = (weight / totalWeight) * 100;
                    
                    const isUnlocked = (item.rarity === 'Legendary' && depth >= 5) ||
                                       (item.rarity === 'Epic' && depth >= 4) ||
                                       (item.rarity === 'Rare' && depth >= 2) ||
                                       (['Common', 'Uncommon'].includes(item.rarity));

                    return (
                      <div key={idx} className={`bg-black/40 border-2 ${isUnlocked ? 'border-white/5' : 'border-red-500/20 grayscale'} p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group`}>
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-red-950/20 flex items-center justify-center z-20 backdrop-blur-[1px]">
                             <Lock className="text-red-500" size={24} />
                          </div>
                        )}
                        <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center text-3xl bg-slate-900 border-2 border-black rounded-lg shadow-[3px_3px_0_rgba(0,0,0,1)]`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-white uppercase italic truncate mb-1">{item.name}</h4>
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border border-black shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] ${
                              item.rarity === 'Legendary' ? 'bg-amber-400 text-black' : 
                              item.rarity === 'Epic' ? 'bg-purple-600 text-white' : 
                              item.rarity === 'Rare' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
                            }`}>
                              {item.rarity}
                            </span>
                            <span className="text-[10px] font-black text-cyan-400 italic">~{chance.toFixed(1)}% ID</span>
                          </div>
                          {!isUnlocked && (
                            <p className="text-[7px] font-black text-red-500 uppercase mt-1">Requires Floor {item.rarity === 'Legendary' ? '5' : item.rarity === 'Epic' ? '4' : '2'}+</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-black/80 border-t-[5px] border-black flex justify-center">
                 <div className="text-[8px] md:text-[10px] font-black text-white/40 uppercase italic tracking-[0.3em]">
                    Database synchronized // Scanned frequencies from {selectedMap?.name}
                 </div>
              </div>
            </div>
          </div>
        )}
      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showRetreatConfirm}
        onClose={() => setShowRetreatConfirm(false)}
        onConfirm={combat.handleRetreat}
        title="ABANDON INCURSION?"
        message="Retreating will end your current floor progress and drop any active session multipliers. Do you accept the strategic withdrawal?"
        confirmText="YES, RETREAT"
        cancelText="NO, CONTINUE"
      />
      <ConfirmationModal 
        isOpen={showPurifyConfirm}
        onClose={() => setShowPurifyConfirm(false)}
        onConfirm={() => actions.handlePurify(enemy, requiredTool)}
        title="INITIATE PURIFICATION?"
        message={`Attempting to purify the corrupted core of this ${currentEnemyElement} monster requires 1x ${toolDetails?.name}. Failure will cause the energy to dissipate and the monster to vanish. Proceed?`}
        confirmText="YES, PURIFY"
        cancelText="NO, STRIKE INSTEAD"
      />
      {/* FOOTER PROGRESS TAPE (SCRAPBOOK STYLE) */}
      {combat.battleMode !== 'GVG' && (
        <div className="absolute bottom-0 left-0 right-0 z-50 px-3 md:px-12 pb-4 pointer-events-none">
          <div className="relative bg-black border-[3px] md:border-4 border-white p-2 md:p-3 shadow-2xl transform rotate-1 flex flex-col gap-1 md:gap-2">
             <div className="absolute -top-3 md:-top-4 left-6 bg-cyan-500 text-black text-[7px] md:text-[10px] font-[1000] px-3 py-0.5 border-2 border-black uppercase italic shadow-[3px_3px_0_rgba(0,0,0,1)] -rotate-3">
                MISSION_PROGRESS: LN_{depth}F
             </div>
             
             <div className="flex items-center gap-3 md:gap-6 mt-1">
                <div className="flex flex-col shrink-0">
                  <span className="text-[5px] md:text-[8px] font-black text-cyan-400 uppercase tracking-widest opacity-60">SYNC_STATUS</span>
                  <span className="text-[10px] md:text-sm font-black text-white italic leading-none">{combat.killsInFloor}/10 NODES</span>
                </div>

                <div className="flex-1 h-3 md:h-5 bg-slate-900 border-2 border-black relative overflow-hidden group">
                   {/* Main Progress Bar */}
                   <div 
                     className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                     style={{ width: `${(combat.killsInFloor / 10) * 100}%` }}
                   />
                   {/* Shimmer Effect */}
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                   {/* Grid Overlay */}
                   <div className="absolute inset-0 bg-[rgba(0,0,0,0.1)]" style={{ backgroundImage: 'radial-gradient(circle, #000 0.5px, transparent 0.5px)', backgroundSize: '4px 4px' }} />
                </div>

                <div className="flex gap-1 shrink-0">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-sm border border-black transform ${i % 2 === 0 ? 'rotate-12' : '-rotate-12'} transition-all duration-500 ${i < combat.killsInFloor ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] scale-110' : 'bg-slate-800 opacity-40'}`} 
                    />
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-shimmer { animation: shimmer 2.5s linear infinite; }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
});
