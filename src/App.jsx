import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import {
  Sword, Shield, Coins, Star, Trophy, ShoppingBag,
  Map as MapIcon, ChevronRight, Heart, Zap, Target,
  Wind, Lock, User, RefreshCw, AlertCircle, Sparkles,
  Hammer, Gem, Package, X, TrendingUp, Skull, Flame, Clock,
  PlusCircle, Activity, Coffee, MousePointer, Beer, Users,
  Book, Globe, Database, HardHat, Footprints,
  Volume2, VolumeX, Music, Music2
} from 'lucide-react';

// --- Firebase Setup ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'crystle-hunter-world-v1';

import MONSTERS from './data/monsters.json';
import EQUIPMENT from './data/equipment.json';
import TAVERN_MATES from './data/mates.json';
import SHOP_CONSUMABLES from './data/shop.json';
import CRYSTLE_RECIPES from './data/recipes.json';
import LOOTS from './data/loots.json';
import MAPS from './data/maps.json';
import FRUITS from './data/fruits.json';

import { 
  DIFFICULTY_MULTIPLIER, 
  XP_BASE, 
  AP_PER_LEVEL, 
  PENALTY_DURATION, 
  STUN_DURATION_NORMAL, 
  STUN_DURATION_CRIT, 
  DEFEAT_WINDOW_DURATION, 
  AUTO_SCROLL_DURATION, 
  COMPANION_BUFF_DURATION,
  scaleMonster,
  calculateStats,
  getHitChance,
  getDamage
} from './utils/gameLogic';

import { Header, NavBtn, StatTile, AttributeRow, AvatarMedia } from './components/GameUI';
import { ImpactSplash, BossImpactSplash } from './components/CombatEffects';
import { useAdventure } from './hooks/useAdventure';
import { MenuView } from './components/MenuView';
import { CombatView } from './components/CombatView';
import { BossView } from './components/BossView';
import { TavernView } from './components/TavernView';
import { AttributesView } from './components/AttributesView';
import { IdentityView } from './components/IdentityView';
import { ShopView } from './components/ShopView';
import { ForgeView } from './components/ForgeView';
import { LeaderboardView } from './components/LeaderboardView';
import { GearView } from './components/GearView';
import { MarketplaceView } from './components/MarketplaceView';
import { InventoryView } from './components/InventoryView';
import { DatabaseView } from './components/DatabaseView';
import { MapView } from './components/MapView';
import { AdminPanelView } from './components/AdminPanelView';
import { DragonsGroundView } from './components/DragonsGroundView';
import { PvpRoomView } from './components/PvpRoomView';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginView } from './components/LoginView';
import { AnimatedBackground } from './components/AnimatedBackground';

const BOSS = {
  name: "The Core Guardian",
  level: 500,
  hp: 10000000,
  str: 1000,
  agi: 800,
  dex: 700,
  critChance: 0.25,
  recipeDropChance: 0.15,
  taunts: ["I am the final obstacle!", "Your journey ends here.", "Kneel before the Core!"]
};

const BOSS_MEDIA_FILES = [
  { img: '/assets/bossmonster/DungeonGemBoss (1).jpg', vid: '/assets/bossmonstervideo/DungeonGemBoss (1) video.mp4' },
  { img: '/assets/bossmonster/CrystleHunterAvatar (30).jpg', vid: '/assets/bossmonstervideo/DungeonGemBoss (2) video.mp4' }
];

const SHOP_ITEMS = [...SHOP_CONSUMABLES, ...EQUIPMENT];

const SOUNDS = {
  mainBGM: ['/assets/sounds/Main-BGM01.mp3', '/assets/sounds/Main-BGM02.mp3'],
  dungeonBGM: ['/assets/sounds/Dungeon-BGM01.mp3', '/assets/sounds/Dungeon-BGM02.mp3'],
  bossBGM: ['/assets/sounds/Boss-BGM01.mp3', '/assets/sounds/Boss-BMG02.mp3'],
  playerAttack: '/assets/sounds/Player-Attack.wav',
  monsterAttack: '/assets/sounds/Monster-Attack.wav',
  obtainLoot: '/assets/sounds/Obtain-Loot.wav',
  useHeal: '/assets/sounds/Use-Heal-Potion.wav'
};

