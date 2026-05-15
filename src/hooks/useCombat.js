import { useState, useRef, useCallback, useEffect } from 'react';
import { BOSS, getHitChance, getDamage, getCritChance, ELEMENTAL_SKILLS, SKILL_ENERGY_PER_HIT, SKILL_ENERGY_PER_KILL, SKILL_ENERGY_PER_CRIT, SKILL_COOLDOWN_DURATION } from '../utils/gameLogic';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

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
  const { battleMode, setBattleMode, gvgContext, setGvgContext, recordWarResult, triggerHaptic, setShowSuccessWindow, setPlayer } = gvgActions;
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
  const [levelUpEffectTrigger, setLevelUpEffectTrigger] = useState(0);
  const [penaltyRemaining, setPenaltyRemaining] = useState(0);
  const [floatingNumbers, setFloatingNumbers] = useState([]); 
  const [skillEnergy, setSkillEnergy] = useState(0);
  const [activeSkill, setActiveSkill] = useState(null);
  const [skillDuration, setSkillDuration] = useState(0);
  const [skillCooldown, setSkillCooldown] = useState(0);
  const [monsterSkillActive, setMonsterSkillActive] = useState(null);
  const [monsterTurnCount, setMonsterTurnCount] = useState(0);
  const [squadStrikeActive, setSquadStrikeActive] = useState(null); // { type, name, avatar, color, element }
  const [defeatData, setDefeatData] = useState(null); // Raid summary snapshot on defeat

  const triggerFloatingNumber = useCallback((val, isCrit, side) => {
    const id = Date.now() + Math.random();
    setFloatingNumbers(prev => [...prev.slice(-10), { id, val, isCrit, side }]);
    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(n => n.id !== id));
    }, 1000);
  }, []);

  // Phase 4: Session Hard-Reset Logic
  // Ensures every time we enter the dungeon/boss from a menu, the loot stack is wiped fresh.
  const prevViewRef = useRef(view);
  useEffect(() => {
    const combatViews = ['dungeon', 'boss'];
    const enteringCombat = combatViews.includes(view);
    const wasInCombat = combatViews.includes(prevViewRef.current);

    if (enteringCombat && !wasInCombat) {
      console.log("🏙️ [DUNGEON_ENTRY] Resetting Session Rewards and Floor Kills.");
      setSessionRewards({ tokens: 0, xp: 0, loots: [] });
      setKillsInFloor(0);
    }
    prevViewRef.current = view;
  }, [view]);

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

  // Sync-Drive Duration Engine
  useEffect(() => {
    let timer;
    if (skillDuration > 0) {
      timer = setInterval(() => {
        setSkillDuration(prev => {
          if (prev <= 1) {
            setActiveSkill(null);
            setSkillCooldown(SKILL_COOLDOWN_DURATION); // System Reboot
            addLog(`⌛ SYNC-DRIVE: UPLINK DEPLETED. REBOOTING...`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [skillDuration, addLog]);

  // Sync-Drive Reboot Timer
  useEffect(() => {
    let timer;
    if (skillCooldown > 0) {
      timer = setInterval(() => {
        setSkillCooldown(prev => prev <= 1 ? 0 : prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [skillCooldown]);

  const triggerSkill = useCallback(() => {
    if (skillEnergy < 100 || activeSkill || skillCooldown > 0) return;

    const element = player?.gemxElement || 'Cosmic';
    const skill = ELEMENTAL_SKILLS[element];
    if (!skill) return;

    setSkillEnergy(0);
    setActiveSkill(skill);
    setSkillDuration(skill.duration);

    // Immediate Burst Effects
    if (skill.healPerc) {
      const heal = Math.floor(totalStats.maxHp * skill.healPerc);
      syncPlayer({ hp: Math.min(totalStats.maxHp, (player.hp || 0) + heal) });
      addLog(`✨ ${skill.name}: HEALED +${heal} HP`);
    }
    
    if (skill.execPerc) {
      const isBossMode = view === 'boss';
      const currentEnemy = isBossMode ? BOSS : enemy;
      if (currentEnemy) {
        const execDmg = Math.floor(currentEnemy.hp * skill.execPerc);
        const newHp = Math.max(1, currentEnemy.hp - execDmg);
        setEnemy(prev => ({ ...prev, hp: newHp }));
        addLog(`🌌 ${skill.name}: SINGULARITY EXECUTION -${execDmg} HP`);
      }
    }

    addLog(`💎 SYNC-DRIVE: ${skill.name} ACTIVATED!`);
    playSFX(SOUNDS.skillTrigger);
  }, [skillEnergy, activeSkill, player, totalStats, syncPlayer, addLog, playSFX, SOUNDS, enemy, setEnemy, ELEMENTAL_SKILLS, view]);

  // DERIVE PET METADATA FOR COMBAT BONUSES
  const petMeta = (player?.activePet && PETS_METADATA) ? PETS_METADATA[player.activePet.id] : null;

  const triggerMonsterSkill = useCallback((skill, target) => {
    setMonsterSkillActive(skill);
    setTimeout(() => setMonsterSkillActive(null), 1800);
    
    addLog(`👹 MONSTER SKILL: ${skill.name}!`);
    playSFX(SOUNDS.monsterSkill);

    if (skill.stunPlayer) {
      setStunTimeLeft(STUN_DURATION_NORMAL / 1000);
      addLog(`😵 You are STUNNED by the impact!`);
    }

    if (skill.healMonster) {
      const heal = Math.floor(target.maxHp * 0.25);
      setEnemy(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + heal) }));
      addLog(`🩸 Monster HEALED +${heal} HP from your soul!`);
    }

    if (skill.disableSkills) {
      setSkillCooldown(10); // 10s Jam
      addLog(`📡 NEURAL JAM: Your Sync-Drive is offline for 10s!`);
    }
  }, [addLog, playSFX, SOUNDS, STUN_DURATION_NORMAL, setEnemy]);

  useEffect(() => {
    stunRef.current = stunTimeLeft;
    missRef.current = missTimeLeft;
    killsRef.current = killsInFloor;
    processingRef.current = combatState;
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
    processingRef.current = 'IDLE'; 
    setStunTimeLeft(0);
    setMissTimeLeft(0);
    setMonsterTurnCount(0); // Reset turn count for new monsters
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
    const stats = isBoss ? target : target; 
    
    const currentTurn = monsterTurnCount + 1;
    setMonsterTurnCount(currentTurn);

    // --- MONSTER SKILL TRIGGER LOGIC ---
    let usedSkill = false;
    if (target.skill && !target.hasUsedSkill) {
      const isAmbush = (currentTurn === 1 && (target.archetype === 'Speedster' || target.archetype === 'Sniper'));
      const isDesperation = (target.hp < (target.maxHp * 0.5) && (target.archetype === 'Tank' || target.archetype === 'Striker'));
      const isRandom = Math.random() < 0.20;

      if (isAmbush || isDesperation || isRandom) {
        triggerMonsterSkill(target.skill, target);
        usedSkill = true;
        setEnemy(prev => ({ ...prev, hasUsedSkill: true }));
      }
    }

    setTimeout(() => {
      setStrikingSide('monster');
      setTimeout(() => setStrikingSide(null), 300);
    }, 400);

    let hitChance = getHitChance(stats.dex, player?.agi || 10);
    // BLUR STRIKE: Monster Evasion Buff
    if (target.hasUsedSkill && target.archetype === 'Speedster') hitChance *= 1.2;
    if (battleMode === 'GVG') hitChance = Math.max(85, Math.min(100, hitChance * 1.5)); 
    
    if (Math.random() * 100 < hitChance) {
      const isCrit = Math.random() < (stats.critChance || 0.05);
      let dmg = Math.floor(getDamage(stats.str, totalStats.agi, isCrit));
      
      // CRUSHING IMPACT: 1.5x Dmg
      if (usedSkill && target.skill?.name === 'CRUSHING IMPACT') dmg = Math.floor(dmg * 1.5);

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
      triggerFloatingNumber(dmg, isCrit, 'player');

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

          // Capture run snapshot for Raid Summary Modal
          setDefeatData({
            killerName: target.name,
            killerDmg: dmg,
            floor: depth,
            kills: killsRef.current,
            sessionGX: sessionRewards?.tokens || 0,
            sessionXP: sessionRewards?.xp || 0,
            sessionLoots: sessionRewards?.loots || [],
          });

          setShowDefeatedWindow(true);
          setCombatState('DEFEATED');
          const remainingAutoTime = (player?.autoUntil || 0) > Date.now() ? player.autoUntil - Date.now() : 0;
          const destructUpdates = { hp: player?.maxHp || 1000, penaltyUntil: Date.now() + PENALTY_DURATION, hiredMate: null, buffUntil: 0, autoUntil: 0 };
          if (remainingAutoTime > 0) destructUpdates.autoTimeLeftSaved = remainingAutoTime;
          syncPlayer(destructUpdates);
          // No auto-redirect — player dismisses the Raid Summary Modal manually
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
  }, [showDefeatedWindow, player, totalStats, addLog, triggerHitEffects, syncPlayer, STUN_DURATION_CRIT, STUN_DURATION_NORMAL, PENALTY_DURATION, DEFEAT_WINDOW_DURATION, setDepth, setView, triggerFlinch, triggerHurt, battleMode, enemyRef, enemy, recordWarResult, gvgContext, triggerFloatingNumber, monsterTurnCount, triggerMonsterSkill]);

  const [isTreasury, setIsTreasury] = useState(false);
  const MAX_DUNGEON_DEPTH = 40;

  const handleTreasuryReached = useCallback(() => {
    setIsTreasury(true);
    setCombatState('VICTORY');
    if (setShowSuccessWindow) setShowSuccessWindow(true);
    addLog(`💎 TREASURY REACHED! Sector Node Cleared.`);
    playSFX(SOUNDS.levelup);

    const rewards = [];
    const updates = {};
    
    // --- Daily ETH Faucet Reward ---
    const today = new Date().toISOString().split('T')[0];
    const lastDate = player?.lastTreasuryFaucetClaimDate || "";
    
    if (lastDate !== today) {
      if (functions && player?.walletAddress) {
        console.log("💎 TREASURY FAUCET: Attempting reward transmission sequence...");
        const claimFaucet = httpsCallable(functions, 'claimFaucetReward');
        claimFaucet({ targetWalletAddress: player.walletAddress })
          .then((result) => {
            const data = result.data;
            if (data.success) {
              addLog(`💎 TREASURY REWARD: ETH subsidy transmitted!`);
              playSFX(SOUNDS.obtainLoot);
              syncPlayer({
                lastTreasuryFaucetClaimDate: today
              });
            } else {
              console.log(`💎 TREASURY_SIGNAL: ${data.message}`);
            }
          })
          .catch((e) => {
            console.warn("💎 TREASURY_FAUCET_ERROR:", e.message);
            if (e.message.includes("depleted")) {
               addLog("💎 FAUCET: The treasury is temporarily dry.");
            }
          });
      } else if (!player?.walletAddress) {
        addLog(`⚠️ TREASURY: No Wallet Uplink detected. ETH reward skipped.`);
      }
    } else {
      addLog(`⚠️ TREASURY: Daily ETH Claim already exhausted.`);
    }
    
    // Save remaining auto time if active right when treasury is reached for AFK safety
    const remainingAutoTime = (player?.autoUntil || 0) > Date.now() ? player.autoUntil - Date.now() : 0;
    if (remainingAutoTime > 0) {
      updates.autoTimeLeftSaved = remainingAutoTime;
      updates.autoUntil = 0;
    }
    
    // REWARD: 5 random auto scrolls (weighted)
    const scrollPool = [
      { id: 'auto_scroll_3m', weight: 40 },
      { id: 'auto_scroll_6m', weight: 35 },
      { id: 'auto_scroll_9m', weight: 15 },
      { id: 'auto_scroll_12m', weight: 10 }
    ];
    const totalScrollWeight = scrollPool.reduce((sum, s) => sum + s.weight, 0);

    let totalMinutesGained = 0;
    const scrollSpecs = {
      'auto_scroll': 1,
      'auto_scroll_3m': 3,
      'auto_scroll_6m': 6,
      'auto_scroll_9m': 9,
      'auto_scroll_12m': 12
    };

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

    const secureCommit = async () => {
      try {
        const callAction = httpsCallable(functions, 'secureGameAction');
        await callAction({
          action: 'CLAIM_TREASURY_REWARDS',
          payload: {
            rewards,
            autoTimeLeftSaved: updates.autoTimeLeftSaved
          }
        });
      } catch (e) {
        console.error("Treasury Secure Claim Failed:", e);
      }
    };

    setSessionRewards(prev => ({
      ...prev,
      loots: [...prev.loots, ...rewards]
    }));

    // Optimistic UI
    setPlayer(prev => ({
      ...prev,
      inventory: { ...prev.inventory, ...Object.fromEntries(rewards.map(r => [r.id, r])) },
      autoUntil: 0,
      autoTimeLeftSaved: updates.autoTimeLeftSaved || prev.autoTimeLeftSaved
    }));

    secureCommit();

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

  // Raid Summary Modal: player manually dismisses after defeat
  const handleDismissDefeat = useCallback((reenter = false) => {
    setDefeatData(null);
    resetCombatEngine();
    setDepth(1);
    setKillsInFloor(0);
    const isBossMode = view === 'boss';
    addLog(reenter ? "🔁 Re-entering sector..." : "🏃 Extraction confirmed. Returning to Command Center.");
    setView(reenter ? (isBossMode ? 'boss' : 'dungeon') : 'menu');
    if (reenter && !isBossMode) {
      spawnNewEnemy(1);
    }
  }, [resetCombatEngine, setDepth, setView, addLog, view, spawnNewEnemy]);

  const processKill = useCallback(() => {
    const e = enemyRef.current || enemy;
    const earnedXp = Math.floor(e.xp * (petMeta?.xpMult || 1.0));
    const earnedLoot = Math.floor(e.loot * (petMeta?.lootMult || 1.0));
    addLog(`Victory! Found ${earnedLoot} GX.`);
    
    // Accumulate Skill Energy on Kill
    if (skillCooldown <= 0 && !activeSkill) {
      setSkillEnergy(prev => Math.min(100, prev + 10));
    }

    if (petMeta && (petMeta.xpMult > 1 || petMeta.lootMult > 1)) {
        addLog(`✨ ${petMeta.name.toUpperCase()} PULSE: ${petMeta.xpMult > 1 ? `+${Math.round((petMeta.xpMult - 1) * 100)}% XP` : ''} ${petMeta.lootMult > 1 ? `+${Math.round((petMeta.lootMult - 1) * 100)}% GX` : ''} Bonus!`);
    }

    let nextXp = (player?.xp || 0) + earnedXp, nextLvl = player?.level || 1, nextMaxHp = player?.maxHp || 1000;
    let apGained = 0;
    let didLevelUp = false;
    
    const MAX_LEVEL = 100;
    const GX_PER_XP = 0.5;
    let overflowGx = 0;

    while (nextXp >= getXpRequired(nextLvl) && nextLvl < MAX_LEVEL) {
      nextXp -= getXpRequired(nextLvl);
      nextLvl++;
      nextMaxHp += 50;
      apGained += AP_PER_LEVEL;
      addLog(`LVL UP! +5 AP.`);
      didLevelUp = true;
    }

    if (nextLvl >= MAX_LEVEL) {
      overflowGx = nextXp * GX_PER_XP;
      nextXp = 0;
    }

    const updates = {
      tokens: (player?.tokens || 0) + earnedLoot + overflowGx,
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

        // Add small chance for schematics in deep floors
        if (depth >= 3 && Math.random() < 0.05) {
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
            // Standardize: Only base 1m essentials go to numeric counters.
            const isPotion = lootItem.id === 'hp_potion';
            const isScroll = lootItem.id === 'auto_scroll';
            let dropToTrack = lootItem;

            if (isPotion) {
               updates.potions = (player?.potions || 0) + 1;
            } else if (lootItem.id === 'auto_scroll') {
                // Standardize: Pool base 1m scrolls into numeric counter for "Energy (Mins)" UI.
                updates.autoScrolls = (player?.autoScrolls || 0) + 1;
                dropToTrack = { ...lootItem, id: `auto_scroll_pool_${Date.now()}` };
            } else if (lootItem.id?.startsWith('auto_scroll')) {
                const uniqueId = `${lootItem.id}_LOOT_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
                updates[`inventory.${uniqueId}`] = { ...lootItem, id: uniqueId };
                dropToTrack = { ...lootItem, id: uniqueId };
            } else {
               // Unique Inventory Item
               const itemWithId = { ...lootItem, id: `${lootItem.id}_${Date.now()}_${Math.floor(Math.random() * 9999)}` };
               updates[`inventory.${itemWithId.id}`] = itemWithId;
               setLastLoot(itemWithId);
               dropToTrack = itemWithId;
            }

            addLog(`🎁 LOOT: Found ${lootItem.name}!`);
            playSFX(SOUNDS.obtainLoot);
            setTimeout(() => setLastLoot(null), 3000);

            // --- AETHER SPARK PROTOCOL (Lv100 Elite Drops) ---
            let finalLootItems = [dropToTrack];
            if (player?.level >= 100 && enemy?.isElite && Math.random() < 0.10) {
              const spark = LOOTS.find(l => l.id === 'aether_spark');
              if (spark) {
                const sId = `aether_spark_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
                updates[`inventory.${sId}`] = { ...spark, id: sId };
                addLog(`✨ AETHER DISCOVERY: Found an Aether Spark!`);
                finalLootItems.push({ ...spark, id: sId });
              }
            }

            setSessionRewards(prev => ({
              tokens: prev.tokens + earnedLoot,
              xp: prev.xp + earnedXp,
              loots: [...prev.loots, ...finalLootItems]
            }));
          } else {
            // Check for Aether Spark even if normal loot roll fails
            let extraLoot = [];
            if (player?.level >= 100 && enemy?.isElite && Math.random() < 0.10) {
              const spark = LOOTS.find(l => l.id === 'aether_spark');
              if (spark) {
                const sId = `aether_spark_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
                updates[`inventory.${sId}`] = { ...spark, id: sId };
                addLog(`✨ AETHER DISCOVERY: Found an Aether Spark!`);
                extraLoot.push({ ...spark, id: sId });
              }
            }

            setSessionRewards(prev => ({
              tokens: prev.tokens + earnedLoot,
              xp: prev.xp + earnedXp,
              loots: [...prev.loots, ...extraLoot]
            }));
          }
        }
      }
    }

    // --- SECURE UPLINK: TRANSITION TO SERVER-SIDE STATE COMMIT ---
    const secureCommit = async () => {
      try {
        const callAction = httpsCallable(functions, 'secureGameAction');
        await callAction({
          action: 'PROCESS_KILL_REWARDS',
          payload: {
            earnedLoot,
            earnedXp,
            nextXp,
            nextLvl,
            nextMaxHp,
            apGained,
            loots: sessionRewards.loots.filter(l => !updates[`inventory.${l.id}`]) // Only include new loots
              .concat(Object.entries(updates).filter(([k]) => k.startsWith('inventory.')).map(([k, v]) => v))
          }
        });
      } catch (e) {
        console.error("Secure Reward Sync Failed:", e);
        addLog("🚨 UPLINK ERROR: Reward synchronization failed.");
      }
    };

    // We still update local state for immediate feedback
    setPlayer(prev => ({
      ...prev,
      tokens: (prev?.tokens || 0) + earnedLoot + overflowGx,
      xp: nextXp,
      level: nextLvl,
      maxHp: nextMaxHp,
      hp: updates.hp,
      abilityPoints: updates.abilityPoints || prev?.abilityPoints || 0
    }));

    secureCommit();

    const newKills = killsRef.current + 1;
    if (newKills >= 10 && depth >= MAX_DUNGEON_DEPTH) {
       handleTreasuryReached();
       return;
    }

    setShowVictoryWindow(true);
    setCombatState('VICTORY');

    setTimeout(() => {
      resetCombatEngine(); // RESET ALL LOCKS AND STATES
      if (newKills >= 10) {
        setKillsInFloor(0);
        const nextDepth = depth + 1;
        setDepth(nextDepth);
        addLog(`⬆️ FLOOR UP! Ascending to Floor ${nextDepth}...`);
        
        // --- STRATEGIC DEPTH SCORING V4 ---
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
        }
        
        spawnNewEnemy(nextDepth);
      } else {
        setKillsInFloor(newKills);
        spawnNewEnemy(depth);
      }
    }, 1500);

    if (didLevelUp) {
      setLevelUpEffectTrigger(prev => prev + 1);
    }

    if (battleMode === 'GVG') {
       recordWarResult(gvgContext.warId, 0, gvgContext.opponentId, 100);
       setBattleMode('DUNGEON');
       setTimeout(() => setView('syndicate'), 1500);
    }
  }, [enemy, player, addLog, selectedMap, syncPlayer, spawnNewEnemy, getXpRequired, AP_PER_LEVEL, LOOTS, battleMode, gvgContext, recordWarResult, setView, setBattleMode, depth, setDepth, killsRef, playSFX, SOUNDS, handleTreasuryReached, petMeta, SKILL_ENERGY_PER_KILL]);

  const processBossHit = useCallback(async (dmg, isCrit) => {
    // BUG-14 FIX: Raise cap to account for AllInOne (4x) + DoubleStrike (2x) = 8x valid multiplier
    const maxTheoreticalDamage = Math.max(5000, (totalStats.str || 10) * 500); 
    if (dmg < 0 || dmg > maxTheoreticalDamage) {
       addLog("🚨 SYSTEM ANOMALY: Unauthorized payload detected. Strike dismissed!");
       return; // Abort the hit injection
    }

    const newTotal = (player?.totalBossDamage || 0) + dmg;
    const updates = { totalBossDamage: newTotal };
    
    // 2. ECONOMY FIX: Hard Cap the exponential drop chance
    const milestoneMult = Math.pow(2, Math.floor(newTotal / 1000000));
    const currentDropChance = Math.min(0.12, BOSS.baseDropRate * milestoneMult); // Capped at 12% max
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

    // Schematic drop gated to 5% in deep floors only
    if (depth >= 5 && Math.random() < 0.05) {
      const schematics = LOOTS.filter(l => l.type === 'Schematic');
      if (schematics.length > 0) {
        const drop = schematics[Math.floor(Math.random() * schematics.length)];
        const dropId = `${drop.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        updates[`inventory.${dropId}`] = { ...drop, id: dropId };
        addLog(`📜 BLUEPRINT RECOVERED: ${drop.name}!`);
        playSFX(SOUNDS.obtainLoot);
      }
    }
    // Optimistic UI
    setPlayer(prev => ({ ...prev, totalBossDamage: newTotal, inventory: { ...prev.inventory, ...Object.fromEntries(Object.entries(updates).filter(([k]) => k.startsWith('inventory.')).map(([k, v]) => [(k.split('.')[1]), v])) } }));

    try {
      const callAction = httpsCallable(functions, 'secureGameAction');
      await callAction({
        action: 'PROCESS_BOSS_HIT',
        payload: {
          dmg,
          lootUpdates: Object.fromEntries(Object.entries(updates).filter(([k]) => k.startsWith('inventory.')).map(([k, v]) => [(k.split('.')[1]), v]))
        }
      });
    } catch (e) {
      console.error("Boss Hit Sync Failed:", e);
    }
    
    enemyTurn(BOSS, true);
  }, [player, addLog, syncPlayer, enemyTurn, EQUIPMENT, totalStats, BOSS, depth, LOOTS, playSFX, SOUNDS]);

  const processSquadSupport = useCallback((target, isBoss) => {
    if (activeSkill || monsterSkillActive || squadStrikeActive) return;
    
    // Squad trigger conditions
    const hasDragon = (player?.dragon?.summonUntil || 0) > Date.now();
    const hasMate = !!player?.hiredMate;
    const hasPet = !!player?.petId;

    if (!hasDragon && !hasMate && !hasPet) {
      return;
    }

    let triggerType = null;
    const rand = Math.random();
    if (hasDragon && rand < 0.25) triggerType = 'DRAGON';
    else if (hasMate && rand < 0.30) triggerType = 'MATE';
    else if (hasPet && rand < 0.35) triggerType = 'PET';

    // DEBUG LOG
    if (triggerType) {
      console.log(`🎯 SQUAD_TRIGGER: ${triggerType} (Rand: ${rand.toFixed(2)})`);
    }

    if (!triggerType) return;

    let supportData = null;
    if (triggerType === 'DRAGON') {
      supportData = {
        type: 'NAGA',
        name: 'TITAN CRUSH',
        description: 'MASSIVE IMPACT + DEFENSE DOWN',
        color: 'from-red-600 to-black',
        element: 'impact',
        energy: 15,
        dmgMult: 0.8 // 80% of player damage
      };
    } else if (triggerType === 'MATE') {
      const mate = TAVERN_MATES.find(m => m.id === player.hiredMate);
      supportData = {
        type: 'MATE',
        name: `${mate?.name || 'ALLY'} ASSIST`,
        description: 'COMBO STRIKE + ENERGY SURGE',
        color: 'from-blue-600 to-indigo-900',
        element: 'tech',
        energy: 8,
        dmgMult: 0.4,
        avatar: mate?.id
      };
    } else if (triggerType === 'PET') {
      const pet = Array.isArray(PETS_METADATA) ? PETS_METADATA.find(p => p.id === player.petId) : PETS_METADATA[player.petId];
      supportData = {
        type: 'PET',
        name: `${pet?.name || 'PET'} BURST`,
        description: `ELEMENTAL ${pet?.element?.toUpperCase() || 'PULSE'}`,
        color: 'from-emerald-500 to-teal-800',
        element: pet?.element?.toLowerCase() === 'pyro' ? 'fire' : pet?.element?.toLowerCase() === 'hydro' ? 'ice' : 'spark',
        energy: 5,
        dmgMult: 0.2
      };
    }

    if (supportData) {
      setSquadStrikeActive(supportData);
      setTimeout(() => setSquadStrikeActive(null), 800);

      // Apply effects
      const supportDmg = Math.floor(getDamage(totalStats.str, target.agi, false) * supportData.dmgMult);
      
      // Update energy
      if (skillCooldown <= 0 && !activeSkill) {
        setSkillEnergy(prev => Math.min(100, prev + supportData.energy));
      }

      addLog(`✨ SQUAD SUPPORT: ${supportData.name}! (-${supportDmg} DMG)`);
      
      // Delay the actual damage impact to match cut-in
      setTimeout(() => {
        const newHp = Math.max(0, target.hp - supportDmg);
        setEnemy(prev => ({ ...prev, hp: newHp }));
        triggerFloatingNumber(supportDmg, false, 'monster');
        if (newHp <= 0 && !isBoss) {
           processKill();
        }
      }, 400);
    }
  }, [player, activeSkill, monsterSkillActive, squadStrikeActive, TAVERN_MATES, PETS_METADATA, totalStats, skillCooldown, addLog, triggerFloatingNumber, setEnemy, processKill]);

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
    
    // --- AUTO-SKILL TRIGGER ---
    // If the hunter is in AUTO mode (has active scrolls), trigger skill immediately when ready
    if (skillEnergy >= 100 && !activeSkill && (player?.autoUntil || 0) > Date.now()) {
      triggerSkill();
    }

    processingRef.current = 'PLAYER_ATTACKING'; 
    setCombatState('PLAYER_ATTACKING');

    let stats = { ...totalStats };
    // Mate Proc Logic
    if (player?.hiredMate && (player?.buffUntil || 0) <= Date.now()) {
      const mate = TAVERN_MATES.find(m => m.id === player?.hiredMate);
      if (mate && (mate.procChance >= 1.0 || Math.random() < mate.procChance)) {
        const buffUntil = Date.now() + COMPANION_BUFF_DURATION;
        syncPlayer({ buffUntil });
        addLog(`✨ ${mate.name} activated their power!`);
        
        // Immediate Stat Injection: Apply multiplier to the local stats object 
        // so the CURRENT attack (down the line at L452) benefits from it.
        const mult = mate.multiplier || 2;
        if (mate.type === 'STR') stats.str *= mult;
        if (mate.type === 'AGI') stats.agi *= mult;
        if (mate.type === 'DEX') stats.dex *= mult;
        // NOTE: totalStats will catch up in the NEXT render via syncPlayer trigger.
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
            elementalMultiplier = 0.25;
        }
    }

    setStrikingSide('player');
    setTimeout(() => setStrikingSide(null), 300);

      let hitChance = getHitChance(stats.dex, target.agi);
      if (battleMode === 'GVG') hitChance = Math.max(85, Math.min(100, hitChance * 1.5)); 
      
      // GALE SKILL: High evasion override
      if (activeSkill?.name === 'PHANTOM VELOCITY') hitChance = 100;

      if (Math.random() * 100 < hitChance) {
        if (skillCooldown <= 0 && !activeSkill) {
           const energyGain = activeSkill?.name === 'TECTONIC FORTRESS' ? 0 : (activeSkill?.name === 'IGNITION OVERDRIVE' ? 0 : (Math.random() < getCritChance(stats.dex, depth) ? 6 : 2));
           setSkillEnergy(prev => Math.min(100, prev + energyGain));
        }
        const critChance = getCritChance(stats.dex, depth);
        
        // EARTHEN SKILL: Guaranteed Crits
        const isCrit = activeSkill?.name === 'TECTONIC FORTRESS' ? true : (Math.random() < critChance);
        
        let dmg = Math.floor(getDamage(stats.str, target.agi, isCrit) * elementalMultiplier);

        // PYRO SKILL: 50% Damage Buff
        if (activeSkill?.name === 'IGNITION OVERDRIVE') dmg = Math.floor(dmg * 1.5);

      const effects = Object.values(player?.equipped || {}).filter(i => i?.effect).map(i => i.effect);
      const critSpike = effects.find(e => e?.type === 'CritSpike');
      if (isCrit && critSpike) {
          dmg = Math.floor(dmg * (critSpike.mult / 2.5));
          addLog(`✨ CRIT SPIKE!`);
      }
      const doubleStrike = effects.find(e => e?.type === 'DoubleStrike');
      if (doubleStrike && Math.random() < doubleStrike.chance) {
          dmg *= 2;
          addLog(`⚔️ DOUBLE STRIKE!`);
      }
      const lifesteal = effects.find(e => e?.type === 'LifeSteal');
      if (lifesteal && Math.random() < lifesteal.chance) {
          const heal = Math.floor(dmg * lifesteal.amount);
          syncPlayer({ hp: Math.min(totalStats.maxHp, (player?.hp || 0) + heal) });
          addLog(`🩸 LIFESTEAL: +${heal} HP`);
      }
      const allInOne = effects.find(e => e?.type === 'AllInOne');
      if (allInOne && Math.random() < allInOne.chance) {
          dmg *= 4;
          addLog(`🧿 OMEGA OVERLOAD: 4x DMG!`);
      }

      triggerHitEffects(dmg, isCrit, 'monster', triggerFlinch, triggerHurt);
      triggerFloatingNumber(dmg, isCrit, 'monster');

      const pTaunts = ["Take this!", "Direct strike!", "Weak!", "Begone!", "Target locked!", "Hunter's Fury!", "Maximum output!"];
      setPlayerTaunt(pTaunts[Math.floor(Math.random() * pTaunts.length)]);
      addLog(`Struck ${target.name} for ${dmg} DMG.`);
      playSFX(SOUNDS.playerAttack); // PLAY IMPACT SOUND ON HIT

      // --- SQUAD TACTICAL SUPPORT ---
      processSquadSupport(target, isBoss);

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
  }, [player, enemy, showDefeatedWindow, combatState, totalStats, syncPlayer, addLog, triggerHitEffects, processBossHit, processKill, enemyTurn, setEnemy, COMPANION_BUFF_DURATION, ELEMENT_ADVANTAGE, selectedMap, triggerFlinch, triggerHurt, battleMode, recordWarResult, gvgContext, setView, setBattleMode, stunRef, missRef, showVictoryWindow, TAVERN_MATES, playSFX, SOUNDS, activeSkill, skillEnergy, triggerSkill, SKILL_ENERGY_PER_HIT, SKILL_ENERGY_PER_CRIT, triggerFloatingNumber, depth, skillCooldown]);

  const recordGvGResult = useCallback(() => {
    if (battleMode !== 'GVG') return;
    const damagePercent = Math.min(100, Math.floor(((enemy.maxHp - enemy.hp) / enemy.maxHp) * 100));
    recordWarResult(gvgContext.warId, 0, gvgContext.opponentId, damagePercent);
    setBattleMode('DUNGEON');
    setTimeout(() => setView('syndicate'), 1500);
  }, [battleMode, enemy, gvgContext, recordWarResult, setBattleMode, setView]);

  const handleRetreat = useCallback(() => {
    if (processingRef.current === 'RETREATING') return;
    
    if (battleMode === 'GVG') {
      // BUG-13 FIX: Reset session rewards on GVG retreat
      setSessionRewards({ tokens: 0, xp: 0, loots: [] });
      recordGvGResult();
    } else {
      processingRef.current = 'RETREATING';
      // WIPE SESSION REWARDS FOR NEXT RUN
      setSessionRewards({ tokens: 0, xp: 0, loots: [] });
      setKillsInFloor(0);
      resetCombatEngine(); // NUCLEAR RESET ON RETREAT
      
      // BUG-Fix: Clear enemy from state to prevent UI rendering stale data
      if (clearEnemy) clearEnemy();
      
      setView('menu');
      setDepth(1);

      // System Pulse: Critical State Sync must be immediate to prevent refresh-race-conditions
      const remainingAutoTime = (player?.autoUntil || 0) > Date.now() ? player.autoUntil - Date.now() : 0;
      const closingUpdates = { autoUntil: 0 };
      if (remainingAutoTime > 0) closingUpdates.autoTimeLeftSaved = remainingAutoTime;
      syncPlayer(closingUpdates, true);
      
      // Release retreat lock after transition
      setTimeout(() => {
        if (processingRef.current === 'RETREATING') processingRef.current = 'IDLE';
      }, 500);
    }
  }, [battleMode, recordGvGResult, setView, setDepth, player?.autoUntil, syncPlayer, resetCombatEngine, clearEnemy]);

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
    setShowVictoryWindow,
    handleCloseVictoryWindow,
    sessionRewards,
    killsInFloor,
    lastLoot,
    levelUpEffectTrigger,
    penaltyRemaining,
    floatingNumbers,
    skillEnergy,
    activeSkill,
    skillDuration,
    skillCooldown,
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
    isTreasury,
    handleRetreat,
    triggerSkill,
    monsterSkillActive,
    squadStrikeActive,
    defeatData,
    setDefeatData,
    handleDismissDefeat
  };
};
