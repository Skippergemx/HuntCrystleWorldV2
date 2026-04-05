import { useState, useRef, useCallback } from 'react';
import { scaleMonster } from '../utils/gameLogic';
import MONSTERS from '../data/monsters.json';
import MAPS from '../data/maps.json';

export const useAdventure = () => {
  const [view, setView] = useState('menu');
  const [depth, setDepth] = useState(1);
  const [enemy, setEnemy] = useState(null);
  const [enemyFlinch, setEnemyFlinch] = useState(false);
  const [isHurt, setIsHurt] = useState(false);
  
  const [selectedMap, setSelectedMap] = useState(MAPS[0]);
  
  const enemyInternalRef = useRef(null);
  
  const spawnNewEnemy = useCallback((currentDepth = 1) => {
    // Filter monsters by the current map's name if available
    const folderName = selectedMap?.name || 'Neon Slums';
    const pool = MONSTERS.filter(m => m.folder === folderName);
      
    // Fallback to Neon Slums ONLY if the specific map has 0 monsters defined
    const finalPool = pool.length > 0 ? pool : MONSTERS.filter(m => m.folder === 'Neon Slums');
    
    const base = finalPool[Math.floor(Math.random() * finalPool.length)];
    const scaled = scaleMonster(base, currentDepth);
    setEnemy(scaled);
    enemyInternalRef.current = scaled;
  }, [selectedMap]);

  const triggerFlinch = () => {
    setEnemyFlinch(true);
    setTimeout(() => setEnemyFlinch(false), 300);
  };

  const triggerHurt = () => {
    setIsHurt(true);
    setTimeout(() => setIsHurt(false), 300);
  };

  const setEnemyWithRef = (newEnemy) => {
    if (typeof newEnemy === 'function') {
      setEnemy(prev => {
        const updated = newEnemy(prev);
        enemyInternalRef.current = updated;
        return updated;
      });
    } else {
      setEnemy(newEnemy);
      enemyInternalRef.current = newEnemy;
    }
  };

  const getParentView = (currentView) => {
    switch (currentView) {
      case 'dungeon': return 'map';
      case 'map': return 'menu';
      case 'boss': return 'menu';
      case 'pvp': return 'menu';
      default: return 'menu';
    }
  };

  const goBack = () => {
    setView(getParentView(view));
  };

  return {
    view,
    setView,
    goBack,
    depth,
    setDepth,
    enemy,
    setEnemy: setEnemyWithRef,
    enemyFlinch,
    isHurt,
    enemyRef: enemyInternalRef,
    spawnNewEnemy,
    triggerFlinch,
    triggerHurt,
    selectedMap,
    setSelectedMap,
    handleSkip: () => spawnNewEnemy(depth)
  };
};
