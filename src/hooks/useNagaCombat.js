import { useState, useRef, useCallback, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getHitChance, getDamage } from '../utils/gameLogic';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export const useNagaCombat = (
  db,
  player,
  gvgContext,
  addLog,
  playSFX,
  SOUNDS,
  setView,
  triggerHaptic,
  recordWarResult
) => {
   const [combatState, setCombatState] = useState('LOADING');
   const [warData, setWarData] = useState(null);
   
   const [myNaga, setMyNaga] = useState(null);
   const [enemyNaga, setEnemyNaga] = useState(null);
   const [mySide, setMySide] = useState(null);

   // Resonance Engine State
   const [resonanceScale, setResonanceScale] = useState(1.0);
   const [isResonating, setIsResonating] = useState(false);
   const [rageMeter, setRageMeter] = useState(0); // 0 to 100
   const [comboCount, setComboCount] = useState(0);
   const [perfectTiming, setPerfectTiming] = useState(false);

   const [critAlert, setCritAlert] = useState(false);
   const [impactSplash, setImpactSplash] = useState(null);
   const [playerImpactSplash, setPlayerImpactSplash] = useState(null);
   const [strikingSide, setStrikingSide] = useState(null);

   const [currentTaunt, setCurrentTaunt] = useState("");
   const [playerTaunt, setPlayerTaunt] = useState("");
   
   const [showDefeatedWindow, setShowDefeatedWindow] = useState(false);
   const [showVictoryWindow, setShowVictoryWindow] = useState(false);

   const combatBusRef = useRef(false);
   const resonanceTimerRef = useRef(null);

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
       startResonanceLoop();
     };

     initWar();

     return () => {
        if (resonanceTimerRef.current) clearInterval(resonanceTimerRef.current);
     };
   }, [db, gvgContext, player, setView, addLog]);

   // Resonance Loop Logic (Rhythm Ring)
   const startResonanceLoop = () => {
      let scale = 2.0;
      let growing = false;

      resonanceTimerRef.current = setInterval(() => {
         setResonanceScale(prev => {
             if (prev >= 2.0) return 0.8;
             return prev + 0.05;
         });
      }, 50);
   };

   const updateWarDatabase = async (newMyHp, newEnemyHp, isPerfectTiming = false) => {
      if (!gvgContext?.warId || !mySide || !myNaga || !enemyNaga) return;
      
      try {
         const callAction = httpsCallable(functions, 'secureGameAction');
         await callAction({
            action: 'PROCESS_NAGA_HIT',
            payload: {
               warId: gvgContext.warId,
               mySide,
               myUid: player.uid,
               enemyUid: gvgContext.opponentId,
               newMyHp,
               newEnemyHp,
               myMaxHp: myNaga.stats.totalMaxHp,
               enemyMaxHp: enemyNaga.stats.totalMaxHp,
               perfectTiming: isPerfectTiming
            }
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
       setCurrentTaunt(dmg > 200 ? "GRAAGH!" : "Hiss...");
       setTimeout(() => setCurrentTaunt(""), 2000);
     } else {
       setPlayerImpactSplash({ text: word, dmg, isCrit, id });
       setTimeout(() => setPlayerImpactSplash(prev => (prev?.id === id ? null : prev)), 400);
       if (triggerHaptic) triggerHaptic('rigid');
       setPlayerTaunt("Roar!");
       setTimeout(() => setPlayerTaunt(""), 2000);
     }
   }, [triggerHaptic]);

   const enemyTurn = useCallback(async (currentMyHp, currentEnemyHp) => {
     if (showDefeatedWindow || currentMyHp <= 0 || currentEnemyHp <= 0) return;

     setStrikingSide('monster');
     setTimeout(() => setStrikingSide(null), 300);

     // Hit Calculation
     let hitChance = getHitChance(enemyNaga.stats.dex, myNaga.stats.agi);
     hitChance = Math.max(85, Math.min(100, hitChance * 1.5)); 
     
     if (Math.random() * 100 < hitChance) {
       const isCrit = Math.random() < 0.10;
       const dmg = Math.floor(getDamage(enemyNaga.stats.str, myNaga.stats.agi, isCrit));

       if (playSFX) playSFX(SOUNDS?.monsterAttack);
       triggerHitEffects(dmg, isCrit, 'player');

       const newMyHp = Math.max(0, currentMyHp - dmg);
       setMyNaga(prev => ({ ...prev, currentHp: newMyHp }));
       await updateWarDatabase(newMyHp, currentEnemyHp);

       if (newMyHp <= 0) {
          setShowDefeatedWindow(true);
          setCombatState('DEFEATED');
          const dmgPct = Math.floor((1 - (currentEnemyHp / enemyNaga.stats.totalMaxHp)) * 100);
          if (recordWarResult) recordWarResult(gvgContext.warId, 0, gvgContext.opponentId, dmgPct);
          setTimeout(() => setView('syndicate'), 3000);
       }
     }
   }, [showDefeatedWindow, myNaga, enemyNaga, playSFX, SOUNDS, triggerHitEffects, updateWarDatabase, setView, recordWarResult, gvgContext]);

   const handleAttack = useCallback(async () => {
     if (combatState !== 'IDLE' || myNaga?.currentHp <= 0 || enemyNaga?.currentHp <= 0) return;
     
     const timingDiff = Math.abs(resonanceScale - 1.1);
     const isPerfect = timingDiff < 0.15;
     const isGood = timingDiff < 0.35;

     if (!isGood) {
        addLog("💨 RESONANCE MISALIGNED");
        setComboCount(0);
        setPerfectTiming(false);
        return;
     }

     setPerfectTiming(isPerfect);
     setIsResonating(true);
     setTimeout(() => setIsResonating(false), 200);

     setStrikingSide('player');
     setTimeout(() => setStrikingSide(null), 300);

     let hitChance = getHitChance(myNaga.stats.dex, enemyNaga.stats.agi);
     hitChance = Math.max(85, Math.min(100, hitChance * 1.5)); 

     const isCrit = isPerfect || (Math.random() < 0.15);
     let dmg = Math.floor(getDamage(myNaga.stats.str, enemyNaga.stats.agi, isCrit));
     
     const sideKey = mySide === 'defendersA' ? 'momentumA' : 'momentumB';
     if (warData?.[sideKey] >= 100) dmg = Math.floor(dmg * 1.25);

     if (isPerfect) {
        addLog(`✨ PERFECT RESONANCE [+20% RAGE]`);
        setRageMeter(prev => Math.min(100, prev + 20));
        setComboCount(prev => prev + 1);
        if (playSFX) playSFX(SOUNDS?.obtainLoot);
     } else {
        setRageMeter(prev => Math.min(100, prev + 5));
        setComboCount(0);
     }

     triggerHitEffects(dmg, isCrit, 'monster');
     if (playSFX) playSFX(SOUNDS?.playerAttack);

     const newEnemyHp = Math.max(0, enemyNaga.currentHp - dmg);
     setEnemyNaga(prev => ({ ...prev, currentHp: newEnemyHp }));

     await updateWarDatabase(myNaga.currentHp, newEnemyHp, isPerfect);

     if (newEnemyHp <= 0) {
        setShowVictoryWindow(true);
        setCombatState('VICTORY');
        if (recordWarResult) recordWarResult(gvgContext.warId, 3, gvgContext.opponentId, 100);
        setTimeout(() => setView('syndicate'), 2500);
     } else {
        if (Math.random() < 0.3 || isPerfect) {
           enemyTurn(myNaga.currentHp, newEnemyHp);
        }
     }
   }, [combatState, myNaga, enemyNaga, resonanceScale, warData, mySide, playSFX, SOUNDS, updateWarDatabase, enemyTurn, setView, recordWarResult, gvgContext]);

   const triggerUltimate = useCallback(async () => {
      if (rageMeter < 100 || combatState !== 'IDLE' || myNaga?.currentHp <= 0 || enemyNaga?.currentHp <= 0) return;
      
      setRageMeter(0);
      setCombatState('ULTIMATE');
      setPerfectTiming(true);
      
      addLog(`🔥 DRAGON GIGA-BLAST ACTIVATED!`);
      if (playSFX) playSFX(SOUNDS?.obtainLevel);

      const ultimateDmg = Math.floor(myNaga.stats.str * 3.5);
      triggerHitEffects(ultimateDmg, true, 'monster');
      
      const newEnemyHp = Math.max(0, enemyNaga.currentHp - ultimateDmg);
      setEnemyNaga(prev => ({ ...prev, currentHp: newEnemyHp }));
      await updateWarDatabase(myNaga.currentHp, newEnemyHp, true);

      setTimeout(() => {
         if (newEnemyHp <= 0) {
            setShowVictoryWindow(true);
            setCombatState('VICTORY');
            if (recordWarResult) recordWarResult(gvgContext.warId, 3, gvgContext.opponentId, 100);
            setTimeout(() => setView('syndicate'), 2500);
         } else {
            setCombatState('IDLE');
         }
      }, 1000);
   }, [rageMeter, combatState, myNaga, enemyNaga, playSFX, SOUNDS, triggerHitEffects, updateWarDatabase, setView, recordWarResult, gvgContext]);

   const handleRetreat = () => {
     setView('syndicate');
   };

   return {
     combatState, myNaga, enemyNaga, critAlert, impactSplash, playerImpactSplash, strikingSide, currentTaunt, playerTaunt,
     showDefeatedWindow, showVictoryWindow, handleAttack, handleRetreat,
     resonanceScale, isResonating, rageMeter, comboCount, perfectTiming, triggerUltimate, 
     momentum: warData?.[mySide === 'defendersA' ? 'momentumA' : 'momentumB'] || 0
   };
};
