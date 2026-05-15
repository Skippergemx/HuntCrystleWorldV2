import { useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import sdk from '@farcaster/frame-sdk';

/**
 * useWallet V5: Hybrid EVM Wallet Bridge
 * Provides connect / disconnect for Base Mainnet EVM wallets via RainbowKit.
 * Detects Farcaster Frame environment and injects native connection.
 */
export const useWallet = (addLog) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { openConnectModal } = useConnectModal();
  const [isCrystleHolder, setIsCrystleHolder] = useState(false);
  const [isFarcaster, setIsFarcaster] = useState(false);

  useEffect(() => {
    const initFrame = async () => {
      try {
        // Add a safety timeout for frame context
        const contextPromise = sdk.context;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 2000)
        );
        
        const context = await Promise.race([contextPromise, timeoutPromise]);
        if (context) {
          setIsFarcaster(true);
        }
      } catch (e) {
        console.warn("Farcaster SDK init skipped in useWallet.");
      }
    };
    initFrame();
  }, []);

  useEffect(() => {
    // V3 MOCK: Always true if a wallet is connected, for Phase 1 testing
    setIsCrystleHolder(!!address);
  }, [address]);

  const connectWallet = useCallback(() => {
    if (isFarcaster) {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
        return;
      }
    }
    
    if (openConnectModal) {
      openConnectModal();
    } else {
      console.warn("System V3: RainbowKit Modal not available.");
    }
  }, [isFarcaster, connectors, connect, openConnectModal]);

  return {
    address,
    isCrystleHolder,
    loading: isConnecting,
    activeProviderType: isConnected ? (isFarcaster ? 'FARCASTER' : 'EXTERNAL') : null,
    connectWallet,
    disconnectWallet: disconnect,
    hasExternalProvider: true,
    isFarcaster
  };
};

