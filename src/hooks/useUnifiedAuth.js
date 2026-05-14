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
        const contextPromise = sdk.context;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Farcaster SDK Timeout")), 1500)
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
              // Even if it fails, we should stop loading to show at least something
              setLoading(false);
              return;
            }
          }

          // Use the FID to synthesize the user profile matching the 'FC_.*' Firestore rule
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
          
          // CRITICAL: Tell Farcaster client we are ready to hide its native loading screen
          try {
            sdk.actions.ready();
          } catch (err) {
            console.warn("Farcaster ready() failed:", err);
          }
          return;
        }

        // Standard Google Auth Path
        if (u) {
          // Security: if they are anon but NOT farcaster, log them out
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
        
        // Also call ready for browser version if running as a frame
        try {
          sdk.actions.ready();
        } catch (err) {}
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
