import { Item, StockBatch, StockMovement } from './inventory.model.js';
import { eventBus, EVENTS } from '../../common/events/eventBus.js';
import { getIO } from '../../config/socket.js';
import { getTenantQuery } from '../../common/utils/tenantScope.js';

export const inventoryService = {
  async stockIn({ orgId, factoryId, itemId, batchNo, qty, refType, refId, warehouseId, costPerUnit, supplierId, mfgDate, expiryDate }) {
    const batchFilter = { itemId, batchNo };
    if (orgId) batchFilter.orgId = orgId;

    let batch = await StockBatch.findOne(batchFilter);
    if (!batch) {
      batch = new StockBatch({
        orgId,
        factoryId,
        itemId,
        warehouseId,
        batchNo,
        qty,
        costPerUnit,
        supplierId,
        mfgDate,
        expiryDate,
        status: 'available',
      });
    } else {
      batch.qty += qty;
    }
    await batch.save();

    const movement = new StockMovement({
      orgId,
      factoryId,
      itemId,
      batchId: batch._id,
      type: 'in',
      qty,
      refType,
      refId,
      warehouseId,
    });
    await movement.save();

    eventBus.emit(EVENTS.STOCK_IN, { orgId, itemId, batchNo, qty, refType, refId });
    getIO().emit('inventory:updated', { orgId, itemId, batchNo, qty, type: 'in' });

    return { batch, movement };
  },

  async stockOut({ orgId, factoryId, itemId, qty, refType, refId }) {
    let remainingToDeduct = qty;
    const filter = { itemId, qty: { $gt: 0 }, status: 'available' };
    if (orgId) filter.orgId = orgId;

    const availableBatches = await StockBatch.find(filter).sort({ mfgDate: 1 });

    const totalAvailable = availableBatches.reduce((acc, b) => acc + b.qty, 0);
    if (totalAvailable < qty) {
      throw new Error(`Insufficient stock for item ID ${itemId}. Available: ${totalAvailable}, Requested: ${qty}`);
    }

    const deductedBatches = [];

    for (const batch of availableBatches) {
      if (remainingToDeduct <= 0) break;

      const deductAmount = Math.min(batch.qty, remainingToDeduct);
      batch.qty -= deductAmount;
      if (batch.qty === 0) {
        batch.status = 'depleted';
      }
      await batch.save();

      remainingToDeduct -= deductAmount;
      deductedBatches.push({ batchId: batch._id, batchNo: batch.batchNo, qty: deductAmount });

      const movement = new StockMovement({
        orgId,
        factoryId,
        itemId,
        batchId: batch._id,
        type: 'out',
        qty: deductAmount,
        refType,
        refId,
      });
      await movement.save();
    }

    const item = await Item.findById(itemId);
    if (item) {
      const currentStock = availableBatches.reduce((acc, b) => acc + b.qty, 0) - qty;
      if (currentStock <= item.reorderLevel) {
        eventBus.emit(EVENTS.LOW_STOCK_ALERT, { orgId, itemId, itemName: item.name, currentStock, reorderLevel: item.reorderLevel });
        getIO().emit('inventory:low-stock', { orgId, itemId, itemName: item.name, currentStock, reorderLevel: item.reorderLevel });
      }
    }

    eventBus.emit(EVENTS.STOCK_OUT, { orgId, itemId, qty, refType, refId, deductedBatches });
    return deductedBatches;
  },

  async getInventorySummary(req) {
    const itemFilter = getTenantQuery(req, { isActive: true });
    const batchFilter = getTenantQuery(req, { qty: { $gt: 0 } });

    const items = await Item.find(itemFilter);
    const batches = await StockBatch.find(batchFilter).populate('itemId');
    
    const summary = items.map((item) => {
      const itemBatches = batches.filter((b) => b.itemId && b.itemId._id.toString() === item._id.toString());
      const totalQty = itemBatches.reduce((sum, b) => sum + b.qty, 0);
      return {
        _id: item._id,
        name: item.name,
        code: item.code,
        type: item.type,
        unit: item.unit,
        reorderLevel: item.reorderLevel,
        totalQty,
        batchCount: itemBatches.length,
        isLowStock: totalQty <= item.reorderLevel,
      };
    });

    return summary;
  }
};
