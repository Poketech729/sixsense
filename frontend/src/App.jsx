import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, LayersControl } from 'react-leaflet';
import { ShieldAlert, MapPin, PhoneCall, Bot, Send, Navigation, Info } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BACKEND_URL = "http://127.0.0.1:8000";

// Map click listener hook component
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng, "Selected Map Location");
    },
  });
  return null;
}

export default function App() {
  const [coords, setCoords] = useState({ lat: 27.33, lon: 88.61, name: "Gangtok Sector" });
  const [assessment, setAssessment] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(false);

  // Floating Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Namaste. I am your SixSense Safety Assistant. Click on the map, share your GPS location, or ask me for emergency protocols.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Initial Assessment
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
      console.error("Backend connection error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          analyzeLocation(pos.coords.latitude, pos.coords.longitude, "Your GPS Location");
        },
        () => alert("Unable to retrieve location. Please click on the map directly.")
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
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ Unable to parse bot response.' }]);
      }
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { sender: 'bot', text: '🚨 Error connecting to emergency bot service.' }]);
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

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/20 text-red-500 rounded-lg border border-red-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              SixSense <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Landslide Warning System</span>
            </h1>
            <p className="text-[10px] md:text-xs text-slate-400">National AI Landslide Early Warning & Consumer Safety Portal</p>
          </div>
        </div>

        <button
          onClick={handleUseMyLocation}
          className="px-3 py-1.5 md:px-4 md:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg transition shrink-0"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Detect My GPS Location</span>
          <span className="sm:hidden">GPS</span>
        </button>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* SIDEBAR */}
        <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/95 p-4 flex flex-col justify-between overflow-y-auto max-h-[35vh] md:max-h-full shrink-0">
          <div className="space-y-4">
            
            {/* Status Card */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Selected Zone</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${getRiskBadge(assessment?.severity).bg}`}>
                  {getRiskBadge(assessment?.severity).text}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-400" /> {coords.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Lat: {coords.lat.toFixed(3)}° | Lon: {coords.lon.toFixed(3)}°
              </p>

              {loading ? (
                <div className="text-xs text-amber-400 mt-3 animate-pulse">Analyzing satellite & weather data...</div>
              ) : assessment && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="text-2xl font-black text-white">
                    {assessment.risk_score} <span className="text-xs font-normal text-slate-400">/ 100 Risk Score</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800">
                    {assessment.recommended_action}
                  </p>
                </div>
              )}
            </div>

            {/* Live Environmental Telemetry */}
            {telemetry && (
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-xs space-y-2">
                <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" /> Real-time Telemetry
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Precipitation (Rain):</span>
                  <span className="font-bold">{telemetry.rainfall_mm} mm</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Soil Saturation:</span>
                  <span className="font-bold">{telemetry.soil_moisture_pct}%</span>
                </div>
              </div>
            )}

            {/* Emergency Helplines */}
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10 space-y-2">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" /> Emergency Helplines
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <a href="tel:1078" className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center border border-slate-700">
                  <div className="text-red-400 font-bold">1078</div>
                  <div className="text-[10px] text-slate-400">NDMA Helpline</div>
                </a>
                <a href="tel:112" className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center border border-slate-700">
                  <div className="text-red-400 font-bold">112</div>
                  <div className="text-[10px] text-slate-400">Emergency</div>
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* MAP CONTAINER */}
        <main className="flex-1 relative h-full">
          <MapContainer center={[coords.lat, coords.lon]} zoom={10} className="h-full w-full">
            <LayersControl position="topright">
              {/* Layer 1: Standard Street Map */}
              <LayersControl.BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>

              {/* Layer 2: ESRI Satellite View */}
              <LayersControl.BaseLayer name="Satellite View">
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>

              {/* Thermal / Cloud Overlay */}
              <LayersControl.Overlay name="NASA Thermal Infrared">
                <TileLayer
                  attribution="NASA GIBS"
                  url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/${todayStr}/250m/{z}/{y}/{x}.png`}
                  opacity={0.5}
                />
              </LayersControl.Overlay>
            </LayersControl>

            <MapClickHandler onLocationSelect={(lat, lon, name) => analyzeLocation(lat, lon, name)} />

            {/* Selected Location Pin */}
            <Marker position={[coords.lat, coords.lon]}>
              <Popup>
                <div className="text-slate-900 font-sans text-xs">
                  <strong>{coords.name}</strong><br />
                  Risk Score: {assessment?.risk_score ?? "Evaluating..."}
                </div>
              </Popup>
            </Marker>

            {/* Hazard Radius Circle */}
            {assessment && (
              <Circle
                center={[coords.lat, coords.lon]}
                radius={3000}
                pathOptions={{
                  color: assessment.risk_score > 70 ? '#ef4444' : assessment.risk_score > 40 ? '#f97316' : '#10b981',
                  fillColor: assessment.risk_score > 70 ? '#ef4444' : assessment.risk_score > 40 ? '#f97316' : '#10b981',
                  fillOpacity: 0.3
                }}
              />
            )}
          </MapContainer>

          {/* FLOATING SAFETY CHATBOT */}
          <div className="absolute bottom-12 right-4 md:right-6 z-[1000]">
            {!isChatOpen ? (
              <button
                onClick={() => setIsChatOpen(true)}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold transition transform hover:scale-105"
              >
                <Bot className="w-5 h-5" />
                <span className="hidden sm:inline">Safety Assistant</span>
              </button>
            ) : (
              <div className="w-[88vw] sm:w-96 h-[380px] sm:h-[450px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-xs text-white">Safety & Emergency Assistant</span>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="text-slate-400 text-xs px-2 py-0.5 rounded bg-slate-700">
                    Close
                  </button>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] text-xs p-3 rounded-xl whitespace-pre-line leading-relaxed ${
                        msg.sender === 'user' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div className="text-xs text-slate-500 italic">Evaluating risk protocols...</div>}
                </div>

                <form onSubmit={handleChatSubmit} className="p-2.5 bg-slate-800 border-t border-slate-700 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask about evacuation, safe zones..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* EMERGENCY DISASTER NEWS TICKER */}
      <footer className="h-9 border-t border-slate-800 bg-slate-950 flex items-center z-20 overflow-hidden shrink-0">
        <div className="bg-red-600 text-white text-[10px] font-extrabold px-3 py-1 uppercase tracking-wider shrink-0 z-10 flex items-center h-full">
          LIVE HAZARD ALERTS
        </div>
        <div className="overflow-hidden whitespace-nowrap w-full relative">
          <div className="inline-block animate-[ticker_30s_linear_infinite] text-xs text-red-400 font-medium pl-4">
            🚨 IMD Warning: Moderate to Heavy Rainfall predicted across Sikkim & Northern Uttarakhand. • Landslide risk flagged along NH-10. • NDMA Helpline active: 1078. • Flash flood advisory issued for high-slope Himalayan zones.
          </div>
        </div>
      </footer>

    </div>
  );
}
