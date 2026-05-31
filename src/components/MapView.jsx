import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Map as MapIcon, ChevronRight, Lock, Star, Skull, TrendingUp, Flame, ShieldAlert, Droplets, Zap, Check, Sparkles } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';
import { DungeonPrepModal } from './DungeonPrepModal';

export const MapView = () => {
  const { player, adventure, gameLoop, openGuide, MAPS, LOOTS, syncPlayer, updateLeaderboard, actions } = useGame();
  const { setView, setDepth, spawnNewEnemy, setSelectedMap } = adventure;
  const { penaltyRemaining } = gameLoop;
  const isPenalized = penaltyRemaining > 0;

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [resumePromptMap, setResumePromptMap] = useState(null);
  const [pendingDungeonEntry, setPendingDungeonEntry] = useState(null); // map object awaiting prep modal

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_map_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "World Sectors",
      npc: 1,
      visualType: 'map',
      text: "The Hunt Crystle universe is divided into deep, procedural sectors. Access requires sufficient Hunter Level clearance.",
      hint: "Tip: Pushing deeper into sectors yields higher score multipliers."
    },
    {
      title: "Elemental Imbuement",
      npc: 17,
      visualType: 'element',
      text: "Be on guard! Many sectors feature extreme elemental environments. You must attune your weapon to opposite elements to maximize DPS.",
      hint: "Strategy: Use the Forge to imbue your primary weapon."
    },
    {
      title: "Loot Tables",
      npc: 6,
      visualType: 'drops',
      text: "Before engaging, scout the possible drops. Epic and Legendary equipment have drastically lower drop chances but incredible stat curves.",
      hint: "Warning: Leaving a sector mid-run forfeits unsaved progress."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_map_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  const executeMapEntry = (map) => {
    // --- STRATEGIC DEPTH SCORING V4 ---
    const entryScore = (map.minLevel * 100000) + 1;
    const updates = {};
    if (entryScore > (player.maxDepthScore || 0)) {
        updates.maxDepthScore = entryScore;
        updates.maxDepthMapName = map.name;
        updates.maxDepthMapMinLevel = map.minLevel || 1;
        updates.maxDepthFloor = 1;
        updates.maxDepth = 1;

        updateLeaderboard({
            level: player.level,
            maxDepthScore: entryScore,
            maxDepthFloor: 1
        });
    }

    // Always resume saved timer on entry — no manual skip allowed
    if (player.autoTimeLeftSaved > 0) {
        updates.autoUntil = Date.now() + player.autoTimeLeftSaved;
        updates.autoTimeLeftSaved = 0;
    }

    if (Object.keys(updates).length > 0) {
        syncPlayer(updates);
    }

    setSelectedMap(map);
    setDepth(1);
    spawnNewEnemy(1, map);

    // Show loadout prep modal instead of entering directly
    actions.clearLoadout?.(); // Clear stale loadout from previous run
    setPendingDungeonEntry(map);
    setResumePromptMap(null);
  };

  const handlePrepConfirm = useCallback((loadout) => {
    if (actions.setLoadout) actions.setLoadout(loadout);
    setPendingDungeonEntry(null);
    setView('dungeon');
  }, [actions, setView]);

  const handlePrepCancel = useCallback(() => {
    setPendingDungeonEntry(null);
  }, []);

  const handleMapSelect = (map) => {
    if (player.level < map.minLevel) return;
    if (isPenalized) return;
    
    if (player.autoTimeLeftSaved > 0) {
        setResumePromptMap(map);
        return;
    }
    
    executeMapEntry(map);
  };

  return (
    <div className="flex-1 p-6 space-y-6 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      
      <Header 
        title="World Sectors" 
        onClose={adventure.goBack} 
        npcNum={13}
        onHelp={() => {
           setTutorialStep(0);
           setShowTutorial(true);
        }}
      />

      <div className="flex-1 overflow-y-auto space-y-6 z-10 pr-2 pb-10">
        <div className="grid gap-6">
          {MAPS.map((map, idx) => {
            const isLocked = player.level < map.minLevel;
            
            // --- Elemental Theming Engine ---
            const getTheme = (element) => {
              switch(element) {
                case 'Pyro': return { bg: 'bg-orange-200', border: 'border-red-950', accent: 'text-orange-900', hue: 'from-orange-600/40', icon: <Flame size={18} className="text-orange-800" />, shadow: 'shadow-orange-950/40', mapBg: 'bg-red-600', subBg: 'bg-orange-300/60' };
                case 'Earthen': return { bg: 'bg-emerald-200', border: 'border-emerald-950', accent: 'text-emerald-900', hue: 'from-emerald-600/40', icon: <TrendingUp size={18} className="text-emerald-800" />, shadow: 'shadow-emerald-950/40', mapBg: 'bg-emerald-700', subBg: 'bg-emerald-300/60' };
                case 'Hydro': return { bg: 'bg-blue-200', border: 'border-blue-950', accent: 'text-blue-900', hue: 'from-blue-600/40', icon: <Droplets size={18} className="text-blue-800" />, shadow: 'shadow-blue-950/40', mapBg: 'bg-blue-600', subBg: 'bg-blue-300/60' };
                case 'Gale': return { bg: 'bg-purple-200', border: 'border-purple-950', accent: 'text-purple-900', hue: 'from-purple-600/40', icon: <Zap size={18} className="text-purple-800" />, shadow: 'shadow-purple-950/40', mapBg: 'bg-purple-600', subBg: 'bg-purple-300/60' };
                default: return { bg: 'bg-white', border: 'border-black', accent: 'text-slate-600', hue: 'from-slate-900/40', icon: <MapIcon size={18} className="text-slate-600" />, shadow: 'shadow-black/20', mapBg: 'bg-slate-500', subBg: 'bg-slate-100' };
              }
            };
            const theme = getTheme(map.element);

            return (
              <button
                key={map.id}
                onClick={() => handleMapSelect(map)}
                disabled={isLocked}
                className={`w-full text-left p-5 border-[6px] ${theme.shadow} transform transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none relative group ${idx % 2 === 0 ? '-rotate-1' : 'rotate-1'} ${isLocked ? 'opacity-60 grayscale' : ''} ${theme.bg} ${theme.border}`}
              >
                {/* Elemental Warning Banner */}
                {map.element && (
                  <div className="absolute top-2 left-2 z-[30] flex items-center gap-1.5 bg-red-600 px-3 py-1 border-2 border-black rotate-[-2deg] shadow-[3px_3px_0_rgba(0,0,0,1)] group-hover:rotate-0 transition-transform">
                      <ShieldAlert size={14} className="text-white animate-pulse" />
                      <div className="flex flex-col leading-none">
                        <span className="text-[6px] font-black text-white/70 uppercase">Combat Restriction</span>
                        <span className="text-[8px] font-black text-white uppercase italic">Needs {
                              map.element === 'Pyro' ? 'Gale' : 
                              map.element === 'Earthen' ? 'Pyro' : 
                              map.element === 'Hydro' ? 'Earthen' : 
                              map.element === 'Gale' ? 'Hydro' : 'proper'
                          } Imbuement</span>
                      </div>
                  </div>
                )}

                {/* Sector Header Banner FX */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-slate-900 border-b-[3px] border-black overflow-hidden z-0">
                  {(() => {
                    const bannerMonMap = {
                      'neon_slums': { folder: 'Neon Slums', name: 'Venomhide Drake' },
                      'rust_canyon': { folder: 'Rust Canyon', name: 'Rust Cat 0-0' },
                      'void_sector': { folder: 'Void Sector 7', name: 'Null Stalker' },
                      'inferno_crater': { folder: 'Inferno Crater', name: 'Magma Creeper' },
                      'tectonic_ridge': { folder: 'Tectonic Ridge', name: 'Rock Crusher' },
                      'abyssal_trench': { folder: 'Abyssal Trench', name: 'Abyssal Angler' }
                    };
                    const bannerInfo = bannerMonMap[map.id] || { folder: 'Neon Slums', name: 'Venomhide Drake' };
                    return (
                       <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-[2000ms]">
                          <img 
                            src={`/assets/monsters/${bannerInfo.folder}/${bannerInfo.name}.jpg`} 
                            className="w-full h-[300%] object-cover object-top opacity-50 contrast-125 saturate-[0.8] brightness-75 scale-110"
                            onError={(e) => { 
                              if (e.target.src.endsWith('.jpg')) e.target.src = `/assets/monsters/${bannerInfo.folder}/${bannerInfo.name}.png`;
                              else e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + bannerInfo.name;
                            }}
                          />
                          <div className={`absolute inset-0 bg-gradient-to-r ${theme.hue} via-transparent to-black/80`} />
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_2px,3px_100%] pointer-events-none opacity-20" />
                       </div>
                    );
                  })()}
                </div>

                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className={`p-3 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] ${theme.mapBg}`}>
                    <MapIcon size={24} className="text-black" />
                  </div>
                  <div className="text-right">
                      <p className={`text-[10px] font-black uppercase italic ${theme.accent} drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}>{map.difficulty} Sector</p>
                      <p className="text-[8px] font-black text-white/50 uppercase tracking-widest drop-shadow-[0_0_4px_rgba(0,0,0,1)]">Min Lvl {map.minLevel}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-1 relative z-10">
                   {theme.icon}
                   <h3 className={`text-2xl font-black uppercase italic leading-none group-hover:text-cyan-600 transition-colors text-black`}>{map.name}</h3>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase italic leading-tight mb-4 relative z-10">{map.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 relative z-10">
                  <div className="space-y-2">
                    <p className={`text-[8px] font-black ${theme.accent} uppercase tracking-widest italic flex items-center gap-1`}>
                      <TrendingUp size={10} /> Obtainable Assets:
                    </p>
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                        {map.lootTable.slice(0, 8).map((lootId, li) => {
                          const loot = LOOTS.find(l => l.id === lootId);
                          if (!loot) return null;
                          return (
                            <div key={li} className={`w-8 h-8 rounded-lg ${theme.subBg} border-2 border-black flex items-center justify-center text-lg shadow-[2px_2px_0_rgba(0,0,0,1)] group-hover:bg-cyan-50 transition-colors`} title={loot.name}>
                              {loot.icon}
                            </div>
                          );
                        })}
                        <div className="text-[8px] font-black text-slate-400 self-end mb-1">+{map.lootTable.length - 8} more</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className={`text-[8px] font-black ${theme.accent} uppercase tracking-widest italic flex items-center gap-1`}>
                      <Skull size={10} /> Sector Denizens:
                    </p>
                    <div className="flex gap-2">
                        {(() => {
                           const folderMap = {
                             'neon_slums': 'Neon Slums',
                             'rust_canyon': 'Rust Canyon',
                             'void_sector': 'Void Sector 7',
                             'inferno_crater': 'Inferno Crater',
                             'tectonic_ridge': 'Tectonic Ridge',
                             'abyssal_trench': 'Abyssal Trench',
                             'gale_empire': 'Gale Empire'
                           };
                           const folder = folderMap[map.id] || 'Neon Slums';
                           const denizens = map.id === 'neon_slums' ? ['Venomhide Drake', 'Bone Dragon', 'Ember Drake'] : 
                                            map.id === 'rust_canyon' ? ['Rust Cat 0-0', 'Canyon Flyer 1-1', 'Iron Pet 2-2'] : 
                                            map.id === 'void_sector' ? ['Null Stalker', 'Void Wraith', 'Abyssal Crawler'] :
                                            map.id === 'inferno_crater' ? ['Magma Creeper', 'Lava Lurker', 'Ember Shade'] :
                                            map.id === 'tectonic_ridge' ? ['Rock Crusher', 'Stone Sentinel', 'Earth Eater'] :
                                            map.id === 'gale_empire' ? ['Zephyr Scout', 'Sky Sentinel', 'Storm Sovereign'] :
                                            ['Abyssal Angler', 'Trench Terror', 'Deep Sea Dweller'];
                           
                           return denizens.map((name, di) => (
                             <div key={di} className="w-10 h-10 border-2 border-black bg-slate-900 rounded-md overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] hover:scale-110 transition-transform relative group/portrait">
                                <img 
                                  src={`/assets/monsters/${folder}/${name}.jpg`} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => { 
                                    if (e.target.src.endsWith('.jpg')) e.target.src = `/assets/monsters/${folder}/${name}.png`;
                                    else { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + name; }
                                  }}
                                />
                                <div className={`absolute inset-0 ${map.element === 'Pyro' ? 'bg-orange-600/20' : map.element === 'Earthen' ? 'bg-emerald-600/20' : 'bg-red-600/20'} opacity-0 group-hover/portrait:opacity-100 transition-opacity flex items-center justify-center`}>
                                   <p className="text-[5px] font-black text-white uppercase text-center leading-none">{name}</p>
                                </div>
                             </div>
                           ));
                        })()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className={`text-[8px] font-black ${theme.accent} uppercase tracking-widest italic flex items-center gap-1`}>
                      <Star size={10} /> Prized Item Drops:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {map.lootTable.map(lootId => {
                        const loot = LOOTS.find(l => l.id === lootId);
                        if (loot && (loot.rarity === 'Epic' || loot.rarity === 'Legendary')) {
                          return (
                            <div key={lootId} className="relative group/item">
                              <div className={`w-10 h-10 rounded-xl border-[3px] border-black flex items-center justify-center text-xl shadow-[3px_3px_0_rgba(0,0,0,1)] relative z-10 ${loot.rarity === 'Legendary' ? 'bg-amber-100 animate-pulse' : 'bg-purple-100'}`}>
                                {loot.icon}
                              </div>
                              <div className="absolute -top-1 -right-1 z-20 w-3 h-3 bg-red-500 border border-black rounded-full animate-ping"></div>
                              <div className="absolute -bottom-1 -left-1 z-20 bg-black text-white text-[5px] font-black px-1 border border-white/20 uppercase tracking-tighter">
                                {loot.rarity}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t-2 border-dashed border-black/10 pt-3 mt-4 relative z-10">
                  <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-[9px] font-black uppercase text-black italic">Incursion Entry Available</span>
                  </div>
                  {isLocked ? <Lock size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-black animate-pulse" />}
                </div>

                {isLocked && (
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center backdrop-blur-[1px] z-[40]">
                      <div className="bg-red-600 text-white px-4 py-1 border-2 border-black font-black text-[10px] -rotate-12 shadow-lg">LOCKED: REACH LVL {map.minLevel}</div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-green-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-green-500 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
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
                   <div className="absolute inset-x-0 bottom-0 bg-green-500 text-[6px] font-black text-black text-center py-0.5 uppercase italic">COMMANDER</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-green-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'map' && (
                     <MapIcon className="text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'element' && (
                     <ShieldAlert className="text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10 animate-pulse" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'drops' && (
                     <Star className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-green-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-green-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-green-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-green-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-green-500' : 'bg-slate-800'}`}
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
                    className="flex-[2] bg-green-500 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-green-400 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'LAUNCH SECTOR' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Auto Scroll Resume Prompt */}
      {resumePromptMap && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
           <div className="relative w-full max-w-sm flex flex-col justify-center">
              <div className="relative bg-slate-900 border-[4px] border-black rounded-xl z-10 flex flex-col items-center overflow-hidden shadow-[8px_8px_0_rgba(6,182,212,0.3)]">
                 <div className="w-full bg-cyan-600 py-3 border-b-[4px] border-black transform -rotate-1 relative z-10">
                    <h2 className="text-xl md:text-2xl font-black text-black text-center uppercase tracking-tighter italic">ACTIVE TIMER FOUND</h2>
                 </div>
                 
                 <div className="p-6 space-y-4 w-full">
                    <div className="flex justify-center">
                       <div className="bg-cyan-950 p-4 border-2 border-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                          <Zap size={40} className="text-cyan-400" />
                       </div>
                    </div>
                    
                    <p className="text-sm font-bold text-center text-white/80">
                       You have suspended Auto-Scroll time remaining: <br/>
                       <span className="text-cyan-400 font-black text-lg block mt-1">
                          {Math.floor((player.autoTimeLeftSaved || 0) / 60000)}m {Math.floor(((player.autoTimeLeftSaved || 0) % 60000) / 1000)}s
                       </span>
                    </p>
                    
                    <div className="flex flex-col gap-3 mt-4">
                       <button
                         onClick={() => executeMapEntry(resumePromptMap)}
                         className="w-full bg-cyan-500 text-black py-3 rounded-lg font-black uppercase tracking-widest hover:bg-cyan-400 transition-all border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic text-sm md:text-base flex items-center justify-center gap-2"
                       >
                         CONFIRM AND RESUME
                         <ChevronRight size={18} />
                       </button>
                       <button
                         onClick={() => setResumePromptMap(null)}
                         className="w-full mt-2 text-slate-500 font-bold uppercase tracking-widest hover:text-white transition-colors text-[10px]"
                       >
                         CANCEL DEPLOYMENT
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>,
        document.body
      )}

      {/* Dungeon Loadout Prep Modal */}
      {pendingDungeonEntry && (
        <DungeonPrepModal
          player={player}
          playerPotions={actions.getPlayerPotionOwned ? actions.getPlayerPotionOwned() : { hp_potion: 0, mega_hp_potion: 0, ultra_hp_potion: 0 }}
          playerScrolls={actions.getPlayerScrollOwned ? actions.getPlayerScrollOwned() : { auto_scroll: 0, auto_scroll_3m: 0, auto_scroll_6m: 0, auto_scroll_9m: 0, auto_scroll_12m: 0 }}
          onConfirm={handlePrepConfirm}
          onCancel={handlePrepCancel}
        />
      )}

    </div>
  );
};


