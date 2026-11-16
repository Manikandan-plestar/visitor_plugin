import React, { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  Clock,
  Filter,
  Monitor,
  Smartphone,
  Laptop,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  ArrowUpDown,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

export default function TrafficTab({
  companies = [],
  generalVisitors = [],
  allHits = [],
  onSelectCompany,
  onNavigateTab,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CORPORATE' | 'CONSUMER'
  const [sortField, setSortField] = useState('date'); // 'date' | 'hits' | 'duration'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [copiedIp, setCopiedIp] = useState(null);

  // Group and flatten visitor hits by IP Address
  const aggregatedTraffic = useMemo(() => {
    const ipMap = new Map();

    // 1. Process corporate company hits
    companies.forEach((comp) => {
      (comp.page_visits || []).forEach((hit) => {
        const ip = hit.visitor_ip || comp.activation_ip || 'Unknown';
        if (!ipMap.has(ip)) {
          ipMap.set(ip, {
            ip,
            isCorporate: true,
            companyName: comp.company_name,
            companyId: comp.id,
            industry: comp.industry,
            logoBg: comp.logo_bg,
            initials: comp.initials,
            totalHits: 0,
            totalDuration: 0,
            latestDate: hit.date_time || 'Recent',
            latestTimestamp: 0,
            latestPage: hit.page_url || '/',
            browser: hit.browser || 'Chrome',
            deviceType: hit.device_type || 'Desktop',
            referrer: hit.referrer || 'Direct Navigation',
          });
        }
        const record = ipMap.get(ip);
        record.totalHits += 1;
        record.totalDuration += parseInt(hit.duration, 10) || 60;
        record.latestPage = hit.page_url || record.latestPage;
        record.browser = hit.browser || record.browser;
      });
    });

    // 2. Process general/consumer visitors
    generalVisitors.forEach((gen) => {
      const ip = gen.visitor_ip || 'Unknown';
      if (!ipMap.has(ip)) {
        ipMap.set(ip, {
          ip,
          isCorporate: false,
          companyName: 'General Consumer / ISP',
          companyId: null,
          industry: 'Residential ISP',
          logoBg: 'bg-slate-500',
          initials: 'IP',
          totalHits: 0,
          totalDuration: 0,
          latestDate: gen.visited_at ? new Date(gen.visited_at).toLocaleString() : 'Recent',
          latestTimestamp: gen.visited_at ? new Date(gen.visited_at).getTime() : 0,
          latestPage: gen.page_url || '/',
          browser: gen.browser || 'Chrome',
          deviceType: (gen.browser || '').includes('Mobile') ? 'Mobile' : 'Desktop',
          referrer: gen.referrer || 'Direct Navigation',
        });
      }
      const record = ipMap.get(ip);
      record.totalHits += 1;
      record.totalDuration += gen.duration_seconds || 60;
      record.latestPage = gen.page_url || record.latestPage;
    });

    return Array.from(ipMap.values());
  }, [companies, generalVisitors]);

  // Filter & Search
  const filteredTraffic = useMemo(() => {
    return aggregatedTraffic.filter((item) => {
      // Type filter
      if (filterType === 'CORPORATE' && !item.isCorporate) return false;
      if (filterType === 'CONSUMER' && item.isCorporate) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchIp = item.ip.toLowerCase().includes(q);
        const matchComp = (item.companyName || '').toLowerCase().includes(q);
        const matchPage = (item.latestPage || '').toLowerCase().includes(q);
        const matchBrowser = (item.browser || '').toLowerCase().includes(q);
        if (!matchIp && !matchComp && !matchPage && !matchBrowser) return false;
      }
      return true;
    });
  }, [aggregatedTraffic, filterType, searchQuery]);

  // Sorting
  const sortedTraffic = useMemo(() => {
    const list = [...filteredTraffic];
    list.sort((a, b) => {
      let valA = a.totalHits;
      let valB = b.totalHits;
      if (sortField === 'duration') {
        valA = a.totalDuration;
        valB = b.totalDuration;
      } else if (sortField === 'ip') {
        return sortOrder === 'asc' ? a.ip.localeCompare(b.ip) : b.ip.localeCompare(a.ip);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
    return list;
  }, [filteredTraffic, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedTraffic.length / pageSize) || 1;
  const paginatedTraffic = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTraffic.slice(start, start + pageSize);
  }, [sortedTraffic, currentPage, pageSize]);

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Storefront Visitor Traffic Log
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive chronological log of incoming IP hits, dwell times, and destination pages.
            </p>
          </div>

          {/* Quick Filter Pill Group */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setFilterType('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Visitors ({aggregatedTraffic.length})
            </button>
            <button
              onClick={() => { setFilterType('CORPORATE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'CORPORATE' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Corporate ({aggregatedTraffic.filter((t) => t.isCorporate).length})
            </button>
            <button
              onClick={() => { setFilterType('CONSUMER'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'CONSUMER' ? 'bg-white text-slate-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              General / ISP ({aggregatedTraffic.filter((t) => !t.isCorporate).length})
            </button>
          </div>
        </div>

        {/* Search & Sort Row */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by IP, URL, or Company..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-600">
            <span>Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="hits">Highest Hits</option>
              <option value="duration">Longest Dwell Duration</option>
              <option value="ip">IP Address</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">S.No</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">Entity / Network</th>
                <th className="py-3.5 px-4 text-center">Hit Count</th>
                <th className="py-3.5 px-4 text-center">Duration</th>
                <th className="py-3.5 px-4">Latest Visited Page</th>
                <th className="py-3.5 px-4">Browser & Device</th>
                <th className="py-3.5 px-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTraffic.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No visitor records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedTraffic.map((row, idx) => {
                  const sNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={row.ip}
                      className="hover:bg-slate-50/80 transition-colors group cursor-default"
                    >
                      {/* S.No */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-semibold">
                        {sNo}
                      </td>

                      {/* IP Address */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">
                            {row.ip}
                          </span>
                          <button
                            onClick={() => copyToClipboard(row.ip)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                            title="Copy IP"
                          >
                            {copiedIp === row.ip ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Entity / Company */}
                      <td className="py-3.5 px-4">
                        {row.isCorporate ? (
                          <div
                            onClick={() => {
                              if (onSelectCompany && row.companyId) onSelectCompany(row.companyId);
                              if (onNavigateTab) onNavigateTab('firmographic');
                            }}
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <div>
                              <span className="font-bold text-slate-900 block truncate max-w-[190px]">
                                {row.companyName}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[190px]">
                                {row.industry}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                            <span className="text-slate-600 font-medium">Residential / ISP Network</span>
                          </div>
                        )}
                      </td>

                      {/* Hit Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-mono font-bold text-xs inline-block">
                          {row.totalHits}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-emerald-700 font-semibold flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          {formatSeconds(row.totalDuration)}
                        </span>
                      </td>

                      {/* Visited Page */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate block max-w-[200px]">
                          {row.latestPage}
                        </span>
                      </td>

                      {/* Browser / Device */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          {row.deviceType === 'Mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="truncate max-w-[120px]">{row.browser}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {row.latestDate}
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
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedTraffic.length)} of {sortedTraffic.length} total visitor IPs
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
              Page {currentPage} of {totalPages}
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

