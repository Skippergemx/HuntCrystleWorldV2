import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { sdk } from "@farcaster/frame-sdk";

/**
 * useWallet V2: Hybrid Multi-Cloud Uplink
 * Supports NATIVE (Farcaster/Warpcast) and EXTERNAL (MetaMask/Browser) providers.
 * Automatically synchronizes with Base Mainnet (Chain ID 8453).
 */
const BASE_CHAIN_ID = '0x2105'; // 8453
const GENESIS_NFT_ADDRESS = '0x0000000000000000000000000000000000000000'; // PLACEHOLDER
const MINIMAL_ABI = ["function balanceOf(address owner) view returns (uint256)"];

export const useWallet = (addLog, farcasterContext) => {
  const [address, setAddress] = useState(null);
  const [isGenesisHolder, setIsGenesisHolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeProviderType, setActiveProviderType] = useState(null); // 'NATIVE' | 'EXTERNAL'
  const [manualDisconnect, setManualDisconnect] = useState(false);

  // 1. Provider Resolution Loop
  const getProvider = useCallback((type) => {
    const forcedType = type || activeProviderType;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Strict Platform Enforcements
    if (forcedType === 'NATIVE') {
      // Warpcast Web uses a faulty Privy version that crashes on ethProvider invocation.
      return isMobile ? sdk?.wallet?.ethProvider : null;
    }
    if (forcedType === 'EXTERNAL') return window.ethereum;
    
    // Auto-Discovery: Only assume Farcaster provider if explicitly confirmed by context
    if (farcasterContext && sdk?.wallet?.ethProvider) {
      return isMobile ? sdk.wallet.ethProvider : null;
    }
    
    // Prevent Web Browser extensions from overriding Farcaster desktop sessions
    if (farcasterContext) return null;
    
    // Default to strict Web Browser extension for all other environments
    return window.ethereum;
  }, [activeProviderType, farcasterContext]);

  // 2. Asset Verification Protocols
  const checkGenesisNFT = useCallback(async (userAddress, provider) => {
    if (!provider || GENESIS_NFT_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    try {
      const ethersProvider = new BrowserProvider(provider);
      const contract = new Contract(GENESIS_NFT_ADDRESS, MINIMAL_ABI, ethersProvider);
      const balance = await contract.balanceOf(userAddress);
      setIsGenesisHolder(Number(balance) > 0);
    } catch (e) { console.error("NFT Verification Error:", e); }
  }, []);

  // 3. Handshake Execution
  const connectWallet = async (type = 'AUTO') => {
    let ethProvider;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (type === 'NATIVE') ethProvider = isMobile ? sdk?.wallet?.ethProvider : null;
    else if (type === 'EXTERNAL') ethProvider = window.ethereum;
    else ethProvider = getProvider();

    if (!ethProvider) {
      const msg = type === 'NATIVE' ? "🚨 FRAME ERROR: Farcaster native wallet is only available on Mobile." : "🚨 WEB3 ERROR: No crypto wallet extension detected.";
      addLog?.(msg);
      return;
    }
    
    setManualDisconnect(false);
    setLoading(true);

    try {
      // Chain-Switching Logic (For External Browsers)
      if (ethProvider === window.ethereum) {
        try {
          await ethProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BASE_CHAIN_ID }] });
        } catch (s) {
          if (s.code === 4902) {
            await ethProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: BASE_CHAIN_ID, chainName: 'Base Mainnet',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org']
              }],
            });
          }
        }
      }

      // 1. Native Handshake Bypass: Use raw EIP-1193 provider to prevent ethers.js from crashing on malformed Farcaster errors
      const rawAccounts = await ethProvider.request({ method: 'eth_requestAccounts' });
      
      if (rawAccounts && rawAccounts[0]) {
        setAddress(rawAccounts[0]);
        setActiveProviderType(ethProvider === sdk?.wallet?.ethProvider ? 'NATIVE' : 'EXTERNAL');
        
        // 2. Wrap in Ethers ONLY after a successful EIP-1193 connection is established for contract reading
        const provider = new BrowserProvider(ethProvider);
        await checkGenesisNFT(rawAccounts[0], ethProvider);
        addLog?.(`⛓️ UPLINK SUCCESSful: Sector ${rawAccounts[0].slice(0, 6)} active via ${ethProvider === window.ethereum ? 'EXTERNAL WALLET' : 'WARPCAST NATIVE'}.`);
      }
    } catch (e) {
      console.error(e);
      addLog?.("🚨 HANDSHAKE FAILED: Core link rejected.");
    }
    setLoading(false);
  };

  const disconnectWallet = () => {
    setAddress(null);
    setManualDisconnect(true);
    setIsGenesisHolder(false);
    setActiveProviderType(null);
    addLog?.("⛓️ DOWNLINK TERMINATED: Sector disconnected.");
  };

  // 4. Background Synchronization
  useEffect(() => {
    if (manualDisconnect) return;

    let cleanup;
    const initWallet = async () => {
      // Step A: Passive Context Scan (Farcaster Discovery)
      // We must check this asynchronously before attempting provider resolution
      // so that React state propagation delays don't cause us to fallback to Metamask
      let isFrame = false;
      try {
        const ctx = await sdk.context;
        if (ctx) isFrame = true;
      } catch (e) {}

      // Step B: Active Provider Scan
      // We pass the local isFrame directly so we don't rely on React's farcasterContext yet
      const forcedProvider = isFrame && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? sdk?.wallet?.ethProvider : null;
      const ethProvider = forcedProvider || getProvider();
      
      if (!ethProvider) return;

      try {
        // Prevent ethers from throwing network errors on dormant Farcaster providers
        // by checking for authorized accounts manually via direct JSON-RPC first.
        let authorizedAccounts = [];
        try {
          const isFarcasterNative = ethProvider === sdk?.wallet?.ethProvider;
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          
          if (isFarcasterNative && !isMobile) {
             console.log("System V2: Farcaster Web client detected. Bypassing automatic eth_accounts to prevent Warpcast CSP failure.");
          } else {
             authorizedAccounts = await ethProvider.request({ method: 'eth_accounts' });
          }
        } catch (e) {
          // Silent fallback if method is unsupported or frame isn't ready
        }

        if (authorizedAccounts && authorizedAccounts.length > 0) {
          const provider = new BrowserProvider(ethProvider);
          const accAddr = authorizedAccounts[0];
          setAddress(accAddr);
          setActiveProviderType(ethProvider === sdk?.wallet?.ethProvider ? 'NATIVE' : 'EXTERNAL');
          checkGenesisNFT(accAddr, ethProvider);
        }

        // Listeners for accounts changes only apply if the provider supports 'on'
        if (ethProvider.on) {
          const handleAccs = (accs) => {
            if (accs && accs[0]) {
              setAddress(accs[0]);
              checkGenesisNFT(accs[0], ethProvider);
            } else { setAddress(null); }
          };
          ethProvider.on('accountsChanged', handleAccs);
          cleanup = () => ethProvider.removeListener?.('accountsChanged', handleAccs);
        }
      } catch (e) {}
    };

    initWallet();
    return () => cleanup && cleanup();
  }, [getProvider, checkGenesisNFT, manualDisconnect]);

  return { 
    address, isGenesisHolder, loading, 
    activeProviderType,
    connectWallet, 
    disconnectWallet,
    hasNativeProvider: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? !!sdk?.wallet?.ethProvider : false,
    hasExternalProvider: !!window.ethereum
  };
};
