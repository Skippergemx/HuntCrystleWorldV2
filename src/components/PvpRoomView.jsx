import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, X, Trophy, Skull, Sword, Shield, Zap, Target, Flame, Heart, Send, MessageSquare, Check, Sparkles } from 'lucide-react';
import { doc, setDoc, deleteDoc, onSnapshot, collection, query, where, getFirestore, increment, updateDoc, getDoc } from 'firebase/firestore';
import { Header, AvatarMedia, SquadHUD } from './GameUI';
import { useGame } from '../contexts/GameContext';
import { SOUNDS } from '../hooks/useAudioEngine';
import React from 'react';

/**
 * PvpRoomView V2: Real-time Combat Arena
 * Unified root-level collections for 'pvp_room' and 'global_chat'.
 */
const PlayerCard = React.memo(({ p, isSelf, combatAnim, floatingNums = [], onAttack }) => {
  const hpPercent = Math.min(100, Math.max(0, (p.hp / (p.maxHp || 100)) * 100));
  const isTarget = !!combatAnim;
  return (
    <div onClick={() => !isSelf && onAttack()} className={`relative group cursor-pointer transition-all duration-300 ${(p.isDefeated || p.hp <= 0) ? 'opacity-30' : ''} ${isTarget ? 'scale-105' : ''}`}>
      <div className={`absolute inset-0 border-[3px] md:border-4 border-black transition-colors ${isTarget && combatAnim.type === 'hit' ? 'bg-red-500/20' : 'bg-slate-800'}`}></div>
      <div className="absolute inset-0 border-r-4 md:border-r-8 border-b-4 md:border-b-8 border-black/20 pointer-events-none"></div>
      <div className="relative p-2 md:p-3 flex flex-col items-center">
          <span className="absolute top-1 md:top-2 left-1 md:left-2 bg-black text-white text-[7px] md:text-[8px] font-black px-1.5 py-0.5 border border-white/10 uppercase italic">LVL {p.level}</span>
          {isSelf && <span className="absolute top-1 md:top-2 right-1 md:right-2 bg-blue-600 text-white text-[7px] md:text-[8px] font-black px-1.5 py-0.5 border border-white/10 uppercase italic">YOU</span>}
          
          <div className="w-16 h-20 md:w-24 md:h-28 border-2 md:border-4 border-black overflow-hidden bg-slate-900 relative mt-4 md:mt-6">
              <AvatarMedia num={p.avatar} animated={!p.isDefeated && p.hp > 0} className="w-full h-full object-cover object-top" />
              {(p.isDefeated || p.hp <= 0) && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"><Skull size={24} className="text-white animate-pulse md:hidden" /><Skull size={40} className="text-white animate-pulse hidden md:block" /></div>}
              {isTarget && combatAnim.type === 'hit' && <div className="absolute inset-0 flex items-center justify-center animate-ping"><Sword size={24} className="text-white drop-shadow-[0_0_15px_red] md:hidden" /><Sword size={48} className="text-white drop-shadow-[0_0_15px_red] hidden md:block" /></div>}
          </div>
          
          <h3 className="text-[9px] md:text-[11px] font-black text-white uppercase italic tracking-tighter mt-2 md:mt-3 mb-1 md:mb-2 truncate w-full text-center">{p.name}</h3>
          
          {/* HP Bar */}
          <div className="w-full bg-black/80 border md:border-2 border-black h-3 md:h-4 rounded-full overflow-hidden relative shadow-inner">
              <div className={`h-full transition-all duration-500 ${hpPercent < 40 ? 'bg-red-600' : 'bg-cyan-500'}`} style={{ width: `${hpPercent}%` }}></div>
              <span className="absolute inset-0 flex items-center justify-center text-[7px] md:text-[8px] font-black text-white uppercase italic drop-shadow-md">{Math.max(0, Math.ceil(p.hp))} HP</span>
          </div>

          {/* Visual Feedback Text (Comic) */}
          {combatAnim && (
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none transition-all ${
              combatAnim.type === 'hit' ? 'animate-bounce' : 'animate-pulse'
            }`}>
              <div className={`font-black italic uppercase drop-shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col items-center gap-0.5 ${
                combatAnim.type === 'hit' ? 'text-yellow-400 text-2xl md:text-3xl scale-125 rotate-[-15deg]' : 'text-slate-300 text-2xl md:text-3xl scale-90 rotate-[10deg]'
              }`} style={{ WebkitTextStroke: '1px black' }}>
                {combatAnim.text}
                {combatAnim.damage && <span className="text-red-400 text-lg md:text-2xl">-{combatAnim.damage}</span>}
              </div>
            </div>
          )}
          {floatingNums.map(n => (
            <div key={n.id} className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none pvp-float-up font-black italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)] ${
              n.isCrit ? 'text-yellow-400 text-xl' : 'text-red-400 text-lg'
            }`}>-{n.value}</div>
          ))}
      </div>
    </div>
  );
});

