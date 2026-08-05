import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function RolesPanel({ user, triggerError }) {
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    roleName: '',
    accessLevel: 'Custom Scope Portal',
    permissions: '',
    status: 'Active',
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/roles');
      if (res.success && Array.isArray(res.data)) {
        setRoles(res.data);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.warn('Failed to load roles from API:', err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/roles', formData);
      if (res.success && res.data) {
        setRoles([res.data, ...roles]);
        setShowAddModal(false);
        setFormData({ roleName: '', accessLevel: 'Custom Scope Portal', permissions: '', status: 'Active' });
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
        setRoles(roles.map(r => (r._id === editingRole._id ? res.data : r)));
        setEditingRole(null);
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
      setRoles(roles.filter(r => r._id !== id));
      if (triggerError) triggerError('Role deleted successfully!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (r) => {
    setEditingRole(r);
    setFormData({
      roleName: r.roleName || r.name || '',
      accessLevel: r.accessLevel || 'Custom Scope Portal',
      permissions: Array.isArray(r.permissions) ? r.permissions.join(', ') : (r.permissions || ''),
      status: r.status || 'Active',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:shield-lock-outline" className="text-orange-500 text-lg" /> Role-Based Access Control (RBAC) & Security Matrix
          </h2>
          <p className="text-xs text-slate-400">Define access permissions, module read/write capabilities, and security boundaries per role</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={roles} filename="rbac_roles_permissions_matrix" title="Role Access Control Matrix" />
          <button
            onClick={() => {
              setFormData({ roleName: '', accessLevel: 'Custom Scope Portal', permissions: '', status: 'Active' });
              setShowAddModal(true);
            }}
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
            <button type="button" onClick={() => { setShowAddModal(false); setEditingRole(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
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
              <label className="text-xs text-slate-600 font-bold block mb-1">Granted Permissions (Comma separated) *</label>
              <input
                type="text"
                required
                value={formData.permissions}
                onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                placeholder="e.g. PURCHASE, SUPPLIERS, INVENTORY, BOM"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
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
            <button type="button" onClick={() => { setShowAddModal(false); setEditingRole(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
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
            onClick={() => {
              setFormData({ roleName: '', accessLevel: 'Custom Scope Portal', permissions: '', status: 'Active' });
              setShowAddModal(true);
            }}
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
                {roles.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{r.roleName || r.name}</td>
                    <td className="p-4 font-bold text-orange-600">{r.accessLevel}</td>
                    <td className="p-4 font-mono text-xs text-slate-600">
                      {Array.isArray(r.permissions) ? r.permissions.join(', ') : r.permissions}
                    </td>
                    <td className="p-4 font-mono font-extrabold text-blue-700">{r.activeUsers || 1} Users</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                        {r.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(r)}
                          title="Edit Role"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                        >
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(r._id)}
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
    </div>
  );
}
