import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, CheckCircle, AlertCircle, BookOpen, Brain, Sparkles, Zap, Award, Star, Trophy, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Header, AvatarMedia } from './GameUI';
import { NPCCard as AmbientNPCCard } from './NPCCard';
import { ComicQuestCard, ComicQuestModal, TalkingNPC } from './SharedQuestUI';
import { useGame } from '../contexts/GameContext';
import QUIZZES from '../data/quizzes.json';

const TOPIC_STYLES = {
  Math: { tape: 'bg-blue-400', accent: 'text-blue-500', bg: 'bg-blue-50', icon: '🧮' },
  Science: { tape: 'bg-pink-400', accent: 'text-pink-500', bg: 'bg-pink-50', icon: '🔬' },
  Tech: { tape: 'bg-cyan-400', accent: 'text-cyan-500', bg: 'bg-cyan-50', icon: '💻' },
  Web3: { tape: 'bg-purple-400', accent: 'text-purple-500', bg: 'bg-purple-50', icon: '🌐' },
  Trivia: { tape: 'bg-amber-400', accent: 'text-amber-500', bg: 'bg-amber-50', icon: '❓' },
};

// --- Quiz Modal ---
const QuizModal = ({ quiz, onClose, onComplete }) => {
  const { player } = useGame();
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const style = TOPIC_STYLES[quiz.topic] || TOPIC_STYLES.Trivia;

  const handleSelect = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    const correct = idx === quiz.answer;
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setTimeout(() => onComplete(quiz, true), 1500);
    } else {
      setTimeout(() => onClose(), 2000);
    }
  };

  return (
    <ComicQuestModal
      isOpen={true}
      onClose={onClose}
      npcIndex={quiz.npcIndex}
      npcName={`Instructor ${quiz.npcIndex}`}
      dialogue={quiz.question}
      title={`NEURAL_SYNC: ${quiz.topic}`}
      accentColor={style.tape}
    >
      <div className="grid grid-cols-1 gap-3 relative z-10">
        {quiz.options.map((opt, i) => {
          let btnStyle = "bg-white border-black text-black hover:bg-slate-100 hover:-translate-y-0.5";
          if (isAnswered) {
            if (i === quiz.answer) btnStyle = "bg-emerald-500 border-black text-black scale-95 shadow-none";
            else if (i === selectedOption) btnStyle = "bg-red-500 border-black text-black scale-95 shadow-none";
            else btnStyle = "bg-white border-black text-black opacity-30 shadow-none grayscale";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isAnswered}
              className={`group w-full p-4 text-left border-[3px] rounded-2xl font-black uppercase italic text-xs transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none ${btnStyle}`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-black text-white flex items-center justify-center text-[10px] group-hover:scale-110 transition-transform">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </span>
                {isAnswered && i === quiz.answer && <CheckCircle size={20} className="animate-in zoom-in" />}
                {isAnswered && i === selectedOption && i !== quiz.answer && <X size={20} className="animate-in zoom-in" />}
              </div>
            </button>
          );
        })}
      </div>
      
      {!player?.walletAddress && (
        <div className="mt-4 bg-amber-500/10 border-[3px] border-amber-500/30 p-3 rounded-2xl flex items-center gap-3 animate-pulse relative z-10">
           <div className="bg-amber-500 p-1.5 rounded-lg border-2 border-black text-black shrink-0">
              <AlertCircle size={16} />
           </div>
           <div className="flex-1">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">NODE_UPLINK_OFFLINE</p>
              <p className="text-[10px] font-bold text-black uppercase leading-tight italic">
                Uplink required to authorize ETH subsidies. Link your node in Identity Core to claim rewards.
              </p>
           </div>
        </div>
      )}

      {isAnswered && (
        <div className={`mt-6 p-4 rounded-2xl border-[3px] text-center animate-in slide-in-from-bottom-4 duration-300 relative z-10 ${isCorrect ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-red-100 border-red-500 text-red-800'}`}>
          <div className="flex items-center justify-center gap-3">
            {isCorrect ? <Sparkles size={24} /> : <AlertCircle size={24} />}
            <p className="text-sm font-black uppercase tracking-widest italic">
              {isCorrect ? `SYNC SUCCESS: +${quiz.xpReward} XP LOGGED` : 'SYNC FAILED: NEURAL LINK SEVERED'}
            </p>
          </div>
        </div>
      )}
    </ComicQuestModal>
  );
};

