import React, { useMemo, useState } from 'react';
import { 
  ShieldCheck, 
  Package, 
  Zap,
  Filter,
  Search,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const InventoryView = React.memo(() => {
  const { player, actions, adventure, openGuide, ITEMS, CRYSTLE_RECIPES } = useGame();
  const { setView } = adventure;
  const { sellItem, unequipItem } = actions;
  
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Robust Item Data Resolver - Now powered by unified ITEMS list
  const getMasterData = (item) => {
    if (!item) return null;
    const cleanId = item.id?.split('_')[0];
    
    // 1. Check Master Items DB
    const fromItems = ITEMS.find(i => i.id === cleanId);
    if (fromItems) return fromItems;
    
    // 2. Check Recipe List (for crafted items not in master)
    const fromRecipe = CRYSTLE_RECIPES.find(r => r.id === cleanId);
    if (fromRecipe) return fromRecipe;

    // 3. Last Resort: Name Match
    const byName = ITEMS.find(i => i.name?.toLowerCase() === item.name?.toLowerCase());
    if (byName) return byName;

    return item;
  };

  const getItemIcon = (item, master) => {
    if (master && master.icon && master.icon !== '📦') return master.icon;
    if (item.icon && item.icon !== '📦' && item.icon !== '') return item.icon;
    return '📦';
  };

  const processedInventory = useMemo(() => {
     const inv = (player.inventory || []).filter(i => i && typeof i === 'object').map(i => ({ ...i, isEquipped: false }));
     const equipped = Object.values(player.equipped || {}).filter(i => i && typeof i === 'object').map(i => ({ ...i, isEquipped: true }));
     
     let fullList = [...inv, ...equipped];

     if (filter !== 'All') {
        fullList = fullList.filter(i => i.type === filter || (filter === 'Loot' && (i.type === 'Material' || i.type === 'Component' || i.type === 'Energy')));
     }

     if (search) {
        fullList = fullList.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));
     }

     return fullList;
  }, [player.inventory, player.equipped, filter, search]);

  const stats = [
    { label: 'POTIONS', val: player.potions, icon: '🧪', color: 'bg-red-500' },
    { label: 'AUTO SCROLLS', val: player.autoScrolls, icon: '🪄', color: 'bg-cyan-500' },
    { label: 'GX TOKENS', val: player.tokens?.toLocaleString(), icon: '🪙', color: 'bg-amber-400' }
  ];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-950 relative overflow-hidden">
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
       
       <Header title="STORAGE CORE: ASSET BAG" onClose={() => setView('menu')} onHelp={() => openGuide('menu')} icon={<Package className="text-emerald-400" />} />

       <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 relative z-10">
          {stats.map(s => (
            <div key={s.label} className="bg-white border-2 border-black p-3 flex justify-between items-center shadow-[4px_4px_0_rgba(0,0,0,1)] group hover:scale-[1.02] transition-transform">
               <div className="flex items-center gap-3">
                  <div className={`${s.color} w-10 h-10 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]`}>
                     <span className="text-xl">{s.icon}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-400 uppercase leading-none">{s.label}</span>
                     <span className="text-lg font-black italic text-black leading-none">{s.val}</span>
                  </div>
               </div>
               <TrendingUp size={16} className="text-slate-100 group-hover:text-slate-200 transition-colors" />
            </div>
          ))}
       </div>

       <div className="flex-1 bg-white border-2 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] flex flex-col min-h-0 relative z-10 text-black">
          <div className="border-b-2 border-slate-100 p-2 flex flex-wrap items-center gap-2 md:gap-4 bg-slate-50/50">
             <div className="flex-1 min-w-[150px] relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="SEARCH ASSETS..." 
                  className="w-full bg-white border border-slate-200 px-8 py-1.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500 rounded-sm"
                />
             </div>
             <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {['All', 'Weapon', 'Armor', 'Headgear', 'Footwear', 'Relic', 'Loot'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-tighter whitespace-nowrap border-2 ${filter === cat ? 'bg-black text-white border-black' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
             {(() => {
                const stacked = processedInventory.reduce((acc, item) => {
                  const baseId = item.id?.split('_')[0] || item.name;
                  const key = `${baseId}-${item.isEquipped}`;
                  const existing = acc.find(i => `${i.id?.split('_')[0] || i.name}-${i.isEquipped}` === key);
                  
                  if (existing && !item.isEquipped) {
                     existing.count += 1;
                  } else {
                     acc.push({ ...item, count: 1 });
                  }
                  return acc;
                }, []);

                return stacked.length > 0 ? (
                  stacked.map((item, idx) => {
                    const master = getMasterData(item);
                    const icon = getItemIcon(item, master);
                    const rarity = master.rarity || item.rarity || 'Common';
                    
                    // Economic Balance: Master Cost * 0.4 fallback to master.sellValue
                    let basePrice = 0;
                    if (master && master.cost) {
                      basePrice = Math.floor(master.cost * 0.4);
                    } else if (master && master.sellValue !== undefined) {
                      basePrice = master.sellValue;
                    } else {
                      basePrice = item.sellValue || Math.floor((item.cost || 0) * 0.4);
                    }

                    return (
                      <div key={`${item.id}-${idx}`} className={`group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-3 border-2 transition-all ${item.isEquipped ? 'bg-cyan-50 border-cyan-500/40 shadow-[4px_4px_0_rgba(34,211,238,0.1)]' : 'bg-slate-50 border-slate-100 hover:border-black/20 hover:bg-white hover:translate-x-1'}`}>
                        <div className="flex items-center gap-3">
                           <div className="relative shrink-0">
                              <div className={`w-14 h-14 border-2 border-black flex items-center justify-center bg-white shadow-[3px_3px_0_rgba(0,0,0,1)] transform group-hover:-rotate-3 transition-transform ${rarity === 'Legendary' ? 'border-amber-400 shadow-[3px_3px_0_rgba(245,158,11,1)]' : rarity === 'Epic' ? 'border-purple-400 shadow-[3px_3px_0_rgba(168,85,247,1)]' : ''}`}>
                                 <span className="text-3xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">{icon}</span>
                              </div>
                              {item.count > 1 && (
                                <span className="absolute -bottom-1 -right-1 bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm border-2 border-white/20 z-10">x{item.count}</span>
                              )}
                           </div>
                           <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                 {item.isEquipped && <div className="bg-black text-white px-1 py-0.5 text-[6px] font-black uppercase flex items-center gap-1 rounded-sm"><ShieldCheck size={8} /> ACTIVE</div>}
                                 <h4 className="text-sm font-black uppercase italic tracking-tighter leading-none">{item.name || 'Unknown Item'}</h4>
                                 <div className="flex gap-1">
                                    <span className="text-[7px] font-black px-1 border border-black/10 bg-slate-100 text-slate-400 uppercase">[{item.type || master.type || 'TECH'}]</span>
                                    <span className={`text-[7px] font-black px-1 border border-black/10 uppercase ${rarity === 'Legendary' ? 'bg-amber-400 text-black' : rarity === 'Epic' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-black'}`}>{rarity}</span>
                                 </div>
                              </div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase leading-none italic mb-2">"{master.description || master.desc || item.desc || "Standard issue tech fragment."}"</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                 {Object.entries(master.stats || item.stats || {}).map(([s, v]) => v !== 0 && (
                                   <div key={s} className="flex items-center gap-1">
                                      <span className="text-[7px] font-black text-slate-300 uppercase">{s}</span>
                                      <span className="text-[8px] font-black text-cyan-600">+{v}</span>
                                   </div>
                                 ))}
                                 {(master.effect || item.effect) && (
                                    <div className="flex items-center gap-1 bg-black text-emerald-400 px-1 rounded-sm">
                                       <Zap size={8} />
                                       <span className="text-[7px] font-black uppercase italic">
                                          {master.effect?.type || item.effect?.type} {master.effect?.mult ? `x${master.effect.mult}` : ''}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                        <div className="flex-1 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
                           <div className="flex flex-col items-center md:items-end">
                              <span className="text-[12px] font-black italic text-amber-600 leading-none">{basePrice} GX</span>
                              <span className="text-[6px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Yield Per Unit</span>
                           </div>
                           <div className="flex gap-1">
                              <button onClick={() => {
                                   if (item.isEquipped) {
                                      const slot = Object.keys(player.equipped || {}).find(k => player.equipped[k]?.id === item.id);
                                      if (slot) unequipItem(slot);
                                   }
                                   sellItem(item.id, 1);
                                }}
                                className="px-3 py-1.5 bg-slate-900 text-white hover:bg-black text-[9px] font-black uppercase italic border-2 border-black transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
                              >Sell 1</button>
                              {!item.isEquipped && item.count > 1 && (
                                <button onClick={() => sellItem(item.id, item.count)}
                                  className="px-3 py-1.5 bg-amber-500 text-black hover:bg-amber-400 text-[9px] font-black uppercase italic border-2 border-black transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
                                >Sell All</button>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Activity size={48} className="animate-pulse mb-4" />
                    <p className="text-sm font-black uppercase tracking-[0.4em] italic">No Assets Linked</p>
                  </div>
                );
             })()}
          </div>
          <div className="bg-black text-slate-500 p-2 text-[8px] font-black flex justify-between items-center">
             <div className="flex gap-4">
                <span>RECORDS: {processedInventory.length}</span>
                <span>SIGNALS: ACTIVE</span>
             </div>
             <div className="flex items-center gap-1 text-cyan-400">
                <span className="animate-pulse">●</span>
                <span>REAL-TIME PERSISTENCE ENABLED</span>
             </div>
          </div>
       </div>

       <div className="mt-4 flex items-center justify-between opacity-30">
          <div className="flex items-center gap-2 text-white italic text-[9px] font-black">
             <span>Neural filtering engaged.</span>
          </div>
          <span className="text-[7px] font-black text-white uppercase tracking-widest leading-none">V2.4.98 INVENTORY CORE</span>
       </div>

       <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
       `}</style>
    </div>
  );
});
