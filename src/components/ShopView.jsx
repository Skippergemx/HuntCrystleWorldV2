import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sword, Shield, HardHat, Footprints, Package, Lock, Check, Sparkles, TrendingUp } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const ShopView = React.memo(() => {
  const { player, actions, adventure, openGuide, SHOP_ITEMS } = useGame();
  const { setView } = adventure;
  const { buyItem } = actions;

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [quantities, setQuantities] = useState({});

  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [txStatus, setTxStatus] = useState('idle');
  const [txCountdown, setTxCountdown] = useState(30);

  const getOwnedQty = (item) => {
    if (!item) return 0;
    if (item.id === 'hp_potion') return player.potions || 0;
    if (item.id === 'auto_scroll') return player.autoScrolls || 0;
    return Object.values(player.inventory || {}).filter(i => {
       if (!i) return false;
       const cleanId = i.id?.replace(/(_\d+)+$/, '');
       return cleanId === item.id;
    }).length;
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

    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve('TIMEOUT'), 30000)
    );

    try {
      const result = await Promise.race([
        buyItem(selectedItem, purchaseQty),
        timeoutPromise
      ]);

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
    {
      title: "GX Exchange",
      npc: 4,
      visualType: 'trade',
      text: "Welcome to the central GX Exchange! Here you can spend your hard-earned GX Tokens to purchase baseline combat tech and gear.",
      hint: "Tip: The shop instantly upgrades your arsenal."
    },
    {
      title: "Level Restrictions",
      npc: 6,
      visualType: 'level',
      text: "Notice that some high-grade tech is strictly locked! You must increase your Hunter Level by surviving Dungeons before purchasing them.",
      hint: "Strategy: Level up to unlock Epic gear."
    },
    {
      title: "Auto-Equip",
      npc: 2,
      visualType: 'economy',
      text: "Purchased gear is immediately shipped to your Inventory Core securely. Equip them via your Tactical Loadout terminal to gain their power.",
      hint: "Warning: Always check stats before buying."
    }
  ];

  const nextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem('hide_shop_tutorial', 'true');
      }
      setShowTutorial(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[500px] relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
      
      <Header title="GX Exchange: Shop" onClose={adventure.goBack} onHelp={() => {
        setTutorialStep(0);
        setShowTutorial(true);
      }} />
      
      <div className="grid gap-6 relative z-10">
        {SHOP_ITEMS.map((item, index) => {
          const isEquipped = item.type !== 'Consumable' && player.equipped?.[item.type]?.id === item.id;
          const isLocked = player.level < (item.reqLvl || 1);
          
          return (
            <div 
              key={item.id} 
              className={`p-4 md:p-5 bg-white border-[3px] md:border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[8px_8px_0_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center group transition-transform hover:-translate-y-1 ${index % 2 === 0 ? '-rotate-1' : 'rotate-1'} ${isLocked ? 'opacity-70' : ''}`}
            >
              <div className="flex flex-row gap-4 items-center w-full md:w-auto">
                <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] ${isEquipped || isLocked ? 'bg-slate-400 grayscale' : item.type === 'Weapon' ? 'bg-red-500' : item.type === 'Armor' ? 'bg-cyan-500' : item.type === 'Headgear' ? 'bg-blue-500' : item.type === 'Footwear' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                    {isEquipped || isLocked ? <Lock size={20} className="text-white md:size-24" /> : (
                      <span className="text-2xl md:text-3xl filter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        {item.icon || (
                          item.type === 'Weapon' ? <Sword size={20} className="text-white md:size-24" /> : 
                          item.type === 'Armor' ? <Shield size={20} className="text-white md:size-24" /> : 
                          item.type === 'Headgear' ? <HardHat size={20} className="text-white md:size-24" /> : 
                          item.type === 'Footwear' ? <Footprints size={20} className="text-white md:size-24" /> : 
                          <Package size={20} className="text-white md:size-24" />
                        )}
                      </span>
                    )}
                </div>
                <div className="space-y-1 text-left min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-lg md:text-xl text-black uppercase tracking-tighter italic leading-none truncate">{item.name}</h4>
                    {isLocked && <span className="text-[7px] bg-red-600 text-white px-1 font-black transform rotate-6 border border-black shadow-sm tracking-tighter">LVL {item.reqLvl} REQ</span>}
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <p className="text-[9px] md:text-[10px] text-slate-600 font-bold italic leading-tight uppercase line-clamp-2 md:mr-12">{item.description}</p>
                    
                    {item.stats && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(item.stats).map(([key, val]) => {
                          if (val === 0) return null;
                          const label = key.toUpperCase();
                          const color = key === 'str' ? 'bg-red-100 text-red-700 border-red-200' : 
                                        key === 'agi' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                        'bg-blue-100 text-blue-700 border-blue-200';
                          return (
                            <span key={key} className={`text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded border ${color}`}>
                              {label} {val > 0 ? `+${val}` : val}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 w-full md:w-auto pt-3 md:pt-0 border-t-2 md:border-t-0 border-black/5 mt-1 md:mt-0">
                <div className={`bg-amber-100 px-3 py-1 border-2 border-black transform rotate-2 md:rotate-3 relative shadow-sm ${isLocked ? 'grayscale opacity-50' : ''}`}>
                   <span className="text-xs font-black text-black italic">{item.cost} GX</span>
                   {!isEquipped && !isLocked && <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[6px] font-black px-1 border border-black transform -rotate-12">NEW!</div>}
                </div>
                <button 
                  onClick={() => handleBuyClick(item)} 
                  disabled={isLocked}
                  className={`px-6 md:px-8 py-2 md:py-3 border-[3px] border-black font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${isLocked ? 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed' : 'bg-cyan-400 text-black hover:bg-cyan-300 hover:scale-105 active:scale-95 italic'}`}
                >
                  {isLocked ? 'LOCKED' : isEquipped ? 'EQUIPPED' : 'BUY UNIT'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedItem && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="relative w-full max-w-sm bg-slate-900 border-[4px] border-black shadow-[12px_12px_0_rgba(0,0,0,1)] p-6 z-10 flex flex-col gap-4">
              <div className="absolute -top-4 -right-4 bg-amber-400 text-black px-4 py-1 text-sm font-black border-4 border-black transform rotate-6 drop-shadow-md italic uppercase">
                TRADE UPLINK
              </div>
              
              <div className="flex items-center gap-4 border-b-[3px] border-slate-700 pb-4">
                 <div className="w-16 h-16 bg-white border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,0.5)] transform -rotate-2">
                    <span className="text-4xl drop-shadow-sm flex items-center justify-center">
                        {selectedItem.icon || (
                            selectedItem.type === 'Weapon' ? <Sword size={32} className="text-slate-200" /> : 
                            selectedItem.type === 'Armor' ? <Shield size={32} className="text-slate-200" /> : 
                            selectedItem.type === 'Headgear' ? <HardHat size={32} className="text-slate-200" /> : 
                            selectedItem.type === 'Footwear' ? <Footprints size={32} className="text-slate-200" /> : 
                            <Package size={32} className="text-slate-200" />
                        )}
                    </span>
                 </div>
                 <div className="flex-1">
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedItem.name}</h3>
                    <p className="text-[10px] text-cyan-400 font-bold uppercase mt-1 tracking-widest">Available: <span className="text-white">{player.tokens || 0} GX</span></p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Owned: <span className="text-white">{getOwnedQty(selectedItem)} Units</span></p>
                 </div>
              </div>

              {txStatus === 'idle' && (
                <>
                  <div className="bg-slate-800 p-4 border-[3px] border-black rounded-xl">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Requisition Amount</p>
                     <div className="flex items-center justify-center gap-4">
                        <button onClick={() => setPurchaseQty(p => Math.max(1, p - 1))} className="w-10 h-10 flex items-center justify-center bg-red-500 text-white font-black text-xl border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:bg-red-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">-</button>
                        <input type="number" readOnly value={purchaseQty} className="w-16 text-center text-xl font-black bg-white border-[3px] border-black py-1 shadow-inner focus:outline-none" />
                        <button onClick={() => setPurchaseQty(p => p + 1)} className="w-10 h-10 flex items-center justify-center bg-emerald-500 text-white font-black text-xl border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:bg-emerald-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">+</button>
                     </div>
                  </div>

                  <div className="flex justify-between items-center bg-amber-50 p-2 border-2 text-black border-amber-500 shadow-inner">
                     <span className="text-xs font-black uppercase tracking-widest italic">Total Cost:</span>
                     <span className="text-lg font-black italic text-red-600">{selectedItem.cost * purchaseQty} GX</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                     <button onClick={() => setSelectedItem(null)} className="flex-1 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-slate-200 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all italic">CANCEL</button>
                     <button 
                       onClick={confirmPurchase} 
                       disabled={selectedItem.cost * purchaseQty > (player.tokens || 0)}
                       className={`flex-[2] py-3 font-black text-[10px] uppercase tracking-widest border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all italic ${selectedItem.cost * purchaseQty > (player.tokens || 0) ? 'bg-slate-400 text-slate-600 grayscale cursor-not-allowed' : 'bg-cyan-400 text-black hover:bg-cyan-300'}`}
                     >
                       {selectedItem.cost * purchaseQty > (player.tokens || 0) ? 'INSUFFICIENT FUNDS' : 'CONFIRM ORDER'}
                     </button>
                  </div>
                </>
              )}

              {txStatus === 'submitting' && (
                <div className="py-8 flex flex-col items-center justify-center gap-4">
                   <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                   <div className="text-center">
                     <h4 className="text-sm font-black text-white italic uppercase tracking-widest animate-pulse">Processing Block...</h4>
                     <p className="text-[10px] text-cyan-400 font-bold uppercase mt-1 px-4 text-center">Timeout in {txCountdown}s</p>
                   </div>
                </div>
              )}

              {txStatus === 'success' && (
                <div className="py-8 flex flex-col items-center justify-center gap-4 bg-emerald-900/50 border-[3px] border-emerald-500 transform rotate-1">
                   <div className="w-12 h-12 bg-emerald-500 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)]">
                     <Check size={24} className="text-white" />
                   </div>
                   <h4 className="text-sm font-black text-emerald-400 italic uppercase tracking-widest">Purchase Secure!</h4>
                </div>
              )}

              {txStatus === 'failed' && (
                 <div className="py-6 flex flex-col items-center justify-center gap-4 bg-red-900/50 border-[3px] border-red-500 transform -rotate-1">
                   <h4 className="text-sm font-black text-red-400 italic uppercase tracking-widest text-center px-4">Transaction Failed or Timed Out</h4>
                   <p className="text-[10px] text-slate-300 font-bold text-center px-4">Verify connection or try again.</p>
                   <button onClick={() => setTxStatus('idle')} className="px-6 py-2 bg-red-600 text-white border-[3px] border-black font-black uppercase tracking-widest shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-red-500 transition-all text-xs active:translate-x-1 active:translate-y-1 active:shadow-none italic mt-2">CLOSE</button>
                 </div>
              )}
           </div>
        </div>,
        document.body
      )}

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-sm flex flex-col justify-center">
            {/* The Comic Panel Shadow */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-yellow-800 rounded-3xl transform translate-x-1.5 translate-y-1.5 md:translate-x-2 md:translate-y-2 mt-1 mb-1 pointer-events-none"></div>
            
            <div className="relative bg-slate-900 border-[3px] md:border-[4px] border-black rounded-3xl z-10 flex flex-col items-center overflow-hidden">
              {/* Halftone Overlay Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ backgroundImage: 'radial-gradient(circle, #eab308 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>

              {/* Header Banner */}
              <div className="w-full bg-yellow-600 py-2 md:py-3 border-b-[3px] md:border-b-[4px] border-black transform -rotate-1 relative z-10 shadow-lg flex-shrink-0">
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
                <div className="w-16 h-28 md:w-20 md:h-36 rounded-xl border-[3px] border-black overflow-hidden relative shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2 bg-slate-800 shrink-0 flex items-center justify-center">
                   <AvatarMedia num={tutorialSteps[tutorialStep].npc} animated={true} className="w-full h-full object-cover object-top" />
                   <div className="absolute inset-x-0 bottom-0 bg-amber-600 text-[6px] font-black text-black text-center py-0.5 uppercase italic">BROKER</div>
                </div>

                <div className="flex flex-col items-center gap-1">
                   <div className="w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
                   <div className="w-[1px] h-3 bg-gradient-to-b from-yellow-400 to-transparent" />
                </div>

                {/* Topic Visual Aid */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black relative shadow-[4px_4px_0_rgba(255,255,255,0.1)] bg-slate-950 flex items-center justify-center shrink-0 group">
                   {tutorialSteps[tutorialStep].visualType === 'trade' && (
                     <div className="text-4xl md:text-5xl drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] z-10 animate-bounce">🪙</div>
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'level' && (
                     <Lock className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10 animate-pulse" size={40} />
                   )}
                   {tutorialSteps[tutorialStep].visualType === 'economy' && (
                     <Package className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] z-10 animate-pulse" size={40} />
                   )}
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-10">
                   <div className="w-full h-full rounded-full border-2 border-dashed border-yellow-400 animate-spin-slow"></div>
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

                <div className="bg-black/60 p-1.5 rounded-lg border border-yellow-500/30 mb-3 shrink-0">
                   <p className="text-[8px] font-black text-yellow-400 uppercase italic tracking-widest text-center">
                      ⚡ {tutorialSteps[tutorialStep].hint}
                   </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-center justify-center gap-1.5 mb-3 shrink-0">
                   <button 
                     onClick={() => setDontShowAgain(!dontShowAgain)}
                     className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-yellow-500' : 'bg-slate-800'}`}
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
                    className="flex-[2] bg-yellow-600 text-black py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-500 transition-all border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none italic text-[10px] md:text-xs flex items-center justify-center gap-1.5"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? 'BROWSE WARES' : 'TRANSMIT MORE'}
                    <Sparkles size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
});
