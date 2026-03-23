import React, { useState, useMemo } from 'react';
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
  ArrowRightLeft
} from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const MarketplaceView = React.memo(() => {
  const { player, market, adventure, actions, openGuide, ITEMS } = useGame();
  const { setView } = adventure;
  const { marketplace: listings, purchaseMarketItem: purchaseItem, listMarketItem: listItem, cancelMarketListing: cancelListing } = market;
  
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'sell', 'my_listings'
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [selectedToSell, setSelectedToSell] = useState(null);
  const [sellPrice, setSellPrice] = useState(100);
  const [sellCount, setSellCount] = useState(1);

  // Robust Item Data Resolver
  const getMasterData = (itemOrId) => {
    if (!itemOrId) return null;
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    const cleanId = id?.split('_')[0];
    return ITEMS.find(i => i.id === cleanId) || (typeof itemOrId === 'object' ? itemOrId : null);
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
    const raw = (player.inventory || []).filter(item => {
      if (!item || typeof item !== 'object') return false;
      const master = getMasterData(item);
      const matchesType = filterType === 'all' || master?.category === filterType || master?.type === filterType;
      const matchesSearch = master?.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });

    // 2. Stack items by ID
    return raw.reduce((acc, item) => {
      const baseId = item.id?.split('_')[0];
      const existing = acc.find(i => i.id?.split('_')[0] === baseId);
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
    // Suggest 80% of cost if available, else 100
    setSellPrice(master?.cost ? Math.floor(master.cost * 0.8) : 100); 
    setIsListingModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      <Header title="OPEN GRID: MARKET" onClose={() => setView('menu')} onHelp={() => openGuide('menu')} icon={<ArrowRightLeft className="text-amber-500" />} />

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
                <div key={l.id} className="bg-white border-[3px] border-black p-4 flex justify-between items-center group hover:-translate-y-1 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] relative overflow-hidden">
                   <div className="flex gap-4 items-center">
                      <div className={`w-12 h-12 bg-slate-950 flex items-center justify-center text-3xl border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] ${rarity === 'Legendary' ? 'border-amber-400' : ''}`}>
                         {master?.icon || '📦'}
                      </div>
                      <div className="min-w-0">
                         <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-black uppercase italic leading-none truncate">{master?.name}</h4>
                            {l.quantity > 1 && <span className="text-[10px] font-black text-amber-500 italic bg-black/5 px-1.5 border border-black/10">x{l.quantity}</span>}
                            <span className={`text-[7px] font-black px-1 border border-black uppercase ${rarity === 'Legendary' ? 'bg-amber-400 text-black' : 'bg-slate-100 text-slate-400'}`}>{rarity}</span>
                         </div>
                         <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">SDR: {l.sellerName?.substring(0, 10) || 'ANON'}</p>
                         <p className="text-[7px] font-bold text-slate-500 uppercase mt-1 leading-none italic line-clamp-1">{master?.description || "Signal source detected."}</p>
                      </div>
                   </div>

                   <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="bg-amber-100 px-3 py-1 border-2 border-black transform rotate-2">
                         <span className="text-xs font-black text-black">{l.price} GX</span>
                      </div>
                      <button
                        onClick={() => purchaseItem(l)}
                        disabled={player.tokens < l.price || l.sellerUid === player.uid}
                        className={`px-4 py-2 border-2 border-black text-[9px] font-black uppercase tracking-tighter shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${player.tokens >= l.price && l.sellerUid !== player.uid ? 'bg-cyan-400 hover:bg-cyan-300 text-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}
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
                           <p className="text-xs font-black text-amber-500 italic">{master?.cost ? `${Math.floor(master.cost * 0.8)} GX` : 'SIGNAL LOW'}</p>
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
                         <p className="text-[10px] font-black text-amber-500 mt-1 uppercase italic">{l.price} GX LISTED</p>
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

      {/* LISTING MODAL PORTAL */}
      {isListingModalOpen && selectedToSell && createPortal(
        (() => {
          const master = getMasterData(selectedToSell);
          const rarity = master?.rarity || 'Common';
          const stats = master?.stats || selectedToSell.stats || {};
          
          return (
            <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
               <div className="bg-slate-900 border-[3px] border-white/20 p-6 md:p-8 w-full max-w-md relative shadow-2xl animate-in zoom-in duration-200 rounded-3xl overflow-hidden shadow-amber-500/10 transition-all">
                  {/* Visual Flair */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  
                  <button 
                    onClick={() => setIsListingModalOpen(false)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/5 text-white/40 hover:text-white flex items-center justify-center hover:bg-white/10 transition-colors rounded-full"
                  >
                    <X size={20} />
                  </button>

                  <div className="text-center mb-6 relative">
                     <div className={`w-24 h-24 mx-auto bg-black border-4 border-black flex items-center justify-center text-6xl mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${rarity === 'Legendary' ? 'border-amber-400' : ''}`}>
                        {master?.icon || '📦'}
                     </div>
                     <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{master?.name}</h2>
                     <div className="flex justify-center gap-2 mt-2">
                        <span className={`text-[8px] font-black px-2 py-0.5 border border-white/10 uppercase rounded-sm ${rarity === 'Legendary' ? 'bg-amber-500 text-black' : 'text-slate-500'}`}>{rarity}</span>
                        <span className="text-[8px] font-black px-2 py-0.5 border border-white/10 uppercase text-slate-400 rounded-sm italic">UNSTABLE BROADCAST</span>
                     </div>
                  </div>

                  <div className="space-y-6 relative">
                     {/* Item Details */}
                     <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-3">
                        <p className="text-[9px] font-bold text-slate-500 uppercase italic text-center">"{master?.description || "Signal source validation pending."}"</p>
                        
                        {Object.keys(stats).length > 0 && (
                          <div className="flex flex-wrap justify-center gap-3 pt-2 border-t border-white/5">
                             {Object.entries(stats).map(([s, v]) => v !== 0 && (
                               <div key={s} className="flex gap-1 items-center">
                                  <span className="text-[7px] font-black text-slate-600 uppercase">{s}</span>
                                  <span className="text-[9px] font-black text-amber-500">+{v}</span>
                               </div>
                             ))}
                          </div>
                        )}
                     </div>

                      <div className="flex gap-4">
                         <div className="flex-1">
                            <div className="flex justify-between items-end mb-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase italic">Signal Strength (Quantity)</label>
                               <span className="text-[8px] font-black text-slate-600 uppercase">Max Avail: {selectedToSell.count}</span>
                            </div>
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
                               <div className="flex flex-col gap-1">
                                  <button onClick={() => setSellCount(prev => Math.min(selectedToSell.count, prev + 1))} className="px-3 bg-white/5 hover:bg-white/10 text-white text-[8px] font-black border border-white/10 rounded-md">+</button>
                                  <button onClick={() => setSellCount(prev => Math.max(1, prev - 1))} className="px-3 bg-white/5 hover:bg-white/10 text-white text-[8px] font-black border border-white/10 rounded-md">-</button>
                                  <button onClick={() => setSellCount(selectedToSell.count)} className="px-2 bg-amber-500/20 text-amber-500 text-[6px] font-black border border-amber-500/20 rounded-md">MAX</button>
                               </div>
                            </div>
                         </div>

                         <div className="flex-1">
                            <div className="flex justify-between items-end mb-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase italic">Exchange Value (GX)</label>
                              {master?.cost && <span className="text-[8px] font-black text-slate-600 uppercase">Sugg: {Math.floor(master.cost * 0.8)}</span>}
                            </div>
                            <div className="flex gap-2">
                               <div className="flex-1 relative">
                                  <input 
                                    type="number" 
                                    value={sellPrice}
                                    onChange={(e) => setSellPrice(parseInt(e.target.value) || 0)}
                                    className="w-full bg-black border-2 border-white/10 p-4 font-black text-white text-xl italic focus:outline-none focus:border-amber-500 transition-colors pl-12 rounded-2xl"
                                  />
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 font-black italic">GX:</div>
                               </div>
                               <div className="flex flex-col gap-1">
                                  <button onClick={() => setSellPrice(prev => Math.floor(prev * 1.2))} className="px-3 bg-white/5 hover:bg-white/10 text-white text-[8px] font-black border border-white/10 rounded-md">UP</button>
                                  <button onClick={() => setSellPrice(prev => Math.max(1, Math.floor(prev * 0.8)))} className="px-3 bg-white/5 hover:bg-white/10 text-white text-[8px] font-black border border-white/10 rounded-md">DN</button>
                               </div>
                            </div>
                         </div>
                      </div>

                     <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-amber-500">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase mb-1 opacity-60">
                           <span>Terminal Processing Tax (5%)</span>
                           <span>- {Math.floor(sellPrice * 0.05)} GX</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-black uppercase pt-1 border-t border-amber-500/20">
                           <span>Projected Yield</span>
                           <span className="text-white">{(sellPrice - Math.floor(sellPrice * 0.05)).toLocaleString()} GX</span>
                        </div>
                     </div>

                     <button
                       onClick={() => {
                         listItem(selectedToSell, sellPrice, sellCount);
                         setIsListingModalOpen(false);
                       }}
                       className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black uppercase italic text-lg shadow-[0_10px_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-95 transition-all outline-none ring-offset-2 focus:ring-2 ring-amber-500"
                     >
                       CONFIRM BROADCAST
                     </button>
                  </div>
               </div>
            </div>
          );
        })(),
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
