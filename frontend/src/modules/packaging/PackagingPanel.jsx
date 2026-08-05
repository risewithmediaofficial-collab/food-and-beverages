import { useState } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';

export default function PackagingPanel({ user, triggerError }) {
  const [packagingData, setPackagingData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    consumedQty: 1000,
    unit: 'Pcs',
    unitCost: 1.5,
  });

  const totalPackagingCost = packagingData.reduce((sum, p) => sum + (p.totalCost || (p.consumedQty * p.unitCost)), 0);

  const handleCreateItem = (e) => {
    e.preventDefault();
    const created = {
      id: Date.now().toString(),
      name: formData.name,
      consumedQty: Number(formData.consumedQty),
      unit: formData.unit,
      unitCost: Number(formData.unitCost),
      totalCost: Number(formData.consumedQty) * Number(formData.unitCost),
    };
    setPackagingData([created, ...packagingData]);
    setShowAddModal(false);
    setFormData({ name: '', consumedQty: 1000, unit: 'Pcs', unitCost: 1.5 });
    if (triggerError) triggerError('Packaging material usage logged!', 'success');
  };

  const handleUpdateItem = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setPackagingData(packagingData.map(p => (p.id === editingItem.id ? {
      ...p,
      name: formData.name,
      consumedQty: Number(formData.consumedQty),
      unit: formData.unit,
      unitCost: Number(formData.unitCost),
      totalCost: Number(formData.consumedQty) * Number(formData.unitCost),
    } : p)));
    setEditingItem(null);
    if (triggerError) triggerError('Packaging log updated!', 'success');
  };

  const handleDeleteItem = (id) => {
    if (!window.confirm('Delete this packaging log entry?')) return;
    setPackagingData(packagingData.filter(p => p.id !== id));
    if (triggerError) triggerError('Packaging log removed!', 'success');
  };

  const openEditModal = (p) => {
    setEditingItem(p);
    setFormData({
      name: p.name || '',
      consumedQty: p.consumedQty || 1000,
      unit: p.unit || 'Pcs',
      unitCost: p.unitCost || 1.5,
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:box-seal" className="text-orange-500 text-lg" /> Packaging Consumption & Costing
          </h2>
          <p className="text-xs text-slate-400">Track bottle, cap, label, and carton usage during bottling line runs</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-500 font-medium block">Total Packaging Cost:</span>
            <span className="text-sm font-mono font-extrabold text-orange-600">₹{totalPackagingCost.toLocaleString()}</span>
          </div>

          <ExportDataToolbar data={packagingData} filename="packaging_consumption_log" title="Packaging Material Usage" />
          <button
            onClick={() => {
              setFormData({ name: '', consumedQty: 1000, unit: 'Pcs', unitCost: 1.5 });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Log Packaging Usage
          </button>
        </div>
      </div>

      {(showAddModal || editingItem) && (
        <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:box-seal" className="text-orange-500 text-base" />
              {editingItem ? `Edit Packaging Material (${editingItem.name})` : 'Log Packaging Material Consumption'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingItem(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Packaging Material Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. PET Bottle 500ml Clear"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Consumed Qty *</label>
              <input
                type="number"
                required
                min={1}
                value={formData.consumedQty}
                onChange={(e) => setFormData({ ...formData, consumedQty: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Pcs / Boxes / Rolls"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Unit Cost (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingItem(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {editingItem ? 'Update Log' : 'Save Usage Log'}
            </button>
          </div>
        </form>
      )}

      {packagingData.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:box-seal" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Packaging Material Logged</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">No packaging consumption recorded for bottling runs. Click below to log packaging material usage.</p>
          <button
            onClick={() => {
              setFormData({ name: '', consumedQty: 1000, unit: 'Pcs', unitCost: 1.5 });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Log Packaging Usage
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Packaging Material</th>
                  <th className="p-4">Consumed Quantity</th>
                  <th className="p-4">Unit Cost (₹)</th>
                  <th className="p-4">Total Packaging Cost (₹)</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packagingData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{p.name}</td>
                    <td className="p-4 font-mono font-bold text-slate-700">{p.consumedQty.toLocaleString()} {p.unit}</td>
                    <td className="p-4 font-mono text-slate-500">₹{p.unitCost}</td>
                    <td className="p-4 font-mono font-extrabold text-emerald-600 text-sm">₹{(p.totalCost || p.consumedQty * p.unitCost).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(p)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button onClick={() => handleDeleteItem(p.id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
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
