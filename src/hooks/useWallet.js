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

export const useWallet = (addLog) => {
  const [address, setAddress] = useState(null);
  const [isGenesisHolder, setIsGenesisHolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeProviderType, setActiveProviderType] = useState(null); // 'NATIVE' | 'EXTERNAL'
  const [manualDisconnect, setManualDisconnect] = useState(false);

  // 1. Provider Resolution Loop
  const getProvider = useCallback((type) => {
    const forcedType = type || activeProviderType;
    // Farcaster V2 uses sdk.wallet.provider as the EIP-1193 interface
    if (forcedType === 'NATIVE') return sdk?.wallet?.provider;
    if (forcedType === 'EXTERNAL') return window.ethereum;
    
    // Auto-Discovery: Farcaster takes priority if in-frame
    if (sdk?.wallet?.provider) return sdk.wallet.provider;
    return window.ethereum;
  }, [activeProviderType]);

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
    if (type === 'NATIVE') ethProvider = sdk?.wallet?.provider;
    else if (type === 'EXTERNAL') ethProvider = window.ethereum;
    else ethProvider = getProvider();

    if (!ethProvider) {
      const msg = type === 'NATIVE' ? "🚨 FRAME ERROR: Farcaster wallet provider not found." : "🚨 WEB3 ERROR: No crypto wallet extension detected.";
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

      const provider = new BrowserProvider(ethProvider);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts[0]) {
        setAddress(accounts[0]);
        setActiveProviderType(ethProvider === sdk?.wallet?.provider ? 'NATIVE' : 'EXTERNAL');
        await checkGenesisNFT(accounts[0], ethProvider);
        addLog?.(`⛓️ UPLINK SUCCESSful: Sector ${accounts[0].slice(0, 6)} active via ${ethProvider === window.ethereum ? 'EXTERNAL WALLET' : 'WARPCAST NATIVE'}.`);
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
      try {
        const ctx = await sdk.context;
        // Check for custodyAddress or verifiedAddress (if available in future SDK versions)
        const passiveAddress = ctx?.user?.custodyAddress || ctx?.user?.address;
        if (passiveAddress) {
          setAddress(passiveAddress);
          setActiveProviderType('NATIVE');
        }
      } catch (e) {}

      // Step B: Active Provider Scan
      const ethProvider = getProvider();
      if (!ethProvider) return;

      try {
        const provider = new BrowserProvider(ethProvider);
        const accounts = await provider.listAccounts();
        if (accounts && accounts[0]) {
          const accAddr = accounts[0].address;
          setAddress(accAddr);
          setActiveProviderType(ethProvider === sdk?.wallet?.provider ? 'NATIVE' : 'EXTERNAL');
          checkGenesisNFT(accAddr, ethProvider);
        }

        // Listeners
        if (ethProvider.on) {
          const handleAccs = (accs) => {
            if (accs[0]) {
              setAddress(accs[0]);
              checkGenesisNFT(accs[0], ethProvider);
            } else { setAddress(null); }
          };
          ethProvider.on('accountsChanged', handleAccs);
          cleanup = () => ethProvider.removeListener('accountsChanged', handleAccs);
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
    hasNativeProvider: !!sdk?.wallet?.provider,
    hasExternalProvider: !!window.ethereum
  };
};
