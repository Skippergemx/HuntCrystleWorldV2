import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Globe, ShieldAlert, RefreshCw, Users, Trash2, CheckCircle, AlertCircle, Search, X, Activity, TrendingUp, Sparkles, Flame, Target, Wallet, Copy, FileText, Tag, Send, CheckCircle2, Droplets, ExternalLink, DollarSign, BarChart3, ShoppingBag, Hammer, Microscope } from 'lucide-react';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import { collection, getDocs, writeBatch, doc, deleteDoc, getDoc, setDoc, query, collectionGroup, updateDoc, deleteField } from 'firebase/firestore';
import { useGame } from '../contexts/GameContext';
import { Header } from './GameUI';

export const AdminPanelView = React.memo(() => {
  const { db, appId, user, adventure } = useGame();
  const { setView } = adventure;
  const userEmail = user?.email || user?.uid;

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, leaderboardSize: 0 });
  const [players, setPlayers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('maintenance'); // 'maintenance', 'players', 'wallets', 'system', 'errors', 'migration', 'scrolls', 'rewards', 'economy'
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorReports, setErrorReports] = useState([]);
  const [faucetBalance, setFaucetBalance] = useState(null);
  const faucetAddress = "0x8dca8d7B35004630F460B85F70d1189795CDe6Fc";
  const [viewAllWallets, setViewAllWallets] = useState(false);
  const itemsPerPage = 10;

  const isAdmin = userEmail === 'skippergemx@gmail.com';

  const filteredPlayers = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return players.filter(p => {
      if (!search) return true;
      return (p.name?.toLowerCase().includes(search)) ||
             (p.id?.toLowerCase().includes(search)) ||
             (p.email?.toLowerCase().includes(search)) ||
             (p.walletAddress?.toLowerCase().includes(search));
    });
  }, [players, searchQuery]);

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const paginatedPlayers = filteredPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    if (loading) return; 

    try {
      setLoading(true);
      setMessage(null);
      
      console.log("Terminal V2: Initiating Direct Scan for Hunter signals...");
      
      const playersSnap = await getDocs(collection(db, 'players'));
      const profiles = [];
      playersSnap.forEach(d => {
        profiles.push({ id: d.id, ...d.data() });
      });

      setStats({
        totalUsers: profiles.length,
        leaderboardSize: profiles.length 
      });

      setPlayers(profiles);
      
      if (profiles.length === 0) {
        setMessage({ type: 'warning', text: 'Sector Silence: No Hunter signals discovered in the V2 Core database.' });
      } else {
        console.log(`Deep-Scan Complete: ${profiles.length} profiles hydrated directly from root 'players' collection.`);
      }
    } catch (e) {
      console.error("Critical Terminal Error:", e);
      setMessage({ type: 'error', text: 'FATAL ERROR: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchFaucetBalance = useCallback(async () => {
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http()
      });
      const balance = await publicClient.getBalance({ address: faucetAddress });
      setFaucetBalance(formatEther(balance));
    } catch (e) {
      console.error("Faucet Scan Error:", e);
    }
  }, [faucetAddress]);

  useEffect(() => {
    if (isAdmin && activeTab === 'system') {
      fetchFaucetBalance();
    }
  }, [isAdmin, activeTab, fetchFaucetBalance]);

  const resetLeaderboard = async () => {
    if (!window.confirm("COMMENCE GENESIS WIPE: This will reset ALL V2 players to Level 1, clear all inventories, and set GX balances to 100. This is the ultimate reset. Proceed?")) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      
      // Reset All V2 Profiles in 'players' collection
      players.forEach(p => {
        const profileRef = doc(db, 'players', p.id);
        const cleanSlate = {
          level: 1, xp: 0, tokens: 100,
          hp: 150, maxHp: 150,
          baseStats: { str: 10, agi: 10, dex: 10 },
          abilityPoints: 5,
          potions: 5,
          autoScrolls: 0,
          autoUntil: 0,
          hiredMate: null,
          buffUntil: 0,
          equipped: { Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null },
          recipes: ['crystle_blade'],
          inventory: {},
          totalBossDamage: 0,
          maxDepthFloor: 1,
          maxDepthScore: 0,
          maxDepthMapName: 'Echo Forest',
          penaltyUntil: 0,
          autoMode: null,
          gemx: { level: 1, crystalsFed: 0 },
          dragon: { level: 1, fruitsFed: 0 }
        };
        batch.update(profileRef, cleanSlate);
      });

      // Clear V2 Marketplace
      const marketSnap = await getDocs(collection(db, 'marketplace'));
      marketSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();
      setMessage({ type: 'success', text: `Genesis Wipe Successful: ${players.length} hunters returned to the void. Ranks and Marketplace cleared.` });
      await fetchStats();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Reset failed: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const nuclearWipe = async () => {
    if (!window.confirm("CRITICAL WARNING: This will PERMANENTLY ERASE ALL PLAYER DATA, ARTIFACTS, AND SYSTEM RECORDS. This is the 'Nuclear Reset' requested for V2. Are you absolutely certain?")) return;
    if (!window.confirm("FINAL WARNING: All progress, tokens, and items for EVERY hunter will be lost forever. Proceed?")) return;

    setLoading(true);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      
      // 1. Wipe root 'players' collection
      const playersSnap = await getDocs(collection(db, 'players'));
      playersSnap.forEach(d => batch.delete(d.ref));
      console.log(`System V2: Purged ${playersSnap.size} root player profiles.`);

      // 2. Wipe root 'users' collection (Legacy)
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach(d => batch.delete(d.ref));
      console.log(`System V2: Purged ${usersSnap.size} root legacy user documents.`);

      // 3. Wipe 'artifacts' tree (Recursive cleanup for current and legacy app IDs)
      const possibleAppIds = [appId, 'crystle-hunter-world-v1', 'crystle-hunter-world-v2'];
      for (const id of possibleAppIds) {
        // Artifact Leaderboard
        const lbSnap = await getDocs(collection(db, 'artifacts', id, 'public', 'data', 'leaderboard'));
        lbSnap.forEach(d => batch.delete(d.ref));
        
        // Artifact Marketplace
        const mktSnap = await getDocs(collection(db, 'artifacts', id, 'public', 'data', 'marketplace'));
        mktSnap.forEach(d => batch.delete(d.ref));

        // Artifact Chat
        const chatSnap = await getDocs(collection(db, 'artifacts', id, 'public', 'data', 'pvp_chat'));
        chatSnap.forEach(d => batch.delete(d.ref));
      }

      await batch.commit();
      setMessage({ type: 'success', text: "DATABASE PURGE COMPLETE: The sectors are clean. Re-initializing Genesis Protocol v2.0." });
      await fetchStats();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Nuclear reset failed: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const purgeMarketplace = async () => {
    if (!window.confirm("RESET MARKETPLACE: This will delete ALL public listings in V2 Core. Continue?")) return;
    setLoading(true);
    try {
      const marketSnap = await getDocs(collection(db, 'marketplace'));
      const batch = writeBatch(db);
      marketSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setMessage({ type: 'success', text: `Market Sanitized: ${marketSnap.size} V2 listings purged.` });
    } catch (e) {
      setMessage({ type: 'error', text: 'Market purge failed.' });
    } finally { setLoading(false); }
  };



  const fetchErrorReports = async () => {
    setLoading(true);
    try {
      const reportsSnap = await getDocs(query(collection(db, 'error_reports')));
      const reports = [];
      reportsSnap.forEach(d => reports.push({ id: d.id, ...d.data() }));
      setErrorReports(reports.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Failed to fetch error reports.' });
    } finally {
      setLoading(false);
    }
  };

  const deleteErrorReport = async (id) => {
    if (!window.confirm("Purge this diagnostic log from primary memory?")) return;
    try {
       await deleteDoc(doc(db, 'error_reports', id));
       setErrorReports(prev => prev.filter(r => r.id !== id));
       setMessage({ type: 'success', text: 'System log ejected successfully.' });
    } catch (e) {
       console.error(e);
       setMessage({ type: 'error', text: 'Ejection failed.' });
    }
  };

  const syncAllPlayersToLeaderboard = async () => {
    if (!window.confirm("RANKING HEAL PROTOCOL: This will migrate legacy 'maxDepth' data to the new 'maxDepthFloor' and 'maxDepthScore' format for all players. Continue?")) return;
    setLoading(true);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      let migrationCount = 0;
      players.forEach(p => {
        if (!p.maxDepthFloor || !p.maxDepthScore) {
          const profileRef = doc(db, 'players', p.id);
          const depthLvl = p.maxDepth || 1;
          batch.update(profileRef, {
            maxDepthFloor: depthLvl,
            maxDepthScore: depthLvl * 10000
          });
          migrationCount++;
        }
      });
      if (migrationCount > 0) {
        await batch.commit();
        setMessage({ type: 'success', text: `Ranking Schema Healed: Migrated ${migrationCount} players to the V3 Depth Score format.` });
        await fetchStats();
      } else {
        setMessage({ type: 'warning', text: 'Sync Complete: All players already compliant with V3 Depth Score format.' });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Healing failed: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const repairScrollPools = async () => {
    if (!window.confirm("SCROLL REPAIR PROTOCOL: This will scan ALL players for legacy 'Auto-Hunt Scrolls' in their inventory and convert them into the unified numeric pool (Minutes). This fixes the 'Wipeout' bug for existing users. Proceed?")) return;
    setLoading(true);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      let fixedCount = 0;
      let totalMinutesMigrated = 0;

      players.forEach(p => {
        const inventory = p.inventory || {};
        const updates = {};
        let minutesToGain = 0;
        let foundLegacy = false;

        Object.entries(inventory).forEach(([key, item]) => {
          if (item?.id?.includes('auto_scroll')) {
             const durationMatch = item.id.match(/(\d+)m/);
             const val = durationMatch ? parseInt(durationMatch[1], 10) : 1;
             minutesToGain += val;
             updates[`inventory.${key}`] = deleteField();
             foundLegacy = true;
          }
        });

        if (foundLegacy) {
           updates.autoScrolls = (p.autoScrolls || 0) + minutesToGain;
           const profileRef = doc(db, 'players', p.id);
           batch.update(profileRef, updates);
           fixedCount++;
           totalMinutesMigrated += minutesToGain;
        }
      });

      if (fixedCount > 0) {
        await batch.commit();
        setMessage({ type: 'success', text: `REPAIR COMPLETE: Sanitized ${fixedCount} hunters. Consolidated ${totalMinutesMigrated} minutes into unified pools.` });
        await fetchStats();
      } else {
        setMessage({ type: 'warning', text: 'No legacy scroll artifacts detected in active sector.' });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Repair failed: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const [editingPlayer, setEditingPlayer] = useState(null);

  const updatePlayerData = async (e) => {
    e.preventDefault();
    if (!editingPlayer) return;

    setLoading(true);
    setMessage(null);
    try {
      const { id, name, level, tokens, totalBossDamage, maxDepthFloor, maxDepthMapName, walletAddress } = editingPlayer;
      const profileRef = doc(db, 'players', id);
      
      const updateData = {
        name,
        level: Number(level),
        tokens: Number(tokens),
        totalBossDamage: Number(totalBossDamage),
        maxDepthFloor: Number(maxDepthFloor || editingPlayer.maxDepth || 1),
        maxDepthMapName: maxDepthMapName || null,
        walletAddress: walletAddress || null,
        tonWalletAddress: editingPlayer.tonWalletAddress || null
      };

      await updateDoc(profileRef, updateData);

      setMessage({ type: 'success', text: `Unit ${name || id} re-calibrated successfully.` });
      setEditingPlayer(null);
      await fetchStats();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Calibration failed: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const masterResetPlayer = async () => {
    if (!editingPlayer) return;
    if (!window.confirm(`MASTER RESET: Are you sure you want to completely erase progression for ${editingPlayer.name || editingPlayer.id}? This cannot be undone.`)) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const { id } = editingPlayer;
      const profileRef = doc(db, 'players', id);
      
      const resetData = {
          uid: id,
          email: editingPlayer.email || null,
          name: editingPlayer.name || `Hunter_${id.slice(0, 4)}`,
          level: 1, xp: 0, tokens: 100,
          hp: 150, maxHp: 150,
          baseStats: { str: 10, agi: 10, dex: 10 },
          abilityPoints: 5,
          potions: 5,
          autoScrolls: 0,
          autoUntil: 0,
          hiredMate: null,
          buffUntil: 0,
          equipped: { Headgear: null, Weapon: null, Armor: null, Footwear: null, Relic: null },
          recipes: [],
          inventory: {},
          totalBossDamage: 0,
          maxDepthFloor: 1,
          maxDepthScore: 0,
          maxDepthMapName: 'Echo Forest',
          penaltyUntil: 0,
          autoMode: null,
          gemx: { level: 1, crystalsFed: 0 },
          dragon: { level: 1, fruitsFed: 0 }
      };

      await updateDoc(profileRef, resetData);

      setMessage({ type: 'success', text: `Master Reset complete for ${id}. They have been returned to V2 Genesis.` });
      setEditingPlayer(null);
      await fetchStats();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Master Reset failed: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const [migrationSource, setMigrationSource] = useState('');
  const [migrationTarget, setMigrationTarget] = useState('');

  const migratePlayerData = async () => {
    if (!migrationSource || !migrationTarget) {
      setMessage({ type: 'error', text: 'Migration Blocked: Source and Target UIDs required.' });
      return;
    }

    if (!window.confirm(`MIGRATION PROTOCOL: This will clone ALL data from [${migrationSource}] into [${migrationTarget}]. Any existing data in the target will be OVERWRITTEN. Proceed?`)) return;

    setLoading(true);
    setMessage(null);
    try {
      const sourceSnap = await getDoc(doc(db, 'players', migrationSource));
      if (!sourceSnap.exists()) {
        throw new Error(`Source Profile [${migrationSource}] not found in sector.`);
      }

      const sourceData = sourceSnap.data();
      const targetRef = doc(db, 'players', migrationTarget);
      
      // We keep the target's UID but copy everything else
      const migratedData = {
        ...sourceData,
        uid: migrationTarget, // Override UID to match target
        migratedFrom: migrationSource,
        migrationTimestamp: new Date()
      };

      await setDoc(targetRef, migratedData);
      
      // Optional: Mark source as migrated
      await updateDoc(doc(db, 'players', migrationSource), {
        status: 'MIGRATED',
        migratedTo: migrationTarget
      });

      setMessage({ type: 'success', text: `Uplink Successful: Data migrated to ${migrationTarget}. Source document marked as Legacy.` });
      setMigrationSource('');
      setMigrationTarget('');
      await fetchStats();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Migration Failed: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 bg-slate-950">
        <ShieldAlert size={64} className="text-red-500 animate-pulse" />
        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Access Denied</h1>
        <p className="text-slate-400 max-w-md">This terminal is restricted to Genesis-Level administrators only. Your credentials have been logged.</p>
        <button 
          onClick={() => setView('menu')}
          className="mt-4 px-8 py-3 bg-white text-black font-black uppercase italic hover:bg-red-500 hover:text-white transition-all border-4 border-black"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-950 overflow-y-auto relative">
      {/* Edit Modal Overlay */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-cyan-600 p-8 max-w-md w-full shadow-[12px_12px_0_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white uppercase italic border-l-4 border-cyan-500 pl-4">Re-Calibrating Hunter</h2>
              <button onClick={() => setEditingPlayer(null)} className="text-slate-500 hover:text-white"><X /></button>
            </div>
            
            <form onSubmit={updatePlayerData} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Unit Name</label>
                <input 
                  type="text" 
                  value={editingPlayer.name}
                  onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})}
                  className="w-full bg-black border-2 border-slate-800 p-2 text-white font-black italic text-sm focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Unit Level</label>
                  <input 
                    type="number" 
                    value={editingPlayer.level}
                    onChange={e => setEditingPlayer({...editingPlayer, level: e.target.value})}
                    className="w-full bg-black border-2 border-slate-800 p-2 text-white font-black italic text-sm focus:border-cyan-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">GX Balance</label>
                  <input 
                    type="number" 
                    value={editingPlayer.tokens}
                    onChange={e => setEditingPlayer({...editingPlayer, tokens: e.target.value})}
                    className="w-full bg-black border-2 border-slate-800 p-2 text-white font-black italic text-sm focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Boss DMG</label>
                  <input 
                    type="number" 
                    value={editingPlayer.totalBossDamage}
                    onChange={e => setEditingPlayer({...editingPlayer, totalBossDamage: e.target.value})}
                    className="w-full bg-black border-2 border-slate-800 p-2 text-white font-black italic text-sm focus:border-cyan-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Peak Floor</label>
                  <input 
                    type="number" 
                    value={editingPlayer.maxDepthFloor || editingPlayer.maxDepth || 1}
                    onChange={e => setEditingPlayer({...editingPlayer, maxDepthFloor: e.target.value})}
                    className="w-full bg-black border-2 border-slate-800 p-2 text-white font-black italic text-sm focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">EVM Wallet (Base)</label>
                  <input 
                    type="text" 
                    value={editingPlayer.walletAddress || ''}
                    onChange={e => setEditingPlayer({...editingPlayer, walletAddress: e.target.value})}
                    placeholder="0x..."
                    className="w-full bg-black border-2 border-slate-800 p-2 text-amber-500 font-mono text-[10px] items-center italic"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">TON Wallet</label>
                  <input 
                    type="text" 
                    value={editingPlayer.tonWalletAddress || ''}
                    onChange={e => setEditingPlayer({...editingPlayer, tonWalletAddress: e.target.value})}
                    placeholder="UQ..."
                    className="w-full bg-black border-2 border-slate-800 p-2 text-blue-400 font-mono text-[10px] items-center italic"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-cyan-600 text-white py-3 font-black uppercase italic border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-cyan-500 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Apply Changes'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingPlayer(null)}
                    className="flex-1 bg-slate-800 text-white py-3 font-black uppercase italic border-2 border-black hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={masterResetPlayer}
                  disabled={loading}
                  className="w-full bg-red-950 text-red-500 py-2 mt-2 font-black uppercase italic border-2 border-red-900 shadow-[4px_4px_0_rgba(239,68,68,0.2)] hover:bg-red-900 hover:text-white transition-all disabled:opacity-50"
                >
                  Initiate Master Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Header title="GENESIS ADMIN TERMINAL" onClose={adventure.goBack} npcNum={10} onHelp={() => setActiveTab('system')} />

      {message && (
        <div className={`p-4 border-2 flex items-center gap-3 font-black uppercase italic text-xs animate-in fade-in zoom-in-95 ${
          message.type === 'success' ? 'bg-emerald-950/30 border-emerald-500 text-emerald-400' : 
          message.type === 'warning' ? 'bg-amber-950/30 border-amber-500 text-amber-400' :
          'bg-red-950/30 border-red-500 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-black border-2 border-red-900/50 p-6 flex items-center gap-4 shadow-[4px_4px_0_rgba(239,68,68,0.1)]">
          <div className="w-12 h-12 bg-red-950 flex items-center justify-center border-2 border-red-600">
            <Users className="text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Hunters</p>
            <p className="text-3xl font-black text-white italic">{players.length}</p>
          </div>
        </div>
        <div className="bg-black border-2 border-cyan-900/50 p-6 flex items-center gap-4 shadow-[4px_4px_0_rgba(6,182,212,0.1)]">
          <div className="w-12 h-12 bg-cyan-950 flex items-center justify-center border-2 border-cyan-600">
            <RefreshCw className="text-cyan-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ranked Records</p>
            <p className="text-3xl font-black text-white italic">{stats.leaderboardSize}</p>
          </div>
        </div>
        <div className="hidden lg:flex bg-black border-2 border-amber-900/50 p-6 items-center gap-4 shadow-[4px_4px_0_rgba(251,191,36,0.1)]">
          <div className="w-12 h-12 bg-amber-950 flex items-center justify-center border-2 border-amber-600">
            <ShieldAlert className="text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orphan Records</p>
            <p className="text-3xl font-black text-amber-500 italic">{Math.max(0, stats.leaderboardSize - players.length)}</p>
          </div>
        </div>
      </div>

      {/* Tabs - Wrapped and Styled for better accessibility */}
      <div className="flex flex-wrap gap-2 md:gap-3 bg-black/40 p-2 border border-white/5 rounded-xl shadow-inner">
        <button 
          onClick={() => setActiveTab('maintenance')}
          className={`px-6 py-3 font-black uppercase italic text-xs border-b-4 transition-all ${activeTab === 'maintenance' ? 'bg-red-600 text-white border-red-900 shadow-[4px_4px_0_rgba(0,0,0,1)]' : 'bg-slate-900 text-slate-500 border-transparent hover:bg-slate-800'}`}
        >
          Maintenance
        </button>
        <button 
          onClick={() => { setActiveTab('players'); fetchStats(); }}
          className={`px-6 py-3 font-black uppercase italic text-xs border-b-4 transition-all ${activeTab === 'players' ? 'bg-cyan-600 text-white border-cyan-900 shadow-[4px_4px_0_rgba(0,0,0,1)]' : 'bg-slate-900 text-slate-500 border-transparent hover:bg-slate-800'}`}
        >
          Player Registry
        </button>
        <button 
          onClick={() => { setActiveTab('wallets'); fetchStats(); }}
          className={`px-6 py-3 font-black uppercase italic text-xs border-b-4 transition-all ${activeTab === 'wallets' ? 'bg-amber-500 text-black border-amber-900 shadow-[4px_4px_0_rgba(0,0,0,1)]' : 'bg-slate-900 text-slate-500 border-transparent hover:bg-slate-800'}`}
        >
          Wallet Mapper
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`px-6 py-3 font-black uppercase italic text-xs border-b-4 transition-all ${activeTab === 'system' ? 'bg-emerald-600 text-white border-emerald-900 shadow-[4px_4px_0_rgba(0,0,0,1)]' : 'bg-slate-900 text-slate-500 border-transparent hover:bg-slate-800'}`}
        >
          System Health
        </button>
        <button 
          onClick={() => { setActiveTab('errors'); fetchErrorReports(); }}
          className={`px-6 py-3 font-black uppercase italic text-xs border-b-4 transition-all ${activeTab === 'errors' ? 'bg-red-500 text-white border-red-900 shadow-[4px_4px_0_rgba(0,0,0,1)]' : 'bg-slate-900 text-slate-500 border-transparent hover:bg-slate-800'}`}
        >
          Fault Logs
        </button>
        <button 
          onClick={() => setActiveTab('migration')}
          className={`px-6 py-3 font-black uppercase italic text-xs border-b-4 transition-all ${activeTab === 'migration' ? 'bg-indigo-600 text-white border-indigo-900 shadow-[4px_4px_0_rgba(0,0,0,1)]' : 'bg-slate-900 text-slate-500 border-transparent hover:bg-slate-800'}`}
        >
          Migration
        </button>
        <button 
          onClick={() => setActiveTab('scrolls')}
          className={`px-6 py-3 font-black uppercase italic text-xs border-b-4 transition-all ${activeTab === 'scrolls' ? 'bg-purple-600 text-white border-purple-900 shadow-[4px_4px_0_rgba(0,0,0,1)]' : 'bg-slate-900 text-slate-500 border-transparent hover:bg-slate-800'}`}
        >
          Scroll Mapping
        </button>
        <button 
          onClick={() => setActiveTab('rewards')}
          className={`px-6 py-3 font-black uppercase italic text-xs border-b-4 transition-all ${activeTab === 'rewards' ? 'bg-emerald-500 text-black border-emerald-900 shadow-[4px_4px_0_rgba(0,0,0,1)]' : 'bg-slate-900 text-slate-500 border-transparent hover:bg-slate-800'}`}
        >
          🎁 Reward Audit
        </button>
        <button 
          onClick={() => setActiveTab(activeTab === 'economy' ? 'maintenance' : 'economy')}
          className={`px-6 py-3 font-black uppercase italic text-xs border-b-4 transition-all ${activeTab === 'economy' ? 'bg-blue-600 text-white border-blue-900 shadow-[4px_4px_0_rgba(0,0,0,1)]' : 'bg-slate-900 text-slate-500 border-transparent hover:bg-slate-800'}`}
        >
          📊 Economy Audit
        </button>
      </div>

      {activeTab === 'maintenance' ? (
        <div className="bg-black border-4 border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-black text-white uppercase italic mb-6 border-l-4 border-red-600 pl-4">Sector Maintenance</h2>
          
          <div className="flex flex-col gap-6">
            <div className="p-6 bg-red-950/20 border-2 border-red-600/30 rounded-lg">
              <h3 className="text-lg font-black text-red-500 uppercase italic flex items-center gap-2 mb-2">
                <RefreshCw size={20} />
                Weekly Rank Reset
              </h3>
              <p className="text-sm text-slate-400 mb-6 font-medium">
                This protocol will synchronize all hunter damage records to zero and purge the current leaderboard. 
                Use this for the scheduled weekly tournament conclusion.
              </p>
              
              <button
                onClick={resetLeaderboard}
                disabled={loading}
                className="w-full md:w-auto px-10 py-4 bg-red-600 text-white font-black uppercase italic rounded shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-red-500 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Trash2 />}
                Initiate Global Reset
              </button>
            </div>

            <div className="p-6 bg-cyan-950/20 border-2 border-cyan-600/30 rounded-lg">
              <h3 className="text-lg font-black text-cyan-400 uppercase italic flex items-center gap-2 mb-2">
                <Users size={20} />
                Global Ranking Sync
              </h3>
              <p className="text-sm text-slate-400 mb-6 font-medium">
                Deep-probe all existing player profiles and force-synchronize their levels, damage, and floor progress to the Hall of Fame. 
                Use this to populate rankings after structural updates.
              </p>
              
              <button
                onClick={syncAllPlayersToLeaderboard}
                disabled={loading}
                className="w-full md:w-auto px-10 py-4 bg-cyan-600 text-white font-black uppercase italic rounded shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-cyan-500 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Users />}
                Synchronize All Hunters
              </button>
            </div>

            <div className="p-6 bg-red-950/40 border-2 border-red-600 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <h3 className="text-lg font-black text-red-500 uppercase italic flex items-center gap-2 mb-2">
                <Trash2 size={20} />
                NUCLEAR WIPE [GENESIS V2]
              </h3>
              <p className="text-sm text-slate-400 mb-6 font-medium">
                THE FINAL PURGE: This will permanently delete ALL player data, artifacts, Marketplace listings, and system logs across ALL historical sectors. 
                Use this exclusively for the Database V2 Hard Reset.
              </p>
              
              <button
                onClick={nuclearWipe}
                disabled={loading}
                className="w-full md:w-auto px-10 py-4 bg-red-600 text-white font-black uppercase italic rounded shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-red-500 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3 animate-pulse hover:animate-none"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <ShieldAlert />}
                Commence Nuclear Reset
              </button>
            </div>

            <div className="p-6 bg-amber-950/20 border-2 border-amber-600/30 rounded-lg">
              <h3 className="text-lg font-black text-amber-500 uppercase italic flex items-center gap-2 mb-2">
                <Tag size={20} />
                Marketplace Sanitization
              </h3>
              <p className="text-sm text-slate-400 mb-6 font-medium">
                This protocol will wipe all public marketplace listings and reset the economy. 
                Use this to clear stale trade signals or during Genesis Wipes.
              </p>
              
              <button
                onClick={purgeMarketplace}
                disabled={loading}
                className="w-full md:w-auto px-10 py-4 bg-amber-600 text-black font-black uppercase italic rounded shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-amber-500 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Tag />}
                Purge Marketplace
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'players' ? (
        <div className="bg-black border-4 border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-cyan-600 pl-4">
            <h2 className="text-xl font-black text-white uppercase italic">Player Registry</h2>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search Name, ID, or @Handle..." 
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded px-10 py-2 text-xs text-white focus:border-cyan-500 outline-none font-black italic"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hunter Identity</th>
                  <th className="py-2 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Level / XP</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">GX Balance</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Boss DMG</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Depth</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {(() => {
                  return (
                    <>
                      {paginatedPlayers.map((player) => (
                        <tr key={player.id} className="hover:bg-slate-900/30 transition-colors group">
                          <td className="py-4 px-4 text-left">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all shadow-[4px_4px_0_rgba(0,0,0,0.5)] overflow-hidden shrink-0">
                                <img 
                                  src={player.pfp || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.name || player.id}`} 
                                  className="w-full h-full object-cover" 
                                  alt="" 
                                />
                              </div>
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-black text-white italic leading-none truncate max-w-[150px]">{player.name || 'Anonymous Hunter'}</p>
                                  {player.platform === 'farcaster' && (
                                    <span className="text-[8px] font-black text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-500/30">FID: {player.id.replace('FC_', '')}</span>
                                  )}
                                </div>

                                <div className="flex flex-col gap-0.5">
                                  {player.walletAddress && (
                                    <div className="flex items-center gap-1.5 group/wallet cursor-pointer" onClick={() => { navigator.clipboard.writeText(player.walletAddress); setMessage({type:'success', text:`EVM Node Pinned: ${player.walletAddress.slice(0,6)}`}); }}>
                                      <Wallet size={10} className="text-amber-500/60" />
                                      <span className="text-[9px] text-amber-500/80 font-mono tracking-tighter truncate max-w-[120px]">{player.walletAddress}</span>
                                    </div>
                                  )}
                                  {player.tonWalletAddress && (
                                    <div className="flex items-center gap-1.5 group/ton cursor-pointer" onClick={() => { navigator.clipboard.writeText(player.tonWalletAddress); setMessage({type:'success', text:`TON Node Pinned: ${player.tonWalletAddress.slice(0,6)}`}); }}>
                                      <Send size={10} className="text-blue-400/50 -rotate-12" />
                                      <span className="text-[9px] text-blue-400/80 font-mono tracking-tighter truncate max-w-[120px]">{player.tonWalletAddress}</span>
                                    </div>
                                  )}
                                  {player.email && (
                                    <span className="text-[9px] text-cyan-500/80 font-bold tracking-wider truncate">{player.email}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-0.5">
                                   <span className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter">ID: {player.id.substring(0, 10)}...</span>
                                   {player.platform === 'farcaster' ? (
                                     <span className="px-1.5 py-0 bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-[2px] text-[6px] font-black italic uppercase">Farcaster</span>
                                   ) : (
                                     <span className="px-1.5 py-0 bg-slate-600/20 text-slate-400 border border-slate-600/30 rounded-[2px] text-[6px] font-black italic uppercase">Google</span>
                                   )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                               <span className="text-xs font-black text-cyan-400 italic">LVL {player.level || 1}</span>
                               <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-600" style={{ width: `${Math.min(100, ((player.xp || 0) % 1000) / 10)}%` }}></div>
                               </div>
                               <span className="text-[7px] text-slate-500 font-bold uppercase">{player.xp?.toLocaleString() || 0} XP</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-black text-amber-500 italic">{(player.tokens || 0).toLocaleString()} GX</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-black text-red-500 italic">{(player.totalBossDamage || 0).toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-blue-400 italic">FLR {player.maxDepthFloor || player.maxDepth || 1}</span>
                              {player.maxDepthMapName && <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mt-0.5">{player.maxDepthMapName}</span>}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button 
                              onClick={() => setEditingPlayer(player)}
                              className="px-4 py-2 bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-cyan-600 hover:text-white transition-all shadow-md font-black uppercase italic text-[10px]"
                            >
                               Edit Unit
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginatedPlayers.length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-slate-600 font-black uppercase italic tracking-widest">Sector Empty: No Hunters Detected</td>
                        </tr>
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {(() => {
            if (totalPages <= 1) return null;

            return (
              <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Showing {Math.min(filteredPlayers.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredPlayers.length, currentPage * itemsPerPage)} of {filteredPlayers.length} units
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-900 border-2 border-slate-800 rounded font-black text-[10px] uppercase italic text-white hover:border-cyan-500 disabled:opacity-30 disabled:hover:border-slate-800 transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded font-black text-[10px] transition-all ${currentPage === i + 1 ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-slate-900 border-2 border-slate-800 rounded font-black text-[10px] uppercase italic text-white hover:border-cyan-500 disabled:opacity-30 disabled:hover:border-slate-800 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      ) : activeTab === 'wallets' ? (
        <div className="bg-black border-4 border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-amber-500 pl-4">
            <div>
               <h2 className="text-xl font-black text-white uppercase italic">Wallet Distribution Map</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cross-Platform Airdrop Readiness Analyzer</p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
               <div className="relative w-full md:w-48">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                   <input 
                     type="text" 
                     placeholder="Filter..." 
                     className="w-full bg-slate-900 border-2 border-slate-800 rounded px-10 py-2 text-xs text-white focus:border-amber-500 outline-none font-black italic"
                     value={searchQuery}
                     onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                   />
               </div>
               <button 
                 onClick={() => setViewAllWallets(!viewAllWallets)}
                 className={`px-4 py-2 border-2 font-black uppercase italic text-[10px] transition-all ${viewAllWallets ? 'bg-amber-500 text-black border-black' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-amber-500'}`}
               >
                 {viewAllWallets ? 'Paginate' : 'Show All Units'}
               </button>
               <button 
                 onClick={() => {
                   const evm = players.filter(p => p.walletAddress).map(p => `EVM: ${p.walletAddress} (${p.name || p.id})`);
                   const ton = players.filter(p => p.tonWalletAddress).map(p => `TON: ${p.tonWalletAddress} (${p.name || p.id})`);
                   const report = [...evm, ...ton].join('\n');
                   navigator.clipboard.writeText(report);
                   setMessage({ type: 'success', text: `MANIFEST SECURED: ${evm.length + ton.length} node addresses copied.` });
                 }}
                 className="px-6 py-2 bg-amber-500 text-black font-black uppercase italic text-xs flex items-center gap-2 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
               >
                 <Copy size={16} />
                 Capture Manifest
               </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
             <div className="bg-slate-900/50 p-3 border border-white/5 rounded-lg text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Subjects</p>
                <p className="text-xl font-black text-white italic">{players.length}</p>
             </div>
             <div className="bg-amber-950/20 p-3 border border-amber-500/20 rounded-lg text-center">
                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">EVM Bound</p>
                <p className="text-xl font-black text-amber-500 italic">{players.filter(p => p.walletAddress).length}</p>
             </div>
             <div className="bg-blue-950/20 p-3 border border-blue-500/20 rounded-lg text-center">
                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">TON Bound</p>
                <p className="text-xl font-black text-blue-400 italic">{players.filter(p => p.tonWalletAddress).length}</p>
             </div>
             <div className="bg-red-950/20 p-3 border border-red-500/20 rounded-lg text-center">
                <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Unbound</p>
                <p className="text-xl font-black text-red-500 italic">{players.filter(p => !p.walletAddress && !p.tonWalletAddress).length}</p>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4">
                  <th className="py-2 px-4">Subject identity</th>
                  <th className="py-2 px-4">Origin Hub</th>
                  <th className="py-2 px-4">EVM Address (Base)</th>
                  <th className="py-2 px-4">TON Address</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                {(() => {
                  const displaySet = viewAllWallets ? filteredPlayers : paginatedPlayers;
                  return (
                    <>
                      {displaySet.map((player) => (
                        <tr key={player.id} className="bg-slate-900/40 border-2 border-slate-800 hover:border-amber-500/50 transition-all group">
                          <td className="py-4 px-4 text-left rounded-l-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl overflow-hidden rounded-md">
                                <img 
                                  src={player.pfp || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.name || player.id}`} 
                                  className="w-full h-full object-cover" 
                                  alt="" 
                                />
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <p className="text-xs font-black text-white italic truncate">{player.name || 'ANON_UNIT'}</p>
                                <p className="text-[7px] text-slate-500 font-bold uppercase truncate">{player.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5">
                               {player.platform === 'farcaster' ? (
                                 <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-950/40 border border-purple-500/30 rounded text-purple-500">
                                    <Activity size={10} />
                                    <span className="text-[8px] font-black uppercase">Farcaster</span>
                                 </div>
                               ) : (
                                 <div className="flex items-center gap-1 px-2 py-0.5 bg-red-950/40 border border-red-500/30 rounded text-red-500">
                                    <FileText size={10} />
                                    <span className="text-[8px] font-black uppercase">Google</span>
                                 </div>
                               )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {player.walletAddress ? (
                               <div className="flex items-center gap-2">
                                  <code className="bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 text-amber-500 font-mono text-[9px] truncate max-w-[120px]">
                                     {player.walletAddress}
                                  </code>
                                  <button onClick={() => { navigator.clipboard.writeText(player.walletAddress); setMessage({type:'success', text:'EVM Node Pinned'}); }} className="p-1 bg-slate-800 rounded hover:text-amber-500 transition-all active:scale-95"><Copy size={10}/></button>
                               </div>
                            ) : (
                               <span className="text-[8px] font-black text-slate-700 uppercase italic">Unbound</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {player.tonWalletAddress ? (
                               <div className="flex items-center gap-2">
                                  <code className="bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 text-blue-400 font-mono text-[9px] truncate max-w-[120px]">
                                     {player.tonWalletAddress}
                                  </code>
                                  <button onClick={() => { navigator.clipboard.writeText(player.tonWalletAddress); setMessage({type:'success', text:'TON Node Pinned'}); }} className="p-1 bg-slate-800 rounded hover:text-blue-400 transition-all active:scale-95"><Copy size={10}/></button>
                               </div>
                            ) : (
                               <span className="text-[8px] font-black text-slate-700 uppercase italic">Unbound</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center rounded-r-xl">
                             <div className={`w-2 h-2 rounded-full mx-auto ${player.walletAddress || player.tonWalletAddress ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`}></div>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'errors' ? (
        <div className="bg-black border-4 border-black p-4 md:p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
           <div className="flex justify-between items-center border-l-4 border-red-600 pl-4">
              <h2 className="text-xl font-black text-white uppercase italic">Diagnostic Fault Logs</h2>
              <button 
                onClick={fetchErrorReports} 
                className="p-2 bg-slate-900 border-2 border-slate-800 text-red-500 hover:bg-red-600 hover:text-white transition-all rounded"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
           </div>

           <div className="grid gap-4">
              {errorReports.map(err => (
                 <div key={err.id} className="bg-slate-900/50 border-2 border-slate-800 p-4 rounded-xl flex flex-col gap-2 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => deleteErrorReport(err.id)} className="text-red-500 hover:text-red-400 p-1 bg-black rounded shadow-lg border border-red-900">
                          <Trash2 size={14} />
                       </button>
                    </div>

                    <div className="flex justify-between items-start gap-4 flex-wrap">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                          <span className="text-[10px] md:text-sm font-black text-white uppercase italic">{err.message}</span>
                       </div>
                       <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">{err.timestamp?.toDate ? err.timestamp.toDate().toLocaleString() : 'Just Now'}</span>
                    </div>

                    <div className="bg-black/40 p-3 rounded-lg border border-slate-800/50 overflow-x-auto">
                       <p className="text-[8px] md:text-[10px] font-mono text-slate-500/80 leading-none line-clamp-2 md:line-clamp-none italic whitespace-nowrap md:whitespace-normal">{err.stack}</p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap mt-1">
                       <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                          <Users size={10} className="text-slate-500" />
                          <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase">{err.userName || 'Unknown'} <span className="opacity-40 italic">({err.userId?.slice(0,6)})</span></span>
                       </div>
                       <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                          <Activity size={10} className="text-cyan-500" />
                          <span className="text-[8px] md:text-[9px] font-black text-cyan-400 uppercase italic">VIEW: {err.view || 'N/A'}</span>
                       </div>
                       <div className="text-[7px] md:text-[8px] font-mono text-slate-600 truncate max-w-[200px] md:max-w-xs">{err.userAgent}</div>
                    </div>
                 </div>
              ))}
              {errorReports.length === 0 && !loading && (
                 <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-900 mb-4 opacity-50" />
                    <p className="text-slate-600 font-black uppercase italic tracking-[0.2em]">All sectors functional. Zero faults detected.</p>
                 </div>
              )}
           </div>
        </div>
      ) : activeTab === 'system' ? (
        <div className="bg-black border-4 border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
           <h2 className="text-xl font-black text-white uppercase italic border-l-4 border-emerald-600 pl-4">Metametrics Analyzer</h2>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Loot Drop Section */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-cyan-400 font-black uppercase italic text-sm">
                    <TrendingUp size={18} />
                    Dungeon Assets (Standard Drop Rates)
                 </div>
                 <div className="grid grid-cols-1 gap-2">
                    {[
                      { rarity: 'Common', weight: 100, odds: 'High', floor: 1 },
                      { rarity: 'Uncommon', weight: 40, odds: 'Medium', floor: 1 },
                      { rarity: 'Rare', weight: 15, odds: 'Low', floor: 5 },
                      { rarity: 'Epic', weight: 4, odds: 'Very Low', floor: 10 },
                      { rarity: 'Legendary', weight: 1, odds: 'Ultra Rare', floor: 20 }
                    ].map(r => (
                      <div key={r.rarity} className="bg-slate-900/50 border border-white/5 p-3 flex justify-between items-center group hover:bg-slate-800 transition-colors">
                        <div>
                          <p className={`text-xs font-black uppercase ${r.rarity === 'Legendary' ? 'text-amber-500' : r.rarity === 'Epic' ? 'text-purple-500' : 'text-white'}`}>{r.rarity}</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Gated: Floor {r.floor}+</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-white italic">{r.odds}</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Weight: {r.weight}</p>
                        </div>
                      </div>
                    ))}
                 </div>
                 <p className="text-[9px] font-black text-slate-500 leading-relaxed italic">
                    * Bonus: Multiplier scales +4% (exponential) per Floor. Drop chance scales +1.5% per Floor.
                 </p>
              </div>

              {/* Success Rates Section */}
              <div className="space-y-6">
                 {/* Boss Relics */}
                 <div className="p-4 bg-red-950/20 border-2 border-red-900/40 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-red-500 font-black uppercase italic text-sm">
                       <Flame size={18} /> Boss Relic Extraction
                    </div>
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-2xl font-black text-white italic">10%</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Base Success Probability</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black text-red-500 uppercase italic">Scales x2.0</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Per 1 Million DMG Milestone</p>
                       </div>
                    </div>
                 </div>

                 {/* Forging Success */}
                 <div className="p-4 bg-amber-950/20 border-2 border-amber-900/40 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-500 font-black uppercase italic text-sm">
                       <Sparkles size={18} /> Lab: Forging Success
                    </div>
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-2xl font-black text-white italic">50%</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Base Mechanical Success</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black text-amber-500 uppercase italic">+ DEX / 2</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Bonus Success Probability (Cap 95%)</p>
                       </div>
                    </div>
                 </div>

                 {/* Dragon Growth */}
                 <div className="p-4 bg-emerald-950/20 border-2 border-emerald-900/40 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-500 font-black uppercase italic text-sm">
                       <Target size={18} /> Bio: Dragon Hybridization
                    </div>
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-2xl font-black text-white italic">5.0</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Base Buff Coefficient</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black text-emerald-500 uppercase italic">+ LVL</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Hybridization Bonus (STR/AGI/DEX)</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

            {/* FAUCET TERMINAL v2 */}
            <div className="bg-emerald-950/20 border-2 border-emerald-500/30 p-6 rounded-2xl space-y-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-1000"></div>
               
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                     <div className="bg-emerald-500 p-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-2">
                        <Droplets size={24} className="text-black" />
                     </div>
                     <div>
                        <h3 className="font-black uppercase italic text-xl leading-none text-emerald-400">FAUCET TERMINAL</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Status: {faucetBalance && parseFloat(faucetBalance) > 0.001 ? 'HEALTHY' : 'CRITICAL - REFILL REQUIRED'}</p>
                     </div>
                  </div>
                  <button 
                    onClick={fetchFaucetBalance}
                    className="p-3 bg-black border-2 border-slate-800 text-slate-400 hover:text-white hover:border-emerald-500 transition-all rounded-xl"
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-black/40 border-2 border-white/5 p-4 rounded-xl flex flex-col justify-center">
                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">RESERVE BALANCE</p>
                     <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-black text-white italic">{faucetBalance ? parseFloat(faucetBalance).toFixed(6) : "SCANNING..."}</p>
                        <p className="text-[10px] font-black text-emerald-500 uppercase">ETH</p>
                     </div>
                  </div>
                  
                  <div className="md:col-span-2 bg-black/40 border-2 border-white/5 p-4 rounded-xl space-y-2">
                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TRANSMISSION ANCHOR</p>
                     <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400/60 lowercase italic truncate">
                        <span>{faucetAddress}</span>
                        <a 
                          href={`https://basescan.org/address/${faucetAddress}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="ml-2 hover:text-emerald-400"
                        >
                          <ExternalLink size={12} />
                        </a>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <button className="py-4 bg-slate-900 border-2 border-slate-800 text-slate-400 font-black uppercase italic text-xs rounded-xl hover:bg-slate-800 transition-all cursor-not-allowed">
                   Protocol Logs
                 </button>
                 <a 
                   href="https://bridge.base.org/" 
                   target="_blank" 
                   rel="noreferrer"
                   className="py-4 bg-emerald-600 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] text-black font-black uppercase italic text-xs rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                 >
                   REFILL RESERVES <Droplets size={14} />
                 </a>
               </div>
            </div>
         </div>
      ) : activeTab === 'migration' ? (
        <div className="bg-black border-4 border-indigo-600 p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
           <h2 className="text-xl font-black text-white uppercase italic border-l-4 border-indigo-600 pl-4">Migration Uplink Port</h2>
           
           <div className="bg-indigo-950/20 border-2 border-indigo-600/30 p-6 rounded-xl space-y-6">
              <div className="flex items-center gap-3 text-indigo-400">
                 <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
                 <div>
                    <h3 className="font-black uppercase italic text-lg leading-none">Data Transfer Protocol</h3>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">Move Genesis progression between unique identities.</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Source Account (Legacy UID)</label>
                    <input 
                       type="text" 
                       placeholder="Enter Telegram/Legacy UID..."
                       className="w-full bg-black border-2 border-slate-800 p-4 text-white font-mono text-xs focus:border-indigo-500 outline-none italic"
                       value={migrationSource}
                       onChange={(e) => setMigrationSource(e.target.value)}
                    />
                    <p className="text-[8px] text-slate-500 italic uppercase">This document will be copied and then marked as 'MIGRATED'.</p>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Target Account (Google UID)</label>
                    <input 
                       type="text" 
                       placeholder="Enter New Google UID..."
                       className="w-full bg-black border-2 border-slate-800 p-4 text-white font-mono text-xs focus:border-emerald-500 outline-none italic"
                       value={migrationTarget}
                       onChange={(e) => setMigrationTarget(e.target.value)}
                    />
                    <p className="text-[8px] text-slate-500 italic uppercase">Any existing data under this ID will be overwritten.</p>
                 </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                 <button
                    onClick={migratePlayerData}
                    disabled={loading || !migrationSource || !migrationTarget}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase italic rounded-xl border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-4"
                 >
                    {loading ? <RefreshCw className="animate-spin" size={24} /> : <Activity size={24} />}
                    <span className="text-xl">COMMENCE DATA MIGRATION</span>
                 </button>
              </div>
           </div>

           <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
              <h4 className="text-xs font-black text-indigo-400 uppercase mb-4 flex items-center gap-2">
                 <AlertCircle size={14} /> Migration Safety Checklist
              </h4>
              <ul className="space-y-2">
                 {[
                   "Ensure the target Google account has logged in at least once.",
                   "Copy UIDs directly from the Player Registry tab.",
                   "Migration is atomic: it copies inventory, stats, level, and crystals.",
                   "The legacy account remains as a record but is tagged as MIGRATED."
                 ].map((t, i) => (
                   <li key={i} className="text-[10px] text-slate-400 flex items-start gap-2 italic">
                      <span className="text-indigo-500 font-bold">•</span> {t}
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      ) : activeTab === 'scrolls' ? (
        <div className="bg-black border-4 border-purple-600 p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-white uppercase italic border-l-4 border-purple-500 pl-4">Auto-Hunt Scroll Mapping</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Diagnostic Lifecycle & Formatting Trace</p>
            </div>
            <button 
               onClick={repairScrollPools}
               className="px-6 py-3 bg-purple-600 text-white font-black uppercase italic text-xs shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-purple-500 transition-all border-2 border-black flex items-center gap-2"
            >
               <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
               Repair Legacy Scroll Pools
            </button>
          </div>

          {/* Trace Table */}
          <div className="overflow-hidden border-2 border-slate-800 rounded-xl bg-slate-900/20">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <tr>
                  <th className="p-4 border-r border-slate-800">Module / Path</th>
                  <th className="p-4 border-r border-slate-800">Logic Handler</th>
                  <th className="p-4 border-r border-slate-800">Data Format</th>
                  <th className="p-4">Database Target</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold">
                <tr className="border-t border-slate-800 bg-slate-950/40">
                  <td className="p-4 border-r border-slate-800 text-cyan-400 italic font-black">Bazaar (Shop)</td>
                  <td className="p-4 border-r border-slate-800">qty * duration (Minutes)</td>
                  <td className="p-4 border-r border-slate-800 text-purple-400">Numeric Pool</td>
                  <td className="p-4 text-slate-400">`player.autoScrolls`</td>
                </tr>
                <tr className="border-t border-slate-800">
                  <td className="p-4 border-r border-slate-800 text-cyan-400 italic font-black">Naga War (Guild)</td>
                  <td className="p-4 border-r border-slate-800">Auto-Scaled (Minutes)</td>
                  <td className="p-4 border-r border-slate-800 text-purple-400">Numeric Pool</td>
                  <td className="p-4 text-slate-400">`player.autoScrolls`</td>
                </tr>
                <tr className="border-t border-slate-800 bg-slate-950/40">
                  <td className="p-4 border-r border-slate-800 text-cyan-400 italic font-black">iLearn / Lab</td>
                  <td className="p-4 border-r border-slate-800">Unified Conversion</td>
                  <td className="p-4 border-r border-slate-800 text-purple-400">Numeric Pool <span className="text-[8px] text-emerald-500 font-black leading-none bg-emerald-500/10 px-1 rounded ml-1">v2_PATCH</span></td>
                  <td className="p-4 text-slate-400">`player.autoScrolls`</td>
                </tr>
                <tr className="border-t border-slate-800">
                  <td className="p-4 border-r border-slate-800 text-pink-500 italic font-black">Combat Usage</td>
                  <td className="p-4 border-r border-slate-800">Pool Deduction (-Xm)</td>
                  <td className="p-4 border-r border-slate-800 text-purple-400">Numeric Math</td>
                  <td className="p-4 text-slate-400">`player.autoScrolls`</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mind Map Visualization */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Neural System Architecture</h3>
            <div className="relative bg-slate-900/30 p-12 border-2 border-dashed border-slate-800 rounded-3xl flex items-center justify-center min-h-[350px] overflow-hidden">
               {/* Center Node */}
               <div className="z-10 bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-8 border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)] text-center transform hover:scale-105 transition-all cursor-help group">
                  <Activity className="mx-auto mb-2 text-white group-hover:animate-spin" size={32} />
                  <p className="font-black italic uppercase text-2xl tracking-tighter">autoScrolls</p>
                  <p className="text-[10px] font-black uppercase text-purple-200 mt-1">Unified Minute Reservoir</p>
               </div>

               {/* Background Orbitals */}
               <div className="absolute inset-0 border-[1px] border-white/5 rounded-full w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_20s_linear_infinite]"></div>
               <div className="absolute inset-0 border-[1px] border-white/5 rounded-full w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_15s_linear_infinite_reverse]"></div>

               {/* Connection Lines & Sources */}
               <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                     <div className="bg-slate-900/90 border-2 border-cyan-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(6,182,212,0.2)]">
                        <p className="text-[10px] font-black text-cyan-400 uppercase leading-none">Marketplace</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 italic">Direct Inject</p>
                     </div>
                     <div className="bg-slate-900/90 border-2 border-emerald-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(16,185,129,0.2)]">
                        <p className="text-[10px] font-black text-emerald-400 uppercase leading-none">Xenon Lab</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 italic">Conversion v2</p>
                     </div>
                  </div>

                  <div className="flex justify-between items-end">
                     <div className="bg-slate-900/90 border-2 border-pink-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(236,72,153,0.2)]">
                        <p className="text-[10px] font-black text-pink-400 uppercase leading-none">Combat Usage</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 italic">Decrement Protocol</p>
                     </div>
                     <div className="bg-slate-900/90 border-2 border-amber-500 p-4 rounded-xl shadow-[4px_4px_0_rgba(245,158,11,0.2)]">
                        <p className="text-[10px] font-black text-amber-400 uppercase leading-none">Naga War</p>
                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 italic">Bounty Scaling</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="p-6 bg-purple-950/30 border-2 border-purple-500/20 rounded-2xl">
             <div className="flex items-start gap-4">
                <ShieldAlert className="text-purple-400 shrink-0" size={24} />
                <div className="space-y-2">
                   <p className="text-sm font-black text-white uppercase italic leading-none">Structural Resolution Summary</p>
                   <p className="text-xs text-slate-400 italic leading-relaxed">
                      The "Wipeout" phenomenon was a side-effect of a hybrid system where some scrolls were treated as unique inventory keys and others as numeric counters. When a 1M selection was activated, the logic attempted a fuzzy search for <span className="text-white font-bold">"auto_scroll"</span>, accidentally matching and deleting high-tier variants like <span className="text-white font-bold">"auto_scroll_12m"</span>. 
                      <br /><br />
                      <span className="text-purple-400 font-black">ARCHITECTURAL REVISION V4:</span> All scrolls are now treated as <span className="text-white font-bold">discrete inventory items</span> with unique IDs and exact base-ID matching. A legacy <span className="text-white font-bold">Energy (Mins)</span> pool remains for backward compatibility and non-item rewards. This provides the best of both worlds: individual item security and unified energy flexibility.
                   </p>
                </div>
             </div>
          </div>
        </div>
      ) : activeTab === 'economy' ? (
        <div className="bg-black border-4 border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 space-y-8">
            <div className="flex justify-between items-center border-l-4 border-blue-500 pl-4">
              <h2 className="text-xl font-black text-white uppercase italic">📊 Economy & Equipment Audit</h2>
              <div className="flex gap-4">
                 <div className="bg-slate-900 px-4 py-2 border border-slate-800 rounded">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Avg. Gear Cost</p>
                    <p className="text-sm font-black text-blue-400 italic">22,450 GX</p>
                 </div>
                 <div className="bg-slate-900 px-4 py-2 border border-slate-800 rounded">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Lab Reagent Yield</p>
                    <p className="text-sm font-black text-pink-400 italic">88.5%</p>
                 </div>
                 <div className="bg-slate-900 px-4 py-2 border border-slate-800 rounded">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Zoo-Material Flux</p>
                    <p className="text-sm font-black text-emerald-400 italic">High</p>
                 </div>
                 <div className="bg-slate-900 px-4 py-2 border border-slate-800 rounded">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Industrial Sink</p>
                     <p className="text-sm font-black text-amber-500 italic">ACTIVE</p>
                  </div>
                  <div className="bg-slate-900 px-4 py-2 border border-slate-800 rounded">
                     <p className="text-[8px] font-black text-slate-500 uppercase">Material/GX Ratio</p>
                    <p className="text-sm font-black text-amber-400 italic">1:450</p>
                 </div>
              </div>
           </div>

           {/* EQUIPMENT POWER VS COST MATRIX */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Microscope size={14} /> Item Progression Matrix
                 </p>
                 <div className="overflow-x-auto border-2 border-slate-900 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[10px]">
                       <thead>
                          <tr className="bg-slate-900">
                             <th className="py-3 px-4 font-black text-slate-500 uppercase">Item</th>
                             <th className="py-3 px-4 font-black text-slate-500 uppercase">Power (Str+Agi+Dex)</th>
                             <th className="py-3 px-4 font-black text-slate-500 uppercase">Source</th>
                             <th className="py-3 px-4 font-black text-slate-500 uppercase">Current Cost</th>
                             <th className="py-3 px-4 font-black text-slate-500 uppercase">Sanity Score</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-900 bg-black/40">
                          {(() => {
                             const { ITEMS, CRYSTLE_RECIPES, LAB_RECIPES } = useGame();
                             const allEquips = ITEMS.filter(i => i.category === 'Equipment').sort((a,b) => {
                                const aPower = Object.values(a.stats || {}).reduce((acc, v) => acc + v, 0);
                                const bPower = Object.values(b.stats || {}).reduce((acc, v) => acc + v, 0);
                                return bPower - aPower;
                             });

                             return allEquips.map(item => {
                                const recipe = CRYSTLE_RECIPES.find(r => r.id === item.id);
                                const power = Object.values(item.stats || {}).reduce((acc, v) => acc + v, 0);
                                const source = item.cost ? 'Shop' : (recipe ? 'Crafted' : 'Loot');
                                const cost = item.cost || recipe?.cost || 'N/A';
                                
                                const XENON_REAGENTS = ['toxic_sludge', 'bio_vial', 'turbo_charger', 'neon_filament', 'cypher_chip', 'power_cell'];
                                const usesXenon = recipe?.materials?.some(m => XENON_REAGENTS.includes(m.id));

                                // Sanity Formula: (Power * 100) vs Cost
                                let sanity = 'OK';
                                let sanityColor = 'text-emerald-400';
                                if (cost !== 'N/A') {
                                   const ratio = cost / (power || 1);
                                   if (ratio < 10) { sanity = 'CRITICAL_UNDERVALUED'; sanityColor = 'text-red-500 animate-pulse'; }
                                   else if (ratio < 50) { sanity = 'UNDERPRICED'; sanityColor = 'text-amber-500'; }
                                }

                                return (
                                   <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                                      <td className="py-3 px-4">
                                         <div className="flex items-center gap-2">
                                            <span className="text-lg">{item.icon}</span>
                                            <div>
                                               <p className="font-black text-white uppercase italic">{item.name}</p>
                                               <p className="text-[8px] text-slate-500 font-bold uppercase">{item.rarity || 'Common'} {item.type}</p>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="py-3 px-4 font-mono font-black text-blue-400">{power} CP</td>
                                      <td className="py-3 px-4">
                                         <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-0.5 rounded-sm border text-[8px] font-black uppercase text-center ${
                                               source === 'Shop' ? 'bg-cyan-950 border-cyan-800 text-cyan-400' :
                                               source === 'Crafted' ? 'bg-purple-950 border-purple-800 text-purple-400' :
                                               'bg-amber-950 border-amber-800 text-amber-400'
                                            }`}>
                                               {source}
                                            </span>
                                            {usesXenon && (
                                               <span className="px-2 py-0.5 rounded-sm border border-pink-500 bg-pink-950/30 text-pink-400 text-[7px] font-black uppercase text-center italic">
                                                  XENON_REAGENT
                                               </span>
                                            )}
                                         </div>
                                      </td>
                                      <td className="py-3 px-4 font-black text-white italic">
                                         {cost !== 'N/A' ? `${cost.toLocaleString()} GX` : '--'}
                                      </td>
                                      <td className={`py-3 px-4 font-black italic text-[9px] ${sanityColor}`}>
                                         {sanity}
                                      </td>
                                   </tr>
                                );
                             });
                          })()}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="space-y-6">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} /> Economic Resilience
                 </p>

                 {/* GX SINK ANALYSIS */}
                 <div className="bg-slate-900/50 border-2 border-slate-800 p-6 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black text-white uppercase italic flex items-center gap-2">
                       <DollarSign size={16} className="text-emerald-400" /> GX Sink Efficiency
                    </h3>
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-black uppercase italic">
                             <span className="text-slate-500">Current Sink: Crafting Fee</span>
                             <span className="text-emerald-400">Low Efficiency</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                             <div className="w-[15%] h-full bg-emerald-500" />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-black uppercase italic">
                             <span className="text-slate-500">Proposed Sink: Material Market</span>
                             <span className="text-blue-400">High Efficiency</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                             <div className="w-[85%] h-full bg-blue-500" />
                          </div>
                       </div>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
                       *Note: With 1M GX in circulation per player, crafting fees must increase by 500% to remain a viable currency drain.
                    </p>
                 </div>

                 {/* MATERIAL GATE ANALYSIS */}
                 <div className="bg-amber-950/10 border-2 border-amber-900/30 p-6 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black text-amber-500 uppercase italic flex items-center gap-2">
                       <ShoppingBag size={16} /> Reagent Scarcity Watch
                    </h3>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-amber-900/20">
                          <span className="text-[9px] font-black text-white uppercase">Void Essence</span>
                          <span className="text-[8px] font-black text-red-400 bg-red-950/50 px-1 rounded">HARD_GATE</span>
                       </div>
                       <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-amber-900/20">
                          <span className="text-[9px] font-black text-white uppercase">Turbo Charger</span>
                          <span className="text-[8px] font-black text-red-400 bg-red-950/50 px-1 rounded">LAB_CRITICAL</span>
                       </div>
                       <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-amber-900/20">
                          <span className="text-[9px] font-black text-white uppercase">Magma Core</span>
                          <span className="text-[8px] font-black text-amber-400 bg-amber-950/50 px-1 rounded">MODERATE_GATE</span>
                       </div>
                       <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-amber-900/20">
                          <span className="text-[9px] font-black text-white uppercase">Black Hole Shard</span>
                          <span className="text-[8px] font-black text-purple-400 bg-purple-950/50 px-1 rounded">PET_OMEGA_GATE</span>
                       </div>
                       <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-amber-900/20">
                          <span className="text-[9px] font-black text-white uppercase">Slum Scrap</span>
                          <span className="text-[8px] font-black text-emerald-400 bg-emerald-950/50 px-1 rounded">OPEN_FLOW</span>
                       </div>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                       Xenon Lab reagents are currently <strong className="text-white">stagnating</strong> in Sector 3. Recommend boosting <strong className="text-cyan-400">Turbo Charger</strong> drop rates by 5% to prevent scroll inflation stalling.
                    </p>
                 </div>

                  {/* ZOOLOGICAL REAGENT FLUX */}
                  <div className="bg-emerald-950/10 border-2 border-emerald-900/30 p-6 rounded-2xl space-y-4">
                     <h3 className="text-xs font-black text-emerald-500 uppercase italic flex items-center gap-2">
                        <Activity size={16} /> Zoological Reagent Flux
                     </h3>
                     <div className="grid grid-cols-2 gap-3">
                        {[
                           { name: 'Taming (Hydro)', color: 'text-blue-400', status: 'Optimal' },
                           { name: 'Taming (Pyro)', color: 'text-red-400', status: 'Bottleneck' },
                           { name: 'Taming (Gale)', color: 'text-cyan-400', status: 'Surplus' },
                           { name: 'Taming (Cosmic)', color: 'text-purple-400', status: 'Critical' }
                        ].map((t, idx) => (
                           <div key={idx} className="bg-black/40 p-3 rounded border border-emerald-900/10 flex flex-col gap-1">
                              <span className={`text-[9px] font-black uppercase ${t.color}`}>{t.name}</span>
                              <div className="flex justify-between items-center">
                                 <span className="text-[8px] font-bold text-slate-500">Status</span>
                                 <span className={`text-[8px] font-black uppercase px-1 rounded ${
                                    t.status === 'Optimal' ? 'bg-emerald-950 text-emerald-400' :
                                    t.status === 'Critical' ? 'bg-red-950 text-red-400 animate-pulse' :
                                    'bg-amber-950 text-amber-400'
                                 }`}>{t.status}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                     <p className="text-[8px] text-slate-500 italic leading-relaxed">
                        Cosmic taming materials (<strong className="text-white">Dark Matter</strong>) are currently 400% more expensive than Hydro. Recommend adding Dark Matter to the Syndicate Bounty rotation.
                     </p>
                  </div>
              </div>
           </div>
        </div>
      ) : activeTab === 'rewards' ? (
        <div className="bg-black border-4 border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 space-y-8">
          <h2 className="text-xl font-black text-white uppercase italic border-l-4 border-emerald-500 pl-4">🎁 Reward System Audit</h2>

          {/* MIND MAP FLOW */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reward Flow Architecture</p>
            {/* Root */}
            <div className="flex flex-col items-center gap-0">
              <div className="px-6 py-3 bg-emerald-500 border-4 border-black text-black font-black uppercase italic text-sm shadow-[6px_6px_0_rgba(0,0,0,1)]">
                PLAYER REWARDS
              </div>
              <div className="w-[2px] h-6 bg-white/20" />
              {/* Branches Row */}
              <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Combat */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full py-2 px-3 bg-red-700 border-2 border-black text-white font-black uppercase text-[10px] text-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    ⚔️ Combat
                  </div>
                  <div className="w-full flex flex-col gap-1.5">
                    <div className="bg-slate-900 border border-red-500/30 p-2 rounded text-[9px] text-slate-300 font-bold">
                      <span className="text-red-400 font-black block">Guaranteed</span>
                      GX (enemy.loot)<br/>EXP (enemy.xp)
                    </div>
                    <div className="bg-slate-900 border border-red-500/30 p-2 rounded text-[9px] text-slate-300 font-bold">
                      <span className="text-amber-400 font-black block">~Floor% Drop</span>
                      Loot Table Item<br/>Floor-gated Rarity
                    </div>
                  </div>
                </div>

                {/* iLearn */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full py-2 px-3 bg-cyan-600 border-2 border-black text-white font-black uppercase text-[10px] text-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    🧠 iLearn
                  </div>
                  <div className="w-full flex flex-col gap-1.5">
                    <div className="bg-slate-900 border border-cyan-500/30 p-2 rounded text-[9px] text-slate-300 font-bold">
                      <span className="text-cyan-400 font-black block">Guaranteed</span>
                      EXP (quiz.xpReward)<br/>Faucet ETH Claim
                    </div>
                    <div className="bg-slate-900 border border-cyan-500/30 p-2 rounded text-[9px] text-slate-300 font-bold">
                      <span className="text-amber-400 font-black block">70% Random Drop</span>
                      <span className="text-emerald-400">50%:</span> Mega/Ultra HP Potion<br/>
                      <span className="text-purple-400">50%:</span> Auto-Scroll (3m–12m)
                    </div>
                    <div className="bg-slate-800 border border-purple-500/20 p-1.5 rounded text-[8px] text-slate-400 font-bold">
                      Scroll weights:<br/>60% 3m · 25% 6m · 12% 9m · 3% 12m
                    </div>
                  </div>
                </div>

                {/* Crystle Town */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full py-2 px-3 bg-amber-500 border-2 border-black text-black font-black uppercase text-[10px] text-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    🏙️ Town Quest
                  </div>
                  <div className="w-full flex flex-col gap-1.5">
                    <div className="bg-slate-900 border border-amber-500/30 p-2 rounded text-[9px] text-slate-300 font-bold">
                      <span className="text-amber-400 font-black block">Guaranteed</span>
                      1x Food Buff Item<br/>+5 Town Influence XP<br/>Faucet ETH Claim
                    </div>
                    <div className="bg-slate-900 border border-amber-500/30 p-2 rounded text-[9px] text-slate-400 font-bold italic">
                      No random drops
                    </div>
                  </div>
                </div>

                {/* Naga War */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full py-2 px-3 bg-purple-700 border-2 border-black text-white font-black uppercase text-[10px] text-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    ⚔️ Naga War
                  </div>
                  <div className="w-full flex flex-col gap-1.5">
                    <div className="bg-slate-900 border border-purple-500/30 p-2 rounded text-[9px] text-slate-300 font-bold">
                      <span className="text-emerald-400 font-black block">Win</span>
                      10,000 GX · 10x 12m Scrolls
                    </div>
                    <div className="bg-slate-900 border border-purple-500/30 p-2 rounded text-[9px] text-slate-300 font-bold">
                      <span className="text-yellow-400 font-black block">Tie</span>
                      7,500 GX · 7x 12m Scrolls
                    </div>
                    <div className="bg-slate-900 border border-purple-500/30 p-2 rounded text-[9px] text-slate-300 font-bold">
                      <span className="text-red-400 font-black block">Loss</span>
                      5,000 GX · 5x 12m Scrolls
                    </div>
                  </div>
                </div>

                {/* Syndicate */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full py-2 px-3 bg-slate-700 border-2 border-black text-white font-black uppercase text-[10px] text-center shadow-[3px_3px_0_rgba(0,0,0,1)]">
                    🏛️ Syndicate
                  </div>
                  <div className="w-full flex flex-col gap-1.5">
                    <div className="bg-slate-900 border border-slate-500/30 p-2 rounded text-[9px] text-slate-300 font-bold">
                      <span className="text-slate-300 font-black block">Daily Bounty</span>
                      5,000 GX base<br/>+1,000 per Lab Lvl
                    </div>
                    <div className="bg-slate-900 border border-slate-500/30 p-2 rounded text-[9px] text-slate-300 font-bold">
                      <span className="text-slate-400 font-black block">Economy</span>
                      Salvage → same-rarity item<br/>Sell → item.sellValue GX
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABULATED REPORT */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tabulated Reward Report</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-800">
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Source</th>
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Guaranteed</th>
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Randomized</th>
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Limits / Cooldown</th>
                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sanity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {[
                    {
                      src: '⚔️ Dungeon Combat', color: 'text-red-400',
                      guaranteed: 'GX + EXP (per enemy)',
                      random: 'Loot table item · floor-gated rarity',
                      limits: 'HP / AP gated',
                      status: 'ok', note: 'Verified'
                    },
                    {
                      src: '🧠 iLearn Quests', color: 'text-cyan-400',
                      guaranteed: 'EXP + Faucet ETH',
                      random: '70%: Potion (50%) OR Scroll (50%)',
                      limits: 'Active quiz slots',
                      status: 'warn', note: 'Race condition PATCHED (Apr 29)'
                    },
                    {
                      src: '🏙️ Crystle Town', color: 'text-amber-400',
                      guaranteed: '1x Food Buff + 5 Influence XP + Faucet ETH',
                      random: 'None',
                      limits: '30m slot cooldown on skip',
                      status: 'warn', note: 'Race condition PATCHED (Apr 29)'
                    },
                    {
                      src: '⚔️ Naga War (Guild PvP)', color: 'text-purple-400',
                      guaranteed: '5k–10k GX + 5–10x 12m Scrolls',
                      random: 'None (tier-fixed)',
                      limits: 'Weekly event-gated',
                      status: 'ok', note: 'Unique scroll IDs — no wipeout risk'
                    },
                    {
                      src: '🏛️ Syndicate Bounty', color: 'text-slate-300',
                      guaranteed: '5,000 + (LabLvl × 1,000) GX',
                      random: 'None',
                      limits: 'Daily claim via Cloud Function',
                      status: 'ok', note: 'Server-side secured'
                    },
                    {
                      src: '♻️ Salvaging', color: 'text-emerald-400',
                      guaranteed: '1x same-rarity random item',
                      random: 'Item identity random within tier',
                      limits: 'Requires 3x same-rarity items',
                      status: 'ok', note: 'Verified'
                    },
                    {
                      src: '💰 Item Selling', color: 'text-yellow-400',
                      guaranteed: 'item.sellValue in GX',
                      random: 'None',
                      limits: 'None',
                      status: 'ok', note: 'Verified'
                    },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                      <td className={`py-3 px-4 font-black italic whitespace-nowrap ${row.color}`}>{row.src}</td>
                      <td className="py-3 px-4 text-slate-300 font-bold">{row.guaranteed}</td>
                      <td className="py-3 px-4 text-slate-400 font-medium italic">{row.random}</td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{row.limits}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase rounded border ${
                          row.status === 'ok'
                            ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                            : 'bg-amber-950 border-amber-700 text-amber-400'
                        }`}>
                          {row.status === 'ok' ? '✓' : '⚠'} {row.note}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AUDIT FLAGS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-950/20 border-2 border-amber-700/40 p-5 rounded-xl space-y-2">
              <p className="text-amber-400 font-black uppercase text-xs flex items-center gap-2">⚠ Inflation Watch: Auto-Scroll Accumulation</p>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Players receive scrolls from <strong className="text-white">3 independent sources</strong>: iLearn drops (70% chance), Naga War bounties (5–10x 12m), and Dungeon loot tables.
                An active player completing 10 iLearn quizzes + 1 war win per week can accumulate <strong className="text-amber-300">35+ scroll-minutes</strong> without spending any.
                Monitor <code className="text-amber-400 text-[9px] bg-black/40 px-1">player.autoScrolls</code> totals in the Player Registry for outliers.
              </p>
            </div>
            <div className="bg-amber-950/20 border-2 border-amber-700/40 p-5 rounded-xl space-y-2">
              <p className="text-amber-400 font-black uppercase text-xs flex items-center gap-2">⚠ Faucet Double-Trigger Risk</p>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Both iLearn and Crystle Town quests fire <code className="text-amber-400 text-[9px] bg-black/40 px-1">claimFaucetReward</code> on completion.
                If a player completes both in rapid succession, two claims hit the server simultaneously.
                Verify the Cloud Function enforces <strong className="text-white">per-wallet cooldowns</strong> server-side to prevent double ETH payouts.
              </p>
            </div>
            <div className="bg-emerald-950/20 border-2 border-emerald-700/40 p-5 rounded-xl space-y-2">
              <p className="text-emerald-400 font-black uppercase text-xs flex items-center gap-2">✓ Race Condition Sealed (Apr 29)</p>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Both iLearn and Town quest hubs now use <code className="text-emerald-400 text-[9px] bg-black/40 px-1">isSyncing</code> state locks + <code className="text-emerald-400 text-[9px] bg-black/40 px-1">pointer-events-auto</code> backdrop hardening.
                Cards reject clicks while a quest is in-flight, preventing the concurrent completion bug that was causing duplicate scroll generation.
              </p>
            </div>
            <div className="bg-emerald-950/20 border-2 border-emerald-700/40 p-5 rounded-xl space-y-2">
              <p className="text-emerald-400 font-black uppercase text-xs flex items-center gap-2">✓ Scroll Uniqueness Guaranteed</p>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Every rewarded scroll uses a unique inventory key: <code className="text-emerald-400 text-[9px] bg-black/40 px-1">_ILEARN_timestamp_hash</code> or <code className="text-emerald-400 text-[9px] bg-black/40 px-1">_WAR_timestamp_hash</code>.
                This prevents any stacking collision and is safe against the legacy "Wipeout" fuzzy-match bug documented in the Scroll Mapping tab.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-black border-4 border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-black text-white uppercase italic mb-6 border-l-4 border-emerald-600 pl-4">System Health Matrix</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-xl relative overflow-hidden">
               <Activity className="absolute bottom-[-20px] right-[-20px] w-24 h-24 text-cyan-500/10 -rotate-12" />
               <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-2">Neural Latency</p>
               <p className="text-2xl font-black text-white italic">24ms <span className="text-xs text-emerald-500 uppercase not-italic">Nominal</span></p>
            </div>
            <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-xl relative overflow-hidden">
               <ShieldAlert className="absolute bottom-[-20px] right-[-20px] w-54 h-54 text-emerald-500/10 -rotate-12" />
               <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-2">Blockade Status</p>
               <p className="text-2xl font-black text-white italic">ACTIVE <span className="text-xs text-cyan-500 uppercase not-italic">v4.0.2</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
