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

      // 3. COMBAT HEARTBEAT / SAFETY RESET (Bulletproof V3)
      if (c && c.combatState !== 'IDLE' && c.combatState !== 'DEFEATED' && c.combatState !== 'VICTORY') {
        if (!combatTimerRef.current) combatTimerRef.current = now;
        if (now - combatTimerRef.current > 4000) {
          c.setCombatState('IDLE');
          if (c.combatBusRef) c.combatBusRef.current = false; // RELEASE MASTER GATE ON RESET
          combatTimerRef.current = null;
          console.warn(`System V3: Combat Stuck in ${c.combatState}. Triggering Emergency Gate Clearance.`);
          if (addLog) addLog("🛡️ System: Combat Logic Restabilized.");
        }
      } else {
        combatTimerRef.current = null;
      }

    }, 200);

    return () => clearInterval(interval);
  }, [view, autoTimeLeft, buffTimeLeft, penaltyRemaining, dragonTimeLeft]);

  // --- Auto-Pilot Loop ---
  const isCombatActive = autoTimeLeft > 0 || combat.battleMode === 'GVG';
  useEffect(() => {
    if (!isCombatActive || showDefeatedWindow) return;
    if (view !== 'dungeon' && view !== 'boss') return;

    const loop = setInterval(() => {
      const isBossView = view === 'boss';
      const c = combatRef.current;
      const a = actionsRef.current;
      const p = playerRef.current;
      if (!p || !c) return;

      // All three gates must be open
      const busOpen   = c.combatBusRef?.current === false;
      const notStunned = (c.stunRef?.current || 0) <= 0;
      const notMissed  = (c.missRef?.current || 0) <= 0;

      if (busOpen && notStunned && notMissed) {
        // Priority 1: Heal when low HP
        if (p.hp < p.maxHp * 0.4 && (p.potions || 0) > 0) {
          a.handleHeal();
        }
        // Priority 2: Synchronous enemy check via ref (no closure lag)
        else if (isBossView || (c.enemyRef?.current && c.enemyRef.current.hp > 0)) {
          c.handleAttack(isBossView);
        }
      }
    }, 800); // Comfortable cadence — mutex keeps it from queuing

    return () => clearInterval(loop);
  }, [view, isCombatActive, showDefeatedWindow]);

  return {
    autoTimeLeft,
    buffTimeLeft,
    dragonTimeLeft,
    penaltyRemaining
  };
};
