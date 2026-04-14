import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';

const PERSONALITY_STYLES = {
  Merchant:  { tape: 'bg-amber-400',   border: 'border-amber-500', badge: 'bg-amber-100 text-amber-800',  tag: 'bg-amber-500 text-black' },
  'Street Kid': { tape: 'bg-red-400',  border: 'border-red-500',   badge: 'bg-red-100 text-red-800',      tag: 'bg-red-500 text-white' },
  Mystic:    { tape: 'bg-purple-400',  border: 'border-purple-500', badge: 'bg-purple-100 text-purple-800',tag: 'bg-purple-500 text-white' },
  Elder:     { tape: 'bg-green-400',   border: 'border-green-600',  badge: 'bg-green-100 text-green-900',  tag: 'bg-green-600 text-white' },
  Tinkerer:  { tape: 'bg-cyan-400',    border: 'border-cyan-500',   badge: 'bg-cyan-100 text-cyan-800',    tag: 'bg-cyan-500 text-black' },
  Soldier:   { tape: 'bg-slate-500',   border: 'border-slate-600',  badge: 'bg-slate-200 text-slate-800',  tag: 'bg-slate-600 text-white' },
  Wanderer:  { tape: 'bg-rose-400',    border: 'border-rose-500',   badge: 'bg-rose-100 text-rose-800',    tag: 'bg-rose-500 text-white' },
};

// Typewriter hook
const useTypewriter = (text, speed = 28) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
  }, [text]);
  useEffect(() => {
    if (displayed.length >= text.length) return;
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => clearTimeout(t);
  }, [displayed, text, speed]);
  return displayed;
};

