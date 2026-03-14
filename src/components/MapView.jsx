import React, { useState } from 'react';
import { Map as MapIcon, ChevronRight, Lock, Star, Skull, TrendingUp } from 'lucide-react';
import { Header } from './GameUI';

export const MapView = ({ MAPS, LOOTS, player, setView, setDepth, spawnNewEnemy, setSelectedMap, isPenalized, penaltyRemaining }) => {
  const handleMapSelect = (map) => {
    if (player.level < map.minLevel) return;
    if (isPenalized) return;
    setSelectedMap(map);
    setDepth(1);
    spawnNewEnemy(1);
    setView('dungeon');
  };

  return (
    <div className="flex-1 p-6 space-y-6 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      
      <Header 
        title="World Sectors" 
        onClose={() => setView('menu')} 
      />

      <div className="flex-1 overflow-y-auto space-y-6 z-10 pr-2 pb-10">
        <div className="grid gap-6">
          {MAPS.map((map, idx) => {
            const isLocked = player.level < map.minLevel;
            return (
              <button
                key={map.id}
                onClick={() => handleMapSelect(map)}
                disabled={isLocked}
                className={`w-full text-left p-5 border-[4px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] bg-white transform transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none relative group ${idx % 2 === 0 ? '-rotate-1' : 'rotate-1'} ${isLocked ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-3 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] ${map.id === 'neon_slums' ? 'bg-cyan-500' : map.id === 'rust_canyon' ? 'bg-amber-600' : 'bg-red-600'}`}>
                    <MapIcon size={24} className="text-black" />
                  </div>
                  <div className="text-right">
                      <p className={`text-[10px] font-black uppercase italic ${map.difficulty === 'Easy' ? 'text-emerald-600' : map.difficulty === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>{map.difficulty} Sector</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Min Lvl {map.minLevel}</p>
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-black uppercase italic italic leading-none mb-1 group-hover:text-cyan-600 transition-colors">{map.name}</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase italic leading-tight mb-4">{map.description}</p>
                
                <div className="space-y-2 mt-4">
                  <p className="text-[8px] font-black text-cyan-600 uppercase tracking-widest italic flex items-center gap-1">
                    <TrendingUp size={10} /> Obtainable Assets:
                  </p>
                  <div className="flex gap-2 min-h-[32px]">
                      {map.lootTable.slice(0, 8).map((lootId, li) => {
                        const loot = LOOTS.find(l => l.id === lootId);
                        if (!loot) return null;
                        return (
                          <div key={li} className="w-8 h-8 rounded-lg bg-slate-50 border-2 border-black flex items-center justify-center text-lg shadow-[2px_2px_0_rgba(0,0,0,1)] group-hover:bg-cyan-50 transition-colors" title={loot.name}>
                            {loot.icon}
                          </div>
                        );
                      })}
                      <div className="text-[8px] font-black text-slate-400 self-end mb-1">+{map.lootTable.length - 8} more</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t-2 border-dashed border-black/10 pt-3 mt-4">
                  <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-[9px] font-black uppercase text-black italic">Incursion Entry Available</span>
                  </div>
                  {isLocked ? <Lock size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-black animate-pulse" />}
                </div>

                {isLocked && (
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="bg-red-600 text-white px-4 py-1 border-2 border-black font-black text-[10px] -rotate-12 shadow-lg">LOCKED: REACH LVL {map.minLevel}</div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};
