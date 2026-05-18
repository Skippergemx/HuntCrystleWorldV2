import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, 
  Package, 
  Zap,
  Filter,
  Search,
  TrendingUp,
  Activity,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { NPCCard } from './NPCCard';
import { useGame } from '../contexts/GameContext';

export const InventoryView = React.memo(() => {
  const { player, actions, adventure, openGuide, ITEMS, CRYSTLE_RECIPES, FOODS } = useGame();
  const { setView } = adventure;
  const { sellItem, unequipItem, learnRecipe } = actions;
  
  const currentSlots = Object.keys(player?.inventory || {}).length;
  const maxSlots = player?.maxInventorySlots || 50;

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [floaters, setFloaters] = useState([]);
  const showFloater = (e, text) => {
    const id = Date.now() + Math.random();
    const x = e.clientX;
    const y = e.clientY;
    setFloaters(prev => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setFloaters(prev => prev.filter(f => f.id !== id));
    }, 1500);
  };

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_inventory_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Storage Core",
      npc: 2,
      visualType: 'assets',
      text: "This is your Storage Core. All Weapons, Armor, Relics, and crafting materials you loot in the Dungeons are stored here.",
      hint: "Tip: Keep an eye out for Legendary drops!"
    },
    {
      title: "Asset Liquidation",
      npc: 6,
      visualType: 'economy',
      text: "Need more GX Tokens? Sell unused assets directly from Storage. Use the filters to quickly find what you want to liquidate.",
      hint: "Strategy: Sell low-tier loot for immediate GX."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_inventory_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  // Robust Item Data Resolver - Now powered by unified ITEMS list
  const getMasterData = (item) => {
    if (!item) return null;
    const cleanId = item.id?.replace(/_([a-z0-9]+)+$/, '');
    
    // 1. Check Master Items DB
    const fromItems = ITEMS.find(i => i.id === cleanId);
    if (fromItems) return fromItems;
    
    // 2. Check Recipe List (for crafted items not in master)
    const fromRecipe = CRYSTLE_RECIPES.find(r => r.id === cleanId);
    if (fromRecipe) return fromRecipe;

    // 3. Check FOODS List
    const fromFood = FOODS?.find(r => r.id === cleanId);
    if (fromFood) return { ...fromFood, type: 'Food', category: 'Food' };

    // 4. Last Resort: Name Match
    const byName = ITEMS.find(i => i.name?.toLowerCase() === item.name?.toLowerCase());
    if (byName) return byName;
    const byFoodName = FOODS?.find(i => i.name?.toLowerCase() === item.name?.toLowerCase());
    if (byFoodName) return { ...byFoodName, type: 'Food', category: 'Food' };

    return item;
  };

  const getItemIcon = (item, master) => {
    if (master && master.icon && master.icon !== '📦') return master.icon;
    if (item.icon && item.icon !== '📦' && item.icon !== '') return item.icon;
    return '📦';
  };

  const processedInventory = useMemo(() => {
     const unequippedCounts = {};
     const unequippedFirsts = {};
     const nameToId = {};
     ITEMS.forEach(i => { if (i.name) nameToId[i.name.toLowerCase()] = i.id; });

     Object.values(player.inventory || {}).forEach(i => {
       if (!i || typeof i !== 'object') return;
       const baseId = (i.name && nameToId[i.name.toLowerCase()]) || i.id?.replace(/_([a-z0-9]+)+$/, '') || i.name;
       const master = getMasterData(i);
       
       if (!unequippedFirsts[baseId]) {
         unequippedFirsts[baseId] = { ...i, isEquipped: false, master };
       }
       unequippedCounts[baseId] = (unequippedCounts[baseId] || 0) + 1;
     });
     
     const unequipped = Object.keys(unequippedCounts).map(baseId => {
       return { ...unequippedFirsts[baseId], count: unequippedCounts[baseId] };
     });
     
     const equipped = Object.values(player.equipped || {}).filter(i => i && typeof i === 'object').map(i => {
       return { ...i, isEquipped: true, count: 1, master: getMasterData(i) };
     });
     
     const pools = [];
     if (player.autoScrolls > 0) {
        pools.push({ id: `auto_scroll_pool`, name: 'Auto-Hunt Energy', type: 'Consumable', category: 'Consumable', count: player.autoScrolls, isEquipped: false, icon: '🪄', desc: 'Unified reservoir of auto-hunt minutes.', master: { type: 'Consumable' } });
     }
     if (player.potions > 0) {
        pools.push({ id: `hp_potion_pool`, name: 'Standard HP Potion', type: 'Consumable', category: 'Consumable', count: player.potions, isEquipped: false, icon: '🧪', desc: 'Standard biological recovery unit.', master: { type: 'Consumable' } });
     }

     let fullList = [...pools, ...equipped, ...unequipped];

     if (filter !== 'All') {
        fullList = fullList.filter(i => {
          const master = i.master || getMasterData(i);
          const iType = i.type || master?.type;
          const iCat = i.category || master?.category;
          if (filter === 'Loot') return ['Material', 'Component', 'Energy', 'Loot', 'Token', 'Currency', 'Data', 'Heart', 'Artifact'].includes(iType);
          if (filter === 'Fruit') return iType === 'Fruit' || iCat === 'Fruit';
          if (filter === 'Food') return iType === 'Food' || iCat === 'Food';
          if (filter === 'Consumable') return iType === 'Consumable' || iCat === 'Consumable';
          return iType === filter;
        });
     }

     if (search) {
        fullList = fullList.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));
     }

     return fullList;
  }, [player.inventory, player.equipped, filter, search, player.autoScrolls, player.potions]);

  const counts = useMemo(() => {
    const c = {};
    if (!player.inventory) return c;

    const nameToId = {};
    ITEMS.forEach(i => { if (i.name) nameToId[i.name.toLowerCase()] = i.id; });

    Object.values(player.inventory).forEach(item => {
      if (!item) return;
      const baseId = (item.name && nameToId[item.name.toLowerCase()]) || item.id?.replace(/_([a-z0-9]+)+$/, '') || item.name;
      c[baseId] = (c[baseId] || 0) + 1;
      if (item.id !== baseId) c[item.id] = (c[item.id] || 0) + 1;
    });
    return c;
  }, [player.inventory, ITEMS]);

  const renderResource = (icon, label, count) => (
    <div className={`flex flex-col items-center justify-center p-1 border-[3px] border-black transition-all ${count === 0 ? 'grayscale opacity-40 bg-white/5' : 'bg-white shadow-[3px_3px_0px_0px_black]'}`}>
        <span className="text-lg md:text-xl drop-shadow-sm leading-none">{icon}</span>
        <span className="text-[5px] md:text-[6px] font-black text-black/40 uppercase text-center mt-1 pt-1 border-t border-black/10 w-full bungee">{label}</span>
        <span className={`text-[9px] md:text-[10px] font-black uppercase italic leading-none mt-0.5 bungee ${count === 0 ? 'text-black/20' : 'text-black'}`}>{count > 0 ? `x${count}` : 0}</span>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-[#0f051d] relative overflow-hidden custom-scrollbar">
       {/* ANIME POP Overlay: Grid & Scanlines */}
       <div className="fixed inset-0 pointer-events-none z-[2] opacity-10 bg-scanline"></div>
       <div className="fixed inset-0 pointer-events-none z-[1] opacity-5 bg-cyber-grid"></div>
       
       <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] pointer-events-none" />
       
       <Header title="STORAGE CORE: ASSET BAG" onClose={adventure.goBack} npcNum={9} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
       }} icon={<Package className="text-emerald-400 animate-pulse" />} />

       <NPCCard
        citizenNum={9}
        name="QUARTERMASTER"
        accentColor="bg-teal-500"
        textColor="text-teal-600"
        glowColor="bg-teal-500"
        statusTag="STORAGE_CORE_ONLINE"
        statusTag2="INVENTORY_SYNCED"
        prefix="◢QM: "
        dialogues={[
          "Your Asset Bag holds every piece of loot you've scavenged from the sectors.",
          "Items with duplicate IDs are stacked automatically. Check the count badge.",
          "Craft with raw materials from here — or sell them on the Open Grid.",
          "Reorganize your bag before a deep run. Know what you're carrying.",
          "Equipment must be equipped from the Tactical Loadout, not from here.",
          "GX Tokens shown here are your liquid war chest. Spend them wisely.",
          "Never go into Sector 5 without at least 3 HP Potions in storage.",
          "A clean bag is a hunter's competitive edge. Know your inventory."
        ]}
      />

      {currentSlots >= maxSlots && (
        <div className="mb-4 bg-red-950/70 border-[3px] border-black p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[6px_6px_0px_0px_rgba(239,68,68,1)] animate-pulse relative z-10 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 border-2 border-black flex items-center justify-center text-black font-black text-lg shadow-[2px_2px_0px_black] shrink-0">⚠️</div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none bungee">SATCHEL OVERBURDENED (WEIGHT LOCK ACTIVE)</span>
              <p className="text-[8.5px] font-bold text-white uppercase tracking-tight mt-1 leading-snug bungee">
                Your storage core is full! You can equip or sell items, but new monster drops and fruits are blocked.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setView('bag_upgrade')} 
            className="px-3.5 py-2 bg-white text-black hover:bg-red-500 hover:text-white text-[9px] font-[1000] uppercase italic border-2 border-black shadow-[3px_3px_0px_0px_black] active:shadow-none active:translate-y-0.5 transition-all bungee shrink-0"
          >
            EXPAND CAPACITY
          </button>
        </div>
      )}

       <div className="flex flex-col gap-3 mb-6 relative z-10 w-full">
          <div className="bg-[var(--neon-lime)] border-[3px] border-black p-3 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center shadow-[6px_6px_0px_0px_black]">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border-[3px] border-black shadow-[3px_3px_0px_0px_black] flex items-center justify-center text-xl">🪙</div>
                  <div className="flex flex-col text-left">
                     <span className="text-[8px] font-black text-black/70 uppercase leading-none bungee">GX TOKENS (LIQUID ASSETS)</span>
                     <span className="text-xl font-black italic text-black leading-none drop-shadow-sm bungee">{player.tokens?.toLocaleString() || 0}</span>
                  </div>
              </div>
              
              <button 
                onClick={() => setView('bag_upgrade')}
                className="px-4 py-2 bg-black hover:bg-white text-white hover:text-black border-[2px] border-black font-black uppercase text-[10px] italic shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 bungee shrink-0"
              >
                <span>🔋 EXPAND BAG CAPACITY</span>
              </button>
           </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <div className="bg-black border-[3px] border-white p-2.5 shadow-[6px_6px_0px_0px_black]">
              <div className="flex justify-between items-end mb-2 border-b-2 border-[var(--neon-pink)] pb-1">
                <span className="text-[8px] md:text-[10px] font-black text-white uppercase italic tracking-widest bungee">MEDICAL SUPPLIES</span>
               <Activity size={12} className="text-red-500 animate-pulse" />
             </div>
             <div className="grid grid-cols-3 gap-2">
                 {renderResource('🧪', 'Standard', (player.potions || 0) + (counts['hp_potion'] || 0))}
                 {renderResource('🧪', 'Mega (+250)', counts['mega_hp_potion'] || 0)}
                 {renderResource('🧬', 'Ultra (+MAX)', counts['ultra_hp_potion'] || 0)}
             </div>
           </div>

            <div className="bg-black border-[3px] border-white p-2.5 shadow-[6px_6px_0px_0px_black]">
              <div className="flex justify-between items-end mb-2 border-b-2 border-[var(--neon-cyan)] pb-1">
                <span className="text-[8px] md:text-[10px] font-black text-white uppercase italic tracking-widest bungee">AUTO-HUNT SCROLLS</span>
                <TrendingUp size={12} className="text-[var(--neon-cyan)] animate-bounce" />
              </div>
             <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                 {renderResource('🪄', 'Energy (Mins)', (player.autoScrolls || 0) + (counts['auto_scroll'] || 0))}
                 {renderResource('📜', '3m Units', counts['auto_scroll_3m'] || 0)}
                 {renderResource('📜', '6m Units', counts['auto_scroll_6m'] || 0)}
                 {renderResource('📜', '9m Units', counts['auto_scroll_9m'] || 0)}
                 {renderResource('📜', '12m Units', counts['auto_scroll_12m'] || 0)}
             </div>
           </div>
         </div>
       </div>

       <div className="flex-1 bg-black border-[3px] border-white shadow-[8px_8px_0px_0px_black] flex flex-col min-h-0 relative z-10 text-white overflow-hidden">
          <div className="halftone-overlay absolute inset-0 opacity-10 pointer-events-none"></div>
          <div className="border-b-2 border-white/10 p-2 flex flex-wrap items-center gap-2 md:gap-4 bg-white/5 relative z-10">
             <div className="flex-1 min-w-[150px] relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="SEARCH ASSETS..." 
                  className="w-full bg-black border-2 border-white/20 px-8 py-1.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-[var(--neon-cyan)] rounded-sm bungee"
                />
             </div>
             <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {['All', 'Weapon', 'Armor', 'Headgear', 'Footwear', 'Relic', 'Loot', 'Fruit', 'Food', 'Consumable'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-tighter whitespace-nowrap border-2 bungee ${filter === cat ? 'bg-white text-black border-white' : 'bg-black text-white/40 border-white/20 hover:border-white'}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
             {(() => {
                const stacked = processedInventory;

                return stacked.length > 0 ? (
                  stacked.map((item, idx) => {
                    const master = item.master || getMasterData(item);
                    const icon = getItemIcon(item, master);
                    const rarity = master.rarity || item.rarity || 'Common';
                    
                    let basePrice = 0;
                    if (master && master.cost) {
                      basePrice = Math.floor(master.cost * 0.4);
                    } else if (master && master.sellValue !== undefined) {
                      basePrice = master.sellValue;
                    } else {
                      basePrice = item.sellValue || Math.floor((item.cost || 0) * 0.4);
                    }

                    return (
                      <div 
                         key={`${item.id}-${idx}`} 
                         className={`group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-3 border-[3px] transition-all relative overflow-hidden z-10 ${
                           item.type === 'Schematic' ? 'bg-[#0b1b2b] border-[var(--neon-cyan)] shadow-[6px_6px_0px_0px_var(--neon-cyan)]' : 
                           item.isEquipped ? 'bg-[var(--neon-cyan)] border-black shadow-[6px_6px_0px_0px_black]' : 
                           'bg-black border-white hover:border-[var(--neon-lime)] shadow-[6px_6px_0px_0px_black] hover:-translate-y-1'
                         }`}
                       >
                        {item.type !== 'Schematic' && !item.isEquipped && <div className="halftone-overlay absolute inset-0 opacity-10 pointer-events-none"></div>}
                        <div className="flex items-center gap-3 relative z-10">
                           <div className="relative shrink-0">
                              <div className={`w-14 h-14 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black] transform group-hover:-rotate-6 transition-transform bg-white ${
                                rarity === 'Legendary' ? 'shadow-[4px_4px_0px_0px_#ffae00]' : 
                                rarity === 'Epic' ? 'shadow-[4px_4px_0px_0px_var(--neon-pink)]' : 
                                rarity === 'Rare' ? 'shadow-[4px_4px_0px_0px_var(--neon-cyan)]' :
                                rarity === 'Uncommon' ? 'shadow-[4px_4px_0px_0px_var(--neon-lime)]' : ''
                              }`}>
                                 <span className={`text-3xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)] ${item.type === 'Schematic' ? 'text-cyan-200' : ''}`}>{icon}</span>
                              </div>
                              {item.count > 1 && (
                                <span className="absolute -bottom-1 -right-1 bg-[var(--neon-lime)] text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm border-2 border-black z-10 bungee">x{item.count}</span>
                              )}
                           </div>
                           <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                 {item.isEquipped && <div className="bg-black text-white px-1 py-0.5 text-[6px] font-black uppercase flex items-center gap-1 rounded-sm bungee"><ShieldCheck size={8} /> ACTIVE</div>}
                                 {item.type === 'Schematic' && <div className="bg-[var(--neon-cyan)] text-black px-1 py-0.5 text-[6px] font-black uppercase flex items-center gap-1 rounded-sm bungee">UNPRINTED BLUEPRINT</div>}
                                 <h4 className={`text-sm font-black uppercase italic tracking-tighter leading-none bungee ${item.type === 'Schematic' ? 'text-[var(--neon-cyan)]' : item.isEquipped ? 'text-black' : 'text-white'}`}>{master?.name || item.name || 'Unknown Item'}</h4>
                                 <div className="flex gap-1">
                                    <span className={`text-[7px] font-black px-1 border border-white/20 uppercase bungee ${item.type === 'Schematic' ? 'bg-black text-[var(--neon-cyan)]' : item.isEquipped ? 'bg-white/40 text-black' : 'bg-white/10 text-white/60'}`}>[{item.type || master.type || 'TECH'}]</span>
                                    <span className={`text-[7px] font-black px-1 border-2 border-black uppercase bungee ${item.type === 'Schematic' ? 'bg-[var(--neon-cyan)] text-black' : rarity === 'Legendary' ? 'bg-[#ffae00] text-black' : rarity === 'Epic' ? 'bg-[var(--neon-pink)] text-black' : rarity === 'Rare' ? 'bg-[var(--neon-cyan)] text-black' : rarity === 'Uncommon' ? 'bg-[var(--neon-lime)] text-black' : 'bg-white text-black'}`}>{rarity}</span>
                                 </div>
                              </div>
                              <p className={`text-[8px] font-bold uppercase leading-none italic mb-2 bungee ${item.type === 'Schematic' ? 'text-[var(--neon-cyan)]' : item.isEquipped ? 'text-black/60' : 'text-white/40'}`}>"{master.description || master.desc || item.desc || "Standard issue tech fragment."}"</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                 {Object.entries(master.stats || item.stats || {}).map(([s, v]) => v !== 0 && (
                                   <div key={s} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border-2 uppercase italic bungee ${item.isEquipped ? 'border-black/20 text-black' : 'border-white/20 text-white'}`}>
                                      <span className="text-[7px] font-black">{s}</span>
                                      <span className="text-[8px] font-black text-[var(--neon-lime)]">+{v}</span>
                                   </div>
                                 ))}
                                 {(master.effect || item.effect) && (
                                    <div className="flex items-center gap-1 bg-black text-[var(--neon-lime)] px-1 rounded-sm border-2 border-black shadow-[2px_2px_0px_0px_black] bungee">
                                       <Zap size={8} />
                                       <span className="text-[7px] font-black uppercase italic">
                                          {master.effect?.type || item.effect?.type} {master.effect?.mult ? `x${master.effect.mult}` : ''}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                        <div className={`flex-1 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2 border-t-2 md:border-t-0 md:border-l-2 pt-2 md:pt-0 md:pl-4 relative z-10 ${item.isEquipped ? 'border-black/10' : 'border-white/10'}`}>
                           <div className="flex flex-col items-center md:items-end">
                              <span className="text-[12px] font-black italic text-[var(--neon-lime)] leading-none bungee">{basePrice} GX</span>
                              <span className={`text-[6px] font-bold uppercase tracking-widest mt-0.5 bungee ${item.isEquipped ? 'text-black/60' : 'text-white/40'}`}>Yield Per Unit</span>
                           </div>
                            <div className="flex gap-1">
                               {item.type === 'Schematic' && (
                                 <button onClick={() => learnRecipe(item)}
                                   className="px-3 py-1.5 bg-[var(--neon-cyan)] text-black hover:bg-white text-[9px] font-black uppercase italic border-[3px] border-black transition-all shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-y-1 bungee"
                                 >Learn</button>
                               )}
                               {!item.id?.includes('_99999') && (
                                 <>
                                    <button onClick={async (e) => {
                                         e.persist();
                                         if (item.isEquipped) {
                                            const slot = Object.keys(player.equipped || {}).find(k => player.equipped[k]?.id === item.id);
                                            if (slot) unequipItem(slot);
                                         }
                                         const val = await sellItem(item.id, 1);
                                         if (val) showFloater(e, `+${val} GX`);
                                      }}
                                      className="px-3 py-1.5 bg-black text-white hover:bg-white hover:text-black text-[9px] font-black uppercase italic border-[3px] border-white hover:border-black transition-all shadow-[4px_4px_0px_0px_black] hover:shadow-[4px_4px_0px_0px_var(--neon-lime)] active:shadow-none active:translate-y-1 bungee"
                                    >Sell 1</button>
                                    {!item.isEquipped && item.count > 1 && (
                                      <button onClick={async (e) => {
                                          e.persist();
                                          const val = await sellItem(item.id, item.count);
                                          if (val) showFloater(e, `+${val} GX`);
                                        }}
                                        className="px-3 py-1.5 bg-[var(--neon-lime)] text-black hover:bg-white text-[9px] font-black uppercase italic border-[3px] border-black transition-all shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-y-1 bungee"
                                      >Sell All</button>
                                    )}
                                  </>
                               )}
                            </div>
                        </div>
                      </div>

                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Activity size={48} className="animate-pulse mb-4" />
                    <p className="text-sm font-black uppercase tracking-[0.4em] italic">No Assets Linked</p>
                  </div>
                );
             })()}
          </div>
          <div className="bg-black border-t border-white/10 text-white/40 p-2.5 text-[8px] font-black flex flex-col md:flex-row gap-3 justify-between items-center bungee">
             <div className="flex items-center gap-4">
                <span>RECORDS: {processedInventory.length} ASSETS</span>
                <span className="text-[var(--neon-lime)]">SIGNALS: ACTIVE</span>
             </div>
             
             {/* THE DYNAMIC CYBER CAPACITY BAR */}
             <div className="flex items-center gap-2.5 w-full md:w-auto">
                <span className="uppercase text-[8px] tracking-widest text-slate-400">Bag:</span>
                <div className="w-24 md:w-32 h-2.5 bg-slate-900 border border-slate-700 p-0.5 rounded-sm overflow-hidden relative">
                   <div 
                     className={`h-full rounded-sm transition-all duration-500 ${
                       currentSlots >= maxSlots ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse' : 
                       currentSlots >= maxSlots * 0.8 ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]' : 'bg-[var(--neon-cyan)] shadow-[0_0_10px_var(--neon-cyan)]'
                     }`} 
                     style={{ width: `${Math.min(100, (currentSlots / maxSlots) * 100)}%` }} 
                   />
                </div>
                <span className={`text-[9px] font-black italic uppercase ${
                  currentSlots >= maxSlots ? 'text-red-500 animate-pulse' : 
                  currentSlots >= maxSlots * 0.8 ? 'text-amber-400' : 'text-white'
                }`}>
                   {currentSlots} / {maxSlots} SLOTS
                </span>
             </div>

             <div className="flex items-center gap-1 text-[var(--neon-cyan)]">
                <span className="animate-pulse">●</span>
                <span>REAL-TIME PERSISTENCE ENABLED</span>
             </div>
          </div>
          

       </div>

       <div className="mt-4 flex items-center justify-between opacity-50 bungee">
          <div className="flex items-center gap-2 text-white italic text-[9px] font-black">
             <span>Neural filtering engaged.</span>
          </div>
          <span className="text-[7px] font-black text-white uppercase tracking-widest leading-none">V2.4.98 INVENTORY CORE</span>
        </div>

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-emerald-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-black border-[3px] md:border-[4px] border-white rounded-[3rem] z-10 flex flex-col items-center overflow-hidden shadow-[12px_12px_0px_0px_black]">
              <div className="halftone-overlay absolute inset-0 opacity-10 pointer-events-none rounded-[3rem]"></div>

              <div className="w-full bg-[var(--neon-cyan)] py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black relative z-10 flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-black text-center uppercase tracking-tighter italic bungee">
                  {tutorialSteps[tutorialStep].title}
                </h2>
                <div className="absolute top-1/2 -translate-y-1/2 right-4 bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] border-2 border-white leading-none bungee">
                  Step {tutorialStep + 1} / {tutorialSteps.length}
                </div>
              </div>

              <div className="py-3 md:py-4 relative flex justify-center items-center gap-3 w-full z-10">
                <div className="w-16 h-28 md:w-20 md:h-36 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0px_0px_black] transform -rotate-2 bg-white shrink-0 flex items-center justify-center">
                   <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                   <div className="absolute inset-x-0 bottom-0 bg-black text-[6px] font-black text-[var(--neon-cyan)] text-center py-0.5 uppercase italic bungee">LOGISTICS</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-[var(--neon-lime)] rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-[var(--neon-lime)] to-transparent" />
                </div>

                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0px_0px_black] bg-white flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'assets' && (
                     <Package className="text-[var(--neon-lime)] drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'economy' && (
                     <div className="text-4xl md:text-5xl drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 animate-bounce">🪙</div>
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'recycle' && (
                     <Activity className="text-[var(--neon-pink)] drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
              </div>

              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[4px_4px_0px_0px_black] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-[var(--neon-cyan)] text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm bungee">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-black uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic bungee">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="flex items-center gap-2 mb-3 shrink-0 justify-center">
                   <Info size={14} className="text-[var(--neon-cyan)]" />
                   <p className="text-[8px] font-black text-white/40 uppercase italic tracking-widest text-center bungee">
                      {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-white flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-[var(--neon-cyan)] border-black' : 'bg-black'}`}
                   >
                     {dontShowAgain && <Check size={10} className="text-black" />}
                   </button>
                   <span className="text-[9px] font-black text-white/40 uppercase italic tracking-tighter cursor-pointer bungee" onClick={() => setDontShowAgain(!dontShowAgain)}>
                     Don't show this briefing again
                   </span>
                </div>

                <div className="flex gap-2 shrink-0 pb-1">
                   {tutorialStep > 0 && (
                      <button
                        onClick={() => setTutorialStep(prev => prev - 1)}
                        className="flex-1 bg-black text-white/40 py-2.5 rounded-xl font-black uppercase tracking-widest border-[3px] border-white/20 italic text-[9px] bungee"
                      >
                        BACK
                      </button>
                   )}
                  <button
                    onClick={nextStep}
                    className="flex-[2] bg-[var(--neon-cyan)] text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-all border-[3px] border-black shadow-[4px_4px_0px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5 bungee"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'OPEN STORAGE' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {createPortal(
        floaters.map(f => (
          <div key={f.id} className="pointer-events-none fixed z-[9999] text-[var(--neon-lime)] font-black italic text-lg drop-shadow-[0_0_8px_rgba(0,0,0,1)] bungee animate-float-up"
               style={{ left: f.x, top: f.y, transform: 'translate(-50%, -100%)' }}>
            {f.text}
          </div>
        )),
        document.body
      )}

       <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        @keyframes float-up {
          0% { transform: translate(-50%, -100%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, calc(-100% - 40px)) scale(1.2); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
       `}</style>
    </div>
  );
});
