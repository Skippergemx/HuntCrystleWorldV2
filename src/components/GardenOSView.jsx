import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, User, ArrowLeft, ChevronDown } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useGardenAI } from '../hooks/useGardenAI';
import { Header, CitizenMedia, AvatarMedia } from './GameUI';
import { TalkingNPC } from './SharedQuestUI';
import { BattleParticles } from './CombatEffects';
import SocialShare from './SocialShare';
import QUESTIONS from '../data/garden_questions.json';

const QUESTIONS_PER_SESSION = 5;

const CATEGORY_ICONS = {
  Integrity: '🛡️',
  Community: '🤝',
  Builder: '🔨',
  Creator: '🎨',
  Stewardship: '📚',
  Connectivity: '🌐',
};

const CATEGORY_COLORS = {
  Integrity: 'border-amber-400 bg-amber-500/10',
  Community: 'border-emerald-400 bg-emerald-500/10',
  Builder: 'border-cyan-400 bg-cyan-500/10',
  Creator: 'border-pink-400 bg-pink-500/10',
  Stewardship: 'border-purple-400 bg-purple-500/10',
  Connectivity: 'border-blue-400 bg-blue-500/10',
};

// Monster art mapped to each category for scenario backdrops
const CATEGORY_MONSTERS = {
  Integrity: { folder: 'Neon Slums', name: 'Ember Drake' },
  Community: { folder: 'Gale Empire', name: 'Zephyr Scout' },
  Builder: { folder: 'Rust Canyon', name: 'Iron Pet 2-2' },
  Creator: { folder: 'Void Sector 7', name: 'Null Stalker' },
  Stewardship: { folder: 'Inferno Crater', name: 'Magma Creeper' },
  Connectivity: { folder: 'Tectonic Ridge', name: 'Rock Crusher' },
};

