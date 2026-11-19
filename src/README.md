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
Les modes espèces (`cash`), Mobile Money (`mobile_money`) et crédit (`credit`) sont représentés. L'administration permet de configurer les numéros Airtel Money, M-Pesa et Orange Money. Le client voit le numéro actif, choisit l'opérateur et saisit sa référence ; la commande reste en attente jusqu'à vérification manuelle par l'administrateur. Cette version ne déclenche pas de transfert et ne vérifie pas automatiquement les paiements via Netikash. Pour le paiement automatique, obtenir les accès marchand/API et intégrer les endpoints et notifications du prestataire. Pour une base existante, exécuter une fois `database/migrations/2026_11_19_add_mobile_money_settings.sql`. Le crédit est refusé par défaut ; un administrateur peut autoriser un client habituel via `credit_eligible`. Les plafonds et échéances restent à définir avec la boutique.

## Factures client
Après validation, chaque commande conserve son statut habituel « En attente ». Le client peut ouvrir sa facture depuis la confirmation ou l’historique des commandes. Le bouton ouvre une page imprimable ; dans la boîte d’impression du navigateur, choisir « Enregistrer au format PDF ». L’API vérifie que la commande appartient au client connecté. Aucune migration SQL n’est nécessaire.

## Paiement simulé Netikash (sans compte)
Le dépôt peut être testé sans compte marchand ni clés API. Cette simulation est volontairement séparée de l'intégration réelle : elle ne contacte jamais Netikash et ne transfère aucun argent.

Pour l'activer uniquement en local, dans `src/config/config.php` (fichier local non versionné), régler `app.environment` sur `development` et `payment.simulation_enabled` sur `true`. La valeur par défaut dans `config.example.php` reste désactivée. Ne jamais activer cette option en production.

Le backend accepte alors une commande Mobile Money avec `payment_provider: "netikash_test"` sans numéro marchand. Après création de commande, appeler en POST `?action=simulate-payment` avec le jeton CSRF et le cookie de session, et le JSON `{"order_id": ID, "outcome": "success"}` ou `{"order_id": ID, "outcome": "failed"}`. Le endpoint vérifie que la commande appartient au client connecté, qu'elle est bien une commande de test en attente et qu'elle n'a pas déjà été traitée. Il enregistre un paiement de test et met à jour le statut. Il ne doit jamais être exposé/activé sur un serveur public.

Cette première étape prépare et sécurise le moteur backend de simulation. Le raccordement du bouton dans l'interface de paiement reste une étape frontend distincte. La vraie connexion Netikash (OAuth, demande de paiement, webhook signé et vérification serveur) sera ajoutée plus tard avec les identifiants Sandbox officiels.

## Sécurité et limites
Mots de passe hachés, requêtes PDO préparées, sessions renouvelées à la connexion, cookies HttpOnly/SameSite, contrôle CSRF et rôle admin côté serveur. Le stock est contrôlé et décrémenté dans une transaction. Les erreurs internes sont journalisées.
Avant mise en production : HTTPS obligatoire, limitation des tentatives de connexion, journal d'audit, sauvegardes, tests automatisés, règles CORS strictes et intégration Mobile Money réelle.

Le frontend d'origine reste intact. Les écrans de connexion, panier complet, commandes et administration devront être raccordés à cette API lors d'une étape frontend séparée, en préservant les styles actuels.
