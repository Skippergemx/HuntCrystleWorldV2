import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Wallet, Link, Unlink, ShieldCheck, Globe, AlertTriangle, Smartphone, ExternalLink, Send, Check, Sparkles } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';

// Sub-component to safely handle TON linking inside IdentityView
function TonLinkButton({ syncPlayer, player, addLog, isLinking }) {
  const [tonConnectUI] = useTonConnectUI();
  const tonAddress = useTonAddress();

  const handleTonLink = async () => {
    if (tonAddress) {
       addLog("TON Uplink already active.");
       return;
    }
    tonConnectUI.openModal();
  };

  return (
    <button
      onClick={handleTonLink}
      disabled={isLinking}
      className="w-full group relative overflow-hidden bg-blue-950/40 border-[3px] border-blue-500/50 p-4 rounded-2xl shadow-[6px_6px_0_rgba(59,130,246,0.3)] hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(59,130,246,0.4)] active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center disabled:opacity-50 disabled:grayscale"
    >
       <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
       <div className="flex items-center gap-3 relative z-10">
          <div className="bg-blue-600 p-2 rounded-xl border-2 border-black rotate-[-4deg] group-hover:rotate-0 transition-transform text-white">
             <Send size={20} className="-rotate-12 translate-x-[1px]" />
          </div>
          <div className="flex flex-col items-start leading-none">
             <span className="text-xs font-black text-white uppercase italic tracking-tighter">Initialize TON Link</span>
             <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest mt-1">Connect Tonkeeper or TG Wallet</span>
          </div>
       </div>
    </button>
  );
}

