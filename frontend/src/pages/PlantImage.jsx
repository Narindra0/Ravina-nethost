import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { 
  getPlantImage, 
  getPlantImageFromCache,
  getPlantColor 
} from '../utils/plantImages'

/**
 * Composant intelligent pour afficher l'image d'une plante
 * Supporte: emoji, URL externe, SVG avatar, cache local
 */
export default function PlantImage({ 
  plant, 
  size = 200,
  variant = 'card', // 'card' | 'list' | 'detail'
  showEmoji = true,
  useExternalAPI = false 
}) {
  const [imageError, setImageError] = useState(false)
  
  // Vérifie d'abord le cache local
  const cachedImage = getPlantImageFromCache(plant.id)
  
  // Obtient l'image optimale
  const imageData = cachedImage 
    ? { type: 'url', value: cachedImage }
    : getPlantImage(plant, { 
        preferEmoji: showEmoji, 
        useExternalAPI: useExternalAPI && !imageError 
      })
  
  // Styles selon la variante
  const containerStyles = {
    card: {
      height: size,
      backgroundColor: '#f9fafb',
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    list: {
      width: 60,
      height: 60,
      borderRadius: 1.5,
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    detail: {
      height: 300,
      backgroundColor: '#f9fafb',
      borderRadius: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }
  }
  
  const emojiSizes = {
    card: '5rem',
    list: '2rem',
    detail: '8rem'
  }
  
  // Rendu selon le type d'image
  const renderImage = () => {
    switch (imageData.type) {
      case 'emoji':
        return (
          <Typography sx={{ fontSize: emojiSizes[variant] }}>
            {imageData.value}
          </Typography>
        )
      
      case 'url':
        return (
          <img
            src={imageData.value}
            alt={plant.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={() => setImageError(true)}
          />
        )
      
      case 'svg':
        return (
          <img
            src={imageData.value}
            alt={plant.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )
      
      default:
        return (
          <Typography sx={{ fontSize: emojiSizes[variant] }}>
            🌱
          </Typography>
        )
    }
  }
  
  return (
    <Box sx={containerStyles[variant]}>
      {renderImage()}
    </Box>
  )
}

// ========================================
// Variante avec fond coloré personnalisé
// ========================================

export function PlantImageWithGradient({ plant, size = 200 }) {
  const color = getPlantColor(plant.name)
  
  return (
    <Box
      sx={{
        height: size,
        background: `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -20)} 100%)`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Pattern décoratif */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='2' fill='white' opacity='0.1'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Initiales */}
      <Typography
        sx={{
          fontSize: '4rem',
          fontWeight: 700,
          color: 'white',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {plant.name.slice(0, 2).toUpperCase()}
      </Typography>
      
      {/* Emoji décoratif */}
      <Typography
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          fontSize: '2rem',
          opacity: 0.5,
        }}
      >
        🌱
      </Typography>
    </Box>
  )
}

// Fonction helper pour ajuster la luminosité
function adjustBrightness(color, amount) {
  const clamp = (val) => Math.min(Math.max(val, 0), 255)
  const num = parseInt(color.replace('#', ''), 16)
  const r = clamp((num >> 16) + amount)
  const g = clamp(((num >> 8) & 0x00FF) + amount)
  const b = clamp((num & 0x0000FF) + amount)
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)
}