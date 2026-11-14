import React from 'react';
import { createRoot } from 'react-dom/client';
import MerchantDashboard from './MerchantDashboard';
import '../shared/index.css';

function mountMerchantApp() {
  const container =
    document.getElementById('amazer-whois-dashboard-root') ||
    document.getElementById('svt-dashboard-root') ||
    document.getElementById('svt-network-dashboard-root');

  if (container && !container.__amazerWhoisMounted) {
    container.__amazerWhoisMounted = true;
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <MerchantDashboard />
      </React.StrictMode>
    );
  }
}

// Ensure mount happens whether script is deferred, asynchronous, or in footer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountMerchantApp);
} else {
  mountMerchantApp();
}
