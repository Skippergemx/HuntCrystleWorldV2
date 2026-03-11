/* eslint-disable */
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
  PlusCircle, Activity, Coffee, MousePointer, Beer, Users
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
  { id: 'iron_blade', name: 'Steel Edge', cost: 100, reqLvl: 2, stats: { str: 10, dex: 5, agi: 0 }, type: 'Weapon' },
  { id: 'leather_armor', name: 'Scout Vest', cost: 150, reqLvl: 3, stats: { str: 2, dex: 2, agi: 12 }, type: 'Armor' },
  { id: 'heavy_mace', name: 'Breaker Hammer', cost: 400, reqLvl: 8, stats: { str: 25, dex: -5, agi: 0 }, type: 'Weapon' },
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
  const [currentMissTaunt, setCurrentMissTaunt] = useState("");
  const [missTimeLeft, setMissTimeLeft] = useState(0);

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
    if (view === 'dungeon' && autoTimeLeft > 0 && !showDefeatedWindow) {
      autoLoop = setInterval(() => {
        const p = playerRef.current;
        if (p && enemyRef.current && stunRef.current <= 0 && missRef.current <= 0) {
          if (p.hp < (p.maxHp * 0.4) && (p.potions || 0) > 0) handleHeal();
          else handleAttack(false);
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
          equipped: {},
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
        equipped: {},
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
    if (player.tokens < mate.cost) return addLog("Need more OHCRYST!");
    syncPlayer({ tokens: player.tokens - mate.cost, hiredMate: mate.id });
    addLog(`Hired ${mate.name} to your party!`);
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
    if (p.hiredMate && buffTimeLeft <= 0 && Math.random() < 0.5) {
      const mate = TAVERN_MATES.find(m => m.id === p.hiredMate);
      syncPlayer({ buffUntil: Date.now() + COMPANION_BUFF_DURATION });
      addLog(`✨ ${mate.name} cast a buff on you!`);
    }

    const stats = calculateTotalStats();
    const target = isBoss ? BOSS : e;

    const hitChance = Math.min(98, (stats.dex / (stats.dex + target.agi * 0.4)) * 100);
    if (Math.random() * 100 < hitChance) {
      const dmg = Math.max(5, stats.str + Math.floor(Math.random() * 10) - Math.floor(target.agi / 5));
      if (!isBoss) addLog(`Struck ${target.name} for ${dmg} DMG.`);

      if (isBoss) {
        processBossHit(dmg);
      } else {
        const newHp = target.hp - dmg;
        if (newHp <= 0) processKill();
        else { setEnemy(prev => ({ ...prev, hp: newHp })); enemyTurn(target, isBoss); }
      }
    } else {
      if (!isBoss) addLog(`Missed strike on ${target.name}!`);
      const missTaunts = target.missTaunts || ["Is that hitting anything?", "Too slow!", "I'm right here!"];
      setCurrentMissTaunt(missTaunts[Math.floor(Math.random() * missTaunts.length)]);
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
        syncPlayer({ hp: p.maxHp, penaltyUntil: Date.now() + PENALTY_DURATION, hiredMate: null, buffUntil: 0 });
        setTimeout(() => { setShowDefeatedWindow(false); setDepth(1); setView('menu'); }, DEFEAT_WINDOW_DURATION);
      } else syncPlayer({ hp: newHp });
    }
  };

  const processKill = () => {
    const e = enemyRef.current || enemy;
    const p = playerRef.current || player;
    addLog(`Victory! Found ${e.loot} C.`);
    let nextXp = p.xp + e.xp, nextLvl = p.level, nextMaxHp = p.maxHp, nextAP = p.abilityPoints || 0;
    while (nextXp >= nextLvl * XP_BASE) { nextXp -= nextLvl * XP_BASE; nextLvl++; nextMaxHp += 50; nextAP += AP_PER_LEVEL; addLog(`LVL UP! +5 AP.`); }
    syncPlayer({ tokens: p.tokens + e.loot, xp: nextXp, level: nextLvl, maxHp: nextMaxHp, hp: Math.min(nextMaxHp, p.hp + 25), abilityPoints: nextAP });
    const newDepth = depth + 1; setDepth(newDepth); spawnNewEnemy(newDepth);
  };

  const processBossHit = async (dmg) => {
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
    } catch (e) {
      console.error("Error updating leaderboard:", e);
    }
    enemyTurn(BOSS, true);
  };

  const allocateStat = (statName) => {
    if ((player.abilityPoints || 0) <= 0) return;
    const newBase = { ...player.baseStats };
    newBase[statName] = (newBase[statName] || 0) + 1;
    syncPlayer({ baseStats: newBase, abilityPoints: player.abilityPoints - 1 });
  };

  const buyItem = (item) => {
    if (player.tokens < item.cost) return addLog("Insufficient tokens!");
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
  const isAutoActive = autoTimeLeft > 0;
  const currentMate = TAVERN_MATES.find(m => m.id === player.hiredMate);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden transition-colors`}>

      {showDefeatedWindow && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
          <div className="text-center p-8 border border-red-900 bg-red-950/40 rounded-3xl max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-900 via-red-500 to-red-900"></div>
            <Skull size={56} className="text-red-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse" />
            <h2 className="text-4xl font-black text-red-500 uppercase tracking-tighter mb-2">Core Collapsed</h2>
            <div className="bg-red-950/50 p-4 rounded-xl border border-red-900/50 mt-4 mb-6">
              <p className="text-xs text-red-200/80 font-bold uppercase tracking-widest leading-relaxed">
                Your strength fails you. The darkness closes in. An emergency extraction protocol is dragging your unconscious body back to the surface...
              </p>
            </div>
            <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.2em] mb-2 animate-pulse">Extraction in progress</p>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-600 animate-defeat-progress" />
            </div>
          </div>
        </div>
      )}

      <nav className="bg-slate-900 border-b border-cyan-900/30 sticky top-0 z-50 p-4 shadow-xl relative overflow-hidden">
        {player.avatar && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover opacity-70 blur-[1px] scale-105 transition-all" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80"></div>
          </div>
        )}
        <div className="max-w-4xl mx-auto flex gap-6 relative z-10 items-stretch">
          <button onClick={() => setView('avatars')} className="w-24 min-h-[140px] bg-gradient-to-br from-cyan-600 to-blue-800 rounded-xl flex items-center justify-center border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.5)] overflow-hidden hover:scale-105 hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] transition-all duration-300 group relative shrink-0">
            {player.avatar ? <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover group-hover:rotate-3 group-hover:scale-110 transition-transform duration-500" /> : <User size={36} className="text-white group-hover:text-cyan-200 transition-colors" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
          </button>

          <div className="flex flex-col justify-between flex-1 py-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="flex flex-col justify-center">
                <h1 className="font-black text-xl uppercase tracking-tighter leading-none text-white drop-shadow-md truncate">{player.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">LVL {player.level}</p>
                  {player.abilityPoints > 0 && <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.5 rounded shadow-sm font-black">+{player.abilityPoints} AP</span>}
                  {currentMate && <span className="text-[8px] bg-purple-500 text-white px-1.5 py-0.5 rounded shadow-sm font-black uppercase tracking-widest">{currentMate.name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm font-bold mt-1 shrink-0">
                <div className="flex items-center gap-1 text-cyan-400"><Coins size={14} /> {player.tokens.toLocaleString()}</div>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 transition-colors" title="Logout"><Lock size={14} /></button>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full mt-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] font-black tracking-widest uppercase w-12 shrink-0">
                  <Heart size={10} className={player.hp / player.maxHp <= 0.25 ? "text-red-500 animate-pulse" : "text-slate-400"} />
                  <span className={player.hp / player.maxHp <= 0.25 ? "text-red-500" : "text-white"}>{player.hp}</span>
                </div>
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden bg-slate-800 border ${player.hp / player.maxHp <= 0.25 ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-slate-700'}`}>
                  <div
                    className={`h-full transition-all duration-300 ${player.hp / player.maxHp <= 0.25 ? 'bg-red-500 hover:bg-red-400' : player.hp / player.maxHp <= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] font-black tracking-widest uppercase w-12 shrink-0 text-cyan-500">
                  <Star size={10} />
                  <span>{player.xp}</span>
                </div>
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300" style={{ width: `${(player.xp / (player.level * XP_BASE)) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-between mt-3 pt-3 border-t border-slate-800/50">
              <div className="flex-1 bg-black/30 backdrop-blur-sm rounded-lg p-1.5 border border-slate-700/30 flex flex-col items-center justify-center hover:bg-black/50 transition-colors min-w-0">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] leading-none mb-1">Weapon</span>
                <span className={`text-[9px] font-black leading-none truncate w-full text-center tracking-widest uppercase ${player.equipped?.Weapon ? 'text-amber-400' : 'text-slate-600'}`}>{player.equipped?.Weapon ? player.equipped.Weapon.name : 'NONE'}</span>
              </div>
              <div className="flex-1 bg-black/30 backdrop-blur-sm rounded-lg p-1.5 border border-slate-700/30 flex flex-col items-center justify-center hover:bg-black/50 transition-colors min-w-0">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] leading-none mb-1">Armor</span>
                <span className={`text-[9px] font-black leading-none truncate w-full text-center tracking-widest uppercase ${player.equipped?.Armor ? 'text-cyan-400' : 'text-slate-600'}`}>{player.equipped?.Armor ? player.equipped.Armor.name : 'NONE'}</span>
              </div>
              <div className="flex-1 bg-black/30 backdrop-blur-sm rounded-lg p-1.5 border border-slate-700/30 flex flex-col items-center justify-center hover:bg-black/50 transition-colors min-w-0">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] leading-none mb-1">Relic</span>
                <span className={`text-[9px] font-black leading-none truncate w-full text-center tracking-widest uppercase ${player.equipped?.Relic ? 'text-purple-400' : 'text-slate-600'}`}>{player.equipped?.Relic ? player.equipped.Relic.name : 'NONE'}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 space-y-6">

        <div className="grid grid-cols-3 gap-3">
          <StatTile icon={<Sword size={16} />} label="STR" value={totalStats.str} color="text-red-400" desc="Boosts raw damage output" />
          <StatTile icon={<Wind size={16} />} label="AGI" value={totalStats.agi} color="text-emerald-400" desc="Mitigates enemy damage" />
          <StatTile icon={<Target size={16} />} label="DEX" value={totalStats.dex} color="text-yellow-400" desc="Increases hit accuracy" />
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl min-h-[460px] flex flex-col overflow-hidden backdrop-blur-sm relative">

          {view === 'menu' && (
            <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              <NavBtn onClick={() => { if (!isPenalized) { setView('dungeon'); setDepth(1); spawnNewEnemy(1); } }} icon={isPenalized ? <Clock className="animate-pulse" /> : <MapIcon />} title="Dungeon" sub={isPenalized ? `Wait ${penaltyRemaining}s` : "Battle"} color={isPenalized ? "bg-slate-800 grayscale" : "bg-cyan-600"} disabled={isPenalized} />
              <NavBtn onClick={() => setView('tavern')} icon={<Beer />} title="Tavern" sub="Hire Mates" color="bg-amber-700" disabled={false} />
              <NavBtn onClick={() => setView('attributes')} icon={<Activity />} title="Attributes" sub={`${player.abilityPoints || 0} pts`} color="bg-orange-600" disabled={false} />
              <NavBtn onClick={() => setView('shop')} icon={<ShoppingBag />} title="Shop" sub="Items" color="bg-slate-700" disabled={false} />
              <NavBtn onClick={() => setView('forge')} icon={<Hammer />} title="Forge" sub="Relics" color="bg-amber-600" disabled={false} />
              <NavBtn onClick={() => { if (!isPenalized) setView('boss'); }} icon={<AlertCircle />} title="Core Raid" sub="Boss" color="bg-red-700" disabled={isPenalized} />
            </div>
          )}

          {view === 'tavern' && (
            <div className="flex-1 p-6 space-y-4">
              <Header title="Dragon's Rest Tavern" onClose={() => setView('menu')} />
              <div className="grid gap-3">
                {TAVERN_MATES.map(mate => (
                  <div key={mate.id} className="p-4 bg-slate-800/40 border border-slate-700 rounded-2xl flex justify-between items-center group">
                    <div className="space-y-1">
                      <h4 className="font-bold flex items-center gap-2 text-white">
                        {mate.name} {player.hiredMate === mate.id && <span className="text-[8px] bg-purple-500 px-1 rounded text-white font-black tracking-widest">ACTIVE</span>}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase">{mate.desc}</p>
                    </div>
                    <button onClick={() => hireMate(mate)} disabled={player.hiredMate === mate.id} className="px-5 py-2 bg-amber-600 disabled:bg-slate-800 rounded-xl font-black text-xs whitespace-nowrap shadow-lg">{mate.cost} C</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'attributes' && (
            <div className="flex-1 p-6 space-y-6 flex flex-col items-center justify-center">
              <Header title="Character Attributes" onClose={() => setView('menu')} />
              <div className="bg-slate-800/40 border border-amber-500/20 p-6 rounded-3xl w-full max-w-sm text-center">
                <p className="text-[10px] uppercase font-black text-slate-500 mb-2 tracking-[0.2em]">Ability Points</p>
                <p className="text-5xl font-black text-amber-500 mb-6">{player.abilityPoints || 0}</p>
                <div className="space-y-4">
                  <AttributeRow label="STR" value={player.baseStats.str} onAdd={() => allocateStat('str')} color="text-red-400" disabled={!player.abilityPoints} desc="Increases your attack power & raw damage." />
                  <AttributeRow label="AGI" value={player.baseStats.agi} onAdd={() => allocateStat('agi')} color="text-emerald-400" disabled={!player.abilityPoints} desc="Evades attacks & reduces incoming damage." />
                  <AttributeRow label="DEX" value={player.baseStats.dex} onAdd={() => allocateStat('dex')} color="text-yellow-400" disabled={!player.abilityPoints} desc="Enhances precision & your chance to strike." />
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
            <div className={`flex-1 p-8 flex flex-col items-center justify-center gap-6 animate-in fade-in relative ${isHurt ? 'animate-damage' : ''}`}>
              <div className="absolute top-4 left-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-500/20 rounded-full">
                  <TrendingUp size={14} className="text-cyan-400" />
                  <span className="text-xs font-black text-cyan-400 tracking-widest">F{depth}</span>
                </div>
                {buffTimeLeft > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-full font-black text-[10px] animate-pulse">
                    <Sparkles size={10} /> BUFF: {buffTimeLeft}s
                  </div>
                )}
                {isAutoActive && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-cyan-600 text-black rounded-full font-black text-[10px] animate-pulse">
                    <MousePointer size={10} /> AUTO: {autoTimeLeft}s
                  </div>
                )}
              </div>

              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                <button onClick={handleHeal} disabled={player.potions <= 0} className="flex items-center gap-2 bg-red-600/20 border border-red-500/40 px-4 py-2 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-30 group">
                  <Coffee size={16} className="text-red-400 group-hover:text-white transition-colors" />
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-300/70 leading-none">Potion</span>
                    <span className="text-xs font-black leading-none">{player.potions || 0} left</span>
                  </div>
                </button>
                {player.autoScrolls > 0 && !isAutoActive && (
                  <button onClick={activateAutoScroll} className="flex items-center gap-2 bg-cyan-600/20 border border-cyan-500/40 px-3 py-2 rounded-xl hover:bg-cyan-600 transition-colors">
                    <MousePointer size={16} className="text-cyan-400" />
                    <span className="text-xs font-black">{player.autoScrolls}</span>
                  </button>
                )}
              </div>

              <div className="w-28 h-28 bg-slate-800 rounded-3xl flex items-center justify-center border-2 border-cyan-500/20 shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/50 to-transparent"></div>
                <img
                  src={`/assets/monsters/${enemy.name}.png`}
                  alt={enemy.name}
                  className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ghost"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>';
                  }}
                />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{enemy.name}</h2>
                <div className="flex items-center justify-center gap-4 mt-2 mb-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-red-400 font-black uppercase tracking-widest">STR</span>
                    <span className="text-sm font-black text-white">{enemy.str}</span>
                  </div>
                  <div className="w-px h-6 bg-slate-700"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">AGI</span>
                    <span className="text-sm font-black text-white">{enemy.agi}</span>
                  </div>
                  <div className="w-px h-6 bg-slate-700"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">DEX</span>
                    <span className="text-sm font-black text-white">{enemy.dex}</span>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-cyan-400 tracking-widest">+{enemy.xp} XP</p>
                  <p className="text-[10px] font-mono text-slate-400">{enemy.hp.toLocaleString()} / {enemy.maxHp.toLocaleString()} HP</p>
                  <p className="text-[10px] font-black text-amber-400 tracking-widest">+{enemy.loot} C</p>
                </div>
              </div>

              <div className="w-full max-w-sm mt-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Your Health</span>
                  <span className="text-[10px] font-mono text-slate-400">{player.hp} / {player.maxHp} HP</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden bg-slate-800 border ${player.hp / player.maxHp <= 0.25 ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-slate-700'}`}>
                  <div
                    className={`h-full transition-all duration-300 ${player.hp / player.maxHp <= 0.25 ? 'bg-red-500 animate-pulse' : player.hp / player.maxHp <= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-3 w-full max-w-sm pt-4 relative">

                {isStunned && (
                  <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-2xl border-[3px] border-red-500 p-2 shadow-[0_0_30px_rgba(239,68,68,0.5)] z-20 animate-in slide-in-from-bottom flex flex-col justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.3),transparent_60%)] pointer-events-none"></div>
                    <div className="flex gap-3 items-center w-full relative z-10">
                      <div className="relative shrink-0">
                        <div className="absolute top-0 -left-1 bg-amber-400 border-2 border-black px-1.5 py-0.5 transform -rotate-[15deg] shadow-[2px_2px_0_0_rgba(0,0,0,1)] z-30 rounded-sm">
                          <span className="font-black italic text-black text-[10px] uppercase tracking-widest leading-none block pb-px">HIT!</span>
                        </div>
                        <div className="w-16 h-16 bg-red-950 rounded-full border-2 border-red-500 flex items-center justify-center overflow-hidden shadow-inner transform -rotate-6">
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

                {missTimeLeft > 0 && !isStunned && (
                  <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-2xl border-[3px] border-emerald-500 p-2 shadow-[0_0_30px_rgba(16,185,129,0.5)] z-20 animate-in slide-in-from-bottom flex flex-col justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.3),transparent_60%)] pointer-events-none"></div>
                    <div className="flex gap-3 items-center w-full relative z-10">
                      <div className="relative shrink-0">
                        <div className="absolute top-0 -left-1 bg-cyan-400 border-2 border-black px-1.5 py-0.5 transform -rotate-[15deg] shadow-[2px_2px_0_0_rgba(0,0,0,1)] z-30 rounded-sm">
                          <span className="font-black italic text-black text-[10px] uppercase tracking-widest leading-none block pb-px">MISS!</span>
                        </div>
                        <div className="w-16 h-16 bg-emerald-950 rounded-full border-2 border-emerald-500 flex items-center justify-center overflow-hidden shadow-inner transform -rotate-6">
                          {enemy?.name ? (
                            <img
                              src={`/assets/monsters/${enemy.name}.png`}
                              alt={enemy.name}
                              className="w-full h-full object-cover scale-150 origin-top grayscale"
                              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <Skull size={32} className="text-emerald-500 absolute" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 bg-white text-black p-2 px-3 rounded-2xl rounded-bl-sm relative shadow-md border-2 border-black transform rotate-1">
                        <p className="font-black text-[11px] sm:text-xs uppercase leading-tight line-clamp-2">"{currentMissTaunt}"</p>
                        <div className="absolute -bottom-2 -left-1 w-4 h-4 bg-white border-b-2 border-l-2 border-black transform rotate-[30deg]"></div>
                      </div>
                      <div className="w-12 h-12 shrink-0 bg-emerald-600 border-[3px] border-black rounded-full flex flex-col items-center justify-center shadow-lg transform rotate-[15deg] mr-1">
                        <span className="text-lg font-black text-white leading-none">{missTimeLeft.toFixed(1)}</span>
                        <span className="text-[8px] font-black uppercase text-black leading-none">sec</span>
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={() => handleAttack()} disabled={isStunned || missTimeLeft > 0 || showDefeatedWindow} className={`flex-1 py-4 rounded-2xl font-black text-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isStunned || missTimeLeft > 0 ? 'opacity-0 pointer-events-none' : 'bg-cyan-600 hover:bg-cyan-500'} ${isAutoActive && !isStunned && missTimeLeft <= 0 ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}>
                  {isAutoActive ? 'AUTO-STRIKING...' : 'ATTACK'}
                </button>
                <button onClick={() => { setView('menu'); setDepth(1); }} disabled={isStunned || missTimeLeft > 0} className={`px-6 py-4 rounded-2xl font-bold transition-all ${isStunned || missTimeLeft > 0 ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800'}`}>EXIT</button>
              </div>
            </div>
          )}

          {view === 'shop' && (
            <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[460px]">
              <Header title="Crystle Emporium" onClose={() => setView('menu')} />
              <div className="grid gap-3">
                {SHOP_ITEMS.map(item => (
                  <div key={item.id} className="p-4 bg-slate-800/40 border border-slate-700 rounded-2xl flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-black">{item.desc || Object.entries(item.stats || {}).map(([k, v]) => `${k} +${v}`).join(' ')}</p>
                    </div>
                    <button onClick={() => buyItem(item)} className="px-5 py-2 bg-cyan-600 disabled:bg-slate-800 rounded-xl font-black text-xs">{item.cost} C</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'forge' && (
            <div className="flex-1 p-6 space-y-4">
              <Header title="Gemstone Forge" onClose={() => setView('menu')} />
              <div className="grid gap-3">
                {CRYSTLE_RECIPES.map(recipe => {
                  const hasRecipe = player.recipes?.includes(recipe.id);
                  return (
                    <div key={recipe.id} className={`p-4 border rounded-2xl flex justify-between items-center ${hasRecipe ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900/40 border-slate-800 opacity-40'}`}>
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{recipe.img}</span>
                        <div>
                          <h4 className="font-black text-amber-500">{recipe.name}</h4>
                          <div className="flex gap-2 text-[10px] font-black uppercase text-amber-200/50">
                            {Object.entries(recipe.stats).map(([k, v]) => <span key={k}>{k}+{v}</span>)}
                          </div>
                        </div>
                      </div>
                      {hasRecipe && <button onClick={() => forgeCrystle(recipe)} className="px-5 py-2 bg-amber-600 rounded-xl font-black text-sm">{recipe.cost} C</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'boss' && (
            <div className={`flex-1 p-8 flex flex-col items-center justify-center gap-6 text-center ${isHurt ? 'animate-damage' : ''}`}>
              <Skull size={64} className="text-red-500 animate-pulse" />
              <div>
                <h2 className="text-5xl font-black text-red-500 uppercase tracking-tighter leading-none">{BOSS.name}</h2>
              </div>
              <div className="bg-slate-800/80 p-6 rounded-3xl border border-red-500/20 w-full max-w-sm mb-4">
                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-2">Total Damage Dealt</p>
                <p className="text-4xl font-black text-white leading-none tracking-tight">{(player.totalBossDamage || 0).toLocaleString()}</p>
              </div>

              <div className="w-full max-w-sm">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Your Health</span>
                  <span className="text-[10px] font-mono text-slate-400">{player.hp} / {player.maxHp} HP</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden bg-slate-800 border ${player.hp / player.maxHp <= 0.25 ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-slate-700'}`}>
                  <div
                    className={`h-full transition-all duration-300 ${player.hp / player.maxHp <= 0.25 ? 'bg-red-500 animate-pulse' : player.hp / player.maxHp <= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Added Heal button for the Boss Fight too */}
              <div className="w-full max-w-sm flex justify-end mt-1">
                <button onClick={handleHeal} disabled={player.potions <= 0} className="flex items-center gap-2 bg-red-600/20 border border-red-500/40 px-4 py-2 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-30 group">
                  <Coffee size={16} className="text-red-400 group-hover:text-white transition-colors" />
                  <div className="flex flex-col items-start bg-transparent">
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-300/70 leading-none">Potion</span>
                    <span className="text-xs font-black leading-none">{player.potions || 0} left</span>
                  </div>
                </button>
              </div>

              <div className="flex gap-4 w-full max-w-sm mt-4 relative">

                {isStunned && (
                  <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-2xl border-[3px] border-red-500 p-2 shadow-[0_0_30px_rgba(239,68,68,0.5)] z-20 animate-in slide-in-from-bottom flex flex-col justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.3),transparent_60%)] pointer-events-none"></div>
                    <div className="flex gap-3 items-center w-full relative z-10">
                      <div className="relative shrink-0">
                        <div className="absolute top-0 -left-1 bg-amber-400 border-2 border-black px-1.5 py-0.5 transform -rotate-[15deg] shadow-[2px_2px_0_0_rgba(0,0,0,1)] z-30 rounded-sm">
                          <span className="font-black italic text-black text-[10px] uppercase tracking-widest leading-none block pb-px">HIT!</span>
                        </div>
                        <div className="w-16 h-16 bg-red-950 rounded-full border-2 border-red-500 flex items-center justify-center overflow-hidden shadow-inner transform -rotate-6">
                          <Skull size={32} className="text-red-500 absolute" />
                        </div>
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

                {missTimeLeft > 0 && !isStunned && (
                  <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-2xl border-[3px] border-emerald-500 p-2 shadow-[0_0_30px_rgba(16,185,129,0.5)] z-20 animate-in slide-in-from-bottom flex flex-col justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.3),transparent_60%)] pointer-events-none"></div>
                    <div className="flex gap-3 items-center w-full relative z-10">
                      <div className="relative shrink-0">
                        <div className="absolute top-0 -left-1 bg-cyan-400 border-2 border-black px-1.5 py-0.5 transform -rotate-[15deg] shadow-[2px_2px_0_0_rgba(0,0,0,1)] z-30 rounded-sm">
                          <span className="font-black italic text-black text-[10px] uppercase tracking-widest leading-none block pb-px">MISS!</span>
                        </div>
                        <div className="w-16 h-16 bg-emerald-950 rounded-full border-2 border-emerald-500 flex items-center justify-center overflow-hidden shadow-inner transform -rotate-6">
                          <Skull size={32} className="text-emerald-500 absolute" />
                        </div>
                      </div>
                      <div className="flex-1 bg-white text-black p-2 px-3 rounded-2xl rounded-bl-sm relative shadow-md border-2 border-black transform rotate-1">
                        <p className="font-black text-[11px] sm:text-xs uppercase leading-tight line-clamp-2">"{currentMissTaunt}"</p>
                        <div className="absolute -bottom-2 -left-1 w-4 h-4 bg-white border-b-2 border-l-2 border-black transform rotate-[30deg]"></div>
                      </div>
                      <div className="w-12 h-12 shrink-0 bg-emerald-600 border-[3px] border-black rounded-full flex flex-col items-center justify-center shadow-lg transform rotate-[15deg] mr-1">
                        <span className="text-lg font-black text-white leading-none">{missTimeLeft.toFixed(1)}</span>
                        <span className="text-[8px] font-black uppercase text-black leading-none">sec</span>
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={() => handleAttack(true)} disabled={isStunned || missTimeLeft > 0 || showDefeatedWindow} className={`flex-1 py-5 rounded-2xl font-black text-2xl shadow-xl transition-all ${isStunned || missTimeLeft > 0 ? 'opacity-0 pointer-events-none' : 'bg-red-600 hover:bg-red-500'}`}>
                  STRIKE
                </button>
                <button onClick={() => setView('menu')} disabled={isStunned || missTimeLeft > 0} className={`px-8 py-5 rounded-2xl font-bold uppercase tracking-widest transition-all ${isStunned || missTimeLeft > 0 ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800 text-slate-300'}`}>Retreat</button>
              </div>
            </div>
          )}

          {view === 'leaderboard' && (
            <div className="flex-1 p-6 space-y-4">
              <Header title="Elite Sentinels" onClose={() => setView('menu')} />
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl flex justify-between items-center transition-all ${entry.uid === user.uid ? 'bg-cyan-500/20 border border-cyan-500/50 shadow-lg' : 'bg-slate-800/30 border border-slate-700'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`font-black text-lg ${idx < 3 ? 'text-cyan-400' : 'text-slate-600'}`}>#{idx + 1}</span>
                      <div><p className="font-black text-sm uppercase text-white">{entry.name}</p><p className="text-[10px] text-slate-500">Level {entry.level}</p></div>
                    </div>
                    <p className="text-xl font-black text-cyan-400">{(entry.score || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-black/50 border border-slate-800 rounded-3xl p-4 h-32 overflow-y-auto font-mono text-[11px] leading-relaxed shadow-inner">
          {logs.map((log, i) => (
            <div key={i} className={`mb-1 transition-opacity duration-300 ${i === 0 ? 'text-cyan-400 font-bold' : 'text-slate-600 opacity-80'}`}>
              <span className="opacity-10 mr-2 select-none">[{8 - i}]</span>{log}
            </div>
          ))}
        </div>

      </main>

      <footer className="text-center py-8 opacity-40">
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] mb-1">hunt.crystle.world</p>
      </footer>

      <style>{`
        @keyframes defeat-progress { from { width: 0%; } to { width: 100%; } }
        .animate-defeat-progress { animation: defeat-progress ${DEFEAT_WINDOW_DURATION}ms linear forwards; }
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

const StatTile = ({ icon, label, value, color, desc }) => (
  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl flex flex-col justify-center gap-2 shadow-sm hover:border-slate-700 transition-colors h-full">
    <div className="flex items-center gap-3">
      <div className={`${color} opacity-80 shrink-0`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-600 uppercase leading-none mb-1 tracking-tighter">{label}</p>
        <p className="text-lg font-black leading-none tracking-tight">{value}</p>
      </div>
    </div>
    {desc && <p className="text-[8px] text-slate-500 font-bold leading-tight tracking-tighter uppercase border-t border-slate-800/50 pt-2">{desc}</p>}
  </div>
);

const NavBtn = ({ onClick, icon, title, sub, color, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={`flex flex-col items-center justify-center p-6 border rounded-3xl transition-all active:scale-95 group relative overflow-hidden shadow-sm ${disabled ? 'bg-slate-900 border-slate-800 cursor-not-allowed opacity-50' : 'bg-slate-800/20 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40'}`}>
    <div className={`p-4 ${color} rounded-2xl mb-3 shadow-lg group-hover:scale-110 group-hover:shadow-cyan-500/10 transition-transform text-white border border-white/10`}>{icon}</div>
    <h3 className="font-black text-xs uppercase tracking-widest text-slate-200">{title}</h3>
    <p className="text-[8px] font-bold text-slate-600 uppercase mt-1 tracking-tighter">{sub}</p>
  </button>
);

const Header = ({ title, onClose }) => (
  <div className="flex justify-between items-center mb-4 border-b border-slate-800/50 pb-3 w-full">
    <h2 className="text-lg font-black uppercase text-white tracking-widest flex items-center gap-2">{title}</h2>
    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><X size={18} /></button>
  </div>
);

const AttributeRow = ({ label, value, onAdd, color, disabled, desc }) => (
  <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800 group hover:border-amber-500/30 transition-all">
    <div className="flex flex-col items-start text-left">
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-[12px] font-black uppercase ${color} tracking-widest`}>{label}</span>
        <span className="text-xl font-black text-white">{value}</span>
      </div>
      <span className="text-[9px] text-slate-500 font-bold leading-tight uppercase tracking-tighter max-w-[140px]">{desc}</span>
    </div>
    <button onClick={onAdd} disabled={disabled} className={`p-2 rounded-xl transition-all ${disabled ? 'text-slate-700 cursor-not-allowed' : 'text-amber-500 hover:bg-amber-500 hover:text-black active:scale-90'}`}>
      <PlusCircle size={32} strokeWidth={2} />
    </button>
  </div>
);

const GhostIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500 animate-pulse">
    <path d="M9 10L9.01 10M15 10L15.01 10M12 2C8.13 2 5 5.13 5 9V22L7 20L9 22L11 20L13 22L15 20L17 22L19 20L21 22V9C21 5.13 17.87 2 14 2H12Z" />
  </svg>
);

export default App;
