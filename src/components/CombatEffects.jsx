import React from 'react';

export const ImpactSplash = ({ splash }) => {
  if (!splash) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="animate-impact relative will-change-transform">
        <div className="absolute inset-0 bg-amber-500 blur-xl opacity-50 scale-150"></div>
        <div className="bg-amber-500 text-black font-black text-xl px-4 py-1 rounded-sm border-2 border-black transform -rotate-12 shadow-[4px_4px_0_rgba(0,0,0,1)]">
          {splash.text}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white text-black font-black text-xs px-2 py-0.5 rounded-sm border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
          -{splash.dmg}
        </div>
      </div>
    </div>
  );
};

export const BossImpactSplash = ({ splash }) => {
  if (!splash) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none scale-[2.0]">
      <div className="animate-impact relative will-change-transform">
        <div className="absolute inset-0 bg-red-600 blur-xl opacity-50 scale-150"></div>
        <div className="bg-red-600 text-white font-black text-2xl px-6 py-2 rounded-sm border-[4px] border-black transform -rotate-12 shadow-[8px_8px_0_rgba(0,0,0,1)]">
          {splash.text}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white text-black font-black text-sm px-3 py-1 rounded-sm border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
          -{splash.dmg}
        </div>
      </div>
    </div>
  );
};
