'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, UserPlus, Mail, Lock, Phone, Armchair, CheckCircle, Banknote, QrCode, Percent } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocalState } from '@/hooks/useStore';

export default function AddStudentPage() {
  const router = useRouter();
  const [user] = useLocalState<any>('pathshala_user', null);
  const [baseFee, setBaseFee] = useState(500);
  
  useEffect(() => {
    supabase.from('app_settings').select('monthly_fee').single().then(({data}) => {
      if (data) setBaseFee(data.monthly_fee);
    });
  }, []);

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phone: '', seatNumber: ''
  });

  // Payment States
  const [collectFee, setCollectFee] = useState(true);
  const [discount, setDiscount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>('Cash');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData, collectFee, discount, paymentMode, adminId: user?.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create student');

      setSuccess(true);
      setTimeout(() => router.push('/admin/students'), 2000);
      
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-glow mb-6 animate-bounce">
          <CheckCircle size={48} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Registration Complete!</h1>
        <p className="text-slate-500 font-medium mt-2">Student added {collectFee && 'and first month fee recorded in ledger'}.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-primary/30">
      
      <header className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black tracking-tight">Add New Student</h1>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-md mx-auto w-full pb-20">
        
        {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-bold shadow-sm">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">Personal Information</h3>
            <div className="relative group">
              <UserPlus size={18} className="absolute left-4 top-4 text-slate-400" />
              <input required name="fullName" type="text" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:border-primary outline-none" />
            </div>
            <div className="relative group">
              <Phone size={18} className="absolute left-4 top-4 text-slate-400" />
              <input required name="phone" type="tel" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:border-primary outline-none" />
            </div>
            <div className="relative group">
              <Armchair size={18} className="absolute left-4 top-4 text-slate-400" />
              <input name="seatNumber" type="text" placeholder="Seat Number (Optional)" value={formData.seatNumber} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:border-primary outline-none" />
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark p-6 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">Login Credentials</h3>
            <div className="relative group">
              <Mail size={18} className="absolute left-4 top-4 text-slate-400" />
              <input required name="email" type="email" placeholder="Student Email" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:border-primary outline-none" />
            </div>
            <div className="relative group">
              <Lock size={18} className="absolute left-4 top-4 text-slate-400" />
              <input required name="password" type="text" placeholder="Set a Password" minLength={6} value={formData.password} onChange={handleChange} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:border-primary outline-none" />
            </div>
          </div>

          {/* INITIAL PAYMENT GATEWAY */}
          <div className={`p-6 rounded-[1.5rem] shadow-sm border-2 transition-all ${collectFee ? 'bg-white dark:bg-surface-dark border-primary shadow-glow' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-center justify-between mb-4">
               <div>
                 <h3 className="text-sm font-black text-slate-900 dark:text-white">Collect 1st Month Fee?</h3>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Base Fee: ₹{baseFee}</p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" className="sr-only peer" checked={collectFee} onChange={() => setCollectFee(!collectFee)} />
                 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
               </label>
            </div>

            {collectFee && (
               <div className="space-y-4 animate-in slide-in-from-top-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus-within:border-primary overflow-hidden px-3">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Percent size={14} /> <span className="text-xs font-bold uppercase tracking-widest">Discount</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input type="number" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value ? Number(e.target.value) : '')} className="w-16 bg-transparent py-2 text-right font-black text-primary outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setPaymentMode('Cash')} className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${paymentMode === 'Cash' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-500 font-semibold'}`}>
                      <Banknote size={18} /> Cash
                    </button>
                    <button type="button" onClick={() => setPaymentMode('UPI')} className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${paymentMode === 'UPI' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-500 font-semibold'}`}>
                      <QrCode size={18} /> UPI
                    </button>
                  </div>
               </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-black text-lg py-4 rounded-2xl shadow-xl active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50">
            {isSubmitting ? 'Registering...' : `Complete Registration ${collectFee ? `& Collect ₹${baseFee - (Number(discount)||0)}` : ''}`}
          </button>
        </form>
      </main>
    </div>
  );
}