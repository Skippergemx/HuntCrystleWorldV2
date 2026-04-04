import React, { useEffect } from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useGame } from '../contexts/GameContext';
import { CheckCircle, ShieldCheck, Send, Wallet } from 'lucide-react';
import { sdk } from '@farcaster/frame-sdk';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';

// ─────────────────────────────────────────────────────────────────────────────
// TonWalletStatus — SAFE sub-component for TON wallet UI.
//
// This is the CORRECT React pattern for conditional providers.
// By only rendering this component when isTelegram=true, we guarantee
// that TonConnectUIProvider is always mounted before these hooks are called.
// No try/catch hacks needed — React's component lifecycle handles it.
// ─────────────────────────────────────────────────────────────────────────────
function TonWalletStatus({ syncPlayer, player }) {
  const [tonConnectUI] = useTonConnectUI();
  const tonAddress = useTonAddress();

  // Persist TON address to Firestore when it first connects
  useEffect(() => {
    if (tonAddress && player && player.tonWalletAddress !== tonAddress && syncPlayer) {
      console.log('System V4: Syncing TON Uplink Address to Core Grid...');
      syncPlayer({ tonWalletAddress: tonAddress });
    }
  }, [tonAddress, player?.tonWalletAddress, syncPlayer]);

  return (
    <div className="flex flex-col items-end gap-1">
      {tonAddress ? (
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/40 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.1)]">
          <Wallet size={12} className="text-blue-400" />
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest italic leading-none">
              TON Linked
            </span>
            <span className="text-[8px] font-mono text-blue-300/80 mt-0.5">
              {tonAddress.slice(0, 4)}...{tonAddress.slice(-4)}
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => tonConnectUI?.openModal()}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest italic flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          <Wallet size={10} />
          Connect TON
        </button>
      )}
      <span className="text-[6px] font-bold text-blue-300 uppercase tracking-widest leading-none pr-1">
        {tonAddress ? 'Fragment Uplink Active' : 'Prepare for TON Airdrops'}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UnifiedAuthBanner — Main banner component for all 3 platforms
// ─────────────────────────────────────────────────────────────────────────────
const UnifiedAuthBanner = () => {
  const { isFarcaster } = useUnifiedAuth();
  const game = useGame();
  const { user, player, wallet, farcasterContext, telegram, syncPlayer } = game || {};
  const isTelegram = telegram?.isTelegram;
  const tgUser = telegram?.user;

  // Use ONLY navigator.userAgent for mobile detection.
  // sdk.wallet.ethProvider exists on BOTH Warpcast Mobile AND Desktop, so it cannot be used as a signal.
  const isMobileByAgent = typeof navigator !== 'undefined'
    ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    : false;
  const isMobileByWallet = wallet?.activeProviderType === 'CONTEXT' || wallet?.activeProviderType === 'NATIVE';
  const isMobile = isMobileByAgent || isMobileByWallet;

  // The active EVM display address
  const activeAddress = player?.walletConflict ? null : (player?.walletAddress || wallet?.address);

  // Auto-trigger wallet connect on Farcaster Mobile
  useEffect(() => {
    if (isFarcaster && isMobile && !activeAddress && wallet?.connectWallet) {
      console.log('System V3: Farcaster Mobile detected — auto-triggering wallet sync...');
      wallet.connectWallet('NATIVE');
    }
  }, [isFarcaster, isMobile, activeAddress, wallet]);

  // If no auth context at all, return null
  if (!user && !isTelegram) return null;

  const bannerColor = isTelegram ? 'bg-blue-950/40 border-blue-500/30' : 'bg-purple-950/40 border-purple-500/30';
  const shadowColor = isTelegram ? 'shadow-[0_4px_20px_rgba(59,130,246,0.3)]' : 'shadow-[0_4px_20px_rgba(168,85,247,0.3)]';

  return (
    <div className={`w-full relative z-[100] flex items-center justify-between px-3 md:px-6 py-2 ${bannerColor} border-b backdrop-blur-md ${shadowColor}`}>
      {/* Identity Core */}
      <div className="flex items-center gap-3">
        {isFarcaster && user && (
          <div className="flex items-center gap-2 group">
            <div className="relative">
              <img src={user.pfp} alt="Profile" className="w-8 h-8 rounded-full border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform" />
              <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-0.5 border border-white/20 shadow-lg">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-purple-100 uppercase tracking-tighter italic leading-none">{user.username}</span>
               <span className="text-[7px] font-bold text-purple-400/70 uppercase tracking-widest leading-none mt-0.5">
                 {isMobile ? 'Farcaster Mobile' : 'Farcaster Web'}
               </span>
            </div>
          </div>
        )}

        {isTelegram && tgUser && (
           <div className="flex items-center gap-2 group">
             <div className="relative">
               <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                 <Send className="w-4 h-4 text-white -rotate-12 translate-x-[1px]" />
               </div>
               <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-0.5 border border-white/20 shadow-lg">
                 <CheckCircle className="w-2.5 h-2.5 text-white" />
               </div>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-100 uppercase tracking-tighter italic leading-none">{tgUser.username || tgUser.first_name}</span>
                <span className="text-[7px] font-bold text-blue-400/70 uppercase tracking-widest leading-none mt-0.5">
                  Telegram Mini App
                </span>
             </div>
           </div>
        )}
      </div>

      {/* Uplink System */}
      <div className="flex items-center gap-2">
        {isFarcaster && (
          isMobile ? (
            // ── FARCASTER MOBILE ──
            <div className="flex flex-col items-end gap-1">
              {activeAddress ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/40 rounded-full">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest italic leading-none">
                      Wallet Linked
                    </span>
                    <span className="text-[9px] font-mono text-emerald-300/80 mt-0.5">
                      {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => wallet?.connectWallet('NATIVE')}
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black rounded-full uppercase italic"
                >
                  Sync Wallet
                </button>
              )}
            </div>
          ) : (
            // ── FARCASTER DESKTOP ──
            <div className="flex flex-col items-end gap-1">
              {activeAddress ? (
                <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/40 rounded-full">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span className="text-[8px] font-mono text-emerald-300">
                    {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                  </span>
                </div>
              ) : (
                <span className="text-[7px] font-black text-amber-300 uppercase italic">Airdrops Link Mobile</span>
              )}
            </div>
          )
        )}

        {/* TON wallet section — only rendered inside Telegram Mini App.
            The TonWalletStatus component calls useTonConnectUI/useTonAddress,
            which are ONLY safe to call when TonConnectUIProvider is mounted.
            Since ConditionalTonProvider (in Web3Provider) mounts the provider
            only in real TMA, and isTelegram is also only true in real TMA,
            these two flags are always in sync. */}
        {isTelegram && (
          <TonWalletStatus syncPlayer={syncPlayer} player={player} />
        )}
      </div>
    </div>
  );
};

export default UnifiedAuthBanner;
