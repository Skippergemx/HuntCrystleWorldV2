import React from 'react';
import { Lock } from 'lucide-react';
import { Header } from './GameUI';

export const ForgeView = ({ CRYSTLE_RECIPES, player, forgeCrystle, setView, LOOTS }) => {
  const stats = Object.values(player.equipped || {}).reduce((acc, item) => {
    if (item && item.stats) {
      acc.dex += item.stats.dex || 0;
    }
    return acc;
  }, { dex: player.baseStats?.dex || 0 });

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[1000px] relative custom-scrollbar">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      
      <Header title="Identity Lab: Forge" onClose={() => setView('menu')} />
      
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
          const isOwned = player.equipped?.[recipe.type]?.id === recipe.id;
          
          // Calculate success rate: base 50% + dex/2, cap at 95%
          const successRate = Math.min(95, 50 + Math.floor(stats.dex / 2));
          
          // Check materials
          const materials = recipe.materials || [];
          const hasMaterials = materials.every(mat => {
            const countInInv = player.inventory?.filter(i => i.id === mat.id).length || 0;
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
                    {hasRecipe ? <span className="text-3xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">{recipe.img}</span> : <Lock size={24} className="text-black/40" />}
                  </div>
                  <div className="space-y-1 text-left">
                    <h4 className="font-black text-xl text-black uppercase tracking-tighter italic leading-none">
                      {hasRecipe ? recipe.name : 'Unknown Schematic'}
                    </h4>
                    <div className="bg-amber-100/50 px-2 py-0.5 border border-black/10 inline-block">
                      <div className="flex gap-2 text-[9px] font-black uppercase text-amber-900/60 italic">
                        {Object.entries(recipe.stats).map(([k, v]) => <span key={k}>{k}+{v}</span>)}
                      </div>
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

              {/* Material Requirements */}
              {hasRecipe && (
                <div className="bg-slate-50 border-2 border-black/5 p-3 rounded flex flex-wrap gap-2">
                  {materials.map(mat => {
                    const loot = LOOTS.find(l => l.id === mat.id);
                    const countInInv = player.inventory?.filter(i => i.id === mat.id).length || 0;
                    const isMet = countInInv >= mat.count;
                    return (
                      <div key={mat.id} className={`flex items-center gap-2 px-2 py-1 border-2 rounded shrink-0 ${isMet ? 'bg-emerald-50 border-emerald-500/30' : 'bg-red-50 border-red-500/30'}`}>
                        <span className="text-lg">{loot?.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase text-slate-500 leading-none">{loot?.name}</span>
                          <span className={`text-[10px] font-black ${isMet ? 'text-emerald-700' : 'text-red-700'}`}>{countInInv} / {mat.count}</span>
                        </div>
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
    </div>
  );
};

