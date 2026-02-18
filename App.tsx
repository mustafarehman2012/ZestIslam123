
import React, { useState, useEffect } from 'react';
import { Home, Book, MessageCircle, Sparkles, Menu, X, Clock, Image, Video, MapPin, Mic, BookOpen, Search, RotateCcw, Heart, Moon, HelpCircle, ChevronRight, Sun, Info, Youtube, Instagram, User, LogIn, LogOut, Bell, Mail, Lock, Settings, Phone, KeyRound, Loader2, CheckCircle, Send, Globe, Zap, MoonStar, Shield, Target, Compass } from 'lucide-react';
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
import RamadanHub from './components/RamadanHub';
import { AppView, UserProfile } from './types';
import { getDailyInspiration } from './services/geminiService';
import { signInUser, signUpUser, signOutUser, resetUserPassword, sendContactMessage, updateUserPassword, subscribeToAuthChanges } from './services/userService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dailyInspiration, setDailyInspiration] = useState<{type: string, text: string, source: string} | null>(null);
  
  const [user, setUser] = useState<UserProfile | null>(() => {
      try {
          const stored = localStorage.getItem('zestislam_current_session');
          return stored ? JSON.parse(stored) : null;
      } catch (e) {
          return null;
      }
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
        if (stored) return stored === 'dark';
        return true; 
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
            setView(AppView.UPDATE_PASSWORD);
            if (session?.user) {
                 const name = session.user.user_metadata.name || session.user.email?.split('@')[0];
                 setUser({ name: name || 'User', email: session.user.email || '', joinedDate: new Date(session.user.created_at) });
            }
        }
    });
    return () => { if (subscription) subscription.unsubscribe(); }
  }, []);

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  // handleAuth fixed: Now correctly handles login, signup and password reset request.
  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError(null);
      setAuthSuccess(null);

      try {
          if (loginMode === 'forgot') {
              const result = await resetUserPassword(authForm.email);
              if (result.error) {
                  setAuthError(result.error);
              } else {
                  setAuthSuccess("Password reset link sent to your email!");
                  setAuthForm({...authForm, password: ''});
              }
          } else {
              let result;
              if (loginMode === 'signup') {
                  result = await signUpUser(authForm.email, authForm.password, authForm.name);
              } else {
                  result = await signInUser(authForm.email, authForm.password);
              }

              if (result.error) {
                  setAuthError(result.error);
              } else if (result.user) {
                  setUser(result.user);
                  localStorage.setItem('zestislam_current_session', JSON.stringify(result.user));
                  setView(AppView.HOME);
              }
          }
      } catch (err) {
          setAuthError("An unexpected error occurred.");
      } finally {
          setAuthLoading(false);
      }
  };

  // handleUpdatePassword added to support the password update view
  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError(null);
      setAuthSuccess(null);

      const result = await updateUserPassword(authForm.password);
      if (result.success) {
          setAuthSuccess("Password updated successfully!");
          setTimeout(() => {
              setView(AppView.HOME);
              setAuthForm({ name: '', email: '', password: '' });
              setAuthSuccess(null);
          }, 2000);
      } else {
          setAuthError(result.error || "Update failed.");
      }
      setAuthLoading(false);
  };

  const handleLogout = async () => {
      if (window.confirm("Are you sure you want to log out?")) {
          await signOutUser();
          setUser(null);
          localStorage.removeItem('zestislam_current_session');
          setView(AppView.HOME);
      }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSendingContact(true);
      await sendContactMessage(contactForm.name, contactForm.email, contactForm.message);
      setSentSuccess(true);
      setSendingContact(false);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setSentSuccess(false), 5000);
  };

  // handleSaveSettings added to support the preferences modal
  const handleSaveSettings = () => {
      localStorage.setItem('zestislam_reminder_time', reminderTime);
      setShowSettings(false);
  };

  const navItems = [
    { id: AppView.HOME, label: 'Dashboard', icon: Home, group: 'Main' },
    { id: AppView.RAMADAN, label: 'Ramadan Hub', icon: MoonStar, group: 'Main' },
    { id: AppView.PRAYER, label: 'Prayer Times', icon: Clock, group: 'Main' },
    { id: AppView.QURAN, label: 'Quran AI', icon: BookOpen, group: 'Knowledge' },
    { id: AppView.HADEES, label: 'Hadees AI', icon: Book, group: 'Knowledge' },
    { id: AppView.UNIFIED, label: 'Search', icon: Search, group: 'Knowledge' },
    { id: AppView.CHAT, label: 'Scholar Chat', icon: MessageCircle, group: 'Assistant' },
    { id: AppView.LIVE, label: 'Live Scholar', icon: Mic, group: 'Assistant' },
    { id: AppView.TASBIH, label: 'Smart Tasbih', icon: RotateCcw, group: 'Spiritual' },
    { id: AppView.NAMES, label: '99 Names', icon: Heart, group: 'Spiritual' },
    { id: AppView.DUA, label: 'Dua Gen', icon: Sparkles, group: 'Spiritual' },
    { id: AppView.DREAM, label: 'Dream Interpret', icon: Moon, group: 'Tools' },
    { id: AppView.QUIZ, label: 'Quiz', icon: HelpCircle, group: 'Tools' },
    { id: AppView.FINDER, label: 'Halal Finder', icon: MapPin, group: 'Tools' },
    { id: AppView.ABOUT, label: 'About Zest', icon: Info, group: 'General' },
    { id: AppView.CONTACT, label: 'Contact Us', icon: Mail, group: 'General' },
  ];

  const groupedNav = navItems.reduce((acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
  }, {} as Record<string, typeof navItems>);

  const renderView = () => {
    switch (view) {
      case AppView.HOME:
        return (
          <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto">
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
                     <div 
                        onClick={() => setView(AppView.RAMADAN)}
                        className="bg-gradient-to-r from-indigo-900 via-slate-900 to-amber-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl cursor-pointer group hover:scale-[1.01] transition-all"
                     >
                         <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                         <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h2 className="text-[9px] font-black text-amber-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                                    <MoonStar className="w-4 h-4" /> Ramadan Season
                                </h2>
                                <p className="text-2xl md:text-4xl font-black tracking-tighter uppercase">Enter The Hub</p>
                                <p className="text-slate-400 text-xs mt-2">Track your progress, unlock missions, and ascend.</p>
                            </div>
                            <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform">
                                <ChevronRight className="w-8 h-8 text-amber-500" />
                            </div>
                         </div>
                     </div>
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
                                <div><p className="font-black text-base sm:text-xl uppercase tracking-tight">{user.name}</p><p className="text-emerald-100 text-[7px] sm:text-[10px] font-black uppercase tracking-widest opacity-70">Premium Link</p></div>
                             </div>
                        </div>
                    )}
                    <h3 className="text-[8px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] px-2 sm:px-4">Fast Hub</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-4">
                        {[
                            { view: AppView.RAMADAN, title: 'Ramadan', desc: 'Active Hub', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', icon: MoonStar },
                            { view: AppView.TASBIH, title: 'Tasbih', desc: 'Heart Pulse', color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30', icon: RotateCcw },
                            { view: AppView.NAMES, title: '99 Names', desc: 'Infinite Mercy', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30', icon: Heart },
                            { view: AppView.QUIZ, title: 'Rank Quiz', desc: 'Knowledge War', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30', icon: HelpCircle },
                        ].map((item) => (
                            <button key={item.view} onClick={() => setView(item.view)} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-5 glass-card rounded-2xl border-none shadow-sm hover:scale-[1.02] transition-all group text-left">
                                <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color} group-hover:rotate-6 transition-transform shadow-md`}><item.icon className="w-4 h-4 sm:w-6 h-6" /></div>
                                <div className="min-w-0"><h4 className="font-black text-slate-900 dark:text-white text-[10px] sm:text-sm uppercase tracking-tight truncate">{item.title}</h4><p className="text-[7px] sm:text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] truncate">{item.desc}</p></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        );
      case AppView.RAMADAN: return <RamadanHub />;
      case AppView.QURAN: return <QuranSearch />;
      case AppView.HADEES: return <HadeesSearch />;
      case AppView.UNIFIED: return <UnifiedSearch />;
      case AppView.CHAT: return <IslamicChat user={user} onLoginClick={() => setView(AppView.LOGIN)} />;
      case AppView.DUA: return <DuaGenerator />;
      case AppView.FINDER: return <HalalFinder />;
      case AppView.LIVE: return <LiveScholar />;
      case AppView.TASBIH: return <TasbihCounter />;
      case AppView.NAMES: return <NamesOfAllah />;
      case AppView.DREAM: return <DreamInterpreter />;
      case AppView.QUIZ: return <IslamicQuiz />;
      case AppView.ABOUT:
        return (
            <div className="max-w-5xl mx-auto space-y-16 animate-fade-in py-12 px-4">
                <div className="text-center space-y-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl transform hover:rotate-12 transition-transform">
                        <Sparkles className="w-12 h-12" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">The <span className="text-emerald-600">ZestIslam</span> Story.</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Faith. Intellect. Technology.</p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xl max-w-3xl mx-auto font-medium">
                        ZestIslam is a multidimensional spiritual workspace. We believe that technology should be a bridge to the Divine, not a distraction from it. By merging classical Islamic scholarship with modern AI, we provide tools that help you understand, reflect, and grow.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: 'Authenticity', desc: 'Sourcing all knowledge from verified Quranic and Prophetic traditions.', icon: Shield, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
                        { title: 'Innovation', desc: 'Using the latest LLM models to provide personalized spiritual insights.', icon: Target, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
                        { title: 'Clarity', desc: 'Breaking down complex Fiqh and theological concepts for the modern seeker.', icon: Compass, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' }
                    ].map((item, i) => (
                        <div key={i} className="glass-card p-10 rounded-[3rem] border-none shadow-sm hover:scale-[1.03] transition-all">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${item.color}`}><item.icon className="w-7 h-7" /></div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">{item.title}</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-900 dark:bg-emerald-950/40 rounded-[4rem] p-10 md:p-20 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <h3 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">Connect with our <span className="text-emerald-400">Digital Ummah</span>.</h3>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">Join thousands of seekers on our social platforms for daily reminders, deep-dive lectures, and community events.</p>
                            <div className="flex gap-4">
                                <a href="https://www.youtube.com/@zestislam" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-8 py-4 bg-red-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"><Youtube className="w-4 h-4" /> YouTube</a>
                                <a href="https://www.instagram.com/zest_islam/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-8 py-4 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-xl shadow-purple-600/20"><Instagram className="w-4 h-4" /> Instagram</a>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <div className="w-full aspect-square bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center p-12">
                                <Sparkles className="w-full h-full text-emerald-400 opacity-20 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">ZestIslam v1.2.0 • Powered by Gemini Pro</p>
                </div>
            </div>
        );
      case AppView.CONTACT:
        return (
            <div className="max-w-5xl mx-auto space-y-16 animate-fade-in py-12 px-4">
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-3 px-8 py-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.5em] border border-emerald-100 dark:border-emerald-900">
                        <Mail className="w-4 h-4" /> Direct Communication
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Seek <span className="text-emerald-600">Counsel</span>.</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl mx-auto">Have questions about the app, partnership inquiries, or general feedback? We're listening.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-6">
                         <div className="glass-card p-8 rounded-[3rem] border-none shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0 group-hover:rotate-12 transition-transform"><Mail className="w-6 h-6" /></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Support</p>
                                <p className="font-black text-slate-900 dark:text-white truncate">zestislam@gmail.com</p>
                            </div>
                         </div>
                         <div className="glass-card p-8 rounded-[3rem] border-none shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0 group-hover:rotate-12 transition-transform"><Globe className="w-6 h-6" /></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Presence</p>
                                <p className="font-black text-slate-900 dark:text-white">@zestislam</p>
                            </div>
                         </div>
                         <div className="p-8 bg-emerald-600 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                             <h4 className="text-xl font-black uppercase tracking-tighter mb-4 relative z-10">Global Reach</h4>
                             <p className="text-emerald-100 text-sm font-medium leading-relaxed relative z-10 opacity-80">Serving the Ummah across 180+ countries with AI-driven spiritual intelligence.</p>
                         </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative">
                             {sentSuccess ? (
                                 <div className="py-20 text-center space-y-8 animate-fade-in-up">
                                     <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircle className="w-12 h-12" /></div>
                                     <div className="space-y-4">
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Transmission Received</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">JazakAllah Khair. Our team will review your message and reach out if necessary.</p>
                                     </div>
                                     <button onClick={() => setSentSuccess(false)} className="px-10 py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">New Message</button>
                                 </div>
                             ) : (
                                 <form onSubmit={handleContactSubmit} className="space-y-8">
                                     <div className="grid md:grid-cols-2 gap-8">
                                         <div className="space-y-3">
                                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Identity</label>
                                             <input 
                                                type="text" 
                                                required 
                                                value={contactForm.name}
                                                onChange={e => setContactForm({...contactForm, name: e.target.value})}
                                                className="w-full p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border-none text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300" 
                                                placeholder="Your Name" 
                                            />
                                         </div>
                                         <div className="space-y-3">
                                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Digital Address</label>
                                             <input 
                                                type="email" 
                                                required 
                                                value={contactForm.email}
                                                onChange={e => setContactForm({...contactForm, email: e.target.value})}
                                                className="w-full p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border-none text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300" 
                                                placeholder="email@example.com" 
                                            />
                                         </div>
                                     </div>
                                     <div className="space-y-3">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Your Thoughts</label>
                                         <textarea 
                                            required 
                                            value={contactForm.message}
                                            onChange={e => setContactForm({...contactForm, message: e.target.value})}
                                            className="w-full p-8 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border-none text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all h-48 resize-none placeholder:text-slate-300" 
                                            placeholder="How can we assist your journey?"
                                        ></textarea>
                                     </div>
                                     <button 
                                        type="submit" 
                                        disabled={sendingContact}
                                        className="w-full py-6 bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                                     >
                                        {sendingContact ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        {sendingContact ? 'Transmitting...' : 'Send Inquiry'}
                                     </button>
                                 </form>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        );
      case AppView.UPDATE_PASSWORD:
          return (
              <div className="max-w-md mx-auto py-12 animate-fade-in-up">
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                      <div className="text-center mb-10">
                          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950 rounded-3xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-6 shadow-inner"><KeyRound className="w-10 h-10" /></div>
                          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">New Secret Key</h2>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Establishing a fresh secure link for your soul.</p>
                      </div>
                      <form onSubmit={handleUpdatePassword} className="space-y-6">
                          <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white shadow-inner" placeholder="New Secret Key" />
                          {authError && <p className="text-red-500 text-[10px] font-black uppercase text-center">{authError}</p>}
                          {authSuccess && <p className="text-emerald-500 text-[10px] font-black uppercase text-center">{authSuccess}</p>}
                          <button type="submit" disabled={authLoading} className="w-full bg-slate-900 dark:bg-emerald-600 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-emerald-700 transition-all">{authLoading ? 'Rewiring...' : 'Update Key'}</button>
                      </form>
                  </div>
              </div>
          );
      case AppView.PRAYER:
          return (
              <div className="max-w-2xl mx-auto py-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center uppercase tracking-tighter">Prayer Schedule</h2>
                <PrayerTimes />
              </div>
          );
      case AppView.LOGIN:
          return (
              <div className="max-w-md mx-auto py-12 animate-fade-in-up">
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                      <div className="text-center mb-10">
                          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950 rounded-3xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-6 shadow-inner"><User className="w-10 h-10" /></div>
                          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                            {loginMode === 'login' ? 'Portal Login' : loginMode === 'signup' ? 'Register Seeker' : 'Key Recovery'}
                          </h2>
                      </div>
                      <form onSubmit={handleAuth} className="space-y-6">
                          {loginMode === 'signup' && (
                              <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white shadow-inner" placeholder="Full Name" />
                          )}
                          <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white shadow-inner" placeholder="Email Address" />
                          {loginMode !== 'forgot' && (
                            <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white shadow-inner" placeholder="Secret Key" />
                          )}
                          {authError && <p className="text-red-500 text-[10px] font-black uppercase text-center">{authError}</p>}
                          {authSuccess && <p className="text-emerald-500 text-[10px] font-black uppercase text-center">{authSuccess}</p>}
                          <button type="submit" disabled={authLoading} className="w-full bg-slate-900 dark:bg-emerald-600 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-emerald-700 transition-all">
                            {authLoading ? 'Syncing...' : (loginMode === 'login' ? 'Authenticate' : loginMode === 'signup' ? 'Establish Link' : 'Send Reset Link')}
                          </button>
                      </form>
                      <div className="mt-8 flex flex-col gap-3">
                          <button onClick={() => setLoginMode(loginMode === 'login' ? 'signup' : 'login')} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">{loginMode === 'login' ? "New Seeker? Join Ummah" : "Existing Link? Sign In"}</button>
                          {loginMode === 'login' && (
                            <button onClick={() => setLoginMode('forgot')} className="w-full text-[10px] font-black text-slate-400/60 uppercase tracking-widest hover:text-emerald-600 transition-colors">Lost your key?</button>
                          )}
                      </div>
                  </div>
              </div>
          );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex font-sans selection:bg-emerald-500/30 transition-colors duration-300">
      <aside className="hidden lg:flex flex-col w-72 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-r border-slate-200/50 dark:border-slate-800/50 fixed h-full z-30">
        <div className="p-10 pb-6"><div className="flex items-center gap-4 text-emerald-600 dark:text-emerald-400 mb-10 cursor-pointer group" onClick={() => setView(AppView.HOME)}><div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform"><Sparkles className="w-5 h-5" /></div><div><h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">ZestIslam</h1><p className="text-[8px] font-black text-slate-400 dark:text-slate-500 tracking-[0.4em] uppercase">Companion</p></div></div></div>
        <nav className="flex-1 px-6 space-y-8 overflow-y-auto pb-10 no-scrollbar">
            {Object.entries(groupedNav).map(([group, items]) => (
                <div key={group}><h3 className="px-4 text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em] mb-3">{group}</h3><div className="space-y-1">{items.map((item) => (
                    <button key={item.id} onClick={() => { setView(item.id); window.scrollTo(0,0); }} className={`w-full flex items-center space-x-4 px-5 py-3 rounded-xl transition-all ${view === item.id ? 'bg-emerald-600 text-white shadow-xl scale-[1.05]' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'}`}><item.icon className={`w-4 h-4 ${view === item.id ? 'text-white' : 'text-slate-400 dark:text-slate-600'}`} /><span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span></button>
                ))}</div></div>
            ))}
        </nav>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="flex items-center justify-center p-3.5 rounded-2xl glass-card border-none text-slate-600 dark:text-slate-400 shadow-md active:scale-90">{darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
            <button onClick={() => setShowSettings(true)} className="flex items-center justify-center p-3.5 rounded-2xl glass-card border-none text-slate-600 dark:text-slate-400 shadow-md active:scale-90"><Settings className="w-4 h-4" /></button>
          </div>
          {user ? <button onClick={handleLogout} className="w-full py-3.5 bg-red-500/10 text-red-500 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all">Disconnect</button> : <button onClick={() => setView(AppView.LOGIN)} className="w-full py-3.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] shadow-xl">Portal Access</button>}
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400" onClick={() => setView(AppView.HOME)}><div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg"><Sparkles className="w-3.5 h-3.5" /></div><span className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tighter">ZestIslam</span></div>
        <div className="flex items-center gap-1"><button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-600 dark:text-slate-400">{darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button><button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600 dark:text-slate-400"><Menu className="w-4 h-4" /></button></div>
      </div>

      {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
              <div className="absolute left-0 top-0 bottom-0 w-4/5 bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col animate-fade-in-left">
                  <div className="flex justify-between items-center mb-8"><h2 className="font-black text-xl uppercase tracking-tighter">Menu</h2><button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400"><X className="w-6 h-6" /></button></div>
                  <nav className="flex-1 overflow-y-auto space-y-2">
                    {navItems.map((item) => (
                        <button key={item.id} onClick={() => { setView(item.id); setMobileMenuOpen(false); }} className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all ${view === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400'}`}><item.icon className="w-5 h-5" /><span>{item.label}</span></button>
                    ))}
                  </nav>
              </div>
          </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-black mb-6 uppercase tracking-tighter">Preferences</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Daily Adhkar Time</label>
                          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                              <Clock className="w-5 h-5 text-emerald-500" />
                              <input 
                                type="time" 
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white font-black text-lg w-full"
                              />
                          </div>
                      </div>

                      <div className="pt-4">
                          <button 
                            onClick={handleSaveSettings}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all uppercase tracking-widest text-[10px]"
                          >
                              Sync Preferences
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <main className="flex-1 lg:ml-72 p-3 sm:p-4 md:p-8 pt-20 lg:pt-10 min-h-screen transition-all relative z-10">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
