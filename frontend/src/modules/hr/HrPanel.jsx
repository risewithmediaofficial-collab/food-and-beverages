import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { api } from '../../lib/api';
import ExportDataToolbar from '../../components/ExportDataToolbar';

const DEPARTMENTS = [
  'Executive',
  'Sales & CRM',
  'Plant Operations',
  'Machine Operations',
  'QC Lab',
  'Packaging & Warehousing',
  'Logistics & Dispatch',
  'Accounts & Finance',
  'HR & Admin',
];

const SHIFTS = ['Morning Shift', 'Evening Shift', 'Night Shift', 'General Shift'];

const FALLBACK_ROLES = [
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

const emptyEmployee = {
  name: '',
  username: '',
  password: '',
  role: 'Employee',
  department: DEPARTMENTS[2],
  shift: SHIFTS[0],
  phone: '',
  basicSalary: '25000',
  rfidCardNo: '',
  status: 'Active',
};

export default function HrPanel({ triggerError }) {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [messageModalEmp, setMessageModalEmp] = useState(null);
  const [newEmp, setNewEmp] = useState(emptyEmployee);

  const roleOptions = roles.length ? roles : FALLBACK_ROLES;

  useEffect(() => {
    loadEmployees();
    loadRoles();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr/employees');
      setEmployees(res.success && Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Failed to load employees:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await api.get('/auth/roles');
      if (res.success && Array.isArray(res.data)) {
        setRoles(res.data.filter((role) => (role.status || 'Active') === 'Active'));
      }
    } catch (err) {
      console.warn('Failed to load roles:', err);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const name = newEmp.name.trim();
    const generatedUsername = newEmp.username.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@juice-erp.com`;
    const password = newEmp.password.trim();

    if (!password) {
      if (triggerError) triggerError('Password is required for the new login account');
      return;
    }

    const payload = {
      empId: `EMP-${100 + employees.length + 1}`,
      name,
      username: generatedUsername,
      password,
      email: generatedUsername,
      designation: newEmp.role,
      department: newEmp.department,
      shift: newEmp.shift,
      phone: newEmp.phone,
      basicSalary: Number(newEmp.basicSalary || 25000),
      rfidCardNo: newEmp.rfidCardNo || `RF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: newEmp.status || 'Active',
    };

    try {
      setLoading(true);
      const res = await api.post('/hr/employees', payload);
      if (res.success && res.data) {
        setEmployees([res.data, ...employees]);
        if (triggerError) triggerError('Employee and login account created successfully!', 'success');
      } else {
        await loadEmployees();
      }
      setShowAddModal(false);
      setNewEmp(emptyEmployee);
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee record?')) return;
    try {
      await api.delete(`/hr/employees/${id}`);
      setEmployees(employees.filter((emp) => emp._id !== id));
      if (triggerError) triggerError('Employee deleted', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete employee');
    }
  };

  const handleClearAllEmployees = async () => {
    if (!window.confirm('WARNING: Are you sure you want to DELETE ALL employees? This action cannot be undone.')) return;
    try {
      setLoading(true);
      await api.delete('/hr/employees/all');
      setEmployees([]);
      if (triggerError) triggerError('All employee records cleared!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to clear employees');
    } finally {
      setLoading(false);
    }
  };

  const copyLoginMessage = (emp) => {
    const username = emp.username || emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '')}@juice-erp.com`;
    const text = `Hello ${emp.name},\nYour JuiceFlow ERP account has been created.\n\nUsername/Email: ${username}\nRole: ${emp.designation || emp.role}\nDepartment: ${emp.department}\nPortal Link: ${window.location.origin}\n\nUse the password shared by your administrator.`;
    navigator.clipboard.writeText(text);
    if (triggerError) triggerError('Login message copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:account-badge-outline" className="text-orange-500 text-base" />
            Employee Master & Access
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Manage employee directory, role/designation assignment, and ERP login access
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {employees.length > 0 && (
            <button
              onClick={handleClearAllEmployees}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Icon icon="mdi:trash-can-outline" className="text-sm" /> Clear All
            </button>
          )}
          <ExportDataToolbar data={employees} filename="employees_master" />
          <button
            onClick={() => { setNewEmp(emptyEmployee); setShowAddModal(true); }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add New Employee
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
            <Icon icon="mdi:account-group-outline" className="text-5xl text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No Employees Found</p>
            <p className="text-xs text-slate-400 text-center max-w-sm">
              The employee directory is currently empty. Add employees manually and assign the correct ERP role.
            </p>
            <button
              onClick={() => { setNewEmp(emptyEmployee); setShowAddModal(true); }}
              className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              + Add First Employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[780px]">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-widest border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-4">Emp ID</th>
                  <th className="p-4">Employee Name</th>
                  <th className="p-4">Role / Designation</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Login Username / Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const empIdKey = emp._id || emp.id || emp.empId;
                  const username = emp.username || emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '')}@juice-erp.com`;

                  return (
                    <tr key={empIdKey} className="hover:bg-slate-50/60 transition">
                      <td className="p-4 font-mono font-bold text-slate-900">{emp.empId || 'EMP-101'}</td>
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{emp.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{emp.designation || emp.role || 'Employee'}</td>
                      <td className="p-4 text-slate-500">{emp.department || 'Operations'}</td>
                      <td className="p-4 font-mono text-orange-600 font-medium">{username}</td>
                      <td className="p-4">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {emp.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => setMessageModalEmp(emp)}
                            className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Copy Login Message"
                          >
                            <Icon icon="mdi:send-outline" className="text-xs" /> Login Msg
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp._id || emp.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition cursor-pointer"
                            title="Delete Employee"
                          >
                            <Icon icon="mdi:trash-can-outline" className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Add New Employee Profile</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Assign a role/designation and create the login account</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                <Icon icon="mdi:close" className="text-base text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newEmp.name}
                    onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Role / Designation *</label>
                  <select
                    required
                    value={newEmp.role}
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Department *</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
                  >
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Shift</label>
                  <select
                    value={newEmp.shift}
                    onChange={(e) => setNewEmp({ ...newEmp, shift: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
                  >
                    {SHIFTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-orange-800 font-bold text-xs">
                  <Icon icon="mdi:shield-key-outline" className="text-base text-orange-600" />
                  <span>Login Access</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Username / Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@juice-erp.com"
                      value={newEmp.username}
                      onChange={(e) => setNewEmp({ ...newEmp, username: e.target.value })}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Set initial password"
                      value={newEmp.password}
                      onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={newEmp.phone}
                    onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Basic Salary</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={newEmp.basicSalary}
                    onChange={(e) => setNewEmp({ ...newEmp, basicSalary: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Save & Create Login Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {messageModalEmp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:send-outline" className="text-orange-500 text-lg" />
                <h3 className="text-sm font-extrabold text-slate-900">Login Message</h3>
              </div>
              <button onClick={() => setMessageModalEmp(null)} className="p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                <Icon icon="mdi:close" className="text-base text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800">{messageModalEmp.name}</div>
                <div className="text-xs text-slate-500">{messageModalEmp.designation || messageModalEmp.role} - {messageModalEmp.department}</div>
                <div className="pt-2 border-t border-slate-200 text-xs font-mono">
                  <span className="text-slate-400">Username:</span>{' '}
                  <span className="font-bold text-orange-600">{messageModalEmp.username || messageModalEmp.email || '-'}</span>
                </div>
              </div>

              <textarea
                readOnly
                rows={6}
                value={`Hello ${messageModalEmp.name},\nYour JuiceFlow ERP account has been created.\n\nUsername: ${messageModalEmp.username || messageModalEmp.email || '-'}\nRole: ${messageModalEmp.designation || messageModalEmp.role}\nDepartment: ${messageModalEmp.department}\nPortal Link: ${window.location.origin}\n\nUse the password shared by your administrator.`}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono bg-slate-50 text-slate-700 resize-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => copyLoginMessage(messageModalEmp)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Icon icon="mdi:content-copy" className="text-base" /> Copy Message
                </button>
                <button
                  onClick={() => setMessageModalEmp(null)}
                  className="px-4 border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
