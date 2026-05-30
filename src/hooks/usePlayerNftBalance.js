import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const DEFAULT_NFT = {
  address: '0x182D92921c49ca5cf9bc53c013dE735446507dE1',
  tokenId: 0n
};

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
 * usePlayerNftBalance — reads the ERC-1155 token balance for a given wallet.
 * 
 * @param {string|null} walletAddress
 * @param {{ address: string, tokenId: bigint }} [nftConfig] — defaults to TRISAPG
 * @returns {number|null} balance (null while loading, number when resolved)
 */
export const usePlayerNftBalance = (walletAddress, nftConfig) => {
  const { address: nftAddress, tokenId } = nftConfig || DEFAULT_NFT;
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }

    let cancelled = false;
    const client = createPublicClient({ chain: base, transport: http() });

    client.readContract({
      address: nftAddress,
      abi: ERC1155_BALANCE_ABI,
      functionName: 'balanceOf',
      args: [walletAddress, tokenId]
    }).then(b => {
      if (!cancelled) setBalance(Number(b));
    }).catch(() => {
      if (!cancelled) setBalance(0);
    });

    return () => { cancelled = true; };
  }, [walletAddress, nftAddress, String(tokenId)]);

  return balance;
};
