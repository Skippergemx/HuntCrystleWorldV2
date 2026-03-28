import React from 'react';
import { User, Wallet, Link, Unlink } from 'lucide-react';
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
          <p className="absolute bottom-3 inset-x-0 text-center text-[10px] font-black tracking-[0.4em] uppercase text-cyan-400 z-20 drop-shadow-md">Active</p>
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

        {/* WEB3 UPLINK */}
        <div className="w-full bg-slate-900/80 border-2 border-slate-800 rounded-2xl p-5 mb-4 shadow-xl">
           <h3 className="text-[10px] font-black text-cyan-400 uppercase italic mb-4 flex items-center gap-2"><Wallet size={14} /> Web3 Uplink (Base Chain)</h3>
           
           {!wallet.address ? (
             <div className="flex flex-col gap-3">
                {/* Native Warpcast Link */}
                {wallet.hasNativeProvider && (
                  <button 
                    onClick={() => wallet.connectWallet('NATIVE')}
                    disabled={wallet.loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 border-b-4 border-indigo-900 p-4 rounded-xl flex items-center justify-between gap-3 transition-all group scale-100 hover:scale-[1.02] active:scale-95"
                  >
                    <div className="flex items-center gap-3">
                       <Globe size={18} className="text-white group-hover:rotate-12 transition-transform" />
                       <div className="flex flex-col text-left">
                          <span className="font-black text-white uppercase italic text-sm">Warpcast Wallet</span>
                          <span className="text-[7px] text-indigo-200 font-bold uppercase">Native Frame Uplink</span>
                       </div>
                    </div>
                    {wallet.loading && <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>}
                  </button>
                )}

                {/* External Browser Link */}
                {wallet.hasExternalProvider && (
                   <button 
                      onClick={() => wallet.connectWallet('EXTERNAL')}
                      disabled={wallet.loading}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 border-b-4 border-cyan-800 p-4 rounded-xl flex items-center justify-between gap-3 transition-all group scale-100 hover:scale-[1.02] active:scale-95"
                   >
                      <div className="flex items-center gap-3">
                         <Link size={18} className="text-black group-hover:rotate-45 transition-transform" />
                         <div className="flex flex-col text-left">
                            <span className="font-black text-black uppercase italic text-sm">External Wallet</span>
                            <span className="text-[7px] text-cyan-900 font-bold uppercase">MetaMask / Browser</span>
                         </div>
                      </div>
                      {wallet.loading && <div className="w-2 h-2 rounded-full bg-black animate-ping"></div>}
                   </button>
                )}
             </div>
           ) : (
             <div className="space-y-4">
                <div className="bg-black/60 border border-cyan-500/20 p-3 rounded-lg flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[8px] text-white/40 uppercase font-black font-center">Identity Hash</span>
                      <span className="text-xs font-mono font-black text-cyan-400 text-center">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
                   </div>
                   <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                </div>
                <button 
                  onClick={wallet.disconnectWallet}
                  className="w-full bg-slate-800 hover:bg-red-950 border-b-4 border-black p-3 rounded-lg flex items-center justify-center gap-2 transition-all group"
                >
                   <Unlink size={14} className="text-white/40 group-hover:text-red-500 transition-colors" />
                   <span className="text-[10px] font-black text-white/40 uppercase italic group-hover:text-red-500 transition-colors">Terminate Uplink</span>
                </button>
             </div>
           )}
        </div>

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
