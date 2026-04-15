import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Check, Hammer, Package, Activity, Sparkles } from 'lucide-react';
import { Header, AvatarMedia, CitizenMedia } from './GameUI';
import { NPCCard } from './NPCCard';
import { useGame } from '../contexts/GameContext';

export const ForgeView = React.memo(() => {
  const { player, CRYSTLE_RECIPES, actions, adventure, LOOTS, openGuide, ITEMS, totalStats, forgeResult, setForgeResult } = useGame();
  const { setView } = adventure;
  const { forgeCrystle } = actions;

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const { MAPS } = useGame();

  const getItemSource = (itId) => {
    if (itId?.includes('apple') || itId?.includes('grapes') || itId?.includes('berry') || itId?.includes('cherry') || itId?.includes('peach') || itId?.includes('lemon') || itId?.includes('orange') || itId?.includes('pear')) {
        return "Dragons Ground / Orchard";
    }
    const sources = MAPS?.filter(m => m.lootTable?.includes(itId)).map(m => m.name);
    if (sources && sources.length > 0) return sources.join(", ");
    return "Unknown / Rare Drop";
  };

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_forge_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Identity Lab",
      npc: 3,
      visualType: 'forge',
      text: "Welcome to the Identity Forge! This is where you synthesize powerful Relics using materials scavenged from Dungeon runs.",
      hint: "Tip: Relics provide massive stat multipliers."
    },
    {
      title: "Material Synthesis",
      npc: 1,
      visualType: 'mats',
      text: "To forge an item, you need its specific Blueprint and all the required raw components. Check your material storage!",
      hint: "Strategy: Farm specific zones for missing loot."
    },
    {
      title: "Success Margins",
      npc: 6,
      visualType: 'success',
      text: "Warning! Forging is an imprecise science. Your success rate is directly tied to your Dexterity stat. Low Dex means your items might shatter!",
      hint: "Warning: Failed attempts permanently consume materials."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_forge_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  const getMasterData = (id) => ITEMS.find(i => i.id === id);

  const [activeTab, setActiveTab] = useState('Standard');
  const standardRecs = CRYSTLE_RECIPES.filter(r => r.isDefault);
  const prototypeRecs = CRYSTLE_RECIPES.filter(r => !r.isDefault);
  const activeRecipes = activeTab === 'Standard' ? standardRecs : prototypeRecs;

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-h-[1000px] relative custom-scrollbar bg-slate-950">
      {/* Visual Character: Plasma Smelter Atmosphere */}
      <div className="absolute inset-0 bg-heat-gradient opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 2px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      
      <Header title="IDENTITY LAB: FORGE" onClose={adventure.goBack} npcNum={7} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
      }} />

      <NPCCard
        citizenNum={7}
        name="MASTER FORGER"
        accentColor="bg-orange-600"
        textColor="text-orange-600"
        glowColor="bg-orange-500"
        statusTag="FORGE_HOT"
        statusTag2="ANVIL_READY"
        prefix="◢FORGER: "
        dialogues={[
          "Welcome to the Identity Forge! Every great hunter needs a great weapon.",
          "Dexterity is key—higher DEX means fewer failed forges. Invest wisely.",
          "Missing materials? Check which dungeon zone drops what by hovering ingredients.",
          "Prototype Schematics are rare. Look for them in deep Sector 5+ dungeons.",
          "A forged Relic can multiply your stats by orders of magnitude. Worth the grind!",
          "The anvil doesn't lie. Bring the right materials and it will reward you.",
          "I've seen hunters waste Tier 3 materials on impulse. Plan your forge path first!",
          "Blueprint scrolls drop from elite mobs. Patience, hunter."
        ]}
      />

      {/* TIER TABS - High Contrast Comic Style */}
      <div className="flex gap-2 relative z-20">
        {['Standard', 'Prototypes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 border-[3px] border-black text-sm font-black uppercase tracking-tighter skew-x-[-10deg] transition-all relative overflow-hidden ${
              activeTab === tab 
                ? 'bg-orange-500 text-black shadow-[4px_4px_0_rgba(0,0,0,1)] -translate-y-1' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="skew-x-[10deg] inline-block">
              {tab === 'Standard' ? '🛠️ Industrial Assemblies' : '📜 System Prototypes'}
            </span>
            {activeTab === tab && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-white animate-ping" />
            )}
          </button>
        ))}
      </div>
      
      {/* Forge Result Modal (Comic Aesthetic) */}
      {forgeResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className={`max-w-xs w-full p-8 border-[6px] border-black shadow-[12px_12px_0_rgba(0,0,0,1)] relative animate-in zoom-in-95 duration-300 transform ${forgeResult.success ? 'bg-cyan-500 rotate-1' : 'bg-red-600 -rotate-1'}`}>
              <div className="absolute -top-6 -left-6 bg-white border-4 border-black px-4 py-1 transform -rotate-12 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <span className="text-xl font-black italic uppercase text-black tracking-tighter">{forgeResult.success ? 'BAM!' : 'KRAK!'}</span>
              </div>
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-black flex items-center justify-center border-4 border-white shadow-[6px_6px_0_rgba(0,0,0,0.5)] transform rotate-3">
                  <span className="text-5xl">{forgeResult.item?.icon || (forgeResult.success ? '⚔️' : '💥')}</span>
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white italic uppercase leading-none tracking-tighter">
                    {forgeResult.success ? 'FORGE SUCCESS!' : 'FORGE FAILED!'}
                  </h2>
                  <p className="text-[10px] font-black text-black/60 uppercase tracking-widest leading-tight">
                    {forgeResult.success ? `Masterfully Crafted: ${forgeResult.item?.name}` : 'Critical structural failure detected.'}
                  </p>
                </div>
                <button onClick={() => setForgeResult(null)} className="w-full py-3 bg-black text-white font-black uppercase italic border-2 border-white/20 hover:bg-white hover:text-black transition-all shadow-[4px_4px_0_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none mt-4">Confirm & Continue</button>
              </div>
           </div>
        </div>
      )}

      {/* GRID LAYOUT - 2 Columns on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10 pb-20">
        {activeRecipes.map((recipe, index) => {
          const hasRecipe = recipe.isDefault || player.recipes?.includes(recipe.id);
          const materials = recipe.materials || [];
          const master = getMasterData(recipe.id);
          const type = master?.type || 'Weapon';
          const equippedBaseId = player.equipped?.[type]?.id?.replace(/(_\d+)+$/, '');
          const isOwned = equippedBaseId === recipe.id;
          const currentDex = totalStats?.dex || 10;
          const successRate = Math.min(95, 50 + Math.floor(currentDex / 2));
          
          const hasMaterials = materials.every(mat => {
            const countInInv = Object.values(player.inventory || {}).filter(i => {
               if (!i) return false;
               const cleanId = i.id?.replace(/(_\d+)+$/, '');
               const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
               return (cleanId === mat.id) || (master?.id === mat.id);
            }).length || 0;
            return countInInv >= mat.count;
          });

          return (
            <div 
              key={recipe.id} 
              className={`p-4 bg-white border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] flex flex-col gap-3 transition-all ${!hasRecipe ? 'pointer-events-none grayscale' : 'hover:scale-[1.01] z-30'}`}
            >
              <div className={`flex flex-col gap-3 h-full ${!hasRecipe ? 'opacity-40' : ''}`}>
              <div className="flex gap-4 items-start">
                <div className={`w-20 h-20 border-[4px] border-black flex items-center justify-center shrink-0 shadow-[4px_4px_0_rgba(0,0,0,1)] bg-amber-500 transform -rotate-1`}>
                  {hasRecipe ? <span className="text-5xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">{master?.icon || recipe.icon}</span> : <Lock size={32} className="text-black/40" />}
                </div>
                <div className="flex-1 space-y-1 text-left min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-xl text-black uppercase tracking-tighter italic leading-none truncate">
                      {hasRecipe ? (master?.name || recipe.name) : 'Locked Schematic'}
                    </h4>
                    {!recipe.isDefault && <div className="bg-black text-white text-[7px] font-black px-1 py-0.5 rounded ml-2">SCHEMATIC</div>}
                  </div>
                  
                  {/* HIGH VISIBILITY STATS - Large Bold Black */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(master?.stats || recipe.stats || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center bg-slate-100 px-2 py-1 border-2 border-black/10">
                        <span className="text-[10px] font-black uppercase text-slate-500 mr-1">{k}:</span>
                        <span className="text-base font-black text-black">+{v}</span>
                      </div>
                    ))}
                  </div>

                  {hasRecipe && master?.effect && (
                    <div className="flex items-center gap-1 mt-1 bg-amber-50 border border-amber-200 px-2 py-0.5 self-start">
                       <Sparkles size={10} className="text-amber-500 animate-pulse" />
                       <span className="text-[9px] font-black uppercase text-amber-700">
                         {master.effect.type}: {master.effect.mult ? `x${master.effect.mult}` : `${(master.effect.chance * 100).toFixed(0)}% Proc`}
                       </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Materials Visualization */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 border-2 border-black/5 rounded">
                {materials.map((mat, mIdx) => {
                  const masterLoot = LOOTS.find(l => l.id === mat.id);
                  const countInInv = Object.values(player.inventory || {}).filter(i => {
                    if (!i) return false;
                    const cleanId = i.id?.replace(/(_\d+)+$/, '');
                    const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
                    return (cleanId === mat.id) || (master?.id === mat.id);
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
                              <Sparkles size={12} className="text-orange-600" />
                              <span className="text-[9px] font-[1000] text-black uppercase tracking-tighter italic">{masterLoot?.name || 'MATERIAL'}</span>
                           </div>
                           <div className="text-[9px] font-black text-black leading-tight uppercase bg-orange-400 px-2 py-1 border-2 border-black -skew-x-12">{getItemSource(mat.id)}</div>
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
                     <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Price</span>
                     <span className="text-xs font-black italic">{recipe.cost} GX</span>
                   </div>
                   <div className="text-right">
                     <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Success</span>
                     <span className={`text-xs font-black italic ${successRate > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{successRate}%</span>
                   </div>
                </div>
                <button 
                  onClick={() => forgeCrystle(recipe)} 
                  disabled={!hasRecipe || !hasMaterials || isOwned} 
                  className={`px-4 py-2 border-[3px] border-black font-black text-[11px] uppercase tracking-tighter transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${!hasRecipe || !hasMaterials ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed' : isOwned ? 'bg-emerald-500 text-white border-black' : 'bg-orange-500 text-black hover:bg-orange-400'}`}
                >
                  {isOwned ? 'EQUIPPED' : hasMaterials ? 'SYNTHESIZE' : 'MISSING MATS'}
                </button>
              </div>
              </div>
            </div>
          );
        })}
      </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-orange-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #ea580c 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-orange-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
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
                   <div className="absolute inset-x-0 bottom-0 bg-orange-600 text-[6px] font-black text-black text-center py-0.5 uppercase italic">SYSTEM</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-orange-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-orange-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'forge' && (
                     <Hammer className="text-orange-400 drop-shadow-[0_0_10px_rgba(234,88,12,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'mats' && (
                     <Package className="text-orange-400 drop-shadow-[0_0_10px_rgba(234,88,12,0.5)] z-10 animate-pulse" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'success' && (
                     <Activity className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-orange-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-orange-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-orange-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-orange-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-orange-500' : 'bg-slate-800'}`}
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
                    className="flex-[2] bg-orange-600 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'PREPARE FORGE' : 'TRANSMIT MORE'}
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