const App = () => {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [logs, setLogs] = useState(["Synchronizing with hunt.crystle.world..."]);
  const [loading, setLoading] = useState(true);
  
  const {
    view, setView, depth, setDepth,
    enemy, setEnemy, enemyFlinch, isHurt,
    enemyRef, spawnNewEnemy, triggerFlinch, triggerHurt,
    selectedMap, setSelectedMap
  } = useAdventure();

  const [critAlert, setCritAlert] = useState(false);
  const [stunTimeLeft, setStunTimeLeft] = useState(0);
  const [penaltyRemaining, setPenaltyRemaining] = useState(0);
  const [showDefeatedWindow, setShowDefeatedWindow] = useState(false);
  const [autoTimeLeft, setAutoTimeLeft] = useState(0);
  const [buffTimeLeft, setBuffTimeLeft] = useState(0);
  const [currentTaunt, setCurrentTaunt] = useState("");
  const [playerTaunt, setPlayerTaunt] = useState("");
  const [missTimeLeft, setMissTimeLeft] = useState(0);
  const [impactSplash, setImpactSplash] = useState(null);
  const [playerImpactSplash, setPlayerImpactSplash] = useState(null);
  const [strikingSide, setStrikingSide] = useState(null); // 'player' or 'monster'
  const [lastLoot, setLastLoot] = useState(null);
  const [bossAvatarIdx, setBossAvatarIdx] = useState(0);
  const [showBossVideo, setShowBossVideo] = useState(true);
  const [showSuccessWindow, setShowSuccessWindow] = useState(false);
  const [sessionRewards, setSessionRewards] = useState({ tokens: 0, xp: 0, loots: [] });
  const [killsInFloor, setKillsInFloor] = useState(0);
  const [autoUseScroll, setAutoUseScroll] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isSfxOn, setIsSfxOn] = useState(true);
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const playerRef = useRef(null);
  const stunRef = useRef(0);
  const missRef = useRef(0);
  const killsRef = useRef(0);
  const depthRef = useRef(1);
  const buffRef = useRef(0);
  const processingRef = useRef(false);
  const bgmRef = useRef(new Audio());

  // Throttled sync mechanism
  const syncTimeoutRef = useRef(null);
  const pendingUpdatesRef = useRef({});

  // --- INFRASTRUCTURE FUNCTIONS ---
  const addLog = useCallback((msg) => setLogs(prev => [msg, ...prev.slice(0, 7)]), []);

  const playSFX = (soundPath) => {
    if (!isSfxOn) return;
    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const syncPlayer = useCallback(async (updates) => {
    if (!user) return;
    
    // Immediate local update for UI responsiveness
    setPlayer(prev => {
      const next = { ...prev, ...updates };
      
      // Batch updates for remote sync
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
      
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
      }, 2000); // Wait 2s of silence before syncing to Firebase

      return next;
    });
  }, [user, db, appId]);

  const updateLeaderboard = useCallback(async (updates = {}) => {
    if (!user || !player) return;
    const identifier = user.email || user.uid;
    const lbRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', identifier);
    
    // Merge updates with current player data for a complete leaderboard entry
    const entry = {
      uid: identifier,
      name: player.name,
      email: user.email || '',
      level: player.level,
      score: player.totalBossDamage || 0,
      maxDepth: player.maxDepth || 1,
      heroAvatar: player.avatar || 1,
      ...updates
    };
    
    setDoc(lbRef, entry, { merge: true }).catch(err => console.error("Leaderboard Sync Error:", err));
  }, [user, player, db, appId]);

  // URL routing for Admin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || window.location.pathname === '/admin') {
      setView('admin');
    }
  }, []);


  const updateBGM = useCallback(() => {
    if (!isMusicOn) {
      bgmRef.current.pause();
      return;
    }

    let tracks = [];
    const isCombatView = view === 'dungeon' || view === 'boss';
    
    if (isCombatView) {
      tracks = (view === 'boss' || enemy?.isBoss) ? SOUNDS.bossBGM : SOUNDS.dungeonBGM;
    } else {
      tracks = SOUNDS.mainBGM;
    }

    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    
    // Only restart if the track category changes significantly
    const currentSrc = bgmRef.current.src ? decodeURIComponent(bgmRef.current.src) : "";
    const isCombatTrack = currentSrc.includes('Dungeon') || currentSrc.includes('Boss');
    const isMainTrack = currentSrc.includes('Main');
    
    const shouldChange = (isCombatView && !isCombatTrack) || 
                       (!isCombatView && !isMainTrack) || 
                       (!bgmRef.current.src);

    if (shouldChange) {
      bgmRef.current.pause();
      bgmRef.current.src = randomTrack;
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.3;
      bgmRef.current.play().catch(e => console.log("BGM play error", e));
    }
  }, [view, isMusicOn, enemy?.isBoss]);

  useEffect(() => {
    updateBGM();
  }, [updateBGM]);

  useEffect(() => {
    playerRef.current = player;
    stunRef.current = stunTimeLeft;
    missRef.current = missTimeLeft;
    killsRef.current = killsInFloor;
    depthRef.current = depth;
    buffRef.current = buffTimeLeft;
    processingRef.current = isActionProcessing;
  }, [player, stunTimeLeft, missTimeLeft, killsInFloor, depth, buffTimeLeft, isActionProcessing]);

  const triggerHitEffects = useCallback((dmg, isCrit, side = 'monster') => {
    const impactWords = ["BAM!", "POW!", "WHACK!", "SMASH!", "KABOOM!", "ZAP!", "SLAM!", "CRUNCH!", "KRAK!"];
    const word = impactWords[Math.floor(Math.random() * impactWords.length)];
    const id = Date.now();
    
    if (side === 'monster') {
      setImpactSplash({ text: word, dmg, isCrit, id });
      setTimeout(() => setImpactSplash(prev => (prev?.id === id ? null : prev)), 400);
      triggerFlinch();
      
      // Monster Ouch Moment
      const ouchWords = ["Ouch!", "Gah!", "No!", "Stop!", "Critical Hit!", "Ack!", "My circuits!", "System Failure!"];
      setCurrentTaunt(ouchWords[Math.floor(Math.random() * ouchWords.length)]);
    } else {
      setPlayerImpactSplash({ text: word, dmg, isCrit, id });
      setTimeout(() => setPlayerImpactSplash(prev => (prev?.id === id ? null : prev)), 400);
      triggerHurt();

      // Player Ouch Moment
      const ouchWords = ["Ugh!", "Ack!", "Too strong!", "Healing needed!", "Pain...", "Vision blurring!", "Armor cracked!"];
      setPlayerTaunt(ouchWords[Math.floor(Math.random() * ouchWords.length)]);
    }
  }, [triggerFlinch, triggerHurt]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        loadPlayerData(u);
      } else {
        setPlayer(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentTaunt) {
      const timer = setTimeout(() => setCurrentTaunt(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTaunt]);

  useEffect(() => {
    if (playerTaunt) {
      const timer = setTimeout(() => setPlayerTaunt(""), 2200);
      return () => clearTimeout(timer);
    }
  }, [playerTaunt]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Google login error:", e);
      setLoading(false);
    }
  };

  const activateAutoScroll = async () => {
    const p = playerRef.current || player;
    const scrollIdx = p.inventory?.findIndex(i => i.id === 'auto_scroll');
    const hasCounter = (p.autoScrolls || 0) > 0;
    
    if (scrollIdx === -1 && !hasCounter) {
      if (autoUseScroll) {
        setAutoUseScroll(false);
        addLog("❌ All Auto Scrolls depleted!");
      }
      return;
    }

    const updates = {};
    if (scrollIdx !== -1) {
      const newInventory = [...(p.inventory || [])];
      newInventory.splice(scrollIdx, 1);
      updates.inventory = newInventory;
    } else {
      updates.autoScrolls = p.autoScrolls - 1;
    }
    
    const now = Date.now();
    const currentAutoUntil = Math.max(now, p.autoUntil || 0);
    updates.autoUntil = currentAutoUntil + AUTO_SCROLL_DURATION;
    updates.autoMode = (view === 'boss' || view === 'dungeon') ? view : (p.autoMode || 'dungeon');
    
    await syncPlayer(updates);
    const durationMin = AUTO_SCROLL_DURATION / 60000;
    addLog(`⚡ Auto Scroll engaged (+${durationMin} min)`);
  };

  const sellItem = useCallback((itemId, amount = 1) => {
    setPlayer(prev => {
      if (!prev) return prev;
      const newInventory = [...(prev.inventory || [])];
      const remainingItems = [];
      let tokensGained = 0;
      let foundCount = 0;
      let itemName = "";
      
      newInventory.forEach(item => {
        if (item.id === itemId && foundCount < amount) {
          const value = item.sellValue !== undefined ? item.sellValue : Math.floor((item.cost || 0) / 2);
          tokensGained += value;
          foundCount++;
          itemName = item.name;
        } else {
          remainingItems.push(item);
        }
      });

      if (foundCount > 0) {
        syncPlayer({ tokens: prev.tokens + tokensGained, inventory: remainingItems });
        addLog(`💰 Sold ${foundCount}x ${itemName} for ${tokensGained} GX`);
        playSFX(SOUNDS.obtainLoot); 
      }
      return { ...prev, tokens: prev.tokens + tokensGained, inventory: remainingItems };
    });
  }, [syncPlayer, addLog]);

  const purchaseMarketItem = useCallback(async (listing) => {
    if (!player || player.tokens < listing.price) return addLog("Out of GX!");
    
    try {
      // 1. Delete listing
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'marketplace', listing.id));
      
      // 2. Buyer gets item and loses tokens
      const newInventory = [...(player.inventory || []), listing.item];
      await syncPlayer({ 
        tokens: player.tokens - listing.price, 
        inventory: newInventory 
      });

      // 3. Queue payout for Seller (minus 5% tax) in a public payouts collection.
      //    The buyer cannot write to the seller's private profile due to Firestore rules,
      //    so we use a "pending payouts" pattern — the seller claims the GX on their next login.
      const payout = Math.floor(listing.price * 0.95);
      const payoutRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'payouts'));
      await setDoc(payoutRef, {
        recipientEmail: listing.sellerEmail,
        amount: payout,
        itemName: listing.item.name,
        buyerName: player.name,
        createdAt: Date.now()
      });

      addLog(`\uD83E\uDD1D Market Deal: Acquired ${listing.item.name} for ${listing.price} GX.`);
      playSFX(SOUNDS.obtainLoot);
    } catch (e) {
      console.error(e);
      addLog("Transaction failed: listing may have been acquired.");
    }
  }, [player, syncPlayer, addLog, db, appId]);

  const listMarketItem = useCallback(async (item, price) => {
    if (!user || !player) return;
    
    try {
      // Remove from local inventory
      const index = player.inventory.findIndex(i => i.id === item.id);
      const newInventory = [...player.inventory];
      newInventory.splice(index, 1);
      
      await syncPlayer({ inventory: newInventory });

      // Post to marketplace
      const listRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'marketplace'));
      await setDoc(listRef, {
        sellerUid: user.uid,
        sellerEmail: user.email || user.uid,
        sellerName: player.name,
        item: item,
        price: price,
        createdAt: Date.now()
      });

      addLog(`📡 Broadcast: ${item.name} listed for ${price} GX.`);
    } catch (e) {
      console.error(e);
      addLog("Broadcasting failed.");
    }
  }, [user, player, syncPlayer, addLog, db, appId]);

  const cancelMarketListing = useCallback(async (listingId) => {
    if (!player) return;
    try {
      const listing = marketplace.find(l => l.id === listingId);
      if (!listing) return;

      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'marketplace', listingId));
      
      // Return item to inventory
      await syncPlayer({ inventory: [...(player.inventory || []), listing.item] });
      addLog(`🚫 Signal Terminated: ${listing.item.name} returned to storage.`);
    } catch (e) {
      console.error(e);
    }
  }, [player, marketplace, syncPlayer, addLog, db, appId]);

  const handleLogout = async () => {
    try {
      if (player.autoUntil > 0 || player.buffUntil > 0) {
        await syncPlayer({ autoUntil: 0, buffUntil: 0 });
      }
      await signOut(auth);
      setView('menu');
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  // Consolidated Timer Effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Use functional updates to batch state changes
      setStunTimeLeft(prev => Math.max(0, prev - 0.2));
      setMissTimeLeft(prev => Math.max(0, prev - 0.2));
      
      const p = playerRef.current;
      if (p) {
        const now = Date.now();
        
        // Update multiple timers in one go if possible, but these are separate states
        // Consider merging these into a single state object if re-renders are still high
        
        const newAutoTime = p.autoUntil && p.autoUntil > now ? Math.ceil((p.autoUntil - now) / 1000) : 0;
        const newBuffTime = p.buffUntil && p.buffUntil > now ? Math.ceil((p.buffUntil - now) / 1000) : 0;
        const newPenaltyTime = p.penaltyUntil && p.penaltyUntil > now ? Math.ceil((p.penaltyUntil - now) / 1000) : 0;

        if (newAutoTime !== autoTimeLeft) setAutoTimeLeft(newAutoTime);
        if (newBuffTime !== buffTimeLeft) setBuffTimeLeft(newBuffTime);
        if (newPenaltyTime !== penaltyRemaining) setPenaltyRemaining(newPenaltyTime);

        // COMBAT HEARTBEAT / SAFETY RESET
        // If action processing is stuck for more than 4 seconds, force release it
        if (processingRef.current) {
          if (!window._combatTimer) window._combatTimer = now;
          if (now - window._combatTimer > 4000) {
             setIsActionProcessing(false);
             window._combatTimer = null;
             console.log("Combat heartbeat: Force released stuck action lock.");
          }
        } else {
          window._combatTimer = null;
        }

        // Auto-Use Scroll Logic
        if (autoUseScroll && (!p.autoUntil || p.autoUntil <= now) && (view === 'dungeon' || view === 'boss')) {
          const hasInInventory = p.inventory?.some(i => i && i.id === 'auto_scroll');
          const hasInCounter = (p.autoScrolls || 0) > 0;
          if (hasInInventory || hasInCounter) {
            activateAutoScroll();
          } else {
            setAutoUseScroll(false);
            addLog("❌ Out of Scrolls: Auto-Use Disabled.");
          }
        }
      }
    }, 200);
    return () => clearInterval(interval);
  }, [view, autoUseScroll, autoTimeLeft, buffTimeLeft, penaltyRemaining]);

  useEffect(() => {
    let autoLoop;
    if ((view === 'dungeon' || view === 'boss') && autoTimeLeft > 0 && !showDefeatedWindow && player?.autoMode === view) {
      autoLoop = setInterval(() => {
        const p = playerRef.current;
        const isBossView = view === 'boss';
        // For boss view, we don't need enemyRef since it uses the global BOSS constant
        if (p && (isBossView || enemyRef.current) && stunRef.current <= 0 && missRef.current <= 0 && !processingRef.current) {
          if (p.hp < (p.maxHp * 0.4) && (p.potions || 0) > 0) handleHeal();
          else handleAttack(isBossView);
        }
      }, 1100);
    }
    return () => clearInterval(autoLoop);
  }, [view, autoTimeLeft > 0, showDefeatedWindow, player?.autoMode]);

  // Safety Guard: Reset action lock and cancel auto-scroll if player leaves current combat mode
  useEffect(() => {
    if (isActionProcessing) setIsActionProcessing(false);
    
    if (player?.autoUntil > 0 && player?.autoMode !== view) {
      syncPlayer({ autoUntil: 0, autoMode: null });
    }
    // Reset session rewards when starting a new dungeon run
    if (view === 'dungeon' && !showSuccessWindow) {
      setSessionRewards({ tokens: 0, xp: 0, loots: [] });
    }
  }, [view, showSuccessWindow]); // Removed player properties from deps to avoid lint issues

  const loadPlayerData = async (u) => {
    try {
      const identifier = u.email || u.uid;
      const docRef = doc(db, 'artifacts', appId, 'users', identifier, 'profile', 'data');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Migration: Add new fields if missing
        if (!data.gemx) data.gemx = { level: 1, crystalsFed: 0 };
        if (!data.dragon) data.dragon = { level: 1, fruitsFed: 0 };
        if (!data.gemxAvatar) data.gemxAvatar = 'gemx (1).gif';
        if (data.dragonAnimationEnabled === undefined) data.dragonAnimationEnabled = true;
        if (data.performanceMode === undefined) data.performanceMode = false;
        if (data.maxDepth === undefined) data.maxDepth = 1;

        setPlayer(data);
      } else {
        const newPlayer = {
          uid: u.uid,
          email: u.email || '',
          name: u.displayName || `Hunter_${u.uid.slice(0, 4)}`,
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
            Headgear: null,
            Weapon: null,
            Armor: null,
            Footwear: null,
            Relic: null
          },
          recipes: [],
          inventory: [],
          totalBossDamage: 0,
          maxDepth: 1,
          penaltyUntil: 0,
          autoMode: null,
          gemx: { level: 1, crystalsFed: 0 },
          dragon: { level: 1, fruitsFed: 0 },
          gemxAvatar: 'gemx (1).gif',
          dragonAnimationEnabled: true,
          performanceMode: false
        };
        await setDoc(docRef, newPlayer);
        setPlayer(newPlayer);
      }
    } catch (e) {
      console.error(e);
      setPlayer({
        uid: u?.uid || "mock",
        email: u?.email || '',
        name: u?.displayName || `Hunter_MOCK`,
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
          Headgear: null,
          Weapon: null,
          Armor: null,
          Footwear: null,
          Relic: null
        },
        recipes: [],
        inventory: [],
        totalBossDamage: 0,
        penaltyUntil: 0,
        gemx: { level: 1, crystalsFed: 0 },
        dragon: { level: 1, fruitsFed: 0 },
        gemxAvatar: 'gemx (1).gif',
        dragonAnimationEnabled: true,
        performanceMode: false
      })
    }
    setLoading(false);
  };


  useEffect(() => {
    if (!user) return;
    try {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => d.data());
        setLeaderboard(data.sort((a, b) => b.score - a.score).slice(0, 10));
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'marketplace');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setMarketplace(data);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // Auto-claim pending GX payouts from marketplace sales
  useEffect(() => {
    if (!user || !player) return;
    const identifier = user.email || user.uid;
    const claimPayouts = async () => {
      try {
        const { getDocs, query: fsQuery, where } = await import('firebase/firestore');
        const q = collection(db, 'artifacts', appId, 'public', 'data', 'payouts');
        const snapshot = await getDocs(fsQuery(q, where('recipientEmail', '==', identifier)));
        if (snapshot.empty) return;
        let totalPayout = 0;
        const deletePromises = [];
        snapshot.forEach(d => {
          totalPayout += d.data().amount || 0;
          deletePromises.push(deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payouts', d.id)));
        });
        await Promise.all(deletePromises);
        if (totalPayout > 0) {
          await syncPlayer({ tokens: (player.tokens || 0) + totalPayout });
          addLog(`💸 Marketplace: +${totalPayout} GX from your sales!`);
        }
      } catch (e) {
        console.error('Payout claim error:', e);
      }
    };
    claimPayouts();
  }, [user?.uid, player?.level]); // Runs on login and on level-up

  // Memoize stats to avoid recalculating on every render
  const totalStats = useMemo(() => {
    return calculateStats(player, TAVERN_MATES, buffTimeLeft > 0);
  }, [player, buffTimeLeft]);


  const handleHeal = useCallback(() => {
    const p = playerRef.current || player;
    if ((p.potions || 0) <= 0) return addLog("Out of Potions!");
    const healAmt = Math.floor(p.maxHp * 0.5);
    playSFX(SOUNDS.useHeal);
    syncPlayer({ hp: Math.min(p.maxHp, p.hp + healAmt), potions: p.potions - 1 });
    addLog(`Healed ${healAmt} HP.`);
  }, [player, addLog, syncPlayer]);


  const hireMate = (mate) => {
    if (player.tokens < mate.cost) return addLog("Out of GX!");
    syncPlayer({ tokens: player.tokens - mate.cost, hiredMate: mate.id });
    addLog(`Contract signed: ${mate.name} joined!`);
  };






  const enemyTurn = useCallback((target, isBoss = false) => {
    if (showDefeatedWindow) {
      setIsActionProcessing(false); // Safety reset if defeated
      return;
    }
    const p = playerRef.current || player;
    if (!target || !p || p.hp <= 0) {
      setIsActionProcessing(false);
      return;
    }
    const stats = totalStats;

    // Trigger Strike Animation (after a slight delay to let player finish)
    setTimeout(() => {
      setStrikingSide('monster');
      playSFX(SOUNDS.monsterAttack);
      setTimeout(() => setStrikingSide(null), 300);
    }, 400);

    const hitChance = (target.dex / (target.dex + stats.agi * 0.8)) * 100;

    if (Math.random() * 100 < hitChance) {
      const isCrit = Math.random() < (isBoss ? BOSS.critChance : target.critChance);
      let dmg = isCrit ? Math.max(15, Math.floor((target.str * 2.5) - (stats.agi * 0.1))) : Math.max(1, target.str - Math.floor(stats.agi / 4));

      if (isCrit) { addLog(`⚠️ CRIT!`); setCritAlert(true); setTimeout(() => setCritAlert(false), 800); setStunTimeLeft(STUN_DURATION_CRIT / 1000); }
      else setStunTimeLeft(STUN_DURATION_NORMAL / 1000);

      addLog(`⚠️ ${target.name} hit you for ${dmg} DMG!`);
      const taunts = target.taunts || ["Prepare to die!", "Too slow!", "Weakling!"];
      setCurrentTaunt(taunts[Math.floor(Math.random() * taunts.length)]);

      // Hit Impact for Player
      triggerHitEffects(dmg, isCrit, 'player');

      // HIT DELAY (0.5s)
      setTimeout(() => {
        const newHp = Math.max(0, p.hp - dmg);
        
        if (newHp <= 0) {
          setShowDefeatedWindow(true);
          setAutoUseScroll(false);
          setIsActionProcessing(false); // Reset lock on defeat
          syncPlayer({ hp: p.maxHp, penaltyUntil: Date.now() + PENALTY_DURATION, hiredMate: null, buffUntil: 0, autoUntil: 0 });
          setTimeout(() => { setShowDefeatedWindow(false); setDepth(1); setView('menu'); }, DEFEAT_WINDOW_DURATION);
        } else {
          syncPlayer({ hp: newHp });
          setIsActionProcessing(false); // Reset lock after hit processing
        }
      }, 500);
    } else {
      addLog(`🛡️ Dodged ${target.name}'s strike!`);
      // Monster Miss
      setTimeout(() => {
        setCurrentTaunt("Drat! Slipped!");
        setPlayerTaunt("Nice try!");
        setIsActionProcessing(false);
      }, 500);
    }
  }, [showDefeatedWindow, player, totalStats, addLog, triggerHitEffects, syncPlayer, setDepth, setView]);

  const processKill = useCallback(() => {
    const e = enemyRef.current || enemy;
    const p = playerRef.current || player;
    addLog(`Victory! Found ${e.loot} GX.`);
    
    let nextXp = p.xp + e.xp, nextLvl = p.level, nextMaxHp = p.maxHp, nextAP = p.abilityPoints || 0;
    let didLevelUp = false;
    while (nextXp >= nextLvl * XP_BASE) { 
      nextXp -= nextLvl * XP_BASE; 
      nextLvl++; 
      nextMaxHp += 50; 
      nextAP += AP_PER_LEVEL; 
      addLog(`LVL UP! +5 AP.`); 
      didLevelUp = true;
    }
    
    const updates = { 
      tokens: p.tokens + e.loot, 
      xp: nextXp, 
      level: nextLvl, 
      maxHp: nextMaxHp, 
      hp: Math.min(nextMaxHp, p.hp + 25), 
      abilityPoints: nextAP 
    };

    // --- Loot Drop Logic (Optimized for Depth & Rarity) ---
    if (selectedMap && selectedMap.lootTable) {
      const dropChance = 0.35 + (p.level * 0.005); 
      if (Math.random() < dropChance) {
        // Filter loots based on rarity vs floor (depth)
        // Rare: > Floor 5, Epic: > Floor 10, Legendary: > Floor 20
        const possibleLoots = selectedMap.lootTable.map(id => LOOTS.find(l => l.id === id)).filter(l => {
          if (!l) return false;
          if (l.rarity === 'Legendary' && depth < 20) return false;
          if (l.rarity === 'Epic' && depth < 10) return false;
          if (l.rarity === 'Rare' && depth < 5) return false;
          return true;
        });

        if (possibleLoots.length > 0) {
          // Weighted random based on rarity
          const rarityWeights = { 'Common': 100, 'Uncommon': 40, 'Rare': 15, 'Epic': 4, 'Legendary': 1 };
          const pool = [];
          possibleLoots.forEach(l => {
            const weight = rarityWeights[l.rarity] || 10;
            for(let i=0; i<weight; i++) pool.push(l);
          });
          
          const lootItem = pool[Math.floor(Math.random() * pool.length)];
          if (lootItem) {
            updates.inventory = [...(p.inventory || []), lootItem];
            addLog(`🎁 LOOT: Found ${lootItem.name}!`);
            playSFX(SOUNDS.obtainLoot);
            setLastLoot(lootItem);
            setTimeout(() => setLastLoot(null), 3000);
          }
        }
      }
    }
    
    syncPlayer(updates);

    // Track Reward Session
    const droppedItem = updates.inventory ? updates.inventory[updates.inventory.length-1] : null;
    setSessionRewards(prev => ({
      tokens: prev.tokens + e.loot,
      xp: prev.xp + e.xp,
      loots: droppedItem ? [...prev.loots, droppedItem] : prev.loots
    }));

    // Dungeon Progression: Every 10 monsters = Floor +1
    const newKills = killsRef.current + 1;
    if (newKills >= 10) {
       setKillsInFloor(0);
       const nextDepth = depthRef.current + 1;
       setDepth(nextDepth);
       addLog(`⬆️ FLOOR UP! Ascending to Floor ${nextDepth}...`);
       
       if (nextDepth > (p.maxDepth || 1)) {
         updates.maxDepth = nextDepth;
       }
       
       spawnNewEnemy(nextDepth);
    } else {
       setKillsInFloor(newKills);
       spawnNewEnemy(depthRef.current);
    }

    if (didLevelUp || updates.maxDepth) {
      updateLeaderboard({ 
        level: nextLvl, 
        maxDepth: updates.maxDepth || p.maxDepth || 1 
      });
    }
  }, [enemy, player, addLog, selectedMap, syncPlayer, spawnNewEnemy, depth, setDepth]);

  const processBossHit = useCallback(async (dmg, isCrit) => {
    const p = playerRef.current || player;
    const newTotal = (p.totalBossDamage || 0) + dmg;
    let nextRecipes = [...p.recipes];
    if (Math.random() < BOSS.recipeDropChance) {
      const randomRecipe = CRYSTLE_RECIPES[Math.floor(Math.random() * CRYSTLE_RECIPES.length)];
      if (!nextRecipes.includes(randomRecipe.id)) { nextRecipes.push(randomRecipe.id); addLog(`BOSS DROP: ${randomRecipe.name}!`); }
    }
    syncPlayer({ totalBossDamage: newTotal, recipes: nextRecipes });
    
    // Non-blocking leaderboard update
    updateLeaderboard({ score: newTotal });
    
    // Note: enemyTurn will handle setting isActionProcessing(false) after its own hit delay
    enemyTurn(BOSS, true);
  }, [player, addLog, syncPlayer, user, db, appId, enemyTurn]);

  const handleAttack = useCallback((isBoss = false) => {
    const p = playerRef.current || player;
    const e = enemyRef.current || enemy;
    
    // Safety check: Don't allow attack if dead or already processing
    if (p.hp <= 0 || stunRef.current > 0 || missRef.current > 0 || showDefeatedWindow || isActionProcessing || (!isBoss && !e)) {
      if (isActionProcessing) setIsActionProcessing(false); // Recovery if somehow stuck
      return;
    }

    setIsActionProcessing(true);

    // COMPANION BUFF CHANCE
    let stats = totalStats;
    if (p.hiredMate && buffTimeLeft <= 0 && Math.random() < 0.5) {
      const mate = TAVERN_MATES.find(m => m.id === p.hiredMate);
      syncPlayer({ buffUntil: Date.now() + COMPANION_BUFF_DURATION });
      addLog(`✨ ${mate.name} cast a buff on you!`);
      // Apply immediate buff to current strike
      if (mate.type === 'STR') stats.str *= 2;
      if (mate.type === 'AGI') stats.agi *= 2;
      if (mate.type === 'DEX') stats.dex *= 2;
    }

    const target = isBoss ? BOSS : e;

    // Trigger Strike Animation
    setStrikingSide('player');
    playSFX(SOUNDS.playerAttack);
    setTimeout(() => setStrikingSide(null), 300);

    const hitChance = Math.min(98, (stats.dex / (stats.dex + target.agi * 0.4)) * 100);
    if (Math.random() * 100 < hitChance) {
      const isCrit = Math.random() < 0.15;
      const dmgBase = stats.str + Math.floor(Math.random() * 10) - Math.floor(target.agi / 5);
      const dmg = Math.max(5, isCrit ? Math.floor(dmgBase * 2.5) : dmgBase);
      
      triggerHitEffects(dmg, isCrit, 'monster');
      
      // Player Battle Taunt (Aggressive)
      const pTaunts = ["Take this!", "Direct strike!", "Weak!", "Begone!", "Target locked!", "Hunter's Fury!", "Maximum output!"];
      setPlayerTaunt(pTaunts[Math.floor(Math.random() * pTaunts.length)]);

      addLog(`Struck ${target.name} for ${dmg} DMG.`);

      // HIT DELAY (0.5s)
      setTimeout(() => {
        if (isBoss) {
          processBossHit(dmg, isCrit);
        } else {
          const newHp = Math.max(0, target.hp - dmg);
          if (newHp <= 0) {
            setEnemy({ ...target, hp: 0 });
            processKill();
            setIsActionProcessing(false);
          } else { 
            setEnemy({ ...target, hp: newHp }); 
            enemyTurn({ ...target, hp: newHp }, isBoss); 
          }
        }
      }, 500);
    } else {
      addLog(`Missed strike on ${target.name}!`);
      setMissTimeLeft(1.5);
      // Miss Ouch/Taunt
      setPlayerTaunt("Darn, missed!");
      setCurrentTaunt("Ha! Too slow!");
      enemyTurn(target, isBoss); 
      // Removed immediate setIsActionProcessing(false) here. 
      // enemyTurn will handle the reset after its animation delay.
    }
  }, [player, enemy, showDefeatedWindow, isActionProcessing, totalStats, buffTimeLeft, syncPlayer, addLog, triggerHitEffects, processBossHit, processKill, enemyTurn, setEnemy]);

  const allocateStat = (statName) => {
    if ((player.abilityPoints || 0) <= 0) return;
    const newBase = { ...player.baseStats };
    newBase[statName] = (newBase[statName] || 0) + 1;
    syncPlayer({ baseStats: newBase, abilityPoints: player.abilityPoints - 1 });
  };

  const buyItem = (item) => {
    if (player.tokens < item.cost) return addLog("Out of GX!");
    if (player.level < (item.reqLvl || 1)) return addLog(`Requires Level ${item.reqLvl}!`);
    
    if (item.id === 'hp_potion') {
      syncPlayer({ tokens: player.tokens - item.cost, potions: (player.potions || 0) + 1 });
    } else if (item.id === 'auto_scroll') {
      syncPlayer({ tokens: player.tokens - item.cost, autoScrolls: (player.autoScrolls || 0) + 1 });
    } else {
      // Equipment: Move old item to inventory
      const oldItem = player.equipped?.[item.type];
      const newInventory = oldItem ? [...(player.inventory || []), oldItem] : (player.inventory || []);
      syncPlayer({ 
        tokens: player.tokens - item.cost, 
        equipped: { ...player.equipped, [item.type]: item },
        inventory: newInventory
      });
      addLog(`Equipped ${item.name}! Old gear moved to Storage.`);
    }
  };

  const equipItem = (item) => {
    const oldItem = player.equipped?.[item.type];
    
    // Remove new item from inventory, add old item back
    let newInventory = player.inventory.filter((_, i) => i !== player.inventory.findIndex(inv => inv.id === item.id));
    if (oldItem) newInventory.push(oldItem);

    syncPlayer({
      equipped: { ...player.equipped, [item.type]: item },
      inventory: newInventory
    });
    addLog(`Installed Tech: ${item.name}`);
  };

  const unequipItem = (slot) => {
    const item = player.equipped?.[slot];
    if (!item) return;

    syncPlayer({
      equipped: { ...player.equipped, [slot]: null },
      inventory: [...(player.inventory || []), item]
    });
    addLog(`Uninstalled Tech: ${item.name}`);
  };

  const forgeCrystle = async (recipe) => {
    const p = playerRef.current || player;
    const stats = totalStats;
    
    if (p.tokens < recipe.cost) return addLog("Need more tokens!");
    
    // Check materials again for safety
    const materials = recipe.materials || [];
    const hasMaterials = materials.every(mat => {
      const countInInv = p.inventory?.filter(i => i.id === mat.id).length || 0;
      return countInInv >= mat.count;
    });

    if (!hasMaterials) return addLog("Missing required materials!");

    // Success Rate: 50% base + Dex/2
    const successRate = Math.min(95, 50 + Math.floor(stats.dex / 2));
    const roll = Math.random() * 100;

    // Consume Materials regardless of success (Hardcore Mode)
    let newInventory = [...(p.inventory || [])];
    materials.forEach(mat => {
      for (let i = 0; i < mat.count; i++) {
        const index = newInventory.findIndex(item => item.id === mat.id);
        if (index !== -1) newInventory.splice(index, 1);
      }
    });

    if (roll <= successRate) {
      // Success!
      const newEquipment = { 
        ...recipe, 
        id: recipe.id, 
        icon: recipe.img || '📜', 
        sellValue: Math.floor(recipe.cost / 2) 
      };
      
      await syncPlayer({ 
        tokens: p.tokens - recipe.cost, 
        equipped: { ...p.equipped, [recipe.type]: newEquipment }, 
        inventory: [...newInventory, newEquipment] 
      });
      
      addLog(`✨ SUCCESS! Forged ${recipe.name}!`);
      playSFX(SOUNDS.obtainLoot);
    } else {
      // Failure
      await syncPlayer({ 
        tokens: p.tokens - recipe.cost,
        inventory: newInventory
      });
      addLog(`💥 FORGE FAILED! Materials lost in the reaction...`);
    }
  };

  if (loading) return <LoadingScreen />;

  if (!user || !player) {
    return <LoginView handleGoogleLogin={handleGoogleLogin} />;
  }

  const isPenalized = penaltyRemaining > 0;
  const isStunned = stunTimeLeft > 0;
  const isMissed = missTimeLeft > 0;
  const isAutoActive = autoTimeLeft > 0;
  const currentMate = TAVERN_MATES.find(m => m.id === player.hiredMate);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden transition-colors relative`}>
      <AnimatedBackground MONSTERS={MONSTERS} performanceMode={player.performanceMode} />

      {showDefeatedWindow && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in zoom-in duration-300 p-4">
          <div className="relative max-w-sm w-full">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-0 bg-red-800 rounded-3xl transform translate-x-2 translate-y-2"></div>
            
            <div className="relative bg-slate-950 border-[4px] border-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f87171 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
              
              {/* Header Banner */}
              <div className="w-full bg-red-600 py-6 border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg">
                <h2 className="text-5xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[4px_4px_0_rgba(0,0,0,1)] animate-bounce-short">
                  CRUSHED!
                </h2>
                <div className="absolute -bottom-3 right-8 bg-black text-white px-3 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white">
                  Fatal Impact Detected
                </div>
              </div>

              {/* Defeated Avatar */}
              <div className="py-8 relative">
                <div className="w-40 h-40 rounded-full border-[8px] border-black overflow-hidden relative shadow-inner group">
                   <div className="absolute inset-0 bg-red-900/40 mix-blend-multiply z-10"></div>
                   {player.avatar && (
                     <div className="grayscale contrast-125 opacity-70 scale-110">
                        <AvatarMedia num={player.avatar} animated={false} className="w-full h-full object-cover" />
                     </div>
                   )}
                   <div className="absolute inset-0 flex items-center justify-center z-20">
                     <Skull size={80} className="text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] opacity-90" />
                   </div>
                </div>
                {/* Impact Spokes */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute top-1/2 left-1/2 w-1 h-32 bg-red-600/20 origin-top transform" style={{ rotate: `${i * 45}deg` }}></div>
                  ))}
                </div>
              </div>

              {/* Message Box */}
              <div className="px-8 pb-8 w-full">
                <div className="bg-white text-black p-4 rounded-2xl border-[3px] border-black relative transform rotate-1 shadow-[6px_6px_0_rgba(0,0,0,0.3)]">
                  <div className="absolute -top-3 -left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 border-2 border-black uppercase italic">
                    Log: Protocol Zero
                  </div>
                  <p className="text-xs font-black uppercase leading-tight tracking-tight italic">
                    "Your strength fails... The darkness closes in. Emergency extraction initiated."
                  </p>
                  <div className="absolute -bottom-2 -left-1 w-4 h-4 bg-white border-b-3 border-l-3 border-black transform rotate-[30deg]"></div>
                </div>

                <div className="mt-8 space-y-2">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-red-500 uppercase italic">Recovery Progress</span>
                      <span className="text-[10px] font-black text-white opacity-50 uppercase tracking-tighter italic">Returning To Tavern</span>
                   </div>
                   <div className="w-full h-4 bg-black rounded-lg border-2 border-red-900/50 p-0.5 relative overflow-hidden">
                      <div className="h-full bg-red-600 rounded-sm animate-defeat-progress shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessWindow && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in zoom-in duration-300 p-4">
          <div className="relative max-w-sm w-full">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-0 bg-cyan-800 rounded-3xl transform translate-x-2 translate-y-2"></div>
            
            <div className="relative bg-slate-100 border-[4px] border-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
              
              {/* Header Banner */}
              <div className="w-full bg-cyan-500 py-6 border-b-[4px] border-black transform rotate-1 relative z-10 shadow-lg">
                <h2 className="text-5xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[4px_4px_0_rgba(0,0,0,1)] animate-bounce-short">
                  VICTORY!
                </h2>
                <div className="absolute -bottom-3 right-8 bg-black text-white px-3 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] transform -rotate-2 border-2 border-white">
                  Sector Node Secured
                </div>
              </div>

              {/* Victory Avatar / Trophy */}
              <div className="py-8 relative">
                 <div className="w-32 h-32 bg-white rounded-2xl border-[4px] border-black flex items-center justify-center relative shadow-[6px_6px_0_rgba(0,0,0,1)] transform -rotate-3 overflow-hidden">
                    <Trophy size={64} className="text-amber-500 animate-pulse relative z-10" />
                    <Sparkles size={100} className="absolute text-cyan-200/50 animate-spin-slow" />
                 </div>
              </div>

              {/* Rewards Summary */}
              <div className="px-8 pb-8 w-full space-y-4">
                <div className="bg-black text-white p-4 rounded-2xl border-[3px] border-white relative transform -rotate-1 shadow-[6px_6px_0_rgba(255,255,255,0.1)]">
                   <p className="text-[10px] font-black uppercase text-cyan-400 mb-2 italic tracking-widest">Raid Outcome Log</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black uppercase text-slate-500">Total GX</span>
                         <span className="text-xl font-black text-amber-400 italic">+{sessionRewards.tokens}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black uppercase text-slate-500">Exp Won</span>
                         <span className="text-xl font-black text-white italic">+{sessionRewards.xp}</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex items-center gap-2">
                      <ShoppingBag size={12} className="text-black" />
                      <span className="text-[8px] font-black text-black uppercase tracking-widest">Loot Synchronized:</span>
                   </div>
                   <div className="flex flex-wrap gap-2 min-h-[44px]">
                      {sessionRewards.loots.length > 0 ? (
                        sessionRewards.loots.map((item, i) => (
                          <div key={i} className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center text-xl shadow-[2px_2px_0_rgba(0,0,0,1)] animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                            {item.icon}
                          </div>
                        ))
                      ) : (
                        <span className="text-[8px] text-slate-400 font-bold uppercase italic tracking-widest">No Physical Drops Detected</span>
                      )}
                   </div>
                </div>

                <button 
                  onClick={() => { setShowSuccessWindow(false); setView('map'); }}
                  className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-tighter hover:bg-slate-800 transition-all border-[3px] border-black shadow-[6px_6px_0_rgba(0,0,0,0.3)] active:translate-x-1 active:translate-y-1 active:shadow-none italic text-lg"
                >
                   CONFIRM & RETURN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-slate-950 border-b-[4px] border-black sticky top-0 z-50 p-3 md:p-6 shadow-2xl relative overflow-hidden">
        {/* Halftone Overlay HUD */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }}></div>
        
        {player.avatar && (
           <div className="absolute inset-0 pointer-events-none z-0">
             <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover opacity-40 blur-[2px] scale-110" />
             <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-slate-950"></div>
           </div>
        )}

        <div className="max-w-5xl mx-auto flex flex-row gap-3 md:gap-6 relative z-10 items-stretch">
          {/* PROFILE CARD - SIDE PANEL */}
          <div className="w-24 sm:w-28 md:w-40 bg-slate-900 border-[3px] md:border-[5px] border-black rounded-xl md:rounded-2xl overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] relative flex flex-col group shrink-0">
            <div className="aspect-[3/4] md:flex-1 relative overflow-hidden">
               <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 contrast-125" />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none opacity-60" />
            </div>
            <button 
              onClick={() => setView('avatars')}
              className="w-full py-1.5 md:py-3 bg-black/80 hover:bg-black text-[7px] md:text-[11px] font-black uppercase text-white tracking-[0.2em] md:tracking-[0.4em] transition-all border-t-[2px] md:border-t-[4px] border-black italic shrink-0"
            >
              EDIT
            </button>
          </div>

          {/* MAIN HUD DATA */}
          <div className="flex-1 flex flex-col justify-between py-0.5 md:py-1 min-w-0">
            {/* Top Row: Info & Currencies */}
            <div className="flex flex-col gap-2 md:gap-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                  <div className="bg-white text-black px-2 md:px-6 py-0.5 md:py-2 border-[3px] md:border-[4px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] transform -rotate-1 min-w-0 md:min-w-[200px] flex-1 md:flex-none">
                    <h1 className="font-black text-xs md:text-3xl uppercase tracking-tighter italic leading-none truncate">{player.name}</h1>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 md:gap-3">
                   <div className="bg-cyan-500 text-black px-1.5 md:px-4 py-0.5 md:py-1.5 border-[2px] md:border-[4px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] font-black text-[7px] md:text-sm uppercase italic tracking-widest leading-none">
                     LVL {player.level}
                   </div>
                   {player.abilityPoints > 0 && (
                     <div className="bg-amber-400 text-black px-1.5 md:px-4 py-0.5 md:py-1.5 border-[2px] md:border-[4px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] font-black text-[7px] md:text-sm uppercase italic tracking-widest leading-none animate-pulse">
                       +{player.abilityPoints} AP
                     </div>
                   )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 md:gap-4">
                <div className="flex gap-1 md:gap-4 flex-wrap flex-1">
                   <div className="flex items-center gap-1 md:gap-2 bg-cyan-400 text-black border-[2px] md:border-[4px] border-black px-1.5 md:px-4 py-1 md:py-2 shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] transform rotate-1 font-black italic">
                      <Coins size={10} md:size={18} strokeWidth={3} />
                      <span className="text-[10px] md:text-xl">{player.tokens.toLocaleString()}</span>
                   </div>
                   <div className="hidden sm:flex items-center gap-1 md:gap-2 bg-red-600 text-white border-[2px] md:border-[4px] border-black px-1.5 md:px-4 py-1 md:py-2 shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] transform -rotate-1 font-black italic">
                      <Coffee size={10} md:size={18} strokeWidth={3} />
                      <span className="text-[10px] md:text-xl">{player.potions || 0}</span>
                   </div>
                   <div className="hidden sm:flex items-center gap-1 md:gap-2 bg-blue-600 text-white border-[2px] md:border-[4px] border-black px-1.5 md:px-4 py-1 md:py-2 shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] transform rotate-1 font-black italic">
                      <MousePointer size={10} md:size={18} strokeWidth={3} />
                      <span className="text-[10px] md:text-xl">{player.autoScrolls || 0}</span>
                   </div>
                </div>

                <div className="flex gap-1 md:gap-3 shrink-0">
                   <button onClick={() => setIsMusicOn(!isMusicOn)} className={`p-1 md:p-2 rounded-lg border-[2px] md:border-[4px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all ${isMusicOn ? 'bg-cyan-900 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}><Music size={12} md:size={20} /></button>
                   <button onClick={handleLogout} className="p-1 md:p-2 bg-slate-900 border-[2px] md:border-[4px] border-black text-slate-500 shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:text-red-500 transition-all"><Lock size={12} md:size={20} /></button>
                </div>
              </div>
            </div>

            {/* HP & XP BAR Segment */}
            <div className="space-y-1 md:space-y-4 mt-2">
              {/* HP BAR */}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1.5 md:gap-2 min-w-[70px] md:min-w-[100px] shrink-0">
                   <Heart size={14} md:size={20} className={player.hp / player.maxHp <= 0.25 ? "text-red-500 animate-pulse" : "text-white"} fill="currentColor" />
                   <span className={`text-sm md:text-lg font-black italic ${player.hp / player.maxHp <= 0.25 ? "text-red-500" : "text-white"}`}>{player.hp}</span>
                </div>
                <div className="flex-1 h-3.5 md:h-6 bg-black border-[2px] md:border-[4px] border-white/10 p-0.5 md:p-1 relative shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[5px_5px_0_rgba(0,0,0,1)] overflow-hidden">
                   <div 
                     className={`h-full transition-all duration-300 rounded-sm relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] ${player.hp / player.maxHp <= 0.25 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
                     style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                   />
                   <div className="absolute inset-0 z-20 pointer-events-none opacity-40" style={{ backgroundImage: 'linear-gradient(90deg, transparent 96%, rgba(0,0,0,0.8) 96%)', backgroundSize: '4% 100%' }}></div>
                </div>
              </div>

              {/* XP BAR */}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1.5 md:gap-2 min-w-[70px] md:min-w-[100px] shrink-0">
                   <Star size={14} md:size={20} className="text-cyan-400" fill="currentColor" />
                   <span className="text-sm md:text-lg font-black text-white italic">{player.xp}</span>
                </div>
                <div className="flex-1 h-3.5 md:h-6 bg-black border-[2px] md:border-[4px] border-white/10 p-0.5 md:p-1 relative shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[5px_5px_0_rgba(0,0,0,1)] overflow-hidden">
                   <div 
                     className="h-full bg-blue-500 transition-all duration-300 rounded-sm relative z-10 shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                     style={{ width: `${Math.min(100, (player.xp / (player.level * XP_BASE)) * 100)}%` }} 
                   />
                   <div className="absolute inset-0 z-20 pointer-events-none opacity-40" style={{ backgroundImage: 'linear-gradient(90deg, transparent 96%, rgba(0,0,0,0.8) 96%)', backgroundSize: '4% 100%' }}></div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Gear HUD */}
            <div className="grid grid-cols-5 gap-1.5 md:gap-3 mt-2 md:mt-4">
              {[
                { label: 'HEAD', key: 'Headgear', color: 'text-blue-400' },
                { label: 'WEAPON', key: 'Weapon', color: 'text-amber-400' },
                { label: 'ARMOR', key: 'Armor', color: 'text-cyan-400' },
                { label: 'FEET', key: 'Footwear', color: 'text-emerald-400' },
                { label: 'RELIC', key: 'Relic', color: 'text-purple-400' }
              ].map(slot => (
                <div key={slot.key} className="bg-slate-900 border-[2px] md:border-[3px] border-black p-1 md:p-2 flex flex-col items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-slate-800 transition-all group min-w-0">
                  <span className="text-[5px] md:text-[7px] text-slate-500 font-black uppercase tracking-widest leading-none mb-0.5 md:mb-1 group-hover:text-slate-400">{slot.label}</span>
                  <span className={`text-[6px] md:text-[9px] font-black leading-none truncate w-full text-center tracking-tighter uppercase italic ${player.equipped?.[slot.key] ? slot.color : 'text-slate-600'}`}>
                    {player.equipped?.[slot.key] ? player.equipped[slot.key].name : 'EMPTY'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-3 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={<Sword size={14} />} label="STR" value={totalStats.str} color="text-red-400" desc="Attack Power" isBuffed={buffTimeLeft > 0 && currentMate?.type === 'STR'} />
          <StatTile icon={<Wind size={14} />} label="AGI" value={totalStats.agi} color="text-emerald-400" desc="Evasion/SPD" isBuffed={buffTimeLeft > 0 && currentMate?.type === 'AGI'} />
          <StatTile icon={<Target size={14} />} label="DEX" value={totalStats.dex} color="text-yellow-400" desc="Accuracy" isBuffed={buffTimeLeft > 0 && currentMate?.type === 'DEX'} />
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl min-h-[450px] md:min-h-[550px] flex flex-col overflow-hidden backdrop-blur-sm relative">

          {view === 'menu' && (
            <MenuView 
              setView={setView} 
              isPenalized={isPenalized} 
              penaltyRemaining={penaltyRemaining} 
              setDepth={setDepth} 
              spawnNewEnemy={spawnNewEnemy} 
              autoUntil={player?.autoUntil || 0} 
              syncPlayer={syncPlayer} 
            />
          )}

          {view === 'dungeon' && (
            <CombatView 
              enemy={enemy} 
              depth={depth} 
              buffTimeLeft={buffTimeLeft} 
              isAutoActive={isAutoActive} 
              autoTimeLeft={autoTimeLeft} 
              player={player} 
              handleHeal={handleHeal} 
              activateAutoScroll={activateAutoScroll} 
              isHurt={isHurt} 
              impactSplash={impactSplash} 
              isStunned={isStunned} 
              stunTimeLeft={stunTimeLeft} 
              isMissed={isMissed} 
              missTimeLeft={missTimeLeft} 
              showDefeatedWindow={showDefeatedWindow} 
              handleAttack={handleAttack} 
              setView={(v) => { if (v === 'menu') setAutoUseScroll(false); setView(v); }} 
              syncPlayer={syncPlayer} 
              setDepth={setDepth} 
              selectedMap={selectedMap}
              autoUseScroll={autoUseScroll}
              setAutoUseScroll={setAutoUseScroll}
              killsInFloor={killsInFloor}
              LOOTS={LOOTS}
              currentTaunt={currentTaunt}
              playerTaunt={playerTaunt}
              playerImpactSplash={playerImpactSplash}
              strikingSide={strikingSide}
              totalStats={totalStats}
              lastLoot={lastLoot}
            />
          )}

          {view === 'tavern' && (
            <TavernView 
              TAVERN_MATES={TAVERN_MATES} 
              player={player} 
              hireMate={hireMate} 
              setView={setView} 
            />
          )}

          {view === 'boss' && (
            <BossView 
              isHurt={isHurt} 
              enemyFlinch={enemyFlinch} 
              bossAvatarIdx={bossAvatarIdx} 
              showBossVideo={showBossVideo} 
              setShowBossVideo={setShowBossVideo} 
              BOSS_MEDIA_FILES={BOSS_MEDIA_FILES} 
              impactSplash={impactSplash} 
              BOSS={BOSS} 
              player={player} 
              autoTimeLeft={autoTimeLeft} 
              activateAutoScroll={activateAutoScroll} 
              handleHeal={handleHeal} 
              handleAttack={handleAttack} 
              setView={(v) => { if (v === 'menu') setAutoUseScroll(false); setView(v); }} 
              syncPlayer={syncPlayer}
              currentTaunt={currentTaunt}
              playerTaunt={playerTaunt}
              playerImpactSplash={playerImpactSplash}
              strikingSide={strikingSide}
              totalStats={totalStats}
              isStunned={stunTimeLeft > 0}
              stunTimeLeft={stunTimeLeft}
              isMissed={missTimeLeft > 0}
              missTimeLeft={missTimeLeft}
              autoUseScroll={autoUseScroll}
              setAutoUseScroll={setAutoUseScroll}
            />
          )}

          {view === 'attributes' && (
            <AttributesView 
              player={player} 
              allocateStat={allocateStat} 
              setView={setView} 
            />
          )}

          {view === 'avatars' && (
            <IdentityView 
              player={player} 
              syncPlayer={syncPlayer} 
              setView={setView} 
              addLog={addLog} 
            />
          )}

          {view === 'shop' && (
            <ShopView 
              SHOP_ITEMS={SHOP_ITEMS} 
              player={player} 
              buyItem={buyItem} 
              setView={setView} 
            />
          )}

          {view === 'forge' && (
            <ForgeView 
              CRYSTLE_RECIPES={CRYSTLE_RECIPES} 
              player={player} 
              forgeCrystle={forgeCrystle} 
              setView={setView} 
              LOOTS={LOOTS}
            />
          )}

          {view === 'leaderboard' && (
            <LeaderboardView 
              leaderboard={leaderboard} 
              user={user} 
              setView={setView} 
            />
          )}

          {view === 'inventory' && (
            <InventoryView 
              player={player} 
              setView={setView}
              sellItem={sellItem}
            />
          )}

          {view === 'gear' && (
            <GearView 
              player={player} 
              totalStats={totalStats}
              equipItem={equipItem}
              unequipItem={unequipItem}
              setView={setView}
              currentMate={currentMate}
              buffTimeLeft={buffTimeLeft}
            />
          )}

          {view === 'market' && (
            <MarketplaceView 
              player={player}
              listings={marketplace}
              purchaseItem={purchaseMarketItem}
              listItem={listMarketItem}
              cancelListing={cancelMarketListing}
              setView={setView}
              addLog={addLog}
            />
          )}

          {view === 'database' && (
            <DatabaseView
              depth={depth}
              setView={setView}
              MONSTERS={MONSTERS}
              LOOTS={LOOTS}
              EQUIPMENT={EQUIPMENT}
              MAPS={MAPS}
              FRUITS={FRUITS}
            />
          )}

          {view === 'map' && (
            <MapView 
              MAPS={MAPS} 
              LOOTS={LOOTS}
              player={player} 
              setView={setView} 
              setDepth={setDepth} 
              spawnNewEnemy={spawnNewEnemy} 
              setSelectedMap={setSelectedMap}
              isPenalized={isPenalized}
              penaltyRemaining={penaltyRemaining}
            />
          )}

          {view === 'pvp' && (
            <PvpRoomView 
              player={player} 
              syncPlayer={syncPlayer} 
              setView={setView} 
              addLog={addLog} 
              totalStats={totalStats}
              db={db}
              appId={appId}
              user={user}
            />
          )}
          
          {view === 'admin' && (
            <AdminPanelView 
              db={db} 
              appId={appId} 
              userEmail={user?.email} 
              setView={setView} 
            />
          )}
          
          {view === 'dragons_ground' && (
            <DragonsGroundView 
              player={player} 
              syncPlayer={syncPlayer} 
              setView={setView} 
              LOOTS={LOOTS}
              FRUITS={FRUITS}
              addLog={addLog}
            />
          )}
        </div>

        <div className="bg-amber-400 border-[4px] border-black rounded-lg p-3 h-28 overflow-y-auto relative shadow-[4px_4px_0_rgba(0,0,0,1)]">
          <div className="absolute top-2 right-4 text-[8px] font-black text-black opacity-30 uppercase tracking-[0.4em]">Battle Bulletin</div>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={`text-xs font-black uppercase leading-tight italic ${i === 0 ? 'text-black' : 'text-black/40'}`}>
                {i === 0 ? <span className="mr-2">▶</span> : <span className="mr-2 opacity-50">•</span>}
                {log}
              </div>
            ))}
          </div>
        </div>

      </main>

      <footer className="text-center py-8 opacity-40">
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] mb-1">hunt.crystle.world</p>
      </footer>

      <style>{`
        @keyframes defeat-progress { from { width: 0%; } to { width: 100%; } }
        .animate-defeat-progress { animation: defeat-progress ${DEFEAT_WINDOW_DURATION}ms linear forwards; }
        
        @keyframes flinch {
          0% { transform: scale(1); filter: brightness(1) contrast(1); }
          50% { transform: scale(0.92) rotate(3deg); filter: brightness(2) contrast(1.5) sepia(0.5); }
          100% { transform: scale(1); filter: brightness(1) contrast(1); }
        }
        @keyframes impact-pop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          40% { transform: scale(1.4) rotate(15deg); opacity: 1; }
          70% { transform: scale(1) rotate(-5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-short { animation: bounce-short 0.4s ease-in-out infinite; }
        .animate-flinch { animation: flinch 0.15s ease-out; }
        .animate-impact { animation: impact-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

const GhostIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500 animate-pulse">
    <path d="M9 10L9.01 10M15 10L15.01 10M12 2C8.13 2 5 5.13 5 9V22L7 20L9 22L11 20L13 22L15 20L17 22L19 20L21 22V9C21 5.13 17.87 2 14 2H12Z" />
  </svg>
);

export default App;
