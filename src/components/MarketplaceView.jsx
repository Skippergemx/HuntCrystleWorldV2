import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShoppingBag, 
  Tag, 
  Filter, 
  Search, 
  Plus, 
  X, 
  CreditCard, 
  User, 
  History,
  AlertTriangle,
  ArrowRightLeft,
  Check,
  Sparkles
} from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { NPCCard } from './NPCCard';
import { useGame } from '../contexts/GameContext';

export const MarketplaceView = React.memo(() => {
  const { player, market, adventure, actions, openGuide, ITEMS } = useGame();
  const { setView } = adventure;
  const { marketplace: listings, purchaseMarketItem: purchaseItem, listMarketItem: listItem, cancelMarketListing: cancelListing } = market;
  
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'sell', 'my_listings'
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedToSell, setSelectedToSell] = useState(null);
  const [selectedToBuy, setSelectedToBuy] = useState(null);
  const [sellPrice, setSellPrice] = useState(100);
  const [sellCount, setSellCount] = useState(1);
  const [buyCount, setBuyCount] = useState(1);

  const [txStatus, setTxStatus] = useState('idle');
  const [txCountdown, setTxCountdown] = useState(30);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const getOwnedQty = (item) => {
    if (!item) return 0;
    if (item.id === 'hp_potion') return player.potions || 0;
    if (item.id === 'auto_scroll') return player.autoScrolls || 0;
    const master = getMasterData(item);
    const id = master?.id || item.id?.replace(/(_\d+)+$/, '') || item.name;
    return Object.values(player.inventory || {}).filter(i => {
       if (!i) return false;
       const iMaster = getMasterData(i);
       const cleanId = iMaster?.id || i.id?.replace(/(_\d+)+$/, '') || i.name;
       return cleanId === id;
    }).length;
  };

  useEffect(() => {
    const isHidden = localStorage.getItem('hide_market_tutorial') === 'true';
    if (!isHidden) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, []);

  const tutorialSteps = [
    {
      title: "Open Grid Market",
      npc: 1,
      visualType: 'trade',
      text: "The Open Grid is a decentralized, player-to-player marketplace. Every piece of equipment or resource here is listed by another Hunter.",
      hint: "Tip: Prices fluctuate based on supply and demand."
    },
    {
      title: "Acquiring Assets",
      npc: 3,
      visualType: 'buy',
      text: "Browse the 'Acquire' tab to find gear that others have scavenged. If you have the GX Tokens, you can purchase them instantly.",
      hint: "Strategy: Filter by category to find upgrades fast."
    },
    {
      title: "Selling Signals",
      npc: 5,
      visualType: 'sell',
      text: "List your own surplus gear on the 'Sell Signal' tab. Note that the network takes a 5% Terminal Tax upon a successful exchange.",
      hint: "Warning: Listings are public until purchased or canceled."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_market_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  // Robust Item Data Resolver
  const getMasterData = (itemOrId) => {
    if (!itemOrId) return null;
    const item = typeof itemOrId === 'object' ? itemOrId : null;
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    const cleanId = id?.replace(/(_\d+)+$/, '');
    
    const byId = ITEMS.find(i => i.id === cleanId);
    if (byId) return byId;

    if (item && item.name) {
      const byName = ITEMS.find(i => i.name?.toLowerCase() === item.name.toLowerCase());
      if (byName) return byName;
    }

    return item;
  };

  const filteredListings = useMemo(() => {
    return (listings || []).filter(l => {
      if (l.sellerUid === player.uid && activeTab !== 'my_listings') return false; 
      const master = getMasterData(l.item);
      const matchesType = filterType === 'all' || master?.category === filterType || master?.type === filterType;
      const matchesSearch = master?.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [listings, filterType, searchQuery, player.uid, activeTab, ITEMS]);

  const inventoryForSale = useMemo(() => {
    // 1. Filter raw inventory
    const raw = Object.values(player.inventory || {}).filter(item => {
      if (!item || typeof item !== 'object') return false;
      const master = getMasterData(item);
      const matchesType = filterType === 'all' || master?.category === filterType || master?.type === filterType;
      const matchesSearch = master?.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });

    // 2. Stack items by Master ID or Name fallback
    return raw.reduce((acc, item) => {
      const master = getMasterData(item);
      const baseId = master?.id || item.id?.replace(/(_\d+)+$/, '') || item.name;
      const existing = acc.find(i => {
         const iMaster = getMasterData(i);
         const iBaseId = iMaster?.id || i.id?.replace(/(_\d+)+$/, '') || i.name;
         return iBaseId === baseId;
      });
      if (existing) {
        existing.count = (existing.count || 1) + 1;
      } else {
        acc.push({ ...item, count: 1 });
      }
      return acc;
    }, []);
  }, [player.inventory, filterType, searchQuery, ITEMS]);

  const myListings = useMemo(() => {
    return (listings || []).filter(l => l.sellerUid === player.uid);
  }, [listings, player.uid]);

  const handleOpenListModal = (item) => {
    setSelectedToSell(item);
    setSellCount(1); // Default to 1
    const master = getMasterData(item);
    // Suggest 80% of cost if available, else 10
    setSellPrice(master?.cost ? Math.max(1, Math.floor(master.cost * 0.1)) : 10); 
    setIsListingModalOpen(true);
  };

  const handleOpenPurchaseModal = (listing) => {
    setSelectedToBuy(listing);
    setBuyCount(1);
    setTxStatus('idle');
    setIsPurchaseModalOpen(true);
  };

  const confirmPurchase = async () => {
    setTxStatus('submitting');
    let timeLeft = 30;
    setTxCountdown(timeLeft);
    
    const interval = setInterval(() => {
      timeLeft -= 1;
      setTxCountdown(timeLeft);
    }, 1000);

    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve('TIMEOUT'), 30000)
    );

    try {
      const result = await Promise.race([
        purchaseItem(selectedToBuy, buyCount),
        timeoutPromise
      ]);

      clearInterval(interval);

      if (result === 'TIMEOUT') {
        setTxStatus('failed');
      } else if (result) {
        setTxStatus('success');
        setTimeout(() => {
          setSelectedToBuy(null);
          setIsPurchaseModalOpen(false);
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

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      <Header title="OPEN GRID: MARKET" onClose={adventure.goBack} npcNum={25} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
      }} icon={<ArrowRightLeft className="text-amber-500" />} />

      <NPCCard
        citizenNum={25}
        name="BROKER"
        accentColor="bg-emerald-500"
        textColor="text-emerald-600"
        glowColor="bg-emerald-500"
        statusTag="GRID_LIVE"
        statusTag2="SIGNALS_ACTIVE"
        prefix="◢BROKER: "
        dialogues={[
          "Welcome to the Open Grid! Buy and sell gear with hunters across the network.",
          "A 5% terminal tax is levied on every successful sale. Factor it into your ask.",
          "Scan the Acquire tab frequently — Legendary drops appear and vanish fast.",
          "Listing surplus loot at fair prices keeps the market liquid for everyone.",
          "Filter by type to cut through the noise and find exactly what you need.",
          "Early hunters can fund entire upgrades by flipping common dungeon drops.",
          "Never overpay. Check the Archive for base item cost before you bid.",
          "The market is global. Someone out there has what your build is missing."
        ]}
      />

      {/* ACTION TABS */}
      <div className="flex gap-2 mb-4 relative z-10 overflow-x-auto pb-1 no-scrollbar shrink-0">
        {[
          { id: 'browse', label: 'Acquire', icon: <ShoppingBag size={14} /> },
          { id: 'sell', label: 'Sell Signal', icon: <Plus size={14} /> },
          { id: 'my_listings', label: 'Current Broadcasts', icon: <History size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setFilterType('all'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase italic tracking-widest border-2 transition-all shrink-0 ${activeTab === tab.id ? 'bg-amber-500 border-black text-black shadow-[3px_3px_0_rgba(0,0,0,1)] -translate-y-0.5' : 'bg-slate-900 border-white/10 text-slate-400 hover:border-amber-500/50'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* GLOBAL FILTERS */}
      <div className="flex flex-wrap gap-2 md:gap-4 items-center bg-black/40 p-2 md:p-3 rounded-lg border border-white/5 relative z-10 mb-4 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[150px] md:min-w-[200px]">
           <Search size={14} className="text-slate-500" />
           <input 
             type="text" 
             placeholder="FILTER SIGNAL SOURCE..." 
             className="bg-transparent text-[9px] md:text-[10px] font-black uppercase text-white placeholder:text-slate-700 w-full focus:outline-none"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
           {['Equipment', 'Material', 'Fruit', 'Consumable'].map(t => (
             <button
               key={t}
               onClick={() => setFilterType(filterType === t ? 'all' : t)}
               className={`px-2 py-1 text-[7px] md:text-[8px] font-black uppercase rounded border transition-all whitespace-nowrap ${filterType === t ? 'bg-amber-500 border-amber-600 text-black' : 'bg-slate-900 border-white/5 text-slate-600'}`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="space-y-4 flex-1 flex flex-col min-h-0 relative z-10">
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredListings.length > 0 ? filteredListings.map((l) => {
              const master = getMasterData(l.item);
              const rarity = master?.rarity || 'Common';
              return (
                <div key={l.id} className="bg-white border-[3px] border-black p-4 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center group hover:-translate-y-1 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] relative overflow-hidden">
                   <div className="flex gap-3 md:gap-4 items-center w-full md:w-auto">
                      <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 bg-slate-950 flex items-center justify-center text-2xl md:text-3xl border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] ${rarity === 'Legendary' ? 'border-amber-400' : ''}`}>
                         {master?.icon || '📦'}
                      </div>
                      <div className="min-w-0 flex-1">
                         <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm md:text-base font-black text-black uppercase italic leading-none truncate max-w-[120px] md:max-w-none">{master?.name}</h4>
                            {l.quantity > 1 && <span className="text-[9px] md:text-[10px] font-black text-amber-500 italic bg-black/5 px-1.5 border border-black/10">x{l.quantity}</span>}
                            <span className={`text-[6px] md:text-[7px] font-black px-1 border border-black uppercase ${rarity === 'Legendary' ? 'bg-amber-400 text-black' : 'bg-slate-100 text-slate-400'}`}>{rarity}</span>
                         </div>
                         <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase mt-0.5">SELLER: {l.sellerName?.substring(0, 10) || 'ANON'}</p>
                         <p className="text-[7px] font-bold text-slate-500 uppercase mt-0.5 leading-none italic line-clamp-1">{master?.description || "Signal source detected."}</p>
                      </div>
                   </div>
 
                   <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 w-full md:w-auto pt-3 md:pt-0 border-t-2 md:border-t-0 border-black/5">
                      <div className="bg-amber-100 px-3 py-1 border-2 border-black transform rotate-2">
                         <span className="text-xs font-black text-black">{l.price} GX</span>
                         <span className="text-[6px] font-bold text-slate-400 block tracking-widest text-center leading-none">PER UNIT</span>
                      </div>
                      <button
                        onClick={() => handleOpenPurchaseModal(l)}
                        disabled={player.tokens < l.price || l.sellerUid === player.uid}
                        className={`px-6 py-2 border-2 border-black text-[9px] font-black uppercase tracking-tighter shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${player.tokens >= l.price && l.sellerUid !== player.uid ? 'bg-cyan-400 hover:bg-cyan-300 text-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}
                      >
                        {l.sellerUid === player.uid ? 'BROADCASTING' : 'ACQUIRE'}
                      </button>
                   </div>
                </div>
              );
            }) : (
              <div className="col-span-full py-20 flex flex-col items-center opacity-20 grayscale">
                 <ShoppingBag size={48} />
                 <p className="text-xs font-black uppercase mt-4 italic tracking-[0.3em]">No valid signals in the grid</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sell' && (
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
           <div className="bg-amber-500/5 border border-amber-500/20 p-2 md:p-3 rounded-lg mb-4 flex gap-3 items-center">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <p className="text-[7px] md:text-[9px] font-black text-amber-500 uppercase italic leading-tight">
                NOTICE: Open Grid listings carry a 5% terminal tax upon successful exchange. Signals are persistent until acquired or terminated.
              </p>
           </div>

           <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 pb-4">
              {inventoryForSale.map((item, i) => {
                const master = getMasterData(item);
                const rarity = master?.rarity || 'Common';
                const icon = master?.icon || '📦';
                
                return (
                  <div 
                    key={i}
                    onClick={() => handleOpenListModal(item)}
                    className="group bg-slate-900/50 border-2 border-white/5 p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900 hover:border-amber-500/50 transition-all hover:translate-x-1"
                  >
                     <div className="flex items-center gap-4">
                        <div className="relative">
                           <div className={`w-12 h-12 bg-black border-2 border-black flex items-center justify-center text-3xl group-hover:scale-110 transition-transform ${rarity === 'Legendary' ? 'border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : ''}`}>
                               {icon}
                           </div>
                           {item.count > 1 && (
                               <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[8px] font-black px-1 rounded-sm border border-black">x{item.count}</div>
                           )}
                        </div>
                        <div className="min-w-0">
                           <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white uppercase italic leading-none truncate">{master?.name}</h4>
                              <span className={`text-[6px] font-black px-1 border border-white/10 uppercase ${rarity === 'Legendary' ? 'text-amber-400' : 'text-slate-500'}`}>{rarity}</span>
                           </div>
                           <p className="text-[8px] font-black text-slate-500 uppercase mt-1 opacity-60">Source: {master?.category || master?.type || 'MATERIAL'}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                           <p className="text-[8px] font-black text-slate-600 uppercase">Valuation Suggestion</p>
                           <p className="text-xs font-black text-amber-500 italic">{master?.cost ? `${Math.floor(master.cost * 0.1)} GX` : 'SIGNAL LOW'}</p>
                        </div>
                        <button className="h-10 px-4 bg-slate-800 border-2 border-white/10 text-[9px] font-black text-white uppercase tracking-tighter group-hover:bg-amber-500 group-hover:text-black group-hover:border-black transition-all">
                           LIST SIGNAL
                        </button>
                     </div>
                  </div>
                );
              })}
              {inventoryForSale.length === 0 && (
                <div className="py-20 text-center opacity-20 flex flex-col items-center">
                   <Plus size={48} />
                   <p className="text-[10px] font-black uppercase mt-4 italic tracking-widest">No targetable assets in current sector</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'my_listings' && (
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myListings.map((l) => (
                <div key={l.id} className="bg-slate-900 border-2 border-amber-500/30 p-4 flex justify-between items-center rounded-xl shadow-xl">
                   <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-black flex items-center justify-center text-2xl border border-white/10 rounded lg">
                         {l.item.icon}
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-white uppercase italic leading-none">{l.item.name}{l.quantity > 1 && <span className="text-amber-500 font-bold not-italic ml-1 opacity-80">x{l.quantity}</span>}</h4>
                         <p className="text-[10px] font-black text-amber-500 mt-1 uppercase italic">{l.price} GX PER UNIT</p>
                         <p className="text-[7px] font-bold text-slate-600 uppercase mt-1">
                           Listed {new Date(l.createdAt).toLocaleDateString()}
                         </p>
                      </div>
                   </div>
                   <button
                     onClick={() => cancelListing(l.id)}
                     className="p-3 bg-red-900/20 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-lg"
                     title="Cancel Listing"
                   >
                     <X size={16} />
                   </button>
                </div>
              ))}
              {myListings.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20">
                   <p className="text-xs font-black uppercase italic tracking-widest">No active sales signals detected</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* LISTING MODAL PORTAL (SELL) */}
      {isListingModalOpen && selectedToSell && createPortal(
        (() => {
          const master = getMasterData(selectedToSell);
          const rarity = master?.rarity || 'Common';
          const stats = master?.stats || selectedToSell.stats || {};
          const totalValue = sellPrice * sellCount;
          
          return (
            <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 md:p-4 overflow-hidden">
               <div className="bg-slate-900 border-[3px] border-white/20 p-5 md:p-8 w-full max-w-sm md:max-w-md relative shadow-2xl animate-in zoom-in duration-200 rounded-3xl transition-all max-h-[90vh] flex flex-col overflow-hidden">
                  <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    <button 
                      onClick={() => setIsListingModalOpen(false)}
                      className="absolute top-4 right-4 w-10 h-10 bg-white/5 text-white/40 hover:text-white flex items-center justify-center hover:bg-white/10 transition-colors rounded-full z-50"
                    >
                      <X size={20} />
                    </button>

                    <div className="text-center mb-6 relative mt-4">
                       <div className={`w-24 h-24 mx-auto bg-black border-4 border-black flex items-center justify-center text-6xl mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${rarity === 'Legendary' ? 'border-amber-400' : ''}`}>
                          {master?.icon || '📦'}
                       </div>
                       <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{master?.name}</h2>
                       <p className="text-[10px] font-black text-amber-500 uppercase mt-2 tracking-widest">Constructing Sales Signal</p>
                    </div>

                    <div className="space-y-6 relative pb-4">
                        <div className="flex gap-4">
                           <div className="flex-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase italic block mb-2 text-center">Batch Size</label>
                              <div className="flex gap-2">
                                 <div className="flex-1 relative">
                                    <input 
                                      type="number" 
                                      value={sellCount}
                                      min="1"
                                      max={selectedToSell.count}
                                      onChange={(e) => setSellCount(Math.max(1, Math.min(selectedToSell.count, parseInt(e.target.value) || 1)))}
                                      className="w-full bg-black border-2 border-white/10 p-4 font-black text-white text-xl italic focus:outline-none focus:border-amber-500 transition-colors pl-12 rounded-2xl"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 font-black italic">Qty:</div>
                                 </div>
                              </div>
                           </div>

                           <div className="flex-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase italic block mb-2 text-center">Price Per Unit</label>
                              <div className="flex gap-2">
                                 <div className="flex-1 relative">
                                    <input 
                                      type="number" 
                                      value={sellPrice}
                                      onChange={(e) => setSellPrice(Math.max(1, parseInt(e.target.value) || 0))}
                                      className="w-full bg-black border-2 border-white/10 p-4 font-black text-white text-xl italic focus:outline-none focus:border-amber-500 transition-colors pl-12 rounded-2xl"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 font-black italic">GX:</div>
                                 </div>
                              </div>
                           </div>
                        </div>

                       <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-amber-500">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase mb-1 opacity-60">
                             <span>Signal Strength: {sellCount} Unit(s) @ {sellPrice} GX</span>
                             <span>{totalValue.toLocaleString()} GX</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] font-black uppercase mb-1 opacity-60">
                             <span>Terminal Processing Tax (5%)</span>
                             <span>- {Math.floor(totalValue * 0.05).toLocaleString()} GX</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-black uppercase pt-1 border-t border-amber-500/20">
                             <span>Net Credits Projected</span>
                             <span className="text-white">{(totalValue - Math.floor(totalValue * 0.05)).toLocaleString()} GX</span>
                          </div>
                       </div>

                       <button
                         onClick={() => {
                           listItem(selectedToSell, totalValue, sellCount);
                           setIsListingModalOpen(false);
                         }}
                         className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black uppercase italic text-lg shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-95 transition-all outline-none"
                       >
                         CONFIRM BROADCAST
                       </button>
                    </div>
                  </div>
               </div>
            </div>
          );
        })(),
        document.body
      )}

      {/* PURCHASE MODAL PORTAL (BUY) */}
      {isPurchaseModalOpen && selectedToBuy && createPortal(
        (() => {
          const master = getMasterData(selectedToBuy.item);
          const rarity = master?.rarity || 'Common';
          const totalCost = selectedToBuy.price * buyCount;
          
          return (
            <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 md:p-4 overflow-hidden">
               <div className="bg-slate-900 border-[3px] border-cyan-500/20 p-5 md:p-8 w-full max-w-sm md:max-w-md relative shadow-2xl animate-in zoom-in duration-200 rounded-3xl transition-all max-h-[90vh] flex flex-col overflow-hidden">
                  <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    <button 
                      onClick={() => {
                        if (txStatus === 'submitting') return;
                        setIsPurchaseModalOpen(false);
                      }}
                      className={`absolute top-4 right-4 w-10 h-10 bg-white/5 text-white/40 hover:text-white flex items-center justify-center hover:bg-white/10 transition-colors rounded-full z-50 ${txStatus === 'submitting' ? 'opacity-50 cursor-not-allowed hidden' : ''}`}
                    >
                      <X size={20} />
                    </button>

                    <div className="text-center mb-6 relative mt-4">
                       <div className={`w-24 h-24 mx-auto bg-black border-4 border-black flex items-center justify-center text-6xl mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${rarity === 'Legendary' ? 'border-amber-400' : ''}`}>
                          {selectedToBuy.item.icon}
                       </div>
                       <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedToBuy.item.name}</h2>
                       <p className="text-xs text-slate-400 font-bold uppercase mt-2 italic tracking-widest">SELLER: <span className="text-white">{selectedToBuy.sellerName || 'ANON'}</span></p>
                       <div className="flex justify-center gap-4 mt-3 mb-2">
                          <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Available: <span className="text-white">{player.tokens || 0} GX</span></p>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Owned: <span className="text-white">{getOwnedQty(selectedToBuy.item)} Units</span></p>
                       </div>
                    </div>

                    <div className="space-y-6 relative pb-4">
                        {txStatus === 'idle' && (
                          <>
                            <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase italic block mb-2 text-center">Target Quantity</label>
                               <div className="flex gap-2 h-14">
                                  <button onClick={() => setBuyCount(p => Math.max(1, p - 1))} className="w-14 shrink-0 flex items-center justify-center bg-cyan-500/10 text-cyan-500 font-black text-2xl border-2 border-cyan-500/20 rounded-2xl hover:bg-cyan-500/20 transition-all">-</button>
                                  <div className="flex-1 relative">
                                     <input 
                                       type="number" 
                                       value={buyCount}
                                       min="1"
                                       max={selectedToBuy.quantity}
                                       onChange={(e) => setBuyCount(Math.max(1, Math.min(selectedToBuy.quantity, parseInt(e.target.value) || 1)))}
                                       className="w-full h-full bg-black border-2 border-white/10 text-center font-black text-white text-xl italic focus:outline-none focus:border-cyan-500 transition-colors rounded-2xl"
                                     />
                                  </div>
                                  <button onClick={() => setBuyCount(p => Math.min(selectedToBuy.quantity, p + 1))} className="w-14 shrink-0 flex items-center justify-center bg-cyan-500/10 text-cyan-500 font-black text-2xl border-2 border-cyan-500/20 rounded-2xl hover:bg-cyan-500/20 transition-all">+</button>
                                  <button onClick={() => setBuyCount(selectedToBuy.quantity)} className="px-4 bg-cyan-500/10 text-cyan-500 text-[10px] font-black border-2 border-cyan-500/20 rounded-2xl hover:bg-cyan-500/20 font-bold transition-all">MAX</button>
                               </div>
                            </div>

                           <div className="bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/20 text-cyan-500">
                              <div className="flex justify-between items-center text-[9px] font-black uppercase mb-1 opacity-60">
                                 <span>Signal Strength: {buyCount} Unit(s) @ {selectedToBuy.price} GX</span>
                                 <span>{totalCost.toLocaleString()} GX</span>
                              </div>
                              <div className="flex justify-between items-center text-sm font-black uppercase pt-1 border-t border-cyan-500/20">
                                 <span>Total Credits Required</span>
                                 <span className="text-white">{totalCost.toLocaleString()} GX</span>
                              </div>
                           </div>
                          </>
                        )}

                        {txStatus === 'submitting' && (
                          <div className="bg-amber-500/10 border-2 border-amber-500 py-12 px-6 flex flex-col items-center justify-center rounded-2xl">
                             <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                             <h4 className="text-amber-500 font-black text-lg uppercase tracking-widest italic animate-pulse">PROCESSING TRANSFER</h4>
                             <p className="text-xs text-amber-500/70 font-bold uppercase mt-2">Awaiting network confirmation...</p>
                             <div className="mt-4 px-4 py-1 bg-amber-500/20 rounded-full font-black text-amber-500 text-[10px] tracking-widest uppercase">
                               Timeout in: <span className="text-white">{txCountdown}s</span>
                             </div>
                             {txCountdown < 10 && (
                                <p className="text-[10px] text-amber-500 font-black uppercase mt-2 animate-bounce">Slow network detected. Please wait...</p>
                             )}
                          </div>
                        )}

                        {txStatus === 'success' && (
                          <div className="bg-cyan-500/10 border-2 border-cyan-500 py-12 px-6 flex flex-col items-center justify-center rounded-2xl animate-in fade-in zoom-in">
                             <div className="w-16 h-16 bg-cyan-500 text-black flex items-center justify-center rounded-full mb-4 shadow-[0_0_20px_rgba(34,211,238,0.5)] transform -rotate-6">
                               <Check size={32} />
                             </div>
                             <h4 className="text-cyan-400 font-black text-xl uppercase tracking-widest italic">TRANSFER COMPLETE</h4>
                             <p className="text-xs text-cyan-400/80 font-bold uppercase mt-2 text-center">Your funds have been deposited.</p>
                             <div className="flex items-center gap-1 text-emerald-400 mt-2">
                                <Sparkles size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Inventory Updated</span>
                             </div>
                          </div>
                        )}

                        {txStatus === 'failed' && (
                          <div className="bg-red-500/10 border-2 border-red-500 py-12 px-6 flex flex-col items-center justify-center rounded-2xl">
                             <div className="w-16 h-16 bg-red-500 text-white flex items-center justify-center rounded-full mb-4 shadow-[0_0_20px_rgba(239,68,68,0.5)] transform -rotate-6">
                               <X size={32} />
                             </div>
                             <h4 className="text-red-400 font-black text-xl uppercase tracking-widest italic">TRANSFER FAILED</h4>
                             <p className="text-xs text-red-400/80 font-bold uppercase mt-2 text-center">The signal was lost or timed out.</p>
                             <button 
                               onClick={() => setTxStatus('idle')}
                               className="mt-6 px-6 py-2 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all rounded-xl"
                             >
                               TRY AGAIN
                             </button>
                          </div>
                        )}

                       {txStatus === 'idle' && (
                         <button
                           onClick={confirmPurchase}
                           disabled={player.tokens < totalCost}
                           className={`w-full py-5 rounded-2xl font-black uppercase italic text-lg transition-all outline-none ${player.tokens >= totalCost ? 'bg-cyan-400 text-black shadow-[0_10px_30px_rgba(34,211,238,0.2)] hover:scale-[1.02] active:scale-95' : 'bg-slate-800 text-slate-600 grayscale cursor-not-allowed'}`}
                         >
                           {player.tokens >= totalCost ? 'AUTHORIZE TRANSFER' : 'INSUFFICIENT CREDITS'}
                         </button>
                       )}
                    </div>
                  </div>
               </div>
            </div>
          );
        })(),
        document.body
      )}

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-amber-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #d97706 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-amber-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-black text-center uppercase tracking-tighter italic drop-shadow-[2px_2px_0_rgba(255,255,255,0.3)]">
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
                   <div className="absolute inset-x-0 bottom-0 bg-amber-600 text-[6px] font-black text-black text-center py-0.5 uppercase italic">SYSTEM</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-amber-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-amber-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'trade' && (
                     <ArrowRightLeft className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] z-10 animate-pulse" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'buy' && (
                     <ShoppingBag className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] z-10 animate-bounce" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'sell' && (
                     <Tag className="text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-amber-400 animate-spin-slow"></div>
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

                <div className="bg-black/60 p-1.5 rounded-lg border border-amber-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-amber-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-amber-500' : 'bg-slate-800'}`}
                   >
                     {dontShowAgain && <Check size={10} className="text-black" />}
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
                    className="flex-[2] bg-amber-600 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-amber-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'CONNECT TO GRID' : 'TRANSMIT MORE'}
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
});
