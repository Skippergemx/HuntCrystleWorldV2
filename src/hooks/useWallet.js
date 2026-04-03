import { useState, useCallback, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { sdk } from "@farcaster/frame-sdk";
import { useConnectModal } from '@rainbow-me/rainbowkit';

export const useWallet = (addLog, farcasterContext) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [isGenesisHolder, setIsGenesisHolder] = useState(false);

  // WAGMI Integration replaces all legacy listeners
  // Connection is handled by RainbowKit's ConnectButton, 
  // we just track the global state here to stay synced with the game.

  const isMobile = typeof navigator !== 'undefined'
    ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    : false;

  return {
    address, 
    isGenesisHolder, 
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
    hasNativeProvider: !!sdk?.wallet?.ethProvider,
    hasExternalProvider: true
  };
};
