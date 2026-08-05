import { QCCheck } from './quality.model.js';
import { ProductionOrder } from '../production/production.model.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { eventBus, EVENTS } from '../../common/events/eventBus.js';
import { getIO } from '../../config/socket.js';

export const qualityService = {
  async processQCDecision(qcCheckId, { overallResult, notes, userId }) {
    const qcCheck = await QCCheck.findById(qcCheckId);
    if (!qcCheck) throw new Error('QC Check not found');

    qcCheck.overallResult = overallResult;
    if (notes) qcCheck.notes = notes;
    if (userId) qcCheck.checkedBy = userId;
    await qcCheck.save();

    if (qcCheck.refType === 'finished_goods' && qcCheck.refId) {
      const order = await ProductionOrder.findById(qcCheck.refId);
      if (order) {
        if (overallResult === 'approved') {
          order.status = 'completed';
          order.completedAt = new Date();
          await order.save();

          await inventoryService.stockIn({
            factoryId: order.factoryId,
            itemId: order.productId,
            batchNo: order.batchId,
            qty: order.qtyProduced || order.qtyPlanned,
            refType: 'ProductionOrder',
            refId: order._id,
            costPerUnit: Math.round(order.costBreakdown.totalCost / (order.qtyProduced || 1)),
            mfgDate: new Date(),
            expiryDate: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)),
          });
        } else if (overallResult === 'rework') {
          order.status = 'running';
          await order.save();
        } else if (overallResult === 'rejected') {
          order.status = 'rejected';
          await order.save();
        }

        getIO().emit('production:order-updated', { orderId: order._id, status: order.status, batchId: order.batchId });
      }
    }

    eventBus.emit(EVENTS.QC_COMPLETED, { qcCheckId: qcCheck._id, batchId: qcCheck.batchId, overallResult });
    getIO().emit('qc:batch-result', { batchId: qcCheck.batchId, result: overallResult });

    return qcCheck;
  }
};
