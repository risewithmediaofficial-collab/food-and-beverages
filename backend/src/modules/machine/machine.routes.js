import express from 'express';
import { Machine, MachineLog, MaintenanceTicket } from './machine.model.js';
import { machineService } from './machine.service.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const machines = await Machine.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: machines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const machine = new Machine(req.body);
    await machine.save();
    res.status(201).json({ success: true, data: machine });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:id/event', async (req, res) => {
  try {
    const result = await machineService.logEvent({
      machineId: req.params.id,
      ...req.body,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const logs = await MachineLog.find({ isActive: true }).populate('machineId').sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });
    res.json({ success: true, data: machine });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });
    res.json({ success: true, message: 'Machine deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Maintenance Logs APIs
router.get('/maintenance', async (req, res) => {
  try {
    const tickets = await MaintenanceTicket.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/maintenance', async (req, res) => {
  try {
    const ticket = new MaintenanceTicket(req.body);
    await ticket.save();
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/maintenance/:id', async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/maintenance/:id', async (req, res) => {
  try {
    await MaintenanceTicket.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

