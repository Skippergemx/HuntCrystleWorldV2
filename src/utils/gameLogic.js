// Game Constants and Math Utilities

export const DIFFICULTY_MULTIPLIER = 1.04;
export const XP_BASE = 60; // Phase 4: Lowered from 100 for faster early-game pacing to Lv30
/**
 * Calculates XP required for next level (Phase 3 Exponential Scaling)
 */
export const getXpRequired = (level) => Math.floor(XP_BASE * Math.pow(level, 1.5));
export const AP_PER_LEVEL = 5;
export const MAX_CRIT_CHANCE = 0.25; // Phase 4: Capped at 25% (was 50%) — prevents deep-floor perma-stun
export const BASE_CRIT_CHANCE = 0.05;
export const CRIT_SCALING_PER_FLOOR = 0.01;

export const PENALTY_DURATION = 30000;
export const STUN_DURATION_NORMAL = 2000;
export const STUN_DURATION_CRIT = 4000;
export const DEFEAT_WINDOW_DURATION = 3000;
export const AUTO_SCROLL_DURATION = 60000;
export const COMPANION_BUFF_DURATION = 30000; // Phase 4: Extended from 10s to 30s — buffs feel meaningful

/**
 * Calculates a scaled monster based on floor depth
 */
export const scaleMonster = (baseMonster, depth) => {
  const powerMultiplier = Math.pow(DIFFICULTY_MULTIPLIER, depth - 1);
  
  // ARCHETYPE DETECTION: Identify the monster's "Class" based on its highest base stat
  const stats = [
    { type: 'tank', val: baseMonster.hp / 10 }, 
    { type: 'speedster', val: baseMonster.agi },
    { type: 'striker', val: baseMonster.str },
    { type: 'sniper', val: baseMonster.dex }
  ];
  const archetype = stats.reduce((prev, current) => (prev.val > current.val) ? prev : current).type;

  // Archetype Scaling Factors: Dominant stats scale 25% faster
  const hpMult = archetype === 'tank' ? powerMultiplier * 1.25 : powerMultiplier;
  const strMult = archetype === 'striker' ? powerMultiplier * 1.20 : powerMultiplier;
  const agiMult = archetype === 'speedster' ? powerMultiplier * 1.30 : powerMultiplier;
  const dexMult = archetype === 'sniper' ? powerMultiplier * 1.25 : powerMultiplier;

  // General Accuracy Scaling (kept separate for global difficulty)
  const globalAccuracyMultiplier = 1 + ((depth - 1) * 0.08);
  
  // Elite Logic
  const isElite = Math.random() < 0.10; // 10% Elite Chance
  const eliteHpMult = isElite ? 2.0 : 1;
  const eliteStrMult = isElite ? 1.5 : 1;
  
  return {
    ...baseMonster,
    hp: Math.floor(baseMonster.hp * hpMult * eliteHpMult),
    maxHp: Math.floor(baseMonster.hp * hpMult * eliteHpMult),
    str: Math.floor(baseMonster.str * strMult * eliteStrMult),
    agi: Math.floor(baseMonster.agi * agiMult * globalAccuracyMultiplier),
    dex: Math.floor(baseMonster.dex * dexMult * globalAccuracyMultiplier),
    xp: Math.floor(baseMonster.xp * powerMultiplier * (isElite ? 2 : 1)),
    loot: Math.floor(baseMonster.loot * powerMultiplier * (isElite ? 2 : 1)),
    critChance: Math.min(MAX_CRIT_CHANCE, BASE_CRIT_CHANCE + ((depth - 1) * CRIT_SCALING_PER_FLOOR)),
    archetype: archetype,
    powerLevel: powerMultiplier,
    isElite: isElite,
    baseName: baseMonster.name,
    name: isElite ? `CHAMPION ${baseMonster.name}` : baseMonster.name,
    skill: MONSTER_SKILLS[archetype.charAt(0).toUpperCase() + archetype.slice(1)]
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
      // Phase 4: HP bonus is ALWAYS permanent — independent of buff timer
      if (mate.hpBonus) stats.maxHp += mate.hpBonus;
      // Stat multipliers only apply when buff is actively proc'd
      if (mate.procChance >= 1.0 || buffActive) {
        const mult = mate.multiplier || 2;
        if (mate.type === 'STR') stats.str *= mult;
        if (mate.type === 'AGI') stats.agi *= mult;
        if (mate.type === 'DEX') stats.dex *= mult;
      }
    }
  }

  // Apply Dragon Buffs (Requires Dragon to be Summoned)
  if (player.dragon && player.dragon.level > 0 && dragonActive) {
    const dragonBonus = 15 * player.dragon.level; // Phase 4: Raised from 5 to 15 — competitive vs Titan
    stats.str += dragonBonus;
    stats.agi += dragonBonus;
    stats.dex += dragonBonus;
  }

  // Apply GEMX Bonuses (New Elemental System)
  if (player.gemx && player.gemx.level > 0) {
    const lvl = player.gemx.level;
    const element = player.gemxElement;
    if (element === 'Pyro') { stats.str += lvl * 2; stats.agi += lvl; }
    else if (element === 'Earthen') { stats.dex += 2 * lvl; stats.str += lvl; }
    else if (element === 'Hydro') { stats.str += lvl; stats.dex += lvl; stats.agi += lvl; }
    else if (element === 'Gale') { stats.agi += 2 * lvl; stats.dex += lvl; }
  }

  // Apply Crystle Pet Buffs & Set Bonuses
  let petStatsMult = 1.0;
  const unlockedPets = player.unlockedPets || [];
  
  if (unlockedPets.length > 0) {
    const counts = { 'Pyro': 0, 'Hydro': 0, 'Gale': 0, 'Earthen': 0, 'Cosmic': 0 };
    unlockedPets.forEach(id => {
      const p = PETS_METADATA.find(pm => pm.id === id);
      if (p && counts[p.element] !== undefined) counts[p.element]++;
    });

    // Calculate Highest Set Multiplier
    Object.values(counts).forEach(count => {
      if (count >= 10) petStatsMult = Math.max(petStatsMult, 1.20);
      else if (count >= 6) petStatsMult = Math.max(petStatsMult, 1.12);
      else if (count >= 3) petStatsMult = Math.max(petStatsMult, 1.05);
    });
  }

  if (player.petId) {
    const activePet = PETS_METADATA.find(p => p.id === player.petId);
    if (activePet) {
      // Pet level multiplier: +15% per level above 1
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

  // Apply Food Buff (short-term flat bonus)
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

  // Final Safety Rounding
  stats.str = Math.floor(stats.str);
  stats.agi = Math.floor(stats.agi);
  stats.dex = Math.floor(stats.dex);

  return stats;
};

/**
 * Maps a monster or dungeon folder to its corresponding element for taming
 */
export const getMonsterElement = (monster) => {
  if (!monster) return 'Cosmic';
  
  const folderToElement = {
    'Inferno Crater': 'Pyro',
    'Tectonic Ridge': 'Earthen',
    'Abyssal Trench': 'Hydro',
    'Gale Empire': 'Gale',
    'Void Sector 7': 'Cosmic',
    'Neon Slums': 'Cosmic',
    'Rust Canyon': 'Earthen',
    'Crystal Peak': 'Gale',
    'Shadow Fen': 'Cosmic'
  };

  if (monster.folder && folderToElement[monster.folder]) {
    return folderToElement[monster.folder];
  }
  
  // Fallback to ID-based prefix (e.g., pyro_slime -> Pyro)
  const idPrefix = monster.id?.split('_')[0]?.toLowerCase();
  const validElements = ['pyro', 'hydro', 'gale', 'earthen', 'cosmic'];
  if (validElements.includes(idPrefix)) {
    return idPrefix.charAt(0).toUpperCase() + idPrefix.slice(1);
  }

  // Explicit Cosmic list for specialty monsters
  const cosmicIds = ['null_stalker', 'void_wraith', 'abyssal_crawler', 'singularity_orb', 'quantum_shade', 'gravity_eater', 'dimensional_shifter', 'entropy_golem', 'rift_lurker', 'paradox_husk'];
  if (cosmicIds.includes(monster.id)) return 'Cosmic';
  
  return 'Cosmic'; // Default
};

/**
 * Calculates Naga (Dragon) Combat Stats for Naga Wars
 * Factors in Dragon Level for base stats, and Gemx Level for Shield HP and bonus stats.
 */
export const calculateNagaStats = (player, labLevel = 0) => {
  const dragon = player?.dragon || { level: 1 };
  const gemx = player?.gemx || { level: 1 };
  const element = player?.gemxElement || 'Cosmic';

  // Base Naga Stats
  let maxHp = dragon.level * 500;
  let str = dragon.level * 20; 
  let agi = dragon.level * 10;
  let dex = dragon.level * 15;

  // Gemx acts as an HP Shield
  const shieldHp = gemx.level * 300;

  // Modify base stats depending on the Element of the Gemx equipped
  if (element === 'Pyro') { str += gemx.level * 5; agi += gemx.level * 2; }
  else if (element === 'Earthen') { dex += gemx.level * 8; maxHp += gemx.level * 50; }
  else if (element === 'Hydro') { str += gemx.level * 3; dex += gemx.level * 5; }
  else if (element === 'Gale') { agi += gemx.level * 8; }

  if (labLevel > 0) {
      const buffMultiplier = 1 + (labLevel * 0.05); // 5% per lab level
      str *= buffMultiplier;
      agi *= buffMultiplier;
      dex *= buffMultiplier;
      maxHp *= buffMultiplier;
  }

  return {
    level: dragon.level,
    gemxLevel: gemx.level,
    element: element,
    maxHp: maxHp,
    shieldHp: shieldHp,
    totalMaxHp: maxHp + shieldHp,
    str: Math.floor(str),
    agi: Math.floor(agi),
    dex: Math.floor(dex)
  };
};

/**
 * Elemental Affinity System
 */
export const ELEMENT_ADVANTAGE = {
  'Pyro': 'Earthen',
  'Earthen': 'Hydro',
  'Hydro': 'Gale',
  'Gale': 'Pyro'
};

/**
 * Combat Math: Hit Chance (DEX vs AGI)
 */
export const getHitChance = (attackerDex, defenderAgi) => {
  const ratio = attackerDex / (attackerDex + defenderAgi * 0.55);
  const chance = ratio * 140; 
  return Math.max(25, Math.min(98, Math.floor(chance)));
};

/**
 * Combat Math: Damage (STR vs AGI Mitigation)
 */
export const getDamage = (attackerStr, defenderAgi, isCrit = false) => {
  const dmgBase = (attackerStr * 1.35) - (defenderAgi * 0.25);
  const variance = Math.floor(Math.random() * (attackerStr * 0.1));
  const finalDmg = isCrit ? Math.floor((dmgBase + variance) * 2.5) : Math.floor(dmgBase + variance);
  return Math.max(10, finalDmg);
};

/**
 * Combat Math: Crit Chance (DEX Scaling)
 */
export const getCritChance = (attackerDex, depth = 1, baseCrit = BASE_CRIT_CHANCE) => {
  const dexBonus = (attackerDex / (attackerDex + 400)) * 0.25;
  const depthBonus = (depth - 1) * 0.005;
  return Math.min(0.40, baseCrit + dexBonus + depthBonus);
};

/**
 * Elemental Resonance Skills (Limit Breaks)
 */
export const SKILL_ENERGY_PER_HIT = 2;
export const SKILL_ENERGY_PER_CRIT = 6;
export const SKILL_ENERGY_PER_KILL = 10;
export const SKILL_COOLDOWN_DURATION = 20; // 20s lock after skill ends

export const MONSTER_SKILLS = {
  'Tank': {
    name: "CRUSHING IMPACT",
    description: "MASSIVE HIT + STUN",
    color: "from-slate-700 to-black",
    effect: (dmg) => Math.floor(dmg * 1.5),
    stunPlayer: true
  },
  'Striker': {
    name: "VAMPIRIC SOUL-DRAIN",
    description: "DAMAGE + MONSTER HEAL",
    color: "from-purple-900 to-indigo-900",
    healMonster: true
  },
  'Speedster': {
    name: "BLUR STRIKE",
    description: "MONSTER EVASION BOOST",
    color: "from-blue-900 to-cyan-900",
    monsterEvasion: true
  },
  'Sniper': {
    name: "NEURAL JAMMER",
    description: "DISBALES PLAYER SKILLS",
    color: "from-red-900 to-black",
    disableSkills: true
  }
};

export const ELEMENTAL_SKILLS = {
  'Pyro': {
    name: "IGNITION OVERDRIVE",
    icon: "🔥",
    color: "from-orange-600 to-red-600",
    particleType: "fire",
    description: "MASSIVE DAMAGE + 50% DMG BUFF",
    duration: 15, // Seconds
    effect: (stats) => ({ ...stats, str: stats.str * 1.5 })
  },
  'Hydro': {
    name: "STASIS PROTOCOL",
    icon: "💧",
    color: "from-blue-500 to-cyan-500",
    particleType: "ice",
    description: "40% HEAL + 6S TARGET STUN",
    duration: 6,
    healPerc: 0.4,
    stunDuration: 6
  },
  'Gale': {
    name: "PHANTOM VELOCITY",
    icon: "⚡",
    color: "from-purple-500 to-pink-500",
    particleType: "tech",
    description: "100% EVASION + 2X TURN SPEED",
    duration: 10,
    effect: (stats) => ({ ...stats, agi: stats.agi * 10 }) // Effectively 100% dodge
  },
  'Earthen': {
    name: "TECTONIC FORTRESS",
    icon: "⛰️",
    color: "from-emerald-600 to-green-600",
    particleType: "impact",
    description: "50% MAX HP SHIELD + 100% CRIT",
    duration: 10,
    shieldPerc: 0.5
  },
  'Cosmic': {
    name: "SINGULARITY BREACH",
    icon: "✨",
    color: "from-cyan-400 to-indigo-500",
    particleType: "spark",
    description: "20% HP EXECUTION + RESET COOLDOWNS",
    duration: 1,
    execPerc: 0.2
  }
};

export const BOSS = {
  name: "The Core Guardian",
  level: 500,
  hp: 25000000, 
  str: 1500,    
  agi: 1000,    
  dex: 1200,    
  critChance: 0.30,
  baseDropRate: 0.1, 
  taunts: ["I am the final obstacle!", "Your stats are inefficient.", "Kneel before the Core!"],
  archetype: 'Tank',
  skill: MONSTER_SKILLS['Tank']
};

export const BOSS_MEDIA_FILES = [
  { img: '/assets/bossmonster/DungeonGemBoss (1).jpg', vid: '/assets/bossmonstervideo/DungeonGemBoss (1) video.mp4' },
  { img: '/assets/bossmonster/CrystleHunterAvatar (30).jpg', vid: '/assets/bossmonstervideo/DungeonGemBoss (2) video.mp4' }
];
