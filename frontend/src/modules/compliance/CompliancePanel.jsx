import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { api } from '../../lib/api';
import ExportDataToolbar from '../../components/ExportDataToolbar';

const COMPLIANCE_TYPES = [
  'FSSAI License',
  'GST Registration',
  'ISO Certification',
  'Factory License',
  'MSME Registration',
  'Fire NOC',
  'PCB Consent',
  'Shop & Establishment',
  'Labour License',
  'Trade License',
  'Food Safety Audit',
  'BIS Certification',
];

const STATUS_CONFIG = {
  Active: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'Expiring Soon': { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' },
  Expired: { color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  Pending: { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  'Under Renewal': { color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
};

const emptyForm = {
  complianceType: COMPLIANCE_TYPES[0],
  licenseNo: '',
  issuedBy: '',
  issueDate: '',
  expiryDate: '',
  status: 'Active',
  plant: '',
  remarks: '',
};

function daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function CompliancePanel({ user, triggerError }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/compliance/records');
      if (res.success && Array.isArray(res.data)) {
        setRecords(res.data.map(r => ({
          ...r,
          licenseName: r.licenseName || r.complianceType,
          authority: r.authority || r.issuedBy,
        })));
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.warn('Failed to load compliance records:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let computedStatus = form.status;
    const days = daysUntilExpiry(form.expiryDate);
    if (days !== null) {
      if (days < 0) computedStatus = 'Expired';
      else if (days <= 30) computedStatus = 'Expiring Soon';
    }
    const payload = {
      ...form,
      licenseName: form.complianceType,
      authority: form.issuedBy || 'Food Safety Authority',
      status: computedStatus,
    };

    try {
      setLoading(true);
      if (editing) {
        const res = await api.put(`/compliance/records/${editing._id}`, payload);
        if (res.success && res.data) {
          setRecords(records.map((r) => (r._id === editing._id ? res.data : r)));
          if (triggerError) triggerError('Compliance record updated!', 'success');
        } else {
          throw new Error(res.message || 'Failed to update record');
        }
      } else {
        const res = await api.post('/compliance/records', payload);
        if (res.success && res.data) {
          setRecords([res.data, ...records]);
          if (triggerError) triggerError('Compliance record added!', 'success');
        } else {
          throw new Error(res.message || 'Failed to add record');
        }
      }
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to save compliance record');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this compliance record?')) return;
    try {
      await api.delete(`/compliance/records/${id}`);
      setRecords(records.filter((r) => r._id !== id));
      if (triggerError) triggerError('Compliance record deleted', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete record');
    }
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({ ...emptyForm, ...r });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this compliance record?')) return;
    setRecords(records.filter((r) => r._id !== id));
    if (triggerError) triggerError('Record removed', 'success');
  };

  const filtered = filterStatus === 'All' ? records : records.filter((r) => r.status === filterStatus);

  const expiredCount = records.filter((r) => r.status === 'Expired').length;
  const expiringSoonCount = records.filter((r) => r.status === 'Expiring Soon').length;
  const activeCount = records.filter((r) => r.status === 'Active').length;

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:certificate-outline" className="text-orange-500 text-base" />
            FSSAI, GST & Compliance Tracker
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Track all licenses, certifications and regulatory filings for your food manufacturing facility
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportDataToolbar data={records} filename="fssai_compliance_records" title="FSSAI & Regulatory Compliance" />
          <button
            onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer shrink-0"
          >
            <Icon icon="mdi:plus" className="text-sm" /> Add Record
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: records.length, icon: 'mdi:certificate-outline', color: 'text-slate-600 bg-slate-50 border-slate-200' },
          { label: 'Active', value: activeCount, icon: 'mdi:check-circle-outline', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          { label: 'Expiring Soon', value: expiringSoonCount, icon: 'mdi:clock-alert-outline', color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Expired', value: expiredCount, icon: 'mdi:alert-circle-outline', color: 'text-rose-600 bg-rose-50 border-rose-200' },
        ].map((s) => (
          <div key={s.label} className={`border rounded-2xl p-4 flex items-center gap-3 shadow-xs ${s.color}`}>
            <Icon icon={s.icon} className="text-2xl shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.label}</div>
              <div className="text-xl font-extrabold mt-0.5">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert banner for expired/expiring */}
      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Icon icon="mdi:alert-outline" className="text-amber-500 text-xl shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Action Required</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {expiredCount > 0 && `${expiredCount} compliance record(s) have expired and need renewal. `}
              {expiringSoonCount > 0 && `${expiringSoonCount} record(s) expire within 30 days.`}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...Object.keys(STATUS_CONFIG)].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
              filterStatus === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table / Cards */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
            <Icon icon="mdi:file-certificate-outline" className="text-5xl text-slate-300" />
            <p className="text-sm font-bold text-slate-500">No compliance records yet</p>
            <p className="text-xs text-slate-400 text-center max-w-sm">
              Add your FSSAI license, GST registration, factory license, ISO certifications, and other regulatory documents.
            </p>
            <button
              onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }}
              className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              + Add First Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-widest border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-4">Compliance Type</th>
                  <th className="p-4">License No.</th>
                  <th className="p-4">Issued By</th>
                  <th className="p-4">Issue Date</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Days Left</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Plant</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const days = daysUntilExpiry(r.expiryDate);
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.Active;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4 font-bold text-slate-900">{r.complianceType}</td>
                      <td className="p-4 font-mono text-slate-600 text-[11px]">{r.licenseNo || '—'}</td>
                      <td className="p-4 text-slate-500">{r.issuedBy || '—'}</td>
                      <td className="p-4 font-mono text-slate-500 text-[11px]">{r.issueDate || '—'}</td>
                      <td className="p-4 font-mono text-slate-600 text-[11px] font-bold">{r.expiryDate || '—'}</td>
                      <td className="p-4">
                        {days !== null ? (
                          <span className={`text-[10px] font-bold ${days < 0 ? 'text-rose-600' : days <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-[11px]">{r.plant || '—'}</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition cursor-pointer">
                            <Icon icon="mdi:pencil-outline" className="text-sm" />
                          </button>
                          <button onClick={() => handleDeleteRecord(r._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition cursor-pointer">
                            <Icon icon="mdi:trash-can-outline" className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">
                {editing ? 'Edit Compliance Record' : 'Add New Compliance Record'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                <Icon icon="mdi:close" className="text-slate-500 text-base" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Compliance Type *</label>
                <select required value={form.complianceType} onChange={(e) => setForm({ ...form, complianceType: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white">
                  {COMPLIANCE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">License / Reg. Number</label>
                  <input type="text" placeholder="e.g. 11521034000189"
                    value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Issued By</label>
                  <input type="text" placeholder="e.g. FSSAI, GST Dept."
                    value={form.issuedBy} onChange={(e) => setForm({ ...form, issuedBy: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Issue Date</label>
                  <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Plant / Facility</label>
                  <input type="text" placeholder="e.g. Nashik Plant #1"
                    value={form.plant} onChange={(e) => setForm({ ...form, plant: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white">
                    {Object.keys(STATUS_CONFIG).map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Remarks / Notes</label>
                <textarea rows={2} placeholder="Any additional notes about renewal, conditions, etc."
                  value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer">
                  {editing ? 'Update Record' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
