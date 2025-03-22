# Guide d'Exécution et de Déploiement - Talk2Me

**Copyright © 2025 MIGUELITO DevCode**

Ce document vous guide à travers les étapes nécessaires pour lancer l'application Talk2Me dans votre environnement de développement et la déployer sur différentes plateformes.

## Exécution en Environnement de Développement

### Prérequis

- Node.js (v16 ou supérieur)
- npm ou yarn 
- Git (pour cloner le dépôt)

### Lancement Local

1. **Cloner le dépôt**

   ```bash
   git clone https://github.com/miguelito-devcode/talk2me.git
   cd talk2me
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   # ou
   yarn
   ```

3. **Lancer l'application en mode développement**

   ```bash
   npm run dev
   # ou
   yarn dev
   ```

   Cette commande lance simultanément le serveur backend Express et le serveur frontend Vite.

4. **Accéder à l'application**

   Ouvrez votre navigateur et allez à l'adresse : `http://localhost:5000`

### Utilisation des Workflows sur Replit

Si vous utilisez Replit comme environnement de développement :

1. Ouvrez le projet Talk2Me dans Replit
2. Allez dans l'onglet "Shell" et assurez-vous que toutes les dépendances sont installées :
   ```bash
   npm install
   ```
3. Cliquez sur le bouton "Run" ou utilisez le workflow "Start application" déjà configuré
4. L'application sera accessible via l'URL fournie par Replit dans l'onglet "Webview"

## Construction pour la Production

Pour préparer l'application pour le déploiement en production :

```bash
npm run build
# ou
yarn build
```

Cette commande :
- Compile les fichiers TypeScript
- Bundle le frontend avec Vite
- Optimise les assets pour la production
- Génère les fichiers dans le dossier `dist/`

## Déploiement sur PC

### Option 1 : Serveur Node.js Autonome

1. **Préparer l'environnement de production**

   ```bash
   # Installer PM2 pour gérer le processus Node.js
   npm install -g pm2
   
   # Construire l'application
   npm run build
   ```

2. **Configurer les variables d'environnement**

   Créez un fichier `.env` à la racine du projet :
   ```
   NODE_ENV=production
   PORT=5000
   # Si vous utilisez une base de données externe
   # DATABASE_URL=postgres://user:password@host:port/database
   ```

3. **Lancer avec PM2**

   ```bash
   pm2 start dist/server/index.js --name talk2me
   
   # Pour démarrer automatiquement au redémarrage du système
   pm2 startup
   pm2 save
   ```

4. **Configurer un proxy inverse (recommandé)**

   Pour servir l'application derrière Nginx :

   ```nginx
   server {
       listen 80;
       server_name talk2me.example.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2 : Application Électron pour Windows/macOS/Linux

Pour créer une version bureau autonome de Talk2Me :

1. **Ajouter Electron au projet**

   ```bash
   npm install electron electron-builder --save-dev
   ```

2. **Créer un fichier de point d'entrée Electron**

   Créez un fichier `electron.js` à la racine du projet :
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');
   const { spawn } = require('child_process');
   
   let serverProcess;
   let mainWindow;
   
   function createWindow() {
     mainWindow = new BrowserWindow({
       width: 1024,
       height: 768,
       webPreferences: {
         nodeIntegration: true
       }
     });
     
     mainWindow.loadURL('http://localhost:5000');
     mainWindow.on('closed', function() {
       mainWindow = null;
     });
   }
   
   function startServer() {
     serverProcess = spawn('node', [path.join(__dirname, 'dist/server/index.js')]);
     
     serverProcess.stdout.on('data', (data) => {
       console.log(`Server stdout: ${data}`);
     });
     
     serverProcess.stderr.on('data', (data) => {
       console.error(`Server stderr: ${data}`);
     });
     
     // Attendre que le serveur démarre
     setTimeout(createWindow, 1000);
   }
   
   app.on('ready', startServer);
   
   app.on('window-all-closed', function() {
     if (process.platform !== 'darwin') {
       app.quit();
     }
   });
   
   app.on('quit', () => {
     if (serverProcess) {
       serverProcess.kill();
     }
   });
   
   app.on('activate', function() {
     if (mainWindow === null) {
       createWindow();
     }
   });
   ```

