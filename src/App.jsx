import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import {
  Sword, Shield, Coins, Star, Trophy, ShoppingBag,
  Map as MapIcon, ChevronRight, Heart, Zap, Target,
  Wind, Lock, User, RefreshCw, AlertCircle, Sparkles,
  Hammer, Gem, Package, X, TrendingUp, Skull, Flame, Clock,
  PlusCircle, Activity, Coffee, MousePointer, Beer, Users,
  Book, Globe, Database, HardHat, Footprints
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
import { InventoryView } from './components/InventoryView';
import { DatabaseView } from './components/DatabaseView';
import { MapView } from './components/MapView';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginView } from './components/LoginView';

const BOSS = {
  name: "The Core Guardian",
  hp: 10000000,
  str: 150,
  agi: 70,
  dex: 85,
  critChance: 0.25,
  recipeDropChance: 0.15,
  taunts: ["I am the final obstacle!", "Your journey ends here.", "Kneel before the Core!"]
};

const BOSS_MEDIA_FILES = [
  { img: '/assets/bossmonster/DungeonGemBoss (1).jpg', vid: '/assets/bossmonstervideo/DungeonGemBoss (1) video.mp4' },
  { img: '/assets/bossmonster/CrystleHunterAvatar (30).jpg', vid: '/assets/bossmonstervideo/DungeonGemBoss (2) video.mp4' }
];

const SHOP_ITEMS = [...SHOP_CONSUMABLES, ...EQUIPMENT];

