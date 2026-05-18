import { useState, useEffect, useRef } from 'react';

export const useGameLoop = ({
  player,
  view,
  syncPlayer,
  addLog,
  combat,
  actions,
  totalStats,
  showDefeatedWindow,
  isNetworkOffline,
  isNetworkSlow
}) => {
  const [autoTimeLeft, setAutoTimeLeft] = useState(0);
  const [buffTimeLeft, setBuffTimeLeft] = useState(0);
  const [dragonTimeLeft, setDragonTimeLeft] = useState(0);
  const [penaltyRemaining, setPenaltyRemaining] = useState(0);
  const [foodTimeLeft, setFoodTimeLeft] = useState(0);

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

  // BUG-08 FIX: use refs for timer values inside interval to avoid constant teardown/recreation
  const timersRef = useRef({ autoTimeLeft: 0, buffTimeLeft: 0, penaltyRemaining: 0, dragonTimeLeft: 0, foodTimeLeft: 0 });

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

      // 2. Sync timed states from player record (compare against ref, not state)
      const newAutoTime = p.autoUntil && p.autoUntil > now ? Math.ceil((p.autoUntil - now) / 1000) : 0;
      const newBuffTime = p.buffUntil && p.buffUntil > now ? Math.ceil((p.buffUntil - now) / 1000) : 0;
      const newPenaltyTime = p.penaltyUntil && p.penaltyUntil > now ? Math.ceil((p.penaltyUntil - now) / 1000) : 0;
      const newDragonTime = p.dragon?.summonUntil && p.dragon.summonUntil > now ? Math.ceil((p.dragon.summonUntil - now) / 1000) : 0;
      const newFoodTime = p.activeFoodUntil && p.activeFoodUntil > now ? Math.ceil((p.activeFoodUntil - now) / 1000) : 0;

      if (newAutoTime !== timersRef.current.autoTimeLeft) { setAutoTimeLeft(newAutoTime); timersRef.current.autoTimeLeft = newAutoTime; }
      if (newBuffTime !== timersRef.current.buffTimeLeft) { setBuffTimeLeft(newBuffTime); timersRef.current.buffTimeLeft = newBuffTime; }
      if (newPenaltyTime !== timersRef.current.penaltyRemaining) { setPenaltyRemaining(newPenaltyTime); timersRef.current.penaltyRemaining = newPenaltyTime; }
      if (newDragonTime !== timersRef.current.dragonTimeLeft) { setDragonTimeLeft(newDragonTime); timersRef.current.dragonTimeLeft = newDragonTime; }
      if (newFoodTime !== timersRef.current.foodTimeLeft) { setFoodTimeLeft(newFoodTime); timersRef.current.foodTimeLeft = newFoodTime; }

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
  }, [view]); // BUG-08 FIX: Only re-create on view change, not on every timer tick

  // --- Auto-Pilot Loop ---
  const isCombatActive = autoTimeLeft > 0 || combat.battleMode === 'GVG';
  useEffect(() => {
    if (!isCombatActive || showDefeatedWindow || isNetworkOffline || isNetworkSlow) return;
    if (view !== 'dungeon' && view !== 'boss') return;

    const loop = setInterval(() => {
      const isBossView = view === 'boss';
      const c = combatRef.current;
      const a = actionsRef.current;
      const p = playerRef.current;
      if (!p || !c) return;

      // Pause attacks completely if the overburdened warning dialog is visible
      if (c.showOverburdenedWarning) return;

      // All three gates must be open
      const busOpen   = c.combatBusRef?.current === false;
      const notStunned = (c.stunRef?.current || 0) <= 0;
      const notMissed  = (c.missRef?.current || 0) <= 0;

      if (busOpen && notStunned && notMissed) {
        // Priority 1: Heal when low HP
        const selPotion = p.selectedPotionId || 'hp_potion';
        const invPotions = Object.values(p.inventory || {}).filter(i => i && i.id?.startsWith(selPotion)).length;
        const totalPotions = selPotion === 'hp_potion' ? (invPotions + (p.potions || 0)) : invPotions;

        if (p.hp < (totalStats?.maxHp || p.maxHp) * 0.4 && totalPotions > 0) {
          a.handleHeal();
        }
        // Priority 2: Synchronous enemy check via ref (no closure lag)
        else if (isBossView || (c.enemyRef?.current && c.enemyRef.current.hp > 0)) {
          c.handleAttack(isBossView);
        }
      }
    }, 800); // Comfortable cadence — mutex keeps it from queuing

    return () => clearInterval(loop);
  }, [view, isCombatActive, showDefeatedWindow, isNetworkOffline, isNetworkSlow]);

  return {
    autoTimeLeft,
    buffTimeLeft,
    dragonTimeLeft,
    penaltyRemaining,
    foodTimeLeft
  };
};
