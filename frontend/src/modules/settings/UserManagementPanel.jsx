import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function UserManagementPanel({ user, triggerError }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Employee',
    department: 'Executive',
    plant: 'Nashik Facility #1',
    password: '',
    status: 'Active',
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const roleOptions = roles.length
    ? roles
    : [
      { roleName: 'Employee', accessLevel: 'Employee Self Service Portal' },
      { roleName: 'Line Operator', accessLevel: 'Machine Operations Portal' },
      { roleName: 'Plant Supervisor', accessLevel: 'Production & Planning Portal' },
      { roleName: 'Quality Inspector', accessLevel: 'QA Lab & Testing Portal' },
      { roleName: 'Sales Lead', accessLevel: 'Sales & CRM Portal' },
      { roleName: 'Inventory Manager', accessLevel: 'Inventory & Warehouse Portal' },
      { roleName: 'Accounts Specialist', accessLevel: 'Finance & Billing Portal' },
      { roleName: 'HR Manager', accessLevel: 'HR & Employee Portal' },
      { roleName: 'General Manager', accessLevel: 'Full System Superadmin' },
    ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.warn('Unable to load users from API:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/auth/roles');
      if (res.success && Array.isArray(res.data)) {
        setRoles(res.data.filter((role) => (role.status || 'Active') === 'Active'));
      }
    } catch (err) {
      console.warn('Unable to load roles from API:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/users', formData);
      if (res.success && res.data) {
        setUsers([res.data, ...users]);
        setShowAddModal(false);
        setFormData({ name: '', email: '', role: 'Employee', department: 'Executive', plant: 'Nashik Facility #1', password: '', status: 'Active' });
        if (triggerError) triggerError('User account created successfully!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setLoading(true);
      const res = await api.put(`/auth/users/${editingUser._id}`, formData);
      if (res.success && res.data) {
        setUsers(users.map(u => (u._id === editingUser._id ? res.data : u)));
        setEditingUser(null);
        if (triggerError) triggerError('User account updated!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to remove this user account?')) return;
    try {
      setLoading(true);
      await api.delete(`/auth/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      if (triggerError) triggerError('User account removed!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      role: u.role || u.roleName || 'General Manager',
      department: u.department || 'Executive',
      plant: u.plant || 'Nashik Facility #1',
      status: u.status || 'Active',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:account-group" className="text-orange-500 text-lg" /> System User Accounts & Access Directory
          </h2>
          <p className="text-xs text-slate-400">Manage user login accounts, department assignments, role permissions, and active sessions</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={users} filename="user_accounts_directory" title="System User Accounts" />
          <button
            onClick={() => {
              setFormData({ name: '', email: '', role: 'Employee', department: 'Executive', plant: 'Nashik Facility #1', password: '', status: 'Active' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add New User
          </button>
        </div>
      </div>

      {(showAddModal || editingUser) && (
        <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:account-badge-outline" className="text-orange-500 text-base" />
              {editingUser ? `Edit User Account (${editingUser.name})` : 'Create New System User Account'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Vikram Sharma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. admin@juice-erp.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            {!editingUser && (
              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Set initial password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Assigned Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                {roleOptions.map((role) => {
                  const roleName = role.roleName || role.name;
                  return (
                    <option key={role._id || roleName} value={roleName}>
                      {roleName} - {role.accessLevel || 'Custom Access'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Executive">Executive Management</option>
                <option value="Sales & CRM">Sales & CRM</option>
                <option value="Plant Operations">Plant Operations</option>
                <option value="Machine Operations">Machine Operations</option>
                <option value="QC Lab">QC Lab</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Finance & Ledger">Finance & Ledger</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Assigned Facility *</label>
              <select
                value={formData.plant}
                onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Nashik Facility #1">Nashik Facility #1</option>
                <option value="Pune Bottling Plant #2">Pune Bottling Plant #2</option>
                <option value="All Plants (Corporate HQ)">All Plants (Corporate HQ)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingUser(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingUser ? 'Update Account' : 'Save New User'}
            </button>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:account-group" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No User Accounts Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no user accounts created in the system directory. Click below to add a new user.</p>
          <button
            onClick={() => {
              setFormData({ name: '', email: '', role: 'Employee', department: 'Executive', plant: 'Nashik Facility #1', password: '', status: 'Active' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add First User
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">User Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Facility</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{u.empId || u._id?.substring(0, 6)}</td>
                    <td className="p-4 font-bold text-slate-900">{u.name}</td>
                    <td className="p-4 font-mono text-slate-600">{u.email}</td>
                    <td className="p-4 font-bold text-orange-600">{u.role || u.roleName}</td>
                    <td className="p-4 text-slate-600">{u.department}</td>
                    <td className="p-4 text-slate-500 font-semibold">{u.plant || 'Nashik Facility #1'}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        u.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                        >
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          title="Delete User"
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
