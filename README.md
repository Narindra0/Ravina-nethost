# 🌿 RAVINA : Plateforme de Gestion de Plantation Assistée par la Technologie

Application web permettant aux utilisateurs de gérer leurs **plantations** de manière optimisée grâce à l'assistance technologique (suggestions, données spécifiques).

## Sommaire

* [Aperçu](#aperçu)
* [Architecture](#architecture)
* [Fonctionnalités Clés](#fonctionnalités-clés)
* [Technologies](#technologies)
* [Installation](#installation)
  * [Prérequis](#prérequis)
  * [Backend (Symfony + API Platform)](#backend-symfony--api-platform)
  * [Frontend (React + Vite)](#frontend-react--vite)
* [Configuration](#configuration)
  * [Base de données (MySQL via Docker)](#base-de-données-mysql-via-docker)
  * [JWT (LexikJWT)](#jwt-lexikjwt)
  * [CORS](#cors)
* [Démarrage](#démarrage)
* [API](#api)
* [Scripts Utiles](#scripts-utiles)
* [Arborescence](#arborescence)
* [Licence](#licence)

---

## Aperçu

**RAVINA** est conçue pour simplifier la **gestion des cultures** et des **plantes individuelles**.

* **Gestion des Plantations**: Ajout, suivi et mise à jour des informations d'entretien (saison, exposition, arrosage) avec support d'image.
* **Assistance Technologique**: Obtention de **suggestions saisonnières** et de **données spécifiques** pour optimiser le rendement.
* **Météo**: Consultation des prévisions météorologiques géolocalisées pour anticiper les besoins en eau et les conditions de croissance.
* **Sécurité**: Système d'authentification robuste via **JWT** pour sécuriser les données utilisateur.

---

## Architecture

Le projet est un **Monorepo** divisé en deux composants principaux :

* `backend/`: API RESTful développée avec **Symfony 7** et **API Platform 4**, utilisant **MySQL** comme base de données et **JWT** pour l'authentification. Entités principales : `User` et `Plant`.
* `frontend/`: Application **SPA (Single Page Application)** construite avec **React 19**, **Vite 7**, intégrant **MUI** pour le design et **TanStack Router/Query** pour le routage et la gestion des données asynchrones.

---

## Fonctionnalités Clés

* 🔑 **Authentification Sécurisée (JWT)**:
  * Inscription (`/api/register`) et Connexion (`/api/login`)
  * Récupération de profil sécurisée (`/api/user`)
* 🌱 **Gestion Complète des Plantations**:
  * CRUD (Create, Read, Update, Delete) des plantes via API Platform (`/api/plants`)
  * **Upload d’Image** dédié (multipart/form-data) avec validation côté serveur.
  * Champs détaillés : nom, type, saison, arrosage, exposition, lieu, date de plantation, jours avant récolte, notes.
* 💡 **Suggestions et Assistance**:
  * Endpoint **dédié** pour les suggestions saisonnières (`/api/suggestions/plants`) avec mise en cache.
* 🌦️ **Météo et Géolocalisation**:
  * Recherche de ville (géocodage) et affichage des prévisions (actuelles, horaires, 7 jours).

---

## Technologies

### Backend
* **PHP 8.2+**, **Symfony 7**, **API Platform 4**
* **Doctrine ORM**, Migrations
* **MySQL** (via Docker)
* **LexikJWTAuthenticationBundle** (JWT)
* **Nelmio CORS**

### Frontend
* **React 19** + **Vite 7**
* **MUI (Material-UI)**, **TanStack Router**, **TanStack Query**
* **Axios** (avec intercepteur pour `Authorization: Bearer`)

### Outils
* ESLint, React Fast Refresh, Composer

---

## Installation

### Prérequis
* **PHP 8.2+**, **Composer**
* **Node 18+** (recommandé), **npm**
* **Docker** (pour la base de données MySQL)
* (Optionnel) Symfony CLI

### Backend (Symfony + API Platform)

1. Dépendances :
```

cd backend
composer install

```

2. Base de données (via Docker Compose) :
```

docker compose up -d

```

3. Variables d’environnement :
* Copier `.env.local.dist` vers `.env` et ajuster (notamment `DATABASE_URL` pour MySQL).
* **Générer et configurer les clés JWT** (voir [section JWT](#jwt-lexikjwt)).

4. Migrations (création de la structure de la BDD) :
```

php bin/console doctrine:migrations:migrate

````

5. Démarrer le serveur :
* Avec Symfony CLI (recommandé) :
  ```
  symfony server:start -d
  ```
* Ou PHP natif :
  ```
  php -S 127.0.0.1:8000 -t public
  ```

### Frontend (React + Vite)

1. Dépendances :
```

cd frontend
npm install

```



2. Démarrer en mode développement :
```

npm run dev

```
L'application sera accessible par défaut sur `http://localhost:5173`.

> **Note**: Le frontend est configuré par défaut pour appeler l'API sur `http://127.0.0.1:8000/api`. Assurez-vous que le backend tourne sur cette adresse.

---

## Configuration

### Base de données (MySQL via Docker)

Le fichier `backend/compose.yaml` doit démarrer un conteneur MySQL 8.0 (ou supérieur).

Variables d'environnement clés pour le service MySQL:
* **DB Name**: `MYSQL_DATABASE=app`
* **User**: `MYSQL_USER=app`
* **Password**: `MYSQL_PASSWORD=!ChangeMe!`
* **Root Password**: `MYSQL_ROOT_PASSWORD=!ChangeMeRoot!`

Vérifiez que la variable `DATABASE_URL` de Symfony dans votre fichier `.env` pointe vers ce conteneur avec le bon schéma (ex: `mysql://app:!ChangeMe!@127.0.0.1:3306/app?serverVersion=8.0&charset=utf8`).

### JWT (LexikJWT)

Les clés de chiffrement sont lues via les variables d'environnement (`JWT_SECRET_KEY`, `JWT_PUBLIC_KEY`, `JWT_PASSPHRASE`).

**Étapes de génération des clés (obligatoire) :**

1. Créer le dossier :
```

mkdir -p backend/config/jwt

```

2. Générer la clé privée (nécessite une **passphrase**) :
```

openssl genrsa -aes256 -out backend/config/jwt/private.pem 4096

```

3. Générer la clé publique :
```

openssl rsa -pubout -in backend/config/jwt/private.pem -out backend/config/jwt/public.pem

```

4. Définir les variables d'environnement dans le fichier `.env` du backend :
```

JWT\_SECRET\_KEY=%kernel.project\_dir%/config/jwt/private.pem
JWT\_PUBLIC\_KEY=%kernel.project\_dir%/config/jwt/public.pem
JWT\_PASSPHRASE="votre-passphrase-utilisée-ci-dessus"

```

### CORS

Le bundle `nelmio_cors` est pré-configuré (voir `backend/config/packages/nelmio_cors.yaml`). Si vous changez le port du frontend, ajustez les `allow_origin`.

---

## Démarrage Rapide

1. Démarrer la base de données :
```

cd backend && docker compose up -d

```

2. Démarrer l'API (Backend) :
```

symfony server:start -d

```

3. Démarrer l'application (Frontend) :
```

cd frontend && npm run dev

```

---

## API

**Base URL**: `http://127.0.0.1:8000/api`

| Endpoint | Méthode | Description | Requis |
| :--- | :--- | :--- | :--- |
| `/login` | `POST` | Authentification (email, password) | Aucun |
| `/register` | `POST` | Création de compte | Aucun |
| `/user` | `GET` | Profil utilisateur | **JWT** |
| `/plants` | `GET`, `POST` | CRUD des plantations | **JWT** |
| `/plants/{id}` | `GET`, `PUT`, `DELETE` | Opérations sur une plante spécifique (restreint au propriétaire) | **JWT** |
| `/suggestions/plants` | `GET` | Suggestions saisonnières (ex: `?month=10`) | Aucun |

**Documentation interactive**: `http://127.0.0.1:8000/api/docs` (Swagger/Redoc)

---

## Scripts Utiles

### Backend (`cd backend`)
* Migrations : `php bin/console doctrine:migrations:migrate`
* Clear cache : `php bin/console cache:clear`

### Frontend (`cd frontend`)
* Build de production : `npm run build`
* Linting : `npm run lint`

---

## Arborescence

* `backend/` :
* `src/Entity/Plant.php`, `src/Entity/User.php`
* `src/Controller/AuthController.php`, `PlantSuggestionController.php`
* `frontend/` :
* `src/pages/Dashboard.jsx`, `Meteo.jsx`, `AddPlantModal.jsx`
* `src/lib/axios.js` (Configuration Axios avec intercepteur JWT)
* `src/routes/` (Définition des routes TanStack Router)

---

## Licence

Narindra Ranjalahy. Tous droits réservés.
```
