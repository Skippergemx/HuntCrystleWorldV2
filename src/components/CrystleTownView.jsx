import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, CheckCircle, AlertCircle, Coins, ExternalLink, Sparkles, Zap, Trophy, Cpu } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Header, AvatarMedia } from './GameUI';
import { NPCCard as AmbientNPCCard } from './NPCCard';
import { ComicQuestCard, ComicQuestModal, TalkingNPC } from './SharedQuestUI';
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

// --- NPC Dialogue Modal ---
const NPCModal = ({ quest, onClose, onComplete, onAbandon, canComplete, setConfirmAbandon }) => {
  const { player, ITEMS, FOODS, MAPS } = useGame();
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

  const getSourceColor = (itId) => {
    if (itId?.includes('apple') || itId?.includes('grapes') || itId?.includes('berry') || itId?.includes('cherry') || itId?.includes('peach') || itId?.includes('lemon') || itId?.includes('orange') || itId?.includes('pear')) {
        return 'border-yellow-500 bg-yellow-50 text-yellow-800';
    }
    const matchedMap = MAPS?.find(m => m.lootTable?.includes(itId));
    if (!matchedMap) return 'border-black bg-white';
    
    switch (matchedMap.id) {
       case 'neon_slums':     return 'border-cyan-500 bg-cyan-50 text-cyan-800';
       case 'rust_canyon':    return 'border-orange-500 bg-orange-50 text-orange-800';
       case 'void_sector':    return 'border-purple-500 bg-purple-50 text-purple-800';
       case 'inferno_crater': return 'border-red-500 bg-red-50 text-red-800';
       case 'tectonic_ridge': return 'border-amber-700 bg-amber-50 text-amber-900';
       case 'abyssal_trench': return 'border-blue-500 bg-blue-50 text-blue-800';
       case 'gale_empire':    return 'border-emerald-500 bg-emerald-50 text-emerald-800';
       default:               return 'border-black bg-white';
    }
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
        sources: getItemSource(req.itemId),
        color: getSourceColor(req.itemId)
    };
  });

  const allMet = requirementStatus.every(r => r.met);

  return (
    <ComicQuestModal
      isOpen={true}
      onClose={onClose}
      npcIndex={quest.npcIndex}
      npcName={quest.npcName}
      dialogue={quest.dialogue}
      title={`${quest.npcName}'S REQUEST`}
      accentColor={style.tape}
    >
      <div className="space-y-4">
        <div>
           <p className="text-[10px] font-black uppercase text-black/50 mb-3 tracking-widest flex items-center gap-2">
              <span className="w-4 h-[2px] bg-black/20" /> REQUIRED LOGISTICS
           </p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requirementStatus.map((req, i) => (
                 <div 
                   key={i} 
                   onMouseEnter={() => setActiveTooltip(req.itemId)}
                   onMouseLeave={() => setActiveTooltip(null)}
                   onClick={() => setActiveTooltip(activeTooltip === req.itemId ? null : req.itemId)}
                   className={`group/req relative flex items-center gap-2 px-2 py-1.5 border-2 rounded-xl shadow-[3px_3px_0_rgba(0,0,0,0.1)] transition-all cursor-help ${req.met ? 'border-green-500 bg-green-50' : req.color}`}
                 >
                  <span className="text-xl leading-none">{req.itemIcon}</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-black leading-none">{req.itemName}</p>
                    <p className="text-[8px] font-bold opacity-60 mt-0.5 uppercase leading-tight italic">{activeTooltip === req.itemId ? `DROPS IN: ${req.sources}` : `Gather from ${req.sources.split(',')[0]}`}</p>
                  </div>
                  <div className={`text-[10px] font-black px-2 py-0.5 rounded-full border-2 ${req.met ? 'bg-green-500 border-green-600 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                    {req.owned}/{req.qty}
                  </div>
                </div>
              ))}
           </div>
        </div>

         {rewardFood && (
          <div className="bg-slate-900 p-2.5 rounded-2xl border-[3px] border-black flex items-center gap-3 shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border-2 border-white/5 shrink-0">
               <span className="text-3xl leading-none">{rewardFood.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase text-cyan-400 tracking-[0.2em] mb-0.5">CONTRACT_REWARD</p>
              <p className="text-[11px] font-black text-white uppercase italic truncate">Meta-Delicacy: {rewardFood.name}</p>
              <p className="text-[9px] text-white/50 font-bold italic truncate">{rewardFood.effectLabel}</p>
            </div>
          </div>
        )}

        {!player.walletAddress && (
          <div className="bg-amber-100 border-[3px] border-amber-500 p-3 rounded-2xl flex items-center gap-3 shadow-[4px_4px_0_rgba(245,158,11,0.2)] animate-pulse">
            <div className="bg-amber-500 p-1.5 rounded-lg border-2 border-black text-white shrink-0">
               <AlertCircle size={16} />
            </div>
            <div>
               <p className="text-[9px] font-black text-amber-800 uppercase tracking-tighter leading-none mb-0.5">UPLINK_REQUIRED</p>
               <p className="text-[10px] font-bold text-amber-900 leading-tight">No node detected. ETH rewards from this request will be skipped.</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white border-[3px] border-black text-black py-3 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic"
          >
            Postpone
          </button>
          <button
            onClick={() => setConfirmAbandon(quest.id)}
            className="flex-1 bg-red-400 border-[3px] border-black text-black py-3 font-black uppercase tracking-widest text-[10px] hover:bg-red-300 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic"
          >
            Skip Request
          </button>
        </div>

        <button
          onClick={() => onComplete(quest)}
          disabled={!allMet}
          className={`w-full py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${allMet ? `${style.tape} text-black hover:opacity-90` : 'bg-slate-300 text-slate-500 cursor-not-allowed grayscale'}`}
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
    </ComicQuestModal>
  );
};

// --- NPC Card ---
const NPCCard = ({ quest, onOpen, idx }) => {
  const { player, ITEMS } = useGame();
  const style = PERSONALITY_STYLES[quest.personality] || PERSONALITY_STYLES.Wanderer;
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
    <ComicQuestCard
      npcIndex={quest.npcIndex}
      title={quest.npcName}
      subtitle={`"${quest.dialogue.slice(0, 80)}..."`}
      badge={quest.personalityTag}
      accentColor={style.tape}
      onClick={() => onOpen(quest)}
      isReady={allMet}
      idx={idx}
      footer={
        <div className="flex items-center gap-1">
          <span className="text-sm">{rewardFoodEmoji}</span>
          <span className="text-[7px] font-black text-black/40 uppercase">REWARD: {quest.reward.foodId.replace(/_/g, ' ')}</span>
        </div>
      }
    >
      <div className="flex flex-wrap gap-1 mt-1">
        {quest.requires.slice(0, 3).map((req, i) => {
          const item = Object.values(ITEMS || []).find(it => it.id === req.itemId);
          const owned = Object.values(inventory).filter(iv => iv?.id?.startsWith(req.itemId)).length;
          const met = owned >= req.qty;
          return (
            <div key={i} className={`flex items-center gap-1 px-1.5 py-0.5 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] text-[7px] font-black transition-colors ${met ? 'bg-green-400' : 'bg-white'}`}>
              <span>{item?.icon || '📦'}</span>
              <span className="text-black">{req.qty}</span>
            </div>
          );
        })}
        {quest.requires.length > 3 && <span className="text-[8px] font-bold text-black/30">+{quest.requires.length - 3}</span>}
      </div>
    </ComicQuestCard>
  );
};

// --- Confirm Modal ---
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#faf6f0] border-[4px] border-black p-6 rounded-3xl shadow-[10px_10px_0_rgba(0,0,0,1)] max-w-sm w-full transform -rotate-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500 rounded-xl border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
            <AlertCircle size={24} className="text-white" />
          </div>
          <h3 className="text-lg font-black text-black uppercase italic tracking-tighter">{title}</h3>
        </div>
        <p className="text-xs font-bold text-slate-700 uppercase leading-tight mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 bg-white border-[3px] border-black text-black py-3 font-black uppercase text-[10px] shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic"
          >
            Go Back
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-red-500 border-[3px] border-black text-black py-3 font-black uppercase text-[10px] shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic"
          >
            Confirm Skip
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Cooldown Card ---
const CooldownCard = ({ expiration, id, onRush, idx }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, expiration - Date.now()));
  const rotate = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, expiration - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiration]);

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className={`relative ${rotate} transform transition-all h-44`}>
       <div className={`absolute inset-0 bg-red-500 rounded-2xl translate-x-1.5 translate-y-1.5 opacity-20`} />
       <div className="relative bg-[#fdfaf5] border-[3px] border-dashed border-red-500 rounded-2xl overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col h-full items-center justify-center p-4">
          <AlertCircle size={32} className="text-red-500 mb-2 opacity-50" />
          <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Cooling Down...</p>
          <div className="text-3xl font-black text-black italic my-1 font-mono tracking-tighter">
             {mins}:{secs.toString().padStart(2, '0')}
          </div>
          
          <button onClick={() => onRush(id)} className="mt-2 bg-yellow-400 hover:bg-yellow-300 border-[2px] border-black text-black text-[9px] font-black uppercase px-4 py-2 shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-1.5">
             ⚡ Skip (2,000 GX)
          </button>
       </div>
    </div>
  );
};

// --- Main View ---
export const CrystleTownView = () => {
  const { player, actions, TOWN_QUESTS, FOODS, ITEMS, MAPS, syncPlayer, adventure, openGuide, SOUNDS, faucetResult, setFaucetResult } = useGame();
  const { setView } = adventure;
  const [activeQuest, setActiveQuest] = useState(null);
  const [completedFlash, setCompletedFlash] = useState(null);
  const [confirmAbandon, setConfirmAbandon] = useState(null);
  
  const [sessionReward, setSessionReward] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const sparkCount = useMemo(() => {
    if (!player?.inventory) return 0;
    return Object.values(player.inventory).filter(item => item && item.id && item.id.startsWith('aether_spark')).length;
  }, [player?.inventory]);

  const huntSparkCount = useMemo(() => {
    if (!player?.inventory) return 0;
    return Object.values(player.inventory).filter(item => item && item.id && item.id.startsWith('hunt_spark')).length;
  }, [player?.inventory]);

  const triggerConfetti = useCallback(() => {
    const end = Date.now() + 3000;
    const colors = ['#10b981', '#f59e0b', '#06b6d4', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        zIndex: 10002
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        zIndex: 10002
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

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
    return slotIds.map(id => {
       if (id.startsWith('COOLDOWN_')) {
          const expiration = parseInt(id.split('_')[1], 10);
          return { isCooldown: true, expiration, id };
       }
       return TOWN_QUESTS?.find(q => q.id === id);
    }).filter(Boolean);
  }, [slotIds, TOWN_QUESTS]);

  // Clean up expired cooldowns automatically
  useEffect(() => {
    const expiredCooldowns = slotIds.filter(id => id.startsWith('COOLDOWN_') && parseInt(id.split('_')[1], 10) <= Date.now());
    if (expiredCooldowns.length > 0) {
      const newSlots = slotIds.filter(id => !expiredCooldowns.includes(id));
      syncPlayer({ townQuestSlots: newSlots });
    }
  }, [slotIds, syncPlayer]);

  // Refill slots to 10 if under
  useEffect(() => {
    if (!player || !TOWN_QUESTS || !MAPS) return; // Ensure MAPS are loaded
    if (slotIds.length >= 10) return;
    const completed = player.completedTownQuests || {};
    
    // THE SMART FILTERING ENGINE (Level Gated & Infinite Recycling)
    let available = TOWN_QUESTS.filter(q => {
       if (slotIds.includes(q.id)) return false; // Never duplicate an active slot
       
       let highestReqLevel = 1;
       for (const req of q.requires) {
          const matchedMap = MAPS.find(m => m.lootTable?.includes(req.itemId));
          if (matchedMap && matchedMap.minLevel > highestReqLevel) {
            highestReqLevel = matchedMap.minLevel;
          }
       }
       
       return (player.level || 1) >= highestReqLevel;
    });

    if (available.length === 0) return;

    // Prioritize uncompleted quests. If both are completed/uncompleted, randomize.
    available.sort((a, b) => {
       const aComp = completed[a.id] ? 1 : 0;
       const bComp = completed[b.id] ? 1 : 0;
       if (aComp !== bComp) return aComp - bComp;
       return Math.random() - 0.5; 
    });

    const needed = 10 - slotIds.length;
    const picks = available.slice(0, needed).map(q => q.id);
    syncPlayer({ townQuestSlots: [...slotIds, ...picks] });
  }, [slotIds.length, player?.level, MAPS]);

  // First-time tutorial trigger
  useEffect(() => {
    const isHidden = localStorage.getItem('hide_town_briefing') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const handleComplete = useCallback(async (quest) => {
    setActiveQuest(null);
    setIsSyncing(true);
    try {
      const result = await actions.completeTownQuest(quest, FOODS);
      if (result) {
        setSessionReward(result);
        if (result.item) {
          triggerConfetti();
        }
      }
    } catch (e) {
      console.error("Crystle Town Sync Error:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [actions, FOODS, triggerConfetti]);

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
          npcNum={18}
          onHelp={() => openGuide('crystle_town')}
        />

        <div className="px-4 py-2 space-y-4">
          {/* Town Influence UI */}
          <div className="bg-slate-900 border-[3px] border-black p-3 rounded-2xl shadow-[5px_5px_0_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 p-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  <CheckCircle size={16} className="text-black" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">District Standing</p>
                   <p className="text-sm font-black text-white uppercase italic leading-none">LEVEL {player?.crystleTownLevel || 1} INFLUENCE</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">XP Surge</p>
                <p className="text-xs font-black text-emerald-400 italic leading-none">{player?.crystleTownInfluenceXP || 0} / 25</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-black border-2 border-white/10 rounded-full overflow-hidden p-0.5">
               <div 
                 className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                 style={{ width: `${Math.min(100, ((player?.crystleTownInfluenceXP || 0) / 25) * 100)}%` }}
               />
            </div>
            
            <p className="text-[8px] font-bold text-white/50 uppercase mt-2 italic flex items-center gap-1">
               <AlertCircle size={10} /> Complete requests to boost town renovation & earn higher tier rewards.
            </p>
          </div>

          <TalkingNPC
            npcIndex={18}
            name="TOWN ELDER"
            accentColor="bg-emerald-500"
            isTalking={true}
            dialogue="Welcome back, hunter. Every request fulfilled brings a new citizen to the town. Crystle Town was built by hunters like you. Every contribution matters."
          />
        </div>
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
            {activeQuests.map((quest, idx) => {
              if (quest.isCooldown) {
                 return (
                   <CooldownCard
                     key={quest.id}
                     id={quest.id}
                     expiration={quest.expiration}
                     idx={idx}
                     onRush={actions.rushTownQuestCooldown}
                   />
                 );
              }
              return (
                <NPCCard
                  key={quest.id}
                  quest={quest}
                  idx={idx}
                  onOpen={(q) => { if (!isSyncing && !sessionReward) setActiveQuest(q); }}
                />
              );
            })}
          </div>
        )}

        {/* AETHER EXCHANGE TERMINAL */}
        <div className="mt-4 mb-4 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className={`relative bg-slate-900 border-[3px] border-cyan-500/30 rounded-3xl p-6 overflow-hidden ${player?.level < 100 ? 'grayscale-[0.5]' : ''}`}>
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Cpu size={120} className="text-cyan-400 rotate-12" />
            </div>

            {/* Lock Overlay for < Lv 100 */}
            {player?.level < 100 && (
              <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                 <div className="bg-black/80 border-2 border-red-500 px-6 py-2 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.5)] transform -rotate-2">
                    <AlertCircle className="text-red-500 animate-pulse" size={20} />
                    <span className="text-sm font-black text-white uppercase italic tracking-tighter">Endgame Protocol: Level 100 Required</span>
                 </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              {/* Visual Terminal */}
              <div className="w-24 h-24 bg-black/50 rounded-2xl border-2 border-cyan-500/50 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent"></div>
                <Sparkles className="text-cyan-400 animate-pulse mb-1" size={32} />
                <span className="text-2xl font-black text-white italic">{sparkCount}<span className="text-xs text-cyan-400/60 ml-0.5">/4</span></span>
                <div className="absolute bottom-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                  <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] font-black text-cyan-400 uppercase tracking-widest">Endgame Protocol</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] font-black text-emerald-400 uppercase tracking-widest">ETH Reward</span>
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">Aether Exchange Terminal</h3>
                <p className="text-sm text-slate-400 font-bold leading-tight max-w-lg">
                  Burn 4 collected Aether Sparks to harmonize with the town's core and authorize a premium ETH subsidy. Sparks drop from Elite Champions.
                </p>
              </div>

              {/* Action */}
              <button
                onClick={() => actions.exchangeAetherSparks()}
                disabled={sparkCount < 4 || player?.level < 100}
                className={`px-8 py-4 rounded-2xl font-black uppercase italic text-lg transition-all flex items-center gap-3 shrink-0 ${
                  sparkCount >= 4 && player?.level >= 100
                    ? 'bg-cyan-500 text-black border-[4px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none' 
                    : 'bg-slate-800 text-slate-500 border-[4px] border-slate-700 cursor-not-allowed opacity-50'
                }`}
              >
                {player?.level < 100 ? 'ENCRYPTED' : sparkCount >= 4 ? 'INITIATE EXCHANGE' : 'INSUFFICIENT SPARKS'}
                <Zap size={20} className={sparkCount >= 4 && player?.level >= 100 ? 'animate-bounce' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* HUNT SPARK EXCHANGE TERMINAL */}
        <div className="mt-4 mb-8 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-amber-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-slate-900 border-[3px] border-purple-500/30 rounded-3xl p-6 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Zap size={120} className="text-amber-400 -rotate-12" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              {/* Visual Terminal */}
              <div className="w-24 h-24 bg-black/50 rounded-2xl border-2 border-purple-500/50 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
                <Zap className="text-amber-400 animate-pulse mb-1" size={32} />
                <span className="text-2xl font-black text-white italic">{huntSparkCount}<span className="text-xs text-purple-400/60 ml-0.5">/4</span></span>
                <div className="absolute bottom-0 w-full h-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                  <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded text-[10px] font-black text-purple-400 uppercase tracking-widest">Beginner Protocol</span>
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] font-black text-amber-400 uppercase tracking-widest">Token Choice</span>
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">Hunt Spark Terminal</h3>
                <p className="text-sm text-slate-400 font-bold leading-tight max-w-lg">
                  Exchange 4 Hunt Sparks for on-chain rewards. Sparks drop from Elites and Bosses. Choose your transmission asset below.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => actions.exchangeHuntSparks('HUNT')}
                  disabled={huntSparkCount < 4}
                  className={`px-6 py-2.5 rounded-xl font-black uppercase italic text-xs transition-all flex items-center justify-center gap-2 ${
                    huntSparkCount >= 4
                      ? 'bg-purple-600 text-white border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-[2px] active:shadow-none' 
                      : 'bg-slate-800 text-slate-500 border-2 border-slate-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  TRANSMIT $HUNT
                </button>
                <button
                  onClick={() => actions.exchangeHuntSparks('DWGX')}
                  disabled={huntSparkCount < 4}
                  className={`px-6 py-2.5 rounded-xl font-black uppercase italic text-xs transition-all flex items-center justify-center gap-2 ${
                    huntSparkCount >= 4
                      ? 'bg-amber-500 text-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-[2px] active:shadow-none' 
                      : 'bg-slate-800 text-slate-500 border-2 border-slate-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  TRANSMIT $DWGX
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NPC Dialogue Modal */}
      {activeQuest && (
        <NPCModal
          quest={activeQuest}
          onClose={() => setActiveQuest(null)}
          onComplete={handleComplete}
          onAbandon={actions.abandonTownQuest}
          canComplete={true}
          setConfirmAbandon={setConfirmAbandon}
        />
      )}

      {confirmAbandon && (
        <ConfirmModal
          isOpen={true}
          title="Skip Request?"
          message="Are you sure you want to dismiss this citizen's request? A new citizen will take their place after a 30-minute cooldown."
          onConfirm={() => {
            actions.abandonTownQuest(confirmAbandon);
            setConfirmAbandon(null);
            setActiveQuest(null);
          }}
          onCancel={() => setConfirmAbandon(null)}
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

      {/* Knowledge Acquisition Modal (Celebratory Burst) */}
      {(isSyncing || sessionReward) && createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-[#e8e0d5] border-[6px] border-black p-8 relative shadow-[16px_16px_0_rgba(0,0,0,1)] overflow-hidden pointer-events-auto">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

            {isSyncing ? (
              <div className="relative z-10 space-y-6 text-center py-8">
                <div className="flex items-center justify-center mb-6">
                  <Zap className="animate-spin text-emerald-600" size={64} />
                </div>
                <h2 className="text-2xl font-[1000] text-emerald-600 uppercase italic tracking-tighter leading-none animate-pulse">
                  COMMITTING TO ARCHIVE...
                </h2>
                <p className="text-xs font-black text-black/60 uppercase tracking-[0.2em]">
                  Securing town registry
                </p>
              </div>
            ) : sessionReward && (
              <div className="relative z-10 space-y-6 text-center">
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                  {sessionReward.item ? (
                    <span className="text-6xl relative z-10 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-bounce font-serif">{sessionReward.item.icon || '📦'}</span>
                  ) : (
                    <Trophy className="text-amber-500 w-16 h-16 animate-bounce relative z-10" />
                  )}
                  <div className="absolute inset-0 border-4 border-dashed border-emerald-500/50 rounded-full animate-spin-slow"></div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-[1000] text-black uppercase italic tracking-tighter leading-none">
                    QUEST COMPLETE
                  </h2>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] animate-pulse">
                    District Support Acknowledged
                  </p>
                </div>

                <div className="bg-white/60 border-[3px] border-black/10 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-black italic">+{sessionReward.xp}</span>
                      <span className="text-[8px] font-black text-black/60 uppercase tracking-widest leading-none">INFLUENCE XP</span>
                    </div>
                    {sessionReward.item && (
                      <>
                        <div className="w-[2px] h-8 bg-black/10"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-black italic">x{sessionReward.item.qty}</span>
                          <span className="text-[8px] font-black text-black/60 uppercase tracking-widest leading-none">Quantity</span>
                        </div>
                      </>
                    )}
                  </div>

                  {sessionReward.item && (
                    <div className="pt-2 border-t border-black/5">
                      <p className="text-[11px] font-black text-black uppercase tracking-tight italic">
                        "{sessionReward.item.name}"
                      </p>
                      <p className="text-[8px] font-bold text-black/60 uppercase opacity-60">
                        Added to Inventory
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSessionReward(null)}
                  className="w-full py-3 bg-emerald-500 text-black font-black text-xs uppercase italic tracking-widest border-[3px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-3"
                >
                  CLOSE TRANSMISSION <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div className="absolute top-2 right-2 flex gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 animate-ping"></div>
              <div className="w-1.5 h-1.5 bg-slate-700"></div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- FAUCET CELEBRATION MODAL --- */}
      {faucetResult && createPortal(
         <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            {/* Animated Light Rays */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 capitalize">
               <div className="absolute top-1/2 left-1/2 w-full h-[500%] bg-gradient-to-t from-emerald-500 to-transparent transform -translate-x-1/2 -translate-y-1/2 animate-[spin_20s_linear_infinite]" />
               <div className="absolute top-1/2 left-1/2 w-full h-[500%] bg-gradient-to-t from-cyan-400 to-transparent transform -translate-x-1/2 -translate-y-1/2 animate-[spin_30s_linear_infinite_reverse]" />
            </div>

            <div className="relative w-full max-w-sm bg-slate-900 border-[4px] border-black rounded-[2.5rem] shadow-[12px_12px_0_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
               {/* Halftone BG Overlay */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

               {/* Header Banner */}
               <div className="bg-emerald-500 py-3 border-b-[4px] border-black transform -rotate-2 relative z-10 shadow-xl">
                  <h2 className="text-2xl font-black text-black text-center uppercase tracking-tighter italic scale-110">TREASURY SIGNAL!</h2>
                  <div className="absolute -top-1 -right-4 bg-black text-white px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em] transform rotate-12 border-2 border-white">
                     PROTOCOL SECURED
                  </div>
               </div>

               {/* Reward Body */}
               <div className="p-8 flex flex-col items-center text-center relative z-10 gap-6 pt-10">
                  <div className="relative">
                     <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full scale-110 animate-pulse" />
                     <div className="w-28 h-28 bg-black rounded-3xl border-[4px] border-black flex items-center justify-center relative shadow-[6px_6px_0_rgba(16,185,129,1)] transform rotate-3">
                        <Coins size={64} className="text-emerald-400" />
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center animate-bounce">
                           <Sparkles size={20} className="text-black" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.2em] leading-none mb-1">Crystle Hunter Subsidy</p>
                     <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none">0.0000035 ETH</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-tight italic mt-2">"Your dedication to the district has attracted a Faucet Drop."</p>
                  </div>

                  {/* Actions */}
                  <div className="w-full flex flex-col gap-3 mt-4">
                     <a 
                       href={`https://basescan.org/tx/${faucetResult.txHash}`}
                       target="_blank"
                       rel="noreferrer"
                       className="w-full py-4 bg-black border-[3px] border-slate-700 text-emerald-400 font-black uppercase italic rounded-2xl hover:border-emerald-500 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                     >
                        VIEW ON BASESCAN <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                     </a>
                     
                     <button
                        onClick={() => setFaucetResult(null)}
                        className="w-full py-5 bg-emerald-500 border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] text-black font-black uppercase italic text-xl rounded-2xl active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                     >
                        ACKNOWLEDGE
                     </button>
                  </div>
               </div>

               {/* Footer Decoration */}
               <div className="bg-black/40 py-2 border-t border-white/5 relative z-10">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Transmission ID: {faucetResult.txHash?.slice(0, 16)}...</p>
               </div>
            </div>
         </div>,
         document.body
      )}
    </div>
  );
};
