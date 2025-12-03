import React, { useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import {
  Cloud,
  Home,
  LocalFlorist,
  Logout,
  NotificationsNone,
  Star,
} from '@mui/icons-material'
// 🚨 CORRECTION: Utilisation des hooks et composants de TanStack Router
import { Link, useRouterState } from '@tanstack/react-router'

import { authStore } from '../store/auth'
import { useNotifications } from '../context/NotificationsContext'
import AccountModal from '../components/ui/AccountModal'

// Import de votre logo
import orientMadaLogo from '../assets/logo-texte.png'

const sidebarStyles = {
  sidebarContentBase: {
    width: 280,
    minHeight: '100vh',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },

  logoContainer: {
    p: 3,
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoImage: {
    height: 60,
    width: 'auto',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
  },

  nav: {
    flex: 1,
    p: 2,
  },

  // 💡 Nouveau style de base pour le Link de TanStack
  tanstackLinkBase: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },

  navButton: (isActive) => ({
    width: '100%',
    justifyContent: 'flex-start',
    px: 3,
    py: 1.5,
    mb: 1,
    borderRadius: 2,
    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
    color: isActive ? '#059669' : '#4b5563',
    fontWeight: isActive ? 700 : 600,
    textTransform: 'none',
    fontSize: '1rem',
    gap: 2,
    '&:hover': {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      color: '#059669',
    },
  }),

  previewSection: {
    mt: 3,
    p: 2,
    borderRadius: 2,
    backgroundColor: '#f8fafc',
  },

  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 1,
  },

  previewList: {
    maxHeight: 220,
    overflowY: 'auto',
    mt: 1,
    '& .MuiListItem-root': {
      borderRadius: 1.5,
      mb: 0.5,
      alignItems: 'flex-start',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
    },
  },

  footer: {
    p: 2,
    borderTop: '1px solid #e5e7eb',
  },

  logoutButton: {
    width: '100%',
    justifyContent: 'flex-start',
    px: 3,
    py: 1.5,
    borderRadius: 2,
    color: '#dc2626',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '1rem',
    gap: 2,
    '&:hover': {
      backgroundColor: 'rgba(220, 38, 38, 0.05)',
    },
  },

  userInfo: {
    px: 2,
    py: 1.5,
    mb: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 2,
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#f3f4f6',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
  },

  userEmail: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  premiumBadge: {
    ml: 1,
    height: 20,
    fontSize: '0.7rem',
    fontWeight: 700,
  },
}

const formatRelativeTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return 'À l’instant'
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Il y a ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} j`
}

export default function Sidebar({ user = null, isMobileOpen, onClose }) {
  // 🚨 CORRECTION: Utilisation de useRouterState pour obtenir le chemin actuel
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const {
    recentNotifications,
    unreadCount,
    isFetching: notificationsLoading,
  } = useNotifications()

  const [accountModalOpen, setAccountModalOpen] = useState(false)

  const handleLogout = () => {
    authStore.clearToken()
    window.location.href = '/login'
  }

  const isPathActive = (path) => currentPath === path;
  const previewNotifications = recentNotifications.slice(0, 3)

  const sidebarContent = (
    <Box sx={sidebarStyles.sidebarContentBase}>
      {/* 1. Logo Section */}
      <Box sx={sidebarStyles.logoContainer}>
        <img
          src={orientMadaLogo}
          alt="OrientMada Logo"
          style={sidebarStyles.logoImage}
        />
      </Box>

      {/* 2. Navigation Section */}
      <Box sx={sidebarStyles.nav}>
        {user && (
          <Box
            sx={sidebarStyles.userInfo}
            onClick={() => setAccountModalOpen(true)}
            title="Cliquez pour gérer votre compte"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={sidebarStyles.userEmail}>
                {user.email}
              </Typography>
              {user.premiumExpiryDate && new Date(user.premiumExpiryDate) > new Date() && (
                <Chip
                  icon={<Star sx={{ fontSize: 14 }} />}
                  label="Premium"
                  color="secondary"
                  size="small"
                  sx={sidebarStyles.premiumBadge}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Modal de gestion de compte */}
        <AccountModal
          open={accountModalOpen}
          onClose={() => setAccountModalOpen(false)}
          user={user}
        />

        {/* Dashboard Button */}
        {/* 🚨 Utilisation du composant Link de TanStack */}
        <Link to="/dashboard" style={sidebarStyles.tanstackLinkBase} onClick={onClose}>
          <Button sx={sidebarStyles.navButton(isPathActive('/dashboard'))}>
            <Home sx={{ fontSize: 22 }} />
            Dashboard
          </Button>
        </Link>

        {/* Bouton Météo */}
        {/* 🚨 Utilisation du composant Link de TanStack */}
        <Link to="/meteo" style={sidebarStyles.tanstackLinkBase} onClick={onClose}>
          <Button sx={sidebarStyles.navButton(isPathActive('/meteo'))}>
            <Cloud sx={{ fontSize: 22 }} />
            Météo Détaillée
          </Button>
        </Link>

        {/* Bouton Plantations */}
        <Link to="/plantations" style={sidebarStyles.tanstackLinkBase} onClick={onClose}>
          <Button sx={sidebarStyles.navButton(isPathActive('/plantations'))}>
            <LocalFlorist sx={{ fontSize: 22 }} />
            Plantations
          </Button>
        </Link>

        <Link to="/notifications" style={sidebarStyles.tanstackLinkBase} onClick={onClose}>
          <Button sx={sidebarStyles.navButton(isPathActive('/notifications'))}>
            <Badge
              color="error"
              badgeContent={unreadCount}
              invisible={!unreadCount}
              sx={{ mr: 1 }}
            >
              <NotificationsNone sx={{ fontSize: 22 }} />
            </Badge>
            Notifications
          </Button>
        </Link>

      </Box>

      {/* 3. Footer - Bouton Déconnexion */}
      <Box sx={sidebarStyles.footer}>
        <Button
          onClick={handleLogout}
          sx={sidebarStyles.logoutButton}
        >
          <Logout sx={{ fontSize: 22 }} />
          Déconnexion
        </Button>
      </Box>
    </Box>
  )

  return (
    <>
      {/* 1. Vue Desktop (Box Normale Fixée) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: 280,
          minHeight: '100vh',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          flexDirection: 'column',
        }}
      >
        {sidebarContent}
      </Box>

      {/* 2. Vue Mobile (Drawer MUI) */}
      <Drawer
        variant="temporary"
        open={isMobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  )
}