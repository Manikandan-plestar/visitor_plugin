/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client-merchant/**/*.{js,jsx,ts,tsx}",
    "./staff-portal/**/*.{js,jsx,ts,tsx}",
    "./shared/**/*.{js,jsx,ts,tsx,css}",
  ],
  important: ':is(#amazer-via-dashboard-root, #amazer-whois-dashboard-root, #svt-dashboard-root, #svt-network-dashboard-root, #staff-root)',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};
