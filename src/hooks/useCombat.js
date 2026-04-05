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
  totalStats,
  addLog,
  playSFX,
  SOUNDS,
  updateLeaderboard,
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
  depth,
  setDepth,
  view,
  setView,
  triggerFlinch,
  triggerHurt,
  TAVERN_MATES,
  gvgActions = {}
) => {
  const { battleMode, setBattleMode, gvgContext, setGvgContext, recordWarResult, triggerHaptic } = gvgActions;
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

  const stunRef = useRef(0);
  const missRef = useRef(0);
  const killsRef = useRef(0);
  const processingRef = useRef('IDLE');
  const combatBusRef = useRef(false); // SYNCHRONOUS MUTEX: THE MASTER GATEKEEPER

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

  useEffect(() => {
    stunRef.current = stunTimeLeft;
    missRef.current = missTimeLeft;
    killsRef.current = killsInFloor;
    processingRef.current = combatState;

    // Heartbeat safety reset for stuck combat state
    if (combatState !== 'IDLE' && combatState !== 'VICTORY' && combatState !== 'DEFEATED') {
      const timer = setTimeout(() => {
        if (processingRef.current === combatState) {
          console.warn(`Combat Action Stalled in ${combatState}! Emergency Reset.`);
          setCombatState('IDLE');
          combatBusRef.current = false; // RELEASE LOCK ON STALL
        }
      }, 3500); 
      return () => clearTimeout(timer);
    }
  }, [stunTimeLeft, missTimeLeft, killsInFloor, combatState]);

  const triggerHitEffects = useCallback((dmg, isCrit, side = 'monster', triggerFlinch, triggerHurt) => {
    const impactWords = ["BAM!", "POW!", "WHACK!", "SMASH!", "KABOOM!", "ZAP!", "SLAM!", "CRUNCH!", "KRAK!"];
    const word = impactWords[Math.floor(Math.random() * impactWords.length)];
    const id = Date.now();

    if (side === 'monster') {
      setImpactSplash({ text: word, dmg, isCrit, id });
      setTimeout(() => setImpactSplash(prev => (prev?.id === id ? null : prev)), 400);
      triggerFlinch();
      if (triggerHaptic) triggerHaptic(isCrit ? 'heavy' : 'medium');
      const ouchWords = ["Ouch!", "Gah!", "No!", "Stop!", "Critical Hit!", "Ack!", "My circuits!", "System Failure!"];
      setCurrentTaunt(ouchWords[Math.floor(Math.random() * ouchWords.length)]);
    } else {
      setPlayerImpactSplash({ text: word, dmg, isCrit, id });
      setTimeout(() => setPlayerImpactSplash(prev => (prev?.id === id ? null : prev)), 400);
      triggerHurt();
      if (triggerHaptic) triggerHaptic('rigid');
      const ouchWords = ["Ugh!", "Ack!", "Too strong!", "Healing needed!", "Pain...", "Vision blurring!", "Armor cracked!"];
      setPlayerTaunt(ouchWords[Math.floor(Math.random() * ouchWords.length)]);
    }
  }, [triggerHaptic]);

  const resetCombatEngine = useCallback(() => {
    setCombatState('IDLE');
    processingRef.current = 'IDLE'; // Synchronous mirror reset
    setStunTimeLeft(0);
    setMissTimeLeft(0);
    if (stunRef) stunRef.current = 0;
    if (missRef) missRef.current = 0;
    setStrikingSide(null);
    setCritAlert(false);
    setShowVictoryWindow(false);
    setShowDefeatedWindow(false);
    combatBusRef.current = false; // NUCLEAR RELEASE
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

    let hitChance = getHitChance(target.dex, stats.agi);
    if (battleMode === 'GVG') hitChance = Math.max(85, Math.min(100, hitChance * 1.5)); 
    
    if (Math.random() * 100 < hitChance) {
      const isCrit = Math.random() < (isBoss ? BOSS.critChance : target.critChance);
      const dmg = Math.floor(getDamage(target.str, stats.agi, isCrit));

      if (isCrit) { 
        addLog(`⚠️ CRIT!`); 
        setCritAlert(true); 
        setTimeout(() => setCritAlert(false), 800); 
        setStunTimeLeft(STUN_DURATION_CRIT / 1000); 
      } else {
        setStunTimeLeft(STUN_DURATION_NORMAL / 1000);
      }

      addLog(`⚠️ ${target.name} hit you for ${dmg} DMG!`);
      playSFX(SOUNDS.monsterAttack); // PLAY IMPACT SOUND ON HIT
      const taunts = target.taunts || ["Prepare to die!", "Too slow!", "Weakling!"];
      setCurrentTaunt(taunts[Math.floor(Math.random() * taunts.length)]);

      triggerHitEffects(dmg, isCrit, 'player', triggerFlinch, triggerHurt);

      setTimeout(() => {
        const newHp = Math.floor(Math.max(0, (player?.hp || 0) - dmg));
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
          syncPlayer({ hp: player?.maxHp || 1000, penaltyUntil: Date.now() + PENALTY_DURATION, hiredMate: null, buffUntil: 0, autoUntil: 0 });
          setTimeout(() => { 
            resetCombatEngine(); // RESET ALL LOCKS AND STATES
            setDepth(1); 
            setView('menu'); 
          }, DEFEAT_WINDOW_DURATION);
        } else {
          syncPlayer({ hp: newHp });
          processingRef.current = 'IDLE';
          setCombatState('IDLE');
          combatBusRef.current = false; // RELEASE LOCK AFTER ENEMY TURN
        }
      }, 500);
    } else {
      addLog(`🛡️ Dodged ${target.name}'s strike!`);
      setTimeout(() => {
        setCurrentTaunt("Drat! Slipped!");
        setPlayerTaunt("Nice try!");
        processingRef.current = 'IDLE';
        setCombatState('IDLE');
        combatBusRef.current = false; // RELEASE LOCK AFTER ENEMY MISS
      }, 500);
    }
  }, [showDefeatedWindow, player, totalStats, addLog, triggerHitEffects, syncPlayer, STUN_DURATION_CRIT, STUN_DURATION_NORMAL, PENALTY_DURATION, DEFEAT_WINDOW_DURATION, setDepth, setView, triggerFlinch, triggerHurt, battleMode, enemyRef, enemy, recordWarResult, gvgContext]);

  const processKill = useCallback(() => {
    const e = enemyRef.current || enemy;
    const earnedXp = Math.floor(e.xp * (player?.petId ? 1.1 : 1.0));
    addLog(`Victory! Found ${e.loot} GX.`);
    if (player?.petId) addLog("✨ GENESIS PULSE: +10% XP Bonus!");

    let nextXp = (player?.xp || 0) + earnedXp, nextLvl = player?.level || 1, nextMaxHp = player?.maxHp || 1000, nextAP = player?.abilityPoints || 0;
    let didLevelUp = false;
    while (nextXp >= getXpRequired(nextLvl)) {
      nextXp -= getXpRequired(nextLvl);
      nextLvl++;
      nextMaxHp += 50;
      nextAP += AP_PER_LEVEL;
      addLog(`LVL UP! +5 AP.`);
      didLevelUp = true;
    }

    const updates = {
      tokens: (player?.tokens || 0) + e.loot,
      xp: nextXp,
      level: nextLvl,
      maxHp: nextMaxHp,
      hp: Math.min(nextMaxHp, (player?.hp || 0) + 25),
      abilityPoints: nextAP
    };

    if (selectedMap && selectedMap.lootTable) {
      const dropChance = Math.min(0.95, 0.30 + (depth * 0.015));
      if (Math.random() < dropChance) {
        const pool = selectedMap.lootTable.map(id => LOOTS.find(l => l.id === id)).filter(l => {
          if (!l) return false;
          if (l.rarity === 'Legendary' && depth < 20) return false;
          if (l.rarity === 'Epic' && depth < 10) return false;
          if (l.rarity === 'Rare' && depth < 5) return false;
          return true;
        });

        // Add small chance for schematics in deep floors
        if (depth >= 5 && Math.random() < 0.05) {
           const schematics = LOOTS.filter(l => l.type === 'Schematic');
           if (schematics.length > 0) pool.push(schematics[Math.floor(Math.random() * schematics.length)]);
        }

        if (pool.length > 0) {
          // WEIGHT-SUM ALGORITHM: Zero memory overhead
          const weights = { 'Common': 100, 'Uncommon': 40, 'Rare': 15, 'Epic': 4, 'Legendary': 1 };
          const totalWeight = pool.reduce((sum, item) => sum + (weights[item.rarity] || 10), 0);
          let random = Math.random() * totalWeight;
          
          let lootItem = null;
          for (const item of pool) {
            const weight = weights[item.rarity] || 10;
            if (random < weight) {
              lootItem = item;
              break;
            }
            random -= weight;
          }

          if (lootItem) {
            const itemWithId = { ...lootItem, id: `${lootItem.id}_${Date.now()}` };
            updates[`inventory.${itemWithId.id}`] = itemWithId;
            addLog(`🎁 LOOT: Found ${lootItem.name}!`);
            playSFX(SOUNDS.obtainLoot);
            setLastLoot(itemWithId);
            setTimeout(() => setLastLoot(null), 3000);
          }
        }
      }
    }

    syncPlayer(updates);

    const droppedItem = updates[`inventory.${Object.keys(updates).find(k => k.startsWith('inventory.'))?.split('.')[1]}`] || null;
    setSessionRewards(prev => ({
      tokens: prev.tokens + e.loot,
      xp: prev.xp + earnedXp,
      loots: droppedItem ? [...prev.loots, droppedItem] : prev.loots
    }));

    setShowVictoryWindow(true);
    setCombatState('VICTORY');

    setTimeout(() => {
      resetCombatEngine(); // RESET ALL LOCKS AND STATES
      const newKills = killsRef.current + 1;
      if (newKills >= 10) {
        setKillsInFloor(0);
        const nextDepth = depth + 1;
        setDepth(nextDepth);
        addLog(`⬆️ FLOOR UP! Ascending to Floor ${nextDepth}...`);
        
        // --- STRATEGIC DEPTH SCORING V4 ---
        // Logic: Rank first by Map Difficulty (minLevel), then by Floor.
        // Formula: (minLevel * 100000) + floor
        const currentMapFactor = (selectedMap?.minLevel || 1) * 100000;
        const currentDepthScore = currentMapFactor + nextDepth;
        const previousMaxScore = player?.maxDepthScore || 0;

        if (currentDepthScore > previousMaxScore) {
            const depthUpdates = {
                maxDepthScore: currentDepthScore,
                maxDepthMapName: selectedMap?.name || 'Neon Slums',
                maxDepthMapMinLevel: selectedMap?.minLevel || 1,
                maxDepthFloor: nextDepth,
                maxDepth: nextDepth // Backwards compatibility
            };
            syncPlayer(depthUpdates);
            updateLeaderboard({
                level: nextLvl,
                maxDepthScore: currentDepthScore,
                maxDepthFloor: nextDepth
            });
        }
        
        spawnNewEnemy(nextDepth);
      } else {
        setKillsInFloor(newKills);
        spawnNewEnemy(depth);
      }
    }, 1500);

    if (didLevelUp) {
      updateLeaderboard({
        level: nextLvl
      });
    }

    if (battleMode === 'GVG') {
       recordWarResult(gvgContext.warId, 0, gvgContext.opponentId, 100);
       setBattleMode('DUNGEON');
       setTimeout(() => setView('syndicate'), 1500);
    }
  }, [enemy, player, addLog, selectedMap, syncPlayer, spawnNewEnemy, getXpRequired, AP_PER_LEVEL, LOOTS, battleMode, gvgContext, recordWarResult, setView, setBattleMode, depth, setDepth, killsRef, updateLeaderboard, playSFX, SOUNDS]);

  const processBossHit = useCallback(async (dmg, isCrit) => {
    const newTotal = (player?.totalBossDamage || 0) + dmg;
    const updates = { totalBossDamage: newTotal };
    
    const milestoneMult = Math.pow(2, Math.floor(newTotal / 1000000));
    const currentDropChance = BOSS.baseDropRate * milestoneMult;

    if (Math.random() < currentDropChance) {
      const relics = EQUIPMENT.filter(e => e.type === 'Relic');
      if (relics.length > 0) {
        const drop = relics[Math.floor(Math.random() * relics.length)];
        const dropId = `${drop.id}_${Date.now()}`;
        updates[`inventory.${dropId}`] = { ...drop, id: dropId };
        addLog(`💎 BOSS RELIC DROP: ${drop.name}!`);
        playSFX(SOUNDS.obtainLoot);
      }
    }

    if (Math.random() < 0.3) {
      const schematics = LOOTS.filter(l => l.type === 'Schematic');
      if (schematics.length > 0) {
        const drop = schematics[Math.floor(Math.random() * schematics.length)];
        const dropId = `${drop.id}_${Date.now()}`;
        updates[`inventory.${dropId}`] = { ...drop, id: dropId };
        addLog(`📜 BLUEPRINT RECOVERED: ${drop.name}!`);
        playSFX(SOUNDS.obtainLoot);
      }
    }

    syncPlayer(updates);
    updateLeaderboard({ score: newTotal });
    enemyTurn(BOSS, true);
  }, [player, addLog, syncPlayer, enemyTurn, EQUIPMENT, updateLeaderboard]);

  const handleAttack = useCallback((isBoss = false) => {
    // --- SYNCHRONOUS MUTEX GATE ---
    if (combatBusRef.current) return; // Discard parallel commands instantly
    
    // Use processingRef for synchronous state check — no closure/render lag
    const isBusy = player?.hp <= 0 || stunRef.current > 0 || missRef.current > 0 || showDefeatedWindow || showVictoryWindow || processingRef.current !== 'IDLE' || (!isBoss && !enemy);
    
    if (isBusy) {
       return;
    }

    // LOCK ENGAGED
    combatBusRef.current = true;
    processingRef.current = 'PLAYER_ATTACKING'; // Synchronous mirror
    setCombatState('PLAYER_ATTACKING');

    let stats = { ...totalStats };
    // Mate Proc Logic
    if (player?.hiredMate && player?.buffUntil <= 0) {
      const mate = TAVERN_MATES.find(m => m.id === player?.hiredMate);
      if (mate && mate.procChance < 1.0) { 
        if (Math.random() < mate.procChance) {
          syncPlayer({ buffUntil: Date.now() + COMPANION_BUFF_DURATION });
          addLog(`✨ ${mate.name} activated their power!`);
        }
      }
    }

    const target = isBoss ? BOSS : enemy;

    const monsterElement = selectedMap?.element;
    if (monsterElement) {
        const playerElement = player?.gemxElement || 'Cosmic';
        const isEffective = playerElement && ELEMENT_ADVANTAGE[playerElement] === monsterElement;
        
        if (!isEffective) {
            addLog(`🛡️ DEFENSE ERROR: The monster is unaffected!`);
            setPlayerTaunt("My attacks are doing nothing!");
            setMissTimeLeft(1.2);
            enemyTurn(target, isBoss);
            // Lock stays true until enemyTurn resolves it (via miss setTimeouts)
            return;
        }
    }

    setStrikingSide('player');
    setTimeout(() => setStrikingSide(null), 300);

    let hitChance = getHitChance(stats.dex, target.agi);
    if (battleMode === 'GVG') hitChance = Math.max(85, Math.min(100, hitChance * 1.5)); 

    if (Math.random() * 100 < hitChance) {
      const isCrit = Math.random() < 0.15;
      let dmg = Math.floor(getDamage(stats.str, target.agi, isCrit));

      const effects = Object.values(player?.equipped || {}).filter(i => i?.effect).map(i => i.effect);
      const critSpike = effects.find(e => e.type === 'CritSpike');
      if (isCrit && critSpike) {
          dmg = Math.floor(dmg * (critSpike.mult / 2.5));
          addLog(`✨ CRIT SPIKE!`);
      }
      const doubleStrike = effects.find(e => e.type === 'DoubleStrike');
      if (doubleStrike && Math.random() < doubleStrike.chance) {
          dmg *= 2;
          addLog(`⚔️ DOUBLE STRIKE!`);
      }
      const lifesteal = effects.find(e => e.type === 'LifeSteal');
      if (lifesteal && Math.random() < lifesteal.chance) {
          const heal = Math.floor(dmg * lifesteal.amount);
          syncPlayer({ hp: Math.min(player?.maxHp || 1000, (player?.hp || 0) + heal) });
          addLog(`🩸 LIFESTEAL: +${heal} HP`);
      }
      const allInOne = effects.find(e => e.type === 'AllInOne');
      if (allInOne && Math.random() < allInOne.chance) {
          dmg *= 4;
          addLog(`🧿 OMEGA OVERLOAD: 4x DMG!`);
      }

      triggerHitEffects(dmg, isCrit, 'monster', triggerFlinch, triggerHurt);

      const pTaunts = ["Take this!", "Direct strike!", "Weak!", "Begone!", "Target locked!", "Hunter's Fury!", "Maximum output!"];
      setPlayerTaunt(pTaunts[Math.floor(Math.random() * pTaunts.length)]);
      addLog(`Struck ${target.name} for ${dmg} DMG.`);
      playSFX(SOUNDS.playerAttack); // PLAY IMPACT SOUND ON HIT

      setTimeout(() => {
        if (isBoss) {
          processBossHit(dmg, isCrit);
        } else {
          const newHp = Math.floor(Math.max(0, target.hp - dmg));
          if (newHp <= 0) {
            setEnemy({ ...target, hp: 0 });
            processKill();
            // processKill will handle the lock release
          } else {
            setEnemy({ ...target, hp: newHp });
            enemyTurn({ ...target, hp: newHp }, isBoss);
            // enemyTurn will handle the lock release
          }
        }
      }, 500);
    } else {
      addLog(`Missed strike on ${target.name}!`);
      setMissTimeLeft(battleMode === 'GVG' ? 0.8 : 1.5);
      setPlayerTaunt("Darn, missed!");
      setCurrentTaunt("Ha! Too slow!");
      enemyTurn(target, isBoss);
      // enemyTurn will handle the lock release
    }
  }, [player, enemy, showDefeatedWindow, combatState, totalStats, syncPlayer, addLog, triggerHitEffects, processBossHit, processKill, enemyTurn, setEnemy, COMPANION_BUFF_DURATION, ELEMENT_ADVANTAGE, selectedMap, triggerFlinch, triggerHurt, battleMode, recordWarResult, gvgContext, setView, setBattleMode, stunRef, missRef, showVictoryWindow, TAVERN_MATES, playSFX, SOUNDS]);

  const recordGvGResult = useCallback(() => {
    if (battleMode !== 'GVG') return;
    const damagePercent = Math.min(100, Math.floor(((enemy.maxHp - enemy.hp) / enemy.maxHp) * 100));
    recordWarResult(gvgContext.warId, 0, gvgContext.opponentId, damagePercent);
    setBattleMode('DUNGEON');
    setTimeout(() => setView('syndicate'), 1500);
  }, [battleMode, enemy, gvgContext, recordWarResult, setBattleMode, setView]);

  const handleRetreat = useCallback(() => {
    if (battleMode === 'GVG') {
      recordGvGResult();
    } else {
      // WIPE SESSION REWARDS FOR NEXT RUN
      setSessionRewards({ tokens: 0, xp: 0, loots: [] });
      setKillsInFloor(0);
      resetCombatEngine(); // NUCLEAR RESET ON RETREAT
      setView('menu');
      setDepth(1);
      if (player?.autoUntil > 0) syncPlayer({ autoUntil: 0 });
    }
  }, [battleMode, recordGvGResult, setView, setDepth, player?.autoUntil, syncPlayer, resetCombatEngine]);

  // SAFETY HEARTBEAT - Force release bus if stalled
  useEffect(() => {
    let safetyTimer;
    if (combatBusRef.current) {
      safetyTimer = setTimeout(() => {
        if (combatBusRef.current) {
          console.warn("🛡️ SAFETY ALERT: Combat strike stalling detected. Forcing auto-recovery.");
          resetCombatEngine(); // NUCLEAR RELEASE
        }
      }, 4000);
    }
    return () => clearTimeout(safetyTimer);
  }, [combatBusRef.current, resetCombatEngine]);

  return {
    critAlert,
    stunTimeLeft,
    missTimeLeft,
    combatState,
    impactSplash,
    playerImpactSplash,
    strikingSide,
    currentTaunt,
    playerTaunt,
    showDefeatedWindow,
    showVictoryWindow,
    sessionRewards,
    killsInFloor,
    lastLoot,
    penaltyRemaining,
    setStunTimeLeft,
    setMissTimeLeft,
    setKillsInFloor,
    setPenaltyRemaining,
    setCombatState,
    handleAttack,
    enemyTurn,
    processKill,
    processBossHit,
    triggerHitEffects,
    setSessionRewards,
    combatBusRef,
    stunRef,
    missRef,
    enemyRef,
    battleMode,
    setBattleMode,
    handleRetreat
  };
};
