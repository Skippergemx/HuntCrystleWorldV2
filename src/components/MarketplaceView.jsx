import React, { useState, useMemo } from 'react';
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
  const { player, market, adventure, actions, openGuide } = useGame();
  const { setView } = adventure;
  const { marketplace: listings, purchaseMarketItem: purchaseItem, listMarketItem: listItem, cancelMarketListing: cancelListing } = market;
  
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'sell', 'my_listings'
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [selectedToSell, setSelectedToSell] = useState(null);
  const [sellPrice, setSellPrice] = useState(100);

  const filteredListings = useMemo(() => {
    return (listings || []).filter(l => {
      if (l.sellerUid === player.uid && activeTab !== 'my_listings') return false; 
      const matchesType = filterType === 'all' || l.item.type === filterType;
      const matchesSearch = l.item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [listings, filterType, searchQuery, player.uid, activeTab]);

  const filteredInventory = useMemo(() => {
    return (player.inventory || []).filter(item => {
      if (!item || typeof item !== 'object') return false;
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [player.inventory, filterType, searchQuery]);

  const myListings = useMemo(() => {
    return (listings || []).filter(l => l.sellerUid === player.uid);
  }, [listings, player.uid]);

  const inventoryForSale = useMemo(() => {
    return (player.inventory || []).filter(item => item && typeof item === 'object');
  }, [player.inventory]);

  const handleOpenListModal = (item) => {
    setSelectedToSell(item);
    setSellPrice(Math.floor((item.cost || 100) * 0.8)); // Default suggestion
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
           {['Weapon', 'Armor', 'Material', 'Jewelry'].map(t => (
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

          {/* LISTINGS GRID */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredListings.length > 0 ? filteredListings.map((l) => (
              <div key={l.id} className="bg-white border-[3px] border-black p-4 flex justify-between items-center group hover:-translate-y-1 transition-all shadow-[6px_6px_0_rgba(0,0,0,1)] relative overflow-hidden">
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-slate-950 flex items-center justify-center text-3xl border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
                       {l.item.icon || '📦'}
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-black uppercase italic leading-none">{l.item.name}</h4>
                          <span className={`text-[7px] font-black px-1 border border-black uppercase ${l.item.rarity === 'Legendary' ? 'bg-amber-500 text-black' : 'bg-slate-200 text-slate-500'}`}>{l.item.rarity || 'Common'}</span>
                       </div>
                       <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Vendor: {l.sellerName || 'Anon'}</p>
                       <div className="flex gap-1 mt-1">
                          {Object.entries(l.item.stats || {}).map(([s, v]) => v !== 0 && (
                            <span key={s} className="text-[7px] font-black text-amber-600 uppercase">+{v} {s}</span>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col items-end gap-2">
                    <div className="bg-amber-100 px-3 py-1 border-2 border-black transform rotate-2">
                       <span className="text-xs font-black text-black">{l.price} GX</span>
                    </div>
                    <button
                      onClick={() => purchaseItem(l)}
                      disabled={player.tokens < l.price || l.sellerUid === player.uid}
                      className={`px-4 py-2 border-2 border-black text-[9px] font-black uppercase tracking-tighter shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${player.tokens >= l.price && l.sellerUid !== player.uid ? 'bg-cyan-400 hover:bg-cyan-300 text-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}
                    >
                      {l.sellerUid === player.uid ? 'YOUR ITEM' : 'ACQUIRE'}
                    </button>
                 </div>
              </div>
            )) : (
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
           <div className="bg-amber-500/5 border border-amber-500/20 p-2 md:p-3 rounded-lg mb-3 flex gap-3 items-center">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <p className="text-[7px] md:text-[9px] font-black text-amber-500 uppercase italic leading-tight">
                NOTICE: Listings carry a 5% terminal tax upon successful exchange.
              </p>
           </div>

           <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 pb-20">
              {filteredInventory.map((item, i) => (
                <div 
                  key={i}
                  onClick={() => handleOpenListModal(item)}
                  className="bg-slate-900 border border-white/5 p-2 md:p-4 rounded flex flex-col group cursor-pointer hover:border-amber-500 transition-all hover:-translate-y-1 shadow-[4px_4px_0_rgba(0,0,0,1)]"
                >
                   <div className="flex flex-col items-center text-center gap-1 md:gap-2">
                      <div className="w-10 h-10 md:w-16 md:h-16 bg-black flex items-center justify-center text-2xl md:text-5xl group-hover:scale-110 transition-transform">{item.icon}</div>
                      <div className="min-h-[40px] flex flex-col justify-center">
                        <h4 className="text-[8px] md:text-xs font-black text-white uppercase italic leading-tight line-clamp-2">{item.name}</h4>
                        <span className="text-[6px] md:text-[8px] text-slate-500 font-bold uppercase">{item.type}</span>
                      </div>
                   </div>
                   <div className="mt-2 pt-2 border-t border-white/5 flex justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                      <button className="text-[7px] md:text-[10px] font-black text-amber-500 uppercase italic flex items-center gap-1">
                        SELL NOW <ArrowRightLeft size={8} className="md:w-3 md:h-3" />
                      </button>
                   </div>
                </div>
              ))}
              {filteredInventory.length === 0 && (
                <div className="col-span-full py-10 text-center opacity-20">
                   <p className="text-[10px] font-black uppercase italic tracking-widest">No targetable assets in current sector</p>
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
                         <h4 className="text-sm font-black text-white uppercase italic leading-none">{l.item.name}</h4>
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

      {/* LISTING MODAL */}
      {isListingModalOpen && selectedToSell && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white border-[4px] border-black p-6 w-full max-w-sm relative shadow-[12px_12px_0_rgba(0,0,0,0.5)] animate-in zoom-in duration-200">
              <button 
                onClick={() => setIsListingModalOpen(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-black text-white border-4 border-black flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                 <div className="text-5xl mb-4">{selectedToSell.icon}</div>
                 <h2 className="text-2xl font-black text-black uppercase italic tracking-tighter">{selectedToSell.name}</h2>
                 <p className="text-[10px] text-slate-500 font-black uppercase italic mt-1">Broadcast to Open Grid</p>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-black uppercase italic mb-2 block">Set Exchange Value (GX)</label>
                    <div className="flex gap-2">
                       <input 
                         type="number" 
                         value={sellPrice}
                         onChange={(e) => setSellPrice(parseInt(e.target.value) || 0)}
                         className="flex-1 bg-slate-100 border-2 border-black p-3 font-black text-black italic focus:outline-none"
                       />
                       <button 
                         onClick={() => setSellPrice(prev => Math.floor(prev * 1.5))}
                         className="px-4 bg-slate-900 text-amber-500 border-2 border-black font-black uppercase italic"
                       >
                         UP
                       </button>
                    </div>
                 </div>

                 <div className="bg-amber-100 p-3 border-2 border-black text-black">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase mb-1">
                       <span>Market Tax (5%)</span>
                       <span>- {Math.floor(sellPrice * 0.05)} GX</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black uppercase pt-1 border-t border-black/10">
                       <span>Projected Yield</span>
                       <span className="text-emerald-600">{sellPrice - Math.floor(sellPrice * 0.05)} GX</span>
                    </div>
                 </div>

                 <button
                   onClick={() => {
                     listItem(selectedToSell, sellPrice);
                     setIsListingModalOpen(false);
                   }}
                   className="w-full bg-amber-500 text-black py-4 border-[3px] border-black font-black uppercase italic text-lg shadow-[6px_6px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                 >
                   CONFIRM BROADCAST
                 </button>
              </div>
           </div>
        </div>
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
