<?php
/**
 * Amazer Visitor Intelligence - Master Environment Configuration
 *
 * Change the active environment in ONE place below:
 *   - 'local' : Uses http://localhost:4000 (Local Node/MySQL development)
 *   - 'live'  : Uses https://apps.plestarinc.com:3011 (Live Production Cloud)
 *
 * This single setting automatically applies to:
 *   1. All WordPress background telemetry payloads
 *   2. The entire React Admin Dashboard (Traffic, High Intent, Conversion, Settings)
 *   3. All REST API endpoints and data synchronization
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ============================================================================
// 🎯 MASTER SWITCH: Set to 'local' or 'live'
// ============================================================================
if ( ! defined( 'AMAZER_ENVIRONMENT' ) ) {
    define( 'AMAZER_ENVIRONMENT', 'local' ); // <-- CHANGE HERE: 'local' OR 'live'
}

// Defined URLs for each environment
if ( ! defined( 'AMAZER_LOCAL_API_URL' ) ) {
    define( 'AMAZER_LOCAL_API_URL', 'http://localhost:4000' );
}

if ( ! defined( 'AMAZER_LIVE_API_URL' ) ) {
    define( 'AMAZER_LIVE_API_URL', 'https://apps.plestarinc.com:3011' );
}
