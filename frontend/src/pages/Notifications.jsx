import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  Fade,
  Grow,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Tooltip,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  Badge,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import WarningIcon from '@mui/icons-material/Warning'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CelebrationIcon from '@mui/icons-material/Celebration'
import EcoIcon from '@mui/icons-material/Eco'
import Sidebar from './Sidebar'
import { notificationsStyles } from '../styles/Notifications.styles'
import { api } from '../lib/axios'
import { useNotifications } from '../context/NotificationsContext'

const PAGE_LIMIT = 15

const typeConfig = {
  PLUIE: { label: 'Météo', color: '#0EA5E9', icon: <WbSunnyIcon /> },
  J_1_PLANTATION: { label: 'Plantation J-1', color: '#F59E0B', icon: <AccessTimeIcon /> },
  JOUR_J_PLANTATION: { label: 'Plantation Jour J', color: '#10B981', icon: <AgricultureIcon /> },
  ARROSAGE_RAPPEL: { label: 'Rappel arrosage', color: '#3B82F6', icon: <WaterDropIcon /> },
  ARROSAGE_OUBLIE: { label: 'Alerte arrosage', color: '#EF4444', icon: <WarningIcon /> },
  PLANTATION_RETARD: { label: 'Retard', color: '#F43F5E', icon: <WarningIcon /> },
  RECOLTE_PROCHE: { label: 'Récolte', color: '#F59E0B', icon: <CelebrationIcon /> },
  FERTILISATION_RECOMMANDEE: { label: 'Fertilisation', color: '#10B981', icon: <EcoIcon /> },
  DEFAULT: { label: 'Notification', color: '#64748B', icon: <NotificationsActiveIcon /> },
}

