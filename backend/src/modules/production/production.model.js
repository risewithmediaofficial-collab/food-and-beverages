import mongoose from 'mongoose';

const productionOrderSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  orderNo: { type: String, required: true, unique: true },
  batchId: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  qtyPlanned: { type: Number, required: true },
  qtyProduced: { type: Number, default: 0 },
  wastageQty: { type: Number, default: 0 },
  unit: { type: String, default: 'Bottles' },
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
  targetQty: Number,
  unit: String,
  shift: String,
  targetDate: String,
  plannedQty: String,
  plannedShift: String,
  capacityPct: Number,
  capacityUtilizationPct: { type: Number, default: 80 },
  status: { type: String, default: 'Planning' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const batchSchema = new mongoose.Schema({
  batchNo: String,
  batchCode: { type: String, required: true },
  productName: String,
  finishedProduct: { type: String, required: true },
  plannedQty: mongoose.Schema.Types.Mixed,
  producedQty: mongoose.Schema.Types.Mixed,
  yieldPct: Number,
  yieldOutputPct: String,
  lineCode: String,
  machineLine: String,
  qcStatus: { type: String, default: 'Quarantined' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const ProductionOrder = mongoose.models.ProductionOrder || mongoose.model('ProductionOrder', productionOrderSchema);
export const ProductionPlan = mongoose.models.ProductionPlan || mongoose.model('ProductionPlan', productionPlanSchema);
export const Batch = mongoose.models.Batch || mongoose.model('Batch', batchSchema);

