import express from 'express';
import { OrgProfile, Factory, Department, Warehouse, AuditLog } from './org.model.js';
import { getTenantQuery, attachTenantOrgId } from '../../common/utils/tenantScope.js';

const router = express.Router();

// Organization Legal Profile APIs
router.get('/profile', async (req, res) => {
  try {
    const profile = await OrgProfile.findOne(getTenantQuery(req, {}));
    res.json({ success: true, data: profile || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    let profile = await OrgProfile.findOne(getTenantQuery(req, {}));
    if (!profile) {
      profile = await OrgProfile.create(attachTenantOrgId(req, req.body));
    } else {
      profile = await OrgProfile.findByIdAndUpdate(profile._id, req.body, { new: true });
    }
    res.json({ success: true, data: profile, message: 'Organization profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Factory Management APIs
router.get('/factories', async (req, res) => {
  try {
    const factories = await Factory.find(getTenantQuery(req, {})).sort({ createdAt: -1 });
    res.json({ success: true, data: factories || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/factories', async (req, res) => {
  try {
    const { name, plantCode, location, linesCount, capacityPerDay, plantManager, status } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Factory name is required.' });
    const count = await Factory.countDocuments(getTenantQuery(req, {}));
    const newFactory = await Factory.create(attachTenantOrgId(req, {
      plantCode: plantCode || `PLANT-0${count + 1}`,
      name,
      code: plantCode || `PLANT-0${count + 1}`,
      location: location || 'Main Industrial Zone',
      linesCount: linesCount ? Number(linesCount) : 1,
      capacityPerDay: capacityPerDay || '25,000 Liters',
      plantManager: plantManager || 'General Manager',
      status: status || 'Operating',
    }));
    res.status(201).json({ success: true, data: newFactory, message: 'Factory added successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/factories/:id', async (req, res) => {
  try {
    const updated = await Factory.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Factory not found' });
    res.json({ success: true, data: updated, message: 'Factory updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/factories/:id', async (req, res) => {
  try {
    await Factory.findOneAndDelete(getTenantQuery(req, { _id: req.params.id }));
    res.json({ success: true, message: 'Factory deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Department Management APIs
router.get('/departments', async (req, res) => {
  try {
    const depts = await Department.find(getTenantQuery(req, {})).sort({ createdAt: -1 });
    res.json({ success: true, data: depts || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/departments', async (req, res) => {
  try {
    const { name, deptCode, costCenter, headName, staffCount, budget, status } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Department name is required.' });
    const count = await Department.countDocuments(getTenantQuery(req, {}));
    const newDept = await Department.create(attachTenantOrgId(req, {
      deptCode: deptCode || `DEP-0${count + 1}`,
      name,
      code: deptCode || `DEP-0${count + 1}`,
      costCenter: costCenter || `CC-${100 + count + 1}`,
      headName: headName || 'Department Head',
      staffCount: staffCount ? Number(staffCount) : 5,
      budget: budget ? Number(budget) : 1000000,
      status: status || 'Active',
    }));
    res.status(201).json({ success: true, data: newDept, message: 'Department created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/departments/:id', async (req, res) => {
  try {
    const updated = await Department.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: updated, message: 'Department updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await Department.findOneAndDelete(getTenantQuery(req, { _id: req.params.id }));
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Audit Logs API (read-only)
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find(getTenantQuery(req, {})).sort({ createdAt: -1 });
    res.json({ success: true, data: logs || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Audit Log — create entry (called internally by other modules)
router.post('/audit-logs', async (req, res) => {
  try {
    const log = new AuditLog(attachTenantOrgId(req, req.body));
    await log.save();
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
