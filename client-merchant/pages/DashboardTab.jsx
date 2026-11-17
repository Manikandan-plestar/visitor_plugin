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
} from 'lucide-react';
import { parseTrafficSource, getIpLocation } from './TrafficTab';

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

  // Normalize configured target URLs
  const normalizedHighIntentUrls = useMemo(() => {
    const raw = Array.isArray(highIntentUrls) ? highIntentUrls : String(highIntentUrls || '').split(',');
    return raw.map((u) => u.trim().toLowerCase()).filter(Boolean);
  }, [highIntentUrls]);

  const normalizedConversionUrls = useMemo(() => {
    const raw = Array.isArray(conversionUrls) ? conversionUrls : String(conversionUrls || '').split(',');
    return raw.map((u) => u.trim().toLowerCase()).filter(Boolean);
  }, [conversionUrls]);

  // Aggregate hits by unique IP address to accurately distinguish New vs Returning visitors
  const ipStats = useMemo(() => {
    const map = new Map();

    // 1. Corporate hits
    companies.forEach((c) => {
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

    // 2. General consumer hits
    generalVisitors.forEach((gen) => {
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
  }, [companies, generalVisitors]);

  // Calculate accurate KPI values
  const totalVisitorsCount = ipStats.length;
  const totalHitsCount = allHits.length || ipStats.reduce((s, r) => s + r.totalHits, 0);
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

  const totalIdentifiedCompanies = companies.length;

  // Storefront Activity: 14-day daily hit volume trend
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
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* ======================================================================= */}
      {/* A. Storefront Activity Section (Full Available Content Width at Top)    */}
      {/* ======================================================================= */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Storefront Activity</span>
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

        {/* Full-Width SVG Bar / Activity Visualization */}
        <div className="mt-6 w-full overflow-hidden">
          <div className="h-48 sm:h-56 flex items-end justify-between gap-1 sm:gap-2.5 pt-6 pb-2 w-full">
            {trafficDays.map((day, idx) => {
              const heightPct = day.count > 0 ? Math.max(16, Math.round((day.count / maxDailyCount) * 100)) : 6;
              return (
                <div key={idx} className="flex-1 min-w-0 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-9 bg-slate-900 text-white text-[11px] font-mono py-1 px-2 rounded-lg whitespace-nowrap shadow-md z-20">
                    {day.date}: {day.count} {day.count === 1 ? 'hit' : 'hits'}
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
      {/* B. Seven Compact Analytics Summary Cards                               */}
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
