import React from 'react'
import { Box, Typography } from '@mui/material'
import { meteoStyles } from '../../styles/Meteo.styles'

const DailyForecastItem = ({ day, icon: Icon, color, low, high, tempScale, isToday }) => {
  // Calculs de position de la barre de température
  const barWidth = (high - low) / tempScale.range * 100
  const barLeft = (low - tempScale.min) / tempScale.range * 100

  return (
    <Box sx={{
      ...meteoStyles.forecastItem,
      ...(isToday && meteoStyles.forecastItemToday)
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Typography variant="body1" sx={{
          minWidth: { xs: '85px', sm: '95px' },
          color: '#334155',
          fontWeight: 700,
          fontSize: { xs: '0.9rem', sm: '1rem' }
        }}>
          {day}
        </Typography>
        <Icon sx={{ fontSize: { xs: 28, sm: 32 }, color: color }} />
      </Box>
      
      <Box sx={meteoStyles.tempBarContainer}>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>
          {low}°
        </Typography>
        <Box sx={meteoStyles.tempBarTrack}>
          <Box sx={{
            ...meteoStyles.tempBarFill,
            width: `${barWidth}%`,
            left: `${barLeft}%`
          }} />
        </Box>
        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 700, fontSize: '0.9rem' }}>
          {high}°
        </Typography>
      </Box>
    </Box>
  )
}

export default DailyForecastItem