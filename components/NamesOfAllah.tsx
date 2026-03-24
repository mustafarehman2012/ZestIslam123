import React, { useState, useMemo } from 'react';
import { Loader2, Sparkles, X, ChevronRight, Search, Volume2, Globe, Heart, BookOpen, Lightbulb, Zap } from 'lucide-react';
import { getNameInsight, playGeneratedAudio } from '../services/geminiService';
import { NameInsight } from '../types';

const ALL_NAMES = [
    { ar: "الله", en: "Allah", tr: "The Greatest Name", color: "from-emerald-500 to-teal-600" },
    { ar: "الرَّحْمَن", en: "Ar-Rahman", tr: "The All-Compassionate", color: "from-emerald-400 to-emerald-600" },
    { ar: "الرَّحِيم", en: "Ar-Raheem", tr: "The All-Merciful", color: "from-teal-400 to-teal-600" },
    { ar: "الْمَلِك", en: "Al-Malik", tr: "The Absolute Ruler", color: "from-slate-700 to-slate-900" },
    { ar: "الْقُدُّوس", en: "Al-Quddus", tr: "The Pure One", color: "from-indigo-500 to-indigo-700" },
    { ar: "السَّلَام", en: "As-Salam", tr: "The Source of Peace", color: "from-sky-400 to-sky-600" },
    { ar: "الْمُؤْمِن", en: "Al-Mu'min", tr: "The Giver of Faith", color: "from-blue-500 to-blue-700" },
    { ar: "الْمُهَيْمِن", en: "Al-Muhaymin", tr: "The Guardian", color: "from-cyan-500 to-cyan-700" },
    { ar: "الْعَزِيز", en: "Al-Aziz", tr: "The Almighty", color: "from-emerald-600 to-emerald-800" },
    { ar: "الْجَبَّار", en: "Al-Jabbar", tr: "The Compeller", color: "from-rose-500 to-rose-700" },
    { ar: "الْمُتَكَبِّر", en: "Al-Mutakabbir", tr: "The Greatest", color: "from-purple-500 to-purple-700" },
    { ar: "الْخَالِق", en: "Al-Khaliq", tr: "The Creator", color: "from-orange-500 to-orange-700" },
    { ar: "الْبَارِئ", en: "Al-Bari'", tr: "The Maker of Order", color: "from-amber-500 to-amber-700" },
    { ar: "الْمُصَوِّر", en: "Al-Musawwir", tr: "The Shaper of Beauty", color: "from-yellow-500 to-yellow-700" },
    { ar: "الْغَفَّار", en: "Al-Ghaffar", tr: "The Forgiving", color: "from-lime-500 to-lime-700" },
    { ar: "الْقَهَّار", en: "Al-Qahhar", tr: "The Subduer", color: "from-red-600 to-red-800" },
    { ar: "الْوَهَّاب", en: "Al-Wahhab", tr: "The Giver of All", color: "from-emerald-400 to-emerald-700" },
    { ar: "الرَّزَّاق", en: "Ar-Razzaq", tr: "The Sustainer", color: "from-indigo-400 to-indigo-700" },
    { ar: "الْفَتَّاح", en: "Al-Fattah", tr: "The Opener", color: "from-blue-400 to-blue-700" },
    { ar: "الْعَلِيم", en: "Al-Alim", tr: "The All-Knowing", color: "from-teal-500 to-teal-800" },
    { ar: "الْقَابِض", en: "Al-Qabid", tr: "The Withholder", color: "from-slate-600 to-slate-800" },
    { ar: "الْبَاسِط", en: "Al-Basit", tr: "The Expander", color: "from-sky-500 to-sky-800" },
    { ar: "الْخَافِض", en: "Al-Khafid", tr: "The Abaser", color: "from-rose-600 to-rose-900" },
    { ar: "الرَّافِع", en: "Ar-Rafi'", tr: "The Exalter", color: "from-violet-500 to-violet-800" },
    { ar: "الْمُعِزّ", en: "Al-Mu'izz", tr: "The Bestower of Honors", color: "from-amber-400 to-amber-600" },
    { ar: "الْمُذِلّ", en: "Al-Mudhill", tr: "The Humiliator", color: "from-slate-800 to-slate-950" },
    { ar: "السَّمِيع", en: "As-Sami'", tr: "The All-Hearing", color: "from-cyan-400 to-cyan-600" },
    { ar: "الْبَصِير", en: "Al-Basir", tr: "The All-Seeing", color: "from-emerald-500 to-emerald-900" },
    { ar: "الْحَكَم", en: "Al-Hakam", tr: "The Judge", color: "from-indigo-600 to-indigo-900" },
    { ar: "الْعَدْل", en: "Al-Adl", tr: "The Just", color: "from-zinc-600 to-zinc-800" },
    { ar: "اللَّطِيف", en: "Al-Latif", tr: "The Subtle One", color: "from-teal-300 to-teal-500" },
    { ar: "الْخَبِير", en: "Al-Khabir", tr: "The All-Aware", color: "from-slate-500 to-slate-700" },
    { ar: "الْحَلِيم", en: "Al-Halim", tr: "The Forbearing", color: "from-emerald-300 to-emerald-500" },
    { ar: "الْعَظِيم", en: "Al-Azim", tr: "The Magnificent", color: "from-amber-600 to-amber-900" },
    { ar: "الْغَفُور", en: "Al-Ghafur", tr: "The Forgiving", color: "from-blue-500 to-blue-800" },
    { ar: "الشَّكُور", en: "Ash-Shakur", tr: "The Appreciative", color: "from-yellow-400 to-yellow-600" },
    { ar: "الْعَلِيّ", en: "Al-Ali", tr: "The Highest", color: "from-sky-600 to-sky-900" },
    { ar: "الْكَبِير", en: "Al-Kabir", tr: "The Greatest", color: "from-indigo-400 to-indigo-600" },
    { ar: "الْحَفِيظ", en: "Al-Hafiz", tr: "The Preserver", color: "from-emerald-700 to-emerald-950" },
    { ar: "الْمُقِيت", en: "Al-Muqit", tr: "The Maintainer", color: "from-orange-400 to-orange-600" },
    { ar: "الْحَسِيب", en: "Al-Hasib", tr: "The Reckoner", color: "from-blue-600 to-blue-900" },
    { ar: "الْجَلِيل", en: "Al-Jalil", tr: "The Majestic", color: "from-slate-700 to-slate-900" },
    { ar: "الْكَرِيم", en: "Al-Karim", tr: "The Generous", color: "from-amber-300 to-amber-500" },
    { ar: "الرَّقِيب", en: "Ar-Raqib", tr: "The Watchful", color: "from-emerald-400 to-emerald-600" },
    { ar: "الْمُجِيب", en: "Al-Mujib", tr: "The Responsive", color: "from-sky-400 to-sky-700" },
    { ar: "الْوَاسِع", en: "Al-Wasi'", tr: "The All-Embracing", color: "from-indigo-300 to-indigo-500" },
    { ar: "الْحَكِيم", en: "Al-Hakim", tr: "The Wise", color: "from-emerald-800 to-emerald-950" },
    { ar: "الْوَدُود", en: "Al-Wadud", tr: "The Loving", color: "from-rose-400 to-rose-600" },
    { ar: "الْمَجِيد", en: "Al-Majid", tr: "The Most Glorious", color: "from-purple-400 to-purple-600" },
    { ar: "الْبَاعِث", en: "Al-Ba'ith", tr: "The Resurrector", color: "from-emerald-500 to-teal-500" },
    { ar: "الشَّهِيد", en: "Ash-Shahid", tr: "The Witness", color: "from-blue-400 to-blue-600" },
    { ar: "الْحَقّ", en: "Al-Haqq", tr: "The Truth", color: "from-emerald-600 to-emerald-800" },
    { ar: "الْوَكِيل", en: "Al-Wakil", tr: "The Trustee", color: "from-amber-500 to-amber-800" },
    { ar: "الْقَوِيّ", en: "Al-Qawi", tr: "The Strong", color: "from-slate-700 to-slate-950" },
    { ar: "الْمَتِين", en: "Al-Matin", tr: "The Firm", color: "from-indigo-600 to-indigo-900" },
    { ar: "الْوَلِيّ", en: "Al-Wali", tr: "The Protecting Friend", color: "from-emerald-400 to-emerald-700" },
    { ar: "الْحَمِيد", en: "Al-Hamid", tr: "The Praiseworthy", color: "from-amber-400 to-amber-700" },
    { ar: "الْمُحْصِي", en: "Al-Muhsi", tr: "The Counter", color: "from-blue-300 to-blue-500" },
    { ar: "الْمُبْدِئ", en: "Al-Mubdi'", tr: "The Originator", color: "from-cyan-500 to-cyan-800" },
    { ar: "الْمُعِيد", en: "Al-Mu'id", tr: "The Restorer", color: "from-rose-500 to-rose-800" },
    { ar: "الْمُحْيِي", en: "Al-Muhyi", tr: "The Giver of Life", color: "from-emerald-400 to-teal-400" },
    { ar: "الْمُمِيت", en: "Al-Mumit", tr: "The Creator of Death", color: "from-slate-800 to-black" },
    { ar: "الْحَيُّ", en: "Al-Hayy", tr: "The Ever-Living", color: "from-emerald-500 to-emerald-700" },
    { ar: "الْقَيُّوم", en: "Al-Qayyum", tr: "The Self-Subsisting", color: "from-indigo-500 to-indigo-800" },
    { ar: "الْوَاجِد", en: "Al-Wajid", tr: "The Finder", color: "from-amber-400 to-amber-600" },
    { ar: "الْمَاجِد", en: "Al-Majid", tr: "The Noble", color: "from-purple-500 to-purple-800" },
    { ar: "الْوَاحِد", en: "Al-Wahid", tr: "The Unique", color: "from-teal-400 to-teal-700" },
    { ar: "الْأَحَد", en: "Al-Ahad", tr: "The One", color: "from-emerald-600 to-teal-600" },
    { ar: "الصَّمَد", en: "As-Samad", tr: "The Eternal", color: "from-slate-600 to-slate-900" },
    { ar: "الْقَادِر", en: "Al-Qadir", tr: "The Able", color: "from-blue-500 to-blue-700" },
    { ar: "الْمُقْتَدِر", en: "Al-Muqtadir", tr: "The Powerful", color: "from-indigo-600 to-indigo-800" },
    { ar: "الْمُقَدِّم", en: "Al-Muqaddim", tr: "The Expediter", color: "from-amber-500 to-amber-700" },
    { ar: "الْمُؤَخِّر", en: "Al-Mu'akhkhir", tr: "The Delayer", color: "from-rose-500 to-rose-700" },
    { ar: "الْأَحَد", en: "Al-Ahad", tr: "The One", color: "from-emerald-600 to-teal-600" },
    { ar: "الْأَوَّل", en: "Al-Awwal", tr: "The First", color: "from-emerald-400 to-emerald-600" },
    { ar: "الْآخِر", en: "Al-Akhir", tr: "The Last", color: "from-slate-700 to-slate-900" },
    { ar: "الظَّاهِر", en: "Az-Zahir", tr: "The Manifest", color: "from-sky-400 to-sky-600" },
    { ar: "الْبَاطِن", en: "Al-Batin", tr: "The Hidden", color: "from-indigo-700 to-indigo-950" },
    { ar: "الْوَالِي", en: "Al-Wali", tr: "The Governor", color: "from-teal-500 to-teal-800" },
    { ar: "الْمُتَعَالِي", en: "Al-Muta'ali", tr: "The Most Exalted", color: "from-purple-600 to-purple-900" },
    { ar: "الْبَرُّ", en: "Al-Barr", tr: "The Source of All Goodness", color: "from-emerald-300 to-emerald-600" },
    { ar: "التَّوَّاب", en: "At-Tawwab", tr: "The Acceptor of Repentance", color: "from-amber-400 to-amber-700" },
    { ar: "الْمُنْتَقِم", en: "Al-Muntaqim", tr: "The Avenger", color: "from-red-700 to-red-950" },
    { ar: "الْعَفُوُّ", en: "Al-Afuww", tr: "The Pardoner", color: "from-teal-200 to-teal-400" },
    { ar: "الرَّؤُوف", en: "Ar-Ra'uf", tr: "The Compassionate", color: "from-rose-300 to-rose-500" },
    { ar: "مَالِكُ الْمُلْك", en: "Malik-ul-Mulk", tr: "The Owner of Sovereignty", color: "from-amber-600 to-yellow-800" },
    { ar: "ذُو الْجَلَالِ وَالْإِكْرَام", en: "Dhul-Jalal wal-Ikram", tr: "Lord of Majesty and Generosity", color: "from-indigo-700 to-purple-900" },
    { ar: "الْمُقْسِط", en: "Al-Muqsit", tr: "The Equitable", color: "from-emerald-400 to-emerald-700" },
    { ar: "الْجَامِع", en: "Al-Jami'", tr: "The Gatherer", color: "from-blue-500 to-blue-800" },
    { ar: "الْغَنِيُّ", en: "Al-Ghaniyy", tr: "The Self-Sufficient", color: "from-amber-300 to-amber-600" },
    { ar: "الْمُغْنِي", en: "Al-Mughni", tr: "The Enricher", color: "from-teal-400 to-teal-700" },
    { ar: "الْمَانِع", en: "Al-Mani'", tr: "The Preventer", color: "from-slate-600 to-slate-900" },
    { ar: "الضَّارّ", en: "Ad-Darr", tr: "The Distresser", color: "from-red-800 to-black" },
    { ar: "النَّافِع", en: "An-Nafi'", tr: "The Propitious", color: "from-emerald-400 to-emerald-700" },
    { ar: "النُّور", en: "An-Nur", tr: "The Light", color: "from-yellow-300 to-yellow-500" },
    { ar: "الْهَادِي", en: "Al-Hadi", tr: "The Guide", color: "from-sky-400 to-sky-700" },
    { ar: "الْبَدِيع", en: "Al-Badi'", tr: "The Incomparable", color: "from-purple-500 to-purple-800" },
    { ar: "الْبَاقِي", en: "Al-Baqi", tr: "The Everlasting", color: "from-teal-600 to-teal-900" },
    { ar: "الْوَارِث", en: "Al-Warith", tr: "The Inheritor", color: "from-emerald-700 to-emerald-950" },
    { ar: "الرَّشِيد", en: "Ar-Rashid", tr: "The Guide to the Right Path", color: "from-indigo-500 to-indigo-800" },
    { ar: "الصَّبُور", en: "As-Sabur", tr: "The Patient One", color: "from-rose-700 to-rose-900" }
];

