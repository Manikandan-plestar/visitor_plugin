<?php
/**
 * Plugin Name: Store Visiting
 * Plugin URI: https://amazer.in/store-visiting
 * Description: Real-time B2B visitor tracking and corporate reverse-IP identification. Reveal company names, corporate IPs, dwell time, and visited pages without form submissions.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Amazer
 * Author URI: https://amazer.in
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: store-visiting
 */

// Deny direct script execution
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'SVT_VERSION', '1.0.0' );
define( 'SVT_PLUGIN_FILE', __FILE__ );
define( 'SVT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SVT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Helper to retrieve Central Backend API URL.
 * Supports override via constant SVT_CENTRAL_API_URL in wp-config.php,
 * otherwise falls back to WordPress option or local dev default.
 */
function svt_get_api_url() {
    if ( defined( 'SVT_CENTRAL_API_URL' ) && ! empty( SVT_CENTRAL_API_URL ) ) {
        return untrailingslashit( esc_url_raw( SVT_CENTRAL_API_URL ) );
    }
    // Local dev: 'http://localhost:4000'
    // Live Cloud Backend: 'https://apps.plestarinc.com:3011'
    return untrailingslashit( esc_url_raw( get_option( 'svt_central_api_url', 'https://apps.plestarinc.com:3011' ) ) );
}

/**
 * ----------------------------------------------------------------------------
 * 1. Zero-Friction Plugin Activation
 * ----------------------------------------------------------------------------
 * No forms, no manual API keys. Dispatches silent background registration and
 * queues an immediate redirect to the analytics dashboard.
 */
function svt_zero_friction_activation() {
    $api_base = svt_get_api_url();
    $activate_endpoint = trailingslashit( $api_base ) . 'api/v1/store/activate';

    $payload = array(
        'site_url'  => esc_url_raw( get_site_url() ),
        'site_name' => sanitize_text_field( get_bloginfo( 'name' ) ),
    );

    // Non-blocking background registration to central backend
    wp_remote_post( $activate_endpoint, array(
        'method'      => 'POST',
        'timeout'     => 5,
        'redirection' => 2,
        'headers'     => array( 'Content-Type' => 'application/json' ),
        'body'        => wp_json_encode( $payload ),
        'blocking'    => false, // Asynchronous to prevent any activation delay
    ) );

    // Queue one-time automatic redirect to plugin dashboard
    set_transient( 'svt_activation_redirect', 1, 60 );
}
register_activation_hook( __FILE__, 'svt_zero_friction_activation' );

/**
 * Perform immediate redirect to the dashboard upon activation
 */
function svt_handle_activation_redirect() {
    if ( get_transient( 'svt_activation_redirect' ) ) {
        delete_transient( 'svt_activation_redirect' );
        if ( ! isset( $_GET['activate-multi'] ) && current_user_can( 'manage_options' ) ) {
            wp_safe_redirect( admin_url( 'admin.php?page=svt-dashboard' ) );
            exit;
        }
    }
}
add_action( 'admin_init', 'svt_handle_activation_redirect' );

/**
 * ----------------------------------------------------------------------------
 * 2. Storefront Telemetry Tracker (wp_enqueue_scripts)
 * ----------------------------------------------------------------------------
 * Registered and enqueued according to WordPress Plugin Review standards.
 */
function svt_enqueue_storefront_tracker() {
    // Strictly skip admin, cron, ajax, or REST calls
    if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
        return;
    }

    // Do not track the store owner when browsing their own site!
    if ( current_user_can( 'manage_options' ) ) {
        return;
    }

    $api_base   = svt_get_api_url();
    $track_url  = trailingslashit( $api_base ) . 'api/v1/track';
    $store_url  = esc_url_raw( get_site_url() );

    // Register script handle to cleanly attach inline telemetry script via wp_enqueue_script
    wp_register_script( 'store-visiting-tracker', false, array(), SVT_VERSION, true );
    wp_enqueue_script( 'store-visiting-tracker' );

    $tracker_js = "(function() {
        'use strict';
        try {
            var storageKey = '_svt_vid';
            var visitorId = null;
            try {
                visitorId = window.localStorage.getItem(storageKey);
            } catch (e) {}

            if (!visitorId) {
                var randPart = '';
                if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
                    var bytes = new Uint8Array(8);
                    window.crypto.getRandomValues(bytes);
                    for (var i = 0; i < bytes.length; i++) {
                        randPart += ('0' + bytes[i].toString(16)).slice(-2);
                    }
                } else {
                    randPart = Math.random().toString(36).substring(2, 10);
                }
                visitorId = 'usr_' + Date.now().toString(36) + '_' + randPart;
                try {
                    window.localStorage.setItem(storageKey, visitorId);
                } catch (e) {}
            }

            var payload = {
                target_store: " . wp_json_encode( $store_url ) . ",
                visitor_id: visitorId,
                page_url: window.location.pathname || '/',
                referrer: document.referrer || '',
                screen_res: (window.screen ? window.screen.width + 'x' + window.screen.height : 'unknown'),
                timestamp: new Date().toISOString()
            };

            var endpoint = " . wp_json_encode( $track_url ) . ";
            var dataStr = JSON.stringify(payload);
            var sent = false;

            if (typeof navigator.sendBeacon === 'function') {
                try {
                    var blob = new Blob([dataStr], { type: 'application/json' });
                    sent = navigator.sendBeacon(endpoint, blob);
                } catch (err) {
                    sent = false;
                }
            }

            if (!sent && typeof fetch === 'function') {
                fetch(endpoint, {
                    method: 'POST',
                    keepalive: true,
                    headers: { 'Content-Type': 'application/json' },
                    body: dataStr
                }).catch(function() {});
            }
        } catch (ex) {}
    })();";

    wp_add_inline_script( 'store-visiting-tracker', $tracker_js );
}
add_action( 'wp_enqueue_scripts', 'svt_enqueue_storefront_tracker' );

