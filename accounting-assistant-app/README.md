# Application d'assistant comptable (AAC)

Une application web complète conçue pour les petites entreprises afin de gérer leurs processus comptables, notamment la facturation, le suivi des paiements, les rapports financiers et les analyses.

## Démarrage rapide

```bash
# Cloner le dépôt
git clone <repository-url>
cd accounting-assistant

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env


# Créer et migrer la base de données
createdb accounting_db
npm run db:push

# Démarrer le serveur de développement
npm run dev
```

Accédez à « http://localhost:5000 » dans votre navigateur.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Local Installation](#local-installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [PostgreSQL Setup](#postgresql-setup)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Fonctionnalités

- 🔐 **Authentification utilisateur** : Connexion et inscription sécurisées avec différents rôles utilisateur (administrateur, comptable)
- 📊 **Tableau de bord** : Représentation visuelle des indicateurs financiers clés et de l'activité récente
- 📑 **Gestion des factures** : Création, consultation, modification et suppression de factures
- 💰 **Suivi des paiements** : Suivi des paiements associés aux factures
- 📈 **Rapports financiers** : Génération et exportation de rapports financiers
- 🔄 **Stockage persistant** : Données stockées de manière sécurisée dans la base de données PostgreSQL

## Pile technologique

### Système d'authentification

L'application utilise un système d'authentification par session avec les composants suivants :
- **Passport.js** : Gestion des stratégies d'authentification (avec nom d'utilisateur/mot de passe local)
- **Express-session** : Gestion des sessions utilisateur
- **PostgreSQL Session Store** : Stockage des données de session dans la base de données PostgreSQL
- **Module Crypto** : Gestion Hachage et vérification sécurisés des mots de passe

Le flux d'authentification fonctionne comme suit :
1. L'utilisateur s'inscrit ou se connecte via les points de terminaison « /api/register » ou « /api/login ».
2. Une authentification réussie crée une session et définit un cookie de session.
3. Des routes protégées vérifient l'authentification de la session.
4. Le frontend utilise le hook « useAuth » pour accéder à l'utilisateur actuel et à son état d'authentification.

### Frontend
- **React** : Bibliothèque d'interface utilisateur pour la création de l'interface utilisateur.
- **TypeScript** : JavaScript typé sécurisé.
- **TanStack Query (React Query)** : Récupération de données et gestion d'état.
- **React Hook Form** : Gestion des formulaires avec validation.
- **Zod** : Validation de schéma.
- **Tailwind CSS** : Framework CSS utilitaire.
- **shadcn/ui** : Bibliothèque de composants basée sur Tailwind.
- **Recharts** : Bibliothèque de graphiques pour la visualisation de données.
- **Wouter** : Bibliothèque de routage.
- **Lucide React** : Bibliothèque d'icônes

### Backend
- **Node.js** : Environnement d'exécution JavaScript
- **Express** : Framework web
- **TypeScript** : JavaScript typé sécurisé
- **Drizzle ORM** : Boîte à outils de base de données pour TypeScript
- **PostgreSQL** : Base de données relationnelle
- **Passport.js** : Intergiciel d'authentification
- **express-session** : Gestion des sessions

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les éléments suivants :
- Node.js (v16 ou ultérieure)
- npm (v8 ou ultérieure)
- PostgreSQL (v13 ou ultérieure)

## Installation locale

1. Cloner le dépôt :
```bash
git clone <repository-url>
cd accounting-assistant
```

2. Installer les dépendances :
```bash
npm install
```

## Configuration

1. Créer un fichier `.env` dans le répertoire racine avec les variables suivantes :

```env
# Configuration de la base de données
DATABASE_URL=postgres://username:password@localhost:5432/accounting_db

# Secret de session
SESSION_SECRET=your_session_secret_here

# Port (facultatif, par défaut : 5000)
PORT=5000
```


2. Créez la base de données PostgreSQL :
```bash
createdb accounting_db
```

## Exécution de l'application

### Mode développement

Pour exécuter l'application en mode développement avec rechargement à chaud :

```bash
npm run dev
```

