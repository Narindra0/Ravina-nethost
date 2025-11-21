import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import Meteo from '../pages/Meteo'

export const meteoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meteo',
  component: Meteo,
})
