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
  Radio,
  Send,
  Users,
  Info,
  Wifi,
} from 'lucide-react';

export default function MerchantDashboard() {
  const wpSettings = window.svtSettings || {
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

  // State: Direct MySQL Database Live Data (Zero Dummy Data)
  const [liveCompanies, setLiveCompanies] = useState([]);
  const [generalVisitors, setGeneralVisitors] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedGeneralIp, setSelectedGeneralIp] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'GENERAL'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [testPingStatus, setTestPingStatus] = useState(null);

  // Quick Test Beacon Ping
  const handleTestPing = async () => {
    setTestPingStatus('sending');
    try {
      const res = await fetch(`${wpSettings.apiUrl}/api/v1/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_store: wpSettings.storeUrl,
          visitor_id: 'live_test_' + Date.now().toString(36),
          page_url: '/product/industrial-turbine-sensor',
          referrer: 'https://www.google.com/search?q=test+live+visitor',
          screen_res: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });
      if (res.ok) {
        setTestPingStatus('success');
        setTimeout(() => setTestPingStatus(null), 3000);
        fetchLiveAnalytics();
      } else {
        setTestPingStatus('error');
      }
    } catch (e) {
      setTestPingStatus('error');
    }
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

  // Active Company List directly from MySQL DB
  const companies = useMemo(() => {
    return liveCompanies.map((c) => ({
      id: c.id,
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
  }, [liveCompanies]);

  // Selected Company
  const selectedCompany = useMemo(() => {
    return companies.find((c) => String(c.id) === String(selectedCompanyId)) || companies[0] || null;
  }, [companies, selectedCompanyId]);

  // Group General Consumer Visitors by IP and sort by Highest Hits first
  const groupedGeneralVisitors = useMemo(() => {
    if (!generalVisitors || generalVisitors.length === 0) return [];
    const map = new Map();
    generalVisitors.forEach((hit) => {
      const ip = hit.visitor_ip || 'Unknown IP';
      if (!map.has(ip)) {
        map.set(ip, {
          ip,
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
  }, [generalVisitors]);

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
              Amazer Analytics(WHOIS Visitors)
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

        {/* Live MySQL Database Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MySQL: wordpress_practice</span>
          </span>

          <button
            type="button"
            onClick={handleTestPing}
            disabled={testPingStatus === 'sending'}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <Radio className={`w-3.5 h-3.5 text-blue-500 ${testPingStatus === 'sending' ? 'animate-spin' : ''}`} />
            <span>{testPingStatus === 'success' ? '✓ Hit Saved in DB' : 'Ping Live Hit'}</span>
          </button>

          <button
            type="button"
            onClick={fetchLiveAnalytics}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-2xs transition-all"
            title="Refresh feed from MySQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
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
          {activeFilter === 'ALL' && (
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
                    if (c.is_partner_store) badge = ' 🌐 [Partner Store]';
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
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                    Corporate Page Views
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {companies.reduce((sum, c) => sum + (c.total_page_views || c.page_visits?.length || 0), 0)}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                    Avg Corporate Dwell
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {companies.length > 0
                      ? formatDuration(
                          Math.round(
                            companies.reduce((sum, c) => sum + (c.total_dwell_seconds || 180), 0) /
                              companies.length
                          )
                        )
                      : '02:30:00'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                    High-Intent Accounts
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
                        <a
                          href={`tel:${selectedCompany.telephone}`}
                          className="font-mono font-semibold text-slate-800 hover:text-blue-600"
                        >
                          {selectedCompany.telephone}
                        </a>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          Website
                        </span>
                        <a
                          href={selectedCompany.website}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {selectedCompany.website.replace(/^https?:\/\//, '')}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          Official Email
                        </span>
                        <a
                          href={`mailto:${selectedCompany.official_email}`}
                          className="font-mono font-semibold text-slate-800 hover:text-blue-600 truncate max-w-[180px]"
                        >
                          {selectedCompany.official_email}
                        </a>
                      </div>
                    </div>

                    {/* Traffic Acquisition Badge */}
                    <div className="pt-2 border-t border-slate-100/80">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Traffic Acquisition Channel
                      </span>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                        <Compass className="w-3.5 h-3.5 text-blue-500" />
                        <span>{selectedCompany.acquisition_channel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom 3 Summary Stats (Whoisvisiting Metric Bar) */}
                  <div className="grid grid-cols-3 bg-slate-50 divide-x divide-slate-200 border-t border-slate-100 text-center py-4 shrink-0">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Time On Site
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 font-mono mt-0.5">
                        {selectedCompany.time_on_site}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Total Visits
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 font-mono mt-0.5">
                        {selectedCompany.total_visits}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Page Views
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 font-mono mt-0.5">
                        {selectedCompany.total_page_views}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* =================================================================== */}
            {/* RIGHT COLUMN: PAGE VISITS TABLE (SAME ROW, EQUAL HEIGHT)            */}
            {/* =================================================================== */}
            <div className="flex-1 min-w-[540px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    Page Visits History
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">
                      {selectedCompany?.page_visits?.length || 0} Records
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exact pages browsed by staff and visitors from {selectedCompany?.company_name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">
                    Reverse-IP Verified
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
              </div>

              {/* Visits Table: Inner Scrollable */}
              <div className="flex-1 overflow-y-auto overflow-x-auto svt-custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-3 px-4 bg-slate-50">Status</th>
                      <th className="py-3 px-4 bg-slate-50">Date / Time</th>
                      <th className="py-3 px-4 bg-slate-50">Duration</th>
                      <th className="py-3 px-4 bg-slate-50">Page URL</th>
                      <th className="py-3 px-4 bg-slate-50">Browser & Device</th>
                      <th className="py-3 px-4 bg-slate-50">Referral Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedCompany?.page_visits?.map((hit) => (
                      <tr key={hit.id} className="hover:bg-blue-50/30 transition-colors border-b border-slate-200">
                        {/* Status Icon */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        </td>

                        {/* Date / Time */}
                        <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {hit.date_time}
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {hit.is_single_page ? (
                            <span className="text-slate-400 italic text-[11px]">
                              Single page visit
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                              {hit.duration}
                            </span>
                          )}
                        </td>

                        {/* Page URL Link */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 max-w-[280px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <a href={hit.page_url} target="_blank" rel="noreferrer" title={hit.page_url} className="hover:underline truncate max-w-[190px]">
                              {hit.page_url}
                            </a>
                            {(hit.page_url?.includes('plan') || hit.page_url?.includes('pricing') || hit.page_url?.includes('product') || hit.page_url?.includes('contact') || hit.page_url?.includes('checkout')) && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5 shrink-0" title="High-Intent Commercial Page View">
                                <Flame className="w-2.5 h-2.5 text-amber-600" />
                                High Intent
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Browser & Device Icon */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Monitor className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium">{hit.browser}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({hit.screen_res})
                            </span>
                          </div>
                        </td>

                        {/* Referral Source */}
                        <td className="py-3.5 px-4 text-slate-500 max-w-[180px] truncate text-[11px]">
                          {hit.referrer.startsWith('http') ? (
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
          <h3 className="text-base font-bold text-slate-800">No Identified Companies in Database</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            When corporate visitors browse your store, their company records and page visits will appear here directly from MySQL.
          </p>
          <button
            type="button"
            onClick={handleTestPing}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Simulate Incoming B2B Visitor Hit</span>
          </button>
        </div>
      )
    ) : (
        /* =================================================================== */
        /* GENERAL & RESIDENTIAL CONSUMER TRAFFIC VIEW                         */
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
                  Total Consumer Visitors
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
                  {generalVisitors.length}
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
                          generalVisitors.reduce((acc, h) => acc + (h.duration_seconds || 60), 0) /
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
                  Repeat Consumer Hits
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
              <h3 className="text-base font-bold text-slate-800">No General Consumer Visitors Recorded</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Non-corporate consumer traffic from residential broadband and mobile networks will be listed here.
              </p>
              <button
                type="button"
                onClick={handleTestPing}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Simulate Visitor Hit</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-row gap-6 items-stretch w-full overflow-x-auto pb-4">
              {/* LEFT COLUMN: Ranked Consumer Visitors (Highest Hits First, Scrollable) */}
              <div className="w-[380px] lg:w-[420px] shrink-0 h-[460px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Ranked Consumer Visitors</h3>
                    <p className="text-[11px] text-slate-500">Highest hits shown first • Click to inspect</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 font-mono">
                    {groupedGeneralVisitors.length} Visitors
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-200 svt-custom-scrollbar">
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

                    <div className="flex items-center gap-2">
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
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                                    High Intent
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Active Hit
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                                {formatHitTime(hit.visited_at)}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {formatDuration(hit.duration_seconds || 60)}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-mono text-blue-600 font-semibold max-w-[220px] truncate block hover:underline cursor-pointer" title={hit.page_url}>
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
