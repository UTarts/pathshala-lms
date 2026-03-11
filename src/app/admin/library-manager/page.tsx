'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, BookOpen, UploadCloud, Image as ImageIcon, CheckCircle, File } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LibraryUploaderPage() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Notes');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = ['Notes', 'Magazines', 'Books', 'PYQs'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !title) return;
    setIsSubmitting(true);

    try {
      // 1. Upload PDF
      const pdfName = `pdf_${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { error: pdfError } = await supabase.storage.from('library').upload(pdfName, pdfFile);
      if (pdfError) throw pdfError;
      const pdfUrl = supabase.storage.from('library').getPublicUrl(pdfName).data.publicUrl;

      // 2. Upload Cover (Optional)
      let coverUrl = null;
      if (coverFile) {
        const coverName = `cover_${Date.now()}_${coverFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const { error: coverError } = await supabase.storage.from('library').upload(coverName, coverFile);
        if (!coverError) {
           coverUrl = supabase.storage.from('library').getPublicUrl(coverName).data.publicUrl;
        }
      }

      // 3. Save to Database
      const { error: dbError } = await supabase.from('library_items').insert({
        title,
        category,
        file_url: pdfUrl,
        thumbnail_url: coverUrl
      });

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
         router.back();
      }, 2000);

    } catch (error: any) {
      alert("Upload failed: " + error.message);
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-glow mb-6 animate-bounce">
          <CheckCircle size={48} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Resource Added!</h1>
        <p className="text-slate-500 font-medium mt-2">Available in the digital library now.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
      
      <header className="px-5 pt-5 pb-4 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black tracking-tight">Upload Resource</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-md mx-auto w-full pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Resource Title</label>
              <input 
                required type="text" placeholder="E.g. Physics Chapter 4 Notes"
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                 {categories.map(cat => (
                   <div 
                     key={cat} onClick={() => setCategory(cat)}
                     className={`py-3 rounded-xl text-center text-sm font-bold cursor-pointer transition-all border-2 ${category === cat ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'}`}
                   >
                     {cat}
                   </div>
                 ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1">
                 <File size={14}/> Main Document (PDF) *
               </label>
               <label className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 transition-colors">
                  <UploadCloud size={32} className="text-indigo-400 mb-2" />
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{pdfFile ? pdfFile.name : 'Tap to upload PDF'}</span>
                  <input type="file" required className="hidden" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
               </label>
            </div>

            <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1 mt-4">
                 <ImageIcon size={14}/> Cover Image (Optional)
               </label>
               <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{coverFile ? coverFile.name : 'Tap to upload Thumbnail'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
               </label>
            </div>
          </div>

          <button 
            type="submit" disabled={isSubmitting || !title || !pdfFile}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading...' : 'Publish to Library'}
          </button>
        </form>
      </main>
    </div>
  );
}