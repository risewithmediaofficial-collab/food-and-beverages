import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function ProductionPlanningPanel({ user, triggerError }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    planCode: '',
    productName: '',
    targetQty: 25000,
    unit: 'Bottles',
    shift: 'Morning + Evening',
    targetDate: new Date().toISOString().split('T')[0],
    capacityPct: 85,
    status: 'Approved',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/production/plans');
      if (res.success && Array.isArray(res.data)) {
        setPlans(res.data);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.warn('Failed to load production plans:', err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        planCode: formData.planCode || `PLN-AUG-0${plans.length + 1}`,
        productName: formData.productName,
        targetQty: formData.targetQty,
        plannedQty: `${formData.targetQty} ${formData.unit}`,
        unit: formData.unit,
        shift: formData.shift,
        plannedShift: formData.shift,
        targetDate: formData.targetDate,
        capacityPct: formData.capacityPct,
        capacityUtilizationPct: formData.capacityPct,
        status: formData.status,
      };
      const res = await api.post('/production/plans', payload);
      if (res.success && res.data) {
        setPlans([res.data, ...plans]);
        setShowAddModal(false);
        setFormData({ planCode: '', productName: '', targetQty: 25000, unit: 'Bottles', shift: 'Morning + Evening', targetDate: new Date().toISOString().split('T')[0], capacityPct: 85, status: 'Approved' });
        if (triggerError) triggerError('Production schedule plan created!', 'success');
      } else {
        throw new Error(res.message || 'Failed to create plan');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      setLoading(true);
      const res = await api.put(`/production/plans/${editingPlan._id}`, formData);
      if (res.success && res.data) {
        setPlans(plans.map(p => (p._id === editingPlan._id ? res.data : p)));
      } else {
        setPlans(plans.map(p => (p._id === editingPlan._id ? { ...p, ...formData } : p)));
      }
      setEditingPlan(null);
      if (triggerError) triggerError('Production plan updated!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Delete this production plan schedule?')) return;
    try {
      setLoading(true);
      await api.delete(`/production/plans/${id}`);
      setPlans(plans.filter(p => p._id !== id));
      if (triggerError) triggerError('Production plan removed!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete plan');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (p) => {
    setEditingPlan(p);
    setFormData({
      planCode: p.planCode || '',
      productName: p.productName || '',
      targetQty: p.targetQty || 20000,
      unit: p.unit || 'Bottles',
      shift: p.shift || p.plannedShift || 'Morning',
      targetDate: p.targetDate || new Date().toISOString().split('T')[0],
      capacityPct: p.capacityPct || p.capacityUtilizationPct || 80,
      status: p.status || 'Planning',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:calendar-clock" className="text-orange-500 text-lg" /> Production Planning & Capacity Scheduling
          </h2>
          <p className="text-xs text-slate-400">Daily, weekly, and monthly plant output planning with line capacity utilization optimization</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={plans} filename="production_planning_schedule" title="Production Planning Schedule" />
          <button
            onClick={() => {
              setFormData({ planCode: `PLN-AUG-0${plans.length + 1}`, productName: '', targetQty: 25000, unit: 'Bottles', shift: 'Morning + Evening', targetDate: new Date().toISOString().split('T')[0], capacityPct: 85, status: 'Approved' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add Production Plan
          </button>
        </div>
      </div>

      {(showAddModal || editingPlan) && (
        <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:calendar-clock" className="text-orange-500 text-base" />
              {editingPlan ? `Edit Production Plan (${editingPlan.planCode})` : 'Create New Production Target Schedule'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingPlan(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Plan Code *</label>
              <input
                type="text"
                required
                value={formData.planCode}
                onChange={(e) => setFormData({ ...formData, planCode: e.target.value })}
                placeholder="e.g. PLN-AUG-01"
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
              <label className="text-xs text-slate-600 font-bold block mb-1">Target Production Qty *</label>
              <input
                type="number"
                required
                min={1}
                value={formData.targetQty}
                onChange={(e) => setFormData({ ...formData, targetQty: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Bottles / Cases / Liters"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Planned Shift Schedule *</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Morning">Morning Shift</option>
                <option value="Evening">Evening Shift</option>
                <option value="Night">Night Shift</option>
                <option value="Morning + Evening">Morning + Evening Shift</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Target Completion Date *</label>
              <input
                type="date"
                required
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Line Capacity Utilization (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.capacityPct}
                onChange={(e) => setFormData({ ...formData, capacityPct: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Approval Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Approved">Approved</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingPlan(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingPlan ? 'Update Plan' : 'Save Production Plan'}
            </button>
          </div>
        </form>
      )}

      {plans.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:calendar-clock" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Production Plans Scheduled</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no output targets or shift capacity schedules planned. Click below to add a production schedule.</p>
          <button
            onClick={() => {
              setFormData({ planCode: 'PLN-AUG-01', productName: '', targetQty: 25000, unit: 'Bottles', shift: 'Morning + Evening', targetDate: new Date().toISOString().split('T')[0], capacityPct: 85, status: 'Approved' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Create First Production Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((p) => (
            <div key={p._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-orange-600">{p.planCode}</span>
                  <h3 className="font-bold text-slate-900 text-base">{p.productName}</h3>
                  <span className="text-xs text-slate-400 font-mono">Target Date: {p.targetDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                    {p.status || 'Approved'}
                  </span>
                  <button onClick={() => openEditModal(p)} className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                    <Icon icon="mdi:pencil-outline" className="text-base" />
                  </button>
                  <button onClick={() => handleDeletePlan(p._id)} className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
                    <Icon icon="mdi:trash-can-outline" className="text-base" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Planned Target</span>
                  <span className="text-sm font-mono font-extrabold text-slate-900">
                    {(p.targetQty || 0).toLocaleString()} {p.unit || 'Bottles'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Planned Shift</span>
                  <span className="text-xs font-bold text-slate-800">{p.shift || p.plannedShift || 'Morning'}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 font-bold mb-1">
                  <span>Line Capacity Utilization</span>
                  <span className="text-orange-600 font-mono">{p.capacityPct || p.capacityUtilizationPct || 80}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${p.capacityPct || p.capacityUtilizationPct || 80}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
