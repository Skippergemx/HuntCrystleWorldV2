import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useGame } from '../contexts/GameContext';
import { Sparkles, CheckCircle, AlertTriangle, ExternalLink, ArrowRight, RefreshCw, Gem } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';
import { GameLayout } from './GameLayout';
import { WelcomeScreen } from './WelcomeScreen';
import { WalletPromptOverlay } from './WalletPromptOverlay';
import { AvatarMedia } from './GameUI';
import { useWelcomeNft } from '../hooks/useWelcomeNft';
import { useRemainingNfts } from '../hooks/useRemainingNfts';

export const GameEntry = ({ onLogout }) => {
  const { player, syncPlayer } = useGame();
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { hasClaimed, isClaiming, claimNft, claimState, claimResult } = useWelcomeNft();

  const [showWelcome, setShowWelcome] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [flowState, setFlowState] = useState('idle'); // 'idle' | 'prompting' | 'gift-reveal' | 'claiming' | 'claimed' | 'error' | 'done'
  const { remaining, total: TOTAL_SUPPLY } = useRemainingNfts();

  useEffect(() => {
    if (player && player.welcomeCompleted === false && !showWelcome && !isCompleting) {
      setShowWelcome(true);
    }
  }, [player, showWelcome, isCompleting]);

  // Sync wallet to Firestore, then claim NFT
  const doClaimNft = useCallback(async (walletAddr) => {
    setFlowState('claiming');

    // Ensure wallet is synced to player profile first (cloud function validates this)
    if (!player?.walletAddress || player.walletAddress.toLowerCase() !== walletAddr.toLowerCase()) {
      try {
        await syncPlayer({ walletAddress: walletAddr.toLowerCase().trim() }, true);
      } catch (e) {
        console.error('Failed to sync wallet before NFT claim:', e);
      }
    }

    const result = await claimNft(walletAddr);

    if (result.success) {
      setFlowState('claimed');
    } else {
      setFlowState('error');
    }
  }, [claimNft, syncPlayer, player]);

  // Auto-transition from gift-reveal to claiming after dramatic pause
  useEffect(() => {
    if (flowState !== 'gift-reveal') return;
    const effectiveWallet = player?.walletAddress || (wagmiConnected ? wagmiAddress : null);
    const timer = setTimeout(() => {
      if (effectiveWallet) doClaimNft(effectiveWallet);
    }, 2800);
    return () => clearTimeout(timer);
  }, [flowState, player, wagmiAddress, wagmiConnected, doClaimNft]);

  const handleWelcomeComplete = useCallback(async () => {
    setIsCompleting(true);
    try {
      await syncPlayer({ welcomeCompleted: true });
    } catch (e) {
      console.error('Failed to mark welcome as complete:', e);
    }
    setShowWelcome(false);
    setIsCompleting(false);

    // Determine effective wallet — Firestore-linked or wagmi-connected
    const effectiveWallet = player?.walletAddress || (wagmiConnected ? wagmiAddress : null);

    if (effectiveWallet && !hasClaimed) {
      // Show the gift reveal moment before claiming
      setFlowState('gift-reveal');
    } else if (!effectiveWallet && !hasClaimed) {
      setFlowState('prompting');
    } else {
      setFlowState('done');
    }
  }, [syncPlayer, player, wagmiAddress, wagmiConnected, hasClaimed, doClaimNft]);

  const handleWalletReady = useCallback(async (address) => {
    if (!hasClaimed) {
      await doClaimNft(address);
    } else {
      setFlowState('done');
    }
  }, [hasClaimed, doClaimNft]);

  const handleSkipWallet = useCallback(() => {
    setFlowState('done');
  }, []);

  const handleProceed = useCallback(() => {
    setFlowState('done');
  }, []);

  const handleRetry = useCallback(async () => {
    const effectiveWallet = player?.walletAddress || (wagmiConnected ? wagmiAddress : null);
    if (effectiveWallet && !hasClaimed) {
      await doClaimNft(effectiveWallet);
    } else {
      setFlowState('done');
    }
  }, [player, wagmiAddress, wagmiConnected, hasClaimed, doClaimNft]);

  // Still loading player data
  if (!player) {
    return <LoadingScreen />;
  }

  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  if (flowState === 'prompting') {
    return <WalletPromptOverlay onWalletReady={handleWalletReady} onSkip={handleSkipWallet} />;
  }

  if (flowState === 'gift-reveal') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="relative w-full max-w-xs flex flex-col items-center">
          {/* Offset shadow */}
          <div className="absolute inset-x-0 top-0 bottom-0 bg-cyan-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 pointer-events-none"></div>
          <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl p-5 flex flex-col items-center gap-3 shadow-2xl z-10 overflow-hidden w-full">
            {/* Scanline overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.3) 2px, rgba(6,182,212,0.3) 4px)' }}></div>

            {/* NPC in a circular frame */}
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full border-[3px] border-black overflow-hidden bg-slate-800 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <AvatarMedia num={3} animated={true} className="w-full h-full object-cover object-top scale-125" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[7px] font-black px-2 py-0.5 border-2 border-black uppercase italic tracking-widest whitespace-nowrap">
                Quartermaster
              </div>
            </div>

            {/* Pulse ring behind gem */}
            <div className="relative z-10 flex items-center justify-center">
              <div className="absolute w-10 h-10 rounded-full bg-cyan-400/30 animate-ping"></div>
              <div className="relative w-14 h-14 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                <Gem size={28} className="text-cyan-300" />
              </div>
            </div>

            {/* Message */}
            <div className="text-center space-y-1.5 z-10">
              <h2 className="text-sm font-black text-cyan-400 uppercase italic tracking-tighter">Incoming Transmission</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed italic">
                The Quartermaster is sending a Trilith Sapphire Gemx to your wallet.
              </p>
              <div className="flex items-center justify-center gap-1 text-[8px] font-black text-cyan-500 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                Establishing uplink
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.3s' }}></span>
              </div>
              {remaining !== null && (
                <p className="text-[7px] font-black text-cyan-600 uppercase tracking-[0.2em]">
                  {remaining} gift{remaining !== 1 ? 's' : ''} remaining in treasury
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (flowState === 'claiming') {
    return (
      <LoadingScreen message="Transmitting your Trilith Sapphire Gemx welcome gift..." />
    );
  }

  if (flowState === 'claimed') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm flex flex-col">
          <div className="absolute inset-x-0 top-0 bottom-0 bg-emerald-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 pointer-events-none"></div>
          <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl p-6 flex flex-col items-center gap-4 shadow-2xl z-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
              <CheckCircle size={36} className="text-emerald-400" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-black text-emerald-400 uppercase italic tracking-tighter">Gift Claimed!</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed italic">
                Trilith Sapphire Gemx transmitted to your wallet.
              </p>
              {remaining !== null && remaining > 0 && (
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                  <Gem size={10} className="inline mr-0.5 -mt-0.5" />
                  {remaining} gift{remaining !== 1 ? 's' : ''} remaining
                </p>
              )}
              {claimResult?.txHash && (
                <a
                  href={`https://basescan.org/tx/${claimResult.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-300 transition-colors"
                >
                  View TX <ExternalLink size={10} />
                </a>
              )}
            </div>
            <button
              onClick={handleProceed}
              className="w-full bg-emerald-500 text-black py-3 rounded-xl font-black uppercase tracking-widest border-[3px] border-black italic text-xs flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"
            >
              ENTER THE GRID
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (flowState === 'error') {
    const errorMessage = claimResult?.message || 'NFT claim failed. The transfer could not be completed.';
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm flex flex-col">
          <div className="absolute inset-x-0 top-0 bottom-0 bg-amber-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 pointer-events-none"></div>
          <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl p-6 flex flex-col items-center gap-4 shadow-2xl z-10">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center">
              <AlertTriangle size={36} className="text-amber-400" />
            </div>
            <div className="text-center space-y-2 w-full">
              <h2 className="text-lg font-black text-amber-400 uppercase italic tracking-tighter">Transfer Failed</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed italic px-2">
                {errorMessage}
              </p>
              {remaining !== null && (
                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">
                  <Gem size={10} className="inline mr-0.5 -mt-0.5" />
                  {remaining} gift{remaining !== 1 ? 's' : ''} still available to claim
                </p>
              )}
              <p className="text-[8px] font-bold text-slate-500 uppercase italic">
                Your wallet is linked — you can retry or continue without the gift.
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={handleProceed}
                className="flex-1 bg-slate-800 text-slate-400 py-2.5 rounded-xl font-black uppercase tracking-widest border-[2px] border-slate-700 italic text-[9px]"
              >
                Skip
              </button>
              <button
                onClick={handleRetry}
                className="flex-[2] bg-amber-500 text-black py-2.5 rounded-xl font-black uppercase tracking-widest border-[3px] border-black italic text-[10px] flex items-center justify-center gap-1.5 hover:bg-amber-400 transition-colors"
              >
                <RefreshCw size={12} />
                Retry Claim
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <GameLayout onLogout={onLogout} />;
};
