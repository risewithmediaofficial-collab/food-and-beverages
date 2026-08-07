import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import UnitSelector from '../../components/UnitSelector';

export default function InventoryPanel() {
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [activeTab, setActiveTab] = useState('items');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);

  const [newItem, setNewItem] = useState({ name: '', code: '', type: 'raw_material', unit: 'Kg', reorderLevel: 100 });
  const [newStockIn, setNewStockIn] = useState({ itemId: '', batchNo: '', qty: 500 });
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await api.get('/inventory/summary');
      if (res.success) {
        setItems(res.data || []);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setNewStockIn((current) => ({ ...current, itemId: current.itemId || res.data[0]._id }));
        }
      }

      const batchRes = await api.get('/inventory/batches');
      if (batchRes.success) {
        setBatches(batchRes.data.map(b => ({ ...b, itemName: b.itemId?.name || 'Item' })));
      } else {
        setBatches([]);
      }
    } catch (err) {
      console.warn('Unable to load inventory data from backend.', err);
      setLoadError('Unable to load inventory data from backend. Check connection and data availability.');
      setItems([]);
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setActionError('');
    const payload = {
      name: newItem.name,
      code: newItem.code || `RM-${newItem.name.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      type: newItem.type,
      unit: newItem.unit,
      totalQty: 0,
      reorderLevel: Number(newItem.reorderLevel),
      isActive: true,
    };

    try {
      const res = await api.post('/inventory/items', payload);
      if (res.success && res.data) {
        setItems([res.data, ...items]);
        setShowAddItemModal(false);
        setNewItem({ name: '', code: '', type: 'raw_material', unit: 'Kg', reorderLevel: 100 });
        return;
      }
      throw new Error(res.message || 'Unable to save item');
    } catch (err) {
      console.warn('Unable to add inventory item.', err);
      setActionError('Unable to add inventory item. Please verify backend connection and item details.');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setActionError('');
    try {
      const res = await api.put(`/inventory/items/${editingItem._id}`, editingItem);
      if (res.success) {
        setItems(items.map(i => i._id === editingItem._id ? { ...editingItem, ...res.data } : i));
        setEditingItem(null);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setItems(items.map(i => i._id === editingItem._id ? editingItem : i));
      setEditingItem(null);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setActionError('');
    try {
      await api.delete(`/inventory/items/${itemId}`);
    } catch (err) {
      console.warn('Backend delete failed, removing locally.', err);
    }
    setItems(items.filter(i => i._id !== itemId));
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    setActionError('');
    try {
      await api.delete(`/inventory/batches/${batchId}`);
    } catch (err) {
      console.warn('Backend delete failed, removing locally.', err);
    }
    setBatches(batches.filter(b => b._id !== batchId));
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    setActionError('');
    const selectedItem = items.find(i => i._id === newStockIn.itemId);
    if (!selectedItem) {
      setActionError('Select a valid inventory item before stock in.');
      return;
    }

    const payload = {
      itemId: selectedItem._id,
      batchNo: newStockIn.batchNo || `SUP-BAT-${Math.floor(100 + Math.random() * 900)}`,
      qty: Number(newStockIn.qty),
      refType: 'ManualIn',
    };

    try {
      const res = await api.post('/inventory/stock-in', payload);
      if (res.success && res.data?.batch) {
        const batch = { ...res.data.batch, itemName: selectedItem.name };
        setBatches([batch, ...batches]);
        setItems(items.map(i => i._id === selectedItem._id ? {
          ...i,
          totalQty: (i.totalQty || 0) + batch.qty,
          isLowStock: ((i.totalQty || 0) + batch.qty) <= i.reorderLevel,
        } : i));
        setShowStockInModal(false);
        return;
      }
      throw new Error(res.message || 'Unable to stock in');
    } catch (err) {
      // Local state fallback
      const localBatch = {
        _id: Date.now().toString(),
        batchNo: payload.batchNo,
        itemName: selectedItem.name,
        qty: payload.qty,
        mfgDate: new Date().toISOString().split('T')[0],
        status: 'available',
      };
      setBatches([localBatch, ...batches]);
      setItems(items.map(i => i._id === selectedItem._id ? { ...i, totalQty: (i.totalQty || 0) + payload.qty } : i));
      setShowStockInModal(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'items' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon icon="mdi:package-variant-closed" className="text-base" /> Stock Item Master ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'batches' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon icon="mdi:barcode-scan" className="text-base" /> FIFO Batches ({batches.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <ExportDataToolbar data={activeTab === 'catalog' ? items : batches} filename={activeTab === 'catalog' ? 'inventory_items_catalog' : 'inventory_fifo_batches'} title={activeTab === 'catalog' ? 'Inventory Items Catalog' : 'Inventory FIFO Batches'} />
          <button
            onClick={() => setShowAddItemModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer flex-1 sm:flex-initial"
          >
            <Icon icon="mdi:plus" className="text-base" /> Add Item
          </button>
          <button
            onClick={() => setShowStockInModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer flex-1 sm:flex-initial"
          >
            <Icon icon="mdi:package-down" className="text-base" /> Manual Stock In
          </button>
        </div>
      </div>

      {actionError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700"><Icon icon="mdi:close" /></button>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <form onSubmit={handleAddItem} className="bg-white border border-blue-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Add Item to Master Catalog</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Item Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mango Concentrate"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">SKU / Item Code</label>
              <input
                type="text"
                placeholder="e.g. RM-MGO-01"
                value={newItem.code}
                onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Type</label>
              <select
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="raw_material">Raw Material</option>
                <option value="packaging">Packaging Material</option>
                <option value="finished_good">Finished Good</option>
              </select>
            </div>
            <div>
              <UnitSelector
                label="Measurement Unit (Kg, Litre, Pcs, etc.) *"
                value={newItem.unit}
                onChange={(unit) => setNewItem({ ...newItem, unit })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Reorder Alert Level</label>
              <input
                type="number"
                value={newItem.reorderLevel}
                onChange={(e) => setNewItem({ ...newItem, reorderLevel: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddItemModal(false)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Save Item Details</button>
          </div>
        </form>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <form onSubmit={handleUpdateItem} className="bg-white border border-amber-300 p-5 rounded-2xl space-y-4 shadow-md">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:pencil" className="text-amber-600 text-base" /> Edit Item Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Item Name</label>
              <input
                type="text"
                required
                value={editingItem.name || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Item Code</label>
              <input
                type="text"
                value={editingItem.code || ''}
                onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <UnitSelector
                label="Measurement Unit"
                value={editingItem.unit || 'Kg'}
                onChange={(unit) => setEditingItem({ ...editingItem, unit })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Reorder Level</label>
              <input
                type="number"
                value={editingItem.reorderLevel || 0}
                onChange={(e) => setEditingItem({ ...editingItem, reorderLevel: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Update Item</button>
          </div>
        </form>
      )}

      {/* Stock In Modal */}
      {showStockInModal && (
        <form onSubmit={handleStockIn} className="bg-white border border-emerald-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Manual Stock In Entry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Select Item</label>
              <select
                value={newStockIn.itemId}
                onChange={(e) => setNewStockIn({ ...newStockIn, itemId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="">Select item</option>
                {items.map(i => <option key={i._id} value={i._id}>{i.name} ({i.code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Batch Number</label>
              <input
                type="text"
                placeholder="e.g. SUP-MGO-101"
                value={newStockIn.batchNo}
                onChange={(e) => setNewStockIn({ ...newStockIn, batchNo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Quantity Received</label>
              <input
                type="number"
                value={newStockIn.qty}
                onChange={(e) => setNewStockIn({ ...newStockIn, qty: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowStockInModal(false)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Confirm Stock In</button>
          </div>
        </form>
      )}

      {/* Main Content */}
      {loadError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-700">{loadError}</div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-sm text-slate-500">Loading inventory data...</div>
      ) : activeTab === 'items' ? (
        items.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-700">No inventory items found. Click "Add Item" to add your first stock item.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item._id}
                className={`bg-white border rounded-2xl p-5 hover:shadow-md transition relative overflow-hidden flex flex-col justify-between ${
                  item.isLowStock ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200/80'
                }`}
              >
                <div>
                  {item.isLowStock && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">
                      Reorder Alert
                    </div>
                  )}
                  <div className="flex justify-between items-start pr-12">
                    <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">{item.code}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{(item.type || 'raw').replace('_', ' ')}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2">{item.name}</h3>

                  <div className="mt-4 flex items-baseline justify-between pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Available Stock</span>
                      <span className="text-xl font-extrabold font-mono text-slate-900">{(item.totalQty || 0).toLocaleString()} <small className="text-xs font-normal text-slate-500">{item.unit}</small></span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">Reorder</span>
                      <span className="text-xs font-mono font-bold text-slate-500">{item.reorderLevel} {item.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="Edit Item"
                  >
                    <Icon icon="mdi:pencil-outline" className="text-base" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Item"
                  >
                    <Icon icon="mdi:trash-can-outline" className="text-base" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        batches.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-700">No stock batches are available. Perform Manual Stock In after creating items.</div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[550px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Batch ID</th>
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Mfg Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-blue-600">{b.batchNo}</td>
                      <td className="p-4 font-bold text-slate-900">{b.itemName}</td>
                      <td className="p-4 font-mono font-bold text-slate-900">{(b.qty || 0).toLocaleString()}</td>
                      <td className="p-4 text-slate-500">{b.mfgDate || new Date().toISOString().split('T')[0]}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {b.status || 'available'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteBatch(b._id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Batch"
                        >
                          <Icon icon="mdi:trash-can-outline" className="text-base" />
                        </button>
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
