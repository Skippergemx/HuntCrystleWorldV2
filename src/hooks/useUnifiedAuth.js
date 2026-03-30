import { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { sdk } from "@farcaster/frame-sdk";

/**
 * useUnifiedAuth V2: The Core Identity Hub
 * Responsible for discovering platform context and managing non-game profile state.
 */
export const useUnifiedAuth = () => {
  const [user, setUser] = useState(null);
  const [isFarcaster, setIsFarcaster] = useState(false);
  const [farcasterContext, setFarcasterContext] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Platform Detection & Farcaster Handshake
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

          // Silent anonymous login for Farcaster users to establish a persistence UID
          if (!auth.currentUser) {
            console.log("System V2: Initiating Farcaster Silent Auth...");
            await signInAnonymously(auth);
          }
        }
      } catch (e) {
        console.log("System V2: Browser Node Detected.");
      }
    };
    initFarcaster();
  }, []);

  // 2. Identity Sync (Firebase <-> Application State)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        console.log("System V2: Identity Verified. UID:", u.uid);
        
        // Unify identity based on the best available meta-data
        const unifiedUser = {
          uid: u.uid,
          email: u.email || null,
          farcasterFID: farcasterContext?.user?.fid || null,
          username: isFarcaster ? farcasterContext?.user?.username || u.displayName : u.displayName || u.email?.split('@')[0],
          pfp: isFarcaster ? farcasterContext?.user?.pfpUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}` : u.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}`,
          platform: isFarcaster ? 'farcaster' : 'browser'
        };
        
        setUser(unifiedUser);
      } else {
        console.log("System V2: Identity Nullified.");
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isFarcaster, farcasterContext]);

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
      await signOut(auth);
    } catch (e) { console.error("Logout Error:", e); }
  };

  return {
    user,
    loading,
    isFarcaster,
    farcasterContext,
    loginWithGoogle,
    loginAnonymously,
    logout
  };
};
