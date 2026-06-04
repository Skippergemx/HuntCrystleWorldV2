import React, { useState } from 'react';
import { 
  Sparkles, 
  Coins, 
  Zap, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle,
  Layers, 
  Flame, 
  FlaskConical,
  Award,
  BookOpen
} from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { httpsCallable } from 'firebase/functions';

export const AdminPlaygroundView = () => {
  const { player, syncPlayer, functions, addLog, playSFX, SOUNDS } = useGame();
  
  const [method, setMethod] = useState('GX');
  const [txHash, setTxHash] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const currentSlots = Object.values(player?.inventory || {}).filter(v => v && typeof v === 'object' && (v.id || v.name)).length;
  const maxSlots = player?.maxInventorySlots || 50;

  // Derive active resonance theme and perks
  let currentTheme = 'Cyber Satchel';
  let themeColor = 'border-slate-700/50 shadow-slate-500/5 bg-slate-900/60';
  let glowColor = 'text-slate-400';
  let perkText = 'No active resonance buffs.';
  
  if (maxSlots >= 120) {
    currentTheme = 'Solar Hoard';
    themeColor = 'border-amber-500 shadow-amber-500/20 bg-gradient-to-br from-amber-950/40 to-slate-900/80';
    glowColor = 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    perkText = '✨ Resonance III: +10% XP / +5% Auto-Speed / +50 Max HP';
  } else if (maxSlots >= 100) {
    currentTheme = 'Void Compartment';
    themeColor = 'border-purple-500 shadow-purple-500/20 bg-gradient-to-br from-purple-950/40 to-slate-900/80';
    glowColor = 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]';
    perkText = '🔮 Resonance II: +5% XP / +2% Auto-Speed';
  } else if (maxSlots >= 70) {
    currentTheme = 'Neon Satchel';
    themeColor = 'border-cyan-500 shadow-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-slate-900/80';
    glowColor = 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]';
    perkText = '🔋 Resonance I: +2% XP';
  }

  // Developer Balance and Inventory Injectors
  const injectCredits = async () => {
    await syncPlayer({ tokens: (player?.tokens || 0) + 10000 });
    addLog("🔧 DEV CONSOLE: Injected +10,000 GX Credits.");
    if (playSFX) playSFX(SOUNDS.obtainLoot);
  };

  const injectHuntSparks = async () => {
    const inventory = { ...(player?.inventory || {}) };
    const id1 = `hunt_spark_${Date.now()}_1`;
    const id2 = `hunt_spark_${Date.now()}_2`;
    
    inventory[id1] = { id: id1, name: 'Hunt Spark', icon: '⚡', type: 'Material', rarity: 'Rare', description: 'Charged crystal core.' };
    inventory[id2] = { id: id2, name: 'Hunt Spark', icon: '⚡', type: 'Material', rarity: 'Rare', description: 'Charged crystal core.' };
    
    await syncPlayer({ inventory });
    addLog("🔧 DEV CONSOLE: Injected 2 Hunt Sparks into Storage Bag.");
    if (playSFX) playSFX(SOUNDS.obtainLoot);
  };

  const resetSlots = async () => {
    await syncPlayer({ maxInventorySlots: 50 });
    addLog("🔧 DEV CONSOLE: Bag Capacity reset back to 50 slots.");
  };

  // Generator for mock transaction hashes
  const generateMockHash = (type) => {
    const randomHex = Math.random().toString(36).slice(2, 10);
    if (type === 'dwgx_success') {
      setTxHash(`0xmock_success_dwgx_${randomHex}`);
      setErrorMessage('');
    } else if (type === 'hunt_success') {
      setTxHash(`0xmock_success_hunt_${randomHex}`);
      setErrorMessage('');
    } else if (type === 'fail') {
      setTxHash(`0xmock_failed_reverted_${randomHex}`);
      setErrorMessage('');
    } else if (type === 'claimed') {
      setTxHash(`0xmock_success_dwgx_alreadyclaimed`);
      setErrorMessage('');
    }
  };

  // Cloud Function secure execution hook
  const executeSandboxUpgrade = async () => {
    if (!functions) return;
    setIsUpgrading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const upgradeFn = httpsCallable(functions, 'secureGameAction');
      const result = await upgradeFn({
        action: 'UPGRADE_INVENTORY_SLOTS',
        payload: { method, txHash }
      });
      
      const data = result.data;
      if (data.success) {
        setSuccessMessage(`UPGRADE LOGIC STABLE: Slots expanded successfully to ${data.newMax}!`);
        addLog(`🔧 SANDBOX SUCCESS: Bag upgraded safely to ${data.newMax} slots.`);
        if (playSFX) playSFX(SOUNDS.levelup);
      }
    } catch (e) {
      console.error(e);
      setErrorMessage(e.message || 'Verification Rejection.');
      addLog(`🔧 SANDBOX ERROR: ${e.message || 'Upgrade Rejection.'}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col bg-slate-950 p-4 md:p-8 rounded-2xl overflow-y-auto custom-scrollbar border-4 border-black relative">
      {/* Scanline & Grid Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none radial-halftone"></div>
      
      {/* Tactical Sandbox Header */}
      <div className="flex items-center gap-3 border-b-4 border-black pb-4 mb-6 transform -rotate-0.5">
        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
          <FlaskConical className="text-black animate-pulse" size={22} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-[1000] text-white uppercase italic tracking-tighter leading-none">
            VORTEX.SANDBOX // DIMENSIONAL BAG UPGRADE NODE
          </h2>
          <p className="text-[10px] text-emerald-500/80 font-black tracking-widest uppercase mt-1 leading-none">
            Isolate, test, and verify inventory capacity scaling protocols
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Live Player Status & Aesthetic Aura Visualizer */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-slate-900/40 border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Live Storage Capacity HUD</h3>
            
            <div className="flex justify-between text-xs font-black text-white/60 mb-1 uppercase italic tracking-tighter">
              <span>Bag Occupancy</span>
              <span className="text-white">{currentSlots} / {maxSlots} Slots</span>
            </div>
            
            <div className="w-full h-5 bg-black rounded-lg border-2 border-slate-800 p-0.5 relative overflow-hidden mb-3">
              <div 
                className="h-full bg-emerald-500 rounded shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500" 
                style={{ width: `${Math.min(100, (currentSlots / maxSlots) * 100)}%` }} 
              />
            </div>

            <div className="bg-black/50 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <Layers size={18} className="text-slate-500" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Base Capacity Limit</span>
                <span className="text-xs font-black text-white uppercase">{maxSlots} items maximum limit</span>
              </div>
            </div>
          </div>

          {/* Aesthetic Theme Preview Box */}
          <div className={`border-2 rounded-2xl p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all duration-500 flex flex-col ${themeColor}`}>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Dimensional Satchel Preview</h3>
            
            <div className="py-6 flex flex-col items-center justify-center border border-white/5 rounded-xl bg-black/40 relative overflow-hidden mb-3">
              {/* Dynamic Aura Glow */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '16px 16px' }} />
              
              <Award className={`w-16 h-16 animate-bounce-short ${glowColor}`} />
              <span className={`text-base font-black uppercase italic tracking-tighter mt-3 bungee ${glowColor}`}>{currentTheme}</span>
            </div>

            {/* Resonance Perks Box */}
            <div className="bg-black/60 border border-white/5 p-3 rounded-xl">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 block">Pocket Resonance Active Perks:</span>
              <p className="text-[10px] font-black uppercase italic leading-tight text-white/90">{perkText}</p>
            </div>
          </div>
        </div>

        {/* Center Column: Sandbox Purchase Simulator */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-900/40 border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0_rgba(0,0,0,1)] flex-grow flex flex-col">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Upgrade Execution Simulator</h3>

            <div className="space-y-4 flex-grow">
              {/* Method Selector */}
              <div className="flex flex-col">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Currency Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'GX', label: 'GX Gold' },
                    { id: 'DWGX', label: '$DWGX' },
                    { id: 'HUNT', label: '$HUNT' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setMethod(tab.id)}
                      className={`py-2 rounded-lg font-black uppercase text-[10px] border-2 border-black italic transition-all ${method === tab.id ? 'bg-emerald-500 text-black shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'bg-slate-950 text-slate-400 hover:bg-slate-900'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mock Transaction Hash Input */}
              {method !== 'GX' && (
                <div className="flex flex-col animate-in fade-in duration-300">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Transaction Hash (txHash)</label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="0xmock_success_dwgx_..."
                    className="w-full bg-slate-950 border-2 border-black rounded-xl p-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                  
                  {/* Mock Injectors */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <button 
                      onClick={() => generateMockHash(method === 'DWGX' ? 'dwgx_success' : 'hunt_success')}
                      className="py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[8px] font-black uppercase tracking-tighter italic border border-black rounded-md"
                    >
                      + Inject Valid Tx
                    </button>
                    <button 
                      onClick={() => generateMockHash('fail')}
                      className="py-1 bg-slate-800 hover:bg-slate-700 text-red-400 text-[8px] font-black uppercase tracking-tighter italic border border-black rounded-md"
                    >
                      + Inject Failed Tx
                    </button>
                  </div>
                </div>
              )}

              {/* Status Alert Panels */}
              {errorMessage && (
                <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl flex items-start gap-2.5 text-left animate-in shake duration-300">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={14} />
                  <p className="text-[9px] font-black uppercase italic text-red-400 leading-normal">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-start gap-2.5 text-left animate-in zoom-in duration-300">
                  <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                  <p className="text-[9px] font-black uppercase italic text-emerald-400 leading-normal">{successMessage}</p>
                </div>
              )}
            </div>

            {/* Execute Expansion Action */}
            <button
              onClick={executeSandboxUpgrade}
              disabled={isUpgrading || (method !== 'GX' && !txHash)}
              className="w-full bg-emerald-500 text-black py-3 mt-4 rounded-xl font-[1000] uppercase tracking-tighter border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-emerald-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none italic text-sm flex items-center justify-center gap-2"
            >
              {isUpgrading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  PROCESSING EXPANSION SIGNAL...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  EXECUTE SLOT EXPANSION
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Developer Balance & Balance Controls */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="bg-slate-900/40 border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Sandbox Console Controls</h3>
            
            <div className="space-y-2">
              <button 
                onClick={injectCredits}
                className="w-full bg-slate-950 hover:bg-slate-900 text-amber-400 border-2 border-black p-3.5 rounded-xl flex items-center gap-3 transition-all text-left shadow-[2px_2px_0_rgba(0,0,0,1)] group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center border-2 border-black shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] group-hover:scale-110 transition-transform">
                  <Coins className="text-black" size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase italic leading-none text-white">Inject GX Gold</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">+10,000 Gold Credits</span>
                </div>
              </button>

              <button 
                onClick={injectHuntSparks}
                className="w-full bg-slate-950 hover:bg-slate-900 text-blue-400 border-2 border-black p-3.5 rounded-xl flex items-center gap-3 transition-all text-left shadow-[2px_2px_0_rgba(0,0,0,1)] group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center border-2 border-black shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform">
                  <Zap className="text-black animate-pulse" size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase italic leading-none text-white">Inject Hunt Sparks</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Injects 2 Hunt Spark items</span>
                </div>
              </button>

              <button 
                onClick={resetSlots}
                className="w-full bg-slate-950 hover:bg-slate-900 text-red-400 border-2 border-black p-3.5 rounded-xl flex items-center gap-3 transition-all text-left shadow-[2px_2px_0_rgba(0,0,0,1)] group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center border-2 border-black shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] group-hover:scale-95 transition-transform">
                  <RefreshCw className="text-black" size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase italic leading-none text-white">Reset Capacity Cap</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sweep slot limit back to 50</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-slate-900/20 border-2 border-dashed border-slate-800 p-4 rounded-2xl flex items-start gap-2.5 text-left">
            <BookOpen className="text-slate-500 shrink-0 mt-0.5" size={16} />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Upgrade Rules Checklist</span>
              <p className="text-[8.5px] text-slate-400 uppercase tracking-tighter leading-snug mt-1 italic font-medium">
                • Tier 1 (50-70 slots): Costs 5,000 GX credits.<br/>
                • Tier 2 (70-100 slots): Costs 15,000 GX or 25 $DWGX.<br/>
                • Tier 3 (100-120 slots): Costs 30,000 GX or 10 $HUNT + 2 Hunt Sparks.<br/>
                • Real on-chain verification will check EVM RPC nodes automatically in production.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
