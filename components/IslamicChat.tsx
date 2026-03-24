import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Sparkles, Trash2, Mic, MicOff, User, Lock, LogIn, Plus, MessageSquare, Menu, X, ChevronLeft, Edit3, Bookmark, Share2, Info } from 'lucide-react';
import { getScholarChatResponse, generateChatTitle } from '../services/geminiService';
import { getUserConversations, getConversationMessages, saveUserChatMessage, deleteConversation, updateConversationTitle } from '../services/userService';
import { Message, UserProfile, Conversation } from '../types';
import { marked } from 'marked';

interface IslamicChatProps {
    user: UserProfile | null;
    onLoginClick: () => void;
}

const SUGGESTED_TOPICS = [
    { label: "Patience in Trials", icon: "🌱" },
    { label: "Excellence in Prayer", icon: "🕌" },
    { label: "Rights of Parents", icon: "❤️" },
    { label: "The Power of Dua", icon: "🤲" }
];

const IslamicChat: React.FC<IslamicChatProps> = ({ user, onLoginClick }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
        loadConversations();
    } else {
        setMessages([{
            id: '1',
            role: 'model',
            content: `Assalamu Alaykum. I am the NoorZest Islam Scholar, your AI guide for spiritual knowledge. Base your questions on Quranic wisdom or Prophetic traditions, and I shall assist you.`,
            timestamp: new Date()
        }]);
    }
  }, [user]);

  const loadConversations = async () => {
      if (!user) return;
      setLoadingHistory(true);
      const convs = await getUserConversations(user.email);
      setConversations(convs);
      if (convs.length > 0 && !currentConversationId) {
          selectConversation(convs[0].id);
      } else if (convs.length === 0) {
          startNewChat();
      }
      setLoadingHistory(false);
  };

  const selectConversation = async (id: string) => {
      setCurrentConversationId(id);
      setLoading(true);
      const msgs = await getConversationMessages(id);
      if (msgs.length === 0) {
           setMessages([{
                id: '1',
                role: 'model',
                content: `Assalamu Alaykum ${user?.name}. How can I assist your spiritual journey today?`,
                timestamp: new Date()
            }]);
      } else {
          setMessages(msgs);
      }
      setSidebarOpen(false);
      setLoading(false);
  };

  const startNewChat = () => {
      const newId = crypto.randomUUID();
      setCurrentConversationId(newId);
      setMessages([{
          id: '1',
          role: 'model',
          content: `Assalamu Alaykum ${user ? user.name : ''}. I am the NoorZest Islam Scholar. Feel free to ask about Fiqh, Quranic Tafsir, or general spiritual advice.`,
          timestamp: new Date()
      }]);
      setSidebarOpen(false);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!user) return;
      await deleteConversation(user.email, id);
      const updated = conversations.filter(c => c.id !== id);
      setConversations(updated);
      if (currentConversationId === id) {
          if (updated.length > 0) selectConversation(updated[0].id);
          else startNewChat();
      }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setInput('');
    
    let activeId = currentConversationId;
    let isNew = false;
    let title = 'New Conversation';

    if (!activeId) {
        activeId = crypto.randomUUID();
        setCurrentConversationId(activeId);
    }

    if (user && !conversations.find(c => c.id === activeId)) {
        isNew = true;
        title = text.slice(0, 25) + '...';
    }

    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date(),
        conversationId: activeId
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    if (user && activeId) {
        await saveUserChatMessage(user.email, activeId, userMsg, isNew, title);
        if (isNew) {
            loadConversations();
            generateChatTitle(userMsg.content).then(async (aiTitle) => {
                if (user && activeId) {
                    await updateConversationTitle(user.email, activeId, aiTitle);
                    loadConversations();
                }
            });
        }
    }

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const response = await getScholarChatResponse(history, userMsg.content);

    const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response,
        timestamp: new Date(),
        conversationId: activeId
    };

    setMessages(prev => [...prev, botMsg]);
    setLoading(false);

    if (user && activeId) {
        await saveUserChatMessage(user.email, activeId, botMsg);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
        return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; 
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => sendMessage(event.results[0][0].transcript);
        recognitionRef.current = recognition;
        recognition.start();
    } catch (e) { setIsListening(false); }
  };

  return (
    // REMOVED: rounded corners, shadow, and fixed height offsets. 
    // ADDED: h-screen and w-full for a "Direct App" feel.
    <div className="flex h-screen w-full bg-white dark:bg-slate-900 overflow-hidden relative">
      
      {/* --- MOBILE OVERLAY --- */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <div className={`absolute lg:relative z-50 h-full w-80 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-500 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex justify-between items-center">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-[10px] uppercase tracking-[0.4em]">Divine Dialogues</h3>
              
              {/* Close Sidebar Button */}
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
          </div>
          <div className="p-4">
              <button 
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
              >
                  <Plus className="w-5 h-5" /> Start New Quest
              </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 space-y-1.5 custom-scrollbar pb-6">
              {loadingHistory ? (
                  <div className="py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 opacity-50" /></div>
              ) : user ? (
                  conversations.map(conv => (
                      <div 
                        key={conv.id}
                        onClick={() => selectConversation(conv.id)}
                        className={`group p-4 rounded-2xl cursor-pointer transition-all border relative overflow-hidden ${currentConversationId === conv.id ? 'bg-white dark:bg-slate-800 border-emerald-500/20 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-900 border-transparent'}`}
                      >
                          <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <MessageSquare className={`w-4 h-4 shrink-0 ${currentConversationId === conv.id ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-600'}`} />
                                  <h4 className={`text-xs font-black truncate uppercase tracking-tight ${currentConversationId === conv.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{conv.title}</h4>
                              </div>
                              <button onClick={(e) => handleDeleteConversation(e, conv.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 rounded-lg transition-all">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="text-center py-20 px-8 opacity-40">
                      <Lock className="w-10 h-10 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Login to save history</p>
                  </div>
              )}
          </div>
      </div>

      {/* --- MAIN CHAT --- */}
      <div className="flex-1 flex flex-col relative w-full bg-white dark:bg-slate-900">
        <div className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><Menu className="w-6 h-6" /></button>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center text-white shadow-lg"><Bot className="w-6 h-6" /></div>
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">NoorZest Islam Scholar</h3>
                    <p className="text-[8px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] flex items-center gap-1.5"><Sparkles className="w-2.5 h-2.5" /> Divine Wisdom</p>
                </div>
            </div>
            {!user && <button onClick={onLoginClick} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:bg-emerald-600 transition-all">Sign In</button>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-slate-50/10 dark:bg-slate-950/10 custom-scrollbar">
            {messages.length === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto py-8 animate-fade-in">
                    {SUGGESTED_TOPICS.map((topic, i) => (
                        <button key={i} onClick={() => sendMessage(topic.label)} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-left hover:border-emerald-400 transition-all group shadow-sm">
                            <span className="text-2xl mb-2 block">{topic.icon}</span>
                            <p className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-tight">{topic.label}</p>
                        </button>
                    ))}
                </div>
            )}

            {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                    {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0 mt-1"><Sparkles className="w-4 h-4" /></div>
                    )}
                    <div className={`max-w-[88%] sm:max-w-[75%] p-5 sm:p-6 transition-all relative ${msg.role === 'user' ? 'bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800'}`}>
                        {msg.role === 'model' ? (
                            <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} />
                        ) : (
                            <p className="text-sm font-semibold leading-relaxed">{msg.content}</p>
                        )}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start gap-4 animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Loader2 className="w-4 h-4 animate-spin text-emerald-500" /></div>
                    <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800">
                        <div className="flex gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-100"></span><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-200"></span></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-8">
            <form onSubmit={handleSend} className="relative flex items-center gap-2 max-w-4xl mx-auto">
                <button type="button" onClick={toggleVoiceInput} className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <div className="flex-1 relative bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center px-4 shadow-inner">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Ask the scholar..."} className="w-full py-4 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white text-sm font-medium" />
                    <button type="submit" disabled={loading || !input.trim()} className="text-emerald-600 disabled:opacity-30 p-2"><Send className="w-6 h-6" /></button>
                </div>
            </form>
            <p className="text-center text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-1.5"><Info className="w-3 h-3" /> AI Guidance is for reference. Consult scholars for Fatawa.</p>
        </div>
      </div>
    </div>
  );
};

export default IslamicChat;