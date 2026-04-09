import React, { useMemo } from 'react';
import { TrendingUp, Shield, Crosshair, Plus, Zap, Info } from 'lucide-react';
import { Header } from './GameUI';
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
      
      <Header title="IDENTITY CORE: STATS" onClose={adventure.goBack} onHelp={() => openGuide('menu')} />

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
    </div>
  );
});
