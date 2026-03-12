'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Bell, CheckCircle2, Megaphone, FileText, AlertTriangle, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationSidebar({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) fetchNotifications();
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id: string, type: string) => {
    // Instantly update UI for snappy feel
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('app_notifications').update({ is_read: true }).eq('id', id);
    
    onClose();
    if (type === 'exam' || type === 'general') router.push('/notices');
    else if (type === 'payment') router.push(user.role === 'admin' ? '/admin/accounting' : '/profile');
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('app_notifications').update({ is_read: true }).eq('user_id', user.id);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="absolute top-0 right-0 w-[85vw] max-w-sm h-[100dvh] bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-300 p-6 flex flex-col border-l border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-primary w-5 h-5" /> Alerts
          </h2>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-4 shrink-0">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{unreadCount} Unread</span>
           {unreadCount > 0 && (
             <button onClick={markAllAsRead} className="text-[10px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
               <Check size={12}/> Mark all read
             </button>
           )}
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 pb-8">
           {loading ? (
             <p className="text-sm font-bold text-slate-400 animate-pulse text-center mt-10">Fetching alerts...</p>
           ) : notifications.length === 0 ? (
             <div className="text-center mt-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
               <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2 opacity-50" />
               <p className="text-sm font-bold text-slate-500">You're all caught up!</p>
             </div>
           ) : (
             notifications.map((n) => {
               const isExam = n.type === 'exam';
               const isPayment = n.type === 'payment';
               
               return (
                 <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id, n.type)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${n.is_read ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-70' : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary'}`} 
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 ${
                         isExam ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 
                         isPayment ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' : 
                         'bg-blue-50 text-blue-600 dark:bg-blue-900/30'
                       }`}>
                         {isExam ? <FileText size={10}/> : isPayment ? <AlertTriangle size={10}/> : <Megaphone size={10}/>}
                         {n.type}
                       </span>
                       {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>}
                    </div>
                    <h4 className={`text-sm font-bold line-clamp-1 mb-1 ${n.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>{n.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-3">{new Date(n.created_at).toLocaleString('en-GB', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                 </div>
               )
             })
           )}
        </div>
      </div>
    </div>
  );
}