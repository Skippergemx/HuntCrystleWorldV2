import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { sdk } from "@farcaster/frame-sdk";

export const useUnifiedAuth = () => {
  const [user, setUser] = useState(null);
  const [address, setAddress] = useState(null);
  const [isFarcaster, setIsFarcaster] = useState(false);
  const [farcasterContext, setFarcasterContext] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Platform Detection & Farcaster Context Discovery
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        const ctx = await sdk.context;
        if (ctx) {
          console.log("Farcaster Frame v2 Context Loaded:", ctx);
          setFarcasterContext(ctx);
          setIsFarcaster(true);
          
          // Identity-First: Capture the User's preferred wallet instantly
          if (ctx.user?.address) {
             setAddress(ctx.user.address);
          }
        }
      } catch (e) {
        console.log("Standard Browser Detected: Running outside Farcaster environment.");
      }
    };
    initFarcaster();
  }, []);

  // 2. Firebase Identity Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        // Hybrid logic: Map PFP/Username based on platform
        const platformUser = {
          uid: u.uid,
          email: u.email,
          username: isFarcaster ? farcasterContext?.user?.username || u.displayName : u.displayName || u.email?.split('@')[0],
          pfp: isFarcaster ? farcasterContext?.user?.pfpUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}` : u.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}`
        };
        setUser(platformUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isFarcaster, farcasterContext]);

  // 3. SDK Ready Signal
  useEffect(() => {
    if (!loading && isFarcaster) {
       setTimeout(() => sdk.actions.ready(), 500);
    }
  }, [loading, isFarcaster]);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Google login error:", e);
      setLoading(false);
    }
  };

  const loginAnonymously = async () => {
     try {
       setLoading(true);
       await signInAnonymously(auth);
     } catch (e) {
       console.error("Anonymous login error:", e);
       setLoading(false);
     }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setAddress(null);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  // Manual wallet connect for WEB users
  const connectWallet = useCallback(async () => {
     if (isFarcaster && address) return; // Silent sync already done

     // This is a placeholder for standard MetaMask logic (EIP-1193)
     if (window.ethereum) {
        try {
           const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
           if (accounts[0]) {
              setAddress(accounts[0]);
              return accounts[0];
           }
        } catch (e) {
           console.error("Manual wallet error:", e);
        }
     }
  }, [isFarcaster, address]);

  return {
    user,
    address, // This will be pre-pumped if Farcaster context exists
    isFarcaster,
    farcasterContext,
    loading,
    loginWithGoogle,
    loginAnonymously,
    connectWallet,
    logout
  };
};
