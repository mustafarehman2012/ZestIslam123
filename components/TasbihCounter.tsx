import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Target, Sparkles, Loader2, Volume2, VolumeX, Settings, XCircle, CheckCircle2, Trophy, ArrowRight } from 'lucide-react';
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
    const [showCelebration, setShowCelebration] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem('zestislam_tasbih_audio') === 'true');
    const [hapticEnabled, setHapticEnabled] = useState(() => localStorage.getItem('zestislam_tasbih_haptic') !== 'false');

    const audioContextRef = useRef<AudioContext | null>(null);

    const playClick = useCallback((freq = 800, vol = 0.1) => {
        if (!audioEnabled) return;
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();
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
        if (hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try { navigator.vibrate(duration); } catch (e) {}
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

    const handleIncrement = useCallback(() => {
        if (count >= target) return;
        
        const newCount = count + 1;
        setCount(newCount);
        setIsPulsing(true);

        if (newCount === target) {
            triggerHaptic([100, 50, 100]);
            playClick(1200, 0.3);
            setTimeout(() => setShowCelebration(true), 300);
        } else {
            triggerHaptic(25);
            playClick(800, 0.1);
        }
        setTimeout(() => setIsPulsing(false), 150);
    }, [count, target, triggerHaptic, playClick]);

    const handleReset = useCallback(() => {
        setCount(0);
        setShowCelebration(false);
        triggerHaptic(40);
    }, [triggerHaptic]);

    const handlePreset = (p: typeof PRESETS[0]) => {
        setCount(0);
        setTarget(p.target);
        setCurrentDhikr(p.label);
        setMeaning(p.meaning);
        setShowCelebration(false);
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
                setCurrentDhikr(res.arabic || res.transliteration || "Dhikr");
                setMeaning(res.meaning || "Spiritual remembrance");
                setShowSuggestionInput(false);
                setFeeling('');
            }
        } catch (e) { console.error(e); }
        finally { setLoadingSuggestion(false); }
    };

    const progress = Math.min((count / target) * 100, 100);

    return (
        <div className="max-w-md mx-auto h-full flex flex-col items-center justify-between py-4 px-4 space-y-6 animate-fade-in relative overflow-hidden">
            
            {/* Celebration Overlay */}
            {showCelebration && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-emerald-600/20 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-sm p-8 text-center shadow-2xl border-4 border-emerald-500 animate-bounce-in">
                        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trophy className="w-12 h-12 text-emerald-600 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Ma Sha Allah!</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Goal of {target} {currentDhikr} completed.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleReset} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">Restart Session</button>
                            <button onClick={() => setShowCelebration(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="w-full flex justify-between items-center">
                <button onClick={handleReset} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 active:rotate-180 transition-transform duration-500">
                    <RotateCcw className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Remembrance</h2>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-xl tracking-tight block">{currentDhikr}</span>
                </div>
                <button onClick={() => setShowSettings(true)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500">
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Main Counter Ring */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <div 
                    onClick={handleIncrement} 
                    className={`relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center rounded-full cursor-pointer select-none transition-all duration-300 active:scale-[0.92] ${isPulsing ? 'scale-105' : ''}`}
                >
                    <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-2xl">
                        <circle cx="50%" cy="50%" r="46%" className="stroke-slate-100 dark:stroke-slate-800 fill-white dark:fill-slate-900" strokeWidth="12" />
                        <circle 
                            cx="50%" cy="50%" r="46%" 
                            className={`fill-transparent transition-all duration-700 ease-out ${progress >= 100 ? 'stroke-emerald-400' : 'stroke-emerald-600'}`} 
                            strokeWidth="12" 
                            strokeDasharray="289" 
                            strokeDashoffset={289 - (progress * 2.89)} 
                            strokeLinecap="round" 
                        />
                    </svg>
                    
                    <div className="relative z-10 flex flex-col items-center text-center px-6">
                        <span className="text-7xl sm:text-8xl font-black tabular-nums tracking-tighter text-slate-800 dark:text-white">{count}</span>
                        <div className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-100 dark:border-emerald-800">
                            <Target className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">{target} Target</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Suggestion Card - Mobile Optimized */}
            <div className="w-full space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-xl">
                    {!showSuggestionInput ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600"><Sparkles className="w-5 h-5" /></div>
                                <div>
                                    <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tighter">AI Soul Guide</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">Custom dhikr for your mood.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSuggestionInput(true)} className="bg-slate-900 dark:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Engage</button>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How do you feel?</h4>
                                <button onClick={() => setShowSuggestionInput(false)} className="text-slate-400"><XCircle className="w-4 h-4" /></button>
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={feeling} 
                                    onChange={(e) => setFeeling(e.target.value)} 
                                    placeholder="e.g. anxious, grateful..." 
                                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500" 
                                />
                                <button onClick={fetchSuggestion} disabled={loadingSuggestion || !feeling} className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg">
                                    {loadingSuggestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Presets Horizontal Scroll */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-4 px-4">
                    {PRESETS.map((p) => (
                        <button 
                            key={p.label} 
                            onClick={() => handlePreset(p)} 
                            className={`flex flex-col items-start p-4 min-w-[140px] rounded-[1.5rem] border transition-all text-left ${currentDhikr === p.label ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg scale-95' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}
                        >
                            <span className="text-[11px] font-black uppercase tracking-tight truncate w-full">{p.label}</span>
                            <span className={`text-[8px] uppercase tracking-widest font-black mt-1 ${currentDhikr === p.label ? 'text-emerald-100' : 'text-slate-400'}`}>Goal {p.target}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-xs p-6 shadow-2xl relative border border-slate-200 dark:border-slate-800">
                        <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 p-2 text-slate-400"><XCircle className="w-5 h-5" /></button>
                        <h3 className="text-lg font-black mb-6 uppercase tracking-tighter text-slate-900 dark:text-white">Counter Settings</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Manual Target</label>
                                <input 
                                    type="number" 
                                    value={target} 
                                    onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))} 
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500" 
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="flex items-center gap-2">
                                    {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                                    <span className="font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300">Audio Clicks</span>
                                </div>
                                <button onClick={() => setAudioEnabled(!audioEnabled)} className={`w-10 h-5 rounded-full transition-all relative ${audioEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${audioEnabled ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <button onClick={() => setShowSettings(false)} className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg">Save Preferences</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasbihCounter;