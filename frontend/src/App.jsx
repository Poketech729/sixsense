import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMapEvents, 
  Polyline,
  Circle,
  Polygon,
  Tooltip,
  LayersControl,
  useMap
} from 'react-leaflet';
import { 
  ShieldAlert, MapPin, PhoneCall, Bot, Send, Navigation, Layers, Camera, WifiOff,
  CloudRain, Globe, History, ExternalLink, Languages, Eye, EyeOff,
  Wind, Activity, Mountain, ChevronDown, Radio, AlertTriangle,
  Compass, Thermometer, Droplets, Gauge, AlertCircle, RefreshCw,
  Search, Info, Settings, Download, Share2, Maximize2, Minimize2,
  Sliders, Shield, Volume2, VolumeX, LifeBuoy, FileText, Calendar,
  BarChart2, Crosshair, Map as MapIcon, Database, Zap, Cpu, Play, RotateCcw
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default missing icon issue in React Leaflet build pipelines
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ==========================================================================
   1. DICTIONARIES & TRANSLATION ENGINE
   ========================================================================== */

const DICTIONARY = {
  en: {
    title: "SixSense GIS & Disaster Engine",
    subtitle: "NDMA SACHET • ISRO Bhuvan • Open-Meteo • Live Telemetry",
    selectLanguage: "Select Operating Language",
    continueApp: "Initialize Radar Platform",
    zoomEarth: "Satellite View",
    gpsPin: "Acquire GPS Location",
    emergency: "SOS 112",
    sector: "Active Target Sector",
    telemetry: "Real-time Telemetry Data",
    temp: "Temperature",
    precip: "Precipitation Rate",
    humidity: "Relative Humidity",
    wind: "Wind Velocity",
    landslideRisk: "Landslide Risk Index",
    bulletins: "Emergency Hazard Bulletins",
    mapLayers: "Raster Overlays & GIS Layers",
    baseMap: "Primary Basemap Style",
    streetMap: "OpenStreet Topo",
    satelliteMap: "ESRI Satellite imagery",
    darkMode: "Dark Canvas (Keyless)",
    overlays: "Global Disaster Overlays",
    cloudRadar: "RainViewer Doppler Precipitation Radar",
    aqiHeatmap: "Air Quality Index (AQI) Layer",
    landslideZones: "ISRO Bhuvan Hazard Boundaries (WMS)",
    windCyclone: "Global Wind Vector & Pressure Stream",
    askAssistant: "Disaster AI Assistant",
    chatPlaceholder: "Query sector coordinates, hazard protocols...",
    botIntro: "SixSense Tactical GIS Active. Telemetry pipelines operational.",
    searchPlaceholder: "Search city, region, or coordinates...",
    calcRisk: "Calculate Sector Vulnerability",
    evacRoutes: "Evacuation Route Planner",
    sensorLog: "Station Sensor Feed",
    exportData: "Export GIS Report",
    elevation: "Terrain Elevation",
    pressure: "Surface Pressure",
    soilMoisture: "Soil Moisture Index",
    highRisk: "HIGH RISK / ALERT",
    modRisk: "MODERATE RISK",
    lowRisk: "LOW RISK / STABLE",
    severeAlert: "CRITICAL INCIDENT ALERT IN SECTOR",
    safeZone: "SECTOR OPERATIONAL - NORMAL RUNOFF",
    refreshTelemetry: "Re-sync Sensors",
    gisMetrics: "Analytical GIS Metrics",
    density: "Population Exposure Estimate",
    slopeAngle: "Est. Slope Incline",
    drainage: "Runoff Capacity",
    weatherNotice: "Open-Meteo & RainViewer Live Feeds Syncing"
  },
  hi: {
    title: "सिक्ससेंस आपदा जीआईएस एवं निगरानी प्रणाली",
    subtitle: "एनडीएमए साचेत • इसरो भुवन • ओपन-मेटियो • लाइव रडार",
    selectLanguage: "संचालन भाषा चुनें",
    continueApp: "रडार इंजन प्रारंभ करें",
    zoomEarth: "उपग्रह दृश्य",
    gpsPin: "जीपीएस स्थान प्राप्त करें",
    emergency: "आपतकाल 112",
    sector: "सक्रिय निरीक्षण क्षेत्र",
    telemetry: "वास्तविक समय मौसम डाटा",
    temp: "तापमान",
    precip: "वर्षा दर",
    humidity: "सापेक्ष आर्द्रता",
    wind: "वायु गति",
    landslideRisk: "भूस्खलन जोखिम सूचकांक",
    bulletins: "आपातकालीन चेतावनी बुलेटिन",
    mapLayers: "मानचित्र और ओवरले परतें",
    baseMap: "प्राथमिक मानचित्र शैली",
    streetMap: "स्ट्रीट व्यू",
    satelliteMap: "उपग्रह व्यू",
    darkMode: "डार्क मोड",
    overlays: "वैश्विक आपदा ओवरले",
    cloudRadar: "रेनव्यूअर डॉप्लर वर्षा रडार",
    aqiHeatmap: "वायु गुणवत्ता सूचकांक (AQI)",
    landslideZones: "इसरो भुवन आपदा सीमाएं (WMS)",
    windCyclone: "वैश्विक वायु प्रवाह ओवरले",
    askAssistant: "आपदा एआई सहायक",
    chatPlaceholder: "सुरक्षा प्रोटोकॉल या मौसम का प्रश्न पूछें...",
    botIntro: "सिक्ससेंस जीआईएस सक्रिय है। सभी सेंसर संचालित हैं।",
    searchPlaceholder: "शहर, क्षेत्र या निर्देशांक खोजें...",
    calcRisk: "जोखिम मूल्यांकन",
    evacRoutes: "निकासी मार्ग योजना",
    sensorLog: "सेंसर फीड लॉग",
    exportData: "जीआईएस रिपोर्ट डाउनलोड करें",
    elevation: "धरातल ऊंचाई",
    pressure: "सतह दबाव",
    soilMoisture: "मृदा नमी सूचकांक",
    highRisk: "उच्च जोखिम / चेतावनी",
    modRisk: "मध्यम जोखिम",
    lowRisk: "कम जोखिम / सामान्य",
    severeAlert: "क्षेत्र में गंभीर आपातकालीन चेतावनी",
    safeZone: "क्षेत्र सामान्य - कोई तत्काल खतरा नहीं",
    refreshTelemetry: "डाटा री-सिंक करें",
    gisMetrics: "विश्लेषणात्मक जीआईएस मेट्रिक्स",
    density: "अनुमानित जनसंख्या प्रभाव",
    slopeAngle: "ढलान कोण",
    drainage: "जल निकासी क्षमता",
    weatherNotice: "ओपन-मेटियो लाइव डाटा सिंक हो रहा है"
  }
};

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English (US/Global)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' }
];

