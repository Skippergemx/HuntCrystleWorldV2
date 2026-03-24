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
  const [warManifestSize, setWarManifestSize] = useState(1);
  const [selectedDefenders, setSelectedDefenders] = useState([]);

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
        } else {
          setWarData(null);
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
    const ident = (player.email || player.uid).replace(/\./g, '_');
    const attacks = (warData.guildA === player.guildId ? warData.guildA_Attacks : warData.guildB_Attacks)?.[ident] || [];
    if (attacks.length >= 2) return alert("NO ATTACK ENERGY REMAINING (2/2 USED)");

    // Trigger Combat Simulation for now (Phase 5 will trigger Real CombatView)
    setLoading(true);
    const roll = Math.random() * 100;
    // recordWarResult takes: warId, stars (calculated in hook), opponentId, damageDealtPercent
    await actions.recordWarResult(warData.id, 0, opponentId, roll); 
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
            <p className="text-white/60 font-black uppercase text-xs md:text-sm tracking-widest italic max-w-lg text-center font-center">Establish your legacy or join an existing uplink to dominate the Xenon grid.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 w-full">
            <button onClick={() => setShowCreateModal(true)} className="group relative bg-amber-500 border-[4px] border-black p-8 rounded-2xl shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all overflow-hidden text-left">
              <div className="absolute inset-0 comic-halftone opacity-20"></div>
              <Plus className="mb-4 text-black" size={40} strokeWidth={4} />
              <h2 className="text-2xl font-black text-black uppercase italic text-center">Forge Syndicate</h2>
              <p className="text-black/70 font-bold text-sm mb-4 font-center">Initial Investment: 50,000 GX</p>
              <div className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full w-fit"><span className="font-black italic uppercase text-xs">Establish Link</span><ArrowRight size={16} /></div>
            </button>
            <button onClick={() => { fetchGuilds(); setShowFinder(true); }} className="group relative bg-slate-800 border-[4px] border-black p-8 rounded-2xl shadow-[10px_10px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all overflow-hidden text-left">
               <Search className="mb-4 text-cyan-400" size={40} strokeWidth={4} />
               <h2 className="text-2xl font-black text-white uppercase italic text-center">Find Uplink</h2>
               <p className="text-white/50 font-bold text-sm mb-4 font-center">Search for active factions.</p>
               <div className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full w-fit"><span className="font-black italic uppercase text-xs">Browse Grid</span><ArrowRight size={16} /></div>
            </button>
          </div>
        </div>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="w-full max-w-md bg-slate-900 border-[8px] border-black rounded-3xl shadow-[20px_20px_0_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="bg-amber-500 border-b-[8px] border-black p-6 relative flex items-center justify-center"><h3 className="text-3xl font-black text-black uppercase italic">Forge Protocol</h3><button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black">X</button></div>
                <div className="p-8 flex flex-col gap-6">
                   <div className="space-y-2"><label className="text-white/50 font-black uppercase text-[10px] italic tracking-widest text-center block">Syndicate Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border-[4px] border-black text-white p-4 font-black italic rounded-xl focus:border-red-500 outline-none" /></div>
                   <div className="space-y-2"><label className="text-white/50 font-black uppercase text-[10px] italic tracking-widest text-center block">Faction Tag</label><input type="text" value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={4} className="w-full bg-black border-[4px] border-black text-white p-4 font-black italic rounded-xl focus:border-red-500 outline-none uppercase" /></div>
                   <button onClick={() => actions.createSyndicate(name, tag)} disabled={player.tokens < 50000} className="w-full bg-red-600 hover:bg-red-500 border-[4px] border-black p-5 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"><Rocket size={24} /> <span className="text-xl font-black text-white uppercase italic">Initiate Link</span></button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  if (showFinder && !player?.guildId) {
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
                  <div className="flex items-center justify-between mb-4 relative z-10">
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
            className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-black text-[10px] uppercase italic text-white/40 hover:text-white hover:bg-white/5 border-l-2 border-white/5 ml-2 font-center"
          >
            <LogOut size={16} /> Exit
          </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8 overflow-hidden h-full flex-1">
             <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="w-full bg-red-950 border-[6px] border-black rounded-3xl p-8 shadow-[12px_12px_0_rgba(0,0,0,1)] relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 comic-halftone opacity-30 text-red-500"></div>
                  <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-amber-500 border-[4px] border-black rounded-2xl flex items-center justify-center transform -rotate-6">
                        <Shield size={32} className="text-black" />
                      </div>
                      <div className="text-left text-center">
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{guildData?.name}</h2>
                        <span className="text-[10px] font-black text-white/50 italic tracking-widest uppercase">SYNDICATE UPLINK ({guildData?.tag})</span>
                      </div>
                    </div>
                    <div className="bg-black/60 border-2 border-amber-500/20 rounded-2xl p-4 min-w-[120px] text-center">
                       <span className="text-[10px] font-black text-amber-500 uppercase block mb-1">XP PROGRESS</span>
                       <div className="h-1.5 bg-black rounded-full overflow-hidden text-center"><div className="h-full bg-amber-500" style={{ width: `${(guildData?.xp % 1000) / 10}%` }}></div></div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-slate-900 border-[4px] border-black rounded-3xl p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden flex flex-col">
                   <h3 className="font-black text-white uppercase italic mb-6 flex items-center gap-2"><Users size={20} className="text-red-500" /> Syndicate Roster</h3>
                   <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {guildData?.members?.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 hover:border-red-500/30 transition-all group">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center font-black text-[10px] group-hover:bg-red-600 transition-colors">{m?.split('@')[0].slice(0, 2)}</div>
                              <p className="text-xs font-black text-white italic uppercase truncate text-center font-center">{m?.split('@')[0]}</p>
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

        { activeTab === 'messages' && (
          <div className="flex-1 flex flex-col bg-slate-900 border-[4px] border-black rounded-3xl p-1 shadow-[8px_8px_0_rgba(0,0,0,1)] overflow-hidden">
             <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.length === 0 && <div className="py-20 text-center opacity-20 font-black uppercase italic text-center">Secure channel established. Waiting for transmissions...</div>}
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

        { activeTab === 'lab' && (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden max-w-5xl mx-auto w-full">
             <div className="bg-amber-500 border-[6px] border-black rounded-3xl p-8 shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden text-center"><div className="absolute inset-0 comic-halftone opacity-30"></div><div className="relative z-10 flex items-center gap-6"><div className="w-16 h-16 bg-black border-[4px] border-white/20 rounded-2xl flex items-center justify-center rotate-6 shadow-2xl"><FlaskConical size={32} className="text-amber-500 animate-pulse" /></div><div className="text-left text-center"><h2 className="text-4xl font-black text-black uppercase italic tracking-tighter">Syndicate Lab</h2><p className="text-black/60 font-black text-xs uppercase italic truncate">Invest materials to increase Syndicate Level. Collective progress unlocks the Star Reactor.</p></div></div></div>
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

        { activeTab === 'war' && (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden w-full">
             {!warData ? (
               <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 border-[4px] border-black rounded-3xl shadow-[8px_8px_0_rgba(0,0,0,1)] text-center font-center">
                  <Flame size={64} className="text-red-500 mb-6 animate-pulse" />
                  <h3 className="text-3xl font-black text-white uppercase italic mb-4 font-center">No Active Wars Detected</h3>
                  <p className="text-white/40 font-black uppercase text-xs italic mb-10 max-w-sm text-center">Scan the global grid for rival syndicates. Mobilization requires a Grade 5 Leader authorization.</p>
                  
                  {player.guildRole === 'LEADER' ? (
                    <div className="flex flex-col items-center gap-6">
                       <div className="flex gap-4">
                          {[1, 2, 3, 5, 6].map(num => (
                             <button key={num} onClick={() => setWarManifestSize(num)} className={`px-4 py-2 rounded-xl border-2 font-black italic uppercase transition-all ${warManifestSize === num ? 'bg-red-600 border-black scale-110 shadow-lg' : 'bg-slate-800 border-white/5 opacity-50'}`}>{num}v{num}</button>
                          ))}
                       </div>
                       <button onClick={() => { fetchGuilds(); setShowFinder(true); }} className="bg-red-600 hover:bg-red-500 border-[4px] border-black px-12 py-5 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-4 text-center"><Swords size={24} /> <span className="text-xl font-black text-white uppercase italic font-center">Declare {warManifestSize}v{warManifestSize} War</span></button>
                    </div>
                  ) : (
                    <div className="bg-black/60 px-6 py-3 rounded-full border-2 border-white/5 text-white/50 text-[10px] font-black uppercase italic">Awaiting Leader Orders...</div>
                  )}
               </div>
             ) : (
                <div className="flex-1 flex flex-col gap-6 overflow-hidden w-full">
                  {/* PREPARATION PHASE */}
                  {((warData.guildA === player.guildId && Object.keys(warData.defendersA || {}).length === 0) || (warData.guildB === player.guildId && Object.keys(warData.defendersB || {}).length === 0)) && player.guildRole === 'LEADER' ? (
                     <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 border-[4px] border-black rounded-3xl shadow-[8px_8px_0_rgba(0,0,0,1)] text-center animate-in zoom-in duration-300">
                        <Users size={64} className="text-amber-500 mb-6" />
                        <h3 className="text-3xl font-black text-white uppercase italic mb-4">Preparation Phase</h3>
                        <p className="text-white/40 font-black uppercase text-xs italic mb-10 max-w-sm">Assign {warData.warSize || 1} Champions to the defensive line. These hunters will be snapshotted as Nodes.</p>
                        <div className="flex gap-2 mb-8"><span className="text-[10px] font-black text-white uppercase italic">Selected: {selectedDefenders.length} / {warData.warSize || 1}</span></div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 w-full max-w-2xl overflow-y-auto max-h-[30vh] pr-2 custom-scrollbar">
                           {guildData.members?.map(m => (
                              <button key={m} onClick={() => setSelectedDefenders(prev => prev.includes(m) ? prev.filter(x => x !== m) : (prev.length < (warData.warSize || 1) ? [...prev, m] : prev))} className={`p-4 rounded-xl border-[3px] font-black uppercase italic text-[10px] transition-all ${selectedDefenders.includes(m) ? 'bg-amber-600 border-black scale-105' : 'bg-black/40 border-white/5 opacity-50'}`}>{m?.split('@')[0]}</button>
                           ))}
                        </div>
                        <button onClick={() => { actions.assignWarDefenders(warData.id, selectedDefenders); setSelectedDefenders([]); }} disabled={selectedDefenders.length < (warData.warSize || 1)} className="bg-black text-white px-12 py-5 rounded-2xl border-[4px] border-white/20 font-black italic uppercase shadow-2xl hover:bg-white hover:text-black transition-all disabled:opacity-20">Lock Defensive Line</button>
                     </div>
                  ) : (
                    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                       <div className="bg-red-600 border-[6px] border-black rounded-3xl p-8 shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden shrink-0">
                          <div className="absolute inset-0 comic-halftone opacity-30"></div>
                          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                             <div className="text-center md:text-left flex-1 text-center">
                                <h2 className="text-4xl font-black text-white italic uppercase drop-shadow-lg truncate text-center font-center">{guildData?.name}</h2>
                                <div className="text-5xl font-black text-white italic mt-2 text-center">{warData.guildA_Stars} <Star className="inline text-amber-400 mb-2" size={32} /></div>
                             </div>
                             <div className="w-20 h-20 bg-black border-[4px] border-white/20 rounded-full flex items-center justify-center rotate-12 shadow-2xl shrink-0"><span className="text-2xl font-black text-red-500 italic uppercase">VS</span></div>
                             <div className="text-center md:text-right flex-1 text-center font-center">
                                <h2 className="text-4xl font-black text-white italic uppercase drop-shadow-lg truncate text-center font-center">RIVAL NODE</h2>
                                <div className="text-5xl font-black text-white italic mt-2 text-center text-center">{(warData.guildA === player.guildId ? warData.guildB_Stars : warData.guildA_Stars)} <Star className="inline text-amber-400 mb-2" size={32} /></div>
                             </div>
                          </div>
                       </div>
                       <div className="flex-1 bg-slate-950 border-[4px] border-black rounded-[40px] p-6 shadow-[15px_15px_0_rgba(0,0,0,1)] overflow-hidden flex flex-col">
                          <div className="flex items-center justify-between mb-6 border-b-2 border-white/5 pb-4">
                             <h3 className="font-black text-white uppercase italic flex items-center gap-3"><Target size={20} className="text-red-500" /> Tactical Grid: Enemy Defenders</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar pb-10">
                             {Object.entries((warData.guildA === player.guildId ? warData.defendersB : warData.defendersA) || {}).map(([email, snap], i) => (
                                <div key={email} className="bg-slate-900 border-[3px] border-black rounded-[40px] p-6 flex flex-col items-center gap-4 group hover:border-red-500/50 transition-all shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden">
                                   <div className="absolute top-4 right-4 bg-black text-red-500 px-3 py-1 rounded text-[8px] font-black uppercase italic border border-red-500/20 text-center font-center">NODE {i+1}</div>
                                   <div className="w-24 h-24 bg-black border-[4px] border-black rounded-3xl overflow-hidden shadow-2xl relative">
                                      <img src={`/assets/playeravatar/CrystleHunterAvatar (${snap.avatarNum || 1}).jpg`} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                                   </div>
                                   <div className="text-center font-center">
                                      <p className="text-[10px] font-black text-white/40 uppercase italic tracking-widest text-center font-center">LEVEL {snap.level || 1} DEFENDER</p>
                                      <h4 className="text-2xl font-black text-white uppercase italic truncate max-w-[160px] text-center font-center">{snap.name}</h4>
                                   </div>
                                   <button onClick={() => handleRaid(email.replace(/_/g, '.'))} disabled={loading || (warData.guildA_Attacks?.[(player.email || player.uid).replace(/\./g, '_')]?.length || 0) >= 2} className="w-full bg-red-600 hover:bg-red-500 border-[4px] border-black py-4 rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,0.5)] font-black text-white uppercase italic text-sm transform group-hover:scale-105 transition-all flex items-center justify-center gap-3"><Swords size={20} /> INITIATE RAID</button>
                                </div>
                             ))}
                             {Object.keys((warData.guildA === player.guildId ? warData.defendersB : warData.defendersA) || {}).length === 0 && (
                                <div className="col-span-full py-20 text-center opacity-20 font-black italic uppercase">The rival has not yet mobilized defensive units. Check back soon.</div>
                             )}
                          </div>
                       </div>
                    </div>
                  )}
                </div>
             )}
          </div>
        )}
      </div>

      {showFinder && (activeTab === 'war' || !player.guildId) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in zoom-in duration-300">
           <div className="w-full max-w-4xl bg-slate-900 border-[8px] border-black rounded-[40px] shadow-[30px_30px_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-red-600 border-b-[8px] border-black p-8 relative flex flex-col md:flex-row justify-between items-center gap-4 text-center">
                 <div className="text-center font-center">
                    <h3 className="text-4xl font-black text-white uppercase italic drop-shadow-lg font-center">Target Acquisition</h3>
                    <p className="text-black/60 font-black text-[10px] uppercase italic tracking-[0.2em] mt-1 text-center font-center">SELECT SECTOR FOR {warManifestSize}v{warManifestSize} SYNDICATE DEPLOYMENT</p>
                 </div>
                 <button onClick={() => setShowFinder(false)} className="bg-black text-white px-8 py-3 rounded-full border-4 border-white/20 font-black uppercase italic hover:bg-white hover:text-black transition-all font-center">ABORT</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 grid md:grid-cols-2 gap-6 custom-scrollbar">
                 {allGuilds.filter(g => g.id !== player.guildId).map(g => (
                   <div key={g.id} className="bg-black/60 border-[4px] border-black p-6 rounded-3xl flex flex-col justify-between hover:border-red-500/50 transition-all group shadow-[8px_8px_0_rgba(0,0,0,0.3)]">
                      <div className="flex justify-between items-center mb-6">
                        <span className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase italic">{g.tag}</span>
                        <div className="flex items-center gap-2 text-white/40"><Users size={12} /> <span className="text-[10px] font-black uppercase italic text-center text-center">{g.members?.length || 0}/30</span></div>
                      </div>
                      <h4 className="text-2xl font-black text-white uppercase italic mb-8 truncate group-hover:text-red-500 transition-colors text-center font-center">{g.name}</h4>
                      <button onClick={() => { actions.initiateSyndicateWar(g.id, selectedDefenders); setShowFinder(false); }} className="w-full bg-white hover:bg-red-600 hover:text-white text-black p-4 rounded-2xl font-black uppercase italic border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-3"><Flame size={20} /> COMMENCE {warManifestSize}v{warManifestSize} WARFARE</button>
                   </div>
                 ))}
                 {allGuilds.length <= 1 && <div className="col-span-full py-20 text-center opacity-20 font-black italic uppercase text-center">No rival syndicates detected in this sector.</div>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
