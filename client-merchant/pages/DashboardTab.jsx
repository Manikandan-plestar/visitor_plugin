import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  Eye,
  Clock,
  Zap,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  Laptop,
  RotateCcw,
  Sparkles,
  Layers,
  Target,
  Share2,
  Compass,
  ArrowUpRight,
  Calendar,
  Filter,
} from 'lucide-react';
import { parseTrafficSource, getIpLocation } from './TrafficTab';

// Helper to safely parse hit timestamp
const parseHitTimestamp = (hit) => {
  if (!hit) return null;
  const raw = hit.visited_at || hit.date_time || hit.created_at || hit.timestamp;
  if (!raw) return null;
  if (typeof raw === 'number') {
    return raw < 1e11 ? raw * 1000 : raw;
  }
  const parsed = new Date(raw).getTime();
  if (!isNaN(parsed)) return parsed;

  if (typeof raw === 'string') {
    const lower = raw.toLowerCase();
    const now = new Date();
    if (lower.includes('today')) {
      return now.getTime();
    }
    if (lower.includes('yesterday')) {
      return now.getTime() - 86400000;
    }
  }
  return null;
};

// Helper to check if a hit falls within the selected date filter
const isHitInRange = (hit, filter, customStart, customEnd) => {
  if (filter === 'all') return true;
  const ts = parseHitTimestamp(hit);
  if (!ts) return true; // Keep record if timestamp is not determinable

  const now = new Date();

  if (filter === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;
    return ts >= startOfToday && ts < endOfToday;
  }

  if (filter === 'yesterday') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    return ts >= startOfYesterday && ts < startOfToday;
  }

  if (filter === '7d') {
    const startOf7d = now.getTime() - 7 * 86400000;
    return ts >= startOf7d && ts <= now.getTime();
  }

  if (filter === '14d') {
    const startOf14d = now.getTime() - 14 * 86400000;
    return ts >= startOf14d && ts <= now.getTime();
  }

  if (filter === '30d') {
    const startOf30d = now.getTime() - 30 * 86400000;
    return ts >= startOf30d && ts <= now.getTime();
  }

  if (filter === 'custom') {
    if (!customStart && !customEnd) return true;
    let match = true;
    if (customStart) {
      const s = new Date(customStart + 'T00:00:00').getTime();
      if (!isNaN(s) && ts < s) match = false;
    }
    if (customEnd) {
      const e = new Date(customEnd + 'T23:59:59.999').getTime();
      if (!isNaN(e) && ts > e) match = false;
    }
    return match;
  }

  return true;
};

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '14d', label: 'Last 14 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
];

