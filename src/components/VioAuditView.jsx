import React, { useState } from 'react';
import { Header } from './GameUI';
import { useGame } from '../contexts/GameContext';
import { ShieldAlert, Zap, Activity, Database, ArrowRight, Brain, Terminal, ServerCrash, CheckCircle2, Clock } from 'lucide-react';

const AuditTimeline = ({ detected, resolved }) => {
  const isPending = resolved === 'PENDING';
  
  return (
    <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-wider bungee">
      <div className="flex items-center gap-1 bg-amber-100 border-2 border-amber-500 text-amber-700 px-2 py-1 shadow-[2px_2px_0_rgba(245,158,11,1)]">
        <ShieldAlert size={12} />
        <span>Detected: {detected}</span>
      </div>
      
      <div className="h-0.5 flex-1 bg-slate-300 relative">
        <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-slate-400 -translate-y-1/2"></div>
        <ArrowRight size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 translate-x-1/2" />
      </div>

      {isPending ? (
        <div className="flex items-center gap-1 bg-slate-100 border-2 border-slate-500 text-slate-600 px-2 py-1 shadow-[2px_2px_0_rgba(100,116,139,1)] opacity-70">
          <Clock size={12} />
          <span>Resolved: PENDING</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 bg-emerald-100 border-2 border-emerald-500 text-emerald-700 px-2 py-1 shadow-[2px_2px_0_rgba(16,185,129,1)]">
          <CheckCircle2 size={12} />
          <span>Resolved: {resolved}</span>
        </div>
      )}
    </div>
  );
};

