import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Eye,
  ExternalLink,
  ChevronRight,
  Search,
  Sparkles,
  ArrowLeft,
  Layers,
  Monitor,
  Calendar,
  X,
} from 'lucide-react';

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
    const cleaned = val.replace(/^\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s*,?\s*/i, '').trim();
    return cleaned || val;
  }
  return 'Recent';
}

export default function FirmographicTab({
  companies = [],
  selectedCompanyId,
  onSelectCompany,
  onDeleteDemoCompany,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewingCompanyId, setViewingCompanyId] = useState(null);

  // Selected company object for detail inspection
  const activeCompany = viewingCompanyId
    ? companies.find((c) => String(c.id) === String(viewingCompanyId)) || null
    : null;

  // Filter companies by search query and date range
  const filteredCompanies = companies.filter((c) => {
    if (fromDate) {
      const fromTs = new Date(fromDate + 'T00:00:00').getTime();
      const hasRecentHit = (c.page_visits || []).some((h) => {
        const ts = new Date(h.visited_at).getTime();
        return !isNaN(ts) && ts >= fromTs;
      });
      if (!hasRecentHit && c.page_visits && c.page_visits.length > 0) return false;
    }
    if (toDate) {
      const toTs = new Date(toDate + 'T23:59:59.999').getTime();
      const hasEarliestHit = (c.page_visits || []).some((h) => {
        const ts = new Date(h.visited_at).getTime();
        return !isNaN(ts) && ts <= toTs;
      });
      if (!hasEarliestHit && c.page_visits && c.page_visits.length > 0) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.company_name || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q) ||
      (c.activation_ip || '').toLowerCase().includes(q) ||
      (c.physical_address || '').toLowerCase().includes(q)
    );
  });

  const handleSelectCompany = (id) => {
    setViewingCompanyId(id);
    if (onSelectCompany) {
      onSelectCompany(id);
    }
  };

  const handleBackToTable = () => {
    setViewingCompanyId(null);
  };

  // Helper to calculate distinct unique pages visited by a company
  const getUniquePagesCount = (comp) => {
    return new Set((comp.page_visits || []).map((p) => p.page_url)).size || 1;
  };

  // --------------------------------------------------------------------------
  // Detail View: When a particular company is selected, hide table and show details
  // --------------------------------------------------------------------------
  if (activeCompany) {
    const uniquePagesVisited = getUniquePagesCount(activeCompany);
    const totalHitsCount = activeCompany.page_visits?.length || activeCompany.total_page_views || 1;

    return (
      <div className="space-y-6">
        {/* Back Navigation Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackToTable}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer group w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 group-hover:text-blue-600 transition-transform" />
            <span>Back to Companies Table</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Corporate Subnet:</span>
            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
              {activeCompany.activation_ip}
            </span>
          </div>
        </div>

        {/* Selected Company Inspector */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0 ${
                  activeCompany.logo_bg || 'bg-blue-600'
                }`}
              >
                {activeCompany.initials || 'CO'}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {activeCompany.company_name}
                  {activeCompany.is_demo && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
                      Demo Sample
                    </span>
                  )}
                  {activeCompany.status === 'watching' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
                      Watching
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeCompany.industry}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Total Visits:</span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                {activeCompany.total_visits || 1}
              </span>
            </div>
          </div>

          {/* 2-Column Body: Left = Metadata with Label: Value & Light Grey Lines, Right = Table Structure */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Corporate Metadata (Label: Value with lite grey horizontal lines) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Corporate Metadata
                  </h4>
                </div>

                <div className="divide-y divide-slate-200 text-xs">
                  {/* Headquarters Address */}
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <span className="text-slate-500 font-semibold shrink-0 min-w-[130px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Headquarters:
                    </span>
                    <span className="text-slate-900 font-medium">
                      {activeCompany.physical_address || 'Address pending enrichment'}
                    </span>
                  </div>

                  {/* Switchboard Phone */}
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <span className="text-slate-500 font-semibold shrink-0 min-w-[130px] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Phone:
                    </span>
                    <span className="text-slate-900 font-mono font-medium">
                      {activeCompany.telephone || '--'}
                    </span>
                  </div>

                  {/* Corporate Email */}
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <span className="text-slate-500 font-semibold shrink-0 min-w-[130px] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Official Email:
                    </span>
                    {activeCompany.official_email && activeCompany.official_email !== '--' ? (
                      <a href={`mailto:${activeCompany.official_email}`} className="text-blue-600 font-medium hover:underline">
                        {activeCompany.official_email}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Pending Enrichment</span>
                    )}
                  </div>

                  {/* Primary Domain */}
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <span className="text-slate-500 font-semibold shrink-0 min-w-[130px] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Primary Domain:
                    </span>
                    {activeCompany.website && activeCompany.website !== '#' ? (
                      <a
                        href={activeCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-medium hover:underline flex items-center gap-1"
                      >
                        {activeCompany.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Not available</span>
                    )}
                  </div>

                  {/* Industry */}
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <span className="text-slate-500 font-semibold shrink-0 min-w-[130px] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Industry:
                    </span>
                    <span className="text-slate-900 font-medium">
                      {activeCompany.industry}
                    </span>
                  </div>

                  {/* Acquisition Channel */}
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <span className="text-slate-500 font-semibold shrink-0 min-w-[130px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      Acquisition Source:
                    </span>
                    <span className="text-slate-900 font-medium">
                      {activeCompany.acquisition_channel}
                    </span>
                  </div>

                  {/* Corporate Subnet IP */}
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <span className="text-slate-500 font-semibold shrink-0 min-w-[130px] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      Activation IP:
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {activeCompany.activation_ip}
                    </span>
                  </div>

                  {/* Page Visits vs Total Hits Summary */}
                  <div className="pt-2.5 flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <span className="text-slate-500 font-semibold shrink-0 min-w-[130px] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Pages Visited:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {uniquePagesVisited} {uniquePagesVisited === 1 ? 'Page' : 'Pages'}
                      <span className="text-slate-400 font-normal ml-1">
                        ({totalHitsCount} {totalHitsCount === 1 ? 'Total Hit' : 'Total Hits'})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Table Structure Displaying All Hit Details */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Date-Wise Visitor Page Hits ({activeCompany.page_visits?.length || 0})
                </h4>
                <span className="text-xs text-emerald-700 font-semibold font-mono">
                  {activeCompany.time_on_site} Total Dwell
                </span>
              </div>

              {/* Table Structure */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Page URL</th>
                        <th className="py-2.5 px-3 text-center">Duration</th>
                        <th className="py-2.5 px-3">Referrer</th>
                        <th className="py-2.5 px-3">Browser</th>
                        <th className="py-2.5 px-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(activeCompany.page_visits || []).length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            No hit records recorded for this company.
                          </td>
                        </tr>
                      ) : (
                        (activeCompany.page_visits || []).map((hit, idx) => (
                          <tr key={hit.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-semibold">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px] block truncate max-w-[200px]"
                                title={hit.page_url}
                              >
                                {hit.page_url}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-semibold whitespace-nowrap">
                              {hit.duration}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 truncate max-w-[150px]" title={hit.referrer}>
                              <span className="truncate block text-[11px]">{hit.referrer || 'Direct Navigation'}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-[100px]">
                              {hit.browser}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px] whitespace-nowrap">
                              {formatDateWithoutTime(hit.visited_at || hit.date_time)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Master Table View: Displayed when no specific company is selected
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Corporate Firmographic Intelligence
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identified B2B corporate organizations, reverse-IP registries, total hits, and pages visited.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search identified companies..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>

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
          </div>
        </div>
      </div>

      {/* Master Firmographic Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            All Identified Companies ({filteredCompanies.length})
          </span>
          <span className="text-xs text-slate-400">
            Click any row or action icon to view company details
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">S.No</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4 text-center">Total Hits</th>
                <th className="py-3 px-4 text-center">Page Visits</th>
                <th className="py-3 px-4 text-center">Duration</th>
                <th className="py-3 px-4">Industry Vertical</th>
                <th className="py-3 px-4 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No identified companies found matching &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c, idx) => {
                  const uniquePages = getUniquePagesCount(c);
                  const totalHits = c.page_visits?.length || c.total_page_views || 1;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleSelectCompany(c.id)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* S.No */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-semibold">
                        {idx + 1}
                      </td>

                      {/* IP Address */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {c.activation_ip}
                      </td>

                      {/* Company Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                              c.logo_bg || 'bg-blue-600'
                            }`}
                          >
                            {c.initials || 'CO'}
                          </div>
                          <div>
                            <span className="font-bold block text-slate-900 group-hover:text-blue-600 transition-colors">
                              {c.company_name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                              {c.website?.replace(/^https?:\/\//, '')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total Hits (Counts repeated views of same page) */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold"
                          title={`Total Hits: ${totalHits}`}
                        >
                          {totalHits}
                        </span>
                      </td>

                      {/* Page Visits (Unique pages visited) */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="px-2.5 py-0.5 rounded-lg bg-blue-50/80 text-blue-800 border border-blue-200/80 font-mono font-semibold text-xs inline-flex items-center gap-1"
                          title={`Unique pages visited: ${uniquePages}`}
                        >
                          <span>{uniquePages}</span>
                          <span className="text-[10px] text-blue-600 font-normal">
                            {uniquePages === 1 ? 'page' : 'pages'}
                          </span>
                        </span>
                      </td>

                      {/* Total Duration */}
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-700 font-semibold">
                        {c.time_on_site}
                      </td>

                      {/* Industry */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="truncate block max-w-[200px]">{c.industry}</span>
                      </td>

                      {/* Action Icon */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCompany(c.id);
                          }}
                          title={`View ${c.company_name} details`}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-4 h-4" />
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
    </div>
  );
}
