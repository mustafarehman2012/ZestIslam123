import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, XCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const LiveScholar: React.FC = () => {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState("Ready to connect");
    
    // Refs for audio handling to avoid re-renders
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sessionRef = useRef<any>(null); // To store session object if needed, though usually handled in promise
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopSession = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        // There is no explicit .close() on session object in the provided snippet logic, 
        // but we can refresh the component state.
        setConnected(false);
        setStatus("Disconnected");
    };

    const startSession = async () => {
        try {
            setError(null);
            setStatus("Connecting...");
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            // Setup Audio
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            audioContextRef.current = outputAudioContext;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setConnected(true);
                        setStatus("Scholar is listening...");
                        
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                outputAudioContext,
                                24000,
                                1
                            );
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onclose: () => {
                        setConnected(false);
                        setStatus("Connection closed");
                    },
                    onerror: (e) => {
                        console.error(e);
                        setError("Connection error");
                        setConnected(false);
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                    },
                    systemInstruction: "You are a friendly, wise Islamic scholar. Speak calmly and clearly."
                }
            });

        } catch (e) {
            console.error(e);
            setError("Failed to start session");
            setConnected(false);
        }
    };

    // Helper functions
    function createBlob(data: Float32Array): any {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        // Manual Blob construction for the specific format expected by Live API helper
        // Using the interface defined in prompt instructions
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return {
            data: btoa(binary),
            mimeType: 'audio/pcm;rate=16000'
        };
    }

    function decode(base64: string) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
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

    return (
        <div className="flex flex-col items-center justify-center h-[500px] bg-gradient-to-b from-slate-900 to-emerald-900 rounded-3xl text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
            
            <div className="z-10 text-center space-y-8">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-1000 ${connected ? 'bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}>
                    {connected ? <Activity className="w-16 h-16 animate-pulse text-white" /> : <MicOff className="w-12 h-12 text-slate-400" />}
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-2">Live Scholar</h2>
                    <p className={`text-sm font-mono ${connected ? 'text-emerald-300' : 'text-slate-400'}`}>{status}</p>
                </div>

                {!connected ? (
                    <button onClick={startSession} className="bg-white text-emerald-900 px-8 py-3 rounded-full font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2 mx-auto">
                        <Mic className="w-5 h-5" /> Start Conversation
                    </button>
                ) : (
                    <button onClick={stopSession} className="bg-red-500/20 text-red-200 border border-red-500/50 px-8 py-3 rounded-full font-bold hover:bg-red-500/30 transition-colors flex items-center gap-2 mx-auto">
                        <XCircle className="w-5 h-5" /> End Session
                    </button>
                )}

                {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            </div>
        </div>
    );
};

export default LiveScholar;
