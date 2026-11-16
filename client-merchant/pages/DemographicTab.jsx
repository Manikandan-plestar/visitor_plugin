import React from 'react';
import {
  Users,
  Globe,
  MapPin,
  Building,
  ShieldCheck,
  PieChart,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  Laptop,
  CheckCircle,
} from 'lucide-react';

export default function DemographicTab() {
  const regions = [
    { name: 'North America (US & Canada)', count: 42, pct: 45, flag: '🇺🇸' },
    { name: 'Western & Central Europe', count: 28, pct: 30, flag: '🇪🇺' },
    { name: 'Asia Pacific (India, Singapore)', count: 16, pct: 17, flag: '🌏' },
    { name: 'Latin America & Others', count: 7, pct: 8, flag: '🌎' },
  ];

  const orgSizes = [
    { tier: 'Large Enterprise (1,000+ employees)', count: 34, pct: 36, color: 'bg-blue-600' },
    { tier: 'Mid-Market (100 - 999 employees)', count: 41, pct: 44, color: 'bg-indigo-600' },
    { tier: 'Growing SMBs (10 - 99 employees)', count: 18, pct: 20, color: 'bg-emerald-600' },
  ];

  const industries = [
    { name: 'Renewable Energy & Power Engineering', pct: 28 },
    { name: 'Telecommunications & 5G Infrastructure', pct: 24 },
    { name: 'Information Technology & Software', pct: 21 },
    { name: 'Industrial Hardware & Fasteners', pct: 15 },
    { name: 'Logistics & Global Supply Chain', pct: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Demographic & Geographic Intelligence
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono">
              B2B Organizational Demographics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Macro-level organizational distributions, regional company headquarters, and employee tier breakdowns.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Aggregated Organizational Analytics</span>
        </div>
      </div>

      {/* Privacy & Governance Notice Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <h4 className="font-bold">Privacy-First Demographic Intelligence</h4>
          <p className="leading-relaxed text-blue-800">
            In strict compliance with international privacy regulations (GDPR, CCPA), this dashboard visualizes organizational firmographics and geographic headquarters. No personal consumer demographic data (such as private individual identity, age, or gender) is collected or processed without explicit individual authentication.
          </p>
        </div>
      </div>

      {/* Main Grid: Geographic Regions & Company Size */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Reach */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Geographic Region & Market Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">Top Markets</span>
          </div>

          <div className="space-y-4 pt-1">
            {regions.map((reg, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <span className="text-base">{reg.flag}</span>
                    {reg.name}
                  </span>
                  <span className="font-mono text-slate-600 font-bold">{reg.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${reg.pct}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Organization Tier / Size */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Organizational Scale & Employee Tier
            </h3>
            <span className="text-xs text-slate-400 font-mono">Company Sizes</span>
          </div>

          <div className="space-y-4 pt-1">
            {orgSizes.map((org, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{org.tier}</span>
                  <span className="font-mono text-xs font-bold text-slate-700">{org.pct}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${org.pct}%` }} className={`h-full ${org.color} rounded-full`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Industry Sector Distribution Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            Industry Sector Concentration
          </h3>
          <span className="text-xs text-slate-400">Visitor Company Verticals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
          {industries.map((ind, idx) => (
            <div key={idx} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
              <span className="text-xs font-bold text-slate-800 leading-snug">
                {ind.name}
              </span>
              <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
                <span className="text-xl font-black text-slate-900 font-mono">{ind.pct}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Share</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
