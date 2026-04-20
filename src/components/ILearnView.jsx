import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, CheckCircle, AlertCircle, BookOpen, Brain, Sparkles, Zap, Award } from 'lucide-react';
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

const Star = ({ size, className, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

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

  const handleComplete = (quiz, isCorrect) => {
    if (isCorrect) {
      const result = actions.completeQuiz(quiz, true, ITEMS, FOODS, CRYSTLE_RECIPES);
      setSessionReward(result);
      setActiveQuiz(null);
      setTimeout(() => setSessionReward(null), 4000);
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

        {/* Reward Feedback Toast */}
        {sessionReward && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-top-4 fade-in duration-500">
             <div className="bg-emerald-500 border-[4px] border-black px-4 py-3 rounded-2xl shadow-[8px_8px_0_rgba(0,0,0,1)] flex items-center gap-4 min-w-[280px]">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
                    <Award className="text-emerald-400" size={28} />
                </div>
                
                <div className="flex-1 flex flex-col justify-center border-l-2 border-black/20 pl-4">
                   <div className="flex items-baseline gap-2">
                       <span className="text-lg font-black text-black tabular-nums">+{sessionReward.xp}</span>
                       <span className="text-[10px] font-black text-black/60 uppercase italic">EXP</span>
                   </div>
                   
                   {sessionReward.item && (
                      <div className="flex items-center gap-2 mt-1 pt-1 border-t border-black/10">
                         <span className="text-lg leading-none">{sessionReward.item.icon || '📦'}</span>
                         <span className="text-[9px] font-black text-black uppercase truncate max-w-[120px]">
                            {sessionReward.item.name}
                         </span>
                         <span className="bg-black text-white text-[8px] font-black px-1 rounded">x{sessionReward.item.qty}</span>
                      </div>
                   )}
                </div>

                <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center bg-white/20">
                   <Sparkles className="text-black animate-spin-slow" size={20} />
                </div>
             </div>
          </div>
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
