'use client';
import { useRouter } from 'next/navigation';
import { Bell, Flame, Star, Flag, ArrowRight, Library, FileQuestion, Megaphone, Droplet, HelpCircle, Armchair, QrCode, CalendarDays, BookOpen, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ThemeToggle } from '@/components/ui/ThemeToggle'; // Added Theme Toggle
import NotificationSidebar from '@/components/NotificationSidebar';

export default function MemberDashboard({ user }: { user: any }) {
  const router = useRouter();
  const [totalPoints, setTotalPoints] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch total points for the user
    const fetchPoints = async () => {
      if (!user) return;
      const { data } = await supabase.from('quiz_attempts').select('score').eq('user_id', user.id);
      if (data) {
        const points = data.reduce((acc, curr) => acc + (curr.score > 0 ? curr.score : 0), 0);
        setTotalPoints(points);
      }
    };
    // Fetch Unread Notification Count
    const fetchUnread = async () => {
      const { count } = await supabase.from('app_notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
      if (count !== null) setUnreadCount(count);
    };
    fetchUnread();
    // Fetch top 3 latest notices for the sidebar
    const fetchNotices = async () => {
      const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(3);
      if (data) setRecentNotices(data);
    };

    fetchPoints();
    fetchNotices();
  }, [user]);

  const expiryDate = user.subscription_end_date ? new Date(user.subscription_end_date) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
  const isActive = daysLeft > 0;
  const waterLevel = isActive ? Math.min(100, Math.max(0, (daysLeft / 30) * 100)) : 0;

  return (
    <div className="flex-1 w-full flex flex-col pb-32 bg-slate-50 dark:bg-slate-900 relative">
      
      {/* Custom Integrated Header */}
      <div className="pt-6 px-6 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="Pathshala" className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-800 object-cover shadow-sm" />
          <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Pathshala
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button 
          onClick={() => setShowNotifications(true)} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-200 relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-slate-800"></span>}
        </button>
        </div>
      </div>

      <main className="px-5 w-full max-w-md mx-auto flex flex-col gap-6">
        
        {/* Welcome Hero Card */}
        <div className="w-full bg-gradient-to-br from-sky-300 via-indigo-300 to-purple-300 rounded-[2.5rem] p-1 shadow-bubbly relative overflow-hidden">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-xl"></div>
          <div className="relative z-10 bg-white/40 dark:bg-slate-800/40 rounded-[2.3rem] p-6 flex items-center justify-between border border-white/50">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200/90 mb-1">Member Dashboard</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{user.full_name?.split(' ')[0] || 'Student'}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-white/60 dark:bg-black/20 rounded-full text-xs font-bold text-indigo-700 dark:text-indigo-200 border border-white/40 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {totalPoints} Points
                </span>
              </div>
            </div>
            <div className="relative group cursor-pointer" onClick={() => router.push('/profile')}>
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl bg-slate-200 flex items-center justify-center">
                {user.photo_url ? (
                  <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-slate-500">{user.full_name?.[0]}</span>
                )}
              </div>
              <div className={`absolute bottom-1 right-0 w-5 h-5 border-4 border-white dark:border-slate-800 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
            </div>
          </div>
        </div>

        {/* Quick Actions Scroll */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">Quick Actions</h3>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 px-1 snap-x">
            <button onClick={() => alert("Feature coming soon!")} className="snap-start shrink-0 flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/40 dark:to-rose-800/40 rounded-[1.2rem] flex items-center justify-center text-rose-500 dark:text-rose-300 shadow-sm border border-rose-200 dark:border-rose-700/50 group-active:scale-95 transition-transform">
                <HelpCircle className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Ask Doubt</span>
            </button>
            <button onClick={() => alert("Feature coming soon!")} className="snap-start shrink-0 flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-[1.2rem] flex items-center justify-center text-blue-500 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-700/50 group-active:scale-95 transition-transform">
                <Armchair className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Book Seat</span>
            </button>
            <button onClick={() => alert("Feature coming soon!")} className="snap-start shrink-0 flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-[1.2rem] flex items-center justify-center text-emerald-500 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-700/50 group-active:scale-95 transition-transform">
                <QrCode className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Attendance</span>
            </button>
            <button onClick={() => alert("Feature coming soon!")} className="snap-start shrink-0 flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 rounded-[1.2rem] flex items-center justify-center text-amber-500 dark:text-amber-300 shadow-sm border border-amber-200 dark:border-amber-700/50 group-active:scale-95 transition-transform">
                <CalendarDays className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Schedule</span>
            </button>
          </div>
        </div>

        {/* Dynamic Data Cards */}
        <div className="flex gap-4 h-44">
          {/* Streak Card */}
          <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-800 dark:to-slate-800 rounded-[2rem] p-4 flex flex-col items-center justify-center shadow-bubbly border border-orange-200 dark:border-slate-700 relative overflow-hidden group">
            <Star className="absolute top-3 left-4 text-orange-300 w-3 h-3 animate-sparkle" />
            <Star className="absolute bottom-8 right-3 text-yellow-400 w-2 h-2 animate-sparkle" style={{ animationDelay: '0.5s' }} />
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-2 transform group-hover:-translate-y-1 transition-transform">
                <Flame className="w-8 h-8 fill-current" />
              </div>
              <span className="text-4xl font-black text-slate-800 dark:text-white mt-1">3</span>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide mt-1">Day Streak</span>
            </div>
          </div>

          {/* Water Bottle Subscription Card */}
          <div className="flex-1 bg-gradient-to-b from-cyan-50 to-sky-100 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] p-2 relative overflow-hidden shadow-bubbly border border-sky-200 dark:border-slate-700 flex flex-col items-center justify-center group">
            <Star className="absolute top-3 right-3 text-sky-400 w-3 h-3 animate-sparkle" />
            <div className="flex items-center w-full justify-between px-2 h-full gap-1">
              <div className="relative w-14 h-32 shrink-0 animate-float">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-4 bg-slate-400 dark:bg-slate-600 rounded-md z-20 shadow-sm border-b-2 border-slate-500"></div>
                <div className="bottle-glass absolute top-4 left-1/2 -translate-x-1/2 w-14 h-24 rounded-3xl z-10 overflow-hidden">
                  <div className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 shadow-[0_0_20px_rgba(56,189,248,0.6)] ${isActive ? 'water-gradient' : 'bg-red-500/80'}`} style={{ height: `${waterLevel}%` }}>
                    <div className="wave-shape animate-wave"></div>
                    <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-75"></div>
                    <div className="absolute bottom-6 right-3 w-2 h-2 bg-white/40 rounded-full animate-bounce delay-150"></div>
                  </div>
                  <div className="absolute top-3 right-2 w-1.5 h-16 bg-white/30 rounded-full blur-[1px]"></div>
                </div>
              </div>
              <div className="flex flex-col items-start justify-center flex-1 z-10 pl-1">
                <div className="flex flex-col">
                  <span className={`text-3xl font-black ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-red-500'} leading-none drop-shadow-sm`}>
                    {isActive ? daysLeft : '0'}
                  </span>
                  <span className="text-[10px] font-bold text-sky-800 dark:text-sky-200 leading-tight opacity-80">Days<br/>Left</span>
                </div>
                {!isActive && (
                  <button onClick={() => alert("Please contact admin to renew.")} className="mt-2 text-[10px] font-extrabold bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                    <Droplet className="w-2 h-2 fill-current" /> Renew
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Target Banner (Fixed Height) */}
        <section className="relative w-full group cursor-pointer" onClick={() => router.push('/quiz')}>
          {/* Changed from aspect-ratio to min-h-[240px] to prevent bottom cut-off */}
          <div className="w-full rounded-[2.5rem] overflow-hidden shadow-bubbly relative min-h-[240px] transform transition-transform duration-300 hover:scale-[1.01]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
            
            <div className="relative z-10 h-full flex flex-col justify-between p-7 text-white">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-white/30 shadow-sm">
                  Daily Target
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                  <Flag className="w-6 h-6 animate-pulse fill-current" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl font-black leading-tight drop-shadow-lg">Daily Mock<br/>Test #1</h2>
                  <p className="text-white/80 font-semibold text-sm mt-2 line-clamp-2">Complete today's challenge to maintain your learning streak.</p>
                </div>
                <button className="w-full bg-white text-purple-600 font-extrabold py-4 px-6 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:bg-purple-50 hover:translate-y-[-2px] active:translate-y-[1px] transition-all flex items-center justify-center gap-2">
                  <span>Start Learning</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 left-4 right-4 h-12 bg-purple-600/30 rounded-[3rem] blur-xl -z-10"></div>
        </section>

        {/* Bento Grid Features */}
        <section className="grid grid-cols-2 gap-4 auto-rows-[120px]">
          {/* Library */}
          <div onClick={() => router.push('/library')} className="col-span-1 row-span-2 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/40 dark:to-teal-800/40 rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all border-2 border-transparent hover:border-teal-200 dark:hover:border-teal-700 cursor-pointer">
            <div className="absolute right-[-30px] top-[-30px] w-32 h-32 bg-teal-400/20 rounded-full blur-2xl transition-transform group-hover:scale-150"></div>
            <div className="w-12 h-12 bg-white dark:bg-teal-800 rounded-2xl flex items-center justify-center shadow-md text-teal-500 dark:text-teal-200 mb-2 group-hover:rotate-12 transition-transform">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-teal-100">Library</h3>
              <p className="text-xs text-teal-600 dark:text-teal-200/70 font-bold mt-1 bg-teal-200/50 inline-block px-2 py-0.5 rounded-lg">Study Material</p>
            </div>
            <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-lg">
              <ArrowRight className="w-4 h-4 font-bold" />
            </div>
          </div>

          {/* Quizzes */}
          <div onClick={() => router.push('/quiz')} className="col-span-1 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/40 dark:to-violet-800/40 rounded-[2rem] p-3 flex flex-col justify-center relative overflow-hidden group hover:shadow-lg transition-all border-2 border-transparent hover:border-violet-200 dark:hover:border-violet-700 cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-white dark:bg-violet-800 rounded-2xl flex items-center justify-center shadow-md text-violet-500 dark:text-violet-200 shrink-0 group-hover:scale-110 transition-transform">
                <FileQuestion className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-violet-100 leading-tight">Quizzes</h3>
                <p className="text-[10px] text-violet-600 dark:text-violet-300 font-extrabold uppercase mt-1">Practice</p>
              </div>
            </div>
          </div>

          {/* Notices */}
          <div onClick={() => router.push('/notices')} className="col-span-1 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/40 rounded-[2rem] p-3 flex flex-col justify-center relative overflow-hidden group hover:shadow-lg transition-all border-2 border-transparent hover:border-amber-200 dark:hover:border-amber-700 cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-white dark:bg-amber-800 rounded-2xl flex items-center justify-center shadow-md text-amber-500 dark:text-amber-200 shrink-0 group-hover:scale-110 transition-transform">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-amber-100 leading-tight">Notices</h3>
                <p className="text-[10px] text-amber-600 dark:text-amber-300 font-extrabold uppercase mt-1">Alerts</p>
              </div>
            </div>
          </div>
        </section>
        {/* --- LATEST NOTICES EMBED --- */}
        <div className="mt-2 mb-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Latest Updates</h3>
            <button onClick={() => router.push('/notices')} className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentNotices.length > 0 ? recentNotices.slice(0, 3).map((n) => (
              <div 
                key={n.id} 
                onClick={() => router.push('/notices')}
                className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition-transform cursor-pointer flex gap-4"
              >
                <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-inner ${n.type === 'exam' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/20'}`}>
                  <Bell size={20} className={n.type === 'exam' ? 'animate-pulse' : ''} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{n.title}</h4>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{n.content}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-xs font-bold text-slate-400 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">No recent announcements.</p>
            )}
          </div>
        </div>
      </main>

      <NotificationSidebar isOpen={showNotifications} onClose={() => setShowNotifications(false)} user={user} />
    </div>
  );
}