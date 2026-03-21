import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { db, appId } from '../firebase';
import MONSTERS from '../data/monsters.json';
import EQUIPMENT from '../data/equipment.json';
import TAVERN_MATES from '../data/mates.json';
import SHOP_CONSUMABLES from '../data/shop.json';
import CRYSTLE_RECIPES from '../data/recipes.json';
import LOOTS from '../data/loots.json';
import MAPS from '../data/maps.json';
import FRUITS from '../data/fruits.json';

import {
  DIFFICULTY_MULTIPLIER, XP_BASE, AP_PER_LEVEL, PENALTY_DURATION,
  STUN_DURATION_NORMAL, STUN_DURATION_CRIT, DEFEAT_WINDOW_DURATION,
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
import { LoadingScreen } from '../components/LoadingScreen';

export const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

const forgeableIDs = CRYSTLE_RECIPES.map(r => r.id);
const SHOP_ITEMS = [...SHOP_CONSUMABLES, ...EQUIPMENT.filter(e => e.type !== 'Relic' && !forgeableIDs.includes(e.id))];

export const GameProvider = ({ children, user }) => {
  const [logs, setLogs] = useState(["Synchronizing with Metaverse..."]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [showGuide, setShowGuide] = useState(false);
  const [guideType, setGuideType] = useState('menu');
  const [bossAvatarIdx, setBossAvatarIdx] = useState(0);
  const [showBossVideo, setShowBossVideo] = useState(false);
  const [showSuccessWindow, setShowSuccessWindow] = useState(false);

  // Sync Timer for UI Clock
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(clockTimer);
  }, []);

  const addLog = useCallback((msg) => setLogs(prev => [msg, ...prev.slice(0, 7)]), []);

  // --- CORE SYSTEM INITIALIZATION ---
  const { player, setPlayer, syncPlayer, loadingPlayer } = usePlayerSync(user, db, appId);
  
  // Hooks initialization (these will execute even if loading, but result is handled below)
  const leaderboardObj = useLeaderboard(user, player, db, appId);
  const adventure = useAdventure();
  const audio = useAudioEngine(adventure.view, adventure.enemy?.isBoss);
  const actions = usePlayerActions(player, setPlayer, syncPlayer, addLog, audio.playSFX, SOUNDS, TAVERN_MATES);
  const market = useMarketplace(user, player, syncPlayer, addLog, audio.playSFX, SOUNDS, db, appId);

  const totalStats = useMemo(() => {
    if (!player) return calculateStats({ level: 1, baseStats: { str: 10, agi: 10, dex: 10 }, equipped: {} }, TAVERN_MATES, false, false);
    return calculateStats(player, TAVERN_MATES, false, false); 
  }, [player]);

  const combat = useCombat(
    user, player, syncPlayer, 
    adventure.enemy, adventure.setEnemy, adventure.enemyRef, adventure.spawnNewEnemy,
    totalStats, addLog, audio.playSFX, SOUNDS, leaderboardObj.updateLeaderboard, adventure.selectedMap,
    STUN_DURATION_NORMAL, STUN_DURATION_CRIT, PENALTY_DURATION, DEFEAT_WINDOW_DURATION,
    COMPANION_BUFF_DURATION, ELEMENT_ADVANTAGE, XP_BASE, AP_PER_LEVEL, EQUIPMENT, LOOTS,
    adventure.depth, adventure.setDepth, adventure.view, adventure.setView, 
    adventure.triggerFlinch, adventure.triggerHurt, TAVERN_MATES
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

  // Re-calculate stats with active buffs
  const dynamicStats = useMemo(() => {
    if (!player) return totalStats;
    return calculateStats(player, TAVERN_MATES, gameLoop.buffTimeLeft > 0, gameLoop.dragonTimeLeft > 0);
  }, [player, gameLoop.buffTimeLeft, gameLoop.dragonTimeLeft, totalStats]);

  useEffect(() => {
    combat.setPenaltyRemaining(gameLoop.penaltyRemaining);
  }, [gameLoop.penaltyRemaining]);

  // Loading Guard
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
    adventure, combat, actions, gameLoop, market, audio,
    leaderboard: leaderboardObj.leaderboard,
    updateLeaderboard: leaderboardObj.updateLeaderboard,

    db, appId, totalStats: dynamicStats, handleLogout, openGuide,
    TAVERN_MATES, MONSTERS, LOOTS, EQUIPMENT, MAPS, FRUITS, CRYSTLE_RECIPES, SHOP_ITEMS,
    BOSS, BOSS_MEDIA_FILES
  };

  return (
    <GameContext.Provider value={engine}>
      {children}
    </GameContext.Provider>
  );
};
