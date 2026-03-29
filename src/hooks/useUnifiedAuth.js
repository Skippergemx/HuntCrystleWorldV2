import { useEffect, useState, useCallback } from "react";
import sdk from "@farcaster/frame-sdk";
import { ethers } from "ethers";
import { db, auth } from "../firebase"; // Replace with your actual firebase init path
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

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
            console.log(`[Auth] Player ${id} synced with wallet: ${walletAddress}`);
        } catch (error) {
            console.error("[Auth] Firestore sync error:", error);
        }
    }, []);

    // 1. Farcaster Flow: Initialize SDK and fetch preferred wallet
    useEffect(() => {
        const initFarcaster = async () => {
            const context = await sdk.context;

            if (context?.user) {
                setIsFarcaster(true);
                setUser({
                    fid: context.user.fid,
                    username: context.user.username,
                    pfp: context.user.pfpUrl
                });

                try {
                    // Request account via Farcaster's native bridge
                    const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider);
                    const accounts = await provider.send("eth_accounts", []);

                    if (accounts.length > 0) {
                        const preferredAddress = accounts[0];
                        setAddress(preferredAddress);

                        // Sync to Firestore using FID as the immutable ID
                        await syncPlayerToFirestore(`fid_${context.user.fid}`, preferredAddress, {
                            platform: "farcaster",
                            username: context.user.username
                        });
                    }
                } catch (err) {
                    console.warn("[Auth] Farcaster wallet retrieval failed:", err);
                }

                // Signal to the Farcaster client that the frame is ready
                sdk.actions.ready();
            }
            setLoading(false);
        };

        initFarcaster();
    }, [syncPlayerToFirestore]);

    // 2. Web Flow: Standard Firebase Auth + Wallet detection
    useEffect(() => {
        if (isFarcaster) return; // Skip if in Farcaster environment

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    username: firebaseUser.displayName,
                    pfp: firebaseUser.photoURL
                });

                // Try to retrieve previously saved address
                const docSnap = await getDoc(doc(db, "players", `uid_${firebaseUser.uid}`));
                if (docSnap.exists()) {
                    setAddress(docSnap.data().walletAddress);
                }
            } else {
                setUser(null);
                setAddress(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isFarcaster]);

    // Action: Connect/Sync Wallet manually
    const connectWallet = async () => {
        try {
            const provider = isFarcaster
                ? new ethers.BrowserProvider(sdk.wallet.ethProvider)
                : new ethers.BrowserProvider(window.ethereum);

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

    return { user, address, isFarcaster, loading, loginWithGoogle, connectWallet };
};