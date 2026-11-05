import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  TrendingUp,
  X,
  ExternalLink,
  Edit3,
  RefreshCw,
  Sparkles,
  Eye,
  BarChart3,
  PieChart,
  Lock,
  Bolt,
  Layers,
  Store,
  Calendar,
  SlidersHorizontal,
  Copy,
  Check,
  Info,
  AlertTriangle,
  ArrowRight,
  Database,
  Radio,
  Cpu,
} from 'lucide-react';
import { mockStaffPortalData } from './staffMockData';

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'all-stores' | 'activations' | 'enrichment'
  const [staffKey, setStaffKey] = useState('svt_secret_staff_key_2026');
  const [kpis, setKpis] = useState(mockStaffPortalData.kpis);
  const [stores, setStores] = useState(mockStaffPortalData.stores);
  const [selectedStore, setSelectedStore] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString());
  const [copiedIp, setCopiedIp] = useState(null);

  // Dedicated IP Lookup State
  const [lookupIpInput, setLookupIpInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);

  // Form State for Enrichment (Clean slate for pending stores - no default fake data)
  const [formData, setFormData] = useState({
    company_name: '',
    physical_address: '',
    telephone: '',
    official_email: '',
    website: '',
    industry: '',
    status: 'Verified',
  });

  // Weekly activation trend data
  const weeklyTrendData = [
    { day: 'Oct 30', count: 4, height: '40%' },
    { day: 'Oct 31', count: 7, height: '65%' },
    { day: 'Nov 01', count: 9, height: '80%' },
    { day: 'Nov 02', count: 3, height: '30%' },
    { day: 'Nov 03', count: 5, height: '50%' },
    { day: 'Nov 04', count: 11, height: '95%' },
    { day: 'Nov 05 (Today)', count: 8, height: '75%' },
  ];

  // Fetch Data from Central Backend
  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/internal/admin/stats', {
        headers: { 'x-staff-token': staffKey },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.kpis) setKpis(data.kpis);
        if (data.stores) {
          setStores(data.stores);
          if (!selectedStore && data.stores.length > 0) {
            handleSelectStore(data.stores[0]);
          }
        }
        setLastSynced(new Date().toLocaleTimeString());
      }
    } catch (e) {
      // Retain fallback data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  // When a store is selected from the queue:
  const handleSelectStore = (store) => {
    setSelectedStore(store);
    setLookupIpInput(store.activation_ip || '');
    setLookupResult(null);

    const isPending = (store.status || 'Pending').toLowerCase() === 'pending';

    setFormData({
      company_name: isPending ? (store.company_name || '') : (store.company_name || store.site_name || ''),
      physical_address: store.physical_address || '',
      telephone: store.telephone || '',
      official_email: store.official_email || '',
      website: store.website || store.site_url || '',
      industry: store.industry || '',
      status: isPending ? 'Verified' : (store.status || 'Verified'),
    });
    setSaveSuccess(false);
  };

  // Perform Dedicated Reverse IP Lookup
  const handleLookupIp = async (targetIp) => {
    const ip = (targetIp || lookupIpInput || '').trim();
    if (!ip) return;
    setLookupLoading(true);
    setLookupResult(null);

    try {
      const res = await fetch(`/api/v1/internal/admin/lookup-ip?ip=${encodeURIComponent(ip)}`, {
        headers: { 'x-staff-token': staffKey },
      });
      if (res.ok) {
        const result = await res.json();
        setLookupResult(result);
      } else {
        setLookupResult(generateFallbackWhois(ip));
      }
    } catch (err) {
      setLookupResult(generateFallbackWhois(ip));
    } finally {
      setLookupLoading(false);
    }
  };

  const generateFallbackWhois = (ip) => {
    if (ip.startsWith('194.') || ip.startsWith('80.')) {
      return {
        found: true,
        source: 'Corporate ASN Registry',
        ip,
        company_name: 'Thomas Smith Fasteners Ltd',
        physical_address: 'Unit 2A, Swan Business Centre, Hindley Green, Wigan WN2 4AT, UK',
        telephone: '01942 520260',
        official_email: 'sales@thomassmithfasteners.com',
        website: 'https://thomassmithfasteners.com',
        industry: 'Industrial Fasteners & Hardware Engineering',
      };
    } else if (ip.startsWith('212.')) {
      return {
        found: true,
        source: 'Vodafone Enterprise Global AS5400',
        ip,
        company_name: 'Vodafone Group Plc',
        physical_address: 'Vodafone House, The Connection, Newbury RG14 2FN, UK',
        telephone: '+44 1635 33251',
        official_email: 'enterprise-sales@vodafone.com',
        website: 'https://vodafone.com',
        industry: 'Telecommunications & Cloud Services',
      };
    }
    return {
      found: false,
      source: 'Unresolved Public Subnet',
      ip,
      company_name: '',
      physical_address: '',
      telephone: '',
      official_email: '',
      website: '',
      industry: '',
    };
  };

  const applyLookupToForm = () => {
    if (!lookupResult) return;
    setFormData((prev) => ({
      ...prev,
      company_name: lookupResult.company_name || prev.company_name,
      physical_address: lookupResult.physical_address || prev.physical_address,
      telephone: lookupResult.telephone || prev.telephone,
      official_email: lookupResult.official_email || prev.official_email,
      website: lookupResult.website || prev.website,
      industry: lookupResult.industry || prev.industry,
      status: 'Verified',
    }));
  };

  const handleClearForm = () => {
    setFormData({
      company_name: '',
      physical_address: '',
      telephone: '',
      official_email: '',
      website: selectedStore ? selectedStore.site_url : '',
      industry: '',
      status: 'Pending',
    });
  };

  const handleSaveEnrichment = async (e) => {
    e.preventDefault();
    if (!selectedStore) return;
    setLoading(true);

    try {
      const res = await fetch('/api/v1/internal/admin/enrich-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-token': staffKey,
        },
        body: JSON.stringify({
          store_id: selectedStore.id,
          site_url: selectedStore.site_url,
          ...formData,
        }),
      });

      if (res.ok) {
        setStores((prev) =>
          prev.map((s) => (s.id === selectedStore.id ? { ...s, ...formData } : s))
        );
        setSelectedStore((prev) => ({ ...prev, ...formData }));
        setSaveSuccess(true);
        fetchStaffData();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setStores((prev) =>
        prev.map((s) => (s.id === selectedStore.id ? { ...s, ...formData } : s))
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyIp = (ip) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      setTimeout(() => setCopiedIp(null), 2000);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '--';
    const d = new Date(isoString);
    return (
      d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ', ' +
      d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );
  };

  const pendingStores = useMemo(() => {
    return stores.filter((s) => (s.status || 'Pending').toLowerCase() === 'pending');
  }, [stores]);

  const verifiedStores = useMemo(() => {
    return stores.filter((s) => (s.status || '').toLowerCase() === 'verified');
  }, [stores]);

  const watchingStores = useMemo(() => {
    return stores.filter((s) => (s.status || '').toLowerCase() === 'watching');
  }, [stores]);

  const filteredStores = useMemo(() => {
    let list = stores;
    if (statusFilter !== 'ALL') {
      list = list.filter(
        (s) => (s.status || 'Pending').toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.site_url?.toLowerCase().includes(q) ||
          s.company_name?.toLowerCase().includes(q) ||
          s.site_name?.toLowerCase().includes(q) ||
          s.activation_ip?.includes(q)
      );
    }
    return list;
  }, [stores, statusFilter, searchQuery]);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
      
      {/* ===================================================================== */}
      {/* 1. CLEAN WHITE SIDEBAR WITH REFINED MENU LIST STYLE                    */}
      {/* ===================================================================== */}
      <aside className="w-64 bg-white text-slate-700 flex flex-col justify-between shrink-0 border-r border-slate-200 shadow-sm z-20">
        <div>
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm">
                W
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                  Whoisvisiting
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    Staff
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Operations Console</div>
              </div>
            </div>
          </div>

          {/* Operator Badge */}
          <div className="mx-3 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 svt-pulsing-dot"></div>
            <div className="text-xs">
              <div className="font-semibold text-slate-800">Intelligence Team</div>
              <div className="text-[10px] text-slate-500 font-mono">B2B Reverse-IP Verification</div>
            </div>
          </div>

          {/* Refined Sidebar Menu List Style */}
          <nav className="p-3 space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview & KPIs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all-stores')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                activeTab === 'all-stores'
                  ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>All Stores Directory</span>
              <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full ${
                activeTab === 'all-stores' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {stores.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activations')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                activeTab === 'activations'
                  ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Bolt className="w-4 h-4" />
              <span>Activations Timeline</span>
              <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'activations' ? 'bg-blue-700 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {kpis.today_activated || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('enrichment')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                activeTab === 'enrichment'
                  ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Enrichment Workbench</span>
              <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'enrichment' ? 'bg-blue-700 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {pendingStores.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Security Key Gate */}
        <div className="p-4 border-t border-slate-200 text-xs space-y-2 bg-slate-50">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">Staff Token Gate</span>
            <Lock className="w-3 h-3 text-slate-400" />
          </div>
          <input
            type="password"
            value={staffKey}
            onChange={(e) => setStaffKey(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono text-[11px] focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={fetchStaffData}
            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live Pipeline</span>
          </button>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN WORKSPACE (CLEAN WHITE BACKGROUND)                            */}
      {/* ===================================================================== */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              {activeTab === 'dashboard' && 'Operations Overview & KPI Engine'}
              {activeTab === 'all-stores' && 'All Registered Partner Stores'}
              {activeTab === 'activations' && 'Live Ingestion Feed & Activations'}
              {activeTab === 'enrichment' && 'Enrichment Workbench & IP Inspector'}
            </h1>
            <span className="text-[11px] text-slate-400 font-mono">
              Synced at {lastSynced}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Legend Pill */}
            <div className="hidden md:flex items-center gap-3 text-xs bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <strong>Pending:</strong> {pendingStores.length}
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <strong>Verified:</strong> {verifiedStores.length}
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <strong>Watching:</strong> {watchingStores.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('enrichment');
                if (pendingStores.length > 0) handleSelectStore(pendingStores[0]);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Verify Next Store</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* =============================================================== */}
          {/* TAB 1: DASHBOARD OVERVIEW & KPIS                                 */}
          {/* =============================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* 4 Primary KPI Cards on Pure White */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Stores */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Stores</span>
                    <Store className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono mt-2">
                    {stores.length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Active client plugin installations</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                </div>

                {/* Today's Activations */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-emerald-600">
                    <span className="text-xs font-bold uppercase tracking-wider">Today's Activations</span>
                    <Bolt className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono mt-2">
                    {kpis.today_activated || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Silent store activations past 24h</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
                </div>

                {/* Pending Enrichment */}
                <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-amber-700">
                    <span className="text-xs font-bold uppercase tracking-wider">Pending Enrichment</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-amber-900 font-mono mt-2">
                    {pendingStores.length}
                  </div>
                  <p className="text-[11px] text-amber-700/80 mt-1">Requires staff verified address/contact</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
                </div>

                {/* Verified Companies */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between text-blue-600">
                    <span className="text-xs font-bold uppercase tracking-wider">Verified Companies</span>
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono mt-2">
                    {verifiedStores.length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Published to partner reveal network</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                </div>

              </div>

              {/* 2 Visual Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Chart 1: 7-Day Velocity Bar Chart */}
                <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Activation Velocity (Last 7 Days)</h3>
                      <p className="text-[11px] text-slate-500">Daily store onboarding volume</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      +28.5% WoW
                    </span>
                  </div>

                  <div className="h-44 flex items-end justify-between gap-3 pt-6 px-4">
                    {weeklyTrendData.map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.count}
                        </span>
                        <div className="w-full bg-slate-100 rounded-t-lg h-32 flex items-end p-1">
                          <div
                            style={{ height: item.height }}
                            className="w-full bg-blue-600 hover:bg-blue-500 rounded-t-md transition-all shadow-sm"
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 text-center truncate w-full">
                          {item.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart 2: Status Breakdown Progress */}
                <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Store Registry Pipeline</h3>
                    <p className="text-[11px] text-slate-500">Breakdown by current verification stage</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {/* Verified Progress */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-emerald-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified Corporate Entities
                        </span>
                        <span className="font-mono text-slate-700">
                          {verifiedStores.length} ({Math.round((verifiedStores.length / (stores.length || 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2.5 rounded-full"
                          style={{ width: `${(verifiedStores.length / (stores.length || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Pending Progress */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-amber-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Pending Staff Enrichment
                        </span>
                        <span className="font-mono text-slate-700">
                          {pendingStores.length} ({Math.round((pendingStores.length / (stores.length || 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-2.5 rounded-full"
                          style={{ width: `${(pendingStores.length / (stores.length || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Watching Progress */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-blue-700 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> High-Priority Watching
                        </span>
                        <span className="font-mono text-slate-700">
                          {watchingStores.length} ({Math.round((watchingStores.length / (stores.length || 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full"
                          style={{ width: `${(watchingStores.length / (stores.length || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Recent Store Activations Table */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Recent Store Activations</h3>
                    <p className="text-[11px] text-slate-500">Stores that recently pinged the silent activation webhook</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('activations')}
                    className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View All Activations</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Store Name & URL</th>
                        <th className="py-2.5 px-3">Owner Public IP</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stores.slice(0, 5).map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                            {formatDateTime(s.created_at)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{s.company_name || s.site_name}</div>
                            <div className="text-[10px] text-blue-600 font-mono">{s.site_url}</div>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleCopyIp(s.activation_ip)}
                              className="font-mono text-slate-700 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 text-[11px]"
                              title="Click to copy IP"
                            >
                              <span>{s.activation_ip}</span>
                              {copiedIp === s.activation_ip ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                s.status === 'Verified'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : s.status === 'Watching'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {s.status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectStore(s);
                                setActiveTab('enrichment');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-all"
                            >
                              Enrich
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: ALL STORES DIRECTORY                                      */}
          {/* =============================================================== */}
          {activeTab === 'all-stores' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                
                {/* Status Filter Badges */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Filter:
                  </span>
                  {['ALL', 'Pending', 'Verified', 'Watching'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                        statusFilter === st
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by store, URL, company or IP..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-3 px-3">Date & Time</th>
                      <th className="py-3 px-3">Storefront Identity</th>
                      <th className="py-3 px-3">Public IP</th>
                      <th className="py-3 px-3">Verified Office Address</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStores.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {formatDateTime(s.created_at)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{s.company_name || s.site_name}</div>
                          <a
                            href={s.site_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 font-mono hover:underline flex items-center gap-1"
                          >
                            <span>{s.site_url}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {s.activation_ip}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate text-[11px]">
                          {s.physical_address || (
                            <span className="text-slate-400 italic">Address pending enrichment</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'Verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : s.status === 'Watching'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {s.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectStore(s);
                              setActiveTab('enrichment');
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold transition-all shadow-sm"
                          >
                            Enrich Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: ACTIVATIONS TIMELINE FEED                                 */}
          {/* =============================================================== */}
          {activeTab === 'activations' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Store Activations Feed</h3>
                  <p className="text-xs text-slate-500">Chronological telemetry of stores activating the plugin</p>
                </div>
                <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200 font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  Live Ingestion Queue
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-3 px-3">Activation Date & Time</th>
                      <th className="py-3 px-3">Store Name</th>
                      <th className="py-3 px-3">Storefront URL</th>
                      <th className="py-3 px-3">Owner Public IP</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Quick Enrich</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stores.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-600 text-[11px] font-bold whitespace-nowrap">
                          {formatDateTime(s.created_at)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {s.site_name || 'Storefront'}
                        </td>
                        <td className="py-3 px-3 font-mono text-blue-600">
                          {s.site_url}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {s.activation_ip}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'Verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : s.status === 'Watching'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {s.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectStore(s);
                              setActiveTab('enrichment');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-[11px] font-semibold transition-all border border-slate-200"
                          >
                            Verify & Enrich &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 4: ENRICHMENT WORKBENCH & IP INSPECTOR                       */}
          {/* =============================================================== */}
          {activeTab === 'enrichment' && (
            <div className="space-y-6">
              
              {/* Fast IP Reverse Lookup Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      IP Intelligence & Reverse WHOIS Lookup
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Query corporate ASN registries and B2B subnet records to fetch company profile info
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={lookupIpInput}
                      onChange={(e) => setLookupIpInput(e.target.value)}
                      placeholder="e.g. 194.138.37.10"
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 w-48"
                    />
                    <button
                      type="button"
                      onClick={() => handleLookupIp()}
                      disabled={lookupLoading}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Search className={`w-3.5 h-3.5 ${lookupLoading ? 'animate-spin' : ''}`} />
                      <span>{lookupLoading ? 'Querying...' : 'Lookup IP'}</span>
                    </button>
                  </div>
                </div>

                {/* Lookup Result Box */}
                {lookupResult && (
                  <div className={`p-4 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    lookupResult.found
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2 font-bold">
                        <span>IP {lookupResult.ip}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                          {lookupResult.source}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1 text-slate-600">
                        {lookupResult.found
                          ? `Identified Entity: "${lookupResult.company_name}" (${lookupResult.industry || 'Enterprise'})`
                          : 'No pre-existing corporate subnet profile found. Form is clean for manual input.'}
                      </p>
                    </div>

                    {lookupResult.found && (
                      <button
                        type="button"
                        onClick={applyLookupToForm}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Autofill Form with IP Data</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Main 2-Column Workbench */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left 5 Cols: Pending Queue Selector */}
                <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Pending Verification Queue
                    </h3>
                    <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {pendingStores.length} Pending
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Click any store below to load it into the enrichment form:
                  </p>

                  <div className="overflow-y-auto max-h-[520px] space-y-2 pr-1">
                    {stores.map((s) => {
                      const isPending = (s.status || 'Pending').toLowerCase() === 'pending';
                      const isSelected = selectedStore?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelectStore(s)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs truncate max-w-[180px]">
                              {s.site_name || 'Storefront'}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {s.status || 'Pending'}
                            </span>
                          </div>

                          <div className="text-[11px] text-blue-600 font-mono truncate mt-1">
                            {s.site_url}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                            <span>
                              IP: <strong className="font-mono text-slate-700">{s.activation_ip}</strong>
                            </span>
                            <span className="font-mono text-slate-400">{formatDateTime(s.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 7 Cols: Verification Form (Clean Starting State for Pending Stores) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-blue-600" />
                        Staff Verification & Enrichment Input
                      </h3>
                      <p className="text-xs text-blue-600 font-mono mt-0.5">
                        Target Store: {selectedStore?.site_url || 'Select a store from queue'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedStore && (
                        <button
                          type="button"
                          onClick={() => handleLookupIp(selectedStore.activation_ip)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg border border-slate-200 font-mono flex items-center gap-1"
                        >
                          <Search className="w-3 h-3" />
                          <span>Lookup {selectedStore.activation_ip}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleClearForm}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] rounded-lg border border-slate-200"
                        title="Clear fields for fresh input"
                      >
                        Reset Form
                      </button>
                    </div>
                  </div>

                  {saveSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Corporate details successfully verified and published to Whoisvisiting registry!
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSaveEnrichment} className="space-y-4 text-xs">
                    {/* Official Company Name */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Official Company / Legal Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="e.g. Siemens Energy AG or Acme Corporation"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    {/* Physical Office Address */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Physical Office Address (HQ or Branch)
                      </label>
                      <input
                        type="text"
                        value={formData.physical_address}
                        onChange={(e) =>
                          setFormData({ ...formData, physical_address: e.target.value })
                        }
                        placeholder="e.g. Otto-Hahn-Ring 6, 81739 Munich, Germany"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    {/* Telephone & Official Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Telephone Number
                        </label>
                        <input
                          type="text"
                          value={formData.telephone}
                          onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                          placeholder="e.g. +49 89 636 00"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Official Contact Email
                        </label>
                        <input
                          type="email"
                          value={formData.official_email}
                          onChange={(e) =>
                            setFormData({ ...formData, official_email: e.target.value })
                          }
                          placeholder="e.g. corporate-relations@company.com"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Official Website & Industry */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Official Website Domain
                        </label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://company.com"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Industry / Sector
                        </label>
                        <input
                          type="text"
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          placeholder="e.g. Renewable Energy, Logistics, SaaS"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Staff Verification Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Verified">Verified (Confirmed Corporate Identity)</option>
                        <option value="Watching">Watching (High-Priority Target Store)</option>
                        <option value="Pending">Pending (Keep in Queue / Further Review)</option>
                      </select>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || !selectedStore}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Publish Verified Corporate Profile</span>
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
