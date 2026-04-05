import React, { useState } from 'react';
import { Map as MapIcon, ChevronRight, Lock, Star, Skull, TrendingUp, Flame, ShieldAlert, Droplets, Zap } from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const MapView = () => {
  const { player, adventure, gameLoop, openGuide, MAPS, LOOTS, syncPlayer, updateLeaderboard } = useGame();
  const { setView, setDepth, spawnNewEnemy, setSelectedMap } = adventure;
  const { penaltyRemaining } = gameLoop;
  const isPenalized = penaltyRemaining > 0;

  const handleMapSelect = (map) => {
    if (player.level < map.minLevel) return;
    if (isPenalized) return;
    
    // --- STRATEGIC DEPTH SCORING V4 ---
    // Update ranking immediately upon entry to Floor 1 if it's the hardest map reached
    const entryScore = (map.minLevel * 100000) + 1;
    if (entryScore > (player.maxDepthScore || 0)) {
        const entryUpdates = {
            maxDepthScore: entryScore,
            maxDepthMapName: map.name,
            maxDepthMapMinLevel: map.minLevel || 1,
            maxDepthFloor: 1,
            maxDepth: 1
        };
        syncPlayer(entryUpdates);
        updateLeaderboard({
            level: player.level,
            maxDepthScore: entryScore,
            maxDepthFloor: 1
        });
    }

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
        onClose={adventure.goBack} 
        onHelp={() => openGuide('menu')}
      />

      <div className="flex-1 overflow-y-auto space-y-6 z-10 pr-2 pb-10">
        <div className="grid gap-6">
          {MAPS.map((map, idx) => {
            const isLocked = player.level < map.minLevel;
            
            // --- Elemental Theming Engine ---
            const getTheme = (element) => {
              switch(element) {
                case 'Pyro': return { bg: 'bg-orange-200', border: 'border-red-950', accent: 'text-orange-900', hue: 'from-orange-600/40', icon: <Flame size={18} className="text-orange-800" />, shadow: 'shadow-orange-950/40', mapBg: 'bg-red-600', subBg: 'bg-orange-300/60' };
                case 'Earthen': return { bg: 'bg-emerald-200', border: 'border-emerald-950', accent: 'text-emerald-900', hue: 'from-emerald-600/40', icon: <TrendingUp size={18} className="text-emerald-800" />, shadow: 'shadow-emerald-950/40', mapBg: 'bg-emerald-700', subBg: 'bg-emerald-300/60' };
                case 'Hydro': return { bg: 'bg-blue-200', border: 'border-blue-950', accent: 'text-blue-900', hue: 'from-blue-600/40', icon: <Droplets size={18} className="text-blue-800" />, shadow: 'shadow-blue-950/40', mapBg: 'bg-blue-600', subBg: 'bg-blue-300/60' };
                case 'Gale': return { bg: 'bg-purple-200', border: 'border-purple-950', accent: 'text-purple-900', hue: 'from-purple-600/40', icon: <Zap size={18} className="text-purple-800" />, shadow: 'shadow-purple-950/40', mapBg: 'bg-purple-600', subBg: 'bg-purple-300/60' };
                default: return { bg: 'bg-white', border: 'border-black', accent: 'text-slate-600', hue: 'from-slate-900/40', icon: <MapIcon size={18} className="text-slate-600" />, shadow: 'shadow-black/20', mapBg: 'bg-slate-500', subBg: 'bg-slate-100' };
              }
            };
            const theme = getTheme(map.element);

            return (
              <button
                key={map.id}
                onClick={() => handleMapSelect(map)}
                disabled={isLocked}
                className={`w-full text-left p-5 border-[6px] ${theme.shadow} transform transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none relative group ${idx % 2 === 0 ? '-rotate-1' : 'rotate-1'} ${isLocked ? 'opacity-60 grayscale' : ''} ${theme.bg} ${theme.border}`}
              >
                {/* Elemental Warning Banner */}
                {map.element && (
                  <div className="absolute top-2 left-2 z-[30] flex items-center gap-1.5 bg-red-600 px-3 py-1 border-2 border-black rotate-[-2deg] shadow-[3px_3px_0_rgba(0,0,0,1)] group-hover:rotate-0 transition-transform">
                      <ShieldAlert size={14} className="text-white animate-pulse" />
                      <div className="flex flex-col leading-none">
                        <span className="text-[6px] font-black text-white/70 uppercase">Combat Restriction</span>
                        <span className="text-[8px] font-black text-white uppercase italic">Needs {
                              map.element === 'Pyro' ? 'Gale' : 
                              map.element === 'Earthen' ? 'Pyro' : 
                              map.element === 'Hydro' ? 'Earthen' : 
                              map.element === 'Gale' ? 'Hydro' : 'proper'
                          } Imbuement</span>
                      </div>
                  </div>
                )}

                {/* Sector Header Banner FX */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-slate-900 border-b-[3px] border-black overflow-hidden z-0">
                  {(() => {
                    const bannerMonMap = {
                      'neon_slums': { folder: 'Neon Slums', name: 'Venomhide Drake' },
                      'rust_canyon': { folder: 'Rust Canyon', name: 'Rust Cat 0-0' },
                      'void_sector': { folder: 'Void Sector 7', name: 'Null Stalker' },
                      'inferno_crater': { folder: 'Inferno Crater', name: 'Magma Creeper' },
                      'tectonic_ridge': { folder: 'Tectonic Ridge', name: 'Rock Crusher' },
                      'abyssal_trench': { folder: 'Abyssal Trench', name: 'Abyssal Angler' }
                    };
                    const bannerInfo = bannerMonMap[map.id] || { folder: 'Neon Slums', name: 'Venomhide Drake' };
                    return (
                       <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-[2000ms]">
                          <img 
                            src={`/assets/monsters/${bannerInfo.folder}/${bannerInfo.name}.jpg`} 
                            className="w-full h-[300%] object-cover object-top opacity-50 contrast-125 saturate-[0.8] brightness-75 scale-110"
                            onError={(e) => { 
                              if (e.target.src.endsWith('.jpg')) e.target.src = `/assets/monsters/${bannerInfo.folder}/${bannerInfo.name}.png`;
                              else e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + bannerInfo.name;
                            }}
                          />
                          <div className={`absolute inset-0 bg-gradient-to-r ${theme.hue} via-transparent to-black/80`} />
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_2px,3px_100%] pointer-events-none opacity-20" />
                       </div>
                    );
                  })()}
                </div>

                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className={`p-3 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] ${theme.mapBg}`}>
                    <MapIcon size={24} className="text-black" />
                  </div>
                  <div className="text-right">
                      <p className={`text-[10px] font-black uppercase italic ${theme.accent} drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}>{map.difficulty} Sector</p>
                      <p className="text-[8px] font-black text-white/50 uppercase tracking-widest drop-shadow-[0_0_4px_rgba(0,0,0,1)]">Min Lvl {map.minLevel}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-1 relative z-10">
                   {theme.icon}
                   <h3 className={`text-2xl font-black uppercase italic leading-none group-hover:text-cyan-600 transition-colors text-black`}>{map.name}</h3>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase italic leading-tight mb-4 relative z-10">{map.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 relative z-10">
                  <div className="space-y-2">
                    <p className={`text-[8px] font-black ${theme.accent} uppercase tracking-widest italic flex items-center gap-1`}>
                      <TrendingUp size={10} /> Obtainable Assets:
                    </p>
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                        {map.lootTable.slice(0, 8).map((lootId, li) => {
                          const loot = LOOTS.find(l => l.id === lootId);
                          if (!loot) return null;
                          return (
                            <div key={li} className={`w-8 h-8 rounded-lg ${theme.subBg} border-2 border-black flex items-center justify-center text-lg shadow-[2px_2px_0_rgba(0,0,0,1)] group-hover:bg-cyan-50 transition-colors`} title={loot.name}>
                              {loot.icon}
                            </div>
                          );
                        })}
                        <div className="text-[8px] font-black text-slate-400 self-end mb-1">+{map.lootTable.length - 8} more</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className={`text-[8px] font-black ${theme.accent} uppercase tracking-widest italic flex items-center gap-1`}>
                      <Skull size={10} /> Sector Denizens:
                    </p>
                    <div className="flex gap-2">
                        {(() => {
                           const folderMap = {
                             'neon_slums': 'Neon Slums',
                             'rust_canyon': 'Rust Canyon',
                             'void_sector': 'Void Sector 7',
                             'inferno_crater': 'Inferno Crater',
                             'tectonic_ridge': 'Tectonic Ridge',
                             'abyssal_trench': 'Abyssal Trench',
                             'gale_empire': 'Gale Empire'
                           };
                           const folder = folderMap[map.id] || 'Neon Slums';
                           const denizens = map.id === 'neon_slums' ? ['Venomhide Drake', 'Bone Dragon', 'Ember Drake'] : 
                                            map.id === 'rust_canyon' ? ['Rust Cat 0-0', 'Canyon Flyer 1-1', 'Iron Pet 2-2'] : 
                                            map.id === 'void_sector' ? ['Null Stalker', 'Void Wraith', 'Abyssal Crawler'] :
                                            map.id === 'inferno_crater' ? ['Magma Creeper', 'Lava Lurker', 'Ember Shade'] :
                                            map.id === 'tectonic_ridge' ? ['Rock Crusher', 'Stone Sentinel', 'Earth Eater'] :
                                            map.id === 'gale_empire' ? ['Zephyr Scout', 'Sky Sentinel', 'Storm Sovereign'] :
                                            ['Abyssal Angler', 'Trench Terror', 'Deep Sea Dweller'];
                           
                           return denizens.map((name, di) => (
                             <div key={di} className="w-10 h-10 border-2 border-black bg-slate-900 rounded-md overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] hover:scale-110 transition-transform relative group/portrait">
                                <img 
                                  src={`/assets/monsters/${folder}/${name}.jpg`} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => { 
                                    if (e.target.src.endsWith('.jpg')) e.target.src = `/assets/monsters/${folder}/${name}.png`;
                                    else { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + name; }
                                  }}
                                />
                                <div className={`absolute inset-0 ${map.element === 'Pyro' ? 'bg-orange-600/20' : map.element === 'Earthen' ? 'bg-emerald-600/20' : 'bg-red-600/20'} opacity-0 group-hover/portrait:opacity-100 transition-opacity flex items-center justify-center`}>
                                   <p className="text-[5px] font-black text-white uppercase text-center leading-none">{name}</p>
                                </div>
                             </div>
                           ));
                        })()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className={`text-[8px] font-black ${theme.accent} uppercase tracking-widest italic flex items-center gap-1`}>
                      <Star size={10} /> Prized Item Drops:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {map.lootTable.map(lootId => {
                        const loot = LOOTS.find(l => l.id === lootId);
                        if (loot && (loot.rarity === 'Epic' || loot.rarity === 'Legendary')) {
                          return (
                            <div key={lootId} className="relative group/item">
                              <div className={`w-10 h-10 rounded-xl border-[3px] border-black flex items-center justify-center text-xl shadow-[3px_3px_0_rgba(0,0,0,1)] relative z-10 ${loot.rarity === 'Legendary' ? 'bg-amber-100 animate-pulse' : 'bg-purple-100'}`}>
                                {loot.icon}
                              </div>
                              <div className="absolute -top-1 -right-1 z-20 w-3 h-3 bg-red-500 border border-black rounded-full animate-ping"></div>
                              <div className="absolute -bottom-1 -left-1 z-20 bg-black text-white text-[5px] font-black px-1 border border-white/20 uppercase tracking-tighter">
                                {loot.rarity}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t-2 border-dashed border-black/10 pt-3 mt-4 relative z-10">
                  <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-[9px] font-black uppercase text-black italic">Incursion Entry Available</span>
                  </div>
                  {isLocked ? <Lock size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-black animate-pulse" />}
                </div>

                {isLocked && (
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center backdrop-blur-[1px] z-[40]">
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
