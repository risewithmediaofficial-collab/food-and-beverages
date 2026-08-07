import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function WarehousePanel({ user, triggerError }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWh, setEditingWh] = useState(null);
  const [formData, setFormData] = useState({
    whCode: '',
    whName: '',
    location: '',
    storageType: 'Cold Storage (Puree & Concentrate)',
    totalCapacity: '50,000 Kg',
    occupiedPct: 50,
    racksCount: 16,
    manager: 'Warehouse Manager',
    status: 'Optimal',
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/warehouses');
      setWarehouses(res?.data || []);
    } catch (err) {
      console.warn('Warehouse fetch failed:', err);
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateWh = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/inventory/warehouses', {
        ...formData,
        whCode: formData.whCode || `WH-${String(warehouses.length + 1).padStart(2, '0')}`,
      });
      setWarehouses([res.data, ...warehouses]);
      setShowAddModal(false);
      setFormData({ whCode: '', whName: '', location: '', storageType: 'Cold Storage (Puree & Concentrate)', totalCapacity: '50,000 Kg', occupiedPct: 50, racksCount: 16, manager: 'Warehouse Manager', status: 'Optimal' });
      if (triggerError) triggerError('Warehouse vault added successfully!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err?.message || 'Failed to create warehouse', 'error');
    }
  };

  const handleUpdateWh = async (e) => {
    e.preventDefault();
    if (!editingWh) return;
    try {
      const res = await api.put(`/inventory/warehouses/${editingWh._id}`, formData);
      setWarehouses(warehouses.map(w => w._id === editingWh._id ? res.data : w));
      setEditingWh(null);
      if (triggerError) triggerError('Warehouse details updated!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err?.message || 'Failed to update warehouse', 'error');
    }
  };

  const handleDeleteWh = async (id) => {
    if (!window.confirm('Delete this warehouse entry?')) return;
    try {
      await api.delete(`/inventory/warehouses/${id}`);
      setWarehouses(warehouses.filter(w => w._id !== id));
      if (triggerError) triggerError('Warehouse removed!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err?.message || 'Failed to delete warehouse', 'error');
    }
  };

  const openEditModal = (w) => {
    setEditingWh(w);
    setFormData({
      whCode: w.whCode || '',
      whName: w.whName || w.name || '',
      location: w.location || '',
      storageType: w.storageType || 'Cold Storage',
      totalCapacity: w.totalCapacity || '50,000 Kg',
      occupiedPct: w.occupiedPct || 50,
      racksCount: w.racksCount || 16,
      manager: w.manager || 'Warehouse Manager',
      status: w.status || 'Optimal',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:warehouse" className="text-orange-500 text-lg" /> Multi-Warehouse, Rack & Bin Master
          </h2>
          <p className="text-xs text-slate-400">Cold storage temperature vaults, packaging stores, rack/shelf allocation, and capacity utilization</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={warehouses} filename="multi_warehouse_master" title="Warehouse Storage Master" />
          <button
            onClick={() => {
              setFormData({ whCode: `WH-0${warehouses.length + 1}`, whName: '', location: '', storageType: 'Cold Storage (Puree & Concentrate)', totalCapacity: '50,000 Kg', occupiedPct: 50, racksCount: 16, manager: 'Warehouse Manager', status: 'Optimal' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add Warehouse
          </button>
        </div>
      </div>

      {(showAddModal || editingWh) && (
        <form onSubmit={editingWh ? handleUpdateWh : handleCreateWh} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:warehouse" className="text-orange-500 text-base" />
              {editingWh ? `Edit Warehouse (${editingWh.whName})` : 'Create New Warehouse Storage Facility'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingWh(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Warehouse Code *</label>
              <input
                type="text"
                required
                value={formData.whCode}
                onChange={(e) => setFormData({ ...formData, whCode: e.target.value })}
                placeholder="e.g. WH-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Warehouse Name *</label>
              <input
                type="text"
                required
                value={formData.whName}
                onChange={(e) => setFormData({ ...formData, whName: e.target.value })}
                placeholder="e.g. Cold Storage Vault #1 (0 - 4°C)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Yard / Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Nashik Plant Main Yard"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Storage Type</label>
              <input
                type="text"
                value={formData.storageType}
                onChange={(e) => setFormData({ ...formData, storageType: e.target.value })}
                placeholder="e.g. Cold Storage (Puree & Concentrate)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Total Capacity</label>
              <input
                type="text"
                value={formData.totalCapacity}
                onChange={(e) => setFormData({ ...formData, totalCapacity: e.target.value })}
                placeholder="e.g. 50,000 Kg"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Assigned Racks Count</label>
              <input
                type="number"
                value={formData.racksCount}
                onChange={(e) => setFormData({ ...formData, racksCount: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Warehouse Manager</label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                placeholder="e.g. Suresh Patil"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Space Occupancy (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.occupiedPct}
                onChange={(e) => setFormData({ ...formData, occupiedPct: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingWh(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {editingWh ? 'Update Warehouse' : 'Save Warehouse'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-xs text-slate-400">Loading warehouses...</div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:warehouse" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Warehouse Facilities Added Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no warehouse vaults or storage bays configured. Click below to add your first warehouse.</p>
          <button
            onClick={() => {
              setFormData({ whCode: 'WH-01', whName: '', location: '', storageType: 'Cold Storage (Puree & Concentrate)', totalCapacity: '50,000 Kg', occupiedPct: 50, racksCount: 16, manager: 'Warehouse Manager', status: 'Optimal' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add First Warehouse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {warehouses.map((w) => (
            <div key={w._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-orange-600">{w.whCode}</span>
                  <h3 className="font-bold text-slate-900 text-base">{w.whName}</h3>
                  <span className="text-xs text-slate-400 font-mono">{w.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                    {w.status || 'Optimal'}
                  </span>
                  <button onClick={() => openEditModal(w)} className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                    <Icon icon="mdi:pencil-outline" className="text-base" />
                  </button>
                  <button onClick={() => handleDeleteWh(w._id)} className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
                    <Icon icon="mdi:trash-can-outline" className="text-base" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Storage Type:</span>
                  <strong className="text-slate-800 font-mono">{w.storageType}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Total Capacity:</span>
                  <strong className="text-slate-900 font-mono">{w.totalCapacity}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Assigned Racks:</span>
                  <strong className="text-blue-700 font-mono">{w.racksCount} Racks</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Warehouse Manager:</span>
                  <strong className="text-slate-800">{w.manager}</strong>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>Space Occupancy</span>
                  <span className="text-orange-600 font-mono">{w.occupiedPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${w.occupiedPct}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
