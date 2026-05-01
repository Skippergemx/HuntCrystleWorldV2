import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Map as MapIcon, 
  Beer, 
  Activity, 
  Package, 
  ShoppingBag, 
  Hammer, 
  Book, 
  Globe, 
  AlertCircle, 
  Clock, 
  Trees,
  Swords,
  Zap,
  Tag,
  HelpCircle,
  FlaskConical,
  Sparkles,
  BookOpen,
  Shield,
  ShieldAlert,
  Radio,
  Check,
  Brain,
  ShoppingCart,
  Users
} from 'lucide-react';
import { 
  Header, 
  NavBtn, 
  StatTile, 
  AttributeRow, 
  AvatarMedia, 
  CitizenMedia 
} from './GameUI';
import { useGame } from '../contexts/GameContext';

const DIALOGUE_POOL = {
  idle: [
    "Ready for another run?",
    "These sector slums... they never change.",
    "Data streams are looking stable today.",
    "Found anything good in the wreckage?",
    "Where to next, Hunter?"
  ],
  tips: [
    "TIP: Dexterity increases your Forge success rate significantly!",
    "TIP: Legendary loot only drops in floors 20 and above.",
    "TIP: Watch the map colors. Elemental affinities are real.",
    "TIP: Hiring a Tavern Mate is the best insurance for Boss battles.",
    "TIP: Salvage common gear to get materials for Crystle crafting.",
    "TIP: Strength increases flat physical damage. Simple but effective.",
    "TIP: Agility determines your Crit rate. Hunt for those red numbers!",
    "TIP: Always check your Dragon Buffs before entering deep floors."
  ],
  lowHp: [
    "I'm leaking coolant here... we need a fix.",
    "System integrity at critical levels. Let's rest.",
    "One more hit and we're neural-dumped. Heal up!"
  ],
  hasAp: [
    "I feel untapped potential... check the Stats.",
    "Ready for a neural upgrade?",
    "These Ability Points won't spend themselves!"
  ],
  penalized: [
    "Just catching my breath. Stand by.",
    "System reboot in progress... give me a sec.",
    "That last one stung. Recalibrating."
  ],
  rich: [
    "We're stacked! Let's hit the Market.",
    "GX tokens burning a hole in my pocket...",
    "Shop day? I'm feeling some new gear."
  ]
};

const DUO_DIALOGUE = [
  ["H: How are the levels looking, buddy?", "P: Energy cores at 100%. We're combat-ready!"],
  ["P: *Scans surrounding floor*", "H: Spotting anything good in the loot-streams?"],
  ["H: Ready for the next run?", "P: Always. The Meta-verse won't conquer itself."],
  ["P: I sense untapped stats in your neural core.", "H: You're right. I should check the Attributes."],
  ["H: Think we can take the Boss in Sector 7?", "P: With your skill and my logic? Not even a contest."],
  ["P: Watch your HP, Hunter. It's getting low.", "H: Don't worry, I've got a potion ready."],
  ["H: These crystal pets are smarter than they look.", "P: We're literally built from ancient logic-gems, boss."]
];

