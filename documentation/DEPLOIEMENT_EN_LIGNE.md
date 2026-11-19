# Déploiement en ligne — E-SOURCE (InfinityFree)

Ce guide décrit le déploiement de la version PHP/MySQL actuelle sur un hébergement InfinityFree.

## État réel des paiements

La version actuelle propose le paiement en espèces et la collecte d'une référence Mobile Money pour Airtel Money, M-Pesa et Orange Money. L'administrateur configure les numéros de réception dans l'espace d'administration et vérifie le versement dans son compte marchand avant de confirmer le paiement.

**L'API NetiKash n'est pas intégrée dans cette version.** Aucun paiement automatique ne doit être annoncé ni considéré comme effectué. L'intégration exige un compte marchand NetiKash, des identifiants API, les spécifications exactes des opérations disponibles et un hébergement qui accepte les notifications nécessaires.

## 1. Vérifier les prérequis de l'hébergement

Dans le panneau InfinityFree, vérifiez :
- le domaine est actif et le certificat SSL est activé ;
- PHP 8.1 ou supérieur est sélectionné (le code utilise des fonctionnalités PHP 8.1) ;
- l'extension PDO MySQL est disponible ;
- une base MySQL a été créée.

Ne mettez jamais les identifiants de base de données ou les secrets API dans GitHub, JavaScript ou une capture d'écran publique.

## 2. Base de données

Dans **MySQL Databases**, notez les valeurs exactes affichées :
- nom complet de la base ;
- nom d'utilisateur MySQL ;
- hostname / serveur MySQL ;
- mot de passe MySQL.

Le hostname n'est généralement pas `localhost`. Utilisez exactement celui donné par InfinityFree.

### Nouvelle base vide

Le fichier source de référence est `src/database/schema.sql`. Dans phpMyAdmin :
1. sélectionnez la base distante ;
2. ouvrez **Importer** ;
3. choisissez le fichier `src/database/schema.sql` téléchargé depuis GitHub ;
4. lancez l'importation et vérifiez les tables `users`, `categories`, `products`, `carts`, `cart_items`, `orders`, `order_items`, `payments` et `payment_settings`.

Ce schéma inclut déjà `products.gallery_images`, les champs Mobile Money de `orders` et la table `payment_settings`. **Ne lancez pas ensuite les migrations correspondantes**, sinon les colonnes pourraient être ajoutées deux fois.

Le schéma crée les catégories de base et les trois opérateurs désactivés. Il ne crée pas de compte administrateur et ne contient pas les produits ni les clients de la base locale.

### Si vous migrez une base locale existante

Exportez la base locale complète depuis phpMyAdmin, puis importez cet export dans la base distante. Avant cela, vérifiez que la structure exportée comprend les colonnes et tables du schéma actuel. Ne réimportez pas le schéma complet par-dessus une base déjà migrée et ne lancez pas les migrations deux fois.

## 3. Transférer les fichiers

1. Téléchargez le dépôt depuis https://github.com/joycemwepu93-cyber/E-source (branche `main`).
2. Décompressez l'archive.
3. Ouvrez le gestionnaire de fichiers InfinityFree ou utilisez FTP.
4. Entrez dans le dossier `htdocs` du domaine `e-source.fwh.is`.
5. Téléversez **le contenu** du dépôt directement dans `htdocs`, pas un dossier E-source imbriqué.

À la racine de `htdocs`, vous devez retrouver notamment :
- `index.html`
- `script.js`, `account.js`, `style.css`
- le dossier `admi/`
- le dossier `src/`
- le fichier `.htaccess`

Les photos déjà suivies dans Git sont référencées dans le dépôt. Les images ajoutées ensuite doivent avoir une URL HTTPS publique ou être téléversées sur un stockage accessible.

## 4. Créer la configuration privée PHP

Dans `htdocs/src/config/` :
1. copiez `config.example.php` ;
2. nommez la copie `config.php` ;
3. ouvrez `config.php` et remplacez les valeurs par celles de votre panneau InfinityFree.

Exemple de structure (valeurs fictives : ne les copiez pas comme identifiants réels) :

```php
<?php
return [
    'database' => [
        'host' => 'MYSQL_HOSTNAME_FOURNI_PAR_INFINITYFREE',
        'port' => 3306,
        'name' => 'NOM_COMPLET_DE_LA_BASE',
        'username' => 'UTILISATEUR_MYSQL',
        'password' => 'MOT_DE_PASSE_MYSQL',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'environment' => 'production',
        'session_name' => 'e_source_session',
        'allowed_origins' => [],
    ],
];
```

Enregistrez le fichier. Le fichier `src/config/.gitignore` exclut déjà `config.php` du dépôt Git et `src/config/.htaccess` bloque l'accès web direct au dossier de configuration. **Ne publiez jamais ce fichier.**

## 5. Vérifier la connexion

Après le transfert et la configuration, ouvrez :
- boutique : `https://e-source.fwh.is/`
- administration : `https://e-source.fwh.is/admi/`
- test API : `https://e-source.fwh.is/src/api/index.php?action=health`

Le test API doit retourner un JSON avec `"success":true` et `"database":"connected"`. Si le serveur affiche une erreur, vérifiez d'abord le hostname, le nom de base, l'utilisateur, le mot de passe, la version PHP et PDO MySQL.

## 6. Compte administrateur et catalogue

Le schéma SQL crée une base vide : aucun compte administrateur ni produit n'est automatiquement ajouté. Pour conserver les comptes et les produits de votre boutique locale, exportez puis importez la base locale complète, après avoir vérifié sa compatibilité avec le schéma actuel.

Si vous partez d'une base vide, créez le premier administrateur par une procédure sécurisée qui génère un hash avec `password_hash()` et attribue le rôle `admin`. N'insérez jamais un mot de passe en clair et ne publiez pas de compte administrateur ou de mot de passe par défaut.

## 7. Configurer les moyens de paiement

Une fois connecté à `/admi/` :
1. ouvrez **Paramètres de paiement** ;
2. activez uniquement les opérateurs pour lesquels la boutique dispose d'un compte marchand ;
3. saisissez les numéros de réception exacts ;
4. enregistrez les paramètres.

Effectuez d'abord des commandes de test sans transfert d'argent réel. Pour une commande Mobile Money, vérifiez réellement le versement dans le compte marchand avant de cliquer sur **Confirmer paiement**.

## 8. Limites pour l'intégration NetiKash

Cette version n'appelle pas l'API NetiKash. La documentation du fournisseur est disponible sur https://developer.netikash.com/. Avant toute intégration, obtenir les accès marchands et développeur, les identifiants de test, les opérations/endpoints et les règles de signature/validation.

Le support InfinityFree indique des restrictions sur les requêtes entrantes automatisées / webhooks sur l'offre gratuite. Vérifiez les limites actuelles avec l'hébergeur avant de choisir cette offre pour des paiements automatisés. Pour une intégration fiable, utiliser un hébergement ou un backend qui accepte les webhooks HTTPS entrants et permet les appels HTTPS sortants.

## 9. Contrôles avant ouverture

- HTTPS actif et pages boutique/admin accessibles ;
- test API indiquant que MySQL est connecté ;
- inscription, connexion, panier et commande testés ;
- produits, photos et stocks vérifiés ;
- compte administrateur protégé par un mot de passe unique ;
- aucune clé API ni configuration privée dans GitHub ;
- paiements Mobile Money non confirmés sans vérification effective ;
- sauvegarde des fichiers et de la base avant chaque mise à jour.
