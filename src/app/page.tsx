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
import { GraduationCap, Star, User, Lock, ArrowRight, Eye, QrCode, Loader2, ExternalLink } from 'lucide-react';

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

  // --- MINIMAL, FIXED, APP-LIKE LOGIN SCREEN ---
  if (!user) {
    return (
      <main className="h-[100dvh] w-full relative flex flex-col items-center overflow-hidden bg-background-light dark:bg-background-dark">
        
        {/* TOP RIGHT THEME TOGGLE */}
        <div className="absolute top-5 right-5 z-20">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <ThemeToggle />
          </div>
        </div>

        {/* LIGHTWEIGHT BACKGROUND BLOBS */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-[60px]"></div>
          <div className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-blue-300/10 rounded-full blur-[80px]"></div>
        </div>

        {/* CENTER CONTENT */}
        <div className="flex-1 w-full max-w-md flex flex-col justify-center items-center px-6 z-10 pt-10 pb-20 overflow-y-auto hide-scrollbar">
          
          <div className="flex flex-col items-center mb-8 shrink-0">
            <img src="/logo.webp" alt="Pathshala Logo" className="w-28 h-28 rounded-full object-cover shadow-xl border-4 border-white dark:border-slate-800 mb-5" />
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 text-center tracking-tight">
              Pathshala
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1.5 text-center uppercase tracking-widest">
              The Self Study Digital Library
            </p>
          </div>

          {/* COMPACT LOGIN FORM */}
          <div className="w-full glass-card rounded-[2rem] p-6 shadow-xl shadow-primary/5 shrink-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">Login</h2>
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input name="email" type="email" required placeholder="Email Address" className="w-full bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block pl-12 p-4 transition-all placeholder:text-slate-400 font-medium outline-none" />
              </div>
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input name="password" type={showPassword ? "text" : "password"} required placeholder="Password" className="w-full bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block pl-12 p-4 transition-all placeholder:text-slate-400 font-medium outline-none" />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                </div>
              </div>
              
              <button disabled={loading} type="submit" className="mt-2 w-full bg-primary hover:bg-primary-dark text-white text-lg font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform flex items-center justify-center gap-2">
                  {loading ? 'Authenticating...' : 'Sign In'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>

        {/* FIXED FOOTER (UT ARTS BRANDING) */}
        <div className="absolute bottom-0 left-0 w-full pb-6 pt-4 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent z-20 flex justify-center pointer-events-none">
          <span className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 pointer-events-auto">
            Designed & Developed by
            <a href="https://www.utarts.in" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:text-blue-500 transition-colors flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm">
              <img src="https://www.utarts.in/images/UTArt_Logo.webp" alt="UT Arts Logo" className="h-4 w-4 rounded-full object-cover" />
              UT Arts
              <ExternalLink size={10} className="ml-0.5" />
            </a>
          </span>
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