import mongoose from 'mongoose';

const productionOrderSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  orderNo: { type: String, required: true, unique: true },
  batchId: { type: String, required: true, unique: true },
  salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  qtyPlanned: { type: Number, required: true },
  qtyProduced: { type: Number, default: 0 },
  wastageQty: { type: Number, default: 0 },
  shiftId: { type: String, default: 'Morning' },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  machineIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Machine' }],
  operatorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['planning', 'approved', 'running', 'quality_testing', 'completed', 'rejected'],
    default: 'planning',
  },
  costBreakdown: {
    materialCost: { type: Number, default: 0 },
    machineCost: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
  },
  startedAt: Date,
  completedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const productionPlanSchema = new mongoose.Schema({
  planCode: { type: String, required: true },
  productName: { type: String, required: true },
  targetDate: String,
  plannedQty: String,
  plannedShift: String,
  capacityUtilizationPct: { type: Number, default: 80 },
  status: { type: String, default: 'Planning' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const batchSchema = new mongoose.Schema({
  batchCode: { type: String, required: true },
  finishedProduct: { type: String, required: true },
  plannedQty: String,
  producedQty: String,
  yieldOutputPct: String,
  machineLine: String,
  qcStatus: { type: String, default: 'Quarantined' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const ProductionOrder = mongoose.models.ProductionOrder || mongoose.model('ProductionOrder', productionOrderSchema);
export const ProductionPlan = mongoose.models.ProductionPlan || mongoose.model('ProductionPlan', productionPlanSchema);
export const Batch = mongoose.models.Batch || mongoose.model('Batch', batchSchema);

