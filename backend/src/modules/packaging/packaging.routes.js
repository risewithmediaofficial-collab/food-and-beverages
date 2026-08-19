import express from 'express';
import { PackagingBatch } from './packaging.model.js';
import { DispatchOrder } from '../dispatch/dispatch.model.js';
import { LabSample } from '../quality/quality.model.js';
import { ProductionOrder } from '../production/production.model.js';
import { getTenantQuery, attachTenantOrgId } from '../../common/utils/tenantScope.js';
import { getIO } from '../../config/socket.js';

const router = express.Router();

// GET all packaging batches & queues
router.get('/batches', async (req, res) => {
  try {
    const effectiveOrgId = req.orgId || req.user?.orgId;
    
    // Auto-reconcile any cleared lab samples that need packaging batches
    const clearedLabSamples = await LabSample.find(getTenantQuery(req, { status: 'cleared', isActive: true }));
    for (const sample of clearedLabSamples) {
      const pkgFilter = { batchId: sample.batchId, isActive: true };
      if (effectiveOrgId) pkgFilter.orgId = effectiveOrgId;

      let pkg = await PackagingBatch.findOne(pkgFilter);
      if (!pkg) {
        const bottleCount = Number(sample.qtyPlanned || 1000);
        const cartonCount = Math.ceil(bottleCount / 24);
        const materials = [
          { name: '500ml PET Bottles', consumedQty: bottleCount, unit: 'Pcs', unitCost: 1.5, totalCost: bottleCount * 1.5 },
          { name: 'Tamper-Evident Caps', consumedQty: bottleCount, unit: 'Pcs', unitCost: 0.35, totalCost: bottleCount * 0.35 },
          { name: 'Shrink Sleeve Labels', consumedQty: bottleCount, unit: 'Pcs', unitCost: 0.45, totalCost: bottleCount * 0.45 },
          { name: 'Corrugated Master Cartons (24s)', consumedQty: cartonCount, unit: 'Boxes', unitCost: 15.0, totalCost: cartonCount * 15.0 },
        ];
        const totalPackagingCost = materials.reduce((acc, m) => acc + m.totalCost, 0);

        pkg = new PackagingBatch({
          orgId: effectiveOrgId || sample.orgId,
          factoryId: sample.factoryId,
          packagingNo: `PKG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
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
    }

    const batches = await PackagingBatch.find(getTenantQuery(req, { isActive: true })).sort({ createdAt: -1 });
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create packaging batch
router.post('/batches', async (req, res) => {
  try {
    const payload = attachTenantOrgId(req, {
      packagingNo: `PKG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
      ...req.body,
    });
    const batch = new PackagingBatch(payload);
    await batch.save();
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST complete packaging & send to dispatch
router.post('/batches/:id/complete', async (req, res) => {
  try {
    const pkg = await PackagingBatch.findOne(getTenantQuery(req, { _id: req.params.id }));
    if (!pkg) return res.status(404).json({ success: false, message: 'Packaging batch not found' });

    pkg.status = 'completed';
    pkg.packagedAt = new Date();
    if (req.body.bottlesPacked) pkg.bottlesPacked = Number(req.body.bottlesPacked);
    if (req.body.cartonsPacked) pkg.cartonsPacked = Number(req.body.cartonsPacked);
    if (req.body.materials) pkg.materials = req.body.materials;
    await pkg.save();

    const effectiveOrgId = req.orgId || req.user?.orgId || pkg.orgId;

    // Auto-create / stage Dispatch Order in /dispatch
    const dispatchFilter = {
      $or: [{ batchId: pkg.batchId }, { orderNo: pkg.orderNo }],
      isActive: true,
    };
    if (effectiveOrgId) dispatchFilter.orgId = effectiveOrgId;

    let dispatch = await DispatchOrder.findOne(dispatchFilter);
    const bottleQty = pkg.bottlesPacked || pkg.qtyPlanned || 1000;
    const cartonQty = pkg.cartonsPacked || Math.ceil(bottleQty / 24);

    if (!dispatch) {
      dispatch = new DispatchOrder({
        orgId: effectiveOrgId,
        factoryId: pkg.factoryId,
        dispatchNo: `DSP-${Date.now().toString().slice(-6)}`,
        batchId: pkg.batchId,
        orderNo: pkg.orderNo || `ORD-${Date.now().toString().slice(-4)}`,
        productionOrderId: pkg.productionOrderId,
        qtyLoaded: `${bottleQty} Bottles (${cartonQty} Master Cartons) - ${pkg.productName}`,
        destination: 'Scheduled for distribution warehouse',
        vehicleNo: 'MH-15-EG-4521',
        driverName: 'Ramesh Patil',
        status: 'Scheduled',
        gpsLocation: 'Packaging Bay #3 (Ready for Loading)',
      });
      await dispatch.save();
    } else {
      dispatch.qtyLoaded = `${bottleQty} Bottles (${cartonQty} Master Cartons) - ${pkg.productName}`;
      dispatch.status = 'Scheduled';
      await dispatch.save();
    }

    try {
      getIO().emit('packaging:completed', { batchId: pkg.batchId, dispatchNo: dispatch.dispatchNo });
    } catch (e) {
      console.warn('[Packaging Socket Warning]', e.message);
    }

    res.json({ success: true, data: pkg, dispatchOrder: dispatch, message: 'Packaging complete! Batch sent to Dispatch & Delivery.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update packaging batch
router.put('/batches/:id', async (req, res) => {
  try {
    const pkg = await PackagingBatch.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), req.body, { new: true });
    if (!pkg) return res.status(404).json({ success: false, message: 'Packaging batch not found' });
    res.json({ success: true, data: pkg });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE packaging batch
router.delete('/batches/:id', async (req, res) => {
  try {
    await PackagingBatch.findOneAndUpdate(getTenantQuery(req, { _id: req.params.id }), { isActive: false });
    res.json({ success: true, message: 'Packaging record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
