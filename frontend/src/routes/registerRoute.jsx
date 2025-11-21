import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import Register from '../pages/Register'

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: Register,
})
