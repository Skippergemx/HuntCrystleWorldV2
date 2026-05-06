import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, MousePointer, Coffee, X, Skull, Lock, Activity, Shield, Swords, Target, Gem, Gift, Star, HelpCircle, RotateCw, Search, List, ChevronRight, RefreshCw, FlaskConical, WandSparkles, Sparkles } from 'lucide-react';
import { ImpactSplash, BattleParticles } from './CombatEffects';
import { AvatarMedia, SquadHUD, ConfirmationModal, Header } from './GameUI';
import { useGame } from '../contexts/GameContext';
import { getMonsterElement } from '../utils/gameLogic';
import { SOUNDS } from '../hooks/useAudioEngine';
export const CombatView = React.memo(() => {
  const {
    player, adventure, combat, actions, gameLoop, audio, totalStats, autoScrollState,
    LOOTS, ITEMS, TAVERN_MATES, PETS_METADATA, openGuide, syncPlayer, lowPerfMode, FOODS, ELEMENTAL_SKILLS
  } = useGame();

  const { enemy, depth, setDepth, view, setView, selectedMap, killsInFloor, isHurt, handleSkip } = adventure;
  const { 
    stunTimeLeft, missTimeLeft, combatState, impactSplash, playerImpactSplash, 
    strikingSide, currentTaunt, playerTaunt, lastLoot, isTreasury,
    skillEnergy, activeSkill, skillDuration, triggerSkill, skillCooldown,
    monsterSkillActive, squadStrikeActive, defeatData, handleDismissDefeat
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
  const [tameAnimation, setTameAnimation] = useState(null); // 'ATTEMPTING', 'SUCCESS', 'FAIL'
  const [levelUpCinematic, setLevelUpCinematic] = useState(false);
  
  const battleParticlesRef = useRef(null);
  const prevLevelUpRef = useRef(0);

  // --- LEVEL UP VISUAL FEEDBACK ---
  useEffect(() => {
    if (combat.levelUpEffectTrigger > prevLevelUpRef.current) {
      prevLevelUpRef.current = combat.levelUpEffectTrigger;
      setLevelUpCinematic(true);
      if (battleParticlesRef.current?.triggerLevelUp) {
        battleParticlesRef.current.triggerLevelUp();
      }
      setTimeout(() => setLevelUpCinematic(false), 2800);
      if (audio?.playSFX) {
         audio.playSFX(SOUNDS.levelup);
      }
    }
  }, [combat.levelUpEffectTrigger, audio]);
  
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
    const scrollSpecs = {
      'auto_scroll': 1,
      'auto_scroll_3m': 3,
      'auto_scroll_6m': 6,
      'auto_scroll_9m': 9,
      'auto_scroll_12m': 12
    };
    const req = scrollSpecs[sel] || 1;
    const baseCount = player.autoScrolls || 0;
    
    // Calculate discrete items of this specific type
    const possibleScrollIds = ['auto_scroll_12m', 'auto_scroll_9m', 'auto_scroll_6m', 'auto_scroll_3m', 'auto_scroll'];
    const invCount = Object.values(player.inventory || {}).filter(i => {
      if (!i || !i.id) return false;
      const itemBaseId = possibleScrollIds.find(baseId => i.id.startsWith(baseId));
      return itemBaseId === sel;
    }).length;

    // For 1m scrolls (auto_scroll), we can trigger them using the pool (divided by 1) PLUS discrete items
    let totalPossible = 0;
    if (sel === 'auto_scroll') {
      totalPossible = Math.floor(baseCount / req) + invCount;
    } else {
      totalPossible = invCount;
    }

    return {
      selected: sel,
      count: totalPossible,
      hasSelected: totalPossible > 0
    };
  }, [player.selectedScrollId, player.autoScrolls, player.inventory, ITEMS]);

  const hasAnyPotions = useMemo(() => (player.potions > 0) || Object.values(player.inventory || {}).some(i => i?.id?.includes('hp_potion')), [player.potions, player.inventory]);
  const hasAnyScrolls = useMemo(() => (player.autoScrolls || 0) > 0 || Object.values(player.inventory || {}).some(i => i?.id?.includes('auto_scroll')), [player.autoScrolls, player.inventory]);


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
  const hasRequiredTool = useMemo(() => requiredTool && Object.values(player.inventory || {}).some(i => i?.id?.startsWith(requiredTool)), [player.inventory, requiredTool]);
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
  
  // Squad Support Particle Trigger
  useEffect(() => {
    if (squadStrikeActive && battleParticlesRef.current && enemyContainerRef.current && arenaRef.current) {
      const rect = enemyContainerRef.current.getBoundingClientRect();
      const arenaRect = arenaRef.current.getBoundingClientRect();
      
      // Intensive Burst
      setTimeout(() => {
        battleParticlesRef.current.emit(
          (rect.left - arenaRect.left) + rect.width / 2, 
          (rect.top - arenaRect.top) + rect.height / 2, 
          squadStrikeActive.element || 'impact', 
          { speed: 25, size: 20, gravity: 0.1, count: 60 }
        );
        if (audio) audio.playSFX(SOUNDS.skillTrigger);
      }, 400); // Sync with banner animation
    }
  }, [squadStrikeActive]);

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
      
      {/* --- CINEMATIC SKILL OVERLAYS --- */}
      {activeSkill && (
        <div className={`absolute inset-0 z-[45] pointer-events-none transition-opacity duration-500 opacity-30 bg-gradient-to-t ${
          activeSkill.name === 'IGNITION OVERDRIVE' ? 'from-orange-600/50 to-transparent' :
          activeSkill.name === 'STASIS PROTOCOL' ? 'from-blue-600/50 to-transparent' :
          activeSkill.name === 'PHANTOM VELOCITY' ? 'from-purple-600/50 to-transparent' :
          activeSkill.name === 'TECTONIC FORTRESS' ? 'from-emerald-600/50 to-transparent' : 'from-indigo-600/50 to-transparent'
        }`}></div>
      )}

      {/* SKILL CUT-IN BANNER */}
      {skillDuration > 0 && skillDuration > (activeSkill?.duration - 1.5) && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
           <div className="w-full bg-black/90 border-y-[6px] border-white py-8 md:py-12 transform -rotate-2 relative overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.3)]">
             <div className="absolute inset-0 comic-halftone opacity-30 text-white"></div>
             <div className={`absolute top-0 left-0 h-full bg-gradient-to-r ${activeSkill?.color} opacity-40 animate-skill-sweep w-[200%]`}></div>
             <div className="relative z-10 flex flex-row items-center justify-center gap-4 md:gap-12 px-4">
                {player.avatar && (
                  <div className="w-16 h-16 md:w-32 md:h-32 border-[4px] md:border-[6px] border-white shadow-[6px_6px_0_rgba(255,255,255,0.2)] overflow-hidden transform rotate-3 shrink-0">
                    <AvatarMedia num={player.avatar} animated={true} className="w-full h-full object-cover object-top" />
                  </div>
                )}
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-white font-black text-xs md:text-xl uppercase tracking-[0.5em] italic mb-2 opacity-70">Sync-Drive Engaged</span>
                  <h2 className="text-3xl md:text-7xl font-[1000] text-white italic uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,1)]">
                    {activeSkill?.name}
                  </h2>
                  <div className="mt-4 flex items-center gap-4 bg-white text-black px-4 py-1 rounded-full font-black text-[10px] md:text-lg uppercase">
                    <span>{activeSkill?.icon}</span>
                    <span>{activeSkill?.description}</span>
                  </div>
                </div>
             </div>
           </div>
        </div>
      )}
      {/* MONSTER SKILL CUT-IN */}
      {monsterSkillActive && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center pointer-events-none animate-in fade-in slide-in-from-right duration-300">
           <div className="w-full bg-red-950/90 border-y-[6px] border-red-500 py-8 md:py-12 transform rotate-2 relative overflow-hidden shadow-[0_0_100px_rgba(255,0,0,0.5)]">
             <div className="absolute inset-0 bg-comic-dots opacity-40 text-red-500"></div>
             <div className="relative z-10 flex flex-row-reverse items-center justify-center gap-4 md:gap-12 px-4">
                <div className="w-16 h-16 md:w-32 md:h-32 border-[4px] md:border-[6px] border-red-500 shadow-[6px_6px_0_rgba(255,0,0,0.2)] overflow-hidden transform -rotate-3 bg-slate-900 shrink-0">
                  <img
                    src={combat.battleMode === 'GVG' ? `/assets/playeravatar/CrystleHunterAvatar (${enemy.avatarNum || 1}).jpg` : `/assets/monsters/${enemy.folder || 'Neon Slums'}/${enemy.baseName || enemy.name}.jpg`}
                    className="w-full h-full object-cover"
                    alt=""
                    onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + enemy.name; }}
                  />
                </div>
                <div className="flex flex-col items-center md:items-end text-center md:text-right">
                  <span className="text-red-500 font-black text-xs md:text-xl uppercase tracking-[0.5em] italic mb-2 animate-pulse">Monster Ability Detected</span>
                  <h2 className="text-3xl md:text-7xl font-[1000] text-white italic uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
                    {monsterSkillActive.name}
                  </h2>
                  <div className="mt-4 bg-red-600 text-white px-4 py-1 rounded-full font-black text-[10px] md:text-lg uppercase shadow-lg">
                    {monsterSkillActive.description}
                  </div>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* SQUAD SUPPORT CUT-IN BANNER */}
      {squadStrikeActive && (
        <div className="absolute inset-0 z-[140] flex items-center justify-center pointer-events-none animate-in fade-in slide-in-from-left duration-300">
           <div className={`w-full bg-slate-900/90 border-y-[4px] border-white py-4 md:py-8 transform -rotate-1 relative overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)]`}>
             <div className="absolute inset-0 comic-halftone opacity-20 text-white"></div>
             <div className={`absolute top-0 left-0 h-full bg-gradient-to-r ${squadStrikeActive.color} opacity-40 animate-skill-sweep w-[200%]`}></div>
             <div className="relative z-10 flex flex-row items-center justify-center gap-2 md:gap-8 px-4">
                <div className="w-12 h-12 md:w-24 md:h-24 border-[3px] md:border-[4px] border-white shadow-lg overflow-hidden transform rotate-2 bg-black shrink-0">
                  {squadStrikeActive.type === 'PET' ? (
                     <div className="w-full h-full flex items-center justify-center text-4xl md:text-6xl bg-slate-800">
                       {petElementIcon}
                     </div>
                  ) : squadStrikeActive.type === 'MATE' ? (
                     <AvatarMedia num={squadStrikeActive.avatar || 1} animated={true} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full bg-red-900 flex items-center justify-center text-4xl md:text-6xl">🐲</div>
                  )}
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <span className="text-white font-black text-[8px] md:text-sm uppercase tracking-[0.4em] italic mb-1 opacity-70">Squad Tactical Intervention</span>
                  <h2 className="text-xl md:text-4xl font-[1000] text-white italic uppercase tracking-tighter drop-shadow-md">
                    {squadStrikeActive.name}
                  </h2>
                  <div className="mt-1 text-[8px] md:text-xs font-black text-white/60 uppercase tracking-widest italic">
                    {squadStrikeActive.description}
                  </div>
                </div>
                <div className="bg-white text-black px-2 py-1 rounded font-black text-[10px] md:text-xl transform rotate-12 shadow-lg animate-bounce">
                  +{squadStrikeActive.energy}% ENERGY
                </div>
             </div>
           </div>
        </div>
      )}

      {arenaTheme.backdrop && (
        <div className="absolute inset-0 z-0 select-none">
          <img src={arenaTheme.backdrop} className="w-full h-full object-cover opacity-40 mix-blend-luminosity" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
        </div>
      )}



      {/* Halftone Overlay HUD */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-20 comic-halftone" style={{ color: arenaTheme.dot }}></div>

      {/* --- HUD TOP: CONSOLIDATED MISSION COMMAND ARRAY --- */}
      <Header 
        title={`${combat.battleMode === 'GVG' ? `RAID: [${enemy.syndicateTag}]` : (selectedMap?.name || 'Sector Alpha')}`} 
        onClose={() => setShowRetreatConfirm(true)} 
        npcNum={13} 
        onHelp={() => openGuide('dungeon')}
      >
        {/* --- TACTICAL MISSION COMMAND MODULE (BALANCED) --- */}
        <div className="flex items-center bg-slate-950/40 border-[2px] border-white/5 rounded-xl p-1 md:p-1.5 backdrop-blur-sm transform -skew-x-2 md:-skew-x-6 animate-in slide-in-from-top-4 duration-700">
           {/* Section 1: Floor Telemetry */}
           <div className="flex flex-col items-center justify-center bg-cyan-500 border-2 border-black rounded-lg px-3 md:px-6 py-1 shadow-[3px_3px_0_rgba(0,0,0,1)] transform skew-x-2 md:skew-x-6 mr-1 md:mr-2">
              <span className="text-[6px] md:text-[8px] font-black text-black/60 uppercase tracking-[0.2em] leading-none mb-0.5">LN_COORD</span>
              <span className="text-[11px] md:text-2xl font-black text-black italic leading-none">FLR_{depth}</span>
           </div>

           <div className="w-[1px] h-6 bg-white/10 mx-1 md:mx-2 skew-x-6"></div>
           
           {/* Section 2: Data Stream Manifest */}
           <button
             onClick={() => setIsPossibleDropsModalOpen(true)}
             className="group flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1 md:py-1.5 focus:outline-none transform skew-x-2 md:skew-x-6"
           >
             <div className="bg-slate-900 border-2 border-cyan-500/30 p-1 md:p-1.5 rounded-lg group-hover:bg-cyan-500 group-hover:border-black transition-all">
                <Search size={14} className="text-cyan-400 group-hover:text-black transition-colors md:w-5 md:h-5" />
             </div>
             <div className="flex flex-col items-start leading-none">
                <span className="text-[6px] md:text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-black/50 transition-colors">BIT_STREAM</span>
                <span className="text-[10px] md:text-base font-black text-white group-hover:text-cyan-400 uppercase italic transition-colors">MANIFEST</span>
             </div>
           </button>
        </div>
      </Header>


      {/* --- BATTLE ARENA: RESTRUCTURED FOR SYMMETRY --- */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col relative z-40 px-2 md:px-12 py-2 pb-32 md:pb-44">
        
        {/* VS CENTRAL BADGE */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
           <div className="w-12 h-12 md:w-24 md:h-24 bg-yellow-400 border-[4px] md:border-[8px] border-black rounded-full shadow-[5px_5px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-12 animate-kapow">
             <span className="text-black font-black text-xl md:text-4xl italic tracking-tighter drop-shadow-[2px_2px_0_#fff]">VS</span>
           </div>
        </div>

        {/* LEVEL UP CINEMATIC OVERLAY */}
        {levelUpCinematic && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none overflow-hidden">
            {/* Screen Flash */}
            <div className="absolute inset-0 bg-white animate-out fade-out duration-[2000ms] z-0"></div>
            
            {/* Darkening Backdrop with Halftone */}
            <div className="absolute inset-0 bg-cyan-950/80 backdrop-blur-sm animate-in fade-in duration-500 z-10">
               <div className="absolute inset-0 comic-halftone opacity-30 text-cyan-400 mix-blend-overlay"></div>
            </div>

            {/* Vertical Power Pillar */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-64 md:w-96 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-pulse z-10 skew-x-[-15deg]"></div>
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-20 md:w-32 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-pulse z-10 skew-x-[-15deg]"></div>

            {/* Main Cut-in Banner */}
            <div className="w-[120%] py-12 md:py-20 bg-gradient-to-r from-cyan-900 via-cyan-500 to-cyan-900 border-y-[8px] border-white transform -rotate-3 animate-in slide-in-from-bottom-[50%] zoom-in-50 duration-500 shadow-[0_0_100px_rgba(34,211,238,0.8)] z-20 flex flex-col items-center justify-center">
               
               {/* Decorative Lines */}
               <div className="absolute top-2 left-0 w-full h-1 bg-white/40"></div>
               <div className="absolute bottom-2 left-0 w-full h-1 bg-white/40"></div>

               <span className="text-white font-black text-sm md:text-3xl uppercase tracking-[1em] italic mb-2 animate-bounce drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">Power Overflow</span>
               
               <h2 className="text-6xl md:text-[140px] font-[1000] text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-600 italic uppercase tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] leading-none animate-kapow">
                 LEVEL UP!
               </h2>
               
               <div className="mt-6 md:mt-10 flex items-center gap-6 md:gap-12 animate-in slide-in-from-left duration-700 delay-300">
                  <div className="bg-black border-4 border-cyan-400 px-6 py-2 md:px-8 md:py-4 transform skew-x-12 shadow-[6px_6px_0_rgba(255,255,255,1)]">
                     <span className="text-cyan-400 font-black text-xl md:text-4xl italic block leading-none">+5</span>
                     <span className="text-white text-[10px] md:text-lg font-black uppercase tracking-widest mt-1 block">Ability Pts</span>
                  </div>
                  <div className="bg-white border-4 border-black px-6 py-2 md:px-8 md:py-4 transform -skew-x-12 shadow-[6px_6px_0_rgba(34,211,238,1)]">
                     <span className="text-black font-black text-xl md:text-4xl italic block leading-none">+50</span>
                     <span className="text-black/60 text-[10px] md:text-lg font-black uppercase tracking-widest mt-1 block">Max HP</span>
                  </div>
               </div>
            </div>
            
            {/* Screen Shake overlay class wrapper equivalent */}
            <div className="absolute inset-0 z-50 animate-shake pointer-events-none opacity-50"></div>
          </div>
        )}

        {/* TAMING CINEMATIC OVERLAY */}
        {tameAnimation && (
          <div className="absolute inset-0 z-[150] flex flex-col items-center justify-center pointer-events-none overflow-hidden">
             {/* Dynamic Flash Layer */}
             <div className={`absolute inset-0 z-20 transition-opacity duration-300 ${tameAnimation === 'SUCCESS' ? 'bg-white animate-out fade-out fill-mode-forwards' : 'bg-transparent'}`}></div>
             <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] animate-in fade-in duration-300"></div>
             
             {/* Energy Streaks Background */}
             <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
                <div className="absolute top-1/4 left-0 w-[200%] h-0.5 bg-white/20 -rotate-45 animate-shimmer"></div>
                <div className="absolute top-3/4 left-0 w-[200%] h-0.5 bg-white/20 -rotate-45 animate-shimmer delay-150"></div>
             </div>
             
             <div className={`w-full py-2 md:py-6 border-y-2 md:border-y-4 border-black transform -rotate-1 shadow-[0_0_60px_rgba(0,0,0,0.8)] relative flex items-center justify-center animate-in slide-in-from-left duration-500 ${
               tameAnimation === 'ATTEMPTING' ? 'bg-gradient-to-r from-emerald-950 via-emerald-600 to-emerald-950 animate-pulse' :
               tameAnimation === 'SUCCESS' ? 'bg-gradient-to-r from-emerald-500 via-white to-emerald-500 scale-105' :
               'bg-gradient-to-r from-red-950 via-red-600 to-red-950 animate-shake'
             }`}>
                <div className="absolute inset-0 comic-halftone opacity-40 mix-blend-overlay"></div>
                
                <div className="relative z-10 flex items-center gap-3 md:gap-8">
                   <div className={`w-10 h-10 md:w-20 md:h-20 border-2 md:border-4 border-black bg-slate-900 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center transform rotate-3 ${tameAnimation === 'ATTEMPTING' ? 'animate-spin-slow' : 'animate-bounce-heavy'}`}>
                      <span className="text-xl md:text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                        {tameAnimation === 'ATTEMPTING' ? '💠' : tameAnimation === 'SUCCESS' ? '✨' : '🌫️'}
                      </span>
                   </div>

                   <div className="flex flex-col">
                      <p className={`font-black text-xl md:text-4xl uppercase italic tracking-tighter drop-shadow-[0_2px_0_rgba(0,0,0,1)] leading-none ${tameAnimation === 'SUCCESS' ? 'text-emerald-950 animate-pop' : 'text-white'}`}>
                        {tameAnimation === 'ATTEMPTING' ? 'CORE_SCANNING...' : tameAnimation === 'SUCCESS' ? 'PURIFIED!' : 'STABILIZATION_FAILED'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                         <div className={`h-0.5 flex-1 bg-current opacity-30 ${tameAnimation === 'SUCCESS' ? 'bg-emerald-950' : 'bg-white'}`}></div>
                         <p className={`font-black text-[7px] md:text-sm uppercase tracking-widest italic whitespace-nowrap ${tameAnimation === 'SUCCESS' ? 'text-emerald-900' : 'text-white/80'}`}>
                           {tameAnimation === 'ATTEMPTING' ? 'RESONANCE_STABILIZING' : tameAnimation === 'SUCCESS' ? 'PET_SPIRIT_MANIFESTED' : 'ENERGY_DISSIPATED'}
                         </p>
                         <div className={`h-0.5 flex-1 bg-current opacity-30 ${tameAnimation === 'SUCCESS' ? 'bg-emerald-950' : 'bg-white'}`}></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

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
          <div className="absolute inset-x-2 md:inset-x-12 top-[40%] -translate-y-1/2 bg-amber-400 border-[4px] md:border-[6px] border-black z-[110] flex flex-col items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.4)] transform rotate-1 animate-in zoom-in py-6 md:py-10">
            <div className="absolute inset-0 comic-halftone opacity-20 text-black"></div>
            <div className="flex items-center gap-4 md:gap-8 relative z-10">
               <Shield size={32} className="md:w-12 md:h-12 text-black animate-bounce" />
               <div className="flex flex-col">
                 <p className="font-black text-lg md:text-5xl uppercase italic text-black tracking-tighter text-center">EVADED!</p>
                 <p className="text-[8px] md:text-sm font-black text-black/60 uppercase tracking-widest text-center italic mt-1">Uplink Signal Lost - Target Too Fast</p>
               </div>
            </div>
          </div>
        )}

        {/* ENGAGEMENT ZONE (AVATARS) */}
        <div className="grid grid-cols-2 gap-4 md:gap-12 items-center mb-4 md:mb-8">
          {/* ENEMY AVATAR */}
          <div className={`flex flex-col items-center lg:items-end transition-all duration-300 ${strikingSide === 'monster' ? 'animate-strike-right' : ''}`}>
             <div className="relative">
                {/* Elite Aura */}
                {enemy?.isElite && (
                  <div className="absolute inset-0 -m-8 bg-purple-600/30 blur-3xl rounded-full animate-pulse scale-125 z-0"></div>
                )}
                <div 
                  ref={enemyContainerRef}
                  className={`group w-32 h-32 sm:w-44 sm:h-44 lg:w-64 lg:h-64 bg-slate-900 border-[5px] md:border-[8px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_rgba(0,0,0,1)] overflow-hidden relative transform -rotate-2 ${enemy?.isElite ? 'scale-125 drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]' : ''} ${isHurt || impactSplash ? 'animate-flinch' : (requiredTool ? 'animate-tame-shine' : 'animate-float')}`}
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
                      src={`/assets/monsters/${enemy.folder || 'Neon Slums'}/${enemy.baseName || (enemy.name?.startsWith('CHAMPION ') ? enemy.name.replace('CHAMPION ', '') : enemy.name)}.jpg`}
                      alt={enemy.name}
                      className={`w-full h-full object-cover relative z-10 transition-all duration-700 ${tameAnimation === 'ATTEMPTING' ? 'filter brightness-200 contrast-150 saturate-200 sepia-[0.3] hue-rotate-[90deg] scale-105' : 'filter brightness-110 contrast-125'}`}
                      onError={(e) => {
                        const folder = enemy.folder || 'Neon Slums';
                        const baseN = enemy.baseName || (enemy.name?.startsWith('CHAMPION ') ? enemy.name.replace('CHAMPION ', '') : enemy.name);
                        if (e.target.src.endsWith('.jpg')) e.target.src = `/assets/monsters/${folder}/${baseN}.png`;
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

                  {/* SKIP & TAME TRIGGER OVERLAY */}
                  {combat.battleMode !== 'GVG' && (
                    <div className="absolute top-1 right-1 z-40 flex flex-col gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkip();
                        }}
                        className="bg-blue-600 border-2 border-white rounded p-0.5 md:p-1 flex flex-col items-center transition-all hover:bg-white group shadow-[1px_1px_0_rgba(0,0,0,1)] active:scale-95"
                      >
                        <span className="text-xs md:text-xl group-hover:animate-pulse">⏭️</span>
                        <span className="text-[4px] md:text-[6px] font-black text-white group-hover:text-blue-600 uppercase italic tracking-tighter leading-none mt-0.5">SKIP</span>
                      </button>

                      {Object.values(player.inventory || {}).some(i => i?.id?.startsWith('taming_')) && (
                        (() => {
                          const targetElement = getMonsterElement(enemy);
                          const matchingPrism = Object.values(player.inventory || {}).find(i => 
                            i?.id?.startsWith(`taming_${targetElement.toLowerCase()}`)
                          );
                          const elementIcons = { 'Pyro': '🔥', 'Hydro': '💧', 'Gale': '🌪️', 'Earthen': '⛰️', 'Cosmic': '⚛️' };
                          const chance = Math.floor((0.9 - ((enemy.hp / enemy.maxHp) * 0.6)) * 100);

                          return (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (tameAnimation || !matchingPrism) return;
                                
                                const cleanPrismId = matchingPrism.id.replace(/(_\d+)+$/, '').split('_').slice(0, 2).join('_');
                                
                                setTameAnimation('ATTEMPTING');
                                const initialPetCount = (player.unlockedPets || []).length;
                                await actions.handlePurify(enemy, cleanPrismId);
                                
                                setTimeout(() => {
                                  const currentPetCount = (player.unlockedPets || []).length;
                                  const isSuccess = currentPetCount > initialPetCount;
                                  setTameAnimation(isSuccess ? 'SUCCESS' : 'FAIL');
                                  setTimeout(() => {
                                    setTameAnimation(null);
                                    adventure.setEnemy(null);
                                    handleSkip(); 
                                  }, 2500);
                                }, 1500);
                              }}
                              className={`bg-emerald-600 border-2 border-white rounded p-0.5 md:p-1 flex flex-col items-center transition-all hover:bg-white group shadow-[1px_1px_0_rgba(0,0,0,1)] active:scale-95 ${!matchingPrism ? 'opacity-30 grayscale cursor-not-allowed' : 'animate-pulse'}`}
                            >
                              <span className="text-xs md:text-xl group-hover:rotate-12 transition-transform">
                                {elementIcons[targetElement] || '💠'}
                              </span>
                              <span className="text-[5px] md:text-[8px] font-black text-white group-hover:text-emerald-600 uppercase italic tracking-tighter leading-none mt-0.5 whitespace-nowrap">
                                {!matchingPrism ? `NEED ${targetElement}` : `${chance}% TAME`}
                              </span>
                            </button>
                          );
                        })()
                      )}
                    </div>
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

                    {/* ELEMENTAL SYNC AURA (PET POWER) */}
                    {activePet && (
                      <div className={`absolute inset-0 z-[5] animate-pulse opacity-20 ${
                        activePet.element === 'Pyro' ? 'bg-red-500' :
                        activePet.element === 'Hydro' ? 'bg-blue-500' :
                        activePet.element === 'Gale' ? 'bg-purple-500' :
                        activePet.element === 'Earthen' ? 'bg-emerald-500' : 'bg-pink-500'
                      }`}></div>
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
                <div className="bg-red-600 text-white px-3 md:px-5 py-1 md:py-2 border-[4px] md:border-[5px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-between transform -rotate-1">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[7px] md:text-[8px] font-black uppercase opacity-70 tracking-widest italic leading-none mb-0.5">Threat Identified</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-sm md:text-3xl italic drop-shadow-lg uppercase tracking-tighter">
                          {enemy.name}
                        </span>
                        {enemy?.isElite && (
                          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[8px] md:text-xs px-2 py-0.5 rounded-full font-black border border-white/40 shadow-lg animate-pulse">
                            CHAMPION
                          </span>
                        )}
                      </div>
                      <span className="text-cyan-400 font-bold text-[10px] md:text-lg tracking-widest flex items-center gap-1">
                        LVL {enemy.level} 
                        <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>
                        {enemy.archetype}
                      </span>
                    </div>
                  </div>
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
                    <span className="text-[8px] md:text-[10px] font-black text-white italic">{Math.floor(player.hp)}/{Math.floor(totalStats.maxHp)}</span>
                  </div>
                  <div className="w-full h-4 md:h-8 bg-black border-[3px] md:border-[5px] border-black p-0.5 relative shadow-[-4px_4px_0_rgba(0,0,0,1)] transition-all overflow-hidden flex items-center">
                    <div className="absolute h-full bg-cyan-400 opacity-30 transition-all duration-700 ease-out right-0" style={{ width: `${Math.min(100, (player.hp / totalStats.maxHp) * 100)}%` }}></div>
                    <div className="h-full bg-gradient-to-l from-cyan-800 to-cyan-500 transition-all duration-300 relative ml-auto" style={{ width: `${Math.min(100, (player.hp / totalStats.maxHp) * 100)}%` }}>
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

        {/* --- TACTICAL UTILITY BELT: ELEVATED Z-INDEX TO ENSURE CLICKABILITY --- */}
        <div className="w-full flex justify-center z-[60] mt-auto pointer-events-none pb-2">
          <div className="flex items-center gap-1 md:gap-3 p-1.5 md:p-3 bg-slate-900/90 border-[3px] border-black rounded-xl shadow-[5px_5px_0_rgba(0,0,0,1)] backdrop-blur-md pointer-events-auto transform -rotate-1">

            {/* Potion Slot */}
            <div className="flex items-center gap-0.5 md:gap-2 bg-slate-900/50 p-0.5 md:p-1.5 rounded-lg md:rounded-2xl border-2 border-white/10 shadow-lg shrink-0">
              <button 
                onClick={cyclePotion} 
                className="w-7 h-7 md:w-10 md:h-10 bg-slate-800 border-2 border-black text-white hover:text-red-400 rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <RefreshCw size={12} className="md:w-5 md:h-5" />
              </button>
              <button 
                onClick={handleHeal} 
                disabled={!potionCountData.hasSelected} 
                className="h-8 md:h-12 px-2 md:px-6 bg-red-600 border-2 border-black rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center gap-1 md:gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:grayscale group min-w-[3rem] md:min-w-[5rem]"
              >
                <span className="text-xs md:text-xl group-hover:scale-125 transition-transform">🧪</span>
                <span className="text-[10px] md:text-xl font-black text-white italic">{potionCountData.count}</span>
              </button>
              <div className="w-12 md:w-24 h-8 md:h-12 bg-red-600 border-2 border-black rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex flex-col items-center justify-center transform -rotate-1 shrink-0">
                 <span className="text-[5px] md:text-[9px] font-black text-white/60 uppercase tracking-tighter leading-none mb-0.5 truncate w-full text-center px-0.5">
                   {potionCountData.selected === 'hp_potion' ? 'POT' : potionCountData.selected === 'mega_hp_potion' ? 'MEGA' : 'ULTRA'}
                 </span>
                 <span className="text-[8px] md:text-xl font-black text-white italic leading-none">
                   {potionCountData.selected === 'hp_potion' ? '10%' : potionCountData.selected === 'mega_hp_potion' ? '50%' : '100%'}
                 </span>
              </div>
            </div>

            {combat.battleMode !== 'GVG' && (
              <>
                <div className="w-[2px] h-6 bg-white/10 mx-0.5 md:mx-1"></div>

                {/* Scroll Slot */}
                <div className="flex items-center gap-0.5 md:gap-2 bg-slate-900/50 p-0.5 md:p-1.5 rounded-lg md:rounded-2xl border-2 border-white/10 shadow-lg shrink-0">
                  {isAutoActive ? (
                    <div className="h-8 md:h-12 px-2 md:px-6 bg-cyan-600 border-2 border-black rounded-md md:rounded-xl shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center gap-1 md:gap-3 animate-pulse">
                      <WandSparkles size={12} className="text-black animate-spin-slow md:w-5 md:h-5" />
                      <div className="flex items-baseline gap-0.5 md:gap-1">
                         <span className="text-[10px] md:text-2xl font-black text-black italic">{autoTimeLeft}</span>
                         <span className="text-[5px] md:text-xs font-black text-black/60 italic uppercase whitespace-nowrap">s</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={cycleScroll} 
                        disabled={!hasAnyScrolls}
                        className="w-7 h-7 md:w-10 md:h-10 bg-slate-800 border-2 border-black text-white hover:text-cyan-400 rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-30"
                      >
                        <RefreshCw size={12} className="md:w-5 md:h-5" />
                      </button>
                      <button 
                        onClick={() => activateAutoScroll(view)} 
                        disabled={!hasAnyScrolls}
                        className="h-8 md:h-12 px-2 md:px-6 bg-cyan-400 border-2 border-black rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center gap-1 md:gap-2 transition-all hover:bg-cyan-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none group min-w-[3rem] md:min-w-[5rem] disabled:opacity-30"
                      >
                        <WandSparkles size={12} className="text-black group-hover:rotate-12 transition-transform md:w-5 md:h-5" />
                        <span className="text-[10px] md:text-xl font-black text-black italic">{scrollCountData.count}</span>
                      </button>
                      <div className="w-12 md:w-24 h-8 md:h-12 bg-cyan-400 border-2 border-black rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex flex-col items-center justify-center transform rotate-1 shrink-0">
                         <span className="text-[5px] md:text-[9px] font-black text-black/60 uppercase tracking-tighter leading-none mb-0.5 truncate w-full text-center px-0.5">
                           {scrollCountData.selected === 'auto_scroll' ? '1M' : scrollCountData.selected === 'auto_scroll_3m' ? '3M' : scrollCountData.selected === 'auto_scroll_6m' ? '6M' : scrollCountData.selected === 'auto_scroll_9m' ? '9M' : '12M'}
                         </span>
                         <span className="text-[8px] md:text-xl font-black text-black italic leading-none">
                           {scrollCountData.selected === 'auto_scroll' ? '1m' : scrollCountData.selected === 'auto_scroll_3m' ? '3m' : scrollCountData.selected === 'auto_scroll_6m' ? '6m' : scrollCountData.selected === 'auto_scroll_9m' ? '9m' : '12m'}
                         </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Food Slot */}
                <div className="flex items-center gap-0.5 md:gap-2 bg-slate-900/50 p-0.5 md:p-1.5 rounded-lg md:rounded-2xl border-2 border-white/10 shadow-lg shrink-0">
                  {isFoodActive ? (
                    <div className="h-8 md:h-12 px-2 md:px-6 bg-emerald-700 border-2 border-black rounded-md md:rounded-xl shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center gap-1 md:gap-3 animate-pulse">
                      <span className="text-sm md:text-2xl leading-none">
                        {player.activeFoodEffect?.stat === 'str' ? '💪' : player.activeFoodEffect?.stat === 'dex' ? '🎯' : '⚡'}
                      </span>
                      <div className="flex items-baseline gap-0.5 md:gap-1">
                         <span className="text-[10px] md:text-2xl font-black text-white italic">{foodTimeLeft}</span>
                         <span className="text-[5px] md:text-xs font-black text-white/60 italic uppercase whitespace-nowrap">s</span>
                      </div>
                    </div>
                  ) : (
                    foodInventory.length > 0 && (
                      <>
                        {foodInventory.length > 1 && (
                          <button
                            onClick={cycleFoodSelection}
                            className="w-7 h-7 md:w-10 md:h-10 bg-slate-800 border-2 border-black text-white hover:text-emerald-400 rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                          >
                            <RefreshCw size={12} className="md:w-5 md:h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => selectedFood && eatFood(selectedFood)}
                          disabled={!selectedFood}
                          className="h-8 md:h-12 px-1.5 md:px-4 bg-emerald-700 border-2 border-black rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center gap-1 md:gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:grayscale group min-w-[2.5rem] md:min-w-[4.5rem]"
                        >
                          <span className="text-sm md:text-2xl leading-none group-hover:scale-125 transition-transform">{selectedFood?.icon || '🍽️'}</span>
                          <span className="text-[10px] md:text-xl font-black text-white italic">{selectedFood?.count || 0}</span>
                        </button>
                        <div className="w-12 md:w-24 h-8 md:h-12 bg-emerald-500 border-2 border-black rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex flex-col items-center justify-center transform -rotate-1 shrink-0">
                           <span className="text-[5px] md:text-[9px] font-black text-black/60 uppercase tracking-tighter leading-none mb-0.5 truncate w-full text-center px-0.5">EAT</span>
                           <span className="text-[8px] md:text-xl font-black text-black italic leading-none">{selectedFood?.effect?.amount ? `+${selectedFood.effect.amount}` : 'BUFF'}</span>
                        </div>
                      </>
                    )
                  )}
                </div>
              </>
            )}

            <div className="w-[2px] h-6 bg-white/10 mx-0.5 md:mx-1"></div>

            {/* SYNC-DRIVE SKILL MODULE */}
            <div className="flex items-center gap-1 md:gap-3 bg-slate-900/50 p-1 md:p-2 rounded-2xl border-2 border-white/10 shadow-lg shrink-0">
               {/* Energy Bar */}
               <div className="w-2 md:w-4 h-10 md:h-16 bg-black border-2 border-black rounded-full overflow-hidden relative shadow-inner">
                  <div 
                    className={`absolute bottom-0 left-0 w-full transition-all duration-500 ease-out bg-gradient-to-t ${skillEnergy >= 100 ? 'from-white to-cyan-400 animate-pulse' : 'from-cyan-900 to-cyan-600'}`}
                    style={{ height: `${skillEnergy}%` }}
                  >
                    {skillEnergy >= 100 && <div className="absolute inset-0 bg-white/40 animate-ping"></div>}
                  </div>
               </div>

               {/* Trigger Button */}
               <button
                 onClick={triggerSkill}
                 disabled={skillEnergy < 100 || !!activeSkill || skillCooldown > 0}
                 className={`relative w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl border-[3px] border-black flex flex-col items-center justify-center transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:grayscale disabled:opacity-40 group overflow-hidden ${
                   skillCooldown > 0 ? 'bg-red-950 border-red-500' :
                   skillEnergy >= 100 ? `bg-gradient-to-br ${activeSkill ? 'from-slate-700 to-slate-900' : (ELEMENTAL_SKILLS[player.gemxElement || 'Cosmic']?.color || 'from-cyan-400 to-indigo-600')} animate-pulse ring-4 ring-white/50` : 'bg-slate-800'
                 }`}
               >
                 {activeSkill ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] md:text-2xl font-black text-white italic">{skillDuration}s</span>
                      <span className="text-[4px] md:text-[8px] font-black text-white/60 uppercase">ACTIVE</span>
                    </div>
                 ) : skillCooldown > 0 ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] md:text-2xl font-black text-red-500 italic">{skillCooldown}s</span>
                      <span className="text-[4px] md:text-[8px] font-black text-red-500/60 uppercase">REBOOT</span>
                    </div>
                 ) : (
                    <>
                      <span className={`text-xl md:text-4xl group-hover:scale-125 transition-transform ${skillEnergy >= 100 ? 'animate-bounce' : ''}`}>
                        {ELEMENTAL_SKILLS[player.gemxElement || 'Cosmic']?.icon || '✨'}
                      </span>
                      <span className="text-[4px] md:text-[8px] font-black text-white uppercase italic tracking-tighter mt-1">SYNC DRIVE</span>
                    </>
                 )}
                 {skillEnergy >= 100 && !activeSkill && (
                    <div className="absolute inset-0 bg-white/20 animate-skill-sweep pointer-events-none"></div>
                 )}
               </button>
            </div>
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


      {/* --- REFINED MISSION PROGRESS HUD --- */}
      {combat.battleMode !== 'GVG' && (
        <div className="absolute bottom-0 left-0 right-0 z-50 px-3 md:px-12 pb-4 pointer-events-none">
          <div className="relative bg-black border-[3px] md:border-4 border-white p-2 md:p-3 shadow-2xl transform rotate-1 flex flex-col gap-2 md:gap-3 pointer-events-auto">
             
             {/* GLOBAL SCALE: OBJECTIVE PENETRATION (Floor 1-40) */}
             <div className="flex flex-col gap-0.5">
                <div className="flex justify-between items-end mb-0.5">
                   <div className="bg-cyan-500 text-black text-[6px] md:text-[9px] font-black px-1.5 py-0.5 border-2 border-black uppercase italic shadow-[1px_1px_0_rgba(0,0,0,1)] -rotate-1 leading-none">
                      OBJ_TREASURE: SECTOR_40
                   </div>
                   <span className="text-[7px] md:text-sm font-black text-white italic tracking-tighter">GLOBAL_PENETRATION: {Math.floor((depth / 40) * 100)}%</span>
                </div>
                <div className="h-2 md:h-5 bg-slate-900 border-2 border-black relative overflow-hidden group shadow-[inner_0_1px_2px_rgba(0,0,0,0.5)]">
                   <div 
                     className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                     style={{ width: `${Math.min(100, (depth / 40) * 100)}%` }}
                   />
                </div>
             </div>

             {/* SECTOR SCALE: TACTICAL CLEARANCE (10 Nodes per Floor) */}
             <div className="flex items-center gap-2 bg-slate-900/40 p-1 md:p-1.5 rounded-lg border border-white/5">
                <div className="flex flex-col shrink-0">
                  <span className="text-[5px] md:text-[7px] font-black text-white/40 uppercase tracking-widest leading-none">LN_{depth}F</span>
                  <span className="text-[8px] md:text-xs font-black text-white italic leading-none truncate">CLR: {combat.killsInFloor}/10</span>
                </div>

                <div className="flex-1 flex gap-0.5 md:gap-1 justify-between">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 md:h-3 flex-1 border-2 border-black transition-all duration-500 relative overflow-hidden ${i < combat.killsInFloor ? 'bg-cyan-500 shadow-[1px_1px_0_rgba(0,0,0,1)]' : 'bg-slate-900 opacity-30 shadow-none'}`} 
                    >
                       {i < combat.killsInFloor && <div className="absolute inset-0 comic-halftone opacity-30 text-black"></div>}
                    </div>
                  ))}
                </div>
             </div>

          </div>
        </div>
      )}

      {/* ===== RAID SUMMARY MODAL (DEFEAT) ===== */}
      {defeatData && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="absolute inset-0 comic-halftone opacity-10 text-red-500 pointer-events-none" />

          {/* Animated blood-red diagonal lines */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="absolute top-0 left-0 w-[200%] h-0.5 bg-red-600 -rotate-6 origin-left animate-pulse" />
            <div className="absolute top-1/4 left-0 w-[200%] h-0.5 bg-red-800 -rotate-6 origin-left animate-pulse delay-300" />
            <div className="absolute top-1/2 left-0 w-[200%] h-0.5 bg-red-600 -rotate-6 origin-left animate-pulse delay-500" />
          </div>

          <div className="relative w-full md:max-w-lg bg-slate-950 border-[5px] border-black shadow-[0_0_80px_rgba(220,38,38,0.4)] animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 flex flex-col overflow-hidden rounded-none md:rounded-2xl max-h-[100dvh] md:max-h-[90vh]">

            {/* Shadow offset */}
            <div className="absolute inset-x-0 bottom-0 top-0 bg-red-800 translate-x-1.5 translate-y-1.5 -z-10 rounded-none md:rounded-2xl" />

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-red-900 via-red-600 to-red-900 border-b-[5px] border-black p-4 md:p-6 relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 comic-halftone opacity-20 text-black" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-black border-4 border-white shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-6 flex-shrink-0">
                  <span className="text-3xl md:text-5xl">💀</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-xs font-black text-red-300 uppercase tracking-[0.4em] italic">Signal Lost</span>
                  <h2 className="text-2xl md:text-4xl font-[1000] text-white italic uppercase tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">
                    HUNTER DOWN
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[8px] md:text-[10px] font-black text-white/50 uppercase tracking-widest">Eliminated by</span>
                    <span className="bg-red-600 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 border border-black uppercase italic shadow-[2px_2px_0_rgba(0,0,0,1)] truncate max-w-[140px] md:max-w-none">
                      {defeatData.killerName}
                    </span>
                    <span className="text-[8px] md:text-[10px] font-black text-red-400 italic">(-{defeatData.killerDmg} DMG)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">

              {/* Run Metrics */}
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="bg-black/60 border-[3px] border-black p-2 md:p-3 flex flex-col items-center shadow-[3px_3px_0_rgba(0,0,0,1)] transform -rotate-1">
                  <span className="text-[7px] md:text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Floor Reached</span>
                  <span className="text-2xl md:text-4xl font-[1000] text-cyan-400 italic leading-none">{defeatData.floor}</span>
                  <span className="text-[6px] md:text-[8px] font-black text-white/30 uppercase tracking-widest mt-0.5">of 40</span>
                </div>
                <div className="bg-black/60 border-[3px] border-black p-2 md:p-3 flex flex-col items-center shadow-[3px_3px_0_rgba(0,0,0,1)] transform rotate-1">
                  <span className="text-[7px] md:text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Kills</span>
                  <span className="text-2xl md:text-4xl font-[1000] text-red-400 italic leading-none">{defeatData.kills}</span>
                  <span className="text-[6px] md:text-[8px] font-black text-white/30 uppercase tracking-widest mt-0.5">Nodes</span>
                </div>
                <div className="bg-black/60 border-[3px] border-black p-2 md:p-3 flex flex-col items-center shadow-[3px_3px_0_rgba(0,0,0,1)] transform -rotate-1">
                  <span className="text-[7px] md:text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Loot Drops</span>
                  <span className="text-2xl md:text-4xl font-[1000] text-amber-400 italic leading-none">{defeatData.sessionLoots.length}</span>
                  <span className="text-[6px] md:text-[8px] font-black text-white/30 uppercase tracking-widest mt-0.5">Items</span>
                </div>
              </div>

              {/* Rewards Earned */}
              <div className="bg-black/40 border-[3px] border-white/10 p-3 md:p-4 shadow-[3px_3px_0_rgba(0,0,0,1)] space-y-2">
                <span className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">Rewards Secured Before Extraction</span>
                <div className="flex items-center gap-3 md:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-lg md:text-2xl">💰</span>
                    <div className="flex flex-col">
                      <span className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-none">GX Collected</span>
                      <span className="text-base md:text-xl font-[1000] text-amber-400 italic">{defeatData.sessionGX.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <span className="text-lg md:text-2xl">⭐</span>
                    <div className="flex flex-col">
                      <span className="text-[8px] md:text-[9px] font-black text-white/40 uppercase">XP Gained</span>
                      <span className="text-base md:text-xl font-[1000] text-cyan-400 italic">{defeatData.sessionXP.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loot List */}
              {(() => {
                const stackedLoots = Object.values((defeatData.sessionLoots || []).reduce((acc, item) => {
                  const key = item.name;
                  if (!acc[key]) acc[key] = { ...item, count: 0 };
                  acc[key].count += 1;
                  return acc;
                }, {}));

                return stackedLoots.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[8px] md:text-[10px] font-black text-white/40 uppercase tracking-widest">Items Recovered</span>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                      {stackedLoots.slice(0, 12).map((item, idx) => (
                        <div key={idx} className="bg-black/50 border border-white/10 p-1.5 md:p-2 flex items-center gap-2 rounded relative">
                          <span className="text-base md:text-lg flex-shrink-0">{item.icon || '📦'}</span>
                          <span className="text-[8px] md:text-[9px] font-black text-white uppercase italic truncate">{item.name}</span>
                          {item.count > 1 && (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded-sm border border-black shadow-md">
                              x{item.count}
                            </span>
                          )}
                        </div>
                      ))}
                      {stackedLoots.length > 12 && (
                        <div className="col-span-2 text-center text-[8px] font-black text-white/30 uppercase italic py-1">+{stackedLoots.length - 12} more unique items</div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Penalty Notice */}
              <div className="bg-red-950/40 border-[2px] border-red-800/40 p-2 md:p-3 flex items-center gap-2">
                <span className="text-base md:text-lg flex-shrink-0">⚠️</span>
                <p className="text-[8px] md:text-[9px] font-black text-red-400 uppercase italic tracking-wide">
                  30-second re-entry penalty applied. HP restored to full.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 p-3 md:p-4 bg-black/80 border-t-[4px] border-black flex flex-col md:flex-row gap-2 md:gap-3">
              <button
                id="raid-summary-reenter-btn"
                onClick={() => handleDismissDefeat(true)}
                className="flex-1 bg-cyan-500 border-[3px] border-black py-3 md:py-4 font-black text-black text-sm md:text-base uppercase italic tracking-tight shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-cyan-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg">🔁</span> Re-Enter Dungeon
              </button>
              <button
                id="raid-summary-menu-btn"
                onClick={() => handleDismissDefeat(false)}
                className="flex-1 bg-slate-800 border-[3px] border-black py-3 md:py-4 font-black text-white text-sm md:text-base uppercase italic tracking-tight shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-slate-700 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg">🏠</span> Return to Menu
              </button>
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
