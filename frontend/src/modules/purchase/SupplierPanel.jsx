import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import { api } from '../../lib/api';

export default function SupplierPanel({ user, triggerError }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSup, setEditingSup] = useState(null);
  const [formData, setFormData] = useState({
    vendorCode: '',
    name: '',
    category: 'Fruit Pulp & Concentrate',
    rating: '5.0 ⭐',
    gstin: '',
    contactPerson: '',
    phone: '',
    email: '',
    paymentTerms: 'Net 30 Days',
    status: 'Approved',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase/suppliers');
      if (res.success && Array.isArray(res.data)) {
        setSuppliers(res.data);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      console.warn('Failed to load suppliers:', err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        vendorCode: formData.vendorCode || `VEN-50${suppliers.length + 1}`,
        name: formData.name,
        category: formData.category,
        rating: formData.rating,
        gstin: formData.gstin,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        paymentTerms: formData.paymentTerms,
        status: formData.status,
      };
      const res = await api.post('/purchase/suppliers', payload);
      if (res.success && res.data) {
        setSuppliers([res.data, ...suppliers]);
        setShowAddModal(false);
        setFormData({ vendorCode: '', name: '', category: 'Fruit Pulp & Concentrate', rating: '5.0 ⭐', gstin: '', contactPerson: '', phone: '', email: '', paymentTerms: 'Net 30 Days', status: 'Approved' });
        if (triggerError) triggerError('Supplier registered successfully!', 'success');
      } else {
        throw new Error(res.message || 'Failed to register supplier');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to register supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSup = async (e) => {
    e.preventDefault();
    if (!editingSup) return;
    try {
      setLoading(true);
      const res = await api.put(`/purchase/suppliers/${editingSup._id}`, formData);
      if (res.success && res.data) {
        setSuppliers(suppliers.map(s => (s._id === editingSup._id ? res.data : s)));
      } else {
        setSuppliers(suppliers.map(s => (s._id === editingSup._id ? { ...s, ...formData } : s)));
      }
      setEditingSup(null);
      if (triggerError) triggerError('Supplier details updated!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSup = async (id) => {
    if (!window.confirm('Delete this supplier record?')) return;
    try {
      setLoading(true);
      await api.delete(`/purchase/suppliers/${id}`);
      setSuppliers(suppliers.filter(s => s._id !== id));
      if (triggerError) triggerError('Supplier removed!', 'success');
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to delete supplier');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (s) => {
    setEditingSup(s);
    setFormData({
      vendorCode: s.vendorCode || '',
      name: s.name || '',
      category: s.category || 'Fruit Pulp & Concentrate',
      rating: s.rating || '5.0 ⭐',
      gstin: s.gstin || '',
      contactPerson: s.contactPerson || '',
      phone: s.phone || '',
      email: s.email || '',
      paymentTerms: s.paymentTerms || 'Net 30 Days',
      status: s.status || 'Approved',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:truck-outline" className="text-orange-500 text-lg" /> Approved Supplier & Vendor Master
          </h2>
          <p className="text-xs text-slate-400">Vendor directory, quality performance ratings, payment terms, and GSTIN registration master</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={suppliers} filename="suppliers_vendor_master" title="Vendor Master Directory" />
          <button
            onClick={() => {
              setFormData({ vendorCode: `VEN-50${suppliers.length + 1}`, name: '', category: 'Fruit Pulp & Concentrate', rating: '5.0 ⭐', gstin: '', contactPerson: '', phone: '', email: '', paymentTerms: 'Net 30 Days', status: 'Approved' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> Register Supplier
          </button>
        </div>
      </div>

      {(showAddModal || editingSup) && (
        <form onSubmit={editingSup ? handleUpdateSup : handleCreateSup} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Icon icon="mdi:truck-outline" className="text-orange-500 text-base" />
              {editingSup ? `Edit Supplier (${editingSup.name})` : 'Register Approved Vendor / Supplier'}
            </h3>
            <button type="button" onClick={() => { setShowAddModal(false); setEditingSup(null); }} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Vendor Code *</label>
              <input
                type="text"
                required
                value={formData.vendorCode}
                onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                placeholder="e.g. VEN-501"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-bold block mb-1">Supplier Company Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Agro Farms India"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Supplied Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="Fruit Pulp & Concentrate">Fruit Pulp & Concentrate</option>
                <option value="PET Bottles & Cartons">PET Bottles & Cartons</option>
                <option value="Food Grade Additives & Sugar">Food Grade Additives & Sugar</option>
                <option value="Machinery & Spare Parts">Machinery & Spare Parts</option>
              </select>
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
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="suresh@agrofarms.in"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">GSTIN Tax ID</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="27AGRO12345Z1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none uppercase"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold block mb-1">Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="Net 30 Days"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setShowAddModal(false); setEditingSup(null); }} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              {loading ? 'Saving...' : editingSup ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      )}

      {suppliers.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
            <Icon icon="mdi:truck-outline" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Approved Vendors Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no approved suppliers registered in the master directory. Click below to add a vendor.</p>
          <button
            onClick={() => {
              setFormData({ vendorCode: 'VEN-501', name: '', category: 'Fruit Pulp & Concentrate', rating: '5.0 ⭐', gstin: '', contactPerson: '', phone: '', email: '', paymentTerms: 'Net 30 Days', status: 'Approved' });
              setShowAddModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Icon icon="mdi:plus" className="text-base" /> Register First Supplier
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Vendor Code</th>
                  <th className="p-4">Supplier Name</th>
                  <th className="p-4">Supplied Category</th>
                  <th className="p-4">Vendor Rating</th>
                  <th className="p-4">Contact Person</th>
                  <th className="p-4">Payment Terms</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-orange-600">{s.vendorCode}</td>
                    <td className="p-4 font-bold text-slate-900">{s.name}</td>
                    <td className="p-4 text-slate-600 font-semibold">{s.category}</td>
                    <td className="p-4 font-bold text-amber-600">{s.rating || '5.0 ⭐'}</td>
                    <td className="p-4 font-mono text-slate-600">
                      <div>{s.contactPerson || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">📞 {s.phone || 'N/A'}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-700 font-bold">{s.paymentTerms || 'Net 30 Days'}</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                        {s.status || 'Approved'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(s)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded cursor-pointer">
                          <Icon icon="mdi:pencil-outline" className="text-base text-slate-600" />
                        </button>
                        <button onClick={() => handleDeleteSup(s._id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded cursor-pointer">
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
