import React from 'react';
import { Database } from 'lucide-react';
import { Header } from './GameUI';

export const DatabaseView = ({ depth, setView }) => (
  <div className="flex-1 p-6 space-y-6 relative overflow-hidden">
     <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
     <Header title="ARCHIVES: MONSTER DB" onClose={() => setView('menu')} />
     <div className="bg-white border-[4px] border-black p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-1 text-center">
        <div className="mb-4 inline-block bg-blue-600 p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
           <Database size={48} className="text-white" />
        </div>
        <h3 className="text-3xl font-black text-black uppercase italic italic mb-2">SYSTEM ARCHIVES</h3>
        <p className="text-[10px] font-black text-slate-500 uppercase italic leading-relaxed">
          Data logs on Floor {depth} and beyond are being decrypted. <br/>
          Defeat monsters to unlock their core biological profiles.
        </p>
        <div className="mt-8 pt-6 border-t-[3px] border-dashed border-black/10">
           <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Scanning Bio-Signatures...</p>
        </div>
     </div>
  </div>
);
