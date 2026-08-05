import DashboardPanel from './modules/dashboard/DashboardPanel';
import CrmPanel from './modules/crm/CrmPanel';
import LeadManagementPanel from './modules/crm/LeadManagementPanel';
import CustomerPanel from './modules/crm/CustomerPanel';
import SalesPanel from './modules/sales/SalesPanel';
import PurchasePanel from './modules/purchase/PurchasePanel';
import SupplierPanel from './modules/purchase/SupplierPanel';
import RawMaterialPanel from './modules/rawmaterial/RawMaterialPanel';
import InventoryPanel from './modules/inventory/InventoryPanel';
import WarehousePanel from './modules/inventory/WarehousePanel';
import ProductionPlanningPanel from './modules/planning/ProductionPlanningPanel';
import BatchManagementPanel from './modules/production/BatchManagementPanel';
import MachinePanel from './modules/machine/MachinePanel';
import MachineOperationPanel from './modules/machine/MachineOperationPanel';
import MaintenancePanel from './modules/machine/MaintenancePanel';
import QualityPanel from './modules/quality/QualityPanel';
import LaboratoryPanel from './modules/quality/LaboratoryPanel';
import PackagingPanel from './modules/packaging/PackagingPanel';
import DispatchPanel from './modules/dispatch/DispatchPanel';
import FinancePanel from './modules/finance/FinancePanel';
import ShiftPanel from './modules/hr/ShiftPanel';
import LeavePanel from './modules/hr/LeavePanel';
import PayrollPanel from './modules/hr/PayrollPanel';
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
import HrPanel from './modules/hr/HrPanel';
import RfidAttendancePanel from './modules/hr/RfidAttendancePanel';
import ExpensePanel from './modules/finance/ExpensePanel';
import CompliancePanel from './modules/compliance/CompliancePanel';

