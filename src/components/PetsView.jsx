import React, { useState } from 'react';
import { Sparkles, ShieldCheck, AlertCircle, Wallet, ArrowRight, Heart, Zap, Star } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { Header } from './GameUI';

export const PetsView = () => {
  const { player, syncPlayer, adventure, addLog } = useGame();
  const { setView } = adventure;
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  const handleAdopt = async (num) => {
    setLoading(true);
    try {
      await syncPlayer({ petId: num, petLevel: player.petLevel || 1 });
      addLog(`🐾 COMPANION SECURED: Activated Crystle Pet #${num}!`);
      setSelectedPet(null);
    } catch (e) {
      console.error(e);
      addLog("🚨 ADOPTION ERROR: Signal failed.");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in slide-in-from-bottom-10 h-full overflow-hidden relative font-black italic">
       {/* INSPECTION MODAL (COMIC POP-UP) */}
       {selectedPet && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="max-w-md w-full bg-white border-[6px] border-black p-6 md:p-10 shadow-[15px_15px_0_rgba(0,0,0,1)] relative animate-in zoom-in-95 duration-300 transform -rotate-1">
                <button onClick={() => setSelectedPet(null)} className="absolute -top-6 -right-6 w-12 h-12 bg-black text-white border-4 border-white rounded-full flex items-center justify-center font-black text-2xl hover:bg-red-600 transition-colors shadow-lg">X</button>
                
                <div className="flex flex-col items-center gap-6">
                   <div className="w-full aspect-square border-4 border-black bg-slate-900 overflow-hidden shadow-[6px_6px_0_rgba(0,0,0,0.2)]">
                      <img src={`/assets/pets/genesis-pets/Genesis Pets (${selectedPet}).jpg`} className="w-full h-full object-cover" />
                   </div>
                   
                   <div className="text-center w-full">
                      <h2 className="text-3xl font-black text-black uppercase italic tracking-tighter mb-2 underline decoration-4 underline-offset-4">Genesis Pet #{selectedPet}</h2>
                      <div className="flex justify-center gap-4 mb-6">
                        <div className="bg-amber-100 px-3 py-1 border-2 border-amber-900/20 text-xs font-black text-amber-900 uppercase italic">Rank: Genesis</div>
                        <div className="bg-cyan-100 px-3 py-1 border-2 border-cyan-900/20 text-xs font-black text-cyan-900 uppercase italic">Class: Companion</div>
                      </div>

                      <div className="bg-slate-50 border-2 border-black p-4 text-left mb-6 relative">
                        <div className="absolute -top-3 left-4 bg-black text-white px-2 py-0.5 text-[8px] font-black uppercase">Combat Specs</div>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500">EXP MULTIPLIER</span><span className="text-sm font-black text-emerald-600">x1.10</span></div>
                          <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500">CORE VITALITY</span><span className="text-sm font-black text-cyan-600">+50 HP</span></div>
                        </div>
                      </div>

                      <button 
                         onClick={() => handleAdopt(selectedPet)}
                         disabled={loading || player.petId === selectedPet}
                         className="w-full py-4 bg-black text-white hover:bg-emerald-500 hover:text-black transition-all font-black text-xl uppercase italic border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30"
                      >
                         {player.petId === selectedPet ? 'CURRENTLY ACTIVE' : 'SIGNALIZE COMPANION'}
                      </button>
                   </div>
                </div>
            </div>
         </div>
       )}
      {/* CRYSTLE BACKGROUND DEPTH */}
      <div className="absolute inset-0 bg-slate-950 z-0">
        <div className="absolute inset-0 opacity-10 comic-halftone pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1.5px, transparent 1.5px)', backgroundSize: '15px 15px' }}></div>
        <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-cyan-950/40 to-transparent"></div>
      </div>

      <Header title="PET SANCTUARY" onClose={adventure.goBack} />
      
      <div className="flex-1 flex flex-col gap-4 md:gap-8 overflow-hidden z-10 relative">
        {/* CRYSTLE WELCOME BANNER (COMICAL STYLE) */}
        <div className="bg-amber-400 border-[4px] md:border-[6px] border-black rounded-[20px] md:rounded-[40px] p-4 md:p-8 shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_rgba(0,0,0,1)] relative overflow-hidden shrink-0 transform rotate-1 group">
            <div className="absolute inset-0 comic-halftone opacity-20 group-hover:rotate-12 transition-transform duration-1000"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-1 md:mb-2">
                    <Heart size={12} className="text-red-600 fill-red-600 animate-pulse md:w-[14px]" /> 
                    <span className="text-[7px] md:text-[10px] font-black text-black uppercase tracking-[0.2em] italic">Companion Subsystem Online</span>
                  </div>
                  <h2 className="text-xl md:text-5xl font-black text-black italic uppercase drop-shadow-[2px_2px_0_#fff] md:drop-shadow-[3px_3px_0_#fff] tracking-tighter leading-none">Crystle <span className="underline decoration-4 md:decoration-[6px] decoration-black">Academy</span></h2>
              </div>
              <div className="flex gap-2 md:gap-6">
                  <div className="bg-black/10 border-2 border-black/20 p-2 md:p-3 rounded-lg md:rounded-xl flex flex-col items-center min-w-[50px] md:min-w-[80px]">
                    <div className="flex items-center gap-1"><Star size={8} className="text-black md:w-[10px]" /><span className="text-[9px] md:text-sm font-black text-black">10%</span></div>
                    <span className="text-[5px] md:text-[8px] font-black text-black/50 uppercase">XP GAIN</span>
                  </div>
                  <div className="bg-black text-white border-2 border-black p-2 md:p-3 rounded-lg md:rounded-xl flex flex-col items-center min-w-[50px] md:min-w-[80px] shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-1"><Zap size={8} className="text-cyan-400 md:w-[10px]" /><span className="text-[9px] md:text-sm font-black text-white">+50</span></div>
                    <span className="text-[5px] md:text-[8px] font-black text-white/40 uppercase">HP CORE</span>
                  </div>
              </div>
            </div>
        </div>

        {/* COMPANION REGISTRY (GRID) */}
        <div className="flex-1 bg-white border-[6px] border-black rounded-[30px] md:rounded-[50px] p-4 md:p-10 shadow-[10px_10px_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative transform -rotate-0.5">
           <div className="absolute inset-0 opacity-[0.03] comic-halftone pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
           
           <div className="mb-4 md:mb-8 flex justify-between items-center relative z-10 px-2">
             <div className="flex flex-col">
               <h3 className="text-lg md:text-2xl font-black text-black uppercase italic leading-none tracking-tighter">Genesis Squad</h3>
               <p className="text-[8px] md:text-[11px] font-black text-black/40 uppercase tracking-widest mt-1 italic">60 Unique Souls Scanned in Sector</p>
             </div>
             {player.petId && (
                <div className="bg-emerald-500 border-4 border-black px-4 py-2 rounded-xl text-black font-black uppercase text-[10px] md:text-xs shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center gap-2 italic transform rotate-3">
                   <ShieldCheck size={14} /> ACTIVE COMPANION: #{player.petId}
                </div>
             )}
           </div>

           <div className="flex-1 overflow-y-auto px-2 md:px-4 custom-scrollbar pb-10 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8 content-start relative z-10">
              {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => (
                <button 
                  key={num}
                  onClick={() => setSelectedPet(num)}
                  disabled={loading}
                  className={`
                    group relative aspect-[4/5] rounded-[20px] md:rounded-[30px] border-[4px] md:border-[5px] transition-all duration-300
                    hover:scale-110 active:scale-95 hover:-rotate-3 hover:translate-y-[-10px]
                    ${player.petId === num 
                      ? 'bg-amber-400 border-black shadow-[6px_6px_0_rgba(0,0,0,1)]' 
                      : 'bg-slate-100 border-black shadow-[6px_6px_0_rgba(0,0,0,0.3)] hover:shadow-[12px_12px_0_rgba(0,0,0,0.5)] border-black hover:bg-white'}
                  `}
                >
                    {/* Character Frame */}
                    <div className="absolute inset-2 md:inset-3 border-[2px] md:border-[3px] border-black rounded-[15px] md:rounded-[22px] overflow-hidden bg-white shadow-inner relative">
                        <img 
                          src={`/assets/pets/genesis-pets/Genesis Pets (${num}).jpg`} 
                          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-125 ${player.petId === num ? 'filter-none' : 'grayscale-[0.4] group-hover:grayscale-0'}`} 
                          loading="lazy" 
                        />
                        {/* ID Badge */}
                        <div className="absolute top-1 md:top-2 left-1 md:left-2 bg-black text-white px-1.5 md:px-2 py-0.5 rounded-lg text-[6px] md:text-[9px] font-black italic border-2 border-white shadow-lg">#{num}</div>
                    </div>

                    {/* Status/Adopt Label */}
                    <div className={`
                      absolute -bottom-2 left-1/2 -translate-x-1/2 w-[85%] md:w-[90%]
                      px-2 py-1.5 md:py-2.5 rounded-xl border-[2px] md:border-[3px] border-black font-black uppercase text-[7px] md:text-[10px] italic shadow-md
                      transition-all duration-300 group-hover:scale-110
                      ${player.petId === num 
                        ? 'bg-black text-amber-400' 
                        : 'bg-black text-white group-hover:bg-cyan-500 group-hover:text-black'}
                    `}>
                        {player.petId === num ? 'ACTIVE SQUAD' : 'ENROLL NOW'}
                    </div>
                </button>
              ))}
           </div>
        </div>
      </div>

      <style>{`
        .xs\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        @media (min-width: 480px) { .xs\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      `}</style>
    </div>
  );
};
