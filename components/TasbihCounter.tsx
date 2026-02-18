import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Target, Sparkles, Loader2, Fingerprint, Volume2, VolumeX, Settings, Edit3, Save, XCircle, CheckCircle2 } from 'lucide-react';
import { getDhikrSuggestion } from '../services/geminiService';
import { DhikrSuggestion } from '../types';

const PRESETS = [
    { label: "SubhanAllah", target: 33, meaning: "Glory be to Allah" },
    { label: "Alhamdulillah", target: 33, meaning: "Praise be to Allah" },
    { label: "Allahu Akbar", target: 34, meaning: "Allah is Greatest" },
    { label: "Astaghfirullah", target: 100, meaning: "I seek forgiveness" },
    { label: "Salawat", target: 100, meaning: "Blessings on Prophet" },
];

const TasbihCounter: React.FC = () => {
    const [count, setCount] = useState(() => Number(localStorage.getItem('zestislam_tasbih_count')) || 0);
    const [target, setTarget] = useState(() => Number(localStorage.getItem('zestislam_tasbih_target')) || 33);
    const [currentDhikr, setCurrentDhikr] = useState(() => localStorage.getItem('zestislam_tasbih_dhikr') || "SubhanAllah");
    const [meaning, setMeaning] = useState(() => localStorage.getItem('zestislam_tasbih_meaning') || "Glory be to Allah");
    
    const [loadingSuggestion, setLoadingSuggestion] = useState(false);
    const [feeling, setFeeling] = useState('');
    const [isPulsing, setIsPulsing] = useState(false);
    const [showSuggestionInput, setShowSuggestionInput] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem('zestislam_tasbih_audio') === 'true');
    const [hapticEnabled, setHapticEnabled] = useState(() => localStorage.getItem('zestislam_tasbih_haptic') !== 'false');

    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        return () => { if (audioContextRef.current) audioContextRef.current.close(); };
    }, []);

    const playClick = useCallback((freq = 800, vol = 0.1) => {
        if (!audioEnabled) return;
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {}
    }, [audioEnabled]);

    const triggerHaptic = useCallback((duration: number | number[] = 20) => {
        if (hapticEnabled && 'vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }, [hapticEnabled]);

    useEffect(() => {
        localStorage.setItem('zestislam_tasbih_count', count.toString());
        localStorage.setItem('zestislam_tasbih_target', target.toString());
        localStorage.setItem('zestislam_tasbih_dhikr', currentDhikr);
        localStorage.setItem('zestislam_tasbih_meaning', meaning);
        localStorage.setItem('zestislam_tasbih_audio', audioEnabled.toString());
        localStorage.setItem('zestislam_tasbih_haptic', hapticEnabled.toString());
    }, [count, target, currentDhikr, meaning, audioEnabled, hapticEnabled]);

    const isGoalReached = count >= target;

    const handleIncrement = useCallback(() => {
        setCount(prev => prev + 1);
        setIsPulsing(true);
        if (count + 1 === target) {
            triggerHaptic([50, 30, 50]);
            playClick(1200, 0.2);
        } else {
            triggerHaptic(20);
            playClick(800, 0.1);
        }
        setTimeout(() => setIsPulsing(false), 150);
    }, [count, target, triggerHaptic, playClick]);

    const handleReset = useCallback(() => {
        if (window.confirm("Reset count?")) {
            setCount(0);
            triggerHaptic(40);
        }
    }, [triggerHaptic]);

    const handlePreset = (p: typeof PRESETS[0]) => {
        setCount(0);
        setTarget(p.target);
        setCurrentDhikr(p.label);
        setMeaning(p.meaning);
        triggerHaptic(30);
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
        } catch (e) { console.error(e); }
        finally { setLoadingSuggestion(false); }
    };

    const progress = Math.min((count / target) * 100, 100);

    return (
        <div className="max-w-4xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col items-center justify-between py-4 px-3 space-y-6 sm:space-y-8 animate-fade-in overflow-hidden">
            <div className="w-full flex justify-between items-start">
                <div className="flex-1 text-center">
                    <h2 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-2 uppercase tracking-tighter">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                        Tasbih
                    </h2>
                    <div className="mt-1 sm:mt-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-lg tracking-tight inline-block">{currentDhikr}</span>
                        <p className="text-slate-400 text-[8px] sm:text-xs font-medium px-2 mt-0 line-clamp-1">{meaning}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2 sm:p-3 rounded-full shadow-sm transition-all ${audioEnabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        {audioEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 shadow-sm hover:text-emerald-600 transition-all">
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[250px] sm:min-h-[400px]">
                <div onClick={handleIncrement} className={`relative w-56 h-56 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center rounded-full cursor-pointer select-none transition-all duration-300 active:scale-90 overflow-hidden ${isGoalReached ? 'shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/10' : isPulsing ? 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'shadow-xl dark:shadow-none'}`}>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="50%" cy="50%" r="45%" className="stroke-slate-100 dark:stroke-slate-800 fill-white dark:fill-slate-900" strokeWidth="10" />
                        <circle cx="50%" cy="50%" r="45%" className={`fill-transparent transition-all duration-500 ease-out ${isGoalReached ? 'stroke-emerald-400' : 'stroke-emerald-600'}`} strokeWidth="10" strokeDasharray="283" strokeDashoffset={283 - (progress * 2.83)} strokeLinecap="round" />
                    </svg>
                    <div className="relative z-10 flex flex-col items-center">
                        {isGoalReached && <div className="text-emerald-600 font-black text-[8px] sm:text-xs uppercase tracking-widest mb-1 animate-bounce">Goal Met</div>}
                        <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Count</span>
                        <span className={`text-6xl sm:text-8xl md:text-9xl font-black tabular-nums tracking-tighter ${isGoalReached ? 'text-emerald-600 scale-105' : 'text-slate-800 dark:text-white'}`}>{count}</span>
                        <div className={`flex items-center gap-1.5 mt-2 sm:mt-4 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full border transition-all ${isGoalReached ? 'bg-emerald-600 text-white' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'}`}>
                            <Target className="w-3 h-3 sm:w-4 sm:h-4" /><span className="text-[10px] sm:text-sm font-black">Target: {target}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 sm:gap-4 mt-8 sm:mt-10 w-full max-w-xs sm:max-w-md">
                    <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className="flex-1 p-3 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 font-black text-xs sm:text-sm active:scale-90 flex items-center justify-center gap-1.5"><RotateCcw className="w-4 h-4" /> Reset</button>
                    <button onClick={handleIncrement} className={`flex-[2] p-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm text-white shadow-lg active:scale-95 transition-all ${isGoalReached ? 'bg-emerald-700' : 'bg-emerald-600'}`}>Tap Anywhere</button>
                </div>
            </div>

            <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 border border-emerald-50 dark:border-emerald-900/30 shadow-sm">
                    {!showSuggestionInput ? (
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600"><Sparkles className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                                <div className="min-w-0"><h4 className="font-black text-slate-800 dark:text-slate-200 text-xs sm:text-base uppercase tracking-widest">AI Consultant</h4><p className="text-[9px] sm:text-xs text-slate-400 truncate">Personalized Dhikr suggestions.</p></div>
                            </div>
                            <button onClick={() => setShowSuggestionInput(true)} className="bg-slate-900 dark:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-widest shadow-md">Consult</button>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between"><h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Spiritual Query</h4><button onClick={() => setShowSuggestionInput(false)} className="text-slate-400"><XCircle className="w-4 h-4" /></button></div>
                            <div className="flex gap-2">
                                <input type="text" value={feeling} onChange={(e) => setFeeling(e.target.value)} placeholder="E.g. Feeling anxious..." className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-xs sm:text-sm text-slate-700 dark:text-slate-200 shadow-inner" />
                                <button onClick={fetchSuggestion} disabled={loadingSuggestion || !feeling} className="bg-emerald-600 text-white p-3 rounded-xl disabled:opacity-50 shadow-md transition-all">{loadingSuggestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                    {PRESETS.map((p) => (
                        <button key={p.label} onClick={() => handlePreset(p)} className={`flex flex-col items-start p-3 sm:p-4 min-w-[120px] sm:min-w-[160px] rounded-xl sm:rounded-3xl border transition-all text-left ${currentDhikr === p.label ? 'bg-emerald-600 border-emerald-500 text-white shadow-xl scale-105' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}>
                            <span className="text-[10px] sm:text-sm font-black uppercase tracking-tight truncate w-full">{p.label}</span>
                            <span className={`text-[7px] sm:text-[10px] uppercase tracking-widest font-black mt-1 ${currentDhikr === p.label ? 'text-emerald-100' : 'text-slate-400'}`}>T: {p.target}</span>
                        </button>
                    ))}
                </div>
            </div>

            {showSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md p-6 shadow-2xl relative border border-slate-200 dark:border-slate-800">
                        <button onClick={() => setShowSettings(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-red-500"><XCircle className="w-5 h-5" /></button>
                        <h3 className="text-xl font-black mb-6 uppercase tracking-tighter">Preferences</h3>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Goal Target</label><input type="number" value={target} onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black text-slate-800 dark:text-white shadow-inner" /></div>
                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dhikr Label</label><input type="text" value={currentDhikr} onChange={(e) => setCurrentDhikr(e.target.value)} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black text-slate-800 dark:text-white shadow-inner" /></div>
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl"><span className="font-black text-[10px] uppercase tracking-widest">Haptic Feedback</span><button onClick={() => setHapticEnabled(!hapticEnabled)} className={`w-10 h-5 rounded-full transition-all relative ${hapticEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${hapticEnabled ? 'left-5' : 'left-0.5'}`}></div></button></div>
                            <button onClick={() => setShowSettings(false)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black shadow-lg text-[10px] uppercase tracking-[0.2em] mt-4">Sync Preferences</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasbihCounter;