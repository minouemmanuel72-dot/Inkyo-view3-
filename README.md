# Mangi

Réseau social des mangakas : publier ses planches, faire découvrir des mangas, soutenir les artistes et les rémunérer par Mobile Money.

Ce dépôt contient l'application mobile (Expo, React Native, TypeScript) et sa base de données (Supabase).

## État du projet : semaines 1 à 4 (en cours)

- Création de compte et connexion avec trois rôles : mangaka, éclaireur, lecteur.
- Les 4 onglets : Pour toi, Commandes, Messages, Mon compte.
- Mode démo : sans serveur configuré, l'application fonctionne sur le téléphone seul.
- Base de données prête (utilisateurs, publications, transactions) avec règles de sécurité.
- Publier des planches (jusqu'à 8 images) ou un statut, lues par glissement dans le fil.
- Smart Repost : « Partager sur mon profil » crée un repost qui montre l'œuvre d'origine et son créateur.
- Éclaireurs : leur publication renvoie obligatoirement vers un manga, avec un bouton « Ouvrir le manga ».

Pas encore faits : les vidéos courtes (prochaine étape), les likes et commentaires, les paiements, la modération.
Rien n'est destiné au public pour l'instant.

En mode démo, les images choisies restent sur le téléphone. Elles peuvent disparaître si Android vide son cache :
c'est normal, la vraie sauvegarde passe par Supabase.

## Mise en place depuis un téléphone

### 1. Déposer les fichiers

1. Dans le dépôt, appuie sur **Add file**, puis **Create new file**.
2. Dans le nom du fichier, écris `.github/workflows/unpack.yml` (les `/` créent les dossiers).
3. Colle le contenu du fichier `unpack.yml`, puis **Commit changes**.
4. Appuie sur **Add file**, puis **Upload files**, ajoute `upload.zip`, puis **Commit changes**.
5. Ouvre l'onglet **Actions** : le robot « Décompresser upload.zip » range tous les fichiers.

### 2. Créer le robot qui construit l'application

1. **Add file**, **Create new file**, nom : `.github/workflows/build-apk.yml`.
2. Colle le contenu du fichier `build-apk.yml`, puis **Commit changes**.

### 3. Construire l'APK

1. Onglet **Actions**, choisis **Construire l'APK Android**, appuie sur **Run workflow**.
   Sur téléphone, active « Version pour ordinateur » dans le menu du navigateur si le bouton n'apparaît pas.
2. Attends 10 à 20 minutes.
3. Sur la page principale du dépôt, ouvre **Releases**, télécharge le fichier `.apk` et installe-le.
   Android demandera d'autoriser l'installation depuis ton navigateur, une seule fois.

### 4. Brancher la vraie base de données (optionnel, après le premier test)

1. Crée un projet gratuit sur supabase.com.
2. Ouvre **SQL Editor**, colle le contenu de `supabase/schema.sql`, appuie sur **Run**.
   Fais la même chose avec `supabase/semaine3.sql` (il crée le dossier des images).
3. Dans **Authentication**, **Providers**, **Email**, désactive « Confirm email » pendant les tests.
4. Dans **Project Settings**, **API**, copie l'adresse du projet et la clé `anon`.
5. Dans GitHub, **Settings**, **Secrets and variables**, **Actions**, crée deux secrets :
   `SUPABASE_URL` et `SUPABASE_ANON_KEY`.
6. Relance **Construire l'APK Android**.

## Plan de développement

| Semaines | Contenu |
| --- | --- |
| 1-2 | Comptes, rôles, navigation, base de données |
| 3-4 | Publication de planches et vidéos, carrousel, Smart Repost, contenu des éclaireurs |
| 5-6 | Coins simulés, contenus payants, séquestre, partage 85 % / 15 %, distribution équitable |
| 7 | Mangigi : accueil guidé, détection des abus, avertissements |
| 8 | Retrait simulé, tests de bout en bout |

Les paiements restent simulés. Le vrai Mobile Money se branchera à la fin dans un seul module, quand les autorisations légales seront prêtes.
