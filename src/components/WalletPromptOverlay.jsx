import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useConnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Wallet, AlertTriangle, ArrowLeft, Sparkles, Gem } from 'lucide-react';
import { useRemainingNfts } from '../hooks/useRemainingNfts';
import { AvatarMedia } from './GameUI';
import sdk from '@farcaster/frame-sdk';

/**
 * WalletPromptOverlay — full-screen overlay shown after welcome screen
 * when a player needs to connect a wallet before receiving their NFT gift.
 * 
 * Includes a two-step skip confirmation to warn players that only 20 NFTs
 * are available and skipping means they risk losing their claim forever.
 * 
 * Auto-dismisses when a wallet address becomes available.
 */
export const WalletPromptOverlay = ({ onWalletReady, onSkip }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { openConnectModal } = useConnectModal();
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasClickedConnect, setHasClickedConnect] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [isFarcaster, setIsFarcaster] = useState(false);
  const { remaining, total: TOTAL_SUPPLY } = useRemainingNfts();

  // Detect Farcaster Frame environment
  useEffect(() => {
    const detectFrame = async () => {
      try {
        const contextPromise = sdk.context;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Frame SDK Timeout')), 2000)
        );
        const context = await Promise.race([contextPromise, timeoutPromise]);
        if (context) setIsFarcaster(true);
      } catch (e) {
        // Not in a Farcaster Frame — that's fine
      }
    };
    detectFrame();
  }, []);

  // Auto-dismiss only after user explicitly clicked connect and wallet becomes available
  useEffect(() => {
    if (isConnected && address && hasClickedConnect) {
      onWalletReady(address);
    }
  }, [isConnected, address, hasClickedConnect, onWalletReady]);

  const handleConnect = useCallback(() => {
    setHasClickedConnect(true);
    setIsConnecting(true);
    if (isFarcaster) {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
        return;
      }
    }
    if (openConnectModal) {
      openConnectModal();
    }
  }, [isFarcaster, connectors, connect, openConnectModal]);

  const handleSkipClick = useCallback(() => {
    setShowSkipWarning(true);
  }, []);

  const handleConfirmSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  const handleGoBack = useCallback(() => {
    setShowSkipWarning(false);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[10001] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
      <div className="relative w-full max-w-sm flex flex-col justify-center">
        {/* Offset shadow border */}
        <div className="absolute inset-x-0 top-0 bottom-0 bg-emerald-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 mt-1 mb-1 pointer-events-none"></div>
        
        <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden shadow-2xl">
          {/* Halftone pattern bg */}
          <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

          {/* Header Banner */}
          <div className={`w-full py-2 border-b-[3px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0 ${showSkipWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}>
            <h2 className="text-xl font-black text-black text-center uppercase tracking-tighter italic">
              {showSkipWarning ? 'Are You Sure?' : 'Link Your Wallet'}
            </h2>
            <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">
              {showSkipWarning ? 'Warning' : 'Welcome Gift'}
            </div>
          </div>

          {/* NPC Portrait & Visual Icon */}
          <div className="py-3 relative flex justify-center items-center gap-3 w-full z-10 pt-6">
            <div className="w-16 h-28 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0">
              <AvatarMedia num={3} animated={true} className="w-full h-full object-cover object-top" />
              <div className={`absolute inset-x-0 bottom-0 text-[6px] font-black text-black text-center py-0.5 uppercase italic ${showSkipWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                QUARTERMASTER
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <div className={`w-1 h-1 rounded-full animate-ping ${showSkipWarning ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <div className={`w-[1px] h-3 bg-gradient-to-b to-transparent ${showSkipWarning ? 'from-amber-400' : 'from-emerald-400'}`} />
            </div>

            <div className={`w-16 h-16 rounded-xl border-[3px] border-black bg-slate-950 flex items-center justify-center shrink-0 ${showSkipWarning ? 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}>
              {showSkipWarning ? <AlertTriangle className="text-amber-400" size={36} /> : <Wallet className="text-emerald-400" size={36} />}
            </div>
          </div>

          {/* Message Content */}
          <div className="px-4 pb-3 w-full relative z-10 flex flex-col">
            {!showSkipWarning ? (
              <>
                <div className="bg-white text-black p-3 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <div className="absolute -top-3 -left-1 bg-emerald-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic">Supply Drop</div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase leading-[1.3] tracking-tight italic">
                    "Before you deploy, Hunter — link your wallet to the Crystle Grid. The Quartermaster has <span className="text-emerald-600">{remaining !== null ? remaining : TOTAL_SUPPLY}</span> Trilith Sapphire Gemx welcome gifts remaining. Don't miss yours."
                  </p>
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-emerald-500/30 mb-3">
                  <p className="text-[8px] font-black text-emerald-400 uppercase italic tracking-widest text-center">
                    <Gem size={10} className="inline mr-1 -mt-0.5" />
                    {remaining !== null 
                      ? `${remaining} of ${TOTAL_SUPPLY} gifts remaining` 
                      : 'Loading supply...'}
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex gap-2 pb-1">
                  <button 
                    onClick={handleSkipClick} 
                    className="flex-1 bg-slate-800/50 text-slate-500 py-2.5 rounded-xl font-black uppercase tracking-widest border-[2px] border-black/30 italic text-[9px]"
                  >
                    Skip For Now
                  </button>
                  <button 
                    onClick={handleConnect} 
                    disabled={isConnecting}
                    className="flex-[2] bg-emerald-500 text-black py-2.5 rounded-xl font-black uppercase tracking-widest border-[3px] border-black italic text-[10px] flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
                    <Wallet size={12} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-amber-100 text-black p-3 rounded-xl border-[3px] border-amber-500 relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <div className="absolute -top-3 -left-1 bg-amber-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic">Final Warning</div>
                  <p className="text-[9px] font-black text-amber-900 uppercase leading-[1.4] tracking-tight italic mb-2">
                    "HUNTER — STOP. There are only <span className="text-red-600">{remaining !== null ? remaining : TOTAL_SUPPLY} TRILITH SAPPHIRE GEMX</span> left in this deployment wave. If you skip now and they are claimed by others, this gift is <span className="text-red-600">GONE FOREVER.</span>"
                  </p>
                  <p className="text-[8px] font-bold text-amber-700 uppercase leading-[1.3] tracking-tight">You can always connect later, but the Quartermaster's stock is first-come, first-served. No exceptions.</p>
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-amber-100 border-b-[3px] border-l-[3px] border-amber-500 transform rotate-[30deg]"></div>
                </div>

                <div className="bg-red-950/60 p-1.5 rounded-lg border border-red-500/40 mb-3">
                  <p className="text-[8px] font-black text-red-400 uppercase italic tracking-widest text-center flex items-center justify-center gap-1">
                    <AlertTriangle size={10} /> Only {remaining !== null ? remaining : TOTAL_SUPPLY} remaining — first come, first served
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex gap-2 pb-1">
                  <button 
                    onClick={handleGoBack} 
                    className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest border-[2px] border-black italic text-[9px] flex items-center justify-center gap-1"
                  >
                    <ArrowLeft size={10} /> GO BACK
                  </button>
                  <button 
                    onClick={handleConfirmSkip} 
                    className="flex-[2] bg-amber-500 text-black py-2.5 rounded-xl font-black uppercase tracking-widest border-[3px] border-black italic text-[10px] flex items-center justify-center gap-1.5 hover:bg-amber-400 transition-colors"
                  >
                    I UNDERSTAND, SKIP
                    <AlertTriangle size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
