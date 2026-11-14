<?php
/**
 * Plugin Name: Amazer VI Analytics
 * Plugin URI: https://amazerinc.com/amazer-analytics.html
 * Description: Real-time B2B visitor tracking and corporate reverse-IP identification. Reveal visiting company names, corporate IPs, and pages without forms.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Amazer
 * Author URI: https://amazerinc.com/
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: amazer-visitors-intelligence-analytics
 */

// Deny direct script execution
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'AMAZER_VIA_VERSION', '1.0.0' );
define( 'AMAZER_VIA_PLUGIN_FILE', __FILE__ );
define( 'AMAZER_VIA_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'AMAZER_VIA_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Helper to retrieve Central Backend API URL.
 * Supports override via constant AMAZER_VIA_CENTRAL_API_URL in wp-config.php,
 * otherwise falls back to WordPress option or local dev default.
 */
function amazer_via_get_api_url() {
    if ( defined( 'AMAZER_VIA_CENTRAL_API_URL' ) && ! empty( AMAZER_VIA_CENTRAL_API_URL ) ) {
        return untrailingslashit( esc_url_raw( AMAZER_VIA_CENTRAL_API_URL ) );
    }

    $saved_option = get_option( 'amazer_via_central_api_url' );
    if ( ! empty( $saved_option ) ) {
        return untrailingslashit( esc_url_raw( $saved_option ) );
    }

    // Automatically use local backend on localhost, and cloud backend on live websites
    $host = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';
    if ( strpos( $host, 'localhost' ) !== false || strpos( $host, '127.0.0.1' ) !== false ) {
        return 'http://localhost:4000';
    }

    // Live Cloud Backend Default
    return 'https://apps.plestarinc.com:3011';
}

/**
 * Add direct Dashboard link on the Plugins list screen
 */
function amazer_via_add_action_links( $links ) {
    $dashboard_link = sprintf(
        '<a href="%s">%s</a>',
        esc_url( admin_url( 'admin.php?page=amazer-visitors-intelligence-analytics' ) ),
        esc_html__( 'Dashboard', 'amazer-visitors-intelligence-analytics' )
    );
    array_unshift( $links, $dashboard_link );
    return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'amazer_via_add_action_links' );

/**
 * ----------------------------------------------------------------------------
 * Storefront Telemetry Tracker (wp_enqueue_scripts)
 * ----------------------------------------------------------------------------
 * Sends lightweight, non-blocking beacon directly to central API endpoint.
 * Fully compliant with WordPress.org guidelines: no unauthenticated DB writes or REST endpoints.
 */
function amazer_via_enqueue_storefront_tracker() {
    // Strictly skip admin, cron, ajax, or REST calls
    if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
        return;
    }

    // Do not track the store owner when browsing their own site
    if ( current_user_can( 'manage_options' ) ) {
        return;
    }

    // Prior explicit user consent check per WordPress Guideline 7:
    // Storefront telemetry must NOT run automatically on activation without explicit opt-in.
    if ( 'yes' !== get_option( 'amazer_via_tracking_enabled', 'no' ) ) {
        return;
    }

    $remote_endpoint = trailingslashit( amazer_via_get_api_url() ) . 'api/v1/track';
    $store_url       = esc_url_raw( get_site_url() );

    wp_register_script( 'amazer-via-tracker', false, array(), AMAZER_VIA_VERSION, true );
    wp_enqueue_script( 'amazer-via-tracker' );

    $tracker_js = "(function() {
        'use strict';
        try {
            var storageKey = '_amazer_via_vid';
            var visitorId = null;
            try {
                visitorId = window.localStorage.getItem(storageKey);
            } catch (e) {}

            if (!visitorId) {
                visitorId = 'v_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
                try {
                    window.localStorage.setItem(storageKey, visitorId);
                } catch (e) {}
            }

            var ua = navigator.userAgent || '';
            var browser = 'Chrome';
            if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
            else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
            else if (ua.indexOf('Edg') > -1) browser = 'Edge';

            var payload = {
                visitor_id: visitorId,
                store_url: " . wp_json_encode( $store_url ) . ",
                page_title: document.title || '',
                page_url: window.location.pathname || '/',
                referrer: document.referrer || 'Direct Navigation',
                screen_res: (window.screen ? window.screen.width + 'x' + window.screen.height : 'unknown'),
                browser: browser,
                duration_seconds: 60,
                timestamp: new Date().toISOString()
            };

            var remoteUrl = " . wp_json_encode( $remote_endpoint ) . ";
            var dataStr = JSON.stringify(payload);
            var sent = false;

            if (typeof navigator.sendBeacon === 'function') {
                try {
                    var blob = new Blob([dataStr], { type: 'application/json' });
                    sent = navigator.sendBeacon(remoteUrl, blob);
                } catch (err) {
                    sent = false;
                }
            }

            if (!sent && typeof fetch === 'function') {
                fetch(remoteUrl, {
                    method: 'POST',
                    keepalive: true,
                    headers: { 'Content-Type': 'application/json' },
                    body: dataStr
                }).catch(function() {});
            }
        } catch (ex) {}
    })();";

    wp_add_inline_script( 'amazer-via-tracker', $tracker_js );
}
add_action( 'wp_enqueue_scripts', 'amazer_via_enqueue_storefront_tracker' );

/**
 * ----------------------------------------------------------------------------
 * WordPress Admin Menu & Asset Enqueuing
 * ----------------------------------------------------------------------------
 */