3. **Configurer electron-builder**

   Ajoutez la configuration suivante à votre `package.json` :
   ```json
   "build": {
     "appId": "com.miguelito.talk2me",
     "productName": "Talk2Me",
     "files": [
       "dist/**/*",
       "electron.js",
       "node_modules/**/*"
     ],
     "directories": {
       "buildResources": "resources",
       "output": "electron-dist"
     },
     "mac": {
       "category": "public.app-category.social-networking"
     },
     "win": {
       "target": "nsis"
     },
     "linux": {
       "target": ["AppImage", "deb"]
     }
   },
   "scripts": {
     "electron:build": "npm run build && electron-builder"
   }
   ```

4. **Construire l'application de bureau**

   ```bash
   npm run electron:build
   ```

   Cela générera des exécutables pour Windows, macOS et/ou Linux dans le dossier `electron-dist/`.

## Déploiement sur Mobile

### Option 1 : Application Web Progressive (PWA)

La façon la plus simple de rendre Talk2Me accessible sur mobile est de la configurer comme une PWA :

1. **Ajouter le manifest.json**

   Créez un fichier `client/public/manifest.json` :
   ```json
   {
     "name": "Talk2Me",
     "short_name": "Talk2Me",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#4f46e5",
     "icons": [
       {
         "src": "icons/icon-72x72.png",
         "sizes": "72x72",
         "type": "image/png"
       },
       {
         "src": "icons/icon-96x96.png",
         "sizes": "96x96",
         "type": "image/png"
       },
       {
         "src": "icons/icon-128x128.png",
         "sizes": "128x128",
         "type": "image/png"
       },
       {
         "src": "icons/icon-144x144.png",
         "sizes": "144x144",
         "type": "image/png"
       },
       {
         "src": "icons/icon-152x152.png",
         "sizes": "152x152",
         "type": "image/png"
       },
       {
         "src": "icons/icon-192x192.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "icons/icon-384x384.png",
         "sizes": "384x384",
         "type": "image/png"
       },
       {
         "src": "icons/icon-512x512.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ]
   }
   ```

2. **Ajouter un service worker**

   Créez un fichier `client/public/service-worker.js` :
   ```javascript
   // Nom du cache
   const CACHE_NAME = 'talk2me-cache-v1';

   // Fichiers à mettre en cache
   const urlsToCache = [
     '/',
     '/index.html',
     '/manifest.json'
   ];

   // Installation du service worker
   self.addEventListener('install', event => {
     event.waitUntil(
       caches.open(CACHE_NAME)
         .then(cache => {
           return cache.addAll(urlsToCache);
         })
     );
   });

   // Stratégie de cache
   self.addEventListener('fetch', event => {
     event.respondWith(
       caches.match(event.request)
         .then(response => {
           // Retourner la réponse mise en cache si elle existe
           if (response) {
             return response;
           }
           
           // Sinon, récupérer depuis le réseau
           return fetch(event.request).then(
             response => {
               // Vérifier si la réponse est valide
               if(!response || response.status !== 200 || response.type !== 'basic') {
                 return response;
               }
               
               // Cloner la réponse
               const responseToCache = response.clone();
               
               // Mettre en cache
               caches.open(CACHE_NAME)
                 .then(cache => {
                   cache.put(event.request, responseToCache);
                 });
                 
               return response;
             }
           );
         })
     );
   });
   ```

3. **Enregistrer le service worker dans index.html**

   Ajoutez le code suivant à votre `client/index.html` avant la fermeture de la balise `</body>` :
   ```html
   <script>
     if ('serviceWorker' in navigator) {
       window.addEventListener('load', function() {
         navigator.serviceWorker.register('/service-worker.js').then(
           function(registration) {
             console.log('Service worker registered successfully');
           },
           function(err) {
             console.log('Service worker registration failed: ', err);
           }
         );
       });
     }
   </script>
   ```

4. **Déployer l'application**

   Déployez l'application sur un serveur sécurisé (HTTPS) et les utilisateurs pourront l'ajouter à leur écran d'accueil sur iOS et Android.

