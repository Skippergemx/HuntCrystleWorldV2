import React, { useState } from 'react';
import { Database, Skull, Gem, Shield, Swords, Info, Zap, Footprints, Crown } from 'lucide-react';
import { Header } from './GameUI';

export const DatabaseView = ({ depth, setView, MONSTERS, LOOTS, EQUIPMENT }) => {
  const [activeTab, setActiveTab] = useState('monsters');
  const [filter, setFilter] = useState('');

  const tabs = [
    { id: 'monsters', label: 'Beasts', icon: <Skull size={14} /> },
    { id: 'loots', label: 'Materials', icon: <Gem size={14} /> },
    { id: 'equipment', label: 'Gear', icon: <Shield size={14} /> }
  ];

  return (
    <div className="flex-1 p-6 space-y-4 relative overflow-hidden flex flex-col max-h-screen">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      <Header title="ARCHIVES: SYSTEM DB" onClose={() => setView('menu')} />
      
      {/* Search & Tabs */}
      <div className="z-10 space-y-4">
        <div className="flex gap-2 bg-black/5 p-1 rounded-xl border-2 border-black/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFilter(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${activeTab === tab.id ? 'bg-black text-white shadow-[4px_4px_0_rgba(0,0,0,0.2)]' : 'text-slate-500 hover:bg-black/5'}`}
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
      <div className="flex-1 overflow-y-auto z-10 pr-2 space-y-4 pb-10">
        {activeTab === 'monsters' && (
          <div className="grid gap-4">
            {MONSTERS.filter(m => m.name.toLowerCase().includes(filter.toLowerCase())).map((monster, idx) => (
              <div key={idx} className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] flex gap-4 transform transition-all hover:scale-[1.01]">
                <div className="w-16 h-16 bg-slate-950 border-[3px] border-black shrink-0 overflow-hidden flex items-center justify-center relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2">
                   {/* Background Glow */}
                   <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-50"></div>
                   <img 
                    src={`/assets/monsters/${monster.folder || 'Neon Slums'}/${monster.name}.png`} 
                    className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-500" 
                    onError={(e) => { 
                      const folder = monster.folder || 'Neon Slums';
                      if (e.target.src.endsWith('.png')) {
                        e.target.src = `/assets/monsters/${folder}/${monster.name}.jpg`;
                      } else {
                        e.target.onerror = null;
                        e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + monster.name;
                      }
                    }} 
                   />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start">
                      <h4 className="font-black text-sm uppercase italic text-black">{monster.name}</h4>
                      <span className="text-[8px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">CLASS: {monster.hp > 500 ? 'ELITE' : 'COMMON'}</span>
                   </div>
                   <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="bg-slate-50 border border-black/5 p-1 text-center">
                         <p className="text-[6px] font-black text-slate-400 uppercase">Health</p>
                         <p className="text-[10px] font-black text-black">{monster.hp}</p>
                      </div>
                      <div className="bg-slate-50 border border-black/5 p-1 text-center">
                         <p className="text-[6px] font-black text-slate-400 uppercase">Attack</p>
                         <p className="text-[10px] font-black text-black">{monster.str}</p>
                      </div>
                      <div className="bg-slate-50 border border-black/5 p-1 text-center">
                         <p className="text-[6px] font-black text-slate-400 uppercase">Agility</p>
                         <p className="text-[10px] font-black text-black">{monster.agi}</p>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'loots' && (
          <div className="grid gap-3">
             {LOOTS.filter(l => l.name.toLowerCase().includes(filter.toLowerCase()) || l.type.toLowerCase().includes(filter.toLowerCase())).map((loot, idx) => (
               <div key={idx} className="bg-white border-[3px] border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex-shrink-0 bg-slate-50 relative overflow-hidden group`}>
                         <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-transparent opacity-50"></div>
                         <span className="text-xl relative z-10 transform group-hover:scale-125 transition-transform">{loot.icon}</span>
                      </div>
                      <div>
                        <p className="font-black text-xs uppercase italic leading-none">{loot.name}</p>
                        <p className={`text-[7px] font-black uppercase mt-1 ${loot.rarity === 'Legendary' ? 'text-amber-500' : loot.rarity === 'Epic' ? 'text-purple-500' : loot.rarity === 'Rare' ? 'text-blue-500' : 'text-slate-400'}`}>{loot.rarity} • {loot.type}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-amber-600 italic">{loot.sellValue} GX</p>
                  </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="grid gap-3">
             {EQUIPMENT.filter(e => e.name.toLowerCase().includes(filter.toLowerCase())).map((item, idx) => (
               <div key={idx} className="bg-white border-[3px] border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex-shrink-0 relative overflow-hidden group
                        ${item.type === 'Weapon' ? 'bg-amber-400' : 
                          item.type === 'Armor' ? 'bg-cyan-400' : 
                          item.type === 'Headgear' ? 'bg-purple-400' : 
                          item.type === 'Footwear' ? 'bg-emerald-400' : 
                          'bg-rose-400'}`}>
                         
                         {/* Shine effect */}
                         <div className="absolute inset-0 bg-white/30 skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
                         
                         <div className="relative z-10 text-black">
                           {item.type === 'Weapon' ? <Swords size={20} /> : 
                            item.type === 'Armor' ? <Shield size={20} /> : 
                            item.type === 'Headgear' ? <Crown size={20} /> : 
                            item.type === 'Footwear' ? <Footprints size={20} /> : 
                            <Zap size={20} />}
                         </div>
                      </div>
                      <div>
                        <p className="font-black text-xs uppercase italic leading-none">{item.name}</p>
                        <p className="text-[7px] font-black text-slate-400 uppercase mt-1">LVL {item.level} • {item.type}</p>
                     </div>
                  </div>
                  <div className="flex gap-1">
                     {Object.entries(item.stats || {}).map(([s, v]) => (
                       <span key={s} className="text-[8px] font-black text-black bg-slate-100 border border-black/10 px-1 uppercase">{s.slice(0,3)} +{v}</span>
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
