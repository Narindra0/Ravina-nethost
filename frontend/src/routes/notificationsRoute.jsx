import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import Notifications from '../pages/Notifications'
import { authStore } from '../store/auth'

export const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notifications',
  beforeLoad: () => {
    if (!authStore.isAuthenticated()) {
      window.location.href = '/login'
      throw new Error('Utilisateur non authentifié')
    }
  },
  component: Notifications,
})



