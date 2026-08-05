import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function MaintenancePanel({ user, triggerError }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [formData, setFormData] = useState({
    ticketNo: '',
    machineName: '',
    machineCode: 'MAC-FIL-01',
    type: 'Preventive Maintenance',
    description: '',
    technician: 'Sunil Rao',
    cost: 4500,
    status: 'In Progress',
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/machines/maintenance');
      if (res.success && Array.isArray(res.data)) {
        setTickets(res.data);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.warn('Failed to load maintenance tickets:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ticketNo: formData.ticketNo || `MNT-2026-0${tickets.length + 1}`,
        ticketRef: formData.ticketNo || `MNT-2026-0${tickets.length + 1}`,
        machineName: formData.machineName,
        machineCode: formData.machineCode,
        type: formData.type,
        maintenanceType: formData.type,
        description: formData.description,
        workDescription: formData.description,
        technician: formData.technician,
        assignedTechnician: formData.technician,
        cost: formData.cost,
        status: formData.status,
      };
      const res = await api.post('/machines/maintenance', payload);
      if (res.success && res.data) {
        setTickets([res.data, ...tickets]);
      } else {
        setTickets([{ _id: Date.now().toString(), ...payload }, ...tickets]);
      }
      setShowAddModal(false);
      setFormData({ ticketNo: '', machineName: '', machineCode: 'MAC-FIL-01', type: 'Preventive Maintenance', description: '', technician: 'Sunil Rao', cost: 4500, status: 'In Progress' });
      if (triggerError) triggerError('Maintenance work order created!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create maintenance order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!editingTicket) return;
    try {
      setLoading(true);
      const res = await api.put(`/machines/maintenance/${editingTicket._id}`, formData);
      if (res.success && res.data) {
        setTickets(tickets.map(t => (t._id === editingTicket._id ? res.data : t)));
      } else {
        setTickets(tickets.map(t => (t._id === editingTicket._id ? { ...t, ...formData } : t)));
      }
      setEditingTicket(null);
      if (triggerError) triggerError('Maintenance ticket updated!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Delete this maintenance work order?')) return;
    try {
      setLoading(true);
      await api.delete(`/machines/maintenance/${id}`);
      setTickets(tickets.filter(t => t._id !== id));
      if (triggerError) triggerError('Maintenance ticket removed!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete ticket');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (t) => {
    setEditingTicket(t);
    setFormData({
      ticketNo: t.ticketNo || t.ticketRef || '',
      machineName: t.machineName || '',
      machineCode: t.machineCode || 'MAC-FIL-01',
      type: t.type || t.maintenanceType || 'Preventive Maintenance',
      description: t.description || t.workDescription || '',
      technician: t.technician || t.assignedTechnician || 'Sunil Rao',
      cost: t.cost || 4500,
      status: t.status || 'In Progress',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:wrench-outline" className="text-orange-500 text-lg" /> Machine Preventive & Breakdown Maintenance Logs
          </h2>
          <p className="text-xs text-slate-400">Preventive servicing schedules, sensor calibrations, breakdown work orders, and maintenance costs</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={tickets} filename="machine_maintenance_logs" title="Machine Maintenance Work Orders" />
          <button
            onClick={() => {
              setFormData({ ticketNo: `MNT-2026-0${tickets.length + 1}`, machineName: '', machineCode: 'MAC-FIL-01', type: 'Preventive Maintenance', description: '', technician: 'Sunil Rao', cost: 4500, status: 'In Progress' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Log Maintenance Work Order
          </button>
        </div>
      </div>

      {(showAddModal || editingTicket) && (
        <form onSubmit={editingTicket ? handleUpdateTicket : handleCreateTicket} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:wrench-outline" className="text-orange-500 text-base" />
              {editingTicket ? `Edit Maintenance Order (${editingTicket.ticketNo || editingTicket.ticketRef})` : 'Create New Maintenance Work Order'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingTicket(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Ticket Reference *</label>
              <input
                type="text"
                required
                value={formData.ticketNo}
                onChange={(e) => setFormData({ ...formData, ticketNo: e.target.value })}
                placeholder="e.g. MNT-2026-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Target Machine Name *</label>
              <input
                type="text"
                required
                value={formData.machineName}
                onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                placeholder="e.g. Rotary Bottling & Capping Line #1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Machine Code *</label>
              <input
                type="text"
                required
                value={formData.machineCode}
                onChange={(e) => setFormData({ ...formData, machineCode: e.target.value })}
                placeholder="e.g. MAC-FIL-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Maintenance Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Preventive Maintenance">Preventive Maintenance</option>
                <option value="Breakdown Repair">Breakdown Repair</option>
                <option value="Calibration">Sensor Calibration</option>
                <option value="Part Replacement">Part Replacement</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Work Description *</label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Monthly lubrication & filling nozzle seal replacement"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Assigned Technician *</label>
              <input
                type="text"
                required
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                placeholder="e.g. Sunil Rao"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Maintenance Cost (₹)</label>
              <input
                type="number"
                min={0}
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingTicket(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingTicket ? 'Update Ticket' : 'Save Work Order'}
            </button>
          </div>
        </form>
      )}

      {tickets.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:wrench-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Maintenance Tickets Logged</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no active breakdown or preventive servicing work orders. Click below to log a maintenance ticket.</p>
          <button
            onClick={() => {
              setFormData({ ticketNo: 'MNT-2026-01', machineName: '', machineCode: 'MAC-FIL-01', type: 'Preventive Maintenance', description: '', technician: 'Sunil Rao', cost: 4500, status: 'In Progress' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Log First Maintenance Ticket
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Ticket Ref</th>
                  <th className="p-4">Machine Name & Code</th>
                  <th className="p-4">Maintenance Type</th>
                  <th className="p-4">Work Description</th>
                  <th className="p-4">Assigned Technician</th>
                  <th className="p-4">Cost (₹)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{t.ticketNo || t.ticketRef}</td>
                    <td className="p-4 font-bold text-slate-900">
                      <div>{t.machineName}</div>
                      <span className="text-[10px] font-mono text-slate-400">{t.machineCode}</span>
                    </td>
                    <td className="p-4 text-slate-600 font-semibold">{t.type || t.maintenanceType}</td>
                    <td className="p-4 text-slate-700">{t.description || t.workDescription}</td>
                    <td className="p-4 font-bold text-slate-800">{t.technician || t.assignedTechnician}</td>
                    <td className="p-4 font-mono font-extrabold text-emerald-600">₹{(t.cost || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(t)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button onClick={() => handleDeleteTicket(t._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
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
