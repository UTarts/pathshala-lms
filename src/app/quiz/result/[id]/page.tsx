'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Home, CheckCircle, XCircle, AlertCircle, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocalState } from '@/hooks/useStore';

export default function QuizResultPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user] = useLocalState<any>('pathshala_user', null);
  
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    const fetchResult = async () => {
      if (!user) return;
      const { data: attemptData } = await supabase.from('quiz_attempts').select('*, quiz_sets(title)').eq('quiz_set_id', params.id).eq('user_id', user.id).single();
      const { data: qData } = await supabase.from('questions').select('*').eq('quiz_set_id', params.id);

      if (attemptData && qData) {
        setAttempt(attemptData);
        setQuestions(qData);
      }
      setLoading(false);
    };
    fetchResult();
  }, [user, params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><p className="animate-pulse font-bold text-primary text-xl">Loading Report...</p></div>;
  if (!attempt) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900"><p className="font-bold text-slate-500 mb-4">No result found.</p><button onClick={() => router.push('/quiz')} className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-soft">Go to Quiz Hub</button></div>;

  const totalPoints = questions.length * 2; 
  const percentage = Math.max(0, Math.round((attempt.score / totalPoints) * 100));
  const isPass = percentage >= 40; 

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col relative overflow-x-hidden selection:bg-primary/30">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-8 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <button onClick={() => router.push('/quiz')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-black tracking-tight leading-tight">Report Card</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{attempt.quiz_sets?.title}</p>
        </div>
        <div className="w-10"></div>
      </div>

      <main className="flex-1 px-5 py-6 space-y-6 max-w-md mx-auto w-full pb-10">
        
        {/* Massive Hero Score Card */}
        <div className="relative w-full rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-soft p-8 flex flex-col items-center text-center overflow-hidden">
          
          <div className="relative z-10 w-full flex flex-col items-center">
            <span className={`px-4 py-1.5 font-bold text-[10px] rounded-full mb-4 uppercase tracking-widest border ${isPass ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30' : 'bg-red-50 text-red-500 border-red-200 dark:bg-red-900/30'}`}>
              {isPass ? 'Good Job!' : 'Needs Practice'}
            </span>
            
            <div className="relative flex items-center justify-center mb-6 mt-2">
              <div className="w-40 h-40 rounded-full border-[8px] border-slate-50 dark:border-slate-900 flex flex-col items-center justify-center bg-white dark:bg-slate-800 shadow-glow relative z-10">
                <span className={`text-6xl font-black drop-shadow-sm ${attempt.score > 0 ? 'text-primary' : 'text-red-500'}`}>
                  {attempt.score}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total XP</span>
              </div>
              <div className={`absolute inset-0 rounded-full blur-2xl scale-125 ${isPass ? 'bg-primary/20' : 'bg-red-500/20'}`}></div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50 py-2 px-4 rounded-xl border border-slate-100 dark:border-slate-700">
              Accuracy: <span className="font-black text-slate-900 dark:text-white">{Math.round((attempt.correct_count / questions.length) * 100)}%</span> • Time: <span className="font-black text-slate-900 dark:text-white">{attempt.total_time_taken}</span>
            </p>
          </div>
        </div>

        {/* 3 Stats Boxes */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center p-4 rounded-[1.5rem] bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/50 shadow-sm">
            <span className="text-2xl font-black text-green-600 dark:text-green-400 leading-none mb-1">{attempt.correct_count}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Correct</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-[1.5rem] bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 shadow-sm">
            <span className="text-2xl font-black text-red-600 dark:text-red-400 leading-none mb-1">{attempt.wrong_count}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wrong</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-2xl font-black text-slate-600 dark:text-slate-300 leading-none mb-1">{attempt.unanswered_count}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Skipped</span>
          </div>
        </div>

        {/* Action Button (Home only, No Retry) */}
        <button onClick={() => router.push('/')} className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2">
          <Home size={18} /> Back to Dashboard
        </button>

        <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-4"></div>

        {/* Detailed Solutions Section */}
        <div>
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-lg font-black">Detailed Review</h3>
            <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="flex items-center gap-1.5 text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-transform">
               <Languages size={14} className="text-primary"/> {lang === 'en' ? 'Hindi' : 'English'}
            </button>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const userAns = attempt.user_answers[q.id];
              const isCorrect = userAns === q.correct_option;
              const isSkipped = !userAns;

              let statusBadge = <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest border border-slate-200 dark:border-slate-700">Skipped (0)</span>;
              if (isCorrect) statusBadge = <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest border border-green-200 dark:border-green-800">Correct (+2)</span>;
              else if (!isSkipped) statusBadge = <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest border border-red-200 dark:border-red-800">Wrong (-1)</span>;

              return (
                <div key={q.id} className="bg-white dark:bg-slate-800 rounded-[1.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                  
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg">Q {idx + 1}</span>
                    {statusBadge}
                  </div>
                  
                  <p className="font-bold text-[16px] mb-5 leading-relaxed text-slate-900 dark:text-white">
                    {lang === 'en' ? q.question_en : q.question_hi}
                  </p>

                  <div className="space-y-2.5">
                    {['A', 'B', 'C', 'D'].map(opt => {
                      const isThisCorrect = q.correct_option === opt;
                      const isThisUsersPick = userAns === opt;

                      let optClasses = "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400"; // Default
                      let icon = null;
                      
                      if (isThisCorrect) {
                        optClasses = "border-primary bg-primary/10 text-slate-900 dark:text-white shadow-sm ring-1 ring-primary";
                        icon = <CheckCircle size={16} className="text-primary ml-auto" />;
                      } else if (isThisUsersPick && !isThisCorrect) {
                        optClasses = "border-red-400 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 opacity-80 line-through decoration-red-400";
                        icon = <XCircle size={16} className="text-red-500 ml-auto" />;
                      }

                      return (
                        <div key={opt} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${optClasses}`}>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${isThisCorrect ? 'border-primary bg-primary text-white' : isThisUsersPick ? 'border-red-500 bg-red-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                            {opt}
                          </div>
                          <span className="text-sm font-semibold">
                            {lang === 'en' ? q[`option_${opt.toLowerCase()}_en`] : q[`option_${opt.toLowerCase()}_hi`]}
                          </span>
                          {icon}
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}