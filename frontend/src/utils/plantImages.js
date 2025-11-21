// utils/plantImages.js

// ========================================
// MÉTHODE 1: Mapping par nom de plante
// ========================================
const plantImageMap = {
  // Légumes
  'tomate': '🍅',
  'carotte': '🥕',
  'salade': '🥬',
  'poivron': '🫑',
  'aubergine': '🍆',
  'concombre': '🥒',
  'pomme de terre': '🥔',
  
  // Fruits
  'fraise': '🍓',
  'citron': '🍋',
  'orange': '🍊',
  'banane': '🍌',
  'pomme': '🍎',
  
  // Herbes aromatiques
  'basilic': '🌿',
  'menthe': '🌿',
  'persil': '🌿',
  'thym': '🌿',
  
  // Fleurs
  'rose': '🌹',
  'tournesol': '🌻',
  'tulipe': '🌷',
  'orchidée': '🌺',
  
  // Plantes d'intérieur
  'cactus': '🌵',
  'succulente': '🪴',
  'fougère': '🌿',
  'monstera': '🌿',
  
  // Default
  'default': '🌱'
}

/**
 * Obtient une emoji basée sur le nom de la plante
 */
export function getPlantEmoji(plantName) {
  if (!plantName) return plantImageMap.default
  
  const normalizedName = plantName.toLowerCase().trim()
  
  // Cherche une correspondance exacte
  if (plantImageMap[normalizedName]) {
    return plantImageMap[normalizedName]
  }
  
  // Cherche une correspondance partielle
  for (const [key, emoji] of Object.entries(plantImageMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return emoji
    }
  }
  
  return plantImageMap.default
}

// ========================================
// MÉTHODE 2: Mapping par type de plante
// ========================================
const plantTypeImageMap = {
  'légume': '🥬',
  'fruit': '🍎',
  'herbe aromatique': '🌿',
  'fleur': '🌸',
  'arbre': '🌳',
  'arbuste': '🌳',
  "plante d'intérieur": '🪴',
  'plante ornementale': '🌺',
  'cactus': '🌵',
  'succulente': '🪴',
  'default': '🌱'
}

/**
 * Obtient une emoji basée sur le type de plante
 */
export function getPlantEmojiByType(plantType) {
  if (!plantType) return plantTypeImageMap.default
  
  const normalizedType = plantType.toLowerCase().trim()
  return plantTypeImageMap[normalizedType] || plantTypeImageMap.default
}

// ========================================
// MÉTHODE 3: URLs d'images depuis APIs gratuites
// ========================================

/**
 * Génère une URL d'image depuis Unsplash (API gratuite)
 */
export function getPlantImageFromUnsplash(plantName, size = '400x400') {
  const query = encodeURIComponent(plantName + ' plant')
  return `https://source.unsplash.com/${size}/?${query}`
}

/**
 * Génère une URL d'image depuis Picsum (placeholder aléatoire)
 */
export function getPlantImageFromPicsum(plantId, size = 400) {
  // Utilise l'ID de la plante pour avoir une image cohérente
  return `https://picsum.photos/seed/${plantId}/400/400`
}

/**
 * Génère une couleur basée sur le nom (pour fond coloré)
 */
export function getPlantColor(plantName) {
  const colors = [
    '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', 
    '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
    '#22c55e', '#84cc16', '#eab308', '#f59e0b'
  ]
  
  if (!plantName) return colors[0]
  
  // Hash simple du nom pour avoir toujours la même couleur
  let hash = 0
  for (let i = 0; i < plantName.length; i++) {
    hash = plantName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// ========================================
// MÉTHODE 4: Gradient avatar avec initiales
// ========================================

/**
 * Génère un SVG avec gradient et initiales
 */
export function getPlantAvatarSVG(plantName) {
  const color1 = getPlantColor(plantName)
  const color2 = adjustColor(color1, -20) // Couleur plus foncée
  
  const initials = plantName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grad)"/>
      <text x="50%" y="50%" font-size="120" fill="white" 
            text-anchor="middle" dominant-baseline="middle" 
            font-family="Arial, sans-serif" font-weight="bold">
        ${initials}
      </text>
      <text x="50%" y="75%" font-size="40" fill="rgba(255,255,255,0.8)" 
            text-anchor="middle" font-family="Arial, sans-serif">
        🌱
      </text>
    </svg>
  `)}`
}

/**
 * Ajuste la luminosité d'une couleur
 */
function adjustColor(color, amount) {
  const clamp = (val) => Math.min(Math.max(val, 0), 255)
  
  const num = parseInt(color.replace('#', ''), 16)
  const r = clamp((num >> 16) + amount)
  const g = clamp(((num >> 8) & 0x00FF) + amount)
  const b = clamp((num & 0x0000FF) + amount)
  
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b)
    .toString(16)
    .slice(1)
}

// ========================================
// MÉTHODE 5: Système intelligent combiné
// ========================================

/**
 * Obtient l'image optimale selon les données disponibles
 */
export function getPlantImage(plant, options = {}) {
  const {
    preferEmoji = true,        // Préfère emoji ou image
    useExternalAPI = false,    // Utilise Unsplash
    fallbackToAvatar = true,   // Utilise avatar SVG en dernier recours
  } = options
  
  // 1. Si préfère emoji
  if (preferEmoji) {
    const emoji = getPlantEmoji(plant.name)
    if (emoji !== plantImageMap.default) {
      return { type: 'emoji', value: emoji }
    }
  }
  
  // 2. Si utilise API externe
  if (useExternalAPI) {
    return { 
      type: 'url', 
      value: getPlantImageFromUnsplash(plant.name) 
    }
  }
  
  // 3. Avatar SVG avec gradient
  if (fallbackToAvatar) {
    return { 
      type: 'svg', 
      value: getPlantAvatarSVG(plant.name) 
    }
  }
  
  // 4. Emoji par type en dernier recours
  return { 
    type: 'emoji', 
    value: getPlantEmojiByType(plant.type) 
  }
}

// ========================================
// MÉTHODE 6: Cache local avec localStorage
// ========================================

const IMAGE_CACHE_KEY = 'plant_images_cache'

/**
 * Sauvegarde une image personnalisée pour une plante
 */
export function savePlantImageToCache(plantId, imageUrl) {
  try {
    const cache = JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}')
    cache[plantId] = imageUrl
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache))
    return true
  } catch (error) {
    console.error('Erreur cache image:', error)
    return false
  }
}

/**
 * Récupère une image depuis le cache
 */
export function getPlantImageFromCache(plantId) {
  try {
    const cache = JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}')
    return cache[plantId] || null
  } catch (error) {
    console.error('Erreur lecture cache:', error)
    return null
  }
}

/**
 * Supprime le cache
 */
export function clearPlantImageCache() {
  localStorage.removeItem(IMAGE_CACHE_KEY)
}

// ========================================
// EXPORTS
// ========================================

export default {
  getPlantEmoji,
  getPlantEmojiByType,
  getPlantImageFromUnsplash,
  getPlantImageFromPicsum,
  getPlantColor,
  getPlantAvatarSVG,
  getPlantImage,
  savePlantImageToCache,
  getPlantImageFromCache,
  clearPlantImageCache,
}