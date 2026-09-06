import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import { ShieldAlert, MapPin, PhoneCall, Bot, Send, Navigation, Info, Layers, CloudRain, Flame, Globe } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Marker Icons
const selectedPinIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const BACKEND_URL = "http://127.0.0.1:8000";

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng, "Selected Target Pin");
    },
  });
  return null;
}

export default function App() {
  const [coords, setCoords] = useState({ lat: 27.33, lon: 88.61, name: "Gangtok Sector" });
  const [assessment, setAssessment] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Map Layer States
  const [activeBaseLayer, setActiveBaseLayer] = useState('esri'); // esri | osm
  const [activeOverlay, setActiveOverlay] = useState('clouds'); // clouds | precipitation | thermal | none
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Namaste. I am your SixSense Safety Assistant. Click on the map, share your GPS location, or ask me for emergency protocols.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    analyzeLocation(coords.lat, coords.lon, coords.name);
  }, []);

  const analyzeLocation = async (lat, lon, name) => {
    setLoading(true);
    setCoords({ lat, lon, name });
    try {
      const res = await axios.post(`${BACKEND_URL}/api/predict`, { lat, lon, sector_name: name });
      if (res.data.status === 'success') {
        setAssessment(res.data.assessment);
        setTelemetry(res.data.telemetry_fetched);
      }
    } catch (err) {
      console.error("Backend error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          analyzeLocation(pos.coords.latitude, pos.coords.longitude, "Your Current GPS Position");
        },
        () => alert("Unable to retrieve location. Please tap directly on the map.")
      );
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: userText,
        lat: coords.lat,
        lon: coords.lon,
        language: "English"
      });

      if (res.data && res.data.response) {
        setMessages(prev => [...prev, { sender: 'bot', text: res.data.response }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: '🚨 Error connecting to emergency service.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getRiskBadge = (severity) => {
    if (!severity) return { bg: 'bg-emerald-500', text: 'SAFE' };
    if (severity.includes('RED')) return { bg: 'bg-red-600', text: 'CRITICAL ALERT' };
    if (severity.includes('ORANGE')) return { bg: 'bg-orange-500', text: 'MODERATE RISK' };
    return { bg: 'bg-emerald-600', text: 'SAFE' };
  };

  return (
    <div className="relative flex flex-col h-[100dvh] w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* 1. INITIAL ANIMATED SPLASH OVERLAY */}
      {showSplash && (
        <div className="absolute inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center animate-fadeOut">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-32 h-32 bg-red-600/30 rounded-full animate-ping"></div>
            <div className="p-5 bg-red-600/20 border border-red-500/50 rounded-2xl shadow-2xl backdrop-blur-xl">
              <ShieldAlert className="w-12 h-12 text-red-500 animate-bounce" />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight text-center px-4">
            Help is One Click Away
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-2 tracking-wide font-medium">
            Initializing SixSense AI Landslide & Hazard Network...
          </p>
        </div>
      )}

      {/* 2. HEADER */}
      <header className="h-14 md:h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-red-600/20 text-red-500 rounded-lg border border-red-500/30">
            <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              SixSense <span className="hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">MOSDAC / ISRO Telemetry</span>
            </h1>
            <p className="text-[9px] md:text-xs text-slate-400">National Early Warning Hazard Portal</p>
          </div>
        </div>

        <button
          onClick={handleUseMyLocation}
          className="px-3 py-1.5 md:px-4 md:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-red-600/20 transition shrink-0 active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Detect My Location</span>
          <span className="sm:hidden">GPS</span>
        </button>
      </header>

      {/* 3. MAIN DASHBOARD AREA */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* SIDE PANEL (Mobile Collapsible Layout) */}
        <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-900/95 p-3 md:p-4 flex flex-col justify-between overflow-y-auto max-h-[30dvh] md:max-h-full shrink-0 z-10">
          <div className="space-y-3">
            
            {/* Status Card */}
            <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/80 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Inspected Point</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${getRiskBadge(assessment?.severity).bg}`}>
                  {getRiskBadge(assessment?.severity).text}
                </span>
              </div>
              <h2 className="text-xs md:text-sm font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" /> {coords.name}
              </h2>
              <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">
                Lat: {coords.lat.toFixed(4)}° | Lon: {coords.lon.toFixed(4)}°
              </p>

              {loading ? (
                <div className="text-xs text-amber-400 mt-3 animate-pulse">Fetching state radar & telemetry...</div>
              ) : assessment && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-800/80">
                  <div className="text-xl font-black text-white">
                    {assessment.risk_score} <span className="text-xs font-normal text-slate-400">/ 100 Risk Score</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    {assessment.recommended_action}
                  </p>
                </div>
              )}
            </div>

            {/* Environmental Telemetry */}
            {telemetry && (
              <div className="p-3 rounded-2xl border border-slate-800 bg-slate-950/40 text-[11px] space-y-1.5">
                <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" /> ISRO & AccuWeather Feed
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Precipitation:</span>
                  <span className="font-bold text-white">{telemetry.rainfall_mm} mm</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Soil Saturation:</span>
                  <span className="font-bold text-white">{telemetry.soil_moisture_pct}%</span>
                </div>
              </div>
            )}

            {/* Helplines Directory */}
            <div className="p-3 rounded-2xl border border-red-500/20 bg-red-950/10 space-y-2">
              <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" /> Emergency Control
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a href="tel:1078" className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-center border border-slate-700/60 transition">
                  <div className="text-red-400 font-bold text-xs">1078</div>
                  <div className="text-[9px] text-slate-400">NDMA Helpline</div>
                </a>
                <a href="tel:112" className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-center border border-slate-700/60 transition">
                  <div className="text-red-400 font-bold text-xs">112</div>
                  <div className="text-[9px] text-slate-400">Emergency Response</div>
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* MAP PANEL */}
        <main className="flex-1 relative h-full w-full">
          
          {/* CUSTOM STYLISH OVERLAY CONTROL PANEL */}
          <div className="absolute top-4 right-4 z-[1000]">
            <button
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold transition"
            >
              <Layers className="w-4 h-4 text-red-400" />
              <span>Map Layers</span>
            </button>

            {isLayerMenuOpen && (
              <div className="mt-2 w-56 p-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl text-xs space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Base Map
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setActiveBaseLayer('esri')}
                      className={`p-1.5 rounded-lg border text-center transition ${activeBaseLayer === 'esri' ? 'bg-red-600 border-red-500 text-white font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}
                    >
                      Satellite
                    </button>
                    <button
                      onClick={() => setActiveBaseLayer('osm')}
                      className={`p-1.5 rounded-lg border text-center transition ${activeBaseLayer === 'osm' ? 'bg-red-600 border-red-500 text-white font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}
                    >
                      Terrain
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                    <CloudRain className="w-3 h-3" /> Live Weather Radar
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveOverlay('clouds')}
                      className={`w-full p-1.5 rounded-lg border text-left flex items-center justify-between transition ${activeOverlay === 'clouds' ? 'bg-slate-800 border-red-500 text-red-400 font-bold' : 'bg-slate-800/40 border-slate-700 text-slate-300'}`}
                    >
                      <span>Cloud Cover</span>
                      <CloudRain className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveOverlay('precipitation')}
                      className={`w-full p-1.5 rounded-lg border text-left flex items-center justify-between transition ${activeOverlay === 'precipitation' ? 'bg-slate-800 border-red-500 text-red-400 font-bold' : 'bg-slate-800/40 border-slate-700 text-slate-300'}`}
                    >
                      <span>Live Rain Radar</span>
                      <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => setActiveOverlay('thermal')}
                      className={`w-full p-1.5 rounded-lg border text-left flex items-center justify-between transition ${activeOverlay === 'thermal' ? 'bg-slate-800 border-red-500 text-red-400 font-bold' : 'bg-slate-800/40 border-slate-700 text-slate-300'}`}
                    >
                      <span>Thermal / Hotspots</span>
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <button
                      onClick={() => setActiveOverlay('none')}
                      className={`w-full p-1.5 rounded-lg border text-left transition ${activeOverlay === 'none' ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-slate-800/20 border-slate-700 text-slate-400'}`}
                    >
                      None
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <MapContainer center={[coords.lat, coords.lon]} zoom={10} className="h-full w-full">
            {/* BASE MAP TILE LAYERS */}
            {activeBaseLayer === 'esri' ? (
              <TileLayer
                attribution="Tiles &copy; Esri World Imagery"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}

            {/* LIVE OVERLAYS */}
            {activeOverlay === 'clouds' && (
              <TileLayer
                url="https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=93e9447e148283a8cf5766299b6623bc"
                opacity={0.65}
              />
            )}
            {activeOverlay === 'precipitation' && (
              <TileLayer
                url="https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=93e9447e148283a8cf5766299b6623bc"
                opacity={0.7}
              />
            )}
            {activeOverlay === 'thermal' && (
              <TileLayer
                url="https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=93e9447e148283a8cf5766299b6623bc"
                opacity={0.55}
              />
            )}

            <MapClickHandler onLocationSelect={(lat, lon, name) => analyzeLocation(lat, lon, name)} />

            {/* SELECTED LOCATION PIN */}
            <Marker position={[coords.lat, coords.lon]} icon={selectedPinIcon}>
              <Popup>
                <div className="text-slate-900 font-sans text-xs">
                  <strong>{coords.name}</strong><br />
                  Lat: {coords.lat.toFixed(4)}, Lon: {coords.lon.toFixed(4)}<br />
                  Risk Score: {assessment?.risk_score ?? "Analyzing..."}
                </div>
              </Popup>
            </Marker>

            {/* HAZARD RADIUS */}
            {assessment && (
              <Circle
                center={[coords.lat, coords.lon]}
                radius={3500}
                pathOptions={{
                  color: assessment.risk_score > 70 ? '#ef4444' : assessment.risk_score > 40 ? '#f97316' : '#10b981',
                  fillColor: assessment.risk_score > 70 ? '#ef4444' : assessment.risk_score > 40 ? '#f97316' : '#10b981',
                  fillOpacity: 0.35
                }}
              />
            )}
          </MapContainer>

          {/* CHATBOT FLOATING CONTAINER */}
          <div className="absolute bottom-12 right-4 md:right-6 z-[1000]">
            {!isChatOpen ? (
              <button
                onClick={() => setIsChatOpen(true)}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold transition transform hover:scale-105 active:scale-95"
              >
                <Bot className="w-5 h-5" />
                <span className="hidden sm:inline">Safety Assistant</span>
              </button>
            ) : (
              <div className="w-[88vw] sm:w-96 h-[380px] sm:h-[450px] bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
                <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-xs text-white">Safety & Emergency Assistant</span>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="text-slate-400 text-xs px-2 py-0.5 rounded-lg bg-slate-700/80">
                    Close
                  </button>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] text-xs p-3 rounded-2xl whitespace-pre-line leading-relaxed ${
                        msg.sender === 'user' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700/60'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div className="text-xs text-slate-500 italic">Processing request...</div>}
                </div>

                <form onSubmit={handleChatSubmit} className="p-2.5 bg-slate-800/80 border-t border-slate-700 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask about evacuation, safe zones..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 4. EMERGENCY TICKER */}
      <footer className="h-9 border-t border-slate-800/80 bg-slate-950 flex items-center z-20 overflow-hidden shrink-0">
        <div className="bg-red-600 text-white text-[10px] font-extrabold px-3 py-1 uppercase tracking-wider shrink-0 z-10 flex items-center h-full shadow-lg">
          LIVE HAZARD ALERTS
        </div>
        <div className="overflow-hidden whitespace-nowrap w-full relative">
          <div className="inline-block animate-ticker text-xs text-red-400 font-medium pl-4">
            🚨 IMD Warning: Heavy Rainfall predicted across Sikkim & Northern Uttarakhand. • Landslide risk flagged along NH-10. • NDMA Helpline active: 1078. • Flash flood advisory issued for high-slope Himalayan zones.
          </div>
        </div>
      </footer>

    </div>
  );
}
