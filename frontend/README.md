# Frontend (React + Vite)

## Notifications (nouveau)

- Le provider global `NotificationsProvider` (`src/context/NotificationsContext.jsx`) récupère automatiquement les 10 dernières notifications, met à jour le badge non lu et affiche un toast pendant 5 s pour chaque nouvelle notification détectée (polling 60 s).
- Le bouton « Notifications » de la sidebar (fichier `src/pages/Sidebar.jsx`) affiche un badge dynamique ainsi qu’un aperçu des 3 derniers messages pour l’utilisateur connecté.
- La page `src/pages/Notifications.jsx` (route `/notifications`) liste l’historique complet avec filtres (toutes / non lues), pagination et actions “marquer comme lu” / “tout marquer lu”.

### Points d’intégration

| Emplacement | Description |
|-------------|-------------|
| `src/context/NotificationsContext.jsx` | Hook + provider à placer autour de `<AppRouter />` (déjà fait dans `App.jsx`). Expose `useNotifications()` pour consulter `recentNotifications`, `unreadCount`, `markNotificationAsRead`, etc. |
| `src/components/ui/NotificationToast.jsx` | Snackbar MUI affiché automatiquement par le provider pour toute nouvelle notification, visible 5 secondes. |
| `src/routes/notificationsRoute.jsx` | Route protégée (`/notifications`) branchée sur TanStack Router. |

### Requêtes API utilisées

| Méthode | Route | Usage frontend |
|---------|-------|----------------|
| GET | `/api/notifications?limit=10&page=1` | Sidebar + toast (liste récente) |
| GET | `/api/notifications/unread/count` | Badge non lu |
| GET | `/api/notifications?status=unread&page={n}` | Filtre “Non lues” sur la page |
| POST | `/api/notifications/{id}/read` | Action “Marquer comme lue” |
| POST | `/api/notifications/mark-all-read` | Bouton “Tout marquer lu” |

Toutes les requêtes passent par l’instance Axios (`src/lib/axios.js`) qui injecte automatiquement le JWT.

## Scripts

```bash
npm install          # installation
npm run dev          # dev server
npm run build        # build de production
npm run lint         # linting
```

La page `/notifications` et le provider supposent que l’utilisateur est authentifié (token disponible dans `authStore`).
