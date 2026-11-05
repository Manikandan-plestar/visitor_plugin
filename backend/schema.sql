-- ============================================================================
-- Whoisvisiting-Style B2B Visitor Intelligence - PostgreSQL Schema
-- ============================================================================

-- 1. Stores & Enrichment Registry Table
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    site_url VARCHAR(255) NOT NULL UNIQUE,
    site_name VARCHAR(255) NOT NULL,
    activation_ip VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending_enrichment', -- 'pending_enrichment', 'verified', 'watching'
    company_name VARCHAR(255) DEFAULT NULL,
    physical_address TEXT DEFAULT NULL,
    telephone VARCHAR(64) DEFAULT NULL,
    official_email VARCHAR(255) DEFAULT NULL,
    website VARCHAR(255) DEFAULT NULL,
    linkedin_url VARCHAR(255) DEFAULT NULL,
    twitter_url VARCHAR(255) DEFAULT NULL,
    industry VARCHAR(128) DEFAULT NULL,
    acquisition_channel VARCHAR(128) DEFAULT 'Google Organic Search',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stores_site_url ON stores(site_url);
CREATE INDEX IF NOT EXISTS idx_stores_activation_ip ON stores(activation_ip);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);

-- 2. Storefront Visitor Telemetry & Page Hits Table
CREATE TABLE IF NOT EXISTS visitor_hits (
    id BIGSERIAL PRIMARY KEY,
    target_store VARCHAR(255) NOT NULL,
    visitor_ip VARCHAR(64) NOT NULL,
    visitor_id VARCHAR(128) NOT NULL,
    matched_store_id INT REFERENCES stores(id) ON DELETE SET NULL,
    page_url VARCHAR(500) NOT NULL,
    referrer TEXT DEFAULT NULL,
    screen_res VARCHAR(64) DEFAULT '1920x1080',
    browser VARCHAR(64) DEFAULT 'Chrome',
    duration_seconds INT DEFAULT 60,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visitor_hits_target ON visitor_hits(target_store);
CREATE INDEX IF NOT EXISTS idx_visitor_hits_ip ON visitor_hits(visitor_ip);
CREATE INDEX IF NOT EXISTS idx_visitor_hits_matched ON visitor_hits(matched_store_id);
CREATE INDEX IF NOT EXISTS idx_visitor_hits_time ON visitor_hits(target_store, visited_at DESC);

-- ============================================================================
-- Seed Sample Enriched Stores & Real Visitor History (Whoisvisiting Format)
-- ============================================================================

INSERT INTO stores (
    site_url, site_name, activation_ip, status, company_name, 
    physical_address, telephone, official_email, website, 
    linkedin_url, twitter_url, industry, acquisition_channel
) VALUES 
(
    'https://siemens-energy.com', 'Siemens Energy Storefront', '194.138.37.10', 'watching', 'Siemens Energy AG',
    'Otto-Hahn-Ring 6, 81739 Munich, Germany', '+49 89 636 00', 'contact@siemens-energy.com', 'https://siemens-energy.com',
    'https://linkedin.com/company/siemens-energy', 'https://twitter.com/siemens_energy', 'Renewable Energy & Power Engineering',
    'Google Organic Search'
),
(
    'https://vodafone-enterprise.com', 'Vodafone Business Portal', '212.183.128.50', 'verified', 'Vodafone Group Plc',
    'Vodafone House, The Connection, Newbury, Berkshire RG14 2FN, UK', '+44 1635 33251', 'enterprise-sales@vodafone.com', 'https://vodafone.com',
    'https://linkedin.com/company/vodafone', 'https://twitter.com/vodafonegroup', 'Telecommunications & 5G Infrastructure',
    'LinkedIn Referral'
),
(
    'https://dhl-supplychain.com', 'DHL Logistics Hub', '199.181.132.250', 'pending_enrichment', 'DHL Supply Chain International',
    'Fritz-Erler-Strasse 5, 53113 Bonn, Germany', '+49 228 1820', 'info.supplychain@dhl.com', 'https://dhl.com',
    'https://linkedin.com/company/dhl', 'https://twitter.com/dhlglobal', 'Freight Forwarding & Supply Chain Logistics',
    'Direct Traffic'
)
ON CONFLICT (site_url) DO UPDATE 
SET company_name = EXCLUDED.company_name, status = EXCLUDED.status;