function amazer_via_register_admin_dashboard_menu() {
    add_menu_page(
        __( 'Amazer VI Analytics', 'amazer-visitors-intelligence-analytics' ),
        __( 'Amazer VI Analytics', 'amazer-visitors-intelligence-analytics' ),
        'manage_options',
        'amazer-visitors-intelligence-analytics',
        'amazer_via_render_dashboard_container',
        'dashicons-visibility',
        30
    );
}
add_action( 'admin_menu', 'amazer_via_register_admin_dashboard_menu' );

/**
 * Enqueue Dashboard Assets on plugin page
 */
function amazer_via_enqueue_admin_assets( $hook_suffix ) {
    if ( strpos( (string) $hook_suffix, 'amazer-visitors-intelligence-analytics' ) === false ) {
        return;
    }

    $bundle_js      = AMAZER_VIA_PLUGIN_DIR . 'dist/bundle.js';
    $bundle_css     = file_exists( AMAZER_VIA_PLUGIN_DIR . 'dist/index.css' ) ? AMAZER_VIA_PLUGIN_DIR . 'dist/index.css' : AMAZER_VIA_PLUGIN_DIR . 'dist/bundle.css';
    $bundle_css_url = file_exists( AMAZER_VIA_PLUGIN_DIR . 'dist/index.css' ) ? AMAZER_VIA_PLUGIN_URL . 'dist/index.css' : AMAZER_VIA_PLUGIN_URL . 'dist/bundle.css';

    if ( file_exists( $bundle_css ) ) {
        wp_enqueue_style(
            'amazer-via-bundle-css',
            $bundle_css_url,
            array(),
            filemtime( $bundle_css )
        );
    }

    if ( file_exists( $bundle_js ) ) {
        wp_enqueue_script(
            'amazer-via-bundle-js',
            AMAZER_VIA_PLUGIN_URL . 'dist/bundle.js',
            array( 'wp-element' ),
            filemtime( $bundle_js ),
            true
        );

        wp_localize_script( 'amazer-via-bundle-js', 'amazerViSettings', array(
            'storeUrl'        => esc_url( get_site_url() ),
            'apiUrl'          => amazer_via_get_api_url(),
            'siteName'        => get_bloginfo( 'name' ),
            'ajaxUrl'         => admin_url( 'admin-ajax.php' ),
            'nonce'           => wp_create_nonce( 'amazer_via_nonce' ),
            'trackingEnabled' => get_option( 'amazer_via_tracking_enabled', 'no' ),
        ) );
    }
}
add_action( 'admin_enqueue_scripts', 'amazer_via_enqueue_admin_assets' );

/**
 * Filter script tag to output type="module" for Vite ES module bundle
 */
function amazer_via_enable_es_module_script( $tag, $handle, $src ) {
    if ( 'amazer-via-bundle-js' === $handle && false === strpos( $tag, 'type="module"' ) ) {
        $tag = str_replace( '<script ', '<script type="module" ', $tag );
    }
    return $tag;
}
add_filter( 'script_loader_tag', 'amazer_via_enable_es_module_script', 10, 3 );

/**
 * AJAX Handler: Save Backend Endpoint
 */
function amazer_via_ajax_save_endpoint() {
    check_ajax_referer( 'amazer_via_nonce', 'nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
    }

    $api_url = isset( $_POST['api_url'] ) ? esc_url_raw( wp_unslash( $_POST['api_url'] ) ) : '';
    if ( ! empty( $api_url ) ) {
        update_option( 'amazer_via_central_api_url', $api_url );
    }

    wp_send_json_success( array(
        'message' => __( 'Endpoint configuration updated successfully.', 'amazer-visitors-intelligence-analytics' ),
        'apiUrl'  => get_option( 'amazer_via_central_api_url' ),
    ) );
}
add_action( 'wp_ajax_amazer_via_save_endpoint', 'amazer_via_ajax_save_endpoint' );

/**
 * AJAX Handler: Toggle Storefront Tracking Consent (Explicit User Opt-in)
 * Strictly complies with WordPress Guideline 7: Zero automatic telemetry without consent.
 */
function amazer_via_ajax_toggle_tracking() {
    check_ajax_referer( 'amazer_via_nonce', 'nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
    }

    $enabled = isset( $_POST['enabled'] ) && 'yes' === sanitize_text_field( wp_unslash( $_POST['enabled'] ) ) ? 'yes' : 'no';
    update_option( 'amazer_via_tracking_enabled', $enabled );

    wp_send_json_success( array(
        'tracking_enabled' => $enabled,
        'message'          => 'yes' === $enabled
            ? __( 'Storefront visitor telemetry enabled successfully.', 'amazer-visitors-intelligence-analytics' )
            : __( 'Storefront visitor telemetry paused.', 'amazer-visitors-intelligence-analytics' ),
    ) );
}
add_action( 'wp_ajax_amazer_via_toggle_tracking', 'amazer_via_ajax_toggle_tracking' );

/**
 * Render the React Dashboard Root Container
 */
function amazer_via_render_dashboard_container() {
    $bundle_js = AMAZER_VIA_PLUGIN_DIR . 'dist/bundle.js';
    ?>
    <div class="wrap amazer-via-admin-wrap" style="margin: 0; padding: 0;">
        <div id="amazer-via-dashboard-root">
            <?php if ( ! file_exists( $bundle_js ) ) : ?>
                <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 20px; max-width: 650px;">
                    <h2 style="margin-top: 0; color: #0f172a;"><?php esc_html_e( 'Amazer VI Analytics Dashboard', 'amazer-visitors-intelligence-analytics' ); ?></h2>
                    <p style="color: #64748b;"><?php esc_html_e( 'Please compile assets to view the Amazer VI Analytics dashboard:', 'amazer-visitors-intelligence-analytics' ); ?></p>
                    <pre style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 6px;">npm run build</pre>
                </div>
            <?php endif; ?>
        </div>
    </div>
    <?php
}
