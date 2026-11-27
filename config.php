<?php
/**
 * Amazer Visitor Intelligence - Production Environment Configuration
 * To test locally later, switch AMAZER_ENVIRONMENT to 'local' and uncomment AMAZER_LOCAL_API_URL.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! defined( 'AMAZER_ENVIRONMENT' ) ) {
    define( 'AMAZER_ENVIRONMENT', 'live' );
}

// Local Development URL (Commented out for production)
// if ( ! defined( 'AMAZER_LOCAL_API_URL' ) ) {
//     define( 'AMAZER_LOCAL_API_URL', 'http://localhost:4000' );
// }

if ( ! defined( 'AMAZER_LIVE_API_URL' ) ) {
    define( 'AMAZER_LIVE_API_URL', 'https://apps.plestarinc.com:3011' );
}
