import express from 'express';
import { Compliance } from './compliance.model.js';

const router = express.Router();

router.get('/records', async (req, res) => {
  try {
    const records = await Compliance.find({ isActive: true }).sort({ expiryDate: 1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/records', async (req, res) => {
  try {
    const record = new Compliance(req.body);
    await record.save();
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/records/:id', async (req, res) => {
  try {
    const record = await Compliance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ success: false, message: 'Compliance record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/records/:id', async (req, res) => {
  try {
    const record = await Compliance.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!record) return res.status(404).json({ success: false, message: 'Compliance record not found' });
    res.json({ success: true, message: 'Compliance record deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