const CharacterBadge = ({ player, penaltyRemaining, petsMeta, lowPerfMode }) => {
  const [fullMsg, setFullMsg] = React.useState("");
  const [displayedMsg, setDisplayedMsg] = React.useState("");
  const [lineIdx, setLineIdx] = React.useState(0);
  const [activeDuo, setActiveDuo] = React.useState(null);
  const currentPet = player.petId ? petsMeta.find(p => p.id === player.petId) : null;
  
  const pickMessage = React.useCallback(() => {
    setActiveDuo(null);
    setLineIdx(0);
    let pool = DIALOGUE_POOL.idle;
    const isLowHp = player.hp < (player.maxHp * 0.4);
    if (currentPet && Math.random() < 0.3) {
      const duo = DUO_DIALOGUE[Math.floor(Math.random() * DUO_DIALOGUE.length)];
      setActiveDuo(duo);
      setFullMsg(duo[0]);
    } else {
      if (penaltyRemaining > 0) pool = DIALOGUE_POOL.penalized;
      else if (isLowHp) pool = DIALOGUE_POOL.lowHp;
      else if (player.abilityPoints > 0) pool = DIALOGUE_POOL.hasAp;
      else pool = Math.random() > 0.5 ? DIALOGUE_POOL.tips : DIALOGUE_POOL.idle;
      setFullMsg(pool[Math.floor(Math.random() * pool.length)]);
    }
    setDisplayedMsg(""); 
  }, [player.hp, player.abilityPoints, penaltyRemaining, currentPet]);

  React.useEffect(() => {
    if (displayedMsg.length < fullMsg.length) {
      const timeout = setTimeout(() => setDisplayedMsg(fullMsg.slice(0, displayedMsg.length + 1)), 30);
      return () => clearTimeout(timeout);
    } else if (activeDuo && lineIdx < activeDuo.length - 1) {
      const timeout = setTimeout(() => {
        setLineIdx(lineIdx + 1);
        setFullMsg(activeDuo[lineIdx + 1]);
        setDisplayedMsg("");
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [displayedMsg, fullMsg, activeDuo, lineIdx]);

  React.useEffect(() => {
    pickMessage();
    const interval = setInterval(pickMessage, 15000);
    return () => clearInterval(interval);
  }, [pickMessage]);

  const isPetTalking = displayedMsg.startsWith("P:");
  const cleanDisplayMsg = displayedMsg.replace(/^(H:|P:)\s*/, "");

  return (
    <div className="w-full flex items-center justify-center p-2 relative z-50">
      {/* TACTICAL COMMAND BANNER - SLIM & WIDE */}
      <div className="w-full max-w-4xl bg-[#faf6f0] border-[4px] border-black rounded-2xl p-2 px-4 flex items-center gap-4 md:gap-6 shadow-[8px_8px_0_rgba(0,0,0,1)] relative overflow-hidden transform rotate-0.5 transition-all hover:rotate-0 hover:-translate-y-1 hover:shadow-[12px_12px_0_rgba(0,0,0,1)] group cursor-pointer" onClick={pickMessage}>
         {/* Top Hanging Tape */}
         <div className="absolute -top-3 left-1/4 w-32 h-6 bg-slate-400/20 border-x-2 border-black/5 rotate-1 z-50 backdrop-blur-sm pointer-events-none" />
         
         <div className="relative shrink-0 flex items-center">
            {/* Slim Avatar Slot */}
            <div className="w-16 h-16 md:w-20 md:h-20 bg-black border-[3px] border-black rounded-xl overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 group-hover:rotate-0 transition-transform">
               <AvatarMedia num={player.avatar} animated={!lowPerfMode} className="w-full h-full object-cover object-top scale-110" />
            </div>
            {currentPet && (
              <div className="absolute -bottom-1 -right-2 w-8 h-8 rounded-lg border-2 border-black overflow-hidden bg-slate-950 shadow-[2px_2px_0_rgba(0,0,0,1)] z-10 transform rotate-12 group-hover:rotate-0 transition-transform">
                <img src={`/assets/pets/genesis-pets/Genesis Pets (${currentPet.id}).jpg`} className="w-full h-full object-cover contrast-125" />
              </div>
            )}
         </div>

         <div className="flex-1 flex flex-col md:flex-row items-center gap-4 md:gap-8 min-w-0">
            {/* Identity Segment */}
            <div className="flex flex-col shrink-0 border-r-2 border-black/5 pr-4">
               <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">REGISTRY_ID</span>
               <div className="flex items-center gap-2">
                  <span className="text-sm md:text-base font-[1000] text-black italic truncate leading-none uppercase tracking-tighter">{player.name}</span>
                  <span className="text-[10px] font-black text-cyan-600 italic leading-none bg-cyan-50 px-1 border border-cyan-100 rounded">LVL_{player.level}</span>
               </div>
            </div>

            {/* Horizontal Intelligence Stream */}
            <div className="flex-1 h-12 overflow-hidden relative bg-black/5 rounded-lg border border-black/5 p-2 flex items-center">
               <p className="text-[10px] md:text-xs font-black text-slate-700 uppercase leading-snug italic line-clamp-2">
                 <span className={`${isPetTalking ? 'text-amber-600' : 'text-cyan-600'} drop-shadow-sm`}>{isPetTalking ? '[PET_LINK]:' : '[COMM_LINK]:'}</span> {cleanDisplayMsg}
               </p>
               {/* Pulse Cursor */}
               <div className="w-1.5 h-3 bg-cyan-500 animate-pulse ml-1 shrink-0" />
            </div>
         </div>

         {/* Right Status Dot */}
         <div className="hidden md:flex flex-col items-end gap-1 shrink-0 pl-2">
            <div className="flex items-center gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[6px] font-black text-slate-400 italic">LIVE_UPLLINK</span>
            </div>
            <div className="text-[8px] font-black text-black/20">#{player.id?.slice(-4)}</div>
         </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 10px; }
        .clip-hex { clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }
      `}</style>
    </div>
  );
};

const MissionBriefing = ({ player, setView }) => {
  const today = new Date().toISOString().split('T')[0];
  const claimsToday = player?.lastFaucetClaimDate === today ? (player?.dailyFaucetClaims || 0) : 0;
  const remainingRolls = Math.max(0, 30 - claimsToday);
  const isWalletLinked = !!player?.walletAddress;
  
  return (
    <div className="w-full max-w-4xl mx-auto mb-10 animate-in slide-in-from-top duration-1000">
      <div className={`border-[4px] border-black rounded-2xl p-4 md:p-6 shadow-[10px_10px_0_rgba(0,0,0,1)] relative overflow-hidden transform -rotate-1 hover:rotate-0 transition-all cursor-default group ${isWalletLinked ? 'bg-[#fff9c4]' : 'bg-red-50'}`}>
        {/* Tape Decor */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-10 bg-black/10 backdrop-blur-sm border-x-2 border-black/5 rotate-1 pointer-events-none z-20" />
        
        {/* Highlight Glow */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl group-hover:opacity-30 transition-colors ${isWalletLinked ? 'bg-amber-400/20' : 'bg-red-500/10'}`} />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Visual Indicator */}
          <div className="shrink-0 relative">
             <div className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-2xl flex items-center justify-center border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] transform rotate-3 group-hover:rotate-0 transition-all duration-500">
                <Zap className={`${isWalletLinked ? 'text-yellow-400' : 'text-red-500'} animate-pulse`} size={32} />
             </div>
             <div className={`absolute -bottom-1 -right-2 text-white text-[8px] font-black px-2 py-1 rounded-lg border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] uppercase tracking-tighter italic ${isWalletLinked ? 'bg-emerald-600' : 'bg-red-600 animate-bounce'}`}>
                {isWalletLinked ? 'SIGNAL_LIVE' : 'NODE_OFFLINE'}
             </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
               <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-md tracking-[0.2em] uppercase italic leading-none">Directive</span>
               <div className="w-1 h-1 rounded-full bg-black/20" />
               <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${isWalletLinked ? 'text-black/40' : 'text-red-600'}`}>REF: {isWalletLinked ? 'ETH_REWARD_UPLINK' : 'UPLINK_CRITICAL_FAILURE'}</span>
            </div>
            
            <h3 className="text-lg md:text-2xl font-[1000] text-black uppercase italic leading-none tracking-tighter mb-2">
              {isWalletLinked ? (
                <>ETH <span className="text-amber-600 underline decoration-[4px] decoration-amber-600/30">DRIP</span> TRANSMISSION ACTIVE</>
              ) : (
                <>WALLET LINK <span className="text-red-600 underline decoration-[4px] decoration-red-600/30">REQUIRED</span></>
              )}
            </h3>
            
            <p className="text-[11px] md:text-sm font-bold text-black/80 uppercase leading-tight italic max-w-2xl">
               {isWalletLinked ? (
                 `"EARN ETH DRIPS & SUBSIDIES IN THE CRYSTLE TOWN & ILEARN SECTORS. RAID DUNGEONS, COMPLETE NPC QUESTS, AND CLAIM YOUR DAILY GAS REWARDS!"`
               ) : (
                 `"DRIP TRANSMISSION BLOCKED. CONNECT YOUR NODE IN THE IDENTITY CORE TO AUTHORIZE ETH SUBSIDIES. NO WALLET, NO DRIPS!"`
               )}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-3">
             {isWalletLinked ? (
               <>
                 <div className="flex items-center gap-1.5 bg-black/5 px-3 py-2 rounded-full border border-black/10">
                    <div className={`w-2 h-2 rounded-full ${remainingRolls > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-black text-black uppercase tracking-widest ml-1">{remainingRolls}/30 CHANCES LEFT</span>
                 </div>
                 <div className="text-[10px] font-black text-black/30 uppercase italic tracking-tighter animate-pulse">Neural Link Stable</div>
               </>
             ) : (
               <button 
                 onClick={() => setView('avatars')}
                 className="px-6 py-3 bg-black text-white font-black uppercase italic text-xs border-[3px] border-black shadow-[6px_6px_0_rgba(239,68,68,1)] hover:bg-red-600 hover:shadow-none transition-all active:translate-y-1"
               >
                 Link Node Now
               </button>
             )}
          </div>
        </div>
        
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
      </div>
    </div>
  );
};

