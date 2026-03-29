import { useEffect, useState, useCallback } from "react";
import sdk from "@farcaster/frame-sdk";
import { ethers } from "ethers";
import { db, auth } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously } from "firebase/auth";

/**
 * useUnifiedAuth
 * 
 * A unified authentication and wallet management hook for Dungeons With Gems.
 * Handles Farcaster Frame v2 native identities and standard Web (Google + MetaMask) flows.
 */
export const useUnifiedAuth = () => {
    const [user, setUser] = useState(null);
    const [address, setAddress] = useState(null);
    const [isFarcaster, setIsFarcaster] = useState(false);
    const [loading, setLoading] = useState(true);
    const [farcasterContext, setFarcasterContext] = useState(null);

    // Helper to sync player data to Firestore
    const syncPlayerToFirestore = useCallback(async (id, walletAddress, metadata = {}) => {
        try {
            const playerRef = doc(db, "players", id);
            await setDoc(playerRef, {
                walletAddress,
                lastSeen: new Date().toISOString(),
                updatedAt: new Date(),
                ...metadata
            }, { merge: true });
        } catch (error) {
            console.error("[Auth] Firestore sync error:", error);
        }
    }, []);

    // 1. Unified Initialization
    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                const context = await sdk.context;
                if (context?.user && isMounted) {
                    setIsFarcaster(true);
                    setFarcasterContext(context);
                    setUser({
                        fid: context.user.fid,
                        username: context.user.username,
                        pfp: context.user.pfpUrl
                    });

                    // Silent check for Farcaster wallet
                    const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider);
                    const accounts = await provider.send("eth_accounts", []);
                    if (accounts.length > 0) {
                        setAddress(accounts[0]);
                    }

                    // Auto-login Farcaster users anonymously to Firebase for data syncing
                    if (!auth.currentUser) await signInAnonymously(auth);

                    sdk.actions.ready();
                }
            } catch (e) {
                console.log("[Auth] SDK not found, proceeding with Web flow.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initAuth();

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (!fbUser || isFarcaster) return;

            setUser({
                uid: fbUser.uid,
                username: fbUser.displayName || "Operator",
                pfp: fbUser.photoURL
            });

            const docSnap = await getDoc(doc(db, "players", `uid_${fbUser.uid}`));
            if (docSnap.exists()) setAddress(docSnap.data().walletAddress);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [isFarcaster, syncPlayerToFirestore]);

    // Action: Connect/Sync Wallet manually
    const connectWallet = async () => {
        try {
            let provider;
            if (isFarcaster) {
                provider = new ethers.BrowserProvider(sdk.wallet.ethProvider);
            } else {
                if (!window.ethereum) throw new Error("No provider found");
                provider = new ethers.BrowserProvider(window.ethereum);
            }

            const accounts = await provider.send("eth_requestAccounts", []);
            const connectedAddress = accounts[0];
            setAddress(connectedAddress);

            const storageId = isFarcaster ? `fid_${user.fid}` : `uid_${user.uid}`;
            await syncPlayerToFirestore(storageId, connectedAddress, {
                platform: isFarcaster ? "farcaster" : "web"
            });
        } catch (error) {
            console.error("[Auth] Connection failed:", error);
        }
    };

    const loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
    const logout = () => signOut(auth);

    return { user, address, isFarcaster, loading, farcasterContext, loginWithGoogle, logout, connectWallet };
};