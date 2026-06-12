import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronRight, Leaf, Sparkles, Flower2, TreePine, Sprout, Sun } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useGardenAI } from '../hooks/useGardenAI';
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

const TIER_LABELS = {
  premium: { label: 'PREMIUM', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  standard: { label: 'STANDARD', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  basic: { label: 'BASIC', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  minimal: { label: 'MINIMAL', color: 'text-slate-600', bg: 'bg-slate-800/20' },
};

export const GardenOSView = React.memo(() => {
  const { player, adventure, actions, FOODS, addLog } = useGame();
  const { setView } = adventure;

  // Garden AI hook
  const { generateReflection, generateSessionSummary, resetSession, isAnalyzing, aiCallsRemaining } = useGardenAI();

  // Session state
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [reflection, setReflection] = useState(null);
  const [rewardResult, setRewardResult] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [greeting] = useState(() => {
    const greetings = [
      "Welcome, grower. The garden has been waiting for you.",
      "Every choice plants a seed. What will you grow today?",
      "The garden grows when we grow together. Let's begin.",
      "Step into the garden. Your roots run deeper than you know.",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  });

  // Initialize session: pick 5 questions not yet completed
  useEffect(() => {
    resetSession();
    const completed = new Set(player?.gardenCompletedIds || []);
    const available = QUESTIONS.filter(q => !completed.has(q.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    setSessionQuestions(shuffled.slice(0, QUESTIONS_PER_SESSION));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQuestion = sessionQuestions[currentIdx];
  const isLastQuestion = currentIdx === QUESTIONS_PER_SESSION - 1;
  const progress = `${Math.min(currentIdx + 1, QUESTIONS_PER_SESSION)}/${QUESTIONS_PER_SESSION}`;

  // Handle option selection
  const handleSelectOption = useCallback(async (option) => {
    if (selectedOption) return; // Already answered
    setSelectedOption(option);

    // Deliver rewards via action
    const result = await actions.completeGardenQuestion(currentQuestion.id, option.rewardTier, FOODS);
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
  }, [selectedOption, currentQuestion, actions, FOODS, player, generateReflection]);

  // Proceed to next question or finish session
  const handleNext = useCallback(async () => {
    if (isLastQuestion) {
      // Generate session summary
      const summary = await generateSessionSummary([...sessionResults, {
        category: currentQuestion.category,
        chosenVirtue: selectedOption.virtue,
        rewardTier: selectedOption.rewardTier,
      }]);
      setSessionSummary(summary || {
        profileTitle: 'The Growing Seed',
        summary: 'Your garden journey has just begun. Every choice you made shows potential for growth.',
        dominantVirtue: 'curiosity',
        growthArea: 'Continue exploring different virtues to strengthen your roots.',
        gardenMetaphor: 'Like a seed in spring, your character is beginning to bloom.',
      });
      setIsComplete(true);
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setReflection(null);
      setRewardResult(null);
    }
  }, [isLastQuestion, sessionResults, currentQuestion, selectedOption, generateSessionSummary]);

  // Close view
  const handleClose = () => setView('menu');

  // No questions available
  if (sessionQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <Flower2 size={64} className="text-emerald-400 mb-4 animate-pulse" />
        <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-wider mb-2">Garden Complete</h2>
        <p className="text-slate-400 mb-6">You have tended to all available questions. The garden will bloom again soon.</p>
        <button onClick={handleClose} className="px-6 py-3 bg-emerald-500 text-black font-black uppercase rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
          Return to Menu
        </button>
      </div>
    );
  }

  // Session complete - show summary
  if (isComplete) {
    return (
      <div className="flex flex-col h-full p-4 md:p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
              <Flower2 size={24} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-400 uppercase tracking-wider">Garden Profile</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Session Complete</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 bg-black border-2 border-slate-700 rounded-lg hover:border-red-500 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border-[3px] border-emerald-500/50 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <TreePine size={20} className="text-emerald-400" />
              <h2 className="text-lg font-black text-emerald-300 uppercase">{sessionSummary.profileTitle}</h2>
            </div>
            <p className="text-sm text-slate-300 mb-4 italic">"{sessionSummary.summary}"</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 rounded-xl p-3 border border-emerald-500/30">
                <div className="text-[9px] text-emerald-500 uppercase font-black tracking-wider mb-1">Dominant Virtue</div>
                <div className="text-white font-bold capitalize">{sessionSummary.dominantVirtue}</div>
              </div>
              <div className="bg-black/40 rounded-xl p-3 border border-emerald-500/30">
                <div className="text-[9px] text-emerald-500 uppercase font-black tracking-wider mb-1">Growth Area</div>
                <div className="text-white text-xs">{sessionSummary.growthArea}</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <p className="text-xs text-emerald-300 italic text-center">"{sessionSummary.gardenMetaphor}"</p>
            </div>
          </div>
        </div>

        {/* Session Loot */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" /> Session Harvest
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-amber-500/30">
              <span className="text-lg">⚡</span>
              <span className="text-amber-400 font-black">{sessionResults.filter(r => r.rewardTier === 'premium' || r.rewardTier === 'standard').length}</span>
              <span className="text-[10px] text-slate-500 uppercase">Sparks</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-emerald-500/30">
              <span className="text-lg">🌱</span>
              <span className="text-emerald-400 font-black">{sessionResults.length}</span>
              <span className="text-[10px] text-slate-500 uppercase">Reflections</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button onClick={handleClose} className="w-full py-4 bg-emerald-500 text-black font-black uppercase rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
          <Leaf size={18} />
          Return to Garden
        </button>
      </div>
    );
  }

  // Question view
  return (
    <div className="flex flex-col h-full p-4 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center border-[3px] border-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
            <Flower2 size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-lg font-black text-emerald-400 uppercase tracking-wider">Garden OS</h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Question {progress}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-black/60 rounded border border-emerald-500/30">
            <span className="text-[9px] text-emerald-400 font-bold">AI: {aiCallsRemaining}</span>
          </div>
          <button onClick={handleClose} className="p-2 bg-black border-2 border-slate-700 rounded-lg hover:border-red-500 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-500"
          style={{ width: `${((currentIdx + (selectedOption ? 1 : 0)) / QUESTIONS_PER_SESSION) * 100}%` }}
        />
      </div>

      {/* Persona Banner */}
      {!selectedOption && (
        <div className="bg-gradient-to-r from-emerald-900/30 to-slate-900 border border-emerald-500/30 rounded-xl p-4 mb-6 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/50">
              <Sprout size={20} className="text-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-emerald-300 italic">"{greeting}"</p>
              <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">— Garden OS</p>
            </div>
          </div>
        </div>
      )}

      {currentQuestion && (
        <>
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full border-2 text-[10px] font-black uppercase tracking-wider ${CATEGORY_COLORS[currentQuestion.category] || 'border-slate-500 bg-slate-500/10'}`}>
              {CATEGORY_ICONS[currentQuestion.category] || '🌱'} {currentQuestion.category}
            </span>
          </div>

          {/* Scenario Card */}
          <div className="bg-slate-900 border-[3px] border-slate-700 rounded-2xl p-5 mb-6 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 rounded-t-2xl"></div>
            <p className="text-sm text-slate-200 leading-relaxed italic">"{currentQuestion.scenario}"</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {currentQuestion.options.map((option, i) => {
              const isSelected = selectedOption === option;
              const isDisabled = selectedOption !== null;

              let btnClass = "bg-slate-800 border-slate-600 hover:border-emerald-400 hover:bg-slate-700";
              if (isSelected) {
                btnClass = "bg-emerald-900/50 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
              } else if (isDisabled) {
                btnClass = "bg-slate-900 border-slate-800 opacity-40";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelectOption(option)}
                  disabled={isDisabled}
                  className={`group w-full p-4 text-left border-[3px] rounded-xl transition-all ${btnClass}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-xs text-slate-200 font-medium">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reflection & Rewards */}
          {selectedOption && reflection && (
            <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900 border-[3px] border-emerald-500/50 rounded-2xl p-5 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Reflection */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sun size={16} className="text-amber-400" />
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Garden Reflection</span>
                </div>
                <p className="text-sm text-slate-200 italic mb-3">"{reflection.reflection}"</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Leaf size={14} className="text-emerald-400" />
                    <span className="text-xs text-emerald-300">{reflection.virtueInsight}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-lime-400" />
                    <span className="text-xs text-lime-300 italic">"{reflection.gardenWisdom}"</span>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              {rewardResult?.rewards && rewardResult.rewards.length > 0 && (
                <div className="pt-4 border-t border-emerald-500/30">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2">Rewards Harvested</div>
                  <div className="flex flex-wrap gap-2">
                    {rewardResult.rewards.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-amber-500/30 animate-in zoom-in duration-300" style={{ animationDelay: `${i * 150}ms` }}>
                        <span className="text-lg">{r.icon}</span>
                        <span className="text-xs text-amber-300 font-bold">{r.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={isAnalyzing}
                className="w-full mt-4 py-3 bg-emerald-500 text-black font-black uppercase rounded-xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    {isLastQuestion ? 'View Garden Profile' : 'Next Question'}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Loading state while waiting for reflection */}
          {selectedOption && !reflection && (
            <div className="bg-slate-900/50 border border-emerald-500/30 rounded-xl p-6 flex items-center justify-center gap-3 animate-pulse">
              <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
              <span className="text-sm text-emerald-400">The garden is reflecting...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
});
