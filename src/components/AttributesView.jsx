import React from 'react';
import { Header, AttributeRow } from './GameUI';

export const AttributesView = React.memo(({ player, allocateStat, setView, onHelp }) => (
  <div className="flex-1 p-6 space-y-8 flex flex-col items-center justify-start overflow-y-auto relative">
    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
    
    <Header title="IDENTITY CORE: STATS" onClose={() => setView('menu')} onHelp={onHelp} />
    
    <div className="relative z-10 w-full max-w-sm">
      <div className="bg-amber-400 border-[4px] border-black p-8 shadow-[10px_10px_0_rgba(0,0,0,1)] w-full text-center transform -rotate-1 relative mb-12">
         <div className="absolute -top-4 -left-4 bg-black text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 border-white shadow-md">Memory Bank</div>
         <p className="text-xs uppercase font-black text-black/60 mb-1 tracking-[0.2em] italic">Available AP</p>
         <p className="text-7xl font-black text-black italic drop-shadow-[4px_4px_0_rgba(255,255,255,0.3)]">{player.abilityPoints || 0}</p>
      </div>

      <div className="space-y-6">
        <div className="transform -rotate-1">
          <AttributeRow label="STRENGTH [STR]" value={player.baseStats.str} onAdd={() => allocateStat('str')} color="text-red-600" disabled={!player.abilityPoints} desc="Unleash raw power to annihilate enemies." />
        </div>
        <div className="transform rotate-1">
          <AttributeRow label="AGILITY [AGI]" value={player.baseStats.agi} onAdd={() => allocateStat('agi')} color="text-emerald-600" disabled={!player.abilityPoints} desc="Evade strikes and outpace your foes." />
        </div>
        <div className="transform -rotate-1">
          <AttributeRow label="DEXTERITY [DEX]" value={player.baseStats.dex} onAdd={() => allocateStat('dex')} color="text-amber-600" disabled={!player.abilityPoints} desc="Strike with surgical precision and speed." />
        </div>
      </div>
    </div>
  </div>
));
