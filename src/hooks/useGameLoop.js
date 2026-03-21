import { useState, useEffect, useRef } from 'react';

export const useGameLoop = ({
  player,
  view,
  syncPlayer,
  addLog,
  combat,
  actions,
  showDefeatedWindow
}) => {
  const [autoTimeLeft, setAutoTimeLeft] = useState(0);
  const [buffTimeLeft, setBuffTimeLeft] = useState(0);
  const [dragonTimeLeft, setDragonTimeLeft] = useState(0);
  const [penaltyRemaining, setPenaltyRemaining] = useState(0);

  const playerRef = useRef(null);
  const combatTimerRef = useRef(null);
  const actionsRef = useRef(actions);
  const combatRef = useRef(combat);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    combatRef.current = combat;
  }, [combat]);

  // --- Main Pulse (Stat Ticks & Debuffs) ---
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Tick down combat debuffs
      const c = combatRef.current;
      if (c) {
        c.setStunTimeLeft(prev => Math.max(0, prev - 0.2));
        c.setMissTimeLeft(prev => Math.max(0, prev - 0.2));
      }


      const p = playerRef.current;
      if (!p) return;

      const now = Date.now();

      // 2. Sync timed states from player record
      const newAutoTime = p.autoUntil && p.autoUntil > now ? Math.ceil((p.autoUntil - now) / 1000) : 0;
      const newBuffTime = p.buffUntil && p.buffUntil > now ? Math.ceil((p.buffUntil - now) / 1000) : 0;
      const newPenaltyTime = p.penaltyUntil && p.penaltyUntil > now ? Math.ceil((p.penaltyUntil - now) / 1000) : 0;
      const newDragonTime = p.dragon?.summonUntil && p.dragon.summonUntil > now ? Math.ceil((p.dragon.summonUntil - now) / 1000) : 0;

      if (newAutoTime !== autoTimeLeft) setAutoTimeLeft(newAutoTime);
      if (newBuffTime !== buffTimeLeft) setBuffTimeLeft(newBuffTime);
      if (newPenaltyTime !== penaltyRemaining) setPenaltyRemaining(newPenaltyTime);
      if (newDragonTime !== dragonTimeLeft) setDragonTimeLeft(newDragonTime);

      // 3. Combat Heartbeat / Safety Reset
      const { combatState, setCombatState } = combatRef.current;
      if (combatState !== 'IDLE' && combatState !== 'DEFEATED') {
        if (!combatTimerRef.current) combatTimerRef.current = now;
        if (now - combatTimerRef.current > 4000) {
          setCombatState('IDLE');
          combatTimerRef.current = null;
          console.log("Combat Engine: Safety reset triggered for stuck action lock.");
        }
      } else {
        combatTimerRef.current = null;
      }

    }, 200);

    return () => clearInterval(interval);
  }, [view, autoTimeLeft, buffTimeLeft, penaltyRemaining, dragonTimeLeft]);

  // --- Combat Auto-Loop ---
  const isCombatActive = autoTimeLeft > 0;
  useEffect(() => {
    let autoLoop;
    if ((view === 'dungeon' || view === 'boss') && isCombatActive && !showDefeatedWindow) {
      autoLoop = setInterval(() => {
        const p = playerRef.current;
        if (!p || p.autoMode !== view) return;
        
        const isBossView = view === 'boss';
        const c = combatRef.current;
        const a = actionsRef.current;
        
        // Critical Sync: Ensure we have an enemy and aren't stunned/busy
        if ((isBossView || c.enemyRef.current) && c.stunRef.current <= 0 && c.missRef.current <= 0 && c.processingRef.current === 'IDLE') {
          if (p.hp < (p.maxHp * 0.4) && (p.potions || 0) > 0) {
            a.handleHeal();
          } else {
            c.handleAttack(isBossView);
          }
        }
      }, 1100);
    }
    return () => clearInterval(autoLoop);
  }, [view, isCombatActive, showDefeatedWindow]);



  return {
    autoTimeLeft,
    buffTimeLeft,
    dragonTimeLeft,
    penaltyRemaining
  };
};