// --- NPC Dialogue Modal ---
const NPCModal = ({ quest, onClose, onComplete, canComplete }) => {
  const { player, ITEMS, FOODS, MAPS } = useGame();
  const displayedText = useTypewriter(quest.dialogue);
  const style = PERSONALITY_STYLES[quest.personality] || PERSONALITY_STYLES.Wanderer;
  const [activeTooltip, setActiveTooltip] = useState(null);

  const inventory = player?.inventory || {};
  const rewardFood = FOODS?.find(f => f.id === quest.reward.foodId);

  const getItemSource = (itId) => {
    if (itId?.includes('apple') || itId?.includes('grapes') || itId?.includes('berry') || itId?.includes('cherry') || itId?.includes('peach') || itId?.includes('lemon') || itId?.includes('orange') || itId?.includes('pear')) {
        return "Dragons Ground / Orchard";
    }
    const sources = MAPS?.filter(m => m.lootTable?.includes(itId)).map(m => m.name);
    if (sources && sources.length > 0) return sources.join(", ");
    return "Unknown / Rare Drop";
  };

  const requirementStatus = quest.requires.map(req => {
    const owned = Object.values(inventory).filter(i => i?.id?.startsWith(req.itemId)).length;
    const item = Object.values(ITEMS || []).find(i => i.id === req.itemId);
    return { 
        ...req, 
        owned, 
        itemName: item?.name || req.itemId, 
        itemIcon: item?.icon || '📦', 
        met: owned >= req.qty,
        sources: getItemSource(req.itemId)
    };
  });

  const allMet = requirementStatus.every(r => r.met);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border-[4px] border-black shadow-[10px_10px_0_rgba(0,0,0,1)] bg-[#faf6f0]">
        
        {/* Personality Header */}
        <div className={`w-full ${style.tape} py-3 px-6 border-b-[4px] border-black flex items-center justify-between`}>
           <div className="flex items-center gap-3">
              <span className="text-xl leading-none">🏙️</span>
              <h2 className="text-xl font-black text-black uppercase italic tracking-tighter">Mission: {quest.npcName}</h2>
           </div>
           <div className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase italic border-2 border-white shadow-md">
              {quest.personalityTag}
           </div>
        </div>

        <div className="flex flex-col md:flex-row h-full max-h-[85vh] md:max-h-none overflow-y-auto md:overflow-hidden">
          {/* Left: Atmospheric NPC Artwork */}
          <div className="w-full md:w-60 shrink-0 relative bg-slate-900 border-b-[4px] md:border-b-0 md:border-r-[4px] border-black overflow-hidden">
             <img 
                src={`/assets/CrystleTown/CrystleTownCitizen/CrystleTownCitizen (${quest.npcIndex}).jpg`} 
                className="w-full h-full object-cover object-top"
                alt={quest.npcName}
             />
             <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-md p-4 border-t-[3px] border-black/50">
                <p className="text-[10px] font-black text-white text-center uppercase italic tracking-widest">{quest.personality}</p>
             </div>
             {/* half-tone texture overlay */}
             <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
          </div>

          {/* Right: Tactical Console */}
          <div className="flex-1 p-4 md:p-6 flex flex-col relative bg-[#fdfaf5]">
             {/* Fine grid background */}
             <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '15px 15px' }} />

             <div className="mb-6 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                   <div className={`w-2 h-2 rounded-full ${style.tape} animate-pulse`} />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen Request Identified...</span>
                </div>
                <div className="bg-white border-[3px] border-black p-4 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] relative">
                   <div className="absolute -left-2 top-6 w-4 h-4 bg-white border-l-[3px] border-b-[3px] border-black rotate-45 hidden md:block" />
                   <p className="text-[13px] font-bold text-black leading-snug italic italic">
                      "{displayedText}<span className="inline-block w-1.5 h-4 bg-black ml-1 animate-pulse align-middle" />
                   </p>
                </div>
             </div>

             <div className="flex-1 space-y-4 mb-6 relative z-10">
                <div>
                   <p className="text-[10px] font-black uppercase text-black/50 mb-3 tracking-widest flex items-center gap-2">
                      <span className="w-4 h-[2px] bg-black/20" /> REQUIRED LOGISTICS
                   </p>
                   <div className="grid grid-cols-1 gap-2">
                      {requirementStatus.map((req, i) => (
                         <div 
                           key={i} 
                           onMouseEnter={() => setActiveTooltip(req.itemId)}
                           onMouseLeave={() => setActiveTooltip(null)}
                           onClick={() => setActiveTooltip(activeTooltip === req.itemId ? null : req.itemId)}
                           className={`group/req relative flex items-center gap-3 px-3 py-2 border-[3px] rounded-xl shadow-[3px_3px_0_rgba(0,0,0,0.1)] transition-all cursor-help ${req.met ? 'border-green-500 bg-green-50' : 'border-black bg-white'}`}
                         >
                          <span className="text-2xl leading-none">{req.itemIcon}</span>
                          <div className="flex-1">
                            <p className="text-[11px] font-black uppercase text-black leading-none">{req.itemName}</p>
                            <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{activeTooltip === req.itemId ? `DROPS IN: ${req.sources}` : "Materials needed for sector expansion."}</p>
                          </div>
                          <div className={`text-[11px] font-black px-3 py-1 rounded-full border-[2px] ${req.met ? 'bg-green-500 border-green-600 text-white' : 'bg-slate-100 border-black text-black'}`}>
                            {req.owned}/{req.qty}
                          </div>
                        </div>
                      ))}
                   </div>
                </div>

                {rewardFood && (
                  <div className="bg-slate-900 p-3 rounded-2xl border-[3px] border-black flex items-center gap-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center border-2 border-white/5">
                       <span className="text-4xl leading-none">{rewardFood.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.2em] mb-1">CONTRACT_REWARD</p>
                      <p className="text-xs font-black text-white uppercase italic truncate">Meta-Delicacy: {rewardFood.name}</p>
                      <p className="text-[10px] text-white/50 font-bold italic truncate mt-0.5">{rewardFood.effectLabel}</p>
                    </div>
                  </div>
                )}
             </div>

             {/* Action Console */}
             <div className="flex gap-4 relative z-10">
                <button
                  onClick={onClose}
                  className="flex-1 bg-white border-[3px] border-black text-black py-4 font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic"
                >
                  Postpone
                </button>
                <button
                  onClick={() => onComplete(quest)}
                  disabled={!allMet}
                  className={`flex-[2] py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${allMet ? `${style.tape} text-black hover:opacity-90` : 'bg-slate-300 text-slate-500 cursor-not-allowed grayscale'}`}
                >
                  {allMet ? (
                    <>
                      EXECUTE SYNC <ChevronRight size={18} />
                    </>
                  ) : (
                    <>
                      INSUFFICIENT RESOURCES <AlertCircle size={16} />
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>

        {/* Global Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/50 hover:bg-black text-white rounded-full border-2 border-white/20 flex items-center justify-center transition-all">
           <X size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
};

// --- NPC Card ---
const NPCCard = ({ quest, onOpen, idx }) => {
  const { player, ITEMS } = useGame();
  const style = PERSONALITY_STYLES[quest.personality] || PERSONALITY_STYLES.Wanderer;
  const rotate = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';
  const inventory = player?.inventory || {};

  const rewardFoodEmoji = quest.reward?.foodId?.includes('steak') ? '🥩'
    : quest.reward?.foodId?.includes('ramen') ? '🍜'
    : quest.reward?.foodId?.includes('jerky') ? '🍖'
    : quest.reward?.foodId?.includes('brew') ? '🍵'
    : quest.reward?.foodId?.includes('bubble') ? '🧋'
    : quest.reward?.foodId?.includes('bento') ? '🍱'
    : quest.reward?.foodId?.includes('energy') ? '⚡'
    : quest.reward?.foodId?.includes('smoothie') ? '🥤'
    : quest.reward?.foodId?.includes('taco') ? '🌮'
    : quest.reward?.foodId?.includes('curry') ? '🍛'
    : quest.reward?.foodId?.includes('gruel') ? '🍲'
    : '🍣';

  const allMet = quest.requires.every(req => {
    const owned = Object.values(inventory).filter(i => i?.id?.startsWith(req.itemId)).length;
    return owned >= req.qty;
  });

  return (
    <div
      onClick={() => onOpen(quest)}
      className={`relative group ${rotate} transform transition-all hover:-translate-y-1 cursor-pointer active:translate-y-0`}
    >
      {/* Background Tape Offset */}
      <div className={`absolute inset-0 ${style.tape} rounded-2xl translate-x-1.5 translate-y-1.5 opacity-30 group-hover:opacity-50 transition-all`} />

      <div className="relative bg-white border-[3px] border-black rounded-2xl overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] flex h-44">
        {/* Left: NPC Portrait Sidebar */}
        <div className="w-24 md:w-28 shrink-0 relative bg-slate-900 border-r-[3px] border-black overflow-hidden group-hover:bg-slate-800 transition-colors">
           <img 
              src={`/assets/CrystleTown/CrystleTownCitizen/CrystleTownCitizen (${quest.npcIndex}).jpg`} 
              className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
              alt={quest.npcName}
           />
           <div className={`absolute inset-x-0 bottom-0 ${style.tape} text-[7px] font-black text-black text-center py-1 uppercase italic tracking-tighter border-t-[2px] border-black`}>
              {quest.personalityTag}
           </div>
           {/* Half-tone texture */}
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
        </div>

        {/* Right: Mission Data */}
        <div className="flex-1 p-3 flex flex-col bg-[#fdfaf5]">
           <div className="flex items-center justify-between mb-1">
              <h3 className="text-[11px] font-black uppercase text-black italic tracking-tighter truncate w-24">
                 {quest.npcName}
              </h3>
              {allMet && (
                <div className="bg-green-500 text-white text-[7px] font-black px-1.5 py-0.5 border border-black uppercase rotate-6 shadow animate-pulse">
                   READY!
                </div>
              )}
           </div>

           <div className="flex-1 space-y-2 py-1">
              {/* Needs List */}
              <div>
                 <p className="text-[7px] font-black uppercase text-black/40 mb-1 tracking-widest leading-none">Requirements:</p>
                 <div className="flex flex-wrap gap-1">
                   {quest.requires.slice(0, 4).map((req, i) => {
                     const item = Object.values(ITEMS || []).find(it => it.id === req.itemId);
                     const owned = Object.values(inventory).filter(iv => iv?.id?.startsWith(req.itemId)).length;
                     const met = owned >= req.qty;
                     return (
                       <div key={i} className={`flex items-center gap-1 px-1 py-1 border-[2px] border-black shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] text-[8px] font-black transition-colors ${met ? 'bg-green-400' : 'bg-white'}`}>
                         <span>{item?.icon || '📦'}</span>
                         <span className="text-black">{req.qty}</span>
                       </div>
                     );
                   })}
                 </div>
              </div>

              {/* Reward Hub */}
              <div className="bg-black rounded-lg p-2 flex items-center gap-2 border border-slate-700 shadow-inner">
                 <span className="text-2xl leading-none">{rewardFoodEmoji}</span>
                 <div className="min-w-0 flex-1">
                   <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.1em] leading-none mb-0.5">CONTRACT REWARD</p>
                   <p className="text-[8px] font-bold text-white uppercase leading-tight truncate italic">
                      {quest.reward.foodId.replace(/_/g, ' ')}
                   </p>
                 </div>
              </div>
           </div>

           <div className="flex items-center justify-end">
              <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase italic">
                 <span>Review Mission</span>
                 <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Main View ---
export const CrystleTownView = () => {
  const { player, adventure, actions, TOWN_QUESTS, FOODS, ITEMS, syncPlayer, openGuide } = useGame();
  const { setView } = adventure;
  const [activeQuest, setActiveQuest] = useState(null);
  const [completedFlash, setCompletedFlash] = useState(null);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const tutorialSteps = [
    {
      title: "Crystle Town Hub",
      npc: 18,
      visualType: 'town',
      text: "Welcome to Crystle Town, Hunter. This isn't just a place to rest—it's a community built on mutual aid and shared progress.",
      hint: "Every citizen here has a unique mission to better the district."
    },
    {
      title: "Community Projects",
      npc: 18,
      visualType: 'quest',
      text: "Our citizens need materials from the deep sectors. Hand over your common loot and fruits to fuel the town's restoration.",
      hint: "Complete requests to cycle in new citizens. There are 30 stories to help!"
    },
    {
      title: "Nutritional Support",
      npc: 18,
      visualType: 'food',
      text: "In return for your help, we’ll provide you with our finest delicacies. These meals give you a stat surge during your dungeon runs.",
      hint: "One food buff at a time. Use the new slot in the Combat HUD to eat."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(s => s + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_town_briefing', 'true');
      }
      setShowTutorial(false);
    }
  };

  const slotIds = player?.townQuestSlots || [];

  const activeQuests = useMemo(() => {
    return slotIds
      .map(id => TOWN_QUESTS?.find(q => q.id === id))
      .filter(Boolean);
  }, [slotIds, TOWN_QUESTS]);

  // Refill slots to 10 if under
  useEffect(() => {
    if (!player || !TOWN_QUESTS) return;
    if (slotIds.length >= 10) return;
    const completed = player.completedTownQuests || {};
    const available = TOWN_QUESTS.filter(q => !completed[q.id] && !slotIds.includes(q.id));
    if (available.length === 0) return;
    const needed = 10 - slotIds.length;
    const picks = [...available].sort(() => Math.random() - 0.5).slice(0, needed).map(q => q.id);
    syncPlayer({ townQuestSlots: [...slotIds, ...picks] });
  }, [slotIds.length]);

  // First-time tutorial trigger
  useEffect(() => {
    const isHidden = localStorage.getItem('hide_town_briefing') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const handleComplete = useCallback((quest) => {
    actions.completeTownQuest(quest, FOODS);
    setCompletedFlash(quest.id);
    setActiveQuest(null);
    setTimeout(() => setCompletedFlash(null), 1500);
  }, [actions, FOODS]);

  const foodsOwned = useMemo(() => {
    return Object.values(player?.inventory || {}).filter(i => {
      return FOODS?.some(f => i?.id?.startsWith(f.id));
    });
  }, [player?.inventory, FOODS]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#e8e0d5] relative">
      {/* Pin-board texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '14px 14px' }} />

      <div className="sticky top-0 z-10">
        <Header 
          title="Crystle Town" 
          onClose={() => setView('menu')} 
          onHelp={() => openGuide('crystle_town')}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Intro Banner */}
        <div className="bg-[#faf6f0] border-[3px] border-black p-3 mb-4 shadow-[3px_3px_0_rgba(0,0,0,1)] -rotate-1 transform relative">
          <div className="absolute -top-2 left-4 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 border border-black uppercase italic">Town Notice Board</div>
          <p className="text-[10px] font-bold text-black/70 italic leading-relaxed">
            The citizens of Crystle Town need supplies. Complete their requests and they'll reward you with food buffs that boost your combat stats. New citizens appear as requests are fulfilled.
          </p>
          {foodsOwned.length > 0 && (
            <div className="mt-2 pt-2 border-t-2 border-dashed border-black/20 flex items-center gap-2">
              <span className="text-[8px] font-black uppercase text-black/50">Food Stash:</span>
              {foodsOwned.slice(0, 6).map((f, i) => {
                const meta = FOODS?.find(fd => f.id?.startsWith(fd.id));
                return <span key={i} className="text-xl leading-none" title={meta?.name}>{meta?.icon || '🍽️'}</span>;
              })}
              {foodsOwned.length > 6 && <span className="text-[8px] font-black text-black/50">+{foodsOwned.length - 6} more</span>}
            </div>
          )}
        </div>

        {/* NPC card grid */}
        {activeQuests.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏙️</p>
            <p className="text-black/50 font-black uppercase text-sm italic">Town is quiet today...</p>
            <p className="text-black/30 text-[10px] font-bold uppercase mt-1">All requests fulfilled. New citizens arriving soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {activeQuests.map((quest, idx) => (
              <NPCCard
                key={quest.id}
                quest={quest}
                idx={idx}
                onOpen={setActiveQuest}
              />
            ))}
          </div>
        )}
      </div>

      {/* NPC Dialogue Modal */}
      {activeQuest && (
        <NPCModal
          quest={activeQuest}
          onClose={() => setActiveQuest(null)}
          onComplete={handleComplete}
          canComplete={true}
        />
      )}

      {/* Interactive Briefing Tutorial */}
      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* Offset border */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-emerald-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden shadow-2xl">
              {/* Halftone pattern bg */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-emerald-500 py-2 border-b-[3px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl font-black text-black text-center uppercase tracking-tighter italic">{tutorialSteps[tutorialStep].title}</h2>
                <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">
                  Step {tutorialStep + 1} / {tutorialSteps.length}
                </div>
              </div>

              {/* NPC Portrait & Visual Icon */}
              <div className="py-3 relative flex justify-center items-center gap-3 w-full z-10 pt-6">
                <div className="w-16 h-28 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0">
                  <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-500 text-[6px] font-black text-black text-center py-0.5 uppercase italic">MOTHER</div>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                  <div className="w-[1px] h-3 bg-gradient-to-b from-emerald-400 to-transparent" />
                </div>

                <div className="w-16 h-16 rounded-xl border-[3px] border-black bg-slate-950 flex items-center justify-center shrink-0">
                  {tutorialSteps[tutorialStep].visualType === 'town' && <ChevronRight className="text-emerald-400 rotate-90" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'quest' && <CheckCircle className="text-cyan-400 animate-pulse" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'food' && <AlertCircle className="text-orange-400 animate-bounce" size={36} />}
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col">
                <div className="bg-white text-black p-3 rounded-xl border-[3px] border-black relative mb-4 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <div className="absolute -top-3 -left-1 bg-emerald-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic">Incoming Transmission</div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase leading-[1.3] tracking-tight italic">"{tutorialSteps[tutorialStep].text}"</p>
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                {/* Tactical Tip */}
                <div className="bg-black/60 p-2 rounded-lg border border-emerald-500/30 mb-4">
                  <p className="text-[8px] font-black text-emerald-400 uppercase italic tracking-widest text-center">⚡ {tutorialSteps[tutorialStep].hint}</p>
                </div>

                {/* Persistence Toggle */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button 
                    onClick={() => setDontShowAgain(!dontShowAgain)} 
                    className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-emerald-500' : 'bg-slate-800'}`}
                  >
                    {dontShowAgain && <CheckCircle size={10} className="text-white" />}
                  </button>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                    Don't show this briefing again
                  </span>
                </div>

                {/* Nav Buttons */}
                <div className="flex gap-2 pb-1">
                  {tutorialStep > 0 && (
                    <button 
                      onClick={() => setTutorialStep(prev => prev - 1)} 
                      className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] italic text-[9px]"
                    >
                      BACK
                    </button>
                  )}
                  <button 
                    onClick={nextStep} 
                    className="flex-[2] bg-emerald-500 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] italic text-[10px] flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'VISIT TOWN' : 'TRANSMIT MORE'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
