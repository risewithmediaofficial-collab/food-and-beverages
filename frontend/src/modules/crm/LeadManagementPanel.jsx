import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function LeadManagementPanel({ user, triggerError }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    leadCode: '',
    name: '',
    company: '',
    email: '',
    phone: '',
    dealValue: 150000,
    stage: 'New',
    source: 'Website Inquiry',
    assignee: 'Rohan Gupta',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/crm/leads');
      if (res.success && Array.isArray(res.data)) {
        setLeads(res.data);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.warn('Failed to load leads:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        leadCode: formData.leadCode || `LD-2026-0${leads.length + 1}`,
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        dealValue: formData.dealValue,
        stage: formData.stage,
        source: formData.source,
        assignee: formData.assignee,
      };
      const res = await api.post('/crm/leads', payload);
      if (res.success && res.data) {
        setLeads([res.data, ...leads]);
      } else {
        setLeads([{ _id: Date.now().toString(), ...payload }, ...leads]);
      }
      setShowAddModal(false);
      setFormData({ leadCode: '', name: '', company: '', email: '', phone: '', dealValue: 150000, stage: 'New', source: 'Website Inquiry', assignee: 'Rohan Gupta' });
      if (triggerError) triggerError('Sales lead opportunity created!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      setLoading(true);
      const res = await api.put(`/crm/leads/${editingLead._id}`, formData);
      if (res.success && res.data) {
        setLeads(leads.map(l => (l._id === editingLead._id ? res.data : l)));
      } else {
        setLeads(leads.map(l => (l._id === editingLead._id ? { ...l, ...formData } : l)));
      }
      setEditingLead(null);
      if (triggerError) triggerError('Lead details updated!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Delete this sales lead?')) return;
    try {
      setLoading(true);
      await api.delete(`/crm/leads/${id}`);
      setLeads(leads.filter(l => l._id !== id));
      if (triggerError) triggerError('Lead record deleted!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete lead');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (l) => {
    setEditingLead(l);
    setFormData({
      leadCode: l.leadCode || '',
      name: l.name || '',
      company: l.company || '',
      email: l.email || '',
      phone: l.phone || '',
      dealValue: l.dealValue || 150000,
      stage: l.stage || 'New',
      source: l.source || 'Website Inquiry',
      assignee: l.assignee || 'Rohan Gupta',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:phone-outgoing-outline" className="text-orange-500 text-lg" /> Lead Management & Sales Opportunity Pipeline
          </h2>
          <p className="text-xs text-slate-400">Track client inquiries, estimated deal values, sales funnel stages, and follow-up schedules</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={leads} filename="leads_opportunity_pipeline" title="Lead Management Pipeline" />
          <button
            onClick={() => {
              setFormData({ leadCode: `LD-2026-0${leads.length + 1}`, name: '', company: '', email: '', phone: '', dealValue: 150000, stage: 'New', source: 'Website Inquiry', assignee: 'Rohan Gupta' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add New Lead
          </button>
        </div>
      </div>

      {(showAddModal || editingLead) && (
        <form onSubmit={editingLead ? handleUpdateLead : handleCreateLead} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:phone-outgoing-outline" className="text-orange-500 text-base" />
              {editingLead ? `Edit Lead (${editingLead.leadCode})` : 'Create Sales Opportunity Lead'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingLead(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Lead Ref Code *</label>
              <input
                type="text"
                required
                value={formData.leadCode}
                onChange={(e) => setFormData({ ...formData, leadCode: e.target.value })}
                placeholder="e.g. LD-2026-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rajesh Verma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Company / Organization *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Taj Hotels & Resorts"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Phone Number *</label>
              <input
                type="text"
                required
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
              <label className="text-xs text-slate-600 font-bold block mb-1">Estimated Deal Value (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={formData.dealValue}
                onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Pipeline Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="New">New Inbound</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Deal Won</option>
                <option value="Lost">Deal Lost</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Lead Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Website Inquiry / Trade Fair"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Sales Rep Assignee</label>
              <input
                type="text"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                placeholder="e.g. Rohan Gupta"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingLead(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingLead ? 'Update Lead' : 'Save Lead'}
            </button>
          </div>
        </form>
      )}

      {leads.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:phone-outgoing-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Sales Leads Active</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no sales leads or opportunities logged in the pipeline. Click below to add a lead.</p>
          <button
            onClick={() => {
              setFormData({ leadCode: 'LD-2026-01', name: '', company: '', email: '', phone: '', dealValue: 150000, stage: 'New', source: 'Website Inquiry', assignee: 'Rohan Gupta' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Create First Lead
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Lead Ref</th>
                  <th className="p-4">Client Name & Company</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Estimated Deal Value</th>
                  <th className="p-4">Pipeline Stage</th>
                  <th className="p-4">Assignee</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{l.leadCode || l._id?.slice(-6)}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{l.name}</span>
                      <span className="text-xs text-slate-500 font-semibold block">{l.company}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      <div>📞 {l.phone || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">📧 {l.email || 'N/A'}</div>
                    </td>
                    <td className="p-4 font-mono font-extrabold text-emerald-600 text-sm">₹{(l.dealValue || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        l.stage === 'Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : l.stage === 'Negotiation' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {l.stage || 'New'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-semibold">{l.assignee || 'Rohan Gupta'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(l)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button onClick={() => handleDeleteLead(l._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
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
