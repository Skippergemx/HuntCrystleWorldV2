import { useState, useMemo, useEffect } from 'react';
import { Header, AvatarMedia, SquadHUD } from './GameUI';
import { Trophy, Skull, Star, ChevronUp, Swords, Medal, Coins } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import React from 'react';

/**
 * LeaderboardView V2: Hall of Fame
 * Unified rankings directly from the 'players' collection.
 * Enhanced UID-primary identity keys and high-fidelity comic aesthetics.
 */
export const LeaderboardView = React.memo(() => {
  const { leaderboard, user, player, gameLoop, TAVERN_MATES, adventure, openGuide, updateBoardTab, activeBoardTab } = useGame();
  const { setView } = adventure;
  const { dragonTimeLeft } = gameLoop;

  // Tabs configuration
  const tabs = [
    { id: 'boss', label: 'Iron Slayer', sub: 'Boss Damage', icon: <Swords size={14} />, color: 'from-red-600 to-red-950', secondary: 'border-red-500' },
    { id: 'level', label: 'Ancient Veteran', sub: 'Highest Level', icon: <Star size={14} />, color: 'from-amber-500 to-amber-900', secondary: 'border-amber-400' },
    { id: 'depth', label: 'Dungeon Vanguard', sub: 'Deepest Floor', icon: <ChevronUp size={14} />, color: 'from-blue-600 to-blue-950', secondary: 'border-blue-400' },
    { id: 'gx', label: 'Wealth Baron', sub: 'Liquid GX', icon: <Coins size={14} />, color: 'from-emerald-500 to-emerald-900', secondary: 'border-emerald-400' }
  ];

  const selfRank = useMemo(() => {
    if (!user?.uid) return null;
    const idx = (leaderboard || []).findIndex(e => (e.uid === user.uid) || (e.id === user.uid));
    return idx === -1 ? null : idx + 1;
  }, [leaderboard, user?.uid]);

  // Sync active local tab to global if needed
  const activeTab = activeBoardTab || 'level';

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 relative overflow-hidden bg-slate-950 font-comic">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>

      <Header title="ELITE HALL OF FAME" onClose={() => setView('menu')} onHelp={() => openGuide('leaderboard')} icon={<Trophy className="text-amber-400" />} />

      {/* Your Rank Pin (V2 Design) */}
      {selfRank && (
        <div className="mx-2 mt-4 bg-cyan-600 border-[6px] border-black p-4 flex justify-between items-center shadow-[10px_10px_0_rgba(0,0,0,0.8)] relative z-20 transition-all hover:scale-[1.02]">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-black border-4 border-cyan-400 flex items-center justify-center font-black italic text-cyan-400 shadow-2xl skew-x-[-10deg]">
                #{selfRank}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-white/50 uppercase italic tracking-[0.2em] mb-1">Global Standing Secured</p>
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Identity Uplink Active</h3>
                  <SquadHUD player={player} TAVERN_MATES={TAVERN_MATES} orientation="horizontal" compact={true} />
                </div>
              </div>
           </div>
           <Trophy size={32} className="text-cyan-200 opacity-30 animate-pulse" />
        </div>
      )}

      {/* Hero Category Selectors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-8 relative z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => updateBoardTab?.(tab.id)}
            className={`relative flex flex-col items-center p-4 border-[6px] transition-all duration-300 ${activeTab === tab.id ? `${tab.secondary} bg-gradient-to-br ${tab.color} scale-105 shadow-[0_15px_30px_rgba(0,0,0,0.5)] translate-y-[-4px]` : 'border-black bg-slate-900/50 opacity-60 hover:opacity-100 hover:scale-[1.02]'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-inner ${activeTab === tab.id ? 'bg-white/10' : 'bg-black/60'}`}>
               {tab.icon}
            </div>
            <span className="text-[10px] font-black uppercase italic tracking-tighter text-white leading-none mb-1">{tab.label}</span>
            <span className="text-[7px] font-black uppercase opacity-40 text-white tracking-[0.1em]">{tab.sub}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard List (V2 Performance Engine) */}
      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 pb-12 relative z-10 w-full max-w-4xl mx-auto">
        {(leaderboard || []).map((entry, idx) => {
          const entryUid = entry.uid || entry.id;
          const isSelf = user?.uid && (entryUid === user.uid);
          const isTop3 = idx < 3;
          const medalStyles = idx === 0 ? 'bg-amber-400 border-amber-200 text-black' : 
                             idx === 1 ? 'bg-slate-300 border-slate-100 text-black' : 
                             idx === 2 ? 'bg-amber-700 border-amber-600 text-white' : 
                             'bg-slate-800 border-slate-700 text-white';

          return (
            <div 
              key={idx} 
              className={`group relative flex items-center gap-6 p-4 border-[4px] transition-all duration-300 ${isSelf ? 'border-cyan-400 bg-cyan-950/40 shadow-[10px_10px_0_rgba(34,211,238,0.2)]' : 'border-black bg-slate-900/50 hover:bg-slate-800'}`}
            >
              <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border-[4px] font-black italic text-xl shadow-[4px_4px_0_rgba(0,0,0,1)] ${medalStyles} rotate-[-2deg] group-hover:rotate-0 transition-transform`}>
                {idx + 1}
              </div>

              <div className="w-14 h-14 bg-black border-4 border-black overflow-hidden flex-shrink-0 relative group-hover:scale-110 transition-transform shadow-2xl">
                <AvatarMedia num={entry.avatar || entry.heroAvatar || 1} className="w-full h-full object-cover" />
                {isTop3 && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none"></div>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter truncate drop-shadow-md">{entry.name || 'ANON_UNIT'}</h3>
                  {isSelf && <span className="text-[8px] bg-cyan-500 text-black font-black px-2 py-0.5 rounded border border-black uppercase italic animate-pulse">Master</span>}
                  {idx === 0 && <Medal size={16} className="text-amber-400" />}
                </div>
                <div className="flex items-center gap-3 mt-1.5 opacity-60">
                  <span className="text-[10px] font-black text-white uppercase italic tracking-widest leading-none">LVL {entry.level} Hunter</span>
                  <div className="w-1.5 h-1.5 bg-white/10 rounded-full"></div>
                  <span className="text-[10px] font-black text-white uppercase italic tracking-widest leading-none">SECTOR: FLOOR {entry.maxDepth || 1}</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0 pr-2">
                <p className="text-2xl font-black text-white italic tracking-tighter shadow-sm leading-none mb-1">
                  {activeTab === 'boss' ? (entry.totalBossDamage || 0).toLocaleString() : 
                   activeTab === 'gx' ? (entry.tokens || 0).toLocaleString() :
                   activeTab === 'level' ? entry.level :
                   (entry.maxDepth || 1)}
                </p>
                <p className="text-[8px] font-black text-white/30 uppercase italic tracking-widest">
                  {activeTab === 'boss' ? 'CRITICAL DMG' : activeTab === 'gx' ? 'LIQUID GX' : activeTab === 'level' ? 'EXPERIENCE' : 'EXPEDITION DEPTH'}
                </p>
              </div>

              {isTop3 && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : 'bg-amber-700'}`}></div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border: 2px solid black; }
        .font-comic { font-family: 'Inter', sans-serif; font-weight: 900; }
      `}</style>
    </div>
  );
});
