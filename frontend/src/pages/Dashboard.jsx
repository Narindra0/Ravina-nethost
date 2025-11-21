import React, { useEffect, useState, lazy, Suspense } from 'react'
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
} from '@mui/material'
import {
  CalendarMonth,
  AddCircleOutline,
  ArrowForward,
  WbSunny,
  Schedule,
  // 🚀 Ajout de l'icône de menu
  Menu as MenuIcon,
  ArrowBack,
} from '@mui/icons-material'

import { dashboardStyles } from '../styles/Dashboard.styles'
const WeatherCard = lazy(() => import('./WeatherCard'))
const CreateUserPlantationModal = lazy(() => import('./CreateUserPlantationModal'))
const PlantTemplateDetailsModal = lazy(() => import('./PlantTemplateDetailsModal'))


const getPlantImagePath = (imageSlug) => {
  return imageSlug || '/images/plantes/default.jpg'
}

const DEFAULT_PLANT_IMAGE = '/images/plantes/default.jpg'


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
      setCurrentPage(1) // Reset to first page when viewing all
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

  if (!authStore.isAuthenticated()) {
    window.location.href = '/login'
    return null
  }

  return (
    <Box sx={dashboardStyles.root}>
      {/* 🚀 BOUTON DE MENU MOBILE : Affiché uniquement sur les petits écrans */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' }, // Visible uniquement sur mobile
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
          sx={{ backgroundColor: 'white', boxShadow: 3 }} // Style pour que le bouton ressorte
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Sidebar */}
      {/* 🚀 MISE À JOUR : Passage des props de contrôle mobile à Sidebar */}
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

            {/* Feature Banner */}
            <Suspense fallback={null}>
              <WeatherCard />
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

              {suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 ? (
                <Grid container spacing={1.5}>
                  {suggestions.suggestions.map((plant) => (
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
                              {plant.name}
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

            {/* My Listings */}
            <Box sx={dashboardStyles.sectionContainer}>
              <Box sx={dashboardStyles.sectionHeader}>
                <Typography variant="h5" sx={dashboardStyles.sectionTitle}>
                  Inventaire & Collection
                </Typography>
                {!showAllPlants && plants.length >= 5 && (
                  <Button
                    endIcon={<ArrowForward />}
                    sx={dashboardStyles.viewAllButton}
                    onClick={handleViewAll}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Chargement…' : 'Voir toutes'}
                  </Button>
                )}
              </Box>

              {plants.length === 0 ? (
                <Box sx={dashboardStyles.emptyState}>
                  <Typography>Vous n'avez encore enregistré aucune plante.</Typography>
                </Box>
              ) : (
                <Grid container spacing={1.5}>
                  {(showAllPlants
                    ? plants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    : plants.slice(0, 5)
                  ).map((plant) => (
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
                              {plant.name}
                            </Button>
                            <Box sx={dashboardStyles.plantCardBadge}>
                              {plant.type}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Box sx={dashboardStyles.addButtonContainer}>
                {showAllPlants && plants.length > itemsPerPage && (
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
                {showAllPlants && plants.length > itemsPerPage && (
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForward />}
                    onClick={handleNextPage}
                    disabled={currentPage >= Math.ceil(plants.length / itemsPerPage)}
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
              {showAllPlants && plants.length > itemsPerPage && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Page {currentPage} sur {Math.ceil(plants.length / itemsPerPage)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Container>
        )}
      </Box>

      {/* Modal */}
      <Suspense fallback={null}>
        <AddPlantModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onPlantAdded={handleAddPlant}
        />
      </Suspense>

      {/* Create Plantation Modal */}
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