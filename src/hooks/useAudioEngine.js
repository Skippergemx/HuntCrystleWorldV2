import { useState, useRef, useCallback, useEffect } from 'react';

export const SOUNDS = {
  mainBGM: [
    '/assets/sounds/Main-BGM01.mp3', 
    '/assets/sounds/Main-BGM02.mp3',
    '/assets/sounds/Main-BGM03.mp3',
    '/assets/sounds/Main-BGM04.mp3',
    '/assets/sounds/Main-BGM05.mp3',
    '/assets/sounds/Main-BGM06.mp3'
  ],
  dungeonBGM: ['/assets/sounds/Dungeon-BGM01.mp3', '/assets/sounds/Dungeon-BGM02.mp3'],
  bossBGM: ['/assets/sounds/Boss-BGM01.mp3', '/assets/sounds/Boss-BMG02.mp3'],
  playerAttack: '/assets/sounds/Player-Attack.wav',
  monsterAttack: '/assets/sounds/Monster-Attack.wav',
  obtainLoot: '/assets/sounds/Obtain-Loot.wav',
  useHeal: '/assets/sounds/Use-Heal-Potion.wav'
};

export const useAudioEngine = (view, enemyIsBoss) => {
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isSfxOn, setIsSfxOn] = useState(true);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const bgmRef = useRef(new Audio());

  const playSFX = useCallback((soundPath) => {
    if (!isSfxOn) return;
    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().catch(() => { });
  }, [isSfxOn]);

  const updateBGM = useCallback((forceTrack = null) => {
    if (!isMusicOn) {
      bgmRef.current.pause();
      return;
    }

    let tracks = [];
    const isCombatView = view === 'dungeon' || view === 'boss';

    if (isCombatView) {
      tracks = (view === 'boss' || enemyIsBoss) ? SOUNDS.bossBGM : SOUNDS.dungeonBGM;
    } else {
      tracks = SOUNDS.mainBGM;
    }

    const selectedTrack = forceTrack || tracks[Math.floor(Math.random() * tracks.length)];

    const currentSrc = bgmRef.current.src ? decodeURIComponent(bgmRef.current.src) : "";
    const isCombatTrack = currentSrc.includes('Dungeon') || currentSrc.includes('Boss');
    const isMainTrack = currentSrc.includes('Main');

    const shouldChange = forceTrack || 
      (isCombatView && !isCombatTrack) ||
      (!isCombatView && !isMainTrack) ||
      (!bgmRef.current.src);

    if (shouldChange) {
      bgmRef.current.pause();
      bgmRef.current.src = selectedTrack;
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.3;
      bgmRef.current.play().catch(e => console.log("BGM play error", e));
    } else if (bgmRef.current.paused && isMusicOn) {
      bgmRef.current.play().catch(e => console.log("BGM resume error", e));
    }
  }, [view, isMusicOn, enemyIsBoss]);

  const skipTrack = useCallback(() => {
    const isCombatView = view === 'dungeon' || view === 'boss';
    let tracks = [];
    if (isCombatView) {
      tracks = (view === 'boss' || enemyIsBoss) ? SOUNDS.bossBGM : SOUNDS.dungeonBGM;
    } else {
      tracks = SOUNDS.mainBGM;
    }

    const nextIdx = (currentTrackIdx + 1) % tracks.length;
    setCurrentTrackIdx(nextIdx);
    updateBGM(tracks[nextIdx]);
  }, [view, enemyIsBoss, currentTrackIdx, updateBGM]);

  useEffect(() => {
    updateBGM();
  }, [updateBGM]);

  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
    };
  }, []);

  return {
    isMusicOn,
    setIsMusicOn,
    isSfxOn,
    setIsSfxOn,
    playSFX,
    skipTrack
  };
};
