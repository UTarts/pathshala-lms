'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Search, CheckCircle, AlertTriangle, X, Percent, QrCode, Banknote, Share2, Clock, ExternalLink, CalendarDays, Armchair } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocalState } from '@/hooks/useStore';

export default function EnterpriseAccountingPage() {
  const router = useRouter();
  const [user] = useLocalState<any>('pathshala_user', null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'collect' | 'ledger'>('overview');
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [baseFee, setBaseFee] = useState(500); 

  // In-App Error Notification State
  const [errorMsg, setErrorMsg] = useState('');

  // Drawer States
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [discount, setDiscount] = useState<number | ''>('');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>('Cash');
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  
  // 🚨 TRIPLE-TAP SECRET FEATURE STATES 🚨
  const [tapCount, setTapCount] = useState(0);
  const [secretDiscountUnlocked, setSecretDiscountUnlocked] = useState(false);

  // Triple-Tap Logic
  useEffect(() => {
    if (tapCount === 3) {
      setSecretDiscountUnlocked(prev => !prev);
      setTapCount(0); // Reset after unlocking
    }
    const timer = setTimeout(() => setTapCount(0), 600); // 600ms window to tap 3 times
    return () => clearTimeout(timer);
  }, [tapCount]);

  const handleSecretTap = () => {
    setTapCount(prev => prev + 1);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  useEffect(() => {
    fetchData();
    supabase.from('app_settings').select('monthly_fee').single().then(({data}) => {
      if (data) setBaseFee(data.monthly_fee);
    });
  }, []);

  const fetchData = async () => {
    // Fetch independently to prevent Foreign Key join failures
    const { data: profileData } = await supabase.from('profiles').select('*').neq('role', 'admin');
    const { data: payData } = await supabase.from('payments').select('*').order('transaction_date', { ascending: false });
    
    if (profileData) setStudents(profileData);
    if (payData) setPayments(payData);
    setLoading(false);
  };

  // --- CALENDAR MONTH LOGIC ---
  const generateMonths = () => {
    const months = [];
    const d = new Date();
    d.setDate(1); // Lock to 1st of month to avoid overflow bugs
    d.setMonth(d.getMonth() - 2); // Start from 2 months ago
    for(let i=0; i<6; i++) {
      months.push({
        id: d.toLocaleDateString('en-US', {month:'short', year:'numeric'}),
        dateObj: new Date(d)
      });
      d.setMonth(d.getMonth() + 1);
    }
    return months;
  };
  const availableMonths = generateMonths();
  const currentMonthStr = new Date().toLocaleDateString('en-US', {month:'short', year:'numeric'});

  const getStudentPaidMonths = (studentId: string) => {
    const studentPays = payments.filter(p => p.user_id === studentId);
    let paidList: string[] = [];
    studentPays.forEach(p => {
      if (p.payment_for_month) {
        paidList = [...paidList, ...p.payment_for_month.split(', ')];
      }
    });
    return paidList;
  };

  const toggleMonth = (m: string) => {
    setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  // --- MATH ENGINE ---
  const previousDues = selectedStudent?.outstanding_balance || 0;
  const currentCharges = selectedMonths.length * baseFee;
  const totalPayable = previousDues + currentCharges - (Number(discount) || 0);
  const leftOverDues = totalPayable - (Number(amountReceived) || 0);

  useEffect(() => {
    if (totalPayable > 0) setAmountReceived(totalPayable);
    else setAmountReceived('');
  }, [totalPayable]);

  const handleCollect = async () => {
    if (!selectedStudent || isSubmitting || Number(amountReceived) <= 0) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/collect-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          adminId: user?.id,
          amountPaid: Number(amountReceived),
          paymentMode,
          monthsSelected: selectedMonths,
          discount: Number(discount) || 0,
          newBalance: leftOverDues,
          extendMonths: selectedMonths.length
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReceiptData({
        id: data.payment.id, name: selectedStudent.full_name, phone: selectedStudent.phone,
        months: selectedMonths.length > 0 ? selectedMonths.join(', ') : 'Custom / Dues Only', 
        mode: paymentMode, 
        subtotal: currentCharges + previousDues, discount: Number(discount) || 0,
        paid: Number(amountReceived), balance: leftOverDues, date: new Date().toISOString()
      });
      
      setSelectedStudent(null);
      setSelectedMonths([]);
      setAmountReceived('');
      setDiscount('');
      setSecretDiscountUnlocked(false);
      fetchData(); 
    } catch (err: any) {
      showError("Transaction Failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DATA PROCESSING FOR UI ---
  // 1. Ledger Mapping (Safely attach names)
  const enrichedLedger = payments.map(pay => {
    const st = students.find(s => s.id === pay.user_id);
    return { ...pay, studentName: st ? st.full_name : 'Unknown User' };
  });
  const filteredLedger = enrichedLedger.filter(p => p.studentName.toLowerCase().includes(search.toLowerCase()));

  // 2. Student Roster Sorting & Mapping
  const enrichedStudents = students.map(s => {
    const seatNum = parseInt(s.seat_number) || 9999; // Unassigned go to bottom
    const paidMonths = getStudentPaidMonths(s.id);
    const lastPaid = paidMonths.length > 0 ? paidMonths[paidMonths.length - 1] : 'Never';
    return { ...s, numericSeat: seatNum, lastPaid };
  }).sort((a, b) => a.numericSeat - b.numericSeat); // Sort strictly by Seat Ascending

  const filteredStudents = enrichedStudents.filter(s => s.full_name?.toLowerCase().includes(search.toLowerCase()));

  // 3. Overview Monthly Aggregation
  const monthlyStats: Record<string, { total: number, upi: number, cash: number }> = {};
  payments.forEach(pay => {
    const d = new Date(pay.transaction_date);
    const mKey = d.toLocaleDateString('en-US', {month:'short', year:'numeric'});
    if (!monthlyStats[mKey]) monthlyStats[mKey] = { total: 0, upi: 0, cash: 0 };
    monthlyStats[mKey].total += pay.amount;
    if (pay.payment_mode === 'UPI') monthlyStats[mKey].upi += pay.amount;
    else monthlyStats[mKey].cash += pay.amount;
  });

  const currentMonthStats = monthlyStats[currentMonthStr] || { total: 0, upi: 0, cash: 0 };

  // --- RECEIPT SCREEN ---
  if (receiptData) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 font-display min-h-[100dvh] flex flex-col items-center p-6 pb-12 overflow-y-auto">
        <div className="w-full max-w-md flex justify-end mb-6 pt-4">
          <button onClick={() => { setReceiptData(null); setActiveTab('overview'); }} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full"><X size={24}/></button>
        </div>
        <div className="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-glow mb-6">
          <CheckCircle size={48} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Payment Saved</h1>
        
        <div className="w-full max-w-md bg-white dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-soft mt-4">
          <p className="text-center font-mono text-sm font-bold mb-4 border-b pb-4 dark:border-slate-700">#{receiptData.id.substring(0,8).toUpperCase()}</p>
          <div className="space-y-3 text-sm font-medium">
            <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="font-bold text-slate-900 dark:text-white">{receiptData.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Months</span><span className="font-bold text-slate-900 dark:text-white text-right max-w-[150px]">{receiptData.months}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Mode</span><span className="font-bold text-slate-900 dark:text-white">{receiptData.mode}</span></div>
            {receiptData.discount > 0 && <div className="flex justify-between text-primary"><span className="font-bold">Discount</span><span className="font-black">- ₹{receiptData.discount}</span></div>}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
            <span className="text-sm font-bold text-slate-500 uppercase">Received</span>
            <span className="text-3xl font-black text-green-600">₹{receiptData.paid}</span>
          </div>
          {receiptData.balance > 0 && (
             <div className="mt-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl flex justify-between items-center border border-red-100 dark:border-red-800/30">
               <span className="text-xs font-bold text-red-600 dark:text-red-400">Remaining Dues</span>
               <span className="font-black text-red-600 dark:text-red-400">₹{receiptData.balance}</span>
             </div>
          )}
        </div>

        <div className="w-full max-w-md mt-6 space-y-3">
          {sendWhatsapp && receiptData.phone && (
            <button onClick={() => window.open(`https://wa.me/${receiptData.phone.replace(/\D/g,'')}?text=Hello ${receiptData.name}, we received your payment of Rs.${receiptData.paid} for your Library Subscription. ${receiptData.balance > 0 ? `Your pending due is Rs.${receiptData.balance}. ` : ''}Thank you! - Pathshala`, '_blank')} className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
               <Share2 size={20} /> Share via WhatsApp
            </button>
          )}
          <button onClick={() => { setReceiptData(null); setActiveTab('overview'); }} className="w-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform">Back to Ledger</button>
        </div>

        {/* UT Arts Branding */}
        <div className="mt-8 flex justify-center pb-8 opacity-80">
          <span className="flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
            System by
            <a href="https://www.utarts.in" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:text-blue-500 transition-colors flex items-center gap-1.5">
              <img src="https://www.utarts.in/images/UTArt_Logo.webp" alt="UT Arts Logo" className="h-4 w-4 rounded-full object-cover shadow-sm border border-slate-200" />
              UT Arts
              <ExternalLink size={10} />
            </a>
          </span>
        </div>
      </div>
    )
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-[100dvh] flex flex-col relative overflow-hidden">
      
      {/* Custom Error Banner */}
      {errorMsg && (
        <div className="absolute top-0 left-0 w-full z-[60] bg-red-500 text-white px-4 py-3 flex items-center justify-center gap-2 font-bold text-sm shadow-md animate-in slide-in-from-top-full">
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}

      <header className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl shadow-sm border-b dark:border-slate-800 flex justify-between items-center">
        <button onClick={() => router.push('/')} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm"><ArrowLeft size={20}/></button>
        <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
           {['overview', 'collect', 'ledger'].map(t => (
             <button key={t} onClick={() => setActiveTab(t as any)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${activeTab === t ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>{t}</button>
           ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 max-w-md mx-auto w-full pb-32 hide-scrollbar">
        {loading ? <p className="text-center font-bold text-primary animate-pulse">Loading engine...</p> : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                
                {/* Live Current Month */}
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border dark:border-slate-700 relative overflow-hidden">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-400/10 rounded-full blur-2xl"></div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><CalendarDays size={14}/> Live Collection: {currentMonthStr}</p>
                   <h2 className="text-4xl font-black text-green-600 dark:text-green-400 tracking-tight">₹{currentMonthStats.total.toLocaleString()}</h2>
                   <div className="mt-4 flex gap-3 text-sm font-bold">
                     <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">UPI: ₹{currentMonthStats.upi}</span>
                     <span className="text-green-500 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-lg">Cash: ₹{currentMonthStats.cash}</span>
                   </div>
                </div>

                {/* History List */}
                <div>
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Historical Revenue</h3>
                   <div className="space-y-3">
                     {Object.keys(monthlyStats).filter(k => k !== currentMonthStr).length === 0 && <p className="text-xs text-slate-400 px-2 font-medium">No previous month records found.</p>}
                     {Object.keys(monthlyStats).filter(k => k !== currentMonthStr).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(monthKey => (
                        <div key={monthKey} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-700">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{monthKey}</span>
                          <span className="font-black text-lg text-slate-900 dark:text-white">₹{monthlyStats[monthKey].total.toLocaleString()}</span>
                        </div>
                     ))}
                   </div>
                </div>
                
                <button onClick={() => setActiveTab('collect')} className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform text-lg">Start Collection</button>
              </div>
            )}

            {/* COLLECT TAB */}
            {activeTab === 'collect' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" placeholder="Search Student..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm outline-none font-bold focus:border-primary" />
                </div>
                
                <div className="space-y-3">
                  {filteredStudents.length === 0 ? <p className="text-center font-bold text-slate-400 mt-6">No students found.</p> : filteredStudents.map(student => {
                    const dues = student.outstanding_balance || 0;
                    return (
                      <div key={student.id} onClick={() => setSelectedStudent(student)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform hover:border-primary">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center font-bold overflow-hidden border-2 border-slate-200">
                           {student.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover"/> : <span className="text-xs text-slate-400">S:{student.seat_number || '-'}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{student.full_name}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded"><Armchair size={10}/> Seat {student.seat_number || 'TBD'}</span>
                            <span>Paid: {student.lastPaid}</span>
                          </div>
                        </div>
                        {dues > 0 && <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase">Due: ₹{dues}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* FULL LEDGER TAB */}
            {activeTab === 'ledger' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                 <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" placeholder="Search Ledger by Name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm outline-none font-bold focus:border-primary" />
                </div>

                <div className="space-y-3">
                  {filteredLedger.length === 0 ? <p className="text-center font-bold text-slate-400 mt-6">No records match.</p> : filteredLedger.map(pay => (
                     <div key={pay.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border dark:border-slate-700 flex justify-between items-center">
                       <div className="flex-1 min-w-0 pr-4">
                         <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">{pay.studentName}</h4>
                         <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium"><Clock size={10}/> {new Date(pay.transaction_date).toLocaleString('en-GB', {day: '2-digit', month: 'short', hour:'2-digit', minute:'2-digit'})}</p>
                         <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-widest">For: {pay.payment_for_month || 'Custom'}</p>
                       </div>
                       <div className="flex flex-col items-end">
                         <span className={`font-black text-lg ${pay.payment_mode === 'UPI' ? 'text-blue-500' : 'text-green-500'}`}>+₹{pay.amount}</span>
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">{pay.payment_mode}</span>
                       </div>
                     </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* --- COLLECTION DRAWER (SMART MONTHS & TRIPLE TAP) --- */}
      {selectedStudent && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" onClick={() => {setSelectedStudent(null); setSelectedMonths([]); setDiscount(''); setAmountReceived(''); setSecretDiscountUnlocked(false);}}></div>
          <div className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 border-t border-slate-200 dark:border-slate-800">
            
            <div className="w-full flex justify-center pt-4 pb-2" onClick={() => {setSelectedStudent(null); setSelectedMonths([]);}}>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer"></div>
            </div>

            <div className="px-6 py-4 max-h-[85vh] overflow-y-auto hide-scrollbar pb-safe">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Collect Fee From</p>
                   <h2 className="text-xl font-black">{selectedStudent.full_name}</h2>
                 </div>
                 {previousDues > 0 && (
                   <div className="bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800/30 text-right">
                     <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Previous Dues</p>
                     <p className="font-black text-red-600 text-lg">₹{previousDues}</p>
                   </div>
                 )}
               </div>

               {/* SMART MONTH SELECTOR */}
               <div className="mb-6">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Mark Months Paid</label>
                 <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                   {availableMonths.map(mObj => {
                     const isAlreadyPaid = getStudentPaidMonths(selectedStudent.id).includes(mObj.id);
                     const isPastOrCurrent = mObj.dateObj <= new Date(); // True if month is in past or is current month
                     
                     let btnClass = "";
                     if (isAlreadyPaid) {
                        btnClass = "bg-green-100 text-green-700 dark:bg-green-900/30 border-green-200 dark:border-green-800 opacity-60 cursor-not-allowed"; // Paid
                     } else if (selectedMonths.includes(mObj.id)) {
                        btnClass = "border-primary bg-primary text-white shadow-md"; // Currently Selecting
                     } else if (isPastOrCurrent) {
                        btnClass = "border-red-300 dark:border-red-700/50 bg-red-50/50 dark:bg-red-900/10 text-red-600 dark:text-red-400"; // Due / Overdue
                     } else {
                        btnClass = "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"; // Future Unpaid
                     }

                     return (
                       <button 
                         key={mObj.id} 
                         disabled={isAlreadyPaid}
                         onClick={() => toggleMonth(mObj.id)}
                         className={`shrink-0 px-4 py-2 rounded-xl font-bold transition-all border-2 text-xs flex flex-col items-center ${btnClass}`}
                       >
                         {mObj.id}
                         {isAlreadyPaid && <span className="text-[8px] uppercase font-black mt-0.5">Paid</span>}
                       </button>
                     )
                   })}
                 </div>
               </div>

               {/* Smart Billing Box */}
               <div className="bg-slate-50 dark:bg-slate-800/80 rounded-[1.5rem] p-5 border border-slate-100 dark:border-slate-700 mb-6 space-y-4">
                  
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400 select-none">
                    <span>Current Charges ({selectedMonths.length}x)</span>
                    <span className="text-slate-900 dark:text-white">₹{currentCharges}</span>
                  </div>
                  
                  {/* HIDDEN DISCOUNT ROW */}
                  {secretDiscountUnlocked && (
                    <div className="flex justify-between items-center border-t border-dashed border-slate-200 dark:border-slate-600 pt-4 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Percent size={16} /> <span className="text-sm font-bold">Apply Discount</span></div>
                      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 focus-within:border-primary transition-colors">
                        <span className="text-slate-400 font-bold">₹</span>
                        <input type="number" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value ? Number(e.target.value) : '')} className="w-16 bg-transparent py-1.5 text-right font-black text-primary outline-none" />
                      </div>
                    </div>
                  )}

                  {/* 🚨 THE SECRET TRIPLE-TAP TRIGGER 🚨 */}
                  <div onClick={handleSecretTap} className="flex justify-between items-end border-t border-slate-200 dark:border-slate-700 pt-4 select-none cursor-pointer">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Payable</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">₹{totalPayable}</span>
                  </div>
               </div>

               {/* Custom Amount Received */}
               <div className="mb-6 flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] border-2 border-primary/30 shadow-sm focus-within:border-primary transition-colors">
                  <div>
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Amount Handed to You</label>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Leftover will be marked Due</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-slate-300 mr-1">₹</span>
                    <input 
                      type="number" value={amountReceived} onChange={e => setAmountReceived(e.target.value ? Number(e.target.value) : '')}
                      className="w-24 text-right text-3xl font-black text-slate-900 dark:text-white bg-transparent outline-none"
                    />
                  </div>
               </div>

               {/* Real-time Balance Calculator */}
               {leftOverDues > 0 && Number(amountReceived) > 0 && (
                  <p className="text-center text-sm font-bold text-red-500 mb-6 bg-red-50 dark:bg-red-900/20 py-2 rounded-lg border border-red-100">
                    ₹{leftOverDues} will be carried over as Due.
                  </p>
               )}

               <div className="grid grid-cols-2 gap-3 mb-6">
                 <button onClick={() => setPaymentMode('Cash')} className={`py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${paymentMode === 'Cash' ? 'border-primary bg-primary/10 shadow-sm text-primary font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500'}`}><Banknote size={20} /> Cash</button>
                 <button onClick={() => setPaymentMode('UPI')} className={`py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${paymentMode === 'UPI' ? 'border-primary bg-primary/10 shadow-sm text-primary font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500'}`}><QrCode size={20} /> UPI</button>
               </div>

               <button onClick={handleCollect} disabled={isSubmitting || Number(amountReceived) <= 0} className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-black text-lg py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-transform flex justify-center items-center gap-2 disabled:opacity-50">
                 {isSubmitting ? 'Securing Data...' : `Submit Transaction`}
               </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}