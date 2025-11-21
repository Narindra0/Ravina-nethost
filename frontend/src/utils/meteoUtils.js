import {
  Cloud,
  WbSunny,
  Thunderstorm,
  WaterDrop,
  AcUnit,
  Grain,
  Foggy
} from '@mui/icons-material'

// ✨ Codes météo WMO vers icônes et descriptions
export const getWeatherInfo = (code) => {
  const weatherCodes = {
    0: { icon: WbSunny, desc: 'Ciel dégagé', color: '#fcd34d' },
    1: { icon: WbSunny, desc: 'Principalement dégagé', color: '#fcd34d' },
    2: { icon: Cloud, desc: 'Partiellement nuageux', color: '#94a3b8' },
    3: { icon: Cloud, desc: 'Couvert', color: '#94a3b8' },
    45: { icon: Foggy, desc: 'Brouillard', color: '#94a3b8' },
    48: { icon: Foggy, desc: 'Brouillard givrant', color: '#94a3b8' },
    51: { icon: Grain, desc: 'Bruine légère', color: '#94a3b8' },
    53: { icon: Grain, desc: 'Bruine modérée', color: '#94a3b8' },
    55: { icon: Grain, desc: 'Bruine dense', color: '#94a3b8' },
    61: { icon: WaterDrop, desc: 'Pluie légère', color: '#3b82f6' },
    63: { icon: WaterDrop, desc: 'Pluie modérée', color: '#3b82f6' },
    65: { icon: WaterDrop, desc: 'Pluie forte', color: '#3b82f6' },
    71: { icon: AcUnit, desc: 'Neige légère', color: '#60a5fa' },
    73: { icon: AcUnit, desc: 'Neige modérée', color: '#60a5fa' },
    75: { icon: AcUnit, desc: 'Neige forte', color: '#60a5fa' },
    80: { icon: WaterDrop, desc: 'Averses légères', color: '#3b82f6' },
    81: { icon: WaterDrop, desc: 'Averses modérées', color: '#3b82f6' },
    82: { icon: WaterDrop, desc: 'Averses violentes', color: '#3b82f6' },
    95: { icon: Thunderstorm, desc: 'Orage', color: '#6366f1' },
    96: { icon: Thunderstorm, desc: 'Orage avec grêle légère', color: '#6366f1' },
    99: { icon: Thunderstorm, desc: 'Orage avec grêle forte', color: '#6366f1' },
  }
  return weatherCodes[code] || { icon: Cloud, desc: 'Inconnu', color: '#94a3b8' }
}

// ✨ Formater les dates
export const formatDate = (dateString, isToday) => {
  if (isToday) return "Aujourd'hui"
  
  const date = new Date(dateString)
  const options = { weekday: 'short' }
  let formatted = date.toLocaleDateString('fr-FR', options)
  
  // Capitaliser et enlever le point
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).replace('.', '')
  return formatted
}

// ✨ Formater l'heure
export const formatTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ✨ API Open-Meteo (Gratuite, sans clé API !)
export const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search'
export const WEATHER_API = 'https://api.open-meteo.com/v1/forecast'