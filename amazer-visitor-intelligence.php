<?php
/**
 * Plugin Name: Amazer Visitor Intelligence
 * Plugin URI: https://amazerinc.com/amazer-analytics.html
 * Description: Real-time B2B visitor tracking and corporate reverse-IP identification. Reveal visiting company names, corporate IPs, and pages without forms.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Amazer
 * Author URI: https://amazerinc.com/
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: amazer-visitor-intelligence
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

    if ( defined( 'SVT_CENTRAL_API_URL' ) && ! empty( SVT_CENTRAL_API_URL ) ) {
        return untrailingslashit( esc_url_raw( SVT_CENTRAL_API_URL ) );
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
        esc_url( admin_url( 'admin.php?page=amazer-visitor-intelligence' ) ),
        esc_html__( 'Dashboard', 'amazer-visitor-intelligence' )
    );
    array_unshift( $links, $dashboard_link );
    return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'amazer_via_add_action_links' );

/**
 * ----------------------------------------------------------------------------
 * 5-Minute Batch Sync Cron & Local Queue (Reduces API Requests & Server Cost)
 * ----------------------------------------------------------------------------
 * Storefront visits are logged locally in WordPress with zero external network latency.
 * Every 5 minutes, WordPress flushes queued visits in ONE single consolidated batch to the DB.
 */
function amazer_via_add_five_minute_cron_interval( $schedules ) {
    $schedules['five_minutes'] = array(
        'interval' => 300, // 300 seconds = 5 minutes
        'display'  => __( 'Every 5 Minutes', 'amazer-visitor-intelligence' ),
    );
    return $schedules;
}
add_filter( 'cron_schedules', 'amazer_via_add_five_minute_cron_interval' );

function amazer_via_schedule_batch_sync() {
    if ( ! wp_next_scheduled( 'amazer_via_five_minute_batch_sync' ) ) {
        wp_schedule_event( time(), 'five_minutes', 'amazer_via_five_minute_batch_sync' );
    }
}
add_action( 'init', 'amazer_via_schedule_batch_sync' );

/**
 * Register local REST route for lightweight storefront telemetry logging.
 * Logs hits locally without firing an external cloud API call on every page view.
 */
function amazer_via_register_local_log_route() {
    register_rest_route( 'amazer-via/v1', '/log', array(
        'methods'             => 'POST',
        'callback'            => 'amazer_via_handle_local_log',
        'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'amazer_via_register_local_log_route' );

function amazer_via_handle_local_log( WP_REST_Request $request ) {
    if ( 'yes' !== get_option( 'amazer_via_tracking_enabled', 'no' ) ) {
        return new WP_REST_Response( array( 'status' => 'skipped_consent' ), 200 );
    }

    $params = $request->get_json_params();
    if ( empty( $params ) ) {
        $params = $request->get_body_params();
    }

    $visitor_ip = '';
    if ( ! empty( $_SERVER['HTTP_CF_CONNECTING_IP'] ) ) {
        $visitor_ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_CF_CONNECTING_IP'] ) );
    } elseif ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
        $parts = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) );
        $visitor_ip = trim( $parts[0] );
    } elseif ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
        $visitor_ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
    }

    $hit = array(
        'visitor_ip'       => $visitor_ip,
        'visitor_id'       => sanitize_text_field( $params['visitor_id'] ?? '' ),
        'page_url'         => esc_url_raw( $params['page_url'] ?? '/' ),
        'page_title'       => sanitize_text_field( $params['page_title'] ?? '' ),
        'referrer'         => sanitize_text_field( $params['referrer'] ?? 'Direct Navigation' ),
        'screen_res'       => sanitize_text_field( $params['screen_res'] ?? '1920x1080' ),
        'browser'          => sanitize_text_field( $params['browser'] ?? 'Chrome' ),
        'duration_seconds' => intval( $params['duration_seconds'] ?? 60 ),
        'visited_at'       => gmdate( 'c' ),
    );

    // Buffer to WordPress options with autoload disabled (no direct file operations)
    $pending_hits = get_option( 'amazer_via_pending_hits', array() );
    if ( ! is_array( $pending_hits ) ) {
        $pending_hits = array();
    }

    // Keep buffer bounded to latest 500 hits
    if ( count( $pending_hits ) >= 500 ) {
        array_shift( $pending_hits );
    }
    $pending_hits[] = $hit;

    update_option( 'amazer_via_pending_hits', $pending_hits, false );

    return new WP_REST_Response( array( 'success' => true, 'queued' => true ), 200 );
}

/**
 * Flush all pending local hits in ONE single batch API request to the central DB
 */
