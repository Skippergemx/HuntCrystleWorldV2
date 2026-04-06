import { useState, useEffect, useRef } from 'react';
import { 
  Shield, Crown, Users, Rocket, Zap, Settings, 
  ArrowRight, Plus, Terminal, AlertTriangle, Search,
  RefreshCw, LogOut, UserPlus, Send, FlaskConical, MessageSquare,
  Swords, Target, Flame, Trophy, Star, Skull
} from 'lucide-react';
import { doc, getDoc, getDocs, collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { useGame } from '../contexts/GameContext';
import React from 'react';

/**
 * SyndicateView V2: Neon Faction Hub
 * Unified root-level collections for 'guilds' and 'guild_wars'.
 * Enforced UID-primary identity keys for all member tracking.
 */
export const SyndicateView = () => {
  const { 
    player, actions, db, audio, SOUNDS, totalStats, adventure, user
  } = useGame();
  
  const [activeTab, setActiveTab] = useState('overview'); 
  const [guildData, setGuildData] = useState(null);
  const [warData, setWarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allGuilds, setAllGuilds] = useState([]);
  
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFinder, setShowFinder] = useState(false);
  const [warManifestSize, setWarManifestSize] = useState(1);
  const [selectedDefenders, setSelectedDefenders] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  // 1. Unified Syndicate Data Sync (V2: Root Path)
  useEffect(() => {
    if (!player?.guildId) return;
    
    setLoading(true);
    const guildRef = doc(db, 'guilds', player.guildId);
    
    const unsubscribe = onSnapshot(guildRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGuildData(data);
        
        // Sync active war (V2: Root Path)
        if (data.activeWarId) {
          const warRef = doc(db, 'guild_wars', data.activeWarId);
          onSnapshot(warRef, (wSnap) => {
            if (wSnap.exists()) setWarData({ id: wSnap.id, ...wSnap.data() });
          });
        } else {
          setWarData(null);
        }
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [player?.guildId, db]);

  // 2. Faction Comms Sync (V2: Root Path)
  useEffect(() => {
    if (!player?.guildId || activeTab !== 'messages') return;
    const messagesRef = collection(db, 'guilds', player.guildId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubscribe();
  }, [player?.guildId, activeTab, db]);

  // 3. Global Discovery
  const fetchGuilds = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'guilds'), limit(20));
      const snap = await getDocs(q);
      setAllGuilds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Guild fetch error:", e); }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchGuilds();
  }, [activeTab]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await actions.sendSyndicateMessage(text);
  };

  if (!player?.guildId && !showFinder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950/80 backdrop-blur-xl animate-in zoom-in duration-500 overflow-y-auto relative">
        <button onClick={() => adventure.setView('menu')} className="absolute top-4 right-4 bg-slate-800 text-white px-8 py-3 rounded-2xl border-2 border-white/20 font-black uppercase italic shadow-[10px_10px_0_rgba(0,0,0,0.5)] hover:scale-105 transition-all z-20">Terminating Sector</button>
        <div className="w-full max-w-4xl flex flex-col items-center gap-10">
          <div className="text-center group flex flex-col items-center">
            <div className="w-32 h-32 bg-red-600 border-8 border-black rounded-full shadow-[15px_15px_0_rgba(0,0,0,0.8)] flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-500">
               <Shield size={64} className="text-white drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]" />
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase mb-2">NEON <span className="text-red-500">SYNDICATE</span></h1>
            <p className="text-white/40 font-black uppercase text-xs tracking-[0.4em] max-w-lg italic">Collective Authority: Join or Forge an Identity Uplink</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 w-full">
            <button onClick={() => setShowCreateModal(true)} className="relative bg-amber-500 border-8 border-black p-12 rounded-[40px] shadow-[15px_15px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-4 hover:translate-y-4 transition-all overflow-hidden text-center group">
               <Plus size={48} className="mx-auto mb-4 group-hover:rotate-180 transition-transform duration-700" strokeWidth={4} />
               <h2 className="text-3xl font-black text-black uppercase italic mb-2">Forge Protocol</h2>
               <p className="text-black/60 font-black text-[10px] uppercase mb-6 tracking-widest">Initial Investment: 50,000 GX</p>
               <div className="bg-black text-white px-8 py-3 rounded-full font-black uppercase italic text-xs mx-auto w-fit">Initiate Construction</div>
            </button>
            <button onClick={() => { fetchGuilds(); setShowFinder(true); }} className="relative bg-slate-800 border-8 border-black p-12 rounded-[40px] shadow-[15px_15px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-4 hover:translate-y-4 transition-all overflow-hidden text-center group">
               <Search size={48} className="mx-auto mb-4 text-cyan-400 group-hover:scale-125 transition-transform" strokeWidth={4} />
               <h2 className="text-3xl font-black text-white uppercase italic mb-2">Scan for Uplinks</h2>
               <p className="text-white/40 font-black text-[10px] uppercase mb-6 tracking-widest">Discover Rival Factions</p>
               <div className="bg-black text-cyan-400 px-8 py-3 rounded-full font-black uppercase italic text-xs mx-auto w-fit border border-cyan-400/30">Connect Grid</div>
            </button>
          </div>
        </div>
        
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
             <div className="w-full max-w-md bg-slate-900 border-8 border-black rounded-[40px] shadow-[20px_20px_0_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-amber-500 border-b-8 border-black p-8 relative flex flex-col items-center">
                   <h3 className="text-4xl font-black text-black uppercase italic">Construction</h3>
                   <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black text-xl hover:bg-white hover:text-black transition-colors">X</button>
                </div>
                <div className="p-10 flex flex-col gap-6">
                   <div className="space-y-2"><label className="text-white/40 font-black uppercase text-[10px] italic">Designation (Min 3 Chars)</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border-4 border-black p-5 text-white font-black italic rounded-2xl focus:border-red-500 outline-none uppercase" /></div>
                   <div className="space-y-2"><label className="text-white/40 font-black uppercase text-[10px] italic">Sector Tag (4 Chars)</label><input type="text" value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={4} className="w-full bg-black border-4 border-black p-5 text-white font-black italic rounded-2xl focus:border-red-500 outline-none uppercase text-center" /></div>
                   <button onClick={() => actions.createSyndicate(name, tag)} disabled={player.tokens < 50000} className="w-full bg-red-600 hover:bg-red-500 border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4 animate-pulse hover:animate-none"><Rocket size={24} /> <span className="text-2xl font-black text-white uppercase italic">Execute Genesis</span></button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in slide-in-from-right-12 duration-500 overflow-hidden max-w-7xl mx-auto w-full font-comic">
        <div className="flex items-center justify-between w-full mb-6 relative">
          <div className="flex items-center gap-3 bg-black/60 p-2 rounded-3xl border-4 border-black w-fit shadow-[6px_6px_0_rgba(0,0,0,1)]">
            {[
              { id: 'overview', icon: <Shield size={18} />, label: 'Tactical Base' },
              { id: 'messages', icon: <MessageSquare size={18} />, label: 'Channel Comms' },
              { id: 'lab', icon: <FlaskConical size={18} />, label: 'Research Lab' },
              { id: 'war', icon: <Swords size={18} />, label: 'Active Wars' },
              { id: 'leaderboard', icon: <Trophy size={18} />, label: 'Leaderboard' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[11px] uppercase italic border-2 ${activeTab === tab.id ? 'bg-red-600 text-white border-black scale-105 shadow-xl' : 'text-white/30 border-transparent hover:text-white hover:bg-white/5'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          
          <button onClick={() => adventure.setView('menu')} className="bg-slate-800 text-white px-8 py-3 rounded-2xl border-4 border-black font-black uppercase italic shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-white hover:text-black hover:scale-105 active:scale-95 transition-all text-xs">EXIT</button>
       </div>

       <div className="flex-1 flex flex-col overflow-hidden">
         {activeTab === 'overview' && (
           <div className="grid lg:grid-cols-3 gap-10 overflow-hidden h-full">
              <div className="lg:col-span-2 flex flex-col gap-8">
                 <div className="w-full bg-red-950 border-8 border-black rounded-[40px] p-10 shadow-[20px_20px_0_rgba(0,0,0,0.8)] relative overflow-hidden shrink-0">
                   <div className="absolute inset-0 comic-halftone opacity-40 text-red-600"></div>
                   <div className="relative z-10 flex justify-between items-center">
                     <div className="flex items-center gap-8">
                       <div className="w-24 h-24 bg-amber-500 border-4 border-black rounded-[30px] flex items-center justify-center transform -rotate-6 shadow-2xl">
                         <Shield size={48} className="text-black" />
                       </div>
                       <div>
                         <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-1">{guildData?.name}</h2>
                         <div className="flex items-center gap-3">
                            <span className="bg-black text-amber-500 px-3 py-1 rounded-md text-[10px] font-black border border-amber-500/30 uppercase italic">{guildData?.tag}</span>
                            <span className="text-[10px] font-black text-white/50 italic tracking-widest uppercase">Tier {guildData?.level} Faction</span>
                         </div>
                       </div>
                     </div>
                     <div className="bg-black/60 border-4 border-black rounded-3xl p-6 min-w-[140px] text-center shadow-inner">
                        <span className="text-[10px] font-black text-white/40 uppercase block mb-2 tracking-[0.2em]">EXP CORE</span>
                        <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden mx-auto"><div className="h-full bg-gradient-to-r from-red-600 to-amber-500 animate-pulse" style={{ width: `${(guildData?.xp % 1000) / 10}%` }}></div></div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex-1 bg-slate-900 border-8 border-black rounded-[40px] p-8 shadow-[15px_15px_0_rgba(0,0,0,1)] overflow-hidden flex flex-col">
                    <h3 className="text-2xl font-black text-white uppercase italic mb-8 flex items-center gap-4"><Users size={24} className="text-red-500" /> Authorized Personnel</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                       {guildData?.members?.map((mUid, i) => (
                         <div key={i} className="flex items-center justify-between bg-black/60 p-4 rounded-3xl border-4 border-black hover:border-red-500/50 transition-all group shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-slate-800 border-2 border-slate-700 rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-red-600 group-hover:text-white transition-colors">{(guildData?.memberNames?.[mUid] || mUid).slice(0, 2)}</div>
                               <div>
                                  <p className="text-sm font-black text-white italic uppercase tracking-tighter">{guildData?.memberNames?.[mUid] || `Hunter_UID_${mUid.slice(0, 6)}`}</p>
                                  <p className="text-[9px] font-black text-white/30 uppercase italic tracking-widest">Active Connection</p>
                               </div>
                            </div>
                            {mUid === guildData.leaderId && <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-500"><Crown size={12} /><span className="text-[8px] font-black uppercase">GENESIS LEADER</span></div>}
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-8 flex flex-col h-full">
                 <div className="bg-slate-900 border-8 border-black rounded-[40px] p-8 shadow-[15px_15px_0_rgba(0,0,0,1)]">
                    <h3 className="text-xl font-black text-white uppercase italic mb-8 flex items-center gap-4"><Rocket size={24} className="text-cyan-400" /> Capital Vault</h3>
                    <div className="bg-black/80 p-8 rounded-[30px] border-4 border-black shadow-inner flex flex-col items-center">
                       <span className="text-[10px] font-black text-white/30 uppercase mb-2 tracking-[0.3em]">Total GX Liquidity</span>
                       <span className="text-4xl font-black text-amber-500 italic drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">{(guildData?.gxVault || 0).toLocaleString()} GX</span>
                    </div>
                 </div>
                 
                 <div className="flex-1 flex flex-col justify-end gap-4 pb-8">
                    {player.guildRole === 'LEADER' ? (
                      <button onClick={() => actions.dissolveSyndicate()} className="w-full bg-red-950/40 hover:bg-red-950 border-4 border-red-900 rounded-3xl p-6 flex items-center justify-center gap-4 transition-all group scale-95 hover:scale-100"><Skull size={24} className="text-red-600 group-hover:animate-pulse" /><span className="text-lg font-black text-red-600 uppercase italic">NUCLEAR DISSOLUTION</span></button>
                    ) : (
                      <button onClick={() => actions.leaveSyndicate()} className="w-full bg-slate-800 hover:bg-red-600 border-4 border-black p-6 rounded-3xl flex items-center justify-center gap-4 transition-all group group-hover:text-white"><LogOut size={24} /><span className="text-lg font-black uppercase italic">DISCONNECT UPLINK</span></button>
                    )}
                 </div>
              </div>
           </div>
         )}

         { activeTab === 'messages' && (
           <div className="flex-1 flex flex-col bg-slate-900 border-8 border-black rounded-[40px] shadow-[15px_15px_0_rgba(0,0,0,1)] overflow-hidden transform -rotate-0.5">
              <div className="bg-black/40 px-6 py-3 border-b-4 border-black flex items-center gap-4">
                 <MessageSquare size={20} className="text-cyan-400" />
                 <h3 className="text-sm font-black text-white/80 uppercase italic tracking-[0.2em] font-center">Faction Secure Transmission: GATED UNIT {player.guildId.split('_').pop()}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                 {messages.map((msg) => (
                   <div key={msg.id} className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[9px] font-black uppercase italic mb-2 ${msg.senderId === user.uid ? 'text-cyan-400' : 'text-white/40'}`}>{msg.senderName}</span>
                      <div className={`max-w-[75%] p-5 rounded-[25px] border-4 border-black font-black text-sm shadow-[8px_8px_0_rgba(0,0,0,0.5)] ${msg.senderId === user.uid ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-white'}`}>{msg.text}</div>
                   </div>
                 ))}
                 <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-8 bg-black/60 border-t-8 border-black flex gap-6"><input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Enter encrypted signal..." className="flex-1 bg-black border-4 border-white/5 p-6 font-black italic rounded-[25px] focus:border-red-600 outline-none text-white uppercase placeholder:text-white/10" /><button type="submit" className="bg-red-600 border-4 border-black w-24 rounded-[30px] shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><Send size={32} className="text-white" /></button></form>
           </div>
         )}

         { activeTab === 'war' && (
           <div className="flex-1 flex flex-col bg-slate-900 border-8 border-black rounded-[40px] shadow-[15px_15px_0_rgba(0,0,0,1)] overflow-hidden">
             
             {!warData ? (
               <div className="p-10 flex flex-col items-center justify-center h-full text-center">
                  <div className="w-32 h-32 bg-red-950 border-8 border-black rounded-full shadow-[10px_10px_0_rgba(0,0,0,1)] flex items-center justify-center mb-6">
                    <Swords size={64} className="text-red-500 animate-pulse" />
                  </div>
                  <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">Naga Protocol</h2>
                  <p className="text-white/40 font-black uppercase tracking-[0.2em] max-w-lg mb-8 text-xs">Authorize combat against rival syndicates using your enrolled Naga forces.</p>
                  
                  {player.guildRole === 'LEADER' ? (
                     <div className="w-full max-w-2xl bg-black/40 border-4 border-black rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-xl font-black text-red-500 uppercase italic flex items-center gap-2"><Target size={20} /> Target Acquisition</h3>
                           <button onClick={fetchGuilds} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase italic border-2 border-black flex items-center gap-2 hover:bg-slate-700"><RefreshCw size={12} /> Scan Grid</button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                           {allGuilds.filter(g => g.id !== player.guildId).map(g => (
                              <div key={g.id} className="flex items-center justify-between bg-slate-800 p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                                 <div>
                                    <h4 className="text-white font-black italic uppercase">{g.name} <span className="text-amber-500 text-[10px] ml-2">[{g.tag}]</span></h4>
                                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Level {g.level} Faction</p>
                                 </div>
                                 <button onClick={() => actions.initiateSyndicateWar(g.id, 2)} className="bg-red-600 text-white px-6 py-2 border-2 border-black rounded-xl font-black italic uppercase shadow-[4px_4px_0_rgba(0,0,0,1)] hover:scale-105 active:translate-y-1 active:shadow-none transition-all">Declare</button>
                              </div>
                           ))}
                           {allGuilds.filter(g => g.id !== player.guildId).length === 0 && (
                              <p className="text-white/30 text-xs font-black uppercase italic text-center py-4">No viable targets on the scanner.</p>
                           )}
                        </div>
                     </div>
                  ) : (
                     <div className="bg-red-950/20 border-2 border-red-500/50 p-6 rounded-2xl">
                        <p className="text-red-400 font-black uppercase text-sm italic">Only the Faction Leader can authorize declarations of war.</p>
                     </div>
                  )}
               </div>
             ) : (
               <div className="flex flex-col h-full overflow-hidden">
                 {/* War Header Banner */}
                 <div className="bg-red-950 border-b-8 border-black p-6 shrink-0 relative overflow-hidden flex justify-between items-center">
                    <div className="absolute inset-0 comic-halftone opacity-30 text-red-600 pointer-events-none"></div>
                    <div className="relative z-10">
                       <span className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black border-2 border-black uppercase italic animate-pulse shadow-[2px_2px_0_rgba(0,0,0,1)]">
                         {warData.status}
                       </span>
                       <h2 className="text-3xl font-black text-white uppercase italic mt-2 flex items-center gap-3">
                         <Swords size={28} className="text-amber-500" /> NAGA WAR <span className="text-white/20">|</span> <span className="text-red-400">2v2</span>
                       </h2>
                    </div>
                     {player.guildRole === 'LEADER' && warData.status === 'PENDING' && warData.guildB === player.guildId && (
                        <div className="relative z-10 flex gap-4">
                           <button onClick={() => actions.respondToSyndicateWar(warData.id, true)} className="bg-emerald-500 text-black px-6 py-3 border-4 border-black rounded-2xl font-black italic uppercase shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-emerald-400 transition-colors">Accept</button>
                           <button onClick={() => actions.respondToSyndicateWar(warData.id, false)} className="bg-slate-800 text-white px-6 py-3 border-4 border-black rounded-2xl font-black italic uppercase hover:bg-red-600 transition-colors">Decline</button>
                        </div>
                     )}
                     {player.guildRole === 'LEADER' && warData.status === 'PENDING' && warData.guildA === player.guildId && (
                        <div className="relative z-10 flex gap-4">
                           <button onClick={() => actions.abortSyndicateWar(warData.id)} className="bg-slate-800 text-white px-6 py-3 border-4 border-black rounded-2xl font-black italic uppercase hover:bg-red-600 transition-colors">Retract Declaration</button>
                        </div>
                     )}
                     {player.guildRole === 'LEADER' && warData.status === 'ENROLLMENT' && (
                        <div className="relative z-10 flex gap-4">
                           <button onClick={() => actions.abortSyndicateWar(warData.id)} className="bg-slate-800 text-white px-6 py-3 border-4 border-black rounded-2xl font-black italic uppercase hover:bg-red-600 transition-colors flex items-center gap-2"><Skull size={18} /> Abort War</button>
                        </div>
                     )}
                 </div>

                 {/* War Content Body */}
                 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* Enrollment Phase View */}
                    {warData.status === 'ENROLLMENT' && (
                       <div className="flex flex-col items-center">
                          <div className="bg-cyan-950/30 border-2 border-cyan-500/50 p-6 rounded-2xl max-w-2xl text-center mb-8">
                             <h3 className="text-cyan-400 text-xl font-black uppercase italic mb-2">Mobilization Protocol</h3>
                             <p className="text-white/60 text-xs font-black uppercase tracking-wider mb-4">Enroll your Naga to lock in its current Combat Stats. The offensive commences once ({warData.warSize}) Nagas from both syndicates are verified.</p>
                             
                             <button 
                                onClick={() => actions.enrollNagaInWar(warData.id)}
                                className="bg-cyan-600 text-white px-8 py-4 rounded-[20px] font-black uppercase italic border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] hover:bg-cyan-500 active:translate-y-1 active:shadow-none transition-all flex items-center gap-3 mx-auto"
                             >
                                <Zap size={20} /> ENROLL NAGA TO ROSTER
                             </button>
                          </div>

                          <div className="grid md:grid-cols-2 gap-12 w-full max-w-5xl">
                             {[
                               { title: 'Your Roster', key: warData.guildA === player.guildId ? 'defendersA' : 'defendersB', isEnemy: false },
                               { title: 'Rival Roster', key: warData.guildA === player.guildId ? 'defendersB' : 'defendersA', isEnemy: true }
                             ].map((roster) => {
                                const enrolled = Object.values(warData[roster.key] || {});
                                return (
                                   <div key={roster.title} className="bg-black/40 p-6 rounded-[30px] border-4 border-black shadow-inner">
                                      <div className="flex justify-between items-center mb-6">
                                         <h4 className={`text-2xl font-black italic uppercase ${roster.isEnemy ? 'text-red-500' : 'text-cyan-400'}`}>{roster.title}</h4>
                                         <span className="text-white font-black bg-slate-800 px-3 py-1 rounded-lg border-2 border-black">{enrolled.length} / {warData.warSize}</span>
                                      </div>
                                      <div className="space-y-4">
                                         {enrolled.map((naga, idx) => (
                                            <div key={naga.uid} className="bg-slate-800 border-2 border-black rounded-2xl p-3 flex items-center gap-4 relative overflow-hidden">
                                               <div className={`absolute top-0 right-0 bottom-0 w-2 ${roster.isEnemy ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                                               <div className="w-16 h-16 bg-black rounded-xl border-2 border-slate-700 overflow-hidden shrink-0 relative">
                                                  <img src={`/assets/dragonsground/gemx/${naga.gemxAvatar}`} alt="Gemx" className="w-full h-full object-cover" />
                                               </div>
                                               <div className="flex-1 min-w-0 pr-4">
                                                  <h5 className="text-white font-black text-sm uppercase truncate">{naga.name}</h5>
                                                  <div className="flex flex-wrap gap-2 mt-1">
                                                     <span className="text-[9px] font-black bg-black text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase">HP {naga.stats.maxHp}</span>
                                                     <span className="text-[9px] font-black bg-black text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase">SHIELD {naga.stats.shieldHp}</span>
                                                  </div>
                                               </div>
                                            </div>
                                         ))}
                                         {Array.from({ length: Math.max(0, warData.warSize - enrolled.length) }).map((_, i) => (
                                            <div key={`empty-${i}`} className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center h-24 opacity-50">
                                               <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Waiting Slot</span>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                );
                             })}
                          </div>
                       </div>
                    )}

                    {/* Battle Phase View */}
                    {warData.status === 'BATTLE' && (
                       <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
                          <div className="bg-amber-500/10 border-4 border-amber-500 rounded-[30px] p-6 text-center shadow-[0_0_30px_rgba(245,158,11,0.2)] relative">
                             <h3 className="text-amber-500 text-3xl font-black uppercase italic tracking-tighter">Combat Phase Initiated</h3>
                             <p className="text-white/70 font-black uppercase text-xs mt-2">Select an enemy Naga from the Rival Roster to engage in PvP.</p>
                             {player.guildRole === 'LEADER' && (
                                <button onClick={() => actions.concludeNagaWar(warData.id)} className="absolute top-1/2 -translate-y-1/2 right-6 bg-red-600 border-4 border-black text-white px-6 py-3 rounded-2xl font-black uppercase italic hover:scale-105 active:scale-95 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center gap-2">
                                   <Trophy size={16} /> END WAR TALLY
                                </button>
                             )}
                          </div>
                          
                          {/* (Detailed battle line-up mirrors the roster cards above, adding raid buttons) */}
                          <div className="grid md:grid-cols-2 gap-12">
                             {[
                               { title: 'Your Forces', key: warData.guildA === player.guildId ? 'defendersA' : 'defendersB', isEnemy: false },
                               { title: 'Rival Forces', guildId: warData.guildA === player.guildId ? warData.guildB : warData.guildA, key: warData.guildA === player.guildId ? 'defendersB' : 'defendersA', isEnemy: true }
                             ].map((roster) => {
                                const enrolled = Object.values(warData[roster.key] || {});
                                return (
                                   <div key={roster.title} className="bg-black/60 p-6 rounded-[30px] border-4 border-black shadow-[10px_10px_0_rgba(0,0,0,0.5)]">
                                      <h4 className={`text-2xl font-black italic uppercase mb-6 ${roster.isEnemy ? 'text-red-500' : 'text-cyan-400'}`}>{roster.title}</h4>
                                      <div className="space-y-4">
                                         {enrolled.map((naga) => (
                                            <div key={naga.uid} className={`bg-slate-800 border-4 ${naga.currentHp <= 0 ? 'border-slate-700 opacity-60 grayscale' : roster.isEnemy ? 'border-red-900' : 'border-cyan-900'} rounded-[20px] p-4 flex items-center gap-4 group transition-all`}>
                                               <div className="w-20 h-20 bg-black rounded-2xl border-4 border-black shadow-inner overflow-hidden shrink-0 relative">
                                                  <img src={`/assets/dragonsground/gemx/${naga.gemxAvatar}`} alt="Gemx" className="w-full h-full object-cover" />
                                                  {naga.currentHp <= 0 && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><Skull size={24} className="text-red-500" /></div>}
                                               </div>
                                               <div className="flex-1 min-w-0 pr-2">
                                                  <div className="flex justify-between items-start mb-1">
                                                     <h5 className="text-white font-black text-lg uppercase truncate italic">{naga.name}</h5>
                                                     {roster.isEnemy && naga.currentHp > 0 && (
                                                        <button 
                                                           onClick={() => actions.startGvGRaid(warData.id, naga.uid, naga, roster.guildId, "Rival")}
                                                           className="bg-red-600 text-white px-4 py-2 text-[10px] rounded-xl font-black uppercase italic border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 active:scale-95"
                                                        >RAID <Swords size={12} className="inline ml-1" /></button>
                                                     )}
                                                  </div>
                                                  <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-white/10 mb-2">
                                                     <div className={`h-full ${naga.currentHp <= 0 ? 'bg-slate-700' : 'bg-gradient-to-r from-red-600 to-amber-500'}`} style={{ width: `${Math.max(0, (naga.currentHp / naga.stats.totalMaxHp) * 100)}%` }}></div>
                                                  </div>
                                                  <div className="flex gap-4 text-[10px] font-black uppercase text-white/50">
                                                     <span className="flex items-center gap-1"><Shield size={10} className={naga.currentHp > 0 ? "text-amber-400" : ""} /> {Math.max(0, naga.currentHp)} / {naga.stats.totalMaxHp}</span>
                                                     <span className="flex items-center gap-1"><Zap size={10} className={naga.currentHp > 0 ? "text-cyan-400" : ""} /> {naga.stats.str} ATK</span>
                                                  </div>
                                               </div>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                );
                             })}
                          </div>
                       </div>
                    )}
                    
                    {/* Completed Phase View */}
                    {warData.status === 'COMPLETED' && (
                       <div className="flex flex-col items-center max-w-4xl mx-auto w-full gap-8">
                          <div className="bg-amber-500 border-[6px] border-black p-8 rounded-[40px] text-center shadow-[15px_15px_0_rgba(0,0,0,1)] w-full transform -rotate-1 relative overflow-hidden">
                             <div className="absolute inset-0 comic-halftone opacity-20 text-black pointer-events-none"></div>
                             <Trophy size={64} className="text-black mx-auto mb-4 animate-pulse relative z-10" />
                             <h3 className="text-black text-5xl font-black uppercase italic tracking-tighter drop-shadow-[2px_2px_0_#fff] relative z-10">WAR CONCLUDED</h3>
                             <p className="text-black/70 font-black uppercase tracking-widest mt-2 relative z-10">
                                {warData.winnerGuildId === player.guildId ? 'YOUR FACTION CLAIMED VICTORY!' : (warData.winnerGuildId === 'TIE' ? 'THE WAR WAS A STALEMATE.' : 'YOUR FACTION WAS DEFEATED.')}
                             </p>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-8 w-full">
                             <div className="bg-black/60 border-4 border-cyan-500 rounded-3xl p-6 shadow-[8px_8px_0_rgba(6,182,212,0.5)] transform rotate-1">
                                <h4 className="text-cyan-400 text-2xl font-black italic uppercase mb-2">Guild A Tally</h4>
                                <div className="flex items-center gap-2 mb-4">
                                   {[...Array(3)].map((_, i) => <Star key={i} size={32} className={i < warData.starsA ? "text-amber-400 fill-amber-400" : "text-slate-700"} />)}
                                </div>
                                <p className="text-white/60 text-xs font-black uppercase">Nagas Defeated: {warData.deadB} / {warData.warSize}</p>
                             </div>
                             
                             <div className="bg-black/60 border-4 border-red-500 rounded-3xl p-6 shadow-[8px_8px_0_rgba(239,68,68,0.5)] transform -rotate-1">
                                <h4 className="text-red-400 text-2xl font-black italic uppercase mb-2">Guild B Tally</h4>
                                <div className="flex items-center gap-2 mb-4">
                                   {[...Array(3)].map((_, i) => <Star key={i} size={32} className={i < warData.starsB ? "text-amber-400 fill-amber-400" : "text-slate-700"} />)}
                                </div>
                                <p className="text-white/60 text-xs font-black uppercase">Nagas Defeated: {warData.deadA} / {warData.warSize}</p>
                             </div>
                          </div>

                          <div className="w-full bg-slate-900 border-4 border-black rounded-3xl p-8 shadow-[10px_10px_0_rgba(0,0,0,1)] text-center relative overflow-hidden mt-4 group">
                             <div className="absolute inset-0 comic-halftone opacity-10 text-white transition-opacity group-hover:opacity-20"></div>
                             <h4 className="text-white text-xl font-black uppercase italic mb-6">Combat Bounty Distribution</h4>
                             <button
                                onClick={() => actions.claimNagaWarRewards(warData.id)}
                                disabled={warData.claimed?.[player.uid]}
                                className={`px-12 py-6 rounded-2xl font-black text-2xl uppercase italic border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all ${warData.claimed?.[player.uid] ? 'bg-slate-700 text-slate-400 grayscale' : 'bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-105 active:scale-95'}`}
                             >
                                {warData.claimed?.[player.uid] ? 'BOUNTY SECURED' : 'CLAIM WAR REWARD'}
                             </button>
                             <p className="text-white/40 text-[10px] font-black uppercase mt-4 tracking-widest">Rewards scale based on Victory Condition (GX + 12m Auto Scrolls)</p>
                          </div>
                       </div>
                    )}
                 </div>
               </div>
             )}
           </div>
         )}
         {activeTab === 'lab' && (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 border-8 border-black rounded-[40px] shadow-[15px_15px_0_rgba(0,0,0,1)] text-center p-10 relative overflow-hidden">
               <div className="absolute inset-0 comic-halftone opacity-10 text-emerald-500 pointer-events-none"></div>
               <FlaskConical size={80} className="text-emerald-500 mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-bounce relative z-10" />
               <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4 relative z-10">Research Lab</h2>
               <p className="text-emerald-400 font-black uppercase tracking-widest text-sm mb-8 relative z-10">Current Tech Level: {guildData?.labLevel || 0}</p>
               
               <div className="bg-black/60 border-4 border-emerald-500 rounded-3xl p-8 max-w-lg mb-8 relative z-10 shadow-[8px_8px_0_rgba(16,185,129,0.3)] transform -rotate-1">
                  <h3 className="text-emerald-400 text-xl font-black italic uppercase mb-4 flex items-center justify-center gap-2"><Zap size={20} /> Active Global Buff</h3>
                  <p className="text-white font-black uppercase text-sm">+{((guildData?.labLevel || 0) * 5)}% to Combat Power.</p>
                  <p className="text-white/50 text-[10px] mt-2 italic uppercase tracking-widest">Applies to STR, AGI, DEX, and Base HP for all enrolled Nagas globally.</p>
               </div>
               
               <button onClick={() => actions.donateToSyndicateLab()} className="bg-emerald-600 hover:bg-emerald-500 text-black px-12 py-6 rounded-3xl font-black text-xl uppercase italic border-4 border-black shadow-[10px_10px_0_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 relative z-10">
                  <Rocket size={24} /> Upgrade Tech Level
               </button>
               <span className="text-[10px] font-black text-white/40 uppercase mt-4 tracking-[0.2em] relative z-10">Cost: 10,000 GX</span>
            </div>
         )}
         
         {activeTab === 'leaderboard' && (
            <div className="flex-1 flex flex-col bg-slate-900 border-8 border-black rounded-[40px] shadow-[15px_15px_0_rgba(0,0,0,1)] overflow-hidden">
               <div className="bg-amber-500 border-b-8 border-black p-8 shrink-0 flex justify-between items-center relative">
                  <div className="absolute inset-0 comic-halftone opacity-20 text-black pointer-events-none"></div>
                  <h2 className="text-4xl font-black text-black italic uppercase tracking-tighter relative z-10 flex items-center gap-4"><Trophy size={32} /> Syndicate Global Rankings</h2>
                  <button onClick={fetchGuilds} className="bg-black text-white px-6 py-2 rounded-xl text-xs font-black uppercase italic hover:scale-105 active:scale-95 transition-all relative z-10 border border-white/20">Refetch Rankings</button>
               </div>
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="space-y-4">
                     {[...allGuilds].sort((a, b) => ((b.gxVault || 0) + (b.xp || 0)) - ((a.gxVault || 0) + (a.xp || 0))).map((guild, idx) => (
                        <div key={guild.id} className={`flex items-center gap-6 p-6 rounded-3xl border-4 ${idx === 0 ? 'bg-amber-500/20 border-amber-500 shadow-[6px_6px_0_rgba(245,158,11,0.5)]' : 'bg-black border-slate-800'} relative overflow-hidden`}>
                           <div className={`w-12 h-12 flex items-center justify-center font-black text-2xl italic ${idx === 0 ? 'text-amber-500' : 'text-slate-500'}`}>#{idx + 1}</div>
                           <div className="flex-1">
                              <h3 className="text-2xl font-black text-white uppercase italic">{guild.name} <span className="text-amber-500 text-sm ml-2">[{guild.tag}]</span></h3>
                              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Tech Lvl {guild.labLevel || 0} | Members: {guild.members?.length || 0}</p>
                           </div>
                           <div className="text-right">
                              <span className="block text-amber-500 font-black text-xl italic drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">{(guild.gxVault || 0).toLocaleString()} GX</span>
                              <span className="block text-white/30 font-black uppercase text-[10px] tracking-widest mt-1">Staked Liquidity</span>
                           </div>
                        </div>
                     ))}
                     {allGuilds.length === 0 && <p className="text-center text-white/40 font-black italic uppercase mt-10">No Syndicates Recorded.</p>}
                  </div>
               </div>
            </div>
         )}
       </div>

       <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 8px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.3); border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
         .font-comic { font-family: 'Inter', sans-serif; font-weight: 900; }
       `}</style>
    </div>
  );
};
