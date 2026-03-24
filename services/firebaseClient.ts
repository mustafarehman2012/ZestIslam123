import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC1WH-YX-7pfowrVetQ-_a6xV5n5uz48xA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "zestislam-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "zestislam-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "zestislam-ai.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "845480108188",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:845480108188:web:29bb38002b4d33c1980d59",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-8R9B0RQEVQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
