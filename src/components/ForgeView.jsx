import React from 'react';
import { Lock } from 'lucide-react';
import { Header } from './GameUI';

export const ForgeView = ({ CRYSTLE_RECIPES, player, forgeCrystle, setView }) => (
  <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[500px] relative">
     <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
     
    <Header title="Identity Lab: Forge" onClose={() => setView('menu')} />
    <div className="grid gap-6 relative z-10">
      {CRYSTLE_RECIPES.map((recipe, index) => {
        const hasRecipe = player.recipes?.includes(recipe.id);
        const isOwned = player.equipped?.[recipe.type]?.id === recipe.id;
        
        return (
          <div 
            key={recipe.id} 
            className={`p-5 bg-white border-[4px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] flex justify-between items-center group transition-transform hover:-translate-y-1 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${!hasRecipe ? 'opacity-40 grayscale' : ''}`}
          >
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
            
            <div className="flex flex-col items-end gap-3">
              <div className={`bg-slate-900 text-white px-3 py-1 border-2 border-black transform rotate-3 relative shadow-sm ${!hasRecipe || isOwned ? 'opacity-30' : ''}`}>
                 <span className="text-xs font-black italic">{recipe.cost} GX</span>
              </div>
              <button 
                onClick={() => forgeCrystle(recipe)} 
                disabled={!hasRecipe || isOwned} 
                className={`px-6 py-2 border-[3px] border-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${!hasRecipe ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none' : isOwned ? 'bg-emerald-500 text-white border-black' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
              >
                {!hasRecipe ? 'LOCKED' : isOwned ? 'ACTIVE' : 'FORGE'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
