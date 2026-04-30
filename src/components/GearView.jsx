import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sword, 
  Shield, 
  HardHat, 
  Footprints, 
  Zap, 
  Activity, 
  ChevronRight, 
  Trash2,
  TrendingUp,
  Wind,
  Target,
  Flame,
  Star,
  Users,
  Package,
  Check,
  Sparkles
} from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { NPCCard } from './NPCCard';
import { useGame } from '../contexts/GameContext';

export const GearView = React.memo(() => {
  const { player, totalStats, actions, adventure, gameLoop, TAVERN_MATES, openGuide, ITEMS, EQUIPMENT, LOOTS } = useGame();
  const { setView } = adventure;
  const { equipItem, unequipItem } = actions;
  const { buffTimeLeft, dragonTimeLeft } = gameLoop;

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_gear_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Tactical Loadout",
      npc: 1,
      visualType: 'slots',
      text: "Welcome to your Tactical Loadout. Here you can configure your Hunter's signal slots: Head, Body, Arms, Feet, and Relic.",
      hint: "Tip: Click to un-equip active gear."
    },
    {
      title: "Stat Integration",
      npc: 3,
      visualType: 'stats',
      text: "The Analytics Terminal tracks how gear modifies your Base Attributes alongside buffs from your Dragon and Tavern Mates.",
      hint: "Strategy: Stack multipliers for max potential."
    },
    {
      title: "Available Tech",
      npc: 6,
      visualType: 'install',
      text: "Scroll through your Available Tech Inventory at the bottom and click any item to seamlessly install it into an empty slot.",
      hint: "Warning: High rarity gear yields massive power!"
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_gear_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  const getBaseItemData = (item) => {
    if (!item) return null;
    const baseId = item.id?.replace(/(_\d+)+$/, '');
    
    // Check Master Items DB
    const fromItems = ITEMS.find(i => i.id === baseId);
    if (fromItems) return fromItems;
    
    // Name match fallback
    const byName = ITEMS.find(i => i.name?.toLowerCase() === item.name?.toLowerCase());
    if (byName) return byName;
    
    return item;
  };

  const getItemIcon = (item) => {
    const base = getBaseItemData(item);
    if (base && base.icon) return base.icon;
    return item.icon || '📦';
  };

  const currentMate = TAVERN_MATES.find(m => m.id === player.hiredMate);

  const equipment = useMemo(() => {
    const raw = Object.values(player.inventory || {}).filter(i => {
      if (!i) return false;
      const master = getBaseItemData(i);
      const type = i.type || master?.type;
      return ['Weapon', 'Armor', 'Headgear', 'Footwear', 'Relic'].includes(type);
    }) || [];
    
    // Grouping by Base ID for stacking
    return raw.reduce((acc, item) => {
      const base = getBaseItemData(item);
      const baseId = base?.id || item.id?.replace(/(_\d+)+$/, '') || item.name;
      const existing = acc.find(i => {
        const iBase = getBaseItemData(i);
        const iBaseId = iBase?.id || i.id?.replace(/(_\d+)+$/, '') || i.name;
        return iBaseId === baseId;
      });
      
      if (existing) {
        existing.count = (existing.count || 1) + 1;
      } else {
        acc.push({ ...item, count: 1 });
      }
      return acc;
    }, []);
  }, [player.inventory, EQUIPMENT, LOOTS]);

  const slots = [
    { id: 'Headgear', label: 'Head', icon: <HardHat className="text-blue-400" /> },
    { id: 'Weapon', label: 'Arms', icon: <Sword className="text-amber-400" /> },
    { id: 'Armor', label: 'Body', icon: <Shield className="text-cyan-400" /> },
    { id: 'Footwear', label: 'Feet', icon: <Footprints className="text-emerald-400" /> },
    { id: 'Relic', label: 'Relic', icon: <Flame className="text-purple-400" /> }
  ];

  // Calculate Stat Breakdowns
  const statBreakdown = useMemo(() => {
    const base = player.baseStats || { str: 10, agi: 10, dex: 10 };
    const gear = { str: 0, agi: 0, dex: 0 };
    
    Object.values(player.equipped || {}).forEach(item => {
      if (item) {
          // Sync stats from master DB if they are missing (for items obtained before loots update)
          const master = getBaseItemData(item);
          const stats = master.stats || item.stats || {};
          gear.str += stats.str || 0;
          gear.agi += stats.agi || 0;
          gear.dex += stats.dex || 0;
      }
    });

    const dragon = (player.dragon?.level || 0) * 5;
    
    let mateMult = { str: 1, agi: 1, dex: 1 };
    if (buffTimeLeft > 0 && currentMate) {
       if (currentMate.type === 'STR') mateMult.str = 2;
       if (currentMate.type === 'AGI') mateMult.agi = 2;
       if (currentMate.type === 'DEX') mateMult.dex = 2;
    }

    return { base, gear, dragon, mateMult, totalStats };
  }, [player, currentMate, buffTimeLeft, totalStats, EQUIPMENT, LOOTS]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      <Header title="TACTICAL LOADOUT" onClose={adventure.goBack} npcNum={20} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
      }} icon={<Zap className="text-cyan-400" />} />

      <NPCCard
        citizenNum={20}
        name="ARMORER"
        accentColor="bg-cyan-500"
        textColor="text-cyan-600"
        glowColor="bg-cyan-500"
        statusTag="LOADOUT_SYNCED"
        statusTag2="SLOT_ONLINE"
        prefix="◢ARMORER: "
        dialogues={[
          "Welcome to the Tactical Loadout. Your gear defines your battlefield presence.",
          "Each slot has a dedicated purpose — don't leave any empty if you can help it.",
          "Relics with proc effects can chain with Dexterity for devastating results.",
          "Equipping higher rarity gear stacks your stat multipliers significantly.",
          "Unequip before you venture in. Wrong loadout costs lives in Sector 7.",
          "The Stat panel on the right shows your combined power output, live.",
          "Footwear with Agility scaling is often underrated. Try it in fast sectors.",
          "I've outfitted hunters since Sector 1. Always gear up before a deep run."
        ]}
      />

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-6">
        
        {/* TOP SECTION: GRID & PREVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT: CHARACTER SLOTS GRID */}
          <div className="bg-slate-900/80 border-2 border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10"><Activity size={80} /></div>
             <p className="text-[10px] font-black uppercase text-cyan-500 italic mb-4 tracking-widest border-b border-white/5 pb-2">Active Signal Slots</p>
             
             <div className="grid grid-cols-3 gap-3">
               {slots.map(slot => {
                  const eq = player.equipped?.[slot.id];
                  const master = eq ? getBaseItemData(eq) : null;
                  const stats = master?.stats || eq?.stats || {};
                  const effect = master?.effect || eq?.effect;

                  return (
                    <div key={slot.id} className="flex flex-col items-center gap-2">
                       <div 
                         onClick={() => eq && unequipItem(slot.id)}
                         className={`w-16 h-16 border-4 flex items-center justify-center relative cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[4px_4px_0_rgba(0,0,0,1)] ${eq ? 'bg-slate-800 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-black border-slate-800 opacity-40'}`}
                       >
                          {eq ? (
                             <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                               {getItemIcon(eq)}
                             </span>
                           ) : slot.icon}
                          {eq && <div className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 border border-black"><Trash2 size={8} /></div>}
                       </div>
                        <div className="text-center w-full min-h-[50px] flex flex-col items-center mt-1 group">
                           <span className="text-[7px] font-black uppercase text-cyan-500/50 tracking-tighter mb-0.5 border-b border-white/5 pb-0.5 w-[40px]">{slot.label}</span>
                           {eq ? (
                             <div className="flex flex-col items-center w-full px-1">
                               <span className="text-[9px] font-black text-white uppercase italic leading-none text-center w-full truncate mb-1" title={eq.name}>
                                 {eq.name}
                               </span>
                               
                               <div className="flex gap-x-1 justify-center scale-[0.8] origin-center">
                                  {Object.entries(stats).map(([s, v]) => v !== 0 && (
                                    <div key={s} className={`flex items-center px-1 py-0.5 rounded border border-black/20 shadow-[1px_1px_0_rgba(0,0,0,1)] ${s === 'str' ? 'bg-red-900/40 border-red-500/30' : s === 'agi' ? 'bg-emerald-900/40 border-emerald-500/30' : 'bg-blue-900/40 border-blue-500/30'}`}>
                                       <span className="text-[6px] font-black text-white uppercase leading-none mr-0.5">{s[0]}</span>
                                       <span className="text-[7px] font-black text-white leading-none">+{v}</span>
                                    </div>
                                  ))}
                               </div>
 
                                {effect && (
                                  <div className="mt-1 bg-cyan-500 text-black px-1 rounded-sm">
                                    <span className="text-[6.5px] font-black uppercase italic tracking-tighter">
                                       ⚡ {effect.type} {effect.mult ? `(x${effect.mult})` : ''}
                                    </span>
                                  </div>
                                )}
                             </div>
                           ) : (
                             <span className="text-[7px] font-black text-slate-800 uppercase tracking-widest mt-2 italic opacity-50">Link Disconnected</span>
                           )}
                        </div>
                    </div>
                  );
               })}
             </div>
          </div>

          {/* RIGHT: DETAILED STAT BREAKDOWN */}
          <div className="bg-white border-2 border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] text-black relative">
            <div className="absolute top-2 right-4 text-[6px] font-black opacity-20 uppercase tracking-widest">Analytics Terminal</div>
            <p className="text-[10px] font-black uppercase text-slate-400 italic mb-4 tracking-widest border-b border-black/5 pb-2">Integrated Attributes</p>
            
            <div className="space-y-4">
               {['str', 'agi', 'dex'].map(s => (
                 <div key={s} className="space-y-1">
                    <div className="flex justify-between items-end">
                       <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase italic ${s === 'str' ? 'text-red-600' : s === 'agi' ? 'text-emerald-600' : 'text-blue-600'}`}>{s}</span>
                          <span className="text-[8px] font-bold text-slate-400">Total Signal</span>
                       </div>
                       <span className="text-xl font-black italic">{totalStats[s]}</span>
                    </div>
                    {/* Visual Breakdown Bar */}
                    <div className="flex h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-black/5">
                       <div style={{ width: `${(statBreakdown.base[s] / totalStats[s]) * 100}%` }} className="bg-slate-800"></div>
                       <div style={{ width: `${(statBreakdown.gear[s] / totalStats[s]) * 100}%` }} className="bg-cyan-500"></div>
                       <div style={{ width: `${(statBreakdown.dragon / totalStats[s]) * 100}%` }} className="bg-emerald-500"></div>
                       {statBreakdown.mateMult[s] > 1 && <div className="flex-1 bg-amber-400 animate-pulse"></div>}
                    </div>
                    {/* Text Breakdown */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 opacity-60">
                       <span className="text-[7px] font-bold">BASE: {statBreakdown.base[s]}</span>
                       <span className="text-[7px] font-bold">GEAR: +{statBreakdown.gear[s]}</span>
                       <span className="text-[7px] font-bold">DRAGON: +{statBreakdown.dragon}</span>
                       {statBreakdown.mateMult[s] > 1 && <span className="text-[7px] font-black text-amber-600 italic">MATE BUFF: x2</span>}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: INVENTORY GRID */}
        <div className="bg-slate-900/40 border-2 border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)]">
           <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <p className="text-[10px] font-black uppercase text-amber-500 italic tracking-widest">Available Tech Inventory</p>
              <div className="flex items-center gap-2">
                 <Package size={12} className="text-slate-500" />
                 <span className="text-[9px] font-black text-slate-500">{equipment.length} Units</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {equipment.length > 0 ? equipment.map((item, idx) => {
                const master = getBaseItemData(item);
                const stats = master.stats || item.stats || {};
                const effect = master.effect || item.effect;
                const desc = master.description || master.desc || item.desc || item.description || "Experimental relic fragment.";

                return (
                <div 
                  key={idx}
                  className="bg-slate-950 border-2 border-white/5 p-3 flex group hover:border-cyan-500/50 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => equipItem(item.id)}
                >
                   <div className="w-12 h-12 bg-slate-900 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_rgba(0,0,0,1)] relative z-10 transition-transform group-hover:scale-110">
                      <span className="text-2xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                        {getItemIcon(item)}
                      </span>
                      {item.count > 1 && (
                        <span className="absolute -bottom-1 -right-1 bg-black text-white text-[7px] font-black px-1 border border-white/20 z-20">x{item.count}</span>
                      )}
                   </div>
                   
                   <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <div className="flex flex-col min-w-0">
                            <h4 className="text-[10px] font-black text-white uppercase italic tracking-tighter truncate md:max-w-[120px]">{item.name}</h4>
                            <span className="text-[6px] font-black text-slate-500 uppercase">[{item.type || 'TECH'}]</span>
                         </div>
                         <span className={`text-[6px] font-black px-1 border border-black uppercase ${item.rarity === 'Legendary' ? 'bg-amber-500 text-black' : item.rarity === 'Epic' ? 'bg-purple-600 text-white' : item.rarity === 'Rare' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                           {item.rarity || 'Common'}
                         </span>
                      </div>
                       <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                          {Object.entries(stats).map(([s, v]) => v !== 0 && (
                            <span key={s} className="text-[7px] font-black text-cyan-400 uppercase italic">+{v} {s}</span>
                          ))}
                          {effect && (
                            <span className="text-[7px] font-black text-amber-500 uppercase italic border-l border-white/10 pl-2">
                               ⚡ {effect.type}
                               {effect.mult ? ` (x${effect.mult})` : ''}
                               {effect.chance ? ` (${Math.round(effect.chance * 100)}%)` : ''}
                            </span>
                          )}
                       </div>
                       
                       <p className="text-[7px] font-black text-slate-400 uppercase leading-tight mt-1 opacity-80 group-hover:opacity-100 transition-opacity italic">"{desc}"</p>

                      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[7px] font-black text-white bg-cyan-600 px-2 py-0.5 rounded-sm uppercase italic">Install Tech</span>
                         <ChevronRight size={8} className="text-cyan-400" />
                      </div>
                   </div>
                   
                   <div className={`absolute -right-4 -bottom-4 w-12 h-12 blur-2xl opacity-10 group-hover:opacity-30 transition-opacity ${item.rarity === 'Legendary' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>
                </div>
                );
              }) : (
                <div className="col-span-full py-12 flex flex-col items-center opacity-30 italic">
                   <Users size={32} />
                   <p className="text-[10px] font-black uppercase mt-2">No Combat Units in Storage</p>
                </div>
              )}
           </div>
        </div>

      </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-blue-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-blue-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
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
                   <div className="absolute inset-x-0 bottom-0 bg-blue-600 text-[6px] font-black text-white text-center py-0.5 uppercase italic">SYSTEM</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-blue-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'slots' && (
                     <Shield className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'stats' && (
                     <Activity className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10 animate-pulse" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'install' && (
                     <div className="flex text-2xl drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10 gap-1 animate-pulse"><Package size={20} className="text-amber-400"/><ChevronRight size={20} className="text-cyan-400"/></div>
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-blue-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-amber-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-blue-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-blue-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-blue-500' : 'bg-slate-800'}`}
                   >
                     {dontShowAgain && <Check size={10} className="text-white" />}
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
                    className="flex-[2] bg-blue-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'READY FOR COMBAT' : 'TRANSMIT MORE'}
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
});
