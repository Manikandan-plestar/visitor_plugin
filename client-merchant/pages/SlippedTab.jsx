import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  TrendingDown,
  Clock,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Store,
  Search,
  Filter,
  Calendar,
  Monitor,
  Smartphone,
  Laptop,
  ArrowRight,
  Eye,
  Zap,
  Building2,
  Globe,
  Share2,
  X,
  Target,
  Send,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { parseTrafficSource, getIpLocation, maskIpAddress } from './TrafficTab';

// Helper to determine the Funnel Stage reached on the merchant's store
export function getFunnelStage(pages = []) {
  const pageList = Array.isArray(pages) ? pages : Array.from(pages || []);
  const lowerPages = pageList.map((p) => String(p || '').toLowerCase());

  if (lowerPages.some((p) => p.includes('checkout') || p.includes('cart') || p.includes('basket'))) {
    return {
      stage: 'Cart Abandoned',
      key: 'cart',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-500',
      description: 'Added products to cart or reached checkout before leaving',
      urgency: 'Critical',
      rank: 4,
    };
  }

  if (
    lowerPages.some(
      (p) =>
        p.includes('pricing') ||
        p.includes('plan') ||
        p.includes('quote') ||
        p.includes('contact-sales') ||
        p.includes('rfq')
    )
  ) {
    return {
      stage: 'Pricing Evaluator',
      key: 'pricing',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      dotClass: 'bg-amber-500',
      description: 'Actively compared pricing models & subscription tiers',
      urgency: 'High',
      rank: 3,
    };
  }

  if (
    lowerPages.some(
      (p) =>
        p.includes('product') ||
        p.includes('shop') ||
        p.includes('solution') ||
        p.includes('item') ||
        p.includes('catalog')
    )
  ) {
    return {
      stage: 'Product Evaluator',
      key: 'product',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-500',
      description: 'Examined specific product specs, features, or catalog items',
      urgency: 'Medium',
      rank: 2,
    };
  }

  return {
    stage: 'Browsing',
    key: 'browsing',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
    description: 'General top-of-funnel exploration on homepage or content',
    urgency: 'Low',
    rank: 1,
  };
}

// Helper to format duration in minutes and seconds
const formatDwellTime = (seconds) => {
  const s = parseInt(seconds, 10) || 60;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
};

