import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useGame } from '../contexts/GameContext';

/**
 * useWelcomeNft — manages the welcome NFT claim flow
 * 
 * Called after welcome screen completion to distribute 1 Trilith Sapphire Gemx
 * ERC-1155 token to the first 20 players who complete onboarding.
 */
export const useWelcomeNft = () => {
  const { player, functions, addLog } = useGame();
  const [claimState, setClaimState] = useState('idle'); // 'idle' | 'claiming' | 'claimed' | 'error'
  const [claimResult, setClaimResult] = useState(null); // { txHash, message }

  const hasClaimed = player?.welcomeNftClaimed === true;
  const isClaiming = claimState === 'claiming';

  const claimNft = useCallback(async (walletAddress) => {
    if (!walletAddress || !functions) return { success: false, message: 'No wallet or functions available' };
    if (hasClaimed) return { success: false, message: 'Already claimed' };

    setClaimState('claiming');
    try {
      const claimWelcomeNftFn = httpsCallable(functions, 'claimWelcomeNft');
      const result = await claimWelcomeNftFn({ targetWalletAddress: walletAddress });
      const data = result.data;

      if (data.success) {
        setClaimState('claimed');
        setClaimResult({ txHash: data.txHash, message: data.message });
        if (addLog) {
          addLog(`🎁 WELCOME GIFT: ${data.message}`);
        }
        return { success: true, txHash: data.txHash, message: data.message };
      } else {
        throw new Error(data.message || 'Claim returned unsuccessful');
      }
    } catch (e) {
      const message = e.details?.message || e.message || 'NFT claim failed';
      setClaimState('error');
      setClaimResult({ message });
      if (addLog) {
        addLog(`⚠️ WELCOME NFT: ${message}`);
      }
      return { success: false, message };
    }
  }, [functions, hasClaimed, addLog]);

  return {
    hasClaimed,
    isClaiming,
    claimState,
    claimResult,
    claimNft,
  };
};
