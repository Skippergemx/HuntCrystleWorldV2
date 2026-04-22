import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FlaskConical, Zap, Beaker, Pipette, Thermometer, ShieldCheck, ArrowLeft, Info, HelpCircle, Activity, ShoppingBag, Gem, Clock, Search, Sparkles, Check } from 'lucide-react';
import { Header, AvatarMedia, CitizenMedia } from './GameUI';
import { NPCCard } from './NPCCard';
import { useGame } from '../contexts/GameContext';

export const LaboratoryView = React.memo(() => {
  const { 
    player, adventure, actions, LAB_RECIPES, ITEMS, MAPS, addLog, openGuide, forgeResult, setForgeResult, syncPlayer, FOODS, user
  } = useGame();
  
  const { setView } = adventure;
  const { mixLaboratoryItem } = actions;
  
  const [selectedRecipe, setSelectedRecipe] = useState(LAB_RECIPES[0]);
  const [hoveredSourceId, setHoveredSourceId] = useState(null);



  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isMaterializing, setIsMaterializing] = useState(false);
  const [materializeProgress, setMaterializeProgress] = useState(0);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_lab_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Xenon Laboratory",
      npc: 43,
      visualType: 'lab',
      text: "Welcome to my lab! Here we can mix rare monster parts to synthesize powerful Consumables and Magic Scrolls.",
      hint: "Tip: Consumables provide huge dungeon benefits."
    },
    {
      title: "Material Tracing",
      npc: 1,
      visualType: 'materials',
      text: "You'll need specific quantities of raw drops. If you're missing something, tap its icon to 'Search' where it drops in the sectors!",
      hint: "Strategy: Farm specific zones for missing loot."
    },
    {
      title: "Perfect Mixtures",
      npc: 5,
      visualType: 'success',
      text: "Unlike the Forge, everything we make here has a 100% Science Success Rate! As long as you have the parts, you get the item.",
      hint: "Warning: High-tier recipes cost a lot of GX Tokens."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_lab_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  const materials = useMemo(() => {
    return Object.values(player.inventory || {});
  }, [player.inventory]);

  const getMaterialCount = (matId) => {
    return materials.filter(i => {
      if (!i) return false;
      const cleanId = i.id?.replace(/(_\d+)+$/, '');
      const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
      return (cleanId === matId) || (master?.id === matId);
    }).length;
  };

  const currentMasterItem = useMemo(() => {
    return ITEMS.find(it => it.id === selectedRecipe.id);
  }, [selectedRecipe, ITEMS]);

  const getItemSource = (itId) => {
    const sources = MAPS.filter(m => m.lootTable?.includes(itId)).map(m => m.name);
    if (sources.length > 0) return sources.join(", ");
    if (LAB_RECIPES.some(r => r.id === itId)) return "Xenon Lab Synthesis";
    return "Unknown Sector / Rare Drop";
  };

  const [activeTab, setActiveTab] = useState('Mixtures');

  const scrollRecipes = LAB_RECIPES.filter(r => r.id.toLowerCase().includes('scroll'));
  const mixtureRecipes = LAB_RECIPES.filter(r => !r.id.toLowerCase().includes('scroll'));

  const activeRecipes = activeTab === 'Scrolls' ? scrollRecipes : mixtureRecipes;

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-h-[1000px] relative custom-scrollbar bg-slate-950">
      {/* Visual Character: Bubbling Bio-Matter Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4338ca_0%,transparent_70%)] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ec4899 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      
      {/* GLOBAL HEADER */}
      <Header title="XENON LABORATORY" onClose={adventure.goBack} npcNum={12} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
      }} />

      <NPCCard
        avatarNum={12}
        name="PROFESSOR NEON"
        accentColor="bg-cyan-500"
        textColor="text-cyan-600"
        glowColor="bg-cyan-500"
        statusTag="LAB_STABLE"
        statusTag2="SYSTEM_ONLINE"
        prefix="◢PROF: "
        dialogues={[
          "Welcome to the Xenon Lab! Science is 90% preparation and 10% not exploding.",
          "Mix those reagents carefully! One wrong drop and we're all pink.",
          "Looking for Magic Scrolls? They're under the 'Forbidden' tab.",
          "The stability here is 100%. I triple-checked the containment field today.",
          "Need more GX? Try venturing deeper into the Slums.",
          "I've discovered a new way to condense Sludge Splicer essence. Fascinating!",
          "Always keep a few Bio-Potions in your kit for deep sector runs.",
          "The molecular structure of these logic-gems is unlike anything I've seen."
        ]}
      />

      {/* TIER TABS - Techno-Organic Style */}
      <div className="flex gap-2 relative z-20">
        {['Mixtures', 'Scrolls'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 border-[3px] border-black text-sm font-black uppercase tracking-tighter skew-x-[-10deg] transition-all relative overflow-hidden ${
              activeTab === tab 
                ? 'bg-pink-600 text-white shadow-[4px_4px_0_rgba(0,0,0,1)] -translate-y-1' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="skew-x-[10deg] inline-block">
              {tab === 'Mixtures' ? '🧪 Chemical Mixtures' : '🪄 Forbidden Scrolls'}
            </span>
            {activeTab === tab && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-white animate-ping" />
            )}
          </button>
        ))}
      </div>
      
      {/* Materializing Overlay (High Fidelity Sync Modal) */}
      {isMaterializing && createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="max-w-sm w-full bg-slate-900 border-[6px] border-black p-8 relative shadow-[16px_16px_0_rgba(0,0,0,1)] overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
              
              <div className="relative z-10 space-y-6 text-center">
                 <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <FlaskConical className="text-cyan-400 w-16 h-16 animate-bounce" />
                    <div className="absolute inset-0 border-4 border-dashed border-cyan-400/50 rounded-full animate-spin-slow"></div>
                 </div>

                 <div className="space-y-2">
                    <h2 className="text-2xl font-[1000] text-white uppercase italic tracking-tighter leading-none">
                       MATERIALIZING...
                    </h2>
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] animate-pulse">
                       Synchronizing Molecular Bonds with Hub
                    </p>
                 </div>

                 {/* Custom Progress Bar */}
                 <div className="w-full h-8 bg-black border-[3px] border-white/20 relative overflow-hidden">
                    <div 
                       className="h-full bg-cyan-500 transition-all duration-300 ease-out"
                       style={{ width: `${materializeProgress}%` }}
                    >
                       <div className="absolute inset-0 bg-grid-white/20 animate-pull"></div>
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white mix-blend-difference italic">
                       {Math.floor(materializeProgress)}% SYNC
                    </span>
                 </div>

                 <div className="pt-4 border-t border-white/10">
                    <p className="text-[9px] font-black text-slate-500 uppercase leading-relaxed">
                       Please wait. Verifying transaction integrity on the central sector grid. Don't close the terminal.
                    </p>
                 </div>
              </div>
              
              {/* Corner Accents */}
              <div className="absolute top-2 right-2 flex gap-1">
                 <div className="w-1.5 h-1.5 bg-cyan-500 animate-ping"></div>
                 <div className="w-1.5 h-1.5 bg-slate-700"></div>
              </div>
           </div>
        </div>,
        document.body
      )}
      
      {/* Synthesis Result Modal (Comic Aesthetic) */}
      {forgeResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="max-w-xs w-full p-8 border-[6px] border-black shadow-[12px_12px_0_rgba(0,0,0,1)] relative animate-in zoom-in-95 duration-300 transform bg-emerald-500 rotate-1">
              <div className="absolute -top-6 -left-6 bg-white border-4 border-black px-4 py-1 transform -rotate-12 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <span className="text-xl font-black italic uppercase text-black tracking-tighter">SUCCESS!</span>
              </div>
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-black flex items-center justify-center border-4 border-white shadow-[6px_6px_0_rgba(0,0,0,0.5)] transform -rotate-2">
                  <span className="text-5xl">{forgeResult.item?.icon || '🧪'}</span>
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white italic uppercase leading-none tracking-tighter">
                    MOLECULAR BONDING COMPLETE!
                  </h2>
                  <p className="text-[10px] font-black text-black/60 uppercase tracking-widest leading-tight">
                    Recovered: {forgeResult.item?.name}
                  </p>
                </div>
                <button onClick={() => setForgeResult(null)} className="w-full py-3 bg-black text-white font-black uppercase italic border-2 border-white/20 hover:bg-white hover:text-black transition-all shadow-[4px_4px_0_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none mt-4">Confirm & Continue</button>
              </div>
           </div>
        </div>
      )}

      {/* GRID LAYOUT - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10 pb-20">
        {activeRecipes.map((recipe) => {
          const master = ITEMS.find(it => it.id === recipe.id);
          const materials = recipe.materials || [];
          
          const hasMaterials = materials.every(mat => {
            const countInInv = Object.values(player.inventory || {}).filter(i => {
               if (!i) return false;
               const cleanId = i.id?.replace(/(_\d+)+$/, '');
               const itemMaster = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
               return (cleanId === mat.id) || (itemMaster?.id === mat.id);
            }).length || 0;
            return countInInv >= mat.count;
          });

          return (
            <div 
              key={recipe.id} 
              className={`p-4 bg-white border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] flex flex-col gap-3 transition-all hover:scale-[1.01] z-30`}
            >
              <div className="flex gap-4 items-start">
                <div className={`w-20 h-20 border-[4px] border-black flex items-center justify-center shrink-0 shadow-[4px_4px_0_rgba(0,0,0,1)] bg-indigo-500 transform -rotate-1 relative overflow-hidden group`}>
                  <div className="absolute inset-0 bg-grid-slate-100 opacity-20"></div>
                  <span className="text-5xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,1)] relative z-10 group-hover:animate-bounce">{master?.icon || '🧪'}</span>
                </div>
                <div className="flex-1 space-y-1 text-left min-w-0">
                  <h4 className="font-black text-xl text-black uppercase tracking-tighter italic leading-none truncate">
                    {master?.name}
                  </h4>
                  
                  {/* HIGH VISIBILITY EFFECT - Bold Black Large */}
                  <div className="bg-slate-100 p-2 border-2 border-black/5 min-h-[40px] flex items-center">
                    <p className="text-xs font-black text-black leading-tight">
                      {master?.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 border-t-2 border-black/5 pt-1">
                     <Clock size={10} className="text-slate-400" />
                     <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                       Category: {activeTab === 'Scrolls' ? 'Magic Logic' : 'Techno-Organic'}
                     </span>
                  </div>
                </div>
              </div>

              {/* Ingredients Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 border-2 border-black/5 rounded">
                {materials.map((mat, mIdx) => {
                  const masterLoot = ITEMS.find(l => l.id === mat.id);
                  const countInInv = Object.values(player.inventory || {}).filter(i => {
                    if (!i) return false;
                    const cleanId = i.id?.replace(/(_\d+)+$/, '');
                    const itemMaster = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
                    return (cleanId === mat.id) || (itemMaster?.id === mat.id);
                  }).length || 0;
                  const isMet = countInInv >= mat.count;
                  const tooltipKey = `${recipe.id}-${mat.id}-${mIdx}`;
                  return (
                    <div 
                      key={tooltipKey} 
                      onMouseEnter={() => setActiveTooltip(tooltipKey)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => setActiveTooltip(prev => prev === tooltipKey ? null : tooltipKey)}
                      className={`p-1.5 border-2 relative cursor-help transition-all transform hover:-translate-y-1 ${isMet ? 'bg-white border-black shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'bg-red-50 border-red-200'}`}
                    >
                      {activeTooltip === tooltipKey && (
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-52 bg-white border-[3px] border-black p-2 z-[999] shadow-[8px_8px_0_rgba(0,0,0,1)] transform -rotate-1 pointer-events-none">
                           <div className="flex items-center gap-1.5 mb-1.5 border-b-2 border-black pb-1">
                              <Sparkles size={12} className="text-pink-500" />
                              <span className="text-[9px] font-[1000] text-black uppercase tracking-tighter italic">{masterLoot?.name || 'MATERIAL'}</span>
                           </div>
                           <div className="text-[9px] font-black text-black leading-tight uppercase bg-pink-300 px-2 py-1 border-2 border-black -skew-x-12">{getItemSource(mat.id)}</div>
                           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-[3px] border-r-[3px] border-black rotate-45"></div>
                        </div>
                      )}
                      <div className={`flex flex-col items-center gap-0.5 ${!isMet ? 'opacity-60' : ''}`}>
                        <span className="text-lg">{masterLoot?.icon || '📦'}</span>
                        <div className="flex items-center gap-1 font-black text-[10px] leading-none">
                          <span className={isMet ? 'text-black' : 'text-red-500'}>{countInInv}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-400">{mat.count}</span>
                        </div>
                      </div>
                      {isMet && <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5"><Check size={6} strokeWidth={5} /></div>}
                    </div>
                  )
                })}
              </div>
              
              <div className="flex gap-2 items-center mt-auto">
                <div className="flex-1 bg-slate-900 text-white px-3 py-2 border-[3px] border-black flex justify-between items-center group">
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Synthesis Cost</span>
                     <span className="text-xs font-black italic">{recipe.cost} GX</span>
                   </div>
                   <div className="text-right">
                     <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Stability</span>
                     <span className="text-xs font-black italic text-emerald-400">100.0%</span>
                   </div>
                </div>
                <button 
                  onClick={async () => {
                    setIsMaterializing(true);
                    setMaterializeProgress(0);
                    const interval = setInterval(() => {
                      setMaterializeProgress(prev => Math.min(95, prev + (100 / 30)));
                    }, 1000);
                    
                    try {
                      await mixLaboratoryItem(recipe);
                      setMaterializeProgress(100);
                      setTimeout(() => setIsMaterializing(false), 500);
                    } catch (e) {
                      addLog("🚨 SYNTHESIS ERROR: Hub connection dropped.");
                      setIsMaterializing(false);
                    } finally {
                      clearInterval(interval);
                    }
                  }} 
                  disabled={!hasMaterials || player.tokens < recipe.cost || isMaterializing} 
                  className={`px-4 py-2 border-[3px] border-black font-black text-[11px] uppercase tracking-tighter transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${(!hasMaterials || player.tokens < recipe.cost || isMaterializing) ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed' : 'bg-emerald-500 text-black hover:bg-emerald-400'}`}
                >
                  {isMaterializing ? 'SYNCING...' : (hasMaterials ? 'MATERIALIZE' : 'MISSING REAGENTS')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Synthesis Result Modal (Comic Aesthetic) */}
      {forgeResult && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
           <div className={`max-w-xs w-full p-8 border-[6px] border-black shadow-[12px_12px_0_rgba(0,0,0,1)] relative animate-in zoom-in-95 duration-300 transform ${forgeResult.success ? 'bg-emerald-500 rotate-1' : 'bg-pink-600 -rotate-1'}`}>
              <div className="absolute -top-6 -left-6 bg-white border-4 border-black px-4 py-1 transform -rotate-12 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <span className="text-xl font-black italic uppercase text-black tracking-tighter">{forgeResult.success ? 'SCIENCE!' : 'ERROR!'}</span>
              </div>

              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-black flex items-center justify-center border-4 border-white shadow-[6px_6px_0_rgba(0,0,0,0.5)] transform rotate-3">
                  <span className="text-5xl">{forgeResult.success ? (forgeResult.item?.icon || '🧪') : '💥'}</span>
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white italic uppercase leading-none tracking-tighter">
                    {forgeResult.success ? 'SYNTHESIS SUCCESS!' : 'SYNTHESIS FAILED!'}
                  </h2>
                  <p className="text-[10px] font-black text-black/60 uppercase tracking-widest leading-tight">
                    {forgeResult.success ? `Object Materialized: ${forgeResult.item?.name}` : (forgeResult.error || 'Molecular fusion destabilized.')}
                  </p>
                </div>

                <button 
                  onClick={() => setForgeResult(null)}
                  className="w-full py-3 bg-black text-white font-black uppercase italic border-2 border-white/20 hover:bg-white hover:text-black transition-all shadow-[4px_4px_0_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none mt-4"
                >
                  {forgeResult.success ? 'Confirm & Continue' : 'Retry Protocol'}
                </button>
              </div>
           </div>
        </div>,
        document.body
      )}

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-pink-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #db2777 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-pink-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
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
                <div className="w-16 h-28 md:w-20 md:h-36 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0 flex items-center justify-center">
                   <CitizenMedia num={tutorialSteps[tutorialStep].npc} className="w-full h-full object-cover object-top" />
                   <div className="absolute inset-x-0 bottom-0 bg-pink-600 text-[6px] font-black text-black text-center py-0.5 uppercase italic">SCIENTIST</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-pink-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-pink-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'lab' && (
                     <FlaskConical className="text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'materials' && (
                     <Gem className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] z-10 animate-pulse" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'success' && (
                     <ShieldCheck className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-pink-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-pink-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-pink-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-pink-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-pink-500' : 'bg-slate-800'}`}
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
                    className="flex-[2] bg-pink-600 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-pink-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'START MIXING' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
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
});