export default function DashboardTab({
  companies = [],
  generalVisitors = [],
  allHits = [],
  highIntentUrls = ['/pricing', '/product/industrial-turbine-sensor', '/checkout', '/four-plans', '/contact-sales'],
  conversionUrls = ['/thank-you', '/order-received', '/order-confirmed', '/checkout/success', '/checkout'],
  opportunityDuration = 60,
  onSelectCompany,
  onNavigateTab,
}) {
  const [timeRange, setTimeRange] = useState('14d');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Normalize configured target URLs
  const normalizedHighIntentUrls = useMemo(() => {
    const raw = Array.isArray(highIntentUrls) ? highIntentUrls : String(highIntentUrls || '').split(',');
    return raw.map((u) => u.trim().toLowerCase()).filter(Boolean);
  }, [highIntentUrls]);

  const normalizedConversionUrls = useMemo(() => {
    const raw = Array.isArray(conversionUrls) ? conversionUrls : String(conversionUrls || '').split(',');
    return raw.map((u) => u.trim().toLowerCase()).filter(Boolean);
  }, [conversionUrls]);

  // Filter companies and general visitors based on selected date filter
  const filteredCompanies = useMemo(() => {
    if (dateFilter === 'all') return companies;
    return companies
      .map((c) => {
        const visits = c.page_visits || [];
        const hits = c.hits || [];
        const matchedVisits = visits.filter((h) => isHitInRange(h, dateFilter, customStartDate, customEndDate));
        const matchedHits = hits.filter((h) => isHitInRange(h, dateFilter, customStartDate, customEndDate));

        if (matchedVisits.length === 0 && matchedHits.length === 0) {
          return null;
        }

        return {
          ...c,
          page_visits: matchedVisits.length > 0 ? matchedVisits : matchedHits,
          hits: matchedHits.length > 0 ? matchedHits : matchedVisits,
          total_visits: matchedVisits.length || matchedHits.length,
          total_page_views: matchedVisits.length || matchedHits.length,
        };
      })
      .filter(Boolean);
  }, [companies, dateFilter, customStartDate, customEndDate]);

  const filteredGeneralVisitors = useMemo(() => {
    if (dateFilter === 'all') return generalVisitors;
    return generalVisitors.filter((g) => isHitInRange(g, dateFilter, customStartDate, customEndDate));
  }, [generalVisitors, dateFilter, customStartDate, customEndDate]);

  // Aggregate hits by unique IP address to accurately distinguish New vs Returning visitors
  const ipStats = useMemo(() => {
    const map = new Map();

    // 1. Corporate hits from filtered companies
    filteredCompanies.forEach((c) => {
      (c.page_visits || []).forEach((hit) => {
        const ip = hit.visitor_ip || c.activation_ip || 'Unknown';
        if (!map.has(ip)) {
          map.set(ip, {
            ip,
            isCorporate: true,
            companyName: c.company_name,
            totalHits: 0,
            pagesVisited: new Set(),
            dwellSeconds: 0,
            country: c.country || '',
            city: c.city || '',
            physicalAddress: c.physical_address || '',
            referrer: hit.referrer || 'Direct Navigation',
            acquisitionChannel: c.acquisition_channel,
            browser: hit.browser || 'Chrome',
            hits: [],
          });
        }
        const rec = map.get(ip);
        rec.totalHits += 1;
        rec.dwellSeconds += parseInt(hit.duration, 10) || 60;
        if (hit.page_url) rec.pagesVisited.add(hit.page_url);
        rec.hits.push(hit);
      });
    });

    // 2. General consumer hits from filtered general visitors
    filteredGeneralVisitors.forEach((gen) => {
      const ip = gen.visitor_ip || 'Unknown';
      if (!map.has(ip)) {
        map.set(ip, {
          ip,
          isCorporate: false,
          companyName: null,
          totalHits: 0,
          pagesVisited: new Set(),
          dwellSeconds: 0,
          country: gen.country || '',
          city: gen.city || '',
          physicalAddress: gen.physical_address || '',
          referrer: gen.referrer || 'Direct Navigation',
          acquisitionChannel: null,
          browser: gen.browser || 'Chrome',
          hits: [],
        });
      }
      const rec = map.get(ip);
      rec.totalHits += 1;
      rec.dwellSeconds += gen.duration_seconds || 60;
      if (gen.page_url) rec.pagesVisited.add(gen.page_url);
      rec.hits.push(gen);
    });

    return Array.from(map.values());
  }, [filteredCompanies, filteredGeneralVisitors]);

  // Calculate accurate KPI values based on filtered data
  const totalVisitorsCount = ipStats.length;
  const totalHitsCount = ipStats.reduce((s, r) => s + r.totalHits, 0);
  const newVisitorsCount = ipStats.filter((r) => r.totalHits <= 1).length;
  const returningVisitorsCount = ipStats.filter((r) => r.totalHits > 1).length;
  const totalPageViewsCount = totalHitsCount;

  // High-Intent visitors calculation (matching any configured High-Intent URL)
  const highIntentVisitorsCount = useMemo(() => {
    return ipStats.filter((r) => {
      return r.hits.some((h) => {
        const page = (h.page_url || '').toLowerCase();
        const dur = parseInt(h.duration, 10) || h.duration_seconds || 60;
        const matchesUrl = normalizedHighIntentUrls.some((target) => page.includes(target));
        return matchesUrl && dur >= (opportunityDuration || 60);
      });
    }).length;
  }, [ipStats, normalizedHighIntentUrls, opportunityDuration]);

  // Conversions calculation (matching any configured Conversion Page URL)
  const conversionsCount = useMemo(() => {
    return ipStats.filter((r) => {
      return r.hits.some((h) => {
        const page = (h.page_url || '').toLowerCase();
        return normalizedConversionUrls.some((target) => page.includes(target));
      });
    }).length;
  }, [ipStats, normalizedConversionUrls]);

  const totalIdentifiedCompanies = filteredCompanies.length;

  // Traffic Logs: 14-day daily hit volume trend
  const trafficDays = useMemo(() => {
    const days = 14;
    const result = [];
    const now = Date.now();
    for (let i = days - 1; i >= 0; i--) {
      const dayDate = new Date(now - i * 86400000);
      const label = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayStr = dayDate.toISOString().slice(0, 10);
      const dayHits = allHits.filter((h) => (h.visited_at || '').startsWith(dayStr)).length;
      result.push({ label, count: dayHits, date: dayStr });
    }
    return result;
  }, [allHits]);

  const maxDailyCount = Math.max(...trafficDays.map((d) => d.count), 5);

  // Filter summary description text
  const filterSummaryText = useMemo(() => {
    if (dateFilter === 'all') return 'All Time Telemetry';
    if (dateFilter === 'today') return 'Today';
    if (dateFilter === 'yesterday') return 'Yesterday';
    if (dateFilter === '7d') return 'Last 7 Days';
    if (dateFilter === '14d') return 'Last 14 Days';
    if (dateFilter === '30d') return 'Last 30 Days';
    if (dateFilter === 'custom') {
      if (customStartDate && customEndDate) return `${customStartDate} to ${customEndDate}`;
      if (customStartDate) return `Since ${customStartDate}`;
      if (customEndDate) return `Until ${customEndDate}`;
      return 'Custom Range';
    }
    return 'Filtered';
  }, [dateFilter, customStartDate, customEndDate]);

  // 1. Country Source Breakdown
  const countrySourceBreakdown = useMemo(() => {
    const counts = {};
    const flags = {};
    ipStats.forEach((r) => {
      const loc = getIpLocation(r);
      const country = loc.country || 'Global Network';
      counts[country] = (counts[country] || 0) + r.totalHits;
      flags[country] = loc.flag || '🌐';
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        flag: flags[name] || '🌐',
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [ipStats]);

  // 2. Traffic Source Breakdown
  const trafficSourceBreakdown = useMemo(() => {
    const counts = {};
    ipStats.forEach((r) => {
      const src = parseTrafficSource(r.referrer, r.acquisitionChannel);
      const label = src.label || 'Direct Navigation';
      counts[label] = (counts[label] || 0) + r.totalHits;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [ipStats]);

  // 3. Device Source Breakdown
  const deviceSourceBreakdown = useMemo(() => {
    const counts = { Desktop: 0, Mobile: 0, Tablet: 0 };
    ipStats.forEach((r) => {
      const b = (r.browser || '').toLowerCase();
      if (b.includes('mobile') || b.includes('iphone') || b.includes('android')) {
        counts.Mobile += r.totalHits;
      } else if (b.includes('tablet') || b.includes('ipad')) {
        counts.Tablet += r.totalHits;
      } else {
        counts.Desktop += r.totalHits;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return [
      { name: 'Desktop', count: counts.Desktop, pct: Math.round((counts.Desktop / total) * 100), icon: Monitor },
      { name: 'Mobile', count: counts.Mobile, pct: Math.round((counts.Mobile / total) * 100), icon: Smartphone },
      { name: 'Tablet', count: counts.Tablet, pct: Math.round((counts.Tablet / total) * 100), icon: Laptop },
    ];
  }, [ipStats]);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* ======================================================================= */}
      {/* A. Traffic Logs Section (Full Available Content Width at Top)           */}
      {/* ======================================================================= */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Traffic Logs</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily visitor telemetry and request volume over the past 14 days
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-lg bg-white text-slate-900 shadow-2xs font-bold">14 Days</span>
            <span className="px-2.5 py-1 text-slate-500">Live Telemetry</span>
          </div>
        </div>

        {/* Full-Width Bar / Activity Visualization with fixed, unclipped tooltips */}
        <div className="mt-4 w-full pt-6">
          <div className="h-48 sm:h-56 flex items-end justify-between gap-1 sm:gap-2.5 pt-8 pb-2 w-full">
            {trafficDays.map((day, idx) => {
              const heightPct = day.count > 0 ? Math.max(16, Math.round((day.count / maxDailyCount) * 100)) : 6;
              const tooltipAlign =
                idx === 0
                  ? 'left-0'
                  : idx === trafficDays.length - 1
                  ? 'right-0'
                  : 'left-1/2 -translate-x-1/2';

              return (
                <div key={idx} className="flex-1 min-w-0 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover - Unclipped and crisp */}
                  <div
                    className={`opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 absolute -top-8 ${tooltipAlign} bg-slate-900 text-white text-[11px] font-mono py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-xl z-30 border border-slate-700/60 flex items-center gap-1.5`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                    <span>{day.date}:</span>
                    <span className="font-bold text-blue-300">
                      {day.count} {day.count === 1 ? 'hit' : 'hits'}
                    </span>
                  </div>

                  {/* Volume Bar */}
                  <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg overflow-hidden h-full flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        day.count > 0
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400 shadow-xs'
                          : 'bg-slate-200'
                      }`}
                    ></div>
                  </div>

                  {/* Date Label */}
                  <span className="text-[10px] text-slate-400 font-mono mt-2 truncate max-w-full block">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* B. Date Range Filter Toolbar (Controls all values below)                */}
      {/* ======================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Analytics Date Filter
                </span>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {filterSummaryText}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                All visitor metrics, conversion counts, and breakdowns below are computed for this date range
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 self-start lg:self-auto">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setDateFilter(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dateFilter === opt.id
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers when 'custom' is active */}
        {dateFilter === 'custom' && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/60 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                Reset Dates
              </button>
            )}
            <span className="text-[11px] text-slate-400 ml-auto">
              {totalHitsCount} {totalHitsCount === 1 ? 'hit' : 'hits'} matching custom range
            </span>
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* C. Seven Compact Analytics Summary Cards                                */}
      {/* ======================================================================= */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Storefront Telemetry & Visitor Overview
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 w-full">
          {/* Card 1: Visitors – Total Hits */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow min-w-0 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Total Hits</span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <Eye className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">{totalHitsCount}</span>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{totalVisitorsCount} unique IPs</p>
            </div>
          </div>

          {/* Card 2: New Visitors */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow min-w-0 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">New Visitors</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">{newVisitorsCount}</span>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 truncate">First session</p>
            </div>
          </div>

          {/* Card 3: Returning Visitors */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow min-w-0 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Returning</span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">{returningVisitorsCount}</span>
              <p className="text-[11px] text-indigo-700 font-semibold mt-0.5 truncate">Repeat sessions</p>
            </div>
          </div>

          {/* Card 4: Page Views */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow min-w-0 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Page Views</span>
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">{totalPageViewsCount}</span>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">Total requests</p>
            </div>
          </div>

          {/* Card 5: High-Intent Visitors */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow min-w-0 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">High-Intent</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <Zap className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">{highIntentVisitorsCount}</span>
              <p className="text-[11px] text-amber-800 font-semibold mt-0.5 truncate">Target URL visits</p>
            </div>
          </div>

          {/* Card 6: Conversions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow min-w-0 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Conversions</span>
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <Target className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">{conversionsCount}</span>
              <p className="text-[11px] text-rose-700 font-semibold mt-0.5 truncate">Goal page events</p>
            </div>
          </div>

          {/* Card 7: Firmography – Identified Companies */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow min-w-0 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Identified B2B</span>
              <span className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                <Building2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">{totalIdentifiedCompanies}</span>
              <p className="text-[11px] text-teal-700 font-semibold mt-0.5 truncate">Corporate entities</p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* C. Three Traffic Analytics Sections: Country, Traffic Source, Device    */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
        {/* 1. Country Source */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Country Source</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">Geo distribution</span>
            </div>

            <div className="mt-4 space-y-3">
              {countrySourceBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No geographic data recorded yet.</div>
              ) : (
                countrySourceBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                        <span className="text-sm leading-none">{item.flag}</span>
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="font-mono text-slate-500 text-[11px] shrink-0">
                        {item.count} hits ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${item.pct}%` }}
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Primary Markets</span>
            <span className="font-semibold text-slate-600">{countrySourceBreakdown[0]?.name || 'Global'}</span>
          </div>
        </div>

        {/* 2. Traffic Source */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>Traffic Source</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">Acquisition channels</span>
            </div>

            <div className="mt-4 space-y-3">
              {trafficSourceBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No traffic sources detected yet.</div>
              ) : (
                trafficSourceBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                      <span className="font-mono text-slate-500 text-[11px] shrink-0">
                        {item.count} hits ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${item.pct}%` }}
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Leading Acquisition</span>
            <span className="font-semibold text-slate-600">{trafficSourceBreakdown[0]?.name || 'Direct'}</span>
          </div>
        </div>

        {/* 3. Device Source */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-600" />
                <span>Device Source</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">Hardware distribution</span>
            </div>

            <div className="mt-4 space-y-3">
              {deviceSourceBreakdown.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-2 truncate">
                        <IconComponent className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{item.name}</span>
                      </span>
                      <span className="font-mono text-slate-500 text-[11px] shrink-0">
                        {item.count} hits ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${item.pct}%` }}
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Primary Platform</span>
            <span className="font-semibold text-slate-600">
              {deviceSourceBreakdown.sort((a, b) => b.count - a.count)[0]?.name || 'Desktop'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
