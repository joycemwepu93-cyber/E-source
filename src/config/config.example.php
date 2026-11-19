<?php
/**
 * Exemple de configuration E-SOURCE.
 * Copier ce fichier sous le nom config.php sur le serveur,
 * puis remplacer chaque valeur par les informations MySQL du panneau d'hébergement.
 * Ne jamais publier config.php ni y placer des identifiants dans Git.
 */
return [
    'database' => [
        // Utiliser le hostname MySQL donné par l'hébergeur, pas localhost par défaut.
        'host' => 'MYSQL_HOSTNAME_FOURNI_PAR_HEBERGEUR',
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
