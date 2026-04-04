import React, { useState } from 'react';
import { 
  Radio, 
  Share2, 
  Zap, 
  Shield, 
  Terminal, 
  Clock, 
  ArrowLeft, 
  Info, 
  AlertCircle,
  ExternalLink,
  Cpu,
  Globe,
  Database,
  History,
  CheckCircle2,
  Twitter,
  MessageSquare
} from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

const DEVLOG_ENTRIES = [
  {
    id: '1.2.6',
    date: '2026-04-04',
    title: 'THE TRANSMISSION PROTOCOL',
    category: 'SYSTEM UPDATE',
    type: 'feature',
    tag: 'NEW',
    color: 'purple',
    description: 'Establishment of the Grid-wide Transmission Log. Dev updates are now synced directly to your UI.',
    changes: [
      'New: Internal Devlog ("Transmissions")',
      'Uplink: Enhanced Identity Resolution for Farcaster users',
      'UI: Premium CRT aesthetic for system logs',
      'Social: Integrated "Broadcast" system for Warpcast & X'
    ],
    media: '/assets/monsters/Neon Slums/Ember Drake.jpg'
  },
  {
    id: '1.2.5',
    date: '2026-04-03',
    title: 'THE NEON SYNDICATE EXPANSION',
    category: 'MAJOR UPDATE',
    type: 'content',
    tag: 'STABLE',
    color: 'emerald',
    description: 'The Neon Syndicate has been detected in Sector 7. Prepare for high-stakes raids and legendary rewards.',
    changes: [
      'New Dungeon: Sector 7 "Neon Slums"',
      'New Enemies: Ember Drake, Null Stalker, Void Wraith',
      'Guild System: Initial support for Syndicate Alliances',
      'Combat Engine: Refined hit detection and crit calculations'
    ],
    media: '/assets/monsters/Void Sector 7/Void Wraith.jpg'
  },
  {
    id: '1.2.4',
    date: '2026-03-28',
    title: 'PVP ARENA STABILITY',
    category: 'PATCH',
    type: 'technical',
    tag: 'PATCHED',
    color: 'cyan',
    description: 'Stabilizing the Holo-Grid combat synchronization for smoother real-time duels.',
    changes: [
      'Reduced latency in PvP room presence',
      'Fixed a bug where profile cards would flicker during combat',
      'Added "Last Seen" timestamp for room participants',
      'Optimized mobile layout for 1v1 combat windows'
    ],
    media: '/assets/monsters/Gale Empire/Vortex Vanguard.jpg'
  },
  {
    id: '1.2.0',
    date: '2026-03-15',
    title: 'THE WALLET UPLINK REBORN',
    category: 'CORE SECURITY',
    type: 'feature',
    tag: 'SECURITY',
    color: 'amber',
    description: 'Unified Farcaster and EVM wallet architecture is now live. One identity, multiple platforms.',
    changes: [
      'Smart Identity Resolution: Sync mobile and desktop profiles',
      'Farcaster Frame v2 Integration',
      'Anti-Contamination Lock: Prevents multi-account wallet conflicts',
      'New "UnifiedAuthBanner" for real-time connection status'
    ],
    media: '/assets/monsters/Rust Canyon/Rust Cat 3-2.jpg'
  }
];