type Language = 'english' | 'urdu' | 'hinglish';

const NamesOfAllah: React.FC = () => {
    const [selectedName, setSelectedName] = useState<typeof ALL_NAMES[0] | null>(null);
    const [insight, setInsight] = useState<NameInsight | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [lang, setLang] = useState<Language>('english');

    const filteredNames = useMemo(() => {
        return ALL_NAMES.filter(n => 
            n.en.toLowerCase().includes(search.toLowerCase()) || 
            n.ar.includes(search) ||
            n.tr.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const fetchInsight = async () => {
        if (!selectedName) return;
        setInsight(null);
        setLoading(true);
        const res = await getNameInsight(selectedName.en);
        if (res) setInsight(res);
        setLoading(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-32 px-4 sm:px-6">
            <div className="text-center space-y-6 pt-6">
                <div className="inline-flex items-center gap-2 px-6 py-2 glass-card rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-emerald-600">
                    <Heart className="w-3 h-3 fill-current" /> Divine Essence
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Asma <span className="text-emerald-600">ul Husna</span>.</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto">Explore the 99 Beautiful Attributes of Allah through an intelligent spiritual lens.</p>
                <div className="max-w-xl mx-auto relative group">
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search attribute or meaning..."
                        className="w-full px-8 py-5 pl-14 rounded-[2rem] bg-white dark:bg-slate-900 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none focus:ring-4 focus:ring-emerald-500/10 outline-none text-xl text-slate-800 dark:text-white font-bold transition-all"
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {filteredNames.map((n, i) => (
                    <button 
                        key={i}
                        onClick={() => { setSelectedName(n); setInsight(null); }}
                        className="glass-card p-6 sm:p-8 rounded-[2.5rem] hover:scale-[1.05] transition-all text-left group relative overflow-hidden flex flex-col justify-between h-56 sm:h-64 shadow-sm border-none"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black text-slate-400 opacity-40">#{i + 1}</span>
                            <p className="font-quran text-3xl sm:text-4xl text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors" dir="rtl">{n.ar}</p>
                        </div>
                        
                        <div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">{n.en}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed line-clamp-2">{n.tr}</p>
                        </div>
                    </button>
                ))}
            </div>

            {filteredNames.length === 0 && (
                <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto shadow-sm">
                    <Search className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase">No Attribute Found</h3>
                    <p className="text-slate-500 mt-2 font-medium">Try searching by Arabic name, English name, or meaning.</p>
                </div>
            )}

            {selectedName && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-3xl animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] sm:rounded-[4rem] max-w-2xl w-full overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative border border-white/10 flex flex-col max-h-[90vh]">
                        <button onClick={() => setSelectedName(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-red-500 transition-all rounded-2xl text-white z-20"><X className="w-6 h-6" /></button>
                        
                        <div className={`bg-gradient-to-br ${selectedName.color} p-12 sm:p-20 text-center text-white shrink-0 relative overflow-hidden`}>
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                            <h3 className="font-quran text-5xl sm:text-7xl md:text-9xl mb-8 animate-float drop-shadow-2xl relative z-10">{selectedName.ar}</h3>
                            <h4 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter relative z-10">{selectedName.en}</h4>
                            <div className="w-12 h-1.5 bg-white/30 mx-auto my-6 rounded-full"></div>
                            <p className="opacity-80 font-black tracking-[0.4em] uppercase text-[10px] sm:text-xs relative z-10">{selectedName.tr}</p>
                        </div>
                        
                        <div className="p-8 sm:p-12 overflow-y-auto no-scrollbar flex-1 bg-slate-50/50 dark:bg-slate-950/50">
                            {!insight && !loading ? (
                                <div className="text-center py-10 space-y-10">
                                    <div className="flex justify-center">
                                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center text-emerald-600 shadow-inner">
                                            <BookOpen className="w-10 h-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h5 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Scholarly Extract</h5>
                                        <p className="text-slate-500 text-lg font-bold leading-relaxed max-w-md mx-auto italic">Tap into the AI archives to uncover the theological depth of this Divine Attribute.</p>
                                    </div>
                                    <button 
                                        onClick={fetchInsight} 
                                        className={`px-12 py-5 bg-gradient-to-r ${selectedName.color} text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto`}
                                    >
                                        <Sparkles className="w-4 h-4" /> Begin Synchronization
                                    </button>
                                </div>
                            ) : loading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-emerald-500">
                                    <Loader2 className="w-16 h-16 animate-spin mb-6" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em] animate-pulse">Accessing Al-Alim's Knowledge...</p>
                                </div>
                            ) : insight ? (
                                <div className="space-y-10 animate-fade-in-up">
                                    <div className="flex justify-center">
                                        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-1 sm:gap-2 bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                                            {(['english', 'urdu', 'hinglish'] as Language[]).map(l => (
                                                <button key={l} onClick={() => setLang(l)} className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lang === l ? `bg-gradient-to-r ${selectedName.color} text-white shadow-lg` : 'text-slate-400 hover:text-slate-600'}`}>{l}</button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className={`space-y-8 ${lang === 'urdu' ? 'text-right font-quran text-lg sm:text-xl md:text-2xl' : ''}`} dir={lang === 'urdu' ? 'rtl' : 'ltr'}>
                                        <div className="p-8 glass-card rounded-[2.5rem] shadow-sm border-none hover:shadow-md transition-shadow">
                                            <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                <Globe className="w-4 h-4" /> Linguistic Origin
                                            </h5>
                                            <p className="text-2xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">{insight[lang]?.meaning || "Data missing"}</p>
                                        </div>
                                        
                                        <div className="p-8 glass-card rounded-[2.5rem] shadow-sm border-none hover:shadow-md transition-shadow">
                                            <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                <Lightbulb className="w-4 h-4" /> Spiritual Reflection
                                            </h5>
                                            <p className="text-lg text-slate-600 dark:text-slate-300 font-bold leading-relaxed">{insight[lang]?.reflection || "Reflection unavailable"}</p>
                                        </div>
                                        
                                        <div className={`p-10 bg-gradient-to-br ${selectedName.color} rounded-[3rem] text-white shadow-2xl relative group overflow-hidden`}>
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform"><Zap className="w-16 h-16" /></div>
                                            <h5 className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] mb-4">Practical Application</h5>
                                            <p className="text-xl font-black leading-tight tracking-tight relative z-10">{insight[lang]?.application || "Application details pending"}</p>
                                        </div>
                                    </div>
                                    
                                    <button onClick={() => setInsight(null)} className="w-full py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] hover:text-emerald-600 transition-colors">Clear Insight</button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NamesOfAllah;