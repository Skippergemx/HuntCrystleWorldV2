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
  Check
} from 'lucide-react';
import { NavBtn, AvatarMedia } from './GameUI';
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

const CharacterDash = ({ player, penaltyRemaining, petsMeta, lowPerfMode }) => {
  const [fullMsg, setFullMsg] = React.useState("");
  const [displayedMsg, setDisplayedMsg] = React.useState("");
  const [lineIdx, setLineIdx] = React.useState(0);
  const [activeDuo, setActiveDuo] = React.useState(null);
  const currentPet = player.petId ? petsMeta.find(p => p.id === player.petId) : null;
  
  // Pick a message based on priority state
  const pickMessage = React.useCallback(() => {
    setActiveDuo(null);
    setLineIdx(0);

    let pool = DIALOGUE_POOL.idle;
    const isLowHp = player.hp < (player.maxHp * 0.4);
    
    // 30% chance for a Duo chat if pet exists
    if (currentPet && Math.random() < 0.3) {
      const duo = DUO_DIALOGUE[Math.floor(Math.random() * DUO_DIALOGUE.length)];
      setActiveDuo(duo);
      setFullMsg(duo[0]);
    } else {
      if (penaltyRemaining > 0) pool = DIALOGUE_POOL.penalized;
      else if (isLowHp) pool = DIALOGUE_POOL.lowHp;
      else if (player.abilityPoints > 0) pool = DIALOGUE_POOL.hasAp;
      else {
        pool = Math.random() > 0.5 ? DIALOGUE_POOL.tips : DIALOGUE_POOL.idle;
      }
      setFullMsg(pool[Math.floor(Math.random() * pool.length)]);
    }
    setDisplayedMsg(""); 
  }, [player.hp, player.abilityPoints, penaltyRemaining, currentPet]);

  // Handle Typewriter and Duo Cycling
  React.useEffect(() => {
    if (displayedMsg.length < fullMsg.length) {
      const timeout = setTimeout(() => {
        setDisplayedMsg(fullMsg.slice(0, displayedMsg.length + 1));
      }, 30);
      return () => clearTimeout(timeout);
    } else if (activeDuo && lineIdx < activeDuo.length - 1) {
      // If it's a duo chat, wait 2s after first line then show next
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
  const isHunterTalking = displayedMsg.startsWith("H:");
  const cleanDisplayMsg = displayedMsg.replace(/^(H:|P:)\s*/, "");

  return (
    <div className="col-span-full flex items-center gap-4 bg-slate-900/40 p-4 border-2 border-slate-800 rounded-2xl mb-2 relative overflow-hidden group cursor-pointer" onClick={pickMessage}>
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      
      {/* Duo Avatars */}
      <div className="relative flex -space-x-4">
        {/* Main Avatar */}
        <div className={`w-20 h-24 border-[3px] border-black rounded-xl overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] bg-slate-800 ring-2 ring-cyan-500/20 relative z-10 transition-all ${isHunterTalking ? 'scale-105 ring-cyan-400' : 'opacity-80 scale-95'}`}>
          {player.avatar ? (
            <AvatarMedia num={player.avatar} animated={!lowPerfMode} className="w-full h-full object-cover object-top" />
          ) : (
            <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.name}`} className="w-full h-full object-cover" />
          )}
          <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black text-[8px] font-black px-1 border-2 border-black uppercase italic z-20">
            L{player.level}
          </div>
        </div>

        {/* Pet Avatar (If equipped) */}
        {currentPet && (
          <div className={`w-14 h-18 border-[3px] border-black rounded-xl overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] bg-amber-500 ring-2 ring-amber-500/20 relative z-20 mt-auto transition-all ${isPetTalking ? 'scale-110 ring-amber-400 -translate-y-2' : 'opacity-80'}`}>
            <img 
              src={`/assets/pets/genesis-pets/Genesis Pets (${currentPet.id}).jpg`}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + currentPet.name; }}
            />
            <div className="absolute -top-1 -left-1 bg-emerald-500 text-white text-[6px] font-black px-1 border border-black uppercase">
              BUDDY
            </div>
          </div>
        )}
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 relative">
        <div className={`bg-white border-[3px] border-black p-3 shadow-[6px_6px_0_rgba(0,0,0,1)] relative transform min-h-[70px] flex items-center transition-all ${isPetTalking ? 'rotate-1' : '-rotate-1'}`}>
          <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l-[3px] border-b-[3px] border-black transform rotate-45" />
          
          <p className="text-[11px] font-black text-black uppercase italic leading-tight tracking-tight">
            <span className={isPetTalking ? 'text-amber-500' : 'text-cyan-600'}>
              {isPetTalking ? '◢BUDDY: ' : isHunterTalking ? '◢HUNTER: ' : '◢'}
            </span>
            {cleanDisplayMsg}
            <span className="w-1.5 h-3 bg-cyan-500 inline-block ml-1 animate-pulse" />
          </p>
        </div>
        <div className="mt-2 flex gap-3 opacity-40">
           <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[7px] font-black text-white uppercase italic tracking-widest">Neural Link: {isPetTalking ? 'Pet Priority' : 'Synced'}</span>
           </div>
           {currentPet && <span className="text-[7px] font-black text-amber-500 uppercase italic tracking-widest leading-none bg-amber-500/10 px-1">{currentPet.name} Linked</span>}
        </div>
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
      title: "Hunter Hub",
      npc: 1,
      visualType: 'hub',
      text: "This is your Hunter Hub — your command center. From here you can access every module in the Hunt Crystle world. Your character info is displayed at the top.",
      hint: "Tip: Tap the character card to cycle through NPC dialogue."
    },
    {
      title: "Module Navigation",
      npc: 11,
      visualType: 'nav',
      text: "Each tile takes you to a different system — Battle Hub, Forge, Market, Tavern, PvP, and more. Explore them all to grow your Hunter efficiently.",
      hint: "Strategy: Start with the Battle Hub to earn GX Tokens and XP!"
    },
    {
      title: "Battle Hub Entry",
      npc: 17,
      visualType: 'dungeon',
      text: "Tap the Battle Hub tile to access your deployment zones. Select Dungeons, Boss Rooms, or PvP to begin your operations. Be careful — defeat results in a penalty!",
      hint: "Warning: If defeated, you must wait out a penalty timer."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_menu_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  const startDungeon = () => {
    setView('dungeon_menu');
  };

  return (
    <div className="flex-1 p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 relative overflow-y-auto custom-scrollbar bg-slate-950">
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      
      <CharacterDash player={player} penaltyRemaining={penaltyRemaining} petsMeta={PETS_METADATA} lowPerfMode={lowPerfMode} />

      <NavBtn 
        onClick={startDungeon} 
        icon={isPenalized ? <Clock className="animate-pulse" /> : <Swords />} 
        title="Battle Hub" 
        sub={isPenalized ? `Lockdown: ${penaltyRemaining}s` : "Enter Dungeon"} 
        color={isPenalized ? "bg-slate-800 grayscale" : "bg-red-600"} 
        backdrop="/assets/monsters/Void Sector 7/Void Wraith.jpg"
      />
      <NavBtn onClick={() => setView('tavern')} icon={<Beer />} title="Tavern" sub="Hire Mates" color="bg-amber-700" backdrop="/assets/monsters/Rust Canyon/Canyon Flyer 1-1.jpg" />
      <NavBtn onClick={() => setView('attributes')} icon={<Activity />} title="Attributes" sub="Stats" color="bg-orange-600" backdrop="/assets/monsters/Rust Canyon/Iron Pet 2-2.jpg" />
      <NavBtn onClick={() => setView('gear')} icon={<Zap />} title="Gear" sub="Tactical" color="bg-cyan-700" backdrop="/assets/monsters/Rust Canyon/Oil Swimmer 3-1.jpg" />
      <NavBtn onClick={() => setView('inventory')} icon={<Package />} title="Bag" sub="Inventory" color="bg-emerald-600" backdrop="/assets/monsters/Rust Canyon/Scrap Bota 1.jpg" />
      <NavBtn onClick={() => setView('shop')} icon={<ShoppingBag />} title="Shop" sub="Items" color="bg-slate-700" backdrop="/assets/monsters/Rust Canyon/Rust Cat 3-2.jpg" />
      <NavBtn onClick={() => setView('market')} icon={<Tag />} title="Market" sub="P2P Trade" color="bg-amber-600" backdrop="/assets/monsters/Rust Canyon/Canyon Flyer 2-3.jpg" />
      <NavBtn onClick={() => setView('forge')} icon={<Hammer />} title="Forge" sub="Relics" color="bg-amber-600" backdrop="/assets/monsters/Rust Canyon/Iron Pet 0-0.jpg" />
      <NavBtn onClick={() => setView('database')} icon={<Book />} title="Archives" sub="Database" color="bg-blue-600" backdrop="/assets/monsters/Rust Canyon/Oil Swimmer 1-0.jpg" />
      <NavBtn onClick={() => setView('leaderboard')} icon={<Globe />} title="Ranking" sub="Global" color="bg-purple-600" backdrop="/assets/monsters/Rust Canyon/Scrap Bota 2.jpg" />
      <NavBtn onClick={() => setView('dragons_ground')} icon={<Trees />} title="Dragons Ground" sub="Sacred Ground" color="bg-emerald-700" backdrop="/assets/monsters/Tectonic Ridge/Quake Golem.jpg" />
      <NavBtn onClick={() => setView('laboratory')} icon={<FlaskConical />} title="Xenon Lab" sub="Consumables" color="bg-emerald-900" backdrop="/assets/monsters/Inferno Crater/Lava Lurker.jpg" />
      <NavBtn 
        onClick={() => setView('pets')} 
        icon={<Sparkles />} 
        title="Crystle Pets" 
        sub="Web3" 
        color="bg-cyan-900 border-cyan-400/30" 
        backdrop="/assets/monsters/Neon Slums/Ember Drake.jpg"
      />
      <NavBtn 
        onClick={() => setView('manual')} 
        icon={<BookOpen />} 
        title="Manual" 
        sub="How to Play" 
        color="bg-cyan-600 border-cyan-400/50" 
        backdrop="/assets/monsters/Void Sector 7/Rift Lurker.jpg"
      />
      <NavBtn 
        onClick={() => setView('devlog')} 
        icon={<div className="relative"><Radio /><div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div></div>} 
        title="DEVLOG" 
        sub="Dev Updates" 
        color="bg-purple-900 border-purple-500/50" 
        backdrop="/assets/monsters/Neon Slums/Ember Drake.jpg"
      />
      {isAdmin && (
        <NavBtn 
          onClick={() => setView('admin')} 
          icon={<ShieldAlert />} 
          title="Admin Panel" 
          sub="Crystle Access" 
          color="bg-red-600 border-red-500" 
          backdrop="/assets/monsters/Void Sector 7/Null Stalker.jpg"
        />
      )}

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            <div className="absolute inset-x-0 top-0 bottom-0 bg-emerald-900 rounded-3xl transform translate-x-1.5 translate-y-1.5 mt-1 mb-1 pointer-events-none"></div>
            <div className="relative bg-slate-900 border-[3px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-emerald-500 py-2 border-b-[3px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl font-black text-black text-center uppercase tracking-tighter italic">{tutorialSteps[tutorialStep].title}</h2>
                <div className="absolute -bottom-1.5 right-2 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] transform rotate-3 border-2 border-white leading-none">Step {tutorialStep + 1} / {tutorialSteps.length}</div>
              </div>

              {/* NPC & Visual */}
              <div className="py-3 relative flex justify-center items-center gap-3 w-full z-10">
                <div className="w-16 h-16 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0">
                  <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-x-0 bottom-0 bg-emerald-500 text-[6px] font-black text-black text-center py-0.5 uppercase italic">COMMANDER</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                  <div className="w-[1px] h-3 bg-gradient-to-b from-emerald-400 to-transparent" />
                </div>
                <div className="w-16 h-16 rounded-xl border-[3px] border-black bg-slate-950 flex items-center justify-center shrink-0">
                  {tutorialSteps[tutorialStep].visualType === 'hub' && <Globe className="text-emerald-400 animate-pulse" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'nav' && <MapIcon className="text-cyan-400 animate-bounce" size={36} />}
                  {tutorialSteps[tutorialStep].visualType === 'dungeon' && <Swords className="text-red-400 animate-pulse" size={36} />}
                </div>
              </div>

              {/* Dialogue */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col">
                <div className="bg-white text-black p-3 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <div className="absolute -top-3 -left-1 bg-emerald-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic">Incoming Transmission</div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase leading-[1.3] tracking-tight italic">"{tutorialSteps[tutorialStep].text}"</p>
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>
                <div className="bg-black/60 p-1.5 rounded-lg border border-emerald-500/30 mb-3">
                  <p className="text-[8px] font-black text-emerald-400 uppercase italic tracking-widest text-center">⚡ {tutorialSteps[tutorialStep].hint}</p>
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <button onClick={() => setDontShowAgain(!dontShowAgain)} className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                    {dontShowAgain && <Check size={10} className="text-white" />}
                  </button>
                  <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-tighter cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>Don't show this briefing again</span>
                </div>
                <div className="flex gap-2 pb-1">
                  {tutorialStep > 0 && (
                    <button onClick={() => setTutorialStep(prev => prev - 1)} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] italic text-[9px]">BACK</button>
                  )}
                  <button onClick={nextStep} className="flex-[2] bg-emerald-500 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] italic text-[10px] flex items-center justify-center gap-1.5">
                    {tutorialStep === tutorialSteps.length - 1 ? 'ENTER THE HUB' : 'TRANSMIT MORE'}
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
