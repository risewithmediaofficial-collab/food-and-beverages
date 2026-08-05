const MODULE_PERMISSION_MAP = {
  dashboard: ['DASHBOARD'],
  org: ['ORG', 'ORGANIZATION'],
  settings: ['SETTINGS'],
  audit: ['AUDIT'],
  users: ['USERS', 'USER_MANAGEMENT'],
  roles: ['ROLES', 'PERMISSIONS'],
  factories: ['FACTORIES', 'FACTORY'],
  departments: ['DEPARTMENTS'],

  employees: ['EMPLOYEES', 'HR'],
  rfid_attendance: ['ATTENDANCE', 'RFID_ATTENDANCE'],
  shifts: ['SHIFTS', 'HR'],
  leaves: ['LEAVES', 'HR'],
  payroll: ['PAYROLL', 'HR'],

  crm: ['CRM'],
  leads: ['LEADS', 'CRM'],
  customers: ['CUSTOMERS', 'CRM'],
  sales: ['SALES', 'INVOICES'],
  finance: ['FINANCE'],
  expense: ['EXPENSE', 'FINANCE'],

  suppliers: ['SUPPLIERS', 'PURCHASE'],
  purchase: ['PURCHASE'],
  rawmaterial: ['RAWMATERIAL', 'RAW_MATERIAL', 'BOM', 'RECIPES'],
  warehouse: ['WAREHOUSE', 'INVENTORY'],
  inventory: ['INVENTORY'],

  planning: ['PLANNING', 'PRODUCTION'],
  production: ['PRODUCTION'],
  batches: ['BATCHES', 'PRODUCTION'],
  machine: ['MACHINE'],
  machine_operation: ['MACHINE_OPERATION', 'MACHINE'],
  maintenance: ['MAINTENANCE', 'MACHINE'],

  quality: ['QUALITY'],
  laboratory: ['LABORATORY', 'QUALITY'],
  packaging: ['PACKAGING'],
  dispatch: ['DISPATCH'],
  compliance: ['COMPLIANCE'],

  reports: ['REPORTS'],
  documents: ['DOCUMENTS'],
  notifications: ['NOTIFICATIONS'],
  help: ['HELP'],
};

const ADMIN_ROLE_HINTS = ['admin', 'general manager', 'superadmin'];
const ADMIN_PERMISSIONS = ['*', 'ALL', 'ALL_MODULES_FULL_ACCESS'];
const ALWAYS_ALLOWED_MODULES = ['dashboard', 'rfid_attendance'];

export const getUserPermissions = (user) => {
  const rawPermissions = [
    ...(Array.isArray(user?.permissions) ? user.permissions : []),
    ...(Array.isArray(user?.role?.permissions) ? user.role.permissions : []),
  ];

  return new Set(rawPermissions.map((permission) => String(permission).trim().toUpperCase()).filter(Boolean));
};

export const isAdminUser = (user) => {
  const roleName = String(user?.roleName || user?.role?.name || user?.role || '').toLowerCase();
  const permissions = getUserPermissions(user);
  return ADMIN_ROLE_HINTS.some((hint) => roleName.includes(hint)) ||
    ADMIN_PERMISSIONS.some((permission) => permissions.has(permission));
};

export const canAccessModule = (user, moduleId) => {
  if (!moduleId) return false;
  if (isAdminUser(user)) return true;
  if (ALWAYS_ALLOWED_MODULES.includes(moduleId)) return true;

  const permissions = getUserPermissions(user);
  const requiredPermissions = MODULE_PERMISSION_MAP[moduleId] || [moduleId.toUpperCase()];
  return requiredPermissions.some((permission) => permissions.has(permission));
};

export const filterAccessibleGroups = (groups, user) => (
  groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessModule(user, item.id)),
    }))
    .filter((group) => group.items.length > 0)
);

export const firstAccessibleModule = (user, fallback = 'dashboard') => {
  if (canAccessModule(user, fallback)) return fallback;
  return ALWAYS_ALLOWED_MODULES.find((moduleId) => canAccessModule(user, moduleId)) || 'dashboard';
};
