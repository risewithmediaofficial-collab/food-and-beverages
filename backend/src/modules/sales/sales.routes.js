import express from 'express';
import { SalesOrder, Quotation, SalesInvoice, Payment } from './sales.model.js';

const router = express.Router();

router.get('/orders', async (req, res) => {
  try {
    const orders = await SalesOrder.find({ isActive: true }).populate('customerId').sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const orderNo = `SO-${Date.now().toString().slice(-6)}`;
    const order = new SalesOrder({ ...req.body, orderNo });
    await order.save();
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/orders/:id/invoice', async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Sales Order not found' });

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const subtotal = order.totalAmount;
    const gstAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + gstAmount;

    const invoice = new SalesInvoice({
      factoryId: order.factoryId,
      invoiceNo,
      salesOrderId: order._id,
      customerId: order.customerId,
      items: order.items,
      subtotal,
      gstAmount,
      totalAmount,
      dueAmount: totalAmount,
    });

    await invoice.save();
    order.status = 'invoiced';
    await order.save();

    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/orders/:id', async (req, res) => {
  try {
    const order = await SalesOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Sales order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await SalesOrder.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Sales order not found' });
    res.json({ success: true, message: 'Sales order deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await SalesInvoice.find({ isActive: true }).populate('customerId').sort({ createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/invoices/:id', async (req, res) => {
  try {
    const invoice = await SalesInvoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/invoices/:id', async (req, res) => {
  try {
    const invoice = await SalesInvoice.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
