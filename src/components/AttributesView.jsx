import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, Shield, Crosshair, Plus, Zap, Info, Check, Sparkles } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';
import { AP_PER_LEVEL } from '../utils/gameLogic';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ statKey, label, abbr, value, icon: Icon, color, borderColor, glowColor, desc, onAdd, disabled }) => (
  <div className={`relative bg-slate-900 border-[3px] ${disabled ? 'border-slate-700' : borderColor} shadow-[5px_5px_0_rgba(0,0,0,1)] transition-all duration-200 ${!disabled ? `hover:shadow-[8px_8px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:${glowColor}` : ''} p-4 md:p-5 flex items-center gap-4`}>
    {/* Halftone overlay */}
    <div className={`absolute inset-0 opacity-5 pointer-events-none comic-halftone ${color}`} />

    {/* Icon badge */}
    <div className={`shrink-0 w-11 h-11 md:w-14 md:h-14 flex items-center justify-center border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] bg-black`}>
      <Icon size={20} className={`md:w-7 md:h-7 ${color}`} strokeWidth={3} />
    </div>

    {/* Stat info */}
    <div className="flex-1 min-w-0">
      <p className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] ${color} opacity-70 italic leading-none mb-0.5`}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl md:text-4xl font-black text-white italic leading-none drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">{value}</span>
        <span className={`text-[9px] font-black uppercase ${color} opacity-50`}>[{abbr}]</span>
      </div>
      <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase italic mt-1 leading-tight">{desc}</p>
    </div>

    {/* Add button */}
    <button
      id={`allocate-${statKey}`}
      onClick={onAdd}
      disabled={disabled}
      className={`shrink-0 w-11 h-11 md:w-14 md:h-14 flex items-center justify-center border-[3px] border-black font-black transition-all
        shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none
        ${disabled
          ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none'
          : 'bg-amber-400 text-black hover:bg-amber-300 hover:scale-110'
        }`}
    >
      <Plus size={22} strokeWidth={4} />
    </button>
  </div>
);

// ─── Main View ────────────────────────────────────────────────────────────────
export const AttributesView = React.memo(() => {
  const { player, actions, adventure, openGuide } = useGame();
  const { allocateStat } = actions;

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_attributes_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Memory Bank",
      npc: 1,
      visualType: 'ap',
      text: "Every time you level up by defeating enemies in the Dungeons, your Memory Bank gains Ability Points (AP). You must allocate these to grow stronger.",
      hint: "Tip: Level up to gain 10 AP per level."
    },
    {
      title: "Stat Optimization",
      npc: 3,
      visualType: 'stats',
      text: "You can allocate AP into Strength (Raw Power), Agility (Evasion), or Dexterity (Accuracy). Shape your hunter to fit your combat style!",
      hint: "Strategy: Balance damage and survival."
    },
    {
      title: "Permanent Uplink",
      npc: 6,
      visualType: 'warning',
      text: "Take caution, Hunter. Once points are allocated to your Identity Core, they cannot be retrieved or refunded. Spend them wisely.",
      hint: "Warning: Stat allocations are permanent!"
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_attributes_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  const ap = player?.abilityPoints ?? 0;
  const baseStats = player?.baseStats ?? { str: 10, agi: 10, dex: 10 };
  const level = player?.level ?? 1;

  // How many AP have been spent (for the progress readout)
  const spentAP = useMemo(() => {
    const base = { str: 10, agi: 10, dex: 10 };
    return (
      Math.max(0, baseStats.str - base.str) +
      Math.max(0, baseStats.agi - base.agi) +
      Math.max(0, baseStats.dex - base.dex)
    );
  }, [baseStats]);

  const totalEarned = level * AP_PER_LEVEL;
  const hasAP = ap > 0;

  const stats = [
    {
      statKey: 'str',
      label: 'Strength',
      abbr: 'STR',
      value: baseStats.str,
      icon: Shield,
      color: 'text-red-500',
      borderColor: 'border-red-600',
      glowColor: 'shadow-[8px_8px_0_rgba(220,38,38,0.3)]',
      desc: 'Raw power — increases attack damage dealt to enemies.',
    },
    {
      statKey: 'agi',
      label: 'Agility',
      abbr: 'AGI',
      value: baseStats.agi,
      icon: Zap,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-600',
      glowColor: 'shadow-[8px_8px_0_rgba(5,150,105,0.3)]',
      desc: 'Evasion power — reduces incoming damage from enemy strikes.',
    },
    {
      statKey: 'dex',
      label: 'Dexterity',
      abbr: 'DEX',
      value: baseStats.dex,
      icon: Crosshair,
      color: 'text-amber-400',
      borderColor: 'border-amber-600',
      glowColor: 'shadow-[8px_8px_0_rgba(217,119,6,0.3)]',
      desc: 'Accuracy — improves hit chance against high-agility targets.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center overflow-y-auto p-4 md:p-6 gap-6 relative bg-slate-950">
      {/* Visual Character: Cyber Identity Core */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
      <div className="scanline-move" />
      
      <Header title="IDENTITY CORE: STATS" onClose={adventure.goBack} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
      }} />

      {/* ── AP Counter ── */}
      <div className="w-full max-w-sm relative z-10">
        <div className={`relative border-[4px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] p-6 text-center transform -rotate-1 overflow-hidden transition-all
          ${hasAP ? 'bg-amber-400' : 'bg-slate-800'}`}>

          <div className="absolute inset-0 comic-halftone opacity-10 text-black pointer-events-none" />

          {/* Corner label */}
          <div className="absolute -top-3 -left-3 bg-black text-white px-3 py-1 font-black text-[9px] uppercase tracking-widest border-2 border-white shadow-md z-10">
            Memory Bank
          </div>

          <p className={`text-[10px] uppercase font-black tracking-[0.25em] italic mb-1 ${hasAP ? 'text-black/60' : 'text-slate-500'}`}>
            Available AP
          </p>

          <div className="flex items-center justify-center gap-3">
            <TrendingUp size={hasAP ? 28 : 20} className={`${hasAP ? 'text-black animate-pulse' : 'text-slate-600'} transition-all`} strokeWidth={3} />
            <span className={`text-7xl md:text-8xl font-black italic leading-none transition-all
              ${hasAP ? 'text-black drop-shadow-[4px_4px_0_rgba(255,255,255,0.4)]' : 'text-slate-600'}`}>
              {ap}
            </span>
          </div>

          {/* AP progress bar */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between items-center px-1">
              <span className={`text-[8px] font-black uppercase italic ${hasAP ? 'text-black/50' : 'text-slate-600'}`}>Spent</span>
              <span className={`text-[9px] font-black italic ${hasAP ? 'text-black/70' : 'text-slate-500'}`}>{spentAP} / {totalEarned} Earned</span>
            </div>
            <div className="w-full h-2 bg-black/20 border border-black/30 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${hasAP ? 'bg-black/40' : 'bg-slate-700'}`}
                style={{ width: `${totalEarned > 0 ? (spentAP / totalEarned) * 100 : 0}%` }}
              />
            </div>
          </div>

          {!hasAP && (
            <p className="mt-3 text-[9px] font-black uppercase text-slate-500 italic tracking-widest">
              Level up to earn more AP
            </p>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="w-full max-w-sm space-y-3 relative z-10">
        {stats.map((s, idx) => (
          <div key={s.statKey} className={idx % 2 === 0 ? 'transform -rotate-[0.5deg]' : 'transform rotate-[0.5deg]'}>
            <StatCard
              {...s}
              onAdd={() => allocateStat(s.statKey)}
              disabled={!hasAP}
            />
          </div>
        ))}
      </div>

      {/* ── Info Footer ── */}
      <div className="w-full max-w-sm relative z-10">
        <div className="flex items-start gap-2 bg-slate-900/80 border border-slate-700 p-3 rounded-sm">
          <Info size={12} className="text-cyan-500 mt-0.5 shrink-0" />
          <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase italic leading-relaxed tracking-wide">
            Each level grants <span className="text-cyan-400">{AP_PER_LEVEL} Ability Points</span>. Points spent cannot be refunded. Allocate wisely, Hunter.
          </p>
        </div>
      </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-violet-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #8b5cf6 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-violet-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
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
                   <div className="absolute inset-x-0 bottom-0 bg-violet-600 text-[6px] font-black text-white text-center py-0.5 uppercase italic">SYSTEM</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-violet-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-violet-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'ap' && (
                     <TrendingUp className="text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'stats' && (
                     <div className="flex text-2xl drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] z-10 gap-1 animate-pulse"><Shield size={20} className="text-red-400"/><Zap size={20} className="text-emerald-400"/></div>
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'warning' && (
                     <Info className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-violet-400 animate-spin-slow"></div>
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

                <div className="bg-black/60 p-1.5 rounded-lg border border-violet-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-violet-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-violet-500' : 'bg-slate-800'}`}
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
                    className="flex-[2] bg-violet-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-violet-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'UPLOAD IDENTITY' : 'TRANSMIT MORE'}
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
