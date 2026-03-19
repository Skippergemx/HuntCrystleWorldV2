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

export const MarketplaceView = React.memo(({ player, listings, purchaseItem, listItem, cancelListing, setView, addLog, onHelp }) => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'sell', 'my_listings'
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [selectedToSell, setSelectedToSell] = useState(null);
  const [sellPrice, setSellPrice] = useState(100);

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      if (l.sellerUid === player.uid && activeTab !== 'my_listings') return false; 
      const matchesType = filterType === 'all' || l.item.type === filterType;
      const matchesSearch = l.item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [listings, filterType, searchQuery, player.uid, activeTab]);

  const myListings = useMemo(() => {
    return listings.filter(l => l.sellerUid === player.uid);
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
      <Header title="OPEN GRID: MARKET" onClose={() => setView('menu')} onHelp={onHelp} icon={<ArrowRightLeft className="text-amber-500" />} />

      {/* ACTION TABS */}
      <div className="flex gap-2 mb-6 relative z-10 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'browse', label: 'Browse Market', icon: <Search size={14} /> },
          { id: 'sell', label: 'Post Listing', icon: <Plus size={14} /> },
          { id: 'my_listings', label: 'My Terminal', icon: <History size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase italic tracking-widest border-2 transition-all shrink-0 ${activeTab === tab.id ? 'bg-amber-500 border-black text-black shadow-[4px_4px_0_rgba(0,0,0,1)] -translate-y-0.5' : 'bg-slate-900 border-white/10 text-slate-400 hover:border-amber-500/50'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'browse' && (
        <div className="space-y-4 flex-1 flex flex-col min-h-0 relative z-10">
          {/* FILTERS */}
          <div className="flex flex-wrap gap-4 items-center bg-black/40 p-3 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
               <Search size={16} className="text-slate-500" />
               <input 
                 type="text" 
                 placeholder="SEARCH SIGNAL..." 
                 className="bg-transparent text-[10px] font-black uppercase text-white placeholder:text-slate-700 w-full focus:outline-none"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <div className="flex gap-2">
               {['all', 'Weapon', 'Armor', 'Headgear', 'Footwear', 'Material'].map(t => (
                 <button
                   key={t}
                   onClick={() => setFilterType(t)}
                   className={`px-2 py-1 text-[8px] font-black uppercase rounded border transition-all ${filterType === t ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-slate-900 border-white/5 text-slate-600 hover:text-slate-400'}`}
                 >
                   {t}
                 </button>
               ))}
            </div>
          </div>

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
                      disabled={player.tokens < l.price}
                      className={`px-4 py-2 border-2 border-black text-[9px] font-black uppercase tracking-tighter shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${player.tokens >= l.price ? 'bg-cyan-400 hover:bg-cyan-300 text-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}
                    >
                      ACQUIRE
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
           <div className="bg-amber-500/10 border-2 border-amber-500/30 p-4 rounded-xl mb-6 flex gap-4 items-center">
              <AlertTriangle className="text-amber-500 shrink-0" />
              <p className="text-[10px] font-black text-amber-500 uppercase italic leading-tight">
                NOTICE: Marketplace listings are permanent until sold or canceled. A 5% transaction tax is applied to all successful sales.
              </p>
           </div>

           <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventoryForSale.map((item, i) => (
                <div 
                  key={i}
                  onClick={() => handleOpenListModal(item)}
                  className="bg-slate-900 border-2 border-white/5 p-4 rounded-lg flex flex-col group cursor-pointer hover:border-amber-500/50 transition-all hover:-translate-y-1 shadow-lg"
                >
                   <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-black flex items-center justify-center text-3xl opacity-50 transition-opacity group-hover:opacity-100">{item.icon}</div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase italic leading-none">{item.name}</h4>
                        <span className="text-[7px] text-slate-500 font-bold uppercase">{item.type}</span>
                      </div>
                   </div>
                   <div className="flex gap-2 mb-4 h-4">
                      {Object.entries(item.stats || {}).map(([s, v]) => v !== 0 && (
                        <span key={s} className="text-[7px] font-black text-cyan-400">+{v} {s}</span>
                      ))}
                   </div>
                   <div className="mt-auto flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-black text-slate-500 italic">Inventory Item</span>
                      <button className="text-[9px] font-black text-amber-500 uppercase italic flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Sell Now <ArrowRightLeft size={10} />
                      </button>
                   </div>
                </div>
              ))}
              {inventoryForSale.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20">
                   <p className="text-xs font-black uppercase italic tracking-widest">Storage empty: Nothing to broadcast</p>
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
