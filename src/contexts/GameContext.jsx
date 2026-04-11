import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { db, appId } from '../firebase';
import MONSTERS from '../data/monsters.json';
import TAVERN_MATES from '../data/mates.json';
import CRYSTLE_RECIPES from '../data/recipes.json';
import MAPS from '../data/maps.json';
import ITEMS from '../data/items.json';
import LAB_RECIPES from '../data/lab_recipes.json';
import PETS_METADATA from '../data/pets_metadata.json';

import {
  DIFFICULTY_MULTIPLIER, getXpRequired, AP_PER_LEVEL, MAX_CRIT_CHANCE, BASE_CRIT_CHANCE, CRIT_SCALING_PER_FLOOR,
  STUN_DURATION_NORMAL, STUN_DURATION_CRIT, DEFEAT_WINDOW_DURATION, PENALTY_DURATION,
  AUTO_SCROLL_DURATION, COMPANION_BUFF_DURATION, ELEMENT_ADVANTAGE,
  BOSS, BOSS_MEDIA_FILES, scaleMonster, calculateStats, getHitChance, getDamage
} from '../utils/gameLogic';

import { useAdventure } from '../hooks/useAdventure';
import { useAudioEngine, SOUNDS } from '../hooks/useAudioEngine';
import { usePlayerSync } from '../hooks/usePlayerSync';
import { useMarketplace } from '../hooks/useMarketplace';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useCombat } from '../hooks/useCombat';
import { usePlayerActions } from '../hooks/usePlayerActions';
import { useGameLoop } from '../hooks/useGameLoop';
import { useWallet } from '../hooks/useWallet';
import { useTelegram } from '../hooks/useTelegram';
import { LoadingScreen } from '../components/LoadingScreen';

export const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  // No error throw here yet, let components handle it or return null
  return context;
};

// Derived master lists for backwards compatibility and internal context use
const EQUIPMENT = ITEMS.filter(i => i.category === 'Equipment');
const LOOTS = ITEMS.filter(i => i.category === 'Loot');
const FRUITS = ITEMS.filter(i => i.category === 'Fruit');
const SHOP_ITEMS = ITEMS.filter(i => i.cost !== undefined);

