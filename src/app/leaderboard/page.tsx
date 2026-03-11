'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Share2, Trophy, Medal, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocalState } from '@/hooks/useStore';
import { BottomNav } from '@/components/ui/BottomNav';

export default function LeaderboardPage() {
  const router = useRouter();
  const [user] = useLocalState<any>('pathshala_user', null);
  
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserStats, setCurrentUserStats] = useState({ rank: 0, xp: 0, quizzes: 0 });

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data: attempts } = await supabase.from('quiz_attempts').select('user_id, score');
      // Ensure Admins are never fetched or ranked
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, photo_url').neq('role', 'admin');

      if (attempts && profiles) {
        const userScores: Record<string, { totalXP: number, quizzes: number }> = {};
        attempts.forEach(att => {
          if (!userScores[att.user_id]) userScores[att.user_id] = { totalXP: 0, quizzes: 0 };
          userScores[att.user_id].totalXP += (att.score > 0 ? att.score : 0);
          userScores[att.user_id].quizzes += 1;
        });

        const ranked = profiles.map(p => ({
          ...p,
          xp: userScores[p.id]?.totalXP || 0,
          quizzes: userScores[p.id]?.quizzes || 0
        })).sort((a, b) => b.xp - a.xp); 

        const activeRanked = ranked.filter(r => r.xp > 0);
        setLeaderboard(activeRanked);

        if (user && user.role !== 'admin') {
          const myIndex = activeRanked.findIndex(r => r.id === user.id);
          const myData = activeRanked[myIndex] || { xp: 0, quizzes: 0 };
          setCurrentUserStats({ rank: myIndex !== -1 ? myIndex + 1 : 0, xp: myData.xp, quizzes: myData.quizzes });
        }
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, [user]);

  const top3 = leaderboard.slice(0, 3);
  const runnersUp = leaderboard.slice(3);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><p className="animate-pulse text-primary font-bold text-lg">Loading Ranks...</p></div>;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-indigo-500">
      
      <header className="flex items-center justify-between px-5 pt-5 pb-4 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800">
        <button onClick={() => router.push('/')} className="flex items-center justify-center p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black tracking-tight">Global Ranks</h1>
        <button className="flex items-center justify-center p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          <Share2 size={18} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar pb-32 max-w-md mx-auto w-full">
        
        {/* Only show personal stats if user is a student */}
        {user?.role !== 'admin' && (
          <div className="px-5 py-4 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Your Rank</span>
              <span className="text-2xl font-black text-primary">{currentUserStats.rank > 0 ? `#${currentUserStats.rank}` : '-'}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">XP Earned</span>
              <span className="text-2xl font-black text-indigo-500">{currentUserStats.xp}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Quizzes</span>
              <span className="text-2xl font-black text-purple-500">{currentUserStats.quizzes}</span>
            </div>
          </div>
        )}

        {/* ... (Keep the rest of the Podium and Runner up code exactly identical to the previous version) ... */}
        {leaderboard.length === 0 ? (
          <div className="px-5 text-center mt-10">
            <p className="text-slate-500 font-medium bg-white dark:bg-slate-800 p-6 rounded-2xl">No rankings yet. Be the first to take a quiz!</p>
          </div>
        ) : (
          <>
            {/* Podium Section */}
            <div className="relative px-5 pt-10 pb-12 mb-6 mt-4">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/20 rounded-full blur-[60px] -z-10"></div>
              
              <div className="flex items-end justify-center gap-3 h-64">
                {/* 2nd Place */}
                {top3[1] && (
                  <div className="flex flex-col items-center z-10 w-[30%]">
                    <div className="relative mb-3">
                      <div className="w-20 h-20 rounded-full border-4 border-slate-300 dark:border-slate-500 p-1 bg-white dark:bg-surface-dark shadow-lg">
                        {top3[1].photo_url ? <img src={top3[1].photo_url} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-xl">{top3[1].full_name?.[0]}</div>}
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 border-2 border-white dark:border-slate-800">
                        <Medal size={12} /> 2
                      </div>
                    </div>
                    <div className="text-center mb-2 w-full">
                      <p className="font-bold text-sm text-slate-800 dark:text-white truncate px-1">{top3[1].full_name?.split(' ')[0]}</p>
                      <p className="text-xs text-primary font-black">{top3[1].xp} XP</p>
                    </div>
                    <div className="w-full h-24 bg-gradient-to-b from-slate-300 to-slate-400/80 rounded-t-2xl flex items-start justify-center pt-3 relative overflow-hidden border-t-2 border-white/50">
                      <span className="text-4xl font-black text-white/60">2</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {top3[0] && (
                  <div className="flex flex-col items-center z-20 w-[35%] -mb-4">
                    <div className="relative mb-4">
                      <div className="absolute -top-7 left-1/3 -translate-x-1/2 text-yellow-400 animate-bounce">
                        <Trophy size={32} className="fill-current drop-shadow-lg" />
                      </div>
                      <div className="w-24 h-24 rounded-full border-4 border-yellow-400 p-1 bg-white dark:bg-surface-dark shadow-glow ring-4 ring-yellow-400/20">
                        {top3[0].photo_url ? <img src={top3[0].photo_url} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-full flex items-center justify-center font-black text-3xl">{top3[0].full_name?.[0]}</div>}
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-sm font-black px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 border-2 border-white dark:border-slate-800">
                        <Award size={14} className="fill-current" /> 1
                      </div>
                    </div>
                    <div className="text-center mb-2 w-full">
                      <p className="font-black text-base text-slate-900 dark:text-white truncate px-1">{top3[0].full_name?.split(' ')[0]}</p>
                      <p className="text-sm text-yellow-500 font-black">{top3[0].xp} XP</p>
                    </div>
                    <div className="w-full h-32 bg-gradient-to-b from-yellow-400 to-yellow-500/80 rounded-t-2xl flex items-start justify-center pt-3 relative overflow-hidden border-t-2 border-white/50">
                      <span className="text-5xl font-black text-white/60">1</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <div className="flex flex-col items-center z-10 w-[30%]">
                    <div className="relative mb-3">
                      <div className="w-20 h-20 rounded-full border-4 border-orange-300 dark:border-orange-700 p-1 bg-white dark:bg-surface-dark shadow-lg">
                        {top3[2].photo_url ? <img src={top3[2].photo_url} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center font-bold text-xl">{top3[2].full_name?.[0]}</div>}
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-300 text-orange-900 text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 border-2 border-white dark:border-slate-800">
                        <Medal size={12} /> 3
                      </div>
                    </div>
                    <div className="text-center mb-2 w-full">
                      <p className="font-bold text-sm text-slate-800 dark:text-white truncate px-1">{top3[2].full_name?.split(' ')[0]}</p>
                      <p className="text-xs text-primary font-black">{top3[2].xp} XP</p>
                    </div>
                    <div className="w-full h-20 bg-gradient-to-b from-orange-300 to-orange-400/80 rounded-t-2xl flex items-start justify-center pt-2 relative overflow-hidden border-t-2 border-white/50">
                      <span className="text-4xl font-black text-white/60">3</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-b-xl shadow-md mt-[-1px] relative z-0 mx-auto"></div>
            </div>

            {runnersUp.length > 0 && (
              <div className="px-5 pb-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1 mb-3 flex items-center gap-2">
                  <span className="w-2 h-6 bg-slate-300 rounded-full"></span> Top Learners
                </h3>
                
                {runnersUp.map((runner, index) => {
                  const rank = index + 4;
                  
                  return (
                    <div key={runner.id} className="flex items-center gap-4 p-4 rounded-2xl shadow-sm border transition-transform hover:scale-[1.02] bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-black w-6 text-center text-slate-400">{rank}</span>
                      <div className="relative">
                        {runner.photo_url ? (
                          <img src={runner.photo_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 border-2 border-white dark:border-slate-700 shadow-sm">{runner.full_name?.[0]}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold truncate text-slate-900 dark:text-white">
                          {runner.full_name}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{runner.quizzes} Quizzes</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-indigo-500">{runner.xp}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">XP</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav activeTab="leaderboard" onTabChange={(tab) => {
         if (tab === 'home') router.push('/');
         if (tab === 'scan') alert('QR Scanner opening...');
         if (tab === 'profile') router.push('/?tab=profile');
      }} />
    </div>
  );
}