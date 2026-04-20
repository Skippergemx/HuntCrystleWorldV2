import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useAccount, useDisconnect } from 'wagmi';

/**
 * useUnifiedAuth V3: Google-Only Identity Hub
 * Manages Firebase Google Auth. Wallet state is handled separately by useWallet.
 * Farcaster and Telegram integrations have been removed.
 */
export const useUnifiedAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  // Identity Sync: Firebase Auth State → Application State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        console.log("System V3: Google Identity Verified. UID:", u.uid);
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
        console.log("System V3: Identity Nullified.");
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [address]);

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
