import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { User, Wallet, Link, Unlink, ShieldCheck, Globe, AlertTriangle, Smartphone, ExternalLink, Check, Sparkles, LogOut, Gem, RefreshCw } from 'lucide-react';
import { deleteField } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';
import { usePlayerNftBalance } from '../hooks/usePlayerNftBalance';
import { useRemainingNfts } from '../hooks/useRemainingNfts';

export const IdentityView = React.memo(({ onLogout }) => {
  const { player, syncPlayer, adventure, addLog, openGuide, wallet, linkWallet, functions } = useGame();
  const { setView } = adventure;
  const [showRedirectHelp, setShowRedirectHelp] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const [welcomeClaimState, setWelcomeClaimState] = useState('idle'); // idle | claiming | claimed | exhausted | error
  const { remaining } = useRemainingNfts();

  const claimWelcomeGift = useCallback(async () => {
    if (!functions || !player?.walletAddress) return;
    setWelcomeClaimState('claiming');
    try {
      const claimFn = httpsCallable(functions, 'claimWelcomeNft');
      const result = await claimFn({ targetWalletAddress: player.walletAddress });
      if (result.data.success) {
        setWelcomeClaimState('claimed');
        addLog(`\uD83C\uDF81 WELCOME GIFT: ${result.data.message}`);
      } else {
        throw new Error(result.data.message || 'Claim returned unsuccessful');
      }
    } catch (e) {
      const msg = e.details?.message || e.message || 'Welcome NFT claim failed';
      if (msg.includes('exhausted') || msg.includes('already been claimed')) {
        setWelcomeClaimState('exhausted');
      } else {
        setWelcomeClaimState('error');
      }
      addLog(`\u26A0\uFE0F WELCOME NFT: ${msg}`);
    }
  }, [functions, player?.walletAddress, addLog]);

  const nftBalance = usePlayerNftBalance(player?.walletAddress);
  const emeraldBalance = usePlayerNftBalance(player?.walletAddress, {
    address: '0xE6961d4b515D018d5b1C4c91790ef8B5573a0615',
    tokenId: 0n
  });

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
      hint: "Strategy: Connect your Base wallet to claim on-chain relics."
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
                  This wallet is already bound to another hunter node.
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
            <div className="bg-emerald-950/20 border-emerald-500/30 border-2 rounded-2xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 border-emerald-500/40 p-2 rounded-lg border">
                     <ShieldCheck size={18} className="text-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Wallet Linked</span>
                     <span className="text-[10px] font-mono text-white/70">
                        {player.walletAddress.slice(0, 6)}...{player.walletAddress.slice(-4)}
                     </span>
                  </div>
               </div>
                <button 
                  onClick={() => {
                    console.log("Identity Core: Initiating Manual Node Ejection Protocol...");
                    // Immediate sync to null ensures the UI updates instantly
                    syncPlayer({ walletAddress: null }, true);
                    
                    // Trigger async background disconnect
                    wallet.disconnectWallet();
                    
                    addLog("Wallet uplink disconnected.");
                  }}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer z-20"
                  title="Disconnect Wallet"
                >
                  <Unlink size={16} />
                </button>
            </div>
          ) : (
            // --- CONNECT WALLET CTA ---
            <div className="w-full">
              {wallet.address && !player.walletAddress ? (
                <button
                  onClick={() => handleManualLink(wallet.address)}
                  disabled={isLinking}
                  className="w-full group relative overflow-hidden bg-emerald-600 border-[3px] border-black p-4 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 relative z-10 text-white">
                    <div className="bg-white p-2 rounded-xl border-2 border-black rotate-[-4deg] group-hover:rotate-0 transition-transform text-emerald-600">
                       <Link size={20} />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                       <span className="text-xs font-black uppercase italic tracking-tighter">Link Connected Wallet</span>
                       <span className="text-[7px] font-black uppercase tracking-widest mt-1">Found: {wallet.address.slice(0,6)}...</span>
                    </div>
                  </div>
                </button>
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

        {/* --- NFT COLLECTION --- */}
        {player.walletAddress && (
          <div className="w-full mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-slate-800"></div>
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em]">NFT Collection</span>
              <div className="h-px flex-1 bg-slate-800"></div>
            </div>

            {nftBalance === null ? (
              /* Loading skeleton */
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-800 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ) : nftBalance > 0 ? (
              /* Has the NFT */
              <div className="relative overflow-hidden bg-gradient-to-br from-cyan-950/40 to-slate-900 border-2 border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '6px 6px' }}></div>
                <div className="relative z-10 flex items-center gap-3">
                  {/* Gem icon */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-xl bg-cyan-400/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                    <div className="relative w-12 h-12 rounded-xl bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <Gem size={22} className="text-cyan-300" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[9px] font-black text-cyan-400 uppercase italic tracking-tighter leading-tight">Trilith Sapphire Gemx</h4>
                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Quartermaster's Welcome Gift</p>
                    {player.welcomeNftTxHash && (
                      <a
                        href={`https://basescan.org/tx/${player.welcomeNftTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[7px] font-black text-cyan-600 uppercase tracking-wider hover:text-cyan-400 transition-colors mt-1"
                      >
                        View TX <ExternalLink size={9} />
                      </a>
                    )}
                  </div>

                  {/* Quantity badge */}
                  <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
                    <span className="text-[10px] font-black text-cyan-400">{nftBalance}</span>
                  </div>
                </div>
              </div>
            ) : player.welcomeNftClaimed ? (
              /* Marked as claimed but balance is 0 — pending or discrepancy */
              <div className="bg-amber-950/20 border-2 border-amber-500/20 rounded-2xl p-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></div>
                <p className="text-[7px] font-bold text-amber-400 uppercase italic">Sapphire — awaiting on-chain confirmation</p>
              </div>
            ) : welcomeClaimState === 'claimed' ? (
              /* Claimed via manual button */
              <div className="bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl p-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></div>
                <p className="text-[7px] font-bold text-emerald-400 uppercase italic">Sapphire claimed! Awaiting on-chain confirmation.</p>
              </div>
            ) : (
              /* Wallet linked but not yet claimed — show claim CTA */
              <div className="relative overflow-hidden bg-gradient-to-br from-cyan-950/30 to-slate-900 border-2 border-cyan-500/20 rounded-2xl p-4 shadow-[0_0_15px_rgba(6,182,212,0.08)]">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '6px 6px' }}></div>
                <div className="relative z-10 flex items-center gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border-2 border-cyan-500/40 flex items-center justify-center">
                      <Gem size={22} className="text-cyan-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[9px] font-black text-cyan-400 uppercase italic tracking-tighter leading-tight">Trilith Sapphire Gemx</h4>
                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Welcome Gift Available</p>
                    {remaining !== null && (
                      <p className="text-[7px] font-black text-cyan-600 uppercase tracking-widest mt-0.5">
                        <Gem size={8} className="inline mr-0.5 -mt-0.5" />
                        {remaining} of 20 remaining
                      </p>
                    )}
                  </div>
                </div>

                {welcomeClaimState === 'claiming' ? (
                  <button disabled className="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-black uppercase italic text-[9px] border-2 border-slate-700 flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
                    CLAIMING...
                  </button>
                ) : welcomeClaimState === 'error' ? (
                  <div className="flex gap-2">
                    <button onClick={claimWelcomeGift} className="flex-1 py-2 rounded-xl bg-amber-500 text-black font-black uppercase italic text-[9px] border-[3px] border-black flex items-center justify-center gap-1.5 hover:bg-amber-400 transition-colors">
                      <RefreshCw size={10} />
                      RETRY
                    </button>
                  </div>
                ) : welcomeClaimState === 'exhausted' ? (
                  <p className="text-[7px] font-bold text-amber-500 uppercase italic text-center">All welcome gifts have been claimed.</p>
                ) : (
                  <button onClick={claimWelcomeGift} className="w-full py-2 rounded-xl bg-cyan-500 text-black font-black uppercase italic text-[9px] border-[3px] border-black flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
                    <Gem size={12} />
                    CLAIM YOUR GIFT
                  </button>
                )}
              </div>
            )}

            {/* === Emerald Gemx (Level 10) === */}
            {emeraldBalance === null ? (
              /* Loading skeleton */
              <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 mt-2 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-800 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ) : emeraldBalance > 0 ? (
              /* Has the NFT */
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/40 to-slate-900 border-2 border-emerald-500/30 rounded-2xl p-4 mt-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '6px 6px' }}></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-xl bg-emerald-400/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                    <div className="relative w-12 h-12 rounded-xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <Gem size={22} className="text-emerald-300" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[9px] font-black text-emerald-400 uppercase italic tracking-tighter leading-tight">Trilith Emerald Gemx</h4>
                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Level 10 Milestone</p>
                    {player.level10NftTxHash && (
                      <a
                        href={`https://basescan.org/tx/${player.level10NftTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[7px] font-black text-emerald-600 uppercase tracking-wider hover:text-emerald-400 transition-colors mt-1"
                      >
                        View TX <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                  <div className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                    <span className="text-[10px] font-black text-emerald-400">{emeraldBalance}</span>
                  </div>
                </div>
              </div>
            ) : player.level10NftReserved || player.level10NftClaimed ? (
              /* Reserved or claimed but balance is 0 */
              <div className="bg-amber-950/20 border-2 border-amber-500/20 rounded-2xl p-3 mt-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></div>
                <p className="text-[7px] font-bold text-amber-400 uppercase italic">
                  {player.level10NftClaimed ? 'Emerald claimed — awaiting on-chain confirmation' : 'Emerald reserved — link wallet to claim'}
                </p>
              </div>
            ) : null}

            {/* === Higher Level Rewards (20—100) === */}
            {(() => {
              if (!player.levelRewards) return null;
              const rewardLevels = [20, 30, 40, 50, 60, 70, 80, 90, 100];
              const levelConfig = {
                20: { name: 'Trilith Ruby Gemx', color: 'red', label: 'Level 20 Milestone' },
                30: { name: 'Trilith Quartz Gemx', color: 'violet', label: 'Level 30 Milestone' },
                40: { name: 'Trilith Sapphire Gemx', color: 'blue', label: 'Level 40 Milestone' },
                50: { name: 'Trilith Emerald Gemx', color: 'emerald', label: 'Level 50 Milestone' },
                60: { name: 'Trilith Ruby Gemx', color: 'red', label: 'Level 60 Milestone' },
                70: { name: 'Trilith Ruby Gemx', color: 'red', label: 'Level 70 Milestone' },
                80: { name: 'Trilith Quartz Gemx', color: 'violet', label: 'Level 80 Milestone' },
                90: { name: 'Trilith Sapphire Gemx', color: 'blue', label: 'Level 90 Milestone' },
                100: { name: 'Trilith Emerald Gemx', color: 'emerald', label: 'Level 100 Milestone' },
              };
              const colorStyles = {
                red: { from: 'from-red-950/40', border: 'border-red-500/30', iconBg: 'bg-red-500/20', iconBorder: 'border-red-500', iconText: 'text-red-300', textName: 'text-red-400', txColor: 'text-red-600 hover:text-red-400', badgeBg: 'bg-red-500/15', badgeBorder: 'border-red-500/30', badgeText: 'text-red-400', reservedBg: 'bg-red-950/20', reservedBorder: 'border-red-500/20', reservedText: 'text-red-400', ping: 'bg-red-400/20' },
                violet: { from: 'from-violet-950/40', border: 'border-violet-500/30', iconBg: 'bg-violet-500/20', iconBorder: 'border-violet-500', iconText: 'text-violet-300', textName: 'text-violet-400', txColor: 'text-violet-600 hover:text-violet-400', badgeBg: 'bg-violet-500/15', badgeBorder: 'border-violet-500/30', badgeText: 'text-violet-400', reservedBg: 'bg-violet-950/20', reservedBorder: 'border-violet-500/20', reservedText: 'text-violet-400', ping: 'bg-violet-400/20' },
                blue: { from: 'from-blue-950/40', border: 'border-blue-500/30', iconBg: 'bg-blue-500/20', iconBorder: 'border-blue-500', iconText: 'text-blue-300', textName: 'text-blue-400', txColor: 'text-blue-600 hover:text-blue-400', badgeBg: 'bg-blue-500/15', badgeBorder: 'border-blue-500/30', badgeText: 'text-blue-400', reservedBg: 'bg-blue-950/20', reservedBorder: 'border-blue-500/20', reservedText: 'text-blue-400', ping: 'bg-blue-400/20' },
                emerald: { from: 'from-emerald-950/40', border: 'border-emerald-500/30', iconBg: 'bg-emerald-500/20', iconBorder: 'border-emerald-500', iconText: 'text-emerald-300', textName: 'text-emerald-400', txColor: 'text-emerald-600 hover:text-emerald-400', badgeBg: 'bg-emerald-500/15', badgeBorder: 'border-emerald-500/30', badgeText: 'text-emerald-400', reservedBg: 'bg-emerald-950/20', reservedBorder: 'border-emerald-500/20', reservedText: 'text-emerald-400', ping: 'bg-emerald-400/20' },
              };
              return rewardLevels.map(level => {
                const r = player.levelRewards[String(level)];
                if (!r) return null;
                const cfg = levelConfig[level];
                if (!cfg) return null;
                const cs = colorStyles[cfg.color] || colorStyles.emerald;
                const txHash = r.txHash;

                if (r.claimed && txHash) {
                  return (
                    <div key={level} className={`relative overflow-hidden bg-gradient-to-br ${cs.from} to-slate-900 border-2 ${cs.border} rounded-2xl p-4 mt-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]`}>
                      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '6px 6px' }}></div>
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 rounded-xl ${cs.ping} animate-ping`} style={{ animationDuration: '3s' }}></div>
                          <div className={`relative w-12 h-12 rounded-xl ${cs.iconBg} border-2 ${cs.iconBorder} flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]`}>
                            <Gem size={22} className={cs.iconText} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[9px] font-black ${cs.textName} uppercase italic tracking-tighter leading-tight`}>{cfg.name}</h4>
                          <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{cfg.label}</p>
                          {txHash && (
                            <a
                              href={`https://basescan.org/tx/${txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-1 text-[7px] font-black ${cs.txColor} uppercase tracking-wider transition-colors mt-1`}
                            >
                              View TX <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (r.claimed || r.reserved) {
                  // Claimed without tx hash (awaiting confirm) or reserved
                  return (
                    <div key={level} className={`${cs.reservedBg} border-2 ${cs.reservedBorder} rounded-2xl p-3 mt-2 flex items-center gap-2`}>
                      <div className={`w-2 h-2 rounded-full ${cs.reservedText} animate-pulse flex-shrink-0`}></div>
                      <p className={`text-[7px] font-bold ${cs.reservedText} uppercase italic`}>
                        {r.claimed ? `${cfg.name} claimed — awaiting on-chain confirmation` : `${cfg.name} reserved — link wallet to claim`}
                      </p>
                    </div>
                  );
                }

                return null;
              });
            })()}
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

        {/* --- SYSTEM TERMINATE SECTION --- */}
        <div className="w-full mt-6 pt-4 border-t border-slate-800 flex flex-col gap-3">
           <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] text-center italic mb-1">Authorization Controls</p>
           <button
             onClick={onLogout}
             className="w-full group relative overflow-hidden bg-red-950/20 border-[3px] border-black p-4 rounded-2xl shadow-[6px_6px_0_rgba(127,29,29,0.3)] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
           >
              <div className="bg-red-600 p-2 rounded-xl border-2 border-black group-hover:bg-white group-hover:text-red-600 transition-colors">
                 <LogOut size={20} />
              </div>
              <div className="flex flex-col items-start leading-none group-hover:text-white transition-colors">
                 <span className="text-xs font-black uppercase italic tracking-tighter">Terminate Session</span>
                 <span className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-60">Logout from Neural Grid</span>
              </div>
           </button>
           <p className="text-[7px] text-slate-700 font-bold uppercase text-center mt-2 tracking-tighter">Session Hash: {player.sessionId?.slice(-8) || '0xDEADAFFE'}</p>
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
                <div className="w-16 h-28 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0">
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
