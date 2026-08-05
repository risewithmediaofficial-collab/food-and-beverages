import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '@iconify/react';

export default function FinancePanel() {
  const [ledgers, setLedgers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    accountName: '',
    type: 'credit',
    amount: 10000,
    refType: 'SalesInvoicing',
  });
  const [editingLedger, setEditingLedger] = useState(null);

  useEffect(() => {
    loadLedgers();
  }, []);

  const loadLedgers = async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const res = await api.get('/finance/ledgers');
      if (res.success && Array.isArray(res.data)) {
        setLedgers(res.data);
      } else {
        setLedgers([]);
      }
    } catch (err) {
      console.warn('Unable to load finance ledgers from backend.', err);
      setLoadError('Unable to load financial ledgers. Please verify backend connectivity and data.');
      setLedgers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLedger = async (e) => {
    e.preventDefault();
    setActionError('');
    const payload = {
      accountName: newEntry.accountName,
      type: newEntry.type,
      amount: Number(newEntry.amount),
      refType: newEntry.refType,
      date: new Date().toISOString(),
    };

    try {
      const res = await api.post('/finance/ledgers', payload);
      if (res.success && res.data) {
        setLedgers([res.data, ...ledgers]);
        setShowAddModal(false);
        setNewEntry({ accountName: '', type: 'credit', amount: 10000, refType: 'SalesInvoicing' });
        return;
      }
      throw new Error(res.message || 'Ledger entry failed');
    } catch (err) {
      const localEntry = {
        _id: Date.now().toString(),
        ...payload,
      };
      setLedgers([localEntry, ...ledgers]);
      setShowAddModal(false);
    }
  };

  const handleUpdateLedger = async (e) => {
    e.preventDefault();
    if (!editingLedger) return;
    setActionError('');
    try {
      const res = await api.put(`/finance/ledgers/${editingLedger._id}`, editingLedger);
      if (res.success) {
        setLedgers(ledgers.map(l => l._id === editingLedger._id ? { ...editingLedger, ...res.data } : l));
        setEditingLedger(null);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setLedgers(ledgers.map(l => l._id === editingLedger._id ? editingLedger : l));
      setEditingLedger(null);
    }
  };

  const handleDeleteLedger = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ledger entry?')) return;
    setActionError('');
    try {
      await api.delete(`/finance/ledgers/${id}`);
    } catch (err) {
      console.warn('Backend delete failed, removing locally.', err);
    }
    setLedgers(ledgers.filter(l => l._id !== id));
  };

  const totalCredits = ledgers.filter(l => l.type === 'credit').reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalDebits = ledgers.filter(l => l.type === 'debit').reduce((sum, l) => sum + (l.amount || 0), 0);
  const netProfit = totalCredits - totalDebits;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:finance" className="text-blue-600 text-lg" /> Financial Ledgers & Profitability
          </h2>
          <p className="text-xs text-slate-400">Automated double-entry accounting entries generated from Sales, Purchase & Line Production costs</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer w-full sm:w-auto"
        >
          <Icon icon="mdi:plus" className="text-base" /> Add Ledger Entry
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-slate-400 block font-bold uppercase">Total Revenue (Credits)</span>
          <span className="text-2xl font-extrabold font-mono text-emerald-600 mt-2 block">₹{totalCredits.toLocaleString()}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-slate-400 block font-bold uppercase">Expenses (Debits)</span>
          <span className="text-2xl font-extrabold font-mono text-rose-600 mt-2 block">₹{totalDebits.toLocaleString()}</span>
        </div>
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs text-blue-700 block font-bold uppercase">Gross Profitability</span>
          <span className="text-2xl font-extrabold font-mono text-blue-900 mt-2 block">₹{netProfit.toLocaleString()}</span>
        </div>
      </div>

      {actionError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700"><Icon icon="mdi:close" /></button>
        </div>
      )}

      {/* Add Ledger Entry Modal */}
      {showAddModal && (
        <form onSubmit={handleCreateLedger} className="bg-white border border-blue-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">New Financial Ledger Entry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Account Description *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bulk Juice Sales Collection"
                value={newEntry.accountName}
                onChange={(e) => setNewEntry({ ...newEntry, accountName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Entry Type</label>
              <select
                value={newEntry.type}
                onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="credit">Credit (Income / Revenue)</option>
                <option value="debit">Debit (Expense / COGS)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Amount (₹)</label>
              <input
                type="number"
                min="1"
                required
                value={newEntry.amount}
                onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Reference Module</label>
              <input
                type="text"
                value={newEntry.refType}
                onChange={(e) => setNewEntry({ ...newEntry, refType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Save Entry</button>
          </div>
        </form>
      )}

      {/* Edit Ledger Modal */}
      {editingLedger && (
        <form onSubmit={handleUpdateLedger} className="bg-white border border-amber-300 p-5 rounded-2xl space-y-4 shadow-md">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:pencil" className="text-amber-600 text-base" /> Edit Ledger Entry
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Account Description</label>
              <input
                type="text"
                required
                value={editingLedger.accountName || ''}
                onChange={(e) => setEditingLedger({ ...editingLedger, accountName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Type</label>
              <select
                value={editingLedger.type || 'credit'}
                onChange={(e) => setEditingLedger({ ...editingLedger, type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="credit">credit</option>
                <option value="debit">debit</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Amount (₹)</label>
              <input
                type="number"
                value={editingLedger.amount || 0}
                onChange={(e) => setEditingLedger({ ...editingLedger, amount: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditingLedger(null)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Update Entry</button>
          </div>
        </form>
      )}

      {/* Main Table */}
      {loadError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-5 text-sm">{loadError}</div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-sm text-slate-500">Loading financial ledgers...</div>
      ) : ledgers.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-700">No financial ledger entries available. Click "Add Ledger Entry" to record financial transactions.</div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[600px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Account Description</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgers.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{l.accountName}</td>
                    <td className="p-4 uppercase font-bold text-[10px]">
                      <span className={`px-2.5 py-1 rounded-full ${l.type === 'credit' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {l.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{l.refType || 'General'}</td>
                    <td className={`p-4 font-mono font-bold ${l.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      ₹{(l.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-400">{l.date ? new Date(l.date).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingLedger(l)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Edit Ledger Entry"
                        >
                          <Icon icon="mdi:pencil-outline" className="text-base" />
                        </button>
                        <button
                          onClick={() => handleDeleteLedger(l._id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Ledger Entry"
                        >
                          <Icon icon="mdi:trash-can-outline" className="text-base" />
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
