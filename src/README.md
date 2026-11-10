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

Le frontend d'origine reste intact. Les écrans de connexion, panier complet, commandes et administration devront être raccordés à cette API lors d'une étape frontend séparée, en préservant les styles actuels.
