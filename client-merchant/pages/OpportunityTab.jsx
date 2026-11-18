import React, { useState, useMemo } from 'react';
import {
  Zap,
  Clock,
  Building2,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import { maskIpAddress } from './TrafficTab';

export default function OpportunityTab({
  companies = [],
  generalVisitors = [],
  allHits = [],
  opportunityUrl = '/pricing',
  opportunityDuration = 60,
  onNavigateTab,
  onSelectCompany,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIp, setCopiedIp] = useState(null);

  // Match opportunities against configured URL & duration threshold
  const opportunities = useMemo(() => {
    const list = [];
    const targetPattern = (opportunityUrl || '/pricing').toLowerCase().trim();
    const minSec = parseInt(opportunityDuration, 10) || 60;

    // 1. Check corporate company hits
    companies.forEach((comp) => {
      (comp.page_visits || []).forEach((hit) => {
        const page = (hit.page_url || '').toLowerCase();
        const durationSec = parseInt(hit.duration, 10) || 60;
        const matchesUrl = targetPattern === '/' ? page === '/' : page.includes(targetPattern) || page.includes('pricing') || page.includes('sensor');
        const matchesDuration = durationSec >= minSec;

        if (matchesUrl && matchesDuration) {
          list.push({
            id: 'opp_' + (hit.id || Math.random()),
            ip: hit.visitor_ip || comp.activation_ip,
            isCorporate: true,
            companyName: comp.company_name,
            companyId: comp.id,
            industry: comp.industry,
            logoBg: comp.logo_bg,
            initials: comp.initials,
            pageUrl: hit.page_url,
            durationSec,
            durationFormatted: hit.duration,
            dateTime: hit.date_time,
            referrer: hit.referrer || 'Direct Navigation',
            intentLevel: durationSec >= 180 ? 'High Commercial Intent' : 'Active Evaluation',
            intentBadgeColor: durationSec >= 180 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-blue-100 text-blue-800 border-blue-200',
          });
        }
      });
    });

    // 2. Check general visitors
    generalVisitors.forEach((gen) => {
      const page = (gen.page_url || '').toLowerCase();
      const durationSec = gen.duration_seconds || 60;
      const matchesUrl = targetPattern === '/' ? page === '/' : page.includes(targetPattern) || page.includes('pricing') || page.includes('cart');
      const matchesDuration = durationSec >= minSec;

      if (matchesUrl && matchesDuration) {
        list.push({
          id: 'opp_gen_' + gen.id,
          ip: gen.visitor_ip,
          isCorporate: false,
          companyName: 'General Consumer / Unenriched',
          companyId: null,
          industry: 'Residential Network',
          logoBg: 'bg-slate-500',
          initials: 'IP',
          pageUrl: gen.page_url,
          durationSec,
          durationFormatted: `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`,
          dateTime: gen.visited_at ? new Date(gen.visited_at).toLocaleString() : 'Recent',
          referrer: gen.referrer || 'Direct Navigation',
          intentLevel: 'Cart / Funnel Interest',
          intentBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        });
      }
    });

    return list;
  }, [companies, generalVisitors, opportunityUrl, opportunityDuration]);

  // Filter by search query
  const filteredOpportunities = useMemo(() => {
    if (!searchQuery.trim()) return opportunities;
    const q = searchQuery.toLowerCase();
    return opportunities.filter(
      (o) =>
        o.ip.toLowerCase().includes(q) ||
        o.companyName.toLowerCase().includes(q) ||
        o.pageUrl.toLowerCase().includes(q)
    );
  }, [opportunities, searchQuery]);

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Active Rules Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Active Opportunity Detection Rule
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                <span>Target URL Pattern:</span>
                <span className="px-2 py-0.5 bg-white border border-amber-300 rounded-md font-mono font-bold text-amber-900">
                  {opportunityUrl || '/pricing'}
                </span>
                <span className="text-slate-400">•</span>
                <span>Minimum Dwell Duration:</span>
                <span className="px-2 py-0.5 bg-white border border-amber-300 rounded-md font-mono font-bold text-amber-900">
                  ≥ {opportunityDuration} seconds
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('settings')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            Configure Rules in Settings
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Opportunities</span>
          <span className="text-3xl font-black text-slate-900 mt-2 block">{opportunities.length}</span>
          <p className="text-xs text-slate-500 mt-1">Visitors matching high-intent threshold</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Corporate B2B Leads</span>
          <span className="text-3xl font-black text-emerald-600 mt-2 block">
            {opportunities.filter((o) => o.isCorporate).length}
          </span>
          <p className="text-xs text-slate-500 mt-1">Verified enterprise prospect visits</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Average Opportunity Dwell</span>
          <span className="text-3xl font-black text-blue-600 mt-2 block">
            {opportunities.length > 0
              ? `${Math.round(opportunities.reduce((s, o) => s + o.durationSec, 0) / opportunities.length)}s`
              : '120s'}
          </span>
          <p className="text-xs text-slate-500 mt-1">Deep engagement on key commercial pages</p>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detected High-Intent Opportunities ({filteredOpportunities.length})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Prospects who spent significant time evaluating high-value product or pricing pages.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter opportunities..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">S.No</th>
                <th className="py-3 px-4">Visitor IP</th>
                <th className="py-3 px-4">Company / Entity</th>
                <th className="py-3 px-4">Target Opportunity URL</th>
                <th className="py-3 px-4 text-center">Dwell Duration</th>
                <th className="py-3 px-4 text-center">Intent Level</th>
                <th className="py-3 px-4 text-right">Date & Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOpportunities.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No visitor hits currently match the Opportunity URL pattern ({opportunityUrl}) and duration threshold (≥{opportunityDuration}s).
                  </td>
                </tr>
              ) : (
                filteredOpportunities.map((opp, idx) => (
                  <tr key={opp.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-semibold">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <span>{maskIpAddress(opp.ip)}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {opp.isCorporate ? (
                        <div
                          onClick={() => {
                            if (onSelectCompany && opp.companyId) onSelectCompany(opp.companyId);
                            if (onNavigateTab) onNavigateTab('firmographic');
                          }}
                          className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 ${opp.logoBg}`}>
                            {opp.initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                              {opp.companyName}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                              {opp.industry}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-medium">Residential Network</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                        {opp.pageUrl}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        {opp.durationFormatted}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${opp.intentBadgeColor}`}>
                        {opp.intentLevel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500">
                      {opp.dateTime}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {opp.isCorporate && (
                        <button
                          onClick={() => {
                            if (onSelectCompany && opp.companyId) onSelectCompany(opp.companyId);
                            if (onNavigateTab) onNavigateTab('firmographic');
                          }}
                          className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Inspect Lead
                        </button>
                      )}
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

