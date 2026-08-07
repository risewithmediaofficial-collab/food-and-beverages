import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { api } from '../../lib/api';
import ExportDataToolbar from '../../components/ExportDataToolbar';

const EXPENSE_CATEGORIES = [
  'Fuel & Logistics',
  'Raw Material Cost',
  'Utilities (Power/Water)',
  'Labour & Wages',
  'Machine Maintenance',
  'Packaging Materials',
  'Office & Admin',
  'Marketing & Sales',
  'FSSAI & Compliance',
  'Miscellaneous',
];

const emptyForm = {
  expenseDate: new Date().toISOString().split('T')[0],
  category: EXPENSE_CATEGORIES[0],
  description: '',
  amount: '',
  paymentMode: 'Bank Transfer',
  vendor: '',
  referenceNo: '',
  approvedBy: '',
  status: 'Approved',
};

export default function ExpensePanel({ user, triggerError }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/expenses');
      setExpenses(res.success && Array.isArray(res.data) ? res.data : []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editing) {
        const res = await api.put(`/finance/expenses/${editing._id}`, form);
        if (res.success && res.data) {
          setExpenses(expenses.map((ex) => (ex._id === editing._id ? res.data : ex)));
          if (triggerError) triggerError('Expense updated!', 'success');
        } else {
          throw new Error(res.message || 'Failed to update expense');
        }
      } else {
        const res = await api.post('/finance/expenses', form);
        if (res.success && res.data) {
          setExpenses([res.data, ...expenses]);
          if (triggerError) triggerError('Expense recorded!', 'success');
        } else {
          throw new Error(res.message || 'Failed to record expense');
        }
      }
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      await api.delete(`/finance/expenses/${id}`);
      setExpenses(expenses.filter((ex) => ex._id !== id));
      if (triggerError) triggerError('Expense deleted', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Delete failed');
    }
  };

  const openEdit = (ex) => {
    setEditing(ex);
    setForm({
      expenseDate: ex.expenseDate?.split('T')[0] || emptyForm.expenseDate,
      category: ex.category || EXPENSE_CATEGORIES[0],
      description: ex.description || '',
      amount: ex.amount || '',
      paymentMode: ex.paymentMode || 'Bank Transfer',
      vendor: ex.vendor || '',
      referenceNo: ex.referenceNo || '',
      approvedBy: ex.approvedBy || '',
      status: ex.status || 'Approved',
    });
    setShowModal(true);
  };

  const filtered = filterCat === 'All' ? expenses : expenses.filter((e) => e.category === filterCat);
  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:receipt-text-outline" className="text-orange-500 text-base" />
            Expense Tracker
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Total Expenses: <span className="font-bold text-orange-600">₹{totalAmount.toLocaleString('en-IN')}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <ExportDataToolbar data={expenses} filename="expenses" />
          <button
            onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-sm" /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses', value: `₹${totalAmount.toLocaleString('en-IN')}`, icon: 'mdi:cash-multiple', color: 'text-orange-600 bg-orange-50 border-orange-100' },
          { label: 'Records', value: expenses.length, icon: 'mdi:receipt-text-outline', color: 'text-slate-600 bg-slate-50 border-slate-200' },
          { label: 'This Filter', value: `₹${totalFiltered.toLocaleString('en-IN')}`, icon: 'mdi:filter-outline', color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Categories', value: [...new Set(expenses.map((e) => e.category))].length, icon: 'mdi:tag-multiple-outline', color: 'text-violet-600 bg-violet-50 border-violet-100' },
        ].map((s) => (
          <div key={s.label} className={`border rounded-2xl p-4 flex items-center gap-3 shadow-xs ${s.color}`}>
            <Icon icon={s.icon} className="text-2xl shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.label}</div>
              <div className="text-lg font-extrabold mt-0.5">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...EXPENSE_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
              filterCat === cat
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading expenses...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
            <Icon icon="mdi:receipt-text-remove-outline" className="text-5xl text-slate-300" />
            <p className="text-sm font-bold text-slate-500">No expense records found</p>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              Record operational costs like fuel, utilities, wages, raw materials, and maintenance expenses.
            </p>
            <button
              onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }}
              className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              + Add First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-widest border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ex) => (
                  <tr key={ex._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-mono text-slate-500">{ex.expenseDate?.split('T')[0] || '—'}</td>
                    <td className="p-4">
                      <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {ex.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800 max-w-[180px] truncate">{ex.description || '—'}</td>
                    <td className="p-4 text-slate-500">{ex.vendor || '—'}</td>
                    <td className="p-4 font-extrabold text-slate-900">₹{Number(ex.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4 text-slate-500 text-[11px]">{ex.paymentMode}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        ex.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : ex.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {ex.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(ex)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition cursor-pointer">
                          <Icon icon="mdi:pencil-outline" className="text-sm" />
                        </button>
                        <button onClick={() => handleDelete(ex._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition cursor-pointer">
                          <Icon icon="mdi:trash-can-outline" className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                {editing ? 'Edit Expense' : 'Record New Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                <Icon icon="mdi:close" className="text-base text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Date *</label>
                  <input type="date" required value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Category *</label>
                  <select required value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
                  >
                    {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                <input type="text" placeholder="e.g. Monthly electricity bill — Nashik Plant"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Amount (₹) *</label>
                  <input type="number" required min="0" step="0.01" placeholder="e.g. 25000"
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Payment Mode</label>
                  <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
                  >
                    {['Bank Transfer', 'Cash', 'Cheque', 'UPI', 'Credit Card', 'NEFT/RTGS'].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Vendor / Payee</label>
                  <input type="text" placeholder="e.g. Maharashtra Electricity Board"
                    value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Reference No.</label>
                  <input type="text" placeholder="e.g. INV-2026-0081"
                    value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Approved By</label>
                  <input type="text" placeholder="Manager name"
                    value={form.approvedBy} onChange={(e) => setForm({ ...form, approvedBy: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
                  >
                    {['Approved', 'Pending', 'Rejected'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer">
                  {loading ? 'Saving...' : editing ? 'Update Expense' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
