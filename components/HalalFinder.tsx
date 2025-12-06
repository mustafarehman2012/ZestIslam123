import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, Loader2 } from 'lucide-react';
import { findIslamicPlaces } from '../services/geminiService';

const HalalFinder: React.FC = () => {
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [places, setPlaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('Halal Restaurants');

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.error(err)
        );
    }, []);

    const handleSearch = async () => {
        if (!location) {
            alert("Please enable location services.");
            return;
        }
        setLoading(true);
        const results = await findIslamicPlaces(query, location.lat, location.lng);
        setPlaces(results);
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Halal Finder</h2>
                <p className="text-slate-500">Discover Mosques and Halal food near you using Google Maps.</p>
            </div>

            <div className="flex gap-2 mb-6">
                <select 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 p-3 rounded-xl border border-slate-200 bg-white"
                >
                    <option value="Halal Restaurants">Halal Restaurants</option>
                    <option value="Mosques">Mosques</option>
                    <option value="Islamic Centers">Islamic Centers</option>
                    <option value="Islamic Clothing Stores">Clothing Stores</option>
                </select>
                <button 
                    onClick={handleSearch}
                    disabled={loading || !location}
                    className="bg-emerald-600 text-white px-6 rounded-xl font-medium disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Find'}
                </button>
            </div>

            <div className="space-y-4">
                {places.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Search to see results nearby.</p>
                    </div>
                )}
                
                {places.map((chunk, i) => {
                    // Extract data from grounding chunk
                    const mapData = chunk.web?.uri ? chunk.web : chunk.maps; // Fallback
                    if (!mapData) return null;

                    return (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-emerald-50 shadow-sm flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{mapData.title}</h3>
                                <a href={mapData.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center mt-1">
                                    <Navigation className="w-3 h-3 mr-1" /> Open in Maps
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HalalFinder;
