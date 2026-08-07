import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import logo from '../../assets/hero.png';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import useMountAnimation from '../../lib/useMountAnimation';

export default function DepartmentPanel({ user, triggerError }) {
  const [departments, setDepartments] = useState([]);
  const mountCls = useMountAnimation();

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    deptCode: '',
    name: '',
    costCenter: '',
    headName: '',
    staffCount: 5,
    budget: 1500000,
    status: 'Active',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const navigate = useNavigate();

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/org/departments');
      if (res.success && Array.isArray(res.data)) {
        setDepartments(res.data);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.warn('Failed to load departments from API:', err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/org/departments', formData);
      if (res.success && res.data) {
        setDepartments([res.data, ...departments]);
        setShowAddModal(false);
        setFormData({ deptCode: '', name: '', costCenter: '', headName: '', staffCount: 5, budget: 1500000, status: 'Active' });
        if (triggerError) triggerError('Department created successfully!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDept = async (e) => {
    e.preventDefault();
    if (!editingDept) return;
    try {
      setLoading(true);
      const res = await api.put(`/org/departments/${editingDept._id}`, formData);
      if (res.success && res.data) {
        setDepartments(departments.map(d => (d._id === editingDept._id ? res.data : d)));
        setEditingDept(null);
        if (triggerError) triggerError('Department updated!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update department');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      setLoading(true);
      await api.delete(`/org/departments/${id}`);
      setDepartments(departments.filter(d => d._id !== id));
      if (triggerError) triggerError('Department removed!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to remove department');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (d) => {
    setEditingDept(d);
    setFormData({
      deptCode: d.deptCode || d.code || '',
      name: d.name || '',
      costCenter: d.costCenter || '',
      headName: d.headName || '',
      staffCount: d.staffCount || 5,
      budget: d.budget || 1000000,
      status: d.status || 'Active',
    });
  };

  return (
    <div className={`space-y-6 font-sans transition duration-300 ease-out ${mountCls}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:office-building" className="text-orange-500 text-lg" /> Enterprise Department & Cost Center Hierarchy
          </h2>
          <p className="text-xs text-slate-400">Department structures, financial cost center allocation, HOD assignments, and personnel counts</p>
        </div>

        <div className="w-full sm:w-auto mt-3 sm:mt-0 flex items-center gap-3">
          <BackButton to="/settings" label="Back" />
          <span className="text-xs text-slate-400">Settings / Departments</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar
            data={departments.map(d => ({
              deptCode: d.deptCode || d.code || '',
              name: d.name || '',
              costCenter: d.costCenter || '',
              headName: d.headName || '',
              staffCount: d.staffCount || 0,
              budget: d.budget || 0,
              status: d.status || 'Active',
            }))}
            filename="departments_cost_centers"
            title="Department Cost Center Setup"
          />
          <button
            onClick={() => {
              const printWindow = window.open('', '_blank');
              if (!printWindow) { alert('Please allow popups to enable printing.'); return; }
              const styles = `@page { size: A4 landscape; margin: 10mm; } body{font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;color:#0f172a;margin:15px;font-size:11px} .logo{height:40px;margin-bottom:8px} table{width:100%;border-collapse:collapse;margin-top:10px} th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left;word-break:break-word} th{background:#ea580c;color:#fff;font-weight:bold} tr:nth-child(even) td { background:#f8fafc; }`;
              const rows = departments.map(d => `
                <tr>
                  <td>${(d.deptCode||d.code||'').replace(/</g,'&lt;')}</td>
                  <td>${(d.name||'').replace(/</g,'&lt;')}</td>
                  <td>${(d.costCenter||'').replace(/</g,'&lt;')}</td>
                  <td>${(d.headName||'').replace(/</g,'&lt;')}</td>
                  <td>${d.staffCount||0}</td>
                  <td>₹${(d.budget||0).toLocaleString()}</td>
                  <td>${(d.status||'Active').replace(/</g,'&lt;')}</td>
                </tr>`).join('');
              const html = `
                <html><head><title>Departments</title><style>${styles}</style></head>
                <body>
                  <img src="${logo}" class="logo" />
                  <h1>Department Cost Center Setup</h1>
                  <table>
                    <thead><tr><th>Dept Code</th><th>Name</th><th>Cost Center</th><th>HOD</th><th>Staff</th><th>Budget</th><th>Status</th></tr></thead>
                    <tbody>${rows}</tbody>
                  </table>
                  <script>window.onload=function(){window.print();setTimeout(()=>window.close(),250)}</script>
                </body></html>`;
              printWindow.document.write(html); printWindow.document.close(); printWindow.focus();
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 transition"
          >
            <Icon icon="mdi:printer" className="text-base" /> Print
          </button>
          <button
            onClick={() => {
              setFormData({ deptCode: `DEP-0${departments.length + 1}`, name: '', costCenter: `CC-${200 + departments.length * 100}`, headName: '', staffCount: 5, budget: 1500000, status: 'Active' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add Department
          </button>
        </div>
      </div>

      {(showAddModal || editingDept) && (
        <form onSubmit={editingDept ? handleUpdateDept : handleCreateDept} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:office-building" className="text-orange-500 text-base" />
              {editingDept ? `Edit Department (${editingDept.name})` : 'Create New Enterprise Department'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingDept(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Department Code *</label>
              <input
                type="text"
                required
                value={formData.deptCode}
                onChange={(e) => setFormData({ ...formData, deptCode: e.target.value })}
                placeholder="e.g. DEP-LOG"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Department Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Logistics & Supply Dispatch"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Cost Center Code *</label>
              <input
                type="text"
                required
                value={formData.costCenter}
                onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                placeholder="e.g. CC-501"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Head of Department (HOD) *</label>
              <input
                type="text"
                required
                value={formData.headName}
                onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                placeholder="e.g. Rajesh Deshmukh"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Staff / Personnel Count *</label>
              <input
                type="number"
                required
                min={1}
                value={formData.staffCount}
                onChange={(e) => setFormData({ ...formData, staffCount: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Annual Budget Allocation (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
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
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingDept(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingDept ? 'Update Department' : 'Save Department'}
            </button>
          </div>
        </form>
      )}

      {departments.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:sitemap-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Enterprise Departments Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no organizational departments registered. Click below to add a department.</p>
          <button
            onClick={() => {
              setFormData({ deptCode: 'DEP-01', name: '', costCenter: '', headName: '', staffCount: 5, budget: 1500000, status: 'Active' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add First Department
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Department Code</th>
                  <th className="p-4">Department Name</th>
                  <th className="p-4">Cost Center Code</th>
                  <th className="p-4">Head of Department (HOD)</th>
                  <th className="p-4">Personnel Count</th>
                  <th className="p-4">Annual Budget Allocation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{d.deptCode || d.code}</td>
                    <td className="p-4 font-bold text-slate-900">{d.name}</td>
                    <td className="p-4 font-mono text-slate-600">{d.costCenter || 'CC-100'}</td>
                    <td className="p-4 font-bold text-slate-800">{d.headName || 'N/A'}</td>
                    <td className="p-4 font-mono font-extrabold text-blue-700">{d.staffCount || 0} Staff</td>
                    <td className="p-4 font-mono font-bold text-emerald-600">₹{(d.budget || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                        {d.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(d)}
                          title="Edit Department"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                        >
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteDept(d._id)}
                          title="Delete Department"
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
