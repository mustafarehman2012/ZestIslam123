import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Moon, Star, Clock, CheckCircle2, Trophy, Loader2, Sparkles, BookOpen, Quote, Zap, Flame, Compass, ChevronRight, Target, LayoutGrid, Calendar, Lock, ShieldCheck, MapPin, Coffee, Utensils, Timer, MoonStar, Medal, Award, TrendingUp, Crown } from 'lucide-react';
import { getRamadanDailyContent } from '../services/geminiService';
import { RamadanDailyContent, PrayerTimeData } from '../types';

const RAMADAN_TASKS = [
    { id: 'fajr', label: 'Fajr & Sehri', points: 15 },
    { id: 'dhuhr', label: 'Dhuhr Prayer', points: 10 },
    { id: 'asr', label: 'Asr Prayer', points: 10 },
    { id: 'maghrib', label: 'Maghrib & Iftar', points: 20 },
    { id: 'isha', label: 'Isha & Taraweeh', points: 25 },
    { id: 'quran', label: 'Quran (1 Juz)', points: 50 },
    { id: 'dhikr', label: 'Adhkar', points: 15 },
    { id: 'charity', label: 'Sadaqah', points: 30 }
];

const MILESTONES = [
    { id: 'first_step', label: 'First Fast', desc: 'Complete all tasks on Day 1', icon: Sparkles, color: 'text-blue-500 bg-blue-50' },
    { id: 'steady', label: 'Steady Soul', desc: 'Achieve a 3-day streak', icon: Flame, color: 'text-orange-500 bg-orange-50' },
    { id: 'devoted', label: 'Devoted', desc: 'Reach 1000 Spiritual XP', icon: Medal, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'guardian', label: 'Night Guardian', desc: 'Complete Taraweeh 7 times', icon: ShieldCheck, color: 'text-indigo-500 bg-indigo-50' },
    { id: 'master', label: 'Elite Mumin', desc: 'Complete 25 days of odyssey', icon: Crown, color: 'text-amber-500 bg-amber-50' }
];

