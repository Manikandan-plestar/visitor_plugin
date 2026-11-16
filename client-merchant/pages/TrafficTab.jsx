import React, { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  Clock,
  Filter,
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  ArrowUpDown,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Compass,
  Share2,
} from 'lucide-react';

/**
 * Intelligent Traffic Source Classifier
 * Identifies Direct, Search Engines (Google, Bing), Social Networks (Facebook, LinkedIn, Twitter, Instagram), or External Referrals.
 */
export function parseTrafficSource(referrer, channel) {
  // 1. If explicit acquisition channel from company intelligence is available
  if (channel && channel !== 'Direct Navigation' && channel !== '--' && channel !== '#') {
    const ch = channel.toLowerCase();
    if (ch.includes('google')) {
      return { type: 'google', label: 'Google Search', category: 'Search' };
    }
    if (ch.includes('facebook') || ch.includes('fb')) {
      return { type: 'facebook', label: 'Facebook', category: 'Social' };
    }
    if (ch.includes('linkedin')) {
      return { type: 'linkedin', label: 'LinkedIn', category: 'Social' };
    }
    if (ch.includes('twitter') || ch.includes('x.com')) {
      return { type: 'twitter', label: 'Twitter / X', category: 'Social' };
    }
    if (ch.includes('instagram')) {
      return { type: 'instagram', label: 'Instagram', category: 'Social' };
    }
    return { type: 'referral', label: channel, category: 'Referral' };
  }

  // 2. Direct visits (no referrer or explicit Direct Navigation)
  if (
    !referrer ||
    referrer === 'Direct Navigation' ||
    referrer === 'Direct' ||
    referrer === '--' ||
    referrer === '#'
  ) {
    return { type: 'direct', label: 'Direct', category: 'Direct' };
  }

  const ref = referrer.toLowerCase();
  try {
    if (ref.includes('google.') || ref.includes('google/')) {
      return { type: 'google', label: 'Google Search', category: 'Search' };
    }
    if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('fb.me')) {
      return { type: 'facebook', label: 'Facebook', category: 'Social' };
    }
    if (ref.includes('instagram.com')) {
      return { type: 'instagram', label: 'Instagram', category: 'Social' };
    }
    if (ref.includes('linkedin.com') || ref.includes('lnkd.in')) {
      return { type: 'linkedin', label: 'LinkedIn', category: 'Social' };
    }
    if (ref.includes('twitter.com') || ref.includes('x.com') || ref.includes('t.co')) {
      return { type: 'twitter', label: 'Twitter / X', category: 'Social' };
    }
    if (ref.includes('youtube.com') || ref.includes('youtu.be')) {
      return { type: 'youtube', label: 'YouTube', category: 'Social' };
    }
    if (ref.includes('bing.com')) {
      return { type: 'bing', label: 'Bing Search', category: 'Search' };
    }
    if (ref.includes('duckduckgo.com')) {
      return { type: 'duckduckgo', label: 'DuckDuckGo', category: 'Search' };
    }
    if (ref.includes('yahoo.com')) {
      return { type: 'yahoo', label: 'Yahoo Search', category: 'Search' };
    }
    if (ref.includes('reddit.com')) {
      return { type: 'reddit', label: 'Reddit', category: 'Social' };
    }

    // Generic external referrer domain
    let domain = referrer;
    if (referrer.startsWith('http://') || referrer.startsWith('https://')) {
      domain = new URL(referrer).hostname.replace(/^www\./, '');
    }
    return { type: 'referral', label: domain, category: 'Referral' };
  } catch (e) {
    return { type: 'referral', label: 'Referral', category: 'Referral' };
  }
}

/**
 * Format date string strictly without any time component
 */
function formatDateWithoutTime(val) {
  if (!val) return 'Recent';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch (e) {}

  if (typeof val === 'string') {
    // Strip any leading time like "10:30 AM Nov 16" or "10:30:00 Nov 16, 2026"
    const cleaned = val.replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s*,?\s*/i, '').trim();
    return cleaned || val;
  }
  return 'Recent';
}

