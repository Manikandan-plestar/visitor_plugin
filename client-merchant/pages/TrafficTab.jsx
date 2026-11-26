import React, { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  Clock,
  Filter,
  Monitor,
  Smartphone,
  Laptop,
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
  MapPin,
  ArrowLeft,
  Eye,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';

/**
 * Intelligent Traffic Source Classifier
 * Identifies Direct, Search Engines (Google, Bing), Social Networks (Facebook, LinkedIn, Twitter, Instagram), or External Referrals.
 */
export function parseTrafficSource(referrer, channel) {
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
 * Intelligent IP Geolocation & Country Flag Classifier
 */
export function getIpLocation(record) {
  if (record.country || record.city) {
    const parts = [record.city, record.country].filter(Boolean);
    const country = record.country || '';
    let flag = '🌐';
    if (country.includes('Germany')) flag = '🇩🇪';
    else if (country.includes('United Kingdom') || country.includes('UK')) flag = '🇬🇧';
    else if (country.includes('United States') || country.includes('USA')) flag = '🇺🇸';
    else if (country.includes('India')) flag = '🇮🇳';
    else if (country.includes('France')) flag = '🇫🇷';
    else if (country.includes('Canada')) flag = '🇨🇦';
    else if (country.includes('Australia')) flag = '🇦🇺';
    return {
      text: parts.join(', '),
      flag,
      country,
      city: record.city || '',
    };
  }

  // From corporate physical address
  if (record.physicalAddress && record.physicalAddress !== 'Address pending enrichment') {
    const addr = record.physicalAddress;
    if (addr.includes('Germany')) {
      return { text: 'Munich, Germany', flag: '🇩🇪', country: 'Germany', city: 'Munich' };
    }
    if (addr.includes('UK') || addr.includes('United Kingdom') || addr.includes('Berkshire') || addr.includes('Wigan')) {
      return { text: 'England, UK', flag: '🇬🇧', country: 'United Kingdom', city: 'England' };
    }
    if (
      addr.includes('USA') ||
      addr.includes('United States') ||
      addr.includes('San Jose') ||
      addr.includes('Denver') ||
      addr.includes('CA') ||
      addr.includes('CO')
    ) {
      return { text: 'United States', flag: '🇺🇸', country: 'United States', city: '' };
    }
    if (addr.includes('India') || addr.includes('Hyderabad') || addr.includes('Telangana') || addr.includes('Kolkata')) {
      return { text: 'India', flag: '🇮🇳', country: 'India', city: '' };
    }
  }

  // Known sample & telemetry IP matching
  const ip = record.ip || '';
  if (ip.startsWith('194.138.') || ip === '194.138.37.10') {
    return { text: 'Munich, Germany', flag: '🇩🇪', country: 'Germany', city: 'Munich' };
  }
  if (ip.startsWith('212.183.') || ip === '212.183.128.50' || ip === '195.144.11.22') {
    return { text: 'England, UK', flag: '🇬🇧', country: 'United Kingdom', city: 'England' };
  }
  if (ip === '152.57.87.202' || ip === '122.164.45.10' || ip === '49.37.12.80' || ip === '202.53.4.20') {
    return { text: 'India', flag: '🇮🇳', country: 'India', city: 'India' };
  }
  if (
    ip === '98.142.204.11' ||
    ip === '157.240.241.35' ||
    ip === '104.244.42.1' ||
    ip === '108.177.15.10' ||
    ip === '73.189.44.110' ||
    ip === '199.181.132.250' ||
    ip === '128.107.241.1'
  ) {
    return { text: 'United States', flag: '🇺🇸', country: 'United States', city: '' };
  }

  return { text: 'Global Network', flag: '🌐', country: 'Global', city: '' };
}

/**
 * Mask IP address to show only first 2 octets (~first 6 digits) and hide remaining octets
 * (e.g. 194.138.37.10 -> 194.138.xxx.xxx)
 */
export function maskIpAddress(ip) {
  if (!ip) return '';
  const trimmed = String(ip).trim();
  const parts = trimmed.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  if (trimmed.includes(':')) {
    const colons = trimmed.split(':');
    return `${colons.slice(0, 2).join(':')}:xxxx:xxxx`;
  }
  if (trimmed.length > 7) {
    return trimmed.substring(0, 7) + '...';
  }
  return trimmed;
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
  } catch (e) { }
  return 'Recent';
}

/**
 * Format full date and time for detail view
 */
function formatFullDateTime(val) {
  if (!val) return 'Recent';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch (e) { }
  return String(val);
}

export default function TrafficTab({
  companies = [],
  generalVisitors = [],
  allHits = [],
  onSelectCompany,
  onNavigateTab,
  planMeta = {},
  onOpenUpgrade,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'NEW' | 'RETURNING' | 'CORPORATE' | 'CONSUMER'
  const [sortField, setSortField] = useState('hits'); // 'hits' | 'unique_pages' | 'duration' | 'ip' | 'date'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedIp, setCopiedIp] = useState(null);
  const [selectedIp, setSelectedIp] = useState(null); // When set, renders Individual IP Details View
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
            physicalAddress: comp.physical_address,
            officialEmail: comp.official_email,
            telephone: comp.telephone,
            website: comp.website,
            logoBg: comp.logo_bg,
            initials: comp.initials,
            totalHits: 0,
            totalDuration: 0,
            latestDate: formatDateWithoutTime(hit.visited_at || hit.date_time),
            latestTimestamp: hit.visited_at ? new Date(hit.visited_at).getTime() : 0,
            firstTimestamp: hit.visited_at ? new Date(hit.visited_at).getTime() : 0,
            pagesVisited: new Set(),
            browser: hit.browser || 'Chrome',
            deviceType: hit.device_type || 'Desktop',
            referrer: hit.referrer || 'Direct Navigation',
            acquisitionChannel: comp.acquisition_channel,
            totalVisits: comp.total_visits || 1,
            city: comp.city || '',
            country: comp.country || '',
            hits: [],
          });
        }
        const record = ipMap.get(ip);
        record.totalHits += 1;
        const dur = parseInt(hit.duration, 10) || hit.duration_seconds || 60;
        record.totalDuration += dur;
        if (hit.page_url) record.pagesVisited.add(hit.page_url);
        record.browser = hit.browser || record.browser;
        if (hit.referrer && hit.referrer !== 'Direct Navigation' && hit.referrer !== '--') {
          record.referrer = hit.referrer;
        }
        if (hit.visited_at) {
          const ts = new Date(hit.visited_at).getTime();
          if (!record.firstTimestamp || ts < record.firstTimestamp) {
            record.firstTimestamp = ts;
          }
          if (ts > record.latestTimestamp) {
            record.latestTimestamp = ts;
            record.latestDate = formatDateWithoutTime(hit.visited_at);
          }
        }
        record.hits.push({
          id: hit.id || Math.random(),
          page_url: hit.page_url || '/',
          referrer: hit.referrer || 'Direct Navigation',
          browser: hit.browser || 'Chrome',
          duration_seconds: dur,
          visited_at: hit.visited_at || hit.date_time || new Date().toISOString(),
        });
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
          physicalAddress: gen.physical_address || '',
          officialEmail: null,
          telephone: null,
          website: null,
          logoBg: 'bg-slate-500',
          initials: 'IP',
          totalHits: 0,
          totalDuration: 0,
          latestDate: formatDateWithoutTime(gen.visited_at),
          latestTimestamp: gen.visited_at ? new Date(gen.visited_at).getTime() : 0,
          firstTimestamp: gen.visited_at ? new Date(gen.visited_at).getTime() : 0,
          pagesVisited: new Set(),
          browser: gen.browser || 'Chrome',
          deviceType: (gen.browser || '').includes('Mobile') ? 'Mobile' : 'Desktop',
          referrer: gen.referrer || 'Direct Navigation',
          acquisitionChannel: null,
          totalVisits: 1,
          city: gen.city || '',
          country: gen.country || '',
          hits: [],
        });
      }
      const record = ipMap.get(ip);
      record.totalHits += 1;
      const dur = gen.duration_seconds || 60;
      record.totalDuration += dur;
      if (gen.page_url) record.pagesVisited.add(gen.page_url);
      if (gen.referrer && gen.referrer !== 'Direct Navigation' && gen.referrer !== '--') {
        record.referrer = gen.referrer;
      }
      if (gen.visited_at) {
        const ts = new Date(gen.visited_at).getTime();
        if (!record.firstTimestamp || ts < record.firstTimestamp) {
          record.firstTimestamp = ts;
        }
        if (ts > record.latestTimestamp) {
          record.latestTimestamp = ts;
          record.latestDate = formatDateWithoutTime(gen.visited_at);
        }
      }
      record.hits.push({
        id: gen.id || Math.random(),
        page_url: gen.page_url || '/',
        referrer: gen.referrer || 'Direct Navigation',
        browser: gen.browser || 'Chrome',
        duration_seconds: dur,
        visited_at: gen.visited_at || new Date().toISOString(),
      });
    });

    return Array.from(ipMap.values()).map((record) => {
      const isReturning = record.totalHits > 1 || (record.totalVisits && record.totalVisits > 1);
      const sourceInfo = parseTrafficSource(record.referrer, record.acquisitionChannel);
      const locationInfo = getIpLocation(record);
      return {
        ...record,
        uniquePagesCount: record.pagesVisited.size || 1,
        isReturning,
        sourceInfo,
        locationInfo,
      };
    });
  }, [companies, generalVisitors]);

  // Selected IP Record for detailed view
  const selectedIpRecord = useMemo(() => {
    if (!selectedIp) return null;
    return aggregatedTraffic.find((t) => t.ip === selectedIp) || null;
  }, [selectedIp, aggregatedTraffic]);

  // Filter & Search with Date Filter (From - To)
  const filteredTraffic = useMemo(() => {
    return aggregatedTraffic.filter((item) => {
      if (filterType === 'NEW' && item.isReturning) return false;
      if (filterType === 'RETURNING' && !item.isReturning) return false;
      if (filterType === 'CORPORATE' && !item.isCorporate) return false;
      if (filterType === 'CONSUMER' && item.isCorporate) return false;

      if (fromDate) {
        const fromTs = new Date(fromDate + 'T00:00:00').getTime();
        const rLatest = item.latestTimestamp || (item.latestDate ? new Date(item.latestDate).getTime() : 0);
        if (!isNaN(fromTs) && rLatest && rLatest < fromTs) return false;
      }
      if (toDate) {
        const toTs = new Date(toDate + 'T23:59:59.999').getTime();
        const rFirst = item.firstTimestamp || (item.latestDate ? new Date(item.latestDate).getTime() : 0);
        if (!isNaN(toTs) && rFirst && rFirst > toTs) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesIp = item.ip.toLowerCase().includes(q);
        const matchesCompany = (item.companyName || '').toLowerCase().includes(q);
        const matchesLocation = (item.locationInfo?.text || '').toLowerCase().includes(q);
        const matchesSource = (item.sourceInfo?.label || '').toLowerCase().includes(q);
        return matchesIp || matchesCompany || matchesLocation || matchesSource;
      }
      return true;
    });
  }, [aggregatedTraffic, filterType, searchQuery, fromDate, toDate]);

  // Sort
  const sortedTraffic = useMemo(() => {
    const list = [...filteredTraffic];
    list.sort((a, b) => {
      let valA = a.totalHits;
      let valB = b.totalHits;
      if (sortField === 'unique_pages') {
        valA = a.uniquePagesCount;
        valB = b.uniquePagesCount;
      } else if (sortField === 'duration') {
        valA = a.totalDuration;
        valB = b.totalDuration;
      } else if (sortField === 'ip') {
        return sortOrder === 'asc' ? a.ip.localeCompare(b.ip) : b.ip.localeCompare(a.ip);
      } else if (sortField === 'date') {
        valA = a.latestTimestamp;
        valB = b.latestTimestamp;
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

  const copyToClipboard = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedIp(text);
      setTimeout(() => setCopiedIp(null), 2000);
    } catch (e) { }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const renderSourceBadge = (source) => {
    switch (source.type) {
      case 'google':
      case 'bing':
      case 'yahoo':
      case 'duckduckgo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Search className="w-2.5 h-2.5 text-blue-500" />
            <span>{source.label}</span>
          </span>
        );
      case 'facebook':
      case 'linkedin':
      case 'twitter':
      case 'instagram':
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Share2 className="w-2.5 h-2.5 text-indigo-500" />
            <span>{source.label}</span>
          </span>
        );
      case 'direct':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Compass className="w-2.5 h-2.5 text-slate-500" />
            <span>Direct</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 max-w-[110px]">
            <ExternalLink className="w-2.5 h-2.5 text-purple-500 shrink-0" />
            <span className="truncate">{source.label}</span>
          </span>
        );
    }
  };

  // ==========================================================================
  // B & C. Individual IP Details View (Shown when clicking any IP / visitor)
  // ==========================================================================
  if (selectedIpRecord) {
    const avgDurationSec = selectedIpRecord.totalHits > 0
      ? Math.round(selectedIpRecord.totalDuration / selectedIpRecord.totalHits)
      : 60;

    return (
      <div className="space-y-6">
        {/* Back Navigation Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedIp(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer group w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 group-hover:text-blue-600 transition-transform" />
            <span>Back to Visitor Traffic Log</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Visitor Classification:</span>
            {selectedIpRecord.isCorporate ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Identified B2B Entity</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>General Visitor (ISP / Consumer)</span>
              </span>
            )}
          </div>
        </div>

        {/* IP Profile Hero Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-mono font-black text-base shadow-sm shrink-0">
                {selectedIpRecord.locationInfo?.flag || 'IP'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-mono font-black text-slate-900 tracking-tight">
                    {maskIpAddress(selectedIpRecord.ip)}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedIpRecord.locationInfo?.text || 'Global Network'}</span>
                  <span className="text-slate-300">•</span>
                  <span>{selectedIpRecord.isCorporate ? selectedIpRecord.companyName : 'Residential Network'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedIpRecord.isReturning ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Returning Visitor</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>New Visitor</span>
                </span>
              )}
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Total Visits</span>
              <span className="text-xl font-black text-slate-900 mt-1 block font-mono">{selectedIpRecord.totalVisits || 1}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Page Views</span>
              <span className="text-xl font-black text-slate-900 mt-1 block font-mono">{selectedIpRecord.totalHits}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Unique Pages</span>
              <span className="text-xl font-black text-blue-700 mt-1 block font-mono">{selectedIpRecord.uniquePagesCount}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Avg Duration</span>
              <span className="text-xl font-black text-emerald-700 mt-1 block font-mono">{formatSeconds(avgDurationSec)}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Traffic Source</span>
              <div className="mt-1">{renderSourceBadge(selectedIpRecord.sourceInfo)}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Device & Browser</span>
              <span className="text-xs font-semibold text-slate-800 mt-1 block truncate">{selectedIpRecord.browser}</span>
            </div>
          </div>

          {/* Company Details if Identified */}
          {selectedIpRecord.isCorporate && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Enriched Corporate Profile</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Company Name:</span>
                  <span className="font-semibold text-slate-900">{selectedIpRecord.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Industry Vertical:</span>
                  <span className="font-semibold text-slate-900">{selectedIpRecord.industry || 'B2B Commercial'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Physical Headquarters:</span>
                  <span className="font-semibold text-slate-900">{selectedIpRecord.physicalAddress || 'Pending verification'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Visitor Activity Details (Hit History Log) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Visitor Activity History ({selectedIpRecord.hits.length} Recorded Hits)</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Page URL</th>
                    <th className="py-3 px-4 text-center">Duration</th>
                    <th className="py-3 px-4">Traffic Source</th>
                    <th className="py-3 px-4">Browser & Device</th>
                    <th className="py-3 px-4 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedIpRecord.hits.map((hit, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 max-w-xs truncate">
                        <span className="text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200/50">
                          {hit.page_url}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-700 font-semibold">
                        {formatSeconds(hit.duration_seconds || 60)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">
                        {hit.referrer || 'Direct Navigation'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">{hit.browser}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {formatFullDateTime(hit.visited_at)}
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

  // ==========================================================================
  // Standard Visitor Traffic Table View
  // ==========================================================================
  return (
    <div className="space-y-4">
      {/* Header & Controls Bar - Guaranteed Single Unified Row */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between gap-3 min-w-max w-full">
          {/* Title on Left */}
          <div className="flex items-center gap-2 shrink-0">
            <Globe className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 whitespace-nowrap">
              Visitor traffic log
            </h2>
          </div>

          {/* All Controls in the Same Row (Compact Widths) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Bar with compact width */}
            <div className="relative w-36 sm:w-44 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search IP, source..."
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* Date Filter: From - To */}
            <div
              onClick={() => {
                if (planMeta?.plan_tier !== 'premium' && onOpenUpgrade) {
                  onOpenUpgrade();
                }
              }}
              title={planMeta?.plan_tier !== 'premium' ? 'Upgrade to Premium to use custom date filtering' : 'Filter by date range'}
              className={`flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 shadow-2xs shrink-0 ${
                planMeta?.plan_tier !== 'premium' ? 'cursor-pointer opacity-80 hover:border-amber-300' : ''
              }`}
            >
              {planMeta?.plan_tier !== 'premium' ? (
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="text-slate-500 font-medium text-[11px]">From:</span>
              <input
                type="date"
                value={fromDate}
                disabled={planMeta?.plan_tier !== 'premium'}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none text-xs text-slate-800 focus:outline-none p-0 cursor-pointer w-[105px] disabled:cursor-pointer"
                aria-label="Filter from date"
              />
              <span className="text-slate-400 font-medium text-[11px] ml-0.5">To:</span>
              <input
                type="date"
                value={toDate}
                disabled={planMeta?.plan_tier !== 'premium'}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none text-xs text-slate-800 focus:outline-none p-0 cursor-pointer w-[105px] disabled:cursor-pointer"
                aria-label="Filter to date"
              />
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => { setFromDate(''); setToDate(''); setCurrentPage(1); }}
                  className="ml-0.5 p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Clear Date Filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdown in Single Button */}
            <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs transition-colors shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
                aria-label="Filter visitor types"
              >
                <option value="ALL">All ({aggregatedTraffic.length})</option>
                <option value="NEW">New ({aggregatedTraffic.filter((t) => !t.isReturning).length})</option>
                <option value="RETURNING">Returning ({aggregatedTraffic.filter((t) => t.isReturning).length})</option>
                <option value="CORPORATE">Corporate ({aggregatedTraffic.filter((t) => t.isCorporate).length})</option>
                <option value="CONSUMER">General / ISP ({aggregatedTraffic.filter((t) => !t.isCorporate).length})</option>
              </select>
            </div>

            {/* Sort by Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 shadow-2xs transition-colors shrink-0">
              <span className="text-slate-500 text-xs font-medium">Sort:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
                aria-label="Sort visitor log"
              >
                <option value="hits">Highest Total Hits</option>
                <option value="unique_pages">Most Pages Visited</option>
                <option value="duration">Longest Dwell Duration</option>
                <option value="date">Date</option>
                <option value="ip">IP Address</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-600"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Scrollable Container with Sticky Table Header */}
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[580px] relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs border-b border-slate-200">
              <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] whitespace-nowrap">
                <th className="py-2.5 px-2 w-8 text-center bg-slate-50">S.No</th>
                <th className="py-2.5 px-2 text-left bg-slate-50">IP Address</th>
                <th className="py-2.5 px-2 text-left bg-slate-50">Location</th>
                <th className="py-2.5 px-1.5 text-center bg-slate-50">Visitor Type</th>
                <th className="py-2.5 px-2 text-left bg-slate-50">Entity / Network</th>
                <th className="py-2.5 px-1.5 text-center bg-slate-50">Hits</th>
                <th className="py-2.5 px-1.5 text-center bg-slate-50">Pages</th>
                <th className="py-2.5 px-1.5 text-center bg-slate-50">Duration</th>
                <th className="py-2.5 px-2 text-left bg-slate-50">Traffic Source</th>
                <th className="py-2.5 px-2 text-left bg-slate-50">Browser & Device</th>
                <th className="py-2.5 px-2 text-right bg-slate-50">Date</th>
                <th className="py-2.5 px-1 w-8 text-center bg-slate-50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTraffic.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-400">
                    No visitor records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedTraffic.map((row, idx) => {
                  const sNo = (currentPage - 1) * pageSize + idx + 1;
                  const isLockedRow = planMeta?.plan_tier !== 'premium' && sNo > 15;
                  return (
                    <tr
                      key={row.ip}
                      onClick={() => {
                        if (isLockedRow) {
                          if (onOpenUpgrade) onOpenUpgrade();
                          return;
                        }
                        setSelectedIp(row.ip);
                      }}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      title={isLockedRow ? 'Upgrade to Premium to view older visitor rows' : 'Click row to view individual IP details'}
                    >
                      {/* S.No */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-400 font-semibold whitespace-nowrap">
                        {sNo}
                      </td>

                      {/* IP Address (Masked with first 6 digits / 2 octets, remaining hidden) */}
                      <td className="py-2.5 px-2 text-left whitespace-nowrap">
                        {isLockedRow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                            <Lock className="w-3 h-3" />
                            <span>Upgrade to Reveal</span>
                          </span>
                        ) : (
                          <span
                            className="font-mono font-bold text-slate-800 hover:text-blue-600 transition-colors text-xs"
                            title="Click row to inspect details"
                          >
                            {maskIpAddress(row.ip)}
                          </span>
                        )}
                      </td>

                      {/* Location: Flag + City / Country */}
                      <td className="py-2.5 px-2 text-left whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-sm leading-none shrink-0" title={row.locationInfo.country || 'Location'}>
                            {row.locationInfo.flag}
                          </span>
                          <span className="font-medium text-slate-800 truncate max-w-[110px] xl:max-w-[130px]">
                            {row.locationInfo.text}
                          </span>
                        </div>
                      </td>

                      {/* Visitor Type: New vs Returning */}
                      <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                        {row.isReturning ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                            title="Returning Visitor (Already visited your storefront)"
                          >
                            <RotateCcw className="w-2.5 h-2.5 text-indigo-600" />
                            <span>Returning</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            title="New Visitor (First visit recorded)"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            <span>New</span>
                          </span>
                        )}
                      </td>

                      {/* Entity / Company */}
                      <td className="py-2.5 px-2 text-left whitespace-nowrap">
                        {row.isCorporate ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <div className="truncate max-w-[130px] xl:max-w-[160px]">
                              <span className="font-bold text-slate-900 block truncate text-xs">
                                {row.companyName}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {row.industry}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>
                            <span className="text-slate-600 font-medium text-xs truncate max-w-[130px] xl:max-w-[160px]">
                              Residential / ISP
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Total Hits */}
                      <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold text-xs inline-flex items-center"
                          title={`Total page view hits: ${row.totalHits}`}
                        >
                          {row.totalHits} {row.totalHits === 1 ? 'hit' : 'hits'}
                        </span>
                      </td>

                      {/* Page Visits */}
                      <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-lg bg-blue-50/80 text-blue-800 border border-blue-200/80 font-mono font-semibold text-xs inline-flex items-center"
                          title={`Distinct pages visited: ${Array.from(row.pagesVisited).join(', ') || '/'}`}
                        >
                          {row.uniquePagesCount} {row.uniquePagesCount === 1 ? 'page' : 'pages'}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                        <span className="font-mono text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          {formatSeconds(row.totalDuration)}
                        </span>
                      </td>

                      {/* Traffic Source: Direct / Google / Facebook / Referral */}
                      <td className="py-2.5 px-2 text-left whitespace-nowrap">
                        {renderSourceBadge(row.sourceInfo)}
                      </td>

                      {/* Browser & Device */}
                      <td className="py-2.5 px-2 text-left whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-600">
                          {row.deviceType === 'Mobile' ? (
                            <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <Monitor className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[85px] xl:max-w-[105px] text-xs">{row.browser}</span>
                        </div>
                      </td>

                      {/* Date (Without Time) */}
                      <td className="py-2.5 px-2 text-right text-slate-600 font-mono text-[10px] sm:text-[11px] font-semibold whitespace-nowrap">
                        {row.latestDate}
                      </td>

                      {/* Action Icon */}
                      <td className="py-2.5 px-1 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedIp(row.ip); }}
                          className="p-1 rounded-lg bg-slate-50 hover:bg-blue-100 text-slate-500 hover:text-blue-700 transition-colors shadow-2xs"
                          title="View IP Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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
            Showing {sortedTraffic.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
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
