import React, { useState } from 'react';
import { Moon, Sparkles, Loader2, BookOpen, Stars, Compass, Info, X, Zap } from 'lucide-react';
import { interpretDream } from '../services/geminiService';
import { DreamResult } from '../types';

type Language = 'english' | 'urdu' | 'hinglish';

const DreamInterpreter: React.FC = () => {
    const [dream, setDream] = useState('');
    const [result, setResult] = useState<DreamResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState<Language>('english');

    const handleInterpret = async () => {
        if (!dream.trim()) return;
        setLoading(true);
        const res = await interpretDream(dream);
        if (res) setResult(res);
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-16 animate-fade-in pb-32">
            <div className="text-center space-y-8 pt-10">
                <div className="inline-flex items-center gap-3 px-8 py-3 glass-card rounded-full text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 dark:text-indigo-400">
                    <Stars className="w-4 h-4" /> Celestial Sync
                </div>
                <h2 className="text-5xl sm:text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Dream <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Insight</span>.</h2>
                <p className="text-slate-500 dark:text-slate-400 text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed px-4">
                  Decipher the symbols of your soul using classical Islamic dream scholarship.
                </p>
            </div>

            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-indigo-100 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start relative overflow-hidden shadow-2xl group mx-4 md:mx-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shrink-0 border border-white/10"><Info className="w-6 h-6 md:w-8 md:h-8" /></div>
                <p className="text-xs md:text-sm font-black leading-relaxed tracking-widest uppercase opacity-80 text-center md:text-left">
                    Dreams are a specialized science ('Ilm al-Ta'bir'). Use this as a reference point, but seek professional scholarly advice for critical life decisions.
                </p>
            </div>

            <div className="glass-card p-12 md:p-20 rounded-[5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
                <div className="relative z-10 space-y-12">
                    <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center rounded-[1.5rem] text-indigo-600 dark:text-indigo-400 shadow-inner">
                            <Moon className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] text-sm">Vision Log</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Describe symbols and emotions</p>
                        </div>
                    </div>
                    <textarea
                        value={dream}
                        onChange={(e) => setDream(e.target.value)}
                        placeholder="I saw a falcon landing on a white minaret..."
                        className="w-full p-10 rounded-[3rem] bg-slate-50/50 dark:bg-slate-950/50 border-none focus:ring-8 focus:ring-indigo-500/5 outline-none text-slate-800 dark:text-white text-2xl font-black resize-none h-64 transition-all placeholder:text-slate-200"
                    />
                    <button
                        onClick={handleInterpret}
                        disabled={loading || !dream.trim()}
                        className="w-full bg-[#1e1b4b] hover:scale-[1.02] text-white py-8 rounded-[3rem] font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-6 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)] active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Compass className="w-6 h-6" />}
                        {loading ? 'Consulting Sources...' : 'Decode Vision'}
                    </button>
                </div>
            </div>

            {result && (
                <div className="bg-[#020617] text-white rounded-[5rem] overflow-hidden shadow-2xl animate-fade-in-up border border-white/5">
                    <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-600 via-purple-500 to-teal-400"></div>
                    <div className="p-16 md:p-24 space-y-16 relative">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                            <div className="bg-white/5 p-1.5 sm:p-2 rounded-[1.5rem] flex flex-wrap sm:inline-flex gap-1 sm:gap-0 border border-white/10">
                                {(['english', 'urdu', 'hinglish'] as Language[]).map((l) => (
                                    <button key={l} onClick={() => setLang(l)} className={`px-4 sm:px-10 py-3 sm:py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${lang === l ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>{l}</button>
                                ))}
                            </div>
                        </div>

                        <div className={`space-y-16 ${lang === 'urdu' ? 'text-right' : ''}`} dir={lang === 'urdu' ? 'rtl' : 'ltr'}>
                            <div className="space-y-8">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">The Core Interpretation</h3>
                                <p className={`text-3xl sm:text-4xl md:text-5xl font-black leading-[1.3] tracking-tighter ${lang === 'urdu' ? 'font-quran' : ''}`}>
                                    {result[lang].interpretation}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="p-12 bg-white/5 rounded-[4rem] border border-white/10">
                                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-8">Symbols Detected</h3>
                                    <div className={`flex flex-wrap gap-4 ${lang === 'urdu' ? 'justify-end' : ''}`}>
                                        {result[lang].symbols.map((s, i) => (
                                            <span key={i} className="px-8 py-4 bg-white/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border border-white/5 group hover:bg-white/20 transition-all">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-12 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-[4rem] border border-indigo-500/20">
                                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-8">Scholarly Council</h3>
                                    <p className={`text-xl sm:text-2xl font-bold leading-relaxed italic ${lang === 'urdu' ? 'font-quran text-2xl sm:text-3xl' : ''}`}>
                                        "{result[lang].advice}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DreamInterpreter;