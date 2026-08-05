import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function CustomerPanel({ user, triggerError }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCust, setEditingCust] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hotel & Hospitality',
    creditLimit: 500000,
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/crm/customers');
      if (res.success && Array.isArray(res.data)) {
        setCustomers(res.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.warn('Failed to load customers:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCust = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        custCode: `CUST-10${customers.length + 1}`,
        name: formData.name,
        category: formData.category,
        creditLimit: formData.creditLimit,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        gstin: formData.gstin,
        status: 'Active',
      };
      const res = await api.post('/crm/customers', payload);
      if (res.success && res.data) {
        setCustomers([res.data, ...customers]);
      } else {
        setCustomers([{ _id: Date.now().toString(), ...payload }, ...customers]);
      }
      setShowAddModal(false);
      setFormData({ name: '', category: 'Hotel & Hospitality', creditLimit: 500000, contactPerson: '', phone: '', email: '', gstin: '' });
      if (triggerError) triggerError('Customer account registered!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to register customer');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCust = async (e) => {
    e.preventDefault();
    if (!editingCust) return;
    try {
      setLoading(true);
      const res = await api.put(`/crm/customers/${editingCust._id}`, formData);
      if (res.success && res.data) {
        setCustomers(customers.map(c => (c._id === editingCust._id ? res.data : c)));
      } else {
        setCustomers(customers.map(c => (c._id === editingCust._id ? { ...c, ...formData } : c)));
      }
      setEditingCust(null);
      if (triggerError) triggerError('Customer account updated!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCust = async (id) => {
    if (!window.confirm('Delete this customer account?')) return;
    try {
      setLoading(true);
      await api.delete(`/crm/customers/${id}`);
      setCustomers(customers.filter(c => c._id !== id));
      if (triggerError) triggerError('Customer account deleted!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (c) => {
    setEditingCust(c);
    setFormData({
      name: c.name || '',
      category: c.category || 'Hotel & Hospitality',
      creditLimit: c.creditLimit || 500000,
      contactPerson: c.contactPerson || '',
      phone: c.phone || '',
      email: c.email || '',
      gstin: c.gstin || '',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:account-heart-outline" className="text-orange-500 text-lg" /> Customer, Dealer & Distributor Directory
          </h2>
          <p className="text-xs text-slate-400">Manage institutional client accounts, credit limits, GSTIN tax IDs, and billing contacts</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={customers} filename="customer_dealer_directory" title="Customer Accounts Directory" />
          <button
            onClick={() => {
              setFormData({ name: '', category: 'Hotel & Hospitality', creditLimit: 500000, contactPerson: '', phone: '', email: '', gstin: '' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add Customer Account
          </button>
        </div>
      </div>

      {(showAddModal || editingCust) && (
        <form onSubmit={editingCust ? handleUpdateCust : handleCreateCust} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:account-heart-outline" className="text-orange-500 text-base" />
              {editingCust ? `Edit Customer (${editingCust.name})` : 'Register New Customer Account'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingCust(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Customer / Company Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Taj Hotels & Resorts"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Account Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Hotel & Hospitality">Hotel & Hospitality</option>
                <option value="Supermarket Network">Supermarket Network</option>
                <option value="Regional Distributor">Regional Distributor</option>
                <option value="Authorized Dealer">Authorized Dealer</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Approved Credit Limit (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Suresh Patel"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98200 12345"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="procurement@tajhotels.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">GSTIN Tax Number</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="27AAAAA0000A1Z5"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono uppercase"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingCust(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingCust ? 'Update Customer' : 'Save Account'}
            </button>
          </div>
        </form>
      )}

      {customers.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:account-heart-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Customer Accounts Registered</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no institutional client or dealer accounts registered. Click below to add a customer account.</p>
          <button
            onClick={() => {
              setFormData({ name: '', category: 'Hotel & Hospitality', creditLimit: 500000, contactPerson: '', phone: '', email: '', gstin: '' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Register First Customer
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Customer Code</th>
                  <th className="p-4">Customer Account Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Credit Limit</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">GSTIN Number</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{c.custCode || c._id?.slice(-6)}</td>
                    <td className="p-4 font-bold text-slate-900">{c.name}</td>
                    <td className="p-4 text-slate-600 font-semibold">{c.category || 'Institutional'}</td>
                    <td className="p-4 font-mono font-bold text-emerald-600">₹{(c.creditLimit || 0).toLocaleString()}</td>
                    <td className="p-4 font-mono text-slate-600">
                      <div>{c.contactPerson || c.name}</div>
                      <div className="text-[10px] text-slate-400">📞 {c.phone || 'N/A'}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-700 font-bold">{c.gstin || 'N/A'}</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                        {c.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(c)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button onClick={() => handleDeleteCust(c._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
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
