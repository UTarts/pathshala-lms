'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-primary/30">
      <header className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black tracking-tight">Privacy Policy</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-5 py-8 max-w-md mx-auto w-full pb-20">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <section>
            <h2 className="text-lg font-black mb-2 text-primary">Data Collection</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              We collect your name, phone number, and email strictly for account management, library seating assignment, and subscription notifications. We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black mb-2 text-primary">Financial Information</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Payment records and ledger histories are securely stored via Supabase databases strictly for internal accounting and to provide you with digital receipts. 
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black mb-2 text-primary">Data Deletion</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              If you wish to terminate your account and have your data wiped from our servers, please contact the library administration desk directly.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}