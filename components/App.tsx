import React, { useState, useEffect } from 'react';
import { Home, Book, MessageCircle, Sparkles, Menu, X, Clock, Image, Video, MapPin, Mic, BookOpen, Search, RotateCcw, Heart, Moon, HelpCircle, ChevronRight, Sun, Info, Youtube, Instagram, User, LogIn, LogOut, Bell, Mail, Lock, Settings, Phone, KeyRound, Loader2, CheckCircle, Send, Globe, Zap, MoonStar, Shield, Target, Compass } from 'lucide-react';
import PrayerTimes from './PrayerTimes';
import QuranSearch from './QuranSearch';
import HadeesSearch from './HadeesSearch';
import UnifiedSearch from './UnifiedSearch';
import IslamicChat from './IslamicChat';
import DuaGenerator from './DuaGenerator';
import HalalFinder from './HalalFinder';
import LiveScholar from './LiveScholar';
import TasbihCounter from './TasbihCounter';
import NamesOfAllah from './NamesOfAllah';
import DreamInterpreter from './DreamInterpreter';
import IslamicQuiz from './IslamicQuiz';
import RamadanHub from './RamadanHub';
import { AppView, UserProfile } from '../types';
import { getDailyInspiration } from '../services/geminiService';
import { signInUser, signUpUser, signOutUser, resetUserPassword, sendContactMessage, updateUserPassword, subscribeToAuthChanges } from '../services/userService';

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
    getDailyInspiration().then(setDailyInspiration);

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

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError(null);
      setAuthSuccess(null);

      try {
          if (loginMode === 'forgot') {
              const result = await resetUserPassword(authForm.email);
              if (result.error) setAuthError(result.error);
              else {
                  setAuthSuccess("Password reset link sent to your email!");
                  setAuthForm({...authForm, password: ''});
              }
          } else {
              let result;
              if (loginMode === 'signup') result = await signUpUser(authForm.email, authForm.password, authForm.name);
              else result = await signInUser(authForm.email, authForm.password);

              if (result.error) setAuthError(result.error);
              else if (result.user) {
                  setUser(result.user);
                  localStorage.setItem('zestislam_current_session', JSON.stringify(result.user));
                  setView(AppView.HOME);
              }
          }
      } catch (err) { setAuthError("An unexpected error occurred."); }
      finally { setAuthLoading(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true); setAuthError(null); setAuthSuccess(null);
      const result = await updateUserPassword(authForm.password);
      if (result.success) {
          setAuthSuccess("Password updated!");
          setTimeout(() => { setView(AppView.HOME); setAuthForm({ name: '', email: '', password: '' }); }, 2000);
      } else setAuthError(result.error || "Update failed.");
      setAuthLoading(false);
  };

  const handleLogout = async () => {
      if (window.confirm("Log out?")) {
          await signOutUser(); setUser(null);
          localStorage.removeItem('zestislam_current_session');
          setView(AppView.HOME);
      }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); setSendingContact(true);
      await sendContactMessage(contactForm.name, contactForm.email, contactForm.message);
      setSentSuccess(true); setSendingContact(false); setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setSentSuccess(false), 5000);
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
          <div className="space-y-6 md:space-y-8 animate-fade-in max-w-7xl mx-auto px-2 sm:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                      Salam, <span className="text-emerald-600">{user ? user.name : 'Seeker'}</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm md:text-lg">Your spiritual intelligent companion.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                     <div 
                        onClick={() => setView(AppView.RAMADAN)}
                        className="bg-gradient-to-r from-indigo-900 via-slate-900 to-amber-900 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl cursor-pointer group hover:scale-[1.01] transition-all"
                     >
                         <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                         <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h2 className="text-[8px] md:text-[9px] font-black text-amber-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                                    <MoonStar className="w-4 h-4" /> Ramadan Season
                                </h2>
                                <p className="text-2xl md:text-4xl font-black tracking-tighter uppercase">Enter The Hub</p>
                                <p className="text-slate-400 text-[10px] md:text-xs mt-2">Track progress, unlock missions, and ascend.</p>
                            </div>
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform">
                                <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
                            </div>
                         </div>
                     </div>
                     <div className="glass-card rounded-[2.5rem] p-0 shadow-sm border-none overflow-hidden">
                        <PrayerTimes />
                     </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    {user && (
                        <div className="bg-emerald-600 rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
                             <div className="relative z-10 flex items-center gap-4 md:gap-5">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-xl flex items-center justify-center text-xl md:text-2xl font-black">{user.name.charAt(0).toUpperCase()}</div>
                                <div><p className="font-black text-lg md:text-xl uppercase tracking-tight truncate max-w-[150px]">{user.name}</p><p className="text-emerald-100 text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-70">Seeker Link</p></div>
                             </div>
                        </div>
                    )}
                    <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] px-4">Fast Hub</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                        {[
                            { view: AppView.RAMADAN, title: 'Ramadan', desc: 'Active Hub', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', icon: MoonStar },
                            { view: AppView.TASBIH, title: 'Tasbih', desc: 'Heart Pulse', color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30', icon: RotateCcw },
                            { view: AppView.NAMES, title: '99 Names', desc: 'Infinite Mercy', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30', icon: Heart },
                            { view: AppView.QUIZ, title: 'Rank Quiz', desc: 'Knowledge', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30', icon: HelpCircle },
                        ].map((item) => (
                            <button key={item.view} onClick={() => setView(item.view)} className="flex items-center gap-3 md:gap-4 p-4 md:p-5 glass-card rounded-[2rem] border-none shadow-sm hover:scale-[1.02] transition-all group text-left">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color} group-hover:rotate-6 transition-transform shadow-md`}><item.icon className="w-5 h-5 md:w-6 h-6" /></div>
                                <div className="min-w-0"><h4 className="font-black text-slate-900 dark:text-white text-[11px] md:text-sm uppercase tracking-tight truncate">{item.title}</h4><p className="text-[8px] md:text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] truncate">{item.desc}</p></div>
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
            <div className="max-w-5xl mx-auto space-y-12 md:space-y-16 animate-fade-in py-12 px-4">
                <div className="text-center space-y-6 md:space-y-8">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl transform hover:rotate-12 transition-transform">
                        <Sparkles className="w-10 h-10 md:w-12 md:h-12" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">The <span className="text-emerald-600">ZestIslam</span> Story.</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs">Faith. Intellect. Technology.</p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg md:text-xl max-w-3xl mx-auto font-medium">
                        ZestIslam is a multidimensional spiritual workspace. We believe that technology should be a bridge to the Divine. By merging classical Islamic scholarship with modern AI, we provide tools that help you understand, reflect, and grow.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {[
                        { title: 'Authenticity', desc: 'Sourcing all knowledge from verified Quranic and Prophetic traditions.', icon: Shield, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
                        { title: 'Innovation', desc: 'Using the latest LLM models to provide personalized spiritual insights.', icon: Target, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
                        { title: 'Clarity', desc: 'Breaking down complex Fiqh and theological concepts for the modern seeker.', icon: Compass, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' }
                    ].map((item, i) => (
                        <div key={i} className="glass-card p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border-none shadow-sm hover:scale-[1.03] transition-all">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${item.color}`}><item.icon className="w-6 h-6 md:w-7 md:h-7" /></div>
                            <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">{item.title}</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-sm md:text-base">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-900 dark:bg-emerald-950/40 rounded-[3rem] md:rounded-[4rem] p-8 md:p-20 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
                        <div className="space-y-6 md:space-y-8 text-center lg:text-left">
                            <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">Connect with our <span className="text-emerald-400">Ummah</span>.</h3>
                            <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">Join thousands of seekers on our social platforms for daily reminders and community events.</p>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                                <a href="https://www.youtube.com/@zestislam" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-red-600 rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-red-700 transition-all shadow-xl"><Youtube className="w-4 h-4" /> YouTube</a>
                                <a href="https://www.instagram.com/zest_islam/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:opacity-90 transition-all shadow-xl"><Instagram className="w-4 h-4" /> Instagram</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
      case AppView.CONTACT:
        return (
            <div className="max-w-5xl mx-auto space-y-12 md:space-y-16 animate-fade-in py-12 px-4">
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-3 px-6 md:px-8 py-2 md:py-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] border border-emerald-100 dark:border-emerald-900">
                        <Mail className="w-4 h-4" /> Direct Communication
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Seek <span className="text-emerald-600">Counsel</span>.</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">Have questions about the app, partnership inquiries, or feedback? We're listening.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-4 md:space-y-6">
                         <div className="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-none shadow-sm flex items-center gap-6 group">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0"><Mail className="w-5 h-5 md:w-6 md:h-6" /></div>
                            <div className="min-w-0">
                                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Support</p>
                                <p className="font-black text-slate-900 dark:text-white truncate text-sm md:text-base">zestislam@gmail.com</p>
                            </div>
                         </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-800">
                             {sentSuccess ? (
                                 <div className="py-20 text-center space-y-8 animate-fade-in-up">
                                     <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-10 h-10 md:w-12 md:h-12" /></div>
                                     <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Transmission Sent</h3>
                                     <button onClick={() => setSentSuccess(false)} className="px-10 py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-xl">New Message</button>
                                 </div>
                             ) : (
                                 <form onSubmit={handleContactSubmit} className="space-y-6 md:space-y-8">
                                     <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                                         <input type="text" required value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className="w-full p-5 md:p-6 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] md:rounded-[2rem] border-none text-slate-900 dark:text-white font-bold" placeholder="Your Name" />
                                         <input type="email" required value={contactForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full p-5 md:p-6 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] md:rounded-[2rem] border-none text-slate-900 dark:text-white font-bold" placeholder="Email" />
                                     </div>
                                     <textarea required value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})} className="w-full p-6 md:p-8 bg-slate-50 dark:bg-slate-950 rounded-[2rem] md:rounded-[2.5rem] border-none text-slate-900 dark:text-white font-bold h-48 resize-none" placeholder="Message"></textarea>
                                     <button type="submit" disabled={sendingContact} className="w-full py-5 md:py-6 bg-slate-900 dark:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] md:text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
                                        {sendingContact ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} {sendingContact ? 'Transmitting...' : 'Send Inquiry'}
                                     </button>
                                 </form>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        );
      case AppView.LOGIN:
        return (
            <div className="max-w-md mx-auto py-12 animate-fade-in-up px-4">
                <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 dark:bg-emerald-950 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-inner"><User className="w-8 h-8 md:w-10 md:h-10" /></div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                          {loginMode === 'login' ? 'Portal Login' : loginMode === 'signup' ? 'Register Seeker' : 'Key Recovery'}
                        </h2>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-5 md:space-y-6">
                        {loginMode === 'signup' && <input type="text" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white" placeholder="Full Name" />}
                        <input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white" placeholder="Email" />
                        {loginMode !== 'forgot' && <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold text-slate-800 dark:text-white" placeholder="Secret Key" />}
                        <button type="submit" disabled={authLoading} className="w-full bg-slate-900 dark:bg-emerald-600 py-4 md:py-5 rounded-2xl text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-xl">{authLoading ? 'Syncing...' : 'Authenticate'}</button>
                    </form>
                    <div className="mt-8 flex flex-col gap-3">
                        <button onClick={() => setLoginMode(loginMode === 'login' ? 'signup' : 'login')} className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600">{loginMode === 'login' ? "New Seeker? Join Ummah" : "Existing Link? Sign In"}</button>
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

      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 md:h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400" onClick={() => setView(AppView.HOME)}><div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg"><Sparkles className="w-4 h-4 md:w-5 md:h-5" /></div><span className="font-black text-lg md:text-xl text-slate-900 dark:text-white uppercase tracking-tighter">ZestIslam</span></div>
        <div className="flex items-center gap-1 md:gap-2"><button onClick={() => setDarkMode(!darkMode)} className="p-2.5 text-slate-600 dark:text-slate-400">{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button><button onClick={() => setMobileMenuOpen(true)} className="p-2.5 text-slate-600 dark:text-slate-400"><Menu className="w-5 h-5 md:w-6 md:h-6" /></button></div>
      </div>

      {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
              <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-slate-950 shadow-2xl p-6 flex flex-col animate-fade-in-left overflow-y-auto custom-scrollbar no-scrollbar">
                  <div className="flex justify-between items-center mb-8 px-2"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white"><Sparkles className="w-4 h-4" /></div><h2 className="font-black text-xl uppercase tracking-tighter">Nexus Menu</h2></div><button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-red-500"><X className="w-6 h-6" /></button></div>
                  <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <button key={item.id} onClick={() => { setView(item.id); setMobileMenuOpen(false); window.scrollTo(0,0); }} className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all ${view === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><item.icon className="w-5 h-5" /><span className="text-xs font-black uppercase tracking-widest">{item.label}</span></button>
                    ))}
                  </nav>
                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      {user ? <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">End Session</button> : <button onClick={() => { setView(AppView.LOGIN); setMobileMenuOpen(false); }} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Portal Entry</button>}
                  </div>
              </div>
          </div>
      )}

      {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                  <button onClick={() => setShowSettings(false)} className="absolute top-5 right-5 text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                  <h3 className="text-xl font-black mb-6 uppercase tracking-tighter">Preferences</h3>
                  <div className="space-y-4">
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Daily Adhkar Hub</label><div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner"><Clock className="w-5 h-5 text-emerald-500" /><input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white font-black text-lg w-full" /></div></div>
                      <button onClick={() => setShowSettings(false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all uppercase tracking-widest text-[10px] mt-4">Sync Nexus</button>
                  </div>
              </div>
          </div>
      )}

      <main className="flex-1 lg:ml-72 p-3 sm:p-4 md:p-8 pt-20 lg:pt-10 min-h-screen transition-all relative z-10 overflow-x-hidden">
        {renderView()}
      </main>
    </div>
  );
};

export default App;