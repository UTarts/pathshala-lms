'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Megaphone, UploadCloud, FileText, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PostNoticePage() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'general' | 'exam'>('general');
  const [file, setFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let file_url = null;

    // Handle File Upload if selected
    if (file) {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { error: uploadError } = await supabase.storage.from('notices').upload(fileName, file);
      
      if (!uploadError) {
        const { data } = supabase.storage.from('notices').getPublicUrl(fileName);
        file_url = data.publicUrl;
      } else {
        alert("File upload failed. Notice will post without attachment.");
      }
    }

    // Insert into Database
    const { error } = await supabase.from('notices').insert({
      title,
      content,
      type,
      file_url
    });

    setIsSubmitting(false);

    if (!error) {
      setSuccess(true);
      setTimeout(() => router.back(), 2000);
    } else {
      alert("Failed to post notice.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-glow mb-6 animate-bounce">
          <CheckCircle size={48} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Notice Published!</h1>
        <p className="text-slate-500 font-medium mt-2">All students have been updated.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-primary/30">
      
      {/* Header */}
      <header className="px-5 pt-8 pb-4 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black tracking-tight">Post Announcement</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-md mx-auto w-full pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Notice Type Toggle */}
          <div className="flex gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
             <button type="button" onClick={() => setType('general')} className={`flex-1 py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all ${type === 'general' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                <Megaphone size={16}/> General
             </button>
             <button type="button" onClick={() => setType('exam')} className={`flex-1 py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all ${type === 'exam' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500'}`}>
                <FileText size={16}/> Exam Alert
             </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Notice Title</label>
              <input 
                required type="text" placeholder="E.g. Library Closed Tomorrow"
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Full Description</label>
              <textarea 
                required placeholder="Write your announcement details here..." rows={5}
                value={content} onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:border-primary outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Attachment Upload */}
          <div className="bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Attachment (Optional)</label>
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
               <UploadCloud size={32} className="text-slate-400 group-hover:text-primary transition-colors mb-2" />
               <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{file ? file.name : 'Tap to upload PDF/Image'}</span>
               <span className="text-[10px] text-slate-500 mt-1">Max 5MB</span>
               <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <button 
            type="submit" disabled={isSubmitting || !title || !content}
            className="w-full bg-primary hover:bg-primary-dark text-white font-black text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Broadcasting...' : 'Publish Notice'}
          </button>
        </form>
      </main>
    </div>
  );
}