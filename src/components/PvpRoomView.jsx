import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Users, X, Trophy, Skull, Sword, Shield, Zap, Target, Flame, Heart, Send, MessageSquare } from 'lucide-react';
import { doc, setDoc, deleteDoc, onSnapshot, collection, query, where, getFirestore, increment, updateDoc, getDoc } from 'firebase/firestore';
import { Header, AvatarMedia, SquadHUD } from './GameUI';
import { useGame } from '../contexts/GameContext';
import React from 'react';

/**
 * PvpRoomView V2: Real-time Combat Arena
 * Unified root-level collections for 'pvp_room' and 'global_chat'.
 */
export const PvpRoomView = React.memo(() => {
  const { player, syncPlayer, adventure, gameLoop, TAVERN_MATES, totalStats, db, user, addLog, openGuide } = useGame();
  const { setView } = adventure;
  const { dragonTimeLeft } = gameLoop;

  const [players, setPlayers] = useState([]);
  const [penaltyTime, setPenaltyTime] = useState(0);
  const [combatAnim, setCombatAnim] = useState(null); 
  const [isJoining, setIsJoining] = useState(true);
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

  // 2. Room Presence Sync (V2: Root Path)
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
          hp: player.maxHp,
          maxHp: player.maxHp,
          stats: totalStats,
          hiredMate: player.hiredMate,
          dragonSummoned: dragonTimeLeft > 0,
          gemx: player.gemx,
          gemxAvatar: player.gemxAvatar,
          lastAction: Date.now(),
          lastHitBy: null,
          lastHitId: null,
          isDefeated: false
        });
        setIsJoining(false);
      } catch (err) {
        console.error("PVP Join Error:", err);
        addLog("🚨 ERROR: Failed to synchronize with Battle Grid.");
        setView('menu');
      }
    };

    joinRoom();

    return () => {
      console.log("System V2: Withdrawing Combat Signal...");
      deleteDoc(pvpDocRef).catch(console.error);
    };
  }, [db, user.uid, player.name, player.level, player.avatar, player.maxHp, totalStats, player.hiredMate, dragonTimeLeft, player.gemx, player.gemxAvatar]);

  // 3. Room Listener (V2: Root Path)
  useEffect(() => {
    if (!user?.uid) return;
    const q = collection(db, 'pvp_room');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList = snapshot.docs.map(d => d.data());
      setPlayers(pList);

      const self = pList.find(p => p.uid === user.uid);
      if (self) {
        if (self.hp <= 0 && !self.isDefeated) {
          handleDefeatState();
        } else if (self.lastHitBy && self.lastHitId !== lastProcessedHitId) {
          setLastProcessedHitId(self.lastHitId);
          processCounterAttack(self.lastHitBy);
        }
      }
    });
    return () => unsubscribe();
  }, [db, user.uid, lastProcessedHitId]);

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

  const handleDefeatState = async () => {
    if (!user?.uid) return;
    const targetRef = doc(db, 'pvp_room', user.uid);
    await updateDoc(targetRef, { isDefeated: true, hp: 0 });
    
    const until = Date.now() + 30000;
    await syncPlayer({ [pvpPenaltyKey]: until });

    addLog("💀 DISCONNECTED: You have been neutralized in the Grid.");
    setTimeout(() => {
      deleteDoc(targetRef).catch(() => {});
      setView('menu');
    }, 4000);
  };

  const processCounterAttack = async (attackerId) => {
    const attacker = (players || []).find(p => p.uid === attackerId);
    if (!attacker || attacker.isDefeated) return;
    setTimeout(() => {
      addLog(`⚡ COUNTER-STRIKE: Target ${attacker.name} acquired.`);
      attackPlayer(attacker);
    }, 800);
  };

  const attackPlayer = async (target) => {
    if (!user?.uid || target.uid === user.uid || target.isDefeated || target.hp <= 0) return;

    const hitChance = Math.min(98, (totalStats.dex / (totalStats.dex + target.stats.agi * 0.4)) * 100);
    const isHit = Math.random() * 100 < hitChance;
    const targetRef = doc(db, 'pvp_room', target.uid);

    setCombatAnim({ targetId: target.uid, type: isHit ? 'hit' : 'miss' });
    setTimeout(() => setCombatAnim(null), 600);

    if (isHit) {
      const dmg = Math.max(5, totalStats.str - Math.floor(target.stats.agi / 6));
      await updateDoc(targetRef, {
        hp: increment(-dmg),
        lastHitBy: user.uid,
        lastHitId: Date.now() + Math.random(),
        lastAction: Date.now()
      });
      addLog(`⚔️ STRIKE: Dealt ${dmg} DMG to ${target.name}.`);
    } else {
      addLog(`🛡️ DEFLECTED: Strike avoided by ${target.name}.`);
    }
  };

  if (hasPenalty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/80 backdrop-blur-md">
        <Skull size={80} className="text-red-500 mb-6 animate-pulse" />
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">ACCESS SUSPENDED</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase mb-8 tracking-[0.2em]">Penalty Core Recharging...</p>
        <div className="text-6xl font-black text-red-600 italic tracking-tighter animate-pulse">{penaltyTime}s</div>
        <button onClick={() => setView('menu')} className="mt-12 bg-slate-800 text-white border-2 border-white/20 px-10 py-3 font-black uppercase italic tracking-widest shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">Return to Hub</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900 font-comic">
       <Header title="NEON ARENA: PVP GRID" onClose={() => setView('menu')} onHelp={() => openGuide('pvp')} />

       {/* Arena Status Header */}
       <div className="mx-4 mt-2 p-4 bg-black/40 border-4 border-black rounded-2xl flex justify-between items-center shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
         <div>
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Live Sector Activity</p>
            <p className="text-2xl font-black text-white uppercase italic tracking-tighter">Active Combatants: {players.length}</p>
         </div>
         <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-full border border-green-500/30">
           <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
           <span className="text-[10px] font-black text-white italic uppercase">Signal Secured</span>
         </div>
       </div>

       {/* Grid Combatants */}
       <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
             {players.map(p => {
                const isSelf = p.uid === user.uid;
                const hpPercent = Math.max(0, (p.hp / p.maxHp) * 100);
                const isTarget = combatAnim?.targetId === p.uid;
                return (
                  <div key={p.uid} onClick={() => !isSelf && attackPlayer(p)} className={`relative group cursor-pointer transition-all duration-300 ${(p.isDefeated || p.hp <= 0) ? 'opacity-30' : ''} ${isTarget ? 'scale-110' : ''}`}>
                    <div className={`absolute inset-0 border-4 border-black transition-colors ${isTarget ? 'bg-red-500/20' : 'bg-slate-800'}`}></div>
                    <div className="absolute inset-0 border-r-8 border-b-8 border-black/20 pointer-events-none"></div>
                    <div className="relative p-3 flex flex-col items-center">
                       <span className="absolute top-2 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 border border-white/10 uppercase italic">LVL {p.level}</span>
                       {isSelf && <span className="absolute top-2 right-2 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 border border-white/10 uppercase italic">MASTER</span>}
                       
                       <div className="w-24 h-28 border-4 border-black overflow-hidden bg-slate-900 relative mt-4">
                          <AvatarMedia num={p.avatar} animated={!p.isDefeated && p.hp > 0} className="w-full h-full object-cover" />
                          {(p.isDefeated || p.hp <= 0) && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"><Skull size={40} className="text-white animate-pulse" /></div>}
                          {isTarget && <div className="absolute inset-0 flex items-center justify-center animate-ping"><Sword size={48} className="text-white drop-shadow-[0_0_15px_red]" /></div>}
                       </div>
                       
                       <h3 className="text-[11px] font-black text-white uppercase italic tracking-tighter mt-3 mb-2">{p.name}</h3>
                       
                        {/* HP Bar */}
                        <div className="w-full bg-black/80 border-2 border-black h-4 rounded-full overflow-hidden relative shadow-inner">
                           <div className={`h-full transition-all duration-500 ${hpPercent < 40 ? 'bg-red-600' : 'bg-cyan-500'}`} style={{ width: `${hpPercent}%` }}></div>
                           <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase italic drop-shadow-md">{Math.max(0, Math.ceil(p.hp))} HP</span>
                        </div>
                    </div>
                  </div>
                )
             })}
          </div>
       </div>

       {/* Chat Terminal */}
       {showChat && (
         <div className="absolute bottom-4 left-4 right-4 h-52 bg-slate-900/90 border-4 border-black rounded-3xl shadow-[10px_10px_0_rgba(0,0,0,0.5)] flex flex-col overflow-hidden backdrop-blur-xl z-50">
            <div className="bg-black/60 px-4 py-2 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-black text-white/80 uppercase italic tracking-widest">Global Comms Terminal</span>
                </div>
                <button onClick={() => setShowChat(false)} className="text-white/20 hover:text-white"><X size={14} /></button>
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

       <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 5px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.1); border-radius: 10px; }
         .font-comic { font-family: 'Inter', sans-serif; font-weight: 900; }
       `}</style>
    </div>
  );
});
