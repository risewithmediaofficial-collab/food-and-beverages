import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function BatchManagementPanel({ user, triggerError }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({
    batchNo: '',
    productName: '',
    plannedQty: 5000,
    producedQty: 4850,
    yieldPct: 97.0,
    lineCode: 'MAC-FIL-01',
    qcStatus: 'Quarantined',
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/production/batches');
      if (res.success && Array.isArray(res.data)) {
        setBatches(res.data);
      } else {
        setBatches([]);
      }
    } catch (err) {
      console.warn('Failed to load batches from API:', err);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        batchNo: formData.batchNo || `BATCH-MGO-2026`,
        batchCode: formData.batchNo || `BATCH-MGO-2026`,
        productName: formData.productName,
        finishedProduct: formData.productName,
        plannedQty: formData.plannedQty,
        producedQty: formData.producedQty,
        yieldPct: formData.yieldPct,
        yieldOutputPct: `${formData.yieldPct}%`,
        lineCode: formData.lineCode,
        machineLine: formData.lineCode,
        qcStatus: formData.qcStatus,
      };
      const res = await api.post('/production/batches', payload);
      if (res.success && res.data) {
        setBatches([res.data, ...batches]);
      } else {
        setBatches([{ _id: Date.now().toString(), ...payload }, ...batches]);
      }
      setShowAddModal(false);
      setFormData({ batchNo: '', productName: '', plannedQty: 5000, producedQty: 4850, yieldPct: 97.0, lineCode: 'MAC-FIL-01', qcStatus: 'Quarantined' });
      if (triggerError) triggerError('Production batch created!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    if (!editingBatch) return;
    try {
      setLoading(true);
      const res = await api.put(`/production/batches/${editingBatch._id}`, formData);
      if (res.success && res.data) {
        setBatches(batches.map(b => (b._id === editingBatch._id ? res.data : b)));
      } else {
        setBatches(batches.map(b => (b._id === editingBatch._id ? { ...b, ...formData } : b)));
      }
      setEditingBatch(null);
      if (triggerError) triggerError('Batch details updated!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update batch');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!window.confirm('Delete this production batch record?')) return;
    try {
      setLoading(true);
      await api.delete(`/production/batches/${id}`);
      setBatches(batches.filter(b => b._id !== id));
      if (triggerError) triggerError('Batch record deleted!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete batch');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (b) => {
    setEditingBatch(b);
    setFormData({
      batchNo: b.batchNo || b.batchCode || '',
      productName: b.productName || b.finishedProduct || '',
      plannedQty: b.plannedQty || 5000,
      producedQty: b.producedQty || 4850,
      yieldPct: b.yieldPct || 97.0,
      lineCode: b.lineCode || b.machineLine || 'MAC-FIL-01',
      qcStatus: b.qcStatus || 'Quarantined',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:flask-outline" className="text-orange-500 text-lg" /> Production Batch Traceability & Quality Quarantine
          </h2>
          <p className="text-xs text-slate-400">Batch-level genealogy, yield percentages, recipe BOM linkage, and quality approval release status</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={batches} filename="batch_traceability_report" title="Production Batch Traceability" />
          <button
            onClick={() => {
              setFormData({ batchNo: `BATCH-MGO-202${batches.length + 6}`, productName: '', plannedQty: 5000, producedQty: 4850, yieldPct: 97.0, lineCode: 'MAC-FIL-01', qcStatus: 'Quarantined' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Register New Batch
          </button>
        </div>
      </div>

      {(showAddModal || editingBatch) && (
        <form onSubmit={editingBatch ? handleUpdateBatch : handleCreateBatch} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:flask-outline" className="text-orange-500 text-base" />
              {editingBatch ? `Edit Batch (${editingBatch.batchNo || editingBatch.batchCode})` : 'Register New Production Batch Record'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingBatch(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Batch Code *</label>
              <input
                type="text"
                required
                value={formData.batchNo}
                onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                placeholder="e.g. BATCH-MGO-2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Finished Product Name *</label>
              <input
                type="text"
                required
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="e.g. Alphonso Mango Nectar 500ml"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Planned Qty *</label>
              <input
                type="number"
                required
                value={formData.plannedQty}
                onChange={(e) => setFormData({ ...formData, plannedQty: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Produced Qty *</label>
              <input
                type="number"
                required
                value={formData.producedQty}
                onChange={(e) => setFormData({ ...formData, producedQty: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Yield Output (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.yieldPct}
                onChange={(e) => setFormData({ ...formData, yieldPct: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Machine Line Code *</label>
              <input
                type="text"
                required
                value={formData.lineCode}
                onChange={(e) => setFormData({ ...formData, lineCode: e.target.value })}
                placeholder="e.g. MAC-FIL-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">QC Release Status</label>
              <select
                value={formData.qcStatus}
                onChange={(e) => setFormData({ ...formData, qcStatus: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Quarantined">Quarantined</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingBatch(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingBatch ? 'Update Batch' : 'Save Batch Record'}
            </button>
          </div>
        </form>
      )}

      {batches.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:flask-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Production Batches Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">No batches are currently logged or quarantined for QC. Click below to register your first production batch.</p>
          <button
            onClick={() => {
              setFormData({ batchNo: 'BATCH-MGO-2026', productName: '', plannedQty: 5000, producedQty: 4850, yieldPct: 97.0, lineCode: 'MAC-FIL-01', qcStatus: 'Quarantined' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Register First Batch
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Batch Code</th>
                  <th className="p-4">Finished Product</th>
                  <th className="p-4">Planned Qty</th>
                  <th className="p-4">Produced Qty</th>
                  <th className="p-4">Yield Output</th>
                  <th className="p-4">Machine Line</th>
                  <th className="p-4">QC Release Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{b.batchNo || b.batchCode}</td>
                    <td className="p-4 font-bold text-slate-900">{b.productName || b.finishedProduct}</td>
                    <td className="p-4 font-mono text-slate-700 font-bold">{(b.plannedQty || 0).toLocaleString()} Units</td>
                    <td className="p-4 font-mono text-emerald-600 font-extrabold">{(b.producedQty || 0).toLocaleString()} Units</td>
                    <td className="p-4 font-mono font-bold text-orange-600">{b.yieldPct || b.yieldOutputPct || '97%'}</td>
                    <td className="p-4 font-mono text-slate-600 font-semibold">{b.lineCode || b.machineLine || 'MAC-FIL-01'}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        (b.qcStatus === 'Approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      }`}>
                        {b.qcStatus || 'Quarantined'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(b)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button onClick={() => handleDeleteBatch(b._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
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
