import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { doc, setDoc, deleteDoc, onSnapshot, collection, query, where, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Users, X, MessageSquare, Send, Check, Sparkles } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { NPCCard } from './NPCCard';
import { useGame } from '../contexts/GameContext';

/* ──────────────── Sharding ──────────────── */
const GRIDS = ['Nexus', 'Prism', 'Echo', 'Flare'];
const MAX_MESSAGE_LENGTH = 20;

/* ──────────────── Tutorial Steps ──────────────── */
const TUTORIAL_STEPS = [
  {
    title: "Welcome to Caster Town",
    npc: 13,
    text: "This is Caster Town — the social hub of the metaverse! Hunters from across the realm gather here. Their avatars roam the town in real-time. You'll see other online players walking around just like you!",
    hint: "Tip: This is a live multiplayer space — other players are real people."
  },
  {
    title: "Speech Bubbles",
    npc: 22,
    text: `Tap the chat bar at the bottom to set your speech bubble! You have ${MAX_MESSAGE_LENGTH} characters to say something to everyone in the town. Your message floats above your avatar for all to see.`,
    hint: "Strategy: Use short, punchy messages to stand out!"
  },
  {
    title: "Roam & Socialize",
    npc: 18,
    text: "Your avatar automatically roams the town. There are no drops, no combat — just pure social fun. See someone interesting? Say hi with a speech bubble. Caster Town is always open to all hunters.",
    hint: "Note: No NFT required — everyone is welcome!"
  }
];

