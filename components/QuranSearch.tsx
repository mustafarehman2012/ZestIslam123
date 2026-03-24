import React, { useState, useEffect, useRef } from 'react';
/* Added ChevronRight to the lucide-react imports */
import { Search, BookOpen, Loader2, Sparkles, Volume2, Gauge, ChevronLeft, ChevronRight, Play, Pause, Square, SkipForward, SkipBack, X, Copy, Share2, Bookmark } from 'lucide-react';
import { searchQuranByType, generateTadabbur, playGeneratedAudio, stopGeneratedAudio, fetchSurahList, fetchFullSurah, fetchSurahAudio } from '../services/geminiService';
import { QuranVerse, TadabburResult, SurahMeta, FullSurahVerse } from '../types';

const QuranSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [tadabburLoading, setTadabburLoading] = useState<number | null>(null);
  const [expandedTadabbur, setExpandedTadabbur] = useState<{idx: number, data: TadabburResult, lang: 'english' | 'urdu' | 'hinglish'} | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  const [allSurahs, setAllSurahs] = useState<SurahMeta[]>([]);
  const [matchedSurah, setMatchedSurah] = useState<SurahMeta | null>(null);
  const [readingSurah, setReadingSurah] = useState<{ meta: SurahMeta, verses: FullSurahVerse[] } | null>(null);
  const [readerLoading, setReaderLoading] = useState<number | null>(null);

  const [audioPlaylist, setAudioPlaylist] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      fetchSurahList().then(setAllSurahs);
  }, []);

  useEffect(() => {
      if (!query || allSurahs.length === 0) {
          setMatchedSurah(null);
          return;
      }
      
      const cleanQuery = query.toLowerCase().replace('surah', '').trim();
      const match = allSurahs.find(s => 
          s.englishName.toLowerCase() === cleanQuery || 
          s.englishName.toLowerCase().includes(cleanQuery) && cleanQuery.length > 3 ||
          s.number.toString() === cleanQuery
      );
      setMatchedSurah(match || null);
  }, [query, allSurahs]);

  useEffect(() => {
      if (currentTrackIndex >= 0 && currentTrackIndex < audioPlaylist.length) {
          if (!audioRef.current) {
              audioRef.current = new Audio(audioPlaylist[currentTrackIndex]);
              audioRef.current.playbackRate = playbackSpeed;
              audioRef.current.onended = handleTrackEnd;
          } else {
              audioRef.current.src = audioPlaylist[currentTrackIndex];
              audioRef.current.playbackRate = playbackSpeed;
          }
          
          if (isPlaying) {
              audioRef.current.play().catch(e => console.error("Playback failed", e));
          }
      } else {
           if (audioRef.current) {
               audioRef.current.pause();
               audioRef.current = null;
           }
      }

      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
          }
      }
  }, [currentTrackIndex, audioPlaylist]);

  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.playbackRate = playbackSpeed;
      }
  }, [playbackSpeed]);

  const handleTrackEnd = () => {
      setCurrentTrackIndex(prev => {
          if (prev < audioPlaylist.length - 1) return prev + 1;
          setIsPlaying(false);
          return -1;
      });
  };

  const togglePlayPause = () => {
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.pause();
          } else {
              audioRef.current.play();
          }
          setIsPlaying(!isPlaying);
      }
  };

  const stopAudio = () => {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTrackIndex(-1);
      setAudioPlaylist([]);
  };

  const handleListenFullSurah = async (surahNumber: number) => {
      stopAudio();
      setAudioLoading(true);
      const urls = await fetchSurahAudio(surahNumber);
      if (urls.length > 0) {
          setAudioPlaylist(urls);
          setCurrentTrackIndex(0);
          setIsPlaying(true);
      }
      setAudioLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
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

  const copyText = (text: string) => {
      navigator.clipboard.writeText(text);
      // Simple feedback could be added here
  };

  const playAudio = async (text: string) => {
      if (playingAudioId === text) {
          stopGeneratedAudio();
          setPlayingAudioId(null);
          return;
      }
      if (isPlaying) togglePlayPause();
      setPlayingAudioId(text);
      await playGeneratedAudio(text, 'verse', playbackSpeed, () => {
          setPlayingAudioId(null);
      });
  };

  const openFullSurah = async (surahNumber: number) => {
      setReaderLoading(surahNumber);
      try {
        const data = await fetchFullSurah(surahNumber);
        if (data) {
            setReadingSurah(data);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (e) {
        console.error("Failed to load surah", e);
      } finally {
        setReaderLoading(null);
      }
  };

  if (readingSurah) {
      return (
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-32">
              <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 rounded-b-[2rem]">
                  <button 
                    onClick={() => setReadingSurah(null)}
                    className="flex items-center gap-2 p-2 text-slate-500 hover:text-emerald-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"
                  >
                      <ChevronLeft className="w-5 h-5" /> <span className="hidden sm:inline font-bold text-sm">Library</span>
                  </button>
                  <div className="text-center">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Surah {readingSurah.meta.englishName}</h2>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">{readingSurah.meta.revelationType} • {readingSurah.meta.numberOfAyahs} Verses</p>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl px-3 border border-slate-200 dark:border-slate-700">
                            <Gauge className="w-4 h-4 text-emerald-500" />
                            <select 
                                value={playbackSpeed}
                                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                className="bg-transparent text-xs font-black text-slate-600 dark:text-slate-300 border-none focus:ring-0 cursor-pointer py-1 pr-6"
                            >
                                <option value="0.75">0.75x</option>
                                <option value="1">1.0x</option>
                                <option value="1.25">1.25x</option>
                            </select>
                      </div>
                      <button 
                        onClick={() => handleListenFullSurah(readingSurah.meta.number)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                      >
                         {audioLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>
                  </div>
              </div>

              <div className="text-center py-12">
                  <p className="font-quran text-3xl md:text-5xl lg:text-6xl text-slate-800 dark:text-emerald-400 opacity-90 drop-shadow-sm select-none">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </p>
              </div>

              <div className="space-y-6 px-2">
                  {readingSurah.verses.map((verse, idx) => (
                      <div key={verse.number} className={`bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[3rem] border transition-all duration-500 group relative ${currentTrackIndex === idx ? 'border-emerald-500 ring-4 ring-emerald-500/5 dark:ring-emerald-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900 shadow-sm'}`}>
                          <div className="flex justify-between items-center mb-8">
                              <div className="flex items-center gap-3">
                                  <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black border transition-all ${currentTrackIndex === idx ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700'}`}>
                                      {verse.numberInSurah}
                                  </span>
                                  <div className="hidden group-hover:flex items-center gap-2 animate-fade-in">
                                      <button onClick={() => copyText(verse.text)} className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"><Copy className="w-4 h-4" /></button>
                                      <button className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"><Bookmark className="w-4 h-4" /></button>
                                  </div>
                              </div>
                              <button 
                                onClick={() => playAudio(verse.text)}
                                className={`p-3 rounded-2xl transition-all shadow-sm ${playingAudioId === verse.text ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 border border-slate-100 dark:border-slate-700'}`}
                              >
                                  {playingAudioId === verse.text ? <Square className="w-5 h-5 fill-current animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                              </button>
                          </div>
                          
                          <p className="text-right font-quran text-2xl md:text-4xl lg:text-5xl text-slate-800 dark:text-white mb-10 leading-[2.8] md:leading-[2.8]" dir="rtl">
                              {verse.text}
                          </p>
                          <div className="max-w-3xl">
                              <p className="text-slate-600 dark:text-slate-300 text-xl md:text-2xl font-medium leading-relaxed font-serif">
                                  {verse.translation}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>

              {audioPlaylist.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900/90 dark:bg-emerald-950/90 backdrop-blur-2xl border border-white/10 p-5 z-50 animate-fade-in-up rounded-[2.5rem] shadow-2xl flex items-center justify-between text-white">
                    <div className="flex items-center gap-4 min-w-0">
                        <button onClick={stopAudio} className="p-3 bg-white/10 hover:bg-red-500/20 rounded-2xl text-white transition-all"><X className="w-5 h-5" /></button>
                        <div className="min-w-0">
                            <p className="text-sm font-black truncate uppercase tracking-tighter">Surah {readingSurah.meta.englishName}</p>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Verse {currentTrackIndex + 1} of {readingSurah.meta.numberOfAyahs}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <button onClick={() => setCurrentTrackIndex(Math.max(0, currentTrackIndex - 1))} className="text-slate-400 hover:text-white transition-colors"><SkipBack className="w-6 h-6" /></button>
                        <button 
                            onClick={togglePlayPause}
                            className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all"
                        >
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </button>
                        <button onClick={() => setCurrentTrackIndex(Math.min(audioPlaylist.length - 1, currentTrackIndex + 1))} className="text-slate-400 hover:text-white transition-colors"><SkipForward className="w-6 h-6" /></button>
                    </div>
                </div>
              )}
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12 animate-fade-in">
      <div className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-bold uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-800">
            <BookOpen className="w-4 h-4" /> Divine Knowledge
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Quran <span className="text-emerald-600">AI</span>.</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">Search through the eternal words of Allah by theme, emotion, or explore full Surahs.</p>
      </div>

      <form onSubmit={handleSearch} className="relative group max-w-3xl mx-auto px-4 sm:px-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="E.g., 'Patience', 'Surah Kahf', 'How to be grateful?'"
          className="w-full pl-6 sm:pl-10 pr-[100px] sm:pr-40 py-4 sm:py-6 rounded-[2rem] sm:rounded-[2.5rem] bg-white dark:bg-slate-900 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-base sm:text-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-medium"
        />
        <div className="absolute inset-y-2 right-6 sm:inset-y-3 sm:right-3 flex">
            <button 
                type="submit"
                disabled={loading || !query}
                className="h-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-10 rounded-[1.5rem] sm:rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all disabled:opacity-50 flex items-center gap-2 sm:gap-3 shadow-xl shadow-emerald-600/20 active:scale-95"
            >
                {loading ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Search className="w-3 h-3 sm:w-4 sm:h-4" />}
                Scan
            </button>
        </div>
      </form>

      {matchedSurah && !searched && (
          <div className="max-w-3xl mx-auto animate-fade-in-up px-4 sm:px-0">
              <div 
                onClick={() => openFullSurah(matchedSurah.number)}
                className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-all shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 group"
              >
                  <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-emerald-500/20 group-hover:rotate-12 transition-transform">
                          {matchedSurah.number}
                      </div>
                      <div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Surah {matchedSurah.englishName}</h3>
                          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold uppercase tracking-widest">{matchedSurah.englishNameTranslation} • {matchedSurah.numberOfAyahs} Ayahs</p>
                      </div>
                  </div>
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                      {readerLoading === matchedSurah.number ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                  </div>
              </div>
          </div>
      )}

      <div className="space-y-8 px-4 sm:px-0">
        {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Scanning Verses...</p>
            </div>
        )}

        {!loading && searched && results.length === 0 && !matchedSurah && (
            <div className="text-center py-20 space-y-4 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-fade-in-up">
                <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Unable to find</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">We couldn't find any verses matching your query. Try different keywords.</p>
            </div>
        )}

        {!loading && results.map((verse, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 relative group overflow-hidden animate-fade-in-up">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <BookOpen className="w-24 h-24 text-emerald-600" />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                  <span className="inline-flex items-center px-6 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
                      {verse.surahName} • Verse {verse.verseNumber}
                  </span>
                  <div className="flex gap-3">
                      {playingAudioId === verse.arabicText ? (
                          <button onClick={() => { stopGeneratedAudio(); setPlayingAudioId(null); }} className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-2xl transition-all border border-red-100 dark:border-red-800" title="Stop Audio">
                              <Square className="w-5 h-5 fill-current animate-pulse" />
                          </button>
                      ) : (
                          <button onClick={() => playAudio(verse.arabicText)} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-slate-100 dark:border-slate-700" title="Play Audio">
                              <Volume2 className="w-5 h-5" />
                          </button>
                      )}
                      <button onClick={() => copyText(`${verse.arabicText}\n\n${verse.translation}\n(${verse.surahName}:${verse.verseNumber})`)} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-slate-100 dark:border-slate-700" title="Copy"><Copy className="w-5 h-5" /></button>
                  </div>
              </div>
              
              <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[3rem] p-8 md:p-12 mb-10 border border-slate-50 dark:border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-[0.03] pointer-events-none"></div>
                  <p className="text-right font-quran text-2xl md:text-4xl lg:text-5xl text-slate-800 dark:text-white leading-[2.5]" dir="rtl">
                    {verse.arabicText}
                  </p>
              </div>
              
              <p className="text-slate-600 dark:text-slate-300 text-xl md:text-2xl font-medium leading-relaxed font-serif mb-10 max-w-4xl">
                  {verse.translation}
              </p>

              <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-8 gap-6">
                 <p className="text-sm text-slate-400 font-medium italic text-center md:text-left">{verse.explanation}</p>
                 <button 
                    onClick={() => handleTadabbur(idx, verse)}
                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-900 dark:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                 >
                     {tadabburLoading === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                     Deep Reflect
                 </button>
              </div>

              {expandedTadabbur?.idx === idx && (
                  <div className="mt-8 bg-emerald-50/50 dark:bg-emerald-900/10 p-8 rounded-[3rem] border border-emerald-100 dark:border-emerald-800/50 animate-fade-in-up">
                      <div className="flex flex-wrap sm:inline-flex gap-1 sm:gap-2 mb-8 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm">
                          {['english', 'urdu', 'hinglish'].map(l => (
                              <button key={l} onClick={() => setExpandedTadabbur(prev => prev ? {...prev, lang: l as any} : null)} className={`text-[10px] font-black uppercase tracking-widest px-3 sm:px-5 py-2 rounded-xl transition-all ${expandedTadabbur.lang === l ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                                  {l}
                              </button>
                          ))}
                      </div>
                      <p className={`text-slate-800 dark:text-slate-200 text-xl md:text-2xl font-medium mb-8 leading-relaxed ${expandedTadabbur.lang === 'urdu' ? 'text-right font-quran text-lg sm:text-xl md:text-2xl' : ''}`}>
                          {expandedTadabbur.data[expandedTadabbur.lang].paragraph}
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                          {expandedTadabbur.data[expandedTadabbur.lang].points.map((p, i) => (
                              <div key={i} className={`p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-start gap-4 ${expandedTadabbur.lang === 'urdu' ? 'flex-row-reverse text-right' : ''}`}>
                                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0 font-black text-xs">{i+1}</div>
                                  <p className={`text-slate-600 dark:text-slate-400 font-medium ${expandedTadabbur.lang === 'urdu' ? 'font-quran text-lg sm:text-xl' : 'text-sm'}`}>{p}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
        ))}

        {!searched && results.length === 0 && !loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allSurahs.slice(0, 114).map(surah => (
                    <button 
                      key={surah.number}
                      onClick={() => openFullSurah(surah.number)}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:shadow-xl transition-all group text-left relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 group-hover:text-emerald-600 transition-all">
                                {readerLoading === surah.number ? <Loader2 className="w-5 h-5 animate-spin" /> : surah.number}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{surah.revelationType}</span>
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tighter mb-1">{surah.englishName}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{surah.englishNameTranslation}</p>
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default QuranSearch;