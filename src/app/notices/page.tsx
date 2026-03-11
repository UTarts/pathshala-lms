'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Bell, Download, Calendar, Megaphone, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';

export default function NoticeBoardPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'exam' | 'general'>('All');

  useEffect(() => {
    const fetchNotices = async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setNotices(data);
      setLoading(false);
    };
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter(n => activeTab === 'All' || n.type === activeTab);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800 px-5 pt-10 pb-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors text-slate-700 dark:text-slate-200">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none">Notice Board</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Official Updates</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-6 overflow-x-auto hide-scrollbar">
          {['All', 'exam', 'general'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm ${
                activeTab === tab 
                  ? 'bg-indigo-500 text-white shadow-indigo-500/30' 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Main Feed */}
      <main className="flex-1 px-5 py-6 space-y-4 max-w-md mx-auto w-full pb-32">
        {loading ? (
           <p className="text-center text-slate-500 text-sm font-bold animate-pulse py-10">Fetching announcements...</p>
        ) : filteredNotices.length === 0 ? (
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center shadow-sm">
             <Bell className="mx-auto w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
             <p className="text-sm font-bold text-slate-500">No notices in this category.</p>
           </div>
        ) : (
          filteredNotices.map((notice) => {
            const isExam = notice.type === 'exam';
            
            return (
              <div key={notice.id} className="bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] shadow-soft border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-shadow">
                
                {/* Decorative Glow */}
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${isExam ? 'bg-red-500' : 'bg-blue-500'}`}></div>

                <div className="flex justify-between items-start mb-3 relative z-10">
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border flex items-center gap-1 ${
                    isExam ? 'bg-red-50 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-blue-200 dark:border-blue-800'
                  }`}>
                    {isExam ? <FileText size={10} /> : <Megaphone size={10} />}
                    {isExam ? 'Exam Alert' : 'General'}
                  </span>
                  
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Calendar size={12} />
                    {new Date(notice.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug mb-2">{notice.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {notice.content}
                  </p>
                </div>

                {notice.file_url && (
                  <button 
                    onClick={() => window.open(notice.file_url, '_blank')}
                    className="mt-5 w-full bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors active:scale-95 shadow-sm relative z-10"
                  >
                    <Download size={16} /> Download Attachment
                  </button>
                )}
              </div>
            )
          })
        )}
      </main>

      <BottomNav activeTab="notices" onTabChange={(tab) => {
         if (tab === 'home') router.push('/');
         if (tab === 'scan') alert('QR Scanner coming soon!');
         if (tab === 'profile') router.push('/?tab=profile');
      }} />
    </div>
  );
}