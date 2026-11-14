import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Eye,
  MapPin,
  Phone,
  Mail,
  Globe,
  Search,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Clock,
  Monitor,
  Laptop,
  Smartphone,
  Layers,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  UserCheck,
  Check,
  AlertCircle,
  HelpCircle,
  Zap,
  Filter,
  X,
  Flame,
  Send,
  Users,
  Info,
  Wifi,
  Trash2,
} from 'lucide-react';

// Educational Sample Demo Data (Displayed initially so new users can visualize intelligence)
const DEFAULT_DEMO_COMPANIES = [
  {
    id: 'demo_siemens',
    is_demo: true,
    company_name: 'Siemens Energy AG',
    activation_ip: '194.138.37.10',
    status: 'watching',
    physical_address: 'Otto-Hahn-Ring 6, 81739 Munich, Germany',
    telephone: '+49 89 636 00',
    official_email: 'contact@siemens-energy.com',
    website: 'https://siemens-energy.com',
    linkedin_url: 'https://linkedin.com/company/siemens-energy',
    twitter_url: 'https://twitter.com/siemens_energy',
    industry: 'Renewable Energy & Power Engineering',
    acquisition_channel: 'Google Organic Search',
    is_partner_store: 1,
    total_visits: 3,
    total_page_views: 4,
    total_dwell_seconds: 780,
    hits: [
      {
        id: 'demo_hit_1',
        visitor_ip: '194.138.37.10',
        page_url: '/product/industrial-turbine-sensor',
        referrer: 'https://www.google.com/search?q=industrial+sensors',
        screen_res: '1920x1080',
        browser: 'Chrome 122',
        duration_seconds: 420,
        visited_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
      {
        id: 'demo_hit_2',
        visitor_ip: '194.138.37.10',
        page_url: '/pricing',
        referrer: 'Direct Navigation',
        screen_res: '1920x1080',
        browser: 'Chrome 122',
        duration_seconds: 185,
        visited_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 'demo_hit_3',
        visitor_ip: '194.138.37.10',
        page_url: '/solutions/grid-technologies',
        referrer: 'https://www.google.com/',
        screen_res: '1920x1080',
        browser: 'Chrome 122',
        duration_seconds: 175,
        visited_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ],
  },
  {
    id: 'demo_vodafone',
    is_demo: true,
    company_name: 'Vodafone Business Group',
    activation_ip: '212.183.128.50',
    status: 'company',
    physical_address: 'Vodafone House, The Connection, Newbury RG14 2FN, UK',
    telephone: '+44 1635 33251',
    official_email: 'enterprise-sales@vodafone.com',
    website: 'https://vodafone.com',
    linkedin_url: 'https://linkedin.com/company/vodafone',
    twitter_url: 'https://twitter.com/vodafonegroup',
    industry: 'Telecommunications & 5G Infrastructure',
    acquisition_channel: 'LinkedIn Campaign',
    is_partner_store: 0,
    total_visits: 2,
    total_page_views: 2,
    total_dwell_seconds: 330,
    hits: [
      {
        id: 'demo_hit_4',
        visitor_ip: '212.183.128.50',
        page_url: '/solutions/5g-iot-gateway',
        referrer: 'https://linkedin.com/feed',
        screen_res: '1440x900',
        browser: 'Safari 17',
        duration_seconds: 240,
        visited_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      },
      {
        id: 'demo_hit_5',
        visitor_ip: '212.183.128.50',
        page_url: '/contact-sales',
        referrer: 'https://linkedin.com/feed',
        screen_res: '1440x900',
        browser: 'Safari 17',
        duration_seconds: 90,
        visited_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      },
    ],
  },
];

const DEFAULT_DEMO_GENERAL_VISITORS = [
  {
    id: 'demo_gen_1',
    is_demo: true,
    visitor_ip: '98.142.204.11',
    page_url: '/shop/smart-sensor',
    referrer: 'https://www.google.com/search?q=smart+sensor+store',
    screen_res: '1920x1080',
    browser: 'Chrome 122',
    duration_seconds: 140,
    visited_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'demo_gen_2',
    is_demo: true,
    visitor_ip: '98.142.204.11',
    page_url: '/cart',
    referrer: 'Direct Navigation',
    screen_res: '1920x1080',
    browser: 'Chrome 122',
    duration_seconds: 85,
    visited_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'demo_gen_3',
    is_demo: true,
    visitor_ip: '157.240.241.35',
    page_url: '/blog/b2b-analytics-guide',
    referrer: 'https://facebook.com',
    screen_res: '390x844',
    browser: 'Mobile Safari',
    duration_seconds: 210,
    visited_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
  },
];

export default function MerchantDashboard() {
  const wpSettings = window.amazerViSettings || window.amazerWhoisSettings || window.svtSettings || {
    storeUrl: 'http://localhost/wordpress_practice',
    apiUrl:
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:4000'
        : 'https://apps.plestarinc.com:3011',
    siteName: 'My Storefront',
    ajaxUrl: '/wp-admin/admin-ajax.php',
    nonce: '',
  };

  // State: Direct MySQL Database Live Data
  const [liveCompanies, setLiveCompanies] = useState([]);
  const [generalVisitors, setGeneralVisitors] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedGeneralIp, setSelectedGeneralIp] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'GENERAL'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Demo IP Management State (Persisted in localStorage so merchants can delete demo items)
  const [deletedDemoIps, setDeletedDemoIps] = useState(() => {
    try {
      const saved = localStorage.getItem('amazer_deleted_demo_ips');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [allDemoDismissed, setAllDemoDismissed] = useState(() => {
    try {
      return localStorage.getItem('amazer_demo_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleDeleteDemoIp = (ip, id) => {
    setDeletedDemoIps((prev) => {
      const next = [...new Set([...prev, ip, String(id)])];
      try {
        localStorage.setItem('amazer_deleted_demo_ips', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleDeleteAllDemo = () => {
    setAllDemoDismissed(true);
    try {
      localStorage.setItem('amazer_demo_dismissed', 'true');
    } catch (e) {}
  };

  const handleRestoreDemo = () => {
    setAllDemoDismissed(false);
    setDeletedDemoIps([]);
    try {
      localStorage.removeItem('amazer_demo_dismissed');
      localStorage.removeItem('amazer_deleted_demo_ips');
    } catch (e) {}
  };

  // Fetch Live Analytics Data from Central Express Node Backend (Connected to MySQL)
  const fetchLiveAnalytics = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = `${wpSettings.apiUrl}/api/v1/analytics/visitor-detail?storeUrl=${encodeURIComponent(
        wpSettings.storeUrl
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.companies && data.companies.length > 0) {
        setLiveCompanies(data.companies);
        setSelectedCompanyId((prev) => {
          return data.companies.some((c) => c.id === prev) ? prev : data.companies[0].id;
        });
      } else {
        setLiveCompanies([]);
      }
      if (data.general_visitors) {
        setGeneralVisitors(data.general_visitors);
      }
    } catch (err) {
      setErrorMsg(`Could not connect to database backend at ${wpSettings.apiUrl}. Ensure the backend service is running.`);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchLiveAnalytics();
  }, []);

  // Filtered Demo Data (Excludes individually deleted demo records)
  const visibleDemoCompanies = useMemo(() => {
    if (allDemoDismissed) return [];
    return DEFAULT_DEMO_COMPANIES.filter(
      (c) => !deletedDemoIps.includes(c.activation_ip) && !deletedDemoIps.includes(String(c.id))
    );
  }, [allDemoDismissed, deletedDemoIps]);

  const visibleDemoGeneralVisitors = useMemo(() => {
    if (allDemoDismissed) return [];
    return DEFAULT_DEMO_GENERAL_VISITORS.filter(
      (v) => !deletedDemoIps.includes(v.visitor_ip) && !deletedDemoIps.includes(String(v.id))
    );
  }, [allDemoDismissed, deletedDemoIps]);

  // Combined Data: Live Database records merged with Demo records if active
  const combinedCompanies = useMemo(() => {
    if (liveCompanies.length > 0) {
      return [...liveCompanies, ...visibleDemoCompanies];
    }
    return visibleDemoCompanies;
  }, [liveCompanies, visibleDemoCompanies]);

  const combinedGeneralVisitors = useMemo(() => {
    if (generalVisitors.length > 0) {
      return [...generalVisitors, ...visibleDemoGeneralVisitors];
    }
    return visibleDemoGeneralVisitors;
  }, [generalVisitors, visibleDemoGeneralVisitors]);

  const isShowingDemo = visibleDemoCompanies.length > 0 || visibleDemoGeneralVisitors.length > 0;

  // Active Company List
  const companies = useMemo(() => {
    return combinedCompanies.map((c) => ({
      id: c.id,
      is_demo: Boolean(c.is_demo),
      company_name: c.company_name || 'Unidentified Company',
      activation_ip: c.activation_ip || c.hits?.[0]?.visitor_ip || 'Corporate Subnet',
      initials: (c.company_name || 'UC')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      logo_bg: c.company_name?.includes('Siemens')
        ? 'bg-emerald-600'
        : c.company_name?.includes('Vodafone')
        ? 'bg-red-600'
        : c.company_name?.includes('Thomas')
        ? 'bg-[#e85933]'
        : 'bg-blue-600',
      status: c.status || 'company',
      is_partner_store: Boolean(c.is_partner_store),
      tags: [c.status === 'watching' ? 'Watching' : 'Company'],
      physical_address: c.physical_address || 'Address pending enrichment',
      telephone: c.telephone || '--',
      official_email: c.official_email || '--',
      website: c.website || '#',
      linkedin_url: c.linkedin_url,
      twitter_url: c.twitter_url,
      industry: c.industry || 'B2B Enterprise',
      acquisition_channel: c.acquisition_channel || 'Direct Navigation',
      acquisition_badge: c.acquisition_channel?.includes('Google') ? 'Google' : 'Direct',
      time_on_site: formatDuration(c.total_dwell_seconds || 120),
      total_visits: c.total_visits || 1,
      total_page_views: c.total_page_views || 1,
      page_visits: (c.hits || []).map((h, i) => ({
        id: 'hit_' + (h.id || i),
        visitor_ip: h.visitor_ip,
        status: 'active',
        date_time: formatHitTime(h.visited_at),
        duration: formatDuration(h.duration_seconds || 60),
        page_url: h.page_url || '/',
        browser: h.browser || 'Chrome',
        screen_res: h.screen_res || '1920x1080',
        device_type: 'Desktop',
        referrer: h.referrer || 'Direct Navigation',
        is_single_page: !h.duration_seconds || h.duration_seconds < 40,
      })),
    }));
  }, [combinedCompanies]);

  // Selected Company
  const selectedCompany = useMemo(() => {
    return companies.find((c) => String(c.id) === String(selectedCompanyId)) || companies[0] || null;
  }, [companies, selectedCompanyId]);

  // Group General Website Visitors by IP and sort by Highest Hits first
  const groupedGeneralVisitors = useMemo(() => {
    if (!combinedGeneralVisitors || combinedGeneralVisitors.length === 0) return [];
    const map = new Map();
    combinedGeneralVisitors.forEach((hit) => {
      const ip = hit.visitor_ip || 'Unknown IP';
      if (!map.has(ip)) {
        map.set(ip, {
          ip,
          is_demo: Boolean(hit.is_demo),
          total_hits: 0,
          total_dwell_seconds: 0,
          browser: hit.browser || 'Chrome',
          screen_res: hit.screen_res || '1920x1080',
          latest_visit: hit.visited_at,
          referrer: hit.referrer || 'Direct Navigation',
          hits: [],
        });
      }
      const item = map.get(ip);
      item.total_hits += 1;
      item.total_dwell_seconds += (hit.duration_seconds || 60);
      if (new Date(hit.visited_at) > new Date(item.latest_visit)) {
        item.latest_visit = hit.visited_at;
      }
      item.hits.push(hit);
    });

    const list = Array.from(map.values()).sort((a, b) => {
      if (b.total_hits !== a.total_hits) {
        return b.total_hits - a.total_hits;
      }
      return b.total_dwell_seconds - a.total_dwell_seconds;
    });

    list.forEach((v) => {
      v.hits.sort((a, b) => new Date(b.visited_at || 0) - new Date(a.visited_at || 0));
    });

    return list;
  }, [combinedGeneralVisitors]);

  // Active General Visitor (defaults to #1 Highest Hit IP)
  const activeGeneralVisitor = useMemo(() => {
    if (groupedGeneralVisitors.length === 0) return null;
    return (
      groupedGeneralVisitors.find((v) => v.ip === selectedGeneralIp) ||
      groupedGeneralVisitors[0]
    );
  }, [groupedGeneralVisitors, selectedGeneralIp]);

  return (
    <div className="w-full bg-[#f4f6f9] text-slate-800 antialiased min-h-screen p-4 sm:p-5 font-sans">
      {/* Top Banner / Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 mb-3.5 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 svt-pulsing-dot"></span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Amazer VI Analytics
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
                B2B Intelligence
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time corporate reverse-IP identification for{' '}
            <strong className="text-slate-700 font-semibold">{wpSettings.storeUrl}</strong>
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchLiveAnalytics}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all flex items-center gap-1.5"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interactive Demo Mode Notice Banner */}
      {isShowingDemo && (
        <div className="mb-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 border border-blue-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Demo Mode Active</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Data Preview
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Displaying sample B2B companies & website visits so you can explore how real-time intelligence visualizes. You can delete demo records anytime.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDeleteAllDemo}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
            title="Delete all demo data and show only real visitors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Delete Demo Data</span>
          </button>
        </div>
      )}

      {/* 2 Primary Modes & Company Selector Dropdown */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm mb-3.5">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Tab 1: All Identified */}
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>All Identified ({companies.length})</span>
          </button>

          {/* Tab 2: General Visitors */}
          <button
            type="button"
            onClick={() => setActiveFilter('GENERAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeFilter === 'GENERAL'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/10'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>General Visitors ({groupedGeneralVisitors.length})</span>
          </button>

          {/* Placed immediately after General Visitors Tab */}
          {activeFilter === 'ALL' && companies.length > 0 && (
            <div className="flex items-center gap-2.5 sm:ml-2 sm:pl-4 sm:border-l border-slate-200">
              <label htmlFor="company-dropdown" className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Select Company:</span>
              </label>
              <div className="relative">
                <select
                  id="company-dropdown"
                  value={selectedCompany?.id || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || e.target.value;
                    setSelectedCompanyId(val);
                  }}
                  className="appearance-none pl-3.5 pr-10 py-2 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-xs min-w-[260px] sm:min-w-[320px] transition-all"
                >
                  {companies.map((c) => {
                    let badge = '';
                    if (c.is_demo) badge = ' 💡 [Demo Sample]';
                    else if (c.is_partner_store) badge = ' 🌐 [Partner Store]';
                    else if ((c.status || '').toLowerCase() === 'watching') badge = ' ⭐ [Watching]';
                    return (
                      <option key={c.id} value={c.id}>
                        {c.company_name}{badge}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Row: Store Detail (Left) + Page Visits (Right) SIDE-BY-SIDE IN SAME ROW */}
      {activeFilter !== 'GENERAL' ? (
        selectedCompany ? (
          <div className="space-y-4">
            {/* Top Summary Metrics: B2B Identified Companies */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                    Identified Companies
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {companies.length}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                    Corporate Page Hits
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {companies.reduce((acc, c) => acc + (c.total_page_views || c.page_visits?.length || 1), 0)}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                    Total Corporate Dwell
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {formatDuration(
                      companies.reduce(
                        (acc, c) =>
                          acc +
                          (c.page_visits?.reduce((hAcc, h) => hAcc + (parseInt(h.duration) || 60), 0) || 120),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                    High Intent Leads
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {companies.filter((c) => c.status === 'watching' || c.is_partner_store || (c.page_visits && c.page_visits.length > 1)).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Two-Column Row */}
            <div className="flex flex-row gap-6 items-stretch w-full overflow-x-auto pb-4">
              {/* =================================================================== */}
              {/* LEFT COLUMN: STORE / COMPANY DETAIL CARD                            */}
              {/* =================================================================== */}
              <div className="w-[380px] lg:w-[420px] shrink-0 flex flex-col">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                  {/* Header: Company Name & Action Tags */}
                  <div className="p-6 border-b border-slate-100 shrink-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                          {selectedCompany.company_name}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {selectedCompany.industry}
                        </p>
                      </div>
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 ${selectedCompany.logo_bg}`}
                      >
                        {selectedCompany.initials}
                      </div>
                    </div>

                    {/* Status Badges - Placed on the same row */}
                    <div className="flex items-center gap-1.5 mt-3.5 flex-nowrap overflow-x-auto">
                      {selectedCompany.is_demo && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs shrink-0 whitespace-nowrap">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          Demo Sample
                        </span>
                      )}
                      {selectedCompany.status === 'watching' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs shrink-0 whitespace-nowrap">
                          <Eye className="w-3 h-3 text-amber-600" />
                          Watching
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs shrink-0 whitespace-nowrap">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        Company
                      </span>
                      {selectedCompany.is_partner_store && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0 whitespace-nowrap" title="Verified merchant on our B2B partner network">
                          <Globe className="w-3 h-3 text-emerald-600" />
                          Network Partner Store
                        </span>
                      )}
                      {selectedCompany.is_demo && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDemoIp(selectedCompany.activation_ip, selectedCompany.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-2xs shrink-0 whitespace-nowrap transition-all ml-auto"
                          title="Delete this demo IP"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                          <span>Delete Demo IP</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Physical Office Address & Details (Full Display - No Scrollbar) */}
                  <div className="p-6 space-y-4 flex-1">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        Physical Office Address
                      </span>
                      <p className="text-xs font-semibold text-slate-800 mt-1.5 leading-relaxed">
                        {selectedCompany.physical_address}
                      </p>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-500" />
                          Corporate IP
                        </span>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {selectedCompany.activation_ip || selectedCompany.page_visits?.[0]?.visitor_ip || 'Corporate Subnet'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          Telephone
                        </span>
                        <span className="font-mono font-semibold text-slate-700">
                          {selectedCompany.telephone}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          Official Email
                        </span>
                        {selectedCompany.official_email !== '--' ? (
                          <a
                            href={`mailto:${selectedCompany.official_email}`}
                            className="font-medium text-blue-600 hover:underline max-w-[200px] truncate"
                          >
                            {selectedCompany.official_email}
                          </a>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          Corporate Domain
                        </span>
                        {selectedCompany.website !== '#' ? (
                          <a
                            href={selectedCompany.website}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {selectedCompany.website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="pt-2 border-t border-slate-100/80">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Social Verification
                      </span>
                      <div className="flex items-center gap-2">
                        {selectedCompany.linkedin_url ? (
                          <a
                            href={selectedCompany.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 transition-colors border border-blue-200/60"
                          >
                            <span>LinkedIn Profile</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : null}

                        {selectedCompany.twitter_url ? (
                          <a
                            href={selectedCompany.twitter_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center gap-1.5 transition-colors border border-sky-200/60"
                          >
                            <span>X / Twitter</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : null}

                        {!selectedCompany.linkedin_url && !selectedCompany.twitter_url && (
                          <span className="text-xs text-slate-400 italic">No social profiles attached</span>
                        )}
                      </div>
                    </div>

                    {/* Traffic Source & Intent */}
                    <div className="pt-2 border-t border-slate-100/80">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Acquisition Channel
                      </span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-blue-500" />
                          {selectedCompany.acquisition_channel}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 font-mono">
                          {selectedCompany.acquisition_badge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================================== */}
              {/* RIGHT COLUMN: RECENT PAGE VISITS (Fixed Height & Inner Scroll)      */}
              {/* =================================================================== */}
              <div className="flex-1 min-w-[540px] h-[520px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      Browsing Journey & Page Hits
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pages visited by employees from <strong className="text-slate-800">{selectedCompany.company_name}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{selectedCompany.page_visits?.length || 0} Total Page Hits</span>
                    </span>
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedCompany.time_on_site} Total Dwell</span>
                    </span>
                  </div>
                </div>

                {/* Inner Scrollable Table */}
                <div className="flex-1 overflow-y-auto overflow-x-auto svt-custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
                      <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <th className="py-3 px-4 bg-slate-50">Status</th>
                        <th className="py-3 px-4 bg-slate-50">Date & Time</th>
                        <th className="py-3 px-4 bg-slate-50">Dwell Time</th>
                        <th className="py-3 px-4 bg-slate-50">Page Visited</th>
                        <th className="py-3 px-4 bg-slate-50">Device & Screen</th>
                        <th className="py-3 px-4 bg-slate-50">Referrer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(selectedCompany.page_visits || []).map((hit, idx) => (
                        <tr key={hit.id || idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-200">
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active Hit
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                            {hit.date_time}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                            {hit.duration}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-blue-700 font-semibold max-w-[220px] truncate block" title={hit.page_url}>
                              {hit.page_url}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{hit.browser}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{hit.screen_res}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-[180px] truncate" title={hit.referrer}>
                            {hit.referrer && hit.referrer.startsWith('http') ? (
                              <a
                                href={hit.referrer}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline text-slate-600"
                              >
                                {hit.referrer.replace(/^https?:\/\//, '')}
                              </a>
                            ) : (
                              <span>{hit.referrer}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Identified Companies Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              When corporate visitors browse your store, their company details and page visits will appear here automatically in real time.
            </p>
            <button
              type="button"
              onClick={handleRestoreDemo}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Preview Sample Demo Data</span>
            </button>
          </div>
        )
      ) : (
        /* =================================================================== */
        /* GENERAL & RESIDENTIAL WEBSITE TRAFFIC VIEW                          */
        /* =================================================================== */
        <div className="space-y-6">
          {/* Top Summary Metrics: Total Visitors, Total Page Views, Avg Session, Repeat Engagement */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Total Website Visitors
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {groupedGeneralVisitors.length}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Total Page Views
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {combinedGeneralVisitors.length}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Avg Session Duration
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {formatDuration(
                    groupedGeneralVisitors.length > 0
                      ? Math.round(
                          combinedGeneralVisitors.reduce((acc, h) => acc + (h.duration_seconds || 60), 0) /
                            groupedGeneralVisitors.length
                        )
                      : 120
                  )}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Repeat Website Hits
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {groupedGeneralVisitors.filter((v) => v.total_hits > 1).length}
                </span>
              </div>
            </div>
          </div>

          {groupedGeneralVisitors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No General Visitors Recorded Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Non-corporate website traffic from residential broadband and mobile networks will be listed here.
              </p>
              <button
                type="button"
                onClick={handleRestoreDemo}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Preview Sample Demo Visitors</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-row gap-6 items-stretch w-full overflow-x-auto pb-4">
              {/* LEFT COLUMN: Ranked Website Visitors (Highest Hits First, Scrollable) */}
              <div className="w-[380px] lg:w-[420px] shrink-0 h-[460px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Website Visitor IP Feeds</h3>
                    <p className="text-[11px] text-slate-500">Ranked by highest hit frequency</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {groupedGeneralVisitors.length} Unique IPs
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 svt-custom-scrollbar">
                  {groupedGeneralVisitors.map((visitor, index) => {
                    const isSelected = activeGeneralVisitor && activeGeneralVisitor.ip === visitor.ip;
                    const isTopHit = index === 0;

                    return (
                      <div
                        key={visitor.ip}
                        onClick={() => setSelectedGeneralIp(visitor.ip)}
                        className={`p-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/90 border-l-4 border-indigo-600 shadow-2xs'
                            : 'bg-white hover:bg-slate-50/80 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {visitor.is_demo && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                DEMO
                              </span>
                            )}
                            {isTopHit ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 flex items-center gap-1 shadow-2xs">
                                <Flame className="w-3 h-3 fill-amber-950" />
                                #1 Top
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 font-mono">
                                #{index + 1}
                              </span>
                            )}
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {visitor.ip}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-black font-mono ${
                              visitor.total_hits > 1
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {visitor.total_hits} {visitor.total_hits === 1 ? 'Hit' : 'Hits'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100">
                          <span className="flex items-center gap-1 text-slate-600">
                            <Wifi className="w-3 h-3 text-slate-400" />
                            Broadband Subnet
                          </span>
                          <span className="font-mono font-semibold text-slate-700">
                            ⏱ {formatDuration(visitor.total_dwell_seconds)}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                          <span>{visitor.browser} • {visitor.screen_res}</span>
                          <span>{formatHitTime(visitor.latest_visit).split(' - ')[1] || 'Recent'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: Selected IP Page Visits History (Equal Height & Inner Scroll) */}
              {activeGeneralVisitor && (
                <div className="flex-1 min-w-[540px] h-[460px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <h3 className="font-black text-slate-900 text-base">
                          Visit Journey for <code className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">{activeGeneralVisitor.ip}</code>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Detailed session timeline and journey across your store for this visitor IP.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {activeGeneralVisitor.is_demo && (
                        <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Demo Visitor</span>
                        </span>
                      )}
                      {activeGeneralVisitor.is_demo && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDemoIp(activeGeneralVisitor.ip, activeGeneralVisitor.ip)}
                          className="text-xs font-bold bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-xl border border-red-200 shadow-2xs transition-all flex items-center gap-1.5"
                          title="Delete this demo visitor IP"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Delete Demo IP</span>
                        </button>
                      )}
                      <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{activeGeneralVisitor.total_hits} Total Hits</span>
                      </span>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDuration(activeGeneralVisitor.total_dwell_seconds)} Dwell</span>
                      </span>
                    </div>
                  </div>

                  {/* Visit History Table: Inner Scrollable */}
                  <div className="flex-1 overflow-y-auto overflow-x-auto svt-custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-3 px-4 bg-slate-50">Status & Intent</th>
                          <th className="py-3 px-4 bg-slate-50">Date & Time</th>
                          <th className="py-3 px-4 bg-slate-50">Duration</th>
                          <th className="py-3 px-4 bg-slate-50">Page Visited</th>
                          <th className="py-3 px-4 bg-slate-50">Device & Screen</th>
                          <th className="py-3 px-4 bg-slate-50">Referrer Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {activeGeneralVisitor.hits.map((hit, i) => {
                          const isHighIntent = (hit.duration_seconds || 60) > 120 || activeGeneralVisitor.total_hits >= 3;
                          return (
                            <tr key={hit.id || i} className="hover:bg-slate-50/80 transition-colors border-b border-slate-200">
                              <td className="py-3.5 px-4">
                                {isHighIntent ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                                    High Engagement
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    Standard Browsing
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                                {formatHitTime(hit.visited_at)}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                                {formatDuration(hit.duration_seconds || 60)}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-mono text-indigo-700 font-semibold max-w-[200px] truncate block" title={hit.page_url}>
                                   {hit.page_url || '/'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                                <div className="font-semibold text-slate-800">{hit.browser || 'Chrome'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{hit.screen_res || '1920x1080'}</div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-[180px] truncate" title={hit.referrer}>
                                {hit.referrer || 'Direct Navigation'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helpers
function formatDuration(seconds) {
  if (!seconds) return '00:01:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:00`;
}

function formatHitTime(isoString) {
  if (!isoString) return 'Just now';
  const d = new Date(isoString);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
    ' - ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );
}
