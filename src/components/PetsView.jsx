import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, ShieldCheck, AlertCircle, Wallet, ArrowRight, Heart, Zap, Star, Lock } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { Header } from './GameUI';

export const PetsView = () => {
  const { player, syncPlayer, adventure, addLog, PETS_METADATA } = useGame();
  const { setView } = adventure;
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  const handleAdopt = async (num) => {
    const isUnlocked = player.unlockedPets?.includes(num);
    if (!isUnlocked) return addLog("🚨 SIGNAL LOST: You must purify this Crystle first!");

    const petMeta = PETS_METADATA.find(p => p.id === num);
    setLoading(true);
    try {
      await syncPlayer({ petId: num, petLevel: player.petLevel || 1 });
      addLog(`🐾 COMPANION SECURED: Activated ${petMeta?.name || `Crystle Pet #${num}`}!`);
      setSelectedPet(null);
    } catch (e) {
      console.error(e);
      addLog("🚨 ADOPTION ERROR: Signal failed.");
    }
    setLoading(false);
  };

  const selectedPetMeta = selectedPet ? PETS_METADATA.find(p => p.id === selectedPet) : null;
  const isSelectedUnlocked = selectedPetMeta && player.unlockedPets?.includes(selectedPetMeta.id);

  return (
    <div className="flex-1 h-full overflow-hidden relative font-black italic">
       {/* INSPECTION MODAL (COMIC POP-UP) - NOW IN PORTAL FOR ABSOLUTE CENTERING */}
       {selectedPetMeta && createPortal(
         <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
            <div className="max-w-sm w-full bg-white border-[4px] md:border-[6px] border-black p-4 md:p-8 shadow-[10px_10px_0_rgba(0,0,0,1)] relative animate-in zoom-in-95 duration-300 transform -rotate-1 flex flex-col gap-4">
                <button onClick={() => setSelectedPet(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-black text-white border-2 border-white rounded-full flex items-center justify-center font-black text-xl hover:bg-red-600 transition-colors shadow-lg z-[10000]">X</button>
                
                <div className="flex flex-col items-center gap-4">
                   <div className="w-40 h-40 md:w-52 md:h-52 border-4 border-black bg-slate-900 overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,0.2)] relative shrink-0">
                      {!isSelectedUnlocked && (
                         <div className="absolute inset-0 bg-black/70 z-10 flex flex-col items-center justify-center gap-1">
                            <Lock size={32} className="text-white animate-pulse" />
                            <span className="text-white text-[8px] font-black uppercase tracking-widest text-center px-2">Signal Not Found</span>
                         </div>
                      )}
                      <img src={`/assets/pets/genesis-pets/Genesis Pets (${selectedPetMeta.id}).jpg`} className={`w-full h-full object-cover ${!isSelectedUnlocked ? 'grayscale' : ''}`} />
                   </div>
                   
                   <div className="text-center w-full flex flex-col gap-2">
                      <h2 className="text-xl md:text-2xl font-black text-black uppercase italic tracking-tighter underline decoration-4 underline-offset-4">{selectedPetMeta.name}</h2>
                      
                      <div className="flex justify-center gap-2">
                        <div className={`px-2 py-0.5 border-2 border-black/20 text-[8px] font-black uppercase italic ${
                          selectedPetMeta.element === 'Pyro' ? 'bg-orange-100 text-orange-900' :
                          selectedPetMeta.element === 'Hydro' ? 'bg-blue-100 text-blue-900' :
                          selectedPetMeta.element === 'Gale' ? 'bg-purple-100 text-purple-900' :
                          selectedPetMeta.element === 'Earthen' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-900'
                        }`}>EL: {selectedPetMeta.element}</div>
                        <div className="bg-cyan-100 px-2 py-0.5 border-2 border-cyan-900/20 text-[8px] font-black text-cyan-900 uppercase italic">RANK: {selectedPetMeta.rarity}</div>
                      </div>

                      <div className="bg-slate-50 border-2 border-black p-2 text-left relative my-2">
                        <div className="absolute -top-3 left-3 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase">Active Specs</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center"><span className="text-[9px] text-slate-500">EXPERIENCE</span><span className="text-xs font-black text-emerald-600">x{selectedPetMeta.xpMult?.toFixed(2)}</span></div>
                          <div className="flex justify-between items-center"><span className="text-[9px] text-slate-500">VITALITY</span><span className="text-xs font-black text-cyan-600">+{selectedPetMeta.hpBonus} HP</span></div>
                        </div>
                      </div>

                      <button 
                         onClick={() => handleAdopt(selectedPetMeta.id)}
                         disabled={loading || player.petId === selectedPetMeta.id || !isSelectedUnlocked}
                         className={`w-full py-3 transition-all font-black text-base md:text-lg uppercase italic border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 ${
                           !isSelectedUnlocked 
                           ? 'bg-slate-200 text-slate-400 border-slate-300' 
                           : 'bg-black text-white hover:bg-emerald-500 hover:text-black'
                         }`}
                      >
                         {!isSelectedUnlocked ? 'TAMING REQUIRED' : (player.petId === selectedPetMeta.id ? 'ACTIVE' : 'SIGNAL COMPANION')}
                      </button>
                   </div>
                </div>
            </div>
         </div>,
         document.body
       )}

       <div className="flex-1 flex flex-col p-4 md:p-8 animate-in slide-in-from-bottom-10 h-full overflow-hidden relative">
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
                  <h2 className="text-xl md:text-5xl font-black text-black italic uppercase drop-shadow-[2px_2px_0_#fff] md:drop-shadow-[3px_3px_0_#fff] tracking-tighter leading-none">Crystles</h2>
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
               <p className="text-[8px] md:text-[11px] font-black text-black/40 uppercase tracking-widest mt-1 italic">{PETS_METADATA.length} Unique Souls Scanned in Sector</p>
             </div>
             {player.petId && (
                <div className="bg-emerald-500 border-4 border-black px-4 py-2 rounded-xl text-black font-black uppercase text-[10px] md:text-xs shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center gap-2 italic transform rotate-3">
                   <ShieldCheck size={14} /> ACTIVE COMPANION: {PETS_METADATA.find(p => p.id === player.petId)?.name || `#${player.petId}`}
                </div>
             )}
           </div>

           <div className="flex-1 overflow-y-auto px-2 md:px-4 custom-scrollbar pb-10 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8 content-start relative z-10">
              {PETS_METADATA
                .slice()
                .sort((a, b) => {
                  const aUnlocked = player.unlockedPets?.includes(a.id);
                  const bUnlocked = player.unlockedPets?.includes(b.id);
                  const aActive = player.petId === a.id;
                  const bActive = player.petId === b.id;

                  if (aActive) return -1;
                  if (bActive) return 1;
                  if (aUnlocked && !bUnlocked) return -1;
                  if (!aUnlocked && bUnlocked) return 1;
                  return a.id - b.id;
                })
                .map((pet) => {
                  const isUnlocked = player.unlockedPets?.includes(pet.id);
                  return (
                    <button 
                    key={pet.id}
                    onClick={() => setSelectedPet(pet.id)}
                    disabled={loading}
                    className={`
                      group relative aspect-[4/5] rounded-[20px] md:rounded-[30px] border-[4px] md:border-[5px] transition-all duration-300
                      hover:scale-110 active:scale-95 hover:-rotate-3 hover:translate-y-[-10px]
                      ${player.petId === pet.id 
                        ? 'bg-amber-400 border-black shadow-[6px_6px_0_rgba(0,0,0,1)]' 
                        : (isUnlocked ? 'bg-slate-100 border-black shadow-[6px_6px_0_rgba(0,0,0,0.3)] hover:shadow-[12px_12px_0_rgba(0,0,0,0.5)] border-black hover:bg-white' : 'bg-slate-200 border-slate-300 grayscale opacity-80')}
                    `}
                  >
                    {/* Character Frame */}
                    <div className="absolute inset-2 md:inset-3 border-[2px] md:border-[3px] border-black rounded-[15px] md:rounded-[22px] overflow-hidden bg-white shadow-inner relative">
                        <img 
                          src={`/assets/pets/genesis-pets/Genesis Pets (${pet.id}).jpg`} 
                          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-125 ${player.petId === pet.id ? 'filter-none' : (isUnlocked ? 'grayscale-[0.4] group-hover:grayscale-0' : 'grayscale')}`} 
                          loading="lazy" 
                        />
                        {/* ID Badge */}
                        <div className="absolute top-1 md:top-2 left-1 md:left-2 bg-black text-white px-1.5 md:px-2 py-0.5 rounded-lg text-[6px] md:text-[9px] font-black italic border-2 border-white shadow-lg">#{pet.id}</div>
                        
                        {!isUnlocked && (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Lock size={20} className="text-white drop-shadow-md" />
                           </div>
                        )}

                        {/* Element Icon Badge */}
                        <div className={`absolute top-1 md:top-2 right-1 md:right-2 w-4 h-4 md:w-6 md:h-6 rounded-full border-2 border-black flex items-center justify-center text-[8px] md:text-[10px] shadow-lg ${
                            pet.element === 'Pyro' ? 'bg-orange-500' :
                            pet.element === 'Hydro' ? 'bg-blue-500' :
                            pet.element === 'Gale' ? 'bg-purple-500' :
                            pet.element === 'Earthen' ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}>
                            {pet.element === 'Pyro' ? '🔥' : pet.element === 'Hydro' ? '💧' : pet.element === 'Gale' ? '⚡' : pet.element === 'Earthen' ? '⛰️' : '✨'}
                        </div>
                    </div>

                    {/* Status/Adopt Label */}
                    <div className={`
                      absolute -bottom-2 left-1/2 -translate-x-1/2 w-[85%] md:w-[90%]
                      px-2 py-1.5 md:py-2.5 rounded-xl border-[2px] md:border-[3px] border-black font-black uppercase text-[7px] md:text-[10px] italic shadow-md
                      transition-all duration-300 group-hover:scale-110
                      ${player.petId === pet.id 
                        ? 'bg-black text-amber-400' 
                        : (isUnlocked ? 'bg-black text-white group-hover:bg-cyan-500 group-hover:text-black' : 'bg-slate-400 text-slate-100')}
                    `}>
                        {player.petId === pet.id ? 'ACTIVE' : (isUnlocked ? 'READY' : 'LOCKED')}
                    </div>
                </button>
                );
              })}
           </div>
        </div>
      </div>

      <style>{`
        .xs\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        @media (min-width: 480px) { .xs\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      `}</style>
      </div>
    </div>
  );
};
