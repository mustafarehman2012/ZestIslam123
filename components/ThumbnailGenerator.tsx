import React, { useState } from 'react';
import { Image, Loader2, Download, Settings, AlertCircle, Sparkles } from 'lucide-react';
import { generateThumbnail } from '../services/geminiService';

const ThumbnailGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [size, setSize] = useState('1K');
  const [usePro, setUsePro] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleGenerate = async () => {
    if (!prompt) return;
    setStatus('');
    
    // Only check for API key if using Pro model (Paid/High Quality)
    if (usePro) {
        const aiStudio = (window as any).aistudio;
        if (aiStudio) {
            try {
                const hasKey = await aiStudio.hasSelectedApiKey();
                if (!hasKey) {
                    await aiStudio.openSelectKey();
                }
            } catch (e) {
                console.error("Key selection failed", e);
                setStatus("API Key selection cancelled or failed.");
                return;
            }
        }
    }

    setLoading(true);
    setImageUrl(null);
    
    const result = await generateThumbnail(prompt, aspectRatio, size, usePro);
    
    if (result) {
        setImageUrl(result);
    } else {
        setStatus(usePro ? 
            "Generation failed. Please ensure you have selected a valid API Key with access to Gemini 3 Pro Image." :
            "Generation failed. Please try again."
        );
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Islamic Thumbnail Gen</h2>
        <p className="text-slate-500">Create beautiful, compliant thumbnails for your content.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
                
                {/* Mode Toggle */}
                <div className="mb-6 p-1 bg-slate-100 rounded-lg flex relative">
                    <button 
                        onClick={() => setUsePro(false)}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all z-10 ${!usePro ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Standard (Free)
                    </button>
                    <button 
                        onClick={() => setUsePro(true)}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all z-10 flex items-center justify-center gap-1 ${usePro ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        HD (Pro) <Sparkles className="w-3 h-3" />
                    </button>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image Prompt</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A peaceful mosque at sunset, geometric patterns..."
                        className="w-full p-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500 h-32 resize-none text-sm"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Aspect Ratio</label>
                    <select 
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                        <option value="1:1">1:1 (Square)</option>
                        <option value="4:3">4:3 (Standard)</option>
                        <option value="3:4">3:4 (Portrait)</option>
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Story)</option>
                    </select>
                </div>

                {/* Only show resolution for Pro mode */}
                {usePro && (
                    <div className="mb-6 animate-fade-in">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Resolution</label>
                        <div className="flex gap-2">
                            {['1K', '2K', '4K'].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setSize(s)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${size === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className={`w-full text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${usePro ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />}
                    Generate {usePro ? 'HD' : ''}
                </button>
                
                {status && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{status}</span>
                    </div>
                )}
             </div>
          </div>

          <div className="md:col-span-2">
             <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 h-full min-h-[400px] flex items-center justify-center bg-slate-50/50 overflow-hidden relative">
                {loading ? (
                    <div className="text-center">
                        <Loader2 className={`w-10 h-10 animate-spin mx-auto mb-2 ${usePro ? 'text-purple-500' : 'text-emerald-500'}`} />
                        <p className="text-slate-500 text-sm">Designing your thumbnail...</p>
                    </div>
                ) : imageUrl ? (
                    <div className="relative group w-full h-full flex items-center justify-center bg-slate-100">
                        <img src={imageUrl} alt="Generated" className="max-w-full max-h-[600px] object-contain shadow-lg" />
                        <a 
                            href={imageUrl} 
                            download="thumbnail.png"
                            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-emerald-900 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-50"
                        >
                            <Download className="w-6 h-6" />
                        </a>
                    </div>
                ) : (
                    <div className="text-center text-slate-400">
                        <Image className="w-16 h-16 mx-auto mb-2 opacity-20" />
                        <p>Your creation will appear here</p>
                    </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default ThumbnailGenerator;