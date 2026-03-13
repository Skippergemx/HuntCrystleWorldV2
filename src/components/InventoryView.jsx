import React from 'react';
import { Coffee, MousePointer } from 'lucide-react';
import { Header } from './GameUI';

export const InventoryView = ({ player, setView }) => (
  <div className="flex-1 p-6 space-y-6 relative overflow-hidden">
     <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
     <Header title="STORAGE CORE: BAG" onClose={() => setView('menu')} />
     <div className="grid grid-cols-2 gap-4 relative z-10">
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

       <div className="col-span-2 bg-white border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] mt-4 max-h-[200px] overflow-y-auto">
          <p className="text-[10px] font-black uppercase text-black italic opacity-50 mb-3 border-b-2 border-black/10 pb-1">Gathered Loots</p>
          <div className="grid grid-cols-1 gap-2">
             {(player.inventory || []).length > 0 ? (
               player.inventory.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center text-black italic bg-slate-50 p-2 border-2 border-black/5 transform rotate-0.5 hover:rotate-0 transition-transform">
                    <div className="flex items-center gap-2">
                      <span className="text-lg filter drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">{item.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-black text-[10px] uppercase leading-none">{item.name}</span>
                        <span className="text-[7px] font-black text-slate-400 leading-none mt-0.5">{item.rarity}</span>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1 border border-amber-200">{item.sellValue} GX</span>
                 </div>
               ))
             ) : (
               <p className="text-[9px] text-center text-slate-400 font-black italic py-4">Your bag is empty of treasures...</p>
             )}
          </div>
       </div>
     </div>
  </div>
);
