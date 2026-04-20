import React, { useMemo } from 'react';
import { User, Package, Shield, BarChart3, Activity, Zap, ShieldAlert, ArrowRight, Brain } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { Header, CitizenMedia } from './GameUI';

export const BiometricCoreView = () => {
  const { player, adventure, totalStats, syncPlayer } = useGame();
  const { setView } = adventure;

  const hasAbilityPoints = (player.abilityPoints || 0) > 0;
  
  const coreModules = [
    {
      id: 'attributes',
      name: 'STAT MATRIX',
      sub: 'ATTRIBUTES & GROWTH',
      icon: <Brain size={24} />,
      color: 'bg-emerald-600',
      npc: 15,
      notification: hasAbilityPoints ? `${player.abilityPoints}PTS` : null,
      desc: 'Inject AP to heighten combat frequency.'
    },
    {
      id: 'inventory',
      name: 'BAG',
      sub: 'INVENTORY & ITEMS',
      icon: <Package size={24} />,
      color: 'bg-amber-600',
      npc: 10,
      desc: 'Visualise obtained grid loot.'
    },
    {
      id: 'gear',
      name: 'GEAR',
      sub: 'RELYS & EQUIPMENT',
      icon: <Shield size={24} />,
      color: 'bg-cyan-600',
      npc: 13,
      desc: 'Equip relics to reinforce your shell.'
    },
    {
      id: 'leaderboard',
      name: 'RANKING',
      sub: 'WORLD LEADERBOARDS',
      icon: <BarChart3 size={24} />,
      color: 'bg-purple-600',
      npc: 1,
      desc: 'Scan current top-tier hunters.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in slide-in-from-right duration-500 bg-[#020617] overflow-y-auto no-scrollbar relative font-black italic">
      {/* Technical Hub Grid */}
      <div className="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none z-0"></div>
      
      <Header title="BIOMETRIC CORE" onClose={adventure.goBack} npcNum={14} />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-10 z-10 py-4 relative">
        <div className="text-center space-y-3 transform -rotate-1">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-cyan-400 rounded-lg border-2 border-black rotate-12 shadow-[3px_3px_0_rgba(0,0,0,1)]">
               <Activity className="text-black animate-pulse" size={24} />
            </div>
            <h2 className="text-4xl md:text-7xl font-[1000] text-white uppercase italic tracking-tighter drop-shadow-[6px_6px_0_rgba(0,0,0,1)]">Biometric Core</h2>
          </div>
          <p className="text-[10px] md:text-xs font-black text-cyan-400 uppercase tracking-[0.4em] bg-black border-2 border-cyan-500/40 px-6 py-1.5 rounded-sm italic shadow-lg">Sector 0 Identity Node // Secured</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-6xl px-4">
          {coreModules.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setView(m.id)}
              className={`group relative aspect-[9/16] flex flex-col items-center rounded-2xl border-[4px] border-black bg-slate-900 transition-all duration-300 hover:-translate-y-2 hover:shadow-[12px_12px_0_rgba(0,0,0,1)] shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden ${idx % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
            >
               {/* CITIZEN BACKGROUND */}
               <div className="absolute inset-0 z-0">
                  <CitizenMedia num={m.npc} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                  <div className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/40 to-transparent`} />
               </div>

               {/* UI OVERLAY */}
               <div className="mt-auto w-full p-2.5 pb-4 z-10 flex flex-col items-center gap-2">
                  <div className={`${m.color} p-2.5 rounded-xl border-[2px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] transform -rotate-6 group-hover:rotate-0 transition-transform relative`}>
                    {m.icon}
                    {m.notification && (
                      <div className="absolute -top-3 -right-3 bg-red-600 border-2 border-black px-1.5 py-0.5 rounded-full animate-bounce">
                         <span className="text-[7px] font-black text-white italic uppercase">{m.notification}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white border-[2px] border-black py-1 px-1.5 shadow-[3px_3px_0_rgba(0,0,0,1)] rotate-1 transform group-hover:rotate-0 transition-transform w-full">
                     <h3 className="text-[9px] md:text-[11px] font-[1000] text-black uppercase italic tracking-tighter leading-none text-center truncate">
                        {m.name}
                     </h3>
                  </div>

                  <div className="bg-black/80 px-2 py-0.5 rounded border border-white/20">
                     <span className="text-[7px] font-black text-cyan-400 uppercase italic tracking-widest leading-none">{m.sub}</span>
                  </div>
               </div>
            </button>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes scanner {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        .animate-scanner {
          position: absolute;
          animation: scanner 4s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};
