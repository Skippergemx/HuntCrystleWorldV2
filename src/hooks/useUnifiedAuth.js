import { useState, useEffect, useCallback, useMemo } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { sdk } from "@farcaster/frame-sdk";
import { useAccount, useDisconnect } from 'wagmi';

/**
 * useUnifiedAuth V2: The Core Identity Hub
 * Responsible for discovering platform context and managing non-game profile state.
 */
export const useUnifiedAuth = () => {
  const [user, setUser] = useState(null);
  const [isFarcaster, setIsFarcaster] = useState(false);
  const [farcasterContext, setFarcasterContext] = useState(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [telegramUserData, setTelegramUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // WAGMI Wallet Connect Auto-Auth Trigger (REMOVED)
  // We no longer trigger silent auth for standard browser wallets. 
  // Identity must be established via Google or Farcaster specifically.

  // 1. Platform Detection & Handshakes
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        const ctx = await sdk.context;
        if (ctx) {
          console.log("System V2: Farcaster Node Detected.", ctx);
          setFarcasterContext(ctx);
          setIsFarcaster(true);
          
          // Auto-pulse Frame ready signal
          setTimeout(() => sdk.actions.ready(), 500);

          // Silent anonymous login for Farcaster users
          if (!auth.currentUser) {
            console.log("System V2: Initiating Farcaster Silent Auth...");
            setLoading(true); 
            await signInAnonymously(auth);
          }
        }
      } catch (e) {
        console.log("System V2: Browser Node Detected.");
      }
    };

    // 1b. Telegram Handshake (Silent Detection)
    const initTelegram = async () => {
      const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
      const isRealTMA = !!webApp && typeof webApp.initData === 'string' && webApp.initData.length > 0;

      if (isRealTMA) {
        console.log("System V2: Telegram Node Detected.");
        setIsTelegram(true);
        setTelegramUserData(webApp.initDataUnsafe?.user);
        
        // Silent anonymous login for Telegram users
        if (!auth.currentUser) {
          console.log("System V2: Initiating Telegram Silent Auth...");
          setLoading(true); 
          await signInAnonymously(auth);
        }
      }
    };

    const initAll = async () => {
      await initFarcaster();
      await initTelegram();
    };
    initAll();
  }, []);

  // 2. Identity Sync (Firebase <-> Application State)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        console.log("System V2: Identity Verified. UID:", u.uid);
        
        // Unify identity based on the best available meta-data
        // Ladder: Telegram > Farcaster > Standard Web
        const unifiedUser = {
          uid: u.uid,
          email: u.email || null,
          farcasterFID: farcasterContext?.user?.fid || null,
          farcasterUsername: farcasterContext?.user?.username || null,
          telegramUserId: telegramUserData?.id || null,
          telegramUsername: telegramUserData?.username || null,
          username: isTelegram ? (telegramUserData?.username || telegramUserData?.first_name) : 
                    isFarcaster ? farcasterContext?.user?.username : 
                    u.displayName || u.email?.split('@')[0],
          pfp: isTelegram ? `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${telegramUserData?.id}` :
               isFarcaster ? farcasterContext?.user?.pfpUrl : 
               u.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}`,
          platform: isTelegram ? 'telegram' : isFarcaster ? 'farcaster' : 'browser',
          walletAddress: address ? address.toLowerCase() : null
        };
        
        setUser(unifiedUser);
      } else {
        console.log("System V2: Identity Nullified.");
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  // isTelegram and telegramUserData are included so the listener rebuilds the
  // unifiedUser object once the TMA handshake completes (they start as false/null).
  }, [isFarcaster, farcasterContext, isTelegram, telegramUserData, address]);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Google Auth Error:", e);
      setLoading(false);
    }
  };

  const loginAnonymously = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (e) {
      console.error("Anonymous Auth Error:", e);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isConnected) disconnect();
      await signOut(auth);
    } catch (e) { console.error("Logout Error:", e); }
  };

  return {
    user,
    loading,
    isFarcaster,
    farcasterContext,
    isTelegram,
    telegramUserData,
    loginWithGoogle,
    loginAnonymously,
    logout
  };
};
