-- ==============================================================================
-- Store Visiting - Live Database Dummy Seed Data (MySQL / MariaDB)
-- Fresh B2B Enterprise & Consumer Visitor Dataset (Different from Local Dev)
-- ==============================================================================

-- 1. Create Tables if they do not exist
CREATE TABLE IF NOT EXISTS `svt_stores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `site_url` VARCHAR(255) NOT NULL UNIQUE,
  `site_name` VARCHAR(255) NULL,
  `activation_ip` VARCHAR(64) NULL,
  `status` VARCHAR(32) DEFAULT 'Pending',
  `company_name` VARCHAR(255) NULL,
  `physical_address` TEXT NULL,
  `telephone` VARCHAR(64) NULL,
  `official_email` VARCHAR(128) NULL,
  `website` VARCHAR(255) NULL,
  `linkedin_url` VARCHAR(255) NULL,
  `twitter_url` VARCHAR(255) NULL,
  `industry` VARCHAR(128) NULL,
  `acquisition_channel` VARCHAR(128) NULL,
  `is_partner_store` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ip` (`activation_ip`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svt_visitor_hits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `target_store` VARCHAR(255) NOT NULL,
  `visitor_ip` VARCHAR(64) NOT NULL,
  `visitor_id` VARCHAR(128) NOT NULL,
  `matched_store_id` INT NULL,
  `page_url` VARCHAR(500) DEFAULT '/',
  `referrer` VARCHAR(500) DEFAULT 'Direct Navigation',
  `screen_res` VARCHAR(32) DEFAULT '1920x1080',
  `browser` VARCHAR(64) DEFAULT 'Chrome',
  `duration_seconds` INT DEFAULT 60,
  `visited_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_target_store` (`target_store`),
  INDEX `idx_matched_store` (`matched_store_id`),
  INDEX `idx_visitor_ip` (`visitor_ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `svt_ip_cache` (
  `ip_address` VARCHAR(64) PRIMARY KEY,
  `company_name` VARCHAR(255) NULL,
  `physical_address` TEXT NULL,
  `telephone` VARCHAR(64) NULL,
  `official_email` VARCHAR(128) NULL,
  `website` VARCHAR(255) NULL,
  `industry` VARCHAR(128) NULL,
  `country` VARCHAR(64) NULL,
  `city` VARCHAR(64) NULL,
  `source` VARCHAR(64) NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 2. Insert 8 New Unique B2B Enterprises (Different from Local Dev)
-- ==============================================================================
INSERT INTO `svt_stores` 
(`id`, `site_url`, `site_name`, `activation_ip`, `status`, `company_name`, `physical_address`, `telephone`, `official_email`, `website`, `linkedin_url`, `twitter_url`, `industry`, `acquisition_channel`, `is_partner_store`) 
VALUES
(101, 'https://se.com', 'Schneider Electric Storefront', '159.215.1.10', 'Watching', 'Schneider Electric SE', '35 Rue Joseph Monier, 92500 Rueil-Malmaison, France', '+33 1 41 29 70 00', 'contact@se.com', 'https://se.com', 'https://linkedin.com/company/schneider-electric', 'https://twitter.com/SchneiderElec', 'Energy Management & Automation', 'Google Organic Search', 1),
(102, 'https://bosch.com', 'Bosch Global Tech', '139.15.20.45', 'Verified', 'Bosch Global Software Technologies', 'Robert-Bosch-Platz 1, 70839 Gerlingen-Schillerhoehe, Germany', '+49 711 400 40990', 'corporate.communications@bosch.com', 'https://bosch.com', 'https://linkedin.com/company/bosch', 'https://twitter.com/BoschGlobal', 'Automotive & Industrial IoT', 'LinkedIn Referral', 1),
(103, 'https://abb.com', 'ABB Industrial Hub', '144.130.50.80', 'Watching', 'ABB Robotics & Motion Ltd', 'Affolternstrasse 44, 8050 Zurich, Switzerland', '+41 43 317 7111', 'contact.center@ch.abb.com', 'https://abb.com', 'https://linkedin.com/company/abb', 'https://twitter.com/ABBgroupnews', 'Industrial Automation & Power Grids', 'Google Organic Search', 0),
(104, 'https://hitachienergy.com', 'Hitachi Energy Portal', '133.140.22.90', 'Verified', 'Hitachi Energy Global Solutions', 'Brown-Boveri-Strasse 5, 8050 Zurich, Switzerland', '+41 58 588 3939', 'info@hitachienergy.com', 'https://hitachienergy.com', 'https://linkedin.com/company/hitachi-energy', 'https://twitter.com/HitachiEnergy', 'High-Voltage Smart Power Infrastructure', 'Direct Navigation', 0),
(105, 'https://honeywell.com', 'Honeywell Process Store', '199.111.45.12', 'Verified', 'Honeywell Process Solutions', '855 S Mint St, Charlotte, NC 28202, United States', '+1 704 627 6200', 'info@honeywell.com', 'https://honeywell.com', 'https://linkedin.com/company/honeywell', 'https://twitter.com/honeywell', 'Aerospace & Industrial Control Systems', 'Google Organic Search', 1),
(106, 'https://tcs.com', 'Tata Consultancy Services', '115.112.4.55', 'Watching', 'Tata Consultancy Services Ltd', 'TCS House, Raveline Street, Fort, Mumbai 400001, India', '+91 22 6778 9999', 'corporate.office@tcs.com', 'https://tcs.com', 'https://linkedin.com/company/tata-consultancy-services', 'https://twitter.com/TCS', 'Cloud Solutions & Cognitive Business Ops', 'Direct Navigation', 0),
(107, 'https://accenture.com', 'Accenture Operations', '147.243.1.20', 'Verified', 'Accenture Digital Enterprise', '1 Grand Canal Square, Grand Canal Harbour, Dublin 2, Ireland', '+353 1 646 2000', 'business.solutions@accenture.com', 'https://accenture.com', 'https://linkedin.com/company/accenture', 'https://twitter.com/Accenture', 'Management Consulting & Cloud Transformation', 'LinkedIn Referral', 1),
(108, 'https://infosys.com', 'Infosys Digital Storefront', '182.72.68.90', 'Verified', 'Infosys B2B Engineering Systems', 'Electronics City, Hosur Road, Bangalore 560100, India', '+91 80 2852 0261', 'askus@infosys.com', 'https://infosys.com', 'https://linkedin.com/company/infosys', 'https://twitter.com/Infosys', 'Enterprise Digital Platforms & AI', 'Google Organic Search', 0)
ON DUPLICATE KEY UPDATE 
  `company_name` = VALUES(`company_name`),
  `activation_ip` = VALUES(`activation_ip`),
  `physical_address` = VALUES(`physical_address`),
  `telephone` = VALUES(`telephone`),
  `official_email` = VALUES(`official_email`),
  `website` = VALUES(`website`),
  `industry` = VALUES(`industry`),
  `acquisition_channel` = VALUES(`acquisition_channel`);

-- ==============================================================================
-- 3. Insert Telemetry Hits for the Identified Companies
-- ==============================================================================

-- Schneider Electric Hits
INSERT INTO `svt_visitor_hits` (`target_store`, `visitor_ip`, `visitor_id`, `matched_store_id`, `page_url`, `referrer`, `screen_res`, `browser`, `duration_seconds`, `visited_at`) VALUES
('http://localhost/wordpress_practice', '159.215.1.10', 'usr_se_01', 101, '/pricing', 'https://www.google.com/search?q=enterprise+iot+power', '1920x1080', 'Chrome', 480, NOW() - INTERVAL 15 MINUTE),
('http://localhost/wordpress_practice', '159.215.1.10', 'usr_se_01', 101, '/product/industrial-cloud-gateway', 'Direct Navigation', '1920x1080', 'Chrome', 260, NOW() - INTERVAL 12 MINUTE),
('http://localhost/wordpress_practice', '159.215.1.10', 'usr_se_02', 101, '/case-studies', 'https://linkedin.com', '2560x1440', 'Edge', 190, NOW() - INTERVAL 8 MINUTE);

-- Bosch Global Hits
INSERT INTO `svt_visitor_hits` (`target_store`, `visitor_ip`, `visitor_id`, `matched_store_id`, `page_url`, `referrer`, `screen_res`, `browser`, `duration_seconds`, `visited_at`) VALUES
('http://localhost/wordpress_practice', '139.15.20.45', 'usr_bosch_91', 102, '/product/smart-sensor-array', 'https://www.google.de/search?q=smart+factory+sensors', '1920x1080', 'Firefox', 340, NOW() - INTERVAL 45 MINUTE),
('http://localhost/wordpress_practice', '139.15.20.45', 'usr_bosch_91', 102, '/contact-sales', 'Direct Navigation', '1920x1080', 'Firefox', 180, NOW() - INTERVAL 38 MINUTE);

-- ABB Robotics Hits
INSERT INTO `svt_visitor_hits` (`target_store`, `visitor_ip`, `visitor_id`, `matched_store_id`, `page_url`, `referrer`, `screen_res`, `browser`, `duration_seconds`, `visited_at`) VALUES
('http://localhost/wordpress_practice', '144.130.50.80', 'usr_abb_77', 103, '/our-plans', 'https://www.google.ch', '1920x1080', 'Chrome', 215, NOW() - INTERVAL 2 HOUR),
('http://localhost/wordpress_practice', '144.130.50.80', 'usr_abb_77', 103, '/features', 'Direct Navigation', '1920x1080', 'Chrome', 90, NOW() - INTERVAL 1 HOUR);

-- Hitachi Energy Hits
INSERT INTO `svt_visitor_hits` (`target_store`, `visitor_ip`, `visitor_id`, `matched_store_id`, `page_url`, `referrer`, `screen_res`, `browser`, `duration_seconds`, `visited_at`) VALUES
('http://localhost/wordpress_practice', '133.140.22.90', 'usr_hitachi_33', 104, '/product/high-voltage-transformer-monitor', 'https://google.co.jp', '3840x2160', 'Safari', 520, NOW() - INTERVAL 3 HOUR);

-- Honeywell Process Solutions Hits
INSERT INTO `svt_visitor_hits` (`target_store`, `visitor_ip`, `visitor_id`, `matched_store_id`, `page_url`, `referrer`, `screen_res`, `browser`, `duration_seconds`, `visited_at`) VALUES
('http://localhost/wordpress_practice', '199.111.45.12', 'usr_honeywell_11', 105, '/pricing', 'https://www.google.com/search?q=honeywell+compatible+scada', '1920x1080', 'Chrome', 310, NOW() - INTERVAL 4 HOUR),
('http://localhost/wordpress_practice', '199.111.45.12', 'usr_honeywell_11', 105, '/checkout', 'Direct Navigation', '1920x1080', 'Chrome', 290, NOW() - INTERVAL 4 HOUR);

-- TCS Hits
INSERT INTO `svt_visitor_hits` (`target_store`, `visitor_ip`, `visitor_id`, `matched_store_id`, `page_url`, `referrer`, `screen_res`, `browser`, `duration_seconds`, `visited_at`) VALUES
('http://localhost/wordpress_practice', '115.112.4.55', 'usr_tcs_54', 106, '/product/enterprise-api-connect', 'https://google.co.in', '1920x1080', 'Chrome', 175, NOW() - INTERVAL 5 HOUR);

-- Accenture Digital Enterprise Hits
INSERT INTO `svt_visitor_hits` (`target_store`, `visitor_ip`, `visitor_id`, `matched_store_id`, `page_url`, `referrer`, `screen_res`, `browser`, `duration_seconds`, `visited_at`) VALUES
('http://localhost/wordpress_practice', '147.243.1.20', 'usr_accenture_08', 107, '/case-studies/fintech-scaling', 'https://linkedin.com', '1920x1080', 'Edge', 410, NOW() - INTERVAL 6 HOUR),
('http://localhost/wordpress_practice', '147.243.1.20', 'usr_accenture_08', 107, '/pricing', 'Direct Navigation', '1920x1080', 'Edge', 230, NOW() - INTERVAL 6 HOUR);

-- Infosys Engineering Hits
INSERT INTO `svt_visitor_hits` (`target_store`, `visitor_ip`, `visitor_id`, `matched_store_id`, `page_url`, `referrer`, `screen_res`, `browser`, `duration_seconds`, `visited_at`) VALUES
('http://localhost/wordpress_practice', '182.72.68.90', 'usr_infy_92', 108, '/product/b2b-analytics-suite', 'https://google.com', '1920x1080', 'Chrome', 380, NOW() - INTERVAL 8 HOUR);

-- ==============================================================================
-- 4. Insert General Residential / Consumer Visitors (matched_store_id IS NULL)
-- ==============================================================================
INSERT INTO `svt_visitor_hits` (`target_store`, `visitor_ip`, `visitor_id`, `matched_store_id`, `page_url`, `referrer`, `screen_res`, `browser`, `duration_seconds`, `visited_at`) VALUES
('http://localhost/wordpress_practice', '103.211.54.12', 'c_usr_901', NULL, '/product/smart-sensor-array', 'https://google.com', '390x844', 'Chrome (Mobile)', 140, NOW() - INTERVAL 20 MINUTE),
('http://localhost/wordpress_practice', '103.211.54.12', 'c_usr_901', NULL, '/pricing', 'Direct Navigation', '390x844', 'Chrome (Mobile)', 95, NOW() - INTERVAL 16 MINUTE),
('http://localhost/wordpress_practice', '45.118.156.78', 'c_usr_902', NULL, '/features', 'https://instagram.com', '412x915', 'Safari (Mobile)', 185, NOW() - INTERVAL 50 MINUTE),
('http://localhost/wordpress_practice', '185.220.101.5', 'c_usr_903', NULL, '/our-plans', 'Direct Navigation', '1920x1080', 'Firefox', 60, NOW() - INTERVAL 1 HOUR),
('http://localhost/wordpress_practice', '203.192.204.11', 'c_usr_904', NULL, '/contact-sales', 'https://google.com', '1440x900', 'Safari', 240, NOW() - INTERVAL 3 HOUR),
('http://localhost/wordpress_practice', '178.62.210.44', 'c_usr_905', NULL, '/product/industrial-cloud-gateway', 'https://bing.com', '1920x1080', 'Edge', 110, NOW() - INTERVAL 7 HOUR);

-- ==============================================================================
-- 5. Pre-warm IP Cache Table
-- ==============================================================================
INSERT INTO `svt_ip_cache` (`ip_address`, `company_name`, `physical_address`, `telephone`, `official_email`, `website`, `industry`, `country`, `city`, `source`) VALUES
('159.215.1.10', 'Schneider Electric SE', '35 Rue Joseph Monier, 92500 Rueil-Malmaison, France', '+33 1 41 29 70 00', 'contact@se.com', 'https://se.com', 'Energy Management & Automation', 'France', 'Rueil-Malmaison', 'Enrichment Engine'),
('139.15.20.45', 'Bosch Global Software Technologies', 'Robert-Bosch-Platz 1, 70839 Gerlingen-Schillerhoehe, Germany', '+49 711 400 40990', 'corporate.communications@bosch.com', 'https://bosch.com', 'Automotive & Industrial IoT', 'Germany', 'Gerlingen', 'Enrichment Engine'),
('144.130.50.80', 'ABB Robotics & Motion Ltd', 'Affolternstrasse 44, 8050 Zurich, Switzerland', '+41 43 317 7111', 'contact.center@ch.abb.com', 'https://abb.com', 'Industrial Automation & Power Grids', 'Switzerland', 'Zurich', 'Enrichment Engine'),
('133.140.22.90', 'Hitachi Energy Global Solutions', 'Brown-Boveri-Strasse 5, 8050 Zurich, Switzerland', '+41 58 588 3939', 'info@hitachienergy.com', 'https://hitachienergy.com', 'High-Voltage Smart Power Infrastructure', 'Switzerland', 'Zurich', 'Enrichment Engine'),
('199.111.45.12', 'Honeywell Process Solutions', '855 S Mint St, Charlotte, NC 28202, United States', '+1 704 627 6200', 'info@honeywell.com', 'https://honeywell.com', 'Aerospace & Industrial Control Systems', 'United States', 'Charlotte', 'Enrichment Engine'),
('115.112.4.55', 'Tata Consultancy Services Ltd', 'TCS House, Raveline Street, Fort, Mumbai 400001, India', '+91 22 6778 9999', 'corporate.office@tcs.com', 'https://tcs.com', 'Cloud Solutions & Cognitive Business Ops', 'India', 'Mumbai', 'Enrichment Engine'),
('147.243.1.20', 'Accenture Digital Enterprise', '1 Grand Canal Square, Grand Canal Harbour, Dublin 2, Ireland', '+353 1 646 2000', 'business.solutions@accenture.com', 'https://accenture.com', 'Management Consulting & Cloud Transformation', 'Ireland', 'Dublin', 'Enrichment Engine'),
('182.72.68.90', 'Infosys B2B Engineering Systems', 'Electronics City, Hosur Road, Bangalore 560100, India', '+91 80 2852 0261', 'askus@infosys.com', 'https://infosys.com', 'Enterprise Digital Platforms & AI', 'India', 'Bangalore', 'Enrichment Engine')
ON DUPLICATE KEY UPDATE `company_name` = VALUES(`company_name`);

