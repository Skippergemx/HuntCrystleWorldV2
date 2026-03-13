import { useState, useRef, useCallback } from 'react';
import { scaleMonster } from '../utils/gameLogic';
import MONSTERS from '../data/monsters.json';

export const useAdventure = () => {
  const [view, setView] = useState('menu');
  const [depth, setDepth] = useState(1);
  const [enemy, setEnemy] = useState(null);
  const [enemyFlinch, setEnemyFlinch] = useState(false);
  const [isHurt, setIsHurt] = useState(false);
  
  const [selectedMap, setSelectedMap] = useState(null);
  
  const enemyInternalRef = useRef(null);
  
  const spawnNewEnemy = useCallback((currentDepth = 1) => {
    const base = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
    const scaled = scaleMonster(base, currentDepth);
    setEnemy(scaled);
    enemyInternalRef.current = scaled;
  }, []);

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

  return {
    view,
    setView,
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
    setSelectedMap
  };
};
