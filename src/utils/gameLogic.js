/**
 * Monster Archetypes for tactical diversity
 */
export const MONSTER_ARCHETYPES = {
  TANK: 'TANK',           // High HP/Def, Slow
  ASSASSIN: 'ASSASSIN',   // High AGI, High Crit, Low HP
  SNIPER: 'SNIPER',       // High DEX/STR, Low AGI
  BALANCED: 'BALANCED'    // Standard scaling
};

/**
 * Calculates a scaled monster based on floor depth and archetype
 */
export const scaleMonster = (baseMonster, depth) => {
  const powerMultiplier = Math.pow(DIFFICULTY_MULTIPLIER, depth - 1);
  
  // Determine Archetype based on base stats
  let archetype = MONSTER_ARCHETYPES.BALANCED;
  if (baseMonster.hp >= 150) archetype = MONSTER_ARCHETYPES.TANK;
  else if (baseMonster.agi >= baseMonster.str * 1.5) archetype = MONSTER_ARCHETYPES.ASSASSIN;
  else if (baseMonster.dex >= baseMonster.str * 1.5) archetype = MONSTER_ARCHETYPES.SNIPER;

  // Archetype Modifiers
  const mods = {
    hp: archetype === MONSTER_ARCHETYPES.TANK ? 1.6 : 1.0,
    str: archetype === MONSTER_ARCHETYPES.SNIPER ? 1.3 : 1.0,
    agi: archetype === MONSTER_ARCHETYPES.ASSASSIN ? 1.5 : (archetype === MONSTER_ARCHETYPES.TANK ? 0.6 : 1.0),
    dex: archetype === MONSTER_ARCHETYPES.SNIPER ? 1.5 : 1.0
  };

  const accuracyMultiplier = 1 + ((depth - 1) * 0.12); // Slightly higher scaling to pressure AGI builds
  
  return {
    ...baseMonster,
    archetype,
    hp: Math.floor(baseMonster.hp * powerMultiplier * mods.hp),
    maxHp: Math.floor(baseMonster.hp * powerMultiplier * mods.hp),
    str: Math.floor(baseMonster.str * powerMultiplier * mods.str),
    agi: Math.floor(baseMonster.agi * accuracyMultiplier * mods.agi),
    dex: Math.floor(baseMonster.dex * accuracyMultiplier * mods.dex),
    xp: Math.floor(baseMonster.xp * powerMultiplier),
    loot: Math.floor(baseMonster.loot * powerMultiplier),
    critChance: Math.min(MAX_CRIT_CHANCE, BASE_CRIT_CHANCE + ((depth - 1) * CRIT_SCALING_PER_FLOOR)),
    powerLevel: powerMultiplier
  };
};

/**
 * Calculates player stats with equipment and buffs
 */
export const calculateStats = (player, tavernMates, buffActive, dragonActive, PETS_METADATA = []) => {
  if (!player) return { str: 0, agi: 0, dex: 0, maxHp: 100 };
  
  const stats = { 
    str: player.baseStats?.str || 0, 
    agi: player.baseStats?.agi || 0, 
    dex: player.baseStats?.dex || 0,
    maxHp: player.maxHp || 100
  };
  
  // Add equipment stats
  Object.values(player.equipped || {}).forEach(item => {
    if (item && item.stats) {
      stats.str += item.stats.str || 0;
      stats.agi += item.stats.agi || 0;
      stats.dex += item.stats.dex || 0;
    }
  });

  // Apply Mate Buffs
  if (player.hiredMate) {
    const mate = tavernMates.find(m => m.id === player.hiredMate);
    if (mate) {
      if (mate.hpBonus) stats.maxHp += mate.hpBonus;
      if (mate.procChance >= 1.0 || buffActive) {
        const mult = mate.multiplier || 2;
        if (mate.type === 'STR') stats.str *= mult;
        if (mate.type === 'AGI') stats.agi *= mult;
        if (mate.type === 'DEX') stats.dex *= mult;
      }
    }
  }

  // Apply Dragon Buffs
  if (player.dragon && player.dragon.level > 0 && dragonActive) {
    const dragonBonus = 15 * player.dragon.level;
    stats.str += dragonBonus;
    stats.agi += dragonBonus;
    stats.dex += dragonBonus;
  }

  // Apply Elemental Bonuses
  if (player.gemx && player.gemx.level > 0) {
    const lvl = player.gemx.level;
    const element = player.gemxElement;
    if (element === 'Pyro') { stats.str += lvl; stats.agi += lvl; }
    else if (element === 'Earthen') { stats.dex += 2 * lvl; }
    else if (element === 'Hydro') { stats.str += lvl; stats.dex += lvl; }
    else if (element === 'Gale') { stats.agi += 2 * lvl; }
  }

  // Pet Multipliers
  let petStatsMult = 1.0;
  const unlockedPets = player.unlockedPets || [];
  if (unlockedPets.length > 0) {
    const counts = { 'Pyro': 0, 'Hydro': 0, 'Gale': 0, 'Earthen': 0, 'Cosmic': 0 };
    unlockedPets.forEach(id => {
      const p = PETS_METADATA.find(pm => pm.id === id);
      if (p && counts[p.element] !== undefined) counts[p.element]++;
    });
    Object.values(counts).forEach(count => {
      if (count >= 10) petStatsMult = Math.max(petStatsMult, 1.20);
      else if (count >= 6) petStatsMult = Math.max(petStatsMult, 1.12);
      else if (count >= 3) petStatsMult = Math.max(petStatsMult, 1.05);
    });
  }

  if (player.petId) {
    const activePet = PETS_METADATA.find(p => p.id === player.petId);
    if (activePet) {
      const petLvl = player.petLevels?.[activePet.id] || player.petLevel || 1;
      const levelMult = 1 + ((petLvl - 1) * 0.15);
      stats.maxHp += Math.floor((activePet.hpBonus || 0) * levelMult);
      stats.str += Math.floor((activePet.strBonus || 0) * levelMult);
      stats.agi += Math.floor((activePet.agiBonus || 0) * levelMult);
      stats.dex += Math.floor((activePet.dexBonus || 0) * levelMult);
    }
  }

  stats.str *= petStatsMult;
  stats.agi *= petStatsMult;
  stats.dex *= petStatsMult;

  // Food Effects
  const now = Date.now();
  if (player.activeFoodEffect && (player.activeFoodUntil || 0) > now) {
    const fx = player.activeFoodEffect;
    if (fx.stat === 'str') stats.str += fx.amount || 0;
    else if (fx.stat === 'dex') stats.dex += fx.amount || 0;
    else if (fx.stat === 'agi') stats.agi += fx.amount || 0;
    if (fx.stat2 === 'str') stats.str += fx.amount2 || 0;
    else if (fx.stat2 === 'dex') stats.dex += fx.amount2 || 0;
    else if (fx.stat2 === 'agi') stats.agi += fx.amount2 || 0;
  }

  stats.str = Math.floor(stats.str);
  stats.agi = Math.floor(stats.agi);
  stats.dex = Math.floor(stats.dex);

  return stats;
};

