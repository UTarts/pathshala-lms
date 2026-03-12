'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Camera, LogOut, CheckCircle, History, BadgeCheck, Phone, Armchair, Settings, Database, Banknote, ShieldCheck, Download, Save, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle'; 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ProfileSection({ user, onProfileUpdate }: { user: any, onProfileUpdate: () => void }) {
  const router = useRouter();
  
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now()); 
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  // Admin Specific
  const [baseFee, setBaseFee] = useState(500);
  const [savingFee, setSavingFee] = useState(false);
  const [revenueStats, setRevenueStats] = useState({ total: 0, cash: 0, upi: 0 });

  useEffect(() => {
    if (user.role === 'admin') fetchAdminStats();
    else fetchMemberPayments();
  }, [user]);

  const fetchMemberPayments = async () => {
    const { data } = await supabase.from('payments').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false });
    if (data) setPayments(data);
    setLoading(false);
  };

  const fetchAdminStats = async () => {
    const { data: settings } = await supabase.from('app_settings').select('monthly_fee').single();
    if (settings) setBaseFee(settings.monthly_fee);

    const { data: pays } = await supabase.from('payments').select('amount, payment_mode');
    if (pays) {
      let cash = 0, upi = 0, total = 0;
      pays.forEach(p => {
        total += p.amount;
        if (p.payment_mode === 'UPI') upi += p.amount;
        else cash += p.amount;
      });
      setRevenueStats({ total, cash, upi });
    }
    setLoading(false);
  };

  const saveBaseFee = async () => {
    setSavingFee(true);
    await supabase.from('app_settings').upsert({ id: 'global', monthly_fee: baseFee });
    setSavingFee(false);
    alert('Global Monthly Fee Updated!');
  };

  const handlePhotoUpload = async (e: any) => {
    // ... (Keep existing photo logic)
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${user.id}_${Date.now()}.jpg`; 
    try {
      const { error } = await supabase.storage.from('avatars').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ photo_url: data.publicUrl }).eq('id', user.id);
      setImageRefreshKey(Date.now());
      onProfileUpdate(); 
    } catch (error: any) { alert("Upload failed."); } 
    finally { setIsUploading(false); }
  };

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/'; 
  };

  // --- PDF GENERATOR ---
  const downloadReceipt = async (pay: any, discountAmt: number) => {
    setGeneratingPdfId(pay.id);
    const element = document.getElementById(`receipt-${pay.id}`);
    if (!element) return;

    element.style.display = 'block'; // Unhide for render

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Pathshala_Receipt_${pay.id.substring(0,8)}.pdf`);
    } catch (err) {
      alert("Failed to generate PDF. Make sure logo.webp exists in public folder.");
    } finally {
      element.style.display = 'none'; // Hide again
      setGeneratingPdfId(null);
    }
  };

  // --- ADMIN COMMAND CENTER (Unchanged from previous except base logic) ---
  if (user.role === 'admin') {
    const cashPct = revenueStats.total > 0 ? (revenueStats.cash / revenueStats.total) * 100 : 50;
    const upiPct = revenueStats.total > 0 ? (revenueStats.upi / revenueStats.total) * 100 : 50;

    return (
      <div className="flex-1 px-4 w-full max-w-md mx-auto flex flex-col gap-6 pt-6 pb-28 animate-in fade-in relative font-display">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Settings & Config</h1>
          <div className="flex items-center gap-3">
             <ThemeToggle />
             <button onClick={() => router.push('/settings')} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm">
               <Settings size={20} />
             </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
           <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-600 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-400">
                 {user.photo_url ? <img src={`${user.photo_url}?v=${imageRefreshKey}`} className="w-full h-full object-cover" /> : user.full_name?.[0]}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full cursor-pointer shadow-md hover:scale-105 transition-transform"><Camera size={12} /><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} /></label>
           </div>
           <div>
             <h2 className="text-lg font-black text-slate-900 dark:text-white">{user.full_name}</h2>
             <p className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md mt-1 uppercase tracking-widest w-fit flex items-center gap-1"><ShieldCheck size={10}/> Root Admin</p>
           </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-1"><Settings size={14}/> Core Settings</h3>
          <div className="bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <div><h4 className="font-bold text-sm">Monthly Base Fee</h4><p className="text-[10px] text-slate-500">Default price for billing.</p></div>
              <div className="flex items-center bg-slate-50 dark:bg-slate-900 border rounded-lg px-2 py-1 w-24 focus-within:border-primary"><span className="text-slate-400 font-bold">₹</span><input type="number" value={baseFee} onChange={(e) => setBaseFee(Number(e.target.value))} className="w-full bg-transparent outline-none text-right font-black text-primary" /></div>
            </div>
            <button onClick={saveBaseFee} disabled={savingFee} className="w-full bg-slate-100 hover:bg-primary hover:text-white dark:bg-slate-800 text-xs font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2">{savingFee ? 'Saving...' : <><Save size={14}/> Save Config</>}</button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-1"><Database size={14}/> Analytics</h3>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[1.5rem] shadow-card border border-slate-100 dark:border-slate-800">
            <div className="flex items-end justify-center gap-6 h-32 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
               <div className="w-16 flex flex-col items-center justify-end h-full"><span className="text-[10px] font-bold text-slate-400 mb-1">₹{revenueStats.cash}</span><div className="w-full bg-green-400 rounded-t-xl" style={{height: `${Math.max(10, cashPct)}%`}}></div></div>
               <div className="w-16 flex flex-col items-center justify-end h-full"><span className="text-[10px] font-bold text-slate-400 mb-1">₹{revenueStats.upi}</span><div className="w-full bg-blue-500 rounded-t-xl" style={{height: `${Math.max(10, upiPct)}%`}}></div></div>
            </div>
            <div className="flex justify-center gap-8 text-xs font-bold text-slate-600 dark:text-slate-300"><div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-400 rounded-full"></div> Cash</div><div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> UPI</div></div>
          </div>
        </div>

        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"><div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl text-center"><LogOut size={28} className="mx-auto text-red-500 mb-2"/><h3 className="text-xl font-black mb-4">Sign Out?</h3><div className="flex gap-3"><button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-slate-100">Cancel</button><button onClick={confirmLogout} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white">Sign Out</button></div></div></div>
        )}
      </div>
    );
  }

  // --- MEMBER PROFILE VIEW ---
  const daysLeft = user.subscription_end_date ? Math.ceil((new Date(user.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
  const isActive = daysLeft > 0;
  const dues = user.outstanding_balance || 0;

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col gap-6 pt-6 pb-28 overflow-x-hidden relative font-display">
      <div className="flex items-center justify-between px-5">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Digital ID</h1>
        <div className="flex items-center gap-3">
           <ThemeToggle />
           <button onClick={() => router.push('/settings')} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm">
             <Settings size={20} />
           </button>
        </div>
      </div>

      <div className="px-5 w-full space-y-6">
        
        {/* Holographic ID */}
        <div className="w-full relative perspective-1000">
          <div className="holographic-card rounded-[2rem] shadow-glow p-6 flex flex-col items-center gap-4 bg-white dark:bg-slate-800 relative z-10 border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="w-full flex justify-between items-start mb-2 relative z-10">
              <div className="flex items-center gap-2">
                <img src="/logo.webp" alt="Logo" className="w-8 h-8 rounded-xl shadow-md border-2 border-white object-cover" />
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-tight">Pathshala<br/>Library</div>
              </div>
              <span className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-sm ${isActive ? 'bg-primary/10 text-primary-dark border-primary/20' : 'bg-red-50 text-red-600 border-red-200'}`}>{isActive ? 'Active Student' : 'Expired'}</span>
            </div>
            <div className="relative mt-2 z-10">
              <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-primary to-blue-400 shadow-xl"><div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-slate-100 flex items-center justify-center font-black text-4xl text-slate-400">{user.photo_url ? <img src={`${user.photo_url}?v=${imageRefreshKey}`} className="w-full h-full object-cover" /> : user.full_name?.[0]}</div></div>
              <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-slate-100 cursor-pointer hover:scale-110 transition-transform"><Camera size={16} className="text-slate-700" /><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} /></label>
              {isActive && <div className="absolute top-0 right-0 bg-white rounded-full p-0.5 shadow-md"><BadgeCheck className="text-primary" size={24} /></div>}
            </div>
            <div className="text-center space-y-1 w-full mt-2 relative z-10">
              <h2 className="text-2xl font-black truncate px-2 text-slate-900 dark:text-white">{user.full_name}</h2>
              <div className="flex items-center justify-center gap-3 text-slate-600 text-sm font-semibold mt-2 bg-slate-50 dark:bg-slate-900/50 py-2 rounded-xl border border-slate-100 w-[90%] mx-auto shadow-sm">
                 <span className="flex items-center gap-1.5"><Phone size={14}/> {user.phone || 'No Phone'}</span><span className="opacity-30">|</span><span className="flex items-center gap-1.5"><Armchair size={14}/> Seat: <span className="text-primary-dark">{user.seat_number || 'TBD'}</span></span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono tracking-widest uppercase mt-4">ID: PATH-{user.id.substring(0, 6)}</p>
            </div>
          </div>
        </div>

        {/* Dues Warning */}
        {dues > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-500" />
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Action Required</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">Pending Dues</p>
              </div>
            </div>
            <span className="text-2xl font-black text-red-600">₹{dues}</span>
          </div>
        )}

        {/* Ledger */}
        <div className="w-full pt-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4"><History className="text-primary w-5 h-5" /> Payment Ledger</h3>
          <div className="space-y-3">
            {loading ? <p className="text-xs text-slate-400 ml-2 animate-pulse">Loading history...</p> : payments.length === 0 ? <p className="bg-slate-50 p-6 rounded-2xl border border-dashed text-center text-sm font-medium text-slate-500">No payment history.</p> :
              payments.map((pay) => {
                let discountAmt = 0;
                if (pay.remarks && pay.remarks.includes('Discount: ₹')) {
                    const match = pay.remarks.match(/Discount: ₹(\d+)/);
                    if (match) discountAmt = parseInt(match[1]);
                }
                
                // If it was a partial payment, the actual cost was amount + discount (roughly speaking for the receipt)
                const originalCharge = pay.amount + discountAmt;

                return (
                  <div key={pay.id} className="p-5 rounded-[1.5rem] shadow-sm border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 flex flex-col gap-4">
                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-3">
                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{pay.payment_for_month || 'Subscription'}</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">₹{pay.amount}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest bg-slate-100 text-slate-600 mb-1 inline-block">{pay.payment_mode}</span>
                        <p className="text-xs font-medium text-slate-500">{new Date(pay.transaction_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <button onClick={() => downloadReceipt(pay, discountAmt)} disabled={generatingPdfId === pay.id} className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600">
                      {generatingPdfId === pay.id ? 'Generating PDF...' : <><Download size={14} /> Download E-Receipt</>}
                    </button>

                    {/* --- HIDDEN HD PDF TEMPLATE --- */}
                    <div id={`receipt-${pay.id}`} className="absolute top-0 left-[-9999px] w-[800px] bg-white p-12 text-slate-900 font-sans" style={{ display: 'none' }}>
                      <div className="flex items-center justify-between border-b-4 border-primary pb-8 mb-8">
                         <div className="flex items-center gap-6">
                           <img src="/logo.webp" alt="Logo" className="w-28 h-28 rounded-2xl object-cover" />
                           <div>
                             <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Pathshala</h1>
                             <p className="text-lg font-bold text-slate-500 tracking-widest mt-1">The Self Study Digital Library</p>
                             <p className="text-sm font-semibold text-slate-400 mt-1">Sagrasunderpur, Pratapgarh, U.P.</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Invoice / Receipt No.</p>
                           <p className="text-2xl font-black">#{pay.id.substring(0,8).toUpperCase()}</p>
                           <p className="text-sm font-bold text-slate-400 mt-4 uppercase tracking-widest">Date Issued</p>
                           <p className="text-lg font-bold">{new Date(pay.transaction_date).toLocaleDateString('en-GB')}</p>
                         </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-2xl mb-10 border border-slate-200 flex justify-between">
                         <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Billed To</p>
                           <h2 className="text-2xl font-black text-slate-900">{user.full_name}</h2>
                           <p className="text-base font-bold text-slate-500 mt-1">ID: PATH-{user.id.substring(0,6).toUpperCase()}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Library Seat</p>
                           <h2 className="text-2xl font-black text-slate-900">{user.seat_number || 'Unassigned'}</h2>
                         </div>
                      </div>

                      <table className="w-full mb-10 text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-300">
                            <th className="py-4 text-sm font-bold text-slate-500 uppercase tracking-widest">Description</th>
                            <th className="py-4 text-sm font-bold text-slate-500 uppercase tracking-widest text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-6 font-bold text-xl text-slate-800">Subscription: {pay.payment_for_month}</td>
                            <td className="py-6 font-black text-2xl text-right">₹{originalCharge}</td>
                          </tr>
                          {discountAmt > 0 && (
                            <tr className="border-b border-slate-100">
                              <td className="py-6 font-bold text-lg text-emerald-600">Scholarship / Discount Applied</td>
                              <td className="py-6 font-black text-xl text-emerald-600 text-right">- ₹{discountAmt}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      <div className="flex justify-between items-end bg-slate-900 text-white p-8 rounded-3xl shadow-lg">
                         <div>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Method</p>
                           <p className="text-2xl font-black">{pay.payment_mode}</p>
                         </div>
                         <div className="text-right flex items-center gap-8">
                           {dues > 0 && (
                             <div className="text-right border-r border-slate-700 pr-8">
                               <p className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2">Pending Dues</p>
                               <p className="text-3xl font-black text-red-400">₹{dues}</p>
                             </div>
                           )}
                           <div className="text-right">
                             <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Total Paid</p>
                             <p className="text-5xl font-black text-primary">₹{pay.amount}</p>
                           </div>
                         </div>
                      </div>

                      <div className="mt-16 pt-8 border-t-2 border-slate-200 text-center">
                         <h3 className="text-xl font-black text-slate-900">Thank you for choosing Pathshala!</h3>
                         <p className="text-sm font-medium text-slate-500 mt-2">This is a system-generated digital receipt and does not require a physical signature.</p>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
}