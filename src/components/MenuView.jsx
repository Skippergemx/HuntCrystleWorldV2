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
  Sparkles,
  BookOpen,
  Shield,
  ShieldAlert
} from 'lucide-react';
import { NavBtn } from './GameUI';
import { useGame } from '../contexts/GameContext';

export const MenuView = React.memo(() => {
  const { adventure, gameLoop, syncPlayer, openGuide, user, farcasterContext } = useGame();
  const { setView } = adventure;
  const { penaltyRemaining, autoTimeLeft } = gameLoop;
  const isPenalized = penaltyRemaining > 0;
  const isAdmin = user?.email === 'skippergemx@gmail.com';

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
      <NavBtn onClick={() => setView('dragons_ground')} icon={<Trees />} title="Dragons Ground" sub="Sacred Ground" color="bg-emerald-700" backdrop="/assets/monsters/Tectonic Ridge/Quake Golem.jpg" />
      <NavBtn onClick={() => setView('laboratory')} icon={<FlaskConical />} title="Xenon Lab" sub="Consumables" color="bg-emerald-900" backdrop="/assets/monsters/Inferno Crater/Lava Lurker.jpg" />
      <NavBtn 
        onClick={startBoss} 
        icon={<AlertCircle />} 
        title="Boss" 
        sub="High Yield" 
        color="bg-red-700" 
        disabled={isPenalized} 
        backdrop="/assets/monsters/Void Sector 7/Void Wraith.jpg"
      />
      <NavBtn 
        onClick={() => setView('syndicate')} 
        icon={<Shield />} 
        title="Syndicate" 
        sub="Maintenance" 
        color="bg-red-900 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]" 
        disabled={true}
        backdrop="/assets/monsters/Abyssal Trench/Benthic Behemoth.jpg" 
      />
      <NavBtn 
        onClick={() => setView('pvp')} 
        icon={<Swords />} 
        title="PVP Arena" 
        sub="Holo-Grid" 
        color="bg-red-900 border-red-500/50" 
        backdrop="/assets/monsters/Gale Empire/Vortex Vanguard.jpg"
      />
      <NavBtn 
        onClick={() => setView('pets')} 
        icon={<Sparkles />} 
        title="Genesis Pets" 
        sub="Web3" 
        color="bg-cyan-900 border-cyan-400/30" 
        backdrop="/assets/monsters/Neon Slums/Ember Drake.jpg"
      />
      <NavBtn 
        onClick={() => setView('manual')} 
        icon={<BookOpen />} 
        title="Manual" 
        sub="How to Play" 
        color="bg-cyan-600 border-cyan-400/50" 
        backdrop="/assets/monsters/Void Sector 7/Rift Lurker.jpg"
      />
      {isAdmin && (
        <NavBtn 
          onClick={() => setView('admin')} 
          icon={<ShieldAlert />} 
          title="Admin Panel" 
          sub="Genesis Access" 
          color="bg-red-600 border-red-500" 
          backdrop="/assets/monsters/Void Sector 7/Null Stalker.jpg"
        />
      )}
    </div>
  );
});
