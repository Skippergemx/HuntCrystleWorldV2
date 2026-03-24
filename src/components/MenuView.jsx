import React from 'react';
import { 
  Map as MapIcon, 
  Beer, 
  Activity, 
  Package, 
  ShoppingBag, 
  Hammer, 
  Book, 
  Globe, 
  AlertCircle, 
  Clock, 
  Trees,
  Swords,
  Zap,
  Tag,
  HelpCircle,
  FlaskConical,
  Shield,
  Sparkles
} from 'lucide-react';
import { NavBtn } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const MenuView = React.memo(() => {
  const { adventure, gameLoop, syncPlayer, openGuide } = useGame();
  const { setView } = adventure;
  const { penaltyRemaining, autoTimeLeft } = gameLoop;
  const isPenalized = penaltyRemaining > 0;

  const startDungeon = () => {
    if (!isPenalized) {
      setView('map');
    }
  };

  const startBoss = () => {
    if (!isPenalized) {
      setView('boss');
      if (autoTimeLeft > 0) syncPlayer({ autoUntil: 0 });
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 relative overflow-hidden">
      {/* Floating Guide Button */}
      <button 
        onClick={() => openGuide('menu')}
        className="absolute top-2 right-2 z-[60] p-2 bg-cyan-600 border-[3px] border-black text-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:bg-cyan-400 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
        title="Knowledge Base"
      >
        <HelpCircle size={18} strokeWidth={3} />
      </button>

      <NavBtn 
        onClick={startDungeon} 
        icon={isPenalized ? <Clock className="animate-pulse" /> : <MapIcon />} 
        title="Dungeon" 
        sub={isPenalized ? `Wait ${penaltyRemaining}s` : "Battle"} 
        color={isPenalized ? "bg-slate-800 grayscale" : "bg-cyan-600"} 
        disabled={isPenalized} 
        backdrop="/assets/monsters/Rust Canyon/Rust Cat 0-0.jpg"
      />
      <NavBtn onClick={() => setView('tavern')} icon={<Beer />} title="Tavern" sub="Hire Mates" color="bg-amber-700" backdrop="/assets/monsters/Rust Canyon/Canyon Flyer 1-1.jpg" />
      <NavBtn onClick={() => setView('attributes')} icon={<Activity />} title="Attributes" sub="Stats" color="bg-orange-600" backdrop="/assets/monsters/Rust Canyon/Iron Pet 2-2.jpg" />
      <NavBtn onClick={() => setView('gear')} icon={<Zap />} title="Gear" sub="Tactical" color="bg-cyan-700" backdrop="/assets/monsters/Rust Canyon/Oil Swimmer 3-1.jpg" />
      <NavBtn onClick={() => setView('inventory')} icon={<Package />} title="Bag" sub="Inventory" color="bg-emerald-600" backdrop="/assets/monsters/Rust Canyon/Scrap Bota 1.jpg" />
      <NavBtn onClick={() => setView('shop')} icon={<ShoppingBag />} title="Shop" sub="Items" color="bg-slate-700" backdrop="/assets/monsters/Rust Canyon/Rust Cat 3-2.jpg" />
      <NavBtn onClick={() => setView('market')} icon={<Tag />} title="Market" sub="P2P Trade" color="bg-amber-600" backdrop="/assets/monsters/Rust Canyon/Canyon Flyer 2-3.jpg" />
      <NavBtn onClick={() => setView('forge')} icon={<Hammer />} title="Forge" sub="Relics" color="bg-amber-600" backdrop="/assets/monsters/Rust Canyon/Iron Pet 0-0.jpg" />
      <NavBtn onClick={() => setView('database')} icon={<Book />} title="Archives" sub="Database" color="bg-blue-600" backdrop="/assets/monsters/Rust Canyon/Oil Swimmer 1-0.jpg" />
      <NavBtn onClick={() => setView('leaderboard')} icon={<Globe />} title="Ranking" sub="Global" color="bg-purple-600" backdrop="/assets/monsters/Rust Canyon/Scrap Bota 2.jpg" />
      <NavBtn onClick={() => setView('dragons_ground')} icon={<Trees />} title="Dragons Ground" sub="Sacred Ground" color="bg-emerald-700" backdrop="/assets/monsters/Rust Canyon/Rust Cat 1-4.jpg" />
      <NavBtn onClick={() => setView('laboratory')} icon={<FlaskConical />} title="Xenon Lab" sub="Consumables" color="bg-emerald-900" backdrop="/assets/monsters/Rust Canyon/Rust Cat 2-2.jpg" />
      <NavBtn 
        onClick={startBoss} 
        icon={<AlertCircle />} 
        title="Boss" 
        sub="High Yield" 
        color="bg-red-700" 
        disabled={isPenalized} 
        backdrop="/assets/monsters/Rust Canyon/Canyon Flyer 3-0.jpg"
      />
      <NavBtn onClick={() => setView('syndicate')} icon={<Shield />} title="Syndicate" sub="Factions" color="bg-red-900 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]" backdrop="/assets/monsters/Rust Canyon/Rust Cat 2-3.jpg" />
      <NavBtn 
        onClick={() => setView('pvp')} 
        icon={<Swords />} 
        title="PVP Arena" 
        sub="Holo-Grid" 
        color="bg-red-900 border-red-500/50" 
        backdrop="/assets/monsters/Rust Canyon/Rust Cat 2-1.jpg"
      />
      <NavBtn 
        onClick={() => setView('pets')} 
        icon={<Sparkles />} 
        title="Genesis Pets" 
        sub="Web3" 
        color="bg-cyan-900 border-cyan-400/30" 
        backdrop="/assets/monsters/Rust Canyon/Iron Pet 1-1.jpg"
      />
    </div>
  );
});
