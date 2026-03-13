import React from 'react';
import { Map as MapIcon, Beer, Activity, Package, ShoppingBag, Hammer, Book, Globe, AlertCircle, Clock } from 'lucide-react';
import { NavBtn } from './GameUI';

export const MenuView = ({ setView, isPenalized, penaltyRemaining, setDepth, spawnNewEnemy, autoUntil, syncPlayer }) => {
  const startDungeon = () => {
    if (!isPenalized) {
      setView('map');
    }
  };

  const startBoss = () => {
    if (!isPenalized) {
      setView('boss');
      if (autoUntil > 0) syncPlayer({ autoUntil: 0 });
    }
  };

  return (
    <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-3 gap-6 relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }}></div>
      <NavBtn 
        onClick={startDungeon} 
        icon={isPenalized ? <Clock className="animate-pulse" /> : <MapIcon />} 
        title="Dungeon" 
        sub={isPenalized ? `Wait ${penaltyRemaining}s` : "Battle"} 
        color={isPenalized ? "bg-slate-800 grayscale" : "bg-cyan-600"} 
        disabled={isPenalized} 
      />
      <NavBtn onClick={() => setView('tavern')} icon={<Beer />} title="Tavern" sub="Hire Mates" color="bg-amber-700" />
      <NavBtn onClick={() => setView('attributes')} icon={<Activity />} title="Attributes" sub="Stats" color="bg-orange-600" />
      <NavBtn onClick={() => setView('inventory')} icon={<Package />} title="Bag" sub="Inventory" color="bg-emerald-600" />
      <NavBtn onClick={() => setView('shop')} icon={<ShoppingBag />} title="Shop" sub="Items" color="bg-slate-700" />
      <NavBtn onClick={() => setView('forge')} icon={<Hammer />} title="Forge" sub="Relics" color="bg-amber-600" />
      <NavBtn onClick={() => setView('database')} icon={<Book />} title="Archives" sub="Database" color="bg-blue-600" />
      <NavBtn onClick={() => setView('leaderboard')} icon={<Globe />} title="Ranking" sub="Global" color="bg-purple-600" />
      <NavBtn 
        onClick={startBoss} 
        icon={<AlertCircle />} 
        title="Dungeon Core" 
        sub="Boss" 
        color="bg-red-700" 
        disabled={isPenalized} 
      />
    </div>
  );
};