const RamadanHub: React.FC = () => {
    const [day, setDay] = useState<number>(0); 
    const [ramadanStartDate, setRamadanStartDate] = useState<Date | null>(null);
    const [content, setContent] = useState<RamadanDailyContent | null>(null);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [timings, setTimings] = useState<PrayerTimeData | null>(null);
    
    // Gamification States
    const [xp, setXp] = useState<number>(() => Number(localStorage.getItem('ramadan_total_xp')) || 0);
    const [streak, setStreak] = useState<number>(() => Number(localStorage.getItem('ramadan_streak')) || 0);
    const [badges, setBadges] = useState<string[]>(() => JSON.parse(localStorage.getItem('ramadan_badges') || '[]'));
    
    const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
        const saved = localStorage.getItem(`ramadan_tasks_day_${new Date().toDateString()}`);
        return saved ? JSON.parse(saved) : [];
    });
    
    const [view, setView] = useState<'DASHBOARD' | 'CHECKLIST' | 'ODYSSEY' | 'REWARDS'>('DASHBOARD');
    const [countdown, setCountdown] = useState<string>("--:--:--");
    const [nextEvent, setNextEvent] = useState<string>('Iftar');

    const fetchLocation = useCallback(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => {
                    console.error("Location access denied", err);
                    setLocation({ lat: 21.4225, lng: 39.8262 });
                }
            );
        }
    }, []);

    const fetchTimings = useCallback(async (lat: number, lng: number) => {
        try {
            const today = new Date();
            const res = await fetch(`https://api.aladhan.com/v1/timings/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}?latitude=${lat}&longitude=${lng}&method=2`);
            const data = await res.json();
            if (data.code === 200) {
                setTimings(data.data.timings);
            }
        } catch (e) {
            console.error("Failed to fetch timings", e);
        }
    }, []);

    useEffect(() => {
        const lastCheck = localStorage.getItem('ramadan_last_check_date');
        const today = new Date().toDateString();
        
        if (lastCheck && lastCheck !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastCheck === yesterday.toDateString()) {
                const newStreak = streak + 1;
                setStreak(newStreak);
                localStorage.setItem('ramadan_streak', newStreak.toString());
            } else {
                setStreak(1);
                localStorage.setItem('ramadan_streak', '1');
            }
        } else if (!lastCheck) {
            setStreak(1);
            localStorage.setItem('ramadan_streak', '1');
        }
        localStorage.setItem('ramadan_last_check_date', today);
    }, []);

    useEffect(() => {
        fetchLocation();
        const start = new Date();
        start.setDate(start.getDate() + 2);
        start.setHours(0, 0, 0, 0);
        setRamadanStartDate(start);

        const checkDay = () => {
            const now = new Date();
            if (now >= start) {
                const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
                setDay(Math.min(30, diff));
            } else {
                setDay(0);
            }
        };

        checkDay();
        const interval = setInterval(checkDay, 60000);
        return () => clearInterval(interval);
    }, [fetchLocation]);

    useEffect(() => {
        if (location) fetchTimings(location.lat, location.lng);
    }, [location, fetchTimings]);

    useEffect(() => {
        if (day > 0) fetchContent(day);
    }, [day]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            if (day === 0 && ramadanStartDate) {
                const diff = ramadanStartDate.getTime() - now.getTime();
                if (diff > 0) {
                    const h = Math.floor(diff / (1000 * 60 * 60));
                    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diff % (1000 * 60)) / 1000);
                    setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                    setNextEvent('Ramadan');
                    return;
                }
            }
            if (!timings) return;
            const timeToDate = (tStr: string, isTomorrow = false) => {
                const [h, m] = tStr.split(':').map(Number);
                const d = new Date();
                if (isTomorrow) d.setDate(d.getDate() + 1);
                d.setHours(h, m, 0, 0);
                return d;
            };
            const iftarTime = timeToDate(timings.Maghrib);
            const sehriTime = timeToDate(timings.Fajr);
            let target: Date;
            if (now < sehriTime) { target = sehriTime; setNextEvent('Sehri End'); }
            else if (now < iftarTime) { target = iftarTime; setNextEvent('Iftar'); }
            else { target = timeToDate(timings.Fajr, true); setNextEvent('Sehri End'); }
            const diff = target.getTime() - now.getTime();
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [timings, day, ramadanStartDate]);

    const fetchContent = async (d: number) => {
        const cached = localStorage.getItem(`ramadan_content_day_${d}`);
        if (cached) { setContent(JSON.parse(cached)); return; }
        setLoading(true);
        const res = await getRamadanDailyContent(d);
        if (res) {
            setContent(res);
            localStorage.setItem(`ramadan_content_day_${d}`, JSON.stringify(res));
        }
        setLoading(false);
    };

    const checkMilestones = (updatedXp: number, updatedBadges: string[]) => {
        const newBadges = [...updatedBadges];
        if (updatedXp >= 1000 && !newBadges.includes('devoted')) newBadges.push('devoted');
        if (streak >= 3 && !newBadges.includes('steady')) newBadges.push('steady');
        if (day >= 25 && !newBadges.includes('master')) newBadges.push('master');
        
        if (newBadges.length !== updatedBadges.length) {
            setBadges(newBadges);
            localStorage.setItem('ramadan_badges', JSON.stringify(newBadges));
        }
    };

    const toggleTask = (taskId: string) => {
        const task = RAMADAN_TASKS.find(t => t.id === taskId);
        if (!task) return;

        const isCompleting = !completedTasks.includes(taskId);
        const updatedTasks = isCompleting 
            ? [...completedTasks, taskId] 
            : completedTasks.filter(t => t !== taskId);
        
        setCompletedTasks(updatedTasks);
        localStorage.setItem(`ramadan_tasks_day_${new Date().toDateString()}`, JSON.stringify(updatedTasks));
        
        const xpChange = isCompleting ? task.points : -task.points;
        const newXp = Math.max(0, xp + xpChange);
        setXp(newXp);
        localStorage.setItem('ramadan_total_xp', newXp.toString());
        
        checkMilestones(newXp, badges);
    };

    const taskProgress = Math.round((completedTasks.length / RAMADAN_TASKS.length) * 100);
    const odysseyProgress = Math.round((day / 30) * 100);

    return (
        <div className="max-w-6xl mx-auto pb-32 animate-fade-in px-2 sm:px-4">
            {/* Gamified Stats Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 md:mb-8 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex flex-col">
                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center sm:text-left">Spiritual XP</span>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tabular-nums">{xp}</span>
                        </div>
                    </div>
                    <div className="h-8 md:h-10 w-[1px] bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>
                    <div className="flex flex-col">
                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center sm:text-left">Engage Streak</span>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500" />
                            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tabular-nums">{streak} Days</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-50 dark:border-slate-800 pt-3 sm:pt-0">
                    <div className="flex -space-x-2 md:-space-x-3">
                        {badges.length > 0 ? badges.slice(0, 4).map((b, i) => {
                            const badge = MILESTONES.find(m => m.id === b);
                            if (!badge) return null;
                            return (
                                <div key={i} className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${badge.color} shadow-lg`} title={badge.label}>
                                    <badge.icon className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                            );
                        }) : <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-2">No Badges Yet</span>}
                    </div>
                    <button onClick={() => setView('REWARDS')} className="px-4 md:px-5 py-1.5 md:py-2 bg-slate-50 dark:bg-slate-800 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-emerald-50 hover:text-emerald-600 transition-all">Hall of Fame</button>
                </div>
            </div>

            {/* Countdown Hero Section */}
            <div className={`p-6 md:p-14 rounded-[2.5rem] md:rounded-[5rem] mb-8 md:mb-12 text-white relative overflow-hidden shadow-2xl transition-all duration-1000 ${day === 0 ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-900/40' : (day >= 21 ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-900/40' : 'bg-[#012c22]')}`}>
                <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-emerald-500/10 rounded-full blur-[100px] md:blur-[140px] -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 grid lg:grid-cols-12 gap-8 md:gap-12 items-center">
                    <div className="lg:col-span-7 space-y-6 md:space-y-8">
                        <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-1.5 md:py-2 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">
                           {day === 0 ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Flame className="w-3.5 h-3.5" />}
                           {day === 0 ? 'Moon Sighting Phase' : `Ramadan Odyssey Day ${day}`}
                        </div>
                        <h1 className="text-4xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] md:leading-[0.85]">
                            {day === 0 ? <>Tomorrow Night<br/><span className="text-emerald-400">Moon Rises</span>.</> : <>Spiritual<br/><span className={day >= 21 ? 'text-amber-500' : 'text-emerald-400'}>Peak Fasting</span>.</>}
                        </h1>
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex justify-between text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
                                <span>30-Day Odyssey Progress</span>
                                <span>{odysseyProgress}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.5)]" style={{ width: `${odysseyProgress}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 bg-white/5 backdrop-blur-3xl p-8 md:p-14 rounded-[2rem] md:rounded-[3.5rem] border border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] flex flex-col items-center text-center group">
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8 shadow-2xl transition-all duration-700 ${nextEvent === 'Iftar' ? 'bg-emerald-500/20 text-emerald-400 rotate-3' : 'bg-amber-500/20 text-amber-400 -rotate-3'}`}>
                            {nextEvent === 'Iftar' ? <Utensils className="w-8 h-8 md:w-10 md:h-10" /> : (nextEvent === 'Ramadan' ? <MoonStar className="w-8 h-8 md:w-10 md:h-10 animate-pulse" /> : <Coffee className="w-8 h-8 md:w-10 md:h-10" />)}
                        </div>
                        <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.5em] text-slate-400 mb-2 md:mb-4">
                            {day === 0 ? 'Countdown to Ramadan' : `Time until ${nextEvent}`}
                        </span>
                        <span className="text-4xl md:text-8xl font-mono font-black tabular-nums tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] text-white">
                            {countdown}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs - Mobile Responsive Scroll */}
            <div className="flex justify-center mb-8 md:mb-12">
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-1.5 md:p-2 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-white/20 dark:border-white/5 flex gap-1 md:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
                    {[
                        { id: 'DASHBOARD', icon: LayoutGrid, label: 'Stats' },
                        { id: 'ODYSSEY', icon: Compass, label: 'Odyssey' },
                        { id: 'CHECKLIST', icon: CheckCircle2, label: 'Tasks' },
                        { id: 'REWARDS', icon: Award, label: 'Rewards' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setView(t.id as any)}
                            className={`flex items-center justify-center gap-2 md:gap-3 px-5 md:px-8 py-3 md:py-4 rounded-[1.5rem] md:rounded-[2rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap flex-1 sm:flex-none ${view === t.id ? (day >= 21 ? 'bg-amber-600 text-white shadow-lg' : 'bg-emerald-600 text-white shadow-lg') : 'text-slate-900 dark:text-white hover:text-emerald-600'}`}
                        >
                            <t.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* View Renders */}
            {view === 'DASHBOARD' && day !== 0 && (
                <div className="grid lg:grid-cols-12 gap-6 md:gap-8 animate-fade-in-up">
                    <div className="lg:col-span-8 space-y-6 md:space-y-8">
                        {loading ? (
                            <div className="h-64 md:h-96 glass-card rounded-[2.5rem] md:rounded-[4rem] flex flex-col items-center justify-center">
                                <Loader2 className="w-10 h-10 md:w-14 md:h-14 animate-spin text-emerald-500 mb-4 md:mb-6" />
                                <span className="font-black text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-slate-400">Syncing Odyssey...</span>
                            </div>
                        ) : content ? (
                            <div className="glass-card rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 space-y-8 md:space-y-12 relative overflow-hidden border-none shadow-2xl">
                                <div className="space-y-4 md:space-y-6">
                                    <h3 className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-2 md:gap-3"><BookOpen className="w-4 h-4 md:w-5 md:h-5" /> Daily Reflection</h3>
                                    <p className="text-2xl md:text-5xl font-serif font-black leading-tight tracking-tight text-slate-900 dark:text-white italic">"{content.reflection}"</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                                    <div className="p-6 md:p-10 bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                        <h4 className="text-[8px] md:text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4 md:mb-6 flex items-center gap-2">Authentic Wisdom <MoonStar className="w-3 h-3" /></h4>
                                        <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white leading-relaxed italic">{content.hadith}</p>
                                    </div>
                                    <div className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl transition-all ${day >= 21 ? 'bg-amber-600 shadow-amber-500/20' : 'bg-emerald-600 shadow-emerald-500/20'}`}>
                                        <h4 className="text-[8px] md:text-[9px] font-black text-white/60 uppercase tracking-[0.4em] mb-4 md:mb-6 flex items-center gap-2"><Zap className="w-3.5 h-3.5 fill-current" /> Daily Mission</h4>
                                        <p className="text-lg md:text-xl font-black leading-tight tracking-tight">{content.mission}</p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-card p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-center border-none shadow-xl flex flex-col items-center">
                            <div className="w-40 h-40 md:w-48 md:h-48 relative mb-6 md:mb-10">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="50%" cy="50%" r="45%" className="stroke-slate-100 dark:stroke-slate-800 fill-transparent" strokeWidth="10" />
                                    <circle cx="50%" cy="50%" r="45%" className={`fill-transparent transition-all duration-1000 ${day >= 21 ? 'stroke-amber-500' : 'stroke-emerald-600'}`} strokeWidth="10" strokeDasharray="283" strokeDashoffset={283 - (taskProgress * 2.83)} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{taskProgress}%</span>
                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 tracking-widest">Today</span>
                                </div>
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Ibadah Level</h3>
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-6 md:mb-10">Ascending to Rank {Math.floor(xp / 500) + 1}</p>
                            <div className="w-full space-y-3">
                                {RAMADAN_TASKS.slice(0, 3).map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-3 md:p-4 bg-white/50 dark:bg-slate-800/50 rounded-[1.25rem] md:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-tight">{t.label}</span>
                                        {completedTasks.includes(t.id) ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" /> : <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-slate-100 dark:border-slate-700" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'CHECKLIST' && (
                <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 px-1 animate-fade-in-up">
                    <div className="text-center mb-10 md:mb-14">
                        <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2 md:mb-4">Ibadah Protocols</h3>
                        <p className="text-slate-500 font-medium text-base md:text-lg">Every task fuels your spiritual ascent.</p>
                    </div>
                    <div className="grid gap-3 md:gap-4">
                        {RAMADAN_TASKS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => toggleTask(t.id)}
                                className={`w-full p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] flex items-center justify-between transition-all group ${
                                    completedTasks.includes(t.id) 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/20 shadow-xl' 
                                    : 'bg-white dark:bg-slate-900 border-2 border-transparent shadow-md hover:scale-[1.01]'
                                }`}
                            >
                                <div className="flex items-center gap-4 md:gap-8 text-left">
                                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all shadow-sm ${completedTasks.includes(t.id) ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:scale-110'}`}>
                                        {completedTasks.includes(t.id) ? <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7" /> : <Star className="w-5 h-5 md:w-7 md:h-7" />}
                                    </div>
                                    <div>
                                        <h4 className={`text-lg md:text-2xl font-black tracking-tight ${completedTasks.includes(t.id) ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{t.label}</h4>
                                        <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5 md:mt-1">Reward: +{t.points} XP</p>
                                    </div>
                                </div>
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all flex items-center justify-center ${completedTasks.includes(t.id) ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/20 shadow-lg' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <Zap className="w-3.5 h-3.5 md:w-5 md:h-5 fill-current" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {view === 'ODYSSEY' && (
                <div className="max-w-5xl mx-auto px-1 space-y-8 md:space-y-12">
                    <div className="text-center">
                        <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2 md:mb-4">30-Day Completion Path</h3>
                        <p className="text-slate-500 font-medium text-base md:text-lg">Your chronological path to spiritual peak.</p>
                    </div>
                    <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2 md:gap-4 animate-fade-in">
                        {Array.from({ length: 30 }).map((_, i) => {
                            const d = i + 1;
                            const isPast = d < day;
                            const isCurrent = d === day;
                            const isFuture = d > day;
                            const isLastTen = d >= 21;

                            return (
                                <button
                                    key={d}
                                    onClick={() => { if (!isFuture) { setDay(d); fetchContent(d); } }}
                                    className={`w-full aspect-square rounded-[1.25rem] md:rounded-[2rem] flex flex-col items-center justify-center transition-all relative group overflow-hidden ${
                                        isCurrent ? (isLastTen ? 'bg-amber-600 text-white shadow-2xl scale-110 ring-4 ring-amber-400/30' : 'bg-emerald-600 text-white shadow-2xl scale-110 ring-4 ring-emerald-400/30') :
                                        isPast ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' :
                                        'bg-white dark:bg-slate-900 text-slate-200 dark:text-slate-700 border border-slate-100 dark:border-slate-800 opacity-60'
                                    } ${isFuture ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                                    disabled={isFuture}
                                >
                                    <span className="text-xl md:text-2xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white">{d}</span>
                                    {isPast && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 mt-0.5 md:mt-1 opacity-60" />}
                                    {isLastTen && <div className="absolute top-1 md:top-2 right-1 md:right-2"><ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-500 opacity-60" /></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {view === 'REWARDS' && (
                <div className="max-w-4xl mx-auto px-1 space-y-8 md:space-y-12 animate-fade-in-up">
                    <div className="text-center">
                        <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2 md:mb-4">Milestone Badges</h3>
                        <p className="text-slate-500 font-medium text-base md:text-lg">Collect honors for your consistency and devotion.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {MILESTONES.map(m => {
                            const isEarned = badges.includes(m.id);
                            return (
                                <div key={m.id} className={`p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border-2 transition-all flex flex-col items-center text-center ${isEarned ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-xl' : 'bg-slate-50 dark:bg-slate-950 border-transparent opacity-40 grayscale'}`}>
                                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 shadow-lg ${m.color}`}>
                                        <m.icon className="w-8 h-8 md:w-10 md:h-10" />
                                    </div>
                                    <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{m.label}</h4>
                                    <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 md:mt-2">{m.desc}</p>
                                    {isEarned ? (
                                        <div className="mt-4 md:mt-6 flex items-center gap-1.5 md:gap-2 text-emerald-500 font-black text-[8px] md:text-[9px] uppercase tracking-widest">
                                            <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Achievement Unlocked
                                        </div>
                                    ) : (
                                        <div className="mt-4 md:mt-6 flex items-center gap-1.5 md:gap-2 text-slate-400 font-black text-[8px] md:text-[9px] uppercase tracking-widest">
                                            <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" /> Locked
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RamadanHub;