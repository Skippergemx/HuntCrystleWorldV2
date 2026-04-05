import React from 'react';
import { Lock, Check } from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const ForgeView = React.memo(() => {
  const { player, CRYSTLE_RECIPES, actions, adventure, LOOTS, openGuide, ITEMS, totalStats, forgeResult, setForgeResult } = useGame();
  const { setView } = adventure;
  const { forgeCrystle } = actions;

  const getMasterData = (id) => ITEMS.find(i => i.id === id);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[1000px] relative custom-scrollbar">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      
      <Header title="Identity Lab: Forge" onClose={adventure.goBack}        onHelp={() => openGuide('forge')} 
/>
      
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
            const countInInv = player.inventory?.filter(i => {
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
                    const countInInv = player.inventory?.filter(i => {
                      const cleanId = i.id?.replace(/(_\d+)+$/, '');
                      const master = ITEMS.find(item => item.id === cleanId || item.name?.toLowerCase() === i.name?.toLowerCase());
                      return (cleanId === mat.id) || (master?.id === mat.id);
                    }).length || 0;
                    const isMet = countInInv >= mat.count;
                    return (
                      <div key={mat.id} className={`group/mat relative p-2 border-2 shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all ${mIdx % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${isMet ? 'bg-white border-black' : 'bg-red-50 border-red-500/40 opacity-70'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-sm bg-black/5 flex items-center justify-center border-b-2 border-black/10`}>
                            <span className="text-xl filter drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">{loot?.icon}</span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[7px] font-black uppercase text-slate-400 truncate leading-none mb-1">{loot?.name}</span>
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
});
