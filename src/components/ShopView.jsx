import React from 'react';
import { Sword, Shield, HardHat, Footprints, Package, Lock } from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const ShopView = React.memo(() => {
  const { player, actions, adventure, openGuide, SHOP_ITEMS } = useGame();
  const { setView } = adventure;
  const { buyItem } = actions;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[500px] relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      
      <Header title="GX Exchange: Shop" onClose={() => setView('menu')} onHelp={() => openGuide('menu')} />
      
      <div className="grid gap-6 relative z-10">
        {SHOP_ITEMS.map((item, index) => {
          const isEquipped = item.type !== 'Consumable' && player.equipped?.[item.type]?.id === item.id;
          const isLocked = player.level < (item.reqLvl || 1);
          
          return (
            <div 
              key={item.id} 
              className={`p-4 md:p-5 bg-white border-[3px] md:border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center group transition-transform hover:-translate-y-1 ${index % 2 === 0 ? '-rotate-1' : 'rotate-1'} ${isLocked ? 'opacity-70' : ''}`}
            >
              <div className="flex flex-row gap-4 items-center w-full md:w-auto">
                <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] ${isEquipped || isLocked ? 'bg-slate-400 grayscale' : item.type === 'Weapon' ? 'bg-red-500' : item.type === 'Armor' ? 'bg-cyan-500' : item.type === 'Headgear' ? 'bg-blue-500' : item.type === 'Footwear' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                    {isEquipped || isLocked ? <Lock size={20} className="text-white md:size-24" /> : (
                      <span className="text-2xl md:text-3xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        {item.icon || (
                          item.type === 'Weapon' ? <Sword size={20} className="text-white md:size-24" /> : 
                          item.type === 'Armor' ? <Shield size={20} className="text-white md:size-24" /> : 
                          item.type === 'Headgear' ? <HardHat size={20} className="text-white md:size-24" /> : 
                          item.type === 'Footwear' ? <Footprints size={20} className="text-white md:size-24" /> : 
                          <Package size={20} className="text-white md:size-24" />
                        )}
                      </span>
                    )}
                </div>
                <div className="space-y-1 text-left min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-lg md:text-xl text-black uppercase tracking-tighter italic leading-none truncate">{item.name}</h4>
                    {isLocked && <span className="text-[7px] bg-red-600 text-white px-1 font-black transform rotate-6 border border-black shadow-sm tracking-tighter">LVL {item.reqLvl} REQ</span>}
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <p className="text-[9px] md:text-[10px] text-slate-600 font-bold italic leading-tight uppercase line-clamp-2 md:mr-12">{item.description}</p>
                    
                    {item.stats && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(item.stats).map(([key, val]) => {
                          if (val === 0) return null;
                          const label = key.toUpperCase();
                          const color = key === 'str' ? 'bg-red-100 text-red-700 border-red-200' : 
                                        key === 'agi' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                        'bg-blue-100 text-blue-700 border-blue-200';
                          return (
                            <span key={key} className={`text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded border ${color}`}>
                              {label} {val > 0 ? `+${val}` : val}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 w-full md:w-auto pt-3 md:pt-0 border-t-2 md:border-t-0 border-black/5 mt-1 md:mt-0">
                <div className={`bg-amber-100 px-3 py-1 border-2 border-black transform rotate-2 md:rotate-3 relative shadow-sm ${isLocked ? 'grayscale opacity-50' : ''}`}>
                   <span className="text-xs font-black text-black italic">{item.cost} GX</span>
                   {!isEquipped && !isLocked && <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[6px] font-black px-1 border border-black transform -rotate-12">NEW!</div>}
                </div>
                <button 
                  onClick={() => buyItem(item)} 
                  disabled={isLocked}
                  className={`px-6 md:px-8 py-2 md:py-3 border-[3px] border-black font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${isLocked ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed' : 'bg-cyan-400 text-black hover:bg-cyan-300 hover:scale-105 active:scale-95 italic'}`}
                >
                  {isLocked ? 'LOCKED' : isEquipped ? 'EQUIPPED' : 'BUY UNIT'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
