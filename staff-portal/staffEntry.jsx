import React from 'react';
import { createRoot } from 'react-dom/client';
import StaffDashboard from './StaffDashboard';
import '../shared/index.css';

function mountStaffApp() {
  const container = document.getElementById('staff-root');
  if (container && !container.__svtStaffMounted) {
    container.__svtStaffMounted = true;
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <StaffDashboard />
      </React.StrictMode>
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountStaffApp);
} else {
  mountStaffApp();
}
