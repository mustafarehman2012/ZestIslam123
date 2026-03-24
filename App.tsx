import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Home, Book, MessageCircle, Sparkles, Menu, X, Clock, Image, Video, MapPin, Mic, BookOpen, Search, RotateCcw, Heart, Moon, HelpCircle, ChevronRight, Sun, Info, Youtube, Instagram, User, LogIn, LogOut, Bell, Mail, Lock, Settings, Phone, KeyRound, Loader2, CheckCircle, Send, Globe, Zap, Shield, Target, Compass } from 'lucide-react';
import PrayerTimes from './components/PrayerTimes';
import QuranSearch from './components/QuranSearch';
import HadeesSearch from './components/HadeesSearch';
import UnifiedSearch from './components/UnifiedSearch';
import IslamicChat from './components/IslamicChat';
import DuaGenerator from './components/DuaGenerator';
import HalalFinder from './components/HalalFinder';
import LiveScholar from './components/LiveScholar';
import TasbihCounter from './components/TasbihCounter';
import NamesOfAllah from './components/NamesOfAllah';
import DreamInterpreter from './components/DreamInterpreter';
import IslamicQuiz from './components/IslamicQuiz';

import { AppView, UserProfile } from './types';
import { getDailyInspiration } from './services/geminiService';
import { signInUser, signUpUser, signOutUser, resetUserPassword, sendContactMessage, updateUserPassword, subscribeToAuthChanges } from './services/userService';

