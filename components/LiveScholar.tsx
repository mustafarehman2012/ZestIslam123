import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, XCircle, Volume2, VolumeX, PauseCircle, Sparkles, Info, Loader2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const LiveScholar: React.FC = () => {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState("Sanctuary Ready");
    const [duration, setDuration] = useState(0);
    const [micMuted, setMicMuted] = useState(false);

    const intervalRef = useRef<any>(null);
    const visualizerIntervalRef = useRef<any>(null);
    const [audioLevels, setAudioLevels] = useState<number[]>(new Array(40).fill(10));

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    useEffect(() => {
        return () => { stopSession(); };
    }, []);

    useEffect(() => {
        if (connected) {
            intervalRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
            visualizerIntervalRef.current = setInterval(() => {
                setAudioLevels(prev => prev.map(() => Math.random() * (micMuted ? 5 : 60) + 10));
            }, 100);
        } else {
            setDuration(0);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
            setAudioLevels(new Array(40).fill(10));
        }
        return () => { 
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
        };
    }, [connected, micMuted]);

    const stopSession = () => {
        if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current.onaudioprocess = null; processorRef.current = null; }
        if (inputAudioContextRef.current) { inputAudioContextRef.current.close(); inputAudioContextRef.current = null; }
        if (outputAudioContextRef.current) { outputAudioContextRef.current.close(); outputAudioContextRef.current = null; }
        
        sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) { } });
        sourcesRef.current.clear();
        
        setConnected(false);
        setMicMuted(false);
        setStatus("Sanctuary Disconnected");
    };

    const startSession = async () => {
        try {
            setError(null);
            setStatus("Establishing Nexus...");
            
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                setError("API Key configuration missing.");
                return;
            }

            const ai = new GoogleGenAI({ apiKey });
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            inputAudioContextRef.current = inputCtx;
            
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            outputAudioContextRef.current = outputCtx;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setConnected(true);
                        setStatus("In Dialogue...");
                        const source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        processorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            if (micMuted) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(s => s.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: () => stopSession(),
                    onerror: (e) => { console.error(e); setError("Comm Link Broken"); stopSession(); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: "You are the NoorZest Islam Live Scholar. Maintain a serene, wise, and empathetic voice. Use your knowledge of Quran and Sunnah to guide the seeker in real-time."
                }
            });
        } catch (e) {
            setError("Permission Denied");
            console.error(e);
        }
    };

    function createBlob(data: Float32Array): any {
        const int16 = new Int16Array(data.length);
        for (let i = 0; i < data.length; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    }

    function decode(base64: string) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
        return bytes;
    }

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    }

    function encode(bytes: Uint8Array) {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
        return btoa(binary);
    }

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-4xl mx-auto min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-4 md:p-6 space-y-6 md:space-y-12 animate-fade-in">
            <div className="text-center space-y-3 md:space-y-4">
                <div className="inline-flex items-center gap-1.5 px-4 md:px-6 py-1.5 md:py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-800">
                    <Activity className={`w-3.5 h-3.5 ${connected ? 'animate-pulse' : ''}`} /> Voice Consul
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Spiritual <span className="text-emerald-600">Voice</span>.</h2>
                <div className="flex items-center justify-center gap-2">
                    <p className={`text-[10px] md:text-sm font-bold uppercase tracking-widest ${connected ? 'text-emerald-500' : 'text-slate-400'}`}>{error || status}</p>
                    {connected && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono text-[10px] font-black text-slate-500">{formatDuration(duration)}</span>}
                </div>
            </div>

            <div className="relative w-full max-w-sm md:max-w-xl flex flex-col items-center">
                <div className="h-24 md:h-40 w-full flex items-center justify-center gap-1 mb-8 md:mb-12">
                    {audioLevels.map((level, i) => (
                        <div 
                            key={i} 
                            className={`w-1.5 md:w-2 rounded-full transition-all duration-100 ${connected ? (micMuted ? 'bg-slate-300 dark:bg-slate-700' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]') : 'bg-slate-200 dark:bg-slate-800'}`}
                            style={{ height: `${level}%` }}
                        />
                    ))}
                </div>

                <div className="relative group">
                    {!connected && (
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-[40px] md:blur-[60px] animate-pulse"></div>
                    )}
                    <button 
                        onClick={connected ? () => setMicMuted(!micMuted) : startSession}
                        className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center transition-all duration-700 group shadow-2xl ${
                            connected 
                            ? (micMuted ? 'bg-slate-100 dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700' : 'bg-emerald-600 border-4 border-emerald-500 scale-105') 
                            : 'bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 hover:scale-105 active:scale-95'
                        }`}
                    >
                        {connected ? (
                            micMuted ? <MicOff className="w-12 h-12 md:w-20 md:h-20 text-slate-400" /> : <Activity className="w-16 h-16 md:w-24 md:h-24 text-white animate-pulse" />
                        ) : (
                            <>
                                <Mic className="w-12 h-12 md:w-20 md:h-20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span className="absolute bottom-10 md:bottom-12 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Connect</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {connected && (
                <div className="w-full max-w-xs md:max-w-2xl flex justify-center animate-fade-in-up">
                    <button onClick={stopSession} className="w-full py-4 md:py-6 bg-red-600 text-white rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"><XCircle className="w-4 h-4 md:w-5 md:h-5" /> End Session</button>
                </div>
            )}
        </div>
    );
};

export default LiveScholar;