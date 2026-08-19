import express from 'express';
import { DispatchOrder } from './dispatch.model.js';
import { getTenantQuery, attachTenantOrgId } from '../../common/utils/tenantScope.js';

const router = express.Router();

// GET all dispatch records
router.get('/records', async (req, res) => {
  try {
    const records = await DispatchOrder.find(getTenantQuery(req, { isActive: true })).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create dispatch record
router.post('/records', async (req, res) => {
  try {
    const payload = attachTenantOrgId(req, {
      ...req.body,
      batchId: req.body.batchId || req.body.orderNo || req.body.dispatchNo,
      dispatchNo: req.body.dispatchNo || req.body.id || `DSP-${Date.now().toString().slice(-6)}`,
    });
    const record = new DispatchOrder(payload);
    await record.save();
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update dispatch record
router.put('/records/:id', async (req, res) => {
  try {
    const record = await DispatchOrder.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!record) return res.status(404).json({ success: false, message: 'Dispatch record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE dispatch record
router.delete('/records/:id', async (req, res) => {
  try {
    const record = await DispatchOrder.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), { isActive: false }, { new: true });
    if (!record) return res.status(404).json({ success: false, message: 'Dispatch record not found' });
    res.json({ success: true, message: 'Dispatch record deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
