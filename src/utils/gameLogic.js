// Game Constants and Math Utilities

export const DIFFICULTY_MULTIPLIER = 1.04;
export const XP_BASE = 100;
/**
 * Calculates XP required for next level (Phase 3 Exponential Scaling)
 */
export const getXpRequired = (level) => Math.floor(XP_BASE * Math.pow(level, 1.5));
export const AP_PER_LEVEL = 5;
export const MAX_CRIT_CHANCE = 0.5;
export const BASE_CRIT_CHANCE = 0.05;
export const CRIT_SCALING_PER_FLOOR = 0.01;

export const PENALTY_DURATION = 30000;
export const STUN_DURATION_NORMAL = 2000;
export const STUN_DURATION_CRIT = 4000;
export const DEFEAT_WINDOW_DURATION = 3000;
export const AUTO_SCROLL_DURATION = 60000;
export const COMPANION_BUFF_DURATION = 10000;

/**
 * Calculates a scaled monster based on floor depth
 */
export const scaleMonster = (baseMonster, depth) => {
  const powerMultiplier = Math.pow(DIFFICULTY_MULTIPLIER, depth - 1);
  // Phase 2: Softened monster AGI scaling (0.1 instead of 0.15) to keep DEX relevant.
  const accuracyMultiplier = 1 + ((depth - 1) * 0.10);
  
  return {
    ...baseMonster,
    hp: Math.floor(baseMonster.hp * powerMultiplier),
    maxHp: Math.floor(baseMonster.hp * powerMultiplier),
    str: Math.floor(baseMonster.str * powerMultiplier),
    agi: Math.floor(baseMonster.agi * accuracyMultiplier),
    xp: Math.floor(baseMonster.xp * powerMultiplier),
    loot: Math.floor(baseMonster.loot * powerMultiplier),
    critChance: Math.min(MAX_CRIT_CHANCE, BASE_CRIT_CHANCE + ((depth - 1) * CRIT_SCALING_PER_FLOOR)),
    powerLevel: powerMultiplier
  };
};

/**
 * Calculates player stats with equipment and buffs
 */
export const calculateStats = (player, tavernMates, buffActive, dragonActive) => {
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

  // Apply Mate Buffs (Active or Guaranteed)
  if (player.hiredMate) {
    const mate = tavernMates.find(m => m.id === player.hiredMate);
    if (mate) {
      // Guaranteed Persistent Buffs (procChance === 1.0) or Active Timer-based Buffs
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
    const dragonBonus = 5 * player.dragon.level;
    stats.str += dragonBonus;
    stats.agi += dragonBonus;
    stats.dex += dragonBonus;
  }

  // Apply GEMX Bonuses (New Elemental System)
  if (player.gemx && player.gemx.level > 0) {
    const lvl = player.gemx.level;
    const element = player.gemxElement;
    if (element === 'Pyro') { stats.str += lvl; stats.agi += lvl; }
    else if (element === 'Earthen') { stats.dex += 2 * lvl; }
    else if (element === 'Hydro') { stats.str += lvl; stats.dex += lvl; }
    else if (element === 'Gale') { stats.agi += 2 * lvl; }
  }

  // Apply Genesis Pet Buffs
  if (player.petId) {
    stats.maxHp += 50;
  }

  // Final Safety Rounding
  stats.str = Math.floor(stats.str);
  stats.agi = Math.floor(stats.agi);
  stats.dex = Math.floor(stats.dex);

  return stats;
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
 * Combat Math: Hit Chance
 * Optimized (Phase 1): Added 35% hit floor and tuned AGI weight to 0.35 instead of 0.4.
 */
export const getHitChance = (attackerDex, defenderAgi) => {
  const chance = (attackerDex / (attackerDex + defenderAgi * 0.35)) * 100;
  return Math.max(35, Math.min(98, Math.floor(chance)));
};

/**
 * Combat Math: Damage
 * Optimized (Phase 1): Buffed STR multiplier (1.2x) and reduced AGI mitigation weight (0.1 instead of 0.2).
 */
export const getDamage = (attackerStr, defenderAgi, isCrit = false) => {
  // STR has more weight than AGI mitigation now (Phase 1 Balance)
  const dmgBase = (attackerStr * 1.2) + Math.floor(Math.random() * 10) - (defenderAgi * 0.1);
  const finalDmg = isCrit ? Math.floor(dmgBase * 2.5) : Math.floor(dmgBase);
  return Math.max(5, finalDmg);
};

export const BOSS = {
  name: "The Core Guardian",
  level: 500,
  hp: 10000000,
  str: 1000,
  agi: 800,
  dex: 700,
  critChance: 0.25,
  baseDropRate: 0.1, // 10% drop rate for Relics
  taunts: ["I am the final obstacle!", "Your journey ends here.", "Kneel before the Core!"]
};

export const BOSS_MEDIA_FILES = [
  { img: '/assets/bossmonster/DungeonGemBoss (1).jpg', vid: '/assets/bossmonstervideo/DungeonGemBoss (1) video.mp4' },
  { img: '/assets/bossmonster/CrystleHunterAvatar (30).jpg', vid: '/assets/bossmonstervideo/DungeonGemBoss (2) video.mp4' }
];
