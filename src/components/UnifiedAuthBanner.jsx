import React from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useWallet } from '../hooks/useWallet';
import { Wallet, LogIn, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';

const UnifiedAuthBanner = () => {
  const { user, isFarcaster, loading, loginWithGoogle } = useUnifiedAuth();
  const { address, connectWallet } = useWallet(() => {}); // Pass empty logger since we just want state

  if (loading) {
    return (
      <div className="w-full p-3 bg-purple-950/20 border-b border-purple-500/10 backdrop-blur-md flex justify-center items-center gap-2">
        <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        <span className="text-[9px] font-black text-purple-400/50 uppercase tracking-[0.4em] animate-pulse">Syncing Grid Identity...</span>
      </div>
    );
  }

  return (
    <div className="w-full sticky top-0 z-[100] flex items-center justify-between px-3 md:px-6 py-2 bg-purple-950/40 border-b border-purple-500/30 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
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
               <span className="text-[7px] font-bold text-purple-400/70 uppercase tracking-widest leading-none mt-0.5">{isFarcaster ? 'Farcaster Unit' : 'Web_Operator'}</span>
            </div>
          </div>
        ) : (
          <button 
            onClick={loginWithGoogle} 
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black rounded border border-white/10 transition-all hover:border-white/30 uppercase italic"
          >
            <LogIn className="w-3 h-3 text-cyan-400" /> Google_Link
          </button>
        )}
      </div>

      {/* Uplink System */}
      <div className="flex items-center gap-2">
        {address ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/40 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <div className="flex items-center gap-1.5">
               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest italic hidden sm:inline">
                 {isFarcaster ? "Farcaster Uplink Active" : "Web3 Link Established"}
               </span>
               <span className="text-[9px] font-mono text-emerald-300/80 bg-emerald-500/5 px-1.5 rounded">
                 {address.slice(0, 6)}...{address.slice(-4)}
               </span>
            </div>
          </div>
        ) : (
          user && (
            <button 
              onClick={connectWallet}
              className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-[9px] font-black rounded-full shadow-[0_0_15px_rgba(192,38,211,0.3)] hover:shadow-[0_0_20px_rgba(192,38,211,0.5)] transition-all active:scale-95 uppercase tracking-widest italic"
            >
              <Wallet className="w-3 h-3" />
              {isFarcaster ? "Manual Sync Unavailable" : "Establish Link"}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default UnifiedAuthBanner;