export const MODULE_ROUTE_ITEMS = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Executive Dashboard',
    icon: 'mdi:view-dashboard-outline',
    component: DashboardPanel,
    requiredFields: ['KPI cards', 'Status widgets', 'Alert banners'],
    details: 'Top-level executive overview with plant performance, revenue, and alerts.',
  },
  {
    id: 'org',
    path: '/org',
    label: 'Organization Mgmt',
    icon: 'mdi:domain',
    component: OrgPanel,
    requiredFields: ['Organization name', 'Factory locations', 'Contact details'],
    details: 'Manage company structure, factories, and high-level organization settings.',
  },
  {
    id: 'users',
    path: '/users',
    label: 'User Management',
    icon: 'mdi:account-group',
    component: UserManagementPanel,
    requiredFields: ['User name', 'Email', 'Role assignment', 'Department'],
    details: 'Create and manage platform users with role-based access controls.',
  },
  {
    id: 'roles',
    path: '/roles',
    label: 'Roles & Permissions',
    icon: 'mdi:shield-lock-outline',
    component: RolesPanel,
    requiredFields: ['Role name', 'Access rules', 'Module permissions'],
    details: 'Define security roles, access levels and module privileges for users.',
  },
  {
    id: 'factories',
    path: '/factories',
    label: 'Factory Management',
    icon: 'mdi:factory',
    component: FactoryPanel,
    requiredFields: ['Factory name', 'Location', 'Capacity', 'Shift structure'],
    details: 'Configure factories, capacity planning, and plant-level settings.',
  },
  {
    id: 'departments',
    path: '/departments',
    label: 'Department Mgmt',
    icon: 'mdi:office-building',
    component: DepartmentPanel,
    requiredFields: ['Department name', 'Manager', 'Associated factory'],
    details: 'Manage departments, reporting lines and departmental assignments.',
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: 'mdi:cog-outline',
    component: SettingsPanel,
    requiredFields: ['General preferences', 'Theme settings', 'Notification config'],
    details: 'General application settings and configuration options.',
  },
  {
    id: 'audit',
    path: '/audit',
    label: 'Audit Logs',
    icon: 'mdi:clipboard-text-clock-outline',
    component: AuditLogPanel,
    requiredFields: ['Event timestamp', 'User action', 'Affected module'],
    details: 'Review system activity and audit trails across the platform.',
  },
  {
    id: 'employees',
    path: '/employees',
    label: 'Employee Master',
    icon: 'mdi:account-badge-outline',
    component: HrPanel,
    requiredFields: ['Employee name', 'RFID card', 'Department', 'Role'],
    details: 'Manage employee profiles, attendance credentials and department assignments.',
  },
  {
    id: 'rfid_attendance',
    path: '/rfid_attendance',
    label: 'RFID Attendance',
    icon: 'mdi:card-account-details-outline',
    component: RfidAttendancePanel,
    requiredFields: ['Device ID', 'Employee ID', 'Timestamp', 'Attendance status'],
    details: 'Monitor RFID-based attendance records and live device status.',
  },
  {
    id: 'shifts',
    path: '/shifts',
    label: 'Shift Management',
    icon: 'mdi:clock-outline',
    component: ShiftPanel,
    requiredFields: ['Shift name', 'Start time', 'End time', 'Assigned teams'],
    details: 'Define shift schedules and assign employees or machines to shifts.',
  },
  {
    id: 'leaves',
    path: '/leaves',
    label: 'Leave Management',
    icon: 'mdi:calendar-multiselect',
    component: LeavePanel,
    requiredFields: ['Employee name', 'Leave type', 'Start date', 'End date'],
    details: 'Track employee leave requests, approvals, and leave balances.',
  },
  {
    id: 'payroll',
    path: '/payroll',
    label: 'Payroll & Salary',
    icon: 'mdi:cash-multiple',
    component: PayrollPanel,
    requiredFields: ['Employee salary', 'Pay period', 'Deductions', 'Net pay'],
    details: 'Process payroll and manage salary payments for employees.',
  },
  {
    id: 'crm',
    path: '/crm',
    label: 'CRM Overview',
    icon: 'mdi:bullseye-arrow',
    component: CrmPanel,
    requiredFields: ['Customer pipeline', 'Sales leads', 'Deal stage'],
    details: 'View CRM performance and pipeline metrics for sales and marketing.',
  },
  {
    id: 'leads',
    path: '/leads',
    label: 'Lead Management',
    icon: 'mdi:phone-outgoing-outline',
    component: LeadManagementPanel,
    requiredFields: ['Lead name', 'Contact details', 'Source', 'Status'],
    details: 'Manage lead follow-up, conversion status and source tracking.',
  },
  {
    id: 'customers',
    path: '/customers',
    label: 'Customers & Dealers',
    icon: 'mdi:account-heart-outline',
    component: CustomerPanel,
    requiredFields: ['Customer name', 'Contact email', 'Phone', 'Address'],
    details: 'Manage customer and dealer records, contacts, and account details.',
  },
  {
    id: 'sales',
    path: '/sales',
    label: 'Sales & Invoices',
    icon: 'mdi:cart-outline',
    component: SalesPanel,
    requiredFields: ['Order date', 'Customer', 'Invoice amount', 'Payment status'],
    details: 'Create sales orders, invoices, and manage collections.',
  },
  {
    id: 'finance',
    path: '/finance',
    label: 'Finance & Ledger',
    icon: 'mdi:finance',
    component: FinancePanel,
    requiredFields: ['Ledger account', 'Transaction date', 'Amount', 'Voucher type'],
    details: 'Track finance transactions, ledgers and accounting summaries.',
  },
  {
    id: 'suppliers',
    path: '/suppliers',
    label: 'Suppliers & Vendors',
    icon: 'mdi:truck-outline',
    component: SupplierPanel,
    requiredFields: ['Supplier name', 'Contact info', 'Payment terms'],
    details: 'Manage suppliers, vendors, and purchase relationships.',
  },
  {
    id: 'purchase',
    path: '/purchase',
    label: 'Purchase Orders',
    icon: 'mdi:dolly',
    component: PurchasePanel,
    requiredFields: ['Order number', 'Vendor', 'Item list', 'Expected delivery'],
    details: 'Create purchase orders and manage procurement workflows.',
  },
  {
    id: 'rawmaterial',
    path: '/rawmaterial',
    label: 'Raw Materials & BOM',
    icon: 'mdi:fruit-citrus',
    component: RawMaterialPanel,
    requiredFields: ['Material name', 'Batch number', 'Quantity', 'BOM components'],
    details: 'Track raw material inventory, recipe ingredients, and bill of materials for production.',
  },
  {
    id: 'warehouse',
    path: '/warehouse',
    label: 'Warehouses',
    icon: 'mdi:warehouse',
    component: WarehousePanel,
    requiredFields: ['Warehouse location', 'Storage capacity', 'Inventory zones'],
    details: 'Manage warehouse locations, storage and stock movement.',
  },
  {
    id: 'inventory',
    path: '/inventory',
    label: 'Inventory Stock',
    icon: 'mdi:package-variant-closed',
    component: InventoryPanel,
    requiredFields: ['Item code', 'Available quantity', 'Stock value'],
    details: 'Monitor finished goods, stock levels and inventory flow.',
  },
  {
    id: 'planning',
    path: '/planning',
    label: 'Production Planning',
    icon: 'mdi:calendar-clock',
    component: ProductionPlanningPanel,
    requiredFields: ['Plan date', 'Required quantity', 'Machine line'],
    details: 'Plan production orders and allocate resources across lines.',
  },
  {
    id: 'production',
    path: '/production',
    label: 'Production Orders',
    icon: 'mdi:cogs',
    component: BatchManagementPanel,
    requiredFields: ['Order number', 'Recipe', 'Quantity', 'Schedule'],
    details: 'Manage production orders and batch lifecycle execution.',
  },
  {
    id: 'batches',
    path: '/batches',
    label: 'Batch Management',
    icon: 'mdi:flask-outline',
    component: BatchManagementPanel,
    requiredFields: ['Batch ID', 'Yield data', 'Quality status'],
    details: 'Track production batches, genealogy and quality release.',
  },
  {
    id: 'machine',
    path: '/machine',
    label: 'Machine Master',
    icon: 'mdi:robot-industrial',
    component: MachinePanel,
    requiredFields: ['Machine name', 'Capacity', 'Status'],
    details: 'Manage machine assets, configurations and status logs.',
  },
  {
    id: 'machine_operation',
    path: '/machine_operation',
    label: 'Machine Operation',
    icon: 'mdi:sine-wave',
    component: MachineOperationPanel,
    requiredFields: ['Machine line', 'Operation time', 'Output'],
    details: 'Monitor machine runtime, operating efficiency and logs.',
  },
  {
    id: 'maintenance',
    path: '/maintenance',
    label: 'Maintenance',
    icon: 'mdi:wrench-outline',
    component: MaintenancePanel,
    requiredFields: ['Assigned engineer', 'Issue description', 'Work order'],
    details: 'Manage machine maintenance tasks and repairs.',
  },
  {
    id: 'quality',
    path: '/quality',
    label: 'Quality Control',
    icon: 'mdi:shield-check-outline',
    component: QualityPanel,
    requiredFields: ['Inspection type', 'Batch number', 'Result'],
    details: 'Execute quality control checks and approve release status.',
  },
  {
    id: 'laboratory',
    path: '/laboratory',
    label: 'Laboratory Reports',
    icon: 'mdi:microscope',
    component: LaboratoryPanel,
    requiredFields: ['Test name', 'Batch', 'Measurement', 'Result'],
    details: 'Review laboratory tests and quality sample reports.',
  },
  {
    id: 'packaging',
    path: '/packaging',
    label: 'Packaging Usage',
    icon: 'mdi:box-seal',
    component: PackagingPanel,
    requiredFields: ['Packaging type', 'Batch', 'Usage quantity'],
    details: 'Track packaging material consumption and usage statistics.',
  },
  {
    id: 'dispatch',
    path: '/dispatch',
    label: 'Dispatch & Delivery',
    icon: 'mdi:truck-delivery-outline',
    component: DispatchPanel,
    requiredFields: ['Dispatch date', 'Vehicle', 'Shipment status'],
    details: 'Manage dispatch orders, delivery schedules and logistics.',
  },
  {
    id: 'expense',
    path: '/expense',
    label: 'Expense Tracker',
    icon: 'mdi:receipt-text-outline',
    component: ExpensePanel,
    requiredFields: ['Date', 'Category', 'Amount', 'Vendor'],
    details: 'Track operational expenses — fuel, utilities, wages, raw materials, maintenance.',
  },
  {
    id: 'compliance',
    path: '/compliance',
    label: 'FSSAI & Compliance',
    icon: 'mdi:certificate-outline',
    component: CompliancePanel,
    requiredFields: ['License type', 'License number', 'Expiry date'],
    details: 'Track FSSAI, GST, ISO, Factory License and other regulatory filings.',
  },
  {
    id: 'reports',
    path: '/reports',
    label: 'Reports Export',
    icon: 'mdi:file-chart-outline',
    component: ReportsPanel,
    requiredFields: ['Report name', 'Date range', 'Export format'],
    details: 'Generate performance reports and download exports.',
  },
  {
    id: 'documents',
    path: '/documents',
    label: 'Documents Archive',
    icon: 'mdi:folder-outline',
    component: DocumentsPanel,
    requiredFields: ['Document title', 'Module', 'Upload date'],
    details: 'Store and search archived documents for all modules.',
  },
  {
    id: 'notifications',
    path: '/notifications',
    label: 'Notifications',
    icon: 'mdi:bell-outline',
    component: NotificationsPanel,
    requiredFields: ['Message', 'Priority', 'Module'],
    details: 'View system and user notifications across the ERP.',
  },
  {
    id: 'help',
    path: '/help',
    label: 'Help Center',
    icon: 'mdi:help-circle-outline',
    component: HelpPanel,
    requiredFields: ['FAQ', 'Search query', 'Support topic'],
    details: 'Get module guidance, FAQs, and support workflows.',
  },
];