/* ──────────────── Caster Town Ground (Roaming + Rendering) ──────────────── */
const CasterTownGround = React.memo(({ db, user, player, gridId, onSelfPositionRef }) => {
  const [remotePlayers, setRemotePlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const ownPosRef = useRef({ x: 50, y: 50, targetX: 20 + Math.random() * 60, targetY: 20 + Math.random() * 60, speed: 0.4 + Math.random() * 0.4 });

  // ── Expose own position ref to parent for Firestore writes ──
  useEffect(() => {
    if (onSelfPositionRef) onSelfPositionRef(ownPosRef);
  }, [onSelfPositionRef]);

  // ── Self roaming engine (interval-based, writes to Firestore) ──
  useEffect(() => {
    if (!user?.uid || !db) return;

    const timer = setInterval(() => {
      const pos = ownPosRef.current;
      const dx = pos.targetX - pos.x;
      const dy = pos.targetY - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let newX, newY, newTargetX, newTargetY;
      if (dist < 1.5) {
        newX = pos.targetX;
        newY = pos.targetY;
        newTargetX = 5 + Math.random() * 90;
        newTargetY = 5 + Math.random() * 90;
      } else {
        newX = pos.x + (dx / dist) * pos.speed;
        newY = pos.y + (dy / dist) * pos.speed;
        newTargetX = pos.targetX;
        newTargetY = pos.targetY;
      }

      ownPosRef.current = { x: newX, y: newY, targetX: newTargetX, targetY: newTargetY, speed: pos.speed };

      // Write position to Firestore (fire-and-forget)
      updateDoc(doc(db, 'caster_town', user.uid), {
        x: newX,
        y: newY,
        targetX: newTargetX,
        targetY: newTargetY,
      }).catch(() => {});
    }, 1000);

    return () => clearInterval(timer);
  }, [db, user?.uid]);

  // ── Remote players listener ──
  useEffect(() => {
    if (!db || !user?.uid) return;

    const q = query(collection(db, 'caster_town'), where('gridId', '==', gridId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const pList = snapshot.docs
        .map(d => d.data())
        .filter(p => p.uid !== user.uid) // exclude self
        .filter(p => !p.lastAction || (now - p.lastAction) < 25000); // garbage collection

      setRemotePlayers(pList);
    });

    return () => unsubscribe();
  }, [db, user?.uid, gridId]);

  // ── Chat messages listener ──
  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'caster_chat'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const msgList = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.timestamp && (now - m.timestamp) < 8000) // show last 8s
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 40);

      setChatMessages(msgList);
    });

    return () => unsubscribe();
  }, [db]);

  // Build a lookup: player uid → current position (for anchoring chat bubbles)
  const playerPositions = useMemo(() => {
    const map = {};
    remotePlayers.forEach(p => { map[p.uid] = { x: p.x, y: p.y, name: p.name, avatar: p.avatar }; });
    return map;
  }, [remotePlayers]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Remote players */}
      {remotePlayers.map(p => (
        <div
          key={p.uid}
          className="absolute transition-all duration-1000 z-10"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <div className="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
            {/* Speech bubble above avatar (from presence message) */}
            {p.message && (
              <div className="bg-white text-black px-2 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] mb-1 animate-in fade-in zoom-in duration-300 max-w-[120px]">
                <p className="text-[8px] md:text-[10px] font-black uppercase italic leading-tight text-center break-words">
                  {p.message}
                </p>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-black transform rotate-45"></div>
              </div>
            )}

            {/* Avatar */}
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-[2px] md:border-[3px] border-black bg-slate-800 shadow-[3px_3px_0_rgba(0,0,0,1)] overflow-hidden">
              <AvatarMedia num={p.avatar} animated={true} className="w-full h-full object-cover object-top" />
            </div>

            {/* Name label */}
            <div className="bg-black/80 px-1.5 py-0.5 rounded border border-white/20 mt-0.5">
              <span className="text-[6px] md:text-[7px] font-black text-white uppercase italic truncate max-w-[60px] block text-center">
                {p.name}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Floating chat bubbles (anchored to player positions) */}
      {chatMessages.map(m => {
        const pos = playerPositions[m.uid];
        if (!pos) return null;
        return (
          <div
            key={m.id}
            className="absolute z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div className="relative -translate-x-1/2" style={{ marginTop: '-60px' }}>
              <div className="bg-cyan-400 text-black px-2 py-1 rounded-xl border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] max-w-[140px]">
                <p className="text-[8px] md:text-[10px] font-black uppercase italic leading-tight text-center break-words">
                  {m.text}
                </p>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 border-r-2 border-b-2 border-black transform rotate-45"></div>
              </div>
              <p className="text-[6px] font-black text-white/50 uppercase italic text-center mt-1">— {m.name}</p>
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {remotePlayers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center">
            <Users size={32} className="text-slate-500 mx-auto mb-2" />
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase italic tracking-wider">
              No other hunters in this sector
            </p>
            <p className="text-[8px] text-slate-600 uppercase mt-1">
              Share the link to bring people in!
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

/* ──────────────── Main Caster Town View ──────────────── */
export const CasterTownView = React.memo(() => {
  const { player, adventure, db, user, addLog } = useGame();
  const { setView } = adventure;

  const gridId = useMemo(() => GRIDS[Math.floor(Math.random() * GRIDS.length)], []);

  const [isJoining, setIsJoining] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [message, setMessage] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Ref for own position (populated by CasterTownGround)
  const ownPosRef = useRef(null);

  // ── Auto-tutorial trigger ──
  useEffect(() => {
    const isHidden = localStorage.getItem('hide_caster_town_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) localStorage.setItem('hide_caster_town_tutorial', 'true');
      setShowTutorial(false);
    }
  }, [tutorialStep, dontShowAgain]);

  // ── Firestore Presence: Join ──
  useEffect(() => {
    if (!user?.uid || !db) return;

    const casterDocRef = doc(db, 'caster_town', user.uid);
    const pos = ownPosRef.current || { x: 50, y: 50, targetX: 20 + Math.random() * 60, targetY: 20 + Math.random() * 60, speed: 0.4 + Math.random() * 0.4 };

    const joinRoom = async () => {
      try {
        await setDoc(casterDocRef, {
          uid: user.uid,
          name: player.name,
          level: player.level,
          avatar: player.avatar,
          x: pos.x,
          y: pos.y,
          targetX: pos.targetX,
          targetY: pos.targetY,
          speed: pos.speed,
          message: '',
          lastAction: Date.now(),
          gridId: gridId,
        });
        setIsJoining(false);
        addLog('🏘️ CASTER TOWN: Entered the social hub!');
      } catch (err) {
        console.error('Caster Town join error:', err);
        addLog(`🚨 CASTER TOWN: ${err.message || 'Failed to enter.'}`);
        setView('menu');
      }
    };

    joinRoom();

    return () => {
      deleteDoc(casterDocRef).catch(() => {});
    };
  }, [db, user?.uid, gridId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Heartbeat ──
  useEffect(() => {
    if (!user?.uid || !db || isJoining) return;

    const casterDocRef = doc(db, 'caster_town', user.uid);
    const interval = setInterval(() => {
      updateDoc(casterDocRef, { lastAction: Date.now() }).catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [db, user?.uid, isJoining]);

  // ── Stats sync (name/level/avatar changes) ──
  useEffect(() => {
    if (!user?.uid || !db || isJoining) return;

    const casterDocRef = doc(db, 'caster_town', user.uid);
    updateDoc(casterDocRef, {
      name: player.name,
      level: player.level,
      avatar: player.avatar,
    }).catch(() => {});
  }, [player.name, player.level, player.avatar, db, user?.uid, isJoining]);

  // ── Player count listener (for header) ──
  useEffect(() => {
    if (!db || !user?.uid) return;

    const q = query(collection(db, 'caster_town'), where('gridId', '==', gridId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const count = snapshot.docs
        .map(d => d.data())
        .filter(p => !p.lastAction || (now - p.lastAction) < 25000)
        .length;
      setPlayerCount(count);
    });

    return () => unsubscribe();
  }, [db, user?.uid, gridId]);

  // ── Send chat message ──
  const sendMessage = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !user?.uid || !db) return;

    setChatInput('');

    try {
      // Write to caster_chat collection
      await addDoc(collection(db, 'caster_chat'), {
        uid: user.uid,
        name: player.name,
        avatar: player.avatar,
        text: text.slice(0, MAX_MESSAGE_LENGTH),
        timestamp: Date.now(),
      });

      // Update own presence message
      await updateDoc(doc(db, 'caster_town', user.uid), {
        message: text.slice(0, MAX_MESSAGE_LENGTH),
        lastAction: Date.now(),
      });

      // Clear own message after 6 seconds
      setTimeout(() => {
        updateDoc(doc(db, 'caster_town', user.uid), { message: '' }).catch(() => {});
      }, 6000);

      addLog(`💬 CASTER TOWN: You said "${text.slice(0, MAX_MESSAGE_LENGTH)}"`);
    } catch (err) {
      console.error('Chat send error:', err);
    }
  };

  // ── Share invite ──
  const shareInvite = () => {
    const text = `🏘️ Join me in Caster Town at Dungeons With Gems!\n\nA live multiplayer social hub where hunters roam & chat.\n\n📡 Play: https://metaverse.dungeonswithgems.quest\n✧ #DungeonsWithGems #Base #Web3Gaming`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    addLog('📡 CASTER TOWN: Invite link shared!');
  };

  // ── Handle own position ref callback ──
  const handleSelfPositionRef = useCallback((ref) => {
    ownPosRef.current = ref;
  }, []);

  if (isJoining) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 font-comic h-full min-h-[500px]">
        <div className="text-4xl animate-pulse mb-4">🏘️</div>
        <p className="text-sm font-black text-white uppercase italic tracking-wider">Entering Caster Town...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900 font-comic h-full min-h-[500px]">
      {/* Header */}
      <Header title="CASTER TOWN" npcNum={13} onClose={() => setView('menu')} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
      }}>
        <div className="flex items-center gap-1 md:gap-2 px-1 md:px-4 py-0.5 md:py-2 bg-black/60 rounded-full border border-purple-500/30 backdrop-blur-md scale-[0.7] md:scale-100">
          <span className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-purple-500 rounded-full animate-ping"></span>
          <span className="text-[7px] md:text-[10px] font-black text-white italic uppercase truncate max-w-[80px] md:max-w-none">
            LIVE · {playerCount}
          </span>
        </div>
      </Header>

      {/* Status Bar */}
      <div className="mx-2 md:mx-4 mt-1 md:mt-2 p-2 md:p-4 bg-black/40 border-[3px] md:border-4 border-black rounded-xl md:rounded-2xl flex justify-between items-center shadow-[4px_4px_0_rgba(0,0,0,0.5)] z-10 shrink-0">
        <div>
          <p className="text-[8px] md:text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none">Sector {gridId}</p>
          <p className="text-sm md:text-2xl font-black text-white uppercase italic tracking-tighter mt-1">
            Hunters Online: {playerCount}
          </p>
        </div>
        <button
          onClick={shareInvite}
          className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full border-2 border-black font-black uppercase italic text-[8px] md:text-[10px] shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
        >
          <Users size={12} md:size={14} />
          Invite
        </button>
      </div>

      {/* Ground Area */}
      <div className="flex-1 relative overflow-hidden mx-2 md:mx-4 my-1 md:my-2 bg-slate-950/60 border-[3px] md:border-4 border-black rounded-xl md:rounded-2xl shadow-inner">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>

        {/* Building / landmark in center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
          <div className="text-8xl md:text-[12rem] select-none">🏘️</div>
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
          backgroundSize: '25% 25%'
        }}></div>

        <CasterTownGround
          db={db}
          user={user}
          player={player}
          gridId={gridId}
          onSelfPositionRef={handleSelfPositionRef}
        />
      </div>

      {/* Message display */}
      {message && (
        <div className={`mx-2 md:mx-4 mt-1 px-3 py-2 rounded-lg border-2 border-black text-[10px] md:text-xs font-black uppercase italic text-center animate-in fade-in zoom-in duration-200 ${
          message.type === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
        }`}>
          {message.text}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="mx-2 md:mx-4 mb-2 md:mb-4 p-2 md:p-3 bg-black/60 border-[3px] border-black rounded-xl md:rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,0.5)] z-10 shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-black bg-slate-800 overflow-hidden shrink-0 shadow-[2px_2px_0_rgba(0,0,0,1)]">
            <AvatarMedia num={player.avatar} animated={true} className="w-full h-full object-cover object-top" />
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              placeholder="Say something..."
              maxLength={MAX_MESSAGE_LENGTH}
              className="w-full bg-slate-800 border-2 border-black rounded-lg px-3 py-2 text-[10px] md:text-xs font-black text-white uppercase italic placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors shadow-[2px_2px_0_rgba(0,0,0,1)]"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-500 uppercase">
              {chatInput.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 md:p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg border-2 border-black font-black uppercase italic text-[10px] md:text-xs shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Send size={14} md:size={16} />
          </button>
        </form>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            <div className="absolute inset-x-0 top-0 bottom-0 bg-purple-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>

            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              <div className="w-full bg-purple-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  {TUTORIAL_STEPS[tutorialStep].title}
                </h2>
                <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">
                  Step {tutorialStep + 1} / {TUTORIAL_STEPS.length}
                </div>
              </div>

              <div className="py-3 md:py-4 relative flex justify-center items-center gap-3 w-full z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0 flex items-center justify-center">
                  <AvatarMedia num={TUTORIAL_STEPS[tutorialStep].npc} className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-x-0 bottom-0 bg-purple-600 text-[6px] font-black text-white text-center py-0.5 uppercase italic">GUIDE</div>
                </div>
              </div>

              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-purple-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Town Crier
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{TUTORIAL_STEPS[tutorialStep].text}"
                  </p>
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-purple-500/30 mb-3 shrink-0">
                  <p className="text-[8px] font-black text-purple-400 uppercase italic tracking-widest text-center">
                    ⚡ {TUTORIAL_STEPS[tutorialStep].hint}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                  <button
                    onClick={() => setDontShowAgain(!dontShowAgain)}
                    className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-purple-500' : 'bg-slate-800'}`}
                  >
                    {dontShowAgain && <Check size={10} className="text-white" />}
                  </button>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                    Don't show this briefing again
                  </span>
                </div>

                <div className="flex gap-2 shrink-0 pb-1">
                  <button
                    onClick={nextStep}
                    className="flex-[2] bg-purple-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-purple-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'ENTER CASTER TOWN' : 'CONTINUE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>

            <button onClick={() => {
              if (dontShowAgain) localStorage.setItem('hide_caster_town_tutorial', 'true');
              setShowTutorial(false);
            }} className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 border-2 border-black rounded-full flex items-center justify-center z-20 shadow-[3px_3px_0_rgba(0,0,0,1)]">
              <X size={14} className="text-white" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});
