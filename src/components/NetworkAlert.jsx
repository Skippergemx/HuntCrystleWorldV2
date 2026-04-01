import React, { useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { AlertTriangle, WifiOff } from 'lucide-react';

export const NetworkAlert = () => {
  const { isOffline, isSlow } = useNetworkStatus();

  if (!isOffline && !isSlow) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300 pointer-events-auto">
      <div className="absolute inset-0 comic-halftone opacity-20 text-yellow-500 pointer-events-none"></div>
      
      <div className="relative bg-yellow-400 border-[6px] border-black p-6 md:p-8 max-w-md w-full shadow-[10px_10px_0_rgba(0,0,0,1)] transform rotate-2 animate-bounce-short">
        <div className="absolute -top-6 -left-4 bg-red-600 text-white border-[4px] border-black px-4 py-1 transform -rotate-6 shadow-[4px_4px_0_rgba(0,0,0,1)]">
          <span className="font-black italic uppercase tracking-widest text-sm md:text-base">ALERT!</span>
        </div>
        
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-black text-yellow-400 p-4 rounded-full border-[4px] border-black transform -rotate-12 shadow-[4px_4px_0_rgba(255,255,255,0.2)]">
            {isOffline ? <WifiOff size={48} /> : <AlertTriangle size={48} />}
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tighter italic leading-none">
            {isOffline ? "Uplink Severed!" : "Slow Connection!"}
          </h2>
          
          <div className="bg-white/20 p-3 border-2 border-black/20 rounded">
            <p className="text-sm md:text-base font-black text-black/80 uppercase italic">
              {isOffline 
                ? "The grid is unreachable! Re-establish connection to resume your hunt."
                : "Signal interference detected! We've paused grid activities to protect your data."}
            </p>
          </div>
          
          <div className="w-full bg-black/10 h-2 mt-2 border border-black/20 rounded-full overflow-hidden">
            <div className="w-full h-full bg-red-600 animate-pulse"></div>
          </div>
          <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">Scanning for signal...</span>
        </div>
      </div>
    </div>
  );
};