export const PvpRoomView = React.memo(() => {
  const { player, syncPlayer, adventure, gameLoop, TAVERN_MATES, totalStats, db, user, addLog, openGuide, audio } = useGame();
  const { setView } = adventure;
  const { dragonTimeLeft } = gameLoop;
  const { playSFX } = audio;

  const [players, setPlayers] = useState([]);
  const [penaltyTime, setPenaltyTime] = useState(0);
  const attackCooldownRef = useRef(false);
  const [combatAnim, setCombatAnim] = useState(null);
  const [isJoining, setIsJoining] = useState(true);
  const [floatingNumbers, setFloatingNumbers] = useState([]);
  const [pvpKills, setPvpKills] = useState(0);
  const [defeatSummaryData, setDefeatSummaryData] = useState(null);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_pvp_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "The Battle Grid",
      npc: 1,
      visualType: 'grid',
      text: "You have entered a highly unstable PvP Sector. Here, you are placed in a live sharded environment with other active hunters.",
      hint: "Tip: The grid synchronizes in real-time."
    },
    {
      title: "Live Combat",
      npc: 11,
      visualType: 'combat',
      text: "Tap on any networked enemy to initiate a strike! Your Strength (STR) dictates your damage, while Agility (AGI) increases dodge chances against incoming hits.",
      hint: "Strategy: Watch their HP bars and exploit weak targets."
    },
    {
      title: "System Defeat",
      npc: 17,
      visualType: 'penalty',
      text: "If your core HP reaches zero, you will face a fatal crash. Defeat results in an immediate ejection and a 30-second grid lockout penalty.",
      hint: "Warning: Retreat via the EXIT button before HP hits 0!"
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_pvp_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  // Sharding: Randomly assign user to a distinct Grid to limit Firestore read burst.
  const GRIDS = ['Alpha', 'Beta', 'Omega', 'Sigma'];
  const gridId = useMemo(() => GRIDS[Math.floor(Math.random() * GRIDS.length)], []);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef(null);

  const pvpPenaltyKey = 'pvp_penalty_until';
  const hasPenalty = player[pvpPenaltyKey] && player[pvpPenaltyKey] > Date.now();

  // 1. Penalty Countdown
  useEffect(() => {
    if (hasPenalty) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((player[pvpPenaltyKey] - Date.now()) / 1000);
        if (remaining <= 0) {
          setPenaltyTime(0);
          clearInterval(interval);
        } else {
          setPenaltyTime(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [player[pvpPenaltyKey], hasPenalty]);

  const [lastProcessedHitId, setLastProcessedHitId] = useState(null);

  // 2. Room Presence (Join/Leave)
  useEffect(() => {
    if (hasPenalty || !user?.uid) return;
    const pvpDocRef = doc(db, 'pvp_room', user.uid);

    const joinRoom = async () => {
      try {
        console.log("System V2: Broadcasting Combat Signal...");
        await setDoc(pvpDocRef, {
          uid: user.uid,
          name: player.name,
          level: player.level,
          avatar: player.avatar,
          hp: totalStats.maxHp,
          maxHp: totalStats.maxHp,
          stats: totalStats,
          hiredMate: player.hiredMate,
          dragonSummoned: dragonTimeLeft > 0,
          gemx: player.gemx,
          gemxAvatar: player.gemxAvatar,
          lastAction: Date.now(),
          lastHitBy: null,
          lastHitId: null,
          isDefeated: false,
          gridId: gridId
        });
        setIsJoining(false);
      } catch (err) {
        console.error("PVP Join Error:", err);
        addLog("🚨 ERROR: Failed to synchronize with Battle Grid.");
      adventure.goBack();
      }
    };
    joinRoom();

    return () => {
      console.log("System V2: Withdrawing Combat Signal...");
      deleteDoc(pvpDocRef).catch(console.error);
    };
  }, [db, user.uid, hasPenalty, gridId]); // Minimal dependencies to prevent unmount/remount flicker

  // 2b. Stats sync (No delete logic here)
  useEffect(() => {
    if (hasPenalty || !user?.uid || isJoining) return;
    const pvpDocRef = doc(db, 'pvp_room', user.uid);
    updateDoc(pvpDocRef, {
      name: player.name,
      level: player.level,
      avatar: player.avatar,
      hp: player.hp || totalStats.maxHp,
      maxHp: totalStats.maxHp,
      stats: totalStats,
      hiredMate: player.hiredMate,
      dragonSummoned: dragonTimeLeft > 0,
      gemx: player.gemx,
      gemxAvatar: player.gemxAvatar,
      lastAction: Date.now()
    }).catch(err => console.warn("PVP Update Sync Lag:", err));
  }, [player.name, player.level, player.avatar, player.hp, player.maxHp, totalStats, player.hiredMate, dragonTimeLeft, player.gemx, player.gemxAvatar, user?.uid, isJoining, hasPenalty]);

  // 2c. Heartbeat Mechanism (Ghost Fix)
  useEffect(() => {
    if (hasPenalty || !user?.uid || isJoining) return;
    const pvpDocRef = doc(db, 'pvp_room', user.uid);
    const interval = setInterval(() => {
      updateDoc(pvpDocRef, { lastAction: Date.now() }).catch(() => {});
    }, 10000); // 10s heartbeat
    return () => clearInterval(interval);
  }, [db, user?.uid, isJoining, hasPenalty]);

  // 3. Room Listener (V2: Root Path with Sharding and Garbage Collection)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'pvp_room'), where('gridId', '==', gridId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const pList = snapshot.docs
        .map(d => d.data())
        // Garbage Collection: Filter out players whose heartbeat died > 25 seconds ago
        .filter(p => !p.lastAction || (now - p.lastAction) < 25000);
        
      setPlayers(pList);

      const self = pList.find(p => p.uid === user.uid);
      if (self) {
        // [VITAL SYNC] Force local player engine HP to match Room HP
        // This prevents the "Sudden Death" effect by keeping the main HUD in sync with the Battle Grid
        if (Math.ceil(self.hp) !== Math.ceil(player.hp)) {
          syncPlayer({ hp: Math.max(0, self.hp) });
        }

        if (self.hp <= 0 && !self.isDefeated) {
          handleDefeatState(self);
        } else if (self.lastHitBy && self.lastHitId !== lastProcessedHitId) {
          const hitId = self.lastHitId;
          const attackerId = self.lastHitBy;
          setLastProcessedHitId(hitId);
          
          // Show damage effect on the local player
          const hitTextOptions = ['OUCH!', 'ARGH!', 'UGH!', 'GAH!'];
          const feedbackText = hitTextOptions[Math.floor(Math.random() * hitTextOptions.length)];
          setCombatAnim({ targetId: user.uid, type: 'hit', text: feedbackText });
          setTimeout(() => setCombatAnim(null), 800);

          // Pass the fresh pList to ensure we find the attacker with current data
          processCounterAttack(attackerId, pList);
        }
      }
    });
    return () => unsubscribe();
  }, [db, user.uid, lastProcessedHitId, gridId]);

  // 4. Global Chat Listener (V2: Root Path)
  useEffect(() => {
    const q = collection(db, 'global_chat');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-50);
      setMessages(msgList);
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !user?.uid) return;

    const msg = chatInput.trim();
    setChatInput("");

    try {
      const chatDocRef = doc(collection(db, 'global_chat'));
      await setDoc(chatDocRef, {
        uid: user.uid,
        name: player.name,
        text: msg,
        timestamp: Date.now()
      });
    } catch (err) { console.error("Chat Error:", err); }
  };

  const handleDefeatState = useCallback(async (selfData) => {
    if (!user?.uid) return;
    const targetRef = doc(db, 'pvp_room', user.uid);
    await updateDoc(targetRef, { isDefeated: true, hp: 0 });

    const until = Date.now() + 30000;
    await syncPlayer({ [pvpPenaltyKey]: until });

    const killer = players.find(p => p.uid === selfData?.lastHitBy);
    setDefeatSummaryData({
      killerName: killer?.name || 'Unknown Hunter',
      gridId,
      kills: pvpKills,
    });

    addLog("💀 DISCONNECTED: You have been neutralized in the Grid.");
    setTimeout(() => deleteDoc(targetRef).catch(() => {}), 1000);
  }, [user?.uid, db, syncPlayer, players, gridId, pvpKills, addLog]);

  const triggerFloatingNumber = useCallback((value, isCrit, targetId) => {
    const id = Date.now() + Math.random();
    setFloatingNumbers(prev => [...prev, { id, value, isCrit, targetId }]);
    setTimeout(() => setFloatingNumbers(prev => prev.filter(n => n.id !== id)), 1200);
  }, []);

  const attackPlayer = useCallback(async (target) => {
    if (attackCooldownRef.current || !user?.uid || target.uid === user.uid || target.isDefeated || target.hp <= 0) return;

    attackCooldownRef.current = true;
    setTimeout(() => { attackCooldownRef.current = false; }, 1500);

    const hitChance = Math.min(98, (totalStats.dex / (totalStats.dex + target.stats.agi * 0.4)) * 100);
    const isHit = Math.random() * 100 < hitChance;
    const targetRef = doc(db, 'pvp_room', target.uid);
    const hitTextOptions = ['BAM!', 'POW!', 'WHACK!', 'SPLAT!'];
    const missTextOptions = ['SWOOSH!', 'DODGE!', 'MISS!', 'WHOOSH!'];

    if (isHit) {
      const baseDmg = Math.max(5, totalStats.str - Math.floor(target.stats.agi / 6));
      const isCrit = Math.random() < 0.1;
      const dmg = isCrit ? Math.floor(baseDmg * 1.5) : baseDmg;
      const feedbackText = isCrit ? '💥 CRIT!' : hitTextOptions[Math.floor(Math.random() * hitTextOptions.length)];

      setCombatAnim({ targetId: target.uid, type: 'hit', text: feedbackText, damage: dmg });
      setTimeout(() => setCombatAnim(null), 800);

      triggerFloatingNumber(dmg, isCrit, target.uid);
      playSFX(SOUNDS.playerAttack);

      const isKill = (target.hp - dmg) <= 0;
      if (isKill) {
        playSFX(SOUNDS.skillTrigger);
        setPvpKills(prev => prev + 1);
        addLog(`☠️ ELIMINATED: ${target.name} neutralized! (+1 Kill)`);
      } else {
        addLog(`⚔️ STRIKE: Dealt ${dmg}${isCrit ? ' (CRIT)' : ''} DMG to ${target.name}.`);
      }

      await updateDoc(targetRef, {
        hp: increment(-dmg),
        lastHitBy: user.uid,
        lastHitId: Date.now() + Math.random(),
        lastAction: Date.now()
      });
    } else {
      const feedbackText = missTextOptions[Math.floor(Math.random() * missTextOptions.length)];
      setCombatAnim({ targetId: target.uid, type: 'miss', text: feedbackText });
      setTimeout(() => setCombatAnim(null), 800);
      addLog(`🛡️ DEFLECTED: Strike avoided by ${target.name}.`);
    }
  }, [user?.uid, db, totalStats, addLog, playSFX, triggerFloatingNumber]);

  const processCounterAttack = useCallback(async (attackerId, currentPlayers) => {
    // Determine the attacker from the current snapshot data
    const attacker = (currentPlayers || players).find(p => p.uid === attackerId);
    if (!attacker || attacker.isDefeated || attacker.hp <= 0) return;

    // Slight tactical delay before countering (feels more natural)
    setTimeout(() => {
      // Re-verify attacker is still in the room before striking
      addLog(`⚡ COUNTER-STRIKE: Retaliating against ${attacker.name}...`);
      attackPlayer(attacker);
    }, 600 + Math.random() * 400); // Randomized delay between 600-1000ms
  }, [players, attackPlayer, addLog]);

  if (hasPenalty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/80 backdrop-blur-md">
        <Skull size={80} className="text-red-500 mb-6 animate-pulse" />
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">ACCESS SUSPENDED</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase mb-8 tracking-[0.2em]">Penalty Core Recharging...</p>
        <div className="text-6xl font-black text-red-600 italic tracking-tighter animate-pulse">{penaltyTime}s</div>
        <button onClick={adventure.goBack} className="mt-12 bg-slate-800 text-white border-2 border-white/20 px-10 py-3 font-black uppercase italic tracking-widest shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">Return to Hub</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900 font-comic h-full min-h-[500px]">
       <Header title="NEON ARENA: PVP GRID" npcNum={13} onClose={adventure.goBack} onHelp={() => {
         setTutorialStep(0);
         setShowTutorial(true);
       }}>
          <div className="flex items-center gap-1 md:gap-2 px-1 md:px-4 py-0.5 md:py-2 bg-black/60 rounded-full border border-green-500/30 backdrop-blur-md scale-[0.7] md:scale-100">
            <span className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-[7px] md:text-[10px] font-black text-white italic uppercase truncate max-w-[80px] md:max-w-none">SIGNAL_LIVE: {gridId}</span>
          </div>
       </Header>

       {/* Arena Status Header */}
       <div className="mx-2 md:mx-4 mt-1 md:mt-2 p-2 md:p-4 bg-black/40 border-[3px] md:border-4 border-black rounded-xl md:rounded-2xl flex justify-between items-center shadow-[4px_4px_0_rgba(0,0,0,0.5)] z-10 shrink-0">
         <div>
            <p className="text-[8px] md:text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none">Sector {gridId} Activity</p>
            <p className="text-sm md:text-2xl font-black text-white uppercase italic tracking-tighter mt-1">Active: {players.length}</p>
         </div>
         <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 bg-black rounded-full border border-green-500/30">
           <span className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-green-500 rounded-full animate-ping"></span>
           <span className="text-[8px] md:text-[10px] font-black text-white italic uppercase">Signal Secured</span>
         </div>
       </div>

       {/* Grid Combatants */}
       <div className="flex-1 overflow-y-auto p-2 md:p-4 flex flex-col custom-scrollbar">
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 ${showChat ? 'pb-72' : 'pb-32'}`}>
             {players.map(p => (
               <PlayerCard 
                 key={p.uid} 
                 p={p} 
                 isSelf={p.uid === user.uid} 
                 isTarget={false}
                 combatAnim={combatAnim?.targetId === p.uid ? combatAnim : null}
                 floatingNums={floatingNumbers.filter(n => n.targetId === p.uid)}
                 onAttack={() => attackPlayer(p)} 
               />
             ))}
          </div>
       </div>

       {/* Chat Terminal */}
       {showChat && (
         <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 right-2 md:right-4 h-48 md:h-52 bg-slate-900/95 border-4 border-black rounded-2xl md:rounded-3xl shadow-[6px_6px_0_rgba(0,0,0,0.5)] flex flex-col overflow-hidden backdrop-blur-xl z-50">
            <div className="bg-black/60 px-3 md:px-4 py-1 md:py-2 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2">
                  <MessageSquare size={12} className="text-cyan-400" />
                  <span className="text-[8px] md:text-[10px] font-black text-white/80 uppercase italic tracking-widest">Global Terminal</span>
                </div>
                <button onClick={() => setShowChat(false)} className="text-white/20 hover:text-white p-1"><X size={14} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar flex flex-col">
               {messages.map(m => (
                 <div key={m.id} className={`flex flex-col ${m.uid === user.uid ? 'items-end' : 'items-start'}`}>
                    <span className="text-[8px] font-black uppercase text-white/30 italic mb-1">{m.name}</span>
                    <div className={`max-w-[85%] p-3 border-4 border-black font-black text-[10px] shadow-[4px_4px_0_rgba(0,0,0,0.3)] ${m.uid === user.uid ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-white'}`}>{m.text}</div>
                 </div>
               ))}
               <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 flex gap-3 bg-black/60 border-t-4 border-black">
               <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type encryption message..." className="flex-1 bg-transparent border-none text-[10px] font-black text-white italic focus:outline-none placeholder:text-white/10 uppercase" />
               <button type="submit" className="bg-cyan-600 border-2 border-black p-2 rounded-xl text-white hover:bg-cyan-500 transition-all"><Send size={18} /></button>
            </form>
         </div>
       )}

       {!showChat && (
         <button onClick={() => setShowChat(true)} className="absolute bottom-8 right-8 w-16 h-16 bg-cyan-600 border-4 border-black rounded-full shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50">
            <MessageSquare size={24} />
         </button>
       )}

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-cyan-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-cyan-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-black text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(255,255,255,0.3)]">
                  {tutorialSteps[tutorialStep].title}
                </h2>
                <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">
                  Step {tutorialStep + 1} / {tutorialSteps.length}
                </div>
              </div>

              {/* NPC & Topic Visual Section */}
              <div className="py-3 md:py-4 relative flex justify-center items-center gap-3 w-full z-10">
                {/* NPC Avatar */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0 flex items-center justify-center">
                   <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                   <div className="absolute inset-x-0 bottom-0 bg-cyan-600 text-[6px] font-black text-black text-center py-0.5 uppercase italic">COMMANDER</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-cyan-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'grid' && (
                     <Target className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] z-10 animate-pulse" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'combat' && (
                     <Sword className="text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'penalty' && (
                     <Skull className="text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-cyan-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-cyan-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-cyan-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-cyan-500' : 'bg-slate-800'}`}
                   >
                     {dontShowAgain && <Check size={10} className="text-white" />}
                   </button>
                   <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                     Don't show this briefing again
                   </span>
                </div>

                <div className="flex gap-2 shrink-0 pb-1">
                   {tutorialStep > 0 && (
                      <button
                        onClick={() => setTutorialStep(prev => prev - 1)}
                        className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[9px]"
                      >
                        BACK
                      </button>
                   )}
                  <button
                    onClick={nextStep}
                    className="flex-[2] bg-cyan-600 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-cyan-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'ENTER GRID' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PVP Defeat Summary Modal */}
      {defeatSummaryData && (
        <div className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in zoom-in duration-300">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-0 bg-red-800 rounded-3xl transform translate-x-2 translate-y-2" />
            <div className="relative bg-slate-950 border-[4px] border-black rounded-3xl overflow-hidden flex flex-col">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f87171 1px, transparent 1px)', backgroundSize: '8px 8px' }} />

              {/* Header */}
              <div className="w-full bg-red-600 py-5 border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg">
                <h2 className="text-4xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">NEUTRALIZED</h2>
                <div className="absolute -bottom-3 right-6 bg-black text-white px-3 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] transform rotate-2 border-2 border-white">Grid Ejection</div>
              </div>

              {/* Stats */}
              <div className="p-6 space-y-4 relative z-10">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center bg-black/40 rounded-xl p-2 border border-white/5">
                    <span className="text-[7px] font-black text-slate-500 uppercase">Sector</span>
                    <span className="text-sm font-black text-white italic">Grid {defeatSummaryData.gridId}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black/40 rounded-xl p-2 border border-white/5">
                    <span className="text-[7px] font-black text-slate-500 uppercase">Kills</span>
                    <span className="text-sm font-black text-amber-400 italic">{defeatSummaryData.kills}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black/40 rounded-xl p-2 border border-white/5">
                    <span className="text-[7px] font-black text-slate-500 uppercase">Penalty</span>
                    <span className="text-sm font-black text-red-400 italic">30s</span>
                  </div>
                </div>

                <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-3">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Eliminated by</p>
                  <p className="text-base font-black text-white uppercase italic tracking-tighter">{defeatSummaryData.killerName}</p>
                </div>

                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest text-center italic">30-second re-entry lockout now active</p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setDefeatSummaryData(null); adventure.goBack(); }}
                    className="py-3 bg-slate-800 text-white font-black uppercase italic text-xs rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-slate-700 active:translate-y-1 active:shadow-none transition-all"
                  >🏠 Return to Hub</button>
                  <button
                    onClick={() => { setDefeatSummaryData(null); setView('pvp'); }}
                    className="py-3 bg-purple-700 text-white font-black uppercase italic text-xs rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-purple-600 active:translate-y-1 active:shadow-none transition-all"
                  >⚡ Re-Enter Grid</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

       <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 5px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.1); border-radius: 10px; }
         .font-comic { font-family: 'Inter', sans-serif; font-weight: 900; }
         @keyframes pvp-float { 0% { transform: translateX(-50%) translateY(0); opacity: 1; } 100% { transform: translateX(-50%) translateY(-48px); opacity: 0; } }
         .pvp-float-up { animation: pvp-float 1.2s ease-out forwards; }
       `}</style>
    </div>
  );
});
