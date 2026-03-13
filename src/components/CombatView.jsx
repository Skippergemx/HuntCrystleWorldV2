import React from 'react';
import { TrendingUp, Sparkles, MousePointer, Coffee, User, X, Skull } from 'lucide-react';
import { ImpactSplash } from './CombatEffects';

export const CombatView = ({ 
  enemy, depth, buffTimeLeft, isAutoActive, autoTimeLeft, player, handleHeal, activateAutoScroll, isHurt, impactSplash, isStunned, stunTimeLeft, isMissed, missTimeLeft, showDefeatedWindow, handleAttack, setView, syncPlayer, setDepth, selectedMap
}) => {
  if (!enemy) return null;

  return (
    <div className={`flex-1 p-6 flex flex-col items-center justify-between gap-4 animate-in fade-in relative overflow-hidden ${isHurt ? 'animate-damage' : ''}`}>
      {/* Halftone Overlay HUD */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f87171 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
      
      {/* --- HUD TOP --- */}
      <div className="w-full flex justify-between items-start z-10 px-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-black border-[3px] border-cyan-500 rounded-lg shadow-[3px_3px_0_rgba(0,0,0,1)]">
            <TrendingUp size={14} className="text-cyan-400" />
            <span className="text-xs font-black text-cyan-400 tracking-widest italic uppercase">Sector Node</span>
          </div>
          
          {/* Dotted Floor Progression */}
          {selectedMap && (
            <div className="flex gap-1.5 ml-1 mt-1">
              {selectedMap.availableFloors.map(f => (
                <div 
                  key={f} 
                  className={`w-2.5 h-2.5 rounded-full border-2 border-black transition-all duration-500 ${f === depth ? 'bg-cyan-400 scale-125 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : f < depth ? 'bg-black opacity-40' : 'bg-white opacity-20'}`}
                />
              ))}
            </div>
          )}
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
            {player.autoScrolls > 0 && !isAutoActive && (
              <button onClick={activateAutoScroll} className="flex items-center gap-2 bg-cyan-600 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-cyan-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
                <MousePointer size={16} className="text-black" />
                <div className="flex flex-col items-start bg-transparent">
                  <span className="text-[7px] font-black uppercase tracking-widest text-black/70 leading-none italic">Auto</span>
                  <span className="text-xs font-black leading-none text-black italic">{player.autoScrolls}</span>
                </div>
              </button>
            )}
          </div>
          {isAutoActive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-600 border-[3px] border-black text-black rounded-lg font-black text-[10px] animate-pulse shadow-[3px_3px_0_rgba(0,0,0,1)]">
              <MousePointer size={10} /> LOCK-ON: {autoTimeLeft}s
            </div>
          )}
        </div>
      </div>

      {/* --- ENEMY DISPLAY --- */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className={`w-44 h-44 bg-slate-900 flex items-center justify-center border-[6px] border-black shadow-[10px_10px_0_rgba(0,0,0,1)] overflow-hidden relative group transform -rotate-1`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#450a0a_0%,transparent_70%)] opacity-50"></div>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f87171 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
          <img
            src={`/assets/monsters/${enemy.name}.png`}
            alt={enemy.name}
            className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ghost"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>';
            }}
          />
          <ImpactSplash splash={impactSplash} />
        </div>

        <div className="text-center relative">
          <div className="bg-red-600 text-white px-6 py-1 border-[4px] border-black transform rotate-1 shadow-[5px_5px_0_rgba(0,0,0,1)] inline-block mb-2">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-tight">{enemy.name}</h2>
          </div>
          
          <div className="w-full h-4 bg-black border-[3px] border-white/20 p-0.5 relative shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden mb-2">
            <div className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.5)] relative z-10" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
            <div className="absolute inset-0 z-20 pointer-events-none opacity-50" style={{ backgroundImage: 'linear-gradient(90deg, transparent 95%, rgba(0,0,0,0.8) 95%)', backgroundSize: '5% 100%' }}></div>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            {['STR', 'AGI', 'DEX'].map((stat) => (
              <div key={stat} className="flex flex-col items-center bg-black border-2 border-slate-700 px-2 py-0.5 rounded-sm shadow-[2px_2px_0_rgba(0,0,0,1)]">
                <span className={`text-[7px] ${stat === 'STR' ? 'text-red-500' : stat === 'AGI' ? 'text-emerald-500' : 'text-yellow-500'} font-black uppercase italic`}>{stat}</span>
                <span className="text-[10px] font-black text-white italic">{enemy[stat.toLowerCase()]}</span>
              </div>
            ))}
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
        
        {/* Loot Visuals (Icons for loots obtained) */}
        <div className="flex items-center justify-center gap-3 pt-2 opacity-50 hover:opacity-100 transition-opacity">
           <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter italic">Recent Loot:</div>
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
