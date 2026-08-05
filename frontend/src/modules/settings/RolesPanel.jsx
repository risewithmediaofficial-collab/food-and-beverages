import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

const LOCKED_PERMISSIONS = ['DASHBOARD', 'ATTENDANCE'];

const PERMISSION_GROUPS = [
  {
    title: 'Mandatory',
    icon: 'mdi:lock-check-outline',
    options: [
      { value: 'DASHBOARD', label: 'Dashboard' },
      { value: 'ATTENDANCE', label: 'Attendance' },
    ],
  },
  {
    title: 'Executive & System',
    icon: 'mdi:view-dashboard-outline',
    options: [
      { value: 'ORG', label: 'Organization' },
      { value: 'SETTINGS', label: 'Settings' },
      { value: 'AUDIT', label: 'Audit Logs' },
      { value: 'USERS', label: 'User Management' },
      { value: 'ROLES', label: 'Roles & Permissions' },
      { value: 'FACTORIES', label: 'Factories' },
      { value: 'DEPARTMENTS', label: 'Departments' },
    ],
  },
  {
    title: 'HR',
    icon: 'mdi:account-group-outline',
    options: [
      { value: 'EMPLOYEES', label: 'Employee Master' },
      { value: 'SHIFTS', label: 'Shift Management' },
      { value: 'LEAVES', label: 'Leave Management' },
      { value: 'PAYROLL', label: 'Payroll' },
    ],
  },
  {
    title: 'Sales & CRM',
    icon: 'mdi:chart-line',
    options: [
      { value: 'CRM', label: 'CRM Overview' },
      { value: 'LEADS', label: 'Lead Management' },
      { value: 'CUSTOMERS', label: 'Customers' },
      { value: 'SALES', label: 'Sales & Invoices' },
      { value: 'FINANCE', label: 'Finance & Ledger' },
      { value: 'EXPENSE', label: 'Expense Tracker' },
      { value: 'REPORTS', label: 'Reports' },
    ],
  },
  {
    title: 'Procurement & Inventory',
    icon: 'mdi:package-variant-closed',
    options: [
      { value: 'SUPPLIERS', label: 'Suppliers' },
      { value: 'PURCHASE', label: 'Purchase Orders' },
      { value: 'RAWMATERIAL', label: 'Raw Materials' },
      { value: 'BOM', label: 'BOM / Recipes' },
      { value: 'WAREHOUSE', label: 'Warehouses' },
      { value: 'INVENTORY', label: 'Inventory Stock' },
    ],
  },
  {
    title: 'Production & Machines',
    icon: 'mdi:factory',
    options: [
      { value: 'PLANNING', label: 'Production Planning' },
      { value: 'PRODUCTION', label: 'Production Orders' },
      { value: 'BATCHES', label: 'Batch Management' },
      { value: 'MACHINE', label: 'Machine Master' },
      { value: 'MACHINE_OPERATION', label: 'Machine Operation' },
      { value: 'MAINTENANCE', label: 'Maintenance' },
    ],
  },
  {
    title: 'Quality & Logistics',
    icon: 'mdi:shield-check-outline',
    options: [
      { value: 'QUALITY', label: 'Quality Control' },
      { value: 'LABORATORY', label: 'Laboratory Reports' },
      { value: 'PACKAGING', label: 'Packaging Usage' },
      { value: 'DISPATCH', label: 'Dispatch & Delivery' },
      { value: 'COMPLIANCE', label: 'FSSAI & Compliance' },
    ],
  },
  {
    title: 'Utilities',
    icon: 'mdi:file-chart-outline',
    options: [
      { value: 'DOCUMENTS', label: 'Documents Archive' },
      { value: 'NOTIFICATIONS', label: 'Notifications' },
      { value: 'HELP', label: 'Help Center' },
    ],
  },
];

const ALL_PERMISSION_VALUES = PERMISSION_GROUPS.flatMap((group) => group.options.map((option) => option.value));

const emptyRole = {
  roleName: '',
  accessLevel: 'Custom Scope Portal',
  permissions: LOCKED_PERMISSIONS.join(', '),
  status: 'Active',
};

const parsePermissionString = (permissions) => (
  String(permissions || '')
    .split(',')
    .map((permission) => permission.trim().toUpperCase())
    .filter(Boolean)
);

const formatPermissions = (permissions) => (
  Array.from(new Set([...LOCKED_PERMISSIONS, ...permissions.map((permission) => permission.toUpperCase())])).join(', ')
);

