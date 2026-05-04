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
  Clock,
  Zap,
  Target
} from 'lucide-react';
import { NavBtn, Header, AvatarMedia, CitizenMedia } from './GameUI';
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
      text: "Raiding Dungeons earns you resources, while the Boss Room offers legendary wealth. The PvP Arena is now live — enter the Neon Grid for real-time combat.",
      hint: "Strategy: Focus on Dungeons and Bosses for Sector 7 growth."
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

  const deploymentNodes = [
    {
      id: 'map',
      name: 'DUNGEONS',
      sub: 'STANDARD RAID',
      icon: <MapIcon size={24} />,
      color: 'bg-cyan-600',
      npc: 8,
      status: isPenalized ? 'LOCKED' : 'READY',
      action: () => !isPenalized && setView('map')
    },
    {
      id: 'boss',
      name: 'BOSS ROOM',
      sub: 'BOSS CONQUEST',
      icon: <AlertCircle size={24} />,
      color: 'bg-red-600',
      npc: 15,
      status: isPenalized ? 'LOCKED' : 'EPIC',
      action: () => {
        if (!isPenalized) {
          setView('boss');
          if (autoTimeLeft > 0) syncPlayer({ autoUntil: 0 });
        }
      }
    },
    {
      id: 'pvp',
      name: 'PVP ARENA',
      sub: 'P2P COMBAT',
      icon: <Swords size={24} />,
      color: 'bg-purple-600',
      npc: 16,
      status: isPenalized ? 'LOCKED' : 'LIVE',
      action: () => !isPenalized && setView('pvp')
    },
    {
      id: 'gvg',
      name: 'GUILD WAR',
      sub: 'FACTION OPS',
      icon: <Shield size={24} />,
      color: 'bg-slate-800',
      npc: 10,
      status: 'MAINTENANCE',
      disabled: true,
      action: () => {}
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 bg-[#020617] overflow-y-auto no-scrollbar relative font-black italic">
      {/* Red Pulse Overlay if Penalized */}
      {isPenalized && (
        <div className="fixed inset-0 bg-red-950/20 animate-pulse pointer-events-none z-50" />
      )}

      <Header title="BATTLE_HUB: DEPLOYMENT" onClose={() => setView('menu')} npcNum={13} onHelp={() => setShowTutorial(true)} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-10 z-10 py-4 relative">
        <div className="text-center space-y-3 transform -rotate-1">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg border-2 border-black rotate-12 shadow-[3px_3px_0_rgba(0,0,0,1)]">
               <Skull className="text-white animate-pulse" size={24} />
            </div>
            <h2 className="text-4xl md:text-7xl font-[1000] text-white uppercase italic tracking-tighter drop-shadow-[6px_6px_0_rgba(0,0,0,1)]">Combat Hub</h2>
          </div>
          <div className="flex flex-col items-center">
             <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.4em] bg-black border-2 px-6 py-1.5 rounded-sm italic shadow-lg ${isPenalized ? 'border-red-500 text-red-500 animate-pulse' : 'border-cyan-500/40 text-cyan-400'}`}>
                {isPenalized ? `NEURAL_LOCKDOWN // ${penaltyRemaining}S REMAINING` : 'Sector 7 Combat Grid // Live'}
             </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-6xl px-4">
          {deploymentNodes.map((node, idx) => (
            <button
              key={node.id}
              onClick={node.action}
              disabled={node.disabled || isPenalized}
              className={`group relative aspect-[9/16] flex flex-col items-center rounded-2xl border-[4px] border-black bg-slate-900 transition-all duration-300 ${!node.disabled && !isPenalized ? 'hover:-translate-y-2 hover:shadow-[12px_12px_0_rgba(0,0,0,1)] shadow-[6px_6px_0_rgba(1,1,1,1)]' : 'opacity-80 grayscale cursor-not-allowed'} overflow-hidden ${idx % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
            >
               {/* CHARACTER BACKGROUND */}
               <div className="absolute inset-0 z-0">
                  <CitizenMedia num={node.npc} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                  <div className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/40 to-transparent`} />
               </div>

               {/* UI OVERLAY */}
               <div className="mt-auto w-full p-2.5 pb-4 z-10 flex flex-col items-center gap-2">
                  <div className={`${node.color} p-2.5 rounded-xl border-[2px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] transform -rotate-6 group-hover:rotate-0 transition-transform relative`}>
                    {node.icon}
                    {isPenalized && !node.disabled && (
                      <div className="absolute -top-3 -right-3 bg-red-600 border-2 border-black p-1 rounded-full animate-spin-slow">
                         <Clock size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white border-[2px] border-black py-1 px-1.5 shadow-[3px_3px_0_rgba(0,0,0,1)] rotate-1 transform group-hover:rotate-0 transition-transform w-full">
                     <h3 className="text-[9px] md:text-[11px] font-[1000] text-black uppercase italic tracking-tighter leading-none text-center truncate">
                        {node.name}
                     </h3>
                  </div>

                  <div className="bg-black/80 px-2 py-0.5 rounded border border-white/20">
                     <span className="text-[7px] font-black text-white uppercase italic tracking-widest leading-none">
                        {isPenalized && !node.disabled ? `${penaltyRemaining}S LOCK` : node.status}
                     </span>
                  </div>
               </div>

               {node.disabled && (
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-black border-2 border-white/20 px-3 py-1 rounded-full rotate-12">
                       <span className="text-[10px] text-white/50 font-black italic uppercase tracking-tighter">Offline</span>
                    </div>
                 </div>
               )}
            </button>
          ))}
        </div>
      </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          {/* Reuse Tutorial UI with improved contrast */}
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
                  <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>Don't show this briefings again</span>
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
