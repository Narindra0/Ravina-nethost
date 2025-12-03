import React, { useEffect, useState, lazy, Suspense, useMemo } from 'react'
import { authStore } from '../store/auth'
import { api } from '../lib/axios'
const AddPlantModal = lazy(() => import('./AddPlantModal'))
import Sidebar from './Sidebar'
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material'
import {
  CalendarMonth,
  AddCircleOutline,
  ArrowForward,
  Menu as MenuIcon,
  ArrowBack,
  Search as SearchIcon,
  Shuffle,
  RotateLeft,
} from '@mui/icons-material'

import { dashboardStyles } from '../styles/Dashboard.styles'
const WeatherCard = lazy(() => import('./WeatherCard'))
const CreateUserPlantationModal = lazy(() => import('./CreateUserPlantationModal'))
const PlantTemplateDetailsModal = lazy(() => import('./PlantTemplateDetailsModal'))


const getPlantImagePath = (imageSlug) => {
  return imageSlug || '/images/plantes/default.jpg'
}

const DEFAULT_PLANT_IMAGE = '/images/plantes/default.jpg'

// Helper function to extract base plant name
const getDisplayName = (fullName) => {
  if (!fullName) return ''
  const baseName = fullName.split('(')[0].trim()
  return baseName || fullName
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [plants, setPlants] = useState([])
  const [showAllPlants, setShowAllPlants] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false)
  const [showCreatePlantationModal, setShowCreatePlantationModal] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [showTemplateDetailsModal, setShowTemplateDetailsModal] = useState(false)
  const [selectedTemplateForDetails, setSelectedTemplateForDetails] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [inventorySearch, setInventorySearch] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [showCatalogFromTrefle, setShowCatalogFromTrefle] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleAddPlant = (newPlant) => {
    setPlants([...plants, newPlant])
  }

  const toggleSidebarMobile = () => {
    setIsSidebarMobileOpen(!isSidebarMobileOpen)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true)
      const [userRes, plantsRes, suggestionsRes] = await Promise.allSettled([
        api.get('/user'),
        api.get('/plant_templates', { params: { itemsPerPage: 5, page: 1 } }),
        api.get('/suggestions/plants'),
      ])

      if (userRes.status === 'fulfilled') {
        setUser(userRes.value.data)
      } else {
        console.error('Erreur lors du chargement du profil utilisateur', userRes.reason)
      }

      if (plantsRes.status === 'fulfilled') {
        const data = plantsRes.value.data
        const templateData = Array.isArray(data) ? data : (data['member'] || data['hydra:member'] || [])
        setPlants(templateData)
      } else {
        console.error('Erreur lors du chargement des plantes', plantsRes.reason)
      }

      if (suggestionsRes.status === 'fulfilled') {
        setSuggestions(suggestionsRes.value.data)
      } else {
        console.error('Erreur lors du chargement des suggestions', suggestionsRes.reason)
      }

      setLoadingData(false)
    }
    fetchData()
  }, [])

  const handleViewAll = async () => {
    if (showAllPlants) return
    setLoadingMore(true)
    try {
      const res = await api.get('/plant_templates')
      const data = res.data
      const templateData = Array.isArray(data) ? data : (data['member'] || data['hydra:member'] || [])
      setPlants(templateData)
      setShowAllPlants(true)
      setCurrentPage(1)
    } catch (err) {
      console.error('Erreur lors du chargement de toutes les plantes', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => prev - 1)
  }

  const handleOpenCreatePlantation = (templateId) => {
    setSelectedTemplateId(templateId || null)
    setShowCreatePlantationModal(true)
  }

  const handleOpenTemplateDetails = (template) => {
    if (!template) return
    setSelectedTemplateForDetails(template)
    setShowTemplateDetailsModal(true)
  }

  const handleCloseTemplateDetails = () => {
    setShowTemplateDetailsModal(false)
    setSelectedTemplateForDetails(null)
  }

  const suggestionList = useMemo(() => suggestions?.suggestions ?? [], [suggestions])

  const madagascarPriorityList = [
    // Fruits tropicaux & malgaches
    'vanille',
    'litchi',
    'lichi',
    'mangue',
    'banane',
    'ananas',
    'papaye',
    'kaki',
    'orange',
    'citron',
    'pomme',
    'poire',
    'raisin',
    'fraise',
    // Cultures de base
    'riz',
    'café',
    'cacao',
    'girofle',
    'ylang',
    // Légumes courants
    'tomate',
    'carotte',
    'salade',
    'laitue',
    'oignon',
    'ail',
    'piment',
    'courgette',
    'chou',
    'patate douce',
    'pomme de terre',
    'manioc',
  ]

  // Filtre utilitaire : privilégier les noms de plantes courts et simples
  const isSimpleCommonName = (name) => {
    if (!name) return false
    const base = getDisplayName(name)
    if (!base) return false

    if (base.length > 32) return false

    const words = base.trim().split(/\s+/)
    if (words.length > 4) return false

    return true
  }

  const curatedSuggestions = useMemo(() => {
    if (suggestionList.length === 0) {
      return []
    }

    // Pour les utilisateurs premium (Trefle.io), on privilégie les cultures pertinentes pour Madagascar
    let workingList = suggestionList
    if (suggestions?.isPremium) {
      const filteredForMadagascar = suggestionList.filter((plant) =>
        madagascarPriorityList.some((keyword) =>
          (plant.name || '').toLowerCase().includes(keyword)
        )
      )
      if (filteredForMadagascar.length > 0) {
        workingList = filteredForMadagascar
      }
    }

    // On privilégie d'abord les noms simples dans les suggestions saisonnières
    const bySimplicity = [...workingList].sort((a, b) => {
      const aSimple = isSimpleCommonName(a.name) ? 0 : 1
      const bSimple = isSimpleCommonName(b.name) ? 0 : 1

      if (aSimple !== bSimple) return aSimple - bSimple

      const aLen = (getDisplayName(a.name) || '').length
      const bLen = (getDisplayName(b.name) || '').length
      return aLen - bLen
    })

    const categories = {
      Herbe: [],
      Fruit: [],
      Légume: [],
      Rosier: [],
    }

    bySimplicity.forEach((plant) => {
      const type = (plant.type || '').toLowerCase()
      if (type.includes('herbe') || type.includes('aromatique')) {
        categories.Herbe.push(plant)
      } else if (type.includes('fruit')) {
        categories.Fruit.push(plant)
      } else if (type.includes('rosier') || type.includes('rose')) {
        categories.Rosier.push(plant)
      } else if (type.includes('légume') || type.includes('legume')) {
        categories.Légume.push(plant)
      }
    })

    const pickFirst = (list, count) => list.slice(0, count)

    const selection = [
      ...pickFirst(categories.Herbe, 1),
      ...pickFirst(categories.Fruit, 3),
      ...pickFirst(categories.Légume, 3),
      ...pickFirst(categories.Rosier, 2),
    ]

    const filled = selection.filter(Boolean)
    if (filled.length < 8) {
      const fallback = workingList.filter((plant) => !filled.includes(plant))
      filled.push(...fallback.slice(0, 8 - filled.length))
    }

    return filled.slice(0, 8)
  }, [suggestionList, suggestions])

  const prioritizedPlants = useMemo(() => {
    return [...plants].sort((a, b) => {
      const aName = (a.name || '').toLowerCase()
      const bName = (b.name || '').toLowerCase()

      const aPriority = madagascarPriorityList.findIndex((keyword) => aName.includes(keyword))
      const bPriority = madagascarPriorityList.findIndex((keyword) => bName.includes(keyword))

      const normalize = (value) => (value === -1 ? Number.MAX_SAFE_INTEGER : value)

      const diff = normalize(aPriority) - normalize(bPriority)
      if (diff !== 0) return diff

      // À priorité égale, les noms plus courts et simples d'abord
      const aSimple = isSimpleCommonName(a.name) ? 0 : 1
      const bSimple = isSimpleCommonName(b.name) ? 0 : 1
      if (aSimple !== bSimple) return aSimple - bSimple

      return aName.localeCompare(bName)
    })
  }, [plants])

  // Catalogue de base : toujours basé sur les templates Ravina
  const inventoryDataset = useMemo(() => {
    return prioritizedPlants
  }, [prioritizedPlants])

  const filteredPlants = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase()
    if (!query) {
      return inventoryDataset
    }

    return inventoryDataset.filter((plant) => {
      const haystack = [
        plant.name,
        plant.type,
        plant.bestSeason,
        plant.sunExposure,
        plant.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [inventoryDataset, inventorySearch])

  const paginatedPlants = useMemo(() => {
    if (showAllPlants) {
      return filteredPlants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    }
    return filteredPlants.slice(0, 5)
  }, [filteredPlants, showAllPlants, currentPage, itemsPerPage])

  useEffect(() => {
    if (!showAllPlants) {
      return
    }
    const totalPages = Math.max(1, Math.ceil(filteredPlants.length / itemsPerPage))
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [filteredPlants, currentPage, showAllPlants, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [inventorySearch])

  const filteredCatalog = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase()
    // Ne garder que les plantes facilement trouvables à Madagascar
    const madagascarPlants = suggestionList.filter((plant) =>
      madagascarPriorityList.some((keyword) =>
        (plant.name || '').toLowerCase().includes(keyword)
      )
    )

    const baseList = madagascarPlants.length > 0 ? madagascarPlants : suggestionList

    // Trier pour mettre en avant les plantes aux noms simples et courts
    const sortedBase = [...baseList].sort((a, b) => {
      const aSimple = isSimpleCommonName(a.name) ? 0 : 1
      const bSimple = isSimpleCommonName(b.name) ? 0 : 1
      if (aSimple !== bSimple) return aSimple - bSimple

      const aLen = (getDisplayName(a.name) || '').length
      const bLen = (getDisplayName(b.name) || '').length

      if (aLen !== bLen) return aLen - bLen

      return (a.name || '').localeCompare(b.name || '')
    })

    if (!query) {
      return sortedBase
    }

    return sortedBase.filter((plant) => {
      const haystack = [
        plant.name,
        plant.type,
        plant.sunExposure,
        plant.bestSeason,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [suggestionList, catalogSearch])

  if (!authStore.isAuthenticated()) {
    window.location.href = '/login'
    return null
  }

  return (
    <Box sx={dashboardStyles.root}>
      {/* BOUTON DE MENU MOBILE */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 1200,
        }}
      >
        <IconButton
          color="primary"
          aria-label="open drawer"
          onClick={toggleSidebarMobile}
          sx={{ backgroundColor: 'white', boxShadow: 3 }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Sidebar */}
      <Sidebar
        user={user}
        isMobileOpen={isSidebarMobileOpen}
        onClose={toggleSidebarMobile}
      />

      {/* Main Content */}
      <Box sx={dashboardStyles.mainContent}>
        {loadingData ? (
          <Box sx={dashboardStyles.loadingContainer}>
            <CircularProgress sx={{ color: '#10b981' }} size={50} />
          </Box>
        ) : (
          <Container maxWidth="xl" sx={dashboardStyles.container}>
            {/* Header */}
            <Box sx={dashboardStyles.headerSection}>
              <Typography variant="h3" sx={dashboardStyles.welcomeTitle}>
                Bienvenue sur Ravina,
              </Typography>
              <Typography variant="h6" sx={dashboardStyles.welcomeSubtitle}>
                Bonjour {user ? user.email.split('@')[0] : 'Narindra'},
              </Typography>
            </Box>

            {/* Feature Banner : WeatherCard avec Wrapper Spécifique */}
            <Suspense fallback={null}>
              <Box sx={{ p: 0, pb: '20px', width: '100%' }}>
                <WeatherCard />
              </Box>
            </Suspense>

            {/* Seasonal Suggestions */}
            <Box sx={dashboardStyles.sectionContainer}>
              <Box sx={dashboardStyles.sectionHeader}>
                <Box sx={dashboardStyles.sectionHeaderLeft}>
                  <CalendarMonth sx={dashboardStyles.sectionIcon} />
                  <Box>
                    <Typography variant="h5" sx={dashboardStyles.sectionTitle}>
                      Suggestions saisonnières
                    </Typography>
                    <Typography variant="body2" sx={dashboardStyles.sectionSubtitle}>
                      Saison : {suggestions?.currentSeason || 'Printemps'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {curatedSuggestions.length > 0 ? (
                <Grid container spacing={1.5}>
                  {curatedSuggestions.map((plant) => (
                    <Grid item xs={12} sm={6} md={3} key={plant.id}>
                      <Card sx={dashboardStyles.plantCard}>
                        <Box sx={dashboardStyles.plantCardImage}>
                          <img
                            src={getPlantImagePath(plant.imageSlug)}
                            alt={plant.name}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_PLANT_IMAGE; }}
                          />
                        </Box>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <Button
                              sx={dashboardStyles.plantNameLink}
                              onClick={() => handleOpenTemplateDetails(plant)}
                              aria-label={`Voir les détails de ${plant.name}`}
                            >
                              {getDisplayName(plant.name)}
                            </Button>
                            <Box sx={dashboardStyles.plantCardBadge}>
                              {plant.type}
                            </Box>
                          </Box>
                        </CardContent>
                        <CardActions sx={dashboardStyles.cardActions}>
                          <Button
                            fullWidth
                            size="medium"
                            variant="contained"
                            startIcon={<AddCircleOutline />}
                            onClick={() => handleOpenCreatePlantation(plant.id)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              backgroundColor: '#10b981',
                              '&:hover': { backgroundColor: '#059669' }
                            }}
                            aria-label={`Planter ${plant.name}`}
                          >
                            Planter
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={dashboardStyles.emptyState}>
                  <Typography>Aucune suggestion pour la saison actuelle.</Typography>
                </Box>
              )}
            </Box>

            {/* My Listings (Inventaire & Collection) */}
            <Box sx={dashboardStyles.sectionContainer}>
              <Box sx={dashboardStyles.sectionHeader}>
                <Typography variant="h5" sx={dashboardStyles.sectionTitle}>
                  Inventaire & Collection
                </Typography>
                {!showCatalogFromTrefle && filteredPlants.length >= 5 && (
                  !showAllPlants ? (
                    <Button
                      endIcon={<ArrowForward />}
                      sx={dashboardStyles.viewAllButton}
                      onClick={handleViewAll}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Chargement…' : 'Voir toutes'}
                    </Button>
                  ) : (
                    <TextField
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      size="small"
                      placeholder="Rechercher dans votre inventaire"
                      sx={{ width: { xs: 180, sm: 260, md: 320 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )
                )}
              </Box>

              {suggestions?.isPremium && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Tooltip
                    title={
                      showCatalogFromTrefle
                        ? 'Afficher uniquement votre inventaire'
                        : 'Basculer vers le catalogue RAVINA+'
                    }
                  >
                    <IconButton
                      color="secondary"
                      onClick={() => setShowCatalogFromTrefle((prev) => !prev)}
                      sx={{
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#eff6ff',
                        },
                      }}
                      aria-label={showCatalogFromTrefle ? 'Voir inventaire' : 'Voir catalogue premium'}
                    >
                      {showCatalogFromTrefle ? <RotateLeft /> : <Shuffle />}
                    </IconButton>
                  </Tooltip>
                </Box>
              )}

              {!showCatalogFromTrefle && (
                filteredPlants.length === 0 ? (
                  <Box sx={dashboardStyles.emptyState}>
                    <Typography>
                      {inventorySearch
                        ? 'Aucune plante ne correspond à votre recherche.'
                        : "Vous n'avez encore enregistré aucune plante."}
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1.5}>
                    {paginatedPlants.map((plant) => (
                      <Grid item xs={12} sm={6} md={3} key={plant.id}>
                        <Card
                          sx={{
                            ...dashboardStyles.plantCard,
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                          }}
                        >
                          <Box
                            sx={{
                              ...dashboardStyles.plantCardImage,
                              position: 'relative',
                            }}
                          >
                            <img
                              src={getPlantImagePath(plant.imageSlug || plant.image_url)}
                              alt={plant.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = DEFAULT_PLANT_IMAGE
                              }}
                            />
                            {madagascarPriorityList.some((keyword) =>
                              (plant.name || '').toLowerCase().includes(keyword)
                            ) && (
                                <Chip
                                  label="Madagascar"
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    top: 12,
                                    left: 12,
                                    backgroundColor: '#fef3c7',
                                    color: '#b45309',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                  }}
                                />
                              )}
                          </Box>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Stack spacing={1}>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {getDisplayName(plant.name)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {plant.type} • {plant.bestSeason || 'Toute saison'}
                              </Typography>
                              {plant.sunExposure && (
                                <Typography variant="body2" color="text.secondary">
                                  ☀️ {plant.sunExposure}
                                </Typography>
                              )}
                            </Stack>
                          </CardContent>
                          <CardActions sx={dashboardStyles.cardActions}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <Button
                                sx={dashboardStyles.plantNameLink}
                                onClick={() => handleOpenTemplateDetails(plant)}
                                aria-label={`Voir les détails de ${plant.name}`}
                              >
                                Détails
                              </Button>
                              <Chip
                                label="Base Ravina"
                                size="small"
                                sx={{ backgroundColor: '#ecfccb', color: '#15803d', fontWeight: 700 }}
                              />
                            </Box>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )
              )}

              {suggestions?.isPremium && showCatalogFromTrefle && (
                <Box
                  sx={{
                    mt: 3,
                    borderRadius: 3,
                    border: '1px solid #e5e7eb',
                    p: { xs: 2, sm: 3 },
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Catalogue RAVINA+
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                        Sélection de fruits et légumes adaptés à Madagascar, issus de Trefle.io.
                      </Typography>
                    </Box>
                    <TextField
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      size="small"
                      placeholder="Rechercher un fruit ou légume (litchi, banane, kaki...)"
                      sx={{ width: { xs: '100%', sm: 280 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Box
                    component="ul"
                    sx={{
                      listStyle: 'none',
                      m: 0,
                      mt: 2,
                      p: 0,
                      display: 'grid',
                      gap: 1.25,
                    }}
                  >
                    {filteredCatalog.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Aucune entrée Trefle.io ne correspond à votre filtre.
                      </Typography>
                    ) : (
                      filteredCatalog.slice(0, 8).map((plant) => (
                        <Box
                          component="li"
                          key={`trefle-${plant.id}`}
                          sx={{
                            borderRadius: 2,
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 10px 18px rgba(15,23,42,0.08)',
                            px: 1.75,
                            py: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.75,
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                            cursor: 'default',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 16px 28px rgba(15,23,42,0.12)',
                              borderColor: '#93c5fd',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 52,
                              height: 52,
                              borderRadius: 2,
                              overflow: 'hidden',
                              flexShrink: 0,
                              backgroundColor: '#f3f4f6',
                            }}
                          >
                            <img
                              src={getPlantImagePath(plant.imageSlug)}
                              alt={plant.name}
                              loading="lazy"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                              onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = DEFAULT_PLANT_IMAGE
                              }}
                            />
                          </Box>
                          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                mb: 0.25,
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                              }}
                            >
                              {getDisplayName(plant.name)}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                              }}
                            >
                              {plant.type} • {plant.sunExposure}
                            </Typography>
                            {madagascarPriorityList.some((keyword) =>
                              (plant.name || '').toLowerCase().includes(keyword)
                            ) && (
                              <Chip
                                label="Madagascar"
                                size="small"
                                sx={{
                                  mt: 0.5,
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                }}
                              />
                            )}
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                              flexShrink: 0,
                            }}
                          >
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => handleOpenTemplateDetails(plant)}
                              sx={{ textTransform: 'none', padding: 0, minWidth: 'auto' }}
                            >
                              Voir
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleOpenCreatePlantation(plant.id)}
                              sx={{
                                textTransform: 'none',
                                backgroundColor: '#10b981',
                                '&:hover': { backgroundColor: '#059669' },
                              }}
                            >
                              Planter
                            </Button>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              )}

              <Box sx={dashboardStyles.addButtonContainer}>
                {!showCatalogFromTrefle && showAllPlants && filteredPlants.length > itemsPerPage && (
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: '#10b981',
                      color: '#10b981',
                      px: { xs: 1.5, sm: 3 },
                      '&:hover': {
                        borderColor: '#059669',
                        backgroundColor: 'rgba(16, 185, 129, 0.04)'
                      },
                      '&.Mui-disabled': {
                        borderColor: '#d1d5db',
                        color: '#9ca3af'
                      }
                    }}
                  >
                    {!isMobile && 'Précédent'}
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutline />}
                  onClick={() => setShowAddModal(true)}
                  sx={dashboardStyles.addPlantButton}
                  aria-label="Ajouter une nouvelle plante"
                >
                  {!isMobile && 'Ajouter une nouvelle plante'}
                </Button>
                {!showCatalogFromTrefle && showAllPlants && filteredPlants.length > itemsPerPage && (
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForward />}
                    onClick={handleNextPage}
                    disabled={currentPage >= Math.ceil(filteredPlants.length / itemsPerPage)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: '#10b981',
                      color: '#10b981',
                      px: { xs: 1.5, sm: 3 },
                      '&:hover': {
                        borderColor: '#059669',
                        backgroundColor: 'rgba(16, 185, 129, 0.04)'
                      },
                      '&.Mui-disabled': {
                        borderColor: '#d1d5db',
                        color: '#9ca3af'
                      }
                    }}
                  >
                    {!isMobile && 'Suivant'}
                  </Button>
                )}
              </Box>
              {!showCatalogFromTrefle && showAllPlants && plants.length > itemsPerPage && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Page {currentPage} sur {Math.max(1, Math.ceil(filteredPlants.length / itemsPerPage))}
                  </Typography>
                </Box>
              )}
            </Box>
          </Container>
        )}
      </Box>

      {/* Modals */}
      <Suspense fallback={null}>
        <AddPlantModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onPlantAdded={handleAddPlant}
        />
      </Suspense>

      <Suspense fallback={null}>
        <CreateUserPlantationModal
          open={showCreatePlantationModal}
          onClose={() => setShowCreatePlantationModal(false)}
          onCreated={() => setShowCreatePlantationModal(false)}
          initialTemplateId={selectedTemplateId}
        />
      </Suspense>

      <Suspense fallback={null}>
        <PlantTemplateDetailsModal
          open={showTemplateDetailsModal}
          template={selectedTemplateForDetails}
          onClose={handleCloseTemplateDetails}
        />
      </Suspense>
    </Box>
  )
}