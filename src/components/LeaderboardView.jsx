import React from 'react';
import { Header } from './GameUI';

export const LeaderboardView = ({ leaderboard, user, setView }) => (
  <div className="flex-1 p-6 space-y-6 relative overflow-hidden">
    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
    <Header title="GLOBAL RANKING: ELITE" onClose={() => setView('menu')} />
    <div className="space-y-4 relative z-10 overflow-y-auto max-h-[400px] pr-2">
      {leaderboard.map((entry, idx) => (
        <div key={idx} className={`p-4 border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] flex justify-between items-center transition-all transform ${idx % 2 === 0 ? 'rotate-0.5' : '-rotate-0.5'} ${entry.uid === user?.uid ? 'bg-cyan-400' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 border-[3px] border-black flex items-center justify-center font-black italic shadow-[3px_3px_0_rgba(0,0,0,1)] ${idx === 0 ? 'bg-amber-400 scale-110' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-black text-white'}`}>
              {idx + 1}
            </div>
            <div>
              <p className={`font-black text-lg uppercase tracking-tighter leading-none italic ${entry.uid === user?.uid ? 'text-black' : 'text-black'}`}>{entry.name}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase italic">Level {entry.level} Hunter</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-2xl font-black text-black italic drop-shadow-sm">{(entry.score || 0).toLocaleString()}</p>
             <p className="text-[8px] font-black text-black opacity-40 uppercase italic">Total Damage</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
