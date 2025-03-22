# Guide de Maintenance et Mise à Jour - Talk2Me

**Copyright © 2025 MIGUELITO DevCode**

Ce document décrit les procédures de maintenance et de mise à jour de l'application Talk2Me.

## Structure du Projet

```
.
├── client/               # Code frontend
│   ├── src/              # Code source React
│   │   ├── components/   # Composants d'UI
│   │   ├── hooks/        # Hooks personnalisés 
│   │   ├── lib/          # Utilitaires et clients
│   │   ├── pages/        # Pages de l'application 
│   │   └── ...
│   └── index.html        # Point d'entrée HTML
├── server/               # Code backend
│   ├── index.ts          # Point d'entrée du serveur
│   ├── routes.ts         # Routes API et WebSockets
│   ├── storage.ts        # Couche d'accès aux données
│   └── vite.ts           # Configuration Vite
├── shared/               # Code partagé entre client et serveur
│   └── schema.ts         # Schémas de données et types
└── diverses configurations...
```

## Environnement de Développement

### Prérequis

- Node.js (v16+)
- npm ou yarn
- PostgreSQL (optionnel, pour la production)

### Installation locale

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-organisation/talk2me.git
   cd talk2me
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Lancer l'application en mode développement :
   ```bash
   npm run dev
   ```

## Mise à Jour des Dépendances

### Mises à jour régulières

Il est recommandé de mettre à jour régulièrement les dépendances pour bénéficier des corrections de sécurité et des améliorations de performance :

```bash
# Vérifier les mises à jour disponibles
npm outdated

# Mettre à jour les dépendances
npm update
```

### Mises à jour majeures

Pour les mises à jour majeures, il est préférable de procéder par étapes :

1. Créer une branche dédiée :
   ```bash
   git checkout -b update-dependencies
   ```

2. Mettre à jour les dépendances une par une :
   ```bash
   npm install dependency@latest --save
   ```

3. Tester l'application après chaque mise à jour majeure.

4. Fusionner la branche une fois que tout fonctionne correctement.

## Processus de Déploiement

### Préparation du build

1. Générer un build de production :
   ```bash
   npm run build
   ```

2. Tester le build :
   ```bash
   npm run serve
   ```

### Déploiement sur un serveur

1. Configurer les variables d'environnement sur le serveur :
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgres://user:password@host:port/database
   ```

2. Transférer les fichiers de build sur le serveur.

3. Installer les dépendances de production :
   ```bash
   npm ci --production
   ```

4. Démarrer l'application :
   ```bash
   node dist/server/index.js
   ```

### Utilisation de PM2 (recommandé)

Pour une meilleure gestion des processus et des redémarrages automatiques :

1. Installer PM2 :
   ```bash
   npm install -g pm2
   ```

2. Créer un fichier de configuration `ecosystem.config.js` :
   ```javascript
   module.exports = {
     apps: [{
       name: "talk2me",
       script: "./dist/server/index.js",
       env: {
         NODE_ENV: "production",
         PORT: 5000
       },
       instances: "max",
       exec_mode: "cluster",
       autorestart: true,
       watch: false,
       max_memory_restart: "1G"
     }]
   };
   ```

3. Démarrer l'application avec PM2 :
   ```bash
   pm2 start ecosystem.config.js
   ```

4. Configurer le démarrage automatique :
   ```bash
   pm2 startup
   pm2 save
   ```

## Gestion de la Base de Données

### Migration vers PostgreSQL

Pour passer du stockage en mémoire à PostgreSQL :

1. Créer une base de données PostgreSQL :
   ```sql
   CREATE DATABASE talk2me;
   ```

2. Configurer la variable d'environnement `DATABASE_URL` :
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/talk2me
   ```

3. Générer et appliquer les migrations Drizzle :
   ```bash
   npx drizzle-kit generate:pg
   node -r ts-node/register scripts/migrate.ts
   ```

4. Modifier le fichier `server/index.ts` pour utiliser PostgresStorage au lieu de MemStorage.

### Sauvegardes de Base de Données

Configurer des sauvegardes régulières :

```bash
# Créer un script de sauvegarde (backup.sh)
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_DIR="/path/to/backups"
DB_NAME="talk2me"
DB_USER="username"

pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/$DB_NAME-$TIMESTAMP.sql
```

Automatiser avec cron :
```
0 2 * * * /path/to/backup.sh
```

## Monitoring et Maintenance

### Logs

Configurer un système de rotation des logs :

```bash
# Installation de Winston pour la gestion des logs
npm install winston winston-daily-rotate-file
```

