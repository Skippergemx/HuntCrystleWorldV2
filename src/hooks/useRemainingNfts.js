import { useState, useEffect, useCallback } from 'react';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const FAUCET_ADDRESS = '0x8dca8d7B35004630F460B85F70d1189795CDe6Fc';
const NFT_ADDRESS = '0x182D92921c49ca5cf9bc53c013dE735446507dE1';
const TOKEN_ID = 0n;
const TOTAL_SUPPLY = 20;

const ERC1155_BALANCE_ABI = [{
  inputs: [
    { name: 'account', type: 'address' },
    { name: 'id', type: 'uint256' }
  ],
  name: 'balanceOf',
  outputs: [{ type: 'uint256' }],
  stateMutability: 'view',
  type: 'function'
}];

/**
 * useRemainingNfts — reads the faucet wallet's on-chain TRISAPG balance.
 * ERC-1155 balanceOf returns raw token count, so Number(balance) = tokens held.
 * Polls every 15s for live-ish updates without Firestore counter drift.
 */
export const useRemainingNfts = () => {
  const [remaining, setRemaining] = useState(null); // null = loading

  const fetchBalance = useCallback(async () => {
    try {
      const publicClient = createPublicClient({ chain: base, transport: http() });
      const balance = await publicClient.readContract({
        address: NFT_ADDRESS,
        abi: ERC1155_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [FAUCET_ADDRESS, TOKEN_ID]
      });
      setRemaining(Number(balance));
    } catch {
      // Fallback: show full supply if RPC fails
      if (remaining === null) setRemaining(TOTAL_SUPPLY);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { remaining, total: TOTAL_SUPPLY };
};
