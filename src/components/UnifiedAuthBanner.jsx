import React from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useGame } from '../contexts/GameContext';
import { Wallet, LogIn, CheckCircle, ShieldCheck, Loader2, Info } from 'lucide-react';

const UnifiedAuthBanner = () => {
  const { isFarcaster } = useUnifiedAuth();
  const game = useGame(); 

  // Safely extract from game context (since this is now rendered inside the Game provider)
  const { user, player, wallet } = game || {};
  
  if (!user || (!isFarcaster && !user)) return null;

  // STRICT FARCASTER WALLET PAIRING POLICY
  // The system prioritizes the canonical wallet saved in the player's database profile.
  // This bypasses Farcaster Web's fake ethProviders which prompt MetaMask on Desktop.
  const activeAddress = player?.walletAddress || wallet?.address;

  const handleMobileOnlyConnect = () => {
    // Determine if user is attempting to connect from a non-mobile browser
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isFarcaster && !isMobile) {
      alert("🚨 SECURITY PROTOCOL: To guarantee the true ownership of your NFTs and items, your Farcaster account must be permanently paired with a wallet.\n\nPlease open this game on the Warpcast Mobile App to securely link your native wallet. Once paired, your items will automatically be readable right here on the web browser!");
      return;
    }
    
    // Otherwise, allow native uplink
    wallet?.connectWallet();
  };

  return (
    <div className="w-full relative z-[100] flex items-center justify-between px-3 md:px-6 py-2 bg-purple-950/40 border-b border-purple-500/30 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Identity Core */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2 group">
            <div className="relative">
              <img src={user.pfp} alt="Profile" className="w-8 h-8 rounded-full border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform" />
              {isFarcaster && (
                <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-0.5 border border-white/20 shadow-lg">
                  <ShieldCheck className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-purple-100 uppercase tracking-tighter italic leading-none">{user.username}</span>
               <span className="text-[7px] font-bold text-purple-400/70 uppercase tracking-widest leading-none mt-0.5">{isFarcaster ? 'Farcaster Unit' : 'Web Operator'}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Uplink System */}
      <div className="flex items-center gap-2">
        {activeAddress ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/40 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <div className="flex items-center gap-1.5">
               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest italic hidden sm:inline">
                 {isFarcaster ? "Farcaster Uplink Active" : "Web3 Link Established"}
               </span>
               <span className="text-[9px] font-mono text-emerald-300/80 bg-emerald-500/5 px-1.5 rounded">
                 {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
               </span>
            </div>
          </div>
        ) : (
          user && (
            <button 
              onClick={handleMobileOnlyConnect}
              className={`flex items-center gap-2 px-4 py-1.5 ${isFarcaster ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-[0_0_15px_rgba(192,38,211,0.3)]'} hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] text-white text-[9px] font-black rounded-full transition-all active:scale-95 uppercase tracking-widest italic`}
            >
              <Wallet className="w-3 h-3" />
              {isFarcaster ? "Sync Mobile Wallet" : "Establish Link"}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default UnifiedAuthBanner;
