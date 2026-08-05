import express from 'express';
import { Ledger, Expense } from './finance.model.js';

const router = express.Router();

// ─── Ledger CRUD ─────────────────────────────────────────────────────────────

router.get('/ledgers', async (req, res) => {
  try {
    const ledgers = await Ledger.find({ isActive: true }).sort({ date: -1 });
    res.json({ success: true, data: ledgers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ledgers', async (req, res) => {
  try {
    const entry = new Ledger(req.body);
    await entry.save();
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/ledgers/:id', async (req, res) => {
  try {
    const entry = await Ledger.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Ledger entry not found' });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/ledgers/:id', async (req, res) => {
  try {
    const entry = await Ledger.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Ledger entry not found' });
    res.json({ success: true, message: 'Ledger entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Expense Tracker CRUD ────────────────────────────────────────────────────

router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
