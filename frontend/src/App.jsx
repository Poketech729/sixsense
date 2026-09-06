import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, LayerGroup } from 'react-leaflet';
import { ShieldAlert, MapPin, PhoneCall, Bot, Send, Navigation, AlertCircle, Info, HeartHandshake } from 'lucide-react';
import L from 'leaflet';

// Fix default leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BACKEND_URL = "http://127.0.0.1:8000";

// Map click handler component
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng, "Selected Map Point");
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
          analyzeLocation(pos.coords.latitude, pos.coords.longitude, "Your Current Location");
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
      const res = await axios.post(`${BACKEND_URL}/api/chat`, { message: userText });
      if (res.data.status === 'success') {
        setMessages(prev => [...prev, { sender: 'bot', text: res.data.response }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error connecting to emergency bot service.' }]);
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
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* CONSUMER HEADER */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/20 text-red-500 rounded-lg border border-red-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              SixSense <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Landslide Warning System</span>
            </h1>
            <p className="text-xs text-slate-400">National AI Landslide Early Warning & Consumer Safety Portal</p>
          </div>
        </div>

        {/* Quick GPS Location Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleUseMyLocation}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            Detect My GPS Location
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SIDEBAR: Emergency Helplines & Status */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/95 p-4 flex flex-col justify-between overflow-y-auto">
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

              {assessment && (
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

            {/* Live Environmental Telemetry (Auto Fetched) */}
            {telemetry && (
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-xs space-y-2">
                <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" /> Real-time Satellite Data
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Precipitation (Rain):</span>
                  <span className="font-bold">{telemetry.rainfall_mm} mm</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Soil Moisture Saturation:</span>
                  <span className="font-bold">{telemetry.soil_moisture_pct}%</span>
                </div>
              </div>
            )}

            {/* EMERGENCY HELPLINES DIRECTORY */}
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
                  <div className="text-[10px] text-slate-400">National Emergency</div>
                </a>
                <a href="tel:100" className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center border border-slate-700">
                  <div className="text-red-400 font-bold">100</div>
                  <div className="text-[10px] text-slate-400">Police Control</div>
                </a>
                <a href="tel:102" className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center border border-slate-700">
                  <div className="text-red-400 font-bold">102</div>
                  <div className="text-[10px] text-slate-400">Ambulance</div>
                </a>
              </div>
            </div>

          </div>

          <div className="text-[11px] text-slate-500 text-center border-t border-slate-800 pt-3">
            Click anywhere on the map to evaluate terrain risk.
          </div>
        </aside>

        {/* MAP PANEL */}
        <main className="flex-1 relative">
          <MapContainer center={[coords.lat, coords.lon]} zoom={11} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Click to inspect terrain listener */}
            <MapClickHandler onLocationSelect={(lat, lon, name) => analyzeLocation(lat, lon, name)} />

            {/* Selected Location Marker */}
            <Marker position={[coords.lat, coords.lon]}>
              <Popup>
                <div className="text-slate-900 font-sans text-xs">
                  <strong>{coords.name}</strong><br />
                  Risk Index: {assessment?.risk_score || "Analyzing..."}
                </div>
              </Popup>
            </Marker>

            {/* Dynamic Hazard Circle */}
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
          <div className="absolute bottom-6 right-6 z-[1000]">
            {!isChatOpen ? (
              <button
                onClick={() => setIsChatOpen(true)}
                className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold transition transform hover:scale-105"
              >
                <Bot className="w-5 h-5" />
                <span>Safety Assistant</span>
              </button>
            ) : (
              <div className="w-96 h-[450px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-xs text-white">Safety & Disaster Bot</span>
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
                  {chatLoading && <div className="text-xs text-slate-500 italic">Thinking...</div>}
                </div>

                <form onSubmit={handleChatSubmit} className="p-2.5 bg-slate-800 border-t border-slate-700 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask about evacuation, helplines..."
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

      {/* CONSUMER FOOTER */}
      <footer className="h-10 border-t border-slate-800 bg-slate-950 px-6 flex items-center justify-between text-[11px] text-slate-500 z-10">
        <div>
          © 2026 SixSense Early Warning Network • Public Disaster Safety Portal
        </div>
        <div className="flex gap-4 text-slate-400">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
          <a href="#" className="hover:underline">NDMA Data Guidelines</a>
        </div>
      </footer>

    </div>
  );
}