export const IdentityView = React.memo(() => {
  const { player, syncPlayer, adventure, addLog, openGuide, wallet, farcasterContext, linkWallet, telegram } = useGame();
  const { setView } = adventure;
  const isTelegram = telegram?.isTelegram;
  const [showRedirectHelp, setShowRedirectHelp] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_identity_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Hunter Identity",
      npc: 1,
      visualType: 'identity',
      text: "This is your personal Identity Core. It holds your Hunter profile, linked wallet address, and avatar configuration for the Hunt Crystle network.",
      hint: "Tip: A unique name and avatar helps allies recognize you."
    },
    {
      title: "Wallet Uplink",
      npc: 6,
      visualType: 'wallet',
      text: "Connecting a wallet allows your Hunter profile to be permanently anchored to a blockchain node — securing your on-chain identity and future relic claims.",
      hint: "Strategy: Telegram users should connect their TON wallet."
    },
    {
      title: "Avatar System",
      npc: 14,
      visualType: 'avatar',
      text: "Select from 34 unique Hunter Avatars. You can enable Animated Mode to display a dynamic avatar in your profile and on the PvP Grid.",
      hint: "Warning: Avatar does not affect your combat stats."
    }
  ];

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_identity_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

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
      <Header title="Identity Core" onClose={adventure.goBack} onHelp={() => { setTutorialStep(0); setShowTutorial(true); }} />
      
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* --- HERO AVATAR SECTION --- */}
        <div className="w-40 h-56 mb-4 rounded-2xl border-[3px] border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] overflow-hidden relative group">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none"></div>
          {player.avatar ? <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover object-top relative z-0" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={48} className="text-slate-500" /></div>}
          
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

        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4 text-center">
            {player.name || 'Anonymous Unit'}
        </h3>

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

                  {!isTelegram && (
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
                  )}

                  {!isTelegram && (
                    <button 
                      onClick={() => {
                          setLocalError(null);
                          if (player.walletConflict) syncPlayer({ walletConflict: null });
                      }}
                      className="mt-3 text-[7px] font-black text-slate-500 uppercase underline hover:text-slate-300 transition-colors"
                    >
                      Clear Warning and Stay Unlinked
                    </button>
                  )}
               </div>
            </div>
          ) : (isTelegram ? player.tonWalletAddress : player.walletAddress) ? (
            // --- ACTIVE UPLINK STATE ---
            <div className={`${isTelegram ? 'bg-blue-950/20 border-blue-500/30' : 'bg-emerald-950/20 border-emerald-500/30'} border-2 rounded-2xl p-4 flex items-center justify-between`}>
               <div className="flex items-center gap-3">
                  <div className={`${isTelegram ? 'bg-blue-500/20 border-blue-500/40' : 'bg-emerald-500/20 border-emerald-500/40'} p-2 rounded-lg border`}>
                     <ShieldCheck size={18} className={isTelegram ? 'text-blue-400' : 'text-emerald-400'} />
                  </div>
                  <div className="flex flex-col">
                     <span className={`text-[8px] font-black ${isTelegram ? 'text-blue-500' : 'text-emerald-500'} uppercase tracking-widest`}>{isTelegram ? 'TON Wallet Linked' : 'Wallet Linked'}</span>
                     <span className="text-[10px] font-mono text-white/70">
                        {isTelegram 
                          ? `${player.tonWalletAddress.slice(0, 6)}...${player.tonWalletAddress.slice(-4)}`
                          : `${player.walletAddress.slice(0, 6)}...${player.walletAddress.slice(-4)}`
                        }
                     </span>
                  </div>
               </div>
               <button 
                 onClick={() => addLog(isTelegram ? "System V4: TON Relic capture protocol active." : "System V3: Relic capture protocol active.")}
                 className="p-2 text-slate-500 hover:text-white"
               >
                 {isTelegram ? <Send size={14} /> : <Globe size={14} />}
               </button>
            </div>
          ) : (
            // --- UNIFIED LINKING CTA ---
            <div className="w-full">
                {isTelegram ? (
                  <TonLinkButton 
                    syncPlayer={syncPlayer} 
                    player={player} 
                    addLog={addLog} 
                    isLinking={isLinking}
                  />
                ) : (
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
                )}
            </div>
          )}
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

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            <div className="absolute inset-x-0 top-0 bottom-0 bg-cyan-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 mt-1 mb-1 pointer-events-none"></div>
            <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
              <div className="w-full bg-cyan-500 py-2 border-b-[3px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl font-black text-black text-center uppercase tracking-tighter italic">{tutorialSteps[tutorialStep].title}</h2>
                <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">Step {tutorialStep + 1} / {tutorialSteps.length}</div>
              </div>
              <div className="py-3 relative flex justify-center items-center gap-3 w-full z-10">
                <div className="w-16 h-16 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0">
                  <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-x-0 bottom-0 bg-cyan-500 text-[6px] font-black text-black text-center py-0.5 uppercase italic">SYSTEM</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                  <div className="w-[1px] h-3 bg-gradient-to-b from-cyan-400 to-transparent" />
                </div>
                <div className="w-16 h-16 rounded-xl border-[3px] border-black bg-slate-950 flex items-center justify-center shrink-0">
                  {tutorialSteps[tutorialStep].visualType === 'identity' && <User className="text-cyan-400 animate-pulse" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'wallet' && <Wallet className="text-amber-400 animate-bounce" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'avatar' && <ShieldCheck className="text-green-400 animate-pulse" size={36} />}
                </div>
              </div>
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col">
                <div className="bg-white text-black p-3 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <div className="absolute -top-3 -left-1 bg-cyan-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic">Incoming Transmission</div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase leading-[1.3] tracking-tight italic">"{tutorialSteps[tutorialStep].text}"</p>
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>
                <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-500/30 mb-3">
                  <p className="text-[8px] font-black text-cyan-400 uppercase italic tracking-widest text-center">⚡ {tutorialSteps[tutorialStep].hint}</p>
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <button onClick={() => setDontShowAgain(!dontShowAgain)} className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-cyan-500' : 'bg-slate-800'}`}>
                    {dontShowAgain && <Check size={10} className="text-white" />}
                  </button>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>Don't show this briefing again</span>
                </div>
                <div className="flex gap-2 pb-1">
                  {tutorialStep > 0 && (
                    <button onClick={() => setTutorialStep(prev => prev - 1)} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] italic text-[9px]">BACK</button>
                  )}
                  <button onClick={nextTutorialStep} className="flex-[2] bg-cyan-500 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] italic text-[10px] flex items-center justify-center gap-1.5">
                    {tutorialStep === tutorialSteps.length - 1 ? 'ACCESS CORE' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

