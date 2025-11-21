// src/styles/Meteo.styles.jsx

export const meteoStyles = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  },
  mainContent: {
    flexGrow: 1,
    p: { xs: 2, sm: 3 },
    width: '100%',
  },
  searchField: {
    mb: { xs: 2, md: 3 },
    '& .MuiOutlinedInput-root': {
      borderRadius: 4,
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  },
  mainWeatherSection: {
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: { xs: 3, md: 4 },
    textAlign: { xs: 'center', sm: 'left' },
    gap: 2
  },
  cityName: {
    fontSize: { xs: '1.75rem', sm: '2.125rem' },
    fontWeight: 700,
  },
  weatherCondition: {
    color: '#64748b',
    mb: 1,
    fontSize: { xs: '0.9rem', sm: '1rem' }
  },
  tempDisplay: {
    fontSize: { xs: '4rem', sm: '5.5rem' },
    fontWeight: 600,
    color: '#334155',
    lineHeight: 1,
  },
  mainWeatherIcon: {
    fontSize: { xs: 100, sm: 160 },
  },
  infoCard: {
    backgroundColor: 'rgba(230, 248, 247, 0.6)',
    borderRadius: 4,
    // CORRECTION : padding: 20px (2.5 unités MUI) pour sm (600px+)
    p: { xs: 2, sm: 2.5 }, 
  },
  titleCase: {
    textTransform: 'uppercase',
    fontWeight: 700,
    color: '#64748b',
    fontSize: { xs: '0.8rem', sm: '0.875rem' },
    letterSpacing: '0.5px',
    mb: 2,
  },
  forecastCard: {
    // CORRECTION : padding: 20px (2.5 unités MUI) pour sm (600px+)
    p: { xs: 2, sm: 2.5 }, 
    borderRadius: 4,
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0'
  },
  forecastItem: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: { xs: 'wrap', sm: 'nowrap' },
    justifyContent: 'space-between',
    borderRadius: 3,
    p: { xs: 1.5, sm: 2 },
    mb: 1,
    transition: 'background-color 0.2s',
    '&:hover': { backgroundColor: '#f8fafc' },
  },
  forecastItemToday: {
    backgroundColor: '#eef2ff',
    '&:hover': { backgroundColor: '#e0e7ff' }
  },
  tempBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    flex: 1,
    flexBasis: { xs: '100%', sm: 'auto' },
    mt: { xs: 1.5, sm: 0 },
    minWidth: { sm: 140 },
    mx: { xs: 0, sm: 2 },
  },
  tempBarTrack: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  tempBarFill: {
    position: 'absolute',
    height: '100%',
    background: 'linear-gradient(90deg, #818cf8, #f59e0b)',
    borderRadius: 4,
  }
}