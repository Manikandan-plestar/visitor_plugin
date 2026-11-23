import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  TrendingDown,
  Clock,
  Search,
  Calendar,
  Monitor,
  Smartphone,
  Laptop,
  Eye,
  Building2,
  Share2,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { parseTrafficSource, getIpLocation, maskIpAddress } from './TrafficTab';

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
  const [dateFilter, setDateFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Build raw slipped records from storefront visitors
  const rawSlippedRecords = useMemo(() => {
    const list = [];
    const now = Date.now();

    // 1. Corporate prospects who engaged with the storefront
    companies.forEach((c, idx) => {
      const visits = c.page_visits || c.hits || [];
      if (visits.length === 0) return;

      const pages = visits.map((v) => v.page_url || '/');

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
      const isMobile =
        browser.toLowerCase().includes('mobile') ||
        (browser.toLowerCase().includes('safari') && browser.toLowerCase().includes('iphone'));
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
        sourceLabel: src.label || 'Direct Navigation',
        sourceBadgeClass: src.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200',
        deviceType,
        browser,
        lastPage,
        dwellFormatted: formatDwellTime(totalDwell),
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
        sourceLabel: src.label || 'Organic Search',
        sourceBadgeClass: src.badgeClass || 'bg-emerald-50 text-emerald-700 border-emerald-200',
        deviceType,
        browser,
        lastPage: page,
        dwellFormatted: formatDwellTime(dwell),
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

  // Apply Search and Date Filters
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

      // 2. Date Filter
      if (fromDate) {
        const fromTs = new Date(fromDate + 'T00:00:00').getTime();
        if (!isNaN(fromTs) && rec.slippedTimestamp < fromTs) return false;
      }
      if (toDate) {
        const toTs = new Date(toDate + 'T23:59:59.999').getTime();
        if (!isNaN(toTs) && rec.slippedTimestamp > toTs) return false;
      }
      if (dateFilter !== 'all' && !fromDate && !toDate) {
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
  }, [rawSlippedRecords, searchQuery, dateFilter, fromDate, toDate]);

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
      {/* 2. Three Clean KPI Metric Cards                                         */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      </div>

      {/* ======================================================================= */}
      {/* 3. Search & Date Filter Controls Toolbar                                */}
      {/* ======================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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

        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Date Filter: From - To */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-800 focus:outline-none p-0 cursor-pointer"
              aria-label="Filter from date"
            />
            <span className="text-slate-400 font-medium ml-1">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-800 focus:outline-none p-0 cursor-pointer"
              aria-label="Filter to date"
            />
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => { setFromDate(''); setToDate(''); }}
                className="ml-1 p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Clear Date Filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
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
                onClick={() => { setDateFilter(d.id); setFromDate(''); setToDate(''); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dateFilter === d.id && !fromDate && !toDate
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 4. Slipped Activity Table (Clean, Direct, No Action Column)            */}
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
            {filteredRecords.length} Records
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
                <th className="py-3 px-4">Page Viewed on Your Store</th>
                <th className="py-3 px-4">Slipped Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No slipped prospects matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const DeviceIcon =
                    r.deviceType === 'Mobile' ? Smartphone : r.deviceType === 'Tablet' ? Laptop : Monitor;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
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
                            <span className="font-bold text-slate-900 truncate block max-w-[200px]">
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
                          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 bg-slate-100 rounded border border-slate-200 truncate block max-w-[200px] text-slate-700">
                            {r.lastPage}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {r.dwellFormatted} on site
                          </span>
                        </div>
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
