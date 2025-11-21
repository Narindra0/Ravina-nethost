import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './rootRoute';
import Plantations from '../pages/Plantations';
import { authStore } from '../store/auth';

export const plantationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plantations',
  beforeLoad: () => {
    if (!authStore.isAuthenticated()) {
      window.location.href = '/login';
      throw new Error('Utilisateur non authentifié');
    }
  },
  component: Plantations,
});
