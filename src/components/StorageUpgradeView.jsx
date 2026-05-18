import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  Award,
  BookOpen,
  ArrowLeft,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { httpsCallable } from 'firebase/functions';
import { useWriteContract, useAccount } from 'wagmi';

export const StorageUpgradeView = () => {
  const { player, syncPlayer, functions, addLog, playSFX, SOUNDS, adventure, user } = useGame();
  const { writeContractAsync } = useWriteContract();
  const { isConnected } = useAccount();
  const { setView } = adventure;
  
  const [method, setMethod] = useState('GX');
  const [txHash, setTxHash] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const currentSlots = Object.keys(player?.inventory || {}).length;
  const maxSlots = player?.maxInventorySlots || 50;

  // Deriving the cost dynamically based on the RPG math
  let costLabel = "5,000 GX Credits";
  if (maxSlots >= 100) {
    costLabel = method === 'GX' ? "30,000 GX Credits" : method === 'DWGX' ? "25.0 $DWGX" : "10.0 $HUNT + 2 Hunt Sparks";
  } else if (maxSlots >= 70) {
    costLabel = method === 'GX' ? "15,000 GX Credits" : method === 'DWGX' ? "25.0 $DWGX" : "10.0 $HUNT";
  } else {
    costLabel = method === 'GX' ? "5,000 GX Credits" : method === 'DWGX' ? "25.0 $DWGX" : "10.0 $HUNT";
  }

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

  // Real-time Evm Payment Instructions (Cold Wallet Gateway)
  const PAYMENT_WALLET_ADDRESS = "0x8dca8d7B35004630F460B85F70d1189795CDe6Fc";

  // Cloud Function secure execution hook
  const executeUpgrade = async () => {
    if (!functions) return;
    setIsUpgrading(true);
    setErrorMessage('');
    setSuccessMessage('');

    let activeTxHash = txHash;

    try {
      // Automatic Web3 Contract Write if no manual txHash is provided (Player Flow)
      if (method !== 'GX' && !activeTxHash) {
        if (!isConnected) {
          throw new Error("Wallet not connected. Please connect your wallet in the HUD or menu first.");
        }

        const tokenAddress = method === 'DWGX' 
          ? "0x3038aFBd4Bde3898C3972A8E0F45de7CB7300A3A" 
          : "0x37f0c2915CeCC7e977183B8543Fc0864d03E064C";
        
        // BigInt cost (25 DWGX or 10 HUNT) - both have 18 decimals
        const requiredAmount = method === 'DWGX' ? 25n * 10n**18n : 10n * 10n**18n;

        addLog(`⏳ WALLET: Requesting transfer signature for ${method === 'DWGX' ? '25.0 $DWGX' : '10.0 $HUNT'}...`);
        
        const hash = await writeContractAsync({
          address: tokenAddress,
          abi: [
            {
              name: 'transfer',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'transfer',
          args: [PAYMENT_WALLET_ADDRESS, requiredAmount]
        });

        if (!hash) {
          throw new Error("Transaction signature rejected by player wallet.");
        }
        activeTxHash = hash;
        addLog(`🚀 Broadcasted transaction successfully! Hash: ${hash.slice(0, 10)}...`);
      }

      const upgradeFn = httpsCallable(functions, 'secureGameAction');
      const result = await upgradeFn({
        action: 'UPGRADE_INVENTORY_SLOTS',
        payload: { method, txHash: activeTxHash }
      });
      
      const data = result.data;
      if (data.success) {
        setSuccessMessage(`EXPANSION STABLE: Storage successfully upgraded to ${data.newMax} slots!`);
        addLog(`🎒 SATCHEL SUCCESS: Upgraded capacity to ${data.newMax} slots.`);
        if (playSFX) playSFX(SOUNDS.levelup);
        setTxHash(''); // Clear tx input
      }
    } catch (e) {
      console.error(e);
      setErrorMessage(e.message || 'Verification Rejection.');
      addLog(`🎒 SATCHEL ERROR: ${e.message || 'Upgrade Rejection.'}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col bg-[#0f051d] p-4 md:p-6 rounded-2xl overflow-y-auto custom-scrollbar border-4 border-black relative">
      {/* Anime Scanlines & Grid Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-scanline"></div>
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-cyber-grid"></div>
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('inventory')} 
            className="w-8 h-8 bg-black hover:bg-white text-white hover:text-black border-2 border-white hover:border-black rounded flex items-center justify-center transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg md:text-xl font-[1000] text-white uppercase italic tracking-tighter leading-none bungee">
              SATCHEL CORE // DIMENSIONAL UPGRADES
            </h2>
            <p className="text-[9px] text-cyan-400 font-black tracking-widest uppercase mt-1 leading-none bungee">
              Expand inventory capacity nodes & unlock quantum storage matrix
            </p>
          </div>
        </div>

        <div className="bg-[var(--neon-lime)] border-2 border-black px-3 py-1 text-black font-black text-[10px] uppercase italic shadow-[3px_3px_0_rgba(0,0,0,1)] shrink-0 bungee">
          Loadout: {currentSlots} / {maxSlots}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Live Player Status & Aesthetic Aura Visualizer */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-black border-2 border-white/10 rounded-2xl p-4 shadow-[6px_6px_0_rgba(0,0,0,1)]">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 bungee">Storage Capacity Load</h3>
            
            <div className="flex justify-between text-[9px] font-black text-white/60 mb-1.5 uppercase italic tracking-tighter bungee">
              <span>Bag Occupancy</span>
              <span className="text-white">{currentSlots} / {maxSlots} Slots</span>
            </div>
            
            <div className="w-full h-4 bg-slate-950 rounded border-2 border-slate-800 p-0.5 relative overflow-hidden mb-3">
              <div 
                className={`h-full rounded transition-all duration-500 ${
                  currentSlots >= maxSlots ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-[var(--neon-cyan)] shadow-[0_0_10px_var(--neon-cyan)]'
                }`}
                style={{ width: `${Math.min(100, (currentSlots / maxSlots) * 100)}%` }} 
              />
            </div>

            <div className="bg-slate-900/30 border border-white/5 p-3 rounded-xl flex items-center gap-3">
              <Layers size={18} className="text-cyan-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none bungee">Current Pocket Limit</span>
                <span className="text-[11px] font-black text-white uppercase mt-0.5 bungee">{maxSlots} total storage capacity</span>
              </div>
            </div>
          </div>

          {/* Aesthetic Theme Preview Box */}
          <div className={`border-2 rounded-2xl p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all duration-500 flex flex-col ${themeColor}`}>
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 bungee">Active Satchel Aura</h3>
            
            <div className="py-6 flex flex-col items-center justify-center border border-white/5 rounded-xl bg-black/40 relative overflow-hidden mb-3">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '16px 16px' }} />
              
              <Award className={`w-14 h-14 animate-bounce-short ${glowColor}`} />
              <span className={`text-base font-black uppercase italic tracking-tighter mt-3 bungee ${glowColor}`}>{currentTheme}</span>
            </div>

            {/* Resonance Perks Box */}
            <div className="bg-black/60 border border-white/5 p-3 rounded-xl">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 block bungee">Resonance Perks Buffs:</span>
              <p className="text-[10px] font-black uppercase italic leading-tight text-[var(--neon-lime)] text-left bungee">{perkText}</p>
            </div>
          </div>
        </div>

        {/* Center Column: Upgrade Execution Simulator */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-black border-2 border-white/10 rounded-2xl p-4 shadow-[6px_6px_0_rgba(0,0,0,1)] flex-grow flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 bungee">Expansion Uplink Terminal</h3>

            {maxSlots >= 120 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center mb-2 animate-bounce-short">
                  <ShieldCheck className="text-emerald-500" size={32} />
                </div>
                <h4 className="text-xl font-black text-emerald-400 uppercase italic bungee tracking-tighter">MAXIMUM CAPACITY REACHED</h4>
                <p className="text-xs font-bold text-slate-400 uppercase leading-snug bungee max-w-[80%] mx-auto">
                  Your satchel's spatial dimensions have been expanded to their absolute physical limits. No further upgrades are possible.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 flex-grow text-left">
                  {/* Method Selector */}
                  <div className="flex flex-col">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 bungee">Payment Protocol</label>
                    <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'GX', label: 'GX Gold' },
                    { id: 'DWGX', label: '$DWGX' },
                    { id: 'HUNT', label: '$HUNT' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setMethod(tab.id)}
                      className={`py-2 rounded-lg font-black uppercase text-[10px] border-2 border-black italic transition-all bungee ${method === tab.id ? 'bg-[var(--neon-cyan)] text-black shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirement Summary Display */}
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bungee">Upgrading To</span>
                  <span className="text-sm font-black text-white italic uppercase bungee">+{maxSlots + 10} Slots Capacity</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bungee">Required Burn</span>
                  <span className="text-sm font-black text-[var(--neon-lime)] italic uppercase bungee">{costLabel}</span>
                </div>
              </div>

              {/* On-Chain Payment Protocol Instructions */}
              {method !== 'GX' && (
                <div className="bg-slate-900 border border-cyan-500/20 p-3.5 rounded-xl space-y-2.5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <Zap size={14} className="animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest bungee">AUTOMATED Web3 SECURE CHECKOUT</span>
                  </div>
                  
                  <p className="text-[9.5px] font-bold text-white/70 uppercase leading-snug tracking-tight bungee">
                    {isConnected 
                      ? `Your wallet is linked. Click "AUTHORIZE SLOT EXPANSION" below to automatically confirm the transfer of exactly ${method === 'DWGX' ? '25.0 $DWGX' : '10.0 $HUNT'} via MetaMask/EVM provider.`
                      : 'EVM Wallet not connected! Please connect your wallet in the HUD or side menu to authorize automated payment.'
                    }
                  </p>

                  <div className="pt-1.5 border-t border-white/5">
                    <button 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-[8px] font-black text-cyan-400/80 hover:text-cyan-400 uppercase tracking-widest block text-left underline bungee"
                    >
                      {showAdvanced ? "▲ Hide advanced manual options" : "▼ Show advanced manual options (pre-executed hashes)"}
                    </button>
                  </div>

                  {showAdvanced && (
                    <div className="mt-3 space-y-2.5 pt-2.5 border-t border-dashed border-white/10 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-[9px] text-slate-400 uppercase leading-snug bungee">
                        If you already sent your tokens manually, paste the pre-executed Base transaction hash below:
                      </p>
                      
                      <div className="bg-black/50 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between select-all">
                        <code className="text-[10px] font-mono text-cyan-300 truncate w-full pr-4">{PAYMENT_WALLET_ADDRESS}</code>
                        <span className="text-[6px] font-black text-slate-500 border border-slate-500/20 px-1 py-0.5 rounded uppercase leading-none bungee shrink-0">COPY</span>
                      </div>

                      <div className="flex flex-col pt-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 bungee">Transaction Hash (TxHash)</label>
                        <input
                          type="text"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          placeholder="Paste your 0x... tx hash here to verify"
                          className="w-full bg-black border-2 border-white/10 rounded-xl p-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Alert Panels */}
              {errorMessage && (
                <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl flex items-start gap-2.5 text-left animate-in shake duration-300">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={14} />
                  <p className="text-[9px] font-black uppercase italic text-red-400 leading-normal bungee">{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-start gap-2.5 text-left animate-in zoom-in duration-300">
                  <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                  <p className="text-[9px] font-black uppercase italic text-emerald-400 leading-normal bungee">{successMessage}</p>
                </div>
              )}
            </div>

            {/* Execute Expansion Action */}
            <button
              onClick={executeUpgrade}
              disabled={isUpgrading || (method === 'GX' && (player?.tokens || 0) < (maxSlots >= 100 ? 30000 : maxSlots >= 70 ? 15000 : 5000))}
              className="w-full bg-[var(--neon-lime)] text-black py-3 mt-5 rounded-xl font-[1000] uppercase tracking-tighter border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-white transition-all disabled:opacity-40 disabled:pointer-events-none italic text-xs flex items-center justify-center gap-2 bungee"
            >
              {isUpgrading ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  VERIFYING BLOCK MATRIX...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  {method === 'GX' && (player?.tokens || 0) < (maxSlots >= 100 ? 30000 : maxSlots >= 70 ? 15000 : 5000) ? 'INSUFFICIENT GX CREDITS' : 'AUTHORIZE SLOT EXPANSION'}
                </>
              )}
            </button>
                </>
              )}
          </div>
        </div>

      </div>



      <div className="mt-6 flex items-start gap-2.5 text-left border border-white/5 p-3 rounded-xl bg-white/5">
        <BookOpen className="text-slate-500 shrink-0 mt-0.5" size={14} />
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bungee">Satchel Upgrade Specifications Matrix</span>
          <p className="text-[8px] text-slate-400 uppercase tracking-tighter leading-snug mt-1 italic font-medium bungee">
            • Tier 1 (50-70 slots): Costs 5,000 GX credits.<br/>
            • Tier 2 (70-100 slots): Costs 15,000 GX or 25.0 $DWGX.<br/>
            • Tier 3 (100-120 slots): Costs 30,000 GX or 10.0 $HUNT + 2 Hunt Sparks (sparks are consumed on claim).<br/>
            • Base mainnet transaction verifications check RPC status and wallet address integrity.
          </p>
        </div>
      </div>

    </div>
  );
};
