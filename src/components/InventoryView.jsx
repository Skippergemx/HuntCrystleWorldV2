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
  Sparkles
} from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { NPCCard } from './NPCCard';
import { useGame } from '../contexts/GameContext';

export const InventoryView = React.memo(() => {
  const { player, actions, adventure, openGuide, ITEMS, CRYSTLE_RECIPES, FOODS } = useGame();
  const { setView } = adventure;
  const { sellItem, unequipItem, learnRecipe } = actions;
  
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

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
    const cleanId = item.id?.replace(/(_\d+)+$/, '');
    
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
     const inv = Object.values(player.inventory || {}).filter(i => i && typeof i === 'object').map(i => ({ ...i, isEquipped: false }));
     const equipped = Object.values(player.equipped || {}).filter(i => i && typeof i === 'object').map(i => ({ ...i, isEquipped: true }));
     
     // Synthesize base root items into physical objects for the main grid
     // Synthesize base root items into physical objects for the main grid (Representative only)
     if (player.autoScrolls > 0) {
        inv.push({ id: `auto_scroll_pool`, name: 'Auto-Hunt Energy', type: 'Consumable', category: 'Consumable', count: player.autoScrolls, isEquipped: false, icon: '🪄', desc: 'Unified reservoir of auto-hunt minutes.' });
     }
     if (player.potions > 0) {
        inv.push({ id: `hp_potion_pool`, name: 'Standard HP Potion', type: 'Consumable', category: 'Consumable', count: player.potions, isEquipped: false, icon: '🧪', desc: 'Standard biological recovery unit.' });
     }

     let fullList = [...inv, ...equipped];

     if (filter !== 'All') {
        fullList = fullList.filter(i => {
          const master = getMasterData(i);
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
    Object.values(player.inventory || {}).forEach(i => {
      if (!i) return;
      const master = getMasterData(i);
      const cleanId = master?.id || i.id?.replace(/(_\d+)+$/, '');
      c[cleanId] = (c[cleanId] || 0) + 1;
    });
    return c;
  }, [player.inventory, ITEMS, CRYSTLE_RECIPES, FOODS]);

  const renderResource = (icon, label, count) => (
    <div className={`flex flex-col items-center justify-center p-1 border-2 border-black transition-all ${count === 0 ? 'grayscale opacity-60 bg-slate-300 shadow-none' : 'bg-white shadow-[2px_2px_0_rgba(0,0,0,1)]'}`}>
        <span className="text-lg md:text-xl drop-shadow-sm leading-none">{icon}</span>
        <span className="text-[5px] md:text-[6px] font-black text-slate-500 uppercase text-center mt-1 pt-1 border-t border-black/10 w-full">{label}</span>
        <span className={`text-[9px] md:text-[10px] font-black uppercase italic leading-none mt-0.5 ${count === 0 ? 'text-slate-400' : 'text-black'}`}>{count > 0 ? `x${count}` : 0}</span>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-950 relative overflow-hidden custom-scrollbar">
       {/* Visual Character: Tactical Cache Atmosphere */}
       <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
       <div className="scanline-move opacity-5" />
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

       <div className="flex flex-col gap-3 mb-6 relative z-10 w-full">
         <div className="bg-amber-400 border-2 border-black p-3 flex justify-between items-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] flex items-center justify-center text-xl">🪙</div>
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-black/70 uppercase leading-none">GX TOKENS (LIQUID ASSETS)</span>
                   <span className="text-xl font-black italic text-black leading-none drop-shadow-sm">{player.tokens?.toLocaleString() || 0}</span>
                </div>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <div className="bg-slate-900 border-[3px] border-black p-2.5 shadow-[4px_4px_0_rgba(0,0,0,1)]">
             <div className="flex justify-between items-end mb-2 border-b-2 border-red-500 pb-1">
               <span className="text-[8px] md:text-[10px] font-black text-white uppercase italic tracking-widest drop-shadow-[1px_1px_0_rgba(239,68,68,1)]">MEDICAL SUPPLIES</span>
               <Activity size={12} className="text-red-500 animate-pulse" />
             </div>
             <div className="grid grid-cols-3 gap-2">
                 {renderResource('🧪', 'Standard', (player.potions || 0) + (counts['hp_potion'] || 0))}
                 {renderResource('🧪', 'Mega (+250)', counts['mega_hp_potion'] || 0)}
                 {renderResource('🧬', 'Ultra (+MAX)', counts['ultra_hp_potion'] || 0)}
             </div>
           </div>

           <div className="bg-slate-900 border-[3px] border-black p-2.5 shadow-[4px_4px_0_rgba(0,0,0,1)]">
             <div className="flex justify-between items-end mb-2 border-b-2 border-cyan-500 pb-1">
               <span className="text-[8px] md:text-[10px] font-black text-white uppercase italic tracking-widest drop-shadow-[1px_1px_0_rgba(6,182,212,1)]">AUTO-HUNT SCROLLS</span>
               <TrendingUp size={12} className="text-cyan-500 animate-bounce" />
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

       <div className="flex-1 bg-white border-2 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] flex flex-col min-h-0 relative z-10 text-black">
          <div className="border-b-2 border-slate-100 p-2 flex flex-wrap items-center gap-2 md:gap-4 bg-slate-50/50">
             <div className="flex-1 min-w-[150px] relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="SEARCH ASSETS..." 
                  className="w-full bg-white border border-slate-200 px-8 py-1.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500 rounded-sm"
                />
             </div>
             <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {['All', 'Weapon', 'Armor', 'Headgear', 'Footwear', 'Relic', 'Loot', 'Fruit', 'Food', 'Consumable'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-tighter whitespace-nowrap border-2 ${filter === cat ? 'bg-black text-white border-black' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
             {(() => {
                 const stacked = processedInventory.reduce((acc, item) => {
                   const cleanId = item.id?.replace(/(_\d+)+$/, '');
                   const master = ITEMS.find(it => it.id === cleanId || it.name?.toLowerCase() === item.name?.toLowerCase());
                   const baseId = master?.id || cleanId || item.name;
                   
                   const key = `${baseId}-${!!item.isEquipped}`;
                   const existing = acc.find(i => {
                      const iCleanId = i.id?.replace(/(_\d+)+$/, '');
                      const iMaster = ITEMS.find(it => it.id === iCleanId || it.name?.toLowerCase() === i.name?.toLowerCase());
                      const iBaseId = iMaster?.id || iCleanId || i.name;
                      return `${iBaseId}-${!!i.isEquipped}` === key;
                   });
                   
                   if (existing && !item.isEquipped) {
                      existing.count += 1;
                   } else {
                      acc.push({ ...item, count: 1 });
                   }
                   return acc;
                 }, []);

                return stacked.length > 0 ? (
                  stacked.map((item, idx) => {
                    const master = getMasterData(item);
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
                         className={`group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-3 border-2 transition-all ${
                           item.type === 'Schematic' ? 'bg-[#0b1b2b] border-cyan-500/50 shadow-[4px_4px_0_rgba(6,182,212,0.1)]' : 
                           item.isEquipped ? 'bg-cyan-50 border-cyan-500/40 shadow-[4px_4px_0_rgba(34,211,238,0.1)]' : 
                           'bg-slate-50 border-slate-100 hover:border-black/20 hover:bg-white hover:translate-x-1'
                         }`}
                       >
                        <div className="flex items-center gap-3">
                           <div className="relative shrink-0">
                              <div className={`w-14 h-14 border-2 border-black flex items-center justify-center shadow-[3px_3px_0_rgba(0,0,0,1)] transform group-hover:-rotate-3 transition-transform ${
                                item.type === 'Schematic' ? 'bg-cyan-900 border-cyan-400 glow-cyan' : 
                                rarity === 'Legendary' ? 'border-amber-400 shadow-[3px_3px_0_rgba(245,158,11,1)] rarity-legendary' : 
                                rarity === 'Epic' ? 'border-purple-400 shadow-[3px_3px_0_rgba(168,85,247,1)] rarity-epic' : 
                                rarity === 'Rare' ? 'rarity-rare' :
                                rarity === 'Uncommon' ? 'rarity-uncommon' : 'bg-white rarity-common'
                              }`}>
                                 <span className={`text-3xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)] ${item.type === 'Schematic' ? 'text-cyan-200' : ''}`}>{icon}</span>
                              </div>
                              {item.count > 1 && (
                                <span className="absolute -bottom-1 -right-1 bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm border-2 border-white/20 z-10">x{item.count}</span>
                              )}
                           </div>
                           <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                 {item.isEquipped && <div className="bg-black text-white px-1 py-0.5 text-[6px] font-black uppercase flex items-center gap-1 rounded-sm"><ShieldCheck size={8} /> ACTIVE</div>}
                                 {item.type === 'Schematic' && <div className="bg-cyan-500 text-black px-1 py-0.5 text-[6px] font-black uppercase flex items-center gap-1 rounded-sm">UNPRINTED BLUEPRINT</div>}
                                 <h4 className={`text-sm font-black uppercase italic tracking-tighter leading-none ${item.type === 'Schematic' ? 'text-cyan-100' : 'text-black'}`}>{master?.name || item.name || 'Unknown Item'}</h4>
                                 <div className="flex gap-1">
                                    <span className={`text-[7px] font-black px-1 border border-black/10 uppercase ${item.type === 'Schematic' ? 'bg-cyan-950 text-cyan-500' : 'bg-slate-100 text-slate-400'}`}>[{item.type || master.type || 'TECH'}]</span>
                                    <span className={`text-[7px] font-black px-1 border border-black/10 uppercase ${item.type === 'Schematic' ? 'bg-cyan-400 text-black' : rarity === 'Legendary' ? 'bg-amber-400 text-black' : rarity === 'Epic' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-black'}`}>{rarity}</span>
                                 </div>
                              </div>
                              <p className={`text-[8px] font-bold uppercase leading-none italic mb-2 ${item.type === 'Schematic' ? 'text-cyan-600' : 'text-slate-400'}`}>"{master.description || master.desc || item.desc || "Standard issue tech fragment."}"</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                 {Object.entries(master.stats || item.stats || {}).map(([s, v]) => v !== 0 && (
                                   <div key={s} className="flex items-center gap-1">
                                      <span className="text-[7px] font-black text-slate-300 uppercase">{s}</span>
                                      <span className="text-[8px] font-black text-cyan-600">+{v}</span>
                                   </div>
                                 ))}
                                 {(master.effect || item.effect) && (
                                    <div className="flex items-center gap-1 bg-black text-emerald-400 px-1 rounded-sm">
                                       <Zap size={8} />
                                       <span className="text-[7px] font-black uppercase italic">
                                          {master.effect?.type || item.effect?.type} {master.effect?.mult ? `x${master.effect.mult}` : ''}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                        <div className="flex-1 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
                           <div className="flex flex-col items-center md:items-end">
                              <span className="text-[12px] font-black italic text-amber-600 leading-none">{basePrice} GX</span>
                              <span className="text-[6px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Yield Per Unit</span>
                           </div>
                            <div className="flex gap-1">
                               {item.type === 'Schematic' && (
                                 <button onClick={() => learnRecipe(item)}
                                   className="px-3 py-1.5 bg-cyan-500 text-black hover:bg-cyan-400 text-[9px] font-black uppercase italic border-2 border-black transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
                                 >Learn</button>
                               )}
                               {!item.id?.includes('_99999') && (
                                 <>
                                    <button onClick={() => {
                                         if (item.isEquipped) {
                                            const slot = Object.keys(player.equipped || {}).find(k => player.equipped[k]?.id === item.id);
                                            if (slot) unequipItem(slot);
                                         }
                                         sellItem(item.id, 1);
                                      }}
                                      className="px-3 py-1.5 bg-slate-900 text-white hover:bg-black text-[9px] font-black uppercase italic border-2 border-black transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
                                    >Sell 1</button>
                                    {!item.isEquipped && item.count > 1 && (
                                      <button onClick={() => sellItem(item.id, item.count)}
                                        className="px-3 py-1.5 bg-amber-500 text-black hover:bg-amber-400 text-[9px] font-black uppercase italic border-2 border-black transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
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
          <div className="bg-black text-slate-500 p-2 text-[8px] font-black flex justify-between items-center">
             <div className="flex gap-4">
                <span>RECORDS: {processedInventory.length}</span>
                <span>SIGNALS: ACTIVE</span>
             </div>
             <div className="flex items-center gap-1 text-cyan-400">
                <span className="animate-pulse">●</span>
                <span>REAL-TIME PERSISTENCE ENABLED</span>
             </div>
          </div>
          

       </div>

       <div className="mt-4 flex items-center justify-between opacity-30">
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
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-emerald-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
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
                <div className="w-16 h-28 md:w-20 md:h-36 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0 flex items-center justify-center">
                   <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                   <div className="absolute inset-x-0 bottom-0 bg-blue-600 text-[6px] font-black text-black text-center py-0.5 uppercase italic">LOGISTICS</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-emerald-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'assets' && (
                     <Package className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'economy' && (
                     <div className="text-4xl md:text-5xl drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10 animate-bounce">🪙</div>
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'recycle' && (
                     <Activity className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-emerald-400 animate-spin-slow"></div>
                </div>
              </div>

              {/* Dialogue Box */}
              <div className="px-4 pb-3 w-full relative z-10 flex flex-col min-h-0">
                <div className="bg-white text-black p-3 md:p-3.5 rounded-xl border-[3px] border-black relative mb-3 shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0">
                  <div className="absolute -top-3 -left-1 bg-emerald-400 text-[8px] font-black px-2 py-0.5 border-2 border-black uppercase italic shadow-sm">
                    Incoming Transmission
                  </div>
                  <p className="text-[10px] md:text-sm font-bold text-slate-800 uppercase leading-[1.3] md:leading-[1.4] tracking-tight italic">
                    "{tutorialSteps[tutorialStep].text}"
                  </p>
                  
                  {/* Speech Bubble Arrow */}
                  <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black transform rotate-[30deg]"></div>
                </div>

                <div className="bg-black/60 p-1.5 rounded-lg border border-emerald-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-emerald-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-emerald-500' : 'bg-slate-800'}`}
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
                    className="flex-[2] bg-emerald-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
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

       <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
       `}</style>
    </div>
  );
});
