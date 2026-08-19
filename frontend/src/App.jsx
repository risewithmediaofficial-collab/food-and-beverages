import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ErrorToast from './components/ErrorToast';
import DashboardPanel from './modules/dashboard/DashboardPanel';
import CrmPanel from './modules/crm/CrmPanel';
import SalesPanel from './modules/sales/SalesPanel';
import PurchasePanel from './modules/purchase/PurchasePanel';
import RawMaterialPanel from './modules/rawmaterial/RawMaterialPanel';
import InventoryPanel from './modules/inventory/InventoryPanel';
import ProductionPlanningPanel from './modules/planning/ProductionPlanningPanel';
import ProductionPanel from './modules/production/ProductionPanel';
import BatchManagementPanel from './modules/production/BatchManagementPanel';
import MachinePanel from './modules/machine/MachinePanel';
import MachineOperationPanel from './modules/machine/MachineOperationPanel';
import QualityPanel from './modules/quality/QualityPanel';
import PackagingPanel from './modules/packaging/PackagingPanel';
import DispatchPanel from './modules/dispatch/DispatchPanel';
import HrPanel from './modules/hr/HrPanel';
import RfidAttendancePanel from './modules/hr/RfidAttendancePanel';
import ShiftPanel from './modules/hr/ShiftPanel';
import LeavePanel from './modules/hr/LeavePanel';
import PayrollPanel from './modules/hr/PayrollPanel';
import FinancePanel from './modules/finance/FinancePanel';
import ReportsPanel from './modules/reports/ReportsPanel';
import DocumentsPanel from './modules/reports/DocumentsPanel';
import NotificationsPanel from './modules/notifications/NotificationsPanel';
import SettingsPanel from './modules/settings/SettingsPanel';
import OrgPanel from './modules/settings/OrgPanel';
import UserManagementPanel from './modules/settings/UserManagementPanel';
import RolesPanel from './modules/settings/RolesPanel';
import FactoryPanel from './modules/settings/FactoryPanel';
import DepartmentPanel from './modules/settings/DepartmentPanel';
import AuditLogPanel from './modules/settings/AuditLogPanel';
import HelpPanel from './modules/settings/HelpPanel';
import LeadManagementPanel from './modules/crm/LeadManagementPanel';
import CustomerPanel from './modules/crm/CustomerPanel';
import SupplierPanel from './modules/purchase/SupplierPanel';
import WarehousePanel from './modules/inventory/WarehousePanel';
import MaintenancePanel from './modules/machine/MaintenancePanel';
import LaboratoryPanel from './modules/quality/LaboratoryPanel';
import ExpensePanel from './modules/finance/ExpensePanel';
import CompliancePanel from './modules/compliance/CompliancePanel';
import LoginPanel from './modules/auth/LoginPanel';
import SuperAdminLogin from './modules/superadmin/SuperAdminLogin';
import SuperAdminDashboard from './modules/superadmin/SuperAdminDashboard';
import { getModuleIdFromPath, MODULE_MAP } from './moduleRoutes';
import { canAccessModule, firstAccessibleModule } from './accessControl';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'error' });
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inspectedOrg, setInspectedOrg] = useState(null);

  const triggerError = useCallback((msg, type = 'error') => {
    setNotification({ message: msg, type });
  }, []);

  // Sync sidebar default with window width on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/superadmin/login') {
          if (parsed.isSuperAdmin) {
            navigate('/superadmin', { replace: true });
          } else {
            setActiveModule('dashboard');
            navigate('/dashboard', { replace: true });
          }
        }
      } catch {
        setUser(null);
      }
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const moduleId = getModuleIdFromPath(location.pathname);
    setActiveModule(moduleId);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || user.isSuperAdmin || canAccessModule(user, activeModule)) return;
    const fallbackModule = firstAccessibleModule(user);
    setActiveModule(fallbackModule);
    navigate(MODULE_MAP[fallbackModule]?.path || '/dashboard', { replace: true });
    triggerError('You do not have access to that module.', 'error');
  }, [activeModule, navigate, triggerError, user]);

  const setDefaultModuleForUser = (userData) => {
    const allowedDefault = canAccessModule(userData, 'dashboard') ? 'dashboard' : firstAccessibleModule(userData);
    setActiveModule(allowedDefault);
    navigate(MODULE_MAP[allowedDefault]?.path || '/dashboard');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.isSuperAdmin) {
      navigate('/superadmin', { replace: true });
    } else {
      setDefaultModuleForUser(userData);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('inspected_org_id');
    setUser(null);
    setInspectedOrg(null);
    navigate('/login');
  };

  // Super Admin view mode (render SuperAdminDashboard when superadmin is logged in and not inspecting an org)
  if (user && user.isSuperAdmin && !inspectedOrg) {
    return (
      <SuperAdminDashboard
        user={user}
        onLogout={handleLogout}
        onSelectOrgForInspection={(org) => {
          if (org?._id) {
            localStorage.setItem('inspected_org_id', org._id);
          }
          setInspectedOrg(org || { name: 'Master Enterprise Plant', planType: 'Enterprise Unlimited' });
          navigate('/dashboard');
        }}
      />
    );
  }

  // Route: /login — render tenant login panel, /superadmin/login renders superadmin login
  if (location.pathname === '/login') {
    return <LoginPanel onLoginSuccess={handleLoginSuccess} />;
  }

  if (location.pathname === '/superadmin/login') {
    return <SuperAdminLogin onSuperAdminLoginSuccess={handleLoginSuccess} />;
  }

  if (!user) {
    if (location.pathname === '/superadmin' || location.pathname === '/superadmin/login') {
      return <SuperAdminLogin onSuperAdminLoginSuccess={handleLoginSuccess} />;
    }
    return <LoginPanel onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveModule = () => {
    if (!canAccessModule(user, activeModule)) {
      return null;
    }

    switch (activeModule) {
      case 'crm':         return <CrmPanel user={user} triggerError={triggerError} />;
      case 'leads':       return <LeadManagementPanel user={user} triggerError={triggerError} />;
      case 'customers':   return <CustomerPanel user={user} triggerError={triggerError} />;
      case 'sales':       return <SalesPanel user={user} triggerError={triggerError} />;
      case 'purchase':    return <PurchasePanel user={user} triggerError={triggerError} />;
      case 'suppliers':   return <SupplierPanel user={user} triggerError={triggerError} />;
      case 'rawmaterial': return <RawMaterialPanel user={user} triggerError={triggerError} />;
      case 'inventory':   return <InventoryPanel user={user} triggerError={triggerError} />;
      case 'warehouse':   return <WarehousePanel user={user} triggerError={triggerError} />;
      case 'planning':    return <ProductionPlanningPanel user={user} triggerError={triggerError} />;
      case 'production':  return <ProductionPanel user={user} triggerError={triggerError} />;
      case 'batches':     return <BatchManagementPanel user={user} triggerError={triggerError} />;
      case 'machine':     return <MachinePanel user={user} triggerError={triggerError} />;
      case 'machine_operation': return <MachineOperationPanel user={user} triggerError={triggerError} />;
      case 'maintenance': return <MaintenancePanel user={user} triggerError={triggerError} />;
      case 'quality':     return <QualityPanel user={user} triggerInfo={triggerError} />;
      case 'laboratory':  return <LaboratoryPanel user={user} triggerError={triggerError} />;
      case 'packaging':   return <PackagingPanel user={user} triggerError={triggerError} />;
      case 'dispatch':    return <DispatchPanel user={user} triggerError={triggerError} />;
      case 'compliance':  return <CompliancePanel user={user} triggerError={triggerError} />;
      case 'employees':   return <HrPanel user={user} triggerError={triggerError} />;
      case 'rfid_attendance': return <RfidAttendancePanel user={user} triggerError={triggerError} />;
      case 'shifts':      return <ShiftPanel user={user} triggerError={triggerError} />;
      case 'leaves':      return <LeavePanel user={user} triggerError={triggerError} />;
      case 'payroll':     return <PayrollPanel user={user} triggerError={triggerError} />;
      case 'finance':     return <FinancePanel user={user} triggerError={triggerError} />;
      case 'expense':     return <ExpensePanel user={user} triggerError={triggerError} />;
      case 'reports':     return <ReportsPanel user={user} triggerError={triggerError} />;
      case 'documents':   return <DocumentsPanel user={user} triggerError={triggerError} />;
      case 'notifications': return <NotificationsPanel user={user} triggerError={triggerError} />;
      case 'settings':    return <SettingsPanel user={user} triggerError={triggerError} />;
      case 'org':         return <OrgPanel user={user} triggerError={triggerError} />;
      case 'users':       return <UserManagementPanel user={user} triggerError={triggerError} />;
      case 'roles':       return <RolesPanel user={user} triggerError={triggerError} />;
      case 'factories':   return <FactoryPanel user={user} triggerError={triggerError} />;
      case 'departments': return <DepartmentPanel user={user} triggerError={triggerError} />;
      case 'audit':       return <AuditLogPanel user={user} triggerError={triggerError} />;
      case 'help':        return <HelpPanel user={user} triggerError={triggerError} />;
      case 'dashboard':
      default:            return <DashboardPanel user={user} triggerError={triggerError} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar
        activeModule={activeModule}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {inspectedOrg && (
          <div className="bg-amber-500 text-slate-950 text-xs font-bold px-4 py-2 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 text-amber-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-mono">
                Super Admin Inspection Mode
              </span>
              <span>Viewing Organization: <strong>{inspectedOrg.name}</strong> ({inspectedOrg.planType})</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('inspected_org_id');
                setInspectedOrg(null);
              }}
              className="bg-slate-950 hover:bg-slate-900 text-white text-[11px] px-3 py-1 rounded-lg font-bold cursor-pointer"
            >
              Exit Inspection & Return to Super Admin Portal ✕
            </button>
          </div>
        )}
        <Header
          activeModule={activeModule}
          user={inspectedOrg ? { ...user, orgName: inspectedOrg.name } : user}
          onMenuToggle={() => {
            if (window.innerWidth < 1024) {
              setSidebarOpen((prev) => !prev);
            } else {
              setIsCollapsed((prev) => !prev);
            }
          }}
          isCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderActiveModule()}
        </main>
      </div>

      <ErrorToast
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: 'error' })}
      />
    </div>
  );
}

export default App;
