/**
 * Database Module for Store Visitor Tracker
 * Supports local XAMPP MySQL database (`wordpress_practice`) via mysql2/promise
 * with automatic table migrations and seed data.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

let pool = null;
let isConnected = false;

function getDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wordpress_practice',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

async function initDb() {
  const config = getDbConfig();
  try {
    pool = mysql.createPool(config);
    // Test initial connection
    const conn = await pool.getConnection();
    console.log(`✅ Connected to MySQL database "${config.database}" at ${config.host}:${config.port}`);
    conn.release();

    // Create Tables
    await createTables();

    // Seed Initial Data if empty
    await seedInitialData();

    isConnected = true;
    return { success: true, engine: 'MySQL', database: config.database };
  } catch (err) {
    console.warn(`⚠️ MySQL connection to "${config.database}" failed (${err.message}). Using in-memory fallback.`);
    isConnected = false;
    return { success: false, engine: 'In-Memory', error: err.message };
  }
}

async function createTables() {
  if (!pool) return;

  // 1. Stores / Companies Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS svt_stores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_url VARCHAR(255) NOT NULL UNIQUE,
      site_name VARCHAR(255) NULL,
      activation_ip VARCHAR(64) NULL,
      status VARCHAR(32) DEFAULT 'Pending',
      company_name VARCHAR(255) NULL,
      physical_address TEXT NULL,
      telephone VARCHAR(64) NULL,
      official_email VARCHAR(128) NULL,
      website VARCHAR(255) NULL,
      linkedin_url VARCHAR(255) NULL,
      twitter_url VARCHAR(255) NULL,
      industry VARCHAR(128) NULL,
      acquisition_channel VARCHAR(128) NULL,
      is_partner_store TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ip (activation_ip),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Visitor Page Hits Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS svt_visitor_hits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      target_store VARCHAR(255) NOT NULL,
      visitor_ip VARCHAR(64) NOT NULL,
      visitor_id VARCHAR(128) NOT NULL,
      matched_store_id INT NULL,
      page_url VARCHAR(500) DEFAULT '/',
      referrer VARCHAR(500) DEFAULT 'Direct Navigation',
      screen_res VARCHAR(32) DEFAULT '1920x1080',
      browser VARCHAR(64) DEFAULT 'Chrome',
      duration_seconds INT DEFAULT 60,
      visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_target_store (target_store),
      INDEX idx_matched_store (matched_store_id),
      INDEX idx_visitor_ip (visitor_ip)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. IP Geolocation & ASN Enrichment Cache Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS svt_ip_cache (
      ip_address VARCHAR(64) PRIMARY KEY,
      company_name VARCHAR(255) NULL,
      physical_address TEXT NULL,
      telephone VARCHAR(64) NULL,
      official_email VARCHAR(128) NULL,
      website VARCHAR(255) NULL,
      industry VARCHAR(128) NULL,
      country VARCHAR(64) NULL,
      city VARCHAR(64) NULL,
      source VARCHAR(64) NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('📦 Verified MySQL tables: `svt_stores`, `svt_visitor_hits`, `svt_ip_cache`.');
}

async function seedInitialData() {
  if (!pool) return;

  const [rows] = await pool.query('SELECT COUNT(*) as count FROM svt_stores');
  if (rows[0].count > 0) {
    return; // Already populated
  }

  console.log('🌱 Seeding initial verified B2B stores into MySQL...');

  const initialStores = [
    [
      'https://siemens-energy.com',
      'Siemens Energy Storefront',
      '194.138.37.10',
      'Watching',
      'Siemens Energy AG',
      'Otto-Hahn-Ring 6, 81739 Munich, Germany',
      '+49 89 636 00',
      'contact@siemens-energy.com',
      'https://siemens-energy.com',
      'https://linkedin.com/company/siemens-energy',
      'https://twitter.com/siemens_energy',
      'Renewable Energy & Power Engineering',
      'Google Organic Search',
      1,
    ],
    [
      'https://vodafone-enterprise.com',
      'Vodafone Business Portal',
      '212.183.128.50',
      'Verified',
      'Vodafone Group Plc',
      'Vodafone House, The Connection, Newbury, Berkshire RG14 2FN, UK',
      '+44 1635 33251',
      'enterprise-sales@vodafone.com',
      'https://vodafone.com',
      'https://linkedin.com/company/vodafone',
      'https://twitter.com/vodafonegroup',
      'Telecommunications & 5G Infrastructure',
      'LinkedIn Referral',
      1,
    ],
    [
      'https://thomassmithfasteners.com',
      'Thomas Smith Fasteners Ltd',
      '195.144.11.22',
      'Watching',
      'Thomas Smith Fasteners Ltd',
      'Unit 2A, Swan Business Centre, Swan Lane, Hindley Green, Wigan WN2 4AT, UK',
      '01942 520260',
      'sales@thomassmithfasteners.com',
      'https://thomassmithfasteners.com',
      'https://linkedin.com/company/thomas-smith-fasteners',
      'https://twitter.com/ts_fasteners',
      'Industrial Fasteners & Hardware Engineering',
      'Google Organic Search',
      0,
    ],
    [
      'https://dhl-supplychain.com',
      'DHL Supply Chain Hub',
      '199.181.132.250',
      'Verified',
      'DHL Supply Chain Logistics',
      'Fritz-Erler-Strasse 5, 53113 Bonn, Germany',
      '+49 228 1820',
      'press@dhl.com',
      'https://dhl.com',
      'https://linkedin.com/company/dhl',
      'https://twitter.com/dhl',
      'Global Freight & Logistics',
      'Direct Navigation',
      0,
    ],
    [
      'https://apexoutdoorgear.com',
      'Apex Outdoor Gear',
      '73.189.44.110',
      'Verified',
      'Apex Precision Manufacturing',
      'Riverside Industrial Estate, Sheffield S1 4BY, UK',
      '+44 114 272 8899',
      'contact@apexprecision.co.uk',
      'https://apexprecision.co.uk',
      'https://linkedin.com/company/apex-precision',
      'https://twitter.com/apex_eng',
      'Precision CNC & Additive Manufacturing',
      'Google Organic Search',
      0,
    ],
    [
      'https://cisco.com',
      'Cisco Systems Europe',
      '128.107.241.1',
      'Verified',
      'Cisco Systems Europe',
      'Haarlerbergpark, Haarlerbergweg 13-19, 1101 CH Amsterdam, Netherlands',
      '+31 20 357 1000',
      'info-europe@cisco.com',
      'https://cisco.com',
      'https://linkedin.com/company/cisco',
      'https://twitter.com/cisco',
      'Enterprise Networking & Cybersecurity',
      'Direct Navigation',
      0,
    ],
    [
      'http://localhost/wordpress_practice',
      'My Storefront',
      '127.0.0.1',
      'Pending',
      null,
      null,
      null,
      null,
      'http://localhost/wordpress_practice',
      null,
      null,
      'E-Commerce Storefront',
      'Direct Navigation',
      0,
    ],
  ];

  const insertSql = `
    INSERT INTO svt_stores (
      site_url, site_name, activation_ip, status, company_name,
      physical_address, telephone, official_email, website,
      linkedin_url, twitter_url, industry, acquisition_channel, is_partner_store
    ) VALUES ?
  `;

  await pool.query(insertSql, [initialStores]);

  // Seed sample visitor hits for http://localhost/wordpress_practice
  const sampleHits = [
    ['http://localhost/wordpress_practice', '194.138.37.10', 'usr_siemens_991', 1, '/product/industrial-turbine-sensor', 'https://www.google.com/search?q=sensor', '1920x1080', 'Chrome', 420],
    ['http://localhost/wordpress_practice', '194.138.37.10', 'usr_siemens_991', 1, '/pricing', 'Direct Navigation', '1920x1080', 'Chrome', 185],
    ['http://localhost/wordpress_practice', '212.183.128.50', 'usr_voda_442', 2, '/solutions/5g-iot-gateway', 'https://linkedin.com/feed', '1440x900', 'Safari', 310],
    ['http://localhost/wordpress_practice', '195.144.11.22', 'usr_ts_101', 3, '/our-plans', 'https://www.google.com', '768x1024', 'Safari', 95],
  ];

  await pool.query(`
    INSERT INTO svt_visitor_hits (
      target_store, visitor_ip, visitor_id, matched_store_id, page_url, referrer, screen_res, browser, duration_seconds
    ) VALUES ?
  `, [sampleHits]);

  console.log('✅ Seeded initial verified stores and telemetry hits into MySQL.');
}

function getPool() {
  return pool;
}

function getIsConnected() {
  return isConnected;
}

module.exports = {
  initDb,
  getPool,
  getIsConnected,
};

