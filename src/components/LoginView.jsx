import React, { useState, useEffect } from 'react';
import { 
  Sword, Shield, Zap, Globe, Lock, ChevronRight, Info, ShieldCheck, Database, Award, 
  Coins, Hammer, Package, Activity, TrendingUp, Target, Sparkles, Users, Map as MapIcon, 
  Trophy, MousePointer, Heart, Beer, ShoppingBag, Tag, Book, Trees, FlaskConical, Swords, AlertCircle,
  Github, Twitter, MessageCircle, Send
} from 'lucide-react';

export const LoginView = ({ handleGoogleLogin, handleFarcasterLogin, farcasterContext }) => {
  const [activeTab, setActiveTab] = useState('mission');
  const [activeMobileShot, setActiveMobileShot] = useState(0);
  const [activeDesktopShot, setActiveDesktopShot] = useState(0);

  const mobileShots = [
    '/assets/gamescreenshot/Mobilescreenshot (1).png',
    '/assets/gamescreenshot/Mobilescreenshot (2).png',
    '/assets/gamescreenshot/Mobilescreenshot (3).png',
    '/assets/gamescreenshot/Mobilescreenshot (4).png'
  ];

  const desktopShots = [
    '/assets/gamescreenshot/mainmenuscreenshot.png',
    '/assets/gamescreenshot/battlegamescreenshot.png'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMobileShot(prev => (prev + 1) % mobileShots.length);
      setActiveDesktopShot(prev => (prev + 1) % desktopShots.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const menuSections = [
    { id: 'dungeon', icon: <MapIcon size={14} />, title: 'Dungeon', desc: 'Deploy to lethal sectors for automated resource harvesting.', color: 'text-cyan-400', backdrop: '/assets/monsters/Rust Canyon/Rust Cat 2-1.jpg' },
    { id: 'tavern', icon: <Beer size={14} />, title: 'Tavern', desc: 'Hire skilled Mates to provide passive buffs during your raids.', color: 'text-amber-500', backdrop: '/assets/monsters/Rust Canyon/Oil Swimmer 1-0.jpg' },
    { id: 'attributes', icon: <Activity size={14} />, title: 'Attributes', desc: 'Permenantly evolve your stats using earned Ability Points.', color: 'text-orange-500', backdrop: '/assets/monsters/Rust Canyon/Rust Cat 1-2.jpg' },
    { id: 'gear', icon: <Zap size={14} />, title: 'Gear', desc: 'Manage your tactical equipment and artifact synchronizations.', color: 'text-cyan-500', backdrop: '/assets/monsters/Rust Canyon/Iron Pet 1-1.jpg' },
    { id: 'forge', icon: <Hammer size={14} />, title: 'Forge', desc: 'Craft high-tier Crystle equipment from raw materials.', color: 'text-amber-600', backdrop: '/assets/monsters/Rust Canyon/Rust Cat 2-2.jpg' },
    { id: 'market', icon: <Tag size={14} />, title: 'Market', desc: 'Trade items with other hunters in the decentralized marketplace.', color: 'text-emerald-500', backdrop: '/assets/monsters/Rust Canyon/Canyon Flyer 1-4.jpg' },
    { id: 'archives', icon: <Book size={14} />, title: 'Archives', desc: 'Analyze beast lore, item tech specs, and encounter data.', color: 'text-blue-500', backdrop: '/assets/monsters/Rust Canyon/Rust Cat 1-2.jpg' },
    { id: 'syndicate', icon: <Shield size={14} />, title: 'Syndicate', desc: 'Join global raids and secure tactical nodes for unique rewards.', color: 'text-red-500', backdrop: '/assets/monsters/Rust Canyon/Rust Cat 2-1.jpg' },
    { id: 'dragons', icon: <Trees size={14} />, title: 'Dragons', desc: 'Raise mystic drakes to gain permanent stat multipliers.', color: 'text-emerald-400', backdrop: '/assets/monsters/Rust Canyon/Iron Pet 1-1.jpg' },
    { id: 'pvp', icon: <Swords size={14} />, title: 'PVP Arena', desc: 'Test your strength in synchronized Holo-Grid combat.', color: 'text-purple-500', backdrop: '/assets/monsters/Rust Canyon/Rust Cat 2-2.jpg' },
    { id: 'lab', icon: <FlaskConical size={14} />, title: 'Lab', desc: 'Synthesize exotic consumables to boost your combat performance.', color: 'text-cyan-600', backdrop: '/assets/monsters/Rust Canyon/Oil Swimmer 1-0.jpg' },
    { id: 'boss', icon: <AlertCircle size={14} />, title: 'Boss', desc: 'Challenge World-class threats for Legendary Relic drops.', color: 'text-red-600', backdrop: '/assets/monsters/Rust Canyon/Rust Cat 2-1.jpg' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-2 md:p-6 lg:p-8 relative overflow-hidden font-sans">
      
      {/* --- Splash Art Background --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         {/* Left Splash: Rust Cat */}
         <div className="absolute top-0 left-0 w-1/2 h-full opacity-20 lg:opacity-30 mix-blend-lighten hidden md:block">
            <img src="/assets/monsters/Rust Canyon/Rust Cat 2-2.jpg" className="w-full h-full object-cover grayscale contrast-150 rotate-[-5deg] scale-110" alt="" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
         </div>
         {/* Right Splash: Canyon Flyer */}
         <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 lg:opacity-30 mix-blend-lighten hidden md:block">
            <img src="/assets/monsters/Rust Canyon/Canyon Flyer 1-4.jpg" className="w-full h-full object-cover grayscale contrast-150 rotate-[5deg] scale-110" alt="" />
            <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent"></div>
         </div>
         
         {/* Global Atmosphere */}
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950"></div>
         <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-cyan-900/20 to-transparent"></div>
      </div>

      <div className="max-w-7xl w-full flex flex-col gap-4 relative z-10 animate-in fade-in zoom-in duration-700">
        
        {/* TOP ROW: BRANDING + LOGIN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
           
           {/* BRANDING (Left 8) */}
           <div className="lg:col-span-8 flex flex-col justify-center bg-transparent p-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full mb-4 self-start backdrop-blur-md">
                 <Sparkles size={12} className="text-cyan-400" />
                 <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest italic">Web3 Gaming Reborn</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.85] mb-4 drop-shadow-[8px_8px_0_rgba(0,0,0,1)]">
                Dungeons <br/><span className="text-cyan-500 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">With Gems</span>
              </h1>
              <div className="bg-black/60 border-l-4 border-cyan-500 p-4 backdrop-blur-md rounded-r-2xl max-w-2xl border border-white/5">
                 <p className="text-xs md:text-base font-black text-slate-100 uppercase italic leading-tight">
                    "A hands-free idle game for busy people who are gamers by heart. Forge your legacy and return to legendary loot while the app auto-plays."
                 </p>
              </div>
           </div>

           {/* LOGIN CARD (Right 4) */}
           <div className="lg:col-span-4 flex flex-col bg-slate-900 border-[4px] border-black rounded-[2.5rem] p-6 shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-20"></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full group-hover:bg-cyan-500/20 transition-all"></div>
              
               <div className="text-center mb-6 relative z-10">
                  <div className="w-28 h-28 bg-slate-950 border-[4px] border-cyan-500 rounded-3xl mx-auto overflow-hidden transform -rotate-6 shadow-[0_0_30px_rgba(6,182,212,0.3)] mb-6 relative p-2 group-hover:rotate-0 transition-all duration-500">
                     <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>
                     <img src="/assets/gameicon/DWGX-Icon.png" className="w-full h-full object-contain relative z-10" alt="DWGX Icon" />
                     <div className="absolute -right-3 -bottom-3 w-10 h-10 bg-amber-500 border-[3px] border-black rounded-xl transform rotate-12 flex items-center justify-center shadow-2xl z-20">
                        <Lock size={18} className="text-black" />
                     </div>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">Access Node</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Initialize SECURE Login</p>
               </div>

              {farcasterContext ? (
                <div className="space-y-3 relative z-10">
                  <button
                    onClick={handleFarcasterLogin}
                    className="w-full h-16 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl flex items-center justify-between px-5 transition-all transform active:scale-[0.98] border-[3px] border-black shadow-[6px_6px_0_rgba(0,0,0,0.3)] group overflow-hidden"
                  >
                     <div className="flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-lg border-2 border-black">
                           <Users size={18} className="text-purple-600" />
                        </div>
                        <div className="flex flex-col items-start leading-none group-hover:translate-x-1 transition-transform">
                           <span className="text-[10px] font-black uppercase text-purple-200 mb-0.5">Quick Access Detected</span>
                           <span className="text-xs font-black uppercase tracking-tighter italic">One-Click Secure Launch</span>
                        </div>
                     </div>
                     <div className="bg-black/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                        <ChevronRight size={18} />
                     </div>
                  </button>
                  <p className="text-[7px] font-black text-slate-500 uppercase text-center tracking-[0.2em]">Verified as @{farcasterContext.user?.username || 'Farcaster User'}</p>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="w-full h-14 bg-white hover:bg-cyan-500 text-black rounded-2xl flex items-center justify-between px-5 transition-all transform active:scale-[0.98] border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,0.1)] group overflow-hidden relative z-10"
                >
                   <div className="flex items-center gap-3">
                      <div className="bg-slate-50 p-1.5 rounded-lg border-2 border-black">
                         <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                      </div>
                      <span className="text-xs font-black uppercase tracking-tighter italic group-hover:tracking-normal transition-all">Start Adventure</span>
                   </div>
                   <ChevronRight size={18} />
                </button>
              )}

              <div className="mt-4 p-3 bg-slate-950 border-2 border-white/5 rounded-xl relative z-10">
                 <div className="flex items-center gap-2 mb-1">
                    <Lock size={12} className="text-slate-500" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Privacy Protocol</span>
                 </div>
                 <p className="text-[8px] font-black text-slate-600 uppercase italic leading-tight">Secure Google Sync. No locally stored passwords. Trust the network.</p>
              </div>
           </div>
        </div>

        {/* BOTTOM SECTION: DASHBOARD (Tabs) */}
        <div className="flex-1 bg-slate-900/60 backdrop-blur-2xl border-[4px] border-black rounded-[2.5rem] p-4 md:p-6 shadow-2xl relative overflow-hidden flex flex-col min-h-[450px]">
           
           {/* MASTER TABS */}
           <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4 shrink-0 relative z-10">
              <button onClick={() => setActiveTab('mission')} className={`px-5 py-2 rounded-xl font-black uppercase italic text-[10px] tracking-tighter border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${activeTab === 'mission' ? 'bg-cyan-600 text-white -translate-y-1 shadow-[5px_5px_0_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
                 Mission Brief
              </button>
              <button onClick={() => setActiveTab('modules')} className={`px-5 py-2 rounded-xl font-black uppercase italic text-[10px] tracking-tighter border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${activeTab === 'modules' ? 'bg-amber-600 text-white -translate-y-1 shadow-[5px_5px_0_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
                 Sector Modules
              </button>
              <button onClick={() => setActiveTab('intel')} className={`px-5 py-2 rounded-xl font-black uppercase italic text-[10px] tracking-tighter border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${activeTab === 'intel' ? 'bg-purple-600 text-white -translate-y-1 shadow-[5px_5px_0_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
                 Intelligence Feed
              </button>
              <button onClick={() => setActiveTab('tech')} className={`px-5 py-2 rounded-xl font-black uppercase italic text-[10px] tracking-tighter border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${activeTab === 'tech' ? 'bg-slate-700 text-white -translate-y-1 shadow-[5px_5px_0_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
                 System Architecture
              </button>
           </div>

           {/* TAB CONTENT */}
           <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative z-10">
             
             {activeTab === 'mission' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-in fade-in slide-in-from-bottom-4">
                   <div className="space-y-6">
                      <div className="flex flex-col gap-1">
                         <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em]">Protocol Briefing</span>
                         <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-transparent"></div>
                      </div>
                      <div className="space-y-4">
                         {[
                           { step: 1, title: "Initialize Identity", desc: "Securely link your account. Your progress is synced instantly to the blockchain terminal.", icon: <Globe size={16} /> },
                           { step: 2, title: "Idle & Accumulate", desc: "Select a sector. Your warrior engages in automated, hands-free combat while the terminal is active.", icon: <TrendingUp size={16} /> },
                           { step: 3, title: "Excel & Forge", desc: "Use loot and tokens to craft legendary gear and dominate the global rankings.", icon: <Trophy size={16} /> }
                         ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                               <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center font-black text-black italic text-lg shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">{item.step}</div>
                               <div>
                                  <h4 className="text-xs font-black text-white uppercase italic mb-1">{item.title}</h4>
                                  <p className="text-[10px] font-black text-white uppercase tracking-tight italic leading-tight">{item.desc}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* MOBILE FRAME (Moved from Intel) */}
                   <div className="flex flex-col items-center gap-4">
                      {/* Phone Body */}
                      <div className="relative w-[210px] md:w-[240px] h-[420px] md:h-[480px] bg-slate-800 border-[8px] border-black rounded-[3rem] shadow-[20px_20px_0_rgba(0,0,0,0.4)] overflow-hidden group">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                            <div className="w-6 h-1 bg-slate-800 rounded-full"></div>
                         </div>
                         <div className="absolute inset-0 z-10">
                            <img src={mobileShots[activeMobileShot]} className="w-full h-full object-cover" alt="Mobile UI" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                         </div>
                      </div>
                      <p className="text-[8px] font-black text-cyan-500 uppercase italic tracking-widest bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-500/20">Active Mobile Session</p>
                   </div>
                </div>
             )}

             {activeTab === 'modules' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4">
                   {menuSections.map((item, i) => (
                      <div key={i} className="group relative bg-white border-[3px] border-black p-3 md:p-4 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all flex flex-col items-center text-center overflow-hidden">
                         {/* Card Backdrop */}
                         <div className="absolute inset-0 z-0 pointer-events-none opacity-50 group-hover:opacity-75 transition-opacity">
                            <img src={item.backdrop} className="w-full h-full object-cover grayscale opacity-80" alt="" />
                            <div className="absolute inset-0 bg-white/15" />
                         </div>

                         <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 bg-black ${item.color} rounded-xl flex items-center justify-center mb-3 shadow-[2px_2px_0_#ccc] group-hover:scale-110 transition-transform shrink-0`}>
                               {item.icon}
                            </div>
                            <h4 className="text-[10px] font-black text-black uppercase italic mb-1 leading-none">{item.title}</h4>
                            <p className="text-[8px] font-black text-black uppercase tracking-tight italic leading-tight">{item.desc}</p>
                         </div>
                      </div>
                   ))}
                </div>
             )}

              {activeTab === 'intel' && (
                 <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 py-4">
                    
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
                       <span className="text-[10px] font-black text-white uppercase tracking-widest italic tracking-[0.3em]">System Terminal Overview</span>
                    </div>

                    {/* HORIZONTAL DESKTOP TERMINAL (Full Width) */}
                    <div className="relative w-full aspect-[21/9] flex flex-col items-center group">
                       <div className="relative w-full h-[95%] bg-slate-900 border-[12px] border-black rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                          <img 
                            src={desktopShots[activeDesktopShot]} 
                            className="w-full h-full object-cover animate-in fade-in duration-1000" 
                            alt="Desktop UI" 
                          />
                          <div className="absolute inset-0 bg-scanline opacity-20 pointer-events-none"></div>
                          <div className="absolute top-4 right-4 bg-black/60 text-[8px] font-black text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30 backdrop-blur-md">TER-VUX-88</div>
                       </div>
                       
                       <div className="w-32 h-6 bg-black transform perspective-1000 rotate-x-45 -mt-1 shadow-2xl"></div>
                       <div className="w-64 h-2 bg-black rounded-full -mt-0.5 opacity-60"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                       <div className="bg-cyan-950/20 border-l-4 border-cyan-500 p-4 rounded-r-2xl backdrop-blur-md">
                          <p className="text-[9px] font-black text-cyan-100 uppercase leading-tight italic">Hybrid L2 verification ensures that every battle results in legitimized on-chain progression data without user friction.</p>
                       </div>
                       <div className="bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-2xl backdrop-blur-md">
                          <p className="text-[9px] font-black text-amber-100 uppercase leading-tight italic">Cross-platform synchronization verified. Gear, GX, and Mates propagate across all nodes in the decentralized network.</p>
                       </div>
                    </div>
                 </div>
              )}

             {activeTab === 'tech' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                   <div className="bg-white border-[3px] border-black p-5 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-4">
                         <div className="p-2 bg-black text-white rounded-lg"><Zap size={16} /></div>
                         <h4 className="text-xs font-black text-black uppercase italic tracking-tighter">Core Stack</h4>
                      </div>
                      <p className="text-[9px] font-black text-black uppercase italic leading-tight mb-4 underline decoration-cyan-500 decoration-2">Modern Frameworks Only.</p>
                      <ul className="text-[8px] font-black text-black uppercase italic space-y-1.5 list-disc list-inside">
                         <li>React 19 Hooks-driven lifecycle.</li>
                         <li>Vite blazing fast bundling engine.</li>
                         <li>Tailwind CSS Utility-First design.</li>
                         <li>Lucide React Vector Icon System.</li>
                      </ul>
                   </div>

                   <div className="bg-white border-[3px] border-black p-5 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-4">
                         <div className="p-2 bg-black text-white rounded-lg"><Activity size={16} /></div>
                         <h4 className="text-xs font-black text-black uppercase italic tracking-tighter">Combat Logic</h4>
                      </div>
                      <p className="text-[9px] font-black text-black uppercase italic leading-tight mb-4 underline decoration-amber-500 decoration-2">Deterministic Calculations.</p>
                      <ul className="text-[8px] font-black text-black uppercase italic space-y-1.5 list-disc list-inside">
                         <li>15% Exponential XP/GX Floor Scaling.</li>
                         <li>Server-Side Deterministic Combat Math.</li>
                         <li>Automatic Session Reward Validation.</li>
                         <li>Pity Relic Droprate Algorithm.</li>
                      </ul>
                   </div>

                   <div className="bg-white border-[3px] border-black p-5 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-4">
                         <div className="p-2 bg-black text-white rounded-lg"><Database size={16} /></div>
                         <h4 className="text-xs font-black text-black uppercase italic tracking-tighter">Persistence</h4>
                      </div>
                      <p className="text-[9px] font-black text-black uppercase italic leading-tight mb-4 underline decoration-purple-500 decoration-2">Firebase Cloud BaaS.</p>
                      <ul className="text-[8px] font-black text-black uppercase italic space-y-1.5 list-disc list-inside">
                         <li>Real-time sync via Firestore SDK.</li>
                         <li>Google OAuth for secure persistence.</li>
                         <li>Decentralized user state management.</li>
                      </ul>
                   </div>

                   <div className="bg-white border-[3px] border-black p-5 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col h-full md:col-span-3">
                      <div className="flex items-center gap-2 mb-4">
                         <div className="p-2 bg-black text-white rounded-lg"><Globe size={16} /></div>
                         <h4 className="text-xs font-black text-black uppercase italic tracking-tighter">Web3 Layer (Base Mainnet)</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                         <div>
                            <p className="text-[9px] font-black text-black uppercase italic leading-tight mb-2 underline decoration-cyan-500 decoration-2">On-Chain Identity.</p>
                            <ul className="text-[8px] font-black text-black uppercase italic space-y-1.5 list-disc list-inside">
                               <li>Native <b>Base Mainnet</b> (L2) integration for efficiency.</li>
                               <li>Compatible with all EVM Wallets (Metamask, Coinbase).</li>
                               <li>Non-custodial identity linking via BrowserProvider.</li>
                            </ul>
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-black uppercase italic leading-tight mb-2 underline decoration-amber-500 decoration-2">Asset Verification.</p>
                            <ul className="text-[8px] font-black text-black uppercase italic space-y-1.5 list-disc list-inside">
                               <li><b>Genesis NFT</b> ownership detection logic.</li>
                               <li>On-chain inventory & achievement synchronization.</li>
                               <li>Encrypted digital asset ownership proofs.</li>
                            </ul>
                         </div>
                      </div>
                   </div>
                </div>
             )}

           </div>

           {/* FOOTER STATUS */}
           <div className="mt-6 pt-4 border-t border-white/10 flex flex-col items-center gap-6 shrink-0 relative z-10">
              <div className="flex flex-col items-center gap-2">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></div>
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.3em] opacity-40">Signal_Lock: Sector_Alpha</span>
                 </div>
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.6em] opacity-40 italic">DUNGEONS_WITH_GEMS // CORE_SYSTEM_2.1</p>
              </div>

              {/* SOCIAL LINKS */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-6 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                 <div className="flex items-center gap-2 border-r border-white/10 pr-6 mr-2 hidden md:flex">
                    <span className="text-[10px] font-black text-slate-400 uppercase italic">Architect:</span>
                    <span className="text-[10px] font-black text-cyan-500 uppercase italic tracking-wider">Skipper Gemx</span>
                 </div>
                 
                 <a href="https://github.com/skippergemx" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                    <Github size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-tight">Github</span>
                 </a>
                 
                 <a href="https://x.com/skippergemx" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group">
                    <Twitter size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-tight">Twitter</span>
                 </a>
                 
                 <a href="https://t.me/skippergemx" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group">
                    <Send size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-tight">Telegram</span>
                 </a>
                 
                 <div className="flex items-center gap-2 text-slate-400 cursor-help group" title="Discord: skippergemx">
                    <MessageCircle size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-tight">Discord</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
