import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { MODULE_MAP } from '../moduleRoutes';

const getItemPath = (id) => MODULE_MAP[id]?.path || '/dashboard';

const NAV_GROUPS = [
  {
    id: 'executive',
    title: 'Executive & System',
    icon: 'mdi:view-dashboard-outline',
    items: [
      { id: 'dashboard', label: 'Executive Dashboard', icon: 'mdi:view-dashboard-outline' },
      { id: 'org', label: 'Organization', icon: 'mdi:domain' },
      { id: 'settings', label: 'Settings', icon: 'mdi:cog-outline' },
      { id: 'audit', label: 'Audit Logs', icon: 'mdi:clipboard-text-clock-outline' },
    ],
  },
  {
    id: 'hr',
    title: 'HR & Attendance',
    icon: 'mdi:account-group-outline',
    items: [
      { id: 'employees', label: 'Employee Master', icon: 'mdi:account-badge-outline' },
      { id: 'rfid_attendance', label: 'RFID Attendance', icon: 'mdi:card-account-details-outline' },
      { id: 'shifts', label: 'Shift Management', icon: 'mdi:clock-outline' },
      { id: 'leaves', label: 'Leave Management', icon: 'mdi:calendar-multiselect' },
      { id: 'payroll', label: 'Payroll & Salary', icon: 'mdi:cash-multiple' },
    ],
  },
  {
    id: 'crm_sales',
    title: 'Sales & CRM',
    icon: 'mdi:chart-line',
    items: [
      { id: 'crm', label: 'CRM Overview', icon: 'mdi:bullseye-arrow' },
      { id: 'leads', label: 'Lead Management', icon: 'mdi:phone-outgoing-outline' },
      { id: 'customers', label: 'Customers & Dealers', icon: 'mdi:account-heart-outline' },
      { id: 'sales', label: 'Sales & Invoices', icon: 'mdi:cart-outline' },
      { id: 'finance', label: 'Finance & Ledger', icon: 'mdi:finance' },
      { id: 'expense', label: 'Expense Tracker', icon: 'mdi:receipt-text-outline' },
    ],
  },
  {
    id: 'procurement',
    title: 'Procurement & Inventory',
    icon: 'mdi:package-variant-closed',
    items: [
      { id: 'suppliers', label: 'Suppliers & Vendors', icon: 'mdi:truck-outline' },
      { id: 'purchase', label: 'Purchase Orders', icon: 'mdi:dolly' },
      { id: 'rawmaterial', label: 'Raw Materials & BOM', icon: 'mdi:fruit-citrus' },
      { id: 'warehouse', label: 'Warehouses', icon: 'mdi:warehouse' },
      { id: 'inventory', label: 'Inventory Stock', icon: 'mdi:package-variant-closed' },
    ],
  },
  {
    id: 'production',
    title: 'Production & Machines',
    icon: 'mdi:factory',
    items: [
      { id: 'planning', label: 'Production Planning', icon: 'mdi:calendar-clock' },
      { id: 'production', label: 'Production Orders', icon: 'mdi:cogs' },
      { id: 'batches', label: 'Batch Management', icon: 'mdi:flask-outline' },
      { id: 'machine', label: 'Machine Master', icon: 'mdi:robot-industrial' },
      { id: 'machine_operation', label: 'Machine Operation', icon: 'mdi:sine-wave' },
      { id: 'maintenance', label: 'Maintenance', icon: 'mdi:wrench-outline' },
    ],
  },
  {
    id: 'quality_logistics',
    title: 'Quality & Logistics',
    icon: 'mdi:shield-check-outline',
    items: [
      { id: 'quality', label: 'Quality Control', icon: 'mdi:shield-check-outline' },
      { id: 'laboratory', label: 'Laboratory Reports', icon: 'mdi:microscope' },
      { id: 'packaging', label: 'Packaging Usage', icon: 'mdi:box-seal' },
      { id: 'dispatch', label: 'Dispatch & Delivery', icon: 'mdi:truck-delivery-outline' },
      { id: 'compliance', label: 'FSSAI & Compliance', icon: 'mdi:certificate-outline' },
    ],
  },
  {
    id: 'admin',
    title: 'Users & Roles',
    icon: 'mdi:shield-lock-outline',
    items: [
      { id: 'users', label: 'User Management', icon: 'mdi:account-group' },
      { id: 'roles', label: 'Roles & Permissions', icon: 'mdi:shield-lock-outline' },
      { id: 'factories', label: 'Factory Management', icon: 'mdi:factory' },
      { id: 'departments', label: 'Department Mgmt', icon: 'mdi:office-building' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Utilities',
    icon: 'mdi:file-chart-outline',
    items: [
      { id: 'reports', label: 'Reports Export', icon: 'mdi:file-chart-outline' },
      { id: 'documents', label: 'Documents Archive', icon: 'mdi:folder-outline' },
      { id: 'notifications', label: 'Notifications', icon: 'mdi:bell-outline' },
      { id: 'help', label: 'Help Center', icon: 'mdi:help-circle-outline' },
    ],
  },
];

function loadGroupState() {
  try {
    const saved = localStorage.getItem('sidebar_collapsed_groups');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export default function Sidebar({ activeModule, user, onLogout, isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const [groupCollapsed, setGroupCollapsed] = useState(loadGroupState);
  const navigate = useNavigate();

  const toggleGroup = (groupId) => {
    setGroupCollapsed((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try { localStorage.setItem('sidebar_collapsed_groups', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleNavClick = (id) => {
    if (window.innerWidth < 1024 && onClose) onClose();
    navigate(getItemPath(id));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-screen z-40 lg:z-auto
          bg-white border-r border-slate-200 flex flex-col
          transition-all duration-300 ease-in-out font-sans select-none shadow-sm
          ${isCollapsed ? 'lg:w-16 w-64' : 'w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className={`flex items-center border-b border-slate-100 shrink-0 ${isCollapsed ? 'p-2 justify-center' : 'px-4 py-4 justify-between gap-3'}`}>
          {isCollapsed ? (
            <button
              onClick={onToggleCollapse}
              className="w-10 h-10 bg-orange-500 hover:bg-orange-600 rounded-xl flex items-center justify-center shadow-sm text-white transition cursor-pointer group relative"
              title="Expand Sidebar"
            >
              <Icon icon="mdi:fruit-citrus" className="text-xl group-hover:hidden" />
              <Icon icon="mdi:chevron-double-right" className="text-xl hidden group-hover:block" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Icon icon="mdi:fruit-citrus" className="text-white text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-extrabold text-slate-900 leading-none">
                    JuiceFlow <span className="text-orange-500">ERP</span>
                  </h1>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 uppercase tracking-wider">
                    Food & Beverage Suite
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <Icon icon="mdi:chevron-double-left" className="text-base" />
                </button>
                <button
                  onClick={onClose}
                  className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <Icon icon="mdi:close" className="text-base" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* User profile strip */}
        <div className={`border-b border-slate-100 bg-orange-50/60 shrink-0 ${isCollapsed ? 'p-2 flex justify-center' : 'px-4 py-3'}`}>
          {isCollapsed ? (
            <div
              className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-xs shadow-sm cursor-pointer"
              title={`${user?.name || 'Admin'} (${user?.roleName || 'General Manager'})`}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate leading-tight">
                  {user?.name || 'Admin'}
                </span>
                <span className="text-[10px] text-orange-600 font-semibold block truncate">
                  {user?.roleName || 'General Manager'}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] text-emerald-600 font-bold">Online</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-1 custom-scrollbar">
          {NAV_GROUPS.map((group) => {
            const isGroupCollapsed = groupCollapsed[group.id];
            const hasActiveItem = group.items.some((i) => i.id === activeModule);

            if (isCollapsed) {
              // COLLAPSED MODE: show icons only with tooltips
              return (
                <div key={group.id} className="space-y-1 border-b border-slate-100 pb-1 mb-1 last:border-b-0">
                  {group.items.map((item) => {
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        title={item.label}
                        className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all cursor-pointer relative group
                          ${isActive
                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                            : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
                          }`}
                      >
                        <Icon icon={item.icon} className="text-lg shrink-0" />
                      </button>
                    );
                  })}
                </div>
              );
            }

            // EXPANDED MODE: full view
            return (
              <div key={group.id} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition cursor-pointer
                    ${hasActiveItem
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <Icon icon={group.icon} className="text-sm shrink-0" />
                  <span className="flex-1 text-left truncate">{group.title}</span>
                  <Icon
                    icon={isGroupCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-down'}
                    className="text-sm shrink-0"
                  />
                </button>

                {/* Group Items */}
                {!isGroupCollapsed && (
                  <div className="mt-0.5 pl-2 space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = activeModule === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer
                            ${isActive
                              ? 'bg-orange-500 text-white font-bold shadow-sm shadow-orange-200'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                            }`}
                        >
                          <Icon
                            icon={item.icon}
                            className={`text-base shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                          />
                          <span className="truncate text-left">{item.label}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className={`p-3 border-t border-slate-100 shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {isCollapsed ? (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 transition cursor-pointer"
            >
              <Icon icon="mdi:logout" className="text-lg shrink-0" />
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 transition font-semibold cursor-pointer"
            >
              <Icon icon="mdi:logout" className="text-base shrink-0" />
              Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
