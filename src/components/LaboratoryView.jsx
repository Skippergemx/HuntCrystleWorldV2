import React, { useState, useMemo } from 'react';
import { FlaskConical, Zap, Beaker, Pipette, Thermometer, ShieldCheck, ArrowLeft, Info, HelpCircle, Activity, ShoppingBag, Gem, Clock } from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const LaboratoryView = React.memo(() => {
  const { 
    player, adventure, actions, LAB_RECIPES, ITEMS, addLog, openGuide, forgeResult, setForgeResult 
  } = useGame();
  
  const { setView } = adventure;
  const { mixLaboratoryItem } = actions;
  
  const [selectedRecipe, setSelectedRecipe] = useState(LAB_RECIPES[0]);

  const materials = useMemo(() => {
    return player.inventory || [];
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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Laboratory Background - Industrial/Chemical Tech */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#065f46_0%,transparent_70%)] opacity-30"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(16,185,129,0.03) 40px, rgba(16,185,129,0.03) 80px)' }}></div>
      </div>

      <div className="p-4 z-10">
        <Header 
          title="Xenon Laboratory" 
          onClose={() => setView('menu')} 
          onHelp={() => openGuide('laboratory')} 
        />
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 p-4 overflow-hidden z-10">
        {/* Formula list (Left) */}
        <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Beaker size={16} className="text-emerald-400" />
            <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest italic">Research Database</h3>
          </div>
          
          {LAB_RECIPES.map(recipe => {
            const item = ITEMS.find(it => it.id === recipe.id);
            const isSelected = selectedRecipe.id === recipe.id;
            return (
              <button 
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className={`flex items-center gap-4 p-3 border-2 transition-all group ${
                  isSelected ? 'bg-emerald-950 border-emerald-500 shadow-[4px_4px_0_rgba(16,185,129,1)] scale-[1.02]' : 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/30'
                }`}
              >
                <div className={`w-12 h-12 flex items-center justify-center text-2xl border-2 border-black bg-slate-950 shadow-[2px_2px_0_rgba(0,0,0,1)] ${isSelected ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-300'}`}>
                  {item?.id?.includes('scroll') ? '🪄' : '🧪'}
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <h4 className={`text-[11px] font-black uppercase italic truncate ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>{item?.name}</h4>
                  <span className={`text-[7px] font-bold uppercase tracking-widest ${isSelected ? 'text-emerald-500' : 'text-slate-600'}`}>
                    {item?.id?.includes('scroll') ? 'Automation Logic' : 'Alchemical Mixture'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Synthesizer (Center/Right) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-slate-900 border-[5px] border-black p-4 md:p-8 flex-1 flex flex-col items-center justify-center relative shadow-[10px_10px_0_rgba(0,0,0,1)] overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            {/* Holographic Display */}
            <div className="flex flex-col items-center gap-8 w-full max-w-lg z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse"></div>
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-[8px] border-black flex items-center justify-center bg-slate-950 relative shadow-2xl transform hover:rotate-6 transition-transform">
                  <span className="text-6xl md:text-8xl filter drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    {currentMasterItem?.id?.includes('scroll') ? '🪄' : '🧪'}
                  </span>
                  <div className="absolute -top-4 -right-4 bg-emerald-500 text-black px-3 py-1 font-black text-xs border-4 border-black rotate-12">
                    STABLE
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-2 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  {currentMasterItem?.name}
                </h2>
                <p className="text-[10px] md:text-xs font-bold text-emerald-500 uppercase tracking-[0.3em] font-mono">
                  Synthesizing... Sequence Ready.
                </p>
              </div>

              {/* Mixing Components Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {selectedRecipe.materials.map(mat => {
                  const master = ITEMS.find(it => it.id === mat.id);
                  const playerHas = getMaterialCount(mat.id);
                  const isMet = playerHas >= mat.count;
                  return (
                    <div key={mat.id} className={`flex flex-col items-center p-3 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] ${isMet ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-red-950/20 border-red-900/40 opacity-60'}`}>
                      <span className="text-2xl mb-1">{master?.icon || '📦'}</span>
                      <span className="text-[7px] font-black uppercase text-slate-400 mb-1 text-center truncate w-full">{master?.name}</span>
                      <div className={`text-[10px] font-mono font-black ${isMet ? 'text-emerald-400' : 'text-red-400'}`}>
                        {playerHas}/{mat.count}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <div className="w-full flex flex-col gap-4 items-center">
                <div className="flex items-center gap-6 px-8 py-3 bg-black/40 border-2 border-slate-800 rounded-full backdrop-blur-md">
                   <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase italic">Power Charge</span>
                      <span className="text-xl font-black text-amber-500 italic">{selectedRecipe.cost} GX</span>
                   </div>
                   <div className="w-[2px] h-8 bg-slate-800"></div>
                   <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase italic">SUCCESS REQ</span>
                      <span className="text-xl font-black text-emerald-400 italic">100%</span>
                   </div>
                </div>

                <button 
                  onClick={() => mixLaboratoryItem(selectedRecipe)}
                  disabled={player.tokens < selectedRecipe.cost || !selectedRecipe.materials.every(m => getMaterialCount(m.id) >= m.count)}
                  className="w-full max-w-sm px-10 py-5 bg-emerald-600 text-black hover:bg-emerald-400 disabled:opacity-30 disabled:grayscale transition-all font-black text-2xl uppercase italic border-[6px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  SYNTHESIZE OBJECT
                </button>
              </div>
            </div>

            {/* Tactical Scanners */}
            <div className="absolute bottom-4 left-4 z-20 flex gap-4 opacity-50">
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-emerald-500 uppercase">Temp. Normal</span>
                  <div className="flex gap-0.5 mt-1">
                     {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-3 bg-emerald-500/40"></div>)}
                  </div>
               </div>
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-emerald-500 uppercase">Pressure Stable</span>
                  <Activity size={12} className="text-emerald-500 mt-1" />
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
                <span className="text-xl font-black italic uppercase italic tracking-tighter">SCIENCE!</span>
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