/**
 * Calculates Naga (Dragon) Combat Stats
 */
export const calculateNagaStats = (player, labLevel = 0) => {
  const dragon = player?.dragon || { level: 1 };
  const gemx = player?.gemx || { level: 1 };
  const element = player?.gemxElement || 'Cosmic';

  let maxHp = dragon.level * 500;
  let str = dragon.level * 20; 
  let agi = dragon.level * 10;
  let dex = dragon.level * 15;
  const shieldHp = gemx.level * 300;

  if (element === 'Pyro') { str += gemx.level * 5; agi += gemx.level * 2; }
  else if (element === 'Earthen') { dex += gemx.level * 8; maxHp += gemx.level * 50; }
  else if (element === 'Hydro') { str += gemx.level * 3; dex += gemx.level * 5; }
  else if (element === 'Gale') { agi += gemx.level * 8; }

  if (labLevel > 0) {
      const buffMultiplier = 1 + (labLevel * 0.05);
      str *= buffMultiplier; agi *= buffMultiplier; dex *= buffMultiplier; maxHp *= buffMultiplier;
  }

  return {
    level: dragon.level, gemxLevel: gemx.level, element: element,
    maxHp, shieldHp, totalMaxHp: maxHp + shieldHp,
    str: Math.floor(str), agi: Math.floor(agi), dex: Math.floor(dex)
  };
};

export const ELEMENT_ADVANTAGE = {
  'Pyro': 'Earthen', 'Earthen': 'Hydro', 'Hydro': 'Gale', 'Gale': 'Pyro'
};

/**
 * Combat Math: Hit Chance
 * AGI now acts as a significantly more powerful evasion stat.
 * Returns { chance, resultType: 'HIT' | 'EVADE' }
 */
export const getHitChance = (attackerDex, defenderAgi) => {
  // AGI evasion scaling is more aggressive now (0.5 weight)
  const chance = (attackerDex / (attackerDex + defenderAgi * 0.5)) * 100;
  const finalChance = Math.max(25, Math.min(98, Math.floor(chance)));
  
  const roll = Math.random() * 100;
  return {
    chance: finalChance,
    isHit: roll <= finalChance,
    resultType: roll <= finalChance ? 'HIT' : 'EVADE'
  };
};

/**
 * Combat Math: Damage
 * Returns { damage, isCrit, resultType: 'NORMAL' | 'CRITICAL' | 'GLANCING' }
 */
export const getDamage = (attackerStr, attackerDex, defenderAgi, baseCritChance = 0.05) => {
  // 1. Determine CRIT (Now heavily dependent on DEX)
  // DEX provides up to +20% additional crit chance
  const dexBonus = Math.min(0.20, attackerDex / 1000); 
  const totalCritChance = Math.min(MAX_CRIT_CHANCE, baseCritChance + dexBonus);
  const isCrit = Math.random() < totalCritChance;

  // 2. Base Damage Calculation
  const dmgBase = (attackerStr * 1.25) + Math.floor(Math.random() * 10);
  
  // 3. AGI Mitigation (Glancing Hits)
  // If defender AGI is high relative to attacker STR, damage is "Glanced"
  const mitigation = defenderAgi * 0.25; // 2.5x more effective mitigation than before
  let finalDmg = dmgBase - mitigation;
  
  let resultType = isCrit ? 'CRITICAL' : 'NORMAL';
  
  // If mitigation reduced damage by more than 40%, it's a Glancing Hit
  if (!isCrit && mitigation > (dmgBase * 0.4)) {
    resultType = 'GLANCING';
  }

  if (isCrit) finalDmg *= 2.5;

  return {
    damage: Math.max(5, Math.floor(finalDmg)),
    isCrit,
    resultType
  };
};

export const BOSS = {
  name: "The Core Guardian",
  level: 500, hp: 10000000, str: 1000, agi: 800, dex: 700, critChance: 0.25,
  baseDropRate: 0.1,
  taunts: ["I am the final obstacle!", "Your journey ends here.", "Kneel before the Core!"]
};

export const BOSS_MEDIA_FILES = [
  { img: '/assets/bossmonster/DungeonGemBoss (1).jpg', vid: '/assets/bossmonstervideo/DungeonGemBoss (1) video.mp4' },
  { img: '/assets/bossmonster/CrystleHunterAvatar (30).jpg', vid: '/assets/bossmonstervideo/DungeonGemBoss (2) video.mp4' }
];
