import React, { useState, useEffect } from 'react';
import { Home, Book, MessageCircle, Sparkles, Menu, X, Clock, Image, Video, MapPin, Mic } from 'lucide-react';
import PrayerTimes from './components/PrayerTimes';
import QuranSearch from './components/QuranSearch';
import IslamicChat from './components/IslamicChat';
import DuaGenerator from './components/DuaGenerator';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import MediaStudio from './components/MediaStudio';
import HalalFinder from './components/HalalFinder';
import LiveScholar from './components/LiveScholar';
import { AppView } from './types';
import { getDailyInspiration } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dailyInspiration, setDailyInspiration] = useState<{type: string, text: string, source: string} | null>(null);

  useEffect(() => {
    // Load daily inspiration on mount
    getDailyInspiration().then(setDailyInspiration);
  }, []);

  const navItems = [
    { id: AppView.HOME, label: 'Home', icon: Home },
    { id: AppView.QURAN, label: 'Quran AI', icon: Book },
    { id: AppView.CHAT, label: 'Scholar Chat', icon: MessageCircle },
    { id: AppView.LIVE, label: 'Live Scholar', icon: Mic },
    { id: AppView.DUA, label: 'Dua Gen', icon: Sparkles },
    { id: AppView.MEDIA, label: 'Media Studio', icon: Video },
    { id: AppView.THUMBNAIL, label: 'Thumbnails', icon: Image },
    { id: AppView.FINDER, label: 'Halal Finder', icon: MapPin },
    { id: AppView.PRAYER, label: 'Prayer Times', icon: Clock },
  ];

  const renderView = () => {
    switch (view) {
      case AppView.HOME:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center py-8">
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">ZestIslam</h1>
                <p className="text-emerald-600 font-medium">Your Modern Spiritual Companion</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                     <h2 className="text-xl font-bold text-slate-700 px-1">Prayer Times</h2>
                     <PrayerTimes />
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-700 px-1">Daily Wisdom</h2>
                    <div className="bg-white rounded-3xl p-8 border border-emerald-50 shadow-lg relative overflow-hidden h-full flex flex-col justify-center min-h-[300px]">
                         <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl"></div>
                         <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                         
                         {dailyInspiration ? (
                             <>
                                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-4 w-fit">
                                    {dailyInspiration.type} of the Day
                                </span>
                                <p className="text-2xl text-slate-700 font-medium leading-relaxed mb-6 font-serif">
                                    "{dailyInspiration.text}"
                                </p>
                                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest text-right">
                                    — {dailyInspiration.source}
                                </p>
                             </>
                         ) : (
                             <div className="animate-pulse space-y-4">
                                 <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                                 <div className="h-24 bg-slate-100 rounded"></div>
                                 <div className="h-4 bg-slate-100 rounded w-1/3 ml-auto"></div>
                             </div>
                         )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                 <button onClick={() => setView(AppView.QURAN)} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all text-left group">
                    <Book className="w-8 h-8 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-slate-800">Quran AI</h3>
                    <p className="text-xs text-slate-500 mt-1">Search & Tadabbur</p>
                 </button>
                 <button onClick={() => setView(AppView.LIVE)} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all text-left group">
                    <Mic className="w-8 h-8 text-rose-500 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-slate-800">Live Scholar</h3>
                    <p className="text-xs text-slate-500 mt-1">Voice Conversation</p>
                 </button>
                 <button onClick={() => setView(AppView.THUMBNAIL)} className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all text-left group">
                    <Image className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-slate-800">Thumbnails</h3>
                    <p className="text-xs text-slate-500 mt-1">Create Art</p>
                 </button>
            </div>
          </div>
        );
      case AppView.QURAN:
        return <QuranSearch />;
      case AppView.CHAT:
        return <IslamicChat />;
      case AppView.DUA:
        return <DuaGenerator />;
      case AppView.THUMBNAIL:
        return <ThumbnailGenerator />;
      case AppView.MEDIA:
        return <MediaStudio />;
      case AppView.FINDER:
        return <HalalFinder />;
      case AppView.LIVE:
        return <LiveScholar />;
      case AppView.PRAYER:
          return (
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Prayer Times</h2>
                <PrayerTimes />
              </div>
          );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-20 overflow-y-auto">
        <div className="p-8 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-emerald-600 tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                ZestIslam
            </h1>
        </div>
        <nav className="flex-1 p-6 space-y-2">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        view === item.id 
                        ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <item.icon className={`w-5 h-5 ${view === item.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white z-20 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
         <div className="flex items-center gap-2 font-bold text-emerald-600 text-lg">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            ZestIslam
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
            {mobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-10 pt-20 px-6 space-y-4 animate-fade-in overflow-y-auto pb-10">
             {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => {
                        setView(item.id);
                        setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-lg ${
                        view === item.id 
                        ? 'bg-emerald-50 text-emerald-700 font-bold' 
                        : 'text-slate-500'
                    }`}
                >
                    <item.icon className="w-6 h-6" />
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${mobileMenuOpen ? 'opacity-50 pointer-events-none' : ''} md:ml-64 pt-20 md:pt-0`}>
        <div className="max-w-5xl mx-auto p-6 md:p-12">
            {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
