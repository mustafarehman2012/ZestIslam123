import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Loader2, Utensils, Search, Globe, AlertCircle, RotateCcw, Hotel, ChevronRight, Zap } from 'lucide-react';
import { findIslamicPlaces } from '../services/geminiService';

const HalalFinder: React.FC = () => {
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [addressName, setAddressName] = useState<string>('Calibrating...');
    const [places, setPlaces] = useState<any[]>([]);
    const [placesLoading, setPlacesLoading] = useState(false);
    const [query, setQuery] = useState('Halal Restaurants');
    const [error, setError] = useState<string | null>(null);

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await globalThis.fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12`, { headers: { 'Accept-Language': 'en' } });
            const data = await response.json();
            setAddressName(data?.address?.city || data?.address?.town || 'Current Loc');
        } catch (e) { setAddressName('Current Loc'); }
    };

    const detectLocation = useCallback(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => { const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setLocation(c); reverseGeocode(c.lat, c.lng); },
            () => setError("Positioning blocked.")
        );
    }, []);

    useEffect(() => detectLocation(), [detectLocation]);

    const handlePlacesSearch = async () => {
        if (!location) return;
        setPlacesLoading(true); setError(null); setPlaces([]);
        try {
            const { places: results } = await findIslamicPlaces(query, location.lat, location.lng, addressName);
            const seen = new Set();
            const valid = results.map(c => c.maps ? { title: c.maps.title, uri: c.maps.uri } : null).filter(p => p && p.title && !seen.has(p.title.toLowerCase()) && seen.add(p.title.toLowerCase()));
            setPlaces(valid);
            if (valid.length === 0) setError("No verified matches.");
        } catch (e) { setError("Data grid unreachable."); } finally { setPlacesLoading(false); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-fade-in px-4 md:px-0">
            <div className="text-center space-y-8">
                <div className="inline-flex items-center gap-3 px-8 py-3 glass-card rounded-full text-[10px] font-black uppercase tracking-[0.5em] text-emerald-600 dark:text-emerald-400">
                    <MapPin className="w-4 h-4 fill-current" /> Geodata Sync
                </div>
                <h2 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Halal <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Finder</span>.</h2>
                <div className="flex justify-center">
                    <div className="glass-card px-6 py-3 rounded-full flex items-center gap-4 border-none shadow-xl">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        {/* Updated text color for dark mode visibility */}
                        <span className="font-black uppercase tracking-widest text-[10px] text-slate-600 dark:text-slate-300">{addressName}</span>
                    </div>
                </div>
            </div>

            <div className="glass-card p-4 rounded-[3rem] md:rounded-[4rem] flex flex-col md:flex-row gap-4 max-w-3xl mx-auto border-none shadow-2xl">
                {/* Added dark:text-white to select for dark mode visibility */}
                <select 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    className="flex-1 p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 border-none font-black uppercase tracking-tight text-lg cursor-pointer text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                    <option value="Halal Restaurants" className="dark:bg-slate-900">Fine Dining</option>
                    <option value="Halal Hotels" className="dark:bg-slate-900">Hotels</option>
                    <option value="Masjids" className="dark:bg-slate-900">Masjids</option>
                    <option value="Halal Meat Shops" className="dark:bg-slate-900">Meat Supply</option>
                </select>
                <button onClick={handlePlacesSearch} disabled={placesLoading || !location} className="px-12 py-6 bg-slate-900 dark:bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl active:scale-95 transition-all">
                    {placesLoading ? <Loader2 className="animate-spin w-6 h-6 mx-auto" /> : 'Scan Grid'}
                </button>
            </div>

            {error && (
                <div className="text-center animate-fade-in">
                    <p className="text-red-500 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </p>
                </div>
            )}

            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {places.map((place, i) => (
                    <div key={i} className="glass-card p-10 rounded-[3.5rem] border-none shadow-lg hover:scale-[1.05] transition-all group animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="flex justify-between items-start mb-10">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] flex items-center justify-center text-emerald-600 group-hover:rotate-12 transition-transform shadow-inner"><Utensils className="w-8 h-8" /></div>
                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest">Verified</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 leading-none truncate">{place.title}</h3>
                        <a href={place.uri} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 dark:bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all">
                            <Navigation className="w-4 h-4 fill-current" /> Engage Path
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HalalFinder;