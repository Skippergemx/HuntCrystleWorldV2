import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Map as MapIcon, 
  Swords, 
  AlertCircle, 
  Shield,
  ArrowLeft,
  Skull,
  Check,
  Sparkles,
  Clock
} from 'lucide-react';
import { NavBtn, Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const DungeonMenuView = React.memo(() => {
  const { adventure, gameLoop, syncPlayer } = useGame();
  const { setView } = adventure;
  const { penaltyRemaining, autoTimeLeft } = gameLoop;
  const isPenalized = penaltyRemaining > 0;

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_dungeon_menu_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Battle Hub Access",
      npc: 17,
      visualType: 'dungeon',
      text: "Welcome to the Battle Hub, Hunter. Here you choose your deployment zone. From standard dungeons to boss rooms, all combat starts here.",
      hint: "Tip: Keep an eye on the System Status at the bottom."
    },
    {
      title: "Combat Modes",
      npc: 11,
      visualType: 'combat',
      text: "Raiding Dungeons earns you resources, while the Boss Room offers legendary wealth. PvP and Guild Vs Guild are for those seeking total dominance.",
      hint: "Strategy: Use standard dungeons to gear up for the Boss Room."
    },
    {
      title: "Neural Penalty",
      npc: 1,
      visualType: 'penalty',
      text: "If your neural link is severed in combat, a lockout penalty will engage. You must wait for recalibration before entering any zone again.",
      hint: "Warning: Higher sector defeats result in longer recovery times."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_dungeon_menu_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  const startDungeon = () => {
    if (!isPenalized) {
      setView('map');
    }
  };

  const startBoss = () => {
    if (!isPenalized) {
      setView('boss');
      if (autoTimeLeft > 0) syncPlayer({ autoUntil: 0 });
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col relative overflow-y-auto custom-scrollbar bg-slate-950">
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      
      <Header title="BATTLE_HUB: ACCESS NODES" onClose={() => setView('menu')} onHelp={() => setShowTutorial(true)} />

      <div className="grid grid-cols-2 gap-4 md:gap-6 relative z-10">
        <NavBtn 
          onClick={startDungeon} 
          icon={isPenalized ? <Skull className="animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" /> : <MapIcon />} 
          title="Dungeons" 
          sub={isPenalized ? (
            <div className="flex flex-col items-center gap-2 mt-2 animate-in fade-in duration-500">
               <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-lg border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  <Clock size={12} className="text-white animate-spin-slow" />
                  <span className="text-xs font-black text-white tabular-nums tracking-tighter">{penaltyRemaining}S</span>
               </div>
               <div className="bg-white px-2 py-0.5 rounded border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <p className="text-[7px] font-black text-black uppercase leading-none text-center italic">NEURAL_SHOCK: SYSTEM_COOLING</p>
               </div>
            </div>
          ) : "Standard Raid"} 
          color={isPenalized ? "bg-red-950 border-red-900 shadow-[inset_0_0_20px_rgba(239,68,68,0.3)]" : "bg-cyan-600"} 
          disabled={isPenalized} 
          backdrop="/assets/monsters/Rust Canyon/Rust Cat 0-0.jpg"
        />

        <NavBtn 
          onClick={startBoss} 
          icon={isPenalized ? <AlertCircle className="text-red-500 animate-pulse" /> : <AlertCircle />} 
          title="Boss Room" 
          sub={isPenalized ? (
            <div className="flex flex-col items-center gap-2 mt-2 animate-in fade-in duration-500">
               <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-lg border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  <Clock size={12} className="text-white animate-spin-slow" />
                  <span className="text-xs font-black text-white tabular-nums tracking-tighter">{penaltyRemaining}S</span>
               </div>
               <div className="bg-white px-2 py-0.5 rounded border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <p className="text-[7px] font-black text-black uppercase leading-none text-center italic">RESYNCING: CRITICAL_DAMPENING</p>
               </div>
            </div>
          ) : "Boss Conquest"} 
          color={isPenalized ? "bg-red-950 border-red-900 shadow-[inset_0_0_20px_rgba(239,68,68,0.3)]" : "bg-red-700"} 
          disabled={isPenalized} 
          backdrop="/assets/monsters/Void Sector 7/Void Wraith.jpg"
        />

        <NavBtn 
          onClick={() => setView('pvp')} 
          icon={<Swords />} 
          title="PvP Room" 
          sub="Holo-Grid Combat" 
          color="bg-red-900 border-red-500/50" 
          backdrop="/assets/monsters/Gale Empire/Vortex Vanguard.jpg"
        />

        <NavBtn 
          onClick={() => setView('syndicate')} 
          icon={<Shield />} 
          title="Guild Vs Guild" 
          sub="Alliance Conquest" 
          color="bg-red-900 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]" 
          backdrop="/assets/monsters/Abyssal Trench/Benthic Behemoth.jpg" 
        />
      </div>

      <div className={`mt-8 border-2 p-4 rounded-2xl relative overflow-hidden transition-all duration-500 ${isPenalized ? 'bg-red-950/20 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-black/40 border-white/5'}`}>
        <div className={`absolute top-0 right-0 p-1 text-white text-[8px] font-black uppercase italic ${isPenalized ? 'bg-red-600' : 'bg-slate-800'}`}>
          {isPenalized ? "NEURAL_LINK_LOCKDOWN" : "SYSTEM_STATUS"}
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className={`p-3 rounded-xl border-2 transition-all duration-500 ${isPenalized ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/20 border-emerald-500'} text-white`}>
            {isPenalized ? <Skull size={24} /> : <AlertCircle size={24} className="rotate-180" />}
          </div>
          <div>
            <h3 className={`text-sm font-black italic uppercase tracking-tighter ${isPenalized ? 'text-red-500' : 'text-white'}`}>
              {isPenalized ? "NEURAL_SHOCK_PROTECTION" : "ALL_SYSTEMS_OPTIMAL"}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
              {isPenalized ? "Safety protocol engaged. Combat modules cooling down." : "Neural link stable. Combat modules ready for deployment."}
            </p>
          </div>
        </div>
      </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            <div className="absolute inset-x-0 top-0 bottom-0 bg-red-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 mt-1 mb-1 pointer-events-none"></div>
            <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-red-600 py-2 border-b-[3px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl font-black text-white text-center uppercase tracking-tighter italic">{tutorialSteps[tutorialStep].title}</h2>
                <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">Step {tutorialStep + 1} / {tutorialSteps.length}</div>
              </div>

              {/* NPC & Visual */}
              <div className="py-3 relative flex justify-center items-center gap-3 w-full z-10">
                <div className="w-16 h-28 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0">
                  <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-x-0 bottom-0 bg-red-600 text-[6px] font-black text-white text-center py-0.5 uppercase italic">COMMANDER</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" />
                  <div className="w-[1px] h-3 bg-gradient-to-b from-red-400 to-transparent" />
                </div>
                <div className="w-16 h-16 rounded-xl border-[3px] border-black bg-slate-950 flex items-center justify-center shrink-0">
                  {tutorialSteps[tutorialStep].visualType === 'dungeon' && <MapIcon className="text-cyan-400 animate-pulse" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'combat' && <Swords className="text-emerald-400 animate-bounce" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'penalty' && <Shield className="text-amber-400 animate-pulse" size={36} />}
                </div>
              </div>

              {/* Dialogue */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col">
                <div className="bg-white text-black p-3 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <div className="absolute -top-3 -left-1 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic">Incoming Transmission</div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase leading-[1.3] tracking-tight italic">"{tutorialSteps[tutorialStep].text}"</p>
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>
                <div className="bg-black/60 p-1.5 rounded-lg border border-red-500/30 mb-3">
                  <p className="text-[8px] font-black text-red-400 uppercase italic tracking-widest text-center">⚡ {tutorialSteps[tutorialStep].hint}</p>
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <button onClick={() => setDontShowAgain(!dontShowAgain)} className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-red-600' : 'bg-slate-800'}`}>
                    {dontShowAgain && <Check size={10} className="text-white" />}
                  </button>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>Don't show this briefing again</span>
                </div>
                <div className="flex gap-2 pb-1">
                  {tutorialStep > 0 && (
                    <button onClick={() => setTutorialStep(prev => prev - 1)} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] italic text-[9px]">BACK</button>
                  )}
                  <button onClick={nextStep} className="flex-[2] bg-red-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-red-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] italic text-[10px] flex items-center justify-center gap-1.5">
                    {tutorialStep === tutorialSteps.length - 1 ? 'START OPERATIONS' : 'TRANSMIT MORE'}
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
});
