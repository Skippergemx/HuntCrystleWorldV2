import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Check, Swords, Map as MapIcon, Brain } from 'lucide-react';
import { AvatarMedia } from './GameUI';

const STEPS = [
  {
    title: "Welcome, Hunter",
    npc: 1,
    visualType: 'greeting',
    text: "The Crystle Grid has been waiting for a warrior like you. The Metaverse is under siege, and only the strongest Hunters can push back the darkness.",
    hint: "Your journey begins now. Every legendary Hunter started exactly where you are."
  },
  {
    title: "The Circuit",
    npc: 18,
    visualType: 'loop',
    text: "Your mission follows a sacred three-step circuit: RAID DUNGEONS to collect loot and materials, TRADE at CRYSTLE TOWN to turn materials into ETH rewards, and LEARN at iLearn to sharpen your mind for deeper runs.",
    hint: "Dungeons → Town → iLearn → Repeat. Master the loop, master the Grid."
  },
  {
    title: "Ready to Deploy",
    npc: 22,
    visualType: 'deploy',
    text: "You've been synced with the Hunter Registry. Your neural link is stable, your weapons are primed, and the Dungeons await. Stay sharp, stay hungry, and never stop pushing deeper.",
    hint: "TIP: Check your STATS & GEAR in Biometric Core before your first raid. A prepared Hunter is a victorious Hunter."
  }
];

export const WelcomeScreen = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
      <div className="relative w-full max-w-sm flex flex-col justify-center">
        {/* Offset shadow border */}
        <div className="absolute inset-x-0 top-0 bottom-0 bg-cyan-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 mt-1 mb-1 pointer-events-none"></div>
        
        <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden shadow-2xl">
          {/* Halftone pattern bg */}
          <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

          {/* Header Banner */}
          <div className="w-full bg-cyan-500 py-2 border-b-[3px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
            <h2 className="text-xl font-black text-black text-center uppercase tracking-tighter italic">{STEPS[step].title}</h2>
            <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">
              Step {step + 1} / {STEPS.length}
            </div>
          </div>

          {/* NPC Portrait & Visual Icon */}
          <div className="py-3 relative flex justify-center items-center gap-3 w-full z-10 pt-6">
            <div className="w-16 h-28 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0">
              <AvatarMedia num={STEPS[step].npc} animated={true} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-x-0 bottom-0 bg-cyan-500 text-[6px] font-black text-black text-center py-0.5 uppercase italic">
                {step === 0 ? 'COMMANDER' : step === 1 ? 'MOTHER' : 'MENTOR'}
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
              <div className="w-[1px] h-3 bg-gradient-to-b from-cyan-400 to-transparent" />
            </div>

            <div className="w-16 h-16 rounded-xl border-[3px] border-black bg-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              {STEPS[step].visualType === 'greeting' && <Sparkles className="text-cyan-400 animate-pulse" size={36} />}
              {STEPS[step].visualType === 'loop' && (
                <div className="flex items-center gap-0.5">
                  <Swords className="text-red-400" size={18} />
                  <MapIcon className="text-amber-400" size={18} />
                  <Brain className="text-blue-400" size={18} />
                </div>
              )}
              {STEPS[step].visualType === 'deploy' && <Swords className="text-red-400 animate-pulse" size={36} />}
            </div>
          </div>

          {/* Message Content */}
          <div className="px-4 pb-3 w-full relative z-10 flex flex-col">
            <div className="bg-white text-black p-3 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)]">
              <div className="absolute -top-3 -left-1 bg-cyan-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic">Incoming Transmission</div>
              <p className="text-[10px] font-bold text-slate-800 uppercase leading-[1.3] tracking-tight italic">"{STEPS[step].text}"</p>
              <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
            </div>

            <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-500/30 mb-3">
              <p className="text-[8px] font-black text-cyan-400 uppercase italic tracking-widest text-center">⚡ {STEPS[step].hint}</p>
            </div>

            {/* Don't show again checkbox */}
            <div className="flex items-center justify-center gap-1.5 mb-3 text-white">
              <button onClick={() => setDontShowAgain(!dontShowAgain)} className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-cyan-500' : 'bg-slate-800'}`}>
                {dontShowAgain && <Check size={10} className="text-white" />}
              </button>
              <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>Don't show briefing again</span>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 pb-1">
              {step > 0 ? (
                <button onClick={prevStep} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest border-[2px] border-black italic text-[9px]">
                  BACK
                </button>
              ) : (
                <button onClick={onComplete} className="flex-1 bg-slate-800/50 text-slate-500 py-2.5 rounded-xl font-black uppercase tracking-widest border-[2px] border-black/30 italic text-[9px]">
                  SKIP
                </button>
              )}
              <button onClick={nextStep} className="flex-[2] bg-cyan-500 text-black py-2.5 rounded-xl font-black uppercase tracking-widest border-[3px] border-black italic text-[10px] flex items-center justify-center gap-1.5 hover:bg-cyan-400 transition-colors">
                {step === STEPS.length - 1 ? 'BEGIN DEPLOYMENT' : 'NEXT'}
                <Sparkles size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