export const DevlogView = () => {
  const { adventure } = useGame();
  const { setView } = adventure;
  const [selectedEntry, setSelectedEntry] = useState(null);

  const shareToWarpcast = (entry) => {
    const text = `🚨 GRID TRANSMISSION: [${entry.id}] ${entry.title}\n\n"${entry.description}"\n\non Base! 🛡️💎 @dungeonswithgems`;
    const gameUrl = 'https://metaverse.dungeonswithgems.quest';
    
    // Embed only the game link to ensure the Farcaster Frame loads correctly
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(gameUrl)}`;
    window.open(url, '_blank');
  };

  const shareToX = (entry) => {
      const text = `🚨 GRID TRANSMISSION: [${entry.id}] ${entry.title}\n\n"${entry.description}"\n\n📡 Play: https://metaverse.dungeonswithgems.quest\n\n@DungeonsWithGems #Base #Web3Gaming #IdleGame`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  const colors = {
    emerald: 'text-emerald-400 border-emerald-500 bg-emerald-500/10',
    cyan: 'text-cyan-400 border-cyan-500 bg-cyan-500/10',
    amber: 'text-amber-400 border-amber-500 bg-amber-500/10',
    red: 'text-red-400 border-red-500 bg-red-500/10',
    purple: 'text-purple-400 border-purple-500 bg-purple-500/10',
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-500 p-4 md:p-6 bg-slate-900/40 relative">
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
        <Terminal size={400} className="absolute -bottom-20 -right-20 text-cyan-500 rotate-12" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]" />
      </div>

      <Header title="TRANSMISSION LOGS" onClose={() => setView('menu')} />

      {/* Main Terminal Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 relative z-10 pr-2">
        
        {/* Intro Banner */}
        <div className="bg-black/60 border-2 border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-1 bg-cyan-500 text-black text-[8px] font-black uppercase italic">LIVE_FEED</div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center border-2 border-cyan-500/50 animate-pulse">
               <Radio size={24} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-black text-white italic uppercase tracking-tighter">GRID SYSTEM RELAY</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Last sync: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <div className="h-1 w-8 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-1 w-8 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            <div className="h-1 w-8 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-4 pb-10">
          {DEVLOG_ENTRIES.map((entry, idx) => (
            <div 
              key={entry.id} 
              className="bg-slate-910 border-[3px] border-black rounded-2xl overflow-hidden shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all group relative bg-slate-900"
            >
              {/* Entry Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/40 border-b-2 border-white/5 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border-2 ${colors[entry.color]} shadow-lg`}>
                    {entry.type === 'content' ? <Cpu size={18} /> : entry.type === 'technical' ? <Terminal size={18} /> : <Shield size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">{entry.id}</span>
                      <span className="text-[6px] text-slate-500 font-black uppercase tracking-[0.2em]">{entry.date}</span>
                    </div>
                    <h3 className="text-base font-black text-white italic uppercase tracking-tighter leading-none group-hover:text-cyan-400 transition-colors">
                      {entry.title}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-sm border-2 text-[8px] font-black uppercase italic ${colors[entry.color]} shadow-inner`}>
                    {entry.tag}
                  </div>
                  
                  {/* Broadcast Group */}
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 ml-2">
                      <button 
                        onClick={() => shareToWarpcast(entry)}
                        className="p-1.5 md:p-2 bg-purple-600 border border-black hover:bg-purple-400 text-white rounded-md transition-all active:scale-90 flex items-center gap-1.5"
                        title="Cast Transmission"
                      >
                        <MessageSquare size={12} className="md:w-3.5 md:h-3.5 h-3 w-3" />
                        <span className="text-[7px] md:text-[8px] font-black uppercase">CAST</span>
                      </button>
                      <button 
                        onClick={() => shareToX(entry)}
                        className="p-1.5 md:p-2 bg-slate-800 border border-black hover:bg-white hover:text-black text-white rounded-md transition-all active:scale-90 flex items-center gap-1.5"
                        title="Tweet Transmission"
                      >
                        <Twitter size={12} className="md:w-3.5 md:h-3.5 h-3 w-3" />
                        <span className="text-[7px] md:text-[8px] font-black uppercase">X</span>
                      </button>
                  </div>
                </div>
              </div>

              {/* Entry Content */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-4">
                  <p className="text-xs font-bold text-slate-300 leading-relaxed uppercase tracking-tight italic">
                    "{entry.description}"
                  </p>
                  
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 pb-1 border-b border-white/5 w-fit">
                        <History size={10} className="text-cyan-400" />
                        <span className="text-[9px] font-black text-white uppercase italic tracking-widest">Protocol Delta</span>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {entry.changes.map((change, i) => (
                           <div key={i} className="flex items-start gap-2 bg-black/30 border border-white/5 p-2 rounded-lg group-hover:border-cyan-500/30 transition-all">
                              <CheckCircle2 size={10} className="text-cyan-500 mt-0.5 shrink-0" />
                              <span className="text-[9px] font-bold text-slate-400 uppercase leading-none tracking-tighter italic">{change}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>

                {entry.media && (
                  <div className="md:col-span-4 aspect-video rounded-xl border-2 border-black overflow-hidden relative shadow-2xl group/img">
                    <img 
                      src={entry.media} 
                      className="w-full h-full object-cover grayscale-[0.5] group-hover/img:grayscale-0 group-hover/img:scale-110 transition-all duration-700" 
                      alt=""
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + entry.id; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                       <span className="text-[7px] font-black text-white uppercase italic tracking-widest drop-shadow-lg">Aesthetic Sync</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Scanlines (Aesthetic) */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="h-1 bg-white mb-8" />
        ))}
      </div>
      
      {/* Footer System Info */}
      <div className="mt-2 pt-3 border-t border-white/5 flex justify-between items-center relative z-10 shrink-0">
        <div className="flex items-center gap-2">
           <Zap size={12} className="text-amber-400" />
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em] italic">TRANSMISSION_RELAY_CONNECTED</span>
        </div>
        <div className="text-[8px] font-black text-cyan-500/50 uppercase italic tracking-widest">GATEWAY v1.2.6</div>
      </div>
    </div>
  );
};
