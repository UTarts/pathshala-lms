'use client';
import { Home, Megaphone, Trophy, QrCode, FileQuestion, Library, User, Users, BookOpen, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useLocalState } from '@/hooks/useStore';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const router = useRouter();
  const [user] = useLocalState<any>('pathshala_user', null);

  const NavItem = ({ tab, icon: Icon, label, onClick }: any) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-1 min-w-[44px] group"
    >
      <div className={cn("p-1.5 rounded-xl transition-colors", activeTab === tab ? "bg-primary/10 text-primary dark:bg-primary/20" : "text-slate-400 group-hover:bg-slate-50 dark:group-hover:bg-slate-800")}>
        <Icon className={cn("w-6 h-6", activeTab === tab && "fill-current")} />
      </div>
      <span className={cn("text-[9px] font-bold tracking-tight", activeTab === tab ? "text-primary" : "text-slate-400")}>
        {label}
      </span>
    </button>
  );

  // --- ADMIN NAVIGATION ---
  if (user?.role === 'admin') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-50 pb-safe shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] rounded-t-[2rem]">
        <div className="flex items-center justify-between px-4 py-2 max-w-md mx-auto">
          <NavItem tab="home" icon={Home} label="Hub" onClick={() => onTabChange('home')} />
          <NavItem tab="students" icon={Users} label="Students" onClick={() => router.push('/admin/students')} />
          <NavItem tab="notices" icon={Megaphone} label="Notices" onClick={() => router.push('/notices')} />
          
          {/* Center Scanner */}
          <div className="relative -top-8 px-1">
            <button 
              onClick={() => onTabChange('scan')}
              className="w-14 h-14 bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-[4px] border-slate-50 dark:border-slate-900"
            >
              <QrCode className="w-6 h-6" />
            </button>
          </div>


          <NavItem tab="leaderboard" icon={Trophy} label="Ranks" onClick={() => router.push('/leaderboard')} />
          <NavItem tab="ledger" icon={Receipt} label="Ledger" onClick={() => router.push('/admin/accounting')} />
          <NavItem tab="profile" icon={User} label="Profile" onClick={() => onTabChange('profile')} />
        </div>
      </nav>
    );
  }

  // --- MEMBER NAVIGATION ---
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-50 pb-safe shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] rounded-t-[2rem]">
      <div className="flex items-center justify-between px-2 py-2 max-w-md mx-auto">
        <NavItem tab="home" icon={Home} label="Home" onClick={() => onTabChange('home')} />
        <NavItem tab="notices" icon={Megaphone} label="Notices" onClick={() => router.push('/notices')} />
        <NavItem tab="leaderboard" icon={Trophy} label="Ranks" onClick={() => router.push('/leaderboard')} />

        {/* Center Scanner */}
        <div className="relative -top-8 px-1">
          <button 
            onClick={() => onTabChange('scan')}
            className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-indigo-500 dark:to-purple-500 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-[4px] border-slate-50 dark:border-slate-900"
          >
            <QrCode className="w-6 h-6" />
          </button>
        </div>

        <NavItem tab="quiz" icon={FileQuestion} label="Quizzes" onClick={() => router.push('/quiz')} />
        <NavItem tab="library" icon={Library} label="Library" onClick={() => router.push('/library')} />
        <NavItem tab="profile" icon={User} label="Profile" onClick={() => onTabChange('profile')} />
      </div>
    </nav>
  );
}