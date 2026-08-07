import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function DispatchPanel({ user, triggerError }) {
  const [dispatches, setDispatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDsp, setEditingDsp] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    vehicleNo: '',
    driverName: '',
    destination: '',
    orderNo: '',
    qtyLoaded: '',
    status: 'In Transit',
    gpsLocation: '',
  });

  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const [res, orderRes] = await Promise.all([
        api.get('/dispatch/records'),
        api.get('/production/orders'),
      ]);
      if (res.success && Array.isArray(res.data)) {
        setDispatches(res.data);
      } else {
        setDispatches([]);
      }
      if (orderRes.success && Array.isArray(orderRes.data)) {
        setOrders(orderRes.data);
      }
    } catch (err) {
      console.warn('Failed to load dispatch orders:', err);
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    if (!orderId) return;
    const ord = orders.find((o) => o._id === orderId || o.orderNo === orderId);
    if (ord) {
      setFormData({
        ...formData,
        orderNo: ord.orderNo || `PO-${ord._id.slice(-5)}`,
        qtyLoaded: `${(ord.qtyProduced || ord.qtyPlanned || 5000).toLocaleString()} ${ord.unit || 'Bottles'} (${ord.productName})`,
      });
    }
  };

  const handleCreateDsp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        dispatchNo: formData.id || `DSP-2026-10${dispatches.length + 1}`,
        id: formData.id || `DSP-2026-10${dispatches.length + 1}`,
        vehicleNo: formData.vehicleNo,
        driverName: formData.driverName,
        destination: formData.destination,
        orderNo: formData.orderNo,
        qtyLoaded: formData.qtyLoaded,
        status: formData.status,
        gpsLocation: formData.gpsLocation,
      };
      const res = await api.post('/dispatch/records', payload);
      if (res.success && res.data) {
        setDispatches([res.data, ...dispatches]);
        setShowAddModal(false);
        setFormData({ id: '', vehicleNo: '', driverName: '', destination: '', orderNo: '', qtyLoaded: '', status: 'In Transit', gpsLocation: '' });
        if (triggerError) triggerError('Dispatch delivery order created!', 'success');
      } else {
        throw new Error(res.message || 'Failed to create dispatch order');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create dispatch order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDsp = async (e) => {
    e.preventDefault();
    if (!editingDsp) return;
    try {
      setLoading(true);
      const res = await api.put(`/dispatch/records/${editingDsp._id}`, formData);
      if (res.success && res.data) {
        setDispatches(dispatches.map(d => (d._id === editingDsp._id ? res.data : d)));
      } else {
        setDispatches(dispatches.map(d => (d._id === editingDsp._id ? { ...d, ...formData } : d)));
      }
      setEditingDsp(null);
      if (triggerError) triggerError('Dispatch order updated!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update dispatch order');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDsp = async (id) => {
    if (!window.confirm('Delete this dispatch order?')) return;
    try {
      setLoading(true);
      await api.delete(`/dispatch/records/${id}`);
      setDispatches(dispatches.filter(d => d._id !== id));
      if (triggerError) triggerError('Dispatch order removed!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete dispatch order');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (d) => {
    setEditingDsp(d);
    setFormData({
      id: d.id || d.dispatchNo || '',
      vehicleNo: d.vehicleNo || '',
      driverName: d.driverName || '',
      destination: d.destination || '',
      orderNo: d.orderNo || '',
      qtyLoaded: d.qtyLoaded || '5,000 Bottles',
      status: d.status || 'In Transit',
      gpsLocation: d.gpsLocation || '',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:truck-delivery-outline" className="text-orange-500 text-lg" /> Dispatch & Logistics Tracking
          </h2>
          <p className="text-xs text-slate-400">Vehicle loading challans, driver assignment, proof of delivery (POD), and GPS tracking</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={dispatches} filename="dispatch_logistics_orders" title="Dispatch & Delivery Orders" />
          <button
            onClick={() => {
              setFormData({ id: `DSP-2026-10${dispatches.length + 1}`, vehicleNo: 'MH-15-EG-4521', driverName: 'Ramesh Patil', destination: '', orderNo: 'SO-2026-001', qtyLoaded: '5,000 Bottles', status: 'In Transit', gpsLocation: 'Expressway In-Transit' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Create Dispatch Order
          </button>
        </div>
      </div>

      {(showAddModal || editingDsp) && (
        <form onSubmit={editingDsp ? handleUpdateDsp : handleCreateDsp} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:truck-delivery-outline" className="text-orange-500 text-base" />
              {editingDsp ? `Edit Dispatch Order (${editingDsp.id || editingDsp.dispatchNo})` : 'Create New Dispatch Order'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingDsp(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          {!editingDsp && (
            <div className="bg-orange-50/60 border border-orange-100 p-3 rounded-xl">
              <label className="text-xs font-bold text-orange-900 block mb-1">
                Select Production Order for Dispatch (Auto-fill)
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => handleSelectOrder(e.target.value)}
                className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="">-- Manual Entry (Or select a Production Order below) --</option>
                {orders.map((o) => (
                  <option key={o._id} value={o._id}>
                    [{o.orderNo || 'PO'}] Batch {o.batchId} - {o.productName} ({o.qtyProduced || o.qtyPlanned} {o.unit || 'Units'})
                  </option>
                ))}
              </select>
              {selectedOrderId && (
                <span className="text-[10px] text-orange-700 block mt-1 font-semibold">
                  ✓ Auto-filled order ref & loaded quantity from Production Order {selectedOrderId}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Dispatch Ref *</label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g. DSP-2026-101"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Destination Location / Client *</label>
              <input
                type="text"
                required
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="e.g. Taj Palace, Colaba, Mumbai"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Vehicle Registration No *</label>
              <input
                type="text"
                required
                value={formData.vehicleNo}
                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                placeholder="e.g. MH-15-EG-4521"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Assigned Driver Name *</label>
              <input
                type="text"
                required
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="e.g. Ramesh Patil"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Sales Order Ref</label>
              <input
                type="text"
                value={formData.orderNo}
                onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                placeholder="e.g. SO-2026-001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Quantity Loaded *</label>
              <input
                type="text"
                required
                value={formData.qtyLoaded}
                onChange={(e) => setFormData({ ...formData, qtyLoaded: e.target.value })}
                placeholder="e.g. 5,000 Bottles"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">GPS Location Status</label>
              <input
                type="text"
                value={formData.gpsLocation}
                onChange={(e) => setFormData({ ...formData, gpsLocation: e.target.value })}
                placeholder="e.g. Mumbai Expressway (Km 84)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingDsp(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingDsp ? 'Update Order' : 'Save Dispatch Order'}
            </button>
          </div>
        </form>
      )}

      {dispatches.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:truck-delivery-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Dispatch Orders Active</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">No vehicles are currently dispatched or loading for delivery. Click below to create a dispatch order.</p>
          <button
            onClick={() => {
              setFormData({ id: 'DSP-2026-101', vehicleNo: 'MH-15-EG-4521', driverName: 'Ramesh Patil', destination: '', orderNo: 'SO-2026-001', qtyLoaded: '5,000 Bottles', status: 'In Transit', gpsLocation: 'Expressway In-Transit' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Create First Dispatch Order
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dispatches.map((d) => (
            <div key={d._id || d.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-orange-600">{d.id || d.dispatchNo}</span>
                  <h3 className="font-bold text-slate-900 text-base">{d.destination}</h3>
                  <span className="text-xs text-slate-400 font-mono">Order Ref: {d.orderNo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                    d.status === 'In Transit' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {d.status}
                  </span>
                  <button onClick={() => openEditModal(d)} className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                    <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                  </button>
                  <button onClick={() => handleDeleteDsp(d._id || d.id)} className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
                    <Icon icon="mdi:trash-can-outline" className="text-base text-rose-500" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehicle Number</span>
                  <span className="text-xs font-mono font-bold text-slate-900">{d.vehicleNo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Driver</span>
                  <span className="text-xs font-bold text-slate-800">{d.driverName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Quantity Loaded</span>
                  <span className="text-xs font-mono font-bold text-blue-700">{d.qtyLoaded}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">GPS Live Status</span>
                  <span className="text-xs font-semibold text-emerald-600 truncate block">{d.gpsLocation || 'In Transit'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
