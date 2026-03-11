'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trophy, Target, Play, CheckCircle, Calendar, ArrowRight, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocalState } from '@/hooks/useStore';
import { BottomNav } from '@/components/ui/BottomNav'; // Re-using our new BottomNav

export default function QuizHubPage() {
  const router = useRouter();
  const [user] = useLocalState<any>('pathshala_user', null);
  
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Fetch all published quizzes ordered by date
      const { data: quizData } = await supabase
        .from('quiz_sets')
        .select('*')
        .eq('is_published', true)
        .order('date', { ascending: false });
        
      // Fetch user's attempts
      const { data: attemptData } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id);

      if (quizData) setQuizzes(quizData);
      if (attemptData) setAttempts(attemptData);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><p className="animate-pulse text-primary font-bold text-lg">Loading Hub...</p></div>;

  // Real Data Calculations
  const totalAttempted = attempts.length;
  const totalXP = attempts.reduce((acc, curr) => acc + (curr.score > 0 ? curr.score : 0), 0);

  // Separate Today's Quiz (the most recent one) and Past Quizzes
  const todaysQuiz = quizzes.length > 0 ? quizzes[0] : null;
  const pastQuizzes = quizzes.length > 1 ? quizzes.slice(1) : [];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen flex flex-col font-display selection:bg-primary/30">
      
      {/* Clean Header */}
      <div className="bg-white dark:bg-surface-dark px-6 pt-2 pb-2 shadow-sm sticky top-0 z-20">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Quiz Hub</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Daily Practice & Mocks</p>
      </div>

      <main className="flex-1 px-5 py-6 space-y-8 max-w-md mx-auto w-full pb-32 overflow-y-auto hide-scrollbar">
        
        {/* Real Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center mb-2 shadow-sm">
              <Target size={24} />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalAttempted}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Attempted</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] shadow-soft border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-primary-dark dark:text-primary rounded-full flex items-center justify-center mb-2 shadow-sm">
              <Trophy size={24} />
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalXP}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total XP</span>
          </div>
        </div>

        {/* Today's Quiz (Hero Card) */}
        {todaysQuiz && (
          <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Today's Challenge</h2>
            <div className="relative w-full rounded-[2rem] overflow-hidden shadow-bubbly group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-white/30 shadow-sm">
                    {new Date(todaysQuiz.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm border border-white/30">
                     <Calendar size={18} className="fill-current"/>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-3xl font-black leading-tight drop-shadow-md">{todaysQuiz.title}</h3>
                    <p className="text-white/80 text-sm font-semibold mt-1">
                      {todaysQuiz.total_questions} Questions • {todaysQuiz.duration_minutes} Mins
                    </p>
                  </div>
                  
                  {(() => {
                    const isAttempted = attempts.find(a => a.quiz_set_id === todaysQuiz.id);
                    if (isAttempted) {
                      return (
                        <button 
                          onClick={() => router.push(`/quiz/result/${todaysQuiz.id}`)} 
                          className="w-full bg-white/20 hover:bg-white/30 border border-white/40 backdrop-blur-md text-white font-extrabold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={20} /> View Result (Score: {isAttempted.score})
                        </button>
                      );
                    }
                    return (
                      <button 
                        onClick={() => router.push(`/quiz/start/${todaysQuiz.id}`)} 
                        className="w-full bg-white text-purple-600 font-extrabold py-4 px-6 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                      >
                        Start Exam Now <Play size={18} className="fill-current" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Past Quizzes List */}
        {pastQuizzes.length > 0 && (
          <section>
             <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Past Quizzes</h2>
             <div className="space-y-3">
               {pastQuizzes.map(quiz => {
                  const attempt = attempts.find(a => a.quiz_set_id === quiz.id);
                  
                  return (
                    <div key={quiz.id} className="bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 transition-transform hover:shadow-md">
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                             {new Date(quiz.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                           </span>
                         </div>
                         <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{quiz.title}</h4>
                       </div>
                       
                       {attempt ? (
                         <div className="flex flex-col items-end">
                            <span className={`text-lg font-black ${attempt.score > 0 ? 'text-primary' : 'text-red-500'}`}>{attempt.score} XP</span>
                            <button onClick={() => router.push(`/quiz/result/${quiz.id}`)} className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1 mt-1">
                              View <ArrowRight size={10}/>
                            </button>
                         </div>
                       ) : (
                         <button 
                           onClick={() => router.push(`/quiz/start/${quiz.id}`)} 
                           className="shrink-0 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-transform"
                         >
                           Take <Play size={12} className="fill-current"/>
                         </button>
                       )}
                    </div>
                  );
               })}
             </div>
          </section>
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab="quiz" onTabChange={(tab) => {
         if (tab === 'home') router.push('/');
         if (tab === 'scan') alert('QR Scanner coming soon!');
         if (tab === 'profile') router.push('/?tab=profile');
      }} />
    </div>
  );
}