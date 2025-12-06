
import React, { useState } from 'react';
import { Search, BookOpen, Loader2, Heart, Share2, Sparkles, Volume2, Globe } from 'lucide-react';
import { searchQuranByType, generateTadabbur, textToSpeech } from '../services/geminiService';
import { QuranVerse, TadabburResult } from '../types';

const QuranSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [tadabburLoading, setTadabburLoading] = useState<number | null>(null);
  const [expandedTadabbur, setExpandedTadabbur] = useState<{idx: number, data: TadabburResult, lang: 'english' | 'urdu' | 'hinglish'} | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setExpandedTadabbur(null);
    const data = await searchQuranByType(query);
    setResults(data);
    setLoading(false);
  };

  const handleTadabbur = async (idx: number, verse: QuranVerse) => {
      if (expandedTadabbur?.idx === idx) {
          setExpandedTadabbur(null);
          return;
      }
      setTadabburLoading(idx);
      const result = await generateTadabbur(verse.surahName, verse.verseNumber);
      if (result) {
          setExpandedTadabbur({ idx, data: result, lang: 'english' });
      }
      setTadabburLoading(null);
  };

  const playAudio = async (text: string) => {
      const buffer = await textToSpeech(text);
      if (buffer) {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await context.decodeAudioData(buffer);
          const source = context.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(context.destination);
          source.start(0);
      }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Smart Quran Search</h2>
        <p className="text-slate-500">Describe your feelings or topic, and let AI find relevant verses.</p>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'I feel anxious', 'Importance of charity'..."
          className="w-full px-6 py-4 pl-12 rounded-full bg-white border-2 border-emerald-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm text-slate-700 placeholder:text-slate-400"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" />
        <button 
            type="submit"
            disabled={loading || !query}
            className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
        </button>
      </form>

      <div className="space-y-4">
        {loading && (
            <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Reflecting on the Quran...</p>
            </div>
        )}

        {!loading && searched && results.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No specific verses found. Try rephrasing your query.</p>
            </div>
        )}

        {results.map((verse, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wide">
                    {verse.surahName} • {verse.verseNumber}
                </span>
                <div className="flex gap-2 text-slate-400">
                    <button onClick={() => playAudio(verse.arabicText)} className="hover:text-emerald-500 transition-colors p-1" title="Play Audio"><Volume2 className="w-5 h-5" /></button>
                    <button className="hover:text-emerald-500 transition-colors p-1"><Heart className="w-5 h-5" /></button>
                </div>
            </div>
            
            <p className="text-right font-arabic text-2xl leading-loose text-slate-800 mb-4" dir="rtl">
              {verse.arabicText}
            </p>
            
            <p className="text-slate-700 mb-3 text-lg leading-relaxed">
              {verse.translation}
            </p>
            
            <div className="bg-slate-50 p-4 rounded-xl mb-4">
                <p className="text-slate-500 text-sm italic">
                <span className="font-semibold text-emerald-600 not-italic">Context: </span> 
                {verse.explanation}
                </p>
            </div>

            {/* Explicit Tadabbur Section */}
            <div className="border-t border-slate-100 pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                     <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        Tadabbur Points
                     </h4>
                     {expandedTadabbur?.idx !== idx && (
                         <button 
                            onClick={() => handleTadabbur(idx, verse)}
                            disabled={tadabburLoading === idx}
                            className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium transition-colors"
                         >
                            {tadabburLoading === idx ? 'Loading...' : 'View Points'}
                         </button>
                     )}
                </div>

                {tadabburLoading === idx && (
                    <div className="py-4 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                )}

                {expandedTadabbur?.idx === idx && (
                    <div className="mt-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 animate-fade-in-up overflow-hidden">
                        
                        {/* Language Tabs */}
                        <div className="flex bg-white/50 border-b border-emerald-100">
                            {['english', 'urdu', 'hinglish'].map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setExpandedTadabbur(prev => prev ? {...prev, lang: l as any} : null)}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${expandedTadabbur.lang === l ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-emerald-50'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div className="p-5">
                            <p 
                                className={`text-slate-700 mb-6 leading-relaxed text-sm font-medium ${expandedTadabbur.lang === 'urdu' ? 'font-arabic text-lg text-right' : ''}`}
                                dir={expandedTadabbur.lang === 'urdu' ? 'rtl' : 'ltr'}
                            >
                                {expandedTadabbur.data[expandedTadabbur.lang].paragraph}
                            </p>
                            
                            <div>
                                <h5 className={`font-bold text-emerald-700 text-xs uppercase tracking-wide mb-3 flex items-center gap-2 ${expandedTadabbur.lang === 'urdu' ? 'flex-row-reverse' : ''}`}>
                                    <Sparkles className="w-3 h-3" />
                                    {expandedTadabbur.lang === 'urdu' ? 'اہم نکات' : 'Key Reflections'}
                                </h5>
                                <ul 
                                    className={`list-none space-y-3 text-sm text-slate-600 ${expandedTadabbur.lang === 'urdu' ? 'text-right' : ''}`}
                                    dir={expandedTadabbur.lang === 'urdu' ? 'rtl' : 'ltr'}
                                >
                                    {expandedTadabbur.data[expandedTadabbur.lang].points.map((p, i) => (
                                        <li key={i} className={`flex gap-3 items-start ${expandedTadabbur.lang === 'urdu' ? 'flex-row-reverse' : ''}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                                            <span className={`${expandedTadabbur.lang === 'urdu' ? 'font-arabic text-lg' : ''}`}>{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button 
                                onClick={() => setExpandedTadabbur(null)}
                                className="w-full mt-6 text-center text-xs text-emerald-600 hover:text-emerald-800 font-medium border-t border-emerald-100/50 pt-3"
                            >
                                Close Section
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

export default QuranSearch;