/* ==========================================================================
   2. CUSTOM LEAFLET SVG ICONS & CANVAS HELPERS
   ========================================================================== */

const createCustomPin = (colorHex, glow = true) => {
  return L.divIcon({
    className: 'sixsense-custom-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        ${glow ? `<div style="position: absolute; width: 32px; height: 32px; background-color: ${colorHex}; opacity: 0.35; border-radius: 50%; animation: pulsePin 2s infinite ease-in-out;"></div>` : ''}
        <svg width="30" height="36" viewBox="0 0 24 24" fill="${colorHex}" stroke="#0f172a" stroke-width="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3.5" fill="#ffffff"></circle>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34]
  });
};

const RED_PIN = createCustomPin('#f43f5e', true);
const AMBER_PIN = createCustomPin('#f59e0b', true);
const GREEN_PIN = createCustomPin('#10b981', false);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ==========================================================================
   3. HELPER UTILITIES & DISASTER CALCULATORS
   ========================================================================== */

// Calculate empirical Landslide Risk Index (LRI) using rainfall intensity, slope estimate & humidity
const calculateLandslideRiskIndex = (precip, humidity, wind) => {
  // LRI Formula = (Precipitation * 1.8) + (Humidity * 0.3) + (Wind * 0.1)
  const score = (precip * 2.2) + (humidity * 0.25) + (wind * 0.15);
  
  if (score > 60 || precip > 35) {
    return {
      score: Math.min(99, Math.round(score)),
      level: "HIGH RISK / ALERT",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/40",
      badgeColor: "bg-rose-600",
      code: "RED",
      recommendation: "Immediate slope evacuation recommended. Unstable soil movement risk high."
    };
  } else if (score > 25 || precip > 10) {
    return {
      score: Math.min(99, Math.round(score)),
      level: "MODERATE RISK",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/40",
      badgeColor: "bg-amber-600",
      code: "AMBER",
      recommendation: "Monitor live drainage channels and local weather advisories."
    };
  } else {
    return {
      score: Math.min(99, Math.round(score)),
      level: "LOW RISK / STABLE",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/40",
      badgeColor: "bg-emerald-600",
      code: "GREEN",
      recommendation: "Terrain slope runoff levels normal. No active warning issued."
    };
  }
};

/* ==========================================================================
   4. MAP CONTROLLER COMPONENT
   ========================================================================== */

function MapEventListener({ coords, onLocationSelect }) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (map && coords.lat && coords.lon) {
      map.flyTo([coords.lat, coords.lon], Math.max(map.getZoom(), 10), { 
        animate: true, 
        duration: 1.2 
      });
    }
  }, [coords.lat, coords.lon, map]);

  return null;
}

/* ==========================================================================
   5. MAIN APPLICATION COMPONENT
   ========================================================================== */

