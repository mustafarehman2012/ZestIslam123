import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GeneratedDua, QuranVerse, TadabburResult, Hadith, SharhResult, DhikrSuggestion, NameInsight, DreamResult, QuizQuestion, SurahMeta, FullSurahVerse } from "../types";

// Initializing multiple instances for different sections
const aiMain = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_MAIN_KEY || process.env.GEMINI_API_KEY });
const aiKnowledge = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_KNOWLEDGE_KEY || process.env.GEMINI_API_KEY });
const aiAssistant = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_ASSISTANT_KEY || process.env.GEMINI_API_KEY });
const aiSpiritual = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_SPIRITUAL_KEY || process.env.GEMINI_API_KEY });
const aiTools = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_TOOLS_KEY || process.env.GEMINI_API_KEY });

const DEFAULT_TEXT_MODEL = 'gemini-3-flash-preview';
const MAPS_MODEL = 'gemini-2.5-flash';

const safeParseJson = (text: string | undefined, fallback: any) => {
    if (!text) return fallback;
    try {
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) { 
        console.error("JSON Parse Error:", e, "Raw text:", text);
        return fallback; 
    }
};

// --- SCHOLAR / ASSISTANT SECTION ---

export const getScholarChatResponse = async (history: {role: string, content: string}[], message: string): Promise<string> => {
  const chat = aiAssistant.chats.create({
    model: DEFAULT_TEXT_MODEL,
    config: { systemInstruction: "You are the NoorZest Islam Scholar assistant. Provide accurate, wise, and empathetic Islamic knowledge." },
    history: history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
  });
  const result = await chat.sendMessage({ message });
  return result.text || "I apologize, I could not generate a response.";
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
    const response = await aiAssistant.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: `Generate a 3-word title for an Islamic chat starting with: "${firstMessage}". Return ONLY text.`,
    });
    return response.text?.trim() || "New Chat";
};

// --- KNOWLEDGE SECTION ---

export const searchQuranByType = async (query: string): Promise<QuranVerse[]> => {
    const response = await aiKnowledge.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: `Find 5 relevant Quranic verses for the query: "${query}". If the query is completely unrelated to Islamic teachings or if no relevant verses exist, return an empty array for 'verses'. Otherwise, return JSON with surahName, verseNumber, arabicText, translation, explanation.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    verses: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                surahName: { type: Type.STRING },
                                verseNumber: { type: Type.NUMBER },
                                arabicText: { type: Type.STRING },
                                translation: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            },
                            required: ["surahName", "verseNumber", "arabicText", "translation", "explanation"]
                        }
                    }
                },
                required: ["verses"]
            }
        }
    });
    const parsed = safeParseJson(response.text, { verses: [] });
    return parsed.verses;
};

export const searchHadithByType = async (query: string): Promise<Hadith[]> => {
    const response = await aiKnowledge.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: `Find 5 authentic Hadiths relevant to: "${query}". If the query is completely unrelated to Islamic teachings or if no relevant hadiths exist, return an empty array for 'hadiths'. Otherwise, include book, number, and grading.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    hadiths: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                book: { type: Type.STRING },
                                hadithNumber: { type: Type.STRING },
                                chapter: { type: Type.STRING },
                                arabicText: { type: Type.STRING },
                                translation: { type: Type.STRING },
                                explanation: { type: Type.STRING },
                                grade: { type: Type.STRING }
                            },
                            required: ["book", "hadithNumber", "chapter", "arabicText", "translation", "explanation", "grade"]
                        }
                    }
                },
                required: ["hadiths"]
            }
        }
    });
    const parsed = safeParseJson(response.text, { hadiths: [] });
    return parsed.hadiths;
};

