import React from 'react';
import { User, Sparkles } from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const TavernView = () => {
  const { player, TAVERN_MATES, actions, adventure, openGuide } = useGame();
  const { setView } = adventure;
  const { hireMate, dismissMate } = actions;

  return (
    <div className="flex-1 p-6 space-y-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      <Header title="Hero for Hire: Tavern" onClose={adventure.goBack} onHelp={() => openGuide('menu')} />
      
      {player.hiredMate && (
        <div className="bg-purple-950 border-2 border-purple-500 p-2 mb-2 flex items-center justify-between shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-1">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-purple-400 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Current Contract: Active</span>
          </div>
          <button 
            onClick={dismissMate}
            className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 border border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-red-500 active:shadow-none translate-y-0 active:translate-y-0.5 transition-all uppercase italic"
          >
            Terminate Contract
          </button>
        </div>
      )}

      <div className="grid gap-6 relative z-10">
        {TAVERN_MATES.map((mate, index) => {
          const rarityColor = 
            mate.rarity === 'Legendary' ? 'bg-amber-500' :
            mate.rarity === 'Epic' ? 'bg-purple-600' :
            mate.rarity === 'Rare' ? 'bg-blue-600' :
            mate.rarity === 'Uncommon' ? 'bg-emerald-500' : 'bg-slate-400';

          return (
            <div 
              key={mate.id} 
              className={`p-4 md:p-5 bg-white border-[3px] md:border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center group transition-transform hover:-translate-y-1 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
            >
              <div className="space-y-3 w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 ${rarityColor} border-2 border-black overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] group-hover:scale-110 transition-transform`}>
                     <img 
                       src={`/assets/partymemberavatar/${mate.name}.jpg`} 
                       className="w-full h-full object-cover"
                       onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + mate.name; }}
                     />
                  </div>
                  <div className="text-left min-w-0">
                    <span className={`text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 border border-black/20 text-white ${rarityColor} mb-1 inline-block italic`}>{mate.rarity}</span>
                    <h4 className="font-black text-lg md:text-3xl text-black uppercase tracking-tighter italic leading-none truncate">
                      {mate.name}
                    </h4>
                  </div>
                </div>
                <div className="bg-slate-100 p-2 md:p-3 border-2 border-black/10 text-left">
                  <p className="text-[9px] md:text-[11px] text-slate-600 font-black uppercase italic leading-tight">{mate.desc}</p>
                </div>
                {player.hiredMate === mate.id && (
                  <div className="inline-block bg-purple-600 text-white px-3 py-1 border-2 border-black font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] transform -rotate-1 shadow-md">
                    Currently Active
                  </div>
                )}
              </div>
              
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t-2 md:border-t-0 border-black/5">
                <div className="bg-slate-900 text-white px-4 py-1.5 border-2 border-black transform rotate-2 md:rotate-3 relative shadow-sm">
                   <span className="text-xs md:text-base font-black italic">{mate.cost} GX</span>
                </div>
                <button 
                   onClick={() => hireMate(mate)} 
                   disabled={player.hiredMate === mate.id}
                   className={`px-6 md:px-10 py-2.5 md:py-4 border-[3px] border-black font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${player.hiredMate === mate.id ? 'bg-purple-600 text-white border-black' : 'bg-amber-400 text-black hover:bg-amber-300'}`}
                >
                  {player.hiredMate === mate.id ? 'HIRED' : 'RECRUIT'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
