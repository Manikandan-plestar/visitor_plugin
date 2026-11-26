import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  Search,
  Calendar,
  ExternalLink,
  Building2,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  Laptop,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Eye,
  Crosshair,
  SlidersHorizontal,
  X,
  Target,
  Lock,
  Crown,
} from 'lucide-react';
import { parseTrafficSource, getIpLocation, maskIpAddress } from './TrafficTab';

// Helper to format dwell duration
const formatDwellTime = (seconds) => {
  const s = parseInt(seconds, 10) || 60;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
};

// Default high-intent competitor footprint demo records
const DEMO_FOOTPRINT_RECORDS = [
  {
    id: 'demo_fp_1',
    is_demo: true,
    visitor_ip: '194.138.37.10',
    company_name: 'Siemens AG Industrial Solutions',
    industry: 'Industrial Automation & Machinery',
    competitor_store: 'https://competitor-sensorhub.com',
    competitor_domain: 'competitor-sensorhub.com',
    page_url: '/products/high-precision-laser-sensor-series-x',
    referrer: 'https://google.com/search?q=best+industrial+sensors',
    browser: 'Chrome 122',
    duration_seconds: 245,
    visited_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    cross_shop_intent: 'High Intent',
    our_page_visited: '/product/industrial-turbine-sensor',
  },
  {
    id: 'demo_fp_2',
    is_demo: true,
    visitor_ip: '212.183.128.50',
    company_name: 'Vodafone Enterprise Global',
    industry: 'Telecommunications & Cloud Networking',
    competitor_store: 'https://rival-iot-networks.io',
    competitor_domain: 'rival-iot-networks.io',
    page_url: '/enterprise/pricing-plans',
    referrer: 'https://linkedin.com/feed',
    browser: 'Safari 17',
    duration_seconds: 360,
    visited_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(), // 1.5 hrs ago
    cross_shop_intent: 'Active Comparison',
    our_page_visited: '/pricing',
  },
  {
    id: 'demo_fp_3',
    is_demo: true,
    visitor_ip: '195.144.11.22',
    company_name: 'Thomas Smith Fasteners Ltd',
    industry: 'Industrial Hardware & Engineering',
    competitor_store: 'https://apex-fasteners-direct.co.uk',
    competitor_domain: 'apex-fasteners-direct.co.uk',
    page_url: '/catalog/heavy-duty-titanium-bolts',
    referrer: 'https://www.google.co.uk',
    browser: 'Safari 17',
    duration_seconds: 180,
    visited_at: new Date(Date.now() - 1000 * 60 * 220).toISOString(), // 3.5 hrs ago
    cross_shop_intent: 'Price Evaluating',
    our_page_visited: '/contact-sales',
  },
  {
    id: 'demo_fp_4',
    is_demo: true,
    visitor_ip: '98.142.204.11',
    company_name: 'Illinois Precision Engineering Group',
    industry: 'Precision Tooling & Manufacturing',
    competitor_store: 'https://precision-machining-corp.com',
    competitor_domain: 'precision-machining-corp.com',
    page_url: '/custom-cnc-tooling-quote',
    referrer: 'Direct Navigation',
    browser: 'Edge 123',
    duration_seconds: 420,
    visited_at: new Date(Date.now() - 1000 * 60 * 380).toISOString(),
    cross_shop_intent: 'High Intent',
    our_page_visited: '/solutions/custom-hardware',
  },
];

