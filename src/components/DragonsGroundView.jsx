import React, { useState, useEffect, useRef } from 'react';
import { Trees, Gem, ShoppingBag, ArrowLeft, TrendingUp, Sparkles, Ghost, Hexagon, Play, Pause, Image as ImageIcon, Video, Info, X, Zap, Clock, HelpCircle } from 'lucide-react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const DragonsGroundView = React.memo(() => {
  const { player, syncPlayer, adventure, gameLoop, FRUITS, addLog, actions, openGuide } = useGame();
  const { setView } = adventure;
  const { dragonTimeLeft } = gameLoop;
  const { summonDragon } = actions;

  // Use player record directly as source of truth to prevent sync bugs
  const gemx = player.gemx || { level: 1, crystalsFed: 0 };
  const dragonStats = player.dragon || { level: 1, fruitsFed: 0 };

  const [fruits, setFruits] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [message, setMessage] = useState(null);
  const groundRef = useRef(null);

  const MONSTER_POOL = [
    { name: 'Gunk Dragon', icon: 'Gunk Dragon' },
    { name: 'Cinder Sprout', icon: 'Cinder Sprout' },
    { name: 'Azure Glider', icon: 'Azure Glider' },
    { name: 'Void Stalker', icon: 'Void Stalker' },
    { name: 'Sky Razer', icon: 'Sky Razer' }
  ];

  const crystalsInInventory = player.inventory?.filter(i => i.id === 'crystle_shard').length || 0;
  const fruitsInInventory = player.inventory?.filter(i => i.type === 'Fruit').length || 0;

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

  const feedGem = () => {
    if (crystalsInInventory <= 0) {
      setMessage({ type: 'error', text: 'You need Crystle Shards to feed GEMX!' });
      return;
    }

    const newInventory = [...(player.inventory || [])];
    const index = newInventory.findIndex(i => i.id === 'crystle_shard');
    if (index !== -1) {
      newInventory.splice(index, 1);

      let newCrystalsFed = gemx.crystalsFed + 1;
      let newLevel = gemx.level;

      if (newCrystalsFed >= gemxNextLevelRequirement) {
        newLevel += 1;
        newCrystalsFed = 0;
        setMessage({ type: 'success', text: `GEMX reached Level ${newLevel}!` });
        addLog(`🌟 GEMX ASCENSION: Reached Level ${newLevel}!`);
      } else {
        setMessage({ type: 'info', text: 'GEMX absorbed the crystal energy.' });
      }

      syncPlayer({ inventory: newInventory, gemx: { level: newLevel, crystalsFed: newCrystalsFed } });
    }
  };

  const feedDragon = () => {
    const dragonFruit = player.inventory?.find(i => i.type === 'Fruit');
    if (!dragonFruit) {
      setMessage({ type: 'error', text: 'You need Dragon Fruits to feed the Dragon!' });
      return;
    }

    const newInventory = [...(player.inventory || [])];
    const index = newInventory.findIndex(i => i === dragonFruit);
    if (index !== -1) {
      newInventory.splice(index, 1);

      let newFruitsFed = dragonStats.fruitsFed + (dragonFruit.exp || 1);
      let newLevel = dragonStats.level;

      if (newFruitsFed >= dragonNextLevelRequirement) {
        newLevel += 1;
        newFruitsFed = 0;
        setMessage({ type: 'success', text: `Dragon reached Level ${newLevel}!` });
        addLog(`🐉 DRAGON EVOLUTION: Reached Level ${newLevel}!`);
      } else {
        setMessage({ type: 'info', text: `Dragon enjoyed the ${dragonFruit.name}.` });
      }

      syncPlayer({ inventory: newInventory, dragon: { ...dragonStats, level: newLevel, fruitsFed: newFruitsFed } });
    }
  };

  // Spawn and Move logic (Dependency-free interval for smooth roaming)
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Spawn monsters (Cap at 15 for performance)
      setMonsters(prev => {
        if (prev.length < Math.min(15, gemx.level * 3)) {
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
              icon: mProto.icon,
              name: mProto.name,
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
              setFruits(f => [...f, {
                id: 'fruit_' + Date.now() + Math.random(),
                data: randomFruit,
                x: m.x,
                y: m.y
              }]);
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
  }, [gemx.level, FRUITS]);

  const collectFruit = (fruit) => {
    setFruits(prev => prev.filter(f => f.id !== fruit.id));
    syncPlayer({ inventory: [...(player.inventory || []), fruit.data] });
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

  // Auto-hide messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="flex-1 flex flex-col h-full bg-emerald-950/40 relative">
      <div className="p-4 z-30">
        <Header 
          title="Dragons Ground" 
          onClose={() => setView('menu')} 
          onHelp={() => openGuide('menu')}
        />
        <div className="flex items-center gap-2 mt-2">
          <div className="bg-black/60 border-2 border-emerald-500/50 px-3 py-1 rounded-lg flex items-center gap-2 shadow-lg">
            <Gem size={14} className="text-cyan-400" />
            <div>
              <p className="text-[7px] font-black text-slate-500 uppercase">Crystle Shards</p>
              <p className="text-xs font-black text-white">{crystalsInInventory}</p>
            </div>
          </div>
          <div className="bg-black/60 border-2 border-amber-500/50 px-3 py-1 rounded-lg flex items-center gap-2 shadow-lg">
            <ShoppingBag size={14} className="text-amber-400" />
            <div>
              <p className="text-[7px] font-black text-slate-500 uppercase">Dragon Fruits</p>
              <p className="text-xs font-black text-white">{fruitsInInventory}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-none p-2 md:p-3 grid grid-cols-2 gap-2 md:gap-4 bg-emerald-950/40 border-b-2 border-black z-20 relative">
          {message && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 animate-in slide-in-from-top-2 fade-in duration-300 pointer-events-none w-max">
              <div className={`px-4 py-1.5 rounded-lg border-2 font-black uppercase italic text-[10px] shadow-xl backdrop-blur-md ${message.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400' :
                message.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-100' :
                  'bg-blue-950/90 border-blue-500 text-blue-100'
                }`}>
                {message.text}
              </div>
            </div>
          )}

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
                <div className={`h-full bg-${activeGemx.color}-500 transition-all duration-500`} style={{ width: `${(gemx.crystalsFed / gemxNextLevelRequirement) * 100}%` }}></div>
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
                <div className={`h-full bg-${activeGemx.color}-500 transition-all duration-500`} style={{ width: `${(dragonStats.fruitsFed / dragonNextLevelRequirement) * 100}%` }}></div>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className={`text-[8px] font-black text-${activeGemx.color}-400`}>+{dragonStats.level * 5} ALL STATS</p>
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

        <div className="flex-[8] relative border-t-4 border-black shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] overflow-x-hidden overflow-y-auto custom-scrollbar bg-emerald-950 flex flex-col items-center">
          <div className="relative w-full max-w-[540px] aspect-[9/16] flex-shrink-0 overflow-hidden shadow-2xl border-x-4 border-black bg-emerald-900 mx-auto">
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {player.avatarAnimated !== false ? (
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                  poster="/assets/dragonsground/ground/DragonField (1).jpg"
                >
                  <source src="/assets/dragonsground/ground/DragonField (1) video.mp4" type="video/mp4" />
                </video>
              ) : (
                <div 
                  className="w-full h-full"
                  style={{ 
                    backgroundImage: "url('/assets/dragonsground/ground/DragonField (1).jpg')",
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat'
                  }}
                ></div>
              )}
            </div>

            <div className="absolute top-4 left-6 z-10 bg-black/60 px-4 py-2 rounded-lg border border-emerald-500/30 backdrop-blur-sm shadow-md">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Trees size={14} /> Sacred Wild Encounter Zone
              </p>
            </div>

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
                      src={`/assets/monsters/Neon Slums/${m.name}.jpg`}
                      alt={m.name}
                      className="w-full h-full object-cover rounded-full opacity-80"
                      onError={(e) => {
                        if (e.target.src.endsWith('.jpg')) e.target.src = `/assets/monsters/Neon Slums/${m.name}.png`;
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
                onClick={() => collectFruit(f)}
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
    </div>
  );
});
