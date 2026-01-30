import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Target, Sparkles, Loader2, Fingerprint, ChevronRight, Volume2, Info } from 'lucide-react';
import { getDhikrSuggestion } from '../services/geminiService';
import { DhikrSuggestion } from '../types';

const PRESETS = [
    { label: "SubhanAllah", target: 33, meaning: "Glory be to Allah" },
    { label: "Alhamdulillah", target: 33, meaning: "Praise be to Allah" },
    { label: "Allahu Akbar", target: 34, meaning: "Allah is Greatest" },
    { label: "Astaghfirullah", target: 100, meaning: "I seek forgiveness" },
    { label: "Salawat", target: 10, meaning: "Blessings on Prophet" },
];

const TasbihCounter: React.FC = () => {
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(33);
    const [currentDhikr, setCurrentDhikr] = useState("SubhanAllah");
    const [meaning, setMeaning] = useState("Glory be to Allah");
    
    const [loadingSuggestion, setLoadingSuggestion] = useState(false);
    const [feeling, setFeeling] = useState('');
    const [isPulsing, setIsPulsing] = useState(false);
    const [showSuggestionInput, setShowSuggestionInput] = useState(false);

    // Haptic feedback
    const triggerHaptic = useCallback(() => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }, []);

    const handleIncrement = useCallback(() => {
        setCount(prev => prev + 1);
        setIsPulsing(true);
        triggerHaptic();
        setTimeout(() => setIsPulsing(false), 100);
    }, [triggerHaptic]);

    const handleReset = () => {
        if (window.confirm("Reset counter?")) {
            setCount(0);
            triggerHaptic();
        }
    };

    const handlePreset = (p: typeof PRESETS[0]) => {
        setCount(0);
        setTarget(p.target);
        setCurrentDhikr(p.label);
        setMeaning(p.meaning);
        triggerHaptic();
    };

    const fetchSuggestion = async () => {
        if (!feeling.trim()) return;
        setLoadingSuggestion(true);
        try {
            const res = await getDhikrSuggestion(feeling);
            if (res) {
                setCount(0);
                setTarget(res.target || 33);
                setCurrentDhikr(res.arabic || res.transliteration);
                setMeaning(res.meaning);
                setShowSuggestionInput(false);
                setFeeling('');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSuggestion(false);
        }
    };

    const progress = Math.min((count / target) * 100, 100);
    const circumference = 2 * Math.PI * 90; // for r=90
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="max-w-4xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col items-center justify-between py-4 sm:py-8 px-4 space-y-8">
            
            {/* Header Area */}
            <div className="w-full text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
                    <Fingerprint className="w-6 h-6 text-emerald-600" />
                    Smart Tasbih
                </h2>
                <div className="flex flex-col items-center">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm tracking-wide uppercase">{currentDhikr}</span>
                    <span className="text-slate-400 text-[10px] sm:text-xs font-medium px-4">{meaning}</span>
                </div>
            </div>

            {/* Main Counter Display */}
            <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[350px]">
                <div 
                    onClick={handleIncrement}
                    className={`relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center rounded-full cursor-pointer select-none transition-all duration-150 active:scale-95 touch-manipulation ${
                        isPulsing ? 'scale-105 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'shadow-xl'
                    }`}
                >
                    {/* Progress Circle SVG */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="50%" cy="50%" r="45%"
                            className="stroke-slate-100 dark:stroke-slate-800 fill-white dark:fill-slate-900"
                            strokeWidth="10"
                        />
                        <circle
                            cx="50%" cy="50%" r="45%"
                            className="stroke-emerald-500 fill-transparent transition-all duration-300"
                            strokeWidth="10"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: isNaN(offset) ? circumference : offset
                            }}
                        />
                    </svg>

                    {/* Counter Values */}
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</span>
                        <span className="text-7xl sm:text-8xl font-black text-slate-800 dark:text-white tabular-nums transition-all tracking-tighter">
                            {count}
                        </span>
                        <div className="flex items-center gap-1 mt-2 text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                            <Target className="w-3 h-3" />
                            <span className="text-xs font-bold">{target}</span>
                        </div>
                    </div>
                    
                    {/* Ripple Effect Background */}
                    <div className={`absolute inset-0 rounded-full bg-emerald-500/5 transition-opacity duration-300 ${isPulsing ? 'opacity-100' : 'opacity-0'}`}></div>
                </div>

                {/* Reset Button */}
                <button 
                    onClick={handleReset}
                    className="mt-8 p-4 bg-white dark:bg-slate-900 rounded-full shadow-md border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:rotate-180 transition-all active:scale-90"
                    title="Reset Counter"
                >
                    <RotateCcw className="w-6 h-6" />
                </button>
            </div>

            {/* Presets and AI Suggestions */}
            <div className="w-full max-w-2xl space-y-6">
                
                {/* AI Suggestion Trigger */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-emerald-50 dark:border-emerald-900/30 shadow-sm relative overflow-hidden group">
                    {!showSuggestionInput ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">How are you feeling?</h4>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">AI Personalized Dhikr</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowSuggestionInput(true)}
                                className="bg-slate-900 dark:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg active:scale-95"
                            >
                                Get Help
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Share your heart</h4>
                                <button onClick={() => setShowSuggestionInput(false)} className="text-slate-400 hover:text-slate-600">
                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={feeling}
                                    onChange={(e) => setFeeling(e.target.value)}
                                    placeholder="E.g., Stressed about work, Feeling grateful..."
                                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none text-sm text-slate-700 dark:text-slate-200"
                                />
                                <button 
                                    onClick={fetchSuggestion}
                                    disabled={loadingSuggestion || !feeling}
                                    className="bg-emerald-600 text-white p-3 rounded-xl disabled:opacity-50"
                                >
                                    {loadingSuggestion ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Horizontal Presets */}
                <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => handlePreset(p)}
                            className={`flex flex-col items-start p-4 min-w-[140px] rounded-2xl border transition-all text-left group ${
                                currentDhikr === p.label 
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' 
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            <span className="text-xs font-bold truncate w-full">{p.label}</span>
                            <span className={`text-[9px] uppercase tracking-widest font-black mt-1 ${currentDhikr === p.label ? 'text-emerald-100 opacity-80' : 'text-slate-400'}`}>
                                {p.target} Counts
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Instruction Footer */}
            <div className="text-center opacity-40">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <Fingerprint className="w-3 h-3" />
                    Tap anywhere on the circle to count
                </p>
            </div>
        </div>
    );
};

export default TasbihCounter;