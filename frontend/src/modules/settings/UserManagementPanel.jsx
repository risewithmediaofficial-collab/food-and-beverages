import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import useMountAnimation from '../../lib/useMountAnimation';

export default function UserManagementPanel({ user, triggerError }) {
  const mountCls = useMountAnimation();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userStats, setUserStats] = useState({ totalUsers: 0, liveUsers: 0, inactiveUsers: 0 });

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
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

  const [factories, setFactories] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchFactories();
  }, []);

  const fetchFactories = async () => {
    try {
      const res = await api.get('/org/factories');
      if (res.success && Array.isArray(res.data)) {
        setFactories(res.data);
      }
    } catch (e) {
      console.warn('Failed to load factories for user panel:', e);
    }
  };

  const defaultRolesList = [
    { roleName: 'Employee', accessLevel: 'Employee Self Service Portal' },
    { roleName: 'Line Operator', accessLevel: 'Machine Operations Portal' },
    { roleName: 'Plant Supervisor', accessLevel: 'Production & Planning Portal' },
    { roleName: 'Quality Inspector', accessLevel: 'QA Lab & Testing Portal' },
    { roleName: 'Sales Lead', accessLevel: 'Sales & CRM Portal' },
    { roleName: 'Inventory Manager', accessLevel: 'Inventory & Warehouse Portal' },
    { roleName: 'Accounts Specialist', accessLevel: 'Finance & Billing Portal' },
    { roleName: 'HR Manager', accessLevel: 'HR & Employee Portal' },
    { roleName: 'General Manager', accessLevel: 'Organization Manager' },
  ];

  const combinedRolesMap = new Map();
  defaultRolesList.forEach((r) => combinedRolesMap.set(r.roleName, r));
  roles.forEach((r) => {
    const name = r.roleName || r.name;
    if (name) combinedRolesMap.set(name, { ...r, roleName: name });
  });
  const roleOptions = Array.from(combinedRolesMap.values());

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
        setUserStats(res.meta || { totalUsers: res.data.length, liveUsers: res.data.length, inactiveUsers: 0 });
      } else {
        setUsers([]);
        setUserStats({ totalUsers: 0, liveUsers: 0, inactiveUsers: 0 });
      }
    } catch (err) {
      console.warn('Unable to load users from API:', err);
      setUsers([]);
      setUserStats({ totalUsers: 0, liveUsers: 0, inactiveUsers: 0 });
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

  const navigate = useNavigate();
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
    <div className={`space-y-6 font-sans transition duration-300 ease-out ${mountCls}`}>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full xl:w-auto">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:account-group" className="text-orange-500 text-lg" /> Live User Accounts
            </h2>
            <p className="text-xs text-slate-400">Super Admin view of active organization login accounts and available user count</p>
          </div>
          <div className="w-full sm:w-auto mt-1 sm:mt-0 flex items-center gap-3 shrink-0">
            <BackButton to="/settings" label="Back" />
            <span className="text-xs text-slate-400 whitespace-nowrap">Settings / User Management</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto justify-start sm:justify-end">
          {/* Export only selected fields to avoid leaking internal fields like passwordHash */}
          <ExportDataToolbar
            data={users.map(u => ({
              empId: u.empId || (u._id ? u._id.substring(0, 8) : ''),
              name: u.name || '',
              email: u.email || '',
              role: u.role || u.roleName || '',
              department: u.department || '',
              facility: u.plant || 'Nashik Facility #1',
              status: u.status || 'Active',
            }))}
            filename="user_accounts_directory"
            title="System User Accounts"
          />
          <button
            onClick={() => {
              // Print the visible users table
              const printWindow = window.open('', '_blank');
              if (!printWindow) {
                alert('Please allow popups to enable printing.');
                return;
              }
              const styles = `
                @page { size: A4 landscape; margin: 10mm; }
                body{font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;color:#0f172a;margin:15px;font-size:11px}
                table{width:100%;border-collapse:collapse;margin-top:10px}
                th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left;word-break:break-word}
                th{background:#ea580c;color:#fff;font-weight:bold}
                tr:nth-child(even) td { background:#f8fafc; }
              `;
              const rows = users.map(u => `
                <tr>
                  <td>${u.empId || (u._id ? u._id.substring(0,8) : '')}</td>
                  <td>${(u.name||'').replace(/</g,'&lt;')}</td>
                  <td>${(u.email||'').replace(/</g,'&lt;')}</td>
                  <td>${(u.role||u.roleName||'').replace(/</g,'&lt;')}</td>
                  <td>${(u.department||'').replace(/</g,'&lt;')}</td>
                  <td>${(u.plant||'Nashik Facility #1').replace(/</g,'&lt;')}</td>
                  <td>${(u.status||'Active').replace(/</g,'&lt;')}</td>
                </tr>`).join('');

              const html = `
                <html>
                  <head><title>System User Accounts</title><style>${styles}</style></head>
                  <body>
                    <h1>System User Accounts</h1>
                    <table>
                      <thead>
                        <tr>
                          <th>Employee ID</th>
                          <th>User Name</th>
                          <th>Email Address</th>
                          <th>Assigned Role</th>
                          <th>Department</th>
                          <th>Facility</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${rows}
                      </tbody>
                    </table>
                    <script>window.onload=function(){window.print();setTimeout(()=>window.close(),250)}</script>
                  </body>
                </html>`;

              printWindow.document.write(html);
              printWindow.document.close();
              printWindow.focus();
            }}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer h-9 shadow-xs"
          >
            <Icon icon="mdi:printer" className="text-sm text-slate-600" /> Print
          </button>
          <button
            onClick={() => {
              setFormData({ name: '', email: '', role: 'Employee', department: 'Executive', plant: 'Nashik Facility #1', password: '', status: 'Active' });
              setShowNewPassword(false);
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer whitespace-nowrap shrink-0 h-9"
          >
            <Icon icon="mdi:plus" className="text-sm" /> Add New User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Users</div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600">{userStats.liveUsers}</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Accounts</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{userStats.totalUsers}</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inactive / Suspended</div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600">{userStats.inactiveUsers}</div>
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
                placeholder="e.g. Sathish Kumar"
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
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Set initial password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-xs text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center px-1.5 text-slate-400 hover:text-slate-700"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon icon={showNewPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} className="text-base" />
                  </button>
                </div>
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
                {factories.length > 0 ? (
                  factories.map((f) => (
                    <option key={f._id} value={f.name || f.plantCode}>
                      {f.name} ({f.location || 'Processing Plant'})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Nashik Facility #1">Nashik Facility #1</option>
                    <option value="Pune Bottling Plant #2">Pune Bottling Plant #2</option>
                  </>
                )}
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
          <h3 className="text-sm font-bold text-slate-800">No User Accounts Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Create user accounts using the <span className="font-semibold">Add New User</span> button.</p>
          <button
            onClick={() => {
              setFormData({ name: '', email: '', role: 'Employee', department: 'Executive', plant: 'Nashik Facility #1', password: '', status: 'Active' });
              setShowNewPassword(false);
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
