import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { sdk } from "@farcaster/frame-sdk";

/**
 * useWallet V3: Hybrid Multi-Cloud Uplink
 *
 * DETECTION HIERARCHY (in priority order):
 * 1. Farcaster SDK Context — reads custodyAddress/verifiedAddresses directly (no user prompt)
 * 2. Farcaster ethProvider — fallback for explicit connectWallet on mobile
 * 3. window.ethereum — standard browser wallet extensions (MetaMask etc.)
 *
 * Farcaster Desktop: blocked entirely to prevent Warpcast CSP violations
 */
const BASE_CHAIN_ID = '0x2105'; // 8453
const GENESIS_NFT_ADDRESS = '0x0000000000000000000000000000000000000000'; // PLACEHOLDER
const MINIMAL_ABI = ["function balanceOf(address owner) view returns (uint256)"];

export const useWallet = (addLog, farcasterContext) => {
  const [address, setAddress] = useState(null);
  const [isGenesisHolder, setIsGenesisHolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeProviderType, setActiveProviderType] = useState(null); // 'CONTEXT' | 'NATIVE' | 'EXTERNAL'
  const [manualDisconnect, setManualDisconnect] = useState(false);

  const isMobile = typeof navigator !== 'undefined'
    ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    : false;

  // 1. Asset Verification
  const checkGenesisNFT = useCallback(async (userAddress, provider) => {
    if (!provider || GENESIS_NFT_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    try {
      const ethersProvider = new BrowserProvider(provider);
      const contract = new Contract(GENESIS_NFT_ADDRESS, MINIMAL_ABI, ethersProvider);
      const balance = await contract.balanceOf(userAddress);
      setIsGenesisHolder(Number(balance) > 0);
    } catch (e) { console.error("NFT Verification Error:", e); }
  }, []);

  // 2. Explicit Wallet Connect (user-triggered)
  const connectWallet = async (type = 'AUTO') => {
    setManualDisconnect(false);

    // ── Farcaster Path ──
    if (farcasterContext || type === 'NATIVE') {
      // Always try SDK context first — it has pre-authorized addresses, no prompt needed
      try {
        const ctx = await sdk.context;
        if (ctx?.user) {
          const verifiedAddr = ctx.user.verifiedAddresses?.ethAddresses?.[0];
          const custodyAddr = ctx.user.custodyAddress;
          const resolvedAddr = verifiedAddr || custodyAddr;
          if (resolvedAddr) {
            setAddress(resolvedAddr);
            setActiveProviderType('CONTEXT');
            addLog?.(`⛓️ FARCASTER WALLET SYNCED: ${resolvedAddr.slice(0, 6)}...${resolvedAddr.slice(-4)}`);
            return;
          }
        }
      } catch (e) {
        console.warn('SDK context read failed, trying ethProvider:', e);
      }

      // Farcaster ethProvider fallback — mobile only
      if (isMobile && sdk?.wallet?.ethProvider) {
        setLoading(true);
        try {
          const rawAccounts = await sdk.wallet.ethProvider.request({ method: 'eth_requestAccounts' });
          if (rawAccounts?.[0]) {
            setAddress(rawAccounts[0]);
            setActiveProviderType('NATIVE');
            addLog?.(`⛓️ WARPCAST NATIVE UPLINK: ${rawAccounts[0].slice(0, 6)}...${rawAccounts[0].slice(-4)}`);
          }
        } catch (e) {
          console.error('Farcaster ethProvider connect failed:', e);
          addLog?.("🚨 FRAME ERROR: Farcaster wallet connect rejected.");
        }
        setLoading(false);
        return;
      }

      // Desktop Farcaster — block silently (no CSP-triggering calls)
      if (!isMobile) {
        console.log("System V3: Farcaster Desktop — wallet connect blocked to prevent CSP violation.");
        return;
      }
    }

    // ── External Browser Wallet (MetaMask etc.) ──
    if (type === 'EXTERNAL' || (!farcasterContext && type === 'AUTO')) {
      const ethProvider = window.ethereum;
      if (!ethProvider) {
        addLog?.("🚨 WEB3 ERROR: No crypto wallet extension detected.");
        return;
      }
      setLoading(true);
      try {
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
        const rawAccounts = await ethProvider.request({ method: 'eth_requestAccounts' });
        if (rawAccounts?.[0]) {
          setAddress(rawAccounts[0]);
          setActiveProviderType('EXTERNAL');
          await checkGenesisNFT(rawAccounts[0], ethProvider);
          addLog?.(`⛓️ WEB3 UPLINK ACTIVE: Sector ${rawAccounts[0].slice(0, 6)} synced.`);
        }
      } catch (e) {
        console.error(e);
        addLog?.("🚨 HANDSHAKE FAILED: Core link rejected.");
      }
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setManualDisconnect(true);
    setIsGenesisHolder(false);
    setActiveProviderType(null);
    addLog?.("⛓️ DOWNLINK TERMINATED: Sector disconnected.");
  };

  // 3. Background Auto-Detection on Mount
  useEffect(() => {
    if (manualDisconnect) return;

    let cleanup;
    const initWallet = async () => {
      // Step 1: Check if we're inside a Farcaster frame
      let ctx = null;
      try {
        ctx = await sdk.context;
      } catch (e) {}

      const isFrame = !!ctx?.user?.fid;

      if (isFrame) {
        // Step 2a: Try SDK context addresses directly (fastest, no prompt)
        const verifiedAddr = ctx.user.verifiedAddresses?.ethAddresses?.[0];
        const custodyAddr = ctx.user.custodyAddress;
        const contextAddr = verifiedAddr || custodyAddr;

        if (contextAddr) {
          console.log(`System V3: Wallet from SDK context: ${contextAddr}`);
          setAddress(contextAddr);
          setActiveProviderType('CONTEXT');
          return;
        }

        // Step 2b: Try eth_accounts via ethProvider.
        // eth_accounts is READ-ONLY — it does NOT trigger WalletConnect initialization.
        // Safe to call on ALL Farcaster environments (mobile + desktop) without CSP risk.
        if (sdk?.wallet?.ethProvider) {
          try {
            const accounts = await sdk.wallet.ethProvider.request({ method: 'eth_accounts' });
            if (accounts?.[0]) {
              console.log(`System V3: Wallet from ethProvider eth_accounts: ${accounts[0]}`);
              setAddress(accounts[0]);
              setActiveProviderType('NATIVE');
              return;
            }
          } catch (e) {
            console.log('System V3: eth_accounts failed (expected on Desktop):', e?.message);
          }

          // Step 2c: eth_accounts returned empty — escalate to eth_requestAccounts.
          // eth_requestAccounts CAN trigger WalletConnect on Desktop → guard behind mobile only.
          if (isMobile) {
            try {
              console.log('System V3: Requesting accounts via eth_requestAccounts (mobile only)...');
              const requested = await sdk.wallet.ethProvider.request({ method: 'eth_requestAccounts' });
              if (requested?.[0]) {
                console.log(`System V3: Wallet from eth_requestAccounts: ${requested[0]}`);
                setAddress(requested[0]);
                setActiveProviderType('NATIVE');
                return;
              }
            } catch (e) {
              console.error('System V3: eth_requestAccounts failed:', e);
            }
          } else {
            console.log('System V3: Desktop Farcaster — skipping eth_requestAccounts to prevent CSP.');
          }
        }

        // Stop here — never fall through to MetaMask for Farcaster users
        return;
      }

      // Step 3: Not a Farcaster frame — scan external browser wallet (MetaMask etc.)
      const ethProvider = window.ethereum;
      if (!ethProvider) return;

      try {
        const accounts = await ethProvider.request({ method: 'eth_accounts' });
        if (accounts?.[0]) {
          setAddress(accounts[0]);
          setActiveProviderType('EXTERNAL');
          checkGenesisNFT(accounts[0], ethProvider);
        }

        if (ethProvider.on) {
          const handleAccs = (accs) => {
            if (accs?.[0]) {
              setAddress(accs[0]);
              checkGenesisNFT(accs[0], ethProvider);
            } else {
              setAddress(null);
            }
          };
          ethProvider.on('accountsChanged', handleAccs);
          cleanup = () => ethProvider.removeListener?.('accountsChanged', handleAccs);
        }
      } catch (e) {
        console.error('System V3: External wallet scan failed:', e);
      }
    };

    initWallet();
    return () => cleanup && cleanup();
  }, [manualDisconnect, isMobile, checkGenesisNFT]);

  return {
    address, isGenesisHolder, loading,
    activeProviderType,
    connectWallet,
    disconnectWallet,
    hasNativeProvider: isMobile ? !!sdk?.wallet?.ethProvider : false,
    hasExternalProvider: !!window.ethereum
  };
};
