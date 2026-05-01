import { useState, useRef, useCallback, useEffect } from 'react';
import { BOSS, getHitChance, getDamage } from '../utils/gameLogic';

export const useCombat = (
  user,
  player,
  syncPlayer,
  enemy,
  setEnemy,
  enemyRef,
  spawnNewEnemy,
  clearEnemy,
  totalStats,
  addLog,
  playSFX,
  SOUNDS,
  selectedMap,
  STUN_DURATION_NORMAL,
  STUN_DURATION_CRIT,
  PENALTY_DURATION,
  DEFEAT_WINDOW_DURATION,
  COMPANION_BUFF_DURATION,
  ELEMENT_ADVANTAGE,
  getXpRequired,
  AP_PER_LEVEL,
  EQUIPMENT,
  LOOTS,
  ITEMS,
  depth,
  setDepth,
  view,
  setView,
  triggerFlinch,
  triggerHurt,
  TAVERN_MATES,
  PETS_METADATA,
  gvgActions = {}
) => {
  const { battleMode, setBattleMode, gvgContext, setGvgContext, recordWarResult, triggerHaptic, setShowSuccessWindow } = gvgActions;
  const [critAlert, setCritAlert] = useState(false);
  const [stunTimeLeft, setStunTimeLeft] = useState(0);
  const [missTimeLeft, setMissTimeLeft] = useState(0);
  const [combatState, setCombatState] = useState('IDLE');
  const [impactSplash, setImpactSplash] = useState(null);
  const [playerImpactSplash, setPlayerImpactSplash] = useState(null);
  const [strikingSide, setStrikingSide] = useState(null); // 'player' or 'monster'
  const [currentTaunt, setCurrentTaunt] = useState("");
  const [playerTaunt, setPlayerTaunt] = useState("");
  const [showDefeatedWindow, setShowDefeatedWindow] = useState(false);
  const [showVictoryWindow, setShowVictoryWindow] = useState(false);
  const [sessionRewards, setSessionRewards] = useState({ tokens: 0, xp: 0, loots: [] });
  const [killsInFloor, setKillsInFloor] = useState(0);
  const [lastLoot, setLastLoot] = useState(null);
  const [penaltyRemaining, setPenaltyRemaining] = useState(0);
  const [floatingNumbers, setFloatingNumbers] = useState([]); // Phase 4: AAA UI Floating Numbers

  const triggerFloatingNumber = useCallback((val, resultType, side) => {
    const id = Date.now() + Math.random();
    setFloatingNumbers(prev => [...prev.slice(-10), { id, val, resultType, side }]);
    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(n => n.id !== id));
    }, 1200);
  }, []);

  // Phase 4: Session Hard-Reset Logic
  const prevViewRef = useRef(view);
  useEffect(() => {
    const combatViews = ['dungeon', 'boss'];
    const enteringCombat = combatViews.includes(view);
    const wasInCombat = combatViews.includes(prevViewRef.current);

    if (enteringCombat && !wasInCombat) {
      setSessionRewards({ tokens: 0, xp: 0, loots: [] });
      setKillsInFloor(0);
    }
    prevViewRef.current = view;
  }, [view]);

  const stunRef = useRef(0);
  const missRef = useRef(0);
  const killsRef = useRef(0);
  const processingRef = useRef('IDLE');
  const combatBusRef = useRef(false);

  useEffect(() => {
    if (currentTaunt) {
      const timer = setTimeout(() => setCurrentTaunt(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTaunt]);

  useEffect(() => {
    if (playerTaunt) {
      const timer = setTimeout(() => setPlayerTaunt(""), 2200);
      return () => clearTimeout(timer);
    }
  }, [playerTaunt]);

  const resetCombatEngine = useCallback(() => {
    setCombatState('IDLE');
    setStunTimeLeft(0);
    setMissTimeLeft(0);
    if (stunRef) stunRef.current = 0;
    if (missRef) missRef.current = 0;
    setStrikingSide(null);
    setCritAlert(false);
    setShowVictoryWindow(false);
    setShowDefeatedWindow(false);
    combatBusRef.current = false;
  }, []);

  const enemyTurn = useCallback((target, isBoss = false) => {
    if (showDefeatedWindow) {
      processingRef.current = 'IDLE';
      setCombatState('IDLE');
      combatBusRef.current = false;
      return;
    }
    if (!target || !player?.hp || player?.hp <= 0) {
      processingRef.current = 'IDLE';
      setCombatState('IDLE');
      combatBusRef.current = false;
      return;
    }

    setCombatState('ENEMY_TURN');
    const stats = { ...totalStats };

    setTimeout(() => {
      setStrikingSide('monster');
      setTimeout(() => setStrikingSide(null), 300);
    }, 400);

    const hitResult = getHitChance(target.dex, stats.agi);
    
    if (hitResult.isHit) {
      const damageResult = getDamage(target.str, target.dex, stats.agi, isBoss ? BOSS.critChance : target.critChance);
      const { damage, isCrit, resultType } = damageResult;

      if (isCrit) { 
        addLog(`⚠️ CRIT!`); 
        setCritAlert(true); 
        setTimeout(() => setCritAlert(false), 800); 
        setStunTimeLeft(STUN_DURATION_CRIT / 1000); 
      } else {
        setStunTimeLeft(STUN_DURATION_NORMAL / 1000);
      }

      if (resultType === 'GLANCING') addLog(`🛡️ Glancing Blow! You mitigated heavy damage.`);
      addLog(`⚠️ ${target.name} ${resultType === 'CRITICAL' ? 'CRIT' : 'hit'} you for ${damage} DMG!`);
      
      playSFX(SOUNDS.monsterAttack);
      const taunts = target.taunts || ["Prepare to die!", "Too slow!", "Weakling!"];
      setCurrentTaunt(taunts[Math.floor(Math.random() * taunts.length)]);

      triggerHitEffects(damage, isCrit, 'player', triggerFlinch, triggerHurt);
      triggerFloatingNumber(damage, resultType, 'player');

      setTimeout(() => {
        const newHp = Math.floor(Math.max(0, (player?.hp || 0) - damage));
        if (newHp <= 0) {
          if (battleMode === 'GVG') {
            const e = enemyRef.current || enemy;
            const dmgPercent = Math.floor(((e.maxHp - e.hp) / e.maxHp) * 100);
            recordWarResult(gvgContext.warId, 0, gvgContext.opponentId, dmgPercent);
            setBattleMode('DUNGEON');
            setTimeout(() => setView('syndicate'), 1500);
          }

          setShowDefeatedWindow(true);
          setCombatState('DEFEATED');
          const remainingAutoTime = (player?.autoUntil || 0) > Date.now() ? player.autoUntil - Date.now() : 0;
          const destructUpdates = { hp: player?.maxHp || 1000, penaltyUntil: Date.now() + PENALTY_DURATION, hiredMate: null, buffUntil: 0, autoUntil: 0 };
          if (remainingAutoTime > 0) destructUpdates.autoTimeLeftSaved = remainingAutoTime;
          syncPlayer(destructUpdates);
          setTimeout(() => { 
            resetCombatEngine();
            setDepth(1); 
            setView('menu'); 
          }, DEFEAT_WINDOW_DURATION);
        } else {
          syncPlayer({ hp: newHp });
          processingRef.current = 'IDLE';
          setCombatState('IDLE');
          combatBusRef.current = false;
        }
      }, 500);
    } else {
      addLog(`🛡️ EVADED ${target.name}'s strike!`);
      triggerFloatingNumber(0, 'EVADE', 'player');
      setTimeout(() => {
        setCurrentTaunt("Drat! Slipped!");
        setPlayerTaunt("Too slow!");
        processingRef.current = 'IDLE';
        setCombatState('IDLE');
        combatBusRef.current = false;
      }, 500);
    }
  }, [showDefeatedWindow, player, totalStats, addLog, triggerHitEffects, syncPlayer, STUN_DURATION_CRIT, STUN_DURATION_NORMAL, PENALTY_DURATION, DEFEAT_WINDOW_DURATION, setDepth, setView, triggerFlinch, triggerHurt, battleMode, enemyRef, enemy, recordWarResult, gvgContext, triggerFloatingNumber]);

  const [isTreasury, setIsTreasury] = useState(false);
  const MAX_DUNGEON_DEPTH = 40;

  const handleTreasuryReached = useCallback(() => {
    setIsTreasury(true);
    setCombatState('VICTORY');
    if (setShowSuccessWindow) setShowSuccessWindow(true);
    addLog(`💎 TREASURY REACHED! Sector Node Cleared.`);
    playSFX(SOUNDS.obtainLoot);

    const rewards = [];
    const updates = {};
    const remainingAutoTime = (player?.autoUntil || 0) > Date.now() ? player.autoUntil - Date.now() : 0;
    if (remainingAutoTime > 0) {
      updates.autoTimeLeftSaved = remainingAutoTime;
      updates.autoUntil = 0;
    }
    
    const scrollPool = [
      { id: 'auto_scroll_3m', weight: 40 },
      { id: 'auto_scroll_6m', weight: 35 },
      { id: 'auto_scroll_9m', weight: 15 },
      { id: 'auto_scroll_12m', weight: 10 }
    ];
    const totalScrollWeight = scrollPool.reduce((sum, s) => sum + s.weight, 0);

    for (let i = 0; i < 5; i++) {
      let rand = Math.random() * totalScrollWeight;
      let selectedId = 'auto_scroll_3m';
      for (const s of scrollPool) {
        if (rand < s.weight) { selectedId = s.id; break; }
        rand -= s.weight;
      }
      const scrollItem = ITEMS.find(item => item.id === selectedId);
      if (scrollItem) {
        const uniqueId = `${selectedId}_TREASURY_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${i}`;
        updates[`inventory.${uniqueId}`] = { ...scrollItem, id: uniqueId };
        rewards.push({ ...scrollItem, id: uniqueId });
      }
    }
    addLog(`🎁 TREASURY REWARDS: 5x Auto Scrolls Collected!`);
    setSessionRewards(prev => ({ ...prev, loots: [...prev.loots, ...rewards] }));
    syncPlayer(updates);
  }, [ITEMS, syncPlayer, addLog, playSFX, SOUNDS, player?.autoUntil]);

  const handleCloseVictoryWindow = useCallback(() => {
    resetCombatEngine();
    setKillsInFloor(0);
    setDepth(1);
    setIsTreasury(false);
    if (setShowSuccessWindow) setShowSuccessWindow(false);
    setView('menu');
    addLog("🏁 Mission Parameters Met. Returning to Command Center.");
  }, [resetCombatEngine, setDepth, setView, addLog, setShowSuccessWindow]);

  const processKill = useCallback(() => {
    const e = enemyRef.current || enemy;
    const petMeta = player.petId ? PETS_METADATA.find(p => p.id === player.petId) : null;
    const earnedXp = Math.floor(e.xp * (petMeta?.xpMult || 1.0));
    const earnedLoot = Math.floor(e.loot * (petMeta?.lootMult || 1.0));
    addLog(`Victory! Found ${earnedLoot} GX.`);

    let nextXp = (player?.xp || 0) + earnedXp, nextLvl = player?.level || 1, nextMaxHp = player?.maxHp || 1000;
    let apGained = 0;
    while (nextXp >= getXpRequired(nextLvl)) {
      nextXp -= getXpRequired(nextLvl);
      nextLvl++;
      nextMaxHp += 50;
      apGained += AP_PER_LEVEL;
      addLog(`LVL UP! +5 AP.`);
    }

    const updates = {
      tokens: (player?.tokens || 0) + earnedLoot,
      xp: nextXp,
      level: nextLvl,
      maxHp: nextMaxHp,
      hp: Math.min(totalStats.maxHp + (nextMaxHp - (player?.maxHp || 0)), (player?.hp || 0) + 25)
    };
    if (apGained > 0) updates.abilityPoints = (player?.abilityPoints || 0) + apGained;

    if (selectedMap && selectedMap.lootTable) {
      const dropChance = Math.min(0.95, 0.30 + (depth * 0.015));
      if (Math.random() < dropChance) {
        const pool = selectedMap.lootTable.map(id => LOOTS.find(l => l.id === id)).filter(l => {
          if (!l) return false;
          if (l.rarity === 'Legendary' && depth < 5) return false;
          if (l.rarity === 'Epic' && depth < 4) return false;
          if (l.rarity === 'Rare' && depth < 2) return false;
          return true;
        });

        if (pool.length > 0) {
          const weights = { 'Common': 100, 'Uncommon': 40, 'Rare': 15, 'Epic': 4, 'Legendary': 1 };
          const totalWeight = pool.reduce((sum, item) => sum + (weights[item.rarity] || 10), 0);
          let random = Math.random() * totalWeight;
          let lootItem = null;
          for (const item of pool) {
            const weight = weights[item.rarity] || 10;
            if (random < weight) { lootItem = item; break; }
            random -= weight;
          }

          if (lootItem) {
            const isPotion = lootItem.id === 'hp_potion';
            const isScroll = lootItem.id === 'auto_scroll';
            let dropToTrack = lootItem;

            if (isPotion) {
               updates.potions = (player?.potions || 0) + 1;
            } else if (isScroll) {
                updates.autoScrolls = (player?.autoScrolls || 0) + 1;
                dropToTrack = { ...lootItem, id: `auto_scroll_pool_${Date.now()}` };
            } else if (lootItem.id?.startsWith('auto_scroll')) {
                const uniqueId = `${lootItem.id}_LOOT_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
                updates[`inventory.${uniqueId}`] = { ...lootItem, id: uniqueId };
                dropToTrack = { ...lootItem, id: uniqueId };
            } else {
               const itemWithId = { ...lootItem, id: `${lootItem.id}_${Date.now()}_${Math.floor(Math.random() * 9999)}` };
               updates[`inventory.${itemWithId.id}`] = itemWithId;
               setLastLoot(itemWithId);
               dropToTrack = itemWithId;
            }
            addLog(`🎁 LOOT: Found ${lootItem.name}!`);
            playSFX(SOUNDS.obtainLoot);
            setTimeout(() => setLastLoot(null), 3000);
            setSessionRewards(prev => ({ ...prev, loots: [...prev.loots, dropToTrack] }));
          }
        }
      }
    }

    syncPlayer(updates);

    const newKills = killsInFloor + 1;
    if (newKills >= 10 && depth >= MAX_DUNGEON_DEPTH) {
       handleTreasuryReached();
       return;
    }

    setShowVictoryWindow(true);
    setCombatState('VICTORY');

    setTimeout(() => {
      resetCombatEngine();
      if (newKills >= 10) {
        setKillsInFloor(0);
        const nextDepth = depth + 1;
        setDepth(nextDepth);
        addLog(`⬆️ FLOOR UP! Ascending to Floor ${nextDepth}...`);
        
        const currentMapFactor = (selectedMap?.minLevel || 1) * 100000;
        const currentDepthScore = currentMapFactor + nextDepth;
        if (currentDepthScore > (player?.maxDepthScore || 0)) {
            syncPlayer({ maxDepthScore: currentDepthScore, maxDepthFloor: nextDepth, maxDepthMapName: selectedMap?.name || 'Neon Slums', maxDepth: nextDepth });
        }
        spawnNewEnemy(nextDepth);
      } else {
        setKillsInFloor(newKills);
        spawnNewEnemy(depth);
      }
    }, 1500);

    if (battleMode === 'GVG') {
       recordWarResult(gvgContext.warId, 0, gvgContext.opponentId, 100);
       setBattleMode('DUNGEON');
       setTimeout(() => setView('syndicate'), 1500);
    }
  }, [enemy, player, addLog, selectedMap, syncPlayer, spawnNewEnemy, getXpRequired, AP_PER_LEVEL, LOOTS, battleMode, gvgContext, recordWarResult, setView, setBattleMode, depth, setDepth, killsInFloor, playSFX, SOUNDS, handleTreasuryReached, PETS_METADATA, totalStats]);

  const processBossHit = useCallback(async (dmg, isCrit) => {
    const maxTheoreticalDamage = Math.max(5000, (totalStats.str || 10) * 500); 
    if (dmg < 0 || dmg > maxTheoreticalDamage) {
       addLog("🚨 SYSTEM ANOMALY: Unauthorized payload detected. Strike dismissed!");
       return;
    }

    const newTotal = (player?.totalBossDamage || 0) + dmg;
    const updates = { totalBossDamage: newTotal };
    
    const milestoneMult = Math.pow(2, Math.floor(newTotal / 1000000));
    const currentDropChance = Math.min(0.12, BOSS.baseDropRate * milestoneMult);
    if (Math.random() < currentDropChance) {
      const relics = EQUIPMENT.filter(e => e.type === 'Relic');
      if (relics.length > 0) {
        const drop = relics[Math.floor(Math.random() * relics.length)];
        const dropId = `${drop.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        updates[`inventory.${dropId}`] = { ...drop, id: dropId };
        addLog(`💎 BOSS RELIC DROP: ${drop.name}!`);
        playSFX(SOUNDS.obtainLoot);
      }
    }

    syncPlayer(updates);
    enemyTurn(BOSS, true);
  }, [player, addLog, syncPlayer, enemyTurn, EQUIPMENT, totalStats, BOSS, playSFX, SOUNDS]);

  const handleAttack = useCallback((isBoss = false) => {
    if (combatBusRef.current) return;
    const isBusy = player?.hp <= 0 || stunRef.current > 0 || missRef.current > 0 || showDefeatedWindow || showVictoryWindow || processingRef.current !== 'IDLE' || (!isBoss && !enemy);
    if (isBusy) return;

    combatBusRef.current = true;
    processingRef.current = 'PLAYER_ATTACKING';
    setCombatState('PLAYER_ATTACKING');

    let stats = { ...totalStats };
    if (player?.hiredMate && (player?.buffUntil || 0) <= Date.now()) {
      const mate = TAVERN_MATES.find(m => m.id === player?.hiredMate);
      if (mate && (mate.procChance >= 1.0 || Math.random() < mate.procChance)) {
        const buffUntil = Date.now() + COMPANION_BUFF_DURATION;
        syncPlayer({ buffUntil });
        addLog(`✨ ${mate.name} activated their power!`);
        const mult = mate.multiplier || 2;
        if (mate.type === 'STR') stats.str *= mult;
        if (mate.type === 'AGI') stats.agi *= mult;
        if (mate.type === 'DEX') stats.dex *= mult;
      }
    }

    const target = isBoss ? BOSS : enemy;

    let elementalMultiplier = 1.0;
    const monsterElement = selectedMap?.element;
    if (monsterElement) {
        const playerElement = player?.gemxElement || 'Cosmic';
        const isEffective = playerElement && ELEMENT_ADVANTAGE[playerElement] === monsterElement;
        if (!isEffective) {
            addLog(`⚠️ ELEMENTAL HANDICAP: Damage reduced by 75%!`);
            setPlayerTaunt("My element is weak here!");
            elementalMultiplier = 0.25;
        }
    }

    setStrikingSide('player');
    setTimeout(() => setStrikingSide(null), 300);

    const hitResult = getHitChance(stats.dex, target.agi);

    if (hitResult.isHit) {
      const damageResult = getDamage(stats.str, stats.dex, target.agi);
      let { damage, isCrit, resultType } = damageResult;
      damage = Math.floor(damage * elementalMultiplier);

      const effects = Object.values(player?.equipped || {}).filter(i => i?.effect).map(i => i.effect);
      const critSpike = effects.find(e => e?.type === 'CritSpike');
      if (isCrit && critSpike) {
          damage = Math.floor(damage * (critSpike.mult / 2.5));
          addLog(`✨ CRIT SPIKE!`);
      }
      const doubleStrike = effects.find(e => e?.type === 'DoubleStrike');
      if (doubleStrike && Math.random() < doubleStrike.chance) {
          damage *= 2;
          addLog(`⚔️ DOUBLE STRIKE!`);
      }
      const lifesteal = effects.find(e => e?.type === 'LifeSteal');
      if (lifesteal && Math.random() < lifesteal.chance) {
          const heal = Math.floor(damage * lifesteal.amount);
          syncPlayer({ hp: Math.min(totalStats.maxHp, (player?.hp || 0) + heal) });
          addLog(`🩸 LIFESTEAL: +${heal} HP`);
      }

      if (isCrit) {
          addLog(`🔥 CRITICAL HIT!`);
          playSFX(SOUNDS.criticalHit);
      } else {
          playSFX(SOUNDS.playerAttack);
      }

      if (resultType === 'GLANCING') addLog(`🛡️ Enemy Glanced your strike! Low damage.`);
      addLog(`⚔️ You ${resultType === 'CRITICAL' ? 'CRIT' : 'hit'} ${target.name} for ${damage} DMG!`);
      
      triggerHitEffects(damage, isCrit, 'monster', triggerFlinch, triggerHurt);
      triggerFloatingNumber(damage, resultType, 'monster');

      const pTaunts = ["Take this!", "Direct strike!", "Weak!", "Begone!", "Target locked!", "Hunter's Fury!", "Maximum output!"];
      setPlayerTaunt(pTaunts[Math.floor(Math.random() * pTaunts.length)]);

      setTimeout(() => {
        if (isBoss) {
          processBossHit(damage, isCrit);
        } else {
          const newHp = Math.floor(Math.max(0, target.hp - damage));
          if (newHp <= 0) {
            setEnemy({ ...target, hp: 0 });
            processKill();
          } else {
            setEnemy({ ...target, hp: newHp });
            enemyTurn({ ...target, hp: newHp }, isBoss);
          }
        }
      }, 500);
    } else {
      addLog(`🛡️ ${target.name} EVADED your strike!`);
      triggerFloatingNumber(0, 'EVADE', 'monster');
      setTimeout(() => {
        enemyTurn(target, isBoss);
      }, 500);
    }
  }, [player, totalStats, enemy, TAVERN_MATES, COMPANION_BUFF_DURATION, syncPlayer, addLog, playSFX, SOUNDS, selectedMap, ELEMENT_ADVANTAGE, triggerHitEffects, triggerFloatingNumber, processKill, enemyTurn, showDefeatedWindow, showVictoryWindow, isTreasury, setEnemy, triggerFlinch, triggerHurt]);

  const handleRetreat = useCallback(() => {
    if (processingRef.current === 'RETREATING') return;
    
    if (battleMode === 'GVG') {
      setSessionRewards({ tokens: 0, xp: 0, loots: [] });
      const damagePercent = Math.min(100, Math.floor(((enemy.maxHp - enemy.hp) / enemy.maxHp) * 100));
      recordWarResult(gvgContext.warId, 0, gvgContext.opponentId, damagePercent);
      setBattleMode('DUNGEON');
      setTimeout(() => setView('syndicate'), 1500);
    } else {
      processingRef.current = 'RETREATING';
      setSessionRewards({ tokens: 0, xp: 0, loots: [] });
      setKillsInFloor(0);
      resetCombatEngine();
      if (clearEnemy) clearEnemy();
      setView('menu');
      setDepth(1);
      const remainingAutoTime = (player?.autoUntil || 0) > Date.now() ? player.autoUntil - Date.now() : 0;
      const closingUpdates = { autoUntil: 0 };
      if (remainingAutoTime > 0) closingUpdates.autoTimeLeftSaved = remainingAutoTime;
      syncPlayer(closingUpdates, true);
      setTimeout(() => { if (processingRef.current === 'RETREATING') processingRef.current = 'IDLE'; }, 500);
    }
  }, [battleMode, setView, setDepth, player?.autoUntil, syncPlayer, resetCombatEngine, clearEnemy, enemy, gvgContext, recordWarResult, setBattleMode]);

  useEffect(() => {
    let safetyTimer;
    if (combatBusRef.current) {
      safetyTimer = setTimeout(() => {
        if (combatBusRef.current) {
          console.warn("🛡️ SAFETY ALERT: Combat strike stalling detected. Forcing auto-recovery.");
          resetCombatEngine();
        }
      }, 4000);
    }
    return () => clearTimeout(safetyTimer);
  }, [combatBusRef.current, resetCombatEngine]);

  return {
    critAlert, stunTimeLeft, missTimeLeft, combatState, impactSplash, playerImpactSplash,
    strikingSide, currentTaunt, playerTaunt, showDefeatedWindow, showVictoryWindow,
    setShowVictoryWindow, handleCloseVictoryWindow, sessionRewards, killsInFloor,
    lastLoot, penaltyRemaining, setStunTimeLeft, setMissTimeLeft, setKillsInFloor,
    setPenaltyRemaining, setCombatState, handleAttack, enemyTurn, processKill,
    processBossHit, triggerHitEffects, setSessionRewards, combatBusRef, stunRef,
    missRef, enemyRef, battleMode, setBattleMode, isTreasury, handleRetreat,
    floatingNumbers
  };
};