export const VioAuditView = React.memo(() => {
  const { adventure } = useGame();
  const { setView } = adventure;

  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-[#0f051d] relative overflow-hidden custom-scrollbar">
      {/* ANIME POP Overlay: Grid & Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[2] opacity-10 bg-scanline"></div>
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-5 bg-cyber-grid"></div>
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] pointer-events-none" />

      <Header 
        title="VIO8 AI SYSTEM AUDIT" 
        onClose={adventure.goBack} 
        npcNum={22} 
        icon={<Brain className="text-cyan-400 animate-pulse" />} 
      />

      <div className="relative z-10 flex flex-col gap-4 max-w-5xl mx-auto w-full mt-4">
        {/* Intro Header */}
        <div className="bg-black border-[3px] border-[var(--neon-cyan)] shadow-[6px_6px_0px_0px_var(--neon-cyan)] p-4 relative overflow-hidden transform -rotate-1">
          <div className="halftone-overlay absolute inset-0 opacity-20 pointer-events-none"></div>
          <div className="absolute -top-3 -right-3 text-cyan-500/20">
            <Brain size={120} className="animate-pulse" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--neon-cyan)] border-[2px] border-black flex items-center justify-center rotate-6 shadow-[3px_3px_0_rgba(0,0,0,1)]">
              <Terminal size={24} className="text-black" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter bungee">Performance Audit Report</h2>
              <p className="text-[10px] md:text-xs font-bold text-[var(--neon-cyan)] uppercase tracking-widest leading-none">Target: UI Re-render Bottlenecks</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 w-full mt-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'loot_duplication', label: 'Loot Duplication' },
            { id: 'naga_exploit', label: 'Naga PVP Exploit' },
            { id: 'missing_material', label: 'Missing Material' },
            { id: 'ghost_items', label: 'Ghost Items' },
            { id: 'duplicate_items', label: 'UUID Exploit' },
            { id: 'dual_regex', label: 'Dual Regex' },
            { id: 'dragons_ground', label: 'Dragons Ground' },
            { id: 'crystle_town', label: 'Global O(N)' },
            { id: 'town_influence_sync', label: 'Town Sync' },
            { id: 'white_hat_audit', label: 'White-Hat' },
            { id: 'economy_exploit', label: 'Economy Sec', isNew: true }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-1 md:py-3 border-[3px] border-black font-black uppercase text-[9px] md:text-xs italic tracking-wider transition-all bungee shadow-[4px_4px_0_rgba(0,0,0,1)] relative flex items-center justify-center gap-1 ${activeTab === tab.id ? 'bg-[var(--neon-lime)] text-black -translate-y-1' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
            >
              {tab.label}
              {tab.isNew && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded-sm border border-black animate-pulse">NEW</span>
              )}
            </button>
          ))}
        </div>

        {/* Audit Content Panels */}
        <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_black] p-4 md:p-6 relative text-black z-10 min-h-[400px]">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '16px 16px' }} />

          {activeTab === 'overview' && (
            <div className="animate-in fade-in zoom-in duration-300">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-black pb-2 mb-4 flex items-center gap-2 bungee">
                <ServerCrash className="text-red-500" /> The O(N) Cascade Problem
              </h3>
              
              <AuditTimeline detected="May 17, 2026 14:40" resolved="May 17, 2026 14:50" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 bg-red-50 border-[3px] border-red-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(239,68,68,1)] transform -rotate-1">
                  <h4 className="font-black text-red-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><ShieldAlert size={14} /> The Problem (Legacy)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    Components were filtering the ENTIRE player inventory array multiple times per second inside the React render cycle using <code className="bg-red-200 px-1">Object.values().filter()</code>. For an inventory of 10,000 items running at 60 FPS, this equals millions of redundant calculations.
                  </p>
                  
                  {/* Visual Diagram - Problem */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                    <div className="bg-red-200 border-2 border-red-500 p-2 w-full text-center text-[8px] font-black uppercase">Render Frame</div>
                    <ArrowRight size={16} className="text-red-500 rotate-90" />
                    <div className="flex gap-1 w-full justify-center">
                      <div className="w-8 h-8 bg-slate-300 border border-slate-500 animate-pulse"></div>
                      <div className="w-8 h-8 bg-slate-300 border border-slate-500 animate-pulse delay-75"></div>
                      <div className="w-8 h-8 bg-slate-300 border border-slate-500 animate-pulse delay-150"></div>
                      <div className="text-xs font-black text-red-500 ml-2 mt-2">x 10,000!</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-emerald-50 border-[3px] border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,1)] transform rotate-1">
                  <h4 className="font-black text-emerald-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><CheckCircle2 size={14} /> The Solution (Memoized)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    We introduced a <code className="bg-emerald-200 px-1">useMemo</code> based Dictionary (<code className="bg-emerald-200 px-1">inventoryCounts</code>). This maps the inventory EXACTLY ONCE into an <code className="bg-emerald-200 px-1">O(1)</code> lookup table. Frame renders now just read a single object property instantly instead of sweeping arrays.
                  </p>
                  
                  {/* Visual Diagram - Solution */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                     <div className="bg-emerald-200 border-2 border-emerald-500 p-2 w-full text-center text-[8px] font-black uppercase">Dict Cached</div>
                     <ArrowRight size={16} className="text-emerald-500 rotate-90" />
                     <div className="bg-black text-emerald-400 p-2 w-full text-center text-[10px] font-mono border-2 border-emerald-500">
                        {'{'} "hp_potion": 150, "crystle_shard": 1400 {'}'}
                     </div>
                     <div className="text-[8px] font-black uppercase text-emerald-600 mt-1">O(1) Instant Access</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 p-4 border-[2px] border-black font-bold text-xs text-center uppercase tracking-tighter italic">
                Select a tab above to view specific findings and pending bottlenecks in other modules.
              </div>
            </div>
          )}

          {activeTab === 'dual_regex' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-amber-500 text-amber-600 pb-2 flex items-center gap-2 bungee">
                <Database /> MISMATCH: Dual-Regex Synchronization
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-4">
                A system-wide discrepancy existed between how the UI condensed item IDs versus how the Action Engine processed them, leading to false negatives in item tracking.
              </p>

              <AuditTimeline detected="May 16, 2026 15:10" resolved="May 16, 2026 16:00" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 bg-red-50 border-[3px] border-red-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(239,68,68,1)] transform -rotate-1">
                  <h4 className="font-black text-red-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><ShieldAlert size={14} /> The Problem (Fragmented ID Stripping)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    The Bag (Inventory) used a robust alphanumeric pattern <code className="bg-red-200 px-1">/_([a-z0-9]+)+$/</code> to cleanly strip randomized UUID suffixes. However, the Dungeon (Combat), Laboratory, and Marketplace were still using a legacy numeric-only pattern <code className="bg-red-200 px-1">/(_\d+)+$/</code>.
                  </p>
                  
                  {/* Visual Diagram - Problem */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                    <div className="bg-red-200 border-2 border-red-500 p-2 w-full text-center text-[10px] font-black uppercase">"auto_scroll_3m_abcd123"</div>
                    <ArrowRight size={16} className="text-red-500 rotate-90" />
                    <div className="flex justify-between w-full gap-2">
                       <div className="bg-black text-white p-2 w-full text-center text-[8px] font-mono border-2 border-slate-500">
                          <span className="text-emerald-400">BAG UI:</span><br/>"auto_scroll_3m"
                       </div>
                       <div className="bg-black text-white p-2 w-full text-center text-[8px] font-mono border-2 border-red-500">
                          <span className="text-red-400">COMBAT UI:</span><br/>"auto_scroll_3m_abcd"
                       </div>
                    </div>
                    <div className="text-[8px] font-black text-red-500 mt-1 uppercase">Combat UI Failed to recognize the Scroll!</div>
                  </div>
                </div>

                <div className="flex-1 bg-emerald-50 border-[3px] border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,1)] transform rotate-1">
                  <h4 className="font-black text-emerald-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><CheckCircle2 size={14} /> The Solution (Standardization)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    We injected the robust alphanumeric stripping logic globally across all components. Both the Action Engine and all HUDs now use the exact same algorithm to decode dynamic loot UUIDs.
                  </p>
                  
                  {/* Visual Diagram - Solution */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                     <div className="bg-emerald-200 border-2 border-emerald-500 p-2 w-full text-center text-[10px] font-black uppercase">"auto_scroll_3m_abcd123"</div>
                     <ArrowRight size={16} className="text-emerald-500 rotate-90" />
                     <div className="bg-black text-emerald-400 p-2 w-full text-center text-[10px] font-mono border-2 border-emerald-500">
                        100% MATCH: "auto_scroll_3m"
                     </div>
                     <div className="text-[8px] font-black uppercase text-emerald-600 mt-1">Cross-System Harmony Restored</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'loot_duplication' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-fuchsia-500 text-fuchsia-600 pb-2 flex items-center gap-2 bungee">
                <Database /> EXPLOIT: Exponential Loot Duplication
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-4">
                A critical bug in the combat engine allowed players to receive duplicate drops for a single item exponentially for every subsequent kill during a session.
              </p>

              <AuditTimeline detected="May 17, 2026 14:15" resolved="May 17, 2026 14:25" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 bg-red-50 border-[3px] border-red-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(239,68,68,1)] transform -rotate-1">
                  <h4 className="font-black text-red-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><ShieldAlert size={14} /> The Problem (Session Array Bundling)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    Instead of sending only the new loot from the current kill to the Cloud Function, the frontend was mistakenly passing the entire history of the <code className="bg-red-200 px-1">sessionRewards.loots</code> array. If you stayed in a dungeon and killed 10 monsters, a single HP potion dropped on Kill 1 would be re-submitted and awarded to your inventory 10 separate times!
                  </p>
                  
                  {/* Visual Diagram - Problem */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                    <div className="bg-red-200 border-2 border-red-500 p-2 w-full text-center text-[10px] font-black uppercase">Kill 3 Payload: [Potion_1, Sword_2, Shield_3]</div>
                    <ArrowRight size={16} className="text-red-500 rotate-90" />
                    <div className="bg-black text-white p-2 w-full text-center text-[8px] font-mono border-2 border-red-500">
                       <span className="text-red-400">Cloud Function Iterates Array</span><br/>Grants Potion_1 again!
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-emerald-50 border-[3px] border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,1)] transform rotate-1">
                  <h4 className="font-black text-emerald-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><CheckCircle2 size={14} /> The Solution (Strict Scoping)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    We rewrote the payload constructor to use a strictly scoped <code className="bg-emerald-200 px-1">currentKillLoots</code> array. This ensures that when the Cloud Function executes, it only sees and awards the precise items generated in that exact millisecond, decoupling the transaction from the session UI entirely.
                  </p>
                  
                  {/* Visual Diagram - Solution */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                     <div className="bg-emerald-200 border-2 border-emerald-500 p-2 w-full text-center text-[10px] font-black uppercase">Kill 3 Payload: [Shield_3]</div>
                     <ArrowRight size={16} className="text-emerald-500 rotate-90" />
                     <div className="bg-black text-emerald-400 p-2 w-full text-center text-[10px] font-mono border-2 border-emerald-500">
                        Cloud Function Grants Shield_3 only!
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'naga_exploit' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-amber-500 text-amber-600 pb-2 flex items-center gap-2 bungee">
                <Database /> EXPLOIT: Client-Side Naga Hacking
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-4">
                The Guild Wars combat system was fully susceptible to browser-based tampering, allowing anyone to instantly one-shot opponent Nagas.
              </p>

              <AuditTimeline detected="May 17, 2026 14:20" resolved="May 17, 2026 14:28" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 bg-red-50 border-[3px] border-red-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(239,68,68,1)] transform -rotate-1">
                  <h4 className="font-black text-red-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><ShieldAlert size={14} /> The Problem (Frontend Authority)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    The game was directly executing <code className="bg-red-200 px-1">updateDoc()</code> against the <code className="bg-red-200 px-1">guild_wars</code> Firestore database from inside the browser. A malicious actor could easily intercept this network request, inject <code className="bg-red-200 px-1">currentEnemyHp: 0</code>, and bypass all combat stats to win the war automatically.
                  </p>
                  
                  {/* Visual Diagram - Problem */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                    <div className="bg-red-200 border-2 border-red-500 p-2 w-full text-center text-[10px] font-black uppercase">Frontend DevTools</div>
                    <ArrowRight size={16} className="text-red-500 rotate-90" />
                    <div className="bg-black text-white p-2 w-full text-center text-[8px] font-mono border-2 border-red-500">
                       <span className="text-red-400">Database Update</span><br/>"Set Enemy HP = 0" -&gt; WIN!
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-emerald-50 border-[3px] border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,1)] transform rotate-1">
                  <h4 className="font-black text-emerald-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><CheckCircle2 size={14} /> The Solution (Server Authentication)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    We deleted the insecure <code className="bg-emerald-200 px-1">updateDoc</code> frontend call and migrated the logic to a secure <code className="bg-emerald-200 px-1">PROCESS_NAGA_HIT</code> Cloud Function. The backend now verifies the payload, prevents negative HP numbers, and enforces strict maximum theoretical limits before modifying the database.
                  </p>
                  
                  {/* Visual Diagram - Solution */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                     <div className="bg-emerald-200 border-2 border-emerald-500 p-2 w-full text-center text-[10px] font-black uppercase">Cloud Function Receives Payload</div>
                     <ArrowRight size={16} className="text-emerald-500 rotate-90" />
                     <div className="bg-black text-emerald-400 p-2 w-full text-center text-[10px] font-mono border-2 border-emerald-500">
                        Sanitize -&gt; Database Write
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'missing_material' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-fuchsia-500 text-fuchsia-600 pb-2 flex items-center gap-2 bungee">
                <Database /> RACE CONDITION: Missing Material 404
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-4">
                The frontend's Optimistic UI actively destroyed data before the Secure Cloud Function could process it, leading to 404 Missing Material errors during Xenon Lab Fusion.
              </p>

              <AuditTimeline detected="May 17, 2026 12:45" resolved="May 17, 2026 13:10" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 bg-red-50 border-[3px] border-red-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(239,68,68,1)] transform -rotate-1">
                  <h4 className="font-black text-red-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><ShieldAlert size={14} /> The Problem (Eager Deletion)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    The <code className="bg-red-200 px-1">mixLaboratoryItem</code> function called <code className="bg-red-200 px-1">syncPlayer(updates, true)</code> which aggressively deleted consumed materials directly from Firestore. Milliseconds later, <code className="bg-red-200 px-1">secureGameAction</code> was invoked. The Cloud Function checked the database, saw the materials were missing, and instantly threw a <code className="bg-red-200 px-1">404</code> error, aborting the transaction.
                  </p>
                  
                  {/* Visual Diagram - Problem */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                    <div className="bg-red-200 border-2 border-red-500 p-2 w-full text-center text-[10px] font-black uppercase">UI Deletes Material in Firestore</div>
                    <ArrowRight size={16} className="text-red-500 rotate-90" />
                    <div className="bg-black text-white p-2 w-full text-center text-[8px] font-mono border-2 border-red-500">
                       <span className="text-red-400">Cloud Function Reads Database</span><br/>"Material not found! 404 Abort!"
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-emerald-50 border-[3px] border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,1)] transform rotate-1">
                  <h4 className="font-black text-emerald-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><CheckCircle2 size={14} /> The Solution (Delegated Authority)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    We eliminated <code className="bg-emerald-200 px-1">syncPlayer</code> from all secure transaction wrappers. The frontend now strictly delegates the atomic database transaction to the backend Cloud Function. The UI updates instantly via Firebase's real-time <code className="bg-emerald-200 px-1">onSnapshot</code> listener.
                  </p>
                  
                  {/* Visual Diagram - Solution */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                     <div className="bg-emerald-200 border-2 border-emerald-500 p-2 w-full text-center text-[10px] font-black uppercase">Cloud Function Transacts Atomic Batch</div>
                     <ArrowRight size={16} className="text-emerald-500 rotate-90" />
                     <div className="bg-black text-emerald-400 p-2 w-full text-center text-[10px] font-mono border-2 border-emerald-500">
                        onSnapshot Syncs UI Instantly
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ghost_items' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-indigo-500 text-indigo-600 pb-2 flex items-center gap-2 bungee">
                <Database /> PAYLOAD ERROR: Ghost Items
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-4">
                Synthesized items were successfully created in the database but behaved like "ghosts"—invisible in the UI and Bag.
              </p>

              <AuditTimeline detected="May 17, 2026 13:30" resolved="May 17, 2026 13:45" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 bg-red-50 border-[3px] border-red-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(239,68,68,1)] transform -rotate-1">
                  <h4 className="font-black text-red-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><ShieldAlert size={14} /> The Problem (Incomplete Metadata)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    When delegating Xenon Lab fusions to the backend, the frontend only passed the <code className="bg-red-200 px-1">recipe</code> object. This object lacked aesthetic metadata (name, type, icon). The backend saved this incomplete object into Firestore, bypassing the <code className="bg-red-200 px-1">nameToId</code> resolution in the UI, rendering the item completely invisible.
                  </p>
                  
                  {/* Visual Diagram - Problem */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                    <div className="bg-red-200 border-2 border-red-500 p-2 w-full text-center text-[10px] font-black uppercase">{"{ id: 'shard', materials: [...] }"}</div>
                    <ArrowRight size={16} className="text-red-500 rotate-90" />
                    <div className="bg-black text-white p-2 w-full text-center text-[8px] font-mono border-2 border-red-500">
                       <span className="text-red-400">Bag Filter: "No Type/Name"</span><br/>*Item ignored and hidden*
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-emerald-50 border-[3px] border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,1)] transform rotate-1">
                  <h4 className="font-black text-emerald-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><CheckCircle2 size={14} /> The Solution (Payload Hydration)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    We patched the uplink to merge the <code className="bg-emerald-200 px-1">recipe</code> with its corresponding <code className="bg-emerald-200 px-1">masterData</code> from the ITEMS dictionary BEFORE sending it to the Cloud Function, ensuring the backend writes a 100% complete object.
                  </p>
                  
                  {/* Visual Diagram - Solution */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                     <div className="bg-emerald-200 border-2 border-emerald-500 p-2 w-full text-center text-[10px] font-black uppercase">{"{ ...masterData, ...recipe }"}</div>
                     <ArrowRight size={16} className="text-emerald-500 rotate-90" />
                     <div className="bg-black text-emerald-400 p-2 w-full text-center text-[10px] font-mono border-2 border-emerald-500">
                        Bag Filter: 100% Match
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'duplicate_items' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-amber-500 text-amber-600 pb-2 flex items-center gap-2 bungee">
                <Database /> EXPLOIT: Item Duplication
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-4">
                A severe exploit where players could occasionally receive double the items during purchases or fusions due to asynchronous UUID generation.
              </p>

              <AuditTimeline detected="May 17, 2026 13:50" resolved="May 17, 2026 14:00" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 bg-red-50 border-[3px] border-red-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(239,68,68,1)] transform -rotate-1">
                  <h4 className="font-black text-red-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><ShieldAlert size={14} /> The Problem (Double UUID Insertion)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    Non-blocking <code className="bg-red-200 px-1">syncPlayer(updates)</code> calls in the shop caused the frontend to queue a write with a locally generated UUID. Simultaneously, the Cloud Function ran and inserted its own generated UUID. When both writes completed, the database registered two distinct items!
                  </p>
                  
                  {/* Visual Diagram - Problem */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                    <div className="flex justify-between w-full gap-2">
                       <div className="bg-red-200 border-2 border-red-500 p-2 w-full text-center text-[8px] font-black uppercase">UI Creates: "potion_abcd"</div>
                       <div className="bg-red-200 border-2 border-red-500 p-2 w-full text-center text-[8px] font-black uppercase">Cloud Creates: "potion_xyzz"</div>
                    </div>
                    <ArrowRight size={16} className="text-red-500 rotate-90" />
                    <div className="bg-black text-white p-2 w-full text-center text-[8px] font-mono border-2 border-red-500">
                       <span className="text-red-400">Database Merge</span><br/>2x Potions Inserted!
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-emerald-50 border-[3px] border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,1)] transform rotate-1">
                  <h4 className="font-black text-emerald-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><CheckCircle2 size={14} /> The Solution (Single Source of Truth)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    By removing Optimistic UI UUID generation from all transactional functions, the backend Cloud Function is now the exclusive authority on item creation, completely neutralizing the exploit.
                  </p>
                  
                  {/* Visual Diagram - Solution */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                     <div className="bg-emerald-200 border-2 border-emerald-500 p-2 w-full text-center text-[10px] font-black uppercase">Cloud Creates: "potion_xyzz"</div>
                     <ArrowRight size={16} className="text-emerald-500 rotate-90" />
                     <div className="bg-black text-emerald-400 p-2 w-full text-center text-[10px] font-mono border-2 border-emerald-500">
                        1x Potion Inserted Safely
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dragons_ground' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-red-500 text-red-600 pb-2 flex items-center gap-2 bungee">
                <ShieldAlert /> CRITICAL: DragonsGroundView.jsx
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-4">
                This component uses a <code className="text-red-500">setInterval</code> that runs every 1000ms to animate the monsters and fruits dropping on the ground.
              </p>

              <AuditTimeline detected="May 17, 2026 14:40" resolved="May 17, 2026 14:55" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 bg-red-50 border-[3px] border-red-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(239,68,68,1)] transform -rotate-1">
                  <h4 className="font-black text-red-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><ShieldAlert size={14} /> The Problem</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    Dragons Ground used a <code className="bg-red-200 px-1">setInterval</code> running at 1000ms inside the main component body. This meant the ENTIRE view—including heavy UI components like the GEMX Video player, headers, and stat modals—was forced to completely re-render twice every second.
                  </p>
                </div>

                <div className="flex-1 bg-emerald-50 border-[3px] border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,1)] transform rotate-1">
                  <h4 className="font-black text-emerald-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><CheckCircle2 size={14} /> The Solution</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    We extracted the entire roaming monster logic, fruit drops, and the <code className="bg-emerald-200 px-1">setInterval</code> itself into a new, heavily insulated <code className="bg-emerald-200 px-1">&lt;GroundRenderArea&gt;</code> child component. The main view now renders exactly once, completely eliminating the UI stutter.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crystle_town' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-amber-500 text-amber-600 pb-2 flex items-center gap-2 bungee">
                <Activity /> MODERATE: Global O(N) Dictionary Cascade
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-4">
                Almost every UI component (CrystleTown, Forge, Lab, Shop, Market, Combat, Boss) had its own <code className="text-amber-500">inventoryCounts</code> logic running O(N) mapping loops independently whenever mounted.
              </p>

              <AuditTimeline detected="May 17, 2026 14:40" resolved="May 17, 2026 14:50" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 bg-red-50 border-[3px] border-red-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(239,68,68,1)] transform -rotate-1">
                  <h4 className="font-black text-red-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><ShieldAlert size={14} /> The Problem</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    Even though we replaced the horrific <code className="bg-red-200 px-1">.filter()</code> sweeps with a fast O(1) Dictionary, the calculation of that Dictionary was copy-pasted across 8 different components. Loading the Shop, then the Lab, then the Forge meant sweeping the entire player inventory array 3 separate times!
                  </p>
                </div>

                <div className="flex-1 bg-emerald-50 border-[3px] border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,1)] transform rotate-1">
                  <h4 className="font-black text-emerald-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><CheckCircle2 size={14} /> The Solution</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    We lifted the <code className="bg-emerald-200 px-1">inventoryCounts</code> construction logic all the way up into the global <code className="bg-emerald-200 px-1">GameContext.js</code>. The entire game now computes this O(1) dictionary EXACTLY ONCE upon inventory sync, and all child views instantly inherit the pre-calculated object.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'town_influence_sync' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-fuchsia-500 text-fuchsia-600 pb-2 flex items-center gap-2 bungee">
                <Database /> RACE CONDITION: Town Influence Reversion
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-4">
                Players reported advancing to Town Influence Level 3, but being instantly reverted back to Level 2 upon refreshing the page.
              </p>

              <AuditTimeline detected="May 17, 2026 14:58" resolved="May 17, 2026 15:15" />
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 bg-red-50 border-[3px] border-red-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(239,68,68,1)] transform -rotate-1">
                  <h4 className="font-black text-red-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><ShieldAlert size={14} /> The Problem (Security Rejection)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    The <code className="bg-red-200 px-1">completeTownQuest</code> function was manually deleting consumed quest materials from the player's <code className="bg-red-200 px-1">inventory</code> array directly on the frontend. When the batch update was sent to the server, Firestore's strict <code className="bg-red-200 px-1">firestore.rules</code> immediately blocked the transaction because clients are forbidden from modifying their own economy arrays. The UI optimistically updated to Level 3, but the server rejected the save.
                  </p>
                  
                  {/* Visual Diagram - Problem */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                    <div className="bg-red-200 border-2 border-red-500 p-2 w-full text-center text-[10px] font-black uppercase">Client Deletes Materials & Grants Level 3</div>
                    <ArrowRight size={16} className="text-red-500 rotate-90" />
                    <div className="bg-black text-white p-2 w-full text-center text-[8px] font-mono border-2 border-red-500">
                       <span className="text-red-400">Security Rule: "No direct inventory mods!"</span><br/>*Transaction Aborted (Silent Failure)*
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-emerald-50 border-[3px] border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,1)] transform rotate-1">
                  <h4 className="font-black text-emerald-600 uppercase text-xs mb-2 flex items-center gap-1 bungee"><CheckCircle2 size={14} /> The Solution (Backend Authority)</h4>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">
                    We shifted the entire town quest logic into a new <code className="bg-emerald-200 px-1">COMPLETE_TOWN_QUEST</code> Secure Cloud Function action. The frontend now just passes the quest details, and the backend verifies the items, handles the deletion, and processes the XP/Level math safely behind the security firewall.
                  </p>
                  
                  {/* Visual Diagram - Solution */}
                  <div className="mt-4 flex flex-col gap-2 items-center">
                     <div className="bg-emerald-200 border-2 border-emerald-500 p-2 w-full text-center text-[10px] font-black uppercase">Client requests Quest Turn-in</div>
                     <ArrowRight size={16} className="text-emerald-500 rotate-90" />
                     <div className="bg-black text-emerald-400 p-2 w-full text-center text-[10px] font-mono border-2 border-emerald-500">
                        Cloud Function Transacts & Grants Level 3
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'white_hat_audit' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-yellow-500 text-yellow-600 pb-2 flex items-center gap-2 bungee">
                <ShieldAlert /> OPERATION: WHITE-HAT AUDIT
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-4">
                A comprehensive penetration test of <code className="bg-slate-200 px-1">firestore.rules</code> revealed 5 critical Insecure Direct Object Reference (IDOR) and Broken Access Control vulnerabilities. All 5 have been successfully patched.
              </p>

              <AuditTimeline detected="May 17, 2026 16:11" resolved="May 17, 2026 16:15" />
              
              <div className="space-y-4 mt-6">
                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h4 className="font-black text-yellow-400 uppercase text-sm mb-2 bungee">1. Unrestricted Profile Injection</h4>
                  <p className="text-xs font-mono text-slate-300 mb-2">
                    <span className="text-red-400 font-bold">Vulnerability:</span> New progression fields (Town Level, Dragons, Gemx) were missing from the update block-list. Attackers could set their Town Level to 9999 directly.
                  </p>
                  <p className="text-xs font-mono text-emerald-400">
                    <span className="font-bold">Patch:</span> Added all companion and town fields to the <code className="bg-slate-800">affectedKeys().hasAny([...])</code> rejection list.
                  </p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h4 className="font-black text-yellow-400 uppercase text-sm mb-2 bungee">2. The Guild Hijack</h4>
                  <p className="text-xs font-mono text-slate-300 mb-2">
                    <span className="text-red-400 font-bold">Vulnerability:</span> <code className="bg-slate-800">allow update: if isAuthenticated();</code> allowed any user to modify any guild, including changing the <code className="bg-slate-800">leaderId</code> to themselves.
                  </p>
                  <p className="text-xs font-mono text-emerald-400">
                    <span className="font-bold">Patch:</span> Enforced <code className="bg-slate-800">request.auth.uid == resource.data.leaderId</code> for core updates, preventing hijacks.
                  </p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h4 className="font-black text-yellow-400 uppercase text-sm mb-2 bungee">3. Market Price Manipulation</h4>
                  <p className="text-xs font-mono text-slate-300 mb-2">
                    <span className="text-red-400 font-bold">Vulnerability:</span> Anyone could update/delete marketplace listings. Attackers could change the price of rare items to 1 GX and buy them.
                  </p>
                  <p className="text-xs font-mono text-emerald-400">
                    <span className="font-bold">Patch:</span> Restricted market updates and deletes strictly to the <code className="bg-slate-800">sellerUid</code>.
                  </p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h4 className="font-black text-yellow-400 uppercase text-sm mb-2 bungee">4. The Ghost Assassin (PvP)</h4>
                  <p className="text-xs font-mono text-slate-300 mb-2">
                    <span className="text-red-400 font-bold">Vulnerability:</span> Attackers could inject arbitrary data into opponents' PvP rooms, instantly setting HP to 0 or breaking state.
                  </p>
                  <p className="text-xs font-mono text-emerald-400">
                    <span className="font-bold">Patch:</span> Restricted opponents to only updating <code className="bg-slate-800">hp</code> and <code className="bg-slate-800">lastHitBy</code> via <code className="bg-slate-800">hasOnly()</code> constraint.
                  </p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <h4 className="font-black text-yellow-400 uppercase text-sm mb-2 bungee">5. The Zombie Naga (Guild Wars)</h4>
                  <p className="text-xs font-mono text-slate-300 mb-2">
                    <span className="text-red-400 font-bold">Vulnerability:</span> Even though the Naga UI was fixed to use the backend, the database still allowed <code className="bg-slate-800">allow write: if isAuthenticated();</code>, leaving the backdoor open to scripts.
                  </p>
                  <p className="text-xs font-mono text-emerald-400">
                    <span className="font-bold">Patch:</span> Set <code className="bg-slate-800">allow write: if false;</code> since all Naga combat is processed securely on the backend.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

          {activeTab === 'economy_exploit' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tighter italic border-b-4 border-orange-500 text-orange-600 pb-2 flex items-center gap-2 bungee">
                <Zap /> OPERATION: ECONOMY HARDENING
              </h3>
              <p className="text-sm font-bold uppercase text-slate-700 mb-1">
                White-hat penetration testing of <code className="bg-slate-200 px-1">gameActions.ts</code> revealed 6 economy and resource exploits attackers could use to farm infinite GX, craft God-tier items for free, or bot kill rewards. All 6 are patched.
              </p>
              <AuditTimeline detected="May 17, 2026 16:24" resolved="May 17, 2026 16:55" />

              <div className="space-y-3 mt-4">

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 uppercase bungee">CRITICAL</span>
                    <h4 className="font-black text-orange-400 uppercase text-sm bungee">1. Negative Qty → Infinite GX (Market)</h4>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300 mb-1"><span className="text-red-400 font-bold">Exploit:</span> Sending <code className="bg-slate-800">qty: -100</code> in MARKET_PURCHASE made <code className="bg-slate-800">totalCost = price * -100</code>, causing the server to <em>add</em> tokens instead of deducting them.</p>
                  <p className="text-[10px] font-mono text-emerald-400"><span className="font-bold">Patch:</span> Strict integer validation: <code className="bg-slate-800">qty must be &gt;= 1</code>. Added secondary check: <code className="bg-slate-800">if (totalCost &lt; 0) throw Error</code>.</p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 uppercase bungee">CRITICAL</span>
                    <h4 className="font-black text-orange-400 uppercase text-sm bungee">2. Client Pricing Trust (God Sword)</h4>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300 mb-1"><span className="text-red-400 font-bold">Exploit:</span> BUY_ITEM and SELL_ITEM trusted the client-supplied <code className="bg-slate-800">cost</code> and <code className="bg-slate-800">value</code> fields entirely. Attackers could buy any item for -10,000 GX (gaining profit) or sell a Slime Extract for 9,999,999 GX.</p>
                  <p className="text-[10px] font-mono text-emerald-400"><span className="font-bold">Patch:</span> Created a server-side <code className="bg-slate-800">ITEM_CATALOG</code> dictionary. All costs and sell values are now looked up exclusively from this hardcoded server constant — the client payload values are discarded.</p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 uppercase bungee">CRITICAL</span>
                    <h4 className="font-black text-orange-400 uppercase text-sm bungee">3. Free Forge (Empty Material Array)</h4>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300 mb-1"><span className="text-red-400 font-bold">Exploit:</span> MIX_ITEM accepted <code className="bg-slate-800">itemsToConsumeKeys: []</code> and <code className="bg-slate-800">recipe.cost: 0</code>. The server would craft any endgame item with zero materials and zero GX cost — completely free.</p>
                  <p className="text-[10px] font-mono text-emerald-400"><span className="font-bold">Patch:</span> Empty arrays and negative recipe costs are now explicitly rejected. Each key is also type-validated before deletion to prevent prototype pollution.</p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 uppercase bungee">HIGH</span>
                    <h4 className="font-black text-orange-400 uppercase text-sm bungee">4. Kill Reward Botting (49k Loop)</h4>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300 mb-1"><span className="text-red-400 font-bold">Exploit:</span> PROCESS_KILL_REWARDS had only a weak upper-bound check. A script could call it 120x/min, each claiming 49,999 GX — maxing out any character in seconds from a terminal.</p>
                  <p className="text-[10px] font-mono text-emerald-400"><span className="font-bold">Patch:</span> Added a <code className="bg-slate-800">lastKillRewardAt</code> timestamp enforcing a minimum 3-second cooldown between claims. Also tightened bounds: values must be positive integers, not just floats under the cap.</p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 uppercase bungee">HIGH</span>
                    <h4 className="font-black text-orange-400 uppercase text-sm bungee">5. Unequip Item Duplication</h4>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300 mb-1"><span className="text-red-400 font-bold">Exploit:</span> UNEQUIP_ITEM used <code className="bg-slate-800">{"item.id || `RET_${slot}`"}</code> as the inventory key. Two rapid concurrent unequip requests for the same slot would write the same key, with the second silently overwriting — effectively duplicating the slot value.</p>
                  <p className="text-[10px] font-mono text-emerald-400"><span className="font-bold">Patch:</span> The return key now always includes both <code className="bg-slate-800">Date.now()</code> and a 4-char random suffix, guaranteeing uniqueness even under concurrent requests.</p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 uppercase bungee">MEDIUM</span>
                    <h4 className="font-black text-orange-400 uppercase text-sm bungee">6. Companion Summon Cost Bypass</h4>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300 mb-1"><span className="text-red-400 font-bold">Exploit:</span> HIRE_MATE and SUMMON_DRAGON accepted client-supplied <code className="bg-slate-800">cost</code> and <code className="bg-slate-800">summonUntil</code> values with zero validation. A player could summon a dragon for 1 GX and set the duration to an arbitrary far-future timestamp.</p>
                  <p className="text-[10px] font-mono text-emerald-400"><span className="font-bold">Patch:</span> Both actions now validate that cost is a positive integer ≤ 999,999 GX, and summon duration is capped at a maximum of 24 hours from now.</p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 uppercase bungee">CRITICAL</span>
                    <h4 className="font-black text-orange-400 uppercase text-sm bungee">7. Zero-Spark Faucet Bypass (ERC-20 Loss)</h4>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300 mb-1"><span className="text-red-400 font-bold">Exploit:</span> The claimFaucetReward Cloud Function failed to check the user's Firestore inventory server-side when exchanging sparks. Attackers could call the endpoint directly to claim unlimited $HUNT / $DWGX without ever possessing any sparks.</p>
                  <p className="text-[10px] font-mono text-emerald-400"><span className="font-bold">Patch:</span> Added a server-side transactional inventory check. The server now loads, validates, and deletes the 4 sparks from Firestore *inside the same atomic database transaction block* before broadcasting the transfer.</p>
                </div>

                <div className="bg-slate-900 border-[3px] border-black p-4 text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 uppercase bungee">CRITICAL</span>
                    <h4 className="font-black text-orange-400 uppercase text-sm bungee">8. TOCTOU Blockchain Faucet Race Condition</h4>
                  </div>
                  <p className="text-[10px] font-mono text-slate-300 mb-1"><span className="text-red-400 font-bold">Exploit:</span> The daily claim counter was updated only after slow blockchain transactions finished. Attackers could trigger 100+ parallel async requests in the same millisecond to bypass the daily cap check, draining the treasury wallet.</p>
                  <p className="text-[10px] font-mono text-emerald-400"><span className="font-bold">Patch:</span> Implemented a two-phase reservation pattern. The daily limit is checked and incremented in Firestore *before* the blockchain transaction is broadcasted, with a fallback rollback if the chain transfer fails.</p>
                </div>

              </div>
            </div>
          )}
    </div>
  );
});
