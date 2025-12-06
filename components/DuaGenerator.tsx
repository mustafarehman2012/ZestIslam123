import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
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
    setDua(result);
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
    <div className="max-w-2xl mx-auto">
       <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Personalized Dua</h2>
        <p className="text-slate-500">Tell us your situation, and receive a specific supplication.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50 mb-8">
        <textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="E.g., I am about to take a difficult exam, My friend is sick, I want to thank Allah for a new job..."
            className="w-full p-4 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 resize-none h-32 mb-4 placeholder:text-slate-400"
        />
        <button
            onClick={handleGenerate}
            disabled={loading || !situation}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none"
        >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Dua...
                </>
            ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    Generate Dua
                </>
            )}
        </button>
      </div>

      {dua && (
        <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-emerald-100 animate-fade-in-up">
            <div className="bg-emerald-50 p-6 flex justify-between items-center border-b border-emerald-100">
                <h3 className="font-bold text-emerald-900">{dua.title}</h3>
                <button onClick={copyToClipboard} className="text-emerald-600 hover:bg-emerald-100 p-2 rounded-lg transition-colors">
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
            </div>
            <div className="p-8 space-y-6 text-center">
                <p className="font-arabic text-3xl leading-loose text-slate-800" dir="rtl">
                    {dua.arabic}
                </p>
                <div className="space-y-2">
                    <p className="text-emerald-600 font-medium text-sm uppercase tracking-wide">Transliteration</p>
                    <p className="text-slate-600 italic">
                        {dua.transliteration}
                    </p>
                </div>
                <div className="space-y-2">
                    <p className="text-emerald-600 font-medium text-sm uppercase tracking-wide">Meaning</p>
                    <p className="text-slate-800 text-lg">
                        {dua.translation}
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DuaGenerator;