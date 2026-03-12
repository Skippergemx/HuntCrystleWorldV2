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

// --- Game Balance Constants ---
const XP_BASE = 100;
const DIFFICULTY_MULTIPLIER = 2.0;
const BASE_CRIT_CHANCE = 0.10;
const CRIT_SCALING_PER_FLOOR = 0.01;
const MAX_CRIT_CHANCE = 0.60;
const PENALTY_DURATION = 20000;
const STUN_DURATION_NORMAL = 3000;
const STUN_DURATION_CRIT = 5000;
const DEFEAT_WINDOW_DURATION = 3000;
const AP_PER_LEVEL = 5;
const AUTO_SCROLL_DURATION = 60000;
const COMPANION_BUFF_DURATION = 20000; // 20 seconds

import MONSTERS from './data/monsters.json';
import EQUIPMENT from './data/equipment.json';

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

const TAVERN_MATES = [
  { id: 'elf', name: 'Elf Scout', cost: 500, type: 'AGI', desc: '50% chance to double Agility for 20s.' },
  { id: 'dwarf', name: 'Dwarf Warrior', cost: 500, type: 'STR', desc: '50% chance to double Strength for 20s.' },
  { id: 'dragon', name: 'Baby Dragon', cost: 1000, type: 'DEX', desc: '50% chance to double Dexterity for 20s.' },
];

const SHOP_ITEMS = [
  { id: 'hp_potion', name: 'Healing Potion', cost: 50, reqLvl: 1, type: 'Consumable', desc: "Restores 50% Max HP." },
  { id: 'auto_scroll', name: 'Auto-Hunt Scroll', cost: 300, reqLvl: 1, type: 'Consumable', desc: "1 min Auto Pilot." },
  ...EQUIPMENT
];

