import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Crown,
  Check,
  ShieldCheck,
  Lock,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function PayPalUpgradeModal({
  isOpen,
  onClose,
  billingInfo = {},
  wpSettings = {},
  onSubscriptionSuccess,
}) {
  const paypalContainerRef = useRef(null);
  const [sdkLoading, setSdkLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');

  const ppConfig = billingInfo?.paypal || {};
  const hasAnnual = Boolean(ppConfig.annual_plan_id);
  const activePlanId =
    billingCycle === 'annual' && ppConfig.annual_plan_id
      ? ppConfig.annual_plan_id
      : ppConfig.plan_id || ppConfig.annual_plan_id;
  const isConfigured = Boolean(ppConfig.configured && ppConfig.client_id && activePlanId);

  useEffect(() => {
    if (!isOpen || !isConfigured) return;

    let cancelled = false;
    setError('');
    setSuccessMsg('');

    const renderPayPalButtons = () => {
      if (cancelled || !window.paypal || !paypalContainerRef.current) return;
      paypalContainerRef.current.innerHTML = '';

      try {
        window.paypal
          .Buttons({
            style: {
              shape: 'pill',
              color: 'gold',
              layout: 'vertical',
              label: 'subscribe',
            },
            createSubscription: (data, actions) => {
              return actions.subscription.create({
                plan_id: activePlanId,
              });
            },
            onApprove: async (data) => {
              setVerifying(true);
              setError('');
              try {
                const headers = { 'Content-Type': 'application/json' };
                if (wpSettings.storeApiKey) {
                  headers['x-store-key'] = wpSettings.storeApiKey;
                }
                const res = await fetch(
                  `${wpSettings.apiUrl.replace(/\/+$/, '')}/api/v1/billing/paypal/activate`,
                  {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                      storeUrl: wpSettings.storeUrl,
                      subscriptionID: data.subscriptionID,
                    }),
                  }
                );
                const result = await res.json();
                if (!res.ok || !result.success) {
                  throw new Error(result.error || 'PayPal verification failed on server.');
                }
                setSuccessMsg('Premium subscription verified and unlocked!');
                if (onSubscriptionSuccess) {
                  await onSubscriptionSuccess(result);
                }
              } catch (err) {
                setError(err.message || 'Verification failed.');
              } finally {
                setVerifying(false);
              }
            },
            onError: (err) => {
              console.error('PayPal Button Error:', err);
              setError('PayPal checkout encountered an error. Please try again.');
            },
          })
          .render(paypalContainerRef.current);
      } catch (e) {
        setError('Unable to initialize PayPal button.');
      }
    };

    const existingScript = document.querySelector('script[data-amazer-paypal-sdk="true"]');
    if (window.paypal && existingScript) {
      renderPayPalButtons();
    } else {
      setSdkLoading(true);
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
        ppConfig.client_id
      )}&vault=true&intent=subscription`;
      script.setAttribute('data-amazer-paypal-sdk', 'true');
      script.async = true;
      script.onload = () => {
        setSdkLoading(false);
        renderPayPalButtons();
      };
      script.onerror = () => {
        setSdkLoading(false);
        setError('Failed to load PayPal SDK script.');
      };
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, isConfigured, ppConfig.client_id, activePlanId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Crown className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2 !text-white m-0">
                <span>Upgrade to Amazer Premium</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Full Access
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Unlock unlimited B2B company contacts, competitor footprint matches, and full historical telemetry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Free vs Premium Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-700 flex items-center justify-between">
                <span>Normal (Free)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  Current Limits
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-600">
                <li className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Up to 5 full company profiles</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Up to 15 general traffic rows</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>1 competitor domain & 3 footprint hits</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <div className="font-bold text-indigo-950 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Premium Plan
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                  Unlimited
                </span>
              </div>
              <ul className="space-y-1.5 text-indigo-900 font-medium">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Unlimited B2B contact & email reveals</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Unlimited traffic, slipped & intent leads</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Unlimited competitors & footprint matches</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PayPal Checkout Area */}
          {verifying ? (
            <div className="py-6 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                Verifying PayPal subscription securely with server...
              </p>
            </div>
          ) : isConfigured ? (
            <div className="space-y-4">
              {hasAnnual && ppConfig.plan_id && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Choose Your Billing Cycle</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Monthly Plan Card ($49/mo) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setBillingCycle('monthly')}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setBillingCycle('monthly'); }}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                        billingCycle === 'monthly'
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Monthly Plan</span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            billingCycle === 'monthly' ? 'border-indigo-600' : 'border-slate-300'
                          }`}
                        >
                          {billingCycle === 'monthly' && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          )}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">$49</span>
                        <span className="text-xs font-semibold text-slate-500">/ month</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Billed monthly • Full access
                      </div>
                    </div>

                    {/* Annual Plan Card ($468/yr = $39/mo) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setBillingCycle('annual')}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setBillingCycle('annual'); }}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none relative ${
                        billingCycle === 'annual'
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Annual Plan</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Save $120 (20%)
                          </span>
                        </span>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            billingCycle === 'annual' ? 'border-indigo-600' : 'border-slate-300'
                          }`}
                        >
                          {billingCycle === 'annual' && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          )}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">$468</span>
                        <span className="text-xs font-semibold text-slate-500">/ year</span>
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-md">
                          $39/mo
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Billed annually • Best value
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  Selected:{' '}
                  <strong className="text-slate-800">
                    {billingCycle === 'annual' ? 'Annual ($468/year)' : 'Monthly ($49/month)'}
                  </strong>{' '}
                  via PayPal
                </span>
                <span className="font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {ppConfig.mode}
                </span>
              </div>
              {sdkLoading && (
                <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading PayPal Checkout...</span>
                </div>
              )}
              <div ref={paypalContainerRef} className="min-h-[45px]" />
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>PayPal Credentials Not Configured on Backend Server</span>
              </div>
              <p className="text-amber-800">
                Set <code className="font-mono font-bold">PAYPAL_CLIENT_ID</code>,{' '}
                <code className="font-mono font-bold">PAYPAL_CLIENT_SECRET</code>, and{' '}
                <code className="font-mono font-bold">PAYPAL_PREMIUM_PLAN_ID</code> in{' '}
                <code className="font-mono">backend/.env</code> to enable live or sandbox PayPal checkout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
