// src/pages/Meteo.jsx

import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Container,
  Grid,
  TextField,
  InputAdornment,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Button
} from '@mui/material'
import {
  Search,
  WaterDrop,
  Air,
  Thermostat,
  Menu as MenuIcon,
  Opacity,
} from '@mui/icons-material'

// Importations modularisées
import Sidebar from './Sidebar'
import HourlyForecastItem from '../components/ui/HourlyForecastItem'
import DailyForecastItem from '../components/ui/DailyForecastItem'
import { meteoStyles } from '../styles/Meteo.styles'
import { 
  getWeatherInfo, 
  formatDate, 
  formatTime,
  GEOCODING_API, 
  WEATHER_API 
} from '../utils/meteoUtils'
import { authStore } from '../store/auth'


export default function Meteo() {
    if (!authStore.isAuthenticated()) {
        window.location.href = '/login'
        return null
    }

    const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false)
    const [weatherData, setWeatherData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchCity, setSearchCity] = useState('')
    const [currentCity, setCurrentCity] = useState('Antananarivo')

    // Fonction pour géocoder une ville (logique API)
    const geocodeCity = async (cityName) => {
      const response = await fetch(`${GEOCODING_API}?name=${encodeURIComponent(cityName)}&count=1&language=fr&format=json`)
      const data = await response.json()
      
      if (!data.results || data.results.length === 0) {
        throw new Error('Ville non trouvée')
      }
      
      return data.results[0]
    }

    // Fonction pour récupérer la météo (logique API)
    const fetchWeatherData = async (city) => {
      try {
        setLoading(true)
        setError(null)

        // 1. Géocoder la ville
        const location = await geocodeCity(city)
        
        // 2. Récupérer les données météo
        const weatherResponse = await fetch(
          `${WEATHER_API}?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        )
        
        const weatherData = await weatherResponse.json()
        
        // 3. Structurer les données
        const processedData = {
          city: location.name,
          country: location.country,
          // ... (Le reste de la structuration des données reste identique)
          current: {
            temp: Math.round(weatherData.current.temperature_2m),
            humidity: weatherData.current.relative_humidity_2m,
            windSpeed: weatherData.current.wind_speed_10m,
            pressure: weatherData.current.pressure_msl,
            weatherCode: weatherData.current.weather_code,
          },
          hourly: weatherData.hourly.time.slice(0, 24).map((time, index) => ({
            time: time,
            temp: Math.round(weatherData.hourly.temperature_2m[index]),
            weatherCode: weatherData.hourly.weather_code[index],
          })),
          daily: weatherData.daily.time.slice(0, 7).map((date, index) => ({
            date: date,
            high: Math.round(weatherData.daily.temperature_2m_max[index]),
            low: Math.round(weatherData.daily.temperature_2m_min[index]),
            weatherCode: weatherData.daily.weather_code[index],
          }))
        }

        setWeatherData(processedData)
        setCurrentCity(city)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    // Charger au montage
    useEffect(() => {
      fetchWeatherData(currentCity)
    }, [])

    // Gestion de la recherche
    const handleSearch = (e) => {
      e.preventDefault()
      if (searchCity.trim()) {
        fetchWeatherData(searchCity)
        setSearchCity('')
      }
    }

    const toggleSidebarMobile = () => setIsSidebarMobileOpen(!isSidebarMobileOpen)

    // Traitement des données pour l'affichage (Utilisation de useMemo pour la performance)
    const displayData = useMemo(() => {
      if (!weatherData) return null

      const currentWeather = getWeatherInfo(weatherData.current.weatherCode)
      const now = new Date()
      const currentHour = now.getHours()

      // Prévisions horaires (6 prochaines heures)
      const hourlyForecast = weatherData.hourly
        .slice(currentHour, currentHour + 6)
        .map(item => {
          const info = getWeatherInfo(item.weatherCode)
          return {
            time: formatTime(item.time),
            temp: item.temp,
            icon: info.icon,
            color: info.color
          }
        })

      // Prévisions quotidiennes
      const dailyForecast = weatherData.daily.map((day, index) => {
        const info = getWeatherInfo(day.weatherCode)
        return {
          day: formatDate(day.date, index === 0),
          icon: info.icon,
          color: info.color,
          text: info.desc,
          high: day.high,
          low: day.low,
          isToday: index === 0, // Ajout d'une prop pour le composant DailyForecastItem
        }
      })

      // Échelle de température
      const allTemps = dailyForecast.flatMap(d => [d.low, d.high])
      const tempScale = {
        min: Math.min(...allTemps),
        max: Math.max(...allTemps),
        range: Math.max(...allTemps) - Math.min(...allTemps) || 1 
      }

      return {
        city: weatherData.city,
        country: weatherData.country,
        temp: weatherData.current.temp,
        condition: currentWeather.desc,
        icon: currentWeather.icon,
        iconColor: currentWeather.color,
        hourlyForecast,
        dailyForecast,
        tempScale,
        airConditions: [
          { 
            label: 'Humidité', 
            value: `${weatherData.current.humidity}%`, 
            icon: WaterDrop 
          },
          { 
            label: 'Vent', 
            value: `${Math.round(weatherData.current.windSpeed)} km/h`, 
            icon: Air 
          },
          { 
            label: 'Pression', 
            value: `${Math.round(weatherData.current.pressure)} hPa`, 
            icon: Opacity 
          },
          { 
            label: 'Température', 
            value: `${weatherData.current.temp}°C`, 
            icon: Thermostat 
          },
        ],
      }
    }, [weatherData])

    const renderMainContent = () => {
      if (loading) {
        return (
          <Box
            sx={{
              ...meteoStyles.mainContent,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} />
              <Typography sx={{ mt: 2, color: '#64748b' }}>
                Chargement des données météo...
              </Typography>
            </Box>
          </Box>
        )
      }

      if (error) {
        return (
          <Box sx={meteoStyles.mainContent}>
            <Container maxWidth="md" sx={{ mt: 4 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h6">Erreur</Typography>
                <Typography>{error}</Typography>
              </Alert>
              <Button variant="contained" onClick={() => fetchWeatherData('Antananarivo')}>
                Recharger avec Antananarivo
              </Button>
            </Container>
          </Box>
        )
      }

      if (!displayData) {
        return null
      }

      return (
        <Box sx={meteoStyles.mainContent}>
          <Container
            maxWidth="xl"
            disableGutters
            sx={{
              px: { xs: 0, sm: 2 },
              width: '100%',
            }}
          >
            {/* Barre de recherche */}
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                placeholder="Rechercher une ville (ex: Antananarivo, Toamasina, Mahajanga)"
                variant="outlined"
                size="small"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                sx={meteoStyles.searchField}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#6b7280' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </form>

            {/* GRID 70/30 - Structure côte à côte DÈS LA TAILLE SM (Tablette) */}
            <Grid
              container
              spacing={{ xs: 2, sm: 3, md: 4 }}
              alignItems="stretch"
            >
              {/* COLONNE GAUCHE (70%) - Météo actuelle + détails */}
              <Grid item xs={12} sm={8} md={8} lg={8}>
                {/* Section météo principale */}
                <Box sx={meteoStyles.mainWeatherSection}>
                  <Box>
                    <Typography sx={meteoStyles.cityName}>
                      {displayData.city}
                      {displayData.country && (
                        <Typography
                          component="span"
                          sx={{ color: '#64748b', fontWeight: 400, fontSize: '0.8em', ml: 1 }}
                        >
                          {displayData.country}
                        </Typography>
                      )}
                    </Typography>
                    <Typography sx={meteoStyles.weatherCondition}>{displayData.condition}</Typography>
                    <Typography sx={meteoStyles.tempDisplay}>{displayData.temp}°</Typography>
                  </Box>
                  <Box>
                    <displayData.icon sx={{ ...meteoStyles.mainWeatherIcon, color: displayData.iconColor }} />
                  </Box>
                </Box>

                {/* Prévisions Horaires */}
                <Paper sx={meteoStyles.infoCard} elevation={0}>
                  <Typography sx={meteoStyles.titleCase}>Prévisions des prochaines heures</Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      overflowX: 'auto',
                      gap: { xs: 0.5, sm: 1 },
                      pb: 1,
                      '&::-webkit-scrollbar': { height: '6px' },
                      '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 3 },
                    }}
                  >
                    {displayData.hourlyForecast.map((hour, index) => (
                      <HourlyForecastItem
                        key={index}
                        time={hour.time}
                        temp={hour.temp}
                        Icon={hour.icon}
                        color={hour.color}
                      />
                    ))}
                  </Box>
                </Paper>

                {/* Conditions de l'Air */}
                <Paper sx={{ ...meteoStyles.infoCard, mt: 3 }} elevation={0}>
                  <Typography sx={meteoStyles.titleCase}>Conditions Actuelles</Typography>
                  <Grid container spacing={{ xs: 2, sm: 3 }}>
                    {displayData.airConditions.map((condition, index) => (
                      <Grid item xs={6} sm={6} key={index}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <condition.icon sx={{ fontSize: { xs: 22, sm: 24 }, color: '#64748b' }} />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ color: '#64748b', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              {condition.label}
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, mt: 0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}
                            >
                              {condition.value}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>

              {/* COLONNE DROITE (30%) - Prévisions 7 jours */}
              <Grid item xs={12} sm={4} md={4} lg={4}>
                <Paper
                  sx={{
                    ...meteoStyles.forecastCard,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                  }}
                  elevation={0}
                >
                  <Typography sx={{ ...meteoStyles.titleCase, px: 0, flexShrink: 0 }}>
                    Prévisions sur 7 Jours
                  </Typography>

                  {/* Container des prévisions avec scroll si nécessaire */}
                  <Box
                    sx={{
                      flexGrow: 1,
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#cbd5e1',
                        borderRadius: 3,
                      },
                    }}
                  >
                    {displayData.dailyForecast.map((day, index) => (
                      <DailyForecastItem
                        key={index}
                        day={day.day}
                        icon={day.icon}
                        color={day.color}
                        low={day.low}
                        high={day.high}
                        tempScale={displayData.tempScale}
                        isToday={day.isToday}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
      )
    }

    return (
      <Box sx={meteoStyles.root}>
        {/* Bouton Menu Mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', top: 10, left: 10, zIndex: 1200 }}>
          <IconButton color="primary" onClick={toggleSidebarMobile} sx={{ backgroundColor: 'white', boxShadow: 3 }}>
            <MenuIcon />
          </IconButton>
        </Box>

        {/* La barre latérale qui prend de l'espace */}
        <Sidebar isMobileOpen={isSidebarMobileOpen} onClose={toggleSidebarMobile} />

        {renderMainContent()}
      </Box>
    )
}