
import React, { useState, useRef } from 'react';
import { Video, Wand2, Eye, Upload, Loader2, Play, FileAudio } from 'lucide-react';
import { generateVeoVideo, editIslamicImage, analyzeMedia, transcribeMedia } from '../services/geminiService';

type Tab = 'EDIT' | 'VEO' | 'ANALYZE' | 'TRANSCRIBE';

const MediaStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('EDIT');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [veoAspectRatio, setVeoAspectRatio] = useState('16:9');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const getBase64 = (file: File): Promise<string> => {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
              const res = reader.result as string;
              resolve(res.split(',')[1]);
          }
          reader.readAsDataURL(file);
      })
  }

  const handleAction = async () => {
      setLoading(true);
      setResult(null);
      setStatus('Processing...');
      
      try {
          if (activeTab === 'EDIT' && file && prompt) {
              const b64 = await getBase64(file);
              const res = await editIslamicImage(b64, prompt);
              setResult(res);
          } else if (activeTab === 'VEO') {
              // Removed explicit API Key selection enforcement to allow Free Tier usage 
              // (or implicit environment key usage).
              
              let b64 = undefined;
              if (file) b64 = await getBase64(file);
              
              const res = await generateVeoVideo(prompt, b64, veoAspectRatio);
              setResult(res);
          } else if (activeTab === 'ANALYZE' && file) {
               const b64 = await getBase64(file);
               const res = await analyzeMedia(b64, file.type, prompt || "Analyze this image in detail.");
               setResult(res);
          } else if (activeTab === 'TRANSCRIBE' && file) {
               const b64 = await getBase64(file);
               const res = await transcribeMedia(b64, file.type);
               setResult(res);
          }
      } catch (e) {
          console.error(e);
          setStatus("Error occurred. Please try again or check console.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Islamic Media Studio</h2>
        <p className="text-slate-500">Edit images, animate photos with Veo, analyze, or transcribe content.</p>
      </div>

      <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-emerald-100 flex flex-wrap justify-center">
              {[
                  { id: 'EDIT', label: 'Edit', icon: Wand2 },
                  { id: 'VEO', label: 'Video Gen', icon: Video },
                  { id: 'ANALYZE', label: 'Analyze', icon: Eye },
                  { id: 'TRANSCRIBE', label: 'Transcribe', icon: FileAudio }
              ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTab(t.id as Tab); setResult(null); setFile(null); setPreview(null); setPrompt(''); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === t.id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                      <t.icon className="w-4 h-4" />
                      {t.label}
                  </button>
              ))}
          </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
                   {/* Inputs based on Tab */}
                   {(activeTab === 'EDIT' || activeTab === 'ANALYZE' || activeTab === 'VEO' || activeTab === 'TRANSCRIBE') && (
                       <div className="mb-4">
                           <label className="block text-sm font-medium text-slate-700 mb-2">
                               {activeTab === 'VEO' ? 'Start Image (Optional)' : 'Upload Media'}
                           </label>
                           <input 
                               type="file" 
                               ref={fileInputRef}
                               onChange={handleFileChange}
                               accept={
                                   activeTab === 'VEO' ? "image/*" :
                                   activeTab === 'TRANSCRIBE' ? "audio/*,video/*" :
                                   "image/*,video/*"
                               }
                               className="hidden"
                           />
                           <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-emerald-200 rounded-xl p-8 text-center cursor-pointer hover:bg-emerald-50 transition-colors"
                            >
                               {preview && activeTab !== 'TRANSCRIBE' ? (
                                   activeTab === 'ANALYZE' && file?.type.startsWith('video') ? 
                                   <div className="text-emerald-600 font-medium">Video Selected</div> :
                                   <img src={preview} alt="Preview" className="h-32 mx-auto object-contain rounded-lg" />
                               ) : file ? (
                                   <div className="text-emerald-600 font-medium flex flex-col items-center">
                                       <FileAudio className="w-8 h-8 mb-2" />
                                       {file.name}
                                   </div>
                               ) : (
                                   <>
                                    <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">Click to upload {activeTab === 'TRANSCRIBE' ? 'Audio/Video' : 'Media'}</p>
                                   </>
                               )}
                           </div>
                       </div>
                   )}

                   {activeTab !== 'TRANSCRIBE' && (
                       <div className="mb-4">
                           <label className="block text-sm font-medium text-slate-700 mb-2">
                               {activeTab === 'EDIT' ? 'Editing Instruction' : activeTab === 'VEO' ? 'Video Prompt' : 'Question (Optional)'}
                           </label>
                           <textarea 
                               value={prompt}
                               onChange={(e) => setPrompt(e.target.value)}
                               placeholder={
                                   activeTab === 'EDIT' ? "Remove the person in the background, Add a retro filter..." :
                                   activeTab === 'VEO' ? "A cinematic drone shot of a mosque..." :
                                   "What is written in this calligraphy?"
                               }
                               className="w-full p-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500 h-24 resize-none text-sm"
                           />
                       </div>
                   )}

                   {activeTab === 'VEO' && (
                       <div className="mb-4">
                           <label className="block text-sm font-medium text-slate-700 mb-2">Aspect Ratio</label>
                           <div className="flex gap-2">
                               <button onClick={() => setVeoAspectRatio('16:9')} className={`px-4 py-2 rounded-lg text-sm border ${veoAspectRatio === '16:9' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200'}`}>16:9</button>
                               <button onClick={() => setVeoAspectRatio('9:16')} className={`px-4 py-2 rounded-lg text-sm border ${veoAspectRatio === '9:16' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200'}`}>9:16</button>
                           </div>
                       </div>
                   )}

                   <button
                        onClick={handleAction}
                        disabled={loading || (!file && activeTab !== 'VEO') || (activeTab === 'VEO' && !prompt)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                        {
                            activeTab === 'EDIT' ? 'Edit Image' : 
                            activeTab === 'VEO' ? 'Generate Video' : 
                            activeTab === 'TRANSCRIBE' ? 'Start Transcription' :
                            'Analyze'
                        }
                    </button>
                    {loading && <p className="text-center text-xs text-slate-500 mt-2">{status}</p>}
               </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-emerald-50 h-full min-h-[400px] flex items-center justify-center bg-slate-50/50 p-4">
              {loading ? (
                   <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">Working magic...</p>
                        {activeTab === 'VEO' && <p className="text-xs text-slate-400 mt-2">Veo generation takes a few minutes</p>}
                   </div>
              ) : result ? (
                  activeTab === 'ANALYZE' || activeTab === 'TRANSCRIBE' ? (
                      <div className="prose prose-sm prose-emerald overflow-y-auto max-h-[400px] w-full p-2">
                          <h4 className="font-bold text-slate-800 mb-2">
                              {activeTab === 'TRANSCRIBE' ? 'Transcription Result:' : 'Analysis Result:'}
                          </h4>
                          <p className="whitespace-pre-wrap text-slate-700">{result}</p>
                      </div>
                  ) : activeTab === 'VEO' ? (
                      <video src={result} controls className="max-w-full max-h-[400px] rounded-lg" autoPlay loop />
                  ) : (
                      <img src={result} alt="Result" className="max-w-full max-h-[400px] object-contain rounded-lg" />
                  )
              ) : (
                  <div className="text-center text-slate-400">
                       <p>Output will appear here</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default MediaStudio;
