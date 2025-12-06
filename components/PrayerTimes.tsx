import React, { useEffect, useState } from 'react';
import { PrayerTimeData, GeoLocation } from '../types';
import { MapPin, Loader2, Moon, Sun, Sunrise, Sunset } from 'lucide-react';

const PrayerTimes: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimeData | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string>('Locating...');

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        setError('Unable to retrieve your location. Please enable location access.');
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (location) {
      fetchPrayerTimes(location.latitude, location.longitude);
    }
  }, [location]);

  const fetchPrayerTimes = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const date = new Date();
      // Use Aladhan API (public/free)
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${lat}&longitude=${lng}&method=2`
      );
      const data = await response.json();
      
      if (data.code === 200) {
        setTimes(data.data.timings);
        // Reverse geocoding hint is not available in Aladhan basic response, usually needs Google Maps API. 
        // We will just use coordinates or generic text for now.
        setCity(`${lat.toFixed(2)}, ${lng.toFixed(2)}`); 
      } else {
        setError('Failed to fetch prayer times.');
      }
    } catch (err) {
      setError('Network error while fetching prayer times.');
    } finally {
      setLoading(false);
    }
  };

  const getNextPrayer = (timings: PrayerTimeData): string => {
    const now = new Date();
    const timeToDate = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return d;
    };

    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const prayer of prayers) {
        if (timeToDate(timings[prayer]) > now) {
            return prayer;
        }
    }
    return 'Fajr (Tomorrow)';
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100">
        <MapPin className="w-5 h-5 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (loading || !times) {
    return (
      <div className="h-64 flex items-center justify-center text-emerald-600">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 font-medium">Calculating times...</span>
      </div>
    );
  }

  const nextPrayer = getNextPrayer(times);

  return (
    <div className="space-y-6">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Next Prayer</h2>
                    <p className="text-3xl font-bold">{nextPrayer}</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end opacity-80 text-sm mb-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{city}</span>
                    </div>
                    <p className="text-lg font-mono opacity-90">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center">
                {[
                    { name: 'Fajr', time: times.Fajr, icon: <Sunrise className="w-5 h-5" /> },
                    { name: 'Dhuhr', time: times.Dhuhr, icon: <Sun className="w-5 h-5" /> },
                    { name: 'Asr', time: times.Asr, icon: <Sun className="w-5 h-5 opacity-75" /> },
                    { name: 'Maghrib', time: times.Maghrib, icon: <Sunset className="w-5 h-5" /> },
                    { name: 'Isha', time: times.Isha, icon: <Moon className="w-5 h-5" /> }
                ].map((p) => (
                    <div key={p.name} className={`flex flex-col items-center p-2 rounded-xl transition-all ${nextPrayer.startsWith(p.name) ? 'bg-white/20 backdrop-blur-sm transform scale-105 shadow-inner' : 'opacity-70 hover:opacity-100'}`}>
                        <div className="mb-2">{p.icon}</div>
                        <span className="text-xs font-medium mb-1">{p.name}</span>
                        <span className="text-xs font-mono font-bold">{p.time}</span>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500 mb-1">Sunrise</p>
                    <p className="text-lg font-bold text-slate-700 font-mono">{times.Sunrise}</p>
                </div>
                <Sunrise className="w-8 h-8 text-orange-400 opacity-80" />
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500 mb-1">Midnight</p>
                    <p className="text-lg font-bold text-slate-700 font-mono">{times.Midnight || '00:00'}</p>
                </div>
                <Moon className="w-8 h-8 text-indigo-400 opacity-80" />
             </div>
        </div>
    </div>
  );
};

export default PrayerTimes;