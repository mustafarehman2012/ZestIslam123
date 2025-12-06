
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { GeneratedDua, QuranVerse, TadabburResult } from "../types";

const apiKey = process.env.API_KEY || '';
// We create a function to get a fresh instance, especially important for Veo key changes
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SCHOLAR_INSTRUCTION = `You are a knowledgeable, moderate, and compassionate Islamic scholar assistant for an app called ZestIslam. 
Your goal is to provide accurate information based on the Quran and authentic Hadith (Sunnah). 
Always be polite, respectful, and clear. 
If a question is controversial, present mainstream viewpoints with wisdom (Hikmah). 
Avoid extremism. 
Keep answers concise but informative for a mobile app context.

FORMATTING RULES:
- Use Markdown formatting strictly.
- Use **bold** for key Islamic terms, Quranic Surah names, or emphasis.
- Use bullet points or numbered lists to break down complex explanations.
- Use > Blockquotes for Quranic Ayahs or Hadith translations.
- Separate paragraphs clearly.`;

export const getScholarChatResponse = async (history: {role: string, content: string}[], message: string): Promise<string> => {
  try {
    const ai = getAI();
    // Upgraded to Gemini 3 Pro for better reasoning
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SCHOLAR_INSTRUCTION,
        temperature: 0.7,
      },
      history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I apologize, I could not generate a response at this time.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Something went wrong. Please check your connection and try again.";
  }
};

export const searchQuranByType = async (query: string): Promise<QuranVerse[]> => {
  try {
    const ai = getAI();
    const prompt = `Find up to 5 most relevant Quranic verses for the following query/emotion/topic: "${query}".
    Return the result strictly as a JSON array of objects. 
    Each object must have: "surahName" (string), "verseNumber" (number), "arabicText" (string, fully vocalized), "translation" (string, in English), and "explanation" (string, brief context).
    Do not include markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    surahName: { type: Type.STRING },
                    verseNumber: { type: Type.INTEGER },
                    arabicText: { type: Type.STRING },
                    translation: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["surahName", "verseNumber", "arabicText", "translation", "explanation"]
            }
        }
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Quran Search Error:", error);
    return [];
  }
};

export const generateTadabbur = async (surah: string, verseNumber: number): Promise<TadabburResult | null> => {
  try {
    const ai = getAI();
    const prompt = `Provide a deep spiritual reflection (Tadabbur) for Surah ${surah}, Verse ${verseNumber}.
    Output strictly JSON with 3 keys: 'english', 'urdu', and 'hinglish'.
    For EACH language key, provide an object with:
    - 'paragraph': A deep, meaningful summary paragraph explaining the essence of the verse.
    - 'points': An array of short, profound bullet points derived from the verse.
    Ensure Urdu text is in proper Urdu script. Hinglish should be Roman Urdu/Hindi.`;

    const contentSchema = {
        type: Type.OBJECT,
        properties: {
            paragraph: { type: Type.STRING },
            points: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["paragraph", "points"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verseReference: { type: Type.STRING },
            english: contentSchema,
            urdu: contentSchema,
            hinglish: contentSchema
          },
          required: ["verseReference", "english", "urdu", "hinglish"]
        }
      }
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Tadabbur Error:", error);
    return null;
  }
};

export const generatePersonalizedDua = async (situation: string): Promise<GeneratedDua | null> => {
  try {
    const ai = getAI();
    const prompt = `Generate a beautiful and relevant Islamic Dua (supplication) for a user who is experiencing: "${situation}".
    Return strictly a JSON object with: "title" (short descriptive title), "arabic" (vocalized Arabic text), "transliteration" (English letters), and "translation" (English meaning).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
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

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Dua Gen Error:", error);
    return null;
  }
};

export const getDailyInspiration = async (): Promise<{ type: 'Ayah' | 'Hadith', text: string, source: string } | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Provide one short, inspiring Ayah or Hadith for today. Return JSON with 'type' (Ayah or Hadith), 'text' (English translation), and 'source' (e.g., Surah Al-Baqarah 2:153 or Sahih Bukhari).",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ["Ayah", "Hadith"] },
                        text: { type: Type.STRING },
                        source: { type: Type.STRING }
                    }
                }
            }
        });
        const text = response.text;
        return text ? JSON.parse(text) : null;
    } catch (e) {
        console.error("Daily Inspiration Error", e);
        return null;
    }
}

// --- NEW MEDIA FEATURES ---

export const generateThumbnail = async (prompt: string, aspectRatio: string, size: string, usePro: boolean): Promise<string | null> => {
  try {
    const ai = getAI();
    // Use Flash Image for free tier, Pro Image for paid/high-quality
    const model = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const config: any = {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        }
    };

    // Only add size if Pro model, Flash Image doesn't support it
    if (usePro) {
        config.imageConfig.imageSize = size as any;
    }

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: `Create a high quality, spiritual, and aesthetic Islamic thumbnail for: ${prompt}. Do not portray prophets or prohibited imagery.` }]
      },
      config
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Thumbnail Error:", error);
    return null;
  }
};

export const editIslamicImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    const ai = getAI();
    // Use gemini-2.5-flash-image for editing
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image } },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Edit Image Error:", error);
    return null;
  }
};

export const generateVeoVideo = async (prompt: string, imageBase64?: string, aspectRatio: string = '16:9'): Promise<string | null> => {
    try {
        const ai = getAI();
        const model = 'veo-3.1-fast-generate-preview';
        
        let operation;
        if (imageBase64) {
             operation = await ai.models.generateVideos({
                model,
                prompt,
                image: {
                    imageBytes: imageBase64,
                    mimeType: 'image/png'
                },
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio as any
                }
            });
        } else {
            operation = await ai.models.generateVideos({
                model,
                prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio as any
                }
            });
        }

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) return null;
        return `${uri}&key=${process.env.API_KEY}`;
    } catch (error) {
        console.error("Veo Error:", error);
        throw error;
    }
};

export const findIslamicPlaces = async (query: string, lat: number, lng: number): Promise<any[]> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find ${query} near the provided location. Provide a list with name, description, and why it's recommended.`,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: { latitude: lat, longitude: lng }
                    }
                }
            }
        });
        
        // Return raw chunks to be processed by component
        return response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    } catch (error) {
        console.error("Maps Error:", error);
        return [];
    }
}

export const analyzeMedia = async (fileBase64: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { data: fileBase64, mimeType } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "No analysis available.";
    } catch (error) {
        console.error("Analysis Error:", error);
        return "Failed to analyze media.";
    }
};

export const transcribeMedia = async (fileBase64: string, mimeType: string): Promise<string> => {
    try {
        const ai = getAI();
        // Use gemini-2.5-flash for BOTH Audio and Video to ensure Free Tier compatibility
        // Gemini 2.5 Flash is multimodal and can handle video input as well.
        const model = 'gemini-2.5-flash';
        
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { inlineData: { data: fileBase64, mimeType } },
                    { text: "Transcribe this media file accurately. Identify speakers if possible. Provide a brief summary first, then the full transcript." }
                ]
            }
        });
        return response.text || "No transcription available.";
    } catch (error) {
        console.error("Transcription Error:", error);
        return "Failed to transcribe media.";
    }
}

export const textToSpeech = async (text: string): Promise<ArrayBuffer | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });
        
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
             const binaryString = atob(base64);
             const len = binaryString.length;
             const bytes = new Uint8Array(len);
             for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
             }
             return bytes.buffer;
        }
        return null;
    } catch (error) {
        console.error("TTS Error:", error);
        return null;
    }
}
