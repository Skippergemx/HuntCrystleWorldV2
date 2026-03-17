import React from 'react';
import { Sword, Shield, HardHat, Footprints, Package, Lock } from 'lucide-react';
import { Header } from './GameUI';

export const ShopView = React.memo(({ SHOP_ITEMS, player, buyItem, setView }) => (
  <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[500px] relative">
    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
    
    <Header title="GX Exchange: Shop" onClose={() => setView('menu')} />
    
    <div className="grid gap-6 relative z-10">
      {SHOP_ITEMS.map((item, index) => {
        const isOwned = item.type !== 'Consumable' && player.equipped?.[item.type]?.id === item.id;
        const isLocked = player.level < (item.reqLvl || 1);
        
        return (
          <div 
            key={item.id} 
            className={`p-5 bg-white border-[4px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] flex justify-between items-center group transition-transform hover:-translate-y-1 ${index % 2 === 0 ? '-rotate-1' : 'rotate-1'} ${isOwned || isLocked ? 'opacity-70' : ''}`}
          >
            <div className="flex gap-4 items-center">
            <div className={`w-12 h-12 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] ${isOwned || isLocked ? 'bg-slate-400 grayscale' : item.type === 'Weapon' ? 'bg-red-500' : item.type === 'Armor' ? 'bg-cyan-500' : item.type === 'Headgear' ? 'bg-blue-500' : item.type === 'Footwear' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                {isOwned || isLocked ? <Lock size={24} className="text-white" /> : (
                  item.type === 'Weapon' ? <Sword size={24} className="text-white" /> : 
                  item.type === 'Armor' ? <Shield size={24} className="text-white" /> : 
                  item.type === 'Headgear' ? <HardHat size={24} className="text-white" /> : 
                  item.type === 'Footwear' ? <Footprints size={24} className="text-white" /> : 
                  <Package size={24} className="text-white" />
                )}
              </div>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xl text-black uppercase tracking-tighter italic leading-none">{item.name}</h4>
                  {isLocked && <span className="text-[7px] bg-red-600 text-white px-1 font-black transform rotate-6 border border-black shadow-sm tracking-tighter">LVL {item.reqLvl} REQ</span>}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-600 font-bold italic leading-tight uppercase mr-12">{item.desc}</p>
                  
                  {item.stats && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(item.stats).map(([key, val]) => {
                        if (val === 0) return null;
                        const label = key.toUpperCase();
                        const color = key === 'str' ? 'bg-red-100 text-red-700 border-red-200' : 
                                      key === 'agi' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                      'bg-blue-100 text-blue-700 border-blue-200';
                        return (
                          <span key={key} className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${color}`}>
                            {label} {val > 0 ? `+${val}` : val}
                          </span>
                        );
                      })}
                      {item.type !== 'Consumable' && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200">
                          REQ LVL {item.reqLvl}
                        </span>
                      )}
                    </div>
                  )}

                  {!item.stats && (
                    <div className="bg-slate-100 px-2 py-1 border border-black/10 inline-block">
                      <p className="text-[9px] text-slate-500 font-black uppercase italic leading-none">
                        {item.id === 'hp_potion' && `STASHED: ${player.potions || 0}`}
                        {item.id === 'auto_scroll' && `STASHED: ${player.autoScrolls || 0}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className={`bg-amber-100 px-3 py-1 border-2 border-black transform rotate-3 relative shadow-sm ${isOwned || isLocked ? 'grayscale opacity-50' : ''}`}>
                 <span className="text-xs font-black text-black">{item.cost} GX</span>
                 {!isOwned && !isLocked && <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[6px] font-black px-1 border border-black transform -rotate-12">NEW!</div>}
              </div>
              <button 
                onClick={() => buyItem(item)} 
                disabled={isOwned || isLocked}
                className={`px-6 py-2 border-[3px] border-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${isOwned || isLocked ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed' : 'bg-cyan-400 text-black hover:bg-cyan-300 hover:scale-105 active:scale-95'}`}
              >
                {isOwned ? 'OWNED' : isLocked ? 'LOCKED' : item.type === 'Consumable' ? 'STOCK UP' : 'BUY NOW'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
));
