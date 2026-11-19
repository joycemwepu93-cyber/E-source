# Déploiement en ligne — E-SOURCE

## État de la fonction Mobile Money

L'espace administrateur permet de configurer les numéros de réception Airtel Money, M-Pesa et Orange Money. Au paiement, le client voit le numéro actif, choisit l'opérateur et saisit la référence de sa transaction. La commande reste **à vérifier** jusqu'à ce que l'administrateur vérifie réellement le versement dans le compte marchand puis clique sur **Confirmer paiement**.

Cette version est un flux de paiement manuel avec validation par l'administrateur. Elle n'appelle pas encore l'API Netikash et ne confirme jamais automatiquement un transfert. Pour activer le paiement automatique, il faudra un compte marchand Netikash, les identifiants de test puis de production, et l'intégration des endpoints exacts de création et de vérification de paiement.

## 1. Préparer l'hébergement InfinityFree

1. Créer un compte sur https://www.infinityfree.com/.
2. Créer un compte d'hébergement et choisir un sous-domaine gratuit ou rattacher un domaine.
3. Dans le panneau de contrôle, activer le certificat SSL gratuit.
4. Ouvrir **MySQL Databases**, créer une base de données et noter exactement :
   - le nom complet de la base ;
   - le nom d'utilisateur MySQL ;
   - le mot de passe MySQL ;
   - le nom du serveur MySQL (hostname fourni par InfinityFree, pas `localhost`).

InfinityFree annonce PHP et MySQL ainsi que le SSL gratuit. Vérifier les versions PHP/extensions disponibles dans le panneau avant la mise en ligne.

## 2. Sauvegarder la base locale

1. Ouvrir phpMyAdmin local.
2. Sélectionner la base `e_source`.
3. Cliquer sur **Exporter**, choisir SQL et télécharger le fichier.
4. Garder une copie de sauvegarde sans la publier sur GitHub.

## 3. Envoyer les fichiers du site

1. Télécharger le dépôt depuis https://github.com/joycemwepu93-cyber/E-source.
2. Décompresser le projet.
3. Avec le gestionnaire de fichiers InfinityFree ou FileZilla, envoyer le contenu du projet dans le dossier `htdocs` du domaine.
4. Vérifier que `index.html`, `account.js`, `script.js`, `style.css`, `admi/` et `src/` se trouvent directement dans ce dossier.
5. Ne pas téléverser de sauvegarde SQL dans un dossier public du site.

Les photos déjà suivies dans Git sont incluses dans le dépôt. Pour les nouvelles photos de produits, utiliser des URLs HTTPS accessibles publiquement ou un stockage de fichiers compatible avec l'hébergement.

## 4. Importer la base distante

1. Ouvrir le phpMyAdmin fourni par InfinityFree.
2. Sélectionner la base distante créée à l'étape 1.
3. Importer l'export SQL local.
4. Puis exécuter une seule fois le fichier :
   `src/database/migrations/2026_11_19_add_mobile_money_settings.sql`

Cette migration ajoute les colonnes Mobile Money et la table de configuration. Si vous créez une base entièrement neuve à partir du schéma actuel `src/database/schema.sql`, ne relancez pas cette migration : les colonnes et la table sont déjà incluses.

Si la migration a déjà été exécutée, ne la relancez pas.

## 5. Configurer la connexion PHP/MySQL

Dans le dossier `src/config/`, copier `config.example.php` vers `config.php`. Modifier uniquement les valeurs de connexion avec celles données par InfinityFree :

- `host` : hostname MySQL affiché dans le panneau ;
- `port` : généralement 3306, sauf indication différente ;
- `name` : nom complet de la base ;
- `username` : utilisateur MySQL complet ;
- `password` : mot de passe MySQL ;
- `environment` : mettre `production`.

Ne jamais commiter ni partager `src/config/config.php`. Ne pas mettre les mots de passe ou les clés API dans JavaScript.

## 6. Créer / vérifier le compte administrateur

Après import de la base, vérifier dans phpMyAdmin que le compte administrateur existe et que son champ `role` vaut exactement `admin` et que `is_active` vaut 1. Ne pas publier le mot de passe administrateur. Utiliser un mot de passe fort et unique.

## 7. Configurer les numéros de réception

1. Ouvrir `https://VOTRE-DOMAINE/admi/`.
2. Se connecter avec le compte administrateur.
3. Ouvrir **Paramètres de paiement**.
4. Activer uniquement les opérateurs pour lesquels la boutique possède un compte marchand autorisé.
5. Saisir les numéros de réception et enregistrer.
6. Faire une commande de test sans transférer d'argent réel pour vérifier l'affichage du numéro et le parcours de commande.

Ne jamais confirmer un paiement sur la seule base d'une capture d'écran ou d'une référence communiquée par le client : vérifier le crédit effectif dans le compte marchand.

## 8. Limite importante d'InfinityFree pour les paiements automatiques

Le support InfinityFree indique que les appels entrants automatisés venant de services tiers, notamment les webhooks, sont bloqués sur l'offre gratuite. Les appels HTTPS sortants depuis PHP vers une API externe peuvent fonctionner, mais cela ne permet pas à Netikash de notifier directement le site par webhook.

Sources :
- https://forum.infinityfree.com/t/can-i-make-post-requests-to-an-endpoint-on-my-website/113951
- https://forum.infinityfree.com/t/why-is-api-access-not-working-on-my-website/115198/1
- https://developer.netikash.com/

Donc :
- le paiement manuel par numéro configuré et confirmation par l'administrateur peut être utilisé comme première étape ;
- pour une intégration Netikash automatique et fiable, choisir un hébergement qui accepte les webhooks HTTPS entrants ou mettre le webhook sur un service backend externe adapté ;
- les identifiants Netikash doivent rester dans la configuration PHP côté serveur, jamais dans les fichiers JavaScript ou sur GitHub.

## 9. Contrôles avant ouverture au public

- Vérifier le site en HTTPS.
- Tester inscription, connexion, panier, commande et espace admin.
- Tester l'affichage des produits et des photos.
- Tester les trois opérateurs en mode de simulation, sans argent réel.
- Vérifier qu'une commande Mobile Money reste « à vérifier » avant validation par l'administrateur.
- Faire une sauvegarde de la base et des fichiers avant chaque mise à jour.
- Ne pas considérer GitHub comme une sauvegarde de la base de données ou des photos téléversées directement sur le serveur.