### Option 2 : Application Native avec Capacitor

Pour créer une véritable application mobile native :

1. **Ajouter Capacitor au projet**

   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init Talk2Me com.miguelito.talk2me
   npm install @capacitor/android @capacitor/ios
   ```

2. **Construire l'application**

   ```bash
   npm run build
   ```

3. **Configurer Capacitor**

   Créez ou modifiez le fichier `capacitor.config.json` :
   ```json
   {
     "appId": "com.miguelito.talk2me",
     "appName": "Talk2Me",
     "webDir": "dist/client",
     "bundledWebRuntime": false,
     "server": {
       "url": "https://votre-api.example.com",
       "cleartext": true
     }
   }
   ```

   Note : Pour le développement, vous devrez configurer `server.url` pour pointer vers votre API backend. En production, vous aurez besoin d'un backend déployé accessible sur Internet.

4. **Ajouter les plateformes**

   ```bash
   npx cap add android
   npx cap add ios
   ```

5. **Synchroniser les fichiers**

   ```bash
   npx cap sync
   ```

6. **Ouvrir les projets natifs**

   ```bash
   # Pour Android
   npx cap open android
   
   # Pour iOS
   npx cap open ios
   ```

7. **Construire avec Android Studio / Xcode**

   Une fois les projets ouverts dans leurs IDE respectifs :
   - Android : Utilisez "Build > Build Bundle(s) / APK(s) > Build APK(s)"
   - iOS : Utilisez "Product > Archive" puis utilisez l'App Store Connect pour distribuer

## Déploiement sur des Services Cloud

### Hébergement sur Heroku

1. **Créer un fichier Procfile**

   Créez un fichier nommé `Procfile` à la racine du projet :
   ```
   web: node dist/server/index.js
   ```

2. **Configurer le package.json**

   Assurez-vous que votre `package.json` contient :
   ```json
   "engines": {
     "node": "16.x"
   },
   "scripts": {
     "start": "node dist/server/index.js",
     "heroku-postbuild": "npm run build"
   }
   ```

3. **Déployer sur Heroku**

   ```bash
   # Installer l'outil Heroku CLI
   npm install -g heroku
   
   # Connexion à Heroku
   heroku login
   
   # Créer une nouvelle application
   heroku create talk2me-app
   
   # Déployer l'application
   git push heroku main
   
   # Configurer les variables d'environnement
   heroku config:set NODE_ENV=production
   
   # Si vous utilisez une base de données, connectez-la
   heroku addons:create heroku-postgresql:hobby-dev
   ```

### Déploiement sur Replit

Talk2Me est déjà optimisé pour fonctionner sur Replit :

1. Assurez-vous que le workflow "Start application" est correctement configuré
2. Allez dans l'onglet "Deployment" de votre Repl
3. Cliquez sur "Deploy to Replit"
4. Votre application sera disponible à l'URL `https://votreapp.username.repl.co`

Pour personnaliser le domaine :
1. Allez dans les paramètres du Repl
2. Sélectionnez "Custom domain"
3. Suivez les instructions pour configurer votre domaine

## Conseils de Déploiement

### HTTPS

Pour une application de messagerie, HTTPS est crucial. Options :

- Utilisez un service qui fournit HTTPS par défaut (Heroku, Vercel, Netlify)
- Configurez Let's Encrypt avec Certbot sur votre propre serveur
- Utilisez Cloudflare comme proxy pour gérer les certificats SSL

### Configuration de Base de Données

Pour une application en production :

1. Utilisez une base de données PostgreSQL hébergée :
   - Services gérés : Amazon RDS, Google Cloud SQL, DigitalOcean Managed Databases
   - Services spécialisés : Neon, Supabase

2. Configurez les migrations de base de données :
   ```bash
   npm run migrate
   ```

### Mise en Cache et CDN

Pour améliorer les performances :

1. Configurez un CDN comme Cloudflare ou AWS CloudFront
2. Activez la mise en cache des assets statiques dans votre serveur web
3. Configurez les en-têtes d'expiration appropriés pour vos fichiers statiques

---

© 2025 MIGUELITO DevCode - Tous droits réservés