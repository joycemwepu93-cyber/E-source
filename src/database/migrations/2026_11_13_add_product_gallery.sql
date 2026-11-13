-- Galerie de photos complémentaires pour chaque produit E-SOURCE
-- Exécuter une seule fois sur la base de données existante.
ALTER TABLE products ADD COLUMN gallery_images TEXT NULL;