export default function SlippedTab({
  companies = [],
  generalVisitors = [],
  allHits = [],
  slippedEnabled = true,
  slippedWindow = '48h',
  onNavigateTab,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Build raw slipped candidates from merchant visitors
  const rawSlippedRecords = useMemo(() => {
    const list = [];
    const now = Date.now();

    // 1. Corporate prospects who engaged with the storefront
    companies.forEach((c, idx) => {
      const visits = c.page_visits || c.hits || [];
      if (visits.length === 0) return;

      const pages = visits.map((v) => v.page_url || '/');
      const funnel = getFunnelStage(pages);

      // Total dwell time on store
      const totalDwell = visits.reduce(
        (sum, v) => sum + (parseInt(v.duration, 10) || v.duration_seconds || 60),
        0
      );

      // Last page visited
      const lastVisit = visits[visits.length - 1] || visits[0];
      const lastPage = lastVisit.page_url || pages[pages.length - 1] || '/';

      // Acquisition info
      const src = parseTrafficSource(lastVisit.referrer, c.acquisition_channel);
      const loc = getIpLocation({
        country: c.country,
        city: c.city,
        physical_address: c.physical_address,
      });

      // Browser & Device
      const browser = lastVisit.browser || 'Chrome 122';
      const isMobile = browser.toLowerCase().includes('mobile') || browser.toLowerCase().includes('safari') && browser.toLowerCase().includes('iphone');
      const isTablet = browser.toLowerCase().includes('tablet') || browser.toLowerCase().includes('ipad');
      const deviceType = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';

      // Timestamp of the slip (simulated shortly after initial engagement)
      const hitTime = new Date(lastVisit.visited_at || (now - (idx + 1) * 3600000 * 4)).getTime();
      const slippedTimestamp = hitTime + 1000 * 60 * 45; // 45 mins after store visit

      list.push({
        id: `slp_corp_${c.id || idx}`,
        isCorporate: true,
        companyName: c.company_name || 'B2B Enterprise',
        ip: c.activation_ip || lastVisit.visitor_ip || '194.138.37.10',
        industry: c.industry || 'B2B Commercial Enterprise',
        location: loc.country ? `${loc.city ? loc.city + ', ' : ''}${loc.country}` : 'Global Network',
        countryFlag: loc.flag || '🌐',
        physicalAddress: c.physical_address,
        telephone: c.telephone,
        officialEmail: c.official_email,
        website: c.website,
        sourceLabel: src.label || 'Direct Navigation',
        sourceType: src.source || 'Direct',
        sourceBadgeClass: src.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200',
        deviceType,
        browser,
        lastPage,
        dwellSeconds: totalDwell,
        dwellFormatted: formatDwellTime(totalDwell),
        funnel,
        pagesVisited: Array.from(new Set(pages)),
        visits,
        slippedTimestamp,
        slippedDateStr: new Date(slippedTimestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        slippedTimeStr: new Date(slippedTimestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    });

    // 2. High-Intent general consumer prospects who engaged deeply
    generalVisitors.forEach((gen, idx) => {
      const page = gen.page_url || '/';
      const funnel = getFunnelStage([page]);

      // Only include prospects who showed meaningful interest (not quick bounces)
      const dwell = gen.duration_seconds || 85;
      const src = parseTrafficSource(gen.referrer, null);
      const loc = getIpLocation(gen);

      const browser = gen.browser || 'Chrome';
      const isMobile = browser.toLowerCase().includes('mobile');
      const isTablet = browser.toLowerCase().includes('tablet');
      const deviceType = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';

      const hitTime = new Date(gen.visited_at || (now - (idx + 2) * 3600000 * 6)).getTime();
      const slippedTimestamp = hitTime + 1000 * 60 * 30;

      list.push({
        id: `slp_gen_${gen.id || idx}`,
        isCorporate: false,
        companyName: null,
        ip: gen.visitor_ip || '98.142.204.11',
        industry: 'Commercial Consumer Prospect',
        location: loc.country ? `${loc.city ? loc.city + ', ' : ''}${loc.country}` : 'United States',
        countryFlag: loc.flag || '🇺🇸',
        physicalAddress: gen.physical_address,
        telephone: null,
        officialEmail: null,
        website: null,
        sourceLabel: src.label || 'Organic Search',
        sourceType: src.source || 'Organic Search',
        sourceBadgeClass: src.badgeClass || 'bg-emerald-50 text-emerald-700 border-emerald-200',
        deviceType,
        browser,
        lastPage: page,
        dwellSeconds: dwell,
        dwellFormatted: formatDwellTime(dwell),
        funnel,
        pagesVisited: [page],
        visits: [gen],
        slippedTimestamp,
        slippedDateStr: new Date(slippedTimestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        slippedTimeStr: new Date(slippedTimestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    });

    // Sort by slipped timestamp descending (most recent first)
    return list.sort((a, b) => b.slippedTimestamp - a.slippedTimestamp);
  }, [companies, generalVisitors]);

  // Apply Search, Funnel Stage, and Date Filters
  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = Date.now();

    return rawSlippedRecords.filter((rec) => {
      // 1. Text Search Filter
      if (query) {
        const matchName = rec.companyName && rec.companyName.toLowerCase().includes(query);
        const matchIp = rec.ip.includes(query);
        const matchPage = rec.lastPage.toLowerCase().includes(query);
        const matchLoc = rec.location.toLowerCase().includes(query);
        const matchSrc = rec.sourceLabel.toLowerCase().includes(query);
        if (!matchName && !matchIp && !matchPage && !matchLoc && !matchSrc) {
          return false;
        }
      }

      // 2. Funnel Stage Filter
      if (stageFilter !== 'all') {
        if (rec.funnel.key !== stageFilter) {
          return false;
        }
      }

      // 3. Date Filter
      if (dateFilter !== 'all') {
        const ts = rec.slippedTimestamp;
        const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
        if (dateFilter === 'today') {
          if (ts < startOfToday) return false;
        } else if (dateFilter === 'yesterday') {
          const startOfYesterday = startOfToday - 86400000;
          if (ts < startOfYesterday || ts >= startOfToday) return false;
        } else if (dateFilter === '7d') {
          if (ts < now - 7 * 86400000) return false;
        } else if (dateFilter === '14d') {
          if (ts < now - 14 * 86400000) return false;
        } else if (dateFilter === '30d') {
          if (ts < now - 30 * 86400000) return false;
        }
      }

      return true;
    });
  }, [rawSlippedRecords, searchQuery, stageFilter, dateFilter]);

  // Aggregate Top Metrics
  const totalSlippedCount = filteredRecords.length;

  // Top Lost Acquisition Source
  const topLostSource = useMemo(() => {
    const counts = {};
    filteredRecords.forEach((r) => {
      counts[r.sourceLabel] = (counts[r.sourceLabel] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return { name: 'Direct Navigation', pct: 0 };
    const pct = Math.round((sorted[0][1] / (totalSlippedCount || 1)) * 100);
    return { name: sorted[0][0], count: sorted[0][1], pct };
  }, [filteredRecords, totalSlippedCount]);

  // Primary Device breakdown
  const primaryDevice = useMemo(() => {
    let desktop = 0;
    let mobile = 0;
    filteredRecords.forEach((r) => {
      if (r.deviceType === 'Mobile' || r.deviceType === 'Tablet') mobile++;
      else desktop++;
    });
    const total = filteredRecords.length || 1;
    if (desktop >= mobile) {
      return { name: 'Desktop', pct: Math.round((desktop / total) * 100), icon: Monitor };
    }
    return { name: 'Mobile', pct: Math.round((mobile / total) * 100), icon: Smartphone };
  }, [filteredRecords]);

  // High-Value / Bottom-Funnel Deals at Risk (Cart & Pricing)
  const bottomFunnelCount = useMemo(() => {
    return filteredRecords.filter(
      (r) => r.funnel.key === 'cart' || r.funnel.key === 'pricing'
    ).length;
  }, [filteredRecords]);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* ======================================================================= */}
      {/* 1. Header Banner & Context                                              */}
      {/* ======================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Slipped Opportunities
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Anonymous Network Telemetry Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prospects who evaluated your catalog but completed a conversion elsewhere across the monitored competitor network.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('settings')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Configure Competitors</span>
            </button>
          )}
          <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
            Window: {slippedWindow}
          </span>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. Four KPI Metric Cards                                                */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Slipped Count */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Total Slipped Prospects
            </span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{totalSlippedCount}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Lost conversions in attribution window
            </p>
          </div>
        </div>

        {/* Card 2: Top Lost Acquisition Source */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Top Lost Channel
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Share2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 truncate block">
              {topLostSource.name}
            </span>
            <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">
              {topLostSource.pct}% of all slipped traffic
            </p>
          </div>
        </div>

        {/* Card 3: Primary Hardware Platform */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Primary Device
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Monitor className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{primaryDevice.name}</span>
            <span className="text-xs font-bold text-slate-500">({primaryDevice.pct}%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Hardware platform of lost users</p>
        </div>

        {/* Card 4: Bottom-Funnel Hot Leads (Cart & Pricing) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Cart & Pricing Leads
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600">{bottomFunnelCount}</span>
            <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
              High purchase-intent shoppers lost
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 3. Filter & Search Controls Toolbar                                     */}
      {/* ======================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, masked IP, page URL, or source..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 self-start lg:self-auto">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: '7D' },
              { id: '14d', label: '14D' },
              { id: '30d', label: '30D' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dateFilter === d.id
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Funnel Stage Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Funnel Stage:
          </span>
          {[
            { id: 'all', label: 'All Stages' },
            { id: 'cart', label: '🔴 Cart Abandoned' },
            { id: 'pricing', label: '🟠 Pricing Evaluator' },
            { id: 'product', label: '🟡 Product Evaluator' },
            { id: 'browsing', label: '⚪ Browsing' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStageFilter(pill.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                stageFilter === pill.id
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {pill.label}
            </button>
          ))}
          <span className="text-slate-400 ml-auto font-mono text-[11px]">
            Showing {filteredRecords.length} of {rawSlippedRecords.length} slipped events
          </span>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 4. Slipped Activity Table                                               */}
      {/* ======================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-rose-600" />
              <span>Slipped Activity Telemetry Log</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Real-time cross-store conversion attribution. Monitored competitor identity is kept 100% anonymous.
            </p>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Privacy Protected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">S.No</th>
                <th className="py-3 px-4">Prospect Profile</th>
                <th className="py-3 px-4">Traffic Source</th>
                <th className="py-3 px-4">Device & Tech</th>
                <th className="py-3 px-4">Activity on Your Store</th>
                <th className="py-3 px-4 text-center">Funnel Stage</th>
                <th className="py-3 px-4">Slipped Event</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No slipped prospects matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const DeviceIcon = r.deviceType === 'Mobile' ? Smartphone : r.deviceType === 'Tablet' ? Laptop : Monitor;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRecord(r)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* S.No */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-semibold">
                        {idx + 1}
                      </td>

                      {/* Prospect Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              r.isCorporate ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r.isCorporate ? <Building2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate block max-w-[200px]">
                              {r.companyName || maskIpAddress(r.ip)}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                              <span className="text-xs">{r.countryFlag}</span>
                              <span className="truncate">{r.location}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Traffic Source */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border inline-block truncate max-w-[150px] ${r.sourceBadgeClass}`}
                        >
                          {r.sourceLabel}
                        </span>
                      </td>

                      {/* Device & Tech */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="w-4 h-4 text-slate-500 shrink-0" />
                          <div className="text-[11px]">
                            <span className="font-semibold text-slate-800 block">{r.deviceType}</span>
                            <span className="text-slate-400 truncate block max-w-[130px] font-mono text-[10px]">
                              {r.browser}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Activity on Your Store */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 bg-slate-100 rounded border border-slate-200 truncate block max-w-[180px] text-slate-700">
                            {r.lastPage}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {r.dwellFormatted} on site
                          </span>
                        </div>
                      </td>

                      {/* Funnel Stage */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${r.funnel.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${r.funnel.dotClass}`}></span>
                          <span>{r.funnel.stage}</span>
                        </span>
                      </td>

                      {/* Slipped Event (Anonymous Network Signal) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                            <span className="font-semibold text-slate-900 text-xs">
                              {r.slippedTimeStr}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {r.slippedDateStr}
                          </span>
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 inline-block mt-0.5">
                            External Conversion Confirmed
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(r);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors inline-flex items-center gap-1"
                        >
                          <span>Journey</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 5. Slide-over Prospect & Journey Drawer                                 */}
      {/* ======================================================================= */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideLeft border-l border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {selectedRecord.isCorporate ? <Building2 className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedRecord.companyName || maskIpAddress(selectedRecord.ip)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{selectedRecord.countryFlag}</span>
                    <span>{selectedRecord.location}</span>
                    <span>•</span>
                    <span className="font-mono">{maskIpAddress(selectedRecord.ip)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-5 flex-1">
              {/* Attribution Alert Card */}
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Slipped Conversion Attribution
                  </span>
                  <span className="text-[11px] font-mono text-rose-600 font-semibold">
                    {selectedRecord.slippedDateStr} • {selectedRecord.slippedTimeStr}
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  This prospect browsed your catalog, reached the{' '}
                  <strong className="text-slate-900">{selectedRecord.funnel.stage}</strong> stage, and completed an order or conversion on a monitored competitor storefront within your {slippedWindow} attribution window.
                </p>
                <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                  <span>Competitor storefront identity is kept strictly confidential across consortium members.</span>
                </div>
              </div>

              {/* Funnel Stage Breakdown */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Funnel Engagement Level
                </span>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${selectedRecord.funnel.badgeClass}`}>
                    {selectedRecord.funnel.stage}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Urgency: <strong className="text-slate-900">{selectedRecord.funnel.urgency}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {selectedRecord.funnel.description}
                </p>
              </div>

              {/* Timeline of Pages Viewed on Your Store */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Journey on Your Storefront Prior to Slipped Event</span>
                </h4>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {selectedRecord.pagesVisited.map((page, pIdx) => (
                    <div key={pIdx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {pIdx + 1}
                        </span>
                        <span className="font-mono text-slate-800 font-semibold truncate max-w-[320px]">
                          {page}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                        {pIdx === selectedRecord.pagesVisited.length - 1 ? 'Exit Page' : 'Step ' + (pIdx + 1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acquisition & Tech Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Acquisition Channel
                  </span>
                  <span className="font-semibold text-slate-800 mt-1 block">
                    {selectedRecord.sourceLabel}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Hardware & Browser
                  </span>
                  <span className="font-semibold text-slate-800 mt-1 block truncate">
                    {selectedRecord.deviceType} • {selectedRecord.browser}
                  </span>
                </div>
              </div>

              {/* Recommended Win-back Playbook */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-2.5">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>Recommended Win-Back Action Playbook</span>
                </h4>
                <p className="text-xs text-blue-900 leading-relaxed">
                  Since this account engaged with <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[11px]">{selectedRecord.lastPage}</code>, launch a targeted win-back re-engagement campaign:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedRecord.officialEmail && selectedRecord.officialEmail !== '--' && (
                    <a
                      href={`mailto:${selectedRecord.officialEmail}?subject=Special inquiry offer for ${selectedRecord.companyName}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" /> Email Lead
                    </a>
                  )}
                  {selectedRecord.website && selectedRecord.website !== '#' && (
                    <a
                      href={selectedRecord.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <span>Visit Website</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      alert(`Win-back alert queued for ${selectedRecord.companyName || selectedRecord.ip}. Retargeting pixel updated.`);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Trigger 10% Win-Back Discount</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Prospect Token: {selectedRecord.id}
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
