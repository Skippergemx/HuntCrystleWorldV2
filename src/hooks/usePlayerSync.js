import { useState, useRef, useCallback, useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * usePlayerSync V2: The Primary Data Hub
 * Responsible for ALL database interactions for player profiles.
 * Stripped of all legacy artifact-based fallbacks for the Ultimate Reset.
 */
export const usePlayerSync = (user, db, appId, farcasterContext) => {
  const [player, setPlayer] = useState(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [activeDocId, setActiveDocId] = useState(null);
  
  // Sync timeout ref for batching/throttling Firestore writes
  const syncTimeoutRef = useRef(null);
  const pendingUpdatesRef = useRef({});

  // 1. Unified Player Hydration (Primary Entry Point)
  useEffect(() => {
    // We only load if we have the user object.
    // If we're on Farcaster but the identity sync (user.farcasterFID) hasn't finished attaching,
    // wait for it so we don't accidentally split the profile!
    if (!user || (farcasterContext && !user.farcasterFID)) {
        setLoadingPlayer(!user ? false : true);
        if (!user) setPlayer(null);
        return;
    }

    const loadUnifiedProfile = async () => {
        try {
            setLoadingPlayer(true);
            
            // --- UNIFIED RESOLVER: IDENTITY HIERARCHY ---
            let primaryAuthId = null;
            let existingWalletDoc = null;

            // TRACK 1: WALLET POINTER (Absolute Priority)
            if (user.walletAddress) {
                const normalizedWallet = user.walletAddress.toLowerCase();
                console.log(`System V2: Scanning Sector for Wallet Address (Normalized): ${normalizedWallet}`);
                const q = query(collection(db, 'players'), where('walletAddress', 'in', [user.walletAddress, normalizedWallet]));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    existingWalletDoc = querySnapshot.docs[0];
                    primaryAuthId = existingWalletDoc.id;
                    console.log(`System V2: Identity Resolved via Global Wallet Match: ${primaryAuthId}`);
                }
            }

            // TRACK 2: PLATFORM IDENTITY (Fallback)
            if (!primaryAuthId) {
                primaryAuthId = user.farcasterFID ? `FC_${user.farcasterFID}` : user.uid;
                console.log(`System V2: Identity Resolved via Platform ID: ${primaryAuthId}`);
            }

            setActiveDocId(primaryAuthId);
            const docRef = doc(db, 'players', primaryAuthId);
            const docSnap = existingWalletDoc || await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log(`System V2: Hydrating Linked Archive: ${primaryAuthId}`);

                // ENFORCED GLOBAL SCHEMA
                const sanitized = {
                    ...data,
                    // Dynamic Metadata Sync (keep linked profile fresh)
                    uid: user.uid,
                    email: user.email || data.email || null,
                    farcasterFID: user.farcasterFID || data.farcasterFID || null,
                    farcasterUsername: user.farcasterUsername || data.farcasterUsername || null,
                    name: data.name || user.username || `Hunter_${user.uid.slice(0, 4)}`,
                    pfp: data.pfp || user.pfp || null,
                    walletAddress: user.walletAddress ? user.walletAddress.toLowerCase() : data.walletAddress || null,
                    
                    level: data.level || 1,
                    xp: data.xp || 0,
                    tokens: data.tokens || 100,
                    hp: data.hp ?? 150,
                    maxHp: data.maxHp ?? 150,
                    baseStats: data.baseStats || { str: 10, agi: 10, dex: 10 },
                    gemx: data.gemx || { level: 1, crystalsFed: 0 },
                    dragon: data.dragon || { level: 1, fruitsFed: 0 },
                    gemxAvatar: data.gemxAvatar || 'Cosmic gemx (1).gif',
                    recipes: data.recipes || ['crystle_blade'],
                    inventory: data.inventory || [],
                    equipped: data.equipped || { Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null },
                    maxDepth: data.maxDepth || 1,
                    performanceMode: data.performanceMode ?? false,
                    selectedPotionId: data.selectedPotionId || 'hp_potion',
                    selectedScrollId: data.selectedScrollId || 'auto_scroll',
                    avatar: data.avatar || 1
                };

                setPlayer(sanitized);
            } else {
                console.log(`System V2: No Archive Found for ${primaryAuthId}. Constructing Genesis Profile...`);
                
                const genesisProfile = {
                    uid: user.uid,
                    email: user.email || null,
                    farcasterFID: user.farcasterFID || null,
                    farcasterUsername: user.farcasterUsername || null,
                    name: user.username || `Hunter_${user.uid.slice(0, 4)}`,
                    pfp: user.pfp || null,
                    level: 1, xp: 0, tokens: 100,
                    hp: 150, maxHp: 150,
                    baseStats: { str: 10, agi: 10, dex: 10 },
                    abilityPoints: 5, potions: 5,
                    autoScrolls: 0, autoUntil: 0,
                    hiredMate: null, buffUntil: 0,
                    equipped: { Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null },
                    recipes: ['crystle_blade'],
                    inventory: [],
                    totalBossDamage: 0, maxDepth: 1,
                    penaltyUntil: 0, autoMode: null,
                    gemx: { level: 1, crystalsFed: 0 },
                    dragon: { level: 1, fruitsFed: 0 },
                    gemxAvatar: 'Cosmic gemx (1).gif',
                    dragonAnimationEnabled: true,
                    performanceMode: false,
                    selectedPotionId: 'hp_potion',
                    selectedScrollId: 'auto_scroll',
                    avatar: 1,
                    walletAddress: user.walletAddress || null,
                    createdAt: serverTimestamp()
                };
                
                setPlayer(genesisProfile);
                await setDoc(docRef, genesisProfile);
            }
        } catch (e) {
            console.error("Critical Resolution Failure:", e);
        } finally {
            setLoadingPlayer(false);
        }
    };

    loadUnifiedProfile();
  }, [user, db, appId, farcasterContext]);

  // 2. Throttled Sync Mechanism (Batch Writing to Firestore)
  const syncPlayer = useCallback(async (updates) => {
    // If the database doc identifier isn't ready, halt the queue
    if (!user || (farcasterContext && !user.farcasterFID)) return;
    if (!activeDocId) return;

    // Sterilize numbers: Prevent float jitter for combat-critical metrics
    const sterilized = { ...updates };
    ['hp', 'maxHp', 'xp', 'tokens'].forEach(key => {
        if (sterilized[key] !== undefined && typeof sterilized[key] === 'number') {
            sterilized[key] = Math.floor(sterilized[key]);
        }
    });

    // Local update for instant UI feedback
    setPlayer(prev => {
      const next = { ...prev, ...sterilized, updatedAt: new Date() }; // Visual indicator of freshness

      // Queue these changes for the prochain Firestore sync
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...sterilized, updatedAt: serverTimestamp() };

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          const docRef = doc(db, 'players', activeDocId);
          
          const payload = { ...pendingUpdatesRef.current };
          pendingUpdatesRef.current = {};
          
          await setDoc(docRef, payload, { merge: true });
          console.log("System V2: Remote Sector Synchronized.", activeDocId);
        } catch (e) {
          console.error("Sync Error:", e);
        }
      }, 2000); // 2s throttle

      return next;
    });
  }, [user, db, appId, farcasterContext, activeDocId]);

  return { player, setPlayer, syncPlayer, loadingPlayer };
};
