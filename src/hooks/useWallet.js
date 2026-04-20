import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

/**
 * useWallet V4: Web-Only EVM Wallet Bridge
 * Provides connect / disconnect for Base Mainnet EVM wallets via RainbowKit.
 * Farcaster native provider and TON wallet support have been removed.
 */
export const useWallet = (addLog) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [isCrystleHolder, setIsCrystleHolder] = useState(false);

  useEffect(() => {
    // V3 MOCK: Always true if a wallet is connected, for Phase 1 testing
    setIsCrystleHolder(!!address);
  }, [address]);

  return {
    address,
    isCrystleHolder,
    loading: isConnecting,
    activeProviderType: isConnected ? 'EXTERNAL' : null,
    connectWallet: () => {
      if (openConnectModal) {
        openConnectModal();
      } else {
        console.warn("System V3: RainbowKit Modal not available.");
      }
    },
    disconnectWallet: disconnect,
    hasExternalProvider: true
  };
};
