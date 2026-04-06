import { useState, useRef, useCallback, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getHitChance, getDamage } from '../utils/gameLogic';

export const useNagaCombat = (
  db,
  player,
  gvgContext,
  addLog,
  playSFX,
  SOUNDS,
  setView,
  triggerHaptic
) => {
  const [combatState, setCombatState] = useState('LOADING');
  const [warData, setWarData] = useState(null);
  
  const [myNaga, setMyNaga] = useState(null);
  const [enemyNaga, setEnemyNaga] = useState(null);
  const [mySide, setMySide] = useState(null);

  const [critAlert, setCritAlert] = useState(false);
  const [stunTimeLeft, setStunTimeLeft] = useState(0);
  const [missTimeLeft, setMissTimeLeft] = useState(0);
  const [impactSplash, setImpactSplash] = useState(null);
  const [playerImpactSplash, setPlayerImpactSplash] = useState(null);
  const [strikingSide, setStrikingSide] = useState(null);

  const [currentTaunt, setCurrentTaunt] = useState("");
  const [playerTaunt, setPlayerTaunt] = useState("");
  
  const [showDefeatedWindow, setShowDefeatedWindow] = useState(false);
  const [showVictoryWindow, setShowVictoryWindow] = useState(false);

  const combatBusRef = useRef(false);

  // Initialize Combat Sync
  useEffect(() => {
    if (!gvgContext?.warId || !gvgContext?.opponentId) {
      setView('syndicate');
      return;
    }

    const initWar = async () => {
      const warRef = doc(db, 'guild_wars', gvgContext.warId);
      const snap = await getDoc(warRef);
      if (!snap.exists()) {
        setView('syndicate');
        return;
      }
      const data = snap.data();
      setWarData(data);
      
      const side = data.guildA === player.guildId ? 'defendersA' : 'defendersB';
      const oppSide = side === 'defendersA' ? 'defendersB' : 'defendersA';

      setMySide(side);
      setMyNaga(data[side]?.[player.uid]);
      setEnemyNaga(data[oppSide]?.[gvgContext.opponentId]);
      
      if (!data[side]?.[player.uid]) {
         addLog("🚨 UNAUTHORIZED: Your Naga is not enrolled in this war.");
         setView('syndicate');
         return;
      }

      setCombatState('IDLE');
    };

    initWar();
  }, [db, gvgContext, player, setView, addLog]);

  const updateWarDatabase = async (newMyHp, newEnemyHp) => {
     if (!gvgContext?.warId || !mySide || !myNaga || !enemyNaga) return;
     const oppSide = mySide === 'defendersA' ? 'defendersB' : 'defendersA';
     const warRef = doc(db, 'guild_wars', gvgContext.warId);
     
     try {
        await updateDoc(warRef, {
           [`${mySide}.${player.uid}.currentHp`]: newMyHp,
           [`${oppSide}.${gvgContext.opponentId}.currentHp`]: newEnemyHp
        });
     } catch (e) {
        console.error("Combat Sync Error:", e);
     }
  };

  const triggerHitEffects = useCallback((dmg, isCrit, side = 'monster') => {
    const impactWords = ["BAM!", "POW!", "WHACK!", "SMASH!", "KABOOM!", "ZAP!", "SLAM!", "CRUNCH!", "KRAK!"];
    const word = impactWords[Math.floor(Math.random() * impactWords.length)];
    const id = Date.now();

    if (side === 'monster') {
      setImpactSplash({ text: word, dmg, isCrit, id });
      setTimeout(() => setImpactSplash(prev => (prev?.id === id ? null : prev)), 400);
      if (triggerHaptic) triggerHaptic(isCrit ? 'heavy' : 'medium');
      setCurrentTaunt("Hiss! Damage sustained!");
    } else {
      setPlayerImpactSplash({ text: word, dmg, isCrit, id });
      setTimeout(() => setPlayerImpactSplash(prev => (prev?.id === id ? null : prev)), 400);
      if (triggerHaptic) triggerHaptic('rigid');
      setPlayerTaunt("Roar! Armor compromised!");
    }
  }, [triggerHaptic]);

  const enemyTurn = useCallback(async (currentMyHp, currentEnemyHp) => {
    if (showDefeatedWindow || currentMyHp <= 0 || currentEnemyHp <= 0) {
      setCombatState('IDLE');
      combatBusRef.current = false;
      return;
    }

    setCombatState('ENEMY_TURN');

    setTimeout(async () => {
      setStrikingSide('monster');
      setTimeout(() => setStrikingSide(null), 300);

      // Hit Calculation
      let hitChance = getHitChance(enemyNaga.stats.dex, myNaga.stats.agi);
      hitChance = Math.max(85, Math.min(100, hitChance * 1.5)); // Base GVG boost
      
      if (Math.random() * 100 < hitChance) {
        const isCrit = Math.random() < 0.10;
        const dmg = Math.floor(getDamage(enemyNaga.stats.str, myNaga.stats.agi, isCrit));

        if (isCrit) { 
          addLog(`⚠️ CRITICAL COUNTER!`); 
          setCritAlert(true); 
          setTimeout(() => setCritAlert(false), 800); 
        }

        addLog(`⚠️ ${enemyNaga.name} retaliated for ${dmg} DMG!`);
        if (playSFX) playSFX(SOUNDS?.monsterAttack);
        
        triggerHitEffects(dmg, isCrit, 'player');

        const newMyHp = Math.max(0, currentMyHp - dmg);
        setMyNaga(prev => ({ ...prev, currentHp: newMyHp }));

        await updateWarDatabase(newMyHp, currentEnemyHp);

        setTimeout(() => {
          if (newMyHp <= 0) {
            setShowDefeatedWindow(true);
            setCombatState('DEFEATED');
            setTimeout(() => setView('syndicate'), 3000);
          } else {
            setCombatState('IDLE');
            combatBusRef.current = false;
          }
        }, 500);

      } else {
        addLog(`🛡️ Your Naga dodged ${enemyNaga.name}'s strike!`);
        setTimeout(() => {
          setCurrentTaunt("Missed...");
          setPlayerTaunt("Pathetic aim!");
          setCombatState('IDLE');
          combatBusRef.current = false;
        }, 500);
      }
    }, 400);
  }, [showDefeatedWindow, myNaga, enemyNaga, addLog, playSFX, SOUNDS, triggerHitEffects, updateWarDatabase, setView]);

  const handleAttack = useCallback(async () => {
    if (combatBusRef.current || combatState !== 'IDLE' || myNaga?.currentHp <= 0 || enemyNaga?.currentHp <= 0) return;
    
    combatBusRef.current = true;
    setCombatState('PLAYER_ATTACKING');

    setStrikingSide('player');
    setTimeout(() => setStrikingSide(null), 300);

    let hitChance = getHitChance(myNaga.stats.dex, enemyNaga.stats.agi);
    hitChance = Math.max(85, Math.min(100, hitChance * 1.5)); 

    if (Math.random() * 100 < hitChance) {
      const isCrit = Math.random() < 0.15;
      const dmg = Math.floor(getDamage(myNaga.stats.str, enemyNaga.stats.agi, isCrit));

      if (isCrit) addLog(`✨ CRITICAL STRIKE!`);

      triggerHitEffects(dmg, isCrit, 'monster');
      setPlayerTaunt("Draconic Strike!");
      addLog(`Your Naga struck ${enemyNaga.name} for ${dmg} DMG.`);
      if (playSFX) playSFX(SOUNDS?.playerAttack);

      const newEnemyHp = Math.max(0, enemyNaga.currentHp - dmg);
      setEnemyNaga(prev => ({ ...prev, currentHp: newEnemyHp }));

      await updateWarDatabase(myNaga.currentHp, newEnemyHp);

      setTimeout(() => {
        if (newEnemyHp <= 0) {
          setShowVictoryWindow(true);
          setCombatState('VICTORY');
          setTimeout(() => setView('syndicate'), 2500);
        } else {
          enemyTurn(myNaga.currentHp, newEnemyHp);
        }
      }, 500);

    } else {
      addLog(`Missed strike on ${enemyNaga.name}!`);
      setMissTimeLeft(0.8);
      setPlayerTaunt("Blast, missed!");
      setCurrentTaunt("Too slow!");
      setTimeout(() => enemyTurn(myNaga.currentHp, enemyNaga.currentHp), 500);
    }
  }, [combatState, myNaga, enemyNaga, addLog, triggerHitEffects, playSFX, SOUNDS, updateWarDatabase, enemyTurn, setView]);

  const handleRetreat = () => {
    setView('syndicate');
  };

  return {
    combatState,
    myNaga,
    enemyNaga,
    critAlert,
    stunTimeLeft,
    missTimeLeft,
    impactSplash,
    playerImpactSplash,
    strikingSide,
    currentTaunt,
    playerTaunt,
    showDefeatedWindow,
    showVictoryWindow,
    handleAttack,
    handleRetreat
  };
};
