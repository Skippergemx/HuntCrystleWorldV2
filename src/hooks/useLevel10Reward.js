import { useState, useEffect, useCallback, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';

/**
 * useLevel10Reward — detects when a player reaches Level 10 and manages
 * the Emerald Gemx reward flow.
 *
 * @param {object} player — current player state
 * @param {object} functions — Firebase functions instance
 * @param {function} addLog — combat log function
 * @param {function} syncPlayer — Firestore sync function
 *
 * Flow:
 *   level >= 10 → check supply → reserve slot (atomic Firestore)
 *     → wallet present? → on-chain transfer → celebration
 *     → no wallet? → hold reservation, celebrate when wallet links
 *     → supply exhausted? → quiet acknowledgement, no celebration
 *
 * Returns:
 *   level10Reward: { status, txHash, error, message }
 *   dismissLevel10: () => void
 */
export const useLevel10Reward = (player, functions, addLog, syncPlayer) => {

  const [status, setStatus] = useState('idle');
  // idle | checking | reserving | reserved | claiming | claimed | exhausted | error
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const triggeredRef = useRef(false);
  const prevLevelRef = useRef(null);
  const walletDeferredRef = useRef(false);

  // Track previous level to detect the level-up moment
  useEffect(() => {
    if (player?.level !== undefined && prevLevelRef.current === null) {
      prevLevelRef.current = player.level;
    }
  }, [player?.level]);

  // Core detection: player hits level 10
  useEffect(() => {
    if (!player || !functions || triggeredRef.current) return;
    if (player.level10NftClaimed === true) return; // already done

    const prevLevel = prevLevelRef.current;
    const currentLevel = player.level;
    prevLevelRef.current = currentLevel;

    // Only trigger when crossing the level 10 threshold
    if (currentLevel >= 10 && (prevLevel === null || prevLevel < 10)) {
      triggeredRef.current = true;
      triggerReservation(player.walletAddress);
    }
    // Also handle already-level-10 on initial load (player was level 10+ before this code existed)
    else if (currentLevel >= 10 && !player.level10NftReserved && !player.level10NftClaimed && triggeredRef.current === false) {
      triggeredRef.current = true;
      triggerReservation(player.walletAddress);
    }
  }, [player?.level, player?.level10NftReserved, player?.level10NftClaimed, functions]);

  // Deferred claim: wallet was linked AFTER reservation was made
  useEffect(() => {
    if (!player || !functions) return;
    if (!walletDeferredRef.current) return;
    if (player.level10NftClaimed === true) return;
    if (!player.walletAddress) return;
    if (!player.level10NftReserved) return;

    // We have a reservation AND a wallet now — trigger the transfer
    walletDeferredRef.current = false;
    triggerTransfer(player.walletAddress);
  }, [player?.walletAddress, player?.level10NftReserved, player?.level10NftClaimed, functions]);

  // Check on-chain supply before proceeding
  const checkSupply = useCallback(async () => {
    try {
      // We use the cloud function's reservation transaction as the supply check.
      // If it throws 'resource-exhausted', we know supply is gone.
      return { available: true };
    } catch {
      return { available: false };
    }
  }, []);

  // Phase 1: Reserve slot (with or without wallet)
  const triggerReservation = useCallback(async (walletAddress) => {
    setStatus('checking');

    try {
      const claimFn = httpsCallable(functions, 'claimLevel10Nft');
      // Call without wallet to reserve only, or with wallet if available
      const payload = walletAddress ? { targetWalletAddress: walletAddress } : {};
      const result = await claimFn(payload);
      const data = result.data;

      if (data.reserved && !walletAddress) {
        // Reservation only — wallet not yet linked
        setStatus('reserved');
        walletDeferredRef.current = true;
        setMessage(data.message);
        if (addLog) addLog(`🔮 LEVEL 10: ${data.message}`);
        return;
      }

      // Full claim (reservation + transfer) succeeded
      if (data.success) {
        setStatus('claimed');
        setTxHash(data.txHash);
        setMessage(data.message);
        localStorage.setItem('level10Claimed', 'true');
        await syncPlayer?.({ level10NftTxHash: data.txHash });
        if (addLog) addLog(`🔮 LEVEL 10 REWARD: ${data.message}`);
        return;
      }

      throw new Error(data.message || 'Claim returned unsuccessful');
    } catch (e) {
      const msg = e.details?.message || e.message || 'Level 10 reward failed';

      if (msg.includes('exhausted') || msg.includes('reserved') || msg.includes('claimed')) {
        setStatus('exhausted');
        setMessage(msg);
        if (addLog) {
          addLog(`🔮 LEVEL 10: All Emerald Gemx have been claimed — but your feat is recorded in the Crystle Grid.`);
        }
      } else {
        setStatus('error');
        setError(msg);
        // Do NOT reset triggeredRef — prevents retry-storm on 429/network errors.
        // User can manually retry via retryClaim().
        if (addLog) addLog(`⚠️ LEVEL 10 REWARD: ${msg}`);
      }
    }
  }, [functions, addLog, syncPlayer]);

  // Phase 2: Transfer only (reservation already done)
  const triggerTransfer = useCallback(async (walletAddress) => {
    setStatus('claiming');
    try {
      const claimFn = httpsCallable(functions, 'claimLevel10Nft');
      const result = await claimFn({ targetWalletAddress: walletAddress });
      const data = result.data;

      if (data.success) {
        setStatus('claimed');
        setTxHash(data.txHash);
        setMessage(data.message);
        localStorage.setItem('level10Claimed', 'true');
        await syncPlayer?.({ level10NftTxHash: data.txHash });
        if (addLog) addLog(`🔮 LEVEL 10 REWARD: ${data.message}`);
      } else {
        throw new Error(data.message || 'Transfer failed');
      }
    } catch (e) {
      const msg = e.details?.message || e.message || 'Level 10 transfer failed';
      if (msg.includes('exhausted')) {
        setStatus('exhausted');
        setMessage(msg);
      } else {
        setStatus('error');
        setError(msg);
        triggeredRef.current = false;
      }
      if (addLog) addLog(`⚠️ LEVEL 10 REWARD: ${msg}`);
    }
  }, [functions, addLog, syncPlayer]);

  // Manual retry
  const retryClaim = useCallback(() => {
    if (!player?.walletAddress) return;
    triggeredRef.current = false;
    setError(null);
    triggerTransfer(player.walletAddress);
  }, [player?.walletAddress, triggerTransfer]);

  const dismissLevel10 = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    level10Reward: { status, txHash, error, message },
    dismissLevel10,
    retryClaim,
  };
};
