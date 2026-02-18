

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  conversationId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export interface PrayerTimeData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

export interface QuranVerse {
  surahName: string;
  verseNumber: number;
  arabicText: string;
  translation: string;
  explanation: string;
}

export interface Hadith {
  book: string;
  hadithNumber: string;
  chapter: string;
  arabicText: string;
  translation: string;
  explanation: string;
  grade: string;
}

export interface UserProfile {
  name: string;
  email: string;
  joinedDate: Date;
}

// Added GeneratedDua interface to resolve export errors in service and components
export interface GeneratedDua {
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
}

export enum AppView {
  HOME = 'HOME',
  QURAN = 'QURAN',
  HADEES = 'HADEES',
  UNIFIED = 'UNIFIED',
  CHAT = 'CHAT',
  DUA = 'DUA',
  PRAYER = 'PRAYER',
  FINDER = 'FINDER',
  LIVE = 'LIVE',
  TASBIH = 'TASBIH',
  NAMES = 'NAMES',
  DREAM = 'DREAM',
  QUIZ = 'QUIZ',
  MEDIA = 'MEDIA',
  THUMBNAIL = 'THUMBNAIL',
  RAMADAN = 'RAMADAN',
  ABOUT = 'ABOUT',
  CONTACT = 'CONTACT',
  LOGIN = 'LOGIN',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface TadabburResult {
  verseReference: string;
  english: { paragraph: string; points: string[] };
  urdu: { paragraph: string; points: string[] };
  hinglish: { paragraph: string; points: string[] };
}

export interface SharhResult {
  hadithReference: string;
  english: { paragraph: string; points: string[] };
  urdu: { paragraph: string; points: string[] };
  hinglish: { paragraph: string; points: string[] };
}

export interface DhikrSuggestion {
  arabic: string;
  transliteration: string;
  meaning: string;
  benefit: string;
  target: number;
}

export interface NameInsight {
  name: string;
  english: { meaning: string; reflection: string; application: string };
  urdu: { meaning: string; reflection: string; application: string };
  hinglish: { meaning: string; reflection: string; application: string };
}

export interface DreamResult {
    english: { interpretation: string; symbols: string[]; advice: string };
    urdu: { interpretation: string; symbols: string[]; advice: string };
    hinglish: { interpretation: string; symbols: string[]; advice: string };
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface SurahMeta {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

export interface FullSurahVerse {
    number: number;
    text: string;
    translation: string;
    numberInSurah: number;
}

// Ramadan Specific
export interface RamadanDailyContent {
  day: number;
  reflection: string;
  hadith: string;
  mission: string;
  journalPrompt: string;
}