export const searchIslamicWeb = async (query: string): Promise<{text: string, chunks: any[]} | null> => {
    const response = await aiKnowledge.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: `Provide a detailed scholarly answer for: "${query}". Use Google Search grounding to ensure accuracy.`,
        config: { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
    });
    return { text: response.text || "", chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const generateTadabbur = async (surah: string, verseNumber: number): Promise<TadabburResult | null> => {
    const response = await aiKnowledge.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: `Provide spiritual reflection (Tadabbur) for Quran verse ${surah}:${verseNumber}. Return as JSON with English, Urdu, and Hinglish versions.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    verseReference: { type: Type.STRING },
                    english: { type: Type.OBJECT, properties: { paragraph: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["paragraph", "points"] },
                    urdu: { type: Type.OBJECT, properties: { paragraph: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["paragraph", "points"] },
                    hinglish: { type: Type.OBJECT, properties: { paragraph: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["paragraph", "points"] }
                },
                required: ["english", "urdu", "hinglish"]
            }
        }
    });
    return safeParseJson(response.text, null);
};

export const generateSharh = async (book: string, hadithNumber: string): Promise<SharhResult | null> => {
    const response = await aiKnowledge.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: `Provide spiritual explanation (Sharh) for ${book} Hadith ${hadithNumber}. Return as JSON with English, Urdu, and Hinglish versions.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    hadithReference: { type: Type.STRING },
                    english: { type: Type.OBJECT, properties: { paragraph: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["paragraph", "points"] },
                    urdu: { type: Type.OBJECT, properties: { paragraph: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["paragraph", "points"] },
                    hinglish: { type: Type.OBJECT, properties: { paragraph: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["paragraph", "points"] }
                },
                required: ["english", "urdu", "hinglish"]
            }
        }
    });
    return safeParseJson(response.text, null);
};

// --- SPIRITUAL SECTION ---

export const getDailyInspiration = async (): Promise<{ type: 'Ayah' | 'Hadith', text: string, source: string } | null> => {
    const response = await aiMain.models.generateContent({ 
        model: DEFAULT_TEXT_MODEL, 
        contents: `Provide a daily inspirational Ayah or Hadith. Return as JSON.`, 
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    text: { type: Type.STRING },
                    source: { type: Type.STRING }
                },
                required: ["type", "text", "source"]
            }
        } 
    });
    return safeParseJson(response.text, null);
};

export const getNameInsight = async (name: string): Promise<NameInsight | null> => {
    const response = await aiSpiritual.models.generateContent({ 
        model: DEFAULT_TEXT_MODEL, 
        contents: `Provide spiritual insight for Allah's Name: "${name}". Return as JSON.`, 
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    english: { type: Type.OBJECT, properties: { meaning: { type: Type.STRING }, reflection: { type: Type.STRING }, application: { type: Type.STRING } }, required: ["meaning", "reflection", "application"] },
                    urdu: { type: Type.OBJECT, properties: { meaning: { type: Type.STRING }, reflection: { type: Type.STRING }, application: { type: Type.STRING } }, required: ["meaning", "reflection", "application"] },
                    hinglish: { type: Type.OBJECT, properties: { meaning: { type: Type.STRING }, reflection: { type: Type.STRING }, application: { type: Type.STRING } }, required: ["meaning", "reflection", "application"] }
                },
                required: ["english", "urdu", "hinglish"]
            }
        } 
    });
    return safeParseJson(response.text, null);
};

export const generatePersonalizedDua = async (situation: string): Promise<GeneratedDua | null> => {
    const response = await aiSpiritual.models.generateContent({ 
        model: DEFAULT_TEXT_MODEL, 
        contents: `Create a personalized Dua for: "${situation}". Return as JSON.`, 
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    arabic: { type: Type.STRING },
                    transliteration: { type: Type.STRING },
                    translation: { type: Type.STRING }
                },
                required: ["title", "arabic", "transliteration", "translation"]
            }
        } 
    });
    return safeParseJson(response.text, null);
};

