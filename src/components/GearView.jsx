import React, { useMemo } from 'react';
import { 
  Sword, 
  Shield, 
  HardHat, 
  Footprints, 
  Zap, 
  Activity, 
  ChevronRight, 
  Trash2,
  TrendingUp,
  Wind,
  Target,
  Flame,
  Star,
  Users,
  Package
} from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const GearView = React.memo(() => {
  const { player, totalStats, actions, adventure, gameLoop, TAVERN_MATES, openGuide, ITEMS, EQUIPMENT, LOOTS } = useGame();
  const { setView } = adventure;
  const { equipItem, unequipItem } = actions;
  const { buffTimeLeft, dragonTimeLeft } = gameLoop;

  const getBaseItemData = (item) => {
    if (!item) return null;
    const baseId = item.id?.replace(/(_\d+)+$/, '');
    
    // Check Master Items DB
    const fromItems = ITEMS.find(i => i.id === baseId);
    if (fromItems) return fromItems;
    
    // Name match fallback
    const byName = ITEMS.find(i => i.name?.toLowerCase() === item.name?.toLowerCase());
    if (byName) return byName;
    
    return item;
  };

  const getItemIcon = (item) => {
    const base = getBaseItemData(item);
    if (base && base.icon) return base.icon;
    return item.icon || '📦';
  };

  const currentMate = TAVERN_MATES.find(m => m.id === player.hiredMate);

  const equipment = useMemo(() => {
    const raw = player.inventory?.filter(i => 
      i && (i.type === 'Weapon' || i.type === 'Armor' || i.type === 'Headgear' || i.type === 'Footwear' || i.type === 'Relic')
    ) || [];
    
    // Grouping by Base ID for stacking
    return raw.reduce((acc, item) => {
      const base = getBaseItemData(item);
      const baseId = base?.id || item.id?.replace(/(_\d+)+$/, '') || item.name;
      const existing = acc.find(i => {
        const iBase = getBaseItemData(i);
        const iBaseId = iBase?.id || i.id?.replace(/(_\d+)+$/, '') || i.name;
        return iBaseId === baseId;
      });
      
      if (existing) {
        existing.count = (existing.count || 1) + 1;
      } else {
        acc.push({ ...item, count: 1 });
      }
      return acc;
    }, []);
  }, [player.inventory, EQUIPMENT, LOOTS]);

  const slots = [
    { id: 'Headgear', label: 'Head', icon: <HardHat className="text-blue-400" /> },
    { id: 'Weapon', label: 'Arms', icon: <Sword className="text-amber-400" /> },
    { id: 'Armor', label: 'Body', icon: <Shield className="text-cyan-400" /> },
    { id: 'Footwear', label: 'Feet', icon: <Footprints className="text-emerald-400" /> },
    { id: 'Relic', label: 'Relic', icon: <Flame className="text-purple-400" /> }
  ];

  // Calculate Stat Breakdowns
  const statBreakdown = useMemo(() => {
    const base = player.baseStats || { str: 10, agi: 10, dex: 10 };
    const gear = { str: 0, agi: 0, dex: 0 };
    
    Object.values(player.equipped || {}).forEach(item => {
      if (item) {
          // Sync stats from master DB if they are missing (for items obtained before loots update)
          const master = getBaseItemData(item);
          const stats = master.stats || item.stats || {};
          gear.str += stats.str || 0;
          gear.agi += stats.agi || 0;
          gear.dex += stats.dex || 0;
      }
    });

    const dragon = (player.dragon?.level || 0) * 5;
    
    let mateMult = { str: 1, agi: 1, dex: 1 };
    if (buffTimeLeft > 0 && currentMate) {
       if (currentMate.type === 'STR') mateMult.str = 2;
       if (currentMate.type === 'AGI') mateMult.agi = 2;
       if (currentMate.type === 'DEX') mateMult.dex = 2;
    }

    return { base, gear, dragon, mateMult, totalStats };
  }, [player, currentMate, buffTimeLeft, totalStats, EQUIPMENT, LOOTS]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      <Header title="TACTICAL LOADOUT" onClose={() => setView('menu')} onHelp={() => openGuide('menu')} icon={<Zap className="text-cyan-400" />} />

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-6">
        
        {/* TOP SECTION: GRID & PREVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT: CHARACTER SLOTS GRID */}
          <div className="bg-slate-900/80 border-2 border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10"><Activity size={80} /></div>
             <p className="text-[10px] font-black uppercase text-cyan-500 italic mb-4 tracking-widest border-b border-white/5 pb-2">Active Signal Slots</p>
             
             <div className="grid grid-cols-3 gap-3">
               {slots.map(slot => {
                  const eq = player.equipped?.[slot.id];
                  const master = eq ? getBaseItemData(eq) : null;
                  const stats = master?.stats || eq?.stats || {};
                  const effect = master?.effect || eq?.effect;

                  return (
                    <div key={slot.id} className="flex flex-col items-center gap-2">
                       <div 
                         onClick={() => eq && unequipItem(slot.id)}
                         className={`w-16 h-16 border-4 flex items-center justify-center relative cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[4px_4px_0_rgba(0,0,0,1)] ${eq ? 'bg-slate-800 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-black border-slate-800 opacity-40'}`}
                       >
                          {eq ? (
                             <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                               {getItemIcon(eq)}
                             </span>
                           ) : slot.icon}
                          {eq && <div className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 border border-black"><Trash2 size={8} /></div>}
                       </div>
                        <div className="text-center w-full min-h-[50px] flex flex-col items-center mt-1 group">
                           <span className="text-[7px] font-black uppercase text-cyan-500/50 tracking-tighter mb-0.5 border-b border-white/5 pb-0.5 w-[40px]">{slot.label}</span>
                           {eq ? (
                             <div className="flex flex-col items-center w-full px-1">
                               <span className="text-[9px] font-black text-white uppercase italic leading-none text-center w-full truncate mb-1" title={eq.name}>
                                 {eq.name}
                               </span>
                               
                               <div className="flex gap-x-1 justify-center scale-[0.8] origin-center">
                                  {Object.entries(stats).map(([s, v]) => v !== 0 && (
                                    <div key={s} className={`flex items-center px-1 py-0.5 rounded border border-black/20 shadow-[1px_1px_0_rgba(0,0,0,1)] ${s === 'str' ? 'bg-red-900/40 border-red-500/30' : s === 'agi' ? 'bg-emerald-900/40 border-emerald-500/30' : 'bg-blue-900/40 border-blue-500/30'}`}>
                                       <span className="text-[6px] font-black text-white uppercase leading-none mr-0.5">{s[0]}</span>
                                       <span className="text-[7px] font-black text-white leading-none">+{v}</span>
                                    </div>
                                  ))}
                               </div>
 
                                {effect && (
                                  <div className="mt-1 bg-cyan-500 text-black px-1 rounded-sm">
                                    <span className="text-[6.5px] font-black uppercase italic tracking-tighter">
                                       ⚡ {effect.type} {effect.mult ? `(x${effect.mult})` : ''}
                                    </span>
                                  </div>
                                )}
                             </div>
                           ) : (
                             <span className="text-[7px] font-black text-slate-800 uppercase tracking-widest mt-2 italic opacity-50">Link Disconnected</span>
                           )}
                        </div>
                    </div>
                  );
               })}
             </div>
          </div>

          {/* RIGHT: DETAILED STAT BREAKDOWN */}
          <div className="bg-white border-2 border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] text-black relative">
            <div className="absolute top-2 right-4 text-[6px] font-black opacity-20 uppercase tracking-widest">Analytics Terminal</div>
            <p className="text-[10px] font-black uppercase text-slate-400 italic mb-4 tracking-widest border-b border-black/5 pb-2">Integrated Attributes</p>
            
            <div className="space-y-4">
               {['str', 'agi', 'dex'].map(s => (
                 <div key={s} className="space-y-1">
                    <div className="flex justify-between items-end">
                       <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase italic ${s === 'str' ? 'text-red-600' : s === 'agi' ? 'text-emerald-600' : 'text-blue-600'}`}>{s}</span>
                          <span className="text-[8px] font-bold text-slate-400">Total Signal</span>
                       </div>
                       <span className="text-xl font-black italic">{totalStats[s]}</span>
                    </div>
                    {/* Visual Breakdown Bar */}
                    <div className="flex h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-black/5">
                       <div style={{ width: `${(statBreakdown.base[s] / totalStats[s]) * 100}%` }} className="bg-slate-800"></div>
                       <div style={{ width: `${(statBreakdown.gear[s] / totalStats[s]) * 100}%` }} className="bg-cyan-500"></div>
                       <div style={{ width: `${(statBreakdown.dragon / totalStats[s]) * 100}%` }} className="bg-emerald-500"></div>
                       {statBreakdown.mateMult[s] > 1 && <div className="flex-1 bg-amber-400 animate-pulse"></div>}
                    </div>
                    {/* Text Breakdown */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 opacity-60">
                       <span className="text-[7px] font-bold">BASE: {statBreakdown.base[s]}</span>
                       <span className="text-[7px] font-bold">GEAR: +{statBreakdown.gear[s]}</span>
                       <span className="text-[7px] font-bold">DRAGON: +{statBreakdown.dragon}</span>
                       {statBreakdown.mateMult[s] > 1 && <span className="text-[7px] font-black text-amber-600 italic">MATE BUFF: x2</span>}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: INVENTORY GRID */}
        <div className="bg-slate-900/40 border-2 border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)]">
           <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <p className="text-[10px] font-black uppercase text-amber-500 italic tracking-widest">Available Tech Inventory</p>
              <div className="flex items-center gap-2">
                 <Package size={12} className="text-slate-500" />
                 <span className="text-[9px] font-black text-slate-500">{equipment.length} Units</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {equipment.length > 0 ? equipment.map((item, idx) => {
                const master = getBaseItemData(item);
                const stats = master.stats || item.stats || {};
                const effect = master.effect || item.effect;
                const desc = master.description || master.desc || item.desc || item.description || "Experimental relic fragment.";

                return (
                <div 
                  key={idx}
                  className="bg-slate-950 border-2 border-white/5 p-3 flex group hover:border-cyan-500/50 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => equipItem(item)}
                >
                   <div className="w-12 h-12 bg-slate-900 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_rgba(0,0,0,1)] relative z-10 transition-transform group-hover:scale-110">
                      <span className="text-2xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                        {getItemIcon(item)}
                      </span>
                      {item.count > 1 && (
                        <span className="absolute -bottom-1 -right-1 bg-black text-white text-[7px] font-black px-1 border border-white/20 z-20">x{item.count}</span>
                      )}
                   </div>
                   
                   <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <div className="flex flex-col min-w-0">
                            <h4 className="text-[10px] font-black text-white uppercase italic tracking-tighter truncate md:max-w-[120px]">{item.name}</h4>
                            <span className="text-[6px] font-black text-slate-500 uppercase">[{item.type || 'TECH'}]</span>
                         </div>
                         <span className={`text-[6px] font-black px-1 border border-black uppercase ${item.rarity === 'Legendary' ? 'bg-amber-500 text-black' : item.rarity === 'Epic' ? 'bg-purple-600 text-white' : item.rarity === 'Rare' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                           {item.rarity || 'Common'}
                         </span>
                      </div>
                       <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                          {Object.entries(stats).map(([s, v]) => v !== 0 && (
                            <span key={s} className="text-[7px] font-black text-cyan-400 uppercase italic">+{v} {s}</span>
                          ))}
                          {effect && (
                            <span className="text-[7px] font-black text-amber-500 uppercase italic border-l border-white/10 pl-2">
                               ⚡ {effect.type}
                               {effect.mult ? ` (x${effect.mult})` : ''}
                               {effect.chance ? ` (${Math.round(effect.chance * 100)}%)` : ''}
                            </span>
                          )}
                       </div>
                       
                       <p className="text-[7px] font-black text-slate-400 uppercase leading-tight mt-1 opacity-80 group-hover:opacity-100 transition-opacity italic">"{desc}"</p>

                      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[7px] font-black text-white bg-cyan-600 px-2 py-0.5 rounded-sm uppercase italic">Install Tech</span>
                         <ChevronRight size={8} className="text-cyan-400" />
                      </div>
                   </div>
                   
                   <div className={`absolute -right-4 -bottom-4 w-12 h-12 blur-2xl opacity-10 group-hover:opacity-30 transition-opacity ${item.rarity === 'Legendary' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>
                </div>
                );
              }) : (
                <div className="col-span-full py-12 flex flex-col items-center opacity-30 italic">
                   <Users size={32} />
                   <p className="text-[10px] font-black uppercase mt-2">No Combat Units in Storage</p>
                </div>
              )}
           </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
});
