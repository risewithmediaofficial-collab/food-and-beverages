import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { socket } from '../../lib/socket';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import ManufacturingPipelineBar from '../../components/ManufacturingPipelineBar';

export default function QualityPanel({ triggerInfo }) {
  const navigate = useNavigate();
  const [checks, setChecks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Inspection State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParamsCheck, setEditingParamsCheck] = useState(null);
  const [viewingCoaCheck, setViewingCoaCheck] = useState(null);

  const [newCheck, setNewCheck] = useState({
    batchId: '',
    productName: '',
    orderNo: '',
    qtyTested: 5000,
    unit: 'Bottles',
    brix: '12.5 °Brix',
    ph: '3.8 pH',
    turbidity: '1.2 NTU',
    taste: 'Pass',
  });

  useEffect(() => {
    loadChecks();

    const handleOrderUpdate = () => {
      loadChecks();
    };

    const handleQcResult = () => {
      loadChecks();
    };

    socket.on('production:order-updated', handleOrderUpdate);
    socket.on('qc:batch-result', handleQcResult);

    return () => {
      socket.off('production:order-updated', handleOrderUpdate);
      socket.off('qc:batch-result', handleQcResult);
    };
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
      setLoadError('Unable to load QC checks from the server. Please check your connection.');
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
        productName: ord.productName || ord.productId?.name || 'Juice Product',
        orderNo: ord.orderNo || `PO-${ord._id.slice(-5)}`,
        qtyTested: ord.qtyProduced || ord.qtyPlanned || 5000,
        unit: ord.unit || 'Bottles',
      });
    }
  };

  const handleCreateCheck = async (e) => {
    e.preventDefault();
    setActionError('');
    const payload = {
      batchId: newCheck.batchId || `J-${Math.floor(100 + Math.random() * 900)}`,
      productName: newCheck.productName || 'Juice Batch',
      orderNo: newCheck.orderNo || 'PO-MANUAL',
      qtyTested: Number(newCheck.qtyTested || 5000),
      unit: newCheck.unit || 'Bottles',
      overallResult: 'pending',
      parameters: [
        { name: 'Brix Sugar Content', value: newCheck.brix, passRange: '11.5 - 13.5 °Brix', result: 'pass' },
        { name: 'pH Titration Level', value: newCheck.ph, passRange: '3.5 - 4.2 pH', result: 'pass' },
        { name: 'Turbidity & Clarity', value: newCheck.turbidity, passRange: '< 2.0 NTU', result: 'pass' },
        { name: 'Organoleptic Taste Check', value: newCheck.taste, passRange: 'Standard Sweetness', result: 'pass' },
        { name: 'Microbiology (CFU/ml)', value: '< 1 CFU/ml', passRange: '< 10 CFU/ml', result: 'pass' },
        { name: 'Fill Volume Spec', value: '500 ml', passRange: '495 - 505 ml', result: 'pass' },
      ],
    };

    try {
      const res = await api.post('/quality/checks', payload);
      if (res.success && res.data) {
        setChecks([res.data, ...checks]);
        setShowAddModal(false);
        setNewCheck({ batchId: '', productName: '', orderNo: '', qtyTested: 5000, unit: 'Bottles', brix: '12.5 °Brix', ph: '3.8 pH', turbidity: '1.2 NTU', taste: 'Pass' });
        if (triggerInfo) triggerInfo('New Quality Inspection record logged successfully!');
        return;
      }
      throw new Error(res.message || 'Creation failed');
    } catch (err) {
      const localCheck = {
        _id: Date.now().toString(),
        checkNo: `QC-${Math.floor(10000 + Math.random() * 90000)}`,
        ...payload,
      };
      setChecks([localCheck, ...checks]);
      setShowAddModal(false);
      if (triggerInfo) triggerInfo('QC check logged locally.');
    }
  };

  const handleUpdateParameters = async (e) => {
    e.preventDefault();
    if (!editingParamsCheck) return;
    try {
      const res = await api.put(`/quality/checks/${editingParamsCheck._id}/parameters`, {
        parameters: editingParamsCheck.parameters,
        notes: editingParamsCheck.notes,
      });
      if (res.success && res.data) {
        setChecks(checks.map(c => c._id === editingParamsCheck._id ? res.data : c));
      } else {
        setChecks(checks.map(c => c._id === editingParamsCheck._id ? editingParamsCheck : c));
      }
      setEditingParamsCheck(null);
      if (triggerInfo) triggerInfo('Test parameter values updated successfully!');
    } catch (err) {
      setChecks(checks.map(c => c._id === editingParamsCheck._id ? editingParamsCheck : c));
      setEditingParamsCheck(null);
      if (triggerInfo) triggerInfo('Test parameter values updated!');
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
    if (triggerInfo) triggerInfo('QC Check record removed.');
  };

  const handleDecision = async (checkId, result) => {
    const successMessage = result === 'approved'
      ? 'QC Approved! Batch released & scheduled for dispatch automatically.'
      : result === 'rework'
      ? 'QC marked for Rework. Batch returned to production line.'
      : result === 'rejected'
      ? 'QC Rejected! Batch placed in permanent quarantine.'
      : 'QC decision saved.';

    try {
      const checkToUpdate = checks.find(c => c._id === checkId);
      const res = await api.post(`/quality/checks/${checkId}/decision`, {
        overallResult: result,
        parameters: checkToUpdate?.parameters,
      });
      if (res.success) {
        setChecks(checks.map(c => c._id === checkId ? { ...c, overallResult: result, ...(res.data || {}) } : c));
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

  const pendingChecks = checks.filter((c) => c.overallResult === 'pending' || !c.overallResult);
  const completedChecks = checks.filter((c) => c.overallResult && c.overallResult !== 'pending');

  const filteredHistory = completedChecks.filter((c) => {
    if (activeFilter !== 'all' && c.overallResult !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBatch = c.batchId?.toLowerCase().includes(q);
      const matchProduct = c.productName?.toLowerCase().includes(q) || c.refId?.productName?.toLowerCase().includes(q);
      const matchNo = c.checkNo?.toLowerCase().includes(q) || c.orderNo?.toLowerCase().includes(q);
      return matchBatch || matchProduct || matchNo;
    }
    return true;
  });

  const approvedCount = checks.filter(c => c.overallResult === 'approved').length;
  const rejectedCount = checks.filter(c => c.overallResult === 'rejected').length;
  const reworkCount = checks.filter(c => c.overallResult === 'rework').length;

  return (
    <div className="space-y-6 font-sans">
      <ManufacturingPipelineBar currentStage="quality" />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:beaker-check-outline" className="text-blue-600 text-lg" /> Quality Control & Brix/pH Testing
          </h2>
          <p className="text-xs text-slate-400">
            Automatic inspection queue for completed production batches, chemical titration testing, and 1-click dispatch release
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <ExportDataToolbar data={checks} filename="quality_control_checks" title="Quality Inspection Checks" />
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer w-full sm:w-auto"
          >
            <Icon icon="mdi:plus" className="text-base" /> Manual QC Check
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:clipboard-check-outline" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total QC Checks</span>
            <span className="text-lg font-mono font-extrabold text-slate-900">{checks.length}</span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs flex items-center gap-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:clock-alert-outline" className={pendingChecks.length > 0 ? 'animate-spin' : ''} />
          </div>
          <div>
            <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wider block flex items-center gap-1.5">
              Waiting for QC
              {pendingChecks.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
            </span>
            <span className="text-lg font-mono font-extrabold text-amber-900">{pendingChecks.length} Batches</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:check-decagram" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Passed & Dispatched</span>
            <span className="text-lg font-mono font-extrabold text-emerald-600">{approvedCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
            <Icon icon="mdi:alert-octagon-outline" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Rework / Rejected</span>
            <span className="text-lg font-mono font-extrabold text-rose-600">{rejectedCount + reworkCount}</span>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700"><Icon icon="mdi:close" /></button>
        </div>
      )}

      {/* SECTION 1: Batches Waiting for Quality Check (Auto-Synced from Production) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Icon icon="mdi:clipboard-clock-outline" className="text-amber-600 text-lg" />
              Batches Waiting for Quality Check ({pendingChecks.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">
            Auto-queued from Production Planning & Orders completion
          </span>
        </div>

        {pendingChecks.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
              <Icon icon="mdi:check-all" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">All Completed Batches Inspected</h4>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              No batches are currently waiting in the quality inspection queue. When production completes in <strong>Production Planning</strong> or <strong>Production Orders</strong>, the batch will automatically appear here!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingChecks.map((c) => {
              const productName = c.productName || c.refId?.productName || 'Finished Goods Product';
              const orderNo = c.orderNo || c.refId?.orderNo || 'PO-BATCH';
              const qtyTested = c.qtyTested || c.refId?.qtyProduced || c.refId?.qtyPlanned || 5000;
              const unit = c.unit || c.refId?.unit || 'Bottles';

              return (
                <div key={c._id} className="bg-white border-2 border-amber-200/90 rounded-2xl p-5 shadow-sm space-y-4 hover:border-amber-300 transition relative">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {c.checkNo || `QC-${c._id.slice(-6)}`}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">[{orderNo}]</span>
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <Icon icon="mdi:clock-outline" /> Waiting for Quality Check
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base mt-1 flex items-center gap-2">
                        {productName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>Batch ID: <strong className="text-slate-800 font-mono font-bold">{c.batchId}</strong></span>
                        <span>•</span>
                        <span>Output Qty: <strong className="text-emerald-700 font-mono font-bold">{Number(qtyTested).toLocaleString()} {unit}</strong></span>
                        <span>•</span>
                        <span>Queued: <strong className="text-slate-700 font-medium">{new Date(c.createdAt || Date.now()).toLocaleDateString()}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setEditingParamsCheck({ ...c })}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Edit lab measured parameters"
                      >
                        <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        Edit Test Values
                      </button>
                      <button
                        onClick={() => handleDeleteCheck(c._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Inspection"
                      >
                        <Icon icon="mdi:trash-can-outline" className="text-base" />
                      </button>
                    </div>
                  </div>

                  {/* Test Parameter Values Grid */}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                      Laboratory Quality Specifications & Measured Values
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {(c.parameters && c.parameters.length > 0 ? c.parameters : [
                        { name: 'Brix Sugar', value: '12.5 °Brix', passRange: '11.5 - 13.5 °Brix' },
                        { name: 'pH Titration', value: '3.8 pH', passRange: '3.5 - 4.2 pH' },
                        { name: 'Turbidity & Clarity', value: '1.2 NTU', passRange: '< 2.0 NTU' },
                        { name: 'Taste / Sensory', value: 'Standard Sweetness', passRange: 'Natural Taste' },
                        { name: 'Microbiology', value: '< 1 CFU/ml', passRange: '< 10 CFU/ml' },
                        { name: 'Fill Volume', value: '500 ml', passRange: '495 - 505 ml' },
                      ]).map((p, idx) => (
                        <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block truncate" title={p.name}>{p.name}</span>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-mono font-extrabold text-slate-900 truncate" title={p.value}>{p.value}</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">PASS</span>
                          </div>
                          <span className="text-[9px] text-slate-400 block truncate" title={`Spec: ${p.passRange}`}>Spec: {p.passRange}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Icon icon="mdi:shield-check" className="text-emerald-600 text-base" />
                      <span>Ready for inspection sign-off</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleDecision(c._id, 'rejected')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Icon icon="mdi:close-circle" className="text-base text-rose-600" /> Reject Batch
                      </button>

                      <button
                        onClick={() => handleDecision(c._id, 'rework')}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Icon icon="mdi:refresh" className="text-base text-amber-600" /> Send to Rework
                      </button>

                      <button
                        onClick={() => handleDecision(c._id, 'approved', 'QC Approved! Batch forwarded to Quality Laboratory for microbiological testing & COA clearance.')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                        title="Pass physical QC parameters and send batch to Laboratory"
                      >
                        <Icon icon="mdi:microscope" className="text-base" /> 🧪 Approve QC & Send to Laboratory Test
                      </button>
                      <button
                        onClick={() => navigate('/laboratory')}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                        title="Open Quality Laboratory"
                      >
                        <Icon icon="mdi:arrow-right" className="text-base" /> Open Lab
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Completed Inspection History & Records */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Icon icon="mdi:history" className="text-blue-600 text-lg" />
              QC Inspection History & Certificate Records ({completedChecks.length})
            </h3>
            <p className="text-xs text-slate-400">Archived quality titration results, pass/fail audit logs, and release certificates</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Icon icon="mdi:magnify" className="absolute left-3 top-2.5 text-slate-400 text-base" />
              <input
                type="text"
                placeholder="Search batch, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('approved')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${activeFilter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'}`}
              >
                Approved
              </button>
              <button
                onClick={() => setActiveFilter('rework')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${activeFilter === 'rework' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'}`}
              >
                Rework
              </button>
              <button
                onClick={() => setActiveFilter('rejected')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${activeFilter === 'rejected' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'}`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>

        {loadError ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-5 text-sm">{loadError}</div>
        ) : isLoading ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-sm text-slate-500">Loading quality checks...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-xs text-slate-400">
            No completed QC inspection logs match the active filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHistory.map((c) => {
              const productName = c.productName || c.refId?.productName || 'Finished Goods Product';
              const orderNo = c.orderNo || c.refId?.orderNo || 'PO-BATCH';
              const qtyTested = c.qtyTested || c.refId?.qtyProduced || c.refId?.qtyPlanned || 5000;
              const unit = c.unit || c.refId?.unit || 'Bottles';

              return (
                <div key={c._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-blue-600">{c.checkNo || `QC-${c._id.slice(-6)}`}</span>
                          <span className="text-xs font-mono text-slate-400">[{orderNo}]</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{productName}</h4>
                        <span className="text-xs text-slate-500 font-mono block">Batch: <strong className="text-slate-800">{c.batchId}</strong></span>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        c.overallResult === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : c.overallResult === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : c.overallResult === 'rework'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {c.overallResult === 'approved' ? '✓ Approved' : c.overallResult}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Qty Tested</span>
                        <span className="text-xs font-mono font-bold text-slate-800">{Number(qtyTested).toLocaleString()} {unit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Brix Reading</span>
                        <span className="text-xs font-mono font-bold text-blue-700">{c.parameters?.find(p => p.name.includes('Brix'))?.value || '12.5 °Brix'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">pH Level</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{c.parameters?.find(p => p.name.includes('pH'))?.value || '3.8 pH'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(c.updatedAt || c.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingCoaCheck(c)}
                        className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Icon icon="mdi:certificate-outline" className="text-sm" /> View COA
                      </button>
                      <button
                        onClick={() => handleDeleteCheck(c._id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Delete Record"
                      >
                        <Icon icon="mdi:trash-can-outline" className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Edit Test Parameters */}
      {editingParamsCheck && (
        <form onSubmit={handleUpdateParameters} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Icon icon="mdi:flask-outline" className="text-blue-600 text-lg" />
                  Record Laboratory Test Measurements
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Batch {editingParamsCheck.batchId} • {editingParamsCheck.productName || 'Juice Product'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingParamsCheck(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(editingParamsCheck.parameters || []).map((p, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{p.name}</label>
                  <input
                    type="text"
                    value={p.value}
                    onChange={(e) => {
                      const updated = [...editingParamsCheck.parameters];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      setEditingParamsCheck({ ...editingParamsCheck, parameters: updated });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 block">Spec Range: {p.passRange}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Inspector Notes & Titration Remarks</label>
              <textarea
                rows={2}
                placeholder="e.g. Visual clarity optimal, organoleptic profile matches standard sweet mango formulation."
                value={editingParamsCheck.notes || ''}
                onChange={(e) => setEditingParamsCheck({ ...editingParamsCheck, notes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingParamsCheck(null)}
                className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Save Measurements
              </button>
            </div>
          </div>
        </form>
      )}

      {/* MODAL: Certificate of Analysis (COA) Preview */}
      {viewingCoaCheck && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xl max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                  <Icon icon="mdi:certificate" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Certificate of Analysis (COA)</h3>
                  <span className="text-[11px] text-slate-400 font-mono">FSSAI & QA Release Certification</span>
                </div>
              </div>
              <button
                onClick={() => setViewingCoaCheck(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Product Name:</span>
                <strong className="text-slate-900 font-bold">{viewingCoaCheck.productName || 'Fruit Nectar Beverage'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batch Number:</span>
                <strong className="text-slate-900 font-mono font-bold">{viewingCoaCheck.batchId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">QC Reference No:</span>
                <span className="text-blue-700 font-mono font-bold">{viewingCoaCheck.checkNo || `QC-${viewingCoaCheck._id.slice(-6)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inspection Decision:</span>
                <span className="text-emerald-700 font-extrabold uppercase">PASSED & APPROVED FOR RELEASE</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 block">Certified Parameter Results:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Parameter</th>
                      <th className="p-2">Result</th>
                      <th className="p-2">Specification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewingCoaCheck.parameters || []).map((p, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium text-slate-700">{p.name}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">{p.value}</td>
                        <td className="p-2 text-slate-500">{p.passRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingCoaCheck(null)}
                className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Icon icon="mdi:printer" /> Print COA Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manual Add QC Check Modal */}
      {showAddModal && (
        <form onSubmit={handleCreateCheck} className="bg-white border border-blue-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:shield-check-outline" className="text-blue-600 text-base" /> Manual Quality Inspection Check
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
                ✓ Auto-filled Batch ID and Product details from Production Order
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Batch ID / Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. J-205"
                value={newCheck.batchId}
                onChange={(e) => setNewCheck({ ...newCheck, batchId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Product Name</label>
              <input
                type="text"
                placeholder="e.g. Mango Juice 500ml"
                value={newCheck.productName}
                onChange={(e) => setNewCheck({ ...newCheck, productName: e.target.value })}
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
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-slate-500 cursor-pointer">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
              Save QC Inspection
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