### Monitoring avec PM2

Visualiser les métriques de l'application :
```bash
pm2 monit
```

Intégrer PM2 avec Keymetrics pour un monitoring avancé :
```bash
pm2 link <public_key> <secret_key>
```

### Surveillance des Performances

Utiliser des outils comme New Relic ou DataDog pour surveiller les performances de l'application et recevoir des alertes en cas de problème.

## Tests

### Exécution des Tests

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests avec couverture
npm run test:coverage
```

### Tests d'Intégration Continue

Configurer les tests d'intégration continue avec GitHub Actions ou GitLab CI pour exécuter les tests automatiquement à chaque commit.

## Améliorations Futures

### Fonctionnalités Potentielles

1. **Discussions de Groupe** :
   - Ajouter une table `groups` pour stocker les groupes
   - Ajouter une table `group_members` pour gérer les membres
   - Modifier le système de messages pour supporter les messages de groupe

2. **Partage de Fichiers** :
   - Intégrer un système de stockage cloud (AWS S3, Google Cloud Storage)
   - Ajouter un champ `attachments` à la table `messages`
   - Implémenter la gestion des types MIME et des prévisualisations

3. **Appels Vidéo** :
   - Intégrer WebRTC pour les appels P2P
   - Ajouter une signalisation via WebSockets
   - Mettre en place un serveur TURN pour la traversée NAT

### Optimisation des Performances

1. **Mise en Cache** :
   - Ajouter Redis pour mettre en cache les données fréquemment accédées
   - Configurer un TTL (Time To Live) approprié pour chaque type de données

2. **Optimisation des Requêtes** :
   - Ajouter des index pour accélérer les requêtes fréquentes
   - Pagination pour les listes de messages et de contacts

3. **Scaling Horizontal** :
   - Utiliser un équilibreur de charge pour distribuer le trafic
   - Configurer Redis pour la gestion des sessions et des WebSockets

## Résolution des Problèmes Courants

### Problèmes de Connexion WebSocket

Si les utilisateurs rencontrent des problèmes de connexion WebSocket :

1. Vérifier la configuration du proxy inverse (Nginx, Apache) pour s'assurer qu'il transmet correctement les WebSockets.
2. Vérifier que le chemin WebSocket ('/ws') est correctement configuré.
3. Examiner les logs côté serveur pour détecter d'éventuelles erreurs.

### Problèmes de Performance

Si l'application devient lente :

1. Vérifier l'utilisation de la mémoire et du CPU avec `pm2 monit`.
2. Examiner les requêtes lentes dans les logs de la base de données.
3. Envisager d'ajouter des index supplémentaires ou d'optimiser les requêtes existantes.
4. Augmenter les ressources du serveur si nécessaire.

### Erreurs Côté Client

Pour les erreurs côté client :

1. Vérifier la console du navigateur pour les erreurs JavaScript.
2. S'assurer que tous les assets sont correctement chargés.
3. Vérifier la compatibilité du navigateur.

## Procédures de Sauvegarde et Restauration

### Sauvegarde Complète

Pour une sauvegarde complète de l'application :

1. Sauvegarder la base de données :
   ```bash
   pg_dump -U username talk2me > talk2me_db_backup.sql
   ```

2. Sauvegarder les fichiers de l'application :
   ```bash
   tar -czvf talk2me_app_backup.tar.gz /path/to/application
   ```

### Restauration

Pour restaurer l'application à partir des sauvegardes :

1. Restaurer les fichiers de l'application :
   ```bash
   tar -xzvf talk2me_app_backup.tar.gz -C /path/to/destination
   ```

2. Restaurer la base de données :
   ```bash
   psql -U username talk2me < talk2me_db_backup.sql
   ```

## Mises à Jour de Sécurité

Il est crucial de maintenir l'application à jour concernant les vulnérabilités de sécurité :

1. Vérifier régulièrement les vulnérabilités :
   ```bash
   npm audit
   ```

2. Appliquer les correctifs de sécurité :
   ```bash
   npm audit fix
   ```

3. Pour les vulnérabilités qui ne peuvent pas être corrigées automatiquement :
   ```bash
   npm audit fix --force
   ```
   Attention : Cette commande peut casser l'application en cas de changements majeurs.

## Contacts et Support

Pour toute question ou problème concernant la maintenance de l'application, veuillez contacter :

- Support technique : support@miguelitodevcode.com
- Développeur principal : dev@miguelitodevcode.com

---

© 2025 MIGUELITO DevCode - Tous droits réservés