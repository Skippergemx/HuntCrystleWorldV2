import React, { useEffect } from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useGame } from '../contexts/GameContext';
import { Wallet, CheckCircle, ShieldCheck, Info, AlertTriangle, Smartphone } from 'lucide-react';

const UnifiedAuthBanner = () => {
  const { isFarcaster } = useUnifiedAuth();
  const game = useGame(); 

  const { user, player, wallet, farcasterContext } = game || {};
  
  if (!user || !isFarcaster) return null;

  // Use the farcasterContext from the game engine (already resolved async) for reliable detection
  // The userAgent check is a secondary fallback
  const isMobile = typeof navigator !== 'undefined'
    ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    : false;

  // The active display address: prioritize Firestore-saved mobile wallet over any live hook address
  const activeAddress = player?.walletAddress || wallet?.address;

  // Auto-trigger wallet connect on Farcaster Mobile if no wallet is yet linked
  // This is safe because useWallet already guards against Desktop CSP crashes
  useEffect(() => {
    if (isFarcaster && isMobile && !activeAddress && wallet?.connectWallet) {
      console.log('System V2: Farcaster Mobile detected — auto-triggering wallet sync...');
      wallet.connectWallet('NATIVE');
    }
  }, [isFarcaster, isMobile, activeAddress, wallet]);

  return (
    <div className="w-full relative z-[100] flex items-center justify-between px-3 md:px-6 py-2 bg-purple-950/40 border-b border-purple-500/30 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Identity Core */}
      <div className="flex items-center gap-3">
        {user && (
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
      </div>

      {/* Uplink System */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          // ── FARCASTER MOBILE ──
          <div className="flex flex-col items-end gap-1">
            {activeAddress ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/40 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest italic leading-none">
                    Farcaster Wallet Linked
                  </span>
                  <span className="text-[9px] font-mono text-emerald-300/80 bg-emerald-500/5 px-1.5 rounded mt-0.5">
                    {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => wallet?.connectWallet('NATIVE')}
                  className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] text-white text-[9px] font-black rounded-full transition-all active:scale-95 uppercase tracking-widest italic"
                >
                  <Smartphone className="w-3 h-3" />
                  Sync Farcaster Wallet
                </button>
                <span className="text-[6px] font-bold text-amber-300 uppercase tracking-widest leading-none pr-1">
                  Link wallet for airdrops & rewards!
                </span>
              </div>
            )}
          </div>
        ) : (
          // ── FARCASTER DESKTOP ──
          <div className="flex flex-col items-end gap-1">
            {activeAddress ? (
              <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/40 rounded-full">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <div className="flex flex-col items-end">
                  <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest italic leading-none">
                    Linked Mobile Wallet
                  </span>
                  <span className="text-[8px] font-mono text-emerald-300 px-1 rounded mt-0.5">
                    {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/40 rounded-md">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span className="text-[7px] md:text-[8px] font-black text-amber-300 uppercase italic tracking-widest max-w-[160px] text-right leading-tight">
                  No wallet linked. Open on Mobile to link for Airdrops!
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 bg-red-900/30 px-1.5 py-0.5 rounded border border-red-500/30">
               <Info className="w-3 h-3 text-red-400" />
               <span className="text-[6px] md:text-[7px] font-bold text-red-400 uppercase tracking-widest leading-none">
                 Desktop Read-Only · Use Mobile to Transact
               </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedAuthBanner;

