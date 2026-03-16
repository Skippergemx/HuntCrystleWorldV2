import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Users, Trash2, CheckCircle, AlertCircle, Search, X } from 'lucide-react';
import { collection, getDocs, writeBatch, doc, deleteDoc, getDoc, query, collectionGroup } from 'firebase/firestore';

export const AdminPanelView = ({ db, appId, userEmail, setView }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, leaderboardSize: 0 });
  const [players, setPlayers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('maintenance'); // 'maintenance' or 'players'
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
      // This is the most robust way to find "hidden" users
      try {
        console.log("Phase 3: Pulsing Registry for hidden profiles...");
        const profilesSnap = await getDocs(query(collectionGroup(db, 'profile')));
        profilesSnap.forEach(d => {
          // If the doc name is 'data', its grandparent is the user ID
          if (d.id === 'data' && d.ref.parent.parent) {
            foundIds.add(d.ref.parent.parent.id);
          }
        });
      } catch (e) {
        console.warn("Collection Group pulse restricted:", e.message);
        // If this fails, we rely on Phase 1 & 2
      }

      setStats({
        totalUsers: foundIds.size,
        leaderboardSize: foundIds.size 
      });

      // Phase 4: Hydration (Reconstructing Profile Data)
      const profiles = [];
      const idArray = Array.from(foundIds);
      
      for (const uid of idArray) {
        let foundProfile = false;
        // Check all potential app ID paths for this user
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
    if (!window.confirm("Are you sure? This will set all player damage to 0 and clear rankings.")) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      
      // 1. Clear Leaderboard collection
      const lbSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard'));
      lbSnap.forEach((d) => {
        batch.delete(d.ref);
      });

      // 2. We also need to reset totalBossDamage in user profiles
      // NOTE: This requires fetching all user docs. If there are thousands, this will be expensive/slow.
      // For now, we fetch all profiles across the sub-collections if possible.
      // Based on App.jsx: doc(db, 'artifacts', appId, 'users', identifier, 'profile', 'data')
      // This structure makes it hard to fetch "all profiles" with a simple getDocs on 'users'.
      // We'd need to know all identifiers.
      
      // Alternative: Just reset the ones CURRENTLY on the leaderboard.
      lbSnap.forEach((d) => {
        const userId = d.id;
        const userProfileRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
        batch.update(userProfileRef, { totalBossDamage: 0 });
      });

      await batch.commit();
      setMessage({ type: 'success', text: 'Leaderboard reset successfully!' });
      await fetchStats();
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Reset failed: ' + e.message });
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
    <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-red-600 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <ShieldAlert className="text-red-600" size={36} />
            Genesis Admin
          </h1>
          <p className="text-red-500 font-black text-xs uppercase tracking-widest mt-1">System Authority: {userEmail}</p>
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
            <p className="text-3xl font-black text-white italic">{stats.totalUsers}</p>
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
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Genesis Level</p>
            <p className="text-3xl font-black text-white italic">LVL 4.0</p>
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
          </div>
        </div>
      ) : (
        <div className="bg-black border-4 border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-cyan-600 pl-4">
            <h2 className="text-xl font-black text-white uppercase italic">Player Registry</h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search Hunter ID..." 
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
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Inventory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {(() => {
                  const filtered = players.filter(p => {
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
                                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.name || player.id}`} 
                                  className="w-full h-full object-cover" 
                                  alt="" 
                                />
                              </div>
                              <div className="flex flex-col gap-0.5 text-left">
                                <p className="text-sm font-black text-white italic leading-none">{player.name || 'Anonymous Hunter'}</p>
                                <p className="text-[9px] text-cyan-500 font-bold tracking-wider">{player.email || 'No Email'}</p>
                                <p className="text-[7px] text-slate-600 font-bold tracking-tighter uppercase">{player.id}</p>
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
                            <span className="text-[10px] font-black text-slate-400">{(player.inventory || []).length} Items</span>
                          </td>
                        </tr>
                      ))}
                      {paginated.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-slate-600 font-black uppercase italic tracking-widest">Sector Empty: No Hunters Detected</td>
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
            const filtered = players.filter(p => {
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
      )}

      {/* Footer Info */}
      <div className="mt-auto pt-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex flex-col gap-1">
        <p>Genesis Security Layer v4.0.1</p>
        <p>Unauthorized access is fatal.</p>
      </div>
    </div>
  );
};
