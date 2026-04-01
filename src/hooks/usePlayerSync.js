import { useState, useRef, useCallback, useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * usePlayerSync V2: The Primary Data Hub
 * Responsible for ALL database interactions for player profiles.
 * Stripped of all legacy artifact-based fallbacks for the Ultimate Reset.
 */
export const usePlayerSync = (user, db, appId, farcasterContext) => {
  const [player, setPlayer] = useState(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  
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
            
            // UNIFIED PATH: All identities now located under the primary 'players' collection.
            // FIXED: If user is Farcaster, use FC_FID as primary database key! 
            // This natively syncs Mobile and Desktop sessions to the exact same database document,
            // destroying the "two instances of the same player" bug.
            const primaryAuthId = user.farcasterFID ? `FC_${user.farcasterFID}` : user.uid;
            const docRef = doc(db, 'players', primaryAuthId);
            
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log(`System V2: Unified Profile Loaded for ${user.username || user.uid}.`);

                // ENFORCED GLOBAL SCHEMA: Sanitize data to prevent NaN issues in the UI
                const sanitized = {
                    ...data,
                    // Identity Meta-Data Sync
                    uid: user.uid, // Store the raw anonymous UID for fallback reference only
                    email: user.email || data.email || null,
                    farcasterFID: user.farcasterFID || data.farcasterFID || null,
                    farcasterUsername: user.farcasterUsername || data.farcasterUsername || null,
                    name: user.username || data.name || `Hunter_${user.uid.slice(0, 4)}`,
                    pfp: user.pfp || data.pfp || null,
                    
                    // Essential Game Metrics Fallbacks
                    level: data.level || 1,
                    xp: data.xp || 0,
                    tokens: data.tokens || 100,
                    hp: data.hp ?? 150,
                    maxHp: data.maxHp ?? 150,
                    baseStats: data.baseStats || { str: 10, agi: 10, dex: 10 },
                    
                    // Complex Object Fallbacks
                    gemx: data.gemx || { level: 1, crystalsFed: 0 },
                    dragon: data.dragon || { level: 1, fruitsFed: 0 },
                    gemxAvatar: data.gemxAvatar || 'Cosmic gemx (1).gif',
                    recipes: data.recipes || ['crystle_blade'],
                    inventory: data.inventory || [],
                    equipped: data.equipped || { Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null },
                    
                    // System Flags
                    maxDepth: data.maxDepth || 1,
                    performanceMode: data.performanceMode ?? false,
                    selectedPotionId: data.selectedPotionId || 'hp_potion',
                    selectedScrollId: data.selectedScrollId || 'auto_scroll',
                    avatar: data.avatar || 1
                };

                setPlayer(sanitized);
            } else {
                console.log("System V2: Initializing Genesis Profile for a new Hunter...");
                
                // GENESIS PROFILE: Baseline configuration for a fresh start
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
                    abilityPoints: 5,
                    potions: 5,
                    autoScrolls: 0,
                    autoUntil: 0,
                    hiredMate: null,
                    buffUntil: 0,
                    equipped: { Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null },
                    recipes: ['crystle_blade'],
                    inventory: [],
                    totalBossDamage: 0,
                    maxDepth: 1,
                    penaltyUntil: 0,
                    autoMode: null,
                    gemx: { level: 1, crystalsFed: 0 },
                    dragon: { level: 1, fruitsFed: 0 },
                    gemxAvatar: 'Cosmic gemx (1).gif',
                    dragonAnimationEnabled: true,
                    performanceMode: false,
                    selectedPotionId: 'hp_potion',
                    selectedScrollId: 'auto_scroll',
                    guildId: null,
                    guildRole: null,
                    avatar: 1,
                    farcasterPfp: user.pfp || null,
                    walletAddress: null,
                    createdAt: serverTimestamp()
                };
                
                setPlayer(genesisProfile);
                await setDoc(docRef, genesisProfile);
            }
        } catch (e) {
            console.error("Player Hydration Error:", e);
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
          const primaryAuthId = user.farcasterFID ? `FC_${user.farcasterFID}` : user.uid;
          const docRef = doc(db, 'players', primaryAuthId);
          
          const payload = { ...pendingUpdatesRef.current };
          pendingUpdatesRef.current = {};
          
          await setDoc(docRef, payload, { merge: true });
          console.log("System V2: Remote Sector Synchronized.", primaryAuthId);
        } catch (e) {
          console.error("Sync Error:", e);
        }
      }, 2000); // 2s throttle

      return next;
    });
  }, [user, db, appId, farcasterContext]);

  return { player, setPlayer, syncPlayer, loadingPlayer };
};
