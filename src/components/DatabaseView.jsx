import React, { useState } from 'react';
import { Database, Skull, Gem, Shield, Swords, Info, Zap, Footprints, Crown, Globe, Map as MapIcon, Target, TrendingUp } from 'lucide-react';
import { Header } from './GameUI';

export const DatabaseView = ({ depth, setView, MONSTERS, LOOTS, EQUIPMENT, MAPS, FRUITS }) => {
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
      <Header title="DATABASE: ARCHIVE INFONET" onClose={() => setView('menu')} />
      
      {/* Search & Tabs */}
      <div className="z-10 space-y-4">
        <div className="flex gap-2 bg-black/5 p-1 rounded-xl border-2 border-black/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFilter(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-black text-[9px] uppercase transition-all ${activeTab === tab.id ? 'bg-black text-white shadow-[4px_4px_0_rgba(0,0,0,0.2)]' : 'text-slate-500 hover:bg-black/5'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-white border-[3px] border-black p-3 pl-10 text-xs font-black uppercase italic shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:translate-y-0.5 focus:shadow-none transition-all"
          />
          <Database size={16} className="absolute left-3 top-3.5 text-slate-400" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto z-10 pr-2 space-y-4 pb-10 custom-scrollbar">
        {activeTab === 'monsters' && (
          <div className="grid gap-4">
            {MONSTERS.filter(m => m.name.toLowerCase().includes(filter.toLowerCase())).map((monster, idx) => (
              <div key={idx} className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] flex gap-4 transform transition-all group">
                <div className="w-20 h-20 bg-slate-950 border-[3px] border-black shrink-0 overflow-hidden flex items-center justify-center relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2">
                   <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-50"></div>
                   <img 
                    src={`/assets/monsters/${monster.folder || 'Neon Slums'}/${monster.name}.png`} 
                    className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-500" 
                    onError={(e) => { 
                      const folder = monster.folder || 'Neon Slums';
                      if (e.target.src.endsWith('.png')) e.target.src = `/assets/monsters/${folder}/${monster.name}.jpg`;
                      else { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + monster.name; }
                    }} 
                   />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start">
                      <h4 className="font-black text-sm uppercase italic text-black truncate">{monster.name}</h4>
                      <span className="text-[7px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shrink-0">{monster.folder}</span>
                   </div>
                   <div className="flex items-center gap-1 mt-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase">HP: {monster.hp}</p>
                      <span className="text-[8px] text-slate-300">•</span>
                      <p className="text-[8px] font-black text-slate-500 uppercase">ATK: {monster.str}</p>
                      <span className="text-[8px] text-slate-300">•</span>
                      <p className="text-[8px] font-black text-slate-500 uppercase">GX: {monster.loot}</p>
                   </div>
                   <div className="mt-2 flex flex-wrap gap-1">
                      {monster.taunts?.slice(0, 2).map((t, i) => (
                        <span key={i} className="text-[7px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-black/5 italic">"{t}"</span>
                      ))}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'loots' && (
          <div className="grid gap-3">
             {LOOTS.filter(l => l.name.toLowerCase().includes(filter.toLowerCase()) || l.type.toLowerCase().includes(filter.toLowerCase())).map((loot, idx) => {
               const sourceMap = getMapForLoot(loot.id);
               const dropRate = sourceMap ? calculateDropRate(loot, sourceMap) : '0.0';
               return (
                 <div key={idx} className="bg-white border-[3px] border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-between group">
                     <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 flex items-center justify-center rounded-xl border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex-shrink-0 bg-slate-50 relative overflow-hidden`}>
                           <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-transparent opacity-50"></div>
                           <span className="text-2xl relative z-10 transform group-hover:scale-125 transition-transform duration-300">{loot.icon}</span>
                        </div>
                        <div>
                          <p className="font-black text-xs uppercase italic leading-none mb-1">{loot.name}</p>
                          <div className="flex items-center gap-2">
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${loot.rarity === 'Legendary' ? 'bg-amber-100 text-amber-600 border-amber-200' : loot.rarity === 'Epic' ? 'bg-purple-100 text-purple-600 border-purple-200' : loot.rarity === 'Rare' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{loot.rarity}</span>
                             {sourceMap && (
                               <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 italic">
                                  <MapIcon size={8} /> {sourceMap.name}
                                  <span className="text-cyan-500">• {dropRate}%</span>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-xs font-black text-amber-600 italic">+{loot.sellValue} GX</p>
                    </div>
                 </div>
               );
             })}
          </div>
        )}

         {activeTab === 'fruits' && (
          <div className="grid gap-3">
             {FRUITS.filter(f => f.name.toLowerCase().includes(filter.toLowerCase())).map((fruit, idx) => (
               <div key={idx} className="bg-white border-[3px] border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-between group">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center rounded-xl border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex-shrink-0 bg-emerald-50 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-transparent opacity-50"></div>
                         <span className="text-2xl relative z-10 transform group-hover:scale-125 transition-transform duration-300">{fruit.icon}</span>
                      </div>
                      <div>
                        <p className="font-black text-xs uppercase italic leading-none mb-1">{fruit.name}</p>
                        <div className="flex items-center gap-2">
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${fruit.rarity === 'Legendary' ? 'bg-amber-100 text-amber-600 border-amber-200' : fruit.rarity === 'Epic' ? 'bg-purple-100 text-purple-600 border-purple-200' : fruit.rarity === 'Rare' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{fruit.rarity}</span>
                           <span className="text-[8px] font-black text-emerald-600 uppercase">+{fruit.exp} Dragon XP</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right shrink-0">
                     <p className="text-xs font-black text-slate-400 italic">{fruit.description.slice(0, 30)}...</p>
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'maps' && (
          <div className="grid gap-6">
             {MAPS.map((map, idx) => (
               <div key={idx} className="bg-white border-[4px] border-black overflow-hidden shadow-[8px_8px_0_rgba(0,0,0,1)] relative">
                  {/* Map Header */}
                  <div className={`p-4 border-b-[3px] border-black flex justify-between items-center ${map.id === 'neon_slums' ? 'bg-cyan-600' : map.id === 'rust_canyon' ? 'bg-orange-600' : 'bg-indigo-700'}`}>
                     <div>
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none mb-1">{map.name}</h3>
                        <p className="text-[8px] font-black text-white/70 uppercase">MIN LEVEL: {map.minLevel} • {map.difficulty}</p>
                     </div>
                     <MapIcon className="text-white/30" size={32} />
                  </div>
                  
                  {/* Drop Table */}
                  <div className="p-4 bg-slate-50">
                     <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={12} className="text-cyan-500" />
                        <p className="text-[10px] font-black uppercase italic text-slate-500">Node Loot Table (Calculated Drop Rates)</p>
                     </div>
                     
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {map.lootTable?.map(lootId => {
                           const l = LOOTS.find(item => item.id === lootId);
                           if (!l) return null;
                           const rate = calculateDropRate(l, map);
                           return (
                             <div key={lootId} className="flex items-center gap-2 bg-white border-2 border-black/5 p-2 rounded-lg group hover:border-black/20 transition-all">
                                <span className="text-sm shrink-0 group-hover:scale-110 transition-transform">{l.icon}</span>
                                <div className="min-w-0">
                                   <p className="text-[8px] font-black text-black truncate uppercase leading-none mb-1">{l.name}</p>
                                   <p className={`text-[7px] font-black ${rate < 5 ? 'text-red-500' : rate < 15 ? 'text-amber-500' : 'text-emerald-500'}`}>{rate}% Chance</p>
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
          <div className="grid gap-3">
             {EQUIPMENT.filter(e => e.name.toLowerCase().includes(filter.toLowerCase())).map((item, idx) => (
               <div key={idx} className="bg-white border-[3px] border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-between group">
                   <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex-shrink-0 relative overflow-hidden
                        ${item.type === 'Weapon' ? 'bg-amber-400' : 
                          item.type === 'Armor' ? 'bg-cyan-400' : 
                          item.type === 'Headgear' ? 'bg-purple-400' : 
                          item.type === 'Footwear' ? 'bg-emerald-400' : 
                          'bg-rose-400'}`}>
                         <div className="absolute inset-0 bg-white/30 skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
                         <div className="relative z-10 text-black">
                           {item.type === 'Weapon' ? <Swords size={22} /> : 
                            item.type === 'Armor' ? <Shield size={22} /> : 
                            item.type === 'Headgear' ? <Crown size={22} /> : 
                            item.type === 'Footwear' ? <Footprints size={22} /> : 
                            <Zap size={22} />}
                         </div>
                      </div>
                      <div>
                        <p className="font-black text-xs uppercase italic leading-none mb-1">{item.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase">LVL {item.level} • {item.type}</p>
                     </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                     {Object.entries(item.stats || {}).map(([s, v]) => (
                       <div key={s} className="flex flex-col items-center bg-slate-100 border border-black/10 px-2 py-0.5 rounded">
                          <span className="text-[6px] font-black text-slate-400 uppercase leading-none">{s.slice(0,3)}</span>
                          <span className="text-[9px] font-black text-black leading-none">+{v}</span>
                       </div>
                     ))}
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
