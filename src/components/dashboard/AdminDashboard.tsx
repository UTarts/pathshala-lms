'use client';
import { useRouter } from 'next/navigation';
import { Bell, Flame, Users, ArrowRight, ShieldCheck, CreditCard, Banknote, AlertTriangle, QrCode, Megaphone, Receipt, BookOpen, FileQuestion, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function AdminDashboard({ user }: { user: any }) {
  const router = useRouter();
  
  // Admin Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      // 1. Total Active Students
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin');
      
      // 2. Total Revenue & Recent Payments
      const { data: payments } = await supabase.from('payments').select('*, profiles(full_name)').order('transaction_date', { ascending: false });
      
      let rev = 0;
      if (payments) {
          rev = payments.reduce((acc, curr) => acc + curr.amount, 0);
          setRecentPayments(payments.slice(0, 3)); // Top 3 recent
      }

      // 3. Expiring Subscriptions (Next 5 Days or overdue)
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
      const { data: profiles } = await supabase.from('profiles').select('subscription_end_date').neq('role', 'admin');
      
      if (profiles) {
         const exp = profiles.filter(p => !p.subscription_end_date || new Date(p.subscription_end_date) <= fiveDaysFromNow).length;
         setExpiringCount(exp);
      }

      setActiveStudents(studentCount || 0);
      setTotalRevenue(rev);
      setLoading(false);
    };

    fetchAdminData();
  }, []);

  return (
    <div className="flex-1 w-full flex flex-col pb-32 bg-slate-50 dark:bg-slate-900 relative font-display">
      
      {/* Pathshala Header */}
      <div className="pt-6 px-6 flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="Pathshala" className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-800 object-cover shadow-sm" />
          <h1 className="text-2xl font-black tracking-tight bg-clip-text  bg-gradient-to-r from-primary-dark to-primary dark:from-emerald-400 dark:to-teal-400">
            Pathshala
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-200 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-slate-800"></span>
          </button>
        </div>
      </div>

      <main className="px-5 w-full max-w-md mx-auto flex flex-col gap-6">
        
        {/* Admin Profile Hero Card */}
        <div className="w-full bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-1 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -left-10 -bottom-20 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 bg-slate-800/40 dark:bg-black/20 rounded-[2.3rem] p-6 flex items-center justify-between border border-white/10 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-3 flex items-center gap-1">
                <ShieldCheck size={12} /> Admin Dashboard
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{user.full_name?.split(' ')[0]}</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">{user.designation || 'Superadmin'}</p>
            </div>
            
            <div className="relative group cursor-pointer" onClick={() => router.push('/profile')}>
              <div className="absolute -inset-2 bg-primary/30 rounded-full blur-lg opacity-75 animate-pulse"></div>
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-slate-700 shadow-2xl bg-slate-200">
                {user.photo_url ? (
                  <img src={user.photo_url} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-500">{user.full_name?.[0]}</div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary border-4 border-slate-800 rounded-full flex items-center justify-center">
                 <span className="material-symbols-outlined text-[10px] text-slate-900 font-bold"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Master Financial Bento Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Financial Overview</h3>
          <div className="grid grid-cols-2 gap-3 h-[18rem]">
            
            {/* Total Revenue (Wide Card) */}
            <div onClick={() => router.push('/admin/accounting')} className="col-span-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-[2rem] p-6 flex items-center justify-between shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform cursor-pointer overflow-hidden relative group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10">
                <p className="text-emerald-50 text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</p>
                <h3 className="text-4xl font-black text-white leading-none">₹{totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md shadow-inner relative z-10">
                <Banknote size={28} />
              </div>
            </div>

            {/* Pending Dues (Tall Card) */}
            <div onClick={() => router.push('/admin/accounting')} className="col-span-1 bg-gradient-to-b from-orange-400 to-red-500 rounded-[2rem] p-5 flex flex-col justify-between shadow-lg shadow-orange-500/20 active:scale-95 transition-transform cursor-pointer relative overflow-hidden group">
              <div className="relative z-10 flex flex-col items-center pt-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md shrink-0 mb-2">
                  <AlertTriangle size={24} />
                </div>
              </div>
              <div className="relative z-10 mt-auto text-center bg-black/20 backdrop-blur-sm rounded-xl py-3 px-2 border border-white/20">
                <h4 className="text-3xl font-black text-white leading-none mb-1">{expiringCount}</h4>
                <p className="text-red-100 text-[9px] uppercase tracking-widest font-bold">Overdue</p>
              </div>
              <AlertTriangle className="absolute -bottom-6 -right-6 w-32 h-32 text-white opacity-10 transform -rotate-12 pointer-events-none group-hover:scale-110 transition-transform" />
            </div>

            {/* Right Side Stack */}
            <div className="col-span-1 flex flex-col gap-3">
              
              {/* Active Students */}
              <div onClick={() => router.push('/admin/students')} className="flex-1 rounded-[2rem] bg-gradient-to-br from-blue-400 to-indigo-500 flex flex-col items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-transform p-4 text-center cursor-pointer relative overflow-hidden">
                <Users size={24} className="text-blue-100 mb-2 relative z-10" />
                <h3 className="text-4xl font-black text-white leading-none relative z-10">{activeStudents}</h3>
                <p className="text-blue-100 text-[9px] uppercase tracking-widest font-bold mt-1 relative z-10">Active Students</p>
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              </div>

              {/* Master Ledger Button */}
              <div onClick={() => router.push('/admin/accounting')} className="h-[4.5rem] bg-slate-900 dark:bg-slate-800 rounded-[1.5rem] p-4 flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform cursor-pointer border border-slate-700">
                <Receipt size={20} className="text-primary" />
                <h3 className="text-sm font-black text-white tracking-widest uppercase">Ledger</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Management Tools Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Management Tools</h3>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] p-5 shadow-sm">
            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
              <ToolAppIcon title="Post Notice" icon={Megaphone} link="/admin/post-notice" iconColor="text-rose-500" />
              <ToolAppIcon title="Add Quiz" icon={FileQuestion} link="/admin/quiz-builder" iconColor="text-purple-500" />
              <ToolAppIcon title="Library" icon={BookOpen} link="/admin/library-manager" iconColor="text-blue-500" />
              <ToolAppIcon title="Scanner" icon={QrCode} link="#" iconColor="text-teal-500" onClick={() => alert('Scanner Opening...')} />
            </div>
          </div>
        </div>
        <button onClick={() => router.push('/admin/add-student')} className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white dark:bg-surface-dark p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all active:scale-95 group">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark group-hover:bg-primary group-hover:text-white transition-colors">
                <UserPlus size={24} />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Add Student</span>
            </button>
        {/* Recent Collections (Live Feed) */}
        <div className="pb-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live Collections</h3>
            <button onClick={() => router.push('/admin/accounting')} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
              View Ledger <ArrowRight size={12} />
            </button>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-slate-500 animate-pulse text-center py-4">Loading ledger...</p>
            ) : recentPayments.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <p className="text-sm font-medium text-slate-500">No recent payments.</p>
              </div>
            ) : (
              recentPayments.map((pay) => (
                <div key={pay.id} className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition-transform flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 shadow-inner">
                    <span className="font-black text-xl">₹</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{pay.profiles?.full_name}</h4>
                      <span className="text-[10px] font-bold text-slate-500">{new Date(pay.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Paid ₹{pay.amount} via {pay.payment_mode}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

// Enterprise App Icon Component
function ToolAppIcon({ title, icon: Icon, link, iconColor, onClick }: any) {
  const router = useRouter();
  
  const handleClick = () => {
    if (onClick) onClick();
    else router.push(link);
  };

  return (
    <div onClick={handleClick} className="flex flex-col items-center gap-2 group active:scale-90 transition-transform cursor-pointer">
      <div className="w-[3.5rem] h-[3.5rem] bg-slate-50 dark:bg-slate-900/50 rounded-[1.1rem] flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 group-hover:shadow-md group-hover:bg-white dark:group-hover:bg-slate-700 transition-all">
        <Icon size={24} strokeWidth={2} className={`${iconColor} group-hover:scale-110 transition-transform duration-200`} />
      </div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center tracking-tight leading-tight w-full line-clamp-2">
        {title}
      </span>
    </div>
  );
}