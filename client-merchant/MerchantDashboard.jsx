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
} from 'lucide-react';
import { mockWhoisvisitingCompanies } from './merchantMockData';

export default function MerchantDashboard() {
  const wpSettings = window.svtSettings || {
    storeUrl: 'http://localhost/wordpress_practice',
    apiUrl: 'http://localhost:4000',
    siteName: 'My Storefront',
    ajaxUrl: '/wp-admin/admin-ajax.php',
    nonce: '',
  };

  // State
  const [useMockData, setUseMockData] = useState(true);
  const [liveCompanies, setLiveCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(mockWhoisvisitingCompanies[0]?.id || 1);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'GENERAL'
  const [loading, setLoading] = useState(false);
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
          visitor_id: 'test_beacon_' + Date.now().toString(36),
          page_url: '/product/industrial-turbine-sensor',
          referrer: 'https://www.google.com/search?q=test+live+visitor',
          screen_res: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });
      if (res.ok) {
        setTestPingStatus('success');
        setTimeout(() => setTestPingStatus(null), 3500);
        if (!useMockData) fetchLiveAnalytics();
      } else {
        setTestPingStatus('error');
      }
    } catch (e) {
      setTestPingStatus('error');
    }
  };

  // Fetch Live Analytics Data from Central Express Node Backend
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
        setSelectedCompanyId(data.companies[0].id);
      } else {
        setErrorMsg('No live visits recorded yet. Switch to presentation mock mode to view Whoisvisiting interface.');
      }
    } catch (err) {
      setErrorMsg(`Could not connect to ${wpSettings.apiUrl}. Using high-fidelity Whoisvisiting mock data.`);
      setUseMockData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!useMockData) {
      fetchLiveAnalytics();
    }
  }, [useMockData]);

  // Active Company List
  const companies = useMemo(() => {
    if (!useMockData && liveCompanies.length > 0) {
      return liveCompanies.map((c) => ({
        id: c.id,
        company_name: c.company_name || 'Unidentified Company',
        initials: (c.company_name || 'UC')
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        logo_bg: 'bg-blue-600',
        status: c.status || 'company',
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
    }
    return mockWhoisvisitingCompanies.map((c) => ({
      ...c,
      is_partner_store:
        c.is_partner_store !== undefined
          ? c.is_partner_store
          : c.company_name?.includes('Siemens') || c.company_name?.includes('Vodafone'),
    }));
  }, [useMockData, liveCompanies]);

  // Selected Company
  const selectedCompany = useMemo(() => {
    return companies.find((c) => String(c.id) === String(selectedCompanyId)) || companies[0] || null;
  }, [companies, selectedCompanyId]);

  return (
    <div className="w-full bg-[#f4f6f9] text-slate-800 antialiased min-h-screen p-4 sm:p-6 font-sans">
      {/* Top Banner / Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 svt-pulsing-dot"></span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Whoisvisiting
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
                B2B Intelligence
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time corporate reverse-IP identification for{' '}
            <strong className="text-slate-700 font-semibold">{wpSettings.storeUrl}</strong>
          </p>
        </div>

        {/* Mock / Live Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setUseMockData(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                useMockData
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Whoisvisiting Demo Data
            </button>
            <button
              type="button"
              onClick={() => setUseMockData(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !useMockData
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Telemetry
            </button>
          </div>

          <button
            type="button"
            onClick={fetchLiveAnalytics}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-sm transition-all"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2 Primary Modes & Company Selector Dropdown */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* ONLY 2 Tabs: All Identified & General Visitors */}
          <div className="flex items-center gap-2">
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
              <span>General Visitors (98)</span>
            </button>
          </div>

          {/* When 'All Identified' is selected: Dropdown showing all identified list to select company */}
          {activeFilter === 'ALL' && (
            <div className="flex items-center gap-2.5">
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
                  className="appearance-none pl-3.5 pr-10 py-2 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-xs min-w-[280px] sm:min-w-[340px] transition-all"
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
        <div className="flex flex-row gap-6 items-start w-full overflow-x-auto pb-4">
          {/* =================================================================== */}
          {/* LEFT COLUMN: STORE / COMPANY DETAIL CARD                            */}
          {/* =================================================================== */}
          <div className="w-[380px] lg:w-[420px] shrink-0">
            {selectedCompany && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header: Company Name & Action Tags */}
                <div className="p-6 border-b border-slate-100">
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

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {selectedCompany.status === 'watching' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                        <Eye className="w-3.5 h-3.5" />
                        Watching
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                      <Building2 className="w-3.5 h-3.5" />
                      Company
                    </span>
                    {selectedCompany.is_partner_store && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs" title="Verified merchant on our B2B partner network">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        Network Partner Store
                      </span>
                    )}
                  </div>
                </div>

                {/* Physical Office Address */}
                <div className="p-6 border-b border-slate-100 space-y-4">
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
                <div className="grid grid-cols-3 bg-slate-50 divide-x divide-slate-200 border-t border-slate-100 text-center py-4">
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
            )}
          </div>

          {/* =================================================================== */}
          {/* RIGHT COLUMN: PAGE VISITS TABLE (SAME ROW)                          */}
          {/* =================================================================== */}
          <div className="flex-1 min-w-[540px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            {/* Visits Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Page URL</th>
                    <th className="py-3 px-4">Browser & Device</th>
                    <th className="py-3 px-4">Referral Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCompany?.page_visits?.map((hit) => (
                    <tr key={hit.id} className="hover:bg-blue-50/30 transition-colors">
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
      ) : (
        /* =================================================================== */
        /* GENERAL & RESIDENTIAL CONSUMER TRAFFIC VIEW                         */
        /* =================================================================== */
        <div className="flex flex-row gap-6 items-start w-full overflow-x-auto pb-4">
          {/* Left Column: General Visitor Summary */}
          <div className="w-[380px] lg:w-[420px] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Consumer & Residential Traffic
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-2">
                General Store Visitors
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visitors connecting via consumer broadband, mobile LTE/5G, and dynamic ISP subnets.
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Consumer Visits</span>
                <span className="text-2xl font-black text-slate-900 font-mono">98</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Avg Session Time</span>
                <span className="text-2xl font-black text-slate-900 font-mono">00:02:10</span>
              </div>
            </div>

            {/* Top Consumer Telecom Carriers */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Top Consumer Carriers / ISPs
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-800">Comcast Cable Communications</span>
                  <span className="font-mono text-slate-500 font-bold">42 hits</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-800">Vodafone UK Consumer Mobile</span>
                  <span className="font-mono text-slate-500 font-bold">29 hits</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-800">Deutsche Telekom AG</span>
                  <span className="font-mono text-slate-500 font-bold">18 hits</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-800">Jio Broadband Services</span>
                  <span className="font-mono text-slate-500 font-bold">9 hits</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Reverse-IP Note
              </p>
              <p>When visitors connect from residential internet connections, their company ASN is unassigned. Full dwell time, page sequence, and geographic location are captured.</p>
            </div>
          </div>

          {/* Right Column: General Visits Feed */}
          <div className="flex-1 min-w-[540px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Consumer Session Telemetry</h3>
                <p className="text-xs text-slate-400 mt-0.5">Live stream of residential and general visitor navigation</p>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                98 Logged Sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Visitor Subnet / ISP</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Page Visited</th>
                    <th className="py-3 px-4">Browser & Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { ip: '82.165.44.xx', isp: 'Vodafone UK Mobile', loc: 'London, UK', dur: '00:03:15', page: '/product/industrial-turbine-sensor', dev: 'Chrome (Mobile)' },
                    { ip: '73.189.12.xx', isp: 'Comcast Cable', loc: 'Denver, CO, US', dur: '00:01:45', page: '/our-plans', dev: 'Safari (Desktop)' },
                    { ip: '217.80.99.xx', isp: 'Deutsche Telekom', loc: 'Frankfurt, DE', dur: '00:04:10', page: '/pricing', dev: 'Edge (Desktop)' },
                    { ip: '157.48.21.xx', isp: 'Jio Broadband', loc: 'Mumbai, IN', dur: '00:02:05', page: '/', dev: 'Chrome (Mobile)' },
                    { ip: '68.105.77.xx', isp: 'Cox Communications', loc: 'San Jose, CA, US', dur: '00:00:50', page: '/features', dev: 'Safari (Tablet)' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        <div>{row.ip}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{row.isp}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {row.loc}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {row.dur}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-blue-600 font-semibold">
                        {row.page}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {row.dev}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
