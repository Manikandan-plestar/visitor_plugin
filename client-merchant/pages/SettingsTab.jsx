import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Zap,
  ShoppingBag,
  Server,
  ShieldCheck,
  Check,
  AlertCircle,
  Save,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function SettingsTab({
  wpSettings = {},
  opportunityUrl = '/pricing',
  opportunityDuration = 60,
  slippedEnabled = true,
  slippedWindow = '48h',
  trackingEnabled = false,
  onSaveOpportunitySettings,
  onSaveSlippedSettings,
  onSaveApiEndpoint,
  onToggleTracking,
}) {
  const [oppUrl, setOppUrl] = useState(opportunityUrl);
  const [oppDuration, setOppDuration] = useState(opportunityDuration);
  const [oppSaved, setOppSaved] = useState(false);
  const [oppSaving, setOppSaving] = useState(false);

  const [slpEnabled, setSlpEnabled] = useState(slippedEnabled);
  const [slpWindow, setSlpWindow] = useState(slippedWindow);
  const [slpSaved, setSlpSaved] = useState(false);
  const [slpSaving, setSlpSaving] = useState(false);

  const [apiUrl, setApiUrl] = useState(wpSettings.apiUrl || 'https://apps.plestarinc.com:3011');
  const [apiSaved, setApiSaved] = useState(false);
  const [apiSaving, setApiSaving] = useState(false);

  const handleSaveOpp = async (e) => {
    e.preventDefault();
    setOppSaving(true);
    setOppSaved(false);
    try {
      if (onSaveOpportunitySettings) {
        await onSaveOpportunitySettings(oppUrl, oppDuration);
      }
      setOppSaved(true);
      setTimeout(() => setOppSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setOppSaving(false);
    }
  };

  const handleSaveSlp = async (e) => {
    e.preventDefault();
    setSlpSaving(true);
    setSlpSaved(false);
    try {
      if (onSaveSlippedSettings) {
        await onSaveSlippedSettings(slpEnabled, slpWindow);
      }
      setSlpSaved(true);
      setTimeout(() => setSlpSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSlpSaving(false);
    }
  };

  const handleSaveApi = async (e) => {
    e.preventDefault();
    setApiSaving(true);
    setApiSaved(false);
    try {
      if (onSaveApiEndpoint) {
        await onSaveApiEndpoint(apiUrl);
      }
      setApiSaved(true);
      setTimeout(() => setApiSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setApiSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-blue-600" />
          Analytics & Tracking Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your high-intent opportunity thresholds, cross-store slipped settings, and central API endpoints.
        </p>
      </div>

      {/* 1. Opportunity Settings Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">High-Intent Opportunity Settings</h3>
              <p className="text-xs text-slate-500">
                Specify which page visits classify a visitor as an active sales opportunity.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full uppercase">
            Active
          </span>
        </div>

        <form onSubmit={handleSaveOpp} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Opportunity URL Pattern:
              </label>
              <input
                type="text"
                value={oppUrl}
                onChange={(e) => setOppUrl(e.target.value)}
                placeholder="/pricing or /checkout"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Matches exact page path or partial subpaths (e.g. <code>/pricing</code>, <code>/contact-sales</code>).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Dwell Duration (Seconds):
              </label>
              <input
                type="number"
                min="10"
                max="600"
                value={oppDuration}
                onChange={(e) => setOppDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Minimum seconds a visitor must engage with the page to register as an Opportunity.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {oppSaved ? (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Opportunity settings updated successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-400">Settings save to WordPress options</span>
            )}
            <button
              type="submit"
              disabled={oppSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {oppSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {oppSaving ? 'Saving...' : 'Save Opportunity Rules'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Slipped Settings Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-orange-100 text-orange-700 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Slipped Cross-Store Tracking Configuration</h3>
              <p className="text-xs text-slate-500">
                Configure attribution windows and consortium journey detection parameters.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full uppercase">
            Preview
          </span>
        </div>

        <form onSubmit={handleSaveSlp} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cross-Store Consortium Participation:
              </label>
              <select
                value={slpEnabled ? 'yes' : 'no'}
                onChange={(e) => setSlpEnabled(e.target.value === 'yes')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="yes">Enabled (Detect Multi-Store Journeys)</option>
                <option value="no">Disabled (Single-Storefront Only)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Correlates anonymous IP & user-agent touchpoints across partner stores.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Attribution Tracking Window:
              </label>
              <select
                value={slpWindow}
                onChange={(e) => setSlpWindow(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="24h">24 Hours (Fast-Cycle Retail)</option>
                <option value="48h">48 Hours (Standard B2B / eCommerce)</option>
                <option value="7d">7 Days (Longer Procurement Evaluation)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Maximum elapsed time between initial catalog visit and third-party checkout.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {slpSaved ? (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Slipped journey preferences saved!
              </span>
            ) : (
              <span className="text-xs text-slate-400">Settings save to WordPress options</span>
            )}
            <button
              type="submit"
              disabled={slpSaving}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {slpSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {slpSaving ? 'Saving...' : 'Save Slipped Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. API Server Endpoint Configuration */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Server className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Central Intelligence Backend Endpoint</h3>
              <p className="text-xs text-slate-500">
                Configure your central Node.js reverse-WHOIS resolution server.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveApi} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Backend API URL:
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://apps.plestarinc.com:3011 or http://localhost:4000"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Default live cloud server: <code>https://apps.plestarinc.com:3011</code> (or <code>http://localhost:4000</code> for local development).
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            {apiSaved ? (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Endpoint configuration saved successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-400">Stores in WordPress options</span>
            )}
            <button
              type="submit"
              disabled={apiSaving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {apiSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {apiSaving ? 'Saving...' : 'Update API Endpoint'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Privacy & Consent Notice (Guideline 7 Compliance) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Privacy & Storefront Telemetry Consent</h3>
              <p className="text-xs text-slate-500">
                WordPress Guideline 7 Compliance — Zero automatic storefront tracking without explicit consent.
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
            trackingEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {trackingEnabled ? 'Active' : 'Paused'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <p className="text-xs text-slate-600 max-w-lg">
            Storefront visitor beacon is currently {trackingEnabled ? <strong className="text-emerald-700 font-bold">Enabled</strong> : <strong className="text-amber-700 font-bold">Paused</strong>}.
            Review our{' '}
            <a href="https://plestar.net/amazer-analytics/terms.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="https://plestar.net/amazer-analytics/privacy.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">
              Privacy Policy
            </a>.
          </p>

          <button
            type="button"
            onClick={onToggleTracking}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              trackingEnabled
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {trackingEnabled ? 'Pause Tracking' : 'Enable Amazer Visitor Intelligence'}
          </button>
        </div>
      </div>
    </div>
  );
}