const App: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dailyInspiration, setDailyInspiration] = useState<{ type: string, text: string, source: string } | null>(null);

    const [user, setUser] = useState<UserProfile | null>(() => {
        try {
            const stored = localStorage.getItem('zestislam_current_session');
            return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
    });

    const [loginMode, setLoginMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authSuccess, setAuthSuccess] = useState<string | null>(null);
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [sendingContact, setSendingContact] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('zestislam_reminder_time') || '09:00');

    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme');
            return stored ? stored === 'dark' : true;
        }
        return true;
    });

    useEffect(() => {
        const fetchDailyWisdom = async () => {
            const today = new Date().toDateString();
            const cachedDate = localStorage.getItem('zest_wisdom_date');
            const cachedData = localStorage.getItem('zest_wisdom_data');

            if (cachedDate === today && cachedData) {
                try { setDailyInspiration(JSON.parse(cachedData)); } catch (e) { const data = await getDailyInspiration(); if (data) setDailyInspiration(data); }
            } else {
                const data = await getDailyInspiration();
                if (data) {
                    localStorage.setItem('zest_wisdom_date', today);
                    localStorage.setItem('zest_wisdom_data', JSON.stringify(data));
                    setDailyInspiration(data);
                }
            }
        };
        fetchDailyWisdom();

        const subscription = subscribeToAuthChanges((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                navigate('/update-password');
                if (session?.user) {
                    const name = session.user.displayName || session.user.email?.split('@')[0];
                    setUser({ name: name || 'User', email: session.user.email || '', joinedDate: new Date(session.user.metadata?.creationTime || Date.now()) });
                }
            }
        });
        return () => { if (subscription) subscription.unsubscribe(); }
    }, []);

    useEffect(() => {
        if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
        else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    }, [darkMode]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true); setAuthError(null); setAuthSuccess(null);
        try {
            if (loginMode === 'forgot') {
                const result = await resetUserPassword(authForm.email);
                if (result.error) setAuthError(result.error);
                else { setAuthSuccess("Reset link sent! Please check your spam folder as well."); setAuthForm({ ...authForm, password: '' }); }
            } else {
                let result = loginMode === 'signup' 
                    ? await signUpUser(authForm.email, authForm.password, authForm.name)
                    : await signInUser(authForm.email, authForm.password);

                if (result.error) setAuthError(result.error);
                else if (result.user) {
                    setUser(result.user);
                    localStorage.setItem('zestislam_current_session', JSON.stringify(result.user));
                    navigate('/');
                }
            }
        } catch (err) { setAuthError("Auth error occurred."); }
        finally { setAuthLoading(false); }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        const result = await updateUserPassword(authForm.password);
        if (result.success) {
            setAuthSuccess("Updated!");
            setTimeout(() => { navigate('/'); setAuthForm({ name: '', email: '', password: '' }); }, 2000);
        } else setAuthError(result.error || "Failed.");
        setAuthLoading(false);
    };

    const handleLogout = async () => {
        await signOutUser(); 
        setUser(null);
        localStorage.removeItem('zestislam_current_session');
        navigate('/');
        setMobileMenuOpen(false);
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSendingContact(true);
        await sendContactMessage(contactForm.name, contactForm.email, contactForm.message);
        setSentSuccess(true); setSendingContact(false); setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => setSentSuccess(false), 5000);
    };

    const handleSaveSettings = () => {
        localStorage.setItem('zestislam_reminder_time', reminderTime);
        setShowSettings(false);
    };

    const navItems = [
        { id: AppView.HOME, label: 'Dashboard', icon: Home, group: 'Main', path: '/' },
        { id: AppView.PRAYER, label: 'Prayer Times', icon: Clock, group: 'Main', path: '/prayer' },
        { id: AppView.QURAN, label: 'Quran AI', icon: BookOpen, group: 'Knowledge', path: '/quran' },
        { id: AppView.HADEES, label: 'Hadees AI', icon: Book, group: 'Knowledge', path: '/hadees' },
        { id: AppView.UNIFIED, label: 'Search', icon: Search, group: 'Knowledge', path: '/search' },
        { id: AppView.CHAT, label: 'Scholar Chat', icon: MessageCircle, group: 'Assistant', path: '/chat' },
        { id: AppView.LIVE, label: 'Live Scholar', icon: Mic, group: 'Assistant', path: '/live' },
        { id: AppView.TASBIH, label: 'Smart Tasbih', icon: RotateCcw, group: 'Spiritual', path: '/tasbih' },
        { id: AppView.NAMES, label: '99 Names', icon: Heart, group: 'Spiritual', path: '/99-names' },
        { id: AppView.DUA, label: 'Dua Gen', icon: Sparkles, group: 'Spiritual', path: '/dua' },
        { id: AppView.DREAM, label: 'Dream Interpret', icon: Moon, group: 'Tools', path: '/dream' },
        { id: AppView.QUIZ, label: 'Quiz', icon: HelpCircle, group: 'Tools', path: '/quiz' },
        { id: AppView.FINDER, label: 'Halal Finder', icon: MapPin, group: 'Tools', path: '/halal-finder' },
        { id: AppView.ABOUT, label: 'About Zest', icon: Info, group: 'General', path: '/about' },
        { id: AppView.CONTACT, label: 'Contact Us', icon: Mail, group: 'General', path: '/contact' },
    ];

    const groupedNav = navItems.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, typeof navItems>);

    const renderView = () => (
        <Routes>
            <Route path="/" element={
                <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto px-1 sm:px-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                                Salam, <span className="text-emerald-600">{user ? user.name : 'Seeker'}</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-[11px] sm:text-lg">Your spiritual intelligent companion.</p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="glass-card rounded-[1.8rem] sm:rounded-[3rem] p-0 shadow-sm border-none overflow-hidden">
                                <PrayerTimes />
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            {user && (
                                <div className="bg-emerald-600 rounded-[1.8rem] sm:rounded-[3rem] p-4 sm:p-8 text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
                                    <div className="relative z-10 flex items-center gap-3 sm:gap-5">
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center text-lg sm:text-2xl font-black">{user.name.charAt(0).toUpperCase()}</div>
                                        <div><p className="font-black text-base sm:text-xl uppercase tracking-tight truncate max-w-[160px]">{user.name}</p><p className="text-emerald-100 text-[7px] sm:text-[10px] font-black uppercase tracking-widest opacity-70">Seeker Link</p></div>
                                    </div>
                                </div>
                            )}
                            <h3 className="text-[8px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] px-2 sm:px-4">Fast Hub</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                                {[
                                    { path: '/tasbih', title: 'Tasbih', desc: 'Heart Pulse', color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30', icon: RotateCcw },
                                    { path: '/99-names', title: '99 Names', desc: 'Infinite Mercy', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30', icon: Heart },
                                    { path: '/quiz', title: 'Rank Quiz', desc: 'Knowledge', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950', icon: HelpCircle },
                                    { path: '/dream', title: 'Dreams', desc: 'Vision AI', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30', icon: Moon },
                                ].map((item) => (
                                    <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-5 glass-card rounded-2xl border-none shadow-sm hover:scale-[1.02] transition-all group text-center sm:text-left">
                                        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color} group-hover:rotate-6 transition-transform shadow-md`}><item.icon className="w-4 h-4 sm:w-6 h-6" /></div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-slate-900 dark:text-white text-[10px] sm:text-sm uppercase tracking-tight truncate">{item.title}</h4>
                                            <p className="hidden sm:block text-[7px] sm:text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] truncate">{item.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            } />
            <Route path="/quran" element={<QuranSearch />} />
            <Route path="/hadees" element={<HadeesSearch />} />
            <Route path="/search" element={<UnifiedSearch />} />
            <Route path="/chat" element={<IslamicChat user={user} onLoginClick={() => navigate('/login')} />} />
            <Route path="/dua" element={<DuaGenerator />} />
            <Route path="/halal-finder" element={<HalalFinder />} />
            <Route path="/live" element={<LiveScholar />} />
            <Route path="/tasbih" element={<TasbihCounter />} />
            <Route path="/99-names" element={<NamesOfAllah />} />
            <Route path="/dream" element={<DreamInterpreter />} />
            <Route path="/quiz" element={<IslamicQuiz />} />
            <Route path="/prayer" element={<div className="max-w-7xl mx-auto"><PrayerTimes /></div>} />
            <Route path="/about" element={
                <div className="max-w-5xl mx-auto space-y-8 md:space-y-16 animate-fade-in py-6 md:py-12 px-3 md:px-4 pb-20">
                    <div className="text-center space-y-4 md:space-y-8">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl">
                            <Sparkles className="w-8 h-8 md:w-12 md:h-12" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight">The <span className="text-emerald-600">NoorZest Islam</span> Story.</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.3em] text-[9px] md:text-xs">Faith • Intellect • Technology</p>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs md:text-xl max-w-2xl mx-auto font-medium px-2">
                            Merging classical Islamic scholarship with modern AI to provide tools that help you understand and grow.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
                        {[
                            { title: 'Authentic', desc: 'Verified sources', icon: Shield, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
                            { title: 'Smart', desc: 'AI insights', icon: Target, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
                            { title: 'Clear', desc: 'Simple Fiqh', icon: Compass, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' }
                        ].map((item, i) => (
                            <div key={i} className={`glass-card p-4 md:p-10 rounded-2xl md:rounded-[3rem] border-none shadow-sm flex flex-col items-center text-center ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-3 md:mb-6 shadow-inner ${item.color}`}><item.icon className="w-5 h-5 md:w-7 md:h-7" /></div>
                                <h4 className="text-[11px] md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{item.title}</h4>
                                <p className="text-[9px] md:text-base text-slate-500 dark:text-slate-400 font-bold mt-1 leading-tight">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-900 dark:bg-emerald-950/40 rounded-[2rem] md:rounded-[4rem] p-6 md:p-20 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 md:w-[400px] h-32 md:h-[400px] bg-emerald-500/10 rounded-full blur-[60px] md:blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 text-center lg:text-left space-y-6">
                            <h3 className="text-xl md:text-5xl font-black tracking-tighter uppercase leading-tight">Connect with our <br className="hidden md:block" /> <span className="text-emerald-400">Digital Ummah</span>.</h3>
                            <div className="grid grid-cols-2 md:flex gap-3">
                                <a href="https://www.youtube.com/@zestislam" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-3 md:px-8 py-3 bg-red-600 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[8px] md:text-[10px] hover:bg-red-700 transition-all"><Youtube className="w-3.5 h-3.5" /> YouTube</a>
                                <a href="https://www.instagram.com/zest_islam/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-3 md:px-8 py-3 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[8px] md:text-[10px] hover:opacity-90 transition-all"><Instagram className="w-3.5 h-3.5" /> Instagram</a>
                            </div>
                        </div>
                    </div>
                </div>
            } />
            <Route path="/contact" element={
                <div className="max-w-5xl mx-auto space-y-10 md:space-y-16 animate-fade-in py-6 md:py-12 px-3 md:px-4">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] border border-emerald-100 dark:border-emerald-900">
                            <Mail className="w-3 h-3" /> Support
                        </div>
                        <h2 className="text-3xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Seek <span className="text-emerald-600">Counsel</span>.</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-xl font-medium max-w-xl mx-auto">Have questions or feedback? We're listening.</p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-start">
                        <div className="lg:col-span-4 space-y-3">
                            <div className="glass-card p-5 rounded-2xl border-none shadow-sm flex items-center gap-4 group">
                                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><Mail className="w-4 h-4" /></div>
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                    <p className="font-black text-slate-900 dark:text-white truncate text-xs md:text-base">zestislam@gmail.com</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8">
                            <div className="bg-white dark:bg-slate-900 p-6 md:p-14 rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-800">
                                {sentSuccess ? (
                                    <div className="py-12 text-center space-y-6 animate-fade-in-up">
                                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8" /></div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sent</h3>
                                        <button onClick={() => setSentSuccess(false)} className="px-8 py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 mx-auto">New Message</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleContactSubmit} className="space-y-4 md:space-y-6">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <input type="text" required value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-xl md:rounded-2xl border-none text-slate-900 dark:text-white font-bold text-xs" placeholder="Name" />
                                            <input type="email" required value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-xl md:rounded-2xl border-none text-slate-900 dark:text-white font-bold text-xs" placeholder="Email" />
                                        </div>
                                        <textarea required value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} className="w-full p-5 bg-slate-50 dark:bg-slate-950 rounded-xl md:rounded-2xl border-none text-slate-900 dark:text-white font-bold h-32 md:h-48 resize-none text-xs" placeholder="Message"></textarea>
                                        <button type="submit" disabled={sendingContact} className="w-full py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                                            {sendingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {sendingContact ? 'Sending...' : 'Send Inquiry'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            } />
            <Route path="/login" element={
                <div className="max-w-md mx-auto py-12 px-4 animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4"><User className="w-8 h-8" /></div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                {loginMode === 'login' ? 'Welcome Back' : loginMode === 'signup' ? 'Create Account' : 'Reset Password'}
                            </h2>
                        </div>
                        
                        {authError && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold text-center">{authError}</div>}
                        {authSuccess && <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold text-center">{authSuccess}</div>}

                        <form onSubmit={handleAuth} className="space-y-4">
                            {loginMode === 'signup' && (
                                <input type="text" required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-bold text-slate-800 dark:text-white text-sm" placeholder="Full Name" />
                            )}
                            <input type="email" required value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-bold text-slate-800 dark:text-white text-sm" placeholder="Email" />
                            {loginMode !== 'forgot' && (
                                <input type="password" required value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-bold text-slate-800 dark:text-white text-sm" placeholder="Password" />
                            )}
                            <button type="submit" disabled={authLoading} className="w-full bg-slate-900 dark:bg-emerald-600 py-4 rounded-xl text-white font-black uppercase tracking-widest text-[9px] shadow-xl">
                                {authLoading ? (loginMode === 'signup' ? 'Creating Account...' : 'Signing In...') : loginMode === 'forgot' ? 'Send Reset Link' : loginMode === 'signup' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </form>

                        <div className="mt-8 flex flex-col gap-3">
                            {loginMode === 'forgot' ? (
                                <button onClick={() => setLoginMode('login')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600">Back to Sign In</button>
                            ) : (
                                <>
                                    <button onClick={() => setLoginMode(loginMode === 'login' ? 'signup' : 'login')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600">{loginMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</button>
                                    <button onClick={() => setLoginMode('forgot')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600">Forgot Password?</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            } />
            <Route path="/update-password" element={
                <div className="max-w-md mx-auto py-12 px-4 animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4 shadow-inner"><KeyRound className="w-8 h-8" /></div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">New Password</h2>
                        </div>
                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <input type="password" required value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-bold text-slate-800 dark:text-white text-sm" placeholder="New Password" />
                            <button type="submit" disabled={authLoading} className="w-full bg-slate-900 dark:bg-emerald-600 py-4 rounded-xl text-white font-black uppercase tracking-widest text-[9px] shadow-xl">{authLoading ? 'Updating...' : 'Update Password'}</button>
                        </form>
                    </div>
                </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );

    return (
        <div className="min-h-screen flex font-sans selection:bg-emerald-500/30 transition-colors duration-300 bg-white dark:bg-[#050912]">
            {/* Desktop Aside Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-r border-slate-200/50 dark:border-slate-800/50 fixed h-full z-30">
                <div className="p-10 pb-6">
                    <div className="flex items-center gap-4 text-emerald-600 dark:text-emerald-400 mb-10 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">NoorZest Islam</h1>
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 tracking-[0.4em] uppercase">Companion</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 px-6 space-y-8 overflow-y-auto pb-10 no-scrollbar">
                    {Object.entries(groupedNav).map(([group, items]) => (
                        <div key={group}>
                            <h3 className="px-4 text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em] mb-3">{group}</h3>
                            <div className="space-y-1">
                                {items.map((item) => (
                                    <Link 
                                        key={item.id} 
                                        to={item.path}
                                        onClick={() => window.scrollTo(0, 0)} 
                                        className={`w-full flex items-center space-x-4 px-5 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-emerald-600 text-white shadow-xl scale-[1.05]' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'}`}
                                    >
                                        <item.icon className={`w-4 h-4 ${location.pathname === item.path ? 'text-white' : 'text-slate-400 dark:text-slate-600'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setDarkMode(!darkMode)} className="flex items-center justify-center p-3.5 rounded-2xl glass-card border-none text-slate-600 dark:text-slate-400 shadow-md active:scale-90">{darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
                        <button onClick={() => setShowSettings(true)} className="flex items-center justify-center p-3.5 rounded-2xl glass-card border-none text-slate-600 dark:text-slate-400 shadow-md active:scale-90"><Settings className="w-4 h-4" /></button>
                    </div>
                    <button
                        onClick={() => user ? handleLogout() : navigate('/login')}
                        className={`w-full py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all ${
                            user ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-slate-900 dark:bg-emerald-600 text-white'
                        }`}
                    >
                        {user ? 'Disconnect' : 'Login/Sign Up'}
                    </button>
                </div>
            </aside>

            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 z-40 pt-[env(safe-area-inset-top)]">
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400" onClick={() => navigate('/')}>
                    <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg"><Sparkles className="w-3.5 h-3.5" /></div>
                    <span className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tighter">NoorZest Islam</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-600 dark:text-slate-400">{darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600 dark:text-slate-400"><Menu className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Mobile Menu Slide-out */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
                    <div className="absolute left-0 top-0 bottom-0 w-4/5 bg-white dark:bg-[#050912] shadow-2xl p-6 flex flex-col animate-fade-in-left border-r border-white/5 overflow-hidden pb-[env(safe-area-inset-bottom)]">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="font-black text-xl uppercase tracking-tighter text-slate-900 dark:text-white">Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400"><X className="w-6 h-6" /></button>
                        </div>
                        <nav className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
                            {Object.entries(groupedNav).map(([group, items]) => (
                                <div key={group}>
                                    <h3 className="px-4 text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em] mb-3">{group}</h3>
                                    <div className="space-y-1">
                                        {items.map((item) => (
                                            <Link
                                                key={item.id}
                                                to={item.path}
                                                onClick={() => { setMobileMenuOpen(false); window.scrollTo(0, 0); }}
                                                className={`w-full flex items-center space-x-4 px-5 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                <item.icon className={`w-4 h-4 ${location.pathname === item.path ? 'text-white' : 'text-slate-400 dark:text-slate-600'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </nav>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <button
                                onClick={() => { user ? handleLogout() : navigate('/login'); setMobileMenuOpen(false); }}
                                className={`w-full py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all ${
                                    user ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-slate-900 dark:bg-emerald-600 text-white'
                                }`}
                            >
                                {user ? 'Disconnect' : 'Login/Sign Up'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preferences Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                        <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
                        <h3 className="text-xl font-black mb-6 uppercase tracking-tighter text-slate-900 dark:text-white">Preferences</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Reminder Time</label>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white">
                                    <Clock className="w-5 h-5 text-emerald-500" />
                                    <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="bg-transparent border-none focus:ring-0 font-black text-lg w-full text-slate-900 dark:text-white" />
                                </div>
                            </div>
                            <button onClick={handleSaveSettings} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all uppercase tracking-widest text-[10px] mt-4">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 lg:ml-72 p-3 sm:p-4 md:p-8 pt-20 lg:pt-10 min-h-screen transition-all relative z-10 overflow-x-hidden pt-[calc(env(safe-area-inset-top)+5rem)] lg:pt-10 pb-[env(safe-area-inset-bottom)]">
                {renderView()}
            </main>
        </div>
    );
};

export default App;