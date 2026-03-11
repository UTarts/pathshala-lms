'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Save, PlusCircle, CheckCircle, BrainCircuit, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuizBuilderPage() {
  const router = useRouter();
  
  // Phase 1: Quiz Details
  const [step, setStep] = useState(1);
  const [quizTitle, setQuizTitle] = useState('');
  const [duration, setDuration] = useState('15');
  const [totalQuestions, setTotalQuestions] = useState('10');
  
  // Phase 2: Questions Engine
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Temporary State for the active question being typed
  const [activeQ, setActiveQ] = useState({
    en: '', hi: '', 
    optA_en: '', optA_hi: '', optB_en: '', optB_hi: '', 
    optC_en: '', optC_hi: '', optD_en: '', optD_hi: '',
    correct: 'A', exp_en: '', exp_hi: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const startAddingQuestions = () => {
    if (!quizTitle || !duration || !totalQuestions) return alert("Fill all details");
    setStep(2);
  };

  const saveCurrentQuestion = () => {
    // Validate basic inputs
    if (!activeQ.en || !activeQ.optA_en || !activeQ.optB_en) {
      return alert("Please fill at least the English question and Options A & B");
    }

    const newQuestions = [...questions, activeQ];
    setQuestions(newQuestions);

    // If more questions to add, clear form for next
    if (newQuestions.length < Number(totalQuestions)) {
      setCurrentQIndex(newQuestions.length);
      setActiveQ({
        en: '', hi: '', optA_en: '', optA_hi: '', optB_en: '', optB_hi: '', 
        optC_en: '', optC_hi: '', optD_en: '', optD_hi: '', correct: 'A', exp_en: '', exp_hi: ''
      });
    } else {
      // All questions added!
      setStep(3);
    }
  };

  const publishQuiz = async () => {
    setIsSubmitting(true);
    try {
      // 1. Insert Quiz Set
      const { data: setRes, error: setError } = await supabase.from('quiz_sets').insert({
        title: quizTitle,
        duration_minutes: Number(duration),
        total_questions: Number(totalQuestions),
        is_published: true,
        date: new Date().toISOString()
      }).select().single();

      if (setError) throw setError;

      // 2. Format Questions for DB Insert
      const formattedQuestions = questions.map(q => ({
        quiz_set_id: setRes.id,
        question_en: q.en, question_hi: q.hi,
        option_a_en: q.optA_en, option_a_hi: q.optA_hi,
        option_b_en: q.optB_en, option_b_hi: q.optB_hi,
        option_c_en: q.optC_en, option_c_hi: q.optC_hi,
        option_d_en: q.optD_en, option_d_hi: q.optD_hi,
        correct_option: q.correct,
        explanation_en: q.exp_en, explanation_hi: q.exp_hi
      }));

      // 3. Insert Questions
      const { error: qError } = await supabase.from('questions').insert(formattedQuestions);
      if (qError) throw qError;

      setSuccess(true);
      setTimeout(() => router.back(), 2000);

    } catch (error: any) {
      alert("Error publishing quiz: " + error.message);
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-glow mb-6 animate-bounce">
          <CheckCircle size={48} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Quiz Published!</h1>
        <p className="text-slate-500 font-medium mt-2">Live on student dashboards now.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      
      <header className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black tracking-tight">Quiz Builder</h1>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">Step {step} of 3</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 max-w-md mx-auto w-full pb-32">
        
        {/* STEP 1: QUIZ DETAILS */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-primary/10 rounded-2xl p-6 flex flex-col items-center text-center border border-primary/20 mb-6">
               <BrainCircuit size={40} className="text-primary mb-3" />
               <h2 className="font-black text-xl text-slate-900 dark:text-white">Create New Test</h2>
               <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">Define your parameters before adding questions.</p>
            </div>

            <div className="bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Quiz Title</label>
                <input 
                  type="text" placeholder="E.g. Daily Mock Test #1" value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Duration (Min)</label>
                  <input 
                    type="number" value={duration} onChange={e => setDuration(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Total Questions</label>
                  <input 
                    type="number" value={totalQuestions} onChange={e => setTotalQuestions(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <button onClick={startAddingQuestions} className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-black text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2">
              Next: Add Questions <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: ADDING QUESTIONS */}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between bg-primary text-slate-900 px-5 py-3 rounded-2xl font-black shadow-glow">
              <span>Question {currentQIndex + 1} of {totalQuestions}</span>
            </div>

            {/* Question Text */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Question Text</label>
              <textarea placeholder="English Version..." value={activeQ.en} onChange={e => setActiveQ({...activeQ, en: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-3 text-sm font-semibold outline-none focus:border-primary resize-none" rows={2}/>
              <textarea placeholder="Hindi Version (Optional)..." value={activeQ.hi} onChange={e => setActiveQ({...activeQ, hi: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-3 text-sm font-semibold outline-none focus:border-primary resize-none" rows={2}/>
            </div>

            {/* Options */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Options</label>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                   Correct Ans: 
                   <select value={activeQ.correct} onChange={e => setActiveQ({...activeQ, correct: e.target.value})} className="bg-slate-100 dark:bg-slate-800 p-1 rounded-md text-primary font-black outline-none border border-slate-200 dark:border-slate-700">
                     <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                   </select>
                 </div>
              </div>
              
              {['A', 'B', 'C', 'D'].map(opt => (
                <div key={opt} className={`pl-3 border-l-4 ${activeQ.correct === opt ? 'border-primary' : 'border-slate-200 dark:border-slate-700'}`}>
                   <span className="text-[10px] font-black text-slate-400 mb-1 block">Option {opt}</span>
                   <div className="flex gap-2">
                     <input type="text" placeholder="Eng" value={(activeQ as any)[`opt${opt}_en`]} onChange={e => setActiveQ({...activeQ, [`opt${opt}_en`]: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-sm font-medium outline-none focus:border-primary" />
                     <input type="text" placeholder="Hin" value={(activeQ as any)[`opt${opt}_hi`]} onChange={e => setActiveQ({...activeQ, [`opt${opt}_hi`]: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-sm font-medium outline-none focus:border-primary" />
                   </div>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Explanation (Optional)</label>
              <textarea placeholder="English Exp..." value={activeQ.exp_en} onChange={e => setActiveQ({...activeQ, exp_en: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-3 text-xs outline-none focus:border-primary resize-none" rows={2}/>
              <textarea placeholder="Hindi Exp..." value={activeQ.exp_hi} onChange={e => setActiveQ({...activeQ, exp_hi: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-3 text-xs outline-none focus:border-primary resize-none" rows={2}/>
            </div>

            <button onClick={saveCurrentQuestion} className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform flex justify-center items-center gap-2">
              <Save size={18} /> Save & {currentQIndex + 1 < Number(totalQuestions) ? 'Next Question' : 'Finish'}
            </button>
          </div>
        )}

        {/* STEP 3: PUBLISH */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="bg-white dark:bg-surface-dark rounded-[2rem] p-8 text-center shadow-soft border border-slate-100 dark:border-slate-800">
               <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle size={40} />
               </div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Ready to Publish</h2>
               <p className="text-slate-500 text-sm font-medium mb-6">You have successfully prepared <b>{questions.length}</b> questions for <b>{quizTitle}</b>.</p>
               
               <button onClick={publishQuiz} disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-dark text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50">
                 {isSubmitting ? 'Uploading to Database...' : '🚀 Publish Quiz Now'}
               </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}