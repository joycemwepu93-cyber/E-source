-- E-SOURCE: configuration des numéros Mobile Money et références de paiement
ALTER TABLE orders
  ADD COLUMN payment_provider VARCHAR(32) NULL AFTER payment_method,
  ADD COLUMN payment_reference VARCHAR(120) NULL AFTER payment_provider;

CREATE TABLE IF NOT EXISTS payment_settings (
  provider VARCHAR(32) NOT NULL PRIMARY KEY,
  label VARCHAR(60) NOT NULL,
  phone_number VARCHAR(30) NOT NULL DEFAULT '',
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  instructions VARCHAR(500) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO payment_settings(provider,label,phone_number,enabled,instructions) VALUES
('airtel_money','Airtel Money','',0,'Envoyez le montant exact puis indiquez la référence de transaction.'),
('m_pesa','M-Pesa','',0,'Envoyez le montant exact puis indiquez la référence de transaction.'),
('orange_money','Orange Money','',0,'Envoyez le montant exact puis indiquez la référence de transaction.')
ON DUPLICATE KEY UPDATE label=VALUES(label);
