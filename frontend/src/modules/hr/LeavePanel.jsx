import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

const EMPTY_LEAVE = {
  empId: '',
  empName: '',
  department: 'Plant Operations',
  leaveType: 'Casual Leave',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  daysCount: 1,
  reason: '',
};

export default function LeavePanel({ user, triggerError }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [newLeave, setNewLeave] = useState(EMPTY_LEAVE);

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/leaves');
      setLeaves(res?.data || []);
    } catch (err) {
      console.warn('Leave fetch failed:', err);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/hr/leaves', newLeave);
      setLeaves([res.data, ...leaves]);
      setShowApplyModal(false);
      setNewLeave(EMPTY_LEAVE);
      if (triggerError) triggerError('Leave application submitted!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err?.message || 'Failed to submit leave', 'error');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.put(`/hr/leaves/${id}`, {
        status: newStatus,
        approvedBy: newStatus === 'Approved' ? (user?.name || 'General Manager') : 'Rejected',
      });
      setLeaves(leaves.map(l => l._id === id ? res.data : l));
      if (triggerError) triggerError(`Leave status updated to ${newStatus}`, 'success');
    } catch (err) {
      if (triggerError) triggerError(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Delete this leave application?')) return;
    try {
      await api.delete(`/hr/leaves/${id}`);
      setLeaves(leaves.filter(l => l._id !== id));
      if (triggerError) triggerError('Leave application removed!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err?.message || 'Failed to delete leave', 'error');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:calendar-multiselect" className="text-orange-500 text-lg" /> Employee Leave Management & Approval Workflow
          </h2>
          <p className="text-xs text-slate-400">Casual Leave, Sick Leave, Paid Leave, Loss of Pay tracking & approval workflow</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={leaves} filename="employee_leaves_report" title="Employee Leave Report" />
          <button
            onClick={() => { setNewLeave(EMPTY_LEAVE); setShowApplyModal(true); }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Apply New Leave
          </button>
        </div>
      </div>

      {showApplyModal && (
        <form onSubmit={handleApplyLeave} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:calendar-multiselect" className="text-orange-500 text-base" /> Submit Employee Leave Application
            </h3>
            <button type="button" onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Employee Name *</label>
              <input type="text" required placeholder="e.g. Rohan Gupta" value={newLeave.empName} onChange={(e) => setNewLeave({ ...newLeave, empName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Employee ID</label>
              <input type="text" placeholder="EMP-101" value={newLeave.empId} onChange={(e) => setNewLeave({ ...newLeave, empId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono uppercase" />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Leave Type</label>
              <select value={newLeave.leaveType} onChange={(e) => setNewLeave({ ...newLeave, leaveType: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none">
                <option value="Casual Leave">Casual Leave (CL)</option>
                <option value="Sick Leave">Sick Leave (SL)</option>
                <option value="Paid Leave">Earned / Paid Leave (PL)</option>
                <option value="Loss Of Pay">Loss Of Pay (LOP)</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Emergency Leave">Emergency Leave</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Department</label>
              <input type="text" value={newLeave.department} onChange={(e) => setNewLeave({ ...newLeave, department: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Start Date *</label>
              <input type="date" required value={newLeave.startDate} onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono" />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">End Date *</label>
              <input type="date" required value={newLeave.endDate} onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Reason for Leave *</label>
              <input type="text" required placeholder="e.g. Family function / Medical rest" value={newLeave.reason} onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowApplyModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">Submit Application</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-xs text-slate-400">Loading leave records...</div>
      ) : leaves.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:calendar-multiselect" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Leave Applications Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no leave requests submitted for review. Click below to apply for employee leave.</p>
          <button onClick={() => { setNewLeave(EMPTY_LEAVE); setShowApplyModal(true); }} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm">
            <Icon icon="mdi:plus" className="text-base" /> Apply First Leave
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Leave Ref</th>
                  <th className="p-4">Employee Name</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Leave Type</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Approval Status</th>
                  <th className="p-4 text-right">Approval Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{l.leaveRef}</td>
                    <td className="p-4 font-bold text-slate-900">{l.empName}</td>
                    <td className="p-4 text-slate-600 font-semibold">{l.department}</td>
                    <td className="p-4 font-bold text-blue-700">{l.leaveType}</td>
                    <td className="p-4 font-mono text-slate-700">{l.startDate} to {l.endDate}</td>
                    <td className="p-4 text-slate-600">{l.reason}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : l.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {l.status === 'Pending' ? (
                          <>
                            <button onClick={() => handleUpdateStatus(l._id, 'Approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1 rounded-lg font-bold cursor-pointer">Approve</button>
                            <button onClick={() => handleUpdateStatus(l._id, 'Rejected')} className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] px-2.5 py-1 rounded-lg font-bold cursor-pointer">Reject</button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">{l.approvedBy}</span>
                        )}
                        <button onClick={() => handleDeleteLeave(l._id)} className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
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
