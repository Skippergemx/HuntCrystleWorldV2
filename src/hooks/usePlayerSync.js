import { useState, useRef, useCallback, useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * usePlayerSync V2: The Primary Data Hub
 * Responsible for ALL database interactions for player profiles.
 * Stripped of all legacy artifact-based fallbacks for the Ultimate Reset.
 */
export const usePlayerSync = (user, db, appId, farcasterContext, telegram = {}) => {
  // ─── SYNCHRONOUS TMA DETECTION ────────────────────────────────────────────
  // We read window.Telegram SYNCHRONOUSLY so we always have the correct doc key
  // from the very first render — no async state required. This prevents the race
  // condition where Firebase restores a cached anonymous user BEFORE the async
  // useTelegram hook has set isTelegram=true, causing profiles to be created
  // under the wrong raw Firebase UID.
  const _webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const _isRealTMA = !!_webApp && typeof _webApp.initData === 'string' && _webApp.initData.length > 0;
  const _tgUser = _isRealTMA ? _webApp.initDataUnsafe?.user : null;

  // Async state from parent hooks (still used for UI rendering in the banner etc.)
  const { isTelegram, user: tgUser } = telegram;

  const [player, setPlayer] = useState(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [activeDocId, setActiveDocId] = useState(null);
  
  /**
   * IDENTITY SENTRY V3: The High-Security Identity Gateway
   * Performs multi-layered scans to prevent wallet theft and identity splits.
   */
  const identitySentry = useCallback(async (addressToScan) => {
    if (!addressToScan) return { success: true, collision: null };
    
    const normalized = addressToScan.toLowerCase().trim();
    const raw = addressToScan.trim();

    try {
      // 1. Optimized Dual-Query (Indexed)
      const qLower = query(collection(db, 'players'), where('walletAddress', '==', normalized));
      const qRaw = query(collection(db, 'players'), where('walletAddress', '==', raw));
      const [snapLower, snapRaw] = await Promise.all([getDocs(qLower), getDocs(qRaw)]);
      
      let collisionDoc = !snapLower.empty ? snapLower.docs[0] : (!snapRaw.empty ? snapRaw.docs[0] : null);

      // 2. Deep-Scan Failsafe (Non-Indexed Sweep)
      if (!collisionDoc) {
        const broadSweep = await getDocs(query(collection(db, 'players'), limit(50)));
        collisionDoc = broadSweep.docs.find(d => {
          const docWallet = d.data()?.walletAddress?.toString().toLowerCase().trim();
          return docWallet === normalized;
        });
      }

      const collisionId = collisionDoc?.id;
      if (collisionId && collisionId !== activeDocId) {
        return { 
          success: false, 
          collision: {
            id: collisionId,
            platform: collisionId.startsWith('FC_') ? 'FARCASTER' : 'GOOGLE',
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

  // 1. Unified Player Hydration (Primary Entry Point)
  useEffect(() => {
    // GUARD 1: No auth context at all — bail out
    // Use synchronous _isRealTMA check, not async state, to prevent race condition.
    if (!user && !_isRealTMA) {
        setLoadingPlayer(false);
        setPlayer(null);
        return;
    }

    // GUARD 2: Farcaster context present but FID not yet attached — wait
    if (farcasterContext && !user?.farcasterFID) {
        setLoadingPlayer(true);
        return;
    }

    // GUARD 3: We are in TMA but the Telegram user object is not available yet — wait
    // Use synchronous _tgUser (from window) rather than async state.
    if (_isRealTMA && !_tgUser?.id) {
        setLoadingPlayer(true);
        return;
    }

    const loadUnifiedProfile = async () => {
        try {
            setLoadingPlayer(true);
            
            // --- UNIFIED RESOLVER V4: TIERED IDENTITY RESOLUTION ---
            // KEY: Use synchronous _isRealTMA / _tgUser for the primary key decision
            // so the correct doc is always used from the very first effect run.
            let primaryAuthId = user?.farcasterFID 
              ? `FC_${user.farcasterFID}` 
              : (_isRealTMA && _tgUser?.id ? `TG_${_tgUser.id}` : user?.uid);
            
            if (!primaryAuthId) {
                setLoadingPlayer(false);
                return;
            }

            console.log(`System V4: Resolving Identity for Core Node: ${primaryAuthId}`);
            
            setActiveDocId(primaryAuthId);
            const docRef = doc(db, 'players', primaryAuthId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log(`System V3: Hydrating Linked Archive: ${primaryAuthId}`);

                // --- GLOBAL CONFLICT CHECK: PASSIVE VS ACTIVE ---
                let walletConflict = null;
                let activeWalletSync = data.walletAddress || null;

                // 1. FARCASTER MODE: Mandatory Active Sync
                if (farcasterContext && user.walletAddress) {
                    const scan = await identitySentry(user.walletAddress);
                    
                    if (!scan.success && scan.collision.id !== primaryAuthId) {
                        walletConflict = {
                          ownerId: scan.collision.id,
                          isFarcaster: scan.collision.platform === 'FARCASTER',
                          message: "This wallet is bound to another Hero profile!"
                        };
                    } else {
                        activeWalletSync = user.walletAddress.toLowerCase().trim();
                    }
                }
                
                // 2. GOOGLE MODE: Retroactive Security Scrub
                else if (data.walletAddress || user.walletAddress) {
                    const addr = (data.walletAddress || user.walletAddress);
                    const scan = await identitySentry(addr);
                    
                    if (!scan.success && scan.collision.id !== primaryAuthId) {
                         console.warn(`System V3: Blockade Alert! Scrubbing unauthorized link to ${scan.collision.id}`);
                         walletConflict = {
                            ownerId: scan.collision.id,
                            message: "This wallet belongs to another Hero node!",
                            isFarcaster: scan.collision.platform === 'FARCASTER'
                         };
                         activeWalletSync = null; 
                    } else {
                        activeWalletSync = addr.toLowerCase().trim();
                    }
                }

                // ENFORCED GLOBAL SCHEMA (UID-First)
                // Use _tgUser (synchronous window read) for TG fields, not async state.
                const sanitized = {
                    ...data,
                    uid: user?.uid || null,
                    email: user?.email || data.email || null,
                    farcasterFID: user?.farcasterFID || data.farcasterFID || null,
                    farcasterUsername: user?.farcasterUsername || data.farcasterUsername || null,
                    telegramUserId: _tgUser?.id || data.telegramUserId || null,
                    telegramUsername: _tgUser?.username || data.telegramUsername || null,
                    name: data.name || user?.username || _tgUser?.username || _tgUser?.first_name || `Hunter_${(user?.uid || _tgUser?.id || '0000').toString().slice(0, 4)}`,
                    pfp: data.pfp || user?.pfp || null,
                    
                    walletAddress: activeWalletSync,
                    tonWalletAddress: data.tonWalletAddress || null,
                    walletConflict: walletConflict || null,

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
                console.log(`System V3: No Archive Found for ${primaryAuthId}. Constructing Genesis Profile...`);
                
                // Use _tgUser (synchronous window read) for TG fields, not async state.
                const genesisProfile = {
                    uid: user?.uid || null,
                    email: user?.email || null,
                    farcasterFID: user?.farcasterFID || null,
                    farcasterUsername: user?.farcasterUsername || null,
                    telegramUserId: _tgUser?.id || null,
                    telegramUsername: _tgUser?.username || null,
                    name: user?.username || _tgUser?.username || _tgUser?.first_name || `Hunter_${(user?.uid || _tgUser?.id || '0000').toString().slice(0, 4)}`,
                    pfp: user?.pfp || null,
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
                    // Standard Google users start with NO wallet link even if one is in browser
                    walletAddress: farcasterContext ? user.walletAddress?.toLowerCase() || null : null,
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
  // NOTE: isTelegram and tgUser are intentionally included so the effect
  // re-runs once the Telegram SDK has finished identity resolution.
  }, [user, db, appId, farcasterContext, isTelegram, tgUser]);


  // 2. Throttled Sync Mechanism (Batch Writing to Firestore)
  const syncPlayer = useCallback(async (updates) => {
    // If the database doc identifier isn't ready, halt the queue.
    // Telegram users use anonymous auth so `user` will exist but may not have farcasterFID.
    if (!user && !isTelegram) return;
    if (farcasterContext && !user?.farcasterFID) return;
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
      const next = { ...prev, ...sterilized, updatedAt: new Date() }; 

      // Queue these changes for the prochain Firestore sync
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...sterilized, updatedAt: serverTimestamp() };

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          const docRef = doc(db, 'players', activeDocId);
          
          const payload = { ...pendingUpdatesRef.current };
          pendingUpdatesRef.current = {};
          
          await setDoc(docRef, payload, { merge: true });
          console.log("System V3: Remote Sector Synchronized.", activeDocId);
        } catch (e) {
          console.error("Sync Error:", e);
        }
      }, 2000); 

      return next;
    });
  }, [user, db, appId, farcasterContext, activeDocId]);

  // 3. EXPLICIT WALLET LINKING (Enforced through Sentry)
  const linkWallet = useCallback(async (newAddress) => {
    if (!activeDocId || !newAddress) return { success: false, error: "System offline." };

    const scan = await identitySentry(newAddress);
    if (!scan.success) {
      return { 
        success: false, 
        error: scan.collision?.platform === 'FARCASTER' ? "WALLET_BOUND_TO_FARCASTER" : "WALLET_BOUND_TO_OTHER_ACCOUNT"
      };
    }

    await syncPlayer({ walletAddress: newAddress.toLowerCase().trim(), walletConflict: null });
    return { success: true };
  }, [activeDocId, identitySentry, syncPlayer]);

  return { player, setPlayer, syncPlayer, linkWallet, identitySentry, loadingPlayer };
};

