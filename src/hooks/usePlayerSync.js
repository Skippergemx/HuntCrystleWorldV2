import { useState, useRef, useCallback, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const usePlayerSync = (user, db, appId) => {
  const [player, setPlayer] = useState(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  
  // Sync timeout ref
  const syncTimeoutRef = useRef(null);
  const pendingUpdatesRef = useRef({});

  // --- Initial Load ---
  useEffect(() => {
    if (!user) {
        setLoadingPlayer(false);
        return;
    }

    const loadData = async () => {
        try {
            setLoadingPlayer(true);
            const identifier = user.email || user.uid;
            const docRef = doc(db, 'artifacts', appId, 'users', identifier, 'profile', 'data');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Migration: Ensure new fields exist
                if (!data.gemx) data.gemx = { level: 1, crystalsFed: 0 };
                if (!data.dragon) data.dragon = { level: 1, fruitsFed: 0 };
                if (!data.gemxAvatar) data.gemxAvatar = 'gemx (1).gif';
                if (data.dragonAnimationEnabled === undefined) data.dragonAnimationEnabled = true;
                if (data.performanceMode === undefined) data.performanceMode = false;
                if (data.maxDepth === undefined) data.maxDepth = 1;
                if (!data.recipes || data.recipes.length === 0) data.recipes = ['crystle_blade'];
                if (!data.selectedPotionId) data.selectedPotionId = 'hp_potion';
                if (!data.selectedScrollId) data.selectedScrollId = 'auto_scroll';
                
                setPlayer(data);
            } else {
                const newPlayer = {
                    uid: user.uid,
                    email: user.email || '',
                    name: user.displayName || `Hunter_${user.uid.slice(0, 4)}`,
                    level: 1, xp: 0, tokens: 100,
                    hp: 150, maxHp: 150,
                    baseStats: { str: 10, agi: 10, dex: 10 },
                    abilityPoints: 5,
                    potions: 5,
                    autoScrolls: 0,
                    autoUntil: 0,
                    hiredMate: null,
                    buffUntil: 0,
                    equipped: {
                        Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null
                    },
                    recipes: ['crystle_blade'],
                    inventory: [],
                    totalBossDamage: 0,
                    maxDepth: 1,
                    penaltyUntil: 0,
                    autoMode: null,
                    gemx: { level: 1, crystalsFed: 0 },
                    dragon: { level: 1, fruitsFed: 0 },
                    gemxAvatar: 'gemx (1).gif',
                    dragonAnimationEnabled: true,
                    performanceMode: false,
                    selectedPotionId: 'hp_potion',
                    selectedScrollId: 'auto_scroll'
                };
                setPlayer(newPlayer);
                // Prompt initial sync for first-time profile creation
                await setDoc(docRef, newPlayer);
            }
        } catch (e) {
            console.error("Player Load Error:", e);
        } finally {
            setLoadingPlayer(false);
        }
    };

    loadData();
  }, [user, db, appId]);

  // Throttled sync mechanism
  const syncPlayer = useCallback(async (updates) => {
    if (!user) return;

    // Sterilize updates: Round combat-critical numbers to prevent float jitter
    const sterilized = { ...updates };
    ['hp', 'maxHp', 'xp', 'tokens'].forEach(key => {
        if (sterilized[key] !== undefined && typeof sterilized[key] === 'number') {
            sterilized[key] = Math.floor(sterilized[key]);
        }
    });

    // Immediate local update for UI responsiveness
    setPlayer(prev => {
      const next = { ...prev, ...sterilized };

      // Batch updates for remote sync
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...sterilized };

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          const identifier = user.email || user.uid;
          const docRef = doc(db, 'artifacts', appId, 'users', identifier, 'profile', 'data');
          await setDoc(docRef, pendingUpdatesRef.current, { merge: true });
          pendingUpdatesRef.current = {};
        } catch (e) {
          console.error("Sync error:", e);
        }
      }, 2000); // 2s throttle

      return next;
    });
  }, [user, db, appId]);

  return { player, setPlayer, syncPlayer, loadingPlayer };
};
