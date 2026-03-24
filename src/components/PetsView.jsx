import React, { useState } from 'react';
import { Sparkles, ShieldCheck, AlertCircle, Wallet, ArrowRight, Heart, Zap, Star } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { Header } from './GameUI';

export const PetsView = () => {
  const { player, syncPlayer, adventure, wallet, addLog } = useGame();
  const { setView } = adventure;
  const [loading, setLoading] = useState(false);

  const handleAdopt = async (num) => {
    setLoading(true);
    try {
      await syncPlayer({ petId: num, petLevel: 1 });
      addLog(`🐾 COMPANION SECURED: Activated Genesis Pet #${num}!`);
      setView('menu');
    } catch (e) {
      console.error(e);
      addLog("🚨 ADOPTION ERROR: Signal failed.");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 overflow-hidden relative">
      <Header title="Genesis Pets" onClose={() => setView('menu')} />
      
      {!wallet.address ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/50 border-[4px] border-black rounded-3xl text-center shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden group">
           <div className="absolute inset-0 comic-halftone opacity-10 pointer-events-none transition-opacity group-hover:opacity-20"></div>
           <Wallet size={64} className="text-slate-700 mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
           <h3 className="text-3xl font-black text-white uppercase italic mb-4">Uplink Offline</h3>
           <p className="text-white/40 font-black uppercase text-xs italic mb-10 max-w-sm">Secure your Web3 identity via the Identity Core to scan for authorized Genesis NFT tokens.</p>
           <button 
             onClick={() => setView('avatars')}
             className="bg-cyan-600 hover:bg-cyan-500 border-[4px] border-black px-10 py-5 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-4 text-center"
           >
              <Wallet size={24} /> <span className="text-xl font-black text-black uppercase italic">Go To Identity Core</span>
           </button>
        </div>
      ) : !wallet.isGenesisHolder ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-red-950/20 border-[4px] border-black rounded-3xl text-center shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden group">
           <div className="absolute inset-0 comic-halftone opacity-10 text-red-500 pointer-events-none transition-opacity group-hover:opacity-20"></div>
           <AlertCircle size={64} className="text-red-500 mb-6 animate-pulse" />
           <h3 className="text-3xl font-black text-white uppercase italic mb-4">NFT Verification Failed</h3>
           <p className="text-white/40 font-black uppercase text-xs italic mb-8 max-w-sm">No "Genesis Pet" NFT detected in the linked wallet on the Base chaingrid.</p>
           <div className="bg-black/60 px-6 py-4 rounded-xl border-2 border-red-500/20 text-red-400 font-mono text-[10px] break-all max-w-xs">{wallet.address}</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
           {/* GENESIS WELCOME BANNER */}
           <div className="bg-cyan-600 border-[6px] border-black rounded-[40px] p-8 shadow-[12px_12px_0_rgba(0,0,0,1)] relative overflow-hidden shrink-0">
              <div className="absolute inset-0 comic-halftone opacity-30"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="text-center md:text-left text-center">
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-2"><ShieldCheck className="text-black" /> <span className="text-[10px] font-black text-black uppercase italic tracking-widest">Base Identity Verified</span></div>
                    <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase drop-shadow-lg tracking-tighter text-center">Select Your <span className="text-black italic">Companion</span></h2>
                 </div>
                 <div className="bg-black/40 border-2 border-white/20 p-4 rounded-2xl flex gap-6 text-center">
                    <div className="flex flex-col items-center"><Star size={16} className="text-amber-400 mb-1" /><span className="text-[8px] font-black text-white/50 uppercase italic font-center font-center">Genesis Bonus</span><span className="text-xs font-black text-white font-center italic">+10% XP</span></div>
                    <div className="flex flex-col items-center"><Zap size={16} className="text-cyan-400 mb-1" /><span className="text-[8px] font-black text-white/50 uppercase italic font-center font-center font-center">Stat Link</span><span className="text-xs font-black text-white font-center italic">+50 HP</span></div>
                 </div>
              </div>
           </div>

           {/* SELECTION GRID */}
           <div className="flex-1 bg-slate-900/50 border-[4px] border-black rounded-[40px] p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden flex flex-col">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
                 {Array.from({ length: 61 }, (_, i) => i + 1).map((num) => (
                    <button 
                      key={num}
                      onClick={() => handleAdopt(num)}
                      disabled={loading || player.petId === num}
                      className={`aspect-square rounded-2xl border-[3px] overflow-hidden transition-all hover:scale-105 active:scale-95 group relative shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${player.petId === num ? 'border-amber-500 scale-95 opacity-50 ring-4 ring-amber-500/20' : 'border-black hover:border-cyan-400'}`}
                    >
                       <img src={`/assets/pets/genesis-pets/Genesis Pets (${num}).jpg`} className="w-full h-full object-cover" loading="lazy" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                          <span className="text-[8px] font-black text-white uppercase italic">Adopt #{num}</span>
                       </div>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
