import React, { useMemo } from 'react';

/**
 * AnimatedBackground
 * Creates a scrolling 3D collage of monster assets with a comic/manga filter.
 */
export const AnimatedBackground = React.memo(({ MONSTERS, performanceMode }) => {
  // Memoize the monster list to avoid reshuffling on every render
  const collageList = useMemo(() => {
    if (!MONSTERS || MONSTERS.length === 0) return [];
    
    // Use a subset for performance
    const subset = [...MONSTERS].slice(0, 32); // Reduced from 48 for performance
    const expanded = [...subset, ...subset];
    
    // Add random properties once
    return expanded.map(monster => ({
      ...monster,
      rotation: Math.random() * 8 - 4,
      id: Math.random().toString(36).substr(2, 9)
    })).sort(() => Math.random() - 0.5);
  }, [MONSTERS.length]); 

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
      {/* 3D Perspective Wrapper */}
      <div className="absolute inset-0 perspective-1000 flex items-center justify-center scale-125">
        <div 
          className="relative w-[200vw] h-[200vh] grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 opacity-20 transform-style-3d"
          style={{ 
            filter: 'contrast(1.2) grayscale(0.2) saturate(1.5) brightness(0.7)',
            transform: 'translate(-10%, -10%) rotate(12deg)'
          }}
        >
          {collageList.map((monster, i) => (
            <div 
              key={`${monster.id}-${i}`} 
              className="relative aspect-square border-4 border-black/40 shadow-2xl overflow-hidden bg-black flex items-center justify-center transition-transform duration-500 will-change-transform"
              style={{
                transform: `rotate(${monster.rotation}deg)`
              }}
            >
              {/* Halftone pattern overlay on items */}
              <div className="absolute inset-0 z-10 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
              
              <img
                src={`/assets/monsters/${monster.folder || 'Neon Slums'}/${monster.name}.png`}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  const folder = monster.folder || 'Neon Slums';
                  if (e.target.src.endsWith('.png')) {
                    e.target.src = `/assets/monsters/${folder}/${monster.name}.jpg`;
                  } else {
                    e.target.onerror = null;
                    e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + monster.name;
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Comic Overlays (Disabled in Performance Mode) */}
      {!performanceMode && (
        <>
          {/* Global Halftone Overlay */}
          <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          {/* Vignette */}
          <div className="absolute inset-0 z-[2] pointer-events-none bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.8)_100%)]"></div>
          
          {/* Scanlines Effect */}
          <div className="absolute inset-0 z-[3] pointer-events-none bg-scanline opacity-[0.15]"></div>

          {/* Sketch-style paper texture overlay */}
          <div className="absolute inset-0 z-[4] pointer-events-none opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/pinstriped-suit.png")' }}></div>
        </>
      )}
    </div>
  );
});