export const getDhikrSuggestion = async (feeling: string): Promise<DhikrSuggestion | null> => {
    const response = await aiSpiritual.models.generateContent({ 
        model: DEFAULT_TEXT_MODEL, 
        contents: `Suggest a specific Dhikr for someone feeling: "${feeling}". Return as JSON.`, 
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    arabic: { type: Type.STRING },
                    transliteration: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    benefit: { type: Type.STRING },
                    target: { type: Type.NUMBER }
                },
                required: ["arabic", "transliteration", "meaning", "benefit", "target"]
            }
        } 
    });
    return safeParseJson(response.text, null);
};

// --- TOOLS SECTION ---

export const interpretDream = async (dream: string): Promise<DreamResult | null> => {
    const response = await aiTools.models.generateContent({ 
        model: DEFAULT_TEXT_MODEL, 
        contents: `Interpret the following dream based on Islamic tradition: "${dream}". Return as JSON.`, 
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    english: { type: Type.OBJECT, properties: { interpretation: { type: Type.STRING }, symbols: { type: Type.ARRAY, items: { type: Type.STRING } }, advice: { type: Type.STRING } }, required: ["interpretation", "symbols", "advice"] },
                    urdu: { type: Type.OBJECT, properties: { interpretation: { type: Type.STRING }, symbols: { type: Type.ARRAY, items: { type: Type.STRING } }, advice: { type: Type.STRING } }, required: ["interpretation", "symbols", "advice"] },
                    hinglish: { type: Type.OBJECT, properties: { interpretation: { type: Type.STRING }, symbols: { type: Type.ARRAY, items: { type: Type.STRING } }, advice: { type: Type.STRING } }, required: ["interpretation", "symbols", "advice"] }
                },
                required: ["english", "urdu", "hinglish"]
            }
        } 
    });
    return safeParseJson(response.text, null);
};

export const generateQuiz = async (topic: string, difficulty: string, count: number): Promise<QuizQuestion[]> => {
    const response = await aiTools.models.generateContent({ 
        model: DEFAULT_TEXT_MODEL, 
        contents: `Generate ${count} ${difficulty} MCQs about ${topic}. Return as JSON array in property 'questions'.`, 
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctIndex: { type: Type.NUMBER },
                                explanation: { type: Type.STRING }
                            },
                            required: ["question", "options", "correctIndex", "explanation"]
                        }
                    }
                },
                required: ["questions"]
            }
        } 
    });
    const parsed = safeParseJson(response.text, { questions: [] });
    return parsed.questions;
};

