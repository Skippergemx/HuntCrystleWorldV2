import React, { useState, useEffect, useRef } from 'react';
import { Leaf, Gem, ShoppingBag, ArrowLeft, TrendingUp, Sparkles, Ghost, Hexagon } from 'lucide-react';

export const DragonsGroundView = ({ player, syncPlayer, setView, LOOTS, addLog }) => {
  const [gemx, setGemx] = useState(player.gemx || { level: 1, crystalsFed: 0 });
  const [fruits, setFruits] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [dragon, setDragon] = useState(null);
  const [message, setMessage] = useState(null);
  const groundRef = useRef(null);

  const MONSTER_POOL = [
    { name: 'Gunk Dragon', icon: '👻' },
    { name: 'Cinder Sprout', icon: '👾' },
    { name: 'Neon Glider', icon: '👽' },
    { name: 'Void Stalker', icon: '👹' },
    { name: 'Slum Rat', icon: '🐀' }
  ];

  const voidCrystal = LOOTS.find(l => l.id === 'void_crystal');
  const crystalsInInventory = player.inventory?.filter(i => i.id === 'void_crystal').length || 0;

  // Level requirements: level * 10
  const nextLevelRequirement = gemx.level * 10;

  useEffect(() => {
    // Sync gemx to player if it changed
    if (JSON.stringify(player.gemx) !== JSON.stringify(gemx)) {
      syncPlayer({ gemx });
    }
  }, [gemx]);

  const feedGem = () => {
    if (crystalsInInventory <= 0) {
      setMessage({ type: 'error', text: 'You need Void Crystals to feed GEMX!' });
      return;
    }

    // Remove one void crystal from inventory
    const newInventory = [...(player.inventory || [])];
    const index = newInventory.findIndex(i => i.id === 'void_crystal');
    if (index !== -1) {
      newInventory.splice(index, 1);
      
      let newCrystalsFed = gemx.crystalsFed + 1;
      let newLevel = gemx.level;
      
      if (newCrystalsFed >= nextLevelRequirement) {
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

  // Spawn logic
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Manage Dragon
      if (gemx.level >= 1 && !dragon) {
        const dName = gemx.level >= 10 ? 'Ancient Alpha' : 'Ember Drake';
        setDragon({
          id: 'dragon_' + Date.now(),
          type: gemx.level >= 10 ? '🐲' : '🐉',
          name: dName,
          x: 40 + (Math.random() * 20),
          y: 20 + (Math.random() * 20),
          targetX: 50,
          targetY: 50
        });
        addLog(`🐉 DRAGON SIGHTING: ${dName} has arrived at the grounds!`);
      }

      // 2. Spawn monsters based on dragon presence
      if (dragon && monsters.length < Math.min(10, gemx.level + 2)) {
        if (Math.random() < 0.3) {
          const spawnSide = Math.floor(Math.random() * 4);
          let x, y;
          if (spawnSide === 0) { x = -10; y = Math.random() * 100; }
          else if (spawnSide === 1) { x = 110; y = Math.random() * 100; }
          else if (spawnSide === 2) { x = Math.random() * 100; y = -10; }
          else { x = Math.random() * 100; y = 110; }

          const mProto = MONSTER_POOL[Math.floor(Math.random() * MONSTER_POOL.length)];
          setMonsters(prev => [...prev, {
            id: 'monster_' + Date.now(),
            icon: mProto.icon,
            name: mProto.name,
            x, y,
            targetX: 20 + Math.random() * 60,
            targetY: 20 + Math.random() * 60,
            speed: 0.5 + Math.random() * 1
          }]);
        }
      }

      // 3. Move monsters and drop fruits
      setMonsters(prev => {
        const moved = prev.map(m => {
          const dx = m.targetX - m.x;
          const dy = m.targetY - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 2) {
            // Drop fruit!
            if (Math.random() < 0.05) {
              const fruitEmojis = ['🍎', '🍇', '🍓', '🍒', '🍑', '🍋', '🍊', '🍏'];
              setFruits(f => [...f, {
                id: 'fruit_' + Date.now() + Math.random(),
                icon: fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)],
                x: m.x,
                y: m.y
              }]);
            }
            // New target
            return {
              ...m,
              targetX: 20 + Math.random() * 60,
              targetY: 20 + Math.random() * 60
            };
          }

          return {
            ...m,
            x: m.x + (dx / dist) * m.speed,
            y: m.y + (dy / dist) * m.speed
          };
        });
        return moved;
      });

    }, 1000);

    return () => clearInterval(timer);
  }, [dragon, monsters, gemx.level]);

  const collectFruit = (fruit) => {
    setFruits(prev => prev.filter(f => f.id !== fruit.id));
    
    // Add fruit to inventory
    const fruitItem = {
      id: 'mystic_fruit_' + fruit.icon,
      name: 'Mystic Fruit',
      icon: fruit.icon,
      type: 'Consumable',
      rarity: 'Common',
      description: 'A magical fruit dropped by monsters in the Dragons Ground. Restores some HP.',
      sellValue: 20,
      effect: { hp: 20 }
    };

    syncPlayer({
      inventory: [...(player.inventory || []), fruitItem]
    });

    setMessage({ type: 'success', text: `Collected ${fruit.icon}!` });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-emerald-900/20">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-slate-900/80 backdrop-blur-md z-20">
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
          <div className="bg-black/60 border-2 border-emerald-500/50 px-3 py-1 rounded-lg flex items-center gap-2">
            <Gem size={14} className="text-cyan-400" />
            <div>
              <p className="text-[7px] font-black text-slate-500 uppercase">Void Crystals</p>
              <p className="text-xs font-black text-white">{crystalsInInventory}</p>
            </div>
          </div>
          <div className="bg-black/60 border-2 border-cyan-500/50 px-3 py-1 rounded-lg flex items-center gap-2">
            <TrendingUp size={14} className="text-cyan-400" />
            <div>
              <p className="text-[7px] font-black text-slate-500 uppercase">GEMX LVL</p>
              <p className="text-xs font-black text-white">{gemx.level}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ground */}
      <div 
        ref={groundRef}
        className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/grass.png')] bg-emerald-800"
        style={{ backgroundSize: '200px' }}
      >
        {/* Ground Details */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
        
        {/* GEMX Crystal */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
        >
          <div className="relative group cursor-pointer" onClick={feedGem}>
            <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-20 group-hover:opacity-50 transition-all animate-pulse duration-[2000ms]"></div>
            <div className={`w-24 h-24 flex items-center justify-center text-6xl animate-bounce duration-[3000ms] transition-transform ${gemx.level >= 10 ? 'scale-125' : 'scale-100'}`}>
              💎
            </div>
            {/* Energy progress ring */}
            <svg className="absolute -inset-4 w-32 h-32 -rotate-90">
              <circle
                cx="64" cy="64" r="58"
                fill="none"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="4"
              />
              <circle
                cx="64" cy="64" r="58"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="4"
                strokeDasharray={364}
                strokeDashoffset={364 - (gemx.crystalsFed / nextLevelRequirement) * 364}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded border border-cyan-500/50 whitespace-nowrap shadow-xl">
               <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">{gemx.crystalsFed} / {nextLevelRequirement} ENERGY</p>
            </div>
          </div>
          <h2 className="mt-12 text-2xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">GEMX</h2>
        </div>

        {/* Dragon */}
        {dragon && (
          <div 
            className="absolute transition-all duration-1000 z-20 pointer-events-none"
            style={{ left: `${dragon.x}%`, top: `${dragon.y}%`, fontSize: gemx.level >= 10 ? '80px' : '60px' }}
          >
            <div className="animate-bounce duration-[4000ms]">
              <span className="drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">{dragon.type}</span>
            </div>
          </div>
        )}

        {/* Monsters */}
        {monsters.map(m => (
          <div 
            key={m.id}
            className="absolute transition-all duration-1000 z-10 pointer-events-none text-2xl"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          >
            <div className="animate-pulse">
              {m.icon}
            </div>
          </div>
        ))}

        {/* Fruits */}
        {fruits.map(f => (
          <button 
            key={f.id}
            onClick={() => collectFruit(f)}
            className="absolute z-30 text-3xl hover:scale-125 transition-transform active:scale-95 animate-in fade-in zoom-in duration-300"
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
          >
            <div className="relative group">
               <div className="absolute inset-0 bg-white blur-md opacity-0 group-hover:opacity-40"></div>
               {f.icon}
            </div>
          </button>
        ))}

        {/* HUD Messages */}
        {message && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className={`px-6 py-2 rounded-full border-2 font-black uppercase italic text-xs shadow-2xl ${
              message.type === 'success' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : 
              message.type === 'error' ? 'bg-red-950/80 border-red-500 text-red-100' :
              'bg-blue-950/80 border-blue-500 text-blue-100'
            }`}>
              {message.text}
            </div>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-cyan-600/20 border border-cyan-500 flex items-center justify-center text-cyan-400 font-black">1</div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Feed GEMX with Void Crystals</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-red-600/20 border border-red-500 flex items-center justify-center text-red-400 font-black">2</div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Attract the Great Dragon</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-amber-600/20 border border-amber-500 flex items-center justify-center text-amber-400 font-black">3</div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Collect Mystic Fruits</p>
        </div>
      </div>
    </div>
  );
};
