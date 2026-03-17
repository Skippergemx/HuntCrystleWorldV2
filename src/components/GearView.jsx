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

export const GearView = React.memo(({ player, totalStats, equipItem, unequipItem, setView, currentMate, buffTimeLeft }) => {
  const equipment = useMemo(() => player.inventory?.filter(i => 
    i.type === 'Weapon' || i.type === 'Armor' || i.type === 'Headgear' || i.type === 'Footwear' || i.type === 'Relic'
  ) || [], [player.inventory]);

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
      if (item && item.stats) {
        gear.str += item.stats.str || 0;
        gear.agi += item.stats.agi || 0;
        gear.dex += item.stats.dex || 0;
      }
    });

    const dragon = (player.dragon?.level || 0) * 5;
    
    let mateMult = { str: 1, agi: 1, dex: 1 };
    if (buffTimeLeft > 0 && currentMate) {
       if (currentMate.type === 'STR') mateMult.str = 2;
       if (currentMate.type === 'AGI') mateMult.agi = 2;
       if (currentMate.type === 'DEX') mateMult.dex = 2;
    }

    return { base, gear, dragon, mateMult };
  }, [player, currentMate, buffTimeLeft]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      <Header title="TACTICAL LOADOUT" onClose={() => setView('menu')} icon={<Zap className="text-cyan-400" />} />

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
                 return (
                   <div key={slot.id} className="flex flex-col items-center gap-2">
                      <div 
                        onClick={() => eq && unequipItem(slot.id)}
                        className={`w-16 h-16 border-4 flex items-center justify-center relative cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[4px_4px_0_rgba(0,0,0,1)] ${eq ? 'bg-slate-800 border-cyan-500' : 'bg-black border-slate-800 opacity-40'}`}
                      >
                         {eq ? (
                           <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                             {slot.id === 'Weapon' ? '⚔️' : slot.id === 'Armor' ? '🛡️' : slot.id === 'Headgear' ? '🦹' : slot.id === 'Footwear' ? '👞' : '🔥'}
                           </span>
                         ) : slot.icon}
                         {eq && <div className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 border border-black"><Trash2 size={8} /></div>}
                      </div>
                      <span className="text-[8px] font-black uppercase italic text-slate-500">{slot.label}</span>
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
              {equipment.length > 0 ? equipment.map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-950 border-2 border-white/5 p-3 flex group hover:border-cyan-500/50 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => equipItem(item)}
                >
                   <div className="w-12 h-12 bg-slate-900 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_rgba(0,0,0,1)] relative z-10 transition-transform group-hover:scale-110">
                      <span className="text-2xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                        {item.id.includes('blade') || item.id.includes('edge') || item.id.includes('hammer') ? '⚔️' : 
                         item.id.includes('plate') || item.id.includes('vest') ? '🛡️' :
                         item.id.includes('helm') || item.id.includes('cap') || item.id.includes('visor') ? '🦹' : 
                         item.id.includes('boots') || item.id.includes('sandals') ? '👞' : '📦'}
                      </span>
                   </div>
                   
                   <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <h4 className="text-[10px] font-black text-white uppercase italic tracking-tighter truncate md:max-w-[100px]">{item.name}</h4>
                         <span className={`text-[6px] font-black px-1 border border-black uppercase ${item.rarity === 'Legendary' ? 'bg-amber-500 text-black' : item.rarity === 'Epic' ? 'bg-purple-600 text-white' : item.rarity === 'Rare' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                           {item.rarity || 'Common'}
                         </span>
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                         {Object.entries(item.stats || {}).map(([s, v]) => v !== 0 && (
                           <span key={s} className="text-[7px] font-black text-cyan-400 uppercase italic">+{v} {s}</span>
                         ))}
                      </div>
                      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[7px] font-black text-white bg-cyan-600 px-2 py-0.5 rounded-sm uppercase italic">Install Tech</span>
                         <ChevronRight size={8} className="text-cyan-400" />
                      </div>
                   </div>
                   
                   {/* Background Glow */}
                   <div className={`absolute -right-4 -bottom-4 w-12 h-12 blur-2xl opacity-10 group-hover:opacity-30 transition-opacity ${item.rarity === 'Legendary' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>
                </div>
              )) : (
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