// --- Quiz Card ---
const QuizCard = ({ quiz, onOpen, isCompleted }) => {
  const style = TOPIC_STYLES[quiz.topic] || TOPIC_STYLES.Trivia;

  return (
    <ComicQuestCard
      npcIndex={quiz.npcIndex}
      title={`Instructor ${quiz.npcIndex}`}
      subtitle={`"${quiz.question.slice(0, 80)}..."`}
      badge={quiz.topic}
      accentColor={style.tape}
      onClick={() => !isCompleted && onOpen(quiz)}
      isCompleted={isCompleted}
      footer={
        <div className="flex items-center gap-1 text-cyan-600">
          <Star size={12} className="fill-cyan-500" />
          <span className="text-[10px] font-black tabular-nums">+{quiz.xpReward} XP</span>
        </div>
      }
    />
  );
};



export const ILearnView = React.memo(() => {
  const { player, syncPlayer, adventure, actions, audio, SOUNDS, ITEMS, FOODS, CRYSTLE_RECIPES, faucetResult, setFaucetResult } = useGame();
  const { setView } = adventure;
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [sessionReward, setSessionReward] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const quizSlots = player?.quizSlots || [];
  const completedQuizzes = player?.completedQuizzes || {};

  // Find actual quiz objects for active slots, excluding already-completed quizzes
  const activeQuizzes = useMemo(() => {
    return quizSlots
      .filter(id => !completedQuizzes[id])
      .map(id => QUIZZES.find(q => q.id === id))
      .filter(Boolean);
  }, [quizSlots, completedQuizzes]);

  // Legacy Sanity Check removed to support infinite repeatable cycles.

  // Handle slot initialization and refill
  useEffect(() => {
    if (!player) return;

    // Initial setup if slots are empty
    if (quizSlots.length === 0) {
      const initial = [...QUIZZES].sort(() => Math.random() - 0.5).slice(0, 10).map(q => q.id);
      if (initial.length > 0) syncPlayer({ quizSlots: initial });
      return;
    }

    // Refill logic: if under 10 slots, pick fresh quizzes not yet completed
    if (quizSlots.length < 10) {
      const available = QUIZZES.filter(q => !quizSlots.includes(q.id) && !completedQuizzes[q.id]);
      if (available.length > 0) {
        const needed = 10 - quizSlots.length;
        const picks = [...available].sort(() => Math.random() - 0.5).slice(0, needed).map(q => q.id);
        syncPlayer({ quizSlots: [...quizSlots, ...picks] });
      }
    }
  }, [quizSlots.length, player, completedQuizzes]);

  const triggerConfetti = useCallback(() => {
    const end = Date.now() + 3000;
    const colors = ['#06b6d4', '#f59e0b', '#10b981', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        zIndex: 10002
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        zIndex: 10002
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  const handleComplete = async (quiz, isCorrect) => {
    if (isCorrect) {
      setActiveQuiz(null);
      setIsSyncing(true);
      try {
        const result = await actions.completeQuiz(quiz, true, ITEMS, FOODS, CRYSTLE_RECIPES);
        setSessionReward(result);
        if (result.item) {
          triggerConfetti();
        }
      } catch (e) {
        console.error("iLearn Sync Error:", e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Tech Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <Header
        title="iLEARN Terminal"
        onClose={() => setView('menu')}
        npcNum={22}
      />

      <div className="px-4 pt-4">
        <TalkingNPC
          npcIndex={22}
          name="MASTER INSTRUCTOR"
          accentColor="bg-cyan-500"
          isTalking={true}
          dialogue="Welcome to iLEARN! Train your mind and earn powerful rewards for correct answers. Knowledge is your most scalable stat. Let us begin."
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 relative z-10">
        {/* Intro Section */}
        <div className="bg-cyan-900/20 border-2 border-cyan-500/30 p-4 rounded-2xl relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse">
              <Brain className="text-black" size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-black text-cyan-400 uppercase italic tracking-tighter">Neural Link Training</h2>
              <p className="text-[10px] text-white/60 font-medium uppercase leading-tight tracking-tight mt-0.5">
                Cognitive tasks assigned: {quizSlots.length}. Complete modules to cycle in new training data.
              </p>
            </div>
          </div>
        </div>

        {/* Knowledge Acquisition Modal (Celebratory Burst) */}
        {(isSyncing || sessionReward) && createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-300">
            <div className="max-w-sm w-full bg-slate-900 border-[6px] border-black p-8 relative shadow-[16px_16px_0_rgba(0,0,0,1)] overflow-hidden pointer-events-auto">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

              {isSyncing ? (
                <div className="relative z-10 space-y-6 text-center py-8">
                  <div className="flex items-center justify-center mb-6">
                    <Zap className="animate-spin text-cyan-500" size={64} />
                  </div>
                  <h2 className="text-2xl font-[1000] text-cyan-400 uppercase italic tracking-tighter leading-none animate-pulse">
                    COMMITTING TO ARCHIVE...
                  </h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Securing neural link data
                  </p>
                </div>
              ) : sessionReward && (
                <div className="relative z-10 space-y-6 text-center">
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                    {sessionReward.item ? (
                      <span className="text-6xl relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-bounce font-serif">{sessionReward.item.icon || '📦'}</span>
                    ) : (
                      <Trophy className="text-amber-400 w-16 h-16 animate-bounce relative z-10" />
                    )}
                    <div className="absolute inset-0 border-4 border-dashed border-cyan-400/50 rounded-full animate-spin-slow"></div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-[1000] text-white uppercase italic tracking-tighter leading-none">
                      KNOWLEDGE ACQUISITION
                    </h2>
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] animate-pulse">
                      Rewards Authorized by Master Instructor
                    </p>
                  </div>

                  <div className="bg-black/60 border-[3px] border-white/10 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white italic">+{sessionReward.xp}</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Net_EXP</span>
                      </div>
                      {sessionReward.item && (
                        <>
                          <div className="w-[2px] h-8 bg-white/10"></div>
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-white italic">x{sessionReward.item.qty}</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Quantity</span>
                          </div>
                        </>
                      )}
                    </div>

                    {sessionReward.item && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-[11px] font-black text-white uppercase tracking-tight italic">
                          "{sessionReward.item.name}"
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase opacity-60">
                          Added to Neural Inventory Hub
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSessionReward(null)}
                    className="w-full py-3 bg-cyan-500 text-black font-black text-xs uppercase italic tracking-widest border-[3px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-3"
                  >
                    CLOSE TRANSMISSION <ChevronRight size={16} />
                  </button>
                </div>
              )}

              <div className="absolute top-2 right-2 flex gap-1">
                <div className="w-1.5 h-1.5 bg-cyan-500 animate-ping"></div>
                <div className="w-1.5 h-1.5 bg-slate-700"></div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Quiz Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
          {activeQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onOpen={(q) => { if (!isSyncing && !sessionReward) setActiveQuiz(q); }}
              isCompleted={false}
            />
          ))}

          {activeQuizzes.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-4xl mb-4">🌀</p>
              <h3 className="text-white font-black uppercase italic">Neural Sync Initializing</h3>
              <p className="text-cyan-500 text-[10px] font-bold uppercase mt-2 italic tracking-widest">Awaiting new training data from the Master Instructor...</p>
            </div>
          )}
        </div>
      </div>

      {activeQuiz && (
        <QuizModal
          quiz={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onComplete={handleComplete}
        />
      )}

      {/* --- FAUCET CELEBRATION MODAL --- */}
      {faucetResult && createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm bg-slate-900 border-[4px] border-black rounded-[2.5rem] shadow-[12px_12px_0_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

            <div className="bg-cyan-500 py-3 border-b-[4px] border-black transform -rotate-2 relative z-10 shadow-xl">
              <h2 className="text-2xl font-black text-black text-center uppercase tracking-tighter italic scale-110">TREASURY SIGNAL!</h2>
              <div className="absolute -top-1 -right-4 bg-black text-white px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em] transform rotate-12 border-2 border-white">
                PROTOCOL SECURED
              </div>
            </div>

            <div className="p-8 flex flex-col items-center text-center relative z-10 gap-6 pt-10">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/30 blur-2xl rounded-full scale-110 animate-pulse" />
                <div className="w-28 h-28 bg-black rounded-3xl border-[4px] border-black flex items-center justify-center relative shadow-[6px_6px_0_rgba(6,182,212,1)] transform rotate-3">
                  <Coins size={64} className="text-cyan-400" />
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-cyan-500 rounded-full border-2 border-black flex items-center justify-center animate-bounce">
                    <Sparkles size={20} className="text-black" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-cyan-400/60 uppercase tracking-[0.2em] leading-none mb-1">Crystle Hunter Subsidy</p>
                <h3 className="text-3xl font-black text-white italic tracking-tighter leading-none break-words">
                  {faucetResult.message || "Subsidy Authorized"}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight italic mt-2">"Your neural link has attracted an on-chain faucet reward."</p>
              </div>

              <div className="w-full flex flex-col gap-3 mt-4">
                {faucetResult.txHash && (
                  <a
                    href={`https://basescan.org/tx/${faucetResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 rounded-xl"
                  >
                    VIEW ON BASESCAN <ChevronRight size={14} />
                  </a>
                )}
                <button
                  onClick={() => setFaucetResult(null)}
                  className="w-full py-4 bg-cyan-500 border-[4px] border-black shadow-[6px_6px_0_rgba(0,0,0,1)] text-black font-black uppercase italic text-xl rounded-2xl active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </div>

            {/* Footer Decoration */}
            {faucetResult.txHash && (
              <div className="bg-black/40 py-2 border-t border-white/5 relative z-10">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Transmission ID: {faucetResult.txHash?.slice(0, 16)}...</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});
