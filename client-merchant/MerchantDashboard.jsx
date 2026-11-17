import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Globe,
  Clock,
  RefreshCw,
  AlertCircle,
  Zap,
  Users,
  ShoppingBag,
  SlidersHorizontal,
  LayoutDashboard,
  Check,
  Trash2,
  Sparkles,
} from 'lucide-react';

import DashboardTab from './pages/DashboardTab';
import TrafficTab from './pages/TrafficTab';
import FirmographicTab from './pages/FirmographicTab';
import DemographicTab from './pages/DemographicTab';
import OpportunityTab from './pages/OpportunityTab';
import SlippedTab from './pages/SlippedTab';
import SettingsTab from './pages/SettingsTab';

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
  {
    id: 'demo_thomassmith',
    is_demo: true,
    company_name: 'Thomas Smith Fasteners Ltd',
    activation_ip: '195.144.11.22',
    status: 'watching',
    physical_address: 'Unit 2A, Swan Business Centre, Swan Lane, Hindley Green, Wigan WN2 4AT, UK',
    telephone: '01942 520260',
    official_email: 'sales@thomassmithfasteners.com',
    website: 'https://thomassmithfasteners.com',
    linkedin_url: 'https://linkedin.com/company/thomas-smith-fasteners',
    twitter_url: 'https://twitter.com/ts_fasteners',
    industry: 'Industrial Fasteners & Hardware Engineering',
    acquisition_channel: 'Google Organic Search',
    is_partner_store: 0,
    total_visits: 1,
    total_page_views: 1,
    total_dwell_seconds: 95,
    hits: [
      {
        id: 'demo_hit_6',
        visitor_ip: '195.144.11.22',
        page_url: '/our-plans',
        referrer: 'https://www.google.com',
        screen_res: '768x1024',
        browser: 'Safari 17',
        duration_seconds: 95,
        visited_at: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
      },
    ],
  },
];

