import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Shield, Crown, Users, Rocket, Zap, Settings, 
  ArrowRight, Plus, Terminal, AlertTriangle, Search,
  RefreshCw, LogOut, UserPlus, Send, FlaskConical, MessageSquare,
  Swords, Target, Flame, Trophy, Star, Skull, Check, Sparkles, HelpCircle
} from 'lucide-react';
import { doc, getDoc, getDocs, collection, onSnapshot, query, limit, orderBy, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';
import { useGame } from '../contexts/GameContext';
import React from 'react';
import { AvatarMedia } from './GameUI';

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
  const [searchTerm, setSearchTerm] = useState('');

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);
  const [memberDetails, setMemberDetails] = useState({});
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_syndicate_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Neon Syndicate",
      npc: 1,
      visualType: 'factions',
      text: "Syndicates are player-forged factions. Joining a Syndicate grants access to global combat buffs, exclusive chat, and Guild Wars.",
      hint: "Tip: Larger Syndicates offer stronger progression."
    },
    {
      title: "Capital Subsidy",
      npc: 14,
      visualType: 'treasury',
      text: "By investing GX Tokens into the Research Lab, you increase your Syndicate's Tech Level, continuously improving Combat Power for all enrolled Nagas.",
      hint: "Strategy: Claim your daily bounty to earn back investments."
    },
    {
      title: "Naga Wars",
      npc: 12,
      visualType: 'wars',
      text: "In the Wars tab, the leader can declare rival skirmishes. Enroll your Naga to lock in stats and attack the enemy roster for victory!",
      hint: "Warning: Once enrolled, stats cannot be updated until the war ends."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_syndicate_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  // 1. Unified Syndicate Data Sync (V2: Root Path)
  useEffect(() => {
    if (!player?.guildId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const guildRef = doc(db, 'guilds', player.guildId);
    
    const unsubscribe = onSnapshot(guildRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGuildData(data);
        
        // Fetch Member Details (Names, Levels, Avatars) from PUBLIC REGISTRY
        if (data.members) {
          const detailMap = {};
          await Promise.all(data.members.map(async (mId) => {
            try {
              // V4: Shifted to 'leaderboard' collection for authorized public read
              const pRef = doc(db, 'leaderboard', mId);
              const pSnap = await getDoc(pRef);
              if (pSnap.exists()) {
                const pData = pSnap.data();
                detailMap[mId] = {
                  name: pData.name || 'Unknown',
                  level: pData.level || 1,
                  gemxAvatar: pData.gemxAvatar || 'Cosmic gemx (1).gif'
                };
              } else {
                detailMap[mId] = { name: 'Unknown Hunter', level: 1, gemxAvatar: 'Cosmic gemx (1).gif' };
              }
            } catch (e) { 
              console.warn("System V4: Member hidden by privacy shield:", mId);
              detailMap[mId] = { name: 'Encrypted Operative', level: 1, gemxAvatar: 'Cosmic gemx (1).gif' };
            }
          }));
          setMemberDetails(detailMap);
        }

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

  if (!player?.guildId) {
    return (
      <div className="flex-1 flex flex-col p-4 md:p-8 animate-in zoom-in duration-500 overflow-y-auto relative scrollbar-hide">
        {!showFinder ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button onClick={() => { setTutorialStep(0); setShowTutorial(true); }} className="bg-red-600 text-white px-3 py-2 md:py-3 rounded-2xl border-2 border-white/20 font-black shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:scale-105 transition-all">
                <HelpCircle size={20} className="md:w-6 md:h-6" />
              </button>
              <button onClick={() => adventure.setView('menu')} className="bg-slate-800 text-white px-6 md:px-8 py-2 md:py-3 rounded-2xl border-2 border-white/20 font-black uppercase italic shadow-[6px_6px_0_rgba(0,0,0,0.5)] hover:scale-105 transition-all text-[10px] md:text-sm">Terminating Sector</button>
            </div>
            <div className="w-full max-w-4xl flex flex-col items-center gap-6 md:gap-10">
              <div className="text-center group flex flex-col items-center">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-red-600 border-4 md:border-8 border-black rounded-full shadow-[10px_10px_0_rgba(0,0,0,0.8)] flex items-center justify-center mb-4 md:mb-6 group-hover:rotate-12 transition-transform duration-500">
                   <Shield size={48} className="text-white drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] md:w-16 md:h-16" />
                </div>
                <h1 className="text-4xl md:text-8xl font-black text-white italic tracking-tighter uppercase mb-2">NEON <span className="text-red-500">SYNDICATE</span></h1>
                <p className="text-white/40 font-black uppercase text-[7px] md:text-xs tracking-[0.2em] md:tracking-[0.4em] max-w-[280px] md:max-w-lg italic">Collective Authority: Join or Forge an Identity Uplink</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full px-4">
                <button onClick={() => setShowCreateModal(true)} className="relative bg-amber-500 border-4 md:border-8 border-black p-6 md:p-12 rounded-[30px] md:rounded-[40px] shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[15px_15px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 md:hover:translate-x-4 hover:translate-y-2 md:hover:translate-y-4 transition-all overflow-hidden text-center group">
                   <Plus size={32} className="mx-auto mb-2 md:mb-4 group-hover:rotate-180 transition-transform duration-700 md:w-12 md:h-12" strokeWidth={4} />
                   <h2 className="text-xl md:text-3xl font-black text-black uppercase italic mb-1 md:mb-2">Forge Protocol</h2>
                   <p className="text-black/60 font-black text-[8px] md:text-[10px] uppercase mb-4 md:mb-6 tracking-widest">Initial Investment: 50,000 GX</p>
                   <div className="bg-black text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-black uppercase italic text-[8px] md:text-xs mx-auto w-fit">Initiate Construction</div>
                </button>
                <button onClick={() => { fetchGuilds(); setShowFinder(true); }} className="relative bg-slate-800 border-4 md:border-8 border-black p-6 md:p-12 rounded-[30px] md:rounded-[40px] shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[15px_15px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-2 md:hover:translate-x-4 hover:translate-y-2 md:hover:translate-y-4 transition-all overflow-hidden text-center group">
                   <Search size={32} className="mx-auto mb-2 md:mb-4 text-cyan-400 group-hover:scale-125 transition-transform md:w-12 md:h-12" strokeWidth={4} />
                   <h2 className="text-xl md:text-3xl font-black text-white uppercase italic mb-1 md:mb-2">Scan for Uplinks</h2>
                   <p className="text-white/40 font-black text-[8px] md:text-[10px] uppercase mb-4 md:mb-6 tracking-widest">Discover Rival Factions</p>
                   <div className="bg-black text-cyan-400 px-6 md:px-8 py-2 md:py-3 rounded-full font-black uppercase italic text-[8px] md:text-xs mx-auto w-fit border border-cyan-400/30">Connect Grid</div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
             <div className="flex items-center justify-between mb-6 md:mb-10">
                <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Available <span className="text-cyan-400">Uplinks</span></h2>
                <button onClick={() => setShowFinder(false)} className="bg-black border-4 border-white/10 text-white px-6 py-2 rounded-xl font-black uppercase italic text-xs hover:bg-red-600 transition-all">Cancel Scan</button>
             </div>
             
             <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
                {allGuilds.map((guild) => (
                   <div key={guild.id} className="bg-slate-900/50 border-4 border-black p-6 rounded-[30px] shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-6 hover:border-cyan-500/50 transition-all group">
                      <div className="flex items-center gap-6 text-center md:text-left">
                         <div className="w-16 h-16 bg-black border-4 border-slate-800 rounded-2xl flex items-center justify-center font-black text-xl text-white transform -rotate-6 group-hover:rotate-0 transition-transform">{guild.tag}</div>
                         <div>
                            <h3 className="text-2xl font-black text-white uppercase italic">{guild.name}</h3>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Tech Lvl {guild.labLevel || 0} | Members: {guild.members?.length || 0}/30</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => actions.joinSyndicate(guild.id)}
                        disabled={guild.members?.length >= 30}
                        className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black uppercase italic border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all ${guild.members?.length >= 30 ? 'bg-slate-800 text-slate-500 grayscale' : 'bg-emerald-500 text-black hover:bg-emerald-400 active:translate-y-1'}`}
                      >
                         {guild.members?.length >= 30 ? 'Sector Full' : 'Initialize Uplink'}
                      </button>
                   </div>
                ))}
                {allGuilds.length === 0 && (
                   <div className="text-center py-20 bg-black/40 rounded-[40px] border-4 border-dashed border-white/5">
                      <Terminal size={48} className="mx-auto mb-4 text-white/10" />
                      <p className="text-white/40 font-black uppercase italic tracking-widest">No active faction signatures detected on the grid.</p>
                   </div>
                )}
             </div>
          </div>
        )}
        
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
             <div className="w-full max-w-md bg-slate-900 border-4 md:border-8 border-black rounded-[30px] md:rounded-[40px] shadow-[10px_10px_0_rgba(0,0,0,1)] md:shadow-[20px_20px_0_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-amber-500 border-b-4 md:border-b-8 border-black p-6 md:p-8 relative flex flex-col items-center">
                   <h3 className="text-2xl md:text-4xl font-black text-black uppercase italic">Construction</h3>
                   <button onClick={() => setShowCreateModal(false)} className="absolute top-4 md:top-6 right-4 md:right-6 w-10 md:w-12 h-10 md:h-12 bg-black text-white rounded-full flex items-center justify-center font-black text-lg md:text-xl hover:bg-white hover:text-black transition-colors">X</button>
                </div>
                <div className="p-6 md:p-10 flex flex-col gap-4 md:gap-6">
                   <div className="space-y-2"><label className="text-white/40 font-black uppercase text-[8px] md:text-[10px] italic">Designation (Min 3 Chars)</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border-4 border-black p-4 md:p-5 text-white font-black italic rounded-xl md:rounded-2xl focus:border-red-500 outline-none uppercase text-sm md:text-base" /></div>
                   <div className="space-y-2"><label className="text-white/40 font-black uppercase text-[8px] md:text-[10px] italic">Sector Tag (4 Chars)</label><input type="text" value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={4} className="w-full bg-black border-4 border-black p-4 md:p-5 text-white font-black italic rounded-xl md:rounded-2xl focus:border-red-500 outline-none uppercase text-center text-sm md:text-base" /></div>
                   <button onClick={() => actions.createSyndicate(name, tag)} disabled={(player.tokens || 0) < 50000} className="w-full bg-red-600 hover:bg-red-500 border-4 border-black p-4 md:p-6 rounded-[20px] md:rounded-3xl shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4 animate-pulse hover:animate-none"><Rocket size={20} className="md:w-6 md:h-6" /> <span className="text-xl md:text-2xl font-black text-white uppercase italic">Forge Protocol</span></button>
                   {(player.tokens || 0) < 50000 && <p className="text-red-500 text-[8px] md:text-[10px] font-black uppercase italic text-center">Insufficient GX Balance For Transmission</p>}
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 animate-in slide-in-from-right-12 duration-500 overflow-hidden max-w-7xl mx-auto w-full font-comic">
        <div className="flex flex-col md:flex-row items-center justify-between w-full mb-4 md:mb-6 relative gap-4">
          <div className="flex items-center gap-1.5 md:gap-3 bg-black/60 p-1.5 md:p-2 rounded-2xl md:rounded-3xl border-[3px] md:border-4 border-black w-full md:w-fit shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', icon: <Shield size={14} className="md:w-5 md:h-5" />, label: 'Base' },
              { id: 'messages', icon: <MessageSquare size={14} className="md:w-5 md:h-5" />, label: 'Comms' },
              { id: 'lab', icon: <FlaskConical size={14} className="md:w-5 md:h-5" />, label: 'Lab' },
              { id: 'war', icon: <Swords size={14} className="md:w-5 md:h-5" />, label: 'Wars' },
              { id: 'leaderboard', icon: <Trophy size={14} className="md:w-5 md:h-5" />, label: 'Rank' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-1.5 md:gap-3 transition-all font-black text-[9px] md:text-[11px] uppercase italic border-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-red-600 text-white border-black scale-105 shadow-md md:shadow-lg' : 'text-white/30 border-transparent hover:text-white hover:bg-white/5'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => { setTutorialStep(0); setShowTutorial(true); }} className="bg-red-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl border-[3px] md:border-4 border-black font-black uppercase italic shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-red-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center">
              <HelpCircle size={16} />
            </button>
            <button onClick={() => adventure.setView('menu')} className="w-full md:w-auto bg-slate-800 text-white px-8 py-2 md:py-3 rounded-xl md:rounded-2xl border-[3px] md:border-4 border-black font-black uppercase italic shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-white hover:text-black hover:scale-105 active:scale-95 transition-all text-[9px] md:text-xs">EXIT</button>
          </div>
       </div>

       <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'overview' && (
           <div className="flex-1 flex flex-col gap-6 md:gap-10 overflow-y-auto pr-2 custom-scrollbar pb-10">
              <div className="flex justify-end p-2">
                 {!showLeaveConfirm ? (
                   <button 
                     onClick={() => setShowLeaveConfirm(true)}
                     className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 border border-red-600/30 rounded-xl text-[10px] md:text-xs font-black uppercase italic transition-all flex items-center gap-2"
                   >
                     <LogOut size={12} /> Disconnect Uplink
                   </button>
                 ) : (
                   <div className="flex items-center gap-4 bg-red-600/10 border border-red-600/30 p-2 rounded-2xl animate-in slide-in-from-right-4 duration-300">
                     <span className="text-[10px] font-black text-white italic uppercase px-2">Sever all faction ties?</span>
                     <button onClick={() => { actions.leaveSyndicate(); setShowLeaveConfirm(false); }} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black hover:scale-105 active:scale-95 transition-all">YES, ABORT</button>
                     <button onClick={() => setShowLeaveConfirm(false)} className="text-white/50 hover:text-white text-[10px] font-black underline">No, Stay</button>
                   </div>
                 )}
              </div>
              <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                 <div className="w-full lg:flex-1 bg-red-950 border-4 md:border-8 border-black rounded-[30px] md:rounded-[40px] p-6 md:p-8 shadow-[8px_8px_0_rgba(0,0,0,0.8)] md:shadow-[20px_20px_0_rgba(0,0,0,0.8)] relative overflow-hidden shrink-0 min-h-[140px] md:min-h-[180px] flex items-center">
                   <div className="absolute inset-0 comic-halftone opacity-40 text-red-600"></div>
                   <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 w-full min-w-0">
                     <div className="flex flex-col md:flex-row items-center gap-4 md:gap-7 text-center md:text-left min-w-0">
                       <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-500 border-[3px] md:border-4 border-black rounded-[20px] md:rounded-[25px] flex items-center justify-center transform -rotate-6 shadow-2xl shrink-0 overflow-hidden">
                         <img src={`/assets/dragonsground/gemx/${memberDetails[guildData?.leaderId]?.gemxAvatar || 'Cosmic gemx (1).gif'}`} alt="Master" className="w-full h-full object-cover" />
                       </div>
                       <div className="min-w-0 overflow-hidden">
                         <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase mb-1 truncate leading-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">{guildData?.name}</h2>
                         <div className="flex items-center justify-center md:justify-start gap-3">
                            <span className="bg-black text-amber-500 px-2 md:px-3 py-1 rounded-md text-[8px] md:text-[10px] font-black border border-amber-500/30 uppercase italic truncate max-w-[80px]">{guildData?.tag}</span>
                            <span className="text-[8px] md:text-[10px] font-black text-white/50 italic tracking-widest uppercase shrink-0">Tier {guildData?.level} Faction</span>
                         </div>
                       </div>
                     </div>
                     <div className="bg-black/80 border-[3px] md:border-4 border-black rounded-2xl md:rounded-3xl p-4 md:px-6 md:py-5 min-w-[120px] md:min-w-[160px] text-center shadow-inner w-full md:w-auto shrink-0 self-center md:self-auto">
                        <span className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase block mb-1 md:mb-2 tracking-[0.2em]">EXP CORE</span>
                        <div className="h-1.5 md:h-2 w-full bg-slate-800 rounded-full overflow-hidden mx-auto border border-white/5"><div className="h-full bg-gradient-to-r from-red-600 to-amber-500 animate-pulse" style={{ width: `${(guildData?.xp % 1000) / 10}%` }}></div></div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="w-full lg:w-80 bg-slate-900 border-4 md:border-8 border-black rounded-[30px] md:rounded-[40px] p-6 md:p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] flex flex-col">
                    <h3 className="text-lg md:text-xl font-black text-white uppercase italic mb-4 md:mb-8 flex items-center gap-3"><Rocket size={20} className="text-cyan-400" /> Capital</h3>
                    <div className="bg-black/80 p-4 md:p-8 rounded-2xl md:rounded-[30px] border-[3px] md:border-4 border-black shadow-inner flex flex-col items-center">
                       <span className="text-[8px] md:text-[10px] font-black text-white/30 uppercase mb-1 md:mb-2 tracking-[0.2em]">Liquidity</span>
                       <span className="text-xl md:text-4xl font-black text-amber-500 italic drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">{(guildData?.gxVault || 0).toLocaleString()} GX</span>
                    </div>
                 </div>

                 <div className="w-full lg:w-80 bg-slate-900 border-4 md:border-8 border-black rounded-[30px] md:rounded-[40px] p-6 md:p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] flex flex-col">
                    <h3 className="text-lg md:text-xl font-black text-emerald-400 uppercase italic mb-4 md:mb-8 flex items-center gap-3"><Star size={20} className="text-emerald-400" /> Daily Mission</h3>
                    <div className="flex-1 flex flex-col justify-between gap-4">
                       <div className="bg-black/80 p-4 md:p-6 border-[3px] border-black rounded-2xl">
                          <p className="text-[8px] font-black text-white/40 uppercase mb-2">Subsidy Status</p>
                          {(() => {
                             const cooldown = 24 * 60 * 60 * 1000;
                             const canClaim = !player.lastBountyClaimed || (Date.now() - player.lastBountyClaimed >= cooldown);
                             return (
                               <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${canClaim ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                                     <span className={`text-[10px] font-black uppercase ${canClaim ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {canClaim ? 'READY FOR UPLINK' : 'RECHARGING'}
                                     </span>
                                  </div>
                                  <button 
                                     onClick={() => actions.claimGuildBounty(guildData)}
                                     disabled={!canClaim}
                                     className={`w-full py-2 rounded-lg font-black uppercase italic text-[10px] border-2 border-black transition-all ${canClaim ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[3px_3px_0_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-600 grayscale cursor-not-allowed'}`}
                                  >
                                     Claim Bounty
                                  </button>
                               </div>
                             );
                          })()}
                       </div>
                       <p className="text-[6px] text-white/20 uppercase text-center italic">Rewards scale with Syndicate Lab Level</p>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
                <div className="flex-1 bg-slate-900 border-4 md:border-8 border-black rounded-[30px] md:rounded-[40px] p-6 md:p-8 shadow-[10px_10px_0_rgba(0,0,0,1)] overflow-hidden flex flex-col">
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase italic mb-6 md:mb-8 flex items-center gap-3 md:gap-4"><Users size={24} className="text-red-500" /> Authorized Personnel</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[300px] md:max-h-[400px]">
                        {guildData?.members?.map((mUid, i) => {
                          const detail = memberDetails[mUid];
                          return (
                            <div key={i} className="flex items-center justify-between bg-black/60 p-3 md:p-4 rounded-2xl md:rounded-3xl border-[3px] md:border-4 border-black hover:border-red-500/50 transition-all group shadow-[3px_3px_0_rgba(0,0,0,0.3)] md:shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                               <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                  <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-800 border-2 border-slate-700 rounded-xl md:rounded-2xl overflow-hidden shadow-inner shrink-0">
                                     <img src={`/assets/dragonsground/gemx/${detail?.gemxAvatar || 'Cosmic gemx (1).gif'}`} alt="Avatar" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                     <p className="text-[11px] md:text-sm font-black text-white italic uppercase tracking-tighter truncate">{detail?.name || 'Infiltrator'}</p>
                                     <p className="text-[7px] md:text-[9px] font-black text-cyan-400 uppercase italic tracking-widest">LEVEL {detail?.level || 1} HUNTER</p>
                                  </div>
                               </div>
                               <div className="flex flex-col items-end gap-1 shrink-0">
                                  {mUid === guildData.leaderId && <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"><Crown size={8} className="md:w-3 md:h-3" /><span className="text-[6px] md:text-[8px] font-black uppercase">LEADER</span></div>}
                               </div>
                            </div>
                          );
                        })}
                    </div>
                </div>

                <div className="w-full lg:w-80 flex flex-col gap-6">
                   <div className="flex flex-col gap-3">
                      {player.guildRole === 'LEADER' ? (
                        <button onClick={() => actions.dissolveSyndicate()} className="w-full bg-red-950/40 hover:bg-red-950 border-[3px] md:border-4 border-red-900 rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-center justify-center gap-3 md:gap-4 transition-all group active:scale-95"><Skull size={20} className="text-red-600 md:w-6 md:h-6 group-hover:animate-pulse" /><span className="text-sm md:text-lg font-black text-red-600 uppercase italic">DISSOLUTION</span></button>
                      ) : (
                        <button onClick={() => actions.leaveSyndicate()} className="w-full bg-slate-800 hover:bg-red-600 border-[3px] md:border-4 border-black rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-center justify-center gap-3 md:gap-4 transition-all group group-hover:text-white active:scale-95"><LogOut size={20} className="md:w-6 md:h-6" /><span className="text-sm md:text-lg font-black uppercase italic">DISCONNECT</span></button>
                      )}
                   </div>
                </div>
              </div>
           </div>
          )}

         { activeTab === 'messages' && (
            <div className="flex-1 flex flex-col bg-slate-900 border-[6px] md:border-8 border-black rounded-[30px] md:rounded-[40px] shadow-[10px_10px_0_rgba(0,0,0,1)] md:shadow-[15px_15px_0_rgba(0,0,0,1)] overflow-hidden transform -rotate-0.5">
               <div className="bg-black/40 px-4 md:px-6 py-2 md:py-3 border-b-[3px] md:border-b-4 border-black flex items-center gap-3 md:gap-4">
                  <MessageSquare size={14} className="text-cyan-400 md:w-5 md:h-5" />
                  <h3 className="text-[8px] md:text-sm font-black text-white/80 uppercase italic tracking-widest font-center">Faction Secure Transmission: UNIT {(player?.guildId || 'OFFLINE').split('_').pop()}</h3>
               </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4 md:space-y-6 custom-scrollbar">
                 {messages.map((msg) => (
                   <div key={msg.id} className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[8px] md:text-[9px] font-black uppercase italic mb-1.5 md:mb-2 ${msg.senderId === user.uid ? 'text-cyan-400' : 'text-white/40'}`}>{msg.senderName}</span>
                      <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-5 rounded-[18px] md:rounded-[25px] border-[3px] md:border-4 border-black font-black text-xs md:text-sm shadow-[4px_4px_0_rgba(0,0,0,0.5)] md:shadow-[8px_8px_0_rgba(0,0,0,0.5)] ${msg.senderId === user.uid ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-white'}`}>{msg.text}</div>
                   </div>
                 ))}
                 <div ref={chatEndRef} />
              </div>
               <form onSubmit={handleSendMessage} className="p-3 md:p-8 bg-black/60 border-t-4 md:border-t-8 border-black flex flex-col md:flex-row gap-3 md:gap-6"><input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Signal..." className="flex-1 bg-black border-4 border-white/5 p-4 md:p-6 font-black italic rounded-xl md:rounded-[25px] focus:border-red-600 outline-none text-white uppercase placeholder:text-white/20 text-[10px] md:text-sm" /><button type="submit" className="bg-red-600 border-4 border-black h-12 md:h-auto md:w-24 rounded-xl md:rounded-[30px] shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><Send size={20} className="text-white md:w-8 md:h-8" /></button></form>
           </div>
         )}

         { activeTab === 'war' && (
           <div className="flex-1 flex flex-col bg-slate-900 border-4 md:border-8 border-black rounded-[30px] md:rounded-[40px] shadow-[10px_10px_0_rgba(0,0,0,1)] md:shadow-[15px_15px_0_rgba(0,0,0,1)] overflow-hidden">
             
             {!warData ? (
               <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-full text-center scrollbar-hide overflow-y-auto">
                   <div className="w-24 h-24 md:w-32 md:h-32 bg-red-950 border-[6px] md:border-8 border-black rounded-full shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] flex items-center justify-center mb-4 md:mb-6">
                     <Swords size={48} className="text-red-500 animate-pulse md:w-16 md:h-16" />
                   </div>
                   <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-2 md:mb-4">Naga Protocol</h2>
                   <p className="text-white/40 font-black uppercase tracking-widest max-w-xs md:max-w-lg mb-6 md:mb-8 text-[8px] md:text-xs">Authorize combat against rival syndicates using your enrolled Naga forces.</p>
                   
                   {player.guildRole === 'LEADER' ? (
                      <div className="w-full max-w-2xl bg-black/40 border-[3px] md:border-4 border-black rounded-[25px] md:rounded-3xl p-4 md:p-6">
                         <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                            <h3 className="text-lg md:text-xl font-black text-red-500 uppercase italic flex items-center gap-2"><Target size={18} /> Target Acquisition</h3>
                            <button onClick={fetchGuilds} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase italic border-2 border-black flex items-center gap-2 hover:bg-slate-700"><RefreshCw size={10} /> Scan Grid</button>
                         </div>
                         <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {allGuilds.filter(g => g.id !== player.guildId).map(g => (
                               <div key={g.id} className="flex items-center justify-between bg-slate-800 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                                  <div className="text-left">
                                     <h4 className="text-white font-black text-xs md:text-sm italic uppercase">{g.name} <span className="text-amber-500 text-[8px] md:text-[10px] ml-2">[{g.tag}]</span></h4>
                                     <p className="text-white/40 text-[7px] md:text-[9px] font-black uppercase tracking-widest mt-0.5">Level {g.level} Faction</p>
                                  </div>
                                  <button onClick={() => actions.initiateSyndicateWar(g.id, 2)} className="bg-red-600 text-white px-4 md:px-6 py-1.5 md:py-2 border-2 border-black rounded-lg md:rounded-xl font-black italic uppercase text-[10px] md:text-xs shadow-[3px_3px_0_rgba(0,0,0,1)] hover:scale-105 active:translate-y-1 active:shadow-none transition-all">Declare</button>
                               </div>
                            ))}
                            {allGuilds.filter(g => g.id !== player.guildId).length === 0 && (
                               <p className="text-white/30 text-[9px] md:text-xs font-black uppercase italic text-center py-4">No viable targets on the scanner.</p>
                            )}
                         </div>
                      </div>
                   ) : (
                      <div className="bg-red-950/20 border-2 border-red-500/50 p-4 md:p-6 rounded-2xl">
                         <p className="text-red-400 font-black uppercase text-[10px] md:text-sm italic">Only the Faction Leader can authorize declarations of war.</p>
                      </div>
                   )}
                </div>
             ) : (
               <div className="flex flex-col h-full overflow-hidden">
                 {/* War Header Banner */}
                 <div className="bg-red-950 border-b-4 md:border-b-8 border-black p-4 md:p-6 shrink-0 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="absolute inset-0 comic-halftone opacity-30 text-red-600 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center md:items-start">
                       <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-[8px] md:text-[10px] font-black border-2 border-black uppercase italic animate-pulse shadow-[2px_2px_0_rgba(0,0,0,1)]">
                         {warData.status}
                       </span>
                        <h2 className="text-lg md:text-3xl font-black text-white uppercase italic mt-1.5 md:mt-2 flex items-center gap-2 md:gap-3">
                          <Swords size={18} className="text-amber-500 md:w-7 md:h-7" /> NAGA WAR <span className="text-white/20 hidden md:inline">|</span> <span className="text-red-400">2v2</span>
                        </h2>
                    </div>
                     {player.guildRole === 'LEADER' && warData.status === 'PENDING' && warData.guildB === player.guildId && (
                        <div className="relative z-10 flex gap-3 md:gap-4 w-full md:w-auto">
                           <button onClick={() => actions.respondToSyndicateWar(warData.id, true)} className="flex-1 md:flex-none bg-emerald-500 text-black px-4 md:px-6 py-2 md:py-3 border-[3px] md:border-4 border-black rounded-xl md:rounded-2xl font-black italic uppercase text-[10px] md:text-sm shadow-[4px_4px_0_rgba(0,0,0,1)] md:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-emerald-400 transition-colors">Accept</button>
                           <button onClick={() => actions.respondToSyndicateWar(warData.id, false)} className="flex-1 md:flex-none bg-slate-800 text-white px-4 md:px-6 py-2 md:py-3 border-[3px] md:border-4 border-black rounded-xl md:rounded-2xl font-black italic uppercase text-[10px] md:text-sm hover:bg-red-600 transition-colors">Decline</button>
                        </div>
                     )}
                     {player.guildRole === 'LEADER' && warData.status === 'PENDING' && warData.guildA === player.guildId && (
                        <div className="relative z-10 flex w-full md:w-auto">
                           <button onClick={() => actions.abortSyndicateWar(warData.id)} className="w-full md:w-auto bg-slate-800 text-white px-4 md:px-6 py-2 md:py-3 border-[3px] md:border-4 border-black rounded-xl md:rounded-2xl font-black italic uppercase text-[10px] md:text-sm hover:bg-red-600 transition-colors">Retract Declaration</button>
                        </div>
                     )}
                     {player.guildRole === 'LEADER' && warData.status === 'ENROLLMENT' && (
                        <div className="relative z-10 flex w-full md:w-auto">
                           <button onClick={() => actions.abortSyndicateWar(warData.id)} className="w-full md:w-auto bg-slate-800 text-white px-4 md:px-6 py-2 md:py-3 border-[3px] md:border-4 border-black rounded-xl md:rounded-2xl font-black italic uppercase text-[10px] md:text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2"><Skull size={14} /> Abort War</button>
                        </div>
                     )}
                 </div>

                 {/* War Content Body */}
                 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* Enrollment Phase View */}
                    {warData.status === 'ENROLLMENT' && (
                       <div className="flex flex-col items-center">
                          <div className="bg-cyan-950/30 border-2 border-cyan-500/50 p-4 md:p-6 rounded-2xl max-w-2xl text-center mb-6 md:mb-8">
                             <h3 className="text-cyan-400 text-lg md:text-xl font-black uppercase italic mb-1 md:mb-2">Mobilization Protocol</h3>
                             <p className="text-white/60 text-[9px] md:text-xs font-black uppercase tracking-wider mb-4 md:mb-6">Enroll your Naga to lock in its current Combat Stats. The offensive commences once ({warData.warSize}) Nagas from both syndicates are verified.</p>
                             
                             <button 
                                onClick={() => actions.enrollNagaInWar(warData.id)}
                                className="bg-cyan-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-[20px] font-black uppercase italic border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] hover:bg-cyan-500 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 md:gap-3 mx-auto text-xs md:text-base"
                             >
                                <Zap size={18} className="md:w-5 md:h-5" /> ENROLL NAGA TO ROSTER
                             </button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 w-full max-w-5xl">
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
                                               <div className="flex items-center gap-2 shrink-0">
                                                  <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-xl border-2 border-slate-700 overflow-hidden relative">
                                                     <img 
                                                        src={naga.dragonAvatar || '/assets/dragonsground/dragons/DragonAvatar (1).jpg'} 
                                                        alt="Naga" 
                                                        className={`w-full h-full object-cover ${naga.element === 'Pyro' ? 'hue-rotate-[340deg] saturate-200' : naga.element === 'Hydro' ? 'hue-rotate-[180deg]' : naga.element === 'Earthen' ? 'hue-rotate-[90deg] saturate-150' : naga.element === 'Gale' ? 'hue-rotate-[220deg] brightness-125' : ''}`}
                                                     />
                                                     <div className="absolute top-0 right-0 bg-black/80 px-1 border-b border-l border-white/20 text-[6px] text-white/50 uppercase italic">{naga.element}</div>
                                                  </div>
                                                  <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-xl border-2 border-slate-800 overflow-hidden relative -ml-4 shadow-xl">
                                                     <img src={`/assets/dragonsground/gemx/${naga.gemxAvatar}`} alt="Gemx" className="w-full h-full object-cover" />
                                                  </div>
                                               </div>
                                               <div className="flex-1 min-w-0 pr-4">
                                                  <h5 className="text-white font-black text-sm uppercase truncate italic">{naga.name} <span className="text-cyan-400 text-[8px]">LVL {naga.level || 1}</span></h5>
                                                  <div className="flex flex-wrap gap-2 mt-1">
                                                     <span className="text-[9px] font-black bg-black text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase italic">{naga.stats.maxHp} HP</span>
                                                     <span className={`text-[9px] font-black bg-black px-1.5 py-0.5 rounded border border-white/10 uppercase italic ${naga.element === 'Pyro' ? 'text-red-400' : naga.element === 'Hydro' ? 'text-blue-400' : naga.element === 'Earthen' ? 'text-emerald-400' : naga.element === 'Gale' ? 'text-sky-300' : 'text-cyan-400'}`}>{naga.stats.shieldHp} SHIELD</span>
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
                       <div className="flex flex-col gap-6 md:gap-8 w-full max-w-5xl mx-auto pb-10">
                          <div className="bg-amber-500/10 border-[3px] md:border-4 border-amber-500 rounded-[20px] md:rounded-[30px] p-4 md:p-6 text-center shadow-[0_0_20px_rgba(245,158,11,0.2)] md:shadow-[0_0_30px_rgba(245,158,11,0.2)] relative flex flex-col md:flex-row items-center justify-between gap-4">
                             <div className="text-center md:text-left">
                                <h3 className="text-amber-500 text-lg md:text-3xl font-black uppercase italic tracking-tighter">Combat Phase Initiated</h3>
                                <p className="text-white/70 font-black uppercase text-[7px] md:text-xs mt-1 md:mt-2">Select an enemy Naga from the Rival Roster to engage in PvP.</p>
                             </div>
                             {player.guildRole === 'LEADER' && (
                                <button onClick={() => actions.concludeNagaWar(warData.id)} className="w-full md:w-auto bg-red-600 border-4 border-black text-white px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black uppercase italic hover:scale-105 active:scale-95 transition-all shadow-[3px_3px_0_rgba(0,0,0,1)] md:shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 text-[9px] md:text-xs">
                                   <Trophy size={14} className="md:w-4 md:h-4" /> END WAR TALLY
                                </button>
                             )}
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                             {[
                               { title: 'Your Forces', key: warData.guildA === player.guildId ? 'defendersA' : 'defendersB', isEnemy: false },
                               { title: 'Rival Forces', guildId: warData.guildA === player.guildId ? warData.guildB : warData.guildA, key: warData.guildA === player.guildId ? 'defendersB' : 'defendersA', isEnemy: true }
                             ].map((roster) => {
                                const enrolled = Object.values(warData[roster.key] || {});
                                return (
                                    <div key={roster.title} className="bg-black/60 p-4 md:p-6 rounded-[25px] md:rounded-[30px] border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,0.5)] md:shadow-[10px_10px_0_rgba(0,0,0,0.5)]">
                                       <h4 className={`text-xl md:text-2xl font-black italic uppercase mb-4 md:mb-6 ${roster.isEnemy ? 'text-red-500' : 'text-cyan-400'}`}>{roster.title}</h4>
                                       <div className="space-y-4">
                                          {enrolled.map((naga) => (
                                             <div key={naga.uid} className={`bg-slate-800 border-[3px] md:border-4 ${naga.currentHp <= 0 ? 'border-slate-700 opacity-60 grayscale' : roster.isEnemy ? 'border-red-900 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'border-cyan-900 shadow-[0_0_15px_rgba(6,182,212,0.2)]'} rounded-[15px] md:rounded-[20px] p-3 md:p-4 flex items-center gap-3 md:gap-4 group transition-all`}>
                                                <div className="flex items-center gap-2 shrink-0">
                                                   <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-xl md:rounded-2xl border-[3px] md:border-4 border-black shadow-inner overflow-hidden relative">
                                                      <img 
                                                         src={naga.dragonAvatar || '/assets/dragonsground/dragons/DragonAvatar (1).jpg'} 
                                                         alt="Enemy" 
                                                         className={`w-full h-full object-cover ${naga.element === 'Pyro' ? 'hue-rotate-[340deg] saturate-200' : naga.element === 'Hydro' ? 'hue-rotate-[180deg]' : naga.element === 'Earthen' ? 'hue-rotate-[90deg] saturate-150' : naga.element === 'Gale' ? 'hue-rotate-[220deg] brightness-125' : ''}`}
                                                      />
                                                      {naga.currentHp <= 0 && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><Skull size={20} className="text-red-500 md:w-6 md:h-6" /></div>}
                                                   </div>
                                                   <div className="w-8 h-8 md:w-10 md:h-10 bg-black rounded-lg md:rounded-xl border border-black overflow-hidden relative -ml-4 shadow-xl z-10">
                                                      <img src={`/assets/dragonsground/gemx/${naga.gemxAvatar}`} alt="Gemx" className="w-full h-full object-cover" />
                                                   </div>
                                                </div>
                                                <div className="flex-1 min-w-0 pr-1 md:pr-2">
                                                   <div className="flex justify-between items-start mb-1">
                                                      <h5 className="text-white font-black text-sm md:text-lg uppercase truncate italic leading-none">{naga.name} <span className="text-cyan-400 text-[10px] ml-1">LVL {naga.level || 1}</span></h5>
                                                      {roster.isEnemy && naga.currentHp > 0 && (
                                                         <button 
                                                            onClick={() => actions.startGvGRaid(warData.id, naga.uid, naga, roster.guildId, "Rival")}
                                                            className="bg-red-600 text-white px-3 md:px-4 py-1.5 md:py-2 text-[8px] md:text-[10px] rounded-lg md:rounded-xl font-black uppercase italic border-2 border-black md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:scale-105 active:scale-95"
                                                         >RAID <Swords size={10} className="inline ml-1" /></button>
                                                      )}
                                                   </div>
                                                   <div className="h-2.5 md:h-3 w-full bg-black rounded-full overflow-hidden border border-white/10 mb-2">
                                                      <div className={`h-full ${naga.currentHp <= 0 ? 'bg-slate-700' : 'bg-gradient-to-r from-red-600 to-amber-500'}`} style={{ width: `${Math.max(0, (naga.currentHp / naga.stats.totalMaxHp) * 100)}%` }}></div>
                                                   </div>
                                                   <div className="flex gap-3 md:gap-4 text-[7px] md:text-[10px] font-black uppercase text-white/50">
                                                      <span className="flex items-center gap-1"><Shield size={8} className={naga.currentHp > 0 ? "text-amber-400" : ""} /> {Math.max(0, naga.currentHp)} / {naga.stats.totalMaxHp}</span>
                                                      <span className="flex items-center gap-1"><Zap size={8} className={naga.currentHp > 0 ? "text-cyan-400" : ""} /> {naga.stats.str} ATK</span>
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
                          <div className="bg-amber-500 border-4 md:border-[6px] border-black p-6 md:p-8 rounded-[30px] md:rounded-[40px] text-center shadow-[10px_10px_0_rgba(0,0,0,1)] md:shadow-[15px_15px_0_rgba(0,0,0,1)] w-full transform -rotate-1 relative overflow-hidden">
                             <div className="absolute inset-0 comic-halftone opacity-20 text-black pointer-events-none"></div>
                             <Trophy size={48} className="text-black mx-auto mb-3 md:mb-4 animate-pulse relative z-10 md:w-16 md:h-16" />
                             <h3 className="text-black text-3xl md:text-5xl font-black uppercase italic tracking-tighter drop-shadow-[2px_2px_0_#fff] relative z-10">WAR CONCLUDED</h3>
                             <p className="text-black/70 font-black uppercase text-[10px] md:text-sm tracking-widest mt-1 md:mt-2 relative z-10 px-2">
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
                                 className={`px-8 md:px-12 py-4 md:py-6 rounded-xl md:rounded-2xl font-black text-lg md:text-2xl uppercase italic border-4 border-black shadow-[5px_5px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all ${warData.claimed?.[player.uid] ? 'bg-slate-700 text-slate-400 grayscale' : 'bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-105 active:scale-95'}`}
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
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 border-[4px] md:border-8 border-black rounded-[30px] md:rounded-[40px] shadow-[8px_8px_0_rgba(0,0,0,1)] md:shadow-[15px_15px_0_rgba(0,0,0,1)] text-center p-6 md:p-10 relative overflow-hidden">
                 <div className="absolute inset-0 comic-halftone opacity-10 text-emerald-500 pointer-events-none"></div>
                 <FlaskConical size={48} className="text-emerald-500 mb-4 md:mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-bounce relative z-10 md:w-20 md:h-20" />
                 <h2 className="text-2xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-2 md:mb-4 relative z-10">Research Lab</h2>
                 <p className="text-emerald-400 font-black uppercase tracking-widest text-[8px] md:text-sm mb-6 md:mb-8 relative z-10">Current Tech Level: {guildData?.labLevel || 0}</p>
                
                <div className="bg-black/60 border-[3px] md:border-4 border-emerald-500 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-lg mb-6 md:mb-8 relative z-10 shadow-[6px_6px_0_rgba(16,185,129,0.3)] md:shadow-[8px_8px_0_rgba(16,185,129,0.3)] transform -rotate-1">
                   <h3 className="text-emerald-400 text-lg md:text-xl font-black italic uppercase mb-2 md:mb-4 flex items-center justify-center gap-2"><Zap size={16} className="md:w-5 md:h-5" /> Active Global Buff</h3>
                   <p className="text-white font-black uppercase text-xs md:text-sm">+{((guildData?.labLevel || 0) * 5)}% to Combat Power.</p>
                   <p className="text-white/50 text-[8px] md:text-[10px] mt-1 md:mt-2 italic uppercase tracking-widest">Applies to STR, AGI, DEX, and Base HP for all enrolled Nagas globally.</p>
                </div>
                
                <button onClick={() => actions.donateToSyndicateLab()} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-black px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl uppercase italic border-[3px] md:border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[10px_10px_0_rgba(0,0,0,1)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 md:gap-4 relative z-10">
                   <Rocket size={20} className="md:w-6 md:h-6" /> Upgrade Tech Level
                </button>
                <span className="text-[9px] md:text-[10px] font-black text-white/40 uppercase mt-3 md:mt-4 tracking-[0.2em] relative z-10">Cost: 10,000 GX</span>
             </div>
          )}
         
         {activeTab === 'leaderboard' && (
             <div className="flex-1 flex flex-col bg-slate-900 border-[6px] md:border-8 border-black rounded-[30px] md:rounded-[40px] shadow-[10px_10px_0_rgba(0,0,0,1)] md:shadow-[15px_15px_0_rgba(0,0,0,1)] overflow-hidden transition-all">
                <div className="bg-amber-500 border-b-[4px] md:border-b-8 border-black p-4 md:p-8 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 relative">
                   <div className="absolute inset-0 comic-halftone opacity-20 text-black pointer-events-none"></div>
                   <h2 className="text-xl md:text-4xl font-black text-black italic uppercase tracking-tighter relative z-10 flex items-center gap-2 md:gap-4"><Trophy size={18} className="md:w-8 md:h-8" /> Rankings</h2>
                   <button onClick={fetchGuilds} className="w-full md:w-auto bg-black text-white px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black uppercase italic hover:scale-105 active:scale-95 transition-all relative z-10 border border-white/20">Refetch</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scrollbar-hide">
                   <div className="space-y-3 md:space-y-4">
                      {[...allGuilds].sort((a, b) => ((b.gxVault || 0) + (b.xp || 0)) - ((a.gxVault || 0) + (a.xp || 0))).map((guild, idx) => (
                         <div key={guild.id} className={`flex items-center gap-3 md:gap-6 p-4 md:p-6 rounded-2xl md:rounded-3xl border-[3px] md:border-4 ${idx === 0 ? 'bg-amber-500/20 border-amber-500 shadow-[4px_4px_0_rgba(245,158,11,0.5)] md:shadow-[6px_6px_0_rgba(245,158,11,0.5)]' : 'bg-black border-slate-800'} relative overflow-hidden`}>
                            <div className={`w-8 md:w-12 flex items-center justify-center font-black text-xl md:text-2xl italic ${idx === 0 ? 'text-amber-500' : 'text-slate-500'}`}>#{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                               <h3 className="text-lg md:text-2xl font-black text-white uppercase italic truncate">{guild.name} <span className="text-amber-500 text-[10px] md:text-sm ml-1 md:ml-2">[{guild.tag}]</span></h3>
                               <p className="text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-widest mt-0.5 md:mt-1">Lvl {guild.labLevel || 0} | Members: {guild.members?.length || 0}</p>
                            </div>
                            <div className="text-right">
                               <span className="block text-amber-500 font-black text-sm md:text-xl italic drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">{(guild.gxVault || 0).toLocaleString()} GX</span>
                               <span className="block text-white/30 font-black uppercase text-[7px] md:text-[10px] tracking-widest mt-0.5 md:mt-1">Staked</span>
                            </div>
                         </div>
                      ))}
                      {allGuilds.length === 0 && <p className="text-center text-white/40 font-black italic uppercase mt-10 text-xs md:text-base">No active signatures detected.</p>}
                   </div>
                </div>
             </div>
           )}
       </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-red-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-red-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
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
                   <div className="absolute inset-x-0 bottom-0 bg-red-600 text-[6px] font-black text-black text-center py-0.5 uppercase italic">COMMANDER</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-red-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'factions' && (
                     <Shield className="text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'treasury' && (
                     <Zap className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] z-10 animate-pulse" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'wars' && (
                     <Swords className="text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-red-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-red-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-red-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-red-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-red-500' : 'bg-slate-800'}`}
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
                    className="flex-[2] bg-red-600 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-red-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'ENTER FACTION' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

       <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 8px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.3); border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
         .font-comic { font-family: 'Inter', sans-serif; font-weight: 900; }
         @media (max-width: 768px) {
           .font-comic { font-size: 14px; }
           h1, h2 { letter-spacing: -0.02em; line-height: 1.1; }
         }
       `}</style>
    </div>
  );
};
