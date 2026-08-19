import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  name: { type: String, required: true },
  code: { type: String, required: true },
  type: {
    type: String,
    enum: ['raw_material', 'packaging', 'finished_good'],
    required: true,
  },
  unit: { type: String, required: true, default: 'Ltr' },
  reorderLevel: { type: Number, default: 100 },
  unitPrice: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

itemSchema.index({ orgId: 1, code: 1 });

const stockBatchSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  rackLocation: String,
  batchNo: { type: String, required: true },
  qty: { type: Number, required: true, min: 0 },
  mfgDate: Date,
  expiryDate: Date,
  costPerUnit: Number,
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  status: { type: String, enum: ['available', 'reserved', 'quarantine', 'expired', 'depleted'], default: 'available' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

stockBatchSchema.index({ orgId: 1, batchNo: 1 });

const stockMovementSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory' },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockBatch' },
  type: {
    type: String,
    enum: ['in', 'out', 'transfer', 'adjustment'],
    required: true,
  },
  qty: { type: Number, required: true },
  refType: { type: String, required: true },
  refId: { type: mongoose.Schema.Types.ObjectId },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  notes: String,
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const warehouseSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  whCode: { type: String, required: true },
  whName: { type: String, required: true },
  location: { type: String, default: '' },
  storageType: { type: String, default: 'Cold Storage (Puree & Concentrate)' },
  totalCapacity: { type: String, default: '50,000 Kg' },
  occupiedPct: { type: Number, default: 0, min: 0, max: 100 },
  racksCount: { type: Number, default: 0 },
  manager: { type: String, default: 'Warehouse Manager' },
  status: { type: String, enum: ['Optimal', 'Near Full', 'Full', 'Maintenance'], default: 'Optimal' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

warehouseSchema.index({ orgId: 1, whCode: 1 });

export const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
export const StockBatch = mongoose.models.StockBatch || mongoose.model('StockBatch', stockBatchSchema);
export const StockMovement = mongoose.models.StockMovement || mongoose.model('StockMovement', stockMovementSchema);
export const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema);
