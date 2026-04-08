import React, { useState, useMemo } from 'react';
import { FlaskConical, Zap, Beaker, Pipette, Thermometer, ShieldCheck, ArrowLeft, Info, HelpCircle, Activity, ShoppingBag, Gem, Clock, Search, Sparkles } from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const LaboratoryView = React.memo(() => {
  const { 
    player, adventure, actions, LAB_RECIPES, ITEMS, MAPS, addLog, openGuide, forgeResult, setForgeResult 
  } = useGame();
  
  const { setView } = adventure;
  const { mixLaboratoryItem } = actions;
  
  const [selectedRecipe, setSelectedRecipe] = useState(LAB_RECIPES[0]);
  const [hoveredSourceId, setHoveredSourceId] = useState(null);

  const materials = useMemo(() => {
    return Object.values(player.inventory || {});
  }, [player.inventory]);

  const getMaterialCount = (matId) => {
    return materials.filter(i => {
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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Laboratory Background - Cute & Cosmic */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#4338ca_0%,transparent_70%)] opacity-30"></div>
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', 
          backgroundSize: '30px 30px' 
        }}></div>
      </div>

      <div className="p-4 z-10 flex items-center gap-4">
        <div className="relative group">
           <div className="absolute -inset-1 bg-pink-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
           <img 
             src="/assets/pets/genesis-pets/Genesis Pets (43).jpg" 
             className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] relative z-10"
             alt="Researcher"
           />
        </div>
        <div className="flex-1">
          <Header 
            title="Xenon Laboratory" 
            onClose={adventure.goBack} 
            onHelp={() => openGuide('laboratory')} 
          />
          <div className="bg-black text-emerald-400 text-[10px] font-black px-2 py-0.5 inline-block transform -rotate-1 mt-1 border-2 border-emerald-500/30">
             PROFESSOR NEON: "LET'S MAKE SOMETHING CUTE!"
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 p-4 overflow-hidden z-10">
        {/* Formula list (Left) */}
        <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar bg-white/5 backdrop-blur-sm p-4 border-r-4 border-black/30">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Sparkles size={16} className="text-pink-400 animate-pulse" />
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest italic">Secret Blueprints</h3>
          </div>
          
          {LAB_RECIPES.map(recipe => {
            const item = ITEMS.find(it => it.id === recipe.id);
            const isSelected = selectedRecipe.id === recipe.id;
            return (
              <button 
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className={`flex items-center gap-4 p-3 border-[4px] border-black transition-all group relative overflow-hidden ${
                  isSelected ? 'bg-indigo-600 shadow-[4px_4px_0_rgba(0,0,0,1)] -translate-x-1 -translate-y-1' : 'bg-slate-900 shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-slate-800'
                }`}
              >
                {isSelected && <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 -rotate-45 translate-x-12 -translate-y-12"></div>}
                <div className={`w-12 h-12 flex items-center justify-center text-2xl border-[3px] border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] transform group-hover:rotate-6 transition-transform z-10`}>
                  {item?.icon || (item?.id?.includes('scroll') ? '🪄' : '🧪')}
                </div>
                <div className="flex flex-col items-start min-w-0 z-10">
                  <h4 className={`text-[11px] font-black uppercase italic truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{item?.name}</h4>
                  <span className={`text-[7px] font-bold uppercase tracking-widest ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {item?.id?.includes('scroll') ? 'Magic Logic' : 'Cute Mixture'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Synthesizer (Center/Right) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-indigo-950/40 border-[6px] border-black p-4 md:p-8 flex-1 flex flex-col items-center justify-center relative shadow-[12px_12px_0_rgba(0,0,0,1)] overflow-hidden group">
            {/* Animated Bubbles Background */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-20">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="absolute bg-emerald-400 rounded-full animate-float-up" style={{
                   width: Math.random() * 40 + 10 + 'px',
                   height: Math.random() * 40 + 10 + 'px',
                   left: Math.random() * 100 + '%',
                   bottom: '-50px',
                   animationDelay: i * 1.5 + 's',
                   animationDuration: Math.random() * 4 + 3 + 's'
                 }}></div>
               ))}
            </div>

            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-500"></div>
            
            {/* Assistant One - Aqua - Hidden on Mobile */}
            <div className="absolute -bottom-4 -left-4 w-28 h-28 md:w-32 md:h-32 opacity-90 z-20 hover:scale-110 transition-all cursor-pointer group/ast hidden md:block">
               <img src="/assets/pets/genesis-pets/Genesis Pets (1).jpg" className="w-full h-full object-contain rounded-full border-4 border-black shadow-lg" />
               <div className="absolute -top-2 -right-2 bg-white border-2 border-black px-2 py-0.5 text-[8px] font-[1000] text-black transform -rotate-12 group-hover/ast:scale-110 transition-transform shadow-sm">"ALMOST DONE!"</div>
            </div>

            {/* Assistant Two - Blaze - Hidden on Mobile */}
            <div className="absolute top-4 -right-10 w-32 h-32 md:w-40 md:h-40 opacity-90 z-20 rotate-12 hover:scale-110 transition-all cursor-pointer group/ast2 hidden md:block">
               <img src="/assets/pets/genesis-pets/Genesis Pets (14).jpg" className="w-full h-full object-contain rounded-full border-4 border-black shadow-lg" />
               <div className="absolute -top-2 -left-4 bg-white border-2 border-black px-2 py-0.5 text-[8px] font-[1000] text-black transform rotate-12 group-hover/ast2:scale-110 transition-transform shadow-sm">"SO COOL!"</div>
            </div>

            {/* Assistant Three - Forest */}
            <div className="absolute bottom-10 -right-6 w-24 h-24 opacity-80 z-20 -rotate-6 hover:scale-110 transition-all cursor-pointer group/ast3 hidden md:block">
               <img src="/assets/pets/genesis-pets/Genesis Pets (5).jpg" className="w-full h-full object-contain rounded-full border-4 border-black shadow-lg" />
               <div className="absolute bottom-0 -left-2 bg-white border-2 border-black px-2 py-0.5 text-[8px] font-[1000] text-black transform rotate-6 group-hover/ast3:scale-110 transition-transform shadow-sm">"SCIENCE!"</div>
            </div>

            {/* Holographic Display */}
            <div className="flex flex-col items-center gap-6 w-full max-w-lg z-10">
              <div className="relative group/main">
                <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-30 animate-pulse"></div>
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-[10px] border-black flex items-center justify-center bg-white relative shadow-[8px_8px_0_rgba(0,0,0,1)] transform hover:scale-105 transition-transform duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-grid-slate-100 opacity-20"></div>
                  <span className="text-6xl md:text-8xl filter drop-shadow-[0_0_10px_rgba(0,0,0,0.2)] animate-float relative z-10">
                    {currentMasterItem?.icon || (currentMasterItem?.id?.includes('scroll') ? '🪄' : '🧪')}
                  </span>
                </div>
                {/* Badge moved outside overflow-hidden */}
                <div className="absolute -top-4 -right-4 bg-emerald-500 text-black px-4 py-1.5 font-[1000] text-[10px] md:text-xs border-[4px] border-black rotate-12 shadow-[4px_4px_0_rgba(0,0,0,1)] uppercase tracking-tighter italic z-30 group-hover/main:scale-110 transition-transform">
                  MAD SCIENCE!
                </div>
              </div>

              <div className="text-center relative">
                <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-1 drop-shadow-[6px_6px_0_rgba(79,70,229,1)]">
                  {currentMasterItem?.name}
                </h2>
                <div className="inline-flex items-center gap-2 bg-black/80 px-4 py-1 border-2 border-indigo-500 transform -rotate-1">
                   <Zap size={10} className="text-amber-400 animate-bounce" />
                   <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono">
                     Status: Positively Radioactive
                   </p>
                </div>
              </div>

              {/* Mixing Components Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full relative">
                <div className="absolute -inset-4 bg-white/5 border-2 border-dashed border-white/10 -z-10 rounded-2xl"></div>
                {selectedRecipe.materials.map(mat => {
                  const master = ITEMS.find(it => it.id === mat.id);
                  const playerHas = getMaterialCount(mat.id);
                  const isMet = playerHas >= mat.count;
                  return (
                    <div 
                      key={mat.id} 
                      onMouseEnter={() => setHoveredSourceId(mat.id)}
                      onMouseLeave={() => setHoveredSourceId(null)}
                      onClick={() => setHoveredSourceId(prev => prev === mat.id ? null : mat.id)}
                      className={`flex flex-col items-center p-3 border-[4px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] relative cursor-help transition-all transform hover:-translate-y-2 hover:rotate-2 ${isMet ? 'bg-white border-emerald-500' : 'bg-slate-900 border-red-500/50 opacity-60'}`}
                    >
                      {hoveredSourceId === mat.id && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 bg-pink-600 border-[3px] border-black p-2 z-[100] shadow-[6px_6px_0_rgba(0,0,0,1)] animate-in fade-in zoom-in-90 duration-200 transform -rotate-2">
                           <div className="flex items-center gap-1.5 mb-1">
                              <Search size={10} className="text-white" />
                              <span className="text-[7px] font-[1000] text-white uppercase tracking-tighter">WHERE IS IT?</span>
                           </div>
                           <div className="text-[8px] font-black text-black leading-tight uppercase bg-white px-1 py-0.5">{getItemSource(mat.id)}</div>
                           <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-600 border-b-[3px] border-r-[3px] border-black rotate-45"></div>
                        </div>
                      )}
                      <span className="text-2xl mb-1 filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">{master?.icon || '📦'}</span>
                      <span className="text-[7px] font-black uppercase text-slate-800 mb-1 text-center truncate w-full">{master?.name}</span>
                      <div className={`text-[12px] font-mono font-black border-2 border-black px-2 bg-black/5 ${isMet ? 'text-emerald-600' : 'text-red-500'}`}>
                        {playerHas}/{mat.count}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="w-full flex flex-col gap-4 items-center">
                <div className="flex items-center gap-6 px-10 py-4 bg-indigo-900/60 border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] transform rotate-1">
                   <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-indigo-300 uppercase italic">Synthesis Fee</span>
                      <span className="text-2xl font-[1000] text-amber-500 italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">{selectedRecipe.cost} GX</span>
                   </div>
                   <div className="w-[3px] h-10 bg-black"></div>
                   <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-indigo-300 uppercase italic">SUCCESS RATIO</span>
                      <span className="text-2xl font-[1000] text-pink-400 italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">MAXIMUM</span>
                   </div>
                </div>

                <button 
                  onClick={() => mixLaboratoryItem(selectedRecipe)}
                  disabled={player.tokens < selectedRecipe.cost || !selectedRecipe.materials.every(m => getMaterialCount(m.id) >= m.count)}
                  className="w-full max-w-sm px-10 py-6 bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-30 disabled:grayscale transition-all font-[1000] text-2xl md:text-3xl uppercase italic border-[6px] border-black shadow-[10px_10px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 group relative overflow-hidden transform -rotate-1 hover:rotate-0"
                >
                  <div className="absolute inset-0 bg-white/30 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  MATERIALIZE NOW!
                </button>
              </div>
            </div>

            {/* Tactile Dials - Hidden on Mobile */}
            <div className="absolute bottom-6 left-6 z-20 hidden md:flex gap-6">
               <div className="w-12 h-12 rounded-full border-[4px] border-black bg-indigo-600 shadow-[4px_4px_0_rgba(0,0,0,1)] relative flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                  <div className="w-1 h-6 bg-black absolute top-0 left-1/2 -translate-x-1/2"></div>
               </div>
               <div className="flex flex-col justify-center">
                  <span className="text-[8px] font-black text-indigo-400 uppercase italic">VIBRATIONAL STABILITY</span>
                  <div className="h-2 w-32 bg-black border-2 border-indigo-500 mt-1 overflow-hidden relative">
                     <div className="h-full bg-emerald-500 animate-pulse w-3/4"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Synthesis Result Modal (Comic Aesthetic) */}
      {forgeResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
           <div className={`max-w-xs w-full p-8 border-[6px] border-black shadow-[12px_12px_0_rgba(0,0,0,1)] relative animate-in zoom-in-95 duration-300 transform rotate-1 bg-emerald-500`}>
              <div className="absolute -top-6 -left-6 bg-white border-4 border-black px-4 py-1 transform -rotate-12 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <span className="text-xl font-black italic uppercase text-black tracking-tighter">SCIENCE!</span>
              </div>

              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-black flex items-center justify-center border-4 border-white shadow-[6px_6px_0_rgba(0,0,0,0.5)] transform rotate-3">
                  <span className="text-5xl">{forgeResult.item?.icon || '🧪'}</span>
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white italic uppercase leading-none tracking-tighter">
                    SYNTHESIS SUCCESS!
                  </h2>
                  <p className="text-[10px] font-black text-black/60 uppercase tracking-widest leading-tight">
                    Object Materialized: {forgeResult.item?.name}
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

    </div>
  );
});