export const MODULE_GROUPS = [
  {
    title: 'EXECUTIVE & SYSTEM',
    items: ['dashboard', 'org', 'users', 'roles', 'factories', 'departments', 'settings', 'audit'],
  },
  {
    title: 'HR & RFID ATTENDANCE',
    items: ['employees', 'rfid_attendance', 'shifts', 'leaves', 'payroll'],
  },
  {
    title: 'SALES & CRM',
    items: ['crm', 'leads', 'customers', 'sales', 'finance', 'expense'],
  },
  {
    title: 'MATERIALS & INVENTORY',
    items: ['suppliers', 'purchase', 'rawmaterial', 'warehouse', 'inventory'],
  },
  {
    title: 'PRODUCTION & MACHINES',
    items: ['planning', 'production', 'batches', 'machine', 'machine_operation', 'maintenance'],
  },
  {
    title: 'QUALITY & LOGISTICS',
    items: ['quality', 'laboratory', 'packaging', 'dispatch', 'compliance'],
  },
  {
    title: 'REPORTS & UTILITIES',
    items: ['reports', 'notifications', 'documents', 'help'],
  },
];

export const MODULE_MAP = MODULE_ROUTE_ITEMS.reduce((acc, item) => {
  acc[item.id] = item;
  acc[item.path] = item;
  return acc;
}, {});

export const getModuleIdFromPath = (pathname) => {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '' || normalized === '/') return 'dashboard';
  const route = MODULE_MAP[normalized];
  if (route) return route.id;
  return 'dashboard';
};
