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
      color: 'bg-[var(--neon-cyan)]', 
      npc: 11,
      stat: `${player.tokens || 0} GX`
    },
    { 
      id: 'tavern', 
      name: 'TAVERN', 
      sub: 'RECRUIT TAVERN MATES', 
      icon: <Coffee size={24} />, 
      color: 'bg-[var(--neon-pink)]', 
      npc: 6,
      stat: player.hiredMate ? 'MATE ACTIVE' : 'LFG'
    },
    { 
      id: 'forge', 
      name: 'CYBER FORGE', 
      sub: 'UPGRADE & ENHANCE', 
      icon: <Hammer size={24} />, 
      color: 'bg-[#ffae00]', 
      npc: 12,
      stat: 'READY'
    },
    { 
      id: 'laboratory', 
      name: 'XENON LAB', 
      sub: 'CHEMICAL SYNTHESIS', 
      icon: <FlaskConical size={24} />, 
      color: 'bg-[var(--neon-lime)]', 
      npc: 19,
      stat: 'STABLE'
    },
    { 
      id: 'pets', 
      name: 'CRYSTLE PETS', 
      sub: 'PET SYNC CENTER', 
      icon: <Heart size={24} />, 
      color: 'bg-[#a855f7]', 
      npc: 22,
      stat: activePet ? activePet.name.toUpperCase() : 'NO LINK'
    },
    {
      id: 'market',
      name: 'P2P MARKET',
      sub: 'P2P TRADING HUB',
      icon: <ShoppingCart size={24} />,
      color: 'bg-white',
      npc: 16,
      stat: 'OFFLINE',
      disabled: true
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 bg-[#0f051d] relative overflow-hidden custom-scrollbar">
       {/* ANIME POP Overlay: Grid & Scanlines */}
       <div className="fixed inset-0 pointer-events-none z-[2] opacity-10 bg-scanline"></div>
       <div className="fixed inset-0 pointer-events-none z-[1] opacity-5 bg-cyber-grid"></div>
       
       <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] pointer-events-none" />
       
      <Header title="CRYSTLE BAZAAR" onClose={adventure.goBack} npcNum={11} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-10 z-10 py-4 relative">
        <div className="text-center space-y-3 transform -rotate-1">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-[var(--neon-lime)] rounded-lg border-[3px] border-black rotate-12 shadow-[4px_4px_0px_0px_black]">
               <Gem className="text-black animate-pulse" size={24} />
            </div>
            <h2 className="text-4xl md:text-7xl font-[1000] text-white uppercase italic tracking-tighter drop-shadow-[6px_6px_0_rgba(0,0,0,1)] bungee">Crystle Bazaar</h2>
          </div>
          <div className="flex flex-col items-center">
             <p className="text-[10px] md:text-xs font-black text-[var(--neon-cyan)] uppercase tracking-[0.4em] bg-black border-[3px] border-[var(--neon-cyan)] px-6 py-1.5 rounded-sm italic shadow-[4px_4px_0px_0px_black] bungee">Sector 7 Commercial Node // Online</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 w-full max-w-7xl px-4">
          {districts.map((d, idx) => (
            <button
              key={d.id}
              onClick={() => !d.disabled && setView(d.id)}
              className={`group relative aspect-[9/16] flex flex-col items-center rounded-2xl border-[4px] border-white bg-black transition-all duration-300 shadow-[6px_6px_0px_0px_black] overflow-hidden ${idx % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${d.disabled ? 'opacity-40 cursor-not-allowed grayscale pointer-events-none' : 'hover:-translate-y-2 hover:border-[var(--neon-lime)] hover:shadow-[12px_12px_0px_0px_black]'}`}
            >
               <div className="halftone-overlay absolute inset-0 opacity-10 pointer-events-none"></div>
               {/* CITIZEN BACKGROUND */}
               <div className="absolute inset-0 z-0">
                  <CitizenMedia num={d.npc} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 opacity-60 mix-blend-screen" />
                  <div className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent`} />
               </div>

               {/* UI OVERLAY */}
               <div className="mt-auto w-full p-2.5 pb-4 z-10 flex flex-col items-center gap-2">
                  <div className={`${d.color} p-2.5 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_0px_black] transform -rotate-6 group-hover:rotate-0 transition-transform text-black`}>
                    {d.icon}
                  </div>
                  
                  <div className="bg-white border-[3px] border-black py-1 px-1.5 shadow-[4px_4px_0px_0px_black] rotate-1 transform group-hover:rotate-0 transition-transform w-full">
                     <h3 className="text-[9px] md:text-[11px] font-[1000] text-black uppercase italic tracking-tighter leading-none text-center bungee">{d.name}</h3>
                  </div>

                  <div className="bg-black/80 px-2 py-0.5 rounded border-2 border-white/20">
                     <span className="text-[7px] font-black text-[var(--neon-lime)] uppercase italic tracking-widest bungee">{d.stat}</span>
                  </div>
               </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
