import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Check, Hammer, Package, Activity, Sparkles } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
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

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[1000px] relative custom-scrollbar bg-slate-950">
      {/* Visual Character: Plasma Smelter Atmosphere */}
      <div className="absolute inset-0 bg-heat-gradient opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 2px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      <div className="scanline-move opacity-20" style={{ backgroundColor: 'rgba(245, 158, 11, 0.4)', boxShadow: '0 0 15px rgba(245, 158, 11, 0.6)' }} />
      
      <Header title="IDENTITY LAB: FORGE" onClose={adventure.goBack} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
      }} />
      
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

                <button 
                  onClick={() => setForgeResult(null)}
                  className="w-full py-3 bg-black text-white font-black uppercase italic border-2 border-white/20 hover:bg-white hover:text-black transition-all shadow-[4px_4px_0_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none mt-4"
                >
                  Confirm & Continue
                </button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-amber-100 border-2 border-amber-900/20 p-3 rounded-lg flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 bg-amber-500 border-2 border-black flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)]">
          <span className="text-xl">🛠️</span>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-amber-900/60 leading-none">Global Forge Bonus</p>
          <p className="text-sm font-black text-amber-900 uppercase italic">Dexterity increases success rate!</p>
        </div>
      </div>

      <div className="grid gap-6 relative z-10 pb-20">
        {CRYSTLE_RECIPES.map((recipe, index) => {
          const hasRecipe = player.recipes?.includes(recipe.id);
          const materials = recipe.materials || [];
          const master = getMasterData(recipe.id);
          const type = master?.type || 'Weapon';
          // Fix owned check for unique IDs
          const equippedBaseId = player.equipped?.[type]?.id?.replace(/(_\d+)+$/, '');
          const isOwned = equippedBaseId === recipe.id;
          
          // Use totalStats from context
          const currentDex = totalStats?.dex || 10;
          const successRate = Math.min(95, 50 + Math.floor(currentDex / 2));
          
          // Check materials with robust matching (ID or Name-based fallback)
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
              className={`p-5 bg-white border-[4px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col gap-4 group transition-transform hover:-translate-y-1 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${!hasRecipe ? 'opacity-40 grayscale' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className={`w-14 h-14 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] bg-amber-500 transform -rotate-3`}>
                    {hasRecipe ? <span className="text-3xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">{master?.icon || recipe.icon}</span> : <Lock size={24} className="text-black/40" />}
                  </div>
                  <div className="space-y-1 text-left">
                    <h4 className="font-black text-xl text-black uppercase tracking-tighter italic leading-none">
                      {hasRecipe ? (master?.name || recipe.name) : 'Unknown Schematic'}
                    </h4>
                    <div className="flex flex-col gap-1">
                      <div className="bg-amber-100/50 px-2 py-0.5 border border-black/10 inline-block self-start">
                        <div className="flex gap-2 text-[9px] font-black uppercase text-amber-900/60 italic">
                          {Object.entries(master?.stats || recipe.stats || {}).map(([k, v]) => <span key={k}>{k}+{v}</span>)}
                        </div>
                      </div>
                      {hasRecipe && master?.effect && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] animate-pulse">⚡</span>
                            <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-1 border border-amber-200">
                              Effect: {master.effect.type} {master.effect.mult ? `(x${master.effect.mult})` : ''}
                            </span>
                          </div>
                      )}
                    </div>
                  </div>
                </div>

                {hasRecipe && (
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Success Rate</p>
                    <p className={`text-lg font-black italic ${successRate > 80 ? 'text-emerald-500' : successRate > 60 ? 'text-amber-500' : 'text-red-500'}`}>{successRate}%</p>
                  </div>
                )}
              </div>

              {/* Material Requirements (Comic Panel Style) */}
              {hasRecipe && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-100/50 p-4 border-2 border-dashed border-black/10 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 opacity-10 font-black italic text-[8px] uppercase tracking-[0.2em] -rotate-90 origin-top-right">Material Scan Complete</div>
                  {materials.map((mat, mIdx) => {
                    const loot = LOOTS.find(l => l.id === mat.id);
                    const countInInv = Object.values(player.inventory || {}).filter(i => {
                      if (!i) return false;
                      const cleanId = i.id?.replace(/(_\d+)+$/, '');
                      const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
                      return (cleanId === mat.id) || (master?.id === mat.id);
                    }).length || 0;
                    const isMet = countInInv >= mat.count;
                    return (
                      <div 
                        key={mat.id} 
                        onMouseEnter={() => setActiveTooltip(mat.id)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(activeTooltip === mat.id ? null : mat.id)}
                        className={`group/mat relative p-2 border-2 shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all cursor-help ${mIdx % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${isMet ? 'bg-white border-black' : 'bg-red-50 border-red-500/40 opacity-70'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-sm bg-black/5 flex items-center justify-center border-b-2 border-black/10`}>
                            <span className="text-xl filter drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">{loot?.icon}</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[7px] font-black uppercase text-slate-400 truncate leading-none mb-1">
                              {activeTooltip === mat.id ? <span className="text-cyan-600 animate-pulse">SOURCE: {getItemSource(mat.id)}</span> : (loot?.name || mat.id)}
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-[12px] font-black italic tracking-tighter ${isMet ? 'text-black' : 'text-red-600 animate-pulse'}`}>{countInInv}</span>
                              <span className="text-[8px] font-black text-slate-300">/ {mat.count}</span>
                            </div>
                          </div>
                        </div>
                        {isMet && (
                          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10 animate-bounce-subtle">
                             <Check size={8} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              
              <div className="flex justify-between items-center border-t-[3px] border-black pt-3 mt-2">
                <div className={`bg-slate-900 text-white px-3 py-1 border-2 border-black transform rotate-3 relative shadow-sm ${!hasRecipe || isOwned ? 'opacity-30' : ''}`}>
                  <span className="text-xs font-black italic">{recipe.cost} GX</span>
                </div>
                <button 
                  onClick={() => forgeCrystle(recipe)} 
                  disabled={!hasRecipe || !hasMaterials || isOwned} 
                  className={`px-6 py-2 border-[3px] border-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${!hasRecipe || !hasMaterials ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed' : isOwned ? 'bg-emerald-500 text-white border-black' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
                >
                  {!hasRecipe ? 'LOCKED' : !hasMaterials ? 'INSUFFICIENT MATERIALS' : isOwned ? 'ACTIVE' : 'FORGE'}
                </button>
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
                   <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
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