export default function TrafficTab({
  companies = [],
  generalVisitors = [],
  allHits = [],
  onSelectCompany,
  onNavigateTab,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'NEW' | 'RETURNING' | 'CORPORATE' | 'CONSUMER'
  const [sortField, setSortField] = useState('hits'); // 'hits' | 'duration' | 'ip' | 'date'
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
            latestDate: formatDateWithoutTime(hit.visited_at || hit.date_time),
            latestTimestamp: hit.visited_at ? new Date(hit.visited_at).getTime() : 0,
            pagesVisited: new Set(),
            browser: hit.browser || 'Chrome',
            deviceType: hit.device_type || 'Desktop',
            referrer: hit.referrer || 'Direct Navigation',
            acquisitionChannel: comp.acquisition_channel,
            totalVisits: comp.total_visits || 1,
          });
        }
        const record = ipMap.get(ip);
        record.totalHits += 1;
        record.totalDuration += parseInt(hit.duration, 10) || 60;
        if (hit.page_url) record.pagesVisited.add(hit.page_url);
        record.browser = hit.browser || record.browser;
        if (hit.referrer && hit.referrer !== 'Direct Navigation' && hit.referrer !== '--') {
          record.referrer = hit.referrer;
        }
        if (hit.visited_at) {
          const ts = new Date(hit.visited_at).getTime();
          if (ts > record.latestTimestamp) {
            record.latestTimestamp = ts;
            record.latestDate = formatDateWithoutTime(hit.visited_at);
          }
        }
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
          latestDate: formatDateWithoutTime(gen.visited_at),
          latestTimestamp: gen.visited_at ? new Date(gen.visited_at).getTime() : 0,
          pagesVisited: new Set(),
          browser: gen.browser || 'Chrome',
          deviceType: (gen.browser || '').includes('Mobile') ? 'Mobile' : 'Desktop',
          referrer: gen.referrer || 'Direct Navigation',
          acquisitionChannel: null,
          totalVisits: 1,
        });
      }
      const record = ipMap.get(ip);
      record.totalHits += 1;
      record.totalDuration += gen.duration_seconds || 60;
      if (gen.page_url) record.pagesVisited.add(gen.page_url);
      if (gen.referrer && gen.referrer !== 'Direct Navigation' && gen.referrer !== '--') {
        record.referrer = gen.referrer;
      }
      if (gen.visited_at) {
        const ts = new Date(gen.visited_at).getTime();
        if (ts > record.latestTimestamp) {
          record.latestTimestamp = ts;
          record.latestDate = formatDateWithoutTime(gen.visited_at);
        }
      }
    });

    return Array.from(ipMap.values()).map((record) => {
      const isReturning = record.totalHits > 1 || (record.totalVisits && record.totalVisits > 1);
      const sourceInfo = parseTrafficSource(record.referrer, record.acquisitionChannel);
      return {
        ...record,
        pagesVisitCount: record.totalHits,
        uniquePagesCount: record.pagesVisited.size || 1,
        isReturning,
        sourceInfo,
      };
    });
  }, [companies, generalVisitors]);

  // Filter & Search
  const filteredTraffic = useMemo(() => {
    return aggregatedTraffic.filter((item) => {
      // Filter Type: ALL | NEW | RETURNING | CORPORATE | CONSUMER
      if (filterType === 'NEW' && item.isReturning) return false;
      if (filterType === 'RETURNING' && !item.isReturning) return false;
      if (filterType === 'CORPORATE' && !item.isCorporate) return false;
      if (filterType === 'CONSUMER' && item.isCorporate) return false;

      // Search query across IP, Company, Source, Page, Browser
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchIp = item.ip.toLowerCase().includes(q);
        const matchComp = (item.companyName || '').toLowerCase().includes(q);
        const matchSource = (item.sourceInfo?.label || '').toLowerCase().includes(q);
        const matchBrowser = (item.browser || '').toLowerCase().includes(q);
        if (!matchIp && !matchComp && !matchSource && !matchBrowser) return false;
      }
      return true;
    });
  }, [aggregatedTraffic, filterType, searchQuery]);

  // Sorting
  const sortedTraffic = useMemo(() => {
    const list = [...filteredTraffic];
    list.sort((a, b) => {
      let valA = a.pagesVisitCount;
      let valB = b.pagesVisitCount;
      if (sortField === 'duration') {
        valA = a.totalDuration;
        valB = b.totalDuration;
      } else if (sortField === 'date') {
        valA = a.latestTimestamp;
        valB = b.latestTimestamp;
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

  // Helper to render Source Badge
  const renderSourceBadge = (source) => {
    switch (source.type) {
      case 'direct':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Compass className="w-3 h-3 text-slate-500" />
            <span>Direct</span>
          </span>
        );
      case 'google':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Search className="w-3 h-3 text-blue-600" />
            <span>Google Search</span>
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Share2 className="w-3 h-3 text-indigo-600" />
            <span>Facebook</span>
          </span>
        );
      case 'linkedin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Share2 className="w-3 h-3 text-sky-600" />
            <span>LinkedIn</span>
          </span>
        );
      case 'twitter':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-900 border border-slate-300">
            <Share2 className="w-3 h-3 text-slate-800" />
            <span>Twitter / X</span>
          </span>
        );
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">
            <Share2 className="w-3 h-3 text-pink-600" />
            <span>Instagram</span>
          </span>
        );
      default:
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 truncate max-w-[170px]"
            title={source.label}
          >
            <ExternalLink className="w-3 h-3 text-purple-600 shrink-0" />
            <span className="truncate">{source.label}</span>
          </span>
        );
    }
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
              Live tracking log of incoming visitor IPs, new vs. returning status, page view counts, dwell duration, and traffic sources.
            </p>
          </div>

          {/* Quick Filter Pill Group */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setFilterType('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({aggregatedTraffic.length})
            </button>
            <button
              onClick={() => { setFilterType('NEW'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'NEW'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New ({aggregatedTraffic.filter((t) => !t.isReturning).length})
            </button>
            <button
              onClick={() => { setFilterType('RETURNING'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'RETURNING'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Returning ({aggregatedTraffic.filter((t) => t.isReturning).length})
            </button>
            <button
              onClick={() => { setFilterType('CORPORATE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'CORPORATE'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Corporate ({aggregatedTraffic.filter((t) => t.isCorporate).length})
            </button>
            <button
              onClick={() => { setFilterType('CONSUMER'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'CONSUMER'
                  ? 'bg-white text-slate-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
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
              placeholder="Search by IP, Company, Source, or Browser..."
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
              <option value="hits">Highest Page Visits</option>
              <option value="duration">Longest Dwell Duration</option>
              <option value="date">Date</option>
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
                <th className="py-3.5 px-4 text-center">Visitor Type</th>
                <th className="py-3.5 px-4">Entity / Network</th>
                <th className="py-3.5 px-4 text-center">Pages Visit Count</th>
                <th className="py-3.5 px-4 text-center">Duration</th>
                <th className="py-3.5 px-4">Traffic Source</th>
                <th className="py-3.5 px-4">Browser & Device</th>
                <th className="py-3.5 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTraffic.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
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
                            type="button"
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

                      {/* Visitor Type: New vs Returning */}
                      <td className="py-3.5 px-4 text-center">
                        {row.isReturning ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                            title="Returning Visitor (Already visited your storefront)"
                          >
                            <RotateCcw className="w-3 h-3 text-indigo-600" />
                            <span>Returning</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            title="New Visitor (First visit recorded)"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>New</span>
                          </span>
                        )}
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
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
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
                            <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>
                            <span className="text-slate-600 font-medium">Residential / ISP Network</span>
                          </div>
                        )}
                      </td>

                      {/* Pages Visit Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-mono font-bold text-xs inline-flex items-center gap-1"
                          title={`Visited pages: ${Array.from(row.pagesVisited).join(', ') || '/'}`}
                        >
                          <span>{row.pagesVisitCount}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {row.pagesVisitCount === 1 ? 'page' : 'pages'}
                          </span>
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-emerald-700 font-semibold flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          {formatSeconds(row.totalDuration)}
                        </span>
                      </td>

                      {/* Traffic Source: Direct / Google / Facebook / Referral */}
                      <td className="py-3.5 px-4">
                        {renderSourceBadge(row.sourceInfo)}
                      </td>

                      {/* Browser & Device */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          {row.deviceType === 'Mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[120px]">{row.browser}</span>
                        </div>
                      </td>

                      {/* Date (Without Time) */}
                      <td className="py-3.5 px-4 text-right text-slate-600 font-mono text-[11px] font-semibold whitespace-nowrap">
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
