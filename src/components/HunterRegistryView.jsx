import React from 'react';
import { Book, BookOpen, Radio, ShieldAlert, ArrowLeft, Terminal, Cpu } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { Header } from './GameUI';

export const HunterRegistryView = () => {
  const { user, adventure } = useGame();
  const { setView } = adventure;
  const isAdmin = user?.email === 'skippergemx@gmail.com';

  const systems = [
    {
      id: 'database',
      name: 'ARCHIVES',
      sub: 'TACTICAL DATABASE',
      icon: <Book size={32} />,
      color: 'bg-slate-700',
      desc: 'Browse monsters, loots, and items.'
    },
    {
      id: 'manual',
      name: 'FIELD MANUAL',
      sub: 'OPERATIONS GUIDE',
      icon: <BookOpen size={32} />,
      color: 'bg-cyan-600',
      desc: 'Learn high-level battle mechanics.'
    },
    {
      id: 'devlog',
      name: 'DEVLOG',
      sub: 'SYSTEM UPDATES',
      icon: <Radio size={32} />,
      color: 'bg-purple-900',
      desc: 'Sector 7 maintenance reports.'
    }
  ];

  if (isAdmin) {
    systems.push({
      id: 'admin',
      name: 'COMMAND CONSOLE',
      sub: 'ADMIN PRIVILEGES',
      icon: <ShieldAlert size={32} />,
      color: 'bg-red-600',
      desc: 'Modify the grid registry.'
    });
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in slide-in-from-bottom duration-500 bg-[#0a0a0a] overflow-hidden relative font-black italic">
      {/* Matrix Code Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden flex flex-wrap gap-4 p-4 text-[10px] text-emerald-500 font-mono">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="animate-pulse">SYS_DUMP_0x{Math.floor(Math.random() * 9999).toString(16)}</div>
        ))}
      </div>
      
      <Header title="HUNTER REGISTRY" onClose={adventure.goBack} npcNum={2} />

      <div className="flex-1 flex flex-col items-center justify-center gap-10 z-10 py-6">
        <div className="text-center space-y-2">
            <h2 className="text-4xl md:text-7xl font-[1000] text-white uppercase italic tracking-tighter drop-shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center gap-4 justify-center">
              <Terminal className="text-emerald-500" size={40} md:size={60} />
              Central System
            </h2>
            <div className="flex flex-col items-center">
              <p className="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-[0.4em] bg-emerald-950/40 px-6 py-1.5 border border-emerald-500/20 rounded-full italic">Encrypted Database // Registry Hub</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl overflow-y-auto px-4 custom-scrollbar lg:pb-0 pb-10">
          {systems.map((s) => (
            <button
              key={s.id}
              onClick={() => setView(s.id)}
              className="group relative bg-[#1a1a1a] border-[3px] border-white/5 p-6 rounded-[2rem] flex items-center gap-6 transition-all hover:border-emerald-500 hover:bg-emerald-950/20 shadow-2xl overflow-hidden text-left"
            >
               <div className={`${s.color} p-4 rounded-2xl border-[3px] border-black transition-transform group-hover:rotate-6 shadow-[4px_4px_0_rgba(0,0,0,1)]`}>
                  {s.icon}
               </div>

               <div className="flex flex-col flex-1">
                  <h3 className="text-2xl font-[1000] text-white uppercase italic tracking-tight group-hover:text-emerald-400 transition-all">{s.name}</h3>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1 mb-2">{s.sub}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase italic">◢ {s.desc}</p>
               </div>

               <div className="bg-white/5 p-2 rounded-full text-white/50 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                 <ArrowLeft className="rotate-180" size={20} />
               </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
            </button>
          ))}
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};
