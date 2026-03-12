'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Lock, Shield, LogOut, ChevronRight, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocalState } from '@/hooks/useStore';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [user] = useLocalState<any>('pathshala_user', null);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    
    setIsUpdating(true);
    setMsg({ text: '', type: '' });

    try {
      // 1. Verify old password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) throw new Error("Incorrect current password.");

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setMsg({ text: 'Password successfully updated!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/'; 
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-primary/30">
      
      {/* Header */}
      <header className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black tracking-tight">Settings</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-md mx-auto w-full space-y-6">
        
        {/* Password Reset Section */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-black mb-4 flex items-center gap-2"><Lock size={18} className="text-primary"/> Change Password</h3>
          
          {msg.text && (
            <div className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {msg.type === 'success' && <CheckCircle size={14} />}
              {msg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <input 
              type="password" placeholder="Current Password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:border-primary outline-none"
            />
            <input 
              type="password" placeholder="New Password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:border-primary outline-none"
            />
            <button type="submit" disabled={isUpdating} className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50">
              {isUpdating ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Legal & About */}
        <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
           <Link href="/privacy-policy" className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400"><Shield size={18} /></div>
                <span className="font-bold text-sm">Privacy Policy</span>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
           </Link>
           <div className="flex items-center justify-between p-5">
              <span className="font-bold text-sm text-slate-500">App Version</span>
              <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">v1.0.0</span>
           </div>
        </div>

        {/* Logout Button */}
        <button onClick={() => setShowLogoutModal(true)} className="w-full bg-white dark:bg-surface-dark border-2 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 font-bold py-4 rounded-[1.5rem] shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2">
          <LogOut size={18} /> Sign Out of App
        </button>

        {/* UT Arts Branding */}
        <div className="mt-8 flex justify-center pb-8">
          <span className="flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
            Designed & Developed by
            <a href="https://www.utarts.in" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:text-blue-500 transition-colors flex items-center gap-1.5">
              <img src="https://www.utarts.in/images/UTArt_Logo.webp" alt="UT Arts" className="h-5 w-5 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
              UT Arts
              <ExternalLink size={10} />
            </a>
          </span>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut size={28} className="text-red-500 pl-1" />
            </div>
            <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white">Sign Out?</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Are you sure you want to log out of your Pathshala account?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200">Cancel</button>
              <button onClick={confirmLogout} className="flex-1 py-3.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}