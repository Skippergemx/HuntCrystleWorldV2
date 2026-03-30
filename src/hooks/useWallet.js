import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { sdk } from "@farcaster/frame-sdk";

// BASE MAINNET CONFIG
const BASE_CHAIN_ID = '0x2105'; // 8453
const GENESIS_NFT_ADDRESS = '0x0000000000000000000000000000000000000000'; // PLACEHOLDER: USER TO PROVIDE
const MINIMAL_ABI = ["function balanceOf(address owner) view returns (uint256)"];

export const useWallet = (addLog) => {
  const [address, setAddress] = useState(null);
  const [isGenesisHolder, setIsGenesisHolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeProviderType, setActiveProviderType] = useState(null); // 'NATIVE' (FC), 'EXTERNAL' (Window)
  const [manualDisconnect, setManualDisconnect] = useState(false);

  const getProvider = useCallback((type) => {
    const forcedType = type || activeProviderType;
    if (forcedType === 'NATIVE') return sdk?.wallet?.provider;
    if (forcedType === 'EXTERNAL') return window.ethereum;
    
    // Default discovery logic
    if (sdk?.wallet?.provider) return sdk.wallet.provider;
    return window.ethereum;
  }, [activeProviderType]);

  const checkGenesisNFT = useCallback(async (userAddress, provider) => {
    if (!provider || GENESIS_NFT_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    try {
      const ethersProvider = new BrowserProvider(provider);
      const contract = new Contract(GENESIS_NFT_ADDRESS, MINIMAL_ABI, ethersProvider);
      const balance = await contract.balanceOf(userAddress);
      setIsGenesisHolder(Number(balance) > 0);
    } catch (e) { console.error("NFT Verification Error:", e); }
  }, []);

  const connectWallet = async (type = 'AUTO') => {
    let ethProvider;
    if (type === 'NATIVE') ethProvider = sdk?.wallet?.provider;
    else if (type === 'EXTERNAL') ethProvider = window.ethereum;
    else ethProvider = getProvider();

    if (!ethProvider) {
      const msg = type === 'NATIVE' ? "🚨 FRAME ERROR: Farcaster wallet provider not found." : "🚨 WEB3 ERROR: No crypto wallet extension detected.";
      return addLog(msg);
    }
    
    setManualDisconnect(false); // Reset opt-out if manual action taken
    setLoading(true);
    try {
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
        addLog(`⛓️ WEB3 CONNECTED: ${accounts[0].slice(0, 6)}... via ${ethProvider === window.ethereum ? 'EXTERNAL WALLET' : 'WARPCAST NATIVE'}.`);
      }
    } catch (e) {
      console.error(e);
      addLog("🚨 WEB3 ERROR: Uplink rejected or handshake failed.");
    }
    setLoading(false);
  };

  const disconnectWallet = () => {
    setAddress(null);
    setManualDisconnect(true);
    setIsGenesisHolder(false);
    setActiveProviderType(null);
    addLog("⛓️ WEB3 DISCONNECTED: Wallet downlink terminated.");
  };

  useEffect(() => {
    if (manualDisconnect) return; // Respect explicit opt-out
    
    const initAutoConnect = async () => {
       const ethProvider = getProvider();
       if (!ethProvider) return;
       try {
          const provider = new BrowserProvider(ethProvider);
          const accounts = await provider.listAccounts();
          if (accounts && accounts[0]) {
             setAddress(accounts[0].address);
             setActiveProviderType(ethProvider === sdk?.wallet?.provider ? 'NATIVE' : 'EXTERNAL');
             checkGenesisNFT(accounts[0].address, ethProvider);
          }
       } catch (e) {}
    };
    initAutoConnect();
  }, [getProvider, checkGenesisNFT]);

  return { 
    address, isGenesisHolder, loading, 
    activeProviderType,
    connectWallet, 
    disconnectWallet,
    hasNativeProvider: !!sdk?.wallet?.provider,
    hasExternalProvider: !!window.ethereum
  };
};
