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
                
                <div className="flex flex-col md:flex-row gap-6 mt-4">
                  {/* Left: Loot Assets */}
                  <div className="flex-1 space-y-2">
                    <p className="text-[8px] font-black text-cyan-600 uppercase tracking-widest italic flex items-center gap-1">
                      <TrendingUp size={10} /> Obtainable Assets:
                    </p>
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
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

                  {/* Right: Sector Denizens (New) */}
                  <div className="flex-1 space-y-2">
                    <p className="text-[8px] font-black text-red-600 uppercase tracking-widest italic flex items-center gap-1">
                      <Skull size={10} /> Sector Denizens:
                    </p>
                    <div className="flex gap-2">
                        {(() => {
                           const folderMap = {
                             'neon_slums': 'Neon Slums',
                             'rust_canyon': 'Rust Canyon',
                             'void_sector': 'Void Sector 7'
                           };
                           const folder = folderMap[map.id] || 'Neon Slums';
                           const denizens = map.id === 'neon_slums' ? ['Venomhide Drake', 'Bone Dragon', 'Ember Drake'] : 
                                            map.id === 'rust_canyon' ? ['Rust Cat 0-0', 'Canyon Flyer 1-1', 'Iron Pet 2-2'] : 
                                            ['Null Stalker', 'Void Wraith', 'Abyssal Crawler'];
                           
                           return denizens.map((name, di) => (
                             <div key={di} className="w-10 h-10 border-2 border-black bg-slate-900 rounded-md overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] hover:scale-110 transition-transform relative group/portrait">
                                <img 
                                  src={`/assets/monsters/${folder}/${name}.png`} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => { 
                                    if (e.target.src.endsWith('.png')) e.target.src = `/assets/monsters/${folder}/${name}.jpg`;
                                    else { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + name; }
                                  }}
                                />
                                <div className="absolute inset-0 bg-red-600/20 opacity-0 group-hover/portrait:opacity-100 transition-opacity flex items-center justify-center">
                                   <p className="text-[5px] font-black text-white uppercase text-center">{name}</p>
                                </div>
                             </div>
                           ));
                        })()}
                    </div>
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
