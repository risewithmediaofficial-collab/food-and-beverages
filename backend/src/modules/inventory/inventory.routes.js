import express from 'express';
import { Item, StockBatch, Warehouse } from './inventory.model.js';
import { inventoryService } from './inventory.service.js';
import { getTenantQuery, attachTenantOrgId } from '../../common/utils/tenantScope.js';

const router = express.Router();

router.get('/items', async (req, res) => {
  try {
    const items = await Item.find(getTenantQuery(req, { isActive: true })).sort({ name: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const item = new Item(attachTenantOrgId(req, req.body));
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/batches', async (req, res) => {
  try {
    const batches = await StockBatch.find(getTenantQuery(req, { qty: { $gt: 0 } })).populate('itemId').sort({ createdAt: -1 });
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const summary = await inventoryService.getInventorySummary(req);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), { isActive: false }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/batches/:id', async (req, res) => {
  try {
    const batch = await StockBatch.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!batch) return res.status(404).json({ success: false, message: 'Stock batch not found' });
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/batches/:id', async (req, res) => {
  try {
    const batch = await StockBatch.findOneAndDelete(getTenantQuery(req, { _id: req.params.id }));
    if (!batch) return res.status(404).json({ success: false, message: 'Stock batch not found' });
    res.json({ success: true, message: 'Stock batch deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/stock-in', async (req, res) => {
  try {
    const payload = attachTenantOrgId(req, req.body);
    const result = await inventoryService.stockIn(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/stock-out', async (req, res) => {
  try {
    const payload = attachTenantOrgId(req, req.body);
    const result = await inventoryService.stockOut(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Warehouse CRUD
router.get('/warehouses', async (req, res) => {
  try {
    const warehouses = await Warehouse.find(getTenantQuery(req, { isActive: true })).sort({ createdAt: -1 });
    res.json({ success: true, data: warehouses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/warehouses', async (req, res) => {
  try {
    const wh = new Warehouse(attachTenantOrgId(req, req.body));
    await wh.save();
    res.status(201).json({ success: true, data: wh });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/warehouses/:id', async (req, res) => {
  try {
    const wh = await Warehouse.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!wh) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, data: wh });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/warehouses/:id', async (req, res) => {
  try {
    await Warehouse.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), { isActive: false });
    res.json({ success: true, message: 'Warehouse removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
