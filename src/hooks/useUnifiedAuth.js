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
            uid: `FC_${fcUser.fid}`,
            email: null,
            username: fcUser.username || `FC_Hunter_${fcUser.fid}`,
            pfp: fcUser.pfpUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=FC_${fcUser.fid}`,
            platform: 'farcaster',
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
    logout
  };
};
