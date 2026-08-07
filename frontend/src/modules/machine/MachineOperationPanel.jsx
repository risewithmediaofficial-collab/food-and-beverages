import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function MachineOperationPanel({ user, triggerError }) {
  const [operations, setOperations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOp, setEditingOp] = useState(null);
  const [formData, setFormData] = useState({
    code: 'MAC-FIL-01',
    lineName: '',
    operator: 'Sunil Rao',
    temp: '4.2 °C',
    pressure: '2.4 Bar',
    powerKwh: '142 kWh',
    waterLtr: '850 Ltr',
    status: 'Running',
  });

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const [res, orderRes] = await Promise.all([
        api.get('/machines'),
        api.get('/production/orders'),
      ]);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((m, idx) => ({
          _id: m._id,
          id: m.code || `OP-0${idx + 1}`,
          code: m.code,
          lineName: m.name,
          operator: m.operator || 'Assigned Operator',
          temp: m.temperature || '4.2 °C',
          pressure: m.pressure || '2.4 Bar',
          powerKwh: m.powerKwh || '142 kWh',
          waterLtr: m.waterLtr || '850 Ltr',
          status: m.currentStatus || 'Running',
        }));
        setOperations(mapped);
      } else {
        setOperations([]);
      }
      if (orderRes.success && Array.isArray(orderRes.data)) {
        setOrders(orderRes.data);
      }
    } catch (err) {
      console.warn('Failed to load machine operations:', err);
      setOperations([]);
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
        lineName: `${ord.productName} Production (Batch ${ord.batchId})`,
      });
    }
  };

  const handleCreateOp = (e) => {
    e.preventDefault();
    const created = {
      _id: Date.now().toString(),
      id: `OP-0${operations.length + 1}`,
      ...formData,
    };
    setOperations([created, ...operations]);
    setShowAddModal(false);
    setFormData({ code: 'MAC-FIL-01', lineName: '', operator: 'Sunil Rao', temp: '4.2 °C', pressure: '2.4 Bar', powerKwh: '142 kWh', waterLtr: '850 Ltr', status: 'Running' });
    if (triggerError) triggerError('Machine telemetry log registered!', 'success');
  };

  const handleUpdateOp = (e) => {
    e.preventDefault();
    if (!editingOp) return;
    setOperations(operations.map(op => (op._id === editingOp._id ? { ...op, ...formData } : op)));
    setEditingOp(null);
    if (triggerError) triggerError('Operation telemetry updated!', 'success');
  };

  const handleDeleteOp = (id) => {
    if (!window.confirm('Delete this operation telemetry log?')) return;
    setOperations(operations.filter(op => op._id !== id));
    if (triggerError) triggerError('Telemetry log removed!', 'success');
  };

  const openEditModal = (op) => {
    setEditingOp(op);
    setFormData({
      code: op.code || '',
      lineName: op.lineName || '',
      operator: op.operator || '',
      temp: op.temp || '4.2 °C',
      pressure: op.pressure || '2.4 Bar',
      powerKwh: op.powerKwh || '142 kWh',
      waterLtr: op.waterLtr || '850 Ltr',
      status: op.status || 'Running',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:sine-wave" className="text-orange-500 text-lg" /> Machine Operations & Live Telemetry
          </h2>
          <p className="text-xs text-slate-400">Real-time SCADA telemetry tracking: temperature, pressure, energy/water usage, and operator assignment</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={operations} filename="machine_live_telemetry" title="Machine Operations & SCADA Telemetry" />
          <button
            onClick={() => {
              setFormData({ code: `MAC-FIL-0${operations.length + 1}`, lineName: '', operator: 'Sunil Rao', temp: '4.2 °C', pressure: '2.4 Bar', powerKwh: '142 kWh', waterLtr: '850 Ltr', status: 'Running' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Log Telemetry
          </button>
        </div>
      </div>

      {(showAddModal || editingOp) && (
        <form onSubmit={editingOp ? handleUpdateOp : handleCreateOp} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:sine-wave" className="text-orange-500 text-base" />
              {editingOp ? `Edit Operation Telemetry (${editingOp.code})` : 'Register Machine Operation & Telemetry'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingOp(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          {!editingOp && (
            <div className="bg-orange-50/60 border border-orange-100 p-3 rounded-xl">
              <label className="text-xs font-bold text-orange-900 block mb-1">
                Link to Production Order / Batch (Auto-fill)
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => handleSelectOrder(e.target.value)}
                className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="">-- Manual Entry (Or select a Production Order below) --</option>
                {orders.map((o) => (
                  <option key={o._id} value={o._id}>
                    [{o.orderNo || 'PO'}] Batch {o.batchId} - {o.productName} ({o.qtyPlanned} {o.unit || 'Units'})
                  </option>
                ))}
              </select>
              {selectedOrderId && (
                <span className="text-[10px] text-orange-700 block mt-1 font-semibold">
                  ✓ Auto-filled line name from Production Order {selectedOrderId}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Machine Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. MAC-FIL-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Machine Line / Unit Name *</label>
              <input
                type="text"
                required
                value={formData.lineName}
                onChange={(e) => setFormData({ ...formData, lineName: e.target.value })}
                placeholder="e.g. Rotary Bottling & Capping Line #1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Assigned Operator *</label>
              <input
                type="text"
                required
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                placeholder="e.g. Sunil Rao"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Temperature</label>
              <input
                type="text"
                value={formData.temp}
                onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                placeholder="e.g. 4.2 °C"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Pressure</label>
              <input
                type="text"
                value={formData.pressure}
                onChange={(e) => setFormData({ ...formData, pressure: e.target.value })}
                placeholder="e.g. 2.4 Bar"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Power Usage</label>
              <input
                type="text"
                value={formData.powerKwh}
                onChange={(e) => setFormData({ ...formData, powerKwh: e.target.value })}
                placeholder="e.g. 142 kWh"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Water Flow Rate</label>
              <input
                type="text"
                value={formData.waterLtr}
                onChange={(e) => setFormData({ ...formData, waterLtr: e.target.value })}
                placeholder="e.g. 850 Ltr"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Operating Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Running">Running</option>
                <option value="Idle">Idle</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingOp(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {editingOp ? 'Update Telemetry' : 'Save Telemetry'}
            </button>
          </div>
        </form>
      )}

      {operations.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:sine-wave" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Telemetry Feeds Active</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">No machine lines are currently transmitting live operational telemetry. Click below to register line telemetry.</p>
          <button
            onClick={() => {
              setFormData({ code: 'MAC-FIL-01', lineName: '', operator: 'Sunil Rao', temp: '4.2 °C', pressure: '2.4 Bar', powerKwh: '142 kWh', waterLtr: '850 Ltr', status: 'Running' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Log Telemetry Feed
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {operations.map((op) => (
            <div key={op._id || op.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-orange-600">{op.code}</span>
                  <h3 className="font-bold text-slate-900 text-base">{op.lineName}</h3>
                  <span className="text-xs text-slate-400">Assigned Operator: <strong className="text-slate-800 font-semibold">{op.operator}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {op.status}
                  </span>
                  <button onClick={() => openEditModal(op)} className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                    <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                  </button>
                  <button onClick={() => handleDeleteOp(op._id || op.id)} className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
                    <Icon icon="mdi:trash-can-outline" className="text-base text-rose-500" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Temperature</span>
                  <span className="text-sm font-mono font-extrabold text-orange-600">{op.temp}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pressure</span>
                  <span className="text-sm font-mono font-extrabold text-blue-600">{op.pressure}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Power Usage</span>
                  <span className="text-sm font-mono font-extrabold text-emerald-600">{op.powerKwh}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Water Flow</span>
                  <span className="text-sm font-mono font-extrabold text-teal-600">{op.waterLtr}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
