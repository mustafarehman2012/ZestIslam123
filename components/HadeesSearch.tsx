import React, { useState } from 'react';
import { Search, BookOpen, Loader2, Sparkles, Volume2, Book, Copy, Share2, Library, ChevronRight } from 'lucide-react';
import { searchHadithByType, generateSharh, playGeneratedAudio, stopGeneratedAudio } from '../services/geminiService';
import { Hadith, SharhResult } from '../types';

const HadeesSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  const [sharhLoading, setSharhLoading] = useState<number | null>(null);
  const [expandedSharh, setExpandedSharh] = useState<{idx: number, data: SharhResult, lang: 'english' | 'urdu' | 'hinglish'} | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setExpandedSharh(null);
    const data = await searchHadithByType(query);
    setResults(data);
    setLoading(false);
  };

  const handleSharh = async (idx: number, hadith: Hadith) => {
      if (expandedSharh?.idx === idx) {
          setExpandedSharh(null);
          return;
      }
      setSharhLoading(idx);
      const result = await generateSharh(hadith.book, hadith.hadithNumber);
      if (result) setExpandedSharh({ idx, data: result, lang: 'english' });
      setSharhLoading(null);
  };

  const copyHadith = (hadith: Hadith) => {
      const text = `${hadith.arabicText}\n\n${hadith.translation}\n\n[Source: ${hadith.book}, Hadith #${hadith.hadithNumber}]`;
      navigator.clipboard.writeText(text);
  };

  const playAudio = async (text: string) => {
      if (playingAudioId === text) {
          stopGeneratedAudio();
          setPlayingAudioId(null);
          return;
      }
      stopGeneratedAudio();
      setPlayingAudioId(text);
      await playGeneratedAudio(text, 'hadith', 1.0, () => setPlayingAudioId(null));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12 animate-fade-in">
      <div className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-bold uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-800">
            <Library className="w-4 h-4" /> Prophetic Wisdom
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Hadith <span className="text-emerald-600">AI</span>.</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">Discover authentic traditions and Prophetic guidance through an intelligent spiritual lens.</p>
      </div>

      <form onSubmit={handleSearch} className="relative group max-w-3xl mx-auto px-4 sm:px-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="E.g., 'Rights of neighbors', 'Patience', 'Intentions'..."
          className="w-full pl-10 pr-40 py-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-medium"
        />
        <div className="absolute inset-y-3 right-3 hidden sm:block">
            <button 
                type="submit"
                disabled={loading || !query}
                className="h-full bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-700 text-white px-10 rounded-[1.8rem] font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl active:scale-95"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Seek
            </button>
        </div>
      </form>

      <div className="space-y-8 px-4 sm:px-0">
        {loading && (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="relative mb-6">
                    <div className="w-20 h-20 border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                    <Book className="w-8 h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Searching the authentic records...</p>
            </div>
        )}

        {!loading && searched && results.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto shadow-sm">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">No records found</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Try broadening your search or using different keywords.</p>
            </div>
        )}
        
        {!loading && !searched && (
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto opacity-70">
                {[
                    { title: "Sahih Bukhari", desc: "The most authentic collection.", color: "bg-emerald-500" },
                    { title: "Sahih Muslim", desc: "Authentic Prophetic traditions.", color: "bg-indigo-500" },
                    { title: "Sunan an-Nasa'i", desc: "Detailed jurisprudence Hadith.", color: "bg-teal-500" },
                    { title: "Riyadh as-Salihin", desc: "A garden of righteous reminders.", color: "bg-rose-500" }
                ].map((book, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                        <div className={`w-12 h-12 ${book.color} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg`}><Book className="w-6 h-6" /></div>
                        <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-lg">{book.title}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{book.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {results.map((hadith, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 relative group animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div className="flex flex-wrap gap-3">
                        <span className="inline-flex items-center px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700">
                            {hadith.book} • #{hadith.hadithNumber}
                        </span>
                        <span className={`inline-flex items-center px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border ${
                            hadith.grade.toLowerCase().includes('sahih') 
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
                        }`}>
                            {hadith.grade}
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => playAudio(hadith.arabicText)} className={`p-4 rounded-2xl transition-all shadow-sm ${playingAudioId === hadith.arabicText ? 'bg-red-50 text-red-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-100 dark:border-slate-700'}`} title="Audio">
                            {playingAudioId === hadith.arabicText ? <div className="w-5 h-5 bg-current rounded-sm animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <button onClick={() => copyHadith(hadith)} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-slate-100 dark:border-slate-700" title="Copy"><Copy className="w-5 h-5" /></button>
                    </div>
                </div>
                
                <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[3rem] p-8 md:p-12 mb-10 border border-slate-50 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-[0.03] pointer-events-none"></div>
                    <p className="text-right font-quran text-3xl md:text-4xl lg:text-5xl text-slate-800 dark:text-white leading-[2.5]" dir="rtl">
                      {hadith.arabicText}
                    </p>
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 text-xl md:text-2xl font-medium leading-relaxed font-serif mb-10 max-w-4xl">
                    {hadith.translation}
                </p>

                <div className="flex items-start gap-4 mb-10 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                    <div className="w-1.5 h-12 bg-emerald-500 rounded-full shrink-0"></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chapter Context</p>
                        <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{hadith.chapter} — {hadith.explanation}</p>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Prophetic Insight</h4>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Enhanced Spiritual Explanation</p>
                            </div>
                        </div>
                        {expandedSharh?.idx !== idx && (
                            <button 
                                onClick={() => handleSharh(idx, hadith)}
                                disabled={sharhLoading === idx}
                                className="w-full md:w-auto bg-slate-900 dark:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                            >
                                {sharhLoading === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reveal Sharh'}
                            </button>
                        )}
                    </div>

                    {expandedSharh?.idx === idx && (
                        <div className="mt-8 bg-slate-50 dark:bg-slate-800/40 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in-up">
                            <div className="p-8 md:p-10">
                                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl flex mb-10 inline-flex shadow-sm">
                                    {['english', 'urdu', 'hinglish'].map((l) => (
                                        <button
                                            key={l}
                                            onClick={() => setExpandedSharh(prev => prev ? {...prev, lang: l as any} : null)}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                                expandedSharh.lang === l 
                                                ? 'bg-emerald-600 text-white shadow-lg' 
                                                : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>

                                <p className={`text-slate-800 dark:text-slate-200 text-xl md:text-2xl font-medium mb-10 leading-relaxed ${expandedSharh.lang === 'urdu' ? 'font-quran text-right' : ''}`} dir={expandedSharh.lang === 'urdu' ? 'rtl' : 'ltr'}>
                                    {expandedSharh.data[expandedSharh.lang].paragraph}
                                </p>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                    {expandedSharh.data[expandedSharh.lang].points.map((p, i) => (
                                        <div key={i} className={`flex items-start gap-4 p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm ${expandedSharh.lang === 'urdu' ? 'flex-row-reverse text-right' : ''}`}>
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-inner">{i+1}</div>
                                            <span className={`text-slate-600 dark:text-slate-400 font-medium ${expandedSharh.lang === 'urdu' ? 'font-quran text-xl' : 'text-sm'}`}>{p}</span>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => setExpandedSharh(null)}
                                    className="w-full mt-10 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors"
                                >
                                    Dismiss Insight
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default HadeesSearch;