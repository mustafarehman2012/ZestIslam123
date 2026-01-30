import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Sparkles, Trash2, Mic, MicOff, User, Lock, LogIn, Plus, MessageSquare, Menu, X, ChevronLeft, Edit3 } from 'lucide-react';
import { getScholarChatResponse, generateChatTitle } from '../services/geminiService';
import { getUserConversations, getConversationMessages, saveUserChatMessage, deleteConversation, updateConversationTitle } from '../services/userService';
import { Message, UserProfile, Conversation } from '../types';
import { marked } from 'marked';

interface IslamicChatProps {
    user: UserProfile | null;
    onLoginClick: () => void;
}

// Fixed the return type error by completing the component and ensuring it returns a ReactNode
export const IslamicChat: React.FC<IslamicChatProps> = ({ user, onLoginClick }) => {
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // UI State
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load Conversations on Mount
  useEffect(() => {
    if (user) {
        loadConversations();
    } else {
        // Guest mode default init
        setMessages([{
            id: '1',
            role: 'model',
            content: `Assalamu Alaykum. I am the ZestIslam Scholar, powered by Google Gemini. How can I assist you in your spiritual journey today?`,
            timestamp: new Date()
        }]);
    }
  }, [user]);

  const loadConversations = async () => {
      if (!user) return;
      setLoadingHistory(true);
      const convs = await getUserConversations(user.email);
      setConversations(convs);
      
      // If there are conversations, load the most recent one
      if (convs.length > 0 && !currentConversationId) {
          selectConversation(convs[0].id);
      } else if (convs.length === 0) {
          startNewChat(false);
      }
      setLoadingHistory(false);
  };

  // Fixed missing startNewChat function
  const startNewChat = (shouldLoad = true) => {
      setCurrentConversationId(null);
      setMessages([{
          id: crypto.randomUUID(),
          role: 'model',
          content: `Assalamu Alaykum ${user?.name || 'there'}. I am the ZestIslam Scholar. How can I help you?`,
          timestamp: new Date()
      }]);
      if (shouldLoad) setSidebarOpen(false);
  };

  const selectConversation = async (id: string) => {
      setCurrentConversationId(id);
      setLoading(true);
      const msgs = await getConversationMessages(id);
      // Fixed missing timestamp property in Message object
      if (msgs.length === 0) {
           setMessages([{
                id: crypto.randomUUID(),
                role: 'model',
                content: `Assalamu Alaykum ${user?.name || ''}. I am the ZestIslam Scholar.`,
                timestamp: new Date()
           }]);
      } else {
          setMessages(msgs);
      }
      setLoading(false);
      setSidebarOpen(false);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: input,
        timestamp: new Date(),
        conversationId: currentConversationId || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
        const history = messages.map(m => ({ role: m.role, content: m.content }));
        const responseText = await getScholarChatResponse(history, input);
        
        const botMessage: Message = {
            id: crypto.randomUUID(),
            role: 'model',
            content: responseText,
            timestamp: new Date(),
            conversationId: currentConversationId || undefined
        };

        setMessages(prev => [...prev, botMessage]);

        if (user && user.email) {
            let convId = currentConversationId;
            let isNew = false;
            let title = '';

            if (!convId) {
                convId = crypto.randomUUID();
                setCurrentConversationId(convId);
                isNew = true;
                title = await generateChatTitle(input);
            }

            await saveUserChatMessage(user.email, convId, userMessage, isNew, title);
            await saveUserChatMessage(user.email, convId, botMessage);
            
            if (isNew) loadConversations();
        }
    } catch (error) {
        console.error("Chat error:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
      if (!user || !window.confirm("Delete conversation?")) return;
      await deleteConversation(user.email, id);
      if (currentConversationId === id) startNewChat();
      loadConversations();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
      {/* Sidebar for conversations */}
      <aside className={`${sidebarOpen ? 'absolute inset-0 z-40' : 'hidden'} md:relative md:flex flex-col w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white">Conversations</h3>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <button 
                onClick={() => startNewChat()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold mb-4 shadow-md hover:bg-emerald-700 transition-all"
              >
                  <Plus className="w-5 h-5" /> New Session
              </button>
              {loadingHistory ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
              ) : conversations.map(c => (
                  <div key={c.id} className="group relative">
                      <button 
                        onClick={() => selectConversation(c.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${currentConversationId === c.id ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                          <MessageSquare className="w-4 h-4" />
                          <div className="flex-1 truncate text-sm font-medium">{c.title}</div>
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
              ))}
          </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        <header className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-500"><Menu className="w-6 h-6" /></button>
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600"><Bot className="w-6 h-6" /></div>
                <div>
                    <h2 className="font-bold text-slate-800 dark:text-white leading-tight">Scholar Assistant</h2>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Always Active</p>
                </div>
            </div>
            {!user && <button onClick={onLoginClick} className="text-xs font-bold text-emerald-600 px-4 py-2 bg-emerald-50 rounded-lg">Log in to save history</button>}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
            {messages.map((m, i) => (
                <div key={m.id || i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                    <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${m.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 text-white shadow-lg'}`}>
                            {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`p-4 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed ${m.role === 'user' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-none' : 'bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none'}`}>
                            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(m.content) as string }} />
                            <p className="text-[9px] mt-2 opacity-30 font-bold uppercase tracking-wider">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start animate-fade-in">
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center animate-pulse"><Bot className="w-4 h-4" /></div>
                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about Quran, Hadith, or Fiqh..."
                    className="w-full pl-6 pr-16 py-4 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-lg focus:ring-4 focus:ring-emerald-500/10 outline-none text-slate-700 dark:text-slate-200"
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg flex items-center justify-center transition-all disabled:opacity-50 active:scale-95"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
            <p className="text-center text-[9px] text-slate-400 mt-4 uppercase font-bold tracking-[0.2em]">Powered by Google Gemini AI Studio</p>
        </footer>
      </div>
    </div>
  );
};

// Fixed module export error by adding default export
export default IslamicChat;