export const MenuView = React.memo(() => {
  const { adventure, gameLoop, syncPlayer, openGuide, user, player, PETS_METADATA, lowPerfMode, setLowPerfMode } = useGame();
  const { setView } = adventure;
  const { penaltyRemaining, autoTimeLeft } = gameLoop;
  const isPenalized = penaltyRemaining > 0;
  const isAdmin = user?.email === 'skippergemx@gmail.com';

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_menu_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "1. DEPLOYMENT: DUNGEONS",
      npc: 1,
      visualType: 'dungeon',
      text: "Step one: RAID DUNGEONS. This is where you deployment for combat to collect raw materials and tactical loot needed for city contracts.",
      hint: "Objective: Clear floors to fill your inventory with scrap and gems."
    },
    {
      title: "2. EXCHANGE: CRYSTLE TOWN",
      npc: 18,
      visualType: 'town',
      text: "Step two: CRYSTLE TOWN. Use your collected materials to complete citizen quests. This is your primary protocol for EARNING ETH rewards.",
      hint: "The Hook: Turning materials into ETH is the path to wealth."
    },
    {
      title: "3. OPTIMIZE: iLEARN HUB",
      npc: 22,
      visualType: 'brain',
      text: "Step three: iLEARN. Sharpen your neural core with educational challenges to farm high-grade POTIONS and stay combat-ready.",
      hint: "Meta-Strategy: Use potions from iLearn to push deeper into Dungeons."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) setTutorialStep(tutorialStep + 1);
    else {
      if (dontShowAgain) localStorage.setItem('hide_menu_tutorial', 'true');
      setShowTutorial(false);
    }
  };

  const startDungeon = () => setView('dungeon_menu');

  const SECONDARY_TOKENS = [
    { onClick: () => setView('crystle_town'), icon: <span className="text-2xl">🏙️</span>, title: "TOWN", color: "bg-amber-800", npcNum: 18 },
    { onClick: () => setView('dragons_ground'), icon: <Trees size={28} />, title: "RELICS", color: "bg-emerald-700", npcNum: 14 },
    { onClick: () => setView('ilearn'), icon: <Brain size={28} />, title: "LEARN", color: "bg-blue-800", npcNum: 22 },
  ];
  const UTILITY_LINKS = [
    { id: 'database', icon: <Book size={16} />, label: 'ARCHIVES' },
    { id: 'manual', icon: <BookOpen size={16} />, label: 'MANUAL' },
    { id: 'devlog', icon: <Radio size={16} />, label: 'DEVLOG' },
  ];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#e2d7c5]">
      {/* BACKGROUND DECOR: Floating Citizen Intelligence Files */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle Grid Base */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        {/* Intelligence Cards */}
        <div className="absolute top-10 -left-10 w-32 md:w-56 aspect-[9/16] bg-slate-900 border-[4px] border-black rounded-xl rotate-12 shadow-[12px_12px_0_rgba(0,0,0,0.2)] opacity-20">
          <CitizenMedia num={5} className="w-full h-full object-cover grayscale-[0.5]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className="absolute bottom-20 -right-16 w-32 md:w-60 aspect-[9/16] bg-slate-900 border-[4px] border-black rounded-xl -rotate-12 shadow-[12px_12px_0_rgba(0,0,0,0.2)] opacity-30">
          <CitizenMedia num={12} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className="absolute top-1/2 left-1/4 w-24 md:w-44 aspect-[9/16] bg-slate-900 border-[3px] border-black rounded-xl -rotate-6 shadow-[8px_8px_0_rgba(0,0,0,0.1)] opacity-20">
          <CitizenMedia num={22} className="w-full h-full object-cover grayscale-[0.2]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
      </div>
      
      {/* TOP HUD ROW (Tier 3) */}
      <div className="relative z-50 pt-2 px-2">
        <CharacterBadge 
          player={player} 
          penaltyRemaining={penaltyRemaining} 
          petsMeta={PETS_METADATA} 
          lowPerfMode={lowPerfMode}
        />
      </div>

      {/* SCROLLABLE MAIN BODY */}
      <div className="flex-1 flex flex-col items-center p-8 md:p-16 relative z-10 overflow-y-auto overflow-x-hidden custom-scrollbar pb-40 pt-10">
         
         <MissionBriefing player={player} setView={setView} />

         {/* THE CORE TRINITY (Responsive Flex) */}
         <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-6 lg:gap-8 w-full max-w-6xl mx-auto">
            
            {/* 1. RAID DUNGEON */}
            <div className="relative group cursor-pointer animate-in zoom-in duration-500 flex flex-col items-center" onClick={startDungeon}>
               <div className={`w-40 md:w-44 lg:w-52 aspect-[9/16] bg-slate-900 rounded-2xl border-[4px] border-black transition-all shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] hover:-translate-y-2 active:scale-95 transform -rotate-1 group-hover:rotate-0 overflow-hidden relative`}>
                  {/* Step Badge */}
                  <div className="absolute top-4 -left-8 bg-red-600 text-white px-8 py-1 font-black text-[9px] -rotate-45 border-b-2 border-black z-20 shadow-lg uppercase italic tracking-widest">Step 01</div>
                  
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-400/20 border-x-2 border-black/5 rotate-2 z-50 backdrop-blur-sm pointer-events-none" />
                  
                  {/* FULL ART PREVIEW */}
                  <div className="absolute inset-0 z-0">
                     <CitizenMedia num={1} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                     <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-red-950/90 via-red-950/30 to-transparent" />
                  </div>

                  {/* UI OVERLAY */}
                  <div className="absolute inset-x-2 bottom-3 z-10 flex flex-col items-center gap-1.5">
                     <div className={`p-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-3 mb-1 group-hover:rotate-0 transition-all ${isPenalized ? 'bg-red-600' : 'bg-red-700'}`}>
                        {isPenalized ? <Clock className="text-white animate-spin-slow" size={20} /> : <span className="text-xl drop-shadow-md">⚔️</span>}
                     </div>
                     <div className={`bg-white border-[2px] border-black py-1.5 px-3 shadow-[4px_4px_0_rgba(0,0,0,1)] -rotate-1 transform group-hover:rotate-0 transition-transform w-full text-center`}>
                        <h3 className="text-[10px] md:text-xs font-[1000] text-black uppercase italic tracking-tighter leading-none whitespace-nowrap">{isPenalized ? 'LOCKDOWN' : 'RAID DUNGEON'}</h3>
                     </div>
                  </div>
               </div>
               {!isPenalized && <div className="absolute inset-x-0 bottom-4 flex justify-center"><div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" /></div>}
            </div>

            {/* 2. CRYSTLE TOWN QUEST */}
            <div className="relative group cursor-pointer animate-in fly-in-bottom duration-500 flex flex-col items-center" onClick={() => setView('crystle_town')}>
               <div className="w-40 md:w-44 lg:w-52 aspect-[9/16] bg-slate-900 rounded-2xl border-[4px] border-black transition-all shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] hover:-translate-y-2 active:scale-95 transform rotate-2 group-hover:rotate-0 overflow-hidden relative">
                  {/* Step Badge */}
                  <div className="absolute top-4 -left-8 bg-amber-500 text-black px-8 py-1 font-black text-[9px] -rotate-45 border-b-2 border-black z-20 shadow-lg uppercase italic tracking-widest">Step 02</div>

                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-400/20 border-x-2 border-black/5 -rotate-1 z-50 backdrop-blur-sm pointer-events-none" />
                  
                  {/* FULL ART PREVIEW */}
                  <div className="absolute inset-0 z-0">
                     <CitizenMedia num={18} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                     <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-amber-950/90 via-amber-950/30 to-transparent" />
                  </div>
   
                  <div className="absolute inset-x-2 bottom-3 z-10 flex flex-col items-center gap-1.5">
                     <div className="p-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-3 mb-1 group-hover:rotate-0 transition-all bg-amber-600">
                        <span className="text-xl drop-shadow-md">🏙️</span>
                     </div>
                     <div className="bg-white border-[2px] border-black py-1.5 px-3 shadow-[4px_4px_0_rgba(0,0,0,1)] rotate-1 transform group-hover:rotate-0 transition-transform w-full flex flex-col items-center">
                        <h3 className="text-[8px] md:text-[9px] font-[1000] text-black uppercase italic tracking-tighter leading-none text-center">CRYSTLE TOWN QUEST</h3>
                     </div>
                  </div>
               </div>
            </div>

            {/* 3. iLEARN QUEST */}
            <div className="relative group cursor-pointer animate-in fly-in-bottom duration-500 flex flex-col items-center" onClick={() => setView('ilearn')}>
               <div className="w-40 md:w-44 lg:w-52 aspect-[9/16] bg-slate-900 rounded-2xl border-[4px] border-black transition-all shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] hover:-translate-y-2 active:scale-95 transform -rotate-2 group-hover:rotate-0 overflow-hidden relative">
                  {/* Step Badge */}
                  <div className="absolute top-4 -left-8 bg-blue-600 text-white px-8 py-1 font-black text-[9px] -rotate-45 border-b-2 border-black z-20 shadow-lg uppercase italic tracking-widest">Step 03</div>

                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-400/20 border-x-2 border-black/5 rotate-1 z-50 backdrop-blur-sm pointer-events-none" />
                  
                  {/* FULL ART PREVIEW */}
                  <div className="absolute inset-0 z-0">
                     <CitizenMedia num={22} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                     <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-950/90 via-blue-950/30 to-transparent" />
                  </div>
   
                  <div className="absolute inset-x-2 bottom-3 z-10 flex flex-col items-center gap-1.5">
                     <div className="p-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-6 mb-1 group-hover:rotate-0 transition-all bg-blue-700">
                        <span className="text-xl drop-shadow-md">🧠</span>
                     </div>
                     <div className={`bg-white border-[2px] border-black py-1.5 px-3 shadow-[4px_4px_0_rgba(0,0,0,1)] -rotate-1 transform group-hover:rotate-0 transition-transform w-full text-center`}>
                        <h3 className="text-[10px] md:text-[11px] font-[1000] text-black uppercase italic tracking-tighter leading-none whitespace-nowrap">ILEARN QUEST</h3>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* LOGISTICS ROW (9:16 Gallery) */}
         <div className="mt-16 md:mt-20 flex flex-col items-center gap-8 animate-in fade-in duration-1000">
            <div className="flex items-center gap-2">
                <div className="w-12 h-[2px] bg-black opacity-10" />
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-800 italic">Operations & Logistics</span>
                <div className="w-12 h-[2px] bg-black opacity-10" />
            </div>
            
            <div className="flex items-center justify-center gap-4 md:gap-8">
               {[
                 { id: 'biometric_core', icon: <Activity className="text-white" size={18} />, label: 'STATS AND EQUIPS', sub: 'SYSTEM', color: 'bg-cyan-700', npc: 10, grad: 'from-cyan-950/90' },
                 { id: 'crystle_bazaar', icon: <ShoppingCart className="text-white" size={18} />, label: 'BAZAAR', sub: 'TRADE', color: 'bg-amber-700', npc: 11, grad: 'from-amber-950/90' },
                 { id: 'dragons_ground', icon: <Trees className="text-white" size={18} />, label: "DRAGON'S GROUND", sub: 'RELICS', color: 'bg-emerald-700', npc: 14, grad: 'from-emerald-950/90' }
               ].map((token, i) => (
                  <button
                    key={token.id}
                    onClick={() => setView(token.id)}
                    className={`group flex flex-col items-center transition-all hover:-translate-y-2 active:scale-95 w-28 md:w-36 aspect-[9/16] bg-slate-900 border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] rounded-xl ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'} relative overflow-hidden`}
                  >
                     {/* FULL ART PREVIEW */}
                     <div className="absolute inset-0 z-0">
                        <CitizenMedia num={token.npc} className="w-full h-full object-cover grayscale-[0.2] transition-transform group-hover:scale-110 duration-700" />
                        <div className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t ${token.grad} via-transparent to-transparent opacity-90`} />
                     </div>

                     <div className="mt-auto relative z-10 w-full flex flex-col items-center pb-3 px-1.5 gap-2">
                        <div className={`w-10 h-10 flex items-center justify-center ${token.color} border-[2px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] rounded-lg transition-all group-hover:rotate-6`}>
                           {token.icon}
                        </div>
                        <div className="bg-white border-[2px] border-black py-1 px-1.5 shadow-[3px_3px_0_rgba(0,0,0,1)] -rotate-1 transform group-hover:rotate-0 transition-transform w-full">
                           <div className="text-[7px] md:text-[8px] font-black text-black uppercase italic leading-none text-center break-words">{token.label}</div>
                        </div>
                     </div>
                  </button>
               ))}
            </div>
         </div>
      </div>

      {/* SYSTEM UTILITY FOOTER */}
      <div className="bg-black border-t-[4px] border-slate-900 p-3 md:p-4 flex items-center justify-center gap-3 md:gap-6 relative z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
         <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-500 border-x-[3px] border-t-[3px] border-black px-4 py-0.5 rounded-t-xl text-[8px] font-black uppercase tracking-[0.3em] italic">Utility Uplink</div>
         {UTILITY_LINKS.map(link => (
            <button key={link.id} onClick={() => setView(link.id)} className="group flex flex-col items-center gap-1 text-slate-500 hover:text-cyan-400 transition-all active:scale-95">
               <div className="p-2 md:p-3 bg-slate-900 border-2 border-slate-800 rounded-xl group-hover:border-cyan-500 transition-all">
                 {link.icon}
               </div>
               <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest">{link.label}</span>
            </button>
         ))}
         {isAdmin && (
           <button onClick={() => setView('admin')} className="group flex flex-col items-center gap-1 text-red-600 hover:text-red-400 transition-all active:scale-95">
              <div className="p-2 md:p-3 bg-red-950/20 border-2 border-red-900/40 rounded-xl group-hover:border-red-500 transition-all">
                <ShieldAlert size={16} />
              </div>
              <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest">ADMIN</span>
           </button>
         )}
      </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            <div className="absolute inset-x-0 top-0 bottom-0 bg-emerald-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 mt-1 mb-1 pointer-events-none"></div>
            <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
              <div className="w-full bg-emerald-500 py-2 border-b-[3px] border-black transform -rotate-1 relative z-10 shadow-lg">
                <h2 className="text-xl font-black text-black text-center uppercase tracking-tighter italic">{tutorialSteps[tutorialStep].title}</h2>
                <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">Step {tutorialStep + 1} / {tutorialSteps.length}</div>
              </div>
              <div className="py-3 relative flex justify-center items-center gap-3 w-full z-10">
                <div className="w-16 h-28 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800">
                  <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-500 text-[6px] font-black text-black text-center py-0.5 uppercase italic">COMMANDER</div>
                </div>
                <div className="w-16 h-16 rounded-xl border-[3px] border-black bg-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                  {tutorialSteps[tutorialStep].visualType === 'town' && <MapIcon className="text-amber-400 animate-bounce" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'brain' && <Brain className="text-blue-400 animate-pulse" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'dungeon' && <Swords className="text-red-400 animate-pulse" size={36} />}
                </div>
              </div>
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col">
                <div className="bg-white text-black p-3 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <div className="absolute -top-3 -left-1 bg-emerald-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic">Incoming Transmission</div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase leading-[1.3] tracking-tight italic">"{tutorialSteps[tutorialStep].text}"</p>
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>
                <div className="bg-black/60 p-1.5 rounded-lg border border-emerald-500/30 mb-3">
                  <p className="text-[8px] font-black text-emerald-400 uppercase italic tracking-widest text-center">⚡ {tutorialSteps[tutorialStep].hint}</p>
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-3 text-white">
                  <button onClick={() => setDontShowAgain(!dontShowAgain)} className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                    {dontShowAgain && <Check size={10} className="text-white" />}
                  </button>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter" onClick={() => setDontShowAgain(!dontShowAgain)}>Don't show briefing again</span>
                </div>
                <div className="flex gap-2 pb-1">
                  {tutorialStep > 0 && <button onClick={() => setTutorialStep(prev => prev - 1)} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest border-[2px] border-black italic text-[9px]">BACK</button>}
                  <button onClick={nextStep} className="flex-[2] bg-emerald-500 text-black py-2.5 rounded-xl font-black uppercase tracking-widest border-[3px] border-black italic text-[10px] flex items-center justify-center gap-1.5">
                    {tutorialStep === tutorialSteps.length - 1 ? 'READY' : 'NEXT'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});