function amazer_via_flush_pending_hits() {
    $hits = get_option( 'amazer_via_pending_hits', array() );
    if ( empty( $hits ) || ! is_array( $hits ) ) {
        return 0;
    }

    // Clear queue atomically before sending
    delete_option( 'amazer_via_pending_hits' );

    $batch_endpoint = trailingslashit( amazer_via_get_api_url() ) . 'api/v1/track/batch';
    $payload = array(
        'target_store' => esc_url_raw( get_site_url() ),
        'hits'         => $hits,
    );

    $response = wp_remote_post( $batch_endpoint, array(
        'method'      => 'POST',
        'timeout'     => 15,
        'redirection' => 2,
        'headers'     => array( 'Content-Type' => 'application/json' ),
        'body'        => wp_json_encode( $payload ),
    ) );

    if ( ! is_wp_error( $response ) && wp_remote_retrieve_response_code( $response ) === 200 ) {
        return count( $hits );
    } else {
        // Network or server temporarily unreachable; restore unsynced hits back into pending queue
        $current = get_option( 'amazer_via_pending_hits', array() );
        if ( is_array( $current ) ) {
            $merged = array_merge( $hits, $current );
            update_option( 'amazer_via_pending_hits', array_slice( $merged, -500 ), false );
        } else {
            update_option( 'amazer_via_pending_hits', $hits, false );
        }
        return 0;
    }
}
add_action( 'amazer_via_five_minute_batch_sync', 'amazer_via_flush_pending_hits' );

/**
 * On-demand flush AJAX handler for instant dashboard refresh
 */
function amazer_via_ajax_flush_batch() {
    check_ajax_referer( 'amazer_via_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
    }
    $count = amazer_via_flush_pending_hits();
    wp_send_json_success( array( 'synced_count' => (int) $count ) );
}
add_action( 'wp_ajax_amazer_via_flush_batch', 'amazer_via_ajax_flush_batch' );

/**
 * ----------------------------------------------------------------------------
 * Storefront Telemetry Tracker (wp_enqueue_scripts)
 * ----------------------------------------------------------------------------
 * Buffers telemetry locally in WordPress; flushes to central DB every 5 minutes.
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

    // Prior explicit user consent check as per WordPress Guideline 7:
    // Storefront telemetry must NOT run automatically on activation without explicit opt-in.
    if ( 'yes' !== get_option( 'amazer_via_tracking_enabled', 'no' ) ) {
        return;
    }

    $local_endpoint  = esc_url_raw( rest_url( 'amazer-via/v1/log' ) );
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

            var startTime = Date.now();
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

            var localUrl = " . wp_json_encode( $local_endpoint ) . ";
            var remoteUrl = " . wp_json_encode( $remote_endpoint ) . ";
            var dataStr = JSON.stringify(payload);
            var sent = false;

            if (typeof navigator.sendBeacon === 'function') {
                try {
                    var blob = new Blob([dataStr], { type: 'application/json' });
                    sent = navigator.sendBeacon(localUrl, blob);
                } catch (err) {
                    sent = false;
                }
            }

            if (!sent && typeof fetch === 'function') {
                fetch(localUrl, {
                    method: 'POST',
                    keepalive: true,
                    headers: { 'Content-Type': 'application/json' },
                    body: dataStr
                }).catch(function() {
                    if (typeof navigator.sendBeacon === 'function') {
                        navigator.sendBeacon(remoteUrl, new Blob([dataStr], { type: 'application/json' }));
                    }
                });
            }

            var sendDwellBeacon = function() {
                var elapsed = Math.max(1, Math.round((Date.now() - startTime) / 1000));
                if (elapsed <= 1) return;
                var dwellPayload = JSON.stringify({
                    visitor_id: visitorId,
                    store_url: " . wp_json_encode( $store_url ) . ",
                    page_url: window.location.pathname || '/',
                    duration_seconds: elapsed,
                    timestamp: new Date().toISOString()
                });
                if (typeof navigator.sendBeacon === 'function') {
                    try {
                        navigator.sendBeacon(localUrl, new Blob([dwellPayload], { type: 'application/json' }));
                    } catch (e) {}
                }
            };
            window.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'hidden') sendDwellBeacon();
            });
            window.addEventListener('beforeunload', sendDwellBeacon);
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
        __( 'Amazer Visitor Intelligence', 'amazer-visitor-intelligence' ),
        __( 'Amazer Visitor Intelligence', 'amazer-visitor-intelligence' ),
        'manage_options',
        'amazer-visitor-intelligence',
        'amazer_via_render_dashboard_container',
        'dashicons-visibility',
        30
    );

    // Primary 5 Submenus: Dashboard, Traffic, Firmography, High_Intent, Conversion
    $submenus = array(
        'dashboard'    => __( 'Dashboard', 'amazer-visitor-intelligence' ),
        'traffic'      => __( 'Traffic', 'amazer-visitor-intelligence' ),
        'firmographic' => __( 'Firmography', 'amazer-visitor-intelligence' ),
        'high_intent'  => __( 'High_Intent', 'amazer-visitor-intelligence' ),
        'conversion'   => __( 'Conversion', 'amazer-visitor-intelligence' ),
    );

    foreach ( $submenus as $tab_slug => $tab_title ) {
        $page_slug = ( 'dashboard' === $tab_slug ) ? 'amazer-visitor-intelligence' : 'amazer-visitor-intelligence-' . $tab_slug;
        add_submenu_page(
            'amazer-visitor-intelligence',
            $tab_title . ' &lsaquo; ' . __( 'Amazer Visitor Intelligence', 'amazer-visitor-intelligence' ),
            $tab_title,
            'manage_options',
            $page_slug,
            'amazer_via_render_dashboard_container'
        );
    }
}
add_action( 'admin_menu', 'amazer_via_register_admin_dashboard_menu' );

/**
 * Enqueue Dashboard Assets on plugin page
 */