const CRYSTLE_RECIPES = [
  { id: 'ruby_pendant', name: 'Ruby Heart Pendant', cost: 800, stats: { str: 20, dex: 15, agi: 15 }, type: 'Relic', img: '💍' },
  { id: 'emerald_blade', name: 'Emerald Wind-Slayer', cost: 2500, stats: { str: 60, dex: 40, agi: 20 }, type: 'Weapon', img: '🗡️' },
  { id: 'sapphire_plate', name: 'Sapphire Aegis', cost: 4000, stats: { str: 15, dex: 15, agi: 60 }, type: 'Armor', img: '🛡️' },
];

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('menu');
  const [player, setPlayer] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [depth, setDepth] = useState(1);
  const [leaderboard, setLeaderboard] = useState([]);
  const [logs, setLogs] = useState(["Synchronizing with hunt.crystle.world..."]);
  const [loading, setLoading] = useState(true);
  const [isHurt, setIsHurt] = useState(false);
  const [critAlert, setCritAlert] = useState(false);
  const [stunTimeLeft, setStunTimeLeft] = useState(0);
  const [penaltyRemaining, setPenaltyRemaining] = useState(0);
  const [showDefeatedWindow, setShowDefeatedWindow] = useState(false);
  const [autoTimeLeft, setAutoTimeLeft] = useState(0);
  const [buffTimeLeft, setBuffTimeLeft] = useState(0);
  const [currentTaunt, setCurrentTaunt] = useState("");
  const [missTimeLeft, setMissTimeLeft] = useState(0);
  const [enemyFlinch, setEnemyFlinch] = useState(false);
  const [impactSplash, setImpactSplash] = useState(null);

  const playerRef = useRef(null);
  const enemyRef = useRef(null);
  const stunRef = useRef(0);
  const missRef = useRef(0);

  useEffect(() => {
    playerRef.current = player;
    enemyRef.current = enemy;
    stunRef.current = stunTimeLeft;
    missRef.current = missTimeLeft;
  }, [player, enemy, stunTimeLeft, missTimeLeft]);

  const triggerHitEffects = (dmg, isCrit) => {
    // 1. Impact Splash
    const impactWords = ["BAM!", "POW!", "WHACK!", "SMASH!", "KABOOM!", "ZAP!", "SLAM!"];
    const word = impactWords[Math.floor(Math.random() * impactWords.length)];
    const id = Date.now();
    setImpactSplash({ text: word, dmg, isCrit, id });
    setTimeout(() => setImpactSplash(prev => (prev?.id === id ? null : prev)), 400);

    // 2. Flinch
    setEnemyFlinch(true);
    setTimeout(() => setEnemyFlinch(false), 150);
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('menu');
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current?.penaltyUntil) {
        const diff = Math.ceil((playerRef.current.penaltyUntil - Date.now()) / 1000);
        setPenaltyRemaining(diff > 0 ? diff : 0);
      }
      setStunTimeLeft(prev => Math.max(0, prev - 0.1));
      setMissTimeLeft(prev => Math.max(0, prev - 0.1));
      if (playerRef.current?.autoUntil) {
        const diff = Math.ceil((playerRef.current.autoUntil - Date.now()) / 1000);
        setAutoTimeLeft(diff > 0 ? diff : 0);
      }
      if (playerRef.current?.buffUntil) {
        const diff = Math.ceil((playerRef.current.buffUntil - Date.now()) / 1000);
        setBuffTimeLeft(diff > 0 ? diff : 0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let autoLoop;
    if ((view === 'dungeon' || view === 'boss') && autoTimeLeft > 0 && !showDefeatedWindow) {
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
  }, [view, autoTimeLeft > 0, showDefeatedWindow]);

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
          penaltyUntil: 0
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
    if (!player) return { str: 0, agi: 0, dex: 0 };
    const stats = { ...player.baseStats };
    Object.values(player.equipped).forEach(item => {
      stats.str += item.stats?.str || 0;
      stats.agi += item.stats?.agi || 0;
      stats.dex += item.stats?.dex || 0;
    });

    // APPLY MATE BUFFS
    if (buffTimeLeft > 0 && player.hiredMate) {
      const mate = TAVERN_MATES.find(m => m.id === player.hiredMate);
      if (mate.type === 'STR') stats.str *= 2;
      if (mate.type === 'AGI') stats.agi *= 2;
      if (mate.type === 'DEX') stats.dex *= 2;
    }

    return stats;
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
    syncPlayer({ autoUntil: (player.autoUntil > now ? player.autoUntil : now) + AUTO_SCROLL_DURATION, autoScrolls: player.autoScrolls - 1 });
  };

  const hireMate = (mate) => {
    if (player.tokens < mate.cost) return addLog("Out of GX!");
    syncPlayer({ tokens: player.tokens - mate.cost, hiredMate: mate.id });
    addLog(`Contract signed: ${mate.name} joined!`);
  };

  const spawnNewEnemy = (currentDepth = 1) => {
    const base = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
    const powerMultiplier = Math.pow(DIFFICULTY_MULTIPLIER, currentDepth - 1);
    const accuracyMultiplier = 1 + ((currentDepth - 1) * 0.15);
    const scaledEnemy = {
      ...base,
      hp: Math.floor(base.hp * powerMultiplier),
      maxHp: Math.floor(base.hp * powerMultiplier),
      str: Math.floor(base.str * powerMultiplier),
      agi: Math.floor(base.agi * accuracyMultiplier),
      xp: Math.floor(base.xp * powerMultiplier),
      loot: Math.floor(base.loot * powerMultiplier),
      critChance: Math.min(MAX_CRIT_CHANCE, BASE_CRIT_CHANCE + ((currentDepth - 1) * CRIT_SCALING_PER_FLOOR)),
      powerLevel: powerMultiplier
    };
    setEnemy(scaledEnemy);
  };

  const handleAttack = (isBoss = false) => {
    const p = playerRef.current || player;
    const e = enemyRef.current || enemy;
    if (stunRef.current > 0 || missRef.current > 0 || showDefeatedWindow || !e) return;

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
        const newHp = target.hp - dmg;
        if (newHp <= 0) processKill();
        else { setEnemy(prev => ({ ...prev, hp: newHp })); enemyTurn(target, isBoss); }
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
      setIsHurt(true); setTimeout(() => setIsHurt(false), 300);

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
    syncPlayer({ tokens: p.tokens + e.loot, xp: nextXp, level: nextLvl, maxHp: nextMaxHp, hp: Math.min(nextMaxHp, p.hp + 25), abilityPoints: nextAP });
    const newDepth = depth + 1; setDepth(newDepth); spawnNewEnemy(newDepth);
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

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-500 font-mono uppercase tracking-widest text-xl animate-pulse">CONNECTING TO CRYSTLE NETWORK...</div>;

  if (!user || !player) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans p-4">
        <div className="text-center p-8 border border-cyan-500/20 bg-slate-900/50 rounded-3xl max-w-sm w-full shadow-2xl backdrop-blur-sm">
          <Sword size={48} className="text-cyan-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Crystle Hunter</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">World v2</p>
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-slate-200 transition-colors py-4 rounded-xl font-black shadow-lg"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
            SIGN IN WITH GOOGLE
          </button>
        </div>
        <p className="mt-8 text-[10px] text-slate-700 font-black uppercase tracking-[0.5em]">hunt.crystle.world</p>
      </div>
    );
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
            <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-3 gap-6 relative">
              {/* Halftone Overlay HUD */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
              <NavBtn onClick={() => { if (!isPenalized) { setView('dungeon'); setDepth(1); spawnNewEnemy(1); } }} icon={isPenalized ? <Clock className="animate-pulse" /> : <MapIcon />} title="Dungeon" sub={isPenalized ? `Wait ${penaltyRemaining}s` : "Battle"} color={isPenalized ? "bg-slate-800 grayscale" : "bg-cyan-600"} disabled={isPenalized} />
              <NavBtn onClick={() => setView('tavern')} icon={<Beer />} title="Tavern" sub="Hire Mates" color="bg-amber-700" />
              <NavBtn onClick={() => setView('attributes')} icon={<Activity />} title="Attributes" sub={`${player.abilityPoints || 0} pts`} color="bg-orange-600" />
              <NavBtn onClick={() => setView('inventory')} icon={<Package />} title="Bag" sub="Inventory" color="bg-emerald-600" />
              <NavBtn onClick={() => setView('shop')} icon={<ShoppingBag />} title="Shop" sub="Items" color="bg-slate-700" />
              <NavBtn onClick={() => setView('forge')} icon={<Hammer />} title="Forge" sub="Relics" color="bg-amber-600" />
              <NavBtn onClick={() => setView('database')} icon={<Book />} title="Archives" sub="Database" color="bg-blue-600" />
              <NavBtn onClick={() => setView('leaderboard')} icon={<Globe />} title="Ranking" sub="Global" color="bg-purple-600" />
              <NavBtn onClick={() => { if (!isPenalized) setView('boss'); }} icon={<AlertCircle />} title="Dungeon Core" sub="Boss" color="bg-red-700" disabled={isPenalized} />
            </div>
          )}

          {view === 'tavern' && (
            <div className="flex-1 p-6 space-y-6 relative overflow-hidden">
               {/* Tavern Halftone Background */}
               <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>

              <Header title="Hero for Hire: Tavern" onClose={() => setView('menu')} />
              
              {player.hiredMate && (
                <div className="bg-purple-950 border-2 border-purple-500 p-2 mb-2 flex items-center justify-between shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Current Contract: Active</span>
                  </div>
                  <span className="text-[8px] font-black text-purple-300 uppercase italic">Slot Occupied</span>
                </div>
              )}

              <div className="grid gap-6 relative z-10">
                {TAVERN_MATES.map((mate, index) => (
                  <div 
                    key={mate.id} 
                    className={`p-5 bg-white border-[4px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] flex justify-between items-center group transition-transform hover:-translate-y-1 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 border-2 border-black flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
                           <User className="text-black" size={20} />
                        </div>
                        <h4 className="font-black text-2xl text-black uppercase tracking-tighter italic">
                          {mate.name}
                        </h4>
                      </div>
                      <div className="bg-slate-100 p-2 border-2 border-black/10">
                        <p className="text-[10px] text-slate-600 font-black uppercase italic leading-tight">{mate.desc}</p>
                      </div>
                      {player.hiredMate === mate.id && (
                        <div className="inline-block bg-purple-600 text-white px-3 py-1 border-2 border-black font-black text-[10px] uppercase tracking-[0.2em] transform -rotate-2 shadow-md">
                          Currently Active
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-3">
                        <div className="bg-amber-100 px-3 py-1 border-2 border-black transform rotate-3">
                           <span className="text-xs font-black text-black">{mate.cost} GX</span>
                        </div>
                        <button 
                          onClick={() => hireMate(mate)} 
                          disabled={!!player.hiredMate} 
                          className={`px-6 py-2 border-[3px] border-black font-black text-sm uppercase tracking-widest transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${player.hiredMate === mate.id ? 'bg-purple-600 text-white border-black' : !!player.hiredMate ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed' : 'bg-amber-400 text-black hover:bg-amber-300'}`}
                        >
                          {player.hiredMate === mate.id ? 'ACTIVE' : !!player.hiredMate ? 'LOCKED' : 'RECRUIT'}
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'attributes' && (
            <div className="flex-1 p-6 space-y-8 flex flex-col items-center justify-start overflow-y-auto relative">
              {/* Cyan Halftone Background */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              
              <Header title="IDENTITY CORE: STATS" onClose={() => setView('menu')} />
              
              <div className="relative z-10 w-full max-w-sm">
                <div className="bg-amber-400 border-[4px] border-black p-8 shadow-[10px_10px_0_rgba(0,0,0,1)] w-full text-center transform -rotate-1 relative mb-12">
                   <div className="absolute -top-4 -left-4 bg-black text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 border-white shadow-md">Memory Bank</div>
                   <p className="text-xs uppercase font-black text-black/60 mb-1 tracking-[0.2em] italic">Available AP</p>
                   <p className="text-7xl font-black text-black italic drop-shadow-[4px_4px_0_rgba(255,255,255,0.3)]">{player.abilityPoints || 0}</p>
                </div>

                <div className="space-y-6">
                  <div className="transform -rotate-1">
                    <AttributeRow label="STRENGTH [STR]" value={player.baseStats.str} onAdd={() => allocateStat('str')} color="text-red-600" disabled={!player.abilityPoints} desc="Unleash raw power to annihilate enemies." />
                  </div>
                  <div className="transform rotate-1">
                    <AttributeRow label="AGILITY [AGI]" value={player.baseStats.agi} onAdd={() => allocateStat('agi')} color="text-emerald-600" disabled={!player.abilityPoints} desc="Evade strikes and outpace your foes." />
                  </div>
                  <div className="transform -rotate-1">
                    <AttributeRow label="DEXTERITY [DEX]" value={player.baseStats.dex} onAdd={() => allocateStat('dex')} color="text-amber-600" disabled={!player.abilityPoints} desc="Strike with surgical precision and speed." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'avatars' && (
            <div className="flex-1 p-6 space-y-6 flex flex-col items-center justify-start overflow-y-auto max-h-[600px]">
              <Header title="Identity Core" onClose={() => setView('menu')} />
              <div className="w-full max-w-sm flex flex-col items-center">

                <div className="w-40 h-56 mb-4 rounded-2xl border-[3px] border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] overflow-hidden relative group">
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none"></div>
                  {player.avatar ? <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover relative z-0" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={48} className="text-slate-500" /></div>}
                  <p className="absolute bottom-3 inset-x-0 text-center text-[10px] font-black tracking-[0.4em] uppercase text-cyan-400 z-20 drop-shadow-md">Active</p>
                </div>

                <div className="flex items-center gap-3 mb-8 bg-slate-800/50 p-2 pr-4 rounded-xl border border-slate-700">
                  <button
                    onClick={() => { syncPlayer({ avatarAnimated: !player.avatarAnimated }); addLog(`Animated mode ${!player.avatarAnimated ? 'enabled' : 'disabled'}.`); }}
                    className={`relative w-10 h-6 rounded-full transition-colors ${player.avatarAnimated ? 'bg-cyan-500' : 'bg-slate-600'}`}
                  >
                    <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${player.avatarAnimated ? 'translate-x-4 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'translate-x-0'}`}></div>
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Animated Mode</span>
                </div>

                <p className="text-[10px] text-slate-500 font-black uppercase text-center mb-4 tracking-widest border-b border-slate-800/50 pb-2 w-full">Select your combat avatar</p>

                <div className="grid grid-cols-4 gap-3 w-full pb-4">
                  {Array.from({ length: 34 }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => { syncPlayer({ avatar: num }); addLog('Avatar updated.'); }}
                      className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${player.avatar === num ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-95 opacity-50' : 'border-slate-800 hover:border-cyan-500 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]'}`}
                    >
                      <img src={`/assets/playeravatar/CrystleHunterAvatar (${num}).jpg`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'dungeon' && enemy && (
            <div className={`flex-1 p-8 flex flex-col items-center justify-center gap-6 animate-in fade-in relative overflow-hidden ${isHurt ? 'animate-damage' : ''}`}>
              {/* Halftone Overlay HUD */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f87171 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
              
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                <div className="flex items-center gap-2 px-3 py-1 bg-black border-[3px] border-cyan-500 rounded-lg shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <TrendingUp size={14} className="text-cyan-400" />
                  <span className="text-xs font-black text-cyan-400 tracking-widest italic">FLOOR {depth}</span>
                </div>
                {buffTimeLeft > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-600 border-[3px] border-black text-white rounded-lg font-black text-[10px] animate-pulse shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    <Sparkles size={10} /> BUFF: {buffTimeLeft}s
                  </div>
                )}
                {isAutoActive && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-cyan-600 border-[3px] border-black text-black rounded-lg font-black text-[10px] animate-pulse shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    <MousePointer size={10} /> AUTO: {autoTimeLeft}s
                  </div>
                )}
              </div>

              <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                <button onClick={handleHeal} disabled={player.potions <= 0} className="flex items-center gap-2 bg-red-600 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-red-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 group">
                  <Coffee size={16} className="text-white group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col items-start">
                    <span className="text-[7px] font-black uppercase tracking-widest text-white/70 leading-none italic">Heal</span>
                    <span className="text-xs font-black leading-none text-white italic">{player.potions || 0} POTS</span>
                  </div>
                </button>
                {player.autoScrolls > 0 && !isAutoActive && (
                  <button onClick={activateAutoScroll} className="flex items-center gap-2 bg-cyan-600 border-[3px] border-black px-3 py-2 rounded-xl hover:bg-cyan-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
                    <MousePointer size={16} className="text-black" />
                    <span className="text-xs font-black text-black">USE AUTO</span>
                  </button>
                )}
              </div>

              <div className={`w-40 h-40 bg-slate-900 flex items-center justify-center border-[6px] border-black shadow-[10px_10px_0_rgba(0,0,0,1)] overflow-hidden relative group transform -rotate-1 ${enemyFlinch ? 'animate-flinch' : ''}`}>
                {/* Panel Splash */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#450a0a_0%,transparent_70%)] opacity-50"></div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f87171 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                <img
                  src={`/assets/monsters/${enemy.name}.png`}
                  alt={enemy.name}
                  className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ghost"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>';
                  }}
                />
                
                {impactSplash && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="animate-impact relative">
                      <div className="absolute inset-0 bg-amber-500 blur-xl opacity-50 scale-150"></div>
                      <div className="bg-amber-500 text-black font-black text-xl px-4 py-1 rounded-sm border-2 border-black transform -rotate-12 shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        {impactSplash.text}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white text-black font-black text-xs px-2 py-0.5 rounded-sm border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        -{impactSplash.dmg}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-center relative">
                <div className="bg-red-600 text-white px-6 py-2 border-[4px] border-black transform rotate-1 shadow-[6px_6px_0_rgba(0,0,0,1)] inline-block mb-4">
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic">{enemy.name}</h2>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex flex-col items-center bg-black border-2 border-slate-700 px-3 py-1 rounded-sm shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    <span className="text-[8px] text-red-500 font-black uppercase italic">STR</span>
                    <span className="text-xs font-black text-white italic">{enemy.str}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black border-2 border-slate-700 px-3 py-1 rounded-sm shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    <span className="text-[8px] text-emerald-500 font-black uppercase italic">AGI</span>
                    <span className="text-xs font-black text-white italic">{enemy.agi}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black border-2 border-slate-700 px-3 py-1 rounded-sm shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    <span className="text-[8px] text-yellow-500 font-black uppercase italic">DEX</span>
                    <span className="text-xs font-black text-white italic">{enemy.dex}</span>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-sm space-y-3">
                <div className="h-5 bg-black border-[3px] border-white/20 p-1 relative shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden">
                  <div className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.5)] relative z-10" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                  <div className="absolute inset-0 z-20 pointer-events-none opacity-50" style={{ backgroundImage: 'linear-gradient(90deg, transparent 95%, rgba(0,0,0,0.8) 95%)', backgroundSize: '5% 100%' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center z-30">
                    <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">Enemy Energy</p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                  <p className="text-[10px] font-black text-cyan-400 italic">XP +{enemy.xp}</p>
                  <p className="text-[10px] font-black text-white italic">{enemy.hp.toLocaleString()} / {enemy.maxHp.toLocaleString()} HP</p>
                  <p className="text-[10px] font-black text-amber-400 italic">GX +{enemy.loot}</p>
                </div>
              </div>

              <div className="w-full max-w-sm">
                <div className="flex justify-between items-end mb-1 px-1">
                  <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Your Core Status</span>
                  <span className="text-[10px] font-black text-white opacity-50 italic">{player.hp} / {player.maxHp}</span>
                </div>
                <div className="w-full h-4 bg-black border-[3px] border-white/20 p-0.5 relative shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 relative z-10 ${player.hp / player.maxHp <= 0.25 ? 'bg-red-500 animate-pulse' : player.hp / player.maxHp <= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                  <div className="absolute inset-0 z-20 pointer-events-none opacity-50" style={{ backgroundImage: 'linear-gradient(90deg, transparent 95%, rgba(0,0,0,0.8) 95%)', backgroundSize: '5% 100%' }}></div>
                </div>
              </div>

              <div className="flex gap-3 w-full max-w-sm pt-4 relative">

                {isStunned && (
                  <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-2xl border-[3px] border-red-500 p-2 shadow-[0_0_30px_rgba(239,68,68,0.5)] z-20 animate-in slide-in-from-bottom flex flex-col justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.3),transparent_60%)] pointer-events-none"></div>
                    <div className="flex gap-3 items-center w-full relative z-10">
                      <div className="w-16 h-16 shrink-0 bg-red-950 rounded-full border-2 border-red-500 flex items-center justify-center overflow-hidden shadow-inner transform -rotate-6">
                        {enemy?.name ? (
                          <img
                            src={`/assets/monsters/${enemy.name}.png`}
                            alt={enemy.name}
                            className="w-full h-full object-cover scale-150 origin-top"
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <Skull size={32} className="text-red-500 absolute" />
                        )}
                      </div>
                      <div className="flex-1 bg-white text-black p-2 px-3 rounded-2xl rounded-bl-sm relative shadow-md border-2 border-black transform rotate-1">
                        <p className="font-black text-[11px] sm:text-xs uppercase leading-tight line-clamp-2">"{currentTaunt}"</p>
                        <div className="absolute -bottom-2 -left-1 w-4 h-4 bg-white border-b-2 border-l-2 border-black transform rotate-[30deg]"></div>
                      </div>
                      <div className="w-12 h-12 shrink-0 bg-red-600 border-[3px] border-black rounded-full flex flex-col items-center justify-center shadow-lg transform rotate-[15deg] mr-1">
                         <span className="text-lg font-black text-white leading-none">{Math.ceil(stunTimeLeft)}</span>
                         <span className="text-[8px] font-black uppercase text-black leading-none">sec</span>
                      </div>
                    </div>
                  </div>
                )}

                {isMissed && !isStunned && (
                  <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-2xl border-[3px] border-slate-500 p-2 shadow-[0_0_30px_rgba(100,116,139,0.5)] z-20 animate-in slide-in-from-bottom flex flex-col justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(100,116,139,0.3),transparent_60%)] pointer-events-none"></div>
                    <div className="flex gap-3 items-center w-full relative z-10 justify-center">
                      <div className="w-12 h-12 shrink-0 bg-slate-800 rounded-full border-2 border-slate-500 flex items-center justify-center shadow-inner transform rotate-6">
                        <User size={24} className="text-slate-400 opacity-50 absolute" />
                        <X size={32} className="text-white relative z-10" />
                      </div>
                      <div className="flex-1 max-w-[150px] bg-slate-300 text-black p-2 rounded-2xl rounded-bl-sm relative shadow-md border-2 border-black transform -rotate-1">
                         <p className="font-black text-xs uppercase text-center w-full">Missed Target!</p>
                      </div>
                      <div className="w-12 h-12 shrink-0 bg-slate-600 border-[3px] border-black rounded-full flex flex-col items-center justify-center shadow-lg transform -rotate-6 mr-1">
                         <span className="text-lg font-black text-white leading-none">{missTimeLeft.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => handleAttack()} 
                  disabled={isStunned || isMissed || showDefeatedWindow} 
                  className={`flex-1 py-5 rounded-2xl font-black text-2xl shadow-[8px_8px_0_rgba(0,0,0,1)] border-[4px] border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0_rgba(0,0,0,1)] italic flex items-center justify-center gap-2 ${(isStunned || isMissed) ? 'opacity-0 pointer-events-none' : 'bg-red-600 text-white'} ${isAutoActive && !(isStunned || isMissed) ? 'animate-pulse' : ''}`}
                >
                  {isAutoActive ? 'AUTO-STRIKING' : 'STRIKE'}
                </button>
                <button 
                  onClick={() => { setView('menu'); setDepth(1); if (player.autoUntil > 0) syncPlayer({ autoUntil: 0 }); }} 
                  disabled={isStunned || isMissed} 
                  className={`px-8 py-5 rounded-2xl font-black uppercase tracking-widest border-[4px] border-black transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic ${(isStunned || isMissed) ? 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : 'bg-slate-300 text-black hover:bg-white'}`}
                >
                  EXIT
                </button>
              </div>
            </div>
          )}

          {view === 'shop' && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[500px] relative">
              {/* Shop Halftone Background */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
              
              <Header title="GX Exchange: Shop" onClose={() => setView('menu')} />
              
              <div className="grid gap-6 relative z-10">
                {SHOP_ITEMS.map((item, index) => {
                  const isOwned = item.type !== 'Consumable' && player.equipped?.[item.type]?.id === item.id;
                  const isLocked = player.level < (item.reqLvl || 1);
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`p-5 bg-white border-[4px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] flex justify-between items-center group transition-transform hover:-translate-y-1 ${index % 2 === 0 ? '-rotate-1' : 'rotate-1'} ${isOwned || isLocked ? 'opacity-70' : ''}`}
                    >
                      <div className="flex gap-4 items-center">
                      <div className={`w-12 h-12 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] ${isOwned || isLocked ? 'bg-slate-400 grayscale' : item.type === 'Weapon' ? 'bg-red-500' : item.type === 'Armor' ? 'bg-cyan-500' : item.type === 'Headgear' ? 'bg-blue-500' : item.type === 'Footwear' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                          {isOwned || isLocked ? <Lock size={24} className="text-white" /> : (
                            item.type === 'Weapon' ? <Sword size={24} className="text-white" /> : 
                            item.type === 'Armor' ? <Shield size={24} className="text-white" /> : 
                            item.type === 'Headgear' ? <HardHat size={24} className="text-white" /> : 
                            item.type === 'Footwear' ? <Footprints size={24} className="text-white" /> : 
                            <Package size={24} className="text-white" />
                          )}
                        </div>
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-xl text-black uppercase tracking-tighter italic leading-none">{item.name}</h4>
                            {isLocked && <span className="text-[7px] bg-red-600 text-white px-1 font-black transform rotate-6 border border-black shadow-sm tracking-tighter">LVL {item.reqLvl} REQ</span>}
                          </div>
                          <div className="bg-slate-100 px-2 py-1 border border-black/10 inline-block">
                             <p className="text-[9px] text-slate-500 font-black uppercase italic leading-none">
                               {item.desc || Object.entries(item.stats || {}).map(([k, v]) => `${k} +${v}`).join(' ')}
                               {item.type !== 'Consumable' && ` • REQ LVL ${item.reqLvl}`}
                               {item.id === 'hp_potion' && ` • STASHED: ${player.potions || 0}`}
                               {item.id === 'auto_scroll' && ` • STASHED: ${player.autoScrolls || 0}`}
                             </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        <div className={`bg-amber-100 px-3 py-1 border-2 border-black transform rotate-3 relative shadow-sm ${isOwned || isLocked ? 'grayscale opacity-50' : ''}`}>
                           <span className="text-xs font-black text-black">{item.cost} GX</span>
                           {!isOwned && !isLocked && <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[6px] font-black px-1 border border-black transform -rotate-12">NEW!</div>}
                        </div>
                        <button 
                          onClick={() => buyItem(item)} 
                          disabled={isOwned || isLocked}
                          className={`px-6 py-2 border-[3px] border-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${isOwned || isLocked ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed' : 'bg-cyan-400 text-black hover:bg-cyan-300 hover:scale-105 active:scale-95'}`}
                        >
                          {isOwned ? 'OWNED' : isLocked ? 'LOCKED' : item.type === 'Consumable' ? 'STOCK UP' : 'BUY NOW'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'forge' && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[500px] relative">
               {/* Forge Halftone Background */}
               <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
               
              <Header title="Identity Lab: Forge" onClose={() => setView('menu')} />
              <div className="grid gap-6 relative z-10">
                {CRYSTLE_RECIPES.map((recipe, index) => {
                  const hasRecipe = player.recipes?.includes(recipe.id);
                  const isOwned = player.equipped?.[recipe.type]?.id === recipe.id;
                  
                  return (
                    <div 
                      key={recipe.id} 
                      className={`p-5 bg-white border-[4px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] flex justify-between items-center group transition-transform hover:-translate-y-1 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${!hasRecipe ? 'opacity-40 grayscale' : ''}`}
                    >
                      <div className="flex gap-4 items-center">
                        <div className={`w-14 h-14 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] bg-amber-500 transform -rotate-3`}>
                           {hasRecipe ? <span className="text-3xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">{recipe.img}</span> : <Lock size={24} className="text-black/40" />}
                        </div>
                        <div className="space-y-1 text-left">
                          <h4 className="font-black text-xl text-black uppercase tracking-tighter italic leading-none">
                            {hasRecipe ? recipe.name : 'Unknown Schematic'}
                          </h4>
                          <div className="bg-amber-100/50 px-2 py-0.5 border border-black/10 inline-block">
                             <div className="flex gap-2 text-[9px] font-black uppercase text-amber-900/60 italic">
                                {Object.entries(recipe.stats).map(([k, v]) => <span key={k}>{k}+{v}</span>)}
                             </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        <div className={`bg-slate-900 text-white px-3 py-1 border-2 border-black transform rotate-3 relative shadow-sm ${!hasRecipe || isOwned ? 'opacity-30' : ''}`}>
                           <span className="text-xs font-black italic">{recipe.cost} GX</span>
                        </div>
                        <button 
                          onClick={() => forgeCrystle(recipe)} 
                          disabled={!hasRecipe || isOwned} 
                          className={`px-6 py-2 border-[3px] border-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${!hasRecipe ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none' : isOwned ? 'bg-emerald-500 text-white border-black' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
                        >
                          {!hasRecipe ? 'LOCKED' : isOwned ? 'ACTIVE' : 'FORGE'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'boss' && (
            <div className={`flex-1 p-8 flex flex-col items-center justify-center gap-6 text-center relative overflow-hidden ${isHurt ? 'animate-damage' : ''}`}>
              {/* Halftone Overlay HUD */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
              
              <div className={`relative ${enemyFlinch ? 'animate-flinch' : ''}`}>
                <div className="bg-black/40 p-12 rounded-full border-[8px] border-red-600 shadow-[0_0_60px_rgba(239,68,68,0.4)] relative">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ef4444_0%,transparent_70%)] opacity-20 animate-pulse"></div>
                   <Skull size={96} className="text-red-500 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                </div>
                
                {impactSplash && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none scale-[2.0]">
                    <div className="animate-impact relative">
                      <div className="absolute inset-0 bg-red-600 blur-xl opacity-50 scale-150"></div>
                      <div className="bg-red-600 text-white font-black text-2xl px-6 py-2 rounded-sm border-[4px] border-black transform -rotate-12 shadow-[8px_8px_0_rgba(0,0,0,1)]">
                        {impactSplash.text}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white text-black font-black text-sm px-3 py-1 rounded-sm border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        -{impactSplash.dmg}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative transform rotate-1">
                <div className="bg-red-600 text-white px-8 py-3 border-[6px] border-black shadow-[10px_10px_0_rgba(0,0,0,1)] inline-block">
                   <h2 className="text-6xl font-black uppercase tracking-tighter italic drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]">{BOSS.name}</h2>
                </div>
                <div className="absolute -top-3 -right-4 bg-black text-red-500 px-3 py-1 text-xs font-black border-[3px] border-red-500 transform rotate-6 shadow-lg">
                   LEVEL: Ω
                </div>
              </div>

              <div className="w-full max-w-lg space-y-4">
                <div className="h-8 bg-black border-[4px] border-white/20 p-1.5 relative shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden">
                  <div className="h-full bg-red-600 transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.5)]" style={{ width: `${(BOSS.hp / BOSS.hp) * 100}%` }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] drop-shadow-md">Core Integrity: Stable</p>
                  </div>
                </div>
                
                <div className="bg-slate-900/80 backdrop-blur-md border-[4px] border-black p-4 rounded-xl flex justify-between items-center shadow-[6px_6px_0_rgba(0,0,0,1)] gap-4">
                   <div className="text-left flex-1">
                      <p className="text-[10px] font-black text-red-400 uppercase italic">Boss Damage Dealt</p>
                      <p className="text-3xl font-black text-white italic drop-shadow-md">{(player.totalBossDamage || 0).toLocaleString()}</p>
                   </div>
                   <div className="flex gap-2">
                     {player.autoScrolls > 0 && autoTimeLeft <= 0 && (
                       <button onClick={activateAutoScroll} className="flex items-center gap-2 bg-cyan-600 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-cyan-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
                         <MousePointer size={16} className="text-black" />
                         <div className="flex flex-col items-start bg-transparent">
                           <span className="text-[7px] font-black uppercase tracking-widest text-black/70 leading-none italic">Auto</span>
                           <span className="text-xs font-black leading-none text-black italic">{player.autoScrolls} SCROLLS</span>
                         </div>
                       </button>
                     )}
                     {autoTimeLeft > 0 && (
                       <div className="flex items-center gap-2 bg-cyan-600/20 border-[3px] border-cyan-500/50 px-4 py-2 rounded-xl shadow-lg animate-pulse">
                         <MousePointer size={16} className="text-cyan-400" />
                         <div className="flex flex-col items-start bg-transparent">
                           <span className="text-[7px] font-black uppercase tracking-widest text-cyan-400/70 leading-none italic">Active</span>
                           <span className="text-xs font-black leading-none text-cyan-400 italic">{autoTimeLeft}s</span>
                         </div>
                       </div>
                     )}
                     <button onClick={handleHeal} disabled={player.potions <= 0} className="flex items-center gap-2 bg-red-600 border-[3px] border-black px-4 py-2 rounded-xl hover:bg-red-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-30 group">
                       <Coffee size={16} className="text-white group-hover:scale-110 transition-transform" />
                       <div className="flex flex-col items-start bg-transparent">
                         <span className="text-[7px] font-black uppercase tracking-widest text-white/70 leading-none italic">Heal</span>
                         <span className="text-xs font-black leading-none text-white italic">{player.potions || 0} POTS</span>
                       </div>
                     </button>
                   </div>
                </div>
              </div>

              <div className="w-full max-w-lg">
                <div className="flex justify-between items-end mb-1 px-1">
                  <span className="text-[10px] font-black text-white uppercase italic tracking-widest text-left">Your Vital Signs</span>
                  <span className="text-[10px] font-black text-white opacity-50 italic">{player.hp} / {player.maxHp} HP</span>
                </div>
                <div className="w-full h-4 bg-black border-[3px] border-white/20 p-0.5 relative shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${player.hp / player.maxHp <= 0.25 ? 'bg-red-500 animate-pulse' : player.hp / player.maxHp <= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-4 w-full max-w-lg mt-4 relative">
                {isStunned && (
                  <div className="absolute inset-0 bg-red-950/95 backdrop-blur-xl border-[6px] border-black p-4 z-20 flex items-center justify-center shadow-[10px_10px_0_rgba(0,0,0,1)] transform scale-105">
                     <div className="text-center">
                        <p className="text-5xl font-black text-white uppercase italic mb-2 animate-bounce-short drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">CORE BREACH!</p>
                        <p className="text-xs font-black text-red-500 bg-black px-4 py-2 border-2 border-red-500 inline-block uppercase italic">Re-initializing in {Math.ceil(stunTimeLeft)}s</p>
                     </div>
                  </div>
                )}
                
                {isMissed && !isStunned && (
                   <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl border-[6px] border-black p-4 z-20 flex items-center justify-center shadow-[10px_10px_0_rgba(0,0,0,1)] transform scale-105">
                     <div className="text-center">
                        <p className="text-5xl font-black text-white uppercase italic mb-2 animate-bounce-short">MISS!</p>
                        <p className="text-xs font-black text-slate-400 bg-black px-4 py-2 border-2 border-slate-800 inline-block uppercase italic">Target Evasive... {missTimeLeft.toFixed(1)}s</p>
                     </div>
                  </div>
                )}

                <button onClick={() => handleAttack(true)} disabled={isStunned || isMissed || showDefeatedWindow} className={`flex-1 py-6 rounded-2xl font-black text-4xl shadow-[10px_10px_0_rgba(0,0,0,1)] border-[4px] border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[12px_12px_0_rgba(0,0,0,1)] italic ${(isStunned || isMissed) ? 'opacity-0 pointer-events-none' : 'bg-red-600 text-white'}`}>
                  OVERLOAD
                </button>
                <button onClick={() => { setView('menu'); if (player.autoUntil > 0) syncPlayer({ autoUntil: 0 }); }} disabled={isStunned || isMissed} className={`px-10 py-6 rounded-2xl font-black uppercase tracking-widest border-[4px] border-black transition-all shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none italic ${(isStunned || isMissed) ? 'bg-slate-800 text-slate-700 opacity-50 cursor-not-allowed' : 'bg-slate-300 text-black hover:bg-white'}`}>Retreat</button>
              </div>
            </div>
          )}

          {view === 'leaderboard' && (
            <div className="flex-1 p-6 space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
              <Header title="GLOBAL RANKING: ELITE" onClose={() => setView('menu')} />
              <div className="space-y-4 relative z-10 overflow-y-auto max-h-[400px] pr-2">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className={`p-4 border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] flex justify-between items-center transition-all transform ${idx % 2 === 0 ? 'rotate-0.5' : '-rotate-0.5'} ${entry.uid === user.uid ? 'bg-cyan-400' : 'bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 border-[3px] border-black flex items-center justify-center font-black italic shadow-[3px_3px_0_rgba(0,0,0,1)] ${idx === 0 ? 'bg-amber-400 scale-110' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-black text-white'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className={`font-black text-lg uppercase tracking-tighter leading-none italic ${entry.uid === user.uid ? 'text-black' : 'text-black'}`}>{entry.name}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase italic">Level {entry.level} Hunter</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-black italic drop-shadow-sm">{(entry.score || 0).toLocaleString()}</p>
                       <p className="text-[8px] font-black text-black opacity-40 uppercase italic">Total Damage</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'inventory' && (
            <div className="flex-1 p-6 space-y-6 relative overflow-hidden">
               <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
               <Header title="STORAGE CORE: BAG" onClose={() => setView('menu')} />
               <div className="grid grid-cols-2 gap-4 relative z-10">
                 <div className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] transform -rotate-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-red-600 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                         <Coffee size={20} className="text-white" />
                      </div>
                      <span className="text-2xl font-black italic text-black">{player.potions || 0}</span>
                    </div>
                    <p className="text-xs font-black uppercase text-black italic">Potions</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase mt-1 leading-tight italic">Restores vital core integrity.</p>
                 </div>
                 <div className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] transform rotate-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-cyan-600 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                         <MousePointer size={20} className="text-black" />
                      </div>
                      <span className="text-2xl font-black italic text-black">{player.autoScrolls || 0}</span>
                    </div>
                    <p className="text-xs font-black uppercase text-black italic">Auto Scrolls</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase mt-1 leading-tight italic">Automates offensive protocols.</p>
                 </div>
                 
                 <div className="col-span-2 bg-slate-100 border-[4px] border-black p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] mt-4">
                    <p className="text-[10px] font-black uppercase text-black italic opacity-50 mb-3 border-b-2 border-black/10 pb-1">Equipped Gear</p>
                    <div className="space-y-3">
                       {Object.entries(player.equipped || {}).map(([slot, item]) => (
                         <div key={slot} className="flex justify-between items-center text-black italic">
                            <span className="text-[10px] font-black uppercase text-slate-400">{slot}</span>
                            <span className="font-black text-sm uppercase">{item ? item.name : 'Empty Slot'}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               </div>
            </div>
          )}

          {view === 'database' && (
            <div className="flex-1 p-6 space-y-6 relative overflow-hidden">
               <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
               <Header title="ARCHIVES: MONSTER DB" onClose={() => setView('menu')} />
               <div className="bg-white border-[4px] border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-1 text-center">
                  <div className="mb-4 inline-block bg-blue-600 p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
                     <Database size={48} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-black uppercase italic italic mb-2">SYSTEM ARCHIVES</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase italic leading-relaxed">
                    Data logs on Floor {depth} and beyond are being decrypted. <br/>
                    Defeat monsters to unlock their core biological profiles.
                  </p>
                  <div className="mt-8 pt-6 border-t-[3px] border-dashed border-black/10">
                     <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Scanning Bio-Signatures...</p>
                  </div>
               </div>
            </div>
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

const AvatarMedia = ({ num, animated, className }) => {
  const imgSrc = `/assets/playeravatar/CrystleHunterAvatar (${num}).jpg`;
  if (animated) {
    return (
      <video
        key={`vid-${num}`}
        className={className}
        autoPlay loop muted playsInline
        poster={imgSrc}
      >
        <source src={`/assets/playeravatarvideo/CrystleHunterAvatar (${num}) video.mp4`} type="video/mp4" />
      </video>
    );
  }
  return <img src={imgSrc} className={className} alt="Avatar" loading="lazy" />;
};

const StatTile = ({ icon, label, value, color, desc, isBuffed }) => (
  <div className={`border-[4px] border-black p-4 rounded-xl flex flex-col justify-center gap-2 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all h-full transform -rotate-1 relative overflow-hidden ${isBuffed ? 'bg-purple-900/40 border-purple-500 animate-pulse' : 'bg-slate-900 hover:bg-slate-800'}`}>
    {isBuffed && (
       <div className="absolute top-0 right-0 p-1 bg-purple-500 text-white leading-none">
          <Sparkles size={8} className="animate-spin" />
       </div>
    )}
    <div className="flex items-center gap-3">
      <div className={`${color} bg-black p-2 rounded-lg border-2 border-white/20 shrink-0 shadow-lg ${isBuffed ? 'ring-2 ring-purple-500' : ''}`}>{icon}</div>
      <div>
        <p className={`text-[10px] font-black uppercase leading-none mb-1 tracking-tighter italic ${isBuffed ? 'text-purple-300' : 'text-slate-500'}`}>{label} {isBuffed && 'BOOST'}</p>
        <p className={`text-xl font-black leading-none tracking-tight italic ${isBuffed ? 'text-white' : ''}`}>{value}</p>
      </div>
    </div>
    {desc && <p className="text-[8px] text-slate-500 font-black leading-tight tracking-tighter uppercase border-t border-black/50 pt-2 italic">{desc}</p>}
  </div>
);

const NavBtn = ({ onClick, icon, title, sub, color, disabled }) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`flex flex-col items-center justify-center p-6 border-[4px] border-black rounded-2xl transition-all active:scale-95 group relative overflow-hidden shadow-[6px_6px_0_rgba(0,0,0,1)] ${disabled ? 'bg-slate-900 cursor-not-allowed opacity-50 shadow-none translate-x-1 translate-y-1' : 'bg-slate-800 hover:border-cyan-500 hover:bg-slate-700 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_rgba(0,0,0,1)]'} transition-transform`}
  >
    <div className={`p-4 ${color} rounded-2xl mb-3 shadow-[4px_4px_0_rgba(0,0,0,1)] group-hover:scale-110 transition-transform text-white border-[3px] border-black`}>{icon}</div>
    <h3 className="font-black text-xs uppercase tracking-widest text-white italic drop-shadow-md">{title}</h3>
    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter italic">{sub}</p>
  </button>
);

const Header = ({ title, onClose }) => (
  <div className="flex justify-between items-center mb-6 w-full relative z-20">
    <div className="bg-white text-black px-4 py-1 border-[4px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-1">
      <h2 className="text-xl font-black uppercase tracking-tighter italic">{title}</h2>
    </div>
    <button onClick={onClose} className="p-2 bg-black border-[3px] border-black text-white hover:text-red-500 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none">
      <X size={20} strokeWidth={3} />
    </button>
  </div>
);

const AttributeRow = ({ label, value, onAdd, color, disabled, desc }) => (
  <div className="flex items-center justify-between bg-white p-5 border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 transform rotate-1">
    <div className="flex flex-col items-start text-left">
      <div className="flex items-baseline gap-3 mb-1">
        <span className={`text-sm font-black uppercase ${color} italic underline decoration-black decoration-2`}>{label}</span>
        <span className="text-3xl font-black text-black italic drop-shadow-sm">{value}</span>
      </div>
      <span className="text-[9px] text-slate-500 font-black leading-tight uppercase italic max-w-[160px]">{desc}</span>
    </div>
    <button 
      onClick={onAdd} 
      disabled={disabled} 
      className={`p-3 rounded-full border-[3px] border-black transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${disabled ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none' : 'bg-amber-400 text-black hover:bg-amber-300'}`}
    >
      <PlusCircle size={32} strokeWidth={3} />
    </button>
  </div>
);

const GhostIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500 animate-pulse">
    <path d="M9 10L9.01 10M15 10L15.01 10M12 2C8.13 2 5 5.13 5 9V22L7 20L9 22L11 20L13 22L15 20L17 22L19 20L21 22V9C21 5.13 17.87 2 14 2H12Z" />
  </svg>
);

export default App;
