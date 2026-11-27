import React, { useState } from 'react';
import {
  Zap,
  Target,
  ShoppingBag,
  ShieldCheck,
  Check,
  Save,
  RefreshCw,
  ExternalLink,
  Lock,
  Crown,
} from 'lucide-react';

export default function SettingsTab({
  wpSettings = {},
  highIntentUrls = '/pricing, /product/industrial-turbine-sensor, /checkout, /four-plans, /contact-sales',
  conversionUrls = '/thank-you, /order-received, /order-confirmed, /checkout/success, /checkout',
  opportunityDuration = 60,
  slippedEnabled = true,
  slippedWindow = '48h',
  competitorUrls = '',
  trackingEnabled = false,
  planMeta = {},
  billingInfo = {},
  onOpenUpgrade,
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
  const [compUrls, setCompUrls] = useState(
    competitorUrls || wpSettings.competitorUrls || ''
  );
  const [slpSaved, setSlpSaved] = useState(false);
  const [slpSaving, setSlpSaving] = useState(false);

  const [urlLimitWarning, setUrlLimitWarning] = useState('');

  const isPremium = planMeta?.plan_tier === 'premium';

  const handleSaveAnalytics = async (e) => {
    e.preventDefault();
    setUrlLimitWarning('');

    if (!isPremium) {
      const hiCount = hiUrls.split(',').map((s) => s.trim()).filter(Boolean).length;
      const convCount = convUrls.split(',').map((s) => s.trim()).filter(Boolean).length;
      if (hiCount > 2 || convCount > 2) {
        setUrlLimitWarning(
          'Free plan supports up to 2 High Intent URLs and 2 Conversion URLs. Upgrade to Premium for unlimited rules.'
        );
        if (onOpenUpgrade) onOpenUpgrade();
        return;
      }
    }

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
        await onSaveSlippedSettings(slpEnabled, slpWindow, compUrls);
      }
      setSlpSaved(true);
      setTimeout(() => setSlpSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSlpSaving(false);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Full-Width Top Plan & Telemetry Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="p-2.5 rounded-2xl bg-white/10 border border-white/15 text-amber-300 shrink-0">
            <Crown className="w-5 h-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {isPremium ? 'Amazer Premium Active' : 'Normal (Free) Plan'}
              </h2>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  isPremium
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                }`}
              >
                {isPremium ? 'Unlimited Access' : 'Limited Tier'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isPremium
                ? `All 7 intelligence screens unlocked${
                    billingInfo?.paypal_subscription_id
                      ? ` • PayPal ID: ${billingInfo.paypal_subscription_id}`
                      : ''
                  }`
                : 'Free limits: 5 companies, 15 traffic rows, 5 intent/conversion leads, 3 slipped, 1 competitor & 3 footprint hits.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Quick Telemetry Switch */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15">
            <span className="text-xs font-semibold text-slate-200">
              Tracking: {trackingEnabled ? 'Active' : 'Paused'}
            </span>
            <button
              type="button"
              onClick={onToggleTracking}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                trackingEnabled ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
              aria-label="Toggle Storefront Tracking"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                  trackingEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {!isPremium && onOpenUpgrade && (
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Upgrade with PayPal</span>
            </button>
          )}
        </div>
      </div>

      {/* Full-Width 2-Column Bento Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
        {/* Card 1: Intent & Conversion URL Rules */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    High Intent & Conversion URL Rules
                  </h3>
                  <p className="text-xs text-slate-500">
                    Classify buying intent pages and goal conversion paths.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {isPremium ? 'Unlimited' : 'Free: Max 2 each'}
              </span>
            </div>

            {urlLimitWarning && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {urlLimitWarning}
                </span>
                {onOpenUpgrade && (
                  <button
                    type="button"
                    onClick={onOpenUpgrade}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            )}

            <form id="amazer-rules-form" onSubmit={handleSaveAnalytics} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    High Intent URLs
                  </label>
                  <textarea
                    rows="3"
                    value={hiUrls}
                    onChange={(e) => setHiUrls(e.target.value)}
                    placeholder="/pricing, /checkout"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Target className="w-3.5 h-3.5 text-rose-500" />
                    Conversion Page URLs
                  </label>
                  <textarea
                    rows="3"
                    value={convUrls}
                    onChange={(e) => setConvUrls(e.target.value)}
                    placeholder="/thank-you, /order-received"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Minimum Engagement Dwell Duration
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Seconds required on a High Intent page to qualify.
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={oppDuration}
                    onChange={(e) => setOppDuration(e.target.value)}
                    className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-xs text-slate-500">sec</span>
                </div>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {analyticsSaved ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Rules saved!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Saved to WordPress options</span>
            )}
            <button
              type="submit"
              form="amazer-rules-form"
              disabled={analyticsSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {analyticsSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {analyticsSaving ? 'Saving...' : 'Save Rules'}
            </button>
          </div>
        </div>

        {/* Card 2: Competitors & Slipped Attribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Competitors & Slipped Attribution
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage competitor watchlist and cross-store attribution window.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {slpEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            <form id="amazer-slipped-form" onSubmit={handleSaveSlp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Cross-Store Network</div>
                    <div className="text-[11px] text-slate-500">Multi-store journey match</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSlpEnabled(!slpEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      slpEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle Cross-Store Network"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                        slpEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attribution Window
                  </label>
                  <select
                    value={slpWindow}
                    onChange={(e) => setSlpWindow(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="24h">24 Hours</option>
                    <option value="48h">48 Hours (Standard)</option>
                    <option value="7d">7 Days</option>
                    <option value="14d">14 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Monitored Competitor Domains
                </label>
                <textarea
                  rows={3}
                  value={compUrls}
                  onChange={(e) => setCompUrls(e.target.value)}
                  placeholder="competitor-a.com, competitor-b.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Comma-separated domains tracked in Footprint & Slipped screens.
                </span>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {slpSaved ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Preferences saved!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Saved to WordPress options</span>
            )}
            <button
              type="submit"
              form="amazer-slipped-form"
              disabled={slpSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {slpSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {slpSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Card 3: Privacy, Consent & Legal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-4 xl:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Privacy & WordPress Guideline 7 Consent
                  </h3>
                  <p className="text-xs text-slate-500">
                    Storefront telemetry requires explicit administrator opt-in.
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                  trackingEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {trackingEnabled ? 'Active' : 'Paused'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Visitor intelligence is currently{' '}
              <strong className={trackingEnabled ? 'text-emerald-700' : 'text-amber-700'}>
                {trackingEnabled ? 'Enabled' : 'Paused'}
              </strong>
              . Review our{' '}
              <a
                href="https://plestar.net/amazer-analytics/terms.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-0.5"
              >
                Terms of Service <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and{' '}
              <a
                href="https://plestar.net/amazer-analytics/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-0.5"
              >
                Privacy Policy <ExternalLink className="w-3 h-3" />
              </a>
              .
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Consent status</span>
            <button
              type="button"
              onClick={onToggleTracking}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                trackingEnabled
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {trackingEnabled ? 'Pause Tracking' : 'Enable Visitor Intelligence'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
