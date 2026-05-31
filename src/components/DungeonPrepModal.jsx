import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Gem, Scroll, ChevronUp, ChevronDown, ShieldCheck, Swords } from 'lucide-react';

const POTION_TYPES = [
  { id: 'hp_potion', name: 'Small Potion', label: '10% HP', icon: '🧪', color: 'emerald' },
  { id: 'mega_hp_potion', name: 'Mega Potion', label: '50% HP', icon: '⚗️', color: 'cyan' },
  { id: 'ultra_hp_potion', name: 'Ultra Potion', label: '100% HP', icon: '💉', color: 'purple' },
];

const SCROLL_TYPES = [
  { id: 'auto_scroll', name: '1m Scroll', label: '1 min', icon: '📜', color: 'amber' },
  { id: 'auto_scroll_3m', name: '3m Scroll', label: '3 min', icon: '📜', color: 'amber' },
  { id: 'auto_scroll_6m', name: '6m Scroll', label: '6 min', icon: '📜', color: 'amber' },
  { id: 'auto_scroll_9m', name: '9m Scroll', label: '9 min', icon: '📜', color: 'amber' },
  { id: 'auto_scroll_12m', name: '12m Scroll', label: '12 min', icon: '📜', color: 'amber' },
];

const MAX_PER_CATEGORY = 20;

/**
 * DungeonPrepModal — pre-dungeon loadout screen.
 * Player allocates up to 20 potion uses and 20 scroll uses from their total inventory.
 */
