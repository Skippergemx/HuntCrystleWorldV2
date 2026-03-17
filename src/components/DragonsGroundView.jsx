import React, { useState, useEffect, useRef } from 'react';
import { Trees, Gem, ShoppingBag, ArrowLeft, TrendingUp, Sparkles, Ghost, Hexagon, Play, Pause, Image as ImageIcon, Video, Info, X } from 'lucide-react';

export const DragonsGroundView = React.memo(({ player, syncPlayer, setView, LOOTS, FRUITS, addLog }) => {
  const [gemx, setGemx] = useState(player.gemx || { level: 1, crystalsFed: 0 });
  const [dragonStats, setDragonStats] = useState(player.dragon || { level: 1, fruitsFed: 0 });
  const [fruits, setFruits] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [message, setMessage] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
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
    'gemx (1).gif',
    'gemx (2).gif',
    'gemx (3).gif',
    'gemx (4).gif',
    'gemx (5).gif'
  ];

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

      setGemx({ level: newLevel, crystalsFed: newCrystalsFed });
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

      setDragonStats({ level: newLevel, fruitsFed: newFruitsFed });
      syncPlayer({ inventory: newInventory, dragon: { level: newLevel, fruitsFed: newFruitsFed } });
    }
  };

  // Spawn and Move logic
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Spawn monsters (Cap at 15 for performance)
      if (monsters.length < Math.min(15, gemx.level * 3)) {
        if (Math.random() < 0.4) {
          const spawnSide = Math.floor(Math.random() * 4);
          let x, y;
          if (spawnSide === 0) { x = -10; y = Math.random() * 100; }
          else if (spawnSide === 1) { x = 110; y = Math.random() * 100; }
          else if (spawnSide === 2) { x = Math.random() * 100; y = -10; }
          else { x = Math.random() * 100; y = 110; }

          const mProto = MONSTER_POOL[Math.floor(Math.random() * MONSTER_POOL.length)];
          setMonsters(prev => [...prev, {
            id: 'monster_' + Date.now() + Math.random(),
            icon: mProto.icon,
            name: mProto.name,
            x, y,
            targetX: 10 + Math.random() * 80,
            targetY: 10 + Math.random() * 80,
            speed: 0.3 + Math.random() * 0.7
          }]);
        }
      }

      // 2. Move monsters and drop fruits
      setMonsters(prev => {
        return prev.map(m => {
          const dx = m.targetX - m.x;
          const dy = m.targetY - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 2) {
            // Drop fruit! (Increased frequency as requested)
            if (Math.random() < 0.3) {
              // Rarity-based weighted drop logic
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
  }, [monsters, gemx.level, dragonStats.level, FRUITS]);

  const collectFruit = (fruit) => {
    setFruits(prev => prev.filter(f => f.id !== fruit.id));
    
    syncPlayer({
      inventory: [...(player.inventory || []), fruit.data]
    });

    setMessage({ type: 'success', text: `Collected ${fruit.data.icon} ${fruit.data.name}!` });
  };

  const selectGemxAvatar = (avatar) => {
    syncPlayer({ gemxAvatar: avatar });
    addLog(`✨ GEMX APPEARANCE: Changed to ${avatar.split('.')[0]}`);
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
      {/* Sanctuary Guide Modal */}
      {showInfo && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-slate-900 border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)] rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-emerald-600 p-4 border-b-4 border-black flex justify-between items-center">
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                <Sparkles size={20} /> Sanctuary Guide
              </h2>
              <button 
                onClick={() => setShowInfo(false)}
                className="p-1 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              <section className="space-y-2">
                <h3 className="text-emerald-400 font-black uppercase text-xs tracking-widest italic">What is Dragons Ground?</h3>
                <p className="text-slate-300 text-xs leading-relaxed font-medium">
                  The Dragons Ground is a sacred sanctuary where hunters sync their energy with the <span className="text-cyan-400 font-bold">GEMX Sentinel</span> and nurture the <span className="text-amber-400 font-bold">Great Drake</span>. It is a place of passive growth and immense stat boosts.
                </p>
              </section>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-black uppercase text-[10px]">
                    <Gem size={14} /> The GEMX Sentinel
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Feed <span className="text-white">Crystle Shards</span> to GEMX to increase its Sentinel Level. Higher levels attract more monsters to the sanctuary and unlock new Sentinel appearances.
                  </p>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-black uppercase text-[10px]">
                    <ShoppingBag size={14} /> The Great Drake
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Level up the Dragon using <span className="text-white">Mystic Fruits</span>. Every Dragon Level provides a permanent <span className="text-emerald-400 font-bold">+5 bonus to ALL stats</span> (STR, AGI, DEX).
                  </p>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-black uppercase text-[10px]">
                    <Ghost size={14} /> Wild Encounters
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Wild monsters are attracted to the sanctuary based on GEMX's level (3 monsters per level). These monsters roam the Wild Encounter Zone and <span className="text-white">drop Mystic Fruits (80% rate)</span> as they travel. Click the fruits to harvest them!
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setShowInfo(false)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase py-3 rounded-xl border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all italic"
                >
                  Got it, Hunter!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-slate-900/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('menu')} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <ArrowLeft className="text-white" size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">Dragons Ground</h1>
            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Sacred Sanctuary</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowInfo(true)}
            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full border border-emerald-500/30 text-emerald-400 transition-all flex items-center gap-2 group"
          >
            <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Info</span>
          </button>
          <div className="bg-black/60 border-2 border-emerald-500/50 px-3 py-1 rounded-lg flex items-center gap-2">
            <Gem size={14} className="text-cyan-400" />
            <div>
              <p className="text-[7px] font-black text-slate-500 uppercase">Crystle Shards</p>
              <p className="text-xs font-black text-white">{crystalsInInventory}</p>
            </div>
          </div>
          <div className="bg-black/60 border-2 border-amber-500/50 px-3 py-1 rounded-lg flex items-center gap-2">
            <ShoppingBag size={14} className="text-amber-400" />
            <div>
              <p className="text-[7px] font-black text-slate-500 uppercase">Dragon Fruits</p>
              <p className="text-xs font-black text-white">{fruitsInInventory}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Functional Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Section: Management Headers (Streamlined) */}
        <div className="flex-none p-2 md:p-3 grid grid-cols-2 gap-2 md:gap-4 bg-emerald-950/40 border-b-2 border-black z-20 relative">
            {/* HUD Messages */}
            {message && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 animate-in slide-in-from-top-2 fade-in duration-300 pointer-events-none w-max">
                    <div className={`px-4 py-1.5 rounded-lg border-2 font-black uppercase italic text-[10px] shadow-xl backdrop-blur-md ${
                        message.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400' : 
                        message.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-100' :
                        'bg-blue-950/90 border-blue-500 text-blue-100'
                    }`}>
                        {message.text}
                    </div>
                </div>
            )}

            {/* Gemx Compact HUD */}
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
                        <h3 className="text-[10px] font-black text-cyan-400 italic uppercase">Gemx Sntnl</h3>
                        <span className="text-[8px] font-black text-white bg-cyan-600 px-1 rounded">LVL {gemx.level}</span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full border border-cyan-500/20 overflow-hidden">
                        <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${(gemx.crystalsFed / gemxNextLevelRequirement) * 100}%` }}></div>
                    </div>
                    <div className="flex gap-1 mt-1.5 overflow-x-auto py-0.5 no-scrollbar">
                        {GEMX_AVATARS.map(avatar => (
                            <button key={avatar} onClick={() => selectGemxAvatar(avatar)} className={`w-5 h-5 rounded border overflow-hidden shrink-0 ${player.gemxAvatar === avatar ? 'border-cyan-400' : 'border-black/50'}`}>
                                <img src={`/assets/dragonsground/gemx/${avatar}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dragon Compact HUD */}
            <div className="bg-black/40 border-2 border-amber-500/30 rounded-xl p-2 flex items-center gap-3">
                <div className="relative group cursor-pointer shrink-0" onClick={feedDragon}>
                    <div className="absolute inset-0 bg-amber-400 blur-xl opacity-30 animate-pulse"></div>
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 border-black overflow-hidden relative shadow-lg bg-slate-900">
                        {player.dragonAnimationEnabled ? (
                            <video autoPlay loop muted playsInline className="w-full h-full object-cover" poster="/assets/dragonsground/dragons/DragonAvatar (1).jpg">
                                <source src="/assets/dragonsground/dragons/DragonAvatar (1) video.mp4" type="video/mp4" />
                            </video>
                        ) : (
                            <img src="/assets/dragonsground/dragons/DragonAvatar (1).jpg" className="w-full h-full object-cover" alt="Dragon" />
                        )}
                        <button onClick={(e) => { e.stopPropagation(); toggleDragonAnimation(); }} className="absolute bottom-0 right-0 p-0.5 bg-black/60 text-white"><Play size={6} /></button>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1">
                        <h3 className="text-[10px] font-black text-amber-400 italic uppercase">Great Drake</h3>
                        <span className="text-[8px] font-black text-white bg-amber-600 px-1 rounded">LVL {dragonStats.level}</span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full border border-amber-500/20 overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(dragonStats.fruitsFed / dragonNextLevelRequirement) * 100}%` }}></div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                        <p className="text-[8px] font-black text-emerald-400">+{dragonStats.level * 5} ALL STATS</p>
                        <ShoppingBag size={10} className="text-amber-500 opacity-50" />
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Section: Roaming Ground (Massively Expanded) */}
        <div className="flex-[8] relative bg-[url('https://www.transparenttextures.com/patterns/grass.png')] bg-emerald-900 border-t-4 border-black shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            {/* Label for the ground */}
            <div className="absolute top-2 left-4 z-10">
                <p className="text-[10px] font-black text-emerald-300 opacity-50 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Trees size={12} /> Wild Encounter Zone
                </p>
            </div>

            {/* Roaming Entities Area */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Monsters */}
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
                                    onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + m.name; }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Fruits (Interactive) */}
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

      {/* Footer Instructions (Compact) */}
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
