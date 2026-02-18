import React, { useState } from 'react';
import { Search, Book, Sparkles, Loader2, Volume2, BookOpen, Globe, ArrowRight, LayoutGrid, Library, Gauge, ChevronRight, ExternalLink } from 'lucide-react';
import { searchQuranByType, searchHadithByType, searchIslamicWeb, playGeneratedAudio } from '../services/geminiService';
import { QuranVerse, Hadith } from '../types';
import { marked } from 'marked';

type Tab = 'ALL' | 'QURAN' | 'HADEES' | 'WEB';

const UnifiedSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [quranResults, setQuranResults] = useState<QuranVerse[]>([]);
  const [hadithResults, setHadithResults] = useState<Hadith[]>([]);
  const [webData, setWebData] = useState<{text: string, chunks: any[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setWebData(null);
    setQuranResults([]);
    setHadithResults([]);
    
    const [qData, hData, wData] = await Promise.all([
        searchQuranByType(query),
        searchHadithByType(query),
        searchIslamicWeb(query)
    ]);

    setQuranResults(qData);
    setHadithResults(hData);
    setWebData(wData);
    setLoading(false);
  };

  const playAudio = async (text: string, type: 'verse' | 'hadith' = 'verse') => {
    await playGeneratedAudio(text, type, playbackSpeed);
  };

  const renderWebContent = () => {
      if (!webData || (!webData.text && webData.chunks.length === 0)) return null;
      return (
        <div className="glass-card p-6 md:p-14 rounded-[3rem] md:rounded-[4rem] relative overflow-hidden shadow-2xl animate-fade-in-up border border-slate-200 dark:border-slate-800/50">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6 md:mb-10">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20 text-white"><Globe className="w-5 h-5 md:w-6 md:h-6" /></div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Synthesized Insights</h3>
                        <p className="text-[9px] md:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-[0.4em] mt-1">Cross-referenced AI Analysis</p>
                    </div>
                </div>

                {webData.text && (
                    <div className="mb-8 md:mb-12">
                        <div 
                            className="prose prose-slate dark:prose-invert prose-emerald max-w-none 
                                     text-slate-800 dark:text-slate-300 leading-[1.7] md:leading-[1.8] text-base md:text-lg font-medium 
                                     [&>p]:mb-4 md:[&>p]:mb-6 [&>ul]:mb-6 [&>ol]:mb-6 [&>li]:mb-2 
                                     [&>h1]:text-2xl md:[&>h1]:text-3xl [&>h1]:font-black [&>h1]:mb-6
                                     [&>h2]:text-xl md:[&>h2]:text-2xl [&>h2]:font-black [&>h2]:mb-4
                                     [&>h3]:text-lg md:[&>h3]:text-xl [&>h3]:font-black [&>h3]:mb-3
                                     [&>blockquote]:border-l-4 [&>blockquote]:border-emerald-500 [&>blockquote]:pl-4 md:[&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:bg-slate-50 dark:bg-white/5 [&>blockquote]:py-4 [&>blockquote]:rounded-r-2xl"
                            dangerouslySetInnerHTML={{ __html: marked.parse(webData.text) as string }}
                        />
                    </div>
                )}

                <div className="pt-8 md:pt-10 border-t border-slate-100 dark:border-white/5">
                    <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] mb-4 md:mb-6">Verified Source Map</h4>
                    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {webData.chunks.map((chunk, i) => {
                                const data = chunk.web;
                                if (!data) return null;
                                return (
                                    <a key={i} href={data.uri} target="_blank" rel="noopener noreferrer" className="block p-5 md:p-6 bg-slate-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-white/10 rounded-[2rem] md:rounded-[2.5rem] transition-all border border-slate-100 dark:border-white/5 group backdrop-blur-sm hover:border-emerald-500/30">
                                        <div className="flex justify-between items-start mb-2 md:mb-3">
                                            <h4 className="font-black text-slate-800 dark:text-white text-[10px] md:text-xs truncate group-hover:text-emerald-600 transition-colors uppercase tracking-widest">{data.title}</h4>
                                            <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                        </div>
                                        <p className="text-[8px] md:text-[9px] text-slate-400 dark:text-slate-400 truncate font-mono opacity-60 group-hover:opacity-100 transition-opacity">{data.uri}</p>
                                    </a>
                                )
                        })}
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const renderQuranContent = () => (
      <div className="space-y-4 md:space-y-6">
        {quranResults.map((verse, idx) => (
            <div key={`q-${idx}`} className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden animate-fade-in-up" style={{animationDelay: `${idx * 0.1}s`}}>
                <div className="flex justify-between items-start mb-6 md:mb-8">
                    <span className="text-[8px] md:text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-4 md:px-6 py-2 md:py-2.5 rounded-full uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-800">{verse.surahName} • V{verse.verseNumber}</span>
                    <button onClick={() => playAudio(verse.arabicText, 'verse')} className="p-3 md:p-3.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 transition-all rounded-2xl shadow-inner border border-slate-100 dark:border-slate-700"><Volume2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>
                <p className="text-right font-quran text-3xl md:text-5xl text-slate-800 dark:text-white mb-6 md:mb-10 leading-[2.2] md:leading-[2.5]" dir="rtl">{verse.arabicText}</p>
                <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl font-medium leading-relaxed mb-6 md:mb-8 font-serif">{verse.translation}</p>
                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-400 text-[10px] md:text-xs italic font-medium leading-relaxed">Context: {verse.explanation}</p>
                </div>
            </div>
        ))}
      </div>
  );

  const renderHadithContent = () => (
    <div className="space-y-4 md:space-y-6">
        {hadithResults.map((hadith, idx) => (
            <div key={`h-${idx}`} className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group animate-fade-in-up" style={{animationDelay: `${idx * 0.1}s`}}>
                <div className="flex justify-between items-start mb-6 md:mb-8">
                    <div className="flex flex-wrap gap-2">
                        <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-800 px-4 md:px-6 py-2 md:py-2.5 rounded-full">{hadith.book} • #{hadith.hadithNumber}</span>
                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] px-3 md:px-5 py-2 md:py-2.5 rounded-full border ${hadith.grade.toLowerCase().includes('sahih') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{hadith.grade}</span>
                    </div>
                    <button onClick={() => playAudio(hadith.arabicText, 'hadith')} className="p-3 md:p-3.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 transition-all rounded-2xl shadow-inner border border-slate-100 dark:border-slate-700"><Volume2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>
                <p className="text-right font-quran text-2xl md:text-4xl text-slate-800 dark:text-white mb-6 md:mb-10 leading-[2.2] md:leading-[2.5]" dir="rtl">{hadith.arabicText}</p>
                <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl font-medium leading-relaxed font-serif">{hadith.translation}</p>
            </div>
        ))}
    </div>
  );

  return (
    <div className={`mx-auto transition-all duration-700 px-2 sm:px-4 ${!searched ? 'max-w-4xl flex flex-col justify-center min-h-[70vh]' : 'max-w-7xl space-y-8 md:space-y-12'}`}>
      
      <div className={`text-center space-y-4 md:space-y-6 transition-all duration-700 ${!searched ? 'mb-8 md:mb-12' : 'mb-6 md:mb-8'}`}>
        <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs md:text-sm font-bold uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-800">
            <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" /> Integrated Knowledge
        </div>
        <h2 className={`font-black text-slate-900 dark:text-white tracking-tighter leading-none transition-all ${!searched ? 'text-4xl md:text-8xl' : 'text-2xl md:text-5xl'}`}>
          Search <span className="text-emerald-600">Zest</span>.
        </h2>
        <p className={`text-slate-500 dark:text-slate-400 font-medium transition-all max-w-2xl mx-auto px-4 ${!searched ? 'text-lg md:text-2xl' : 'text-base md:text-lg'}`}>
          A single command center to query Quran, Authentic Hadith, and the verified Islamic web.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative group max-w-3xl mx-auto w-full z-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="E.g., 'What does Islam say about mental peace?'"
          className="w-full px-6 py-5 md:py-6 pl-12 md:pl-16 rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-slate-900 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-base md:text-xl text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
        />
        <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
        <button 
            type="submit"
            disabled={loading || !query}
            className="absolute right-2 md:right-3 top-2 md:top-3 bottom-2 md:bottom-3 bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-700 text-white px-4 md:px-10 rounded-[1.5rem] md:rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] md:text-xs transition-all disabled:opacity-50 disabled:scale-95 flex items-center gap-2 md:gap-3 shadow-xl shadow-emerald-600/20 active:scale-95"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span className="hidden sm:inline">Discover</span>
        </button>
      </form>

      {loading && (
          <div className="text-center py-20 md:py-32 animate-fade-in">
            <div className="relative inline-block mb-6 md:mb-8">
                <div className="w-20 h-20 md:w-24 md:h-24 border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px] animate-pulse">Scanning the multidimensional library...</p>
          </div>
      )}

      {!loading && searched && (
          <div className="space-y-8 md:space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 md:pb-6 border-b border-slate-100 dark:border-slate-800/50">
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex gap-1 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
                    {[
                        { id: 'ALL', icon: LayoutGrid, label: 'Overview' },
                        { id: 'QURAN', icon: BookOpen, label: 'Quran' },
                        { id: 'HADEES', icon: Library, label: 'Hadith' },
                        { id: 'WEB', icon: Globe, label: 'Web' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-3.5 rounded-[1.5rem] md:rounded-[2rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' 
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                 {(quranResults.length > 0 || hadithResults.length > 0) && (
                    <div className="bg-white dark:bg-slate-900 px-4 md:px-6 py-2 md:py-3 rounded-[1rem] md:rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center gap-2 md:gap-3 shadow-sm w-full md:w-auto justify-center">
                        <Gauge className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                        <select 
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                            className="bg-transparent text-[9px] md:text-[10px] font-black text-slate-900 dark:text-slate-300 border-none focus:ring-0 cursor-pointer py-1 uppercase tracking-widest"
                        >
                            <option value="0.75">Slow (0.75x)</option>
                            <option value="1">Normal (1.0x)</option>
                            <option value="1.25">Fast (1.25x)</option>
                        </select>
                    </div>
                 )}
            </div>

            <div className="space-y-10 md:space-y-16">
                {activeTab === 'ALL' ? (
                    <>
                        {webData && renderWebContent()}
                        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
                            <div className="space-y-6 md:space-y-8">
                                <div className="flex items-center justify-between px-4">
                                    <h3 className="font-black text-slate-400 uppercase tracking-[0.4em] text-[9px] md:text-[11px]">Quranic Evidence</h3>
                                    <span className="text-[9px] md:text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 md:px-4 py-1 md:py-1.5 rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">{quranResults.length}</span>
                                </div>
                                {renderQuranContent()}
                            </div>
                            <div className="space-y-6 md:space-y-8">
                                <div className="flex items-center justify-between px-4">
                                    <h3 className="font-black text-slate-400 uppercase tracking-[0.4em] text-[9px] md:text-[11px]">Prophetic Narrations</h3>
                                    <span className="text-[9px] md:text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 md:px-4 py-1 md:py-1.5 rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">{hadithResults.length}</span>
                                </div>
                                {renderHadithContent()}
                            </div>
                        </div>
                    </>
                ) : activeTab === 'WEB' ? (
                    <div className="max-w-5xl mx-auto">{renderWebContent()}</div>
                ) : activeTab === 'QURAN' ? (
                    <div className="max-w-4xl mx-auto">{renderQuranContent()}</div>
                ) : (
                    <div className="max-w-4xl mx-auto">{renderHadithContent()}</div>
                )}
            </div>

            {searched && quranResults.length === 0 && hadithResults.length === 0 && (!webData || webData.text.length === 0) && (
                <div className="text-center py-20 md:py-24 bg-white dark:bg-slate-900 rounded-[3rem] md:rounded-[4rem] border border-slate-100 dark:border-slate-800 max-w-3xl mx-auto shadow-sm px-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
                        <Search className="w-6 h-6 md:w-8 md:h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">No Knowledge Clusters Found</h3>
                    <p className="text-slate-500 font-medium mt-4 max-w-sm mx-auto text-sm md:text-base">Try rephrasing your question or using more specific keywords to tap into the archives.</p>
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default UnifiedSearch;