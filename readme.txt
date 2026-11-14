=== Amazer VI Analytics ===
Contributors: amazerinc, amazerplugins
Tags: amazer analytics, visitor intelligence, whois analytics, visitor tracking, b2b intelligence
Requires at least: 5.8
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Real-time B2B visitor tracking and corporate reverse-IP identification. Reveal visiting company names, corporate IPs, and pages without forms.

== Description ==

**Amazer VI Analytics** empowers WooCommerce and WordPress merchants to identify the businesses, corporate organizations, and leads visiting their website in real time — even if they never submit a contact form or make an inquiry.

### Key Capabilities:
* **Real-Time Reverse-IP Intelligence**: Automatically identifies corporate visitor networks, company names, industry, and corporate headquarters.
* **Corporate IP & Telemetry**: Inspect individual company activation IPs, duration on site, and specific browsed URLs.
* **Dual Intelligence View**: Toggle between *All Identified* corporate prospects and *General Visitors* with deep hit journeys.
* **Zero-Friction Activation**: No manual tracking scripts or complex tag managers required. Activating the plugin immediately enables storefront telemetry.
* **High-Intent Lead Scoring**: Automatically highlights visitors showing commercial intent (browsing pricing, product specs, or checkout pages).

### 3rd Party Service Disclosure
This plugin relies on a 3rd-party SaaS API service to perform real-time reverse-IP resolution, geolocation lookup, and company enrichment:
* **Service Provider**: Amazer Cloud API (by Plestar Inc.)
* **Service URL**: https://apps.plestarinc.com:3011
* **Terms of Service**: https://plestar.net/amazer-analytics/terms.html
* **Privacy Policy**: https://plestar.net/amazer-analytics/privacy.html

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

1. Upload the plugin folder `amazer-visitors-intelligence-analytics` to `/wp-content/plugins/` directory, or upload the `.zip` archive via **Plugins > Add New > Upload Plugin**.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Once activated, storefront visitor telemetry begins capturing automatically.
4. Access the full intelligence portal under **Amazer VI Analytics** in your WordPress admin menu.

== Frequently Asked Questions ==

= Does this plugin slow down my store? =
No. Visitor telemetry is dispatched asynchronously using the browser's native `navigator.sendBeacon` API. If `sendBeacon` is unsupported, it falls back to a non-blocking background fetch call that never impedes page render time or customer experience.

= How does reverse-IP intelligence work? =
When a business visitor lands on your store, their corporate IP address is cross-referenced with public WHOIS registries, corporate ASN subnets, and the central B2B knowledge network to resolve company names, headquarters, and industry vertical.

= Where are Terms and Privacy hosted? =
Full Terms of Service and Privacy Policy are available at https://plestar.net/amazer-analytics/terms.html and https://plestar.net/amazer-analytics/privacy.html.

== Changelog ==

= 1.0.0 =
* Initial public release with real-time reverse-IP lookup, dual intelligence feed, and zero-friction activation.