const DEFAULT_DEMO_GENERAL_VISITORS = [
  {
    id: 'demo_gen_1',
    is_demo: true,
    visitor_ip: '98.142.204.11',
    city: 'Chicago',
    country: 'United States',
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
    city: 'Chicago',
    country: 'United States',
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
    city: 'Menlo Park',
    country: 'United States',
    page_url: '/blog/b2b-analytics-guide',
    referrer: 'https://facebook.com',
    screen_res: '390x844',
    browser: 'Mobile Safari',
    duration_seconds: 210,
    visited_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
  },
  {
    id: 'demo_gen_4',
    is_demo: true,
    visitor_ip: '104.244.42.1',
    city: 'San Francisco',
    country: 'United States',
    page_url: '/pricing',
    referrer: 'https://x.com/amazer_analytics',
    screen_res: '1920x1080',
    browser: 'Chrome 122',
    duration_seconds: 95,
    visited_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'demo_gen_5',
    is_demo: true,
    visitor_ip: '108.177.15.10',
    city: 'Mountain View',
    country: 'United States',
    page_url: '/products',
    referrer: 'Direct Navigation',
    screen_res: '1440x900',
    browser: 'Firefox 124',
    duration_seconds: 60,
    visited_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
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
    trackingEnabled: 'no',
    opportunityUrl: '/pricing',
    opportunityDuration: 60,
    slippedEnabled: 'yes',
    slippedWindow: '48h',
  };

  // Helper to determine initial tab from URL or localized settings
  const getInitialTab = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page') || '';
      if (page.includes('traffic')) return 'traffic';
      if (page.includes('firmographic')) return 'firmographic';
      if (page.includes('demographic')) return 'demographic';
      if (page.includes('opportunity')) return 'opportunity';
      if (page.includes('slipped')) return 'slipped';
      if (page.includes('settings')) return 'settings';
    } catch (e) {}
    return wpSettings.initialTab || 'dashboard';
  };

  // Active Multi-Page Route Tab
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Synchronize Tab Switching with Browser History & WordPress Sidebar
  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    try {
      const pageSlug = tabId === 'dashboard' ? 'amazer-visitor-intelligence' : `amazer-visitor-intelligence-${tabId}`;
      const newUrl = `admin.php?page=${pageSlug}`;
      window.history.pushState({ tab: tabId }, '', newUrl);

      // Highlight active item in WordPress left sidebar submenu
      const wpMenu = document.querySelector('li.toplevel_page_amazer-visitor-intelligence');
      if (wpMenu) {
        wpMenu.querySelectorAll('.wp-submenu li').forEach((li) => {
          const a = li.querySelector('a');
          if (a && a.getAttribute('href') && a.getAttribute('href').includes(pageSlug)) {
            li.classList.add('current');
            a.classList.add('current');
          } else {
            li.classList.remove('current');
            if (a) a.classList.remove('current');
          }
        });
      }
    } catch (e) {}
  };

  // Listen for browser back / forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Data States
  const [liveCompanies, setLiveCompanies] = useState([]);
  const [generalVisitors, setGeneralVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Selected company ID in Firmographic view
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  // Demo Data State
  const [deletedDemoIps, setDeletedDemoIps] = useState(() => {
    try {
      const stored = localStorage.getItem('_amazer_via_deleted_demo_ips');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [allDemoDismissed, setAllDemoDismissed] = useState(() => {
    try {
      return localStorage.getItem('_amazer_via_all_demo_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Settings States
  const [trackingEnabled, setTrackingEnabled] = useState(wpSettings.trackingEnabled === 'yes');
  const [togglingTracking, setTogglingTracking] = useState(false);
  const [opportunityUrl, setOpportunityUrl] = useState(wpSettings.opportunityUrl || '/pricing');
  const [opportunityDuration, setOpportunityDuration] = useState(wpSettings.opportunityDuration || 60);
  const [slippedEnabled, setSlippedEnabled] = useState(wpSettings.slippedEnabled !== 'no');
  const [slippedWindow, setSlippedWindow] = useState(wpSettings.slippedWindow || '48h');

  // Time & Duration Formatting Helpers
  const formatDuration = (totalSeconds) => {
    const s = parseInt(totalSeconds, 10) || 60;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const formatHitTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recent';
    }
  };

  // Fetch Live Analytics from Backend API
  const fetchLiveAnalytics = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Flush any locally queued 5-minute batch hits immediately so latest telemetry appears
      if (wpSettings.ajaxUrl && wpSettings.nonce) {
        try {
          const form = new FormData();
          form.append('action', 'amazer_via_flush_batch');
          form.append('nonce', wpSettings.nonce);
          await fetch(wpSettings.ajaxUrl, { method: 'POST', body: form });
        } catch (e) {}
      }

      const url = `${wpSettings.apiUrl.replace(/\/+$/, '')}/api/v1/analytics/visitor-detail?storeUrl=${encodeURIComponent(
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

  useEffect(() => {
    fetchLiveAnalytics();
  }, []);

  // Filtered Demo Data
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

  // Combined Data: Live records merged with Demo records
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

  // Active Company List with formatted fields
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
      physical_address: c.physical_address || 'Address pending enrichment',
      telephone: c.telephone || '--',
      official_email: c.official_email || '--',
      website: c.website || '#',
      linkedin_url: c.linkedin_url,
      twitter_url: c.twitter_url,
      industry: c.industry || 'B2B Enterprise',
      acquisition_channel: c.acquisition_channel || 'Direct Navigation',
      time_on_site: formatDuration(c.total_dwell_seconds || 120),
      total_visits: c.total_visits || 1,
      total_page_views: c.total_page_views || 1,
      page_visits: (c.hits || []).map((h, i) => ({
        id: 'hit_' + (h.id || i),
        visitor_ip: h.visitor_ip,
        visited_at: h.visited_at,
        date_time: formatHitTime(h.visited_at),
        duration: formatDuration(h.duration_seconds || 60),
        page_url: h.page_url || '/',
        browser: h.browser || 'Chrome',
        screen_res: h.screen_res || '1920x1080',
        device_type: (h.browser || '').includes('Mobile') ? 'Mobile' : 'Desktop',
        referrer: h.referrer || 'Direct Navigation',
      })),
    }));
  }, [combinedCompanies]);

  // Set initial selected company
  useEffect(() => {
    if (!selectedCompanyId && companies.length > 0) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  // All flattened hits across the storefront
  const allHits = useMemo(() => {
    const list = [];
    companies.forEach((c) => {
      (c.hits || []).forEach((h) => list.push({ ...h, isCorporate: true, companyName: c.company_name }));
    });
    combinedGeneralVisitors.forEach((g) => {
      list.push({ ...g, isCorporate: false, companyName: 'General Visitor' });
    });
    return list;
  }, [companies, combinedGeneralVisitors]);

  // Handler: Toggle Consent (Guideline 7 Compliance)
  const handleToggleTracking = async () => {
    const nextState = !trackingEnabled;
    setTogglingTracking(true);
    try {
      const formData = new FormData();
      formData.append('action', 'amazer_via_toggle_tracking');
      formData.append('nonce', wpSettings.nonce);
      formData.append('enabled', nextState ? 'yes' : 'no');

      const res = await fetch(wpSettings.ajaxUrl, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setTrackingEnabled(nextState);
      }
    } catch (e) {
      setTrackingEnabled(nextState);
    } finally {
      setTogglingTracking(false);
    }
  };

  // Handler: Save Opportunity Settings
  const handleSaveOpportunitySettings = async (url, duration) => {
    setOpportunityUrl(url);
    setOpportunityDuration(duration);
    const formData = new FormData();
    formData.append('action', 'amazer_via_save_opportunity_settings');
    formData.append('nonce', wpSettings.nonce);
    formData.append('opportunity_url', url);
    formData.append('opportunity_duration', duration);
    await fetch(wpSettings.ajaxUrl, { method: 'POST', body: formData });
  };

  // Handler: Save Slipped Settings
  const handleSaveSlippedSettings = async (enabled, window) => {
    setSlippedEnabled(enabled);
    setSlippedWindow(window);
    const formData = new FormData();
    formData.append('action', 'amazer_via_save_slipped_settings');
    formData.append('nonce', wpSettings.nonce);
    formData.append('slipped_enabled', enabled ? 'yes' : 'no');
    formData.append('slipped_window', window);
    await fetch(wpSettings.ajaxUrl, { method: 'POST', body: formData });
  };

  // Handler: Save API Endpoint
  const handleSaveApiEndpoint = async (url) => {
    const formData = new FormData();
    formData.append('action', 'amazer_via_save_endpoint');
    formData.append('nonce', wpSettings.nonce);
    formData.append('api_url', url);
    await fetch(wpSettings.ajaxUrl, { method: 'POST', body: formData });
  };

  // Handler: Delete Demo Data
  const handleDeleteAllDemo = () => {
    localStorage.setItem('_amazer_via_all_demo_dismissed', 'true');
    setAllDemoDismissed(true);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#f4f6f9] text-slate-800 antialiased min-h-screen p-3 sm:p-5 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 mb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 svt-pulsing-dot"></span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Amazer Visitor Intelligence
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
            onClick={handleToggleTracking}
            disabled={togglingTracking}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              trackingEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to toggle storefront visitor tracking consent"
          >
            <span className={`w-2 h-2 rounded-full ${trackingEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span>{togglingTracking ? 'Saving...' : trackingEnabled ? 'Tracking Active' : 'Tracking Paused'}</span>
          </button>

          <button
            type="button"
            onClick={fetchLiveAnalytics}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Delete Demo Data Button on Top Header after Refresh Button */}
          {isShowingDemo && (
            <button
              type="button"
              onClick={handleDeleteAllDemo}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Delete educational demo data"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Explicit Consent Notice Banner (WordPress Guideline 7) */}
      {!trackingEnabled && (
        <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-amber-950">Amazer Visitor Intelligence is Inactive</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                As per WordPress privacy guidelines, visitor telemetry is disabled by default upon activation. Click Enable to begin capturing and identifying visiting businesses via Amazer Cloud API in accordance with our{' '}
                <a href="https://plestar.net/amazer-analytics/terms.html" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-950">Terms of Service</a>{' '}and{' '}
                <a href="https://plestar.net/amazer-analytics/privacy.html" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-950">Privacy Policy</a>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleTracking}
            disabled={togglingTracking}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
          >
            {togglingTracking ? 'Enabling...' : 'Enable Amazer Visitor Intelligence'}
          </button>
        </div>
      )}

      {/* Backend Connection Error */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Multi-Page Route Render */}
      <div className="w-full max-w-full overflow-hidden">
        {activeTab === 'dashboard' && (
          <DashboardTab
            companies={companies}
            generalVisitors={combinedGeneralVisitors}
            allHits={allHits}
            opportunityCount={
              allHits.filter(
                (h) => (h.page_url || '').includes(opportunityUrl) && (h.duration_seconds || 60) >= opportunityDuration
              ).length
            }
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            onNavigateTab={(tab) => handleTabSwitch(tab)}
          />
        )}

        {activeTab === 'traffic' && (
          <TrafficTab
            companies={companies}
            generalVisitors={combinedGeneralVisitors}
            allHits={allHits}
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            onNavigateTab={(tab) => handleTabSwitch(tab)}
          />
        )}

        {activeTab === 'firmographic' && (
          <FirmographicTab
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={(id) => setSelectedCompanyId(id)}
          />
        )}

        {activeTab === 'demographic' && <DemographicTab />}

        {activeTab === 'opportunity' && (
          <OpportunityTab
            companies={companies}
            generalVisitors={combinedGeneralVisitors}
            allHits={allHits}
            opportunityUrl={opportunityUrl}
            opportunityDuration={opportunityDuration}
            onNavigateTab={(tab) => handleTabSwitch(tab)}
            onSelectCompany={(id) => setSelectedCompanyId(id)}
          />
        )}

        {activeTab === 'slipped' && <SlippedTab />}

        {activeTab === 'settings' && (
          <SettingsTab
            wpSettings={wpSettings}
            opportunityUrl={opportunityUrl}
            opportunityDuration={opportunityDuration}
            slippedEnabled={slippedEnabled}
            slippedWindow={slippedWindow}
            trackingEnabled={trackingEnabled}
            onSaveOpportunitySettings={handleSaveOpportunitySettings}
            onSaveSlippedSettings={handleSaveSlippedSettings}
            onSaveApiEndpoint={handleSaveApiEndpoint}
            onToggleTracking={handleToggleTracking}
          />
        )}
      </div>
    </div>
  );
}
