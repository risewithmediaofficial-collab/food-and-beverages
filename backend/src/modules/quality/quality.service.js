import { QCCheck } from './quality.model.js';
import { ProductionOrder, ProductionPlan, Batch } from '../production/production.model.js';
import { DispatchOrder } from '../dispatch/dispatch.model.js';
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
        ? 'Approved'
        : overallResult === 'rejected'
        ? 'Rejected'
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

          const dispatchFilter = { productionOrderId: order._id, isActive: true };
          if (effectiveOrgId) dispatchFilter.orgId = effectiveOrgId;
          const existingDispatch = await DispatchOrder.findOne(dispatchFilter);

          if (!existingDispatch) {
            await DispatchOrder.create({
              orgId: effectiveOrgId || order.orgId,
              factoryId: order.factoryId,
              dispatchNo: `DSP-${Date.now().toString().slice(-6)}`,
              productionOrderId: order._id,
              salesOrderId: order.salesOrderId,
              batchId: order.batchId,
              orderNo: order.orderNo,
              qtyLoaded: `${order.qtyProduced || order.qtyPlanned} ${order.unit || 'Units'} (${order.productName})`,
              destination: 'Scheduled for distribution',
              status: 'Scheduled',
              gpsLocation: 'Awaiting vehicle assignment',
            });
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