/**
 * ----------------------------------------------------------------------------
 * 3. WordPress Admin Menu & Asset Enqueuing
 * ----------------------------------------------------------------------------
 */
function svt_register_admin_dashboard_menu() {
    add_menu_page(
        __( 'Store Visiting', 'store-visiting' ),
        __( 'Store Visiting', 'store-visiting' ),
        'manage_options',
        'svt-dashboard',
        'svt_render_dashboard_container',
        'dashicons-visibility',
        30
    );

    // Keep alias for network analytics slug
    add_submenu_page(
        null,
        __( 'Network Analytics', 'store-visiting' ),
        __( 'Network Analytics', 'store-visiting' ),
        'manage_options',
        'svt-network-analytics',
        'svt_render_dashboard_container'
    );
}
add_action( 'admin_menu', 'svt_register_admin_dashboard_menu' );

/**
 * Enqueue Dashboard Assets on plugin page
 */
function svt_enqueue_whoisvisiting_assets( $hook_suffix ) {
    $current_page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
    $is_svt_page  = in_array( $current_page, array( 'svt-dashboard', 'svt-network-analytics', 'svt-intelligence' ), true );

    if ( ! $is_svt_page &&
         strpos( (string) $hook_suffix, 'svt-dashboard' ) === false &&
         strpos( (string) $hook_suffix, 'svt-network-analytics' ) === false &&
         strpos( (string) $hook_suffix, 'svt-intelligence' ) === false ) {
        return;
    }

    $bundle_js      = SVT_PLUGIN_DIR . 'dist/bundle.js';
    $bundle_css     = file_exists( SVT_PLUGIN_DIR . 'dist/index.css' ) ? SVT_PLUGIN_DIR . 'dist/index.css' : SVT_PLUGIN_DIR . 'dist/bundle.css';
    $bundle_css_url = file_exists( SVT_PLUGIN_DIR . 'dist/index.css' ) ? SVT_PLUGIN_URL . 'dist/index.css' : SVT_PLUGIN_URL . 'dist/bundle.css';

    if ( file_exists( $bundle_css ) ) {
        wp_enqueue_style(
            'svt-bundle-css',
            $bundle_css_url,
            array(),
            filemtime( $bundle_css )
        );
    }

    if ( file_exists( $bundle_js ) ) {
        wp_enqueue_script(
            'svt-bundle-js',
            SVT_PLUGIN_URL . 'dist/bundle.js',
            array(),
            filemtime( $bundle_js ),
            true
        );

        wp_localize_script( 'svt-bundle-js', 'svtSettings', array(
            'storeUrl' => esc_url( get_site_url() ),
            'apiUrl'   => svt_get_api_url(),
            'siteName' => get_bloginfo( 'name' ),
            'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'svt_whois_nonce' ),
        ) );
    }
}
add_action( 'admin_enqueue_scripts', 'svt_enqueue_whoisvisiting_assets' );

/**
 * Filter script tag to output type="module" for Vite ES module bundle
 */
function svt_enable_es_module_script( $tag, $handle, $src ) {
    if ( 'svt-bundle-js' === $handle && false === strpos( $tag, 'type="module"' ) ) {
        $tag = str_replace( '<script ', '<script type="module" ', $tag );
    }
    return $tag;
}
add_filter( 'script_loader_tag', 'svt_enable_es_module_script', 10, 3 );

/**
 * AJAX Handler: Save Backend Endpoint
 */
function svt_ajax_save_endpoint() {
    check_ajax_referer( 'svt_whois_nonce', 'nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
    }

    $api_url = isset( $_POST['api_url'] ) ? esc_url_raw( wp_unslash( $_POST['api_url'] ) ) : '';
    if ( ! empty( $api_url ) ) {
        update_option( 'svt_central_api_url', $api_url );
    }

    wp_send_json_success( array(
        'message' => __( 'Endpoint configuration updated successfully.', 'store-visiting' ),
        'apiUrl'  => get_option( 'svt_central_api_url' ),
    ) );
}
add_action( 'wp_ajax_svt_save_endpoint', 'svt_ajax_save_endpoint' );

/**
 * Render the React Dashboard Root Container
 */
function svt_render_dashboard_container() {
    $bundle_js = SVT_PLUGIN_DIR . 'dist/bundle.js';
    ?>
    <div class="wrap svt-admin-wrap" style="margin: 0; padding: 0;">
        <div id="svt-dashboard-root">
            <?php if ( ! file_exists( $bundle_js ) ) : ?>
                <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 20px; max-width: 650px;">
                    <h2 style="margin-top: 0; color: #0f172a;"><?php esc_html_e( 'Store Visiting Dashboard', 'store-visiting' ); ?></h2>
                    <p style="color: #64748b;"><?php esc_html_e( 'Please compile assets to view the Store Visiting dashboard:', 'store-visiting' ); ?></p>
                    <pre style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 6px;">npm run build</pre>
                </div>
            <?php endif; ?>
        </div>
    </div>
    <?php
}
