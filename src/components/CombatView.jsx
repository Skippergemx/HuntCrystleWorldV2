import React from 'react';
import { TrendingUp, Sparkles, MousePointer, Coffee, User, X, Skull, Lock, Activity } from 'lucide-react';
import { ImpactSplash } from './CombatEffects';

export const CombatView = ({ 
  enemy, depth, buffTimeLeft, isAutoActive, autoTimeLeft, player, handleHeal, activateAutoScroll, isHurt, impactSplash, isStunned, stunTimeLeft, isMissed, missTimeLeft, showDefeatedWindow, handleAttack, setView, syncPlayer, setDepth, selectedMap,
  autoUseScroll, setAutoUseScroll, killsInFloor, LOOTS
}) => {
  if (!enemy) return null;

  const possibleDrops = selectedMap?.lootTable ? selectedMap.lootTable.slice(0, 10).map(id => LOOTS.find(l => l.id === id)).filter(Boolean) : [];

  return (
    <div className={`flex-1 p-6 flex flex-col items-center justify-between gap-4 animate-in fade-in relative overflow-hidden ${isHurt ? 'animate-damage' : ''}`}>
      {/* Halftone Overlay HUD */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f87171 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
      
      {/* --- HUD TOP --- */}
      <div className="w-full flex justify-between items-start z-10 px-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-black border-[3px] border-cyan-500 rounded-lg shadow-[3px_3px_0_rgba(0,0,0,1)]">
            <TrendingUp size={14} className="text-cyan-400" />
            <span className="text-xs font-black text-cyan-400 tracking-widest italic uppercase">Floor {depth}</span>
          </div>
          
          {/* 10-Kill Progression Nodes */}
          <div className="flex flex-col gap-1">
            <span className="text-[7px] font-black text-slate-400 uppercase italic">Floor Evolution: {killsInFloor}/10</span>
            <div className="flex gap-1">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2.5 h-1.5 border-2 border-black transition-all duration-300 ${i < killsInFloor ? 'bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.6)]' : 'bg-slate-800'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button onClick={handleHeal} disabled={player.potions <= 0} className="flex items-center gap-2 bg-red-600 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-red-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 group">
              <Coffee size={16} className="text-white group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-start bg-transparent">
                <span className="text-[7px] font-black uppercase tracking-widest text-white/70 leading-none italic">Heal</span>
                <span className="text-xs font-black leading-none text-white italic">{player.potions || 0}</span>
              </div>
            </button>
            <div className="flex flex-col gap-1">
                {player.autoScrolls > 0 && !isAutoActive && (
                <button onClick={activateAutoScroll} className="flex items-center gap-2 bg-cyan-600 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-cyan-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
                    <MousePointer size={16} className="text-black" />
                    <div className="flex flex-col items-start bg-transparent">
                    <span className="text-[7px] font-black uppercase tracking-widest text-black/70 leading-none italic">Auto</span>
                    <span className="text-xs font-black leading-none text-black italic">{player.autoScrolls}</span>
                    </div>
                </button>
                )}
                <button 
                  onClick={() => setAutoUseScroll(!autoUseScroll)}
                  className={`flex items-center gap-1.5 px-2 py-1 border-2 border-black rounded-lg text-[8px] font-black italic uppercase transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 ${autoUseScroll ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}
                >
                  <Lock size={10} /> {autoUseScroll ? 'AUTO-USE ON' : 'AUTO-USE OFF'}
                </button>
            </div>
          </div>
          {isAutoActive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-600 border-[3px] border-black text-black rounded-lg font-black text-[10px] animate-pulse shadow-[3px_3px_0_rgba(0,0,0,1)]">
              <MousePointer size={10} /> LOCK-ON: {autoTimeLeft}s
            </div>
          )}
        </div>
      </div>

      {/* --- MONSTER DATA CENTER --- */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full max-w-2xl px-4">
        
        {/* Left: Monster Avatar & Health */}
        <div className="flex flex-col items-center gap-4">
            <div className={`w-40 h-40 bg-slate-900 flex items-center justify-center border-[6px] border-black shadow-[10px_10px_0_rgba(0,0,0,1)] overflow-hidden relative group transform -rotate-1`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#450a0a_0%,transparent_70%)] opacity-50"></div>
                <img
                    src={`/assets/monsters/${enemy.name}.png`}
                    alt={enemy.name}
                    className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ghost"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>';
                    }}
                />
                <ImpactSplash splash={impactSplash} />
            </div>

            <div className="w-full text-center">
                <div className="bg-red-600 text-white px-4 py-1 border-[4px] border-black transform rotate-1 shadow-[4px_4px_0_rgba(0,0,0,1)] inline-block mb-2">
                    <h2 className="text-xl font-black uppercase tracking-tighter italic leading-tight">{enemy.name}</h2>
                </div>
                
                <div className="w-full h-4 bg-black border-[3px] border-white/20 p-0.5 relative shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden">
                    <div className="h-full bg-red-600 transition-all duration-300 relative z-10" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                </div>
            </div>
        </div>

        {/* Right: Technical Stats & Intelligence */}
        <div className="flex-1 w-full bg-slate-900/80 backdrop-blur-sm border-[4px] border-black p-4 rounded-3xl shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-3 border-b-2 border-slate-800 pb-2">
                <Activity size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase italic tracking-widest">Monster Intelligence</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <p className="text-[8px] font-black text-slate-500 uppercase italic">Combat Ratings</p>
                    <div className="flex gap-2">
                        {['STR', 'AGI', 'DEX'].map((stat) => (
                        <div key={stat} className="flex flex-col items-center flex-1 bg-black border border-white/10 p-1 rounded">
                            <span className={`text-[6px] ${stat === 'STR' ? 'text-red-500' : stat === 'AGI' ? 'text-emerald-500' : 'text-yellow-500'} font-black italic`}>{stat}</span>
                            <span className="text-[10px] font-black text-white">{enemy[stat.toLowerCase()]}</span>
                        </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[8px] font-black text-emerald-500 uppercase italic">Yield Projection</p>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center bg-black/40 px-2 py-0.5 rounded border border-white/5">
                            <span className="text-[7px] font-black text-white/50 uppercase">GX Crystal</span>
                            <span className="text-[9px] font-black text-amber-500 italic">+{enemy.loot}</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/40 px-2 py-0.5 rounded border border-white/5">
                            <span className="text-[7px] font-black text-white/50 uppercase">Exp Signal</span>
                            <span className="text-[9px] font-black text-cyan-400 italic">+{enemy.xp}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                    <p className="text-[8px] font-black text-slate-500 uppercase italic">Possible Rewards</p>
                    <span className="text-[7px] font-black text-amber-600 italic uppercase">Scanner Active</span>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                    {possibleDrops.map((loot, idx) => (
                        <div key={idx} className="w-6 h-6 rounded bg-black/60 border border-white/10 flex items-center justify-center text-[12px] opacity-70 hover:opacity-100 hover:scale-110 transition-all cursor-help" title={loot.name}>
                            {loot.icon}
                        </div>
                    ))}
                    {possibleDrops.length === 0 && <span className="text-[7px] text-slate-700 italic">No drops detected</span>}
                </div>
            </div>
        </div>
      </div>

      {/* --- HUD BOTTOM: PLAYER STATUS --- */}
      <div className="w-full max-w-sm space-y-4 z-10">
        
        {/* Player Health HUD */}
        <div className="space-y-1">
          <div className="flex justify-between items-end px-1">
            <div className="flex items-center gap-1">
               <User size={12} className="text-cyan-400" />
               <span className="text-[10px] font-black text-white uppercase italic tracking-widest">{player.name} [LVL {player.level}]</span>
            </div>
            <span className="text-[10px] font-black text-white italic">{player.hp} / {player.maxHp} HP</span>
          </div>
          <div className="h-6 bg-black border-[3px] border-cyan-900/50 p-1 relative shadow-[5px_5px_0_rgba(0,0,0,1)] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.4)] relative z-10" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
            <div className="absolute inset-0 bg-cyan-400/5 animate-pulse z-20 pointer-events-none"></div>
          </div>
        </div>

        {/* Combat Controls & Status */}
        <div className="flex gap-4 relative">
          {isStunned && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm border-2 border-red-600 z-30 flex items-center justify-center shadow-lg transform scale-105">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 shrink-0 bg-slate-800 rounded-full border-2 border-red-500 flex items-center justify-center shadow-inner transform -rotate-6">
                  <Skull size={32} className="text-red-500" />
                </div>
                <div className="flex-1 max-w-[150px] bg-red-600 text-white p-2 rounded-2xl rounded-bl-sm relative shadow-md border-2 border-black transform rotate-1">
                  <p className="font-black text-xs uppercase text-center w-full italic">Stunned!</p>
                </div>
                <div className="w-12 h-12 shrink-0 bg-red-900 border-[3px] border-black rounded-full flex flex-col items-center justify-center shadow-lg transform rotate-6 mr-1">
                  <span className="text-lg font-black text-white leading-none">{Math.ceil(stunTimeLeft)}</span>
                </div>
              </div>
            </div>
          )}

          {isMissed && !isStunned && (
            <div className="absolute inset-0 bg-slate-400/80 backdrop-blur-sm border-2 border-black z-30 flex items-center justify-center shadow-lg transform scale-105">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 shrink-0 bg-slate-800 rounded-full border-2 border-slate-500 flex items-center justify-center shadow-inner transform rotate-6">
                  <User size={24} className="text-slate-400 opacity-50 absolute" />
                  <X size={32} className="text-white relative z-10" />
                </div>
                <div className="flex-1 max-w-[150px] bg-slate-300 text-black p-2 rounded-2xl rounded-bl-sm relative shadow-md border-2 border-black transform -rotate-1">
                  <p className="font-black text-xs uppercase text-center w-full">Missed Target!</p>
                </div>
                <div className="w-12 h-12 shrink-0 bg-slate-600 border-[3px] border-black rounded-full flex flex-col items-center justify-center shadow-lg transform -rotate-6 mr-1">
                  <span className="text-lg font-black text-white leading-none">{missTimeLeft.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={() => handleAttack()} 
            disabled={isStunned || isMissed || showDefeatedWindow} 
            className={`flex-1 py-4 rounded-xl font-black text-xl shadow-[6px_6px_0_rgba(0,0,0,1)] border-[4px] border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(0,0,0,1)] italic flex flex-col items-center justify-center gap-0 leading-tight ${(isStunned || isMissed) ? 'opacity-0 pointer-events-none' : 'bg-red-600 text-white'} ${isAutoActive && !(isStunned || isMissed) ? 'animate-pulse' : ''}`}
          >
            <span>{isAutoActive ? 'ACTIVE' : 'STRIKE'}</span>
            <span className="text-[8px] opacity-70 tracking-widest">{isAutoActive ? 'AUTO-PROTOCOL' : 'MANUAL COMMAND'}</span>
          </button>
          
          <button 
            onClick={() => { setView('menu'); setDepth(1); if (player.autoUntil > 0) syncPlayer({ autoUntil: 0 }); }} 
            disabled={isStunned || isMissed} 
            className={`px-6 py-4 rounded-xl font-black uppercase tracking-widest border-[4px] border-black transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic ${(isStunned || isMissed) ? 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : 'bg-slate-300 text-black hover:bg-white'}`}
          >
            EXIT
          </button>
        </div>
        
        {/* Loot Visuals */}
        <div className="flex items-center justify-center gap-3 pt-2 opacity-50 hover:opacity-100 transition-opacity">
           <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter italic">Recent Session Drops:</div>
           <div className="flex gap-2">
              {(player.inventory || []).slice(-4).reverse().map((item, i) => (
                <div key={i} className="text-xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500" title={item.name}>
                   {item.icon}
                </div>
              ))}
              {(player.inventory || []).length === 0 && <span className="text-[8px] text-slate-700 font-black italic uppercase">Scan Empty</span>}
           </div>
        </div>
      </div>
    </div>
  );
};
