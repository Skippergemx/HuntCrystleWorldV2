import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Sparkles, Check } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const TavernView = () => {
  const { player, TAVERN_MATES, actions, adventure, openGuide } = useGame();
  const { setView } = adventure;
  const { hireMate, dismissMate } = actions;

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_tavern_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Hero for Hire",
      npc: 1,
      visualType: 'recruitment',
      text: "Welcome to the Tavern! Here you can recruit powerful Tavern Mates to help you conquer the treacherous Dungeons.",
      hint: "Tip: Mates offer passive battle boosts."
    },
    {
      title: "Stat Focus",
      npc: 2,
      visualType: 'stats',
      text: "Each Tavern Mate specializes in boosting a specific stat, such as Agility, Strength, or Health. Choose the companion that best compliments your playstyle!",
      hint: "Strategy: Match stats with your dungeon approach."
    },
    {
      title: "Broken Contracts",
      npc: 5,
      visualType: 'contract',
      text: "Beware! If your strength fails you and you are defeated in the dungeon, your Tavern Mate's contract will break. However, a safe tactical retreat will keep your contract perfectly intact.",
      hint: "Warning: Protect your Mates from defeat!"
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_tavern_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 relative overflow-y-auto bg-slate-950 custom-scrollbar">
      {/* Visual Character: Warm Safe Haven Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 2px, transparent 1px)', backgroundSize: '16px 16px' }} />
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none" />
      
      <Header title="HERO FOR HIRE: TAVERN" onClose={adventure.goBack} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
      }} />
      
      {player.hiredMate && (
        <div className="bg-purple-950 border-2 border-purple-500 p-2 mb-2 flex items-center justify-between shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-1">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-purple-400 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Current Contract: Active</span>
          </div>
          <button 
            onClick={dismissMate}
            className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 border border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-red-500 active:shadow-none translate-y-0 active:translate-y-0.5 transition-all uppercase italic"
          >
            Terminate Contract
          </button>
        </div>
      )}

      <div className="grid gap-6 relative z-10">
        {TAVERN_MATES.map((mate, index) => {
          const rarityColor = 
            mate.rarity === 'Legendary' ? 'bg-amber-500' :
            mate.rarity === 'Epic' ? 'bg-purple-600' :
            mate.rarity === 'Rare' ? 'bg-blue-600' :
            mate.rarity === 'Uncommon' ? 'bg-emerald-500' : 'bg-slate-400';

          return (
            <div 
              key={mate.id} 
              className={`p-4 md:p-5 bg-white border-[3px] md:border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center group transition-transform hover:-translate-y-1 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
            >
              <div className="space-y-3 w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 ${rarityColor} border-2 border-black overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] group-hover:scale-110 transition-transform`}>
                     <img 
                       src={`/assets/partymemberavatar/${mate.name}.jpg`} 
                       className="w-full h-full object-cover"
                       onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + mate.name; }}
                     />
                  </div>
                  <div className="text-left min-w-0">
                    <span className={`text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 border border-black/20 text-white ${rarityColor} mb-1 inline-block italic`}>{mate.rarity}</span>
                    <h4 className="font-black text-lg md:text-3xl text-black uppercase tracking-tighter italic leading-none truncate">
                      {mate.name}
                    </h4>
                  </div>
                </div>
                <div className="bg-slate-100 p-2 md:p-3 border-2 border-black/10 text-left">
                  <p className="text-[9px] md:text-[11px] text-slate-600 font-black uppercase italic leading-tight">{mate.desc}</p>
                </div>
                {player.hiredMate === mate.id && (
                  <div className="inline-block bg-purple-600 text-white px-3 py-1 border-2 border-black font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] transform -rotate-1 shadow-md">
                    Currently Active
                  </div>
                )}
              </div>
              
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t-2 md:border-t-0 border-black/5">
                <div className="bg-slate-900 text-white px-4 py-1.5 border-2 border-black transform rotate-2 md:rotate-3 relative shadow-sm">
                   <span className="text-xs md:text-base font-black italic">{mate.cost} GX</span>
                </div>
                <button 
                   onClick={() => hireMate(mate)} 
                   disabled={player.hiredMate === mate.id}
                   className={`px-6 md:px-10 py-2.5 md:py-4 border-[3px] border-black font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${player.hiredMate === mate.id ? 'bg-purple-600 text-white border-black' : 'bg-amber-400 text-black hover:bg-amber-300'}`}
                >
                  {player.hiredMate === mate.id ? 'HIRED' : 'RECRUIT'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-cyan-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-amber-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
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
                   <div className="absolute inset-x-0 bottom-0 bg-amber-600 text-[6px] font-black text-white text-center py-0.5 uppercase italic">BARTENDER</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-amber-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-amber-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'recruitment' && (
                     <div className="text-3xl md:text-5xl drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10 animate-bounce">🍺</div>
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'stats' && (
                     <div className="text-3xl md:text-5xl drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10 animate-pulse">⚔️</div>
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'contract' && (
                     <div className="text-3xl md:text-5xl drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] z-10 animate-pulse">📜</div>
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-amber-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-amber-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-amber-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-amber-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-amber-500' : 'bg-slate-800'}`}
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
                    className="flex-[2] bg-amber-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-amber-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'READY TO RECRUIT' : 'TRANSMIT MORE'}
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
