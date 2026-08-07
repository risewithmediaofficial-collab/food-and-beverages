import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

const EMPTY_FORM = {
  shiftCode: '',
  shiftName: '',
  startTime: '08:00 AM',
  endTime: '05:00 PM',
  graceTimeMin: 15,
  breakTimeMin: 60,
  workingHours: 8,
  assignedWorkers: 0,
  overtimePolicy: '1.5x Hourly Rate',
  status: 'Active',
};

export default function ShiftPanel({ user, triggerError }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => { fetchShifts(); }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/shifts');
      setShifts(res?.data || []);
    } catch (err) {
      console.warn('Shift fetch failed:', err);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/hr/shifts', {
        ...formData,
        shiftCode: formData.shiftCode || `SFT-${String(shifts.length + 1).padStart(2, '0')}`,
      });
      setShifts([res.data, ...shifts]);
      setShowAddModal(false);
      setFormData(EMPTY_FORM);
      if (triggerError) triggerError('Shift schedule created!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err?.message || 'Failed to create shift', 'error');
    }
  };

  const handleUpdateShift = async (e) => {
    e.preventDefault();
    if (!editingShift) return;
    try {
      const res = await api.put(`/hr/shifts/${editingShift._id}`, formData);
      setShifts(shifts.map(s => s._id === editingShift._id ? res.data : s));
      setEditingShift(null);
      if (triggerError) triggerError('Shift details updated!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err?.message || 'Failed to update shift', 'error');
    }
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm('Delete this shift schedule?')) return;
    try {
      await api.delete(`/hr/shifts/${id}`);
      setShifts(shifts.filter(s => s._id !== id));
      if (triggerError) triggerError('Shift schedule deleted!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err?.message || 'Failed to delete shift', 'error');
    }
  };

  const openEditModal = (s) => {
    setEditingShift(s);
    setFormData({
      shiftCode: s.shiftCode || '',
      shiftName: s.shiftName || '',
      startTime: s.startTime || '08:00 AM',
      endTime: s.endTime || '05:00 PM',
      graceTimeMin: s.graceTimeMin || 15,
      breakTimeMin: s.breakTimeMin || 60,
      workingHours: s.workingHours || 8,
      assignedWorkers: s.assignedWorkers || 0,
      overtimePolicy: s.overtimePolicy || '1.5x Hourly Rate',
      status: s.status || 'Active',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:clock-outline" className="text-orange-500 text-lg" /> Plant Shift Roster & Schedule Management
          </h2>
          <p className="text-xs text-slate-400">Configure production shifts, working hours, grace periods, break times, and worker rosters</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={shifts} filename="plant_shifts_roster" title="Shift Roster Management" />
          <button
            onClick={() => {
              setFormData({ ...EMPTY_FORM, shiftCode: `SFT-${String(shifts.length + 1).padStart(2, '0')}` });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Create New Shift
          </button>
        </div>
      </div>

      {(showAddModal || editingShift) && (
        <form onSubmit={editingShift ? handleUpdateShift : handleCreateShift} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:clock-outline" className="text-orange-500 text-base" />
              {editingShift ? `Edit Shift (${editingShift.shiftName})` : 'Configure New Production Shift'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingShift(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Shift Code *</label>
              <input type="text" required value={formData.shiftCode} onChange={(e) => setFormData({ ...formData, shiftCode: e.target.value })} placeholder="e.g. SFT-01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase" />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Shift Name *</label>
              <input type="text" required value={formData.shiftName} onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })} placeholder="e.g. Morning Production Shift" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none" />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Start Time *</label>
              <input type="text" required value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} placeholder="06:00 AM" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none" />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">End Time *</label>
              <input type="text" required value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} placeholder="02:30 PM" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none" />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Grace Period (Minutes)</label>
              <input type="number" value={formData.graceTimeMin} onChange={(e) => setFormData({ ...formData, graceTimeMin: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono" />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Break Duration (Minutes)</label>
              <input type="number" value={formData.breakTimeMin} onChange={(e) => setFormData({ ...formData, breakTimeMin: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono" />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Overtime Policy</label>
              <input type="text" value={formData.overtimePolicy} onChange={(e) => setFormData({ ...formData, overtimePolicy: e.target.value })} placeholder="1.5x Hourly Rate" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingShift(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {editingShift ? 'Update Shift' : 'Save Shift Schedule'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-xs text-slate-400">Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:clock-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Shift Schedules Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no plant shift schedules configured. Click below to add your first shift roster.</p>
          <button
            onClick={() => { setFormData({ ...EMPTY_FORM, shiftCode: 'SFT-01' }); setShowAddModal(true); }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Configure First Shift
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Shift Code</th>
                  <th className="p-4">Shift Name</th>
                  <th className="p-4">Timings (IN - OUT)</th>
                  <th className="p-4">Grace Period</th>
                  <th className="p-4">Break Time</th>
                  <th className="p-4">Assigned Personnel</th>
                  <th className="p-4">Overtime Policy</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{s.shiftCode}</td>
                    <td className="p-4 font-bold text-slate-900">{s.shiftName}</td>
                    <td className="p-4 font-mono font-bold text-slate-800">{s.startTime} - {s.endTime}</td>
                    <td className="p-4 font-mono text-slate-600">{s.graceTimeMin} mins</td>
                    <td className="p-4 font-mono text-slate-600">{s.breakTimeMin} mins</td>
                    <td className="p-4 font-mono font-extrabold text-blue-700">{s.assignedWorkers || 0} Workers</td>
                    <td className="p-4 text-slate-600 font-semibold">{s.overtimePolicy}</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(s)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button onClick={() => handleDeleteShift(s._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
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
