import React, { useEffect, useState, useCallback } from 'react';
import { PrayerTimeData, GeoLocation } from '../types';
import { MapPin, Loader2, Moon, Sun, Sunrise, Sunset, Compass, Calendar, ArrowUp, Bell, BellOff, Map as MapIcon, Clock } from 'lucide-react';

const PrayerTimes: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimeData | null>(null);
  const [hijriDate, setHijriDate] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string>('Detecting Space...');
  const [qibla, setQibla] = useState<number | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('zestislam_prayer_notifications') === 'true');

  const calculateQibla = useCallback((lat1: number, lon1: number) => {
      const lat2 = 21.422487, lon2 = 39.826206;
      const toRad = (d: number) => d * Math.PI / 180, toDeg = (r: number) => r * 180 / Math.PI;
      const phi1 = toRad(lat1), phi2 = toRad(lat2), deltaL = toRad(lon2 - lon1);
      const y = Math.sin(deltaL) * Math.cos(phi2);
      const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaL);
      let bearing = (toDeg(Math.atan2(y, x)) + 360) % 360; 
      setQibla(bearing);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setLocation(coords);
        calculateQibla(coords.latitude, coords.longitude);
      },
      () => { setError('Please enable location for prayer accuracy'); setLoading(false); }
    );
  }, [calculateQibla]);

  useEffect(() => {
    if (location) fetchPrayerTimes(location.latitude, location.longitude);
  }, [location]);

  const toggleNotifications = async () => {
      if (!("Notification" in window)) return;
      if (!notificationsEnabled) {
          let perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
          if (perm === 'granted') {
              setNotificationsEnabled(true);
              localStorage.setItem('zestislam_prayer_notifications', 'true');
          }
      } else {
          setNotificationsEnabled(false);
          localStorage.setItem('zestislam_prayer_notifications', 'false');
      }
  };

  const fetchPrayerTimes = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const d = new Date();
      const res = await fetch(`https://api.aladhan.com/v1/timings/${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}?latitude=${lat}&longitude=${lng}&method=2`);
      const data = await res.json();
      if (data.code === 200) {
        setTimes(data.data.timings);
        const h = data.data.date.hijri;
        setHijriDate(`${h.day} ${h.month.en} ${h.year}`);
        setCity(`${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`); 
      }
    } catch (e) { setError('Connection error'); } finally { setLoading(false); }
  };

  const getNextPrayer = (timings: PrayerTimeData): string => {
    const now = new Date();
    const timeToDate = (tStr: string) => {
        const [h, m] = tStr.split(':').map(Number);
        const d = new Date(); d.setHours(h, m, 0, 0); return d;
    };
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const p of prayers) if (timeToDate(timings[p]) > now) return p;
    return 'Fajr';
  };

  if (loading || !times) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-emerald-500 mb-4" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horizon Alignment...</span>
      </div>
    );
  }

  const nextPrayer = getNextPrayer(times);

  return (
    <div className="space-y-3 sm:space-y-6">
        <div className="bg-[#022c22] rounded-[1.8rem] sm:rounded-[3.5rem] p-4 sm:p-10 text-white shadow-[0_30px_60px_-15px_rgba(6,78,59,0.3)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 transition-all duration-1000 group-hover:bg-emerald-400/20"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-12 gap-4 sm:gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2 sm:mb-4">
                        <span className="bg-white/10 backdrop-blur-md text-emerald-400 text-[7px] sm:text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white/5">Upcoming</span>
                    </div>
                    <p className="text-3xl sm:text-7xl font-black tracking-tighter uppercase mb-0.5">{nextPrayer}</p>
                    <div className="flex items-center gap-1.5 sm:gap-3 text-emerald-200">
                        <Clock className="w-3 h-3 sm:w-6 sm:h-6 opacity-60" />
                        <p className="text-lg sm:text-3xl font-mono font-bold tracking-tighter">{times[nextPrayer]}</p>
                    </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 sm:gap-5">
                    <div className="text-left md:text-right space-y-0.5">
                        <div className="flex items-center md:justify-end text-emerald-400 font-black text-[9px] sm:text-sm uppercase tracking-widest">
                            <Calendar className="w-2.5 h-2.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span>{hijriDate}</span>
                        </div>
                        <div className="flex items-center md:justify-end text-white/40 text-[6px] sm:text-[10px] font-bold uppercase tracking-widest">
                            <MapPin className="w-2 h-2 sm:w-3 sm:h-3 mr-1" /> <span>{city}</span>
                        </div>
                    </div>
                    <button onClick={toggleNotifications} className={`p-2.5 sm:p-5 rounded-xl sm:rounded-3xl transition-all border ${notificationsEnabled ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_15px_30px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}>
                        {notificationsEnabled ? <Bell className="w-4 h-4 sm:w-6 sm:h-6 fill-current" /> : <BellOff className="w-4 h-4 sm:w-6 sm:h-6" />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-3 relative z-10">
                {[
                    { name: 'Fajr', time: times.Fajr, icon: <Sunrise className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> },
                    { name: 'Dhuhr', time: times.Dhuhr, icon: <Sun className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> },
                    { name: 'Asr', time: times.Asr, icon: <Sun className="w-3.5 h-3.5 sm:w-5 sm:h-5 opacity-60" /> },
                    { name: 'Maghrib', time: times.Maghrib, icon: <Sunset className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> },
                    { name: 'Isha', time: times.Isha, icon: <Moon className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> }
                ].map((p) => {
                    const isNext = nextPrayer === p.name;
                    return (
                        <div key={p.name} className={`flex flex-col items-center py-2 sm:py-6 rounded-xl sm:rounded-[2.5rem] transition-all duration-500 ${isNext ? 'bg-white/10 shadow-2xl border border-white/20 scale-[1.03] backdrop-blur-md' : 'opacity-40 hover:opacity-100'}`}>
                            <div className={`mb-1 sm:mb-3 ${isNext ? 'text-emerald-400' : 'text-white'}`}>{p.icon}</div>
                            <span className="text-[6px] sm:text-[10px] font-black uppercase tracking-widest mb-0.5 sm:mb-2">{p.name}</span>
                            <span className="text-[9px] sm:text-lg font-mono font-black tracking-tighter">{p.time}</span>
                        </div>
                    );
                })}
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-6 px-1">
             <div className="bg-white dark:bg-slate-900 p-3 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                <div className="space-y-0 min-w-0">
                    <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Solar</p>
                    <p className="text-xs sm:text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase truncate">Sunrise</p>
                    <p className="text-[10px] sm:text-xl font-mono font-bold text-emerald-600 tracking-tighter">{times.Sunrise}</p>
                </div>
                <div className="w-8 h-8 sm:w-16 sm:h-16 bg-amber-50 dark:bg-amber-900/20 rounded-lg sm:rounded-[1.5rem] flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                    <Sunrise className="w-4 h-4 sm:w-8 sm:h-8" />
                </div>
             </div>
             
             <div className="bg-white dark:bg-slate-900 p-3 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                <div className="space-y-0 min-w-0">
                    <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Qibla</p>
                    <p className="text-xs sm:text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase truncate">Heading</p>
                    <p className="text-[10px] sm:text-xl font-mono font-bold text-emerald-600 tracking-tighter">{qibla ? `${Math.round(qibla)}°` : '---'}</p>
                </div>
                <div className="relative w-8 h-8 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner">
                     <Compass className="w-4 h-4 sm:w-8 sm:h-8 text-slate-300 absolute opacity-20" />
                     {qibla !== null && (
                         <div className="absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-out" style={{ transform: `rotate(${qibla}deg)` }}>
                            <ArrowUp className="w-3 h-3 sm:w-7 sm:h-7 text-emerald-600 -mt-0.5 sm:-mt-1 drop-shadow-lg" strokeWidth={4} />
                         </div>
                     )}
                </div>
             </div>
        </div>
    </div>
  );
};

export default PrayerTimes;