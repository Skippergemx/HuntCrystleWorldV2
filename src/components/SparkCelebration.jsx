import React, { useEffect } from 'react';

/**
 * SparkCelebration — Full-screen overlay when Aether or Hunt Sparks drop.
 * 
 * Aether Spark: Purple/gold theme, dramatic 3s celebration
 * Hunt Spark: Cyan/blue theme, restrained 2s celebration
 */
export const SparkCelebration = ({ spark, onComplete }) => {
  if (!spark) return null;

  const isAether = spark.type === 'aether';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, isAether ? 3000 : 2000);
    return () => clearTimeout(timer);
  }, [isAether, onComplete]);

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Theme-specific backdrop glow */}
      <div className={`absolute inset-0 backdrop-blur-sm ${isAether ? 'bg-purple-900/60' : 'bg-blue-900/50'}`} />

      {/* Spark icon with pulse */}
      <div className="relative flex flex-col items-center">
        <div className={`text-7xl md:text-9xl animate-spark-pulse ${isAether ? 'drop-shadow-[0_0_40px_rgba(168,85,247,1)]' : 'drop-shadow-[0_0_30px_rgba(34,211,238,1)]'}`}>
          {isAether ? '✨' : '⚡'}
        </div>
        <div className={`mt-4 font-black text-3xl md:text-5xl uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(0,0,0,1)] ${isAether ? 'text-purple-300' : 'text-cyan-300'}`}>
          {isAether ? 'AETHER SPARK' : 'HUNT SPARK'} ACQUIRED!
        </div>
        {isAether && (
          <div className="mt-2 text-purple-400/70 text-sm md:text-base font-bold uppercase tracking-widest">
            Legendary Discovery
          </div>
        )}
      </div>
    </div>
  );
};

export default SparkCelebration;
