import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Users, X, Trophy, Skull, Sword, Shield, Zap, Target, Flame, Heart, Send, MessageSquare } from 'lucide-react';
import { doc, setDoc, deleteDoc, onSnapshot, collection, query, where, getFirestore, increment, updateDoc, getDoc } from 'firebase/firestore';
import { Header, AvatarMedia } from './GameUI';

export const PvpRoomView = React.memo(({ player, syncPlayer, setView, addLog, totalStats, db, appId, user }) => {
  const [players, setPlayers] = useState([]);
  const [penaltyTime, setPenaltyTime] = useState(0);
  const [combatAnim, setCombatAnim] = useState(null); // { targetId, type }
  const [isJoining, setIsJoining] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef(null);

  const pvpPenaltyKey = 'pvp_penalty_until';

  // Check if player is already disqualified
  const now = Date.now();
  const hasPenalty = player[pvpPenaltyKey] && player[pvpPenaltyKey] > now;

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

  // Join PVP Room
  useEffect(() => {
    if (hasPenalty || !user) return;

    const identifier = user.email || user.uid;
    const pvpDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'pvp_room', identifier);

    const joinRoom = async () => {
      try {
        await setDoc(pvpDocRef, {
          uid: identifier,
          name: player.name,
          level: player.level,
          avatar: player.avatar,
          hp: player.maxHp,
          maxHp: player.maxHp,
          stats: totalStats,
          lastAction: Date.now(),
          lastHitBy: null,
          lastHitId: null,
          isDefeated: false
        });
        setIsJoining(false);
      } catch (err) {
        console.error("Error joining PVP:", err);
        addLog("Failed to enter PVP Room.");
        setView('menu');
      }
    };

    joinRoom();

    // Leave room on unmount
    return () => {
      deleteDoc(pvpDocRef).catch(console.error);
    };
  }, [db, appId, user, player.name, player.level, player.avatar, player.maxHp, totalStats]);

  // Listen to players in room
  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'pvp_room');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList = snapshot.docs.map(d => d.data());
      setPlayers(pList);

      // Check if self is defeated or hit
      const selfId = user.email || user.uid;
      const self = pList.find(p => p.uid === selfId);
      
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
  }, [db, appId, user, lastProcessedHitId]);

  // Listen to chat messages
  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'pvp_chat');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-50);
      setMessages(msgList);
    });
    return () => unsubscribe();
  }, [db, appId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msg = chatInput.trim();
    setChatInput("");

    try {
      const identifier = user.email || user.uid;
      const chatDocRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'pvp_chat'));
      await setDoc(chatDocRef, {
        uid: identifier,
        name: player.name,
        text: msg,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  const handleDefeatState = async () => {
    const selfId = user.email || user.uid;
    const targetRef = doc(db, 'artifacts', appId, 'public', 'data', 'pvp_room', selfId);
    
    // Mark as defeated in the room first
    await updateDoc(targetRef, { isDefeated: true });
    
    // Set penalty in profile
    const penaltyDuration = 30 * 1000; // 30 seconds
    const until = Date.now() + penaltyDuration;
    await syncPlayer({ [pvpPenaltyKey]: until });

    addLog("💀 YOU WERE DEFEATED! Core Recharging...");
    
    // Wait for the "greyed out" phase before expulsion
    setTimeout(async () => {
      await deleteDoc(targetRef).catch(() => {});
      setView('menu');
    }, 5000); // 5 seconds of being "greyed out" in the room
  };

  const processCounterAttack = async (attackerId) => {
    const attacker = players.find(p => p.uid === attackerId);
    if (!attacker || attacker.isDefeated) return;

    // Small delay for "reaction" feel
    setTimeout(() => {
      addLog(`⚡ Counter-attacking ${attacker.name}!`);
      attackPlayer(attacker, true); // Pass true to avoid infinite counter loops
    }, 800);
  };

  const attackPlayer = async (target, isCounter = false) => {
    if (target.uid === (user.email || user.uid) || target.isDefeated) return;

    // Accuracy Check
    const hitChance = Math.min(98, (totalStats.dex / (totalStats.dex + target.stats.agi * 0.4)) * 100);
    const isHit = Math.random() * 100 < hitChance;

    const selfId = user.email || user.uid;
    const targetRef = doc(db, 'artifacts', appId, 'public', 'data', 'pvp_room', target.uid);

    // Visual Feedback
    setCombatAnim({ targetId: target.uid, type: isHit ? 'hit' : 'miss' });
    setTimeout(() => setCombatAnim(null), 600);

    if (isHit) {
      const dmg = Math.max(5, totalStats.str - Math.floor(target.stats.agi / 6));
      await updateDoc(targetRef, {
        hp: increment(-dmg),
        lastHitBy: selfId,
        lastHitId: Date.now() + Math.random(),
        lastAction: Date.now()
      });
      addLog(`⚔️ Struck ${target.name} for ${dmg} DMG!`);
    } else {
      addLog(`🛡️ ${target.name} evaded your strike!`);
    }
  };

  if (hasPenalty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/80 backdrop-blur-md">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 animate-pulse"></div>
          <Skull size={80} className="text-red-500 relative z-10" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">ACCESS SUSPENDED</h2>
        <p className="text-slate-400 text-xs font-bold uppercase mb-8 tracking-widest">Penalty Core Recharging...</p>
        <div className="text-6xl font-black text-red-600 italic tracking-tighter animate-pulse">{penaltyTime}s</div>
        <button 
          onClick={() => setView('menu')}
          className="mt-12 bg-slate-800 hover:bg-slate-700 text-white border-2 border-white/20 px-8 py-3 font-black uppercase italic tracking-widest transition-all shadow-[6px_6px_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900">
      {/* Background FX */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>

      <div className="p-4 z-10 flex flex-col h-full">
        <Header 
          title="PVP HOLO-GRID" 
          onClose={() => setView('menu')} 
          icon={<Users size={20} className="text-blue-400" />}
        />

        <div className="flex justify-between items-end mb-4 px-2">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Live Arena Status</p>
            <p className="text-xl font-black text-white uppercase italic tracking-tighter">Active Hunters: {players.length}</p>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter italic">Broadcasting Live</span>
          </div>
        </div>


        {/* Players Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-6">
            {players.map((p) => {
              const isSelf = p.uid === (user.email || user.uid);
              const hpPercent = Math.max(0, (p.hp / p.maxHp) * 100);
              const isBeingHit = combatAnim?.targetId === p.uid;

              return (
                <div 
                  key={p.uid}
                  onClick={() => !isSelf && attackPlayer(p)}
                  className={`relative group cursor-pointer transition-all duration-300 ${isSelf ? 'ring-2 ring-blue-500/50' : 'hover:scale-[1.02]'} ${p.hp <= 0 ? 'opacity-50 grayscale' : ''}`}
                >
                  {/* Card Background */}
                  <div className={`absolute inset-0 border-[3px] border-black transition-colors ${isBeingHit ? 'bg-red-500/20' : 'bg-slate-800'}`}></div>
                  <div className="absolute inset-0 border-r-[6px] border-b-[6px] border-black/30 pointer-events-none"></div>
                  
                  {/* Player Info */}
                  <div className="relative p-2 flex flex-col items-center">
                    <div className="w-full flex justify-between items-start mb-2 px-1">
                      <span className="bg-black text-white text-[8px] font-black px-1.5 py-0.5 border border-white/10 uppercase tracking-tighter italic">LVL {p.level}</span>
                      {isSelf && <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 border border-white/10 uppercase tracking-tighter italic">YOU</span>}
                    </div>

                    <div className={`w-20 h-24 mb-2 border-2 border-black overflow-hidden bg-slate-900 group-hover:border-white/50 transition-colors relative ${isBeingHit ? 'animate-shake' : ''}`}>
                       <AvatarMedia num={p.avatar} animated={!isSelf} className="w-full h-full object-cover grayscale-[0.2]" />
                       {p.hp <= 0 && (
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                            <Skull size={32} className="text-white/80 animate-pulse" />
                         </div>
                       )}
                       {isBeingHit && (
                         <div className="absolute inset-0 flex items-center justify-center animate-ping">
                           <Sword size={40} className="text-white drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                         </div>
                       )}
                    </div>

                    <h3 className="text-[10px] font-black text-white uppercase italic tracking-tighter truncate w-full text-center mb-2 drop-shadow-md">{p.name}</h3>

                    {/* HP Bar */}
                    <div className="w-full bg-black/50 border border-white/10 h-3 rounded-full overflow-hidden p-0.5 relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${hpPercent < 30 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${hpPercent}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[7px] font-black text-white uppercase italic pointer-events-none drop-shadow-sm">{Math.ceil(p.hp)} HP</span>
                      </div>
                    </div>

                    {/* Quick Stats Overlay (Mobile friendly) */}
                    <div className="flex gap-2 mt-2 opacity-40">
                       <div className="flex items-center gap-1">
                         <Sword size={8} className="text-red-400" />
                         <span className="text-[6px] font-black text-white">{p.stats.str}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <Shield size={8} className="text-emerald-400" />
                         <span className="text-[6px] font-black text-white">{p.stats.agi}</span>
                       </div>
                    </div>
                  </div>

                  {/* Combat Effect Overlay */}
                  {combatAnim?.targetId === p.uid && (
                    <div className="absolute -top-4 -right-2 z-[100] animate-bounce text-xs font-black italic uppercase text-red-500 drop-shadow-[0_0_4px_rgba(0,0,0,1)]">
                       {combatAnim.type === 'hit' ? 'DIRECT HIT!' : 'DEFLECTED!'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Arena Chat */}
        {showChat && (
          <div className="flex flex-col h-48 bg-black/60 border-2 border-black rounded-lg overflow-hidden mb-3 shadow-[4px_4px_0_rgba(0,0,0,0.5)] transform -rotate-0.5">
            <div className="bg-slate-800/80 px-2 py-1 flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <MessageSquare size={10} className="text-blue-400" />
                <span className="text-[8px] font-black text-white/70 uppercase tracking-widest italic">Grid Comms: Open Terminal</span>
              </div>
              <button onClick={() => setShowChat(false)} className="text-white/30 hover:text-white"><X size={10} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar flex flex-col">
              {messages.length > 0 ? messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.uid === (user.email || user.uid) ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-1.5 rounded relative ${m.uid === (user.email || user.uid) ? 'bg-blue-600/20 border-r-2 border-blue-500' : 'bg-slate-800/40 border-l-2 border-slate-500'}`}>
                    <span className={`text-[7px] font-black uppercase italic mb-0.5 block ${m.uid === (user.email || user.uid) ? 'text-blue-400 text-right' : 'text-slate-400'}`}>
                      {m.name}
                    </span>
                    <p className="text-[9px] font-black text-white italic leading-tight">{m.text}</p>
                  </div>
                </div>
              )) : (
                <p className="text-[8px] text-center text-white/20 uppercase italic mt-10">Waiting for transmission...</p>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-1.5 flex gap-1.5 bg-black/40 border-t border-white/5">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Broadcast message..."
                className="flex-1 bg-transparent border-none text-[9px] font-black text-white italic focus:outline-none placeholder:text-white/20 uppercase"
              />
              <button type="submit" className="text-blue-500 hover:text-blue-400 transition-colors">
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {!showChat && (
          <button 
            onClick={() => setShowChat(true)}
            className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 border-2 border-blue-500/50 py-1.5 px-3 rounded-lg mb-3 transition-all transform hover:scale-105 active:scale-95 shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
          >
            <MessageSquare size={12} className="text-blue-400" />
            <span className="text-[9px] font-black text-blue-400 uppercase italic">Show Arena Comms</span>
          </button>
        )}

        {/* Footer Info */}
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center px-2">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 grayscale opacity-50">
                <Target size={12} className="text-yellow-400" />
                <span className="text-[8px] font-black text-white uppercase italic">Grid Sync OK</span>
             </div>
             <div className="flex items-center gap-1.5">
                <Flame size={12} className="text-orange-500 animate-pulse" />
                <span className="text-[8px] font-black text-white uppercase italic">Zone: High Danger</span>
             </div>
           </div>
           <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Crystle Combat Prots v2.4</p>
        </div>
      </div>

      <style>{`
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
});
