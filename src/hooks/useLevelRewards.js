import { useState, useEffect, useCallback, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';

/**
 * All 10-level milestones from 10 to 100.
 */
const LEVEL_MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/**
 * Metadata per milestone for display purposes.
 */
const MILESTONE_META = {
  10: { token: 'TRIEM', name: 'Trilith Emerald Gemx', color: 'emerald' },
  20: { token: 'TRIRUBGEMX', name: 'Trilith Ruby Gemx', color: 'red' },
  30: { token: 'TRIQUGEMX', name: 'Trilith Quartz Gemx', color: 'violet' },
  40: { token: 'TRISAPG', name: 'Trilith Sapphire Gemx', color: 'blue' },
  50: { token: 'TRIEM', name: 'Trilith Emerald Gemx', color: 'emerald' },
  60: { token: 'TRIRUBGEMX', name: 'Trilith Ruby Gemx', color: 'red' },
  70: { token: 'TRIRUBGEMX', name: 'Trilith Ruby Gemx', color: 'red' },
  80: { token: 'TRIQUGEMX', name: 'Trilith Quartz Gemx', color: 'violet' },
  90: { token: 'TRISAPG', name: 'Trilith Sapphire Gemx', color: 'blue' },
  100: { token: 'TRIEM', name: 'Trilith Emerald Gemx', color: 'emerald' },
};

/**
 * useLevelRewards — monitors player level and auto-triggers NFT reward
 * claims for every 10-level milestone (10, 20, 30, ... 100).
 *
 * Supports two-phase flow:
 *   - Wallet already linked → full on-chain transfer
 *   - No wallet yet → reservation only, claims when wallet is linked later
 *
 * @param {object} player    — current player state
 * @param {object} functions — Firebase functions instance
 * @param {function} addLog  — combat log function
 * @param {function} syncPlayer — Firestore sync function
 *
 * Returns:
 *   activeReward: { level, status, txHash, error, message, meta } | null
 *   dismissReward: () => void
 *   retryReward: () => void
 */
export const useLevelRewards = (player, functions, addLog, syncPlayer) => {
  // Internal state per milestone: { [level]: { status, txHash, error, message } }
  const [rewardStates, setRewardStates] = useState({});

  // The single "active" reward ready for celebration display
  const [activeReward, setActiveReward] = useState(null);

  // Track which milestones have been triggered to prevent re-trigger storms
  const triggeredRef = useRef({});
  const prevLevelRef = useRef(null);

  // Check if a specific milestone is already satisfied (claimed or reserved)
  const isMilestoneDone = useCallback((level) => {
    if (!player) return true;
    const r = player.levelRewards?.[String(level)];
    if (r?.claimed === true) return true;
    // Legacy level 10 compat
    if (level === 10 && player.level10NftClaimed === true) return true;
    return false;
  }, [player]);

  // Check if a specific milestone is reserved (awaiting wallet)
  const isMilestoneReserved = useCallback((level) => {
    if (!player) return false;
    const r = player.levelRewards?.[String(level)];
    if (r?.reserved === true && r?.claimed !== true) return true;
    // Legacy level 10 compat
    if (level === 10 && player.level10NftReserved === true && player.level10NftClaimed !== true) return true;
    return false;
  }, [player]);

  // Trigger claim for a specific milestone
  const triggerClaim = useCallback(async (level) => {
    if (triggeredRef.current[level]) return;

    const meta = MILESTONE_META[level];
    if (!meta) return;

    triggeredRef.current[level] = true;

    setRewardStates(prev => ({ ...prev, [level]: { status: 'checking' } }));
    setActiveReward({ level, status: 'checking', meta });

    try {
      const claimFn = httpsCallable(functions, 'claimLevelReward');
      const payload = player?.walletAddress
        ? { targetWalletAddress: player.walletAddress, rewardLevel: level }
        : { rewardLevel: level };
      const result = await claimFn(payload);
      const data = result.data;

      if (data.reserved && !player?.walletAddress) {
        // Reservation only — wallet not yet linked
        setRewardStates(prev => ({ ...prev, [level]: { status: 'reserved', message: data.message } }));
        setActiveReward({ level, status: 'reserved', message: data.message, meta });
        if (addLog) addLog(`🔮 LEVEL ${level}: ${data.message}`);
        return;
      }

      // Full claim succeeded
      if (data.success) {
        const newState = { status: 'claimed', txHash: data.txHash, message: data.message, meta };
        setRewardStates(prev => ({ ...prev, [level]: newState }));
        setActiveReward({ level, ...newState });
        await syncPlayer?.({ [`levelRewards.${level}.txHash`]: data.txHash });
        if (addLog) addLog(`🔮 LEVEL ${level} REWARD: ${data.message}`);
        return;
      }

      throw new Error(data.message || 'Claim returned unsuccessful');
    } catch (e) {
      const msg = e.details?.message || e.message || `Level ${level} reward failed`;

      if (msg.includes('exhausted') || msg.includes('already') || msg.includes('processed')) {
        setRewardStates(prev => ({ ...prev, [level]: { status: 'exhausted', message: msg } }));
        if (addLog) {
          addLog(`🔮 LEVEL ${level}: All ${meta.name} have been claimed — but your feat is recorded.`);
        }
        // Don't show celebration for exhausted — just log it
      } else {
        setRewardStates(prev => ({ ...prev, [level]: { status: 'error', error: msg } }));
        setActiveReward({ level, status: 'error', error: msg, meta });
        if (addLog) addLog(`⚠️ LEVEL ${level} REWARD: ${msg}`);
      }
    }
  }, [functions, player?.walletAddress, addLog, syncPlayer]);

  // Trigger on-chain transfer for a previously reserved milestone
  const triggerTransfer = useCallback(async (level) => {
    if (!player?.walletAddress) return;

    const meta = MILESTONE_META[level];
    if (!meta) return;

    setRewardStates(prev => ({ ...prev, [level]: { status: 'claiming' } }));
    setActiveReward({ level, status: 'claiming', meta });

    try {
      const claimFn = httpsCallable(functions, 'claimLevelReward');
      const result = await claimFn({
        targetWalletAddress: player.walletAddress,
        rewardLevel: level
      });
      const data = result.data;

      if (data.success) {
        const newState = { status: 'claimed', txHash: data.txHash, message: data.message, meta };
        setRewardStates(prev => ({ ...prev, [level]: newState }));
        setActiveReward({ level, ...newState });
        await syncPlayer?.({ [`levelRewards.${level}.txHash`]: data.txHash });
        if (addLog) addLog(`🔮 LEVEL ${level} REWARD: ${data.message}`);
      } else {
        throw new Error(data.message || 'Transfer failed');
      }
    } catch (e) {
      const msg = e.details?.message || e.message || `Level ${level} transfer failed`;
      if (msg.includes('exhausted')) {
        setRewardStates(prev => ({ ...prev, [level]: { status: 'exhausted', message: msg } }));
      } else {
        setRewardStates(prev => ({ ...prev, [level]: { status: 'error', error: msg } }));
        setActiveReward({ level, status: 'error', error: msg, meta });
        triggeredRef.current[level] = false;
      }
      if (addLog) addLog(`⚠️ LEVEL ${level} REWARD: ${msg}`);
    }
  }, [functions, player?.walletAddress, addLog, syncPlayer]);

  // Core detection: monitor level changes and trigger for unclaimed milestones
  useEffect(() => {
    if (!player || !functions) return;
    if (player.level === undefined) return;

    const prevLevel = prevLevelRef.current;
    prevLevelRef.current = player.level;
    const currentLevel = player.level;

    // Check each milestone from highest to lowest
    // On initial load or level-up, trigger the first (lowest) unclaimed milestone
    for (const level of LEVEL_MILESTONES) {
      // Can't claim milestones above current level
      if (currentLevel < level) break;

      // Already done or already triggered
      if (isMilestoneDone(level)) continue;
      if (triggeredRef.current[level]) continue;

      // Only trigger on initial load or when crossing the threshold
      if (prevLevel === null || (prevLevel < level && currentLevel >= level)) {
        triggerClaim(level);
        break; // One at a time
      }
    }

    // Handle players already at a high level on initial load
    if (prevLevel === null) {
      for (const level of LEVEL_MILESTONES) {
        if (currentLevel < level) break;
        if (isMilestoneDone(level)) continue;
        if (triggeredRef.current[level]) continue;

        triggerClaim(level);
        break; // One at a time
      }
    }
  }, [player?.level, player?.levelRewards, functions, isMilestoneDone, triggerClaim]);

  // Deferred claims: wallet was linked AFTER reservation was made
  useEffect(() => {
    if (!player || !functions) return;
    if (!player.walletAddress) return;

    for (const level of LEVEL_MILESTONES) {
      if (isMilestoneDone(level)) continue;
      if (!isMilestoneReserved(level)) continue;

      // We have a reservation AND a wallet now — trigger the transfer
      triggerTransfer(level);
      break; // One at a time
    }
  }, [player?.walletAddress, functions, isMilestoneDone, isMilestoneReserved, triggerTransfer]);

  // Retry a failed claim
  const retryReward = useCallback(() => {
    if (!activeReward) return;
    const { level } = activeReward;
    triggeredRef.current[level] = false;

    if (isMilestoneReserved(level) && player?.walletAddress) {
      triggerTransfer(level);
    } else {
      triggerClaim(level);
    }
  }, [activeReward, player?.walletAddress, isMilestoneReserved, triggerClaim, triggerTransfer]);

  // Dismiss the celebration modal
  const dismissReward = useCallback(() => {
    if (!activeReward) return;
    setRewardStates(prev => ({ ...prev, [activeReward.level]: { status: 'idle' } }));
    setActiveReward(null);
  }, [activeReward]);

  return {
    activeReward,
    rewardStates,
    dismissReward,
    retryReward,
  };
};
