import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, MousePointer, Coffee, Wind, Zap, Skull, Swords, Activity, Shield, Target, Star, Lock, HelpCircle, RefreshCw, Check, Sparkles, WandSparkles, Search, List, ChevronRight, RotateCw, FlaskConical } from 'lucide-react';
import { BossImpactSplash, ImpactSplash, BattleParticles } from './CombatEffects';
import { AvatarMedia, SquadHUD, ConfirmationModal, Header } from './GameUI';
import { X } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { SOUNDS } from '../hooks/useAudioEngine';

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

export const BossView = () => {
  const {
      player, adventure, combat, actions, gameLoop, audio, totalStats, autoScrollState, 
      BOSS, BOSS_MEDIA_FILES, TAVERN_MATES, openGuide, syncPlayer, lowPerfMode, FOODS,
      bossAvatarIdx, setBossAvatarIdx, showBossVideo, setShowBossVideo,
      LOOTS, ITEMS, PETS_METADATA, EQUIPMENT, ELEMENTAL_SKILLS
  } = useGame();

  const { view, setView, enemyFlinch, isHurt } = adventure;
  const { 
    stunTimeLeft, missTimeLeft, combatState, impactSplash, playerImpactSplash, 
    strikingSide, currentTaunt, playerTaunt,
    skillEnergy, activeSkill, skillDuration, triggerSkill, skillCooldown,
    monsterSkillActive, squadStrikeActive,
    defeatData, handleDismissDefeat
  } = combat;
  const { handleHeal, activateAutoScroll, cyclePotion, cycleScroll, eatFood } = actions;
  const { autoTimeLeft, dragonTimeLeft, buffTimeLeft, foodTimeLeft } = gameLoop;
  const [showRetreatConfirm, setShowRetreatConfirm] = React.useState(false);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const battleParticlesRef = React.useRef(null);
  const bossContainerRef = React.useRef(null);
  const playerContainerRef = React.useRef(null);
  const arenaRef = React.useRef(null);

  const possibleDrops = React.useMemo(() => {
    // Show top tier relics and blueprints as potential drops
    const relics = EQUIPMENT?.filter(e => e.type === 'Relic').slice(0, 5) || [];
    const schematics = LOOTS?.filter(l => l.type === 'Schematic').slice(0, 3) || [];
    return [...relics, ...schematics];
  }, [EQUIPMENT, LOOTS]);

  const [isPossibleDropsModalOpen, setIsPossibleDropsModalOpen] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_boss_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Abyssal Breach",
      npc: 17,
      visualType: 'boss',
      text: "Warning! You have entered Sector Ω. Boss entities here are Immortal and cannot be destroyed. Your goal is to survive and deal maximum damage.",
      hint: "Tip: Ensure you have enough HP Potions equipped."
    },
    {
      title: "Damage Record",
      npc: 6,
      visualType: 'damage',
      text: "Every point of damage you deal is permanently added to your Global Boss Damage rating, which is tracked on the Leaderboard.",
      hint: "Strategy: Maximize your Strength (STR) for higher output."
    },
    {
      title: "Overload Protocol",
      npc: 12,
      visualType: 'combat',
      text: "Spam the Overload button to attack! But be careful—Bosses can strike back with devastating stuns that disable your systems temporarily.",
      hint: "Warning: Retreating will save your accumulated damage."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_boss_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  const isAutoActive = autoTimeLeft > 0;
  const isStunned = stunTimeLeft > 0;
  const isMissed = missTimeLeft > 0;
  const isFoodActive = (foodTimeLeft || 0) > 0;
  const isMateBuffActive = (buffTimeLeft || 0) > 0;
  const activeMate = isMateBuffActive ? TAVERN_MATES.find(m => m.id === player.hiredMate) : null;

  const potionCountData = React.useMemo(() => {
    const sel = player.selectedPotionId || 'hp_potion';
    const invCount = Object.values(player.inventory || {}).filter(i => i && i.id?.startsWith(sel)).length;
    const baseCount = player.potions || 0;
    return {
      selected: sel,
      count: sel === 'hp_potion' ? (invCount + baseCount) : invCount,
      hasSelected: (sel === 'hp_potion' ? (invCount + baseCount) : invCount) > 0
    };
  }, [player.selectedPotionId, player.inventory, player.potions]);

  const scrollCountData = React.useMemo(() => {
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
    
    const possibleScrollIds = ['auto_scroll_12m', 'auto_scroll_9m', 'auto_scroll_6m', 'auto_scroll_3m', 'auto_scroll'];
    const invCount = Object.values(player.inventory || {}).filter(i => {
      if (!i || !i.id) return false;
      const itemBaseId = possibleScrollIds.find(baseId => i.id.startsWith(baseId));
      return itemBaseId === sel;
    }).length;

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
  }, [player.selectedScrollId, player.autoScrolls, player.inventory]);

  const hasAnyPotions = React.useMemo(() => (player.potions > 0) || Object.values(player.inventory || {}).some(i => i?.id?.includes('hp_potion')), [player.potions, player.inventory]);
  const hasAnyScrolls = React.useMemo(() => (player.autoScrolls > 0) || Object.values(player.inventory || {}).some(i => i?.id?.includes('auto_scroll')), [player.autoScrolls, player.inventory]);

  const foodInventory = React.useMemo(() => {
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
  const cycleFoodSelection = () => setSelectedFoodIdx(prev => foodInventory.length > 0 ? (prev + 1) % foodInventory.length : 0);

  React.useEffect(() => {
    if (impactSplash && battleParticlesRef.current && bossContainerRef.current && arenaRef.current) {
      const rect = bossContainerRef.current.getBoundingClientRect();
      const arenaRect = arenaRef.current.getBoundingClientRect();
      battleParticlesRef.current.emit(
        (rect.left - arenaRect.left) + rect.width / 2, 
        (rect.top - arenaRect.top) + rect.height / 2, 
        'spark', 
        { speed: 20, size: 20, gravity: -0.2, count: 80 }
      );
    }
  }, [impactSplash]);

  React.useEffect(() => {
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
    if (squadStrikeActive && battleParticlesRef.current && bossContainerRef.current && arenaRef.current) {
      const rect = bossContainerRef.current.getBoundingClientRect();
      const arenaRect = arenaRef.current.getBoundingClientRect();
      
      // Intensive Burst
      setTimeout(() => {
        battleParticlesRef.current.emit(
          (rect.left - arenaRect.left) + rect.width / 2, 
          (rect.top - arenaRect.top) + rect.height / 2, 
          squadStrikeActive.element || 'impact', 
          { speed: 25, size: 20, gravity: 0.1, count: 80 }
        );
        if (audio) audio.playSFX(SOUNDS.skillTrigger);
      }, 400); // Sync with banner animation
    }
  }, [squadStrikeActive]);

  return (
    <div 
      ref={arenaRef}
      className={`flex-1 p-4 flex flex-col items-center justify-between gap-4 animate-in fade-in relative overflow-hidden bg-slate-950 ${isHurt ? 'animate-damage' : ''}`}
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
                       {PETS_METADATA.find(p => p.id === player.petId)?.element === 'Pyro' ? '🔥' :
                        PETS_METADATA.find(p => p.id === player.petId)?.element === 'Hydro' ? '💧' :
                        PETS_METADATA.find(p => p.id === player.petId)?.element === 'Gale' ? '⚡' : '⛰️'}
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

      {/* MONSTER SKILL CUT-IN */}
      {monsterSkillActive && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center pointer-events-none animate-in fade-in slide-in-from-right duration-300">
           <div className="w-full bg-red-950/90 border-y-[6px] border-red-500 py-8 md:py-12 transform rotate-2 relative overflow-hidden shadow-[0_0_100px_rgba(255,0,0,0.5)]">
             <div className="absolute inset-0 bg-comic-dots opacity-40 text-red-500"></div>
             <div className="relative z-10 flex flex-row-reverse items-center justify-center gap-4 md:gap-12 px-4">
                <div className="w-16 h-16 md:w-32 md:h-32 border-[4px] md:border-[6px] border-red-500 shadow-[6px_6px_0_rgba(255,0,0,0.2)] overflow-hidden transform -rotate-3 bg-slate-900 shrink-0">
                  <BossAvatarMedia bossIdx={bossAvatarIdx} animated={true} className="w-full h-full object-cover contrast-125" BOSS_MEDIA_FILES={BOSS_MEDIA_FILES} />
                </div>
                <div className="flex flex-col items-center md:items-end text-center md:text-right">
                  <span className="text-red-500 font-black text-xs md:text-xl uppercase tracking-[0.5em] italic mb-2 animate-pulse">Boss Ability Detected</span>
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
      {/* Dynamic Action Lines Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden sm:opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-action-lines" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg, transparent 0deg 10deg, rgba(239,68,68,0.05) 10deg 20deg)' }}></div>
      </div>

      {/* Halftone Overlay HUD */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-10 comic-halftone text-red-500"></div>

      {/* --- HUD TOP: CONSOLIDATED MISSION COMMAND ARRAY --- */}
      <Header 
        title="ABYSSAL BREACH: SECTOR Ω" 
        onClose={() => setShowRetreatConfirm(true)} 
        npcNum={15} 
        onHelp={() => {
           setTutorialStep(0);
           setShowTutorial(true);
        }}
      >
        {/* --- TACTICAL MISSION COMMAND MODULE (BALANCED) --- */}
        <div className="flex items-center bg-slate-950/40 border-[2px] border-white/5 rounded-xl p-1 md:p-1.5 backdrop-blur-sm transform -skew-x-2 md:-skew-x-6 animate-in slide-in-from-top-4 duration-700">
           {/* Section 1: Data Stream Manifest */}
           <button
             onClick={() => setIsPossibleDropsModalOpen(true)}
             className="group flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1 md:py-1.5 focus:outline-none transform skew-x-2 md:skew-x-6"
           >
             <div className="bg-slate-900 border-2 border-red-500/30 p-1 md:p-1.5 rounded-lg group-hover:bg-red-500 group-hover:border-black transition-all">
                <Search size={14} className="text-red-400 group-hover:text-black transition-colors md:w-5 md:h-5" />
             </div>
             <div className="flex flex-col items-start leading-none">
                <span className="text-[6px] md:text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-black/50 transition-colors">BIT_STREAM</span>
                <span className="text-[10px] md:text-base font-black text-white group-hover:text-red-400 uppercase italic transition-colors">MANIFEST</span>
             </div>
           </button>
        </div>
      </Header>


      {/* --- BATTLE ARENA: RESTRUCTURED FOR SYMMETRY --- */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col relative z-40 px-2 md:px-12 py-2 pb-32 md:pb-44">
        
        {/* VS CENTRAL BADGE */}
        <div className="hidden lg:flex absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
           <div className="w-24 h-24 bg-yellow-400 border-[8px] border-black rounded-full shadow-[10px_10px_0_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-12 animate-kapow">
              <span className="text-black font-black text-4xl italic tracking-tighter drop-shadow-[2px_2px_0_#fff]">VS</span>
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
          <div className="absolute inset-x-2 md:inset-x-12 top-[40%] -translate-y-1/2 bg-slate-500/90 backdrop-blur-md border-[4px] md:border-[6px] border-black z-[110] flex items-center justify-center shadow-lg transform rotate-1 animate-in zoom-in py-6 md:py-10">
            <div className="flex items-center gap-4 md:gap-8">
               <Activity size={32} className="md:w-12 md:h-12 text-black" />
               <p className="font-black text-lg md:text-5xl uppercase italic text-black tracking-widest text-center">ATTACK DEFLECTED!</p>
            </div>
          </div>
        )}

        {/* ENGAGEMENT ZONE (AVATARS) */}
        <div className="grid grid-cols-2 gap-4 md:gap-12 items-center mb-4 md:mb-8">
          {/* BOSS AVATAR */}
          <div className={`flex flex-col items-center lg:items-end transition-all duration-300 ${strikingSide === 'monster' ? 'animate-strike-right' : ''}`}>
             <div className="relative group">
                {/* Boss Aura */}
                <div className="absolute inset-0 -m-8 bg-red-600/20 blur-3xl rounded-full animate-pulse scale-125 z-0"></div>
                
                <div 
                  ref={bossContainerRef}
                  className={`w-36 h-36 sm:w-44 sm:h-44 md:w-64 md:h-64 bg-slate-950 flex items-center justify-center border-[6px] md:border-[8px] border-black shadow-[8px_8px_0_rgba(239,68,68,0.3)] md:shadow-[12px_12px_0_rgba(239,68,68,0.3)] overflow-hidden relative transform -rotate-3 ${enemyFlinch || impactSplash ? 'animate-flinch' : 'animate-float'}`}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#450a0a_0%,transparent_80%)] opacity-60 z-20"></div>
                    <BossAvatarMedia bossIdx={bossAvatarIdx} animated={showBossVideo && !lowPerfMode} className="w-full h-full object-cover relative z-10 contrast-125 brightness-75 drop-shadow-[0_0_30px_rgba(239,68,68,0.2)]" BOSS_MEDIA_FILES={BOSS_MEDIA_FILES} />
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowBossVideo(!showBossVideo); }}
                      className="absolute top-2 right-2 z-40 bg-black/90 p-1 md:p-2 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      {showBossVideo ? <Wind size={14} className="md:w-4 md:h-4" /> : <Zap size={14} className="md:w-4 md:h-4" />}
                    </button>

                    {/* RECTANGULAR TAUNT OVERLAY (BOSS) */}
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
                        if (!combat.combatBusRef.current) {
                          combat.handleAttack(true);
                        }
                      }}
                      className={`absolute top-1 left-1 z-40 bg-red-600 border-2 border-white rounded md:rounded-lg p-1 md:p-1.5 flex flex-col items-center transition-all hover:bg-white hover:border-red-600 group shadow-[2px_2px_0_rgba(0,0,0,1)] active:scale-95 ${(combat.combatBusRef.current) ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}
                    >
                      <span className="text-sm md:text-2xl group-hover:animate-bounce">⚔️</span>
                      <span className="text-[5px] md:text-[8px] font-black text-white group-hover:text-red-600 uppercase italic tracking-tighter leading-none mt-0.5">STRIKE</span>
                    </button>
                    
                    <BossImpactSplash splash={impactSplash} />
                </div>
             </div>
          </div>

          {/* PLAYER AVATAR */}
          <div className={`flex flex-col items-center lg:items-start transition-all duration-300 ${strikingSide === 'player' ? 'animate-strike-left' : ''}`}>
             <div className="relative group">
                <div className="flex items-center gap-3 md:gap-8">
                  <div 
                    ref={playerContainerRef}
                    className={`w-36 h-36 sm:w-44 sm:h-44 md:w-64 md:h-64 bg-slate-950 flex items-center justify-center border-[6px] md:border-[8px] border-black shadow-[6px_6px_0_rgba(8,145,178,0.3)] md:shadow-[12px_12px_0_rgba(8,145,178,0.3)] overflow-hidden relative transform rotate-3 ${strikingSide === 'monster' && playerImpactSplash ? 'animate-flinch' : 'animate-float'}`}
                  >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#064e3b_0%,transparent_80%)] opacity-50 z-20"></div>
                      <div className="absolute inset-0 opacity-20 comic-halftone text-cyan-500 z-10 pointer-events-none"></div>
                      {player.avatar && (
                        <AvatarMedia num={player.avatar} animated={!lowPerfMode} className="w-full h-full object-cover relative z-10 contrast-125" />
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

                      {/* RETREAT TACTICAL OVERLAY */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRetreatConfirm(true);
                        }}
                        className="absolute top-1 right-1 z-40 bg-slate-800 border-2 border-white rounded md:rounded-lg p-1 md:p-1.5 flex flex-col items-center transition-all hover:bg-white group shadow-[2px_2px_0_rgba(0,0,0,1)] active:scale-95"
                      >
                        <span className="text-sm md:text-2xl group-hover:animate-out group-hover:slide-out-to-right-4 transition-all">🏃</span>
                        <span className="text-[5px] md:text-[8px] font-black text-white group-hover:text-slate-800 uppercase italic tracking-tighter leading-none mt-0.5">RETREAT</span>
                      </button>

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

        {/* COMBAT INTEL TIER (HORIZONTALLY ALIGNED) */}
        <div className="grid grid-cols-2 gap-4 md:gap-12 items-start mb-8">
          {/* BOSS STATUS */}
          <div className="w-full flex flex-col items-center lg:items-end space-y-2 md:space-y-4">
              <div className="w-full max-w-[280px] md:max-w-[320px] flex flex-col gap-2">
                <div className="bg-red-600 text-white px-4 py-1.5 md:px-6 md:py-2 border-[4px] md:border-[5px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] relative flex flex-col transform -rotate-1">
                    <span className="text-[7px] md:text-[8px] font-black uppercase opacity-70 tracking-widest italic leading-none mb-0.5">Threat Identified</span>
                    <h2 className="text-sm md:text-3xl font-black uppercase tracking-tighter italic leading-none truncate drop-shadow-md">{BOSS.name}</h2>
                    <div className="absolute -top-4 -right-2 md:-top-6 md:-right-4 bg-black text-white px-2 py-0.5 md:px-3 md:py-1 text-[8px] md:text-xs font-black border-2 border-white rotate-12 shadow-xl">LVL {BOSS.level}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-1 md:gap-2 bg-black/60 border-[3px] md:border-4 border-black p-1 md:p-2 shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-1">
                  <div className="flex flex-col items-center p-0.5 md:p-1 border-r border-white/10 text-red-500">
                    <span className="text-[6px] md:text-[7px] font-black uppercase">STR</span>
                    <span className="text-[10px] md:text-xs font-black italic">{BOSS.str}</span>
                  </div>
                  <div className="flex flex-col items-center p-0.5 md:p-1 border-r border-white/10 text-emerald-500">
                    <span className="text-[6px] md:text-[7px] font-black uppercase">AGI</span>
                    <span className="text-[10px] md:text-xs font-black italic">{BOSS.agi}</span>
                  </div>
                  <div className="flex flex-col items-center p-0.5 md:p-1 text-cyan-500">
                    <span className="text-[6px] md:text-[7px] font-black uppercase">DEX</span>
                    <span className="text-[10px] md:text-xs font-black italic">{BOSS.dex}</span>
                  </div>
                </div>

                <div className="w-full group">
                  <div className="flex justify-between items-center mb-0.5 px-1">
                    <span className="text-[8px] md:text-[9px] font-black text-red-500 uppercase italic">Power Core</span>
                    <span className="text-[8px] md:text-[10px] font-black text-white italic">IMMORTAL</span>
                  </div>
                  <div className="w-full h-4 md:h-8 bg-black border-[3px] md:border-[5px] border-black p-0.5 relative shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300 relative" style={{ width: `100%` }}>
                      <div className="absolute inset-0 comic-halftone opacity-30 pointer-events-none text-black"></div>
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/80 border-[4px] md:border-[6px] border-black p-2 md:p-4 shadow-[8px_8px_0_rgba(220,38,38,0.3)] transform -rotate-2">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[6px] md:text-[10px] font-black text-red-500 uppercase italic tracking-[0.2em]">Total Damage Uploaded</span>
                      <Activity size={12} className="text-red-500 animate-pulse" />
                   </div>
                   <div className="text-xl md:text-4xl font-[1000] text-white italic drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] tracking-tighter">
                      {Math.floor(player.totalBossDamage || 0).toLocaleString()}
                   </div>
                </div>
              </div>
          </div>

          {/* PLAYER STATUS */}
          <div className="w-full flex flex-col items-center lg:items-start space-y-2 md:space-y-4">
              <div className="w-full max-w-[280px] md:max-w-[320px] flex flex-col gap-2">
                <div className="bg-cyan-600 text-white px-4 py-1.5 md:px-5 md:py-2 border-[4px] md:border-[5px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-end transform rotate-1 relative">
                    <span className="text-[7px] md:text-[8px] font-black uppercase opacity-70 tracking-widest italic leading-none mb-0.5">Assigned Hunter</span>
                    <h2 className="text-xs md:text-3xl font-black uppercase tracking-tighter italic leading-none truncate">{player.name}</h2>
                    <div className="absolute -top-3 -left-2 md:-top-5 md:-left-4 bg-black text-cyan-400 px-1.5 py-0.5 md:px-3 md:py-1 text-[7px] md:text-xs font-black border-2 md:border-cyan-400 rotate-12 shadow-xl shrink-0">RANK: S</div>
                </div>
                
                <div className="w-full group transform -rotate-1">
                   <div className="flex justify-between items-center mb-0.5 px-1 flex-row-reverse">
                      <span className="text-[8px] md:text-[10px] font-black text-cyan-500 uppercase italic">Biological Core</span>
                      <span className="text-[8px] md:text-[10px] font-black text-white italic">{Math.floor(player.hp)}/{Math.floor(player.maxHp)}</span>
                   </div>
                   <div className="w-full h-4 md:h-8 bg-black border-[3px] md:border-[5px] border-black p-0.5 relative shadow-[-4px_4px_0_rgba(0,0,0,1)] transition-all overflow-hidden flex items-center">
                      <div className="h-full bg-gradient-to-r from-cyan-800 via-cyan-500 to-cyan-400 transition-all duration-300 relative ml-auto" style={{ width: `${(player.hp / player.maxHp) * 100}%` }}>
                         <div className="absolute inset-0 comic-halftone opacity-30 pointer-events-none text-black"></div>
                         <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-1 md:gap-2 bg-black/60 border-[3px] md:border-4 border-black p-1 md:p-2 shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-1">
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
              </div>
          </div>
        </div>
      </div>

      {/* --- TACTICAL UTILITY BELT: ELEVATED Z-INDEX TO ENSURE CLICKABILITY --- */}
      <div className="w-full flex justify-center z-[60] mt-auto pointer-events-none relative pb-4">
        <div className="flex items-center gap-1 md:gap-3 p-1 md:p-2 bg-slate-900/90 border-[3px] border-black rounded-xl shadow-[5px_5px_0_rgba(0,0,0,1)] backdrop-blur-md pointer-events-auto transform -rotate-1">

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
              className="h-8 md:h-12 px-1.5 md:px-4 bg-red-600 border-2 border-black rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center gap-1 md:gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-30 disabled:grayscale group min-w-[2.5rem] md:min-w-[4.5rem]"
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
                  className="h-8 md:h-12 px-1.5 md:px-4 bg-cyan-400 border-2 border-black rounded-md md:rounded-xl shadow-[1px_1px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center gap-1 md:gap-2 transition-all hover:bg-cyan-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none group min-w-[2.5rem] md:min-w-[4.5rem] disabled:opacity-30"
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

          <div className="w-[2px] h-6 bg-white/10 mx-0.5 md:mx-1"></div>

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
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showRetreatConfirm}
        onClose={() => setShowRetreatConfirm(false)}
        onConfirm={combat.handleRetreat}
        title="ABANDON BOSS RAID?"
        message="Retreating from the Abyssal Breach will reset your current session stats. Are you sure you want to withdraw your signal?"
        confirmText="YES, RETREAT"
        cancelText="NO, CONTINUE"
      />

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-red-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-red-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-black text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(255,255,255,0.3)]">
                  {tutorialSteps[tutorialStep].title}
                </h2>
                <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">
                  Step {tutorialStep + 1} / {tutorialSteps.length}
                </div>
              </div>

              {/* NPC & Topic Visual Section */}
              <div className="py-3 md:py-4 relative flex justify-center items-center gap-3 w-full z-10">
                {/* NPC Avatar */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0 flex items-center justify-center">
                   <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                   <div className="absolute inset-x-0 bottom-0 bg-red-600 text-[6px] font-black text-black text-center py-0.5 uppercase italic">COMMANDER</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-red-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'boss' && (
                     <Skull className="text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'damage' && (
                     <TrendingUp className="text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] z-10 animate-pulse" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'combat' && (
                     <Activity className="text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-red-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-red-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-red-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-red-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-red-500' : 'bg-slate-800'}`}
                   >
                     {dontShowAgain && <Check size={10} className="text-white" />}
                   </button>
                   <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                     Don't show this briefing again
                   </span>
                </div>

                <div className="flex gap-2 shrink-0 pb-1">
                   {tutorialStep > 0 && (
                      <button
                        onClick={() => setTutorialStep(prev => prev - 1)}
                        className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[9px]"
                      >
                        BACK
                      </button>
                   )}
                  <button
                    onClick={nextStep}
                    className="flex-[2] bg-red-600 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-red-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'ENGAGE TARGET' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Boss Defeat — Raid Summary Modal */}
      {defeatData && (
        <div className="absolute inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in zoom-in duration-300">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-0 bg-red-800 rounded-3xl transform translate-x-2 translate-y-2" />
            <div className="relative bg-slate-950 border-[4px] border-black rounded-3xl overflow-hidden flex flex-col">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f87171 1px, transparent 1px)', backgroundSize: '8px 8px' }} />

              {/* Header */}
              <div className="w-full bg-red-600 py-5 border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg">
                <h2 className="text-4xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">HUNTER DOWN</h2>
                <div className="absolute -bottom-3 right-6 bg-black text-white px-3 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] transform rotate-2 border-2 border-white">Boss Room Ejection</div>
              </div>

              {/* Stats */}
              <div className="p-6 space-y-4 relative z-10">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center bg-black/40 rounded-xl p-2 border border-white/5">
                    <span className="text-[7px] font-black text-slate-500 uppercase">Kills</span>
                    <span className="text-sm font-black text-amber-400 italic">{defeatData.kills ?? 0}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black/40 rounded-xl p-2 border border-white/5">
                    <span className="text-[7px] font-black text-slate-500 uppercase">GX Earned</span>
                    <span className="text-sm font-black text-amber-400 italic">{(defeatData.sessionGX || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black/40 rounded-xl p-2 border border-white/5">
                    <span className="text-[7px] font-black text-slate-500 uppercase">XP Earned</span>
                    <span className="text-sm font-black text-white italic">{(defeatData.sessionXP || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-3">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Defeated by</p>
                  <p className="text-base font-black text-white uppercase italic tracking-tighter">{defeatData.killerName}</p>
                  {defeatData.killerDmg && <p className="text-[9px] text-red-400 font-black uppercase">Fatal blow: {defeatData.killerDmg} DMG</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDismissDefeat(false)}
                    className="py-3 bg-slate-800 text-white font-black uppercase italic text-xs rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-slate-700 active:translate-y-1 active:shadow-none transition-all"
                  >🏠 Return to Menu</button>
                  <button
                    onClick={() => handleDismissDefeat(true)}
                    className="py-3 bg-red-700 text-white font-black uppercase italic text-xs rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-red-600 active:translate-y-1 active:shadow-none transition-all"
                  >🔁 Re-Challenge Boss</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
