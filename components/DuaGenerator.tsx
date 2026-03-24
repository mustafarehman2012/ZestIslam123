import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check, Feather, MessageCircle, Heart, Share2, ArrowRight, Zap } from 'lucide-react';
import { generatePersonalizedDua } from '../services/geminiService';
import { GeneratedDua } from '../types';

const DuaGenerator: React.FC = () => {
  const [situation, setSituation] = useState('');
  const [dua, setDua] = useState<GeneratedDua | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!situation.trim()) return;
    setLoading(true);
    setDua(null);
    const result = await generatePersonalizedDua(situation);
    if (result) setDua(result);
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (dua) {
        const text = `${dua.title}\n\n${dua.arabic}\n\n${dua.translation}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-20 px-4">
       <div className="text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-6 py-2 glass-card rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-teal-600">
            <Zap className="w-3 h-3 fill-current" /> Spiritual Echo
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Dua <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Composer</span>.</h2>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">Synthesizing authentic supplications from your current emotional state.</p>
      </div>

      <div className="glass-card p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner"><Feather className="w-6 h-6" /></div>
                <div><h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.1em] text-xs">Intent</h4><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Share your struggle or joy</p></div>
            </div>
            <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Share what is on your heart..."
                className="w-full p-8 rounded-[2rem] bg-slate-50/50 dark:bg-slate-950/50 border-none focus:ring-4 focus:ring-emerald-500/10 outline-none text-xl font-black text-slate-900 dark:text-white resize-none h-48 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
            <button
                onClick={handleGenerate}
                disabled={loading || !situation.trim()}
                className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? 'Synthesizing...' : 'Generate Supplication'}
            </button>
        </div>
      </div>

      {dua && (
        <div className="relative bg-slate-950 dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in-up border border-white/5">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-600"></div>
            <div className="relative z-10 p-12 space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left"><h3 className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-2">Invocation</h3><h4 className="text-3xl font-black text-white tracking-tighter">{dua.title}</h4></div>
                    <div className="flex gap-3">
                        <button onClick={copyToClipboard} className="p-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 group">{copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-400 group-hover:text-white" />}</button>
                        <button className="p-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 group"><Share2 className="w-5 h-5 text-slate-400 group-hover:text-white" /></button>
                    </div>
                </div>
                <div className="py-12 px-8 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-2xl text-center"><p className="font-quran text-3xl md:text-5xl lg:text-6xl text-white leading-relaxed">{dua.arabic}</p></div>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5"><p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">Translation</p><p className="text-slate-300 italic text-xl font-serif leading-relaxed">{dua.transliteration}</p></div>
                    <div className="p-8 bg-emerald-600/10 rounded-[2rem] border border-emerald-500/20"><p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">Meaning</p><p className="text-white text-xl font-black leading-tight tracking-tight">{dua.translation}</p></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DuaGenerator;