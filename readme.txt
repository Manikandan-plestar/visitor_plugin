=== Amazer Analytics (Whois) ===
Contributors: amazerplugins
Tags: amazer analytics, whois analytics, visitor tracking, b2b intelligence, lead generation, analytics
Requires at least: 5.8
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Real-time B2B visitor tracking and corporate reverse-IP identification. Reveal companies visiting your store before they fill out a form.

== Description ==

**Amazer Analytics (Whois)** empowers WooCommerce and WordPress merchants to identify the businesses, corporate organizations, and leads visiting their website in real time — even if they never submit a contact form or make an inquiry.

### Key Capabilities:
* **Real-Time Reverse-IP Intelligence**: Automatically identifies corporate visitor networks, company names, industry, and corporate headquarters.
* **Corporate IP & Telemetry**: Inspect individual company activation IPs, duration on site, and specific browsed URLs.
* **Dual Intelligence View**: Toggle between *All Identified* corporate prospects and *General Visitors* with deep hit journeys.
* **Zero-Friction Activation**: No manual tracking scripts or complex tag managers required. Activating the plugin immediately enables storefront telemetry.
* **High-Intent Lead Scoring**: Automatically highlights visitors showing commercial intent (browsing pricing, product specs, or checkout pages).

### 3rd Party Service Disclosure
This plugin relies on a 3rd-party SaaS API service to perform real-time reverse-IP resolution, geolocation lookup, and company enrichment:
* **Service Provider**: Amazer Cloud API (by Plestar Inc.)
* **Service URL**: `https://apps.plestarinc.com:3011`
* **Terms of Service**: https://plestar.net/amazer-analytics/terms.html
* **Privacy Policy**: https://plestar.net/amazer-analytics/privacy.html

When visitors browse your website, anonymous storefront telemetry (page URL, referrer, screen resolution, browser type, and public IP address) is securely transmitted via non-blocking browser beacon to the Amazer Analytics API to identify company details. No personal identifiable information (PII) like names or personal passwords is collected.

== Installation ==

1. Upload the `amazer-whois-analytics` directory to the `/wp-content/plugins/` directory, or install the .zip directly via **Plugins > Add New > Upload Plugin** in WordPress.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Access the **Amazer Analytics (Whois)** dashboard from the WordPress admin menu to monitor real-time company traffic.

== Frequently Asked Questions ==

= Does this track logged-in administrators? =
No. For accuracy and data hygiene, the plugin intentionally filters out logged-in store administrators from traffic metrics.

= Does this slow down my website? =
Not at all. Storefront tracking executes asynchronously using the native browser `navigator.sendBeacon` API with zero impact on page load times.

= Can I use a custom backend API URL? =
Yes. You can override the default API endpoint by adding `define( 'SVT_CENTRAL_API_URL', 'https://your-custom-endpoint' );` to your `wp-config.php` file.

== Screenshots ==

1. Amazer Analytics (Whois) Dashboard - Real-time company reveal, corporate IP, and dwell time.
2. Visit Journey Timeline - Detailed page-by-page browsing path and high-intent indicators.
3. Dual Mode Switcher - Filter between All Identified corporate leads and General Visitors.

== Changelog ==

= 1.0.0 =
* Initial public release on WordPress.org.
* Real-time B2B reverse-IP corporate detection.
* Corporate IP display and visit journey timeline.
* Asynchronous telemetry beacon.
