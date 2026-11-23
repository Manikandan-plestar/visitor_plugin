import React, { useState, useMemo } from 'react';
import {
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  Laptop,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Calendar,
  Share2,
  Sparkles,
  RotateCcw,
  Building2,
  User,
  Info,
  X,
} from 'lucide-react';
import { parseTrafficSource, getIpLocation, maskIpAddress } from './TrafficTab';

export default function ConversionTab({
  companies = [],
  generalVisitors = [],
  allHits = [],
  conversionUrls = ['/thank-you', '/order-received', '/order-confirmed', '/checkout/success', '/checkout'],
  onNavigateTab,
  onSelectCompany,
  onSaveConversionUrls,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIp, setCopiedIp] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('date'); // 'date' | 'ip' | 'country'
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeUrlFilter, setActiveUrlFilter] = useState('ALL');
  const [selectedVisitorDetail, setSelectedVisitorDetail] = useState(null);
  const [chartOffset, setChartOffset] = useState(0); // 0 = current 14 days, 1 = prev 14 days
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Normalize configured conversion URLs array
  const targetConversionUrls = useMemo(() => {
    const raw = Array.isArray(conversionUrls) ? conversionUrls : String(conversionUrls || '').split(',');
    return raw.map((u) => u.trim().toLowerCase()).filter(Boolean);
  }, [conversionUrls]);

  // First, compute the absolute earliest (first) visit timestamp for EVERY visitor IP across the whole site
  const visitorFirstVisitMap = useMemo(() => {
    const map = new Map();

    const recordEarliest = (ip, dateVal) => {
      if (!ip || !dateVal) return;
      const ts = new Date(dateVal).getTime();
      if (!isNaN(ts)) {
        if (!map.has(ip) || ts < map.get(ip).timestamp) {
          map.set(ip, {
            timestamp: ts,
            formattedDate: new Date(ts).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
          });
        }
      }
    };

    companies.forEach((c) => {
      (c.page_visits || []).forEach((h) => {
        recordEarliest(h.visitor_ip || c.activation_ip, h.visited_at || h.date_time);
      });
    });

    generalVisitors.forEach((g) => {
      recordEarliest(g.visitor_ip, g.visited_at);
    });

    return map;
  }, [companies, generalVisitors]);

  // Identify all conversion events (hits accessing any of the configured Conversion Page URLs)
  const conversionEvents = useMemo(() => {
    const events = [];

    const matchesConversionUrl = (url) => {
      if (!url) return false;
      const lower = url.toLowerCase().trim();
      return targetConversionUrls.some((t) => lower.includes(t));
    };

    // 1. Corporate hits
    companies.forEach((c) => {
      (c.page_visits || []).forEach((hit) => {
        if (matchesConversionUrl(hit.page_url)) {
          events.push({
            id: 'conv_corp_' + (hit.id || Math.random()),
            ip: hit.visitor_ip || c.activation_ip || 'Unknown',
            isCorporate: true,
            companyName: c.company_name,
            companyId: c.id,
            industry: c.industry,
            physicalAddress: c.physical_address,
            pageUrl: hit.page_url,
            referrer: hit.referrer || 'Direct Navigation',
            browser: hit.browser || 'Chrome',
            deviceType: hit.device_type || 'Desktop',
            conversionDate: hit.visited_at || hit.date_time || new Date().toISOString(),
            country: c.country || '',
            city: c.city || '',
          });
        }
      });
    });

    // 2. General visitor hits
    generalVisitors.forEach((gen) => {
      if (matchesConversionUrl(gen.page_url)) {
        events.push({
          id: 'conv_gen_' + (gen.id || Math.random()),
          ip: gen.visitor_ip || 'Unknown',
          isCorporate: false,
          companyName: 'General Consumer / ISP',
          companyId: null,
          industry: 'Residential ISP',
          physicalAddress: gen.physical_address || '',
          pageUrl: gen.page_url,
          referrer: gen.referrer || 'Direct Navigation',
          browser: gen.browser || 'Chrome',
          deviceType: (gen.browser || '').includes('Mobile') ? 'Mobile' : 'Desktop',
          conversionDate: gen.visited_at || new Date().toISOString(),
          country: gen.country || '',
          city: gen.city || '',
        });
      }
    });

    return events;
  }, [companies, generalVisitors, targetConversionUrls]);

  // Aggregate conversion records: group by visitor IP while preserving all conversion event timestamps
  const conversionVisitors = useMemo(() => {
    const map = new Map();

    conversionEvents.forEach((event) => {
      if (!map.has(event.ip)) {
        const firstVisitInfo = visitorFirstVisitMap.get(event.ip);
        const loc = getIpLocation(event);
        const src = parseTrafficSource(event.referrer, null);

        map.set(event.ip, {
          ip: event.ip,
          isCorporate: event.isCorporate,
          companyName: event.companyName,
          companyId: event.companyId,
          industry: event.industry,
          country: loc.country || 'Global',
          countryFlag: loc.flag || '🌐',
          firstVisitDate: firstVisitInfo?.formattedDate || 'Recent',
          firstVisitTimestamp: firstVisitInfo?.timestamp || new Date(event.conversionDate).getTime(),
          latestConversionDate: event.conversionDate,
          latestConversionTimestamp: new Date(event.conversionDate).getTime(),
          referrer: event.referrer,
          sourceInfo: src,
          browser: event.browser,
          deviceType: event.deviceType,
          totalConversionEvents: 0,
          events: [],
        });
      }

      const rec = map.get(event.ip);
      rec.totalConversionEvents += 1;
      const ts = new Date(event.conversionDate).getTime();
      if (ts > rec.latestConversionTimestamp) {
        rec.latestConversionTimestamp = ts;
        rec.latestConversionDate = event.conversionDate;
      }
      rec.events.push(event);
    });

    return Array.from(map.values()).map((rec) => {
      // Determine if New or Returning at the time of conversion
      const isReturning = rec.totalConversionEvents > 1 || rec.firstVisitTimestamp < rec.latestConversionTimestamp - 1000 * 60 * 5;
      return {
        ...rec,
        isReturning,
        formattedConversionDate: new Date(rec.latestConversionDate).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    });
  }, [conversionEvents, visitorFirstVisitMap]);

  // High-Level Conversion Metrics
  const totalConversionEvents = conversionEvents.length;
  const uniqueConvertingVisitors = conversionVisitors.length;
  const totalStoreVisitors = useMemo(() => {
    return visitorFirstVisitMap.size || 1;
  }, [visitorFirstVisitMap]);

  const conversionRate = Math.min(100, Math.round((uniqueConvertingVisitors / totalStoreVisitors) * 100));

  // 14-day conversion activity trendline (supports navigating previous 14 days)
  const trendDays = useMemo(() => {
    const days = 14;
    const result = [];
    const now = Date.now();
    const baseEnd = now - chartOffset * 14 * 86400000;
    for (let i = days - 1; i >= 0; i--) {
      const dayDate = new Date(baseEnd - i * 86400000);
      const label = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayStr = dayDate.toISOString().slice(0, 10);
      const count = conversionEvents.filter((e) => (e.conversionDate || '').startsWith(dayStr)).length;
      result.push({ label, count, date: dayStr });
    }
    return result;
  }, [conversionEvents, chartOffset]);

  const maxTrend = Math.max(...trendDays.map((d) => d.count), 4);

  // Conversion Traffic Sources
  const conversionSources = useMemo(() => {
    const counts = {};
    conversionVisitors.forEach((v) => {
      const label = v.sourceInfo?.label || 'Direct';
      counts[label] = (counts[label] || 0) + v.totalConversionEvents;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [conversionVisitors]);

  // Conversion Device Breakdown
  const conversionDevices = useMemo(() => {
    const counts = { Desktop: 0, Mobile: 0, Tablet: 0 };
    conversionVisitors.forEach((v) => {
      const d = v.deviceType || 'Desktop';
      counts[d] = (counts[d] || 0) + v.totalConversionEvents;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return [
      { name: 'Desktop', count: counts.Desktop, pct: Math.round((counts.Desktop / total) * 100), icon: Monitor },
      { name: 'Mobile', count: counts.Mobile, pct: Math.round((counts.Mobile / total) * 100), icon: Smartphone },
      { name: 'Tablet', count: counts.Tablet, pct: Math.round((counts.Tablet / total) * 100), icon: Laptop },
    ];
  }, [conversionVisitors]);

  // Unique Conversion URLs for filter dropdown
  const uniqueMatchedConversionUrls = useMemo(() => {
    const counts = new Map();
    conversionVisitors.forEach((v) => {
      (v.events || []).forEach((e) => {
        const u = e.pageUrl || 'Conversion Page';
        counts.set(u, (counts.get(u) || 0) + 1);
      });
    });
    return Array.from(counts.entries()).map(([url, count]) => ({ url, count }));
  }, [conversionVisitors]);

  // Filter & Search with Date Filter (From - To)
  const filteredVisitors = useMemo(() => {
    return conversionVisitors.filter((v) => {
      if (activeUrlFilter !== 'ALL') {
        const hasUrl = (v.events || []).some((e) =>
          (e.pageUrl || '').toLowerCase().includes(activeUrlFilter.toLowerCase())
        );
        if (!hasUrl) return false;
      }
      if (fromDate) {
        const fromTs = new Date(fromDate + 'T00:00:00').getTime();
        const rLatest = v.latestConversionTimestamp || (v.latestConversionDate ? new Date(v.latestConversionDate).getTime() : 0);
        if (!isNaN(fromTs) && rLatest && rLatest < fromTs) return false;
      }
      if (toDate) {
        const toTs = new Date(toDate + 'T23:59:59.999').getTime();
        const rEarliest = v.firstVisitTimestamp || (v.latestConversionDate ? new Date(v.latestConversionDate).getTime() : 0);
        if (!isNaN(toTs) && rEarliest && rEarliest > toTs) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesIp = v.ip.toLowerCase().includes(q);
        const matchesCountry = (v.country || '').toLowerCase().includes(q);
        const matchesCompany = (v.companyName || '').toLowerCase().includes(q);
        const matchesUrl = (v.events || []).some((e) =>
          (e.pageUrl || '').toLowerCase().includes(q)
        );
        return matchesIp || matchesCountry || matchesCompany || matchesUrl;
      }
      return true;
    });
  }, [conversionVisitors, activeUrlFilter, searchQuery, fromDate, toDate]);

  // Sort
  const sortedVisitors = useMemo(() => {
    const list = [...filteredVisitors];
    list.sort((a, b) => {
      if (sortField === 'ip') {
        return sortOrder === 'asc' ? a.ip.localeCompare(b.ip) : b.ip.localeCompare(a.ip);
      }
      if (sortField === 'country') {
        return sortOrder === 'asc' ? a.country.localeCompare(b.country) : b.country.localeCompare(a.country);
      }
      // Default: date
      return sortOrder === 'asc'
        ? a.latestConversionTimestamp - b.latestConversionTimestamp
        : b.latestConversionTimestamp - a.latestConversionTimestamp;
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

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Distinction Notice (Section 6 Requirement) */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start sm:items-center gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
        <span>
          <strong>Note:</strong> A configured conversion-page visit represents a tracked conversion funnel event. Purchase-completion tracking requires verification with your storefront order gateway.
        </span>
      </div>

      {/* ======================================================================= */}
      {/* 2. Top Conversion Analytics & Metrics                                   */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Events</span>
          <span className="text-2xl font-black text-slate-900 mt-2 block font-mono">{totalConversionEvents}</span>
          <p className="text-[11px] text-slate-500 mt-1">Goal page hits</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Converting Visitors</span>
          <span className="text-2xl font-black text-rose-600 mt-2 block font-mono">{uniqueConvertingVisitors}</span>
          <p className="text-[11px] text-slate-500 mt-1">Unique IP addresses</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Conversion Rate</span>
          <span className="text-2xl font-black text-emerald-600 mt-2 block font-mono">{conversionRate}%</span>
          <p className="text-[11px] text-slate-500 mt-1">Of total store visitors</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Store Audience</span>
          <span className="text-2xl font-black text-slate-900 mt-2 block font-mono">{totalStoreVisitors}</span>
          <p className="text-[11px] text-slate-500 mt-1">All unique visitors</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Top Device</span>
          <span className="text-sm font-black text-slate-800 mt-3 block truncate">
            {conversionDevices.sort((a, b) => b.count - a.count)[0]?.name || 'Desktop'}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Primary converting hardware</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Leading Channel</span>
          <span className="text-sm font-black text-indigo-600 mt-3 block truncate">
            {conversionSources[0]?.name || 'Direct'}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Highest converting source</p>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 3. Conversion Visualizations: Activity Over Time & Source Distribution  */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
        {/* Trend Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>Conversion Events Over Time</span>
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
                    {d.date}: {d.count} events
                  </div>
                  <div className="w-full max-w-[24px] bg-slate-100 rounded-t-lg overflow-hidden h-full flex items-end">
                    <div
                      style={{ height: `${hPct}%` }}
                      className={`w-full rounded-t-lg transition-all ${
                        d.count > 0 ? 'bg-gradient-to-t from-rose-600 to-pink-500 shadow-xs' : 'bg-slate-200'
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

        {/* Traffic Sources for Conversions (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>Conversion Channels</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">Acquisition</span>
            </div>

            <div className="mt-4 space-y-3">
              {conversionSources.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No conversion traffic recorded yet.</div>
              ) : (
                conversionSources.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                      <span className="font-mono text-slate-500 text-[11px] shrink-0">
                        {item.count} ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${item.pct}%` }}
                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Primary Driver</span>
            <span className="font-semibold text-slate-600">{conversionSources[0]?.name || 'Direct'}</span>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 4. Conversion Visitor Table (Columns 1-8 Exactly per Specification)     */}
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
              placeholder="Search by IP, Country, or Company..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-all shadow-2xs"
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

            {/* Conversion URL Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs transition-colors shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-500 font-medium">URL:</span>
              <select
                value={activeUrlFilter}
                onChange={(e) => { setActiveUrlFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1 max-w-[200px]"
                aria-label="Filter by Conversion URL"
              >
                <option value="ALL">All URLs ({conversionVisitors.length})</option>
                {uniqueMatchedConversionUrls.map((item) => (
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
                <option value="date">Conversion Date</option>
                <option value="ip">IP Address</option>
                <option value="country">Country</option>
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
                <th className="py-3.5 px-4 text-center bg-slate-50">Visitor Type</th>
                <th className="py-3.5 px-4 text-left bg-slate-50">Traffic Source</th>
                <th className="py-3.5 px-4 text-left bg-slate-50">Device Source</th>
                <th className="py-3.5 px-4 text-left bg-slate-50">First Visit Date</th>
                <th className="py-3.5 px-4 text-right bg-slate-50">Conversion Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedVisitors.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No conversion events match your filters yet.
                  </td>
                </tr>
              ) : (
                paginatedVisitors.map((row, idx) => {
                  const sNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={row.ip} className="hover:bg-rose-50/30 transition-colors">
                      {/* 1. S.No */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-semibold whitespace-nowrap">
                        {sNo}
                      </td>

                      {/* 2. IP Address */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900">{maskIpAddress(row.ip)}</span>
                        {row.isCorporate && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                            {row.companyName}
                          </span>
                        )}
                        {row.events && row.events[0]?.pageUrl && (
                          <span className="font-mono text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60 block truncate max-w-[170px] mt-0.5">
                            {row.events[0].pageUrl}
                          </span>
                        )}
                      </td>

                      {/* 3. Country */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-base leading-none">{row.countryFlag}</span>
                          <span className="font-medium text-slate-800">{row.country}</span>
                        </div>
                      </td>

                      {/* 4. Visitor Type – New / Returning */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {row.isReturning ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <RotateCcw className="w-3 h-3 text-indigo-600" />
                            <span>Returning</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>New</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Traffic Source */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap">
                        <span className="text-xs text-slate-700 font-medium">
                          {row.sourceInfo?.label || 'Direct'}
                        </span>
                      </td>

                      {/* 6. Device Source */}
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

                      {/* 7. First Visit Date (Separated strictly from Conversion Date) */}
                      <td className="py-3.5 px-4 text-left whitespace-nowrap font-mono text-slate-600 text-xs">
                        {row.firstVisitDate}
                      </td>

                      {/* 8. Conversion Date */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-semibold text-rose-700 text-xs">
                        {row.formattedConversionDate}
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
            {Math.min(currentPage * pageSize, sortedVisitors.length)} of {sortedVisitors.length} converting visitors
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

