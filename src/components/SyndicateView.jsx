import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Crown, Users, Rocket, Zap, Settings, 
  ArrowRight, Plus, Terminal, AlertTriangle, Search,
  RefreshCw, LogOut, UserPlus, Send, FlaskConical, MessageSquare,
  Swords, Target, Flame, Trophy, Star, Skull
} from 'lucide-react';
import { doc, getDoc, getDocs, collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { useGame } from '../contexts/GameContext';

export const SyndicateView = () => {
  const { 
    player, actions, db, appId, audio, SOUNDS, totalStats, adventure
  } = useGame();
  
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'messages', 'lab', 'war'
  const [guildData, setGuildData] = useState(null);
  const [warData, setWarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allGuilds, setAllGuilds] = useState([]);
  
  // Creation Form State
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFinder, setShowFinder] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  // --- GUILD DATA SYNC ---
  useEffect(() => {
    if (!player?.guildId) return;
    
    setLoading(true);
    const guildRef = doc(db, 'artifacts', appId, 'guilds', player.guildId);
    
    const unsubscribe = onSnapshot(guildRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGuildData(data);
        
        // Sync active war if exists
        if (data.activeWarId) {
          const warRef = doc(db, 'artifacts', appId, 'guild_wars', data.activeWarId);
          onSnapshot(warRef, (wSnap) => {
            if (wSnap.exists()) setWarData({ id: wSnap.id, ...wSnap.data() });
          });
        }
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [player?.guildId, db, appId]);

  // --- MESSAGES SYNC ---
  useEffect(() => {
    if (!player?.guildId || activeTab !== 'messages') return;
    const messagesRef = collection(db, 'artifacts', appId, 'guilds', player.guildId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubscribe();
  }, [player?.guildId, activeTab, db, appId]);

  const fetchGuilds = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'artifacts', appId, 'guilds'), limit(20));
      const snap = await getDocs(q);
      setAllGuilds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleRaid = async (opponentId) => {
    // Check if player already attacked this target
    const ident = (player.email || player.uid).replace(/\./g, '_');
    const attacks = warData.guildA_Attacks?.[ident] || [];
    if (attacks.length >= 2) return alert("NO ATTACK ENERGY REMAINING (2/2 USED)");

    // Simplified Raid Logic:
    // 1-3 stars based on power level difference
    // In a full implementation, this should trigger a CombatView against the defender's stats.
    setLoading(true);
    
    // Simulate Battle:
    const roll = Math.random();
    let stars = 1;
    if (roll > 0.4) stars = 2;
    if (roll > 0.8) stars = 3;

    await actions.recordWarResult(warData.id, stars, opponentId);
    setLoading(false);
    audio.playSFX(SOUNDS.obtainItem);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await actions.sendSyndicateMessage(text);
  };

  // --- UNAFFILIATED VIEWS (FINDER/CREATE) ---
  if (!player?.guildId && !showFinder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in duration-500 overflow-y-auto relative">
        <button 
          onClick={() => adventure.setView('menu')}
          className="absolute top-4 right-4 bg-slate-800 text-white px-6 py-2 rounded-full border-2 border-black font-black uppercase italic shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-slate-700 transition-all z-20"
        >
          Exit
        </button>
        <div className="w-full max-w-4xl flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-24 h-24 bg-red-600 border-[6px] border-black rounded-full shadow-[8px_8px_0_rgba(0,0,0,1)] flex items-center justify-center transform hover:rotate-12 transition-transform cursor-pointer">
              <Shield size={48} className="text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase">The <span className="text-red-500">Syndicate</span></h1>
            <p className="text-white/60 font-black uppercase text-xs md:text-sm tracking-widest italic max-w-lg text-center">Establish your legacy or join an existing uplink to dominate the Xenon grid.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 w-full">
            <button onClick={() => setShowCreateModal(true)} className="group relative bg-amber-500 border-[4px] border-black p-8 rounded-2xl shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all overflow-hidden text-left">
              <div className="absolute inset-0 comic-halftone opacity-20 transition-opacity"></div>
              <Plus className="mb-4 text-black" size={40} strokeWidth={4} />
              <h2 className="text-2xl font-black text-black uppercase italic text-center">Forge Syndicate</h2>
              <p className="text-black/70 font-bold text-sm mb-4">Initial Investment: 50,000 GX</p>
              <div className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full w-fit"><span className="font-black italic uppercase text-xs">Establish Link</span><ArrowRight size={16} /></div>
            </button>
            <button onClick={() => { fetchGuilds(); setShowFinder(true); }} className="group relative bg-slate-800 border-[4px] border-black p-8 rounded-2xl shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all overflow-hidden text-left text-center">
               <Search className="mb-4 text-cyan-400" size={40} strokeWidth={4} />
               <h2 className="text-2xl font-black text-white uppercase italic text-center">Find Uplink</h2>
               <p className="text-white/50 font-bold text-sm mb-4">Search for active factions.</p>
               <div className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full w-fit"><span className="font-black italic uppercase text-xs">Browse Grid</span><ArrowRight size={16} /></div>
            </button>
          </div>
        </div>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="w-full max-w-md bg-slate-900 border-[8px] border-black rounded-3xl shadow-[20px_20px_0_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="bg-amber-500 border-b-[8px] border-black p-6 relative"><h3 className="text-3xl font-black text-black uppercase italic text-center">Forge Protocol</h3><button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">X</button></div>
                <div className="p-8 flex flex-col gap-6">
                   <div className="space-y-2"><label className="text-white/50 font-black uppercase text-[10px] italic tracking-widest text-center">Syndicate Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border-[4px] border-black text-white p-4 font-black italic rounded-xl focus:border-red-500 outline-none" /></div>
                   <div className="space-y-2"><label className="text-white/50 font-black uppercase text-[10px] italic tracking-widest text-center">Faction Tag</label><input type="text" value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={4} className="w-full bg-black border-[4px] border-black text-white p-4 font-black italic rounded-xl focus:border-red-500 outline-none uppercase" /></div>
                   <button onClick={() => actions.createSyndicate(name, tag)} disabled={player.tokens < 50000} className="w-full bg-red-600 hover:bg-red-500 border-[4px] border-black p-5 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"><Rocket size={24} /> <span className="text-xl font-black text-white uppercase italic">Initiate Link</span></button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  if (showFinder) { /* Finder logic same as Phase 2 but added UI polish */
    return (
      <div className="flex-1 flex flex-col p-4 md:p-8 animate-in slide-in-from-bottom-12 duration-500 overflow-y-auto w-full max-w-5xl mx-auto">
         <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-black text-white italic uppercase flex items-center gap-4"><Search className="text-cyan-400" /> Syndicate Finder</h1>
            <button onClick={() => setShowFinder(false)} className="bg-slate-800 text-white px-6 py-2 rounded-full border-2 border-black font-black uppercase italic shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-slate-700 transition-all">Back</button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allGuilds.map((g) => (
               <div key={g.id} className="bg-slate-900 border-[4px] border-black p-6 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] relative overflow-hidden group">
                  <div className="absolute inset-0 comic-halftone opacity-10"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10 text-center">
                     <span className="bg-black text-cyan-400 px-3 py-1 rounded text-[10px] font-black border border-cyan-400/30 uppercase italic">{g.tag}</span>
                     <span className="text-white/40 text-[10px] font-black uppercase italic">{g.members?.length || 0} / 30 Members</span>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-6 truncate relative z-10 text-center">{g.name}</h3>
                  <button onClick={() => actions.joinSyndicate(g.id)} disabled={loading || g.members?.includes(player.email || player.uid)} className="w-full bg-cyan-600 hover:bg-cyan-500 border-[3px] border-black p-3 rounded-xl shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"><UserPlus size={18} className="text-black" /> <span className="font-black text-black uppercase italic text-sm">Join Uplink</span></button>
               </div>
            ))}
         </div>
      </div>
    );
  }

  // --- MEMBER VIEW ---
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in slide-in-from-right-12 duration-500 overflow-hidden max-w-7xl mx-auto w-full">
      
      <div className="flex items-center gap-2 mb-6 bg-black/40 p-1 rounded-2xl border-2 border-white/5 w-fit">
         {[
           { id: 'overview', icon: <Shield size={16} />, label: 'Overview' },
           { id: 'messages', icon: <MessageSquare size={16} />, label: 'Comms' },
           { id: 'lab', icon: <FlaskConical size={16} />, label: 'S-Lab' },
           { id: 'war', icon: <Swords size={16} />, label: 'Neon War' }
         ].map(tab => (
           <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-black text-[10px] uppercase italic ${activeTab === tab.id ? 'bg-red-600 text-white border-2 border-black shadow-lg scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
           >
             {tab.icon} {tab.label}
           </button>
         ))}
         <button 
            onClick={() => adventure.setView('menu')}
            className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-black text-[10px] uppercase italic text-white/40 hover:text-white hover:bg-white/5 border-l-2 border-white/5 ml-2"
          >
            <LogOut size={16} /> Exit
          </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8 overflow-hidden h-full flex-1">
             <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="w-full bg-red-950 border-[6px] border-black rounded-3xl p-8 shadow-[12px_12px_0_rgba(0,0,0,1)] relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 comic-halftone opacity-30 text-red-500"></div>
                  <div className="relative z-10 flex justify-between items-center text-center">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-amber-500 border-[4px] border-black rounded-2xl flex items-center justify-center transform -rotate-6">
                        <Shield size={32} className="text-black" />
                      </div>
                      <div className="text-left text-center">
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{guildData?.name}</h2>
                        <span className="text-[10px] font-black text-white/50 italic tracking-widest uppercase">SYNDICATE UPLINK ({guildData?.tag})</span>
                      </div>
                    </div>
                    <div className="bg-black/60 border-2 border-amber-500/20 rounded-2xl p-4 min-w-[120px]">
                       <span className="text-[10px] font-black text-amber-500 uppercase block mb-1">XP PROGRESS</span>
                       <div className="h-1.5 bg-black rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${(guildData?.xp % 1000) / 10}%` }}></div></div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-slate-900 border-[4px] border-black rounded-3xl p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden flex flex-col">
                   <h3 className="font-black text-white uppercase italic mb-6 flex items-center gap-2"><Users size={20} className="text-red-500" /> Syndicate Roster</h3>
                   <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {guildData?.members?.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 hover:border-red-500/30 transition-all group">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center font-black text-[10px] group-hover:bg-red-600 transition-colors uppercase text-center font-center">{m?.slice(0, 2)}</div>
                              <p className="text-xs font-black text-white italic uppercase truncate text-center font-center">{m}</p>
                           </div>
                           {m === guildData.leaderId && <Crown size={14} className="text-amber-500" />}
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             <div className="space-y-6">
               <div className="bg-slate-900 border-[4px] border-black rounded-2xl p-6 shadow-[8px_8px_0_rgba(0,0,0,1)]">
                  <h3 className="font-black text-white uppercase italic mb-6 flex items-center gap-2"><Rocket size={20} className="text-cyan-400" /> Vault</h3>
                  <div className="bg-black p-4 rounded-xl border-2 border-white/5 shadow-inner flex flex-col items-center">
                     <span className="text-[10px] font-black text-white/40 uppercase mb-1">Total GX Reserves</span>
                     <span className="text-3xl font-black text-amber-500 italic">{(guildData?.gxVault || 0).toLocaleString()} GX</span>
                  </div>
               </div>
               {player.guildRole !== 'LEADER' && (
                 <button onClick={() => actions.leaveSyndicate()} className="w-full bg-red-950/40 hover:bg-red-950 border-2 border-red-900/50 p-4 rounded-xl flex items-center justify-center gap-3 transition-all"><LogOut size={18} className="text-red-500" /><span className="font-black text-red-500 uppercase italic text-sm">Terminate Link</span></button>
               )}
             </div>
          </div>
        )}

        {/* TAB: CHANNEL (Same as Phase 3) */}
        {activeTab === 'messages' && (
          <div className="flex-1 flex flex-col bg-slate-900 border-[4px] border-black rounded-3xl p-1 shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden">
             <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.length === 0 && <div className="py-20 text-center opacity-20 font-black uppercase italic italic text-center">Secure channel established. Waiting for transmissions...</div>}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === (player.email || player.uid) ? 'items-end' : 'items-start'}`}>
                     <span className="text-[8px] font-black uppercase text-white/30 italic mb-1">{msg.senderName}</span>
                     <div className={`max-w-[80%] p-3 rounded-2xl border-2 border-black font-bold text-sm shadow-[4px_4px_0_rgba(0,0,0,0.5)] ${msg.senderId === (player.email || player.uid) ? 'bg-red-600' : 'bg-slate-800'}`}>{msg.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
             </div>
             <form onSubmit={handleSendMessage} className="p-6 bg-black/60 border-t-4 border-black flex gap-4"><input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Transmit message..." className="flex-1 bg-black border-[3px] border-white/10 p-4 font-black italic rounded-xl focus:border-red-500 outline-none" /><button type="submit" className="bg-red-600 border-[4px] border-black p-4 rounded-xl shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center"><Send size={24} className="text-white" /></button></form>
          </div>
        )}

        {/* TAB: S-LAB (Same as Phase 3) */}
        {activeTab === 'lab' && (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden max-w-5xl mx-auto w-full">
             <div className="bg-amber-500 border-[6px] border-black rounded-3xl p-8 shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden"><div className="absolute inset-0 comic-halftone opacity-30"></div><div className="relative z-10 flex items-center gap-6"><div className="w-16 h-16 bg-black border-[4px] border-white/20 rounded-2xl flex items-center justify-center rotate-6 shadow-2xl"><FlaskConical size={32} className="text-amber-500 animate-pulse" /></div><div className="text-left text-center"><h2 className="text-4xl font-black text-black uppercase italic tracking-tighter">Syndicate Lab</h2><p className="text-black/60 font-black text-xs uppercase italic truncate">Invest materials to increase Syndicate Level. Collective progress unlocks the Star Reactor.</p></div></div></div>
             <div className="flex-1 bg-slate-900 border-[4px] border-black rounded-3xl p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden flex flex-col">
                <h3 className="font-black text-white uppercase italic mb-6 pb-4 border-b-2 border-white/5">Storage Facility</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                   {player.inventory?.filter(i => i.category === 'Loot' || i.category === 'Fruit').map((item, i) => (
                      <div key={i} className="bg-black/60 border-[3px] border-black p-4 rounded-xl flex items-center justify-between hover:border-amber-500/50 transition-all group">
                         <div className="flex items-center gap-3"><span className="text-2xl group-hover:scale-125 transition-transform">{item.icon}</span><div className="text-left"><p className="text-xs font-black text-white italic uppercase truncate text-center font-center">{item.name}</p><p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">{item.rarity || 'Common'}</p></div></div>
                         <button onClick={() => actions.donateToSyndicateLab(item)} className="px-3 py-1.5 bg-amber-600 border-2 border-black rounded-lg text-[10px] font-black uppercase italic shadow-[3px_3px_0_rgba(0,0,0,1)] transition-all">Invest</button>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* TAB: NEON WAR (NEW PHASE 4) */}
        {activeTab === 'war' && (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden w-full">
             
             {!warData ? (
               <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 border-[4px] border-black rounded-3xl shadow-[8px_8px_0_rgba(0,0,0,1)] text-center">
                  <Flame size={64} className="text-red-500 mb-6 animate-pulse" />
                  <h3 className="text-3xl font-black text-white uppercase italic italic mb-4">No Active Wars Detected</h3>
                  <p className="text-white/40 font-black uppercase text-xs italic mb-8 max-w-sm">Scan the global grid for rival syndicates. Mobilization requires a Grade 5 Leader authorization.</p>
                  
                  {player.guildRole === 'LEADER' ? (
                    <button 
                      onClick={() => { fetchGuilds(); setShowFinder(true); }}
                      className="bg-red-600 hover:bg-red-500 border-[4px] border-black px-12 py-5 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-4 text-center"
                    >
                      <Swords size={24} /> <span className="text-xl font-black text-white uppercase italic">Declare War</span>
                    </button>
                  ) : (
                    <div className="bg-black/60 px-6 py-3 rounded-full border-2 border-white/5 text-white/50 text-[10px] font-black uppercase italic">Awaiting Leader Orders...</div>
                  )}
               </div>
             ) : (
               <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                  {/* BATTLE SCOREBOARD */}
                  <div className="bg-red-600 border-[6px] border-black rounded-3xl p-8 shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden shrink-0">
                     <div className="absolute inset-0 comic-halftone opacity-30"></div>
                     <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left flex-1 text-center">
                           <h4 className="text-[10px] font-black text-black uppercase italic tracking-[0.3em] mb-2 font-center">UPLINK STATUS</h4>
                           <h2 className="text-4xl font-black text-white italic uppercase drop-shadow-lg truncate text-center">{guildData?.name}</h2>
                           <div className="text-5xl font-black text-white italic mt-2 text-center">{warData.guildA_Stars} <Star className="inline text-amber-400 mb-2" size={32} /></div>
                        </div>

                        <div className="w-20 h-20 bg-black border-[4px] border-white/20 rounded-full flex items-center justify-center rotate-12 shadow-2xl relative shrink-0">
                           <span className="text-2xl font-black text-red-500 italic uppercase">VS</span>
                           <div className="absolute -top-2 -right-2 bg-red-600 p-1 rounded-full"><Skull size={20} className="text-white" /></div>
                        </div>

                        <div className="text-center md:text-right flex-1 text-center">
                           <h4 className="text-[10px] font-black text-black uppercase italic tracking-[0.3em] mb-2 font-center">OPPONENT UPLINK</h4>
                           <h2 className="text-4xl font-black text-white italic uppercase drop-shadow-lg truncate text-center">TARGET NODE</h2>
                           <div className="text-5xl font-black text-white italic mt-2 text-center font-center">{warData.guildB_Stars} <Star className="inline text-amber-400 mb-2" size={32} /></div>
                        </div>
                     </div>
                  </div>

                  {/* ATTACK GRID */}
                  <div className="flex-1 bg-slate-950 border-[4px] border-black rounded-3xl p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden flex flex-col">
                     <div className="flex items-center justify-between mb-6 border-b-2 border-white/5 pb-4">
                        <h3 className="font-black text-white uppercase italic flex items-center gap-3"><Target size={20} className="text-red-500" /> Battle Grid: Sub-Nodes</h3>
                        <div className="bg-black px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                           <span className="text-[10px] font-black text-white/40 uppercase italic">ATTACKS LEFT:</span>
                           <div className="flex gap-1">
                              {[0, 1].map(i => (
                                 <div key={i} className={`w-3 h-3 rounded-full border border-black ${ (warData.guildA_Attacks?.[(player.email || player.uid).replace(/\./g, '_')]?.length || 0) > i ? 'bg-slate-700' : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                        {[...Array(10)].map((_, i) => (
                           <div key={i} className="bg-slate-900 border-[3px] border-black rounded-2xl p-4 flex flex-col items-center gap-4 group hover:border-red-500/50 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)]">
                              <div className="w-16 h-16 bg-black border-2 border-white/5 rounded-xl flex items-center justify-center relative shadow-inner">
                                 <Skull size={32} className="text-white/20 group-hover:text-red-500 transition-colors" />
                                 <div className="absolute -top-2 -right-2 bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase italic">NODE {i+1}</div>
                              </div>
                              <div className="text-center text-center">
                                 <p className="text-[8px] font-black text-white/30 uppercase italic mb-1 tracking-widest text-center font-center">SECTOR DEFENDER</p>
                                 <p className="text-xs font-black text-white uppercase italic truncate max-w-[120px] text-center font-center">UNIT_X{i+8}82</p>
                              </div>
                              <button 
                                onClick={() => handleRaid(`target_${i}`)}
                                disabled={loading || (warData.guildA_Attacks?.[(player.email || player.uid).replace(/\./g, '_')]?.length || 0) >= 2}
                                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-30 border-[3px] border-black py-2 rounded-xl shadow-[4px_4px_0_rgba(0,0,0,0.3)] font-black text-white uppercase italic text-[10px] transform group-hover:scale-105 transition-all flex items-center justify-center gap-2"
                              >
                                {loading ? 'SIGNAL...' : <><Flame size={12} /> INITIATE RAID</>}
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

      </div>

      {/* RENDER FINDER UI IN WAR TAB (FOR LEADERS) */}
      {showFinder && activeTab === 'war' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in zoom-in duration-300">
           <div className="w-full max-w-4xl bg-slate-900 border-[8px] border-black rounded-[40px] shadow-[30px_30px_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-red-600 border-b-[8px] border-black p-8 relative flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="text-center md:text-left text-center">
                    <h3 className="text-4xl font-black text-white uppercase italic italic drop-shadow-lg text-center font-center">Target Acquisition</h3>
                    <p className="text-black/60 font-black text-[10px] uppercase italic tracking-[0.2em] mt-1 text-center font-center">SELECT SECTOR FOR SYNDICATE DEPLOYMENT</p>
                 </div>
                 <button onClick={() => setShowFinder(false)} className="bg-black text-white px-8 py-3 rounded-full border-4 border-white/20 font-black uppercase italic hover:bg-white hover:text-black transition-all">ABORT</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 grid md:grid-cols-2 gap-6 custom-scrollbar">
                 {allGuilds.filter(g => g.id !== player.guildId).map(g => (
                   <div key={g.id} className="bg-black/60 border-[4px] border-black p-6 rounded-3xl flex flex-col justify-between hover:border-red-500/50 transition-all group shadow-[8px_8px_0_rgba(0,0,0,0.3)]">
                      <div className="flex justify-between items-center mb-6 text-center">
                        <span className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase italic">{g.tag}</span>
                        <div className="flex items-center gap-2 text-white/40"><Users size={12} /> <span className="text-[10px] font-black uppercase italic">{g.members?.length || 0}/30</span></div>
                      </div>
                      <h4 className="text-2xl font-black text-white uppercase italic mb-8 truncate group-hover:text-red-500 transition-colors text-center font-center">{g.name}</h4>
                      <button 
                        onClick={() => { actions.initiateSyndicateWar(g.id); setShowFinder(false); }}
                        className="w-full bg-white hover:bg-red-600 hover:text-white text-black p-4 rounded-2xl font-black uppercase italic tracking-tighter border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-3"
                      >
                        <Flame size={20} /> COMMENCE WARFARE
                      </button>
                   </div>
                 ))}
                 {allGuilds.length <= 1 && <div className="col-span-full py-20 text-center opacity-20 font-black italic uppercase">No rival syndicates detected in this sector.</div>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
