// Game Constants and Math Utilities

export const DIFFICULTY_MULTIPLIER = 1.15;
export const XP_BASE = 100;
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
  const accuracyMultiplier = 1 + ((depth - 1) * 0.15);
  
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
export const calculateStats = (player, tavernMates, buffActive) => {
  if (!player) return { str: 0, agi: 0, dex: 0 };
  
  const stats = { 
    str: player.baseStats?.str || 0, 
    agi: player.baseStats?.agi || 0, 
    dex: player.baseStats?.dex || 0 
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
  if (buffActive && player.hiredMate) {
    const mate = tavernMates.find(m => m.id === player.hiredMate);
    if (mate) {
      if (mate.type === 'STR') stats.str *= 2;
      if (mate.type === 'AGI') stats.agi *= 2;
      if (mate.type === 'DEX') stats.dex *= 2;
    }
  }

  // Apply Dragon Buffs
  if (player.dragon && player.dragon.level > 0) {
    const dragonBonus = 5 * player.dragon.level;
    stats.str += dragonBonus;
    stats.agi += dragonBonus;
    stats.dex += dragonBonus;
  }

  return stats;
};

/**
 * Combat Math: Hit Chance
 */
export const getHitChance = (attackerDex, defenderAgi) => {
  return Math.min(98, (attackerDex / (attackerDex + defenderAgi * 0.4)) * 100);
};

/**
 * Combat Math: Damage
 */
export const getDamage = (attackerStr, defenderAgi, isCrit = false) => {
  const dmgBase = attackerStr + Math.floor(Math.random() * 10) - Math.floor(defenderAgi / 5);
  return Math.max(5, isCrit ? Math.floor(dmgBase * 2.5) : dmgBase);
};
