
export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
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

export interface GeneratedDua {
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
}

export enum AppView {
  HOME = 'HOME',
  QURAN = 'QURAN',
  CHAT = 'CHAT',
  DUA = 'DUA',
  PRAYER = 'PRAYER',
  THUMBNAIL = 'THUMBNAIL',
  MEDIA = 'MEDIA',
  FINDER = 'FINDER',
  LIVE = 'LIVE'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface TadabburContent {
  paragraph: string;
  points: string[];
}

export interface TadabburResult {
  verseReference: string;
  english: TadabburContent;
  urdu: TadabburContent;
  hinglish: TadabburContent;
}
