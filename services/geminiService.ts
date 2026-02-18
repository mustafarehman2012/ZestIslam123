import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedDua, QuranVerse, TadabburResult, Hadith, SharhResult, DhikrSuggestion, NameInsight, DreamResult, QuizQuestion, SurahMeta, FullSurahVerse, RamadanDailyContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const TEXT_MODEL = 'gemini-3-flash-preview';
const MAPS_MODEL = 'gemini-2.5-flash';

const safeParseJson = (text: string | undefined, fallback: any) => {
    if (!text) return fallback;
    try {
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) { 
        console.error("Gemini JSON Parse Error:", e, "Raw text:", text);
        return fallback; 
    }
};

// --- SCHOLAR / ASSISTANT SECTION ---

export const getRamadanDailyContent = async (day: number): Promise<RamadanDailyContent | null> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Generate high-value Ramadan spiritual content for Day ${day} of 30. Return JSON: {day, reflection, hadith, mission, journalPrompt}. Keep it short and impactful.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.NUMBER },
                    reflection: { type: Type.STRING },
                    hadith: { type: Type.STRING },
                    mission: { type: Type.STRING },
                    journalPrompt: { type: Type.STRING }
                },
                required: ["day", "reflection", "hadith", "mission", "journalPrompt"]
            }
        }
    });
    return safeParseJson(response.text, null);
};

export const getScholarChatResponse = async (history: {role: string, content: string}[], message: string): Promise<string> => {
  const chat = ai.chats.create({
    model: TEXT_MODEL,
    config: { systemInstruction: "You are the ZestIslam Scholar assistant. Provide accurate, wise, and empathetic Islamic knowledge." },
    history: history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
  });
  const result = await chat.sendMessage({ message });
  return result.text || "I apologize, I could not generate a response.";
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Generate a 3-word title for an Islamic chat starting with: "${firstMessage}". Return ONLY text.`,
    });
    return response.text?.trim() || "New Chat";
};

// --- KNOWLEDGE SECTION ---

export const searchQuranByType = async (query: string): Promise<QuranVerse[]> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Find 5 relevant Quranic verses for the query: "${query}". Return JSON with surahName, verseNumber, arabicText, translation, explanation.`,
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
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Find 5 authentic Hadiths relevant to: "${query}". Include book, number, and grading.`,
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
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Provide a detailed scholarly answer for: "${query}". Use Google Search grounding to ensure accuracy.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    return { text: response.text || "", chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const generateTadabbur = async (surah: string, verseNumber: number): Promise<TadabburResult | null> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Provide spiritual reflection (Tadabbur) for Quran verse ${surah}:${verseNumber}. Return as JSON with English, Urdu, and Hinglish versions.`,
        config: { responseMimeType: "application/json" }
    });
    return safeParseJson(response.text, null);
};

export const generateSharh = async (book: string, hadithNumber: string): Promise<SharhResult | null> => {
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: `Provide spiritual explanation (Sharh) for ${book} Hadith ${hadithNumber}. Return as JSON with English, Urdu, and Hinglish versions.`,
        config: { responseMimeType: "application/json" }
    });
    return safeParseJson(response.text, null);
};

// --- SPIRITUAL SECTION ---

export const getDailyInspiration = async (): Promise<{ type: 'Ayah' | 'Hadith', text: string, source: string } | null> => {
    const response = await ai.models.generateContent({ 
        model: TEXT_MODEL, 
        contents: `Provide a daily inspirational Ayah or Hadith. Return as JSON.`, 
        config: { responseMimeType: "application/json" } 
    });
    return safeParseJson(response.text, null);
};

export const getNameInsight = async (name: string): Promise<NameInsight | null> => {
    const response = await ai.models.generateContent({ 
        model: TEXT_MODEL, 
        contents: `Provide spiritual insight for Allah's Name: "${name}". Return as JSON.`, 
        config: { responseMimeType: "application/json" } 
    });
    return safeParseJson(response.text, null);
};

export const generatePersonalizedDua = async (situation: string): Promise<GeneratedDua | null> => {
    const response = await ai.models.generateContent({ 
        model: TEXT_MODEL, 
        contents: `Create a personalized Dua for: "${situation}". Return as JSON.`, 
        config: { responseMimeType: "application/json" } 
    });
    return safeParseJson(response.text, null);
};

export const getDhikrSuggestion = async (feeling: string): Promise<DhikrSuggestion | null> => {
    const response = await ai.models.generateContent({ 
        model: TEXT_MODEL, 
        contents: `Suggest a specific Dhikr for someone feeling: "${feeling}". Return as JSON.`, 
        config: { responseMimeType: "application/json" } 
    });
    return safeParseJson(response.text, null);
};

// --- TOOLS SECTION ---

export const interpretDream = async (dream: string): Promise<DreamResult | null> => {
    const response = await ai.models.generateContent({ 
        model: TEXT_MODEL, 
        contents: `Interpret the following dream based on Islamic tradition: "${dream}". Return as JSON.`, 
        config: { responseMimeType: "application/json" } 
    });
    return safeParseJson(response.text, null);
};

export const generateQuiz = async (topic: string, difficulty: string, count: number): Promise<QuizQuestion[]> => {
    const response = await ai.models.generateContent({ 
        model: TEXT_MODEL, 
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

export const findIslamicPlaces = async (query: string, lat: number, lng: number, locationName?: string): Promise<{ places: any[] }> => {
    const response = await ai.models.generateContent({ 
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

export const fetchSurahList = async (): Promise<SurahMeta[]> => {
    const r = await fetch('https://api.alquran.cloud/v1/surah'); 
    const d = await r.json(); 
    return d.code === 200 ? d.data : [];
};

export const fetchFullSurah = async (num: number): Promise<{ meta: SurahMeta, verses: FullSurahVerse[] } | null> => {
    const r = await fetch(`https://api.aladhan.com/v1/surah/${num}/editions/quran-uthmani,en.sahih`); 
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
};

export const fetchSurahAudio = async (num: number): Promise<string[]> => {
    const r = await fetch(`https://api.aladhan.com/v1/surah/${num}/editions/ar.alafasy`); 
    const d = await r.json(); 
    return d.code === 200 && d.data[0] ? d.data[0].ayahs.map((a: any) => a.audio) : [];
};

export const playGeneratedAudio = async (text: string, type?: string, speed?: number, onEnd?: () => void) => { 
    if (onEnd) setTimeout(onEnd, 1000); 
};

export const stopGeneratedAudio = () => { };
