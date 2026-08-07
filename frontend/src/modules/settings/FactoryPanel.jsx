import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import logo from '../../assets/hero.png';
import { api } from '../../lib/api';
import BackButton from '../../components/BackButton';
import useMountAnimation from '../../lib/useMountAnimation';
import { useNavigate } from 'react-router-dom';

export default function FactoryPanel({ user, triggerError }) {
  const [factories, setFactories] = useState([]);
  const mountCls = useMountAnimation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFactory, setEditingFactory] = useState(null);
  const [formData, setFormData] = useState({
    plantCode: '',
    name: '',
    location: '',
    linesCount: 2,
    capacityPerDay: '50,000 Liters',
    plantManager: 'General Manager',
    status: 'Operating',
  });

  useEffect(() => {
    fetchFactories();
  }, []);

  const fetchFactories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/org/factories');
      if (res.success && Array.isArray(res.data)) {
        setFactories(res.data);
      } else {
        setFactories([]);
      }
    } catch (err) {
      console.warn('Failed to load factories from API:', err);
      setFactories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFactory = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/org/factories', formData);
      if (res.success && res.data) {
        setFactories([res.data, ...factories]);
        setShowAddModal(false);
        setFormData({ plantCode: '', name: '', location: '', linesCount: 2, capacityPerDay: '50,000 Liters', plantManager: 'General Manager', status: 'Operating' });
        if (triggerError) triggerError('Manufacturing plant registered successfully!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create factory');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFactory = async (e) => {
    e.preventDefault();
    if (!editingFactory) return;
    try {
      setLoading(true);
      const res = await api.put(`/org/factories/${editingFactory._id}`, formData);
      if (res.success && res.data) {
        setFactories(factories.map(f => (f._id === editingFactory._id ? res.data : f)));
        setEditingFactory(null);
        if (triggerError) triggerError('Plant configuration updated!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update factory');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFactory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this manufacturing plant?')) return;
    try {
      setLoading(true);
      await api.delete(`/org/factories/${id}`);
      setFactories(factories.filter(f => f._id !== id));
      if (triggerError) triggerError('Plant removed!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to remove factory');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (f) => {
    setEditingFactory(f);
    setFormData({
      plantCode: f.plantCode || f.code || '',
      name: f.name || '',
      location: f.location || '',
      linesCount: f.linesCount || 1,
      capacityPerDay: f.capacityPerDay || '50,000 Liters',
      plantManager: f.plantManager || 'General Manager',
      status: f.status || 'Operating',
    });
  };

  return (
    <div className={`space-y-6 font-sans transition duration-300 ease-out ${mountCls}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:factory" className="text-orange-500 text-lg" /> Multi-Factory & Manufacturing Plant Master
          </h2>
          <p className="text-xs text-slate-400">Manage plant units, bottling lines, daily production capacity, and facility managers</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar
            data={factories.map(f => ({
              plantCode: f.plantCode || f.code || '',
              name: f.name || '',
              location: f.location || '',
              linesCount: f.linesCount || 0,
              capacityPerDay: f.capacityPerDay || '',
              plantManager: f.plantManager || '',
              status: f.status || '',
            }))}
            filename="manufacturing_factories_master"
            title="Manufacturing Plant Master"
          />
          <button
            onClick={() => {
              const printWindow = window.open('', '_blank');
              if (!printWindow) { alert('Please allow popups to enable printing.'); return; }
              const styles = `@page { size: A4 landscape; margin: 10mm; } body{font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;color:#0f172a;margin:15px;font-size:11px} .logo{height:40px;margin-bottom:8px} table{width:100%;border-collapse:collapse;margin-top:10px} th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left;word-break:break-word} th{background:#ea580c;color:#fff;font-weight:bold} tr:nth-child(even) td { background:#f8fafc; }`;
              const rows = factories.map(f => `
                <tr>
                  <td>${(f.plantCode||f.code||'').replace(/</g,'&lt;')}</td>
                  <td>${(f.name||'').replace(/</g,'&lt;')}</td>
                  <td>${(f.location||'').replace(/</g,'&lt;')}</td>
                  <td>${f.linesCount||0}</td>
                  <td>${(f.capacityPerDay||'').replace(/</g,'&lt;')}</td>
                  <td>${(f.plantManager||'').replace(/</g,'&lt;')}</td>
                  <td>${(f.status||'').replace(/</g,'&lt;')}</td>
                </tr>`).join('');
              const html = `
                <html><head><title>Manufacturing Plants</title><style>${styles}</style></head>
                <body>
                  <img src="${logo}" class="logo" />
                  <h1>Manufacturing Plant Master</h1>
                  <table>
                    <thead><tr><th>Plant Code</th><th>Name</th><th>Location</th><th>Lines</th><th>Capacity</th><th>Manager</th><th>Status</th></tr></thead>

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
              setFormData({ plantCode: `PLANT-0${factories.length + 1}`, name: '', location: '', linesCount: 2, capacityPerDay: '50,000 Liters', plantManager: 'General Manager', status: 'Operating' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add Manufacturing Plant
          </button>
        </div>
      </div>

      {(showAddModal || editingFactory) && (
        <form onSubmit={editingFactory ? handleUpdateFactory : handleCreateFactory} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:factory" className="text-orange-500 text-base" />
                          <div className="w-full sm:w-auto mt-3 sm:mt-0">
                            <BackButton to="/settings" label="Back" />
                            <span className="text-xs text-slate-400">Settings / Factories</span>
                          </div>
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingFactory(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Plant Code *</label>
              <input
                type="text"
                required
                value={formData.plantCode}
                onChange={(e) => setFormData({ ...formData, plantCode: e.target.value })}
                placeholder="e.g. PLANT-03"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Plant Facility Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ahmedabad Beverage & Processing Plant #3"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Industrial Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. GIDC Sanand, Ahmedabad"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Bottling / Processing Lines *</label>
              <input
                type="number"
                required
                min={1}
                value={formData.linesCount}
                onChange={(e) => setFormData({ ...formData, linesCount: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Daily Capacity *</label>
              <input
                type="text"
                required
                value={formData.capacityPerDay}
                onChange={(e) => setFormData({ ...formData, capacityPerDay: e.target.value })}
                placeholder="e.g. 60,000 Liters"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Plant General Manager</label>
              <input
                type="text"
                value={formData.plantManager}
                onChange={(e) => setFormData({ ...formData, plantManager: e.target.value })}
                placeholder="e.g. Suresh Patil"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Operational Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Operating">Operating</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Expansion">Expansion</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingFactory(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingFactory ? 'Update Facility' : 'Save Plant Facility'}
            </button>
          </div>
        </form>
      )}

      {factories.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:factory" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Manufacturing Plants Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no plant facilities configured in the master registry. Click below to add a manufacturing plant.</p>
          <button
            onClick={() => {
              setFormData({ plantCode: 'PLANT-01', name: '', location: '', linesCount: 2, capacityPerDay: '50,000 Liters', plantManager: 'General Manager', status: 'Operating' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add First Plant Facility
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {factories.map((f) => (
            <div key={f._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3 relative group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-orange-600">{f.plantCode || f.code}</span>
                  <h3 className="font-bold text-slate-900 text-base mt-0.5">{f.name}</h3>
                  <span className="text-xs text-slate-400 font-mono block">{f.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                    {f.status || 'Operating'}
                  </span>
                  <button
                    onClick={() => openEditModal(f)}
                    title="Edit Facility"
                    className="p-1 hover:bg-slate-100 text-slate-600 rounded-md transition cursor-pointer"
                  >
                    <Icon icon="mdi:pencil-outline" className="text-base" />
                  </button>
                  <button
                    onClick={() => handleDeleteFactory(f._id)}
                    title="Delete Facility"
                    className="p-1 hover:bg-rose-50 text-rose-600 rounded-md transition cursor-pointer"
                  >
                    <Icon icon="mdi:trash-can-outline" className="text-base text-rose-500" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Bottling Lines</span>
                  <span className="text-sm font-mono font-extrabold text-blue-700">{f.linesCount || 1} Lines Active</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Daily Capacity</span>
                  <span className="text-sm font-mono font-extrabold text-orange-600">{f.capacityPerDay || '50,000 Liters'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
