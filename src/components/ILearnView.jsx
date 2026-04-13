import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, CheckCircle, AlertCircle, BookOpen, Brain, Sparkles, Zap, Award } from 'lucide-react';
import { Header, AvatarMedia } from './GameUI';
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border-[4px] border-black shadow-[10px_10px_0_rgba(0,0,0,1)] bg-[#faf6f0]">
        
        {/* Dynamic Header */}
        <div className={`w-full ${style.tape} py-3 px-6 border-b-[4px] border-black flex items-center justify-between`}>
           <div className="flex items-center gap-3">
              <Brain className="text-black" size={24} />
              <h2 className="text-xl font-black text-black uppercase italic tracking-tighter">Neural Sync: {quiz.topic}</h2>
           </div>
           <button onClick={onClose} className="w-8 h-8 bg-black text-white rounded-lg border-2 border-white flex items-center justify-center hover:bg-slate-800 transition-colors">
              <X size={16} />
           </button>
        </div>

        <div className="flex flex-col md:flex-row h-full max-h-[80vh] md:max-h-none overflow-y-auto md:overflow-hidden">
          {/* Left: Full Scale Character Art */}
          <div className="w-full md:w-56 shrink-0 relative bg-slate-900 border-b-[4px] md:border-b-0 md:border-r-[4px] border-black">
             <img 
                src={`/assets/CrystleTown/CrystleTownCitizen/CrystleTownCitizen (${quiz.npcIndex}).jpg`} 
                className="w-full h-full object-cover object-top"
                alt="Instructor"
             />
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
             <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-md p-3">
                <p className="text-[10px] font-black text-white text-center uppercase italic tracking-widest">Instructor Node: SEC-0{quiz.npcIndex}</p>
             </div>
          </div>

          {/* Right: Tactical Console */}
          <div className="flex-1 p-4 md:p-6 flex flex-col relative">
             {/* Halftone BG Pattern */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '12px 12px' }} />
             
             <div className="mb-6 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incoming Transmission...</span>
                </div>
                <div className="bg-white border-[3px] border-black p-4 rounded-2xl shadow-[4px_4px_0_rgba(0,0,0,1)] relative">
                   <div className="absolute -left-2 top-6 w-4 h-4 bg-white border-l-[3px] border-b-[3px] border-black rotate-45 hidden md:block" />
                   <p className="text-sm md:text-base font-black text-black leading-tight uppercase italic italic">
                      "{quiz.question}"
                   </p>
                </div>
             </div>

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

             {/* Feedback Footer */}
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
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Quiz Card ---
const QuizCard = ({ quiz, onOpen, isCompleted }) => {
  const style = TOPIC_STYLES[quiz.topic] || TOPIC_STYLES.Trivia;

  return (
    <div
      onClick={() => !isCompleted && onOpen(quiz)}
      className={`relative group transition-all ${isCompleted ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer hover:-translate-y-1'}`}
    >
      {/* Dynamic Background Tape Offset */}
      <div className={`absolute inset-0 ${style.tape} rounded-2xl translate-x-1.5 translate-y-1.5 opacity-30 group-hover:opacity-50 transition-opacity`} />
      
      <div className="relative bg-white border-[3px] border-black rounded-2xl overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,1)] flex h-44">
        {/* Left Side: Large Artistic Avatar */}
        <div className="w-24 md:w-28 shrink-0 relative bg-slate-900 border-r-[3px] border-black overflow-hidden group-hover:bg-slate-800 transition-colors">
           <img 
              src={`/assets/CrystleTown/CrystleTownCitizen/CrystleTownCitizen (${quiz.npcIndex}).jpg`} 
              className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
              alt="Instructor"
           />
           <div className={`absolute inset-x-0 bottom-0 ${style.tape} text-[7px] font-black text-black text-center py-1 uppercase italic tracking-tighter border-t-[2px] border-black`}>
              Instructor #{quiz.npcIndex}
           </div>
           {/* Half-tone overlay on image */}
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
        </div>

        {/* Right Side: Briefing Details */}
        <div className="flex-1 p-3 flex flex-col bg-[#fafafa]">
           <div className="flex items-center justify-between mb-2">
              <div className={`px-2 py-0.5 rounded-md border-2 border-black ${style.tape} text-[8px] font-black uppercase italic tracking-widest shadow-[2px_2px_0_rgba(0,0,0,1)]`}>
                 {quiz.topic}
              </div>
              <div className="flex items-center gap-1 text-cyan-600">
                 <Star size={12} className="fill-cyan-500" />
                 <span className="text-[10px] font-black tabular-nums">+{quiz.xpReward} XP</span>
              </div>
           </div>

           <div className="flex-1 flex flex-col justify-center">
              <div className="relative">
                 <div className="absolute -left-1.5 top-0 bottom-0 w-1 bg-black/10 rounded-full" />
                 <p className="text-[11px] font-bold text-slate-800 uppercase italic leading-[1.2] tracking-tight pl-3 line-clamp-3">
                    "{quiz.question}"
                 </p>
              </div>
           </div>

           <div className="mt-2 flex items-center justify-end">
              <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase italic">
                 <span>Commence Sync</span>
                 <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
           </div>
        </div>

        {/* Completed Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center z-10">
             <div className="bg-emerald-500 text-black text-sm font-black px-6 py-2 border-[3px] border-black -rotate-12 uppercase italic shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center gap-2">
                <CheckCircle size={18} />
                SOLVED
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Star = ({ size, className, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const ILearnView = React.memo(() => {
  const { player, syncPlayer, adventure, actions, audio, SOUNDS } = useGame();
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
      const initial = QUIZZES.filter(q => !completedQuizzes[q.id]).slice(0, 6).map(q => q.id);
      if (initial.length > 0) syncPlayer({ quizSlots: initial });
      return;
    }

    // Refill logic: if under 6 slots, pick new ones not completed and not already in slots
    if (quizSlots.length < 6) {
      const available = QUIZZES.filter(q => !completedQuizzes[q.id] && !quizSlots.includes(q.id));
      if (available.length > 0) {
        const needed = 6 - quizSlots.length;
        const picks = [...available].sort(() => Math.random() - 0.5).slice(0, needed).map(q => q.id);
        syncPlayer({ quizSlots: [...quizSlots, ...picks] });
      }
    }
  }, [quizSlots.length, player, completedQuizzes]);

  const handleComplete = (quiz, isCorrect) => {
    if (isCorrect) {
      actions.completeQuiz(quiz, true);
      setSessionReward(quiz.xpReward);
      setActiveQuiz(null);
      setTimeout(() => setSessionReward(null), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Tech Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      <Header 
        title="iLEARN Terminal" 
        onClose={() => setView('menu')} 
      />

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
             <div className="bg-emerald-500 border-[3px] border-black px-6 py-2 rounded-full shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center gap-3">
                < Award className="text-black" size={24} />
                <div className="flex flex-col">
                   <span className="text-xs font-black text-black uppercase leading-none italic">XP SYNCHRONIZED</span>
                   <span className="text-lg font-black text-black tabular-nums">+{sessionReward} EXP</span>
                </div>
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                   <Sparkles className="text-emerald-400 animate-spin-slow" size={16} />
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
