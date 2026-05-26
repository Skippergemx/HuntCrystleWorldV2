/**
 * useCompanionBanter.js
 *
 * Hook that manages the Companion Banter System for the CharacterBadge.
 * Also exports shared helper functions for use by other banter modules (e.g. useCombatBanter).
 *
 * Responsibilities:
 * 1. Identify which companions are active (Hunter, Pet, Mate, Gemx, Dragon)
 * 2. Determine the current game context (idle, tips, lowHp, hasAp, penalized, rich)
 * 3. Select a random speaker from available companions with weighted probability
 * 4. Pick a contextual dialogue line for that speaker
 * 5. Expose active companion roster for UI indicators
 */

import { useCallback, useMemo } from 'react';
import {
  HUNTER_DIALOGUES,
  PET_DIALOGUES,
  MATE_DIALOGUES,
  GEMX_DIALOGUES,
  DRAGON_DIALOGUES,
  COMPANION_META
} from '../data/companion_dialogues';

/**
 * Extract element key from pet metadata.
 * "Hydro" → "hydro", "Pyro" → "pyro", etc.
 */
const petElementKey = (pet) => {
  if (!pet || !pet.element) return null;
  return pet.element.toLowerCase();
};

/**
 * Extract element key from gemx avatar filename.
 * "Cosmic gemx (1).gif" → "cosmic"
 * "Earthen gemx (2).gif" → "earthen"
 */
const gemxElementKey = (gemxAvatar) => {
  if (!gemxAvatar) return null;
  return gemxAvatar.split(' ')[0]?.toLowerCase() || null;
};

/**
 * Determine current game context based on player state.
 */
const getContext = (player, penaltyRemaining) => {
  if (penaltyRemaining > 0) return 'penalized';
  const isLowHp = player.hp < (player.maxHp * 0.4);
  if (isLowHp) return 'lowHp';
  if (player.abilityPoints > 0) return 'hasAp';
  // Rich check: tokens > 50000
  if (player.tokens > 50000) return 'rich';
  // 40% chance for tips, 60% for idle
  return Math.random() > 0.4 ? 'tips' : 'idle';
};

/**
 * Pick a random item from an array.
 */
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Weighted random selection from available speakers.
 * Hunter has higher weight when alone; companions are prioritized when present.
 */
const pickSpeaker = (activeCompanions) => {
  if (activeCompanions.length === 0) return null;

  // Build weighted pool
  const pool = [];
  for (const comp of activeCompanions) {
    const weight = comp.type === 'hunter' ? 1 : 2; // companions speak more often
    for (let i = 0; i < weight; i++) pool.push(comp);
  }
  return pickRandom(pool);
};

/**
 * Resolve the dialogue pool and pick a message for a given companion + context.
 * Falls back to 'idle' context if the specific context isn't available.
 */
const resolveMessage = (companion, context) => {
  const { type, elementOrId } = companion;

  let pool;
  switch (type) {
    case 'hunter':
      pool = HUNTER_DIALOGUES;
      break;
    case 'pet': {
      const elem = elementOrId || 'cosmic';
      pool = PET_DIALOGUES[elem];
      break;
    }
    case 'mate': {
      const mateId = elementOrId;
      pool = MATE_DIALOGUES[mateId];
      break;
    }
    case 'gemx': {
      const elem = elementOrId || 'cosmic';
      pool = GEMX_DIALOGUES[elem];
      break;
    }
    case 'dragon':
      pool = DRAGON_DIALOGUES;
      break;
    default:
      pool = HUNTER_DIALOGUES;
  }

  if (!pool) return '...';

  // Try requested context first, fall back to idle
  const lines = pool[context] || pool.idle || Object.values(pool)[0];
  if (!lines || lines.length === 0) return '...';
  return pickRandom(lines);
};

/**
 * Build the list of currently active companions based on player state.
 */
