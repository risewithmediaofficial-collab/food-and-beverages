import { ProductionOrder, ProductionPlan, Batch } from './production.model.js';
import { recipeService } from '../recipe/recipe.service.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { generateBatchId } from '../../common/utils/generateBatchId.js';
import { eventBus, EVENTS } from '../../common/events/eventBus.js';
import { getIO } from '../../config/socket.js';
import { QCCheck } from '../quality/quality.model.js';

export const productionService = {
  async createProductionOrder({ factoryId, productId, recipeId, productionPlanId, qtyPlanned, productName = 'Juice Bottle (500ml)', unit = 'Bottles', batchId: customBatchId, salesOrderId, shiftId = 'Morning', supervisorId, productCode = 'JUICE' }) {
    const sequence = (await ProductionOrder.countDocuments()) + 1;
    const batchId = customBatchId || generateBatchId('F1', productCode, new Date(), sequence);
    const orderNo = `PO-${Date.now().toString().slice(-6)}`;

    let bom = { requirements: [] };
    try {
      if (recipeId) {
        bom = await recipeService.calculateRequirement(recipeId, qtyPlanned);
      }
    } catch (e) {
      console.warn('[ProductionService Warning] Recipe calculation bypassed:', e.message);
    }

    const materialCost = (bom.requirements?.length || 2) * 1500;
    const order = new ProductionOrder({
      factoryId,
      orderNo,
      batchId,
      productName,
      unit,
      salesOrderId,
      productId,
      productionPlanId,
      recipeId,
      qtyPlanned: Number(qtyPlanned || 1000),
      shiftId,
      supervisorId,
      status: 'planning',
      costBreakdown: {
        materialCost,
        machineCost: 500,
        laborCost: 800,
        totalCost: materialCost + 1300,
      },
    });

    await order.save();
    try {
      eventBus.emit(EVENTS.PRODUCTION_ORDER_CREATED, { orderId: order._id, batchId, qtyPlanned });
      getIO().emit('production:order-updated', { orderId: order._id, status: order.status, batchId });
    } catch (e) {
      console.warn('[ProductionService Socket Warning] Could not broadcast event:', e.message);
    }

    return order;
  },

  async createProductionPlan(payload) {
    const plan = new ProductionPlan(payload);
    await plan.save();

    return this.routeProductionPlanToOrder(plan);
  },

  async routeProductionPlanToOrder(plan) {
    const statusLower = String(plan.status || '').toLowerCase();
    const shouldRouteToProduction = ['approved', 'completed', 'in progress', 'routed to production', 'in quality testing'].includes(statusLower);
    if (!shouldRouteToProduction) {
      return { plan, productionOrder: null };
    }

    let productionOrder = null;
    if (plan.routedProductionOrderId) {
      productionOrder = await ProductionOrder.findById(plan.routedProductionOrderId);
    }

    if (!productionOrder) {
      productionOrder = await ProductionOrder.findOne({ productionPlanId: plan._id, isActive: true });
    }

    if (!productionOrder) {
      productionOrder = await this.createProductionOrder({
        factoryId: plan.factoryId,
        productionPlanId: plan._id,
        productName: plan.productName,
        qtyPlanned: plan.targetQty || Number(String(plan.plannedQty || '').replace(/[^0-9.]/g, '')) || 1000,
        unit: plan.unit || 'Bottles',
        shiftId: String(plan.shift || plan.plannedShift || 'Morning').includes('Night')
          ? 'Night'
          : String(plan.shift || plan.plannedShift || 'Morning').includes('Evening')
          ? 'Evening'
          : 'Morning',
      });
    }

    plan.routedProductionOrderId = productionOrder._id;

    // If plan is completed or marked in quality testing, auto-complete order to generate QC check
    if (['completed', 'in quality testing'].includes(statusLower)) {
      if (productionOrder.status !== 'completed' && productionOrder.status !== 'quality_testing') {
        const completedResult = await this.completeProductionOrder(productionOrder._id, {
          qtyProduced: productionOrder.qtyPlanned || plan.targetQty || 1000,
        });
        productionOrder = completedResult.order;
      }
      plan.status = 'In Quality Testing';
    } else if (plan.status === 'Approved') {
      plan.status = 'Routed to Production';
    }

    await plan.save();

    return { plan, productionOrder };
  },

  async completeProductionPlan(planId) {
    const plan = await ProductionPlan.findById(planId);
    if (!plan) throw new Error('Production Plan not found');

    plan.status = 'In Quality Testing';
    await plan.save();

    return this.routeProductionPlanToOrder(plan);
  },

  async startProductionOrder(orderId, userId) {
    const order = await ProductionOrder.findById(orderId);
    if (!order) throw new Error('Production Order not found');

    if (order.status !== 'planning' && order.status !== 'approved') {
      throw new Error(`Cannot start production order in status: ${order.status}`);
    }

    let bom = { requirements: [] };
    if (order.recipeId) {
      bom = await recipeService.calculateRequirement(order.recipeId, order.qtyPlanned);
    }
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

    order.qtyProduced = Number(qtyProduced || order.qtyPlanned || 1000);
    order.wastageQty = Number(wastageQty || 0);
    order.status = 'quality_testing';
    await order.save();

    // Auto-create / update Batch in Batch Management
    try {
      let batch = await Batch.findOne({
        $or: [{ batchCode: order.batchId }, { batchNo: order.batchId }],
        isActive: true,
      });

      const yieldPercent = Math.min(100, Math.round(((order.qtyProduced) / (order.qtyPlanned || 1)) * 100 * 10) / 10);

      if (!batch) {
        batch = new Batch({
          batchNo: order.batchId,
          batchCode: order.batchId,
          productName: order.productName,
          finishedProduct: order.productName,
          plannedQty: order.qtyPlanned,
          producedQty: order.qtyProduced,
          yieldPct: yieldPercent,
          yieldOutputPct: `${yieldPercent}%`,
          lineCode: 'MAC-FIL-01',
          machineLine: 'MAC-FIL-01',
          qcStatus: 'Quarantined - Waiting for Quality Check',
        });
        await batch.save();
      } else {
        batch.producedQty = order.qtyProduced;
        batch.yieldPct = yieldPercent;
        batch.yieldOutputPct = `${yieldPercent}%`;
        batch.qcStatus = 'Quarantined - Waiting for Quality Check';
        await batch.save();
      }
    } catch (e) {
      console.warn('[ProductionService] Could not sync Batch record:', e.message);
    }

    // Auto-create / update QCCheck for Quality Control
    let qcCheck = await QCCheck.findOne({
      $or: [
        { refType: 'finished_goods', refId: order._id, isActive: true },
        { batchId: order.batchId, isActive: true },
      ],
    });

    if (!qcCheck) {
      qcCheck = new QCCheck({
        factoryId: order.factoryId,
        checkNo: `QC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        refType: 'finished_goods',
        refId: order._id,
        batchId: order.batchId,
        productName: order.productName,
        orderNo: order.orderNo,
        qtyTested: order.qtyProduced,
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
      await qcCheck.save();
    } else {
      qcCheck.productName = order.productName;
      qcCheck.orderNo = order.orderNo;
      qcCheck.qtyTested = order.qtyProduced;
      qcCheck.unit = order.unit || 'Bottles';
      qcCheck.refId = order._id;
      await qcCheck.save();
    }

    eventBus.emit(EVENTS.PRODUCTION_ORDER_COMPLETED, { orderId: order._id, batchId: order.batchId, qtyProduced: order.qtyProduced });
    getIO().emit('production:order-updated', { orderId: order._id, status: 'quality_testing', batchId: order.batchId });

    return { order, qcCheck };
  }
};
