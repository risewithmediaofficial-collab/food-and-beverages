import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { socket } from '../../lib/socket';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, CartesianGrid
} from 'recharts';
import { Icon } from '@iconify/react';
import { canAccessModule, isAdminUser } from '../../accessControl';

const fmt = (n) => (n ?? 0).toLocaleString('en-IN');
const fmtCurr = (n) => `₹${((n ?? 0) / 1000).toFixed(1)}K`;

function StatCard({ icon, iconBg, iconColor, label, value, sub, subColor = 'text-slate-400', badge, badgeColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-orange-200 transition space-y-2.5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">{label}</span>
          {badge && (
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${badgeColor || 'bg-slate-100 text-slate-500'}`}>
              {badge}
            </span>
          )}
        </div>
        <div className={`p-2.5 rounded-xl border ${iconBg}`}>
          <Icon icon={icon} className={`text-xl ${iconColor}`} />
        </div>
      </div>
      <div>
        <span className="text-2xl font-extrabold text-slate-900 block leading-tight">{value}</span>
        <span className={`text-[11px] font-medium block mt-0.5 ${subColor}`}>{sub}</span>
      </div>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-300">
      <Icon icon="mdi:chart-areaspline-variant" className="text-4xl" />
      <span className="text-xs font-medium text-slate-400">{label || 'No data yet'}</span>
    </div>
  );
}

const PIPELINE_STAGES = [
  { id: 'sales', label: 'Sales Orders', icon: 'mdi:cart-outline', color: 'bg-blue-500', key: 'totalSalesOrders' },
  { id: 'production', label: 'Production Batches', icon: 'mdi:flask-outline', color: 'bg-amber-500', key: 'activeProductionOrders' },
  { id: 'quality', label: 'QC Checks', icon: 'mdi:shield-check-outline', color: 'bg-purple-500', key: 'totalQCChecks' },
  { id: 'dispatch', label: 'Active Dispatches', icon: 'mdi:truck-delivery-outline', color: 'bg-emerald-500', key: 'activeDispatches' },
];

const ROLE_DASHBOARD_TILES = [
  { id: 'rfid_attendance', label: 'Attendance', description: 'View RFID attendance records', icon: 'mdi:card-account-details-outline', path: '/rfid_attendance', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'leaves', label: 'Leave Management', description: 'Apply and review leave records', icon: 'mdi:calendar-multiselect', path: '/leaves', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'employees', label: 'Employee Master', description: 'Manage employee profiles and access', icon: 'mdi:account-badge-outline', path: '/employees', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'sales', label: 'Sales & Invoices', description: 'Manage orders and collections', icon: 'mdi:cart-outline', path: '/sales', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'crm', label: 'CRM', description: 'Track leads and customers', icon: 'mdi:bullseye-arrow', path: '/crm', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'inventory', label: 'Inventory', description: 'Monitor stock and movement', icon: 'mdi:package-variant-closed', path: '/inventory', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'purchase', label: 'Purchase', description: 'Manage purchase orders', icon: 'mdi:dolly', path: '/purchase', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'production', label: 'Production', description: 'Track production orders', icon: 'mdi:cogs', path: '/production', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'machine', label: 'Machines', description: 'Machine status and operations', icon: 'mdi:robot-industrial', path: '/machine', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'quality', label: 'Quality', description: 'Quality control and lab work', icon: 'mdi:shield-check-outline', path: '/quality', color: 'bg-lime-50 text-lime-700 border-lime-200' },
  { id: 'dispatch', label: 'Dispatch', description: 'Dispatch and delivery workflows', icon: 'mdi:truck-delivery-outline', path: '/dispatch', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'finance', label: 'Finance', description: 'Finance, ledger, and payments', icon: 'mdi:finance', path: '/finance', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { id: 'reports', label: 'Reports', description: 'Export assigned reports', icon: 'mdi:file-chart-outline', path: '/reports', color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export default function DashboardPanel({ user }) {
  const [kpis, setKpis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();

  const fetchKPIs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/dashboard/factory-overview');
      if (res?.data?.kpis) {
        setKpis(res.data.kpis);
        setLastUpdated(new Date());
      } else {
        setKpis({});
      }
    } catch (err) {
      console.warn('Dashboard KPI fetch failed:', err);
      setKpis({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();

    socket.on('dashboard:kpi-tick', (data) => {
      if (data?.kpis) {
        setKpis((prev) => ({ ...prev, ...data.kpis }));
        setLastUpdated(new Date());
      }
    });

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchKPIs, 60000);
    return () => {
      socket.off('dashboard:kpi-tick');
      clearInterval(interval);
    };
  }, []);

  const go = (path) => navigate(path);

  const kpi = kpis || {};

  // Workflow pipeline data for bar chart
  const pipelineChartData = PIPELINE_STAGES.map((s) => ({
    name: s.label.split(' ')[0],
    value: kpi[s.key] || 0,
  }));

  const allZero = kpis && Object.values(kpis).every((v) => !v || v === 0);
  const isAdmin = isAdminUser(user);
  const roleTiles = ROLE_DASHBOARD_TILES.filter((tile) => canAccessModule(user, tile.id));

  if (!isAdmin) {
    return (
      <div className="space-y-5 font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Icon icon="mdi:shield-account-outline" className="text-sm" />
                Role Dashboard
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
                {user?.roleName || 'Employee'} Workspace
              </h1>
              <p className="text-slate-500 text-[11px] mt-1 max-w-xl leading-relaxed">
                Only modules assigned to your role are shown here. Attendance is available for every user.
              </p>
            </div>
            <button
              onClick={() => navigate('/rfid_attendance')}
              className="self-start bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <Icon icon="mdi:card-account-details-outline" className="text-base" />
              Open Attendance
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {roleTiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => navigate(tile.path)}
              className={`text-left border rounded-2xl p-4 hover:shadow-md transition cursor-pointer ${tile.color}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold">{tile.label}</div>
                  <div className="text-xs opacity-80 mt-1">{tile.description}</div>
                </div>
                <Icon icon={tile.icon} className="text-2xl shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Hero Banner — Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        {/* Subtle orange top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 rounded-t-2xl" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-1">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-bold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
              Juice & Food ERP — Live Plant View
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 leading-tight break-words">
              Executive Manufacturing Command Center
            </h1>
            <p className="text-slate-500 text-[11px] mt-1 max-w-xl leading-relaxed">
              Real-time integration: CRM → Sales Orders → BOM Recipe → Raw Materials → Production → QC → Dispatch
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-center">
              <span className="text-[10px] text-orange-600 block font-bold uppercase tracking-wider">OEE Score</span>
              <span className="text-xl font-extrabold text-orange-600 mt-0.5 block">
                {kpi.avgOEE ? `${kpi.avgOEE}%` : '—'}
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
              <span className="text-[10px] text-emerald-600 block font-bold uppercase tracking-wider">Machines</span>
              <span className="text-xl font-extrabold text-emerald-600 mt-0.5 block">
                {kpi.totalMachines ? `${kpi.runningMachines || 0}/${kpi.totalMachines}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Refresh row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <span className="text-[10px] text-slate-400">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Loading...'}
          </span>
          <button
            onClick={fetchKPIs}
            className="flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-700 transition cursor-pointer"
          >
            <Icon icon="mdi:refresh" className={`text-sm ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>


      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse space-y-3">
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-7 bg-slate-200 rounded w-1/2" />
              <div className="h-2.5 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State — no data at all */}
      {!isLoading && allZero && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <Icon icon="mdi:database-off-outline" className="text-4xl text-amber-400" />
          <div>
            <p className="text-sm font-bold text-amber-800">No Data Yet</p>
            <p className="text-xs text-amber-600 mt-0.5 max-w-sm">
              Your database is clean and ready. Start by adding employees, customers, production batches, and inventory items using the sidebar.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      {!isLoading && kpis && (
        <>
          {/* Row 1 — Sales & Finance */}
          <div>
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 px-0.5">Sales & Finance</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon="mdi:cash-multiple"
                iconBg="bg-orange-50 border-orange-100"
                iconColor="text-orange-600"
                label="Total Revenue"
                value={kpi.totalRevenue ? `₹${fmt(kpi.totalRevenue)}` : '₹0'}
                sub={`${fmt(kpi.totalSalesOrders)} sales orders`}
                badge={kpi.pendingInvoices ? `${kpi.pendingInvoices} pending invoices` : undefined}
                badgeColor="bg-amber-100 text-amber-700"
                onClick={() => go('/sales')}
              />
              <StatCard
                icon="mdi:account-heart-outline"
                iconBg="bg-blue-50 border-blue-100"
                iconColor="text-blue-600"
                label="Total Customers"
                value={fmt(kpi.totalCustomers)}
                sub={`${fmt(kpi.totalLeads)} leads · ${fmt(kpi.wonLeads)} converted`}
                onClick={() => go('/customers')}
              />
              <StatCard
                icon="mdi:finance"
                iconBg="bg-violet-50 border-violet-100"
                iconColor="text-violet-600"
                label="Sales Orders"
                value={fmt(kpi.totalSalesOrders)}
                sub="Total active orders"
                onClick={() => go('/sales')}
              />
              <StatCard
                icon="mdi:truck-outline"
                iconBg="bg-teal-50 border-teal-100"
                iconColor="text-teal-600"
                label="Suppliers"
                value={fmt(kpi.totalSuppliers)}
                sub={kpi.pendingPOs ? `${fmt(kpi.pendingPOs)} pending POs` : 'No pending POs'}
                onClick={() => go('/suppliers')}
              />
            </div>
          </div>

          {/* Row 2 — Production & Quality */}
          <div>
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 px-0.5">Production & Quality</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon="mdi:cogs"
                iconBg="bg-amber-50 border-amber-100"
                iconColor="text-amber-600"
                label="Active Batches"
                value={fmt(kpi.activeProductionOrders)}
                sub={`${fmt(kpi.completedToday)} completed · ${fmt(kpi.totalBatches)} total`}
                onClick={() => go('/batches')}
              />
              <StatCard
                icon="mdi:shield-check-outline"
                iconBg="bg-emerald-50 border-emerald-100"
                iconColor="text-emerald-600"
                label="QC Checks"
                value={fmt(kpi.totalQCChecks)}
                sub={`${fmt(kpi.pendingQC)} pending · ${fmt(kpi.failedQC)} failed`}
                badge={kpi.failedQC > 0 ? `${kpi.failedQC} Rejected` : undefined}
                badgeColor="bg-rose-100 text-rose-700"
                onClick={() => go('/quality')}
              />
              <StatCard
                icon="mdi:package-variant-closed"
                iconBg="bg-slate-50 border-slate-200"
                iconColor="text-slate-600"
                label="Inventory Items"
                value={fmt(kpi.totalItems)}
                sub={kpi.lowStockCount > 0 ? `${kpi.lowStockCount} low stock alerts` : 'All stock optimal'}
                badge={kpi.lowStockCount > 0 ? `${kpi.lowStockCount} Low Stock` : undefined}
                badgeColor="bg-rose-100 text-rose-700"
                subColor={kpi.lowStockCount > 0 ? 'text-rose-500 font-semibold' : 'text-slate-400'}
                onClick={() => go('/inventory')}
              />
              <StatCard
                icon="mdi:truck-delivery-outline"
                iconBg="bg-sky-50 border-sky-100"
                iconColor="text-sky-600"
                label="Dispatches"
                value={fmt(kpi.activeDispatches)}
                sub={`${fmt(kpi.totalDispatches)} total records`}
                badge={kpi.activeDispatches > 0 ? 'In Transit' : undefined}
                badgeColor="bg-sky-100 text-sky-700"
                onClick={() => go('/dispatch')}
              />
            </div>
          </div>

          {/* Row 3 — HR */}
          <div>
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 px-0.5">Workforce</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon="mdi:account-badge-outline"
                iconBg="bg-indigo-50 border-indigo-100"
                iconColor="text-indigo-600"
                label="Total Employees"
                value={fmt(kpi.totalEmployees)}
                sub="Active employee records"
                onClick={() => go('/employees')}
              />
              <StatCard
                icon="mdi:robot-industrial"
                iconBg="bg-cyan-50 border-cyan-100"
                iconColor="text-cyan-600"
                label="Machine Assets"
                value={fmt(kpi.totalMachines)}
                sub={`${fmt(kpi.runningMachines)} running · OEE ${kpi.avgOEE || 0}%`}
                badge={kpi.runningMachines > 0 ? 'Online' : 'Idle'}
                badgeColor={kpi.runningMachines > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}
                onClick={() => go('/machine')}
              />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Production Pipeline Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">End-to-End Pipeline Overview</h3>
                  <p className="text-[11px] text-slate-400">Count of active records across key production stages</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  Live Count
                </span>
              </div>
              {pipelineChartData.every((d) => d.value === 0) ? (
                <EmptyChart label="No pipeline data yet — add orders to see stats" />
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineChartData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                        cursor={{ fill: '#fef3c7' }}
                      />
                      <Bar dataKey="value" name="Count" fill="#f97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Workflow Stage Tracker */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="mdi:source-branch" className="text-orange-500 text-lg" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Production Workflow</h3>
                  <p className="text-[11px] text-slate-400">Stage-by-stage live count</p>
                </div>
              </div>

              <div className="space-y-3">
                {PIPELINE_STAGES.map((stage, idx) => {
                  const count = kpi[stage.key] || 0;
                  const maxCount = Math.max(...PIPELINE_STAGES.map((s) => kpi[s.key] || 0), 1);
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={stage.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg ${stage.color} flex items-center justify-center text-white`}>
                            <Icon icon={stage.icon} className="text-xs" />
                          </div>
                          <span className="text-xs font-medium text-slate-700">{stage.label}</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900">{fmt(count)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${stage.color}`}
                          style={{ width: count === 0 ? '0%' : `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick navigate */}
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                {PIPELINE_STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => go(`/${s.id === 'production' ? 'batches' : s.id}`)}
                    className="text-[10px] font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 cursor-pointer truncate"
                  >
                    <Icon icon="mdi:arrow-right-circle-outline" className="text-xs shrink-0" />
                    {s.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Icon icon="mdi:lightning-bolt" className="text-orange-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'New Sales Order', icon: 'mdi:cart-plus', path: '/sales', color: 'text-orange-600 bg-orange-50 border-orange-200' },
                { label: 'Add Employee', icon: 'mdi:account-plus', path: '/employees', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
                { label: 'New PO', icon: 'mdi:dolly', path: '/purchase', color: 'text-teal-600 bg-teal-50 border-teal-200' },
                { label: 'Add Batch', icon: 'mdi:flask-plus', path: '/batches', color: 'text-amber-600 bg-amber-50 border-amber-200' },
                { label: 'QC Check', icon: 'mdi:shield-check', path: '/quality', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                { label: 'Dispatch', icon: 'mdi:truck-plus', path: '/dispatch', color: 'text-sky-600 bg-sky-50 border-sky-200' },
              ].map((qa) => (
                <button
                  key={qa.path}
                  onClick={() => go(qa.path)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition hover:shadow-md cursor-pointer ${qa.color}`}
                >
                  <Icon icon={qa.icon} className="text-2xl" />
                  <span className="text-[10px] font-bold leading-tight">{qa.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
