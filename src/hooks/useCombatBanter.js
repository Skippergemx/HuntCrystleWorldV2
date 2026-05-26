import { useState, useRef, useCallback, useEffect } from 'react';
import {
  getActiveCompanions,
  resolveMessage,
  pickSpeaker,
  pickRandom,
  COMPANION_META,
  HUNTER_DIALOGUES
} from './useCompanionBanter';

const BANTER_DEBOUNCE_MS = 2000; // Minimum gap between banters

/**
 * buildBanterResult — local helper to construct a banter result object
 * from a speaker and message string.
 *
 * @param {Object} speaker - Speaker object from getActiveCompanions
 * @param {string} message - Resolved dialogue line
 * @returns {{ speaker, message, prefix, color, avatar }}
 */
const buildBanterResult = (speaker, message) => {
  const avatar = (() => {
    switch (speaker.avatarType) {
      case 'player': return { type: 'player', num: speaker.avatarNum };
      case 'pet': return { type: 'pet', petId: speaker.petId, element: speaker.element };
      case 'mate': return { type: 'mate', mateId: speaker.mateId, icon: speaker.icon };
      case 'gemx': return { type: 'gemx', element: speaker.element };
      case 'dragon': return { type: 'dragon' };
      default: return { type: 'player', num: 1 };
    }
  })();

  return {
    speaker: { type: speaker.type, displayName: speaker.displayName },
    message,
    prefix: speaker.label,
    color: speaker.color,
    avatar
  };
};

/**
 * buildHunterBanter — fallback when no non-Hunter companions are active.
 * Returns a banter result from the Hunter's combat/victory/idle pools.
 *
 * @param {Object} player - Player state
 * @param {string} context - 'combat' or 'victory'
 * @returns {{ speaker, message, prefix, color, avatar }}
 */
const buildHunterBanter = (player, context) => {
  const pool = HUNTER_DIALOGUES[context] || HUNTER_DIALOGUES.idle;
  const message = pickRandom(pool);
  return {
    speaker: { type: 'hunter', displayName: player.name || 'Hunter' },
    message,
    prefix: COMPANION_META.hunter.label,
    color: COMPANION_META.hunter.color,
    avatar: { type: 'player', num: player.avatar || 1 }
  };
};

/**
 * useCombatBanter — watches combat state changes and generates
 * contextual companion banter for the combat/boss arena.
 *
 * @param {Object}  options
 * @param {Object}  options.combat      - Combat state from useGame()
 * @param {Object}  options.player      - Current player state
 * @param {Object}  [options.enemy]     - Current enemy (optional, for context)
 * @param {Array}   options.petsMeta    - PETS_METADATA
 * @param {Array}   options.tavernMates - TAVERN_MATES
 * @returns {{ currentBanter, triggerBanter, banterHistory }}
 */
export const useCombatBanter = ({ combat, player, enemy, petsMeta, tavernMates }) => {
  const [currentBanter, setCurrentBanter] = useState(null);
  const [banterHistory, setBanterHistory] = useState([]);

  // Track previous combat values to detect changes
  const prevImpactSplash = useRef(0);
  const prevPlayerImpactSplash = useRef(0);
  const prevSquadStrike = useRef(false);
  const prevMonsterSkill = useRef(false);
  const prevVictoryWindow = useRef(false);
  const prevLevelUpTrigger = useRef(0);

  // Debounce timer ref
  const lastBanterTime = useRef(0);

  /**
   * triggerBanter — manually fires a banter with the given context.
   * Honors the debounce (2s) and preemption rules.
   *
   * @param {string} context - 'combat' | 'victory'
   */
  const triggerBanter = useCallback((context) => {
    const now = Date.now();
    if (now - lastBanterTime.current < BANTER_DEBOUNCE_MS) {
      // Preempt old banter: update content but don't reset timer fully
      // We still allow the visual to change immediately
    }
    lastBanterTime.current = now;

    // Derive active companions
    const activeComp = getActiveCompanions(player, petsMeta, tavernMates);

    // If only Hunter is active, use Hunter dialogue
    const nonHunter = activeComp.filter(c => c.type !== 'hunter');
    if (nonHunter.length === 0) {
      const banter = buildHunterBanter(player, context);
      setCurrentBanter(banter);
      setBanterHistory(prev => [banter, ...prev].slice(0, 10));
      return;
    }

    // Pick a speaker from non-Hunter companions
    const speaker = pickSpeaker(nonHunter);
    if (!speaker) {
      const banter = buildHunterBanter(player, context);
      setCurrentBanter(banter);
      setBanterHistory(prev => [banter, ...prev].slice(0, 10));
      return;
    }

    // Resolve message for the context
    const message = resolveMessage(speaker, context);
    const banter = buildBanterResult(speaker, message || pickRandom(HUNTER_DIALOGUES[context] || HUNTER_DIALOGUES.idle));

    setCurrentBanter(banter);
    setBanterHistory(prev => [banter, ...prev].slice(0, 10));
  }, [player, petsMeta, tavernMates]);

  // --- Combat event watcher ---
  useEffect(() => {
    // Victory window opened
    if (combat.showVictoryWindow && !prevVictoryWindow.current) {
      triggerBanter('victory');
    }
    prevVictoryWindow.current = combat.showVictoryWindow;

    // Level up trigger changed
    if (combat.levelUpEffectTrigger > prevLevelUpTrigger.current) {
      triggerBanter('victory');
    }
    prevLevelUpTrigger.current = combat.levelUpEffectTrigger;

    // Player hit the enemy (impactSplash is a counter)
    if (combat.impactSplash !== prevImpactSplash.current) {
      triggerBanter('combat');
    }
    prevImpactSplash.current = combat.impactSplash;

    // Enemy hit the player
    if (combat.playerImpactSplash !== prevPlayerImpactSplash.current) {
      triggerBanter('combat');
    }
    prevPlayerImpactSplash.current = combat.playerImpactSplash;

    // Squad strike activated
    if (combat.squadStrikeActive && !prevSquadStrike.current) {
      triggerBanter('combat');
    }
    prevSquadStrike.current = combat.squadStrikeActive;

    // Monster skill activated
    if (combat.monsterSkillActive && !prevMonsterSkill.current) {
      triggerBanter('combat');
    }
    prevMonsterSkill.current = combat.monsterSkillActive;

  }, [
    combat.impactSplash,
    combat.playerImpactSplash,
    combat.squadStrikeActive,
    combat.monsterSkillActive,
    combat.showVictoryWindow,
    combat.levelUpEffectTrigger,
    triggerBanter
  ]);

  return { currentBanter, triggerBanter, banterHistory };
};
