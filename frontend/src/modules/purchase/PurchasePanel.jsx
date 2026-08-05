import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';

export default function PurchasePanel({ user, triggerError }) {
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contactPerson: '', email: '', phone: '', rating: '5.0' });

  const [showAddPoModal, setShowAddPoModal] = useState(false);
  const [newPo, setNewPo] = useState({ supplierName: '', itemName: 'Fresh Mango Pulp', qty: 1000, unit: 'Kg', totalAmount: 120000 });

  useEffect(() => {
    loadPurchaseData();
  }, []);

  const loadPurchaseData = async () => {
    setIsLoading(true);
    try {
      const supRes = await api.get('/purchase/suppliers');
      if (supRes.success && Array.isArray(supRes.data)) {
        setSuppliers(supRes.data);
      } else {
        setSuppliers([]);
      }

      const poRes = await api.get('/purchase/orders');
      if (poRes.success && Array.isArray(poRes.data)) {
        setOrders(poRes.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('Failed to load purchase data:', err);
      setSuppliers([]);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    const payload = { ...newSupplier, _id: Date.now().toString() };
    try {
      const res = await api.post('/purchase/suppliers', payload);
      if (res.success && res.data) {
        setSuppliers([res.data, ...suppliers]);
      } else {
        setSuppliers([payload, ...suppliers]);
      }
      if (triggerError) triggerError('Supplier vendor registered!', 'success');
    } catch (err) {
      setSuppliers([payload, ...suppliers]);
    }
    setShowAddSupplierModal(false);
    setNewSupplier({ name: '', contactPerson: '', email: '', phone: '', rating: '5.0' });
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    const payload = {
      _id: Date.now().toString(),
      poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      ...newPo,
      status: 'approved',
    };
    try {
      const res = await api.post('/purchase/orders', payload);
      if (res.success && res.data) {
        setOrders([res.data, ...orders]);
      } else {
        setOrders([payload, ...orders]);
      }
      if (triggerError) triggerError('Purchase Order issued!', 'success');
    } catch (err) {
      setOrders([payload, ...orders]);
    }
    setShowAddPoModal(false);
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      await api.delete(`/purchase/orders/${id}`);
      setOrders(orders.filter(o => o._id !== id));
      if (triggerError) triggerError('Purchase Order deleted!', 'success');
    } catch (err) {
      setOrders(orders.filter(o => o._id !== id));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'orders' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon icon="mdi:file-document-outline" className="text-base" /> Purchase Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'suppliers' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon icon="mdi:account-badge-outline" className="text-base" /> Vendor Master ({suppliers.length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <ExportDataToolbar data={activeTab === 'orders' ? orders : suppliers} filename={activeTab === 'orders' ? 'purchase_orders' : 'vendor_suppliers'} title={activeTab === 'orders' ? 'Purchase Orders' : 'Vendor Suppliers'} />
          <button
            onClick={() => activeTab === 'orders' ? setShowAddPoModal(true) : setShowAddSupplierModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Icon icon="mdi:plus" className="text-base" /> {activeTab === 'orders' ? 'Create Purchase Order' : 'Add Supplier Vendor'}
          </button>
        </div>
      </div>

      {/* Add PO Modal */}
      {showAddPoModal && (
        <form onSubmit={handleCreatePo} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wider">New Purchase Order</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Supplier Vendor *</label>
              <input
                type="text"
                required
                placeholder="e.g. Agro Farms India"
                value={newPo.supplierName}
                onChange={(e) => setNewPo({ ...newPo, supplierName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Material / Item *</label>
              <input
                type="text"
                required
                placeholder="e.g. Fresh Mango Pulp"
                value={newPo.itemName}
                onChange={(e) => setNewPo({ ...newPo, itemName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Order Quantity & Unit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={newPo.qty}
                  onChange={(e) => setNewPo({ ...newPo, qty: Number(e.target.value) })}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
                />
                <input
                  type="text"
                  required
                  value={newPo.unit}
                  onChange={(e) => setNewPo({ ...newPo, unit: e.target.value })}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Total Estimated Cost (₹)</label>
              <input
                type="number"
                required
                value={newPo.totalAmount}
                onChange={(e) => setNewPo({ ...newPo, totalAmount: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddPoModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Issue PO</button>
          </div>
        </form>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <form onSubmit={handleCreateSupplier} className="bg-white border border-orange-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wider">Register Supplier Vendor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Vendor Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Agro Farms India"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Suresh Patel"
                value={newSupplier.contactPerson}
                onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Email</label>
              <input
                type="email"
                placeholder="suresh@agrofarms.in"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Phone</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddSupplierModal(false)} className="px-4 py-2 text-xs text-slate-500 font-semibold cursor-pointer">Cancel</button>
            <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Save Vendor</button>
          </div>
        </form>
      )}

      {/* Main List */}
      {activeTab === 'orders' ? (
        orders.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
              <Icon icon="mdi:file-document-outline" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Purchase Orders Issued</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no purchase orders logged in the system. Click below to issue a purchase order.</p>
            <button
              onClick={() => setShowAddPoModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Icon icon="mdi:plus" className="text-base" /> Create First Purchase Order
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">PO Number</th>
                    <th className="p-4">Supplier Vendor</th>
                    <th className="p-4">Material Item</th>
                    <th className="p-4">Order Qty</th>
                    <th className="p-4">Total Value</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-orange-600">{o.poNumber}</td>
                      <td className="p-4 font-bold text-slate-900">{o.supplierName}</td>
                      <td className="p-4 text-slate-700">{o.itemName}</td>
                      <td className="p-4 font-mono text-slate-800 font-bold">{o.qty} {o.unit}</td>
                      <td className="p-4 font-mono font-bold text-emerald-600">₹{(o.totalAmount || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                          {o.status || 'approved'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDeleteOrder(o._id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer">
                          <Icon icon="mdi:trash-can-outline" className="text-base text-rose-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        suppliers.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto text-2xl">
              <Icon icon="mdi:account-badge-outline" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Supplier Vendors Registered</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">No vendor directory entries exist. Click below to add a supplier vendor.</p>
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Icon icon="mdi:plus" className="text-base" /> Add First Supplier Vendor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div key={s._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                    <span className="text-xs text-slate-400 font-medium">Contact: {s.contactPerson}</span>
                  </div>
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Icon icon="mdi:star" className="text-amber-500" /> {s.rating || '5.0'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1 font-mono pt-2 border-t border-slate-100">
                  <div>📧 {s.email || 'N/A'}</div>
                  <div>📞 {s.phone || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
