import React from 'react';
import { ShoppingBag, Coffee, Hammer, FlaskConical, Heart, ShoppingCart, ArrowLeft, Gem } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { Header, CitizenMedia } from './GameUI';

export const CrystleBazaarView = () => {
  const { player, adventure, PETS_METADATA } = useGame();
  const { setView } = adventure;

  const activePet = player.petId ? PETS_METADATA.find(p => p.id === player.petId) : null;

  const districts = [
    { 
      id: 'shop', 
      name: 'SHOP', 
      sub: 'REAGENT & GEAR SUPPLY', 
      icon: <ShoppingBag size={24} />, 
      color: 'bg-amber-600', 
      npc: 11,
      stat: `${player.tokens || 0} GX`
    },
    { 
      id: 'tavern', 
      name: 'TAVERN', 
      sub: 'RECRUIT TAVERN MATES', 
      icon: <Coffee size={24} />, 
      color: 'bg-rose-600', 
      npc: 6,
      stat: player.hiredMate ? 'MATE ACTIVE' : 'LFG'
    },
    { 
      id: 'forge', 
      name: 'CYBER FORGE', 
      sub: 'UPGRADE & ENHANCE', 
      icon: <Hammer size={24} />, 
      color: 'bg-blue-600', 
      npc: 12,
      stat: 'READY'
    },
    { 
      id: 'laboratory', 
      name: 'XENON LAB', 
      sub: 'CHEMICAL SYNTHESIS', 
      icon: <FlaskConical size={24} />, 
      color: 'bg-emerald-600', 
      npc: 19,
      stat: 'STABLE'
    },
    { 
      id: 'pets', 
      name: 'CRYSTLE PETS', 
      sub: 'PET SYNC CENTER', 
      icon: <Heart size={24} />, 
      color: 'bg-purple-600', 
      npc: 22,
      stat: activePet ? activePet.name.toUpperCase() : 'NO LINK'
    },
    { 
      id: 'market', 
      name: 'P2P MARKET', 
      sub: 'P2P TRADING HUB', 
      icon: <ShoppingCart size={24} />, 
      color: 'bg-cyan-600', 
      npc: 16,
      stat: 'LIVE'
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 bg-[#020617] overflow-y-auto no-scrollbar relative font-black italic">
      {/* Metaverse Perspective Grid */}
      <div className="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none z-0"></div>
      
      <Header title="CRYSTLE BAZAAR" onClose={adventure.goBack} npcNum={11} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-10 z-10 py-4 relative">
        <div className="text-center space-y-3 transform -rotate-1">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-amber-400 rounded-lg border-2 border-black rotate-12 shadow-[3px_3px_0_rgba(0,0,0,1)]">
               <Gem className="text-black animate-pulse" size={24} />
            </div>
            <h2 className="text-4xl md:text-7xl font-[1000] text-white uppercase italic tracking-tighter drop-shadow-[6px_6px_0_rgba(0,0,0,1)]">Crystle Bazaar</h2>
          </div>
          <div className="flex flex-col items-center">
             <p className="text-[10px] md:text-xs font-black text-cyan-400 uppercase tracking-[0.4em] bg-black border-2 border-cyan-500/40 px-6 py-1.5 rounded-sm italic shadow-lg">Sector 7 Commercial Node // Online</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 w-full max-w-7xl px-4">
          {districts.map((d, idx) => (
            <button
              key={d.id}
              onClick={() => setView(d.id)}
              className={`group relative aspect-[9/16] flex flex-col items-center rounded-2xl border-[4px] border-black bg-slate-900 transition-all duration-300 hover:-translate-y-2 hover:shadow-[12px_12px_0_rgba(0,0,0,1)] shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden ${idx % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
            >
               {/* CITIZEN BACKGROUND */}
               <div className="absolute inset-0 z-0">
                  <CitizenMedia num={d.npc} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                  <div className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent`} />
               </div>

               {/* UI OVERLAY */}
               <div className="mt-auto w-full p-2.5 pb-4 z-10 flex flex-col items-center gap-2">
                  <div className={`${d.color} p-2.5 rounded-xl border-[2px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] transform -rotate-6 group-hover:rotate-0 transition-transform`}>
                    {d.icon}
                  </div>
                  
                  <div className="bg-white border-[2px] border-black py-1 px-1.5 shadow-[3px_3px_0_rgba(0,0,0,1)] rotate-1 transform group-hover:rotate-0 transition-transform w-full">
                     <h3 className="text-[9px] md:text-[11px] font-[1000] text-black uppercase italic tracking-tighter leading-none text-center">{d.name}</h3>
                  </div>

                  <div className="bg-black/80 px-2 py-0.5 rounded border border-white/20">
                     <span className="text-[7px] font-black text-white uppercase italic tracking-widest">{d.stat}</span>
                  </div>
               </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
