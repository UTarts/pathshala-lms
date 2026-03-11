'use client';

import { useState, useEffect } from 'react';
import { useLocalState } from '@/hooks/useStore';
import { supabase } from '@/lib/supabaseClient';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BottomNav } from '@/components/ui/BottomNav';
import MemberDashboard from '@/components/dashboard/MemberDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import ProfileSection from '@/components/ProfileSection';
import { useRouter } from 'next/navigation';
import { GraduationCap, Star, User, Lock, ArrowRight, Eye, QrCode, Loader2 } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useLocalState<any>('pathshala_user', null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false); // Fixes the flashing!
  const router = useRouter();

  // Wait for the component to mount to check local state (prevents flash)
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Login Logic 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        setUser(profile);
      }
    } catch (err: any) {
      alert("Login Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
     if(!user) return;
     const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
     if (profile) setUser(profile);
  };

  // --- SPLASH SCREEN (LOADING STATE) ---
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center selection:bg-primary/30">
        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] flex items-center justify-center shadow-2xl animate-pulse mb-6 transform rotate-3">
          <GraduationCap className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-2">
            Pathshala
        </h1>
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mt-4" />
      </div>
    );
  }

  // --- WELCOME / LOGIN VIEW ---
  if (!user) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center relative w-full min-h-screen pt-20 pb-8 px-6 overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Top Bar for Login */}
        <div className="absolute top-0 left-0 w-full z-10 p-4 flex items-center justify-between">
          <div className="glass-card p-2 rounded-full shadow-sm flex items-center gap-2">
            <div className="bg-primary/20 text-primary-dark p-2 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-slate-900 dark:text-slate-100 font-bold text-sm pr-2">Pathshala</span>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Decorative Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-primary/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[40%] bg-blue-200/30 rounded-full blur-[100px]"></div>
        </div>

        {/* Hero Illustration Area */}
        <div className="w-full max-w-xs aspect-square mb-6 relative mt-10">
          <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-blue-300/20 rounded-full animate-[spin_10s_linear_infinite] absolute inset-0 blur-xl"></div>
          <div className="w-full h-full flex items-center justify-center relative z-0 animate-[bounce_4s_ease-in-out_infinite]">
             <BookIllustration />
          </div>
          
          {/* Floating badge */}
          <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce" style={{animationDuration: '3s'}}>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full text-yellow-600 dark:text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Streak</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Ready!</span>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="w-full max-w-md mt-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight mb-3 tracking-tight">
                Unlock Your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-dark to-emerald-600">Learning World</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base font-medium">
                Your digital library for fun, discovery, and limitless knowledge.
            </p>
          </div>

          {/* Login Form */}
          <div className="glass-card rounded-[2rem] p-6 shadow-xl shadow-primary/5">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input name="email" type="email" required placeholder="Student Email" className="w-full bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary block pl-12 p-4 transition-all placeholder:text-slate-400 font-medium outline-none" />
              </div>
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input name="password" type={showPassword ? "text" : "password"} required placeholder="Password" className="w-full bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary block pl-12 p-4 transition-all placeholder:text-slate-400 font-medium outline-none" />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                </div>
              </div>

              <div className="flex items-center justify-end mt-1">
                <a href="#" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
                    Forgot Password?
                </a>
              </div>
              
              <button disabled={loading} type="submit" className="mt-2 w-full bg-primary hover:bg-primary-dark text-white text-lg font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 transform transition hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 group">
                  {loading ? 'Authenticating...' : 'Get Started'}
                  {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-4">
              <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
              <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">Or</span>
              <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
            </div>

            <div className="mt-6 flex justify-center">
              <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 py-3 px-6 rounded-xl transition-colors w-full active:scale-95">
                <QrCode className="w-5 h-5 text-slate-900 dark:text-white" />
                <span className="font-bold text-slate-700 dark:text-slate-300">Scan ID Card</span>
              </button>
            </div>
          </div>

          <p className="text-center mt-8 text-slate-500 dark:text-slate-400 font-medium text-sm">
            Admin Access? <span className="text-primary-dark dark:text-primary font-bold cursor-pointer" onClick={() => alert("Use your admin credentials above.")}>Login Here</span>
          </p>
        </div>
      </main>
    );
  }

  // --- LOGGED IN VIEW ---
  return (
    <div className="min-h-screen flex flex-col">
      {/* 1. DASHBOARD TAB */}
      {activeTab === 'home' && (
        user.role === 'admin' 
          ? <AdminDashboard user={user} /> 
          : <MemberDashboard user={user} />
      )}

      {/* 2. PROFILE TAB */}
      {activeTab === 'profile' && (
         <ProfileSection user={user} onProfileUpdate={refreshUser} />
      )}

      {/* 3. Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          if (tab === 'scan') {
             alert("QR Scanner opening soon..."); 
          } else {
             setActiveTab(tab);
          }
        }} 
      />
    </div>
  );
}

// Custom animated 3D-ish illustration
const BookIllustration = () => (
  <div className="relative w-48 h-48 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[3rem] shadow-2xl flex items-center justify-center border-4 border-white/50 dark:border-white/10 rotate-12 hover:rotate-0 transition-transform duration-500">
     <div className="absolute -top-4 -right-4 w-12 h-12 bg-orange-400 rounded-full blur-md"></div>
     <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400 rounded-full blur-md"></div>
     <GraduationCap className="w-24 h-24 text-primary drop-shadow-lg" />
  </div>
);