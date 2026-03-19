import React, { useState, useMemo } from 'react';
import { Header, AvatarMedia, SquadHUD } from './GameUI';
import { Trophy, Skull, Star, ChevronUp, Swords, Medal, Coins } from 'lucide-react';

export const LeaderboardView = React.memo(({ leaderboard, user, player, dragonTimeLeft, TAVERN_MATES, setView, onHelp }) => {
  const [activeTab, setActiveTab] = useState('boss'); // 'boss', 'level', 'depth'

  const sortedData = useMemo(() => {
    const data = [...leaderboard];
    if (activeTab === 'boss') {
      return data.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (activeTab === 'level') {
      return data.sort((a, b) => (b.level || 0) - (a.level || 0));
    } else if (activeTab === 'depth') {
      return data.sort((a, b) => (b.maxDepth || 0) - (a.maxDepth || 0));
    } else if (activeTab === 'gx') {
      return data.sort((a, b) => (b.gx || 0) - (a.gx || 0));
    }
    return data;
  }, [leaderboard, activeTab]);

  const tabs = [
    { id: 'boss', label: 'Iron Slayer', sub: 'Boss Damage', icon: <Swords size={12} />, color: 'from-red-600 to-red-900', secondary: 'border-red-500' },
    { id: 'level', label: 'Ancient Veteran', sub: 'Highest Level', icon: <Star size={12} />, color: 'from-amber-500 to-amber-800', secondary: 'border-amber-400' },
    { id: 'depth', label: 'Dungeon Vanguard', sub: 'Deepest floor', icon: <ChevronUp size={12} />, color: 'from-blue-600 to-blue-900', secondary: 'border-blue-400' },
    { id: 'gx', label: 'Wealth Baron', sub: 'Highest GX', icon: <Coins size={12} />, color: 'from-emerald-500 to-emerald-800', secondary: 'border-emerald-400' }
  ];

  const selfRank = useMemo(() => {
    const idx = sortedData.findIndex(e => e.uid === (user?.email || user?.uid));
    return idx === -1 ? null : idx + 1;
  }, [sortedData, user]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none"></div>

      <Header title="ELITE HALL OF FAME" onClose={() => setView('menu')} onHelp={onHelp} icon={<Trophy className="text-amber-400" />} />

      {/* Hero Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 mt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center p-2 border-2 transition-all duration-300 ${activeTab === tab.id ? `${tab.secondary} bg-gradient-to-br ${tab.color} scale-105 shadow-[0_0_15px_rgba(0,0,0,0.5)]` : 'border-slate-800 bg-slate-900 opacity-60'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-800'}`}>
              {tab.icon}
            </div>
            <span className="text-[8px] font-black uppercase italic tracking-tighter text-white/90 leading-none">{tab.label}</span>
            <span className="text-[6px] font-bold uppercase opacity-50 text-white mt-1">{tab.sub}</span>
          </button>
        ))}
      </div>

      {/* Hall of Fame List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-20">
        {sortedData.map((entry, idx) => {
          const isSelf = entry.uid === (user?.email || user?.uid);
          const isTop3 = idx < 3;
          const medalColor = idx === 0 ? 'bg-amber-400 border-amber-200' : idx === 1 ? 'bg-slate-300 border-slate-100' : idx === 2 ? 'bg-amber-700 border-amber-600' : 'bg-black border-white/20';

          return (
            <div 
              key={idx} 
              className={`relative flex items-center gap-3 p-3 border-2 transition-all duration-300 ${isSelf ? 'border-cyan-400 bg-cyan-900/20 scale-[1.02] shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-black bg-slate-900/60'}`}
            >
              {/* Rank Badge */}
              <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border-2 font-black italic text-xs shadow-[2px_2px_0_rgba(0,0,0,1)] ${medalColor} ${idx < 3 ? 'text-black' : 'text-white'}`}>
                {idx + 1}
              </div>

              {/* Avatar Preview */}
              <div className="w-10 h-10 bg-black border-2 border-white/10 overflow-hidden flex-shrink-0 grayscale-[0.3]">
                <AvatarMedia num={entry.heroAvatar || 1} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[11px] font-black text-white uppercase italic tracking-tighter truncate">{entry.name}</h3>
                  {isSelf && <span className="text-[6px] bg-cyan-500 text-black font-black px-1 rounded-sm uppercase tracking-tighter animate-pulse">YOU</span>}
                  {idx === 0 && <Medal size={10} className="text-amber-400" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic">LVL {entry.level} Hunter</span>
                  <div className="h-1 w-1 bg-slate-700 rounded-full"></div>
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest italic">Floor {entry.maxDepth || 1}</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-white italic tracking-tighter">
                  {activeTab === 'boss' ? (entry.score || 0).toLocaleString() : 
                   activeTab === 'gx' ? (entry.gx || 0).toLocaleString() :
                   activeTab === 'level' ? entry.level :
                   (entry.maxDepth || 1)}
                </p>
                <p className="text-[6px] font-black text-slate-500 uppercase italic opacity-70">
                  {activeTab === 'boss' ? 'DMG' : activeTab === 'gx' ? 'GX' : activeTab === 'level' ? 'LVL' : 'FLOOR'}
                </p>
              </div>

              {/* Top 3 Glow */}
              {isTop3 && (
                <div className={`absolute inset-0 pointer-events-none opacity-10 blur-sm ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : 'bg-amber-700'}`}></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Personal Sticky Rank */}
      {selfRank && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-cyan-600 border-4 border-black p-3 flex justify-between items-center shadow-[6px_6px_0_rgba(0,0,0,0.5)] z-20">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-black flex items-center justify-center border-2 border-cyan-400 font-black italic text-cyan-400">
               #{selfRank}
             </div>
             <div>
               <p className="text-[8px] font-black text-white/70 uppercase italic tracking-widest leading-none">Your Standing</p>
               <div className="flex items-center gap-3">
                 <p className="text-xs font-black text-white uppercase italic tracking-tighter">Ready to Ascend?</p>
                 <SquadHUD player={player} dragonTimeLeft={dragonTimeLeft} TAVERN_MATES={TAVERN_MATES} orientation="horizontal" />
               </div>
             </div>
          </div>
          <Trophy size={20} className="text-cyan-200 animate-bounce" />
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
});
