import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { db, appId } from '../firebase';
import MONSTERS from '../data/monsters.json';
import TAVERN_MATES from '../data/mates.json';
import CRYSTLE_RECIPES from '../data/recipes.json';
import MAPS from '../data/maps.json';
import ITEMS from '../data/items.json';
import LAB_RECIPES from '../data/lab_recipes.json';

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
import { LoadingScreen } from '../components/LoadingScreen';

export const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
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

  // Sync Timer for UI Clock
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(clockTimer);
  }, []);

  const addLog = useCallback((msg) => setLogs(prev => [msg, ...prev.slice(0, 7)]), []);

  // --- CORE SYSTEM INITIALIZATION ---
  const { player, setPlayer, syncPlayer, loadingPlayer } = usePlayerSync(user, db, appId, farcasterContext);
  
  // GvG Battle Context
  const [battleMode, setBattleMode] = useState('DUNGEON'); // 'DUNGEON', 'BOSS', 'GVG'
  const [gvgContext, setGvgContext] = useState(null); // { warId, opponentId }

  // Hooks initialization
  const leaderboardObj = useLeaderboard(user, player, db, appId);
  const adventure = useAdventure();
  const audio = useAudioEngine(adventure.view, adventure.enemy?.isBoss);
  
  const totalStats = useMemo(() => {
    if (!player) return calculateStats({ level: 1, baseStats: { str: 10, agi: 10, dex: 10 }, equipped: {} }, TAVERN_MATES, false, false);
    return calculateStats(player, TAVERN_MATES, false, false); 
  }, [player]);

  const actions = usePlayerActions(
    player, setPlayer, syncPlayer, addLog, audio.playSFX, SOUNDS, 
    TAVERN_MATES, ITEMS, setForgeResult, totalStats, db, appId,
    { setBattleMode, setGvgContext, setEnemy: adventure.setEnemy, setView: adventure.setView }
  );

  const market = useMarketplace(user, player, syncPlayer, addLog, audio.playSFX, SOUNDS, db, appId);
  const wallet = useWallet(addLog);

  const combat = useCombat(
    user, player, syncPlayer, 
    adventure.enemy, adventure.setEnemy, adventure.enemyRef, adventure.spawnNewEnemy,
    totalStats, addLog, audio.playSFX, SOUNDS, leaderboardObj.updateLeaderboard, adventure.selectedMap,
    STUN_DURATION_NORMAL, STUN_DURATION_CRIT, PENALTY_DURATION, DEFEAT_WINDOW_DURATION,
    COMPANION_BUFF_DURATION, ELEMENT_ADVANTAGE, getXpRequired, AP_PER_LEVEL, EQUIPMENT, LOOTS,
    adventure.depth, adventure.setDepth, adventure.view, adventure.setView, 
    adventure.triggerFlinch, adventure.triggerHurt, TAVERN_MATES,
    { battleMode, setBattleMode, gvgContext, setGvgContext, recordWarResult: actions.recordWarResult }
  );
  
  const gameLoop = useGameLoop({
    player,
    view: adventure.view,
    syncPlayer,
    addLog,
    combat,
    actions,
    showDefeatedWindow: combat.showDefeatedWindow
  });

  const dynamicStats = useMemo(() => {
    if (!player) return totalStats;
    return calculateStats(player, TAVERN_MATES, gameLoop.buffTimeLeft > 0, gameLoop.dragonTimeLeft > 0);
  }, [player, gameLoop.buffTimeLeft, gameLoop.dragonTimeLeft, totalStats]);

  useEffect(() => {
    combat.setPenaltyRemaining(gameLoop.penaltyRemaining);
  }, [gameLoop.penaltyRemaining]);

  if (loadingPlayer || !player) return <LoadingScreen />;

  const openGuide = (type) => {
    setGuideType(type || adventure.view);
    setShowGuide(true);
  };

  const handleLogout = async (signOutFn) => {
     try {
       if (player.autoUntil > 0 || player.buffUntil > 0) {
         await syncPlayer({ autoUntil: 0, buffUntil: 0 });
       }
       await signOutFn();
       adventure.setView('menu');
     } catch (e) {
       console.error("Logout error:", e);
     }
  };

  const engine = {
    user, player, syncPlayer, logs, addLog, currentTime,
    showGuide, setShowGuide, guideType, setGuideType,
    bossAvatarIdx, setBossAvatarIdx, showBossVideo, setShowBossVideo,
    showSuccessWindow, setShowSuccessWindow,
    forgeResult, setForgeResult,
    adventure, combat, actions, gameLoop, market, audio, wallet, 
    farcasterContext,
    leaderboard: leaderboardObj.leaderboard,
    updateLeaderboard: leaderboardObj.updateLeaderboard,

    db, appId, totalStats: dynamicStats, handleLogout, openGuide,
    TAVERN_MATES, MONSTERS, ITEMS, LOOTS, EQUIPMENT, MAPS, FRUITS, CRYSTLE_RECIPES, SHOP_ITEMS, LAB_RECIPES,
    BOSS, BOSS_MEDIA_FILES, SOUNDS
  };

  return (
    <GameContext.Provider value={engine}>
      {children}
    </GameContext.Provider>
  );
};