export default function RolesPanel({ triggerError }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionPicker, setShowPermissionPicker] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState(emptyRole);

  useEffect(() => {
    fetchRoles();
  }, []);

  const selectedPermissions = parsePermissionString(formData.permissions);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/roles');
      setRoles(res.success && Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load roles from API:', err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyRole);
    setEditingRole(null);
    setShowAddModal(false);
    setShowPermissionPicker(false);
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/roles', formData);
      if (res.success && res.data) {
        setRoles([res.data, ...roles]);
        resetForm();
        if (triggerError) triggerError('Role created successfully!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingRole) return;
    try {
      setLoading(true);
      const res = await api.put(`/auth/roles/${editingRole._id}`, formData);
      if (res.success && res.data) {
        setRoles(roles.map((role) => (role._id === editingRole._id ? res.data : role)));
        resetForm();
        if (triggerError) triggerError('Role details updated!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      setLoading(true);
      await api.delete(`/auth/roles/${id}`);
      setRoles(roles.filter((role) => role._id !== id));
      if (triggerError) triggerError('Role deleted successfully!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData(emptyRole);
    setShowAddModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({
      roleName: role.roleName || role.name || '',
      accessLevel: role.accessLevel || 'Custom Scope Portal',
      permissions: formatPermissions(Array.isArray(role.permissions) ? role.permissions : parsePermissionString(role.permissions)),
      status: role.status || 'Active',
    });
    setShowAddModal(true);
  };

  const setPermissions = (permissions) => {
    setFormData({ ...formData, permissions: formatPermissions(permissions) });
  };

  const togglePermission = (permission) => {
    if (LOCKED_PERMISSIONS.includes(permission)) return;
    const current = new Set(selectedPermissions);
    if (current.has(permission)) current.delete(permission);
    else current.add(permission);
    setPermissions(Array.from(current));
  };

  const toggleGroup = (options) => {
    const current = new Set(selectedPermissions);
    const optionValues = options.map((option) => option.value).filter((permission) => !LOCKED_PERMISSIONS.includes(permission));
    const allSelected = optionValues.every((permission) => current.has(permission));
    optionValues.forEach((permission) => {
      if (allSelected) current.delete(permission);
      else current.add(permission);
    });
    setPermissions(Array.from(current));
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:shield-lock-outline" className="text-orange-500 text-lg" />
            Role-Based Access Control (RBAC) & Security Matrix
          </h2>
          <p className="text-xs text-slate-400">Choose module permissions with checkboxes instead of typing comma-separated codes.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={roles} filename="rbac_roles_permissions_matrix" title="Role Access Control Matrix" />
          <button
            onClick={openCreateModal}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add New Role
          </button>
        </div>
      </div>

      {(showAddModal || editingRole) && (
        <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:shield-outline" className="text-orange-500 text-base" />
              {editingRole ? `Edit Role Definition (${editingRole.roleName || editingRole.name})` : 'Define New System Security Role'}
            </h3>
            <button type="button" onClick={resetForm} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <Icon icon="mdi:close" className="text-base" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Role Title / Designation *</label>
              <input
                type="text"
                required
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                placeholder="e.g. Regional Procurement Lead"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Access Portal Scope *</label>
              <input
                type="text"
                required
                value={formData.accessLevel}
                onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                placeholder="e.g. Supply Chain & Purchase Portal"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Granted Permissions *</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setShowPermissionPicker(true)}
                  className="flex-1 bg-slate-50 border border-slate-200 hover:border-orange-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold outline-none flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span>{selectedPermissions.length} permissions selected</span>
                  <span className="inline-flex items-center gap-1 text-orange-600">
                    <Icon icon="mdi:tune-variant" className="text-base" /> Choose Permissions
                  </span>
                </button>
                <div className="sm:w-2/3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-500 font-mono truncate">
                  {formData.permissions}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Role Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingRole ? 'Update Role' : 'Save Role Definition'}
            </button>
          </div>
        </form>
      )}

      {roles.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:shield-lock-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Security Roles Defined</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no role permission scopes configured. Click below to add a new security role.</p>
          <button
            onClick={openCreateModal}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add First Role
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Role Title</th>
                  <th className="p-4">Access Level</th>
                  <th className="p-4">Granted Permissions Scope</th>
                  <th className="p-4">Assigned Active Users</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roles.map((role) => (
                  <tr key={role._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{role.roleName || role.name}</td>
                    <td className="p-4 font-bold text-orange-600">{role.accessLevel}</td>
                    <td className="p-4 font-mono text-xs text-slate-600">
                      {Array.isArray(role.permissions) ? role.permissions.join(', ') : role.permissions}
                    </td>
                    <td className="p-4 font-mono font-extrabold text-blue-700">{role.activeUsers || 1} Users</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                        {role.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(role)}
                          title="Edit Role"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                        >
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role._id)}
                          title="Delete Role"
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <Icon icon="mdi:trash-can-outline" className="text-base text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPermissionPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Icon icon="mdi:shield-check-outline" className="text-orange-500 text-lg" />
                  Choose Role Permissions
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Select only the modules this role should see and use.</p>
              </div>
              <button type="button" onClick={() => setShowPermissionPicker(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                <Icon icon="mdi:close" className="text-base text-slate-500" />
              </button>
            </div>

            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <span className="font-extrabold text-orange-600">{selectedPermissions.length}</span> selected. Dashboard and Attendance are mandatory.
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPermissions(ALL_PERMISSION_VALUES)}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setPermissions(LOCKED_PERMISSIONS)}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Clear Optional
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {PERMISSION_GROUPS.map((group) => {
                  const optionalValues = group.options.map((option) => option.value).filter((permission) => !LOCKED_PERMISSIONS.includes(permission));
                  const allGroupSelected = optionalValues.length > 0 && optionalValues.every((permission) => selectedPermissions.includes(permission));

                  return (
                    <div key={group.title} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon icon={group.icon} className="text-orange-500 text-base shrink-0" />
                          <h4 className="text-xs font-extrabold text-slate-800 truncate">{group.title}</h4>
                        </div>
                        {optionalValues.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.options)}
                            className="text-[10px] font-bold text-orange-600 hover:text-orange-800 cursor-pointer shrink-0"
                          >
                            {allGroupSelected ? 'Clear' : 'All'}
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {group.options.map((option) => {
                          const checked = selectedPermissions.includes(option.value);
                          const locked = LOCKED_PERMISSIONS.includes(option.value);

                          return (
                            <label
                              key={option.value}
                              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                                checked
                                  ? 'bg-white border-orange-200 text-slate-900 shadow-xs'
                                  : 'bg-white/60 border-slate-200 text-slate-500 hover:border-orange-200'
                              } ${locked ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={locked}
                                onChange={() => togglePermission(option.value)}
                                className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="font-bold flex-1">{option.label}</span>
                              <span className="text-[9px] font-mono text-slate-400">{option.value}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPermissionPicker(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Apply Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
