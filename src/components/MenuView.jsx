import React from 'react';
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
  Radio
} from 'lucide-react';
import { NavBtn, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';

const SHOUT_POOLS = {
  dungeon: ["BAM!", "SLA-A-AY!", "FIGHT!", "KRA-KOW!", "DIVE!", "CLASH!", "POW!"],
  tavern: ["ALE!", "REST!", "HEAL!", "HIRE!", "CHILL!"],
  attributes: ["BUFF!", "GROW!", "STR!", "META!", "UP!"],
  gear: ["PRO!", "LOAD!", "GEAR!", "MOD!", "ZAP!"],
  inventory: ["LOOT!", "BAG!", "BOX!", "FIND!", "FULL!"],
  shop: ["BUY!", "SALE!", "DEAL!", "NEW!", "SAVE!"],
  market: ["TRADE!", "BID!", "P2P!", "CRY-X!", "SELL!"],
  forge: ["SMELT!", "CRAFT!", "HOT!", "ELITE!", "RELIC!"],
  database: ["DATA!", "LORE!", "INFO!", "SCAN!", "READ!"],
  leaderboard: ["TOP!", "RANK #1", "MVP!", "KING!", "FAME!"],
  dragon: ["WILD!", "SOUL!", "LINK!", "GROW!", "TAME!"],
  lab: ["BREW!", "CHEM!", "MIXT!", "EXP!", "ZAP!"],
  boss: ["RAID!", "ELITE!", "DROP!", "KILL!", "DANGER!"],
  guild: ["WAR!", "GUILD!", "RAID!", "WIN!", "GLORY!"],
  pvp: ["DUEL!", "PWN!", "REMATCH!", "GG!", "WIN!"],
  pets: ["TAME!", "BUDDY!", "HATCH!", "CUTE!", "LINK!"],
  manual: ["LEARN!", "HELP!", "WIKI!", "TIPS!", "GUIDE!"],
  devlog: ["NEW!", "FIX!", "PATCH!", "LOG!", "WIP!"]
};

const MenuShout = ({ pool = SHOUT_POOLS.dungeon, color = "bg-yellow-400" }) => {
  const [shout, setShout] = React.useState(pool[0]);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const cycle = setInterval(() => {
      setShout(pool[Math.floor(Math.random() * pool.length)]);
      setVisible(true);
      setTimeout(() => setVisible(false), 1800);
    }, 4500 + Math.random() * 3000); 
    return () => clearInterval(cycle);
  }, [pool]);

  if (!visible) return null;

  return (
    <div className="absolute -top-6 -right-6 z-[100] pointer-events-none animate-kapow">
      <div className={`${color} border-[3px] border-black px-4 py-2 shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-12 relative scale-110`}>
        <span className="text-base font-black text-black italic uppercase tracking-tighter whitespace-nowrap">
          {shout}
        </span>
        <div className={`absolute -bottom-2 left-1/4 w-4 h-4 ${color} border-r-[3px] border-b-[3px] border-black transform rotate-45`} />
      </div>
    </div>
  );
};

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

