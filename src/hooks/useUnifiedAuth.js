import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { useAccount, useDisconnect } from 'wagmi';
import sdk from '@farcaster/frame-sdk';

/**
 * useUnifiedAuth V4: Hybrid Identity Hub (Google + Farcaster)
 * Manages Firebase Google Auth and intercepts Farcaster Native Mini App sessions.
 */
export const useUnifiedAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    const init = async () => {
      // DEV MODE CHECK: Skip Firebase entirely and create mock user
      // __DEV_MODE__ is a compile-time constant replaced by Vite's define:
      //   - `true` during dev (vite / npm run dev)
      //   - `false` in production builds (vite build)
      // The bundler tree-shakes the entire block below out of production bundles.
      if (__DEV_MODE__) {
        const envDevMode = import.meta.env.VITE_DEV_MODE;
        const envDEV = import.meta.env.DEV;
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'NO_WINDOW';
        const pwFlag = typeof window !== 'undefined' ? window.__PLAYWRIGHT_DEV_MODE__ : undefined;
        console.log("[DGBUG] VITE_DEV_MODE env:", JSON.stringify(envDevMode), "| DEV flag:", envDEV, "| hostname:", hostname, "| __PLAYWRIGHT_DEV_MODE__:", pwFlag);

        const isDevMode = envDevMode === 'true' ||
                          envDEV === true ||
                          hostname === 'localhost' ||
                          hostname === '127.0.0.1' ||
                          pwFlag === true;
        
        console.log("[DGBUG] isDevMode:", isDevMode);
        if (isDevMode) {
          console.log("System V4: Dev Mode Detected — Bypassing Firebase Auth");
          const devUser = {
            uid: 'DEV_LOCAL_' + Date.now(),
            email: 'dev@test.local',
            username: 'Dev Hunter',
            pfp: 'https://api.dicebear.com/7.x/identicon/svg?seed=DEV',
            platform: 'dev',
            walletAddress: null
          };
          setUser(devUser);
          setLoading(false);
          return;
        }
      }

      let isFarcaster = false;
      let fcUser = null;

      try {
        // Add a timeout to sdk.context to prevent hanging if not in Farcaster environment
        // Increased to 3000ms to be more resilient to slow network/clients
        const contextPromise = sdk.context;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Farcaster SDK Timeout")), 3000)
        );
        
        const context = await Promise.race([contextPromise, timeoutPromise]);
        
        if (context && context.user) {
          isFarcaster = true;
          fcUser = context.user;
          console.log(`System V4: Farcaster Native Context Detected. FID: ${fcUser.fid}`);
        }
      } catch (e) {
        // Silent fail for non-Farcaster environments
        console.log("System V4: Farcaster Context check completed (Native: False)");
      }

      if (!isMounted) return;

      // CRITICAL: Signal readiness as soon as environment check is done.
      // This hides the Farcaster native splash screen and shows our own LoadingScreen.
      try {
        sdk.actions.ready();
      } catch (err) {
        console.warn("Farcaster ready() early signal failed:", err);
      }

      unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (!isMounted) return;

        if (isFarcaster && fcUser) {
          // In Farcaster: We need an anonymous session to talk to Firestore securely.
          if (!u) {
            console.log("System V4: Initiating Anonymous Firebase Bridge for Farcaster...");
            try {
              await signInAnonymously(auth);
              return; // wait for the next auth state change trigger
            } catch (error) {
              console.error("Anonymous Auth Failed:", error);
              setLoading(false);
              return;
            }
          }

          const unifiedUser = {
            uid: u.uid,
            email: null,
            username: fcUser.username || `FC_Hunter_${fcUser.fid}`,
            pfp: fcUser.pfpUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=FC_${fcUser.fid}`,
            platform: 'farcaster',
            farcasterData: { fid: fcUser.fid, username: fcUser.username, pfpUrl: fcUser.pfpUrl },
            walletAddress: address ? address.toLowerCase() : null
          };
          setUser(unifiedUser);
          setLoading(false);
          return;
        }

        // Standard Google Auth Path
        if (u) {
          if (u.isAnonymous && !isFarcaster) {
            await signOut(auth);
            setUser(null);
            setLoading(false);
            return;
          }

          console.log("System V4: Google Identity Verified. UID:", u.uid);
          const unifiedUser = {
            uid: u.uid,
            email: u.email || null,
            username: u.displayName || u.email?.split('@')[0],
            pfp: u.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}`,
            platform: 'browser',
            walletAddress: address ? address.toLowerCase() : null
          };
          setUser(unifiedUser);
        } else {
          console.log("System V4: Identity Nullified.");
          setUser(null);
        }
        setLoading(false);
      });
    };

    init();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []); // Only run once on mount

  // Separate effect to sync wallet address updates without re-running auth logic
  useEffect(() => {
    if (user && address && user.walletAddress !== address.toLowerCase()) {
      setUser(prev => prev ? { ...prev, walletAddress: address.toLowerCase() } : null);
    }
  }, [address, user]);

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

  const loginDev = () => {
    if (!__DEV_MODE__) return; // safety net — tree-shaken in production
    const devUser = {
      uid: 'DEV_LOCAL_' + Date.now(),
      email: 'dev@test.local',
      username: 'Dev Hunter',
      pfp: 'https://api.dicebear.com/7.x/identicon/svg?seed=DEV',
      platform: 'dev',
      walletAddress: null
    };
    setUser(devUser);
    setLoading(false);
    console.log("System V4: Dev Mode Activated — Mock Identity:", devUser.uid);
  };

  const logout = async () => {
    try {
      if (disconnect) disconnect();
      await signOut(auth);
    } catch (e) { console.error("Logout Error:", e); }
  };

  return {
    user,
    loading,
    loginWithGoogle,
    loginDev,
    logout
  };
};
