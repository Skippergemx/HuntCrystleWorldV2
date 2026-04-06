import React from 'react';
import { TrendingUp, X, Skull, Shield, Swords, Target, Crosshair, Zap } from 'lucide-react';
import { ImpactSplash } from './CombatEffects';
import { ConfirmationModal } from './GameUI';
import { useGame } from '../contexts/GameContext';
import { useNagaCombat } from '../hooks/useNagaCombat';

export const NagaCombatView = React.memo(() => {
  const { player, addLog, audio, SOUNDS, db, adventure } = useGame();
  const { setView, gvgContext } = adventure;

  const nagaCombat = useNagaCombat(
    db,
    player,
    gvgContext,
    addLog,
    audio.playSFX,
    SOUNDS,
    setView,
    audio.triggerHaptic
  );

  const {
    combatState, myNaga, enemyNaga, critAlert, missTimeLeft,
    impactSplash, playerImpactSplash, strikingSide, currentTaunt, playerTaunt,
    showDefeatedWindow, showVictoryWindow, handleAttack, handleRetreat
  } = nagaCombat;

  const [showRetreatConfirm, setShowRetreatConfirm] = React.useState(false);

  if (combatState === 'LOADING' || !myNaga || !enemyNaga) {
     return <div className="flex-1 flex items-center justify-center bg-slate-950 font-black text-white italic uppercase animate-pulse">Initializing Holo-Combat Grid...</div>;
  }

  const isMissed = missTimeLeft > 0;

  return (
    <div className={`flex-1 p-4 flex flex-col items-center justify-between gap-2 animate-in fade-in relative overflow-hidden bg-red-950/40`}>
      <div className="absolute inset-0 z-0 select-none">
        <img src="/assets/dungeonsground/PyroGroundBackdrop.jpg" className="w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/90"></div>
      </div>
      <div className="absolute inset-0 opacity-20 pointer-events-none z-20 comic-halftone text-red-500"></div>

      {/* --- HUD TOP --- */}
      <div className="w-full flex justify-between items-start z-30 px-2 md:px-6 pt-2 md:pt-4">
        <div className="flex items-center gap-1 md:gap-3">
          <div className="flex items-center gap-2 px-3 md:px-6 py-2 md:py-4 bg-black border-[4px] border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] rounded text-red-400 transform -rotate-1">
            <Swords size={20} className="animate-pulse" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-black uppercase text-red-600/70">Guild Vs Guild</span>
              <span className="text-xl font-black tracking-widest italic uppercase">NAGA WAR</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowRetreatConfirm(true)}
          className="p-3 bg-red-600 border-[4px] border-black text-white shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none transform -rotate-2"
          title="Flee Battle"
        >
          <X size={20} strokeWidth={4} />
        </button>
      </div>

      {/* --- BATTLE ARENA --- */}
      <div className="w-full flex-1 relative z-40 flex flex-col lg:grid lg:grid-cols-2 gap-2 lg:gap-8 items-center px-2 md:px-12 py-1 md:py-4">
        
        <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
          <div className="w-24 h-24 bg-red-600 border-[8px] border-black rounded-full shadow-[10px_10px_0_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-12 animate-kapow">
            <span className="text-white font-black text-4xl italic tracking-tighter drop-shadow-[2px_2px_0_#000]">VS</span>
          </div>
        </div>

        {/* ENEMY NAGA (LEFT) */}
        <div className={`flex flex-col items-center lg:items-end gap-1.5 md:gap-6 transition-all duration-300 ${strikingSide === 'monster' ? 'animate-strike-right' : ''}`}>
          <div className="relative">
            {currentTaunt && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-[100] animate-in zoom-in slide-in-from-bottom-6 duration-300">
                <div className="relative bg-black border-[4px] border-red-500 px-4 py-2 md:px-6 md:py-4 rounded-full shadow-[6px_6px_0_rgba(0,0,0,1)] min-w-[120px] max-w-[240px]">
                  <p className="text-[12px] font-black uppercase text-white italic text-center tracking-tight">{currentTaunt}</p>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-black border-r-[4px] border-b-[4px] border-red-500 rotate-45 transform"></div>
                </div>
              </div>
            )}

            <div className={`w-40 h-40 md:w-64 md:h-64 bg-black border-[6px] border-red-600 shadow-[10px_10px_0_rgba(220,38,38,0.5)] overflow-hidden relative transform -rotate-2 ${impactSplash ? 'animate-flinch' : 'animate-float'}`}>
              <img src={`/assets/dragonsground/gemx/${enemyNaga.gemxAvatar}`} className="w-full h-full object-cover" alt="Enemy Naga" />
              {enemyNaga.currentHp <= 0 && <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center backdrop-blur-sm"><Skull size={64} className="text-red-500" /></div>}
              <ImpactSplash splash={impactSplash} />
            </div>

            {showVictoryWindow && (
              <div className="absolute inset-0 z-50 flex items-center justify-center animate-kapow">
                 <div className="bg-yellow-400 border-[6px] border-black px-10 py-6 transform -rotate-6 shadow-[10px_10px_0_rgba(0,0,0,1)]">
                   <p className="text-black font-black text-5xl uppercase italic drop-shadow-[2px_2px_0_#fff]">DECIMATED</p>
                 </div>
              </div>
            )}
          </div>

          <div className="w-full max-w-[320px] space-y-4">
            <div className="flex flex-col gap-2 relative">
              <div className="bg-red-950 text-white px-5 py-2 border-[4px] border-red-600 transform rotate-1 flex flex-col">
                <span className="text-[8px] font-black uppercase opacity-70 tracking-widest italic mb-0.5">Rival Vanguard</span>
                <h2 className="text-xl font-black uppercase truncate">{enemyNaga.name} [Lvl {enemyNaga.stats.level}]</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-black/80 border-4 border-red-900 p-2 transform -rotate-1">
                <div className="flex flex-col items-center border-r border-white/10 text-red-500"><Swords size={12}/><span className="text-xs font-black italic">{enemyNaga.stats.str}</span></div>
                <div className="flex flex-col items-center border-r border-white/10 text-amber-500"><Zap size={12}/><span className="text-xs font-black italic">{enemyNaga.stats.agi}</span></div>
                <div className="flex flex-col items-center text-cyan-500"><Crosshair size={12}/><span className="text-xs font-black italic">{enemyNaga.stats.dex}</span></div>
              </div>
            </div>

            <div className="w-full group bg-black p-2 border-[4px] border-red-900 shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1"><Shield size={10}/> ARMOR CORE</span>
                <span className="text-[10px] font-black text-white">{Math.max(0, enemyNaga.currentHp)}/{enemyNaga.stats.totalMaxHp}</span>
              </div>
              <div className="h-6 bg-slate-900 overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300" style={{ width: `${Math.max(0, (enemyNaga.currentHp / enemyNaga.stats.totalMaxHp) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* PLAYER NAGA (RIGHT) */}
        <div className={`flex flex-col items-center md:items-start gap-1.5 md:gap-6 transition-all duration-300 ${strikingSide === 'player' ? 'animate-strike-left' : ''}`}>
          <div className="relative">
            {playerTaunt && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-[60] animate-in zoom-in slide-in-from-bottom-6 duration-300">
                <div className="relative bg-cyan-600 border-[4px] border-black px-4 py-2 md:px-6 md:py-4 rounded-full shadow-[6px_6px_0_rgba(0,0,0,1)] min-w-[120px] max-w-[240px]">
                  <p className="text-[12px] font-black uppercase text-black italic text-center tracking-tight">{playerTaunt}</p>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-600 border-r-[4px] border-b-[4px] border-black rotate-45 transform"></div>
                </div>
              </div>
            )}

            <div className={`w-40 h-40 md:w-64 md:h-64 bg-black border-[6px] border-cyan-500 shadow-[10px_10px_0_rgba(6,182,212,0.5)] overflow-hidden relative transform rotate-2 ${playerImpactSplash ? 'animate-flinch' : 'animate-float'}`}>
              <img src={`/assets/dragonsground/gemx/${myNaga.gemxAvatar}`} className="w-full h-full object-cover" alt="My Naga" />
              {myNaga.currentHp <= 0 && <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center backdrop-blur-sm"><Skull size={64} className="text-red-500" /></div>}
              <ImpactSplash splash={playerImpactSplash} />
            </div>
            
            {showDefeatedWindow && (
              <div className="absolute inset-0 z-50 flex items-center justify-center animate-kapow">
                 <div className="bg-red-600 border-[6px] border-black px-10 py-6 transform rotate-6 shadow-[10px_10px_0_rgba(0,0,0,1)]">
                   <p className="text-black font-black text-5xl uppercase italic drop-shadow-[2px_2px_0_#fff]">DEFEATED</p>
                 </div>
              </div>
            )}
          </div>

          <div className="w-full max-w-[320px] space-y-4">
            <div className="flex flex-col gap-2 relative">
              <div className="bg-cyan-900 text-white px-5 py-2 border-[4px] border-cyan-500 transform -rotate-1 flex flex-col items-end">
                <span className="text-[8px] font-black uppercase opacity-70 tracking-widest italic mb-0.5">Your Vanguard</span>
                <h2 className="text-xl font-black uppercase truncate">[Lvl {myNaga.stats.level}] {myNaga.name}</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-black/80 border-4 border-cyan-900 p-2 transform rotate-1">
                <div className="flex flex-col items-center border-r border-white/10 text-red-500"><Swords size={12}/><span className="text-xs font-black italic">{myNaga.stats.str}</span></div>
                <div className="flex flex-col items-center border-r border-white/10 text-amber-500"><Zap size={12}/><span className="text-xs font-black italic">{myNaga.stats.agi}</span></div>
                <div className="flex flex-col items-center text-cyan-500"><Crosshair size={12}/><span className="text-xs font-black italic">{myNaga.stats.dex}</span></div>
              </div>
            </div>

            <div className="w-full group bg-black p-2 border-[4px] border-cyan-900 shadow-[-6px_6px_0_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-1 flex-row-reverse">
                <span className="text-[10px] font-black text-cyan-500 uppercase flex items-center gap-1"><Shield size={10}/> BIOLOGICAL CORE</span>
                <span className="text-[10px] font-black text-white">{Math.max(0, myNaga.currentHp)}/{myNaga.stats.totalMaxHp}</span>
              </div>
              <div className="h-6 bg-slate-900 overflow-hidden relative">
                <div className="h-full bg-gradient-to-l from-cyan-800 to-cyan-500 transition-all duration-300 ml-auto" style={{ width: `${Math.max(0, (myNaga.currentHp / myNaga.stats.totalMaxHp) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- HUD BOTTOM --- */}
      <div className="w-full max-w-2xl px-4 mb-6 z-50">
         <button
            onClick={handleAttack}
            disabled={isMissed || showDefeatedWindow || showVictoryWindow || combatState !== 'IDLE'}
            className={`w-full py-6 rounded border-[5px] border-black font-black text-3xl md:text-5xl shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none italic flex flex-col items-center justify-center leading-none ${isMissed || combatState !== 'IDLE' ? 'bg-slate-700 text-white/50 grayscale' : 'bg-red-600 text-black hover:-translate-y-1 hover:text-white'} group overflow-hidden relative`}
         >
            <div className="absolute inset-0 comic-halftone opacity-30 text-black pointer-events-none group-hover:scale-125 transition-transform"></div>
            {isMissed ? <span className="relative z-10 tracking-tighter">DEFLECTED</span> : <span className="relative z-10 tracking-tighter drop-shadow-[2px_2px_0_rgba(255,255,255,0.3)]">DRACONIC STRIKE!</span>}
            <span className="text-[10px] mt-2 opacity-70 tracking-[0.4em] uppercase relative z-10 font-black text-white/80">Execute Raid Protocol</span>
         </button>
      </div>

      <ConfirmationModal 
        isOpen={showRetreatConfirm}
        onClose={() => setShowRetreatConfirm(false)}
        onConfirm={handleRetreat}
        title="ABANDON RAID?"
        message="Retreating will take you back to the War Hub. Your Naga's health will not reset."
        confirmText="RETREAT"
        cancelText="KEEP FIGHTING"
      />
    </div>
  );
});
