'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Search, User, Phone, MapPin, Receipt, Trophy, Calendar, CheckCircle, AlertTriangle, Edit3, Save, X, Armchair } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';

export default function StudentRosterPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Deep Dive State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentPayments, setStudentPayments] = useState<any[]>([]);
  const [studentQuizzes, setStudentQuizzes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'quizzes'>('info');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editSeat, setEditSeat] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase.from('profiles').select('*').neq('role', 'admin').order('full_name');
    if (data) setStudents(data);
    setLoading(false);
  };

  const openStudentProfile = async (student: any) => {
    setSelectedStudent(student);
    setEditSeat(student.seat_number || '');
    setActiveTab('info');
    
    // Fetch deep history
    const [payRes, quizRes] = await Promise.all([
      supabase.from('payments').select('*').eq('user_id', student.id).order('transaction_date', { ascending: false }),
      supabase.from('quiz_attempts').select('*, quiz_sets(title)').eq('user_id', student.id).order('created_at', { ascending: false })
    ]);

    setStudentPayments(payRes.data || []);
    setStudentQuizzes(quizRes.data || []);
  };

  const saveStudentDetails = async () => {
    await supabase.from('profiles').update({ seat_number: editSeat }).eq('id', selectedStudent.id);
    setIsEditing(false);
    setSelectedStudent({ ...selectedStudent, seat_number: editSeat });
    fetchStudents(); // Refresh background list
  };

  const filteredStudents = students.filter(s => s.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-primary/30">
      
      {/* Header */}
      <header className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black tracking-tight">Student Roster</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{students.length} Total Users</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-md mx-auto w-full pb-10">
        <div className="relative mb-6 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-sm font-bold shadow-sm focus:border-primary outline-none transition-colors"
          />
        </div>

        {loading ? <p className="animate-pulse text-center text-primary font-bold py-10">Loading database...</p> : (
          <div className="space-y-3">
            {filteredStudents.map(student => {
              const daysLeft = student.subscription_end_date ? Math.ceil((new Date(student.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
              const isExpired = daysLeft <= 0;

              return (
                <div key={student.id} onClick={() => openStudentProfile(student)} className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:border-primary transition-all active:scale-[0.98]">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-xl shrink-0">
                    {student.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover"/> : student.full_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{student.full_name}</h4>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><Armchair size={12}/> Seat: {student.seat_number || 'None'}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${isExpired ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30'}`}>
                    {isExpired ? 'EXPIRED' : 'ACTIVE'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* --- DEEP DIVE STUDENT DRAWER --- */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-end" onClick={() => {setSelectedStudent(null); setIsEditing(false);}}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-[90vh] rounded-t-[2.5rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 border-t border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div className="p-6 pb-0 flex flex-col items-center relative">
              <button onClick={() => {setSelectedStudent(null); setIsEditing(false);}} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={20}/></button>
              
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-primary shadow-lg flex items-center justify-center text-4xl font-black text-slate-400 mb-3">
                {selectedStudent.photo_url ? <img src={selectedStudent.photo_url} className="w-full h-full object-cover"/> : selectedStudent.full_name?.[0]}
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{selectedStudent.full_name}</h2>
              <p className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full mt-2">ID: {selectedStudent.id.substring(0,8).toUpperCase()}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 mt-6 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button onClick={() => setActiveTab('info')} className={`pb-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}>Overview</button>
              <button onClick={() => setActiveTab('payments')} className={`pb-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}>Financials</button>
              <button onClick={() => setActiveTab('quizzes')} className={`pb-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'quizzes' ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}>Academics</button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
              
              {/* TAB: INFO */}
              {activeTab === 'info' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><User size={14}/> Contact Details</p>
                    <div className="space-y-3 font-semibold text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Email</span><span>{selectedStudent.email || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Phone</span><span>{selectedStudent.phone || 'N/A'}</span></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={14}/> Library Details</p>
                      {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="text-primary text-xs font-bold flex items-center gap-1"><Edit3 size={12}/> Edit</button>
                      ) : (
                        <button onClick={saveStudentDetails} className="bg-primary text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><Save size={12}/> Save</button>
                      )}
                    </div>
                    <div className="space-y-3 font-semibold text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Seat Number</span>
                        {isEditing ? (
                          <input type="text" value={editSeat} onChange={e => setEditSeat(e.target.value)} className="w-24 border rounded px-2 py-1 text-right dark:bg-slate-900" />
                        ) : (
                          <span className="text-primary-dark dark:text-primary font-black">{selectedStudent.seat_number || 'Unassigned'}</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Expiry Date</span>
                        <span className={new Date(selectedStudent.subscription_end_date) < new Date() ? 'text-red-500' : 'text-green-500'}>
                          {selectedStudent.subscription_end_date ? new Date(selectedStudent.subscription_end_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PAYMENTS */}
              {activeTab === 'payments' && (
                <div className="space-y-3 animate-in fade-in">
                  {studentPayments.length === 0 ? <p className="text-center text-slate-400 text-sm mt-4">No payments found.</p> : 
                    studentPayments.map(pay => (
                      <div key={pay.id} className="p-4 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">₹{pay.amount} • {pay.payment_mode}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(pay.transaction_date).toLocaleDateString()} ({pay.payment_for_month})</p>
                        </div>
                        <CheckCircle size={20} className="text-green-500"/>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* TAB: QUIZZES */}
              {activeTab === 'quizzes' && (
                <div className="space-y-3 animate-in fade-in">
                  {studentQuizzes.length === 0 ? <p className="text-center text-slate-400 text-sm mt-4">No exams taken.</p> : 
                    studentQuizzes.map(quiz => (
                      <div key={quiz.id} className="p-4 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl flex justify-between items-center">
                        <div className="flex-1 pr-4">
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{quiz.quiz_sets?.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(quiz.created_at).toLocaleDateString()} • Acc: {Math.round((quiz.correct_count / (quiz.correct_count + quiz.wrong_count + quiz.unanswered_count))*100)}%</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${quiz.score > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {quiz.score}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <BottomNav activeTab="students" onTabChange={(tab) => {
               if (tab === 'home') router.push('/');
               if (tab === 'scan') alert('QR Scanner opening...');
               if (tab === 'profile') router.push('/?tab=profile');
            }} />
    </div>
  );
}