const App = () => {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
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
  const [missTimeLeft, setMissTimeLeft] = useState(0);
  const [impactSplash, setImpactSplash] = useState(null);
  const [bossAvatarIdx, setBossAvatarIdx] = useState(0);
  const [showBossVideo, setShowBossVideo] = useState(true);
  const [showSuccessWindow, setShowSuccessWindow] = useState(false);
  const [sessionRewards, setSessionRewards] = useState({ tokens: 0, xp: 0, loots: [] });
  const [killsInFloor, setKillsInFloor] = useState(0);
  const [autoUseScroll, setAutoUseScroll] = useState(false);

  const playerRef = useRef(null);
  const stunRef = useRef(0);
  const missRef = useRef(0);

  useEffect(() => {
    playerRef.current = player;
    stunRef.current = stunTimeLeft;
    missRef.current = missTimeLeft;
  }, [player, stunTimeLeft, missTimeLeft]);

  const triggerHitEffects = (dmg, isCrit) => {
    // 1. Impact Splash
    const impactWords = ["BAM!", "POW!", "WHACK!", "SMASH!", "KABOOM!", "ZAP!", "SLAM!"];
    const word = impactWords[Math.floor(Math.random() * impactWords.length)];
    const id = Date.now();
    setImpactSplash({ text: word, dmg, isCrit, id });
    setTimeout(() => setImpactSplash(prev => (prev?.id === id ? null : prev)), 400);

    // 2. Flinch
    triggerFlinch();
  };

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

  const useAutoScroll = async () => {
    const p = playerRef.current || player;
    const scroll = p.inventory?.find(i => i.id === 'auto_scroll');
    if (!scroll) {
      addLog("❌ No Auto Scrolls remaining!");
      return;
    }
    
    const newInventory = [...p.inventory];
    const idx = newInventory.findIndex(i => i.id === 'auto_scroll');
    newInventory.splice(idx, 1);
    
    const now = Date.now();
    const currentAutoUntil = Math.max(now, p.autoUntil || 0);
    const newAutoUntil = currentAutoUntil + AUTO_SCROLL_DURATION; // 1 hour typically
    
    await syncPlayer({
      autoUntil: newAutoUntil,
      autoMode: view === 'boss' ? 'boss' : 'dungeon',
      inventory: newInventory
    });
    addLog("⚡ Auto Scroll engaged (+1 Hour)");
  };

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

  useEffect(() => {
    const interval = setInterval(() => {
      setStunTimeLeft(prev => Math.max(0, prev - 0.1));
      setMissTimeLeft(prev => Math.max(0, prev - 0.1));
      
      const p = playerRef.current;
      if (p) {
        const now = Date.now();
        
        // Auto Scroll Timer
        if (p.autoUntil && p.autoUntil > now) {
          setAutoTimeLeft(Math.ceil((p.autoUntil - now) / 1000));
        } else {
          setAutoTimeLeft(0);
        }

        // Buff Timer
        if (p.buffUntil && p.buffUntil > now) {
          setBuffTimeLeft(Math.ceil((p.buffUntil - now) / 1000));
        } else {
          setBuffTimeLeft(0);
        }

        // Penalty Timer
        if (p.penaltyUntil && p.penaltyUntil > now) {
          setPenaltyRemaining(Math.ceil((p.penaltyUntil - now) / 1000));
        } else {
          setPenaltyRemaining(0);
        }

        // Auto-Use Scroll Logic
        if (autoUseScroll && (!p.autoUntil || p.autoUntil <= now) && (view === 'dungeon' || view === 'boss')) {
          const hasScroll = p.inventory?.some(i => i.id === 'auto_scroll');
          if (hasScroll) useAutoScroll();
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let autoLoop;
    if ((view === 'dungeon' || view === 'boss') && autoTimeLeft > 0 && !showDefeatedWindow && player?.autoMode === view) {
      autoLoop = setInterval(() => {
        const p = playerRef.current;
        const isBossView = view === 'boss';
        // For boss view, we don't need enemyRef since it uses the global BOSS constant
        if (p && (isBossView || enemyRef.current) && stunRef.current <= 0 && missRef.current <= 0) {
          if (p.hp < (p.maxHp * 0.4) && (p.potions || 0) > 0) handleHeal();
          else handleAttack(isBossView);
        }
      }, 1100);
    }
    return () => clearInterval(autoLoop);
  }, [view, autoTimeLeft > 0, showDefeatedWindow, player?.autoMode]);

  // Safety Guard: Cancel auto-scroll if player leaves current combat mode
  useEffect(() => {
    if (player?.autoUntil > 0 && player?.autoMode !== view) {
      syncPlayer({ autoUntil: 0, autoMode: null });
    }
    // Reset session rewards when starting a new dungeon run
    if (view === 'dungeon' && !showSuccessWindow) {
      setSessionRewards({ tokens: 0, xp: 0, loots: [] });
    }
  }, [view, player?.autoUntil, player?.autoMode, showSuccessWindow]);

  const loadPlayerData = async (u) => {
    try {
      const identifier = u.email || u.uid;
      const docRef = doc(db, 'artifacts', appId, 'users', identifier, 'profile', 'data');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPlayer(docSnap.data());
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
          penaltyUntil: 0,
          autoMode: null
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
        penaltyUntil: 0
      })
    }
    setLoading(false);
  };

  const syncPlayer = async (updates) => {
    if (!user) return;
    try {
      const identifier = user.email || user.uid;
      const docRef = doc(db, 'artifacts', appId, 'users', identifier, 'profile', 'data');
      setPlayer(prev => {
        const next = { ...prev, ...updates };
        setDoc(docRef, next, { merge: true }).catch(console.error);
        return next;
      });
    } catch (e) {
      setPlayer(prev => ({ ...prev, ...updates }));
    }
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

  const calculateTotalStats = () => {
    return calculateStats(player, TAVERN_MATES, buffTimeLeft > 0);
  };

  const addLog = (msg) => setLogs(prev => [msg, ...prev.slice(0, 7)]);

  const handleHeal = () => {
    const p = playerRef.current || player;
    if ((p.potions || 0) <= 0) return addLog("Out of Potions!");
    const healAmt = Math.floor(p.maxHp * 0.5);
    syncPlayer({ hp: Math.min(p.maxHp, p.hp + healAmt), potions: p.potions - 1 });
    addLog(`Healed ${healAmt} HP.`);
  };

  const activateAutoScroll = () => {
    if ((player.autoScrolls || 0) <= 0) return;
    const now = Date.now();
    syncPlayer({ 
      autoUntil: (player.autoUntil > now ? player.autoUntil : now) + AUTO_SCROLL_DURATION, 
      autoScrolls: player.autoScrolls - 1,
      autoMode: view
    });
  };

  const hireMate = (mate) => {
    if (player.tokens < mate.cost) return addLog("Out of GX!");
    syncPlayer({ tokens: player.tokens - mate.cost, hiredMate: mate.id });
    addLog(`Contract signed: ${mate.name} joined!`);
  };



  const handleAttack = (isBoss = false) => {
    const p = playerRef.current || player;
    const e = enemyRef.current || enemy;
    if (stunRef.current > 0 || missRef.current > 0 || showDefeatedWindow || (!isBoss && !e)) return;

    // COMPANION BUFF CHANCE
    let stats = calculateTotalStats();
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

    const hitChance = Math.min(98, (stats.dex / (stats.dex + target.agi * 0.4)) * 100);
    if (Math.random() * 100 < hitChance) {
      const isCrit = Math.random() < 0.15; // 15% crit chance for player
      const dmgBase = stats.str + Math.floor(Math.random() * 10) - Math.floor(target.agi / 5);
      const dmg = Math.max(5, isCrit ? Math.floor(dmgBase * 2.5) : dmgBase);
      
      triggerHitEffects(dmg, isCrit);
      if (!isBoss) addLog(`Struck ${target.name} for ${dmg} DMG.`);

      if (isBoss) {
        processBossHit(dmg, isCrit);
      } else {
        const newHp = Math.max(0, target.hp - dmg);
        if (newHp <= 0) {
          setEnemy({ ...target, hp: 0 }); // Visual sync
          processKill();
        } else { 
          setEnemy({ ...target, hp: newHp }); 
          enemyTurn({ ...target, hp: newHp }, isBoss); 
        }
      }
    } else {
      if (!isBoss) addLog(`Missed strike on ${target.name}!`);
      setMissTimeLeft(1.5);
      enemyTurn(target, isBoss);
    }
  };

  const enemyTurn = (target, isBoss = false) => {
    if (showDefeatedWindow) return;
    const p = playerRef.current || player;
    const stats = calculateTotalStats();
    const hitChance = (target.dex / (target.dex + stats.agi * 0.8)) * 100;

    if (Math.random() * 100 < hitChance) {
      const isCrit = Math.random() < (isBoss ? BOSS.critChance : target.critChance);
      let dmg = isCrit ? Math.max(15, Math.floor((target.str * 2.5) - (stats.agi * 0.1))) : Math.max(1, target.str - Math.floor(stats.agi / 4));

      if (isCrit) { addLog(`⚠️ CRIT!`); setCritAlert(true); setTimeout(() => setCritAlert(false), 800); setStunTimeLeft(STUN_DURATION_CRIT / 1000); }
      else setStunTimeLeft(STUN_DURATION_NORMAL / 1000);

      const taunts = target.taunts || ["Prepare to die!", "Too slow!", "Weakling!"];
      setCurrentTaunt(taunts[Math.floor(Math.random() * taunts.length)]);

      const newHp = Math.max(0, p.hp - dmg);
      triggerHurt();
      
      if (newHp <= 0) {
        setShowDefeatedWindow(true);
        syncPlayer({ hp: p.maxHp, penaltyUntil: Date.now() + PENALTY_DURATION, hiredMate: null, buffUntil: 0, autoUntil: 0 });
        setTimeout(() => { setShowDefeatedWindow(false); setDepth(1); setView('menu'); }, DEFEAT_WINDOW_DURATION);
      } else syncPlayer({ hp: newHp });
    }
  };

  const processKill = () => {
    const e = enemyRef.current || enemy;
    const p = playerRef.current || player;
    addLog(`Victory! Found ${e.loot} GX.`);
    
    let nextXp = p.xp + e.xp, nextLvl = p.level, nextMaxHp = p.maxHp, nextAP = p.abilityPoints || 0;
    while (nextXp >= nextLvl * XP_BASE) { nextXp -= nextLvl * XP_BASE; nextLvl++; nextMaxHp += 50; nextAP += AP_PER_LEVEL; addLog(`LVL UP! +5 AP.`); }
    
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
    const newKills = killsInFloor + 1;
    if (newKills >= 10) {
       setKillsInFloor(0);
       const nextDepth = depth + 1;
       setDepth(nextDepth);
       addLog(`⬆️ FLOOR UP! Ascending to Floor ${nextDepth}...`);
       spawnNewEnemy(nextDepth);
    } else {
       setKillsInFloor(newKills);
       spawnNewEnemy(depth);
    }
  };

  const processBossHit = async (dmg, isCrit) => {
    const p = playerRef.current || player;
    const newTotal = (p.totalBossDamage || 0) + dmg;
    let nextRecipes = [...p.recipes];
    if (Math.random() < BOSS.recipeDropChance) {
      const randomRecipe = CRYSTLE_RECIPES[Math.floor(Math.random() * CRYSTLE_RECIPES.length)];
      if (!nextRecipes.includes(randomRecipe.id)) { nextRecipes.push(randomRecipe.id); addLog(`BOSS DROP: ${randomRecipe.name}!`); }
    }
    syncPlayer({ totalBossDamage: newTotal, recipes: nextRecipes });
    try {
      const identifier = user.email || user.uid;
      const lbRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', identifier);
      await setDoc(lbRef, { uid: identifier, email: user.email || '', name: p.name, score: newTotal, level: player.level });
    } catch (e) { }
    enemyTurn(BOSS, true);
  };

  const allocateStat = (statName) => {
    if ((player.abilityPoints || 0) <= 0) return;
    const newBase = { ...player.baseStats };
    newBase[statName] = (newBase[statName] || 0) + 1;
    syncPlayer({ baseStats: newBase, abilityPoints: player.abilityPoints - 1 });
  };

  const buyItem = (item) => {
    if (player.tokens < item.cost) return addLog("Out of GX!");
    if (player.level < (item.reqLvl || 1)) return addLog(`Requires Level ${item.reqLvl}!`);
    
    if (item.id === 'hp_potion') syncPlayer({ tokens: player.tokens - item.cost, potions: (player.potions || 0) + 1 });
    else if (item.id === 'auto_scroll') syncPlayer({ tokens: player.tokens - item.cost, autoScrolls: (player.autoScrolls || 0) + 1 });
    else syncPlayer({ tokens: player.tokens - item.cost, equipped: { ...player.equipped, [item.type]: item } });
  };

  const forgeCrystle = (recipe) => {
    if (player.tokens < recipe.cost) return addLog("Need more tokens!");
    syncPlayer({ tokens: player.tokens - recipe.cost, equipped: { ...player.equipped, [recipe.type]: recipe }, inventory: [...(player.inventory || []), recipe.id] });
  };

  if (loading) return <LoadingScreen />;

  if (!user || !player) {
    return <LoginView handleGoogleLogin={handleGoogleLogin} />;
  }

  const totalStats = calculateTotalStats();
  const isPenalized = penaltyRemaining > 0;
  const isStunned = stunTimeLeft > 0;
  const isMissed = missTimeLeft > 0;
  const isAutoActive = autoTimeLeft > 0;
  const currentMate = TAVERN_MATES.find(m => m.id === player.hiredMate);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden transition-colors`}>

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

      <nav className="bg-slate-900 border-b-[4px] border-black sticky top-0 z-50 p-4 shadow-xl relative overflow-hidden">
        {/* Halftone Overlay HUD */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '6px 6px' }}></div>
        
        {player.avatar && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover opacity-60 blur-[1px] scale-105 transition-all" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-slate-950/90"></div>
          </div>
        )}
        <div className="max-w-4xl mx-auto flex gap-6 relative z-10 items-stretch">
          <button onClick={() => setView('avatars')} className="w-24 min-h-[140px] bg-cyan-600 rounded-xl flex items-center justify-center border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden hover:scale-105 transition-all duration-300 group relative shrink-0">
            {player.avatar ? <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover group-hover:rotate-3 group-hover:scale-110 transition-transform duration-500" /> : <User size={36} className="text-white" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute bottom-1 w-full text-center text-[7px] font-black uppercase text-white tracking-widest bg-black/40 py-0.5">Edit</div>
          </button>

          <div className="flex flex-col justify-between flex-1 py-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex flex-col justify-center transform -rotate-1">
                <div className="bg-white text-black px-3 py-1 border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] inline-block">
                  <h1 className="font-black text-xl uppercase tracking-tighter leading-none truncate">{player.name}</h1>
                </div>
                <div className="flex items-center gap-2 mt-3 pl-1">
                  <p className="text-[10px] font-black text-cyan-400 bg-black px-2 py-0.5 border border-cyan-400/50 uppercase tracking-widest italic">LVL {player.level}</p>
                  {player.abilityPoints > 0 && <span className="text-[8px] bg-amber-400 text-black px-1.5 py-0.5 rounded-sm shadow-sm font-black border-2 border-black animate-pulse">+{player.abilityPoints} AP</span>}
                  {currentMate && <span className="text-[8px] bg-purple-600 text-white px-1.5 py-0.5 rounded-sm shadow-sm font-black uppercase tracking-widest border-2 border-black">{currentMate.name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm font-black mt-1 shrink-0">
                <div className="flex items-center gap-1.5 text-black bg-cyan-400 border-[3px] border-black px-3 py-1 shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-1">
                  <Coins size={14} strokeWidth={3} /> {player.tokens.toLocaleString()}
                </div>
                
                {/* Consumable Quick Slots */}
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1.5 bg-red-600 text-white border-[3px] border-black px-2 py-1 shadow-[3px_3px_0_rgba(0,0,0,1)] transform -rotate-1 relative group" title="Health Potions">
                      <Coffee size={12} strokeWidth={3} />
                      <span className="text-xs leading-none">{player.potions || 0}</span>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border border-black animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="flex items-center gap-1.5 bg-blue-600 text-white border-[3px] border-black px-2 py-1 shadow-[3px_3px_0_rgba(0,0,0,1)] transform rotate-1 relative group" title="Auto-Hunt Scrolls">
                      <MousePointer size={12} strokeWidth={3} />
                      <span className="text-xs leading-none">{player.autoScrolls || 0}</span>
                   </div>
                </div>

                <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 transition-colors p-2 bg-black/40 rounded-lg border border-slate-700 ml-1" title="Logout"><Lock size={14} /></button>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full mt-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] font-black tracking-widest uppercase w-12 shrink-0">
                  <Heart size={10} strokeWidth={3} className={player.hp / player.maxHp <= 0.25 ? "text-red-500 animate-pulse" : "text-white"} />
                  <span className={player.hp / player.maxHp <= 0.25 ? "text-red-500" : "text-white"}>{player.hp}</span>
                </div>
                <div className="flex-1 h-3 bg-black rounded-sm border-[3px] border-white/20 p-0.5 relative overflow-hidden shadow-inner">
                  <div
                    className={`h-full transition-all duration-300 rounded-sm relative z-10 ${player.hp / player.maxHp <= 0.25 ? 'bg-red-500' : player.hp / player.maxHp <= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                  <div className="absolute inset-0 z-20 pointer-events-none opacity-50" style={{ backgroundImage: 'linear-gradient(90deg, transparent 95%, rgba(0,0,0,0.8) 95%)', backgroundSize: '5% 100%' }}></div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] font-black tracking-widest uppercase w-12 shrink-0 text-cyan-400">
                  <Star size={10} strokeWidth={3} />
                  <span>{player.xp}</span>
                </div>
                <div className="flex-1 h-3 bg-black rounded-sm border-[3px] border-white/20 p-0.5 relative overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 rounded-sm relative z-10 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    style={{ width: `${Math.min(100, (player.xp / (player.level * XP_BASE)) * 100)}%` }} 
                  />
                  <div className="absolute inset-0 z-20 pointer-events-none opacity-50" style={{ backgroundImage: 'linear-gradient(90deg, transparent 95%, rgba(0,0,0,0.8) 95%)', backgroundSize: '5% 100%' }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 mt-4">
               {[
                 { label: 'Head', key: 'Headgear', color: 'text-blue-400' },
                 { label: 'Weapon', key: 'Weapon', color: 'text-amber-400' },
                 { label: 'Armor', key: 'Armor', color: 'text-cyan-400' },
                 { label: 'Feet', key: 'Footwear', color: 'text-emerald-400' },
                 { label: 'Relic', key: 'Relic', color: 'text-purple-400' }
               ].map(slot => (
                 <div key={slot.key} className="bg-slate-900 border-[2px] border-black p-1 flex flex-col items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-slate-800 transition-colors min-w-0">
                    <span className="text-[6px] text-slate-500 font-black uppercase tracking-tighter leading-none mb-1">{slot.label}</span>
                    <span className={`text-[7px] font-black leading-none truncate w-full text-center tracking-tighter uppercase ${player.equipped?.[slot.key] ? slot.color : 'text-slate-600'}`}>
                      {player.equipped?.[slot.key] ? player.equipped[slot.key].name : 'EMPTY'}
                    </span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 space-y-6">

        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={<Sword size={16} />} label="STR" value={totalStats.str} color="text-red-400" desc="Boosts raw damage output" isBuffed={buffTimeLeft > 0 && currentMate?.type === 'STR'} />
          <StatTile icon={<Wind size={16} />} label="AGI" value={totalStats.agi} color="text-emerald-400" desc="Mitigates enemy damage" isBuffed={buffTimeLeft > 0 && currentMate?.type === 'AGI'} />
          <StatTile icon={<Target size={16} />} label="DEX" value={totalStats.dex} color="text-yellow-400" desc="Increases hit accuracy" isBuffed={buffTimeLeft > 0 && currentMate?.type === 'DEX'} />
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl min-h-[460px] flex flex-col overflow-hidden backdrop-blur-sm relative">

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
              setView={setView} 
              syncPlayer={syncPlayer} 
              setDepth={setDepth} 
              selectedMap={selectedMap}
              autoUseScroll={autoUseScroll}
              setAutoUseScroll={setAutoUseScroll}
              killsInFloor={killsInFloor}
              LOOTS={LOOTS}
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
              setView={setView} 
              syncPlayer={syncPlayer} 
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
            />
          )}

          {view === 'database' && (
            <DatabaseView 
              depth={depth} 
              setView={setView} 
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
        </div>

        <div className="bg-amber-400 border-[4px] border-black rounded-lg p-4 h-36 overflow-y-auto relative shadow-[6px_6px_0_rgba(0,0,0,1)] transform rotate-1">
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
