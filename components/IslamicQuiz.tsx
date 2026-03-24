import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, RefreshCw, Trophy, Loader2, Brain, Target, Clock, ArrowRight, Settings2, Sparkles, Book, History, MessageCircle, Lightbulb, Zap, ShieldCheck } from 'lucide-react';
import { generateQuiz } from '../services/geminiService';
import { QuizQuestion } from '../types';

const TOPIC_PRESETS = [
    { id: "General Knowledge", icon: Brain, color: "from-emerald-400 to-teal-600", desc: "Foundations" },
    { id: "Quranic Stories", icon: Book, color: "from-indigo-400 to-purple-600", desc: "The Prophets" },
    { id: "Prophet Muhammad (PBUH)", icon: Target, color: "from-rose-400 to-pink-600", desc: "Seerah" },
    { id: "Salah & Fiqh", icon: Clock, color: "from-amber-400 to-orange-600", desc: "Rulings" }
];

const IslamicQuiz: React.FC = () => {
    const [topic, setTopic] = useState('General Knowledge');
    const [customTopic, setCustomTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [questionCount, setQuestionCount] = useState<number>(5);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);

    const startQuiz = async () => {
        setLoading(true);
        const finalTopic = customTopic.trim() || topic;
        const q = await generateQuiz(finalTopic, difficulty, questionCount);
        if (q) { setQuestions(q); setCurrentIdx(0); setScore(0); setSelectedOption(null); setShowExplanation(false); setQuizStarted(true); }
        setLoading(false);
    };

    const handleAnswer = (idx: number) => {
        if (selectedOption !== null) return; 
        setSelectedOption(idx);
        setShowExplanation(true);
        if (idx === questions[currentIdx].correctIndex) setScore(prev => prev + 1);
    };

    const nextQuestion = () => {
        if (currentIdx < questions.length - 1) { setCurrentIdx(prev => prev + 1); setSelectedOption(null); setShowExplanation(false); }
        else setQuizStarted(false);
    };

    if (loading) return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24 md:py-48 animate-fade-in px-6">
            <div className="relative mb-8 md:mb-12">
                <div className="w-24 h-24 md:w-32 md:h-32 border-8 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                <Zap className="w-8 h-8 md:w-12 md:h-12 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h3 className="text-xl md:text-3xl font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-slate-800 dark:text-white text-center">Analyzing Archives</h3>
        </div>
    );

    if (!quizStarted && questions.length > 0) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
             <div className="max-w-4xl mx-auto animate-fade-in py-10 md:py-20 px-4">
                <div className="glass-card p-8 md:p-24 rounded-[3rem] md:rounded-[5rem] text-center relative overflow-hidden border-none shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-2 md:h-4 bg-gradient-to-r from-emerald-500 to-indigo-600"></div>
                    <div className="w-24 h-24 md:w-40 md:h-40 bg-emerald-50 dark:bg-emerald-950 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mx-auto mb-6 md:mb-12 shadow-2xl">
                        <Trophy className="w-12 h-12 md:w-20 md:h-20 text-emerald-600 animate-float" />
                    </div>
                    <h2 className="text-4xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 md:mb-6 uppercase">Rank: {percentage}%</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg md:text-2xl font-bold mb-8 md:mb-16 uppercase tracking-tight">{percentage >= 80 ? "Mu'allim (Master)" : "Talib (Seeker)"}</p>
                    <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-16">
                        <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-10 rounded-3xl md:rounded-[3.5rem] shadow-inner">
                            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-4">EXP</p>
                            <p className="text-2xl md:text-5xl font-black text-emerald-600">+{score * 100}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-10 rounded-3xl md:rounded-[3.5rem] shadow-inner">
                            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-4">Score</p>
                            <p className="text-2xl md:text-5xl font-black text-indigo-600">{score}/{questions.length}</p>
                        </div>
                    </div>
                    <button onClick={() => { setQuizStarted(false); setQuestions([]); }} className="w-full max-w-md mx-auto py-4 md:py-8 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl md:rounded-[3rem] font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl active:scale-95 transition-all">New Challenge</button>
                </div>
             </div>
        )
    }

    if (!quizStarted) return (
        <div className="max-w-6xl mx-auto space-y-10 md:space-y-16 animate-fade-in px-4 pb-20">
            <div className="text-center space-y-4 md:space-y-8 pt-6 md:pt-10">
                <div className="inline-flex items-center gap-3 px-6 py-2 md:px-8 md:py-3 glass-card rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" /> Ranked Lobby
                </div>
                <h2 className="text-4xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight md:leading-[0.9]">Knowledge <span className="bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">Challenge</span>.</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-xl font-medium max-w-3xl mx-auto">Expand your intellect and earn your rank in the community.</p>
            </div>
            
            <div className="grid lg:grid-cols-12 gap-6 md:gap-10">
                <div className="lg:col-span-8 space-y-6 md:space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {TOPIC_PRESETS.map(t => (
                            <button key={t.id} onClick={() => { setTopic(t.id); setCustomTopic(''); }} className={`p-6 md:p-10 rounded-[2rem] md:rounded-[4rem] text-left transition-all relative overflow-hidden group ${topic === t.id ? 'glass-card border-emerald-500 ring-4 md:ring-8 ring-emerald-500/5 shadow-2xl' : 'glass-card opacity-50 grayscale hover:grayscale-0 hover:opacity-100'}`}>
                                <div className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${t.color} rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-white mb-4 md:mb-8 shadow-lg group-hover:rotate-6 transition-transform`}><t.icon className="w-6 h-6 md:w-8 md:h-8" /></div>
                                <h4 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.id}</h4>
                                <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 md:mt-2">{t.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-4">
                    <div className="glass-card p-6 md:p-12 rounded-[2.5rem] md:rounded-[4.5rem] space-y-8 md:space-y-12 sticky top-32 border-none shadow-2xl">
                         <div className="space-y-4 md:space-y-6">
                            <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tier Selection</h3>
                            <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 md:p-2 rounded-2xl md:rounded-[2rem] gap-1">
                                {['easy', 'medium', 'hard'].map(d => (
                                    <button key={d} onClick={() => setDifficulty(d as any)} className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${difficulty === d ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{d}</button>
                                ))}
                            </div>
                         </div>
                         <button onClick={startQuiz} className="w-full py-5 md:py-8 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-widest md:tracking-[0.5em] text-[10px] md:text-xs shadow-2xl active:scale-95 transition-all">Begin Quest</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const q = questions[currentIdx];
    return (
        <div className="max-w-4xl mx-auto animate-fade-in py-6 md:py-20 px-4 pb-24">
            {/* Header Info */}
            <div className="flex justify-between items-center mb-6 md:mb-12 px-2">
                <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Sector {currentIdx + 1}/{questions.length}</span>
                <span className="text-xl md:text-2xl font-black text-emerald-600 tracking-tighter">Pts: {score * 100}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 md:h-3 bg-slate-100 dark:bg-slate-950 rounded-full mb-8 md:mb-16 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${((currentIdx) / questions.length) * 100}%` }}></div>
            </div>

            {/* Question Card */}
            <div className="glass-card rounded-[2.5rem] md:rounded-[5rem] overflow-hidden border-none shadow-2xl">
                <div className="p-6 md:p-24">
                    <h3 className="text-xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 md:mb-16 tracking-tighter leading-tight">
                        {q.question}
                    </h3>
                    
                    <div className="grid gap-3 md:gap-6">
                        {q.options.map((opt, idx) => {
                            let s = "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100";
                            if (selectedOption !== null) {
                                if (idx === q.correctIndex) s = "bg-emerald-600 text-white shadow-xl md:scale-[1.05]";
                                else if (idx === selectedOption) s = "bg-red-600 text-white opacity-100 shadow-lg";
                                else s = "opacity-20 grayscale md:scale-95";
                            }
                            return (
                                <button 
                                    key={idx} 
                                    onClick={() => handleAnswer(idx)} 
                                    disabled={selectedOption !== null} 
                                    className={`w-full text-left p-5 md:p-8 rounded-2xl md:rounded-[3rem] transition-all font-bold md:font-black text-sm md:text-xl uppercase tracking-tight flex justify-between items-center ${s}`}
                                >
                                    <span className="pr-4">{opt}</span>
                                    {selectedOption !== null && idx === q.correctIndex && <CheckCircle className="w-5 h-5 md:w-8 md:h-8 shrink-0" />}
                                    {selectedOption !== null && idx === selectedOption && idx !== q.correctIndex && <XCircle className="w-5 h-5 md:w-8 md:h-8 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Explanation Section */}
                {showExplanation && (
                    <div className="bg-emerald-600/5 dark:bg-emerald-500/5 p-6 md:p-24 border-t border-emerald-500/10 animate-fade-in-up">
                        <div className="flex items-start gap-4 md:gap-8 mb-8 md:mb-12">
                            <div className="w-10 h-10 md:w-16 md:h-16 bg-white dark:bg-slate-900 rounded-xl md:rounded-[2rem] flex items-center justify-center text-emerald-600 shadow-lg shrink-0">
                                <Lightbulb className="w-5 h-5 md:w-8 md:h-8" />
                            </div>
                            <p className="text-sm md:text-2xl font-bold text-emerald-900 dark:text-emerald-100 italic leading-relaxed">
                                {q.explanation}
                            </p>
                        </div>
                        <button 
                            onClick={nextQuestion} 
                            className="w-full py-5 md:py-8 bg-emerald-600 text-white rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl flex items-center justify-center gap-3 md:gap-4 active:scale-95 transition-all"
                        >
                            {currentIdx === questions.length - 1 ? 'Finish Challenge' : 'Next Sector'} 
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IslamicQuiz;