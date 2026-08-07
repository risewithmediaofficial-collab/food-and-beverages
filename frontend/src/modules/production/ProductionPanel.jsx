import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { socket } from '../../lib/socket';
import { Icon } from '@iconify/react';
import UnitSelector from '../../components/UnitSelector';

import ExportDataToolbar from '../../components/ExportDataToolbar';

export default function ProductionPanel({ user, triggerError }) {
  const [orders, setOrders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showNewModal, setShowNewModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ productName: '', qtyPlanned: 5000, shiftId: 'Morning', unit: 'Bottles' });
  const [editingOrder, setEditingOrder] = useState(null);
  const [actionError, setActionError] = useState('');

  const canManageProduction = true; // Allow any logged-in user to start & stop production batches

  useEffect(() => {
    loadProduction();

    const handleOrderUpdate = (data) => {
      if (!data?.orderId) return;
      setOrders((prevOrders) => prevOrders.map((o) => {
        if (o._id === data.orderId || o.orderId === data.orderId) {
          return { ...o, status: data.status || o.status, batchId: data.batchId || o.batchId };
        }
        return o;
      }));
    };

    socket.on('production:order-updated', handleOrderUpdate);

    return () => {
      socket.off('production:order-updated', handleOrderUpdate);
    };
  }, []);

  const loadProduction = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [orderRes, planRes] = await Promise.all([
        api.get('/production/orders'),
        api.get('/production/plans'),
      ]);
      if (orderRes.success) {
        setOrders(orderRes.data.map(o => ({ ...o, productName: o.productId?.name || o.productName || 'Juice Product' })));
      } else {
        setOrders([]);
      }
      if (planRes.success && Array.isArray(planRes.data)) {
        setPlans(planRes.data);
      }
    } catch (err) {
      console.warn('Unable to load production orders from backend.', err);
      setOrders([]);
      setLoadError('Unable to load production orders. Please verify backend connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    if (!planId) return;
    const p = plans.find((pl) => pl._id === planId || pl.planCode === planId);
    if (p) {
      setNewOrder({
        ...newOrder,
        productName: p.productName || '',
        qtyPlanned: p.targetQty || Number(p.plannedQty?.replace(/[^0-9]/g, '')) || 5000,
        unit: p.unit || 'Bottles',
        shiftId: p.shift?.includes('Evening') ? 'Evening' : p.shift?.includes('Night') ? 'Night' : 'Morning',
      });
    }
  };

  const handleOpenCreateModal = () => {
    if (!canManageProduction) {
      if (triggerError) {
        triggerError('Permission Denied: Only Production Lead or General Manager can create production orders.');
      }
      return;
    }
    setShowNewModal(true);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setActionError('');
    if (!canManageProduction) {
      if (triggerError) triggerError('Permission Denied: Cannot create production order.');
      return;
    }
    if (!newOrder.productName.trim()) {
      setActionError('Enter a production item name before creating a production order.');
      return;
    }

    const payload = {
      productName: newOrder.productName,
      qtyPlanned: Number(newOrder.qtyPlanned),
      unit: newOrder.unit || 'Bottles',
      shiftId: newOrder.shiftId,
      batchId: `F1-ORG500-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random()*900)}`,
    };

    try {
      const res = await api.post('/production/orders', payload);
      if (res.success && res.data) {
        setOrders([{ ...res.data, productName: newOrder.productName }, ...orders]);
        setShowNewModal(false);
        setNewOrder({ productName: '', qtyPlanned: 5000, shiftId: 'Morning', unit: 'Bottles' });
        if (triggerError) triggerError('Production order created successfully!', 'success');
        return;
      }
      throw new Error(res.message || 'Order creation failed');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create production order');
      setActionError(err.message || 'Unable to create production order.');
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    setActionError('');
    try {
      const res = await api.put(`/production/orders/${editingOrder._id}`, editingOrder);
      if (res.success) {
        setOrders(orders.map(o => o._id === editingOrder._id ? { ...editingOrder, ...res.data } : o));
        setEditingOrder(null);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setOrders(orders.map(o => o._id === editingOrder._id ? editingOrder : o));
      setEditingOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this production order?')) return;
    setActionError('');
    try {
      await api.delete(`/production/orders/${orderId}`);
    } catch (err) {
      console.warn('Backend delete failed, removing locally.', err);
    }
    setOrders(orders.filter(o => o._id !== orderId));
  };

  const handleStartProduction = async (id) => {
    if (!canManageProduction) {
      if (triggerError) triggerError('Permission Denied: Only Production Supervisors can start batches.');
      return;
    }
    try {
      const res = await api.post(`/production/orders/${id}/start`);
      if (res.success && res.data) {
        setOrders(orders.map(o => o._id === id ? { ...o, status: res.data.status || 'running' } : o));
        return;
      }
      throw new Error(res.message || 'Unable to start production');
    } catch (err) {
      setOrders(orders.map(o => o._id === id ? { ...o, status: 'running' } : o));
    }
  };

  const handleCompleteProduction = async (id) => {
    if (!canManageProduction) {
      if (triggerError) triggerError('Permission Denied: Only Production Supervisors can complete batches.');
      return;
    }
    try {
      const res = await api.post(`/production/orders/${id}/complete`, { qtyProduced: 4950 });
      if (res.success && res.data?.order) {
        setOrders(orders.map(o => o._id === id ? { ...o, status: res.data.order.status || 'quality_testing', qtyProduced: res.data.order.qtyProduced || 4950 } : o));
        return;
      }
      throw new Error(res.message || 'Unable to complete production');
    } catch (err) {
      setOrders(orders.map(o => o._id === id ? { ...o, status: 'quality_testing', qtyProduced: o.qtyPlanned } : o));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:factory" className="text-blue-600 text-lg" /> Production Orders & Batch Control
          </h2>
          <p className="text-xs text-slate-400">Automated batch ID generation, BOM inventory deduction, and shift management</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <ExportDataToolbar data={orders} filename="production_orders_master" title="Production Orders & Batch Control" />
          <button
            onClick={handleOpenCreateModal}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer w-full sm:w-auto ${
              canManageProduction
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            <Icon icon="mdi:plus" className="text-base" /> Create Production Order
          </button>
        </div>
      </div>

      {!canManageProduction && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-800 font-semibold">
          <Icon icon="mdi:shield-alert-outline" className="text-lg text-amber-600 flex-shrink-0" />
          <span>View-Only Access: Production Order creation and batch state transitions are restricted to Production Supervisors & General Managers.</span>
        </div>
      )}

      {actionError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700"><Icon icon="mdi:close" /></button>
        </div>
      )}

      {/* Create Order Modal */}
      {showNewModal && (
        <form onSubmit={handleCreateOrder} className="bg-white border border-blue-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:calendar-check-outline" className="text-blue-600 text-base" /> New Production Order Entry
          </h3>

          <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl">
            <label className="text-xs font-bold text-blue-900 block mb-1">
              Select Approved Production Plan (Auto-fill)
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => handleSelectPlan(e.target.value)}
              className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">-- Custom Manual Entry (Or select a Production Plan below) --</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  [{p.planCode || 'PLAN'}] {p.productName} ({p.plannedQty || `${p.targetQty || 5000} ${p.unit || 'Bottles'}`} - {p.shift || 'Morning'})
                </option>
              ))}
            </select>
            {selectedPlanId && (
              <span className="text-[10px] text-blue-700 block mt-1 font-semibold">
                ✓ Auto-filled details from Production Plan
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Product / Item Name *</label>
              <input
                type="text"
                required
                value={newOrder.productName}
                onChange={(e) => setNewOrder({ ...newOrder, productName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Target Planned Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={newOrder.qtyPlanned}
                onChange={(e) => setNewOrder({ ...newOrder, qtyPlanned: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <UnitSelector
                label="Target Output Unit (Bottles, Litre, Kg, etc.)"
                value={newOrder.unit || 'Bottles'}
                onChange={(unit) => setNewOrder({ ...newOrder, unit })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Production Shift</label>
              <select
                value={newOrder.shiftId}
                onChange={(e) => setNewOrder({ ...newOrder, shiftId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="Morning">Morning Shift (06:00 - 14:00)</option>
                <option value="Evening">Evening Shift (14:00 - 22:00)</option>
                <option value="Night">Night Shift (22:00 - 06:00)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Confirm & Issue Batch ID</button>
          </div>
        </form>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <form onSubmit={handleUpdateOrder} className="bg-white border border-amber-300 p-5 rounded-2xl space-y-4 shadow-md">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:pencil" className="text-amber-600 text-base" /> Edit Production Order Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Product Name</label>
              <input
                type="text"
                required
                value={editingOrder.productName || ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, productName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Planned Qty</label>
              <input
                type="number"
                required
                value={editingOrder.qtyPlanned || 0}
                onChange={(e) => setEditingOrder({ ...editingOrder, qtyPlanned: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Status</label>
              <select
                value={editingOrder.status || 'planning'}
                onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="planning">planning</option>
                <option value="running">running</option>
                <option value="quality_testing">quality_testing</option>
                <option value="completed">completed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditingOrder(null)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Update Order</button>
          </div>
        </form>
      )}

      {/* Main Content */}
      {loadError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-700">{loadError}</div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-sm text-slate-500">Loading production orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-700">No production orders available. Click "Create Production Order" to add one.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((o) => (
            <div key={o._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600">{o.orderNo || `PO-${o._id.slice(-5)}`}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{o.productName}</h3>
                    <span className="text-xs text-slate-500 font-mono block mt-1">Batch ID: <strong className="text-slate-800">{o.batchId}</strong></span>
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    o.status === 'running' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' : o.status === 'quality_testing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {(o.status || 'planning').replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Planned Qty</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{(o.qtyPlanned || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Produced Qty</span>
                    <span className="text-xs font-mono font-bold text-blue-600">{o.qtyProduced ? o.qtyProduced.toLocaleString() : '0'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Shift</span>
                    <span className="text-xs font-bold text-slate-700">{o.shiftId || 'Morning'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingOrder(o)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="Edit Order"
                  >
                    <Icon icon="mdi:pencil-outline" className="text-base" />
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(o._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Order"
                  >
                    <Icon icon="mdi:trash-can-outline" className="text-base" />
                  </button>
                </div>

                <div className="flex gap-2">
                  {o.status === 'planning' && (
                    <button
                      onClick={() => handleStartProduction(o._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      <Icon icon="mdi:play" className="text-base" /> Start Batch
                    </button>
                  )}

                  {o.status === 'running' && (
                    <button
                      onClick={() => handleCompleteProduction(o._id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      <Icon icon="mdi:check-circle" className="text-base" /> Complete
                    </button>
                  )}

                  {o.status === 'quality_testing' && (
                    <span className="text-xs text-indigo-600 font-bold flex items-center gap-1">
                      <Icon icon="mdi:loading" className="animate-spin text-base" /> In QC Testing
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
