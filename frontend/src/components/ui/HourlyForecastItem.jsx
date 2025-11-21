import React from 'react'
import { Box, Typography } from '@mui/material'

// Composant Prévision Horaire
const HourlyForecastItem = ({ time, temp, Icon, color }) => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    p: { xs: 1, sm: 1.5 },
    borderRadius: 2,
    minWidth: { xs: '70px', sm: '80px' },
  }}>
    <Typography variant="body2" sx={{ fontWeight: 500, color: '#64748b', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
      {time}
    </Typography>
    <Icon sx={{ fontSize: { xs: 28, sm: 32 }, color: color, my: 1 }} />
    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
      {temp}°
    </Typography>
  </Box>
)

export default HourlyForecastItem