const formatFullDate = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Notifications() {
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [meta, setMeta] = useState({ page: 1, total: 0 })
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const {
    unreadCount,
    markNotificationAsRead,
    markAllAsRead,
    refreshRecentNotifications,
  } = useNotifications()

  const totalPages = useMemo(() => {
    if (!meta.total) return 1
    return Math.max(1, Math.ceil(meta.total / PAGE_LIMIT))
  }, [meta.total])

  const fetchNotifications = useCallback(async (page = 1, scope = 'all') => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/notifications', {
        params: {
          page,
          limit: PAGE_LIMIT,
          status: scope === 'unread' ? 'unread' : 'all',
        },
      })

      const list = Array.isArray(data?.data) ? data.data : []
      setNotifications(list)
      setMeta({
        page: data?.meta?.page ?? page,
        total: data?.meta?.total ?? list.length,
      })
    } catch (err) {
      console.error('Erreur notifications', err)
      setError("Impossible de charger vos notifications.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMeta((prev) => ({ ...prev, page: 1 }))
    fetchNotifications(1, filter)
  }, [fetchNotifications, filter])

  const toggleSidebarMobile = () => {
    setIsSidebarMobileOpen((prev) => !prev)
  }

  const handlePageChange = (direction) => {
    const nextPage =
      direction === 'next'
        ? Math.min(totalPages, meta.page + 1)
        : Math.max(1, meta.page - 1)

    if (nextPage !== meta.page) {
      fetchNotifications(nextPage, filter)
      setMeta((prev) => ({ ...prev, page: nextPage }))
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      )
      await refreshRecentNotifications()
    } catch {
      // handled in service
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAllAsRead()
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      )
      await refreshRecentNotifications()
    } catch {
      // handled in service
    }
  }

  const theme = useTheme()
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'))

  const filteredEmpty =
    !loading && notifications.length === 0 && filter === 'unread'

  return (
    <Box sx={notificationsStyles.root}>
      {/* Mobile Menu Button */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 1300,
        }}
      >
        <IconButton
          color="primary"
          aria-label="Ouvrir le menu"
          onClick={toggleSidebarMobile}
          sx={{ backgroundColor: 'white', boxShadow: 2 }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      <Sidebar
        isMobileOpen={isSidebarMobileOpen}
        onClose={toggleSidebarMobile}
      />

      {/* Main Content */}
      <Box sx={notificationsStyles.mainContent}>
        <Container maxWidth="lg" sx={notificationsStyles.container}>
          {/* Header Section */}
          <Box sx={notificationsStyles.header}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h1" sx={notificationsStyles.title}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Badge
                  badgeContent={unreadCount}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.875rem',
                      height: 24,
                      minWidth: 24,
                      borderRadius: '12px',
                      backgroundColor: '#0EA5E9',
                    }
                  }}
                />
              )}
            </Box>
            <Typography variant="body1" sx={notificationsStyles.subtitle}>
              Restez informé de vos activités agricoles et rappels importants.
            </Typography>
          </Box>

          {/* Filters and Actions */}
          <Box sx={notificationsStyles.filtersContainer}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={(e, newFilter) => newFilter && setFilter(newFilter)}
              sx={notificationsStyles.toggleGroup}
            >
              <ToggleButton value="all" sx={notificationsStyles.toggleButton}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Toutes
                </Typography>
              </ToggleButton>
              <ToggleButton value="unread" sx={notificationsStyles.toggleButton}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Non lues {unreadCount > 0 && `(${unreadCount})`}
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title={!unreadCount ? "Aucune notification non lue" : ""}>
              <span>
                <Button
                  variant="contained"
                  startIcon={<DoneAllIcon />}
                  onClick={handleMarkAll}
                  disabled={!unreadCount}
                  sx={notificationsStyles.markAllButton}
                >
                  {isSmDown ? 'Tout lire' : 'Tout marquer comme lu'}
                </Button>
              </span>
            </Tooltip>
          </Box>

          {/* Loading State */}
          {loading ? (
            <Stack spacing={2}>
              {[1, 2, 3].map((i) => (
                <Card key={i} sx={{ borderRadius: '16px' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Skeleton variant="rounded" width={48} height={48} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={24} />
                        <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                        <Skeleton variant="text" width="40%" height={20} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : error ? (
            /* Error State */
            <Fade in>
              <Paper sx={notificationsStyles.emptyState}>
                <Box sx={notificationsStyles.emptyIcon}>
                  <WarningIcon sx={{ fontSize: 40, color: '#EF4444' }} />
                </Box>
                <Typography variant="h6" color="error" gutterBottom>
                  Oups !
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {error}
                </Typography>
                <Button variant="outlined" onClick={() => fetchNotifications(meta.page, filter)}>
                  Réessayer
                </Button>
              </Paper>
            </Fade>
          ) : notifications.length === 0 ? (
            /* Empty State */
            <Fade in>
              <Paper sx={notificationsStyles.emptyState}>
                <Box sx={notificationsStyles.emptyIcon}>
                  <NotificationsActiveIcon sx={{ fontSize: 40, color: '#94A3B8' }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#1E293B', mb: 1 }}>
                  {filter === 'unread' ? 'Vous êtes à jour !' : 'Aucune notification'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  {filter === 'unread'
                    ? 'Aucune notification non lue pour le moment.'
                    : 'Vous n\'avez reçu aucune notification récemment.'}
                </Typography>
              </Paper>
            </Fade>
          ) : (
            /* Notifications List */
            <>
              <Grid container spacing={2}>
                {notifications.map((notification, index) => {
                  const config = typeConfig[notification.type] || typeConfig.DEFAULT
                  return (
                    <Grid item xs={12} key={notification.id}>
                      <Grow in timeout={300 + (index * 50)}>
                        <Card sx={notificationsStyles.card(notification.isRead)}>
                          <CardContent sx={notificationsStyles.cardContent}>
                            {/* Icon */}
                            <Box sx={notificationsStyles.iconBox(config.color)}>
                              {config.icon}
                            </Box>

                            {/* Content */}
                            <Box sx={notificationsStyles.textContent}>
                              {/* Header with Title and Date */}
                              <Box sx={notificationsStyles.cardHeader}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                  <Typography sx={notificationsStyles.cardTitle(notification.isRead)}>
                                    {notification.title}
                                  </Typography>
                                  {!notification.isRead && (
                                    <Chip
                                      label="Nouveau"
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        backgroundColor: '#0EA5E9',
                                        color: 'white',
                                      }}
                                    />
                                  )}
                                </Box>
                                <Typography sx={notificationsStyles.date}>
                                  {formatFullDate(notification.createdAt)}
                                </Typography>
                              </Box>

                              {/* Type Badge */}
                              <Chip
                                label={config.label}
                                size="small"
                                icon={React.cloneElement(config.icon, { sx: { fontSize: '0.875rem !important' } })}
                                sx={{
                                  height: 24,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  backgroundColor: `${config.color}15`,
                                  color: config.color,
                                  mb: 1,
                                  '& .MuiChip-icon': {
                                    color: config.color,
                                  }
                                }}
                              />

                              {/* Message */}
                              <Typography sx={notificationsStyles.message}>
                                {notification.message}
                              </Typography>

                              {/* Actions */}
                              {!notification.isRead && (
                                <>
                                  <Divider sx={{ my: 1.5 }} />
                                  <Box sx={notificationsStyles.actions}>
                                    <Button
                                      size="small"
                                      startIcon={<CheckCircleIcon />}
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      sx={{
                                        ...notificationsStyles.actionButton,
                                        color: config.color,
                                        '&:hover': { bgcolor: `${config.color}15` }
                                      }}
                                    >
                                      Marquer comme lue
                                    </Button>
                                  </Box>
                                </>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grow>
                    </Grid>
                  )
                })}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={notificationsStyles.paginationContainer}>
                  <Pagination
                    count={totalPages}
                    page={meta.page}
                    onChange={(e, page) => {
                      fetchNotifications(page, filter)
                      setMeta((prev) => ({ ...prev, page }))
                    }}
                    color="primary"
                    size={isSmDown ? 'small' : 'medium'}
                    siblingCount={isSmDown ? 0 : 1}
                    sx={notificationsStyles.pagination}
                  />
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>
    </Box>
  )
}
