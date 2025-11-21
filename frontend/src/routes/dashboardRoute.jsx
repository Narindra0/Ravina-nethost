import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import Dashboard from '../pages/Dashboard'
import { authStore } from '../store/auth'

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: () => {
    if (!authStore.isAuthenticated()) {
      window.location.href = '/login'
      throw new Error('Utilisateur non authentifié')
    }
  },
  component: Dashboard,
})
