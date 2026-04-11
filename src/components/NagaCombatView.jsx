import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, X, Skull, Shield, Swords, Target, Crosshair, Zap, Rocket, Flame, MoveUp, Check, Sparkles } from 'lucide-react';
import { ImpactSplash } from './CombatEffects';
import { ConfirmationModal } from './GameUI';
import { useGame } from '../contexts/GameContext';
import { useNagaCombat } from '../hooks/useNagaCombat';

export const NagaCombatView = React.memo(() => {
  const { player, addLog, audio, SOUNDS, db, adventure, actions, gvgContext } = useGame();
  const { setView } = adventure;

  const nagaCombat = useNagaCombat(
    db,
    player,
    gvgContext,
    addLog,
    audio.playSFX,
    SOUNDS,
    setView,
    audio.triggerHaptic,
    actions.recordWarResult
  );

  const {
    combatState, myNaga, enemyNaga, critAlert,
    impactSplash, playerImpactSplash, strikingSide, currentTaunt, playerTaunt,
    showDefeatedWindow, showVictoryWindow, handleAttack, handleRetreat,
    resonanceScale, isResonating, rageMeter, comboCount, perfectTiming, triggerUltimate, momentum
  } = nagaCombat;

  const [showRetreatConfirm, setShowRetreatConfirm] = React.useState(false);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_naga_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Naga Resonance",
      visualType: 'attack',
      text: "Tap the Gem Core to channel Primal Resonance energy into your Naga. Time your taps with the resonance ring for maximum damage output!",
      hint: "Tip: A glowing ring means the timing window is open."
    },
    {
      title: "Combo System",
      visualType: 'combo',
      text: "Hit the ring at the perfect moment to build your Combo Counter! High combos multiply damage. The Rage Meter fills as you land strikes.",
      hint: "Strategy: Aim for 5+ combo chains for massive damage."
    },
    {
      title: "Dragon Blast",
      visualType: 'ultimate',
      text: "When your Rage Meter hits 100%, the DRAGON BLAST button activates. Trigger it for a devastating burst of primal energy against the enemy!",
      hint: "Warning: Do not retreat — it ends the raid immediately!"
    }
  ];

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_naga_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  if (combatState === 'LOADING' || !myNaga || !enemyNaga) {
     return <div className="flex-1 flex items-center justify-center bg-slate-950 font-black text-white italic uppercase animate-pulse text-sm">Synchronizing Primal Resonance...</div>;
  }

  return (
    <div className={`flex-1 p-2 md:p-4 flex flex-col items-center justify-between gap-1 md:gap-2 animate-in fade-in relative overflow-hidden bg-slate-950`}>
      {/* BACKGROUND DEPTH */}
      <div className="absolute inset-0 z-0">
        <img src="/assets/dungeonsground/Backdrop_Void.jpg" className="w-full h-full object-cover opacity-30 grayscale" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black"></div>
        <div className="absolute inset-0 comic-halftone opacity-10 text-cyan-500 pointer-events-none"></div>
        {perfectTiming && <div className="absolute inset-0 bg-white/5 animate-pulse"></div>}
      </div>

      {/* --- HUD TOP: CONSOLIDATED MISSION COMMAND ARRAY --- */}
      <div className="w-full z-50 px-2 md:px-6 pt-2 md:pt-4 flex flex-row items-center justify-between gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-2">
        
        {/* 1. MISSION BRIEFING (LEFT ALIGNED) */}
        <button
          onClick={() => {
            setTutorialStep(0);
            setShowTutorial(true);
          }}
          className="p-1.5 md:p-3 bg-black border-[2px] border-cyan-500 text-cyan-500 shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-white transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shrink-0"
        >
          <HelpCircle size={14} className="md:w-6 md:h-6" strokeWidth={4} />
        </button>

        {/* 2. CONSOLIDATED SYNC & MOMENTUM PROGRESS */}
        <div className="flex items-center gap-3 md:gap-6 px-3 md:px-6 py-2 md:py-3 bg-black border-2 border-cyan-500/50 shadow-xl backdrop-blur-md transform -skew-x-12 flex-1 max-w-lg">
          <div className="flex items-center gap-2 shrink-0 border-r border-cyan-500/30 pr-3 md:pr-6">
            <Activity size={10} className="text-cyan-400 animate-pulse" />
            <span className="text-[7px] md:text-[10px] font-black text-cyan-400 uppercase tracking-widest italic whitespace-nowrap">Link_Sync</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between items-center px-0.5">
              <span className="text-[6px] md:text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">Momentum</span>
              <span className="text-[8px] md:text-xs font-black text-cyan-400 italic font-mono leading-none">{momentum}%</span>
            </div>
            <div className="h-1.5 md:h-2.5 w-full bg-slate-900 border border-black p-[1px]">
               <div className={`h-full transition-all duration-1000 ${momentum >= 100 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse' : 'bg-cyan-600'}`} style={{ width: `${Math.min(100, momentum)}%` }}></div>
            </div>
          </div>
        </div>

        {/* 3. EXTRACTION ACTION (RIGHT ALIGNED) */}
        <button
          onClick={() => setShowRetreatConfirm(true)}
          className="p-1.5 md:p-3 bg-red-600 border-[2px] border-black text-white shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shrink-0"
        >
          <X size={14} className="md:w-6 md:h-6" strokeWidth={4} />
        </button>
      </div>


      {/* --- BATTLE ARENA: HORIZONTAL SYMMETRY --- */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col relative z-40 px-2 md:px-12 py-2">
         
         {/* ENGAGEMENT ZONE (ENEMY | ENGINE | PLAYER) */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 items-center mb-4 md:mb-8">
            
            {/* ENEMY NAGA */}
            <div className={`flex flex-col items-center lg:items-end transition-all duration-300 ${strikingSide === 'monster' ? 'animate-strike-right' : ''}`}>
               <div className="relative group">
                  <div className="absolute -top-6 -left-2 bg-red-600 border-2 border-black px-3 py-0.5 text-[8px] md:text-[10px] font-black text-black uppercase italic transform -rotate-3 z-30 shadow-lg">TARGET_UPLINK</div>
                  <div className={`w-36 h-36 md:w-64 md:h-64 bg-slate-900 border-[6px] md:border-[8px] border-black shadow-[10px_10px_0_rgba(220,38,38,0.3)] overflow-hidden relative transform -rotate-2 ${impactSplash ? 'animate-flinch' : 'animate-float'}`}>
                     <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent z-10"></div>
                     <img 
                        src={enemyNaga.dragonAvatar || '/assets/dragonsground/dragons/DragonAvatar (1).jpg'} 
                        alt="Enemy" 
                        className={`w-full h-full object-cover ${enemyNaga.element === 'Pyro' ? 'hue-rotate-[340deg] saturate-200' : enemyNaga.element === 'Hydro' ? 'hue-rotate-[180deg]' : enemyNaga.element === 'Earthen' ? 'hue-rotate-[90deg] saturate-150' : enemyNaga.element === 'Gale' ? 'hue-rotate-[220deg] brightness-125' : ''}`}
                     />
                     <div className="absolute top-2 right-2 w-10 h-10 md:w-16 md:h-16 bg-black border-[3px] border-red-600 shadow-xl z-20 overflow-hidden transform rotate-6">
                        <img src={`/assets/dragonsground/gemx/${enemyNaga.gemxAvatar}`} className="w-full h-full object-cover" alt="Gemx" />
                     </div>

                     {/* RECTANGULAR TAUNT OVERLAY (ENEMY NAGA) */}
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
                           if (!isStriking && enemyNaga.currentHp > 0) {
                              handleAttack();
                           }
                        }}
                        className={`absolute top-1 left-1 z-40 bg-red-600 border-2 border-white rounded md:rounded-lg p-1 md:p-1.5 flex flex-col items-center transition-all hover:bg-white hover:border-red-600 group shadow-[2px_2px_0_rgba(0,0,0,1)] active:scale-95 ${enemyNaga.currentHp <= 0 ? 'opacity-0' : 'opacity-100'}`}
                     >
                        <span className="text-sm md:text-2xl group-hover:animate-bounce">⚔️</span>
                        <span className="text-[5px] md:text-[8px] font-black text-white group-hover:text-red-600 uppercase italic tracking-tighter leading-none mt-0.5">STRIKE</span>
                     </button>

                     {enemyNaga.currentHp <= 0 && <div className="absolute inset-0 bg-red-950/90 flex items-center justify-center backdrop-blur-md z-30 animate-pulse"><Skull size={48} className="text-red-500" /></div>}
                     <ImpactSplash splash={impactSplash} />
                  </div>
               </div>
            </div>

            {/* RESONANCE ENGINE (CENTER) */}
            <div className="flex items-center justify-center order-first lg:order-none">
               <div className="relative flex items-center justify-center">
                  <button 
                     onClick={handleAttack}
                     className={`w-24 h-24 md:w-44 md:h-44 rounded-full relative group outline-none active:scale-95 transition-all
                        ${isResonating ? 'scale-110' : 'scale-100'}
                     `}
                  >
                     <div 
                        className={`absolute inset-0 rounded-full border-4 transition-transform duration-50
                           ${perfectTiming ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]' : 'border-white/20'}
                        `}
                        style={{ transform: `scale(${resonanceScale})` }}
                     />
                     
                     <div className={`absolute inset-2 rounded-full overflow-hidden border-[4px] border-black shadow-2xl bg-black flex items-center justify-center
                        ${perfectTiming ? 'animate-pulse ring-4 ring-amber-400' : ''}
                     `}>
                        <img src={`/assets/dragonsground/gemx/${myNaga.gemxAvatar}`} className="w-full h-full object-cover scale-150 animate-slow-spin" alt="Core" />
                        <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/60"></div>
                     </div>

                     {comboCount > 0 && (
                        <div className="absolute -top-4 -right-4 bg-amber-500 text-black px-2 py-1 rounded-lg font-black text-xs md:text-lg transform rotate-12 shadow-lg animate-bounce border-2 border-black">
                           x{comboCount}
                        </div>
                     )}
                  </button>
               </div>
            </div>

            {/* PLAYER NAGA */}
            <div className={`flex flex-col items-center lg:items-start transition-all duration-300 ${strikingSide === 'player' ? 'animate-strike-left' : ''}`}>
               <div className="relative group">
                  <div className="absolute -bottom-4 -right-2 bg-cyan-600 border-2 border-black px-3 py-0.5 text-[8px] md:text-[10px] font-black text-black uppercase italic transform rotate-3 z-30 shadow-lg leading-none">ELITE_RIDER</div>
                  <div className={`w-36 h-36 md:w-64 md:h-64 bg-slate-900 border-[6px] md:border-[8px] border-black shadow-[-10px_10px_0_rgba(6,182,212,0.3)] overflow-hidden relative transform rotate-2 ${playerImpactSplash ? 'animate-flinch' : 'animate-float'}`}>
                     <div className="absolute inset-0 bg-gradient-to-bl from-cyan-600/20 to-transparent z-10"></div>
                     <img 
                        src={myNaga.dragonAvatar || '/assets/dragonsground/dragons/DragonAvatar (1).jpg'} 
                        alt="My Naga" 
                        className={`w-full h-full object-cover ${myNaga.element === 'Pyro' ? 'hue-rotate-[340deg] saturate-200' : myNaga.element === 'Hydro' ? 'hue-rotate-[180deg]' : myNaga.element === 'Earthen' ? 'hue-rotate-[90deg] saturate-150' : myNaga.element === 'Gale' ? 'hue-rotate-[220deg] brightness-125' : ''}`}
                     />
                     <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-cyan-600 text-white font-black text-[7px] md:text-[11px] italic skew-x-12 border-2 border-black shadow-lg z-20">RANK_S // LVL {myNaga.level || 1}</div>
                     
                     {/* RECTANGULAR TAUNT OVERLAY (PLAYER NAGA) */}
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

                     {myNaga.currentHp <= 0 && <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center backdrop-blur-sm z-30"><Skull size={48} className="text-red-500" /></div>}
                     <ImpactSplash splash={playerImpactSplash} />
                  </div>
               </div>
            </div>
         </div>

         {/* COMBAT INTEL TIER (HP & RAGE) */}
         <div className="grid grid-cols-2 gap-4 md:gap-12 items-start mb-8">
            {/* ENEMY STATUS */}
            <div className="w-full flex flex-col items-center lg:items-end">
               <div className="w-full max-w-[280px] md:max-w-sm">
                  <div className="flex justify-between items-end mb-1">
                     <span className="text-[7px] md:text-[10px] font-black text-red-500 uppercase italic leading-none">{enemyNaga.name}</span>
                     <span className="text-[8px] md:text-[12px] font-black text-white font-mono italic">CORE_{Math.max(0, enemyNaga.currentHp)}</span>
                  </div>
                  <div className="h-4 md:h-8 bg-black border-[3px] border-black p-0.5 relative shadow-[4px_4px_0_rgba(0,0,0,1)]">
                     <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300 relative" style={{ width: `${Math.max(0, (enemyNaga.currentHp / enemyNaga.stats.totalMaxHp) * 100)}%` }}>
                        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                     </div>
                     <div className="absolute inset-0 comic-halftone opacity-20 text-black"></div>
                  </div>
               </div>
            </div>

            {/* PLAYER STATUS */}
            <div className="w-full flex flex-col items-center lg:items-start space-y-3">
               <div className="w-full max-w-[280px] md:max-w-sm">
                  <div className="flex justify-between items-end mb-1">
                     <span className="text-[7px] md:text-[10px] font-black text-cyan-400 uppercase italic leading-none">ARMOR_CORE STATUS</span>
                     <span className="text-[8px] md:text-[12px] font-black text-white font-mono italic">HP_{Math.max(0, myNaga.currentHp)}</span>
                  </div>
                  <div className="h-4 md:h-8 bg-black border-[3px] border-black p-0.5 relative shadow-[-4px_4px_0_rgba(0,0,0,1)]">
                     <div className="h-full bg-gradient-to-r from-cyan-900 to-cyan-500 transition-all duration-300 relative ml-auto" style={{ width: `${Math.max(0, (myNaga.currentHp / myNaga.stats.totalMaxHp) * 100)}%` }}>
                        <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                     </div>
                     <div className="absolute inset-0 comic-halftone opacity-20 text-black pointer-events-none"></div>
                  </div>
               </div>

               {/* RAGE / ULTIMATE BUTTON */}
               <div className="w-full max-w-[280px] md:max-w-sm">
                 <div className="h-8 md:h-14 bg-black border-[4px] border-black relative shadow-[-6px_6px_0_rgba(0,0,0,1)] overflow-hidden transform rotate-1">
                   <div 
                      className={`h-full transition-all duration-300 ${rageMeter >= 100 ? 'bg-amber-400 animate-pulse' : 'bg-slate-800'}`} 
                      style={{ width: `${rageMeter}%` }}
                   >
                     <div className="absolute inset-0 comic-halftone opacity-30 text-black"></div>
                   </div>
                   {rageMeter >= 100 ? (
                      <button 
                         onClick={triggerUltimate}
                         className="absolute inset-0 w-full h-full flex items-center justify-center gap-2 md:gap-4 bg-amber-400 text-black font-black uppercase italic hover:bg-white transition-all animate-in zoom-in group"
                      >
                         <Flame size={16} fill="black" className="md:w-6 md:h-6 group-hover:scale-125 transition-transform" />
                         <span className="text-xs md:text-2xl tracking-tighter drop-shadow-sm italic">DRAGON BLAST</span>
                         <Sparkles size={14} className="md:w-5 md:h-5 animate-spin-slow" />
                      </button>
                   ) : (
                      <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <span className="text-[7px] md:text-[11px] font-black text-white/50 uppercase italic tracking-[0.4em] drop-shadow-md">RESONANCE_CHARGE: {rageMeter}%</span>
                      </div>
                   )}
                 </div>
               </div>
            </div>
         </div>
      </div>

      {/* FOOTER REMOVED - CONTROLS MIGRATED TO HUD TOP */}

       {showRetreatConfirm && (
        <ConfirmationModal 
          isOpen={true}
          title="TACTICAL RETREAT?"
          message="Retreating will end the raid immediately without securing your progress. Are you sure, operative?"
          onConfirm={handleRetreat}
          onClose={() => setShowRetreatConfirm(false)}
          confirmText="Yes, Retreat"
        />
      )}

      {showVictoryWindow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in zoom-in duration-500">
           <div className="bg-amber-400 border-[8px] border-black p-8 md:p-12 rotate-[-4deg] shadow-[15px_15px_0_rgba(0,0,0,1)] text-center max-w-[90%] md:max-w-md">
              <h2 className="text-4xl md:text-7xl font-black text-black uppercase italic italic-shadow-white leading-none mb-4">VICTORY</h2>
              <p className="text-black font-black uppercase text-xs md:text-sm italic tracking-widest bg-black/10 py-2">Rival Roster Compromised</p>
              <div className="mt-8 flex justify-center gap-4">
                 <Rocket className="text-black animate-bounce" size={48} />
              </div>
           </div>
        </div>
      )}

      {showDefeatedWindow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-950/80 backdrop-blur-md animate-in fade-in zoom-in duration-500">
           <div className="bg-slate-900 border-[8px] border-black p-8 md:p-12 rotate-[4deg] shadow-[15px_15px_0_rgba(0,0,0,1)] text-center max-w-[90%] md:max-w-md">
              <Skull className="text-red-500 mx-auto mb-4 animate-pulse" size={64} />
              <h2 className="text-4xl md:text-7xl font-black text-white uppercase italic leading-none mb-4">DEFEATED</h2>
              <p className="text-red-500 font-black uppercase text-xs md:text-sm italic tracking-widest border-2 border-red-500 py-2">Armor Core Destroyed</p>
           </div>
        </div>
      )}

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            <div className="absolute inset-x-0 top-0 bottom-0 bg-red-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 mt-1 mb-1 pointer-events-none"></div>
            <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
              <div className="w-full bg-red-600 py-2 border-b-[3px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl font-black text-white text-center uppercase tracking-tighter italic">{tutorialSteps[tutorialStep].title}</h2>
                <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">Step {tutorialStep + 1} / {tutorialSteps.length}</div>
              </div>
              <div className="py-3 relative flex justify-center items-center gap-3 w-full z-10">
                <div className="w-16 h-16 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-950 shrink-0 flex items-center justify-center">
                  <img src={myNaga?.dragonAvatar || '/assets/dragonsground/dragons/DragonAvatar (1).jpg'} className="w-full h-full object-cover" alt="Your Naga" />
                  <div className="absolute inset-x-0 bottom-0 bg-red-600 text-[6px] font-black text-white text-center py-0.5 uppercase italic">YOUR NAGA</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" />
                  <div className="w-[1px] h-3 bg-gradient-to-b from-red-400 to-transparent" />
                </div>
                <div className="w-16 h-16 rounded-xl border-[3px] border-black bg-slate-950 flex items-center justify-center shrink-0">
                  {tutorialSteps[tutorialStep].visualType === 'attack' && <Target className="text-red-400 animate-pulse" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'combo' && <Zap className="text-amber-400 animate-bounce" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'ultimate' && <Flame className="text-orange-400 animate-pulse" size={36} />}
                </div>
              </div>
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col">
                <div className="bg-white text-black p-3 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <div className="absolute -top-3 -left-1 bg-red-500 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic text-white">Incoming Transmission</div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase leading-[1.3] tracking-tight italic">"{tutorialSteps[tutorialStep].text}"</p>
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>
                <div className="bg-black/60 p-1.5 rounded-lg border border-red-500/30 mb-3">
                  <p className="text-[8px] font-black text-red-400 uppercase italic tracking-widest text-center">⚡ {tutorialSteps[tutorialStep].hint}</p>
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <button onClick={() => setDontShowAgain(!dontShowAgain)} className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-red-500' : 'bg-slate-800'}`}>
                    {dontShowAgain && <Check size={10} className="text-white" />}
                  </button>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>Don't show this briefing again</span>
                </div>
                <div className="flex gap-2 pb-1">
                  {tutorialStep > 0 && (
                    <button onClick={() => setTutorialStep(prev => prev - 1)} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] italic text-[9px]">BACK</button>
                  )}
                  <button onClick={nextTutorialStep} className="flex-[2] bg-red-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-red-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] italic text-[10px] flex items-center justify-center gap-1.5">
                    {tutorialStep === tutorialSteps.length - 1 ? 'ENTER BATTLE' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .bg-gradient-radial { background: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-to)); }
        .italic-shadow-white { text-shadow: 2px 2px 0 #fff, 4px 4px 0 rgba(0,0,0,0.5); }
        .animate-slow-spin { animation: spin 10s linear infinite; }
        .animate-strike-up { animation: strikeUp 0.3s cubic-bezier(.17,.67,.83,.67); }
        .animate-strike-down { animation: strikeDown 0.3s cubic-bezier(.17,.67,.83,.67); }
        
        @keyframes strikeUp {
          0% { transform: translateY(0) rotate(1deg); }
          50% { transform: translateY(-50px) scale(1.1); }
          100% { transform: translateY(0); }
        }
        @keyframes strikeDown {
          0% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(50px) scale(1.1); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});
