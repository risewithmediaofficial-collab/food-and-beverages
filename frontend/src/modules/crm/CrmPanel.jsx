import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '@iconify/react';

export default function CrmPanel() {
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [activeTab, setActiveTab] = useState('leads');
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', company: '', phone: '', email: '', source: 'Direct Call' });

  const [editingLead, setEditingLead] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    loadCrmData();
  }, []);

  const loadCrmData = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const leadRes = await api.get('/crm/leads');
      setLeads(leadRes.success && Array.isArray(leadRes.data) ? leadRes.data : []);

      const custRes = await api.get('/crm/customers');
      setCustomers(custRes.success && Array.isArray(custRes.data) ? custRes.data : []);
    } catch (err) {
      console.warn('Unable to load CRM data from backend.', err);
      setLoadError('Unable to load CRM data. Please verify backend connectivity and backend records.');
      setLeads([]);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const res = await api.post('/crm/leads', newLead);
      if (res.success) {
        setLeads([res.data, ...leads]);
        setShowAddLead(false);
        setNewLead({ name: '', company: '', phone: '', email: '', source: 'Direct Call' });
      } else {
        throw new Error(res.message || 'Unable to create lead');
      }
    } catch (err) {
      console.warn('Unable to create lead.', err);
      setActionError('Unable to create lead. Please verify backend connectivity and form values.');
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    if (!editingLead) return;
    setActionError('');
    try {
      const res = await api.put(`/crm/leads/${editingLead._id}`, editingLead);
      if (res.success) {
        setLeads(leads.map(l => l._id === editingLead._id ? res.data : l));
        setEditingLead(null);
      } else {
        throw new Error(res.message || 'Unable to update lead');
      }
    } catch (err) {
      setActionError('Unable to update lead details.');
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    setActionError('');
    try {
      const res = await api.delete(`/crm/leads/${id}`);
      if (res.success) {
        setLeads(leads.filter(l => l._id !== id));
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setActionError('Unable to delete lead.');
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setActionError('');
    try {
      const res = await api.put(`/crm/customers/${editingCustomer._id}`, editingCustomer);
      if (res.success) {
        setCustomers(customers.map(c => c._id === editingCustomer._id ? res.data : c));
        setEditingCustomer(null);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setActionError('Unable to update customer.');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    setActionError('');
    try {
      const res = await api.delete(`/crm/customers/${id}`);
      if (res.success) {
        setCustomers(customers.filter(c => c._id !== id));
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setActionError('Unable to delete customer.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'leads' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon icon="mdi:account-multiple-outline" className="text-base" /> Leads Pipeline ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'customers' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon icon="mdi:account-check-outline" className="text-base" /> Converted Customers ({customers.length})
          </button>
        </div>

        <button
          onClick={() => setShowAddLead(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer w-full sm:w-auto justify-center"
        >
          <Icon icon="mdi:plus" className="text-base" /> Add New Lead
        </button>
      </div>

      {actionError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700"><Icon icon="mdi:close" /></button>
        </div>
      )}

      {/* Add Lead Form */}
      {showAddLead && (
        <form onSubmit={handleCreateLead} className="bg-white border border-blue-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
            <Icon icon="mdi:account-plus-outline" className="text-base text-blue-600" /> New Customer Lead
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Contact Person Name *"
              required
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Company / Chain Name *"
              required
              value={newLead.company}
              onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Phone Number *"
              required
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={newLead.email}
              onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowAddLead(false)} className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold">Save Lead</button>
          </div>
        </form>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <form onSubmit={handleUpdateLead} className="bg-white border border-amber-300 p-5 rounded-2xl space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <Icon icon="mdi:pencil-outline" className="text-base text-amber-600" /> Edit Lead Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Contact Name</label>
              <input
                type="text"
                required
                value={editingLead.name || ''}
                onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Company</label>
              <input
                type="text"
                required
                value={editingLead.company || ''}
                onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Phone</label>
              <input
                type="text"
                required
                value={editingLead.phone || ''}
                onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Email</label>
              <input
                type="email"
                value={editingLead.email || ''}
                onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditingLead(null)} className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
            <button type="submit" className="bg-amber-600 text-white px-5 py-2 rounded-xl text-xs font-bold">Update Lead</button>
          </div>
        </form>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <form onSubmit={handleUpdateCustomer} className="bg-white border border-amber-300 p-5 rounded-2xl space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <Icon icon="mdi:pencil-outline" className="text-base text-amber-600" /> Edit Customer Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={editingCustomer.name || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Phone</label>
              <input
                type="text"
                value={editingCustomer.phone || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                value={editingCustomer.creditLimit || 0}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, creditLimit: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Outstanding Balance (₹)</label>
              <input
                type="number"
                value={editingCustomer.outstandingBalance || 0}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, outstandingBalance: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-amber-600 text-white px-5 py-2 rounded-xl text-xs font-bold">Update Customer</button>
          </div>
        </form>
      )}

      {/* Main Content */}
      {loadError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-700">{loadError}</div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-sm text-slate-500">Loading CRM data...</div>
      ) : activeTab === 'leads' ? (
        leads.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-700">No leads available. Click "Add New Lead" to create a record.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <div key={lead._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition space-y-3 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{lead.name}</h3>
                    <span className="text-xs text-blue-600 flex items-center gap-1 font-semibold mt-0.5">
                      <Icon icon="mdi:domain" className="text-sm" /> {lead.company || 'Private Business'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {lead.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <p className="flex items-center gap-2"><Icon icon="mdi:phone-outline" className="text-slate-400 text-sm" /> {lead.phone}</p>
                  <p className="flex items-center gap-2"><Icon icon="mdi:email-outline" className="text-slate-400 text-sm" /> {lead.email || 'N/A'}</p>
                  <p className="text-slate-400 text-[11px] pt-1">Source: {lead.source}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setEditingLead(lead)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="Edit Lead"
                  >
                    <Icon icon="mdi:pencil-outline" className="text-base" />
                  </button>
                  <button
                    onClick={() => handleDeleteLead(lead._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Lead"
                  >
                    <Icon icon="mdi:trash-can-outline" className="text-base" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        customers.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-700">No customers found. Convert leads to populate customers.</div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[600px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Credit Limit</th>
                    <th className="p-4">Outstanding Balance</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{c.name}</td>
                      <td className="p-4 uppercase text-[10px] font-bold text-blue-600">{c.type}</td>
                      <td className="p-4 text-slate-500">{c.phone}</td>
                      <td className="p-4 font-mono font-semibold">₹{c.creditLimit?.toLocaleString()}</td>
                      <td className="p-4 font-mono font-bold text-emerald-600">₹{c.outstandingBalance?.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingCustomer(c)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Customer"
                          >
                            <Icon icon="mdi:pencil-outline" className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Customer"
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
        )
      )}
    </div>
  );
}
