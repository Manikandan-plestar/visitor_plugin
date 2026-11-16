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
} from 'lucide-react';

export default function FirmographicTab({
  companies = [],
  selectedCompanyId,
  onSelectCompany,
  onDeleteDemoCompany,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCompanyId, setViewingCompanyId] = useState(null);

  // Selected company object for detail inspection
  const activeCompany = viewingCompanyId
    ? companies.find((c) => String(c.id) === String(viewingCompanyId)) || null
    : null;

  // Filter companies by search query
  const filteredCompanies = companies.filter((c) => {
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

  // --------------------------------------------------------------------------
  // Detail View: When a particular company is selected, hide table and show details
  // --------------------------------------------------------------------------
  if (activeCompany) {
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

        {/* Selected Company Inspector (2-Column Inspector: Left = Company Info, Right = Hit Journey) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-6">
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
                {activeCompany.total_visits || activeCompany.page_visits?.length || 1}
              </span>
            </div>
          </div>

          {/* 2-Column Body: Left = Metadata, Right = Hits */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Company Metadata */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Corporate Metadata</h4>

                {/* Address */}
                <div className="flex items-start gap-2.5 text-xs">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Headquarters Address</span>
                    <span className="font-semibold text-slate-800">{activeCompany.physical_address}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2.5 text-xs">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Switchboard Phone</span>
                    <span className="font-semibold text-slate-800 font-mono">{activeCompany.telephone}</span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2.5 text-xs">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Corporate Contact Email</span>
                    {activeCompany.official_email && activeCompany.official_email !== '--' ? (
                      <a href={`mailto:${activeCompany.official_email}`} className="font-semibold text-blue-600 hover:underline">
                        {activeCompany.official_email}
                      </a>
                    ) : (
                      <span className="text-slate-500">Pending Enrichment</span>
                    )}
                  </div>
                </div>

                {/* Website */}
                <div className="flex items-center gap-2.5 text-xs">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Primary Domain</span>
                    {activeCompany.website && activeCompany.website !== '#' ? (
                      <a
                        href={activeCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {activeCompany.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-500">Not available</span>
                    )}
                  </div>
                </div>

                {/* Acquisition Channel */}
                <div className="flex items-center gap-2.5 text-xs pt-2 border-t border-slate-200">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Acquisition Source</span>
                    <span className="font-semibold text-slate-800">{activeCompany.acquisition_channel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Date-wise Hit Details UI (Reusing existing hit card list) */}
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

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {(activeCompany.page_visits || []).map((hit, idx) => (
                  <div
                    key={hit.id || idx}
                    className="p-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-all shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 truncate max-w-[280px]">
                        {hit.page_url}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 font-medium">
                        {hit.date_time}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <strong className="text-emerald-800 font-mono">{hit.duration}</strong>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>{hit.browser}</span>
                      </div>
                      <span className="italic truncate max-w-[220px]">
                        via {hit.referrer}
                      </span>
                    </div>
                  </div>
                ))}
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
              Identified B2B corporate organizations, reverse-IP registries, and employee page journeys.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search identified companies..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
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
                <th className="py-3 px-4 text-center">Duration</th>
                <th className="py-3 px-4">Industry Vertical</th>
                <th className="py-3 px-4 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No identified companies found matching &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c, idx) => (
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

                    {/* Total Hits */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold">
                        {c.page_visits?.length || c.total_page_views || 1}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
