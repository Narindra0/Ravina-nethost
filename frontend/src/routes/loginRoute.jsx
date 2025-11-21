import { createRoute } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import Login from '../pages/Login'

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})
