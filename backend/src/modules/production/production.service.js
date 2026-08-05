import { ProductionOrder } from './production.model.js';
import { recipeService } from '../recipe/recipe.service.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { generateBatchId } from '../../common/utils/generateBatchId.js';
import { eventBus, EVENTS } from '../../common/events/eventBus.js';
import { getIO } from '../../config/socket.js';
import { QCCheck } from '../quality/quality.model.js';

export const productionService = {
  async createProductionOrder({ factoryId, productId, recipeId, qtyPlanned, salesOrderId, shiftId, supervisorId, productCode = 'JUICE' }) {
    const sequence = (await ProductionOrder.countDocuments()) + 1;
    const batchId = generateBatchId('F1', productCode, new Date(), sequence);
    const orderNo = `PO-${Date.now().toString().slice(-6)}`;

    const bom = await recipeService.calculateRequirement(recipeId, qtyPlanned);

    const order = new ProductionOrder({
      factoryId,
      orderNo,
      batchId,
      salesOrderId,
      productId,
      recipeId,
      qtyPlanned,
      shiftId,
      supervisorId,
      status: 'planning',
      costBreakdown: {
        materialCost: bom.requirements.length * 1500,
        machineCost: 500,
        laborCost: 800,
        totalCost: (bom.requirements.length * 1500) + 1300,
      },
    });

    await order.save();
    eventBus.emit(EVENTS.PRODUCTION_ORDER_CREATED, { orderId: order._id, batchId, qtyPlanned });
    getIO().emit('production:order-updated', { orderId: order._id, status: order.status, batchId });

    return { order, bom };
  },

  async startProductionOrder(orderId, userId) {
    const order = await ProductionOrder.findById(orderId);
    if (!order) throw new Error('Production Order not found');

    if (order.status !== 'planning' && order.status !== 'approved') {
      throw new Error(`Cannot start production order in status: ${order.status}`);
    }

    const bom = await recipeService.calculateRequirement(order.recipeId, order.qtyPlanned);
    for (const req of bom.requirements) {
      await inventoryService.stockOut({
        factoryId: order.factoryId,
        itemId: req.itemId,
        qty: req.requiredQty,
        refType: 'ProductionOrder',
        refId: order._id,
      });
    }

    order.status = 'running';
    order.startedAt = new Date();
    await order.save();

    eventBus.emit(EVENTS.PRODUCTION_ORDER_STARTED, { orderId: order._id, batchId: order.batchId });
    getIO().emit('production:order-updated', { orderId: order._id, status: 'running', batchId: order.batchId });

    return order;
  },

  async completeProductionOrder(orderId, { qtyProduced, wastageQty = 0 }) {
    const order = await ProductionOrder.findById(orderId);
    if (!order) throw new Error('Production Order not found');

    order.qtyProduced = qtyProduced;
    order.wastageQty = wastageQty;
    order.status = 'quality_testing';
    await order.save();

    const qcCheck = new QCCheck({
      factoryId: order.factoryId,
      checkNo: `QC-${Date.now().toString().slice(-6)}`,
      refType: 'finished_goods',
      refId: order._id,
      batchId: order.batchId,
      parameters: [
        { name: 'Brix Level (°Bx)', value: 12.5, passRange: '11.5 - 13.5', result: 'pass' },
        { name: 'pH Level', value: 3.8, passRange: '3.5 - 4.2', result: 'pass' },
        { name: 'Viscosity (cP)', value: 45, passRange: '40 - 55', result: 'pass' },
        { name: 'Microbiology (CFU/ml)', value: 0, passRange: '< 10', result: 'pass' },
        { name: 'Fill Volume (ml)', value: 500, passRange: '495 - 505', result: 'pass' },
      ],
    });
    await qcCheck.save();

    eventBus.emit(EVENTS.PRODUCTION_ORDER_COMPLETED, { orderId: order._id, batchId: order.batchId, qtyProduced });
    getIO().emit('production:order-updated', { orderId: order._id, status: 'quality_testing', batchId: order.batchId });

    return { order, qcCheck };
  }
};
