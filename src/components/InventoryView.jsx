import React from 'react';
import { Coffee, MousePointer } from 'lucide-react';
import { Header } from './GameUI';

export const InventoryView = ({ player, setView, sellItem }) => (
  <div className="flex-1 p-6 space-y-6 relative overflow-hidden">
     <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
     <Header title="STORAGE CORE: BAG" onClose={() => setView('menu')} />
     <div className="grid grid-cols-2 gap-4 relative z-10 overflow-y-auto max-h-[85vh] pr-2">
        <div className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] transform -rotate-1">
           <div className="flex justify-between items-start mb-2">
             <div className="p-2 bg-red-600 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                <Coffee size={20} className="text-white" />
             </div>
             <span className="text-2xl font-black italic text-black">{player.potions || 0}</span>
           </div>
           <p className="text-xs font-black uppercase text-black italic">Potions</p>
           <p className="text-[8px] font-black text-slate-500 uppercase mt-1 leading-tight italic">Restores vital core integrity.</p>
        </div>
        <div className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] transform rotate-1">
           <div className="flex justify-between items-start mb-2">
             <div className="p-2 bg-cyan-600 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                <MousePointer size={20} className="text-black" />
             </div>
             <span className="text-2xl font-black italic text-black">{player.autoScrolls || 0}</span>
           </div>
           <p className="text-xs font-black uppercase text-black italic">Auto Scrolls</p>
           <p className="text-[8px] font-black text-slate-500 uppercase mt-1 leading-tight italic">Automates offensive protocols.</p>
        </div>
        
        <div className="col-span-2 bg-slate-100 border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] mt-4">
           <p className="text-[10px] font-black uppercase text-black italic opacity-50 mb-3 border-b-2 border-black/10 pb-1">Equipped Gear</p>
           <div className="space-y-3">
              {Object.entries(player.equipped || {}).map(([slot, item]) => (
                <div key={slot} className="flex justify-between items-center text-black italic">
                   <span className="text-[10px] font-black uppercase text-slate-400">{slot}</span>
                   <span className="font-black text-sm uppercase">{item ? item.name : 'Empty Slot'}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="col-span-2 bg-white border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] mt-4">
           <p className="text-[10px] font-black uppercase text-black italic opacity-50 mb-3 border-b-2 border-black/10 pb-1">Stacked Artifacts & Materials</p>
           <div className="grid grid-cols-1 gap-2">
              {(() => {
                const stacked = (player.inventory || []).filter(i => i && typeof i === 'object').reduce((acc, item) => {
                  const existing = acc.find(i => i.id === item.id);
                  if (existing) existing.count += 1;
                  else acc.push({ ...item, count: 1 });
                  return acc;
                }, []);

                return stacked.length > 0 ? (
                  stacked.map((item, idx) => (
                    <div key={idx} className="flex flex-col bg-slate-50 p-3 border-2 border-black/10 transform rotate-0.5 hover:rotate-0 transition-all hover:bg-slate-100">
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                                <span className="text-3xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">{item.icon}</span>
                                {item.count > 1 && (
                                  <span className="absolute -bottom-1 -right-1 bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm border-2 border-white/20">x{item.count}</span>
                                )}
                            </div>
                             <div className="flex flex-col ml-1">
                              <span className="font-black text-sm uppercase leading-none text-black italic">{item.name || 'Unknown Artifact'}</span>
                              <span className={`text-[8px] font-black leading-none mt-1.5 uppercase tracking-widest ${item.rarity === 'Legendary' ? 'text-amber-600' : item.rarity === 'Epic' ? 'text-purple-600' : item.rarity === 'Rare' ? 'text-blue-600' : 'text-slate-500'}`}>
                                {item.rarity || 'Common'} • {item.type || 'Material'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black text-amber-600 italic">{item.sellValue || 0} GX</p>
                             <p className="text-[7px] text-slate-400 font-bold uppercase mt-0.5">Value Per Unit</p>
                          </div>
                       </div>
                       
                       <div className="flex gap-2 mt-1 pt-2 border-t border-black/5">
                          <button 
                            onClick={() => sellItem(item.id, 1)}
                            className="flex-1 bg-slate-200 hover:bg-slate-300 text-black border-2 border-black py-1 text-[9px] font-black uppercase italic transition-all active:translate-y-0.5 shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none"
                          >
                            Sell 1
                          </button>
                          {item.count > 1 && (
                            <button 
                              onClick={() => sellItem(item.id, item.count)}
                              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black border-2 border-black py-1 text-[9px] font-black uppercase italic transition-all active:translate-y-0.5 shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none"
                            >
                              Sell All ({item.count * (item.sellValue || 0)} GX)
                            </button>
                          )}
                       </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] text-center text-slate-400 font-black italic py-10 opacity-60 uppercase tracking-widest">Storage Core is empty</p>
                );
              })()}
           </div>
        </div>
     </div>
  </div>
);
