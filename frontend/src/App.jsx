import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ErrorToast from './components/ErrorToast';
import LoginPanel from './modules/auth/LoginPanel';
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
        setDefaultModuleForUser(parsed);
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const moduleId = getModuleIdFromPath(location.pathname);
    setActiveModule(moduleId);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || canAccessModule(user, activeModule)) return;
    const fallbackModule = firstAccessibleModule(user);
    setActiveModule(fallbackModule);
    navigate(MODULE_MAP[fallbackModule]?.path || '/dashboard', { replace: true });
    triggerError('You do not have access to that module.', 'error');
  }, [activeModule, navigate, triggerError, user]);

  const setDefaultModuleForUser = (userData) => {
    const dept = userData?.department || 'Executive';
    let defaultModule = 'dashboard';
    if (dept === 'Operations & Maintenance') defaultModule = 'machine';
    else if (dept === 'QA & Food Safety Lab') defaultModule = 'quality';
    else if (dept === 'Accounts & Ledger') defaultModule = 'finance';
    else if (dept === 'Plant Operations') defaultModule = 'production';
    else if (dept === 'Sales & Marketing') defaultModule = 'sales';
    else if (dept === 'Supply Chain') defaultModule = 'inventory';
    const allowedDefault = canAccessModule(userData, defaultModule) ? defaultModule : firstAccessibleModule(userData);
    setActiveModule(allowedDefault);
    navigate(MODULE_MAP[allowedDefault]?.path || '/dashboard');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setDefaultModuleForUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (!user) {
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
        <Header
          activeModule={activeModule}
          user={user}
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
