import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import ManufacturingPipelineBar from '../../components/ManufacturingPipelineBar';
import { api } from '../../lib/api';

export default function PackagingPanel({ user, triggerError }) {
  const navigate = useNavigate();
  const [packagingBatches, setPackagingBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [formData, setFormData] = useState({
    packagingNo: '',
    batchId: '',
    productName: 'Fresh Alphonso Mango Juice 500ml',
    qtyPlanned: 5000,
    unit: 'Bottles',
    bottlesPacked: 5000,
    cartonsPacked: 209,
    packagingLine: 'Bottling & Packaging Line #1',
    operatorName: 'Packaging Supervisor',
  });

  useEffect(() => {
    fetchPackagingBatches();
  }, []);

  const fetchPackagingBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/packaging/batches');
      if (res.success && Array.isArray(res.data)) {
        setPackagingBatches(res.data);
      } else {
        setPackagingBatches([]);
      }
    } catch (err) {
      console.warn('Failed to load packaging batches:', err);
      setPackagingBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const bottleCount = Number(formData.bottlesPacked || formData.qtyPlanned || 5000);
      const cartonCount = Number(formData.cartonsPacked || Math.ceil(bottleCount / 24));
      const materials = [
        { name: '500ml PET Bottles', consumedQty: bottleCount, unit: 'Pcs', unitCost: 1.5, totalCost: bottleCount * 1.5 },
        { name: 'Tamper-Evident Caps', consumedQty: bottleCount, unit: 'Pcs', unitCost: 0.35, totalCost: bottleCount * 0.35 },
        { name: 'Shrink Sleeve Labels', consumedQty: bottleCount, unit: 'Pcs', unitCost: 0.45, totalCost: bottleCount * 0.45 },
        { name: 'Corrugated Master Cartons (24s)', consumedQty: cartonCount, unit: 'Boxes', unitCost: 15.0, totalCost: cartonCount * 15.0 },
      ];
      const totalPackagingCost = materials.reduce((acc, m) => acc + m.totalCost, 0);

      const payload = {
        packagingNo: formData.packagingNo || `PKG-${Date.now().toString().slice(-6)}`,
        batchId: formData.batchId || 'BATCH-MGO-001',
        productName: formData.productName,
        qtyPlanned: bottleCount,
        bottlesPacked: bottleCount,
        cartonsPacked: cartonCount,
        packagingLine: formData.packagingLine || 'Bottling & Packaging Line #1',
        operatorName: formData.operatorName || 'Packaging Supervisor',
        materials,
        totalPackagingCost,
        status: 'pending',
      };

      const res = await api.post('/packaging/batches', payload);
      if (res.success && res.data) {
        setPackagingBatches([res.data, ...packagingBatches]);
        setShowAddModal(false);
        setFormData({ packagingNo: '', batchId: '', productName: 'Fresh Alphonso Mango Juice 500ml', qtyPlanned: 5000, unit: 'Bottles', bottlesPacked: 5000, cartonsPacked: 209, packagingLine: 'Bottling & Packaging Line #1', operatorName: 'Packaging Supervisor' });
        if (triggerError) triggerError('Packaging Work Order registered successfully!', 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create packaging batch');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePackagingAndSendToDispatch = async (batch) => {
    try {
      setActionLoadingId(batch._id);
      const res = await api.post(`/packaging/batches/${batch._id}/complete`, {
        bottlesPacked: batch.bottlesPacked || batch.qtyPlanned || 5000,
        cartonsPacked: batch.cartonsPacked || Math.ceil((batch.bottlesPacked || 5000) / 24),
      });

      if (res.success && res.data) {
        setPackagingBatches(packagingBatches.map(b => (b._id === batch._id ? res.data : b)));
        if (triggerError) {
          triggerError('Packaging complete! Dispatch Order staged and ready for vehicle assignment in Dispatch & Delivery.', 'success');
        }
      } else {
        throw new Error(res.message || 'Failed to complete packaging');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to complete packaging');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!window.confirm('Delete this packaging batch entry?')) return;
    try {
      await api.delete(`/packaging/batches/${id}`);
      setPackagingBatches(packagingBatches.filter(b => b._id !== id));
      if (triggerError) triggerError('Packaging entry deleted!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete entry');
    }
  };

  const pendingBatches = packagingBatches.filter(b => b.status === 'pending' || b.status === 'in_packaging' || !b.status);
  const completedBatches = packagingBatches.filter(b => b.status === 'completed');

  const totalPackagingCost = packagingBatches.reduce((sum, p) => sum + (p.totalPackagingCost || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      <ManufacturingPipelineBar currentStage="packaging" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:box-seal" className="text-orange-500 text-lg" /> Packaging Consumption & Bottling Line Run
          </h2>
          <p className="text-xs text-slate-400">
            Bottling run material tracking (PET bottles, caps, shrink labels, master cartons) and 1-click dispatch handoff
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl text-xs hidden sm:block">
            <span className="text-slate-500 font-medium block">Total Packaging Cost:</span>
            <span className="text-sm font-mono font-extrabold text-orange-600">₹{totalPackagingCost.toLocaleString()}</span>
          </div>

          <ExportDataToolbar data={packagingBatches} filename="packaging_batches_master" title="Packaging Line Batches" />
          <button
            onClick={() => {
              setFormData({ packagingNo: `PKG-${Date.now().toString().slice(-6)}`, batchId: '', productName: 'Fresh Alphonso Mango Juice 500ml', qtyPlanned: 5000, unit: 'Bottles', bottlesPacked: 5000, cartonsPacked: 209, packagingLine: 'Bottling & Packaging Line #1', operatorName: 'Packaging Supervisor' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> New Packaging Batch
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:box-seal" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Packaging Batches</span>
            <span className="text-lg font-mono font-extrabold text-slate-900">{packagingBatches.length}</span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:clock-alert-outline" className={pendingBatches.length > 0 ? 'animate-spin' : ''} />
          </div>
          <div>
            <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wider block">Awaiting Bottling/Packaging</span>
            <span className="text-lg font-mono font-extrabold text-amber-900">{pendingBatches.length}</span>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:check-circle-outline" />
          </div>
          <div>
            <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">Packaged & Staged</span>
            <span className="text-lg font-mono font-extrabold text-emerald-900">{completedBatches.length}</span>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:truck-fast" />
          </div>
          <div>
            <span className="text-[11px] text-blue-800 font-bold uppercase tracking-wider block">Final Stage</span>
            <button
              onClick={() => navigate('/dispatch')}
              className="text-xs font-extrabold text-blue-700 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
            >
              6. Dispatch & Delivery <Icon icon="mdi:arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Batches Awaiting Packaging Line */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:bottle-tonic-outline" className="text-orange-500 text-lg" />
            Batches Awaiting Packaging & Bottling Line ({pendingBatches.length})
          </h3>
          <span className="text-xs text-slate-400">Step 5 in Manufacturing Pipeline</span>
        </div>

        {pendingBatches.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
              <Icon icon="mdi:check-all" />
            </div>
            <h4 className="text-xs font-bold text-slate-700">Packaging Line Clear</h4>
            <p className="text-[11px] text-slate-400">No batches waiting for packaging. Clear lab tests in Laboratory to forward batches here.</p>
            <button
              onClick={() => navigate('/laboratory')}
              className="mt-2 text-xs font-bold text-orange-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Go to Quality Laboratory <Icon icon="mdi:arrow-right" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingBatches.map((batch) => {
              const bottleQty = batch.bottlesPacked || batch.qtyPlanned || 5000;
              const cartonQty = batch.cartonsPacked || Math.ceil(bottleQty / 24);

              return (
                <div key={batch._id} className="bg-white border-2 border-orange-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                          📦 Ready for Bottling Line
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">Ref: {batch.packagingNo}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base mt-1">
                        {batch.productName || 'Fresh Juice Batch'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>Batch ID: <strong className="text-slate-800 font-mono font-bold">{batch.batchId}</strong></span>
                        <span>•</span>
                        <span>Target Bottles: <strong className="text-emerald-700 font-mono font-bold">{bottleQty.toLocaleString()} Bottles</strong></span>
                        <span>•</span>
                        <span>Master Cartons: <strong className="text-blue-700 font-mono font-bold">{cartonQty.toLocaleString()} Boxes (24s)</strong></span>
                        <span>•</span>
                        <span>Line: <strong className="text-slate-700">{batch.packagingLine || 'Line #1'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteBatch(batch._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Packaging Batch"
                      >
                        <Icon icon="mdi:trash-can-outline" className="text-base" />
                      </button>
                    </div>
                  </div>

                  {/* Packaging Materials Bill of Materials Grid */}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                      Consumed Packaging Materials & Container Breakdown
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">PET Bottles (500ml)</span>
                        <span className="text-sm font-mono font-extrabold text-slate-900">{bottleQty.toLocaleString()} Pcs</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">₹1.50 / bottle</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">Tamper Caps</span>
                        <span className="text-sm font-mono font-extrabold text-slate-900">{bottleQty.toLocaleString()} Pcs</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">₹0.35 / cap</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">Shrink Labels</span>
                        <span className="text-sm font-mono font-extrabold text-slate-900">{bottleQty.toLocaleString()} Pcs</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">₹0.45 / sleeve</span>
                      </div>
                      <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                        <span className="text-[10px] text-blue-700 font-bold block">Master Cartons (24s)</span>
                        <span className="text-sm font-mono font-extrabold text-blue-900">{cartonQty.toLocaleString()} Boxes</span>
                        <span className="text-[10px] text-blue-600 block mt-0.5">₹15.00 / carton</span>
                      </div>
                    </div>
                  </div>

                  {/* Complete Action Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Icon icon="mdi:truck-fast" className="text-orange-500 text-base" />
                      <span>Bottling & labeling complete. Ready to stage for delivery.</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleCompletePackagingAndSendToDispatch(batch)}
                        disabled={actionLoadingId === batch._id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                      >
                        <Icon icon="mdi:truck-delivery" className="text-base" />
                        {actionLoadingId === batch._id ? 'Staging Dispatch Order...' : '🚚 Complete Packaging & Send to Dispatch & Delivery'}
                      </button>
                      <button
                        onClick={() => navigate('/dispatch')}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Icon icon="mdi:arrow-right" className="text-base" /> Open Dispatch
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Packaged Batches Registry */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:history" className="text-blue-600 text-lg" />
            Packaged Batches & Dispatch Staging History ({completedBatches.length})
          </h3>
          <span className="text-xs text-slate-400">Bottled, Boxed, and Handed Off to Logistics</span>
        </div>

        {completedBatches.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-xs">
            No completed packaging records yet. Complete active bottling runs above to see staged dispatch batches.
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Packaging Ref</th>
                    <th className="p-4">Batch ID</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Packaged Quantity</th>
                    <th className="p-4">Master Boxes (24s)</th>
                    <th className="p-4">Packaging Cost (₹)</th>
                    <th className="p-4">Handoff Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedBatches.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-orange-600">{b.packagingNo}</td>
                      <td className="p-4 font-mono font-bold text-slate-900">{b.batchId}</td>
                      <td className="p-4 font-bold text-slate-800">{b.productName}</td>
                      <td className="p-4 font-mono font-extrabold text-emerald-700">{(b.bottlesPacked || b.qtyPlanned || 5000).toLocaleString()} Bottles</td>
                      <td className="p-4 font-mono font-bold text-blue-700">{b.cartonsPacked || Math.ceil((b.bottlesPacked || 5000) / 24)} Cartons</td>
                      <td className="p-4 font-mono font-bold text-slate-700">₹{(b.totalPackagingCost || 11635).toLocaleString()}</td>
                      <td className="p-4">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                          ✓ Staged for Dispatch
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => navigate('/dispatch')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Icon icon="mdi:truck-fast" className="text-sm" /> View in Dispatch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Manual Packaging Modal */}
      {showAddModal && (
        <form onSubmit={handleCreateBatch} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:box-seal" className="text-orange-500 text-base" />
              Register New Bottling & Packaging Run
            </h3>
            <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Batch Code *</label>
              <input
                type="text"
                required
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                placeholder="e.g. BATCH-MGO-001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="e.g. Fresh Alphonso Mango Juice 500ml"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Bottles Packed (Qty) *</label>
              <input
                type="number"
                required
                min={1}
                value={formData.bottlesPacked}
                onChange={(e) => setFormData({ ...formData, bottlesPacked: Number(e.target.value), cartonsPacked: Math.ceil(Number(e.target.value) / 24) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Master Cartons (24s) *</label>
              <input
                type="number"
                required
                min={1}
                value={formData.cartonsPacked}
                onChange={(e) => setFormData({ ...formData, cartonsPacked: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Packaging Line</label>
              <input
                type="text"
                value={formData.packagingLine}
                onChange={(e) => setFormData({ ...formData, packagingLine: e.target.value })}
                placeholder="e.g. Bottling Line #1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              Save Packaging Batch
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
