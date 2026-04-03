import React, { useState } from 'react';
import { User, Wallet, Link, Unlink, ShieldCheck, Globe, AlertTriangle, Smartphone, ExternalLink } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const IdentityView = React.memo(() => {
  const { player, syncPlayer, adventure, addLog, openGuide, wallet, farcasterContext, linkWallet } = useGame();
  const { setView } = adventure;
  const [showRedirectHelp, setShowRedirectHelp] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleManualLink = async (address) => {
    if (!address || isLinking) return;
    setIsLinking(true);
    setLocalError(null);
    
    const result = await linkWallet(address);
    if (result.success) {
      addLog("Uplink Established.");
    } else {
      setLocalError(result.error);
    }
    setIsLinking(false);
  };

   // --- LOCAL WATCHER DEPRECATED V3 ---
   // All browser wallet connections are now globally scanned by the GameContext Sentry.

  return (
    <div className="flex-1 p-6 space-y-6 flex flex-col items-center justify-start overflow-y-auto max-h-[600px] relative no-scrollbar">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
      <Header title="Identity Core" onClose={() => setView('menu')} onHelp={() => openGuide('menu')} />
      
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* --- HERO AVATAR SECTION --- */}
        <div className="w-40 h-56 mb-4 rounded-2xl border-[3px] border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] overflow-hidden relative group">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none"></div>
          {player.avatar ? <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover relative z-0" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={48} className="text-slate-500" /></div>}
          
          {/* UPLINK STATUS BADGE */}
          {player.walletAddress ? (
            <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md rounded shadow-[0_0_10px_rgba(16,185,129,0.3)]">
               <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
               <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest italic">UPLINK_ACTIVE</span>
            </div>
          ) : (
            <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 border border-red-500/40 backdrop-blur-md rounded shadow-[0_0_10px_rgba(239,68,68,0.3)]">
               <div className="w-1 h-1 bg-red-500 rounded-full opacity-50"></div>
               <span className="text-[7px] font-black text-red-400 uppercase tracking-widest italic">UPLINK_OFFLINE</span>
            </div>
          )}
          
          <p className="absolute bottom-3 inset-x-0 text-center text-[10px] font-black tracking-[0.4em] uppercase text-cyan-400 z-20 drop-shadow-md">Active_Hunter</p>
        </div>

        {/* --- WALLET UPLINK & CONFLICT RESOLUTION --- */}
        <div className="w-full mb-6 relative">
          {(player.walletConflict || localError) ? (
            // --- CONFLICT BLOCK STATE ---
            <div className="bg-red-950/40 border-2 border-red-500/50 rounded-2xl p-4 animate-in zoom-in duration-300">
               <div className="flex items-center gap-3 mb-3">
                  <div className="bg-red-500 p-2 rounded-lg text-white">
                     <AlertTriangle size={20} />
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black text-white uppercase italic leading-none">Uplink_Blockade</h4>
                     <p className="text-[7px] font-bold text-red-400 uppercase tracking-widest">Security Protocol Triggered</p>
                  </div>
               </div>
               
               <p className="text-[9px] font-black text-red-200 uppercase leading-relaxed mb-4 p-2 bg-red-900/30 rounded border border-red-500/20 italic">
                  {localError === "WALLET_BOUND_TO_FARCASTER" || player.walletConflict?.message?.includes("Farcaster")
                    ? "This wallet is bound to a Farcaster Hero! Launch via Warpcast to use this account."
                    : "This wallet is already bound to another hunter node."}
               </p>

               <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setShowRedirectHelp(!showRedirectHelp)}
                    className="w-full py-2 bg-white text-black text-[9px] font-black uppercase italic rounded-xl border-2 border-black shadow-[3px_3px_0_rgba(127,29,29,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                     <Smartphone size={14} />
                     Access Protocol Help
                  </button>
                  
                  {showRedirectHelp && (
                    <div className="p-3 bg-black/40 rounded-xl border border-red-500/20 mt-1 animate-in slide-in-from-top-2">
                       <p className="text-[8px] font-bold text-red-300 uppercase leading-tight italic">
                          This wallet already has a Hero profile in our database. To preserve account integrity, we do not allow merging or overlapping identities.
                          <br/><br/>
                          If you want to use this specific wallet, please log in through the application path where it was first initialized.
                       </p>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                        wallet.disconnectWallet();
                        setLocalError(null);
                        addLog("Uplink node ejected. Ready for new connection.");
                    }}
                    className="w-full py-2 bg-slate-800 text-white text-[9px] font-black uppercase italic rounded-xl border-2 border-black shadow-[3px_3px_0_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 hover:bg-slate-700 mt-2"
                  >
                     <Wallet size={14} />
                     Switch to Different Wallet
                  </button>

                  <button 
                    onClick={() => {
                        setLocalError(null);
                        if (player.walletConflict) syncPlayer({ walletConflict: null });
                    }}
                    className="mt-3 text-[7px] font-black text-slate-500 uppercase underline hover:text-slate-300 transition-colors"
                  >
                    Clear Warning and Stay Unlinked
                  </button>
               </div>
            </div>
          ) : player.walletAddress ? (
            // --- ACTIVE UPLINK STATE ---
            <div className="bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/40">
                     <ShieldCheck size={18} className="text-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Wallet Linked</span>
                     <span className="text-[10px] font-mono text-white/70">
                        {player.walletAddress.slice(0,6)}...{player.walletAddress.slice(-4)}
                     </span>
                  </div>
               </div>
               <button 
                 onClick={() => addLog("System V3: Relic capture protocol active.")}
                 className="p-2 text-slate-500 hover:text-white"
               >
                 <Globe size={14} />
               </button>
            </div>
          ) : (
            // --- UNIFIED LINKING CTA ---
            <div className="w-full">
                <button
                  onClick={() => wallet.connectWallet()}
                  disabled={isLinking}
                  className="w-full group relative overflow-hidden bg-slate-900 border-[3px] border-black p-4 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center disabled:opacity-50 disabled:grayscale"
                >
                   {isLinking && <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center"><div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>}
                   <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="flex items-center gap-3 relative z-10">
                      <div className="bg-cyan-500 p-2 rounded-xl border-2 border-black rotate-[-4deg] group-hover:rotate-0 transition-transform text-black">
                         <Wallet size={20} />
                      </div>
                      <div className="flex flex-col items-start leading-none">
                         <span className="text-xs font-black text-white uppercase italic tracking-tighter">Initialize Uplink</span>
                         <span className="text-[7px] font-black text-cyan-400 uppercase tracking-widest mt-1">Connect Base Wallet to Sync</span>
                      </div>
                   </div>
                </button>
            </div>
          )}
        </div>

        {/* --- SYSTEM SETTINGS --- */}
        <div className="grid grid-cols-1 gap-3 w-full mb-8">
          <div className="flex items-center justify-between bg-slate-800/50 p-3 pr-4 rounded-xl border border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Animated Mode</span>
              <span className="text-[7px] text-slate-500 font-bold uppercase">Dynamic avatar visuals</span>
            </div>
            <button
              onClick={() => { syncPlayer({ avatarAnimated: !player.avatarAnimated }); addLog(`Animated mode ${!player.avatarAnimated ? 'enabled' : 'disabled'}.`); }}
              className={`relative w-10 h-6 rounded-full transition-colors ${player.avatarAnimated ? 'bg-cyan-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${player.avatarAnimated ? 'translate-x-4 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-800/50 p-3 pr-4 rounded-xl border border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Reduced FX Mode</span>
              <span className="text-[7px] text-slate-500 font-bold uppercase italic">Recommended for Mobile / Heat reduction</span>
            </div>
            <button
              onClick={() => { syncPlayer({ performanceMode: !player.performanceMode }); addLog(`Performance Mode ${!player.performanceMode ? 'Activated' : 'Deactivated'}.`); }}
              className={`relative w-10 h-6 rounded-full transition-colors ${player.performanceMode ? 'bg-amber-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${player.performanceMode ? 'translate-x-4 shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        {/* --- FARCASTER META (If applicable) --- */}
        {farcasterContext?.user && (
          <div className="w-full bg-indigo-950/30 border-2 border-indigo-900/50 rounded-2xl p-4 mb-8">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border-2 border-indigo-500 overflow-hidden shrink-0">
                   <img src={farcasterContext.user.pfpUrl} className="w-full h-full object-cover" alt="FC Pfp" />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-baseline gap-2">
                      <span className="text-xs font-black text-white italic">@{farcasterContext.user.username}</span>
                      <span className="text-[8px] font-black text-indigo-400 uppercase">FID: {farcasterContext.user.fid}</span>
                   </div>
                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tight truncate">{farcasterContext.user.displayName}</p>
                </div>
             </div>
          </div>
        )}

        <p className="text-[10px] text-slate-500 font-black uppercase text-center mb-4 tracking-widest border-b border-slate-800/50 pb-2 w-full">Select your combat avatar</p>

        <div className="grid grid-cols-4 gap-3 w-full pb-4">
          {Array.from({ length: 34 }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => { syncPlayer({ avatar: num }); addLog('Avatar updated.'); }}
              className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${player.avatar === num ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-95 opacity-50' : 'border-slate-800 hover:border-cyan-500 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]'}`}
            >
              <img src={`/assets/playeravatar/CrystleHunterAvatar (${num}).jpg`} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

