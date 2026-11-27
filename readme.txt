=== Amazer Visitor Intelligence ===
Contributors: amazerinc, amazerplugins
Tags: amazer analytics, visitor intelligence, whois analytics, visitor tracking, b2b intelligence
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Real-time B2B visitor tracking and corporate reverse-IP identification. Reveal visiting company names, corporate IPs, and pages without forms.

== Description ==

**Amazer Visitor Intelligence** empowers WooCommerce and WordPress merchants to identify the businesses, corporate organizations, and leads visiting their website in real time — even if they never submit a contact form or make an inquiry.

### Key Capabilities:
* **Real-Time Reverse-IP Intelligence**: Automatically identifies corporate visitor networks, company names, industry, and corporate headquarters.
* **Corporate IP & Telemetry**: Inspect individual company visits, duration on site, and specific browsed URLs.
* **High-Intent & Conversion Tracking**: Automatically highlights visitors spending time on commercial intent pages and tracks goal conversions.
* **Competitor Footprint & Slipped Prospects**: Optionally participates in the Amazer B2B network to surface anonymous cross-store shopping signals across participating stores.
* **Explicit Opt-in Consent**: Full compliance with privacy standards and WordPress Guideline 7. Enable or disable storefront telemetry anytime from the dashboard.
* **Freemium & Premium Access**: Includes a free tier across all dashboard screens, with optional Premium subscription upgrades via PayPal for unlimited leads and unmasked B2B contact details.

### 3rd Party Service Disclosure
This plugin relies on the following external SaaS services:

1. **Amazer Cloud API (by Plestar Inc.)** — Performs real-time reverse-IP resolution, geolocation lookup, company enrichment, and optional cross-store B2B network matching (Footprint & Slipped) across participating stores.
   * **Service URL**: https://apps.plestarinc.com:3011
   * **Terms of Service**: https://plestar.net/amazer-analytics/terms.html
   * **Privacy Policy**: https://plestar.net/amazer-analytics/privacy.html

2. **PayPal Subscriptions & Checkout SDK** — Loaded only in the WordPress Admin dashboard when an administrator opens the Upgrade modal to subscribe to a Premium plan.
   * **Service URL**: https://www.paypal.com/sdk/js
   * **Terms of Service**: https://www.paypal.com/legalhub/useragreement-full
   * **Privacy Policy**: https://www.paypal.com/legalhub/privacy-full

== Source Code & Build Instructions ==

The human-readable source code for the minified frontend bundle (dist/bundle.js) is publicly maintained and available in the following repository:
* Repository URL: https://github.com/Manikandan-plestar/visitor_plugin

To build or compile the JavaScript bundle from source:
1. Clone the repository: `git clone https://github.com/Manikandan-plestar/visitor_plugin.git`
2. Change into the plugin directory and install dependencies:
   `npm install`
3. Compile the production bundle:
   `npm run build`

== Installation ==

1. Upload the plugin folder `amazer-visitor-intelligence` to `/wp-content/plugins/` directory, or upload the `amazer-visitor-intelligence.zip` archive via **Plugins > Add New > Upload Plugin**.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Access the intelligence portal under **Amazer Visitor Intelligence** in your WordPress admin menu.
4. In compliance with WordPress privacy guidelines, click "Enable Amazer Visitor Intelligence" in the dashboard to grant explicit consent and start capturing visitor intelligence.

== Frequently Asked Questions ==

= Does this plugin track visitors automatically upon activation? =
No. In strict compliance with WordPress.org Guideline 7, storefront telemetry remains completely disabled upon activation. The site administrator must grant explicit consent by clicking "Enable Amazer Visitor Intelligence" in the Amazer Visitor Intelligence dashboard before any telemetry is dispatched to the central service.

= Does this plugin slow down my store? =
No. Visitor telemetry is dispatched asynchronously using the browser's native `navigator.sendBeacon` API. If `sendBeacon` is unsupported, it falls back to a non-blocking background fetch call that never impedes page render time or customer experience.

= How does Cross-Store Footprint & Slipped matching work? =
When enabled, anonymized IP telemetry from participating stores running the plugin is matched on the Amazer Cloud API to highlight cross-store market intent without exposing unauthorized third-party browser data or personal consumer PII.

= Where are Terms and Privacy hosted? =
Full Terms of Service and Privacy Policy are available at https://plestar.net/amazer-analytics/terms.html and https://plestar.net/amazer-analytics/privacy.html.

== Changelog ==

= 1.0.0 =
* Initial public release with real-time reverse-IP lookup, High Intent, Conversion, Slipped, Competitor Footprint, and PayPal Premium subscriptions.