export const GameProvider = ({ children, user, farcasterContext }) => {
  const [logs, setLogs] = useState(["Synchronizing with Metaverse..."]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [showGuide, setShowGuide] = useState(false);
  const [guideType, setGuideType] = useState('menu');
  const [bossAvatarIdx, setBossAvatarIdx] = useState(0);
  const [showBossVideo, setShowBossVideo] = useState(false);
  const [showSuccessWindow, setShowSuccessWindow] = useState(false);
  const [forgeResult, setForgeResult] = useState(null); // { success: boolean, item: object }
  const [showBlockadeModal, setShowBlockadeModal] = useState(false);
  const [blockadeError, setBlockadeError] = useState(null);
  const [collisionProfile, setCollisionProfile] = useState(null);
  const [globalError, setGlobalError] = useState(null); // { message, stack, timestamp, view, depth }
  const [lowPerfMode, setLowPerfMode] = useState(() => localStorage.getItem('low_perf_mode') === 'true');

  // Sync Body Attribute for CSS Global Selectors (Low Performance Mode)
  useEffect(() => {
    document.body.setAttribute('data-perf-mode', lowPerfMode ? 'low' : 'high');
    localStorage.setItem('low_perf_mode', lowPerfMode);
  }, [lowPerfMode]);

  // Telegram SDK
  const telegram = useTelegram();

  // Sync Timer for UI Clock
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(clockTimer);
  }, []);

  const addLog = useCallback((msg) => setLogs(prev => [msg, ...prev.slice(0, 7)]), []);

  // Tracking refs for the global error sentry to avoid dependency re-runs
  const sentryStateRef = useRef({ view: 'menu', depth: 1 });

  // --- CORE SYSTEM INITIALIZATION ---
  const { player, setPlayer, syncPlayer, loadingPlayer, linkWallet, migrateProfile, sessionConflict } = usePlayerSync(user, db, appId, farcasterContext, telegram);
  
  // GvG Battle Context
  const [battleMode, setBattleMode] = useState('DUNGEON'); // 'DUNGEON', 'BOSS', 'GVG'
  const [gvgContext, setGvgContext] = useState(null); // { warId, opponentId }

  // Hooks initialization
  const leaderboardObj = useLeaderboard(user, player, db, appId);
  const adventure = useAdventure();
  const audio = useAudioEngine(adventure.view, adventure.enemy?.isBoss);
  
  const totalStats = useMemo(() => {
    if (!player) return calculateStats({ level: 1, baseStats: { str: 10, agi: 10, dex: 10 }, equipped: {} }, TAVERN_MATES, false, false, PETS_METADATA);
    const buffActive = (player.buffUntil || 0) > Date.now();
    // BUG-09 FIX: Dragon uses summonUntil, NOT autoUntil (which is the auto-scroll timer)
    const dragonActive = (player.dragon?.summonUntil || 0) > Date.now();
    return calculateStats(player, TAVERN_MATES, buffActive, dragonActive, PETS_METADATA); 
  }, [player]);

  const actions = usePlayerActions(
    player, setPlayer, syncPlayer, addLog, audio.playSFX, SOUNDS, 
    TAVERN_MATES, ITEMS, setForgeResult, totalStats, db, appId,
    PETS_METADATA,
    { setBattleMode, setGvgContext, setEnemy: adventure.setEnemy, setView: adventure.setView }
  );

  const market = useMarketplace(user, player, syncPlayer, addLog, audio.playSFX, SOUNDS, db, appId);
  const wallet = useWallet(addLog, farcasterContext);

  const combat = useCombat(
    user, player, syncPlayer, 
    adventure.enemy, adventure.setEnemy, adventure.enemyRef, adventure.spawnNewEnemy, adventure.clearEnemy,
    totalStats, addLog, audio.playSFX, SOUNDS, adventure.selectedMap,
    STUN_DURATION_NORMAL, STUN_DURATION_CRIT, PENALTY_DURATION, DEFEAT_WINDOW_DURATION,
    COMPANION_BUFF_DURATION, ELEMENT_ADVANTAGE, getXpRequired, AP_PER_LEVEL, EQUIPMENT, LOOTS, ITEMS,
    adventure.depth, adventure.setDepth, adventure.view, adventure.setView, 
    adventure.triggerFlinch, adventure.triggerHurt, TAVERN_MATES, PETS_METADATA,
    { battleMode, setBattleMode, gvgContext, setGvgContext, recordWarResult: actions.recordWarResult, triggerHaptic: telegram.triggerHaptic }
  );
  
  const gameLoop = useGameLoop({
    player,
    view: adventure.view,
    syncPlayer,
    addLog,
    combat,
    actions,
    totalStats,
    showDefeatedWindow: combat.showDefeatedWindow
  });

  const dynamicStats = useMemo(() => {
    if (!player) return totalStats;
    return calculateStats(player, TAVERN_MATES, gameLoop.buffTimeLeft > 0, gameLoop.dragonTimeLeft > 0, PETS_METADATA);
  }, [player, gameLoop.buffTimeLeft, gameLoop.dragonTimeLeft, totalStats]);

  useEffect(() => {
    combat.setPenaltyRemaining(gameLoop.penaltyRemaining);
  }, [gameLoop.penaltyRemaining]);

  // --- GLOBAL SECURITY SENTRY ---
  // Watches for any wallet connection and triggers a blockade scan
  useEffect(() => {
    const triggerGlobalUplink = async () => {
      if (wallet.address && player && !player.walletAddress && !farcasterContext) {
        console.log("System V3: Global Security Sentry Detected Unlinked Node. Initiating Sweep...");
        const result = await linkWallet(wallet.address);
        if (!result.success) {
           console.warn(`SECURITY ALERT: Ejecting unauthorized node connection. Reason: ${result.error}`);
           setBlockadeError(result.error);
           setCollisionProfile(result.collision || null);
           setShowBlockadeModal(true);
           wallet.disconnectWallet(); // AUTO-EJECT ON BLOCKADE
           addLog(`Security Alert: ${result.error}. Node Ejected.`);
        } else {
           addLog("Uplink Established.");
        }
      }
    };
    triggerGlobalUplink();
  }, [wallet.address, player?.walletAddress, farcasterContext]);

  // --- UPLINK SECURITY PROTOCOL ---
  // We no longer auto-sync browser wallets. 
  // All link attempts must pass through the linkWallet() blockade scanner in usePlayerSync.

  const openGuide = (type) => {
    setGuideType(type || adventure.view);
    setShowGuide(true);
  };

  const handleLogout = async (signOutFn) => {
     try {
       if (player.autoUntil > 0 || player.buffUntil > 0) {
         await syncPlayer({ autoUntil: 0, buffUntil: 0 }, true);
       }
       await signOutFn();
       adventure.setView('menu');
     } catch (e) {
       console.error("Logout error:", e);
     }
  };

  const submitErrorReport = useCallback(async (err) => {
    if (!err) return;
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'error_reports'), {
        userId: player?.uid || user?.uid || 'anonymous',
        userName: player?.name || 'Unknown',
        message: err.message,
        stack: err.stack,
        view: err.view,
        depth: err.depth,
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp()
      });
      return { success: true };
    } catch (e) {
      console.error("Failed to submit error report:", e);
      return { success: false, error: e.message };
    }
  }, [db, player, user]);

  // --- GLOBAL ERROR SENTRY (Ref-Locked) ---
  useEffect(() => {
    sentryStateRef.current = { view: adventure.view, depth: adventure.depth };
  }, [adventure.view, adventure.depth]);

  useEffect(() => {
    const handleError = (event) => {
      // Ignore some common non-critical errors or third-party noise if needed
      if (event.message?.includes('ResizeObserver')) return;

      const errorMsg = event.reason?.message || event.message || "Unknown Runtime Critical Failure";
      const stack = event.reason?.stack || event.error?.stack || "No stack trace available.";
      
      console.error("🚀 [GLOBAL_SENTRY] Error Caught:", errorMsg);

      setGlobalError({
        message: errorMsg,
        stack: stack,
        timestamp: Date.now(),
        // We capture these via refs to avoid closure stale state or dependency issues
        view: sentryStateRef.current.view,
        depth: sentryStateRef.current.depth
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []); // Only mount once

  const engine = {
    user, player, syncPlayer, logs, addLog, currentTime,
    showGuide, setShowGuide, guideType, setGuideType,
    bossAvatarIdx, setBossAvatarIdx, showBossVideo, setShowBossVideo,
    showSuccessWindow, setShowSuccessWindow,
    showBlockadeModal, setShowBlockadeModal,
    blockadeError, setBlockadeError,
    collisionProfile, setCollisionProfile,
    sessionConflict,
    forgeResult, setForgeResult,
    adventure, combat, actions, gameLoop, market, audio, wallet, 
    linkWallet, migrateProfile,
    farcasterContext,
    telegram,
    gvgContext, setGvgContext,
    battleMode, setBattleMode,
    leaderboard: leaderboardObj.leaderboard,
    updateLeaderboard: syncPlayer, // Alias for backward compatibility if needed, though they should call syncPlayer
    updateBoardTab: leaderboardObj.setActiveBoard,
    activeBoardTab: leaderboardObj.activeBoard,

    db, appId, totalStats: dynamicStats, handleLogout, openGuide,
    globalError, setGlobalError, submitErrorReport,
    lowPerfMode, setLowPerfMode,
    TAVERN_MATES, MONSTERS, ITEMS, LOOTS, EQUIPMENT, MAPS, FRUITS, CRYSTLE_RECIPES, SHOP_ITEMS, LAB_RECIPES, PETS_METADATA,
    BOSS, BOSS_MEDIA_FILES, SOUNDS
  };

  return (
    <GameContext.Provider value={engine}>
      {(loadingPlayer || !player) ? <LoadingScreen /> : children}
    </GameContext.Provider>
  );
};
