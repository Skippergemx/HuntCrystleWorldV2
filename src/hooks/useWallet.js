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

  const getProvider = useCallback(() => {
    // Priority: Farcaster SDK Internal -> Window Ethereum (Metamask/other)
    if (sdk?.wallet?.provider) return sdk.wallet.provider;
    return window.ethereum;
  }, []);

  const checkGenesisNFT = useCallback(async (userAddress) => {
    const ethProvider = getProvider();
    if (!ethProvider || GENESIS_NFT_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    
    try {
      const provider = new BrowserProvider(ethProvider);
      const contract = new Contract(GENESIS_NFT_ADDRESS, MINIMAL_ABI, provider);
      const balance = await contract.balanceOf(userAddress);
      setIsGenesisHolder(Number(balance) > 0);
    } catch (e) {
      console.error("NFT Verification Error:", e);
    }
  }, [getProvider]);

  const connectWallet = async () => {
    const ethProvider = getProvider();
    if (!ethProvider) return addLog("🚨 WEB3 ERROR: No crypto wallet or Frame provider detected.");
    
    setLoading(true);
    try {
      // Switch to Base automatically if possible (Usually only for window.ethereum)
      if (ethProvider === window.ethereum) {
        try {
          await ethProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_CHAIN_ID }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
             await ethProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: BASE_CHAIN_ID,
                chainName: 'Base Mainnet',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org']
              }],
            });
          }
        }
      }

      const provider = new BrowserProvider(ethProvider);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts[0]) {
        setAddress(accounts[0]);
        await checkGenesisNFT(accounts[0]);
        addLog(`⛓️ WEB3 CONNECTED: ${accounts[0].slice(0, 6)}... Linked to Base Chain via ${ethProvider === window.ethereum ? 'METAMASK/EXTERNAL' : 'WARPCAFT_FRAME'}.`);
      }
    } catch (e) {
      console.error(e);
      addLog("🚨 WEB3 ERROR: Connection failed.");
    }
    setLoading(false);
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsGenesisHolder(false);
    addLog("⛓️ WEB3 DISCONNECTED: Wallet downlink terminated.");
  };

  // Auto-connect if already authorized
  useEffect(() => {
    const initAutoConnect = async () => {
       const ethProvider = getProvider();
       if (!ethProvider) return;
       
       try {
          const provider = new BrowserProvider(ethProvider);
          const accounts = await provider.listAccounts();
          if (accounts && accounts[0]) {
             setAddress(accounts[0].address);
             checkGenesisNFT(accounts[0].address);
          }
       } catch (e) {}
    };
    initAutoConnect();
  }, [getProvider, checkGenesisNFT]);

  return { address, isGenesisHolder, loading, connectWallet, disconnectWallet };
};
