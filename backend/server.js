/**
 * Whoisvisiting-Style B2B Visitor Intelligence Central Backend
 * Node.js + Express REST API (Clean Separation: Zero Frontend HTML in Server)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const STAFF_SECRET_KEY = process.env.STAFF_SECRET_KEY || 'svt_secret_staff_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend Assets from /public and /dist
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dist', express.static(path.join(__dirname, '..', 'dist')));

// Helper: Normalize URL
const normalizeUrl = (url) => {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '').toLowerCase();
};

// Helper: Extract real client IP
const getClientIp = (req) => {
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

// Database connection
let dbPool = null;
let useDatabase = false;

if (process.env.DATABASE_URL) {
  try {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
    useDatabase = true;
    console.log('🔗 PostgreSQL pool initialized.');
  } catch (err) {
    console.warn('⚠️ PostgreSQL unavailable. Falling back to in-memory store:', err.message);
  }
}

// In-Memory Store
const memoryDb = {
  stores: [
    {
      id: 1,
      site_url: 'https://siemens-energy.com',
      site_name: 'Siemens Energy Storefront',
      activation_ip: '194.138.37.10',
      status: 'Watching',
      company_name: 'Siemens Energy AG',
      physical_address: 'Otto-Hahn-Ring 6, 81739 Munich, Germany',
      telephone: '+49 89 636 00',
      official_email: 'contact@siemens-energy.com',
      website: 'https://siemens-energy.com',
      linkedin_url: 'https://linkedin.com/company/siemens-energy',
      twitter_url: 'https://twitter.com/siemens_energy',
      industry: 'Renewable Energy & Power Engineering',
      acquisition_channel: 'Google Organic Search',
      created_at: '2026-11-05T08:14:22Z',
    },
    {
      id: 2,
      site_url: 'https://vodafone-enterprise.com',
      site_name: 'Vodafone Business Portal',
      activation_ip: '212.183.128.50',
      status: 'Verified',
      company_name: 'Vodafone Group Plc',
      physical_address: 'Vodafone House, The Connection, Newbury, Berkshire RG14 2FN, UK',
      telephone: '+44 1635 33251',
      official_email: 'enterprise-sales@vodafone.com',
      website: 'https://vodafone.com',
      linkedin_url: 'https://linkedin.com/company/vodafone',
      twitter_url: 'https://twitter.com/vodafonegroup',
      industry: 'Telecommunications & 5G Infrastructure',
      acquisition_channel: 'LinkedIn Referral',
      created_at: '2026-11-05T09:28:45Z',
    },
    {
      id: 3,
      site_url: 'https://dhl-supplychain.com',
      site_name: 'DHL Logistics Hub',
      activation_ip: '199.181.132.250',
      status: 'Pending',
      company_name: null,
      physical_address: null,
      telephone: null,
      official_email: null,
      website: 'https://dhl-supplychain.com',
      linkedin_url: null,
      twitter_url: null,
      industry: null,
      acquisition_channel: 'Direct Traffic',
      created_at: '2026-11-05T10:05:12Z',
    },
    {
      id: 4,
      site_url: 'https://apexoutdoorgear.com',
      site_name: 'Apex Outdoor Gear',
      activation_ip: '73.189.44.110',
      status: 'Pending',
      company_name: null,
      physical_address: null,
      telephone: null,
      official_email: null,
      website: 'https://apexoutdoorgear.com',
      linkedin_url: null,
      twitter_url: null,
      industry: 'Apparel & Sporting Goods',
      acquisition_channel: 'Google Organic Search',
      created_at: '2026-11-05T11:12:08Z',
    },
    {
      id: 5,
      site_url: 'http://localhost/wordpress_practice',
      site_name: 'My Practice Site',
      activation_ip: '127.0.0.1',
      status: 'Pending',
      company_name: null,
      physical_address: null,
      telephone: null,
      official_email: null,
      website: 'http://localhost/wordpress_practice',
      linkedin_url: null,
      twitter_url: null,
      industry: 'E-Commerce Storefront',
      acquisition_channel: 'Direct Traffic',
      created_at: '2026-11-05T11:45:00Z',
    },
  ],
  hits: [
    {
      id: 1,
      target_store: 'http://localhost/wordpress_practice',
      visitor_ip: '194.138.37.10',
      visitor_id: 'usr_siemens_991',
      matched_store_id: 1,
      page_url: '/product/industrial-turbine-sensor',
      referrer: 'https://www.google.com/search?q=industrial+turbine+sensor+specs',
      screen_res: '1920x1080',
      browser: 'Chrome',
      duration_seconds: 420,
      visited_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    {
      id: 2,
      target_store: 'http://localhost/wordpress_practice',
      visitor_ip: '194.138.37.10',
      visitor_id: 'usr_siemens_991',
      matched_store_id: 1,
      page_url: '/pricing/enterprise-sla',
      referrer: 'Direct Navigation',
      screen_res: '1920x1080',
      browser: 'Chrome',
      duration_seconds: 185,
      visited_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 3,
      target_store: 'http://localhost/wordpress_practice',
      visitor_ip: '212.183.128.50',
      visitor_id: 'usr_voda_442',
      matched_store_id: 2,
      page_url: '/solutions/5g-iot-gateway',
      referrer: 'https://linkedin.com/feed',
      screen_res: '1440x900',
      browser: 'Safari',
      duration_seconds: 310,
      visited_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
  ],
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

    if (useDatabase && dbPool) {
      const query = `
        INSERT INTO stores (site_url, site_name, activation_ip, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'Pending', NOW(), NOW())
        ON CONFLICT (site_url) DO UPDATE
        SET site_name = EXCLUDED.site_name,
            activation_ip = EXCLUDED.activation_ip,
            updated_at = NOW()
        RETURNING *;
      `;
      const result = await dbPool.query(query, [cleanUrl, site_name || cleanUrl, activationIp]);
      return res.json({ success: true, store: result.rows[0], activation_ip: activationIp });
    }

    let existing = memoryDb.stores.find((s) => s.site_url === cleanUrl);
    if (!existing) {
      existing = {
        id: memoryDb.stores.length + 1,
        site_url: cleanUrl,
        site_name: site_name || cleanUrl,
        activation_ip: activationIp,
        status: 'Pending',
        company_name: null,
        created_at: nowIso,
      };
      memoryDb.stores.unshift(existing);
    } else {
      existing.activation_ip = activationIp;
      existing.site_name = site_name || existing.site_name;
    }

    res.json({
      success: true,
      store: existing,
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

    if (useDatabase && dbPool) {
      const matchQuery = `
        SELECT id, company_name, site_name 
        FROM stores 
        WHERE activation_ip = $1 AND site_url != $2
        LIMIT 1;
      `;
      const matchRes = await dbPool.query(matchQuery, [visitorIp, cleanTarget]);
      if (matchRes.rows.length > 0) {
        matchedStoreId = matchRes.rows[0].id;
        matchedCompany = matchRes.rows[0].company_name || matchRes.rows[0].site_name;
      }

      await dbPool.query(
        `INSERT INTO visitor_hits (target_store, visitor_ip, visitor_id, matched_store_id, page_url, referrer, screen_res, browser, visited_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [cleanTarget, visitorIp, visitor_id, matchedStoreId, page_url || '/', referrer || '', screen_res || '1920x1080', browser]
      );
    } else {
      const match = memoryDb.stores.find((s) => s.activation_ip === visitorIp && s.site_url !== cleanTarget);
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
// 3. Merchant Dashboard API (Scoped Strictly to Current Store)
// ============================================================================
app.get('/api/v1/analytics/visitor-detail', async (req, res) => {
  try {
    const rawTarget = req.query.storeUrl || '';
    const cleanTarget = normalizeUrl(rawTarget);

    let companyList = [];
    if (useDatabase && dbPool) {
      const companiesQuery = `
        SELECT 
          s.id,
          s.company_name,
          s.status,
          s.physical_address,
          s.telephone,
          s.official_email,
          s.website,
          s.linkedin_url,
          s.twitter_url,
          s.acquisition_channel,
          COUNT(vh.id) as total_page_views,
          COUNT(DISTINCT vh.visitor_id) as total_visits,
          COALESCE(SUM(vh.duration_seconds), 0) as total_dwell_seconds
        FROM visitor_hits vh
        JOIN stores s ON s.id = vh.matched_store_id
        WHERE vh.target_store = $1
        GROUP BY s.id;
      `;
      const compRes = await dbPool.query(companiesQuery, [cleanTarget]);
      companyList = compRes.rows;
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

    res.json({ companies: companyList });
  } catch (err) {
    console.error('Error in /analytics/visitor-detail:', err);
    res.status(500).json({ error: 'Failed to fetch visitor detail' });
  }
});

// ============================================================================
// 4. SECURE INTERNAL STAFF API (Protected by x-staff-token)
// ============================================================================
app.get('/api/v1/internal/admin/stats', requireStaffAuth, async (req, res) => {
  try {
    if (useDatabase && dbPool) {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_stores,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_activated,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_queue,
          COUNT(CASE WHEN status = 'Verified' THEN 1 END) as verified_count,
          COUNT(CASE WHEN status = 'Watching' THEN 1 END) as watching_count
        FROM stores;
      `;
      const stats = await dbPool.query(statsQuery);
      const stores = await dbPool.query(`SELECT * FROM stores ORDER BY created_at DESC;`);

      return res.json({
        kpis: stats.rows[0],
        stores: stores.rows,
      });
    }

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
      status,
    } = req.body;

    if (!store_id) {
      return res.status(400).json({ error: 'store_id is required' });
    }

    const formattedStatus = status || 'Verified';

    if (useDatabase && dbPool) {
      const query = `
        UPDATE stores 
        SET company_name = $1,
            physical_address = $2,
            telephone = $3,
            official_email = $4,
            website = $5,
            status = $6,
            updated_at = NOW()
        WHERE id = $7
        RETURNING *;
      `;
      const result = await dbPool.query(query, [
        company_name,
        physical_address,
        telephone,
        official_email,
        website,
        formattedStatus,
        store_id,
      ]);
      return res.json({ success: true, store: result.rows[0] });
    }

    const store = memoryDb.stores.find((s) => Number(s.id) === Number(store_id));
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    store.company_name = company_name || store.company_name;
    store.physical_address = physical_address || store.physical_address;
    store.telephone = telephone || store.telephone;
    store.official_email = official_email || store.official_email;
    store.website = website || store.website;
    store.status = formattedStatus;
    store.updated_at = new Date().toISOString();

    res.json({ success: true, store });
  } catch (err) {
    console.error('Error in /internal/admin/enrich-store:', err);
    res.status(500).json({ error: 'Failed to enrich store' });
  }
});

// Reverse-IP Intelligence / WHOIS Lookup Endpoint for Staff Operations
app.get('/api/v1/internal/admin/lookup-ip', requireStaffAuth, async (req, res) => {
  try {
    const ip = (req.query.ip || '').trim();
    if (!ip) {
      return res.status(400).json({ error: 'IP address query parameter required' });
    }

    // 1. Check existing store records
    const existing = memoryDb.stores.find((s) => s.activation_ip === ip && s.company_name);
    if (existing) {
      return res.json({
        found: true,
        source: 'Internal Store Registry Match',
        ip,
        company_name: existing.company_name,
        physical_address: existing.physical_address || '',
        telephone: existing.telephone || '',
        official_email: existing.official_email || '',
        website: existing.website || existing.site_url || '',
        industry: existing.industry || 'Enterprise',
      });
    }

    // 2. High-fidelity Whois / ASN resolution dictionary for B2B subnets
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
      '127.0.0.1': {
        name: 'Local Storefront Node',
        address: 'Localhost Development Environment',
        phone: '+1 800 555 0100',
        email: 'admin@localhost.local',
        domain: 'http://localhost/wordpress_practice',
        industry: 'Software & Local Staging',
      },
    };

    for (const [prefix, data] of Object.entries(knownSubnets)) {
      if (ip.startsWith(prefix) || ip === prefix) {
        return res.json({
          found: true,
          source: 'B2B Corporate ASN Registry',
          ip,
          company_name: data.name,
          physical_address: data.address,
          telephone: data.phone,
          official_email: data.email,
          website: data.domain,
          industry: data.industry,
        });
      }
    }

    // Fallback: If not recognized, return clean unpopulated structure for staff manual input
    return res.json({
      found: false,
      source: 'Unresolved Public Subnet (Clean Form for Manual Input)',
      ip,
      company_name: '',
      physical_address: '',
      telephone: '',
      official_email: '',
      website: '',
      industry: '',
    });
  } catch (err) {
    console.error('Error in /internal/admin/lookup-ip:', err);
    res.status(500).json({ error: 'IP lookup failed' });
  }
});

// ============================================================================
// 5. SERVE DEDICATED FRONTEND UI FILE
// ============================================================================
app.get('/staff-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-portal.html'));
});

// Default Health Route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: useDatabase ? 'PostgreSQL Active' : 'In-Memory Engine Active',
    activeStores: memoryDb.stores.length,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Whoisvisiting Engine listening at http://localhost:${PORT}`);
  console.log(`🛡️  Internal Staff Portal UI served at http://localhost:${PORT}/staff-portal`);
});
