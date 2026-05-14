import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sword, Shield, HardHat, Footprints, Package, Lock, Check, 
  Sparkles, TrendingUp, Zap, Hexagon, Coins, Info, ShoppingCart 
} from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { NPCCard } from './NPCCard';
import { useGame } from '../contexts/GameContext';

export const ShopView = React.memo(() => {
  const { player, actions, adventure, openGuide, SHOP_ITEMS, ITEMS } = useGame();
  const { setView } = adventure;
  const { buyItem } = actions;

  const [activeTab, setActiveTab] = useState('baseline');
  const [baselineFilter, setBaselineFilter] = useState('ALL');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [txStatus, setTxStatus] = useState('idle');
  const [txCountdown, setTxCountdown] = useState(30);

  // Filter items for the Industrial Market
  const INDUSTRIAL_ITEMS = useMemo(() => {
    return ITEMS.filter(i => (i.category === 'Loot' || i.type === 'Material' || i.type === 'Component') && i.sellValue > 0)
      .sort((a,b) => (a.sellValue || 0) - (b.sellValue || 0));
  }, [ITEMS]);

  const getIndustrialData = (item) => {
    const rarity = item.rarity?.toLowerCase() || 'common';
    let mult = 10;
    if (rarity === 'uncommon') mult = 20;
    if (rarity === 'rare') mult = 40;
    if (rarity === 'epic') mult = 80;
    if (rarity === 'legendary') mult = 150;
    
    const scavPrice = (item.sellValue || 0) * mult;
    return { ...item, cost: scavPrice, rarity };
  };

  const getOwnedQty = (item) => {
    if (!item) return 0;
    let pooled = 0;
    if (item.id === 'hp_potion') pooled = player.potions || 0;
    if (item.id === 'auto_scroll') pooled = player.autoScrolls || 0;

    const inventoryCount = Object.values(player.inventory || {}).filter(i => {
       if (!i) return false;
       const cleanId = i.id?.replace(/(_\d+)+$/, '');
       return cleanId === item.id || i.id === item.id;
    }).length;

    return pooled + inventoryCount;
  };

  const handleBuyClick = (item) => {
    setSelectedItem(item);
    setPurchaseQty(1);
    setTxStatus('idle');
  };

  const confirmPurchase = async () => {
    setTxStatus('submitting');
    let timeLeft = 30;
    setTxCountdown(timeLeft);
    const interval = setInterval(() => {
      timeLeft -= 1;
      setTxCountdown(timeLeft);
    }, 1000);

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 30000));

    try {
      const result = await Promise.race([buyItem(selectedItem, purchaseQty), timeoutPromise]);
      clearInterval(interval);
      if (result === 'TIMEOUT') {
        setTxStatus('failed');
      } else if (result) {
        setTxStatus('success');
        setTimeout(() => {
          setSelectedItem(null);
          setTxStatus('idle');
        }, 1500);
      } else {
        setTxStatus('failed');
      }
    } catch (e) {
      clearInterval(interval);
      setTxStatus('failed');
    }
  };

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_shop_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    { title: "GX Exchange", npc: 4, visualType: 'trade', text: "Welcome to the central GX Exchange! Spend your tokens on high-tier gear.", hint: "Tip: The shop instantly upgrades your arsenal." },
    { title: "Level Restrictions", npc: 6, visualType: 'level', text: "High-grade tech is strictly locked! Increase your level to unlock them.", hint: "Strategy: Level up to unlock Epic gear." },
    { title: "Auto-Equip", npc: 2, visualType: 'economy', text: "Purchased gear is shipped to your inventory. Equip them via the Tactical terminal.", hint: "Warning: Always check stats before buying." }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) setTutorialStep(tutorialStep + 1);
    else {
      if (dontShowAgain) localStorage.setItem('hide_shop_tutorial', 'true');
      setShowTutorial(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f051d] relative overflow-hidden">
      {/* ANIME POP Overlay: Grid & Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[2] opacity-10 bg-scanline"></div>
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-5 bg-cyber-grid"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[var(--neon-cyan)]/5 blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[var(--neon-pink)]/5 blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="flex-1 flex flex-col p-4 md:p-8 space-y-6 overflow-y-auto no-scrollbar relative z-10">
        <Header title="CYBER COMMERCE" onClose={adventure.goBack} npcNum={17} onHelp={() => {
          setTutorialStep(0);
          setShowTutorial(true);
        }} />

        {/* PREMIUM TAB NAVIGATOR */}
        <div className="flex flex-col gap-4 sticky top-0 z-20">
           <div className="flex gap-4 p-2 bg-black border-[3px] border-white rounded-2xl shadow-[8px_8px_0px_0px_black] backdrop-blur-md">
              <button 
                 onClick={() => setActiveTab('baseline')}
                 className={`flex-1 py-4 rounded-xl font-black text-[11px] uppercase tracking-tighter transition-all duration-300 italic flex items-center justify-center gap-3 relative overflow-hidden group border-2 ${
                    activeTab === 'baseline' 
                    ? 'bg-[var(--neon-cyan)] text-black border-black shadow-[4px_4px_0px_0px_black]' 
                    : 'bg-black text-white border-white/20 hover:border-[var(--neon-cyan)]'
                 }`}
              >
                 {activeTab === 'baseline' && <div className="absolute inset-0 bg-white/20 animate-skill-sweep"></div>}
                 <Hexagon size={16} className={`${activeTab === 'baseline' ? 'animate-spin-slow' : ''} relative z-10`} />
                 <span className="relative z-10 bungee">Tactical Baseline</span>
              </button>
              <button 
                 onClick={() => setActiveTab('industrial')}
                 className={`flex-1 py-4 rounded-xl font-black text-[11px] uppercase tracking-tighter transition-all duration-300 italic flex items-center justify-center gap-3 relative overflow-hidden group border-2 ${
                    activeTab === 'industrial' 
                    ? 'bg-[var(--neon-lime)] text-black border-black shadow-[4px_4px_0px_0px_black]' 
                    : 'bg-black text-white border-white/20 hover:border-[var(--neon-lime)]'
                 }`}
              >
                 {activeTab === 'industrial' && <div className="absolute inset-0 bg-white/20 animate-skill-sweep"></div>}
                 <Zap size={16} className={`${activeTab === 'industrial' ? 'animate-pulse' : ''} relative z-10`} />
                 <span className="relative z-10 bungee">Industrial Scrap</span>
              </button>
           </div>

           {/* SUB-FILTERS FOR BASELINE */}
           {activeTab === 'baseline' && (
              <div className="flex gap-2 p-1 bg-black/60 rounded-xl border border-white/5 self-center">
                 {['ALL', 'EQUIPMENT', 'FRUIT', 'TOOL'].map(f => (
                    <button
                       key={f}
                       onClick={() => setBaselineFilter(f)}
                       className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all italic ${
                          baselineFilter === f ? 'bg-white text-black' : 'text-slate-500 hover:text-slate-300'
                       }`}
                    >
                       {f === 'FRUIT' ? 'NUTRITION' : f === 'TOOL' ? 'TACTICAL' : f}
                    </button>
                 ))}
              </div>
           )}
        </div>

        {/* NPC DIALOGUE HEADER */}
        {activeTab === 'baseline' ? (
           <NPCCard citizenNum={2} name="OPERATIVE 02" accentColor="bg-cyan-400" textColor="text-cyan-600" glowColor="bg-cyan-400" statusTag="REAGENT_STOCK: HIGH" statusTag2="UPLINK: ACTIVE" prefix="◢COMMS: "
              dialogues={["Baseline equipment is essential for survival. Don't skimp on the armor.", "GX tokens are currently trading at a premium. Buy while stock lasts.", "Every piece of gear here is Syndicate-approved for Sector 7."]}
           />
        ) : (
           <NPCCard citizenNum={19} name="REECE THE SCAVENGER" accentColor="bg-amber-600" textColor="text-amber-800" glowColor="bg-amber-500" statusTag="MARKUP: 150x" statusTag2="ZONE: UNDERBELLY" prefix="◢SCRAP: "
              dialogues={["You want parts? I got parts. No questions, just cash.", "Dungeon RNG failing you? I'm your best friend now, hunter.", "The markup is high, but the supply is infinite. Underbelly rules."]}
           />
        )}

        {/* ITEM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'baseline' ? (
             SHOP_ITEMS.filter(item => {
                if (baselineFilter === 'ALL') return true;
                const cat = item.category?.toUpperCase();
                const type = item.type?.toUpperCase();
                return cat === baselineFilter || type === baselineFilter;
             }).map((item, index) => (
                <BaselineItemCard key={item.id} item={item} player={player} onBuy={() => handleBuyClick(item)} />
             ))
          ) : (
             <IndustrialMarket player={player} items={INDUSTRIAL_ITEMS} getIndustrialData={getIndustrialData} onBuy={handleBuyClick} />
          )}
        </div>
      </div>

      {/* PURCHASE MODAL */}
      {selectedItem && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <PurchaseModal item={selectedItem} player={player} qty={purchaseQty} setQty={setPurchaseQty} txStatus={txStatus} txCountdown={txCountdown} onConfirm={confirmPurchase} onCancel={() => setSelectedItem(null)} onReset={() => setTxStatus('idle')} getOwnedQty={getOwnedQty} />
        </div>,
        document.body
      )}

      {/* TUTORIAL MODAL */}
      {showTutorial && createPortal(
        <TutorialModal steps={tutorialSteps} currentStep={tutorialStep} next={nextStep} prev={() => setTutorialStep(s => s - 1)} dontShow={dontShowAgain} setDontShow={setDontShowAgain} />,
        document.body
      )}
    </div>
  );
});

const BaselineItemCard = ({ item, player, onBuy }) => {
  const isEquipped = item.type !== 'Consumable' && player.equipped?.[item.type]?.id === item.id;
  const isLocked = player.level < (item.reqLvl || 1);
  const rarity = item.rarity?.toLowerCase() || 'common';

  const rarityColors = {
    common: 'border-white bg-black',
    uncommon: 'border-emerald-500 bg-black',
    rare: 'border-blue-500 bg-black',
    epic: 'border-purple-500 bg-black',
    legendary: 'border-amber-500 bg-black'
  };

  const neonShadows = {
    common: 'shadow-[6px_6px_0px_0px_black]',
    uncommon: 'shadow-[6px_6px_0px_0px_var(--neon-lime)]',
    rare: 'shadow-[6px_6px_0px_0px_var(--neon-cyan)]',
    epic: 'shadow-[6px_6px_0px_0px_var(--neon-pink)]',
    legendary: 'shadow-[6px_6px_0px_0px_#ffae00]'
  };

  return (
    <div className={`group relative p-5 rounded-3xl border-[3px] transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4 overflow-hidden ${rarityColors[rarity]} ${neonShadows[rarity]} ${isLocked ? 'grayscale opacity-60' : ''}`}>
       <div className="halftone-overlay absolute inset-0 opacity-10 pointer-events-none"></div>
       
       <div className="flex gap-4 relative z-10">
          <div className={`w-16 h-16 rounded-2xl border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black] relative overflow-hidden bg-white`}>
             <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500">
                {item.icon || <Package className="text-black" />}
             </span>
          </div>

          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="text-sm font-black text-white uppercase italic tracking-tighter truncate bungee">{item.name}</h4>
                {isLocked && <span className="bg-red-500 text-black text-[7px] font-black px-2 py-0.5 border-2 border-black uppercase italic bungee">LVL {item.reqLvl} REQ</span>}
             </div>
             <p className="text-[9px] text-white/60 font-bold leading-tight uppercase italic line-clamp-2 bungee">{item.description}</p>
          </div>
       </div>

       <div className="flex flex-wrap gap-1.5 min-h-[16px] relative z-10">
          {item.stats && Object.entries(item.stats).map(([k, v]) => v !== 0 && (
             <span key={k} className="text-[8px] font-black px-2 py-1 rounded border-2 border-white/20 text-white uppercase italic bungee">
                {k} {v > 0 ? `+${v}` : v}
             </span>
          ))}
       </div>

       <div className="mt-auto pt-4 flex items-center justify-between border-t-2 border-white/10 relative z-10">
          <div className="flex flex-col">
             <span className="text-[8px] font-black text-white/40 uppercase tracking-widest italic bungee">Price Unit</span>
             <div className="flex items-center gap-1">
                <Coins size={12} className="text-[var(--neon-lime)]" />
                <span className="text-sm font-black text-white italic bungee">{item.cost.toLocaleString()} GX</span>
             </div>
          </div>

          <button 
             onClick={onBuy}
             disabled={isLocked}
             className={`px-5 py-2.5 rounded-xl border-[3px] border-black font-black text-[10px] uppercase tracking-tighter transition-all shadow-[4px_4px_0px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none italic flex items-center gap-2 bungee ${
                isLocked 
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed shadow-none' 
                : 'bg-[var(--neon-cyan)] text-black hover:bg-white'
             }`}
          >
             {isLocked ? <Lock size={12} /> : <ShoppingCart size={12} />}
             <span>{isLocked ? 'LOCKED' : isEquipped ? 'EQUIPPED' : 'PURCHASE'}</span>
          </button>
       </div>
    </div>
  );
};

const IndustrialMarket = ({ player, items, getIndustrialData, onBuy }) => {
  const isLocked = player.level < 10;

   if (isLocked) {
      return (
         <div className="col-span-full py-20 flex flex-col items-center justify-center bg-black border-[4px] border-dashed border-white/20 rounded-[3rem] gap-6 text-center backdrop-blur-sm relative overflow-hidden">
            <div className="halftone-overlay absolute inset-0 opacity-10 pointer-events-none"></div>
            <div className="relative z-10">
               <Lock size={80} className="text-white/20" />
            </div>
            <div className="relative z-10">
               <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter bungee">Underbelly Access Denied</h3>
               <p className="text-[10px] font-bold text-[var(--neon-pink)] uppercase tracking-[0.3em] mt-2 italic bungee">Requires Hunter Clearance Level 10</p>
            </div>
            <div className="bg-white text-black px-6 py-2 border-2 border-black rounded-full relative z-10 shadow-[4px_4px_0px_0px_black]">
               <span className="text-[9px] font-black uppercase italic bungee">Current Lvl: {player.level} // Status: Restricted</span>
            </div>
         </div>
      );
   }

  return items.map((rawItem, index) => {
     const item = getIndustrialData(rawItem);
     const rarityColors = {
        common: 'text-white border-white',
        uncommon: 'text-[var(--neon-lime)] border-[var(--neon-lime)]',
        rare: 'text-[var(--neon-cyan)] border-[var(--neon-cyan)]',
        epic: 'text-[var(--neon-pink)] border-[var(--neon-pink)]',
        legendary: 'text-[#ffae00] border-[#ffae00] animate-pulse'
     };

     return (
        <div key={item.id} className="group relative p-5 rounded-3xl bg-black border-[3px] border-white hover:border-[var(--neon-lime)] transition-all duration-500 flex flex-col gap-4 shadow-[6px_6px_0px_0px_black] overflow-hidden">
           <div className="halftone-overlay absolute inset-0 opacity-10 pointer-events-none"></div>
           <div className="flex gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl border-[3px] border-black bg-white flex items-center justify-center shadow-[4px_4px_0px_0px_black] relative">
                 <span className="text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform">{item.icon || '📦'}</span>
              </div>
              <div className="flex-1">
                 <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-black text-white uppercase italic tracking-tighter bungee">{item.name}</h4>
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border-2 uppercase italic bungee ${rarityColors[item.rarity]}`}>
                       {item.rarity}
                    </span>
                 </div>
                 <p className="text-[9px] text-white/60 font-bold leading-tight uppercase italic line-clamp-1 bungee">{item.description}</p>
              </div>
           </div>

           <div className="mt-auto pt-4 flex items-center justify-between border-t-2 border-white/10 relative z-10">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-white/40 uppercase italic bungee">Scav Price</span>
                 <div className="flex items-center gap-1">
                    <Zap size={10} className="text-[var(--neon-lime)]" />
                    <span className="text-sm font-black text-[var(--neon-lime)] italic bungee">{item.cost.toLocaleString()} GX</span>
                 </div>
              </div>

              <button 
                 onClick={() => onBuy(item)}
                 className="px-6 py-2.5 rounded-xl border-[3px] border-black font-black text-[10px] uppercase tracking-tighter transition-all shadow-[4px_4px_0px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none bg-[var(--neon-lime)] text-black hover:bg-white italic flex items-center gap-2 bungee"
              >
                 <TrendingUp size={12} />
                 <span>SCAVENGE</span>
              </button>
           </div>
        </div>
     );
  });
};

const PurchaseModal = ({ item, player, qty, setQty, txStatus, txCountdown, onConfirm, onCancel, onReset, getOwnedQty }) => {
   const totalCost = item.cost * (Number(qty) || 0);
   const canAfford = (player.tokens || 0) >= totalCost && qty !== '' && qty > 0;

   return (
      <div className="relative w-full max-w-sm bg-black border-[4px] border-white shadow-[12px_12px_0px_0px_black] rounded-[2.5rem] p-6 flex flex-col gap-5 overflow-hidden">
         <div className="halftone-overlay absolute inset-0 opacity-10 pointer-events-none"></div>
         
         <div className="flex items-center gap-4 relative z-10">
            <div className="w-20 h-20 bg-white border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_black] relative overflow-hidden group">
               <span className="text-5xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500">{item.icon || '📦'}</span>
            </div>
            <div className="flex-1">
               <h3 className="text-xl font-[1000] text-white italic uppercase tracking-tighter leading-none mb-2 bungee">{item.name}</h3>
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-[var(--neon-cyan)] uppercase italic tracking-widest flex items-center gap-1 bungee">
                     <Coins size={10} /> Bal: {(player.tokens || 0).toLocaleString()} GX
                  </span>
                  <span className="text-[9px] font-black text-[var(--neon-lime)] uppercase italic tracking-widest flex items-center gap-1 bungee">
                     <Package size={10} /> Owned: {getOwnedQty(item)} Units
                  </span>
               </div>
            </div>
         </div>

         {txStatus === 'idle' && (
            <>
               <div className="bg-white/5 p-5 rounded-3xl border-2 border-white/20 space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-white/40 uppercase italic bungee">Transaction Qty</span>
                     <div className="flex items-center gap-2 md:gap-4">
                        <button onClick={() => setQty(q => Math.max(1, (Number(q) || 1) - 1))} className="w-8 h-8 rounded-lg bg-red-500 text-black border-2 border-black font-black hover:bg-white transition-all flex justify-center items-center shadow-[2px_2px_0px_0px_black]">-</button>
                        <input 
                           type="number" 
                           min="1"
                           value={qty} 
                           onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 1) {
                                 setQty(val);
                              } else if (e.target.value === '') {
                                 setQty('');
                              }
                           }}
                           onBlur={() => {
                              if (qty === '' || qty < 1) setQty(1);
                           }}
                           className="text-xl font-black text-white w-16 text-center bg-transparent border-b-2 border-white focus:border-[var(--neon-cyan)] focus:outline-none transition-colors bungee"
                        />
                        <button onClick={() => setQty(q => (Number(q) || 0) + 1)} className="w-8 h-8 rounded-lg bg-[var(--neon-lime)] text-black border-2 border-black font-black hover:bg-white transition-all flex justify-center items-center shadow-[2px_2px_0px_0px_black]">+</button>
                     </div>
                  </div>

                  <div className="pt-4 border-t-2 border-white/10 flex items-center justify-between">
                     <span className="text-[10px] font-black text-white/40 uppercase italic bungee">Requisition Total</span>
                     <span className={`text-xl font-[1000] italic bungee ${canAfford ? 'text-white' : 'text-red-500 animate-pulse'}`}>
                        {totalCost.toLocaleString()} GX
                     </span>
                  </div>
               </div>

               <div className="flex gap-3 relative z-10">
                  <button onClick={onCancel} className="flex-1 py-4 rounded-2xl bg-black text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all italic border-2 border-white/20 bungee">DISMISS</button>
                  <button 
                     onClick={onConfirm}
                     disabled={!canAfford}
                     className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[6px_6px_0px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none italic border-[3px] border-black bungee ${
                        canAfford ? 'bg-[var(--neon-cyan)] text-black hover:bg-white' : 'bg-slate-800 text-slate-600 grayscale cursor-not-allowed border-slate-700 shadow-none'
                     }`}
                  >
                     {canAfford ? 'EXECUTE TRADE' : 'INSUFFICIENT FUNDS'}
                  </button>
               </div>
            </>
         )}

         {txStatus === 'submitting' && (
            <div className="py-10 flex flex-col items-center gap-6">
               <div className="relative">
                  <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-8 h-8 bg-cyan-500/20 rounded-full animate-ping"></div>
                  </div>
               </div>
               <div className="text-center">
                  <h4 className="text-sm font-black text-white italic uppercase tracking-[0.2em] animate-pulse">Uplink Synchronizing...</h4>
                  <p className="text-[9px] text-cyan-400 font-bold uppercase mt-2">Auto-Disconnect in {txCountdown}s</p>
               </div>
            </div>
         )}

         {txStatus === 'success' && (
            <div className="py-10 flex flex-col items-center gap-4 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-3xl animate-in zoom-in duration-500">
               <div className="w-16 h-16 bg-emerald-500 rounded-2xl border-2 border-black flex items-center justify-center shadow-[6px_6px_0_rgba(0,0,0,1)]">
                  <Check size={32} className="text-black" />
               </div>
               <h4 className="text-lg font-black text-emerald-400 italic uppercase tracking-tighter">Transaction Locked</h4>
            </div>
         )}

         {txStatus === 'failed' && (
            <div className="py-8 flex flex-col items-center gap-4 bg-red-500/10 border-2 border-red-500/50 rounded-3xl">
               <h4 className="text-sm font-black text-red-500 italic uppercase tracking-widest text-center px-6 leading-relaxed">Uplink Severed: Transaction Timed Out</h4>
               <button onClick={onReset} className="px-8 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-red-500 active:translate-x-1 active:translate-y-1 active:shadow-none italic text-[10px] mt-2 border-2 border-black">RECONNECT</button>
            </div>
         )}
      </div>
   );
};

const TutorialModal = ({ steps, currentStep, next, prev, dontShow, setDontShow }) => (
   <div className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-black border-[4px] border-white rounded-[3rem] overflow-hidden flex flex-col animate-in zoom-in duration-500 shadow-[12px_12px_0px_0px_black]">
         <div className="halftone-overlay absolute inset-0 opacity-10 pointer-events-none"></div>
         <div className="bg-[var(--neon-cyan)] py-4 px-8 border-b-[4px] border-black relative">
            <h2 className="text-xl font-black text-black uppercase italic tracking-tighter bungee">{steps[currentStep].title}</h2>
            <div className="absolute top-1/2 -translate-y-1/2 right-4 px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase rounded-sm bungee">
               B0-{currentStep + 1}
            </div>
         </div>

         <div className="p-8 flex flex-col gap-6 relative z-10">
            <div className="flex items-center gap-6">
               <div className="w-24 h-36 rounded-3xl border-[3px] border-black bg-white overflow-hidden shadow-[6px_6px_0px_0px_black] relative">
                  <AvatarMedia num={steps[currentStep].npc} animated={true} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 py-1 bg-black text-[8px] font-black text-[var(--neon-cyan)] text-center uppercase italic bungee">Broker</div>
               </div>
               <div className="flex-1 space-y-4">
                  <div className="bg-white p-4 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_black] relative">
                     <p className="text-xs font-bold text-black italic leading-relaxed bungee">"{steps[currentStep].text}"</p>
                     <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-3 h-3 bg-white border-l-[3px] border-b-[3px] border-black rotate-45"></div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Info size={14} className="text-[var(--neon-cyan)]" />
                     <span className="text-[9px] font-black text-white/40 uppercase italic leading-none bungee">{steps[currentStep].hint}</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-4 mt-4">
               <div className="flex items-center justify-center gap-2">
                  <input type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)} className="w-4 h-4 rounded bg-black border-2 border-white checked:bg-[var(--neon-cyan)]" />
                  <span className="text-[10px] font-black text-white/40 uppercase italic bungee">Suppress future transmissions</span>
               </div>
               <div className="flex gap-2">
                  {currentStep > 0 && (
                     <button onClick={prev} className="flex-1 py-4 bg-black text-white/40 rounded-2xl font-black text-[10px] uppercase italic border-2 border-white/20 bungee">BACK</button>
                  )}
                  <button onClick={next} className="flex-[2] py-4 bg-[var(--neon-cyan)] text-black rounded-2xl font-black text-[10px] uppercase italic border-[3px] border-black shadow-[6px_6px_0px_0px_black] hover:bg-white active:translate-x-1 active:translate-y-1 active:shadow-none bungee">
                     {currentStep === steps.length - 1 ? 'BEGIN COMMERCE' : 'NEXT TRANSMISSION'}
                  </button>
               </div>
            </div>
         </div>
      </div>
   </div>
);
