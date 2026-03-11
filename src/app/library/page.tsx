'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, BookOpen, Bookmark, Download, Play, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';
import { useLocalState } from '@/hooks/useStore';

export default function LibraryPage() {
  const router = useRouter();
  const [user] = useLocalState<any>('pathshala_user', null);
  
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const categories = ['All', 'Notes', 'Magazines', 'Books', 'PYQs'];

  useEffect(() => {
    const fetchLibrary = async () => {
      const { data } = await supabase.from('library_items').select('*');
      if (data) setLibraryItems(data);
      setLoading(false);
    };
    fetchLibrary();
  }, []);

  const filteredItems = libraryItems.filter(item => 
    (activeCategory === 'All' || item.category === activeCategory) &&
    (item.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      <main className="flex-1 overflow-y-auto hide-scrollbar pb-32 w-full max-w-md mx-auto">
        
        {/* Header */}
        <header className="sticky top-0 z-20 glass-card px-5 pt-5 pb-4 flex flex-col gap-4 border-b border-slate-200/50 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm">
                <BookOpen size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Digital Library</h1>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Study Materials</p>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-slate-400 w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Search books, notes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 border-none rounded-xl bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-medium transition-all" 
            />
          </div>
        </header>

        {/* Categories Scroller */}
        <div className="mt-4">
          <div className="px-5 mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Categories</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 pb-4 hide-scrollbar">
            {categories.map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setActiveCategory(cat)}
                 className={`flex shrink-0 items-center px-5 py-2.5 rounded-full font-bold shadow-sm transition-transform active:scale-95 ${
                   activeCategory === cat 
                     ? 'bg-indigo-500 text-white shadow-indigo-500/30' 
                     : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                 }`}
               >
                 {cat}
               </button>
            ))}
          </div>
        </div>

        {/* Featured Section (Hero Card) */}
        <div className="px-5 mt-2">
          <div className="relative w-full rounded-3xl overflow-hidden shadow-xl shadow-indigo-500/10 dark:shadow-none group aspect-[16/9]">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-indigo-500/20 mix-blend-overlay z-10"></div>
            {/* Placeholder Background Image */}
            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700"></div>
            
            <div className="absolute inset-0 z-20 p-6 flex flex-col justify-center items-start">
              <span className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg mb-3 uppercase tracking-widest shadow-lg">Featured Read</span>
              <h3 className="text-2xl font-black text-white mb-1 leading-tight w-3/4 drop-shadow-md">The Universe & Beyond</h3>
              <p className="text-slate-200 text-sm font-medium mb-5 line-clamp-1 w-3/4">Explore the mysteries of deep space.</p>
              <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-sm font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors border border-white/30">
                <span>Read Now</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Popular Books Grid */}
        <div className="px-5 mt-8 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Study Resources</h2>
          
          {loading ? (
             <p className="text-center text-slate-500 text-sm py-4 animate-pulse">Loading library...</p>
          ) : filteredItems.length === 0 ? (
             // Beautiful Empty State / Fallback if database is empty
             <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card rounded-2xl p-3 flex flex-col shadow-sm hover:-translate-y-1 transition-transform duration-300">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <BookOpen size={32} className="opacity-20" />
                      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 text-white">
                        <Bookmark size={14} />
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-1 mb-1">Example Resource</h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">General</p>
                    <button className="mt-auto w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-900 dark:text-white text-xs font-bold py-2.5 px-3 rounded-xl flex justify-center items-center gap-1.5 transition-colors">
                      <Download size={14} /> Download
                    </button>
                  </div>
                ))}
             </div>
          ) : (
             <div className="grid grid-cols-2 gap-4">
               {filteredItems.map(item => (
                 <div key={item.id} className="glass-card rounded-2xl p-3 flex flex-col shadow-sm hover:-translate-y-1 transition-transform duration-300">
                   <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-slate-200 dark:bg-slate-800">
                     {item.thumbnail_url ? (
                       <img src={item.thumbnail_url} alt={item.title} className="object-cover w-full h-full" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-300">
                         <BookOpen size={40} />
                       </div>
                     )}
                     <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 text-white shadow-sm">
                       <Bookmark size={14} />
                     </div>
                   </div>
                   <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight line-clamp-2 mb-1">{item.title}</h3>
                   <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mb-3 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 w-fit px-2 py-0.5 rounded">{item.category}</p>
                   <button 
                     onClick={() => window.open(item.file_url, '_blank')}
                     className="mt-auto w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex justify-center items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                   >
                     <Download size={14} /> Get PDF
                   </button>
                 </div>
               ))}
             </div>
          )}
        </div>
      </main>

      <BottomNav activeTab="library" onTabChange={(tab) => {
         if (tab === 'home') router.push('/');
         if (tab === 'scan') alert('QR Scanner opening...');
         if (tab === 'profile') router.push('/?tab=profile');
      }} />
    </div>
  );
}