# E-SOURCE — Backend PHP / MySQL

Cette livraison pose les fondations backend dans `src/`, sur la branche `feat/src-backend-foundation`. Le design existant, `style.css`, les maquettes et les scripts frontend d'origine ne sont pas modifiés.

## Structure
- `api/index.php` : API JSON.
- `config/config.example.php` : modèle de configuration.
- `config/config.php` : à créer localement ; ne jamais versionner.
- `database/schema.sql` : schéma MySQL.

## Installation XAMPP
1. Placer le dépôt dans `htdocs/E-source`, démarrer Apache et MySQL.
2. Créer la base `e_source` avec interclassement `utf8mb4_unicode_ci`.
3. Importer `src/database/schema.sql` dans phpMyAdmin.
4. Copier `src/config/config.example.php` en `src/config/config.php`, puis saisir les paramètres MySQL.
5. Créer un utilisateur MySQL dédié à l'application ; éviter `root` en production.
6. Tester `http://localhost/E-source/src/api/index.php?action=health`.

PHP 8.1+ et extensions PDO, PDO_MYSQL et iconv recommandés.

## Actions API
Toutes les réponses sont JSON. Paramètre : `?action=...`.
- GET `health`, `csrf`, `me`, `categories`, `products`, `cart`, `orders`
- POST `register`, `login`, `logout`, `cart`, `orders`
- PATCH/DELETE `cart`
- Admin : GET `admin/products`, `admin/orders`, `admin/customers`; POST/PATCH/DELETE `admin/products`; POST `admin/categories`; PATCH `admin/orders`, `admin/customers`.

Les actions qui modifient des données exigent le jeton retourné par GET `csrf` ou par les réponses d'authentification, dans l'en-tête `X-CSRF-Token). Les appels utilisant les sessions doivent conserver les cookies (`credentials: 'same-origin'`).

## Premier administrateur
Créer normalement un compte via l'inscription, puis exécuter une seule fois dans phpMyAdmin :
```sql
UPDATE users SET role='admin' WHERE email='adresse-admin@exemple.cd';
```
Remplacer par l'adresse exacte du compte à promouvoir.

## Paiements
Les modes espèces (`cash`), Mobile Money (`mobile_money`) et crédit (`credit`) sont représentés. Cette API n'exécute pas de transfert Mobile Money : il faudra choisir un prestataire, obtenir ses accès API et intégrer ses notifications de paiement. Le crédit est refusé par défaut ; un administrateur peut autoriser un client habituel via `credit_eligible`. Les plafonds et échéances restent à définir avec la boutique.

## Sécurité et limites
Mots de passe hachés, requêtes PDO préparées, sessions renouvelées à la connexion, cookies HttpOnly/SameSite, contrôle CSRF et rôle admin côté serveur. Le stock est contrôlé et décrémenté dans une transaction. Les erreurs internes sont journalisées.
Avant mise en production : HTTPS obligatoire, limitation des tentatives de connexion, journal d'audit, sauvegardes, tests automatisés, règles CORS strictes et intégration Mobile Money réelle.

## Frontend raccordé
Le fichier `index.html` conserve la structure visuelle du catalogue. `script.js` consomme désormais l'API PHP pour charger les produits depuis MySQL, gérer les comptes (inscription/connexion/déconnexion), le panier, les commandes et les écrans d'administration (produits, catégories, commandes, clients et autorisation de crédit). Les ajouts de styles dans `style.css` servent uniquement aux panneaux fonctionnels et reprennent les couleurs et polices existantes.

Pour tester localement :
1. Installer et configurer PHP/MySQL selon les étapes précédentes.
2. Ouvrir le site via Apache, par exemple `http://localhost/E-source/` (ne pas ouvrir `index.html` directement avec `file://`).
3. Vérifier l'API à `http://localhost/E-source/src/api/index.php?action=health`.
4. Créer un compte, ajouter des produits dans la base via phpMyAdmin ou l'espace admin, puis tester panier et commande.
5. Pour l'administration, promouvoir un compte de confiance avec la requête SQL de la section « Premier administrateur », puis se reconnecter.

Les commandes espèces et crédit sont enregistrées côté boutique. Le choix Mobile Money est actuellement une demande enregistrée en attente de traitement manuel : aucun paiement électronique réel n'est encore déclenché. La validation/enregistrement des paiements, les reçus et l'intégration du prestataire Mobile Money restent à réaliser. Cette livraison n'a pas été exécutée dans un environnement PHP/MySQL réel ; effectuer les essais ci-dessus avant toute mise en production.
