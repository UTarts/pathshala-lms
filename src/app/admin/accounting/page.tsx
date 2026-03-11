'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Search, CheckCircle, AlertTriangle, Receipt, X, Percent, QrCode, Banknote, Share2, Home, Clock } from 'lucide-react';
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

  // --- DRAWER STATES ---
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [discount, setDiscount] = useState<number | ''>('');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>('Cash');
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  
  // Secret UI trigger
  const [secretDiscountUnlocked, setSecretDiscountUnlocked] = useState(false);

  useEffect(() => {
    fetchData();
    supabase.from('app_settings').select('monthly_fee').single().then(({data}) => {
      if (data) setBaseFee(data.monthly_fee);
    });
  }, []);

  const fetchData = async () => {
    const { data: profileData } = await supabase.from('profiles').select('*').neq('role', 'admin').order('full_name');
    const { data: payData } = await supabase.from('payments').select('*, profiles(full_name)').order('transaction_date', { ascending: false });
    if (profileData) setStudents(profileData);
    if (payData) setPayments(payData);
    setLoading(false);
  };

  // Generate dynamic months (2 previous, current, 3 next)
  const getDynamicMonths = () => {
    const months = [];
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    for(let i=0; i<6; i++) {
      months.push(d.toLocaleDateString('en-GB', {month:'short', year:'2-digit'}));
      d.setMonth(d.getMonth() + 1);
    }
    return months;
  };
  const availableMonths = getDynamicMonths();

  // --- MATHEMATICS ENGINE ---
  const toggleMonth = (m: string) => {
    setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const previousDues = selectedStudent?.outstanding_balance || 0;
  const currentCharges = selectedMonths.length * baseFee;
  const totalPayable = previousDues + currentCharges - (Number(discount) || 0);
  const leftOverDues = totalPayable - (Number(amountReceived) || 0);

  // Auto-fill amount received when total changes
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
        months: selectedMonths.join(', '), mode: paymentMode, 
        subtotal: currentCharges + previousDues, discount: Number(discount) || 0,
        paid: Number(amountReceived), balance: leftOverDues, date: new Date().toISOString()
      });
      
      setSelectedStudent(null);
      fetchData(); 
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 1. RECEIPT SCREEN ---
  if (receiptData) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 font-display min-h-screen flex flex-col items-center p-6 pb-12 selection:bg-primary/30">
        <div className="w-full max-w-md flex justify-end mb-6 pt-4">
          <button onClick={() => { setReceiptData(null); setActiveTab('overview'); }} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full"><X size={24}/></button>
        </div>
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/30 blur-[40px] rounded-full scale-150 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-glow">
            <CheckCircle size={48} className="text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Payment Saved</h1>
        
        <div className="w-full max-w-md bg-white dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-soft mt-4">
          <p className="text-center font-mono text-sm font-bold mb-4 border-b pb-4 dark:border-slate-700">#{receiptData.id.substring(0,8).toUpperCase()}</p>
          <div className="space-y-3 text-sm font-medium">
            <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="font-bold text-slate-900 dark:text-white">{receiptData.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Months</span><span className="font-bold text-slate-900 dark:text-white text-right max-w-[150px]">{receiptData.months || 'None'}</span></div>
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
      </div>
    )
  }

  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const upiRevenue = payments.filter(p => p.payment_mode === 'UPI').reduce((acc, curr) => acc + curr.amount, 0);
  const filteredStudents = students.filter(s => s.full_name?.toLowerCase().includes(search.toLowerCase()));

  // --- 2. MAIN DASHBOARD ---
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col relative">
      <header className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl shadow-sm border-b dark:border-slate-800 flex justify-between items-center">
        <button onClick={() => router.push('/')} className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm"><ArrowLeft size={20}/></button>
        <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
           {['overview', 'collect', 'ledger'].map(t => (
             <button key={t} onClick={() => setActiveTab(t as any)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${activeTab === t ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>{t}</button>
           ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 max-w-md mx-auto w-full pb-32">
        {loading ? <p className="text-center font-bold text-primary animate-pulse">Loading...</p> : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border dark:border-slate-700">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Banknote size={14}/> Total Revenue</p>
                   <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">₹{totalRevenue.toLocaleString()}</h2>
                   <div className="mt-4 flex gap-3 text-sm font-bold">
                     <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">UPI: ₹{upiRevenue}</span>
                     <span className="text-green-500 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-lg">Cash: ₹{totalRevenue - upiRevenue}</span>
                   </div>
                </div>
                <button onClick={() => setActiveTab('collect')} className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform text-lg">Start Collection</button>
              </div>
            )}

            {/* COLLECT */}
            {activeTab === 'collect' && (
              <div className="space-y-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" placeholder="Search Student..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm outline-none font-bold" />
                </div>
                <div className="space-y-3">
                  {filteredStudents.map(student => {
                    const dues = student.outstanding_balance || 0;
                    return (
                      <div key={student.id} onClick={() => setSelectedStudent(student)} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border dark:border-slate-700 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xl">{student.full_name?.[0]}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{student.full_name}</h4>
                          <p className="text-xs font-medium text-slate-500">{student.phone}</p>
                        </div>
                        {dues > 0 && <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase">Due: ₹{dues}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* LEDGER */}
            {activeTab === 'ledger' && (
              <div className="space-y-3">
                {payments.map(pay => (
                   <div key={pay.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border dark:border-slate-700 flex justify-between items-center">
                     <div className="flex-1 min-w-0 pr-4">
                       <h4 className="font-bold text-sm truncate">{pay.profiles?.full_name}</h4>
                       <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1"><Clock size={10}/> {new Date(pay.transaction_date).toLocaleDateString('en-GB')} • {pay.payment_mode}</p>
                     </div>
                     <span className="font-black text-lg text-primary">+₹{pay.amount}</span>
                   </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* --- COLLECTION DRAWER (PARTIAL PAYMENTS & SECRET DISCOUNT) --- */}
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

               {/* Month Selector */}
               <div className="mb-6">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Mark Months Paid</label>
                 <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                   {availableMonths.map(m => (
                     <button 
                       key={m} onClick={() => toggleMonth(m)}
                       className={`shrink-0 px-4 py-2 rounded-xl font-bold transition-all border-2 text-sm ${selectedMonths.includes(m) ? 'border-primary bg-primary text-white shadow-md' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                     >
                       {m}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Smart Billing Box */}
               <div className="bg-slate-50 dark:bg-slate-800/80 rounded-[1.5rem] p-5 border border-slate-100 dark:border-slate-700 mb-6 space-y-4">
                  
                  {/* DOUBLE CLICK HERE FOR SECRET DISCOUNT */}
                  <div onDoubleClick={() => setSecretDiscountUnlocked(!secretDiscountUnlocked)} className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                    <span>Current Charges ({selectedMonths.length}x)</span>
                    <span className="text-slate-900 dark:text-white">₹{currentCharges}</span>
                  </div>
                  
                  {secretDiscountUnlocked && (
                    <div className="flex justify-between items-center border-t border-dashed border-slate-200 dark:border-slate-600 pt-4 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Percent size={16} /> <span className="text-sm font-bold">Apply Discount</span></div>
                      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2">
                        <span className="text-slate-400 font-bold">₹</span>
                        <input type="number" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value ? Number(e.target.value) : '')} className="w-16 bg-transparent py-1.5 text-right font-black text-primary outline-none" />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-700 pt-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Payable</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">₹{totalPayable}</span>
                  </div>
               </div>

               {/* Custom Amount Received */}
               <div className="mb-6 flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] border-2 border-primary/30 shadow-sm focus-within:border-primary transition-colors">
                  <div>
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Actual Amount Received</label>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Leftover will be marked as Due</p>
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
                    ₹{leftOverDues} will be added to Pending Dues
                  </p>
               )}

               <div className="grid grid-cols-2 gap-3 mb-6">
                 <button onClick={() => setPaymentMode('Cash')} className={`py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${paymentMode === 'Cash' ? 'border-primary bg-primary/10 shadow-sm text-primary font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500'}`}><Banknote size={20} /> Cash</button>
                 <button onClick={() => setPaymentMode('UPI')} className={`py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${paymentMode === 'UPI' ? 'border-primary bg-primary/10 shadow-sm text-primary font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500'}`}><QrCode size={20} /> UPI</button>
               </div>

               <button onClick={handleCollect} disabled={isSubmitting || Number(amountReceived) <= 0} className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-black text-lg py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-transform flex justify-center items-center gap-2 disabled:opacity-50">
                 {isSubmitting ? 'Securing...' : `Submit Payment`}
               </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}