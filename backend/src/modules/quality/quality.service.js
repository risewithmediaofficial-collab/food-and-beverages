import { QCCheck, LabSample } from './quality.model.js';
import { ProductionOrder, ProductionPlan, Batch } from '../production/production.model.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { eventBus, EVENTS } from '../../common/events/eventBus.js';
import { getIO } from '../../config/socket.js';

export const qualityService = {
  async processQCDecision(qcCheckId, { overallResult, notes, userId, parameters, orgId }) {
    const qcCheck = await QCCheck.findById(qcCheckId);
    if (!qcCheck) throw new Error('QC Check not found');

    const effectiveOrgId = orgId || qcCheck.orgId;
    qcCheck.overallResult = overallResult;
    if (notes) qcCheck.notes = notes;
    if (userId) qcCheck.checkedBy = userId;
    if (parameters && Array.isArray(parameters)) qcCheck.parameters = parameters;
    await qcCheck.save();

    // Synchronize Batch record
    try {
      const batchStatus = overallResult === 'approved'
        ? 'QC Approved - Sent to Lab Testing'
        : overallResult === 'rejected'
        ? 'QC Rejected'
        : overallResult === 'rework'
        ? 'Rework / Quarantined'
        : 'Quarantined';

      const batchFilter = { $or: [{ batchCode: qcCheck.batchId }, { batchNo: qcCheck.batchId }] };
      if (effectiveOrgId) batchFilter.orgId = effectiveOrgId;

      await Batch.updateMany(batchFilter, { qcStatus: batchStatus });
    } catch (e) {
      console.warn('[QualityService] Could not update Batch record:', e.message);
    }

    if (qcCheck.refType === 'finished_goods' && qcCheck.refId) {
      const order = await ProductionOrder.findById(qcCheck.refId);
      if (order) {
        if (overallResult === 'approved') {
          order.status = 'completed';
          order.completedAt = new Date();
          await order.save();

          // Sync linked Production Plan if any
          if (order.productionPlanId) {
            await ProductionPlan.findByIdAndUpdate(order.productionPlanId, { status: 'Completed' });
          }

          await inventoryService.stockIn({
            orgId: effectiveOrgId || order.orgId,
            factoryId: order.factoryId,
            itemId: order.productId,
            batchNo: order.batchId,
            qty: order.qtyProduced || order.qtyPlanned,
            refType: 'ProductionOrder',
            refId: order._id,
            costPerUnit: Math.round((order.costBreakdown?.totalCost || 2800) / (order.qtyProduced || 1)),
            mfgDate: new Date(),
            expiryDate: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)),
          });

          // Auto-create / stage Lab Sample in Laboratory & COA module
          const labFilter = { batchId: order.batchId, isActive: true };
          if (effectiveOrgId) labFilter.orgId = effectiveOrgId;

          let labSample = await LabSample.findOne(labFilter);
          if (!labSample) {
            labSample = new LabSample({
              orgId: effectiveOrgId || order.orgId,
              factoryId: order.factoryId,
              sampleId: `LAB-${Date.now().toString().slice(-6)}`,
              batchId: order.batchId,
              orderNo: order.orderNo,
              productName: order.productName,
              qtyPlanned: order.qtyProduced || order.qtyPlanned || 1000,
              unit: order.unit || 'Bottles',
              chemistName: 'QC Chemist / Microbiologist',
              status: 'pending',
              qcCheckId: qcCheck._id,
              productionOrderId: order._id,
              tests: [
                { name: 'Total Plate Count (TPC)', standardSpec: '< 10 CFU/ml', measuredValue: '< 1 CFU/ml', unit: 'CFU/ml', result: 'PASS' },
                { name: 'Yeast & Mold Count', standardSpec: '< 5 CFU/ml', measuredValue: '0 CFU/ml', unit: 'CFU/ml', result: 'PASS' },
                { name: 'Coliform / E. coli', standardSpec: 'Absent / 100ml', measuredValue: 'Absent', unit: 'Absence', result: 'PASS' },
                { name: 'Brix Sugar Concentration', standardSpec: '11.5 - 13.5 °Brix', measuredValue: '12.5 °Brix', unit: '°Brix', result: 'PASS' },
                { name: 'pH Acid Titration', standardSpec: '3.5 - 4.2 pH', measuredValue: '3.8 pH', unit: 'pH', result: 'PASS' },
                { name: 'Heavy Metals (Lead/Arsenic)', standardSpec: '< 0.01 ppm', measuredValue: '0.002 ppm', unit: 'ppm', result: 'PASS' },
              ],
            });
            await labSample.save();
          }

          try {
            getIO().emit('quality:lab-sample-created', { sampleId: labSample.sampleId, batchId: order.batchId });
          } catch (e) {
            console.warn('[Quality Socket Warning]', e.message);
          }
        } else if (overallResult === 'rework') {
          order.status = 'running';
          await order.save();
          if (order.productionPlanId) {
            await ProductionPlan.findByIdAndUpdate(order.productionPlanId, { status: 'In Progress' });
          }
        } else if (overallResult === 'rejected') {
          order.status = 'rejected';
          await order.save();
          if (order.productionPlanId) {
            await ProductionPlan.findByIdAndUpdate(order.productionPlanId, { status: 'Rejected' });
          }
        }

        getIO().emit('production:order-updated', { orgId: effectiveOrgId, orderId: order._id, status: order.status, batchId: order.batchId });
      }
    }

    eventBus.emit(EVENTS.QC_COMPLETED, { orgId: effectiveOrgId, qcCheckId: qcCheck._id, batchId: qcCheck.batchId, overallResult });
    getIO().emit('qc:batch-result', { orgId: effectiveOrgId, batchId: qcCheck.batchId, result: overallResult });

    return qcCheck;
  }
};
