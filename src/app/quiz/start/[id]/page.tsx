'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, ChevronLeft, ChevronRight, Grid, Languages, Flag, Trash2, AlertTriangle, CheckCircle, HelpCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocalState } from '@/hooks/useStore';

// Types for our exact state tracking
type QStatus = 'unvisited' | 'visited' | 'answered' | 'review' | 'answered_review';

export default function QuizExamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user] = useLocalState<any>('pathshala_user', null);
  
  const [quizSet, setQuizSet] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); 
  const [statuses, setStatuses] = useState<Record<string, QStatus>>({});
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [timeLeft, setTimeLeft] = useState(0); 
  
  // UI Overlays
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. INITIALIZATION & ANTI-DATA LOSS ---
  useEffect(() => {
    const loadQuiz = async () => {
      const { data: qData } = await supabase.from('questions').select('*').eq('quiz_set_id', params.id);
      const { data: setData } = await supabase.from('quiz_sets').select('*').eq('id', params.id).single();

      if (qData && setData) {
        setQuestions(qData);
        setQuizSet(setData);
        
        // Secure Resume Logic
        const savedSession = localStorage.getItem(`quiz_session_${params.id}`);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          setAnswers(parsed.answers || {});
          setStatuses(parsed.statuses || {});
          
          // Tamper-proof timer calculation
          const now = Math.floor(Date.now() / 1000);
          const elapsed = now - parsed.startTime;
          const remaining = (setData.duration_minutes * 60) - elapsed;
          
          if (remaining <= 0) {
            handleFinalSubmit(parsed.answers); 
          } else {
            setTimeLeft(remaining);
          }
        } else {
          // Fresh Start
          setTimeLeft(setData.duration_minutes * 60);
          const initialStatuses: Record<string, QStatus> = {};
          qData.forEach((q, idx) => { initialStatuses[q.id] = idx === 0 ? 'visited' : 'unvisited'; });
          setStatuses(initialStatuses);
          
          localStorage.setItem(`quiz_session_${params.id}`, JSON.stringify({ 
            answers: {}, 
            statuses: initialStatuses,
            startTime: Math.floor(Date.now() / 1000) 
          }));
        }
      }
      setLoading(false);
    };
    loadQuiz();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [params.id]);

  // --- 2. TIMER ENGINE ---
  useEffect(() => {
    if (timeLeft > 0 && !loading) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            handleFinalSubmit(answers); // Auto-submit on zero
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft, loading, answers]);

  // --- 3. STATE SYNC UTILITY ---
  const syncToLocal = useCallback((newAnswers: any, newStatuses: any) => {
    const saved = localStorage.getItem(`quiz_session_${params.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.answers = newAnswers;
      parsed.statuses = newStatuses;
      localStorage.setItem(`quiz_session_${params.id}`, JSON.stringify(parsed));
    }
  }, [params.id]);

  // --- 4. INTERACTION HANDLERS ---
  const handleOptionSelect = (option: string) => {
    const currentQId = questions[currentIndex].id;
    const newAnswers = { ...answers, [currentQId]: option };
    
    // Update status to 'answered' if it was 'visited', or 'answered_review' if it was 'review'
    const currentStatus = statuses[currentQId];
    const newStatus = currentStatus === 'review' || currentStatus === 'answered_review' ? 'answered_review' : 'answered';
    const newStatuses = { ...statuses, [currentQId]: newStatus };
    
    setAnswers(newAnswers);
    setStatuses(newStatuses);
    syncToLocal(newAnswers, newStatuses);
  };

  const handleClearResponse = () => {
    const currentQId = questions[currentIndex].id;
    const newAnswers = { ...answers };
    delete newAnswers[currentQId]; // Remove answer
    
    const currentStatus = statuses[currentQId];
    const newStatus = currentStatus === 'answered_review' ? 'review' : 'visited';
    const newStatuses = { ...statuses, [currentQId]: newStatus };

    setAnswers(newAnswers);
    setStatuses(newStatuses);
    syncToLocal(newAnswers, newStatuses);
  };

  const handleMarkReview = () => {
    const currentQId = questions[currentIndex].id;
    const currentStatus = statuses[currentQId];
    let newStatus: QStatus = 'review';
    
    if (currentStatus === 'answered' || currentStatus === 'answered_review') {
        newStatus = currentStatus === 'answered' ? 'answered_review' : 'answered';
    } else {
        newStatus = currentStatus === 'review' ? 'visited' : 'review';
    }

    const newStatuses = { ...statuses, [currentQId]: newStatus };
    setStatuses(newStatuses);
    syncToLocal(answers, newStatuses);
  };

  const navigateQuestion = (index: number) => {
    // Mark next question as visited if unvisited
    const nextQId = questions[index].id;
    let newStatuses = { ...statuses };
    if (newStatuses[nextQId] === 'unvisited') {
       newStatuses[nextQId] = 'visited';
       setStatuses(newStatuses);
       syncToLocal(answers, newStatuses);
    }
    setCurrentIndex(index);
    setShowPalette(false);
  };

  // --- 5. SUBMISSION ENGINE ---
  const handleFinalSubmit = async (finalAnswers: Record<string, string>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let correct = 0, wrong = 0, skipped = 0;
    questions.forEach(q => {
      const userAns = finalAnswers[q.id];
      if (!userAns) skipped++;
      else if (userAns === q.correct_option) correct++;
      else wrong++;
    });

    const score = (correct * 2) - (wrong * 1);

    const { error } = await supabase.from('quiz_attempts').insert({
      user_id: user.id,
      quiz_set_id: params.id,
      score, correct_count: correct, wrong_count: wrong, unanswered_count: skipped,
      user_answers: finalAnswers,
      total_time_taken: `${Math.floor((quizSet.duration_minutes * 60 - timeLeft) / 60)} min`
    });

    localStorage.removeItem(`quiz_session_${params.id}`);

    if (!error) router.replace(`/quiz/result/${params.id}`); 
    else { alert("Submission Failed. Check network."); setIsSubmitting(false); }
  };

  // --- RENDER HELPERS ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold text-primary">Preparing secure environment...</p></div>;
  if (!questions.length) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Exam Corrupted. Return Home.</div>;

  const currentQ = questions[currentIndex];
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Palette Counters
  const countAnswered = Object.values(statuses).filter(s => s === 'answered').length;
  const countNotAnswered = Object.values(statuses).filter(s => s === 'visited').length;
  const countReview = Object.values(statuses).filter(s => s === 'review').length;
  const countAnsReview = Object.values(statuses).filter(s => s === 'answered_review').length;
  const countNotVisited = questions.length - (countAnswered + countNotAnswered + countReview + countAnsReview);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col select-none">
      
      {/* 1. SECURE HEADER */}
      <header className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm">
        <button onClick={() => setShowExitModal(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 transition-colors text-slate-600">
          <X size={20} />
        </button>
        
        {/* Timer */}
        <div className={`px-4 py-2 rounded-xl font-mono font-bold tracking-widest text-lg border-2 flex items-center gap-2 ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white'}`}>
          <Clock size={18} className={timeLeft < 60 ? 'text-red-500' : 'text-slate-400'} />
          {formatTime(timeLeft)}
        </div>

        <button onClick={() => setShowSubmitModal(true)} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-soft hover:bg-primary-dark transition-all active:scale-95">
          Submit
        </button>
      </header>

      {/* 2. MAIN EXAM AREA */}
      <main className="flex-1 overflow-y-auto p-5 pb-32 max-w-md mx-auto w-full">
        
        {/* Controls Row */}
        <div className="flex justify-between items-center mb-6">
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg text-sm">
            Q {currentIndex + 1} <span className="opacity-50">/ {questions.length}</span>
          </span>
          
          <div className="flex gap-2">
            <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg active:scale-95 shadow-sm text-slate-600 dark:text-slate-300">
              <Languages size={14} className="text-primary"/> {lang === 'en' ? 'Hindi' : 'English'}
            </button>
            <button onClick={handleMarkReview} className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-1.5 rounded-lg active:scale-95 shadow-sm transition-colors ${statuses[currentQ.id]?.includes('review') ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <Flag size={14} className={statuses[currentQ.id]?.includes('review') ? 'fill-current' : ''}/> Review
            </button>
          </div>
        </div>

        {/* Question Text */}
        <div className="mb-8">
          <h2 className="text-[17px] md:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
            {lang === 'en' ? currentQ.question_en : currentQ.question_hi}
          </h2>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {['A', 'B', 'C', 'D'].map((opt) => {
            const isSelected = answers[currentQ.id] === opt;
            return (
              <label 
                key={opt} onClick={() => handleOptionSelect(opt)}
                className={`relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                  isSelected ? 'border-primary bg-green-50/50 dark:bg-green-900/20 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark hover:border-slate-300'
                }`}
              >
                <input type="radio" className="sr-only" checked={isSelected} readOnly />
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 transition-colors ${
                  isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {isSelected && <span className="font-bold text-xs">✓</span>}
                </div>
                <span className={`text-[15px] font-semibold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {lang === 'en' ? currentQ[`option_${opt.toLowerCase()}_en`] : currentQ[`option_${opt.toLowerCase()}_hi`]}
                </span>
              </label>
            );
          })}
        </div>

        {/* Clear Response */}
        {answers[currentQ.id] && (
          <div className="mt-6 flex justify-end">
             <button onClick={handleClearResponse} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-500 transition-colors p-2">
                <Trash2 size={14} /> Clear Selection
             </button>
          </div>
        )}
      </main>

      {/* 3. FOOTER NAVIGATION */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 p-4 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <button disabled={currentIndex === 0} onClick={() => navigateQuestion(currentIndex - 1)} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 disabled:opacity-30 transition-colors">
            <ChevronLeft size={24} />
          </button>
          
          <button onClick={() => setShowPalette(true)} className="flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition-colors">
            <Grid size={20} /> <span className="hidden sm:inline">Palette</span>
          </button>
          
          <button disabled={currentIndex === questions.length - 1} onClick={() => navigateQuestion(currentIndex + 1)} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 disabled:opacity-30 transition-colors">
             <ChevronRight size={24} />
          </button>
        </div>
      </footer>

      {/* --- OVERLAYS --- */}

      {/* Exit Warning Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-center mb-2">Pause Exam?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Your answers are saved, but the <b>timer will continue running</b> in the background.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowExitModal(false)} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200">Cancel</button>
              <button onClick={() => router.back()} className="flex-1 py-3.5 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30">Exit Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Summary Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-black text-center mb-6 border-b pb-4">Exam Summary</h3>
            <div className="space-y-4 mb-8">
               <div className="flex justify-between items-center font-semibold text-sm">
                 <span className="flex items-center gap-2 text-slate-600"><CheckCircle size={16} className="text-green-500"/> Answered</span>
                 <span className="text-lg">{countAnswered}</span>
               </div>
               <div className="flex justify-between items-center font-semibold text-sm">
                 <span className="flex items-center gap-2 text-slate-600"><AlertTriangle size={16} className="text-red-500"/> Not Answered</span>
                 <span className="text-lg">{countNotAnswered}</span>
               </div>
               <div className="flex justify-between items-center font-semibold text-sm">
                 <span className="flex items-center gap-2 text-slate-600"><Flag size={16} className="text-orange-500"/> Marked for Review</span>
                 <span className="text-lg">{countReview + countAnsReview}</span>
               </div>
               <div className="flex justify-between items-center font-semibold text-sm">
                 <span className="flex items-center gap-2 text-slate-600"><HelpCircle size={16} className="text-slate-400"/> Not Visited</span>
                 <span className="text-lg">{countNotVisited}</span>
               </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-4 rounded-xl font-bold bg-slate-100 text-slate-700">Review</button>
              <button onClick={() => handleFinalSubmit(answers)} disabled={isSubmitting} className="flex-1 py-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/30">
                {isSubmitting ? 'Submitting...' : 'Final Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Palette Bottom Sheet */}
      {showPalette && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end" onClick={() => setShowPalette(false)}>
           <div className="bg-white dark:bg-surface-dark rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <h3 className="font-bold text-lg">Question Palette</h3>
                 <button onClick={() => setShowPalette(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full"><X size={18}/></button>
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mb-6 shrink-0 text-[10px] font-bold text-slate-500">
                 <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-500 text-white flex items-center justify-center">1</span> Answered</div>
                 <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-500 text-white flex items-center justify-center">2</span> Not Answered</div>
                 <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-slate-200 text-slate-500 flex items-center justify-center">3</span> Not Visited</div>
                 <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-orange-500 text-white flex items-center justify-center">4</span> Review</div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-5 gap-3 overflow-y-auto pb-6">
                 {questions.map((q, idx) => {
                    const status = statuses[q.id] || 'unvisited';
                    const isCurrent = idx === currentIndex;
                    
                    let bgClass = "bg-slate-100 dark:bg-slate-800 text-slate-500"; // unvisited
                    if (status === 'answered') bgClass = "bg-green-500 text-white";
                    if (status === 'visited') bgClass = "bg-red-500 text-white";
                    if (status === 'review') bgClass = "bg-orange-500 text-white";
                    if (status === 'answered_review') bgClass = "bg-blue-500 text-white";

                    return (
                      <button
                        key={q.id}
                        onClick={() => navigateQuestion(idx)}
                        className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all active:scale-95 ${bgClass} ${isCurrent ? 'ring-4 ring-offset-2 ring-slate-300 dark:ring-slate-600 scale-105' : ''}`}
                      >
                        {idx + 1}
                        {status === 'answered_review' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>}
                      </button>
                    )
                 })}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}