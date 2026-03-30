import React from 'react';
import { User, Wallet, Link, Unlink, ShieldCheck, Globe } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const IdentityView = React.memo(() => {
  const { player, syncPlayer, adventure, addLog, openGuide, wallet, farcasterContext } = useGame();
  const { setView } = adventure;

  return (
    <div className="flex-1 p-6 space-y-6 flex flex-col items-center justify-start overflow-y-auto max-h-[600px] relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
      <Header title="Identity Core" onClose={() => setView('menu')} onHelp={() => openGuide('menu')} />
      <div className="w-full max-w-sm flex flex-col items-center">

        <div className="w-40 h-56 mb-4 rounded-2xl border-[3px] border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] overflow-hidden relative group">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none"></div>
          {player.avatar ? <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover relative z-0" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={48} className="text-slate-500" /></div>}
          
          {/* Airdrop Ready Status */}
          {wallet.address ? (
            <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md rounded shadow-[0_0_10px_rgba(16,185,129,0.3)]">
               <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(52,211,153,1)]"></div>
               <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest italic">UPLINK_SYNCED</span>
            </div>
          ) : (
            <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 border border-red-500/40 backdrop-blur-md rounded shadow-[0_0_10px_rgba(239,68,68,0.3)]">
               <div className="w-1 h-1 bg-red-500 rounded-full opacity-50"></div>
               <span className="text-[7px] font-black text-red-400 uppercase tracking-widest italic">UPLINK_OFFLINE</span>
            </div>
          )}
          
          <p className="absolute bottom-3 inset-x-0 text-center text-[10px] font-black tracking-[0.4em] uppercase text-cyan-400 z-20 drop-shadow-md">Active_Hunter</p>
        </div>

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

        {/* WEB3 UPLINK STATUS */}
        {wallet.address ? (
          <div className="w-full bg-slate-900/80 border-2 border-slate-800 rounded-2xl p-5 mb-4 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none rotate-12"><Wallet size={80} /></div>
             <h3 className="text-[10px] font-black text-cyan-400 uppercase italic mb-4 flex items-center gap-2 relative z-10">
               <div className="w-4 h-4 bg-cyan-500/10 rounded flex items-center justify-center border border-cyan-500/20">
                 <Wallet size={10} className="text-cyan-400" />
               </div>
               Active Web3 Uplink _ [BASE_CHAIN]
             </h3>
             
             <div className="space-y-4 relative z-10">
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between shadow-inner">
                   <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                        <span className="text-[8px] text-emerald-400/70 uppercase font-black tracking-[0.2em] italic">Network_Identity_Active</span>
                      </div>
                      <span className="text-xs font-mono font-black text-white/90 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-500/10 shadow-lg">
                        {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                      </span>
                   </div>
                   <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400">
                      <ShieldCheck size={20} className="animate-pulse" />
                   </div>
                </div>
                <button 
                  onClick={wallet.disconnectWallet}
                  className="w-full bg-slate-800/20 hover:bg-red-950/40 text-slate-500 hover:text-red-500 border-2 border-slate-800 hover:border-red-900 p-3 rounded-xl flex items-center justify-center gap-2 transition-all group font-black uppercase text-[9px] italic tracking-widest"
                >
                   <Unlink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                   Terminate Dynamic Uplink
                </button>
             </div>
          </div>
        ) : (
          <div className="w-full bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl p-6 mb-4 flex flex-col items-center gap-4 group hover:border-cyan-500/50 transition-all">
             <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 group-hover:text-cyan-400 group-hover:scale-110 transition-all">
                <Link size={24} />
             </div>
             <div className="text-center">
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1">Uplink Offline</h3>
                <p className="text-[8px] text-slate-500 font-bold uppercase italic">Link your wallet to track progress onchain</p>
             </div>
             <button 
               onClick={() => wallet.connectWallet('EXTERNAL')}
               disabled={wallet.loading}
               className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_4px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.5)] active:scale-95 transition-all disabled:opacity-50"
             >
               {wallet.loading ? 'INITIATING...' : 'ESTABLISH WALLET UPLINK'}
             </button>
          </div>
        )}

        {/* FARCASTER LINK */}
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
                <div className="bg-indigo-500/20 text-indigo-400 text-[8px] font-black px-2 py-0.5 rounded border border-indigo-500/30">
                   V2_FRAME
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
