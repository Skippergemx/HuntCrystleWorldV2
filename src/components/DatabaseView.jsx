import React, { useState } from 'react';
import { Database, Skull, Gem, Shield, Swords, Info, Zap, Footprints, Crown, Globe, Map as MapIcon, Target, TrendingUp } from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const DatabaseView = React.memo(() => {
  const { adventure, openGuide, MONSTERS, LOOTS, EQUIPMENT, MAPS, FRUITS } = useGame();
  const { setView } = adventure;

  const [activeTab, setActiveTab] = useState('monsters');
  const [filter, setFilter] = useState('');

  const tabs = [
    { id: 'monsters', label: 'Beast Lore', icon: <Skull size={14} /> },
    { id: 'loots', label: 'Crystle Materials', icon: <Gem size={14} /> },
    { id: 'fruits', label: 'Dragon Fruits', icon: <Target size={14} /> },
    { id: 'equipment', label: 'Hunter Gear', icon: <Shield size={14} /> },
    { id: 'maps', label: 'Sector Nodes', icon: <Globe size={14} /> }
  ];

  const rarityWeights = { 'Common': 100, 'Uncommon': 40, 'Rare': 15, 'Epic': 4, 'Legendary': 1 };

  const getMapForLoot = (lootId) => {
    return MAPS.find(m => m.lootTable?.includes(lootId));
  };

  const calculateDropRate = (loot, map) => {
    if (!map || !map.lootTable) return 0;
    const pool = map.lootTable.map(id => LOOTS.find(l => l.id === id)).filter(Boolean);
    const totalWeight = pool.reduce((sum, l) => sum + (rarityWeights[l.rarity] || 10), 0);
    const weight = rarityWeights[loot.rarity] || 10;
    return ((weight / totalWeight) * 100).toFixed(1);
  };

  return (
    <div className="flex-1 p-6 space-y-4 relative overflow-hidden flex flex-col max-h-screen">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <Header title="DATABASE: ARCHIVE INFONET" onClose={adventure.goBack} onHelp={() => openGuide('menu')} />
      
      {/* Search & Tabs */}
      <div className="z-10 space-y-4">
        <div className="flex gap-2 bg-slate-900 border-[4px] border-black p-1.5 shadow-[6px_6px_0_rgba(0,0,0,1)] transform -rotate-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFilter(''); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all relative overflow-hidden ${activeTab === tab.id ? 'bg-cyan-500 text-black' : 'text-slate-500 hover:bg-slate-800'}`}
            >
              <div className="relative z-10">{tab.icon}</div>
              <span className="text-[7px] font-black uppercase italic tracking-tighter relative z-10">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-white border-[3px] border-black p-3 pl-10 text-xs font-black text-black uppercase italic shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:translate-y-0.5 focus:shadow-none transition-all"
          />
          <Database size={16} className="absolute left-3 top-3.5 text-slate-400" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto z-10 pr-2 space-y-4 pb-10 custom-scrollbar">
        {activeTab === 'monsters' && (
          <div className="grid gap-4">
            {MONSTERS.filter(m => m.name.toLowerCase().includes(filter.toLowerCase())).map((monster, idx) => (
              <div key={idx} className="bg-white border-[4px] border-black p-4 shadow-[8px_8px_0_rgba(0,0,0,1)] flex gap-6 transform transition-all group hover:-translate-y-1 hover:shadow-[10px_10px_0_rgba(0,0,0,1)]">
                <div className="w-24 h-24 bg-slate-950 border-[4px] border-black shrink-0 overflow-hidden flex items-center justify-center relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#450a0a_0%,transparent_80%)] opacity-40"></div>
                   <img 
                    src={`/assets/monsters/${monster.folder || 'Neon Slums'}/${monster.name}.jpg`} 
                    className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-500 contrast-125" 
                    onError={(e) => { 
                      const folder = monster.folder || 'Neon Slums';
                      if (e.target.src.endsWith('.jpg')) e.target.src = `/assets/monsters/${folder}/${monster.name}.png`;
                      else { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + monster.name; }
                    }} 
                   />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                   <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-lg uppercase italic text-black leading-none group-hover:text-red-600 transition-colors truncate">{monster.name}</h4>
                      <span className="text-[10px] font-black text-white bg-black px-2 py-0.5 transform rotate-2 tracking-widest">{monster.id}</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase italic">Power Level</span>
                         <span className="text-xs font-black text-red-500 uppercase">HP {monster.hp} • ATK {monster.str}</span>
                      </div>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase italic">Reward Signal</span>
                         <span className="text-xs font-black text-amber-500 uppercase">+{monster.loot} GX / {monster.xp} XP</span>
                      </div>
                   </div>
                   <div className="mt-3 flex flex-wrap gap-2">
                      {monster.taunts?.slice(0, 2).map((t, i) => (
                        <span key={i} className="text-[8px] font-black bg-slate-50 text-slate-400 px-3 py-1 border border-slate-200 italic rounded-lg">"{t}"</span>
                      ))}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'loots' && (
          <div className="grid gap-4">
             {LOOTS.filter(l => l.name.toLowerCase().includes(filter.toLowerCase()) || l.type.toLowerCase().includes(filter.toLowerCase())).map((loot, idx) => {
               const sourceMap = getMapForLoot(loot.id);
               const dropRate = sourceMap ? calculateDropRate(loot, sourceMap) : '0.0';
               return (
                 <div key={idx} className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center justify-between group hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_rgba(0,0,0,1)] transition-all">
                     <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 flex items-center justify-center rounded-2xl border-[4px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex-shrink-0 bg-slate-50 relative overflow-hidden transform -rotate-3 group-hover:rotate-0 transition-transform`}>
                           <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-transparent opacity-50"></div>
                           <span className="text-3xl relative z-10">{loot.icon}</span>
                        </div>
                        <div>
                          <p className="font-black text-lg text-black uppercase italic leading-none mb-1 group-hover:text-cyan-600 transition-colors">{loot.name}</p>
                          <div className="flex items-center gap-3">
                             <span className={`text-[10px] font-black uppercase px-3 py-0.5 rounded-full border-2 border-black ${loot.rarity === 'Legendary' ? 'bg-amber-400' : loot.rarity === 'Epic' ? 'bg-purple-500 text-white' : loot.rarity === 'Rare' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{loot.rarity}</span>
                             {sourceMap && (
                               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 italic">
                                  <MapIcon size={12} className="text-cyan-500" /> {sourceMap.name}
                                  <span className="text-cyan-500">{dropRate}%</span>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Trade Value</span>
                       <p className="text-xl font-black text-amber-500 italic leading-none">+{loot.sellValue} GX</p>
                    </div>
                 </div>
               );
             })}
          </div>
        )}

        {activeTab === 'fruits' && (
          <div className="grid gap-4">
             {FRUITS.filter(f => f.name.toLowerCase().includes(filter.toLowerCase())).map((fruit, idx) => (
               <div key={idx} className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center justify-between group hover:-translate-y-1 hover:shadow-[10px_10px_0_rgba(0,0,0,1)] transition-all">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 flex items-center justify-center rounded-2xl border-[4px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex-shrink-0 bg-emerald-50 relative overflow-hidden transform rotate-3 group-hover:rotate-0 transition-transform">
                         <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-transparent opacity-50"></div>
                         <span className="text-3xl relative z-10 transform group-hover:scale-125 transition-transform duration-300">{fruit.icon}</span>
                      </div>
                      <div>
                        <p className="font-black text-lg text-black uppercase italic leading-none mb-1 group-hover:text-emerald-600 transition-colors">{fruit.name}</p>
                        <div className="flex items-center gap-3">
                           <span className={`text-[10px] font-black uppercase px-3 py-0.5 rounded-full border-2 border-black ${fruit.rarity === 'Legendary' ? 'bg-amber-400' : fruit.rarity === 'Epic' ? 'bg-purple-500 text-white' : fruit.rarity === 'Rare' ? 'bg-blue-500 text-white' : 'bg-emerald-200 text-emerald-700'}`}>{fruit.rarity}</span>
                           <span className="text-[10px] font-black text-emerald-600 uppercase italic tracking-widest">+{fruit.exp} Dragon XP</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right max-w-[200px]">
                     <p className="text-[10px] font-black text-slate-700 italic leading-tight uppercase line-clamp-2">"{fruit.description}"</p>
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'maps' && (
          <div className="grid gap-8">
             {MAPS.map((map, idx) => (
               <div key={idx} className="bg-white border-[4px] border-black shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden group">
                  {/* Map Header */}
                  <div className={`p-6 border-b-[4px] border-black flex justify-between items-center relative overflow-hidden ${map.id === 'neon_slums' ? 'bg-cyan-600' : map.id === 'rust_canyon' ? 'bg-orange-600' : 'bg-indigo-700'}`}>
                     <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }}></div>
                     <div className="relative z-10">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">{map.name}</h3>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-black bg-white px-2 py-0.5 transform -rotate-1 uppercase tracking-widest leading-none">Min Lvl {map.minLevel}</span>
                           <span className="text-[10px] font-black text-white/90 uppercase italic tracking-widest">{map.difficulty} Node</span>
                        </div>
                     </div>
                     <MapIcon className="text-white/20 group-hover:scale-125 transition-transform duration-700" size={48} />
                  </div>
                  
                  {/* Drop Table */}
                  <div className="p-6 bg-slate-50">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <TrendingUp size={14} className="text-cyan-600" />
                           <p className="text-[10px] font-black uppercase italic text-black tracking-widest">Sector Loot Synchronization Details</p>
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Live Probability Scanner</span>
                     </div>
                     
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {map.lootTable?.map(lootId => {
                           const l = LOOTS.find(item => item.id === lootId);
                           if (!l) return null;
                           const rate = calculateDropRate(l, map);
                           return (
                             <div key={lootId} className="bg-white border-[3px] border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,0.1)] flex flex-col items-center gap-2 group/loot hover:border-cyan-500 hover:shadow-none transition-all cursor-crosshair">
                                <span className="text-2xl group-hover/loot:scale-110 transition-transform">{l.icon}</span>
                                <div className="text-center w-full">
                                   <p className="text-[8px] font-black text-black truncate uppercase leading-none mb-1">{l.name}</p>
                                   <p className={`text-[9px] font-black italic ${rate < 5 ? 'text-red-500' : rate < 15 ? 'text-amber-500' : 'text-emerald-600'}`}>{rate}%</p>
                                </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="grid gap-4">
             {EQUIPMENT.filter(e => e.name.toLowerCase().includes(filter.toLowerCase())).map((item, idx) => {
               const typeColors = {
                 'Weapon': 'bg-amber-400',
                 'Armor': 'bg-cyan-400',
                 'Headgear': 'bg-purple-500',
                 'Footwear': 'bg-emerald-500',
                 'Relic': 'bg-rose-500'
               };
               
               const typeIcons = {
                 'Weapon': <Swords size={24} />,
                 'Armor': <Shield size={24} />,
                 'Headgear': <Crown size={24} />,
                 'Footwear': <Footprints size={24} />,
                 'Relic': <Zap size={24} />
               };

               return (
                 <div key={idx} className="bg-white border-[4px] border-black p-4 shadow-[8px_8px_0_rgba(0,0,0,1)] flex items-center gap-6 group transform transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none min-h-[120px]">
                    {/* Icon Container */}
                    <div className={`w-20 h-20 grow-0 shrink-0 ${typeColors[item.type] || 'bg-slate-400'} border-[4px] border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] relative overflow-hidden transform -rotate-2 group-hover:rotate-0 transition-transform`}>
                       <div className="absolute inset-0 bg-white/20 skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
                       <div className="relative z-10 text-black drop-shadow-md">
                          <span className="text-4xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                            {item.icon || (typeIcons[item.type])}
                          </span>
                       </div>
                    </div>
 
                    {/* Info Section */}
                    <div className="flex-1 min-w-0">
                       <h3 className="text-xl font-black text-black uppercase italic tracking-tighter leading-none mb-1 group-hover:text-cyan-600 transition-colors truncate">
                          {item.name}
                       </h3>
                       <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest italic flex items-center gap-1 ${item.rarity === 'Legendary' ? 'text-amber-500' : item.rarity === 'Epic' ? 'text-purple-600' : 'text-slate-400'}`}>
                             {item.rarity || 'Common'} {item.type} <span className="text-slate-200">|</span> LVL {item.reqLvl || item.level || 1}
                          </span>
                          {item.effect && (
                            <div className="bg-slate-900 text-white px-2 py-0.5 border border-black inline-block self-start transform -rotate-1 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                               <p className="text-[9px] font-black uppercase italic text-cyan-400">Tactical Proc: {item.effect.type}</p>
                            </div>
                          )}
                          <p className="text-[10px] font-black text-slate-500 leading-tight uppercase italic line-clamp-2 mt-1">"{item.description || 'Standard issue hunter gear.'}"</p>
                       </div>
                    </div>
 
                    {/* Stats Grid */}
                    <div className="flex gap-2 shrink-0">
                       {['str', 'dex', 'agi'].map(stat => (
                         <div key={stat} className="flex flex-col items-center bg-white border-[3px] border-black px-3 py-1.5 rounded-xl shadow-[3px_3px_0_rgba(0,0,0,1)] min-w-[50px] transform rotate-1 group-hover:rotate-0 transition-transform">
                            <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1 italic tracking-widest">{stat}</span>
                            <span className={`text-sm font-black leading-none ${item.stats?.[stat] > 0 ? 'text-emerald-600' : item.stats?.[stat] < 0 ? 'text-red-500' : 'text-black'}`}>
                              {item.stats?.[stat] > 0 ? `+${item.stats[stat]}` : item.stats?.[stat] || 0}
                            </span>
                         </div>
                       ))}
                    </div>
                  </div>
               );
             })}
          </div>
        )}
      </div>
    </div>
  );
});
