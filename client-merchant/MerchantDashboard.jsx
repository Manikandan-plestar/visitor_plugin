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
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

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
    return mockWhoisvisitingCompanies;
  }, [useMockData, liveCompanies]);

  // Filtered by Search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    return companies.filter(
      (c) =>
        c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.physical_address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);

  // Selected Company
  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;
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

      {/* Quick Company Selector & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter identified companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-slate-800"
          />
        </div>

        {/* Horizontal Quick-Select Company Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {filteredCompanies.map((c) => {
            const isSelected = selectedCompany?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCompanyId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black ${
                    isSelected ? 'bg-white text-blue-700' : `${c.logo_bg} text-white`
                  }`}
                >
                  {c.initials}
                </span>
                <span>{c.company_name}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {c.total_visits}v
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Row: Store Detail (Left) + Page Visits (Right) SIDE-BY-SIDE IN SAME ROW */}
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
                <div className="flex items-center gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                    <Eye className="w-3.5 h-3.5" />
                    Watching
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                    <Building2 className="w-3.5 h-3.5" />
                    Company
                  </span>
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
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 hover:underline max-w-[220px] truncate">
                      <a href={hit.page_url} target="_blank" rel="noreferrer" title={hit.page_url}>
                        {hit.page_url}
                      </a>
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
