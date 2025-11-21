import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import Plants from '../pages/Plants'

// Route pour la page des plantes
export const plantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plants',
  component: Plants,
})
