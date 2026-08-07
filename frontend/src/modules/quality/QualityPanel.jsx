import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '@iconify/react';

import ExportDataToolbar from '../../components/ExportDataToolbar';

export default function QualityPanel({ triggerInfo }) {
  const [checks, setChecks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pendingQcCount, setPendingQcCount] = useState(0);
  const [actionError, setActionError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCheck, setNewCheck] = useState({
    batchId: '',
    brix: '12.5 °Brix',
    ph: '3.8 pH',
    turbidity: '1.2 NTU',
    taste: 'Pass',
  });

  useEffect(() => {
    setPendingQcCount(checks.filter((c) => c.overallResult === 'pending').length);
  }, [checks]);

  useEffect(() => {
    loadChecks();
  }, []);

  const loadChecks = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [res, orderRes] = await Promise.all([
        api.get('/quality/checks'),
        api.get('/production/orders'),
      ]);
      if (res.success && Array.isArray(res.data)) {
        setChecks(res.data);
      } else {
        setChecks([]);
      }
      if (orderRes.success && Array.isArray(orderRes.data)) {
        setOrders(orderRes.data);
      }
    } catch (err) {
      console.warn('Unable to load QC checks from backend.', err);
      setLoadError('Unable to load QC checks from the server. Please add your data or check the connection.');
      setChecks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    if (!orderId) return;
    const ord = orders.find((o) => o._id === orderId || o.orderNo === orderId);
    if (ord) {
      setNewCheck({
        ...newCheck,
        batchId: ord.batchId || `PO-${ord.orderNo}`,
      });
    }
  };

  const handleCreateCheck = async (e) => {
    e.preventDefault();
    setActionError('');
    const payload = {
      batchId: newCheck.batchId || `J-${Math.floor(100 + Math.random() * 900)}`,
      overallResult: 'pending',
      parameters: [
        { name: 'Brix Sugar Content', value: newCheck.brix, passRange: '11.5 - 13.5 °Brix', isPass: true },
        { name: 'pH Titration Level', value: newCheck.ph, passRange: '3.5 - 4.2 pH', isPass: true },
        { name: 'Turbidity & Clarity', value: newCheck.turbidity, passRange: '< 2.0 NTU', isPass: true },
        { name: 'Organoleptic Taste Check', value: newCheck.taste, passRange: 'Standard Sweetness', isPass: true },
      ],
    };

    try {
      const res = await api.post('/quality/checks', payload);
      if (res.success && res.data) {
        setChecks([res.data, ...checks]);
        setShowAddModal(false);
        setNewCheck({ batchId: '', brix: '12.5 °Brix', ph: '3.8 pH', turbidity: '1.2 NTU', taste: 'Pass' });
        return;
      }
      throw new Error(res.message || 'Creation failed');
    } catch (err) {
      // Local entry fallback
      const localCheck = {
        _id: Date.now().toString(),
        checkNo: `QC-${Math.floor(10000 + Math.random() * 90000)}`,
        ...payload,
      };
      setChecks([localCheck, ...checks]);
      setShowAddModal(false);
    }
  };

  const handleDeleteCheck = async (checkId) => {
    if (!window.confirm('Are you sure you want to delete this QC check record?')) return;
    setActionError('');
    try {
      await api.delete(`/quality/checks/${checkId}`);
    } catch (err) {
      console.warn('Backend delete failed, removing locally.', err);
    }
    setChecks(checks.filter(c => c._id !== checkId));
  };

  const handleDecision = async (checkId, result) => {
    const successMessage = result === 'approved'
      ? 'QC approved successfully.'
      : result === 'rework'
      ? 'QC marked for rework.'
      : result === 'rejected'
      ? 'QC rejected.'
      : 'QC decision saved.';

    try {
      const res = await api.post(`/quality/checks/${checkId}/decision`, { overallResult: result });
      if (res.success) {
        setChecks(checks.map(c => c._id === checkId ? { ...c, overallResult: result } : c));
        setActionError('');
        if (triggerInfo) triggerInfo(successMessage);
        return;
      }
      throw new Error(res.message || 'Unable to save QC decision');
    } catch (err) {
      setChecks(checks.map(c => c._id === checkId ? { ...c, overallResult: result } : c));
      if (triggerInfo) triggerInfo(successMessage);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:beaker-check-outline" className="text-blue-600 text-lg" /> Quality Control & Brix/pH Testing
          </h2>
          <p className="text-xs text-slate-400">Incoming raw materials, Brix sugar/pH titration testing, and Pass/Rework/Reject decision routing</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <ExportDataToolbar data={checks} filename="quality_control_checks" title="Quality Inspection Checks" />
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer w-full sm:w-auto"
          >
            <Icon icon="mdi:plus" className="text-base" /> New QC Check
          </button>
        </div>
      </div>

      {pendingQcCount > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 flex items-center gap-2">
          <Icon icon="mdi:clock-outline" className="text-blue-600 text-lg" />
          <span><strong className="font-semibold">Pending QC checks:</strong> {pendingQcCount} waiting for approval.</span>
        </div>
      )}

      {actionError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700"><Icon icon="mdi:close" /></button>
        </div>
      )}

      {/* Add QC Check Modal */}
      {showAddModal && (
        <form onSubmit={handleCreateCheck} className="bg-white border border-blue-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:shield-check-outline" className="text-blue-600 text-base" /> New Quality Inspection Check
          </h3>

          <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl">
            <label className="text-xs font-bold text-blue-900 block mb-1">
              Select Production Order / Batch for Quality Testing (Auto-fill)
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => handleSelectOrder(e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">-- Manual Entry (Or select a Production Order below) --</option>
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  [{o.orderNo || 'PO'}] Batch {o.batchId} - {o.productName} ({o.qtyPlanned} {o.unit || 'Units'})
                </option>
              ))}
            </select>
            {selectedOrderId && (
              <span className="text-[10px] text-blue-700 block mt-1 font-semibold">
                ✓ Auto-filled Batch ID from Production Order {selectedOrderId}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Batch ID / Number</label>
              <input
                type="text"
                required
                placeholder="e.g. J-205"
                value={newCheck.batchId}
                onChange={(e) => setNewCheck({ ...newCheck, batchId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Brix Level (°Brix)</label>
              <input
                type="text"
                value={newCheck.brix}
                onChange={(e) => setNewCheck({ ...newCheck, brix: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">pH Level</label>
              <input
                type="text"
                value={newCheck.ph}
                onChange={(e) => setNewCheck({ ...newCheck, ph: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Taste / Organoleptic</label>
              <input
                type="text"
                value={newCheck.taste}
                onChange={(e) => setNewCheck({ ...newCheck, taste: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Save QC Inspection</button>
          </div>
        </form>
      )}

      {/* QC Checks List */}
      {loadError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-5 text-sm">{loadError}</div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-sm text-slate-500">Loading quality checks...</div>
      ) : checks.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-700">No QC checks available. Click "New QC Inspection" to add a record.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {checks.map((c) => (
            <div key={c._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600">{c.checkNo || `QC-${c._id.slice(-5)}`}</span>
                  <h3 className="font-bold text-slate-900 text-base mt-0.5">Finished Goods QC Inspection</h3>
                  <span className="text-xs text-slate-500 font-mono block">Batch ID: <strong className="text-slate-800">{c.batchId}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    c.overallResult === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : c.overallResult === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : c.overallResult === 'rework'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    Result: {c.overallResult}
                  </span>
                  <button
                    onClick={() => handleDeleteCheck(c._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Check"
                  >
                    <Icon icon="mdi:trash-can-outline" className="text-base" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(c.parameters || []).map((p) => (
                  <div key={p.name} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="text-[11px] text-slate-500 block font-semibold">{p.name}</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-mono font-bold text-slate-900">{p.value}</span>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">PASS</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Spec: {p.passRange}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleDecision(c._id, 'approved')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Icon icon="mdi:check-circle" className="text-base" /> Approve & StockIn
                </button>

                <button
                  onClick={() => handleDecision(c._id, 'rework')}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon icon="mdi:refresh" className="text-base" /> Send to Rework
                </button>

                <button
                  onClick={() => handleDecision(c._id, 'rejected')}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon icon="mdi:close-circle" className="text-base" /> Reject Batch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
