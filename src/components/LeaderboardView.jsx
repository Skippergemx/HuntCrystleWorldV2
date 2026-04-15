import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Header, AvatarMedia, SquadHUD } from './GameUI';
import { NPCCard } from './NPCCard';
import { Trophy, Skull, Star, ChevronUp, Swords, Medal, Coins, Check, Sparkles } from 'lucide-react';
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

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_leaderboard_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Hall of Fame",
      npc: 4,
      visualType: 'fame',
      text: "Welcome to the central terminal of the highest-ranking Hunters in the Meta-verse. Check your global standing here.",
      hint: "Tip: Top Hunters receive exclusive seasonal rewards!"
    },
    {
      title: "Ranking Metrics",
      npc: 2,
      visualType: 'categories',
      text: "You can filter the leaderboard by multiple categories: Player Level, Boss Damage output, Dungeon Depth, and Token Wealth.",
      hint: "Strategy: Specialize in one area to climb faster."
    },
    {
      title: "Identity Uplink",
      npc: 5,
      visualType: 'uplink',
      text: "As long as your network connection is active, your stats are periodically updated and synchronized with the global grid.",
      hint: "Warning: Updates may take a few moments to broadcast."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_leaderboard_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

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

      <Header title="ELITE HALL OF FAME" onClose={adventure.goBack} npcNum={28} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
      }} icon={<Trophy className="text-amber-400" />} />

      <NPCCard
        citizenNum={28}
        name="HERALD"
        accentColor="bg-rose-500"
        textColor="text-rose-600"
        glowColor="bg-rose-500"
        statusTag="RANKINGS_LIVE"
        statusTag2="BROADCAST_ON"
        prefix="◢HERALD: "
        dialogues={[
          "The Hall of Fame! Only the strongest hunters stand here for all to see.",
          "Rankings update in real-time as hunters complete dungeon runs and earn GX.",
          "Can you break into the Top 10? The gap tightens with every level.",
          "Elite rankings carry prestige. Other hunters will know your name.",
          "Consistent dungeon activity pushes your rank higher every session.",
          "The leaderboard is global. Every player you see is a real rival.",
          "Syndicates with top-ranked members get bonus visibility in the server.",
          "First place today doesn't mean first place tomorrow. Stay sharp!"
        ]}
      />

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
                  <span className="text-[10px] font-black text-white uppercase italic tracking-widest leading-none">SECTOR: {entry.maxDepthMapName || 'NEON SLUMS'} (LVL {entry.maxDepthMapMinLevel || 1}+) {entry.maxDepthFloor ? `[FL ${entry.maxDepthFloor}]` : (entry.maxDepth ? `[FL ${entry.maxDepth}]` : '')}</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0 pr-2">
                <p className="text-2xl font-black text-white italic tracking-tighter shadow-sm leading-none mb-1">
                  {activeTab === 'boss' ? (entry.totalBossDamage || 0).toLocaleString() : 
                   activeTab === 'gx' ? (entry.tokens || 0).toLocaleString() :
                   activeTab === 'level' ? entry.level :
                   (entry.maxDepthFloor || entry.maxDepth || 1)}
                </p>
                {activeTab === 'depth' && entry.maxDepthMapName && (
                  <p className="text-[7px] font-black text-blue-400 uppercase italic tracking-tighter mb-1">
                    {entry.maxDepthMapName} {entry.maxDepthMapMinLevel ? `(Lv.${entry.maxDepthMapMinLevel}+)` : ''}
                  </p>
                )}
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

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-yellow-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #eab308 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-yellow-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-black text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(255,255,255,0.3)]">
                  {tutorialSteps[tutorialStep].title}
                </h2>
                <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">
                  Step {tutorialStep + 1} / {tutorialSteps.length}
                </div>
              </div>

              {/* NPC & Topic Visual Section */}
              <div className="py-3 md:py-4 relative flex justify-center items-center gap-3 w-full z-10">
                {/* NPC Avatar */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0 flex items-center justify-center">
                   <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                   <div className="absolute inset-x-0 bottom-0 bg-yellow-600 text-[6px] font-black text-black text-center py-0.5 uppercase italic">BROADCASTER</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-yellow-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'fame' && (
                     <Trophy className="text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'categories' && (
                     <Star className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] z-10 animate-pulse" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'uplink' && (
                     <Medal className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-yellow-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-yellow-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-yellow-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-yellow-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-yellow-500' : 'bg-slate-800'}`}
                   >
                     {dontShowAgain && <Check size={10} className="text-black" />}
                   </button>
                   <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                     Don't show this briefing again
                   </span>
                </div>

                <div className="flex gap-2 shrink-0 pb-1">
                   {tutorialStep > 0 && (
                      <button
                        onClick={() => setTutorialStep(prev => prev - 1)}
                        className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[9px]"
                      >
                        BACK
                      </button>
                   )}
                  <button
                    onClick={nextStep}
                    className="flex-[2] bg-yellow-600 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'VIEW STANDINGS' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border: 2px solid black; }
        .font-comic { font-family: 'Inter', sans-serif; font-weight: 900; }
      `}</style>
    </div>
  );
});