const CharacterDash = ({ player, penaltyRemaining, petsMeta }) => {
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
            <AvatarMedia num={player.avatar} animated={player.avatarAnimated} className="w-full h-full object-cover object-top" />
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
        <div className={`bg-white border-[3px] border-black p-2 shadow-[6px_6px_0_rgba(0,0,0,1)] relative transform min-h-[50px] flex items-center transition-all ${isPetTalking ? 'rotate-1' : '-rotate-1'}`}>
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
  const { adventure, gameLoop, syncPlayer, openGuide, user, player, PETS_METADATA } = useGame();
  const { setView } = adventure;
  const { penaltyRemaining, autoTimeLeft } = gameLoop;
  const isPenalized = penaltyRemaining > 0;
  const isAdmin = user?.email === 'skippergemx@gmail.com';

  const startDungeon = () => {
    if (!isPenalized) {
      setView('map');
    }
  };

  const startBoss = () => {
    if (!isPenalized) {
      setView('boss');
      if (autoTimeLeft > 0) syncPlayer({ autoUntil: 0 });
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 relative overflow-y-auto custom-scrollbar bg-slate-950">
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      
      <CharacterDash player={player} penaltyRemaining={penaltyRemaining} petsMeta={PETS_METADATA} />

      <NavBtn 
        onClick={startDungeon} 
        icon={isPenalized ? <Clock className="animate-pulse" /> : <MapIcon />} 
        title="Dungeon" 
        sub={isPenalized ? `Wait ${penaltyRemaining}s` : "Battle"} 
        color={isPenalized ? "bg-slate-800 grayscale" : "bg-cyan-600"} 
        disabled={isPenalized} 
        backdrop="/assets/monsters/Rust Canyon/Rust Cat 0-0.jpg"
      >
        <MenuShout />
      </NavBtn>

      <NavBtn onClick={() => setView('tavern')} icon={<Beer />} title="Tavern" sub="Hire Mates" color="bg-amber-700" backdrop="/assets/monsters/Rust Canyon/Canyon Flyer 1-1.jpg" >
        <MenuShout pool={SHOUT_POOLS.tavern} color="bg-orange-400" />
      </NavBtn>

      <NavBtn onClick={() => setView('attributes')} icon={<Activity />} title="Attributes" sub="Stats" color="bg-orange-600" backdrop="/assets/monsters/Rust Canyon/Iron Pet 2-2.jpg" >
        <MenuShout pool={SHOUT_POOLS.attributes} color="bg-cyan-400" />
      </NavBtn>

      <NavBtn onClick={() => setView('gear')} icon={<Zap />} title="Gear" sub="Tactical" color="bg-cyan-700" backdrop="/assets/monsters/Rust Canyon/Oil Swimmer 3-1.jpg" >
        <MenuShout pool={SHOUT_POOLS.gear} color="bg-yellow-400" />
      </NavBtn>

      <NavBtn onClick={() => setView('inventory')} icon={<Package />} title="Bag" sub="Inventory" color="bg-emerald-600" backdrop="/assets/monsters/Rust Canyon/Scrap Bota 1.jpg" >
        <MenuShout pool={SHOUT_POOLS.inventory} color="bg-emerald-400" />
      </NavBtn>

      <NavBtn onClick={() => setView('shop')} icon={<ShoppingBag />} title="Shop" sub="Items" color="bg-slate-700" backdrop="/assets/monsters/Rust Canyon/Rust Cat 3-2.jpg" >
        <MenuShout pool={SHOUT_POOLS.shop} color="bg-indigo-400" />
      </NavBtn>

      <NavBtn onClick={() => setView('market')} icon={<Tag />} title="Market" sub="P2P Trade" color="bg-amber-600" backdrop="/assets/monsters/Rust Canyon/Canyon Flyer 2-3.jpg" >
        <MenuShout pool={SHOUT_POOLS.market} color="bg-amber-400" />
      </NavBtn>

      <NavBtn onClick={() => setView('forge')} icon={<Hammer />} title="Forge" sub="Relics" color="bg-amber-600" backdrop="/assets/monsters/Rust Canyon/Iron Pet 0-0.jpg" >
        <MenuShout pool={SHOUT_POOLS.forge} color="bg-red-500 text-white" />
      </NavBtn>

      <NavBtn onClick={() => setView('database')} icon={<Book />} title="Archives" sub="Database" color="bg-blue-600" backdrop="/assets/monsters/Rust Canyon/Oil Swimmer 1-0.jpg" >
        <MenuShout pool={SHOUT_POOLS.database} color="bg-blue-400" />
      </NavBtn>

      <NavBtn onClick={() => setView('leaderboard')} icon={<Globe />} title="Ranking" sub="Global" color="bg-purple-600" backdrop="/assets/monsters/Rust Canyon/Scrap Bota 2.jpg" >
        <MenuShout pool={SHOUT_POOLS.leaderboard} color="bg-purple-400" />
      </NavBtn>

      <NavBtn onClick={() => setView('dragons_ground')} icon={<Trees />} title="Dragons Ground" sub="Sacred Ground" color="bg-emerald-700" backdrop="/assets/monsters/Tectonic Ridge/Quake Golem.jpg" >
        <MenuShout pool={SHOUT_POOLS.dragon} color="bg-emerald-500" />
      </NavBtn>

      <NavBtn onClick={() => setView('laboratory')} icon={<FlaskConical />} title="Xenon Lab" sub="Consumables" color="bg-emerald-900" backdrop="/assets/monsters/Inferno Crater/Lava Lurker.jpg" >
        <MenuShout pool={SHOUT_POOLS.lab} color="bg-pink-400" />
      </NavBtn>

      <NavBtn 
        onClick={startBoss} 
        icon={<AlertCircle />} 
        title="Boss" 
        sub="High Yield" 
        color="bg-red-700" 
        disabled={isPenalized} 
        backdrop="/assets/monsters/Void Sector 7/Void Wraith.jpg"
      >
        <MenuShout pool={SHOUT_POOLS.boss} color="bg-red-600" />
      </NavBtn>
      <NavBtn 
        onClick={() => setView('syndicate')} 
        icon={<Shield />} 
        title="Guild Vs Guild" 
        sub="Naga War" 
        color="bg-red-900 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]" 
        backdrop="/assets/monsters/Abyssal Trench/Benthic Behemoth.jpg" 
      >
        <MenuShout pool={SHOUT_POOLS.guild} color="bg-red-600" />
      </NavBtn>

      <NavBtn 
        onClick={() => setView('pvp')} 
        icon={<Swords />} 
        title="PVP Arena" 
        sub="Holo-Grid" 
        color="bg-red-900 border-red-500/50" 
        backdrop="/assets/monsters/Gale Empire/Vortex Vanguard.jpg"
      >
        <MenuShout pool={SHOUT_POOLS.pvp} color="bg-red-400" />
      </NavBtn>

      <NavBtn 
        onClick={() => setView('pets')} 
        icon={<Sparkles />} 
        title="Crystle Pets" 
        sub="Web3" 
        color="bg-cyan-900 border-cyan-400/30" 
        backdrop="/assets/monsters/Neon Slums/Ember Drake.jpg"
      >
        <MenuShout pool={SHOUT_POOLS.pets} color="bg-cyan-400" />
      </NavBtn>

      <NavBtn 
        onClick={() => setView('manual')} 
        icon={<BookOpen />} 
        title="Manual" 
        sub="How to Play" 
        color="bg-cyan-600 border-cyan-400/50" 
        backdrop="/assets/monsters/Void Sector 7/Rift Lurker.jpg"
      >
        <MenuShout pool={SHOUT_POOLS.manual} color="bg-cyan-200" />
      </NavBtn>

      <NavBtn 
        onClick={() => setView('devlog')} 
        icon={<div className="relative"><Radio /><div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div></div>} 
        title="DEVLOG" 
        sub="Dev Updates" 
        color="bg-purple-900 border-purple-500/50" 
        backdrop="/assets/monsters/Neon Slums/Ember Drake.jpg"
      >
        <MenuShout pool={SHOUT_POOLS.devlog} color="bg-pink-400" />
      </NavBtn>
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
    </div>
  );
});
