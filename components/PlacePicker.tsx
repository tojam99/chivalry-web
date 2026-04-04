'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X, Loader2, Search } from 'lucide-react';

interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (place: PlaceResult) => void;
  title?: string;
  placeholder?: string;
  cityOnly?: boolean; // If true, restrict to cities only
}

export default function PlacePicker({ open, onClose, onSelect, title = 'Search Location', placeholder = 'Search for a place...', cityOnly = false }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const sessionToken = useRef<any>(null);

  // Load Google Maps script
  useEffect(() => {
    if (!open) return;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
    if (!apiKey) { console.error('Missing NEXT_PUBLIC_GOOGLE_PLACES_KEY'); return; }

    if (window.google?.maps?.places) {
      initServices();
      return;
    }

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', initServices);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = initServices;
    document.head.appendChild(script);
  }, [open]);

  function initServices() {
    if (!window.google?.maps?.places) return;
    autocompleteService.current = new window.google.maps.places.AutocompleteService();
    const div = document.createElement('div');
    placesService.current = new window.google.maps.places.PlacesService(div);
    sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  // Search on query change
  useEffect(() => {
    if (!query.trim() || !autocompleteService.current) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const request: any = {
        input: query,
        sessionToken: sessionToken.current,
      };
      if (cityOnly) {
        request.types = ['(cities)'];
      } else {
        request.types = ['establishment', 'geocode'];
      }

      autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: string) => {
        setLoading(false);
        if (status !== 'OK' || !predictions) { setResults([]); return; }
        setResults(predictions.map((p: any) => ({
          name: p.structured_formatting?.main_text || p.description,
          address: p.description,
          lat: 0,
          lng: 0,
          placeId: p.place_id,
        })));
      });
    }, 300);
  }, [query, cityOnly]);

  function handleSelect(place: PlaceResult) {
    if (!placesService.current) { onSelect(place); onClose(); return; }

    placesService.current.getDetails(
      { placeId: place.placeId, fields: ['geometry', 'formatted_address', 'name'], sessionToken: sessionToken.current },
      (result: any, status: string) => {
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
        if (status === 'OK' && result) {
          onSelect({
            name: result.name || place.name,
            address: result.formatted_address || place.address,
            lat: result.geometry?.location?.lat() || 0,
            lng: result.geometry?.location?.lng() || 0,
            placeId: place.placeId,
          });
        } else {
          onSelect(place);
        }
        setQuery('');
        setResults([]);
        onClose();
      }
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-cream-50 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200 shrink-0">
          <h3 className="font-bold text-lg text-sage-800">{title}</h3>
          <button onClick={() => { setQuery(''); setResults([]); onClose(); }} className="text-cream-600 hover:text-sage-800"><X className="w-5 h-5" /></button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-600" />
            <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-cream-300 rounded-xl text-sm text-sage-800 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400 animate-spin" />}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-2 pb-6">
          {results.length === 0 && query.trim() && !loading && (
            <p className="text-sm text-cream-600 text-center py-8">No results found</p>
          )}
          {results.length === 0 && !query.trim() && (
            <p className="text-sm text-cream-500 text-center py-8">Start typing to search...</p>
          )}
          {results.map((place) => (
            <button key={place.placeId} onClick={() => handleSelect(place)}
              className="w-full flex items-start gap-3 px-3 py-3 hover:bg-cream-100 rounded-xl transition-colors text-left">
              <MapPin className="w-4 h-4 text-sage-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-sage-800 truncate">{place.name}</p>
                <p className="text-xs text-cream-600 truncate">{place.address}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Declare google maps types
declare global {
  interface Window {
    google: any;
  }
}