export default function FootprintTab({
  companies = [],
  generalVisitors = [],
  allHits = [],
  competitorUrls = '',
  wpSettings = {},
  planMeta = {},
  onOpenUpgrade,
  onSaveCompetitors,
  onNavigateTab,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState('all');

  // Competitor Watchlist Management State
  const [watchlistInput, setWatchlistInput] = useState('');
  const [competitorList, setCompetitorList] = useState(() => {
    const raw = competitorUrls || wpSettings.competitorUrls || '';
    const arr = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    return arr.length > 0 ? arr : ['competitor-sensorhub.com', 'rival-iot-networks.io', 'apex-fasteners-direct.co.uk'];
  });
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Live Footprint Network Hits from backend
  const [liveFootprints, setLiveFootprints] = useState([]);
  const [loadingFootprints, setLoadingFootprints] = useState(false);

  const isPremium = planMeta?.plan_tier === 'premium';
  const [watchlistLimitMsg, setWatchlistLimitMsg] = useState(false);

  // Fetch Live Cross-Store hits from Central Backend
  const fetchLiveFootprints = async () => {
    if (!wpSettings.apiUrl || !wpSettings.storeUrl) return;
    setLoadingFootprints(true);
    try {
      const headers = {};
      if (wpSettings.storeApiKey) {
        headers['x-store-key'] = wpSettings.storeApiKey;
      }
      const compParam = competitorList.join(',');
      const res = await fetch(
        `${wpSettings.apiUrl.replace(/\/+$/, '')}/api/v1/analytics/footprint?storeUrl=${encodeURIComponent(wpSettings.storeUrl)}&competitors=${encodeURIComponent(compParam)}`,
        { headers }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        setLiveFootprints(data.matches);
      }
    } catch (e) {
      console.warn('Footprint live fetch error:', e);
    } finally {
      setLoadingFootprints(false);
    }
  };

  useEffect(() => {
    fetchLiveFootprints();
  }, [competitorList]);

  // Add Competitor to Watchlist
  const handleAddCompetitor = async (e) => {
    e.preventDefault();
    const clean = watchlistInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean || competitorList.includes(clean)) return;

    if (!isPremium && competitorList.length >= 1) {
      setWatchlistLimitMsg(true);
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }
    setWatchlistLimitMsg(false);

    const updated = [...competitorList, clean];
    setCompetitorList(updated);
    setWatchlistInput('');

    if (onSaveCompetitors) {
      setIsSavingWatchlist(true);
      await onSaveCompetitors(updated.join(', '));
      setIsSavingWatchlist(false);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }
  };

  // Remove Competitor from Watchlist
  const handleRemoveCompetitor = async (domainToRemove) => {
    const updated = competitorList.filter((d) => d !== domainToRemove);
    setCompetitorList(updated);

    if (onSaveCompetitors) {
      setIsSavingWatchlist(true);
      await onSaveCompetitors(updated.join(', '));
      setIsSavingWatchlist(false);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }
  };

  // Build combined Footprint Records (Live network matches + Educational Demo Records)
  const combinedFootprints = useMemo(() => {
    const list = [];

    // 1. Live network matches from server
    liveFootprints.forEach((hit) => {
      // Find matching company info from current store if available
      const matchingCompany = companies.find(
        (c) => c.activation_ip === hit.visitor_ip || c.hits?.some((h) => h.visitor_ip === hit.visitor_ip)
      );

      const compDomain = (hit.competitor_store || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      list.push({
        id: `live_fp_${hit.id}`,
        is_demo: false,
        is_locked: Boolean(hit.is_locked),
        visitor_ip: hit.visitor_ip,
        company_name: matchingCompany?.company_name || hit.identified_company || 'B2B Enterprise',
        industry: matchingCompany?.industry || hit.industry || 'Commercial Enterprise',
        competitor_store: hit.competitor_store,
        competitor_domain: compDomain || hit.competitor_store,
        page_url: hit.page_url || '/',
        referrer: hit.referrer || 'Direct Navigation',
        browser: hit.browser || 'Chrome 122',
        duration_seconds: hit.duration_seconds || 60,
        visited_at: hit.visited_at,
        cross_shop_intent: (hit.duration_seconds > 180 || hit.page_url?.includes('pricing')) ? 'High Intent' : 'Active Comparison',
        our_page_visited: matchingCompany?.hits?.[0]?.page_url || '/products',
      });
    });

    // 2. Demo records (if live records are fewer than 10 or to demonstrate feature)
    DEMO_FOOTPRINT_RECORDS.forEach((demo) => {
      // Filter demo records by watchlist if watchlist has entries
      if (competitorList.length === 0 || competitorList.some((c) => demo.competitor_domain.includes(c) || c.includes(demo.competitor_domain))) {
        list.push(demo);
      }
    });

    return list;
  }, [liveFootprints, competitorList, companies]);

  // Filtered Footprint Records based on Search, Date, and Competitor Domain
  const filteredRecords = useMemo(() => {
    return combinedFootprints.filter((item) => {
      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesComp = item.company_name?.toLowerCase().includes(q);
        const matchesIp = item.visitor_ip?.toLowerCase().includes(q);
        const matchesPage = item.page_url?.toLowerCase().includes(q);
        const matchesCompetitor = item.competitor_domain?.toLowerCase().includes(q);
        if (!matchesComp && !matchesIp && !matchesPage && !matchesCompetitor) return false;
      }

      // Competitor Domain Filter
      if (selectedCompetitor !== 'all' && item.competitor_domain !== selectedCompetitor) {
        return false;
      }

      // Date Range Filter
      const hitTime = new Date(item.visited_at).getTime();
      const now = Date.now();

      if (dateFilter === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (hitTime < startOfToday.getTime()) return false;
      } else if (dateFilter === 'yesterday') {
        const startOfYesterday = new Date();
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);
        const endOfYesterday = new Date(startOfYesterday);
        endOfYesterday.setHours(23, 59, 59, 999);
        if (hitTime < startOfYesterday.getTime() || hitTime > endOfYesterday.getTime()) return false;
      } else if (dateFilter === '7d') {
        if (hitTime < now - 7 * 86400000) return false;
      } else if (dateFilter === '30d') {
        if (hitTime < now - 30 * 86400000) return false;
      } else if (dateFilter === 'custom') {
        if (fromDate) {
          const startCustom = new Date(fromDate).setHours(0, 0, 0, 0);
          if (hitTime < startCustom) return false;
        }
        if (toDate) {
          const endCustom = new Date(toDate).setHours(23, 59, 59, 999);
          if (hitTime > endCustom) return false;
        }
      }

      return true;
    });
  }, [combinedFootprints, searchQuery, selectedCompetitor, dateFilter, fromDate, toDate]);

  // Metrics summary
  const totalCrossVisits = filteredRecords.length;
  const uniqueCompaniesCrossShopping = useMemo(() => {
    return new Set(filteredRecords.map((r) => r.company_name || r.visitor_ip)).size;
  }, [filteredRecords]);
  const highIntentMatches = useMemo(() => {
    return filteredRecords.filter((r) => r.cross_shop_intent === 'High Intent').length;
  }, [filteredRecords]);

  return (
    <div className="space-y-4">
      {/* Top Value Banner & Feature Explanation */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-400/30">
                <Compass className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Competitor Footprint Intelligence
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-mono border border-indigo-400/20">
                    B2B Network Telemetry
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                  Cross-store telemetry identifies when prospective enterprise accounts viewing your storefront also visit competitor websites participating in the Amazer B2B network.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchLiveFootprints}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Refresh footprint intelligence"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingFootprints ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* Competitor Watchlist Input Strip */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200">Competitor Watchlist:</span>
            </div>

            <form onSubmit={handleAddCompetitor} className="flex items-center gap-2 max-w-md w-full">
              <input
                type="text"
                value={watchlistInput}
                onChange={(e) => setWatchlistInput(e.target.value)}
                placeholder="Add competitor domain (e.g. competitor.com)..."
                className="w-full px-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <button
                type="submit"
                disabled={isSavingWatchlist || !watchlistInput.trim()}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shrink-0 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Active Watchlist Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {competitorList.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-900/60 border border-indigo-700/50 text-indigo-200 text-xs font-mono"
              >
                <span>{domain}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCompetitor(domain)}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                  title={`Remove ${domain} from watchlist`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {saveSuccessMsg && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Watchlist updated</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cross-Shop Events</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Crosshair className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalCrossVisits}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Total cross-site competitor views detected</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Companies</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{uniqueCompaniesCrossShopping}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Identified enterprise prospects shopping both stores</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Intent Signals</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{highIntentMatches}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active comparisons on pricing and product specifications</p>
        </div>
      </div>

      {/* Unified Search & Filters Row */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">Competitor Journey Footprint</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
            {filteredRecords.length} records
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Competitor Domain Selector */}
          <select
            value={selectedCompetitor}
            onChange={(e) => setSelectedCompetitor(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Competitor Domains</option>
            {competitorList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Date Range Selector */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom Date</option>
          </select>

          {/* Custom Date Pickers */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-slate-700 text-xs focus:outline-none"
              />
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-slate-700 text-xs focus:outline-none"
              />
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                  className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                  title="Clear custom range"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, IP, URL..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white w-48 sm:w-56 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footprint Journey Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Visitor / Company IP</th>
                <th className="py-3 px-4">Competitor Site</th>
                <th className="py-3 px-4">Competitor Page Visited</th>
                <th className="py-3 px-4">Our Store Interaction</th>
                <th className="py-3 px-4">Dwell & Device</th>
                <th className="py-3 px-4">Cross-Shop Date & Time</th>
                <th className="py-3 px-4 text-right">Market Intent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Compass className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No competitor footprint records matched your criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Add more competitor domains to your watchlist or check back as visitors browse the Amazer B2B network.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Visitor / Company IP */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{item.company_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {maskIpAddress(item.visitor_ip)}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.industry}</div>
                        </div>
                      </div>
                    </td>

                    {/* Competitor Site */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {item.competitor_domain}
                        </span>
                      </div>
                    </td>

                    {/* Competitor Page Visited */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-mono text-slate-700 font-medium truncate" title={item.page_url}>
                        {item.page_url}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5" title={item.referrer}>
                        Via: {item.referrer}
                      </div>
                    </td>

                    {/* Our Store Interaction */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-mono text-emerald-700 font-semibold truncate bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 inline-block" title={item.our_page_visited}>
                        {item.our_page_visited}
                      </div>
                    </td>

                    {/* Dwell & Device */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDwellTime(item.duration_seconds)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.browser}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        {new Date(item.visited_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(item.visited_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Market Intent Badge */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {item.is_locked ? (
                        <button
                          type="button"
                          onClick={onOpenUpgrade}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 cursor-pointer"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Unlock</span>
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            item.cross_shop_intent === 'High Intent'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : item.cross_shop_intent === 'Active Comparison'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>{item.cross_shop_intent}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