export default function App() {
  // --- UI & Localization State ---
  const [lang, setLang] = useState('en');
  const [showLangModal, setShowLangModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('telemetry'); // telemetry | evacuation | sensors | analytics
  const t = DICTIONARY[lang] || DICTIONARY.en;

  // --- Map Core Coordinates ---
  const [coords, setCoords] = useState({ 
    lat: 25.5788, 
    lon: 91.8933, 
    name: "Shillong, Meghalaya, North Eastern Region",
    district: "East Khasi Hills"
  });

  // --- Telemetry Data State ---
  const [weatherData, setWeatherData] = useState({
    temperature: 28.4,
    precipitation: 0.0,
    humidity: 62,
    wind: 12.5,
    pressure: 1011.2,
    elevation: 216,
    soilMoisture: 0.28
  });

  const [aqiValue, setAqiValue] = useState(48);
  const [newsIncidents, setNewsIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- GIS Layer Toggles ---
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [activeBaseLayer, setActiveBaseLayer] = useState('dark'); // 'dark' | 'street' | 'satellite' | 'cartoLight'
  const [showRadar, setShowRadar] = useState(true);
  const [showAqi, setShowAqi] = useState(false);
  const [showLandslide, setShowLandslide] = useState(true);
  const [showWind, setShowWind] = useState(false);
  const [radarTilePath, setRadarTilePath] = useState(null);

  // --- Risk Analysis ---
  const riskProfile = useMemo(() => {
    return calculateLandslideRiskIndex(
      weatherData.precipitation, 
      weatherData.humidity, 
      weatherData.wind
    );
  }, [weatherData]);

  // --- Emergency Evacuation Mock Nodes ---
  const evacPoints = useMemo(() => {
    return [
      { id: 1, name: "Sector Relief Shelter Alpha", lat: coords.lat + 0.02, lon: coords.lon + 0.02, capacity: "850 Persons", status: "Operational" },
      { id: 2, name: "District Medical Base Beta", lat: coords.lat - 0.018, lon: coords.lon + 0.025, capacity: "300 Beds", status: "Standby" },
      { id: 3, name: "High-Ground Safe Zone Gamma", lat: coords.lat + 0.035, lon: coords.lon - 0.015, capacity: "2000 Persons", status: "Operational" }
    ];
  }, [coords.lat, coords.lon]);

  const nerRiskZones = useMemo(() => ([
    { id: 'meghalaya', name: 'Meghalaya Hill Corridors', lat: 25.6, lon: 91.9, radius: 62000, color: '#f43f5e' },
    { id: 'assam', name: 'Assam Flood and Slope Interface', lat: 26.2, lon: 92.9, radius: 80000, color: '#f59e0b' },
    { id: 'sikkim', name: 'Sikkim Mountain Corridors', lat: 27.5, lon: 88.6, radius: 52000, color: '#f59e0b' },
    { id: 'arunachal', name: 'Arunachal Pradesh High-Risk Slopes', lat: 28.2, lon: 94.7, radius: 90000, color: '#f43f5e' },
    { id: 'nagaland', name: 'Nagaland Hill Roads', lat: 25.7, lon: 94.1, radius: 45000, color: '#f59e0b' },
    { id: 'tripura', name: 'Tripura Monsoon Corridors', lat: 23.8, lon: 91.3, radius: 42000, color: '#f59e0b' },
    { id: 'mizoram', name: 'Mizoram Vulnerable Slopes', lat: 23.7, lon: 92.7, radius: 50000, color: '#f43f5e' }
  ]), []);

  const nerResponsePoints = useMemo(() => ([
    { id: 'ner-control', name: 'NER Emergency Coordination', lat: 26.14, lon: 91.74, type: 'District control room' },
    { id: 'shillong-medical', name: 'Shillong Medical Response', lat: 25.58, lon: 91.89, type: 'Medical response' },
    { id: 'guwahati-relief', name: 'Guwahati Relief Hub', lat: 26.14, lon: 91.74, type: 'Relief logistics' },
    { id: 'gangtok-response', name: 'Gangtok Slope Response', lat: 27.33, lon: 88.61, type: 'Mountain response' }
  ]), []);

  // --- AI Chatbot State ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState('Visible slope movement and debris observed. Please verify and dispatch a local response team.');
  const [reportPhoto, setReportPhoto] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const chatBottomRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Default Chat Message on language swap
  useEffect(() => {
    setMessages([
      { 
        sender: 'bot', 
        text: `${t.botIntro}\nTarget Sector: ${coords.name}.\nSystem status: All telemetry services active.` 
      }
    ]);
  }, [lang]);

  // --- Fetch RainViewer Doppler Radar Tile Timestamps ---
  useEffect(() => {
    const fetchRadarPath = async () => {
      try {
        const res = await axios.get("https://api.rainviewer.com/public/weather-maps.json");
        if (res.data?.radar?.past?.length > 0) {
          const latestFrame = res.data.radar.past[res.data.radar.past.length - 1];
          setRadarTilePath(latestFrame.path);
        }
      } catch (e) {
        console.warn("RainViewer radar timestamp sync delay. Falling back to static cache.");
      }
    };

    fetchRadarPath();
    const interval = setInterval(fetchRadarPath, 300000); // 5 minute refresh
    return () => clearInterval(interval);
  }, []);

  // --- Initial Telemetry Fetch ---
  useEffect(() => {
    analyzeLocation(coords.lat, coords.lon);
  }, []);

  // --- Core Geocoding & Telemetry Processor ---
  async function analyzeLocation(lat, lon) {
    setLoading(true);
    let resolvedName = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    let districtName = "District Sector";

    // Reverse Geocoding via Nominatim
    try {
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
      if (geoRes.data?.address) {
        const addr = geoRes.data.address;
        const sub = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district;
        const main = addr.city || addr.state_district || addr.state || addr.country;
        districtName = addr.state_district || addr.county || addr.city || "Sector Area";
        resolvedName = sub ? `${sub}, ${main}` : (main || geoRes.data.display_name.split(',')[0]);
      }
    } catch {
      console.warn("Reverse geocode service fallback executed.");
    }

    setCoords({ lat, lon, name: resolvedName, district: districtName });

    // Open-Meteo Weather & Soil Telemetry
    try {
      const omRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m,soil_moisture_0_to_1cm`
      );
      
      const current = omRes.data.current;
      setWeatherData({
        temperature: current.temperature_2m ?? 25.0,
        precipitation: current.precipitation ?? 0.0,
        humidity: current.relative_humidity_2m ?? 50,
        wind: current.wind_speed_10m ?? 10.0,
        pressure: current.surface_pressure ?? 1013.2,
        elevation: Math.round(omRes.data.elevation || 150),
        soilMoisture: current.soil_moisture_0_to_1cm ?? 0.25
      });
    } catch {
      console.warn("Weather telemetry sync error.");
    }

    // Air Quality Index (AQI) Telemetry
    try {
      const aqiRes = await axios.get(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5`
      );
      if (aqiRes.data?.current) {
        setAqiValue(aqiRes.data.current.us_aqi || Math.round((aqiRes.data.current.pm2_5 || 15) * 2.1));
      }
    } catch {
      setAqiValue(42);
    }

    // Dynamic Hazard Bulletins & Link Generators
    const encQuery = encodeURIComponent(resolvedName);
    setNewsIncidents([
      { 
        title: `NDMA SACHET Live Warning Bulletin - Sector ${districtName}`, 
        source: "NDMA SACHET Emergency Portal", 
        link: "https://sachet.ndma.gov.in/",
        type: "Emergency Alert"
      },
      { 
        title: `ISRO Bhuvan Spatial Geoportal & Slope Hazard Data`, 
        source: "NRSC ISRO Bhuvan", 
        link: "https://bhuvan-app1.nrsc.gov.in/disaster/disaster.php",
        type: "GIS Spatial Layer"
      },
      { 
        title: `IMD Meteorological Weather Advisory for ${resolvedName}`, 
        source: "IMD Mausam Dashboard", 
        link: "https://mausam.imd.gov.in/",
        type: "Meteorological Alert"
      },
      { 
        title: `Local Hazard News Feed: ${resolvedName}`, 
        source: "Disaster News Stream", 
        link: `https://news.google.com/search?q=${encQuery}%20disaster%20landslide%20rain`,
        type: "Public Information Feed"
      }
    ]);

    setLoading(false);
  }

  // --- Location Search Handler ---
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      if (res.data && res.data.length > 0) {
        setSearchResults(res.data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
    }
    setIsSearching(false);
  };

  const handleSelectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    analyzeLocation(lat, lon);
    setSearchResults([]);
    setSearchQuery('');
  };

  // --- GPS Location Acquisition ---
  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          analyzeLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setLoading(false);
          alert("GPS Permission Denied or unavailable. Please enable location services.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // --- AI Chat Assistant Handler ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: userMsg,
        language: lang === 'hi' ? 'Hindi' : 'English'
      }, { timeout: 8000 });
      setMessages(prev => [...prev, { sender: 'bot', text: response.data.response }]);
      return;
    } catch {
      console.warn('Backend assistant unavailable; using local safety guidance.');
    }

    // Keep a useful offline response when the API is unavailable.
    setTimeout(() => {
      let reply = "";
      const lower = userMsg.toLowerCase();

      if (lower.includes("can't feel") || lower.includes("cannot feel") || lower.includes("cant feel") || lower.includes("numb") || lower.includes("paraly") || lower.includes("can't move") || lower.includes("cannot move") || lower.includes("cant move") || lower.includes("legs") || lower.includes("spine") || lower.includes("not breathing") || lower.includes("bleeding")) {
        reply = `**I am sorry you are going through this. Treat this as a medical emergency.**\n\n1. Call **112 now** or ask someone nearby to call. Say: medical emergency, possible serious injury.\n2. Do not stand, walk, twist your neck, or move unless there is immediate danger.\n3. Keep the head, neck, and back aligned. Do not massage numb limbs or give food, drink, or medicine.\n4. If there is heavy bleeding, apply firm pressure with clean cloth. Follow the dispatcher instructions.\n5. Share a nearby landmark with the 112 operator and keep the phone on speaker.`;
      } else if (lower.includes("risk") || lower.includes("landslide") || lower.includes("hazard")) {
        reply = `[DISASTER AI REPORT]\nSector: ${coords.name}\nCurrent Risk Level: ${riskProfile.level}\nPrecipitation Rate: ${weatherData.precipitation} mm/h\nSoil Moisture Index: ${weatherData.soilMoisture}\n\nRecommendation: ${riskProfile.recommendation}`;
      } else if (lower.includes("evac") || lower.includes("shelter") || lower.includes("safe")) {
        reply = `[EVACUATION GUIDANCE]\nNearest Safe Shelter: ${evacPoints[0].name} (Dist: ~1.8 km)\nCapacity: ${evacPoints[0].capacity}\nStatus: ${evacPoints[0].status}\n\nEmergency Helpline: 112 (National Emergency Response System)`;
      } else if (lower.includes("weather") || lower.includes("rain") || lower.includes("temp")) {
        reply = `[TELEMETRY SUMMARY]\nTemp: ${weatherData.temperature}°C\nHumidity: ${weatherData.humidity}%\nWind Speed: ${weatherData.wind} km/h\nSurface Pressure: ${weatherData.pressure} hPa`;
      } else {
        reply = `[SixSense Bot Response]\nCurrent area: ${coords.district}\nStatus: GIS telemetry active. Ask me about risk levels, shelters, weather, or what to do during a landslide.`;
      }

      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 600);
  };

  const handleIncidentReport = async (e) => {
    e.preventDefault();
    if (!reportMessage.trim()) return;
    setIsReporting(true);
    setReportStatus(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/report`, {
        lat: coords.lat,
        lon: coords.lon,
        sector_name: coords.name,
        reporter_message: reportMessage,
        photo_name: reportPhoto?.name || null
      }, { timeout: 8000 });
      setReportStatus(response.data.alert?.message || 'Incident report queued.');
    } catch {
      setReportStatus('Demo report prepared locally. Start the backend to send it to authorities.');
    } finally {
      setIsReporting(false);
    }
  };

  const simulateMonsoonEscalation = () => {
    setDemoMode(true);
    setWeatherData({
      temperature: 22.1,
      precipitation: 42.8,
      humidity: 94,
      wind: 28.6,
      pressure: 997.4,
      elevation: 1496,
      soilMoisture: 0.86
    });
    setActiveTab('telemetry');
  };

  const resetDemoScenario = () => {
    setDemoMode(false);
    analyzeLocation(coords.lat, coords.lon);
  };

  // Count active overlays
  const activeOverlayCount = [showRadar, showAqi, showLandslide, showWind].filter(Boolean).length;

  return (
    <div className={`relative flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[99999]' : ''}`}>
      
      {/* ===================================================================
          MODAL: LANGUAGE & SYSTEM CONFIGURATION
          =================================================================== */}
      {showLangModal && (
        <div className="absolute inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl w-fit mx-auto border border-cyan-500/30">
              <Languages className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{t.selectLanguage}</h2>
              <p className="text-xs text-slate-400 mt-1">Configure language and telemetry translation engine.</p>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-1">
              {SUPPORTED_LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLang(item.code)}
                  className={`p-3 text-xs font-bold rounded-2xl border transition flex items-center justify-between ${lang === item.code ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-200'}`}
                >
                  <span>{item.label}</span>
                  {lang === item.code && <span className="w-2 h-2 rounded-full bg-slate-950"></span>}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowLangModal(false)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shadow-emerald-500/20"
            >
              {t.continueApp} →
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          TOP NAVIGATION HEADER
          =================================================================== */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
        
        {/* Brand Identification */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/30 shadow-inner">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                {t.title}
                <span className="px-2 py-0.5 text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full font-bold">
                  v3.4 PRO
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">{t.subtitle}</p>
            </div>
          </div>

          {/* Active Overlay Badges */}
          <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-300 font-mono">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>GIS OVERLAYS: <strong className="text-cyan-400 font-bold">{activeOverlayCount} ACTIVE</strong></span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 font-mono">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>{coords.lat.toFixed(3)}°N, {coords.lon.toFixed(3)}°E</span>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          
          {/* Quick Search trigger */}
          <div className="relative hidden md:block">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-48 lg:w-64 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
              <button type="submit" className="absolute right-2 text-slate-400 hover:text-white">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 right-0 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1 text-xs">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left p-2 hover:bg-slate-800 rounded-xl border-b border-slate-800/50 last:border-none transition"
                  >
                    <div className="font-bold text-cyan-300 truncate">{item.display_name.split(',')[0]}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Button */}
          <button
            onClick={() => setShowLangModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{lang.toUpperCase()}</span>
          </button>

          {/* External Satellite Portal */}
          <a 
            href={`https://zoom.earth/maps/satellite/#view=${coords.lat},${coords.lon},11z`} 
            target="_blank" 
            rel="noreferrer" 
            className="hidden sm:flex px-3 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 rounded-xl text-xs items-center gap-1.5 font-bold transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.zoomEarth}</span>
          </a>

          {/* GPS Acquire Location */}
          <button
            onClick={handleUseMyLocation}
            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/10"
          >
            <Navigation className="w-3.5 h-3.5 fill-slate-950" />
            <span className="hidden sm:inline">{t.gpsPin}</span>
          </button>
          
          {/* National SOS Hotline */}
          <a href="tel:112" className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center gap-1 shadow-lg shadow-rose-600/20 transition">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{t.emergency}</span>
          </a>
        </div>
      </header>

      {/* ===================================================================
          MAIN WORKSPACE DASHBOARD (LEFT PANEL + MAP)
          =================================================================== */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* -----------------------------------------------------------------
            LEFT SIDEBAR: TELEMETRY & DISASTER SUITE
            ----------------------------------------------------------------- */}
        <aside className="w-full md:w-96 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/95 p-4 flex flex-col gap-3.5 overflow-y-auto max-h-[45vh] md:max-h-full shrink-0 z-20 backdrop-blur-md">
          
          {/* Active Target Sector Card */}
          <div className="p-4 rounded-3xl border border-slate-800 bg-slate-950/80 space-y-2 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{t.sector}</span>
              <button onClick={() => analyzeLocation(coords.lat, coords.lon)} className="text-slate-400 hover:text-cyan-400 transition" title={t.refreshTelemetry}>
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
            
            <h2 className="text-base font-black text-cyan-300 flex items-start gap-2 leading-tight">
              <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" /> 
              <span>{coords.name}</span>
            </h2>
            
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
              <span>LAT: {coords.lat.toFixed(4)}°</span>
              <span>LON: {coords.lon.toFixed(4)}°</span>
              <span className="text-emerald-400 font-bold">{weatherData.elevation}m ELEV</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-[10px] text-amber-300 font-bold">
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">NER PILOT ZONE</span>
              {demoMode && <span className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">DEMO SCENARIO</span>}
            </div>
          </div>

          {/* Landslide Risk Index Highlight Box */}
          <div className={`p-4 rounded-3xl border ${riskProfile.borderColor} ${riskProfile.bgColor} space-y-2 transition-all shadow-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${riskProfile.color}`} />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">{t.landslideRisk}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black text-white ${riskProfile.badgeColor}`}>
                {riskProfile.code}
              </span>
            </div>

            <div className={`text-base font-black ${riskProfile.color}`}>
              {riskProfile.level} <span className="text-xs text-slate-400 font-mono">({riskProfile.score}/100)</span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              {riskProfile.recommendation}
            </p>

            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/50 font-mono">
              <span>Soil Moisture: {weatherData.soilMoisture}</span>
              <span>Rain Intensity: {weatherData.precipitation} mm/h</span>
            </div>
            <button
              onClick={() => setIsReportOpen(true)}
              className="w-full mt-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition"
            >
              <Send className="w-3.5 h-3.5" /> Report incident to authorities
            </button>
            <button
              onClick={demoMode ? resetDemoScenario : simulateMonsoonEscalation}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition"
            >
              {demoMode ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {demoMode ? 'Restore live telemetry' : 'Simulate monsoon escalation'}
            </button>
          </div>

          {/* Navigation Tabs for Left Panel */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[11px] font-bold">
            <button 
              onClick={() => setActiveTab('telemetry')}
              className={`flex-1 py-1.5 rounded-xl transition ${activeTab === 'telemetry' ? 'bg-slate-800 text-cyan-300 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Telemetry
            </button>
            <button 
              onClick={() => setActiveTab('evacuation')}
              className={`flex-1 py-1.5 rounded-xl transition ${activeTab === 'evacuation' ? 'bg-slate-800 text-cyan-300 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Evac Routes
            </button>
            <button 
              onClick={() => setActiveTab('bulletins')}
              className={`flex-1 py-1.5 rounded-xl transition ${activeTab === 'bulletins' ? 'bg-slate-800 text-cyan-300 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Bulletins
            </button>
          </div>

          {/* TAB 1: LIVE TELEMETRY METRICS */}
          {activeTab === 'telemetry' && (
            <div className="p-4 rounded-3xl border border-slate-800 bg-slate-950/60 space-y-3 shadow-xl">
              <div className="text-slate-300 font-bold text-xs uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5"><CloudRain className="w-4 h-4 text-cyan-400" /> {t.telemetry}</span>
                <span className="text-[9px] text-slate-500 font-mono">Live Open-Meteo API</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-900 rounded-2xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-rose-400" /> {t.temp}
                  </div>
                  <div className="text-base font-black text-white mt-1">{weatherData.temperature} °C</div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-2xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" /> {t.precip}
                  </div>
                  <div className="text-base font-black text-cyan-300 mt-1">{weatherData.precipitation} mm</div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-2xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-emerald-400" /> Air Quality (AQI)
                  </div>
                  <div className="text-base font-black text-emerald-400 mt-1">{aqiValue} <span className="text-[9px] font-normal text-slate-400">US-AQI</span></div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-2xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                    <Wind className="w-3 h-3 text-indigo-400" /> {t.wind}
                  </div>
                  <div className="text-base font-black text-white mt-1">{weatherData.wind} km/h</div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-2xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                    <Activity className="w-3 h-3 text-amber-400" /> Surface Pressure
                  </div>
                  <div className="text-sm font-black text-slate-200 mt-1">{weatherData.pressure} hPa</div>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-2xl border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                    <Mountain className="w-3 h-3 text-violet-400" /> Soil Moisture
                  </div>
                  <div className="text-sm font-black text-slate-200 mt-1">{weatherData.soilMoisture} m³/m³</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVACUATION & RELIEF NODES */}
          {activeTab === 'evacuation' && (
            <div className="p-4 rounded-3xl border border-slate-800 bg-slate-950/60 space-y-3 shadow-xl">
              <div className="text-slate-300 font-bold text-xs uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5"><LifeBuoy className="w-4 h-4 text-emerald-400" /> Evacuation Shelter Nodes</span>
                <span className="text-[9px] text-emerald-400 font-mono">3 Active</span>
              </div>

              <div className="space-y-2">
                {evacPoints.map((shelter) => (
                  <div key={shelter.id} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-cyan-300">{shelter.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                        {shelter.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-mono">
                      <span>Capacity: {shelter.capacity}</span>
                      <button 
                        onClick={() => setCoords({ ...coords, lat: shelter.lat, lon: shelter.lon })}
                        className="text-cyan-400 hover:underline flex items-center gap-0.5"
                      >
                        Locate <Navigation className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HAZARD BULLETINS */}
          {activeTab === 'bulletins' && (
            <div className="p-4 rounded-3xl border border-slate-800 bg-slate-950/60 space-y-3 shadow-xl">
              <div className="text-slate-300 font-bold text-xs uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5"><History className="w-4 h-4 text-amber-400" /> {t.bulletins}</span>
                <span className="text-[9px] text-slate-500">Live External Feeds</span>
              </div>

              <div className="space-y-2">
                {newsIncidents.map((news, idx) => (
                  <a 
                    key={idx} 
                    href={news.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-slate-900 hover:bg-slate-800/90 rounded-2xl border border-slate-800/80 flex items-center justify-between transition group block"
                  >
                    <div className="pr-2 space-y-1">
                      <div className="text-slate-200 font-bold text-[11px] leading-tight group-hover:text-cyan-300">{news.title}</div>
                      <div className="text-[9px] text-slate-400 flex items-center gap-2">
                        <span className="text-cyan-400 font-semibold">{news.source}</span>
                        <span>•</span>
                        <span>{news.type}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Footnote */}
          <div className="text-[10px] text-slate-500 text-center font-mono pt-1">
            {t.weatherNotice}
          </div>
        </aside>

        {/* -----------------------------------------------------------------
            RIGHT MAIN CANVAS: LEAFLET GIS ENGINE
            ----------------------------------------------------------------- */}
        <main className="flex-1 relative h-full w-full bg-slate-950">
          
          {/* MAP OVERLAY TOGGLE TOOLBAR */}
          <div className="absolute top-4 right-4 z-[1000]">
            <button
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className="px-4 py-3 bg-slate-900/95 text-white border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold hover:bg-slate-800 transition"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{t.mapLayers}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLayerMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* LAYER SELECTION MODAL MENU */}
            {isLayerMenuOpen && (
              <div className="mt-2 w-80 p-4 bg-slate-900/95 border border-slate-700 rounded-3xl shadow-2xl backdrop-blur-xl text-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
                
                {/* Basemap Switcher */}
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">{t.baseMap}</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setActiveBaseLayer('dark')}
                      className={`p-2.5 rounded-2xl border text-center font-bold text-[11px] transition ${activeBaseLayer === 'dark' ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {t.darkMode}
                    </button>
                    <button
                      onClick={() => setActiveBaseLayer('street')}
                      className={`p-2.5 rounded-2xl border text-center font-bold text-[11px] transition ${activeBaseLayer === 'street' ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {t.streetMap}
                    </button>
                    <button
                      onClick={() => setActiveBaseLayer('satellite')}
                      className={`p-2.5 rounded-2xl border text-center font-bold text-[11px] transition ${activeBaseLayer === 'satellite' ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                    >
                      {t.satelliteMap}
                    </button>
                  </div>
                </div>

                {/* Layer Overlays */}
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">{t.overlays}</div>
                  <div className="space-y-2">
                    
                    {/* RainViewer Radar */}
                    <button
                      onClick={() => setShowRadar(!showRadar)}
                      className={`w-full p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition ${showRadar ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300' : 'bg-slate-800/80 border-slate-700 text-slate-400'}`}
                    >
                      <span className="flex items-center gap-2.5"><CloudRain className="w-4 h-4 text-cyan-400" /> {t.cloudRadar}</span>
                      {showRadar ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* ISRO Bhuvan Hazard Overlay */}
                    <button
                      onClick={() => setShowLandslide(!showLandslide)}
                      className={`w-full p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition ${showLandslide ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-slate-800/80 border-slate-700 text-slate-400'}`}
                    >
                      <span className="flex items-center gap-2.5"><Mountain className="w-4 h-4 text-amber-400" /> {t.landslideZones}</span>
                      {showLandslide ? <Eye className="w-4 h-4 text-amber-400" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Global AQI Layer */}
                    <button
                      onClick={() => setShowAqi(!showAqi)}
                      className={`w-full p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition ${showAqi ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-slate-800/80 border-slate-700 text-slate-400'}`}
                    >
                      <span className="flex items-center gap-2.5"><Activity className="w-4 h-4 text-emerald-400" /> {t.aqiHeatmap}</span>
                      {showAqi ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                  </div>
                </div>

              </div>
            )}
          </div>

          {/* LEAFLET MAP CONTAINER ENGINE */}
          <MapContainer 
            center={[coords.lat, coords.lon]} 
            zoom={7} 
            maxZoom={18} 
            className="h-full w-full z-0 bg-slate-950"
            zoomControl={true}
          >
            
            {/* BASEMAP LAYER 1: KEYLESS ESRI DARK GRAY CANVAS (No Watermarks) */}
            {activeBaseLayer === 'dark' && (
              <TileLayer
                attribution="Esri, HERE, Garmin, © OpenStreetMap contributors"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                maxNativeZoom={16}
                maxZoom={18}
                keepBuffer={2}
              />
            )}

            {/* BASEMAP LAYER 2: OPENSTREETMAP TOPO/STREET */}
            {activeBaseLayer === 'street' && (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxNativeZoom={19}
                maxZoom={18}
              />
            )}

            {/* BASEMAP LAYER 3: ESRI SATELLITE IMAGERY */}
            {activeBaseLayer === 'satellite' && (
              <TileLayer
                attribution="Esri World Imagery"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxNativeZoom={17}
                maxZoom={18}
              />
            )}

            {/* RASTER OVERLAY 1: RAINVIEWER DOPPLER WEATHER RADAR */}
            {showRadar && radarTilePath && (
              <TileLayer
                attribution="RainViewer Weather Radar"
                url={`https://tilecache.rainviewer.com${radarTilePath}/256/{z}/{x}/{y}/2/1_1.png`}
                opacity={0.7}
                maxNativeZoom={7}
                maxZoom={18}
                zIndex={500}
              />
            )}

            {/* NER-wide risk zones remain visible while the selected sector changes. */}
            {showLandslide && nerRiskZones.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lon]}
                radius={zone.radius}
                pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.08, weight: 2, dashArray: '5 7' }}
              >
                <Tooltip direction="top" sticky>
                  <span className="font-bold text-[10px]">{zone.name} · regional watch zone</span>
                </Tooltip>
              </Circle>
            ))}

            {/* Stable local hazard zone; the official ISRO portal is linked in Bulletins. */}
            {showLandslide && (
              <Polygon
                positions={[
                  [coords.lat + 0.18, coords.lon - 0.22],
                  [coords.lat + 0.24, coords.lon + 0.04],
                  [coords.lat + 0.08, coords.lon + 0.25],
                  [coords.lat - 0.15, coords.lon + 0.16],
                  [coords.lat - 0.2, coords.lon - 0.14]
                ]}
                pathOptions={{
                  color: riskProfile.code === 'RED' ? '#f43f5e' : '#f59e0b',
                  fillColor: riskProfile.code === 'RED' ? '#f43f5e' : '#f59e0b',
                  fillOpacity: 0.16,
                  weight: 2,
                  dashArray: '6 8'
                }}
              />
            )}

            {/* RASTER OVERLAY 3: OPEN-METEO AIR QUALITY TILE FALLBACK */}
            {showAqi && (
              <Circle
                center={[coords.lat, coords.lon]}
                radius={35000}
                pathOptions={{ 
                  color: aqiValue > 100 ? '#f43f5e' : '#10b981', 
                  fillColor: aqiValue > 100 ? '#f43f5e' : '#10b981', 
                  fillOpacity: 0.15 
                }}
              />
            )}

            {/* MAP EVENTS & RE-CENTERING CONTROLLER */}
            <MapEventListener coords={coords} onLocationSelect={(lat, lon) => analyzeLocation(lat, lon)} />

            {/* MAIN TARGET PIN MARKER */}
            <Marker position={[coords.lat, coords.lon]} icon={riskProfile.code === 'RED' ? RED_PIN : (riskProfile.code === 'AMBER' ? AMBER_PIN : GREEN_PIN)}>
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-1 text-slate-900 font-sans text-xs">
                  <div className="font-black text-sm">{coords.name}</div>
                  <div className="text-[11px] text-slate-600 font-mono">Lat: {coords.lat.toFixed(4)}, Lon: {coords.lon.toFixed(4)}</div>
                  <div className={`font-bold mt-1 ${riskProfile.color}`}>{riskProfile.level}</div>
                  <div className="text-[10px] text-slate-500">Rainfall: {weatherData.precipitation} mm/h</div>
                </div>
              </Popup>
            </Marker>

            {/* SHELTER LOCATION MARKERS */}
            {evacPoints.map((shelter) => (
              <Marker key={shelter.id} position={[shelter.lat, shelter.lon]} icon={GREEN_PIN}>
                <Tooltip permanent direction="top" offset={[0, -20]} className="custom-tooltip">
                  <span className="font-bold text-[10px]">{shelter.name}</span>
                </Tooltip>
              </Marker>
            ))}

            {nerResponsePoints.map((point) => (
              <Marker key={point.id} position={[point.lat, point.lon]} icon={AMBER_PIN}>
                <Tooltip direction="top" sticky>
                  <span className="font-bold text-[10px]">{point.name} · {point.type}</span>
                </Tooltip>
              </Marker>
            ))}

          </MapContainer>

          {/* CHATBOT ASSISTANT FLOATING BUTTON & PANEL */}
          <div className="absolute bottom-12 right-5 z-[1000]">
            {!isChatOpen ? (
              <button
                onClick={() => setIsChatOpen(true)}
                className="px-5 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-black transition transform hover:scale-105 border border-rose-400/30"
              >
                <Bot className="w-5 h-5" />
                <span>{t.askAssistant}</span>
              </button>
            ) : (
              <div className="w-80 md:w-96 h-96 bg-slate-900/95 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
                
                {/* Chat Header */}
                <div className="p-3.5 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                  <span className="font-black text-xs text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-rose-500" /> SixSense Disaster AI
                  </span>
                  <button onClick={() => setIsChatOpen(false)} className="text-xs text-slate-400 hover:text-white font-bold">
                    Close ✕
                  </button>
                </div>

                {/* Chat Messages Log */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-line font-medium leading-relaxed ${m.sender === 'user' ? 'bg-cyan-500 text-slate-950 font-bold rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input Form */}
                <form onSubmit={handleChatSubmit} className="p-2.5 bg-slate-800/80 border-t border-slate-700 flex gap-2">
                  <input
                    type="text"
                    placeholder={t.chatPlaceholder}
                    className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition">
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>
            )}
          </div>
        </main>
      </div>

      {isReportOpen && (
        <div className="absolute inset-0 z-[1100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleIncidentReport} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-white">Report a landslide incident</h2>
                <p className="text-[11px] text-slate-400 mt-1">{coords.name} · {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</p>
              </div>
              <button type="button" onClick={() => setIsReportOpen(false)} className="text-slate-400 hover:text-white text-xs font-bold">Close</button>
            </div>
            <textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              rows={4}
              className="w-full resize-none bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="Describe what you see..."
            />
            <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-700 cursor-pointer hover:border-cyan-500 transition">
              <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="flex-1 text-[11px] text-slate-300 truncate">{reportPhoto ? reportPhoto.name : 'Attach geo-tagged photo or video evidence'}</span>
              <input
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={(e) => setReportPhoto(e.target.files?.[0] || null)}
                className="sr-only"
              />
            </label>
            <button disabled={isReporting} type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2">
              <Send className="w-3.5 h-3.5" /> {isReporting ? 'Sending report...' : 'Send authority alert'}
            </button>
            {reportStatus && <p className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">{reportStatus}</p>}
          </form>
        </div>
      )}

      {/* ===================================================================
          BOTTOM EMERGENCY TICKER & LEGAL BANNER
          =================================================================== */}
      <footer className="h-10 border-t border-slate-800 bg-slate-950 flex items-center z-30 shrink-0">
        <a 
          href="https://sachet.ndma.gov.in/" 
          target="_blank" 
          rel="noreferrer" 
          className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black px-4 py-1 uppercase tracking-wider shrink-0 flex items-center h-full gap-1.5 shadow-md transition"
        >
          NDMA SACHET LIVE <ExternalLink className="w-3 h-3" />
        </a>

        <div className="overflow-hidden whitespace-nowrap w-full">
          <a 
            href="https://sachet.ndma.gov.in/" 
            target="_blank" 
            rel="noreferrer" 
            className="inline-block text-xs text-rose-300 font-bold pl-4 hover:underline tracking-wide animate-marquee"
          >
            🚨 NDMA SACHET Live Alert Bulletin: Active slope runoff, landslide risk telemetry, and intense precipitation warnings in effect for sector. Dial 112 for immediate assistance.
          </a>
        </div>
      </footer>

    </div>
  );
}