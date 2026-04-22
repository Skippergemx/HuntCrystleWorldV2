import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, CheckCircle, AlertCircle, BookOpen, Brain, Sparkles, Zap, Award, Star, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Header, AvatarMedia } from './GameUI';
import { NPCCard as AmbientNPCCard } from './NPCCard';
import { ComicQuestCard, ComicQuestModal, TalkingNPC } from './SharedQuestUI';
import { useGame } from '../contexts/GameContext';
import QUIZZES from '../data/quizzes.json';

const TOPIC_STYLES = {
  Math:    { tape: 'bg-blue-400',   accent: 'text-blue-500',   bg: 'bg-blue-50',   icon: '🧮' },
  Science: { tape: 'bg-pink-400',   accent: 'text-pink-500',   bg: 'bg-pink-50',   icon: '🔬' },
  Tech:    { tape: 'bg-cyan-400',   accent: 'text-cyan-500',   bg: 'bg-cyan-50',   icon: '💻' },
  Web3:    { tape: 'bg-purple-400', accent: 'text-purple-500', bg: 'bg-purple-50', icon: '🌐' },
  Trivia:  { tape: 'bg-amber-400',  accent: 'text-amber-500',  bg: 'bg-amber-50',  icon: '❓' },
};

// --- Quiz Modal ---
const QuizModal = ({ quiz, onClose, onComplete }) => {
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
  const { player, syncPlayer, adventure, actions, audio, SOUNDS, ITEMS, FOODS, CRYSTLE_RECIPES } = useGame();
  const { setView } = adventure;
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [sessionReward, setSessionReward] = useState(null);

  const quizSlots = player?.quizSlots || [];
  const completedQuizzes = player?.completedQuizzes || {};

  // Find actual quiz objects for active slots
  const activeQuizzes = useMemo(() => {
    return quizSlots
      .map(id => QUIZZES.find(q => q.id === id))
      .filter(Boolean)
      .filter(q => !completedQuizzes[q.id]); // ONLY show unsolved in slots
  }, [quizSlots, completedQuizzes]);

  // Sanity Check: Purge completed quizzes from quizSlots if they linger
  useEffect(() => {
    if (!player || quizSlots.length === 0) return;
    const solvedInSlots = quizSlots.filter(id => completedQuizzes[id]);
    if (solvedInSlots.length > 0) {
      const cleanSlots = quizSlots.filter(id => !completedQuizzes[id]);
      syncPlayer({ quizSlots: cleanSlots });
    }
  }, [quizSlots, completedQuizzes, player]);

  // Handle slot initialization and refill
  useEffect(() => {
    if (!player) return;
    
    // Initial setup if slots are empty
    if (quizSlots.length === 0) {
      const initial = QUIZZES.filter(q => !completedQuizzes[q.id]).slice(0, 10).map(q => q.id);
      if (initial.length > 0) syncPlayer({ quizSlots: initial });
      return;
    }

    // Refill logic: if under 10 slots, pick new ones not completed and not already in slots
    if (quizSlots.length < 10) {
      const available = QUIZZES.filter(q => !completedQuizzes[q.id] && !quizSlots.includes(q.id));
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
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  const handleComplete = async (quiz, isCorrect) => {
    if (isCorrect) {
      const result = await actions.completeQuiz(quiz, true, ITEMS, FOODS, CRYSTLE_RECIPES);
      setSessionReward(result);
      setActiveQuiz(null);
      if (result.item) {
         triggerConfetti();
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
        {sessionReward && createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
             <div className="max-w-sm w-full bg-slate-900 border-[6px] border-black p-8 relative shadow-[16px_16px_0_rgba(0,0,0,1)] overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                
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
               onOpen={setActiveQuiz}
               isCompleted={!!completedQuizzes[quiz.id]}
             />
           ))}
           
           {activeQuizzes.length === 0 && (
             <div className="col-span-full py-20 text-center">
                <p className="text-4xl mb-4">🏆</p>
                <h3 className="text-white font-black uppercase italic">Academic Superiority Achieved</h3>
                <p className="text-cyan-500 text-[10px] font-bold uppercase mt-2 italic tracking-widest">Global pool exhausted. You are the Metaverse Core.</p>
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
    </div>
  );
});
