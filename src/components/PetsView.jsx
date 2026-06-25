import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { deleteField } from 'firebase/firestore';
import { Sparkles, ShieldCheck, Lock, Check, Heart, Zap, Star, Activity, Hexagon, Fingerprint, X } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { Header } from './GameUI';
import { NPCCard } from './NPCCard';

export const PetsView = () => {
  const { player, syncPlayer, adventure, addLog, PETS_METADATA, ITEMS } = useGame();
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  const collectionSync = useMemo(() => {
    const counts = { 'Pyro': 0, 'Hydro': 0, 'Gale': 0, 'Earthen': 0, 'Cosmic': 0 };
    player.unlockedPets?.forEach(id => {
      const p = PETS_METADATA.find(pm => pm.id === id);
      if (p) counts[p.element]++;
    });
    return counts;
  }, [player.unlockedPets, PETS_METADATA]);

  const fruitInventory = useMemo(() => {
    const fruits = {};
    if (!player.inventory) return [];
    
    const nameToId = {};
    ITEMS.forEach(i => { if (i.name) nameToId[i.name.toLowerCase()] = i.id; });

    Object.entries(player.inventory).forEach(([key, item]) => {
      if (item && item.type === 'Fruit') {
        const baseId = (item.name && nameToId[item.name.toLowerCase()]) || item.id?.replace(/_([a-z0-9]+)+$/, '') || item.name;
        if (!fruits[baseId]) fruits[baseId] = { ...item, count: 0, keys: [] };
        fruits[baseId].count += (item.count || 1);
        fruits[baseId].keys.push(key);
      }
    });
    return Object.entries(fruits);
  }, [player.inventory, ITEMS]);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_pets_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    { title: "Crystle Companions", text: "Welcome to the Sanctuary. Crystles are rare entities that boost your system's efficiency, granting massive bonuses to Experience and Core HP.", hint: "Examine each Crystle to find optimal specs." },
    { title: "Soul Unlocking", text: "Many Crystles remain dormant. You must purify corrupted anomalies or complete specific raids to unlock their signatures.", hint: "Watch for special event transmissions." },
    { title: "Active Link", text: "Your HUD can only support one active Crystle link at a time. The active Crystle will accompany you in dungeon exploration.", hint: "Changing companions may alter your combat stats." }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) setTutorialStep(tutorialStep + 1);
    else {
      if (dontShowAgain) localStorage.setItem('hide_pets_tutorial', 'true');
      setShowTutorial(false);
    }
  };

  const handleAdopt = async (num) => {
    const isUnlocked = player.unlockedPets?.includes(num);
    if (!isUnlocked) return addLog("🚨 SIGNAL LOST: You must purify this Crystle first!");

    const petMeta = PETS_METADATA.find(p => p.id === num);
    setLoading(true);
    try {
      await syncPlayer({ petId: num, [`petLevels.${num}`]: player.petLevels?.[num] || 1 });
      addLog(`🐾 COMPANION SECURED: Activated ${petMeta?.name || `Crystle Pet #${num}`}!`);
      setSelectedPet(null);
    } catch (e) {
      console.error(e);
      addLog("🚨 ADOPTION ERROR: Signal failed.");
    }
    setLoading(false);
  };

  const selectedPetMeta = selectedPet ? PETS_METADATA.find(p => p.id === selectedPet) : null;
  const isSelectedUnlocked = selectedPetMeta && player.unlockedPets?.includes(selectedPetMeta.id);

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'Legendary': return 'text-amber-400 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)] bg-amber-950/30';
      case 'Epic': return 'text-purple-400 border-purple-400/50 shadow-[0_0_15px_rgba(192,132,252,0.3)] bg-purple-950/30';
      case 'Rare': return 'text-blue-400 border-blue-400/50 shadow-[0_0_15px_rgba(96,165,250,0.3)] bg-blue-950/30';
      case 'Uncommon': return 'text-emerald-400 border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.3)] bg-emerald-950/30';
      default: return 'text-slate-300 border-slate-500/50 bg-slate-900/50';
    }
  };

  const getElementColor = (element) => {
    switch(element) {
      case 'Pyro': return 'text-red-400 border-red-500/30 bg-red-950/40';
      case 'Hydro': return 'text-blue-400 border-blue-500/30 bg-blue-950/40';
      case 'Gale': return 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40';
      case 'Earthen': return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
      case 'Cosmic': return 'text-purple-400 border-purple-500/30 bg-purple-950/40';
      default: return 'text-slate-400 border-slate-500/30 bg-slate-900/40';
    }
  };

  return (
    <div className="flex-1 h-full overflow-hidden relative bg-slate-950 font-sans">
       {/* Premium Background Grid */}
       <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
          <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-cyan-900/20 to-transparent blur-3xl"></div>
       </div>

       {/* INSPECTION MODAL (CYBER TERMINAL) */}
       {selectedPetMeta && createPortal(
         <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-hidden">
            <div className="max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 md:p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative animate-in zoom-in-95 duration-300 backdrop-blur-xl flex flex-col gap-4 md:gap-6">
                
                {/* Holographic scanning line */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                   <div className="w-full h-1 bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-scan"></div>
                </div>

                {/* Highly Visible Close Button */}
                <button onClick={() => setSelectedPet(null)} className="absolute top-3 right-3 md:top-4 md:right-4 w-10 h-10 bg-slate-800/80 hover:bg-red-500/80 hover:text-white text-slate-300 rounded-full flex items-center justify-center border border-white/10 transition-colors z-20 shadow-lg backdrop-blur-md">
                   <X size={20} />
                </button>
                
                <div className="flex flex-col items-center gap-4 md:gap-6 relative z-10 pt-4">
                   
                   {/* Avatar Frame */}
                   <div className={`w-28 h-28 md:w-40 md:h-40 rounded-full border border-cyan-500/50 p-1 relative shrink-0 ${isSelectedUnlocked ? 'shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'opacity-50'}`}>
                      <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-950">
                        {!isSelectedUnlocked && (
                           <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center gap-2">
                              <Lock size={24} className="text-cyan-500/50" />
                              <span className="text-cyan-500/50 text-[10px] uppercase tracking-[0.2em]">Encrypted</span>
                           </div>
                        )}
                        <img src={`/assets/pets/genesis-pets/Genesis Pets (${selectedPetMeta.id}).jpg`} className={`w-full h-full object-cover transition-transform duration-700 hover:scale-110 ${!isSelectedUnlocked ? 'grayscale brightness-50' : ''}`} />
                      </div>
                      
                      {/* Element Badge */}
                      <div className={`absolute -bottom-2 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md flex items-center gap-1 ${getElementColor(selectedPetMeta.element)}`}>
                         <Fingerprint size={12} /> {selectedPetMeta.element}
                      </div>
                   </div>
                   
                   <div className="text-center w-full flex flex-col gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">{selectedPetMeta.name}</h2>
                        <div className="flex justify-center gap-2">
                          <div className={`px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${getRarityColor(selectedPetMeta.rarity)}`}>{selectedPetMeta.rarity} CLASS</div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="bg-slate-950/50 border border-white/5 rounded-xl p-4 text-left">
                        <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                           <Activity size={14} className="text-cyan-400" />
                           <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Biometric Specs</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                          {selectedPetMeta.xpMult > 1 && <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase tracking-widest">Experience</span><span className="text-sm font-bold text-emerald-400">x{selectedPetMeta.xpMult?.toFixed(2)}</span></div>}
                          {selectedPetMeta.lootMult > 1 && <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase tracking-widest">GX Yield</span><span className="text-sm font-bold text-amber-400">x{selectedPetMeta.lootMult?.toFixed(2)}</span></div>}
                          {selectedPetMeta.hpBonus > 0 && <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase tracking-widest">Vitality</span><span className="text-sm font-bold text-cyan-400">+{Math.floor(selectedPetMeta.hpBonus * (1 + ((player.petLevels?.[selectedPetMeta.id] || 1) - 1) * 0.15))} HP</span></div>}
                          {selectedPetMeta.strBonus > 0 && <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase tracking-widest">Power</span><span className="text-sm font-bold text-red-400">+{Math.floor(selectedPetMeta.strBonus * (1 + ((player.petLevels?.[selectedPetMeta.id] || 1) - 1) * 0.15))} STR</span></div>}
                          {selectedPetMeta.agiBonus > 0 && <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase tracking-widest">Reflex</span><span className="text-sm font-bold text-emerald-400">+{Math.floor(selectedPetMeta.agiBonus * (1 + ((player.petLevels?.[selectedPetMeta.id] || 1) - 1) * 0.15))} AGI</span></div>}
                          {selectedPetMeta.dexBonus > 0 && <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase tracking-widest">Focus</span><span className="text-sm font-bold text-blue-400">+{Math.floor(selectedPetMeta.dexBonus * (1 + ((player.petLevels?.[selectedPetMeta.id] || 1) - 1) * 0.15))} DEX</span></div>}
                        </div>
                      </div>

                      {/* --- FEEDING SUBSYSTEM --- */}
                      {isSelectedUnlocked && (
                        <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl p-4">
                          <div className="flex justify-between items-end mb-2">
                             <div className="flex items-center gap-2">
                                <Star size={14} className="text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Ascension Lvl {player.petLevels?.[selectedPetMeta.id] || 1}</span>
                             </div>
                             <span className="text-[10px] font-bold text-amber-500/70">{(player.petLevels?.[selectedPetMeta.id] || 1) >= 100 ? 'MAX LEVEL' : `${player.petExp?.[selectedPetMeta.id] || 0} / ${(player.petLevels?.[selectedPetMeta.id] || 1) * 50} EXP`}</span>
                          </div>
                          
                          <div className="h-1 w-full bg-black rounded-full overflow-hidden mb-4">
                             <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500" style={{ width: (player.petLevels?.[selectedPetMeta.id] || 1) >= 100 ? '100%' : `${Math.min(100, ((player.petExp?.[selectedPetMeta.id] || 0) / ((player.petLevels?.[selectedPetMeta.id] || 1) * 50)) * 100)}%` }} />
                          </div>

                          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                            {fruitInventory.map(([fruitId, group]) => (
                               <button 
                                 key={fruitId}
                                 disabled={loading}
                                 onClick={async () => {
                                    const keyToRemove = group.keys[0];
                                    if (!keyToRemove) return;
                                    setLoading(true);
                                    let currentExp = player.petExp?.[selectedPetMeta.id] || 0;
                                    let currentLvl = player.petLevels?.[selectedPetMeta.id] || 1;
                                    
                                    if (currentLvl >= 100) {
                                       addLog(`✨ ${selectedPetMeta.name} is already at maximum Ascension!`);
                                       setLoading(false);
                                       return;
                                    }

                                    const expGained = group.exp || 10;
                                    currentExp += expGained;
                                    const requiredExp = currentLvl * 50;
                                    
                                    if (currentExp >= requiredExp) {
                                       currentExp -= requiredExp;
                                       currentLvl = Math.min(100, currentLvl + 1);
                                       addLog(`🌟 ASCENSION: ${selectedPetMeta.name} reached Level ${currentLvl}!`);
                                    } else {
                                       addLog(`🍒 ${selectedPetMeta.name} gained +${expGained} EXP`);
                                    }

                                    try {
                                      await syncPlayer({
                                        [`inventory.${keyToRemove}`]: deleteField(),
                                        [`petExp.${selectedPetMeta.id}`]: currentExp,
                                        [`petLevels.${selectedPetMeta.id}`]: currentLvl
                                      });
                                    } catch(e) {}
                                    setLoading(false);
                                 }}
                                 className="relative w-10 h-10 rounded-lg border border-white/10 bg-black/50 flex items-center justify-center text-lg shrink-0 hover:border-amber-400/50 hover:bg-amber-900/30 transition-all group"
                               >
                                 <span className="group-hover:scale-110 transition-transform">{group.icon}</span>
                                 <span className="absolute -top-1 -right-1 bg-black text-amber-400 border border-amber-400/30 text-[8px] font-bold px-1.5 py-0.5 rounded-md">{group.count}</span>
                               </button>
                            ))}
                            {fruitInventory.length === 0 && (
                               <div className="text-[10px] font-medium text-slate-500 w-full text-center py-2">No nutritional items found in inventory.</div>
                            )}
                          </div>
                        </div>
                      )}

                      <button 
                         onClick={() => handleAdopt(selectedPetMeta.id)}
                         disabled={loading || player.petId === selectedPetMeta.id || !isSelectedUnlocked}
                         className={`w-full py-3 mt-2 rounded-xl transition-all font-bold text-sm uppercase tracking-widest ${
                           !isSelectedUnlocked 
                           ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                           : player.petId === selectedPetMeta.id
                             ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                             : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                         }`}
                      >
                         {!isSelectedUnlocked ? 'ENCRYPTED SOUL' : (player.petId === selectedPetMeta.id ? 'ACTIVE COMPANION' : 'INITIALIZE LINK')}
                      </button>
                   </div>
                </div>
            </div>
         </div>,
         document.body
       )}

       <div className="flex-1 flex flex-col p-4 md:p-8 animate-in slide-in-from-bottom-10 h-full overflow-hidden relative z-10">
          <Header title="SANCTUARY NODE" onClose={adventure.goBack} npcNum={30} onHelp={() => {
             setTutorialStep(0);
             setShowTutorial(true);
           }} />

          <NPCCard
            citizenNum={30}
            name="KEEPER PROTOCOL"
            accentColor="bg-cyan-500"
            textColor="text-cyan-400"
            glowColor="bg-cyan-500"
            statusTag="SANCTUARY_ONLINE"
            statusTag2="SOULS_DETECTED"
            prefix="◢SYS: "
            dialogues={[
              "Welcome to the Sanctuary. These entities boost system efficiency.",
              "Feed unlocked entities with nutritional data to increase their multipliers.",
              "Rare signatures require purification to access.",
              "Only one companion link can be sustained at a time."
            ]}
          />
          
          <div className="flex-1 flex flex-col gap-6 overflow-hidden mt-6">
            
            {/* Holographic Header */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shrink-0 group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                      <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                        <Heart size={14} className="text-cyan-400 animate-pulse" /> 
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em]">Companion Subsystem</span>
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-wider">Crystle Entities</h2>
                  </div>
                   <div className="flex gap-4">
                      {player.petId && (
                        <div className="bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
                           <ShieldCheck size={16} className="text-emerald-400" />
                           <div>
                              <p className="text-[8px] text-emerald-500/70 uppercase tracking-widest">Active Link</p>
                              <p className="text-xs font-bold text-emerald-400">{PETS_METADATA.find(p => p.id === player.petId)?.name || `#${player.petId}`}</p>
                           </div>
                        </div>
                      )}
                  </div>
                </div>
            </div>

            {/* Entity Grid Area */}
            <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 overflow-hidden flex flex-col relative">
               
               {/* Synergy Tracker (Sleek) */}
               <div className="grid grid-cols-5 gap-3 mb-6 relative z-10">
                  {Object.entries(collectionSync).map(([el, count]) => (
                    <div key={el} className="flex flex-col gap-1.5 p-2 rounded-lg bg-black/20 border border-white/5">
                       <div className="flex justify-between items-center">
                          <span className={`text-[8px] font-bold uppercase tracking-widest ${
                            el === 'Pyro' ? 'text-red-400' : el === 'Hydro' ? 'text-blue-400' : el === 'Gale' ? 'text-cyan-400' : el === 'Earthen' ? 'text-emerald-400' : 'text-purple-400'
                          }`}>{el}</span>
                          <span className="text-[9px] font-bold text-slate-400">{count}/10</span>
                       </div>
                       <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                               el === 'Pyro' ? 'bg-red-500 shadow-[0_0_5px_red]' : el === 'Hydro' ? 'bg-blue-500 shadow-[0_0_5px_blue]' : el === 'Gale' ? 'bg-cyan-500 shadow-[0_0_5px_cyan]' : el === 'Earthen' ? 'bg-emerald-500 shadow-[0_0_5px_green]' : 'bg-purple-500 shadow-[0_0_5px_purple]'
                            }`} 
                            style={{ width: `${(count / 10) * 100}%` }} 
                          />
                       </div>
                    </div>
                  ))}
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 content-start">
                  {PETS_METADATA
                    .slice()
                    .sort((a, b) => {
                      const aUnlocked = player.unlockedPets?.includes(a.id);
                      const bUnlocked = player.unlockedPets?.includes(b.id);
                      if (player.petId === a.id) return -1;
                      if (player.petId === b.id) return 1;
                      if (aUnlocked && !bUnlocked) return -1;
                      if (!aUnlocked && bUnlocked) return 1;
                      return a.id - b.id;
                    })
                    .map((pet) => {
                      const isUnlocked = player.unlockedPets?.includes(pet.id);
                      const isActive = player.petId === pet.id;
                      
                      return (
                        <button 
                        key={pet.id}
                        onClick={() => setSelectedPet(pet.id)}
                        disabled={loading}
                        className={`
                          group relative aspect-[3/4] rounded-2xl border transition-all duration-500 overflow-hidden
                          hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]
                          ${isActive 
                            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                            : (isUnlocked ? 'bg-slate-900/60 border-white/10 hover:border-cyan-500/50' : 'bg-slate-950 border-white/5 opacity-60')}
                        `}
                      >
                        {/* Image Container */}
                        <div className="absolute inset-0 p-1">
                            <div className="w-full h-full rounded-xl overflow-hidden relative bg-black">
                              <img 
                                src={`/assets/pets/genesis-pets/Genesis Pets (${pet.id}).jpg`} 
                                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isActive ? 'filter-none' : (isUnlocked ? 'brightness-75 group-hover:brightness-100' : 'grayscale brightness-25')}`} 
                                loading="lazy" 
                              />
                              
                              {/* Dark gradient overlay for text readability */}
                              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded font-mono text-[8px] border border-white/10">#{pet.id}</div>
                        
                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] backdrop-blur-md border ${
                            pet.element === 'Pyro' ? 'bg-red-500/20 border-red-500/50' :
                            pet.element === 'Hydro' ? 'bg-blue-500/20 border-blue-500/50' :
                            pet.element === 'Gale' ? 'bg-cyan-500/20 border-cyan-500/50' :
                            pet.element === 'Earthen' ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-purple-500/20 border-purple-500/50'
                        }`}>
                            {pet.element === 'Pyro' ? '🔥' : pet.element === 'Hydro' ? '💧' : pet.element === 'Gale' ? '⚡' : pet.element === 'Earthen' ? '⛰️' : '✨'}
                        </div>

                        {!isUnlocked && (
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Lock size={20} className="text-slate-500" />
                           </div>
                        )}

                        {/* Bottom Info */}
                        <div className="absolute bottom-2 inset-x-2 flex flex-col items-center">
                           <div className={`w-full text-center py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors ${
                             isActive ? 'bg-emerald-500 text-black' : (isUnlocked ? 'bg-white/10 text-white backdrop-blur-md group-hover:bg-cyan-500 group-hover:text-black' : 'bg-black/50 text-slate-500')
                           }`}>
                              {isActive ? 'ACTIVE LINK' : (isUnlocked ? 'STANDBY' : 'ENCRYPTED')}
                           </div>
                        </div>
                    </button>
                    );
                  })}
               </div>
            </div>
          </div>
       </div>

       {showTutorial && createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
             <div className="max-w-sm w-full bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.1)] relative">
                <div className="mb-6 border-b border-white/10 pb-4">
                   <h3 className="text-xl font-black text-white uppercase tracking-widest">{tutorialSteps[tutorialStep].title}</h3>
                   <div className="text-cyan-400 text-[10px] font-mono mt-1">LOG {tutorialStep + 1}/{tutorialSteps.length}</div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">{tutorialSteps[tutorialStep].text}</p>
                <div className="bg-cyan-950/30 border border-cyan-500/20 p-3 rounded-lg mb-6">
                   <p className="text-cyan-400 text-[10px] uppercase tracking-widest font-bold">INFO // {tutorialSteps[tutorialStep].hint}</p>
                </div>
                <div className="flex flex-col gap-3">
                   <button onClick={nextStep} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">
                      {tutorialStep === tutorialSteps.length - 1 ? 'ACKNOWLEDGE' : 'NEXT PROTOCOL'}
                   </button>
                   <button onClick={() => setDontShowAgain(!dontShowAgain)} className="flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${dontShowAgain ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'}`}>
                         {dontShowAgain && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold">Mute Future Briefings</span>
                   </button>
                </div>
             </div>
          </div>,
          document.body
       )}
    </div>
  );
};
