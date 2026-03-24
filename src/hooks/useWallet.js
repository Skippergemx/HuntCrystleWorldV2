import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';

// BASE MAINNET CONFIG
const BASE_CHAIN_ID = '0x2105'; // 8453
const GENESIS_NFT_ADDRESS = '0x0000000000000000000000000000000000000000'; // PLACEHOLDER: USER TO PROVIDE
const MINIMAL_ABI = ["function balanceOf(address owner) view returns (uint256)"];

export const useWallet = (addLog) => {
  const [address, setAddress] = useState(null);
  const [isGenesisHolder, setIsGenesisHolder] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkGenesisNFT = useCallback(async (userAddress) => {
    if (!window.ethereum || GENESIS_NFT_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(GENESIS_NFT_ADDRESS, MINIMAL_ABI, provider);
      const balance = await contract.balanceOf(userAddress);
      setIsGenesisHolder(Number(balance) > 0);
    } catch (e) {
      console.error("NFT Verification Error:", e);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return addLog("🚨 WEB3 ERROR: No crypto wallet detected.");
    
    setLoading(true);
    try {
      // Switch to Base automatically if possible
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BASE_CHAIN_ID }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
           await window.ethereum.request({
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

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts[0]) {
        setAddress(accounts[0]);
        await checkGenesisNFT(accounts[0]);
        addLog(`⛓️ WEB3 CONNECTED: ${accounts[0].slice(0, 6)}... Linked to Base Chain.`);
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
    if (window.ethereum?.selectedAddress) {
      setAddress(window.ethereum.selectedAddress);
      checkGenesisNFT(window.ethereum.selectedAddress);
    }
  }, [checkGenesisNFT]);

  return { address, isGenesisHolder, loading, connectWallet, disconnectWallet };
};
