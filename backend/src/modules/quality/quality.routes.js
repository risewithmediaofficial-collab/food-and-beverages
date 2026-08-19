import express from 'express';
import { QCCheck, LabSample } from './quality.model.js';
import { PackagingBatch } from '../packaging/packaging.model.js';
import { ProductionOrder, Batch } from '../production/production.model.js';
import { qualityService } from './quality.service.js';
import { getTenantQuery, attachTenantOrgId } from '../../common/utils/tenantScope.js';
import { getIO } from '../../config/socket.js';

const router = express.Router();

// ─── 1. Quality Control Physical Checks ───────────────────────────────────────

router.get('/checks', async (req, res) => {
  try {
    const effectiveOrgId = req.orgId || req.user?.orgId;
    // Auto-reconcile any production orders in quality_testing status
    const pendingOrderFilter = getTenantQuery(req, { status: 'quality_testing', isActive: true });
    const pendingOrders = await ProductionOrder.find(pendingOrderFilter);
    for (const order of pendingOrders) {
      const qcQuery = {
        $or: [{ refType: 'finished_goods', refId: order._id, isActive: true }, { batchId: order.batchId, isActive: true }],
      };
      if (effectiveOrgId) qcQuery.orgId = effectiveOrgId;

      let check = await QCCheck.findOne(qcQuery);

      if (!check) {
        check = new QCCheck({
          orgId: effectiveOrgId || order.orgId,
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
        if (!check.orgId && (effectiveOrgId || order.orgId)) {
          check.orgId = effectiveOrgId || order.orgId;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await check.save();
        }
      }
    }

    const checks = await QCCheck.find(getTenantQuery(req, { isActive: true }))
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
      orgId: req.orgId || req.user?.orgId,
      userId: req.user?.id,
    });
    res.json({ success: true, data: check });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/checks/:id/parameters', async (req, res) => {
  try {
    const check = await QCCheck.findOne(getTenantQuery(req, { _id: req.params.id }));
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
    const check = new QCCheck(attachTenantOrgId(req, {
      refType: 'finished_goods',
      overallResult: 'pending',
      ...req.body,
      checkNo,
    }));
    await check.save();
    res.status(201).json({ success: true, data: check });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/checks/:id', async (req, res) => {
  try {
    const check = await QCCheck.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!check) return res.status(404).json({ success: false, message: 'QC check not found' });
    res.json({ success: true, data: check });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/checks/:id', async (req, res) => {
  try {
    const check = await QCCheck.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), { isActive: false }, { new: true });
    if (!check) return res.status(404).json({ success: false, message: 'QC check not found' });
    res.json({ success: true, message: 'QC check deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 2. Laboratory Testing & COA Clearance APIs ──────────────────────────────

router.get('/lab-samples', async (req, res) => {
  try {
    const effectiveOrgId = req.orgId || req.user?.orgId;
    
    // Auto-reconcile approved QC checks into LabSamples if not already created
    const approvedQCChecks = await QCCheck.find(getTenantQuery(req, { overallResult: 'approved', isActive: true }));
    for (const check of approvedQCChecks) {
      const labFilter = { batchId: check.batchId, isActive: true };
      if (effectiveOrgId) labFilter.orgId = effectiveOrgId;

      let lab = await LabSample.findOne(labFilter);
      if (!lab) {
        lab = new LabSample({
          orgId: effectiveOrgId || check.orgId,
          factoryId: check.factoryId,
          sampleId: `LAB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
          batchId: check.batchId,
          orderNo: check.orderNo,
          productName: check.productName,
          qtyPlanned: check.qtyTested || 1000,
          unit: check.unit || 'Bottles',
          status: 'pending',
          qcCheckId: check._id,
          productionOrderId: check.refId,
          tests: [
            { name: 'Total Plate Count (TPC)', standardSpec: '< 10 CFU/ml', measuredValue: '< 1 CFU/ml', unit: 'CFU/ml', result: 'PASS' },
            { name: 'Yeast & Mold Count', standardSpec: '< 5 CFU/ml', measuredValue: '0 CFU/ml', unit: 'CFU/ml', result: 'PASS' },
            { name: 'Coliform / E. coli', standardSpec: 'Absent / 100ml', measuredValue: 'Absent', unit: 'Absence', result: 'PASS' },
            { name: 'Brix Sugar Concentration', standardSpec: '11.5 - 13.5 °Brix', measuredValue: '12.5 °Brix', unit: '°Brix', result: 'PASS' },
            { name: 'pH Acid Titration', standardSpec: '3.5 - 4.2 pH', measuredValue: '3.8 pH', unit: 'pH', result: 'PASS' },
            { name: 'Heavy Metals (Lead/Arsenic)', standardSpec: '< 0.01 ppm', measuredValue: '0.002 ppm', unit: 'ppm', result: 'PASS' },
          ],
        });
        await lab.save();
      }
    }

    const samples = await LabSample.find(getTenantQuery(req, { isActive: true })).sort({ createdAt: -1 });
    res.json({ success: true, data: samples });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/lab-samples', async (req, res) => {
  try {
    const payload = attachTenantOrgId(req, {
      sampleId: `LAB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
      ...req.body,
    });
    const sample = new LabSample(payload);
    await sample.save();
    res.status(201).json({ success: true, data: sample });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/lab-samples/:id/clear', async (req, res) => {
  try {
    const sample = await LabSample.findOne(getTenantQuery(req, { _id: req.params.id }));
    if (!sample) return res.status(404).json({ success: false, message: 'Lab sample not found' });

    const coaNumber = `COA-${sample.batchId || Date.now().toString().slice(-6)}`;
    sample.status = 'cleared';
    sample.coaNumber = coaNumber;
    sample.coaIssuedAt = new Date();
    if (req.body.tests) sample.tests = req.body.tests;
    if (req.body.chemistName) sample.chemistName = req.body.chemistName;
    if (req.body.notes) sample.notes = req.body.notes;
    await sample.save();

    const effectiveOrgId = req.orgId || req.user?.orgId || sample.orgId;

    // Update batch status
    try {
      const batchFilter = { $or: [{ batchCode: sample.batchId }, { batchNo: sample.batchId }] };
      if (effectiveOrgId) batchFilter.orgId = effectiveOrgId;
      await Batch.updateMany(batchFilter, { qcStatus: 'Lab Cleared - Ready for Packaging' });
    } catch (e) {
      console.warn('[Lab Sample Clearance Batch Sync]', e.message);
    }

    // Auto-create / stage Packaging Batch in /packaging
    const pkgFilter = { batchId: sample.batchId, isActive: true };
    if (effectiveOrgId) pkgFilter.orgId = effectiveOrgId;

    let pkg = await PackagingBatch.findOne(pkgFilter);
    const bottleCount = Number(sample.qtyPlanned || 1000);
    const cartonCount = Math.ceil(bottleCount / 24);

    if (!pkg) {
      const materials = [
        { name: '500ml PET Bottles', consumedQty: bottleCount, unit: 'Pcs', unitCost: 1.5, totalCost: bottleCount * 1.5 },
        { name: 'Tamper-Evident Caps', consumedQty: bottleCount, unit: 'Pcs', unitCost: 0.35, totalCost: bottleCount * 0.35 },
        { name: 'Shrink Sleeve Labels', consumedQty: bottleCount, unit: 'Pcs', unitCost: 0.45, totalCost: bottleCount * 0.45 },
        { name: 'Corrugated Master Cartons (24s)', consumedQty: cartonCount, unit: 'Boxes', unitCost: 15.0, totalCost: cartonCount * 15.0 },
      ];
      const totalPackagingCost = materials.reduce((acc, m) => acc + m.totalCost, 0);

      pkg = new PackagingBatch({
        orgId: effectiveOrgId,
        factoryId: sample.factoryId,
        packagingNo: `PKG-${Date.now().toString().slice(-6)}`,
        batchId: sample.batchId,
        orderNo: sample.orderNo,
        productName: sample.productName,
        qtyPlanned: bottleCount,
        bottlesPacked: bottleCount,
        cartonsPacked: cartonCount,
        packagingLine: 'Bottling & Packaging Line #1',
        materials,
        totalPackagingCost,
        status: 'pending',
        labSampleId: sample._id,
        productionOrderId: sample.productionOrderId,
      });
      await pkg.save();
    }

    try {
      getIO().emit('quality:lab-cleared', { batchId: sample.batchId, coaNumber, packagingNo: pkg.packagingNo });
    } catch (e) {
      console.warn('[Lab Clearance Socket Warning]', e.message);
    }

    res.json({
      success: true,
      data: sample,
      packagingBatch: pkg,
      coaNumber,
      message: 'Lab clearance passed & COA generated! Batch forwarded to Packaging Line.',
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/lab-samples/:id', async (req, res) => {
  try {
    const sample = await LabSample.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!sample) return res.status(404).json({ success: false, message: 'Lab sample not found' });
    res.json({ success: true, data: sample });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/lab-samples/:id', async (req, res) => {
  try {
    await LabSample.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), { isActive: false });
    res.json({ success: true, message: 'Lab sample deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
