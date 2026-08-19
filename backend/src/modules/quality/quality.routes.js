import express from 'express';
import { QCCheck } from './quality.model.js';
import { ProductionOrder } from '../production/production.model.js';
import { qualityService } from './quality.service.js';

const router = express.Router();

router.get('/checks', async (req, res) => {
  try {
    // Auto-reconcile any production orders in quality_testing status
    const pendingOrders = await ProductionOrder.find({ status: 'quality_testing', isActive: true });
    for (const order of pendingOrders) {
      let check = await QCCheck.findOne({ refType: 'finished_goods', refId: order._id, isActive: true });
      if (!check) {
        // Also check by batchId
        check = await QCCheck.findOne({ batchId: order.batchId, isActive: true });
      }

      if (!check) {
        check = new QCCheck({
          factoryId: order.factoryId,
          checkNo: `QC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
          refType: 'finished_goods',
          refId: order._id,
          batchId: order.batchId,
          productName: order.productName,
          orderNo: order.orderNo,
          qtyTested: order.qtyProduced || order.qtyPlanned,
          unit: order.unit || 'Bottles',
          overallResult: 'pending',
          parameters: [
            { name: 'Brix Sugar Content', value: '12.5 °Brix', passRange: '11.5 - 13.5 °Brix', result: 'pass' },
            { name: 'pH Titration Level', value: '3.8 pH', passRange: '3.5 - 4.2 pH', result: 'pass' },
            { name: 'Turbidity & Clarity', value: '1.2 NTU', passRange: '< 2.0 NTU', result: 'pass' },
            { name: 'Organoleptic Taste Check', value: 'Standard Sweetness', passRange: 'Standard Sweetness', result: 'pass' },
            { name: 'Microbiology (CFU/ml)', value: '< 1 CFU/ml', passRange: '< 10 CFU/ml', result: 'pass' },
            { name: 'Fill Volume Spec', value: `${order.productName?.includes('250') ? '250' : '500'} ml`, passRange: `${order.productName?.includes('250') ? '245 - 255' : '495 - 505'} ml`, result: 'pass' },
          ],
        });
        await check.save();
      } else {
        let needsUpdate = false;
        if (!check.productName && order.productName) {
          check.productName = order.productName;
          needsUpdate = true;
        }
        if (!check.orderNo && order.orderNo) {
          check.orderNo = order.orderNo;
          needsUpdate = true;
        }
        if (!check.qtyTested && (order.qtyProduced || order.qtyPlanned)) {
          check.qtyTested = order.qtyProduced || order.qtyPlanned;
          needsUpdate = true;
        }
        if (!check.refId) {
          check.refId = order._id;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await check.save();
        }
      }
    }

    const checks = await QCCheck.find({ isActive: true })
      .populate('refId')
      .sort({ createdAt: -1 });
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

router.put('/checks/:id/parameters', async (req, res) => {
  try {
    const check = await QCCheck.findById(req.params.id);
    if (!check) return res.status(404).json({ success: false, message: 'QC check not found' });
    if (req.body.parameters) check.parameters = req.body.parameters;
    if (req.body.notes) check.notes = req.body.notes;
    await check.save();
    res.json({ success: true, data: check });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/checks', async (req, res) => {
  try {
    const checkNo = `QC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const check = new QCCheck({
      refType: 'finished_goods',
      overallResult: 'pending',
      ...req.body,
      checkNo,
    });
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
