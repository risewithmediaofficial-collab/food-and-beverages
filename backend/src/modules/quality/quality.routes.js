import express from 'express';
import { QCCheck } from './quality.model.js';
import { qualityService } from './quality.service.js';

const router = express.Router();

router.get('/checks', async (req, res) => {
  try {
    const checks = await QCCheck.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: checks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/checks/:id/decision', async (req, res) => {
  try {
    const check = await qualityService.processQCDecision(req.params.id, {
      ...req.body,
      userId: req.user?.id,
    });
    res.json({ success: true, data: check });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/checks', async (req, res) => {
  try {
    const checkNo = `QC-${Date.now().toString().slice(-6)}`;
    const check = new QCCheck({ ...req.body, checkNo });
    await check.save();
    res.status(201).json({ success: true, data: check });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/checks/:id', async (req, res) => {
  try {
    const check = await QCCheck.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!check) return res.status(404).json({ success: false, message: 'QC check not found' });
    res.json({ success: true, data: check });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/checks/:id', async (req, res) => {
  try {
    const check = await QCCheck.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!check) return res.status(404).json({ success: false, message: 'QC check not found' });
    res.json({ success: true, message: 'QC check deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
