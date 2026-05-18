import React, { useState, useEffect, useRef, useMemo } from 'react';
import { deleteField } from 'firebase/firestore';
import { createPortal } from 'react-dom';
import { Trees, Gem, ShoppingBag, ArrowLeft, TrendingUp, Sparkles, Ghost, Hexagon, Play, Pause, Image as ImageIcon, Video, Info, X, Zap, Clock, HelpCircle, Shield, Swords, Crosshair, Check, AlertTriangle } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { NPCCard } from './NPCCard';
import { useGame } from '../contexts/GameContext';
import { calculateNagaStats } from '../utils/gameLogic';

const MONSTER_POOL = [
  { name: 'Venomhide Drake', folder: 'Neon Slums' },
  { name: 'Bone Dragon', folder: 'Neon Slums' },
  { name: 'Azure Glider', folder: 'Neon Slums' },
  { name: 'Cinder Wyrm', folder: 'Inferno Crater' },
  { name: 'Sky Razer', folder: 'Neon Slums' }
];

const GroundRenderArea = React.memo(({ gemxLevel, FRUITS, onCollectFruit }) => {
  const [monsters, setMonsters] = useState([]);
  const [fruits, setFruits] = useState([]);

  // Spawn and Move logic (Dependency-free interval for smooth roaming)
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Spawn monsters (Scaling capacity per GEMX Level)
      setMonsters(prev => {
        if (prev.length < Math.min(50, gemxLevel * 3)) {
          if (Math.random() < 0.4) {
            const spawnSide = Math.floor(Math.random() * 4);
            let x, y;
            if (spawnSide === 0) { x = -10; y = Math.random() * 100; }
            else if (spawnSide === 1) { x = 110; y = Math.random() * 100; }
            else if (spawnSide === 2) { x = Math.random() * 100; y = -10; }
            else { x = Math.random() * 100; y = 110; }

            const mProto = MONSTER_POOL[Math.floor(Math.random() * MONSTER_POOL.length)];
            return [...prev, {
              id: 'monster_' + Date.now() + Math.random(),
              icon: mProto.name,
              name: mProto.name,
              folder: mProto.folder,
              x, y,
              targetX: 10 + Math.random() * 80,
              targetY: 10 + Math.random() * 80,
              speed: 0.3 + Math.random() * 0.7
            }];
          }
        }
        return prev;
      });

      // 2. Move monsters and drop fruits
      setMonsters(prev => {
        return prev.map(m => {
          const dx = m.targetX - m.x;
          const dy = m.targetY - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 2) {
            // Drop fruit! (Adjusted to 15% drop rate)
            if (Math.random() < 0.15) {
              const rarityWeights = { 'Common': 100, 'Uncommon': 40, 'Rare': 15, 'Epic': 4, 'Legendary': 1 };
              const pool = [];
              FRUITS.forEach(f => {
                const weight = rarityWeights[f.rarity] || 10;
                for (let i = 0; i < weight; i++) pool.push(f);
              });

              const randomFruit = pool[Math.floor(Math.random() * pool.length)];
              setFruits(f => {
                if (f.length >= 30) return f; // Maximum cap of 30 uncollected fruits
                return [...f, {
                  id: 'fruit_' + Date.now() + Math.random(),
                  data: randomFruit,
                  x: m.x,
                  y: m.y
                }];
              });
            }
            // New target (roaming)
            return {
              ...m,
              targetX: 10 + Math.random() * 80,
              targetY: 10 + Math.random() * 80
            };
          }

          return {
            ...m,
            x: m.x + (dx / dist) * m.speed,
            y: m.y + (dy / dist) * m.speed
          };
        });
      });

    }, 1000);

    return () => clearInterval(timer);
  }, [gemxLevel, FRUITS]);

  const handleFruitClick = (fruit) => {
    setFruits(prev => prev.filter(f => f.id !== fruit.id));
    onCollectFruit(fruit);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {monsters.map(m => (
        <div
          key={m.id}
          className="absolute transition-all duration-1000 z-10 w-8 h-8"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        >
          <div className="animate-pulse w-full h-full relative">
            <div className="w-full h-full rounded-full border-[3px] border-black bg-slate-800 shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden transform rotate-2">
              <img
                src={`/assets/monsters/${m.folder || 'Neon Slums'}/${m.name}.jpg`}
                alt={m.name}
                className="w-full h-full object-cover rounded-full opacity-80"
                onError={(e) => {
                  if (e.target.src.endsWith('.jpg')) e.target.src = `/assets/monsters/${m.folder || 'Neon Slums'}/${m.name}.png`;
                  else { e.target.onerror = null; e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + m.name; }
                }}
              />
            </div>
          </div>
        </div>
      ))}

      {fruits.map(f => (
        <button
          key={f.id}
          onClick={() => handleFruitClick(f)}
          className="absolute z-20 text-4xl p-4 -m-4 hover:scale-125 transition-transform active:scale-95 animate-in fade-in zoom-in duration-300 pointer-events-auto"
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-white blur-md opacity-0 group-hover:opacity-40"></div>
            {f.data.icon}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 px-1 py-0.5 rounded border border-white/20 text-[6px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap">
              {f.data.name}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
});

export const DragonsGroundView = React.memo(() => {
  const { player, syncPlayer, adventure, gameLoop, FRUITS, addLog, actions, openGuide } = useGame();
  const { setView } = adventure;
  const { dragonTimeLeft } = gameLoop;
  const { summonDragon } = actions;

  // Use player record directly as source of truth to prevent sync bugs
  const gemx = player.gemx || { level: 1, crystalsFed: 0 };
  const dragonStats = player.dragon || { level: 1, fruitsFed: 0 };

  const [message, setMessage] = useState(null);
  const [showOverburdenModal, setShowOverburdenModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const groundRef = useRef(null);

  // Auto-tutorial trigger
  useEffect(() => {
    const isHidden = localStorage.getItem('hide_dragons_ground_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Welcome, Hunter",
      npc: 1,
      visualType: 'fruit',
      text: "Welcome to the Dragons Ground! This sacred field attracts elusive Crystle Monsters. Every time a Crystle Monster reaches its destination, it has a 15% CHANCE to manifest a Dragon Fruit. Harvest them quickly to begin your journey!",
      hint: "Tip: Collect Rare/Legendary fruits for much faster leveling."
    },
    {
      title: "The GEMX Beacon",
      npc: 4,
      visualType: 'gemx',
      text: "At the center of this field is the GEMX. It acts as a biological beacon that attracts Crystle Monsters and the Dragon/Naga. You can level up your GEMX with Crystle Shards obtained in the Dungeons (Neon Slump). When you happen to collect one, keep your Crystle Shard for your GEMX upgrade! Higher levels attract MORE Crystle Monsters.",
      hint: "Storage: Keep Shards for GEMX Resonance."
    },
    {
      title: "Patience of the Sentinel",
      npc: 2,
      visualType: 'monster',
      text: "Crystle Monsters take time to be attracted to the Dragons Ground. Be patient! You can leave this screen open while you do other work. Note: Fruits ONLY spawn while you are actively on these grounds. Leaving or closing the game stops the harvest cycle.",
      hint: "Note: Stay connected to keep the harvest active."
    },
    {
      title: "Companion Ascension",
      npc: 5,
      visualType: 'dragon',
      text: "Leveling up your Dragon/Naga unlocks a powerful stat boost for your character. To activate these stat boosts, you need to summon the Blessing of your Dragon/Naga by offering a stash of your accumulated GX treasures! Just click the \"Summon\" button whenever you are ready. These boosts are active for 24 hours!",
      hint: "Ritual: Offer GX to activate the Blessing."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_dragons_ground_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };



  const { crystalsInInventory, fruitsInInventory } = useMemo(() => {
    let crystals = 0;
    let fruits = 0;
    Object.values(player.inventory || {}).forEach(i => {
      if (!i) return;
      if (i.id?.startsWith('crystle_shard')) crystals++;
      if (i.type === 'Fruit') fruits++;
    });
    return { crystalsInInventory: crystals, fruitsInInventory: fruits };
  }, [player.inventory]);

  const gemxNextLevelRequirement = gemx.level * 10;
  const dragonNextLevelRequirement = dragonStats.level * 5;

  const GEMX_AVATARS = [
    { name: 'Cosmic gemx (1).gif', element: 'Cosmic', color: 'cyan' },
    { name: 'Earthen gemx (2).gif', element: 'Earthen', color: 'emerald' },
    { name: 'Gale gemx (3).gif', element: 'Gale', color: 'blue' },
    { name: 'Pyro gemx (4).gif', element: 'Pyro', color: 'red' },
    { name: 'Hydro gemx (5).gif', element: 'Hydro', color: 'sky' }
  ];

  const activeGemx = GEMX_AVATARS.find(a => a.name === (player.gemxAvatar || 'Cosmic gemx (1).gif')) || GEMX_AVATARS[0];
  const elementalTheme = activeGemx.element;
  const elementalColor = 
    elementalTheme === 'Pyro' ? 'red-500' :
    elementalTheme === 'Hydro' ? 'blue-400' :
    elementalTheme === 'Gale' ? 'sky-300' :
    elementalTheme === 'Earthen' ? 'emerald-500' : 'cyan-400';

  const nagaStats = calculateNagaStats(player);

  const feedGem = () => {
    if (gemx.level >= 100) {
      setMessage({ type: 'info', text: 'GEMX is at maximum resonance!' });
      return;
    }
    if (crystalsInInventory <= 0) {
      setMessage({ type: 'error', text: 'You need Crystle Shards to feed GEMX!' });
      return;
    }

    const crystalKey = Object.keys(player.inventory || {}).find(key => player.inventory[key]?.id?.startsWith('crystle_shard'));
    if (crystalKey) {
      let newCrystalsFed = gemx.crystalsFed + 1;
      let newLevel = gemx.level;

      if (newCrystalsFed >= gemxNextLevelRequirement) {
        newLevel = Math.min(100, newLevel + 1);
        newCrystalsFed = 0;
        setMessage({ type: 'success', text: `GEMX reached Level ${newLevel}!` });
        addLog(`🌟 GEMX ASCENSION: Reached Level ${newLevel}!`);
      } else {
        setMessage({ type: 'info', text: 'GEMX absorbed the crystal energy.' });
      }

      const updates = { 
        gemx: { ...gemx, level: newLevel, crystalsFed: newCrystalsFed } 
      };
      
      updates[`inventory.${crystalKey}`] = deleteField();
      
      syncPlayer(updates, true);
    }
  };

  const feedDragon = () => {
    if (dragonStats.level >= 100) {
      setMessage({ type: 'info', text: 'The Dragon is at maximum power!' });
      return;
    }
    const dragonFruit = Object.values(player.inventory || {}).find(i => i?.type === 'Fruit');
    if (!dragonFruit) {
      setMessage({ type: 'error', text: 'You need Dragon Fruits to feed the Dragon!' });
      return;
    }

    const fruitKey = Object.keys(player.inventory || {}).find(key => player.inventory[key] === dragonFruit);
    
    let newFruitsFed = dragonStats.fruitsFed + 1;
    let newLevel = dragonStats.level;

    if (newFruitsFed >= dragonNextLevelRequirement) {
      newLevel = Math.min(100, newLevel + 1);
      newFruitsFed = 0;
      setMessage({ type: 'success', text: `Dragon reached Level ${newLevel}!` });
      addLog(`🐉 DRAGON ASCENSION: Reached Level ${newLevel}!`);
    } else {
      setMessage({ type: 'info', text: 'Dragon devoured the fruit!' });
    }

    const updates = { 
      dragon: { ...dragonStats, level: newLevel, fruitsFed: newFruitsFed } 
    };
    
    if (fruitKey) {
      // Use deleteField() for Firestore and ensure it's removed from local state
      updates[`inventory.${fruitKey}`] = deleteField();
    }

    syncPlayer(updates, true);
  };



  const handleCollectFruit = (fruit) => {
    const currentSlots = Object.keys(player?.inventory || {}).length;
    const maxSlots = player?.maxInventorySlots || 50;

    if (currentSlots >= maxSlots) {
      setShowOverburdenModal(true);
      if (playSFX) playSFX(SOUNDS.skillTrigger);
      return;
    }

    const itemId = `${fruit.data.id}_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    syncPlayer({ [`inventory.${itemId}`]: fruit.data });
    setMessage({ type: 'success', text: `Collected ${fruit.data.icon} ${fruit.data.name}!` });
  };

  const selectGemxAvatar = (avatarObj) => {
    syncPlayer({ 
      gemxAvatar: avatarObj.name,
      gemxElement: avatarObj.element 
    });
    addLog(`✨ GEMX RESONANCE: Synced with ${avatarObj.element} energy!`);
  };

  const toggleDragonAnimation = () => {
    syncPlayer({ dragonAnimationEnabled: !player.dragonAnimationEnabled });
  };

  const groundDialogues = useMemo(() => [
    "Dragons Ground — where the bravest (and most reckless) hunters come to grind.",
    "Iron Pets discovered here can be tamed to boost your XP permanently.",
    "The Orchard drop zone yields fruits for Crystle Town requests. Farm it!",
    "Dragon Crystle Shards are your currency here. Collect them every run.",
    "Harder floors drop better loot. Push your depth as far as your build allows.",
    "Watch your HP in the deep floors. A retreat preserves your Tavern contract.",
    "Iron Pet 2-2 is a beast — worth the grind to tame it if you haven't yet.",
    "The Ground never stops spawning. Stay active and the shards will accumulate."
  ], []);

  // Auto-hide messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="flex-1 flex flex-col h-full bg-emerald-950/40 relative">
      {message && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-2 fade-in duration-300 pointer-events-none w-max">
          <div className={`px-4 py-1.5 rounded-lg border-2 font-black uppercase italic text-[10px] shadow-2xl backdrop-blur-md ${message.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400' :
            message.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-100' :
              'bg-blue-950/90 border-blue-500 text-blue-100'
            }`}>
            {message.type === 'success' && '🌟 '}{message.text}
          </div>
        </div>
      )}

      <div className="p-4 z-30 space-y-3">
        <Header 
          title="Dragons Ground" 
          onClose={adventure.goBack} 
          npcNum={14}
          onHelp={() => {
            setTutorialStep(0);
            setShowTutorial(true);
          }}
        />

        <div className="flex items-center gap-3">
          <div className="bg-black/80 border-2 border-emerald-500/50 px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md">
            <Gem size={16} className="text-cyan-400 animate-pulse" />
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Crystle Shards</p>
              <p className="text-sm font-black text-white italic">{crystalsInInventory}</p>
            </div>
          </div>
          <div className="bg-black/80 border-2 border-amber-500/50 px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md">
            <ShoppingBag size={16} className="text-amber-400 animate-bounce" />
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Dragon Fruits</p>
              <p className="text-sm font-black text-white italic">{fruitsInInventory}</p>
            </div>
          </div>
        </div>

        <NPCCard
          citizenNum={14}
          name="DRAGON WARDEN"
          accentColor="bg-red-600"
          textColor="text-red-600"
          glowColor="bg-red-600"
          statusTag="GROUND_SECTOR_ACTIVE"
          statusTag2="DRAGON_SIGNAL_LIVE"
          prefix="◢WARDEN: "
          dialogues={groundDialogues}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-none p-2 md:p-3 grid grid-cols-2 gap-2 md:gap-4 bg-emerald-950/40 border-b-2 border-black z-20 relative">
          <div className="bg-black/40 border-2 border-cyan-500/30 rounded-xl p-2 flex items-center gap-3">
            <div className="relative group cursor-pointer shrink-0" onClick={feedGem}>
              <div className="absolute inset-0 bg-cyan-400 blur-xl opacity-30 animate-pulse"></div>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 border-black overflow-hidden relative shadow-lg bg-slate-900">
                <img
                  src={`/assets/dragonsground/gemx/${player.gemxAvatar || 'gemx (1).gif'}`}
                  className="w-full h-full object-cover"
                  alt="Gemx"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-end mb-1">
                <h3 className={`text-[10px] font-black text-${activeGemx.color}-400 italic uppercase`}>Gemx {activeGemx.element}</h3>
                <span className={`text-[8px] font-black text-white bg-${activeGemx.color}-600 px-1 rounded`}>LVL {gemx.level}</span>
              </div>
              <div className="h-1.5 bg-black rounded-full border border-white/10 overflow-hidden">
                <div className={`h-full bg-${activeGemx.color}-500 transition-all duration-500`} style={{ width: gemx.level >= 100 ? '100%' : `${(gemx.crystalsFed / gemxNextLevelRequirement) * 100}%` }}></div>
              </div>
              <div className="flex gap-1 mt-1.5 overflow-x-auto py-0.5 no-scrollbar">
                {GEMX_AVATARS.map(avatar => (
                  <button key={avatar.name} onClick={() => selectGemxAvatar(avatar)} className={`w-5 h-5 rounded border-2 overflow-hidden shrink-0 transition-all ${player.gemxAvatar === avatar.name ? `border-${avatar.color}-400 scale-110 z-10 shadow-[0_0_8px_rgba(34,211,238,0.5)]` : 'border-black/50 opacity-40 hover:opacity-100'}`}>
                    <img src={`/assets/dragonsground/gemx/${avatar.name}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`bg-black/60 border-2 border-${activeGemx.color}-500/30 rounded-xl p-2 flex items-center gap-3 transition-colors duration-500`}>
            <div className="relative group cursor-pointer shrink-0" onClick={feedDragon}>
              <div className={`absolute inset-0 bg-${activeGemx.color}-400 blur-xl opacity-20 animate-pulse`}></div>
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 border-black overflow-hidden relative shadow-lg bg-slate-900 group-hover:border-${activeGemx.color}-400 transition-colors`}>
                {player.dragonAnimationEnabled ? (
                  <video key={activeGemx.element} autoPlay loop muted playsInline className={`w-full h-full object-cover transition-all duration-1000 ${elementalTheme === 'Pyro' ? 'hue-rotate-[340deg] saturate-200' : elementalTheme === 'Hydro' ? 'hue-rotate-[180deg]' : elementalTheme === 'Earthen' ? 'hue-rotate-[90deg] saturate-150' : elementalTheme === 'Gale' ? 'hue-rotate-[220deg] brightness-125' : ''}`} poster="/assets/dragonsground/dragons/DragonAvatar (1).jpg">
                    <source src="/assets/dragonsground/dragons/DragonAvatar (1) video.mp4" type="video/mp4" />
                  </video>
                ) : (
                  <img src="/assets/dragonsground/dragons/DragonAvatar (1).jpg" className={`w-full h-full object-cover transition-all duration-1000 ${elementalTheme === 'Pyro' ? 'hue-rotate-[340deg] saturate-200' : elementalTheme === 'Hydro' ? 'hue-rotate-[180deg]' : elementalTheme === 'Earthen' ? 'hue-rotate-[90deg] saturate-150' : elementalTheme === 'Gale' ? 'hue-rotate-[220deg] brightness-125' : ''}`} alt="Dragon" />
                )}
                <button onClick={(e) => { e.stopPropagation(); toggleDragonAnimation(); }} className="absolute bottom-0 right-0 p-0.5 bg-black/60 text-white z-10"><Play size={6} /></button>
                <div className={`absolute top-0 right-0 bg-${activeGemx.color}-500 text-[6px] font-black text-white px-1 py-0.5 uppercase tracking-tighter opacity-80 z-10`}>{elementalTheme}</div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-end mb-1">
                <h3 className={`text-[10px] font-black text-${activeGemx.color}-400 italic uppercase`}>{elementalTheme} Drake</h3>
                <span className={`text-[8px] font-black text-white bg-${activeGemx.color}-600 px-1 rounded`}>LVL {dragonStats.level}</span>
              </div>
              <div className="h-1.5 bg-black rounded-full border border-white/10 overflow-hidden">
                <div className={`h-full bg-${activeGemx.color}-500 transition-all duration-500`} style={{ width: dragonStats.level >= 100 ? '100%' : `${(dragonStats.fruitsFed / dragonNextLevelRequirement) * 100}%` }}></div>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className={`text-[8px] font-black text-${activeGemx.color}-400`}>+{dragonStats.level * 15} ALL STATS</p>
                  {dragonTimeLeft > 0 ? (
                    <div className={`flex items-center gap-1 text-[8px] font-black text-white bg-black/40 px-2 py-0.5 rounded border border-${activeGemx.color}-500/30 animate-pulse`}>
                      <Clock size={10} className="text-white" />
                      <span>
                        {Math.floor(dragonTimeLeft / 3600).toString().padStart(2, '0')}:
                        {Math.floor((dragonTimeLeft % 3600) / 60).toString().padStart(2, '0')}:
                        {(dragonTimeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={summonDragon}
                      className={`bg-${activeGemx.color}-600 hover:bg-${activeGemx.color}-500 text-white text-[7px] font-black px-2 py-1 rounded border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all uppercase italic flex items-center gap-1`}
                    >
                      <Zap size={8} /> Summon ({(1000 * dragonStats.level).toLocaleString()} GX)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Naga Combat Stats Panel */}
        <div className="flex-none p-2 bg-emerald-950/80 border-b-2 border-emerald-900/50 relative z-20 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
           <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                 <Shield className={`text-${activeGemx.color}-400`} size={16} />
                 <div>
                    <h4 className="text-[10px] font-black text-white uppercase italic tracking-wider">War Armor</h4>
                    <div className="flex gap-2 text-[10px] font-black">
                       <span className="text-emerald-400">HP {nagaStats.maxHp.toLocaleString()}</span>
                       <span className={`text-${activeGemx.color}-400`}>+ SHIELD {nagaStats.shieldHp.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex flex-col items-center">
                    <Swords className="text-red-400 mb-0.5" size={14} />
                    <span className="text-[9px] font-black text-white">{nagaStats.str.toLocaleString()}</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <Zap className="text-amber-400 mb-0.5" size={14} />
                    <span className="text-[9px] font-black text-white">{nagaStats.agi.toLocaleString()}</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <Crosshair className="text-cyan-400 mb-0.5" size={14} />
                    <span className="text-[9px] font-black text-white">{nagaStats.dex.toLocaleString()}</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex-[8] relative border-t-4 border-black shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] overflow-x-hidden overflow-y-auto custom-scrollbar bg-emerald-950 flex flex-col items-center">
          <div className="relative w-full max-w-[540px] aspect-[9/16] flex-shrink-0 overflow-hidden shadow-2xl border-x-4 border-black bg-emerald-900 mx-auto">
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <div 
                className="w-full h-full"
                style={{ 
                  backgroundImage: "url('/assets/dragonsground/ground/DragonField (1).jpg')",
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat'
                }}
              ></div>
            </div>

            <div className="absolute top-4 left-6 z-10 bg-black/60 px-4 py-2 rounded-lg border border-emerald-500/30 backdrop-blur-sm shadow-md">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Trees size={14} /> Sacred Wild Encounter Zone
              </p>
            </div>

            <GroundRenderArea 
              gemxLevel={gemx.level} 
              FRUITS={FRUITS} 
              onCollectFruit={handleCollectFruit} 
            />
          </div>
        </div>
      </div>

      <div className="p-2 md:p-4 bg-slate-950 border-t border-white/10 flex justify-center gap-4 md:gap-8 z-30">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-cyan-600/20 border border-cyan-500 flex items-center justify-center text-cyan-400 font-black text-xs md:text-base">1</div>
          <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">Feed GEMX</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-amber-600/20 border border-amber-500 flex items-center justify-center text-amber-400 font-black text-xs md:text-base">2</div>
          <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">Level Dragon</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-red-600/20 border border-red-500 flex items-center justify-center text-red-400 font-black text-xs md:text-base">3</div>
          <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-wider">Boost Stats</p>
        </div>
      </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-cyan-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-cyan-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-white text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
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
                   <div className="absolute inset-x-0 bottom-0 bg-cyan-600 text-[6px] font-black text-white text-center py-0.5 uppercase italic">SENTINEL</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-cyan-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'fruit' && (
                     <div className="relative flex items-center justify-center">
                       <div className="text-3xl md:text-5xl animate-bounce drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10">🍒</div>
                       <img 
                         src="/assets/monsters/Rust Canyon/Iron Pet 2-2.jpg" 
                         className="absolute -bottom-1 -right-2 md:-right-3 md:-bottom-2 w-6 h-6 md:w-8 md:h-8 rounded-full border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] object-cover bg-slate-800 z-20" 
                         alt="Monster" 
                       />
                     </div>
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'gemx' && (
                     <div className="relative flex items-center justify-center w-full h-full">
                       <img 
                         src={`/assets/dragonsground/gemx/${player.gemxAvatar || 'gemx (1).gif'}`} 
                         className="w-full h-full object-cover animate-pulse rounded-lg z-10" 
                         alt="Gemx Info" 
                       />
                       <div className="absolute -bottom-1 -right-2 md:-right-3 md:-bottom-2 w-6 h-6 md:w-8 md:h-8 rounded-full border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] bg-slate-800 z-20 flex items-center justify-center">
                         <Gem size={14} className="text-cyan-400 absolute" />
                       </div>
                     </div>
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'monster' && (
                     <div className="relative flex items-center justify-center w-full h-full">
                       <img 
                         src="/assets/monsters/Rust Canyon/Iron Pet 2-2.jpg" 
                         className="w-full h-full object-cover animate-in slide-in-from-right-10 rounded-lg z-10" 
                         alt="Monster Info" 
                       />
                       <div className="absolute -bottom-1 -right-2 md:-right-3 md:-bottom-2 w-6 h-6 md:w-8 md:h-8 rounded-full border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] bg-slate-800 z-20 flex items-center justify-center text-[11px] md:text-sm">
                         🍒
                       </div>
                     </div>
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'dragon' && (
                     <div className="relative flex items-center justify-center w-full h-full">
                       <img 
                         src="/assets/dragonsground/dragons/DragonAvatar (1).jpg" 
                         className={`w-full h-full object-cover contrast-125 rounded-lg z-10 ${elementalTheme === 'Pyro' ? 'hue-rotate-[340deg] saturate-150' : elementalTheme === 'Hydro' ? 'hue-rotate-[180deg]' : elementalTheme === 'Earthen' ? 'hue-rotate-[90deg]' : ''}`} 
                         alt="Dragon Info" 
                       />
                       <div className="absolute -bottom-1 -right-2 md:-right-3 md:-bottom-2 w-6 h-6 md:w-8 md:h-8 rounded-full border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] bg-slate-800 z-20 flex items-center justify-center text-[11px] md:text-sm">
                         🍒
                       </div>
                     </div>
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-cyan-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-amber-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-cyan-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-cyan-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-cyan-500' : 'bg-slate-800'}`}
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
                    className="flex-[2] bg-cyan-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-cyan-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'READY TO HARVEST' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showOverburdenModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* Holographic Red shadow backing */}
            <div className="absolute inset-0 bg-red-600 rounded-3xl transform translate-x-2 translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-[#0d0208] border-[4px] border-black rounded-3xl z-10 p-6 flex flex-col items-center overflow-hidden text-center shadow-2xl">
              {/* Halftone Retro Grid Overlay */}
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-cyber-grid"></div>
              <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-scanline"></div>

              {/* Pulsing Alarm Indicator */}
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-red-500/50 flex items-center justify-center animate-spin-slow mb-4 relative">
                <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping"></div>
                <AlertTriangle className="text-red-500 z-10 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" size={30} />
              </div>

              {/* Warning Title Block */}
              <h2 className="text-xl md:text-2xl font-[1000] text-red-500 uppercase italic tracking-tighter bungee drop-shadow-[3px_3px_0_rgba(0,0,0,1)]">
                SATCHEL OVERBURDENED
              </h2>
              <span className="text-[7px] font-black text-slate-500 bg-red-950/40 border border-red-500/30 px-3 py-1 rounded uppercase tracking-[0.2em] mb-4 block bungee">
                ⚠️ STORAGE EXCEEDED ⚠️
              </span>

              {/* Capacity Status Grid */}
              <div className="w-full bg-black/60 border border-white/5 p-4 rounded-2xl mb-4 text-left">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bungee">Satchel Status</span>
                  <span className="text-xs font-black text-red-400 italic bungee">{Object.keys(player?.inventory || {}).length} / {player?.maxInventorySlots || 50} SLOTS</span>
                </div>
                <div className="h-3 bg-slate-900 rounded-full border-2 border-black overflow-hidden relative shadow-inner">
                  <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse animate-duration-1000" style={{ width: '100%' }}></div>
                </div>
                <p className="text-[9px] text-slate-400 uppercase leading-normal tracking-tight mt-3 text-center bungee italic">
                  Any further fruit harvesting is locked. Dump cargo or trigger a payload capacity upgrade to resume collecting.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={() => {
                    setShowOverburdenModal(false);
                    setView('bag_upgrade');
                  }}
                  className="w-full bg-[var(--neon-lime)] text-black py-3 rounded-xl font-[1000] uppercase tracking-tighter border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all italic text-[10px] flex items-center justify-center gap-2 bungee animate-pulse"
                >
                  <Sparkles size={12} />
                  UPGRADE CAPACITY NOW
                </button>
                <button
                  onClick={() => setShowOverburdenModal(false)}
                  className="w-full bg-slate-900 text-white/70 py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[9px] bungee"
                >
                  DISMISS BRIEFING
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});
