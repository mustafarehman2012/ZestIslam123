import React, { useEffect, useState, useCallback } from 'react';
import { PrayerTimeData, GeoLocation } from '../types';
import { MapPin, Loader2, Moon, Sun, Sunrise, Sunset, Compass, Calendar, ArrowUp, Bell, BellOff, Settings2, X, ChevronRight } from 'lucide-react';

const CALC_METHODS = [
    { id: 3, name: 'Muslim World League' },
    { id: 2, name: 'ISNA (North America)' },
    { id: 5, name: 'Egypt (General Authority)' },
    { id: 4, name: 'Umm Al-Qura, Makkah' },
    { id: 1, name: 'Univ. Islamic Sciences, Karachi' },
    { id: 13, name: 'Diyanet, Turkey' },
    { id: 11, name: 'Singapore (MUIS)' },
    { id: 12, name: 'France (UOIF)' },
    { id: 8, name: 'Gulf Region' },
    { id: 9, name: 'Kuwait' },
    { id: 10, name: 'Qatar' }
];

const PrayerTimes: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimeData | null>(null);
  const [hijriDate, setHijriDate] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string>('Locating...');
  const [qibla, setQibla] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const [school, setSchool] = useState(() => Number(localStorage.getItem('zestislam_prayer_school')) || 0); 
  const [method, setMethod] = useState(() => Number(localStorage.getItem('zestislam_prayer_method')) || 2); 
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('zestislam_prayer_notifications') === 'true');

  const fetchPrayerTimes = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const date = new Date();
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`
      );
      const data = await response.json();
      if (data.code === 200) {
        setTimes(data.data.timings);
        const h = data.data.date.hijri;
        setHijriDate(`${h.day} ${h.month.en} ${h.year}`);
        setCity(`${lat.toFixed(2)}, ${lng.toFixed(2)}`); 
      } else { setError('Failed to fetch data'); }
    } catch (err) { setError('Network error'); } finally { setLoading(false); }
  }, [method, school]);

  useEffect(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setLocation(coords);
        calculateQibla(coords.latitude, coords.longitude);
        fetchPrayerTimes(coords.latitude, coords.longitude);
      },
      () => { setError('Enable location access'); setLoading(false); }
    );
  }, [fetchPrayerTimes]);

  useEffect(() => {
      if (location) fetchPrayerTimes(location.latitude, location.longitude);
      localStorage.setItem('zestislam_prayer_school', school.toString());
      localStorage.setItem('zestislam_prayer_method', method.toString());
  }, [school, method, location, fetchPrayerTimes]);

  const toggleNotifications = async () => {
      if (!("Notification" in window)) return;
      if (!notificationsEnabled) {
          let permission = Notification.permission;
          if (permission === 'default') permission = await Notification.requestPermission();
          if (permission === 'granted') {
              setNotificationsEnabled(true);
              localStorage.setItem('zestislam_prayer_notifications', 'true');
          }
      } else {
          setNotificationsEnabled(false);
          localStorage.setItem('zestislam_prayer_notifications', 'false');
      }
  };

  const calculateQibla = (lat1: number, lon1: number) => {
      const lat2 = 21.422487; const lon2 = 39.826206;
      const toRad = (deg: number) => deg * Math.PI / 180;
      const phi1 = toRad(lat1); const phi2 = toRad(lat2);
      const deltaLambda = toRad(lon2 - lon1);
      const y = Math.sin(deltaLambda) * Math.cos(phi2);
      const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
      setQibla(((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360);
  };

  const getNextPrayer = (timings: PrayerTimeData): string => {
    const now = new Date();
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const p of prayers) {
        const [h, m] = timings[p].split(':').map(Number);
        const d = new Date(); d.setHours(h, m, 0, 0);
        if (d > now) return p;
    }
    return 'Fajr';
  };

  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-center"><MapPin className="w-4 h-4 mx-auto mb-1" />{error}</div>;
  if (loading || !times) return <div className="h-48 flex flex-col items-center justify-center text-emerald-600 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="text-xs font-bold text-slate-400">SYNCING...</span></div>;

  const nextPrayer = getNextPrayer(times);

  return (
    <div className="space-y-6">
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start mb-8">
                <div>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">Next: {nextPrayer}</span>
                    <p className="text-5xl font-bold tracking-tight font-serif mt-2">{times[nextPrayer]}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowSettings(true)} className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all"><Settings2 className="w-5 h-5" /></button>
                    <button onClick={toggleNotifications} className={`p-3 rounded-2xl transition-all ${notificationsEnabled ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'}`}>{notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}</button>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-2 relative z-10">
                {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(p => (
                    <div key={p} className={`flex flex-col items-center py-4 rounded-2xl transition-all ${nextPrayer === p ? 'bg-white/15 border border-white/20 scale-105 shadow-lg' : 'opacity-70'}`}>
                        <span className="text-[10px] uppercase font-bold mb-1">{p}</span>
                        <span className="text-xs font-mono font-bold">{times[p]}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sunrise</p><p className="text-2xl font-bold font-mono">{times.Sunrise}</p></div>
                <Sunrise className="w-6 h-6 text-amber-500" />
             </div>
             <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between overflow-hidden">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Qibla</p><p className="text-2xl font-bold font-mono">{qibla ? `${Math.round(qibla)}°` : '---'}</p></div>
                <div className="relative w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full">
                     <Compass className="w-6 h-6 text-slate-300 absolute" />
                     {qibla !== null && <ArrowUp className="w-5 h-5 text-emerald-600 transition-transform duration-1000" style={{ transform: `rotate(${qibla}deg)` }} strokeWidth={3} />}
                </div>
             </div>
        </div>

        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800">
                    <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 text-slate-400"><X className="w-5 h-5" /></button>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 font-serif">Prayer Settings</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">School of Thought (Asr)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setSchool(0)} className={`p-4 rounded-2xl text-sm font-bold border-2 transition-all ${school === 0 ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}>Standard</button>
                                <button onClick={() => setSchool(1)} className={`p-4 rounded-2xl text-sm font-bold border-2 transition-all ${school === 1 ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}>Hanafi</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">Calculation Method</label>
                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                                {CALC_METHODS.map(m => (
                                    <button key={m.id} onClick={() => setMethod(m.id)} className={`w-full p-3 rounded-xl text-left text-sm font-bold flex items-center justify-between transition-all ${method === m.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600'}`}>{m.name}{method === m.id && <ChevronRight className="w-4 h-4" />}</button>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setShowSettings(false)} className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg mt-4">Save Configuration</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default PrayerTimes;