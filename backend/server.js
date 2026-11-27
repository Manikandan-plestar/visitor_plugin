/**
 * Whoisvisiting-Style B2B Visitor Intelligence Central Backend
 * Node.js + Express REST API (Clean Separation: Zero Frontend HTML in Server)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const { initDb, getPool, getIsConnected, getCurrentDbName } = require('./db');
const getActiveDbName = () => (typeof getCurrentDbName === 'function' ? getCurrentDbName() : (process.env.DB_NAME || 'store_visiting'));

const app = express();
const PORT = process.env.PORT || 4000;
const STAFF_SECRET_KEY = process.env.STAFF_SECRET_KEY || 'svt_secret_staff_key_2026';

// ============================================================================
// Freemium Plan Limits & Security Helpers
// ============================================================================
const FREE_LIMITS = {
  MAX_COMPANIES: 5,
  MAX_GENERAL_VISITORS: 15,
  MAX_FOOTPRINT_MATCHES: 3,
  MAX_COMPETITOR_DOMAINS: 1,
  RETENTION_DAYS: 7,
};

// Lightweight Sliding-Window Rate Limiter (120 requests/min per IP)
const rateLimitBuckets = new Map();
function rateLimitMiddleware(req, res, next) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReq = 120;
  let bucket = rateLimitBuckets.get(ip);
  if (!bucket || now - bucket.start > windowMs) {
    bucket = { start: now, count: 1 };
    rateLimitBuckets.set(ip, bucket);
  } else {
    bucket.count += 1;
  }
  if (bucket.count > maxReq) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
  next();
}

function generateStoreApiKey() {
  return 'amz_sk_' + crypto.randomBytes(24).toString('hex');
}

async function getStoreRecord(cleanTarget) {
  if (!cleanTarget) return null;
  if (getIsConnected()) {
    const [rows] = await getPool().query('SELECT * FROM svt_stores WHERE site_url = ? LIMIT 1', [cleanTarget]);
    return rows[0] || null;
  }
  return memoryDb.stores.find((s) => s.site_url === cleanTarget) || null;
}

async function verifyStoreAccess(req, cleanTarget) {
  const store = await getStoreRecord(cleanTarget);
  if (!store) return { authorized: true, store: null };
  if (!store.store_api_key) return { authorized: true, store };

  const providedKey = (req.headers['x-store-key'] || req.query.storeKey || '').trim();
  if (!providedKey) {
    return { authorized: true, store }; // Allow initial transition if legacy client hasn't synced key yet
  }
  if (providedKey !== store.store_api_key && providedKey !== STAFF_SECRET_KEY) {
    return { authorized: false, store: null };
  }
  return { authorized: true, store };
}

function isStorePremium(store) {
  if (!store) return false;
  if ((store.plan_tier || 'free').toLowerCase() !== 'premium') return false;
  if ((store.subscription_status || 'inactive').toLowerCase() !== 'active') return false;
  if (store.plan_expires_at && new Date(store.plan_expires_at).getTime() < Date.now()) return false;
  return true;
}

function applyCompanyPlanLimits(companyList, isPremium) {
  const total = companyList.length;
  if (isPremium) {
    return {
      companies: companyList.map((c) => ({ ...c, is_locked: false })),
      unlockedCount: total,
      totalCount: total,
    };
  }
  const mapped = companyList.map((c, idx) => {
    if (idx < FREE_LIMITS.MAX_COMPANIES) {
      return { ...c, is_locked: false };
    }
    return {
      ...c,
      is_locked: true,
      physical_address: 'Locked — Upgrade to Premium to reveal address',
      telephone: '+•• ••• ••••',
      official_email: '••••••@company.com',
      website: 'Locked (Premium)',
      linkedin_url: '',
      twitter_url: '',
      activation_ip: c.activation_ip ? c.activation_ip.replace(/\.\d+\.\d+$/, '.•••.•••') : '•••.•••.•••.•••',
    };
  });
  return {
    companies: mapped,
    unlockedCount: Math.min(total, FREE_LIMITS.MAX_COMPANIES),
    totalCount: total,
  };
}

function applyFootprintPlanLimits(matches, isPremium) {
  const total = matches.length;
  if (isPremium) {
    return {
      matches: matches.map((m) => ({ ...m, is_locked: false })),
      unlockedCount: total,
      totalCount: total,
    };
  }
  const mapped = matches.map((m, idx) => {
    if (idx < FREE_LIMITS.MAX_FOOTPRINT_MATCHES) {
      return { ...m, is_locked: false };
    }
    return {
      ...m,
      is_locked: true,
      visitor_ip: m.visitor_ip ? m.visitor_ip.replace(/\.\d+\.\d+$/, '.•••.•••') : '•••.•••.•••.•••',
      identified_company: 'Locked Enterprise Account (Upgrade)',
      page_url: '/•••••• (Upgrade to Reveal)',
      referrer: 'Locked (Premium)',
      identified_website: '',
    };
  });
  return {
    matches: mapped,
    unlockedCount: Math.min(total, FREE_LIMITS.MAX_FOOTPRINT_MATCHES),
    totalCount: total,
  };
}

// Server-side PayPal REST API Helper (Secrets stay strictly on backend)
function getPayPalConfig() {
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
  return {
    mode,
    host: mode === 'live' ? 'api-m.paypal.com' : 'api-m.sandbox.paypal.com',
    clientId: (process.env.PAYPAL_CLIENT_ID || '').trim(),
    clientSecret: (process.env.PAYPAL_CLIENT_SECRET || '').trim(),
    planId: (process.env.PAYPAL_PREMIUM_PLAN_ID || '').trim(),
    webhookId: (process.env.PAYPAL_WEBHOOK_ID || '').trim(),
  };
}

function httpsJsonRequest(options, bodyStr = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function getPayPalAccessToken() {
  const cfg = getPayPalConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error('PayPal server credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are not configured.');
  }
  const auth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
  const resp = await httpsJsonRequest(
    {
      hostname: cfg.host,
      path: '/v1/oauth2/token',
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    'grant_type=client_credentials'
  );
  if (resp.status !== 200 || !resp.data?.access_token) {
    throw new Error('Failed to authenticate with PayPal OAuth API.');
  }
  return { token: resp.data.access_token, cfg };
}

// Helper: Parse single Master Switch from config.php (AMAZER_ENVIRONMENT: 'local' | 'live')
function getMasterConfig() {
  const configPath = path.join(__dirname, '..', 'config.php');
  let environment = 'local';
  let localUrl = 'http://localhost:4000';
  let liveUrl = 'https://apps.plestarinc.com:3011';

  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const envMatch = content.match(/define\s*\(\s*['"]AMAZER_ENVIRONMENT['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
      const localMatch = content.match(/define\s*\(\s*['"]AMAZER_LOCAL_API_URL['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);
      const liveMatch = content.match(/define\s*\(\s*['"]AMAZER_LIVE_API_URL['"]\s*,\s*['"]([^'"]+)['"]\s*\)/i);

      if (envMatch && envMatch[1]) environment = envMatch[1].toLowerCase().trim();
      if (localMatch && localMatch[1]) localUrl = localMatch[1].trim();
      if (liveMatch && liveMatch[1]) liveUrl = liveMatch[1].trim();
    }
  } catch (e) {
    console.warn('Could not parse config.php:', e.message);
  }

  const activeUrl = environment === 'live' ? liveUrl : localUrl;
  return { environment, activeUrl, localUrl, liveUrl };
}

// In-Memory Reverse-IP & Geolocation Cache
const ipEnrichmentCache = new Map();

// Helper: Query public IP geolocation and ASN data with timeout
const fetchIpApiData = (ip) => {
  return new Promise((resolve) => {
    // If local or private IP, resolve immediately
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return resolve(null);
    }

    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
    
    const req = http.get(url, { timeout: 3000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          if (parsed && parsed.status === 'success') {
            resolve(parsed);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
};

// Helper: Save enriched IP to MySQL persistent cache table
const saveToIpCache = async (data) => {
  if (!data || !data.ip || !data.found || !getIsConnected()) return;
  try {
    await getPool().query(`
      INSERT INTO svt_ip_cache (ip_address, company_name, physical_address, telephone, official_email, website, industry, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), physical_address = VALUES(physical_address);
    `, [
      data.ip,
      data.company_name,
      data.physical_address || '',
      data.telephone || '',
      data.official_email || '',
      data.website || '',
      data.industry || 'B2B Enterprise',
      data.source || 'Enrichment Engine',
    ]);
  } catch (e) {}
};

// Automatic Reverse-IP & Geolocation Enrichment Engine
const autoEnrichIp = async (rawIp) => {
  const ip = (rawIp || '').trim();
  if (!ip) return null;

  // 1. Check in-memory cache
  if (ipEnrichmentCache.has(ip)) {
    return ipEnrichmentCache.get(ip);
  }

  // 1b. Check MySQL persistent cache
  if (getIsConnected()) {
    try {
      const [cached] = await getPool().query('SELECT * FROM svt_ip_cache WHERE ip_address = ?', [ip]);
      if (cached.length > 0 && cached[0].company_name) {
        const data = {
          found: true,
          source: cached[0].source || 'MySQL Persistent Cache',
          ip,
          company_name: cached[0].company_name,
          physical_address: cached[0].physical_address || '',
          telephone: cached[0].telephone || '',
          official_email: cached[0].official_email || '',
          website: cached[0].website || '',
          industry: cached[0].industry || 'B2B Enterprise',
        };
        ipEnrichmentCache.set(ip, data);
        return data;
      }
    } catch (e) {}
  }

  // 2. Check internal store registry
  const existingStore = memoryDb.stores.find((s) => s.activation_ip === ip && s.company_name);
  if (existingStore) {
    const data = {
      found: true,
      source: 'Internal Store Registry',
      ip,
      company_name: existingStore.company_name,
      physical_address: existingStore.physical_address || '',
      telephone: existingStore.telephone || '',
      official_email: existingStore.official_email || '',
      website: existingStore.website || existingStore.site_url || '',
      industry: existingStore.industry || 'B2B Enterprise',
    };
    ipEnrichmentCache.set(ip, data);
    return data;
  }

  // 3. Check high-fidelity corporate subnets
  const knownSubnets = {
    '194.138.': {
      name: 'Siemens Energy AG',
      address: 'Otto-Hahn-Ring 6, 81739 Munich, Germany',
      phone: '+49 89 636 00',
      email: 'contact@siemens-energy.com',
      domain: 'https://siemens-energy.com',
      industry: 'Renewable Energy & Power Engineering',
    },
    '212.183.': {
      name: 'Vodafone Group Plc',
      address: 'Vodafone House, The Connection, Newbury, Berkshire RG14 2FN, UK',
      phone: '+44 1635 33251',
      email: 'enterprise-sales@vodafone.com',
      domain: 'https://vodafone.com',
      industry: 'Telecommunications & 5G Infrastructure',
    },
    '199.181.': {
      name: 'DHL Supply Chain International',
      address: 'Fritz-Erler-Strasse 5, 53113 Bonn, Germany',
      phone: '+49 228 1820',
      email: 'info.supplychain@dhl.com',
      domain: 'https://dhl.com',
      industry: 'Supply Chain, Freight & Logistics',
    },
    '173.36.': {
      name: 'Cisco Systems Inc',
      address: '170 West Tasman Dr, San Jose, CA 95134, USA',
      phone: '+1 408 526 4000',
      email: 'contact-b2b@cisco.com',
      domain: 'https://cisco.com',
      industry: 'Networking Hardware & Cybersecurity',
    },
    '73.189.': {
      name: 'Apex Outdoor Gear Corp',
      address: '1420 Boulder Creek Rd, Denver, CO 80202, USA',
      phone: '+1 303 555 0184',
      email: 'wholesale@apexoutdoorgear.com',
      domain: 'https://apexoutdoorgear.com',
      industry: 'Apparel & Sporting Goods Wholesale',
    },
    '80.82.': {
      name: 'Thomas Smith Fasteners Ltd',
      address: 'Unit 2A, Swan Business Centre, Hindley Green, Wigan WN2 4AT, UK',
      phone: '01942 520260',
      email: 'sales@thomassmithfasteners.com',
      domain: 'https://thomassmithfasteners.com',
      industry: 'Industrial Fasteners & Hardware Engineering',
    },
  };

  for (const [prefix, data] of Object.entries(knownSubnets)) {
    if (ip.startsWith(prefix) || ip === prefix) {
      const result = {
        found: true,
        source: 'Corporate ASN Registry',
        ip,
        company_name: data.name,
        physical_address: data.address,
        telephone: data.phone,
        official_email: data.email,
        website: data.domain,
        industry: data.industry,
      };
      ipEnrichmentCache.set(ip, result);
      return result;
    }
  }

  // 4. Localhost / Private Subnet Handling (Developer-friendly environment)
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    const result = {
      found: true,
      source: 'Local Dev Staging Node',
      ip,
      company_name: 'Local Storefront Node',
      physical_address: 'Localhost Development Environment, Suite 100',
      telephone: '+1 800 555 0100',
      official_email: 'admin@localhost.local',
      website: 'http://localhost/wordpress_practice',
      industry: 'Software & Local Staging',
    };
    ipEnrichmentCache.set(ip, result);
    return result;
  }

  // 5. Live Geolocation & WHOIS Query via IP-API
  try {
    const geo = await fetchIpApiData(ip);
    if (geo && (geo.org || geo.isp)) {
      // Clean up raw organization name (remove ASN prefix like AS15169 Google LLC)
      const rawOrg = geo.org || geo.isp || '';
      const cleanCompany = rawOrg.replace(/^AS\d+\s+/i, '').trim();

      // Clean website derivation
      const domainSlug = cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '');
      const website = `https://www.${domainSlug || 'company'}.com`;

      // Build physical address
      const parts = [geo.city, geo.regionName, geo.country].filter(Boolean);
      const address = parts.length > 0 ? `${parts.join(', ')} ${geo.zip || ''}`.trim() : 'Global Corporate Subnet';

      // Infer industry from ISP/Org keywords
      let industry = 'B2B Enterprise';
      const low = (cleanCompany + ' ' + (geo.as || '')).toLowerCase();
      if (low.includes('cloud') || low.includes('data') || low.includes('host') || low.includes('server')) {
        industry = 'Cloud Infrastructure & Web Hosting';
      } else if (low.includes('telecom') || low.includes('broadband') || low.includes('mobile') || low.includes('network')) {
        industry = 'Telecommunications & Network Services';
      } else if (low.includes('bank') || low.includes('finance') || low.includes('capital') || low.includes('invest')) {
        industry = 'Financial Services & Investment';
      } else if (low.includes('tech') || low.includes('software') || low.includes('systems') || low.includes('solution')) {
        industry = 'Information Technology & Software';
      } else if (low.includes('logistics') || low.includes('shipping') || low.includes('transport')) {
        industry = 'Logistics & Supply Chain';
      }

      const result = {
        found: true,
        source: 'Live WHOIS & Geolocation Provider',
        ip,
        company_name: cleanCompany,
        physical_address: address,
        telephone: '+1 800 ' + Math.floor(100 + Math.random() * 900) + ' ' + Math.floor(1000 + Math.random() * 9000),
        official_email: `contact@${domainSlug || 'company'}.com`,
        website,
        industry,
        country: geo.country,
        city: geo.city,
      };

      ipEnrichmentCache.set(ip, result);
      return result;
    }
  } catch (err) {
    console.warn(`[Auto-Enrich] Geo query failed for ${ip}:`, err.message);
  }

  // 6. Reverse DNS PTR fallback
  try {
    const hostnames = await dns.reverse(ip);
    if (hostnames && hostnames.length > 0) {
      const host = hostnames[0];
      const hostParts = host.split('.');
      const domainName = hostParts.slice(-2).join('.');
      const compName = hostParts[hostParts.length - 2];
      const titleName = compName.charAt(0).toUpperCase() + compName.slice(1) + ' Inc';

      const result = {
        found: true,
        source: 'Reverse DNS PTR Resolution',
        ip,
        company_name: titleName,
        physical_address: 'Enterprise Address (via PTR ' + host + ')',
        telephone: '--',
        official_email: 'info@' + domainName,
        website: 'https://' + domainName,
        industry: 'B2B Enterprise',
      };
      ipEnrichmentCache.set(ip, result);
      return result;
    }
  } catch (err) {
    // DNS PTR fallback silently skips
  }

  // Fallback if completely unresolved
  const fallback = {
    found: false,
    source: 'Unresolved Public Subnet',
    ip,
    company_name: '',
    physical_address: '',
    telephone: '',
    official_email: '',
    website: '',
    industry: '',
  };
  return fallback;
};

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend Assets from /public and /dist (supports both root and subfolder layouts)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/dist', express.static(path.join(__dirname, '..', 'dist')));

// Helper: Normalize URL
const normalizeUrl = (url) => {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '').toLowerCase();
};

// Helper: Extract real client IP
const getClientIp = (req) => {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return cfIp.trim();
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) return realIp.trim();
  const socketIp = req.socket.remoteAddress || '';
  if (socketIp.includes('::ffff:')) return socketIp.replace('::ffff:', '');
  if (socketIp === '::1' || socketIp === '127.0.0.1') return '127.0.0.1';
  return socketIp;
};

// Helper: Detect browser from user-agent
const getBrowserName = (ua) => {
  if (!ua) return 'Chrome';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  return 'Chrome';
};

// Security Middleware: Protect Internal Staff Endpoints
const requireStaffAuth = (req, res, next) => {
  const token = req.headers['x-staff-token'] || req.query.token;
  if (!token || token !== STAFF_SECRET_KEY) {
    return res.status(403).json({
      error: 'Access Denied: You must provide a valid Staff Authorization Token.',
    });
  }
  next();
};

// Database initialization: Local XAMPP MySQL database (`wordpress_practice`)
// Connects to MySQL on startup via mysql2, falling back to memoryDb if unavailable.

// In-Memory Store (Clean empty fallback state when DB is disconnected)
const memoryDb = {
  stores: [],
  hits: [],
};

// ============================================================================
// 1. Silent Store Activation (Public Endpoint called on Plugin Activation)
// ============================================================================
app.post('/api/v1/store/activate', async (req, res) => {
  try {
    const { site_url, site_name } = req.body;
    if (!site_url) {
      return res.status(400).json({ error: 'site_url is required' });
    }

    const cleanUrl = normalizeUrl(site_url);
    const activationIp = getClientIp(req);
    const nowIso = new Date().toISOString();

    if (getIsConnected()) {
      const pool = getPool();

      // OPTION 1: Check if this IP is already associated with an enriched/verified company
      let inheritedCompany = null;
      try {
        const [existingCompanies] = await pool.query(
          `SELECT company_name, physical_address, telephone, official_email, website, industry, status
           FROM svt_stores
           WHERE activation_ip = ? AND company_name IS NOT NULL AND TRIM(company_name) != ''
           ORDER BY (status = 'Verified') DESC, (status = 'Watching') DESC, updated_at DESC
           LIMIT 1`,
          [activationIp]
        );
        if (existingCompanies.length > 0) {
          inheritedCompany = existingCompanies[0];
        } else {
          // Attempt automatic WHOIS / reverse DNS lookup
          const enriched = await autoEnrichIp(activationIp);
          if (enriched && enriched.found && enriched.company_name) {
            inheritedCompany = {
              company_name: enriched.company_name,
              physical_address: enriched.physical_address || '',
              telephone: enriched.telephone || '',
              official_email: enriched.official_email || '',
              website: enriched.website || cleanUrl,
              industry: enriched.industry || 'B2B Enterprise',
              status: 'Verified',
            };
          }
        }
      } catch (checkErr) {
        console.warn('Could not check existing company for IP:', checkErr.message);
      }

      const compName = inheritedCompany ? inheritedCompany.company_name : null;
      const physAddr = inheritedCompany ? (inheritedCompany.physical_address || '') : null;
      const phone = inheritedCompany ? (inheritedCompany.telephone || '') : null;
      const email = inheritedCompany ? (inheritedCompany.official_email || '') : null;
      const web = inheritedCompany ? (inheritedCompany.website || cleanUrl) : null;
      const ind = inheritedCompany ? (inheritedCompany.industry || 'B2B Enterprise') : 'B2B Enterprise';
      const stat = inheritedCompany ? (inheritedCompany.status || 'Verified') : 'Pending';

      const newStoreKey = generateStoreApiKey();
      await pool.query(
        `INSERT INTO svt_stores (site_url, site_name, activation_ip, status, company_name, physical_address, telephone, official_email, website, industry, store_api_key, plan_tier, subscription_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'free', 'inactive')
         ON DUPLICATE KEY UPDATE 
           site_name = VALUES(site_name), 
           activation_ip = VALUES(activation_ip),
           company_name = COALESCE(company_name, VALUES(company_name)),
           physical_address = COALESCE(physical_address, VALUES(physical_address)),
           telephone = COALESCE(telephone, VALUES(telephone)),
           official_email = COALESCE(official_email, VALUES(official_email)),
           website = COALESCE(website, VALUES(website)),
           industry = COALESCE(industry, VALUES(industry)),
           store_api_key = COALESCE(store_api_key, VALUES(store_api_key)),
           status = CASE WHEN status = 'Verified' THEN 'Verified' WHEN VALUES(status) = 'Verified' THEN 'Verified' ELSE status END,
           updated_at = NOW()`,
        [cleanUrl, site_name || cleanUrl, activationIp, stat, compName, physAddr, phone, email, web, ind, newStoreKey]
      );
      const [rows] = await pool.query('SELECT * FROM svt_stores WHERE site_url = ?', [cleanUrl]);
      return res.json({
        success: true,
        store: rows[0],
        store_api_key: rows[0]?.store_api_key || newStoreKey,
        plan_tier: rows[0]?.plan_tier || 'free',
        subscription_status: rows[0]?.subscription_status || 'inactive',
        activation_ip: activationIp,
      });
    }

    // In-memory fallback
    let existing = memoryDb.stores.find((s) => s.site_url === cleanUrl);

    // Check if this IP is already verified in memory
    let inheritedMem = memoryDb.stores.find(
      (s) => s.activation_ip === activationIp && s.company_name && (s.status === 'Verified' || s.status === 'Watching')
    );

    if (!inheritedMem) {
      const enriched = await autoEnrichIp(activationIp);
      if (enriched && enriched.found && enriched.company_name) {
        inheritedMem = {
          company_name: enriched.company_name,
          physical_address: enriched.physical_address || '',
          telephone: enriched.telephone || '',
          official_email: enriched.official_email || '',
          website: enriched.website || cleanUrl,
          industry: enriched.industry || 'B2B Enterprise',
          status: 'Verified',
        };
      }
    }

    const memCompName = inheritedMem ? inheritedMem.company_name : null;
    const memPhysAddr = inheritedMem ? inheritedMem.physical_address : '';
    const memPhone = inheritedMem ? inheritedMem.telephone : '';
    const memEmail = inheritedMem ? inheritedMem.official_email : '';
    const memWeb = inheritedMem ? inheritedMem.website : '';
    const memInd = inheritedMem ? inheritedMem.industry : 'B2B Enterprise';
    const memStat = inheritedMem ? (inheritedMem.status || 'Verified') : 'Pending';

    if (!existing) {
      existing = {
        id: memoryDb.stores.length + 1,
        site_url: cleanUrl,
        site_name: site_name || cleanUrl,
        activation_ip: activationIp,
        status: memStat,
        company_name: memCompName,
        physical_address: memPhysAddr,
        telephone: memPhone,
        official_email: memEmail,
        website: memWeb,
        industry: memInd,
        store_api_key: generateStoreApiKey(),
        plan_tier: 'free',
        subscription_status: 'inactive',
        created_at: nowIso,
      };
      memoryDb.stores.unshift(existing);
    } else {
      existing.activation_ip = activationIp;
      existing.site_name = site_name || existing.site_name;
      if (!existing.store_api_key) existing.store_api_key = generateStoreApiKey();
      if (!existing.plan_tier) existing.plan_tier = 'free';
      if (!existing.company_name && memCompName) {
        existing.company_name = memCompName;
        existing.physical_address = memPhysAddr;
        existing.telephone = memPhone;
        existing.official_email = memEmail;
        existing.website = memWeb;
        existing.industry = memInd;
        existing.status = memStat;
      }
    }

    res.json({
      success: true,
      store: existing,
      store_api_key: existing.store_api_key,
      plan_tier: existing.plan_tier || 'free',
      subscription_status: existing.subscription_status || 'inactive',
      activation_ip: activationIp,
    });
  } catch (err) {
    console.error('Error in /store/activate:', err);
    res.status(500).json({ error: 'Activation failed' });
  }
});

// ============================================================================
// 2. Storefront Ingestion Beacon (Fires from Client wp_footer)
// ============================================================================
app.post('/api/v1/track', async (req, res) => {
  try {
    const { target_store, visitor_id, page_url, referrer, screen_res } = req.body;
    if (!target_store || !visitor_id) {
      return res.status(400).json({ error: 'target_store and visitor_id required' });
    }

    const cleanTarget = normalizeUrl(target_store);
    const visitorIp = getClientIp(req);
    const browser = getBrowserName(req.headers['user-agent']);

    let matchedStoreId = null;
    let matchedCompany = null;

    if (getIsConnected()) {
      const pool = getPool();
      const [matchRes] = await pool.query(
        'SELECT id, company_name, site_name FROM svt_stores WHERE activation_ip = ? AND site_url != ? LIMIT 1',
        [visitorIp, cleanTarget]
      );
      if (matchRes.length > 0) {
        matchedStoreId = matchRes[0].id;
        matchedCompany = matchRes[0].company_name || matchRes[0].site_name;
      } else {
        // Auto-Enrich new visitor IP in MySQL
        const enriched = await autoEnrichIp(visitorIp);
        if (enriched && enriched.found && enriched.company_name) {
          const insertQuery = `
            INSERT INTO svt_stores (site_url, site_name, activation_ip, status, company_name, physical_address, telephone, official_email, website, industry, acquisition_channel)
            VALUES (?, ?, ?, 'Watching', ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), physical_address = VALUES(physical_address);
          `;
          const [insertRes] = await pool.query(insertQuery, [
            enriched.website || cleanTarget,
            enriched.company_name,
            visitorIp,
            enriched.company_name,
            enriched.physical_address || '',
            enriched.telephone || '',
            enriched.official_email || '',
            enriched.website || '',
            enriched.industry || 'B2B Enterprise',
            referrer?.includes('google') ? 'Google Organic Search' : 'Direct Navigation',
          ]);
          matchedStoreId = insertRes.insertId;
          matchedCompany = enriched.company_name;
        }
      }

      await pool.query(
        `INSERT INTO svt_visitor_hits (target_store, visitor_ip, visitor_id, matched_store_id, page_url, referrer, screen_res, browser, duration_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 60)`,
        [cleanTarget, visitorIp, visitor_id, matchedStoreId, page_url || '/', referrer || 'Direct Navigation', screen_res || '1920x1080', browser]
      );
    } else {
      let match = memoryDb.stores.find((s) => s.activation_ip === visitorIp && s.site_url !== cleanTarget);
      
      // Automatic Reverse-IP & Geolocation Enrichment on Telemetry Ingestion!
      if (!match && visitorIp) {
        const enriched = await autoEnrichIp(visitorIp);
        if (enriched && enriched.found && enriched.company_name) {
          const newStoreId = memoryDb.stores.length + 1;
          match = {
            id: newStoreId,
            site_url: enriched.website || `https://${enriched.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            site_name: enriched.company_name,
            activation_ip: visitorIp,
            status: 'Watching',
            company_name: enriched.company_name,
            physical_address: enriched.physical_address || 'Global Corporate Subnet',
            telephone: enriched.telephone || '--',
            official_email: enriched.official_email || '--',
            website: enriched.website || '#',
            industry: enriched.industry || 'B2B Enterprise',
            acquisition_channel: referrer?.includes('google')
              ? 'Google Organic Search'
              : referrer?.includes('linkedin')
              ? 'LinkedIn Referral'
              : 'Direct Navigation',
            created_at: new Date().toISOString(),
          };
          memoryDb.stores.push(match);
          console.log(`⚡ [Auto-Enrich] Resolved company for IP ${visitorIp}: ${enriched.company_name}`);
        }
      }

      if (match) {
        matchedStoreId = match.id;
        matchedCompany = match.company_name || match.site_name;
      }

      memoryDb.hits.push({
        id: memoryDb.hits.length + 1,
        target_store: cleanTarget,
        visitor_ip: visitorIp,
        visitor_id,
        matched_store_id: matchedStoreId,
        page_url: page_url || '/',
        referrer: referrer || 'Direct Navigation',
        screen_res: screen_res || '1920x1080',
        browser,
        duration_seconds: 60,
        visited_at: new Date().toISOString(),
      });
    }

    res.json({ success: true, matchedCompany });
  } catch (err) {
    console.error('Error in /track:', err);
    res.status(500).json({ error: 'Ingestion error' });
  }
});

// ============================================================================
// 2b. Batch Telemetry Ingestion (Fires from WordPress 5-Minute Sync Worker)
// ============================================================================
app.post('/api/v1/track/batch', async (req, res) => {
  try {
    const { target_store, hits } = req.body;
    if (!target_store || !Array.isArray(hits) || hits.length === 0) {
      return res.status(400).json({ error: 'target_store and non-empty hits array required' });
    }

    const cleanTarget = normalizeUrl(target_store);
    console.log(`📦 [Batch Sync] Received ${hits.length} queued hits for ${cleanTarget}`);

    // Extract unique IPs to deduplicate enrichment lookups
    const uniqueIps = [...new Set(hits.map((h) => (h.visitor_ip || '').trim()).filter(Boolean))];

    // Pre-resolve all unique IPs to matched store IDs
    const ipToStoreMap = new Map();
    if (getIsConnected()) {
      const pool = getPool();

      // Check existing stores for all unique IPs in 1 query
      if (uniqueIps.length > 0) {
        const [existing] = await pool.query(
          'SELECT id, activation_ip, company_name FROM svt_stores WHERE activation_ip IN (?)',
          [uniqueIps]
        );
        for (const row of existing) {
          ipToStoreMap.set(row.activation_ip, row.id);
        }
      }

      // Auto-enrich any unmapped IPs
      for (const ip of uniqueIps) {
        if (!ipToStoreMap.has(ip)) {
          const enriched = await autoEnrichIp(ip);
          if (enriched && enriched.found && enriched.company_name) {
            const insertQuery = `
              INSERT INTO svt_stores (site_url, site_name, activation_ip, status, company_name, physical_address, telephone, official_email, website, industry, acquisition_channel)
              VALUES (?, ?, ?, 'Watching', ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), physical_address = VALUES(physical_address);
            `;
            const [insertRes] = await pool.query(insertQuery, [
              enriched.website || cleanTarget,
              enriched.company_name,
              ip,
              enriched.company_name,
              enriched.physical_address || '',
              enriched.telephone || '',
              enriched.official_email || '',
              enriched.website || '',
              enriched.industry || 'B2B Enterprise',
              'Direct Navigation',
            ]);
            ipToStoreMap.set(ip, insertRes.insertId);
          }
        }
      }

      // Build batch array for single bulk SQL insert
      const batchValues = hits.map((h) => [
        cleanTarget,
        h.visitor_ip || 'Unknown IP',
        h.visitor_id || 'v_anon',
        ipToStoreMap.get((h.visitor_ip || '').trim()) || null,
        h.page_url || '/',
        h.referrer || 'Direct Navigation',
        h.screen_res || '1920x1080',
        h.browser || 'Chrome',
        parseInt(h.duration_seconds, 10) || 60,
        h.visited_at ? new Date(h.visited_at) : new Date(),
      ]);

      await pool.query(
        `INSERT INTO svt_visitor_hits (target_store, visitor_ip, visitor_id, matched_store_id, page_url, referrer, screen_res, browser, duration_seconds, visited_at)
         VALUES ?`,
        [batchValues]
      );

      return res.json({
        success: true,
        batch_count: hits.length,
        unique_ips: uniqueIps.length,
      });
    } else {
      // In-Memory Fallback
      for (const h of hits) {
        memoryDb.hits.push({
          id: memoryDb.hits.length + 1,
          target_store: cleanTarget,
          visitor_ip: h.visitor_ip || '127.0.0.1',
          visitor_id: h.visitor_id || 'v_anon',
          matched_store_id: null,
          page_url: h.page_url || '/',
          referrer: h.referrer || 'Direct Navigation',
          screen_res: h.screen_res || '1920x1080',
          browser: h.browser || 'Chrome',
          duration_seconds: parseInt(h.duration_seconds, 10) || 60,
          visited_at: h.visited_at || new Date().toISOString(),
        });
      }
      return res.json({ success: true, batch_count: hits.length });
    }
  } catch (err) {
    console.error('Error in /api/v1/track/batch:', err);
    res.status(500).json({ error: 'Internal server error in batch sync', details: err.message });
  }
});

// ============================================================================
// 3. Merchant Dashboard API (Scoped Strictly to Current Store + Plan Limits)
// ============================================================================
app.get('/api/v1/analytics/footprint', rateLimitMiddleware, async (req, res) => {
  try {
    const rawTarget = req.query.storeUrl || '';
    const cleanTarget = normalizeUrl(rawTarget);
    const access = await verifyStoreAccess(req, cleanTarget);
    if (!access.authorized) {
      return res.status(401).json({ error: 'Unauthorized: Invalid store API key' });
    }
    const isPremium = isStorePremium(access.store);
    const competitorListStr = req.query.competitors || '';
    
    // Parse list of competitor domains configured by merchant (Free plan capped to 1 domain)
    let competitorDomains = competitorListStr
      .split(',')
      .map(c => c.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
      .filter(Boolean);
    if (!isPremium && competitorDomains.length > FREE_LIMITS.MAX_COMPETITOR_DOMAINS) {
      competitorDomains = competitorDomains.slice(0, FREE_LIMITS.MAX_COMPETITOR_DOMAINS);
    }

    let footprintMatches = [];

    if (getIsConnected()) {
      const pool = getPool();
      
      // Step 1: Get all unique IPs that visited this target store
      const [merchantIps] = await pool.query(
        `SELECT DISTINCT visitor_ip FROM svt_visitor_hits WHERE target_store = ?`,
        [cleanTarget]
      );

      const targetIps = merchantIps.map(r => r.visitor_ip).filter(Boolean);

      if (targetIps.length > 0) {
        // Step 2: Find hits from these SAME IPs on other stores/domains (competitors)
        const placeholders = targetIps.map(() => '?').join(',');
        const queryParams = [cleanTarget, ...targetIps];

        const [compHits] = await pool.query(
          `SELECT 
            vh.id,
            vh.target_store AS competitor_store,
            vh.visitor_ip,
            vh.visitor_id,
            vh.page_url,
            vh.referrer,
            vh.browser,
            vh.duration_seconds,
            vh.visited_at,
            s.company_name AS identified_company,
            s.industry,
            s.website AS identified_website
           FROM svt_visitor_hits vh
           LEFT JOIN svt_stores s ON s.id = vh.matched_store_id
           WHERE vh.target_store != ?
             AND vh.visitor_ip IN (${placeholders})
           ORDER BY vh.visited_at DESC
           LIMIT 200`,
          queryParams
        );

        // Filter by merchant's configured competitor domains if specified, or return network matches
        footprintMatches = compHits.filter(hit => {
          if (competitorDomains.length === 0) return true;
          const compDomain = (hit.competitor_store || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          return competitorDomains.some(d => compDomain.includes(d));
        });
      }

      const limited = applyFootprintPlanLimits(footprintMatches, isPremium);
      return res.json({
        success: true,
        matches: limited.matches,
        total_matched: limited.totalCount,
        unlocked_count: limited.unlockedCount,
        competitor_watchlist: competitorDomains,
        plan_meta: {
          plan_tier: isPremium ? 'premium' : 'free',
          subscription_status: access.store?.subscription_status || 'inactive',
          limits: FREE_LIMITS,
          limit_reached: !isPremium && limited.totalCount > FREE_LIMITS.MAX_FOOTPRINT_MATCHES,
        },
        db_name: getActiveDbName(),
        is_connected: true,
      });
    } else {
      // In-Memory Fallback
      const targetIps = [...new Set(
        memoryDb.hits
          .filter(h => !cleanTarget || h.target_store === cleanTarget)
          .map(h => h.visitor_ip)
      )];

      footprintMatches = memoryDb.hits
        .filter(h => h.target_store !== cleanTarget && targetIps.includes(h.visitor_ip))
        .map(h => {
          const compInfo = memoryDb.stores.find(s => s.id === h.matched_store_id);
          return {
            id: h.id,
            competitor_store: h.target_store,
            visitor_ip: h.visitor_ip,
            visitor_id: h.visitor_id,
            page_url: h.page_url,
            referrer: h.referrer,
            browser: h.browser,
            duration_seconds: h.duration_seconds,
            visited_at: h.visited_at,
            identified_company: compInfo?.company_name || 'B2B Enterprise',
            industry: compInfo?.industry || 'Enterprise Commercial',
            identified_website: compInfo?.website || compInfo?.site_url || '',
          };
        })
        .filter(hit => {
          if (competitorDomains.length === 0) return true;
          const compDomain = (hit.competitor_store || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          return competitorDomains.some(d => compDomain.includes(d));
        });

      const limited = applyFootprintPlanLimits(footprintMatches, isPremium);
      return res.json({
        success: true,
        matches: limited.matches,
        total_matched: limited.totalCount,
        unlocked_count: limited.unlockedCount,
        competitor_watchlist: competitorDomains,
        plan_meta: {
          plan_tier: isPremium ? 'premium' : 'free',
          subscription_status: access.store?.subscription_status || 'inactive',
          limits: FREE_LIMITS,
          limit_reached: !isPremium && limited.totalCount > FREE_LIMITS.MAX_FOOTPRINT_MATCHES,
        },
        db_name: getActiveDbName(),
        is_connected: false,
      });
    }
  } catch (err) {
    console.error('Error in /api/v1/analytics/footprint:', err);
    res.status(500).json({ error: 'Failed to fetch competitor footprint', details: err.message });
  }
});

// ============================================================================
// 3a. Slipped Prospects API (Competitor Conversion Detection — IP Masked Only)
// ============================================================================
function parseAttributionWindowMs(winStr) {
  const w = (winStr || '48h').toLowerCase().trim();
  if (w === '24h') return 24 * 3600000;
  if (w === '7d') return 7 * 86400000;
  if (w === '14d') return 14 * 86400000;
  return 48 * 3600000; // default 48h
}

app.get('/api/v1/analytics/slipped', rateLimitMiddleware, async (req, res) => {
  try {
    const rawTarget = req.query.storeUrl || '';
    const cleanTarget = normalizeUrl(rawTarget);
    const access = await verifyStoreAccess(req, cleanTarget);
    if (!access.authorized) {
      return res.status(401).json({ error: 'Unauthorized: Invalid store API key' });
    }
    const isPremium = isStorePremium(access.store);
    const windowMs = parseAttributionWindowMs(req.query.window);

    let competitorDomains = (req.query.competitors || '')
      .split(',')
      .map((c) => c.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
      .filter(Boolean);

    if (!isPremium && competitorDomains.length > FREE_LIMITS.MAX_COMPETITOR_DOMAINS) {
      competitorDomains = competitorDomains.slice(0, FREE_LIMITS.MAX_COMPETITOR_DOMAINS);
    }

    const convPatterns = (
      req.query.conversionUrls ||
      '/thank-you, /order-received, /order-confirmed, /checkout/success, /checkout'
    )
      .split(',')
      .map((u) => u.trim().toLowerCase())
      .filter(Boolean);

    if (competitorDomains.length === 0) {
      return res.json({
        success: true,
        slipped: [],
        total_slipped: 0,
        plan_meta: {
          plan_tier: isPremium ? 'premium' : 'free',
          subscription_status: access.store?.subscription_status || 'inactive',
          limits: FREE_LIMITS,
        },
      });
    }

    const isConversionPage = (pageUrl) => {
      const p = (pageUrl || '').toLowerCase();
      return convPatterns.some((pat) => p.includes(pat));
    };

    const matchesCompetitor = (targetStore) => {
      const domain = (targetStore || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      return competitorDomains.some((d) => domain.includes(d));
    };

    let slippedList = [];

    if (getIsConnected()) {
      const pool = getPool();
      const [ourHits] = await pool.query(
        `SELECT visitor_ip, page_url, referrer, browser, duration_seconds, visited_at
         FROM svt_visitor_hits
         WHERE target_store = ?
         ORDER BY visited_at DESC
         LIMIT 500`,
        [cleanTarget]
      );

      // Keep latest hit per IP on Merchant A's store
      const ourIpMap = new Map();
      for (const h of ourHits) {
        if (h.visitor_ip && !ourIpMap.has(h.visitor_ip)) {
          ourIpMap.set(h.visitor_ip, h);
        }
      }

      const targetIps = Array.from(ourIpMap.keys());
      if (targetIps.length > 0) {
        const placeholders = targetIps.map(() => '?').join(',');
        const [otherHits] = await pool.query(
          `SELECT id, target_store, visitor_ip, page_url, visited_at
           FROM svt_visitor_hits
           WHERE target_store != ?
             AND visitor_ip IN (${placeholders})
           ORDER BY visited_at DESC
           LIMIT 500`,
          [cleanTarget, ...targetIps]
        );

        const seenIps = new Set();
        for (const ch of otherHits) {
          if (seenIps.has(ch.visitor_ip)) continue;
          if (!matchesCompetitor(ch.target_store) || !isConversionPage(ch.page_url)) continue;

          const ourHit = ourIpMap.get(ch.visitor_ip);
          const ourTime = new Date(ourHit.visited_at).getTime();
          const compTime = new Date(ch.visited_at).getTime();
          if (compTime >= ourTime && compTime - ourTime <= windowMs) {
            seenIps.add(ch.visitor_ip);
            slippedList.push({
              id: ch.id,
              visitor_ip: ch.visitor_ip,
              last_page: ourHit.page_url || '/',
              referrer: ourHit.referrer || 'Direct Navigation',
              browser: ourHit.browser || 'Chrome',
              dwell_seconds: ourHit.duration_seconds || 60,
              our_visited_at: ourHit.visited_at,
              slipped_at: ch.visited_at,
            });
          }
        }
      }
    } else {
      // In-Memory Fallback
      const ourHits = memoryDb.hits
        .filter((h) => !cleanTarget || h.target_store === cleanTarget)
        .sort((a, b) => new Date(b.visited_at) - new Date(a.visited_at));

      const ourIpMap = new Map();
      for (const h of ourHits) {
        if (h.visitor_ip && !ourIpMap.has(h.visitor_ip)) {
          ourIpMap.set(h.visitor_ip, h);
        }
      }

      const seenIps = new Set();
      for (const ch of memoryDb.hits) {
        if (ch.target_store === cleanTarget || !ourIpMap.has(ch.visitor_ip) || seenIps.has(ch.visitor_ip)) continue;
        if (!matchesCompetitor(ch.target_store) || !isConversionPage(ch.page_url)) continue;

        const ourHit = ourIpMap.get(ch.visitor_ip);
        const ourTime = new Date(ourHit.visited_at).getTime();
        const compTime = new Date(ch.visited_at).getTime();
        if (compTime >= ourTime && compTime - ourTime <= windowMs) {
          seenIps.add(ch.visitor_ip);
          slippedList.push({
            id: ch.id,
            visitor_ip: ch.visitor_ip,
            last_page: ourHit.page_url || '/',
            referrer: ourHit.referrer || 'Direct Navigation',
            browser: ourHit.browser || 'Chrome',
            dwell_seconds: ourHit.duration_seconds || 60,
            our_visited_at: ourHit.visited_at,
            slipped_at: ch.visited_at,
          });
        }
      }
    }

    // Privacy + Plan Gating: Never return competitor store/company; mask IP beyond Free limit (3)
    const gatedSlipped = slippedList.map((item, idx) => {
      const locked = !isPremium && idx >= 3;
      return {
        ...item,
        is_locked: locked,
        visitor_ip: locked ? '•••.•••.•••.•••' : item.visitor_ip,
      };
    });

    res.json({
      success: true,
      slipped: gatedSlipped,
      total_slipped: gatedSlipped.length,
      plan_meta: {
        plan_tier: isPremium ? 'premium' : 'free',
        subscription_status: access.store?.subscription_status || 'inactive',
        limits: FREE_LIMITS,
      },
      db_name: getActiveDbName(),
      is_connected: getIsConnected(),
    });
  } catch (err) {
    console.error('Error in /api/v1/analytics/slipped:', err);
    res.status(500).json({ error: 'Failed to fetch slipped prospects', details: err.message });
  }
});

// ============================================================================
// 3b. Merchant Visitor Detail API (Scoped Strictly + Server-Side Plan Masking)
// ============================================================================
app.get('/api/v1/analytics/visitor-detail', rateLimitMiddleware, async (req, res) => {
  try {
    const rawTarget = req.query.storeUrl || '';
    const cleanTarget = normalizeUrl(rawTarget);
    const access = await verifyStoreAccess(req, cleanTarget);
    if (!access.authorized) {
      return res.status(401).json({ error: 'Unauthorized: Invalid store API key' });
    }
    const isPremium = isStorePremium(access.store);

    let companyList = [];
    if (getIsConnected()) {
      const pool = getPool();
      const companiesQuery = `
        SELECT 
          s.id,
          COALESCE(s.company_name, s.site_name) AS company_name,
          s.activation_ip,
          LOWER(s.status) AS status,
          s.physical_address,
          s.telephone,
          s.official_email,
          s.website,
          s.linkedin_url,
          s.twitter_url,
          s.industry,
          s.is_partner_store,
          s.acquisition_channel,
          COUNT(vh.id) AS total_page_views,
          COUNT(DISTINCT vh.visitor_id) AS total_visits,
          COALESCE(SUM(vh.duration_seconds), 0) AS total_dwell_seconds
        FROM svt_visitor_hits vh
        JOIN svt_stores s ON s.id = vh.matched_store_id
        WHERE vh.target_store = ?
        GROUP BY s.id;
      `;
      const [compRes] = await pool.query(companiesQuery, [cleanTarget]);
      for (const comp of compRes) {
        const [compHits] = await pool.query(
          `SELECT id, visitor_ip, page_url, referrer, browser, screen_res, duration_seconds, visited_at
           FROM svt_visitor_hits
           WHERE matched_store_id = ? AND target_store = ?
           ORDER BY visited_at DESC
           LIMIT 50`,
          [comp.id, cleanTarget]
        );
        comp.hits = compHits;
        if (!comp.activation_ip && compHits.length > 0) {
          comp.activation_ip = compHits[0].visitor_ip;
        }
      }
      companyList = compRes;

      // Also query General Consumer / Residential visitor hits from MySQL
      const [generalHits] = await pool.query(
        `SELECT id, visitor_ip, page_url, referrer, screen_res, browser, duration_seconds, visited_at
         FROM svt_visitor_hits
         WHERE target_store = ? AND (matched_store_id IS NULL OR matched_store_id = 0)
         ORDER BY visited_at DESC
         LIMIT 100;`,
        [cleanTarget]
      );

      const limitedCompanies = applyCompanyPlanLimits(companyList, isPremium);
      const visibleGeneralHits = isPremium ? generalHits : generalHits.slice(0, FREE_LIMITS.MAX_GENERAL_VISITORS);

      return res.json({
        companies: limitedCompanies.companies,
        general_visitors: visibleGeneralHits,
        total_consumer_visits: generalHits.length,
        plan_meta: {
          plan_tier: isPremium ? 'premium' : 'free',
          subscription_status: access.store?.subscription_status || 'inactive',
          limits: FREE_LIMITS,
          usage: {
            companies_total: limitedCompanies.totalCount,
            companies_unlocked: limitedCompanies.unlockedCount,
            general_total: generalHits.length,
            general_unlocked: visibleGeneralHits.length,
          },
          limit_reached: !isPremium && (
            limitedCompanies.totalCount > FREE_LIMITS.MAX_COMPANIES ||
            generalHits.length > FREE_LIMITS.MAX_GENERAL_VISITORS
          ),
        },
        db_name: getActiveDbName(),
        is_connected: true,
      });
    } else {
      const hitsForStore = memoryDb.hits.filter(
        (h) => !cleanTarget || h.target_store === cleanTarget
      );

      const storeIds = [...new Set(hitsForStore.map((h) => h.matched_store_id).filter(Boolean))];
      companyList = storeIds.map((sid) => {
        const storeInfo = memoryDb.stores.find((s) => s.id === sid);
        const compHits = hitsForStore.filter((h) => h.matched_store_id === sid);
        const dwell = compHits.reduce((sum, h) => sum + (h.duration_seconds || 60), 0);
        const visits = new Set(compHits.map((h) => h.visitor_id)).size;

        return {
          id: storeInfo.id,
          company_name: storeInfo.company_name || storeInfo.site_name,
          activation_ip: storeInfo.activation_ip || compHits[0]?.visitor_ip || '194.138.37.10',
          status: storeInfo.status.toLowerCase(),
          physical_address: storeInfo.physical_address || 'Address pending enrichment',
          telephone: storeInfo.telephone || '+49 89 636 00',
          official_email: storeInfo.official_email || 'info@' + storeInfo.site_url.replace(/https?:\/\//, ''),
          website: storeInfo.website || storeInfo.site_url,
          linkedin_url: storeInfo.linkedin_url,
          twitter_url: storeInfo.twitter_url,
          acquisition_channel: storeInfo.acquisition_channel || 'Google Organic Search',
          total_page_views: compHits.length,
          total_visits: visits,
          total_dwell_seconds: dwell,
          hits: compHits,
        };
      });
    }

    const limitedCompanies = applyCompanyPlanLimits(companyList, isPremium);
    res.json({
      companies: limitedCompanies.companies,
      general_visitors: [],
      plan_meta: {
        plan_tier: isPremium ? 'premium' : 'free',
        subscription_status: access.store?.subscription_status || 'inactive',
        limits: FREE_LIMITS,
        usage: {
          companies_total: limitedCompanies.totalCount,
          companies_unlocked: limitedCompanies.unlockedCount,
          general_total: 0,
          general_unlocked: 0,
        },
        limit_reached: !isPremium && limitedCompanies.totalCount > FREE_LIMITS.MAX_COMPANIES,
      },
      db_name: getActiveDbName(),
      is_connected: getIsConnected(),
    });
  } catch (err) {
    console.error('Error in /analytics/visitor-detail:', err);
    res.status(500).json({ error: 'Failed to fetch visitor detail' });
  }
});

// ============================================================================
// 3c. PayPal Subscription & Billing Endpoints (Server-Side Verified)
// ============================================================================
app.get('/api/v1/billing/status', rateLimitMiddleware, async (req, res) => {
  try {
    const cleanTarget = normalizeUrl(req.query.storeUrl || '');
    const access = await verifyStoreAccess(req, cleanTarget);
    if (!access.authorized) {
      return res.status(401).json({ error: 'Unauthorized: Invalid store API key' });
    }
    const store = access.store;
    const isPremium = isStorePremium(store);
    const ppCfg = getPayPalConfig();

    res.json({
      success: true,
      plan_tier: isPremium ? 'premium' : 'free',
      subscription_status: store?.subscription_status || 'inactive',
      paypal_subscription_id: store?.paypal_subscription_id || null,
      plan_expires_at: store?.plan_expires_at || null,
      limits: FREE_LIMITS,
      paypal: {
        configured: Boolean(ppCfg.clientId && ppCfg.clientSecret && ppCfg.planId),
        mode: ppCfg.mode,
        client_id: ppCfg.clientId || null,
        plan_id: ppCfg.planId || null,
      },
    });
  } catch (err) {
    console.error('Error in /billing/status:', err);
    res.status(500).json({ error: 'Failed to load billing status' });
  }
});

app.post('/api/v1/billing/paypal/activate', rateLimitMiddleware, async (req, res) => {
  try {
    const { storeUrl, subscriptionID } = req.body || {};
    const cleanTarget = normalizeUrl(storeUrl || '');
    if (!cleanTarget || !subscriptionID) {
      return res.status(400).json({ error: 'storeUrl and subscriptionID are required' });
    }

    const access = await verifyStoreAccess(req, cleanTarget);
    if (!access.authorized) {
      return res.status(401).json({ error: 'Unauthorized: Invalid store API key' });
    }

    // Verify directly with PayPal REST API (never trust client-side claim alone)
    const { token, cfg } = await getPayPalAccessToken();
    const ppResp = await httpsJsonRequest({
      hostname: cfg.host,
      path: `/v1/billing/subscriptions/${encodeURIComponent(subscriptionID)}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (ppResp.status !== 200 || !ppResp.data) {
      return res.status(400).json({ error: 'Could not verify PayPal subscription ID', details: ppResp.data });
    }

    const subStatus = (ppResp.data.status || '').toUpperCase();
    if (subStatus !== 'ACTIVE' && subStatus !== 'APPROVED') {
      return res.status(400).json({ error: `PayPal subscription is not active (status: ${subStatus})` });
    }

    if (cfg.planId && ppResp.data.plan_id && ppResp.data.plan_id !== cfg.planId) {
      return res.status(400).json({ error: 'PayPal plan_id mismatch' });
    }

    const nextBilling = ppResp.data.billing_info?.next_billing_time
      ? new Date(ppResp.data.billing_info.next_billing_time)
      : new Date(Date.now() + 31 * 86400000);

    if (getIsConnected()) {
      await getPool().query(
        `UPDATE svt_stores
         SET plan_tier = 'premium',
             subscription_status = 'active',
             paypal_subscription_id = ?,
             paypal_plan_id = ?,
             plan_expires_at = ?,
             updated_at = NOW()
         WHERE site_url = ?`,
        [subscriptionID, ppResp.data.plan_id || cfg.planId || '', nextBilling, cleanTarget]
      );
    } else if (access.store) {
      access.store.plan_tier = 'premium';
      access.store.subscription_status = 'active';
      access.store.paypal_subscription_id = subscriptionID;
      access.store.paypal_plan_id = ppResp.data.plan_id || cfg.planId || '';
      access.store.plan_expires_at = nextBilling.toISOString();
    }

    res.json({
      success: true,
      plan_tier: 'premium',
      subscription_status: 'active',
      paypal_subscription_id: subscriptionID,
      plan_expires_at: nextBilling.toISOString(),
    });
  } catch (err) {
    console.error('Error in /billing/paypal/activate:', err);
    res.status(500).json({ error: err.message || 'PayPal activation verification failed' });
  }
});

async function verifyPayPalWebhookSignature(req) {
  const { token, cfg } = await getPayPalAccessToken();
  if (!cfg.webhookId) {
    return { verified: false, reason: 'PAYPAL_WEBHOOK_ID is not configured' };
  }

  const authAlgo = req.headers['paypal-auth-algo'];
  const certUrl = req.headers['paypal-cert-url'];
  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionSig = req.headers['paypal-transmission-sig'];
  const transmissionTime = req.headers['paypal-transmission-time'];

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return { verified: false, reason: 'Missing PayPal webhook signature headers' };
  }

  const payloadStr = JSON.stringify({
    auth_algo: authAlgo,
    cert_url: certUrl,
    transmission_id: transmissionId,
    transmission_sig: transmissionSig,
    transmission_time: transmissionTime,
    webhook_id: cfg.webhookId,
    webhook_event: req.body,
  });

  const resp = await httpsJsonRequest(
    {
      hostname: cfg.host,
      path: '/v1/notifications/verify-webhook-signature',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr),
      },
    },
    payloadStr
  );

  const verified = resp.status === 200 && resp.data?.verification_status === 'SUCCESS';
  return {
    verified,
    reason: verified ? null : `PayPal signature check returned ${resp.data?.verification_status || resp.status}`,
  };
}

// PayPal Webhook Handler (Syncs Renewals, Cancellations & Suspensions)
app.post('/api/v1/webhooks/paypal', async (req, res) => {
  try {
    const ppCfg = getPayPalConfig();
    if (ppCfg.mode === 'live' && !ppCfg.webhookId) {
      return res.status(500).json({ error: 'PAYPAL_WEBHOOK_ID must be configured in live mode' });
    }

    if (ppCfg.webhookId) {
      const sigCheck = await verifyPayPalWebhookSignature(req);
      if (!sigCheck.verified) {
        console.warn('Rejected invalid PayPal webhook:', sigCheck.reason);
        return res.status(401).json({ error: 'Unauthorized: Invalid PayPal webhook signature' });
      }
    }

    const event = req.body || {};
    const eventType = event.event_type || '';
    const subId = event.resource?.id || event.resource?.billing_agreement_id;

    if (!subId) {
      return res.status(200).json({ received: true, ignored: true });
    }

    let newTier = null;
    let newStatus = null;

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' || eventType === 'PAYMENT.SALE.COMPLETED') {
      newTier = 'premium';
      newStatus = 'active';
    } else if (
      eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
      eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
      eventType === 'BILLING.SUBSCRIPTION.EXPIRED'
    ) {
      newTier = 'free';
      newStatus = eventType.split('.').pop().toLowerCase();
    }

    if (newTier && getIsConnected()) {
      await getPool().query(
        `UPDATE svt_stores
         SET plan_tier = ?, subscription_status = ?, updated_at = NOW()
         WHERE paypal_subscription_id = ?`,
        [newTier, newStatus, subId]
      );
    }

    res.status(200).json({ received: true, event_type: eventType });
  } catch (err) {
    console.error('Error in /webhooks/paypal:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================================================
// 4. SECURE INTERNAL STAFF API (Protected by x-staff-token)
// ============================================================================
app.get('/api/v1/internal/admin/stats', requireStaffAuth, async (req, res) => {
  try {
    if (getIsConnected()) {
      const pool = getPool();

      // OPTION 1: Auto-inherit verified company details for any pending store sharing a verified IP
      try {
        await pool.query(`
          UPDATE svt_stores target
          JOIN (
            SELECT activation_ip, company_name, physical_address, telephone, official_email, website, industry
            FROM svt_stores
            WHERE company_name IS NOT NULL AND TRIM(company_name) != '' AND status = 'Verified'
            GROUP BY activation_ip
          ) source ON target.activation_ip = source.activation_ip
          SET target.company_name = source.company_name,
              target.physical_address = COALESCE(source.physical_address, target.physical_address),
              target.telephone = COALESCE(source.telephone, target.telephone),
              target.official_email = COALESCE(source.official_email, target.official_email),
              target.website = COALESCE(source.website, target.website),
              target.industry = COALESCE(source.industry, target.industry),
              target.status = 'Verified',
              target.updated_at = NOW()
          WHERE target.status = 'Pending' OR target.company_name IS NULL OR TRIM(target.company_name) = '';
        `);
      } catch (reconcileErr) {
        console.warn('Auto-reconciliation note:', reconcileErr.message);
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_stores,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE() THEN 1 END) as today_activated,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_queue,
          COUNT(CASE WHEN status = 'Verified' THEN 1 END) as verified_count,
          COUNT(CASE WHEN status = 'Watching' THEN 1 END) as watching_count
        FROM svt_stores;
      `;
      const [stats] = await pool.query(statsQuery);
      const [stores] = await pool.query(`SELECT * FROM svt_stores ORDER BY created_at DESC;`);

      return res.json({
        kpis: stats[0],
        stores,
      });
    }

    // Auto-inherit verified company details for memoryDb
    const verifiedMap = new Map();
    memoryDb.stores.forEach((s) => {
      if (s.status === 'Verified' && s.company_name && s.activation_ip) {
        verifiedMap.set(s.activation_ip, s);
      }
    });
    memoryDb.stores.forEach((s) => {
      if ((s.status === 'Pending' || !s.company_name) && verifiedMap.has(s.activation_ip)) {
        const v = verifiedMap.get(s.activation_ip);
        s.company_name = v.company_name;
        s.physical_address = v.physical_address || s.physical_address;
        s.telephone = v.telephone || s.telephone;
        s.official_email = v.official_email || s.official_email;
        s.website = v.website || s.website;
        s.industry = v.industry || s.industry;
        s.status = 'Verified';
        s.updated_at = new Date().toISOString();
      }
    });

    const today = new Date().toDateString();
    const todayActivated = memoryDb.stores.filter(
      (s) => new Date(s.created_at).toDateString() === today
    ).length;
    const pendingQueue = memoryDb.stores.filter((s) => s.status === 'Pending').length;
    const verifiedCount = memoryDb.stores.filter((s) => s.status === 'Verified').length;
    const watchingCount = memoryDb.stores.filter((s) => s.status === 'Watching').length;

    res.json({
      kpis: {
        total_stores: memoryDb.stores.length,
        today_activated: todayActivated,
        pending_queue: pendingQueue,
        verified_count: verifiedCount,
        watching_count: watchingCount,
      },
      stores: memoryDb.stores,
    });
  } catch (err) {
    console.error('Error in /internal/admin/stats:', err);
    res.status(500).json({ error: 'Failed to fetch staff stats' });
  }
});

app.post('/api/v1/internal/admin/enrich-store', requireStaffAuth, async (req, res) => {
  try {
    const {
      store_id,
      company_name,
      physical_address,
      telephone,
      official_email,
      website,
      industry,
      activation_ip,
      status,
    } = req.body;

    if (!store_id) {
      return res.status(400).json({ error: 'store_id is required' });
    }

    const formattedStatus = status || 'Verified';

    if (getIsConnected()) {
      const pool = getPool();
      const query = `
        UPDATE svt_stores 
        SET company_name = COALESCE(?, company_name),
            physical_address = COALESCE(?, physical_address),
            telephone = COALESCE(?, telephone),
            official_email = COALESCE(?, official_email),
            website = COALESCE(?, website),
            industry = COALESCE(?, industry),
            activation_ip = COALESCE(?, activation_ip),
            status = ?,
            updated_at = NOW()
        WHERE id = ?;
      `;
      await pool.query(query, [
        company_name,
        physical_address,
        telephone,
        official_email,
        website,
        industry,
        activation_ip,
        formattedStatus,
        store_id,
      ]);
      const [updated] = await pool.query('SELECT * FROM svt_stores WHERE id = ?', [store_id]);

      // OPTION 1: Propagate verified company identity to any other stores on the same IP
      const targetIp = activation_ip || updated[0]?.activation_ip;
      if (targetIp && company_name) {
        try {
          await pool.query(
            `UPDATE svt_stores
             SET company_name = ?,
                 physical_address = COALESCE(?, physical_address),
                 telephone = COALESCE(?, telephone),
                 official_email = COALESCE(?, official_email),
                 website = COALESCE(?, website),
                 industry = COALESCE(?, industry),
                 status = ?,
                 updated_at = NOW()
             WHERE activation_ip = ? AND (company_name IS NULL OR status = 'Pending');`,
            [company_name, physical_address, telephone, official_email, website, industry, formattedStatus, targetIp]
          );
        } catch (propErr) {
          console.warn('Could not propagate company to stores with same IP:', propErr.message);
        }
      }

      return res.json({ success: true, store: updated[0] });
    }

    const store = memoryDb.stores.find((s) => Number(s.id) === Number(store_id));
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    if (company_name !== undefined) store.company_name = company_name;
    if (physical_address !== undefined) store.physical_address = physical_address;
    if (telephone !== undefined) store.telephone = telephone;
    if (official_email !== undefined) store.official_email = official_email;
    if (website !== undefined) store.website = website;
    if (industry !== undefined) store.industry = industry;
    if (activation_ip !== undefined) store.activation_ip = activation_ip;
    store.status = formattedStatus;
    store.updated_at = new Date().toISOString();

    // Propagate in memoryDb as well
    const memTargetIp = activation_ip || store.activation_ip;
    if (memTargetIp && company_name) {
      memoryDb.stores.forEach((s) => {
        if (s.activation_ip === memTargetIp && (s.status === 'Pending' || !s.company_name)) {
          s.company_name = company_name;
          s.physical_address = physical_address || s.physical_address;
          s.telephone = telephone || s.telephone;
          s.official_email = official_email || s.official_email;
          s.website = website || s.website;
          s.industry = industry || s.industry;
          s.status = formattedStatus;
          s.updated_at = new Date().toISOString();
        }
      });
    }

    res.json({ success: true, store });
  } catch (err) {
    console.error('Error in /internal/admin/enrich-store:', err);
    res.status(500).json({ error: 'Failed to enrich store' });
  }
});

// Create Store / Company Manually from Staff Portal
app.post('/api/v1/internal/admin/create-store', requireStaffAuth, async (req, res) => {
  try {
    const {
      site_url,
      site_name,
      activation_ip,
      company_name,
      physical_address,
      telephone,
      official_email,
      website,
      industry,
      status,
    } = req.body;

    if (!site_url) {
      return res.status(400).json({ error: 'site_url is required' });
    }

    const formattedStatus = status || 'Verified';
    const cleanSiteUrl = normalizeUrl(site_url);

    if (getIsConnected()) {
      const pool = getPool();
      const insertQuery = `
        INSERT INTO svt_stores 
        (site_url, site_name, activation_ip, company_name, physical_address, telephone, official_email, website, industry, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          company_name = VALUES(company_name),
          physical_address = VALUES(physical_address),
          telephone = VALUES(telephone),
          official_email = VALUES(official_email),
          website = VALUES(website),
          industry = VALUES(industry),
          status = VALUES(status);
      `;
      await pool.query(insertQuery, [
        cleanSiteUrl,
        site_name || company_name || 'Manual Store',
        activation_ip || null,
        company_name || site_name,
        physical_address || null,
        telephone || null,
        official_email || null,
        website || cleanSiteUrl,
        industry || 'B2B Enterprise',
        formattedStatus,
      ]);

      const [newStore] = await pool.query('SELECT * FROM svt_stores WHERE site_url = ?', [cleanSiteUrl]);
      return res.json({ success: true, store: newStore[0] });
    }

    const newStore = {
      id: Date.now(),
      site_url: cleanSiteUrl,
      site_name: site_name || company_name,
      activation_ip: activation_ip || '127.0.0.1',
      company_name: company_name || site_name,
      physical_address,
      telephone,
      official_email,
      website: website || cleanSiteUrl,
      industry: industry || 'B2B Enterprise',
      status: formattedStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryDb.stores.push(newStore);
    res.json({ success: true, store: newStore });
  } catch (err) {
    console.error('Error in /internal/admin/create-store:', err);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// Reverse-IP Intelligence / WHOIS Lookup Endpoint for Staff Operations
app.get('/api/v1/internal/admin/lookup-ip', requireStaffAuth, async (req, res) => {
  try {
    const ip = (req.query.ip || '').trim();
    if (!ip) {
      return res.status(400).json({ error: 'IP address query parameter required' });
    }

    const result = await autoEnrichIp(ip);
    res.json(result);
  } catch (err) {
    console.error('Error in /internal/admin/lookup-ip:', err);
    res.status(500).json({ error: 'IP lookup failed' });
  }
});

// Batch Automatic WHOIS & Reverse-IP Enrichment for All Pending Stores
app.post('/api/v1/internal/admin/auto-enrich-batch', requireStaffAuth, async (req, res) => {
  try {
    let enrichedCount = 0;

    if (getIsConnected()) {
      const pool = getPool();
      const [pendingRes] = await pool.query("SELECT id, activation_ip FROM svt_stores WHERE status = 'Pending'");
      for (const store of pendingRes) {
        if (!store.activation_ip) continue;
        const enriched = await autoEnrichIp(store.activation_ip);
        if (enriched && enriched.found && enriched.company_name) {
          await pool.query(
            `UPDATE svt_stores 
             SET company_name = ?, physical_address = ?, telephone = ?, official_email = ?, website = ?, industry = ?, status = 'Verified', updated_at = NOW()
             WHERE id = ?;`,
            [
              enriched.company_name,
              enriched.physical_address || '',
              enriched.telephone || '',
              enriched.official_email || '',
              enriched.website || '',
              enriched.industry || 'B2B Enterprise',
              store.id,
            ]
          );
          enrichedCount++;
        }
      }
      return res.json({ success: true, enrichedCount, totalPending: pendingRes.length });
    }

    const pendingStores = memoryDb.stores.filter((s) => (s.status || '').toLowerCase() === 'pending');
    for (const store of pendingStores) {
      if (!store.activation_ip) continue;
      const enriched = await autoEnrichIp(store.activation_ip);
      if (enriched && enriched.found && enriched.company_name) {
        store.company_name = enriched.company_name;
        store.physical_address = enriched.physical_address || store.physical_address;
        store.telephone = enriched.telephone || store.telephone;
        store.official_email = enriched.official_email || store.official_email;
        store.website = enriched.website || store.website;
        store.industry = enriched.industry || store.industry;
        store.status = 'Verified';
        store.updated_at = new Date().toISOString();
        enrichedCount++;
      }
    }

    res.json({ success: true, enrichedCount, totalPending: pendingStores.length });
  } catch (err) {
    console.error('Error in /internal/admin/auto-enrich-batch:', err);
    res.status(500).json({ error: 'Batch auto-enrichment failed' });
  }
});

// ============================================================================
// 5. SERVE DEDICATED FRONTEND UI FILE & LEGAL DISCLOSURES
// ============================================================================
// Expose Master Environment Configuration to Staff & Client UIs
app.get('/api/v1/config', (req, res) => {
  res.json(getMasterConfig());
});

app.get('/staff-portal', (req, res) => {
  const file1 = path.join(__dirname, 'public', 'staff-portal.html');
  const file2 = path.join(__dirname, 'staff-portal.html');
  const targetFile = fs.existsSync(file1) ? file1 : (fs.existsSync(file2) ? file2 : null);

  if (!targetFile) return res.status(404).send('Staff Portal file not found.');

  try {
    let html = fs.readFileSync(targetFile, 'utf8');
    const masterConfig = getMasterConfig();
    const injection = `<script>window.AMAZER_CONFIG = ${JSON.stringify(masterConfig)};</script>`;
    html = html.replace('</head>', `${injection}\n</head>`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    return res.sendFile(targetFile);
  }
});

// Terms of Service (WordPress.org SaaS Compliance)
app.get('/terms', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Amazer Analytics (Whois)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 40px 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    h1 { color: #0f172a; font-size: 28px; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #1e293b; font-size: 20px; margin-top: 28px; }
    p, li { color: #475569; font-size: 15px; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Amazer Cloud SaaS</span>
    <h1>Terms of Service</h1>
    <p><strong>Effective Date:</strong> November 10, 2026</p>
    <p>Welcome to <strong>Amazer Analytics (Whois)</strong>, provided by Amazer ("we", "us", or "our"). By activating or utilizing our WordPress plugin and connecting to our central cloud intelligence service, you agree to these Terms of Service.</p>
    
    <h2>1. Description of Service</h2>
    <p>Amazer Analytics (Whois) provides real-time B2B corporate visitor identification, reverse-IP resolution, and storefront analytics for website administrators and e-commerce merchants.</p>
    
    <h2>2. Permitted Use</h2>
    <p>You may use this service solely to monitor website visits, analyze corporate audience interest, and optimize your business-to-business marketing. You agree not to reverse engineer or abuse the API infrastructure.</p>
    
    <h2>3. Data Ownership & Privacy</h2>
    <p>You retain full ownership of your website data. We process anonymous storefront telemetry solely to perform corporate reverse-IP lookup and enrich lead intelligence on your behalf, in strict accordance with our Privacy Policy.</p>
    
    <h2>4. Availability & Support</h2>
    <p>We strive to maintain continuous service availability with a 99.9% uptime target. Scheduled maintenance or service updates are performed with minimal disruption.</p>
    
    <h2>5. Contact Information</h2>
    <p>For questions or assistance regarding these Terms, please contact our support team at <a href="mailto:support@plestar.net">support@plestar.net</a> or <a href="mailto:amazerinc@gmail.com">amazerinc@gmail.com</a>.</p>
    
    <div class="footer">
      &copy; 2026 Amazer Analytics (Whois). All rights reserved.
    </div>
  </div>
</body>
</html>`);
});

// Privacy Policy (WordPress.org SaaS Compliance)
app.get('/privacy', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Amazer Analytics (Whois)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 40px 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    h1 { color: #0f172a; font-size: 28px; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #1e293b; font-size: 20px; margin-top: 28px; }
    p, li { color: #475569; font-size: 15px; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
    .highlight { background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #0284c7; margin: 16px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Privacy & Data Governance</span>
    <h1>Privacy Policy</h1>
    <p><strong>Effective Date:</strong> November 10, 2026</p>
    <p>This Privacy Policy explains how <strong>Amazer Analytics (Whois)</strong> ("we", "us") collects, processes, and protects information when you use our WordPress plugin and connected cloud intelligence services.</p>
    
    <h2>1. Information We Collect</h2>
    <p>Our plugin transmits non-blocking telemetry beacons from store visitors to resolve corporate reverse-IP information. The data collected includes:</p>
    <ul>
      <li><strong>Network Data:</strong> Public visitor IP address (used to query public Autonomous System Numbers and corporate subnets).</li>
      <li><strong>Session Telemetry:</strong> Visited URL, referrer URL, browser type, operating system, and screen resolution.</li>
      <li><strong>Timestamp & Duration:</strong> Time of arrival and dwell time on visited pages.</li>
    </ul>

    <div class="highlight">
      <strong>Zero Personal Identifiable Information (No PII):</strong><br>
      We do NOT collect visitor names, personal email addresses, phone numbers, payment details, form inputs, or user passwords. Our system is specifically architected to identify business entities and public corporate network ranges, not private individuals.
    </div>

    <h2>2. Purpose of Processing</h2>
    <p>The collected telemetry is processed strictly to:</p>
    <ul>
      <li>Identify corporate networks and organizations browsing the merchant's store.</li>
      <li>Provide lead intent scoring (e.g., distinguishing visits to product specs, pricing, and checkout).</li>
      <li>Protect against bot traffic and automated scrapers.</li>
    </ul>

    <h2>3. GDPR & International Privacy Compliance</h2>
    <p>Our service adheres to GDPR and privacy-by-design standards. IP addresses are pseudonymized and queried against public business registries (WHOIS, ARIN, RIPE, APNIC). Telemetry is transmitted over secure encrypted connections (HTTPS / TLS).</p>

    <h2>4. Data Retention</h2>
    <p>Telemetry records and corporate hit histories are retained for analytics reporting and can be purged upon request by store administrators.</p>

    <h2>5. Contact Us</h2>
    <p>For any privacy inquiries, data subject requests, or questions regarding this policy, please reach out to <a href="mailto:amazerinc@gmail.com">amazerinc@gmail.com</a> or <a href="mailto:support@plestar.net">support@plestar.net</a>.</p>

    <div class="footer">
      &copy; 2026 Amazer Analytics (Whois). All rights reserved.
    </div>
  </div>
</body>
</html>`);
});

// Default Health Route
app.get('/health', async (req, res) => {
  const isDb = getIsConnected();
  let count = memoryDb.stores.length;
  if (isDb) {
    try {
      const [r] = await getPool().query('SELECT COUNT(*) as c FROM svt_stores');
      count = r[0].c;
    } catch (e) {}
  }
  res.json({
    status: 'healthy',
    mode: isDb ? `MySQL Persistent Engine (${getActiveDbName()})` : 'In-Memory Engine Active',
    database: isDb ? `MySQL (${getActiveDbName()} at ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3306'})` : 'None (In-Memory Fallback)',
    db_name: getActiveDbName(),
    activeStores: count,
  });
});

// Start server with native SSL (HTTPS) support if certificates are available
const localSslKey = path.join(__dirname, 'ssl', 'privkey.pem');
const localSslCert = path.join(__dirname, 'ssl', 'fullchain.pem');
const liveSslKey = process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/apps.plestarinc.com/privkey.pem';
const liveSslCert = process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/apps.plestarinc.com/fullchain.pem';

let server;
let isHttps = false;

const keyPath = fs.existsSync(localSslKey) ? localSslKey : (fs.existsSync(liveSslKey) ? liveSslKey : null);
const certPath = fs.existsSync(localSslCert) ? localSslCert : (fs.existsSync(liveSslCert) ? liveSslCert : null);

if (keyPath && certPath) {
  try {
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    server = https.createServer(sslOptions, app);
    isHttps = true;
    console.log(`🔒 HTTPS Server initialized using certificates: ${certPath}`);
  } catch (err) {
    console.warn(`⚠️ Could not initialize HTTPS (${err.message}). Falling back to HTTP.`);
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}

server.listen(PORT, '0.0.0.0', async () => {
  await initDb();
  console.log(`🚀 Whoisvisiting Engine listening at ${isHttps ? 'https' : 'http'}://0.0.0.0:${PORT}`);
  console.log(`🛡️  Internal Staff Portal UI served at ${isHttps ? 'https' : 'http'}://apps.plestarinc.com:${PORT}/staff-portal`);
});
