/**
 * Database Module for Store Visitor Tracker
 * Supports local XAMPP MySQL database (`wordpress_practice` / `store_visiting`) via mysql2/promise
 * with automatic table migrations and seed data.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

let pool = null;
let isConnected = false;
let currentDbName = process.env.DB_NAME || 'store_visiting';

function getDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'store_visiting',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

async function initDb() {
  const config = getDbConfig();
  try {
    pool = mysql.createPool(config);
    // Test initial connection and query active database name from MySQL
    const conn = await pool.getConnection();
    const [dbResult] = await conn.query('SELECT DATABASE() AS current_db');
    currentDbName = dbResult[0]?.current_db || config.database;
    console.log(`✅ Connected to MySQL database "${currentDbName}" at ${config.host}:${config.port}`);
    conn.release();

    // Create Tables
    await createTables();

    // Seed Initial Data if empty
    await seedInitialData();

    isConnected = true;
    return { success: true, engine: 'MySQL', database: currentDbName };
  } catch (err) {
    console.warn(`⚠️ MySQL connection to "${config.database}" failed (${err.message}). Using in-memory fallback.`);
    isConnected = false;
    currentDbName = 'In-Memory Fallback';
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
  // Production Mode: Zero mock or dummy data seeded into MySQL.
  // All telemetry and store records are captured organically in real time.
}

function getPool() {
  return pool;
}

function getIsConnected() {
  return isConnected;
}

function getCurrentDbName() {
  return currentDbName;
}

module.exports = {
  initDb,
  getPool,
  getIsConnected,
  getCurrentDbName,
};