export const DungeonPrepModal = ({ player, playerPotions, playerScrolls, initialLoadout, onConfirm, onCancel }) => {
  const [potionPacked, setPotionPacked] = useState(() => {
    const init = {};
    POTION_TYPES.forEach(p => { init[p.id] = initialLoadout?.potions?.[p.id] || 0; });
    return init;
  });
  const [scrollPacked, setScrollPacked] = useState(() => {
    const init = {};
    SCROLL_TYPES.forEach(s => { init[s.id] = initialLoadout?.scrolls?.[s.id] || 0; });
    return init;
  });

  const totalPotionsPacked = useMemo(() => Object.values(potionPacked).reduce((a, b) => a + b, 0), [potionPacked]);
  const totalScrollsPacked = useMemo(() => Object.values(scrollPacked).reduce((a, b) => a + b, 0), [scrollPacked]);

  const canAddPotion = useCallback((id) => {
    return totalPotionsPacked < MAX_PER_CATEGORY && potionPacked[id] < (playerPotions?.[id] || 0);
  }, [totalPotionsPacked, potionPacked, playerPotions]);

  const canAddScroll = useCallback((id) => {
    return totalScrollsPacked < MAX_PER_CATEGORY && scrollPacked[id] < (playerScrolls?.[id] || 0);
  }, [totalScrollsPacked, scrollPacked, playerScrolls]);

  const adjustPotion = useCallback((id, delta) => {
    setPotionPacked(prev => {
      const next = { ...prev };
      next[id] = Math.max(0, Math.min(
        playerPotions?.[id] || 0,
        (prev[id] || 0) + delta,
        MAX_PER_CATEGORY - totalPotionsPacked + (prev[id] || 0) + delta
      ));
      // Re-clamp: ensure total doesn't exceed cap when adjusting
      const newTotal = Object.values(next).reduce((a, b) => a + b, 0);
      if (newTotal > MAX_PER_CATEGORY) {
        // Undo — shouldn't happen with the clamp above, but safety net
        next[id] = prev[id];
      }
      return next;
    });
  }, [playerPotions, totalPotionsPacked]);

  const adjustScroll = useCallback((id, delta) => {
    setScrollPacked(prev => {
      const next = { ...prev };
      next[id] = Math.max(0, Math.min(
        playerScrolls?.[id] || 0,
        (prev[id] || 0) + delta,
        MAX_PER_CATEGORY - totalScrollsPacked + (prev[id] || 0) + delta
      ));
      const newTotal = Object.values(next).reduce((a, b) => a + b, 0);
      if (newTotal > MAX_PER_CATEGORY) {
        next[id] = prev[id];
      }
      return next;
    });
  }, [playerScrolls, totalScrollsPacked]);

  const handleConfirm = useCallback(() => {
    onConfirm({ potions: potionPacked, scrolls: scrollPacked });
  }, [potionPacked, scrollPacked, onConfirm]);

  const hasAnything = totalPotionsPacked > 0 || totalScrollsPacked > 0;

  const colorMap = {
    emerald: { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]' },
    cyan: { bg: 'bg-cyan-600', border: 'border-cyan-400', text: 'text-cyan-400', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]' },
    purple: { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
    amber: { bg: 'bg-amber-600', border: 'border-amber-400', text: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' },
  };

  const renderRow = (type, packed, owned, onAdjust, isScroll) => {
    const colors = colorMap[type.color] || colorMap.emerald;
    const isFull = (isScroll ? totalScrollsPacked : totalPotionsPacked) >= MAX_PER_CATEGORY;
    const ownedExhausted = packed >= (owned || 0);
    const canInc = packed < (owned || 0) && !isFull;
    const canDec = packed > 0;

    return (
      <div
        key={type.id}
        className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-slate-900/60 border-2 border-slate-800 rounded-xl ${colors.glow} transition-all`}
      >
        {/* Icon */}
        <span className="text-xl md:text-2xl w-8 text-center flex-shrink-0">{type.icon}</span>

        {/* Name + detail */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] md:text-xs font-black text-white uppercase italic tracking-tight truncate">{type.name}</p>
          <p className={`text-[8px] md:text-[9px] font-black ${colors.text} uppercase tracking-widest`}>{type.label}</p>
        </div>

        {/* Owned */}
        <div className="text-center flex-shrink-0 w-10">
          <span className="text-[7px] font-black text-slate-500 uppercase block leading-none">Owned</span>
          <span className="text-xs md:text-sm font-black text-white/70">{owned || 0}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onAdjust(type.id, -1)}
            disabled={!canDec}
            className="w-7 h-7 md:w-8 md:h-8 bg-slate-800 border-2 border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronDown size={14} className="text-white" />
          </button>
          <span className="w-7 text-center text-sm md:text-base font-black text-white italic">{packed}</span>
          <button
            onClick={() => onAdjust(type.id, 1)}
            disabled={!canInc}
            className="w-7 h-7 md:w-8 md:h-8 bg-slate-800 border-2 border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronUp size={14} className="text-white" />
          </button>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 md:p-4 animate-in fade-in zoom-in-95 duration-300">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

      <div className="relative w-full max-w-md max-h-[95vh] flex flex-col">
        {/* Offset shadow */}
        <div className="absolute inset-0 bg-cyan-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 pointer-events-none" />

        <div className="relative bg-slate-950 border-[4px] border-black rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">

          {/* Header */}
          <div className="bg-black border-b-[4px] border-cyan-500 py-4 md:py-5 relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.3) 2px, rgba(6,182,212,0.3) 3px)' }} />
            <div className="relative z-10 flex items-center justify-center gap-3 px-4">
              <div className="w-10 h-10 bg-cyan-500/20 border-2 border-cyan-500 rounded-xl flex items-center justify-center">
                <ShieldCheck size={22} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">Pack for Dungeon</h2>
                <p className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.3em]">Loadout: 20 potions • 20 scrolls max</p>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 custom-scrollbar">

            {/* ── POTIONS ── */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <Gem size={16} className="text-emerald-400" />
                  <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-tight">Potions</h3>
                </div>
                <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${totalPotionsPacked >= MAX_PER_CATEGORY ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {totalPotionsPacked}/{MAX_PER_CATEGORY}
                </span>
              </div>
              <div className="space-y-1.5">
                {POTION_TYPES.map(p => renderRow(p, potionPacked[p.id], playerPotions?.[p.id] || 0, adjustPotion, false))}
              </div>
              {totalPotionsPacked === 0 && (
                <p className="text-[8px] text-slate-600 font-black uppercase text-center mt-2">No potions packed — you'll fight without heals</p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-800" />
              <Swords size={12} className="text-slate-600" />
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* ── SCROLLS ── */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <Scroll size={16} className="text-amber-400" />
                  <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-tight">Scrolls</h3>
                </div>
                <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${totalScrollsPacked >= MAX_PER_CATEGORY ? 'text-amber-400' : 'text-slate-500'}`}>
                  {totalScrollsPacked}/{MAX_PER_CATEGORY}
                </span>
              </div>
              <div className="space-y-1.5">
                {SCROLL_TYPES.map(s => renderRow(s, scrollPacked[s.id], playerScrolls?.[s.id] || 0, adjustScroll, true))}
              </div>
              {totalScrollsPacked === 0 && (
                <p className="text-[8px] text-slate-600 font-black uppercase text-center mt-2">No scrolls packed — you'll fight manually</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-3 md:p-4 bg-black/80 border-t-[4px] border-black flex gap-2 md:gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-slate-800 border-[3px] border-black py-3 font-black text-white text-[10px] md:text-xs uppercase italic tracking-tight shadow-[3px_3px_0_rgba(0,0,0,1)] hover:bg-slate-700 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasAnything}
              className="flex-[2] bg-cyan-500 border-[3px] border-black py-3 font-black text-black text-[10px] md:text-sm uppercase italic tracking-tight shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-cyan-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Swords size={16} />
              Enter Dungeon
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
