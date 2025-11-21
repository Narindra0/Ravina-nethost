SUGGESTION_OWNER_ID
--------------------

Pour forcer les suggestions à être basées sur les plantes d'un utilisateur spécifique,
définissez la variable d'environnement suivante côté backend (valeur par défaut: 1):

```bash
SUGGESTION_OWNER_ID=1
```

Le contrôleur `App\\Controller\\PlantSuggestionController` lit cette variable via `$_ENV`.


## Notifications automatiques

Les notifications météo / plantation / arrosage sont générées via la commande :

```bash
php bin/console app:notifications:process
```

Planifiez cette commande toutes les heures (ou toutes les 15 min) via le planificateur de tâches Windows :

1. Créez une tâche basique en exécutant `pwsh.exe`.
2. Utilisez l’argument suivant en adaptant les chemins :
   ```
   -File "C:\Program Files\PowerShell\7\pwsh.exe" -Command "cd D:\OrientMada\OrientMada\backend; php bin/console app:notifications:process"
   ```
3. Activez « Exécuter indépendamment de la connexion de l’utilisateur » pour garantir l’exécution du cron.

La commande est idempotente (anti-doublons) grâce à `NotificationRepository::hasRecentNotificationForPlantation`.

## API Notifications

| Méthode | Route                               | Description                              |
|---------|-------------------------------------|------------------------------------------|
| GET     | `/api/notifications`                | Liste paginée (`page`, `limit`, `status=unread`) |
| GET     | `/api/notifications/unread/count`   | Nombre de notifications non lues         |
| POST    | `/api/notifications/{id}/read`      | Marquer une notification comme lue       |
| POST    | `/api/notifications/mark-all-read`  | Marquer toutes les notifications de l’utilisateur comme lues |

Toutes les routes nécessitent un utilisateur authentifié (JWT). Les réponses renvoient des timestamps ISO 8601 (`createdAt`).

