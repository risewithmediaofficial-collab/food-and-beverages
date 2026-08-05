import express from 'express';
import { DispatchOrder } from './dispatch.model.js';

const router = express.Router();

// GET all dispatch records
router.get('/records', async (req, res) => {
  try {
    const records = await DispatchOrder.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create dispatch record
router.post('/records', async (req, res) => {
  try {
    const record = new DispatchOrder(req.body);
    await record.save();
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update dispatch record
router.put('/records/:id', async (req, res) => {
  try {
    const record = await DispatchOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ success: false, message: 'Dispatch record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE dispatch record
router.delete('/records/:id', async (req, res) => {
  try {
    const record = await DispatchOrder.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!record) return res.status(404).json({ success: false, message: 'Dispatch record not found' });
    res.json({ success: true, message: 'Dispatch record deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
