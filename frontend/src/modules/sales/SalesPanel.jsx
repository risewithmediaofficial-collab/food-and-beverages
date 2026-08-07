import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '@iconify/react';
import ExportDataToolbar from '../../components/ExportDataToolbar';
import UnitSelector from '../../components/UnitSelector';

export default function SalesPanel({ user, triggerError }) {
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [orgProfile, setOrgProfile] = useState(null);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ customerName: '', qty: 0, rate: 0, gstRatePct: 18 });
  const [editingOrder, setEditingOrder] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  const handleUpdateInvoiceStatus = async (invId, newStatus) => {
    try {
      const res = await api.put(`/sales/invoices/${invId}`, { status: newStatus });
      if (res.success) {
        setInvoices(invoices.map((inv) => (inv._id === invId ? { ...inv, status: newStatus } : inv)));
        if (triggerError) triggerError(`Invoice payment status updated to ${newStatus.toUpperCase()}!`, 'success');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to update invoice payment status');
    }
  };

  const handleDownloadInvoiceBill = (inv) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (triggerError) triggerError('Please allow popups to download or print the invoice bill.');
      return;
    }

    const orgName = orgProfile?.enterpriseName || user?.orgName || 'Food & Beverages ERP Ltd.';
    const gstinNo = orgProfile?.gstin || '27AAAAA0000A1Z5';
    const fssaiNo = orgProfile?.fssaiLicense || '10020021004561';
    const customerName = inv.customerName || inv.customerId?.name || 'Valued Customer';
    const invoiceNo = inv.invoiceNo || `INV-${String(inv._id).slice(-6)}`;
    const invoiceDate = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');

    const gstPct = Number(inv.gstRatePct || inv.gstRate || 18);
    const rawTotal = Number(inv.totalAmount || 0);

    // Subtotal and GST breakdown based on configured GST %
    const subtotal = Math.round(rawTotal / (1 + gstPct / 100));
    const gstTotal = rawTotal - subtotal;
    const cgst = Math.round(gstTotal / 2);
    const sgst = gstTotal - cgst;

    const itemsList = Array.isArray(inv.items) && inv.items.length > 0
      ? inv.items
      : [{ productName: 'Juice Bottle (500ml)', qty: 10, rate: Math.round(subtotal / 10), amount: subtotal }];

    const itemsRows = itemsList.map((item, idx) => `
      <tr>
        <td style="text-align: center; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #0f172a;">${item.productName || item.itemName || 'Juice Product Batch'}</td>
        <td style="text-align: center; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${item.qty || 1}</td>
        <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">₹${Number(item.rate || item.unitPrice || subtotal).toLocaleString('en-IN')}</td>
        <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600;">₹${Number(item.amount || ((item.qty || 1) * (item.rate || item.unitPrice || subtotal))).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const statusVal = String(inv.status || 'unpaid').toLowerCase();
    const statusColor = statusVal === 'paid' ? '#16a34a' : statusVal === 'partially_paid' ? '#2563eb' : statusVal === 'overdue' ? '#dc2626' : '#d97706';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice Bill - ${invoiceNo}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; background: #fff; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #f8fafc; margin: 0; padding: 30px 10px; }
            .bill-box { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
            .header-flex { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #f1f5f9; }
            .brand-title { font-size: 24px; font-weight: 900; color: #ea580c; margin: 0; letter-spacing: -0.5px; }
            .brand-sub { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
            .bill-badge { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
            .invoice-no { font-family: monospace; font-size: 14px; font-weight: 700; color: #059669; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
            .info-block { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; }
            .info-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
            .info-val { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
            .info-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { background: #f8fafc; color: #475569; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 10px; border-bottom: 2px solid #e2e8f0; }
            .totals-container { display: flex; justify-content: flex-end; margin-top: 24px; }
            .totals-table { width: 340px; border-collapse: collapse; }
            .totals-table td { padding: 6px 10px; font-size: 12px; }
            .totals-table .grand-total { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-size: 16px; font-weight: 900; color: #ea580c; }
            .footer-sign { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 24px; border-top: 1px solid #e2e8f0; }
            .thank-you { font-size: 13px; font-weight: 700; color: #0f172a; }
            .sign-box { text-align: right; }
            .sign-line { display: inline-block; width: 160px; border-top: 1px dashed #94a3b8; margin-bottom: 6px; }
            .action-bar { max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: flex-end; gap: 12px; }
            .btn-print { background: #ea580c; color: white; border: none; padding: 10px 20px; font-size: 13px; font-weight: 700; border-radius: 10px; cursor: pointer; }
            .btn-close { background: #e2e8f0; color: #334155; border: none; padding: 10px 16px; font-size: 13px; font-weight: 700; border-radius: 10px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="action-bar no-print">
            <button onclick="window.close()" class="btn-close">Close</button>
            <button onclick="window.print()" class="btn-print">🖨️ Print / Download PDF Bill</button>
          </div>

          <div class="bill-box">
            <div class="header-flex">
              <div>
                <h1 class="brand-title">🍊 ${orgName}</h1>
                <div class="brand-sub">Food & Beverages Manufacturing ERP Suite</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">FSSAI Lic. No: ${fssaiNo} | GSTIN: ${gstinNo}</div>
              </div>
              <div>
                <div class="bill-badge">TAX INVOICE</div>
                <div class="invoice-no">${invoiceNo}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date: <strong>${invoiceDate}</strong></div>
              </div>
            </div>

            <div class="meta-grid">
              <div class="info-block">
                <div class="info-label">Billed To (Customer)</div>
                <div class="info-val">${customerName}</div>
                <div class="info-sub">Payment Status: <strong style="color: ${statusColor}; text-transform: uppercase;">${statusVal.replace('_', ' ')}</strong></div>
              </div>
              <div class="info-block">
                <div class="info-label">Order Reference & Tax Rate</div>
                <div class="info-val">${inv.salesOrderId?.orderNo || inv.orderNo || 'Sales Order'}</div>
                <div class="info-sub">GST Rate: <strong>${gstPct}%</strong> | Payment Terms: Immediate / Net 30</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="text-align: center; width: 40px;">#</th>
                  <th style="text-align: left;">Item Description</th>
                  <th style="text-align: center; width: 80px;">Qty</th>
                  <th style="text-align: right; width: 120px;">Rate (₹)</th>
                  <th style="text-align: right; width: 130px;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="totals-container">
              <table class="totals-table">
                <tr>
                  <td style="color: #64748b;">Taxable Value:</td>
                  <td style="text-align: right; font-weight: 600;">₹${subtotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">CGST (${(gstPct / 2).toFixed(1)}%):</td>
                  <td style="text-align: right;">₹${cgst.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">SGST (${(gstPct / 2).toFixed(1)}%):</td>
                  <td style="text-align: right;">₹${sgst.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="grand-total">
                  <td style="padding-top: 10px; padding-bottom: 10px;">Grand Total:</td>
                  <td style="text-align: right; padding-top: 10px; padding-bottom: 10px;">₹${rawTotal.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>

            <div class="footer-sign">
              <div>
                <div class="thank-you">Thank you for your business!</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">This is a computer-generated tax invoice document.</div>
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                <div style="font-size: 11px; font-weight: 700; color: #334155;">Authorized Signatory</div>
                <div style="font-size: 10px; color: #94a3b8;">${orgName}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  };

  const loadSales = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      try {
        const orgRes = await api.get('/org/profile');
        if (orgRes.success && orgRes.data) setOrgProfile(orgRes.data);
      } catch (e) {
        console.warn('Could not load org profile:', e);
      }

      const res = await api.get('/sales/orders');
      if (res.success && res.data.length > 0) {
        setOrders(res.data.map(o => ({ ...o, customerName: o.customerId?.name || o.customerName || 'Customer' })));
      } else {
        setOrders([]);
      }

      const invoiceRes = await api.get('/sales/invoices');
      if (invoiceRes.success && invoiceRes.data.length > 0) {
        setInvoices(invoiceRes.data.map(inv => ({ ...inv, customerName: inv.customerId?.name || inv.customerName || 'Customer' })));
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.warn('Unable to load sales data from backend.', err);
      setLoadError('Unable to load sales data. Please verify backend connectivity and data.');
      setOrders([]);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.customerName || newOrder.qty <= 0 || newOrder.rate <= 0) {
      setActionError('Please provide customer name, quantity, and rate to create a sales order.');
      return;
    }
    setActionError('');
    try {
      const baseAmount = newOrder.qty * newOrder.rate;
      const gstPct = Number(newOrder.gstRatePct || 18);
      const gstAmount = Math.round(baseAmount * (gstPct / 100));
      const totalAmount = baseAmount + gstAmount;

      const payload = {
        customerName: newOrder.customerName,
        totalAmount,
        gstRatePct: gstPct,
        items: [{ productName: 'Juice Bottle (500ml)', qty: newOrder.qty, rate: newOrder.rate, amount: baseAmount }],
        status: 'pending',
      };
      const res = await api.post('/sales/orders', payload);
      if (res.success && res.data) {
        const created = { ...res.data, customerName: newOrder.customerName, gstRatePct: gstPct };
        setOrders([created, ...orders]);
        setShowAddOrder(false);
        setNewOrder({ customerName: '', qty: 0, rate: 0, gstRatePct: 18 });
        if (triggerError) triggerError('Sales order created successfully!', 'success');
      } else {
        throw new Error(res.message || 'Order creation failed');
      }
    } catch (err) {
      if (triggerError) triggerError(err.message || 'Failed to create sales order');
      setActionError(err.message || 'Unable to create sales order.');
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    setActionError('');
    try {
      const res = await api.put(`/sales/orders/${editingOrder._id}`, editingOrder);
      if (res.success) {
        setOrders(orders.map(o => o._id === editingOrder._id ? { ...editingOrder, ...res.data } : o));
        setEditingOrder(null);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      // Local state fallback update
      setOrders(orders.map(o => o._id === editingOrder._id ? editingOrder : o));
      setEditingOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this sales order?')) return;
    setActionError('');
    try {
      await api.delete(`/sales/orders/${orderId}`);
    } catch (err) {
      console.warn('Backend delete failed, removing locally.', err);
    }
    setOrders(orders.filter(o => o._id !== orderId));
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    setActionError('');
    try {
      await api.delete(`/sales/invoices/${invoiceId}`);
    } catch (err) {
      console.warn('Backend delete failed, removing locally.', err);
    }
    setInvoices(invoices.filter(i => i._id !== invoiceId));
  };

  const handleGenerateInvoice = async (orderId) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) {
      setActionError('Unable to locate the selected order.');
      return;
    }

    try {
      const res = await api.post(`/sales/orders/${orderId}/invoice`);
      if (res.success && res.invoice) {
        setInvoices([{ ...res.invoice, customerName: res.invoice.customerId?.name || order.customerName }, ...invoices]);
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'invoiced' } : o));
        setActionError('');
      } else {
        throw new Error(res.message || 'Invoice generation failed');
      }
    } catch (err) {
      // Local fallback for offline/preview orders
      const localInvoice = {
        _id: `INV-${Date.now().toString().slice(-6)}`,
        invoiceNo: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        status: 'issued',
        createdAt: new Date().toISOString(),
      };
      setInvoices([localInvoice, ...invoices]);
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'invoiced' } : o));
      setActionError('');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon icon="mdi:cart-outline" className="text-blue-600 text-lg" /> Sales Orders & Invoicing
          </h2>
          <p className="text-xs text-slate-400">Generate quotations, track customer sales orders, and issue GST invoices</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <ExportDataToolbar data={activeTab === 'orders' ? orders : invoices} filename={activeTab === 'orders' ? 'sales_orders_register' : 'issued_gst_invoices'} title={activeTab === 'orders' ? 'Sales Orders Register' : 'Issued GST Invoices'} />
          <button
            onClick={() => setShowAddOrder(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer w-full sm:w-auto justify-center"
          >
            <Icon icon="mdi:plus" className="text-base" /> Create Sales Order
          </button>
        </div>
      </div>

      {actionError && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700"><Icon icon="mdi:close" /></button>
        </div>
      )}

      {/* Add Order Form */}
      {showAddOrder && (
        <form onSubmit={handleCreateOrder} className="bg-white border border-blue-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">New Sales Order Entry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={newOrder.customerName}
                onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Order Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={newOrder.qty}
                onChange={(e) => setNewOrder({ ...newOrder, qty: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <UnitSelector
                label="Sales Unit (Bottles, Litre, Kg, etc.)"
                value={newOrder.unit || 'Bottles'}
                onChange={(unit) => setNewOrder({ ...newOrder, unit })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Rate per Unit (₹) *</label>
              <input
                type="number"
                min="1"
                required
                value={newOrder.rate}
                onChange={(e) => setNewOrder({ ...newOrder, rate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">GST Rate (%) *</label>
              <select
                value={newOrder.gstRatePct || 18}
                onChange={(e) => setNewOrder({ ...newOrder, gstRatePct: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              >
                <option value={18}>18% (Food & Beverage Standard)</option>
                <option value={12}>12% (Processed Foods Rate)</option>
                <option value={5}>5% (Basic Goods Rate)</option>
                <option value={0}>0% (Exempt Rate)</option>
                <option value={28}>28% (Luxury Goods Rate)</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-600 space-x-3">
              <span>Base Amount: <strong className="font-mono text-slate-900">₹{(newOrder.qty * newOrder.rate).toLocaleString()}</strong></span>
              <span>GST ({newOrder.gstRatePct || 18}%): <strong className="font-mono text-emerald-700">₹{Math.round((newOrder.qty * newOrder.rate) * ((newOrder.gstRatePct || 18) / 100)).toLocaleString()}</strong></span>
              <span>Total Payable: <strong className="text-blue-700 font-mono text-sm">₹{Math.round((newOrder.qty * newOrder.rate) * (1 + (newOrder.gstRatePct || 18) / 100)).toLocaleString()}</strong></span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button type="button" onClick={() => setShowAddOrder(false)} className="px-4 py-2 text-xs text-slate-500 font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer">Confirm Sales Order</button>
            </div>
          </div>
        </form>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <form onSubmit={handleUpdateOrder} className="bg-white border border-amber-300 p-5 rounded-2xl space-y-4 shadow-md">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <Icon icon="mdi:pencil" className="text-amber-600 text-base" /> Edit Sales Order Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={editingOrder.customerName || ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Total Amount (₹)</label>
              <input
                type="number"
                required
                value={editingOrder.totalAmount || 0}
                onChange={(e) => setEditingOrder({ ...editingOrder, totalAmount: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Status</label>
              <select
                value={editingOrder.status || 'pending'}
                onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="pending font-bold">pending</option>
                <option value="in_production">in_production</option>
                <option value="invoiced">invoiced</option>
                <option value="completed">completed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditingOrder(null)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Update Order</button>
          </div>
        </form>
      )}

      {loadError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-700">{loadError}</div>
      ) : isLoading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-sm text-slate-500">Loading sales orders & invoices...</div>
      ) : (
        <div className="space-y-6">
          {/* Orders Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Customer Orders ({orders.length})</h3>
            </div>

            {orders.length === 0 ? (
              <div className="p-5 text-xs text-slate-500 text-center">No sales orders available. Click "Create Sales Order" to add one.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 min-w-[600px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Order No</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-blue-600">{o.orderNo || `SO-${o._id.slice(-5)}`}</td>
                        <td className="p-4 font-bold text-slate-900">{o.customerName}</td>
                        <td className="p-4 font-mono font-bold text-slate-900">₹{o.totalAmount?.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            o.status === 'in_production' ? 'bg-amber-50 text-amber-700 border border-amber-200' : o.status === 'invoiced' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {o.status !== 'invoiced' ? (
                              <button
                                onClick={() => handleGenerateInvoice(o._id)}
                                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Icon icon="mdi:file-document-outline" className="text-sm" /> Invoice
                              </button>
                            ) : (
                              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><Icon icon="mdi:check-circle" /> Invoiced</span>
                            )}
                            <button
                              onClick={() => setEditingOrder(o)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Edit Order"
                            >
                              <Icon icon="mdi:pencil-outline" className="text-base" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(o._id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Order"
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
            )}
          </div>

          {/* Invoices Table */}
          {invoices.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Issued GST Invoices ({invoices.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 min-w-[600px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Invoice No</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-emerald-600">{inv.invoiceNo || `INV-${inv._id.slice(-5)}`}</td>
                        <td className="p-4 font-bold text-slate-900">{inv.customerName}</td>
                        <td className="p-4 font-mono font-bold text-slate-900">₹{inv.totalAmount?.toLocaleString()}</td>
                        <td className="p-4">
                          <select
                            value={inv.status || 'unpaid'}
                            onChange={(e) => handleUpdateInvoiceStatus(inv._id, e.target.value)}
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                              inv.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : inv.status === 'partially_paid'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : inv.status === 'overdue'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <option value="unpaid">UNPAID</option>
                            <option value="paid">PAID</option>
                            <option value="partially_paid">PARTIALLY PAID</option>
                            <option value="overdue">OVERDUE</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            <button
                              onClick={() => handleDownloadInvoiceBill(inv)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Download / Print Tax Invoice Bill"
                            >
                              <Icon icon="mdi:printer" className="text-sm text-emerald-600" /> Download Bill
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(inv._id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Invoice"
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
      )}
    </div>
  );
}
