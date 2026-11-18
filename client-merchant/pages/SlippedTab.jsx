import React, { useState } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  TrendingDown,
  Clock,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Store,
} from 'lucide-react';
import { maskIpAddress } from './TrafficTab';

export default function SlippedTab() {
  const sampleJourneys = [
    {
      id: 'slp_1',
      visitorToken: 'v_88f91a_9921',
      ip: '194.138.37.10',
      initialStore: 'Your Storefront',
      initialPage: '/product/industrial-turbine-sensor',
      initialDwell: '7m 00s',
      path: [
        { store: 'Your Store', action: 'Cart Added ($1,250)' },
        { store: 'GlobalSensorHub.com', action: 'Specs Compared' },
        { store: 'ApexFastenersDirect.com', action: 'Price Checked' },
        { store: 'IndustrialDirectPro.com', action: 'Purchased (Order #9041)' },
      ],
      convertingStore: 'IndustrialDirectPro.com',
      timeToConversion: '18h 45m',
      status: 'Slipped to Competitor',
      statusColor: 'bg-red-50 text-red-700 border-red-200',
      riskValue: '$1,250',
    },
    {
      id: 'slp_2',
      visitorToken: 'v_22b07e_4102',
      ip: '212.183.128.50',
      initialStore: 'Your Storefront',
      initialPage: '/solutions/5g-iot-gateway',
      initialDwell: '5m 10s',
      path: [
        { store: 'Your Store', action: 'Product Page Viewed' },
        { store: 'TelecomSolutionsUK.co.uk', action: 'Inquiry Form Submitted' },
      ],
      convertingStore: 'TelecomSolutionsUK.co.uk',
      timeToConversion: '6h 12m',
      status: 'Slipped to Competitor',
      statusColor: 'bg-red-50 text-red-700 border-red-200',
      riskValue: '$3,400',
    },
    {
      id: 'slp_3',
      visitorToken: 'v_71c45d_6120',
      ip: '195.144.11.22',
      initialStore: 'Your Storefront',
      initialPage: '/pricing',
      initialDwell: '1m 35s',
      path: [
        { store: 'Your Store', action: 'Pricing Plans Viewed' },
        { store: 'HardwareSupplyPartner.com', action: 'Catalog Downloaded' },
      ],
      convertingStore: 'HardwareSupplyPartner.com',
      timeToConversion: '32h 10m',
      status: 'In Flight - Active Comparison',
      statusColor: 'bg-amber-50 text-amber-800 border-amber-200',
      riskValue: '$890',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
              Cross-Store Slipped Visitor Intelligence
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-mono">
              UI Preview & Journey Mapping
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify visitors who engaged with your storefront catalog but ultimately completed purchases at participating network stores.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
          <Store className="w-4 h-4 text-orange-600 shrink-0" />
          <span>Consortium Journey Modeling</span>
        </div>
      </div>

      {/* Visual Journey Architecture Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Cross-Store Customer Journey Flow Architecture
          </h3>
          <span className="text-xs text-slate-400 font-mono">Journey Flow</span>
        </div>

        {/* Step-by-Step Flow Map */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {/* Step 1 */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl relative space-y-1.5">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Step 1 • Discovery</span>
            <h4 className="text-xs font-bold text-slate-900">Your Storefront</h4>
            <p className="text-[11px] text-slate-600">Visitor browses product & adds to shopping cart.</p>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Step 2 • Comparison</span>
            <h4 className="text-xs font-bold text-slate-900">Network Store B</h4>
            <p className="text-[11px] text-slate-600">Compares technical specifications & warranty.</p>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Step 3 • Pricing</span>
            <h4 className="text-xs font-bold text-slate-900">Network Store C</h4>
            <p className="text-[11px] text-slate-600">Cross-references tiered quantity discounts.</p>
          </div>

          {/* Step 4 */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl relative space-y-1.5">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Step 4 • Conversion</span>
            <h4 className="text-xs font-bold text-slate-900">Store D (Checkout)</h4>
            <p className="text-[11px] text-slate-600">Order confirmed via consortium order hook.</p>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Slipped Shoppers Detected</span>
          <span className="text-3xl font-black text-slate-900 mt-2 block">19</span>
          <p className="text-xs text-slate-500 mt-1">Multi-store cross-browsing visitor journeys</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Slipped Pipeline Value</span>
          <span className="text-3xl font-black text-red-600 mt-2 block">$14,850</span>
          <p className="text-xs text-slate-500 mt-1">Estimated revenue completed on partner stores</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Avg Multi-Store Touchpoints</span>
          <span className="text-3xl font-black text-orange-600 mt-2 block">3.2 Stores</span>
          <p className="text-xs text-slate-500 mt-1">Average comparison stops prior to purchase</p>
        </div>
      </div>

      {/* Slipped Journeys Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Cross-Store Journey Log
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Simulated journey tracking across network stores within a 48-hour attribution window.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Attribution Window: 48h</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">S.No</th>
                <th className="py-3 px-4">Visitor IP & Token</th>
                <th className="py-3 px-4">Initial Store Page</th>
                <th className="py-3 px-4">Initial Dwell</th>
                <th className="py-3 px-4">Converting Partner Store</th>
                <th className="py-3 px-4 text-center">Time to Order</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Cart Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleJourneys.map((j, idx) => (
                <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-semibold">
                    {idx + 1}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-800 block">{maskIpAddress(j.ip)}</span>
                    <span className="text-[10px] font-mono text-slate-400 block">{j.visitorToken}</span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                    <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 truncate block max-w-[200px]">
                      {j.initialPage}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {j.initialDwell}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{j.convertingStore}</span>
                    <span className="text-[10px] text-slate-500">Consortium Partner</span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                    {j.timeToConversion}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${j.statusColor}`}>
                      {j.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {j.riskValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

