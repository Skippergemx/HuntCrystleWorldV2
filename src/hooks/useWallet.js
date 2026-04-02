import { useState, useCallback, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { sdk } from "@farcaster/frame-sdk";

export const useWallet = (addLog, farcasterContext) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
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
       // Handled by RainbowKit's modal now, this is a placeholder
       console.log("System V3: Use RainbowKit modal for connection.");
    },
    disconnectWallet: disconnect,
    hasNativeProvider: !!sdk?.wallet?.ethProvider,
    hasExternalProvider: true
  };
};
