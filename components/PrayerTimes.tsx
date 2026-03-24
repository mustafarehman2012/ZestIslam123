import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { PrayerTimeData, GeoLocation } from '../types';
import { 
  MapPin, Loader2, Moon, Sun, Sunrise, Sunset, 
  Compass, Calendar, ArrowUp, Bell, BellOff, 
  Clock, Settings2, Check 
} from 'lucide-react';

const CALC_METHODS = [
    { id: 1, name: 'Karachi (UIS)' },
    { id: 2, name: 'ISNA (North America)' },
    { id: 3, name: 'Muslim World League' },
    { id: 4, name: 'Umm Al-Qura, Makkah' },
    { id: 5, name: 'Egyptian Authority' },
    { id: 8, name: 'Gulf Region' },
    { id: 13, name: 'Turkey (Diyanet)' },
];

const SCHOOLS = [
    { id: 0, name: 'Shafi / Standard' },
    { id: 1, name: 'Hanafi' },
];

const PrayerTimes: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimeData | null>(null);
  const [hijriDate, setHijriDate] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string>('Detecting Location...');
  
  const [method, setMethod] = useState(() => Number(localStorage.getItem('zestislam_calc_method')) || 1);
  const [school, setSchool] = useState(() => Number(localStorage.getItem('zestislam_asr_school')) || 0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('zestislam_prayer_notifications') === 'true');
  const [showSettings, setShowSettings] = useState(false);

  

  const fetchPrayerTimes = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date();
      const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const cacheKey = `zest_prayer_cache_${lat.toFixed(2)}_${lon.toFixed(2)}_${method}_${school}_${dateString}`;
      
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setTimes(data.timings);
        const h = data.date.hijri;
        setHijriDate(`${h.day} ${h.month.en} ${h.year}`);
        setCity(`${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${dateString}?latitude=${lat}&longitude=${lon}&method=${method}&school=${school}`
      );
      
      const result = await response.json();

      if (result.code === 200) {
        const data = result.data;
        setTimes(data.timings);
        const h = data.date.hijri;
        setHijriDate(`${h.day} ${h.month.en} ${h.year}`);
        setCity(`${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
        
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } else {
        setError(result.data || 'Failed to fetch prayer times.');
      }
    } catch (e) { 
        setError('Network error. Check connection.'); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLocation(coords);
      },
      () => { setError('Location access denied.'); setLoading(false); }
    );
  }, []);

  useEffect(() => {
    if (location) fetchPrayerTimes(location.lat, location.lon);
  }, [location, method, school]);

  useEffect(() => {
    localStorage.setItem('zestislam_calc_method', method.toString());
    localStorage.setItem('zestislam_asr_school', school.toString());
  }, [method, school]);

  const toggleNotifications = async () => {
      if (!("Notification" in window)) return;
      if (!notificationsEnabled) {
          let perm = Notification.permission;
          if (perm !== 'granted') perm = await Notification.requestPermission();
          if (perm === 'granted') {
              setNotificationsEnabled(true);
              localStorage.setItem('zestislam_prayer_notifications', 'true');
          }
      } else {
          setNotificationsEnabled(false);
          localStorage.setItem('zestislam_prayer_notifications', 'false');
      }
  };

  const { currentPrayer, nextPrayer, isTransition } = useMemo(() => {
    if (!times) return { currentPrayer: '---', nextPrayer: '---', isTransition: false };
    const now = new Date();
    const timeToDate = (tStr: string) => {
        const [h, m] = tStr.split(':').map(Number);
        const d = new Date(); d.setHours(h, m, 0, 0); return d;
    };
    const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const sunriseTime = timeToDate(times.Sunrise);
    
    let current = 'Isha';
    let next = 'Fajr';
    let transition = false;

    for (let i = 0; i < prayerOrder.length; i++) {
        const pTime = timeToDate(times[prayerOrder[i] as keyof PrayerTimeData]);
        if (now >= pTime) {
            current = prayerOrder[i];
            next = prayerOrder[(i + 1) % prayerOrder.length];
        }
    }

    if (current === 'Fajr' && now >= sunriseTime) {
        current = 'Sunrise';
        transition = true;
    }

    return { currentPrayer: current, nextPrayer: next, isTransition: transition };
  }, [times]);

  if (loading || !times) {
    return (
      <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl">
        {error ? (
          <div className="text-center px-6">
            <p className="text-red-500 font-bold mb-2">Error</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest">{error}</p>
          </div>
        ) : (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-6" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Fetching API Data...</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="bg-[#022c22] rounded-[3rem] md:rounded-[4rem] p-6 md:p-12 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-2 gap-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                        <div className={`w-2 h-2 rounded-full ${isTransition ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                            {isTransition ? 'Spiritual Transition' : 'Current Timeframe'}
                        </span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                        {isTransition ? 'Sunrise' : currentPrayer}
                    </h2>
                    <div className="flex items-center gap-3 text-emerald-200/60">
                        <Clock className="w-5 h-5" />
                        <span className="text-2xl font-mono font-bold">
                            {isTransition ? times.Sunrise : times[currentPrayer as keyof PrayerTimeData]}
                        </span>
                    </div>
                </div>

                <div className="lg:border-l lg:border-white/5 lg:pl-12 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3">Upcoming Ritual</p>
                            <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-slate-200">{nextPrayer}</h3>
                            <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{times[nextPrayer as keyof PrayerTimeData]}</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setShowSettings(!showSettings)} className={`p-4 rounded-2xl transition-all border ${showSettings ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                                <Settings2 className="w-6 h-6" />
                            </button>
                            <button onClick={toggleNotifications} className={`p-4 rounded-2xl transition-all border ${notificationsEnabled ? 'bg-emerald-500 text-white border-emerald-400 shadow-xl' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                                {notificationsEnabled ? <Bell className="w-6 h-6 fill-current" /> : <BellOff className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                        <div>
                            <div className="flex items-center text-emerald-400 font-black text-xs uppercase tracking-widest gap-2">
                                <Calendar className="w-4 h-4" /> <span>{hijriDate}</span>
                            </div>
                            <div className="flex items-center text-slate-500 text-[9px] font-bold uppercase tracking-widest gap-2 mt-1">
                                <MapPin className="w-3 h-3" /> <span>{city}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-2 md:gap-4 mt-12 relative z-10">
                {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                    const isCurrent = currentPrayer === pName;
                    const icons = {
                        Fajr: <Sunrise className="w-4 h-4 md:w-5 md:h-5" />,
                        Dhuhr: <Sun className="w-4 h-4 md:w-5 md:h-5" />,
                        Asr: <Sun className="w-4 h-4 md:w-5 md:h-5 opacity-60" />,
                        Maghrib: <Sunset className="w-4 h-4 md:w-5 md:h-5" />,
                        Isha: <Moon className="w-4 h-4 md:w-5 md:h-5" />
                    };
                    return (
                        <div key={pName} className={`flex flex-col items-center py-3 md:py-8 rounded-2xl md:rounded-[3rem] transition-all duration-500 ${isCurrent ? 'bg-white/10 shadow-2xl border border-white/20 scale-[1.05] backdrop-blur-md' : 'opacity-40 hover:opacity-100 hover:bg-white/5'}`}>
                            <div className={`mb-1 md:mb-4 ${isCurrent ? 'text-emerald-400' : 'text-white'}`}>{icons[pName]}</div>
                            <span className="text-[7px] md:text-xs font-black uppercase tracking-widest mb-0.5 md:mb-2">{pName}</span>
                            <span className="text-xs md:text-xl font-mono font-black tracking-tighter">{times[pName]}</span>
                        </div>
                    );
                })}
            </div>
        </div>

        {showSettings && (
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">Close</button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculation Method</label>
                        <div className="grid gap-2">
                            {CALC_METHODS.map(m => (
                                <button key={m.id} onClick={() => setMethod(m.id)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${method === m.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-transparent bg-slate-50 text-slate-500'}`}>
                                    <span className="text-[11px] font-black uppercase">{m.name}</span>
                                    {method === m.id && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asr School</label>
                        <div className="grid gap-2">
                            {SCHOOLS.map(s => (
                                <button key={s.id} onClick={() => setSchool(s.id)} className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all ${school === s.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-transparent bg-slate-50 text-slate-500'}`}>
                                    <span className="text-sm font-black uppercase">{s.name}</span>
                                    {school === s.id && <Check className="w-5 h-5" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        <div className="grid grid-cols-1 gap-4 md:gap-8">
             <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Solar</p>
                    <p className="text-xl md:text-4xl font-black text-slate-800 dark:text-white uppercase truncate">Sunrise</p>
                    <p className="text-base md:text-2xl font-mono font-bold text-emerald-600 mt-1">{times.Sunrise}</p>
                </div>
                <div className="w-12 h-12 md:w-20 md:h-20 bg-amber-50 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-amber-500">
                    <Sunrise className="w-6 h-6 md:w-10 md:h-10" />
                </div>
             </div>
             
             
        </div>
    </div>
  );
};

export default PrayerTimes;