const TIER_LABELS = {
  premium: { label: 'PREMIUM', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  standard: { label: 'STANDARD', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  basic: { label: 'BASIC', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  minimal: { label: 'MINIMAL', color: 'text-slate-600', bg: 'bg-slate-800/20' },
};

const OASIS_SAGE_NPC = 25;

const ORACLE_PHRASES = [
  "The garden remembers every choice you've made...",
  "Roots grow deeper when we face hard truths together.",
  "I see the seeds of change stirring within you.",
  "The garden grows when we grow together.",
  "Every virtue you practice strengthens the soil of who you are.",
  "What will you cultivate in this season of growth?",
  "The soil of character is tended, not forced.",
  "Even the smallest seed can reshape the garden.",
];

// ── DESIGN TOKENS: DWG comic-neon visual language ──
const COMIC_CARD = 'bg-white border-[4px] border-black rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] relative overflow-hidden text-slate-800';
const COMIC_CARD_COMPACT = 'bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_rgba(0,0,0,1)] relative text-slate-800';
const COMIC_BADGE = 'bg-white border-2 border-black px-2.5 py-0.5 text-[9px] font-black uppercase italic shadow-[2px_2px_0_rgba(0,0,0,1)] whitespace-nowrap text-slate-800';
const HALFTONE_STYLE = { backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '10px 10px', opacity: 0.05 };
const BUTTON_PRIMARY = 'bg-emerald-500 text-black font-black uppercase italic rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-none';
const BUTTON_SECONDARY = 'bg-slate-800 text-white font-black uppercase italic rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-none';
const BUTTON_GHOST = 'text-slate-600 hover:text-black font-black uppercase italic tracking-wider transition-colors';

// ── Shared CSS keyframes (rendered inline, global scope) ──
const OASIS_KEYFRAMES = `
  @keyframes oracleGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.3), 0 0 40px rgba(16,185,129,0.1); }
    50% { box-shadow: 0 0 30px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.2); }
  }
  @keyframes floatUp {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes orbit1 { from { transform: rotate(0deg) translateX(60px) rotate(0deg); } to { transform: rotate(360deg) translateX(60px) rotate(-360deg); } }
  @keyframes orbit2 { from { transform: rotate(0deg) translateX(80px) rotate(0deg); } to { transform: rotate(-360deg) translateX(80px) rotate(360deg); } }
  @keyframes orbit3 { from { transform: rotate(0deg) translateX(70px) rotate(0deg); } to { transform: rotate(360deg) translateX(70px) rotate(-360deg); } }
  @keyframes waterDrop {
    0% { opacity: 1; transform: translateY(-20px) scale(0.5); }
    50% { opacity: 1; transform: translateY(10px) scale(1.2); }
    100% { opacity: 0; transform: translateY(40px) scale(0.3); }
  }
  @keyframes plantBob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .garden-fade-1 { animation: fadeInUp 0.6s ease-out both; animation-delay: 0.1s; }
  .garden-fade-2 { animation: fadeInUp 0.6s ease-out both; animation-delay: 0.3s; }
  .garden-fade-3 { animation: fadeInUp 0.6s ease-out both; animation-delay: 0.5s; }
  .garden-fade-4 { animation: fadeInUp 0.6s ease-out both; animation-delay: 0.7s; }
  .garden-fade-5 { animation: fadeInUp 0.6s ease-out both; animation-delay: 0.9s; }
  .garden-fade-6 { animation: fadeInUp 0.6s ease-out both; animation-delay: 1.1s; }
  @keyframes agcNeonPulse {
    0%, 100% { text-shadow: 0 0 7px rgba(16,185,129,0.3), 0 0 14px rgba(16,185,129,0.15); }
    50% { text-shadow: 0 0 14px rgba(16,185,129,0.6), 0 0 28px rgba(6,182,212,0.35), 0 0 42px rgba(168,85,247,0.25); }
  }
  @keyframes agcSpinCW { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes agcSpinCCW { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
  @keyframes agcBarShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes agcDotPulse { 0%, 20% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 80%, 100% { opacity: 0.2; transform: scale(0.8); } }
  @keyframes agcScanLine { 0% { transform: translateY(-100%); } 100% { transform: translateY(400%); } }
  @keyframes agcSpeedDash1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes agcSpeedDash2 { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
  @keyframes agcFloatBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes agcSparkleFloat {
    0% { opacity: 0; transform: translateY(0) translateX(0) scale(0); }
    10% { opacity: 1; transform: translateY(-10px) translateX(5px) scale(1); }
    30% { opacity: 0.8; transform: translateY(-30px) translateX(-8px) scale(0.7); }
    60% { opacity: 0.3; transform: translateY(-60px) translateX(12px) scale(1.1); }
    100% { opacity: 0; transform: translateY(-100px) translateX(-3px) scale(0); }
  }
  @keyframes agcRipplePulse {
    0% { transform: scale(0.6); opacity: 0.6; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes agcOrbitTwinkle {
    0%, 100% { opacity: 0.4; transform: scale(0.7); }
    50% { opacity: 1; transform: scale(1.3); }
  }
  @keyframes agcTitleShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes sparkleBurst {
    0% { opacity: 1; transform: translate(0, 0) scale(1); }
    50% { opacity: 0.8; transform: translate(var(--sx, 30px), var(--sy, -30px)) scale(1.2); }
    100% { opacity: 0; transform: translate(var(--sx, 60px), var(--sy, -60px)) scale(0.3); }
  }
  @keyframes heartFloat {
    0% { opacity: 1; transform: translateY(0) scale(0.5); }
    30% { opacity: 1; transform: translateY(-16px) scale(1.2); }
    70% { opacity: 0.8; transform: translateY(-40px) scale(1); }
    100% { opacity: 0; transform: translateY(-70px) scale(0.6); }
  }
`;

const ORBIT_EMOJIS = ['🌱', '🌿', '✨', '🔮', '💎', '🌍'];

// ── InfoTooltip: clickable "?" with comic styling ──
const InfoTooltip = ({ id, text, activeId, onToggle }) => {
  const isActive = activeId === id;
  return (
    <span className="relative inline-flex ml-1.5">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(id); }}
        className={`w-4 h-4 flex items-center justify-center text-[8px] font-black transition-all duration-300 border-2 border-black rounded ${
          isActive
            ? 'bg-emerald-500 text-black shadow-[2px_2px_0_rgba(0,0,0,1)]'
            : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-black shadow-[1px_1px_0_rgba(0,0,0,1)]'
        }`}
      >
        ?
      </button>
      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 px-3 py-2 rounded-xl border-[3px] border-black bg-white shadow-[4px_4px_0_rgba(0,0,0,1)] text-[10px] text-slate-700 leading-relaxed transition-all duration-300 pointer-events-none ${
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
      }`}>
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-[3px] border-b-[3px] border-black rotate-45 -mt-1.5" />
      </div>
    </span>
  );
};

export const GardenOSView = React.memo(() => {
  const { player, adventure, actions, FOODS, addLog, audio, SOUNDS } = useGame();
  const { setView } = adventure;

  // Garden AI hook
  const { generateReflection, generateSessionSummary, generateQuestionBatch, generateReflectionStory, waterPlant, HARMONY_MESSAGE, resetSession, isAnalyzing, aiCallsRemaining } = useGardenAI();

  // Particle effects ref
  const particlesRef = useRef(null);

  // Session state
  const [sessionKey, setSessionKey] = useState(0);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [reflection, setReflection] = useState(null);

  // Stable shuffled options per question within a session
  const shuffledOptionsRef = useRef({});
  const shuffledOptionsKeyRef = useRef(sessionKey);
  // Reset shuffle cache when session changes
  if (shuffledOptionsKeyRef.current !== sessionKey) {
    shuffledOptionsRef.current = {};
    shuffledOptionsKeyRef.current = sessionKey;
  }

  const getShuffledOptions = (question) => {
    if (!question) return [];
    const cached = shuffledOptionsRef.current[question.id];
    if (cached) return cached;
    const shuffled = [...question.options].sort(() => Math.random() - 0.5);
    shuffledOptionsRef.current[question.id] = shuffled;
    return shuffled;
  };
  const [rewardResult, setRewardResult] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [monsterImgError, setMonsterImgError] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [phase, setPhase] = useState('dashboard'); // 'dashboard' | 'quiz'
  const [profileReturnTo, setProfileReturnTo] = useState('quiz'); // where "Back" goes from profile

  // ── Talking Plants state ──
  const [plantStates, setPlantStates] = useState({
    sunny: { waters: 0, dialogue: null, isWatering: false },
    spike: { waters: 0, dialogue: null, isWatering: false },
    willow: { waters: 0, dialogue: null, isWatering: false },
    berry: { waters: 0, dialogue: null, isWatering: false },
    ember: { waters: 0, dialogue: null, isWatering: false },
    luna: { waters: 0, dialogue: null, isWatering: false },
    boulder: { waters: 0, dialogue: null, isWatering: false },
    zephyr: { waters: 0, dialogue: null, isWatering: false },
    ivy: { waters: 0, dialogue: null, isWatering: false },
  });

  // Visual effects state: sparkle burst, bloom celebration, harmony
  const [sparkleKey, setSparkle] = useState(0);
  const [bloomCelebration, setBloomCelebration] = useState(null); // plantKey | null
  const [showHarmony, setShowHarmony] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);
  const [prevPhase, setPrevPhase] = useState('dashboard');

  // Navigate between phases with animated transitions
  const navigateTo = useCallback((nextPhase) => {
    setPrevPhase(phase);
    setTransitionKey(k => k + 1);
    setPhase(nextPhase);
  }, [phase]);

  // Get transition animation class based on direction
  const getTransitionClass = (from, to) => {
    if (to === 'quiz' || to === 'profile') return 'animate-in slide-in-from-right fade-in duration-500';
    if (to === 'dashboard') return 'animate-in slide-in-from-left fade-in duration-500';
    if (to === 'complete') return 'animate-in zoom-in-95 fade-in duration-400';
    if (to === 'reflection') return 'animate-in slide-in-from-right fade-in duration-500';
    return 'animate-in fade-in duration-300';
  };

  // Oracle typewriter state
  const [oraclePhraseIdx, setOraclePhraseIdx] = useState(() => Math.floor(Math.random() * ORACLE_PHRASES.length));
  const [oracleDisplay, setOracleDisplay] = useState('');

  // Tooltip state — only one open at a time, auto-dismiss after 10s
  const [activeTooltip, setActiveTooltip] = useState(null);
  const tooltipTimerRef = useRef(null);
  const dismissTooltip = useCallback(() => {
    clearTimeout(tooltipTimerRef.current);
    setActiveTooltip(null);
  }, []);
  const toggleTooltip = useCallback((id) => {
    setActiveTooltip(prev => {
      if (prev === id) {
        clearTimeout(tooltipTimerRef.current);
        return null;
      }
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = setTimeout(() => setActiveTooltip(null), 10000);
      return id;
    });
  }, []);
  const [greeting] = useState(() => {
    const greetings = [
      "Welcome, grower. The garden has been waiting for you.",
      "Every choice plants a seed. What will you grow today?",
      "The garden grows when we grow together. Let's begin.",
      "Step into the garden. Your roots run deeper than you know.",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  });

  // Typewriter: reveal current phrase character by character
  useEffect(() => {
    const phrase = ORACLE_PHRASES[oraclePhraseIdx];
    if (oracleDisplay.length < phrase.length) {
      const t = setTimeout(() => setOracleDisplay(phrase.slice(0, oracleDisplay.length + 1)), 35);
      return () => clearTimeout(t);
    }
  }, [oracleDisplay, oraclePhraseIdx]);

  // Cycle phrases every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setOracleDisplay('');
      setOraclePhraseIdx(prev => (prev + 1) % ORACLE_PHRASES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Initialize session: pick 5 questions with weighted selection
  useEffect(() => {
    resetSession();
    const completed = new Set(player?.gardenCompletedIds || []);
    const answerHistory = player?.gardenAnswerHistory || [];
    const recentIds = new Set(answerHistory.slice(-10).map(a => a.questionId));

    // Merge static questions with player's AI-generated questions from Firestore
    const aiQuestions = player?.gardenAIQuestions || [];
    const allQuestions = [...QUESTIONS, ...aiQuestions];
    const allIds = allQuestions.map(q => q.id);

    // Weighted selection: unseen = 10, seen = 1, recently seen = 0.1
    const pool = allQuestions.map(q => {
      let weight = completed.has(q.id) ? 1 : 10;
      if (recentIds.has(q.id)) weight = 0.1;
      return { q, weight };
    });

    // Check pool variety — if average weight < 2, trigger AI batch generation
    const avgWeight = pool.reduce((s, item) => s + item.weight, 0) / pool.length;
    if (avgWeight < 2 && aiQuestions.length < 50) {
      console.log('Garden: Pool variety low, triggering AI question generation...');
      generateQuestionBatch(allIds).then(batch => {
        if (batch?.length) {
          actions.saveAIQuestions(batch);
        }
      });
    }

    // Weighted random selection without replacement
    const selected = [];
    const remaining = [...pool];
    for (let i = 0; i < QUESTIONS_PER_SESSION && remaining.length > 0; i++) {
      const totalWeight = remaining.reduce((s, item) => s + item.weight, 0);
      let r = Math.random() * totalWeight;
      let pickIdx = 0;
      for (let j = 0; j < remaining.length; j++) {
        r -= remaining[j].weight;
        if (r <= 0) { pickIdx = j; break; }
      }
      selected.push(remaining[pickIdx].q);
      remaining.splice(pickIdx, 1);
    }

    setSessionQuestions(selected);
    setCurrentIdx(0);
    setSelectedOption(null);
    setReflection(null);
    setRewardResult(null);
    setSessionResults([]);
    setSessionSummary(null);
    setIsComplete(false);
  }, [sessionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sound effect: play useHeal when reflection appears
  useEffect(() => {
    if (reflection && audio?.playSFX) {
      audio.playSFX(SOUNDS.useHeal);
      // Emit heal particles (green/emerald) when reflection appears
      if (particlesRef.current) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight * 0.25;
        particlesRef.current.emit(cx, cy, 'heal', { count: 25, speed: 2, size: 4 });
      }
    }
  }, [reflection]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sound effect: play levelup when session completes
  useEffect(() => {
    if (isComplete && audio?.playSFX) {
      audio.playSFX(SOUNDS.levelup);
      // Trigger celebration particles
      if (particlesRef.current) {
        particlesRef.current.triggerLevelUp();
      }
    }
  }, [isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset monster image error when question changes
  useEffect(() => {
    setMonsterImgError(false);
  }, [currentIdx]);

  const currentQuestion = sessionQuestions[currentIdx];
  const totalQuestions = Math.min(sessionQuestions.length, QUESTIONS_PER_SESSION);
  const isLastQuestion = currentIdx >= totalQuestions - 1;
  const progress = `${Math.min(currentIdx + 1, totalQuestions)}/${totalQuestions}`;

  // Monster art for current category
  const monsterInfo = currentQuestion ? CATEGORY_MONSTERS[currentQuestion.category] : null;
  const monsterImgSrc = monsterInfo ? `/assets/monsters/${monsterInfo.folder}/${monsterInfo.name}.jpg` : null;

  // Handle option selection
  const handleSelectOption = useCallback(async (option) => {
    if (selectedOption) return; // Already answered
    setSelectedOption(option);

    // Sound: click feedback
    if (audio?.playSFX) {
      audio.playSFX(SOUNDS.playerAttack);
    }

    // Deliver rewards via action
    const result = await actions.completeGardenQuestion(currentQuestion.id, option.rewardTier, FOODS, option.virtue, currentQuestion.category);
    setRewardResult(result);

    // Generate AI reflection (or use fallback)
    const aiReflection = await generateReflection(currentQuestion, option, player?.name || 'Hunter');

    if (aiReflection) {
      setReflection(aiReflection);
    } else {
      // Fallback to pre-authored reflection
      setReflection({
        reflection: currentQuestion.reflection,
        virtueInsight: `You demonstrated ${option.virtue}.`,
        gardenWisdom: 'The garden observes all choices.',
      });
    }

    // Track session results
    const newResult = {
      category: currentQuestion.category,
      chosenVirtue: option.virtue,
      rewardTier: option.rewardTier,
    };
    setSessionResults(prev => [...prev, newResult]);
  }, [selectedOption, currentQuestion, actions, FOODS, player, generateReflection, audio]);

  // Proceed to next question or finish session
  const handleNext = useCallback(async () => {
    if (isLastQuestion) {
      // Generate session summary
      const summary = await generateSessionSummary([...sessionResults, {
        category: currentQuestion.category,
        chosenVirtue: selectedOption.virtue,
        rewardTier: selectedOption.rewardTier,
      }], player?.name || 'Hunter');
      setSessionSummary(summary || {
        profileTitle: 'The Growing Seed',
        summary: 'Your garden journey has just begun. Every choice you made shows potential for growth.',
        dominantVirtue: 'curiosity',
        growthArea: 'Continue exploring different virtues to strengthen your roots.',
        gardenMetaphor: 'Like a seed in spring, your character is beginning to bloom.',
      });
      // Persist the profile to Firestore so it's accessible across sessions
      if (summary) {
        actions.saveGardenProfile(summary);
      }
      setIsComplete(true);
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setReflection(null);
      setRewardResult(null);
    }
  }, [isLastQuestion, sessionResults, currentQuestion, selectedOption, generateSessionSummary]);

  // Start quiz from dashboard
  const handleStartQuiz = useCallback(() => {
    setProfileReturnTo('quiz');
    navigateTo('quiz');
  }, [navigateTo]);

  // Return to Oracle dashboard from session complete
  const handleReturnToOracle = useCallback(() => {
    setIsComplete(false);
    setSessionSummary(null);
    setSessionKey(prev => prev + 1);
    navigateTo('dashboard');
  }, [navigateTo]);

  // Close view
  const handleClose = () => setView('menu');

  // ── Social share handlers ──
  const buildShareText = () => {
    const p = player?.gardenProfile;
    const answered = player?.gardenAnswerHistory?.length || 0;
    const title = p?.profileTitle || 'Oasis Seeker';
    const virtue = p?.dominantVirtue || 'Wisdom';
    return encodeURIComponent(
      `🌿 ${title}\n` +
      `✨ ${virtue} · ${answered} reflections in the Oasis Oracle\n\n` +
      `⚔️ Play DungeonsWithGems:`
    );
  };
  const shareFarcaster = () => {
    window.open(`https://warpcast.com/~/compose?text=${buildShareText()}`, '_blank', 'noopener,noreferrer');
  };
  const shareX = () => {
    window.open(`https://x.com/intent/tweet?text=${buildShareText()}`, '_blank', 'noopener,noreferrer');
  };

  // Open profile from any view with return tracking
  const openProfile = useCallback((returnTo) => {
    setProfileReturnTo(returnTo);
    setShowProfile(true);
  }, []);
  const closeProfile = useCallback(() => {
    dismissTooltip();
    setShowProfile(false);
  }, [dismissTooltip]);

  // Refresh oasis: spend 10,000 GX to replay all questions
  const OASIS_REFRESH_COST = 10000;
  const canAffordRefresh = (player?.tokens || 0) >= OASIS_REFRESH_COST;
  const handleRefreshGarden = () => {
    const success = actions.refreshGarden();
    if (success) {
      setSessionKey(prev => prev + 1);
    }
  };

  // ── Talking Plants: water a plant, get AI dialogue ──
  const handleWaterPlant = useCallback(async (plantKey, plantName) => {
    const plant = plantStates[plantKey];
    if (!plant || plant.isWatering || plant.waters >= 3) return;

    setPlantStates(prev => ({
      ...prev,
      [plantKey]: { ...prev[plantKey], isWatering: true, dialogue: null },
    }));

    // Trigger sparkle burst (increment key to re-render sparkle container)
    setSparkle(k => k + 1);

    try {
      const dialogue = await waterPlant(plantName, plantKey, plant.waters);
      const newWaters = plant.waters + 1;
      setPlantStates(prev => ({
        ...prev,
        [plantKey]: { ...prev[plantKey], isWatering: false, dialogue, waters: newWaters },
      }));

      // Check if this watering completed the plant
      if (newWaters >= 3) {
        setBloomCelebration(plantKey);
        setTimeout(() => setBloomCelebration(null), 6000);

        // Check if ALL 9 plants are now fully bloomed
        const allKeys = ['sunny', 'spike', 'willow', 'berry', 'ember', 'luna', 'boulder', 'zephyr', 'ivy'];
        const allFull = allKeys.every(k => {
          if (k === plantKey) return true;
          return plantStates[k]?.waters >= 3;
        });
        if (allFull) {
          setShowHarmony(true);
        }
      }

      // Auto-clear dialogue: arc messages stay longer (12s) vs random ones (8s)
      const timeout = plant.waters <= 2 ? 12000 : 8000;
      setTimeout(() => {
        setPlantStates(prev => ({
          ...prev,
          [plantKey]: { ...prev[plantKey], dialogue: null },
        }));
      }, timeout);
    } catch {
      setPlantStates(prev => ({
        ...prev,
        [plantKey]: { ...prev[plantKey], isWatering: false },
      }));
    }
  }, [plantStates, waterPlant]);

  // ── Daily Reflection Story auto-generation ──
  // Trigger once per day when entering dashboard
  useEffect(() => {
    if (phase !== 'dashboard') return;
    const story = player?.gardenReflectionStory;
    const today = new Date().toDateString();
    const storyDate = story?.generatedAt ? new Date(story.generatedAt).toDateString() : null;
    if (storyDate === today) return; // Already have today's story

    // Generate new story (fire and forget — shows loading state then populates)
    console.log('Garden: Generating daily reflection story...');
    generateReflectionStory(player?.name || 'Hunter').then((newStory) => {
      if (newStory?.title && newStory?.story) {
        actions.saveReflectionStory(newStory);
      }
    });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Garden Profile View (toggle from quiz header) ──
  if (showProfile) {
    const answerHistory = player?.gardenAnswerHistory || [];
    const totalAnswered = answerHistory.length;
    const totalQuestions = QUESTIONS.length;

    // Category breakdown
    const categoryCounts = {};
    answerHistory.forEach(a => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    });

    // Virtue frequency (top 5)
    const virtueCounts = {};
    answerHistory.forEach(a => {
      if (a.virtue) virtueCounts[a.virtue] = (virtueCounts[a.virtue] || 0) + 1;
    });
    const topVirtues = Object.entries(virtueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Premium rate
    const premiumCount = answerHistory.filter(a => a.rewardTier === 'premium').length;
    const premiumRate = totalAnswered > 0 ? Math.round((premiumCount / totalAnswered) * 100) : 0;

    // Tier distribution
    const tierCounts = { premium: 0, standard: 0, basic: 0, minimal: 0 };
    answerHistory.forEach(a => { if (tierCounts[a.rewardTier] !== undefined) tierCounts[a.rewardTier]++; });

    const profile = player?.gardenProfile;

    return (
      <div key={transitionKey} className={`flex flex-col h-full overflow-y-auto ${getTransitionClass(prevPhase, 'profile')}`}>
        <Header title="OASIS ORACLE" npcNum={OASIS_SAGE_NPC} onClose={handleClose}>
          <button
            onClick={closeProfile}
            className={`${COMIC_BADGE} inline-flex items-center gap-1 transform rotate-0`}
          >
            <ArrowLeft size={10} />
            {profileReturnTo === 'dashboard' ? 'Back to Oasis' : 'Back to Quiz'}
          </button>
        </Header>

        <BattleParticles ref={particlesRef} />

        <div className="p-4 md:p-6" onClick={dismissTooltip}>
          {/* Profile Card */}
          <div className={`${COMIC_CARD} p-6 mb-6 transform -rotate-1`}>
            <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl border-[3px] border-black overflow-hidden shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <CitizenMedia num={OASIS_SAGE_NPC} className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  {profile ? (
                    <>
                      <div className="flex items-center">
                        <h2 className="text-lg font-black text-slate-800 uppercase" style={{ fontFamily: "'Bungee', cursive" }}>{profile.profileTitle}</h2>
                        <InfoTooltip id="profile-title" text="Your Oasis archetype, generated by the Oasis Oracle AI after your last quiz session. It reflects the character your choices reveal." activeId={activeTooltip} onToggle={toggleTooltip} />
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-black text-slate-400 uppercase" style={{ fontFamily: "'Bungee', cursive" }}>No Profile Yet</h2>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest">Complete a quiz session to receive your assessment</p>
                    </>
                  )}
                </div>
              </div>

              {profile && (
                <>
                  <p className="text-sm text-slate-600 mb-4 italic leading-relaxed">"{profile.summary}"</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-xl p-3 border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transform rotate-1">
                      <div className="flex items-center">
                        <span className="text-[9px] text-slate-700 font-black uppercase">Dominant Virtue</span>
                        <InfoTooltip id="dominant-virtue" text="The virtue that appeared most often in your recent answers — the strength the garden sees in you." activeId={activeTooltip} onToggle={toggleTooltip} />
                      </div>
                      <div className="text-slate-800 font-bold capitalize mt-1">{profile.dominantVirtue}</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transform -rotate-1">
                      <div className="flex items-center">
                        <span className="text-[9px] text-slate-700 font-black uppercase">Growth Area</span>
                        <InfoTooltip id="growth-area" text="A dimension where your choices showed room for deeper growth. Not a weakness — an invitation." activeId={activeTooltip} onToggle={toggleTooltip} />
                      </div>
                      <div className="text-slate-800 text-xs mt-1">{profile.growthArea}</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 border-l-[6px] border-emerald-500 bg-emerald-50/50 rounded-r-xl flex items-center justify-center gap-1">
                    <span className="text-[7px] text-emerald-700 uppercase font-black tracking-widest">Oasis Metaphor</span>
                    <InfoTooltip id="garden-metaphor" text="A poetic reflection from the Oracle — a metaphor that captures your current journey in the oasis." activeId={activeTooltip} onToggle={toggleTooltip} />
                    <p className="text-xs text-emerald-800 italic">"{profile.gardenMetaphor}"</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className={`${COMIC_CARD} p-5 mb-6`}>
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2" style={{ fontFamily: "'Bungee', cursive" }}>
              <span className="text-lg">📊</span> Oasis Stats
            </h3>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-600 uppercase font-bold flex items-center">
                  🌱 Questions Tended
                  <InfoTooltip id="questions-tended" text="How many of the garden questions you have answered. Each question can only be answered once per garden cycle." activeId={activeTooltip} onToggle={toggleTooltip} />
                </span>
                <span className="text-xs text-emerald-700 font-black">{totalAnswered}/{totalQuestions}</span>
              </div>
              {/* Loading bar */}
              <div className="w-full h-3 bg-white border-[2px] border-black rounded-full overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)]">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(totalAnswered / totalQuestions) * 100}%` }} />
              </div>
            </div>

            {/* Premium Rate */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-600 uppercase font-bold flex items-center">
                  💎 Premium Rate
                  <InfoTooltip id="premium-rate" text="The percentage of your answers that aligned with the highest virtue tier. Premium choices reflect the deepest alignment with garden values." activeId={activeTooltip} onToggle={toggleTooltip} />
                </span>
                <span className="text-xs text-amber-700 font-black">{premiumRate}%</span>
              </div>
              {/* Loading bar */}
              <div className="w-full h-3 bg-white border-[2px] border-black rounded-full overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)]">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${premiumRate}%` }} />
              </div>
            </div>

            {/* Category Breakdown */}
            {totalAnswered > 0 && (
              <div className="mb-4">
                <div className="text-[10px] text-slate-600 uppercase font-bold mb-2 flex items-center">
                  Category Breakdown
                  <InfoTooltip id="category-breakdown" text="Your answers distributed across 6 categories: Integrity, Community, Builder, Creator, Stewardship, and Connectivity. Each category represents a dimension of character." activeId={activeTooltip} onToggle={toggleTooltip} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => (
                    <div key={cat} className={`${COMIC_BADGE} transform ${Math.random() > 0.5 ? 'rotate-1' : '-rotate-1'}`}>
                      {icon} {categoryCounts[cat] || 0}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Virtues */}
            {topVirtues.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] text-slate-600 uppercase font-bold mb-2 flex items-center">
                  Top Virtues
                  <InfoTooltip id="top-virtues" text="The virtue tags that appear most frequently in your choices. These are the qualities your decisions consistently express." activeId={activeTooltip} onToggle={toggleTooltip} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {topVirtues.map(([virtue, count]) => (
                    <div key={virtue} className={`${COMIC_BADGE} bg-emerald-50`}>
                      🌿 {virtue.replace(/-/g, ' ')} <span className="text-emerald-600">x{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tier Distribution */}
            {totalAnswered > 0 && (
              <div>
                <div className="text-[10px] text-slate-600 uppercase font-bold mb-2 flex items-center">
                  Choice Quality
                  <InfoTooltip id="choice-quality" text="Distribution of your answers across 4 reward tiers: Premium, Standard, Basic, and Minimal. Higher tiers reflect choices with deeper virtue alignment." activeId={activeTooltip} onToggle={toggleTooltip} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(TIER_LABELS).map(([tier, { label, color, bg }], i) => {
                    const tierEmojis = ['💎', '⭐', '📋', '🌑'];
                    return (
                      <div key={tier} className={`text-center p-2 rounded-lg border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] bg-white transform ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}>
                        <div className="text-lg mb-0.5">{tierEmojis[i]}</div>
                        <div className="text-sm font-black text-slate-800">{tierCounts[tier] || 0}</div>
                        <div className="text-[7px] text-slate-500 uppercase font-bold">{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {totalAnswered === 0 && (
              <p className="text-xs text-slate-500 text-center italic py-4">Answer questions to build your garden stats.</p>
            )}
          </div>

          {/* Back Button */}
          <button
            onClick={closeProfile}
            className={`${BUTTON_PRIMARY} w-full py-4 flex items-center justify-center gap-2`}
          >
            <ArrowLeft size={18} />
            {profileReturnTo === 'dashboard' ? 'Back to Oasis' : 'Back to Quiz'}
          </button>
        </div>
      </div>
    );
  }

  // ── Oracle Dashboard ──
  if (phase === 'dashboard') {
    const answerHistory = player?.gardenAnswerHistory || [];
    const totalAnswered = answerHistory.length;
    const profile = player?.gardenProfile;
    const questionsRemaining = QUESTIONS.length - (player?.gardenCompletedIds?.length || 0);
    const sessionSize = Math.min(questionsRemaining, QUESTIONS_PER_SESSION);

    // Category counts for constellation
    const dashCategoryCounts = {};
    answerHistory.forEach(a => { dashCategoryCounts[a.category] = (dashCategoryCounts[a.category] || 0) + 1; });

    return (
      <div key={transitionKey} className={`flex flex-col h-full overflow-y-auto ${getTransitionClass(prevPhase, 'dashboard')}`}>
        <Header title="OASIS ORACLE" npcNum={OASIS_SAGE_NPC} onClose={handleClose} />
        <BattleParticles ref={particlesRef} />
        <style>{OASIS_KEYFRAMES}</style>

        <div className="p-4 md:p-6 flex flex-col items-center relative">
          {/* ── Oracle HUD Portrait (superimposed, futuristic) ── */}
          <div className="garden-fade-1 relative mb-4 mt-2">
            {/* Pulsing aura behind portrait */}
            <div className="absolute inset-0 w-28 h-28 rounded-full bg-emerald-500/20 blur-2xl animate-pulse" style={{ top: '-8px', left: '-8px', width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }} />
            {/* Scan-line overlay on portrait */}
            <div className="relative w-28 h-28 rounded-full border-[3px] border-white overflow-hidden" style={{ animation: 'oracleGlow 3s ease-in-out infinite' }}>
              <CitizenMedia num={OASIS_SAGE_NPC} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16,185,129,0.08) 2px, rgba(16,185,129,0.08) 4px)' }} />
            </div>
            {/* Manga name tag at bottom */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 border-[3px] border-black px-3 py-0.5 transform -rotate-1 shadow-[3px_3px_0_rgba(0,0,0,1)]">
              <span className="text-[8px] font-black text-black uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: "'Bungee', cursive" }}>OASIS ORACLE</span>
            </div>
            {/* Orbiting emoji sprites */}
            {ORBIT_EMOJIS.slice(0, 3).map((emoji, i) => (
              <span key={i} className="absolute top-1/2 left-1/2 text-sm pointer-events-none" style={{ animation: `orbit${i + 1} ${6 + i * 2}s linear infinite` }}>{emoji}</span>
            ))}
            {/* Floating sparkle dots */}
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400/60" style={{ animation: 'floatUp 2.5s ease-in-out infinite' }} />
            <div className="absolute -bottom-1 -left-2 w-2 h-2 rounded-full bg-lime-400/50" style={{ animation: 'floatUp 3s ease-in-out infinite 0.5s' }} />
          </div>

          {/* ── Oracle Speech Bubble (comic style) ── */}
          <div className="garden-fade-1 relative max-w-xs w-full mb-6">
            <div className="bg-white border-[4px] border-black rounded-2xl shadow-[6px_6px_0_rgba(0,0,0,1)] p-4 transform -rotate-1">
              <div className="absolute inset-0 rounded-2xl pointer-events-none" style={HALFTONE_STYLE} />
              <p className="text-sm text-slate-800 font-black uppercase italic leading-relaxed relative">
                "{oracleDisplay}<span className="animate-pulse text-emerald-600">|</span>"
              </p>
            </div>
            {/* Speech bubble tail pointing down */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-[4px] border-b-[4px] border-black rotate-45" />
          </div>

          {/* ── Daily Reflection Story (comic card) ── */}
          <div className="garden-fade-2 w-full mb-6">
            {player?.gardenReflectionStory ? (
              <div className={`${COMIC_CARD} p-5 transform rotate-1`}>
                <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-2xl pointer-events-none" />
                <div className="relative z-10">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📖</span>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider" style={{ fontFamily: "'Bungee', cursive" }}>
                        Today's Reflection
                      </h3>
                    </div>
                    <span className={`${COMIC_BADGE} transform rotate-2 text-[8px]`}>🌅 Daily Story</span>
                  </div>
                  {/* Story title */}
                  <p className="text-[11px] text-emerald-700 font-black uppercase italic mb-2 tracking-wide">
                    "{player.gardenReflectionStory.title}"
                  </p>
                  {/* Story preview with drop cap */}
                  <div className="bg-emerald-50/50 rounded-xl border-2 border-emerald-200 p-4 max-h-32 overflow-y-auto relative">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                      <span className="float-left text-4xl font-black text-emerald-600 leading-[0.8] mr-2 pt-1" style={{ fontFamily: "'Bungee', cursive" }}>{player.gardenReflectionStory.story.charAt(0)}</span>
                      {player.gardenReflectionStory.story.slice(1).substring(0, 200)}...
                    </p>
                    {/* Gradient fade at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-emerald-50/90 to-transparent pointer-events-none rounded-b-xl" />
                  </div>
                  {/* Read Full Story button */}
                  <button
                    onClick={() => navigateTo('reflection')}
                    className="mt-3 w-full py-2 bg-emerald-500 text-black font-black uppercase italic rounded-lg border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-none text-[11px] tracking-wider flex items-center justify-center gap-1"
                  >
                    Read Full Story
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ) : (
              /* Skeleton/loading state while generating */
              <div className={`${COMIC_CARD} p-5 transform rotate-1 animate-pulse`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📖</span>
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                  <div className="h-3 bg-slate-100 rounded w-4/6" />
                </div>
                <p className="text-[9px] text-slate-400 italic mt-3 text-center">The Oracle is weaving today's story...</p>
              </div>
            )}
          </div>

          {/* ── Player Status Strip (comic cards) ── */}
          {profile && (
            <div className="garden-fade-3 w-full grid grid-cols-2 gap-3 mb-6">
              <div className={`${COMIC_CARD_COMPACT} transform rotate-1 p-3`}>
                <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-xl pointer-events-none" />
                <div className="relative">
                  <div className={`${COMIC_BADGE} inline-block mb-1.5 transform -rotate-2`}>Your Archetype</div>
                  <div className="text-sm font-black text-slate-800 uppercase mt-1">{profile.profileTitle}</div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs">🌿</span>
                    <span className="text-[9px] text-emerald-700 capitalize font-bold">{profile.dominantVirtue}</span>
                  </div>
                </div>
              </div>
              <div className={`${COMIC_CARD_COMPACT} transform -rotate-1 p-3`}>
                <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-xl pointer-events-none" />
                <div className="relative">
                  <div className={`${COMIC_BADGE} inline-block mb-1.5`}>Garden Progress</div>
                  <div className="text-lg font-black text-slate-800">
                    {totalAnswered}<span className="text-xs text-slate-400">/{QUESTIONS.length}</span>
                  </div>
                  {/* Emoji progress bar */}
                  <div className="flex gap-0.5 mt-1.5">
                    {Array.from({ length: Math.min(10, Math.ceil((totalAnswered / QUESTIONS.length) * 10)) }, (_, i) => (
                      <span key={i} className="text-[10px]">🌿</span>
                    ))}
                    {Array.from({ length: Math.max(0, 10 - Math.ceil((totalAnswered / QUESTIONS.length) * 10)) }, (_, i) => (
                      <span key={`e${i}`} className="text-[10px] opacity-20">🌑</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Category Constellation ── */}
          {totalAnswered > 0 && (
            <div className="garden-fade-4 w-full mb-6">
              <div className="flex items-center justify-center gap-0 flex-wrap">
                {Object.entries(CATEGORY_ICONS).map(([cat, icon], i) => (
                  <React.Fragment key={cat}>
                    {i > 0 && <div className="w-4 border-t border-dashed border-black/20 mx-0.5" />}
                    <div className="flex flex-col items-center gap-0.5" style={{ animation: `floatUp 3s ease-in-out infinite ${i * 0.3}s` }}>
                      <div className={`${COMIC_BADGE} transform ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}>
                        {icon} {dashCategoryCounts[cat] || 0}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* ── The Garden Grove: Talking Plants ── */}
          <div className="garden-fade-5 w-full mb-6">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <div className={`${COMIC_BADGE} transform -rotate-1 text-[10px]`}>
                🌱 THE OASIS GROVE
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-500 italic mb-4">Water the plants. Watch them bloom. Feel something.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'sunny', name: 'Sunny', emoji: (w) => w === 0 ? '🌱' : w < 3 ? '🌿' : '🌻', color: 'border-amber-400', bg: 'bg-amber-50', glow: 'bg-amber-500/20' },
                { key: 'spike', name: 'Spike', emoji: (w) => w === 0 ? '🌵' : w < 3 ? '🌵' : '🌸', color: 'border-rose-400', bg: 'bg-rose-50', glow: 'bg-rose-500/20' },
                { key: 'willow', name: 'Willow', emoji: (w) => w === 0 ? '🍃' : w < 3 ? '🌿' : '🌿', color: 'border-emerald-400', bg: 'bg-emerald-50', glow: 'bg-emerald-500/20' },
                { key: 'berry', name: 'Berry', emoji: (w) => w === 0 ? '🫐' : w < 3 ? '🌸' : '🍓', color: 'border-rose-400', bg: 'bg-rose-50', glow: 'bg-rose-500/20' },
                { key: 'ember', name: 'Ember', emoji: (w) => w === 0 ? '🌱' : w < 3 ? '🌶️' : '🔥', color: 'border-orange-400', bg: 'bg-orange-50', glow: 'bg-orange-500/20' },
                { key: 'luna', name: 'Luna', emoji: (w) => w === 0 ? '🌱' : w < 3 ? '🌙' : '💮', color: 'border-violet-400', bg: 'bg-violet-50', glow: 'bg-violet-500/20' },
                { key: 'boulder', name: 'Boulder', emoji: (w) => w === 0 ? '🪨' : w < 3 ? '🌱' : '🌵', color: 'border-stone-400', bg: 'bg-stone-50', glow: 'bg-stone-500/20' },
                { key: 'zephyr', name: 'Zephyr', emoji: (w) => w === 0 ? '🌱' : w < 3 ? '🌾' : '🌼', color: 'border-yellow-400', bg: 'bg-yellow-50', glow: 'bg-yellow-500/20' },
                { key: 'ivy', name: 'Ivy', emoji: (w) => w === 0 ? '🌱' : w < 3 ? '☘️' : '🍀', color: 'border-teal-400', bg: 'bg-teal-50', glow: 'bg-teal-500/20' },
              ].map((plant, idx) => {
                const PLANT_ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-2', '-rotate-1', 'rotate-1'];
                const state = plantStates[plant.key];
                const emoji = plant.emoji(state.waters);
                const isFull = state.waters >= 3;
                const canWater = !state.isWatering && !isFull;

                return (
                  <div key={plant.key} className={`${COMIC_CARD} p-5 flex flex-col items-center transform ${PLANT_ROTATIONS[idx]}`}>
                    <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center w-full">
                      {/* Plant Emoji with glow */}
                      <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full border-[4px] border-black flex items-center justify-center mb-2 shadow-[4px_4px_0_rgba(0,0,0,1)] ${plant.bg}`}>
                        <div className={`absolute inset-0 rounded-full ${plant.glow} blur-xl ${isFull ? 'animate-pulse' : ''}`} />
                        <span 
                          className={`text-4xl md:text-5xl relative z-10 select-none ${isFull ? 'scale-110' : ''}`}
                          style={{ animation: state.isWatering ? 'plantBob 0.4s ease-in-out 3' : 'none' }}
                        >
                          {emoji}
                        </span>
                        {/* Water drops animation */}
                        {state.isWatering && (
                          <>
                            <span className="absolute -top-1 left-1/4 text-lg pointer-events-none" style={{ animation: 'waterDrop 0.6s ease-out infinite' }}>💧</span>
                            <span className="absolute -top-1 left-1/2 text-lg pointer-events-none" style={{ animation: 'waterDrop 0.7s ease-out infinite 0.2s' }}>💧</span>
                            <span className="absolute -top-1 left-3/4 text-lg pointer-events-none" style={{ animation: 'waterDrop 0.5s ease-out infinite 0.4s' }}>💧</span>
                          </>
                        )}
                        {/* Sparkle burst on water */}
                        {state.isWatering && (
                          <div className="absolute inset-0 pointer-events-none" key={`sparkle-${sparkleKey}-${plant.key}`}>
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                              <span
                                key={i}
                                className="absolute text-xs"
                                style={{
                                  left: `${30 + Math.random() * 40}%`,
                                  top: `${30 + Math.random() * 40}%`,
                                  '--sx': `${-40 + Math.random() * 80}px`,
                                  '--sy': `-${20 + Math.random() * 50}px`,
                                  animation: `sparkleBurst ${0.5 + Math.random() * 0.4}s ease-out forwards`,
                                  animationDelay: `${i * 0.04}s`,
                                }}
                              >
                                {['✨', '💫', '⭐', '🌟'][i % 4]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Plant Name Badge */}
                      <div className={`${COMIC_BADGE} mb-2 transform rotate-1`}>
                        {plant.name}
                      </div>

                      {/* Growth stage label */}
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        {state.waters === 0 ? 'Seedling' : state.waters < 3 ? 'Sprouting' : 'Blooming'}
                      </p>

                      {/* Speech Bubble */}
                      {state.dialogue && (
                        <div className="w-full mb-3 relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="bg-white border-[3px] border-black rounded-2xl p-3 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                            <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-2xl pointer-events-none" />
                            <p className="text-xs text-slate-800 font-black uppercase italic leading-snug relative z-10 text-center">
                              "{state.dialogue}"
                            </p>
                          </div>
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t-[3px] border-l-[3px] border-black rotate-45" />
                        </div>
                      )}

                      {/* Heart float after dialogue */}
                      {state.dialogue && !state.isWatering && (
                        <span
                          className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl pointer-events-none z-20"
                          style={{ animation: 'heartFloat 3s ease-out forwards' }}
                        >
                          ❤️
                        </span>
                      )}

                      {/* Water Button */}
                      <button
                        onClick={() => handleWaterPlant(plant.key, plant.name)}
                        disabled={!canWater}
                        className={`${BUTTON_PRIMARY} w-full py-4 flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:translate-y-0 disabled:cursor-not-allowed text-sm`}
                      >
                        <span className="text-lg">
                          {state.isWatering ? '⏳' : '💧'}
                        </span>
                        <span>{state.isWatering ? 'Watering...' : isFull ? 'Full for Today' : 'Water Me'}</span>
                      </button>

                      {/* Water dots indicator */}
                      <div className="flex items-center gap-1.5 mt-3">
                        {[0, 1, 2].map(i => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 border-black transition-colors ${i < state.waters ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        ))}
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-1">{state.waters}/3</span>
                      </div>
                    </div>

                      {/* Bloom celebration overlay */}
                      {bloomCelebration === plant.key && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/90 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
                          <div className="text-center px-4 transform -rotate-1">
                            <div className="text-5xl mb-2">🌼</div>
                            <p className="text-sm font-black text-emerald-700 uppercase italic">Fully Bloomed!</p>
                            <p className="text-[9px] text-emerald-600 mt-1 font-bold">Your care brought this to life</p>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Oasis Harmony Message (all 3 plants bloomed) ── */}
          {showHarmony && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-in fade-in duration-500 px-4">
              <div className="bg-white border-[4px] border-emerald-400 rounded-2xl shadow-[8px_8px_0_rgba(0,0,0,1)] p-6 max-w-sm mx-4 transform -rotate-1 relative">
                <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-2xl pointer-events-none" />
                <div className="relative z-10 text-center">
                  <div className="text-4xl mb-3 animate-bounce">🌿🌻🌸</div>
                  <p className="text-sm font-black text-slate-800 uppercase italic leading-relaxed">
                    "{HARMONY_MESSAGE}"
                  </p>
                  <button
                    onClick={() => setShowHarmony(false)}
                    className={`${COMIC_BADGE} mt-4 inline-block hover:bg-emerald-50 cursor-pointer transition-colors`}
                  >
                    ✨ Cherish the Moment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Secondary Actions ── */}
          <div className="garden-fade-7 w-full flex flex-col items-center gap-2 mt-4">
            {(profile || totalAnswered > 0) && (
              <button
                onClick={() => openProfile('dashboard')}
                className={`${BUTTON_GHOST} flex items-center gap-2 px-4 py-2`}
              >
                <User size={12} />
                <span className="text-[10px]">View Oasis Profile</span>
              </button>
            )}
            <button onClick={handleClose} className="text-[10px] text-slate-500 hover:text-slate-700 uppercase font-bold tracking-wider transition-colors">
              Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Full Reflection Story View ──
  if (phase === 'reflection') {
    const story = player?.gardenReflectionStory;
    return (
      <div key={transitionKey} className={`flex flex-col h-full overflow-y-auto ${getTransitionClass(prevPhase, 'reflection')}`}>
        <Header title="OASIS ORACLE" npcNum={OASIS_SAGE_NPC} onClose={handleClose} />
        <BattleParticles ref={particlesRef} />

        <div className="p-4 md:p-6">
          {/* Dashboard breadcrumb */}
          <div className="mb-4">
            <button
              onClick={() => navigateTo('dashboard')}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-wider transition-colors group"
              title="Back to Oasis Dashboard"
            >
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
              Dashboard
            </button>
          </div>

          {/* Story Card */}
          <div className={`${COMIC_CARD} p-6 md:p-8 mb-6 transform -rotate-1`}>
            <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-2xl pointer-events-none" />
            {/* Warm ambient glow */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: 'inset 0 0 80px rgba(16,185,129,0.08)' }} />
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📖</span>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider" style={{ fontFamily: "'Bungee', cursive" }}>
                      Today's Reflection
                    </h2>
                    <p className="text-[11px] text-emerald-700 font-black uppercase italic tracking-wide mt-0.5">
                      "{story?.title || 'A Story from the Garden'}"
                    </p>
                  </div>
                </div>
                <span className={`${COMIC_BADGE} transform rotate-2`}>🌅 {story?.generatedAt ? new Date(story.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}</span>
              </div>

              {/* Decorative rule */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 border-t-2 border-dashed border-emerald-200" />
                <span className="text-emerald-400 text-xs">🌿 ✨ 🌿</span>
                <div className="flex-1 border-t-2 border-dashed border-emerald-200" />
              </div>

              {/* Story text */}
              <div className="bg-gradient-to-b from-emerald-50/30 to-white rounded-xl p-5 md:p-6">
                <p className="text-sm md:text-base text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                  <span className="float-left text-5xl font-black text-emerald-600 leading-[0.8] mr-3 pt-1" style={{ fontFamily: "'Bungee', cursive" }}>{(story?.story || 'T')[0]}</span>
                  {(story?.story || 'The garden is quiet today. Come back soon for a new story woven from the threads of light and root.').slice(1)}
                </p>
              </div>

              {/* Bottom action */}
              <div className="mt-6 flex items-center justify-center">
                <button
                  onClick={() => navigateTo('dashboard')}
                  className={`${BUTTON_GHOST} flex items-center gap-2 px-4 py-2`}
                >
                  <ArrowLeft size={14} />
                  <span className="text-[10px]">Return to Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Share Story */}
          <div className="mb-4 flex justify-center">
            <SocialShare
              shareText={`📖 "${story?.title || 'An Oasis Tale'}" — today's Oasis Oracle story in Dungeons With Gems. The oasis thrives when we thrive together. 🌿\n\nmetaverse.dungeonswithgems.quest`}
              variant="inline"
              hashtags="DungeonsWithGems,Base,Web3Gaming"
            />
          </div>

          {/* Persona Banner */}
          <div className="mt-4">
            <TalkingNPC
              npcIndex={OASIS_SAGE_NPC}
              name="OASIS SAGE"
              dialogue="I hope this story warmed your heart, wanderer. The oasis tells a new tale each day."
              accentColor="bg-emerald-500"
              isTalking={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // No questions available (from quiz phase, should rarely happen)
  if (sessionQuestions.length === 0) {
    return (
      <div key={transitionKey} className={`flex flex-col items-center justify-center min-h-[400px] p-6 text-center ${getTransitionClass(prevPhase, 'dashboard')}`}>
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full border-[3px] border-black overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <CitizenMedia num={OASIS_SAGE_NPC} className="w-full h-full object-cover object-top" />
          </div>
        </div>
        <div className={`${COMIC_CARD} p-6 max-w-sm mb-4 transform -rotate-1`}>
          <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-2xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-xl font-black text-slate-800 uppercase mb-2" style={{ fontFamily: "'Bungee', cursive" }}>Garden Complete</h2>
            <p className="text-sm text-slate-600 italic">You have tended to all available questions. The garden will bloom again soon.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => navigateTo('dashboard')} className={`${BUTTON_PRIMARY} w-full py-4 flex items-center justify-center gap-2`}>
            <span className="text-lg">🔮</span>
            Return to Oracle
          </button>
          <button onClick={handleClose} className={`${BUTTON_SECONDARY} w-full py-3 flex items-center justify-center gap-2`}>
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  // Session complete - show summary
  if (isComplete) {
    return (
      <div key={transitionKey} className={`flex flex-col h-full overflow-y-auto ${getTransitionClass(prevPhase, 'complete')}`}>
        <Header title="OASIS ORACLE" npcNum={OASIS_SAGE_NPC} onClose={handleClose} />
        <BattleParticles ref={particlesRef} />

        <div className="p-4 md:p-6">
          {/* Profile Card */}
          <div className={`${COMIC_CARD} p-6 mb-6 transform -rotate-1`}>
            <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl border-[3px] border-black overflow-hidden shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  <CitizenMedia num={OASIS_SAGE_NPC} className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-800 uppercase" style={{ fontFamily: "'Bungee', cursive" }}>{sessionSummary.profileTitle}</h2>
                    <span className={`${COMIC_BADGE} text-[7px]`}>New!</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4 italic leading-relaxed">"{sessionSummary.summary}"</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transform rotate-1">
                  <div className={`${COMIC_BADGE} inline-block mb-1`}>Dominant Virtue</div>
                  <div className="text-slate-800 font-bold capitalize">{sessionSummary.dominantVirtue}</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transform -rotate-1">
                  <div className={`${COMIC_BADGE} inline-block mb-1`}>Growth Area</div>
                  <div className="text-slate-800 text-xs">{sessionSummary.growthArea}</div>
                </div>
              </div>
              <div className="mt-4 p-3 border-l-[6px] border-emerald-500 bg-emerald-50/50 rounded-r-xl">
                <p className="text-xs text-emerald-800 italic text-center">"{sessionSummary.gardenMetaphor}"</p>
              </div>
            </div>
          </div>

          {/* Session Harvest */}
          <div className={`${COMIC_CARD_COMPACT} p-4 mb-6 transform rotate-1`}>
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2" style={{ fontFamily: "'Bungee', cursive" }}>
              <span className="text-lg">⚡</span> Session Harvest
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transform -rotate-1">
                <span className="text-lg">⚡</span>
                <span className="text-amber-700 font-black">{sessionResults.filter(r => r.rewardTier === 'premium' || r.rewardTier === 'standard').length}</span>
                <span className="text-[9px] text-amber-600 uppercase font-bold">Sparks</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transform rotate-1">
                <span className="text-lg">🌱</span>
                <span className="text-emerald-700 font-black">{sessionResults.length}</span>
                <span className="text-[9px] text-emerald-600 uppercase font-bold">Reflections</span>
              </div>
            </div>
          </div>

          {/* Share Garden Profile */}
          <div className="mb-6">
            <SocialShare
              shareText={(() => {
                const p = player?.gardenProfile;
                const answered = player?.gardenAnswerHistory?.length || 0;
                const title = p?.profileTitle || 'Oasis Seeker';
                const virtue = p?.dominantVirtue || 'Wisdom';
                return `🌿 ${title}\n✨ ${virtue} · ${answered} reflections in the Oasis Oracle\n\n⚔️ Play DungeonsWithGems: metaverse.dungeonswithgems.quest`;
              })()}
              variant="vertical"
              dividerText="Share Your Oasis"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button onClick={handleReturnToOracle} className={`${BUTTON_PRIMARY} w-full py-4 flex items-center justify-center gap-2`}>
              <span className="text-lg">🔮</span>
              Return to Oracle
            </button>
            <button onClick={handleClose} className={`${BUTTON_SECONDARY} w-full py-3 flex items-center justify-center gap-2`}>
              <span>🌿</span>
              Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question view
  return (
    <div key={transitionKey} className={`flex flex-col h-full overflow-y-auto ${getTransitionClass(prevPhase, 'quiz')}`}>
      {/* Shared Header with Garden Sage NPC */}
      <Header title="OASIS ORACLE" npcNum={OASIS_SAGE_NPC} onClose={handleClose}>
        <div className="flex items-center gap-2">
          {/* PROFILE — player avatar + label */}
          {(player?.gardenProfile || (player?.gardenAnswerHistory?.length > 0)) && (
            <button
              onClick={() => openProfile('quiz')}
              className="flex items-center gap-1.5 bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all active:translate-y-0 active:shadow-[2px_2px_0_rgba(0,0,0,1)] px-2.5 py-1.5 group"
              title="View Oasis Profile"
            >
              <div className="w-8 h-8 rounded-lg border-[2px] border-black overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)] shrink-0 bg-emerald-100 group-hover:border-emerald-500 transition-colors">
                <AvatarMedia num={player.avatar || 1} animated={false} className="w-full h-full object-cover object-top" />
              </div>
              <span className="text-[11px] font-black uppercase italic text-slate-800 tracking-wider group-hover:text-emerald-700 transition-colors" style={{ fontFamily: "'Bungee', cursive" }}>
                PROFILE
              </span>
            </button>
          )}

          {/* Farcaster Share */}
          <button
            onClick={shareFarcaster}
            title="Share on Farcaster"
            className="flex items-center gap-1.5 bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all active:translate-y-0 active:shadow-[2px_2px_0_rgba(0,0,0,1)] px-2.5 py-1.5 group"
          >
            <span className="text-sm">🟣</span>
            <span className="text-[11px] font-black uppercase italic text-purple-700 tracking-wider group-hover:text-purple-900 transition-colors" style={{ fontFamily: "'Bungee', cursive" }}>
              FC
            </span>
          </button>

          {/* X Share */}
          <button
            onClick={shareX}
            title="Share on X"
            className="flex items-center gap-1.5 bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all active:translate-y-0 active:shadow-[2px_2px_0_rgba(0,0,0,1)] px-2.5 py-1.5 group"
          >
            <span className="text-sm">𝕏</span>
            <span className="text-[11px] font-black uppercase italic text-slate-800 tracking-wider group-hover:text-zinc-600 transition-colors" style={{ fontFamily: "'Bungee', cursive" }}>
              X
            </span>
          </button>
        </div>
      </Header>

      {/* Particle overlay */}
      <BattleParticles ref={particlesRef} />

      <div className="p-4 md:p-6">
        {/* Dashboard breadcrumb — back to Oracle home */}
        <div className="mb-3">
          <button
            onClick={() => navigateTo('dashboard')}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-wider transition-colors group"
            title="Back to Oasis Dashboard"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
            Dashboard
          </button>
        </div>

        {/* Emoji Progress Bar */}
        <div className="flex gap-0.5 mb-4 justify-center">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <span key={i} className={`text-sm transition-all duration-300 ${i < currentIdx + (selectedOption ? 1 : 0) ? 'opacity-100 scale-110' : 'opacity-20'}`}>
              {i < currentIdx + (selectedOption ? 1 : 0) ? '🌿' : '🌑'}
            </span>
          ))}
        </div>

        {currentQuestion && (
          <>
            {/* AI Reflection & Rewards — full-focus panel after answering */}
            {selectedOption && reflection && (
              <div className={`${COMIC_CARD} p-6 mb-6 transform -rotate-1 animate-in fade-in zoom-in-95 duration-500`} style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)' }}>
                <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-2xl pointer-events-none" />
                <div className="relative">
                  {/* Reflection with Sage portrait */}
                  <div className="mb-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl border-[3px] border-black overflow-hidden shadow-[3px_3px_0_rgba(0,0,0,1)]">
                        <CitizenMedia num={OASIS_SAGE_NPC} className="w-full h-full object-cover object-top" />
                      </div>
                      <div>
                        <span className={`${COMIC_BADGE} inline-block text-[7px]`}>Garden Reflection</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 italic leading-relaxed mb-4">"{reflection.reflection}"</p>
                    <div className="flex flex-col gap-3 bg-emerald-50 rounded-xl p-4 border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transform rotate-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🌿</span>
                        <span className="text-xs text-emerald-800 font-medium">{reflection.virtueInsight}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">✨</span>
                        <span className="text-xs text-emerald-700 italic">"{reflection.gardenWisdom}"</span>
                      </div>
                    </div>
                  </div>

                  {/* Rewards */}
                  {rewardResult?.rewards && rewardResult.rewards.length > 0 && (
                    <div className="pt-4 border-t-2 border-dashed border-black/20 mb-1">
                      <div className={`${COMIC_BADGE} inline-block mb-3`}>Rewards Harvested</div>
                      <div className="flex flex-wrap gap-2">
                        {rewardResult.rewards.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-[2px] border-black shadow-[2px_2px_0_rgba(0,0,0,1)] transform -rotate-1 animate-in zoom-in duration-300" style={{ animationDelay: `${i * 150}ms` }}>
                            <span className="text-lg">{r.icon}</span>
                            <span className="text-xs text-slate-700 font-bold">{r.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Button */}
                  <button
                    onClick={handleNext}
                    disabled={isAnalyzing}
                    className={`${BUTTON_PRIMARY} w-full mt-5 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        {isLastQuestion ? 'View Oasis Profile' : 'Next Question'}
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── AGC Loading State: Anime-Comic-Game reflecting ── */}
            {selectedOption && !reflection && (
              <div className={`${COMIC_CARD} p-6 mb-6 flex flex-col items-center justify-center gap-5 transform rotate-1 overflow-hidden`}
                style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 50%, #faf5ff 100%)' }}>
                {/* Halftone overlay */}
                <div style={HALFTONE_STYLE} className="absolute inset-0 rounded-2xl pointer-events-none" />
                {/* Scan line */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none opacity-[0.06]">
                  <div className="absolute inset-x-0 h-[2px] bg-emerald-600" style={{ animation: 'agcScanLine 2s linear infinite' }} />
                </div>

                {/* ── Floating sparkle field (magical dust) ── */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" style={{ zIndex: 1 }}>
                  {[
                    { x: '10%', delay: '0s', col: '#10b981', size: 3 },
                    { x: '25%', delay: '0.6s', col: '#06b6d4', size: 2 },
                    { x: '40%', delay: '1.2s', col: '#a855f7', size: 4 },
                    { x: '55%', delay: '0.3s', col: '#ec4899', size: 2 },
                    { x: '70%', delay: '0.9s', col: '#f59e0b', size: 3 },
                    { x: '85%', delay: '1.5s', col: '#10b981', size: 2 },
                    { x: '18%', delay: '2.0s', col: '#06b6d4', size: 3 },
                    { x: '48%', delay: '1.7s', col: '#a855f7', size: 2 },
                    { x: '63%', delay: '2.3s', col: '#ec4899', size: 4 },
                    { x: '92%', delay: '0.4s', col: '#f59e0b', size: 2 },
                  ].map((s, i) => (
                    <div key={i} className="absolute rounded-full"
                      style={{
                        left: s.x, bottom: '-12px',
                        width: s.size, height: s.size,
                        background: s.col,
                        opacity: 0,
                        animation: `agcSparkleFloat 3s ease-out infinite`,
                        animationDelay: s.delay,
                        boxShadow: `0 0 ${s.size * 3}px ${s.col}`,
                      }}
                    />
                  ))}
                </div>

                {/* ── Portrait + speed‑line rings + orbiting emojis ── */}
                <div className="relative w-32 h-32 flex items-center justify-center" style={{ zIndex: 2 }}>
                  {/* Ripple pulses emanating from portrait */}
                  {[0, 1, 2].map(i => (
                    <div key={`ripple-${i}`} className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
                      style={{
                        animation: `agcRipplePulse 2s ease-out infinite`,
                        animationDelay: `${i * 0.6}s`
                      }}
                    />
                  ))}

                  {/* Speed‑line rings (comic action lines) */}
                  <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-emerald-500/35"
                    style={{ animation: 'agcSpinCW 8s linear infinite' }} />
                  <div className="absolute inset-2 rounded-full border-[2px] border-dashed border-cyan-500/25"
                    style={{ animation: 'agcSpinCCW 6s linear infinite' }} />
                  <div className="absolute inset-4 rounded-full border-2 border-dashed border-purple-500/20"
                    style={{ animation: 'agcSpinCW 4.5s linear infinite' }} />
                  {/* Inner speed dashes */}
                  <div className="absolute inset-6 rounded-full border-[2px] border-dashed border-pink-400/15"
                    style={{ animation: 'agcSpinCCW 3.5s linear infinite' }} />

                  {/* Sage portrait with neon glow */}
                  <div className="relative z-10 w-16 h-16 rounded-2xl border-[4px] border-black overflow-hidden shadow-[6px_6px_0_rgba(0,0,0,1)]"
                    style={{ animation: 'oracleGlow 2s ease-in-out infinite, agcFloatBob 3s ease-in-out infinite' }}>
                    <CitizenMedia num={OASIS_SAGE_NPC} className="w-full h-full object-cover object-top" />
                  </div>

                  {/* Orbiting emoji particles */}
                  {[
                    { e: '🌿', kf: 'orbit1', dur: '6s', delay: '0s' },
                    { e: '✨', kf: 'orbit2', dur: '8s', delay: '0.3s' },
                    { e: '🔮', kf: 'orbit3', dur: '7s', delay: '0.6s' },
                    { e: '💎', kf: 'orbit1', dur: '7.5s', rev: true, delay: '0.9s' },
                    { e: '🌱', kf: 'orbit2', dur: '9s', rev: true, delay: '1.2s' },
                    { e: '🌍', kf: 'orbit3', dur: '5.5s', rev: true, delay: '1.5s' },
                  ].map((o, i) => (
                    <div key={i} className="absolute pointer-events-none"
                      style={{
                        top: '50%', left: '50%', width: 0, height: 0,
                        animation: `${o.kf} ${o.dur} linear infinite${o.rev ? ' reverse' : ''}`
                      }}>
                      <span
                        className="text-sm absolute inline-block"
                        style={{
                          transform: 'translate(-50%, -50%)',
                          animation: `agcOrbitTwinkle 2s ease-in-out infinite`,
                          animationDelay: o.delay
                        }}
                      >{o.e}</span>
                    </div>
                  ))}
                </div>

                {/* ── Neon title with shimmer ── */}
                <div className="text-center" style={{ zIndex: 2 }}>
                  <p
                    className="text-xs md:text-sm font-black uppercase italic tracking-widest"
                    style={{
                      fontFamily: "'Bungee', cursive",
                      background: 'linear-gradient(90deg, #059669, #0891b2, #7c3aed, #db2777, #d97706, #059669)',
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: 'agcTitleShimmer 3s linear infinite, agcNeonPulse 2s ease-in-out infinite',
                      filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4)) drop-shadow(0 0 16px rgba(6,182,212,0.2))',
                    }}
                  >
                    <span className="text-amber-500" style={{ WebkitTextFillColor: '#f59e0b' }}>⚡</span> Garden Is Reflecting <span className="text-cyan-500" style={{ WebkitTextFillColor: '#06b6d4' }}>⚡</span>
                  </p>
                </div>

                {/* ── Comic loading bar (neon rainbow shimmer) ── */}
                <div className="w-full max-w-[220px]" style={{ zIndex: 2 }}>
                  <div className="h-3 bg-white border-[2px] border-black rounded-full overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <div className="h-full w-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #10b981, #06b6d4, #a855f7, #ec4899, #f59e0b, #10b981)',
                        backgroundSize: '200% 100%',
                        animation: 'agcBarShimmer 1.5s linear infinite'
                      }}
                    />
                  </div>
                </div>

                {/* ── Thinking dots (bouncing) ── */}
                <div className="flex gap-2" style={{ zIndex: 2 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black/30 shadow-[1px_1px_0_rgba(0,0,0,0.5)]"
                      style={{ animation: `agcDotPulse 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Question Panel — visible only before answering */}
            {!selectedOption && (
              <>
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`${COMIC_BADGE} transform -rotate-2`}>
                    {CATEGORY_ICONS[currentQuestion.category] || '🌱'} {currentQuestion.category}
                  </span>
                </div>

                {/* Scenario Card */}
                <div className={`${COMIC_CARD} bg-[#fdfaf5] p-5 mb-6`}>
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 rounded-t-2xl border-b-[2px] border-black"></div>
                  <div className="flex gap-4 items-start relative pt-2">
                    <p className="text-sm text-slate-700 leading-relaxed italic flex-1">"{currentQuestion.scenario}"</p>
                    {/* Monster portrait */}
                    {monsterImgSrc && !monsterImgError && (
                      <div className="shrink-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-[3px] border-black overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)]">
                          <img
                            src={monsterImgSrc}
                            alt={monsterInfo.name}
                            className="w-full h-full object-cover"
                            onError={() => setMonsterImgError(true)}
                          />
                        </div>
                        <p className="text-[7px] text-slate-500 text-center mt-1 uppercase tracking-wider font-bold truncate max-w-[5rem]">{monsterInfo.name}</p>
                      </div>
                    )}
                    {/* Fallback icon if monster image fails */}
                    {monsterImgSrc && monsterImgError && (
                      <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center text-2xl">
                        {CATEGORY_ICONS[currentQuestion.category] || '🌱'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {getShuffledOptions(currentQuestion).map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(option)}
                      className={`${COMIC_CARD_COMPACT} p-4 text-left transform transition-all hover:-translate-y-1 hover:border-emerald-500 hover:bg-emerald-50/50`}
                    >
                      <div className="flex items-start gap-3 relative">
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-black border-[2px] border-black flex items-center justify-center text-[10px] font-black shrink-0 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-xs text-slate-700 font-medium">{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Persona Banner — Garden Sage NPC (bottom anchor) */}
        {!selectedOption && currentQuestion && (
          <div className="mt-4">
            <TalkingNPC
              npcIndex={OASIS_SAGE_NPC}
              name="OASIS SAGE"
              dialogue={greeting}
              accentColor="bg-emerald-500"
              isTalking={true}
            />
          </div>
        )}
      </div>
    </div>
  );
});
