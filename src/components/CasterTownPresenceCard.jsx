import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Users } from 'lucide-react';
import { AvatarMedia } from './GameUI';

// ── Deterministic roaming utilities (mirrors CasterTownView) ──
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

const deterministicRoam = (uid, bucket) => {
  const baseX   = 25 + (simpleHash(uid) % 5000) / 100;
  const baseY   = 25 + (simpleHash(uid + 'y') % 5000) / 100;
  const phaseX  = simpleHash(uid + 'px') % 1000 / 100;
  const phaseY  = simpleHash(uid + 'py') % 1000 / 100;
  const ampX    = 15 + simpleHash(uid + 'ax') % 3000 / 100;
  const ampY    = 15 + simpleHash(uid + 'ay') % 3000 / 100;
  const x = baseX + Math.sin((bucket + phaseX) * 0.15) * ampX;
  const y = baseY + Math.cos((bucket + phaseY) * 0.2)  * ampY;
  return { x: Math.max(3, Math.min(97, x)), y: Math.max(3, Math.min(97, y)) };
};

/**
 * A live presence panel for the main menu that shows a miniature roaming view
 * of all hunters currently online in Crystle Town.
 */
const CasterTownPresenceCard = ({ db, user, player, onEnter }) => {
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [tick, setTick] = useState(() => Math.floor(Date.now() / 2000));

  // ── Tick counter (2s interval, drives deterministic roaming) ──
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Math.floor(Date.now() / 2000));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── Firestore presence listener ──
  useEffect(() => {
    if (!db || !user?.uid) return;

    const q = query(collection(db, 'caster_town'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const allActive = snapshot.docs
        .map(d => d.data())
        .filter(p => !p.lastAction || (now - p.lastAction) < 25000);

      setOnlinePlayers(allActive.filter(p => p.uid !== user.uid));
      setPlayerCount(allActive.length);
    });

    return () => unsubscribe();
  }, [db, user?.uid]);

  // ── Lightweight heartbeat (visible as "browsing menu" without entering town) ──
  useEffect(() => {
    if (!user?.uid || !db || !player?.name) return;

    const casterDocRef = doc(db, 'caster_town', user.uid);

    // Write presence doc on mount
    setDoc(casterDocRef, {
      uid: user.uid,
      name: player.name,
      level: player.level ?? 1,
      avatar: player.avatar ?? 1,
      platform: user.platform || 'browser',
      pfp: user.pfp || '',
      message: '',
      location: 'menu',
      lastAction: Date.now(),
    }).catch(() => {});

    // Heartbeat every 10s
    const interval = setInterval(() => {
      updateDoc(casterDocRef, { lastAction: Date.now() }).catch(() => {});
    }, 10000);

    // Clean up when leaving the menu
    return () => {
      clearInterval(interval);
      deleteDoc(casterDocRef).catch(() => {});
    };
  }, [db, user?.uid, player?.name, player?.level, player?.avatar]);

  const hasPlayers = onlinePlayers.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 animate-in slide-in-from-top duration-1000">
      <div className="bg-white border-[4px] border-black rounded-2xl p-4 shadow-[6px_6px_0px_0px_black] transform rotate-0.5 hover:rotate-0 transition-all group relative overflow-hidden">
        <div className="halftone-overlay absolute inset-0 opacity-10 pointer-events-none rounded-2xl" />
        <div className="absolute -top-2 left-1/3 w-24 h-5 bg-black/5 border-x-2 border-black/5 rotate-1 z-20 backdrop-blur-sm pointer-events-none" />

        <div className="relative z-10">
          {/* ── Header row: badge + count ── */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center transform -rotate-1 group-hover:rotate-0 transition-all shrink-0">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 rounded tracking-[0.15em] uppercase italic leading-none">Crystle Town</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SOCIAL HUB</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-black text-black uppercase italic tracking-tight">
                    {playerCount > 0 ? `${playerCount} Hunter${playerCount !== 1 ? 's' : ''} Online` : 'Empty'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onEnter}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl border-[3px] border-black font-black uppercase italic text-[10px] shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all shrink-0"
            >
              Enter Town
            </button>
          </div>

          {hasPlayers ? (
            <>
              {/* ── Mini Roaming Ground ── */}
              <div className="relative w-full h-44 md:h-52 bg-slate-950/60 border-[3px] border-black rounded-xl overflow-hidden shadow-inner">
                {/* Grid dots */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
                  backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)',
                  backgroundSize: '14px 14px'
                }} />
                {/* Town landmark hint */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none text-5xl select-none">
                  🏘️
                </div>

                {/* Roaming avatars */}
                {onlinePlayers.map((p) => {
                  const pos = deterministicRoam(p.uid, tick);
                  return (
                    <div
                      key={p.uid}
                      className="absolute transition-all duration-[2000ms] z-10"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      <div className="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                        {/* Speech bubble from presence message */}
                        {p.message && (
                          <div className="bg-white text-black px-1.5 py-0.5 rounded-lg border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] mb-0.5 animate-in fade-in zoom-in duration-300 max-w-[100px]">
                            <p className="text-[6px] font-black uppercase italic leading-tight text-center break-words">
                              {p.message}
                            </p>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r-2 border-b-2 border-black transform rotate-45" />
                          </div>
                        )}

                        {/* Avatar */}
                        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full border-[2px] border-black bg-slate-800 shadow-[3px_3px_0_rgba(0,0,0,1)] overflow-hidden ${p.platform === 'farcaster' ? 'ring-1 ring-purple-400/60' : ''}`}>
                          {p.platform === 'farcaster' && p.pfp ? (
                            <img
                              src={p.pfp}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${p.uid}`;
                              }}
                            />
                          ) : (
                            <AvatarMedia num={p.avatar} animated={false} className="w-full h-full object-cover object-top" />
                          )}
                        </div>

                        {/* Name label */}
                        <div className={`px-1 py-0.5 rounded border mt-0.5 flex items-center gap-1 ${p.platform === 'farcaster' ? 'bg-purple-900/80 border-purple-500/50' : 'bg-black/80 border-white/20'}`}>
                          <span className="text-[6px] font-black text-white uppercase italic truncate max-w-[50px] block text-center">
                            {p.name}
                          </span>
                          {p.platform === 'farcaster' && (
                            <span className="text-[5px] font-black text-purple-300 bg-purple-800/60 px-0.5 rounded-full leading-none">FC</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty band when user is the only one present (count = 1 but no remote players) */}
                {onlinePlayers.length === 0 && playerCount === 1 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-[9px] font-black text-slate-500 uppercase italic">
                      Waiting for others to arrive...
                    </p>
                  </div>
                )}
              </div>

              {/* ── Legend bar ── */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {onlinePlayers.slice(0, 8).map((p) => (
                  <div
                    key={p.uid}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-black/5 rounded border border-black/10"
                    title={`${p.name} • Lv.${p.level}`}
                  >
                    <div className="w-4 h-4 rounded-full border-[1.5px] border-black bg-slate-800 overflow-hidden shrink-0">
                      <AvatarMedia num={p.avatar} animated={false} className="w-full h-full object-cover object-top" />
                    </div>
                    <span className="text-[6px] font-black text-black uppercase italic max-w-[40px] truncate">{p.name}</span>
                    <span className="text-[5px] font-black text-slate-400">LV.{p.level}</span>
                    {p.platform === 'farcaster' && (
                      <span className="text-[5px] font-black text-purple-400 bg-purple-100 px-0.5 rounded leading-none">FC</span>
                    )}
                  </div>
                ))}
                {onlinePlayers.length > 8 && (
                  <span className="text-[7px] font-black text-slate-500 italic">+{onlinePlayers.length - 8} more</span>
                )}
              </div>
            </>
          ) : (
            /* ── Empty state ── */
            <div className="flex items-center justify-center py-8 border-2 border-dashed border-black/10 rounded-xl">
              <div className="flex flex-col items-center gap-1">
                <Users size={22} className="text-slate-300" />
                <p className="text-[10px] font-black text-slate-400 uppercase italic">
                  No hunters online right now
                </p>
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-wider">
                  Be the first to arrive!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CasterTownPresenceCard;
