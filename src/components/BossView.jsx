import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MousePointer, Coffee, Wind, Zap, Skull, Swords, Activity, Shield, Target, Star, TrendingUp, Lock, HelpCircle, RefreshCw, Check, Sparkles } from 'lucide-react';
import { BossImpactSplash, ImpactSplash } from './CombatEffects';
import { AvatarMedia, SquadHUD, ConfirmationModal } from './GameUI';
import { X } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

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
      BOSS, BOSS_MEDIA_FILES, TAVERN_MATES, openGuide, syncPlayer,
      bossAvatarIdx, setBossAvatarIdx, showBossVideo, setShowBossVideo
  } = useGame();

  const { view, setView, enemyFlinch } = adventure;
  const { stunTimeLeft, missTimeLeft, combatState, impactSplash, playerImpactSplash, strikingSide, currentTaunt, playerTaunt } = combat;
  const { handleHeal, activateAutoScroll, cyclePotion, cycleScroll } = actions;
  const { autoTimeLeft, dragonTimeLeft } = gameLoop;
  const [showRetreatConfirm, setShowRetreatConfirm] = React.useState(false);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

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

  const currentPotionCount = React.useMemo(() => {
    const sel = player.selectedPotionId || 'hp_potion';
    const invCount = Object.values(player.inventory || {}).filter(i => i && i.id?.startsWith(sel)).length;
    return sel === 'hp_potion' ? invCount + (player.potions || 0) : invCount;
  }, [player.selectedPotionId, player.inventory, player.potions]);

  const currentScrollCount = React.useMemo(() => {
    const sel = player.selectedScrollId || 'auto_scroll';
    const invCount = Object.values(player.inventory || {}).filter(i => i && i.id?.startsWith(sel)).length;
    return sel === 'auto_scroll' ? invCount + (player.autoScrolls || 0) : invCount;
  }, [player.selectedScrollId, player.inventory, player.autoScrolls]);

  const hasAnyPotions = React.useMemo(() => (player.potions > 0) || Object.values(player.inventory || {}).some(i => i.id?.includes('hp_potion')), [player.potions, player.inventory]);
  const hasAnyScrolls = React.useMemo(() => (player.autoScrolls > 0) || Object.values(player.inventory || {}).some(i => i.id?.includes('auto_scroll')), [player.autoScrolls, player.inventory]);

  return (
    <div className={`flex-1 p-4 flex flex-col items-center justify-between gap-4 animate-in fade-in relative overflow-hidden bg-slate-950 ${(combatState !== 'IDLE' && strikingSide === 'player') ? 'animate-damage' : ''}`}>
      {/* Dynamic Action Lines Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden sm:opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-action-lines" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg, transparent 0deg 10deg, rgba(239,68,68,0.05) 10deg 20deg)' }}></div>
      </div>

      {/* Halftone Overlay HUD */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-10 comic-halftone text-red-500"></div>

      {/* --- HUD TOP --- */}
      <div className="w-full flex justify-between items-start z-30 px-2 md:px-6 mt-2 md:mt-4">
        <div className="flex flex-col gap-1.5 md:gap-4">
            <div className="bg-black border-[3px] md:border-[4px] border-red-600 px-3 py-1.5 md:px-6 md:py-2 shadow-xl transform skew-x-[-12deg] relative overflow-hidden">
                <div className="absolute inset-0 comic-halftone opacity-10 text-red-500"></div>
                <h1 className="text-xs md:text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] relative z-10">
                    Abyssal Breach <span className="text-red-500 animate-pulse">DETECTED</span>
                </h1>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
                <div className="flex items-center gap-1.5 md:gap-3 px-2 md:px-4 py-1 md:py-2 bg-black border-[2px] md:border-[3px] border-red-600 rounded shadow-[3px_3px_0_rgba(0,0,0,1)] text-white transform -rotate-1">
                    <TrendingUp size={12} className="text-red-500 animate-pulse md:w-4 md:h-4" />
                    <span className="text-[7px] md:text-[10px] font-black uppercase tracking-widest italic leading-none">Sector Ω</span>
                </div>
                <button 
                  onClick={() => {
                    setTutorialStep(0);
                    setShowTutorial(true);
                  }} 
                  className="p-1.5 md:p-2.5 bg-red-600 border-[2px] md:border-[3px] border-black text-white shadow-[3px_3px_0_rgba(0,0,0,1)] hover:bg-red-400 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none transform rotate-3"
                  title="Tactical Intel"
                >
                  <HelpCircle size={14} className="md:w-[18px] md:h-[18px]" strokeWidth={4} />
                </button>
                <button 
                  onClick={() => adventure.goBack()} 
                  className="p-1.5 md:p-2.5 bg-black border-[2px] md:border-[3px] border-black text-white shadow-[3px_3px_0_rgba(0,0,0,1)] hover:text-red-500 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none transform -rotate-1"
                  title="Quick Exit"
                >
                  <X size={14} className="md:w-[18px] md:h-[18px]" strokeWidth={4} />
                </button>
            </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 md:gap-3 scale-90 sm:scale-100 origin-top-right">
            <div className="flex gap-2 md:gap-3">
                <div className="flex flex-col gap-1 items-end">
                    <button onClick={handleHeal} disabled={currentPotionCount <= 0} className="flex items-center gap-1.5 md:gap-3 bg-red-600 border-[2px] md:border-[3px] border-black px-3 py-1.5 md:px-5 md:py-2.5 rounded hover:bg-red-500 transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 group relative overflow-hidden">
                        <div className="absolute inset-0 comic-halftone opacity-20 pointer-events-none text-black"></div>
                        <Coffee size={14} className="text-white group-hover:scale-110 transition-transform relative z-10 md:w-[18px] md:h-[18px]" />
                        <div className="flex flex-col items-start bg-transparent leading-none gap-0.5 relative z-10">
                            <span className="text-[6px] md:text-[8px] font-black uppercase text-white/70 italic">
                                {player.selectedPotionId === 'hp_potion' ? 'SMALL' : player.selectedPotionId?.replace('_hp_potion', '').toUpperCase() || 'HEAL'}
                            </span>
                            <span className="text-xs md:text-sm font-black text-white italic">{currentPotionCount}</span>
                        </div>
                    </button>
                    <button onClick={cyclePotion} className="px-2 py-0.5 bg-black/60 border border-white/20 rounded text-[7px] font-black text-white/50 hover:text-cyan-400 hover:border-cyan-400/50 uppercase italic flex items-center gap-1 transition-all">
                       <RefreshCw size={8} /> SWAP
                    </button>
                </div>
                
                <div className="flex flex-col gap-1.5 md:gap-2 items-end">
                  {hasAnyScrolls && !isAutoActive && (
                    <div className="flex flex-col gap-1 items-end">
                      <button 
                        onClick={() => activateAutoScroll(view)} 
                        className="flex items-center gap-1.5 md:gap-3 bg-cyan-600 border-[2px] md:border-[3px] border-black px-2 md:px-5 py-1 md:py-2.5 rounded hover:bg-cyan-500 transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 group"
                      >
                        <MousePointer size={10} className="md:w-5 md:h-5 text-black group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col items-start bg-transparent leading-none">
                          <span className="text-[6px] md:text-[8px] font-black uppercase text-black/70 italic">
                             {
                               player.selectedScrollId === 'auto_scroll' ? '1M AUTO' :
                               player.selectedScrollId === 'auto_scroll_3m' ? '3M AUTO' :
                               player.selectedScrollId === 'auto_scroll_6m' ? '6M AUTO' :
                               player.selectedScrollId === 'auto_scroll_9m' ? '9M AUTO' :
                               player.selectedScrollId === 'auto_scroll_12m' ? '12M AUTO' : 'LINK'
                             }
                          </span>
                          <span className="text-[10px] md:text-sm font-black text-black italic">{currentScrollCount}</span>
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
                <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-400 border-[3px] border-black text-black rounded font-black text-[9px] md:text-xs animate-pulse shadow-[3px_3px_0_rgba(0,0,0,1)] transform rotate-1">
                  <MousePointer size={12} className="animate-bounce" /> {autoTimeLeft}s
                </div>
            )}
        </div>
      </div>


      {/* --- BATTLE ARENA --- */}
      <div className="w-full flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-3 lg:gap-12 items-center px-2 md:px-12 py-1 md:py-6 relative z-40">
        
        {/* VS CENTRAL BADGE (ABSOLUTE OVERLAY) - Hidden on mobile */}
        <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
           <div className="w-24 h-24 bg-yellow-400 border-[8px] border-black rounded-full shadow-[10px_10px_0_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-12 animate-kapow">
              <span className="text-black font-black text-4xl italic tracking-tighter drop-shadow-[2px_2px_0_#fff]">VS</span>
           </div>
        </div>

        {/* BOSS PANEL (LEFT) */}
        <div className={`flex flex-col items-center gap-1.5 md:gap-6 transition-all duration-300 ${strikingSide === 'monster' ? 'animate-strike-right' : ''}`}>
           <div className="relative group">
              {currentTaunt && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-[100] animate-in zoom-in slide-in-from-bottom-6 duration-300">
                  <div className="relative bg-black border-[3px] md:border-[4px] border-red-600 px-4 py-2 md:px-6 md:py-3 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] min-w-[100px] md:min-w-[140px] max-w-[200px] md:max-w-[220px]">
                    <p className="text-[10px] md:text-[12px] font-black uppercase text-red-500 italic text-center leading-tight tracking-tight drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                      {currentTaunt}
                    </p>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 md:w-6 md:h-6 bg-black border-r-[4px] border-b-[4px] border-red-600 rotate-45 transform"></div>
                  </div>
                </div>
              )}

              <div className={`w-36 h-36 sm:w-44 sm:h-44 md:w-64 md:h-64 bg-slate-950 flex items-center justify-center border-[6px] md:border-[8px] border-black shadow-[8px_8px_0_rgba(239,68,68,0.3)] md:shadow-[12px_12px_0_rgba(239,68,68,0.3)] overflow-hidden relative transform -rotate-3 ${enemyFlinch || impactSplash ? 'animate-flinch' : 'animate-float'}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#450a0a_0%,transparent_80%)] opacity-60 z-20"></div>
                  <BossAvatarMedia bossIdx={bossAvatarIdx} animated={showBossVideo && player.avatarAnimated} className="w-full h-full object-cover relative z-10 contrast-125 brightness-75 drop-shadow-[0_0_30px_rgba(239,68,68,0.2)]" BOSS_MEDIA_FILES={BOSS_MEDIA_FILES} />
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowBossVideo(!showBossVideo); }}
                    className="absolute bottom-1 right-1 md:bottom-2 md:right-2 z-30 bg-black/90 p-1 md:p-2 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
                  >
                    {showBossVideo ? <Wind size={14} className="md:w-4 md:h-4" /> : <Zap size={14} className="md:w-4 md:h-4" />}
                  </button>
                  
                  <BossImpactSplash splash={impactSplash} />
              </div>
           </div>

            <div className="w-full max-w-[280px] md:max-w-[320px] space-y-2 md:space-y-4">
                <div className="bg-red-600 text-white px-4 py-1.5 md:px-6 md:py-2 border-[4px] md:border-[5px] border-black transform rotate-2 shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] relative">
                    <h2 className="text-sm md:text-3xl font-black uppercase tracking-tighter italic leading-none drop-shadow-md">{BOSS.name}</h2>
                    <div className="absolute -top-4 -right-2 md:-top-6 md:-right-4 bg-black text-white px-2 py-1 md:px-3 md:py-1.5 text-[8px] md:text-xs font-black border-2 md:border-4 border-white rotate-12 shadow-xl">LVL {BOSS.level}</div>
                </div>
                
                <div className="w-full h-4 md:h-8 bg-black border-[3px] md:border-[5px] border-black p-0.5 relative shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden flex items-center">
                    <div className="h-full bg-gradient-to-r from-red-800 via-red-500 to-red-400 transition-all duration-300 relative" style={{ width: `100%` }}>
                        <div className="absolute inset-0 comic-halftone opacity-30 pointer-events-none text-black"></div>
                        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-[7px] md:text-xs font-black text-white uppercase italic drop-shadow-[1px_1px_1px_rgba(0,0,0,1)] tracking-widest">
                         IMMORTAL ENTITY
                       </span>
                    </div>
                </div>

                <div className="flex flex-col items-center p-1.5 md:p-3 bg-black/60 border-2 md:border-4 border-black transform -rotate-1 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                   <p className="text-[7px] md:text-[10px] font-black text-red-500 uppercase italic opacity-70 mb-0.5 md:mb-1">Damage Record</p>
                   <p className="text-xl md:text-4xl font-black text-white italic drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">{Math.floor(player.totalBossDamage || 0).toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* PLAYER PANEL (RIGHT) */}
        <div className={`flex flex-col lg:items-end items-center gap-1.5 md:gap-6 transition-all duration-300 ${strikingSide === 'player' ? 'animate-strike-left' : ''}`}>
           <div className="relative group">
              {playerTaunt && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-[60] animate-in zoom-in slide-in-from-bottom-6 duration-300">
                  <div className="relative bg-cyan-600 border-[3px] md:border-[4px] border-black px-4 py-2 md:px-6 md:py-3 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] min-w-[100px] md:min-w-[140px] max-w-[200px] md:max-w-[220px]">
                    <p className="text-[10px] md:text-[12px] font-black uppercase text-white italic text-center leading-tight tracking-tight drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">
                      {playerTaunt}
                    </p>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 md:w-6 md:h-6 bg-cyan-600 border-r-[4px] border-b-[4px] border-black rotate-45 transform"></div>
                  </div>
                </div>
              )}

              {combat.lastLoot && (
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-[70] animate-bounce">
                  <div className="bg-yellow-400 border-[4px] md:border-[5px] border-black p-2 md:p-3 flex flex-col items-center shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] transform rotate-12">
                     <div className="absolute inset-0 comic-halftone opacity-20 text-white"></div>
                    <span className="text-2xl md:text-4xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">{combat.lastLoot.icon}</span>
                    <span className="text-[8px] md:text-[10px] font-black uppercase text-black italic tracking-tighter mt-0.5 md:mt-1 whitespace-nowrap">FOUND: {combat.lastLoot.name}!</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 md:gap-8">
                <div className={`w-36 h-36 sm:w-44 sm:h-44 md:w-64 md:h-64 bg-slate-950 flex items-center justify-center border-[6px] md:border-[8px] border-black shadow-[6px_6px_0_rgba(8,145,178,0.3)] md:shadow-[12px_12px_0_rgba(8,145,178,0.3)] overflow-hidden relative transform rotate-3 ${strikingSide === 'monster' && playerImpactSplash ? 'animate-flinch' : 'animate-float'}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#064e3b_0%,transparent_80%)] opacity-50 z-20"></div>
                    <div className="absolute inset-0 opacity-20 comic-halftone text-cyan-500 z-10 pointer-events-none"></div>
                    {player.avatar && (
                      <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover relative z-10 contrast-125" />
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
                    <div className="bg-cyan-600 text-white px-4 py-1.5 md:px-5 md:py-2 border-[4px] md:border-[5px] border-black transform -rotate-2 shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col items-end relative">
                        <span className="text-[7px] md:text-[8px] font-black uppercase opacity-70 tracking-widest italic leading-none mb-0.5 md:mb-1">Hunter</span>
                        <h2 className="text-xs md:text-3xl font-black uppercase tracking-tighter italic leading-none truncate max-w-[120px] md:max-w-none">{player.name}</h2>
                        <div className="absolute -top-3 -left-2 md:-top-6 md:-left-4 bg-black text-cyan-400 px-1.5 py-0.5 md:px-3 md:py-1.5 text-[7px] md:text-xs font-black border-2 md:border-4 border-cyan-400 rotate-12 shadow-xl">RANK: S</div>
                    </div>
                  </div>
                </div>
                
                <div className="w-full group">
                   <div className="flex justify-between items-center mb-0.5 px-1 flex-row-reverse">
                      <span className="text-[8px] md:text-[10px] font-black text-cyan-500 uppercase italic">Biological Core</span>
                      <span className="text-[8px] md:text-[10px] font-black text-white italic">{Math.floor(player.hp)}/{Math.floor(player.maxHp)}</span>
                   </div>
                   <div className="w-full h-4 md:h-8 bg-black border-[3px] md:border-[5px] border-black p-0.5 relative shadow-[-4px_4px_0_rgba(0,0,0,1)] md:shadow-[-6px_6px_0_rgba(0,0,0,1)] transition-all overflow-hidden flex items-center">
                      <div className="h-full bg-gradient-to-r from-cyan-800 via-cyan-500 to-cyan-400 transition-all duration-300 relative ml-auto" style={{ width: `${(player.hp / player.maxHp) * 100}%` }}>
                         <div className="absolute inset-0 comic-halftone opacity-30 pointer-events-none text-black"></div>
                         <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                      </div>
                   </div>
                </div>
            </div>
        </div>
      </div>


      {/* --- HUD BOTTOM --- */}
      <div className="w-full max-w-xl space-y-2 md:space-y-4 z-50 px-4 mb-2 md:mb-0">
        <div className="flex gap-2 md:gap-4 relative">
          {isStunned && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md border-[3px] md:border-4 border-red-600 z-50 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.4)] transform scale-105">
              <div className="flex items-center gap-2 md:gap-4 animate-pulse">
                <Skull size={20} className="md:w-8 md:h-8 text-red-500" />
                <p className="font-black text-xs md:text-2xl uppercase italic drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] text-center">SYSTEM STUNNED! {Math.ceil(stunTimeLeft)}s</p>
              </div>
            </div>
          )}

          {isMissed && !isStunned && (
            <div className="absolute inset-0 bg-slate-500/90 backdrop-blur-md border-[3px] md:border-4 border-black z-50 flex items-center justify-center shadow-lg transform scale-105">
               <p className="font-black text-xs md:text-2xl uppercase italic text-black tracking-widest text-center">ATTACK DEFLECTED!</p>
            </div>
          )}

          <button 
            onClick={() => combat.handleAttack(true)} 
            disabled={isStunned || isMissed || combat.combatBusRef.current} 
            className={`flex-1 py-3 md:py-4 rounded-xl font-black text-lg md:text-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] border-[3px] md:border-[4px] border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-y-1 italic flex flex-col items-center justify-center gap-0 leading-tight ${(isStunned || isMissed || combat.combatBusRef.current) ? 'opacity-30 grayscale' : 'bg-red-600 text-white'} relative overflow-hidden group`}
          >
            <span className="relative z-10 text-base md:text-xl">OVERLOAD</span>
            <span className="text-[6px] md:text-[8px] opacity-70 tracking-[0.2em] uppercase relative z-10 font-black">Core Strike Phase</span>
          </button>
          
          <button 
            onClick={() => setShowRetreatConfirm(true)} 
            className={`px-4 md:px-8 py-3 md:py-4 rounded-xl font-black uppercase text-xs md:text-lg tracking-widest border-[3px] md:border-[4px] border-black transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic bg-slate-300 text-black hover:bg-white`}
          >
            RETREAT
          </button>
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
      </div>

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
    </div>
  );
};