const getActiveCompanions = (player, petsMeta, tavernMates) => {
  const companions = [];

  // Hunter is always present
  companions.push({
    type: 'hunter',
    elementOrId: null,
    label: COMPANION_META.hunter.label,
    color: COMPANION_META.hunter.color,
    displayName: player.name || 'Hunter',
    avatarType: 'player',
    avatarNum: player.avatar || 1
  });

  // Pet (if adopted)
  if (player.petId) {
    const pet = petsMeta?.find(p => p.id === player.petId);
    if (pet) {
      const elemKey = petElementKey(pet);
      companions.push({
        type: 'pet',
        elementOrId: elemKey,
        label: COMPANION_META.pet.label,
        color: COMPANION_META.pet.color,
        displayName: pet.name || 'Pet',
        avatarType: 'pet',
        petId: pet.id,
        element: pet.element
      });
    }
  }

  // Tavern Mate (if hired)
  if (player.hiredMate && tavernMates?.length > 0) {
    const mate = tavernMates.find(m => m.id === player.hiredMate);
    if (mate) {
      companions.push({
        type: 'mate',
        elementOrId: mate.id,
        label: COMPANION_META.mate.label,
        color: COMPANION_META.mate.color,
        displayName: mate.name || 'Mate',
        avatarType: 'mate',
        mateId: mate.id,
        icon: mate.icon || '👤'
      });
    }
  }

  // Gemx (if avatar selected - default is always set)
  if (player.gemxAvatar) {
    const elemKey = gemxElementKey(player.gemxAvatar);
    companions.push({
      type: 'gemx',
      elementOrId: elemKey,
      label: COMPANION_META.gemx.label,
      color: COMPANION_META.gemx.color,
      displayName: elemKey ? `${elemKey.charAt(0).toUpperCase() + elemKey.slice(1)} Gemx` : 'Gemx',
      avatarType: 'gemx',
      element: elemKey
    });
  }

  // Dragon (if player has dragon data)
  if (player.dragon) {
    companions.push({
      type: 'dragon',
      elementOrId: null,
      label: COMPANION_META.dragon.label,
      color: COMPANION_META.dragon.color,
      displayName: 'Dragon',
      avatarType: 'dragon'
    });
  }

  return companions;
};

/**
 * Build avatar info for rendering from a speaker object.
 * Returns { type, num?, petId?, element?, mateId?, icon? }
 */
const buildAvatar = (speaker) => {
  switch (speaker.avatarType) {
    case 'player':
      return { type: 'player', num: speaker.avatarNum };
    case 'pet':
      return { type: 'pet', petId: speaker.petId, element: speaker.element };
    case 'mate':
      return { type: 'mate', mateId: speaker.mateId, icon: speaker.icon };
    case 'gemx':
      return { type: 'gemx', element: speaker.element };
    case 'dragon':
      return { type: 'dragon' };
    default:
      return { type: 'player', num: 1 };
  }
};

/**
 * Build a complete banter result from a speaker and context.
 * Returns { speaker, message, prefix, color, avatar }
 */
const buildBanterResult = (speaker, message) => ({
  speaker: {
    type: speaker.type,
    displayName: speaker.displayName
  },
  message,
  prefix: speaker.label,
  color: speaker.color,
  avatar: buildAvatar(speaker)
});

// --- Shared helpers exported for use by useCombatBanter.js ---
export { getActiveCompanions, resolveMessage, pickSpeaker, pickRandom, COMPANION_META, HUNTER_DIALOGUES };

/**
 * useCompanionBanter hook
 * 
 * @param {Object} player - Current player state from game context
 * @param {number} penaltyRemaining - Seconds left on penalty timer
 * @param {Array} petsMeta - PETS_METADATA from game context
 * @param {Array} tavernMates - TAVERN_MATES from game context
 * @returns {Object} { banter, activeCompanions, pickBanter }
 */
export const useCompanionBanter = (player, penaltyRemaining, petsMeta, tavernMates) => {
  // Derive active companions from current player state
  const activeCompanions = useMemo(
    () => getActiveCompanions(player, petsMeta, tavernMates),
    [
      player.petId,
      player.hiredMate,
      player.gemxAvatar,
      player.dragon,
      player.avatar,
      player.name,
      petsMeta,
      tavernMates
    ]
  );

  /**
   * pickBanter — generates a new banter message.
   * Returns { speaker, message, prefix, color, avatar }
   */
  const pickBanter = useCallback(() => {
    const context = getContext(player, penaltyRemaining);
    const speaker = pickSpeaker(activeCompanions);

    if (!speaker) {
      // Fallback: Hunter idle
      return {
        speaker: { type: 'hunter', displayName: player.name || 'Hunter' },
        message: pickRandom(HUNTER_DIALOGUES.idle),
        prefix: COMPANION_META.hunter.label,
        color: COMPANION_META.hunter.color,
        avatar: { type: 'player', num: player.avatar || 1 }
      };
    }

    const message = resolveMessage(speaker, context);

    // Build avatar info for rendering
    let avatar;
    switch (speaker.avatarType) {
      case 'player':
        avatar = { type: 'player', num: speaker.avatarNum };
        break;
      case 'pet':
        avatar = { type: 'pet', petId: speaker.petId, element: speaker.element };
        break;
      case 'mate':
        avatar = { type: 'mate', mateId: speaker.mateId, icon: speaker.icon };
        break;
      case 'gemx':
        avatar = { type: 'gemx', element: speaker.element };
        break;
      case 'dragon':
        avatar = { type: 'dragon' };
        break;
      default:
        avatar = { type: 'player', num: 1 };
    }

    return {
      speaker: {
        type: speaker.type,
        displayName: speaker.displayName
      },
      message,
      prefix: speaker.label,
      color: speaker.color,
      avatar
    };
  }, [player, penaltyRemaining, activeCompanions]);

  return { activeCompanions, pickBanter };
};
