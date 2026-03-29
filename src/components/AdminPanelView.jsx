import React, { useState, useEffect } from 'react';
import { Globe, ShieldAlert, RefreshCw, Users, Trash2, CheckCircle, AlertCircle, Search, X, Activity, TrendingUp, Sparkles, Flame, Target, Wallet, Copy, FileText } from 'lucide-react';
import { collection, getDocs, writeBatch, doc, deleteDoc, getDoc, query, collectionGroup, updateDoc } from 'firebase/firestore';
import { useGame } from '../contexts/GameContext';

export const AdminPanelView = React.memo(() => {
  const { db, appId, user, adventure, farcasterContext } = useGame();
  const { setView } = adventure;
  const userEmail = user?.email || user?.uid;

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, leaderboardSize: 0 });
  const [players, setPlayers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('maintenance'); // 'maintenance', 'players', 'wallets', or 'system'
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const isAdmin = userEmail === 'skippergemx@gmail.com';

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
      
      console.log("Terminal: Initiating Deep-Scan for Hunter signals...");
      const foundIds = new Set();
      const possibleAppIds = [appId, 'crystle-hunter-world-v1', 'crystle-hunter-world-v2'];
      
      // Phase 1: Self-Discovery (Targeted probe for the admin's own record)
      if (userEmail) {
        foundIds.add(userEmail); 
        console.log(`Phase 1: Admin signal locked (${userEmail})`);
      }

      // Phase 2: Leaderboard Discovery
      for (const id of possibleAppIds) {
        try {
          const lbSnap = await getDocs(collection(db, 'artifacts', id, 'public', 'data', 'leaderboard'));
          lbSnap.forEach(d => foundIds.add(d.id));
        } catch (e) { console.warn("Leaderboard check skipped:", e.message); }
      }

      // Phase 3: Collection Group Pulse (Finding virtual docs by their children)
      try {
        console.log("Phase 3: Pulsing Registry for hidden profiles...");
        const profilesSnap = await getDocs(query(collectionGroup(db, 'profile')));
        profilesSnap.forEach(d => {
          if (d.id === 'data' && d.ref.parent.parent) {
            foundIds.add(d.ref.parent.parent.id);
          }
        });
      } catch (e) {
        console.warn("Collection Group pulse restricted:", e.message);
      }

      // Phase 4: Hydration (Reconstructing Profile Data)
      const profiles = [];
      const idArray = Array.from(foundIds);
      
      for (const uid of idArray) {
        let foundProfile = false;
        for (const id of possibleAppIds) {
          if (foundProfile) break;
          try {
            const profileRef = doc(db, 'artifacts', id, 'users', uid, 'profile', 'data');
            const snap = await getDoc(profileRef);
            if (snap.exists()) {
              profiles.push({ id: uid, ...snap.data(), sourceAppId: id });
              foundProfile = true;
            }
          } catch (e) {}
        }
      }

      setStats({
        totalUsers: profiles.length,
        leaderboardSize: foundIds.size 
      });

      setPlayers(profiles);
      
      if (foundIds.size === 0) {
        setMessage({ type: 'warning', text: 'Sector Silence: No Hunter signals discovered. Try completing a dungeon or fighting the boss to register your signal.' });
      } else {
        console.log(`Deep-Scan Complete: ${profiles.length} profiles hydrated.`);
      }
    } catch (e) {
      console.error("Critical Terminal Error:", e);
      setMessage({ type: 'error', text: 'FATAL ERROR: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const resetLeaderboard = async () => {
    if (!window.confirm("COMMENCE GENESIS WIPE: This will reset ALL hydrated players to Level 1, clear all inventories, and set GX balances to 100. This is the ultimate reset. Proceed?")) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      
      // Clear Leaderboard
      const lbSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard'));
      lbSnap.forEach((d) => { batch.delete(d.ref); });

      // Reset All Profiles
      players.forEach(p => {
        const profileRef = doc(db, 'artifacts', p.sourceAppId || appId, 'users', p.id, 'profile', 'data');
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
          inventory: [],
          totalBossDamage: 0,
          maxDepth: 1,
          penaltyUntil: 0,
          autoMode: null,
          gemx: { level: 1, crystalsFed: 0 },
          dragon: { level: 1, fruitsFed: 0 }
        };
        batch.update(profileRef, cleanSlate);
      });

      // Clear Marketplace
      const marketSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'marketplace'));
      marketSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();
      setMessage({ type: 'success', text: `Genesis Wipe Successful: ${players.length} hunters returned to the void. Hall of Fame purged and Marketplace cleared.` });
      await fetchStats();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Reset failed: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const clearChatMessages = async () => {
    if (!window.confirm("CRITICAL: Purge all Arena Comms? This will permanently delete the global chat history.")) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const chatSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'pvp_chat'));
      const batch = writeBatch(db);
      chatSnap.forEach((d) => { batch.delete(d.ref); });
      await batch.commit();
      setMessage({ type: 'success', text: `Comms Purge Complete: ${chatSnap.size} signals neutralized.` });
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Purge failed: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const purgeMarketplace = async () => {
    if (!window.confirm("RESET MARKETPLACE: This will delete ALL public listings. Continue?")) return;
    setLoading(true);
    try {
      const marketSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'marketplace'));
      const batch = writeBatch(db);
      marketSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setMessage({ type: 'success', text: `Market Sanitized: ${marketSnap.size} listings purged.` });
    } catch (e) {
      setMessage({ type: 'error', text: 'Market purge failed.' });
    } finally { setLoading(false); }
  };

  const syncAllPlayersToLeaderboard = async () => {
    if (!window.confirm("COMMENCE GLOBAL SYNC: This will scan all user profiles and update the Hall of Fame with their latest stats. Proceed?")) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const profilesSnap = await getDocs(query(collectionGroup(db, 'profile')));
      const batch = writeBatch(db);
      let count = 0;
      
      profilesSnap.forEach(d => {
        if (d.id === 'data' && d.ref.parent.parent) {
          const userId = d.ref.parent.parent.id;
          const data = d.data();
          const lbRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', userId);
          batch.set(lbRef, {
            uid: userId,
            name: data.name || 'Anonymous Hunter',
            email: data.email || '',
            level: data.level || 1,
            score: data.totalBossDamage || 0,
            maxDepth: data.maxDepth || 1,
            heroAvatar: data.avatar || 1
          }, { merge: true });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        setMessage({ type: 'success', text: `Sync Complete: ${count} Hunter signals broadcast to Hall of Fame.` });
      } else {
        setMessage({ type: 'warning', text: 'Sync Idle: No profile data found in the grid.' });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Synchronization failed: ' + e.message });
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
      const { id, sourceAppId, name, level, tokens, totalBossDamage, maxDepth, walletAddress } = editingPlayer;
      const profileRef = doc(db, 'artifacts', sourceAppId || appId, 'users', id, 'profile', 'data');
      
      const updateData = {
        name,
        level: Number(level),
        tokens: Number(tokens),
        totalBossDamage: Number(totalBossDamage),
        maxDepth: Number(maxDepth),
        walletAddress: walletAddress || null
      };

      await updateDoc(profileRef, updateData);
      
      const lbRef = doc(db, 'artifacts', sourceAppId || appId, 'public', 'data', 'leaderboard', id);
      const lbSnap = await getDoc(lbRef);
      if (lbSnap.exists()) {
        await updateDoc(lbRef, {
          name,
          level: Number(level),
          score: Number(totalBossDamage),
          maxDepth: Number(maxDepth)
        });
      }

      setMessage({ type: 'success', text: `Unit ${id} re-calibrated successfully.` });
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
      const { id, sourceAppId } = editingPlayer;
      const profileRef = doc(db, 'artifacts', sourceAppId || appId, 'users', id, 'profile', 'data');
      
      const resetData = {
          uid: id,
          email: editingPlayer.email || '',
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
          inventory: [],
          totalBossDamage: 0,
          maxDepth: 1,
          penaltyUntil: 0,
          autoMode: null,
          gemx: { level: 1, crystalsFed: 0 },
          dragon: { level: 1, fruitsFed: 0 }
      };

      await updateDoc(profileRef, resetData);
      
      const lbRef = doc(db, 'artifacts', sourceAppId || appId, 'public', 'data', 'leaderboard', id);
      const lbSnap = await getDoc(lbRef);
      if (lbSnap.exists()) {
        await deleteDoc(lbRef);
      }

      setMessage({ type: 'success', text: `Master Reset complete for ${id}.` });
      setEditingPlayer(null);
      await fetchStats();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Master Reset failed: ' + e.message });
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
                  <label className="text-[10px] font-black text-slate-500 uppercase">Peak Depth</label>
                  <input 
                    type="number" 
                    value={editingPlayer.maxDepth}
                    onChange={e => setEditingPlayer({...editingPlayer, maxDepth: e.target.value})}
                    className="w-full bg-black border-2 border-slate-800 p-2 text-white font-black italic text-sm focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Wallet Address (Base)</label>
                <input 
                  type="text" 
                  value={editingPlayer.walletAddress || ''}
                  onChange={e => setEditingPlayer({...editingPlayer, walletAddress: e.target.value})}
                  placeholder="0x..."
                  className="w-full bg-black border-2 border-slate-800 p-2 text-amber-500 font-mono text-[10px] focus:border-amber-500 outline-none"
                />
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

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-red-600 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <ShieldAlert className="text-red-600" size={36} />
            Genesis Admin
          </h1>
          <p className="text-red-500 font-black text-[10px] uppercase tracking-widest mt-1">
             Authority: {farcasterContext?.user?.username ? `@${farcasterContext.user.username}` : userEmail}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchStats}
            disabled={loading}
            className={`p-2 rounded-lg border transition-all ${loading ? 'opacity-50' : 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-cyan-600 hover:text-white'}`}
            title="Refresh Discovery"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setView('menu')}
            className="px-6 py-2 bg-slate-800 text-white font-black uppercase italic border-2 border-white/20 hover:bg-white hover:text-black transition-all"
          >
            Exit Terminal
          </button>
        </div>
      </div>

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

      {/* Tabs */}
      <div className="flex gap-2">
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

            <div className="p-6 bg-slate-900/40 border-2 border-slate-700/50 rounded-lg">
              <h3 className="text-lg font-black text-cyan-500 uppercase italic flex items-center gap-2 mb-2">
                <Trash2 size={20} />
                Arena Comms Purge
              </h3>
              <p className="text-sm text-slate-400 mb-6 font-medium">
                This protocol will permanently delete all signals (messages) in the PVP Arena chat database. 
              </p>
              
              <button
                onClick={clearChatMessages}
                disabled={loading}
                className="w-full md:w-auto px-10 py-4 bg-slate-800 text-cyan-400 font-black uppercase italic rounded border-2 border-cyan-900/50 shadow-[6px_6px_0_rgba(0,0,0,1)] hover:bg-cyan-600 hover:text-white active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Trash2 />}
                Purge All Messages
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
            <div className="relative w-full md:w-64">
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

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hunter</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Level</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">GX Coins</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Boss Damage</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Floor</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Inventory</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {(() => {
                  const filtered = (players || []).filter(p => {
                    const search = searchQuery.toLowerCase();
                    const nameMatch = p.name ? p.name.toLowerCase().includes(search) : false;
                    const idMatch = p.id ? p.id.toLowerCase().includes(search) : false;
                    const emailMatch = p.email ? p.email.toLowerCase().includes(search) : false;
                    return !searchQuery || nameMatch || idMatch || emailMatch;
                  });
                  const totalPages = Math.ceil(filtered.length / itemsPerPage);
                  const start = (currentPage - 1) * itemsPerPage;
                  const paginated = filtered.slice(start, start + itemsPerPage);

                  return (
                    <>
                      {paginated.map((player) => (
                        <tr key={player.id} className="hover:bg-slate-900/30 transition-colors group">
                          <td className="py-4 px-4 text-left">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all shadow-[2px_2px_0_rgba(0,0,0,0.5)] overflow-hidden">
                                <img 
                                  src={player.farcasterPfp || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.name || player.id}`} 
                                  className="w-full h-full object-cover" 
                                  alt="" 
                                />
                              </div>
                              <div className="flex flex-col gap-0.5 text-left">
                                <p className="text-sm font-black text-white italic leading-none">{player.name || 'Anonymous Hunter'}</p>
                                <p className="text-[9px] text-cyan-500 font-bold tracking-wider">
                                   {player.farcasterUsername ? `@${player.farcasterUsername}` : (player.email || 'Anonymous Signal')}
                                </p>
                                <p className="text-[7px] text-slate-600 font-bold tracking-tighter uppercase flex items-center gap-2">
                                   <span className="opacity-40">{player.id.substring(0, 15)}...</span>
                                   {player.farcasterUsername ? (
                                      <span className="px-1.5 py-0.5 bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-[2px] text-[6px] font-black italic">FARCASTER</span>
                                   ) : (
                                      <span className="px-1.5 py-0.5 bg-slate-600/20 text-slate-400 border border-slate-600/30 rounded-[2px] text-[6px] font-black italic">GOOGLE_AUTH</span>
                                   )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-1 bg-cyan-950 text-cyan-400 text-[10px] font-black rounded border border-cyan-900">LVL {player.level || 1}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-black text-amber-500 italic">{(player.tokens || 0).toLocaleString()} GX</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-black text-red-500 italic">{(player.totalBossDamage || 0).toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-black text-blue-400 italic">FLR {player.maxDepth || 1}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[10px] font-black text-slate-400">{(player.inventory || []).length} Items</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button 
                              onClick={() => setEditingPlayer(player)}
                              className="p-2 bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-cyan-600 hover:text-white transition-all shadow-md group/edit"
                            >
                               <RefreshCw size={14} className="group-hover/edit:rotate-180 transition-transform duration-500" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginated.length === 0 && (
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
            const filtered = (players || []).filter(p => {
              const search = searchQuery.toLowerCase();
              const nameMatch = p.name ? p.name.toLowerCase().includes(search) : false;
              const idMatch = p.id ? p.id.toLowerCase().includes(search) : false;
              const emailMatch = p.email ? p.email.toLowerCase().includes(search) : false;
              return !searchQuery || nameMatch || idMatch || emailMatch;
            });
            const totalPages = Math.ceil(filtered.length / itemsPerPage);
            if (totalPages <= 1) return null;

            return (
              <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Showing {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filtered.length, currentPage * itemsPerPage)} of {filtered.length} units
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
               <div className="relative w-full md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                   <input 
                     type="text" 
                     placeholder="Filter by Name, ID, or Address..." 
                     className="w-full bg-slate-900 border-2 border-slate-800 rounded px-10 py-2 text-xs text-white focus:border-amber-500 outline-none font-black italic"
                     value={searchQuery}
                     onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                   />
               </div>
               <button 
                 onClick={() => {
                   const addresses = players.filter(p => p.walletAddress && p.walletAddress.startsWith('0x')).map(p => p.walletAddress).join('\n');
                   navigator.clipboard.writeText(addresses);
                   setMessage({ type: 'success', text: `COPIED TO CLIPBOARD: ${addresses.split('\n').filter(a => a).length} wallet addresses secured.` });
                 }}
                 className="px-6 py-2 bg-amber-500 text-black font-black uppercase italic text-xs flex items-center gap-2 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
               >
                 <Copy size={16} />
                 Capture All Addresses
               </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4">
                  <th className="py-2 px-4">Subject identity</th>
                  <th className="py-2 px-4">Origin Hub</th>
                  <th className="py-2 px-4">Bound Wallet Address (Base Chain)</th>
                  <th className="py-2 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                {(() => {
                  const filtered = (players || []).filter(p => {
                    const search = searchQuery.toLowerCase();
                    return !searchQuery || 
                           (p.name?.toLowerCase().includes(search)) || 
                           (p.id?.toLowerCase().includes(search)) || 
                           (p.walletAddress?.toLowerCase().includes(search));
                  });
                  const totalPages = Math.ceil(filtered.length / itemsPerPage);
                  const start = (currentPage - 1) * itemsPerPage;
                  const paginated = filtered.slice(start, start + itemsPerPage);

                  return (
                    <>
                      {paginated.map((player) => (
                        <tr key={player.id} className="bg-slate-900/40 border-2 border-slate-800 hover:border-amber-500/50 transition-all group">
                          <td className="py-4 px-4 text-left rounded-l-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl overflow-hidden rounded-md">
                                <img 
                                  src={player.farcasterPfp || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.name || player.id}`} 
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
                               {player.id.startsWith('farcaster_') ? (
                                  <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-950/40 border border-indigo-500/30 rounded text-indigo-400">
                                     <Globe size={10} />
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
                                  <code className="bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 text-amber-500 font-mono text-[10px] transition-all group-hover:border-amber-500/30 group-hover:text-amber-400">
                                     {player.walletAddress}
                                  </code>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(player.walletAddress);
                                      setMessage({ type: 'success', text: `ADAPTOR PINNED: ${player.walletAddress.slice(0, 10)} copied.` });
                                    }}
                                    className="p-1 px-2 bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-500 transition-all rounded text-[8px] font-black uppercase"
                                  >
                                     <Copy size={10} />
                                  </button>
                               </div>
                            ) : (
                               <span className="text-[8px] font-black text-slate-700 uppercase italic tracking-tighter">Unbound Signal: Waiting for Web3 Uplink</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center rounded-r-xl">
                             <div className={`w-2 h-2 rounded-full mx-auto ${player.walletAddress ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`}></div>
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
      ) : (
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
        </div>
      )}
    </div>
  );
});