function amazer_via_enqueue_admin_assets( $hook_suffix ) {
    if ( strpos( (string) $hook_suffix, 'amazer-visitor-intelligence' ) === false ) {
        return;
    }

    $initial_tab = 'dashboard';
    if ( strpos( (string) $hook_suffix, 'traffic' ) !== false ) {
        $initial_tab = 'traffic';
    } elseif ( strpos( (string) $hook_suffix, 'firmographic' ) !== false ) {
        $initial_tab = 'firmographic';
    } elseif ( strpos( (string) $hook_suffix, 'high_intent' ) !== false || strpos( (string) $hook_suffix, 'opportunity' ) !== false ) {
        $initial_tab = 'high_intent';
    } elseif ( strpos( (string) $hook_suffix, 'conversion' ) !== false ) {
        $initial_tab = 'conversion';
    } elseif ( strpos( (string) $hook_suffix, 'demographic' ) !== false ) {
        $initial_tab = 'demographic';
    } elseif ( strpos( (string) $hook_suffix, 'slipped' ) !== false ) {
        $initial_tab = 'slipped';
    } elseif ( strpos( (string) $hook_suffix, 'settings' ) !== false ) {
        $initial_tab = 'settings';
    }

    $bundle_js      = AMAZER_VIA_PLUGIN_DIR . 'dist/bundle.js';
    $bundle_css     = file_exists( AMAZER_VIA_PLUGIN_DIR . 'dist/index.css' ) ? AMAZER_VIA_PLUGIN_DIR . 'dist/index.css' : AMAZER_VIA_PLUGIN_DIR . 'dist/bundle.css';
    $bundle_css_url = file_exists( AMAZER_VIA_PLUGIN_DIR . 'dist/index.css' ) ? AMAZER_VIA_PLUGIN_URL . 'dist/index.css' : AMAZER_VIA_PLUGIN_URL . 'dist/bundle.css';
    $bundle_js_ver  = file_exists( $bundle_js ) ? (string) filemtime( $bundle_js ) : AMAZER_VIA_VERSION;
    $bundle_css_ver = file_exists( $bundle_css ) ? (string) filemtime( $bundle_css ) : AMAZER_VIA_VERSION;

    if ( file_exists( $bundle_css ) ) {
        wp_enqueue_style(
            'amazer-via-bundle-css',
            $bundle_css_url,
            array(),
            $bundle_css_ver
        );
    }

    if ( file_exists( $bundle_js ) ) {
        wp_enqueue_script(
            'amazer-via-bundle-js',
            AMAZER_VIA_PLUGIN_URL . 'dist/bundle.js',
            array( 'wp-element' ),
            $bundle_js_ver,
            true
        );

        wp_localize_script( 'amazer-via-bundle-js', 'amazerViSettings', array(
            'initialTab'          => $initial_tab,
            'storeUrl'            => esc_url( get_site_url() ),
            'apiUrl'              => amazer_via_get_api_url(),
            'siteName'            => get_bloginfo( 'name' ),
            'ajaxUrl'             => admin_url( 'admin-ajax.php' ),
            'nonce'               => wp_create_nonce( 'amazer_via_nonce' ),
            'trackingEnabled'     => get_option( 'amazer_via_tracking_enabled', 'no' ),
            'opportunityUrl'      => get_option( 'amazer_via_opportunity_url', '/pricing' ),
            'highIntentUrls'      => get_option( 'amazer_via_high_intent_urls', '/pricing, /product/industrial-turbine-sensor, /checkout, /four-plans, /contact-sales' ),
            'opportunityDuration' => (int) get_option( 'amazer_via_opportunity_duration', 60 ),
            'conversionUrls'      => get_option( 'amazer_via_conversion_urls', '/thank-you, /order-received, /order-confirmed, /checkout/success, /checkout' ),
            'slippedEnabled'      => get_option( 'amazer_via_slipped_enabled', 'yes' ),
            'slippedWindow'       => get_option( 'amazer_via_slipped_window', '48h' ),
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
        'message' => __( 'Endpoint configuration updated successfully.', 'amazer-visitor-intelligence' ),
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
            ? __( 'Storefront visitor telemetry enabled successfully.', 'amazer-visitor-intelligence' )
            : __( 'Storefront visitor telemetry paused.', 'amazer-visitor-intelligence' ),
    ) );
}
add_action( 'wp_ajax_amazer_via_toggle_tracking', 'amazer_via_ajax_toggle_tracking' );

/**
 * AJAX Handler: Save Opportunity Tracking Settings
 */
function amazer_via_ajax_save_opportunity_settings() {
    check_ajax_referer( 'amazer_via_nonce', 'nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
    }

    $url      = isset( $_POST['opportunity_url'] ) ? sanitize_text_field( wp_unslash( $_POST['opportunity_url'] ) ) : '/pricing';
    $duration = isset( $_POST['opportunity_duration'] ) ? absint( wp_unslash( $_POST['opportunity_duration'] ) ) : 60;

    update_option( 'amazer_via_opportunity_url', $url );
    update_option( 'amazer_via_opportunity_duration', $duration );

    wp_send_json_success( array(
        'message'              => __( 'Opportunity tracking settings saved successfully.', 'amazer-visitor-intelligence' ),
        'opportunity_url'      => $url,
        'opportunity_duration' => $duration,
    ) );
}
add_action( 'wp_ajax_amazer_via_save_opportunity_settings', 'amazer_via_ajax_save_opportunity_settings' );

/**
 * AJAX Handler: Save Slipped Tracking Settings
 */
function amazer_via_ajax_save_slipped_settings() {
    check_ajax_referer( 'amazer_via_nonce', 'nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( array( 'message' => 'Unauthorized' ), 403 );
    }

    $enabled = isset( $_POST['slipped_enabled'] ) && 'yes' === sanitize_text_field( wp_unslash( $_POST['slipped_enabled'] ) ) ? 'yes' : 'no';
    $window  = isset( $_POST['slipped_window'] ) ? sanitize_text_field( wp_unslash( $_POST['slipped_window'] ) ) : '48h';

    update_option( 'amazer_via_slipped_enabled', $enabled );
    update_option( 'amazer_via_slipped_window', $window );

    wp_send_json_success( array(
        'message'         => __( 'Slipped tracking preferences updated successfully.', 'amazer-visitor-intelligence' ),
        'slipped_enabled' => $enabled,
        'slipped_window'  => $window,
    ) );
}
add_action( 'wp_ajax_amazer_via_save_slipped_settings', 'amazer_via_ajax_save_slipped_settings' );

/**
 * Render the React Dashboard Root Container
 */
function amazer_via_render_dashboard_container() {
    // Flush any pending 5-minute queue hits immediately so the merchant sees up-to-the-minute data
    amazer_via_flush_pending_hits();
    $bundle_js = AMAZER_VIA_PLUGIN_DIR . 'dist/bundle.js';
    ?>
    <div class="wrap amazer-via-admin-wrap" style="margin: 0; padding: 0;">
        <div id="amazer-via-dashboard-root">
            <?php if ( ! file_exists( $bundle_js ) ) : ?>
                <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 20px; max-width: 650px;">
                    <h2 style="margin-top: 0; color: #0f172a;"><?php esc_html_e( 'Amazer Visitor Intelligence Dashboard', 'amazer-visitor-intelligence' ); ?></h2>
                    <p style="color: #64748b;"><?php esc_html_e( 'Please compile assets to view the Amazer Visitor Intelligence dashboard:', 'amazer-visitor-intelligence' ); ?></p>
                    <pre style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 6px;">npm run build</pre>
                </div>
            <?php endif; ?>
        </div>
    </div>
    <?php
}
