<?php
/**
 * Plugin Name: Amazer Analytics(WHOIS)
 * Plugin URI: https://amazerinc.com/amazer-analytics.html
 * Description: Real-time B2B visitor tracking and corporate reverse-IP identification. Reveal visiting company names, corporate IPs, and pages without forms.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Amazer
 * Author URI: https://amazerinc.com/
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: amazer-whois-analytics
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

    $saved_option = get_option( 'svt_central_api_url' );
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
 * ----------------------------------------------------------------------------
 * 1. Zero-Friction Plugin Activation
 * ----------------------------------------------------------------------------
 * Dispatches silent non-blocking background registration to central backend.
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
}
register_activation_hook( __FILE__, 'svt_zero_friction_activation' );

/**
 * Add direct Dashboard link on the Plugins list screen
 */
function svt_add_action_links( $links ) {
    $dashboard_link = sprintf(
        '<a href="%s">%s</a>',
        esc_url( admin_url( 'admin.php?page=svt-dashboard' ) ),
        esc_html__( 'Dashboard', 'amazer-whois-analytics' )
    );
    array_unshift( $links, $dashboard_link );
    return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'svt_add_action_links' );

/**
 * ----------------------------------------------------------------------------
 * 2. 5-Minute Batch Sync & Local Log Queue Infrastructure
 * ----------------------------------------------------------------------------
 */

/**
 * Register 5-Minute Cron Interval
 */
function svt_add_five_minute_cron_interval( $schedules ) {
    $schedules['every_five_minutes'] = array(
        'interval' => 300, // 300 seconds = 5 minutes
        'display'  => esc_html__( 'Every 5 Minutes', 'amazer-whois-analytics' ),
    );
    return $schedules;
}
add_filter( 'cron_schedules', 'svt_add_five_minute_cron_interval' );

/**
 * Schedule 5-minute background batch sync
 */
function svt_init_batch_cron() {
    if ( ! wp_next_scheduled( 'svt_five_minute_batch_sync' ) ) {
        wp_schedule_event( time() + 300, 'every_five_minutes', 'svt_five_minute_batch_sync' );
    }
}
add_action( 'init', 'svt_init_batch_cron' );

/**
 * Clear cron on plugin deactivation
 */
function svt_deactivate_batch_cron() {
    wp_clear_scheduled_hook( 'svt_five_minute_batch_sync' );
}
register_deactivation_hook( __FILE__, 'svt_deactivate_batch_cron' );

/**
 * Helper: Retrieve local logs directory path
 */
function svt_get_log_dir() {
    $upload_dir = wp_upload_dir();
    $log_dir = trailingslashit( $upload_dir['basedir'] ) . 'svt-logs';

    if ( ! file_exists( $log_dir ) ) {
        wp_mkdir_p( $log_dir );
        @file_put_contents( $log_dir . '/index.php', '<?php // Silence is golden.' );
        @file_put_contents( $log_dir . '/.htaccess', 'Deny from all' );
    }

    return $log_dir;
}

/**
 * Helper: Retrieve local pending hits log file path
 */
function svt_get_pending_hits_file() {
    return trailingslashit( svt_get_log_dir() ) . 'pending-hits.log';
}

/**
 * Register Local REST API Endpoint for Instant Local Hit Logging
 */
function svt_register_local_logging_route() {
    register_rest_route( 'svt/v1', '/log', array(
        'methods'             => 'POST',
        'callback'            => 'svt_handle_local_hit_log',
        'permission_callback' => '__return_true', // Public endpoint for storefront visitor telemetry
    ) );
}
add_action( 'rest_api_init', 'svt_register_local_logging_route' );

/**
 * Handle incoming storefront hit: saves to local log with zero external network calls
 */
function svt_handle_local_hit_log( $request ) {
    $client_ip = '';
    if ( ! empty( $_SERVER['HTTP_CF_CONNECTING_IP'] ) ) {
        $client_ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_CF_CONNECTING_IP'] ) );
    } elseif ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
        $parts = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) );
        $client_ip = trim( $parts[0] );
    } elseif ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
        $client_ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
    }

    $params = $request->get_json_params();
    if ( empty( $params ) ) {
        $params = $request->get_params();
    }

    $hit_record = array(
        'visitor_id'       => isset( $params['visitor_id'] ) ? sanitize_text_field( $params['visitor_id'] ) : 'v_anon',
        'visitor_ip'       => $client_ip ?: '127.0.0.1',
        'page_url'         => isset( $params['page_url'] ) ? sanitize_text_field( $params['page_url'] ) : '/',
        'referrer'         => isset( $params['referrer'] ) ? sanitize_text_field( $params['referrer'] ) : 'Direct Navigation',
        'screen_res'       => isset( $params['screen_res'] ) ? sanitize_text_field( $params['screen_res'] ) : '1920x1080',
        'browser'          => isset( $params['browser'] ) ? sanitize_text_field( $params['browser'] ) : 'Chrome',
        'duration_seconds' => isset( $params['duration_seconds'] ) ? intval( $params['duration_seconds'] ) : 60,
        'visited_at'       => isset( $params['timestamp'] ) ? sanitize_text_field( $params['timestamp'] ) : gmdate( 'Y-m-d\TH:i:s\Z' ),
    );

    $log_file = svt_get_pending_hits_file();
    @file_put_contents( $log_file, wp_json_encode( $hit_record ) . "\n", FILE_APPEND | LOCK_EX );

    return new WP_REST_Response( array( 'logged' => true ), 200 );
}

/**
 * Core Flush Routine: Reads pending local log file and pushes bulk batch to central server
 */
