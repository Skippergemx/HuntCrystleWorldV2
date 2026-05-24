import { useState, useRef, useCallback, useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, limit, onSnapshot, updateDoc, increment, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';

/**
 * usePlayerSync V4: Hybrid Data Hub (Google + Farcaster)
 * Responsible for ALL database interactions for player profiles.
 * Seamlessly routes documents using either Google UID or Farcaster FC_FID.
 */
export const usePlayerSync = (user, db, appId) => {
  const [player, setPlayer] = useState(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [activeDocId, setActiveDocId] = useState(null);
  const [sessionConflict, setSessionConflict] = useState(false);
  const [hasHydratedSession, setHasHydratedSession] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncFailed, setLastSyncFailed] = useState(false);

  // UNIQUE LOCAL SESSION IDENTIFIER
  const localSessionId = useRef(`SESS_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`).current;

  /**
   * IDENTITY SENTRY V3: The High-Security Identity Gateway
   * Performs multi-layered scans to prevent wallet theft and identity splits.
   */
  const identitySentry = useCallback(async (addressToScan) => {
    if (!addressToScan) return { success: true, collision: null };

    const normalized = addressToScan.toLowerCase().trim();
    const raw = addressToScan.trim();

    try {
      // Optimized Dual-Query (Indexed for Hall of Fame)
      // KEY: We scan the 'leaderboard' collection because it is public.
      // The 'players' collection is owner-locked for privacy.
      const qLower = query(collection(db, 'leaderboard'), where('walletAddress', '==', normalized));
      const qRaw = query(collection(db, 'leaderboard'), where('walletAddress', '==', raw));
      const [snapLower, snapRaw] = await Promise.all([getDocs(qLower), getDocs(qRaw)]);

      let collisionDoc = !snapLower.empty ? snapLower.docs[0] : (!snapRaw.empty ? snapRaw.docs[0] : null);

      const collisionId = collisionDoc?.id;
      if (collisionId && collisionId !== activeDocId) {
        const cData = collisionDoc.data();
        return {
          success: false,
          collision: {
            id: collisionId,
            name: cData.name || 'ANON_UNIT',
            platform: 'GOOGLE',
            level: cData.level || 1,
            address: normalized
          }
        };
      }

      return { success: true, collision: null };
    } catch (e) {
      console.error("Identity Sentry Failure:", e);
      return { success: false, error: e.message };
    }
  }, [db, activeDocId]);

  // Sync timeout ref for batching/throttling Firestore writes
  const syncTimeoutRef = useRef(null);
  const pendingUpdatesRef = useRef({});
  const syncFailureCount = useRef(0);
  const optimisticUpdatesRef = useRef({});

  const addOptimisticUpdate = useCallback((updates) => {
    const timestamp = Date.now();
    Object.entries(updates).forEach(([key, value]) => {
      optimisticUpdatesRef.current[key] = { value, timestamp };
    });
    setPlayer(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      Object.entries(updates).forEach(([key, value]) => {
        if (key.includes('.')) {
          const parts = key.split('.');
          let cursor = next;
          for (let i = 0; i < parts.length - 1; i++) {
            cursor[parts[i]] = { ...(cursor[parts[i]] || {}) };
            cursor = cursor[parts[i]];
          }
          if (value && typeof value === 'object' && value._methodName === 'deleteField') {
            delete cursor[parts[parts.length - 1]];
          } else {
            cursor[parts[parts.length - 1]] = value;
          }
        } else {
          next[key] = value;
        }
      });

      // Algorithmic AP Auto-Heal
      const level = next.level || 1;
      const baseStats = next.baseStats || { str: 10, agi: 10, dex: 10 };
      const safeStr = Number(baseStats.str) || 10;
      const safeAgi = Number(baseStats.agi) || 10;
      const safeDex = Number(baseStats.dex) || 10;
      const spentAP = (Math.max(10, safeStr) - 10) + (Math.max(10, safeAgi) - 10) + (Math.max(10, safeDex) - 10);
      const earnedAP = (Number(level) || 1) * 5;
      const trueAP = isNaN(earnedAP - spentAP) ? 0 : (earnedAP - spentAP);
      next.abilityPoints = Math.max(0, trueAP);

      return next;
    });
  }, []);

  // 1. Unified Player Hydration (Primary Entry Point)
  useEffect(() => {
    // GUARD: No auth context — bail out
    if (!user) {
      setLoadingPlayer(false);
      setPlayer(null);
      return;
    }

    const loadUnifiedProfile = async () => {
      try {
        setLoadingPlayer(true);

        // DEV MODE CHECK: Skip Firestore entirely, create local genesis profile
        // __DEV_MODE__ is a compile-time constant — tree-shaken in production builds.
        if (__DEV_MODE__) {
          const devEnv = typeof import.meta !== 'undefined' ? import.meta.env.VITE_DEV_MODE : undefined;
          const isDev = import.meta.env.DEV === true ||
                        devEnv === 'true' ||
                        (typeof window !== 'undefined' && window.location.hostname === 'localhost') ||
                        (typeof window !== 'undefined' && window.__PLAYWRIGHT_DEV_MODE__ === true);

          if (isDev) {
            console.log("System V4: Dev Mode — Creating local genesis profile (no Firestore)");
            const genesisProfile = {
              uid: user?.uid || null,
              email: user?.email || null,
              name: (user?.username || "").trim() || `Hunter_${(user?.uid || '0000').toString().slice(0, 4)}`,
              pfp: user?.pfp || null,
              platform: 'dev',
              farcasterData: null,
              level: 50, xp: 0, tokens: 999999,
              hp: 9999, maxHp: 9999,
              dailyFaucetClaims: 0,
              lastFaucetClaimDate: "",
              baseStats: { str: 50, agi: 50, dex: 50 },
              abilityPoints: 999, potions: 99,
              autoScrolls: 99, autoUntil: 0,
              hiredMate: null, buffUntil: 0,
              equipped: { Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null },
              recipes: ['crystle_blade'],
              inventory: {},
              totalBossDamage: 0,
              maxDepth: 1,
              maxDepthScore: 100001,
              maxDepthFloor: 1,
              maxDepthMapName: 'Neon Slums',
              maxDepthMapMinLevel: 1,
              penaltyUntil: 0, autoMode: null,
              gemx: { level: 1, crystalsFed: 0 },
              dragon: { level: 1, fruitsFed: 0 },
              gemxAvatar: 'Cosmic gemx (1).gif',
              selectedPotionId: 'hp_potion',
              selectedScrollId: 'auto_scroll',
              avatar: 1,
              unlockedPets: [1, 11, 21, 31, 41],
              sessionId: `DEV_SESS_${Date.now()}`,
              walletAddress: null,
              walletConflict: null
            };
            setActiveDocId(user?.uid || 'dev_local');
            setPlayer(genesisProfile);
            setHasHydratedSession(true);
            setLoadingPlayer(false);
            return;
          }
        }

        // IDENTITY RESOLVER: Google UID is the canonical player document key.
        const primaryAuthId = user.uid;

        console.log(`System V3: Resolving Identity for Core Node: ${primaryAuthId}`);

        setActiveDocId(primaryAuthId);
        const docRef = doc(db, 'players', primaryAuthId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log(`System V3: Hydrating Linked Archive: ${primaryAuthId}`);

          // --- WALLET CONFLICT CHECK ---
          let walletConflict = null;
          let activeWalletSync = data.walletAddress;

          if (data.walletAddress || user.walletAddress) {
            const addr = (data.walletAddress || user.walletAddress);
            const scan = await identitySentry(addr);

            if (!scan.success && scan.collision && scan.collision.id !== primaryAuthId) {
              console.warn(`System V3: Blockade Alert! Scrubbing unauthorized link to ${scan.collision.id}`);
              walletConflict = {
                ownerId: scan.collision.id,
                message: "This wallet belongs to another Hero node!",
                isFarcaster: false
              };
              activeWalletSync = undefined;
            } else if (scan.success) {
              activeWalletSync = addr.toLowerCase().trim();
            }
          }

          // ENFORCED GLOBAL SCHEMA
          const level = data.level || 1;
          const baseStats = data.baseStats || { str: 10, agi: 10, dex: 10 };

          // Algorithmic AP Auto-Heal
          const safeStr = Number(baseStats.str) || 10;
          const safeAgi = Number(baseStats.agi) || 10;
          const safeDex = Number(baseStats.dex) || 10;

          const spentAP = (Math.max(10, safeStr) - 10) + (Math.max(10, safeAgi) - 10) + (Math.max(10, safeDex) - 10);
          const earnedAP = (Number(level) || 1) * 5;
          const trueAP = isNaN(earnedAP - spentAP) ? 0 : (earnedAP - spentAP);

          const sanitized = {
            ...data,
            uid: user?.uid || null,
            email: user?.email || data.email || null,
            name: (data.name || user?.username || "").trim() || `Hunter_${(user?.uid || '0000').toString().slice(0, 4)}`,
            pfp: data.pfp || user?.pfp || null,
            platform: user?.platform || data.platform || 'browser',
            farcasterData: user?.farcasterData || data.farcasterData || null,

            walletAddress: data.walletAddress,
            walletConflict: walletConflict || null,

            level: level,
            xp: data.xp || 0,
            tokens: data.tokens || 100,
            hp: Number(data.hp ?? 150),
            maxHp: Number(data.maxHp ?? 150),
            abilityPoints: Math.max(0, trueAP), // Enforce strict AP calculation
            baseStats: baseStats,
            gemx: data.gemx || { level: 1, crystalsFed: 0 },
            dragon: data.dragon || { level: 1, fruitsFed: 0 },
            gemxAvatar: data.gemxAvatar || 'Cosmic gemx (1).gif',
            recipes: data.recipes || ['crystle_blade'],
            inventory: Array.isArray(data.inventory) ? Object.fromEntries(data.inventory.filter(i => i).map(i => [i.id || `ITEM_${Date.now()}_${Math.random()}`, i])) : (data.inventory || {}),
            equipped: data.equipped || { Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null },
            maxDepth: data.maxDepth || 1,
            maxDepthScore: data.maxDepthScore || (100000 + (data.maxDepth || 1)),
            maxDepthFloor: data.maxDepthFloor || data.maxDepth || 1,
            maxDepthMapName: data.maxDepthMapName || 'Neon Slums',
            maxDepthMapMinLevel: data.maxDepthMapMinLevel || 1,
            selectedPotionId: data.selectedPotionId || 'hp_potion',
            selectedScrollId: data.selectedScrollId || 'auto_scroll',
            avatar: data.avatar || 1,
            unlockedPets: data.unlockedPets || [1, 11, 21, 31, 41],
            dailyFaucetClaims: data.dailyFaucetClaims || 0,
            lastFaucetClaimDate: data.lastFaucetClaimDate || "",
            // ID MIGRATION: 'dragon' -> 'hatchling_mate'
            hiredMate: data.hiredMate === 'dragon' ? 'hatchling_mate' : (data.hiredMate || null)
          };

          // --- LOCAL PROTECTION SENTRY ---
          // Re-apply pending local updates before committing server data to state.
          // Prevents the "Wipeout" bug where a stale reload overwrites optimistic local gains.
          const pending = pendingUpdatesRef.current || {};
          const fullySanitized = { ...sanitized };

          Object.entries(pending).forEach(([key, value]) => {
            if (key === 'updatedAt') return;
            if (key.includes('.')) {
              const parts = key.split('.');
              let cursor = fullySanitized;
              for (let i = 0; i < parts.length - 1; i++) {
                cursor[parts[i]] = { ...(cursor[parts[i]] || {}) };
                cursor = cursor[parts[i]];
              }
              cursor[parts[parts.length - 1]] = value;
            } else {
              fullySanitized[key] = value;
            }
          });

          // Apply active optimistic updates (less than 10s old)
          const now = Date.now();
          Object.entries(optimisticUpdatesRef.current).forEach(([key, item]) => {
            if (now - item.timestamp > 10000) {
              delete optimisticUpdatesRef.current[key];
              return;
            }
            const value = item.value;
            if (key.includes('.')) {
              const parts = key.split('.');
              let cursor = fullySanitized;
              for (let i = 0; i < parts.length - 1; i++) {
                cursor[parts[i]] = { ...(cursor[parts[i]] || {}) };
                cursor = cursor[parts[i]];
              }
              cursor[parts[parts.length - 1]] = value;
            } else {
              fullySanitized[key] = value;
            }
          });

          // Enforce auto-heal on the final merged state
          const finalLevel = fullySanitized.level || 1;
          const finalStats = fullySanitized.baseStats || { str: 10, agi: 10, dex: 10 };
          const finalStr = Number(finalStats.str) || 10;
          const finalAgi = Number(finalStats.agi) || 10;
          const finalDex = Number(finalStats.dex) || 10;
          const finalSpent = (Math.max(10, finalStr) - 10) + (Math.max(10, finalAgi) - 10) + (Math.max(10, finalDex) - 10);
          const finalEarned = (Number(finalLevel) || 1) * 5;
          fullySanitized.abilityPoints = Math.max(0, isNaN(finalEarned - finalSpent) ? 0 : (finalEarned - finalSpent));

          setPlayer(fullySanitized);

          // --- ARTIFACT CURE PROTOCOL ---
          if (Array.isArray(data.inventory)) {
            await updateDoc(docRef, { inventory: fullySanitized.inventory });
            console.warn("System V4: Self-healed corrupted Array inventory format on Backend.");
          }

          // Step 4: Register Local Session
          await setDoc(docRef, { sessionId: localSessionId }, { merge: true });
          setHasHydratedSession(true);

          // Step 5: Mirror to Public Leaderboard Endpoint
          import('firebase/firestore').then(({ doc: fsDoc, setDoc: fsSetDoc }) => {
            fsSetDoc(fsDoc(db, 'leaderboard', primaryAuthId), {
              name: sanitized.name || "Unknown",
              avatar: sanitized.avatar || 1,
              platform: sanitized.platform || 'browser',
              level: sanitized.level || 1,
              totalBossDamage: sanitized.totalBossDamage || 0,
              maxDepthScore: sanitized.maxDepthScore || 0,
              tokens: sanitized.tokens || 0,
              walletAddress: sanitized.walletAddress || null,
              updatedAt: Date.now()
            }, { merge: true }).catch(() => {});
          });
        } else {
          console.log(`System V3: No Archive Found for ${primaryAuthId}. Constructing Genesis Profile...`);

          const genesisProfile = {
            uid: user?.uid || null,
            email: user?.email || null,
            name: (user?.username || "").trim() || `Hunter_${(user?.uid || '0000').toString().slice(0, 4)}`,
            pfp: user?.pfp || null,
            platform: user?.platform || 'browser',
            farcasterData: user?.farcasterData || null,
            level: 1, xp: 0, tokens: 100,
            hp: 150, maxHp: 150,
            dailyFaucetClaims: 0,
            lastFaucetClaimDate: "",
            baseStats: { str: 10, agi: 10, dex: 10 },
            abilityPoints: 5, potions: 5,
            autoScrolls: 0, autoUntil: 0,
            hiredMate: null, buffUntil: 0,
            equipped: { Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null },
            recipes: ['crystle_blade'],
            inventory: {},
            totalBossDamage: 0,
            maxDepth: 1,
            maxDepthScore: 100001,
            maxDepthFloor: 1,
            maxDepthMapName: 'Neon Slums',
            maxDepthMapMinLevel: 1,
            penaltyUntil: 0, autoMode: null,
            gemx: { level: 1, crystalsFed: 0 },
            dragon: { level: 1, fruitsFed: 0 },
            gemxAvatar: 'Cosmic gemx (1).gif',
            selectedPotionId: 'hp_potion',
            selectedScrollId: 'auto_scroll',
            avatar: 1,
            unlockedPets: [1, 11, 21, 31, 41],
            sessionId: localSessionId,
            createdAt: serverTimestamp()
          };

          setPlayer(genesisProfile);
          try {
            await setDoc(docRef, genesisProfile);
            setHasHydratedSession(true);
            console.log(`System V3: Genesis Profile written to Firestore at: ${primaryAuthId}`);
          } catch (writeErr) {
            console.error(`🚨 FIRESTORE WRITE FAILED for ${primaryAuthId}:`, writeErr.code, writeErr.message);
          }
        }
      } catch (e) {
        console.error("Critical Resolution Failure:", e);
      } finally {
        setLoadingPlayer(false);
      }
    };

    loadUnifiedProfile();
  }, [user?.uid, db, appId]);

  // 2. LIVE DATA & SESSION MONITORING
  useEffect(() => {
    if (!activeDocId || sessionConflict) return;

    // DEV MODE: Skip Firestore live monitoring
    const devEnv = typeof import.meta !== 'undefined' ? import.meta.env.VITE_DEV_MODE : undefined;
    const forceProd = typeof import.meta !== 'undefined' ? import.meta.env.VITE_FORCE_PROD === 'true' : false;
    const isDev = (import.meta.env.DEV === true && !forceProd) ||
                  devEnv === 'true' ||
                  (typeof window !== 'undefined' && window.location.hostname === 'localhost') ||
                  (typeof window !== 'undefined' && window.__PLAYWRIGHT_DEV_MODE__ === true);
    if (isDev) return;

    const docRef = doc(db, 'players', activeDocId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // --- SESSION CONFLICT CHECK ---
        if (hasHydratedSession && data.sessionId && data.sessionId !== localSessionId) {
          console.warn(`🚨 SECURITY_ALERT: Remote Session Takeover Detected!`);
          setSessionConflict(true);
          return;
        }

        // --- STATE SYNCHRONIZATION ---
        // We only update if we have a valid session and the data exists
        if (hasHydratedSession) {
          const level = data.level || 1;
          const baseStats = data.baseStats || { str: 10, agi: 10, dex: 10 };
          const safeStr = Number(baseStats.str) || 10;
          const safeAgi = Number(baseStats.agi) || 10;
          const safeDex = Number(baseStats.dex) || 10;
          const spentAP = (Math.max(10, safeStr) - 10) + (Math.max(10, safeAgi) - 10) + (Math.max(10, safeDex) - 10);
          const earnedAP = (Number(level) || 1) * 5;
          const trueAP = isNaN(earnedAP - spentAP) ? 0 : (earnedAP - spentAP);

          const sanitized = {
            ...data,
            abilityPoints: Math.max(0, trueAP), // Enforce strict AP calculation
            inventory: Array.isArray(data.inventory) 
              ? Object.fromEntries(data.inventory.filter(i => i).map(i => [i.id || `ITEM_${Date.now()}`, i])) 
              : (data.inventory || {}),
          };

          // Re-apply local pending updates to prevent "Wipeout" flicker
          const pending = pendingUpdatesRef.current || {};
          const fullySanitized = { ...sanitized };

          Object.entries(pending).forEach(([key, value]) => {
            if (key === 'updatedAt') return;
            if (key.includes('.')) {
              const parts = key.split('.');
              let cursor = fullySanitized;
              for (let i = 0; i < parts.length - 1; i++) {
                cursor[parts[i]] = { ...(cursor[parts[i]] || {}) };
                cursor = cursor[parts[i]];
              }
              cursor[parts[parts.length - 1]] = value;
            } else {
              fullySanitized[key] = value;
            }
          });

          // Apply active optimistic updates
          const now = Date.now();
          Object.entries(optimisticUpdatesRef.current).forEach(([key, item]) => {
            if (now - item.timestamp > 10000) {
              delete optimisticUpdatesRef.current[key];
              return;
            }
            const value = item.value;
            if (key.includes('.')) {
              const parts = key.split('.');
              let cursor = fullySanitized;
              for (let i = 0; i < parts.length - 1; i++) {
                cursor[parts[i]] = { ...(cursor[parts[i]] || {}) };
                cursor = cursor[parts[i]];
              }
              cursor[parts[parts.length - 1]] = value;
            } else {
              fullySanitized[key] = value;
            }
          });

          // Enforce auto-heal on final state
          const finalLevel = fullySanitized.level || 1;
          const finalStats = fullySanitized.baseStats || { str: 10, agi: 10, dex: 10 };
          const finalStr = Number(finalStats.str) || 10;
          const finalAgi = Number(finalStats.agi) || 10;
          const finalDex = Number(finalStats.dex) || 10;
          const finalSpent = (Math.max(10, finalStr) - 10) + (Math.max(10, finalAgi) - 10) + (Math.max(10, finalDex) - 10);
          const finalEarned = (Number(finalLevel) || 1) * 5;
          fullySanitized.abilityPoints = Math.max(0, isNaN(finalEarned - finalSpent) ? 0 : (finalEarned - finalSpent));

          setPlayer(fullySanitized);
        }
      }
    });

    return () => unsubscribe();
  }, [activeDocId, db, localSessionId, sessionConflict, hasHydratedSession]);

  // 3. Throttled Sync Mechanism (Batch Writing to Firestore)
  //
  // ARCHITECTURE: Two explicit paths to prevent the "doubling" bug.
  //   - LOCAL PATH: Converts Firestore sentinels to plain math for instant UI feedback.
  //   - REMOTE PATH: Passes the original sentinel payload directly to Firestore.
  const syncPlayer = useCallback(async (updates, immediate = false) => {
    if (!user) return;
    if (!activeDocId) return;

      const sterilized = { ...updates };
      ['hp', 'maxHp', 'xp', 'tokens'].forEach(key => {
        if (sterilized[key] !== undefined && typeof sterilized[key] === 'number') {
          sterilized[key] = Math.floor(sterilized[key]);
        }
      });

      // --- WIPE GUARD: DATA INTEGRITY FIREWALL ---
      // Prevents "Hollow Syncs" from corrupting the database if local state is lost.
      const isHollowSync = 
        (sterilized.tokens === 0 && (player?.tokens || 0) > 2000) || 
        (sterilized.level === 1 && (player?.level || 1) > 5);

      if (isHollowSync && !immediate) {
        console.error("🛑 WIPE_GUARD: Hollow sync detected and aborted. State integrity preserved.");
        return;
      }

      let nextState = null;
      setPlayer(prev => {
        const next = { ...prev };
        
        // ... apply sterilized updates to next ...
        Object.entries(sterilized).forEach(([key, value]) => {
          if (key.includes('.')) {
            const parts = key.split('.');
            let cursor = next;
            for (let i = 0; i < parts.length - 1; i++) {
               cursor[parts[i]] = { ...(cursor[parts[i]] || {}) };
               cursor = cursor[parts[i]];
            }
            // applyToTarget logic inside
            if (value && typeof value === 'object' && value._methodName === 'deleteField') { delete cursor[parts[parts.length - 1]]; }
            else if (value && typeof value === 'object' && value._methodName === 'increment') {
               const op = value._operand ?? 0;
               cursor[parts[parts.length - 1]] = (Number(cursor[parts[parts.length - 1]]) || 0) + Number(op);
            } else { cursor[parts[parts.length - 1]] = value; }
          } else {
            if (value && typeof value === 'object' && value._methodName === 'increment') {
               next[key] = (Number(next[key]) || 0) + Number(value._operand ?? 0);
            } else { next[key] = value; }
          }
        });
        next.updatedAt = new Date();
        nextState = next;
        return next;
      });

      // Update the remote queue (skipped in dev mode — no Firestore auth available)
      if (!__DEV_MODE__) {
        pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...sterilized, updatedAt: serverTimestamp() };
      }

      const performSync = async () => {
        // Dev mode guard: skip Firestore writes entirely to avoid infinite permission error loops
        if (__DEV_MODE__) {
          pendingUpdatesRef.current = {};
          return;
        }
        if (sessionConflict) return;
        if (isSyncing) return;

        const payload = { ...pendingUpdatesRef.current };
        if (Object.keys(payload).length === 0) return;

        try {
          const docRef = doc(db, 'players', activeDocId);
          pendingUpdatesRef.current = {};

          console.log(`System V4: Pushing Batch Update to Firestore [${activeDocId}]:`, Object.keys(payload));
          setIsSyncing(true);
          await updateDoc(docRef, payload);
          setLastSyncFailed(false);
          syncFailureCount.current = 0;

          // --- MILESTONE SNAPSHOT HANDLER ---
          // Creates a full "Last Known Good" recovery point on significant progress
          const curr = nextState;
          const shouldSnapshot = 
              (curr.level > (player?.lastSnapshotLevel || 0)) || 
              (Date.now() - (player?.lastSnapshotAt || 0) > 24 * 60 * 60 * 1000);

          if (shouldSnapshot && curr.level > 1) {
            const snapRef = doc(db, 'player_snapshots', activeDocId);
            const snapshotData = { ...curr, lastSnapshotAt: Date.now(), lastSnapshotLevel: curr.level };
            setDoc(snapRef, snapshotData).catch(e => console.error("Snapshot error:", e));
            // Update the main doc with the milestone markers (no-await to not block)
            updateDoc(docRef, { lastSnapshotAt: Date.now(), lastSnapshotLevel: curr.level }).catch(() => {});
          }

          // --- LEADERBOARD ECHO ---
          try {
            import('firebase/firestore').then(({ setDoc: fsSetDoc }) => {
              const publicData = {
                name: curr.name || "Unknown",
                avatar: curr.avatar || 1,
                platform: curr.platform || 'browser',
                level: curr.level || 1,
                totalBossDamage: curr.totalBossDamage || 0,
                maxDepthScore: curr.maxDepthScore || 0,
                maxDepthMapName: curr.maxDepthMapName || 'Neon Slums',
                maxDepthMapMinLevel: curr.maxDepthMapMinLevel || 1,
                tokens: curr.tokens || 0,
                walletAddress: curr.walletAddress ?? null,
                updatedAt: Date.now()
              };
              setDoc(doc(db, 'leaderboard', activeDocId), publicData, { merge: true }).catch(() => {});
            });
          } catch (e) { console.error("Echo Error:", e); }

        } catch (e) {
          console.error("Sync Error - Retrying:", e);
          syncFailureCount.current += 1;
          pendingUpdatesRef.current = { ...payload, ...pendingUpdatesRef.current };
          setLastSyncFailed(true);
        } finally {
          setIsSyncing(false);
          if (Object.keys(pendingUpdatesRef.current).length > 0) {
            syncTimeoutRef.current = setTimeout(performSync, 1000);
          }
        }
      };

      if (immediate) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        return performSync();
      } else {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(performSync, 2000);
      }
      return nextState;
    }, [user, db, appId, activeDocId, player, sessionConflict, isSyncing]);

  // 4. EXPLICIT WALLET LINKING (Enforced through Sentry)
  const linkWallet = useCallback(async (newAddress) => {
    if (!activeDocId || !newAddress) return { success: false, error: "System offline." };

    console.log(`System V4: Initiating Uplink Scan for node [${newAddress}]...`);
    const scan = await identitySentry(newAddress);
    if (!scan.success) {
      console.warn("System V4: Uplink Blockade! Collision detected:", scan.collision);
      return {
        success: false,
        collision: scan.collision,
        error: "WALLET_BOUND_TO_ANOTHER"
      };
    }

    console.log("System V4: Identity Clear. Committing Uplink to Firestore...");
    // Force immediate sync for wallet links to ensure persistence
    await syncPlayer({ walletAddress: newAddress.toLowerCase().trim(), walletConflict: null }, true);
    return { success: true };
  }, [activeDocId, identitySentry, syncPlayer]);

  // 5. THE MIGRATION BRIDGE (Profile Merge)
  const migrateProfile = useCallback(async (sourceId) => {
    const { runTransaction } = await import('firebase/firestore');
    if (!activeDocId || !sourceId || activeDocId === sourceId) return { success: false, error: "Invalid target." };

    try {
      setLoadingPlayer(true);
      console.log(`🚀 System V4 [TRANSACTION_MODE]: Initiating Migration [${sourceId}] -> [${activeDocId}]`);

      await runTransaction(db, async (transaction) => {
        const sourceRef = doc(db, 'players', sourceId);
        const targetRef = doc(db, 'players', activeDocId);

        const sourceSnap = await transaction.get(sourceRef);
        if (!sourceSnap.exists()) throw new Error("Source profile missing from core grid.");

        const sourceData = sourceSnap.data();

        const dataToMove = {
          level: sourceData.level || 1,
          xp: sourceData.xp || 0,
          tokens: sourceData.tokens || 100,
          hp: sourceData.hp ?? 150,
          maxHp: sourceData.maxHp ?? 150,
          baseStats: sourceData.baseStats || { str: 10, agi: 10, dex: 10 },
          abilityPoints: sourceData.abilityPoints || 0,
          potions: sourceData.potions || 5,
          recipes: sourceData.recipes || ['crystle_blade'],
          inventory: sourceData.inventory || {},
          equipped: sourceData.equipped || { Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null },
          maxDepth: sourceData.maxDepth || 1,
          maxDepthScore: sourceData.maxDepthScore || 0,
          maxDepthFloor: sourceData.maxDepthFloor || 1,
          maxDepthMapName: sourceData.maxDepthMapName || 'Neon Slums',
          maxDepthMapMinLevel: sourceData.maxDepthMapMinLevel || 1,
          gemx: sourceData.gemx || { level: 1, crystalsFed: 0 },
          dragon: sourceData.dragon || { level: 1, fruitsFed: 0 },
          walletAddress: sourceData.walletAddress?.toLowerCase() || null,
          migratedFrom: sourceId,
          migratedAt: serverTimestamp()
        };

        transaction.set(targetRef, dataToMove, { merge: true });
        transaction.update(sourceRef, {
          migratedTo: activeDocId,
          migratedAt: serverTimestamp(),
          level: 1, tokens: 0, inventory: {},
          walletAddress: null
        });

        const oldLeaderboardRef = doc(db, 'leaderboard', sourceId);
        transaction.delete(oldLeaderboardRef);
      });

      console.log(`✅ System V4: Atomic Migration Protocol Successful.`);

      const targetRef = doc(db, 'players', activeDocId);
      const updatedSnap = await getDoc(targetRef);
      if (updatedSnap.exists()) {
        setPlayer(updatedSnap.data());
      }

      return { success: true };
    } catch (e) {
      console.error("Migration Transaction Failure:", e);
      return { success: false, error: e.message === 'PERMISSION_DENIED' ? "SECURITY_LOCKDOWN: Registry write unauthorized." : e.message };
    } finally {
      setLoadingPlayer(false);
    }
  }, [activeDocId, db]);

  return { player, setPlayer, syncPlayer, linkWallet, migrateProfile, identitySentry, loadingPlayer, sessionConflict, isSyncing, lastSyncFailed, addOptimisticUpdate };
};
