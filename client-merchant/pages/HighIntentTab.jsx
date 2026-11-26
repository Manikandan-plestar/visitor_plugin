import React, { useState, useMemo } from 'react';
import {
  Zap,
  Clock,
  Building2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
  Globe,
  Monitor,
  Smartphone,
  Share2,
  Calendar,
  Layers,
  ArrowUpDown,
  X,
  Lock,
} from 'lucide-react';
import { parseTrafficSource, getIpLocation, maskIpAddress } from './TrafficTab';

export default function HighIntentTab({
  companies = [],
  generalVisitors = [],
  allHits = [],
  highIntentUrls = ['/pricing', '/product/industrial-turbine-sensor', '/checkout', '/four-plans', '/contact-sales'],
  opportunityDuration = 60,
  onNavigateTab,
  onSelectCompany,
  onSaveHighIntentUrls,
  planMeta = {},
  onOpenUpgrade,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIp, setCopiedIp] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('hits'); // 'hits' | 'duration' | 'date'
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeUrlFilter, setActiveUrlFilter] = useState('ALL');
  const [chartOffset, setChartOffset] = useState(0); // 0 = current 14 days, 1 = prev 14 days
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Normalize configured target URLs array
  const targetUrlsList = useMemo(() => {
    const raw = Array.isArray(highIntentUrls) ? highIntentUrls : String(highIntentUrls || '').split(',');
    return raw.map((u) => u.trim().toLowerCase()).filter(Boolean);
  }, [highIntentUrls]);

  const minDurationSec = parseInt(opportunityDuration, 10) || 60;

  // Flatten and match High-Intent hits
  const highIntentEvents = useMemo(() => {
    const matchedHits = [];

    // Helper to test if a page URL matches configured High-Intent target URLs
    const matchesTargetUrl = (url) => {
      if (!url) return false;
      const lower = url.toLowerCase().trim();
      return targetUrlsList.some((t) => lower.includes(t));
    };

    // 1. Check corporate company hits
    companies.forEach((comp) => {
      (comp.page_visits || []).forEach((hit) => {
        const dur = parseInt(hit.duration, 10) || hit.duration_seconds || 60;
        if (matchesTargetUrl(hit.page_url) && dur >= minDurationSec) {
          matchedHits.push({
            id: 'hi_corp_' + (hit.id || Math.random()),
            ip: hit.visitor_ip || comp.activation_ip || 'Unknown',
            isCorporate: true,
            companyName: comp.company_name,
            companyId: comp.id,
            industry: comp.industry,
            physicalAddress: comp.physical_address,
            pageUrl: hit.page_url,
            durationSec: dur,
            referrer: hit.referrer || 'Direct Navigation',
            browser: hit.browser || 'Chrome',
            deviceType: hit.device_type || 'Desktop',
            visitedAt: hit.visited_at || hit.date_time || new Date().toISOString(),
            country: comp.country || '',
            city: comp.city || '',
          });
        }
      });
    });

    // 2. Check general visitor hits
    generalVisitors.forEach((gen) => {
      const dur = gen.duration_seconds || 60;
      if (matchesTargetUrl(gen.page_url) && dur >= minDurationSec) {
        matchedHits.push({
          id: 'hi_gen_' + (gen.id || Math.random()),
          ip: gen.visitor_ip || 'Unknown',
          isCorporate: false,
          companyName: 'General Consumer / ISP',
          companyId: null,
          industry: 'Residential ISP',
          physicalAddress: gen.physical_address || '',
          pageUrl: gen.page_url,
          durationSec: dur,
          referrer: gen.referrer || 'Direct Navigation',
          browser: gen.browser || 'Chrome',
          deviceType: (gen.browser || '').includes('Mobile') ? 'Mobile' : 'Desktop',
          visitedAt: gen.visited_at || new Date().toISOString(),
          country: gen.country || '',
          city: gen.city || '',
        });
      }
    });

    return matchedHits;
  }, [companies, generalVisitors, targetUrlsList, minDurationSec]);

  // Aggregate by IP Address & High-Intent Page accessed
  const aggregatedVisitors = useMemo(() => {
    const map = new Map();

    highIntentEvents.forEach((event) => {
      const key = `${event.ip}_${event.pageUrl}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          ip: event.ip,
          isCorporate: event.isCorporate,
          companyName: event.companyName,
          companyId: event.companyId,
          industry: event.industry,
          pageUrl: event.pageUrl,
          visits: 0,
          pageViews: 0,
          totalDuration: 0,
          earliestVisit: event.visitedAt,
          latestVisit: event.visitedAt,
          referrer: event.referrer,
          browser: event.browser,
          deviceType: event.deviceType,
          country: event.country,
          city: event.city,
          physicalAddress: event.physicalAddress,
        });
      }
      const rec = map.get(key);
      rec.pageViews += 1;
      rec.totalDuration += event.durationSec;
      if (new Date(event.visitedAt) < new Date(rec.earliestVisit)) {
        rec.earliestVisit = event.visitedAt;
      }
      if (new Date(event.visitedAt) > new Date(rec.latestVisit)) {
        rec.latestVisit = event.visitedAt;
      }
    });

    return Array.from(map.values()).map((rec) => {
      const avgDuration = Math.round(rec.totalDuration / rec.pageViews);
      const loc = getIpLocation(rec);
      const src = parseTrafficSource(rec.referrer, null);
      return {
        ...rec,
        avgDuration,
        locationInfo: loc,
        sourceInfo: src,
        visits: Math.max(1, Math.ceil(rec.pageViews / 2)),
      };
    });
  }, [highIntentEvents]);

  // High-Intent KPIs
  const uniqueHighIntentVisitors = useMemo(() => {
    return new Set(highIntentEvents.map((e) => e.ip)).size;
  }, [highIntentEvents]);

  const totalHighIntentVisits = useMemo(() => {
    return aggregatedVisitors.reduce((s, r) => s + r.visits, 0);
  }, [aggregatedVisitors]);

  const totalHighIntentPageViews = highIntentEvents.length;

  // Most Visited High-Intent URLs
  const urlRanking = useMemo(() => {
    const counts = {};
    highIntentEvents.forEach((e) => {
      const u = e.pageUrl || '/';
      counts[u] = (counts[u] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([url, count]) => ({
        url,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [highIntentEvents]);

  const mostVisitedUrl = urlRanking[0]?.url || targetUrlsList[0] || '/pricing';

  // 14-day trend for High-Intent hits (supports navigating previous 14 days)
  const trendDays = useMemo(() => {
    const days = 14;
    const result = [];
    const now = Date.now();
    const baseEnd = now - chartOffset * 14 * 86400000;
    for (let i = days - 1; i >= 0; i--) {
      const dayDate = new Date(baseEnd - i * 86400000);
      const label = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayStr = dayDate.toISOString().slice(0, 10);
      const count = highIntentEvents.filter((e) => (e.visitedAt || '').startsWith(dayStr)).length;
      result.push({ label, count, date: dayStr });
    }
    return result;
  }, [highIntentEvents, chartOffset]);

  const maxTrend = Math.max(...trendDays.map((d) => d.count), 5);

  // Unique High Intent URLs for URL-wise filter dropdown
  const uniqueMatchedUrls = useMemo(() => {
    const counts = new Map();
    aggregatedVisitors.forEach((v) => {
      counts.set(v.pageUrl, (counts.get(v.pageUrl) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([url, count]) => ({ url, count }));
  }, [aggregatedVisitors]);

  // Filter & Search with Date Filter (From - To)
  const filteredVisitors = useMemo(() => {
    return aggregatedVisitors.filter((r) => {
      if (activeUrlFilter !== 'ALL' && r.pageUrl !== activeUrlFilter) {
        return false;
      }
      if (fromDate) {
        const fromTs = new Date(fromDate + 'T00:00:00').getTime();
        const rLatest = new Date(r.latestVisit || r.earliestVisit).getTime();
        if (!isNaN(fromTs) && !isNaN(rLatest) && rLatest < fromTs) return false;
      }
      if (toDate) {
        const toTs = new Date(toDate + 'T23:59:59.999').getTime();
        const rEarliest = new Date(r.earliestVisit || r.latestVisit).getTime();
        if (!isNaN(toTs) && !isNaN(rEarliest) && rEarliest > toTs) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesIp = r.ip.toLowerCase().includes(q);
        const matchesCompany = (r.companyName || '').toLowerCase().includes(q);
        const matchesUrl = r.pageUrl.toLowerCase().includes(q);
        return matchesIp || matchesCompany || matchesUrl;
      }
      return true;
    });
  }, [aggregatedVisitors, activeUrlFilter, searchQuery, fromDate, toDate]);

  // Sort
  const sortedVisitors = useMemo(() => {
    const list = [...filteredVisitors];
    list.sort((a, b) => {
      let valA = a.pageViews;
      let valB = b.pageViews;
      if (sortField === 'duration') {
        valA = a.avgDuration;
        valB = b.avgDuration;
      } else if (sortField === 'date') {
        valA = new Date(a.latestVisit).getTime();
        valB = new Date(b.latestVisit).getTime();
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
    return list;
  }, [filteredVisitors, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedVisitors.length / pageSize) || 1;
  const paginatedVisitors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedVisitors.slice(start, start + pageSize);
  }, [sortedVisitors, currentPage, pageSize]);

  const copyToClipboard = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedIp(text);
      setTimeout(() => setCopiedIp(null), 2000);
    } catch (e) {}
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const formatHitDate = (dateVal) => {
    if (!dateVal) return '--';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return String(dateVal);
    }
  };

  const formatHitTime = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Top Analytics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Unique Visitors</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{uniqueHighIntentVisitors}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">High Intent</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unique IP addresses</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Visits</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalHighIntentVisits}</span>
            <span className="text-xs font-semibold text-slate-500">Sessions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Distinct evaluation sessions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">High-Intent Page Views</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalHighIntentPageViews}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Verified</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Target funnel requests</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Top Funnel Page</span>
          <div className="mt-2 truncate">
            <span className="text-sm font-black font-mono text-blue-600 truncate block" title={mostVisitedUrl}>
              {mostVisitedUrl}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Leading evaluation target</p>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 3. Graphical Analytics: Activity Over Time & Top High-Intent URLs       */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
        {/* Trend Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>High-Intent Activity Over Time</span>
            </h4>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700 self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setChartOffset((p) => p + 1)}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                title="Previous 14 Days"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-medium">Prev 14D</span>
              </button>
              <span className="px-2 py-1 text-slate-800 font-mono text-[11px] font-bold whitespace-nowrap">
                {trendDays[0]?.label} – {trendDays[trendDays.length - 1]?.label}
              </span>
              <button
                type="button"
                onClick={() => setChartOffset((p) => Math.max(0, p - 1))}
                disabled={chartOffset === 0}
                className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  chartOffset === 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-200/50 text-slate-400'
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-2xs cursor-pointer'
                }`}
                title="Next 14 Days"
              >
                <span className="hidden sm:inline text-[11px] font-medium">Next 14D</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-5 h-44 flex items-end justify-between gap-1 sm:gap-2">
            {trendDays.map((d, i) => {
              const hPct = d.count > 0 ? Math.max(16, Math.round((d.count / maxTrend) * 100)) : 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-mono whitespace-nowrap shadow-md z-10">
                    {d.date}: {d.count} hits
                  </div>
                  <div className="w-full max-w-[24px] bg-slate-100 rounded-t-lg overflow-hidden h-full flex items-end">
                    <div
                      style={{ height: `${hPct}%` }}
                      className={`w-full rounded-t-lg transition-all ${
                        d.count > 0 ? 'bg-gradient-to-t from-amber-500 to-orange-400 shadow-xs' : 'bg-slate-200'
                      }`}
                    ></div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono mt-2 block truncate max-w-full">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Visited High-Intent URLs Ranking (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Most Visited URLs</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">Ranked</span>
            </div>

            <div className="mt-4 space-y-3">
              {urlRanking.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No high-intent events recorded yet.</div>
              ) : (
                urlRanking.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-800 truncate max-w-[160px]" title={item.url}>
                        {item.url}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px] shrink-0">
                        {item.count} views ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${item.pct}%` }}
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Primary Focus</span>
            <span className="font-semibold text-slate-600 font-mono truncate max-w-[140px]">{mostVisitedUrl}</span>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 4. High-Intent Visitor Table with Search, Filter, and Pagination       */}
      {/* ======================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by IP, Company, or URL..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-start lg:justify-end text-xs">
            {/* Date Filter: From - To */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none text-xs text-slate-800 focus:outline-none p-0 cursor-pointer"
                aria-label="Filter from date"
              />
              <span className="text-slate-400 font-medium ml-1">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none text-xs text-slate-800 focus:outline-none p-0 cursor-pointer"
                aria-label="Filter to date"
              />
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => { setFromDate(''); setToDate(''); setCurrentPage(1); }}
                  className="ml-1 p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Clear Date Filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* URL Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs transition-colors shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-500 font-medium">URL:</span>
              <select
                value={activeUrlFilter}
                onChange={(e) => { setActiveUrlFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1 max-w-[200px]"
                aria-label="Filter by High Intent URL"
              >
                <option value="ALL">All URLs ({aggregatedVisitors.length})</option>
                {uniqueMatchedUrls.map((item) => (
                  <option key={item.url} value={item.url}>
                    {item.url} ({item.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs transition-colors shrink-0">
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="hits">Most Page Views</option>
                <option value="duration">Longest Duration</option>
                <option value="date">Recent Visit</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'))}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-600"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[580px] relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs border-b border-slate-200">
              <tr className="text-slate-500 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                <th className="py-3.5 px-4 w-12 text-center bg-slate-50">S.No</th>
                <th className="py-3.5 px-4 text-left bg-slate-50">IP Address</th>
                <th className="py-3.5 px-4 text-left bg-slate-50">Country</th>
                <th className="py-3.5 px-4 text-left bg-slate-50">Date & Time</th>
                <th className="py-3.5 px-4 text-center bg-slate-50">Visits</th>
                <th className="py-3.5 px-4 text-center bg-slate-50">Page Views</th>
                <th className="py-3.5 px-4 text-left bg-slate-50">Page URL</th>
                <th className="py-3.5 px-4 text-center bg-slate-50">Average Duration</th>
                <th className="py-3.5 px-4 text-left bg-slate-50">Traffic Source</th>
                <th className="py-3.5 px-4 text-left bg-slate-50">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedVisitors.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    No High-Intent visitor events match your criteria.
                  </td>
                </tr>
              ) : (
                paginatedVisitors.map((row, idx) => {
                  const sNo = (currentPage - 1) * pageSize + idx + 1;
                  const isLockedRow = planMeta?.plan_tier !== 'premium' && sNo > 5;
                  return (
                    <tr key={row.key} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-semibold whitespace-nowrap">
                        {sNo}
                      </td>

                      {/* IP Address */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        {isLockedRow ? (
                          <button
                            type="button"
                            onClick={onOpenUpgrade}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 text-[11px] font-bold cursor-pointer"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Upgrade to Reveal</span>
                          </button>
                        ) : (
                          <>
                            <span className="font-mono font-bold text-slate-900">{maskIpAddress(row.ip)}</span>
                            {row.isCorporate && (
                              <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                                {row.companyName}
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      {/* Country */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-base leading-none">{row.locationInfo.flag}</span>
                          <span className="font-medium text-slate-800">{row.locationInfo.country || 'Global'}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatHitDate(row.latestVisit)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block pl-5">
                          {formatHitTime(row.latestVisit)}
                        </span>
                      </td>

                      {/* Visits */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono font-bold text-slate-800">
                        {row.visits}
                      </td>

                      {/* Page Views */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold text-xs">
                          {row.pageViews}
                        </span>
                      </td>

                      {/* Page URL */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded-md border border-blue-200/60 max-w-xs truncate inline-block">
                          {row.pageUrl}
                        </span>
                      </td>

                      {/* Average Duration */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono text-emerald-700 font-semibold flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          {formatSeconds(row.avgDuration)}
                        </span>
                      </td>

                      {/* Traffic Source */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <span className="text-xs text-slate-700 font-medium">
                          {row.sourceInfo?.label || 'Direct'}
                        </span>
                      </td>

                      {/* Device */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          {row.deviceType === 'Mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[120px]">{row.browser}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing {sortedVisitors.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedVisitors.length)} of {sortedVisitors.length} high-intent records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono font-semibold">
              Page {totalPages === 0 ? 1 : currentPage} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