export const getAIPrayerTimes = async (lat: number, lng: number, method: number, school: number): Promise<any | null> => {
    const date = new Date();
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    
    // We use search grounding to get accurate times via AI
    const response = await aiTools.models.generateContent({
        model: DEFAULT_TEXT_MODEL,
        contents: `Find the Islamic prayer times for coordinates (${lat}, ${lng}) on ${dateStr} using calculation method ${method} and school ${school}. Return JSON: {timings: {Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, Imsak, Midnight}, date: {hijri: {day, month: {en}, year}}}.`,
        config: { 
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    timings: {
                        type: Type.OBJECT,
                        properties: {
                            Fajr: { type: Type.STRING },
                            Sunrise: { type: Type.STRING },
                            Dhuhr: { type: Type.STRING },
                            Asr: { type: Type.STRING },
                            Maghrib: { type: Type.STRING },
                            Isha: { type: Type.STRING }
                        }
                    },
                    date: {
                        type: Type.OBJECT,
                        properties: {
                            hijri: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.NUMBER },
                                    month: { type: Type.OBJECT, properties: { en: { type: Type.STRING } } },
                                    year: { type: Type.NUMBER }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    return safeParseJson(response.text, null);
};

export const findIslamicPlaces = async (query: string, lat: number, lng: number, locationName?: string): Promise<{ places: any[] }> => {
    const response = await aiTools.models.generateContent({ 
        model: MAPS_MODEL, 
        contents: `Find ${query} near ${locationName || 'the specified coordinates'}.`, 
        config: { 
            tools: [{ googleMaps: {} }, { googleSearch: {} }], 
            toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } } 
        } 
    });
    return { places: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((c: any) => c.maps || c.web) || [] };
};

// --- EXTERNAL FETCHERS ---

export const fetchExchangeRates = async (): Promise<Record<string, number>> => {
    try {
        const r = await globalThis.fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const d = await r.json();
        return d.rates || { USD: 1 };
    } catch (e) {
        console.error("Exchange rate fetch error:", e);
        return { USD: 1 };
    }
};

export const fetchSurahList = async (): Promise<SurahMeta[]> => {
    try {
        const r = await globalThis.fetch('https://api.alquran.cloud/v1/surah', { mode: 'cors' }); 
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        const d = await r.json(); 
        return d.code === 200 ? d.data : [];
    } catch (e) {
        console.error("Failed to fetch surah list:", e);
        return [];
    }
};

export const fetchFullSurah = async (num: number): Promise<{ meta: SurahMeta, verses: FullSurahVerse[] } | null> => {
    try {
        const r = await globalThis.fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`, { mode: 'cors' }); 
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        const d = await r.json();
        if (d.code === 200 && d.data.length === 2) {
            return { 
                meta: d.data[0], 
                verses: d.data[0].ayahs.map((a: any, i: number) => ({ 
                    number: a.number, 
                    text: a.text, 
                    translation: d.data[1].ayahs[i].text, 
                    numberInSurah: a.numberInSurah 
                })) 
            };
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch full surah:", e);
        return null;
    }
};

export const fetchSurahAudio = async (num: number): Promise<string[]> => {
    try {
        const r = await globalThis.fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/ar.alafasy`, { mode: 'cors' }); 
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        const d = await r.json(); 
        return d.code === 200 && d.data[0] ? d.data[0].ayahs.map((a: any) => a.audio) : [];
    } catch (e) {
        console.error("Failed to fetch surah audio:", e);
        return [];
    }
};

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const playGeneratedAudio = async (text: string, type?: string, speed: number = 1.0, onEnd?: () => void) => { 
    stopGeneratedAudio();
    try {
        let promptText = text;
        if (type === 'verse') {
            promptText = `Recite the following Quranic Arabic verse beautifully, slowly, and melodiously with full Tajweed, in the style of Qari Mishary Rashid Alafasy:\n\n${text}`;
        } else if (type === 'hadith') {
            promptText = `Read the following Arabic Hadith clearly, respectfully, and eloquently:\n\n${text}`;
        }

        const response = await aiMain.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: promptText,
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
                }
            }
        });
        
        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!inlineData || !inlineData.data) {
            if (onEnd) onEnd();
            return;
        }

        const base64 = inlineData.data;
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        if (!audioCtx) {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        let audioBuffer: AudioBuffer;
        try {
            const bufferCopy = bytes.buffer.slice(0);
            audioBuffer = await audioCtx.decodeAudioData(bufferCopy);
        } catch (e) {
            const sampleRate = 24000;
            const floatArray = new Float32Array(bytes.length / 2);
            const dataView = new DataView(bytes.buffer);
            for (let i = 0; i < floatArray.length; i++) {
                const int16 = dataView.getInt16(i * 2, true);
                floatArray[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
            }
            audioBuffer = audioCtx.createBuffer(1, floatArray.length, sampleRate);
            audioBuffer.getChannelData(0).set(floatArray);
        }

        currentSource = audioCtx.createBufferSource();
        currentSource.buffer = audioBuffer;
        currentSource.playbackRate.value = speed;
        currentSource.connect(audioCtx.destination);
        currentSource.onended = () => {
            if (onEnd) onEnd();
        };
        currentSource.start();

    } catch (e) {
        console.error("TTS Error:", e);
        if (onEnd) onEnd();
    }
};

export const stopGeneratedAudio = () => { 
    if (currentSource) {
        try {
            currentSource.stop();
            currentSource.disconnect();
        } catch (e) {}
        currentSource = null;
    }
};