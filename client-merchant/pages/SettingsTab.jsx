import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Zap,
  Target,
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
  highIntentUrls = '/pricing, /product/industrial-turbine-sensor, /checkout, /four-plans, /contact-sales',
  conversionUrls = '/thank-you, /order-received, /order-confirmed, /checkout/success, /checkout',
  opportunityDuration = 60,
  slippedEnabled = true,
  slippedWindow = '48h',
  trackingEnabled = false,
  onSaveAnalyticsUrls,
  onSaveOpportunitySettings,
  onSaveSlippedSettings,
  onSaveApiEndpoint,
  onToggleTracking,
}) {
  const [hiUrls, setHiUrls] = useState(
    Array.isArray(highIntentUrls) ? highIntentUrls.join(', ') : String(highIntentUrls || '')
  );
  const [convUrls, setConvUrls] = useState(
    Array.isArray(conversionUrls) ? conversionUrls.join(', ') : String(conversionUrls || '')
  );
  const [oppDuration, setOppDuration] = useState(opportunityDuration);
  const [analyticsSaved, setAnalyticsSaved] = useState(false);
  const [analyticsSaving, setAnalyticsSaving] = useState(false);

  const [slpEnabled, setSlpEnabled] = useState(slippedEnabled);
  const [slpWindow, setSlpWindow] = useState(slippedWindow);
  const [slpSaved, setSlpSaved] = useState(false);
  const [slpSaving, setSlpSaving] = useState(false);

  const [apiUrl, setApiUrl] = useState(wpSettings.apiUrl || 'https://apps.plestarinc.com:3011');
  const [apiSaved, setApiSaved] = useState(false);
  const [apiSaving, setApiSaving] = useState(false);

  const handleSaveAnalytics = async (e) => {
    e.preventDefault();
    setAnalyticsSaving(true);
    setAnalyticsSaved(false);
    try {
      if (onSaveAnalyticsUrls) {
        await onSaveAnalyticsUrls(hiUrls, convUrls, oppDuration);
      } else if (onSaveOpportunitySettings) {
        await onSaveOpportunitySettings(hiUrls, oppDuration);
      }
      setAnalyticsSaved(true);
      setTimeout(() => setAnalyticsSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsSaving(false);
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
    <div className="space-y-6 w-full max-w-full">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-blue-600" />
          Settings & Tracking Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure High Intent URLs, Conversion target URLs, and engagement dwell time thresholds.
        </p>
      </div>

      {/* 1. High Intent & Conversion URL Settings Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">High Intent & Conversion URL Rules</h3>
            <p className="text-xs text-slate-500">
              Specify storefront page patterns to detect visitor buying intent and recorded conversions.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full uppercase">
            Active Rules
          </span>
        </div>

        <form onSubmit={handleSaveAnalytics} className="space-y-5">
          {/* High Intent Section */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
              </span>
              <div>
                <label className="text-xs font-bold text-slate-800 block">
                  High Intent URLs:
                </label>
                <span className="text-[11px] text-slate-500">
                  Multiple URLs separated by comma (e.g. <code>/pricing, /checkout, /product/industrial-turbine-sensor</code>)
                </span>
              </div>
            </div>
            <textarea
              rows="3"
              value={hiUrls}
              onChange={(e) => setHiUrls(e.target.value)}
              placeholder="/pricing, /product/industrial-turbine-sensor, /checkout, /four-plans, /contact-sales"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-amber-500 shadow-2xs"
              required
            />

            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Engagement Dwell Duration (Seconds):
              </label>
              <div className="flex items-center gap-2 max-w-xs">
                <input
                  type="number"
                  min="5"
                  max="600"
                  value={oppDuration}
                  onChange={(e) => setOppDuration(e.target.value)}
                  className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-amber-500 shadow-2xs"
                  required
                />
                <span className="text-xs text-slate-500 font-medium">seconds</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Minimum active time on high-intent pages before classifying as a qualified lead.
              </span>
            </div>
          </div>

          {/* Conversion Section */}
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <Target className="w-4 h-4 text-rose-600" />
              </span>
              <div>
                <label className="text-xs font-bold text-slate-800 block">
                  Conversion Page URLs:
                </label>
                <span className="text-[11px] text-slate-500">
                  Multiple URLs separated by comma (e.g. <code>/thank-you, /order-received, /order-confirmed, /checkout/success</code>)
                </span>
              </div>
            </div>
            <textarea
              rows="3"
              value={convUrls}
              onChange={(e) => setConvUrls(e.target.value)}
              placeholder="/thank-you, /order-received, /order-confirmed, /checkout/success, /checkout"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-rose-500 shadow-2xs"
              required
            />
            <span className="text-[11px] text-slate-400 block">
              Visits to any of these URLs record a goal conversion event.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-2">
            {analyticsSaved ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                High Intent & Conversion URLs saved successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-400">Settings save to WordPress database</span>
            )}
            <button
              type="submit"
              disabled={analyticsSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {analyticsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {analyticsSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/*
        2. Slipped Settings Card (Commented out for now; to be enabled in a future release)
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
      */}

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
