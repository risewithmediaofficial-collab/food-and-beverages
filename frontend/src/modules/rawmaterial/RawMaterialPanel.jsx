import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function RawMaterialPanel({ user, triggerError }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ category: 'Fruit Concentrate', name: '', stockQty: 1000, unit: 'Kg', expDate: '', status: 'Optimal' });
  const [editingMaterial, setEditingMaterial] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/items');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(i => ({
          _id: i._id,
          category: i.category || 'Raw Material',
          name: i.name,
          stockQty: i.currentStock || i.stockQty || 0,
          unit: i.unit || 'Kg',
          expDate: i.expiryDate || 'N/A',
          status: i.status || 'Optimal',
        }));
        setMaterials(mapped);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.warn('Failed to load raw materials from API:', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = (e) => {
    e.preventDefault();
    const created = {
      _id: Date.now().toString(),
      ...newMaterial,
      stockQty: Number(newMaterial.stockQty),
    };
    setMaterials([created, ...materials]);
    setShowAddModal(false);
    setNewMaterial({ category: 'Fruit Concentrate', name: '', stockQty: 1000, unit: 'Kg', expDate: '', status: 'Optimal' });
    if (triggerError) triggerError('Raw material inventory item added!', 'success');
  };

  const handleEditClick = (material) => {
    setEditingMaterial(material);
    setShowEditModal(true);
  };

  const handleUpdateMaterial = (e) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setMaterials(materials.map((m) => (m._id === editingMaterial._id ? { ...editingMaterial, stockQty: Number(editingMaterial.stockQty) } : m)));
    setEditingMaterial(null);
    setShowEditModal(false);
    if (triggerError) triggerError('Material updated!', 'success');
  };

  const handleDeleteMaterial = (id) => {
    if (!window.confirm('Delete this raw material entry?')) return;
    setMaterials(materials.filter((m) => m._id !== id));
    if (triggerError) triggerError('Material entry removed!', 'success');
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:fruit-citrus" className="text-orange-500 text-lg" /> Raw Materials & Expiry Tracking
          </h2>
          <p className="text-xs text-slate-400">Batch-wise raw material inventory, additives, packaging stock, and FEFO expiry alerts</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={materials} filename="raw_material_stock" title="Raw Material Stock Register" />
          <button
            onClick={() => {
              setNewMaterial({ category: 'Fruit Concentrate', name: '', stockQty: 1000, unit: 'Kg', expDate: '', status: 'Optimal' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add New Material
          </button>
        </div>
      </div>

      {showAddModal && (
        <form onSubmit={handleAddMaterial} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:fruit-citrus" className="text-orange-500 text-base" /> Add Raw Material Stock
            </h3>
            <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Category *</label>
              <input
                type="text"
                required
                value={newMaterial.category}
                onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                placeholder="e.g. Fruit Concentrate"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Raw Material Name *</label>
              <input
                type="text"
                required
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                placeholder="e.g. Alphonso Mango Puree 28 Brix"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Stock Quantity *</label>
              <input
                type="number"
                required
                value={newMaterial.stockQty}
                onChange={(e) => setNewMaterial({ ...newMaterial, stockQty: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Unit</label>
              <input
                type="text"
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Expiry Date (FEFO)</label>
              <input
                type="date"
                value={newMaterial.expDate}
                onChange={(e) => setNewMaterial({ ...newMaterial, expDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">Save Material</button>
          </div>
        </form>
      )}

      {showEditModal && editingMaterial && (
        <form onSubmit={handleUpdateMaterial} className="bg-white border border-slate-300 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Edit Raw Material</h3>
            <button type="button" onClick={() => { setEditingMaterial(null); setShowEditModal(false); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Category</label>
              <input
                type="text"
                required
                value={editingMaterial.category}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Raw Material Name</label>
              <input
                type="text"
                required
                value={editingMaterial.name}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Stock Quantity</label>
              <input
                type="number"
                required
                value={editingMaterial.stockQty}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, stockQty: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Unit</label>
              <input
                type="text"
                value={editingMaterial.unit}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, unit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setEditingMaterial(null); setShowEditModal(false); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">Update Material</button>
          </div>
        </form>
      )}

      {materials.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:fruit-citrus" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Raw Materials Registered</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no raw material stock items or ingredients registered in inventory. Click below to add a material.</p>
          <button
            onClick={() => {
              setNewMaterial({ category: 'Fruit Concentrate', name: '', stockQty: 1000, unit: 'Kg', expDate: '', status: 'Optimal' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add First Raw Material
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Material Category</th>
                  <th className="p-4">Raw Material Name</th>
                  <th className="p-4">Available Stock</th>
                  <th className="p-4">Expiry Date (FEFO)</th>
                  <th className="p-4">Quality Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-semibold text-slate-500">{m.category}</td>
                    <td className="p-4 font-bold text-slate-900">{m.name}</td>
                    <td className="p-4 font-mono font-extrabold text-orange-600 text-sm">{(m.stockQty || 0).toLocaleString()} {m.unit}</td>
                    <td className="p-4 font-mono text-slate-600">{m.expDate}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        m.status === 'Near Expiry' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' : m.status === 'Expired' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {m.status || 'Optimal'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(m)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                        >
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMaterial(m._id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
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