function svt_flush_pending_hits() {
    $log_file = svt_get_pending_hits_file();
    if ( ! file_exists( $log_file ) || filesize( $log_file ) === 0 ) {
        return 0;
    }

    // Atomic rename so new incoming hits continue logging to a fresh file smoothly
    $sync_file = trailingslashit( svt_get_log_dir() ) . 'pending-hits-syncing-' . time() . '.log';
    if ( ! @rename( $log_file, $sync_file ) ) {
        return 0;
    }

    $content = @file_get_contents( $sync_file );
    if ( empty( $content ) ) {
        @unlink( $sync_file );
        return 0;
    }

    $lines = explode( "\n", trim( $content ) );
    $hits = array();
    foreach ( $lines as $line ) {
        $line = trim( $line );
        if ( empty( $line ) ) continue;
        $decoded = json_decode( $line, true );
        if ( is_array( $decoded ) ) {
            $hits[] = $decoded;
        }
    }

    if ( empty( $hits ) ) {
        @unlink( $sync_file );
        return 0;
    }

    $api_base = svt_get_api_url();
    $batch_endpoint = trailingslashit( $api_base ) . 'api/v1/track/batch';

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
        @unlink( $sync_file );
        return count( $hits );
    } else {
        // Network or server temporarily down; restore unsynced hits back into pending log
        @file_put_contents( $log_file, $content, FILE_APPEND | LOCK_EX );
        @unlink( $sync_file );
        return 0;
    }
}
add_action( 'svt_five_minute_batch_sync', 'svt_flush_pending_hits' );

/**
 * On-demand flush AJAX handler for instant dashboard refresh
 */
function svt_ajax_flush_batch() {
    check_ajax_referer( 'svt_whois_nonce', 'nonce' );
    $count = svt_flush_pending_hits();
    wp_send_json_success( array( 'synced_count' => (int) $count ) );
}
add_action( 'wp_ajax_svt_flush_batch', 'svt_ajax_flush_batch' );

/**
 * Storefront Telemetry Tracker (wp_enqueue_scripts)
 * Sends beacon locally to WordPress REST endpoint with zero external network latency
 */
function svt_enqueue_storefront_tracker() {
    // Strictly skip admin, cron, ajax, or REST calls
    if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
        return;
    }

    // Do not track the store owner when browsing their own site
    if ( current_user_can( 'manage_options' ) ) {
        return;
    }

    $local_endpoint  = esc_url_raw( rest_url( 'svt/v1/log' ) );
    $remote_endpoint = trailingslashit( svt_get_api_url() ) . 'api/v1/track';
    $store_url       = esc_url_raw( get_site_url() );

    wp_register_script( 'amazer-whois-tracker', false, array(), SVT_VERSION, true );
    wp_enqueue_script( 'amazer-whois-tracker' );

    $tracker_js = "(function() {
        'use strict';
        try {
            var storageKey = '_svt_vid';
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
                    // Fallback to direct cloud endpoint if local REST is blocked
                    if (typeof navigator.sendBeacon === 'function') {
                        navigator.sendBeacon(remoteUrl, new Blob([dataStr], { type: 'application/json' }));
                    }
                });
            }
        } catch (ex) {}
    })();";

    wp_add_inline_script( 'amazer-whois-tracker', $tracker_js );
}
add_action( 'wp_enqueue_scripts', 'svt_enqueue_storefront_tracker' );

/**
 * ----------------------------------------------------------------------------
 * 3. WordPress Admin Menu & Asset Enqueuing
 * ----------------------------------------------------------------------------
 */
function svt_register_admin_dashboard_menu() {
    add_menu_page(
        __( 'Amazer Analytics(WHOIS)', 'amazer-whois-analytics' ),
        __( 'Amazer Analytics(WHOIS)', 'amazer-whois-analytics' ),
        'manage_options',
        'svt-dashboard',
        'svt_render_dashboard_container',
        'dashicons-visibility',
        30
    );

    // Keep alias for network analytics slug
    add_submenu_page(
        null,
        __( 'Network Analytics', 'amazer-whois-analytics' ),
        __( 'Network Analytics', 'amazer-whois-analytics' ),
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
    if ( strpos( (string) $hook_suffix, 'svt-dashboard' ) === false &&
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
            array( 'wp-element' ),
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
        'message' => __( 'Endpoint configuration updated successfully.', 'amazer-whois-analytics' ),
        'apiUrl'  => get_option( 'svt_central_api_url' ),
    ) );
}
add_action( 'wp_ajax_svt_save_endpoint', 'svt_ajax_save_endpoint' );

/**
 * Render the React Dashboard Root Container
 */
function svt_render_dashboard_container() {
    // Flush any queued local hits immediately so merchant sees latest data
    svt_flush_pending_hits();
    $bundle_js = SVT_PLUGIN_DIR . 'dist/bundle.js';
    ?>
    <div class="wrap svt-admin-wrap" style="margin: 0; padding: 0;">
        <div id="svt-dashboard-root">
            <?php if ( ! file_exists( $bundle_js ) ) : ?>
                <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 20px; max-width: 650px;">
                    <h2 style="margin-top: 0; color: #0f172a;"><?php esc_html_e( 'Amazer Analytics(WHOIS) Dashboard', 'amazer-whois-analytics' ); ?></h2>
                    <p style="color: #64748b;"><?php esc_html_e( 'Please compile assets to view the Amazer Analytics(WHOIS) dashboard:', 'amazer-whois-analytics' ); ?></p>
                    <pre style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 6px;">npm run build</pre>
                </div>
            <?php endif; ?>
        </div>
    </div>
    <?php
}