Cela démarrera les serveurs de développement back-end et front-end. L'application sera disponible à l'adresse « http://localhost:5000 ».

### Version de production

Pour créer une version de production :

```bash
npm run build
```

Pour démarrer le serveur de production :

```bash
npm start
```

## Configuration de PostgreSQL

### Utilisation de PostgreSQL au lieu du stockage en mémoire

L'application est configurée pour utiliser PostgreSQL par défaut. La connexion à la base de données est gérée dans le fichier « server/db.ts ».

Si vous devez modifier la connexion à la base de données :

1. Mettez à jour l'URL « DATABASE_URL » dans votre fichier « .env ». 2. Déployer le schéma de la base de données :
```bash
npm run db:push
```



## Schéma de la base de données

L'application utilise les tables principales suivantes :

- **users** : Stocke les informations des comptes utilisateurs
- **invoices** : Stocke les données des factures
- **payments** : Suivi des paiements associés aux factures
- **reports** : Stocke les rapports financiers générés

Les relations entre les schémas sont définies dans « shared/schema.ts ».

### Exploration du schéma de la base de données

Pour afficher la structure de la base de données depuis la ligne de commande :

```bash
# Lister toutes les tables
psql -d accounting_db -c "\dt"

# Afficher la structure d'une table spécifique
psql -d accounting_db -c "\d users"
```

### Relations entre entités

Notre base de données suit les relations suivantes :

- **Utilisateurs vers Factures** : Un-à-plusieurs (un utilisateur peut créer plusieurs factures)
- **Utilisateurs vers Paiements** : Un-à-plusieurs (un utilisateur peut effectuer plusieurs paiements)
- **Utilisateurs vers Rapports** : Un-à-plusieurs (un utilisateur peut générer plusieurs rapports)
- **Factures vers Paiements** : Un-à-plusieurs (une facture peut comporter plusieurs paiements)

Le schéma utilise des clés étrangères pour maintenir l'intégrité référentielle entre les entités liées.

#### Erreurs de module manquant

Si vous rencontrez l'erreur « Module introuvable » :

```bash
# Vider le cache npm
npm cache clean --force

# Réinstaller les dépendances
rm -rf node_modules
npm install
```

#### Erreurs TypeScript

Pour les erreurs de compilation TypeScript :

```bash
# Rechercher les erreurs TypeScript
npm run check
```

##### Problèmes TypeScript courants

- **Importations de types non résolues** : Vérifiez que les chemins dans `tsconfig.json` sont correctement configurés :
```json
"paths": {
"@/*": ["./client/src/*"],
"@shared/*": ["./shared/*"]
}
```

- **Définitions de type manquantes pour les données externes Bibliothèques**:
```bash
# Installer les définitions de types manquantes
npm install --save-dev @types/package-name
```

- **Problèmes avec les types Drizzle ou Zod**: Assurez-vous que votre schéma dans `shared/schema.ts` définit correctement les tables de base de données et les exportations de types, et que toutes les relations sont correctement définies.

#### Port déjà utilisé

Si le port 5000 est déjà utilisé :

1. Modifiez le PORT dans votre fichier `.env`
2. Arrêtez le processus utilisant le port 5000 :
```bash
npx kill-port 5000
```

## Project Structure

Ce projet suit une organisation claire pour vous aider à naviguer dans la base de code :

```
accounting-assistant/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── dashboard/  # Dashboard-specific components
│   │   │   ├── invoices/   # Invoice-specific components
│   │   │   ├── layout/     # Layout components like sidebar
│   │   │   ├── payments/   # Payment-specific components
│   │   │   ├── reports/    # Report-specific components
│   │   │   └── ui/         # Reusable UI components (shadcn)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and shared logic
│   │   ├── pages/          # Page components for routing
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Application entry point
│   └── index.html          # HTML template
├── server/                 # Backend Express server
│   ├── auth.ts             # Authentication logic
│   ├── db.ts               # Database connection
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data access layer
│   └── vite.ts             # Vite integration (do not modify)
├── shared/                 # Shared code between client and server
│   └── schema.ts           # Database schema and types
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Node dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration (do not modify)
```